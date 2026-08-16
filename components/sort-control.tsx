"use client";

import * as React from "react";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  ChevronsUpDownIcon,
} from "lucide-react";
import { cn } from "@peckey954/ui/lib/utils";

/* ------------------------------------------------------------------
   ปุ่มเลือกการเรียง

   กดอันที่ยังไม่ได้เลือก = เปลี่ยนไปเรียงแบบนั้น
   กดอันที่เลือกอยู่แล้วซ้ำ = สลับทิศ
   เป็นแพตเทิร์นเดียวกับหัวคอลัมน์ตารางที่คนคุ้นอยู่แล้ว ไม่ต้องเรียนรู้ใหม่
   และไม่กินที่เพิ่มอีกแถวเหมือนการแยกปุ่มทิศทางออกมาต่างหาก

   ไอคอนบอกสถานะตรง ๆ
     ลูกศรสองหัว = ยังไม่ได้เรียงด้วยอันนี้ กดได้
     ลูกศรหัวเดียว = เรียงอยู่ ชี้ไปทางที่กำลังเรียง

   หน้าตาเป็นชิปแยกกันชุดเดียวกับชิปติ๊กในหัวข้อถัดไป
   ทั้งกล่องจึงมีภาษาปุ่มเดียว ต่างกันแค่มีกล่องติ๊กหรือไม่มี
   ซึ่งบอกได้เองว่าอันไหนเลือกได้อันเดียว อันไหนเลือกได้หลายอัน

   ชื่อหัวข้ออยู่ข้างนอก ตัวนี้จึงไม่ต้องมีคำว่า "เรียงตาม:" ในตัวอีก

   ป้ายของทิศทางไม่ได้เขียนไว้ เพราะมันต่างกันไปตามสิ่งที่เรียง
   ก→ฮ กับ เก่าสุดก่อน ไม่ใช่เรื่องเดียวกัน จึงบอกผ่าน title ของแต่ละอันแทน
------------------------------------------------------------------ */

export type SortDir = "asc" | "desc";

export type SortOption<T extends string> = {
  id: T;
  label: string;
  /** คำอธิบายทิศทางของอันนี้โดยเฉพาะ เช่น เก่าสุดก่อน / ใหม่สุดก่อน */
  asc: string;
  desc: string;
};

export function SortControl<T extends string>({
  options,
  value,
  dir,
  onChange,
  className,
}: {
  options: SortOption<T>[];
  value: T;
  dir: SortDir;
  onChange: (sort: T, dir: SortDir) => void;
  className?: string;
}) {
  return (
    <div
      role="group"
      aria-label="การเรียงข้อมูล"
      className={cn("flex flex-wrap items-center gap-2", className)}
    >
      {options.map((o) => {
        const on = value === o.id;
        const next: SortDir = on && dir === "asc" ? "desc" : "asc";
        const Icon = !on
          ? ChevronsUpDownIcon
          : dir === "asc"
            ? ChevronUpIcon
            : ChevronDownIcon;

        return (
          <button
            key={o.id}
            type="button"
            aria-pressed={on}
            // บอกว่ากดแล้วจะได้อะไร ไม่ใช่ว่าตอนนี้เป็นอะไร
            title={
              on
                ? `เรียง ${o.label} — ${next === "asc" ? o.asc : o.desc}`
                : `เรียงตาม ${o.label}`
            }
            aria-label={`เรียงตาม ${o.label}${
              on ? ` ${dir === "asc" ? o.asc : o.desc}` : ""
            }`}
            onClick={() => onChange(o.id, next)}
            className={cn(
              "flex min-h-10 shrink-0 items-center gap-2 rounded-lg border px-3",
              "text-sm whitespace-nowrap transition-colors",
              "focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
              on
                ? "border-primary bg-brand font-medium text-primary"
                : "border-border text-foreground hover:bg-accent-hover"
            )}
          >
            {o.label}
            <Icon className="size-4" />
          </button>
        );
      })}
    </div>
  );
}
