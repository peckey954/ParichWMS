"use client";

import * as React from "react";
import { Button } from "@peckey954/ui/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@peckey954/ui/components/ui/dialog";
import { cn } from "@peckey954/ui/lib/utils";
import {
  SUGGESTED_MATERIALS,
  SUGGEST_DATE,
  formatQty,
  formatTon,
  isShort,
  type SuggestedMaterial,
} from "@/lib/packing-list";

/* ------------------------------------------------------------------
   แนะนำวัตถุดิบใช้ผลิตวันนี้ — ดูอย่างเดียว

   รายการเดียวใช้ทุกขนาดจอ ไม่แยกตารางกับการ์ด
   สามคอลัมน์นี้บีบลงจอ 390px แล้วเลขตกบรรทัดจนไม่รู้ว่าเลขไหนของคอลัมน์ไหน
   สิ่งที่คนต้องรู้จริง ๆ คือ "เบิกอะไร เท่าไร" ยอดในคลังเป็นข้อมูลประกอบ
   จึงลดลงไปเป็นบรรทัดรองใต้ชื่อได้โดยไม่เสียความหมาย

   ของไม่พอไม่มีป้ายบอก ใช้ตัวหนังสือแดงที่บรรทัดยอดในคลังแทน
   เพราะจุดที่ต้องสะดุดตาคือ "ตัวเลขนี้น้อยไป" ไม่ใช่ป้ายที่อยู่คนละที่กับตัวเลข
------------------------------------------------------------------ */

export function SuggestMaterialsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const rows = SUGGESTED_MATERIALS;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="text-left">
          <DialogTitle>แนะนำวัตถุดิบใช้ผลิตวันนี้</DialogTitle>
          <DialogDescription>{SUGGEST_DATE}</DialogDescription>
        </DialogHeader>

        <div className="max-h-[55vh] overflow-y-auto rounded-xl border border-border">
          {/* หัวข้อติดบนตอนเลื่อน คำว่า "แนะนำ" คือป้ายกำกับคอลัมน์ขวา
              ถ้าเลื่อนแล้วหลุดไป ตัวเลขทางขวาจะกลายเป็นเลขลอย ๆ ไม่มีชื่อ */}
          <div className="sticky top-0 z-10 flex items-end justify-between gap-3 border-b border-border bg-card px-4 py-3">
            <p className="min-w-0 font-semibold">
              วัตถุดิบคลัง WIP
              <span className="block text-sm font-normal text-muted-foreground">
                ({rows.length} รายการ)
              </span>
            </p>
            <p className="shrink-0 text-sm text-muted-foreground">แนะนำ</p>
          </div>

          {rows.map((m, i) => (
            <MaterialRow key={m.id} material={m} last={i === rows.length - 1} />
          ))}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline-primary" className="w-full">
              ย้อนกลับ
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MaterialRow({
  material: m,
  last,
}: {
  material: SuggestedMaterial;
  last: boolean;
}) {
  const shortfall = isShort(m);

  return (
    <div
      className={cn(
        "flex items-start gap-3 px-4 py-3",
        !last && "border-b border-border"
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium" title={m.name}>
          {m.name}
        </p>
        <p
          className={cn(
            "mt-0.5 text-sm tabular-nums",
            shortfall ? "text-danger-strong" : "text-muted-foreground"
          )}
        >
          ในคลัง {formatQty(m.stock)} {m.unit}
        </p>
      </div>

      <p className="shrink-0 text-right tabular-nums">
        <span className="font-semibold">{formatTon(m.suggest)}</span>
        <span className="ml-1 text-sm font-normal text-muted-foreground">
          {m.unit}
        </span>
      </p>
    </div>
  );
}
