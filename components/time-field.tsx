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

   ชั่วโมงกับนาทีเป็นวงล้อเลื่อน ค่าที่อยู่กลางแถบคือค่าที่เลือกอยู่
   เลื่อนแล้วค่าในช่องเปลี่ยนตามทันที ไม่มีปุ่มยืนยัน — เห็นผลระหว่างเลื่อนเลย
   ปิดกล่องเมื่อไหร่ก็ได้ ค่าเข้าไปตั้งแต่ตอนเลื่อนแล้ว
------------------------------------------------------------------ */

/** ความสูงของหนึ่งแถวในวงล้อ ใช้คำนวณว่าเลื่อนไปหยุดที่ค่าไหน */
const ITEM_H = 36;
/** จำนวนแถวที่เห็นพร้อมกัน — เลขคี่ เพื่อให้มีแถวกลางจริง ๆ */
const VISIBLE = 5;
/** เว้นบนล่างครึ่งหนึ่งของที่เหลือ ค่าแรกกับค่าสุดท้ายจะได้เลื่อนมาอยู่กลางได้ */
const PAD = ((VISIBLE - 1) / 2) * ITEM_H;

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

export function TimeField({
  id,
  value,
  onValueChange,
  disabled,
  className,
  placeholder = "--:--",
  "aria-label": ariaLabel,
}: {
  id?: string;
  /** รูปแบบ HH:MM — ว่างคือยังไม่ได้กรอก ไม่ส่งมาเลยคือให้ช่องเก็บค่าเอง */
  value?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  "aria-label"?: string;
}) {
  // หน้าตัวอย่างฟอร์มไม่มีที่เก็บค่า แต่ช่องที่กดแล้วไม่ขยับอ่านว่าพัง
  // ไม่ส่ง value มาก็ให้ช่องเก็บของตัวเองไป จะได้ลองกดดูได้จริง
  const [inner, setInner] = React.useState("");
  const controlled = value !== undefined;
  const current = controlled ? value : inner;

  const setValue = (next: string) => {
    if (!controlled) setInner(next);
    onValueChange?.(next);
  };
  const [open, setOpen] = React.useState(false);
  // ตัวหนังสือระหว่างที่ยังพิมพ์ไม่จบ ยังไม่ต้องแปลงเป็นเวลาทุกตัวอักษร
  // แปลงทันทีจะเถียงกับคนพิมพ์ เช่นพิมพ์ 1 แล้วเด้งเป็น 01:00 ทั้งที่กำลังจะพิมพ์ 10
  const [text, setText] = React.useState<string | null>(null);
  // เวลาปัจจุบันอ่านตอนเปิดกล่อง ไม่ใช่ตอน render — server กับ client จะได้ไม่ต่างกัน
  const [now, setNow] = React.useState("");

  const commit = () => {
    if (text === null) return;
    if (text.trim() === "") setValue("");
    else setValue(parseTime(text) ?? current);
    setText(null);
  };

  const [hh, mm] = (parseTime(current) ?? "--:--").split(":");

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
          disabled={disabled}
          // แป้นตัวเลขบนมือถือ ไม่ใช่แป้นตัวอักษรเต็มที่ต้องสลับโหมดเอง
          inputMode="numeric"
          autoComplete="off"
          placeholder={placeholder}
          className="tabular-nums"
          value={text ?? current}
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
            <InputGroupButton
              size="icon-sm"
              disabled={disabled}
              aria-label="เลือกเวลาจากรายการ"
            >
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
        <Button
          className="h-11 w-full"
          onClick={() => {
            setValue(now);
            setOpen(false);
          }}
        >
          <ClockIcon />
          ตอนนี้ <span className="tabular-nums">{now}</span>
        </Button>

        {/* ป้ายอยู่นอกกรอบวงล้อ แถบกลางจึงเริ่มที่ขอบบนของวงล้อพอดี
            ไม่ต้องเดาว่าป้ายสูงเท่าไหร่แล้วบวกชดเชยเอา
            และแถบเดียวพาดสองคอลัมน์ ไม่ใช่สองแถบแยกกันมีร่องตรงกลาง */}
        <div className="mt-3 border-t border-border pt-3">
          <div className="grid grid-cols-2 gap-2 text-center text-xs text-muted-foreground">
            <span>ชั่วโมง</span>
            <span>นาที</span>
          </div>

          <div className="relative mt-1">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 rounded-md bg-brand"
              style={{ top: PAD, height: ITEM_H }}
            />
            <div className="relative grid grid-cols-2 gap-2">
              <Wheel
                label="ชั่วโมง"
                options={HOURS}
                value={hh === "--" ? now.slice(0, 2) : hh}
                onChange={(h) => setValue(`${h}:${mm === "--" ? "00" : mm}`)}
              />
              <Wheel
                label="นาที"
                options={MINUTES}
                value={mm === "--" ? "00" : mm}
                prefix=":"
                onChange={(m) =>
                  setValue(`${hh === "--" ? now.slice(0, 2) : hh}:${m}`)
                }
              />
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

/**
 * วงล้อเลื่อนหาตัวเลข
 *
 * เลื่อนแล้วหยุดตรงไหน ค่าตรงนั้นคือค่าที่เลือก ไม่ต้องกดอีกที
 * ใช้ scroll snap ของเบราว์เซอร์ทำการดูดเข้าแถว ไม่ได้เขียน physics เอง
 * นิ้วปล่อยแล้วมันไหลต่อและหยุดพอดีแถวให้เอง เหมือนวงล้อบนมือถือ
 *
 * ขอบบนล่างจางหายไปด้วย mask ไม่ใช่เส้นตัด
 * ตัวเลขที่ยังไม่ถึงกลางจึงค่อย ๆ โผล่ ไม่ใช่โผล่มาเต็มตัวแล้วหายวับ
 */
function Wheel({
  label,
  options,
  value,
  onChange,
  prefix = "",
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  prefix?: string;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const settle = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  // ครั้งแรกกระโดดไปเลย ครั้งต่อ ๆ ไปค่อยเลื่อนให้เห็น
  // เปิดกล่องมาแล้วเห็นวงล้อกำลังวิ่งหาที่คือเสียเวลาเปล่า
  const jumped = React.useRef(false);

  const index = Math.max(0, options.indexOf(value));

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const target = index * ITEM_H;
    // ห่างไม่ถึงหนึ่งแถวแปลว่ามันมาจากการเลื่อนของคนใช้เอง อย่าไปดึงซ้ำ
    if (Math.abs(el.scrollTop - target) < 2) return;
    el.scrollTo({
      top: target,
      behavior: jumped.current ? "smooth" : "instant",
    });
    jumped.current = true;
  }, [index]);

  // เบราว์เซอร์ยิง scroll รัว ๆ ระหว่างที่ยังไหลอยู่
  // รอให้นิ่งก่อนค่อยอ่านว่าหยุดที่แถวไหน ไม่งั้นค่าจะกระพริบไปตลอดทาง
  const handleScroll = () => {
    if (settle.current) clearTimeout(settle.current);
    settle.current = setTimeout(() => {
      const el = ref.current;
      if (!el) return;
      const i = Math.min(
        options.length - 1,
        Math.max(0, Math.round(el.scrollTop / ITEM_H))
      );
      if (options[i] !== value) onChange(options[i]);
    }, 100);
  };

  return (
    <div
      ref={ref}
      onScroll={handleScroll}
      role="listbox"
      aria-label={label}
      tabIndex={0}
      className={cn(
        "snap-y snap-mandatory overflow-y-auto overscroll-contain",
        "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        // ขอบบนล่างจางหายด้วย mask ไม่ใช่เส้นตัด ตัวเลขจึงค่อย ๆ โผล่
        "[mask-image:linear-gradient(to_bottom,transparent,#000_30%,#000_70%,transparent)]",
        "focus-visible:outline-none"
      )}
      style={{
        height: VISIBLE * ITEM_H,
        paddingTop: PAD,
        paddingBottom: PAD,
      }}
    >
      {options.map((o) => {
        const on = o === value;
        return (
          <button
            key={o}
            type="button"
            role="option"
            aria-selected={on}
            onClick={() => onChange(o)}
            style={{ height: ITEM_H }}
            className={cn(
              "flex w-full snap-center items-center justify-center",
              "text-base tabular-nums transition-colors",
              on ? "font-semibold text-primary" : "text-muted-foreground"
            )}
          >
            {prefix}
            {o}
          </button>
        );
      })}
    </div>
  );
}
