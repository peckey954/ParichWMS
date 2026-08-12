// ============================================================
// ทะเบียนโมดูลของระบบ — เป็นแหล่งข้อมูลเดียว
// ทั้งหน้าเมนูหลักและเมนูข้างใช้ไฟล์นี้ร่วมกัน เพิ่มโมดูลใหม่ที่เดียวจบ
//
// href ว่าง = ยังไม่ได้ทำหน้านั้น การ์ดจะกดไม่ได้และขึ้นป้ายบอกไว้
// จะได้ไม่หลอกให้กดแล้วเจอ 404
// ============================================================

export type ModuleGroupId =
  | "purchase"
  | "warehouse"
  | "production"
  | "qc"
  | "accounting";

/** สีประจำหมวด อ้าง token ล้วน ไม่มีค่าสีจริงในนี้ */
export type GroupTone = "yellow" | "blue" | "orange" | "purple" | "sky";

export type ModuleGroup = {
  id: ModuleGroupId;
  label: string;
  tone: GroupTone;
};

export const MODULE_GROUPS: ModuleGroup[] = [
  { id: "purchase", label: "การสั่งซื้อสินค้า", tone: "yellow" },
  { id: "warehouse", label: "การคลังสินค้า", tone: "blue" },
  { id: "production", label: "การผลิตสินค้า", tone: "orange" },
  { id: "qc", label: "การตรวจคุณภาพสินค้า", tone: "purple" },
  { id: "accounting", label: "บัญชี", tone: "sky" },
];

export type ModuleItem = {
  id: string;
  group: ModuleGroupId;
  label: string;
  code: string;
  /** ชื่อไอคอน แมปเป็น component ที่ components/modules/module-icon.tsx */
  icon: string;
  href?: string;
  /**
   * จำนวนงานที่ค้างรอทำในโมดูลนั้น
   * ใส่เฉพาะโมดูลที่มีคิวงานค้างจริง ไม่ใส่ทุกอัน
   * ถ้าทุกเมนูมีป้ายเหมือนกันหมด ป้ายจะกลายเป็นของประดับ ไม่มีใครมอง
   */
  pending?: number;
};

export const MODULES: ModuleItem[] = [
  // ---------- การสั่งซื้อสินค้า ----------
  { id: "pr", group: "purchase", label: "ขอซื้อ PR", code: "FM-ST-01-05", icon: "squareCheck" },
  { id: "po", group: "purchase", label: "สั่งซื้อ PO", code: "FM-ST-01-05", icon: "cart" },
  { id: "approve", group: "purchase", label: "อนุมัติ", code: "FM-PD-01-03", icon: "circleCheck", pending: 12 },
  {
    id: "weighing",
    group: "purchase",
    label: "ชั่งน้ำหนัก",
    code: "FM-ST-01-05",
    icon: "scale",
    href: "/weighing",
    pending: 3,
  },

  // ---------- การคลังสินค้า ----------
  { id: "stock-raw", group: "warehouse", label: "สต็อกวัตถุดิบ", code: "FM-PD-01-03", icon: "warehouse" },
  { id: "stock-fg", group: "warehouse", label: "สต็อกสินค้า", code: "FM-ST-01-05", icon: "package" },
  {
    id: "stock-general",
    group: "warehouse",
    label: "สต็อกทั่วไป",
    code: "FM-ST-01-05",
    icon: "boxes",
    href: "/stock",
  },

  // ---------- การผลิตสินค้า ----------
  { id: "wo", group: "production", label: "สั่งผลิตสินค้า", code: "FM-PD-01-01", icon: "clipboardPlus" },
  {
    id: "packing",
    group: "production",
    label: "ผลิตแบ่งบรรจุ",
    code: "FM-PD-01-03",
    icon: "clipboardList",
    href: "/production/packing",
    pending: 5,
  },
  { id: "bulk", group: "production", label: "ผลิตปุ๋ย Bulk Blend", code: "FM-PD-01-03", icon: "chart" },
  { id: "recipe", group: "production", label: "สูตรการผลิตประจำสัปดาห์", code: "FM-PD-01-03", icon: "listOrdered" },

  // ---------- การตรวจคุณภาพสินค้า ----------
  { id: "qc-raw", group: "qc", label: "ตรวจรับวัตถุดิบ", code: "FM-QC-02-03", icon: "filePlus", pending: 7 },
  { id: "qc-fg-in", group: "qc", label: "ตรวจรับสินค้า", code: "FM-QC-02-03", icon: "packageSearch" },
  { id: "qc-pre", group: "qc", label: "ตรวจวัตถุดิบก่อนผลิต", code: "FM-PD-01-03", icon: "listTodo" },
  { id: "qc-machine", group: "qc", label: "ตรวจเครื่องจักร", code: "FM-PD-01-03", icon: "scanSearch" },
  { id: "qc-inline", group: "qc", label: "ตรวจระหว่างผลิต", code: "FM-ST-01-02", icon: "searchCheck" },
  { id: "qc-post", group: "qc", label: "ตรวจหลังผลิต", code: "FM-QC-02-04", icon: "packageCheck" },
  { id: "qc-warehouse", group: "qc", label: "ตรวจคลังสินค้า", code: "FM-ST-01-02", icon: "search" },
  { id: "qc-complaint", group: "qc", label: "ร้องเรียนลูกค้า", code: "FM-PD-01-03", icon: "complaint", pending: 2 },

  // ---------- บัญชี ----------
  { id: "report", group: "accounting", label: "ส่งออกรายงาน", code: "FM-PD-01-01", icon: "fileOutput" },
];

/** เมนูตั้งค่าระบบ อยู่ท้ายเมนูข้าง ไม่ใช่โมดูลงานประจำวัน */
export const SYSTEM_LINKS: { id: string; label: string; icon: string; href: string }[] = [
  { id: "qc-template", label: "ตั้งค่าเทมเพลต QC", icon: "settings", href: "/qc/setup" },
  { id: "design-system", label: "Design system", icon: "palette", href: "/design-system" },
];

export const modulesOf = (group: ModuleGroupId) =>
  MODULES.filter((m) => m.group === group);

export const readyModules = () => MODULES.filter((m) => m.href);

export function searchModules(q: string): ModuleItem[] {
  const s = q.trim().toLowerCase();
  if (!s) return MODULES;
  return MODULES.filter(
    (m) =>
      m.label.toLowerCase().includes(s) || m.code.toLowerCase().includes(s)
  );
}
