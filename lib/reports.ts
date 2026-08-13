// ============================================================
// ส่งออกรายงาน — เอกสารจากทุกโมดูล รวมไว้ที่เดียวให้บัญชีมาดึง
//
// หน้านี้ไม่ได้สร้างเอกสาร แค่หยิบของที่โมดูลอื่นออกใบไว้แล้วมาส่งต่อ
// จังหวะการใช้งานจริงคือ "ปิดงวด" เดือนละครั้ง บวกดึงย่อยระหว่างเดือน
// การออกแบบจึงยึดสองอย่างนี้เป็นหลัก ไม่ใช่ค้นหาเอกสารทีละใบ
//
// ⚠️ ห้ามเรียก new Date() ตอนเรนเดอร์ ตัวเลขจะไม่ตรงกันระหว่าง
//    เซิร์ฟเวอร์กับเบราว์เซอร์แล้ว hydration พัง — ตรึงวันอ้างอิงไว้แทน
// ============================================================

import type { ModuleGroupId } from "./modules";

/** วันอ้างอิงของข้อมูลตัวอย่างทั้งไฟล์ */
export const TODAY = "2026-08-13";

// ---------------------------------------------------------------
// ชนิดเอกสาร
// ---------------------------------------------------------------

export type DocStatus = "complete" | "draft" | "cancelled";

export const DOC_STATUS_LABEL: Record<DocStatus, string> = {
  complete: "สมบูรณ์",
  draft: "ฉบับร่าง",
  cancelled: "ยกเลิก",
};

export type ReportRow = {
  id: string;
  /** เลขที่เอกสาร */
  code: string;
  /** วันที่เอกสาร รูปแบบ YYYY-MM-DD ใช้เทียบช่วงวันที่ */
  date: string;
  /** คู่ค้า/ผู้ขอ/หน่วยงาน แล้วแต่ชนิดเอกสาร */
  party: string;
  /** เอกสารต้นทางที่อ้างถึง */
  ref?: string;
  items: number;
  /** มูลค่าเป็นบาท เอกสารบางชนิดไม่มีมูลค่า */
  amount?: number;
  status: DocStatus;
};

export type ReportType = {
  id: string;
  label: string;
  group: ModuleGroupId;
  /** ตัวนำหน้าเลขที่เอกสาร */
  prefix: string;
  /** รหัสฟอร์มตามระบบเอกสารคุณภาพ */
  code: string;
  /** ชื่อคอลัมน์คู่ค้า ต่างกันไปตามชนิดเอกสาร */
  partyLabel: string;
  refLabel?: string;
  /** เอกสารชนิดนี้มีมูลค่าเป็นเงินหรือไม่ */
  hasAmount: boolean;
};

export const REPORT_TYPES: ReportType[] = [
  // ---------- การสั่งซื้อสินค้า ----------
  {
    id: "pr",
    label: "ใบขอซื้อ",
    group: "purchase",
    prefix: "PR",
    code: "FM-ST-01-05",
    partyLabel: "ผู้ขอซื้อ",
    refLabel: "แผนกที่ขอ",
    hasAmount: true,
  },
  {
    id: "po",
    label: "ใบสั่งซื้อ",
    group: "purchase",
    prefix: "PO",
    code: "FM-ST-01-05",
    partyLabel: "ผู้ขาย",
    refLabel: "ใบขอซื้ออ้างอิง",
    hasAmount: true,
  },
  {
    id: "weighing",
    label: "ใบชั่งน้ำหนัก",
    group: "purchase",
    prefix: "WG",
    code: "FM-ST-01-05",
    partyLabel: "ผู้ขาย",
    refLabel: "ทะเบียนรถ",
    hasAmount: false,
  },

  // ---------- การคลังสินค้า ----------
  {
    id: "grn-raw",
    label: "ใบรับวัตถุดิบ",
    group: "warehouse",
    prefix: "GR",
    code: "FM-ST-01-02",
    partyLabel: "ผู้ขาย",
    refLabel: "ใบสั่งซื้ออ้างอิง",
    hasAmount: true,
  },
  {
    id: "grn-fg",
    label: "ใบรับสินค้า",
    group: "warehouse",
    prefix: "GF",
    code: "FM-ST-01-02",
    partyLabel: "ผู้ส่งมอบ",
    refLabel: "ใบสั่งผลิตอ้างอิง",
    hasAmount: true,
  },
  {
    id: "issue",
    label: "ใบเบิกจ่าย",
    group: "warehouse",
    prefix: "REQ",
    code: "FM-ST-01-05",
    partyLabel: "ผู้ขอเบิก",
    refLabel: "แผนกที่เบิก",
    hasAmount: true,
  },
  {
    id: "return",
    label: "ใบคืนของ",
    group: "warehouse",
    prefix: "WT",
    code: "FM-ST-01-05",
    partyLabel: "ผู้คืน",
    refLabel: "ใบเบิกอ้างอิง",
    hasAmount: true,
  },
  {
    id: "adjust",
    label: "ใบปรับปรุงสต็อก",
    group: "warehouse",
    prefix: "ADJ",
    code: "FM-ST-01-02",
    partyLabel: "ผู้ทำรายการ",
    refLabel: "โซนที่ปรับ",
    hasAmount: true,
  },

  // ---------- การผลิตสินค้า ----------
  {
    id: "wo",
    label: "ใบสั่งผลิต",
    group: "production",
    prefix: "WO",
    code: "FM-PD-01-01",
    partyLabel: "ผู้สั่งผลิต",
    refLabel: "ไลน์ผลิต",
    hasAmount: true,
  },
  {
    id: "packing",
    label: "ใบผลิตแบ่งบรรจุ",
    group: "production",
    prefix: "PK",
    code: "FM-PD-01-03",
    partyLabel: "หัวหน้ากะ",
    refLabel: "ไลน์ผลิต",
    hasAmount: false,
  },
  {
    id: "bulk",
    label: "ใบผลิตปุ๋ย Bulk Blend",
    group: "production",
    prefix: "BB",
    code: "FM-PD-01-03",
    partyLabel: "หัวหน้ากะ",
    refLabel: "สูตรที่ผลิต",
    hasAmount: true,
  },

  // ---------- การตรวจคุณภาพสินค้า ----------
  {
    id: "qc-raw",
    label: "ใบตรวจรับวัตถุดิบ",
    group: "qc",
    prefix: "QR",
    code: "FM-QC-02-03",
    partyLabel: "ผู้ตรวจ",
    refLabel: "ใบรับวัตถุดิบอ้างอิง",
    hasAmount: false,
  },
  {
    id: "qc-fg",
    label: "ใบตรวจรับสินค้า",
    group: "qc",
    prefix: "QF",
    code: "FM-QC-02-03",
    partyLabel: "ผู้ตรวจ",
    refLabel: "ใบรับสินค้าอ้างอิง",
    hasAmount: false,
  },
  {
    id: "qc-inline",
    label: "ใบตรวจระหว่างผลิต",
    group: "qc",
    prefix: "QL",
    code: "FM-QC-02-04",
    partyLabel: "ผู้ตรวจ",
    refLabel: "ใบสั่งผลิตอ้างอิง",
    hasAmount: false,
  },
];

export const getReportType = (id: string) =>
  REPORT_TYPES.find((t) => t.id === id);

/**
 * ชนิดเอกสารที่บัญชีเปิดบ่อยที่สุด ปักไว้บนสุดของรายการ
 * คนที่มาหน้านี้ทุกวันไม่ควรต้องเลื่อนหาของเดิมซ้ำ ๆ
 */
export const PINNED_TYPES = ["po", "grn-raw", "grn-fg", "issue"];

// ---------------------------------------------------------------
// ช่วงวันที่
// ---------------------------------------------------------------

export type PresetId =
  | "thisMonth"
  | "lastMonth"
  | "thisQuarter"
  | "lastQuarter"
  | "thisYear"
  | "custom";

export const PRESETS: { id: PresetId; label: string }[] = [
  { id: "lastMonth", label: "เดือนที่แล้ว" },
  { id: "thisMonth", label: "เดือนนี้" },
  { id: "lastQuarter", label: "ไตรมาสที่แล้ว" },
  { id: "thisQuarter", label: "ไตรมาสนี้" },
  { id: "thisYear", label: "ปีนี้" },
  { id: "custom", label: "กำหนดเอง" },
];

export type Range = { from: string; to: string };

const pad = (n: number) => String(n).padStart(2, "0");
const ymd = (y: number, m: number, d: number) => `${y}-${pad(m)}-${pad(d)}`;
const lastDay = (y: number, m: number) => new Date(Date.UTC(y, m, 0)).getUTCDate();

/**
 * แปลงตัวเลือกสำเร็จรูปเป็นช่วงวันที่จริง
 * คำนวณจาก TODAY ที่ตรึงไว้ ไม่ใช่เวลาปัจจุบัน ผลลัพธ์จึงคงที่เสมอ
 */
export function presetRange(id: PresetId, today = TODAY): Range {
  const [y, m] = today.split("-").map(Number);

  switch (id) {
    case "thisMonth":
      return { from: ymd(y, m, 1), to: today };
    case "lastMonth": {
      const py = m === 1 ? y - 1 : y;
      const pm = m === 1 ? 12 : m - 1;
      return { from: ymd(py, pm, 1), to: ymd(py, pm, lastDay(py, pm)) };
    }
    case "thisQuarter": {
      const start = Math.floor((m - 1) / 3) * 3 + 1;
      return { from: ymd(y, start, 1), to: today };
    }
    case "lastQuarter": {
      const start = Math.floor((m - 1) / 3) * 3 + 1 - 3;
      const qy = start < 1 ? y - 1 : y;
      const qs = start < 1 ? start + 12 : start;
      const qe = qs + 2;
      return { from: ymd(qy, qs, 1), to: ymd(qy, qe, lastDay(qy, qe)) };
    }
    case "thisYear":
      return { from: ymd(y, 1, 1), to: today };
    case "custom":
      return { from: ymd(y, m, 1), to: today };
  }
}

export const inRange = (date: string, r: Range) => date >= r.from && date <= r.to;

/** 2026-08-13 → 13/08/2026 — รูปแบบที่บัญชีใช้ในเอกสาร */
export function formatDate(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export function formatRange(r: Range) {
  return `${formatDate(r.from)} – ${formatDate(r.to)}`;
}

export const formatBaht = (n: number) =>
  n.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const formatCount = (n: number) => n.toLocaleString("th-TH");

// ---------------------------------------------------------------
// ข้อมูลตัวอย่าง — สร้างจากตัวเลขสุ่มแบบมีเมล็ด ผลลัพธ์เหมือนกันทุกครั้ง
// ---------------------------------------------------------------

function seeded(n: number) {
  let s = n * 9301 + 49297;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

const SUPPLIERS = [
  "เอชซี อินเตอร์เนชั่นแนล เทรดดิ้ง จำกัด",
  "โรงงานกระสอบไทยรุ่งเรือง",
  "พริ้นท์เวิร์คส์ เอเชีย",
  "เซฟตี้พลัส ซัพพลาย",
  "ยูนิเวอร์แซล เคมิคอล กรุ๊ป",
  "ไทยแอกโกร อินดัสทรี",
  "สหมิตรปุ๋ยเคมี จำกัด",
];

const PEOPLE = [
  "อลิสา พรสุขสิริ",
  "ธนกฤต ศรีบุญเรือง",
  "พิมพ์ชนก วงศ์อารีย์",
  "ณัฐวุฒิ แก้วประเสริฐ",
  "สุชานาถ อินทร์ทอง",
  "กิตติพงศ์ ใจดีงาม",
];

const DEPARTMENTS = [
  "ฝ่ายผลิต",
  "ฝ่ายคลังสินค้า",
  "ฝ่ายซ่อมบำรุง",
  "ฝ่ายควบคุมคุณภาพ",
  "ฝ่ายจัดส่ง",
];

const LINES = ["ไลน์ 1", "ไลน์ 2", "ไลน์ 3", "ไลน์แบ่งบรรจุ"];
const ZONES = ["A-2M", "A-4M", "A-9M", "B-1M", "C-3M", "F-1M"];
const RECIPES = ["15-15-15 + 1Mg", "20-8-8 + 1Mg", "13-13-21 + 1Mg", "46-0-0"];

const pick = <T,>(pool: T[], r: () => number) => pool[Math.floor(r() * pool.length)];

function partyPool(t: ReportType) {
  if (t.partyLabel === "ผู้ขาย" || t.partyLabel === "ผู้ส่งมอบ") return SUPPLIERS;
  return PEOPLE;
}

function refValue(t: ReportType, r: () => number, seq: number, y: number, m: number) {
  switch (t.id) {
    case "pr":
    case "issue":
      return pick(DEPARTMENTS, r);
    case "weighing":
      return `${pad(10 + Math.floor(r() * 89))} - ${1000 + Math.floor(r() * 8999)}`;
    case "packing":
    case "wo":
      return pick(LINES, r);
    case "bulk":
      return pick(RECIPES, r);
    case "adjust":
      return pick(ZONES, r);
    default: {
      // เอกสารที่อ้างถึงใบต้นทาง ใช้เลขที่ในเดือนเดียวกันจะได้ดูสมจริง
      const src =
        t.id === "po" ? "PR" : t.id === "grn-raw" ? "PO" : t.id === "grn-fg" ? "WO" : t.id === "return" ? "REQ" : t.id === "qc-raw" ? "GR" : t.id === "qc-fg" ? "GF" : "WO";
      return `${src}${String(y).slice(2)}${pad(m)}/${pad((seq % 40) + 1)}`;
    }
  }
}

/**
 * เอกสารย้อนหลัง 18 เดือนของชนิดที่เลือก
 *
 * ฉบับร่างมีเฉพาะสองเดือนล่าสุด เพราะของเก่ากว่านั้นปิดงวดไปแล้ว
 * ตรงนี้สำคัญ ไม่ใช่รายละเอียดประดับ — หน้านี้ต้องเตือนได้ว่า
 * ช่วงที่เลือกมีใบที่ยังไม่สมบูรณ์ปนอยู่ บัญชีจะได้ไม่ดึงไปลงบัญชี
 */
// แถบซ้ายต้องนับเอกสารของทุกชนิดในงวดเดียวกัน ถ้าสร้างใหม่ทุกครั้งที่เลื่อนวัน
// จะสร้างสามพันกว่าแถวซ้ำทุกคลิก เก็บผลไว้ครั้งแรกครั้งเดียวพอ
const rowCache = new Map<string, ReportRow[]>();

export function rowsFor(typeId: string, today = TODAY): ReportRow[] {
  const cacheKey = `${typeId}@${today}`;
  const hit = rowCache.get(cacheKey);
  if (hit) return hit;

  const t = getReportType(typeId);
  if (!t) return [];

  const [ty, tm, td] = today.split("-").map(Number);
  const seedBase = typeId.split("").reduce((s, c) => s + c.charCodeAt(0), 0);
  const out: ReportRow[] = [];
  const parties = partyPool(t);

  for (let back = 0; back < 18; back++) {
    let m = tm - back;
    let y = ty;
    while (m < 1) {
      m += 12;
      y -= 1;
    }
    const maxDay = back === 0 ? td : lastDay(y, m);
    const rnd = seeded(seedBase * 1000 + y * 13 + m);
    const count = 8 + Math.floor(rnd() * 14);

    for (let i = 0; i < count; i++) {
      const day = 1 + Math.floor(rnd() * maxDay);
      const roll = rnd();
      const status: DocStatus =
        back <= 1 && roll < 0.1 ? "draft" : roll > 0.97 ? "cancelled" : "complete";

      out.push({
        id: `${typeId}-${y}${pad(m)}-${i}`,
        code: `${t.prefix}${String(y).slice(2)}${pad(m)}/${pad(i + 1)}`,
        date: ymd(y, m, day),
        party: pick(parties, rnd),
        ref: refValue(t, rnd, i, y, m),
        items: 1 + Math.floor(rnd() * 24),
        amount: t.hasAmount
          ? Math.round((3000 + rnd() * 780000) / 100) * 100
          : undefined,
        status,
      });
    }
  }

  // เรียงใหม่ก่อนเก่า บัญชีมองหาของล่าสุดก่อนเสมอ
  out.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : a.code < b.code ? 1 : -1));
  rowCache.set(cacheKey, out);
  return out;
}

export function matchesRow(r: ReportRow, q: string) {
  const s = q.trim().toLowerCase();
  if (!s) return true;
  return [r.code, r.party, r.ref ?? ""].some((v) => v.toLowerCase().includes(s));
}

// ---------------------------------------------------------------
// รูปแบบไฟล์ + การสร้างไฟล์
// ---------------------------------------------------------------

export type FormatId = "csv" | "xlsx" | "pdf";

export const FORMATS: { id: FormatId; label: string; note: string }[] = [
  { id: "csv", label: "CSV (เปิดด้วย Excel)", note: "ไฟล์เดียว รวมทุกเอกสาร" },
  { id: "xlsx", label: "Excel (.xlsx)", note: "ไฟล์เดียว รวมทุกเอกสาร" },
  { id: "pdf", label: "PDF แยกไฟล์ต่อเอกสาร", note: "บีบเป็น .zip ให้อัตโนมัติ" },
];

/** ชื่อไฟล์ที่อ่านออกโดยไม่ต้องเปิด — บัญชีเก็บไฟล์รวมกันเป็นร้อย */
export function fileName(t: ReportType, r: Range, format: FormatId) {
  const ext = format === "pdf" ? "zip" : format === "xlsx" ? "xlsx" : "csv";
  return `${t.prefix}_${t.label}_${r.from}_ถึง_${r.to}.${ext}`;
}

const csvCell = (v: string | number | undefined) => {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function buildCsv(t: ReportType, rows: ReportRow[]) {
  const head = [
    "เลขที่เอกสาร",
    "วันที่",
    t.partyLabel,
    t.refLabel ?? "อ้างอิง",
    "จำนวนรายการ",
    ...(t.hasAmount ? ["มูลค่า (บาท)"] : []),
    "สถานะ",
  ];

  const body = rows.map((r) =>
    [
      r.code,
      formatDate(r.date),
      r.party,
      r.ref,
      r.items,
      ...(t.hasAmount ? [r.amount ?? 0] : []),
      DOC_STATUS_LABEL[r.status],
    ].map(csvCell).join(",")
  );

  // นำหน้าด้วย BOM ไม่งั้น Excel บนวินโดวส์เปิดแล้วภาษาไทยเป็นขยะ
  return "﻿" + [head.map(csvCell).join(","), ...body].join("\r\n");
}
