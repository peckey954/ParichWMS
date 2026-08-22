"use client";

import * as React from "react";
import { CalendarIcon, ChevronDownIcon } from "lucide-react";
import { Button } from "@peckey954/ui/components/ui/button";
import { Calendar } from "@peckey954/ui/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@peckey954/ui/components/ui/popover";
import { cn } from "@peckey954/ui/lib/utils";

/* ------------------------------------------------------------------
   ช่องเลือกวันที่ — หน้าตาเหมือนช่อง Select ทั่วไปในฟอร์ม ไม่ใช่ช่องพิมพ์เอง
   เพราะ "วันที่ต้องการสินค้า" เป็นค่าที่เลือกจากปฏิทิน ไม่ใช่ค่าที่คีย์ตัวเลข

   ตั้งชื่อเดือน/วันในปฏิทินเป็นภาษาไทยด้วย Intl ในตัวเบราว์เซอร์ ไม่ต้องเพิ่ม
   date-fns เป็น dependency ใหม่แค่เพื่อ locale — ระบุปฏิทินเป็น gregory ตรงๆ
   (-u-ca-gregory) เพราะ locale th-TH ของ Intl ค่าเริ่มต้นนับปี พ.ศ. ซึ่งไม่ตรง
   กับปี ค.ศ. ที่ใช้แสดงวันที่ทั้งแอป
------------------------------------------------------------------ */

const pad = (n: number) => String(n).padStart(2, "0");

const formatCaption = (d: Date) =>
  d.toLocaleDateString("th-TH-u-ca-gregory", { month: "long", year: "numeric" });

const formatWeekday = (d: Date) =>
  d.toLocaleDateString("th-TH-u-ca-gregory", { weekday: "short" });

/** dd/mm/yyyy ตามรูปแบบวันที่ที่ใช้ทั้งแอป */
export function formatDateSlash(d: Date) {
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

/** แปลงกลับจาก dd/mm/yyyy — ใช้ตอนเปิดฟอร์มแก้ไขที่มีค่าจากข้อมูลเดิมอยู่แล้ว */
export function parseDateSlash(s: string): Date | undefined {
  const [d, m, y] = s.split("/").map(Number);
  if (!d || !m || !y) return undefined;
  return new Date(y, m - 1, d);
}

export function DateSelect({
  id,
  value,
  onValueChange,
  placeholder = "เลือกวันที่",
  className,
}: {
  id?: string;
  value?: Date;
  onValueChange: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          className={cn(
            "w-full justify-between bg-card font-normal",
            !value && "text-muted-foreground",
            className
          )}
        >
          {value ? formatDateSlash(value) : placeholder}
          <ChevronDownIcon className="text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          mode="single"
          formatters={{ formatCaption, formatWeekdayName: formatWeekday }}
          selected={value}
          defaultMonth={value}
          onSelect={(d) => {
            onValueChange(d);
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

/** ต้องมีคีย์ from เสมอ (ค่าเป็น undefined ได้) ไม่ใช่ from ไม่บังคับมีคีย์ —
 *  โครงสร้างต้องตรงกับ DateRange ของ react-day-picker เป๊ะเพื่อส่งให้ Calendar
 *  ตรงๆ ได้โดยไม่ต้อง import ชนิดจากแพ็กเกจนั้นเข้ามาตรงๆ (เป็น dependency
 *  ของ @peckey954/ui ไม่ใช่ของโปรเจกต์นี้เอง — pnpm ไม่ hoist ให้ import ตรงได้) */
export type DateRange = { from: Date | undefined; to?: Date | undefined };

/**
 * ช่องเลือกช่วงวันที่ — ใช้ในกล่องตัวกรอง ไม่ปิดกล่องปฏิทินทันทีที่เลือกวันแรก
 * เพราะต้องเลือกวันที่สองต่อ (react-day-picker ส่ง to:undefined ระหว่างที่ยัง
 * เลือกไม่ครบ ปิดกล่องตอนนั้นจะตัดจบก่อนเลือกวันที่สองเสร็จ)
 */
export function DateRangeSelect({
  id,
  value,
  onValueChange,
  placeholder = "เลือกวันที่",
  className,
}: {
  id?: string;
  value?: DateRange;
  onValueChange: (range: DateRange | undefined) => void;
  placeholder?: string;
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);

  const label = value?.from
    ? value.to
      ? `${formatDateSlash(value.from)} - ${formatDateSlash(value.to)}`
      : formatDateSlash(value.from)
    : placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          className={cn(
            "w-full justify-between bg-card font-normal",
            !value?.from && "text-muted-foreground",
            className
          )}
        >
          <span className="flex items-center gap-2 truncate">
            <CalendarIcon className="size-4 shrink-0" />
            <span className="truncate">{label}</span>
          </span>
          <ChevronDownIcon className="shrink-0 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          mode="range"
          formatters={{ formatCaption, formatWeekdayName: formatWeekday }}
          selected={value}
          defaultMonth={value?.from}
          onSelect={(r) => {
            onValueChange(r);
            if (r?.from && r?.to) setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
