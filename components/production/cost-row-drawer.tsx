"use client";

import * as React from "react";
import { Badge } from "@peckey954/ui/components/ui/badge";
import { Button } from "@peckey954/ui/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@peckey954/ui/components/ui/drawer";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@peckey954/ui/components/ui/input-group";
import { Label } from "@peckey954/ui/components/ui/label";
import { Separator } from "@peckey954/ui/components/ui/separator";
import { cn } from "@peckey954/ui/lib/utils";
import {
  FIELD_GROUP_LABEL,
  computeCost,
  fieldsByGroup,
  formatBaht,
  isBlank,
  rowBlanks,
  type CostRow,
  type FieldGroup,
  type FieldKey,
} from "@/lib/recipe-cost";

/* ------------------------------------------------------------------
   Drawer กรอกค่าของสูตรเดียว — 17 ช่องครบในที่เดียว

   จอแคบใช้ตารางไม่ได้ ก็ให้กดที่สูตรแล้วดึงขึ้นมาจากด้านล่างแทน
   สูงสุด 80vh ตามค่าของ DS จึงยังเห็นว่ามีอะไรอยู่ข้างหลังและปัดปิดได้

   กล่องสรุปตรึงไว้บนสุดของส่วนที่เลื่อน ไม่ใช่ล่างสุด
   เพราะ 17 ช่องยาวเกินหนึ่งจอ ถ้าอยู่ล่างจะไม่เห็นผลตอนพิมพ์ช่องแรก ๆ
------------------------------------------------------------------ */

const GROUP_ORDER: FieldGroup[] = ["cost", "rate", "budget", "price"];

export function CostRowDrawer({
  row,
  open,
  onOpenChange,
  onPatch,
  onStep,
}: {
  row: CostRow | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onPatch: (id: string, key: FieldKey, value: string) => void;
  /** ไปสูตรก่อนหน้า/ถัดไปโดยไม่ต้องปิดแล้วเปิดใหม่ */
  onStep: (delta: number) => void;
}) {
  if (!row) return null;

  const r = computeCost(row);
  const blanks = rowBlanks(row);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="@container">
        <DrawerHeader className="text-left">
          <DrawerTitle>{row.sku}</DrawerTitle>
          <DrawerDescription>
            บรรจุ {row.size} กก. ·{" "}
            {blanks > 0 ? `ยังว่าง ${blanks} ช่อง` : "กรอกครบทุกช่องแล้ว"}
          </DrawerDescription>
        </DrawerHeader>

        <div className="overflow-y-auto px-4">
          {/* ผลลัพธ์ตรึงไว้บนสุด เห็นตัวเลขขยับตลอดขณะไล่กรอกลงไป */}
          <div className="sticky top-0 z-10 rounded-xl bg-brand p-4">
            <Line label="ต้นทุนการผลิต" value={r.production} />
            <Line label="ต้นทุนก่อน Rebate" value={r.beforeRebate} />
            <Line label="งบการตลาด" value={r.budgetTotal} />
            <Separator className="my-2" />
            <Line label="ต้นทุนรวม" value={r.total} strong />
            <Line label="ราคาขายจริง" value={r.price} strong />
          </div>

          <div className="mt-4 space-y-4 pb-4">
            {GROUP_ORDER.map((g) => {
              const fields = fieldsByGroup(g);
              const left = fields.filter((f) => isBlank(row[f.key])).length;
              return (
                <div key={g} className="rounded-xl border border-border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium">{FIELD_GROUP_LABEL[g]}</p>
                    {left > 0 && (
                      <Badge tone="warning" appearance="soft">
                        ว่าง {left}
                      </Badge>
                    )}
                  </div>

                  <div className="mt-3 grid gap-3 @md:grid-cols-2">
                    {fields.map((f) => (
                      <div key={f.key} className="space-y-1.5">
                        <Label htmlFor={`f-${f.key}`} className="text-sm">
                          {f.label}
                        </Label>
                        <InputGroup className="bg-card">
                          <InputGroupInput
                            id={`f-${f.key}`}
                            inputMode="decimal"
                            placeholder="0"
                            value={row[f.key]}
                            onChange={(e) =>
                              onPatch(row.id, f.key, e.target.value)
                            }
                            className={cn(
                              "text-right tabular-nums",
                              isBlank(row[f.key]) &&
                                "border-chip-yellow-foreground/50"
                            )}
                          />
                          <InputGroupAddon align="inline-end">
                            {f.suffix}
                          </InputGroupAddon>
                        </InputGroup>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ข้ามสูตรได้จากในนี้เลย ไม่ต้องปิดแล้วเลื่อนหาสูตรถัดไปในรายการ */}
        <DrawerFooter className="flex-row gap-2">
          <Button variant="outline" className="flex-1" onClick={() => onStep(-1)}>
            สูตรก่อนหน้า
          </Button>
          <Button variant="outline-primary" className="flex-1" onClick={() => onStep(1)}>
            สูตรถัดไป
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

function Line({
  label,
  value,
  strong,
}: {
  label: string;
  value: number;
  strong?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-0.5">
      <span
        className={cn("text-sm", strong ? "font-medium" : "text-muted-foreground")}
      >
        {label}
      </span>
      <span
        className={cn(
          "tabular-nums",
          strong ? "text-lg font-semibold text-primary" : "font-medium"
        )}
      >
        {formatBaht(value)}
        <span className="ml-1 text-sm font-normal text-muted-foreground">บาท</span>
      </span>
    </div>
  );
}
