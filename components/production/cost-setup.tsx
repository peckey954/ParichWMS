"use client";

import * as React from "react";
import { ChevronRightIcon, ListIcon, SearchIcon, TableIcon } from "lucide-react";
import { Badge } from "@peckey954/ui/components/ui/badge";
import { Button } from "@peckey954/ui/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@peckey954/ui/components/ui/input-group";
import { Progress } from "@peckey954/ui/components/ui/progress";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@peckey954/ui/components/ui/toggle-group";
import { cn } from "@peckey954/ui/lib/utils";
import { toast } from "sonner";
import { RECIPE_GROUP_LABEL } from "@/lib/recipe";
import {
  COST_FIELDS,
  COST_ROWS,
  blanksByField,
  computeCost,
  filledCells,
  formatBaht,
  matchesCost,
  rowBlanks,
  totalCells,
  type CostRow,
  type FieldKey,
} from "@/lib/recipe-cost";
import { CostByField } from "./cost-by-field";
import { CostRowSheet } from "./cost-row-sheet";
import { CostTable } from "./cost-table";

/* ------------------------------------------------------------------
   แท็บตั้งค่าต้นทุน

   ทุกช่องที่หัวเป็นสีส้มในไฟล์ต้นทางคือช่องกรอกรายสูตร รวม 17 ช่อง
   คูณจำนวนสูตรแล้วเป็นหลักห้าร้อยช่อง ซึ่งเยอะจริงและตัดออกไม่ได้

   จึงไม่แก้ด้วยการลดจำนวนช่อง แต่แก้ด้วยสามอย่าง
     1. ไล่ตามคอลัมน์ ไม่ใช่ตามแถว — ตรงกับงานจริงที่แก้ค่าเดียวข้ามหลายสูตร
     2. เติมทั้งคอลัมน์รวดเดียว แล้วค่อยไล่แก้เฉพาะสูตรที่ต่าง
     3. บอกความคืบหน้าตลอด ว่ากรอกไปกี่ช่องแล้ว และเหลือคอลัมน์ไหน

   ตั้งใจไม่ทำ — ยกตาราง 21 คอลัมน์ลงมือถือแล้วให้เลื่อนแนวนอน
------------------------------------------------------------------ */

type Mode = "field" | "table";

export function CostSetup() {
  const [rows, setRows] = React.useState<CostRow[]>(COST_ROWS);
  const [query, setQuery] = React.useState("");
  const [mode, setMode] = React.useState<Mode>("field");
  const [field, setField] = React.useState<FieldKey>("rawMaterial");
  const [openId, setOpenId] = React.useState<string | null>(null);

  const patch = (id: string, key: FieldKey, value: string) =>
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [key]: value } : r))
    );

  /** เติมค่าเดียวกันให้ทุกสูตรที่กำลังแสดงอยู่ ไม่ใช่ทุกสูตรในระบบ
      ถ้ากรองอยู่แล้วเติมทั้งหมด จะไปทับสูตรที่มองไม่เห็นโดยไม่รู้ตัว */
  const fillDown = (key: FieldKey, value: string) => {
    const ids = new Set(visible.map((r) => r.id));
    setRows((prev) =>
      prev.map((r) => (ids.has(r.id) ? { ...r, [key]: value } : r))
    );
    const label = COST_FIELDS.find((f) => f.key === key)!.label;
    toast.success(`เติม ${label} แล้ว`, {
      description: `${ids.size} สูตร · แก้รายตัวทับได้ตามปกติ`,
    });
  };

  const visible = rows.filter((r) => matchesCost(r, query));
  const open = rows.find((r) => r.id === openId) ?? null;

  const done = filledCells(rows);
  const all = totalCells(rows);
  const pending = blanksByField(rows);

  const priceRange = React.useMemo(() => {
    const prices = rows.map((r) => computeCost(r).price);
    return { min: Math.min(...prices), max: Math.max(...prices) };
  }, [rows]);

  const save = () =>
    toast.success("บันทึกค่าต้นทุนแล้ว", {
      description: `${rows.length} สูตร · กรอกครบ ${done} จาก ${all} ช่อง`,
    });

  return (
    <div className="space-y-4">
      {/* ---------- ความคืบหน้า ----------
          561 ช่องไม่มีทางกรอกจบในรอบเดียว ต้องบอกได้ว่าค้างตรงไหน
          ไม่งั้นคนจะไม่กล้าปิดหน้าไปทำอย่างอื่น */}
      <section className="rounded-xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <p className="font-semibold">
            ความคืบหน้า
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              {rows.length} สูตร × {COST_FIELDS.length} ช่อง
            </span>
          </p>
          <p className="text-sm tabular-nums">
            <span className="text-lg font-semibold">{done}</span>
            <span className="text-muted-foreground"> / {all} ช่อง</span>
          </p>
        </div>

        <Progress value={(done / all) * 100} className="mt-3" />

        {pending.length > 0 ? (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">ยังว่าง:</span>
            {pending.map((f) => (
              // กดแล้วกระโดดไปกรอกคอลัมน์นั้นเลย ไม่ต้องไล่หาเอง
              <Button
                key={f.key}
                variant="outline"
                size="sm"
                onClick={() => {
                  setField(f.key);
                  setMode("field");
                }}
              >
                {f.label}
                <Badge tone="warning" appearance="soft">
                  {f.blank}
                </Badge>
              </Button>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">
            กรอกครบทุกช่องแล้ว · ราคาขาย {formatBaht(priceRange.min)}–
            {formatBaht(priceRange.max)} บาท
          </p>
        )}
      </section>

      {/* ---------- แถบเครื่องมือ ---------- */}
      <section className="rounded-xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="min-w-52 flex-1">
            <InputGroup className="bg-card">
              <InputGroupAddon align="inline-start">
                <SearchIcon />
              </InputGroupAddon>
              <InputGroupInput
                placeholder="ค้นหาสูตร..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </InputGroup>
          </div>

          {/* ตารางเต็มเลือกได้เฉพาะจอกว้าง จอแคบใช้ทีละช่องอย่างเดียว */}
          <ToggleGroup
            type="single"
            value={mode}
            onValueChange={(v) => v && setMode(v as Mode)}
            variant="outline"
            className="hidden @3xl:flex"
          >
            <ToggleGroupItem value="field" className="px-3">
              <ListIcon />
              ทีละช่อง
            </ToggleGroupItem>
            <ToggleGroupItem value="table" className="px-3">
              <TableIcon />
              ตารางเต็ม
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        {query.trim() !== "" && (
          <p className="mt-2 text-sm text-muted-foreground">
            กรองอยู่ {visible.length} จาก {rows.length} สูตร ·
            ปุ่มเติมทั้งคอลัมน์จะเติมเฉพาะที่แสดงอยู่
          </p>
        )}
      </section>

      {visible.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-14 text-center">
          <p className="font-medium">ไม่พบสูตรที่ค้นหา</p>
          <p className="mt-1 text-sm text-muted-foreground">ลองใช้คำค้นสั้นลง</p>
        </div>
      ) : (
        <>
          <div className="@3xl:hidden">
            <CostByField
              rows={visible}
              field={field}
              onFieldChange={setField}
              onPatch={patch}
              onFillDown={fillDown}
            />
            <RowList rows={visible} onOpen={(r) => setOpenId(r.id)} />
          </div>

          <div className="hidden @3xl:block">
            {mode === "table" ? (
              <CostTable
                rows={visible}
                onPatch={patch}
                onOpenRow={(r) => setOpenId(r.id)}
              />
            ) : (
              <>
                <CostByField
                  rows={visible}
                  field={field}
                  onFieldChange={setField}
                  onPatch={patch}
                  onFillDown={fillDown}
                />
                <RowList rows={visible} onOpen={(r) => setOpenId(r.id)} />
              </>
            )}
          </div>
        </>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4">
        <p className="min-w-0 text-sm text-muted-foreground">
          แก้แล้วราคาขายขยับทันที กดบันทึกเพื่อส่งค่าไปให้ฝ่ายผลิตและบัญชี
        </p>
        <Button size="lg" onClick={save}>
          บันทึก
        </Button>
      </div>

      <CostRowSheet
        row={open}
        open={openId !== null}
        onOpenChange={(v) => !v && setOpenId(null)}
        onPatch={patch}
      />
    </div>
  );
}

/** รายการสูตร กดเข้าไปกรอกครบทั้ง 17 ช่องของสูตรนั้นในจอเดียว */
function RowList({
  rows,
  onOpen,
}: {
  rows: CostRow[];
  onOpen: (row: CostRow) => void;
}) {
  return (
    <div className="mt-4">
      <p className="mb-2 text-sm text-muted-foreground">
        หรือเปิดทีละสูตรเพื่อกรอกให้ครบทุกช่องของสูตรนั้นรวดเดียว
      </p>
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {rows.map((row, i) => {
          const r = computeCost(row);
          const blanks = rowBlanks(row);
          return (
            <button
              key={row.id}
              type="button"
              onClick={() => onOpen(row)}
              className={cn(
                "flex w-full items-center gap-3 px-4 py-3 text-left",
                "transition-colors hover:bg-accent",
                "focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
                i < rows.length - 1 && "border-b border-border"
              )}
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{row.sku}</span>
                <span className="block text-sm text-muted-foreground">
                  {RECIPE_GROUP_LABEL[row.group]} · {row.size} กก.
                </span>
              </span>
              {blanks > 0 && (
                <Badge tone="warning" appearance="soft" className="shrink-0">
                  ว่าง {blanks}
                </Badge>
              )}
              <span className="shrink-0 text-right">
                <span className="block font-semibold text-primary tabular-nums">
                  {formatBaht(r.price)}
                </span>
                <span className="block text-sm text-muted-foreground">
                  ราคาขาย
                </span>
              </span>
              <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
