import { Badge } from "@peckey954/ui/components/ui/badge";
import { cn } from "@peckey954/ui/lib/utils";

export type OrderStatus = "waiting" | "running" | "done" | "cancelled";

/**
 * ป้ายสถานะใบผลิต — ใช้สีชุดเดียวกับป้ายในหน้ารายการ
 *
 * เดิมหน้านี้ใช้ tone ของ Badge (warning/brand/success) ส่วนหน้ารายการใช้ชิป
 * ใบเดียวกันจึงเป็นคนละสีระหว่างสองหน้า กดเข้ามาแล้วเหมือนเปลี่ยนสถานะไปเอง
 *
 * เขียนคลาสเต็มทุกตัว ห้ามประกอบชื่อด้วย template string
 */
const STATUS: Record<OrderStatus, { label: string; chip: string }> = {
  waiting: {
    label: "รอผลิต",
    chip: "[--bdg-surface:var(--chip-yellow)] [--bdg-text:var(--chip-yellow-foreground)]",
  },
  running: {
    label: "กำลังผลิต",
    chip: "[--bdg-surface:var(--chip-lime)] [--bdg-text:var(--chip-lime-foreground)]",
  },
  done: {
    label: "ผลิตเสร็จ",
    chip: "[--bdg-surface:var(--chip-blue)] [--bdg-text:var(--chip-blue-foreground)]",
  },
  cancelled: {
    label: "ยกเลิก",
    chip: "[--bdg-surface:var(--chip-red)] [--bdg-text:var(--chip-red-foreground)]",
  },
};

export function StatusBadge({
  status,
  className,
}: {
  status: OrderStatus;
  className?: string;
}) {
  const s = STATUS[status];
  return (
    <Badge
      appearance="soft"
      className={cn("[--bdg-border:transparent] font-semibold", s.chip, className)}
    >
      {s.label}
    </Badge>
  );
}
