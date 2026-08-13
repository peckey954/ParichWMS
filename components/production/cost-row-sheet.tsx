"use client";

import * as React from "react";
import { RotateCcwIcon } from "lucide-react";
import { Badge } from "@peckey954/ui/components/ui/badge";
import { Button } from "@peckey954/ui/components/ui/button";
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
  DEFAULT_FIELDS,
  ROW_FIELDS,
  computeCost,
  formatBaht,
  overrideCount,
  type CostDefaults,
  type CostRow,
  type RowFieldKey,
} from "@/lib/recipe-cost";

/* ------------------------------------------------------------------
   ชั้นที่ 3 — แก้ทีละสูตร

   เปิดเต็มจอ กรอกสามช่องที่เป็นของสูตรนั้นจริง ๆ
   แล้วเห็นต้นทุนรวมกับราคาขายขยับตามทันทีขณะพิมพ์
   ถ้าสูตรนี้ต้องใช้ค่าต่างจากค่ากลาง ปรับทับได้ในส่วนล่าง

   ใช้ได้ทั้งจอกว้างและจอแคบ จอกว้างเรียกจากปุ่มในตาราง
------------------------------------------------------------------ */

export function CostRowSheet({
  row,
  defaults,
  open,
  onOpenChange,
  onPatch,
  onOverride,
}: {
  row: CostRow | null;
  defaults: CostDefaults;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onPatch: (id: string, key: RowFieldKey, value: string) => void;
  onOverride: (id: string, key: string, value: string) => void;
}) {
  if (!row) return null;

  const result = computeCost(row, defaults);
  const overrides = overrideCount(row.override);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="text-left">{row.sku}</SheetTitle>
          <SheetDescription className="text-left">
            บรรจุ {row.size} กก. · ต้นทุนวัตถุดิบ{" "}
            {formatBaht(row.rawMaterial)} บาท (ดึงจากผลคำนวณสูตร)
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 px-4 pb-4">
          {/* ---------- สามช่องของสูตรนี้ ---------- */}
          <div className="space-y-3">
            {ROW_FIELDS.map((f) => (
              <div key={f.key} className="space-y-1.5">
                <Label htmlFor={`row-${f.key}`} className="text-sm">
                  {f.label}
                  <span className="ml-1 font-normal text-muted-foreground">
                    · {f.hint}
                  </span>
                </Label>
                <InputGroup className="bg-card">
                  <InputGroupInput
                    id={`row-${f.key}`}
                    inputMode="decimal"
                    placeholder="0"
                    value={row[f.key]}
                    onChange={(e) => onPatch(row.id, f.key, e.target.value)}
                    className="text-right tabular-nums"
                  />
                  <InputGroupAddon align="inline-end">บาท</InputGroupAddon>
                </InputGroup>
              </div>
            ))}
          </div>

          {/* ---------- ผลลัพธ์ ขยับตามตอนพิมพ์ ----------
              ต้องอยู่ในจอเดียวกับช่องกรอก ไม่งั้นบนมือถือจะพิมพ์แบบตาบอด */}
          <div className="rounded-xl bg-brand p-4">
            <Line label="ต้นทุนการผลิต" value={result.production} />
            <Line label="ต้นทุนก่อน Rebate" value={result.beforeRebate} />
            <Line label="งบการตลาด" value={result.budgetTotal} />
            <Separator className="my-2" />
            <Line label="ต้นทุนรวม" value={result.total} strong />
            <Line label="ราคาขายจริง" value={result.price} strong />
          </div>

          {/* ---------- ปรับค่ากลางทับเฉพาะสูตรนี้ ---------- */}
          <div className="rounded-xl border border-border p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-medium">ปรับค่าตั้งต้นเฉพาะสูตรนี้</p>
              {overrides > 0 && (
                <Badge tone="warning" appearance="soft">
                  ทับไว้ {overrides} ช่อง
                </Badge>
              )}
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">
              เว้นว่าง = ใช้ค่ากลาง กรอกเมื่อสูตรนี้ต้องต่างจากสูตรอื่นจริง ๆ
            </p>

            <div className="mt-3 space-y-3">
              {DEFAULT_FIELDS.map((f) => {
                const custom = row.override[f.key];
                const on = custom !== undefined && custom !== "";
                return (
                  <div key={f.key} className="space-y-1.5">
                    <Label
                      htmlFor={`ovr-${f.key}`}
                      className={cn("text-sm", on && "text-primary")}
                    >
                      {f.label}
                    </Label>
                    <div className="flex items-center gap-2">
                      <InputGroup className="bg-card">
                        <InputGroupInput
                          id={`ovr-${f.key}`}
                          inputMode="decimal"
                          placeholder={`ค่ากลาง ${defaults[f.key]}`}
                          value={custom ?? ""}
                          onChange={(e) =>
                            onOverride(row.id, f.key, e.target.value)
                          }
                          className="text-right tabular-nums"
                        />
                        <InputGroupAddon align="inline-end">
                          {f.suffix}
                        </InputGroupAddon>
                      </InputGroup>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`ใช้ค่ากลางของ ${f.label}`}
                        disabled={!on}
                        onClick={() => onOverride(row.id, f.key, "")}
                      >
                        <RotateCcwIcon />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
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
      <span className={cn("text-sm", strong ? "font-medium" : "text-muted-foreground")}>
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
