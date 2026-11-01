// ============================================================
// สต็อกสินค้า — แท็บรอจ่าย/คืน กับหน้าจ่ายสินค้า (Flow จ่ายออก ใน Figma โหนด 86-333151)
//
// ใบขอเบิก (จ่ายออก) กับใบขอคืน (รับคืน) อยู่ตารางเดียวกันเหมือนสต็อกทั่วไป
// จ่ายออกเก็บเป็นเลขติดลบ รับคืนเป็นบวก ตัวเลขบอกทิศทางเองด้วยสี
//
// หน้าจ่ายสินค้าเปิดได้เฉพาะใบจ่ายออก — เลือก Lot ที่จะหยิบของออก (สแกนป้าย
// หรือเลือกจากรายการ) กรอกจำนวนชิ้นต่อ Lot แล้วบันทึก ใบหลุดจากแท็บรอจ่าย
//
// ยังเป็นข้อมูลจำลองล้วน ทุกค่าอิง seeded() ไม่มี Math.random
// ฝั่งเซิร์ฟเวอร์กับเบราว์เซอร์จะได้ค่าเดียวกัน hydration ไม่พัง
// ============================================================

/** สถานะใช้ชื่อเดียวกับสต็อกทั่วไป ป้ายสีจึงใช้ StatusChip ชุดเดิมได้ตรง ๆ */
export type GoodsIssueStatus =
  | "returnSweep"
  | "returnInternal"
  | "returnExternal"
  | "issueExternal"
  | "issueInternal";

/** คำตามแบบ — ไม่มีคำว่า "จาก" ต่างจากสต็อกทั่วไปนิดหน่อย */
export const GOODS_ISSUE_STATUS_LABEL: Record<GoodsIssueStatus, string> = {
  returnSweep: "รอรับคืน (กวาดพื้น)",
  returnInternal: "รอรับคืน (ภายใน)",
  returnExternal: "รอรับคืน (ภายนอก)",
  issueExternal: "รอจ่ายออก (ภายนอก)",
  issueInternal: "รอจ่ายออก (ภายใน)",
};

export const isGoodsReturn = (s: GoodsIssueStatus) => s.startsWith("return");

export type GoodsIssueDoc = {
  id: string;
  code: string;
  createdAt: string;
  productName: string;
  /** ประเภท เช่น สินค้าผลิต ปุ๋ยกระสอบ */
  productType: string;
  /** หมวด เช่น Bulk */
  group: string;
  packing?: string;
  /** จำนวนหน่วยนับ ติดลบ = จ่ายออก */
  count?: number;
  /** ปริมาณ ติดลบ = จ่ายออก */
  qty: number;
  unit: string;
  note?: string;
  requester: string;
  editedBy?: string;
  status: GoodsIssueStatus;
  // ---------- ใช้ในหน้าจ่ายสินค้าเท่านั้น ----------
  /** ผู้รับปลายทาง — มุมขวาของหัวใบ */
  customer?: string;
  truck?: string;
  arriveDate?: string;
  requesterNote?: string;
};

const pad = (n: number) => String(n).padStart(2, "0");

function seeded(n: number) {
  let s = n * 9301 + 49297;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

const ACTOR = "อลิสา พรสุขสิริ";
const CUSTOMER = "บริษัท เอชซี อินเตอร์เนชั่นแนล เทรดดิ้ง จำกัด";
const STAMP = "1/16/2026 | 10:42:52";

/** สิบใบตามแบบ — สี่ใบจ่ายออก หกใบรับคืน */
const SEED: GoodsIssueDoc[] = [
  {
    id: "gi-1",
    code: "WT260115/01",
    createdAt: STAMP,
    productName: "วัตถุดิบไม่ระบุประเภท",
    productType: "สินค้าผลิต",
    group: "Bulk",
    qty: 40,
    unit: "ตัน",
    requester: ACTOR,
    status: "returnSweep",
  },
  {
    id: "gi-2",
    code: "REQ260115/01",
    createdAt: STAMP,
    productName: "10-0-4+OM 50%",
    productType: "ปุ๋ยกระสอบ",
    group: "Bulk",
    count: 400,
    qty: 400,
    unit: "ตัน",
    note: "เหลือจากการผลิต",
    requester: ACTOR,
    editedBy: ACTOR,
    status: "returnInternal",
  },
  {
    id: "gi-3",
    code: "REQ260115/02",
    createdAt: STAMP,
    productName: "10-0-4+OM 50%",
    productType: "สินค้าผลิต",
    group: "Bulk",
    packing: "50 กก.",
    count: 40,
    qty: 40,
    unit: "ลิตร",
    requester: ACTOR,
    status: "returnExternal",
  },
  {
    id: "gi-4",
    code: "PRI260115/01A",
    createdAt: STAMP,
    productName: "10-0-4+OM 50%",
    productType: "ปุ๋ยกระสอบ",
    group: "Bulk",
    packing: "50 กก.",
    count: -6000,
    qty: -300,
    unit: "ตัน",
    requester: ACTOR,
    status: "issueExternal",
    customer: CUSTOMER,
    truck: "กส - 2345",
    arriveDate: "1/16/2026",
  },
  {
    id: "gi-5",
    code: "PRI260115/01B",
    createdAt: STAMP,
    productName: "10-0-4+OM 50%",
    productType: "สินค้าผลิต",
    group: "Bulk",
    packing: "40 กก.",
    count: -10,
    qty: -400,
    unit: "ตัน",
    requester: ACTOR,
    status: "issueExternal",
    customer: CUSTOMER,
    truck: "กส - 1234",
    arriveDate: "1/16/2026",
  },
  {
    id: "gi-6",
    code: "REQ260115/03",
    createdAt: STAMP,
    productName: "10-0-4+OM 50%",
    productType: "สินค้าผลิต",
    group: "Bulk",
    count: -50,
    qty: -350,
    unit: "ตัน",
    requester: ACTOR,
    status: "issueInternal",
    customer: "ไลน์ผลิต 2",
    truck: "-",
    arriveDate: "1/16/2026",
  },
  {
    id: "gi-7",
    code: "REQ260116/01",
    createdAt: "1/16/2026 | 14:05:11",
    productName: "16-20-0 เม็ดปั้น",
    productType: "สินค้าผลิต",
    group: "Bulk",
    packing: "50 กก.",
    count: -40,
    qty: -2,
    unit: "ตัน",
    note: "ใช้งานไลน์ 2",
    requester: "ธนกฤต ศรีบุญเรือง",
    status: "issueInternal",
    customer: "ไลน์ผลิต 2",
    truck: "-",
    arriveDate: "1/17/2026",
  },
  {
    id: "gi-8",
    code: "WT260116/02",
    createdAt: "1/16/2026 | 16:20:40",
    productName: "16-20-0 เม็ดปั้น",
    productType: "สินค้าผลิต",
    group: "Bulk",
    qty: 1.5,
    unit: "ตัน",
    note: "เก็บตกหน้าโกดัง",
    requester: "ธนกฤต ศรีบุญเรือง",
    status: "returnSweep",
  },
  {
    id: "gi-9",
    code: "REQ260117/01",
    createdAt: "1/17/2026 | 09:12:03",
    productName: "46-0-0 ยูเรีย เม็ด",
    productType: "ปุ๋ยกระสอบ",
    group: "Bulk",
    packing: "50 กก.",
    count: 20,
    qty: 1,
    unit: "ตัน",
    note: "คืนของไม่ได้ใช้",
    requester: "พิมพ์ชนก วงศ์อารีย์",
    status: "returnInternal",
  },
  {
    id: "gi-10",
    code: "REQ260117/02",
    createdAt: "1/17/2026 | 11:48:27",
    productName: "46-0-0 ยูเรีย เม็ด",
    productType: "ปุ๋ยกระสอบ",
    group: "Bulk",
    packing: "50 กก.",
    count: 100,
    qty: 5,
    unit: "ตัน",
    note: "ลูกค้าคืนสินค้า",
    requester: "พิมพ์ชนก วงศ์อารีย์",
    status: "returnExternal",
  },
];

export const GOODS_ISSUE_DOCS = SEED;

/** ใบที่จ่ายไปแล้วในรอบนี้ — หลุดจากแท็บรอจ่าย/คืน */
const CLOSED = new Set<string>();

export function closeGoodsIssue(id: string) {
  CLOSED.add(id);
}

export const isGoodsIssueOpen = (d: GoodsIssueDoc) => !CLOSED.has(d.id);

/** เปิดหน้าจ่ายสินค้าได้เฉพาะใบจ่ายออกที่ยังไม่ได้จ่าย */
export const canIssue = (d: GoodsIssueDoc) =>
  !isGoodsReturn(d.status) && isGoodsIssueOpen(d);

export function goodsIssueOf(id: string) {
  return GOODS_ISSUE_DOCS.find((d) => d.id === id);
}

export function matchesGoodsIssue(d: GoodsIssueDoc, q: string): boolean {
  const s = q.trim().toLowerCase();
  if (!s) return true;
  return [d.code, d.productName, d.productType, d.requester, d.note ?? ""].some(
    (v) => v.toLowerCase().includes(s)
  );
}

// ---------------------------------------------------------------
// Lot ในคลังของสินค้าหนึ่งรายการ — ตัวเลือกในหน้าจ่ายสินค้า
// ---------------------------------------------------------------

export type GoodsLot = {
  id: string;
  /** เลขที่ติดบนป้าย — สิ่งที่สแกนได้ */
  code: string;
  zone: string;
  receivedAt: string;
  /** อายุในคลัง (วัน) — FIFO หยิบตัวเก่าก่อน */
  ageDays: number;
  /** คงเหลือในคลัง (ชิ้น) */
  pieces: number;
  /** น้ำหนักต่อชิ้น (กก.) */
  kgPerPiece: number;
};

const ZONES = ["A-9M", "A-2", "B-1", "B-4", "C-3"];

/** ตันคงเหลือของ Lot */
export const lotTons = (l: GoodsLot) => (l.pieces * l.kgPerPiece) / 1000;

/** เหลือน้อยกว่านี้ (ตัน) ขึ้นตัวเลขแดง — เตือนว่าหยิบหมด Lot แล้วอาจไม่พอ */
export const LOW_LOT_TONS = 5;

function kgOf(packing?: string) {
  const n = Number(packing?.match(/\d+/)?.[0]);
  return Number.isFinite(n) && n > 0 ? n : 50;
}

/** แปดล็อตต่อใบ เก่าสุดขึ้นก่อน (FIFO) — สองล็อตท้ายเหลือน้อยให้เห็นตัวเลขแดง */
export function lotsFor(doc: GoodsIssueDoc): GoodsLot[] {
  const rnd = seeded(Number(doc.id.replace(/\D/g, "")) * 31 + 7);
  const kg = kgOf(doc.packing);
  const base = doc.code.replace(/^[A-Z]+/, "PD").replace(/[A-Z]$/, "");
  return Array.from({ length: 8 }, (_, i) => {
    const age = 60 - i * 6 - Math.floor(rnd() * 4);
    const day = Math.max(1, 28 - i * 3);
    const pieces =
      i >= 6
        ? 20 + Math.floor(rnd() * 40)
        : Math.round((800 + rnd() * 2400) / 10) * 10;
    return {
      id: `${doc.id}-lot${i + 1}`,
      code: `${base}A-06-${pad(i + 1)}`,
      zone: ZONES[i % ZONES.length],
      receivedAt: `${i < 4 ? 4 : 5}/${pad(day)}/2026`,
      ageDays: age,
      pieces,
      kgPerPiece: kg,
    };
  });
}

/** ปริมาณที่ขอเบิกเป็นตัน — เก็บติดลบไว้ในใบ */
export const requestTons = (d: GoodsIssueDoc) => Math.abs(d.qty);

export const formatTons = (v: number) =>
  v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const formatCount = (v: number) => v.toLocaleString("en-US");

/** บันทึกจ่ายแล้วกลับมาที่แท็บรอจ่าย/คืน ให้เห็นว่าใบหายไปจริง (ใช้ครั้งเดียว) */
let ISSUE_TAB_REQUEST = false;
export function requestIssueTab() {
  ISSUE_TAB_REQUEST = true;
}
export const issueTabRequested = () => ISSUE_TAB_REQUEST;
export function clearIssueTabRequest() {
  ISSUE_TAB_REQUEST = false;
}
