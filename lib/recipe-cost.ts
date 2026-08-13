// ============================================================
// ตั้งค่าต้นทุน — ต้นทุนต่อถุงและราคาขายจริงของแต่ละสูตร
//
// หัวคอลัมน์สีส้มในไฟล์ต้นทาง = ช่องที่ต้องกรอกเอง เป็นรายสูตรทุกช่อง
// รวม 17 ช่องต่อสูตร คูณจำนวนสูตรแล้วเป็นหลักห้าร้อยช่อง
// ตอนนี้ค่าหลายคอลัมน์บังเอิญเท่ากันทุกแถว แต่นั่นเป็นเพราะยังไม่ได้แยก
// ไม่ใช่เพราะมันเป็นค่ากลาง — จึงต้องคงเป็นช่องกรอกรายสูตรไว้
//
// สี่คอลัมน์ที่เหลือคำนวณให้ ไม่ต้องกรอก
//   ต้นทุนการผลิต    = วัตถุดิบ + Nitro + Penergetic + ค่าถุง + ค่าการจัดการ + Production
//   ต้นทุนก่อน Rebate = ต้นทุนการผลิต × (1 + สูญเสีย% + ดอกเบี้ย%)
//   ต้นทุนรวม         = ต้นทุนก่อน Rebate + งบการตลาดทั้ง 8 ก้อน
//   ราคาขายจริง       = ต้นทุนรวม + ส่วนบวกเพิ่ม
// ============================================================

import { RECIPES, type RecipeGroupId } from "./recipe";

export const toNumber = (v: string) => {
  const n = Number(String(v).replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
};

export const formatBaht = (n: number) => Math.round(n).toLocaleString("th-TH");

// ---------------------------------------------------------------
// ช่องที่ต้องกรอก
// ---------------------------------------------------------------

/** จัดกลุ่มไว้เพื่อให้ฟอร์มและตัวเลือกคอลัมน์เรียงเป็นหมวด ไม่ใช่ยาวพรืด */
export type FieldGroup = "cost" | "rate" | "budget" | "price";

export const FIELD_GROUP_LABEL: Record<FieldGroup, string> = {
  cost: "ต้นทุนต่อถุง",
  rate: "อัตราที่คิดเพิ่ม",
  budget: "งบการตลาด",
  price: "ราคาขาย",
};

export const COST_FIELDS = [
  { key: "rawMaterial", label: "Raw Material Cost", group: "cost", suffix: "บาท" },
  { key: "nitro", label: "Nitro", group: "cost", suffix: "บาท" },
  { key: "penergetic", label: "Penergetic", group: "cost", suffix: "บาท" },
  { key: "bagCost", label: "ค่าถุง", group: "cost", suffix: "บาท" },
  { key: "handling", label: "ค่าการจัดการ", group: "cost", suffix: "บาท" },
  { key: "production", label: "Production", group: "cost", suffix: "บาท" },

  { key: "lossPct", label: "สูญเสียระหว่างการผลิต", group: "rate", suffix: "%" },
  { key: "interestPct", label: "ดอกเบี้ย", group: "rate", suffix: "%" },

  { key: "envelope", label: "งบซองแจกให้ร้าน", group: "budget", suffix: "บาท" },
  { key: "event", label: "งบ event ให้ร้าน", group: "budget", suffix: "บาท" },
  { key: "mkt", label: "งบ MKT", group: "budget", suffix: "บาท" },
  { key: "rebate", label: "Rebate / Promotion", group: "budget", suffix: "บาท" },
  { key: "special", label: "Special Promotion", group: "budget", suffix: "บาท" },
  { key: "tour", label: "Tour", group: "budget", suffix: "บาท" },
  { key: "com", label: "Com", group: "budget", suffix: "บาท" },
  { key: "crm", label: "CRM", group: "budget", suffix: "บาท" },

  { key: "margin", label: "ส่วนบวกเพิ่มเป็นราคาขาย", group: "price", suffix: "บาท" },
] as const satisfies readonly {
  key: string;
  label: string;
  group: FieldGroup;
  suffix: string;
}[];

export type FieldKey = (typeof COST_FIELDS)[number]["key"];

/** งบการตลาดที่บวกเข้าต้นทุนรวม แยกไว้เพราะสูตรคำนวณต้องรวมเฉพาะกลุ่มนี้ */
export const BUDGET_KEYS = COST_FIELDS.filter((f) => f.group === "budget").map(
  (f) => f.key
) as FieldKey[];

export const fieldsByGroup = (g: FieldGroup) =>
  COST_FIELDS.filter((f) => f.group === g);

// ---------------------------------------------------------------
// ข้อมูลรายสูตร
// ---------------------------------------------------------------

export type CostRow = {
  id: string;
  group: RecipeGroupId;
  sku: string;
  /** มาจากแท็บตั้งค่า SKU แก้ที่นี่ไม่ได้ */
  size: number;
} & Record<FieldKey, string>;

/** ค่าเคลือบจากไฟล์ต้นทาง สูตรที่ไม่มีชื่ออยู่ในนี้คือยังไม่ได้กรอก */
const NITRO_COST: Record<string, string> = {
  "30-0-0 Nitro (Coat)": "38600",
  "40-0-0 ต้นไม้ 25 kg": "78000",
  "40-0-0 ต้นไม้ 40 kg": "77750",
  "13-13-21 + 1Mg No Filler": "36800",
  "15-7-18 + 1Mg": "26200",
  "15-15-15 + 1Mg No Filler (No coat)": "41400",
  "18-6-6 No Filler": "15400",
  "18-8-8 + 1Mg No Filler": "27000",
  "20-8-8 + 1Mg No Filler": "34800",
  "16-16-8 + 1Mg No Filler": "38400",
  "15-10-30 + 0.1Mg + 0.2S": "46200",
  "13-6-27 + 1Mg + 0.3B No Filler": "29600",
  "13-5-33 + 1Mg + 0.3B No Filler": "35400",
  "15-5-20 + 1Mg No Filler": "24000",
  "15-15-15 + 1Mg No Filler (Coat)": "41400",
};

const BAG_COST: Record<string, string> = { "16-12-8": "647" };

/** ค่าที่กรอกไว้แล้วในไฟล์ต้นทาง ที่เหลือปล่อยว่างให้เห็นว่ายังไม่ได้กรอก */
export const COST_ROWS: CostRow[] = RECIPES.map((r) => ({
  id: r.id,
  group: r.group,
  sku: r.sku,
  size: r.size,

  rawMaterial: "100000",
  nitro: NITRO_COST[r.sku] ?? "",
  penergetic: r.group === "bulkGravure" ? "0" : "",
  bagCost: BAG_COST[r.sku] ?? "0",
  handling: "1000",
  production: "20",

  lossPct: "0.2",
  interestPct: "0.2",

  envelope: "10",
  event: "10",
  mkt: "10",
  rebate: "10",
  special: "10",
  tour: "10",
  com: "10",
  crm: "10",

  margin: "10000",
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

export function computeCost(r: CostRow): CostResult {
  const prod =
    toNumber(r.rawMaterial) +
    toNumber(r.nitro) +
    toNumber(r.penergetic) +
    toNumber(r.bagCost) +
    toNumber(r.handling) +
    toNumber(r.production);

  const beforeRebate =
    prod * (1 + toNumber(r.lossPct) / 100 + toNumber(r.interestPct) / 100);

  const budgetTotal = BUDGET_KEYS.reduce((sum, k) => sum + toNumber(r[k]), 0);
  const total = beforeRebate + budgetTotal;

  return {
    production: prod,
    beforeRebate,
    budgetTotal,
    total,
    price: total + toNumber(r.margin),
  };
}

// ---------------------------------------------------------------
// ความคืบหน้า — 17 ช่อง × จำนวนสูตร เป็นหลักร้อย ต้องบอกได้ว่าถึงไหนแล้ว
// ---------------------------------------------------------------

export const isBlank = (v: string) => v.trim() === "";

export const totalCells = (rows: CostRow[]) => rows.length * COST_FIELDS.length;

export const filledCells = (rows: CostRow[]) =>
  rows.reduce(
    (sum, r) => sum + COST_FIELDS.filter((f) => !isBlank(r[f.key])).length,
    0
  );

/** คอลัมน์ไหนยังกรอกไม่ครบ ใช้พาไปทำต่อโดยไม่ต้องไล่หาเอง */
export function blanksByField(rows: CostRow[]) {
  return COST_FIELDS.map((f) => ({
    ...f,
    blank: rows.filter((r) => isBlank(r[f.key])).length,
  })).filter((f) => f.blank > 0);
}

export const rowBlanks = (r: CostRow) =>
  COST_FIELDS.filter((f) => isBlank(r[f.key])).length;

export function matchesCost(r: CostRow, q: string) {
  const s = q.trim().toLowerCase();
  return s === "" || r.sku.toLowerCase().includes(s);
}
