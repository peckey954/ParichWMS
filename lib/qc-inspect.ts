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
  type Rule,
} from "@/lib/qc-template";

// ---------------------------------------------------------------
// โครงฟอร์มตัวอย่าง — ถอดจาก FM-QC-02-03 ใบรายงานการตรวจสอบสินค้าสำเร็จรูป
// ตรงกับกระดาษทุกข้อ ทั้งลำดับ ชื่อ และเกณฑ์
// ---------------------------------------------------------------

const base = {
  description: "",
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

/** ข้อที่ต้องคีย์ตัวเลข และตรวจซ้ำได้หลายรอบ */
const measure = (
  id: string,
  title: string,
  criteria: string,
  field: { id: string; label: string; unit: string; rule: Rule }
): QcItem => ({
  ...base,
  id,
  title,
  criteria,
  fields: [{ ...field, type: "number" }],
  repeatable: true,
  defaultRounds: 1,
  maxRounds: 3,
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
    measure("q1", "น้ำหนักของปุ๋ย", "น้ำหนักต่อกระสอบ ≥ 50.2 kg (บรรจุ 50 kg)", {
      id: "q1f",
      label: "น้ำหนักที่ชั่ง",
      unit: "kg",
      rule: { op: "gte", min: 50.2, max: null },
    }),
    {
      ...base,
      id: "q2",
      title: "สูตรปุ๋ย",
      criteria: "ตัวเลขธาตุอาหารที่วัดได้ต้องตรงกับสูตรที่รับรอง — 15-15-15",
      fields: [
        { id: "q2n", label: "N", type: "number", unit: "%", rule: { op: "between", min: 14.5, max: 15.5 } },
        { id: "q2p", label: "P₂O₅", type: "number", unit: "%", rule: { op: "between", min: 14.5, max: 15.5 } },
        { id: "q2k", label: "K₂O", type: "number", unit: "%", rule: { op: "between", min: 14.5, max: 15.5 } },
      ],
      repeatable: true,
      defaultRounds: 1,
      maxRounds: 3,
    },
    tick("q3", "ตรวจการเย็บกระสอบ", "ระยะห่างฝีเข็มต้องสม่ำเสมอ ต้องเป็นด้ายคู่"),
    tick("q4", "กลิ่นของปุ๋ย", "ไม่มีกลิ่น หรือมีกลิ่นสารเคมีอ่อน ๆ"),
    tick("q5", "การตรวจสอบด้วยการสัมผัส", "สีของเม็ดปุ๋ยต้องไม่ติดมือ"),
    tick("q6", "กระสอบที่ใช้ตรงสูตรไหม", "ปุ๋ยหน้ากระสอบต้องตรงกับเนื้อปุ๋ยข้างใน"),
    tick("q7", "สติ๊กเกอร์แลกแต้ม", "สติ๊กเกอร์ต้องมีทุกกระสอบ"),
    {
      ...base,
      id: "q8",
      title: "ความชื้น",
      description: "วัดด้วยเครื่องวัดความชื้นแบบเข็ม เสียบลึกกลางกระสอบ",
      criteria: "ความชื้นไม่เกิน 80%",
      note: "onFail",
      fields: [
        { id: "q8f", label: "ค่าความชื้น", type: "number", unit: "%", rule: { op: "lte", min: null, max: 80 } },
      ],
      repeatable: true,
      defaultRounds: 1,
      maxRounds: 3,
    },
  ],
};

/** ใบสั่งผลิตที่ใบตรวจนี้อ้างถึง — ยังไม่มีหลังบ้าน ตรึงไว้ก่อน */
export const INSPECT_DOC = {
  refOptions: ["PD260115/01", "PD260115/02", "PD260116/01"],
  productOptions: ["21-0-0 ฟูเจียนผง", "15-15-15 พาริชโกลด์", "46-0-0 ยูเรีย"],
  product: "21-0-0 ฟูเจียนผง",
  kind: "วัตถุดิบ",
  packing: "Bulk",
  lot: "A-9M",
  supplier: "บริษัท เอชซี อินเตอร์เนชั่นแนล เทรดดิ้ง จำกัด",
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
};

export const emptyAnswer = (): Answer => ({ values: {}, pass: null, note: "" });

export function newRound(id: string): Round {
  return { id, time: "", date: "", inspector: "", answers: {} };
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
