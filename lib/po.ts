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
  PR_REASONS,
  PR_REQUESTERS,
  type PrCategoryId,
  type PrDoc,
  type PrReason,
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
  /** เลขที่ ID ล็อต — ยังไม่มีตอนเพิ่งเพิ่มรอบ (รอรถขนส่ง) เพราะเป็นเลขที่
   *  เมนู "ชั่งน้ำหนักและรับสินค้า" เป็นคนออกให้ตอนรถมาถึงจริง */
  batchId?: string;
  plate: string;
  containerNo?: string;
  arriveDate: string;
  receivedTon?: number;
  failedTon?: number;
  qcResult?: PoQcResult;
  stockedTon?: number;
  status: PoRoundStatus;
  note?: string;

  /* ---------- ข้อมูลชั่งน้ำหนัก — มีค่าตั้งแต่รถมาชั่งจริงแล้วเท่านั้น
     (สถานะ waitingQc ขึ้นไป) รอบที่ "รอรถขนส่ง" ยังไม่มีข้อมูลชุดนี้เลย ---------- */
  /** ผู้รับสินค้าหน้างาน / ผู้แก้ไขข้อมูลรับสินค้าล่าสุด (ถ้าเคยแก้) */
  receiver?: string;
  receiverEditedBy?: string;
  /** ผู้ชั่งสินค้า / ผู้แก้ไขข้อมูลชั่งล่าสุด (ถ้าเคยแก้) */
  weigher?: string;
  weigherEditedBy?: string;
  /** น้ำหนักตามใบชั่งของผู้ขาย (ตัน) — เทียบกับ receivedTon (น้ำหนักจริงที่ชั่งได้)
   *  เพื่อดูส่วนต่าง/% สูญหาย */
  sellerWeightTon?: number;
  /** ชั่งเข้ารถพร้อมสินค้า (กก. + เวลา) */
  grossKg?: number;
  grossAt?: string;
  /** ชั่งออกรถเปล่า (กก. + เวลา) */
  tareKg?: number;
  tareAt?: string;
  weighNote?: string;
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
  /** ค่าจัดการต่อหน่วย — บวกกับราคาสั่งต่อหน่วยแล้วได้ราคารวมต่อหน่วยที่แท้จริง */
  handlingPerUnit: number;
  neededDate: string;
  urgent?: boolean;
  /** เลขที่ใบขอซื้อ (PR) ต้นทางของรายการนี้ — หนึ่งใบสั่งซื้ออาจรวมมาจาก
      หลายใบขอซื้อคนละคนกัน จึงเก็บที่ระดับรายการ ไม่ใช่ระดับทั้งใบสั่งซื้อ */
  prCode: string;
  /** ผู้ขอซื้อของรายการนี้โดยเฉพาะ — อาจคนละคนกับ PoDoc.requester (คนที่กด
      สร้างใบสั่งซื้อ) เพราะรวมมาจากคำขอของหลายคนได้ */
  requester: string;
  /** มีค่าเฉพาะรายการที่เคยถูกแก้ไขคำขอซื้อหลังส่งคำขอ ไม่ใช่ทุกรายการจะมี */
  editedBy?: string;
  reason: PrReason;
  /** เหตุผลตอนแก้ไขข้อมูลสั่งซื้อภายหลัง — มีค่าเฉพาะรายการที่เคยถูกแก้ไข */
  changeReason?: string;
  rounds: PoRound[];

  /** น้ำหนักชั่งตรวจสอบ (กก.) เทียบกับน้ำหนักตามใบชั่งของผู้ขาย — มีค่าเฉพาะ
   *  รายการที่เริ่มรับเข้าไปแล้วอย่างน้อยหนึ่งรอบ (ดู lineItemStarted) ยังไม่
   *  เริ่มรับเข้าเลยแสดงเป็น "-" ทั้งคู่ */
  weighedKg?: number;
  sellerWeightKg?: number;
};

export type PoDoc = {
  id: string;
  code: string;
  createdAt: string;
  company: string;
  poType: "po" | "poi";
  status: PoStatus;
  cancelReason?: string;
  /** ผู้สั่งซื้อ — คนที่กดสร้างใบนี้ */
  requester: string;
  /** มีค่าเฉพาะใบที่เคยถูกแก้ไขหลังสร้าง ไม่ใช่ทุกใบจะมี */
  editedBy?: string;
  /** มีค่าเฉพาะใบที่ผ่านการอนุมัติแล้ว */
  approver?: string;
  note?: string;
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

/** เริ่มรับเข้ารายการนี้ไปแล้วอย่างน้อยหนึ่งรอบไหม (มีรอบไหนที่ไม่ใช่แค่
 *  "รอรถขนส่ง" บ้าง) — ใช้ตัดสินว่าคอลัมน์ตัวเลขการรับเข้า (รับเข้า/เข้าคลัง/
 *  น้ำหนักชั่ง/น้ำหนักตามผู้ขาย ฯลฯ) ควรโชว์ "-" หรือโชว์ค่าจริง ยังไม่เริ่มรับ
 *  เลยไม่ควรเห็น "0.00" ซึ่งอ่านเหมือนรับมาแล้วได้ศูนย์ */
export function lineItemStarted(item: PoLineItem): boolean {
  return item.rounds.some((r) => r.status !== "waitingTruck");
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

/** ราคารวมต่อหน่วย = ราคาสั่งต่อหน่วย + ค่าจัดการต่อหน่วย */
export function lineItemUnitPrice(item: PoLineItem): number {
  return item.pricePerUnit + item.handlingPerUnit;
}

export function lineItemTotalPrice(item: PoLineItem): number {
  return item.orderedQty * lineItemUnitPrice(item);
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

// ============================================================
// หน้า "อนุมัติ" — รีวิวใบสั่งซื้อก่อนอนุมัติ ใช้ข้อมูลชุดเดียวกับแท็บ "สั่งซื้อ"
// (PO_ORDER_DOCS) แค่มุมมอง/ชิปกรองต่างออกไปเป็นสามชิปแบบเดียวกับแท็บ "ขอซื้อ"
// (รอดำเนินการ/เร่งด่วน/ยกเลิก) แทนที่จะเป็นสถานะการรับเข้า
// ============================================================

export type ApproveChip = "all" | "urgent" | "cancelled";

export const APPROVE_CHIP_LABEL: Record<ApproveChip, string> = {
  all: "รอดำเนินการ",
  urgent: "เร่งด่วน",
  cancelled: "ยกเลิก",
};

/** เร่งด่วนระดับใบ = มีอย่างน้อยหนึ่งรายการสินค้าในใบที่ติดธงเร่งด่วนไว้ */
export function poHasUrgentItem(doc: PoDoc): boolean {
  return doc.lineItems.some((i) => i.urgent);
}

/** กติกาเดียวกับ matchesPoQueueChip — ใบที่ยกเลิกไปแล้วไม่โผล่ในชิป "รอดำเนินการ"
 *  หรือ "เร่งด่วน" อีกต่อไป ต้องเปิดชิป "ยกเลิก" เท่านั้นถึงจะเห็น */
export function matchesApproveChip(d: PoDoc, chip: ApproveChip): boolean {
  if (chip === "cancelled") return d.status === "cancelled";
  if (d.status === "cancelled") return false;
  if (chip === "urgent") return poHasUrgentItem(d);
  return true;
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

function timeAt(rnd: () => number) {
  return `${pad(7 + Math.floor(rnd() * 10))}:${pad(Math.floor(rnd() * 60))}`;
}

/** ไอดีของรอบ จาก "เลขที่รับสินค้า" (code) — code มี "/" ปนอยู่เสมอ (เช่น
 *  "PO260116/03/01-01") ใช้เป็น URL path segment ตรงๆ ไม่ได้ (บาง server/
 *  router ตีความ "/" แม้เข้ารหัสแล้วว่าเป็นตัวแบ่ง path เพิ่ม ทำให้ 404) จึง
 *  ต้องแทนที่ "/" ก่อนเสมอ — ใช้ฟังก์ชันเดียวกันทุกจุดที่สร้างไอดีรอบ (ทั้ง
 *  ข้อมูลตัวอย่างในไฟล์นี้ และตอนเพิ่มรอบใหม่จากฟอร์ม) กันไอดีไม่ตรงกัน */
export function roundIdFromCode(code: string): string {
  return `${code.replace(/\//g, "-")}-r`;
}

/** ข้อมูลชั่ง/ผู้รับ/ผู้ชั่ง — มีค่าตั้งแต่รถมาชั่งจริงแล้วเท่านั้น (waitingQc
 *  ขึ้นไป) แยกออกมาเป็นฟังก์ชันเดียวเพราะสามสถานะ (waitingQc/returned/stocked)
 *  ใช้ชุดข้อมูลเดียวกันเป๊ะ ต่างกันแค่ผลตรวจ QC ที่ต่อท้าย */
function buildWeighingMeta(receivedTon: number, rnd: () => number) {
  const tareKg = Math.round(8000 * (0.9 + rnd() * 0.2)); // น้ำหนักรถเปล่าโดยประมาณ
  const grossKg = tareKg + receivedTon * 1000;
  return {
    receiver: pick(PR_REQUESTERS, rnd),
    receiverEditedBy: rnd() < 0.3 ? pick(PR_REQUESTERS, rnd) : undefined,
    weigher: pick(PR_REQUESTERS, rnd),
    weigherEditedBy: rnd() < 0.3 ? pick(PR_REQUESTERS, rnd) : undefined,
    // น้ำหนักตามใบชั่งของผู้ขาย — ปกติใกล้เคียงน้ำหนักจริง คลาดเคลื่อนได้เล็กน้อย
    sellerWeightTon: Math.round(receivedTon * (0.98 + rnd() * 0.06)),
    grossKg,
    grossAt: timeAt(rnd),
    tareKg,
    tareAt: timeAt(rnd),
    weighNote: rnd() < 0.2 ? "รถมาถึงช้ากว่านัดหมายเดิมเล็กน้อย" : undefined,
  };
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
      // รอรถขนส่ง — ยังไม่มีตัวเลขให้กรอกเลย (ยังไม่มีข้อมูลชั่งด้วย รถยังไม่มาถึง)
      rounds.push({ id: roundIdFromCode(code), code, batchId, plate, containerNo, arriveDate, status: "waitingTruck" });
      continue;
    }

    const receivedTon = Math.round(perRound * (0.85 + rnd() * 0.3));
    const weighingMeta = buildWeighingMeta(receivedTon, rnd);

    if (roll < 0.3) {
      // รับเข้ามาแล้ว แต่ยังรอผลตรวจสอบ QC
      rounds.push({
        id: roundIdFromCode(code), code, batchId, plate, containerNo, arriveDate, receivedTon,
        status: "waitingQc", ...weighingMeta,
      });
      continue;
    }

    if (roll < 0.4) {
      // QC ไม่ผ่าน ส่งคืนทั้งหมด
      rounds.push({
        id: roundIdFromCode(code), code, batchId, plate, containerNo, arriveDate,
        receivedTon, failedTon: receivedTon, qcResult: "ส่งคืน", stockedTon: 0,
        status: "returned", ...weighingMeta,
      });
      continue;
    }

    // เข้าคลังแล้ว — ผลตรวจสอบสุ่มเป็นผ่าน/รับสภาพ/Repack
    const qcResult = pick<PoQcResult>(["ผ่าน", "รับสภาพ", "Repack"], rnd);
    rounds.push({
      id: roundIdFromCode(code), code, batchId, plate, containerNo, arriveDate,
      receivedTon, qcResult, stockedTon: receivedTon, status: "stocked", ...weighingMeta,
    });
  }

  return rounds;
}

function docStamp(seq: number, rnd: () => number) {
  const day = 18 - (seq % 14);
  return `1/${day}/2026 | ${pad(8 + (seq % 9))}:${pad(Math.floor(rnd() * 60))}:${pad(Math.floor(rnd() * 60))}`;
}

const CANCEL_REASON_POOL = ["เอกสารไม่ถูกต้อง", "ซัพพลายเออร์ยกเลิกออเดอร์", "เปลี่ยนแผนการสั่งซื้อ"];
const NOTE_POOL = ["โทรแจ้งซัพพลายเออร์ก่อนส่งของทุกครั้ง", "แยกส่งเป็นล็อตตามรอบผลิต"];
const CHANGE_REASON_POOL = ["ปรับจำนวนตามสต๊อกคงเหลือ", "ซัพพลายเออร์แจ้งราคาใหม่"];

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
    const editedBy = rnd() < 0.4 ? pick(PR_REQUESTERS, rnd) : undefined;
    const rounds = status === "cancelled" ? [] : buildRounds(lineCode, orderedQty, rnd);
    // เริ่มรับเข้าไปแล้วอย่างน้อยหนึ่งรอบไหม (มีรอบไหนที่ไม่ใช่แค่ "รอรถขนส่ง"
    // บ้าง) — ยังไม่เริ่มเลยไม่มีน้ำหนักชั่ง/น้ำหนักตามผู้ขายให้โชว์
    const started = rounds.some((r) => r.status !== "waitingTruck");
    const weighedKg = started ? Math.round((80 + rnd() * 60) * 100) / 100 : undefined;
    const sellerWeightKg =
      weighedKg != null ? Math.round(weighedKg * (0.96 + rnd() * 0.08) * 100) / 100 : undefined;
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
      handlingPerUnit: Math.round((30 + rnd() * 70) / 10) * 10,
      neededDate: `${pad(1 + Math.floor(rnd() * 28))}/${pad(1 + Math.floor(rnd() * 12))}/2026`,
      urgent: rnd() < 0.3,
      // เลขที่ใบขอซื้อ (PR) ต้นทาง — คนละเลขกับใบสั่งซื้อ (PO) ที่รวมมา
      prCode: `PR2601${pad(day)}/${pad(i + 1)}`,
      requester: pick(PR_REQUESTERS, rnd),
      editedBy,
      reason: pick<PrReason>(PR_REASONS, rnd),
      changeReason: editedBy ? pick(CHANGE_REASON_POOL, rnd) : undefined,
      rounds,
      weighedKg,
      sellerWeightKg,
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
    editedBy: rnd() < 0.6 ? pick(PR_REQUESTERS, rnd) : undefined,
    approver: status === "cancelled" ? undefined : rnd() < 0.8 ? pick(PR_REQUESTERS, rnd) : undefined,
    note: rnd() < 0.25 ? pick(NOTE_POOL, rnd) : undefined,
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

// ============================================================
// หน้า "อนุมัติ" แท็บ "ประวัติ" — ใบที่ผ่านการอนุมัติ/ไม่อนุมัติไปแล้ว คนละชุด
// ข้อมูลกับ PO_ORDER_DOCS (นั่นคือคิวที่ "รอ" อนุมัติ) เพราะผลอนุมัติเป็นคนละ
// มิติกับ PoStatus (pending/cancelled ที่ใช้ตัดสินความคืบหน้าการรับเข้าสินค้า)
// ============================================================

export type ApprovalOutcome = "approved" | "rejected";

export const APPROVAL_OUTCOME_LABEL: Record<ApprovalOutcome, string> = {
  approved: "อนุมัติ",
  rejected: "ไม่อนุมัติ",
};

export type PoApprovalHistoryDoc = PoDoc & {
  approvalStatus: ApprovalOutcome;
  /** มีค่าเฉพาะใบที่ไม่อนุมัติ — เหตุผลที่ผู้อนุมัติกรอกไว้ตอนกดไม่อนุมัติ */
  rejectReason?: string;
};

const REJECT_REASON_POOL = [
  "ราคาสูงเกินงบที่อนุมัติไว้",
  "ข้อมูลซัพพลายเออร์ไม่ครบ",
  "ขอให้เทียบราคาเพิ่มก่อนอนุมัติ",
];

/** สิบสี่ใบ สลับผลอนุมัติ/ไม่อนุมัติ — ใช้ seq ตั้งแต่ 100 ขึ้นไป กันชนกับ
 *  PO_ORDER_DOCS (seq 1-10) เพราะ buildPoDoc ใช้ seq คำนวณทั้งเลขที่ใบและ
 *  seed สุ่ม — สถานะรับเข้า (pending) ไม่มีผลต่อหน้านี้ ไม่ได้ใช้แสดงอะไรเลย */
export const PO_APPROVAL_HISTORY_DOCS: PoApprovalHistoryDoc[] = Array.from(
  { length: 14 },
  (_, i) => {
    const approvalStatus: ApprovalOutcome = i % 3 === 0 ? "rejected" : "approved";
    const rnd = seeded(700 + i);
    return {
      ...buildPoDoc(100 + i, "pending"),
      approvalStatus,
      rejectReason: approvalStatus === "rejected" ? pick(REJECT_REASON_POOL, rnd) : undefined,
    };
  }
);

/** ใบสั่งซื้อสำหรับหน้าอนุมัติ — หาทั้งในคิว "รออนุมัติ" (PO_ORDER_DOCS) และ
 *  "ประวัติ" (PO_APPROVAL_HISTORY_DOCS) เพราะหน้าใบอนุมัติ (/approve/[id]) เปิด
 *  ได้จากทั้งสองที่ ไอดีไม่ชนกันเพราะ seq คนละช่วง (1-10 vs 100+) */
export function getApprovalDoc(id: string): PoApprovalHistoryDoc | PoDoc | undefined {
  return PO_ORDER_DOCS.find((d) => d.id === id) ?? PO_APPROVAL_HISTORY_DOCS.find((d) => d.id === id);
}
