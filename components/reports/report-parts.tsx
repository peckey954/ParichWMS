"use client";

import { Badge } from "@peckey954/ui/components/ui/badge";
import { cn } from "@peckey954/ui/lib/utils";
import { DOC_STATUS_LABEL, type DocStatus } from "@/lib/reports";

/* ------------------------------------------------------------------
   ชิ้นส่วนเล็ก ๆ ที่ใช้ร่วมกันในหน้าส่งออกรายงาน
------------------------------------------------------------------ */

// เขียนคลาสเต็มทุกตัว ห้ามประกอบชื่อด้วย template string
// Tailwind อ่านซอร์สเป็นข้อความตรง ๆ ถ้าประกอบตอนรัน utility จะไม่ถูกสร้าง
const STATUS_CHIP: Record<DocStatus, string> = {
  complete:
    "[--bdg-surface:var(--chip-green)] [--bdg-text:var(--chip-green-foreground)]",
  draft:
    "[--bdg-surface:var(--chip-yellow)] [--bdg-text:var(--chip-yellow-foreground)]",
  cancelled:
    "[--bdg-surface:var(--chip-red)] [--bdg-text:var(--chip-red-foreground)]",
};

export function StatusChip({ status }: { status: DocStatus }) {
  return (
    <Badge
      appearance="soft"
      className={cn("[--bdg-border:transparent] font-semibold", STATUS_CHIP[status])}
    >
      {DOC_STATUS_LABEL[status]}
    </Badge>
  );
}

/**
 * ตัวเลขสรุปเหนือตาราง
 *
 * มีไว้ให้กระทบยอดก่อนกดดาวน์โหลด ไม่ใช่ของประดับ
 * บัญชีเทียบจำนวนใบกับมูลค่ารวมกับสมุดบัญชีตัวเองก่อนเสมอ
 * ถ้าไม่ตรงจะได้รู้ตั้งแต่ยังไม่โหลดไฟล์ออกไป
 */
export function Stat({
  label,
  value,
  suffix,
  tone,
  /** ค่าที่ยาว เช่น ช่วงวันที่ ใช้ตัวเล็กลง ไม่งั้นโดนตัดท้าย */
  long,
  className,
}: {
  label: string;
  value: string;
  suffix?: string;
  tone?: "warning";
  long?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn("min-w-0 rounded-xl border border-border bg-card p-4", className)}
    >
      <p className="truncate text-sm text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-1 truncate font-semibold tabular-nums",
          long ? "text-base" : "text-xl",
          tone === "warning" && "text-chip-yellow-foreground"
        )}
      >
        {value}
        {suffix && (
          <span className="ml-1 text-sm font-normal text-muted-foreground">
            {suffix}
          </span>
        )}
      </p>
    </div>
  );
}
