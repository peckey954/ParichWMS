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

/** วิธีบันทึกผลของหัวข้อตรวจ */
export type RecordMode = "measure" | "passfail" | "normalAbnormal" | "text";

export const RECORD_MODE_LABEL: Record<RecordMode, string> = {
  measure: "วัดค่าเป็นตัวเลข",
  passfail: "ผ่าน / ไม่ผ่าน",
  normalAbnormal: "ปกติ / ผิดปกติ",
  text: "กรอกข้อความ",
};

/** ช่องตัวเลขหนึ่งช่องของหัวข้อแบบวัดค่า เช่น N (%) หรือ น้ำหนักที่ชั่ง (kg) */
export type MeasureColumn = {
  id: string;
  label: string;
  unit: string;
};

/** เกณฑ์ตัดสินผ่าน/ไม่ผ่านแบบอัตโนมัติ สำหรับหัวข้อที่วัดค่า */
export type RuleOp = "none" | "gte" | "lte" | "between";

export const RULE_OP_LABEL: Record<RuleOp, string> = {
  none: "ไม่ตัดสินอัตโนมัติ",
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
  mode: RecordMode;
  /** ใช้เมื่อ mode = "measure" */
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
    mode: "passfail",
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

export function newHeaderField(): HeaderField {
  return {
    id: uid("hf"),
    label: "",
    kind: "text",
    required: false,
    options: [],
  };
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
      id: "it-1",
      title: "น้ำหนักของปุ๋ย",
      criteria: "น้ำหนักต่อกระสอบ ≥ 50.2 kg (บรรจุ 50 kg)",
      mode: "measure",
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
      id: "it-2",
      title: "สูตรปุ๋ย",
      criteria: "ตัวเลขธาตุอาหารที่วัดได้ต้องตรงกับสูตรที่รับรอง — 15-15-15",
      mode: "measure",
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
    {
      id: "it-3",
      title: "ตรวจการเย็บกระสอบ",
      criteria: "ระยะห่างฝีเข็มต้องสม่ำเสมอ ต้องเป็นด้ายคู่",
      mode: "passfail",
      columns: [],
      rule: emptyRule(),
      repeatable: false,
      defaultRounds: 1,
      maxRounds: 1,
      withTime: false,
      withNote: true,
      children: [],
    },
    {
      id: "it-4",
      title: "กลิ่นของปุ๋ย",
      criteria: "ไม่มีกลิ่น หรือมีกลิ่นสารเคมีอ่อน ๆ",
      mode: "passfail",
      columns: [],
      rule: emptyRule(),
      repeatable: false,
      defaultRounds: 1,
      maxRounds: 1,
      withTime: false,
      withNote: true,
      children: [],
    },
    {
      id: "it-5",
      title: "การตรวจสอบด้วยการสัมผัส",
      criteria: "สีของเม็ดปุ๋ยต้องไม่ติดมือ",
      mode: "passfail",
      columns: [],
      rule: emptyRule(),
      repeatable: false,
      defaultRounds: 1,
      maxRounds: 1,
      withTime: false,
      withNote: true,
      children: [],
    },
    {
      id: "it-6",
      title: "กระสอบที่ใช้ตรงสูตรใหม่",
      criteria: "ปุ๋ยหน้ากระสอบต้องตรงกับเนื้อปุ๋ยข้างใน",
      mode: "passfail",
      columns: [],
      rule: emptyRule(),
      repeatable: false,
      defaultRounds: 1,
      maxRounds: 1,
      withTime: false,
      withNote: true,
      children: [],
    },
    {
      id: "it-7",
      title: "สติ๊กเกอร์แลกแต้ม",
      criteria: "สติ๊กเกอร์ต้องมีทุกกระสอบ",
      mode: "passfail",
      columns: [],
      rule: emptyRule(),
      repeatable: false,
      defaultRounds: 1,
      maxRounds: 1,
      withTime: false,
      withNote: true,
      children: [],
    },
    {
      id: "it-8",
      title: "ความชื้น",
      criteria: "ความชื้นไม่เกิน 80%",
      mode: "measure",
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

  failActions: [
    { id: "fa-1", label: "Repack" },
    { id: "fa-2", label: "รับสภาพ" },
    { id: "fa-3", label: "ส่งคืน" },
  ],
  requireFailAction: true,

  signature: { inspector: true, time: true, approver: false },
};

/**
 * จัดหัวข้อที่ติดกันและใช้วิธีบันทึกแบบติ๊กเหมือนกัน ให้อยู่ตารางเดียวกัน
 * ตรงกับฟอร์มกระดาษที่ข้อ 3–7 อยู่ในตารางเดียว
 */
export type PreviewBlock =
  | { kind: "single"; item: QcItem; index: number }
  | { kind: "group"; items: { item: QcItem; index: number }[]; mode: RecordMode };

export function buildPreviewBlocks(items: QcItem[]): PreviewBlock[] {
  const blocks: PreviewBlock[] = [];
  let run: { item: QcItem; index: number }[] = [];
  let runMode: RecordMode | null = null;

  const flush = () => {
    if (run.length === 0) return;
    if (run.length === 1) {
      blocks.push({ kind: "single", item: run[0].item, index: run[0].index });
    } else {
      blocks.push({ kind: "group", items: run, mode: runMode as RecordMode });
    }
    run = [];
    runMode = null;
  };

  items.forEach((item, i) => {
    const tickable = item.mode === "passfail" || item.mode === "normalAbnormal";
    const groupable = tickable && !item.repeatable && item.children.length === 0;

    if (groupable && (runMode === null || runMode === item.mode)) {
      runMode = item.mode;
      run.push({ item, index: i });
      return;
    }
    flush();
    if (groupable) {
      runMode = item.mode;
      run.push({ item, index: i });
    } else {
      blocks.push({ kind: "single", item, index: i });
    }
  });
  flush();
  return blocks;
}
