// ============================================================
// รับเข้าสินค้า — ใบสั่งซื้อ/ใบสั่งผลิตที่รอรับของเข้าคลังสินค้า
//
// หนึ่งใบ = ของหนึ่งรายการที่มากับรถหนึ่งคัน รับเข้าทีละสลิง (หนึ่งยกของรถยก)
// แต่ละสลิงได้เลขที่รับสินค้าของตัวเองที่พิมพ์ติดไปกับของจริง
//
// ไม่มีหลังบ้าน เก็บในหน่วยความจำของแท็บเหมือนที่อื่นในโปรเจกต์ รีเฟรชแล้ว
// กลับเป็นค่าตั้งต้น
// ============================================================

/** หน่วยที่นับรับเข้า — ตันคือปุ๋ยเทกอง/กระสอบ ชิ้นคือของนับชิ้น ลังคือปุ๋ยน้ำ */
export type ReceivingUnit = "ตัน" | "ชิ้น" | "ลัง";

export type ReceivingSource = "production" | "external";

export const SOURCE_LABEL: Record<ReceivingSource, string> = {
  production: "รอรับเข้าจากการผลิต",
  external: "รอรับเข้าภายนอก",
};

/** ชื่อใบตามที่มา — ใช้ทั้งหัวหน้าและปุ่มเพิ่ม */
export const DOC_TITLE: Record<ReceivingSource, string> = {
  production: "ใบรับเข้าสินค้าจากการผลิต",
  external: "ใบรับเข้าสินค้าภายนอก",
};

export const ADD_TITLE: Record<ReceivingSource, string> = {
  production: "เพิ่มการรับเข้าสินค้าจากการผลิต",
  external: "เพิ่มการรับเข้าสินค้าภายนอก",
};

export type Slip = {
  id: string;
  /** เลขที่รับสินค้า — เลขใบ-รอบ-ลำดับ พิมพ์ติดสลิง */
  no: string;
  /** วันเวลาที่รับ — ใช้นับสิทธิ์แก้ไขสามวันด้วย */
  at: Date;
  containerNo?: string;
  packing: string;
  /** ปริมาณต่อสลิง (ตัน) — ใช้เฉพาะของที่นับเป็นตัน */
  tons: number | null;
  /** จำนวนต่อสลิง ในหน่วยชิ้นหรือลัง */
  count: number;
  note?: string;
  receiver: string;
  editor?: string;
  cancelled: boolean;
};

export type ReceivingDoc = {
  id: string;
  code: string;
  createdAt: string;
  source: ReceivingSource;
  productName: string;
  /** ประเภทสินค้า เช่น ปุ๋ยกระสอบ สินค้า OEM ปุ๋ยน้ำ */
  productType: string;
  /** หมวด เช่น Bulk Compound */
  group: string;
  packing: string;
  supplier: string;
  arriveDate: string;
  truck: string;
  unit: ReceivingUnit;
  /** ยอดที่สั่ง ในหน่วยของใบ */
  orderQty: number;
  /** รอบที่เท่าไรของใบสั่งซื้อ — ส่วนกลางของเลขที่รับสินค้า */
  round: string;
  prCode: string;
  prqId: string;
  prMaker: string;
  poMaker: string;
  reason: string;
  deliveryFrom: string;
  buyerNote?: string;
  slips: Slip[];
  /** บันทึกเข้าคลังแล้ว — ย้ายไปแท็บรับสินค้าแล้ว */
  done: boolean;
};

/** บรรจุภัณฑ์ที่เลือกได้ตามหน่วย */
export const PACKING_OPTIONS: Record<ReceivingUnit, string[]> = {
  ตัน: ["50 กก.", "25 กก.", "40 กก.", "1 ตัน (Jumbo)"],
  ชิ้น: ["ชิ้น"],
  ลัง: ["12 ขวด", "24 ขวด"],
};

export const ME = "อลิสา พรสุขสิริ";

/** แก้ไขได้ภายในสามวันหลังรับ — เลยแล้วเหลือแต่ผู้ดูแลระบบที่แก้หรือยกเลิกได้ */
export const EDIT_DAYS = 3;
export const canEditSlip = (s: Slip, now = new Date()) =>
  now.getTime() - s.at.getTime() < EDIT_DAYS * 24 * 60 * 60 * 1000;

// ---------------------------------------------------------------
// มุมมองผู้ใช้ — ตัวอย่างนี้ไม่มีระบบสิทธิ์ ให้สลับดูได้ว่าแต่ละบทบาทเห็นอะไร
// ---------------------------------------------------------------

export type Role = "warehouse" | "admin";
export const ROLE_LABEL: Record<Role, string> = {
  warehouse: "คลัง A",
  admin: "Admin",
};
let role: Role = "warehouse";
export const currentRole = () => role;
export function setRole(r: Role) {
  role = r;
}

// ---------------------------------------------------------------
// ตัวเลข
// ---------------------------------------------------------------

export const liveSlips = (d: ReceivingDoc) => d.slips.filter((s) => !s.cancelled);

/** ยอดรับเข้าในหน่วยของใบ */
export const receivedQty = (d: ReceivingDoc) =>
  liveSlips(d).reduce((n, s) => n + (d.unit === "ตัน" ? (s.tons ?? 0) : s.count), 0);

export const receivedPieces = (d: ReceivingDoc) =>
  liveSlips(d).reduce((n, s) => n + s.count, 0);

export const outstanding = (d: ReceivingDoc) => Math.max(0, d.orderQty - receivedQty(d));

const unitWord = (d: ReceivingDoc) =>
  d.unit === "ลัง" ? "ลัง" : d.unit === "ชิ้น" ? "ชิ้น" : "ตัน";

/** "200.00 ตัน" / "1,000 ลัง" — ตันมีทศนิยมสองตำแหน่ง ของนับชิ้นไม่มี */
export function formatAmount(d: ReceivingDoc, v: number) {
  return d.unit === "ตัน"
    ? `${v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${unitWord(d)}`
    : `${Math.round(v).toLocaleString("en-US")} ${unitWord(d)}`;
}

export const formatTons = (v: number) =>
  v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const pad = (n: number) => String(n).padStart(2, "0");
export const formatAt = (d: Date) =>
  `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()} | ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;

/** เลขที่รับสินค้าถัดไปของใบนี้ — นับรวมที่ยกเลิกด้วย เลขเดิมห้ามวนกลับมาใช้ */
export const nextSlipNo = (d: ReceivingDoc) =>
  `${d.code}-${d.round}-${pad(d.slips.length + 1)}`;

// ---------------------------------------------------------------
// ข้อมูลตัวอย่าง
// ---------------------------------------------------------------

const SUPPLIER = "บริษัท เอชซี อินเตอร์เนชั่นแนล เทรดดิ้ง จำกัด";
const RECEIVERS = ["อลิสา พรสุขสิริ", "ณัฐพล ศรีวิไล", "สมชาย ใจดี"];

let slipSeq = 0;
function slips(
  code: string,
  round: string,
  unit: ReceivingUnit,
  packing: string,
  n: number,
  daysAgo: number,
  cancelled = 0
): Slip[] {
  // ยึดเที่ยงวันนี้เป็นฐาน ไม่ใช่เวลาตอนโหลด — ฝั่งเซิร์ฟเวอร์กับเบราว์เซอร์ต้อง
  // ได้เวลาเดียวกันเป๊ะ ไม่งั้นหน้าเว็บเตือนว่าข้อความไม่ตรงกันตอนเปิด
  const base = new Date();
  base.setHours(12, 0, 0, 0);
  return Array.from({ length: n + cancelled }, (_, i) => {
    const at = new Date(base.getTime() - (daysAgo * 24 + (n - i)) * 60 * 60 * 1000 + i * 137 * 1000);
    return {
      id: `slip-${++slipSeq}`,
      no: `${code}-${round}-${pad(i + 1)}`,
      at,
      containerNo: i % 3 === 0 ? undefined : `AB-${1234 + i}`,
      packing,
      tons: unit === "ตัน" ? (i === 0 ? 0.45 : 0.5) : null,
      count: unit === "ตัน" ? 24 : unit === "ลัง" ? 40 : 100,
      note: i === 0 && unit === "ตัน" ? "กระสอบฉีก 1 ใบ" : undefined,
      receiver: RECEIVERS[i % RECEIVERS.length],
      cancelled: i >= n,
    };
  });
}

type Seed = Omit<ReceivingDoc, "slips" | "prCode" | "prqId" | "prMaker" | "poMaker" | "reason" | "deliveryFrom"> & {
  seed?: [number, number, number?];
};

const SEEDS: Seed[] = [
  { id: "gr-1", code: "PO260115/01A", createdAt: "1/16/2026 | 10:42:52", source: "external", productName: "10-0-4+OM 50%", productType: "ปุ๋ยกระสอบ", group: "Bulk", packing: "50 กก.", supplier: SUPPLIER, arriveDate: "18/06/2026", truck: "กส - 2345", unit: "ตัน", orderQty: 800, round: "06", done: false },
  { id: "gr-2", code: "POI260115/01A", createdAt: "1/16/2026 | 10:42:52", source: "external", productName: "10-0-4+OM 50%", productType: "สินค้า OEM", group: "Compound", packing: "50 กก.", supplier: SUPPLIER, arriveDate: "18/06/2026", truck: "กข - 1234", unit: "ชิ้น", orderQty: 500, round: "01", done: false, seed: [6, 0, 2] },
  { id: "gr-3", code: "POI260115/01B", createdAt: "1/16/2026 | 10:42:52", source: "external", productName: "ปุ๋ยน้ำ สูตรเร่งดอก", productType: "ปุ๋ยน้ำ", group: "Compound", packing: "12 ขวด", supplier: SUPPLIER, arriveDate: "18/06/2026", truck: "กข - 1234", unit: "ลัง", orderQty: 1000, round: "01", done: false },
  { id: "gr-4", code: "PO260115/01B", createdAt: "1/16/2026 | 10:42:52", source: "external", productName: "16-20-0", productType: "ปุ๋ยกระสอบ", group: "Bulk", packing: "50 กก.", supplier: SUPPLIER, arriveDate: "19/06/2026", truck: "กข - 1234", unit: "ตัน", orderQty: 200, round: "02", done: false, seed: [6, 1, 2] },
  { id: "gr-5", code: "PO260116/02A", createdAt: "1/16/2026 | 11:08:14", source: "external", productName: "15-15-15", productType: "ปุ๋ยกระสอบ", group: "Compound", packing: "25 กก.", supplier: SUPPLIER, arriveDate: "19/06/2026", truck: "กข - 5678", unit: "ตัน", orderQty: 300, round: "01", done: false },
  { id: "gr-6", code: "PO260116/03A", createdAt: "1/16/2026 | 13:20:05", source: "external", productName: "สติกเกอร์ QR", productType: "สินค้า OEM", group: "Compound", packing: "ชิ้น", supplier: SUPPLIER, arriveDate: "20/06/2026", truck: "กค - 4417", unit: "ชิ้น", orderQty: 2000, round: "01", done: false },
  { id: "gr-7", code: "MO260115/01", createdAt: "1/15/2026 | 08:15:30", source: "production", productName: "ปุ๋ยจัมโบ้ 21-0-0", productType: "ปุ๋ยกระสอบ", group: "Bulk", packing: "1 ตัน (Jumbo)", supplier: "ไลน์ 1", arriveDate: "15/06/2026", truck: "-", unit: "ตัน", orderQty: 120, round: "01", done: false, seed: [4, 0] },
  { id: "gr-8", code: "MO260115/02", createdAt: "1/15/2026 | 13:40:05", source: "production", productName: "15-15-15 กระสอบ", productType: "ปุ๋ยกระสอบ", group: "Compound", packing: "50 กก.", supplier: "ไลน์ 2", arriveDate: "15/06/2026", truck: "-", unit: "ตัน", orderQty: 80, round: "01", done: false },
  { id: "gr-9", code: "MO260116/01", createdAt: "1/16/2026 | 07:55:40", source: "production", productName: "16-20-0 กระสอบ", productType: "ปุ๋ยกระสอบ", group: "Bulk", packing: "50 กก.", supplier: "ไลน์กลาง", arriveDate: "16/06/2026", truck: "-", unit: "ตัน", orderQty: 60, round: "01", done: false },
  { id: "gr-10", code: "MO260116/02", createdAt: "1/16/2026 | 09:10:11", source: "production", productName: "ปุ๋ยน้ำ สูตรบำรุงต้น", productType: "ปุ๋ยน้ำ", group: "Compound", packing: "24 ขวด", supplier: "ไลน์ 3", arriveDate: "16/06/2026", truck: "-", unit: "ลัง", orderQty: 400, round: "01", done: false },
  { id: "gr-11", code: "MO260116/03", createdAt: "1/16/2026 | 10:01:50", source: "production", productName: "46-0-0 ยูเรีย", productType: "ปุ๋ยกระสอบ", group: "Bulk", packing: "50 กก.", supplier: "ไลน์ 1", arriveDate: "16/06/2026", truck: "-", unit: "ตัน", orderQty: 100, round: "01", done: false },
];

function doneSeeds(): Seed[] {
  const out: Seed[] = [];
  const names = ["10-0-4+OM 50%", "16-20-0", "15-15-15", "21-0-0", "46-0-0"];
  for (let i = 0; i < 24; i++) {
    const ext = i % 3 !== 0;
    const day = 10 + (i % 5);
    out.push({
      id: `gr-d${i + 1}`,
      code: `${ext ? "PO" : "MO"}2601${day}/${pad((i % 4) + 1)}${ext ? "A" : ""}`,
      createdAt: `1/${day}/2026 | ${pad(8 + (i % 9))}:${pad((i * 7) % 60)}:${pad((i * 13) % 60)}`,
      source: ext ? "external" : "production",
      productName: names[i % names.length],
      productType: i % 4 === 1 ? "สินค้า OEM" : "ปุ๋ยกระสอบ",
      group: i % 2 ? "Compound" : "Bulk",
      packing: "50 กก.",
      supplier: ext ? SUPPLIER : `ไลน์ ${(i % 3) + 1}`,
      arriveDate: `${pad(day)}/06/2026`,
      truck: ext ? `กข - ${1000 + i * 37}` : "-",
      unit: "ตัน",
      orderQty: 3,
      round: "01",
      done: true,
      seed: [6, 5 + (i % 3)],
    });
  }
  return out;
}

const META = {
  prCode: "PR260101/01",
  prqId: "84f0471",
  prMaker: "อลิสา พรสุขสิริ",
  poMaker: "อลิสา พรสุขสิริ",
  reason: "ผลิต",
  deliveryFrom: "01/06/2026",
};

export const RECEIVING_DOCS: ReceivingDoc[] = [...SEEDS, ...doneSeeds()].map(
  ({ seed, ...d }) => ({
    ...d,
    ...META,
    buyerNote: undefined,
    slips: seed ? slips(d.code, d.round, d.unit, d.packing, seed[0], seed[1], seed[2]) : [],
  })
);

export const docOf = (id: string) => RECEIVING_DOCS.find((d) => d.id === id);
export const slipOf = (d: ReceivingDoc, slipId: string) =>
  d.slips.find((s) => s.id === slipId);

export const pendingDocs = () => RECEIVING_DOCS.filter((d) => !d.done);

export function addSlip(d: ReceivingDoc, s: Omit<Slip, "id" | "no">): Slip {
  const slip = { ...s, id: `slip-${++slipSeq}`, no: nextSlipNo(d) };
  d.slips.push(slip);
  return slip;
}

export function updateSlip(s: Slip, patch: Partial<Slip>) {
  Object.assign(s, patch);
}

export function markDone(d: ReceivingDoc) {
  d.done = true;
}
