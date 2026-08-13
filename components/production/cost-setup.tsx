"use client";

import * as React from "react";
import { ArrowDownToLineIcon, ChevronRightIcon, SearchIcon } from "lucide-react";
import { Badge } from "@peckey954/ui/components/ui/badge";
import { Button } from "@peckey954/ui/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@peckey954/ui/components/ui/input-group";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@peckey954/ui/components/ui/popover";
import { Progress } from "@peckey954/ui/components/ui/progress";
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
import { toast } from "sonner";
import { RECIPE_GROUP_LABEL } from "@/lib/recipe";
import {
  COST_FIELDS,
  COST_ROWS,
  FIELD_GROUP_LABEL,
  blanksByField,
  computeCost,
  fieldsByGroup,
  filledCells,
  formatBaht,
  matchesCost,
  rowBlanks,
  totalCells,
  type CostRow,
  type FieldGroup,
  type FieldKey,
} from "@/lib/recipe-cost";
import { CostRowDrawer } from "./cost-row-drawer";
import { CostTable } from "./cost-table";

/* ------------------------------------------------------------------
   แท็บตั้งค่าต้นทุน

   ทุกช่องที่หัวเป็นสีส้มในไฟล์ต้นทางคือช่องกรอกรายสูตร รวม 17 ช่อง
   คูณจำนวนสูตรแล้วเป็นหลักห้าร้อยช่อง

   จอกว้าง — ตารางเต็ม หน้าตาตรงกับไฟล์ Excel ที่สุด
   จอแคบ  — รายการสูตร กดแล้วดึง drawer ขึ้นมากรอกครบ 17 ช่องในนั้น
------------------------------------------------------------------ */

const GROUP_ORDER: FieldGroup[] = ["cost", "rate", "budget", "price"];

export function CostSetup() {
  const [rows, setRows] = React.useState<CostRow[]>(COST_ROWS);
  const [query, setQuery] = React.useState("");
  const [openId, setOpenId] = React.useState<string | null>(null);

  const patch = (id: string, key: FieldKey, value: string) =>
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [key]: value } : r))
    );

  const visible = rows.filter((r) => matchesCost(r, query));

  /** เติมค่าเดียวกันให้ทุกสูตรที่กำลังแสดงอยู่ ไม่ใช่ทุกสูตรในระบบ
      ถ้ากรองอยู่แล้วเติมทั้งหมด จะไปทับสูตรที่มองไม่เห็นโดยไม่รู้ตัว */
  const fillDown = (key: FieldKey, value: string) => {
    const ids = new Set(visible.map((r) => r.id));
    setRows((prev) =>
      prev.map((r) => (ids.has(r.id) ? { ...r, [key]: value } : r))
    );
    toast.success(`เติม ${COST_FIELDS.find((f) => f.key === key)!.label} แล้ว`, {
      description: `${ids.size} สูตร · แก้รายตัวทับได้ตามปกติ`,
    });
  };

  const openIndex = visible.findIndex((r) => r.id === openId);
  const open = openIndex >= 0 ? visible[openIndex] : null;

  const step = (delta: number) => {
    const next = visible[openIndex + delta];
    if (next) setOpenId(next.id);
  };

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
          <p className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            ยังว่าง:
            {pending.map((f) => (
              <Badge key={f.key} tone="warning" appearance="soft">
                {f.label} {f.blank}
              </Badge>
            ))}
          </p>
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
          <FillDown count={visible.length} onFill={fillDown} />
        </div>

        {query.trim() !== "" && (
          <p className="mt-2 text-sm text-muted-foreground">
            กรองอยู่ {visible.length} จาก {rows.length} สูตร ·
            เติมทั้งคอลัมน์จะเติมเฉพาะที่แสดงอยู่
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
          {/* จอแคบ: รายการสูตร กดแล้วเปิด drawer */}
          <div className="@3xl:hidden">
            <RowList rows={visible} onOpen={(r) => setOpenId(r.id)} />
          </div>

          {/* จอกว้าง: ตารางเต็ม */}
          <div className="hidden @3xl:block">
            <CostTable
              rows={visible}
              onPatch={patch}
              onOpenRow={(r) => setOpenId(r.id)}
            />
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

      <CostRowDrawer
        row={open}
        open={openId !== null}
        onOpenChange={(v) => !v && setOpenId(null)}
        onPatch={patch}
        onStep={step}
      />
    </div>
  );
}

/**
 * เติมค่าเดียวกันทั้งคอลัมน์
 *
 * 561 ช่องที่ค่าซ้ำกันเกือบหมด ถ้าไม่มีทางลัดนี้ต้องพิมพ์เลขเดิม 33 ครั้งต่อคอลัมน์
 * ไม่ได้แทนช่องกรอกรายสูตร แก้รายตัวทับได้ตามปกติ
 */
function FillDown({
  count,
  onFill,
}: {
  count: number;
  onFill: (key: FieldKey, value: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [field, setField] = React.useState<FieldKey>("handling");
  const [value, setValue] = React.useState("");

  const active = COST_FIELDS.find((f) => f.key === field)!;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="bg-card">
          <ArrowDownToLineIcon />
          เติมทั้งคอลัมน์
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 space-y-3">
        <div>
          <p className="font-medium">เติมค่าเดียวกันทุกสูตร</p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            ใส่ครั้งเดียวได้ทั้ง {count} สูตร แล้วค่อยแก้เฉพาะตัวที่ต่าง
          </p>
        </div>

        <Select value={field} onValueChange={(v) => setField(v as FieldKey)}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {GROUP_ORDER.map((g) => (
              <SelectGroup key={g}>
                <SelectLabel>{FIELD_GROUP_LABEL[g]}</SelectLabel>
                {fieldsByGroup(g).map((f) => (
                  <SelectItem key={f.key} value={f.key}>
                    {f.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>

        <InputGroup className="bg-card">
          <InputGroupInput
            aria-label={`ค่าที่จะเติมให้ ${active.label}`}
            inputMode="decimal"
            placeholder="0"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="text-right tabular-nums"
          />
          <InputGroupAddon align="inline-end">{active.suffix}</InputGroupAddon>
        </InputGroup>

        <Button
          className="w-full"
          disabled={value.trim() === ""}
          onClick={() => {
            onFill(field, value);
            setValue("");
            setOpen(false);
          }}
        >
          เติม {count} สูตร
        </Button>
      </PopoverContent>
    </Popover>
  );
}

/** รายการสูตรบนจอแคบ กดแล้วเปิด drawer กรอกครบทุกช่องของสูตรนั้น */
function RowList({
  rows,
  onOpen,
}: {
  rows: CostRow[];
  onOpen: (row: CostRow) => void;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      {rows.map((row, i) => {
        const r = computeCost(row);
        const blanks = rowBlanks(row);
        const prev = i > 0 ? rows[i - 1].group : null;

        return (
          <React.Fragment key={row.id}>
            {row.group !== prev && (
              <p className="bg-surface px-4 py-2 text-sm font-medium text-muted-foreground">
                {RECIPE_GROUP_LABEL[row.group]}
              </p>
            )}
            <button
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
                  {row.size} กก. · ต้นทุนรวม {formatBaht(r.total)}
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
          </React.Fragment>
        );
      })}
    </div>
  );
}
