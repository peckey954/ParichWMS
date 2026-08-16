// ============================================================
// หน้ารายการผลิตแบ่งบรรจุ — สามแท็บ
//
// รอผลิต    = ใบผลิตที่ยังไม่จบ ตั้งแต่รอเริ่มจนถึงรอ QC
// สต็อก CWIP = ของที่เบิกออกมาแล้วยังค้างอยู่ที่ไลน์ ยังไม่กลับคลัง
// ผลิตแล้ว   = ใบที่ปิดแล้ว เก็บไว้ดูย้อนหลัง
//
// ตัวเลขสร้างจาก seeded() ไม่มี Math.random / Date.now ตอนเรนเดอร์
// ไม่งั้นค่าฝั่งเซิร์ฟเวอร์กับเบราว์เซอร์ไม่ตรงกันแล้ว hydration พัง
// ============================================================

function seeded(n: number) {
  let s = n * 9301 + 49297;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

const pad = (n: number) => String(n).padStart(2, "0");
const pick = <T,>(pool: T[], r: () => number) => pool[Math.floor(r() * pool.length)];

// ---------------------------------------------------------------
// ใบผลิต
// ---------------------------------------------------------------

export type OrderStage = "waiting" | "running" | "qc" | "done";

export const STAGE_LABEL: Record<OrderStage, string> = {
  waiting: "รอผลิต",
  running: "กำลังผลิต",
  qc: "รอตรวจสอบ QC",
  done: "ผลิตเสร็จ",
};

export type PackingOrder = {
  id: string;
  code: string;
  createdAt: string;
  round: string;
  formula: string;
  kind: string;
  packing: string;
  orderedTon: number;
  /** ยังไม่เริ่มผลิต = undefined ไม่ใช่ 0 เพื่อให้แสดงขีดแทนเลขศูนย์ */
  producedTon?: number;
  failedTon?: number;
  storedTon?: number;
  stage: OrderStage;
};

const FORMULAS = [
  { name: "8-24-24+0.5Mg+0.38 No filler", kind: "Bulk" },
  { name: "15-15-15 + 1Mg No Filler", kind: "Bulk" },
  { name: "13-13-21 + 1Mg No Filler", kind: "Bulk" },
  { name: "21-0-0", kind: "แม่ปุ๋ย" },
  { name: "46-0-0 เม็ดโฟม", kind: "แม่ปุ๋ย" },
  { name: "20-8-8 + 1Mg No Filler", kind: "Bulk" },
  { name: "0-0-60 เม็ดแดง", kind: "แม่ปุ๋ย" },
];

const PACKINGS = ["50 Kg", "40 Kg", "25 Kg", "Bulk"];
const ROUNDS = ["ปกติ", "แทรก"];

function makeOrders(
  count: number,
  stages: OrderStage[],
  seed: number,
  prefix: string
): PackingOrder[] {
  return Array.from({ length: count }, (_, i) => {
    const r = seeded(seed + i);
    const f = pick(FORMULAS, r);
    const stage = stages[i % stages.length];
    const ordered = Math.round((100 + r() * 900) / 20) * 20;

    // ยังไม่เริ่ม = ยังไม่มียอดผลิต / เริ่มแล้วถึงจะมีตัวเลขให้ดู
    const started = stage !== "waiting";
    const produced = started ? Math.round(ordered * (0.1 + r() * 0.9)) : undefined;
    const failed =
      started && r() < 0.35 ? Math.round((produced ?? 0) * 0.05) : undefined;
    const stored =
      stage === "done" ? (produced ?? 0) - (failed ?? 0) : undefined;

    const day = 16 - (i % 12);
    return {
      id: `${prefix}-${i + 1}`,
      code: `PD2601${pad(day)}/${pad((i % 9) + 1)}`,
      createdAt: `1/${day}/2026 | ${pad(8 + (i % 9))}:${pad(Math.floor(r() * 60))}:${pad(Math.floor(r() * 60))}`,
      round: pick(ROUNDS, r),
      formula: f.name,
      kind: f.kind,
      packing: pick(PACKINGS, r),
      orderedTon: ordered,
      producedTon: produced,
      failedTon: failed,
      storedTon: stored,
      stage,
    } satisfies PackingOrder;
  });
}

export const WAITING_ORDERS = makeOrders(
  11,
  ["waiting", "running", "qc"],
  1700,
  "w"
);

export const DONE_ORDERS = makeOrders(46, ["done"], 3100, "d");

export function matchesOrder(o: PackingOrder, q: string) {
  const s = q.trim().toLowerCase();
  return (
    s === "" ||
    [o.code, o.formula, o.packing, o.round].some((v) =>
      v.toLowerCase().includes(s)
    )
  );
}

// ---------------------------------------------------------------
// สต็อก CWIP — ของที่ค้างอยู่ที่ไลน์ผลิต
// ---------------------------------------------------------------

export type CwipLot = {
  id: string;
  zone: string;
  code: string;
  receivedAt: string;
  ageDays: number;
  pieces: number;
  perPiece: string;
  qty: number;
};

export type CwipProduct = {
  id: string;
  name: string;
  kind: string;
  unit: string;
  low: boolean;
  /** ยอดที่กำลังจะเข้ามาเพิ่ม ยังไม่ถึงไลน์ */
  incoming?: number;
  lots: CwipLot[];
};

const CWIP_SEED: { name: string; kind: string; unit: string; low: boolean; incoming?: number }[] = [
  { name: "0-0-60 เม็ดแดง", kind: "Bulk", unit: "ตัน", low: true },
  { name: "21-0-0 ผง สีน้ำตาล", kind: "แม่ปุ๋ย", unit: "ชิ้น", low: true },
  { name: "46-0-0 เม็ดโฟม 50 kg.", kind: "แม่ปุ๋ย", unit: "ลิตร", low: false, incoming: 400 },
  { name: "8-24-24+0.5Mg No filler", kind: "Bulk", unit: "ตัน", low: false },
  { name: "15-15-15 + 1Mg No Filler", kind: "Bulk", unit: "ตัน", low: true },
  { name: "MOP เม็ดขาว", kind: "แม่ปุ๋ย", unit: "ตัน", low: false },
  { name: "กระสอบพิมพ์ 20-8-8", kind: "บรรจุภัณฑ์", unit: "ใบ", low: false, incoming: 12000 },
  { name: "13-13-21 + 1Mg No Filler", kind: "Bulk", unit: "ตัน", low: false },
];

const ZONES = ["A-9M", "A-4M", "A-2M", "B-1M", "C-3M", "F-1M"];

export const CWIP_PRODUCTS: CwipProduct[] = CWIP_SEED.map((p, i) => {
  const r = seeded(4200 + i);
  const lotCount = 1 + Math.floor(r() * 3);
  return {
    id: `cw-${i + 1}`,
    ...p,
    lots: Array.from({ length: lotCount }, (_, li) => {
      const day = 10 + Math.floor(r() * 18);
      const pieces = Math.round((50 + r() * 500) / 10) * 10;
      return {
        id: `cw-${i + 1}-l${li + 1}`,
        zone: pick(ZONES, r),
        code: `PO2605${pad(day)}/${pad(li + 1)}`,
        receivedAt: `5/${day}/2026`,
        ageDays: 20 + Math.floor(r() * 60),
        pieces,
        perPiece:
          p.unit === "ใบ" ? "-" : `${(0.05 + r() * 0.8).toFixed(2)} ${p.unit}/ชิ้น`,
        qty: Math.round((10 + r() * 180) * 10) / 10,
      } satisfies CwipLot;
    }),
  };
});

export const cwipTotal = (p: CwipProduct) =>
  p.lots.reduce((sum, l) => sum + l.qty, 0);

export const cwipZones = (p: CwipProduct) =>
  new Set(p.lots.map((l) => l.zone)).size;

export function matchesCwip(p: CwipProduct, q: string) {
  const s = q.trim().toLowerCase();
  if (s === "") return true;
  if (p.name.toLowerCase().includes(s)) return true;
  return p.lots.some(
    (l) => l.code.toLowerCase().includes(s) || l.zone.toLowerCase().includes(s)
  );
}

// ---------------------------------------------------------------
// วัตถุดิบที่แนะนำให้ใช้วันนี้
//
// ระบบคำนวณจากใบผลิตที่ค้างอยู่ แล้วบอกว่าควรเบิกอะไรออกมาเท่าไร
// ดูอย่างเดียว แก้ไม่ได้ — เป็นตัวช่วยตัดสินใจก่อนไปเบิกจริง
// ---------------------------------------------------------------

/** วันที่ของรายการแนะนำ ตรึงไว้ ไม่ใช้เวลาปัจจุบันตอนเรนเดอร์ */
export const SUGGEST_DATE = "5/14/2026";

export type SuggestedMaterial = {
  id: string;
  name: string;
  /** ยอดที่มีอยู่ในคลัง WIP */
  stock: number;
  /** ยอดที่ควรเบิกไปใช้วันนี้ */
  suggest: number;
  unit: string;
};

export const SUGGESTED_MATERIALS: SuggestedMaterial[] = [
  { id: "sg-1", name: "21-0-0 ฟูเจี้ยน ผง", stock: 200, suggest: 20, unit: "ตัน" },
  { id: "sg-2", name: "0-0-60 เม็ดแดง", stock: 200, suggest: 20, unit: "ตัน" },
  { id: "sg-3", name: "แมกนีเซียม", stock: 200, suggest: 20, unit: "ตัน" },
  { id: "sg-4", name: "DAP 18-46-0", stock: 148, suggest: 35, unit: "ตัน" },
  { id: "sg-5", name: "46-0-0 ยูเรีย เม็ดโฟม", stock: 92, suggest: 40, unit: "ตัน" },
  { id: "sg-6", name: "Ammonium Sulphate", stock: 310, suggest: 60, unit: "ตัน" },
  // ของไม่พอ ต้องเห็นตั้งแต่ในกล่องนี้ ไม่ใช่ไปรู้ตอนเบิกไม่ออก
  { id: "sg-7", name: "โบรอน", stock: 4, suggest: 12, unit: "ตัน" },
  { id: "sg-8", name: "MOP เม็ดขาว", stock: 175, suggest: 25, unit: "ตัน" },
  { id: "sg-9", name: "กระสอบพิมพ์ 15-15-15", stock: 8200, suggest: 1600, unit: "ใบ" },
  { id: "sg-10", name: "สติกเกอร์ QR", stock: 14, suggest: 6, unit: "ม้วน" },
];

/** เบิกไม่พอ — ยอดในคลังน้อยกว่ายอดที่แนะนำ */
export const isShort = (m: SuggestedMaterial) => m.stock < m.suggest;

// ---------------------------------------------------------------
// ตัวช่วยแสดงผล
// ---------------------------------------------------------------

export const formatTon = (n?: number) =>
  n === undefined ? "-" : n.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const formatQty = (n: number) =>
  n.toLocaleString("th-TH", { maximumFractionDigits: 2 });

// ---------------------------------------------------------------
// มุมมองอื่นของแท็บสต็อก CWIP
//
// สามชุดนี้เป็น "เอกสาร" ไม่ใช่ยอดคงเหลือ จึงเป็นตารางไม่ใช่การ์ดสินค้า
//   รอรับเข้า      = ใบขอเบิกจากคลังที่ยังไม่ได้รับของเข้าไลน์
//   รอคืนกลับคลัง  = ใบขอคืนที่ยังไม่ได้ส่งกลับ
//   ประวัติ        = ทุกการเคลื่อนไหวของ CWIP ที่จบไปแล้ว
// ---------------------------------------------------------------

const STAFF = ["อลิสา พรสุขสิริ", "ณัฐพงษ์ วิริยะกุล", "ชนิดา แก้วประเสริฐ"];
const GOODS_KINDS = ["กระสอบ", "ของใช้ในไลน์ผลิต", "คลังสินค้า", "วัตถุดิบปุ๋ย"];
const GOODS: { name: string; sub: string }[] = [
  { name: "21-0-0", sub: "ฟูเจียน ผง" },
  { name: "0-0-60", sub: "เม็ดแดง" },
  { name: "46-0-0", sub: "เม็ดโฟม" },
  { name: "8-24-24", sub: "+0.5Mg No filler" },
];

/** ใบขอเบิก / ใบขอคืน — โครงเดียวกัน ต่างกันแค่คำเรียกในหัวตาราง */
export type CwipRequest = {
  id: string;
  code: string;
  createdAt: string;
  /** ประเภทสินค้า */
  kind: string;
  name: string;
  sub: string;
  /** ตัน — undefined = ใบนี้ยังไม่ได้ระบุ แสดงเป็นขีด */
  ton?: number;
  /** ชิ้น — undefined = ยังไม่ได้ระบุ */
  qty?: number;
  staff: string;
  /** ชื่อคนแก้ไขล่าสุด ไม่มี = ยังไม่เคยถูกแก้ */
  editedBy?: string;
};

function makeRequests(prefix: string, seed: number, count: number): CwipRequest[] {
  const r = seeded(seed);
  return Array.from({ length: count }, (_, i) => {
    const g = pick(GOODS, r);
    // สองใบแรกเป็นใบที่เพิ่งเปิด ยังไม่ได้กรอกยอด — ของจริงมีแบบนี้เสมอ
    const blank = i < 2;
    return {
      id: `${prefix}-${i + 1}`,
      code: `${prefix}2601${pad(15 - (i % 5))}/0${(i % 4) + 1}`,
      createdAt: `1/${16 - (i % 6)}/2026 | 10:42:52`,
      kind: pick(GOODS_KINDS, r),
      name: g.name,
      sub: g.sub,
      ton: blank ? undefined : Math.round((40 + r() * 160) / 10) * 10,
      qty: blank ? undefined : Math.round(5 + r() * 20),
      staff: pick(STAFF, r),
      editedBy: r() > 0.6 ? pick(STAFF, r) : undefined,
    };
  });
}

export const CWIP_INBOUND: CwipRequest[] = makeRequests("REQ", 7100, 14);
export const CWIP_RETURNS: CwipRequest[] = makeRequests("REQ", 7200, 11);

export function matchesRequest(d: CwipRequest, q: string) {
  const s = q.trim().toLowerCase();
  return (
    s === "" ||
    [d.code, d.name, d.sub, d.kind, d.staff].some((v) =>
      v.toLowerCase().includes(s)
    )
  );
}

/** สถานะของรายการในประวัติ — คนละชุดกับสถานะใบผลิต */
export type CwipMoveKind =
  | "issue"
  | "return"
  | "adjust"
  | "receive"
  | "failed";

export const MOVE_LABEL: Record<CwipMoveKind, string> = {
  issue: "เบิกออก",
  return: "คืนกลับคลัง",
  adjust: "ปรับปรุง",
  receive: "รับเข้า",
  failed: "รับเข้าไม่สำเร็จ",
};

export type CwipMove = {
  id: string;
  code: string;
  createdAt: string;
  lot: string;
  name: string;
  sub: string;
  /** ติดลบ = ของออกจากไลน์ บวก = ของเข้า */
  delta?: number;
  ton?: number;
  note?: string;
  requestedBy?: string;
  staff: string;
  editedBy?: string;
  kind: CwipMoveKind;
};

const MOVE_NOTE: Partial<Record<CwipMoveKind, string>> = {
  return: "คืนสินค้า",
  adjust: "ของแตกเสียหายระหว่างจัดเก็บ",
  failed: "ไม่มีของ",
};

const MOVE_POOL: CwipMoveKind[] = [
  "issue",
  "return",
  "return",
  "issue",
  "adjust",
  "adjust",
  "issue",
  "receive",
  "failed",
];

export const CWIP_HISTORY: CwipMove[] = Array.from({ length: 42 }, (_, i) => {
  const r = seeded(7300 + i);
  const g = pick(GOODS, r);
  const kind = MOVE_POOL[i % MOVE_POOL.length];
  const size = Math.round(5 + r() * 60) * (kind === "adjust" ? 1 : 10);
  const failed = kind === "failed";
  return {
    id: `mv-${i + 1}`,
    code: `${kind === "issue" ? "PD" : "REQ"}2601${pad(15 - (i % 5))}/0${(i % 4) + 1}`,
    createdAt: `1/${16 - (i % 6)}/2026 | 10:42:52`,
    lot: failed ? "-" : `PO2601${pad(15 - (i % 5))}/01-04`,
    name: g.name,
    sub: g.sub,
    // ของเข้าเป็นบวก ของออกเป็นลบ ประวัติต้องอ่านทิศทางได้จากเครื่องหมาย
    delta: failed ? undefined : kind === "receive" || kind === "adjust" ? size : -size,
    ton: failed ? undefined : 10,
    note: MOVE_NOTE[kind],
    requestedBy: r() > 0.35 ? pick(STAFF, r) : undefined,
    staff: pick(STAFF, r),
    editedBy: r() > 0.7 ? pick(STAFF, r) : undefined,
    kind,
  };
});

export function matchesMove(m: CwipMove, q: string) {
  const s = q.trim().toLowerCase();
  return (
    s === "" ||
    [m.code, m.lot, m.name, m.sub, m.staff].some((v) =>
      v.toLowerCase().includes(s)
    )
  );
}

/** ยอดที่โชว์บนชิป — นับจากข้อมูลจริง ไม่ใช่เลขที่พิมพ์ไว้ตายตัว */
export const cwipLowCount = (products: CwipProduct[]) =>
  products.filter((p) => p.low).length;

// ---------------------------------------------------------------
// ตัวกรองของแท็บสต็อก CWIP
// ---------------------------------------------------------------

export type CwipSort = "product" | "zone" | "fifo";
export type SortDir = "asc" | "desc";

/** ประเภทกับโซนดึงจากข้อมูลจริง ไม่ใช่รายการที่พิมพ์ไว้ตายตัว
    เพิ่มสินค้าประเภทใหม่เมื่อไร ตัวเลือกในตัวกรองก็มีให้เองทันที */
export const CWIP_KINDS = [...new Set(CWIP_PRODUCTS.map((p) => p.kind))];

export const CWIP_ZONES = [
  ...new Set(CWIP_PRODUCTS.flatMap((p) => p.lots.map((l) => l.zone))),
].sort();

/**
 * กรองและเรียงสินค้า CWIP
 *
 * โซนกรองที่ระดับล็อต ไม่ใช่ระดับสินค้า — เลือกโซน A แล้วต้องเห็นเฉพาะ
 * ล็อตที่อยู่โซน A ของสินค้านั้น ไม่ใช่เห็นทุกล็อตเพราะบังเอิญมีล็อตหนึ่งอยู่ A
 * ไม่งั้นยอดรวมที่โชว์จะไม่ตรงกับสิ่งที่เห็นในรายการ
 */
export function filterCwip(
  products: CwipProduct[],
  opts: {
    query: string;
    lowOnly: boolean;
    kinds: string[];
    zones: string[];
    lots: string[];
    products: string[];
    sort: CwipSort;
    dir: SortDir;
  }
): CwipProduct[] {
  const rows = products
    .filter((p) => matchesCwip(p, opts.query))
    .filter((p) => !opts.lowOnly || p.low)
    .filter((p) => opts.kinds.length === 0 || opts.kinds.includes(p.kind))
    .filter(
      (p) => opts.products.length === 0 || opts.products.includes(p.name)
    )
    .map((p) => {
      // โซนกับเลขล็อตกรองที่ระดับล็อต ยอดรวมจะได้ตรงกับสิ่งที่เห็นในรายการ
      if (opts.zones.length === 0 && opts.lots.length === 0) return p;
      const lots = p.lots.filter(
        (l) =>
          (opts.zones.length === 0 || opts.zones.includes(l.zone)) &&
          (opts.lots.length === 0 || opts.lots.includes(l.code))
      );
      return { ...p, lots };
    })
    .filter((p) => p.lots.length > 0);

  // ทิศทางกลับด้านด้วยการคูณ -1 ที่ผลเปรียบเทียบ ไม่ต้องเขียนเงื่อนไขซ้ำสองชุด
  const sign = opts.dir === "asc" ? 1 : -1;
  const sorted = [...rows];
  if (opts.sort === "zone") {
    sorted.sort(
      (a, b) =>
        sign * (a.lots[0]?.zone ?? "").localeCompare(b.lots[0]?.zone ?? "")
    );
  } else if (opts.sort === "fifo") {
    // asc ของ FIFO คือเก่าสุดก่อน เพราะเป็นตัวที่ต้องรีบใช้
    const oldest = (p: CwipProduct) =>
      Math.max(...p.lots.map((l) => l.ageDays), 0);
    sorted.sort((a, b) => sign * (oldest(b) - oldest(a)));
  } else {
    sorted.sort((a, b) => sign * a.name.localeCompare(b.name, "th"));
  }
  return sorted;
}

/** เลขล็อตใน CWIP — ตัวเลือกจะโผล่เฉพาะตอนเรียงแบบ FIFO */
export const CWIP_LOT_CODES = [
  ...new Set(CWIP_PRODUCTS.flatMap((p) => p.lots.map((l) => l.code))),
].sort();

/** ชื่อสินค้าใน CWIP สำหรับตัวเลือกในตัวกรอง — ดึงจากข้อมูลจริง */
export const CWIP_PRODUCT_NAMES = CWIP_PRODUCTS.map((p) => p.name).sort((a, b) =>
  a.localeCompare(b, "th")
);
