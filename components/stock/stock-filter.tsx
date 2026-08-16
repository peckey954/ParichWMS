"use client";

import * as React from "react";
import { RotateCcwIcon } from "lucide-react";
import { Button } from "@peckey954/ui/components/ui/button";
import { Checkbox } from "@peckey954/ui/components/ui/checkbox";
import { Label } from "@peckey954/ui/components/ui/label";
import { MultiSelect } from "@peckey954/ui/components/ui/multi-select";
import { Separator } from "@peckey954/ui/components/ui/separator";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@peckey954/ui/components/ui/toggle-group";
import {
  CONDITION_LABEL,
  STOCK_PRODUCT_NAMES,
  STOCK_ZONES,
  type LotCondition,
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
  conditions: LotCondition[];
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
  conditions: [],
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
  v.products.length === 0 &&
  v.conditions.length === 0;

/** จำนวนเงื่อนไขที่กรองของออกจริง ๆ — การเรียงกับการแสดงผลไม่นับ */
export const stockActiveCount = (v: StockView) =>
  (v.lowOnly ? 1 : 0) +
  (v.zones.length > 0 ? 1 : 0) +
  (v.products.length > 0 ? 1 : 0) +
  (v.conditions.length > 0 ? 1 : 0);

const SORTS: { id: StockSort; label: string }[] = [
  { id: "product", label: "สินค้า" },
  { id: "zone", label: "โซน" },
  { id: "fifo", label: "FIFO" },
];

/**
 * ป้ายของทิศทางเปลี่ยนตามสิ่งที่เรียง ไม่ใช่ "น้อยไปมาก" ลอย ๆ
 *
 * FIFO กลับทิศแล้วมันคือ LIFO ไม่ใช่ FIFO อีกต่อไป
 * เขียนว่า "มากไปน้อย" คนจะไม่รู้ว่าเพิ่งเปลี่ยนหลักการหยิบของทั้งคลัง
 */
const DIR_LABEL: Record<StockSort, { asc: string; desc: string }> = {
  product: { asc: "ก → ฮ", desc: "ฮ → ก" },
  zone: { asc: "A → Z", desc: "Z → A" },
  fifo: { asc: "เก่าสุดก่อน", desc: "ใหม่สุดก่อน" },
};

const asOptions = (values: string[]) =>
  values.map((v) => ({ value: v, label: v }));

const CONDITION_OPTIONS = (
  Object.keys(CONDITION_LABEL) as LotCondition[]
).map((k) => ({ value: k, label: CONDITION_LABEL[k] }));

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

  const dir = DIR_LABEL[draft.sort];

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {/* ---------- 1. เรียงตาม ----------
             ไม่ได้เปลี่ยนแค่ลำดับ แต่เปลี่ยนหน่วยของรายการไปเลย
             สินค้า = กลุ่มตามสินค้า · โซน = กลุ่มตามโซน · FIFO = ไล่ล็อตรวด */}
        <Label className="text-sm">เรียงตาม</Label>
        <ToggleGroup
          type="single"
          variant="outline"
          value={draft.sort}
          onValueChange={(v) => v && set({ sort: v as StockSort })}
          className="mt-2 w-full"
        >
          {SORTS.map((s) => (
            <ToggleGroupItem key={s.id} value={s.id} className="h-10 flex-1">
              {s.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>

        <ToggleGroup
          type="single"
          variant="outline"
          value={draft.dir}
          onValueChange={(v) => v && set({ dir: v as SortDir })}
          className="mt-2 w-full"
        >
          <ToggleGroupItem value="asc" className="h-10 flex-1">
            {dir.asc}
          </ToggleGroupItem>
          <ToggleGroupItem value="desc" className="h-10 flex-1">
            {dir.desc}
          </ToggleGroupItem>
        </ToggleGroup>

        <Separator className="my-4" />

        {/* ---------- 2. แสดงในรายการ ---------- */}
        <Label className="text-sm">แสดงในรายการ</Label>
        <div className="mt-1 space-y-0.5">
          <CheckRow
            id="stock-chips"
            label="ป้ายแสดงข้อมูล"
            checked={draft.showChips}
            onChange={(v) => set({ showChips: v })}
          />
          <CheckRow
            id="stock-actions"
            label="ปุ่มย้ายปรับปรุง"
            checked={draft.showActions}
            onChange={(v) => set({ showActions: v })}
          />
          {/* โหมดโซนกับ FIFO รายการคือล็อตอยู่แล้ว ไม่มีอะไรให้หุบ */}
          {draft.sort === "product" && (
            <CheckRow
              id="stock-lots"
              label="รายการล็อตสินค้า"
              checked={draft.showLots}
              onChange={(v) => set({ showLots: v })}
            />
          )}
          <CheckRow
            id="stock-low"
            label="เฉพาะสต็อกต่ำ"
            checked={draft.lowOnly}
            onChange={(v) => set({ lowOnly: v })}
          />
        </div>

        <Separator className="my-4" />

        {/* ---------- 3. กรองข้อมูล ---------- */}
        <Label className="text-sm">กรองข้อมูล</Label>
        <div className="mt-2 space-y-3">
          <Field id="stock-zones" label="โซน">
            <MultiSelect
              id="stock-zones"
              options={asOptions(STOCK_ZONES)}
              value={draft.zones}
              onValueChange={(zones) => set({ zones })}
              placeholder="ทุกโซน"
              searchPlaceholder="ค้นหาโซน"
              maxChips={2}
              className="min-h-10 bg-card"
            />
          </Field>

          <Field id="stock-products" label="สินค้า">
            <MultiSelect
              id="stock-products"
              options={asOptions(STOCK_PRODUCT_NAMES)}
              value={draft.products}
              onValueChange={(products) => set({ products })}
              placeholder="ทุกสินค้า"
              searchPlaceholder="ค้นหาสินค้า"
              maxChips={1}
              className="min-h-10 bg-card"
            />
          </Field>

          <Field id="stock-conditions" label="สภาพล็อต">
            <MultiSelect
              id="stock-conditions"
              options={CONDITION_OPTIONS}
              value={draft.conditions}
              onValueChange={(v) => set({ conditions: v as LotCondition[] })}
              placeholder="ทุกสภาพ"
              searchPlaceholder="ค้นหาสภาพล็อต"
              maxChips={2}
              className="min-h-10 bg-card"
            />
          </Field>
        </div>
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

/** เป้ากดสูง 44px กว้างเต็มกล่อง ไม่ใช่แค่กล่องติ๊ก 16px */
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
