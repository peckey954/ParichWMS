// ============================================================
// สูตรการผลิตประจำสัปดาห์
//
// ข้อมูลชุดนี้เป็น "ผลลัพธ์" ที่คำนวณมาแล้วจากหน้า Setup
// หน้ารายการจึงดูได้อย่างเดียว แก้ไม่ได้ ต้องไปแก้ที่ต้นทาง
// (Input / SKU / Cost) แล้วสั่งคำนวณใหม่
//
// น้ำหนักวัตถุดิบเป็นกิโลกรัมต่อถุงหนึ่งใบตามขนาดบรรจุ
// สูตรที่เคลือบแล้วจะใช้ Coated Urea แทน Urea ธรรมดา อีกช่องจึงว่าง
// ============================================================

export type RecipeGroupId = "nitro" | "bulkPlain" | "bulkGravure";

export const RECIPE_GROUP_LABEL: Record<RecipeGroupId, string> = {
  nitro: "Nitro",
  bulkPlain: "Bulk กระสอบธรรมดา",
  bulkGravure: "Bulk กระสอบกราเวียร์",
};

export type Recipe = {
  id: string;
  group: RecipeGroupId;
  /** ชื่อสูตร ตรงกับ SKU ในไฟล์ต้นทาง */
  sku: string;
  /** ขนาดบรรจุต่อถุง (กก.) */
  size: number;
  coatNitro: boolean;
  coatPower: boolean;
  /** ว่าง = สูตรนี้ไม่ได้ใช้วัตถุดิบตัวนั้น */
  urea?: number;
  coatedUrea?: number;
  dap?: number;
  mop?: number;
  ammoniumSulfate?: number;
  mg?: number;
  br?: number;
};

/** คอลัมน์วัตถุดิบ ใช้สร้างทั้งหัวตารางและช่องข้อมูล จะได้ไม่หลุดกัน */
export const MATERIAL_COLUMNS: { key: keyof Recipe; label: string }[] = [
  { key: "urea", label: "Urea (Kg)" },
  { key: "coatedUrea", label: "Coated Urea (Kg)" },
  { key: "dap", label: "DAP (Kg)" },
  { key: "mop", label: "MOP (Kg)" },
  { key: "ammoniumSulfate", label: "Ammonium Sulfate (Kg)" },
  { key: "mg", label: "Mg (Kg)" },
  { key: "br", label: "Br (Kg)" },
];

export const RECIPES: Recipe[] = [
  // ---------- Nitro ----------
  { id: "r1", group: "nitro", sku: "30-0-0 Nitro (Coat)", size: 50, coatNitro: true, coatPower: false, coatedUrea: 19.3, dap: 0, mop: 0, ammoniumSulfate: 30.6, mg: 0.1, br: 0 },
  { id: "r2", group: "nitro", sku: "40-0-0 ต้นไม้ 25 kg", size: 25, coatNitro: true, coatPower: false, coatedUrea: 19.5, dap: 0, mop: 0, ammoniumSulfate: 5.4, mg: 0.1, br: 0 },
  { id: "r3", group: "nitro", sku: "40-0-0 ต้นไม้ 40 kg", size: 40, coatNitro: true, coatPower: false, coatedUrea: 31.1, dap: 0, mop: 0, ammoniumSulfate: 8.9, mg: 0, br: 0 },
  { id: "r4", group: "nitro", sku: "40-0-0 ต้นไม้ 50 kg", size: 50, coatNitro: false, coatPower: false, urea: 38.9, dap: 0, mop: 0, ammoniumSulfate: 11.1, mg: 0, br: 0 },

  // ---------- Bulk กระสอบธรรมดา ----------
  { id: "r5", group: "bulkPlain", sku: "13-13-21 + 1Mg No Filler", size: 50, coatNitro: true, coatPower: false, coatedUrea: 3.7, dap: 14.7, mop: 17.8, ammoniumSulfate: 11.3, mg: 2.5, br: 0 },
  { id: "r6", group: "bulkPlain", sku: "15-7-18 + 1Mg", size: 50, coatNitro: true, coatPower: false, coatedUrea: 5, dap: 8.1, mop: 15.3, ammoniumSulfate: 19, mg: 2.6, br: 0 },
  { id: "r7", group: "bulkPlain", sku: "15-15-15 + 1Mg No Filler (No coat)", size: 50, coatNitro: true, coatPower: false, coatedUrea: 3.8, dap: 16.9, mop: 12.8, ammoniumSulfate: 14, mg: 2.5, br: 0 },
  { id: "r8", group: "bulkPlain", sku: "16-8-8 + 1Mg No Filler", size: 50, coatNitro: false, coatPower: false, urea: 0.4, dap: 9.2, mop: 7, ammoniumSulfate: 30.8, mg: 2.6, br: 0 },
  { id: "r9", group: "bulkPlain", sku: "17-3-6 + 1Mg", size: 50, coatNitro: false, coatPower: false, urea: 0.4, dap: 3.7, mop: 5.3, ammoniumSulfate: 38.1, mg: 2.5, br: 0 },
  { id: "r10", group: "bulkPlain", sku: "18-4-5 + 1Mg No Filler", size: 50, coatNitro: false, coatPower: false, urea: 1.8, dap: 4.8, mop: 4.5, ammoniumSulfate: 36.4, mg: 2.5, br: 0 },
  { id: "r11", group: "bulkPlain", sku: "18-6-6 No Filler", size: 50, coatNitro: true, coatPower: false, coatedUrea: 0.7, dap: 7, mop: 5.3, ammoniumSulfate: 37, mg: 0, br: 0 },
  { id: "r12", group: "bulkPlain", sku: "18-8-8 + 1Mg No Filler", size: 50, coatNitro: true, coatPower: false, coatedUrea: 4.3, dap: 9.2, mop: 7, ammoniumSulfate: 27, mg: 2.5, br: 0 },
  { id: "r13", group: "bulkPlain", sku: "18-20-0 +1Mg No Filler", size: 50, coatNitro: false, coatPower: false, urea: 0, dap: 22.4, mop: 0, ammoniumSulfate: 25, mg: 2.6, br: 0 },
  { id: "r14", group: "bulkPlain", sku: "20-7-16+0.5Mg No filler", size: 50, coatNitro: false, coatPower: false, urea: 13.4, dap: 8.1, mop: 13.6, ammoniumSulfate: 12.4, mg: 2.5, br: 0 },
  { id: "r15", group: "bulkPlain", sku: "20-8-8 + 1Mg No Filler", size: 50, coatNitro: true, coatPower: false, coatedUrea: 8.2, dap: 9.2, mop: 7, ammoniumSulfate: 23.1, mg: 2.5, br: 0 },
  { id: "r16", group: "bulkPlain", sku: "20-8-20 + 1Mg No filler (No coat)", size: 50, coatNitro: false, coatPower: false, urea: 16.2, dap: 9.2, mop: 17, ammoniumSulfate: 5.1, mg: 2.5, br: 0 },
  { id: "r17", group: "bulkPlain", sku: "21-7-18 + 1 Mg No Filler (No coat)", size: 50, coatNitro: false, coatPower: false, urea: 16.7, dap: 8.1, mop: 15.3, ammoniumSulfate: 7.4, mg: 2.5, br: 0 },
  { id: "r18", group: "bulkPlain", sku: "23-8-14 No filler", size: 50, coatNitro: false, coatPower: false, urea: 16.1, dap: 9.2, mop: 12, ammoniumSulfate: 12.7, mg: 0, br: 0 },
  { id: "r19", group: "bulkPlain", sku: "25-7-7 + 1Mg No Filler (No coat)", size: 50, coatNitro: false, coatPower: false, urea: 17.2, dap: 8.1, mop: 6.1, ammoniumSulfate: 16, mg: 2.6, br: 0 },
  { id: "r20", group: "bulkPlain", sku: "25-8-15+0.5Mg No filler", size: 50, coatNitro: false, coatPower: false, urea: 22.7, dap: 9.2, mop: 12.8, ammoniumSulfate: 2.7, mg: 2.6, br: 0 },
  { id: "r21", group: "bulkPlain", sku: "25-8-18 No filler", size: 50, coatNitro: false, coatPower: false, urea: 22.7, dap: 9.2, mop: 15.3, ammoniumSulfate: 2.7, mg: 0.1, br: 0 },
  { id: "r22", group: "bulkPlain", sku: "30-0-0 No Filler (No coat)", size: 50, coatNitro: false, coatPower: false, urea: 19.3, dap: 0, mop: 0, ammoniumSulfate: 30.6, mg: 0.1, br: 0 },
  { id: "r23", group: "bulkPlain", sku: "16-16-8 + 1Mg No Filler", size: 50, coatNitro: true, coatPower: false, coatedUrea: 1.2, dap: 18, mop: 7, ammoniumSulfate: 21.3, mg: 2.5, br: 0 },
  { id: "r24", group: "bulkPlain", sku: "16-12-8", size: 50, coatNitro: false, coatPower: false, urea: 0, dap: 13.6, mop: 7, ammoniumSulfate: 27.9, mg: 1.5, br: 0 },
  { id: "r25", group: "bulkPlain", sku: "14-7-30 + 1Mg +0.2B No Filler", size: 50, coatNitro: false, coatPower: false, urea: 11.7, dap: 8.1, mop: 25.3, ammoniumSulfate: 1.6, mg: 2.5, br: 0.8 },
  { id: "r26", group: "bulkPlain", sku: "14-28-8 + 0.8Mg + 0.5B No Filler", size: 25, coatNitro: false, coatPower: false, urea: 0.6, dap: 15.6, mop: 3.5, ammoniumSulfate: 2.4, mg: 2, br: 0.9 },
  { id: "r27", group: "bulkPlain", sku: "15-10-30 + 0.1Mg + 0.2S", size: 50, coatNitro: true, coatPower: false, coatedUrea: 11.7, dap: 11.4, mop: 25.3, ammoniumSulfate: 1.1, mg: 0.5, br: 0 },

  // ---------- Bulk กระสอบกราเวียร์ ----------
  { id: "r28", group: "bulkGravure", sku: "10-0-30+TE No Filler", size: 25, coatNitro: false, coatPower: true, urea: 0, dap: 0, mop: 12.5, ammoniumSulfate: 12.2, mg: 0.3, br: 0 },
  { id: "r29", group: "bulkGravure", sku: "8-24-24 + 0.5Mg + 0.3B No Filler", size: 50, coatNitro: false, coatPower: true, urea: 0, dap: 26.8, mop: 20.3, ammoniumSulfate: 0, mg: 1.8, br: 1.1 },
  { id: "r30", group: "bulkGravure", sku: "13-6-27 + 1Mg + 0.3B No Filler", size: 50, coatNitro: true, coatPower: true, coatedUrea: 7.8, dap: 7, mop: 22.8, ammoniumSulfate: 8.8, mg: 2.5, br: 1.1 },
  { id: "r31", group: "bulkGravure", sku: "13-5-33 + 1Mg + 0.3B No Filler", size: 50, coatNitro: true, coatPower: true, coatedUrea: 11.8, dap: 5.9, mop: 27.8, ammoniumSulfate: 0.8, mg: 2.6, br: 1.1 },
  { id: "r32", group: "bulkGravure", sku: "15-5-20 + 1Mg No Filler", size: 50, coatNitro: true, coatPower: true, coatedUrea: 6.1, dap: 5.9, mop: 17, ammoniumSulfate: 18.5, mg: 2.5, br: 0 },
  { id: "r33", group: "bulkGravure", sku: "15-15-15 + 1Mg No Filler (Coat)", size: 50, coatNitro: true, coatPower: true, coatedUrea: 3.8, dap: 16.9, mop: 12.8, ammoniumSulfate: 14, mg: 2.5, br: 0 },
];

export function matchesRecipe(r: Recipe, q: string): boolean {
  const s = q.trim().toLowerCase();
  if (!s) return true;
  return [r.sku, RECIPE_GROUP_LABEL[r.group]].some((v) =>
    v.toLowerCase().includes(s)
  );
}

/** เวลาที่คำนวณสูตรชุดนี้ล่าสุด มาจากหน้า Setup */
export const RECIPE_UPDATED_AT = "1/16/2026 | 10:42:52";
