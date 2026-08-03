import { Badge } from "@peckey954/ui/components/ui/badge";
import { cn } from "@peckey954/ui/lib/utils";

export type OrderStatus = "waiting" | "running" | "done" | "cancelled";

// สีมาจาก tone ของ Badge ทั้งหมด ไม่ตั้ง class สีเอง
// DS ไม่มี tone "info" — "กำลังผลิต" จึงใช้ brand ซึ่งเป็นสีแบรนด์ สื่อว่ากำลังทำอยู่
const STATUS: Record<
  OrderStatus,
  { label: string; tone: React.ComponentProps<typeof Badge>["tone"] }
> = {
  waiting: { label: "รอผลิต", tone: "warning" },
  running: { label: "กำลังผลิต", tone: "brand" },
  done: { label: "ผลิตเสร็จ", tone: "success" },
  cancelled: { label: "ยกเลิก", tone: "neutral" },
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
    <Badge tone={s.tone} appearance="soft" className={cn(className)}>
      {s.label}
    </Badge>
  );
}
