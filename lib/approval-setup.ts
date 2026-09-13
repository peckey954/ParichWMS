// ============================================================
// ตั้งค่าการอนุมัติใบสั่งซื้อ
//
// วงเงินเป็นตัวตัดว่าใบนั้นต้องเข้าสายอนุมัติหรือไม่:
//   ต่ำกว่าวงเงิน  → ไม่ต้องอนุมัติเลย Procurement สร้างใบแล้วจบในตัว
//   ตั้งแต่วงเงิน  → เข้าสายอนุมัติสองชั้น Factory Manager แล้วต่อ Director
//
// Procurement ไม่ได้เป็น "ชั้นอนุมัติ" ที่ตั้งผู้มีสิทธิ์ได้ เพราะเป็นคนสร้างใบเอง
// อำนาจของเขาคือวงเงินที่ต่ำกว่าเส้น ไม่ใช่การไปเซ็นรับรองใบของคนอื่น
// ผู้มีสิทธิ์ที่ตั้งได้จึงมีแค่สองชั้นบน
// ============================================================

import { poTotalPrice, PO_ORDER_DOCS, type PoDoc } from "@/lib/po";

export type ApprovalRole = "procurement" | "factoryManager" | "director";

export const APPROVAL_ROLE_LABEL: Record<ApprovalRole, string> = {
  procurement: "Procurement",
  factoryManager: "Factory Manager",
  director: "Director",
};

export const APPROVAL_ROLE_TH: Record<ApprovalRole, string> = {
  procurement: "ฝ่ายจัดซื้อ",
  factoryManager: "ผู้จัดการโรงงาน",
  director: "กรรมการ",
};

/** ชั้นที่ต้องอนุมัติจริง เรียงตามลำดับที่ใบต้องผ่าน — ไม่รวม Procurement */
export type ApproverLayer = "factoryManager" | "director";
export const APPROVAL_LAYERS: ApproverLayer[] = ["factoryManager", "director"];

export type ApprovalConfig = {
  /**
   * วงเงินที่ต้องเข้าสายอนุมัติ หน่วยบาท
   *
   * **ตั้งแต่ค่านี้ขึ้นไปต้องอนุมัติ** ตั้ง 50,000 แปลว่า 49,999.99 ไม่ต้องอนุมัติ
   * ส่วน 50,000 ถ้วนต้องอนุมัติ — เส้นแบ่งกำกวมได้ง่ายมาก จึงเขียนกำกับไว้ทั้งใน
   * โค้ดและบนหน้าจอว่าค่าที่เท่ากับเส้นพอดีอยู่ฝั่งไหน
   */
  directorFromBaht: number;
  /** ผู้มีสิทธิ์อนุมัติของแต่ละชั้น */
  approvers: Record<ApproverLayer, string[]>;
};

export const DEFAULT_APPROVAL_CONFIG: ApprovalConfig = {
  directorFromBaht: 50000,
  approvers: {
    factoryManager: ["ณัฐวุฒิ แก้วประเสริฐ", "สุชานาถ อินทร์ทอง"],
    director: ["กิตติพงศ์ ใจดีงาม"],
  },
};

/** ใบนี้ต้องเข้าสายอนุมัติไหม — เท่ากับเส้นพอดีถือว่าต้อง */
export const needsApproval = (totalBaht: number, cfg: ApprovalConfig) =>
  totalBaht >= cfg.directorFromBaht;

/** สายอนุมัติของใบหนึ่ง เรียงตามลำดับที่ต้องผ่าน
 *  ว่าง = ไม่ต้องอนุมัติ Procurement สร้างแล้วจบ */
export function approvalChain(
  totalBaht: number,
  cfg: ApprovalConfig
): ApproverLayer[] {
  return needsApproval(totalBaht, cfg) ? [...APPROVAL_LAYERS] : [];
}

/** ชั้นที่ยังไม่มีใครถือสิทธิ์ — ตั้งวงเงินไว้แต่ไม่มีคนอนุมัติ ใบจะค้างทันที */
export const layersWithoutApprover = (cfg: ApprovalConfig) =>
  APPROVAL_LAYERS.filter((l) => cfg.approvers[l].length === 0);

// ---------------------------------------------------------------
// ผลกระทบกับใบสั่งซื้อที่มีอยู่จริง
//
// ตัวเลขวงเงินลอย ๆ บอกไม่ได้ว่าตั้งแล้วงานจะหนักขึ้นแค่ไหน ต้องเอาไปทาบกับ
// ใบสั่งซื้อจริงให้เห็นว่ากี่ใบจะเด้งไปหากรรมการ
// ---------------------------------------------------------------

export type ApprovalImpact = {
  total: number;
  /** ใบที่ต้องเข้าสายอนุมัติ (Factory Manager → Director) */
  needsApproval: number;
  /** ใบที่ต่ำกว่าวงเงิน — Procurement สร้างแล้วจบ ไม่ต้องอนุมัติ */
  noApproval: number;
  /** ใบที่ยอดใกล้เส้นที่สุด เรียงจากใกล้ที่สุด — ใช้ดูว่าขยับเส้นนิดเดียวใครเด้ง */
  nearest: { doc: PoDoc; total: number; needsApproval: boolean }[];
  /**
   * ช่วงยอดของใบที่มีอยู่ — ต้องบอก ไม่งั้นตั้งเส้นแล้วเห็น "ต้องอนุมัติ 10 จาก 10 ใบ"
   * จะดูเหมือนระบบพัง ทั้งที่สาเหตุจริงคือเส้นอยู่ต่ำกว่าใบที่เล็กที่สุดมาก
   * เห็นช่วงแล้วถึงจะรู้ว่าต้องตั้งเส้นแถวไหนถึงจะแบ่งงานได้จริง
   */
  min: number;
  max: number;
};

export function approvalImpact(cfg: ApprovalConfig): ApprovalImpact {
  const rows = PO_ORDER_DOCS.map((doc) => ({
    doc,
    total: poTotalPrice(doc),
    needsApproval: needsApproval(poTotalPrice(doc), cfg),
  }));

  const totals = rows.map((r) => r.total);

  return {
    total: rows.length,
    min: totals.length ? Math.min(...totals) : 0,
    max: totals.length ? Math.max(...totals) : 0,
    needsApproval: rows.filter((r) => r.needsApproval).length,
    noApproval: rows.filter((r) => !r.needsApproval).length,
    nearest: [...rows]
      .sort(
        (a, b) =>
          Math.abs(a.total - cfg.directorFromBaht) -
          Math.abs(b.total - cfg.directorFromBaht)
      )
      .slice(0, 4),
  };
}

export const formatBaht = (v: number) =>
  v.toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
