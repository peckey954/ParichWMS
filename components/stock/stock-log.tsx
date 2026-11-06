"use client";

import * as React from "react";
import { HISTORY_ROWS, type HistoryRow } from "@/lib/general-stock";

/* ------------------------------------------------------------------
   ประวัติการทำรายการที่แก้ไขได้ระหว่างใช้งาน

   ย้าย/ปรับปรุงที่คีเข้ามาต้องโผล่ในแท็บประวัติทันที
   ตัวรายการอยู่ลึกหลายชั้น (การ์ด → แถวล็อต → ปุ่ม → กล่อง)
   ส่งผ่าน props จะต้องลากผ่านทุกชั้นโดยที่ชั้นกลางไม่ได้ใช้เลย จึงใช้ context

   ย้าย/ปรับปรุงเป็นหน้าเต็มของตัวเอง (/stock/lot/…) อยู่นอก provider
   รายการที่บันทึกจึงเก็บไว้ในหน่วยความจำระดับโมดูลด้วย กลับมาหน้ารายการแล้ว
   ประวัติยังมีอยู่ (รีเฟรชแล้วหาย เหมือนข้อมูลเดโมอื่น ๆ)
------------------------------------------------------------------ */

/** สต็อกทั่วไปกับสต็อกสินค้ามีประวัติแยกกัน */
export type StockScope = "general" | "goods";

const ADDED: Record<StockScope, HistoryRow[]> = { general: [], goods: [] };
let seq = 0;

/** เพิ่มรายการเข้าประวัติของคลังนั้น — เรียกจากหน้าย้าย/ปรับปรุง */
export function appendStockLog(scope: StockScope, row: Omit<HistoryRow, "id" | "createdAt">) {
  seq += 1;
  // รายการใหม่ขึ้นบนสุด เพราะประวัติเรียงจากล่าสุดลงไปหาเก่าสุด
  ADDED[scope].unshift({ ...row, id: `new-${scope}-${seq}`, createdAt: stamp() });
}

type Ctx = {
  rows: HistoryRow[];
  addLog: (row: Omit<HistoryRow, "id" | "createdAt">) => void;
};

const StockLogContext = React.createContext<Ctx>({
  rows: HISTORY_ROWS,
  addLog: () => {},
});

export const useStockLog = () => React.useContext(StockLogContext);

/** เวลาแบบเดียวกับข้อมูลตัวอย่าง — เรียกตอนกดปุ่มเท่านั้น ไม่กระทบ hydration */
function stamp() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()} | ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

export function StockLogProvider({
  children,
  scope = "general",
  initial = HISTORY_ROWS,
}: {
  children: React.ReactNode;
  scope?: StockScope;
  /** ประวัติตั้งต้น — สต็อกสินค้าใช้ชุดของตัวเอง ไม่ปนกับสต็อกทั่วไป */
  initial?: HistoryRow[];
}) {
  const [rows, setRows] = React.useState<HistoryRow[]>(() => [...ADDED[scope], ...initial]);

  const addLog = React.useCallback(
    (row: Omit<HistoryRow, "id" | "createdAt">) => {
      appendStockLog(scope, row);
      setRows([...ADDED[scope], ...initial]);
    },
    [scope, initial]
  );

  const value = React.useMemo(() => ({ rows, addLog }), [rows, addLog]);
  return (
    <StockLogContext.Provider value={value}>
      {children}
    </StockLogContext.Provider>
  );
}
