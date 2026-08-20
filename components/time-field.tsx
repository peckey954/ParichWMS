"use client";

import * as React from "react";
import { ClockIcon } from "lucide-react";
import { Button } from "@peckey954/ui/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@peckey954/ui/components/ui/input-group";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@peckey954/ui/components/ui/popover";
import { cn } from "@peckey954/ui/lib/utils";

/* ------------------------------------------------------------------
   ช่องกรอกเวลา

   คำตอบของช่องนี้แปดในสิบครั้งคือ "ตอนนี้" — คนตรวจยืนอยู่หน้าสายพาน
   ตรวจเสร็จแล้วกด ไม่ได้กำลังนึกว่าเมื่อกี๊กี่โมง
   ที่เหลือคือมานั่งคีย์ทีหลังจากใบกระดาษ ซึ่งคนกลุ่มนี้พิมพ์เร็วกว่าจิ้มเสมอ

   ดีไซน์จึงเป็น ทางลัดของกรณีที่พบบ่อย + พิมพ์ได้เต็มที่สำหรับที่เหลือ
   ไม่ใช่บังคับให้ทุกคนไต่ลูกศรทีละนาที ซึ่ง 11:00 ไป 10:47 คือกดสิบหกครั้ง

   พิมพ์ 1047 แล้วได้ 10:47 เลย ไม่ต้องพิมพ์ทวิภาคเอง
   บนมือถือขึ้นแป้นตัวเลขให้ด้วย ไม่ใช่แป้นตัวอักษรเต็ม

   เป็น popover ไม่ใช่ modal เพราะช่องนี้อยู่ในแถวตาราง
   กล่องกลางจอจะบังทั้งตาราง แล้วคนกรอกจะไม่เห็นว่าอยู่ครั้งที่เท่าไหร่
   ซึ่งเป็นสิ่งเดียวที่ต้องเห็นตอนนั้น

   เลือกแล้วปิดเลย ไม่มีปุ่มยืนยัน — แบบเดียวกับ Select ทุกตัวในระบบ
   การเลือกคือการยืนยันอยู่แล้ว ปุ่มบันทึกอีกทีคือการกดที่ไม่ได้ให้อะไร
------------------------------------------------------------------ */

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
/** นาทีทีละห้า — พอถึงระดับที่ต้องเป๊ะกว่านี้ พิมพ์เร็วกว่าเลื่อนหา */
const MINUTES = Array.from({ length: 12 }, (_, i) =>
  String(i * 5).padStart(2, "0")
);

const pad = (n: number) => String(n).padStart(2, "0");
const toHHMM = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

/**
 * อ่านสิ่งที่พิมพ์มาให้เป็นเวลา — คืน null เมื่อตีความไม่ได้
 *
 * รับได้ทั้ง 1047, 10:47, 947 (= 09:47) และ 10 (= 10:00)
 * คนคีย์จากใบกระดาษพิมพ์รวดเดียวไม่หยุดใส่ทวิภาค จึงต้องอ่านตัวเลขล้วนออก
 */
export function parseTime(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 0) return null;

  let h: number;
  let m: number;
  if (digits.length <= 2) {
    h = Number(digits);
    m = 0;
  } else {
    h = Number(digits.slice(0, digits.length - 2));
    m = Number(digits.slice(-2));
  }

  if (h > 23 || m > 59) return null;
  return `${pad(h)}:${pad(m)}`;
}

/** เลื่อนเวลาถอยหลัง ใช้กับปุ่มลัด "ลืมจดตอนตรวจ" */
function shift(value: string, minutes: number): string {
  const base = parseTime(value);
  const [h, m] = (base ?? toHHMM(new Date())).split(":").map(Number);
  const total = (h * 60 + m - minutes + 1440) % 1440;
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
}

export function TimeField({
  id,
  value,
  onValueChange,
  className,
  placeholder = "--:--",
  "aria-label": ariaLabel,
}: {
  id?: string;
  /** รูปแบบ HH:MM — ว่างคือยังไม่ได้กรอก */
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  "aria-label"?: string;
}) {
  const [open, setOpen] = React.useState(false);
  // ตัวหนังสือระหว่างที่ยังพิมพ์ไม่จบ ยังไม่ต้องแปลงเป็นเวลาทุกตัวอักษร
  // แปลงทันทีจะเถียงกับคนพิมพ์ เช่นพิมพ์ 1 แล้วเด้งเป็น 01:00 ทั้งที่กำลังจะพิมพ์ 10
  const [text, setText] = React.useState<string | null>(null);
  // เวลาปัจจุบันอ่านตอนเปิดกล่อง ไม่ใช่ตอน render — server กับ client จะได้ไม่ต่างกัน
  const [now, setNow] = React.useState("");

  const commit = () => {
    if (text === null) return;
    if (text.trim() === "") onValueChange("");
    else onValueChange(parseTime(text) ?? value);
    setText(null);
  };

  const pick = (next: string) => {
    onValueChange(next);
    setOpen(false);
  };

  const [hh, mm] = (parseTime(value) ?? "--:--").split(":");

  return (
    <Popover
      open={open}
      onOpenChange={(v) => {
        if (v) setNow(toHHMM(new Date()));
        setOpen(v);
      }}
    >
      <InputGroup className={cn("bg-card", className)}>
        <InputGroupInput
          id={id}
          aria-label={ariaLabel}
          // แป้นตัวเลขบนมือถือ ไม่ใช่แป้นตัวอักษรเต็มที่ต้องสลับโหมดเอง
          inputMode="numeric"
          autoComplete="off"
          placeholder={placeholder}
          className="tabular-nums"
          value={text ?? value}
          onChange={(e) => setText(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commit();
            }
          }}
        />
        <InputGroupAddon align="inline-end">
          <PopoverTrigger asChild>
            {/* 32px ไม่ใช่ 24px ที่เป็นค่าเริ่มต้น — คนกดใส่ถุงมืออยู่หน้าไลน์ */}
            <InputGroupButton size="icon-sm" aria-label="เลือกเวลาจากรายการ">
              <ClockIcon />
            </InputGroupButton>
          </PopoverTrigger>
        </InputGroupAddon>
      </InputGroup>

      <PopoverContent
        align="end"
        className="w-64 p-3"
        // กดในกล่องแล้วไม่ต้องดึงโฟกัสกลับไปที่ช่อง เดี๋ยว onBlur จะไปทับค่าที่เพิ่งเลือก
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {/* ปุ่มเดียวที่ตอบคำถามแปดในสิบครั้ง จึงใหญ่สุดและอยู่บนสุด */}
        <Button className="h-11 w-full" onClick={() => pick(now)}>
          <ClockIcon />
          ตอนนี้ <span className="tabular-nums">{now}</span>
        </Button>

        {/* ตรวจเสร็จแล้วเพิ่งนึกได้ว่ายังไม่ได้ลงเวลา เกิดบ่อยพอที่จะมีปุ่มให้ */}
        <div className="mt-2 grid grid-cols-3 gap-1">
          {[15, 30, 60].map((min) => (
            <Button
              key={min}
              variant="outline"
              className="h-9 px-1 text-xs"
              onClick={() => pick(shift(value || now, min))}
            >
              −{min === 60 ? "1 ชม." : `${min} นาที`}
            </Button>
          ))}
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 border-t border-border pt-3">
          <TimeColumn
            label="ชั่วโมง"
            options={HOURS}
            current={hh}
            onPick={(h) => pick(`${h}:${mm === "--" ? "00" : mm}`)}
          />
          <TimeColumn
            label="นาที"
            options={MINUTES}
            current={mm}
            onPick={(m) => pick(`${hh === "--" ? now.slice(0, 2) : hh}:${m}`)}
            prefix=":"
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}

/**
 * คอลัมน์เลื่อนหาตัวเลข
 * เลื่อนไปที่ค่าที่เลือกอยู่ตอนเปิด ไม่ใช่เริ่มที่ 00 แล้วให้ไล่หาเอง
 */
function TimeColumn({
  label,
  options,
  current,
  onPick,
  prefix = "",
}: {
  label: string;
  options: string[];
  current: string;
  onPick: (value: string) => void;
  prefix?: string;
}) {
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    ref.current
      ?.querySelector('[data-current="true"]')
      ?.scrollIntoView({ block: "center" });
  }, []);

  return (
    <div>
      <p className="mb-1 text-xs text-muted-foreground">{label}</p>
      <div
        ref={ref}
        role="listbox"
        aria-label={label}
        className="max-h-40 overflow-y-auto rounded-md border border-border"
      >
        {options.map((o) => {
          const on = o === current;
          return (
            <button
              key={o}
              type="button"
              role="option"
              aria-selected={on}
              data-current={on}
              onClick={() => onPick(o)}
              className={cn(
                "block w-full px-2 py-2 text-center text-sm tabular-nums transition-colors",
                "hover:bg-accent-hover focus-visible:bg-accent-hover focus-visible:outline-none",
                on && "bg-brand font-semibold text-primary"
              )}
            >
              {prefix}
              {o}
            </button>
          );
        })}
      </div>
    </div>
  );
}
