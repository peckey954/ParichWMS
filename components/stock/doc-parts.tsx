"use client";

import { Badge } from "@peckey954/ui/components/ui/badge";
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
 * ใช้ token ที่มีอยู่แล้วทั้งหมด สองสีของสภาพล็อต (ฟ้า/ม่วง) ถูกเลือกมา
 * ให้ผ่านคอนทราสต์กับตัวอักษรขนาดเล็กอยู่แล้ว จึงหยิบมาใช้ต่อได้เลย
 */
const STATUS_CHIP: Record<string, string> = {
  returnSweep:
    "[--bdg-surface:var(--tone-blue)] [--bdg-text:var(--tone-blue-foreground)]",
  returnInternal:
    "[--bdg-surface:var(--tone-blue)] [--bdg-text:var(--tone-blue-foreground)]",
  returnExternal:
    "[--bdg-surface:var(--tone-violet)] [--bdg-text:var(--tone-violet-foreground)]",
  issueExternal:
    "[--bdg-surface:var(--brand)] [--bdg-text:var(--primary)]",
  issueInternal:
    "[--bdg-surface:var(--warning)] [--bdg-text:var(--warning-foreground)]",

  // เพิ่มสำหรับหน้าประวัติ
  inbound:
    "[--bdg-surface:var(--success)] [--bdg-text:var(--success-foreground)]",
  move: "[--bdg-surface:var(--brand)] [--bdg-text:var(--primary)]",
  adjust:
    "[--bdg-surface:var(--tone-violet)] [--bdg-text:var(--tone-violet-foreground)]",
  failed:
    "[--bdg-surface:var(--danger)] [--bdg-text:var(--danger-strong)]",
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

/** ตัวเลขที่มีทิศทาง — เข้าคลังเป็นเขียว ออกจากคลังเป็นแดง */
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
        positive ? "text-success-solid" : "text-danger-strong"
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
