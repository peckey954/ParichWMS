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
  | "accounting"
  | "settings";

/** สีประจำหมวด อ้าง token ล้วน ไม่มีค่าสีจริงในนี้ */
export type GroupTone = "yellow" | "blue" | "orange" | "purple" | "sky";

export type ModuleGroup = {
  id: ModuleGroupId;
  label: string;
  /**
   * ไม่ใส่ tone = หมวดนี้ไม่มีสีประจำ การ์ดจะไม่มีไอคอน และไม่มีจุดสีหน้าชื่อหมวด
   *
   * ใช้กับหมวดที่รายการข้างในจะถูกสร้างเพิ่มเองในอนาคต — ฟอร์มตรวจคุณภาพ
   * ตั้งใจให้ผู้ใช้สร้างเทมเพลตเองได้ ถ้าการ์ดต้องมีไอคอน ทุกครั้งที่สร้างฟอร์ม
   * ใหม่จะต้องมีคนตัดสินใจเรื่องไอคอนก่อน ซึ่งไม่ใช่งานของคนที่มาสร้างฟอร์มตรวจ
   */
  tone?: GroupTone;
};

export const MODULE_GROUPS: ModuleGroup[] = [
  { id: "purchase", label: "การสั่งซื้อสินค้า", tone: "yellow" },
  { id: "warehouse", label: "การคลังสินค้า", tone: "blue" },
  { id: "production", label: "การผลิตสินค้า", tone: "orange" },
  { id: "qc", label: "การตรวจคุณภาพสินค้า" },
  { id: "accounting", label: "บัญชี", tone: "sky" },
  { id: "settings", label: "ตั้งค่าระบบ", tone: "purple" },
];

export type ModuleItem = {
  id: string;
  group: ModuleGroupId;
  label: string;
  /**
   * ชื่อแบบสั้นสำหรับจอแคบ ใส่เฉพาะเมนูที่ชื่อเต็มยาวจนโดนตัดบนมือถือ
   * ไม่ใส่ = ใช้ชื่อเต็มทุกขนาดจอ
   */
  shortLabel?: string;
  code: string;
  /** ชื่อไอคอน แมปเป็น component ที่ components/modules/module-icon.tsx
   *  หมวดที่ไม่มี tone ไม่ใช้ค่านี้ — ใส่ไว้ก็ไม่ถูกวาด */
  icon: string;
  /** คำอธิบายสั้น ๆ ใช้ในหน้ารวมการตั้งค่า ไม่ได้โชว์บนการ์ดหน้าเมนูหลัก */
  description?: string;
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
  {
    id: "pr",
    group: "purchase",
    label: "ขอซื้อ PR",
    code: "FM-ST-01-05",
    icon: "squareCheck",
    href: "/pr",
  },
  { id: "po", group: "purchase", label: "สั่งซื้อ PO", code: "FM-ST-01-05", icon: "cart", href: "/po" },
  {
    id: "approve",
    group: "purchase",
    label: "อนุมัติ",
    code: "FM-PD-01-03",
    icon: "circleCheck",
    href: "/approve",
    pending: 12,
  },
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
  {
    id: "recipe",
    group: "production",
    label: "สูตรการผลิตประจำสัปดาห์",
    shortLabel: "สูตรประจำสัปดาห์",
    code: "FM-PD-01-03",
    icon: "listOrdered",
    href: "/production/recipe",
  },

  // ---------- การตรวจคุณภาพสินค้า ----------
  { id: "qc-raw", group: "qc", label: "ตรวจรับวัตถุดิบ", code: "FM-QC-02-03", icon: "filePlus", pending: 7 },
  {
    id: "qc-fg-in",
    group: "qc",
    label: "ตรวจรับสินค้า",
    code: "FM-QC-02-03",
    icon: "packageSearch",
    href: "/qc/goods-receiving",
  },
  {
    id: "qc-pre",
    group: "qc",
    label: "ตรวจวัตถุดิบก่อนผลิต",
    shortLabel: "ตรวจก่อนผลิต",
    code: "FM-PD-01-03",
    icon: "listTodo",
  },
  {
    id: "qc-check",
    group: "qc",
    label: "QC ตรวจสอบ",
    code: "FM-QC-02-05",
    icon: "clipboardCheck",
    href: "/qc/checks",
    pending: 3,
  },
  { id: "qc-machine", group: "qc", label: "ตรวจเครื่องจักร", code: "FM-PD-01-03", icon: "scanSearch" },
  { id: "qc-inline", group: "qc", label: "ตรวจระหว่างผลิต", code: "FM-ST-01-02", icon: "searchCheck" },
  { id: "qc-post", group: "qc", label: "ตรวจหลังผลิต", code: "FM-QC-02-04", icon: "packageCheck" },
  { id: "qc-warehouse", group: "qc", label: "ตรวจคลังสินค้า", code: "FM-ST-01-02", icon: "search" },
  { id: "qc-complaint", group: "qc", label: "ร้องเรียนลูกค้า", code: "FM-PD-01-03", icon: "complaint", pending: 2 },

  // ---------- บัญชี ----------
  {
    id: "report",
    group: "accounting",
    label: "ส่งออกรายงาน",
    code: "FM-PD-01-01",
    icon: "fileOutput",
    href: "/reports",
  },

  // ---------- ตั้งค่าระบบ ----------
  // ไม่ใช่งานประจำวัน แต่อยู่ท้ายเมนูหลักเพื่อให้หาเจอโดยไม่ต้องรู้มาก่อน
  // ว่าต้องไปที่เมนูข้าง — ของที่ตั้งครั้งเดียวแล้วใช้ยาวมักถูกลืมว่าตั้งที่ไหน
  {
    id: "qc-template",
    group: "settings",
    label: "ตั้งค่ารายงาน QC",
    description: "สร้างและแก้ไขโครงฟอร์มตรวจคุณภาพ กำหนดช่วงเวลาที่ใช้และกลุ่มผู้ใช้",
    code: "FM-QC-02-03",
    icon: "clipboardCheck",
    href: "/qc/setup",
  },
  {
    id: "safety-stock",
    group: "settings",
    label: "ตั้งค่า Safety Stock",
    description: "แบ่งอันดับ A/B/C จากยอดขายคาดการณ์ และกำหนด % สำรองของแต่ละอันดับ",
    code: "FM-ST-01-05",
    icon: "boxes",
    href: "/stock/safety-stock",
  },
  {
    id: "pr-setup",
    group: "settings",
    label: "ตั้งค่าคลังสินค้า",
    description: "คลัง ประเภทสินค้าที่ขอซื้อได้ หมวดสินค้า และรายการสินค้าในแต่ละคลัง",
    code: "FM-ST-01-05",
    icon: "warehouse",
    href: "/pr/setup",
  },
  {
    id: "approve-setup",
    group: "settings",
    label: "ตั้งค่าการอนุมัติ",
    description: "ลำดับขั้นการอนุมัติ วงเงินของแต่ละขั้น และผู้มีสิทธิ์อนุมัติ",
    code: "FM-PD-01-03",
    icon: "circleCheck",
  },
  {
    id: "design-system",
    group: "settings",
    label: "Design system",
    description: "ตัวอย่าง component และโทเคนสีทั้งหมดที่ระบบใช้",
    code: "FM-PD-01-01",
    icon: "palette",
    href: "/design-system",
  },
];

/**
 * ท้ายเมนูข้างมีรายการเดียว พาไปหน้ารวมการตั้งค่า
 * เมนูข้างเป็นทางลัดสำหรับคนที่รู้อยู่แล้วว่าจะไปไหน ส่วนคนที่ยังไม่รู้
 * จะเจอหมวด "ตั้งค่าระบบ" ที่ท้ายเมนูหลักอยู่แล้ว
 */
export const SYSTEM_LINK = {
  id: "settings",
  label: "ตั้งค่าระบบ",
  icon: "settings",
  href: "/settings",
};

/** รายการที่อยู่ในหน้าตั้งค่าระบบ — ดึงจาก MODULES ไม่เก็บซ้ำอีกชุด
 *  เพิ่มการตั้งค่าใหม่ที่ MODULES ที่เดียว ทั้งเมนูหลักและหน้า /settings เห็นพร้อมกัน */
export const SETTINGS_ITEMS: ModuleItem[] = MODULES.filter(
  (m) => m.group === "settings",
);

export const modulesOf = (group: ModuleGroupId) =>
  MODULES.filter((m) => m.group === group);

export const readyModules = () => MODULES.filter((m) => m.href);

export function searchModules(q: string): ModuleItem[] {
  const s = q.trim().toLowerCase();
  if (!s) return MODULES;
  // ค้นชื่อย่อได้ด้วย คนที่เห็นชื่อย่อบนมือถือจะได้พิมพ์ตามที่เห็นแล้วเจอ
  return MODULES.filter(
    (m) =>
      m.label.toLowerCase().includes(s) ||
      m.shortLabel?.toLowerCase().includes(s) ||
      m.code.toLowerCase().includes(s)
  );
}
