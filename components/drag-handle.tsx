"use client";

import * as React from "react";
import { ChevronsUpDownIcon } from "lucide-react";
import { cn } from "@peckey954/ui/lib/utils";

/* ------------------------------------------------------------------
   ปุ่มลากจัดลำดับ

   ปุ่มเดียวลากขึ้นลงได้เลย แทนปุ่มลูกศรขึ้นกับลงสองปุ่ม
   ย้ายจากข้อ 8 ไปข้อ 2 ด้วยปุ่มลูกศรคือกดหกครั้ง ลากทีเดียวจบ

   ใช้ pointer event ไม่ใช่ HTML5 drag and drop
   เพราะ drag and drop ใช้กับนิ้วไม่ได้ และคนตั้งฟอร์มก็นั่งทำบนแท็บเล็ต

   ยังกดลูกศรขึ้น/ลงบนคีย์บอร์ดได้เหมือนเดิมตอนโฟกัสอยู่ที่ปุ่มนี้
   ปุ่มที่ลากได้อย่างเดียวคือปุ่มที่คนใช้คีย์บอร์ดใช้ไม่ได้เลย

   วิธีคิดตำแหน่ง — ลากได้ระยะหนึ่งช่วงก็ขยับหนึ่งขั้น แล้วเริ่มนับระยะใหม่
   ไม่ได้ใช้ "เลยกึ่งกลางของใบข้างเคียงแล้วค่อยสลับ" แบบที่ลากรูปในแกลเลอรี
   เพราะการ์ดหัวข้อสูงห้าร้อยพิกเซล กว่าจะเลยกึ่งกลางใบถัดไปคือลากพ้นจอไปแล้ว
   นับเป็นระยะแทน ลากลงสี่สิบพิกเซลได้หนึ่งขั้น ย้ายหกขั้นก็ลากสองร้อยสี่สิบ
   อยู่ในระยะที่นิ้วเดียวลากรวดเดียวถึงทั้งบนมือถือและเดสก์ท็อป

   รายการสลับตำแหน่งจริงระหว่างลาก ไม่ใช่รอปล่อยนิ้วก่อน
   จึงเห็นผลของทุกขั้นทันที ถ้าเลยไปก็ลากย้อนกลับได้เลย
------------------------------------------------------------------ */

/** ทำเครื่องหมายว่าอะไรคือ "หนึ่งใบ" ที่ลากสลับกันได้ ใช้หาใบข้างเคียงตอนลาก */
export const DRAG_ITEM_ATTR = "data-drag-item";

export function DragHandle({
  label,
  disabled,
  onMove,
  className,
}: {
  /** ชื่อของสิ่งที่กำลังจัดลำดับ ใช้ในป้ายสำหรับโปรแกรมอ่านหน้าจอ */
  label: string;
  disabled?: boolean;
  onMove: (dir: -1 | 1) => void;
  className?: string;
}) {
  const ref = React.useRef<HTMLButtonElement>(null);
  const [dragging, setDragging] = React.useState(false);
  // เบราว์เซอร์ยิง pointermove ถี่กว่าที่ React จะวาดใหม่ทัน
  // ไม่ล็อกไว้จะสั่งสลับซ้ำจากตำแหน่งเก่า แล้วการ์ดจะกระโดดข้ามไปสองใบ
  const busy = React.useRef(false);

  // ตัวจับระยะล่าสุด ใช้ตอนฟังอีเวนต์จากหน้าต่างซึ่งผูกไว้รอบเดียว
  const stepRef = React.useRef<(y: number) => void>(() => {});

  /** การ์ดที่ปุ่มนี้อยู่ข้างใน */
  const card = () => ref.current?.closest(`[${DRAG_ITEM_ATTR}]`) ?? null;

  /** ระยะที่ต้องลากต่อการขยับหนึ่งขั้น */
  const STEP = 40;
  /** จุดตั้งต้นของการนับระยะ ขยับหนึ่งขั้นแล้วเลื่อนตามไปหนึ่งช่วง */
  const anchor = React.useRef(0);

  /** ยังมีใบให้สลับด้วยในทิศนั้นหรือเปล่า — สุดขอบแล้วอย่านับระยะสะสมต่อ */
  const canMove = (dir: -1 | 1) => {
    const me = card();
    if (!me) return false;
    // ดูเฉพาะใบที่อยู่ในกองเดียวกัน หัวข้อย่อยจะได้ไม่หลุดออกไปเป็นหัวข้อหลัก
    const siblings = [
      ...(me.parentElement?.querySelectorAll(`:scope > [${DRAG_ITEM_ATTR}]`) ??
        []),
    ];
    const i = siblings.indexOf(me);
    return i >= 0 && !!siblings[i + dir];
  };

  const step = (y: number) => {
    if (busy.current) return;
    const dist = y - anchor.current;
    const dir: -1 | 1 = dist < 0 ? -1 : 1;
    if (Math.abs(dist) < STEP) return;

    // สุดขอบแล้ว ตรึงจุดตั้งต้นไว้ที่นิ้ว ลากย้อนกลับมาจะได้ขยับทันทีไม่ต้องรอสะสม
    if (!canMove(dir)) {
      anchor.current = y;
      return;
    }
    anchor.current += dir * STEP;
    busy.current = true;
    onMove(dir);
  };

  // เอฟเฟกต์ที่ไม่มี dep วิ่งทุกรอบที่วาด — วาดใหม่เสร็จค่อยรับคำสั่งถัดไป
  // และอัปเดตตัวจับระยะให้เห็นตำแหน่งล่าสุดของการ์ดเสมอ
  React.useEffect(() => {
    stepRef.current = step;
    busy.current = false;
  });

  /**
   * ฟังอีเวนต์ที่หน้าต่าง ไม่ใช่ setPointerCapture ที่ปุ่ม
   *
   * พอสลับลำดับ React จะย้ายโหนดของการ์ดในต้นไม้ DOM
   * ปุ่มที่ถูกย้ายจะหลุด pointer capture ทันที ขั้นแรกจึงผ่านแต่ขั้นต่อไปเงียบ
   * ผูกไว้ที่หน้าต่างแทน ย้ายกี่รอบก็ยังได้ยินอยู่
   */
  React.useEffect(() => {
    if (!dragging) return;
    const move = (e: PointerEvent) => stepRef.current(e.clientY);
    const end = () => {
      setDragging(false);
      busy.current = false;
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
    };
  }, [dragging]);

  return (
    <button
      ref={ref}
      type="button"
      disabled={disabled}
      aria-label={`จัดลำดับ${label} — ลากขึ้นลง หรือกดลูกศรขึ้น/ลง`}
      title="ลากเพื่อจัดลำดับ"
      // ปิดการเลื่อนหน้าจอด้วยนิ้วบนปุ่มนี้ ไม่งั้นลากแล้วหน้าเลื่อนตามแทนที่จะย้ายการ์ด
      className={cn(
        "flex size-8 shrink-0 touch-none items-center justify-center rounded-md",
        "text-muted-foreground transition-colors",
        "hover:bg-accent-hover hover:text-foreground",
        "focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
        "disabled:pointer-events-none disabled:opacity-50",
        dragging ? "cursor-grabbing bg-brand text-primary" : "cursor-grab",
        className
      )}
      onPointerDown={(e) => {
        if (e.pointerType === "mouse" && e.button !== 0) return;
        anchor.current = e.clientY;
        setDragging(true);
      }}
      onKeyDown={(e) => {
        if (e.key === "ArrowUp") {
          e.preventDefault();
          onMove(-1);
        }
        if (e.key === "ArrowDown") {
          e.preventDefault();
          onMove(1);
        }
      }}
    >
      <ChevronsUpDownIcon className="size-4" />
    </button>
  );
}
