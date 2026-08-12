import { Badge } from "@peckey954/ui/components/ui/badge";
import { cn } from "@peckey954/ui/lib/utils";

/**
 * ป้ายบอกจำนวนงานค้าง — พื้นส้มอ่อน ตัวอักษรส้มสด ไม่มีเส้นขอบ
 *
 * เขียนทับตัวแปร --bdg-* ซึ่งเป็นช่องทางที่ Badge เปิดไว้ให้ปรับสีอยู่แล้ว
 * ตัวหนาขึ้นเป็น semibold ให้เด่นกว่าข้อความรอบข้าง
 * และ tabular-nums ให้ตัวเลขกว้างเท่ากันทุกตัว ป้ายจะได้ไม่กระตุก
 *
 * หมายเหตุ --primary บนพื้น --brand ได้คอนทราสต์ 2.67:1 ซึ่งต่ำกว่าเกณฑ์ AA
 * เลือกไว้ตามที่ตกลงกันว่าเอาสีส้มสด ตัวเลขจึงไม่ควรเป็นข้อมูลชิ้นเดียว
 * ที่บอกว่ามีงานค้าง ต้องมีที่อื่นบอกซ้ำด้วย
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
        "px-2 py-0.5 font-semibold tabular-nums",
        className
      )}
    >
      รอ {count}
    </Badge>
  );
}
