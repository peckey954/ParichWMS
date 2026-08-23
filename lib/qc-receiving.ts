// ============================================================
// ตรวจรับวัตถุดิบ — เอาโครงฟอร์ม QC มาใช้กับของที่รับเข้าจริง
//
// ต่างจากหน้าใบตรวจตัวอย่างตรงที่ผูกกับใบสั่งซื้อและยอดของจริง
// ตรวจไม่ผ่านแล้วต้องตัดสินว่าจะทำยังไงกับของ ซึ่งเป็นตัวกำหนดว่ายอดเข้าคลังเท่าไหร่
// ============================================================

import {
  INSPECT_TEMPLATE,
  answerOf,
  editableIn,
  verdictOf,
  type Round,
} from "@/lib/qc-inspect";
import { numberFields, type QcItem } from "@/lib/qc-template";

export const RECEIVING_TEMPLATE = INSPECT_TEMPLATE;

// ---------------------------------------------------------------
// ใบตรวจรับหนึ่งใบ
// ---------------------------------------------------------------

export type ReceivingDoc = {
  id: string;
  /** เลขที่ใบตรวจสอบ */
  code: string;
  createdAt: string;
  product: string;
  productNote: string;
  supplier: string;
  packing: string;
  /** ขนาดบรรจุต่อถุง เช่น 50 Kg */
  bagSize: string;
  lot: string;
  /** ยอดที่ต้องตรวจ หน่วยตัน */
  ton: number;
  receiver: string;
  /** ว่าง = ยังไม่มีใครแก้ */
  editor: string;
  done: boolean;
};

const doc = (n: number, extra: Partial<ReceivingDoc> = {}): ReceivingDoc => ({
  id: `rc-${n}`,
  code: "PO260115/01",
  createdAt: "1/16/2026 | 10:42:52",
  product: "21-0-0",
  productNote: "ฟูเจียน ผง",
  supplier: "เอชซี อินเตอร์เนชั่นแนล เทรดดิ้ง จำกัด",
  packing: "Bulk",
  bagSize: "50 Kg",
  lot: "A-9M",
  ton: 800,
  receiver: "อลิสา พรสุขสิริ",
  editor: "",
  done: false,
  ...extra,
});

/** รอตรวจสินค้า — ยังไม่ได้ลงผลตรวจ */
export const PENDING_DOCS: ReceivingDoc[] = [
  doc(1),
  doc(2, { editor: "อลิสา พรสุขสิริ" }),
  doc(3),
  doc(4),
  doc(5),
  doc(6),
  doc(7),
  doc(8),
  doc(9),
  doc(10),
  doc(11),
];

/** ตรวจสินค้าแล้ว — เก็บไว้ดูย้อนหลัง */
export const DONE_DOCS: ReceivingDoc[] = Array.from({ length: 24 }, (_, i) =>
  doc(100 + i, { done: true, editor: "อลิสา พรสุขสิริ" })
);

export const findDoc = (id: string) =>
  [...PENDING_DOCS, ...DONE_DOCS].find((d) => d.id === id);

// ---------------------------------------------------------------
// ตรวจไม่ผ่านแล้วทำยังไงกับของ
//
// สามทางนี้ตัดสินว่ายอดเข้าคลังเท่าไหร่ ไม่ใช่แค่ป้ายบอกสถานะ
// ส่งคืนแล้วของไม่เข้าคลังเลย อีกสองทางเข้าคลังเต็มจำนวนแต่ติดเงื่อนไขไว้
// ---------------------------------------------------------------

export type Disposition = "repack" | "accept" | "return";

export const DISPOSITIONS: { id: Disposition; label: string }[] = [
  { id: "repack", label: "Repack" },
  { id: "accept", label: "รับสภาพ" },
  { id: "return", label: "ส่งคืน" },
];

export const DISPOSITION_LABEL: Record<Disposition, string> = {
  repack: "Repack",
  accept: "รับสภาพ",
  return: "ส่งคืน",
};

/**
 * ยอดที่ไม่ผ่านกับยอดเข้าคลัง
 *
 * ทุกครั้งผ่าน = เข้าคลังเต็ม ไม่มียอดไม่ผ่าน
 * มีครั้งไหนไม่ผ่าน = ยอดทั้งใบไปอยู่ฝั่งไม่ผ่าน แล้วแต่ว่าจะจัดการยังไงต่อ
 *   ส่งคืน   ของกลับไปหาผู้ขาย เข้าคลังศูนย์ ยอดไม่ผ่านติดลบเพราะเป็นของที่หายออกไป
 *   รับสภาพ / repack  ของยังเข้าคลัง แต่ติดป้ายไว้ว่าผ่านมาแบบมีเงื่อนไข
 */
export function tonnage(
  ton: number,
  hasFail: boolean,
  disposition: Disposition | null
) {
  if (!hasFail) return { fail: null as number | null, warehouse: ton };
  if (disposition === "return") return { fail: -ton, warehouse: 0 };
  if (disposition === null) return { fail: ton, warehouse: null as number | null };
  return { fail: ton, warehouse: ton };
}

// ---------------------------------------------------------------
// สรุปของแต่ละครั้งที่ตรวจ ตอนที่ยังไม่ได้เปิดดูข้างใน
//
// แถวที่ผ่านไม่ต้องอธิบายอะไรเพิ่ม บอกค่าที่วัดได้พอเป็นหลักฐานว่าตรวจจริง
// แถวที่ไม่ผ่านต้องบอกให้ได้ว่า "ไม่ผ่านข้อไหน" ตั้งแต่ตอนยังไม่เปิด
// เพราะนั่นคือสิ่งเดียวที่คนอ่านต้องรีบรู้ และเป็นตัวตัดสินว่าจะ repack หรือส่งคืน
// หลักเดียวกับป้ายบนการ์ดหัวข้อ — ขึ้นเฉพาะสิ่งที่ผิดปกติ ไม่ใช่สิ่งที่ปกติ
// ---------------------------------------------------------------

export type RoundDigest = {
  /** ชื่อข้อที่ไม่ผ่าน */
  failed: string[];
  /** ค่าที่วัดได้ เช่น "น้ำหนัก 50.4 Kg" */
  values: string[];
  done: number;
  total: number;
  /** null = ยังไม่ได้ตรวจเลย */
  pass: boolean | null;
};

export function roundDigest(
  items: QcItem[],
  round: Round,
  roundIndex: number
): RoundDigest {
  const mine = items.filter((i) => editableIn(i, roundIndex));
  const failed: string[] = [];
  const values: string[] = [];
  let done = 0;

  for (const item of mine) {
    const a = answerOf(round, item.id);
    const v = verdictOf(item, a);
    if (v !== null) done += 1;
    if (v === false) failed.push(item.title);

    for (const f of numberFields(item)) {
      const raw = a.values[f.id];
      if (raw && raw.trim() !== "") {
        values.push(`${f.label} ${raw}${f.unit ? ` ${f.unit}` : ""}`);
      }
    }
  }

  return {
    failed,
    values,
    done,
    total: mine.length,
    pass: done === 0 ? null : failed.length === 0,
  };
}

/** ตัดรายการยาว ๆ ให้เหลือสองชื่อ ที่เหลือนับเป็นตัวเลข */
export function shortList(names: string[], keep = 2): string {
  if (names.length <= keep) return names.join(", ");
  return `${names.slice(0, keep).join(", ")} และอีก ${names.length - keep}`;
}
