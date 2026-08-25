// ============================================================
// โครงข้อมูลของเทมเพลต QC
// ฟอร์ม QC ในโรงงานมีหลายแบบและเปลี่ยนบ่อย จึงเก็บ "โครงฟอร์ม" เป็นข้อมูล
// แล้วให้หน้าตรวจจริง render จากโครงนี้ ไม่ต้องแก้โค้ดทุกครั้งที่ฟอร์มเปลี่ยน
// ============================================================

// ใบตรวจวัตถุดิบในถัง (ท้ายไฟล์) ดึงรายการวัตถุดิบ/กะจริงจาก qc-check.ts มาตั้งเป็น
// เทมเพลตแทนการพิมพ์ซ้ำเอง — พิมพ์ซ้ำแล้วสองที่จะไม่ตรงกันเมื่อมีคนแก้แค่ที่เดียว
import { MATERIALS, SHIFTS } from "@/lib/qc-check";

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

export type FieldType = "text" | "number" | "choice" | "ref";

export const FIELD_TYPE_LABEL: Record<FieldType, string> = {
  text: "ข้อความ",
  number: "ตัวเลข",
  choice: "ตัวเลือก",
  ref: "ดึงจากระบบ",
};

export const FIELD_TYPE_HINT: Record<FieldType, string> = {
  text: "พิมพ์อะไรก็ได้",
  number: "คีย์ตัวเลข ตั้งหน่วยและเกณฑ์ได้",
  choice: "เลือกจากคำที่ตั้งไว้ เช่น 30 / 35 / 40 หรือ วัตถุดิบ / ผลิตภัณฑ์ / อื่นๆ",
  ref: "เลือกจากข้อมูลที่มีอยู่ในระบบ เช่น สูตร เครื่องจักร ผู้ขาย",
};

/** ตารางในระบบที่ช่องแบบ "ดึงจากระบบ" ชี้ไปได้ */
export const REF_SOURCES = [
  "สูตร",
  "สินค้า",
  "วัตถุดิบ",
  "เครื่องจักร",
  "คลังสินค้า",
  "ผู้ขาย",
  "ใบสั่งผลิต",
  "ใบส่งของ",
];

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
  /** ใช้กับ type = "choice" — คำที่ผู้ตรวจเลือกได้ ไม่มีให้พิมพ์เอง */
  options: string[];
  /** ใช้กับ type = "ref" — ชี้ว่าดึงมาจากตารางไหนในระบบ */
  source: string;
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

// ---------------------------------------------------------------
// หัวข้อตรวจมีสองแบบ
//
// "check" คือข้อตรวจปกติ — รู้ล่วงหน้าว่าต้องตรวจอะไร ตอนตรวจแค่ตอบ
//
// "rows" คือตารางที่จำนวนแถวรู้ไม่ได้ตอนตั้งฟอร์ม เพราะแต่ละแถวคือของคนละชิ้น
// เช่นสุ่มตรวจสูตร วันนี้สุ่มสามสูตร พรุ่งนี้สุ่มห้าสูตร หรือทะเบียนรับเอกสาร COA
// ที่วันหนึ่งรับกี่ใบก็ได้ ผู้ตรวจกดเพิ่มแถวเองตอนตรวจ ช่องที่ตั้งไว้กลายเป็นคอลัมน์
//
// ต่างจาก repeatable ที่เป็น "ของชิ้นเดิม ตรวจซ้ำหลายครั้ง" — ตรงนั้นรู้จำนวนครั้ง
// ล่วงหน้าและทุกครั้งพูดถึงของชิ้นเดียวกัน ส่วน rows คือคนละชิ้นกันทุกแถว
// ---------------------------------------------------------------

export type ItemKind = "check" | "rows";

export const ITEM_KIND_LABEL: Record<ItemKind, string> = {
  check: "หัวข้อตรวจ",
  rows: "ตารางเพิ่มแถวเองได้",
};

export const ITEM_KIND_HINT: Record<ItemKind, string> = {
  check: "รู้ล่วงหน้าว่าต้องตรวจอะไร ผู้ตรวจแค่ตอบ",
  rows: "จำนวนแถวรู้ไม่ได้ตอนตั้งฟอร์ม ผู้ตรวจกดเพิ่มแถวเองตอนตรวจ ช่องที่ตั้งไว้คือคอลัมน์",
};

export type QcItem = {
  id: string;
  kind: ItemKind;
  title: string;
  /** ข้อความย่อยใต้ชื่อหัวข้อ — ว่าง = ไม่มีบรรทัดนี้ในใบตรวจ */
  description: string;
  criteria: string;
  verdict: VerdictMode;
  verdictWording: VerdictWording;
  /** ช่องที่ผู้ตรวจต้องกรอก — ไม่มีเลยคือหัวข้อแบบติ๊กอย่างเดียว */
  fields: QcField[];
  note: NoteMode;
  /**
   * ต้องมีคำตอบทุกใบไหม
   * ปิดไว้สำหรับข้อที่ไม่ได้ตรวจทุกครั้ง เช่นสุ่มตรวจ หรือข้อที่ใช้กับบางสูตรเท่านั้น
   * ข้อที่ข้ามได้จะมีตัวเลือก "ไม่ได้ตรวจ" เพิ่มมา และไม่นับว่าใบไม่ครบ
   */
  required: boolean;
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
 * ส่วนที่กล่อง "การแสดงข้อมูล" เป็นเจ้าของ
 *
 * แยกเป็นชนิดของตัวเอง เพราะเป็นก้อนที่ยกไปใช้กับหัวข้ออื่นทั้งก้อนได้
 * ชื่อหัวข้อ เกณฑ์ ช่องกรอก และหัวข้อย่อย ไม่อยู่ในนี้ — พวกนั้นเป็นของเฉพาะข้อ
 */
export type ItemSettings = Pick<
  QcItem,
  | "verdict"
  | "verdictWording"
  | "note"
  | "required"
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
  required: true,
  repeatable: false,
  // ค่าเริ่มต้นคือ "ครั้งเดียว" (1/1) — ไม่มีสวิตช์ครั้งเดียว/หลายครั้งแยกอีกแล้ว
  // ตัวเลขขั้นต่ำ-สูงสุดเป็น 1/1 ก็คือครั้งเดียวอยู่ในตัว ไม่ต้องมีอะไรมาบอกซ้ำ
  defaultRounds: 1,
  maxRounds: 1,
  withDate: false,
  withTime: false,
};

export const pickSettings = (item: QcItem): ItemSettings => ({
  verdict: item.verdict,
  verdictWording: item.verdictWording,
  note: item.note,
  required: item.required,
  repeatable: item.repeatable,
  defaultRounds: item.defaultRounds,
  maxRounds: item.maxRounds,
  withDate: item.withDate,
  withTime: item.withTime,
});

export type FailAction = { id: string; label: string };

export type TemplateStatus = "draft" | "active" | "inactive";

export const STATUS_LABEL: Record<TemplateStatus, string> = {
  active: "เปิดใช้งาน",
  draft: "ฉบับร่าง",
  inactive: "ปิดใช้งาน",
};

export const STATUS_TONE: Record<TemplateStatus, "success" | "neutral"> = {
  active: "success",
  draft: "neutral",
  inactive: "neutral",
};

// ---------------------------------------------------------------
// รอบการตรวจ — ตัวที่ตัดสินว่าฟอร์มนี้ดูเป็นปฏิทินได้หรือไม่ได้
//
// ไม่มีติ๊ก "โชว์ปฏิทิน" เพราะปฏิทินไม่ใช่ทางเลือกในการแสดงผล แต่เป็นผลของรอบ
// ฟอร์มที่เปิดใบตามเหตุ (มีของเข้า มีใบสั่งผลิต) ไม่มีจำนวนใบที่ควรมีต่อวัน
// ช่องว่างในปฏิทินจึงแปลอะไรไม่ได้ — วันที่ไม่มีใบอาจแปลว่าวันนั้นไม่มีของเข้าก็ได้
//
// ฟอร์มที่ทำตามรอบเวลาต่างออกไป ทุกวันต้องมีครบทุกช่วงเวลา ช่องว่างจึงแปลว่า
// "ยังไม่มีใครทำ" ซึ่งเป็นข้อมูล ปฏิทินกับตารางทั้งเดือนจึงมีความหมายเฉพาะแบบนี้
// ติ๊กเปิดปฏิทินให้ฟอร์มตามเหตุได้ ก็จะได้ปฏิทินที่โกหก
// ---------------------------------------------------------------

export type ScheduleMode = "perEvent" | "recurring";

export const SCHEDULE_MODE_LABEL: Record<ScheduleMode, string> = {
  perEvent: "เปิดใบตามเหตุ",
  recurring: "ตรวจตามรอบเวลา",
};

export const SCHEDULE_MODE_HINT: Record<ScheduleMode, string> = {
  perEvent:
    "เปิดใบเมื่อมีเรื่องให้ตรวจ เช่นของเข้า หรือมีใบสั่งผลิต จำนวนใบต่อวันไม่แน่นอน",
  recurring:
    "ต้องตรวจทุกวันตามช่วงเวลาที่ตั้งไว้ วันไหนไม่มีใบแปลว่ายังไม่มีใครทำ จึงดูเป็นปฏิทินและตารางทั้งเดือนได้",
};

/** ช่วงเวลาหนึ่งรอบในหนึ่งวัน — เรียกด้วยเวลา ไม่ต้องตั้งชื่อกะให้จำเพิ่ม */
export type TimeSlot = {
  id: string;
  from: string;
  to: string;
};

export const slotLabel = (s: TimeSlot) => `${s.from}–${s.to}`;

/** ช่วงเวลาที่คร่อมเที่ยงคืน ใบเป็นของวันที่ช่วงเวลานั้นเริ่ม */
export const slotOvernight = (s: TimeSlot) => s.to <= s.from;

export type SkipDays = "none" | "weekend";

export const SKIP_DAYS_LABEL: Record<SkipDays, string> = {
  none: "ทุกวัน",
  weekend: "เว้นเสาร์–อาทิตย์",
};

export type Schedule = {
  mode: ScheduleMode;
  /** ใช้เมื่อ mode = "recurring" — หนึ่งช่วงเวลาคือหนึ่งใบต่อวัน */
  slots: TimeSlot[];
  skipDays: SkipDays;
};

export const newSlot = (from = "08:00", to = "12:00"): TimeSlot => ({
  id: uid("slot"),
  from,
  to,
});

export const DEFAULT_SCHEDULE: Schedule = {
  mode: "perEvent",
  slots: [],
  skipDays: "none",
};

/** ฟอร์มนี้ดูเป็นปฏิทิน/ตารางทั้งเดือนได้ไหม — อ่านจากรอบ ไม่ใช่ติ๊กแยก */
export const showsCalendar = (tpl: QcTemplate) =>
  tpl.schedule.mode === "recurring" && tpl.schedule.slots.length > 0;

export function describeSchedule(tpl: QcTemplate): string {
  const { mode, slots, skipDays } = tpl.schedule;
  if (mode === "perEvent") return SCHEDULE_MODE_LABEL.perEvent;
  if (slots.length === 0) return "ตามรอบเวลา — ยังไม่ได้ตั้งช่วงเวลา";
  return `วันละ ${slots.length} ช่วงเวลา · ${SKIP_DAYS_LABEL[skipDays]}`;
}

// ---------------------------------------------------------------
// "ฟอร์มนี้เป็นแบบไหน" — อ่านออกมาจากที่ตั้งไว้ ไม่ได้เก็บเป็นค่าแยก
//
// ถ้าเก็บเป็นฟิลด์ให้เลือกเอง มันจะโกหกได้ทันทีที่คนแก้โครงฟอร์มแล้วลืมแก้ป้าย
// อ่านจากโครงจริงแทน ป้ายจึงตรงกับฟอร์มเสมอโดยไม่ต้องมีใครมาดูแล
// ---------------------------------------------------------------

export type ShapeId =
  | "recurring"
  | "rows"
  | "rounds"
  | "grouped"
  | "measured"
  | "choice"
  | "tickOnly"
  | "adHoc"
  | "optional";

export const SHAPE_LABEL: Record<ShapeId, string> = {
  recurring: "ตามรอบเวลา",
  rows: "เพิ่มแถวเองได้",
  rounds: "ตรวจหลายครั้ง",
  grouped: "แบ่งเป็นกลุ่ม",
  measured: "คีย์ค่าวัด",
  choice: "มีช่องตัวเลือก",
  tickOnly: "ติ๊กอย่างเดียว",
  adHoc: "เพิ่มหัวข้อเองได้",
  optional: "มีข้อที่ข้ามได้",
};

export const SHAPE_HINT: Record<ShapeId, string> = {
  recurring: "ทำทุกวันตามช่วงเวลา ดูเป็นปฏิทินและตารางทั้งเดือนได้",
  rows: "มีตารางที่ผู้ตรวจกดเพิ่มแถวเองตอนตรวจ",
  rounds: "ข้อเดียวบันทึกได้หลายครั้งในใบเดียว",
  grouped: "หัวข้อหลักมีหัวข้อย่อยอยู่ข้างใน",
  measured: "มีช่องตัวเลขที่ตั้งเกณฑ์ผ่าน/ไม่ผ่านไว้",
  choice: "มีช่องที่เลือกจากคำที่ตั้งไว้ หรือดึงจากข้อมูลในระบบ",
  tickOnly: "ทุกข้อติ๊กผลอย่างเดียว ไม่มีช่องให้คีย์",
  adHoc: "ผู้ตรวจพิมพ์หัวข้อเพิ่มเองได้ระหว่างตรวจ",
  optional: "มีข้อที่ไม่ต้องตอบทุกใบ",
};

const walkItems = (items: QcItem[]): QcItem[] =>
  items.flatMap((it) => [it, ...walkItems(it.children)]);

/** ป้ายบอกรูปแบบของฟอร์ม เรียงตามลำดับใน SHAPE_LABEL */
export function templateShapes(tpl: QcTemplate): ShapeId[] {
  const all = walkItems(tpl.items);
  const out: ShapeId[] = [];

  if (showsCalendar(tpl)) out.push("recurring");
  if (tpl.items.some((it) => it.kind === "rows")) out.push("rows");
  if (all.some((it) => it.kind === "check" && it.repeatable)) out.push("rounds");
  if (tpl.items.some((it) => it.children.length > 0)) out.push("grouped");
  if (all.some(hasNumericRule)) out.push("measured");
  if (all.some((it) => it.fields.some((f) => f.type === "choice" || f.type === "ref")))
    out.push("choice");
  // "ติ๊กอย่างเดียว" เป็นคำอธิบายทั้งฟอร์ม ไม่ใช่ของบางข้อ จึงต้องจริงทุกข้อ
  if (all.length > 0 && all.every((it) => it.fields.length === 0 && it.kind === "check"))
    out.push("tickOnly");
  if (tpl.allowAdHocItems) out.push("adHoc");
  if (all.some((it) => !it.required)) out.push("optional");

  return out;
}

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
  /** ฟอร์มนี้เปิดใบเมื่อไหร่ — ตัวเดียวกับที่ตัดสินว่ามีปฏิทินให้ดูไหม */
  schedule: Schedule;
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

export function newItem(kind: ItemKind = "check"): QcItem {
  return {
    id: uid("item"),
    kind,
    title: "",
    description: "",
    criteria: "",
    ...ITEM_SETTINGS_DEFAULT,
    // ตารางเปิดมาให้แถวเดียวแล้วให้กดเพิ่มเอง ตั้งแถวว่างไว้เยอะกว่านั้น
    // คือเดาแทนผู้ตรวจว่าวันนี้จะมีกี่รายการ ซึ่งเดาไม่ได้อยู่แล้ว
    ...(kind === "rows" ? { defaultRounds: 1, maxRounds: 20 } : null),
    fields: [],
    children: [],
  };
}

export function newField(type: FieldType = "number"): QcField {
  return {
    id: uid("fld"),
    label: "",
    type,
    unit: "",
    rule: emptyRule(),
    options: [],
    source: "",
  };
}

/** ช่องที่ผู้ตรวจเลือกจากคำที่ตั้งไว้ — คำแรกไม่ได้แปลว่าค่าเริ่มต้น แค่เรียงก่อน */
export const newChoiceField = (label: string, options: string[]): QcField => ({
  ...newField("choice"),
  label,
  options,
});

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
      options: [...f.options],
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
  if (!item.required) out.push("ข้ามได้");
  if (item.kind === "rows") out.push(`เพิ่มแถวได้ถึง ${item.maxRounds} แถว`);
  else if (item.repeatable) out.push(`บันทึกได้ ${item.maxRounds} ครั้ง`);

  if (item.withDate && item.withTime) out.push("มีวันที่และเวลาที่ตรวจ");
  else if (item.withDate) out.push("มีวันที่ตรวจ");
  else if (item.withTime) out.push("มีเวลาที่ตรวจ");

  return out;
}

export const isSettingsDefault = (s: ItemSettings) =>
  s.verdict === ITEM_SETTINGS_DEFAULT.verdict &&
  s.verdictWording === ITEM_SETTINGS_DEFAULT.verdictWording &&
  s.note === ITEM_SETTINGS_DEFAULT.note &&
  s.required === ITEM_SETTINGS_DEFAULT.required &&
  s.repeatable === ITEM_SETTINGS_DEFAULT.repeatable &&
  s.defaultRounds === ITEM_SETTINGS_DEFAULT.defaultRounds &&
  s.maxRounds === ITEM_SETTINGS_DEFAULT.maxRounds &&
  s.withDate === ITEM_SETTINGS_DEFAULT.withDate &&
  s.withTime === ITEM_SETTINGS_DEFAULT.withTime;

// ---------------------------------------------------------------
// เทมเพลตหนึ่งรหัสฟอร์ม มีได้หลายเวอร์ชันตามเวลา
//
// รหัสฟอร์ม (formCode) คือตัวที่คงที่ — "เทมเพลต" ในหน้าตารางรวมคือรหัสฟอร์มนี้
// ส่วนแต่ละเวอร์ชัน (QcTemplate หนึ่งก้อน) คือภาพนิ่งของโครงฟอร์ม ณ ช่วงเวลาหนึ่ง
// versions เรียงใหม่สุดไปเก่าสุดเสมอ — ตัวบนสุดคือฉบับร่างที่กำลังแก้ (ถ้ามี)
// หรือเวอร์ชันล่าสุดที่เผยแพร่แล้ว (ถ้าไม่มีฉบับร่างค้างอยู่)
// ---------------------------------------------------------------

export type QcTemplateFamily = {
  /** คงที่ตลอดอายุของรหัสฟอร์ม ไม่เปลี่ยนตามเวอร์ชัน */
  id: string;
  formCode: string;
  versions: QcTemplate[];
};

export const activeVersion = (family: QcTemplateFamily) =>
  family.versions.find((v) => v.status === "active");

export const draftVersion = (family: QcTemplateFamily) =>
  family.versions.find((v) => v.status === "draft");

/** เวอร์ชันที่ควรใช้เป็นตัวแทนฟอร์มทั้งอันในหน้าตารางรวม */
export function representativeVersion(family: QcTemplateFamily): QcTemplate {
  return activeVersion(family) ?? draftVersion(family) ?? family.versions[0];
}

/** "Rev.01" -> "Rev.02" — ตัวเลขท้ายชื่อขยับขึ้นหนึ่ง คงจำนวนหลักเดิม */
export function nextRevisionLabel(revision: string): string {
  const m = revision.match(/^(.*?)(\d+)$/);
  if (!m) return `${revision} (ร่างใหม่)`;
  const [, prefix, digits] = m;
  const next = String(Number(digits) + 1).padStart(digits.length, "0");
  return `${prefix}${next}`;
}

/** วันก่อนหน้าวันที่ระบุ — ใช้ปิดช่วงเวอร์ชันเดิมตอนเวอร์ชันใหม่เริ่มใช้ */
export function dayBeforeISO(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

/**
 * หาเวอร์ชันที่ช่วงวันที่ทับกับช่วงที่กำลังตั้ง
 * to = null แปลว่าเปิดปลาย จึงถือว่าทับทุกอย่างที่อยู่หลัง from
 */
export function findOverlaps(
  from: string,
  to: string | null,
  versions: QcTemplate[]
): QcTemplate[] {
  if (!from) return [];
  const start = Date.parse(from);
  const end = to ? Date.parse(to) : Number.POSITIVE_INFINITY;
  if (Number.isNaN(start)) return [];

  return versions.filter((v) => {
    const vStart = Date.parse(v.effectiveFrom);
    const vEnd = v.effectiveTo ? Date.parse(v.effectiveTo) : Number.POSITIVE_INFINITY;
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
// เทมเพลตตัวอย่าง — ถอดมาจากฟอร์มกระดาษจริงของโรงงาน
// เก็บเป็นหลายเวอร์ชันย้อนหลังต่อรหัสฟอร์ม เพื่อให้หน้าตั้งค่าโชว์ประวัติ
// และย้อนกลับไปใช้เวอร์ชันเก่าได้จริง (ไม่ใช่แค่โชว์ตารางเปล่า ๆ)
// ---------------------------------------------------------------

const tick = (
  title: string,
  criteria: string,
  description = ""
): QcItem => ({
  id: uid("seed"),
  kind: "check",
  title,
  description,
  criteria,
  ...ITEM_SETTINGS_DEFAULT,
  maxRounds: 1,
  fields: [],
  children: [],
});

/** ข้อติ๊กแบบ ปกติ/ผิดปกติ — ฟอร์มตรวจสภาพใช้คำคู่นี้ ไม่ใช่ผ่าน/ไม่ผ่าน */
const normalTick = (
  title: string,
  criteria = "",
  description = ""
): QcItem => ({
  ...tick(title, criteria, description),
  verdictWording: "normalAbnormal",
  note: "onFail",
});

/** ช่องตัวเลขของเทมเพลตตั้งต้น — เขียนสั้น ๆ เพราะมีหลายช่องที่เกณฑ์เหมือนกัน */
const num = (
  id: string,
  label: string,
  unit: string,
  rule: Rule = emptyRule()
): QcField => ({
  id,
  label,
  type: "number",
  unit,
  rule,
  options: [],
  source: "",
});

/** ช่องที่เลือกจากคำที่ตั้งไว้ — เช่นสลิง 30/35/40 หรือประเภทสินค้า 1/2/3 */
const choice = (id: string, label: string, options: string[]): QcField => ({
  id,
  label,
  type: "choice",
  unit: "",
  rule: emptyRule(),
  options,
  source: "",
});

/** ช่องที่ดึงรายการจากตารางในระบบ — คนตรวจเลือก ไม่ต้องพิมพ์เอง */
const ref = (id: string, label: string, source: string): QcField => ({
  id,
  label,
  type: "ref",
  unit: "",
  rule: emptyRule(),
  options: [],
  source,
});

const text = (id: string, label: string): QcField => ({
  id,
  label,
  type: "text",
  unit: "",
  rule: emptyRule(),
  options: [],
  source: "",
});

const hf = (
  id: string,
  label: string,
  kind: FieldKind,
  required = true,
  extra: Partial<HeaderField> = {}
): HeaderField => ({ id, label, kind, required, options: [], ...extra });

/** ฟอร์มที่เปิดใบตามเหตุ ไม่มีปฏิทิน — ส่วนใหญ่ของระบบเป็นแบบนี้ */
const perEvent: Schedule = { mode: "perEvent", slots: [], skipDays: "none" };

// =================================================================
// FM-QC-02-03 ใบรายงานการตรวจสอบสินค้าสำเร็จรูป
// ตัวอย่างของ "ตรวจซ้ำหลายครั้งในใบเดียว" + "คีย์ค่าวัดแล้วให้ระบบตัดสิน"
// สามเวอร์ชัน: Rev.00 (เลิกใช้) -> Rev.01 (ใช้อยู่) -> Rev.02 (ฉบับร่าง)
// =================================================================

/** ทุกหัวข้อตรวจที่เคยมีของฟอร์มนี้ — แต่ละเวอร์ชันเลือกไปใช้บางส่วน */
const fmQc0203Items: QcItem[] = [
  {
    // ตัวอย่างข้อที่ต้องทำทั้งสองอย่าง: คีย์น้ำหนัก + ผู้ตรวจติ๊กยืนยันเอง
    id: "it-1",
    kind: "check",
    title: "น้ำหนักของปุ๋ย",
    description: "สุ่มกระสอบจากปลายสายพานหลังเย็บปิดปากแล้ว",
    criteria: "น้ำหนักต่อกระสอบ ≥ 50.2 kg (บรรจุ 50 kg)",
    verdict: "manual",
    verdictWording: "passFail",
    fields: [num("c-1", "น้ำหนักที่ชั่ง", "kg", { op: "gte", min: 50.2, max: null })],
    note: "onFail",
    required: true,
    repeatable: true,
    defaultRounds: 2,
    maxRounds: 3,
    withDate: false,
    withTime: true,
    children: [],
  },
  {
    // เพิ่มเข้ามาใน Rev.01 — สามช่องที่มีเกณฑ์ของตัวเองแยกกัน แล้วให้ระบบตัดสินเอง
    id: "it-2",
    kind: "check",
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
    required: true,
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
  {
    // สติ๊กเกอร์แลกแต้มมีเฉพาะบางสูตร ข้อนี้จึงข้ามได้ ไม่ใช่บังคับทุกใบ
    ...tick("สติ๊กเกอร์แลกแต้ม", "สติ๊กเกอร์ต้องมีทุกกระสอบ"),
    id: "it-7",
    required: false,
  },
  {
    // เพิ่มเข้ามาใน Rev.02 (ฉบับร่าง) — คีย์ตัวเลข + ติ๊กเอง โดยระบบขึ้นผลที่คำนวณได้ให้ดูเป็นตัวช่วย
    id: "it-8",
    kind: "check",
    title: "ความชื้น",
    description: "วัดด้วยเครื่องวัดความชื้นแบบเข็ม เสียบลึกกลางกระสอบ",
    criteria: "ความชื้นไม่เกิน 80%",
    verdict: "manual",
    verdictWording: "passFail",
    fields: [
      num("c-5", "ค่าความชื้น", "%", { op: "lte", min: null, max: 80 }),
      text("c-6", "จุดที่เก็บตัวอย่าง"),
    ],
    note: "onFail",
    required: true,
    repeatable: true,
    defaultRounds: 2,
    // ตรวจข้ามวันได้ ความชื้นวัดซ้ำหลังกองทิ้งไว้ จึงต้องรู้ว่าครั้งไหนวันไหน
    maxRounds: 3,
    withDate: true,
    withTime: true,
    children: [],
  },
];

/** ส่วนที่ทุกเวอร์ชันของฟอร์มนี้ใช้ร่วมกัน — ต่างกันแค่ id/revision/สถานะ/ช่วงวันที่/หัวข้อ */
const fmQc0203Base = {
  name: "ใบรายงานการตรวจสอบสินค้าสำเร็จรูป",
  formCode: "FM-QC-02-03",
  roles: ["qc-inspector", "qc-supervisor"],
  schedule: perEvent,
  headerFields: [
    hf("hf-a", "ชื่อปุ๋ย", "ref", true, { source: "สินค้า" }),
    hf("hf-b", "เครื่องจักร No.", "ref", true, { source: "เครื่องจักร" }),
    hf("hf-c", "เลขที่ใบสั่งผลิต", "ref", true, { source: "ใบสั่งผลิต" }),
    hf("hf-d", "วันที่ตรวจ", "date"),
    hf("hf-e", "สายการผลิต", "select", false, {
      options: ["Bulk Blend", "แบ่งบรรจุ", "ปั้นเม็ด"],
    }),
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

const fmQc0203Rev00: QcTemplate = {
  ...fmQc0203Base,
  id: "tpl-fm-qc-02-03-rev00",
  revision: "Rev.00",
  status: "inactive",
  effectiveFrom: "2025-01-01",
  effectiveTo: "2026-01-15",
  items: fmQc0203Items.filter((it) => it.id !== "it-2" && it.id !== "it-8"),
};

const fmQc0203Rev01: QcTemplate = {
  ...fmQc0203Base,
  id: "tpl-fm-qc-02-03-rev01",
  revision: "Rev.01",
  status: "active",
  effectiveFrom: "2026-01-16",
  effectiveTo: null,
  items: fmQc0203Items.filter((it) => it.id !== "it-8"),
};

const fmQc0203Rev02: QcTemplate = {
  ...fmQc0203Base,
  id: "tpl-fm-qc-02-03-rev02",
  revision: "Rev.02",
  status: "draft",
  effectiveFrom: "2026-09-01",
  effectiveTo: null,
  items: fmQc0203Items,
};

// =================================================================
// FM-QC-02-04 แบบฟอร์มการตรวจสอบคุณภาพคลังสินค้า
// ตัวอย่างของฟอร์มที่ง่ายที่สุด — ติ๊ก ปกติ/ผิดปกติ อย่างเดียวทั้งใบ
// ทุกข้อตั้งเหมือนกันหมด จึงไม่มีป้ายอะไรขึ้นบนการ์ดสักข้อ
// =================================================================

const fmQc0204Rev00: QcTemplate = {
  id: "tpl-fm-qc-02-04-rev00",
  name: "แบบฟอร์มการตรวจสอบคุณภาพคลังสินค้า",
  formCode: "FM-QC-02-04",
  revision: "Rev.00",
  status: "active",
  effectiveFrom: "2025-03-01",
  effectiveTo: null,
  roles: ["qc-inspector", "qc-supervisor"],
  schedule: perEvent,
  headerFields: [
    hf("hf-w1", "วันที่ตรวจ", "date"),
    hf("hf-w2", "เวลา", "time"),
    hf("hf-w3", "สูตรที่ตรวจสอบ", "ref", true, { source: "สูตร" }),
    hf("hf-w4", "คลังสินค้า", "ref", true, { source: "คลังสินค้า" }),
  ],
  items: [
    normalTick("ความสมบูรณ์ของกระสอบ"),
    normalTick("ความคมชัดของสูตรปุ๋ย"),
    normalTick("การจับตัวเป็นก้อน"),
    normalTick("ระยะห่างจากผนัง"),
    normalTick("ความสูงของการวางซ้อน"),
    normalTick("คราบน้ำ/คราบสกปรก"),
    normalTick("อุณหภูมิ/ความชื้นในบริเวณนั้นอยู่ในเกณฑ์ที่กำหนด"),
    normalTick("ความสะอาดของพื้นที่จัดเก็บ"),
  ],
  allowAdHocItems: false,
  failActions: [
    { id: "w-fa-1", label: "แจ้งหัวหน้าคลัง" },
    { id: "w-fa-2", label: "ย้ายจุดจัดเก็บ" },
  ],
  requireFailAction: false,
  signature: { inspector: true, time: true, approver: true },
};

// =================================================================
// FM-QC-02-07 ใบตรวจสอบวัตถุดิบในถัง
//
// ฟอร์มนี้เชื่อมกับฟีเจอร์ตรวจวัตถุดิบในถังจริง (lib/qc-check.ts) สองจุด
//   หัวข้อตรวจ  มาจาก MATERIALS ตรงๆ — วัตถุดิบแต่ละถังคือหนึ่งข้อ ติ๊กปกติ/ผิดปกติ
//   รอบการตรวจ  มาจาก SHIFTS — ตรวจทุกกะ วันละสี่ใบ ตรงกับที่หน้างานทำจริง
// เว้นเสาร์–อาทิตย์เพราะ isHoliday() ของฟีเจอร์นั้นถือว่าวันหยุดไม่ต้องตรวจ
// ถ้าวันหลังมีคนเปลี่ยนรายการวัตถุดิบหรือรอบกะที่ qc-check.ts เทมเพลตนี้ตามไปเองทันที
// =================================================================

const fmQc0207Rev00: QcTemplate = {
  id: "tpl-fm-qc-02-07-rev00",
  name: "ใบตรวจสอบวัตถุดิบในถัง",
  formCode: "FM-QC-02-07",
  revision: "Rev.00",
  status: "active",
  effectiveFrom: "2025-08-01",
  effectiveTo: null,
  roles: ["qc-inspector", "qc-supervisor"],
  schedule: {
    mode: "recurring",
    // id ใช้ตรงกับรหัสกะใน qc-check.ts เอง ไล่ตามได้ว่าจุดในปฏิทินจุดไหนคือกะไหน
    slots: SHIFTS.map((s) => ({ id: s.id, from: s.from, to: s.to })),
    skipDays: "weekend",
  },
  headerFields: [hf("hf-mt1", "ถังวัตถุดิบ", "ref", true, { source: "ถังวัตถุดิบ" })],
  items: MATERIALS.map((m) => normalTick(m)),
  allowAdHocItems: false,
  failActions: [],
  requireFailAction: false,
  signature: { inspector: true, time: true, approver: false },
};

// =================================================================
// FM-QC-02-05 ใบรายงานการตรวจสอบก่อนผลิต
// ตัวอย่างของฟอร์มที่หัวข้อแบ่งเป็นกลุ่ม — ข้อ 1/2/3 เป็นหัวข้อกลุ่ม
// ของจริงที่ต้องติ๊กคือหัวข้อย่อยข้างใน ตรงกับตารางในฟอร์มกระดาษ
// =================================================================

const group = (title: string, children: QcItem[]): QcItem => ({
  ...tick(title, ""),
  // หัวข้อกลุ่มไม่มีผลตรวจของตัวเอง ผลอยู่ที่หัวข้อย่อยทั้งหมด
  verdict: "none",
  note: "off",
  children,
});

const fmQc0205Rev00: QcTemplate = {
  id: "tpl-fm-qc-02-05-rev00",
  name: "ใบรายงานการตรวจสอบก่อนผลิต",
  formCode: "FM-QC-02-05",
  revision: "Rev.00",
  status: "active",
  effectiveFrom: "2025-03-01",
  effectiveTo: null,
  roles: ["qc-inspector", "prod-lead"],
  schedule: perEvent,
  headerFields: [
    hf("hf-m1", "เครื่องจักร No.", "ref", true, { source: "เครื่องจักร" }),
    hf("hf-m2", "วันที่", "date"),
    hf("hf-m3", "เวลา", "time"),
  ],
  items: [
    group("การเตรียมความพร้อมระบบสายพานและตัวเครื่อง", [
      normalTick(
        "ความชื้น",
        "ควบคุมให้อยู่ในเกณฑ์มาตรฐาน (ไม่เกิน 80℃)"
      ),
      normalTick(
        "ตรวจสายพาน",
        "ความตึงและการทำงานของสายพานต้องอยู่ในสภาพพร้อมใช้"
      ),
      normalTick(
        "ดูแลสายพาน",
        "โรยผงกันลื่นที่สายพาน เพื่อป้องกันการลื่นไถลและความชื้นสะสม"
      ),
    ]),
    group("การทำความสะอาด", [
      normalTick("ถังผสม", "เป่าฝุ่นละอองออกจากถังผสมให้สะอาด"),
      normalTick("ตะแกรงร่อน", "เคาะเศษวัสดุที่อุดตันออก เพื่อป้องกันการไหลติดขัด"),
    ]),
    group("ตรวจสอบระบบบรรจุและพิมพ์", [
      normalTick("เครื่องเย็บกระสอบ", "ตรวจเช็คกลไกและการทำงานของเครื่องเย็บ"),
      normalTick("เครื่องพิมพ์", "ตรวจสอบความคมชัดและระบบการพิมพ์ให้ถูกต้อง"),
    ]),
  ],
  // ฟอร์มกระดาษมีบรรทัด "อื่นๆ" ว่างไว้สี่บรรทัดท้ายตาราง
  allowAdHocItems: true,
  failActions: [{ id: "pm-fa-1", label: "หยุดผลิตรอแก้ไข" }],
  requireFailAction: true,
  signature: { inspector: true, time: true, approver: false },
};

// =================================================================
// FM-QC-01-01 ใบตรวจรับวัตถุดิบ — มีเวอร์ชันเดียว ใช้งานอยู่
// =================================================================

const fmQc0101Rev01: QcTemplate = {
  id: "tpl-fm-qc-01-01-rev01",
  name: "ใบตรวจรับวัตถุดิบ",
  formCode: "FM-QC-01-01",
  revision: "Rev.01",
  status: "active",
  effectiveFrom: "2025-06-01",
  effectiveTo: null,
  roles: ["qc-inspector"],
  schedule: perEvent,
  headerFields: [
    hf("hf-r1", "ผู้ขาย", "ref", true, { source: "ผู้ขาย" }),
    hf("hf-r2", "เลขที่ใบส่งของ", "text"),
    hf("hf-r3", "วันที่ตรวจ", "date"),
  ],
  items: [
    {
      id: "rm-1",
      kind: "check",
      title: "น้ำหนักวัตถุดิบ",
      description: "ชั่งเทียบกับใบส่งของ",
      criteria: "คลาดเคลื่อนไม่เกิน ±1%",
      verdict: "manual",
      verdictWording: "passFail",
      fields: [num("rm-c1", "น้ำหนักที่ชั่ง", "kg")],
      note: "onFail",
      required: true,
      repeatable: false,
      defaultRounds: 1,
      maxRounds: 1,
      withDate: false,
      withTime: false,
      children: [],
    },
    tick("สภาพบรรจุภัณฑ์", "ไม่ฉีกขาด ไม่เปียกชื้น"),
    tick("เอกสารกำกับ", "มี MSDS/ใบรับรองคุณภาพแนบมาด้วย"),
  ],
  allowAdHocItems: false,
  failActions: [
    { id: "rm-fa-1", label: "ส่งคืนผู้ขาย" },
    { id: "rm-fa-2", label: "กักรอตรวจซ้ำ" },
  ],
  requireFailAction: true,
  signature: { inspector: true, time: true, approver: false },
};

// =================================================================
// FM-QC-04-01 ใบตรวจสอบวัตถุดิบในถัง BB
// ตัวอย่างของ "ตรวจตามรอบเวลา" — สี่ช่วงเวลาต่อวัน ทุกวันไม่เว้น
// ฟอร์มเดียวในชุดนี้ที่ดูเป็นปฏิทินและตารางทั้งเดือนได้ เพราะรู้ว่าวันหนึ่งควรมีกี่ใบ
// ตรงกับใบกระดาษ Day shift / Night shift ที่พิมพ์วันที่ 1–31 ไว้ล่วงหน้า
// =================================================================

const fmQc0401Rev00: QcTemplate = {
  id: "tpl-fm-qc-04-01-rev00",
  name: "ใบตรวจสอบวัตถุดิบในถัง BB",
  formCode: "FM-QC-04-01",
  revision: "Rev.00",
  status: "active",
  effectiveFrom: "2026-01-01",
  effectiveTo: null,
  roles: ["qc-inspector"],
  schedule: {
    mode: "recurring",
    slots: [
      { id: "sl-1", from: "08:00", to: "12:00" },
      { id: "sl-2", from: "13:00", to: "17:00" },
      { id: "sl-3", from: "20:00", to: "00:00" },
      { id: "sl-4", from: "01:00", to: "05:00" },
    ],
    skipDays: "none",
  },
  headerFields: [
    hf("hf-t1", "ถัง", "select", true, {
      options: ["L1, L2", "L3, L4", "L5, L6"],
    }),
    hf("hf-t2", "วันที่ตรวจ", "date"),
  ],
  items: [
    normalTick("42-0-5", "เม็ดไม่จับตัว ไม่มีสิ่งแปลกปลอม"),
    normalTick("Br", "เม็ดไม่จับตัว ไม่มีสิ่งแปลกปลอม"),
    normalTick("Mop", "เม็ดไม่จับตัว ไม่มีสิ่งแปลกปลอม"),
    normalTick("Mg", "เม็ดไม่จับตัว ไม่มีสิ่งแปลกปลอม"),
    normalTick("Dap", "เม็ดไม่จับตัว ไม่มีสิ่งแปลกปลอม"),
    normalTick("Ammonium Su", "เม็ดไม่จับตัว ไม่มีสิ่งแปลกปลอม"),
    normalTick("Urea", "เม็ดไม่จับตัว ไม่มีสิ่งแปลกปลอม"),
  ],
  allowAdHocItems: false,
  failActions: [
    { id: "bb-fa-1", label: "แจ้งหัวหน้ากะ" },
    { id: "bb-fa-2", label: "หยุดจ่ายวัตถุดิบถังนี้" },
  ],
  requireFailAction: true,
  signature: { inspector: true, time: true, approver: false },
};

// =================================================================
// FM-QC-05-01 สุ่มตรวจสอบการจ่ายปุ๋ยคลัง A
// ตัวอย่างของรอบเวลาแบบสองช่วง (เช้า/บ่าย) และเว้นเสาร์–อาทิตย์
// มีข้อที่ข้ามได้ปนอยู่ด้วย — เครื่องยิงกระสอบไม่ได้ใช้ทุกวัน
// =================================================================

const fmQc0501Rev00: QcTemplate = {
  id: "tpl-fm-qc-05-01-rev00",
  name: "สุ่มตรวจสอบการจ่ายปุ๋ยคลัง A",
  formCode: "FM-QC-05-01",
  revision: "Rev.00",
  status: "active",
  effectiveFrom: "2026-02-01",
  effectiveTo: null,
  roles: ["qc-inspector", "prod-lead"],
  schedule: {
    mode: "recurring",
    slots: [
      { id: "sl-a", from: "08:00", to: "12:00" },
      { id: "sl-b", from: "13:00", to: "17:00" },
    ],
    skipDays: "weekend",
  },
  headerFields: [
    hf("hf-d1", "คลังสินค้า", "ref", true, { source: "คลังสินค้า" }),
    hf("hf-d2", "วันที่ตรวจ", "date"),
  ],
  items: [
    normalTick("ตรวจสอบคุณภาพกายภาพของปุ๋ย", "เม็ดไม่แตก ไม่จับตัวเป็นก้อน"),
    normalTick("ตรวจสอบบรรจุภัณฑ์และฉลาก", "กระสอบไม่ฉีก ฉลากตรงสูตร"),
    normalTick("ตรวจสอบจำนวนและรายการจ่าย", "ตรงกับใบจ่ายสินค้า"),
    normalTick("ตรวจสอบสภาพยานพาหนะและการขนส่ง", "พื้นกระบะแห้ง สะอาด มีผ้าใบคลุม"),
    normalTick("ตรวจสอบเอกสารและการบันทึกข้อมูล", "เอกสารครบและลงชื่อรับแล้ว"),
    normalTick("ตรวจสอบการจัดวางและการขึ้นสินค้า", "วางไม่เกินความสูงที่กำหนด"),
    {
      ...normalTick("ตรวจสอบเครื่องยิงกระสอบ", "หัวยิงไม่ตัน เลขที่ยิงอ่านออก"),
      id: "wh-7",
      // ไม่ได้ใช้เครื่องยิงทุกรอบ ข้อนี้จึงข้ามได้โดยไม่ทำให้ใบนับว่าไม่ครบ
      required: false,
    },
  ],
  allowAdHocItems: false,
  failActions: [
    { id: "dp-fa-1", label: "ระงับการจ่าย" },
    { id: "dp-fa-2", label: "เปลี่ยนกระสอบ" },
  ],
  requireFailAction: true,
  signature: { inspector: true, time: true, approver: false },
};

// =================================================================
// FM-QC-06-01 บันทึกการรับเอกสาร COA
// ตัวอย่างของตารางที่เพิ่มแถวเองได้ — วันหนึ่งรับกี่ใบก็ได้ ตั้งจำนวนไว้ล่วงหน้าไม่ได้
// และตัวอย่างของช่องแบบตัวเลือก — ประเภทสินค้า (1) วัตถุดิบ (2) ผลิตภัณฑ์ (3) อื่นๆ
// =================================================================

const fmQc0601Rev00: QcTemplate = {
  id: "tpl-fm-qc-06-01-rev00",
  name: "บันทึกการรับเอกสาร COA",
  formCode: "FM-QC-06-01",
  revision: "Rev.00",
  status: "active",
  effectiveFrom: "2025-11-01",
  effectiveTo: null,
  roles: ["qc-inspector", "qc-supervisor"],
  schedule: perEvent,
  headerFields: [hf("hf-c1", "เดือนที่บันทึก", "date")],
  items: [
    {
      id: "coa-1",
      kind: "rows",
      title: "รายการเอกสาร COA ที่รับเข้า",
      description: "หนึ่งแถวคือหนึ่งใบ กดเพิ่มแถวได้เรื่อย ๆ ตามที่รับจริง",
      criteria: "",
      verdict: "manual",
      verdictWording: "passFail",
      fields: [
        text("coa-f1", "เลขที่การรับเอกสาร COA"),
        choice("coa-f2", "ประเภทสินค้าที่รับเข้า", [
          "วัตถุดิบ",
          "ผลิตภัณฑ์",
          "อื่นๆ",
        ]),
        choice("coa-f3", "รายละเอียดของสินค้าโดยย่อ", [
          "ชนิดเม็ด",
          "ชนิดผง",
          "ชนิดน้ำ",
        ]),
        ref("coa-f4", "ชื่อผู้จัดจำหน่าย/ผลิต/จัดส่ง", "ผู้ขาย"),
      ],
      note: "optional",
      required: true,
      repeatable: false,
      defaultRounds: 1,
      maxRounds: 40,
      // วันที่ได้รับสินค้า/เอกสาร เป็นของแต่ละแถว ไม่ใช่ของทั้งใบ
      withDate: true,
      withTime: false,
      children: [],
    },
  ],
  allowAdHocItems: false,
  failActions: [{ id: "coa-fa-1", label: "ทวงเอกสารจากผู้ขาย" }],
  requireFailAction: false,
  signature: { inspector: true, time: true, approver: false },
};

// =================================================================
// FM-QC-02-06 สุ่มตรวจผลิตภัณฑ์สำเร็จรูป
// ตัวอย่างของตารางเพิ่มแถวเองที่คอลัมน์แรกดึงจากระบบ — สุ่มสูตรไหนก็เลือกสูตรนั้น
// รวมช่องสามแบบไว้ในตารางเดียว: ดึงจากระบบ / ตัวเลือก / ตัวเลขที่มีเกณฑ์
// =================================================================

const fmQc0206Rev00: QcTemplate = {
  id: "tpl-fm-qc-02-06-rev00",
  name: "สุ่มตรวจผลิตภัณฑ์สำเร็จรูป",
  formCode: "FM-QC-02-06",
  revision: "Rev.00",
  status: "draft",
  effectiveFrom: "2026-09-01",
  effectiveTo: null,
  roles: ["qc-inspector"],
  schedule: perEvent,
  headerFields: [
    hf("hf-s1", "เครื่องผลิต", "select", true, { options: ["L1", "L2", "L3"] }),
  ],
  items: [
    {
      id: "sp-1",
      kind: "check",
      title: "สูตรที่สุ่มตรวจ",
      description: "",
      criteria: "การเย็บด้ายต้องติด ตัวเลขของกระสอบต้องชัด",
      verdict: "manual",
      verdictWording: "passFail",
      fields: [
        ref("sp-f1", "สูตร", "สูตร"),
        num("sp-f2", "น้ำหนักที่ชั่ง", "kg", { op: "gte", min: 50.2, max: null }),
        choice("sp-f3", "สลิง", ["30", "35", "40"]),
      ],
      note: "onFail",
      required: true,
      // สุ่มตรวจกี่ตัวอย่างไม่แน่นอนล่วงหน้า จึงเปิดให้ตรวจซ้ำได้ ไม่ใช่ชุดข้อมูลเดียว
      // การ์ดแต่ละครั้งพับ/กางได้ในหน้าตัวอย่าง แทนตารางที่ยาวเกินอ่านเมื่อสุ่มตรวจหลายตัวอย่าง
      repeatable: true,
      defaultRounds: 2,
      maxRounds: 30,
      withDate: false,
      withTime: false,
      children: [],
    },
  ],
  allowAdHocItems: false,
  failActions: [
    { id: "sp-fa-1", label: "Repack" },
    { id: "sp-fa-2", label: "รับสภาพ" },
  ],
  requireFailAction: true,
  signature: { inspector: true, time: true, approver: false },
};

// =================================================================
// FM-QC-03-01 ใบตรวจก่อนผลิต — ยังไม่เคยเผยแพร่ มีแต่ฉบับร่างรอตั้งวันเริ่มใช้
// =================================================================

const fmQc0301Rev01: QcTemplate = {
  id: "tpl-fm-qc-03-01-rev01",
  name: "ใบตรวจก่อนผลิต",
  formCode: "FM-QC-03-01",
  revision: "Rev.01",
  status: "draft",
  effectiveFrom: "",
  effectiveTo: null,
  roles: ["qc-inspector", "prod-lead"],
  schedule: perEvent,
  headerFields: [
    hf("hf-p1", "เครื่องจักร No.", "ref", true, { source: "เครื่องจักร" }),
    hf("hf-p2", "วันที่ตรวจ", "date"),
  ],
  items: [
    tick("ความสะอาดของเครื่องจักร", "ไม่มีเศษวัสดุค้างจากล็อตก่อน"),
    tick("ความพร้อมของสายพาน", "ไม่มีรอยฉีกขาดหรือหลวม"),
  ],
  allowAdHocItems: true,
  failActions: [{ id: "pp-fa-1", label: "หยุดผลิตรอแก้ไข" }],
  requireFailAction: true,
  signature: { inspector: true, time: true, approver: false },
};

/**
 * ทุกเทมเพลต QC ในระบบ — หน้าตารางรวม (/qc/setup) แสดงจากลิสต์นี้
 * เรียงตามรหัสฟอร์ม ไม่ได้เรียงตามความสำคัญ เพราะคนหาด้วยรหัสหรือชื่อ
 */
export const QC_TEMPLATES: QcTemplateFamily[] = [
  {
    id: "tpl-fm-qc-01-01",
    formCode: "FM-QC-01-01",
    versions: [fmQc0101Rev01],
  },
  {
    id: "tpl-fm-qc-02-03",
    formCode: "FM-QC-02-03",
    versions: [fmQc0203Rev02, fmQc0203Rev01, fmQc0203Rev00],
  },
  {
    id: "tpl-fm-qc-02-04",
    formCode: "FM-QC-02-04",
    versions: [fmQc0204Rev00],
  },
  {
    id: "tpl-fm-qc-02-05",
    formCode: "FM-QC-02-05",
    versions: [fmQc0205Rev00],
  },
  {
    id: "tpl-fm-qc-02-06",
    formCode: "FM-QC-02-06",
    versions: [fmQc0206Rev00],
  },
  {
    id: "tpl-fm-qc-02-07",
    formCode: "FM-QC-02-07",
    versions: [fmQc0207Rev00],
  },
  {
    id: "tpl-fm-qc-03-01",
    formCode: "FM-QC-03-01",
    versions: [fmQc0301Rev01],
  },
  {
    id: "tpl-fm-qc-04-01",
    formCode: "FM-QC-04-01",
    versions: [fmQc0401Rev00],
  },
  {
    id: "tpl-fm-qc-05-01",
    formCode: "FM-QC-05-01",
    versions: [fmQc0501Rev00],
  },
  {
    id: "tpl-fm-qc-06-01",
    formCode: "FM-QC-06-01",
    versions: [fmQc0601Rev00],
  },
];

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
      item.kind === "check" &&
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
