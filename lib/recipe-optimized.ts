// ============================================================
// ผลลัพธ์หลังกด RUN — Optimized Formula
//
// ทุกอย่างในไฟล์นี้คำนวณสด ไม่ได้เก็บค่าตายตัว
// กด RUN ใหม่ด้วยต้นทุน/ธาตุอาหารที่แก้ไป ตัวเลขก็เปลี่ยนตาม
//
// สูตรที่ใช้
//   สัดส่วน (%)      = น้ำหนักวัตถุดิบ ÷ ขนาดบรรจุ × 100
//   ธาตุอาหารที่ได้   = Σ (สัดส่วนวัตถุดิบ × %ธาตุอาหารของวัตถุดิบนั้น) ÷ 100
//   ต้นทุนต่อถุง      = Σ (น้ำหนัก กก. ÷ 1000 × ราคาต่อตัน)
//   ผลต่างจากเป้า     = ค่าที่ได้จริง เทียบกับตัวเลข N-P-K ในชื่อสูตร
// ============================================================

import { RECIPES, type Recipe, type RecipeGroupId } from "./recipe";
import {
  NUTRIENTS,
  RAW_MATERIALS,
  type NutrientKey,
  type RawMaterialDraft,
  toNumber,
} from "./recipe-input";

/** วัตถุดิบที่แสดงในตารางผล — Urea กับ Coated Urea รวมเป็นช่องเดียว */
export const MATERIALS: { key: string; label: string; source: string }[] = [
  { key: "urea", label: "Urea", source: "Urea" },
  { key: "dap", label: "DAP", source: "DAP" },
  { key: "mop", label: "MOP", source: "MOP" },
  { key: "ammoniumSulfate", label: "Ammonium Sul", source: "Ammonium Sulphate" },
  { key: "mg", label: "Mg", source: "Mg" },
  { key: "br", label: "Br", source: "Br" },
];

export type OptimizedRow = {
  id: string;
  group: RecipeGroupId;
  sku: string;
  size: number;
  totalCost: number;
  /** น้ำหนักวัตถุดิบต่อถุง (กก.) */
  weight: Record<string, number>;
  /** สัดส่วนวัตถุดิบ (%) */
  percent: Record<string, number>;
  /** ธาตุอาหารที่ได้จริง (%) */
  nutrition: Record<NutrientKey, number>;
  /** ผลต่างจากตัวเลขในชื่อสูตร ยิ่งใกล้ 0 ยิ่งตรงเป้า */
  error: number;
};

/** เกินเท่านี้ถือว่าคำนวณไม่เข้าเป้า ต้องกลับไปดูข้อมูลตั้งต้น */
export const ERROR_TOLERANCE = 0.5;

/** ดึงเลข N-P-K จากหน้าชื่อสูตร เช่น "20-8-8 + 1Mg" → 20 / 8 / 8 */
function targetNpk(sku: string): [number, number, number] | null {
  const m = sku.match(/^\s*(\d+)-(\d+)-(\d+)/);
  if (!m) return null;
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

const weightOf = (r: Recipe, key: string) =>
  key === "urea"
    ? (r.urea ?? 0) + (r.coatedUrea ?? 0)
    : ((r[key as keyof Recipe] as number | undefined) ?? 0);

export function computeOptimized(
  recipes: Recipe[] = RECIPES,
  materials: RawMaterialDraft[] = RAW_MATERIALS
): OptimizedRow[] {
  // จับคู่วัตถุดิบในตารางผล กับแถวที่ผู้ใช้ตั้งค่าไว้ในแท็บ Input
  const byName = new Map(materials.map((m) => [m.name.trim(), m]));

  return recipes.map((r) => {
    const weight: Record<string, number> = {};
    const percent: Record<string, number> = {};
    let totalCost = 0;

    for (const m of MATERIALS) {
      const kg = weightOf(r, m.key);
      weight[m.key] = kg;
      percent[m.key] = r.size > 0 ? (kg / r.size) * 100 : 0;
      const src = byName.get(m.source);
      if (src) totalCost += (kg / 1000) * toNumber(src.cost);
    }

    const nutrition = Object.fromEntries(
      NUTRIENTS.map((n) => {
        const total = MATERIALS.reduce((sum, m) => {
          const src = byName.get(m.source);
          if (!src) return sum;
          return sum + (percent[m.key] * toNumber(src.nutrients[n.key])) / 100;
        }, 0);
        return [n.key, total];
      })
    ) as Record<NutrientKey, number>;

    const target = targetNpk(r.sku);
    const error = target
      ? Math.max(
          Math.abs(nutrition.n - target[0]),
          Math.abs(nutrition.p - target[1]),
          Math.abs(nutrition.k - target[2])
        )
      : 0;

    return {
      id: r.id,
      group: r.group,
      sku: r.sku,
      size: r.size,
      totalCost,
      weight,
      percent,
      nutrition,
      error,
    };
  });
}

export const failedRows = (rows: OptimizedRow[]) =>
  rows.filter((r) => r.error > ERROR_TOLERANCE);

export function matchesOptimized(r: OptimizedRow, q: string): boolean {
  const s = q.trim().toLowerCase();
  return s === "" || r.sku.toLowerCase().includes(s);
}

export { NUTRIENTS };
