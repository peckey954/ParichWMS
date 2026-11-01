// ============================================================
// สต็อกสินค้า — แท็บรอรับเข้า (Figma Tab 2.1 ภายนอก / Tab 2.2 จากการผลิต)
//
// สองแหล่งของเข้า ใช้ Flow เดียวกัน: เปิดใบรับเข้า → เลือกโซนรับเข้า → บันทึก
//   ภายนอก   ใบสั่งซื้อ (PO) มากับรถ มีบริษัท ทะเบียนรถ เบอร์ตู้
//   ผลิต      ใบผลิต (PD) จากไลน์ผลิต มีไลน์ รอบ สั่งผลิต/ปริมาณผลิต
//
// แต่ละสลิงเป็น InboundPiece ชุดเดียวกับสต็อกทั่วไป หน้าเลือกโซนจึงใช้
// zone-assign ตัวเดิมได้ตรง ๆ
//
// เลือกโซนครบทุกสลิงแล้วบันทึก = รับเข้าเสร็จ ใบออกจากแท็บรอรับเข้า
// แล้วไปขึ้นในประวัติเป็น "รับเข้า" / "รับเข้า (ผลิต)"
//
// ข้อมูลจำลองล้วน ค่าอิง seeded() ไม่มี Math.random — hydration ไม่พัง
// ============================================================

import type { InboundPiece } from "@/lib/general-stock";
import { GOODS_HISTORY, type GoodsHistoryRow } from "@/lib/goods-stock";

export type GoodsInboundSource = "production" | "external";

export type GoodsInboundDoc = {
  id: string;
  /** PO… ภายนอก / PD… ผลิต */
  code: string;
  createdAt: string;
  source: GoodsInboundSource;
  productName: string;
  productType: string;
  group: string;
  packing: string;
  /** ปริมาณรอรับเข้า */
  qty: number;
  unit: string;
  // ---------- ภายนอก ----------
  supplier?: string;
  truck?: string;
  arriveDate?: string;
  // ---------- ผลิต ----------
  line?: string;
  round?: "ปกติ" | "แทรก";
  orderQty?: number;
  producedQty?: number;
};

export const GOODS_INBOUND_SOURCE_LABEL: Record<GoodsInboundSource, string> = {
  production: "รอรับเข้าจากการผลิต",
  external: "รอรับเข้าภายนอก",
};

const pad = (n: number) => String(n).padStart(2, "0");

function seeded(n: number) {
  let s = n * 9301 + 49297;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

const AT = "1/16/2026 | 10:42:52";
const SUPPLIER = "เอชซี อินเตอร์เนชั่นแนล เทรดดิ้ง จำกัด";
const ACTOR = "อลิสา พรสุขสิริ";
const FORMULA = "20-8-20 + 1Mg No Filler (No coat)";

/** ตามตารางใน Figma — ผลิตหกใบ ภายนอกหกใบ */
const SEED: GoodsInboundDoc[] = [
  { id: "gr-1", code: "PD260115/01", createdAt: AT, source: "production", productName: "8-24-24+0.5Mg+0.38 No filler", productType: "สินค้าผลิต", group: "Bulk", packing: "50 กก.", qty: 800, unit: "ตัน", line: "ไลน์ 1", round: "ปกติ", orderQty: 800, producedQty: 800 },
  { id: "gr-2", code: "PD260115/02", createdAt: AT, source: "production", productName: FORMULA, productType: "สินค้าผลิต", group: "Bulk", packing: "50 กก.", qty: 800, unit: "ตัน", line: "ไลน์กลาง", round: "แทรก", orderQty: 800, producedQty: 800 },
  { id: "gr-3", code: "PD260115/03", createdAt: AT, source: "production", productName: FORMULA, productType: "สินค้าผลิต", group: "Bulk", packing: "50 กก.", qty: 600, unit: "ตัน", line: "ไลน์ 1", round: "ปกติ", orderQty: 800, producedQty: 600 },
  { id: "gr-4", code: "PD260116/01", createdAt: "1/16/2026 | 15:10:08", source: "production", productName: "16-20-0 เม็ดปั้น", productType: "สินค้าผลิต", group: "Bulk", packing: "50 กก.", qty: 400, unit: "ตัน", line: "ไลน์ 2", round: "ปกติ", orderQty: 400, producedQty: 400 },
  { id: "gr-5", code: "PD260116/02", createdAt: "1/16/2026 | 18:32:44", source: "production", productName: "15-15-15 สูตรเสมอ", productType: "สินค้าผลิต", group: "Bulk", packing: "25 กก.", qty: 250, unit: "ตัน", line: "ไลน์กลาง", round: "แทรก", orderQty: 300, producedQty: 250 },
  { id: "gr-6", code: "PD260117/01", createdAt: "1/17/2026 | 08:05:19", source: "production", productName: "46-0-0 ยูเรีย เม็ด", productType: "สินค้าผลิต", group: "Bulk", packing: "50 กก.", qty: 500, unit: "ตัน", line: "ไลน์ 1", round: "ปกติ", orderQty: 500, producedQty: 500 },

  { id: "gr-7", code: "PO260115/01A", createdAt: AT, source: "external", productName: "10-0-4+OM 50%", productType: "ปุ๋ยกระสอบ", group: "Bulk", packing: "50 กก.", qty: 200, unit: "ตัน", supplier: SUPPLIER, truck: "กข - 1234", arriveDate: "18/06/2026" },
  { id: "gr-8", code: "POI260115/01A", createdAt: AT, source: "external", productName: "10-0-4+OM 50%", productType: "สินค้า OEM", group: "Compound", packing: "50 กก.", qty: 200, unit: "ตัน", supplier: SUPPLIER, truck: "กข - 1234", arriveDate: "18/06/2026" },
  { id: "gr-9", code: "POI260115/01B", createdAt: AT, source: "external", productName: "10-0-4+OM 50%", productType: "ปุ๋ยกระสอบ", group: "Bulk", packing: "50 กก.", qty: 200, unit: "ตัน", supplier: SUPPLIER, truck: "กข - 1234", arriveDate: "18/06/2026" },
  { id: "gr-10", code: "PO260115/01B", createdAt: AT, source: "external", productName: "10-0-4+OM 50%", productType: "สินค้า OEM", group: "Compound", packing: "12 ขวด", qty: 1000, unit: "ขวด", supplier: SUPPLIER, truck: "กข - 1234", arriveDate: "18/06/2026" },
  { id: "gr-11", code: "PO260116/02A", createdAt: "1/16/2026 | 13:21:37", source: "external", productName: "21-0-0 ปุ๋ยแอมโมเนียมซัลเฟต", productType: "ปุ๋ยกระสอบ", group: "Bulk", packing: "50 กก.", qty: 150, unit: "ตัน", supplier: "สยามเคมีเกษตร จำกัด", truck: "70 - 4521", arriveDate: "19/06/2026" },
  { id: "gr-12", code: "PO260117/01A", createdAt: "1/17/2026 | 09:44:02", source: "external", productName: "0-0-60 โพแทสเซียมคลอไรด์", productType: "ปุ๋ยกระสอบ", group: "Compound", packing: "50 กก.", qty: 120, unit: "ตัน", supplier: "ไทยเซ็นทรัลเคมี จำกัด", truck: "83 - 1177", arriveDate: "20/06/2026" },
];

export const GOODS_INBOUND_DOCS = SEED;

export const isCountUnit = (unit: string) => unit === "ชิ้น" || unit === "ขวด";

export const formatInboundQty = (v: number, unit: string) =>
  isCountUnit(unit)
    ? v.toLocaleString("en-US")
    : v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function matchesGoodsInbound(d: GoodsInboundDoc, q: string): boolean {
  const s = q.trim().toLowerCase();
  if (!s) return true;
  return [d.code, d.productName, d.productType, d.supplier ?? "", d.truck ?? "", d.line ?? ""].some((v) =>
    v.toLowerCase().includes(s)
  );
}

// ---------------------------------------------------------------
// ใบรับเข้า — สลิงที่รับมาแล้ว รอเลือกโซน
// ---------------------------------------------------------------

/** สลิงหนึ่งใบ — InboundPiece ของสต็อกทั่วไป + จำนวนชิ้นต่อสลิง */
export type GoodsSlip = InboundPiece & { count: number };

export type GoodsInboundMeta = {
  // ภายนอก
  prCode: string;
  prqId: string;
  prMaker: string;
  prEditor?: string;
  poMaker: string;
  poEditor?: string;
  reason: string;
  deliveryFrom: string;
  buyerNote?: string;
  // ผลิต
  orderer: string;
  ordererEditor?: string;
  producer: string;
  producerEditor?: string;
};

export type GoodsInboundReceipt = {
  doc: GoodsInboundDoc;
  meta: GoodsInboundMeta;
  slips: GoodsSlip[];
};

/** น้ำหนักต่อชิ้น (กก.) จากบรรจุภัณฑ์ "50 กก." */
function kgOf(packing: string) {
  const n = Number(packing.match(/\d+/)?.[0]);
  return packing.includes("กก.") && n > 0 ? n : undefined;
}

function hex(rnd: () => number, len: number) {
  let s = "";
  for (let i = 0; i < len; i++) s += Math.floor(rnd() * 16).toString(16);
  return s;
}

/** โซนที่เลือกในเซสชันนี้ — หน้าใบรับเข้าอ่านกลับได้หลังกลับจากหน้าเลือกโซน */
const ZONE_PICKED = new Map<string, string>();

export function setSlipZones(ids: string[], zone: string) {
  for (const id of ids) ZONE_PICKED.set(id, zone);
}

function buildReceipt(doc: GoodsInboundDoc): GoodsInboundReceipt {
  const n = Number(doc.id.replace(/\D/g, ""));
  const rnd = seeded(n * 17 + 3);
  const meta: GoodsInboundMeta = {
    prCode: doc.code.replace(/^POI?/, "PR").replace(/[A-Z]$/, ""),
    prqId: hex(rnd, 6),
    prMaker: ACTOR,
    poMaker: ACTOR,
    reason: "ผลิต",
    deliveryFrom: "01/06/2026",
    orderer: ACTOR,
    producer: ACTOR,
  };

  // ใบผลิตห้าสลิง ใบภายนอกหกสลิง ตามแบบ — สลิงสุดท้ายรับเศษให้รวมได้ยอดใบพอดี
  const count = doc.source === "production" ? 5 : 6;
  const byCount = isCountUnit(doc.unit);
  const digits = byCount ? 0 : 2;
  const f = 10 ** digits;
  const per = Math.floor((doc.qty / count) * f) / f;
  const kg = kgOf(doc.packing);
  const container = doc.source === "external" ? `AB-${1000 + Math.floor(rnd() * 9000)}` : undefined;
  const slips: GoodsSlip[] = [];
  for (let i = 0; i < count; i++) {
    const qty = i === 0 ? Math.round((doc.qty - per * (count - 1)) * f) / f : per;
    slips.push({
      id: `${doc.id}-s${i}`,
      // เลขไล่จากมากไปน้อย สลิงล่าสุดอยู่บนสุดเหมือนตารางในแบบ
      receiptCode: doc.source === "production" ? `${doc.code}-${pad(count - i + 1)}` : `${doc.code}-06-${pad(count - i)}`,
      createdAt: doc.createdAt,
      containerNo: i === 0 ? undefined : container,
      packing: doc.packing,
      qty,
      count: byCount ? qty : kg ? Math.round((qty * 1000) / kg) : qty,
      correct: true,
      cancelled: false,
      zone: ZONE_PICKED.get(`${doc.id}-s${i}`),
    });
  }
  // สองสลิงที่ยกเลิก (คีย์ซ้ำ) ให้ชิปยกเลิกมีของให้ดู
  for (let i = 0; i < 2; i++) {
    slips.push({
      id: `${doc.id}-c${i}`,
      receiptCode: doc.source === "production" ? `${doc.code}-${pad(count + i + 2)}` : `${doc.code}-06-${pad(count + i + 1)}`,
      createdAt: doc.createdAt,
      packing: doc.packing,
      qty: per,
      count: byCount ? per : kg ? Math.round((per * 1000) / kg) : per,
      correct: true,
      note: "คีย์ซ้ำ",
      cancelled: true,
    });
  }
  return { doc, meta, slips };
}

export function getGoodsInboundReceipt(id: string): GoodsInboundReceipt | undefined {
  const doc = GOODS_INBOUND_DOCS.find((d) => d.id === id);
  return doc ? buildReceipt(doc) : undefined;
}

export const liveSlips = (s: GoodsSlip[]) => s.filter((x) => !x.cancelled);
export const slipQty = (s: GoodsSlip[]) => liveSlips(s).reduce((t, x) => t + x.qty, 0);
export const slipCount = (s: GoodsSlip[]) => liveSlips(s).reduce((t, x) => t + x.count, 0);
export const waitingSlips = (s: GoodsSlip[]) => liveSlips(s).filter((x) => !x.zone).length;

// ---------------------------------------------------------------
// ปิดใบ — ออกจากแท็บรอรับเข้า แล้วไปเป็นแถวแรกของประวัติ
// ---------------------------------------------------------------

const CLOSED = new Set<string>();
export const isGoodsInboundOpen = (d: GoodsInboundDoc) => !CLOSED.has(d.id);

export function closeGoodsInbound(r: GoodsInboundReceipt) {
  const { doc } = r;
  if (CLOSED.has(doc.id)) return;
  CLOSED.add(doc.id);
  const live = liveSlips(r.slips);
  const row: GoodsHistoryRow = {
    id: `gh-in-${doc.id}`,
    code: doc.code,
    createdAt: doc.createdAt,
    productName: doc.productName,
    productType: doc.productType,
    group: doc.group,
    packing: doc.packing,
    askedCount: slipCount(r.slips),
    doneCount: slipCount(r.slips),
    doneQty: slipQty(r.slips),
    unit: doc.unit,
    zone: live[0]?.zone,
    requester: ACTOR,
    actor: ACTOR,
    status: "inbound",
    source: doc.source === "production" ? "production" : undefined,
  };
  GOODS_HISTORY.unshift(row);
}

/** บันทึกแล้วกลับมาที่แท็บรอรับเข้า (ใช้ครั้งเดียว) */
let INBOUND_TAB_REQUEST = false;
export function requestGoodsInboundTab() {
  INBOUND_TAB_REQUEST = true;
}
export const goodsInboundTabRequested = () => INBOUND_TAB_REQUEST;
export function clearGoodsInboundTabRequest() {
  INBOUND_TAB_REQUEST = false;
}
