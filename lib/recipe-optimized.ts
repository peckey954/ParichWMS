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
};

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

    return {
      id: r.id,
      group: r.group,
      sku: r.sku,
      size: r.size,
      totalCost,
      weight,
      percent,
      nutrition,
    };
  });
}

/**
 * ธาตุอาหารที่ได้จริงของแต่ละสูตร คีย์ด้วย id ของสูตร
 *
 * หน้าสูตรประจำสัปดาห์ต้องโชว์คอลัมน์ธาตุอาหารด้วย แต่ไม่เก็บเป็นข้อมูลซ้ำ
 * เพราะมันคำนวณจากน้ำหนักวัตถุดิบที่มีอยู่แล้ว เก็บสองที่เมื่อไรก็เพี้ยนเมื่อนั้น
 */
export function nutritionByRecipe(
  recipes = RECIPES,
  materials = RAW_MATERIALS
): Map<string, Record<NutrientKey, number>> {
  return new Map(
    computeOptimized(recipes, materials).map((r) => [r.id, r.nutrition])
  );
}

export function matchesOptimized(r: OptimizedRow, q: string): boolean {
  const s = q.trim().toLowerCase();
  return s === "" || r.sku.toLowerCase().includes(s);
}

export { NUTRIENTS };
