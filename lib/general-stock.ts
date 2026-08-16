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
  /** จำนวนชิ้นในล็อต ใช้กับกล่องย้าย/ปรับปรุงที่นับเป็นชิ้น */
  pieces?: number;
  /** น้ำหนักต่อชิ้น แสดงคู่กับจำนวนชิ้น */
  kgPerPiece?: number;
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

/** โซนทั้งหมดในคลัง ใช้ทั้งตอนสร้างข้อมูลตัวอย่างและตอนเลือกปลายทางในกล่องย้ายสต็อก */
export const ZONES = [
  "A-3M",
  "A-9M",
  "A-10",
  "B-2L",
  "C-1S",
  "D-4S",
  "E-1S",
  "F-1M",
  "F-2M",
];
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
          pieces: Math.max(1, Math.round(qty / (1 + Math.floor(rnd() * 4)))),
          kgPerPiece: 25 + Math.floor(rnd() * 4) * 25,
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
        pieces: 500,
        kgPerPiece: 50,
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
        pieces: 500,
        kgPerPiece: 50,
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
        pieces: 500,
        kgPerPiece: 50,
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

/* ------------------------------------------------------------------
   คลังข้อมูลกลางของทั้งสามแท็บเอกสาร

   แต่ละแท็บมีแถวที่เขียนมือไว้ตรงกับไฟล์ออกแบบอยู่แล้ว ส่วนที่เหลือ
   ต่อท้ายด้วยตัวสร้าง เพื่อให้ตารางยาวพอจะเห็นการเลื่อนและการแบ่งหน้าจริง
   ทุกค่าอิง seeded() ตัวเดิม ไม่มี Math.random ไม่มี Date.now
   เลขจึงเหมือนกันทั้งฝั่งเซิร์ฟเวอร์และเบราว์เซอร์ hydration ไม่เพี้ยน
------------------------------------------------------------------ */

const DOC_ACTORS = [
  "อลิสา พรสุขสิริ",
  "ธนกฤต ศรีบุญเรือง",
  "พิมพ์ชนก วงศ์อารีย์",
  "ณัฐวุฒิ แก้วประเสริฐ",
  "สุชานาถ อินทร์ทอง",
  "กิตติพงศ์ ใจดีงาม",
];

const DOC_ITEMS: {
  name: string;
  sub: string;
  packing?: string;
  unit: string;
}[] = [
  { name: "10-0-4+OM 50%", sub: "ฟูเจียน ผง", packing: "40 Kg", unit: "ตัน" },
  { name: "กระสอบเปล่า 50 kg", sub: "ลายเรือใบ", unit: "ใบ" },
  {
    name: "สติกเกอร์ QR",
    sub: "ตรวจสอบย้อนกลับ",
    packing: "1,000 ดวง",
    unit: "ดวง",
  },
  { name: "ถุงมือผ้าเคลือบยาง", sub: "ไซซ์ L", unit: "คู่" },
  {
    name: "ปุ๋ยเกล็ด 20-20-20",
    sub: "ละลายน้ำ",
    packing: "25 Kg",
    unit: "กก.",
  },
  { name: "21-0-0", sub: "ฟูเจียน ผง", packing: "50 Kg", unit: "ตัน" },
  { name: "เทปพันสายพาน", sub: "หน้ากว้าง 2 นิ้ว", unit: "ม้วน" },
  {
    name: "น้ำมันหล่อลื่นสายพาน",
    sub: "ISO VG46",
    packing: "ถัง 20 ลิตร",
    unit: "ลิตร",
  },
  { name: "เสื้อโปโลพนักงาน", sub: "ไซซ์ XL", unit: "ตัว" },
  { name: "กระสอบพิมพ์ 46-0-0", sub: "ยูเรีย", unit: "ใบ" },
  { name: "16-20-0", sub: "เม็ดปั้น", packing: "50 Kg", unit: "ตัน" },
  { name: "หมึกพิมพ์วันที่", sub: "สีดำ", packing: "ขวด 500 ml", unit: "ขวด" },
];

const DOC_SUPPLIERS = [
  "เอชซี อินเตอร์เนชั่นแนล เทรดดิ้ง จำกัด",
  "โรงงานกระสอบไทยรุ่งเรือง",
  "พริ้นท์เวิร์คส์ เอเชีย",
  "เซฟตี้พลัส ซัพพลาย",
  "ยูนิเวอร์แซล เคมิคอล กรุ๊ป",
  "ไทยแอกโกร อินดัสทรี",
];

const pad = (n: number) => String(n).padStart(2, "0");

/** วันเวลาของเอกสาร เดินถอยหลังจาก 18/1/2026 ทีละวัน */
function docStamp(seq: number, rnd: () => number) {
  const day = 18 - (seq % 14);
  return `1/${day}/2026 | ${pad(8 + (seq % 9))}:${pad(Math.floor(rnd() * 60))}:${pad(Math.floor(rnd() * 60))}`;
}

const pick = <T,>(pool: T[], rnd: () => number) =>
  pool[Math.floor(rnd() * pool.length)];

const SEED_INBOUND: InboundDoc[] = [
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

function moreInbound(count = 25): InboundDoc[] {
  return Array.from({ length: count }, (_, i) => {
    const rnd = seeded(700 + i);
    const item = DOC_ITEMS[i % DOC_ITEMS.length];
    const orderQty = Math.round((20 + rnd() * 980) / 10) * 10;
    // ส่วนใหญ่รับมาแล้วบางส่วน บางใบยังไม่ได้รับเลย บางใบรับครบแล้ว
    const ratio = rnd();
    const receivedQty =
      ratio < 0.18 ? 0 : ratio > 0.88 ? orderQty : Math.round(orderQty * ratio);
    const day = 18 - (i % 12);

    return {
      id: `in-g${i + 1}`,
      code: `PO2601${pad(day)}/${pad((i % 9) + 1)}`,
      createdAt: docStamp(i, rnd),
      productName: item.name,
      productSub: item.sub,
      supplier: pick(DOC_SUPPLIERS, rnd),
      truck: `${pad(10 + Math.floor(rnd() * 89))} - ${1000 + Math.floor(rnd() * 8999)}`,
      arriveDate: `${pad(day + 2)}/01/2026`,
      orderQty,
      orderUnit: item.unit,
      packing: item.packing,
      receivedQty,
    } satisfies InboundDoc;
  });
}

export const INBOUND_DOCS: InboundDoc[] = [...SEED_INBOUND, ...moreInbound()];

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

const SEED_ISSUE: IssueDoc[] = [
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

/** เวียนสถานะให้ครบทั้งห้าแบบ จะได้เห็นครบทุกสีชิปในหน้าเดียว */
const ISSUE_CYCLE: IssueStatus[] = [
  "returnSweep",
  "issueInternal",
  "returnInternal",
  "issueExternal",
  "returnExternal",
];

const ISSUE_NOTES = [
  "เหลือจากการผลิต",
  "ใช้งานไลน์ 2",
  "เก็บตกหน้าโกดัง",
  "ลูกค้าคืนสินค้า",
  "เบิกไปทดสอบเครื่อง",
  "คืนของไม่ได้ใช้",
];

function moreIssue(count = 32): IssueDoc[] {
  return Array.from({ length: count }, (_, i) => {
    const rnd = seeded(300 + i);
    const item = DOC_ITEMS[(i + 3) % DOC_ITEMS.length];
    const status = ISSUE_CYCLE[i % ISSUE_CYCLE.length];
    const plus = isReturn(status);
    const sign = plus ? 1 : -1;
    const count_ = Math.round((5 + rnd() * 400) / 5) * 5;
    const day = 18 - (i % 14);

    return {
      id: `is-g${i + 1}`,
      code: `${plus ? "WT" : "REQ"}2601${pad(day)}/${pad((i % 8) + 1)}`,
      createdAt: docStamp(i, rnd),
      productName: `${item.name} ${item.sub}`,
      packing: rnd() < 0.6 ? item.packing : undefined,
      count: rnd() < 0.85 ? sign * count_ : undefined,
      qty: sign * Math.round(count_ * (1 + Math.floor(rnd() * 10))),
      unit: item.unit,
      note: rnd() < 0.55 ? pick(ISSUE_NOTES, rnd) : undefined,
      requester: pick(DOC_ACTORS, rnd),
      editedBy: rnd() < 0.25 ? pick(DOC_ACTORS, rnd) : undefined,
      status,
    } satisfies IssueDoc;
  });
}

export const ISSUE_DOCS: IssueDoc[] = [...SEED_ISSUE, ...moreIssue()];

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

// ---------------------------------------------------------------
// ประวัติการทำรายการ — ทุกความเคลื่อนไหวของสต็อก ไม่ใช่ยอดคงเหลือ
// จึงไม่มีเรื่อง "สต็อกต่ำ" ให้กรอง เพราะแต่ละแถวคือเหตุการณ์ ไม่ใช่ของที่มีอยู่
// ---------------------------------------------------------------

export type HistoryStatus =
  | "returnInternal"
  | "returnExternal"
  | "returnSweep"
  | "inbound"
  | "issueInternal"
  | "issueExternal"
  | "move"
  | "adjust"
  | "failed";

export const HISTORY_STATUS_LABEL: Record<HistoryStatus, string> = {
  returnInternal: "รับคืน (จากภายใน)",
  returnExternal: "รับคืน (จากภายนอก)",
  returnSweep: "รับคืน (กวาดพื้น)",
  inbound: "รับเข้า",
  issueInternal: "จ่ายออก (ภายใน)",
  issueExternal: "จ่ายออก (ภายนอก)",
  move: "ย้าย",
  adjust: "ปรับปรุง",
  failed: "ไม่สามารถจ่ายได้",
};

export type HistoryRow = {
  id: string;
  code: string;
  createdAt: string;
  lotNumber?: string;
  productName: string;
  packing?: string;
  /** จำนวนที่ขอทำรายการ */
  askedCount?: number;
  /** จำนวนที่ทำได้จริง */
  doneCount?: number;
  /** ปริมาณที่ทำได้จริง */
  doneQty?: number;
  unit?: string;
  zone?: string;
  /** ย้ายโซน มีปลายทางด้วย */
  zoneTo?: string;
  note?: string;
  receiverNote?: string;
  requester: string;
  actor?: string;
  status: HistoryStatus;
};

const SEED_HISTORY: HistoryRow[] = [
  {
    id: "h-1",
    code: "REQ260705/01",
    createdAt: "1/16/2026 | 10:42:52",
    lotNumber: "PO260116/01-04",
    productName: "10-0-4+OM 50%",
    packing: "12 ขวด",
    askedCount: 400,
    doneCount: 400,
    unit: "ชิ้น",
    zone: "A-9M",
    note: "เหลือจากการผลิต",
    requester: "อลิสา พรสุขสิริ",
    actor: "อลิสา พรสุขสิริ",
    status: "returnInternal",
  },
  {
    id: "h-2",
    code: "REQ260705/02",
    createdAt: "1/16/2026 | 10:42:52",
    productName: "10-0-4+OM 50%",
    packing: "40 Kg",
    askedCount: 40,
    requester: "อลิสา พรสุขสิริ",
    receiverNote: "ของไม่พอในโซนที่ระบุ",
    status: "failed",
  },
  {
    id: "h-3",
    code: "WT260705/01",
    createdAt: "1/16/2026 | 10:42:52",
    lotNumber: "WT260116/01-04",
    productName: "10-0-4+OM 50%",
    doneQty: 10,
    unit: "ตัน",
    zone: "A-9M",
    note: "เหลือจากการผลิต",
    requester: "อลิสา พรสุขสิริ",
    actor: "อลิสา พรสุขสิริ",
    status: "returnSweep",
  },
  {
    id: "h-4",
    code: "REQ260705/03",
    createdAt: "1/16/2026 | 10:42:52",
    lotNumber: "POI260116/01-04",
    productName: "10-0-4+OM 50%",
    askedCount: 300,
    doneCount: 300,
    unit: "ชิ้น",
    zone: "A-9M",
    requester: "อลิสา พรสุขสิริ",
    actor: "อลิสา พรสุขสิริ",
    status: "returnExternal",
  },
  {
    id: "h-5",
    code: "REQ260705/04",
    createdAt: "1/16/2026 | 10:42:52",
    lotNumber: "PO260116/01-04",
    productName: "10-0-4+OM 50%",
    packing: "40 Kg",
    askedCount: 10,
    doneCount: 10,
    doneQty: 10,
    unit: "ตัน",
    zone: "A-4M",
    zoneTo: "A-2M",
    note: "จัดโซนใหม่",
    requester: "ธนกฤต ศรีบุญเรือง",
    actor: "ธนกฤต ศรีบุญเรือง",
    status: "move",
  },
  {
    id: "h-6",
    code: "REQ260705/05",
    createdAt: "1/16/2026 | 10:42:52",
    lotNumber: "PO260116/01-04",
    productName: "10-0-4+OM 50%",
    packing: "40 Kg",
    askedCount: -10,
    doneCount: -10,
    doneQty: -400,
    unit: "ลิตร",
    zone: "A-9M",
    requester: "อลิสา พรสุขสิริ",
    actor: "อลิสา พรสุขสิริ",
    status: "issueInternal",
  },
  {
    id: "h-7",
    code: "REQ260705/06",
    createdAt: "1/16/2026 | 10:42:52",
    lotNumber: "PO260116/01-04",
    productName: "10-0-4+OM 50%",
    doneCount: 40,
    zone: "A-4M",
    zoneTo: "A-2M",
    note: "จัดโซนใหม่",
    requester: "ธนกฤต ศรีบุญเรือง",
    actor: "ธนกฤต ศรีบุญเรือง",
    status: "move",
  },
  {
    id: "h-8",
    code: "REQ260705/07",
    createdAt: "1/16/2026 | 10:42:52",
    lotNumber: "PO260116/01-04",
    productName: "10-0-4+OM 50%",
    packing: "40 Kg",
    doneCount: 5,
    doneQty: 350,
    unit: "ตัน",
    zone: "A-9M",
    note: "ของเกินจากการนับ",
    requester: "พิมพ์ชนก วงศ์อารีย์",
    actor: "พิมพ์ชนก วงศ์อารีย์",
    status: "adjust",
  },
  {
    id: "h-9",
    code: "REQ260705/08",
    createdAt: "1/16/2026 | 10:42:52",
    lotNumber: "PO260116/01-04",
    productName: "10-0-4+OM 50%",
    askedCount: -5,
    doneCount: -5,
    zone: "A-9M",
    note: "ของขาดจากการนับ",
    requester: "พิมพ์ชนก วงศ์อารีย์",
    actor: "พิมพ์ชนก วงศ์อารีย์",
    status: "adjust",
  },
  {
    id: "h-10",
    code: "REQ260705/09",
    createdAt: "1/16/2026 | 10:42:52",
    lotNumber: "PO260116/01-04",
    productName: "10-0-4+OM 50%",
    packing: "40 Kg",
    askedCount: -50,
    doneCount: -50,
    doneQty: -350,
    unit: "ตัน",
    zone: "A-9M",
    requester: "อลิสา พรสุขสิริ",
    actor: "อลิสา พรสุขสิริ",
    status: "issueExternal",
  },
  {
    id: "h-11",
    code: "PO260705/01",
    createdAt: "1/16/2026 | 10:42:52",
    lotNumber: "PO260116/01-04",
    productName: "10-0-4+OM 50%",
    packing: "40 Kg",
    askedCount: 400,
    doneCount: 400,
    doneQty: 350,
    unit: "ตัน",
    zone: "A-9M",
    requester: "อลิสา พรสุขสิริ",
    actor: "อลิสา พรสุขสิริ",
    status: "inbound",
  },
];

/** เวียนให้ครบทั้งเก้าแบบ ประวัติจึงเห็นชิปครบทุกสีโดยไม่ต้องเลื่อนหา */
const HISTORY_CYCLE: HistoryStatus[] = [
  "inbound",
  "issueInternal",
  "move",
  "returnSweep",
  "adjust",
  "issueExternal",
  "returnInternal",
  "failed",
  "returnExternal",
];

const HISTORY_NOTES = [
  "จัดโซนใหม่",
  "ของเกินจากการนับ",
  "ของขาดจากการนับ",
  "เหลือจากการผลิต",
  "ย้ายเข้าโซนใกล้ไลน์",
  "รวมล็อตย่อย",
];

const FAIL_NOTES = [
  "ของไม่พอในโซนที่ระบุ",
  "ล็อตถูกล็อกไว้รอ QC",
  "เลขล็อตไม่ตรงกับใบขอเบิก",
];

function moreHistory(count = 40): HistoryRow[] {
  return Array.from({ length: count }, (_, i) => {
    const rnd = seeded(900 + i);
    const item = DOC_ITEMS[(i + 5) % DOC_ITEMS.length];
    const status = HISTORY_CYCLE[i % HISTORY_CYCLE.length];
    const out = status.startsWith("issue");
    const sign = out ? -1 : 1;
    const asked = Math.round((5 + rnd() * 400) / 5) * 5;
    // จ่ายไม่สำเร็จคือขอไปแล้วทำไม่ได้เลย จึงมีแต่ยอดที่ขอ ไม่มียอดที่ทำได้
    const failed = status === "failed";
    const done = failed ? undefined : sign * asked;
    const who = pick(DOC_ACTORS, rnd);
    const day = 18 - (i % 14);
    const zone = ZONES[Math.floor(rnd() * ZONES.length)];

    return {
      id: `h-g${i + 1}`,
      code: `${status === "inbound" ? "PO" : out ? "REQ" : "WT"}2601${pad(day)}/${pad((i % 9) + 1)}`,
      createdAt: docStamp(i, rnd),
      lotNumber: failed ? undefined : `PO2601${pad(day)}/${pad((i % 6) + 1)}-04`,
      productName: `${item.name} ${item.sub}`,
      packing: rnd() < 0.6 ? item.packing : undefined,
      askedCount: sign * asked,
      doneCount: done,
      doneQty:
        failed || rnd() < 0.25
          ? undefined
          : sign * Math.round(asked * (1 + Math.floor(rnd() * 8))),
      unit: item.unit,
      zone,
      zoneTo:
        status === "move"
          ? ZONES.filter((z) => z !== zone)[
              Math.floor(rnd() * (ZONES.length - 1))
            ]
          : undefined,
      note: failed ? undefined : rnd() < 0.5 ? pick(HISTORY_NOTES, rnd) : undefined,
      receiverNote: failed ? pick(FAIL_NOTES, rnd) : undefined,
      requester: who,
      actor: failed ? undefined : who,
      status,
    } satisfies HistoryRow;
  });
}

export const HISTORY_ROWS: HistoryRow[] = [...SEED_HISTORY, ...moreHistory()];

export function matchesHistory(r: HistoryRow, q: string): boolean {
  const s = q.trim().toLowerCase();
  if (!s) return true;
  return [
    r.code,
    r.lotNumber ?? "",
    r.productName,
    r.zone ?? "",
    r.requester,
    r.note ?? "",
  ].some((v) => v.toLowerCase().includes(s));
}

// ---------------------------------------------------------------
// ย้าย / ปรับปรุงสต็อก
// ---------------------------------------------------------------

/**
 * แปลงจำนวนชิ้นเป็นปริมาณตามหน่วยของสินค้า
 * ล็อตที่ไม่ได้บอกน้ำหนักต่อชิ้นไว้ ถือว่าจำนวนกับปริมาณเป็นตัวเดียวกัน
 */
export function piecesToQty(lot: Lot, pieces: number): number {
  if (!lot.pieces || lot.pieces === 0) return pieces;
  return (lot.qty / lot.pieces) * pieces;
}

/** ยอดคงเหลือหลังย้ายออกไปกี่ชิ้น */
export const qtyAfterMove = (lot: Lot, pieces: number) =>
  Math.max(0, lot.qty - piecesToQty(lot, pieces));

/** ส่วนต่างจากการนับจริง ติดลบ = ของหาย บวก = ของเกิน */
export const countDiff = (lot: Lot, counted: number) =>
  piecesToQty(lot, counted) - lot.qty;

/** จำนวนชิ้นทั้งหมดของล็อต ใช้เป็นเพดานของช่องกรอก */
export const lotPieces = (lot: Lot) => lot.pieces ?? Math.round(lot.qty);

// ---------------------------------------------------------------
// ตัวกรองและการจัดกลุ่มของหน้าสต็อกทั่วไป
//
// การเรียงที่นี่ไม่ได้เปลี่ยนแค่ลำดับ แต่เปลี่ยน "หน่วยของรายการ" ไปเลย
//   สินค้า — กลุ่มตามสินค้า ล็อตอยู่ข้างใน ใช้ตอนถามว่าของชิ้นนี้เหลือเท่าไร
//   โซน   — กลุ่มตามโซน ใช้ตอนยืนอยู่หน้าชั้นแล้วถามว่าตรงนี้มีอะไรบ้าง
//   FIFO  — ไม่จัดกลุ่ม ไล่ล็อตเรียงตามอายุ ใช้ตอนเคลียร์ของเก่า
//
// สามคำถามนี้คนละคำถามกัน จึงต้องเป็นคนละหน้าตา ไม่ใช่ตารางเดิมสลับลำดับ
// ---------------------------------------------------------------

export type StockSort = "product" | "zone" | "fifo";
export type SortDir = "asc" | "desc";

/** ล็อตที่พกข้อมูลสินค้าติดมาด้วย — ใช้ตอนที่รายการไม่ได้จัดกลุ่มตามสินค้า */
export type FlatLot = {
  lot: Lot;
  product: Product;
};

export function flatLots(products: Product[]): FlatLot[] {
  return products.flatMap((p) => p.lots.map((lot) => ({ lot, product: p })));
}

/** กลุ่มของรายการ — หัวกลุ่มเป็นสินค้าหรือโซนก็ได้ แล้วแต่โหมดที่เลือก */
export type LotGroup = {
  id: string;
  /** รหัสโซน แสดงเป็นป้ายหน้าหัวกลุ่ม — ไม่มี = หัวกลุ่มเป็นสินค้า */
  zone?: string;
  title: string;
  rows: FlatLot[];
};

export function groupByZone(products: Product[], dir: SortDir): LotGroup[] {
  const map = new Map<string, FlatLot[]>();
  for (const row of flatLots(products)) {
    const list = map.get(row.lot.zone);
    if (list) list.push(row);
    else map.set(row.lot.zone, [row]);
  }

  const zones = [...map.keys()].sort((a, b) =>
    dir === "asc" ? a.localeCompare(b) : b.localeCompare(a)
  );

  return zones.map((zone) => ({
    id: zone,
    zone,
    title: `โซน ${zone}`,
    rows: map.get(zone)!,
  }));
}

/**
 * เรียงล็อตตามอายุ ไม่จัดกลุ่ม
 *
 * เก่าสุดขึ้นก่อนคือ FIFO ของจริง — ของที่ค้างนานที่สุดต้องถูกใช้ก่อน
 * สลับทิศแล้วมันคือ LIFO ไม่ใช่ FIFO อีกต่อไป ป้ายบนปุ่มจึงต้องเปลี่ยนตาม
 */
export function sortFifo(products: Product[], dir: SortDir): FlatLot[] {
  return flatLots(products).sort((a, b) =>
    dir === "asc"
      ? b.lot.ageDays - a.lot.ageDays
      : a.lot.ageDays - b.lot.ageDays
  );
}

export function sortProducts(products: Product[], dir: SortDir): Product[] {
  return [...products].sort((a, b) =>
    dir === "asc"
      ? a.name.localeCompare(b.name, "th")
      : b.name.localeCompare(a.name, "th")
  );
}

/** ชื่อสินค้าทั้งหมด ไม่ซ้ำ สำหรับตัวเลือกในตัวกรอง */
export const STOCK_PRODUCT_NAMES = [
  ...new Set(PRODUCTS.map((p) => p.name)),
].sort((a, b) => a.localeCompare(b, "th"));
