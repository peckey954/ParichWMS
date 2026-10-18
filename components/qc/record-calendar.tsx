"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Button } from "@peckey954/ui/components/ui/button";
import { cn } from "@peckey954/ui/lib/utils";
import {
  type QiTemplate,
} from "@/lib/qc-erp";
import {
  isWorkday,
  isoDate,
  slotState,
  type SlotState,
} from "@/lib/qc-records";

/* ------------------------------------------------------------------
   ปฏิทินใบตรวจตามรอบ — หนึ่งวงกลมต่อหนึ่งรอบ อ่านจากใบที่ทำแล้วจริง

     เขียว    ผ่าน
     แดง      ไม่ผ่าน
     เส้นประ   ถึงรอบแล้วแต่ไม่มีใครตรวจ
     จาง      ยังไม่ถึงรอบ

   วันหยุด (อาทิตย์) เป็นช่องเทาไม่มีวงกลม — ไม่ใช่ขาดตรวจ ไม่มีใครต้องมาทำ
   กดวันไหนก็ไปหน้าของวันนั้น (/qc/form/[tplId]/day/[date]) เห็นทีละรอบ
   แล้วกดเข้าไปดูใบของรอบนั้นต่อ — เป็นหน้า ไม่ใช่กล่องซ้อน ปุ่มย้อนกลับของ
   เบราว์เซอร์จะได้พากลับมาที่ปฏิทินตามที่คนคาด
------------------------------------------------------------------ */

export const MONTHS = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
];
const DAYS = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];
export const DAY_FULL = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"];

/* วงกลมวาดเป็น SVG ไม่ใช่ border — เส้นประของ border บนวงกลมสิบพิกเซลได้แค่
   สี่ห้าขีดหยาบ ๆ ดูเหมือนวงกลมแตก ไม่ใช่ "ยังไม่ได้ทำ" SVG ตั้งระยะขีดเองได้
   พื้นของผ่าน/ไม่ผ่านเป็นสีอ่อนชุดเดียวกับป้ายผ่าน/ไม่ผ่าน อ่านเป็นคู่กันทันที */
const RING: Record<Exclude<SlotState, "off">, { stroke: string; fill: string; dash?: string }> = {
  pass: { stroke: "stroke-success-strong", fill: "fill-success" },
  fail: { stroke: "stroke-danger-strong", fill: "fill-danger" },
  missed: { stroke: "stroke-muted-foreground", fill: "fill-transparent", dash: "1.6 1.4" },
  future: { stroke: "stroke-border", fill: "fill-transparent" },
};

export const STATE_LABEL: Record<SlotState, string> = {
  pass: "ผ่าน",
  fail: "ไม่ผ่าน",
  missed: "ไม่ได้ตรวจ",
  future: "ยังไม่ถึงรอบ",
  off: "วันหยุด",
};

export function Ring({ state, className }: { state: SlotState; className?: string }) {
  if (state === "off") return null;
  const r = RING[state];
  return (
    <svg aria-hidden viewBox="0 0 12 12" className={cn("size-3 shrink-0", className)}>
      <circle
        cx="6"
        cy="6"
        r="5.1"
        strokeWidth="1.2"
        strokeDasharray={r.dash}
        className={cn(r.stroke, r.fill)}
      />
    </svg>
  );
}

/** หกสัปดาห์เต็ม เริ่มอาทิตย์ — วันของเดือนข้าง ๆ ยังโชว์ ปฏิทินจะได้ไม่มีช่องโหว่ */
function weeksOf(year: number, month: number): Date[][] {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const days = first.getDay() + last.getDate() + (6 - last.getDay());
  const weeks: Date[][] = [];
  for (let i = 0; i < days; i++) {
    if (i % 7 === 0) weeks.push([]);
    weeks[weeks.length - 1].push(new Date(year, month, 1 - first.getDay() + i));
  }
  return weeks;
}

export function RecordCalendar({ tpl }: { tpl: QiTemplate }) {
  const now = new Date();
  const [ym, setYm] = React.useState({ y: now.getFullYear(), m: now.getMonth() });
  const router = useRouter();
  const slots = tpl.schedule.slots;
  const today = isoDate(now);

  const shift = (delta: number) =>
    setYm(({ y, m }) => {
      const d = new Date(y, m + delta, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });

  const weeks = weeksOf(ym.y, ym.m);

  // นับเฉพาะวันในเดือนนี้ — วันของเดือนข้าง ๆ ที่โผล่มาในตารางไม่นับซ้ำ
  const count = { pass: 0, fail: 0, missed: 0 };
  for (const w of weeks)
    for (const d of w) {
      if (d.getMonth() !== ym.m) continue;
      for (const s of slots) {
        const st = slotState(tpl, d, s, now);
        if (st === "pass" || st === "fail" || st === "missed") count[st]++;
      }
    }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" aria-label="เดือนก่อนหน้า" onClick={() => shift(-1)}>
            <ChevronLeftIcon />
          </Button>
          <span className="min-w-32 text-center text-sm font-medium">
            {MONTHS[ym.m]} {ym.y}
          </span>
          <Button variant="outline" size="icon" aria-label="เดือนถัดไป" onClick={() => shift(1)}>
            <ChevronRightIcon />
          </Button>
          <Button
            variant="outline"
            onClick={() => setYm({ y: now.getFullYear(), m: now.getMonth() })}
          >
            วันนี้
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          <span className="flex items-center gap-1.5">
            <Ring state="pass" /> ผ่าน {count.pass} รอบ
          </span>
          <span className="flex items-center gap-1.5">
            <Ring state="fail" /> ไม่ผ่าน {count.fail} รอบ
          </span>
          <span className="flex items-center gap-1.5">
            <Ring state="missed" /> ไม่ได้ตรวจ {count.missed} รอบ
          </span>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-border bg-card p-2 @3xl:p-3">
        <div className="grid grid-cols-7 gap-1.5 pb-1 text-center text-xs text-muted-foreground">
          {DAYS.map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>
        <div className="space-y-1.5">
          {weeks.map((w, wi) => (
            <div key={wi} className="grid grid-cols-7 gap-1.5">
              {w.map((d) => {
                const iso = isoDate(d);
                const work = isWorkday(d);
                const other = d.getMonth() !== ym.m;
                return (
                  <button
                    key={iso}
                    type="button"
                    disabled={!work}
                    onClick={() => router.push(`/qc/form/${tpl.id}/day/${iso}`)}
                    aria-label={`${d.getDate()} ${MONTHS[d.getMonth()]}`}
                    className={cn(
                      "flex min-h-14 flex-col items-start gap-1.5 rounded-lg border p-1.5 text-left text-xs transition-colors @3xl:min-h-20 @3xl:p-2.5",
                      work
                        ? "border-border bg-card hover:border-primary hover:bg-brand"
                        : "border-transparent bg-surface",
                      iso === today && "border-primary",
                      other && "text-muted-foreground"
                    )}
                  >
                    <span className={cn(iso === today && "font-semibold text-primary")}>
                      {d.getDate()}
                    </span>
                    {work && (
                      <span className="grid grid-cols-2 gap-1">
                        {slots.map((s) => (
                          <Ring key={s.id} state={slotState(tpl, d, s, now)} />
                        ))}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
