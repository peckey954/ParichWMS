"use client";

import { Button } from "@peckey954/ui/components/ui/button";
import { ButtonGroup } from "@peckey954/ui/components/ui/button-group";
import { cn } from "@peckey954/ui/lib/utils";

/* ------------------------------------------------------------------
   ปุ่มเลือกหนึ่งอย่างจากชุด

   ปุ่มเหลี่ยมติดกันเป็นก้อนเดียว = เลือกได้อันเดียว
   ต่างจากชิปกลมที่แยกกันเป็นอัน ๆ ซึ่งแปลว่าเลือกได้หลายอันพร้อมกัน
   รูปทรงบอกกฎไปแล้ว ไม่ต้องมีคำอธิบายกำกับ — หลักเดียวกับ SortControl

   ตัวที่เลือกอยู่ใช้พื้นอ่อนสีแบรนด์ ไม่ใช่เปลี่ยนสีเส้นขอบ
   เพราะ ButtonGroup ตัดขอบซ้ายของปุ่มที่ไม่ใช่ตัวแรกทิ้ง
   เปลี่ยนสีขอบแล้วปุ่มกลางจะมีขอบส้มแค่สามด้าน

   ทุกปุ่มกว้างเท่ากันและตัดคำด้วยจุดไข่ปลาเมื่อไม่พอ
   ในกล่องกว้าง 326px บนมือถือ สี่ตัวเลือกยังอยู่แถวเดียวได้
   ถ้าปล่อยให้ปุ่มกว้างตามข้อความ ปุ่มสุดท้ายจะทะลุขอบกล่องออกไป
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
  /** false = ปุ่มกว้างตามข้อความ ใช้ตอนวางแทรกในแถวที่มีของอื่นอยู่ด้วย */
  fill = true,
  className,
}: {
  label: string;
  options: Choice<T>[];
  value: T;
  onChange: (value: T) => void;
  fill?: boolean;
  className?: string;
}) {
  return (
    <ButtonGroup
      aria-label={label}
      className={cn(fill && "w-full", className)}
    >
      {options.map((o) => {
        const on = value === o.id;
        return (
          <Button
            key={o.id}
            variant="outline"
            aria-pressed={on}
            disabled={o.disabled}
            title={o.disabled ? o.disabledHint : o.label}
            onClick={() => onChange(o.id)}
            className={cn(
              "h-10 px-3",
              fill && "min-w-0 flex-1 px-2",
              on && "bg-brand font-semibold text-primary hover:bg-brand"
            )}
          >
            <span className={cn(fill && "truncate")}>{o.label}</span>
          </Button>
        );
      })}
    </ButtonGroup>
  );
}
