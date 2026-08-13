"use client";

import * as React from "react";
import { CheckIcon, ChevronRightIcon } from "lucide-react";
import { Badge } from "@peckey954/ui/components/ui/badge";
import { Button } from "@peckey954/ui/components/ui/button";
import { Input } from "@peckey954/ui/components/ui/input";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@peckey954/ui/components/ui/toggle-group";
import { cn } from "@peckey954/ui/lib/utils";
import { RECIPE_GROUP_LABEL } from "@/lib/recipe";
import {
  ROW_FIELDS,
  computeCost,
  formatBaht,
  toNumber,
  type CostDefaults,
  type CostRow,
  type RowFieldKey,
} from "@/lib/recipe-cost";

/* ------------------------------------------------------------------
   ชั้นที่ 2 — แก้ทีละช่อง ข้ามทุกสูตร

   งานจริงคือ "Nitro ขึ้นราคา แล้วไล่แก้ทุกสูตร"
   ไม่ใช่ "แก้ทุกช่องของสูตรเดียว" การไล่ตามคอลัมน์จึงตรงกับพฤติกรรม
   มากกว่าการไล่ตามแถว และเป็นวิธีเดียวที่กรอกบนมือถือได้จริง

   หนึ่งช่องต่อหนึ่งจอ เลื่อนนิ้วเดียว คีย์แพดตัวเลขไม่ต้องปิด
------------------------------------------------------------------ */

export function CostByField({
  rows,
  defaults,
  onPatch,
}: {
  rows: CostRow[];
  defaults: CostDefaults;
  onPatch: (id: string, key: RowFieldKey, value: string) => void;
}) {
  const [field, setField] = React.useState<RowFieldKey>("nitro");
  const active = ROW_FIELDS.find((f) => f.key === field)!;

  const filled = rows.filter((r) => toNumber(r[field]) > 0).length;

  return (
    <div className="space-y-3">
      {/* เลือกช่องที่จะไล่แก้ — จอแคบเลื่อนแนวนอนแทนการบีบให้เล็กจนกดพลาด */}
      <div className="-mx-4 max-w-full overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <ToggleGroup
          type="single"
          value={field}
          onValueChange={(v) => v && setField(v as RowFieldKey)}
          variant="outline"
          className="w-max"
        >
          {ROW_FIELDS.map((f) => (
            <ToggleGroupItem key={f.key} value={f.key} className="px-4">
              {f.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {active.hint} · ทั้งหมด {rows.length} สูตร
        </p>
        <Badge tone="neutral" appearance="soft">
          กรอกแล้ว {filled} สูตร
        </Badge>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {rows.map((row, i) => {
          const prev = i > 0 ? rows[i - 1].group : null;
          return (
            <React.Fragment key={row.id}>
              {row.group !== prev && (
                <p className="bg-surface px-4 py-2 text-sm font-medium text-muted-foreground">
                  {RECIPE_GROUP_LABEL[row.group]}
                </p>
              )}
              <div
                className={cn(
                  "flex items-center gap-3 px-4 py-3",
                  i < rows.length - 1 && "border-b border-border"
                )}
              >
                {/* ชื่อสูตรอยู่บรรทัดเดียวกับช่องกรอก คีย์แพดเด้งขึ้นมาแล้วยังเห็นว่ากรอกของสูตรไหน */}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium" title={row.sku}>
                    {row.sku}
                  </p>
                  <p className="text-sm text-muted-foreground tabular-nums">
                    ราคาขาย {formatBaht(computeCost(row, defaults).price)} บาท
                  </p>
                </div>
                <Input
                  aria-label={`${active.label} ของ ${row.sku}`}
                  inputMode="decimal"
                  placeholder="0"
                  value={row[field]}
                  onChange={(e) => onPatch(row.id, field, e.target.value)}
                  className="w-28 shrink-0 text-right tabular-nums"
                />
              </div>
            </React.Fragment>
          );
        })}
      </div>

      {/* ไล่ครบคอลัมน์นี้แล้วไปคอลัมน์ถัดไปได้เลย ไม่ต้องเลื่อนกลับขึ้นบน */}
      <NextField field={field} onChange={setField} />
    </div>
  );
}

function NextField({
  field,
  onChange,
}: {
  field: RowFieldKey;
  onChange: (k: RowFieldKey) => void;
}) {
  const i = ROW_FIELDS.findIndex((f) => f.key === field);
  const next = ROW_FIELDS[i + 1];

  if (!next) {
    return (
      <p className="flex items-center justify-center gap-2 py-2 text-sm text-muted-foreground">
        <CheckIcon className="size-4 shrink-0" />
        ช่องสุดท้ายแล้ว
      </p>
    );
  }

  return (
    <Button
      variant="outline-primary"
      className="w-full"
      onClick={() => onChange(next.key)}
    >
      ถัดไป: {next.label}
      <ChevronRightIcon />
    </Button>
  );
}
