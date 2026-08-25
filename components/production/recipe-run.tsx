"use client";

import * as React from "react";
import { RAW_MATERIALS, type RawMaterialDraft } from "@/lib/recipe-input";
import { RECIPE_UPDATED_AT } from "@/lib/recipe";
import { toast } from "sonner";

/* ------------------------------------------------------------------
   สถานะร่าง/เผยแพร่ของข้อมูลตั้งต้น (ต้นทุน+ธาตุอาหารวัตถุดิบ)

   "ตั้งค่าข้อมูล" คือช่องเดียวที่ป้อนเข้าการคำนวณหน้า "สูตรที่เหมาะสม" จริง
   (ตั้งค่าต้นทุน/ตั้งค่าสูตรเป็นคนละคำนวณ ไม่เกี่ยวกัน) — แก้ค่านี้จึงต้องมี
   สองชุดแยกกัน:
     publishedMaterials = ค่าที่ทุกคนเห็นจริงในหน้า "สูตรที่เหมาะสม"
     draftMaterials     = ค่าที่กำลังแก้ ยังไม่มีใครเห็นนอกจากคนแก้เอง

   แก้ในหน้าตั้งค่าข้อมูลแล้วลองกดดู "ตัวอย่าง" ได้เรื่อย ๆ โดยของจริงไม่ขยับ
   จนกว่าจะกด "เผยแพร่" ซึ่งย้าย draft ไปทับ published ทีเดียว

   เก็บไว้ที่ AppShell (ผ่าน Provider นี้) ซึ่งไม่ถูกถอดตอนสลับหน้า
   สถานะร่างจึงอยู่ข้ามหน้าได้ — ปิดแท็บนี้ไปแล้วค่อยกลับมาค่อยหายไม่เป็นไร
   เพราะแอปนี้ไม่มีหลังบ้านจริงอยู่แล้ว เหมือนหน้าอื่นทั้งหมด
------------------------------------------------------------------ */

type Ctx = {
  /** เวลาที่เผยแพร่ล่าสุด — ค่าที่ทุกคนเห็นอยู่ตอนนี้คำนวณจากตอนนั้น */
  runAt: string;
  /** ค่าที่เผยแพร่แล้ว หน้า "สูตรที่เหมาะสม" ใช้ตัวนี้เสมอ */
  publishedMaterials: RawMaterialDraft[];
  /** ค่าที่กำลังแก้ในหน้าตั้งค่าข้อมูล หน้าพรีวิวใช้ตัวนี้ */
  draftMaterials: RawMaterialDraft[];
  setDraftMaterials: (
    updater: RawMaterialDraft[] | ((prev: RawMaterialDraft[]) => RawMaterialDraft[])
  ) => void;
  /** เวลาที่กด "บันทึกร่าง" ล่าสุด — null ถ้ายังไม่เคยกด */
  draftSavedAt: string | null;
  /** จริง = ร่างต่างจากที่เผยแพร่แล้ว มีของค้างที่ยังไม่มีใครเห็น */
  hasUnpublished: boolean;
  saveDraft: () => void;
  publish: () => void;
  /** ทิ้งร่างที่แก้ค้างไว้ทั้งหมด กลับไปใช้ค่าที่เผยแพร่ล่าสุดแทน */
  resetDraft: () => void;
};

function makeDefault(): Ctx {
  return {
    runAt: RECIPE_UPDATED_AT,
    publishedMaterials: RAW_MATERIALS,
    draftMaterials: RAW_MATERIALS,
    setDraftMaterials: () => {},
    draftSavedAt: null,
    hasUnpublished: false,
    saveDraft: () => {},
    publish: () => {},
    resetDraft: () => {},
  };
}

const RecipeRunContext = React.createContext<Ctx>(makeDefault());

export const useRecipeRun = () => React.useContext(RecipeRunContext);

/** เวลาปัจจุบันในรูปแบบเดียวกับ RECIPE_UPDATED_AT — เรียกได้เฉพาะในตัวจัดการเหตุการณ์ */
function stamp() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()} | ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

export function RecipeRunProvider({ children }: { children: React.ReactNode }) {
  const [runAt, setRunAt] = React.useState(RECIPE_UPDATED_AT);
  const [publishedMaterials, setPublishedMaterials] =
    React.useState<RawMaterialDraft[]>(RAW_MATERIALS);
  const [draftMaterials, setDraftMaterials] =
    React.useState<RawMaterialDraft[]>(RAW_MATERIALS);
  const [draftSavedAt, setDraftSavedAt] = React.useState<string | null>(null);

  const hasUnpublished = React.useMemo(
    () => JSON.stringify(draftMaterials) !== JSON.stringify(publishedMaterials),
    [draftMaterials, publishedMaterials]
  );

  const value = React.useMemo<Ctx>(
    () => ({
      runAt,
      publishedMaterials,
      draftMaterials,
      setDraftMaterials,
      draftSavedAt,
      hasUnpublished,
      saveDraft: () => {
        setDraftSavedAt(stamp());
        toast.success("บันทึกร่างแล้ว", {
          description: "ยังไม่เผยแพร่ — เห็นได้เฉพาะที่หน้าดูผลลัพธ์",
        });
      },
      publish: () => {
        setPublishedMaterials(draftMaterials);
        setRunAt(stamp());
        toast.success("เผยแพร่สูตรที่เหมาะสมแล้ว", {
          description: "ทุกคนเห็นตัวเลขชุดใหม่นี้แล้วที่หน้าสูตรที่เหมาะสม",
        });
      },
      resetDraft: () => {
        // ทับร่างด้วยค่าที่เผยแพร่แล้วตรง ๆ ไม่ใช่ "ล้างกลับเป็นค่าเริ่มต้นของแอป"
        // เพราะถ้าเคยเผยแพร่ไปแล้วรอบหนึ่ง ค่าเริ่มต้นเดิมไม่มีความหมายอีกต่อไป
        setDraftMaterials(publishedMaterials);
        setDraftSavedAt(null);
        toast.success("ย้อนกลับไปอัปเดตก่อนหน้าแล้ว", {
          description: "การแก้ไขที่ยังไม่เผยแพร่ถูกทิ้งไปแล้ว",
        });
      },
    }),
    [runAt, publishedMaterials, draftMaterials, draftSavedAt, hasUnpublished]
  );

  return (
    <RecipeRunContext.Provider value={value}>
      {children}
    </RecipeRunContext.Provider>
  );
}
