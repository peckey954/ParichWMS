// ============================================================
// ตั้งค่าการอนุมัติใบสั่งซื้อ
//
// หนึ่งบรรทัด = หนึ่งการอนุมัติ ถือของครบชุดในตัวเอง:
//   ช่วงวงเงิน (เริ่มต้น–สูงสุด) · ประเภทสินค้าที่คุม · ผู้อนุมัติ · เปิด/ปิดใช้งาน
//
// ช่วงวงเงินเป็น "ช่วงปิด" ทั้งสองด้าน ยอดที่เท่ากับขอบพอดีถือว่าอยู่ในช่วง
// ช่วงจึงต้องไม่ทับกันเอง วิธีเขียนที่ใช้จริงคือให้ขอบล่างของบรรทัดบน
// เกินขอบบนของบรรทัดล่างมา .01 (50,000.00 / 50,000.01) ไม่ใช่ให้เท่ากัน
//
// ผู้อนุมัติใส่ได้หลายคนแต่ต้องการแค่คนเดียวกด — ใส่หลายชื่อคือเผื่อคนลา
// ไม่ใช่ต้องเซ็นครบทุกคน ป้ายบนหัวคอลัมน์เขียนกำกับไว้เพราะเข้าใจผิดกันบ่อย
//
// ปิดใช้งานแทนลบ — บรรทัดที่ปิดอยู่ยังเก็บค่าที่ตั้งไว้ทั้งหมด เปิดกลับมาใช้
// ได้ทันทีโดยไม่ต้องกรอกใหม่ และประวัติการอนุมัติเก่ายังอ่านออกว่ามาจากกฎไหน
// ============================================================

import { PR_CATEGORIES, PR_CATEGORY_LABEL, type PrCategoryId } from "@/lib/pr";

/** เพดานวงเงินของระบบ ใช้เป็นขอบบนของบรรทัดสูงสุด */
export const MAX_BAHT = 100_000_000;

export type ApprovalRule = {
  id: string;
  /** ขอบล่างของช่วง รวมค่านี้ด้วย */
  minBaht: number;
  /** ขอบบนของช่วง รวมค่านี้ด้วย */
  maxBaht: number;
  /** ประเภทสินค้าที่บรรทัดนี้คุม — ว่าง = ทั้งหมด ไม่ใช่ "ไม่มีประเภทไหนเลย" */
  categories: PrCategoryId[];
  /** รหัสผู้อนุมัติ — ใครคนหนึ่งในนี้กดก็ถือว่าผ่าน */
  approverIds: string[];
  enabled: boolean;
};

export type ApprovalConfig = {
  /** เรียงจากวงเงินสูงลงมาต่ำ บรรทัดใหม่แทรกบนสุด */
  rules: ApprovalRule[];
  /** เวลาที่บันทึกล่าสุด เก็บเป็นสตริงสำเร็จรูป ไม่ให้ render ไปคำนวณเวลาเอง
   *  ไม่งั้นค่าฝั่งเซิร์ฟเวอร์กับเบราว์เซอร์ไม่ตรงกันแล้ว hydration พัง */
  updatedAt: string;
};

// ---------------------------------------------------------------
// บัญชีผู้อนุมัติที่เลือกได้
// ---------------------------------------------------------------

export type ApproverAccount = { id: string; name: string };

export const APPROVER_ACCOUNTS: ApproverAccount[] = [
  { id: "alisa", name: "อลิสา พรสุขสิริ" },
  { id: "nattawut", name: "ณัฐวุฒิ แก้วประเสริฐ" },
  { id: "suchanat", name: "สุชานาถ อินทร์ทอง" },
  { id: "kittipong", name: "กิตติพงศ์ ใจดีงาม" },
  { id: "thanakrit", name: "ธนกฤต ศรีบุญเรือง" },
  { id: "pimchanok", name: "พิมพ์ชนก วงศ์อารีย์" },
];

export const APPROVER_OPTIONS = APPROVER_ACCOUNTS.map((a) => ({
  value: a.id,
  label: a.name,
}));

export const CATEGORY_OPTIONS = PR_CATEGORIES.map((id) => ({
  value: id as string,
  label: PR_CATEGORY_LABEL[id],
}));

// ---------------------------------------------------------------

export const DEFAULT_APPROVAL_CONFIG: ApprovalConfig = {
  updatedAt: "1/16/2026 | 10:42:52",
  rules: [
    {
      id: "rule-high",
      minBaht: 50000.01,
      maxBaht: MAX_BAHT,
      categories: [],
      approverIds: [],
      enabled: true,
    },
    {
      id: "rule-low",
      minBaht: 0,
      maxBaht: 50000,
      categories: [],
      approverIds: [],
      enabled: true,
    },
  ],
};

/**
 * บรรทัดใหม่ที่จะไปแทรกบนสุด
 *
 * ตั้งขอบล่างต่อจากขอบบนของบรรทัดที่อยู่บนสุดเดิมมา .01 ช่วงจะได้ไม่ทับกัน
 * ตั้งแต่วินาทีแรก ส่วนขอบบนให้เป็นเพดานระบบ แล้วค่อยให้คนตั้งค่าปรับลง
 */
export function blankRule(currentTop: ApprovalRule | undefined): ApprovalRule {
  const from = currentTop ? round2(currentTop.maxBaht + 0.01) : 0;
  return {
    id: `rule-${Date.now()}`,
    minBaht: from,
    maxBaht: Math.max(from, MAX_BAHT),
    categories: [],
    approverIds: [],
    enabled: true,
  };
}

export const round2 = (v: number) => Number(v.toFixed(2));

export const formatBaht = (v: number) =>
  v.toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

/** เวลาที่บันทึก ในรูปแบบเดียวกับที่โชว์ใต้หัวข้อ — เรียกตอนกดบันทึกเท่านั้น */
export function stampNow(now = new Date()) {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${now.getMonth() + 1}/${now.getDate()}/${now.getFullYear()} | ${p(now.getHours())}:${p(now.getMinutes())}:${p(now.getSeconds())}`;
}

// ---------------------------------------------------------------
// ใบหนึ่งตกไปหาใคร
// ---------------------------------------------------------------

/**
 * บรรทัดนี้กินใบใบนี้ไหม
 *
 * ประเภทสินค้าเช็กแบบ "มีอย่างน้อยหนึ่งรายการตรง" ไม่ใช่ต้องตรงทั้งใบ —
 * ใบที่มีของประเภทที่บรรทัดนั้นคุมปนอยู่แม้รายการเดียวก็ต้องให้เขาเห็น
 */
export function ruleApplies(
  rule: ApprovalRule,
  totalBaht: number,
  categories: PrCategoryId[]
): boolean {
  if (!rule.enabled) return false;
  if (totalBaht < rule.minBaht || totalBaht > rule.maxBaht) return false;
  if (rule.categories.length === 0) return true;
  return categories.some((c) => rule.categories.includes(c));
}

/** บรรทัดแรกที่กินใบนี้ — ช่วงไม่ทับกันจึงได้ไม่เกินหนึ่ง */
export const ruleFor = (
  totalBaht: number,
  categories: PrCategoryId[],
  cfg: ApprovalConfig
): ApprovalRule | undefined =>
  cfg.rules.find((r) => ruleApplies(r, totalBaht, categories));

/** ชื่อประเภทที่บรรทัดนี้คุม ใช้เขียนเป็นคำอ่าน */
export const categorySummary = (rule: ApprovalRule) =>
  rule.categories.length === 0
    ? "ทั้งหมด"
    : rule.categories.map((c) => PR_CATEGORY_LABEL[c]).join(" · ");
