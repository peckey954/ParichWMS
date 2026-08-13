"use client";

import * as React from "react";
import { ChevronDownIcon, SettingsIcon } from "lucide-react";
import { Badge } from "@peckey954/ui/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@peckey954/ui/components/ui/collapsible";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@peckey954/ui/components/ui/input-group";
import { Label } from "@peckey954/ui/components/ui/label";
import { Separator } from "@peckey954/ui/components/ui/separator";
import {
  BUDGET_FIELDS,
  DEFAULT_FIELDS,
  formatBaht,
  toNumber,
  type BudgetKey,
  type CostDefaults,
} from "@/lib/recipe-cost";

/* ------------------------------------------------------------------
   ชั้นที่ 1 — ค่าตั้งต้นของทั้งตาราง

   12 คอลัมน์ในไฟล์ Excel เป็นค่าเดียวกันทั้ง 36 แถว เอามารวมไว้ที่เดียว
   แก้ครั้งเดียวมีผลทุกสูตร แทนที่จะพิมพ์เลข 10 ซ้ำ 288 ครั้ง

   ผลพลอยได้คือหน้าจอแคบก็ใช้ได้ เพราะเหลือช่องกรอกรายสูตรแค่สามช่อง
------------------------------------------------------------------ */

export function CostDefaultsCard({
  value,
  onChange,
  overriddenRows,
}: {
  value: CostDefaults;
  onChange: (next: CostDefaults) => void;
  /** จำนวนสูตรที่ปรับค่าทับไว้ ไม่ได้ใช้ค่ากลาง */
  overriddenRows: number;
}) {
  const set = (key: Exclude<keyof CostDefaults, "budgets">, v: string) =>
    onChange({ ...value, [key]: v });

  const setBudget = (key: BudgetKey, v: string) =>
    onChange({ ...value, budgets: { ...value.budgets, [key]: v } });

  const budgetTotal = BUDGET_FIELDS.reduce(
    (sum, b) => sum + toNumber(value.budgets[b.key]),
    0
  );

  return (
    <section className="rounded-xl border border-border bg-card">
      <div className="flex items-start gap-3 p-4 sm:p-5">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand text-primary">
          <SettingsIcon className="size-5" strokeWidth={1.5} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold">ค่าตั้งต้น ใช้กับทุกสูตร</p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            ค่าพวกนี้เท่ากันทั้งตาราง แก้ที่นี่ที่เดียวมีผลทุกสูตร
            สูตรไหนต้องต่างค่อยปรับทับเป็นรายตัว
          </p>
        </div>
        {overriddenRows > 0 && (
          <Badge tone="warning" appearance="soft" className="shrink-0">
            {overriddenRows} สูตรปรับทับไว้
          </Badge>
        )}
      </div>

      <Separator />

      <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-3">
        {DEFAULT_FIELDS.map((f) => (
          <div key={f.key} className="space-y-1.5">
            <Label htmlFor={`def-${f.key}`} className="text-sm">
              {f.label}
              <span className="ml-1 font-normal text-muted-foreground">
                · {f.note}
              </span>
            </Label>
            <InputGroup className="bg-card">
              <InputGroupInput
                id={`def-${f.key}`}
                inputMode="decimal"
                placeholder="0"
                value={value[f.key]}
                onChange={(e) => set(f.key, e.target.value)}
                className="text-right tabular-nums"
              />
              <InputGroupAddon align="inline-end">{f.suffix}</InputGroupAddon>
            </InputGroup>
          </div>
        ))}
      </div>

      {/* งบการตลาด 8 ก้อน หุบไว้ เพราะแก้ไม่บ่อยเท่าค่าด้านบน
          แต่โชว์ยอดรวมไว้บนหัวเสมอ เพราะยอดนี้บวกเข้าต้นทุนรวมทุกสูตร */}
      <Collapsible>
        <Separator />
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="group flex w-full items-center gap-3 p-4 text-left sm:px-5"
          >
            <span className="min-w-0 flex-1">
              <span className="block font-medium">งบการตลาดต่อถุง</span>
              <span className="block text-sm text-muted-foreground">
                {BUDGET_FIELDS.length} ก้อน รวม{" "}
                <span className="font-semibold text-foreground tabular-nums">
                  {formatBaht(budgetTotal)}
                </span>{" "}
                บาท บวกเข้าต้นทุนรวมทุกสูตร
              </span>
            </span>
            <ChevronDownIcon className="size-5 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent className="grid gap-3 px-4 pb-4 sm:grid-cols-2 sm:px-5 sm:pb-5 xl:grid-cols-4">
          {BUDGET_FIELDS.map((b) => (
            <div key={b.key} className="space-y-1.5">
              <Label htmlFor={`bud-${b.key}`} className="text-sm">
                {b.label}
              </Label>
              <InputGroup className="bg-card">
                <InputGroupInput
                  id={`bud-${b.key}`}
                  inputMode="decimal"
                  placeholder="0"
                  value={value.budgets[b.key]}
                  onChange={(e) => setBudget(b.key, e.target.value)}
                  className="text-right tabular-nums"
                />
                <InputGroupAddon align="inline-end">บาท</InputGroupAddon>
              </InputGroup>
            </div>
          ))}
        </CollapsibleContent>
      </Collapsible>
    </section>
  );
}
