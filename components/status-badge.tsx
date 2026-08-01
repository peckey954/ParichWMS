import { Badge } from "@peckey954/ui/components/ui/badge";
import { cn } from "@peckey954/ui/lib/utils";

export type OrderStatus = "waiting" | "running" | "done" | "cancelled";

// สีของแต่ละสถานะอ้าง token เท่านั้น ค่าจริงอยู่ใน app/brand.css
const STATUS: Record<OrderStatus, { label: string; className: string }> = {
  waiting: { label: "รอผลิต", className: "bg-warning text-warning-foreground" },
  running: { label: "กำลังผลิต", className: "bg-info text-info-foreground" },
  done: { label: "ผลิตเสร็จ", className: "bg-success text-success-foreground" },
  cancelled: {
    label: "ยกเลิก",
    className: "bg-muted text-muted-foreground",
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
  return <Badge className={cn(s.className, className)}>{s.label}</Badge>;
}
