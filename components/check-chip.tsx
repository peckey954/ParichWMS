"use client";

import * as React from "react";
import { Checkbox } from "@peckey954/ui/components/ui/checkbox";
import { Label } from "@peckey954/ui/components/ui/label";
import { cn } from "@peckey954/ui/lib/utils";

/* ------------------------------------------------------------------
   ชิปที่มีกล่องติ๊กอยู่ข้างใน

   เรียงต่อกันในแนวนอน ตัดบรรทัดเอง สี่อันลงได้ในหนึ่งถึงสองบรรทัด
   แทนที่จะเป็นสี่แถวเรียงลง ซึ่งกินความสูงในกล่องไปเปล่า ๆ

   แยกกันเป็นอัน ๆ ต่างจากการเรียงข้อมูลที่เป็นปุ่มติดกันเป็นก้อน
   ติดกัน = เลือกได้อันเดียว แยกกัน = เลือกได้หลายอัน รูปทรงบอกไปแล้ว

   ตัวหนังสือดำเสมอ ไม่มีพื้นสีตอนเลือก เพราะกล่องติ๊กบอกสถานะอยู่แล้ว
   ใส่พื้นสีเพิ่มเข้าไปคือบอกเรื่องเดิมซ้ำสามที (ติ๊ก + สีตัวอักษร + พื้น)
   เหลือเส้นขอบเปลี่ยนสีไว้ช่วยกวาดตาหาว่าอันไหนเปิดอยู่บ้าง

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
        "flex min-h-10 shrink-0 items-center gap-2 rounded-lg border px-3",
        "text-sm font-normal whitespace-nowrap text-foreground transition-colors",
        "hover:bg-accent-hover",
        checked ? "border-primary" : "border-border"
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
