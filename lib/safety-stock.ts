// ============================================================
// Safety Stock — แบ่งเกรดสินค้าจากยอดคาดการณ์ แล้วคิดสต็อกสำรองเป็น %
//
//   ยอดคาดการณ์  →  เกรด A/B/C  (ตัดด้วยเลขจริง แยกเกณฑ์ตามประเภทสินค้า)
//                →  สต็อกสำรอง = ยอดคาดการณ์ × %ของเกรดนั้นในประเภทนั้น
//                →  คงเหลือ < สต็อกสำรอง  =  สต็อกต่ำ
//
// แบ่งตาม "ประเภทสินค้า" ไม่ใช่ตามหน่วยดิบ ๆ เพราะประเภทเดียวกันใช้หน่วยเดียว
// กันอยู่แล้ว และคนตั้งค่าคิดเป็นประเภท ("ปุ๋ยสำรองกี่ %") ไม่ได้คิดเป็นหน่วย
// ห้ากลุ่มนี้ครอบคลุมของทั้งคลัง แต่ละกลุ่มมีหน่วยของตัวเองกลุ่มละหน่วยเดียว
//
// ทั้งเส้นตัดเกรดและ % สำรองแยกอิสระต่อกลุ่ม — ปุ๋ยกับสติกเกอร์ไม่ได้ต้องการ
// ระดับการสำรองเท่ากัน ของที่สั่งของยาก/ขาดแล้วไลน์หยุด ควรสำรอง % สูงกว่า
// ============================================================

import type { CategoryId, Product } from "@/lib/general-stock";
import { productTotal } from "@/lib/general-stock";

export type SafetyRank = "A" | "B" | "C";

/** เรียงจากดีสุดไปแย่สุด — ใช้วนสร้างช่องตั้งค่า จะได้ไม่ต้องเขียน JSX ซ้ำ */
export const SAFETY_RANKS: SafetyRank[] = ["A", "B", "C"];

export const SAFETY_RANK_LABEL: Record<SafetyRank, string> = {
  A: "เกรด A",
  B: "เกรด B",
  C: "เกรด C",
};

export type SafetyGroupId =
  | "fertilizer"
  | "piece"
  | "powder"
  | "liquid"
  | "bottle";

/**
 * ห้ากลุ่มของทั้งคลัง — ประเภทสินค้าที่อยู่กลุ่มเดียวกันใช้หน่วยเดียวกัน
 * และใช้เกณฑ์/เปอร์เซ็นต์ชุดเดียวกัน
 */
export const SAFETY_GROUPS: {
  id: SafetyGroupId;
  label: string;
  unit: string;
  categories: CategoryId[];
}[] = [
  {
    id: "fertilizer",
    label: "ปุ๋ยและกระสอบ",
    unit: "ตัน",
    categories: ["jumboFert", "sackFert", "sack", "oem", "produced"],
  },
  {
    id: "piece",
    label: "ของชิ้น",
    unit: "ชิ้น",
    categories: ["sticker", "giveaway", "lineSupply"],
  },
  { id: "powder", label: "ผงโรย", unit: "กก.", categories: ["powder"] },
  { id: "liquid", label: "น้ำยา", unit: "ลิตร", categories: ["liquid"] },
  { id: "bottle", label: "ขวด", unit: "ลัง", categories: ["bottle"] },
];

/** ประเภทสินค้า → กลุ่ม สร้างครั้งเดียวจาก SAFETY_GROUPS จะได้ไม่มีสองแหล่ง
 *  ที่ต้องคอยแก้ให้ตรงกัน */
const GROUP_OF_CATEGORY = new Map<CategoryId, SafetyGroupId>(
  SAFETY_GROUPS.flatMap((g) => g.categories.map((c) => [c, g.id] as const))
);

export const groupOf = (category: CategoryId) => GROUP_OF_CATEGORY.get(category);

export const safetyGroup = (id: SafetyGroupId) =>
  SAFETY_GROUPS.find((g) => g.id === id)!;

/** เกณฑ์ของหนึ่งกลุ่ม — C ไม่มีเส้นของตัวเอง เพราะเป็น "ส่วนที่เหลือ" */
export type GroupPolicy = {
  aFrom: number;
  bFrom: number;
  percent: Record<SafetyRank, number>;
};

export type SafetyStockConfig = Record<SafetyGroupId, GroupPolicy>;

/**
 * ค่าเริ่มต้น — เส้นตัดตั้งจากปริมาณจริงที่หมุนอยู่ในคลังของกลุ่มนั้น
 * ส่วน % ตั้งต่างกันตามลักษณะของ: ของที่ขาดแล้วไลน์หยุดสำรองสูงกว่าของที่
 * หาซื้อได้ทั่วไป
 */
export const DEFAULT_SAFETY_CONFIG: SafetyStockConfig = {
  // ปุ๋ย/กระสอบ — ของหลักของคลัง มูลค่าสูง สำรองสูงสุด
  fertilizer: { aFrom: 900, bFrom: 600, percent: { A: 20, B: 15, C: 10 } },
  // ของชิ้น — สั่งง่าย หาไว สำรองน้อยกว่าได้
  piece: { aFrom: 6400, bFrom: 4800, percent: { A: 15, B: 12, C: 8 } },
  // ผงโรย — ขาดแล้วปุ๋ยจับตัวเป็นก้อน กระทบไลน์ทันที
  powder: { aFrom: 1450, bFrom: 1280, percent: { A: 25, B: 18, C: 12 } },
  // น้ำยา — ของเหลว เก็บนาน สั่งเป็นถัง
  liquid: { aFrom: 1540, bFrom: 1400, percent: { A: 20, B: 15, C: 10 } },
  // ขวด — นับเป็นลัง จำนวนน้อย สำรองไว้พอใช้
  bottle: { aFrom: 126, bFrom: 120, percent: { A: 18, B: 14, C: 10 } },
};

const round2 = (v: number) => Math.round(v * 100) / 100;

/** ฐานยอดใช้/ยอดขายต่อเดือนของแต่ละกลุ่ม ใช้สร้างยอดคาดการณ์ตัวอย่าง */
const FORECAST_BASE: Record<SafetyGroupId, number> = {
  fertilizer: 600,
  piece: 4000,
  powder: 800,
  liquid: 700,
  bottle: 60,
};

/**
 * ยอดคาดการณ์ต่อเดือนของสินค้าหนึ่งตัว — ไม่มีข้อมูลพยากรณ์จริงในระบบ จึงสร้าง
 * จากฐานของกลุ่มนั้น × ตัวคูณ 0.4–3.0 เท่า
 *
 * สำคัญ: ห้ามผูกยอดคาดการณ์กับยอดคงเหลือของตัวมันเอง (เคยทำแล้วพัง) — ถ้า
 * forecast = คงเหลือ × k แล้วสต็อกสำรอง = forecast × 10-20% ค่าสำรองจะน้อยกว่า
 * คงเหลือเสมอทุกตัว ไม่มีสินค้าไหนขึ้นสต็อกต่ำได้เลยแม้แต่ใบเดียว ซึ่งทำให้
 * ฟีเจอร์ทั้งอันไม่มีความหมาย ของจริงความต้องการไม่ได้ขึ้นกับว่าตอนนี้บังเอิญ
 * เหลือของเท่าไร สองอย่างนี้ต้องเป็นอิสระต่อกัน ของถึงจะขาดได้จริง
 *
 * ตัวคูณมาจาก id ของสินค้า ไม่ใช่ Math.random — ฝั่งเซิร์ฟเวอร์กับเบราว์เซอร์
 * ต้องได้ค่าเท่ากันเป๊ะ ไม่งั้น hydration พัง
 */
export function productForecast(p: Product): number {
  const g = groupOf(p.category);
  if (!g) return 0;
  let h = 0;
  for (let i = 0; i < p.id.length; i++) h = (h * 31 + p.id.charCodeAt(i)) | 0;
  const factor = 0.4 + (Math.abs(h) % 27) / 10; // 0.4 – 3.0
  return Math.round(FORECAST_BASE[g] * factor);
}

/** เกรดของยอดคาดการณ์ตามเกณฑ์ของกลุ่มนั้น */
export function rankOf(
  forecast: number,
  group: SafetyGroupId,
  cfg: SafetyStockConfig
): SafetyRank {
  const pol = cfg[group];
  if (forecast >= pol.aFrom) return "A";
  if (forecast >= pol.bFrom) return "B";
  return "C";
}

/** ปัดสองตำแหน่งตั้งแต่ตอนคำนวณ ไม่ใช่ตอนแสดงผล — ไม่ปัดก่อน หน้าจอจะพิมพ์
 *  เลขเท่ากันสองช่องแต่ยังขึ้นแดง เพราะเศษทศนิยมลอยที่ตามองไม่เห็น */
export function safetyStockOf(
  forecast: number,
  rank: SafetyRank,
  group: SafetyGroupId,
  cfg: SafetyStockConfig
): number {
  return round2((forecast * cfg[group].percent[rank]) / 100);
}

export type ProductSafety = {
  group: SafetyGroupId;
  unit: string;
  forecast: number;
  rank: SafetyRank;
  percent: number;
  /** เส้นสต็อกต่ำของสินค้าตัวนี้ ในหน่วยของกลุ่ม */
  safety: number;
  onHand: number;
  /** คงเหลือ − สต็อกสำรอง ติดลบคือขาดอยู่เท่าไร */
  gap: number;
  low: boolean;
};

/** สรุปเกรด + เส้นสต็อกต่ำของสินค้าหนึ่งตัว — null เมื่อประเภทนี้ไม่ได้อยู่กลุ่มไหนเลย */
export function productSafety(
  p: Product,
  cfg: SafetyStockConfig
): ProductSafety | null {
  const group = groupOf(p.category);
  if (!group) return null;
  const forecast = productForecast(p);
  const rank = rankOf(forecast, group, cfg);
  const safety = safetyStockOf(forecast, rank, group, cfg);
  const onHand = productTotal(p);
  return {
    group,
    unit: safetyGroup(group).unit,
    forecast,
    rank,
    percent: cfg[group].percent[rank],
    safety,
    onHand,
    gap: round2(onHand - safety),
    low: onHand < safety,
  };
}

/**
 * สินค้าตัวนี้สต็อกต่ำหรือยัง — คงเหลือน้อยกว่าสต็อกสำรองที่คำนวณจากเกณฑ์
 *
 * นี่คือที่มาเดียวของคำว่า "สต็อกต่ำ" ในหน้าสต็อกทั่วไป (ชิปแดง ตัวเลขแดง และ
 * ตัวกรอง "สต็อกต่ำ" ใช้ตัวนี้ทั้งหมด) ก่อนหน้านี้ใช้ Product.low ที่เป็น
 * boolean seed มาตายตัว ซึ่งไม่ได้อิงเกณฑ์อะไรเลย ถ้าปล่อยไว้คู่กันจะมีสอง
 * แหล่งที่ขัดกันเอง — สินค้าขึ้น "เกรด A" แต่ติดธงแดงที่ไม่เกี่ยวกับเส้นเกณฑ์
 * ที่เพิ่งตั้งไป คนอ่านจะไม่รู้ว่าอันไหนจริง
 */
export const isProductLow = (p: Product, cfg: SafetyStockConfig) =>
  productSafety(p, cfg)?.low ?? false;

/** เส้นตัด A ต้องไม่ต่ำกว่าเส้น B เสมอ ไม่งั้นช่วง B หายไปทั้งช่วงแบบเงียบ ๆ
 *  (ไม่พัง แต่ไม่มีสินค้าตัวไหนได้เกรด B เลย ซึ่งอ่านเหมือนบั๊กมากกว่าการตั้งค่า)
 *  ดันอีกฝั่งตามให้ แทนที่จะปฏิเสธค่าที่พิมพ์ คนกรอกจะได้ไม่งงว่าทำไมพิมพ์ไม่เข้า */
export function withCutoff(
  cfg: SafetyStockConfig,
  group: SafetyGroupId,
  key: "aFrom" | "bFrom",
  next: number
): SafetyStockConfig {
  const cur = cfg[group];
  const v = Math.max(0, next);
  const updated: GroupPolicy =
    key === "aFrom"
      ? { ...cur, aFrom: v, bFrom: Math.min(cur.bFrom, v) }
      : { ...cur, bFrom: v, aFrom: Math.max(cur.aFrom, v) };
  return { ...cfg, [group]: updated };
}

/** useNumberField กันค่าติดลบให้แล้ว แต่ยอมรับ 250 ในช่อง % — ต้อง clamp เอง */
export function withPercent(
  cfg: SafetyStockConfig,
  group: SafetyGroupId,
  rank: SafetyRank,
  next: number
): SafetyStockConfig {
  const v = Math.min(100, Math.max(0, next));
  const cur = cfg[group];
  return {
    ...cfg,
    [group]: { ...cur, percent: { ...cur.percent, [rank]: v } },
  };
}

/** ตั้งเกรดดีกว่าให้สำรอง % น้อยกว่าเกรดแย่กว่า = ผิดหลัก แต่ไม่ได้ห้าม
 *  แค่เตือน เพราะเป็นแนวปฏิบัติ ไม่ใช่กฎที่ระบบต้องบังคับ */
export const percentOutOfOrder = (pol: GroupPolicy) =>
  pol.percent.A < pol.percent.B || pol.percent.B < pol.percent.C;
