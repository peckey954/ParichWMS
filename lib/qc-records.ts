// ============================================================
// ใบตรวจที่ทำแล้วของรายงานที่วาดจากเทมเพลต (/qc/form)
//
// ไม่มีหลังบ้าน เก็บในหน่วยความจำของแท็บเหมือนที่อื่นในโปรเจกต์ รีเฟรชแล้ว
// กลับเป็นค่าตั้งต้น ใบตัวอย่างย้อนหลังสร้างจากตัวสุ่มที่ตั้งเมล็ดไว้ ได้ชุดเดิม
// ทุกครั้ง ปฏิทินกับตารางจะได้ไม่เปลี่ยนไปมาทุกครั้งที่เปิด
//
// รอบของใบอ่านจากเวลาที่ทำจริง ไม่ได้ให้เลือก — หนึ่งวันหนึ่งรอบมีได้ใบเดียว
// ทำซ้ำในรอบเดิมคือเปิดใบเดิมขึ้นมาแก้ ไม่ใช่ได้ใบที่สองที่ขัดกันเอง
// ============================================================

import {
  QI_TEMPLATES,
  templateOf,
  type QcShift,
  type QiTemplate,
  type VerdictOption,
} from "@/lib/qc-erp";

export type QcRecord = {
  id: string;
  tplId: string;
  /** เลขที่ใบตรวจ QCyymmdd/รอบ */
  no: string;
  /** yyyy-mm-dd ของวันที่ใบนี้นับอยู่ */
  date: string;
  /** เวลาที่บันทึก HH:MM */
  time: string;
  /** รอบที่ใบนี้ตกอยู่ — ว่างคือรายงานที่ไม่ได้เปิดตามรอบ */
  slotId: string;
  header: Record<string, string>;
  /** ผลรายข้อ คีย์คือ id ของแถวในเทมเพลต */
  results: Record<string, VerdictOption | "">;
  /** ค่าที่คีย์รายข้อ — ใช้เปิดใบเดิมขึ้นมาแก้ได้ครบ */
  values: Record<string, { nums: string[]; text: string; source: string; remark: string }>;
  disposition: string;
  note: string;
  by: string;
  editor?: string;
  status: "pass" | "fail";
  cancelled: boolean;
};

export const RECORDS: QcRecord[] = [];

const pad = (n: number) => String(n).padStart(2, "0");
export const isoDate = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const nowTime = (d = new Date()) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
/** 2026-10-19 → 19/10/2026 */
export const thaiDate = (iso: string) => iso.split("-").reverse().join("/");

/** วันทำงาน — อาทิตย์หยุด ตรงกับ weekly_off ใน Holiday List ของโรงงาน */
export const isWorkday = (d: Date) => d.getDay() !== 0;

/** ช่วงนี้ครอบเวลานี้ไหม — ช่วงข้ามเที่ยงคืนครอบทั้งก่อนและหลังเที่ยงคืน */
const covers = (s: QcShift, t: string) =>
  s.to > s.from ? t >= s.from && t < s.to : t >= s.from || t < s.to;

/**
 * รอบของเวลานี้ — อยู่ในช่วงไหนก็รอบนั้น ทำนอกช่วงนับเป็นรอบล่าสุดที่เริ่มไปแล้ว
 * (ตรวจช้ากว่ากำหนดยังเป็นใบของรอบนั้น) ยังไม่ถึงรอบแรกของวันนับเป็นรอบแรก
 */
export function slotAt(slots: QcShift[], t: string): QcShift | undefined {
  if (slots.length === 0) return undefined;
  const hit = slots.find((s) => covers(s, t));
  if (hit) return hit;
  const started = [...slots]
    .filter((s) => s.from <= t)
    .sort((a, b) => b.from.localeCompare(a.from))[0];
  return started ?? [...slots].sort((a, b) => a.from.localeCompare(b.from))[0];
}

export const recordsOf = (tplId: string) =>
  RECORDS.filter((r) => r.tplId === tplId).sort((a, b) =>
    `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`)
  );

export const recordOf = (id: string) => RECORDS.find((r) => r.id === id);

/** ใบของวันนั้นรอบนั้น — ไม่นับใบที่ยกเลิก */
export const recordAt = (tplId: string, date: string, slotId: string) =>
  RECORDS.find(
    (r) => r.tplId === tplId && r.date === date && r.slotId === slotId && !r.cancelled
  );

export const docNo = (date: string, slotIndex: number) =>
  `QC${date.slice(2).replaceAll("-", "")}/${pad(slotIndex + 1)}`;

let seq = 0;
export function saveRecord(r: Omit<QcRecord, "id"> & { id?: string }): QcRecord {
  const existing = r.id ? recordOf(r.id) : undefined;
  if (existing) {
    Object.assign(existing, r);
    return existing;
  }
  const rec = { ...r, id: `rec-${++seq}` } as QcRecord;
  RECORDS.push(rec);
  return rec;
}

/** ยกเลิกใบ — ไม่ลบทิ้ง ใบยังอยู่ในแท็บยกเลิก รอบนั้นกลับไปว่างให้ตรวจใหม่ */
export function cancelRecord(id: string) {
  const r = recordOf(id);
  if (r) r.cancelled = true;
}

/** สถานะของหนึ่งรอบในหนึ่งวัน — ใช้วาดวงกลมในปฏิทิน */
export type SlotState = "pass" | "fail" | "missed" | "future" | "off";

export function slotState(
  tpl: QiTemplate,
  date: Date,
  slot: QcShift,
  now = new Date()
): SlotState {
  if (!isWorkday(date)) return "off";
  const rec = recordAt(tpl.id, isoDate(date), slot.id);
  if (rec) return rec.status;
  const today = isoDate(now);
  const day = isoDate(date);
  if (day > today) return "future";
  // วันนี้ — รอบที่ยังไม่จบยังไม่นับว่าขาด
  if (day === today && !(slot.to > slot.from && slot.to <= nowTime(now))) return "future";
  return "missed";
}

// ---------------------------------------------------------------
// ใบตัวอย่างย้อนหลัง — สี่สิบห้าวันของรายงานที่เปิดตามรอบ
// ---------------------------------------------------------------

function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) % 2147483648;
    return s / 2147483648;
  };
}

const INSPECTORS = ["อลิสา พรสุขสิริ", "ณัฐพล ศรีวิไล", "สมชาย ใจดี"];

function seedRecords(tpl: QiTemplate, days: number) {
  const rand = rng(tpl.id.length * 7919 + 17);
  const now = new Date();
  const slots = tpl.schedule.slots;
  const pool =
    tpl.headerOn && tpl.header[0]?.source === "tank"
      ? ["ถัง T1", "ถัง T2", "ถัง T3", "ถัง T4"]
      : [""];

  for (let back = days; back >= 1; back--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - back);
    if (!isWorkday(d)) continue;
    const date = isoDate(d);
    slots.forEach((slot, si) => {
      const roll = rand();
      if (roll < 0.05) return; // ขาดตรวจ
      const fail = roll > 0.88;
      const results: QcRecord["results"] = {};
      const failRows: string[] = [];
      tpl.rows.forEach((row) => {
        const r = rand();
        if (fail && r < 0.25) {
          results[row.id] = "fail";
          failRows.push(row.id);
        } else results[row.id] = tpl.verdicts.includes("na") && r > 0.93 ? "na" : "pass";
      });
      if (fail && failRows.length === 0 && tpl.rows[0]) {
        results[tpl.rows[0].id] = "fail";
        failRows.push(tpl.rows[0].id);
      }
      const [h, m] = slot.from.split(":").map(Number);
      const mins = h * 60 + m + 10 + Math.floor(rand() * 70);
      const by = INSPECTORS[Math.floor(rand() * INSPECTORS.length)];
      RECORDS.push({
        id: `rec-seed-${tpl.id}-${date}-${si}`,
        tplId: tpl.id,
        no: docNo(date, si),
        date,
        time: `${pad(Math.floor(mins / 60) % 24)}:${pad(mins % 60)}`,
        slotId: slot.id,
        header: tpl.header[0] ? { [tpl.header[0].id]: pool[si % pool.length] } : {},
        results,
        values: {},
        disposition: "",
        note: failRows.length > 0 ? "ระดับในถังต่ำกว่ากำหนด แจ้งคลังเติมแล้ว" : "",
        by,
        editor: rand() > 0.85 ? "อลิสา พรสุขสิริ" : undefined,
        status: failRows.length > 0 ? "fail" : "pass",
        cancelled: rand() > 0.97,
      });
    });
  }
}

for (const t of QI_TEMPLATES)
  if (t.schedule.recurring && t.schedule.slots.length > 0) seedRecords(t, 45);

/** เรียกใช้ได้ทุกที่ที่มีแค่ id — เทมเพลตที่ไม่มีแล้วคืนรายการว่าง */
export const templateRecords = (tplId: string) =>
  templateOf(tplId) ? recordsOf(tplId) : [];
