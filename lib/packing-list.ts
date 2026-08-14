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
const ROUNDS = ["ปกติ", "เร่งด่วน", "กะดึก"];

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
// ตัวช่วยแสดงผล
// ---------------------------------------------------------------

export const formatTon = (n?: number) =>
  n === undefined ? "-" : n.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const formatQty = (n: number) =>
  n.toLocaleString("th-TH", { maximumFractionDigits: 2 });
