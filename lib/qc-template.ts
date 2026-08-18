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
// หัวข้อตรวจแยกเป็น 2 แกนอิสระ เพราะบางข้อต้องทำทั้งสองอย่าง
//   capture = ผู้ตรวจต้องคีย์ค่าอะไรลงไป
//   verdict = ตัดสินผ่าน/ไม่ผ่านด้วยวิธีไหน
// เช่น "น้ำหนักของปุ๋ย" ต้องคีย์ตัวเลข และให้ผู้ตรวจติ๊กยืนยันเองด้วย
// ---------------------------------------------------------------

/** ผู้ตรวจต้องคีย์ค่าอะไรลงไป */
export type CaptureMode = "none" | "number" | "text";

export const CAPTURE_LABEL: Record<CaptureMode, string> = {
  none: "ไม่ต้องคีย์ค่า",
  number: "คีย์ตัวเลข",
  text: "คีย์ข้อความ",
};

/** ตัดสินผ่าน/ไม่ผ่านด้วยวิธีไหน */
export type VerdictMode = "none" | "auto" | "manual";

export const VERDICT_LABEL: Record<VerdictMode, string> = {
  none: "ไม่ต้องตัดสิน",
  auto: "ระบบตัดสินจากเกณฑ์",
  manual: "ผู้ตรวจติ๊กเอง",
};

// ---------------------------------------------------------------
// พรีเซ็ต — รวมสองแกน (คีย์อะไร + ตัดสินยังไง) เป็นตัวเลือกเดียว
// คนตั้งค่าจริงคิดเป็น "ข้อนี้เป็นแบบไหน" ไม่ได้คิดแยกสองแกนอิสระ
// เลือกไม่ตรงพรีเซ็ตไหนเลยค่อยสลับไป "กำหนดเอง" แล้วเห็นตัวควบคุมดิบ
// ทั้งสองแกนเหมือนเดิม ไม่เสียความละเอียดของโมเดลเดิมไปแม้แต่น้อย
// ---------------------------------------------------------------

export type CapturePreset =
  | "tickOnly"
  | "numberAuto"
  | "numberManual"
  | "textOnly"
  | "custom";

export const CAPTURE_PRESET_LABEL: Record<
  Exclude<CapturePreset, "custom">,
  string
> = {
  tickOnly: "ติ๊กผ่าน/ไม่ผ่านอย่างเดียว",
  numberAuto: "กรอกตัวเลข — ระบบตัดสินเอง",
  numberManual: "กรอกตัวเลข — ผู้ตรวจติ๊กเอง",
  textOnly: "กรอกข้อความอย่างเดียว",
};

const CAPTURE_PRESET_VALUES: Record<
  Exclude<CapturePreset, "custom">,
  { capture: CaptureMode; verdict: VerdictMode }
> = {
  tickOnly: { capture: "none", verdict: "manual" },
  numberAuto: { capture: "number", verdict: "auto" },
  numberManual: { capture: "number", verdict: "manual" },
  textOnly: { capture: "text", verdict: "none" },
};

/** หาว่าหัวข้อนี้ตรงกับพรีเซ็ตไหน — ไม่ตรงเลยถือว่า "กำหนดเอง" */
export function matchCapturePreset(
  item: Pick<QcItem, "capture" | "verdict">
): CapturePreset {
  const found = (
    Object.keys(CAPTURE_PRESET_VALUES) as Exclude<CapturePreset, "custom">[]
  ).find((key) => {
    const v = CAPTURE_PRESET_VALUES[key];
    return v.capture === item.capture && v.verdict === item.verdict;
  });
  return found ?? "custom";
}

export function capturePresetValue(preset: Exclude<CapturePreset, "custom">) {
  return CAPTURE_PRESET_VALUES[preset];
}

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

/** ช่องตัวเลขหนึ่งช่องของหัวข้อแบบวัดค่า เช่น N (%) หรือ น้ำหนักที่ชั่ง (kg) */
export type MeasureColumn = {
  id: string;
  label: string;
  unit: string;
};

/** เกณฑ์ตัดสินผ่าน/ไม่ผ่านแบบอัตโนมัติ สำหรับหัวข้อที่คีย์ตัวเลข */
export type RuleOp = "none" | "gte" | "lte" | "between";

export const RULE_OP_LABEL: Record<RuleOp, string> = {
  none: "ไม่มีเกณฑ์ตัวเลข",
  gte: "ไม่น้อยกว่า (≥)",
  lte: "ไม่เกิน (≤)",
  between: "อยู่ระหว่าง",
};

export type Rule = {
  op: RuleOp;
  min: number | null;
  max: number | null;
};

export type QcItem = {
  id: string;
  title: string;
  criteria: string;
  capture: CaptureMode;
  verdict: VerdictMode;
  verdictWording: VerdictWording;
  /** ใช้เมื่อ capture = "number" */
  columns: MeasureColumn[];
  rule: Rule;
  /** เปิดให้บันทึกได้หลายครั้ง (ตรวจครั้งที่ 1, 2, 3 …) */
  repeatable: boolean;
  defaultRounds: number;
  maxRounds: number;
  withTime: boolean;
  withNote: boolean;
  /** หัวข้อย่อย — ใช้กับฟอร์มที่จัดเป็นกลุ่ม เช่น ใบตรวจก่อนผลิต */
  children: QcItem[];
};

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
    criteria: "",
    capture: "none",
    verdict: "manual",
    verdictWording: "passFail",
    columns: [],
    rule: emptyRule(),
    repeatable: false,
    defaultRounds: 1,
    maxRounds: 3,
    withTime: false,
    withNote: true,
    children: [],
  };
}

export function newColumn(): MeasureColumn {
  return { id: uid("col"), label: "", unit: "" };
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
    columns: item.columns.map((c) => ({ ...c, id: uid("col") })),
    rule: { ...item.rule },
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

/** มีเกณฑ์ตัวเลขให้ระบบคำนวณได้หรือเปล่า */
export function hasNumericRule(item: QcItem): boolean {
  return item.capture === "number" && item.rule.op !== "none";
}

/** ต้องโชว์ช่องติ๊กให้ผู้ตรวจเลือกเองหรือเปล่า */
export function showsTick(item: QcItem): boolean {
  return item.verdict === "manual";
}

/** โชว์คอลัมน์สถานะที่ระบบคำนวณให้หรือเปล่า */
export function showsAutoStatus(item: QcItem): boolean {
  return hasNumericRule(item) && item.verdict !== "none";
}

/** อธิบายเกณฑ์เป็นภาษาคน ใช้โชว์ในหน้าตัวอย่าง */
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

/** สรุปสั้น ๆ ว่าหัวข้อนี้ให้ทำอะไรบ้าง ใช้โชว์เป็น badge ในตัวสร้าง */
export function describeBehaviour(item: QcItem): string {
  const parts: string[] = [];
  if (item.capture === "number") parts.push("คีย์ตัวเลข");
  if (item.capture === "text") parts.push("คีย์ข้อความ");
  if (item.verdict === "auto") parts.push("ระบบตัดสิน");
  if (item.verdict === "manual") {
    parts.push(`ติ๊ก${VERDICT_WORDS[item.verdictWording][0]}/${VERDICT_WORDS[item.verdictWording][1]}`);
  }
  return parts.join(" + ") || "ยังไม่ได้ตั้งค่า";
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

const tick = (title: string, criteria: string): QcItem => ({
  id: uid("seed"),
  title,
  criteria,
  capture: "none",
  verdict: "manual",
  verdictWording: "passFail",
  columns: [],
  rule: emptyRule(),
  repeatable: false,
  defaultRounds: 1,
  maxRounds: 1,
  withTime: false,
  withNote: true,
  children: [],
});

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
      criteria: "น้ำหนักต่อกระสอบ ≥ 50.2 kg (บรรจุ 50 kg)",
      capture: "number",
      verdict: "manual",
      verdictWording: "passFail",
      columns: [{ id: "c-1", label: "น้ำหนักที่ชั่ง", unit: "kg" }],
      rule: { op: "gte", min: 50.2, max: null },
      repeatable: true,
      defaultRounds: 2,
      maxRounds: 3,
      withTime: true,
      withNote: true,
      children: [],
    },
    {
      // คีย์ตัวเลข 3 ช่อง แล้วให้ระบบตัดสินเองจากเกณฑ์
      id: "it-2",
      title: "สูตรปุ๋ย",
      criteria: "ตัวเลขธาตุอาหารที่วัดได้ต้องตรงกับสูตรที่รับรอง — 15-15-15",
      capture: "number",
      verdict: "auto",
      verdictWording: "passFail",
      columns: [
        { id: "c-2", label: "N", unit: "%" },
        { id: "c-3", label: "P₂O₅", unit: "%" },
        { id: "c-4", label: "K₂O", unit: "%" },
      ],
      rule: { op: "between", min: 14.5, max: 15.5 },
      repeatable: true,
      defaultRounds: 2,
      maxRounds: 3,
      withTime: true,
      withNote: true,
      children: [],
    },
    tick("ตรวจการเย็บกระสอบ", "ระยะห่างฝีเข็มต้องสม่ำเสมอ ต้องเป็นด้ายคู่"),
    tick("กลิ่นของปุ๋ย", "ไม่มีกลิ่น หรือมีกลิ่นสารเคมีอ่อน ๆ"),
    tick("การตรวจสอบด้วยการสัมผัส", "สีของเม็ดปุ๋ยต้องไม่ติดมือ"),
    tick("กระสอบที่ใช้ตรงสูตรใหม่", "ปุ๋ยหน้ากระสอบต้องตรงกับเนื้อปุ๋ยข้างใน"),
    tick("สติ๊กเกอร์แลกแต้ม", "สติ๊กเกอร์ต้องมีทุกกระสอบ"),
    {
      // คีย์ตัวเลข + ติ๊กเอง โดยระบบขึ้นผลที่คำนวณได้ให้ดูเป็นตัวช่วย
      id: "it-8",
      title: "ความชื้น",
      criteria: "ความชื้นไม่เกิน 80%",
      capture: "number",
      verdict: "manual",
      verdictWording: "passFail",
      columns: [{ id: "c-5", label: "ค่าความชื้น", unit: "%" }],
      rule: { op: "lte", min: null, max: 80 },
      repeatable: true,
      defaultRounds: 2,
      maxRounds: 3,
      withTime: true,
      withNote: true,
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
      item.capture === "none" &&
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
