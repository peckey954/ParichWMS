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
import { MultiSelect } from "@peckey954/ui/components/ui/multi-select";
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
import { CWIP_VIEW_DEFAULT, type CwipView } from "./packing-cwip";
import { CWIP_KINDS, CWIP_ZONES, type CwipSort } from "@/lib/packing-list";

/* ------------------------------------------------------------------
   ตัวกรองของแท็บสต็อก CWIP

   เรียงตามความถี่ที่คนแตะจริง ไม่ใช่ตามความสำคัญของข้อมูล
     1. เรียงตาม      — เปลี่ยนบ่อยที่สุด เดินไปหยิบของก็สลับเป็นโซน
                        จะเคลียร์ของเก่าก็สลับเป็น FIFO
     2. แสดงในรายการ  — ตั้งครั้งเดียวแล้วอยู่ยาว แต่แตะบ่อยกว่าการเลือกหมวด
     3. กรองข้อมูล    — ของจริงมีหมวดกับโซนเป็นสิบ ต้องค้นหาเอา ไม่ใช่ไล่กด

   หมวดกับโซนใช้ MultiSelect ของ DS ที่มีช่องค้นหาในตัว
   ชิปหกอันเรียงกันใช้ได้ตอนข้อมูลตัวอย่าง แต่ของจริงจะล้นกล่อง
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

/** จำนวนเงื่อนไขที่กรองของออกจริง ๆ — การเรียงกับการแสดงผลไม่นับ */
export const cwipActiveCount = (v: CwipView) =>
  (v.lowOnly ? 1 : 0) +
  (v.incomingOnly ? 1 : 0) +
  (v.kinds.length > 0 ? 1 : 0) +
  (v.zones.length > 0 ? 1 : 0);

const SORTS: { id: CwipSort; label: string }[] = [
  { id: "product", label: "สูตร" },
  { id: "zone", label: "โซน" },
  { id: "fifo", label: "FIFO" },
];

const asOptions = (values: string[]) =>
  values.map((v) => ({ value: v, label: v }));

export function CwipFilter({
  view,
  onChange,
}: {
  view: CwipView;
  onChange: (next: CwipView) => void;
}) {
  const set = (next: Partial<CwipView>) => onChange({ ...view, ...next });

  return (
    <>
      <PopoverHeader>
        <PopoverTitle>ตัวกรองและการแสดงผล</PopoverTitle>
        <PopoverDescription>
          เลือกได้หลายอย่างพร้อมกัน ไม่เลือกเลยคือดูทั้งหมด
        </PopoverDescription>
      </PopoverHeader>

      {/* ---------- 1. เรียงตาม ---------- */}
      <div className="mt-4 space-y-2">
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

      {/* ---------- 2. แสดงในรายการ ---------- */}
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

      <Separator className="my-4" />

      {/* ---------- 3. กรองข้อมูล ---------- */}
      <div className="space-y-3">
        <Label className="text-sm">กรองข้อมูล</Label>

        <div className="space-y-1.5">
          <Label htmlFor="cwip-kinds" className="font-normal">
            หมวดสินค้า
          </Label>
          <MultiSelect
            id="cwip-kinds"
            options={asOptions(CWIP_KINDS)}
            value={view.kinds}
            onValueChange={(kinds) => set({ kinds })}
            placeholder="ทุกหมวด"
            searchPlaceholder="ค้นหาหมวด"
            maxChips={2}
            className="bg-card"
          />
        </div>

        {/* โซนของจริงมีเป็นสิบ ไล่กดทีละอันไม่ไหว ต้องพิมพ์ชื่อโซนหาเอา */}
        <div className="space-y-1.5">
          <Label htmlFor="cwip-zones" className="font-normal">
            โซน
          </Label>
          <MultiSelect
            id="cwip-zones"
            options={asOptions(CWIP_ZONES)}
            value={view.zones}
            onValueChange={(zones) => set({ zones })}
            placeholder="ทุกโซน"
            searchPlaceholder="ค้นหาโซน"
            maxChips={2}
            className="bg-card"
          />
        </div>

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
