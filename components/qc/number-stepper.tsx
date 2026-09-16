"use client";

import { MinusIcon, PlusIcon } from "lucide-react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@peckey954/ui/components/ui/input-group";
import { useNumberField } from "@/components/number-field";

/**
 * ช่องตัวเลขที่มีปุ่มลบ/บวก — ชุดเดียวกับที่ใช้ในใบชั่งกับใบผลิต
 *
 * เก็บค่าเป็นตัวหนังสือเพราะช่องว่างกับเลขศูนย์ไม่ใช่เรื่องเดียวกัน
 * ว่าง = ยังไม่ได้ชั่ง ศูนย์ = ชั่งแล้วได้ศูนย์
 *
 * เดิมอยู่ใน RoundCard ที่เดียว ย้ายออกมาเพราะใบตรวจรับวัตถุดิบใช้ช่องแบบเดียวกัน
 * แต่ไม่ได้วางเป็นการ์ดรอบ — คัดลอกไปอีกชุดแล้ววันหนึ่งจะมีคนแก้ฝั่งเดียว
 */
export function NumberStepper({
  id,
  label,
  value,
  step = 1,
  onValueChange,
}: {
  id: string;
  label: string;
  value: string;
  /** ขนาดที่กดปุ่มแล้วขยับ — ค่าที่วัดละเอียด เช่นความแข็ง ขยับทีละ 0.1 */
  step?: number;
  onValueChange: (v: string) => void;
}) {
  const num = value.trim() === "" ? 0 : Number(value) || 0;
  const field = useNumberField(num, (n) => onValueChange(String(n)), 2);
  const bump = (delta: number) =>
    onValueChange(String(Math.max(0, Number((num + delta).toFixed(2)))));

  return (
    <InputGroup className="h-11 bg-card">
      <InputGroupAddon align="inline-start">
        <InputGroupButton
          size="icon-sm"
          aria-label={`ลด${label}`}
          onClick={() => bump(-step)}
        >
          <MinusIcon />
        </InputGroupButton>
      </InputGroupAddon>
      <InputGroupInput {...field} id={id} className="text-center tabular-nums" />
      <InputGroupAddon align="inline-end">
        <InputGroupButton
          size="icon-sm"
          aria-label={`เพิ่ม${label}`}
          onClick={() => bump(step)}
        >
          <PlusIcon />
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  );
}
