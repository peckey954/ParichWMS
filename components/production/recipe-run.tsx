"use client";

import * as React from "react";
import { RECIPE_UPDATED_AT } from "@/lib/recipe";

/* ------------------------------------------------------------------
   สถานะการคำนวณสูตร

   กับดักของเส้นทาง "ดูผลลัพธ์ก่อน แล้วค่อยเข้าไปแก้"
   คือถ้ามีคนแก้ต้นทุนแล้วไม่ได้กด RUN หน้าผลลัพธ์จะโชว์เลขเก่าเงียบ ๆ
   แล้ว manager จะตัดสินใจจากตัวเลขที่ไม่ตรงกับต้นทุนจริง

   จึงต้องจำสองเวลาไว้เทียบกัน — คำนวณล่าสุดเมื่อไร กับ แก้ข้อมูลล่าสุดเมื่อไร
   ถ้าแก้ทีหลัง แปลว่าผลลัพธ์ที่เห็นอยู่ยังไม่รวมสิ่งที่เพิ่งแก้

   เก็บไว้ที่ AppShell ซึ่งไม่ถูกถอดตอนสลับหน้า สถานะจึงอยู่ข้ามหน้าได้
------------------------------------------------------------------ */

type Ctx = {
  /** เวลาที่คำนวณสูตรครั้งล่าสุด */
  runAt: string;
  /** จริง = แก้ข้อมูลตั้งต้นหลังคำนวณครั้งล่าสุด ผลที่เห็นยังไม่รวมของใหม่ */
  stale: boolean;
  /** เรียกเมื่อมีการแก้ข้อมูลตั้งต้น */
  markInput: () => void;
  /** เรียกเมื่อกดคำนวณใหม่ */
  markRun: () => void;
};

const RecipeRunContext = React.createContext<Ctx>({
  runAt: RECIPE_UPDATED_AT,
  stale: false,
  markInput: () => {},
  markRun: () => {},
});

export const useRecipeRun = () => React.useContext(RecipeRunContext);

/** เวลาปัจจุบันในรูปแบบเดียวกับ RECIPE_UPDATED_AT — เรียกได้เฉพาะในตัวจัดการเหตุการณ์ */
function stamp() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()} | ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

export function RecipeRunProvider({ children }: { children: React.ReactNode }) {
  const [runAt, setRunAt] = React.useState(RECIPE_UPDATED_AT);
  const [stale, setStale] = React.useState(false);

  const value = React.useMemo<Ctx>(
    () => ({
      runAt,
      stale,
      markInput: () => setStale(true),
      markRun: () => {
        setRunAt(stamp());
        setStale(false);
      },
    }),
    [runAt, stale]
  );

  return (
    <RecipeRunContext.Provider value={value}>
      {children}
    </RecipeRunContext.Provider>
  );
}
