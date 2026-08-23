// ============================================================
// QC ตรวจสอบ — ใบตรวจที่ทำซ้ำทุกวันตามรอบ ไม่ได้ผูกกับเอกสารใบใดใบหนึ่ง
//
// ต่างจากใบตรวจรับสินค้าตรงที่ "ความครบ" คือตัวชี้วัด ไม่ใช่ผลตรวจ
// ฟอร์มกระดาษพิมพ์วันที่ 1–31 ไว้ล่วงหน้าทุกบรรทัด กวาดตาลงมาเห็นเลยว่าวันไหนไม่มีใครทำ
// รายการปกติทำแบบนั้นไม่ได้ เพราะรายการโชว์ได้แต่สิ่งที่ทำไปแล้ว
// กฎของที่นี่จึงเป็น สร้างวันให้ครบทั้งเดือนก่อน แล้วค่อยเอาข้อมูลไปเติม
// ============================================================

/** วันที่ระบบถือว่าเป็น "วันนี้" — ตรึงไว้ไม่ให้ค่าฝั่งเซิร์ฟเวอร์กับเบราว์เซอร์ต่างกัน */
export const TODAY = "2026-08-23";

// ---------------------------------------------------------------
// กะ
//
// ฟอร์มกระดาษแยกเป็นคนละแผ่นระหว่าง Day shift กับ Night shift
// และในแผ่น Day ยังแยกช่องเวลาเป็นเช้ากับบ่ายอีก
// หน่วยของงานจึงเป็น "วัน × กะ" ไม่ใช่ "วัน"
// ---------------------------------------------------------------

export type Shift = "morning" | "afternoon";

export const SHIFTS: { id: Shift; label: string }[] = [
  { id: "morning", label: "เช้า" },
  { id: "afternoon", label: "บ่าย" },
];

export const SHIFT_LABEL: Record<Shift, string> = {
  morning: "เช้า",
  afternoon: "บ่าย",
};

// ---------------------------------------------------------------
// ใบตรวจวัตถุดิบในถัง
// ---------------------------------------------------------------

/** วัตถุดิบที่ต้องตรวจในถัง — ตรงกับหัวคอลัมน์ในฟอร์มกระดาษ */
export const MATERIALS = [
  "42-0-5",
  "Br",
  "Mop",
  "Mg",
  "Dap",
  "Ammonium Su",
  "Urea",
];

export const TANKS = ["L1, L2", "L3, L4", "L5, L6"];

/** ปกติ/ผิดปกติ — ฟอร์มนี้ไม่ได้ตัดสินผ่าน-ไม่ผ่าน แค่บอกว่าของในถังผิดสังเกตไหม */
export type MaterialResult = "normal" | "abnormal";

export type MaterialAnswer = {
  result: MaterialResult | null;
  note: string;
};

export type CheckSheet = {
  id: string;
  code: string;
  tank: string;
  /**
   * วันที่และกะที่ใบนี้เป็นของ — คนกรอกเลือกเอง ปฏิทินกับตารางใช้ตัวนี้
   * ห้ามอนุมานจากเวลาที่กดบันทึก กะกลางคืนกดบันทึกตอนตีหนึ่ง
   * ใบจะไปตกวันถัดไป แล้วปฏิทินจะขึ้นว่าเมื่อวานขาดทั้งที่ทำแล้ว
   */
  date: string;
  shift: Shift;
  /** key คือชื่อวัตถุดิบ */
  answers: Record<string, MaterialAnswer>;
  /** ระบบประทับตอนกดบันทึก แก้ไม่ได้ — ต่างจาก date ตรงที่บอกว่ากรอกเมื่อไหร่จริง ๆ */
  savedAt: string | null;
  inspector: string;
};

export const emptyAnswer = (): MaterialAnswer => ({ result: null, note: "" });

export const answerOf = (sheet: CheckSheet, material: string): MaterialAnswer =>
  sheet.answers[material] ?? emptyAnswer();

export function newSheet(
  id: string,
  date: string,
  shift: Shift,
  tank = TANKS[0]
): CheckSheet {
  return {
    id,
    code: `QC${date.replace(/-/g, "").slice(2)}/${shift === "morning" ? "01" : "02"}`,
    tank,
    date,
    shift,
    answers: {},
    savedAt: null,
    inspector: "",
  };
}

// ---------------------------------------------------------------
// สถานะของใบและของวัน
// ---------------------------------------------------------------

/** ครบทุกรายการหรือยัง และมีผิดปกติไหม */
export function sheetStatus(sheet: CheckSheet) {
  let done = 0;
  let abnormal = 0;
  for (const m of MATERIALS) {
    const a = answerOf(sheet, m);
    if (a.result === null) continue;
    done += 1;
    if (a.result === "abnormal") abnormal += 1;
  }
  return { done, total: MATERIALS.length, abnormal };
}

/**
 * สถานะของหนึ่งกะ
 *   holiday  วันหยุด ไม่ต้องตรวจ — ต้องมีสถานะนี้ ไม่งั้นเสาร์อาทิตย์จะขึ้นแดงเป็นความผิด
 *   missing  ถึงกำหนดแล้วแต่ไม่มีใบ
 *   partial  มีใบแต่กรอกไม่ครบ
 *   abnormal ครบแล้วและเจอของผิดปกติ
 *   done     ครบแล้วปกติทุกรายการ
 *   future   ยังไม่ถึงวัน
 */
export type SlotStatus =
  | "holiday"
  | "missing"
  | "partial"
  | "abnormal"
  | "done"
  | "future";

export const SLOT_LABEL: Record<SlotStatus, string> = {
  holiday: "วันหยุด",
  missing: "ไม่ได้ตรวจ",
  partial: "ตรวจไม่ครบ",
  abnormal: "ผิดปกติ",
  done: "ตรวจแล้ว",
  future: "ยังไม่ถึงวัน",
};

/**
 * วันหยุด — ตอนนี้ใช้เสาร์อาทิตย์ไปก่อน
 * ของจริงควรอ่านจากปฏิทินการผลิต หรือถือว่าวันที่ไม่มีใบสั่งผลิตคือไม่ต้องตรวจ
 */
export function isHoliday(date: string): boolean {
  const d = new Date(`${date}T00:00:00`);
  const w = d.getDay();
  return w === 0 || w === 6;
}

export function slotStatus(
  sheets: CheckSheet[],
  date: string,
  shift: Shift
): { status: SlotStatus; sheet: CheckSheet | null } {
  const sheet =
    sheets.find((s) => s.date === date && s.shift === shift) ?? null;

  if (isHoliday(date)) return { status: "holiday", sheet };
  if (sheet) {
    const st = sheetStatus(sheet);
    if (st.done < st.total) return { status: "partial", sheet };
    return { status: st.abnormal > 0 ? "abnormal" : "done", sheet };
  }
  if (date > TODAY) return { status: "future", sheet: null };
  return { status: "missing", sheet: null };
}

// ---------------------------------------------------------------
// ปฏิทินของเดือน
// ---------------------------------------------------------------

export const MONTH_NAMES = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
];

export const WEEKDAYS = ["จ", "อ", "พ", "พฤ", "ศ", "ส", "อา"];

const pad = (n: number) => String(n).padStart(2, "0");
export const iso = (y: number, m: number, d: number) =>
  `${y}-${pad(m + 1)}-${pad(d)}`;

/** ชื่อเดือนแบบไทย พ.ศ. */
export const monthLabel = (y: number, m: number) =>
  `${MONTH_NAMES[m]} ${y + 543}`;

/** วันที่ 1 ถึงสิ้นเดือน ครบทุกวัน ไม่ว่าจะมีใบหรือไม่ */
export function monthDays(y: number, m: number): string[] {
  const last = new Date(y, m + 1, 0).getDate();
  return Array.from({ length: last }, (_, i) => iso(y, m, i + 1));
}

/**
 * ช่องว่างหน้าวันที่ 1 ให้ปฏิทินเริ่มวันจันทร์
 * getDay() คืน 0 = อาทิตย์ จึงต้องเลื่อนฐานเอง
 */
export function leadingBlanks(y: number, m: number): number {
  const w = new Date(y, m, 1).getDay();
  return (w + 6) % 7;
}

/** สรุปทั้งเดือน ใช้บนหัวปฏิทิน */
export function monthSummary(sheets: CheckSheet[], y: number, m: number) {
  let done = 0;
  let missing = 0;
  let partial = 0;
  let abnormal = 0;
  let holiday = 0;

  for (const date of monthDays(y, m)) {
    if (isHoliday(date)) {
      holiday += 1;
      continue;
    }
    for (const s of SHIFTS) {
      const { status } = slotStatus(sheets, date, s.id);
      if (status === "done") done += 1;
      else if (status === "missing") missing += 1;
      else if (status === "partial") partial += 1;
      else if (status === "abnormal") abnormal += 1;
    }
  }
  return { done, missing, partial, abnormal, holiday };
}

// ---------------------------------------------------------------
// ข้อมูลตัวอย่าง — สิงหาคม 2026 (พ.ศ. 2569)
// เว้นบางวันไว้ให้เห็นว่าปฏิทินจับช่องว่างได้จริง ไม่ได้เขียนแบบครบทุกวัน
// ---------------------------------------------------------------

const INSPECTORS = ["สมชาย ใจดี", "ประเสริฐ มั่นคง", "วราภรณ์ ศรีทอง"];

/** วันที่ไม่มีใครทำเลยทั้งวัน */
const SKIP_DAYS = [12, 20];
/** วันที่ทำแค่กะเช้า */
const MORNING_ONLY = [6, 18];
/** วันที่กรอกไม่ครบ */
const PARTIAL_DAYS = [14];
/** วันที่เจอของผิดปกติ */
const ABNORMAL_DAYS = [5, 19];

function seedSheets(): CheckSheet[] {
  const out: CheckSheet[] = [];
  const y = 2026;
  const m = 7; // สิงหาคม

  for (const date of monthDays(y, m)) {
    if (date > TODAY) break;
    if (isHoliday(date)) continue;
    const day = Number(date.slice(-2));
    if (SKIP_DAYS.includes(day)) continue;

    const shifts: Shift[] = MORNING_ONLY.includes(day)
      ? ["morning"]
      : ["morning", "afternoon"];

    for (const shift of shifts) {
      const sheet = newSheet(`ck-${date}-${shift}`, date, shift);
      sheet.inspector = INSPECTORS[day % INSPECTORS.length];
      sheet.savedAt = `${date} ${shift === "morning" ? "10:42" : "15:20"}`;

      MATERIALS.forEach((mat, i) => {
        // กรอกไม่ครบ = เว้นสองรายการท้ายไว้
        if (PARTIAL_DAYS.includes(day) && i >= MATERIALS.length - 2) return;
        const bad = ABNORMAL_DAYS.includes(day) && i === 2;
        sheet.answers[mat] = {
          result: bad ? "abnormal" : "normal",
          note: bad ? "พบก้อนแข็งจับตัวในถัง" : "",
        };
      });
      out.push(sheet);
    }
  }
  return out;
}

export const CHECK_SHEETS: CheckSheet[] = seedSheets();

export const findSheet = (id: string) =>
  CHECK_SHEETS.find((s) => s.id === id);

// ---------------------------------------------------------------
// ชนิดใบ QC ที่หน้ารวมโชว์
// ---------------------------------------------------------------

export type CheckKind = {
  id: string;
  label: string;
  code: string;
  description: string;
  href: string | null;
};

export const CHECK_KINDS: CheckKind[] = [
  {
    id: "material",
    label: "ตรวจวัตถุดิบในถัง",
    code: "FM-QC-02-05",
    description: "ตรวจของในถังวัตถุดิบทุกกะ เช้าและบ่าย",
    href: "/qc/checks/material",
  },
  {
    id: "machine",
    label: "ตรวจเครื่องจักร",
    code: "FM-PD-01-03",
    description: "ตรวจสภาพเครื่องจักรก่อนเริ่มไลน์",
    href: null,
  },
  {
    id: "line",
    label: "ตรวจระหว่างผลิต",
    code: "FM-ST-01-02",
    description: "ตรวจคุณภาพระหว่างเดินไลน์",
    href: null,
  },
  {
    id: "warehouse",
    label: "ตรวจคลังสินค้า",
    code: "FM-ST-01-02",
    description: "ตรวจสภาพการจัดเก็บในคลัง",
    href: null,
  },
];
