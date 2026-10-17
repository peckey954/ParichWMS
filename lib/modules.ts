// ============================================================
// ทะเบียนโมดูลของระบบ — เป็นแหล่งข้อมูลเดียว
// ทั้งหน้าเมนูหลักและเมนูข้างใช้ไฟล์นี้ร่วมกัน เพิ่มโมดูลใหม่ที่เดียวจบ
//
// href ว่าง = ยังไม่ได้ทำหน้านั้น การ์ดจะกดไม่ได้และขึ้นป้ายบอกไว้
// จะได้ไม่หลอกให้กดแล้วเจอ 404
// ============================================================

import { QI_TEMPLATES, REPORT_TYPES, templateOf } from "@/lib/qc-erp";

export type ModuleGroupId =
  | "purchase"
  | "receiving"
  | "warehouse"
  | "production"
  | "qc"
  | "accounting"
  | "settings";

/** สีประจำหมวด อ้าง token ล้วน ไม่มีค่าสีจริงในนี้ */
export type GroupTone = "yellow" | "blue" | "orange" | "purple" | "sky" | "pink";

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
  /**
   * ไอคอนประจำหมวด ใช้ที่เดียวคือปุ่มยุบในเมนูข้างตอนหุบ
   *
   * ใส่เฉพาะหมวดที่ไม่มี tone — หมวดพวกนี้ไม่มีไอคอนรายตัวให้วาด แต่แถบเมนู
   * ตอนหุบเหลือแค่ไอคอนอย่างเดียว จึงต้องมีสัญลักษณ์ระดับหมวดไว้หนึ่งตัว
   * เป็นการตัดสินใจครั้งเดียวตอนตั้งหมวด ไม่ใช่ทุกครั้งที่สร้างฟอร์มใหม่
   * ซึ่งเป็นสิ่งเดียวที่การไม่มีไอคอนรายตัวตั้งใจจะเลี่ยง
   */
  icon?: string;
};

export const MODULE_GROUPS: ModuleGroup[] = [
  { id: "purchase", label: "การสั่งซื้อสินค้า", tone: "yellow" },
  { id: "receiving", label: "การรับเข้าสินค้า", tone: "sky" },
  { id: "warehouse", label: "การคลังสินค้า", tone: "blue" },
  { id: "production", label: "การผลิตสินค้า", tone: "orange" },
  { id: "qc", label: "การตรวจคุณภาพสินค้า", icon: "clipboardCheck" },
  { id: "accounting", label: "บัญชี", tone: "pink" },
  { id: "settings", label: "ตั้งค่าระบบ", tone: "purple" },
];

export type ModuleItem = {
  id: string;
  group: ModuleGroupId;
  label: string;
  /**
   * ชื่อแบบสั้นสำหรับจอแคบ ใส่เฉพาะเมนูที่ชื่อเต็มยาวจนโดนตัดบนมือถือ
   * ไม่ใส่ = ใช้ชื่อเต็มทุกขนาดจอ
   *
   * ใช้เฉพาะการ์ดของหมวดที่มีไอคอน ซึ่งเรียงสองใบต่อแถวบนมือถือจึงมีที่แคบ
   * หมวดที่ไม่มีไอคอนเรียงใบละแถวอยู่แล้ว โชว์ชื่อเต็มได้เลย
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
  /**
   * หมวดย่อยในหน้าหลัก — id ใน REPORT_TYPES ใช้กับหมวดตรวจคุณภาพเท่านั้น
   * ไม่ใส่คือไปอยู่กลุ่ม "อื่น ๆ" ท้ายหมวด
   */
  reportType?: string;
  /**
   * เทมเพลตที่การ์ดนี้เป็นหน้าทำงานให้ — ใส่แล้วหมวดย่อยอ่านจากเทมเพลต
   * แก้ประเภทรายงานในหน้าตั้งค่าแล้วการ์ดย้ายหมวดตาม ไม่ต้องมาแก้ไฟล์นี้
   * และเทมเพลตที่มีการ์ดแล้วจะไม่งอกการ์ดซ้ำอีกใบ
   */
  templateIds?: string[];
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

  // ---------- การรับเข้าสินค้า ----------
  // ยังไม่มีหน้าของตัวเอง การ์ดจึงกดไม่ได้และขึ้นป้ายบอกไว้
  { id: "rcv-raw", group: "receiving", label: "รับเข้าวัตถุดิบ", code: "FM-ST-01-05", icon: "rcvRaw" },
  { id: "rcv-production", group: "receiving", label: "รับเข้าผลิต", code: "FM-PD-01-03", icon: "rcvProduction" },
  { id: "rcv-product", group: "receiving", label: "รับเข้าสินค้า", code: "FM-ST-01-05", icon: "rcvProduct" },
  {
    id: "rcv-general",
    group: "receiving",
    label: "รับเข้าสินค้าทั่วไป",
    shortLabel: "รับเข้าทั่วไป",
    code: "FM-ST-01-05",
    icon: "rcvGeneral",
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
  {
    id: "qc-raw",
    group: "qc",
    label: "ตรวจรับวัตถุดิบ",
    code: "FM-QC-02-03",
    icon: "filePlus",
    href: "/qc/raw-receiving",
    // เท่ากับจำนวนใบในแท็บรอตรวจวัตถุดิบ — ตัวเลขบนการ์ดกับในหน้าต้องตรงกัน
    pending: 11,
    templateIds: ["t-rm"],
  },
  {
    id: "qc-fg-in",
    group: "qc",
    label: "ตรวจรับสินค้า",
    code: "FM-QC-02-03",
    icon: "packageSearch",
    href: "/qc/goods-receiving",
    reportType: "rt-incoming",
  },
  {
    id: "qc-pre",
    group: "qc",
    label: "ตรวจวัตถุดิบก่อนผลิต",
    shortLabel: "ตรวจก่อนผลิต",
    code: "FM-PD-01-03",
    icon: "listTodo",
    templateIds: ["t-pre"],
  },
  {
    id: "qc-check",
    group: "qc",
    label: "QC ตรวจสอบ",
    code: "FM-QC-02-05",
    icon: "clipboardCheck",
    href: "/qc/checks",
    pending: 3,
    // หน้านี้คือใบตรวจในคลังที่ทำซ้ำตามรอบ ทั้งวัตถุดิบและสินค้า
    templateIds: ["t-tank-rm", "t-tank-fg"],
  },
  { id: "qc-machine", group: "qc", label: "ตรวจเครื่องจักร", code: "FM-PD-01-03", icon: "scanSearch", templateIds: ["t-machine"] },
  { id: "qc-inline", group: "qc", label: "ตรวจระหว่างผลิต", code: "FM-ST-01-02", icon: "searchCheck", reportType: "rt-production" },
  { id: "qc-post", group: "qc", label: "ตรวจหลังผลิต", code: "FM-QC-02-04", icon: "packageCheck", templateIds: ["t-post"] },
  { id: "qc-warehouse", group: "qc", label: "ตรวจคลังสินค้า", code: "FM-ST-01-02", icon: "search", templateIds: ["t-warehouse"] },
  { id: "qc-complaint", group: "qc", label: "ร้องเรียนลูกค้า", code: "FM-PD-01-03", icon: "complaint", pending: 2, templateIds: ["t-complaint"] },

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
    id: "qc-setup-erp",
    group: "settings",
    label: "ตั้งค่ารายงาน QC",
    description:
      "สร้างและแก้ไขรายงานตรวจคุณภาพ ประเภทรายงาน หัวข้อตรวจ และการบังคับใช้กับการรับ–จ่ายของ",
    code: "FM-QC-02-04",
    icon: "clipboardCheck",
    href: "/qc/setup-erp",
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
    href: "/approve/setup",
  },
];

/** รายการที่อยู่ในหน้าตั้งค่าระบบ — ดึงจาก MODULES ไม่เก็บซ้ำอีกชุด
 *  เพิ่มการตั้งค่าใหม่ที่ MODULES ที่เดียว ทั้งเมนูหลักและหน้า /settings เห็นพร้อมกัน */
export const SETTINGS_ITEMS: ModuleItem[] = MODULES.filter(
  (m) => m.group === "settings",
);

/**
 * เมนูที่งอกจากเทมเพลต — ตั้งเทมเพลตเสร็จแล้วมีที่ให้ทำงานทันที
 *
 * เคยต้องมาเพิ่มเมนูมือทุกครั้งที่มีฟอร์มใหม่ ซึ่งแปลว่าวันหนึ่งจะลืม แล้ว
 * เทมเพลตที่ตั้งไว้จะไม่มีใครเจอ — เกิดขึ้นแล้วกับฟอร์มตรวจสินค้าสำเร็จรูป
 *
 * งอกทุกเทมเพลตที่เปิดใช้และยังไม่มีการ์ดของตัวเอง ไปอยู่หมวดย่อยตามประเภท
 * รายงานที่ตั้งไว้ ตั้งประเภทใหม่แล้วหมวดใหม่ขึ้นในหน้าหลักเลย
 *
 * หน้าคิวทำได้แค่ฟอร์มที่มีขั้นย่อยของการผลิต — ที่เหลือขึ้นเป็นการ์ดที่ยังกด
 * ไม่ได้ ดีกว่าไม่ขึ้นเลยจนคนนึกว่าตั้งไม่ติด
 */
export const templateModules = (): ModuleItem[] => {
  const claimed = new Set(MODULES.flatMap((m) => m.templateIds ?? []));
  return QI_TEMPLATES.filter((t) => t.active && !claimed.has(t.id)).map((t) => ({
    id: `qc-tpl-${t.id}`,
    group: "qc" as const,
    label: t.name,
    code: t.code,
    icon: "packageCheck",
    href:
      t.phase === "production" && t.prodSteps.length > 0
        ? `/qc/queue/${t.id}`
        : undefined,
    reportType: t.reportType || undefined,
  }));
};

/** หมวดย่อยของการ์ด — การ์ดที่ผูกเทมเพลตอ่านจากเทมเพลต ไม่ใช่ค่าที่เขียนค้างไว้ */
export const reportTypeOfModule = (m: ModuleItem): string | undefined => {
  const tpl = m.templateIds?.map(templateOf).find(Boolean);
  return tpl ? tpl.reportType || undefined : m.reportType;
};

/**
 * แบ่งการ์ดของหมวดหนึ่งเป็นหมวดย่อยตามประเภทรายงาน เรียงตามทะเบียนประเภท
 * การ์ดที่ไม่มีประเภทไม่ถูกวาด — หมวดที่ไม่มีการ์ดไหนมีประเภทเลยคืนก้อนเดียว
 * ไม่มีหัวข้อย่อย หน้าหลักจะได้วาดแบบเดิม
 */
export function subgroupsOf(
  items: ModuleItem[]
): { id: string; label: string | null; items: ModuleItem[] }[] {
  if (!items.some((m) => reportTypeOfModule(m))) {
    return [{ id: "all", label: null, items }];
  }
  const known = REPORT_TYPES.map((t) => ({
    id: t.id,
    label: t.label as string | null,
    items: items.filter((m) => reportTypeOfModule(m) === t.id),
  }));
  // การ์ดที่ยังไม่มีประเภทไม่ขึ้นในหน้าหลัก — ตั้งประเภทในหน้าตั้งค่ารายงานก่อน
  // ยังหาได้จากเมนูข้างและช่องค้นหา
  return known.filter((g) => g.items.length > 0);
}

/** เมนูทั้งหมด = ที่เขียนไว้ตายตัว + ที่งอกจากเทมเพลต */
export const allModules = (): ModuleItem[] => [...MODULES, ...templateModules()];

export const modulesOf = (group: ModuleGroupId) =>
  allModules().filter((m) => m.group === group);

export const readyModules = () => allModules().filter((m) => m.href);

export function searchModules(q: string): ModuleItem[] {
  const s = q.trim().toLowerCase();
  const all = allModules();
  if (!s) return all;
  // ค้นชื่อย่อได้ด้วย คนที่เห็นชื่อย่อบนมือถือจะได้พิมพ์ตามที่เห็นแล้วเจอ
  return all.filter(
    (m) =>
      m.label.toLowerCase().includes(s) ||
      m.shortLabel?.toLowerCase().includes(s) ||
      m.code.toLowerCase().includes(s)
  );
}
