"use client";

import * as React from "react";
import { HISTORY_ROWS, type HistoryRow } from "@/lib/general-stock";

/* ------------------------------------------------------------------
   ประวัติการทำรายการที่แก้ไขได้ระหว่างใช้งาน

   ย้าย/ปรับปรุงที่คีเข้ามาต้องโผล่ในแท็บประวัติทันที
   ตัวรายการอยู่ลึกหลายชั้น (การ์ด → แถวล็อต → ปุ่ม → กล่อง)
   ส่งผ่าน props จะต้องลากผ่านทุกชั้นโดยที่ชั้นกลางไม่ได้ใช้เลย จึงใช้ context
------------------------------------------------------------------ */

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

export function StockLogProvider({ children }: { children: React.ReactNode }) {
  const [rows, setRows] = React.useState<HistoryRow[]>(HISTORY_ROWS);
  const seq = React.useRef(0);

  const addLog = React.useCallback(
    (row: Omit<HistoryRow, "id" | "createdAt">) => {
      seq.current += 1;
      // รายการใหม่ขึ้นบนสุด เพราะประวัติเรียงจากล่าสุดลงไปหาเก่าสุด
      setRows((prev) => [
        { ...row, id: `new-${seq.current}`, createdAt: stamp() },
        ...prev,
      ]);
    },
    []
  );

  const value = React.useMemo(() => ({ rows, addLog }), [rows, addLog]);
  return (
    <StockLogContext.Provider value={value}>
      {children}
    </StockLogContext.Provider>
  );
}
