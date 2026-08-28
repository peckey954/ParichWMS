// ============================================================
// สั่งซื้อ PO — หน้ารวมงานจัดซื้อ สามช่วง (ขอซื้อ → สั่งซื้อ → ซื้อแล้ว)
//
// แท็บ "ขอซื้อ" ดึงมาจากใบขอซื้อ (lib/pr.ts) เฉพาะใบที่ยังไม่ถูกสั่งซื้อ
// (ส่งคำขอแล้ว) รวมกับใบที่หลุดไประหว่างทาง (ยกเลิก) — สองสถานะนี้เท่านั้น
// ที่ยังอยู่ในคิว "รอสร้างใบสั่งซื้อ" ส่วนใบที่สั่งซื้อไปแล้วขยับไปอยู่แท็บ
// "สั่งซื้อ" ต่อ ไม่ใช่ของหน้านี้อีกต่อไป
//
// แท็บ "สั่งซื้อ" — ใบสั่งซื้อจริง หนึ่งใบรวมได้จากหลายใบขอซื้อ (ต้องเป็น
// วัตถุดิบประเภทเดียวกัน บริษัทเดียวกัน) หนึ่งใบมีได้หลายรายการสินค้า
// แต่ละรายการรับเข้าเป็น "รอบ" ของตัวเอง แยกขาดจากรายการอื่นในใบเดียวกัน
// เพราะรถหนึ่งคันส่งได้หลายสินค้าพร้อมกัน แต่ยอดค้างรับต้องนับแยกตามสินค้า
// ไม่ใช่นับตามรถ — รถคันเดียวส่งสามสินค้าก็ต้องคีย์สามรอบเสมอ
//
// แท็บ "ซื้อแล้ว" ยังไม่เปิดใช้งาน — รอไฟล์ออกแบบ
// ============================================================

import {
  formatPrQty,
  PR_DOCS,
  PR_PRODUCTS,
  PR_REQUESTERS,
  type PrCategoryId,
  type PrDoc,
} from "./pr";

export type PoQueueDoc = PrDoc;

/** คิวรอสร้างใบสั่งซื้อ — เฉพาะใบที่ส่งคำขอแล้ว หรือหลุดไปเป็นยกเลิก */
export const PO_QUEUE_DOCS: PoQueueDoc[] = PR_DOCS.filter(
  (d) => d.status === "sent" || d.status === "cancelled"
);

export type PoQueueChip = "all" | "urgent" | "cancelled";

export const PO_QUEUE_CHIP_LABEL: Record<PoQueueChip, string> = {
  all: "ขอซื้อ PR",
  urgent: "เร่งด่วน",
  cancelled: "ยกเลิก",
};

/**
 * "ยกเลิก" แยกขาดจากอีกสองชิป — ใบที่ถูกยกเลิกไปแล้วไม่โผล่ใน "ขอซื้อ PR" หรือ
 * "เร่งด่วน" อีกต่อไป เพราะไม่มีอะไรให้ทำต่อกับเอกสารที่ยกเลิกแล้ว ต้องเปิดชิป
 * "ยกเลิก" เท่านั้นถึงจะเห็น
 */
export function matchesPoQueueChip(d: PoQueueDoc, chip: PoQueueChip): boolean {
  if (chip === "cancelled") return d.status === "cancelled";
  if (d.status === "cancelled") return false;
  if (chip === "urgent") return !!d.urgent;
  return true;
}

// ============================================================
// แท็บ "สั่งซื้อ" — ใบสั่งซื้อจริงที่รวมจากใบขอซื้อแล้ว
// ============================================================

export type PoStatus = "pending" | "cancelled";

export const PO_STATUS_LABEL: Record<PoStatus, string> = {
  pending: "รอดำเนินการ",
  cancelled: "ยกเลิก",
};

/**
 * สถานะของแต่ละ "รอบรับเข้า" — รถคันหนึ่งมาส่งสินค้าตัวหนึ่งครั้งหนึ่ง
 * รอรถ → มีแต่นัดหมาย ยังไม่มีตัวเลข → รอตรวจสอบ QC → เข้าคลังแล้ว/ส่งคืน
 */
export type PoRoundStatus = "waitingTruck" | "waitingQc" | "stocked" | "returned";

export const PO_ROUND_STATUS_LABEL: Record<PoRoundStatus, string> = {
  waitingTruck: "รอรถขนส่ง",
  waitingQc: "รอตรวจสอบ QC",
  stocked: "สินค้าเข้าคลังแล้ว",
  returned: "ส่งคืน",
};

export type PoQcResult = "รับสภาพ" | "Repack" | "ผ่าน" | "ส่งคืน";

/** หนึ่งแถวในตาราง "รอบการรับสินค้า" ของรายการสินค้าหนึ่งรายการ */
export type PoRound = {
  id: string;
  /** เลขที่รับสินค้า — รหัสใบสั่งซื้อ + เลขรายการ + ลำดับรอบของรายการนั้น */
  code: string;
  batchId: string;
  plate: string;
  containerNo?: string;
  arriveDate: string;
  receivedTon?: number;
  failedTon?: number;
  qcResult?: PoQcResult;
  stockedTon?: number;
  status: PoRoundStatus;
  note?: string;
};

/** หนึ่งรายการสินค้าในใบสั่งซื้อ — มีรอบรับเข้าของตัวเอง แยกจากรายการอื่น */
export type PoLineItem = {
  id: string;
  poId: string;
  categoryId: PrCategoryId;
  group: string;
  productName: string;
  productSub?: string;
  packing?: string;
  unit: string;
  orderedQty: number;
  pricePerUnit: number;
  neededDate: string;
  urgent?: boolean;
  rounds: PoRound[];
};

export type PoDoc = {
  id: string;
  code: string;
  createdAt: string;
  company: string;
  poType: "po" | "poi";
  status: PoStatus;
  cancelReason?: string;
  requester: string;
  /** ช่วงวันที่คาดว่าสินค้าจะเข้าครบ — คร่าวๆ ระดับทั้งใบ ไม่ใช่ต่อรายการ */
  expectedFrom: string;
  expectedTo: string;
  lineItems: PoLineItem[];
};

/** รับเข้าแล้วกี่หน่วย — รวมทุกรอบของรายการนี้ (นับ "รับเข้า" ไม่ใช่ "เข้าคลัง"
 *  เพราะของที่รับแล้วแต่ยังรอผล QC ก็ถือว่ารับเข้ามาแล้ว ไม่ใช่ยังไม่มา) */
export function lineItemReceivedQty(item: PoLineItem): number {
  return item.rounds.reduce((sum, r) => sum + (r.receivedTon ?? 0), 0);
}

export function lineItemStockedQty(item: PoLineItem): number {
  return item.rounds.reduce((sum, r) => sum + (r.stockedTon ?? 0), 0);
}

export function lineItemFailedQty(item: PoLineItem): number {
  return item.rounds.reduce((sum, r) => sum + (r.failedTon ?? 0), 0);
}

/** ค้างรับ = สั่งซื้อ − รับเข้าแล้ว ไม่ต่ำกว่า 0 (รับเกินไม่ให้ติดลบดูแปลกตา) */
export function lineItemPendingQty(item: PoLineItem): number {
  return Math.max(0, item.orderedQty - lineItemReceivedQty(item));
}

export function lineItemTotalPrice(item: PoLineItem): number {
  return item.orderedQty * item.pricePerUnit;
}

export function poOrderedTotal(doc: PoDoc): number {
  return doc.lineItems.reduce((sum, i) => sum + i.orderedQty, 0);
}

export function poReceivedTotal(doc: PoDoc): number {
  return doc.lineItems.reduce((sum, i) => sum + lineItemReceivedQty(i), 0);
}

/** ราคารวมทั้งใบ — รวมราคาต่อหน่วย x จำนวนสั่งซื้อของทุกรายการ */
export function poTotalPrice(doc: PoDoc): number {
  return doc.lineItems.reduce((sum, i) => sum + lineItemTotalPrice(i), 0);
}

/** ความคืบหน้าการรับเข้าระดับทั้งใบ — ใช้ตัดสินสีชิปสถานะทั้งในหน้ารายการ
 *  และหัวหน้ารายละเอียด ให้สองที่นี้ใช้ตรรกะเดียวกันเป๊ะ ไม่ต้องคำนวณซ้ำคนละที่ */
export type PoProgress = "notStarted" | "partial" | "complete";

export const PO_PROGRESS_LABEL: Record<PoProgress, string> = {
  notStarted: "รอรับสินค้า",
  partial: "ทยอยรับสินค้า",
  complete: "รับสินค้าครบแล้ว",
};

export function poProgress(doc: PoDoc): PoProgress {
  const received = poReceivedTotal(doc);
  const ordered = poOrderedTotal(doc);
  if (received <= 0) return "notStarted";
  if (received >= ordered) return "complete";
  return "partial";
}

export function matchesPoOrder(d: PoDoc, q: string): boolean {
  const s = q.trim().toLowerCase();
  if (!s) return true;
  return [
    d.code,
    d.company,
    ...d.lineItems.map((i) => i.productName),
    ...d.lineItems.map((i) => i.productSub ?? ""),
  ].some((v) => v.toLowerCase().includes(s));
}

export const formatPoQty = formatPrQty;

export const formatPoBaht = (v: number) =>
  v.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ---------------------------------------------------------------
// ข้อมูลตัวอย่าง — สุ่มแบบกำหนดเมล็ดไว้ ผลลัพธ์เหมือนเดิมทุกครั้ง
// (ห้ามใช้ Math.random เซิร์ฟเวอร์กับเบราว์เซอร์จะได้คนละค่า hydration พัง)
// ---------------------------------------------------------------

function seeded(n: number) {
  let s = n * 9301 + 49297;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

const pad = (n: number) => String(n).padStart(2, "0");
const pick = <T,>(pool: T[], rnd: () => number) => pool[Math.floor(rnd() * pool.length)];

function hex(rnd: () => number, len: number) {
  let s = "";
  for (let i = 0; i < len; i++) s += Math.floor(rnd() * 16).toString(16);
  return s;
}

export const COMPANY_POOL = [
  "เอซี อินเตอร์เนชั่นแนล เทรดดิ้ง จำกัด",
  "ไทยเคมิคอล อะกริ จำกัด",
  "ยูนิเวอร์แซล เคมิคอล กรุ๊ป",
  "ไทยแอกโกร อินดัสทรี",
  "สยามเฟอร์ทิไลเซอร์ จำกัด",
];

function randomPlate(rnd: () => number) {
  return `${pick(["กส", "กข", "กง", "70", "82", "71"], rnd)} - ${1000 + Math.floor(rnd() * 8999)}`;
}

function randomContainerNo(rnd: () => number) {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const a = letters[Math.floor(rnd() * letters.length)];
  const b = letters[Math.floor(rnd() * letters.length)];
  return `${a}${b}-${1000 + Math.floor(rnd() * 8999)}`;
}

/** สร้างรอบรับเข้าของรายการหนึ่ง — จำนวนรอบและความสมบูรณ์แต่ละรอบขึ้นกับ rnd */
function buildRounds(
  lineCode: string,
  orderedQty: number,
  rnd: () => number
): PoRound[] {
  const roundCount = Math.floor(rnd() * 4); // 0-3 รอบ
  if (roundCount === 0) return [];

  const rounds: PoRound[] = [];
  const perRound = Math.round((orderedQty / roundCount) * 0.9) || 1;

  for (let i = 0; i < roundCount; i++) {
    const seq = pad(i + 1);
    const code = `${lineCode}-${seq}`;
    const batchId = `IN-${hex(rnd, 4)}-${hex(rnd, 4)}`;
    const plate = randomPlate(rnd);
    const containerNo = randomContainerNo(rnd);
    const arriveDate = `${pad(14 + i)}/06/2026`;
    const roll = rnd();

    if (roll < 0.15) {
      // รอรถขนส่ง — ยังไม่มีตัวเลขให้กรอกเลย
      rounds.push({ id: `${code}-r`, code, batchId, plate, containerNo, arriveDate, status: "waitingTruck" });
      continue;
    }

    const receivedTon = Math.round(perRound * (0.85 + rnd() * 0.3));

    if (roll < 0.3) {
      // รับเข้ามาแล้ว แต่ยังรอผลตรวจสอบ QC
      rounds.push({
        id: `${code}-r`, code, batchId, plate, containerNo, arriveDate, receivedTon, status: "waitingQc",
      });
      continue;
    }

    if (roll < 0.4) {
      // QC ไม่ผ่าน ส่งคืนทั้งหมด
      rounds.push({
        id: `${code}-r`, code, batchId, plate, containerNo, arriveDate,
        receivedTon, failedTon: receivedTon, qcResult: "ส่งคืน", stockedTon: 0,
        status: "returned",
      });
      continue;
    }

    // เข้าคลังแล้ว — ผลตรวจสอบสุ่มเป็นผ่าน/รับสภาพ/Repack
    const qcResult = pick<PoQcResult>(["ผ่าน", "รับสภาพ", "Repack"], rnd);
    rounds.push({
      id: `${code}-r`, code, batchId, plate, containerNo, arriveDate,
      receivedTon, qcResult, stockedTon: receivedTon, status: "stocked",
    });
  }

  return rounds;
}

function docStamp(seq: number, rnd: () => number) {
  const day = 18 - (seq % 14);
  return `1/${day}/2026 | ${pad(8 + (seq % 9))}:${pad(Math.floor(rnd() * 60))}:${pad(Math.floor(rnd() * 60))}`;
}

const CANCEL_REASON_POOL = ["เอกสารไม่ถูกต้อง", "ซัพพลายเออร์ยกเลิกออเดอร์", "เปลี่ยนแผนการสั่งซื้อ"];

function buildPoDoc(seq: number, status: PoStatus): PoDoc {
  const rnd = seeded(500 + seq);
  const day = 18 - (seq % 14);
  const code = `PO2601${pad(day)}/${pad((seq % 9) + 1)}`;
  const id = `po-${seq}`;
  const company = pick(COMPANY_POOL, rnd);
  const lineCount = 1 + Math.floor(rnd() * 3); // 1-3 รายการต่อใบ

  const lineItems: PoLineItem[] = Array.from({ length: lineCount }, (_, i) => {
    const product = pick(PR_PRODUCTS, rnd);
    const orderedQty = Math.round((150 + rnd() * 700) / 10) * 10;
    const lineCode = `${code}/${pad(i + 1)}`;
    return {
      id: `${id}-li${i + 1}`,
      poId: id,
      categoryId: product.category,
      group: product.group,
      productName: product.name,
      productSub: product.sub,
      packing: pick(product.packingOptions, rnd),
      unit: product.unit,
      orderedQty,
      pricePerUnit: Math.round((1200 + rnd() * 1800) / 10) * 10,
      neededDate: `${pad(1 + Math.floor(rnd() * 28))}/${pad(1 + Math.floor(rnd() * 12))}/2026`,
      urgent: rnd() < 0.3,
      rounds: status === "cancelled" ? [] : buildRounds(lineCode, orderedQty, rnd),
    } satisfies PoLineItem;
  });

  const fromMonth = 1 + (seq % 12);
  const toMonth = 1 + ((seq + 1) % 12);

  return {
    id,
    code,
    createdAt: docStamp(seq, rnd),
    company,
    poType: rnd() < 0.85 ? "po" : "poi",
    status,
    cancelReason: status === "cancelled" ? pick(CANCEL_REASON_POOL, rnd) : undefined,
    requester: pick(PR_REQUESTERS, rnd),
    expectedFrom: `01/${pad(fromMonth)}/2026`,
    expectedTo: `01/${pad(toMonth)}/2026`,
    lineItems,
  } satisfies PoDoc;
}

/** แปดใบรอดำเนินการ สองใบยกเลิก — mock ให้พอมีให้เลื่อนดูหลายหน้า */
export const PO_ORDER_DOCS: PoDoc[] = [
  buildPoDoc(1, "pending"),
  buildPoDoc(2, "pending"),
  buildPoDoc(3, "pending"),
  buildPoDoc(4, "pending"),
  buildPoDoc(5, "cancelled"),
  buildPoDoc(6, "pending"),
  buildPoDoc(7, "pending"),
  buildPoDoc(8, "pending"),
  buildPoDoc(9, "pending"),
  buildPoDoc(10, "cancelled"),
];

export function getPoOrder(id: string): PoDoc | undefined {
  return PO_ORDER_DOCS.find((d) => d.id === id);
}

export function getPoLineItem(
  poId: string,
  lineItemId: string
): { po: PoDoc; item: PoLineItem } | undefined {
  const po = getPoOrder(poId);
  const item = po?.lineItems.find((i) => i.id === lineItemId);
  if (!po || !item) return undefined;
  return { po, item };
}
