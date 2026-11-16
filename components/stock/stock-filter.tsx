"use client";

import * as React from "react";
import { RotateCcwIcon } from "lucide-react";
import { Button } from "@peckey954/ui/components/ui/button";
import { Label } from "@peckey954/ui/components/ui/label";
import { Switch } from "@peckey954/ui/components/ui/switch";
import { CheckChip } from "@/components/check-chip";
import { MultiSelectChips } from "@/components/multi-select-chips";
import { DateRangeSelect, type DateRange } from "@/components/date-select";
import { Input } from "@peckey954/ui/components/ui/input";
import { SortControl, type SortOption } from "@/components/sort-control";
import { cn } from "@peckey954/ui/lib/utils";
import {
  CATEGORIES,
  CONDITION_LABEL,
  STOCK_PRODUCT_NAMES,
  type CategoryId,
  type Lot,
  type LotCondition,
  type Product,
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
  showLots: boolean;
  lowOnly: boolean;
  /** ว่าง = เอาทั้งหมด ไม่ใช่ไม่เอาอะไรเลย */
  /** ประเภทสินค้า — ไม่เลือกเลยคือใช้ประเภทที่ชิปแถวบนเปิดอยู่ */
  kinds: CategoryId[];
  products: string[];
  sort: StockSort;
  dir: SortDir;
  /* ---------- ตัวกรองเพิ่มของสต็อกวัตถุดิบ (StockFilter extended) ---------- */
  /** วันที่รับเข้าของ Lot */
  received?: DateRange;
  /** ค้นเลข Lot บางส่วน */
  lot: string;
  /** หมวด (Bulk / PNR) */
  groups: string[];
  packings: string[];
  /** สถานะของ Lot — Repack / รับสภาพ / กวาดพื้น */
  conditions: LotCondition[];
};

export const STOCK_VIEW_DEFAULT: StockView = {
  showChips: true,
  showLots: true,
  lowOnly: false,
  kinds: [],
  products: [],
  sort: "product",
  dir: "asc",
  received: undefined,
  lot: "",
  groups: [],
  packings: [],
  conditions: [],
};

export const isStockDefault = (v: StockView) =>
  v.showChips === STOCK_VIEW_DEFAULT.showChips &&
  v.showLots === STOCK_VIEW_DEFAULT.showLots &&
  v.lowOnly === STOCK_VIEW_DEFAULT.lowOnly &&
  v.sort === STOCK_VIEW_DEFAULT.sort &&
  v.dir === STOCK_VIEW_DEFAULT.dir &&
  v.kinds.length === 0 &&
  v.products.length === 0 &&
  !v.received?.from &&
  !v.lot.trim() &&
  v.groups.length === 0 &&
  v.packings.length === 0 &&
  v.conditions.length === 0;

/** "5/14/2026" → เวลาเริ่มวัน */
const lotDay = (d: string) => {
  const [m, day, y] = d.split("/").map(Number);
  return new Date(y, m - 1, day).getTime();
};

/** Lot ผ่านตัวกรองระดับ Lot (วันที่รับ / เลข Lot / สถานะ) ไหม */
export function lotMatches(l: Lot, v: StockView): boolean {
  if (v.received?.from) {
    const from = new Date(v.received.from).setHours(0, 0, 0, 0);
    const to = new Date(v.received.to ?? v.received.from).setHours(23, 59, 59, 999);
    const t = lotDay(l.receivedAt);
    if (t < from || t > to) return false;
  }
  if (v.lot.trim() && !l.code.toLowerCase().includes(v.lot.trim().toLowerCase())) return false;
  if (v.conditions.length > 0 && !(l.condition && v.conditions.includes(l.condition))) return false;
  return true;
}

/** ตัด Lot ที่ไม่ผ่านตัวกรองระดับ Lot ออก — สินค้าที่ไม่เหลือ Lot เลยหายไปทั้งการ์ด */
export function applyLotFilters(products: Product[], v: StockView): Product[] {
  const active = Boolean(v.received?.from) || Boolean(v.lot.trim()) || v.conditions.length > 0;
  if (!active) return products;
  return products
    .map((p) => ({ ...p, lots: p.lots.filter((l) => lotMatches(l, v)) }))
    .filter((p) => p.lots.length > 0);
}


/**
 * ป้ายของทิศทางเปลี่ยนตามสิ่งที่เรียง ไม่ใช่ "น้อยไปมาก" ลอย ๆ
 *
 * FIFO กลับทิศแล้วมันคือ LIFO ไม่ใช่ FIFO อีกต่อไป
 * เขียนว่า "มากไปน้อย" คนจะไม่รู้ว่าเพิ่งเปลี่ยนหลักการหยิบของทั้งคลัง
 */
export const STOCK_SORTS: SortOption<StockSort>[] = [
  { id: "product", label: "สินค้า", asc: "ก → ฮ", desc: "ฮ → ก" },
  { id: "zone", label: "ล็อค", asc: "A → Z", desc: "Z → A" },
  { id: "fifo", label: "FIFO", asc: "เก่าสุดก่อน", desc: "ใหม่สุดก่อน" },
];

const asOptions = (values: string[]) =>
  values.map((v) => ({ value: v, label: v }));

export function StockFilter({
  view,
  onApply,
  categories = CATEGORIES,
  productNames = STOCK_PRODUCT_NAMES,
  extended,
}: {
  view: StockView;
  /** เอาค่าที่แก้ไว้ไปใช้แล้วปิดกล่อง — ยกเลิกใช้กากบาทหรือ Esc */
  onApply: (next: StockView) => void;
  /** ประเภทที่เลือกได้ — สต็อกสินค้ามีแค่สามประเภท ไม่ใช่ทั้งสิบเอ็ดของสต็อกทั่วไป */
  categories?: { id: CategoryId; label: string }[];
  productNames?: string[];
  /** สต็อกวัตถุดิบ — เพิ่มวันที่ / Lot / หมวด / บรรจุภัณฑ์ / สถานะ จัดสองคอลัมน์ตามแบบ */
  extended?: { groups: string[]; packings: string[] };
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

        <Section title="การแสดงข้อมูล">
          {/* สต็อกต่ำเป็น toggle แยกออกมา ไม่ใช่ชิปกล่องติ๊กปนกับสามอันล่าง —
              ตามแบบ นี่คือตัวกรองเปิด/ปิดที่ตัดรายการทิ้งจริง ๆ (เหลือแต่ของ
              สต็อกต่ำ) ต่างจากสามอันล่างที่แค่ซ่อน/แสดงองค์ประกอบในการ์ด
              ไม่ได้ตัดรายการทิ้ง

              toggle อยู่ซ้าย ชิดข้อความ (gap-2 = 8px) ไม่ใช่ justify-between
              แยกฝั่งแบบเดิม — ครอบด้วย label เดียวกันทั้งก้อน กดที่ข้อความก็
              สลับ toggle ได้เลย ไม่ต้องเล็งจุดเล็กๆ ของตัว switch เอง */}
          <Label
            htmlFor="stock-low"
            className="flex w-fit cursor-pointer items-center gap-2 text-sm font-normal"
          >
            <Switch
              id="stock-low"
              checked={draft.lowOnly}
              onCheckedChange={(v) => set({ lowOnly: v })}
            />
            แสดงเฉพาะสต็อกต่ำ
          </Label>
          <div className="mt-3 flex flex-wrap gap-2">
            <CheckChip
              id="stock-chips"
              label="ป้ายข้อมูล"
              checked={draft.showChips}
              onChange={(v) => set({ showChips: v })}
            />
            <CheckChip
              id="stock-lots"
              label="Lot สินค้า"
              checked={draft.showLots}
              onChange={(v) => set({ showLots: v })}
            />
          </div>
        </Section>

        <div className={cn("space-y-4", extended && "grid gap-x-4 gap-y-4 space-y-0 sm:grid-cols-2")}>
        {extended && (
          <>
            <Section title="วันที่" htmlFor="stock-received">
              <DateRangeSelect
                id="stock-received"
                value={draft.received}
                onValueChange={(received) => set({ received })}
                placeholder="เลือกวันที่"
                className="bg-card"
              />
            </Section>
            <Section title="Lot" htmlFor="stock-lot">
              <Input
                id="stock-lot"
                value={draft.lot}
                onChange={(e) => set({ lot: e.target.value })}
                placeholder="ระบุ Lot"
                className="bg-card"
              />
            </Section>
          </>
        )}

        <Section title="ประเภทสินค้า" htmlFor="stock-kinds">
          <MultiSelectChips
            id="stock-kinds"
            options={categories.map((c) => ({ value: c.id as string, label: c.label }))}
            value={draft.kinds}
            onValueChange={(v) => set({ kinds: v as CategoryId[] })}
            placeholder="เลือกประเภท"
            searchPlaceholder="ค้นหาประเภท"
            maxChips={2}
            className="min-h-10 bg-card"
          />
        </Section>

        <Section title="สินค้า" htmlFor="stock-products">
          <MultiSelectChips
            id="stock-products"
            options={asOptions(productNames)}
            value={draft.products}
            onValueChange={(products) => set({ products })}
            placeholder="เลือกสินค้า"
            searchPlaceholder="ค้นหาสินค้า"
            maxChips={1}
            className="min-h-10 bg-card"
          />
        </Section>

        {extended && (
          <>
            <Section title="หมวด" htmlFor="stock-groups">
              <MultiSelectChips
                id="stock-groups"
                options={asOptions(extended.groups)}
                value={draft.groups}
                onValueChange={(groups) => set({ groups })}
                placeholder="เลือกหมวด"
                searchPlaceholder="ค้นหาหมวด"
                maxChips={2}
                className="min-h-10 bg-card"
              />
            </Section>
            <Section title="บรรจุภัณฑ์" htmlFor="stock-packings">
              <MultiSelectChips
                id="stock-packings"
                options={asOptions(extended.packings)}
                value={draft.packings}
                onValueChange={(packings) => set({ packings })}
                placeholder="เลือกบรรจุภัณฑ์"
                searchPlaceholder="ค้นหาบรรจุภัณฑ์"
                maxChips={2}
                className="min-h-10 bg-card"
              />
            </Section>
            <Section title="สถานะ" htmlFor="stock-conditions">
              <MultiSelectChips
                id="stock-conditions"
                options={(Object.keys(CONDITION_LABEL) as LotCondition[]).map((c) => ({
                  value: c,
                  label: CONDITION_LABEL[c],
                }))}
                value={draft.conditions}
                onValueChange={(v) => set({ conditions: v as LotCondition[] })}
                placeholder="เลือกสถานะ"
                searchPlaceholder="ค้นหาสถานะ"
                maxChips={2}
                className="min-h-10 bg-card"
              />
            </Section>
          </>
        )}
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
