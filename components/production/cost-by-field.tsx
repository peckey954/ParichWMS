"use client";

import * as React from "react";
import {
  ArrowDownToLineIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react";
import { Badge } from "@peckey954/ui/components/ui/badge";
import { Button } from "@peckey954/ui/components/ui/button";
import { Input } from "@peckey954/ui/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@peckey954/ui/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@peckey954/ui/components/ui/select";
import { cn } from "@peckey954/ui/lib/utils";
import { RECIPE_GROUP_LABEL } from "@/lib/recipe";
import {
  COST_FIELDS,
  FIELD_GROUP_LABEL,
  computeCost,
  fieldsByGroup,
  formatBaht,
  isBlank,
  type CostRow,
  type FieldGroup,
  type FieldKey,
} from "@/lib/recipe-cost";

/* ------------------------------------------------------------------
   แก้ทีละช่อง ข้ามทุกสูตร

   17 ช่อง × 33 สูตร = 561 ช่อง การไล่ทีละแถวจะพาไปแตะทุกคอลัมน์
   ของสูตรเดียวแล้วค่อยขึ้นสูตรใหม่ ซึ่งไม่ตรงกับงานจริง
   งานจริงคือ "ค่าถุงขึ้นราคา ไล่แก้ทุกสูตร" — ไล่ตามคอลัมน์

   หนึ่งช่องต่อหนึ่งจอ + ปุ่มเติมทั้งคอลัมน์ ไว้ตั้งค่าตั้งต้นรวดเดียว
   แล้วค่อยไล่แก้เฉพาะสูตรที่ต่าง แทนที่จะพิมพ์เลขเดิม 33 ครั้ง
------------------------------------------------------------------ */

const GROUP_ORDER: FieldGroup[] = ["cost", "rate", "budget", "price"];

export function CostByField({
  rows,
  field,
  onFieldChange,
  onPatch,
  onFillDown,
}: {
  rows: CostRow[];
  field: FieldKey;
  onFieldChange: (k: FieldKey) => void;
  onPatch: (id: string, key: FieldKey, value: string) => void;
  onFillDown: (key: FieldKey, value: string) => void;
}) {
  const active = COST_FIELDS.find((f) => f.key === field)!;
  const [bulk, setBulk] = React.useState("");

  const blank = rows.filter((r) => isBlank(r[field])).length;
  const index = COST_FIELDS.findIndex((f) => f.key === field);
  const prev = COST_FIELDS[index - 1];
  const next = COST_FIELDS[index + 1];

  return (
    <div className="space-y-3">
      {/* เลือกช่องด้วยดรอปดาวน์ ไม่ใช่แถบปุ่ม เพราะ 17 ช่องยาวเกินกว่าจะเรียงให้กดถูก */}
      <div className="flex flex-wrap items-center gap-2">
        <Select value={field} onValueChange={(v) => onFieldChange(v as FieldKey)}>
          <SelectTrigger className="min-w-56 flex-1 bg-card">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {GROUP_ORDER.map((g) => (
              <SelectGroup key={g}>
                <SelectLabel>{FIELD_GROUP_LABEL[g]}</SelectLabel>
                {fieldsByGroup(g).map((f) => {
                  const left = rows.filter((r) => isBlank(r[f.key])).length;
                  return (
                    <SelectItem key={f.key} value={f.key}>
                      {f.label}
                      {left > 0 && ` · ว่าง ${left}`}
                    </SelectItem>
                  );
                })}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant="ghost"
          size="icon"
          aria-label="ช่องก่อนหน้า"
          disabled={!prev}
          onClick={() => prev && onFieldChange(prev.key)}
        >
          <ChevronLeftIcon />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="ช่องถัดไป"
          disabled={!next}
          onClick={() => next && onFieldChange(next.key)}
        >
          <ChevronRightIcon />
        </Button>
      </div>

      {/* เติมทั้งคอลัมน์ — ทางลัดของงานที่ค่าเหมือนกันเกือบทุกสูตร
          ไม่ได้ตัดช่องกรอกรายสูตรทิ้ง ยังแก้รายตัวทับได้ตามปกติ */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-3">
        <ArrowDownToLineIcon className="size-4 shrink-0 text-muted-foreground" />
        <span className="text-sm">เติม {active.label} ทุกสูตรพร้อมกัน</span>
        <div className="ml-auto flex items-center gap-2">
          <InputGroup className="w-40 bg-card">
            <InputGroupInput
              aria-label={`ค่าที่จะเติมให้ ${active.label} ทุกสูตร`}
              inputMode="decimal"
              placeholder="0"
              value={bulk}
              onChange={(e) => setBulk(e.target.value)}
              className="text-right tabular-nums"
            />
            <InputGroupAddon align="inline-end">{active.suffix}</InputGroupAddon>
          </InputGroup>
          <Button
            variant="outline-primary"
            disabled={bulk.trim() === ""}
            onClick={() => {
              onFillDown(field, bulk);
              setBulk("");
            }}
          >
            เติม {rows.length} สูตร
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          ช่องที่ {index + 1} จาก {COST_FIELDS.length} · หน่วย {active.suffix}
        </p>
        <Badge tone={blank > 0 ? "warning" : "success"} appearance="soft">
          {blank > 0 ? `ยังว่าง ${blank} สูตร` : "กรอกครบแล้ว"}
        </Badge>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {rows.map((row, i) => {
          const prevGroup = i > 0 ? rows[i - 1].group : null;
          const empty = isBlank(row[field]);
          return (
            <React.Fragment key={row.id}>
              {row.group !== prevGroup && (
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
                {/* ชื่อสูตรอยู่บรรทัดเดียวกับช่องกรอก
                    คีย์แพดเด้งขึ้นมาแล้วยังเห็นว่ากรอกของสูตรไหนและราคาเป็นเท่าไร */}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium" title={row.sku}>
                    {row.sku}
                  </p>
                  <p className="text-sm text-muted-foreground tabular-nums">
                    ราคาขาย {formatBaht(computeCost(row).price)} บาท
                  </p>
                </div>
                <Input
                  aria-label={`${active.label} ของ ${row.sku}`}
                  inputMode="decimal"
                  placeholder="0"
                  value={row[field]}
                  onChange={(e) => onPatch(row.id, field, e.target.value)}
                  className={cn(
                    "w-28 shrink-0 text-right tabular-nums",
                    empty && "border-chip-yellow-foreground/50"
                  )}
                />
              </div>
            </React.Fragment>
          );
        })}
      </div>

      {next && (
        <Button
          variant="outline-primary"
          className="w-full"
          onClick={() => onFieldChange(next.key)}
        >
          ถัดไป: {next.label}
          <ChevronRightIcon />
        </Button>
      )}
    </div>
  );
}
