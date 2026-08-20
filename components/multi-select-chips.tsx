"use client";

import {
  MultiSelect,
  type MultiSelectProps,
} from "@peckey954/ui/components/ui/multi-select";
import { cn } from "@peckey954/ui/lib/utils";

/**
 * multi-select ทุกจุดในแอปนี้ใช้ตัวนี้แทนของ DS ตรง ๆ
 *
 * แถวชิปของเดิมเป็น flex-wrap — เลือกของเพิ่มจนล้นบรรทัดแล้วกล่องสูงขึ้น
 * ดันเลย์เอาต์ทั้งฟอร์มขยับตาม สังเกตง่ายเป็นพิเศษตอนกล่องอยู่กลางฟอร์ม
 * (ไม่ใช่ท้ายสุด) เพราะทุกอย่างใต้กล่องเลื่อนลงไปพร้อมกัน
 *
 * ล็อกเป็นแถวเดียวแทน — ชิปที่ล้นเลื่อนดูในแนวนอนแทนการตกบรรทัด
 * ความสูงกล่องจึงคงที่เสมอไม่ว่าจะเลือกไว้กี่ชิ้น ตัวเลขนับมุมขวาที่ DS
 * มีอยู่แล้วบอกจำนวนที่เลือกทั้งหมดโดยไม่ต้องเห็นชิปครบทุกอัน
 */
export function MultiSelectChips({ className, ...props }: MultiSelectProps) {
  return (
    <MultiSelect
      className={cn(
        "h-10",
        // ชิปเป็น div ลูกตัวแรกของ trigger เสมอ (ดู multi-select.tsx ของ DS)
        // min-w-0 จำเป็นเพราะ flex item ค่าเริ่มต้น min-width คือ auto
        // ไม่ใส่แล้ว overflow-x-auto จะไม่ตัด กล่องจะกว้างเกินแทนที่จะเลื่อน
        "[&>div:first-child]:min-w-0 [&>div:first-child]:flex-nowrap [&>div:first-child]:overflow-x-auto",
        "[&_[data-slot=badge]]:shrink-0",
        className
      )}
      {...props}
    />
  );
}
