// ============================================================
// ชั่งน้ำหนัก — สามชั้นเหมือนใบรับเข้าสต็อกทั่วไป (lib/general-stock.ts)
// แต่คนละโดเมน ไม่แชร์โค้ดกัน:
//
//   1) รายการใบสั่งซื้อที่ต้องชั่ง (WeighingDoc) — แท็บ รอชั่ง/ชั่งแล้ว
//   2) ใบชั่งของ PO เดียว รวมทุกรอบที่รถเข้ามาชั่ง (WeighingReceipt)
//   3) ฟอร์มกรอกชั่งจริงของแต่ละรอบ — คนละหน้า อ่านค่าจาก WeighingReceipt
//
// หนึ่งรอบ (WeighingRound) คือรถหนึ่งคันเข้ามาชั่งครั้งหนึ่ง:
//   ชั่งเข้าพร้อมของ → ลงของ → ชั่งออกรถเปล่า → น้ำหนักจริง = เข้า − ออก
//   เทียบกับน้ำหนักตามใบชั่งของผู้ขาย ได้มากกว่า = ของแถม ได้น้อยกว่า = สูญหาย
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

/** เลขที่ตายตัวจาก id เอกสาร กันไม่ให้เปลี่ยนค่าไปมาระหว่างเซิร์ฟเวอร์กับเบราว์เซอร์ */
function seedFromId(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return Math.abs(h) || 1;
}

const pad = (n: number) => String(n).padStart(2, "0");
const pick = <T,>(pool: T[], rnd: () => number) => pool[Math.floor(rnd() * pool.length)];

function hex(rnd: () => number, len: number) {
  let s = "";
  for (let i = 0; i < len; i++) s += Math.floor(rnd() * 16).toString(16);
  return s;
}

function timeAt(rnd: () => number) {
  return `${pad(7 + Math.floor(rnd() * 10))}:${pad(Math.floor(rnd() * 60))}`;
}

// ---------------------------------------------------------------
// ชั้นที่ 1 — รายการใบสั่งซื้อที่ต้องชั่ง (แท็บ รอชั่ง/ชั่งแล้ว)
// ---------------------------------------------------------------

export type WeighingDocStatus = "pending" | "weighed";

export type WeighingDoc = {
  id: string;
  code: string;
  createdAt: string;
  productName: string;
  /** บรรทัดรองใต้ชื่อสินค้าในตารางรายการ เช่น ลักษณะ/แหล่งผลิต */
  productSub?: string;
  /** ประเภทวัตถุดิบ โชว์ในหัวใบชั่ง/หน้ากรอกชั่ง เช่น "วัตถุดิบปุ๋ยกระสอบ" */
  category: string;
  packing?: string;
  supplier: string;
  /** วันที่รถจะเข้าล่าสุด */
  arriveDate: string;
  /** ทะเบียนรถที่จะเข้าล่าสุด — คั่นด้วยจุลภาคถ้ามีหลายคัน ใช้แตกเป็นตัวเลือกในฟอร์มชั่ง */
  truck: string;
  orderTon: number;
  status: WeighingDocStatus;
};

export function matchesWeighing(d: WeighingDoc, q: string): boolean {
  const s = q.trim().toLowerCase();
  if (!s) return true;
  return [d.code, d.productName, d.productSub ?? "", d.supplier, d.truck].some(
    (v) => v.toLowerCase().includes(s)
  );
}

const ACTOR_POOL = [
  "อลิสา พรสุขสิริ",
  "ธนกฤต ศรีบุญเรือง",
  "พิมพ์ชนก วงศ์อารีย์",
  "ณัฐวุฒิ แก้วประเสริฐ",
  "สุชานาถ อินทร์ทอง",
  "กิตติพงศ์ ใจดีงาม",
];

const ITEM_POOL: {
  name: string;
  sub: string;
  category: string;
  packing?: string;
}[] = [
  { name: "21-0-0", sub: "ฟูเจียนผง", category: "วัตถุดิบปุ๋ยกระสอบ", packing: "Bulk" },
  { name: "46-0-0", sub: "ยูเรีย เม็ด", category: "วัตถุดิบปุ๋ยกระสอบ", packing: "Bulk" },
  { name: "16-20-0", sub: "เม็ดปั้น", category: "วัตถุดิบปุ๋ยกระสอบ", packing: "50 Kg" },
  { name: "10-0-4+OM 50%", sub: "ฟูเจียนผง", category: "วัตถุดิบปุ๋ยกระสอบ", packing: "40 Kg" },
  { name: "แม่ปุ๋ยโพแทส", sub: "เกล็ดแดง", category: "วัตถุดิบปุ๋ยเกล็ด", packing: "25 Kg" },
  { name: "ยิปซัม", sub: "ผงละเอียด", category: "วัตถุดิบเสริม", packing: "Bulk" },
];

const SUPPLIER_POOL = [
  "เอชซี อินเตอร์เนชั่นแนล เทรดดิ้ง จำกัด",
  "ไทยเคมิคอล อะกริ จำกัด",
  "ยูนิเวอร์แซล เคมิคอล กรุ๊ป",
  "ไทยแอกโกร อินดัสทรี",
  "สยามเฟอร์ทิไลเซอร์ จำกัด",
];

function docStamp(seq: number, rnd: () => number) {
  const day = 18 - (seq % 14);
  return `1/${day}/2026 | ${pad(8 + (seq % 9))}:${pad(Math.floor(rnd() * 60))}:${pad(Math.floor(rnd() * 60))}`;
}

/**
 * ห้ารายการเขียนมือให้ตรงกับไฟล์ออกแบบ ที่เหลือต่อท้ายด้วยตัวสร้าง
 * เพื่อให้ตารางยาวพอเห็นการเลื่อน/แบ่งหน้าจริง — สามรายการแรกรอชั่ง สองรายการหลังชั่งแล้ว
 */
const SEED_WEIGHING: WeighingDoc[] = [
  {
    id: "wg-1",
    code: "PO260115/01",
    createdAt: "1/16/2026 | 10:42:52",
    productName: "21-0-0",
    productSub: "ฟูเจียนผง",
    category: "วัตถุดิบปุ๋ยกระสอบ",
    packing: "Bulk",
    supplier: "เอชซี อินเตอร์เนชั่นแนล เทรดดิ้ง จำกัด",
    arriveDate: "18/06/2026",
    truck: "กข - 1234, กข - 5678",
    orderTon: 800,
    status: "pending",
  },
  {
    id: "wg-2",
    code: "PO260115/02",
    createdAt: "1/16/2026 | 11:15:07",
    productName: "46-0-0",
    productSub: "ยูเรีย เม็ด",
    category: "วัตถุดิบปุ๋ยกระสอบ",
    packing: "Bulk",
    supplier: "ไทยเคมิคอล อะกริ จำกัด",
    arriveDate: "19/06/2026",
    truck: "กง - 1234",
    orderTon: 640,
    status: "pending",
  },
  {
    id: "wg-3",
    code: "PO260116/03",
    createdAt: "1/16/2026 | 13:02:44",
    productName: "16-20-0",
    productSub: "เม็ดปั้น",
    category: "วัตถุดิบปุ๋ยกระสอบ",
    packing: "50 Kg",
    supplier: "ยูนิเวอร์แซล เคมิคอล กรุ๊ป",
    arriveDate: "19/06/2026",
    truck: "70 - 8891",
    orderTon: 500,
    status: "pending",
  },
  {
    id: "wg-4",
    code: "PO260113/07",
    createdAt: "1/13/2026 | 09:20:31",
    productName: "10-0-4+OM 50%",
    productSub: "ฟูเจียนผง",
    category: "วัตถุดิบปุ๋ยกระสอบ",
    packing: "40 Kg",
    supplier: "ไทยแอกโกร อินดัสทรี",
    arriveDate: "14/06/2026",
    truck: "82 - 4417",
    orderTon: 350,
    status: "weighed",
  },
  {
    id: "wg-5",
    code: "PO260112/02",
    createdAt: "1/12/2026 | 14:47:52",
    productName: "แม่ปุ๋ยโพแทส",
    productSub: "เกล็ดแดง",
    category: "วัตถุดิบปุ๋ยเกล็ด",
    packing: "25 Kg",
    supplier: "สยามเฟอร์ทิไลเซอร์ จำกัด",
    arriveDate: "13/06/2026",
    truck: "71 - 2043",
    orderTon: 220,
    status: "weighed",
  },
];

/** ยี่สิบรายการต่อท้าย — วนสถานะทุกห้าแถวเป็นรอชั่งสองแถว ชั่งแล้วสามแถว
 *  รวมกับห้ารายการเขียนมือด้านบน ได้รอชั่ง 11 ใบ ชั่งแล้ว 14 ใบพอดี */
function moreWeighing(count = 20): WeighingDoc[] {
  return Array.from({ length: count }, (_, i) => {
    const rnd = seeded(800 + i);
    const item = ITEM_POOL[i % ITEM_POOL.length];
    const orderTon = Math.round((150 + rnd() * 700) / 10) * 10;
    const day = 18 - (i % 14);
    const plateCount = rnd() < 0.3 ? 2 : 1;
    const truck = Array.from(
      { length: plateCount },
      () => `${pad(10 + Math.floor(rnd() * 89))} - ${1000 + Math.floor(rnd() * 8999)}`
    ).join(", ");

    return {
      id: `wg-g${i + 1}`,
      code: `PO2601${pad(day)}/${pad((i % 9) + 1)}`,
      createdAt: docStamp(i, rnd),
      productName: item.name,
      productSub: item.sub,
      category: item.category,
      packing: item.packing,
      supplier: pick(SUPPLIER_POOL, rnd),
      arriveDate: `${pad(day + 2)}/01/2026`,
      truck,
      orderTon,
      status: i % 5 < 2 ? "pending" : "weighed",
    } satisfies WeighingDoc;
  });
}

export const WEIGHING_DOCS: WeighingDoc[] = [...SEED_WEIGHING, ...moreWeighing()];

// ---------------------------------------------------------------
// ชั้นที่ 2 — ใบชั่งน้ำหนักของ PO เดียว รวมทุกรอบที่รถเข้ามาชั่ง
// ---------------------------------------------------------------

export type WeighingRoundStatus = "waitingTruck" | "draft" | "weighed";

export const WEIGHING_ROUND_STATUS_LABEL: Record<WeighingRoundStatus, string> = {
  waitingTruck: "รอรถขนส่ง",
  draft: "บันทึกร่าง",
  weighed: "ชั่งน้ำหนักแล้ว",
};

/** หนึ่งแถวในตาราง "รอบการชั่งน้ำหนัก" — บางช่องยังไม่มีค่าตามสถานะ */
export type WeighingRound = {
  id: string;
  receiptCode: string;
  batchId: string;
  plate: string;
  arriveDate: string;
  /** ชั่งเข้ารถพร้อมสินค้า (ตัน) */
  grossTon?: number;
  grossAt?: string;
  /** ชั่งออกรถเปล่า (ตัน) */
  tareTon?: number;
  tareAt?: string;
  /** น้ำหนักสินค้าตามใบชั่งของผู้ขาย (ตัน) */
  supplierTon?: number;
  status: WeighingRoundStatus;
};

/** น้ำหนักสินค้าจริงของรอบนี้ — null ถ้ายังชั่งไม่ครบสองรอบ (เข้า/ออก) */
export function netTon(r: WeighingRound): number | null {
  if (r.grossTon == null || r.tareTon == null) return null;
  return Math.round((r.grossTon - r.tareTon) * 100) / 100;
}

/** ส่วนต่างของรอบนี้ = ของเรา − ของผู้ขาย */
export function roundDiffTon(r: WeighingRound): number | null {
  const n = netTon(r);
  if (n === null || r.supplierTon == null) return null;
  return Math.round((n - r.supplierTon) * 100) / 100;
}

export type DiffKind = "bonus" | "loss" | "even";

export function diffKind(diff: number | null): DiffKind | null {
  if (diff === null) return null;
  if (diff > 0) return "bonus";
  if (diff < 0) return "loss";
  return "even";
}

export const DIFF_LABEL: Record<DiffKind, string> = {
  bonus: "ของแถม",
  loss: "สูญหาย",
  even: "ตรงพอดี",
};

/** tone ของ Badge ตามชนิดส่วนต่าง */
export const DIFF_TONE: Record<DiffKind, "success" | "danger" | "neutral"> = {
  bonus: "success",
  loss: "danger",
  even: "neutral",
};

export type WeighingReceiptMeta = {
  prCode: string;
  prqId: string;
  prMaker: string;
  prEditor?: string;
  poMaker: string;
  poEditor?: string;
  reason: string;
  deliveryFrom: string;
  /** หมายเหตุที่ผู้สั่งซื้อฝากไว้ตอนทำใบสั่งซื้อ — ไม่ใช่ทุกใบจะมี */
  buyerNote?: string;
};

export type WeighingReceipt = {
  doc: WeighingDoc;
  meta: WeighingReceiptMeta;
  rounds: WeighingRound[];
};

export type WeighingTotals = {
  netTon: number;
  supplierTon: number;
  diffTon: number;
  diffPercent: number;
  /** รอบที่ชั่งครบและมีเลขจากใบชั่งผู้ขายแล้ว = เอามาเทียบกันได้ */
  comparableRounds: number;
  totalRounds: number;
};

/**
 * ยอดรวมนับเฉพาะรอบที่ "เทียบกันได้" คือชั่งครบสองรอบและมีเลขของผู้ขาย
 * ถ้าเอารอบที่ยังชั่งไม่เสร็จมารวมด้วย ส่วนต่างจะดูเหมือนของหายมหาศาลทั้งที่แค่ยังไม่เสร็จ
 */
export function computeReceiptTotals(rounds: WeighingRound[]): WeighingTotals {
  let netSum = 0;
  let supplierSum = 0;
  let comparableRounds = 0;

  for (const r of rounds) {
    const n = netTon(r);
    if (n !== null && r.supplierTon != null) {
      netSum += n;
      supplierSum += r.supplierTon;
      comparableRounds += 1;
    }
  }

  const diffTon = Math.round((netSum - supplierSum) * 100) / 100;
  return {
    netTon: netSum,
    supplierTon: supplierSum,
    diffTon,
    diffPercent: supplierSum > 0 ? (diffTon / supplierSum) * 100 : 0,
    comparableRounds,
    totalRounds: rounds.length,
  };
}

const REASON_POOL = [
  "ผลิต",
  "สำรองคลัง",
  "เปลี่ยนทดแทนของชำรุด",
  "รองรับคำสั่งซื้อพิเศษ",
];

const BUYER_NOTE_POOL = [
  "ของจะเข้ามาช่วงบ่าย",
  "รถอาจเข้าล่าช้ากว่านัด แจ้งยามล่วงหน้าด้วย",
  "แยกลงหลายเที่ยว ให้เปิดรับได้ทุกรอบ",
  "ประสานคนขับก่อนเข้าคลัง เบอร์อยู่ในใบสั่งซื้อ",
];

function buildWeighingReceipt(doc: WeighingDoc): WeighingReceipt {
  const rnd = seeded(seedFromId(doc.id));

  const maker = pick(ACTOR_POOL, rnd);
  const poMaker = rnd() < 0.6 ? maker : pick(ACTOR_POOL, rnd);
  const meta: WeighingReceiptMeta = {
    prCode: doc.code.replace(/^PO/, "PR"),
    prqId: hex(rnd, 6),
    prMaker: maker,
    prEditor: rnd() < 0.3 ? pick(ACTOR_POOL, rnd) : undefined,
    poMaker,
    poEditor: rnd() < 0.3 ? pick(ACTOR_POOL, rnd) : undefined,
    reason: pick(REASON_POOL, rnd),
    deliveryFrom: doc.arriveDate,
    buyerNote: rnd() < 0.5 ? pick(BUYER_NOTE_POOL, rnd) : undefined,
  };

  const batchId = `IN-${hex(rnd, 4)}-${hex(rnd, 4)}`;
  const plates = doc.truck
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const plateAt = (i: number) => plates[i % Math.max(1, plates.length)] ?? doc.truck;

  // รอบแรกเสมอ — รอรถขนส่งเข้ามาก่อน ยังไม่มีตัวเลขให้กรอก
  const rounds: WeighingRound[] = [
    {
      id: `${doc.id}-r0`,
      receiptCode: doc.code,
      batchId,
      plate: plateAt(0),
      arriveDate: doc.arriveDate,
      status: "waitingTruck",
    },
  ];

  if (doc.status === "weighed") {
    const weighedCount = 1 + Math.floor(rnd() * 3); // 1-3 รอบที่ชั่งเสร็จแล้ว
    for (let i = 0; i < weighedCount; i++) {
      const gross =
        Math.round(((doc.orderTon / weighedCount) * (0.85 + rnd() * 0.3)) * 100) / 100;
      const tare = Math.round(gross * (0.15 + rnd() * 0.1) * 100) / 100;
      const net = Math.round((gross - tare) * 100) / 100;
      const supplier = Math.round(net * (0.95 + rnd() * 0.1) * 100) / 100;

      rounds.push({
        id: `${doc.id}-r${i + 1}`,
        receiptCode: doc.code,
        batchId,
        plate: plateAt(i + 1),
        arriveDate: doc.arriveDate,
        grossTon: gross,
        grossAt: timeAt(rnd),
        tareTon: tare,
        tareAt: timeAt(rnd),
        supplierTon: supplier,
        status: "weighed",
      });
    }

    // บางใบมีรอบที่บันทึกร่างค้างไว้ด้วย — ชั่งเข้าแล้วแต่ยังไม่ได้ชั่งรถเปล่า
    if (rnd() < 0.4) {
      const gross = Math.round(doc.orderTon * 0.1 * (0.8 + rnd() * 0.4) * 100) / 100;
      rounds.push({
        id: `${doc.id}-rdraft`,
        receiptCode: doc.code,
        batchId,
        plate: plateAt(weighedCount + 1),
        arriveDate: doc.arriveDate,
        grossTon: gross,
        grossAt: timeAt(rnd),
        status: "draft",
      });
    }
  }

  return { doc, meta, rounds };
}

export function getWeighingReceipt(id: string): WeighingReceipt | undefined {
  const doc = WEIGHING_DOCS.find((d) => d.id === id);
  if (!doc) return undefined;
  return buildWeighingReceipt(doc);
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
    ลำดับสินค้า (A, B, C, ...) แบบเดียวกับ lineItemCode ของ PO/ใบสั่งซื้ออื่นๆ */
export function parichSlipNo(round: MultiProductRound, index: number): string {
  return `${round.receiptCode}-${String.fromCharCode(65 + index)}`;
}

/** ต้นแบบสาธิต — รถคันเดียวขน 3 สินค้า ยังไม่ได้ชั่งจุดไหนเลย (ทดลองกรอกได้ตั้งแต่จุดแรก) */
export const MULTI_PRODUCT_DEMO: MultiProductRound = {
  id: "wg-multi-demo",
  receiptCode: "PO260130/09",
  batchId: "IN-7f3a-9c21",
  plate: "70 - 4471",
  arriveDate: "30/01/2026",
  products: [
    {
      id: "wg-multi-demo-p1",
      productName: "21-0-0",
      productSub: "ฟูเจียนผง",
      category: "วัตถุดิบปุ๋ยกระสอบ",
      packing: "Bulk",
    },
    {
      id: "wg-multi-demo-p2",
      productName: "46-0-0",
      productSub: "ยูเรีย เม็ด",
      category: "วัตถุดิบปุ๋ยกระสอบ",
      packing: "Bulk",
    },
    {
      id: "wg-multi-demo-p3",
      productName: "16-20-0",
      productSub: "เม็ดปั้น",
      category: "วัตถุดิบปุ๋ยกระสอบ",
      packing: "50 Kg",
    },
  ],
  checkpoints: [{ seq: 0 }, { seq: 1 }, { seq: 2 }, { seq: 3 }],
};
