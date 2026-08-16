"use client";

import * as React from "react";
import { Button } from "@peckey954/ui/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@peckey954/ui/components/ui/dialog";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@peckey954/ui/components/ui/input-group";
import { Label } from "@peckey954/ui/components/ui/label";
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
   Modal กรอกค่าของสูตรเดียว — 17 ช่องครบในที่เดียว

   จอแคบใช้ตารางไม่ได้ ก็ให้กดที่สูตรแล้วเปิด modal ขึ้นมาแทน
   กล่องสรุปตรึงไว้บนสุดของส่วนที่เลื่อน ล็อกไว้แค่ "ต้นทุนรวม" กับ
   "ราคาขายจริง" สองบรรทัด — ไม่ใช่ทุกขั้นของการคำนวณเหมือนก่อน
   เพราะที่เหลือเป็นค่าระหว่างทาง ไม่ใช่คำตอบที่คนต้องเห็นตลอดเวลาที่เลื่อน
   กล่องสรุปเล็กลงจึงเหลือพื้นที่ให้ฟอร์ม 17 ช่องด้านล่างมากขึ้น
------------------------------------------------------------------ */

const GROUP_ORDER: FieldGroup[] = ["cost", "rate", "budget", "price"];

export function CostRowModal({
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="@container flex max-h-[85vh] flex-col sm:max-w-lg">
        <DialogHeader className="text-left">
          <DialogTitle>แก้ไขต้นทุน</DialogTitle>
          <div>
            <p className="font-medium text-foreground">{row.sku}</p>
            <DialogDescription className="mt-0.5">
              บรรจุ {row.size} กก. ·{" "}
              {blanks > 0 ? `ยังว่าง ${blanks} ช่อง` : "กรอกครบทุกช่องแล้ว"}
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="-mx-6 overflow-y-auto px-6">
          {/* ล็อกไว้แค่สองบรรทัดที่เป็นคำตอบ ตรึงไว้บนสุด เห็นตลอดขณะเลื่อนกรอก */}
          <div className="sticky top-0 z-10 rounded-xl bg-brand p-4">
            <Line label="ต้นทุนรวม" value={r.total} strong />
            <Line label="ราคาขายจริง" value={r.price} strong />
          </div>

          <div className="mt-4 space-y-4 pb-4">
            {GROUP_ORDER.map((g) => {
              const fields = fieldsByGroup(g);
              return (
                <div key={g} className="rounded-xl border border-border p-4">
                  <p className="font-medium">{FIELD_GROUP_LABEL[g]}</p>

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
        <DialogFooter className="flex-row gap-2 sm:justify-stretch">
          <Button variant="outline" className="flex-1" onClick={() => onStep(-1)}>
            สูตรก่อนหน้า
          </Button>
          <Button variant="outline-primary" className="flex-1" onClick={() => onStep(1)}>
            สูตรถัดไป
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
