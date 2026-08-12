// ============================================================
// สต็อกทั่วไป — ของที่ไม่ใช่ปุ๋ยสำเร็จรูป แบ่งตามประเภทการใช้งาน
// หนึ่งสินค้ามีได้หลายล็อต แต่ละล็อตอยู่คนละโซนและมีสภาพต่างกัน
// ============================================================

export type CategoryId = "sack" | "sticker" | "giveaway" | "lineSupply";

export const CATEGORIES: { id: CategoryId; label: string }[] = [
  { id: "sack", label: "กระสอบ" },
  { id: "sticker", label: "สติกเกอร์" },
  { id: "giveaway", label: "ของแจกของแถม" },
  { id: "lineSupply", label: "ของใช้ในไลน์ผลิต" },
];

export const CATEGORY_LABEL: Record<CategoryId, string> = {
  sack: "กระสอบ",
  sticker: "สติกเกอร์",
  giveaway: "ของแจกของแถม",
  lineSupply: "ของใช้ในไลน์ผลิต",
};

/** สภาพของล็อต — ข้อมูลประกอบ ไม่ใช่สถานะที่ต้องรีบจัดการ */
export type LotCondition = "repack" | "accepted" | "sweep";

export const CONDITION_LABEL: Record<LotCondition, string> = {
  repack: "Repack",
  accepted: "รับสภาพ",
  sweep: "กวาดพื้น",
};

/** ยอดที่ค้างอยู่ในระบบ ยังไม่เข้า/ออกจริง */
export type Pending = {
  inbound?: number;
  issue?: number;
  returning?: number;
};

export type Lot = {
  id: string;
  zone: string;
  code: string;
  condition?: LotCondition;
  receivedAt: string;
  ageDays: number;
  qty: number;
  /** คำอธิบายการบรรจุของล็อตนี้ เช่น "500 ชิ้น (0.8 ตัน/ชิ้น)" */
  packNote: string;
  pending: Pending;
  low?: boolean;
};

export type Product = {
  id: string;
  name: string;
  sku: string;
  category: CategoryId;
  /** สเปกการบรรจุ เป็นคุณสมบัติคงที่ ไม่ใช่สถานะ */
  packing: string;
  unit: string;
  low: boolean;
  lots: Lot[];
};

// ---------------------------------------------------------------
// ตัวช่วย
// ---------------------------------------------------------------

export const productTotal = (p: Product) =>
  p.lots.reduce((sum, l) => sum + l.qty, 0);

export const zoneCount = (p: Product) =>
  new Set(p.lots.map((l) => l.zone)).size;

/** รวมยอดค้างของทั้งสินค้า เพื่อยุบเป็นชิปเดียวแทนที่จะโชว์ 3 ใบ */
export function rollupPending(p: Product): Pending {
  const out: Pending = {};
  for (const l of p.lots) {
    if (l.pending.inbound) out.inbound = (out.inbound ?? 0) + l.pending.inbound;
    if (l.pending.issue) out.issue = (out.issue ?? 0) + l.pending.issue;
    if (l.pending.returning)
      out.returning = (out.returning ?? 0) + l.pending.returning;
  }
  return out;
}

export const PENDING_LABEL: Record<keyof Pending, string> = {
  inbound: "รอรับเข้า",
  issue: "รอจ่าย",
  returning: "รอคืน",
};

/** แปลงยอดค้างเป็นรายการสั้น ๆ พร้อมใช้ */
export function pendingEntries(p: Pending, unit: string) {
  return (Object.keys(PENDING_LABEL) as (keyof Pending)[])
    .filter((k) => p[k])
    .map((k) => ({ key: k, label: PENDING_LABEL[k], qty: p[k] as number, unit }));
}

export const formatQty = (v: number) =>
  v.toLocaleString("th-TH", { maximumFractionDigits: 2 });

// ---------------------------------------------------------------
// ข้อมูลตัวอย่าง
// ---------------------------------------------------------------

export const PRODUCTS: Product[] = [
  {
    id: "p1",
    name: "กระสอบพิมพ์ 20-8-8 + 1Mg No Filler",
    sku: "SK-2088-50",
    category: "sack",
    packing: "Bulk",
    unit: "ตัน",
    low: true,
    lots: [
      {
        id: "l1",
        zone: "A-9M",
        code: "FG260512/04",
        receivedAt: "5/14/2026",
        ageDays: 44,
        qty: 8,
        packNote: "500 ชิ้น (0.8 ตัน/ชิ้น)",
        pending: { inbound: 300, issue: 300 },
        low: true,
      },
      {
        id: "l2",
        zone: "A-9M",
        code: "PD260514/04",
        condition: "repack",
        receivedAt: "5/14/2026",
        ageDays: 44,
        qty: 80,
        packNote: "500 ชิ้น (0.8 ตัน/ชิ้น)",
        pending: {},
      },
      {
        id: "l3",
        zone: "B-2L",
        code: "PD260514/07",
        condition: "accepted",
        receivedAt: "5/14/2026",
        ageDays: 44,
        qty: 80,
        packNote: "500 ชิ้น (0.8 ตัน/ชิ้น)",
        pending: {},
      },
    ],
  },
  {
    id: "p2",
    name: "กระสอบเปล่า 50 kg ลายเรือใบ",
    sku: "SK-PLAIN-50",
    category: "sack",
    packing: "50 kg",
    unit: "ใบ",
    low: false,
    lots: [
      {
        id: "l4",
        zone: "A-3M",
        code: "PD260514/11",
        receivedAt: "5/14/2026",
        ageDays: 44,
        qty: 12400,
        packNote: "มัดละ 100 ใบ",
        pending: {},
      },
      {
        id: "l5",
        zone: "C-1S",
        code: "PD260516/02",
        condition: "sweep",
        receivedAt: "5/16/2026",
        ageDays: 42,
        qty: 3200,
        packNote: "มัดละ 100 ใบ",
        pending: { issue: 800 },
      },
    ],
  },
  {
    id: "p3",
    name: "สติกเกอร์แลกแต้ม ปี 2569",
    sku: "ST-POINT-69",
    category: "sticker",
    packing: "ม้วน",
    unit: "ดวง",
    low: true,
    lots: [
      {
        id: "l6",
        zone: "D-4S",
        code: "PD260510/01",
        receivedAt: "5/10/2026",
        ageDays: 48,
        qty: 4800,
        packNote: "8 ม้วน (600 ดวง/ม้วน)",
        pending: { inbound: 20000 },
        low: true,
      },
    ],
  },
  {
    id: "p4",
    name: "สติกเกอร์ QR ตรวจสอบย้อนกลับ",
    sku: "ST-QR-01",
    category: "sticker",
    packing: "ม้วน",
    unit: "ดวง",
    low: false,
    lots: [
      {
        id: "l7",
        zone: "D-4S",
        code: "PD260518/03",
        receivedAt: "5/18/2026",
        ageDays: 40,
        qty: 26000,
        packNote: "26 ม้วน (1,000 ดวง/ม้วน)",
        pending: {},
      },
    ],
  },
  {
    id: "p5",
    name: "เสื้อยืดโปรโมชัน ตราเรือใบ",
    sku: "GF-TEE-01",
    category: "giveaway",
    packing: "ลัง",
    unit: "ตัว",
    low: false,
    lots: [
      {
        id: "l8",
        zone: "E-1S",
        code: "PD260501/09",
        receivedAt: "5/1/2026",
        ageDays: 57,
        qty: 640,
        packNote: "16 ลัง (40 ตัว/ลัง)",
        pending: { returning: 40 },
      },
      {
        id: "l9",
        zone: "E-1S",
        code: "PD260520/02",
        condition: "accepted",
        receivedAt: "5/20/2026",
        ageDays: 38,
        qty: 200,
        packNote: "5 ลัง (40 ตัว/ลัง)",
        pending: {},
      },
    ],
  },
  {
    id: "p6",
    name: "ด้ายเย็บกระสอบ เบอร์ 20",
    sku: "LS-THREAD-20",
    category: "lineSupply",
    packing: "กล่อง",
    unit: "ม้วน",
    low: true,
    lots: [
      {
        id: "l10",
        zone: "F-2M",
        code: "PD260508/05",
        receivedAt: "5/8/2026",
        ageDays: 50,
        qty: 18,
        packNote: "3 กล่อง (6 ม้วน/กล่อง)",
        pending: { inbound: 120 },
        low: true,
      },
    ],
  },
  {
    id: "p7",
    name: "น้ำมันหล่อลื่นสายพาน",
    sku: "LS-OIL-46",
    category: "lineSupply",
    packing: "ถัง 20 ลิตร",
    unit: "ลิตร",
    low: false,
    lots: [
      {
        id: "l11",
        zone: "F-1M",
        code: "PD260512/08",
        receivedAt: "5/12/2026",
        ageDays: 46,
        qty: 300,
        packNote: "15 ถัง (20 ลิตร/ถัง)",
        pending: { issue: 60 },
      },
    ],
  },
];

/**
 * ค้นหาข้ามทุกประเภท — จับทั้งชื่อสินค้า รหัส เลขล็อต และโซน
 * ตั้งใจไม่กรองด้วยประเภทในนี้ เพราะ search ควรมองเห็นทั้งคลัง
 * แล้วค่อยให้ผู้ใช้เลือกย่อลงด้วยชิปทีหลัง
 */
export function matchesQuery(p: Product, q: string): boolean {
  const s = q.trim().toLowerCase();
  if (!s) return true;
  if (p.name.toLowerCase().includes(s)) return true;
  if (p.sku.toLowerCase().includes(s)) return true;
  return p.lots.some(
    (l) =>
      l.code.toLowerCase().includes(s) || l.zone.toLowerCase().includes(s)
  );
}

export function countByCategory(products: Product[]) {
  const out = {} as Record<CategoryId, number>;
  for (const c of CATEGORIES) out[c.id] = 0;
  for (const p of products) out[p.category] += 1;
  return out;
}
