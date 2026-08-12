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

/** ปริมาณในเอกสาร แสดงทศนิยมสองตำแหน่งเสมอ และคั่นหลักพัน */
export const formatAmount = (v: number) =>
  v.toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

// ---------------------------------------------------------------
// ข้อมูลตัวอย่าง
// ---------------------------------------------------------------

/**
 * สุ่มแบบกำหนดเมล็ดไว้ ผลลัพธ์เหมือนเดิมทุกครั้ง
 * ห้ามใช้ Math.random เพราะฝั่งเซิร์ฟเวอร์กับเบราว์เซอร์จะได้คนละค่า แล้ว hydration พัง
 */
function seeded(n: number) {
  let s = n * 9301 + 49297;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

const NAME_POOL: Record<CategoryId, string[]> = {
  sack: [
    "กระสอบพิมพ์ 15-15-15 ตราเรือใบ",
    "กระสอบพิมพ์ 16-20-0 ตราเรือใบ",
    "กระสอบพิมพ์ 46-0-0 ยูเรีย",
    "กระสอบพิมพ์ 21-0-0 ฟูเจียน",
    "กระสอบเปล่า 25 kg ลายเรือใบ",
    "กระสอบสาน PP 50 kg สีขาว",
    "กระสอบสาน PP 50 kg สีฟ้า",
    "กระสอบในพลาสติก LDPE",
    "กระสอบจัมโบ้ 1 ตัน",
    "กระสอบพิมพ์ 8-24-24 No Filler",
  ],
  sticker: [
    "สติกเกอร์ QR สูตร 15-15-15",
    "สติกเกอร์ QR สูตร 46-0-0",
    "สติกเกอร์บาร์โค้ดล็อต",
    "สติกเกอร์เตือนความชื้น",
    "สติกเกอร์ตราเรือใบ 10 ซม.",
    "สติกเกอร์วันผลิต/วันหมดอายุ",
    "สติกเกอร์รับรอง มกอช.",
  ],
  giveaway: [
    "หมวกแก๊ปตราเรือใบ",
    "เสื้อโปโลพนักงานขาย",
    "ร่มพับ 2 ตอน ตราเรือใบ",
    "กระเป๋าผ้าสปันบอนด์",
    "แก้วน้ำเก็บความเย็น",
    "ปฏิทินตั้งโต๊ะ 2569",
  ],
  lineSupply: [
    "ด้ายเย็บกระสอบ เบอร์ 10",
    "ด้ายเย็บกระสอบ เบอร์ 40",
    "เข็มเย็บกระสอบ DN-x1",
    "น้ำมันเกียร์ SAE 90",
    "จาระบีทนความร้อน",
    "สายพานลำเลียง PVC 600 mm",
    "ตะแกรงร่อน 4 mm",
    "ถุงมือผ้าเคลือบยาง",
    "หน้ากากกันฝุ่น N95",
  ],
};

const UNIT_POOL: Record<CategoryId, { unit: string; packing: string }[]> = {
  sack: [
    { unit: "ใบ", packing: "มัดละ 100 ใบ" },
    { unit: "ใบ", packing: "มัดละ 50 ใบ" },
  ],
  sticker: [
    { unit: "ดวง", packing: "ม้วน" },
    { unit: "ดวง", packing: "แผ่น" },
  ],
  giveaway: [
    { unit: "ชิ้น", packing: "ลัง" },
    { unit: "ตัว", packing: "ลัง" },
  ],
  lineSupply: [
    { unit: "ม้วน", packing: "กล่อง" },
    { unit: "ลิตร", packing: "ถัง 20 ลิตร" },
    { unit: "คู่", packing: "โหล" },
  ],
};

const ZONES = ["A-3M", "A-9M", "B-2L", "C-1S", "D-4S", "E-1S", "F-1M", "F-2M"];
const CONDITIONS: (LotCondition | undefined)[] = [
  undefined,
  undefined,
  "repack",
  "accepted",
  "sweep",
];

/** สร้างรายการยาว ๆ ไว้ทดสอบว่าเลื่อนดูจริงแล้วเหนื่อยแค่ไหน */
function generate(): Product[] {
  const out: Product[] = [];
  let n = 0;

  for (const cat of CATEGORIES) {
    NAME_POOL[cat.id].forEach((name, i) => {
      const rnd = seeded(++n);
      const spec = UNIT_POOL[cat.id][i % UNIT_POOL[cat.id].length];
      const lotCount = 1 + Math.floor(rnd() * 3);
      const low = rnd() < 0.22;

      const lots: Lot[] = Array.from({ length: lotCount }, (_, li) => {
        const qty = Math.round((5 + rnd() * 900) * (cat.id === "sticker" ? 20 : 1));
        const day = 1 + Math.floor(rnd() * 27);
        return {
          id: `g${n}-l${li}`,
          zone: ZONES[Math.floor(rnd() * ZONES.length)],
          code: `PD2605${String(day).padStart(2, "0")}/${String(li + 1).padStart(2, "0")}`,
          condition: CONDITIONS[Math.floor(rnd() * CONDITIONS.length)],
          receivedAt: `5/${day}/2026`,
          ageDays: 30 + Math.floor(rnd() * 30),
          qty,
          packNote: spec.packing,
          pending:
            rnd() < 0.3
              ? { inbound: Math.round(rnd() * 500) * 10 }
              : rnd() < 0.25
                ? { issue: Math.round(rnd() * 200) * 10 }
                : {},
          low: low && li === 0,
        };
      });

      out.push({
        id: `g${n}`,
        name,
        sku: `${cat.id.slice(0, 2).toUpperCase()}-${1000 + n}`,
        category: cat.id,
        packing: spec.packing,
        unit: spec.unit,
        low,
        lots,
      });
    });
  }
  return out;
}

const SEED_PRODUCTS: Product[] = [
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

/** รวมของที่เขียนมือกับที่สร้างอัตโนมัติ ให้รายการยาวพอจะทดสอบการเลื่อนจริง */
export const PRODUCTS: Product[] = [...SEED_PRODUCTS, ...generate()];

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

// ---------------------------------------------------------------
// แท็บรอรับเข้า — เป็นเอกสารสั่งซื้อที่รอของเข้าคลัง คนละชนิดกับสต็อก
// จึงมีเครื่องมือของตัวเอง ไม่แชร์กับแท็บสต็อก
// ---------------------------------------------------------------

export type InboundDoc = {
  id: string;
  code: string;
  createdAt: string;
  productName: string;
  /** บรรทัดรองใต้ชื่อสินค้า เช่น แหล่งผลิต/ลักษณะ */
  productSub?: string;
  supplier: string;
  truck: string;
  arriveDate: string;
  orderQty: number;
  orderUnit: string;
  packing?: string;
  /** รับเข้าคลังไปแล้วเท่าไร ที่เหลือคือค้างรับ */
  receivedQty: number;
};

export const outstandingQty = (d: InboundDoc) =>
  Math.max(0, d.orderQty - d.receivedQty);

export const INBOUND_DOCS: InboundDoc[] = [
  {
    id: "in-1",
    code: "POI260116/01",
    createdAt: "1/16/2026 | 10:42:52",
    productName: "21-0-0",
    productSub: "ฟูเจียน ผง",
    supplier: "เอชซี อินเตอร์เนชั่นแนล เทรดดิ้ง จำกัด",
    truck: "2 กส - 2345",
    arriveDate: "18/06/2026",
    orderQty: 400,
    orderUnit: "ลัง",
    packing: "12 ขวด",
    receivedQty: 350,
  },
  {
    id: "in-2",
    code: "POI260116/02",
    createdAt: "1/16/2026 | 11:08:14",
    productName: "กระสอบเปล่า 50 kg",
    productSub: "ลายเรือใบ",
    supplier: "โรงงานกระสอบไทยรุ่งเรือง",
    truck: "70 - 8891",
    arriveDate: "18/06/2026",
    orderQty: 12000,
    orderUnit: "ใบ",
    receivedQty: 11600,
  },
  {
    id: "in-3",
    code: "POI260116/03",
    createdAt: "1/16/2026 | 13:20:05",
    productName: "สติกเกอร์ QR",
    productSub: "ตรวจสอบย้อนกลับ",
    supplier: "พริ้นท์เวิร์คส์ เอเชีย",
    truck: "82 - 4417",
    arriveDate: "19/06/2026",
    orderQty: 30,
    orderUnit: "ม้วน",
    packing: "1,000 ดวง",
    receivedQty: 0,
  },
  {
    id: "in-4",
    code: "PO260116/04",
    createdAt: "1/16/2026 | 14:02:31",
    productName: "10-0-4+OM 50%",
    productSub: "ฟูเจียน ผง",
    supplier: "เอชซี อินเตอร์เนชั่นแนล เทรดดิ้ง จำกัด",
    truck: "กง - 1234",
    arriveDate: "19/06/2026",
    orderQty: 800,
    orderUnit: "ลิตร",
    receivedQty: 350,
  },
  {
    id: "in-5",
    code: "PO260116/05",
    createdAt: "1/16/2026 | 15:47:09",
    productName: "ถุงมือผ้าเคลือบยาง",
    productSub: "ไซซ์ L",
    supplier: "เซฟตี้พลัส ซัพพลาย",
    truck: "กข - 1234, กข - 1235",
    arriveDate: "19/06/2026",
    orderQty: 400,
    orderUnit: "ชิ้น",
    packing: "50 Kg",
    receivedQty: 100,
  },
];

export function matchesInbound(d: InboundDoc, q: string): boolean {
  const s = q.trim().toLowerCase();
  if (!s) return true;
  return [d.code, d.productName, d.productSub ?? "", d.supplier, d.truck].some(
    (v) => v.toLowerCase().includes(s)
  );
}

// ---------------------------------------------------------------
// แท็บรอจ่าย/คืน — ใบขอเบิกและใบขอคืน อยู่ตารางเดียวกัน
// แยกกันด้วยเครื่องหมายของจำนวน จ่ายออกเป็นลบ รับคืนเป็นบวก
// ---------------------------------------------------------------

export type IssueStatus =
  | "returnSweep"
  | "returnInternal"
  | "returnExternal"
  | "issueExternal"
  | "issueInternal";

export const ISSUE_STATUS_LABEL: Record<IssueStatus, string> = {
  returnSweep: "รอรับคืน (กวาดพื้น)",
  returnInternal: "รอรับคืน (จากภายใน)",
  returnExternal: "รอรับคืน (จากภายนอก)",
  issueExternal: "รอจ่ายออก (ภายนอก)",
  issueInternal: "รอจ่ายออก (ภายใน)",
};

/** รับคืนของเข้าคลัง จ่ายออกของออกจากคลัง ใช้แยกกลุ่มและเลือกสีตัวเลข */
export const isReturn = (s: IssueStatus) => s.startsWith("return");

export type IssueDoc = {
  id: string;
  code: string;
  createdAt: string;
  productName: string;
  packing?: string;
  /** จำนวนหน่วยนับ ติดลบ = จ่ายออก */
  count?: number;
  /** ปริมาณ ติดลบ = จ่ายออก */
  qty: number;
  unit: string;
  note?: string;
  requester: string;
  editedBy?: string;
  status: IssueStatus;
};

export const ISSUE_DOCS: IssueDoc[] = [
  {
    id: "is-1",
    code: "WT260116/01",
    createdAt: "1/16/2026 | 10:42:52",
    productName: "10-0-4+OM 50%",
    qty: 40,
    unit: "ตัน",
    requester: "อลิสา พรสุขสิริ",
    status: "returnSweep",
  },
  {
    id: "is-2",
    code: "REQ260116/01",
    createdAt: "1/16/2026 | 10:42:52",
    productName: "10-0-4+OM 50%",
    count: 400,
    qty: 400,
    unit: "ตัน",
    note: "เหลือจากการผลิต",
    requester: "อลิสา พรสุขสิริ",
    editedBy: "อลิสา พรสุขสิริ",
    status: "returnInternal",
  },
  {
    id: "is-3",
    code: "REQ260116/02",
    createdAt: "1/16/2026 | 10:42:52",
    productName: "10-0-4+OM 50%",
    packing: "50 Kg",
    count: 40,
    qty: 40,
    unit: "ลิตร",
    requester: "อลิสา พรสุขสิริ",
    status: "returnExternal",
  },
  {
    id: "is-4",
    code: "REQ260116/03",
    createdAt: "1/16/2026 | 10:42:52",
    productName: "10-0-4+OM 50%",
    packing: "40 Kg",
    count: -10,
    qty: -400,
    unit: "ตัน",
    note: "ใช้งาน",
    requester: "อลิสา พรสุขสิริ",
    status: "issueExternal",
  },
  {
    id: "is-5",
    code: "REQ260116/04",
    createdAt: "1/16/2026 | 10:42:52",
    productName: "10-0-4+OM 50%",
    count: -50,
    qty: -350,
    unit: "ตัน",
    requester: "อลิสา พรสุขสิริ",
    status: "issueInternal",
  },
  {
    id: "is-6",
    code: "WT260116/02",
    createdAt: "1/17/2026 | 08:15:03",
    productName: "กระสอบเปล่า 50 kg ลายเรือใบ",
    count: 120,
    qty: 120,
    unit: "ใบ",
    note: "เก็บตกจากไลน์ 2",
    requester: "ธนกฤต ศรีบุญเรือง",
    status: "returnSweep",
  },
  {
    id: "is-7",
    code: "REQ260117/01",
    createdAt: "1/17/2026 | 09:31:44",
    productName: "สติกเกอร์ QR ตรวจสอบย้อนกลับ",
    packing: "1,000 ดวง",
    count: -6,
    qty: -6000,
    unit: "ดวง",
    note: "ใช้กับล็อตส่งออก",
    requester: "ธนกฤต ศรีบุญเรือง",
    status: "issueInternal",
  },
  {
    id: "is-8",
    code: "REQ260117/02",
    createdAt: "1/17/2026 | 11:02:19",
    productName: "ถุงมือผ้าเคลือบยาง ไซซ์ L",
    count: -80,
    qty: -80,
    unit: "คู่",
    requester: "พิมพ์ชนก วงศ์อารีย์",
    editedBy: "ธนกฤต ศรีบุญเรือง",
    status: "issueExternal",
  },
  {
    id: "is-9",
    code: "WT260117/01",
    createdAt: "1/17/2026 | 14:20:57",
    productName: "ถุงมือผ้าเคลือบยาง ไซซ์ L",
    count: 15,
    qty: 15,
    unit: "คู่",
    note: "คืนของไม่ได้ใช้",
    requester: "พิมพ์ชนก วงศ์อารีย์",
    status: "returnInternal",
  },
  {
    id: "is-10",
    code: "WT260118/01",
    createdAt: "1/18/2026 | 08:44:12",
    productName: "ปุ๋ยเกล็ด 20-20-20",
    packing: "25 Kg",
    count: 8,
    qty: 200,
    unit: "กก.",
    note: "ลูกค้าคืนสินค้า",
    requester: "อลิสา พรสุขสิริ",
    status: "returnExternal",
  },
];

export function matchesIssue(d: IssueDoc, q: string): boolean {
  const s = q.trim().toLowerCase();
  if (!s) return true;
  return [d.code, d.productName, d.requester, d.note ?? ""].some((v) =>
    v.toLowerCase().includes(s)
  );
}

export function countByCategory(products: Product[]) {
  const out = {} as Record<CategoryId, number>;
  for (const c of CATEGORIES) out[c.id] = 0;
  for (const p of products) out[p.category] += 1;
  return out;
}
