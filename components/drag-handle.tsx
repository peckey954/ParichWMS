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

   ของเดิมสลับลำดับใน state แล้ว React แค่วาดการ์ดใหม่ที่ตำแหน่งที่ถูกต้องทันที
   ไม่มีการเคลื่อนไหวคั่นกลาง เลยดูเหมือนการ์ดกระโดดเอง/เลื่อนออโต้ ไม่เหมือนถูกลาก
   ตอนนี้เลยทำสองอย่างเพิ่ม โดยขยับ DOM ตรง ๆ ผ่าน ref ไม่ผ่าน React state
   (ให้ลื่นทันมือ ไม่รอ re-render) แล้วค่อยล้างสไตล์อินไลน์ทิ้งตอนจบ:

   1. ใบที่กำลังลาก — ขยับตามนิ้ว/เมาส์ตรง ๆ ด้วย translateY เท่ากับระยะที่ลากจริง
      พร้อมเงาและขยายเล็กน้อยให้ดูลอยขึ้นมา เหมือนถูกหยิบขึ้นจริง ๆ
      อ้างอิงจาก anchor.current ที่ขยับตามทุกครั้งที่สลับขั้น ระยะที่แสดงจึงต่อเนื่อง
      ไม่กระตุกตรงจังหวะที่สลับลำดับจริงพอดี
   2. ใบข้างเคียงที่โดนสลับตำแหน่ง — ใช้ FLIP (จำตำแหน่งเดิมก่อนสลับ วัดตำแหน่งใหม่
      หลังสลับ แล้วเล่นย้อนจากเดิมไปตำแหน่งจริงด้วย transition) ให้เห็นว่ามันเลื่อน
      ไปแทนที่ ไม่ใช่โผล่มาที่ตำแหน่งใหม่เฉย ๆ
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
  const card = () => ref.current?.closest<HTMLElement>(`[${DRAG_ITEM_ATTR}]`) ?? null;

  /** ใบพี่น้องที่อยู่กองเดียวกัน (ไม่รวมหัวข้อย่อยที่ซ้อนอยู่ข้างใน) */
  const siblingsOf = (el: HTMLElement) => [
    ...(el.parentElement?.querySelectorAll<HTMLElement>(
      `:scope > [${DRAG_ITEM_ATTR}]`
    ) ?? []),
  ];

  /** ยกใบที่กำลังลากขึ้นมาลอย — เงา ลอยเหนือใบอื่น (transform เป็นหน้าที่ของ followPointer/settleCard) */
  const liftCard = (el: HTMLElement) => {
    el.style.position = "relative";
    el.style.zIndex = "20";
    el.style.boxShadow = "0 12px 24px -8px rgb(0 0 0 / 0.25)";
  };

  /** ขยับใบที่ลากตามนิ้ว/เมาส์ตรง ๆ — เห็นว่าถูกหยิบขึ้นมาเลื่อนจริง ไม่ใช่สลับเฉย ๆ */
  const followPointer = (el: HTMLElement, y: number) => {
    el.style.transition = "none";
    el.style.transform = `translateY(${y - anchor.current}px) scale(1.01)`;
  };

  /** ปล่อยใบที่ลากคืนตำแหน่งเดิมแบบมีจังหวะ (settle) แทนหายวับไปทันที */
  const settleCard = (el: HTMLElement) => {
    el.style.transition = "transform 180ms ease, box-shadow 180ms ease";
    el.style.transform = "";
    el.style.boxShadow = "";
    window.setTimeout(() => {
      el.style.transition = "";
      el.style.zIndex = "";
      el.style.position = "";
    }, 200);
  };

  /**
   * FLIP ใบข้างเคียงที่โดนสลับตำแหน่ง — จำตำแหน่งเดิมของทุกใบไว้ก่อนสั่งสลับ
   * (First) แล้ววัดตำแหน่งจริงหลังสลับอีกที (Last) ย้อนกลับไปวางที่ตำแหน่งเดิม
   * ด้วย transform แล้วค่อย transition กลับมา 0 (Invert → Play) ใบที่ไม่ได้ขยับ
   * เดลต้าเป็นศูนย์อยู่แล้วไม่ต้องทำอะไร ใบที่ถูกลาก (me) ไม่ต้องแตะเพราะมันมีของ
   * มันเองจาก followPointer อยู่แล้ว
   */
  const flipSiblings = (me: HTMLElement, before: Map<HTMLElement, DOMRect>) => {
    requestAnimationFrame(() => {
      before.forEach((firstRect, el) => {
        if (el === me || !el.isConnected) return;
        const lastRect = el.getBoundingClientRect();
        const dy = firstRect.top - lastRect.top;
        if (Math.abs(dy) < 1) return;
        el.style.transition = "none";
        el.style.transform = `translateY(${dy}px)`;
        // บังคับให้เบราว์เซอร์คำนวณสไตล์ก่อนเปลี่ยนอีกที ไม่งั้นสอง transform รวมกันแล้วข้ามขั้น "จาก" ไปเลย
        el.getBoundingClientRect();
        el.style.transition = "transform 180ms ease";
        el.style.transform = "";
        window.setTimeout(() => {
          el.style.transition = "";
        }, 200);
      });
    });
  };

  /** ระยะที่ต้องลากต่อการขยับหนึ่งขั้น */
  const STEP = 40;
  /** จุดตั้งต้นของการนับระยะ ขยับหนึ่งขั้นแล้วเลื่อนตามไปหนึ่งช่วง */
  const anchor = React.useRef(0);

  /** ยังมีใบให้สลับด้วยในทิศนั้นหรือเปล่า — สุดขอบแล้วอย่านับระยะสะสมต่อ */
  const canMove = (dir: -1 | 1) => {
    const me = card();
    if (!me) return false;
    const siblings = siblingsOf(me);
    const i = siblings.indexOf(me);
    return i >= 0 && !!siblings[i + dir];
  };

  const step = (y: number) => {
    const me = card();
    if (me) followPointer(me, y);

    if (busy.current) return;
    const dist = y - anchor.current;
    const dir: -1 | 1 = dist < 0 ? -1 : 1;
    if (Math.abs(dist) < STEP) return;

    // สุดขอบแล้ว ตรึงจุดตั้งต้นไว้ที่นิ้ว ลากย้อนกลับมาจะได้ขยับทันทีไม่ต้องรอสะสม
    if (!canMove(dir)) {
      anchor.current = y;
      return;
    }

    // จำตำแหน่งของทุกใบไว้ก่อนสั่งสลับ เอาไปเล่น FLIP ตอนใบข้างเคียงถูกดันตำแหน่ง
    const before = me
      ? new Map(siblingsOf(me).map((el) => [el, el.getBoundingClientRect()]))
      : null;

    anchor.current += dir * STEP;
    busy.current = true;
    onMove(dir);

    if (me && before) flipSiblings(me, before);
  };

  /** เริ่มลาก — ตั้งจุดตั้งต้นนับระยะใหม่ที่นิ้ว/เมาส์ตอนกดลง แล้วยกการ์ดขึ้นมาลอย
   *  อยู่ก่อน useEffect ทั้งสองตัวด้านล่างเสมอ (ตำแหน่งในซอร์สมีผลกับตัวตรวจ
   *  ของ react-compiler ที่ตามรอยว่า ref ตัวไหนถูก "effect" อ่าน/เขียนไปแล้ว) */
  const startDrag = (y: number) => {
    anchor.current = y;
    setDragging(true);
    const me = card();
    if (me) liftCard(me);
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
      const me = card();
      if (me) settleCard(me);
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
        startDrag(e.clientY);
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
