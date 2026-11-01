"use client";

import * as React from "react";

/* ------------------------------------------------------------------
   state ที่จำค่าไว้ข้ามการเปลี่ยนหน้า — แท็บ/ชิปที่เลือกอยู่ในหน้ารายการ

   เปิดเอกสารแล้วกดย้อนกลับ หน้ารายการถูกสร้างใหม่ทั้งหน้า useState ธรรมดา
   จะกลับไปค่าตั้งต้น (แท็บแรก) ทั้งที่คนเพิ่งมาจากแท็บอื่น ตัวนี้เก็บค่าล่าสุด
   ไว้ในหน่วยความจำของแท็บเบราว์เซอร์ กลับมาแล้วได้แท็บเดิม

   ไม่ใช้ localStorage: รีเฟรช/เปิดใหม่ควรเริ่มที่ค่าตั้งต้น และค่าที่อ่านตอน
   เรนเดอร์แรกต้องตรงกับฝั่งเซิร์ฟเวอร์ (ทั้งคู่ว่างเปล่าตอนโหลดหน้าใหม่)
------------------------------------------------------------------ */

const MEMORY = new Map<string, unknown>();

/**
 * @param key      ชื่อไม่ซ้ำกันทั้งแอป เช่น "goods.tab"
 * @param fallback ค่าตั้งต้นเมื่อยังไม่เคยเลือก
 * @param override ค่าที่ต้องใช้แทนค่าที่จำไว้ (เช่น บันทึกเสร็จแล้วสั่งให้เปิดแท็บรอจ่าย)
 */
export function useRememberedState<T>(
  key: string,
  fallback: T,
  override?: () => T | undefined
): [T, (next: T) => void] {
  const [value, setValue] = React.useState<T>(() => {
    const forced = override?.();
    if (forced !== undefined) {
      MEMORY.set(key, forced);
      return forced;
    }
    return MEMORY.has(key) ? (MEMORY.get(key) as T) : fallback;
  });

  const set = React.useCallback(
    (next: T) => {
      MEMORY.set(key, next);
      setValue(next);
    },
    [key]
  );

  return [value, set];
}
