"use client";

import * as React from "react";
import { RotateCcwIcon } from "lucide-react";
import { Button } from "@peckey954/ui/components/ui/button";
import { Input } from "@peckey954/ui/components/ui/input";
import { Label } from "@peckey954/ui/components/ui/label";
import { DateRangeSelect, type DateRange } from "@/components/date-select";
import { MultiSelectChips } from "@/components/multi-select-chips";
import {
  PR_CATEGORIES,
  PR_CATEGORY_LABEL,
  PR_PRODUCTS,
  PR_REQUESTERS,
  type PrCategoryId,
} from "@/lib/pr";

/* ------------------------------------------------------------------
   ตัวกรองของหน้าขอซื้อ PR — หกช่องตามไฟล์ออกแบบ (วันที่ต้องการสินค้า/
   เลขที่ใบขอซื้อ/ประเภทสินค้า/สินค้า/บรรจุภัณฑ์/ผู้ขอซื้อ) แก้ในกล่องก่อน
   กดตกลงถึงมีผล กากบาทกับ Esc คือยกเลิก ชุดเดียวกับหน้าสต็อกทั่วไป

   "สินค้า" กรองตาม "ประเภทสินค้า" ที่เลือกไว้ก่อน (ถ้าเลือกไว้) เหมือนตอน
   สร้างใบขอซื้อ — เลือกประเภทแคบลงแล้วช่องสินค้าควรเหลือแต่ตัวเลือกที่เกี่ยวข้อง
------------------------------------------------------------------ */

export type PrView = {
  neededRange?: DateRange;
  codeQuery: string;
  categories: PrCategoryId[];
  /** เก็บเป็น product id ไม่ใช่ชื่อ เพราะสินค้าชื่อซ้ำกันได้ข้ามประเภท */
  productIds: string[];
  packings: string[];
  requesters: string[];
};

export const PR_VIEW_DEFAULT: PrView = {
  neededRange: undefined,
  codeQuery: "",
  categories: [],
  productIds: [],
  packings: [],
  requesters: [],
};

export const isPrViewDefault = (v: PrView) =>
  !v.neededRange?.from &&
  !v.neededRange?.to &&
  v.codeQuery.trim() === "" &&
  v.categories.length === 0 &&
  v.productIds.length === 0 &&
  v.packings.length === 0 &&
  v.requesters.length === 0;

const CATEGORY_OPTIONS = PR_CATEGORIES.map((c) => ({
  value: c as string,
  label: PR_CATEGORY_LABEL[c],
}));

const PACKING_OPTIONS = Array.from(
  new Set(PR_PRODUCTS.flatMap((p) => p.packingOptions))
).map((p) => ({ value: p, label: p }));

const REQUESTER_OPTIONS = PR_REQUESTERS.map((r) => ({ value: r, label: r }));

export function PrFilter({
  view,
  onApply,
}: {
  view: PrView;
  /** เอาค่าที่แก้ไว้ไปใช้แล้วปิดกล่อง — ยกเลิกใช้กากบาทหรือ Esc */
  onApply: (next: PrView) => void;
}) {
  // ค่าที่กำลังแก้อยู่ในกล่อง ยังไม่มีผลกับรายการจนกว่าจะกดตกลง
  const [draft, setDraft] = React.useState(view);
  const set = (next: Partial<PrView>) => setDraft((prev) => ({ ...prev, ...next }));

  const productOptions = (
    draft.categories.length === 0
      ? PR_PRODUCTS
      : PR_PRODUCTS.filter((p) => draft.categories.includes(p.category))
  ).map((p) => ({ value: p.id, label: p.sub ? `${p.name} ${p.sub}` : p.name }));

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
        <Section title="วันที่ต้องการสินค้า" htmlFor="pr-needed-range">
          <DateRangeSelect
            id="pr-needed-range"
            value={draft.neededRange}
            onValueChange={(neededRange) => set({ neededRange })}
            placeholder="เลือกวันที่"
            className="bg-card"
          />
        </Section>

        <Section title="เลขที่ใบขอซื้อ" htmlFor="pr-code">
          <Input
            id="pr-code"
            className="bg-card"
            placeholder="ระบุเลขที่ใบขอซื้อ"
            value={draft.codeQuery}
            onChange={(e) => set({ codeQuery: e.target.value })}
          />
        </Section>

        <Section title="ประเภทสินค้า" htmlFor="pr-categories">
          <MultiSelectChips
            id="pr-categories"
            options={CATEGORY_OPTIONS}
            value={draft.categories}
            onValueChange={(v) =>
              set({
                categories: v as PrCategoryId[],
                // เปลี่ยนประเภทแล้วตัวเลือกสินค้าเดิมอาจไม่อยู่ในประเภทใหม่แล้ว
                productIds: [],
              })
            }
            placeholder="เลือกประเภท"
            searchPlaceholder="ค้นหาประเภท"
            maxChips={2}
            className="min-h-10 bg-card"
          />
        </Section>

        <Section title="สินค้า" htmlFor="pr-products">
          <MultiSelectChips
            id="pr-products"
            options={productOptions}
            value={draft.productIds}
            onValueChange={(productIds) => set({ productIds })}
            placeholder="เลือกสินค้า"
            searchPlaceholder="ค้นหาสินค้า"
            maxChips={1}
            className="min-h-10 bg-card"
          />
        </Section>

        <Section title="บรรจุภัณฑ์" htmlFor="pr-packings">
          <MultiSelectChips
            id="pr-packings"
            options={PACKING_OPTIONS}
            value={draft.packings}
            onValueChange={(packings) => set({ packings })}
            placeholder="เลือกบรรจุภัณฑ์"
            searchPlaceholder="ค้นหาบรรจุภัณฑ์"
            maxChips={2}
            className="min-h-10 bg-card"
          />
        </Section>

        <Section title="ผู้ขอซื้อ" htmlFor="pr-requesters">
          <MultiSelectChips
            id="pr-requesters"
            options={REQUESTER_OPTIONS}
            value={draft.requesters}
            onValueChange={(requesters) => set({ requesters })}
            placeholder="เลือกผู้ขอซื้อ"
            searchPlaceholder="ค้นหาผู้ขอซื้อ"
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
          disabled={isPrViewDefault(draft)}
          onClick={() => setDraft(PR_VIEW_DEFAULT)}
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
      <div className="mt-2">{children}</div>
    </div>
  );
}
