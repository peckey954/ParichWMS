// ============================================================
// การแจ้งเตือน — สรุปความเคลื่อนไหวของเอกสารจัดซื้อให้ผู้ใช้เห็น ทั้งใน
// กระดิ่งแจ้งเตือนบนหัวเรื่อง (dropdown) และหน้ารวม /notifications
//
// ไม่มี backend จริงตามธรรมชาติของแอปนี้ — ข้อมูลตัวอย่างคงที่ (seeded) อิงจาก
// ใบขอซื้อจริงในระบบ (lib/pr.ts — ไม่ใช่ lib/po.ts เพราะข้อความแจ้งเตือนพวกนี้
// พูดถึง "ใบขอซื้อ" ทั้งหมด ต้องกดแล้วไปหน้าใบขอซื้อ/pr/[id] จริง ไม่ใช่ใบสั่งซื้อ)
// สถานะอ่านแล้ว/ยังไม่อ่านเก็บผ่าน NotificationsProvider (React context ธรรมดา)
// ไม่ persist ข้ามการโหลดหน้าใหม่ — รีเฟรชแล้วกลับมาไม่อ่านใหม่ทุกอันเหมือนเดิม
// ============================================================

import { PR_DOCS, type PrDoc } from "./pr";

export type AppNotification = {
  id: string;
  title: string;
  description: string;
  at: string;
  href: string;
  /** ค่าเริ่มต้นตอนโหลดแอป — ปกติทุกอันเริ่มเป็นยังไม่อ่าน ยกเว้นอันที่ตั้งใจ
      ให้เป็นตัวอย่างของ "อ่านแล้ว" ไว้ล่วงหน้า */
  read?: boolean;
};

function prLabel(d: PrDoc) {
  return `${d.code} · ${d.productName}${d.productSub ? ` ${d.productSub}` : ""}`;
}

const pr = PR_DOCS[1]; // สถานะ "ordered" — ใช้เป็นตัวอย่างหลักของ n1/n2
const cancelledPr = PR_DOCS[4]; // สถานะ "cancelled" จริง — ดึงเหตุผลยกเลิกจริงจากเอกสาร

export const NOTIFICATIONS: AppNotification[] = [
  {
    id: "n1",
    title: "ใบขอซื้อถูกเปลี่ยนข้อมูล",
    description: `${prLabel(pr)} ถูกเปลี่ยนบรรจุภัณฑ์ เป็น ${pr.packing ?? "-"}`,
    at: "16 ม.ค. 26 14:32",
    href: `/pr/${pr.id}`,
  },
  {
    id: "n2",
    title: "ใบขอซื้อได้รับการสั่งซื้อแล้ว",
    description: `${prLabel(pr)} ได้รับการสั่งซื้อแล้ว`,
    at: "16 ม.ค. 26 14:32",
    href: `/pr/${pr.id}`,
  },
  {
    id: "n3",
    title: "ใบขอซื้อถูกยกเลิกแล้ว",
    description: `${prLabel(cancelledPr)} ถูกยกเลิก เหตุผลการยกเลิก: ${cancelledPr.cancelReason ?? "-"}`,
    at: "16 ม.ค. 26 14:32",
    href: `/pr/${cancelledPr.id}`,
    read: true,
  },
];
