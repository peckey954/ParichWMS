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
