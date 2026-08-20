"use client";

import { Button } from "@peckey954/ui/components/ui/button";
import { cn } from "@peckey954/ui/lib/utils";

/* ------------------------------------------------------------------
   ชิปเลือกหนึ่งอย่างจากชุด

   เดิมเป็นปุ่มเหลี่ยมติดกันเป็นก้อนเดียว (ButtonGroup) บังคับให้อยู่แถวเดียว
   กว้างเท่ากันทุกปุ่มแล้วตัดคำด้วยจุดไข่ปลาเมื่อไม่พอที่ — พอมีตัวเลือกหลายอัน
   หรือข้อความยาวบนจอมือถือ ปุ่มบีบจนอ่านไม่ออก

   เปลี่ยนเป็นชิปแยกอัน กว้างตามเนื้อหาของตัวเอง ตกบรรทัดใหม่ได้เมื่อแถวไม่พอที่
   — อ่านได้เต็มคำเสมอไม่ว่าจะมีกี่ตัวเลือกหรือจอแคบแค่ไหน
   ยังไม่ใช่ CheckChip (ปุ่มกลมมีไอคอนติ๊ก ใช้เลือกได้หลายอัน) เพราะที่นี่เหลี่ยมมน
   ไม่มีไอคอน สื่อว่าเลือกได้แค่อันเดียวเหมือนเดิม
------------------------------------------------------------------ */

export type Choice<T extends string> = {
  id: T;
  label: string;
  /** ปิดไว้เมื่อเลือกแล้วจะได้ค่าที่ใช้งานไม่ได้ — บอกเหตุผลผ่าน disabledHint */
  disabled?: boolean;
  disabledHint?: string;
};

export function ChoiceGroup<T extends string>({
  label,
  options,
  value,
  onChange,
  className,
}: {
  label: string;
  options: Choice<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div role="group" aria-label={label} className={cn("flex flex-wrap gap-2", className)}>
      {options.map((o) => {
        const on = value === o.id;
        return (
          <Button
            key={o.id}
            variant="outline"
            aria-pressed={on}
            disabled={o.disabled}
            title={o.disabled ? o.disabledHint : undefined}
            onClick={() => onChange(o.id)}
            className={cn(
              "h-10 px-3 font-normal",
              on && "border-primary bg-brand font-semibold text-primary hover:bg-brand"
            )}
          >
            {o.label}
          </Button>
        );
      })}
    </div>
  );
}
