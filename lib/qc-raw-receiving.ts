// ============================================================
// ตรวจรับวัตถุดิบ — ใบตรวจของที่ผู้ขายส่งเข้ามา ก่อนปล่อยเข้าคลัง
//
// คนละใบกับ "ตรวจรับสินค้า" (qc-receiving.ts) ซึ่งเป็นของสำเร็จรูปฝั่งขาออก
// ฟอร์มของวัตถุดิบตรวจสามข้อ ขนาดเม็ด ความแข็ง ความชื้น
//
// ต่างจากใบตรวจอื่นตรงที่ "ครั้งที่ตรวจ" ไม่ใช่รอบแยกใบ แต่เป็นช่องกรอกในข้อเดียวกัน
// ผู้ตรวจร่อนตะแกรงชุดเดียว วัดความแข็งห้าเม็ดรวดเดียว แล้วจบทั้งใบในเที่ยวเดียว
// จึงไม่มีการ์ดรอบแบบหน้าตรวจสินค้าสำเร็จรูป มีแค่สามข้อเรียงลงมา
// ============================================================

import {
  DISPOSITIONS,
  DISPOSITION_LABEL,
  tonnage,
  type Disposition,
} from "@/lib/qc-receiving";
import type { QcField, QcItem, Rule } from "@/lib/qc-template";

// สิ่งที่ต้องตัดสินใจเมื่อของไม่ผ่านเป็นเรื่องเดียวกันทั้งสองฝั่งของการรับเข้า
// (repack / รับสภาพ / ส่งคืน เปลี่ยนยอดเข้าคลังแบบเดียวกัน) จึงใช้ของเดิมต่อ
// ไม่ประกาศซ้ำ — ประกาศซ้ำแล้ววันหนึ่งจะมีคนแก้ฝั่งเดียว
export { DISPOSITIONS, DISPOSITION_LABEL, tonnage };
export type { Disposition };

/**
 * น้ำหนักตัวอย่างที่ร่อนตะแกรงต่อหนึ่งใบ (กรัม)
 *
 * เป็นตัวหารของทุก % ในข้อขนาดเม็ด — ช่องละกี่กรัมคิดเป็นกี่ % ของตัวอย่าง
 * ตรึงไว้เพราะวิธีร่อนกำหนดปริมาณตัวอย่างมาแล้ว ไม่ใช่ค่าที่ผู้ตรวจเลือกเอง
 */
export const SAMPLE_GRAMS = 2500;

// ---------------------------------------------------------------
// โครงฟอร์ม
// ---------------------------------------------------------------

const num = (id: string, label: string, unit: string, rule: Rule): QcField => ({
  id,
  label,
  type: "number",
  unit,
  rule,
  options: [],
  source: "",
});

const noRule: Rule = { op: "none", min: null, max: null };

const item = (
  id: string,
  title: string,
  criteria: string,
  fields: QcField[]
): QcItem => ({
  id,
  kind: "check",
  title,
  description: "",
  criteria,
  // ทุกข้อของใบนี้ตัดสินจากตัวเลขที่วัดได้ ไม่มีข้อไหนให้ผู้ตรวจติ๊กเอง
  verdict: "auto",
  verdictWording: "passFail",
  fields,
  note: "optional",
  required: true,
  repeatable: false,
  defaultRounds: 1,
  maxRounds: 1,
  withDate: false,
  withTime: false,
  children: [],
});

export const RAW_ITEMS: QcItem[] = [
  item(
    "size",
    "ตรวจสอบขนาดเม็ดปุ๋ย",
    "เม็ดปุ๋ยขนาด 2–4 mm ≥ 80%",
    [
      num("size-4", "น้ำหนักเม็ดปุ๋ย 4 มม.", "ก.", noRule),
      num("size-315", "น้ำหนักเม็ดปุ๋ย 3.15 มม.", "ก.", noRule),
      num("size-2", "น้ำหนักเม็ดปุ๋ย 2 มม.", "ก.", noRule),
      num("size-05", "น้ำหนักเม็ดปุ๋ย 0.5 มม.", "ก.", noRule),
    ]
  ),
  item(
    "hardness",
    "ตรวจสอบความแข็งเม็ดปุ๋ย",
    "ความแข็งของเม็ดปุ๋ย ≥ 0.4 กก.",
    [1, 2, 3, 4, 5].map((n) =>
      num(`hardness-${n}`, `ค่าความแข็งครั้งที่ ${n}`, "กก.", {
        op: "gte",
        min: 0.4,
        max: null,
      })
    )
  ),
  item(
    "moisture",
    "ตรวจสอบความชื้นเม็ดปุ๋ย",
    "ความชื้นของเม็ดปุ๋ย < 10%",
    [
      num("moisture-pct", "ความชื้น", "%", { op: "lte", min: null, max: 10 }),
      num("moisture-weight", "น้ำหนัก", "กก.", noRule),
    ]
  ),
];

/** ช่องที่โชว์ % ของตัวอย่างต่อท้ายป้ายกำกับ — มีเฉพาะข้อขนาดเม็ด */
export const showsShare = (itemId: string) => itemId === "size";

// ---------------------------------------------------------------
// ผลของแต่ละข้อ
//
// ใบนี้ไม่ใช้ verdictOf() ของ qc-inspect เพราะเกณฑ์ที่นี่เป็นเกณฑ์ "รวม"
// ไม่ใช่เกณฑ์รายช่อง — ขนาดเม็ดตัดสินจากสัดส่วนของช่วง 2–4 มม. เทียบทั้งตัวอย่าง
// ความแข็งตัดสินจากค่าเฉลี่ยห้าครั้ง ไม่ใช่ทุกครั้งต้องผ่านแยกกัน
// ยัดเข้าเกณฑ์รายช่องจะได้ผลผิด เช่นความแข็งตกครั้งเดียวแล้วเหมาว่าตกทั้งข้อ
// ---------------------------------------------------------------

export type ItemResult = {
  /** null = ยังกรอกไม่พอให้ตัดสิน */
  pass: boolean | null;
  /** ตัวเลขสรุปมุมขวาของหัวข้อ */
  summary: { label: string; value: string }[];
};

type Values = Record<string, string>;

const numberOf = (values: Values, id: string): number | null => {
  const raw = values[id];
  if (raw === undefined || raw.trim() === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
};

const fmt = (v: number, digits = 2) =>
  v.toLocaleString("th-TH", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });

/** กี่ % ของตัวอย่าง — ใช้กับป้ายท้ายช่องของข้อขนาดเม็ด */
export function shareOfSample(values: Values, fieldId: string): string | null {
  const v = numberOf(values, fieldId);
  if (v === null) return null;
  return `${fmt((v / SAMPLE_GRAMS) * 100)}%`;
}

export function itemResult(qcItem: QcItem, values: Values): ItemResult {
  if (qcItem.id === "size") {
    const parts = qcItem.fields.map((f) => numberOf(values, f.id));
    if (parts.some((p) => p === null)) return { pass: null, summary: [] };
    const nums = parts as number[];
    const total = nums.reduce((a, b) => a + b, 0);
    // ช่วง 2–4 มม. คือของที่ลอดตะแกรง 4 มม. แล้วค้างบนตะแกรง 3.15 กับ 2 มม.
    const inRange = nums[1] + nums[2];
    const pct = total === 0 ? 0 : (inRange / total) * 100;
    return {
      pass: pct >= 80,
      summary: [
        { label: "น้ำหนักรวม", value: `${fmt(total)} ก.` },
        { label: "ช่วง 2–4 มม.", value: `${fmt(pct)} %` },
      ],
    };
  }

  if (qcItem.id === "hardness") {
    const nums = qcItem.fields
      .map((f) => numberOf(values, f.id))
      .filter((n): n is number => n !== null);
    if (nums.length === 0) return { pass: null, summary: [] };
    const avg = nums.reduce((a, b) => a + b, 0) / nums.length;
    return {
      pass: avg >= 0.4,
      summary: [{ label: "เฉลี่ยความแข็ง", value: `${fmt(avg)} กก.` }],
    };
  }

  const pct = numberOf(values, "moisture-pct");
  if (pct === null) return { pass: null, summary: [] };
  return {
    pass: pct < 10,
    summary: [{ label: "ความชื้น", value: `${fmt(pct)} %` }],
  };
}

/** ตกข้อไหนก็คือตกทั้งใบ — null = ยังตัดสินไม่ได้ */
export function anyFail(values: Values): boolean {
  return RAW_ITEMS.some((i) => itemResult(i, values).pass === false);
}

// ---------------------------------------------------------------
// ผลตรวจทั้งใบที่เอาไปขึ้นเป็นป้ายในตาราง
//
// ผ่านหมด = "ผ่าน" ตกข้อใดข้อหนึ่ง = ป้ายบอกว่าตัดสินใจทำยังไงกับของ
// ป้ายจึงไม่ได้บอกแค่ผ่าน/ไม่ผ่าน แต่บอกว่าของกองนี้จบยังไง ซึ่งคือสิ่งที่คนตามงานอยากรู้
// ---------------------------------------------------------------

export type Outcome = "pass" | Disposition;

export const OUTCOME_LABEL: Record<Outcome, string> = {
  pass: "ผ่าน",
  repack: "Repack",
  accept: "รับสภาพ",
  return: "ส่งคืน",
};

// เขียนคลาสเต็มทุกตัว ห้ามประกอบชื่อด้วย template string
// Tailwind อ่านซอร์สเป็นข้อความตรง ๆ ประกอบตอนรันแล้ว utility จะไม่ถูกสร้าง
export const OUTCOME_CHIP: Record<Outcome, string> = {
  pass: "[--bdg-surface:var(--chip-green)] [--bdg-text:var(--chip-green-foreground)]",
  repack:
    "[--bdg-surface:var(--chip-purple)] [--bdg-text:var(--chip-purple-foreground)]",
  accept:
    "[--bdg-surface:var(--chip-blue)] [--bdg-text:var(--chip-blue-foreground)]",
  return: "[--bdg-surface:var(--chip-red)] [--bdg-text:var(--chip-red-foreground)]",
};

// ---------------------------------------------------------------
// ใบตรวจ
// ---------------------------------------------------------------

/** ผลที่บันทึกไว้แล้วของใบที่ตรวจเสร็จ — ใบที่ยังไม่ตรวจไม่มีก้อนนี้ */
export type RawResult = {
  /** ค่าที่คีย์ไว้ — key คือ id ของช่อง */
  values: Record<string, string>;
  /** หมายเหตุรายข้อ — key คือ id ของหัวข้อ */
  notes: Record<string, string>;
  /** null = ผ่านหมด ไม่ต้องตัดสินใจอะไรกับของ */
  disposition: Disposition | null;
  note: string;
};

export type RawDoc = {
  id: string;
  /** เลขที่ใบตรวจสอบ */
  code: string;
  createdAt: string;
  product: string;
  productNote: string;
  supplier: string;
  packing: string;
  /** ขนาดบรรจุต่อชิ้น เช่น 50 Kg */
  bagSize: string;
  bagKg: number;
  lot: string;
  /** ยอดที่ต้องตรวจ หน่วยตัน */
  ton: number;
  receiver: string;
  /** ว่าง = ยังไม่มีใครแก้ */
  editor: string;
  done: boolean;
  result?: RawResult;
};

const base = {
  code: "PO260115/01",
  createdAt: "1/16/2026 | 10:42:52",
  product: "21-0-0",
  productNote: "ฟูเจียน ผง",
  supplier: "เอชซี อินเตอร์เนชั่นแนล เทรดดิ้ง จำกัด",
  packing: "Bulk",
  bagSize: "50 Kg",
  bagKg: 50,
  lot: "A-9M",
  ton: 800,
  receiver: "อลิสา พรสุขสิริ",
  editor: "",
};

const doc = (n: number, extra: Partial<RawDoc> = {}): RawDoc => ({
  ...base,
  id: `rm-${n}`,
  done: false,
  ...extra,
});

/** รอตรวจวัตถุดิบ — ยังไม่ได้ลงผลตรวจ */
export const PENDING_DOCS: RawDoc[] = [
  doc(1),
  doc(2, { editor: "อลิสา พรสุขสิริ" }),
  ...Array.from({ length: 9 }, (_, i) => doc(3 + i)),
];

// ---------------------------------------------------------------
// ตัวอย่างผลตรวจของใบที่ตรวจไปแล้ว
//
// ตัวเลขเป็นค่าที่ผ่าน/ตกเกณฑ์จริงตามที่เขียนไว้ข้างบน ไม่ใช่เลขหลอกเหมือนกันทุกช่อง
// เพราะป้ายผ่าน/ไม่ผ่านในตารางคำนวณจากค่าพวกนี้ ถ้าค่าไม่สมเหตุสมผล ป้ายก็จะขัดกับตัวเลข
// ---------------------------------------------------------------

const sizeOk = {
  "size-4": "180",
  "size-315": "1100",
  "size-2": "980",
  "size-05": "240",
};
const sizeBad = {
  "size-4": "520",
  "size-315": "900",
  "size-2": "700",
  "size-05": "380",
};
const hardOk = {
  "hardness-1": "0.62",
  "hardness-2": "0.58",
  "hardness-3": "0.71",
  "hardness-4": "0.55",
  "hardness-5": "0.64",
};
const hardBad = {
  "hardness-1": "0.31",
  "hardness-2": "0.28",
  "hardness-3": "0.35",
  "hardness-4": "0.30",
  "hardness-5": "0.26",
};
const wetOk = { "moisture-pct": "6.40", "moisture-weight": "50.00" };
const wetBad = { "moisture-pct": "12.80", "moisture-weight": "50.00" };

const result = (
  size: boolean,
  hard: boolean,
  wet: boolean,
  disposition: Disposition | null,
  notes: Record<string, string> = {}
): RawResult => ({
  values: {
    ...(size ? sizeOk : sizeBad),
    ...(hard ? hardOk : hardBad),
    ...(wet ? wetOk : wetBad),
  },
  notes,
  disposition,
  note: "",
});

/** ชุดผลที่วนใช้กับใบที่ตรวจแล้ว — ครบทุกคู่ผล/การตัดสินใจที่เกิดขึ้นได้จริง */
const PATTERNS: RawResult[] = [
  result(true, true, true, null),
  result(true, false, true, "repack", { hardness: "เม็ดร่วนกว่าเกณฑ์ ขอแบ่งบรรจุใหม่" }),
  result(false, false, true, "return", {
    size: "เม็ดละเอียดเกินเกณฑ์มาก",
    hardness: "ความแข็งต่ำทั้งห้าครั้ง",
  }),
  result(true, true, false, "accept", { moisture: "ความชื้นเกิน รับไว้แล้วผึ่งก่อนใช้" }),
  result(true, true, true, null),
  result(true, true, true, null),
];

/** ตรวจวัตถุดิบแล้ว — เก็บไว้ย้อนดู */
export const DONE_DOCS: RawDoc[] = Array.from({ length: 24 }, (_, i) =>
  doc(100 + i, {
    done: true,
    editor: "อลิสา พรสุขสิริ",
    result: PATTERNS[i % PATTERNS.length],
  })
);

export const findDoc = (id: string) =>
  [...PENDING_DOCS, ...DONE_DOCS].find((d) => d.id === id);

/** ผลรวมของใบที่ตรวจแล้ว — ใช้กับป้ายในตารางและใต้หัวเรื่อง */
export function outcomeOf(doc: RawDoc): Outcome | null {
  if (!doc.result) return null;
  return anyFail(doc.result.values) ? doc.result.disposition ?? "return" : "pass";
}
