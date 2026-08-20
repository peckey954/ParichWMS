"use client";

import { cn } from "@peckey954/ui/lib/utils";

/* ------------------------------------------------------------------
   ชิปเลือกหนึ่งอย่างจากชุด

   ตัวที่เลือกอยู่เปลี่ยนเป็นเส้นขอบส้มกับตัวหนังสือส้ม ไม่มีพื้นสี
   ต่างจาก CheckChip ตรงที่ไม่มีกล่องติ๊กอยู่ข้างใน
   ชิปมีกล่องติ๊ก = ติ๊กได้หลายอัน ชิปเปล่า = เลือกได้อันเดียว
   กล่องติ๊กจึงเป็นตัวบอกกฎ ไม่ใช่รูปทรงของชิป

   ตัดบรรทัดเองเมื่อชิปยาว ๆ ลงไม่พอในแถวเดียว
   ต่างจาก ButtonGroup ที่เป็นก้อนเดียวตัดบรรทัดไม่ได้ ป้ายยาวจึงโดนตัดด้วยจุดไข่ปลา
   "บังคับระบุเมื่อไม่ผ่าน/ไม่ปกติ" เป็นป้ายที่ต้องอ่านครบ ตัดทิ้งไม่ได้

   สูง 40px ทั้งชิปเป็นเป้ากด ไม่ใช่แค่ตัวหนังสือ
------------------------------------------------------------------ */

export type Chip<T extends string> = {
  id: T;
  label: string;
  /** ปิดไว้เมื่อเลือกแล้วจะได้ค่าที่ใช้งานไม่ได้ — บอกเหตุผลผ่าน hint */
  disabled?: boolean;
  hint?: string;
};

export function ChipGroup<T extends string>({
  label,
  options,
  value,
  onChange,
  className,
}: {
  label: string;
  options: Chip<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn("flex flex-wrap gap-2", className)}
    >
      {options.map((o) => {
        const on = value === o.id;
        return (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={on}
            disabled={o.disabled}
            title={o.hint}
            onClick={() => onChange(o.id)}
            className={cn(
              "flex min-h-10 shrink-0 items-center rounded-full border px-4",
              "text-sm whitespace-nowrap transition-colors",
              "hover:bg-accent-hover",
              "focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
              "disabled:opacity-50 disabled:hover:bg-transparent",
              on
                ? "border-primary font-medium text-primary"
                : "border-border text-foreground"
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
