import { Badge } from "@peckey954/ui/components/ui/badge";
import { cn } from "@peckey954/ui/lib/utils";

/**
 * ป้ายบอกจำนวนงานค้าง — พื้นส้มอ่อน ตัวอักษรส้ม ไม่มีเส้นขอบ ตามไฟล์ Figma
 *
 * ค่าเริ่มต้นของ Badge tone="brand" appearance="soft" ใน DS
 * ใช้ตัวอักษรสีเข้มและมีเส้นขอบส้ม (ตั้งใจให้ตรงกับกรอบ radio ตอนถูกเลือก)
 * ที่นี่จึงเขียนทับตัวแปร --bdg-* ซึ่งเป็นช่องทางที่ Badge เปิดไว้
 * ให้ปรับสีได้อยู่แล้ว ยังเป็น token ล้วน ไม่มีค่าสีจริง
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
        "[--bdg-text:var(--primary)] [--bdg-border:transparent]",
        className
      )}
    >
      รอ {count}
    </Badge>
  );
}
