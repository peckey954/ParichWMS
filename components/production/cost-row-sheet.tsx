"use client";

import * as React from "react";
import { Badge } from "@peckey954/ui/components/ui/badge";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@peckey954/ui/components/ui/input-group";
import { Label } from "@peckey954/ui/components/ui/label";
import { Separator } from "@peckey954/ui/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@peckey954/ui/components/ui/sheet";
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
   แก้ทีละสูตร — ครบทั้ง 17 ช่องของสูตรนั้นในจอเดียว

   ใช้ตอนตั้งค่าสูตรใหม่ หรือตอนไล่เก็บสูตรที่ยังกรอกไม่ครบ
   ต่างจากโหมดทีละช่องตรงที่อันนั้นไว้ไล่แก้ค่าเดียวกันข้ามหลายสูตร

   กล่องสรุปอยู่บนสุด ไม่ใช่ล่างสุด เพราะ 17 ช่องยาวเกินหนึ่งหน้าจอ
   ถ้าวางไว้ล่างจะไม่เห็นผลตอนพิมพ์ช่องแรก ๆ
------------------------------------------------------------------ */

const GROUP_ORDER: FieldGroup[] = ["cost", "rate", "budget", "price"];

export function CostRowSheet({
  row,
  open,
  onOpenChange,
  onPatch,
}: {
  row: CostRow | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onPatch: (id: string, key: FieldKey, value: string) => void;
}) {
  if (!row) return null;

  const r = computeCost(row);
  const blanks = rowBlanks(row);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="text-left">{row.sku}</SheetTitle>
          <SheetDescription className="text-left">
            บรรจุ {row.size} กก. ·{" "}
            {blanks > 0 ? `ยังว่าง ${blanks} ช่อง` : "กรอกครบทั้ง 17 ช่องแล้ว"}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 px-4 pb-4">
          {/* ผลลัพธ์ตรึงไว้บนสุด เห็นตัวเลขขยับตลอดขณะไล่กรอกลงไป */}
          <div className="sticky top-0 z-10 rounded-xl bg-brand p-4">
            <Line label="ต้นทุนการผลิต" value={r.production} />
            <Line label="ต้นทุนก่อน Rebate" value={r.beforeRebate} />
            <Line label="งบการตลาด" value={r.budgetTotal} />
            <Separator className="my-2" />
            <Line label="ต้นทุนรวม" value={r.total} strong />
            <Line label="ราคาขายจริง" value={r.price} strong />
          </div>

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

                <div className="mt-3 space-y-3">
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
                          onChange={(e) => onPatch(row.id, f.key, e.target.value)}
                          className="text-right tabular-nums"
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
      </SheetContent>
    </Sheet>
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
