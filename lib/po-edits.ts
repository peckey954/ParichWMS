"use client";

import * as React from "react";
import type { PoFormState } from "@/components/po/po-form";
import { getPoOrder, PO_ORDER_DOCS, type PoDoc } from "@/lib/po";

/* ------------------------------------------------------------------
   แก้ไขใบสั่งซื้อที่บันทึกระหว่างเซสชันนี้ (ไม่มี backend) — เก็บในหน่วยความจำ
   ฝั่ง client อยู่ได้ตลอดการเปลี่ยนหน้า หายเมื่อรีเฟรช เหมือนรอบรับเข้าที่เพิ่ม
   เอง (AddedRoundsProvider)

   บันทึกแก้ไขแล้วใบกลับไป "รออนุมัติ" ใหม่ (ล้างผลไม่อนุมัติ/เหตุผลเดิม) ตาม
   flow ใน Figma ทุกหน้าที่อ่านใบสั่งซื้อจึงต้องผ่าน usePoOrder/usePoOrders
------------------------------------------------------------------ */

export type PoEdit = Pick<
  PoDoc,
  "poType" | "company" | "expectedFrom" | "expectedTo" | "note" | "lineItems" | "editedBy"
>;

let edits: Record<string, PoEdit> = {};
const listeners = new Set<() => void>();
const EMPTY: Record<string, PoEdit> = {};

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function savePoEdit(id: string, edit: PoEdit) {
  edits = { ...edits, [id]: edit };
  listeners.forEach((l) => l());
}

function applyEdit(doc: PoDoc, edit: PoEdit | undefined): PoDoc {
  if (!edit) return doc;
  return { ...doc, ...edit, approval: "waiting", approver: undefined, rejectReason: undefined };
}

function useEdits() {
  return React.useSyncExternalStore(subscribe, () => edits, () => EMPTY);
}

export function usePoOrder(id: string): PoDoc | undefined {
  const all = useEdits();
  return React.useMemo(() => {
    const doc = getPoOrder(id);
    return doc && applyEdit(doc, all[id]);
  }, [id, all]);
}

export function usePoOrders(): PoDoc[] {
  const all = useEdits();
  return React.useMemo(() => PO_ORDER_DOCS.map((d) => applyEdit(d, all[d.id])), [all]);
}

/* ร่างฟอร์มแก้ไขที่ค้างไว้ตอนกด "+ เพิ่มสินค้า" ออกไปหน้าเลือกใบขอซื้อ —
   กลับมาแล้วกรอกต่อจากเดิมได้ ไม่ต้องเริ่มใหม่จากข้อมูลใบ */
const drafts = new Map<string, PoFormState>();

export function stashPoDraft(id: string, form: PoFormState) {
  drafts.set(id, form);
}

/** ไม่ลบตอนอ่าน — StrictMode เรียก useState initializer สองครั้งตอน dev */
export function getPoDraft(id: string): PoFormState | undefined {
  return drafts.get(id);
}

export function clearPoDraft(id: string) {
  drafts.delete(id);
}
