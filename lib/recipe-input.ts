// ============================================================
// ข้อมูลตั้งต้นของการคำนวณสูตร (แท็บ Input)
//
// สองชุดนี้อยู่ในตารางเดียวกันในไฟล์ Excel แต่คนละจังหวะการใช้งาน
//   ต้นทุน     — เปลี่ยนบ่อย ราคาวัตถุดิบขึ้นลงตลอด
//   ธาตุอาหาร  — ตั้งครั้งเดียวใช้ยาว เป็นคุณสมบัติของวัตถุดิบ
// หน้าจอจึงแยกเป็นสองส่วน จะได้ไม่ต้องเลื่อนผ่านช่องที่ไม่ได้แตะทุกครั้ง
// ============================================================

export type NutrientKey = "n" | "p" | "k" | "s" | "mg" | "br" | "ca";

export const NUTRIENTS: { key: NutrientKey; label: string }[] = [
  { key: "n", label: "N" },
  { key: "p", label: "P" },
  { key: "k", label: "K" },
  { key: "s", label: "S" },
  { key: "mg", label: "Mg" },
  { key: "br", label: "Br" },
  { key: "ca", label: "Ca" },
];

/**
 * เก็บค่าตัวเลขเป็นข้อความ เพราะระหว่างพิมพ์ค่าอาจยังไม่เป็นตัวเลขที่สมบูรณ์
 * (ช่องว่าง เครื่องหมายจุดตัวเดียว) ถ้าบังคับเป็น number จะลบตัวเลขทิ้งไม่ได้
 * แปลงเป็นตัวเลขตอนกดคำนวณทีเดียว
 */
export type RawMaterialDraft = {
  id: string;
  name: string;
  /** ต้นทุนต่อตัน (บาท) */
  cost: string;
  nutrients: Record<NutrientKey, string>;
};

const nut = (v: Partial<Record<NutrientKey, number>>): Record<NutrientKey, string> =>
  Object.fromEntries(
    NUTRIENTS.map((n) => [n.key, v[n.key] === undefined ? "" : String(v[n.key])])
  ) as Record<NutrientKey, string>;

export const RAW_MATERIALS: RawMaterialDraft[] = [
  { id: "m1", name: "Urea", cost: "100000", nutrients: nut({ n: 46, p: 0, k: 0, s: 0, mg: 0, br: 0, ca: 0 }) },
  { id: "m2", name: "DAP", cost: "100000", nutrients: nut({ n: 18, p: 45.5, k: 0, s: 0, mg: 0, br: 0, ca: 0 }) },
  { id: "m3", name: "MOP", cost: "100000", nutrients: nut({ n: 0, p: 0, k: 60, s: 0, mg: 0, br: 0, ca: 0 }) },
  { id: "m4", name: "Ammonium Sulphate", cost: "100000", nutrients: nut({ n: 20.5, p: 0, k: 0, s: 23, mg: 0, br: 0, ca: 0 }) },
  { id: "m5", name: "Mg", cost: "100000", nutrients: nut({ n: 0, p: 0, k: 0, s: 14, mg: 10, br: 0, ca: 0 }) },
  { id: "m6", name: "Br", cost: "100000", nutrients: nut({ n: 0, p: 0, k: 0, s: 0, mg: 0, br: 14, ca: 16 }) },
  // สองตัวนี้เป็นสารเคลือบ ไม่ให้ธาตุอาหาร จึงเว้นว่างไว้ทั้งแถว
  { id: "m7", name: "Nitro", cost: "100000", nutrients: nut({}) },
  { id: "m8", name: "Penergetic", cost: "100000", nutrients: nut({}) },
];

export const emptyMaterial = (id: string): RawMaterialDraft => ({
  id,
  name: "",
  cost: "",
  nutrients: nut({}),
});

/** แปลงข้อความเป็นตัวเลข ช่องว่างถือเป็น 0 */
export const toNumber = (v: string) => {
  const n = Number(v.trim());
  return Number.isFinite(n) ? n : 0;
};

export const formatBaht = (v: number) =>
  v.toLocaleString("th-TH", { maximumFractionDigits: 0 });

/** วัตถุดิบที่ยังใช้คำนวณไม่ได้ — ไม่มีชื่อ หรือไม่มีต้นทุน */
export function invalidMaterials(rows: RawMaterialDraft[]) {
  return rows.filter((r) => r.name.trim() === "" || toNumber(r.cost) <= 0);
}

/** สารเคลือบ = มีต้นทุนแต่ไม่ให้ธาตุอาหารเลย ไม่ใช่ข้อผิดพลาด */
export const isCoating = (r: RawMaterialDraft) =>
  NUTRIENTS.every((n) => toNumber(r.nutrients[n.key]) === 0);
