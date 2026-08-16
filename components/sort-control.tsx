"use client";

import * as React from "react";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  ChevronsUpDownIcon,
} from "lucide-react";
import { Button } from "@peckey954/ui/components/ui/button";
import { ButtonGroup } from "@peckey954/ui/components/ui/button-group";
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

   ใช้ ButtonGroup ของ DS ไม่ใช่แถบ segmented ที่เขียนเอง
   สามปุ่มติดกันเป็นก้อนเดียวบอกว่า "เลือกได้อันเดียวจากชุดนี้" อยู่ในตัว
   และเป็นหน้าตาที่ต่างจากทั้งชิปกลมข้าง ๆ และแถบแท็บด้านบน
   ซึ่งสองอันนั้นแปลว่า "เปลี่ยนสิ่งที่กำลังดู" ส่วนการเรียงคือของชุดเดิมเรียงใหม่

   ตัวที่เลือกอยู่ใช้พื้นอ่อนสีแบรนด์ ไม่ใช่เปลี่ยนสีเส้นขอบ
   เพราะ ButtonGroup ตัดขอบซ้ายของปุ่มที่ไม่ใช่ตัวแรกทิ้ง
   เปลี่ยนสีขอบแล้วปุ่มกลางจะมีขอบส้มแค่สามด้าน

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
    <div className={cn("flex shrink-0 items-center gap-2", className)}>
      <span className="shrink-0 text-sm text-muted-foreground">เรียงตาม:</span>

      <ButtonGroup aria-label="เรียงตาม">
        {options.map((o) => {
          const on = value === o.id;
          const next: SortDir = on && dir === "asc" ? "desc" : "asc";
          const Icon = !on
            ? ChevronsUpDownIcon
            : dir === "asc"
              ? ChevronUpIcon
              : ChevronDownIcon;

          return (
            <Button
              key={o.id}
              variant="outline"
              size="sm"
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
                on && "bg-brand font-semibold text-primary hover:bg-brand"
              )}
            >
              {o.label}
              <Icon />
            </Button>
          );
        })}
      </ButtonGroup>
    </div>
  );
}
