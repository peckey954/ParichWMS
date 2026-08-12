import { Badge } from "@peckey954/ui/components/ui/badge";
import { cn } from "@peckey954/ui/lib/utils";

/**
 * ป้ายบอกจำนวนงานค้าง — พื้นส้มอ่อน ตัวอักษรส้มเข้ม ไม่มีเส้นขอบ
 *
 * เขียนทับตัวแปร --bdg-* ซึ่งเป็นช่องทางที่ Badge เปิดไว้ให้ปรับสีอยู่แล้ว
 * ตัวอักษรใช้ --brand-strong ไม่ใช่ --primary เพราะ --primary บนพื้น --brand
 * ได้คอนทราสต์แค่ 2.67:1 ซึ่งตกเกณฑ์ ส่วน --brand-strong ได้ 4.97:1
 *
 * ตัวหนาขึ้นเป็น semibold ให้เด่นกว่าข้อความรอบข้าง
 * และ tabular-nums ให้ตัวเลขกว้างเท่ากันทุกตัว ป้ายจะได้ไม่กระตุก
 *
 * รวมไว้ที่เดียวเพื่อให้หน้าเมนูกับเมนูข้างใช้ป้ายหน้าตาเดียวกัน
 */
export function PendingBadge({
  count,
  className,
}: {
  count: number;
  className?: string;
}) {
  return (
    <Badge
      appearance="soft"
      className={cn(
        "[--bdg-text:var(--brand-strong)] [--bdg-border:transparent]",
        "px-2 py-0.5 font-semibold tabular-nums",
        className
      )}
    >
      รอ {count}
    </Badge>
  );
}
