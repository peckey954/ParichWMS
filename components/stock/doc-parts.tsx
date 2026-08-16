"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Badge } from "@peckey954/ui/components/ui/badge";
import { Button } from "@peckey954/ui/components/ui/button";
import { cn } from "@peckey954/ui/lib/utils";

/* ------------------------------------------------------------------
   ชิ้นส่วนที่ใช้ร่วมกันระหว่างแท็บรอรับเข้ากับแท็บรอจ่าย/คืน
   ทั้งสองแท็บเป็น "เอกสาร" เหมือนกัน จอกว้างเป็นตาราง จอแคบเป็นการ์ด
------------------------------------------------------------------ */

/** กล่องไฮไลต์ในการ์ด — ส้มอ่อน ไม่ใช้เทา ตามแบบ */
export function CardBox({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-lg bg-brand px-3 py-2.5", className)}>
      {children}
    </div>
  );
}

/** แถวหัวการ์ด — เลขที่เอกสารซ้าย เวลาขวา */
export function CardHead({ code, at }: { code: string; at: string }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2">
      <span className="font-semibold">{code}</span>
      <span className="text-sm text-muted-foreground">{at}</span>
    </div>
  );
}

/** คู่ป้ายกำกับ/ค่า ในการ์ด — ป้ายซ้าย ค่าขวา */
export function CardRow({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-muted-foreground">{label}:</dt>
      <dd className={cn("text-right font-semibold tabular-nums", className)}>
        {children}
      </dd>
    </div>
  );
}

/**
 * ป้ายสถานะของใบขอเบิก/ขอคืน
 *
 * คู่สีตรงกับตัวแปรในไฟล์ Figma โหนด 1146-213842 ทุกตัว
 * ห้าสถานะแรกอยู่ในตารางเดียวกัน จึงต้องแยกสีให้ครบห้า ไม่ซ้ำกัน
 */
// เขียนคลาสเต็มทุกตัว ห้ามประกอบชื่อด้วย template string
// Tailwind อ่านซอร์สเป็นข้อความตรง ๆ ถ้าประกอบเอาตอนรัน utility จะไม่ถูกสร้าง
const STATUS_CHIP: Record<string, string> = {
  // กวาดพื้น — ฟ้าอ่อน
  returnSweep:
    "[--bdg-surface:var(--chip-sky)] [--bdg-text:var(--chip-sky-foreground)]",
  // จากภายใน — น้ำเงิน
  returnInternal:
    "[--bdg-surface:var(--chip-blue)] [--bdg-text:var(--chip-blue-foreground)]",
  // จากภายนอก — ม่วง
  returnExternal:
    "[--bdg-surface:var(--chip-purple)] [--bdg-text:var(--chip-purple-foreground)]",
  // จ่ายภายนอก — ส้มแบรนด์
  issueExternal:
    "[--bdg-surface:var(--chip-orange)] [--bdg-text:var(--chip-orange-foreground)]",
  // จ่ายภายใน — เหลือง
  issueInternal:
    "[--bdg-surface:var(--chip-yellow)] [--bdg-text:var(--chip-yellow-foreground)]",

  // เพิ่มสำหรับหน้าประวัติ ใช้จานสีชุดเดียวกันจะได้เป็นชุดเดียว
  inbound:
    "[--bdg-surface:var(--chip-green)] [--bdg-text:var(--chip-green-foreground)]",
  // ย้าย = ม่วง ปรับปรุง = ชมพู ตามแบบ
  move: "[--bdg-surface:var(--chip-purple)] [--bdg-text:var(--chip-purple-foreground)]",
  adjust:
    "[--bdg-surface:var(--chip-pink)] [--bdg-text:var(--chip-pink-foreground)]",
  failed:
    "[--bdg-surface:var(--chip-red)] [--bdg-text:var(--chip-red-foreground)]",
};

export function StatusChip({
  status,
  label,
}: {
  status: string;
  label: string;
}) {
  return (
    <Badge
      appearance="soft"
      className={cn(
        "[--bdg-border:transparent] font-semibold",
        STATUS_CHIP[status]
      )}
    >
      {label}
    </Badge>
  );
}

/** ตัวเลขที่มีทิศทาง — เข้าคลังเป็นเขียว ออกจากคลังเป็นแดง
    เขียวใช้ --success-strong (#16A34A) ตามไฟล์ออกแบบ สดกว่า --success-solid ของ DS */
export function SignedNumber({
  value,
  suffix,
  positive,
}: {
  value: string;
  suffix?: string;
  positive: boolean;
}) {
  return (
    <span
      className={cn(
        "font-semibold tabular-nums",
        positive ? "text-success-strong" : "text-danger-strong"
      )}
    >
      {value}
      {suffix && <span className="ml-1 font-normal">{suffix}</span>}
    </span>
  );
}

/** กล่องว่างเวลาไม่มีผลลัพธ์ */
export function EmptyDocs({
  title,
  hint,
}: {
  title: string;
  hint: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-border px-6 py-14 text-center">
      <p className="font-medium">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{hint}</p>
    </div>
  );
}

/* ------------------------------------------------------------------
   กรอบตาราง — เลื่อนได้ทั้งสองแกนอยู่ข้างใน หัวตารางกับคอลัมน์หน้า/หลังตรึงไว้
------------------------------------------------------------------ */

/**
 * Table ของ DS ห่อตัวเองด้วยกล่อง overflow-x-auto อยู่แล้ว
 * เติมความสูงสูงสุดเข้าไปให้กล่องนั้น มันจึงกลายเป็นตัวเลื่อนแนวตั้งด้วย
 * ผลคือหน้าเว็บไม่ยาวขึ้นตามจำนวนแถว เลื่อนดูข้อมูลอยู่ในกรอบตารางเท่านั้น
 */
export function TableFrame({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-border bg-card",
        "[&_[data-slot=table-container]]:max-h-[60vh]",
        "[&_[data-slot=table-container]]:overflow-auto",
        // ระยะในเซลล์ของ DS คือ px-2 (8px) ซึ่งแน่นเกินไปสำหรับตารางข้อมูลยาว ๆ
        // ตัวเลขสองคอลัมน์ที่ติดกันจะอ่านต่อกันเป็นก้อนเดียว แยกไม่ออกว่าจบตรงไหน
        // ขยับเป็น 16px ทุกด้าน — h-auto แทน h-12 เดิม เพราะหัวคอลัมน์ที่ตัดสองบรรทัด
        // (เช่น "ปริมาณคงเหลือ\nในคลัง") โดนบีบแน่นในกล่องสูงคงที่ ระยะ 16px ต้องได้จริงทุกด้าน
        "[&_th]:h-auto [&_th]:py-4 [&_th]:px-4",
        "[&_td]:px-4 [&_td]:py-3"
      )}
    >
      {children}
    </div>
  );
}

/** หัวตารางตรึงไว้ด้านบนตอนเลื่อนขึ้นลง
 *  เงาทิ้งลงข้างล่างบอกว่าเนื้อหากำลังเลื่อนลอดอยู่ใต้หัวตาราง
 *  แบบเดียวกับเงาของคอลัมน์ตรึงซ้าย/ขวา — เส้นขอบอย่างเดียวไม่พอ
 *  ต้องแปะเงาไว้ที่ th แต่ละอัน ไม่ใช่ thead เพราะ position:sticky ก็ทำไว้ที่ th เหมือนกัน
 *  (thead ตรึงเองไม่ได้ในบางเบราว์เซอร์ จึงต้องตรึงทีละเซลล์) */
export const STICKY_HEAD =
  "[&_th]:sticky [&_th]:top-0 [&_th]:z-20 [&_th]:bg-card [&_th]:shadow-[var(--sticky-shadow-b)]";

/**
 * คอลัมน์แรกตรึงซ้าย คอลัมน์สุดท้ายตรึงขวา เลื่อนแนวนอนได้เฉพาะตรงกลาง
 *
 * มีเงาทิ้งเข้าไปด้านใน บอกว่าเนื้อหากำลังเลื่อนลอดอยู่ข้างใต้คอลัมน์นี้
 * เส้นขอบอย่างเดียวไม่พอ คนอ่านเป็น "ตารางจบตรงนี้" แล้วไม่คิดจะเลื่อนต่อ
 */
export const COL_FIRST =
  "sticky left-0 z-10 border-r border-border bg-card shadow-[var(--sticky-shadow-r)]";
export const COL_LAST =
  "sticky right-0 z-10 border-l border-border bg-card shadow-[var(--sticky-shadow-l)]";
/**
 * เซลล์หัวที่เป็นคอลัมน์ตรึงด้วย ต้องอยู่เหนือทั้งสองชั้น
 *
 * มุมนี้ตรึงทั้งบนและข้าง จึงต้องมีเงาสองทิศพร้อมกัน — รวมไว้ในค่าเดียวด้วย comma
 * แล้วบังคับ !important เพราะ STICKY_HEAD คุม th ทุกตัวด้วย selector ลูกซึ่ง
 * specificity สูงกว่า class เดี่ยวตรงนี้ ไม่บังคับไว้เงาบนจะทับเงาข้างจนหายไป
 */
export const HEAD_FIRST =
  "left-0 z-30! border-r border-border shadow-[var(--sticky-shadow-r),var(--sticky-shadow-b)]!";
export const HEAD_LAST =
  "right-0 z-30! border-l border-border shadow-[var(--sticky-shadow-l),var(--sticky-shadow-b)]!";

/**
 * แบ่งหน้า — ใช้ Button ของ DS ไม่ใช่ Pagination
 * เพราะ Pagination ของ DS สร้างเป็น <a href> ไว้สำหรับเปลี่ยน URL
 * แต่ที่นี่เป็นการเปลี่ยนสถานะในหน้า ปุ่มจึงตรงความหมายกว่าและกด Enter ได้ถูกต้อง
 */
export function TablePager({
  page,
  pages,
  onChange,
}: {
  page: number;
  pages: number;
  onChange: (p: number) => void;
}) {
  if (pages <= 1) return null;

  // หน้าเยอะให้ย่อด้วยจุดไข่ปลา โชว์หน้าแรก หน้าท้าย และรอบ ๆ หน้าปัจจุบัน
  const nums: (number | "gap")[] = [];
  for (let i = 1; i <= pages; i++) {
    if (i === 1 || i === pages || Math.abs(i - page) <= 1) nums.push(i);
    else if (nums.at(-1) !== "gap") nums.push("gap");
  }

  return (
    <nav
      aria-label="แบ่งหน้า"
      className="flex flex-wrap items-center justify-center gap-1 border-t border-border p-3"
    >
      <Button
        variant="ghost"
        size="sm"
        disabled={page === 1}
        onClick={() => onChange(page - 1)}
      >
        <ChevronLeftIcon />
        ก่อนหน้า
      </Button>

      {nums.map((n, i) =>
        n === "gap" ? (
          <span key={`gap-${i}`} className="px-2 text-muted-foreground">
            …
          </span>
        ) : (
          <Button
            key={n}
            variant={n === page ? "outline-primary" : "ghost"}
            size="icon"
            aria-current={n === page ? "page" : undefined}
            onClick={() => onChange(n)}
          >
            {n}
          </Button>
        )
      )}

      <Button
        variant="ghost"
        size="sm"
        disabled={page === pages}
        onClick={() => onChange(page + 1)}
      >
        ถัดไป
        <ChevronRightIcon />
      </Button>
    </nav>
  );
}

/** ตัดข้อมูลตามหน้า พร้อมคืนจำนวนหน้าทั้งหมด */
export function paginate<T>(rows: T[], page: number, size: number) {
  const pages = Math.max(1, Math.ceil(rows.length / size));
  const safe = Math.min(page, pages);
  return { pages, safe, slice: rows.slice((safe - 1) * size, safe * size) };
}
