import { Badge } from "@peckey954/ui/components/ui/badge";
import { cn } from "@peckey954/ui/lib/utils";

/**
 * ป้ายบอกจำนวนงานค้าง — พื้นส้มทึบ ตัวอักษรขาว
 *
 * ใช้ appearance="solid" tone="brand" ของ DS ตรง ๆ ไม่ต้องเขียนทับอะไร
 * พื้นทึบคือ --primary (#F97316) ตัวอักษรคือ --primary-foreground
 *
 * เลือกแบบทึบเพราะป้ายนี้ต้องสะดุดตาที่สุดบนการ์ด แบบพื้นอ่อนกลืนกับ
 * กล่องไอคอนที่เป็นสีอ่อนเหมือนกัน ส่วนตัวเลขให้อ่านง่ายขึ้นด้วยเลขความกว้างเท่ากัน
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
      appearance="solid"
      className={cn("px-2 py-0.5 tabular-nums", className)}
    >
      รอ {count}
    </Badge>
  );
}
