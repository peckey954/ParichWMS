"use client";

import * as React from "react";
import {
  ListIcon,
  RotateCcwIcon,
  SlidersHorizontalIcon,
  TagIcon,
} from "lucide-react";
import { Button } from "@peckey954/ui/components/ui/button";
import { Checkbox } from "@peckey954/ui/components/ui/checkbox";
import { Label } from "@peckey954/ui/components/ui/label";
import {
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
} from "@peckey954/ui/components/ui/popover";
import { Separator } from "@peckey954/ui/components/ui/separator";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@peckey954/ui/components/ui/toggle-group";
import { cn } from "@peckey954/ui/lib/utils";
import { CWIP_VIEW_DEFAULT, type CwipView } from "./packing-cwip";
import { CWIP_KINDS, CWIP_ZONES, type CwipSort } from "@/lib/packing-list";

/* ------------------------------------------------------------------
   ตัวกรองของแท็บสต็อก CWIP

   แบ่งสามส่วนตามคำถามที่คนถาม ไม่ใช่ตามชนิดของ control
     กรองอะไรออก   — ประเภท โซน สถานะของ
     เรียงยังไง     — สินค้า / โซน / FIFO
     แสดงอะไรบ้าง  — ป้าย ปุ่ม รายการล็อต

   ประเภทกับโซนเลือกได้หลายอันพร้อมกัน เพราะของจริงคนถามว่า
   "Bulk กับแม่ปุ๋ยในโซน A เหลือเท่าไร" ไม่ใช่ทีละอย่าง
   ไม่เลือกเลย = เอาทั้งหมด ซึ่งตรงกับที่คนคาดมากกว่าบังคับให้ติ๊กครบ

   FIFO เรียงจากของเก่าสุดก่อน — ของค้างไลน์นานคือของที่ต้องรีบใช้
------------------------------------------------------------------ */

export const isCwipDefault = (v: CwipView) =>
  v.showChips === CWIP_VIEW_DEFAULT.showChips &&
  v.showActions === CWIP_VIEW_DEFAULT.showActions &&
  v.showLots === CWIP_VIEW_DEFAULT.showLots &&
  v.lowOnly === CWIP_VIEW_DEFAULT.lowOnly &&
  v.incomingOnly === CWIP_VIEW_DEFAULT.incomingOnly &&
  v.sort === CWIP_VIEW_DEFAULT.sort &&
  v.kinds.length === 0 &&
  v.zones.length === 0;

/** จำนวนเงื่อนไขที่กรองของออกจริง ๆ — ตัวเลือกการแสดงผลไม่นับ */
export const cwipActiveCount = (v: CwipView) =>
  (v.lowOnly ? 1 : 0) +
  (v.incomingOnly ? 1 : 0) +
  v.kinds.length +
  v.zones.length;

const SORTS: { id: CwipSort; label: string }[] = [
  { id: "product", label: "สินค้า" },
  { id: "zone", label: "โซน" },
  { id: "fifo", label: "FIFO" },
];

export function CwipFilter({
  view,
  onChange,
}: {
  view: CwipView;
  onChange: (next: CwipView) => void;
}) {
  const set = (next: Partial<CwipView>) => onChange({ ...view, ...next });

  const toggle = (key: "kinds" | "zones", value: string) =>
    set({
      [key]: view[key].includes(value)
        ? view[key].filter((v) => v !== value)
        : [...view[key], value],
    });

  return (
    <>
      <PopoverHeader>
        <PopoverTitle>ตัวกรองและการแสดงผล</PopoverTitle>
        <PopoverDescription>
          เลือกได้หลายอย่างพร้อมกัน ไม่เลือกเลยคือดูทั้งหมด
        </PopoverDescription>
      </PopoverHeader>

      {/* ---------- ประเภทสินค้า ---------- */}
      <div className="mt-4 space-y-2">
        <Label className="text-sm">ประเภทสินค้า</Label>
        <div className="flex flex-wrap gap-2">
          {CWIP_KINDS.map((k) => (
            <FilterChip
              key={k}
              label={k}
              on={view.kinds.includes(k)}
              onClick={() => toggle("kinds", k)}
            />
          ))}
        </div>
      </div>

      {/* ---------- โซน ----------
           ของชิ้นเดียวกันกระจายหลายโซน คนที่ยืนอยู่โซน A
           อยากเห็นเฉพาะของที่เดินไปหยิบได้ ไม่ใช่ทั้งโรงงาน */}
      <div className="mt-4 space-y-2">
        <Label className="text-sm">โซน</Label>
        <div className="flex flex-wrap gap-2">
          {CWIP_ZONES.map((z) => (
            <FilterChip
              key={z}
              label={z}
              on={view.zones.includes(z)}
              onClick={() => toggle("zones", z)}
            />
          ))}
        </div>
      </div>

      <Separator className="my-4" />

      {/* ---------- สถานะของ ---------- */}
      <div className="space-y-3">
        <Label className="text-sm">สถานะของ</Label>

        {/* ผูกค่าเดียวกับชิปสต็อกต่ำด้านบน กดที่ไหนอีกที่ก็ขยับตาม */}
        <Label htmlFor="cwip-low" className="flex items-center gap-3 font-normal">
          <Checkbox
            id="cwip-low"
            checked={view.lowOnly}
            onCheckedChange={(v) => set({ lowOnly: v === true })}
          />
          เฉพาะสต็อกต่ำ
        </Label>

        <Label
          htmlFor="cwip-incoming"
          className="flex items-center gap-3 font-normal"
        >
          <Checkbox
            id="cwip-incoming"
            checked={view.incomingOnly}
            onCheckedChange={(v) => set({ incomingOnly: v === true })}
          />
          เฉพาะที่มีของรอรับเข้า
        </Label>
      </div>

      <Separator className="my-4" />

      <div className="space-y-2">
        <Label className="text-sm">เรียงตาม</Label>
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          value={view.sort}
          onValueChange={(v) => v && set({ sort: v as CwipSort })}
          className="w-full"
        >
          {SORTS.map((s) => (
            <ToggleGroupItem key={s.id} value={s.id} className="flex-1">
              {s.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      <Separator className="my-4" />

      <div className="space-y-3">
        <Label className="text-sm">แสดงในรายการ</Label>

        <Label
          htmlFor="cwip-chips"
          className="flex items-center gap-3 font-normal"
        >
          <Checkbox
            id="cwip-chips"
            checked={view.showChips}
            onCheckedChange={(v) => set({ showChips: v === true })}
          />
          <span className="flex items-center gap-2">
            <TagIcon className="size-4" />
            ป้ายในรายการ
          </span>
        </Label>

        <Label
          htmlFor="cwip-actions"
          className="flex items-center gap-3 font-normal"
        >
          <Checkbox
            id="cwip-actions"
            checked={view.showActions}
            onCheckedChange={(v) => set({ showActions: v === true })}
          />
          <span className="flex items-center gap-2">
            <SlidersHorizontalIcon className="size-4" />
            ปุ่มคืนกลับคลัง / ปรับปรุง
          </span>
        </Label>

        <Label
          htmlFor="cwip-lots"
          className="flex items-center gap-3 font-normal"
        >
          <Checkbox
            id="cwip-lots"
            checked={view.showLots}
            onCheckedChange={(v) => set({ showLots: v === true })}
          />
          <span className="flex items-center gap-2">
            <ListIcon className="size-4" />
            รายการล็อตในสินค้า
          </span>
        </Label>
      </div>

      {/* ปิดไว้ตอนทุกอย่างเป็นค่าเริ่มต้นอยู่แล้ว จะได้รู้ว่ามีอะไรให้ล้างไหม */}
      <Separator className="my-4" />
      <Button
        variant="outline"
        size="sm"
        className="w-full"
        disabled={isCwipDefault(view)}
        onClick={() => onChange(CWIP_VIEW_DEFAULT)}
      >
        <RotateCcwIcon />
        ล้างค่า
      </Button>
    </>
  );
}

/** ชิปเลือกได้หลายอัน หน้าตาเดียวกับชิปนำทางด้านบน คนจึงรู้ทันทีว่ากดได้ */
function FilterChip({
  label,
  on,
  onClick,
}: {
  label: string;
  on: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={on}
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full border px-3 py-1 text-sm whitespace-nowrap transition-colors",
        "focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
        on
          ? "border-primary bg-brand font-medium text-primary"
          : "border-border text-foreground hover:bg-accent-hover"
      )}
    >
      {label}
    </button>
  );
}
