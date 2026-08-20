// ============================================================
// โครงข้อมูลของเทมเพลต QC
// ฟอร์ม QC ในโรงงานมีหลายแบบและเปลี่ยนบ่อย จึงเก็บ "โครงฟอร์ม" เป็นข้อมูล
// แล้วให้หน้าตรวจจริง render จากโครงนี้ ไม่ต้องแก้โค้ดทุกครั้งที่ฟอร์มเปลี่ยน
// ============================================================

/** ชนิดของช่องกรอกในส่วนหัวเอกสาร */
export type FieldKind = "text" | "number" | "date" | "time" | "select" | "ref";

export const FIELD_KIND_LABEL: Record<FieldKind, string> = {
  text: "ข้อความ",
  number: "ตัวเลข",
  date: "วันที่",
  time: "เวลา",
  select: "เลือกจากรายการ",
  ref: "ดึงจากระบบ",
};

export type HeaderField = {
  id: string;
  label: string;
  kind: FieldKind;
  required: boolean;
  /** ใช้กับ kind = "select" */
  options: string[];
  /** ใช้กับ kind = "ref" — ชี้ว่าดึงมาจากตารางไหนในระบบ */
  source?: string;
};

// ---------------------------------------------------------------
// หัวข้อตรวจ
//
// เดิมแยกเป็นสองแกน capture (คีย์อะไร) กับ verdict (ตัดสินยังไง) แล้วมีพรีเซ็ต
// มารวมสองแกนให้อีกที กลายเป็นสามที่ที่พูดเรื่องเดียวกัน
//
// ตอนนี้ "คีย์อะไร" ไม่ใช่ค่าของหัวข้ออีกต่อไป แต่อ่านจากช่องที่ใส่ไว้จริง
// ไม่มีช่อง = ติ๊กอย่างเดียว มีช่องตัวเลข = ต้องคีย์ตัวเลข
// เหลือให้ตั้งจริง ๆ แค่ "ตัดสินยังไง" อย่างเดียว
// ---------------------------------------------------------------

/** ตัดสินผ่าน/ไม่ผ่านด้วยวิธีไหน */
export type VerdictMode = "none" | "auto" | "manual";

export const VERDICT_LABEL: Record<VerdictMode, string> = {
  manual: "ผู้ตรวจติ๊ก",
  auto: "ระบบตัดสิน",
  none: "ไม่ตัดสิน",
};

export const VERDICT_HINT: Record<VerdictMode, string> = {
  manual: "ผู้ตรวจติ๊กผลเอง ถ้ามีเกณฑ์ตัวเลขระบบจะขึ้นผลที่คำนวณได้ให้ดูเป็นตัวช่วย",
  auto: "ระบบตัดสินจากเกณฑ์ของช่องตัวเลข ผู้ตรวจไม่ต้องติ๊ก",
  none: "หัวข้อนี้เก็บค่าอย่างเดียว ไม่มีผ่าน/ไม่ผ่าน",
};

/** คำที่ใช้เรียกสองขั้วของผลตรวจ */
export type VerdictWording = "passFail" | "normalAbnormal";

export const VERDICT_WORDS: Record<VerdictWording, readonly [string, string]> = {
  passFail: ["ผ่าน", "ไม่ผ่าน"],
  normalAbnormal: ["ปกติ", "ผิดปกติ"],
};

export const VERDICT_WORDING_LABEL: Record<VerdictWording, string> = {
  passFail: "ผ่าน / ไม่ผ่าน",
  normalAbnormal: "ปกติ / ผิดปกติ",
};

// ---------------------------------------------------------------
// หมายเหตุ
//
// เดิมเป็นสวิตช์เปิด/ปิดอย่างเดียว แต่ของจริงต้องแยกได้ว่าบังคับหรือไม่บังคับ
// เพราะเหตุผลตอน "ไม่ผ่าน" คือของที่ต้องมีเสมอ ไม่งั้นใบตรวจบอกไม่ได้ว่าพังตรงไหน
// รวมเป็นแถวเดียวสี่ตัวเลือก ไม่ใช่สวิตช์เปิด/ปิดคู่กับตัวเลือกซ้ำอีกที่
// ---------------------------------------------------------------

export type NoteMode = "off" | "optional" | "onFail" | "always";

export const NOTE_MODE_LABEL: Record<NoteMode, string> = {
  off: "ไม่มี",
  optional: "ไม่บังคับ",
  onFail: "เมื่อไม่ผ่าน",
  always: "บังคับ",
};

export const NOTE_MODE_HINT: Record<NoteMode, string> = {
  off: "ไม่มีช่องหมายเหตุในหัวข้อนี้",
  optional: "มีช่องให้พิมพ์ จะเว้นว่างก็ได้",
  onFail: "ต้องพิมพ์เหตุผลทุกครั้งที่ติ๊กไม่ผ่าน/ผิดปกติ",
  always: "ต้องพิมพ์ทุกครั้ง ไม่ว่าผลจะออกมาเป็นอะไร",
};

/** ป้ายบนหัวการ์ด — ต่อคำดิบ ๆ แล้วได้ "หมายเหตุไม่มี" ซึ่งอ่านไม่รู้เรื่อง */
export const NOTE_BADGE_LABEL: Record<NoteMode, string> = {
  off: "ไม่มีหมายเหตุ",
  optional: "หมายเหตุไม่บังคับ",
  onFail: "หมายเหตุเมื่อไม่ผ่าน",
  always: "หมายเหตุบังคับ",
};

/** ป้ายสั้น ๆ ที่ใช้บนหัวคอลัมน์หมายเหตุในหน้าตัวอย่าง */
export const NOTE_COLUMN_HINT: Record<NoteMode, string> = {
  off: "",
  optional: "ไม่บังคับ",
  onFail: "บังคับเมื่อไม่ผ่าน",
  always: "บังคับ",
};

// ---------------------------------------------------------------
// ช่องที่ผู้ตรวจต้องกรอก
//
// เกณฑ์ตัวเลขอยู่ที่ช่อง ไม่ได้อยู่ที่หัวข้อ เพราะหัวข้อเดียวมีได้หลายช่อง
// (สูตรปุ๋ยมี N, P, K) แล้วแต่ละตัวก็มีช่วงของตัวเอง
// ของเดิมมีเกณฑ์เดียวต่อหัวข้อ จึงบังคับให้ทุกช่องใช้ช่วงเดียวกันหมด
// ---------------------------------------------------------------

export type FieldType = "text" | "number";

export const FIELD_TYPE_LABEL: Record<FieldType, string> = {
  text: "ข้อความ",
  number: "ตัวเลข",
};

/** เกณฑ์ตัดสินผ่าน/ไม่ผ่านแบบอัตโนมัติ ใช้กับช่องตัวเลข */
export type RuleOp = "none" | "gte" | "lte" | "between";

export const RULE_OP_LABEL: Record<RuleOp, string> = {
  none: "ไม่มีเกณฑ์",
  gte: "ไม่น้อยกว่า (≥)",
  lte: "ไม่เกิน (≤)",
  between: "อยู่ระหว่าง",
};

export type Rule = {
  op: RuleOp;
  min: number | null;
  max: number | null;
};

export type QcField = {
  id: string;
  label: string;
  type: FieldType;
  /** ใช้กับ type = "number" */
  unit: string;
  /** ใช้กับ type = "number" */
  rule: Rule;
};

/** หน่วยที่โรงงานใช้จริง — ว่างคือไม่มีหน่วย เช่นช่องนับจำนวน */
export const UNIT_OPTIONS = [
  "kg",
  "g",
  "ตัน",
  "%",
  "°C",
  "mm",
  "cm",
  "ครั้ง",
  "กระสอบ",
  "ถุง",
];

export type QcItem = {
  id: string;
  title: string;
  /** ข้อความย่อยใต้ชื่อหัวข้อ — ว่าง = ไม่มีบรรทัดนี้ในใบตรวจ */
  description: string;
  criteria: string;
  verdict: VerdictMode;
  verdictWording: VerdictWording;
  /** ช่องที่ผู้ตรวจต้องกรอก — ไม่มีเลยคือหัวข้อแบบติ๊กอย่างเดียว */
  fields: QcField[];
  note: NoteMode;
  /** เปิดให้บันทึกได้หลายครั้ง (ตรวจครั้งที่ 1, 2, 3 …) */
  repeatable: boolean;
  defaultRounds: number;
  maxRounds: number;
  /** ช่องวันที่ของแต่ละครั้งที่ตรวจ — คนละอันกับวันที่ตรวจในหัวเอกสาร */
  withDate: boolean;
  withTime: boolean;
  /** หัวข้อย่อย — ใช้กับฟอร์มที่จัดเป็นกลุ่ม เช่น ใบตรวจก่อนผลิต */
  children: QcItem[];
};

/**
 * ส่วนที่กล่อง "รูปแบบการตรวจ" เป็นเจ้าของ
 *
 * แยกเป็นชนิดของตัวเอง เพราะเป็นก้อนที่ยกไปใช้กับหัวข้ออื่นทั้งก้อนได้
 * ชื่อหัวข้อ เกณฑ์ ช่องกรอก และหัวข้อย่อย ไม่อยู่ในนี้ — พวกนั้นเป็นของเฉพาะข้อ
 */
export type ItemSettings = Pick<
  QcItem,
  | "verdict"
  | "verdictWording"
  | "note"
  | "repeatable"
  | "defaultRounds"
  | "maxRounds"
  | "withDate"
  | "withTime"
>;

export const ITEM_SETTINGS_DEFAULT: ItemSettings = {
  verdict: "manual",
  verdictWording: "passFail",
  note: "optional",
  repeatable: false,
  defaultRounds: 1,
  maxRounds: 3,
  withDate: false,
  withTime: false,
};

export const pickSettings = (item: QcItem): ItemSettings => ({
  verdict: item.verdict,
  verdictWording: item.verdictWording,
  note: item.note,
  repeatable: item.repeatable,
  defaultRounds: item.defaultRounds,
  maxRounds: item.maxRounds,
  withDate: item.withDate,
  withTime: item.withTime,
});

export type FailAction = { id: string; label: string };

export type TemplateStatus = "draft" | "active" | "inactive";

export type QcTemplate = {
  id: string;
  name: string;
  formCode: string;
  revision: string;
  status: TemplateStatus;
  effectiveFrom: string;
  /** null = ใช้ไปเรื่อย ๆ จนกว่าจะมีเวอร์ชันใหม่มาแทน */
  effectiveTo: string | null;
  roles: string[];
  headerFields: HeaderField[];
  items: QcItem[];
  /** เปิดให้ผู้ตรวจเพิ่มหัวข้อเองตอนตรวจจริง — แทนบรรทัดว่าง "อื่นๆ" ที่เขียนมือในฟอร์มกระดาษ */
  allowAdHocItems: boolean;
  failActions: FailAction[];
  requireFailAction: boolean;
  signature: {
    inspector: boolean;
    time: boolean;
    approver: boolean;
  };
};

// ---------------------------------------------------------------
// ตัวช่วย
// ---------------------------------------------------------------

let seq = 0;
/** สร้าง id ใหม่ — เรียกเฉพาะใน event handler เท่านั้น กัน hydration ไม่ตรง */
export const uid = (prefix: string) => `${prefix}-${++seq}`;

export const emptyRule = (): Rule => ({ op: "none", min: null, max: null });

export function newItem(): QcItem {
  return {
    id: uid("item"),
    title: "",
    description: "",
    criteria: "",
    ...ITEM_SETTINGS_DEFAULT,
    fields: [],
    children: [],
  };
}

export function newField(type: FieldType = "number"): QcField {
  return { id: uid("fld"), label: "", type, unit: "", rule: emptyRule() };
}

/**
 * คัดลอกหัวข้อทั้งก้อนพร้อมหัวข้อย่อย — ได้ id ใหม่หมดทุกชั้น ไม่ชนของเดิม
 * ใช้ตอนฟอร์มมีหลายข้อโครงสร้างเหมือนกัน (เช่นข้อติ๊กผ่าน/ไม่ผ่านเรียงกันหลายข้อ)
 * เรียกได้เฉพาะใน event handler เท่านั้น เพราะข้างในเรียก uid()
 */
export function cloneItemDeep(item: QcItem): QcItem {
  return {
    ...item,
    id: uid("item"),
    title: item.title ? `${item.title} (คัดลอก)` : item.title,
    fields: item.fields.map((f) => ({
      ...f,
      id: uid("fld"),
      rule: { ...f.rule },
    })),
    children: item.children.map(cloneItemDeep),
  };
}

export function newHeaderField(): HeaderField {
  return {
    id: uid("hf"),
    label: "",
    kind: "text",
    required: false,
    options: [],
  };
}

// ---------------------------------------------------------------
// สิ่งที่อ่านออกมาจากช่องกรอก ไม่ได้ตั้งแยกอีกที
// ---------------------------------------------------------------

export const numberFields = (item: QcItem) =>
  item.fields.filter((f) => f.type === "number");

/** มีเกณฑ์ตัวเลขให้ระบบคำนวณได้หรือเปล่า */
export function hasNumericRule(item: QcItem): boolean {
  return numberFields(item).some((f) => f.rule.op !== "none");
}

/** ต้องโชว์ช่องติ๊กให้ผู้ตรวจเลือกเองหรือเปล่า */
export function showsTick(item: QcItem): boolean {
  return item.verdict === "manual";
}

/** โชว์คอลัมน์สถานะที่ระบบคำนวณให้หรือเปล่า */
export function showsAutoStatus(item: QcItem): boolean {
  return hasNumericRule(item) && item.verdict !== "none";
}

/** อธิบายเกณฑ์ของช่องหนึ่งช่องเป็นภาษาคน */
export function describeRule(rule: Rule, unit: string): string {
  const u = unit ? ` ${unit}` : "";
  switch (rule.op) {
    case "gte":
      return rule.min === null ? "" : `ต้องไม่น้อยกว่า ${rule.min}${u}`;
    case "lte":
      return rule.max === null ? "" : `ต้องไม่เกิน ${rule.max}${u}`;
    case "between":
      return rule.min === null || rule.max === null
        ? ""
        : `ต้องอยู่ระหว่าง ${rule.min}–${rule.max}${u}`;
    default:
      return "";
  }
}

/**
 * รวมเกณฑ์ของทุกช่องเป็นบรรทัดเดียว
 * ช่องเดียวไม่ต้องขึ้นชื่อช่องนำ เพราะชื่อหัวข้อบอกอยู่แล้วว่าวัดอะไร
 */
export function describeItemRules(item: QcItem): string {
  const parts = numberFields(item)
    .map((f) => {
      const text = describeRule(f.rule, f.unit);
      if (!text) return "";
      return f.label ? `${f.label} ${text}` : text;
    })
    .filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1 && numberFields(item).length === 1) {
    const only = numberFields(item)[0];
    return describeRule(only.rule, only.unit);
  }
  return parts.join(" · ");
}

/** ตัดสินค่าที่วัดได้ตามเกณฑ์ — null = ยังตัดสินไม่ได้ */
export function judge(rule: Rule, value: number | null): boolean | null {
  if (value === null || Number.isNaN(value) || rule.op === "none") return null;
  if (rule.op === "gte") return rule.min === null ? null : value >= rule.min;
  if (rule.op === "lte") return rule.max === null ? null : value <= rule.max;
  if (rule.op === "between") {
    if (rule.min === null || rule.max === null) return null;
    return value >= rule.min && value <= rule.max;
  }
  return null;
}

/**
 * ป้ายสรุปบนหัวการ์ด — ขึ้นเฉพาะค่าที่ไม่ใช่ค่าเริ่มต้น
 *
 * ถ้าขึ้นทุกค่า ทุกการ์ดจะมีป้ายชุดเดียวกันหมดแล้วป้ายก็เลิกบอกอะไร
 * การ์ดที่มีป้ายจึงแปลว่า "ข้อนี้ตั้งไว้ไม่เหมือนชาวบ้าน" ซึ่งคือสิ่งที่ต้องรีบเห็น
 * หลักเดียวกับจุดบนปุ่มตัวกรองในหน้าสต็อก
 */
export function itemBadges(item: QcItem): string[] {
  const d = ITEM_SETTINGS_DEFAULT;
  const out: string[] = [];

  if (item.verdict !== d.verdict) {
    out.push(VERDICT_LABEL[item.verdict]);
  } else if (item.verdictWording !== d.verdictWording) {
    out.push(VERDICT_WORDING_LABEL[item.verdictWording]);
  }

  if (item.note !== d.note) out.push(NOTE_BADGE_LABEL[item.note]);
  if (item.repeatable) out.push(`บันทึกได้ ${item.maxRounds} ครั้ง`);

  if (item.withDate && item.withTime) out.push("มีวันที่และเวลาที่ตรวจ");
  else if (item.withDate) out.push("มีวันที่ตรวจ");
  else if (item.withTime) out.push("มีเวลาที่ตรวจ");

  return out;
}

export const isSettingsDefault = (s: ItemSettings) =>
  s.verdict === ITEM_SETTINGS_DEFAULT.verdict &&
  s.verdictWording === ITEM_SETTINGS_DEFAULT.verdictWording &&
  s.note === ITEM_SETTINGS_DEFAULT.note &&
  s.repeatable === ITEM_SETTINGS_DEFAULT.repeatable &&
  s.defaultRounds === ITEM_SETTINGS_DEFAULT.defaultRounds &&
  s.maxRounds === ITEM_SETTINGS_DEFAULT.maxRounds &&
  s.withDate === ITEM_SETTINGS_DEFAULT.withDate &&
  s.withTime === ITEM_SETTINGS_DEFAULT.withTime;

// ---------------------------------------------------------------
// เวอร์ชันที่ประกาศใช้อยู่แล้วของรหัสฟอร์มเดียวกัน
// ใช้ตรวจว่าช่วงวันที่ของเวอร์ชันใหม่ไปชนกับของเดิมหรือเปล่า
// ---------------------------------------------------------------

export type PublishedVersion = {
  revision: string;
  from: string;
  to: string | null;
  status: TemplateStatus;
};

export const PUBLISHED_VERSIONS: PublishedVersion[] = [
  { revision: "Rev.00", from: "2025-01-01", to: "2026-01-15", status: "inactive" },
  { revision: "Rev.01", from: "2026-01-16", to: null, status: "active" },
];

/**
 * หาเวอร์ชันที่ช่วงวันที่ทับกับช่วงที่กำลังตั้ง
 * to = null แปลว่าเปิดปลาย จึงถือว่าทับทุกอย่างที่อยู่หลัง from
 */
export function findOverlaps(
  from: string,
  to: string | null,
  versions: PublishedVersion[] = PUBLISHED_VERSIONS
): PublishedVersion[] {
  if (!from) return [];
  const start = Date.parse(from);
  const end = to ? Date.parse(to) : Number.POSITIVE_INFINITY;
  if (Number.isNaN(start)) return [];

  return versions.filter((v) => {
    const vStart = Date.parse(v.from);
    const vEnd = v.to ? Date.parse(v.to) : Number.POSITIVE_INFINITY;
    return start <= vEnd && vStart <= end;
  });
}

export const ROLE_OPTIONS = [
  { value: "qc-inspector", label: "QC Inspector", description: "ผู้ตรวจหน้างาน" },
  { value: "qc-supervisor", label: "QC Supervisor", description: "หัวหน้าฝ่าย QC" },
  { value: "prod-lead", label: "หัวหน้าฝ่ายผลิต", description: "ดูและอนุมัติได้" },
  { value: "plant-manager", label: "ผู้จัดการโรงงาน", description: "ดูได้ทุกฟอร์ม" },
  { value: "admin", label: "Admin", description: "ตั้งค่าระบบ" },
];

// ---------------------------------------------------------------
// เทมเพลตตั้งต้น — ถอดมาจาก FM-QC-02-03 ใบรายงานการตรวจสอบสินค้าสำเร็จรูป
// ---------------------------------------------------------------

const tick = (
  title: string,
  criteria: string,
  description = ""
): QcItem => ({
  id: uid("seed"),
  title,
  description,
  criteria,
  ...ITEM_SETTINGS_DEFAULT,
  maxRounds: 1,
  fields: [],
  children: [],
});

/** ช่องตัวเลขของเทมเพลตตั้งต้น — เขียนสั้น ๆ เพราะมีหลายช่องที่เกณฑ์เหมือนกัน */
const num = (
  id: string,
  label: string,
  unit: string,
  rule: Rule = emptyRule()
): QcField => ({ id, label, type: "number", unit, rule });

export const SEED_TEMPLATE: QcTemplate = {
  id: "tpl-fm-qc-02-03",
  name: "ใบรายงานการตรวจสอบสินค้าสำเร็จรูป",
  formCode: "FM-QC-02-03",
  revision: "Rev.02",
  status: "draft",
  effectiveFrom: "2026-09-01",
  effectiveTo: null,
  roles: ["qc-inspector", "qc-supervisor"],

  headerFields: [
    { id: "hf-a", label: "ชื่อปุ๋ย", kind: "ref", required: true, options: [], source: "สินค้า" },
    { id: "hf-b", label: "เครื่องจักร No.", kind: "ref", required: true, options: [], source: "เครื่องจักร" },
    { id: "hf-c", label: "เลขที่ใบสั่งผลิต", kind: "ref", required: true, options: [], source: "ใบสั่งผลิต" },
    { id: "hf-d", label: "วันที่ตรวจ", kind: "date", required: true, options: [] },
    {
      id: "hf-e",
      label: "สายการผลิต",
      kind: "select",
      required: false,
      options: ["Bulk Blend", "แบ่งบรรจุ", "ปั้นเม็ด"],
    },
  ],

  items: [
    {
      // ตัวอย่างข้อที่ต้องทำทั้งสองอย่าง: คีย์น้ำหนัก + ผู้ตรวจติ๊กยืนยันเอง
      id: "it-1",
      title: "น้ำหนักของปุ๋ย",
      description: "สุ่มกระสอบจากปลายสายพานหลังเย็บปิดปากแล้ว",
      criteria: "น้ำหนักต่อกระสอบ ≥ 50.2 kg (บรรจุ 50 kg)",
      verdict: "manual",
      verdictWording: "passFail",
      fields: [num("c-1", "น้ำหนักที่ชั่ง", "kg", { op: "gte", min: 50.2, max: null })],
      note: "onFail",
      repeatable: true,
      defaultRounds: 2,
      maxRounds: 3,
      withDate: false,
      withTime: true,
      children: [],
    },
    {
      // สามช่องที่มีเกณฑ์ของตัวเองแยกกัน แล้วให้ระบบตัดสินเอง
      id: "it-2",
      title: "สูตรปุ๋ย",
      description: "",
      criteria: "ตัวเลขธาตุอาหารที่วัดได้ต้องตรงกับสูตรที่รับรอง — 15-15-15",
      verdict: "auto",
      verdictWording: "passFail",
      fields: [
        num("c-2", "N", "%", { op: "between", min: 14.5, max: 15.5 }),
        num("c-3", "P₂O₅", "%", { op: "between", min: 14.5, max: 15.5 }),
        num("c-4", "K₂O", "%", { op: "between", min: 14.5, max: 15.5 }),
      ],
      note: "optional",
      repeatable: true,
      defaultRounds: 2,
      maxRounds: 3,
      withDate: false,
      withTime: true,
      children: [],
    },
    tick(
      "ตรวจการเย็บกระสอบ",
      "ระยะห่างฝีเข็มต้องสม่ำเสมอ ต้องเป็นด้ายคู่",
      "ดูทั้งแนวเย็บบนและล่าง"
    ),
    tick("กลิ่นของปุ๋ย", "ไม่มีกลิ่น หรือมีกลิ่นสารเคมีอ่อน ๆ"),
    tick("การตรวจสอบด้วยการสัมผัส", "สีของเม็ดปุ๋ยต้องไม่ติดมือ"),
    tick("กระสอบที่ใช้ตรงสูตรใหม่", "ปุ๋ยหน้ากระสอบต้องตรงกับเนื้อปุ๋ยข้างใน"),
    tick("สติ๊กเกอร์แลกแต้ม", "สติ๊กเกอร์ต้องมีทุกกระสอบ"),
    {
      // คีย์ตัวเลข + ติ๊กเอง โดยระบบขึ้นผลที่คำนวณได้ให้ดูเป็นตัวช่วย
      id: "it-8",
      title: "ความชื้น",
      description: "วัดด้วยเครื่องวัดความชื้นแบบเข็ม เสียบลึกกลางกระสอบ",
      criteria: "ความชื้นไม่เกิน 80%",
      verdict: "manual",
      verdictWording: "passFail",
      fields: [
        num("c-5", "ค่าความชื้น", "%", { op: "lte", min: null, max: 80 }),
        { id: "c-6", label: "จุดที่เก็บตัวอย่าง", type: "text", unit: "", rule: emptyRule() },
      ],
      note: "onFail",
      repeatable: true,
      defaultRounds: 2,
      // ตรวจข้ามวันได้ ความชื้นวัดซ้ำหลังกองทิ้งไว้ จึงต้องรู้ว่าครั้งไหนวันไหน
      maxRounds: 3,
      withDate: true,
      withTime: true,
      children: [],
    },
  ],

  // ฟอร์มกระดาษต้นแบบมีบรรทัดว่าง "อื่นๆ" ให้เขียนเพิ่มเองท้ายตาราง
  allowAdHocItems: true,

  failActions: [
    { id: "fa-1", label: "Repack" },
    { id: "fa-2", label: "รับสภาพ" },
    { id: "fa-3", label: "ส่งคืน" },
  ],
  requireFailAction: true,

  signature: { inspector: true, time: true, approver: false },
};

/**
 * จัดหัวข้อที่ติดกันและเป็นแบบ "ติ๊กอย่างเดียว" เหมือนกัน ให้อยู่ตารางเดียวกัน
 * ตรงกับฟอร์มกระดาษที่ข้อ 3–7 อยู่ในตารางเดียว
 * ข้อที่ต้องคีย์ค่าด้วยจะแยกออกมาเป็นตารางของตัวเองเสมอ
 */
export type PreviewBlock =
  | { kind: "single"; item: QcItem; index: number }
  | {
      kind: "group";
      items: { item: QcItem; index: number }[];
      wording: VerdictWording;
    };

export function buildPreviewBlocks(items: QcItem[]): PreviewBlock[] {
  const blocks: PreviewBlock[] = [];
  let run: { item: QcItem; index: number }[] = [];
  let runWording: VerdictWording | null = null;

  const flush = () => {
    if (run.length === 0) return;
    if (run.length === 1) {
      blocks.push({ kind: "single", item: run[0].item, index: run[0].index });
    } else {
      blocks.push({
        kind: "group",
        items: run,
        wording: runWording as VerdictWording,
      });
    }
    run = [];
    runWording = null;
  };

  items.forEach((item, i) => {
    const groupable =
      item.fields.length === 0 &&
      item.verdict === "manual" &&
      !item.repeatable &&
      item.children.length === 0;

    if (groupable && (runWording === null || runWording === item.verdictWording)) {
      runWording = item.verdictWording;
      run.push({ item, index: i });
      return;
    }
    flush();
    if (groupable) {
      runWording = item.verdictWording;
      run.push({ item, index: i });
    } else {
      blocks.push({ kind: "single", item, index: i });
    }
  });
  flush();
  return blocks;
}
