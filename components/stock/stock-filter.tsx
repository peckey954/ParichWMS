"use client";

import * as React from "react";
import { RotateCcwIcon } from "lucide-react";
import { Button } from "@peckey954/ui/components/ui/button";
import { Label } from "@peckey954/ui/components/ui/label";
import { MultiSelect } from "@peckey954/ui/components/ui/multi-select";
import { CheckChip } from "@/components/check-chip";
import { SortControl, type SortOption } from "@/components/sort-control";
import {
  STOCK_PRODUCT_NAMES,
  STOCK_ZONES,
  type SortDir,
  type StockSort,
} from "@/lib/general-stock";

/* ------------------------------------------------------------------
   ตัวกรองของหน้าสต็อกทั่วไป

   ชุดเดียวกับหน้าสต็อก CWIP เพราะเป็นงานเดียวกัน คนเดียวกันใช้
   แก้ในกล่องก่อน กดตกลงถึงมีผล กากบาทกับ Esc คือยกเลิก
------------------------------------------------------------------ */

export type StockView = {
  showChips: boolean;
  showActions: boolean;
  showLots: boolean;
  lowOnly: boolean;
  /** ว่าง = เอาทั้งหมด ไม่ใช่ไม่เอาอะไรเลย */
  zones: string[];
  products: string[];
  sort: StockSort;
  dir: SortDir;
};

export const STOCK_VIEW_DEFAULT: StockView = {
  showChips: true,
  showActions: true,
  showLots: true,
  lowOnly: false,
  zones: [],
  products: [],
  sort: "product",
  dir: "asc",
};

export const isStockDefault = (v: StockView) =>
  v.showChips === STOCK_VIEW_DEFAULT.showChips &&
  v.showActions === STOCK_VIEW_DEFAULT.showActions &&
  v.showLots === STOCK_VIEW_DEFAULT.showLots &&
  v.lowOnly === STOCK_VIEW_DEFAULT.lowOnly &&
  v.sort === STOCK_VIEW_DEFAULT.sort &&
  v.dir === STOCK_VIEW_DEFAULT.dir &&
  v.zones.length === 0 &&
  v.products.length === 0;


/**
 * ป้ายของทิศทางเปลี่ยนตามสิ่งที่เรียง ไม่ใช่ "น้อยไปมาก" ลอย ๆ
 *
 * FIFO กลับทิศแล้วมันคือ LIFO ไม่ใช่ FIFO อีกต่อไป
 * เขียนว่า "มากไปน้อย" คนจะไม่รู้ว่าเพิ่งเปลี่ยนหลักการหยิบของทั้งคลัง
 */
export const STOCK_SORTS: SortOption<StockSort>[] = [
  { id: "product", label: "สินค้า", asc: "ก → ฮ", desc: "ฮ → ก" },
  { id: "zone", label: "โซน", asc: "A → Z", desc: "Z → A" },
  { id: "fifo", label: "FIFO", asc: "เก่าสุดก่อน", desc: "ใหม่สุดก่อน" },
];

const asOptions = (values: string[]) =>
  values.map((v) => ({ value: v, label: v }));

export function StockFilter({
  view,
  onApply,
}: {
  view: StockView;
  /** เอาค่าที่แก้ไว้ไปใช้แล้วปิดกล่อง — ยกเลิกใช้กากบาทหรือ Esc */
  onApply: (next: StockView) => void;
}) {
  // ค่าที่กำลังแก้อยู่ในกล่อง ยังไม่มีผลกับรายการจนกว่าจะกดตกลง
  const [draft, setDraft] = React.useState(view);
  const set = (next: Partial<StockView>) =>
    setDraft((prev) => ({ ...prev, ...next }));

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
        <Section title="การเรียงข้อมูล">
          <SortControl
            options={STOCK_SORTS}
            value={draft.sort}
            dir={draft.dir}
            onChange={(sort, dir) => set({ sort, dir })}
          />
        </Section>

        <Section title="แสดงในรายการ">
          <div className="flex flex-wrap gap-2">
            <CheckChip
              id="stock-chips"
              label="ป้ายข้อมูล"
              checked={draft.showChips}
              onChange={(v) => set({ showChips: v })}
            />
            <CheckChip
              id="stock-actions"
              label="ย้าย/ปรับปรุง"
              checked={draft.showActions}
              onChange={(v) => set({ showActions: v })}
            />
            {/* โหมดโซนกับ FIFO รายการคือล็อตอยู่แล้ว ไม่มีอะไรให้หุบ */}
            {draft.sort === "product" && (
              <CheckChip
                id="stock-lots"
                label="Lot สินค้า"
                checked={draft.showLots}
                onChange={(v) => set({ showLots: v })}
              />
            )}
            <CheckChip
              id="stock-low"
              label="สต็อกต่ำ"
              checked={draft.lowOnly}
              onChange={(v) => set({ lowOnly: v })}
            />
          </div>
        </Section>

        <Section title="โซน" htmlFor="stock-zones">
          <MultiSelect
            id="stock-zones"
            options={asOptions(STOCK_ZONES)}
            value={draft.zones}
            onValueChange={(zones) => set({ zones })}
            placeholder="เลือกโซน"
            searchPlaceholder="ค้นหาโซน"
            maxChips={2}
            className="min-h-10 bg-card"
          />
        </Section>

        <Section title="สินค้า" htmlFor="stock-products">
          <MultiSelect
            id="stock-products"
            options={asOptions(STOCK_PRODUCT_NAMES)}
            value={draft.products}
            onValueChange={(products) => set({ products })}
            placeholder="เลือกสินค้า"
            searchPlaceholder="ค้นหาสินค้า"
            maxChips={1}
            className="min-h-10 bg-card"
          />
        </Section>
      </div>

      {/* สองปุ่มแยกคนละมุม ล้างค่าคือรื้อของที่เพิ่งเลือกทิ้ง ตกลงคือเอาไปใช้
          กดพลาดสลับกันคือเสียงาน ระยะห่างคือสิ่งที่กันไม่ให้กดพลาด */}
      <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3">
        <Button
          variant="ghost"
          className="h-10 text-primary"
          disabled={isStockDefault(draft)}
          onClick={() => setDraft(STOCK_VIEW_DEFAULT)}
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
