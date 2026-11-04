"use client";

import * as React from "react";
import { getWeighingDoc, WEIGHING_DOCS, type WeighingDoc, type WeighingRecord } from "@/lib/weighing";

/* ------------------------------------------------------------------
   ผลชั่งที่บันทึกระหว่างเซสชันนี้ (ไม่มี backend) — เก็บในหน่วยความจำฝั่ง
   client อยู่ได้ตลอดการเปลี่ยนหน้า หายเมื่อรีเฟรช แบบเดียวกับ lib/po-edits

   draft  = บันทึกร่าง ใบยังอยู่แท็บรอชั่ง กลับมาเปิดอีกทีกรอกต่อจากเดิม
   weighed = บันทึกจริง ย้ายไปแท็บชั่งแล้ว (นับเป็นชั่งวันนี้ แก้ได้อีกสามวัน)
   ทุกหน้าที่อ่านใบชั่งต้องผ่าน useWeighingDoc/useWeighingDocs
------------------------------------------------------------------ */

type Saved = { mode: "draft" | "weighed"; record: WeighingRecord };

let saved: Record<string, Saved> = {};
const listeners = new Set<() => void>();
const EMPTY: Record<string, Saved> = {};

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function saveWeighing(id: string, mode: Saved["mode"], record: WeighingRecord) {
  saved = { ...saved, [id]: { mode, record } };
  listeners.forEach((l) => l());
}

function apply(doc: WeighingDoc, s: Saved | undefined): WeighingDoc {
  if (!s) return doc;
  if (s.mode === "draft") return { ...doc, record: s.record };
  return {
    ...doc,
    status: "weighed",
    record: s.record,
    // แก้ใบที่ชั่งแล้ว ไม่รีเซ็ตนับวัน — นับจากวันที่ชั่งครั้งแรกเสมอ
    weighedDaysAgo: doc.status === "weighed" ? doc.weighedDaysAgo : 0,
    expectedTon: doc.expectedTon ?? doc.orderTon,
  };
}

function useSaved() {
  return React.useSyncExternalStore(subscribe, () => saved, () => EMPTY);
}

export function useWeighingDoc(id: string): WeighingDoc | undefined {
  const all = useSaved();
  return React.useMemo(() => {
    const doc = getWeighingDoc(id);
    return doc && apply(doc, all[id]);
  }, [id, all]);
}

export function useWeighingDocs(): WeighingDoc[] {
  const all = useSaved();
  return React.useMemo(() => WEIGHING_DOCS.map((d) => apply(d, all[d.id])), [all]);
}
