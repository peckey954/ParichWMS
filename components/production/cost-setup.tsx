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
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@peckey954/ui/components/ui/toggle-group";
import { cn } from "@peckey954/ui/lib/utils";
import { toast } from "sonner";
import { RECIPE_GROUP_LABEL } from "@/lib/recipe";
import {
  COST_DEFAULTS,
  COST_ROWS,
  computeCost,
  formatBaht,
  matchesCost,
  overrideCount,
  type CostDefaults,
  type CostRow,
  type RowFieldKey,
} from "@/lib/recipe-cost";
import { CostByField } from "./cost-by-field";
import { CostDefaultsCard } from "./cost-defaults";
import { CostRowSheet } from "./cost-row-sheet";
import { CostTable } from "./cost-table";

/* ------------------------------------------------------------------
   แท็บตั้งค่าต้นทุน

   ไฟล์ Excel ต้นทางมี 25 คอลัมน์ ซึ่งกรอกบนมือถือไม่ได้เลย
   แต่พอไล่ค่าจริงแล้ว 12 จาก 15 คอลัมน์ที่กรอกได้เป็นค่าเดียวกันทุกแถว
   งานกรอกจริงจึงเหลือ 3 ช่องต่อสูตร ไม่ใช่ 15

   หน้าเลยแบ่งเป็นสามชั้นตามความถี่ที่แก้
     1. ค่าตั้งต้น    — แก้ครั้งเดียวใช้ทั้งตาราง
     2. แก้ทีละช่อง   — "Nitro ขึ้นราคา ไล่แก้ทุกสูตร" คือค่าเริ่มต้นบนจอแคบ
     3. แก้ทีละสูตร   — เปิดเต็มจอ ใช้ตอนสูตรนั้นต้องต่างจากคนอื่น

   ตั้งใจไม่ทำ — ยกตาราง 25 คอลัมน์ลงมือถือแล้วให้เลื่อนแนวนอน
   ล็อกชื่อสูตรกับราคาขายไว้สองข้างแล้วเหลือพื้นที่กลางไม่ถึงร้อยพิกเซล
------------------------------------------------------------------ */

type Mode = "field" | "table";

export function CostSetup() {
  const [defaults, setDefaults] = React.useState<CostDefaults>(COST_DEFAULTS);
  const [rows, setRows] = React.useState<CostRow[]>(COST_ROWS);
  const [query, setQuery] = React.useState("");
  const [mode, setMode] = React.useState<Mode>("field");
  const [openId, setOpenId] = React.useState<string | null>(null);

  const patch = (id: string, key: RowFieldKey, value: string) =>
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [key]: value } : r))
    );

  const setOverride = (id: string, key: string, value: string) =>
    setRows((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, override: { ...r.override, [key]: value } } : r
      )
    );

  const visible = rows.filter((r) => matchesCost(r, query));
  const overridden = rows.filter((r) => overrideCount(r.override) > 0).length;
  const open = rows.find((r) => r.id === openId) ?? null;

  const priceRange = React.useMemo(() => {
    const prices = rows.map((r) => computeCost(r, defaults).price);
    return { min: Math.min(...prices), max: Math.max(...prices) };
  }, [rows, defaults]);

  const save = () =>
    toast.success("บันทึกค่าต้นทุนแล้ว", {
      description: `${rows.length} สูตร · ราคาขาย ${formatBaht(priceRange.min)}–${formatBaht(priceRange.max)} บาท`,
    });

  return (
    <div className="space-y-4">
      <CostDefaultsCard
        value={defaults}
        onChange={setDefaults}
        overriddenRows={overridden}
      />

      {/* ---------- แถบเครื่องมือของรายสูตร ---------- */}
      <section className="rounded-xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <h3 className="font-semibold">
            ค่าเฉพาะสูตร
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              {rows.length} สูตร · กรอกแค่ 3 ช่องต่อสูตร
            </span>
          </h3>
          <Badge tone="neutral" appearance="soft">
            ราคาขาย {formatBaht(priceRange.min)}–{formatBaht(priceRange.max)} บาท
          </Badge>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
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

          {/* ตารางเลือกได้เฉพาะจอกว้าง จอแคบใช้ทีละช่องอย่างเดียว */}
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
              ตาราง
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </section>

      {visible.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-14 text-center">
          <p className="font-medium">ไม่พบสูตรที่ค้นหา</p>
          <p className="mt-1 text-sm text-muted-foreground">ลองใช้คำค้นสั้นลง</p>
        </div>
      ) : (
        <>
          {/* จอแคบ: ทีละช่อง + รายการสูตรให้กดเข้าไปแก้ทีละตัว */}
          <div className="@3xl:hidden">
            <CostByField rows={visible} defaults={defaults} onPatch={patch} />
            <RowList
              rows={visible}
              defaults={defaults}
              onOpen={(r) => setOpenId(r.id)}
            />
          </div>

          {/* จอกว้าง: สลับได้ระหว่างทีละช่องกับตารางเต็ม */}
          <div className="hidden @3xl:block">
            {mode === "table" ? (
              <CostTable
                rows={visible}
                defaults={defaults}
                onPatch={patch}
                onOpenRow={(r) => setOpenId(r.id)}
              />
            ) : (
              <CostByField rows={visible} defaults={defaults} onPatch={patch} />
            )}
          </div>
        </>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4">
        <p className="min-w-0 text-sm text-muted-foreground">
          แก้แล้วมีผลกับราคาขายทันที กดบันทึกเพื่อส่งค่าไปให้ฝ่ายผลิตและบัญชี
        </p>
        <Button size="lg" onClick={save}>
          บันทึก
        </Button>
      </div>

      <CostRowSheet
        row={open}
        defaults={defaults}
        open={openId !== null}
        onOpenChange={(v) => !v && setOpenId(null)}
        onPatch={patch}
        onOverride={setOverride}
      />
    </div>
  );
}

/** รายการสูตรบนจอแคบ กดเข้าไปแก้ทั้งสูตรพร้อมปรับค่าตั้งต้นทับได้ */
function RowList({
  rows,
  defaults,
  onOpen,
}: {
  rows: CostRow[];
  defaults: CostDefaults;
  onOpen: (row: CostRow) => void;
}) {
  return (
    <div className="mt-4">
      <p className="mb-2 text-sm text-muted-foreground">
        หรือเปิดทีละสูตรเพื่อแก้ครบทุกช่องพร้อมปรับค่าตั้งต้นเฉพาะสูตรนั้น
      </p>
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {rows.map((row, i) => {
          const r = computeCost(row, defaults);
          const overrides = overrideCount(row.override);
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
              {overrides > 0 && (
                <Badge tone="warning" appearance="soft" className="shrink-0">
                  ทับ {overrides}
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
