// ============================================================
// ใบตรวจจริง — สิ่งที่ผู้ตรวจกรอกหน้าไลน์ ไม่ใช่โครงฟอร์มที่คนตั้งค่าทำไว้
//
// หน่วยของงานคือ "รอบ" ไม่ใช่ "ข้อ"
// ผู้ตรวจเดินไปที่ไลน์ตอน 10:00 แล้วตรวจครบทุกข้อรวดเดียว กลับมาใหม่ 13:00 ทำอีกรอบ
// ฟอร์มกระดาษต้นฉบับจึงวางรอบเป็นคอลัมน์ ข้อเป็นแถว — หนึ่งเที่ยว = ไล่กรอกหนึ่งคอลัมน์
//
// เวลากับผู้ตรวจเป็นของรอบ ไม่ใช่ของข้อ
// เดินไปครั้งเดียวแล้วต้องพิมพ์ 10:00 แปดครั้งคือให้ตอบคำถามเดิมแปดหน
// กระดาษก็มีช่องเวลาช่องเดียวต่อรอบ ไม่ได้มีต่อแถว
// ============================================================

import {
  judge,
  numberFields,
  showsTick,
  type QcItem,
  type QcTemplate,
} from "@/lib/qc-template";

// ---------------------------------------------------------------
// โครงฟอร์มตัวอย่าง — ตามหน้าจอที่ออกแบบไว้
// สามข้อแรกคือที่เห็นในแบบ ส่วนข้อ 4 เป็นต้นไปเป็นข้อติ๊กจากฟอร์มกระดาษ
// ---------------------------------------------------------------

const base = {
  kind: "check" as const,
  description: "",
  required: true,
  verdict: "manual" as const,
  verdictWording: "passFail" as const,
  note: "optional" as const,
  withDate: false,
  withTime: false,
  children: [] as QcItem[],
};

/** ข้อที่ติ๊กอย่างเดียว ตรวจรอบเดียวจบ */
const tick = (id: string, title: string, criteria: string): QcItem => ({
  ...base,
  id,
  title,
  criteria,
  fields: [],
  repeatable: false,
  defaultRounds: 1,
  maxRounds: 1,
});

export const INSPECT_TEMPLATE: Pick<
  QcTemplate,
  "id" | "name" | "formCode" | "revision" | "items"
> = {
  id: "ins-fm-qc-02-03",
  name: "รายงานตรวจสอบสินค้าสำเร็จรูป",
  formCode: "FM-QC-02-03",
  revision: "Rev.02",
  items: [
    {
      ...base,
      id: "q1",
      title: "น้ำหนักของปุ๋ย",
      criteria: "น้ำหนักต่อกระสอบ ≥ 50.2 kg (บรรจุ 50 kg)",
      fields: [
        {
          id: "q1f",
          label: "น้ำหนักที่ชั่ง",
          type: "number",
          unit: "Kg",
          rule: { op: "gte", min: 50.2, max: null },
          options: [],
          source: "",
        },
      ],
      repeatable: true,
      defaultRounds: 1,
      maxRounds: 5,
    },
    {
      // ข้อนี้ไม่มีช่องให้คีย์ค่า ผู้ตรวจดูตัวเลขบนกระสอบแล้วติ๊กอย่างเดียว
      ...base,
      id: "q2",
      title: "สูตรปุ๋ย",
      criteria: "ตัวเลขแสดงประมาณธาตุอาหารรับรอง",
      fields: [],
      repeatable: true,
      defaultRounds: 1,
      maxRounds: 5,
    },
    {
      ...base,
      id: "q3",
      title: "ตรวจสอบความแข็งเม็ดปุ๋ย",
      criteria: "ความแข็งของเม็ดปุ๋ย ≥ 0.4 Kg",
      note: "onFail",
      fields: [
        {
          id: "q3f",
          label: "ค่าความแข็ง",
          type: "number",
          unit: "Kg",
          rule: { op: "gte", min: 0.4, max: null },
          options: [],
          source: "",
        },
      ],
      repeatable: true,
      defaultRounds: 1,
      maxRounds: 5,
    },
    tick("q4", "ตรวจการเย็บกระสอบ", "ระยะห่างฝีเข็มต้องสม่ำเสมอ ต้องเป็นด้ายคู่"),
    tick("q5", "กลิ่นของปุ๋ย", "ไม่มีกลิ่น หรือมีกลิ่นสารเคมีอ่อน ๆ"),
    tick("q6", "การตรวจสอบด้วยการสัมผัส", "สีของเม็ดปุ๋ยต้องไม่ติดมือ"),
    tick("q7", "กระสอบที่ใช้ตรงสูตรไหม", "ปุ๋ยหน้ากระสอบต้องตรงกับเนื้อปุ๋ยข้างใน"),
    tick("q8", "สติ๊กเกอร์แลกแต้ม", "สติ๊กเกอร์ต้องมีทุกกระสอบ"),
  ],
};

// ---------------------------------------------------------------
// ตัวเลขสรุปมุมขวาของหัวข้อ
//
// บางข้อคำตอบไม่ได้อยู่ที่ค่าครั้งใดครั้งหนึ่ง แต่อยู่ที่ค่ารวมของทุกครั้ง
// น้ำหนักดูผลรวม ความแข็งดูค่าเฉลี่ย — ให้คนอ่านเห็นเลยโดยไม่ต้องบวกเอง
// เก็บแยกจาก QcItem เพราะเป็นเรื่องของการแสดงผล ไม่ใช่โครงของฟอร์ม
// ---------------------------------------------------------------

export type ItemSummary = {
  label: string;
  kind: "sum" | "avg";
  /** ช่องที่เอามาคำนวณ */
  fieldId: string;
  unit: string;
  /** โชว์อีกตัวเป็นเปอร์เซ็นต์ เทียบกับค่ามาตรฐานต่อหนึ่งครั้ง */
  percentOf?: { label: string; per: number };
};

export const ITEM_SUMMARY: Record<string, ItemSummary> = {
  q1: {
    label: "น้ำหนักรวม",
    kind: "sum",
    fieldId: "q1f",
    unit: "Kg",
    percentOf: { label: "% รวม", per: 50 },
  },
  q3: { label: "เฉลี่ยความแข็ง", kind: "avg", fieldId: "q3f", unit: "Kg" },
};

/** ค่าที่คีย์ไว้ของข้อนี้ในทุกรอบ — เอาไปรวมหรือเฉลี่ย */
export function valuesAcross(
  item: QcItem,
  rounds: Round[],
  fieldId: string
): number[] {
  const out: number[] = [];
  rounds.forEach((r, i) => {
    if (!editableIn(item, i)) return;
    const raw = answerOf(r, item.id).values[fieldId];
    if (raw === undefined || raw.trim() === "") return;
    const n = Number(raw);
    if (!Number.isNaN(n)) out.push(n);
  });
  return out;
}

/** ข้อความสรุปมุมขวา — คืนรายการว่างเมื่อยังไม่มีค่าให้คำนวณ */
export function summaryText(
  item: QcItem,
  rounds: Round[]
): { label: string; value: string }[] {
  const cfg = ITEM_SUMMARY[item.id];
  if (!cfg) return [];
  const nums = valuesAcross(item, rounds, cfg.fieldId);
  if (nums.length === 0) return [];

  const total = nums.reduce((a, b) => a + b, 0);
  const main = cfg.kind === "sum" ? total : total / nums.length;
  const out = [
    { label: cfg.label, value: `${main.toFixed(2)} ${cfg.unit}` },
  ];

  if (cfg.percentOf) {
    // เทียบกับน้ำหนักมาตรฐานของจำนวนครั้งที่ชั่งไปแล้ว
    const target = cfg.percentOf.per * nums.length;
    const pct = target === 0 ? 0 : (total / target) * 100;
    out.push({ label: cfg.percentOf.label, value: `${pct.toFixed(2)} %` });
  }
  return out;
}

/** ใบสั่งผลิตที่ใบตรวจนี้อ้างถึง — ยังไม่มีหลังบ้าน ตรึงไว้ก่อน */
export const INSPECT_DOC = {
  refOptions: ["PD260115/01", "PD260115/02", "PD260116/01"],
  productOptions: ["21-0-0 ฟูเจียนผง", "15-15-15 พาริชโกลด์", "46-0-0 ยูเรีย"],
  product: "21-0-0 ฟูเจียนผง",
  kind: "วัตถุดิบ",
  packing: "Bulk",
  lot: "A-9M",
  supplier: "บริษัท เอชซี อินเตอร์เนชั่นแนล เทรดดิ้ง จำกัด",
  /** ยอดที่ต้องตรวจทั้งใบ ช่องอื่นในกล่องสถิติคำนวณจากผลตรวจ */
  inspectTon: 800,
};

export const INSPECTORS = ["สมชาย ใจดี", "ประเสริฐ มั่นคง", "วราภรณ์ ศรีทอง"];

// ---------------------------------------------------------------
// คำตอบของผู้ตรวจ
// ---------------------------------------------------------------

export type Answer = {
  /** ค่าที่คีย์ในแต่ละช่อง — key คือ id ของช่อง */
  values: Record<string, string>;
  /** null = ยังไม่ได้ติ๊ก */
  pass: boolean | null;
  note: string;
};

export type Round = {
  id: string;
  time: string;
  date: string;
  inspector: string;
  /** key คือ id ของหัวข้อ */
  answers: Record<string, Answer>;
  /**
   * บันทึกรอบนี้ไปแล้วหรือยัง
   *
   * รอบห่างกันเป็นชั่วโมง ผู้ตรวจไม่ได้เปิดหน้าจอค้างไว้ทั้งวัน
   * ตรวจรอบไหนเสร็จต้องบันทึกรอบนั้นเลย ไม่ใช่รอกดบันทึกทีเดียวตอนจบทั้งใบ
   * บันทึกแล้วล็อกไว้ก่อน เหมือนคอลัมน์ในกระดาษที่เขียนเสร็จแล้วไม่กลับไปเขียนทับ
   */
  saved: boolean;
};

export const emptyAnswer = (): Answer => ({ values: {}, pass: null, note: "" });

export function newRound(id: string): Round {
  return { id, time: "", date: "", inspector: "", answers: {}, saved: false };
}

export const answerOf = (round: Round, itemId: string): Answer =>
  round.answers[itemId] ?? emptyAnswer();

/**
 * ข้อนี้แก้ได้ในรอบนี้หรือเปล่า
 *
 * ข้อที่ตรวจครั้งเดียวถูกตอบไปแล้วตั้งแต่รอบแรก รอบต่อ ๆ ไปจึงอ่านได้อย่างเดียว
 * แต่ยังต้องโชว์อยู่ ไม่ใช่ซ่อนหายไป — ไม่งั้นผู้ตรวจจะสงสัยว่าข้อ 3–7 หายไปไหน
 */
export const editableIn = (item: QcItem, roundIndex: number) =>
  roundIndex === 0 || item.repeatable;

/** เพิ่มรอบได้อีกไหม — ดูจากข้อที่ตรวจซ้ำได้ว่ายังเหลือโควตาอยู่หรือเปล่า */
export const canAddRound = (items: QcItem[], rounds: number) =>
  items.some((i) => i.repeatable && i.maxRounds > rounds);

/**
 * ผลของข้อหนึ่งในรอบหนึ่ง — null = ยังตัดสินไม่ได้
 *
 * ข้อที่ผู้ตรวจติ๊กเอง ใช้สิ่งที่ติ๊ก
 * ข้อที่ระบบตัดสิน คำนวณจากเกณฑ์ของทุกช่องตัวเลข ตกช่องเดียวคือตกทั้งข้อ
 */
export function verdictOf(
  item: QcItem,
  answer: Answer
): boolean | null {
  if (showsTick(item)) return answer.pass;

  const withRules = numberFields(item).filter((f) => f.rule.op !== "none");
  if (withRules.length === 0) return null;

  let seen = false;
  for (const f of withRules) {
    const raw = answer.values[f.id];
    if (raw === undefined || raw.trim() === "") continue;
    const r = judge(f.rule, Number(raw));
    if (r === null) continue;
    seen = true;
    if (!r) return false;
  }
  return seen ? true : null;
}

/** ผลที่ระบบคำนวณจากเกณฑ์ ใช้โชว์เป็นตัวช่วยข้าง ๆ ปุ่มติ๊ก */
export function computedOf(item: QcItem, answer: Answer): boolean | null {
  const withRules = numberFields(item).filter((f) => f.rule.op !== "none");
  if (withRules.length === 0) return null;
  let seen = false;
  for (const f of withRules) {
    const raw = answer.values[f.id];
    if (raw === undefined || raw.trim() === "") continue;
    const r = judge(f.rule, Number(raw));
    if (r === null) continue;
    seen = true;
    if (!r) return false;
  }
  return seen ? true : null;
}

/** ต้องพิมพ์หมายเหตุในข้อนี้หรือยัง — ใช้กันบันทึกทั้งที่ยังไม่ได้บอกเหตุผล */
export function noteMissing(item: QcItem, answer: Answer): boolean {
  if (item.note === "always") return answer.note.trim() === "";
  if (item.note === "onFail")
    return verdictOf(item, answer) === false && answer.note.trim() === "";
  return false;
}

/** รอบนี้กรอกครบหรือยัง — ใช้เป็นจุดสถานะบนแท็บ */
export function roundDone(
  items: QcItem[],
  round: Round,
  roundIndex: number
): boolean {
  if (round.time === "") return false;
  return items
    .filter((i) => editableIn(i, roundIndex))
    .every((i) => {
      const a = answerOf(round, i.id);
      if (noteMissing(i, a)) return false;
      if (i.fields.some((f) => (a.values[f.id] ?? "").trim() === "")) return false;
      return verdictOf(i, a) !== null;
    });
}

/**
 * ผลของข้อหนึ่งเมื่อดูทั้งใบ — ตกรอบไหนก็คือตก
 * ใช้กับคอลัมน์สรุปในตารางแบบกระดาษ
 */
export function overallOf(item: QcItem, rounds: Round[]): boolean | null {
  let seen = false;
  for (let r = 0; r < rounds.length; r++) {
    if (!editableIn(item, r) && r > 0) continue;
    const v = verdictOf(item, answerOf(rounds[r], item.id));
    if (v === null) continue;
    seen = true;
    if (!v) return false;
  }
  return seen ? true : null;
}
