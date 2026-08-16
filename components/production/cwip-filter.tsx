"use client";

import * as React from "react";
import { RotateCcwIcon } from "lucide-react";
import { Button } from "@peckey954/ui/components/ui/button";
import { Label } from "@peckey954/ui/components/ui/label";
import { MultiSelect } from "@peckey954/ui/components/ui/multi-select";
import { CheckChip } from "@/components/check-chip";
import { SortControl, type SortOption } from "@/components/sort-control";
import { CWIP_VIEW_DEFAULT, type CwipView } from "./packing-cwip";
import {
  CWIP_KINDS,
  CWIP_PRODUCT_NAMES,
  type CwipSort,
} from "@/lib/packing-list";

/* ------------------------------------------------------------------
   ตัวกรองของแท็บสต็อก CWIP

   เรียงตามความถี่ที่คนแตะจริง ไม่ใช่ตามความสำคัญของข้อมูล
     1. เรียงตาม      — เปลี่ยนบ่อยที่สุด เดินไปหยิบของก็สลับเป็นโซน
     2. แสดงในรายการ  — ตั้งครั้งเดียวแล้วอยู่ยาว
     3. กรองข้อมูล    — ของจริงมีหมวด โซน สินค้า เป็นสิบ ต้องค้นหาเอา

   แก้ในกล่องก่อน กดตกลงถึงมีผลกับรายการ
   กล่องบังรายการอยู่แล้ว การให้มีผลทันทีที่ติ๊กจึงไม่ได้ประโยชน์อะไร
   และทำให้กากบาทกับ Esc มีความหมายจริงว่ายกเลิก ไม่ใช่ปิดเฉย ๆ

   หัวข้อกับแถวปุ่มตรึงไว้ เลื่อนเฉพาะเนื้อในตรงกลาง
   ของเดิมกล่องยาวกว่าจอมือถือ ปุ่มเลยหลุดออกไปนอกจอจนกดไม่ถึง

   ทุกแถวที่กดได้สูงอย่างน้อย 44px และกินความกว้างเต็มกล่อง
   กล่องติ๊ก 16px กดด้วยนิ้วโป้งแล้วพลาดไปโดนแถวข้าง ๆ ตลอด
------------------------------------------------------------------ */

export const isCwipDefault = (v: CwipView) =>
  v.showChips === CWIP_VIEW_DEFAULT.showChips &&
  v.showActions === CWIP_VIEW_DEFAULT.showActions &&
  v.showLots === CWIP_VIEW_DEFAULT.showLots &&
  v.sort === CWIP_VIEW_DEFAULT.sort &&
  v.dir === CWIP_VIEW_DEFAULT.dir &&
  v.kinds.length === 0 &&
  v.products.length === 0;


/** ป้ายทิศทางต่างกันตามสิ่งที่เรียง — FIFO กลับทิศแล้วมันคือ LIFO */
export const CWIP_SORTS: SortOption<CwipSort>[] = [
  { id: "product", label: "สูตร", asc: "ก → ฮ", desc: "ฮ → ก" },
  { id: "zone", label: "โซน", asc: "A → Z", desc: "Z → A" },
  { id: "fifo", label: "FIFO", asc: "เก่าสุดก่อน", desc: "ใหม่สุดก่อน" },
];

const asOptions = (values: string[]) =>
  values.map((v) => ({ value: v, label: v }));

export function CwipFilter({
  view,
  onApply,
}: {
  view: CwipView;
  /** เอาค่าที่แก้ไว้ไปใช้แล้วปิดกล่อง — ยกเลิกใช้กากบาทหรือ Esc */
  onApply: (next: CwipView) => void;
}) {
  // ค่าที่กำลังแก้อยู่ในกล่อง ยังไม่มีผลกับรายการจนกว่าจะกดตกลง
  // Radix ถอดเนื้อในทิ้งตอนปิด ค่าตั้งต้นจึงสดใหม่ทุกครั้งที่เปิด
  const [draft, setDraft] = React.useState(view);
  const set = (next: Partial<CwipView>) =>
    setDraft((prev) => ({ ...prev, ...next }));

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* หัวข้อมาจากกล่องที่ครอบอยู่ เพราะ Popover กับ Dialog
          ต้องใช้คอมโพเนนต์หัวข้อของตัวเอง ไม่งั้น screen reader อ่านไม่เจอ */}

      {/* เลื่อนเฉพาะตรงนี้ หัวข้อกับแถวปุ่มอยู่นอกกรอบที่เลื่อน */}
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
        <Section title="การเรียงข้อมูล">
          <SortControl
            options={CWIP_SORTS}
            value={draft.sort}
            dir={draft.dir}
            onChange={(sort, dir) => set({ sort, dir })}
          />
        </Section>

        <Section title="แสดงในรายการ">
          <div className="flex flex-wrap gap-2">
            <CheckChip
              id="cwip-chips"
              label="ป้ายข้อมูล"
              checked={draft.showChips}
              onChange={(v) => set({ showChips: v })}
            />
            <CheckChip
              id="cwip-actions"
              label="คืนกลับคลัง/ปรับปรุง"
              checked={draft.showActions}
              onChange={(v) => set({ showActions: v })}
            />
            <CheckChip
              id="cwip-lots"
              label="Lot สินค้า"
              checked={draft.showLots}
              onChange={(v) => set({ showLots: v })}
            />
          </div>
        </Section>

        <Section title="ประเภทสินค้า" htmlFor="cwip-kinds">
          <MultiSelect
            id="cwip-kinds"
            options={asOptions(CWIP_KINDS)}
            value={draft.kinds}
            onValueChange={(kinds) => set({ kinds })}
            placeholder="เลือกประเภท"
            searchPlaceholder="ค้นหาประเภท"
            maxChips={2}
            className="min-h-10 bg-card"
          />
        </Section>

        <Section title="สินค้า" htmlFor="cwip-products">
          <MultiSelect
            id="cwip-products"
            options={asOptions(CWIP_PRODUCT_NAMES)}
            value={draft.products}
            onValueChange={(products) => set({ products })}
            placeholder="เลือกสินค้า"
            searchPlaceholder="ค้นหาสินค้า"
            maxChips={1}
            className="min-h-10 bg-card"
          />
        </Section>
      </div>

      {/* ตรึงไว้ล่างสุด เห็นตลอดไม่ว่าเลื่อนไปไหน

          สองปุ่มแยกไปคนละมุม ไม่วางติดกัน เพราะทำคนละเรื่องกันคนละทิศ
          ล้างค่าคือรื้อของที่เพิ่งเลือกทิ้ง ตกลงคือเอาไปใช้ กดพลาดสลับกันคือเสียงาน
          ระยะห่างคือสิ่งที่กันไม่ให้กดพลาด ไม่ใช่สีของปุ่ม

          ตกลงปิดกล่องให้ด้วย ไม่ต้องเอื้อมไปกดกากบาทมุมบนอีกที
          กากบาทกับ Esc ยังอยู่ สำหรับคนที่เปลี่ยนใจแล้วอยากทิ้งที่เพิ่งเลือก */}
      <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3">
        <Button
          variant="ghost"
          className="h-10 text-primary"
          disabled={isCwipDefault(draft)}
          onClick={() => setDraft(CWIP_VIEW_DEFAULT)}
        >
          <RotateCcwIcon />
          ล้างค่า
        </Button>
        <Button className="h-10 w-28" onClick={() => onApply(draft)}>
          ตกลง
        </Button>
      </div>
    </div>
  );
}

/**
 * หัวข้อกับเนื้อหาในกล่องตัวกรอง
 *
 * ทุกหัวข้อขนาดเท่ากันหมด ไม่มีหัวข้อใหญ่ครอบหัวข้อเล็ก
 * เพราะทุกอันคือเรื่องระดับเดียวกัน — เลือกอะไรสักอย่างในกล่องนี้
 * ของเดิมมี "กรองข้อมูล" เป็นหัวข้อใหญ่ครอบสามอันล่าง ซึ่งไม่ได้บอกอะไรเพิ่ม
 *
 * ไม่มีเส้นคั่น ใช้ระยะห่างแทน เส้นทำให้กล่องเล็ก ๆ ดูถูกซอยเป็นห้อง ๆ
 * ทั้งที่มีของอยู่แค่ห้าอย่าง
 */
function Section({
  title,
  htmlFor,
  children,
}: {
  title: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label htmlFor={htmlFor} className="text-sm">
        {title}
      </Label>
      {/* ของที่เลือกอยู่บรรทัดของตัวเอง ไม่ใช่ต่อท้ายหัวข้อ */}
      <div className="mt-2">{children}</div>
    </div>
  );
}
