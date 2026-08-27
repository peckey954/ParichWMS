// ============================================================
// สั่งซื้อ PO — หน้ารวมงานจัดซื้อ สามช่วง (ขอซื้อ → สั่งซื้อ → ซื้อแล้ว)
//
// แท็บ "ขอซื้อ" ดึงมาจากใบขอซื้อ (lib/pr.ts) เฉพาะใบที่ยังไม่ถูกสั่งซื้อ
// (ส่งคำขอแล้ว) รวมกับใบที่หลุดไประหว่างทาง (ยกเลิก) — สองสถานะนี้เท่านั้น
// ที่ยังอยู่ในคิว "รอสร้างใบสั่งซื้อ" ส่วนใบที่สั่งซื้อไปแล้วขยับไปอยู่แท็บ
// "สั่งซื้อ"/"ซื้อแล้ว" ต่อ ไม่ใช่ของหน้านี้อีกต่อไป
//
// แท็บ "สั่งซื้อ" กับ "ซื้อแล้ว" ยังไม่เปิดใช้งาน — รอไฟล์ออกแบบของสองแท็บนั้น
// ============================================================

import { PR_DOCS, type PrDoc } from "./pr";

export type PoQueueDoc = PrDoc;

/** คิวรอสร้างใบสั่งซื้อ — เฉพาะใบที่ส่งคำขอแล้ว หรือหลุดไปเป็นยกเลิก */
export const PO_QUEUE_DOCS: PoQueueDoc[] = PR_DOCS.filter(
  (d) => d.status === "sent" || d.status === "cancelled"
);

export type PoQueueChip = "all" | "urgent" | "cancelled";

export const PO_QUEUE_CHIP_LABEL: Record<PoQueueChip, string> = {
  all: "ขอซื้อ PR",
  urgent: "เร่งด่วน",
  cancelled: "ยกเลิก",
};

export function matchesPoQueueChip(d: PoQueueDoc, chip: PoQueueChip): boolean {
  if (chip === "urgent") return !!d.urgent;
  if (chip === "cancelled") return d.status === "cancelled";
  return true;
}
