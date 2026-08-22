"use client";

import * as React from "react";
import { ChevronDownIcon } from "lucide-react";
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
