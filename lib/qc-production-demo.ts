/* ------------------------------------------------------------------
   คิวตรวจของใบสั่งผลิต — ตัวอย่างว่าเทมเพลตที่ตั้งไว้กลายเป็นงานหน้าจอยังไง

   ไม่มีหลังบ้าน เก็บในหน่วยความจำของแท็บเหมือนที่อื่นในโปรเจกต์นี้
   กดรีเฟรชแล้วกลับเป็นค่าตั้งต้น

   ขั้นตรวจไม่ได้ตั้งไว้ในไฟล์นี้ — อ่านมาจาก tpl.stages ของเทมเพลตจริง
   เพิ่มหรือลดจุดในหน้าตั้งค่าแล้วคิวตรงนี้เปลี่ยนตามทันที ถ้าตั้งไว้สองที่
   วันหนึ่งจะมีคนแก้ที่เดียวแล้วอีกที่ค้าง
------------------------------------------------------------------ */

import {
  OPERATION_POOL,
  PROD_STEP,
  PROD_STEP_KEYS,
  templateOf,
  type ProdStep,
} from "@/lib/qc-erp";

/**
 * เทมเพลตที่คิวเดินตาม — ส่งเข้ามาทาง URL ไม่ได้ฝังไว้ตัวเดียว
 *
 * ตั้งเทมเพลตใหม่แล้วต้องมีที่ให้ทำงานทันที ถ้าผูกคิวไว้กับเทมเพลตตัวเดียว
 * ทุกฟอร์มใหม่จะต้องรอให้มีคนมาเพิ่มเมนูมือ แล้ววันหนึ่งก็จะลืม
 */
export const queueTemplate = (tplId: string) => templateOf(tplId);

/**
 * จุดเช็คหนึ่งจุด = หนึ่งใบตรวจ
 *
 * ไม่ใช่หนึ่งขั้นเท่ากับหนึ่งใบ เพราะขั้น "ระหว่างผลิต" แตกตามจำนวนขั้นตอนที่
 * ติ๊กไว้ — สองขั้นตอนคือสองใบงาน คือสองใบตรวจ ยุบเป็นชิปเดียวแล้วจะมองไม่เห็น
 * ว่ายังเหลืออีกใบ
 */
export type Checkpoint = {
  /** คีย์ที่ใช้เก็บผล — ขั้นเดี่ยวใช้ชื่อขั้น ขั้นที่แตกใช้ชื่อขั้นคู่ชื่อขั้นตอน */
  key: string;
  step: ProdStep;
  /** ชื่อขั้นตอนการผลิต — มีเฉพาะจุดที่แตกมาจากระหว่างผลิต */
  operation?: string;
  label: string;
};

/**
 * จุดเช็คทั้งหมดของคิวนี้ เรียงตามลำดับที่ต้องทำจริง
 *
 * ลำดับระหว่างขั้นมาจาก PROD_STEP_KEYS ที่ประกาศเรียง ก่อน → ระหว่าง → หลัง ไว้
 * ส่วนลำดับระหว่างขั้นตอนในช่วงระหว่างผลิต เรียงตาม OPERATION_POOL ซึ่งแทน
 * ลำดับในสูตรการผลิต (BOM Operation.sequence_id) — ไม่ได้เรียงตามที่คนติ๊ก
 * เพราะคนอาจติ๊กบรรจุกระสอบก่อนผสมปุ๋ย แต่สายการผลิตไม่ได้เดินแบบนั้น
 */
export function checkpointsOfQueue(tplId: string): Checkpoint[] {
  const t = queueTemplate(tplId);
  if (!t || t.phase !== "production") return [];

  const out: Checkpoint[] = [];
  for (const step of PROD_STEP_KEYS) {
    if (!t.prodSteps.includes(step)) continue;

    if (step !== "during") {
      out.push({ key: step, step, label: PROD_STEP[step].label });
      continue;
    }

    const ops = OPERATION_POOL.filter((o) => t.operations.includes(o));
    // ไม่ได้ติ๊กขั้นตอนไว้เลย = ยังตั้งไม่เสร็จ แต่ยังโชว์เป็นจุดเดียวไว้ก่อน
    // ไม่ใช่หายไปเงียบ ๆ จนไม่มีใครรู้ว่าขาด
    if (ops.length === 0) {
      out.push({ key: "during", step, label: PROD_STEP.during.label });
      continue;
    }
    for (const o of ops)
      out.push({
        key: `during:${o}`,
        step,
        operation: o,
        label: `${PROD_STEP.during.label} · ${o}`,
      });
  }
  return out;
}

/** ผลของหนึ่งขั้นที่ตรวจไปแล้ว — หนึ่งขั้น = หนึ่งใบ Quality Inspection */
export type StageResult = {
  /** ชื่อใบตรวจที่ ERPNext ออกให้ */
  qi: string;
  at: string;
  by: string;
  verdict: "pass" | "fail";
  /** ข้อที่ไม่ผ่าน — ว่างคือผ่านหมด */
  failed: string[];
  note: string;
};

export type Lot = {
  id: string;
  /** เลขที่ใบสั่งผลิต — ทั้งสามขั้นอ้างใบเดียวกัน */
  code: string;
  createdAt: string;
  line: string;
  round: string;
  material: string;
  materialNote: string;
  product: string;
  category: string;
  pack: string;
  company: string;
  ton: number;
  owner: string;
  /** ผลของจุดที่ตรวจไปแล้ว — คีย์คือ Checkpoint.key จุดที่ยังไม่มีคือยังไม่ตรวจ */
  done: Record<string, StageResult>;
};

export const LOTS: Lot[] = [
  {
    id: "lot-1",
    code: "PO260115/01",
    createdAt: "16/01/2026 10:42:52",
    line: "ไลน์ 1",
    round: "ปกติ",
    material: "21-0-0",
    materialNote: "ฟูเจียน ผง",
    product: "ปุ๋ยจัมโบ้",
    category: "Bulk",
    pack: "50 กก.",
    company: "เอชซี อินเตอร์เนชั่นแนล",
    ton: 800,
    owner: "อลิสา พรสุขสิริ",
    done: {},
  },
  {
    id: "lot-2",
    code: "PO260115/02",
    createdAt: "16/01/2026 11:08:14",
    line: "ไลน์ 2",
    round: "แทรก",
    material: "16-20-0",
    materialNote: "ฟูเจียน เม็ด",
    product: "ปุ๋ยจัมโบ้",
    category: "Bulk",
    pack: "50 กก.",
    company: "เอชซี อินเตอร์เนชั่นแนล",
    ton: 640,
    owner: "อลิสา พรสุขสิริ",
    done: {
      "t-inproc:pre": {
        qi: "MAT-QA-2026-00011",
        at: "16/01/2026 11:20",
        by: "อลิสา พรสุขสิริ",
        verdict: "pass",
        failed: [],
        note: "",
      },
    },
  },
  {
    id: "lot-3",
    code: "PO260114/03",
    createdAt: "14/01/2026 08:15:30",
    line: "ไลน์กลาง",
    round: "ปกติ",
    material: "15-15-15",
    materialNote: "ผสมเอง",
    product: "ปุ๋ยกระสอบ 50 กก.",
    category: "Bag",
    pack: "50 กก.",
    company: "ปาริช",
    ton: 420,
    owner: "ณัฐพล ศรีวิไล",
    done: {
      "t-inproc:pre": {
        qi: "MAT-QA-2026-00008",
        at: "14/01/2026 08:40",
        by: "ณัฐพล ศรีวิไล",
        verdict: "pass",
        failed: [],
        note: "",
      },
      "t-inproc:during:ผสมปุ๋ย": {
        qi: "MAT-QA-2026-00009",
        at: "14/01/2026 13:05",
        by: "ณัฐพล ศรีวิไล",
        verdict: "fail",
        failed: ["การเย็บกระสอบ"],
        note: "เครื่องเย็บลงด้ายเดี่ยว ช่างปรับแล้วเดินต่อ",
      },
    },
  },
];

export const lotOf = (id: string) => LOTS.find((l) => l.id === id);

/**
 * จุดที่ถึงคิวแล้ว — จุดถัดจากจุดสุดท้ายที่ตรวจไปแล้ว
 *
 * บังคับลำดับเพราะจุดเหล่านี้เป็นลำดับของการผลิตจริง ตรวจหลังผลิตทั้งที่ยังไม่ได้
 * ตรวจก่อนผลิตคือตรวจของที่ยังไม่มี — ไม่ใช่กฎที่เราตั้งเอง แต่เป็นเวลาที่บังคับอยู่
 *
 * ERPNext ไม่มีกฎนี้ให้ มันดูแค่ว่าแต่ละเอกสารมีใบตรวจหรือยัง ไม่ได้ดูข้ามเอกสาร
 * ลำดับจึงเป็นของที่ต้องบังคับเองที่หน้าจอและที่ validate ตอนบันทึก
 */
export function currentCheckpoint(lot: Lot, tplId: string): Checkpoint | null {
  for (const c of checkpointsOfQueue(tplId))
    if (!lot.done[`${tplId}:${c.key}`]) return c;
  return null;
}

/** ผลของจุดหนึ่งในเทมเพลตหนึ่ง — คีย์รวมเทมเพลตด้วย ฟอร์มคนละใบจึงไม่ปนกัน */
export const resultOf = (lot: Lot, tplId: string, c: Checkpoint) =>
  lot.done[`${tplId}:${c.key}`];

export type StageState = "done" | "current" | "locked";

export const checkpointStateOf = (
  lot: Lot,
  tplId: string,
  c: Checkpoint
): StageState =>
  resultOf(lot, tplId, c)
    ? "done"
    : currentCheckpoint(lot, tplId)?.key === c.key
      ? "current"
      : "locked";

/** จำนวนงานที่ถึงคิวแล้ว — นับเป็นงาน ไม่ใช่นับเป็นใบ */
export const pendingCount = (tplId: string) =>
  LOTS.filter((l) => currentCheckpoint(l, tplId) !== null).length;

/* เลขใบตรวจเดินต่อจากที่มีอยู่ — ERPNext ออกเลขจาก naming_series (MAT-QA-.YYYY.-)
   ไม่ได้สุ่ม ตัวอย่างนี้จึงเดินเลขเองให้เหมือน ไม่ใช่สุ่มเลขมั่ว */
let qiSeq = 11;
export const nextQiName = () =>
  `MAT-QA-2026-${String(++qiSeq).padStart(5, "0")}`;

/** บันทึกผลหนึ่งขั้น — ไม่มีหลังบ้าน แก้อาเรย์ในหน่วยความจำตรง ๆ */
export function saveStage(
  lotId: string,
  tplId: string,
  key: string,
  r: StageResult
) {
  const lot = lotOf(lotId);
  if (lot) lot.done[`${tplId}:${key}`] = r;
}
