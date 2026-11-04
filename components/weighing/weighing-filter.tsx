"use client";

import * as React from "react";
import { RotateCcwIcon } from "lucide-react";
import { Button } from "@peckey954/ui/components/ui/button";
import { Input } from "@peckey954/ui/components/ui/input";
import { Label } from "@peckey954/ui/components/ui/label";
import { DateSelect, parseDateSlash } from "@/components/date-select";
import { MultiSelectChips } from "@/components/multi-select-chips";
import type { WeighingDoc } from "@/lib/weighing";

/* ------------------------------------------------------------------
   ตัวกรองและการแสดงผล — ตามแบบ: วันที่เอกสาร / เลขที่เอกสาร / วันที่รถจะเข้า /
   ทะเบียนรถ / บริษัท / ประเภทสินค้า / หมวด / สินค้า / บรรจุภัณฑ์
   ช่องดรอปดาวน์เลือกได้หลายค่า (โน้ตในแบบ) ใช้ MultiSelectChips ทั้งหมด
   กรอกในกล่องแล้วยังไม่มีผลจนกว่าจะกด "ค้นหา" — "ล้างค่า" ล้างทุกช่องในกล่อง
------------------------------------------------------------------ */

export type WeighingView = {
  docDate?: Date;
  codeQuery: string;
  arriveDate?: Date;
  plateQuery: string;
  suppliers: string[];
  categories: string[];
  groups: string[];
  products: string[];
  packings: string[];
};

export const WEIGHING_VIEW_DEFAULT: WeighingView = {
  codeQuery: "",
  plateQuery: "",
  suppliers: [],
  categories: [],
  groups: [],
  products: [],
  packings: [],
};

export function isWeighingViewDefault(v: WeighingView) {
  return (
    !v.docDate &&
    !v.arriveDate &&
    !v.codeQuery.trim() &&
    !v.plateQuery.trim() &&
    [v.suppliers, v.categories, v.groups, v.products, v.packings].every((a) => a.length === 0)
  );
}

/** วันที่เอกสาร "1/16/2026 | 10:42:52" (เดือน/วัน/ปี) → Date ระดับวัน */
export function parseWeighingDocDate(stamp: string): Date | undefined {
  const m = stamp.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  return m ? new Date(+m[3], +m[1] - 1, +m[2]) : undefined;
}

const sameDay = (a?: Date, b?: Date) => !!a && !!b && a.toDateString() === b.toDateString();
const productLabel = (d: WeighingDoc) => [d.productName, d.productSub].filter(Boolean).join(" ");

export function matchesWeighingView(d: WeighingDoc, v: WeighingView): boolean {
  if (v.docDate && !sameDay(parseWeighingDocDate(d.createdAt), v.docDate)) return false;
  if (v.arriveDate && !sameDay(parseDateSlash(d.arriveDate), v.arriveDate)) return false;
  if (v.codeQuery.trim() && !d.code.toLowerCase().includes(v.codeQuery.trim().toLowerCase())) return false;
  if (v.plateQuery.trim() && !d.plate.replace(/\s/g, "").includes(v.plateQuery.replace(/\s/g, ""))) return false;
  if (v.suppliers.length && !v.suppliers.includes(d.supplier)) return false;
  if (v.categories.length && !v.categories.includes(d.category)) return false;
  if (v.groups.length && !v.groups.includes(d.group)) return false;
  if (v.products.length && !v.products.includes(productLabel(d))) return false;
  if (v.packings.length && (!d.packing || !v.packings.includes(d.packing))) return false;
  return true;
}

const optionsOf = (values: (string | undefined)[]) =>
  [...new Set(values.filter((v): v is string => !!v))].sort().map((v) => ({ value: v, label: v }));

export function WeighingFilter({
  docs,
  value,
  onApply,
}: {
  /** ใบทั้งหมดของแท็บนี้ — ใช้ทำตัวเลือกในดรอปดาวน์ */
  docs: WeighingDoc[];
  value: WeighingView;
  onApply: (next: WeighingView) => void;
}) {
  const [draft, setDraft] = React.useState(value);
  const set = (patch: Partial<WeighingView>) => setDraft((d) => ({ ...d, ...patch }));

  const opts = React.useMemo(
    () => ({
      suppliers: optionsOf(docs.map((d) => d.supplier)),
      categories: optionsOf(docs.map((d) => d.category)),
      groups: optionsOf(docs.map((d) => d.group)),
      products: optionsOf(docs.map(productLabel)),
      packings: optionsOf(docs.map((d) => d.packing)),
    }),
    [docs]
  );

  const multi = (
    key: "suppliers" | "categories" | "groups" | "products" | "packings",
    label: string,
    placeholder: string
  ) => (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <MultiSelectChips
        options={opts[key]}
        value={draft[key]}
        onValueChange={(v) => set({ [key]: v })}
        placeholder={placeholder}
        aria-label={label}
      />
    </div>
  );

  return (
    <>
      <div className="grid max-h-[65vh] gap-4 overflow-y-auto px-4 py-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>วันที่เอกสาร</Label>
          <DateSelect value={draft.docDate} onValueChange={(d) => set({ docDate: d })} placeholder="เลือกวันที่" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="wf-code">เลขที่เอกสาร</Label>
          <Input
            id="wf-code"
            placeholder="ระบุเลขที่เอกสาร"
            value={draft.codeQuery}
            onChange={(e) => set({ codeQuery: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label>วันที่รถจะเข้า</Label>
          <DateSelect
            value={draft.arriveDate}
            onValueChange={(d) => set({ arriveDate: d })}
            placeholder="เลือกวันที่"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="wf-plate">ทะเบียนรถ</Label>
          <Input
            id="wf-plate"
            placeholder="ระบุทะเบียนรถ"
            value={draft.plateQuery}
            onChange={(e) => set({ plateQuery: e.target.value })}
          />
        </div>
        {multi("suppliers", "บริษัท", "เลือกบริษัท")}
        {multi("categories", "ประเภทสินค้า", "เลือกประเภท")}
        {multi("groups", "หมวด", "เลือกหมวด")}
        {multi("products", "สินค้า", "เลือกสินค้า")}
        {multi("packings", "บรรจุภัณฑ์", "เลือกบรรจุภัณฑ์")}
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3">
        <Button variant="ghost" className="text-primary" onClick={() => setDraft(WEIGHING_VIEW_DEFAULT)}>
          <RotateCcwIcon />
          ล้างค่า
        </Button>
        <Button onClick={() => onApply(draft)}>ค้นหา</Button>
      </div>
    </>
  );
}
