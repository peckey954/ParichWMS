// ============================================================
// โครงข้อมูลของ Setup QC แบบ ERPNext
//
// ไฟล์นี้ไม่ได้มาแทน qc-template.ts — ของเดิมยังอยู่และยังใช้ที่ /qc/setup
// ตัวนี้คือ "ถ้าเดฟเอาไปลง ERPNext แล้วหน้าตั้งค่าจะเหลือเท่าไหร่" ซึ่งเล็กกว่ามาก
// เพราะทุกอย่างในนี้ต้องมีที่อยู่จริงใน doctype ของ ERPNext ไม่มีช่องไหนที่ลอยอยู่เฉย ๆ
//
// ชื่อฟิลด์จริงที่ตรงกันเขียนกำกับไว้ทุกจุด เดฟจะได้แมปได้โดยไม่ต้องเดา
//   Quality Inspection Template     เทมเพลตหนึ่งฟอร์ม
//   Item Quality Inspection Parameter   หนึ่งแถวในเทมเพลต
//   Quality Inspection Parameter    ทะเบียนหัวข้อตรวจกลาง
//   Quality Inspection / Reading    ใบตรวจจริงกับผลรายข้อ
//   Item / Stock Settings           ตัวบังคับว่าต้องตรวจก่อนรับ และไม่ผ่านแล้วทำยังไง
// ============================================================

// ---------------------------------------------------------------
// ประเภทการตรวจ — inspection_type
// ---------------------------------------------------------------

export type InspectionType = "incoming" | "outgoing" | "inProcess";

export const INSPECTION_TYPE_LABEL: Record<InspectionType, string> = {
  incoming: "รับเข้า",
  outgoing: "ส่งออก",
  inProcess: "ระหว่างผลิต",
};

/** ค่าจริงที่ต้องส่งให้ ERPNext — โชว์คู่ชื่อไทยเพื่อให้เดฟเห็นว่าอันไหนแมปกับอันไหน */
export const INSPECTION_TYPE_VALUE: Record<InspectionType, string> = {
  incoming: "Incoming",
  outgoing: "Outgoing",
  inProcess: "In Process",
};

// ---------------------------------------------------------------
// เอกสารที่ใบตรวจอ้างอิงได้ — reference_type
//
// ของเดิมไม่มีแนวคิดนี้เลย ใบตรวจลอยอยู่เดี่ยว ๆ
// ของ ERPNext ใบตรวจเกิดจากเอกสารสต็อกเสมอ และเป็นตัวที่ทำให้บล็อกการรับของได้
// ---------------------------------------------------------------

export type RefDoc =
  | "purchaseReceipt"
  | "purchaseInvoice"
  | "subcontractingReceipt"
  | "deliveryNote"
  | "salesInvoice"
  | "stockEntry"
  | "jobCard";

export const REF_DOC_LABEL: Record<RefDoc, string> = {
  purchaseReceipt: "ใบรับของ",
  purchaseInvoice: "ใบแจ้งหนี้ซื้อ",
  subcontractingReceipt: "ใบรับงานจ้างผลิต",
  deliveryNote: "ใบส่งของ",
  salesInvoice: "ใบแจ้งหนี้ขาย",
  stockEntry: "ใบเบิก-โอนสต็อก",
  jobCard: "ใบงานผลิต",
};

export const REF_DOC_VALUE: Record<RefDoc, string> = {
  purchaseReceipt: "Purchase Receipt",
  purchaseInvoice: "Purchase Invoice",
  subcontractingReceipt: "Subcontracting Receipt",
  deliveryNote: "Delivery Note",
  salesInvoice: "Sales Invoice",
  stockEntry: "Stock Entry",
  jobCard: "Job Card",
};

/** เอกสารที่ใช้ได้กับการตรวจแต่ละประเภท — เลือกนอกนี้แล้วใบตรวจจะไม่ถูกเรียกใช้จริง */
export const REF_DOCS_OF: Record<InspectionType, RefDoc[]> = {
  incoming: ["purchaseReceipt", "purchaseInvoice", "subcontractingReceipt"],
  outgoing: ["deliveryNote", "salesInvoice"],
  inProcess: ["stockEntry", "jobCard"],
};

// ---------------------------------------------------------------
// วิธีตัดสินหนึ่งหัวข้อ — ติ๊กสามตัว ตรงกับ ERPNext ตัวต่อตัว
//
// เคยทำเป็นคำถามเดียวสี่ตัวเลือก ซึ่งผิด เพราะมันบังคับให้เลือกได้อย่างเดียว
// แต่ของจริง manual_inspection ติ๊กคู่กับ numeric หรือ formula ได้
//
// โค้ดของ ERPNext (quality_inspection.py) เช็คแค่ `if not reading.manual_inspection`
// ก่อนจะคำนวณผลให้ — ติ๊ก manual คู่กับ numeric จึงแปลว่า "ยังคีย์ตัวเลขเก็บไว้
// เหมือนเดิม แต่คนเป็นคนชี้ขาดว่าผ่านหรือไม่" ซึ่งเป็นสิ่งที่ฟอร์มกระดาษของ
// โรงงานใช้จริง (ช่องคีย์ความชื้น + ปุ่มปกติ/ผิดปกติ อยู่ในข้อเดียวกัน)
//
// สองแกนที่ติ๊กสามตัวนี้ประกอบกัน
//   numeric                 ผู้ตรวจคีย์อะไร — ตัวเลข (reading_1..10) หรือข้อความ (reading_value)
//   formula_based_criteria  ตัดสินด้วยสูตร แทนช่วงต่ำ–สูง หรือค่าที่ถือว่าผ่าน
//   manual_inspection       คนตั้งผลเอง ซ้อนทับสองอันบนได้
// ---------------------------------------------------------------

export type FlagKey = "numeric" | "formulaBased" | "manualInspection";

export const FLAG: Record<
  FlagKey,
  { label: string; field: string; hint: string; custom?: boolean }
> = {
  numeric: {
    label: "คีย์เป็นตัวเลข",
    field: "numeric",
    hint: "ติ๊ก = ได้ช่องคีย์ตัวเลขหลายค่า · ไม่ติ๊ก = ได้ช่องเดียวให้คีย์ข้อความ",
  },
  formulaBased: {
    label: "ตัดสินด้วยสูตร",
    field: "formula_based_criteria",
    hint: "ใช้สูตรแทนช่วงต่ำ–สูง หรือค่าที่ถือว่าผ่าน",
  },
  manualInspection: {
    label: "ผู้ตรวจเลือกผลผ่าน/ไม่ผ่านเอง",
    // ERPNext มี manual_inspection เฉพาะที่ "ใบตรวจ" ไม่มีที่เทมเพลต —
    // ของเขาคือผู้ตรวจติ๊กเองทุกใบ ส่วนเราอยากกำหนดล่วงหน้าตามฟอร์มกระดาษ
    // จึงต้องเพิ่มช่องที่เทมเพลต แล้วคัดลอกลงแถวของใบตอนสร้าง
    field: "custom_manual_inspection → manual_inspection ของแถวในใบตรวจ",
    custom: true,
    hint: "ระบบไม่ตัดสินให้ ติ๊กคู่กับสองอันบนได้ — เก็บค่าที่วัดไว้ แต่คนเป็นคนชี้ขาด",
  },
};

export const FLAG_KEYS = Object.keys(FLAG) as FlagKey[];

// ---------------------------------------------------------------
// หมายเหตุรายข้อ — ไม่มีใน ERPNext ต้องเพิ่มเป็น custom field
// เขียนกำกับไว้ในหน้าตั้งค่าเลย เดฟจะได้รู้ว่าอันนี้ไม่ได้มากับของเดิม
// ---------------------------------------------------------------

export type RemarkMode = "off" | "optional" | "onFail";

export const REMARK_LABEL: Record<RemarkMode, string> = {
  off: "ไม่มี",
  optional: "ไม่บังคับ",
  onFail: "บังคับเมื่อไม่ผ่าน",
};

// ---------------------------------------------------------------
// ทะเบียนหัวข้อตรวจกลาง — Quality Inspection Parameter (+ Parameter Group)
//
// ของเดิมพิมพ์ชื่อหัวข้ออิสระในแต่ละฟอร์ม สองฟอร์มจึงมี "ความชื้น" คนละตัวได้
// ERPNext บังคับให้เลือกจากทะเบียน รายงานข้ามฟอร์มถึงรวมกันได้
// ---------------------------------------------------------------

export type QiParameter = {
  id: string;
  /** specification — ชื่อนี้คือ ID ของเอกสารใน ERPNext เปลี่ยนทีหลังกระทบลิงก์ */
  name: string;
  /**
   * parameter_group — ว่างได้ แปลว่ายังไม่จัดกลุ่ม
   *
   * ERPNext เองก็ไม่บังคับ และกลุ่มมีค่าก็ต่อเมื่อมีหัวข้อมากพอจนต้องแบ่ง
   * บังคับตั้งแต่หัวข้อแรกคือให้คนตัดสินใจเรื่องที่ยังไม่มีข้อมูลพอจะตัดสิน
   * แล้วจะได้กลุ่มที่ตั้งส่ง ๆ ไปก่อน ซึ่งแก้ทีหลังยากกว่าปล่อยว่างไว้
   */
  group: string;
  /** ไม่มีใน ERPNext — custom field เอาไว้โชว์หน่วยข้างช่องกรอก */
  unit: string;
  /**
   * description ของ ERPNext — คำอธิบายกลางของหัวข้อนี้ ใช้ร่วมทุกฟอร์ม
   *
   * เขียนได้เฉพาะสิ่งที่จริงทุกฟอร์ม เช่นวิธีวัด ส่วนตัวเลขเกณฑ์เขียนที่นี่ไม่ได้
   * เพราะความชื้นของวัตถุดิบกับของสินค้าสำเร็จรูปใช้เกณฑ์คนละตัว
   */
  description?: string;
};

/**
 * กลุ่มหัวข้อตรวจ — ตรงกับ doctype Quality Inspection Parameter Group
 *
 * ห้าตัวนี้เป็นค่าตั้งต้นเฉย ๆ ไม่ใช่รายการปิด ERPNext ไม่ได้แถมกลุ่มมาให้เลย
 * ผู้ใช้สร้างเองทั้งหมด หน้าจอจึงต้องพิมพ์เพิ่มกลุ่มใหม่ได้ด้วย
 */
export const QI_GROUPS = [
  "กายภาพ",
  "เคมี",
  "บรรจุภัณฑ์",
  "เอกสาร",
  "เครื่องจักร",
  "วัตถุดิบในถัง",
];

/** กี่หัวข้อที่อยู่ในกลุ่มนี้ — ใช้กันลบกลุ่มที่ยังมีคนใช้ */
export const groupUsedBy = (group: string) =>
  QI_PARAMETERS.filter((p) => p.group === group).length;

/**
 * เปลี่ยนชื่อกลุ่ม — หัวข้อที่อยู่ในกลุ่มนั้นต้องย้ายตามด้วย
 *
 * หัวข้อเก็บกลุ่มเป็นชื่อ ไม่ใช่ id ตามที่ ERPNext ทำ (parameter_group เป็น Link
 * ที่ชี้ด้วยชื่อ) เปลี่ยนชื่อแล้วไม่ไล่แก้ หัวข้อจะชี้ไปหากลุ่มที่ไม่มีอยู่
 * เปลี่ยนเป็นชื่อที่มีอยู่แล้ว = ยุบสองกลุ่มรวมกัน ซึ่งเป็นวิธีจัดการตัวซ้ำ
 */
export function renameGroup(from: string, to: string) {
  const name = to.trim();
  if (!name || name === from) return;
  const i = QI_GROUPS.indexOf(from);
  if (i < 0) return;

  const merging = QI_GROUPS.some(
    (g) => g !== from && g.toLowerCase() === name.toLowerCase()
  );
  if (merging) QI_GROUPS.splice(i, 1);
  else QI_GROUPS[i] = name;

  for (const p of QI_PARAMETERS) if (p.group === from) p.group = name;
}

/** ลบได้เฉพาะกลุ่มที่ไม่มีหัวข้อไหนอยู่ */
export function removeGroup(group: string): boolean {
  if (groupUsedBy(group) > 0) return false;
  const i = QI_GROUPS.indexOf(group);
  if (i >= 0) QI_GROUPS.splice(i, 1);
  return i >= 0;
}

/** เพิ่มกลุ่มใหม่ ถ้ามีอยู่แล้วคืนตัวเดิม — ชื่อกลุ่มซ้ำคือกลุ่มเดียวกัน */
export function addGroup(name: string): string {
  const trimmed = name.trim();
  const dup = QI_GROUPS.find(
    (g) => g.toLowerCase() === trimmed.toLowerCase()
  );
  if (dup) return dup;
  QI_GROUPS.push(trimmed);
  return trimmed;
}

export const QI_PARAMETERS: QiParameter[] = [
  { id: "p-size", name: "ขนาดเม็ดปุ๋ย", group: "กายภาพ", unit: "g" },
  { id: "p-hard", name: "ความแข็งเม็ดปุ๋ย", group: "กายภาพ", unit: "กก." },
  {
    id: "p-moist",
    name: "ความชื้น",
    group: "เคมี",
    unit: "%",
    // คำอธิบายกลางเขียนได้แค่วิธีวัด ตัวเลขเกณฑ์อยู่ที่แถวของแต่ละฟอร์ม
    description: "วัดด้วยเครื่องวัดความชื้นแบบเข็มเสียบ อ่านค่าหลังนิ่ง 10 วินาที",
  },
  { id: "p-n", name: "ไนโตรเจน (N)", group: "เคมี", unit: "%" },
  { id: "p-p", name: "ฟอสฟอรัส (P)", group: "เคมี", unit: "%" },
  { id: "p-k", name: "โพแทสเซียม (K)", group: "เคมี", unit: "%" },
  { id: "p-weight", name: "น้ำหนักบรรจุ", group: "บรรจุภัณฑ์", unit: "กก." },
  { id: "p-bag", name: "สภาพกระสอบ", group: "บรรจุภัณฑ์", unit: "" },
  { id: "p-label", name: "ป้ายฉลาก", group: "บรรจุภัณฑ์", unit: "" },
  { id: "p-coa", name: "เอกสาร COA", group: "เอกสาร", unit: "" },
  { id: "p-clean", name: "ความสะอาดเครื่องผสม", group: "เครื่องจักร", unit: "" },
  { id: "p-temp", name: "อุณหภูมิห้องผสม", group: "เครื่องจักร", unit: "°C" },
  { id: "p-formula", name: "สูตรตรงกับใบสั่งผลิต", group: "เอกสาร", unit: "" },
  { id: "p-clean-area", name: "ความสะอาดพื้นที่จัดเก็บ", group: "เครื่องจักร", unit: "" },
  { id: "p-stack", name: "การเรียงกองสินค้า", group: "บรรจุภัณฑ์", unit: "" },
  { id: "p-pest", name: "ร่องรอยสัตว์พาหะ", group: "เครื่องจักร", unit: "" },
  { id: "p-warehouse-temp", name: "อุณหภูมิคลัง", group: "เครื่องจักร", unit: "°C" },
  { id: "p-tank-temp", name: "อุณหภูมิในถัง", group: "เครื่องจักร", unit: "°C" },
  { id: "p-tank-level", name: "ระดับวัตถุดิบในถัง", group: "กายภาพ", unit: "%" },
  { id: "p-coa-complete", name: "ความครบถ้วนของเอกสาร", group: "เอกสาร", unit: "" },
  { id: "p-coa-match", name: "ค่าในเอกสารตรงกับที่สั่ง", group: "เอกสาร", unit: "" },
  { id: "p-belt", name: "สภาพสายพาน", group: "เครื่องจักร", unit: "" },
  { id: "p-noise", name: "เสียงผิดปกติของเครื่อง", group: "เครื่องจักร", unit: "" },
  { id: "p-lube", name: "การหล่อลื่น", group: "เครื่องจักร", unit: "" },
  { id: "p-complaint", name: "รายละเอียดข้อร้องเรียน", group: "เอกสาร", unit: "" },
  { id: "p-trace", name: "ผลตรวจสอบย้อนกลับ", group: "เอกสาร", unit: "" },
  // จากฟอร์มเตรียมเครื่องจักร — ตัดหัวข้อย่อยออก ทุกข้อเป็นหัวข้อหลักเท่ากันหมด
  { id: "p-belt-care", name: "ดูแลสายพาน", group: "เครื่องจักร", unit: "" },
  { id: "p-mixer", name: "ถังผสม", group: "เครื่องจักร", unit: "" },
  { id: "p-sieve", name: "ตะแกรงร่อน", group: "เครื่องจักร", unit: "" },
  { id: "p-sewing", name: "เครื่องเย็บกระสอบ", group: "เครื่องจักร", unit: "" },
  { id: "p-printer", name: "เครื่องพิมพ์", group: "เครื่องจักร", unit: "" },
  // จากฟอร์มตรวจคุณภาพคลังสินค้า FM-QC-02-04
  { id: "p-bag-intact", name: "ความสมบูรณ์ของกระสอบ", group: "บรรจุภัณฑ์", unit: "" },
  { id: "p-print-clear", name: "ความคมชัดของสูตรปุ๋ย", group: "บรรจุภัณฑ์", unit: "" },
  // จากใบรายงานการตรวจสอบสินค้าสำเร็จรูป FM-QC-02-03
  { id: "p-seam", name: "การเย็บกระสอบ", group: "บรรจุภัณฑ์", unit: "" },
  // วัตถุดิบที่เก็บในถัง — หนึ่งตัวคือหนึ่งหัวข้อในใบตรวจถัง
  { id: "p-rm-4205", name: "42-0-5", group: "วัตถุดิบในถัง", unit: "KG" },
  { id: "p-rm-br", name: "Br", group: "วัตถุดิบในถัง", unit: "KG" },
  { id: "p-rm-mop", name: "Mop", group: "วัตถุดิบในถัง", unit: "KG" },
  { id: "p-rm-mg", name: "Mg", group: "วัตถุดิบในถัง", unit: "KG" },
  { id: "p-rm-dap", name: "Dap", group: "วัตถุดิบในถัง", unit: "KG" },
  { id: "p-rm-amsu", name: "Ammonium Su", group: "วัตถุดิบในถัง", unit: "KG" },
  { id: "p-rm-urea", name: "Urea", group: "วัตถุดิบในถัง", unit: "KG" },
  { id: "p-smell", name: "กลิ่นของปุ๋ย", group: "กายภาพ", unit: "" },
  { id: "p-touch", name: "การตรวจสอบด้วยการสัมผัส", group: "กายภาพ", unit: "" },
  { id: "p-bag-formula", name: "กระสอบตรงกับสูตร", group: "บรรจุภัณฑ์", unit: "" },
  { id: "p-sticker", name: "สติ๊กเกอร์แลกแต้ม", group: "บรรจุภัณฑ์", unit: "" },
  { id: "p-sling", name: "ขนาดสลิง", group: "บรรจุภัณฑ์", unit: "" },
  { id: "p-caking", name: "การจับตัวเป็นก้อน", group: "กายภาพ", unit: "" },
  { id: "p-wall-gap", name: "ระยะห่างจากผนัง", group: "เครื่องจักร", unit: "" },
  { id: "p-stack-height", name: "ความสูงของการวางซ้อน", group: "บรรจุภัณฑ์", unit: "" },
  { id: "p-stain", name: "คราบน้ำ / คราบสกปรก", group: "กายภาพ", unit: "" },
  { id: "p-area-climate", name: "อุณหภูมิและความชื้นในบริเวณ", group: "เครื่องจักร", unit: "" },
];

export const paramOf = (id: string) => QI_PARAMETERS.find((p) => p.id === id);

// ---------------------------------------------------------------
// แหล่งข้อมูลที่ดึงมาให้เลือกได้
//
// custom = Quality Inspection ไม่มีช่องให้เก็บ ไม่ใช่ว่าทำไม่ได้ แต่ต้องไปอยู่
// doctype QC Check ที่เราสร้างเอง — ตัวนี้คือสิ่งที่ตัดสินว่าใบไปลงที่ไหน
// คนตั้งค่าไม่ต้องเลือก doctype เอง เลือกว่าดึงอะไรมา แล้วอ่านคำตอบจากตรงนั้น
// ---------------------------------------------------------------

export type RowKind = "text" | "system";

export const ROW_KIND: Record<RowKind, { label: string; store: string }> = {
  text: {
    label: "ข้อความ",
    store: "specification → ทะเบียนหัวข้อตรวจ",
  },
  system: {
    label: "ดึงจากระบบ",
    store: "ผู้ตรวจเลือกจากรายการของระบบ ไม่ได้พิมพ์เอง",
  },
};

export const ROW_KINDS = Object.keys(ROW_KIND) as RowKind[];

export type SourceId =
  | "item"
  | "docPr"
  | "docDn"
  | "docSe"
  | "docJc"
  | "batch"
  | "user"
  | "warehouse"
  | "machine";

export const SOURCE: Record<
  SourceId,
  { label: string; store: string; custom: boolean; pool: string[] }
> = {
  item: {
    label: "สินค้า",
    store: "item_code → Item",
    custom: false,
    pool: [],
  },
  docPr: {
    label: "ใบรับสินค้าภายนอก",
    store: "reference_type = Purchase Receipt · reference_name",
    custom: false,
    pool: ["PR260115/01-01", "PR260115/01-02", "PR260114/03-01"],
  },
  docDn: {
    label: "ใบส่งของ",
    store: "reference_type = Delivery Note · reference_name",
    custom: false,
    pool: ["DN260115/01-01", "DN260114/02-01"],
  },
  docSe: {
    label: "ใบเบิก-โอนสต็อก",
    store: "reference_type = Stock Entry · reference_name",
    custom: false,
    pool: ["SE260115/01-01", "SE260115/01-02"],
  },
  docJc: {
    label: "ใบงานผลิต",
    store: "reference_type = Job Card · reference_name",
    custom: false,
    pool: ["JC260115/L1-01", "JC260115/L2-01"],
  },
  batch: {
    label: "ล็อต",
    store: "batch_no → Batch",
    custom: false,
    pool: ["LOT-260115-01", "LOT-260115-02"],
  },
  user: {
    label: "ผู้ตรวจ",
    store: "inspected_by → User",
    custom: false,
    pool: ["อลิสา พรสุขสิริ", "ณัฐพล ศรีวิไล"],
  },
  warehouse: {
    label: "คลังสินค้า",
    store: "QC Check · Link → Warehouse",
    custom: true,
    pool: [
      "สต็อกทั่วไป",
      "สต็อกวัตถุดิบ",
      "สต็อกสินค้า",
      "สต็อก WIP",
      "สต็อก CWIP",
    ],
  },
  machine: {
    label: "เครื่องจักร",
    store: "QC Check · Link → Asset",
    custom: true,
    pool: ["L1", "L2", "L3"],
  },
};

export const SOURCE_IDS = Object.keys(SOURCE) as SourceId[];

/** รายการให้เลือกของแหล่งหนึ่ง — สินค้าอ่านจาก ITEM_POOL ที่ประกาศทีหลัง */
export const sourcePool = (id: SourceId): string[] =>
  id === "item" ? ITEM_POOL : SOURCE[id].pool;

/* หัวข้อตรวจดึงได้แค่สามอย่าง — ของที่ "ตรวจ" ได้จริง
   เอกสารกับผู้ตรวจไม่อยู่ในนี้ เพราะเป็นของหัวใบ ไม่ใช่หัวข้อที่ตัดสินผ่าน */
export const CHECK_SOURCES: SourceId[] = ["item", "warehouse", "machine"];

// ---------------------------------------------------------------
// ช่องในส่วนหัวเอกสาร — ผู้ตรวจกรอกครั้งเดียวต่อใบ
//
// ของเดิมไม่มีแนวคิดนี้ ช่องหัวใบถูกตั้งตายตัวไว้ในโค้ด ฟอร์มที่ต้องการช่องอื่น
// จึงทำไม่ได้เลย ตัวนี้เปิดให้ตั้งเองว่าใบนี้ต้องกรอกอะไรก่อนเริ่มตรวจ
// ---------------------------------------------------------------

export type DocField = {
  id: string;
  label: string;
  source: SourceId | "";
  required: boolean;
};

// ---------------------------------------------------------------
// หนึ่งแถวในเทมเพลต — Item Quality Inspection Parameter
// ---------------------------------------------------------------

export type QiRow = {
  id: string;
  /**
   * หัวข้อนี้มาจากไหน
   *   text    ชื่อจากทะเบียน Quality Inspection Parameter ผู้ตรวจกรอกค่าเอง
   *   system  ผู้ตรวจเลือกจากรายการของระบบ ชื่อหัวข้อคือตัวแหล่งข้อมูลไปในตัว
   *
   * เคยไม่มีแกนนี้ ฟอร์มที่ต้องให้เลือกสูตรหรือเครื่องจักรต่อการตรวจจึงทำไม่ได้
   * ต้องไปทำตารางแยกอีกตาราง ซึ่งกลายเป็นสองที่ที่ตั้งเหมือนกันแต่คนละหน้าตา
   */
  kind: RowKind;
  /** ใช้เมื่อ kind = system — เป็นชื่อหัวข้อไปในตัว ไม่ต้องตั้งชื่อซ้ำ */
  source?: SourceId;
  parameterId: string;
  /** numeric — คีย์ตัวเลขหลายค่า ไม่ติ๊กคือคีย์ข้อความช่องเดียว */
  numeric: boolean;
  /** formula_based_criteria */
  formulaBased: boolean;
  /** manual_inspection — ติ๊กคู่กับสองอันบนได้ */
  manualInspection: boolean;
  /**
   * min_value / max_value — โชว์เมื่อ numeric และไม่ใช้สูตร
   *
   * ว่าง = ศูนย์ ไม่ใช่ไม่จำกัด เพราะ ERPNext เทียบ flt(min) <= v <= flt(max)
   * แล้ว flt ของค่าว่างคือ 0 — ปล่อยสูงสุดว่างไว้คือฟอร์มที่ตกทุกใบ
   */
  min: number | null;
  max: number | null;
  /** value — โชว์เมื่อไม่ใช่ตัวเลขและไม่ใช้สูตร */
  value: string;
  /** acceptance_formula — โชว์เมื่อติ๊กสูตร */
  formula: string;
  /**
   * จำนวนค่าที่ผู้ตรวจต้องคีย์ในหัวข้อนี้ — reading_1 … reading_10
   * เพดาน 10 เป็นของ ERPNext ไม่ใช่ของที่เราตั้งเอง
   */
  readings: number;
  /**
   * ชื่อกำกับช่องคีย์ทีละช่อง — custom_reading_labels
   *
   * ERPNext ตั้งป้ายช่องไว้ตายตัวว่า Reading 1 … Reading 10 แก้ได้แต่ทั้งระบบ
   * ไม่ได้แก้รายหัวข้อ แต่ฟอร์มกระดาษของโรงงานใช้ตะแกรงคนละขนาดในหัวข้อเดียวกัน
   * ("4 มม." "3.15 มม." "2 มม." "0.5 มม.") ซึ่งคนตรวจต้องอ่านออกว่าช่องไหนคือช่องไหน
   *
   * ว่างไว้ได้ ช่องที่ไม่ได้ตั้งชื่อจะอ่านว่า "ครั้งที่ N" เหมือนเดิม
   */
  labels?: string[];
  remark: RemarkMode;
  /**
   * เกณฑ์ที่เขียนให้คนอ่าน — ไม่มีใน ERPNext ต้องเพิ่มเป็น custom field ที่แถว
   *
   * ต่างจาก min/max กับสูตร ตรงที่อันนั้นเขียนให้เครื่องตัดสิน ส่วนอันนี้เขียน
   * ให้คนที่ยืนตรวจอ่าน ข้อที่ให้ติ๊กเองไม่มีเกณฑ์ในระบบเลย ข้อความนี้คือ
   * ทั้งหมดที่ผู้ตรวจมี — ไม่มีแล้วเขาไม่รู้ว่าอะไรนับว่าปกติ
   *
   * อยู่ที่แถว ไม่ใช่ที่ทะเบียน เพราะหัวข้อเดียวกันคนละฟอร์มใช้เกณฑ์คนละตัว
   */
  criteria: string;
};

export const MAX_READINGS = 10;

// ---------------------------------------------------------------
// สิ่งที่ต้องทำเมื่อไม่ผ่าน
//
// รายการกลาง ไม่ใช่ข้อความพิมพ์อิสระในแต่ละฟอร์ม เพราะแต่ละตัวเลือกผูกกับ
// server script ที่เดฟเขียน — พิมพ์ "ส่งคืนผู้ขาย" แทน "ส่งคืน" เมื่อไหร่
// script ก็ไม่รู้จักคำนั้น ผู้ตรวจเลือกได้ บันทึกผ่าน แต่ยอดสต็อกไม่ขยับ
// และไม่มีใครรู้ว่าพัง
//
// "ผลกับสต็อก" เป็นสเปคให้เดฟ ไม่ใช่ของที่ระบบทำให้เอง — ERPNext ไม่มี
// แนวคิดนี้ มีแค่ rejected_qty กับ rejected_warehouse ที่ใบรับของ
// แต่ไม่รู้ว่าใครเป็นคนบอกให้ใส่
// ---------------------------------------------------------------

export type Disposition = {
  id: string;
  label: string;
  /** ยอดเปลี่ยนยังไง — เขียนให้คนอ่าน */
  effect: string;
  /** ฟิลด์ที่ script ต้องไปเซ็ต */
  field: string;
};

export const DISPOSITIONS: Disposition[] = [
  {
    id: "accept",
    label: "รับสภาพ",
    effect: "ยอดทั้งหมดเข้าคลังปกติ",
    field: "qty (Accepted Quantity)",
  },
  {
    id: "repack",
    label: "Repack",
    effect: "เข้าคลัง repack แยก รอแบ่งบรรจุใหม่",
    field: "rejected_warehouse = คลัง repack",
  },
  {
    id: "return",
    label: "ส่งคืน",
    effect: "ตัดออกจากยอดรับ แล้วออกใบคืนของผู้ขาย",
    field: "rejected_qty + Purchase Return",
  },
];

export const dispositionOf = (id: string) =>
  DISPOSITIONS.find((d) => d.id === id);

/** กี่ฟอร์มที่เปิดตัวเลือกนี้อยู่ — ใช้กันลบตัวที่ยังมีคนใช้ */
export const dispositionUsedBy = (id: string) =>
  QI_TEMPLATES.filter((t) => t.dispositions.includes(id)).length;

export function addDisposition(input: {
  label: string;
  effect: string;
  field: string;
}): Disposition {
  const d: Disposition = { id: uid("disp"), ...input };
  DISPOSITIONS.push(d);
  return d;
}

export function updateDisposition(
  id: string,
  patch: Partial<Omit<Disposition, "id">>
) {
  const d = DISPOSITIONS.find((x) => x.id === id);
  if (d) Object.assign(d, patch);
}

/** ลบได้เฉพาะตัวที่ไม่มีฟอร์มไหนเปิดอยู่ — ลบตัวที่ใช้อยู่แล้วใบเก่าจะอ้างค่าที่ไม่มี */
export function removeDisposition(id: string): boolean {
  if (dispositionUsedBy(id) > 0) return false;
  const i = DISPOSITIONS.findIndex((x) => x.id === id);
  if (i >= 0) DISPOSITIONS.splice(i, 1);
  return i >= 0;
}

// ---------------------------------------------------------------
// เทมเพลตหนึ่งฟอร์ม — Quality Inspection Template
// ---------------------------------------------------------------



/* ---------------------------------------------------------------
   รอบการตรวจ

   ERPNext ไม่มีเรื่องนี้เลย ใบตรวจของมันเกิดจากเอกสารสต็อกเท่านั้น
   (มีของเข้า มีใบสั่งผลิต) ไม่มีตัวเปิดใบเพราะ "ถึงกะแล้ว"

   แต่ฟอร์มอย่างตรวจวัตถุดิบในคลังวัดกันที่ความครบ ไม่ใช่ผลตรวจ — วันไหนไม่มีใบ
   คือวันที่ไม่มีใครทำ ซึ่งรู้ได้ก็ต่อเมื่อระบบสร้างใบรอไว้ล่วงหน้าแล้ว
   ไม่ใช่ไล่จากใบที่มีอยู่ เพราะใบที่ไม่มีอยู่คือสิ่งที่ต้องการเห็น
--------------------------------------------------------------- */

export type QcShift = { id: string; from: string; to: string };

/** วันในสัปดาห์ เริ่มจันทร์ ตรงกับลำดับคอลัมน์ในปฏิทิน */
export type Weekday = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export const WEEKDAYS: { id: Weekday; label: string }[] = [
  { id: "mon", label: "จ" },
  { id: "tue", label: "อ" },
  { id: "wed", label: "พ" },
  { id: "thu", label: "พฤ" },
  { id: "fri", label: "ศ" },
  { id: "sat", label: "ส" },
  { id: "sun", label: "อา" },
];

export const ALL_WEEKDAYS = WEEKDAYS.map((d) => d.id);

export type QiSchedule = {
  /** true = เปิดใบตามรอบเวลา ไม่ใช่รอให้มีเอกสารมาเรียก */
  recurring: boolean;
  /**
   * true = วันละใบเดียว ไม่สนว่าตรวจตอนไหนของวัน
   *
   * ต่างกับการตั้งกะเดียวครอบทั้งวัน (00:00–23:59) ตรงที่อันนั้นยังหลอกว่า
   * เวลามีความหมาย คนตั้งค่าต้องกรอกเลขที่ไม่ได้ใช้ และคนอ่านปฏิทินจะเห็น
   * ป้ายกะที่ไม่มีใครสนใจ
   */
  allDay: boolean;
  /**
   * หนึ่งช่วงเวลา = หนึ่งใบต่อวัน — ไม่ใช้เมื่อ allDay
   *
   * ไม่มีช่องเลือกวันคู่กัน เพราะวันทำงานไม่ใช่เรื่องของฟอร์ม — อ่านจาก
   * Holiday List ของบริษัท (weekly_off + holidays) ซึ่งเป็นที่เดียวที่
   * ตอบคำถามนี้อยู่แล้ว ตั้งซ้ำรายฟอร์มมีแต่จะตอบไม่ตรงกัน
   */
  slots: QcShift[];
};

export const DEFAULT_SCHEDULE: QiSchedule = {
  recurring: false,
  allDay: false,
  slots: [],
};

/** ช่วงที่คร่อมเที่ยงคืน — อ่านจากเวลาเอง ไม่ให้ติ๊กบอก จะได้ไม่ขัดกับเวลาจริง */
export const shiftOvernight = (s: QcShift) => s.to <= s.from;

export const shiftLabel = (s: QcShift) => `${s.from}–${s.to}`;

/** กี่ใบต่อวัน — วันละครั้ง หรือเท่าจำนวนกะที่ตั้งไว้ */
export const docsPerDay = (sch: QiSchedule) =>
  sch.allDay ? 1 : sch.slots.length;

/* ---------------------------------------------------------------
   ที่มาของใบ — อะไรเป็นตัวจุดชนวนให้เปิดใบตรวจ

   เป็นภาษาที่คนตั้งค่าใช้จริง ต่างจาก inspection_type ของ ERPNext ที่ตอบว่า
   "ของไหลไปทางไหน" ซึ่งเป็นภาษาของระบบบัญชีสต็อก ไม่ใช่ของคนหน้างาน

   ไม่เก็บเป็นฟิลด์ให้เลือก — อ่านออกมาจากที่ตั้งไว้แล้วทั้งหมด เก็บแยกเมื่อไหร่
   ก็มีวันที่คนเปิดรอบกะแล้วลืมแก้ป้าย แล้วป้ายจะโกหกตั้งแต่วันนั้น

   แกนนี้ทำนายสามเรื่องพร้อมกัน — ปฏิทินมีความหมายไหม ต้องเขียน scheduler ไหม
   และ ERPNext รับได้ไหม จึงไม่ต้องมีป้ายอื่นมาพูดเรื่องเดียวกันซ้ำอีก

   "สุ่มหรือไม่สุ่ม" ไม่ได้อยู่ในแกนนี้ เพราะมันคือวิธีเลือกตัวอย่าง ไม่ใช่ที่มา
   ฟอร์มที่ชื่อขึ้นต้นว่าสุ่มมีทั้งแบบมีเอกสารและไม่มี — ไปอยู่ที่ sample_size แทน
--------------------------------------------------------------- */

/* ---------------------------------------------------------------
   ฟอร์มนี้ตรวจอะไร

   เป็นช่องเดียวในหน้าตั้งค่าที่ต้องเลือกเอง เพราะอ่านจากอย่างอื่นไม่ได้ —
   ฟอร์มที่ยังไม่ได้ผูกกับอะไรเลย แยกไม่ออกว่าจะตรวจสินค้าหรือตรวจเครื่องจักร

   และเป็นตัวที่ตัดสินว่าใบตรวจจะไปเก็บที่ไหน เพราะ Quality Inspection ของ
   ERPNext บังคับ item_code — อะไรที่ไม่ใช่สินค้าจึงลงไม่ได้ ไม่ว่าจะตั้งค่าดีแค่ไหน
--------------------------------------------------------------- */

/*
   สองตัวเลือกเท่านั้น ไม่ใช่สี่ — เส้นแบ่งที่มีผลจริงมีเส้นเดียวคือ
   "ลง Quality Inspection ได้ไหม" ซึ่งขึ้นกับว่าเป็นสินค้าหรือไม่เท่านั้น
   เครื่องจักร คลัง และของที่ไม่ผูกกับอะไร เดินทางเดียวกันหมด — ไปอยู่ที่
   doctype ของเรา จึงไม่มีเหตุผลให้คนตั้งค่าต้องเลือกแยกตั้งแต่ช่องนี้

   แยกว่าเป็นเครื่องจักรหรือคลัง อ่านจากตัวที่ผูกไว้เอาทีหลังได้ (Dynamic Link
   ชี้ไป Asset หรือ Warehouse) ไม่ต้องเก็บคำตอบเดียวกันไว้สองที่
*/
export type Subject = "item" | "other";

export const SUBJECT: Record<
  Subject,
  { label: string; field: string; placeholder: string; store: string }
> = {
  item: {
    label: "สินค้า",
    field: "สินค้าที่ใช้ฟอร์มนี้",
    placeholder: "เลือกสินค้า",
    store: "Quality Inspection · item_code",
  },
  other: {
    label: "คลัง/เครื่องจักร/อื่นๆ",
    field: "คลังหรือเครื่องจักรที่ใช้ฟอร์มนี้",
    // ไม่มีรายการให้เลือกที่ฟอร์ม — ผู้ตรวจชี้ตัวที่ตรวจตอนเปิดใบ ผ่าน Dynamic
    // Link ที่อ่าน Asset / Warehouse ของจริง ไม่ใช่รายการที่เราทำขึ้นมาเอง
    placeholder: "ไม่ได้ผูกที่ฟอร์ม — ผู้ตรวจเลือกตอนเปิดใบ",
    store: "doctype ของเรา · Dynamic Link ไป Asset หรือ Warehouse",
  },
};

export const SUBJECT_KEYS = Object.keys(SUBJECT) as Subject[];

/** ตัวเลือกที่ผูกได้ เปลี่ยนตามว่าฟอร์มนี้ตรวจอะไร */
export const targetPool = (subject: Subject): string[] =>
  subject === "item" ? ITEM_POOL : [];

/**
 * เหตุผลทั้งหมดที่ทำให้ใบของฟอร์มนี้ลง Quality Inspection ไม่ได้
 *
 * คืนเป็นรายการ ไม่ใช่ true/false เพราะหน้าจอต้องบอกได้ว่า "ติดที่อะไร"
 * บอกแค่ว่าเป็น custom แล้วปล่อยให้เดาเอง คือสิ่งที่ทำให้คนตั้งค่าไม่กล้าแก้อะไร
 *
 * ไม่มีช่องให้เลือกเองว่าจะลง doctype ไหน — อ่านจากที่ตั้งไว้ทั้งหมด เพราะคำตอบ
 * มันอยู่ในนั้นอยู่แล้ว ให้เลือกซ้ำอีกช่องมีแต่จะตั้งขัดกันเองแล้วต้องมาเตือนทีหลัง
 * และคนตั้งค่าตอบได้ว่าฟอร์มนี้ตรวจอะไร แต่ตอบไม่ได้ว่าจะเอา doctype ไหน
 */
export function blockersOf(t: QiTemplate): string[] {
  const out: string[] = [];

  /* เงื่อนไขเดียวที่หัวใบ — ไม่มีเอกสารอ้างอิง = ไม่มีตัวเปิดใบ

     reference_type กับ reference_name เป็น reqd=1 ที่ไม่มี depends_on และ
     frappe._validate_mandatory ทำงานตอน save ไม่ใช่ตอน submit ใบที่ไม่มีเอกสาร
     เป็นต้นเรื่องจึงบันทึกแม้แต่ draft ไม่ได้ ต้องไปอยู่ doctype ของเราเอง

     เคยนับประเภทการตรวจกับการผูกสินค้าเป็นเงื่อนไขด้วย ซึ่งเป็นการถามเรื่อง
     เดียวกันสามรอบ — ฟอร์มที่ตรวจเครื่องจักรก็คือฟอร์มที่ไม่มีเอกสารอ้างอิง
     อยู่แล้ว ถามช่องเดียวพอ แล้วตั้งขัดกันเองไม่ได้ด้วย */
  if (t.refDocs.length === 0) out.push("ไม่ได้เลือกเอกสารอ้างอิง");

  // หัวข้อที่ดึงคลังหรือเครื่องจักรมา — Quality Inspection ไม่มีช่อง Link ไปหา
  for (const r of t.rows)
    if (r.kind === "system" && r.source && SOURCE[r.source].custom)
      out.push(`หัวข้อ “${SOURCE[r.source].label}”`);

  return out;
}


/**
 * ใบตรวจของฟอร์มนี้ลง Quality Inspection ได้ไหม
 *
 * เคยเช็คจาก subject อย่างเดียว ซึ่งตอบผิดกับฟอร์มสุ่มตรวจผลิตภัณฑ์สำเร็จรูป
 * ที่ตรวจสินค้าจริงแต่ไม่ได้เกิดจากเอกสาร
 */
export const usesQualityInspection = (t: QiTemplate) =>
  blockersOf(t).length === 0;

export type Origin = "doc" | "shift" | "manual";

export const ORIGIN: Record<
  Origin,
  { label: string; hint: string; tone: "success" | "warning" | "neutral" }
> = {
  doc: {
    label: "ตามเอกสาร",
    hint: "มีของเข้า-ออก หรือใบสั่งผลิตเป็นตัวเปิดใบ — ใช้ Quality Inspection มาตรฐานได้เลย",
    tone: "success",
  },
  shift: {
    label: "ตามรอบเวลา",
    hint: "ถึงกะแล้วเปิดใบเอง — ตัวใบใช้ Quality Inspection ได้ แต่ ERPNext ไม่มีตัวเปิดใบตามกะ ต้องเขียน scheduled job เพิ่ม",
    tone: "warning",
  },
  manual: {
    label: "เปิดเอง",
    hint: "ไม่มีเอกสารเป็นตัวเปิดใบ — reference_type เป็นฟิลด์บังคับของ ERPNext ฟอร์มแบบนี้จึงเป็น Quality Inspection ไม่ได้ ต้องทำ doctype แยก",
    tone: "neutral",
  },
};

export const ORIGIN_KEYS = Object.keys(ORIGIN) as Origin[];

/** รูปถ่ายประกอบ — บังคับเมื่อไม่ผ่านคือแบบที่ฟอร์มกระดาษใช้จริง */
export type PhotoMode = "off" | "optional" | "onFail";

export const PHOTO_LABEL: Record<PhotoMode, string> = {
  off: "ไม่ต้องแนบ",
  optional: "แนบได้ ไม่บังคับ",
  onFail: "บังคับเมื่อไม่ผ่าน",
};

export const PHOTO_KEYS = Object.keys(PHOTO_LABEL) as PhotoMode[];

export type QiTemplate = {
  id: string;
  /** quality_inspection_template_name */
  name: string;
  code: string;
  /** ปิดไว้ = ยังอยู่ในระบบแต่ไม่ถูกหยิบไปใช้กับใบตรวจใหม่ ของเก่าไม่กระทบ */
  active: boolean;
  /** คนที่สร้างฟอร์มนี้ */
  owner: string;
  /** คนที่แก้ล่าสุด — ไม่มีคือยังไม่เคยมีใครแก้หลังสร้าง */
  editor?: string;
  updatedAt: string;
  inspectionType: InspectionType;
  refDocs: RefDoc[];
  schedule: QiSchedule;
  /** ข้อควรระวังเฉพาะฟอร์มนี้ที่อ่านจากโครงไม่ได้ — ว่างคือไม่มีอะไรพิเศษ */
  note?: string;
  /**
   * พาไปหน้าอื่นแทนหน้าตั้งค่ามาตรฐาน — ปกติเว้นว่าง
   *
   * มีไว้ให้ฟอร์มตัวอย่างที่ยังไม่ได้ย้ายเข้าของจริง กดจากหน้ารายการแล้วไป
   * หน้าของมันเองได้โดยไม่ต้องไปยัดเงื่อนไขพิเศษไว้ในหน้าตั้งค่าตัวจริง
   */
  href?: string;
  rows: QiRow[];
  /**
   * รูปถ่ายประกอบใบตรวจ — ไม่มีใน Quality Inspection ต้องทำเป็น custom field
   *
   * ERPNext แนบไฟล์ได้อยู่แล้วทุก doctype แต่บังคับว่า "ต้องแนบเมื่อไม่ผ่าน"
   * ไม่ได้ เพราะเงื่อนไขนั้นขึ้นกับ status ที่เพิ่งคำนวณเสร็จ ต้องเขียน validate เพิ่ม
   */
  photo: PhotoMode;
  /** วันที่ฟอร์มนี้เริ่มใช้ได้ — ใบที่เปิดก่อนหน้านี้ยังใช้โครงเดิม */
  effectiveFrom: string;
  /** วันที่เลิกใช้ — ว่างคือยังไม่กำหนด */
  effectiveTo: string;
  /**
   * ผู้ตรวจตัดสินผลรวมทั้งใบเอง — manual_inspection ที่หัวใบ
   *
   * คนละตัวกับ manual_inspection รายแถว ตัวนี้ทำให้ inspect_and_set_status
   * ไม่เขียนทับ status ของหัวใบ ส่วนรายข้อยังคำนวณให้ตามปกติ
   * ใช้กับใบที่ข้อย่อยตกได้บ้าง แต่คนตรวจชี้ว่าทั้งใบยังรับได้
   */
  manualWholeDoc: boolean;
  /**
   * สุ่มได้หลายตัวอย่างต่อครั้ง — เป็นเรื่องของ "กี่ใบ" ไม่ใช่ "doctype ไหน"
   *
   * หนึ่งตัวอย่าง = หนึ่งใบ ไม่ใช่หนึ่งคอลัมน์ในใบเดียว เพราะ reading_1…reading_10
   * ไม่ได้แปลว่า "ของสิบชิ้น" มันแปลว่า "วัดของชิ้นเดียวสิบครั้ง" ซึ่งพิสูจน์ได้
   * จาก calculate_mean ที่เอาทุกค่ามาเฉลี่ยกัน และหนึ่งแถวมี status เดียว
   * บอกไม่ได้ว่าตัวอย่างไหนตก
   *
   * ERPNext มี make_quality_inspections ที่สร้างทีละหลายใบจากรายการสินค้าอยู่แล้ว
   * ตารางตัวอย่างจึงเป็นแค่หน้าจอ ที่เก็บยังเป็นของมาตรฐานทุกใบ
   */
  multiSample: boolean;
  subject: Subject;
  /**
   * สิ่งที่ผูกฟอร์มนี้ไว้ — เป็นสินค้า เครื่องจักร หรือคลัง ตาม subject
   *
   * ฝั่ง ERPNext ค่านี้อยู่ที่ Item ไม่ได้อยู่ที่เทมเพลต แต่คนตั้งค่าคิดจากฝั่งฟอร์ม
   * จึงให้ตั้งจากตรงนี้แล้วเขียนกลับไปที่ Item
   * ฟอร์มตรวจสินค้าที่ไม่ผูกไว้เลย = จะไม่มีวันถูกเรียกใช้
   */
  targets: string[];
  /** inspection_required_before_purchase / _before_delivery ที่ Item */
  requireBefore: boolean;
  /** id ของตัวเลือกที่ฟอร์มนี้เปิดให้ผู้ตรวจเลือก */
  dispositions: string[];
  /** มีข้อไม่ผ่านแล้วต้องเลือกให้ได้ก่อนบันทึก */
  requireDisposition: boolean;
};

export const ITEM_POOL = [
  "21-0-0 ฟูเจียน ผง",
  "46-0-0 ยูเรีย",
  "18-46-0 DAP",
  "ปุ๋ยสูตร 15-15-15 กระสอบ 50 กก.",
  "ปุ๋ยสูตร 16-20-0 กระสอบ 50 กก.",
  "ปุ๋ยจัมโบ้ Bulk",
];

let rowSeq = 0;
const rid = () => `row-seed-${++rowSeq}`;

/** สี่กะที่โรงงานเดินจริง สองกะกลางวัน สองกะกลางคืน */
const factoryShifts = (): QcShift[] => [
  { id: rid(), from: "08:00", to: "12:00" },
  { id: rid(), from: "13:00", to: "17:00" },
  { id: rid(), from: "20:00", to: "00:00" },
  { id: rid(), from: "01:00", to: "05:00" },
];

/** แถวตัวเลข — ช่วงต่ำ–สูง */
const range = (
  parameterId: string,
  min: number | null,
  max: number | null,
  readings = 1,
  criteria = "",
  remark: RemarkMode = "onFail"
): QiRow => ({
  id: rid(),
  kind: "text",
  parameterId,
  numeric: true,
  formulaBased: false,
  manualInspection: false,
  min,
  max,
  value: "",
  formula: "",
  readings,
  remark,
  criteria,
});

/** แถวข้อความ — ต้องตรงกับค่าที่ตั้งไว้ */
const value = (
  parameterId: string,
  v: string,
  criteria = "",
  remark: RemarkMode = "onFail"
): QiRow => ({
  id: rid(),
  kind: "text",
  parameterId,
  numeric: false,
  formulaBased: false,
  manualInspection: false,
  min: null,
  max: null,
  value: v,
  formula: "",
  readings: 1,
  remark,
  criteria,
});

/** แถวสูตร — หลายค่าคำนวณรวมกันเป็นเกณฑ์เดียว */
const formula = (
  parameterId: string,
  f: string,
  readings: number,
  criteria = "",
  remark: RemarkMode = "optional",
  labels?: string[]
): QiRow => ({
  id: rid(),
  kind: "text",
  parameterId,
  numeric: true,
  formulaBased: true,
  manualInspection: false,
  min: null,
  max: null,
  value: "",
  formula: f,
  readings,
  labels,
  remark,
  criteria,
});

/**
 * แปดหัวข้อของใบรายงานการตรวจสอบสินค้าสำเร็จรูป
 *
 * กระดาษมีคอลัมน์ "ตรวจครั้งที่ 1/2/3" ซึ่งเคยทำเป็น 24 แถวในเทมเพลตเดียว
 * เพราะ get_item_specification_details คัดลอกแถวแบบหนึ่งต่อหนึ่ง ไม่คูณให้
 *
 * ซึ่งผิดวิธี — สามครั้งนั้นคือ "สามใบ" ไม่ใช่ "ยี่สิบสี่แถวในใบเดียว"
 * เทมเพลตหนึ่งอันเอาไปใช้กี่ใบก็ได้ ไม่มีการจองและไม่มีเช็คซ้ำ
 *
 * ทำเป็นสามใบแล้วได้ของที่ยี่สิบสี่แถวให้ไม่ได้เลย — เวลาของแต่ละรอบ
 * (creation ของใบ) ชื่อผู้ตรวจของแต่ละรอบ (inspected_by) และผลรวมของแต่ละรอบ
 * (status ของใบ) อีกทั้งรอบที่ยังไม่ถึงก็ยังไม่มีใบ ไม่ใช่โผล่มาค้างทั้งยี่สิบสี่แถว
 */
const fgRound = (): QiRow[] => [
  manual("p-weight", "น้ำหนักกระสอบ 50 กก. ต้องไม่ต่ำกว่า 50.2 กก."),
  manual("p-formula", "ตัวเลขแสดงประมาณธาตุอาหารรับรอง"),
  manual("p-seam", "ระยะห่างฝีเข็มต้องสม่ำเสมอ ต้องเป็นด้ายคู่"),
  manual("p-smell", "ไม่มีกลิ่น หรือมีกลิ่นสารเคมีอ่อน ๆ"),
  manual("p-touch", "สีของเม็ดปุ๋ยต้องไม่ติดมือ"),
  manual("p-bag-formula", "ปุ๋ยหน้ากระสอบต้องตรงกับเนื้อปุ๋ยข้างใน"),
  manual("p-sticker", "สติ๊กเกอร์ต้องมีทุกกระสอบ"),
  manual("p-moist", "ไม่เกิน 80%"),
];

/**
 * แถวที่ผู้ตรวจเลือกจากรายการของระบบ — ไม่มีเกณฑ์ให้ระบบตัดสิน
 *
 * ชื่อหัวข้อคือตัวแหล่งข้อมูลไปในตัว จึงไม่ต้องมี parameterId
 */
const fromSystem = (
  source: SourceId,
  criteria = "",
  remark: RemarkMode = "onFail"
): QiRow => ({
  id: rid(),
  kind: "system",
  source,
  parameterId: "",
  numeric: false,
  formulaBased: false,
  manualInspection: true,
  min: null,
  max: null,
  value: "",
  formula: "",
  readings: 1,
  remark,
  criteria,
});

/** แถวที่ระบบไม่ตัดสิน ผู้ตรวจติ๊กเอง */
const manual = (
  parameterId: string,
  criteria = "",
  remark: RemarkMode = "onFail"
): QiRow => ({
  id: rid(),
  kind: "text",
  parameterId,
  numeric: false,
  formulaBased: false,
  manualInspection: true,
  min: null,
  max: null,
  value: "",
  formula: "",
  readings: 1,
  remark,
  criteria,
});

/* ---------------------------------------------------------------
   ฟอร์มจริงทั้งสิบที่โรงงานใช้อยู่ แปลงเป็นโครงของ ERPNext ทีละอัน
   ชื่อกับรหัสฟอร์มตรงกับที่อยู่ในเมนูตรวจสอบ QC เดิม จะได้เทียบกันได้ทีละใบ
   สามอันท้ายกับสองอันที่เป็นถังคือกลุ่มที่ลงตรง ๆ ไม่ได้ ดูที่ป้าย fit
--------------------------------------------------------------- */

/* ---------------------------------------------------------------
   ฟอร์มจริงที่โรงงานใช้ แปลงเป็นโครงของ ERPNext ทีละอัน

   เรียงตามการแบ่งที่ฝั่งโรงงานใช้เอง — อ้างอิงเอกสาร / สุ่มตรวจ / ตามรอบกะ /
   เมื่อมี request แต่ป้าย "ที่มาของใบ" ในหน้าจออ่านจากโครงจริงไม่ได้อ่านจาก
   กลุ่มที่ตั้งชื่อไว้ จึงมีบางใบที่อยู่คนละกลุ่มกับที่ชื่อบอก เช่นสุ่มตรวจ
   ระหว่างผลิตมีเอกสารอ้างอิง เลยนับเป็น "ตามเอกสาร" ทั้งที่ชื่อขึ้นต้นว่าสุ่ม
--------------------------------------------------------------- */

export const QI_TEMPLATES: QiTemplate[] = [
  // ---------- 1 อ้างอิงเอกสาร ----------
  {
    id: "t-rm",
    subject: "item",
    name: "ตรวจรับวัตถุดิบ (RM)",
    code: "FM-QC-01-01",
    active: true,
    owner: "อลิสา พรสุขสิริ",
    updatedAt: "24/09/2026",
    inspectionType: "incoming",
    refDocs: ["purchaseReceipt"],
    rows: [
      formula(
        "p-size",
        "(reading_2 + reading_3) / 2500 * 100 >= 80",
        4,
        "เม็ดปุ๋ยขนาด 2–4 มม. ไม่น้อยกว่า 80% ของตัวอย่าง 2,500 g",
        "optional",
        [
          "น้ำหนักเม็ดปุ๋ย 4 มม.",
          "น้ำหนักเม็ดปุ๋ย 3.15 มม.",
          "น้ำหนักเม็ดปุ๋ย 2 มม.",
          "น้ำหนักเม็ดปุ๋ย 0.5 มม.",
        ]
      ),
      // ใช้ mean ที่ ERPNext เตรียมไว้ให้ ไม่ต้องบวกเองแล้วหารห้า —
      // เขียนเองแล้วเปลี่ยนจำนวนครั้งที่วัดเมื่อไหร่ สูตรพังเงียบ ๆ เมื่อนั้น
      formula("p-hard", "mean >= 0.4", 5, "ค่าเฉลี่ยความแข็งของเม็ดปุ๋ย ไม่น้อยกว่า 0.4 กก."),
      range("p-moist", 0, 10, 1, "ความชื้นของเม็ดปุ๋ย น้อยกว่า 10%"),
    ],
    photo: "onFail",
    effectiveFrom: "01/09/2026",
    effectiveTo: "",
    manualWholeDoc: false,
    multiSample: false,
    targets: ["21-0-0 ฟูเจียน ผง", "46-0-0 ยูเรีย", "18-46-0 DAP"],
    requireBefore: true,
    dispositions: ["accept", "repack", "return"],
    requireDisposition: true,
    schedule: { ...DEFAULT_SCHEDULE },
  },
  {
    id: "t-pre",
    subject: "item",
    name: "ตรวจก่อนผลิต",
    code: "FM-QC-01-03",
    active: true,
    owner: "อลิสา พรสุขสิริ",
    updatedAt: "24/09/2026",
    inspectionType: "inProcess",
    refDocs: ["jobCard"],
    rows: [
      manual("p-clean"),
      value("p-formula", "ตรง"),
      range("p-temp", 20, 35, 1, "off"),
    ],
    photo: "onFail",
    effectiveFrom: "01/09/2026",
    effectiveTo: "",
    manualWholeDoc: false,
    multiSample: false,
    targets: ["ปุ๋ยสูตร 15-15-15 กระสอบ 50 กก."],
    requireBefore: false,
    dispositions: [],
    requireDisposition: false,
    schedule: { ...DEFAULT_SCHEDULE },
    note: "ERPNext ไม่มีติ๊กบังคับตรวจก่อนผลิตที่ข้อมูลสินค้า มีแค่ก่อนซื้อกับก่อนส่ง — ถ้าต้องห้ามเดินเครื่องจนกว่าจะตรวจ ต้องเขียน validation เอง",
  },
  {
    id: "t-post",
    subject: "item",
    name: "ตรวจหลังผลิต",
    code: "FM-QC-01-04",
    active: true,
    owner: "อลิสา พรสุขสิริ",
    updatedAt: "24/09/2026",
    inspectionType: "inProcess",
    refDocs: ["stockEntry"],
    rows: [
      range("p-weight", 49.5, 50.5, 5),
      range("p-moist", 0, 2),
      formula("p-size", "(reading_2 + reading_3) / 2500 * 100 >= 80", 4),
    ],
    photo: "onFail",
    effectiveFrom: "01/09/2026",
    effectiveTo: "",
    manualWholeDoc: false,
    multiSample: false,
    targets: ["ปุ๋ยสูตร 15-15-15 กระสอบ 50 กก.", "ปุ๋ยสูตร 16-20-0 กระสอบ 50 กก."],
    requireBefore: false,
    dispositions: ["accept", "repack"],
    requireDisposition: true,
    schedule: { ...DEFAULT_SCHEDULE },
  },

  // ---------- 2 สุ่มตรวจ ไม่อ้างอิงเอกสาร ----------
  {
    id: "t-machine",
    subject: "other",
    name: "สุ่มตรวจเครื่องจักร",
    code: "FM-QC-02-01",
    active: true,
    owner: "อลิสา พรสุขสิริ",
    updatedAt: "24/09/2026",
    inspectionType: "inProcess",
    refDocs: [],
    // ฟอร์มกระดาษแบ่งเป็น 1.1 / 1.2 / 1.3 แต่ตัดหัวข้อย่อยออกหมด
    // ทุกข้อเป็นหัวข้อหลักเท่ากัน เลขข้อเดินต่อกันรวดเดียว
    rows: [
      // ฟอร์มกระดาษมีทั้งช่องคีย์ค่าและปุ่มปกติ/ผิดปกติในข้อเดียว
      // = numeric + manual_inspection ติ๊กคู่กัน ซึ่ง ERPNext รองรับจริง
      {
        ...range("p-moist", null, 80, 1, "ควบคุมให้อยู่ในเกณฑ์มาตรฐาน ไม่เกิน 80"),
        manualInspection: true,
      },
      manual(
        "p-belt",
        "ตรวจสอบความตึงและการทำงานของสายพานให้อยู่ในสภาพพร้อมใช้"
      ),
      manual(
        "p-belt-care",
        "โรยผงถ่านขึ้นที่สายพาน เพื่อป้องกันการลื่นไถลและความชื้นสะสม"
      ),
      manual("p-mixer", "เป่าฝุ่นละอองออกจากถังผสมให้สะอาด"),
      manual("p-sieve", "เคาะเศษวัสดุที่อุดตันออก เพื่อป้องกันการไหลติดขัด"),
      manual("p-sewing", "ตรวจเช็คกลไกและการทำงานของเครื่องเย็บ"),
      manual("p-printer", "ตรวจสอบความคมชัดและระบบการพิมพ์ให้ถูกต้อง"),
    ],
    photo: "onFail",
    effectiveFrom: "01/09/2026",
    effectiveTo: "",
    manualWholeDoc: false,
    multiSample: false,
    targets: [],
    requireBefore: false,
    dispositions: [],
    requireDisposition: false,
    schedule: { ...DEFAULT_SCHEDULE },
    note: "ตรวจเครื่องจักร ไม่ใช่ตรวจสินค้า จึงไม่มี item_code ให้ใส่ — Asset Maintenance Log ของ ERPNext ก็ใช้ไม่ได้ เพราะหนึ่ง log เก็บได้งานเดียว ไม่มีตารางข้อตรวจ ต้องทำ doctype ของเราเอง",
  },
  {
    id: "t-warehouse",
    subject: "other",
    name: "สุ่มตรวจคลังสินค้า",
    code: "FM-QC-02-02",
    active: true,
    owner: "อลิสา พรสุขสิริ",
    updatedAt: "24/09/2026",
    inspectionType: "inProcess",
    refDocs: [],
    // แปดข้อตรงตามฟอร์มกระดาษ FM-QC-02-04 เรียงลำดับเดิม ไม่แบ่งกลุ่ม
    rows: [
      manual("p-bag-intact", "กระสอบไม่ฉีกขาด ไม่มีรอยรั่ว"),
      manual("p-print-clear", "ตัวเลขสูตรปุ๋ยบนกระสอบอ่านออกชัดเจน"),
      manual("p-caking", "ปุ๋ยไม่จับตัวเป็นก้อนแข็ง"),
      manual("p-wall-gap", "กองสินค้าห่างจากผนังตามระยะที่กำหนด"),
      manual("p-stack-height", "วางซ้อนไม่เกินจำนวนชั้นที่กำหนด"),
      manual("p-stain", "ไม่มีคราบน้ำหรือคราบสกปรกบนกระสอบและพื้น"),
      manual("p-area-climate", "อุณหภูมิและความชื้นในบริเวณอยู่ในเกณฑ์ที่กำหนด"),
      manual("p-clean-area", "พื้นที่จัดเก็บสะอาด ไม่มีเศษวัสดุตกค้าง"),
    ],
    photo: "onFail",
    effectiveFrom: "01/09/2026",
    effectiveTo: "",
    manualWholeDoc: false,
    multiSample: false,
    targets: [],
    requireBefore: false,
    dispositions: [],
    requireDisposition: false,
    schedule: { ...DEFAULT_SCHEDULE },
    note: "ตรวจสถานที่ ไม่ใช่ของชิ้นใดชิ้นหนึ่ง — ต้องทำ doctype แยก ซึ่งใช้ตัวเดียวกับตรวจเครื่องจักรได้ และได้คำว่า ปกติ/ผิดปกติ ตามฟอร์มกระดาษกลับมาด้วย",
  },
  {
    id: "t-fg-sample",
    subject: "other",
    name: "สุ่มตรวจผลิตภัณฑ์สำเร็จรูป",
    code: "FM-QC-02-06",
    active: true,
    owner: "อลิสา พรสุขสิริ",
    updatedAt: "24/09/2026",
    inspectionType: "inProcess",
    refDocs: [],
    /* สี่คอลัมน์ตรงตามกระดาษ — สูตร เครื่องผลิต น้ำหนัก สลิง
       คอลัมน์ วันที่ / ตรวจสอบ ผ่าน-ไม่ผ่าน / หมายเหตุ ไม่ได้ตั้งเป็นหัวข้อ
       เพราะมากับตัวใบอยู่แล้ว (report_date · status · remarks)
       ตั้งซ้ำคือได้สองที่ที่ขัดกันเองวันหนึ่ง

       เกณฑ์บนหัวกระดาษเป็นเกณฑ์ของทั้งแถว ไม่ใช่ของคอลัมน์ไหนคอลัมน์หนึ่ง
       วางไว้ที่สูตรซึ่งเป็นตัวระบุว่ากระสอบไหน */
    rows: [
      fromSystem("item", "การเย็บด้ายต้องติด ตัวเลขของกระสอบต้องชัด"),
      fromSystem("machine"),
      range("p-weight", null, null, 1, "ชั่งแล้วบันทึกน้ำหนักที่ได้"),
      value("p-sling", "30 / 35 / 40", "ต้องตรงกับที่ระบุในใบสั่งผลิต"),
    ],
    photo: "onFail",
    effectiveFrom: "01/09/2026",
    effectiveTo: "",
    manualWholeDoc: false,
    // หนึ่งกระสอบที่สุ่ม = หนึ่งใบ ไม่ใช่หนึ่งคอลัมน์ในใบเดียว
    multiSample: true,
    targets: [],
    requireBefore: false,
    dispositions: [],
    requireDisposition: false,
    schedule: { ...DEFAULT_SCHEDULE },
    note: "สุ่มเองตามรอบผลิต ไม่มีเอกสารเป็นตัวเปิดใบ — reference_type เป็น reqd ของ Quality Inspection ใบนี้จึงไปอยู่ doctype QC Check ตัวเดียวกับสุ่มตรวจเครื่องจักรและคลังสินค้า · และสูตรเปลี่ยนไปทุกกระสอบที่สุ่ม ซึ่ง Quality Inspection รับไม่ได้อยู่แล้วเพราะ item_code มีใบละตัวเดียว ส่วนตาราง readings ไม่มีช่องสินค้าเลย",
  },
  {
    id: "t-inproc",
    subject: "item",
    name: "ตรวจรับสินค้า (External / Finish Good)",
    code: "FM-QC-02-03",
    active: true,
    owner: "อลิสา พรสุขสิริ",
    updatedAt: "24/09/2026",
    inspectionType: "incoming",
    refDocs: ["purchaseReceipt", "subcontractingReceipt"],
    /* ทุกข้อเป็นติ๊กผ่าน/ไม่ผ่านล้วน ไม่มีช่องคีย์ค่า — ตรงกับกระดาษที่มีแต่
       ช่องติ๊กกับคอลัมน์เกณฑ์มาตรฐานให้อ่าน แม้แต่ข้อน้ำหนักกับความชื้นที่มี
       ตัวเลขในเกณฑ์ ผู้ตรวจก็ชั่งแล้วติ๊กเอา ไม่ได้คีย์ตัวเลขลงใบ

       แปดแถว ไม่ใช่ยี่สิบสี่ — "ตรวจครั้งที่ 1/2/3" บนกระดาษคือเปิดใบด้วย
       เทมเพลตนี้สามรอบ ไม่ใช่สามชุดแถวในใบเดียว */
    rows: fgRound(),
    photo: "onFail",
    effectiveFrom: "01/09/2026",
    effectiveTo: "",
    manualWholeDoc: false,
    multiSample: false,
    targets: ["ปุ๋ยสูตร 15-15-15 กระสอบ 50 กก."],
    requireBefore: true,
    dispositions: ["accept", "repack"],
    requireDisposition: true,
    // ใบเกิดจากเอกสารรับของ ไม่ใช่ตามรอบเวลา — คอลัมน์ "ตรวจครั้งที่ 1/2/3"
    // ของกระดาษเป็นการตรวจซ้ำในการรับครั้งเดียวกัน ไม่ใช่สามกะในหนึ่งวัน
    schedule: { ...DEFAULT_SCHEDULE },
  },

  // ---------- 3 ตรวจตามรอบกะ ----------
  {
    id: "t-tank-rm",
    // ตรวจถัง ไม่ใช่ตรวจของที่กำลังเคลื่อนไหวตามเอกสาร — ใบจึงไม่มีสินค้าและ
    // ไม่มีเอกสารอ้างอิง ซึ่ง Quality Inspection รับไม่ได้เพราะบังคับทั้งสองอย่าง
    subject: "other",
    name: "ตรวจวัตถุดิบในคลัง",
    code: "FM-QC-03-01",
    active: true,
    owner: "อลิสา พรสุขสิริ",
    updatedAt: "24/09/2026",
    inspectionType: "inProcess",
    // ใบเกิดจากนาฬิกา ไม่ได้เกิดจากเอกสาร — เว้นว่างไว้ให้ตรงกับความจริง
    refDocs: [],
    // หนึ่งวัตถุดิบคือหนึ่งข้อ ติ๊กปกติ/ผิดปกติ ไม่มีค่าให้คีย์ ตามใบจริง
    rows: [
      manual("p-rm-4205"),
      manual("p-rm-br"),
      manual("p-rm-mop"),
      manual("p-rm-mg"),
      manual("p-rm-dap"),
      manual("p-rm-amsu"),
      manual("p-rm-urea"),
    ],
    photo: "onFail",
    effectiveFrom: "01/09/2026",
    effectiveTo: "",
    manualWholeDoc: false,
    multiSample: false,
    targets: [],
    requireBefore: false,
    dispositions: [],
    requireDisposition: false,
    // สี่กะต่อวัน เฉพาะวันทำงาน — วันหยุดมาจาก Holiday List ของบริษัท
    schedule: {
      recurring: true,
      allDay: false,
      slots: factoryShifts(),
    },
    note: "ตรวจถังตามกะ ไม่มีเอกสารและไม่มีสินค้าผูก — Quality Inspection บังคับ reference_type กับ item_code จึงลงไม่ได้ ใบนี้ไปอยู่ doctype QC Check ตัวเดียวกับสุ่มตรวจเครื่องจักรและคลังสินค้า · และไม่บังคับตรวจครบทุกข้อ ตรวจเท่าที่มีในถัง ซึ่ง Quality Inspection ก็ทำไม่ได้เพราะบังคับว่าทุกแถวต้องมีผล",
  },
  {
    id: "t-tank-fg",
    subject: "item",
    name: "ตรวจสินค้าในคลัง",
    code: "FM-QC-03-02",
    active: true,
    owner: "อลิสา พรสุขสิริ",
    updatedAt: "24/09/2026",
    inspectionType: "inProcess",
    refDocs: ["stockEntry"],
    rows: [
      range("p-moist", 0, 2),
      range("p-warehouse-temp", 20, 35),
      value("p-bag", "ปกติ"),
    ],
    photo: "onFail",
    effectiveFrom: "01/09/2026",
    effectiveTo: "",
    manualWholeDoc: false,
    multiSample: false,
    targets: ["ปุ๋ยสูตร 15-15-15 กระสอบ 50 กก."],
    requireBefore: false,
    dispositions: [],
    requireDisposition: false,
    schedule: {
      recurring: true,
      // ฟอร์มนี้ขอแค่ตรวจสักครั้งในวัน ไม่ได้ผูกกับกะ
      allDay: true,
      slots: [],
    },
  },
  {
    id: "t-issue",
    subject: "item",
    name: "ตรวจสอบการจ่ายปุ๋ย",
    code: "FM-QC-03-03",
    active: true,
    owner: "อลิสา พรสุขสิริ",
    updatedAt: "24/09/2026",
    inspectionType: "outgoing",
    refDocs: ["deliveryNote"],
    rows: [range("p-weight", 49.5, 50.5, 3), value("p-bag", "ปกติ")],
    photo: "onFail",
    effectiveFrom: "01/09/2026",
    effectiveTo: "",
    manualWholeDoc: false,
    multiSample: false,
    targets: ["ปุ๋ยสูตร 15-15-15 กระสอบ 50 กก.", "ปุ๋ยสูตร 16-20-0 กระสอบ 50 กก."],
    requireBefore: false,
    dispositions: ["accept", "repack"],
    requireDisposition: true,
    schedule: { ...DEFAULT_SCHEDULE },
    note: "ถ้าใบเดียวสุ่มหลายสูตรพร้อมกัน ต้องแตกเป็นหลายใบ (ใบละสินค้า) หรือทำหน้าจอที่กดครั้งเดียวแล้วยิงสร้างหลายใบ",
  },

  // ---------- 4 เมื่อมี request เข้ามา ----------
  {
    id: "t-complaint",
    subject: "other",
    name: "ร้องเรียนลูกค้า",
    code: "FM-QC-04-01",
    active: false,
    owner: "อลิสา พรสุขสิริ",
    updatedAt: "24/09/2026",
    inspectionType: "outgoing",
    refDocs: [],
    rows: [value("p-complaint", "รับเรื่องแล้ว"), manual("p-trace")],
    photo: "onFail",
    effectiveFrom: "01/09/2026",
    effectiveTo: "",
    manualWholeDoc: false,
    multiSample: false,
    targets: [],
    requireBefore: false,
    dispositions: ["accept", "return"],
    requireDisposition: true,
    schedule: { ...DEFAULT_SCHEDULE },
    note: "ไม่ใช่การตรวจของ แต่เป็นการรับเรื่อง — ERPNext มีให้แล้วในโมดูล Quality Management: Quality Feedback รับเรื่อง → Non Conformance บันทึกสิ่งที่ไม่เป็นไปตามเกณฑ์ → Quality Action ตามแก้จนจบ ควรใช้ของมันแทนทำเอง",
  },
  {
    id: "t-coa",
    subject: "other",
    name: "บันทึกการรับเอกสาร COA",
    code: "FM-QC-04-02",
    active: true,
    owner: "อลิสา พรสุขสิริ",
    updatedAt: "24/09/2026",
    inspectionType: "incoming",
    refDocs: [],
    rows: [value("p-coa-complete", "ครบ"), value("p-coa-match", "ตรง")],
    photo: "onFail",
    effectiveFrom: "01/09/2026",
    effectiveTo: "",
    manualWholeDoc: false,
    multiSample: false,
    targets: [],
    requireBefore: false,
    dispositions: [],
    requireDisposition: false,
    schedule: { ...DEFAULT_SCHEDULE },
    note: "เป็นทะเบียนรับเอกสาร วันหนึ่งรับกี่ใบก็ได้ ไม่ใช่การตรวจสินค้า — ต้องทำ doctype แยกที่เพิ่มแถวเองได้",
  },
];

/** ที่อยู่ของฟอร์มหนึ่งใบ — ฟอร์มตัวอย่างมีหน้าของตัวเอง ที่เหลือใช้หน้ามาตรฐาน */
export const hrefOf = (t: QiTemplate) => t.href ?? `/qc/setup-erp/${t.id}`;

export const templateOf = (id: string) => QI_TEMPLATES.find((t) => t.id === id);

/** ที่มาของใบ — อ่านจากโครงฟอร์ม ไม่ได้เก็บแยก */
/** เปิด/ปิดใช้งานฟอร์ม — ไม่มีหลังบ้านจริง แก้ในหน่วยความจำของแท็บ */
export function setTemplateActive(id: string, on: boolean) {
  const t = QI_TEMPLATES.find((x) => x.id === id);
  if (t) t.active = on;
}

export const originOf = (t: QiTemplate): Origin =>
  t.schedule.recurring ? "shift" : t.refDocs.length > 0 ? "doc" : "manual";

// ---------------------------------------------------------------
// การบังคับใช้ระดับระบบ — Stock Settings
//
// ค่าพวกนี้เป็นของทั้งระบบ ไม่ใช่รายฟอร์ม เขียนไว้ในหน้าตั้งค่าให้ชัด
// ไม่งั้นจะมีคนเข้าใจว่าตั้งแยกรายวัตถุดิบได้ แล้วไปสัญญากับหน้างานไว้
// ---------------------------------------------------------------

export type GuardAction = "stop" | "warn";

export const GUARD_LABEL: Record<GuardAction, string> = {
  stop: "ห้ามผ่าน (Stop)",
  warn: "เตือนแต่ไปต่อได้ (Warn)",
};

export type StockGuard = {
  /** action_if_quality_inspection_is_rejected */
  onRejected: GuardAction;
  /** action_if_quality_inspection_is_not_submitted */
  onNotSubmitted: GuardAction;
  /** allow_to_make_quality_inspection_after_purchase_or_delivery */
  allowAfter: boolean;
};

export const DEFAULT_GUARD: StockGuard = {
  onRejected: "stop",
  onNotSubmitted: "stop",
  allowAfter: false,
};

// ---------------------------------------------------------------
// ตัวช่วยอ่านค่า
// ---------------------------------------------------------------

/** เกณฑ์ที่ระบบใช้ตัดสิน เขียนเป็นคำอ่านได้ — ติ๊กผู้ตรวจเลือกผลผ่าน/ไม่ผ่านเองต่อท้ายถ้ามี */
export function describeCriteria(row: QiRow): string {
  const unit = paramOf(row.parameterId)?.unit ?? "";
  const u = unit ? ` ${unit}` : "";
  const manual = row.manualInspection ? " · ผู้ตรวจเลือกผลผ่าน/ไม่ผ่านเอง" : "";

  if (row.formulaBased)
    return (row.formula || "ยังไม่ได้เขียนสูตร") + manual;

  if (row.numeric) {
    // ERPNext เทียบ flt(min_value) <= v <= flt(max_value) เสมอ ไม่มีฝั่งไหน
    // เป็น "ไม่จำกัด" — เว้นว่างคือศูนย์ จึงอ่านออกมาเป็นช่วงเต็มทุกครั้ง
    return `${row.min ?? 0}–${row.max ?? 0}${u}${manual}`;
  }

  if (row.value) return `ต้องเป็น "${row.value}"${manual}`;
  return row.manualInspection ? "ผู้ตรวจเลือกผลผ่าน/ไม่ผ่านเอง" : "ยังไม่ได้ตั้งค่าที่ผ่าน";
}

/** ระบบคำนวณผลให้ไหม — ติ๊ก manual แล้ว ERPNext ข้ามการตัดสินทั้งหมด */
export const autoJudged = (row: QiRow) => !row.manualInspection;

/**
 * แปลติ๊กสามตัวเป็นประโยคเดียวที่อ่านแล้วรู้เลยว่าผู้ตรวจจะเจออะไร
 *
 * ติ๊กสามตัวให้ความหมายได้แปดแบบ ซึ่งคนตั้งฟอร์มไม่ควรต้องมานั่งไล่กฎในหัวเอง
 * โดยเฉพาะชุด "ติ๊กอย่างเดียว" ที่ใช้บ่อยที่สุดในฟอร์มกระดาษ แต่เกิดจากการ
 * ไม่ติ๊กตัวหนึ่งบวกติ๊กอีกตัวหนึ่ง ซึ่งมองจากติ๊กเปล่า ๆ ไม่ออกเลย
 */
export function explainRow(row: QiRow): string {
  const n = row.readings;
  const input = row.numeric
    ? `ผู้ตรวจคีย์ตัวเลข ${n} ค่า`
    : "ผู้ตรวจคีย์ข้อความ";

  if (row.manualInspection) {
    if (!row.numeric && !row.formulaBased)
      return "ผู้ตรวจกดผ่าน/ไม่ผ่านอย่างเดียว ไม่ต้องคีย์ค่า";
    if (row.formulaBased)
      return `${input} แล้วกดผ่าน/ไม่ผ่านเอง — สูตรที่เขียนไว้จะไม่ถูกใช้`;
    return `${input} แล้วกดผ่าน/ไม่ผ่านเอง — ช่วงที่ตั้งไว้เป็นแค่ตัวเลขอ้างอิง`;
  }

  if (row.formulaBased) return `${input} ระบบตัดสินจากสูตร`;
  if (row.numeric) return `${input} ระบบเทียบกับช่วงต่ำ–สูง`;
  return "ผู้ตรวจคีย์ข้อความ ระบบเทียบกับค่าที่ถือว่าผ่าน";
}

/** ชื่อช่องที่ผู้ตรวจจะเห็นในใบตรวจจริง — ตรงกับ reading_1 … reading_n */
export function readingLabels(row: QiRow): string[] {
  const p = paramOf(row.parameterId);
  const unit = p?.unit ? ` (${p.unit})` : "";
  const named = (i: number) => row.labels?.[i]?.trim() ?? "";

  // ช่องเดียวและไม่ได้ตั้งชื่อเอง = ใช้ชื่อหัวข้อเป็นป้ายช่อง ไม่ต้องเขียน "ครั้งที่ 1"
  if (row.readings === 1 && named(0) === "")
    return [`${p?.name ?? ""}${unit}`];

  return Array.from(
    { length: row.readings },
    (_, i) => `${named(i) || `ครั้งที่ ${i + 1}`}${unit}`
  );
}

export const usedByCount = (parameterId: string) =>
  QI_TEMPLATES.filter((t) => t.rows.some((r) => r.parameterId === parameterId))
    .length;

let seq = 0;
/** เรียกเฉพาะใน event handler — กัน hydration ไม่ตรง */
export const uid = (prefix: string) => `${prefix}-${++seq}`;

// ---------------------------------------------------------------
// สร้างของใหม่
//
// ไม่มีหลังบ้านจริง ของที่สร้างใหม่จึงต่อท้ายอาเรย์ในไฟล์นี้เลย อยู่ได้จนรีเฟรช
// เก็บไว้ที่นี่ไม่ใช่ใน state ของหน้ารวม เพราะสร้างเทมเพลตแล้วต้องเด้งไปหน้า
// ตั้งค่าของมันทันที ซึ่งเป็นคนละหน้า ถ้าผูกไว้กับหน้าเดียวจะเปิดไปเจอ "ไม่พบเทมเพลต"
// ---------------------------------------------------------------

export function addParameter(input: {
  name: string;
  group: string;
  unit: string;
  description?: string;
}): QiParameter {
  const p: QiParameter = { id: uid("p"), ...input };
  QI_PARAMETERS.push(p);
  return p;
}

/**
 * แก้หัวข้อในทะเบียน
 *
 * ชื่อหัวข้อคือ ID ของเอกสารใน ERPNext การเปลี่ยนชื่อจึงเป็นการ rename ที่ต้อง
 * ให้ Frappe ตามไปแก้ลิงก์ในใบตรวจเก่าให้ด้วย ไม่ใช่แค่แก้ข้อความ
 */
export function updateParameter(
  id: string,
  patch: Partial<Omit<QiParameter, "id">>
) {
  const p = QI_PARAMETERS.find((x) => x.id === id);
  if (p) Object.assign(p, patch);
}

/**
 * ลบหัวข้อออกจากทะเบียน — ได้เฉพาะตัวที่ไม่มีฟอร์มไหนใช้
 *
 * ลบตัวที่ใช้อยู่ไม่ได้ เพราะใบตรวจเก่าที่อ้างชื่อนี้ไว้จะชี้ไปหาของที่ไม่มีแล้ว
 * ERPNext เองก็กันไว้แบบเดียวกัน (ลบ master ที่มี Link ค้างอยู่ไม่ได้)
 */
export function removeParameter(id: string): boolean {
  if (usedByCount(id) > 0) return false;
  const i = QI_PARAMETERS.findIndex((x) => x.id === id);
  if (i >= 0) QI_PARAMETERS.splice(i, 1);
  return i >= 0;
}

/**
 * id ปลอมของรายงานที่ยังไม่ได้สร้าง — /qc/setup-erp/new
 *
 * กด "เพิ่มรายงาน" แล้วเข้าหน้าตั้งค่าเลย ไม่ผ่านกล่องถามชื่อก่อน หน้าที่เปิด
 * ขึ้นมาจึงต้องมีร่างให้แก้ทั้งที่ยังไม่มีอะไรในรายการ ใช้ id นี้เป็นตัวบอก
 */
export const NEW_TEMPLATE_ID = "new";

/**
 * ร่างรายงานเปล่า — ยังไม่ได้ลงรายการ
 *
 * ตั้งใจไม่ push เข้า QI_TEMPLATES ตรงนี้ เพราะคนที่กดเพิ่มแล้วเปลี่ยนใจกดย้อนกลับ
 * ต้องไม่ทิ้งรายงานไร้ชื่อค้างไว้ในรายการให้คนอื่นมาเจอ เข้ารายการตอนกดบันทึก
 */
export const blankTemplate = (): QiTemplate => ({
  id: uid("t"),
  name: "",
  code: "",
  active: false,
  owner: "อลิสา พรสุขสิริ",
  updatedAt: "24/09/2026",
  // ตั้งรับเข้าไว้ก่อนเพราะเป็นประเภทที่ใช้บ่อยสุด และช่องเอกสารอ้างอิงต้องรู้
  // ประเภทก่อนถึงจะรู้ว่ามีเอกสารอะไรให้เลือก — ปล่อยว่างแล้วช่องนั้นจะว่างตาม
  inspectionType: "incoming",
  schedule: { ...DEFAULT_SCHEDULE },
  // เอกสารอ้างอิงปล่อยว่าง ให้คนตั้งค่าเลือกเอง — เดาให้แล้วเขาไม่ได้ดู
  // จะได้ฟอร์มที่ผูกกับเอกสารผิดใบโดยไม่มีใครรู้
  refDocs: [],
  rows: [],
  photo: "onFail",
  effectiveFrom: "01/09/2026",
  effectiveTo: "",
  manualWholeDoc: false,
  multiSample: false,
  subject: "item",
  targets: [],
  requireBefore: true,
  dispositions: [],
  requireDisposition: false,
});

/** เอาร่างเข้ารายการจริง — เรียกตอนกดบันทึกครั้งแรกเท่านั้น */
export function commitTemplate(t: QiTemplate): QiTemplate {
  if (!QI_TEMPLATES.some((x) => x.id === t.id)) QI_TEMPLATES.push(t);
  return t;
}

export const newShift = (from = "08:00", to = "12:00"): QcShift => ({
  id: uid("slot"),
  from,
  to,
});

/** คัดลอกหัวข้อทั้งแถว — ได้ id ใหม่ ไม่ชนของเดิม เรียกได้ใน event handler เท่านั้น */
export const cloneRow = (row: QiRow): QiRow => ({ ...row, id: uid("row") });

/**
 * แถวใหม่ — เริ่มที่คนตัดสิน แล้วค่อยเอาติ๊กออกตอนใส่เกณฑ์
 *
 * เคยเริ่มที่ numeric โดยไม่ติ๊ก manual ซึ่งแปลว่าแถวที่เพิ่งกดเพิ่มอยู่ในสถานะ
 * "ตกทุกใบ" ตั้งแต่วินาทีแรก เพราะ min_max_criteria_passed คืน has_reading
 * ที่เป็น False เมื่อยังไม่มีค่าไหนถูกคีย์
 *
 * กลับด้านเป็นปลอดภัยไว้ก่อน — ข้อที่ยังตั้งไม่เสร็จได้ผลว่า "คนตัดสิน"
 * ซึ่งไม่โกหกใคร ดีกว่าได้ผลว่า "ตก" ที่ดูเหมือนระบบตรวจแล้ว
 */
export const newRow = (): QiRow => ({
  id: uid("row"),
  kind: "text",
  parameterId: "",
  numeric: true,
  formulaBased: false,
  manualInspection: true,
  min: null,
  max: null,
  value: "",
  formula: "",
  readings: 1,
  remark: "optional",
  criteria: "",
});
