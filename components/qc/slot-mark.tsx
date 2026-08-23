"use client";

import { Badge } from "@peckey954/ui/components/ui/badge";
import { cn } from "@peckey954/ui/lib/utils";
import { SLOT_LABEL, type SlotStatus } from "@/lib/qc-check";

/* ------------------------------------------------------------------
   เครื่องหมายบอกสถานะของหนึ่งกะ ใช้ร่วมกันทั้งปฏิทินและตารางแบบ Excel

   หกสถานะ ไม่ใช่สองแบบทำ/ไม่ทำ
   ที่ต้องมี "วันหยุด" แยกออกมาเพราะถ้าไม่มี เสาร์อาทิตย์จะขึ้นแดง
   กลายเป็นความผิดทั้งที่ไม่มีใครต้องมาทำงาน — ตรงกับแถวเทาในฟอร์มกระดาษ

   และต้องแยก "ยังไม่ถึงวัน" ออกจาก "ไม่ได้ตรวจ" ด้วย
   วันที่ยังมาไม่ถึงไม่ใช่ความผิด แต่เป็นช่องว่างเหมือนกัน
------------------------------------------------------------------ */

/** สีของแต่ละสถานะ ใช้ทั้งจุดในปฏิทินและช่องในตาราง */
export const SLOT_TONE: Record<SlotStatus, string> = {
  done: "bg-success-strong",
  abnormal: "bg-danger-strong",
  partial: "bg-warning-solid",
  missing: "bg-muted-foreground/40",
  holiday: "bg-border",
  future: "bg-border",
};

/** จุดกลม ๆ ในช่องปฏิทิน — หนึ่งจุดต่อหนึ่งกะ */
export function SlotDot({
  status,
  title,
}: {
  status: SlotStatus;
  title: string;
}) {
  return (
    <span
      title={title}
      aria-label={title}
      className={cn(
        "size-2 rounded-full",
        SLOT_TONE[status],
        // ไม่ได้ตรวจใช้วงกลมกลวง ไม่ใช่จุดทึบจาง ๆ
        // ช่องว่างต้องอ่านว่า "ไม่มีอะไรอยู่ตรงนี้" ไม่ใช่ "มีอะไรอยู่แต่จาง"
        status === "missing" && "border-2 border-danger-strong bg-transparent",
        status === "future" && "bg-transparent"
      )}
    />
  );
}

/** เครื่องหมายในช่องตารางแบบ Excel */
export function SlotCell({ status }: { status: SlotStatus }) {
  if (status === "done")
    return <span className="text-success-strong">✓</span>;
  if (status === "abnormal")
    return <span className="font-semibold text-danger-strong">✗</span>;
  if (status === "partial")
    return <span className="text-warning-foreground">◐</span>;
  if (status === "missing")
    return <span className="font-semibold text-danger-strong">—</span>;
  return <span className="text-muted-foreground">·</span>;
}

/** ป้ายเต็มคำ ใช้ในหน้ารายละเอียดกับคำอธิบายสัญลักษณ์ */
export function SlotBadge({ status }: { status: SlotStatus }) {
  const tone =
    status === "done"
      ? "success"
      : status === "abnormal"
        ? "danger"
        : status === "partial"
          ? "warning"
          : "neutral";
  return (
    <Badge tone={tone} appearance="soft">
      {SLOT_LABEL[status]}
    </Badge>
  );
}
