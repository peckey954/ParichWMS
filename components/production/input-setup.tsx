"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDownIcon,
  FlaskConicalIcon,
  PlayIcon,
  PlusIcon,
  TrashIcon,
  TriangleAlertIcon,
  WalletIcon,
} from "lucide-react";
import { Badge } from "@peckey954/ui/components/ui/badge";
import { Button } from "@peckey954/ui/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@peckey954/ui/components/ui/collapsible";
import { Input } from "@peckey954/ui/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@peckey954/ui/components/ui/input-group";
import { Label } from "@peckey954/ui/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@peckey954/ui/components/ui/table";
import { cn } from "@peckey954/ui/lib/utils";
import { toast } from "sonner";
import {
  COL_FIRST,
  HEAD_FIRST,
  STICKY_HEAD,
  TableFrame,
} from "@/components/stock/doc-parts";
import {
  NUTRIENTS,
  RAW_MATERIALS,
  type NutrientKey,
  type RawMaterialDraft,
  emptyMaterial,
  formatBaht,
  invalidMaterials,
  isCoating,
  toNumber,
} from "@/lib/recipe-input";

/* ------------------------------------------------------------------
   แท็บ Input — ข้อมูลตั้งต้นของการคำนวณสูตร

   แยกเป็นสองส่วนตามจังหวะการใช้งาน ไม่ใช่ตามหน้าตาของไฟล์ Excel
   ต้นทุนอยู่บนสุดและกางไว้ เพราะเป็นงานที่ทำบ่อยที่สุด
   ธาตุอาหารหุบไว้ เพราะตั้งครั้งเดียวใช้ยาว เปิดเมื่อจะเพิ่ม/แก้วัตถุดิบ

   คอลัมน์ "ราคา" ในไฟล์เดิมตัดออกแล้ว เพราะซ้ำกับต้นทุน
------------------------------------------------------------------ */

export function InputSetup() {
  const router = useRouter();
  const [rows, setRows] = React.useState<RawMaterialDraft[]>(RAW_MATERIALS);
  const [lastRun, setLastRun] = React.useState<string | null>(null);
  const seq = React.useRef(0);

  const patch = (id: string, next: Partial<RawMaterialDraft>) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...next } : r)));

  const setNutrient = (id: string, key: NutrientKey, v: string) =>
    setRows((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, nutrients: { ...r.nutrients, [key]: v } } : r
      )
    );

  const addRow = () => {
    seq.current += 1;
    setRows((prev) => [...prev, emptyMaterial(`new-${seq.current}`)]);
  };

  const removeRow = (id: string) =>
    setRows((prev) => prev.filter((r) => r.id !== id));

  const invalid = invalidMaterials(rows);
  const totalCost = rows.reduce((sum, r) => sum + toNumber(r.cost), 0);

  const run = () => {
    const d = new Date();
    const p = (n: number) => String(n).padStart(2, "0");
    setLastRun(
      `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()} | ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
    );
    toast.success("คำนวณสูตรเสร็จแล้ว", {
      description: `ใช้วัตถุดิบ ${rows.length} รายการ`,
    });
    // พาไปดูผลทันที ไม่ต้องให้ไปหาเองว่าผลอยู่ตรงไหน
    router.push("/production/recipe/optimized");
  };

  return (
    <div className="space-y-4">
      {/* ---------- ต้นทุน — งานที่ทำบ่อย อยู่บนสุดและกางไว้เสมอ ---------- */}
      <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
        <SectionHead
          icon={WalletIcon}
          title="ต้นทุนวัตถุดิบ"
          note="ราคาต่อตัน — ส่วนนี้แก้บ่อย จึงกางไว้ตลอด"
        >
          <Badge tone="neutral" appearance="soft">
            {rows.length} รายการ
          </Badge>
        </SectionHead>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((r) => (
            <div key={r.id} className="space-y-1.5">
              <Label
                htmlFor={`cost-${r.id}`}
                className="flex items-center gap-2 text-sm"
              >
                <span className="truncate">{r.name || "วัตถุดิบใหม่"}</span>
                {isCoating(r) && r.name.trim() !== "" && (
                  <Badge tone="neutral" appearance="soft" className="shrink-0">
                    สารเคลือบ
                  </Badge>
                )}
              </Label>
              <InputGroup className="bg-card">
                <InputGroupInput
                  id={`cost-${r.id}`}
                  inputMode="decimal"
                  placeholder="0"
                  value={r.cost}
                  onChange={(e) => patch(r.id, { cost: e.target.value })}
                  className="text-right tabular-nums"
                />
                <InputGroupAddon align="inline-end">บาท/ตัน</InputGroupAddon>
              </InputGroup>
            </div>
          ))}
        </div>

        <p className="mt-4 text-sm text-muted-foreground">
          รวมต้นทุนที่กรอกไว้{" "}
          <span className="font-semibold text-foreground tabular-nums">
            {formatBaht(totalCost)}
          </span>{" "}
          บาท · เพิ่มหรือลบวัตถุดิบได้ที่หัวข้อค่าธาตุอาหารด้านล่าง
        </p>
      </section>

      {/* ---------- ธาตุอาหาร — ตั้งครั้งเดียวใช้ยาว หุบไว้ก่อน ---------- */}
      <Collapsible className="rounded-xl border border-border bg-card">
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="group flex w-full items-center gap-3 p-4 text-left sm:p-5"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand text-primary">
              <FlaskConicalIcon className="size-5" strokeWidth={1.5} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">ค่าธาตุอาหาร</span>
              <span className="block text-sm text-muted-foreground">
                เปอร์เซ็นต์ธาตุอาหารของวัตถุดิบแต่ละตัว — ตั้งครั้งเดียวใช้ยาว
              </span>
            </span>
            <ChevronDownIcon className="size-5 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent className="px-4 pb-4 sm:px-5 sm:pb-5">
          {/* จอแคบเลื่อนตารางแนวนอนเอา ไม่ยุบเป็นการ์ด
              เพราะการกรอกตัวเลขเทียบกันข้ามแถวต้องเห็นเป็นตาราง */}
          <p className="mb-3 text-sm text-muted-foreground @3xl:hidden">
            เลื่อนตารางแนวนอนเพื่อดูธาตุอาหารครบทุกช่อง
          </p>

          <TableFrame>
            <Table>
              <TableHeader className={STICKY_HEAD}>
                <TableRow>
                  <TableHead className={cn(HEAD_FIRST, "min-w-44")}>
                    วัตถุดิบ
                  </TableHead>
                  {NUTRIENTS.map((n) => (
                    <TableHead key={n.key} className="text-right">
                      {n.label} (%)
                    </TableHead>
                  ))}
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className={COL_FIRST}>
                      <Input
                        aria-label="ชื่อวัตถุดิบ"
                        placeholder="ชื่อวัตถุดิบ"
                        value={r.name}
                        onChange={(e) => patch(r.id, { name: e.target.value })}
                      />
                    </TableCell>
                    {NUTRIENTS.map((n) => (
                      <TableCell key={n.key}>
                        <Input
                          aria-label={`${r.name || "วัตถุดิบใหม่"} ${n.label}`}
                          inputMode="decimal"
                          placeholder="0"
                          value={r.nutrients[n.key]}
                          onChange={(e) =>
                            setNutrient(r.id, n.key, e.target.value)
                          }
                          className="w-20 text-right tabular-nums"
                        />
                      </TableCell>
                    ))}
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`ลบ ${r.name || "วัตถุดิบใหม่"}`}
                        onClick={() => removeRow(r.id)}
                      >
                        <TrashIcon />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableFrame>

          <Button variant="outline-primary" className="mt-3" onClick={addRow}>
            <PlusIcon />
            เพิ่มวัตถุดิบ
          </Button>
        </CollapsibleContent>
      </Collapsible>

      {/* ---------- สั่งคำนวณ ---------- */}
      <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
        {invalid.length > 0 && (
          <p className="mb-3 flex items-start gap-2 text-sm text-danger-strong">
            <TriangleAlertIcon className="mt-0.5 size-4 shrink-0" />
            มี {invalid.length} รายการที่ยังไม่มีชื่อหรือยังไม่ได้ใส่ต้นทุน
            คำนวณไปก็ได้ผลไม่ครบ
          </p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="font-medium">คำนวณสูตรใหม่</p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {lastRun
                ? `คำนวณล่าสุด ${lastRun}`
                : "คำนวณเสร็จแล้วจะพาไปดูผลทันที และแทนที่ผลชุดเดิมทั้งหมด"}
            </p>
          </div>
          <Button size="lg" onClick={run} disabled={rows.length === 0}>
            <PlayIcon />
            RUN
          </Button>
        </div>
      </section>
    </div>
  );
}

function SectionHead({
  icon: Icon,
  title,
  note,
  children,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  note: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand text-primary">
        <Icon className="size-5" strokeWidth={1.5} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{title}</p>
        <p className="mt-0.5 text-sm text-muted-foreground">{note}</p>
      </div>
      {children}
    </div>
  );
}
