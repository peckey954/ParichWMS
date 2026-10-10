/* ------------------------------------------------------------------
   คิวตรวจของใบสั่งผลิต — ตัวอย่างว่าเทมเพลตที่ตั้งไว้กลายเป็นงานหน้าจอยังไง

   ไม่มีหลังบ้าน เก็บในหน่วยความจำของแท็บเหมือนที่อื่นในโปรเจกต์นี้
   กดรีเฟรชแล้วกลับเป็นค่าตั้งต้น

   ขั้นตรวจไม่ได้ตั้งไว้ในไฟล์นี้ — อ่านมาจาก tpl.stages ของเทมเพลตจริง
   เพิ่มหรือลดจุดในหน้าตั้งค่าแล้วคิวตรงนี้เปลี่ยนตามทันที ถ้าตั้งไว้สองที่
   วันหนึ่งจะมีคนแก้ที่เดียวแล้วอีกที่ค้าง
------------------------------------------------------------------ */

import { templateOf, type Stage } from "@/lib/qc-erp";

/** เทมเพลตที่คิวนี้เดินตาม — ตรวจรับสินค้า (External / Finish Good) */
export const DEMO_TEMPLATE_ID = "t-inproc";

export const demoTemplate = () => templateOf(DEMO_TEMPLATE_ID);

/** ขั้นที่ต้องตรวจของคิวนี้ เรียงตามลำดับที่ต้องทำจริง */
export const STAGE_ORDER: Stage[] = [
  "receive",
  "preProd",
  "inProd",
  "transfer",
  "postProd",
  "deliver",
];

export const stagesOfQueue = (): Stage[] => {
  const t = demoTemplate();
  if (!t) return [];
  return STAGE_ORDER.filter((s) => t.stages.includes(s));
};

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
  /** ผลของขั้นที่ตรวจไปแล้ว — ขั้นที่ยังไม่มีคีย์ในนี้คือยังไม่ได้ตรวจ */
  done: Partial<Record<Stage, StageResult>>;
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
      preProd: {
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
      preProd: {
        qi: "MAT-QA-2026-00008",
        at: "14/01/2026 08:40",
        by: "ณัฐพล ศรีวิไล",
        verdict: "pass",
        failed: [],
        note: "",
      },
      inProd: {
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
 * ขั้นที่ถึงคิวแล้ว — ขั้นถัดจากขั้นสุดท้ายที่ตรวจไปแล้ว
 *
 * บังคับลำดับเพราะสามขั้นนี้เป็นลำดับของการผลิตจริง ตรวจหลังผลิตทั้งที่ยังไม่ได้
 * ตรวจก่อนผลิตคือตรวจของที่ยังไม่มี — ไม่ใช่กฎที่เราตั้งเอง แต่เป็นเวลาที่บังคับอยู่
 *
 * ERPNext ไม่มีกฎนี้ให้ มันดูแค่ว่าแต่ละเอกสารมีใบตรวจหรือยัง ไม่ได้ดูข้ามเอกสาร
 * ลำดับจึงเป็นของที่ต้องบังคับเองที่หน้าจอและที่ validate ตอนบันทึก
 */
export function currentStage(lot: Lot): Stage | null {
  for (const s of stagesOfQueue()) if (!lot.done[s]) return s;
  return null;
}

export type StageState = "done" | "current" | "locked";

export const stageStateOf = (lot: Lot, s: Stage): StageState =>
  lot.done[s] ? "done" : currentStage(lot) === s ? "current" : "locked";

/** จำนวนงานที่ถึงคิวแล้ว — นับเป็นงาน ไม่ใช่นับเป็นใบ */
export const pendingCount = () =>
  LOTS.filter((l) => currentStage(l) !== null).length;

/* เลขใบตรวจเดินต่อจากที่มีอยู่ — ERPNext ออกเลขจาก naming_series (MAT-QA-.YYYY.-)
   ไม่ได้สุ่ม ตัวอย่างนี้จึงเดินเลขเองให้เหมือน ไม่ใช่สุ่มเลขมั่ว */
let qiSeq = 11;
export const nextQiName = () =>
  `MAT-QA-2026-${String(++qiSeq).padStart(5, "0")}`;

/** บันทึกผลหนึ่งขั้น — ไม่มีหลังบ้าน แก้อาเรย์ในหน่วยความจำตรง ๆ */
export function saveStage(lotId: string, stage: Stage, r: StageResult) {
  const lot = lotOf(lotId);
  if (lot) lot.done[stage] = r;
}
