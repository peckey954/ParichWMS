"use client";

import * as React from "react";
import { ArrowUpIcon } from "lucide-react";
import { Button } from "@peckey954/ui/components/ui/button";
import { cn } from "@peckey954/ui/lib/utils";
import { useDevicePreview, useScrollState } from "@/components/device-preview";

/* ------------------------------------------------------------------
   แถบเครื่องมือที่ล็อกติดบนตลอด (ชิป + ช่องค้นหา)

   รายการยาว ๆ ที่มีชิปกับช่องค้นหา ถ้าเครื่องมืออยู่บนสุดอย่างเดียว
   เลื่อนลงไปแล้วจะเปลี่ยนตัวกรองไม่ได้ ต้องเลื่อนกลับขึ้นไปทั้งหน้า
   จึงล็อกไว้บนด้วย sticky แล้วปล่อยให้มีแค่เนื้อหาข้างล่างเลื่อนแทน

   เคยลองซ่อนแถบนี้ตอนเลื่อนลง (แล้วเลื่อนขึ้นค่อยเอากลับมา) แต่บนมือถือจริง
   มันชนกับแถบที่อยู่บนสุดของเบราว์เซอร์เองที่โผล่/หุบตามการเลื่อนเหมือนกัน
   ผลคือแถบดูเหมือนกระตุกเด้งกลับ เลยตัดออก ให้ล็อกอยู่บนตลอดแบบเดียว
------------------------------------------------------------------ */

export function StickyToolbar({
  barRef,
  className,
  children,
}: {
  barRef?: React.RefObject<HTMLDivElement | null>;
  className?: string;
  children: React.ReactNode;
}) {
  const { framed } = useDevicePreview();

  return (
    <div
      ref={barRef}
      className={cn(
        "sticky z-30 -mx-4 mt-3 bg-surface px-4 pb-3 sm:-mx-6 sm:mt-4 sm:px-6",
        // ตอนจำลองอุปกรณ์ ตัวที่เลื่อนคือกรอบ ขอบบนจึงอยู่ที่ 0 ไม่ใช่ใต้แถบหัวเว็บ
        framed ? "top-0" : "top-14",
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * ปุ่มกลับขึ้นบนสุด
 *
 * sticky ไม่ใช่ fixed เพราะตัวที่เลื่อนอาจเป็นกรอบจำลอง ไม่ใช่หน้าต่าง
 * ถ้าใช้ fixed ปุ่มจะไปเกาะขอบจอ ไม่ใช่ขอบกรอบ
 * h-0 ไม่ให้กินที่ในหน้า ปุ่มจึงลอยทับเนื้อหาแทนที่จะดันของลง
 */
export function BackToTop({
  show,
  onClick,
}: {
  show: boolean;
  onClick: () => void;
}) {
  return (
    <div className="pointer-events-none sticky bottom-6 z-30 flex h-0 items-end justify-end">
      <Button
        size="icon"
        aria-label="กลับขึ้นบนสุด"
        onClick={onClick}
        className={cn(
          "pointer-events-auto -translate-y-full rounded-full shadow-lg transition-opacity duration-200",
          show ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      >
        <ArrowUpIcon />
      </Button>
    </div>
  );
}

/** รวมทุกอย่างที่หน้าแบบนี้ต้องใช้ไว้ในที่เดียว เรียกครั้งเดียวได้ครบ */
export function useStickyToolbar(options?: { topAfter?: number }) {
  const { showTop, scrollToTop, scrollIntoTop } = useScrollState(options);
  const barRef = React.useRef<HTMLDivElement>(null);
  return { showTop, scrollToTop, scrollIntoTop, barRef };
}
