// ============================================================
// ชั่งน้ำหนัก — สองชั้นตามแบบ (Figma หน้า Weighing):
//
//   1) รายการใบชั่งน้ำหนัก (WeighingDoc) — แท็บ รอชั่ง/ชั่งแล้ว
//      หนึ่งแถว = รถหนึ่งคันที่จะเข้ามาชั่งสินค้าหนึ่งรายการ
//   2) ใบชั่งน้ำหนัก — รอชั่งอยู่คือฟอร์มกรอกเลย (กดจากรายการแล้วกรอกได้ทันที)
//      ชั่งแล้วเป็นหน้าดูอย่างเดียว แก้ไขได้ภายใน WEIGHING_EDIT_DAYS วัน
//      ถ้าใบสั่งซื้อปิดแล้วหรือพ้นกำหนด แก้ไม่ได้อีก
//
// สองแบบตามทิศทางของรถ:
//   รับเข้า (ใบสั่งซื้อ PO/POI) — รถเข้ามาพร้อมของ → ลงของ → ชั่งออกรถเปล่า
//     น้ำหนักจริง = เข้า − ออก เทียบกับใบชั่งของผู้ขาย มากกว่า = ของแถม
//     น้อยกว่า = สูญหาย
//   จ่ายออก (ใบเบิก PRI) — รถเปล่าเข้ามา → ขึ้นของ → ชั่งออกพร้อมของ
//     น้ำหนักจริง = ออก − เข้า ไม่มีใบชั่งของผู้ขายให้เทียบ
// ============================================================

export const formatTon = (v: number) =>
  v.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** ใส่เครื่องหมายบวกให้ค่าที่เป็นบวก เพื่อให้อ่านส่วนต่างได้ทันทีว่าได้หรือเสีย */
export const formatSignedTon = (v: number) => `${v > 0 ? "+" : ""}${formatTon(v)}`;

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

const pad = (n: number) => String(n).padStart(2, "0");
const pick = <T,>(pool: T[], rnd: () => number) => pool[Math.floor(rnd() * pool.length)];

function timeAt(rnd: () => number) {
  return `${pad(7 + Math.floor(rnd() * 10))}:${pad(Math.floor(rnd() * 12) * 5)}`;
}

// ---------------------------------------------------------------
// ชนิด/สถานะ
// ---------------------------------------------------------------

export type WeighingKind = "inbound" | "outbound";

export const WEIGHING_KIND_LABEL: Record<WeighingKind, string> = {
  inbound: "รับเข้า",
  outbound: "จ่ายออก",
};

/** pending = รอชั่ง (อาจมีร่างค้างอยู่) / weighed = ชั่งแล้ว / cancelled = แอดมินยกเลิก */
export type WeighingStatus = "pending" | "weighed" | "cancelled";

/** ผู้ใช้ที่กำลังชั่ง — ยังไม่มีระบบล็อกอินจริง ใช้ชื่อเดียวกับในแบบไปก่อน */
export const WEIGHING_CURRENT_USER = "อลิสา พรสุขสิริ";

/** ชั่งแล้วแก้ไขได้ภายในกี่วัน (ตามแบบ "แก้ไขได้ในสามวัน") */
export const WEIGHING_EDIT_DAYS = 3;

/** ไฟล์ที่แนบไว้กับใบชั่ง — เก็บแค่ชื่อ/ขนาด (ไม่มี backend เก็บไฟล์จริง) */
export type WeighingFileRef = { id: string; name: string; size: number };

/** ผลการชั่งหนึ่งครั้ง — ค่าน้ำหนักเป็น กก. ตามตาชั่งจริง แปลงเป็นตันตอนแสดงผล */
export type WeighingRecord = {
  /** ชั่งเข้า — รับเข้า: รถพร้อมสินค้า / จ่ายออก: รถเปล่า */
  inKg: number;
  inAt: string;
  /** ชั่งออก — รับเข้า: รถเปล่า / จ่ายออก: รถพร้อมสินค้า */
  outKg: number;
  outAt: string;
  /** น้ำหนักสินค้าตามใบชั่งของผู้ขาย — มีเฉพาะรับเข้า */
  sellerKg?: number;
  note?: string;
  phone?: string;
  address?: string;
  parichFiles: WeighingFileRef[];
  sellerFiles: WeighingFileRef[];
  idCardFiles: WeighingFileRef[];
  /** ผู้ชั่งน้ำหนัก */
  weigher: string;
  /** ผู้แก้ไขชั่งน้ำหนักล่าสุด — มีเฉพาะใบที่เคยแก้หลังชั่ง */
  editor?: string;
};

export type WeighingDoc = {
  id: string;
  /** เลขที่ใบชั่ง = เลขที่ใบสั่งซื้อ/ใบเบิก + ตัวอักษรรายการ (A/B/C...) */
  code: string;
  kind: WeighingKind;
  createdAt: string;
  productName: string;
  productSub?: string;
  /** ประเภทวัตถุดิบ เช่น "ปุ๋ยกระสอบ" */
  category: string;
  /** หมวดสินค้า — ประเภท | หมวด | บรรจุภัณฑ์ สามชั้นชุดเดียวกับทั้งแอป */
  group: string;
  packing?: string;
  /** บริษัทผู้ขาย (รับเข้า) / ลูกค้าปลายทาง (จ่ายออก) */
  supplier: string;
  plate: string;
  /** วันที่รถจะเข้า */
  arriveDate: string;
  /** สั่งซื้อ (รับเข้า) / เบิกจ่าย (จ่ายออก) — ตัน */
  orderTon: number;
  /** ยอดที่รอชั่งของรถคันนี้ — ตัน (ไม่มีค่า = ยังไม่ระบุ โชว์ "-") */
  expectedTon?: number;
  /** ผู้ทำใบสั่งซื้อ / ผู้ทำใบสั่งจ่าย */
  maker: string;
  /** ผู้แก้ไขสั่งซื้อ/สั่งจ่ายล่าสุด */
  makerEditor?: string;
  /** เหตุผลการซื้อ — รับเข้าเท่านั้น */
  reason?: string;
  /** ช่วงวันที่รถส่งสินค้า — รับเข้าเท่านั้น ไม่มีวันสิ้นสุด = "ยังไม่ระบุ" */
  deliveryFrom?: string;
  deliveryTo?: string;
  buyerNote?: string;
  status: WeighingStatus;
  /** ผลการชั่ง — ชั่งแล้วมีเสมอ รอชั่งมีเมื่อบันทึกร่างไว้ */
  record?: WeighingRecord;
  /** ชั่งไปแล้วกี่วัน — ใช้ตัดสินว่ายังแก้ไขได้ไหม */
  weighedDaysAgo?: number;
  /** ใบสั่งซื้อต้นทางปิดใบแล้ว — ย้ายไปแท็บชั่งแล้ว และแก้ไขไม่ได้อีก */
  poClosed?: boolean;
  cancelReason?: string;
  cancelledBy?: string;
};

// ---------------------------------------------------------------
// คำนวณ
// ---------------------------------------------------------------

/** น้ำหนักสินค้าจริง (กก.) จากสองจุดชั่ง — กลับทิศตามชนิดรถ ไม่ติดลบ */
export function netKg(kind: WeighingKind, inKg: number, outKg: number): number {
  return Math.max(0, kind === "inbound" ? inKg - outKg : outKg - inKg);
}

/** น้ำหนักสินค้าจริงของใบนี้ (ตัน) — ยังไม่มีผลชั่ง = null */
export function weighingNetTon(doc: WeighingDoc): number | null {
  if (!doc.record) return null;
  return netKg(doc.kind, doc.record.inKg, doc.record.outKg) / 1000;
}

export type DiffKind = "bonus" | "loss" | "even";

export const DIFF_LABEL: Record<DiffKind, string> = {
  bonus: "ของแถม",
  loss: "สูญหาย",
  even: "ตรงพอดี",
};

/** ส่วนต่าง = ของเรา − ของผู้ขาย (ตัน) พร้อม % เทียบกับใบผู้ขาย */
export function weighingDiff(netTon: number, sellerTon: number) {
  const diffTon = Math.round((netTon - sellerTon) * 100) / 100;
  const kind: DiffKind = diffTon > 0 ? "bonus" : diffTon < 0 ? "loss" : "even";
  const percent = sellerTon > 0 ? Math.abs(diffTon / sellerTon) * 100 : 0;
  return { diffTon, kind, percent };
}

/** อยู่แท็บ "ชั่งน้ำหนักแล้ว" ไหม — ชั่งแล้ว/ยกเลิก หรือใบสั่งซื้อปิดใบไปแล้ว */
export function isWeighingDone(doc: WeighingDoc): boolean {
  return doc.status !== "pending" || !!doc.poClosed;
}

/** แก้ไขใบที่ชั่งแล้วได้ไหม — ภายในสามวัน และใบสั่งซื้อยังไม่ปิด */
export function canEditWeighing(doc: WeighingDoc): boolean {
  return (
    doc.status === "weighed" &&
    !doc.poClosed &&
    (doc.weighedDaysAgo ?? 0) <= WEIGHING_EDIT_DAYS
  );
}

/** กรอกชั่งได้ไหม (ใบรอชั่งที่ใบสั่งซื้อยังไม่ปิด) */
export function canWeigh(doc: WeighingDoc): boolean {
  return doc.status === "pending" && !doc.poClosed;
}

// ---------------------------------------------------------------
// ชิปในแต่ละแท็บ
// ---------------------------------------------------------------

export type WeighingPendingChip = "all" | WeighingKind;
export const WEIGHING_PENDING_CHIPS: WeighingPendingChip[] = ["all", "inbound", "outbound"];
export const WEIGHING_PENDING_CHIP_LABEL: Record<WeighingPendingChip, string> = {
  all: "ทั้งหมด",
  inbound: "รับเข้า",
  outbound: "จ่ายออก",
};

export type WeighingDoneChip = "weighed" | "cancelled";
export const WEIGHING_DONE_CHIPS: WeighingDoneChip[] = ["weighed", "cancelled"];
export const WEIGHING_DONE_CHIP_LABEL: Record<WeighingDoneChip, string> = {
  weighed: "ชั่งน้ำหนัก",
  cancelled: "ยกเลิก",
};

export function matchesWeighingChip(
  d: WeighingDoc,
  chip: WeighingPendingChip | WeighingDoneChip
): boolean {
  if (chip === "all") return true;
  if (chip === "inbound" || chip === "outbound") return d.kind === chip;
  if (chip === "cancelled") return d.status === "cancelled";
  return d.status !== "cancelled";
}

export function matchesWeighing(d: WeighingDoc, q: string): boolean {
  const s = q.trim().toLowerCase();
  if (!s) return true;
  return [d.code, d.productName, d.productSub ?? "", d.category, d.group, d.supplier, d.plate].some(
    (v) => v.toLowerCase().includes(s)
  );
}

// ---------------------------------------------------------------
// ข้อมูลตัวอย่าง
// ---------------------------------------------------------------

const ACTOR_POOL = [
  "อลิสา พรสุขสิริ",
  "ธนกฤต ศรีบุญเรือง",
  "พิมพ์ชนก วงศ์อารีย์",
  "ณัฐวุฒิ แก้วประเสริฐ",
  "สุชานาถ อินทร์ทอง",
  "กิตติพงศ์ ใจดีงาม",
];

const ITEM_POOL: { name: string; sub: string; category: string; group: string; packing?: string }[] = [
  { name: "21-0-0", sub: "ฟูเจียนผง", category: "ปุ๋ยจัมโบ้", group: "แม่ปุ๋ย", packing: "Bulk" },
  { name: "46-0-0", sub: "ยูเรีย เม็ด", category: "ปุ๋ยกระสอบ", group: "แม่ปุ๋ย", packing: "Bulk" },
  { name: "16-20-0", sub: "เม็ดปั้น", category: "ปุ๋ยกระสอบ", group: "แม่ปุ๋ย", packing: "50 กก." },
  { name: "10-0-4+OM 50%", sub: "ฟูเจียนผง", category: "ปุ๋ยกระสอบ", group: "อินทรีย์เคมี", packing: "40 กก." },
  { name: "แม่ปุ๋ยโพแทส", sub: "เกล็ดแดง", category: "ปุ๋ยเกล็ด", group: "แม่ปุ๋ย", packing: "25 กก." },
  { name: "ยิปซัม", sub: "ผงละเอียด", category: "วัตถุดิบเสริม", group: "PNR", packing: "Bulk" },
];

const SUPPLIER_POOL = [
  "เอชซี อินเตอร์เนชั่นแนล เทรดดิ้ง จำกัด",
  "ไทยเคมิคอล อะกริ จำกัด",
  "ยูนิเวอร์แซล เคมิคอล กรุ๊ป",
  "ไทยแอกโกร อินดัสทรี",
  "สยามเฟอร์ทิไลเซอร์ จำกัด",
];

const REASON_POOL = ["ผลิต", "สำรองคลัง", "ขาย", "รองรับคำสั่งซื้อพิเศษ"];

const BUYER_NOTE_POOL = [
  "ของจะเข้ามาช่วงบ่าย",
  "รถอาจเข้าล่าช้ากว่านัด แจ้งยามล่วงหน้าด้วย",
  "ประสานคนขับก่อนเข้าคลัง เบอร์อยู่ในใบสั่งซื้อ",
];

const CANCEL_REASON_POOL = ["เอกสารไม่ถูกต้อง", "รถไม่มาตามนัด", "ผู้ขายยกเลิกการส่ง"];

const fileRef = (id: string, n: number): WeighingFileRef => ({
  id,
  name: `เอกสารการชั่ง No.12X45345678${n}.pdf`,
  size: 6_900_000,
});

/** ผลชั่งตัวอย่างของใบที่ชั่งแล้ว — น้ำหนักจริงใกล้ยอดที่รอชั่ง ±3% */
function sampleRecord(id: string, kind: WeighingKind, ton: number, rnd: () => number): WeighingRecord {
  const tareKg = Math.round((9000 + rnd() * 6000) / 10) * 10;
  const netKgValue = Math.round((ton * 1000 * (0.97 + rnd() * 0.06)) / 10) * 10;
  const loaded = tareKg + netKgValue;
  return {
    inKg: kind === "inbound" ? loaded : tareKg,
    inAt: timeAt(rnd),
    outKg: kind === "inbound" ? tareKg : loaded,
    outAt: timeAt(rnd),
    sellerKg: kind === "inbound" ? ton * 1000 : undefined,
    note: rnd() < 0.3 ? "รถเข้าช้ากว่านัด 30 นาที" : undefined,
    parichFiles: [fileRef(`${id}-p1`, 1)],
    sellerFiles: kind === "inbound" ? [fileRef(`${id}-s1`, 2)] : [],
    idCardFiles: [fileRef(`${id}-c1`, 3)],
    weigher: pick(ACTOR_POOL, rnd),
  };
}

const randomPlate = (rnd: () => number) =>
  `${pick(["กข", "กง", "กส", "ขค", "70", "71", "84"], rnd)} - ${1000 + Math.floor(rnd() * 8999)}`;

type Seed = {
  code: string;
  kind: WeighingKind;
  status: WeighingStatus;
  item: number;
  ton: number;
  expected?: boolean;
  weighedDaysAgo?: number;
  poClosed?: boolean;
};

/**
 * เขียนมือให้ครอบคลุมทุกกรณีตามแบบ แล้วต่อด้วยตัวสร้างให้ตารางยาวพอแบ่งหน้า
 *   - รอชั่ง รับเข้า/จ่ายออก (บางใบยังไม่ระบุยอด = "-")
 *   - ชั่งแล้ว แก้ไขได้ (ภายในสามวัน) / พ้นสามวัน / ใบสั่งซื้อปิดแล้ว
 *   - ยกเลิกโดยแอดมิน
 */
const SEEDS: Seed[] = [
  { code: "PO260115/01A", kind: "inbound", status: "pending", item: 3, ton: 800, expected: true },
  { code: "PRI260115/01A", kind: "outbound", status: "pending", item: 3, ton: 800, expected: true },
  { code: "POI260115/01B", kind: "inbound", status: "pending", item: 0, ton: 300 },
  { code: "PO260115/02A", kind: "inbound", status: "pending", item: 1, ton: 640, expected: true },
  { code: "PRI260116/02A", kind: "outbound", status: "pending", item: 0, ton: 120 },
  { code: "PO260114/03A", kind: "inbound", status: "weighed", item: 3, ton: 800, weighedDaysAgo: 1 },
  { code: "PRI260114/01A", kind: "outbound", status: "weighed", item: 3, ton: 800, weighedDaysAgo: 0 },
  { code: "PO260110/04A", kind: "inbound", status: "weighed", item: 2, ton: 500, weighedDaysAgo: 6 },
  { code: "PO260112/05A", kind: "inbound", status: "weighed", item: 1, ton: 420, weighedDaysAgo: 1, poClosed: true },
  { code: "PO260113/06A", kind: "inbound", status: "pending", item: 4, ton: 220, expected: true, poClosed: true },
  { code: "PO260111/07A", kind: "inbound", status: "cancelled", item: 3, ton: 800, weighedDaysAgo: 2 },
  { code: "PRI260111/03A", kind: "outbound", status: "cancelled", item: 5, ton: 150 },
];

function buildDoc(seed: Seed, i: number): WeighingDoc {
  const rnd = seeded(500 + i);
  const item = ITEM_POOL[seed.item % ITEM_POOL.length];
  const id = `wg-${i + 1}`;
  const day = 18 - (i % 14);
  const inbound = seed.kind === "inbound";
  const weighed = seed.status === "weighed" || (seed.status === "cancelled" && seed.weighedDaysAgo != null);
  return {
    id,
    code: seed.code,
    kind: seed.kind,
    createdAt: `1/${day}/2026 | ${pad(8 + (i % 9))}:${pad(Math.floor(rnd() * 60))}:${pad(Math.floor(rnd() * 60))}`,
    productName: item.name,
    productSub: item.sub,
    category: item.category,
    group: item.group,
    packing: item.packing,
    supplier: pick(SUPPLIER_POOL, rnd),
    plate: randomPlate(rnd),
    arriveDate: `${pad(Math.min(28, day + 2))}/06/2026`,
    orderTon: seed.ton,
    expectedTon: seed.expected || weighed ? seed.ton : undefined,
    maker: pick(ACTOR_POOL, rnd),
    makerEditor: rnd() < 0.3 ? pick(ACTOR_POOL, rnd) : undefined,
    reason: inbound ? pick(REASON_POOL, rnd) : undefined,
    deliveryFrom: inbound ? "01/06/2026" : undefined,
    buyerNote: rnd() < 0.3 ? pick(BUYER_NOTE_POOL, rnd) : undefined,
    status: seed.status,
    record: weighed ? sampleRecord(id, seed.kind, seed.ton, rnd) : undefined,
    weighedDaysAgo: seed.weighedDaysAgo,
    poClosed: seed.poClosed,
    cancelReason: seed.status === "cancelled" ? pick(CANCEL_REASON_POOL, rnd) : undefined,
    cancelledBy: seed.status === "cancelled" ? pick(ACTOR_POOL, rnd) : undefined,
  };
}

/** ต่อท้ายให้ตารางยาวพอเห็นการแบ่งหน้า — วนรับเข้า/จ่ายออก และรอชั่ง/ชั่งแล้ว */
function moreSeeds(count: number): Seed[] {
  return Array.from({ length: count }, (_, i) => {
    const kind: WeighingKind = i % 3 === 2 ? "outbound" : "inbound";
    const prefix = kind === "outbound" ? "PRI" : i % 4 === 1 ? "POI" : "PO";
    const weighed = i % 5 >= 2;
    return {
      code: `${prefix}2601${pad(18 - (i % 14))}/${pad((i % 9) + 1)}${String.fromCharCode(65 + (i % 3))}`,
      kind,
      status: weighed ? "weighed" : "pending",
      item: i,
      ton: 150 + ((i * 70) % 700),
      expected: i % 2 === 0,
      weighedDaysAgo: weighed ? 4 + (i % 6) : undefined,
    } satisfies Seed;
  });
}

export const WEIGHING_DOCS: WeighingDoc[] = [...SEEDS, ...moreSeeds(20)].map(buildDoc);

export function getWeighingDoc(id: string): WeighingDoc | undefined {
  return WEIGHING_DOCS.find((d) => d.id === id);
}

// ---------------------------------------------------------------
// ต้นแบบ — รถหนึ่งคันมีหลายสินค้า (1-3 รายการ) ชั่งต่อเนื่องหลายจุด
// ---------------------------------------------------------------
//
// WeighingRound เดิมข้างบนมีแค่สองจุดชั่ง (เข้า/ออก) เพราะรถหนึ่งคันมีสินค้า
// เดียวเสมอ — กรณีรถคันเดียวขนหลายสินค้า ต้องชั่งเป็นลำดับ: เข้าเต็มคัน →
// ลงสินค้าที่ 1 แล้วชั่ง → ลงสินค้าที่ 2 แล้วชั่ง → ... → ลงสินค้าสุดท้ายแล้ว
// ชั่ง (=รถเปล่า) น้ำหนักของสินค้าแต่ละตัว = ผลต่างระหว่างจุดชั่งที่ติดกัน
// สองจุด ไม่ใช่ (เข้า − ออก) ตรงๆ เหมือนกรณีสินค้าเดียว
//
// จุดชั่ง (checkpoint) มีจำนวน = จำนวนสินค้า + 1 เสมอ:
//   checkpoint[0]            = ชั่งเข้า (รถ + สินค้าทั้งหมด)
//   checkpoint[1..N-1]       = ชั่งหลังลงสินค้าที่ 1..N-1
//   checkpoint[N]            = ชั่งหลังลงสินค้าสุดท้าย = รถเปล่า (tare)
//   น้ำหนักสินค้าตัวที่ i    = checkpoint[i] − checkpoint[i+1]
//
// กรณีสินค้าเดียว (N=1) จุดชั่งเหลือแค่ 2 จุด (เข้า/ออก) ตรงกับ WeighingRound
// เดิมพอดี — ถือเป็นกรณีพิเศษของโมเดลนี้ ไม่ใช่คนละระบบ

export type WeighCheckpoint = {
  seq: number;
  ton?: number;
  at?: string;
};

export type TruckProduct = {
  id: string;
  productName: string;
  productSub?: string;
  category: string;
  packing?: string;
  /** น้ำหนักตามใบชั่งของผู้ขาย (ตัน) — คนละใบกับใบชั่งของพาริช เทียบส่วนต่างแบบเดียวกับ WeighingRound เดิม */
  supplierTon?: number;
  /** เลขที่ใบชั่งของผู้จำหน่าย — กรอกเอง เพราะเป็นเลขที่ผู้ขายออกใบเอง คนละชุดกับเลขที่ของพาริช */
  supplierSlipNo?: string;
  /** เลขที่ใบชั่งของพาริช — ระบบสร้างให้อัตโนมัติทันทีที่บันทึกน้ำหนักสินค้าตัวนี้สำเร็จ (ดู parichSlipNo()) ไม่ต้องกรอกเอง */
  parichSlipNo?: string;
};

export type MultiProductRound = {
  id: string;
  receiptCode: string;
  batchId: string;
  plate: string;
  arriveDate: string;
  /** เรียงตามลำดับที่จะลงของจริงหน้างาน — ลำดับนี้กำหนดว่า checkpoint ไหนคู่กับสินค้าไหน */
  products: TruckProduct[];
  checkpoints: WeighCheckpoint[];
};

/** น้ำหนักสินค้าจริงของรายการที่ index (นับจาก 0) — null ถ้ายังไม่ครบสองจุดชั่งที่ติดกัน */
export function productNetTon(round: MultiProductRound, index: number): number | null {
  const a = round.checkpoints[index]?.ton;
  const b = round.checkpoints[index + 1]?.ton;
  if (a == null || b == null) return null;
  return Math.round((a - b) * 100) / 100;
}

/** ส่วนต่างของสินค้าตัวนั้น = ของเรา − ของผู้ขาย เหมือน roundDiffTon เดิม */
export function productDiffTon(round: MultiProductRound, index: number): number | null {
  const net = productNetTon(round, index);
  const supplierTon = round.products[index]?.supplierTon;
  if (net === null || supplierTon == null) return null;
  return Math.round((net - supplierTon) * 100) / 100;
}

/** เลขที่ใบชั่งของพาริชต่อสินค้า — ต่อท้ายเลขที่รับสินค้าด้วยตัวอักษรเรียงตาม
    ลำดับสินค้า (A, B, C, ...) แบบเดียวกับ lineItemCode ของ PO/ใบสั่งซื้ออื่นๆ
    รับแค่ receiptCode เฉยๆ ไม่รับทั้ง MultiProductRound เพราะตอนสร้างเลขที่
    ยังไม่จำเป็นต้องมี products/checkpoints ครบ (เรียกได้ตั้งแต่ตอนตั้งค่า
    ก่อนเริ่มชั่งจริง) */
export function parichSlipNo(receiptCode: string, index: number): string {
  return `${receiptCode}-${String.fromCharCode(65 + index)}`;
}

/** ข้อมูลรถ+ใบสั่งซื้อของต้นแบบนี้ — คงที่ ไม่ให้แก้ในหน้าต้นแบบ จุดที่ให้
    เลือก/แก้ได้เองคือแค่ "จะเอาสินค้าตัวไหนขึ้นรถคันนี้บ้าง และเรียงลำดับลง
    ของยังไง" (ดูหน้า /weighing/multi-demo ส่วนตั้งค่าก่อนชั่ง) */
export const MULTI_PRODUCT_DEMO_ROUND = {
  id: "wg-multi-demo",
  receiptCode: "PO260130/09",
  batchId: "IN-7f3a-9c21",
  plate: "70 - 4471",
  arriveDate: "30/01/2026",
};

/** สินค้าทั้งหมดที่มีอยู่ในใบสั่งซื้อนี้ — หนึ่ง PO อาจมีได้หลายรายการ
    (ตัวอย่างนี้มี 3) แต่รถคันหนึ่งไม่จำเป็นต้องขนครบทุกตัว อาจขนมาแค่บางส่วน
    ก็ได้ (เช่น PO มี 3 แต่รถคันนี้ขนมาแค่ 2) ให้เลือกจากสระนี้เองว่าจะเอา
    ตัวไหนบ้างและเรียงลำดับการลงของยังไงในหน้าตั้งค่าก่อนเริ่มชั่ง */
export const PO_LINE_ITEMS_POOL: TruckProduct[] = [
  {
    id: "poitem-1",
    productName: "21-0-0",
    productSub: "ฟูเจียนผง",
    category: "วัตถุดิบปุ๋ยกระสอบ",
    packing: "Bulk",
  },
  {
    id: "poitem-2",
    productName: "46-0-0",
    productSub: "ยูเรีย เม็ด",
    category: "วัตถุดิบปุ๋ยกระสอบ",
    packing: "Bulk",
  },
  {
    id: "poitem-3",
    productName: "16-20-0",
    productSub: "เม็ดปั้น",
    category: "วัตถุดิบปุ๋ยกระสอบ",
    packing: "50 Kg",
  },
];
