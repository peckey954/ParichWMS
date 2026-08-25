"use client";

import * as React from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Button } from "@peckey954/ui/components/ui/button";
import { cn } from "@peckey954/ui/lib/utils";
import type { Schedule } from "@/lib/qc-template";

/* ------------------------------------------------------------------
   ปฏิทินตัวอย่างของฟอร์มตามรอบเวลา — ในหน้าตัวสร้าง ไม่ใช่หน้าใช้งานจริง

   ต่างจากปฏิทินของใบตรวจวัตถุดิบที่ไล่จากใบที่มีอยู่จริง (ทำแล้ว/ขาด/ผิดปกติ)
   ที่นี่เป็นฟอร์มที่ยังไม่เผยแพร่ ไม่มีใบจริงให้ไล่สักใบ
   จุดในช่องจึงบอกแค่ "โครงตั้งไว้กี่ใบต่อวัน" ไม่ใช่สถานะของใบจริง
   ถ้าเอาสีเขียว/แดงของสถานะจริงมาใช้ จะเข้าใจผิดว่ามีข้อมูลจริงอยู่แล้ว

   วันที่เว้นไว้ (เช่นเสาร์–อาทิตย์) ขึ้นเป็นช่องเทาไม่มีจุด ตรงกับที่ตั้งไว้ในรอบการตรวจ
   ให้เห็นก่อนเผยแพร่ว่าปฏิทินจริงจะมีหน้าตาประมาณไหน
------------------------------------------------------------------ */

const MONTH_NAMES = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
];
const WEEKDAYS = ["จ", "อ", "พ", "พฤ", "ศ", "ส", "อา"];

const monthLabel = (y: number, m: number) => `${MONTH_NAMES[m]} ${y + 543}`;
const daysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
// getDay() คืน 0 = อาทิตย์ ปฏิทินนี้เริ่มจันทร์ จึงต้องเลื่อนฐานเอง
const leadingBlanks = (y: number, m: number) => (new Date(y, m, 1).getDay() + 6) % 7;

export function SchedulePreviewCalendar({ schedule }: { schedule: Schedule }) {
  const today = new Date();
  const [year, setYear] = React.useState(today.getFullYear());
  const [month, setMonth] = React.useState(today.getMonth());

  const shiftMonth = (delta: number) => {
    const m = month + delta;
    if (m < 0) {
      setYear((y) => y - 1);
      setMonth(11);
    } else if (m > 11) {
      setYear((y) => y + 1);
      setMonth(0);
    } else setMonth(m);
  };

  const blanks = leadingBlanks(year, month);
  const total = daysInMonth(year, month);
  const isWeekendSkipped = schedule.skipDays === "weekend";

  return (
    <div>
      <div className="flex items-center justify-center gap-2">
        <Button
          variant="outline"
          size="icon"
          aria-label="เดือนก่อนหน้า"
          onClick={() => shiftMonth(-1)}
        >
          <ChevronLeftIcon />
        </Button>
        <span className="min-w-36 text-center text-sm font-semibold">
          {monthLabel(year, month)}
        </span>
        <Button
          variant="outline"
          size="icon"
          aria-label="เดือนถัดไป"
          onClick={() => shiftMonth(1)}
        >
          <ChevronRightIcon />
        </Button>
      </div>

      <div className="mt-3 grid grid-cols-7 gap-1 text-center text-sm text-muted-foreground">
        {WEEKDAYS.map((w) => (
          <span key={w} className="py-1">
            {w}
          </span>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1">
        {Array.from({ length: blanks }, (_, i) => (
          <span key={`b-${i}`} />
        ))}

        {Array.from({ length: total }, (_, i) => {
          const date = i + 1;
          // เดือน 0-11 ใน Date ตรงกับ index ของ MONTH_NAMES อยู่แล้ว
          const dow = new Date(year, month, date).getDay();
          const skipped = isWeekendSkipped && (dow === 0 || dow === 6);

          return (
            <div
              key={date}
              className={cn(
                "flex min-h-14 flex-col items-center gap-1.5 rounded-lg border p-2",
                skipped
                  ? "border-transparent bg-muted text-muted-foreground"
                  : "border-border bg-card"
              )}
            >
              <span className="text-sm font-medium tabular-nums">{date}</span>
              {!skipped && (
                <span className="flex flex-wrap items-center justify-center gap-1">
                  {schedule.slots.map((sl) => (
                    <span
                      key={sl.id}
                      title={`${sl.from}–${sl.to}`}
                      className="size-2 rounded-full bg-primary/50"
                    />
                  ))}
                </span>
              )}
            </div>
          );
        })}
      </div>

      <p className="mt-3 text-sm text-muted-foreground">
        จุด = ช่วงเวลาที่ต้องตรวจ 1 จุดต่อ 1 ใบ ({schedule.slots.length} จุดต่อวัน)
        {isWeekendSkipped && " · ช่องเทาคือวันที่เว้นไว้ตามรอบการตรวจ"}
        {" — "}
        เป็นแค่ตัวอย่างโครง ยังไม่มีใบจริงจนกว่าจะเผยแพร่และมีคนเปิดใบ
      </p>
    </div>
  );
}
