"use client";

import * as React from "react";
import { ListIcon, RotateCcwIcon, SlidersHorizontalIcon, TagIcon } from "lucide-react";
import { Button } from "@peckey954/ui/components/ui/button";
import { Checkbox } from "@peckey954/ui/components/ui/checkbox";
import { Label } from "@peckey954/ui/components/ui/label";
import {
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
} from "@peckey954/ui/components/ui/popover";
import { Separator } from "@peckey954/ui/components/ui/separator";
import { CWIP_VIEW_DEFAULT, type CwipView } from "./packing-cwip";

/* ------------------------------------------------------------------
   ตัวกรองของแท็บสต็อก CWIP

   ชุดเดียวกับที่หน้าสต็อกทั่วไปใช้ เพราะรายการหน้าตาเหมือนกัน
   สินค้า > ล็อต มีป้ายและปุ่มในแถวเหมือนกัน คนที่ใช้หน้านั้นเป็นแล้ว
   ต้องใช้หน้านี้ได้ทันทีโดยไม่ต้องเรียนรู้ใหม่

   ปิดรายการล็อตทิ้งคือของที่ช่วยได้มากที่สุด
   เหลือแต่หัวสินค้ากับยอดรวม ไล่ดูภาพรวมทั้งหน้าได้ในจอเดียว
------------------------------------------------------------------ */

export const isCwipDefault = (v: CwipView) =>
  v.showChips === CWIP_VIEW_DEFAULT.showChips &&
  v.showActions === CWIP_VIEW_DEFAULT.showActions &&
  v.showLots === CWIP_VIEW_DEFAULT.showLots;

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
          ปิดสิ่งที่ไม่ได้ใช้ รายการจะสั้นลงและไล่ดูได้เร็วขึ้น
        </PopoverDescription>
      </PopoverHeader>

      <div className="mt-4 space-y-3">
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
