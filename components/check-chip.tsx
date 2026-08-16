"use client";

import * as React from "react";
import { Checkbox } from "@peckey954/ui/components/ui/checkbox";
import { Label } from "@peckey954/ui/components/ui/label";
import { cn } from "@peckey954/ui/lib/utils";

/* ------------------------------------------------------------------
   ชิปที่มีกล่องติ๊กอยู่ข้างใน

   เรียงต่อกันในแนวนอน ตัดบรรทัดเอง สี่อันลงได้ในหนึ่งถึงสองบรรทัด
   แทนที่จะเป็นสี่แถวเรียงลง ซึ่งกินความสูงในกล่องไปเปล่า ๆ

   กล่องติ๊กยังอยู่ เพราะรูปทรงชิปอย่างเดียวบอกไม่ได้ว่าเลือกได้หลายอัน
   ชิปกลมในระบบนี้ส่วนใหญ่เป็นการนำทางที่เลือกได้ทีละอัน
   กล่องติ๊กคือสิ่งที่แยกสองอย่างนี้ออกจากกัน

   ทั้งชิปเป็นเป้ากด ไม่ใช่แค่กล่องติ๊ก 16px และสูง 40px
   สั้นกว่าแถวเดิม 44px แต่ยังกดด้วยนิ้วโป้งได้เพราะกว้างกว่ามาก
------------------------------------------------------------------ */

export function CheckChip({
  id,
  label,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <Label
      htmlFor={id}
      className={cn(
        "flex min-h-10 shrink-0 items-center gap-2 rounded-full border px-3",
        "text-sm font-normal whitespace-nowrap transition-colors",
        checked
          ? "border-primary bg-brand text-primary"
          : "border-border text-foreground hover:bg-accent-hover"
      )}
    >
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(v) => onChange(v === true)}
      />
      {label}
    </Label>
  );
}
