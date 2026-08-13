// ============================================================
// ตั้งค่าต้นทุน — ต้นทุนต่อถุงและราคาขายจริงของแต่ละสูตร
//
// ไฟล์ Excel ต้นทางมี 25 คอลัมน์ แต่พอไล่ค่าจริงทั้ง 36 แถวแล้วพบว่า
// 12 จาก 15 คอลัมน์ที่กรอกได้ เป็นค่าเดียวกันทุกแถวทั้งตาราง
// (ค่าการจัดการ 1,000 · Production 20 · สูญเสีย 0.2% · ดอกเบี้ย 0.2%
//  และงบการตลาดอีก 8 ก้อน ก้อนละ 10)
//
// ของพวกนี้จึงไม่ควรเป็นช่องกรอกรายแถว ยกขึ้นมาเป็น "ค่าตั้งต้น" ชั้นเดียว
// แล้วให้ปรับทับเฉพาะสูตรที่ต่างจริง ๆ
// เหลือที่ต้องกรอกรายสูตรแค่ 3 ช่อง — Nitro, Penergetic, ค่าถุง
//
// สูตรคำนวณ
//   ต้นทุนการผลิต    = วัตถุดิบ + Nitro + Penergetic + ค่าถุง + ค่าการจัดการ + Production
//   ต้นทุนก่อน Rebate = ต้นทุนการผลิต × (1 + สูญเสีย% + ดอกเบี้ย%)
//   งบรวม            = ผลรวมงบการตลาดทั้ง 8 ก้อน
//   ต้นทุนรวม         = ต้นทุนก่อน Rebate + งบรวม
//   ราคาขายจริง       = ต้นทุนรวม + ส่วนบวกเพิ่ม
// ============================================================

import { RECIPES, type RecipeGroupId } from "./recipe";

/** ตัวเลขเก็บเป็น string เพื่อให้ลบจนว่างได้ระหว่างพิมพ์ */
export const toNumber = (v: string) => {
  const n = Number(String(v).replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
};

export const formatBaht = (n: number) =>
  Math.round(n).toLocaleString("th-TH");

// ---------------------------------------------------------------
// ค่าตั้งต้นของทั้งตาราง
// ---------------------------------------------------------------

export const BUDGET_FIELDS = [
  { key: "envelope", label: "งบซองแจกให้ร้าน" },
  { key: "event", label: "งบ event ให้ร้าน" },
  { key: "mkt", label: "งบ MKT" },
  { key: "rebate", label: "Rebate / Promotion" },
  { key: "special", label: "Special Promotion" },
  { key: "tour", label: "Tour" },
  { key: "com", label: "Com" },
  { key: "crm", label: "CRM" },
] as const;

export type BudgetKey = (typeof BUDGET_FIELDS)[number]["key"];

export type CostDefaults = {
  handling: string;
  production: string;
  lossPct: string;
  interestPct: string;
  margin: string;
  budgets: Record<BudgetKey, string>;
};

export const COST_DEFAULTS: CostDefaults = {
  handling: "1000",
  production: "20",
  lossPct: "0.2",
  interestPct: "0.2",
  margin: "10000",
  budgets: {
    envelope: "10",
    event: "10",
    mkt: "10",
    rebate: "10",
    special: "10",
    tour: "10",
    com: "10",
    crm: "10",
  },
};

/** ช่องค่าตั้งต้นที่ไม่ใช่งบการตลาด ใช้สร้างฟอร์มและป้ายกำกับให้ตรงกันเสมอ */
export const DEFAULT_FIELDS: {
  key: Exclude<keyof CostDefaults, "budgets">;
  label: string;
  suffix: string;
  note: string;
}[] = [
  { key: "handling", label: "ค่าการจัดการ", suffix: "บาท", note: "ต่อถุง" },
  { key: "production", label: "Production", suffix: "บาท", note: "ต่อถุง" },
  { key: "lossPct", label: "สูญเสียระหว่างการผลิต", suffix: "%", note: "คิดบนต้นทุนการผลิต" },
  { key: "interestPct", label: "ดอกเบี้ย", suffix: "%", note: "คิดบนต้นทุนการผลิต" },
  { key: "margin", label: "ส่วนบวกเพิ่มเป็นราคาขาย", suffix: "บาท", note: "บวกท้ายสุด" },
];

// ---------------------------------------------------------------
// ข้อมูลรายสูตร
// ---------------------------------------------------------------

/** ค่าที่ปรับทับค่าตั้งต้นเฉพาะสูตรนั้น ว่าง = ใช้ค่ากลาง */
export type CostOverride = Partial<Omit<CostDefaults, "budgets">>;

export type CostRow = {
  id: string;
  group: RecipeGroupId;
  sku: string;
  size: number;
  /** ดึงมาจากผลคำนวณในแท็บ Input แก้ที่นี่ไม่ได้ */
  rawMaterial: number;
  nitro: string;
  penergetic: string;
  bagCost: string;
  override: CostOverride;
};

/** ช่องที่กรอกรายสูตรจริง ๆ มีแค่สามช่องนี้ */
export const ROW_FIELDS = [
  { key: "nitro", label: "Nitro", hint: "ค่าเคลือบ Nitro ต่อถุง" },
  { key: "penergetic", label: "Penergetic", hint: "ค่าเคลือบ Penergetic ต่อถุง" },
  { key: "bagCost", label: "ค่าถุง", hint: "ค่ากระสอบต่อถุง" },
] as const;

export type RowFieldKey = (typeof ROW_FIELDS)[number]["key"];

/** ค่าเคลือบจากไฟล์ต้นทาง สูตรที่ไม่มีชื่ออยู่ในนี้คือยังไม่ได้ตั้งค่า */
const NITRO_COST: Record<string, number> = {
  "30-0-0 Nitro (Coat)": 38600,
  "40-0-0 ต้นไม้ 25 kg": 78000,
  "40-0-0 ต้นไม้ 40 kg": 77750,
  "13-13-21 + 1Mg No Filler": 36800,
  "15-7-18 + 1Mg": 26200,
  "15-15-15 + 1Mg No Filler (No coat)": 41400,
  "18-6-6 No Filler": 15400,
  "18-8-8 + 1Mg No Filler": 27000,
  "20-8-8 + 1Mg No Filler": 34800,
  "16-16-8 + 1Mg No Filler": 38400,
  "15-10-30 + 0.1Mg + 0.2S": 46200,
  "13-6-27 + 1Mg + 0.3B No Filler": 29600,
  "13-5-33 + 1Mg + 0.3B No Filler": 35400,
  "15-5-20 + 1Mg No Filler": 24000,
  "15-15-15 + 1Mg No Filler (Coat)": 41400,
};

const BAG_COST: Record<string, number> = {
  "16-12-8": 647,
};

/** สูตรกลุ่มกราเวียร์เคลือบ Penergetic จึงมีช่องนี้ให้กรอก ที่เหลือเว้นว่าง */
const HAS_PENERGETIC = new Set<RecipeGroupId>(["bulkGravure"]);

export const COST_ROWS: CostRow[] = RECIPES.map((r) => ({
  id: r.id,
  group: r.group,
  sku: r.sku,
  size: r.size,
  // ในไฟล์ต้นทางเป็น 100,000 ทุกสูตร เพราะต้นทุนวัตถุดิบในแท็บ Input
  // ยังตั้งเป็นค่าตั้งต้นเท่ากันหมด กด RUN ใหม่แล้วตัวเลขนี้จะแยกกันเอง
  rawMaterial: 100000,
  nitro: NITRO_COST[r.sku] ? String(NITRO_COST[r.sku]) : "",
  penergetic: HAS_PENERGETIC.has(r.group) ? "0" : "",
  bagCost: BAG_COST[r.sku] ? String(BAG_COST[r.sku]) : "0",
  override: {},
}));

// ---------------------------------------------------------------
// การคำนวณ
// ---------------------------------------------------------------

export type CostResult = {
  production: number;
  beforeRebate: number;
  budgetTotal: number;
  total: number;
  price: number;
};

/** ค่าที่สูตรนี้ใช้จริง = ค่าตั้งต้น ทับด้วยค่าเฉพาะแถวถ้ามี */
export const effective = (
  d: CostDefaults,
  o: CostOverride,
  key: Exclude<keyof CostDefaults, "budgets">
) => (o[key] !== undefined && o[key] !== "" ? o[key]! : d[key]);

export function computeCost(row: CostRow, d: CostDefaults): CostResult {
  const handling = toNumber(effective(d, row.override, "handling"));
  const production = toNumber(effective(d, row.override, "production"));
  const loss = toNumber(effective(d, row.override, "lossPct")) / 100;
  const interest = toNumber(effective(d, row.override, "interestPct")) / 100;
  const margin = toNumber(effective(d, row.override, "margin"));

  const prod =
    row.rawMaterial +
    toNumber(row.nitro) +
    toNumber(row.penergetic) +
    toNumber(row.bagCost) +
    handling +
    production;

  const beforeRebate = prod * (1 + loss + interest);
  const budgetTotal = BUDGET_FIELDS.reduce(
    (sum, b) => sum + toNumber(d.budgets[b.key]),
    0
  );
  const total = beforeRebate + budgetTotal;

  return {
    production: prod,
    beforeRebate,
    budgetTotal,
    total,
    price: total + margin,
  };
}

/** แถวนี้ปรับค่าตั้งต้นทับไว้กี่ช่อง ใช้ขึ้นจุดบอกในตาราง */
export const overrideCount = (o: CostOverride) =>
  Object.values(o).filter((v) => v !== undefined && v !== "").length;

export function matchesCost(r: CostRow, q: string) {
  const s = q.trim().toLowerCase();
  return s === "" || r.sku.toLowerCase().includes(s);
}
