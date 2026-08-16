"use client";

import * as React from "react";
import { RotateCcwIcon } from "lucide-react";
import { Button } from "@peckey954/ui/components/ui/button";
import { Checkbox } from "@peckey954/ui/components/ui/checkbox";
import { Label } from "@peckey954/ui/components/ui/label";
import { MultiSelect } from "@peckey954/ui/components/ui/multi-select";
import { Separator } from "@peckey954/ui/components/ui/separator";
import { useNarrowScreen } from "@/components/device-preview";
import { SortControl, type SortOption } from "@/components/sort-control";
import { CWIP_VIEW_DEFAULT, type CwipView } from "./packing-cwip";
import {
  CWIP_KINDS,
  CWIP_PRODUCT_NAMES,
  CWIP_ZONES,
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
  v.zones.length === 0 &&
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

  // จอกว้างการเรียงอยู่นอกกล่องแล้ว มีในนี้อีกก็ซ้ำ
  const narrow = useNarrowScreen();

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* หัวข้อมาจากกล่องที่ครอบอยู่ เพราะ Popover กับ Dialog
          ต้องใช้คอมโพเนนต์หัวข้อของตัวเอง ไม่งั้น screen reader อ่านไม่เจอ */}

      {/* เลื่อนเฉพาะตรงนี้ หัวข้อกับแถวปุ่มอยู่นอกกรอบที่เลื่อน */}
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {/* ตัวควบคุมมีคำว่า "เรียงตาม:" ในตัวแล้ว ไม่ต้องมี Label ซ้ำอีก */}
        {narrow && (
          <>
            <SortControl
              options={CWIP_SORTS}
              value={draft.sort}
              dir={draft.dir}
              onChange={(sort, dir) => set({ sort, dir })}
              className="flex-wrap"
            />
            <Separator className="my-4" />
          </>
        )}

        {/* ---------- แสดงในรายการ ---------- */}
        <Label className="text-sm">แสดงในรายการ</Label>
        <div className="mt-1 space-y-0.5">
          <CheckRow
            id="cwip-chips"
            label="ป้ายแสดงข้อมูล"
            checked={draft.showChips}
            onChange={(v) => set({ showChips: v })}
          />
          <CheckRow
            id="cwip-actions"
            label="ปุ่มคืนกลับคลังปรับปรุง"
            checked={draft.showActions}
            onChange={(v) => set({ showActions: v })}
          />
          <CheckRow
            id="cwip-lots"
            label="รายการล็อตสินค้า"
            checked={draft.showLots}
            onChange={(v) => set({ showLots: v })}
          />
          {/* ไม่มีเฉพาะสต็อกต่ำในนี้ — ชิปแถวบนมี "สต็อกต่ำ (3)" อยู่แล้ว
              ของอย่างเดียวกันอยู่สองที่ คนจะไม่รู้ว่าอันไหนคุมอันไหน
              และตอนติ๊กในนี้แล้วชิปข้างบนไม่ขยับตาม จะดูเหมือนระบบเพี้ยน */}
        </div>

        <Separator className="my-4" />

        {/* ---------- กรองข้อมูล ----------
             ของจริงมีเป็นสิบ ไล่กดทีละอันไม่ไหว ต้องพิมพ์ชื่อหาเอา */}
        <Label className="text-sm">กรองข้อมูล</Label>
        <div className="mt-2 space-y-3">
          <Field id="cwip-kinds" label="หมวดสินค้า">
            <MultiSelect
              id="cwip-kinds"
              options={asOptions(CWIP_KINDS)}
              value={draft.kinds}
              onValueChange={(kinds) => set({ kinds })}
              placeholder="ทุกหมวด"
              searchPlaceholder="ค้นหาหมวด"
              maxChips={2}
              className="min-h-10 bg-card"
            />
          </Field>

          <Field id="cwip-zones" label="โซน">
            <MultiSelect
              id="cwip-zones"
              options={asOptions(CWIP_ZONES)}
              value={draft.zones}
              onValueChange={(zones) => set({ zones })}
              placeholder="ทุกโซน"
              searchPlaceholder="ค้นหาโซน"
              maxChips={2}
              className="min-h-10 bg-card"
            />
          </Field>

          <Field id="cwip-products" label="สินค้า">
            <MultiSelect
              id="cwip-products"
              options={asOptions(CWIP_PRODUCT_NAMES)}
              value={draft.products}
              onValueChange={(products) => set({ products })}
              placeholder="ทุกสินค้า"
              searchPlaceholder="ค้นหาสินค้า"
              maxChips={1}
              className="min-h-10 bg-card"
            />
          </Field>
        </div>
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
 * แถวติ๊กที่กดได้ทั้งแถว
 *
 * เป้ากดสูง 44px กว้างเต็มกล่อง ไม่ใช่แค่กล่องติ๊ก 16px
 * นิ้วโป้งแตะกว้างราว 45px กดเป้าเล็กกว่านั้นก็ไปโดนแถวข้าง ๆ ตลอด
 *
 * ไม่มีไอคอน — สี่บรรทัดนี้อ่านจบใน 2 วินาทีอยู่แล้ว
 * ไอคอนไม่ได้ช่วยแยกอะไร มีแต่ทำให้ข้อความเยื้องออกไปจากกล่องติ๊ก
 */
function CheckRow({
  id,
  label,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <Label
      htmlFor={id}
      className="-mx-2 flex min-h-11 items-center gap-3 rounded-md px-2 font-normal transition-colors hover:bg-accent-hover"
    >
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(v) => onChange(v === true)}
      />
      {label}
    </Label>
  );
}

function Field({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="font-normal">
        {label}
      </Label>
      {children}
    </div>
  );
}
