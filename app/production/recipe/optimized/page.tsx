"use client";

import * as React from "react";
import Link from "next/link";
import { DownloadIcon, SearchIcon, TriangleAlertIcon } from "lucide-react";
import { Badge } from "@peckey954/ui/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@peckey954/ui/components/ui/breadcrumb";
import { Button } from "@peckey954/ui/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@peckey954/ui/components/ui/input-group";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@peckey954/ui/components/ui/table";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@peckey954/ui/components/ui/toggle-group";
import { cn } from "@peckey954/ui/lib/utils";
import {
  COL_FIRST,
  EmptyDocs,
  HEAD_FIRST,
  STICKY_HEAD,
  TableFrame,
  TablePager,
  paginate,
} from "@/components/stock/doc-parts";
import { RECIPE_GROUP_LABEL } from "@/lib/recipe";
import {
  ERROR_TOLERANCE,
  MATERIALS,
  NUTRIENTS,
  computeOptimized,
  failedRows,
  matchesOptimized,
  type OptimizedRow,
} from "@/lib/recipe-optimized";

/* ------------------------------------------------------------------
   ผลลัพธ์หลังกด RUN — ดูได้อย่างเดียว

   24 คอลัมน์ในหน้าเดียวคือเลื่อนซ้ายขวาตลอดเวลา
   แต่จริง ๆ มันคือ "สามมุมมองของเรื่องเดียวกัน" ไม่ใช่ 24 เรื่อง
     น้ำหนัก  → ใช้ตอนสั่งวัตถุดิบ
     สัดส่วน  → ใช้ตอนตรวจสูตร
     ธาตุอาหาร → ใช้ตอนเช็กว่าตรงเป้าไหม
   จึงให้เลือกดูทีละมุม โดยตรึงกลุ่ม/สูตร/ขนาด/ต้นทุน ไว้เสมอ
   ใครอยากเห็นครบก็เลือก "ทั้งหมด" ได้
------------------------------------------------------------------ */

type View = "weight" | "percent" | "nutrition" | "all";

const VIEWS: { id: View; label: string }[] = [
  { id: "weight", label: "น้ำหนักวัตถุดิบ" },
  { id: "percent", label: "สัดส่วนวัตถุดิบ" },
  { id: "nutrition", label: "ธาตุอาหารที่ได้" },
  { id: "all", label: "ทั้งหมด" },
];

const PAGE_SIZE = 12;

const num = (v: number, d = 2) =>
  v.toLocaleString("th-TH", { minimumFractionDigits: d, maximumFractionDigits: d });

export default function OptimizedFormulaPage() {
  const [view, setView] = React.useState<View>("weight");
  const [query, setQuery] = React.useState("");
  const [page, setPage] = React.useState(1);

  const all = React.useMemo(() => computeOptimized(), []);
  const rows = all.filter((r) => matchesOptimized(r, query));
  const { pages, safe, slice } = paginate(rows, page, PAGE_SIZE);

  const failed = failedRows(all);
  const avgCost =
    all.length > 0 ? all.reduce((s, r) => s + r.totalCost, 0) / all.length : 0;

  const showWeight = view === "weight" || view === "all";
  const showPercent = view === "percent" || view === "all";
  const showNutrition = view === "nutrition" || view === "all";

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-3 sm:px-6 sm:py-5">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">ระบบ</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/production/recipe">
              สูตรผลิตประจำสัปดาห์
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="text-primary">
              ผลการคำนวณ
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mt-2 flex flex-wrap items-start justify-between gap-3 sm:mt-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">
            ผลการคำนวณสูตร
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            คำนวณจากต้นทุนและค่าธาตุอาหารล่าสุด · ดูได้อย่างเดียว
            แก้ที่หน้าตั้งค่าแล้วกด RUN ใหม่
          </p>
        </div>
        <Button variant="outline-primary">
          <DownloadIcon />
          ส่งออก CSV
        </Button>
      </div>

      {/* ---------- สรุปหัวเรื่อง ---------- */}
      <div className="mt-4 grid gap-3 @2xl:grid-cols-3">
        <Stat label="สูตรที่คำนวณ" value={`${all.length} สูตร`} />
        <Stat label="ต้นทุนเฉลี่ยต่อถุง" value={`${num(avgCost)} บาท`} />
        <Stat
          label="สูตรที่ไม่เข้าเป้า"
          value={`${failed.length} สูตร`}
          tone={failed.length > 0 ? "danger" : "success"}
        />
      </div>

      {failed.length > 0 && (
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-danger-border bg-danger px-4 py-3 text-sm">
          <TriangleAlertIcon className="mt-0.5 size-4 shrink-0 text-danger-strong" />
          <p>
            มี {failed.length} สูตรที่ธาตุอาหารต่างจากตัวเลขในชื่อสูตรเกิน{" "}
            {ERROR_TOLERANCE} — ดูคอลัมน์ผลต่างท้ายตาราง
            แล้วกลับไปตรวจค่าธาตุอาหารของวัตถุดิบ
          </p>
        </div>
      )}

      {/* ---------- เลือกมุมมอง + ค้นหา ---------- */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {/* จอแคบให้เลื่อนแนวนอนเอา ปุ่มสี่อันย่อไม่ได้ ถ้าปล่อยไว้หน้าจะกว้างเกินจอ */}
        <div
          className={cn(
            "-mx-4 max-w-full overflow-x-auto px-4 sm:mx-0 sm:px-0",
            "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          )}
        >
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            value={view}
            onValueChange={(v) => v && setView(v as View)}
            className="w-max"
          >
            {VIEWS.map((v) => (
              <ToggleGroupItem key={v.id} value={v.id} className="shrink-0">
                {v.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>

        <InputGroup className="w-full bg-card sm:w-auto sm:min-w-48 sm:flex-1">
          <InputGroupAddon align="inline-start">
            <SearchIcon />
          </InputGroupAddon>
          <InputGroupInput
            placeholder="ค้นหา..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
          />
        </InputGroup>
      </div>

      <div className="mt-4">
        {rows.length === 0 ? (
          <EmptyDocs title="ไม่พบสูตร" hint="ลองใช้คำค้นสั้นลง" />
        ) : (
          <TableFrame>
            <Table>
              <TableHeader className={STICKY_HEAD}>
                <TableRow>
                  <TableHead className={HEAD_FIRST}>สูตร</TableHead>
                  <TableHead>กลุ่ม</TableHead>
                  <TableHead className="text-right">ขนาด</TableHead>
                  <TableHead className="text-right">ต้นทุน/ถุง</TableHead>

                  {showWeight &&
                    MATERIALS.map((m) => (
                      <TableHead key={`w-${m.key}`} className="text-right">
                        {m.label} (KG)
                      </TableHead>
                    ))}
                  {showPercent &&
                    MATERIALS.map((m) => (
                      <TableHead key={`p-${m.key}`} className="text-right">
                        {m.label} (%)
                      </TableHead>
                    ))}
                  {showNutrition &&
                    NUTRIENTS.map((n) => (
                      <TableHead key={`n-${n.key}`} className="text-right">
                        {n.label} จริง
                      </TableHead>
                    ))}

                  <TableHead className="text-right">ผลต่าง</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {slice.map((r) => (
                  <Row
                    key={r.id}
                    row={r}
                    showWeight={showWeight}
                    showPercent={showPercent}
                    showNutrition={showNutrition}
                  />
                ))}
              </TableBody>
            </Table>

            <TablePager page={safe} pages={pages} onChange={setPage} />
          </TableFrame>
        )}
      </div>

      <p className="mt-3 text-sm text-muted-foreground">
        ผลต่าง = ค่าธาตุอาหารที่คำนวณได้ เทียบกับตัวเลข N-P-K ในชื่อสูตร
        ยิ่งใกล้ 0 ยิ่งตรงเป้า
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <Button asChild variant="outline-primary">
          <Link href="/production/recipe/setup">กลับไปแก้ข้อมูลตั้งต้น</Link>
        </Button>
        <Button asChild variant="ghost">
          <Link href="/production/recipe">ดูสูตรประจำสัปดาห์</Link>
        </Button>
      </div>
    </main>
  );
}

function Row({
  row: r,
  showWeight,
  showPercent,
  showNutrition,
}: {
  row: OptimizedRow;
  showWeight: boolean;
  showPercent: boolean;
  showNutrition: boolean;
}) {
  const off = r.error > ERROR_TOLERANCE;
  return (
    <TableRow>
      <TableCell className={cn(COL_FIRST, "whitespace-nowrap")}>
        <span className="font-medium">{r.sku}</span>
      </TableCell>
      <TableCell className="whitespace-nowrap text-muted-foreground">
        {RECIPE_GROUP_LABEL[r.group]}
      </TableCell>
      <TableCell className="text-right whitespace-nowrap tabular-nums">
        {r.size} Kg
      </TableCell>
      {/* ต้นทุนคือตัวเลขที่คนดูหน้านี้มองหาก่อนเสมอ จึงเน้นไว้ */}
      <TableCell className="text-right whitespace-nowrap font-semibold tabular-nums">
        {num(r.totalCost)}
      </TableCell>

      {showWeight &&
        MATERIALS.map((m) => (
          <TableCell key={`w-${m.key}`} className="text-right tabular-nums">
            {num(r.weight[m.key])}
          </TableCell>
        ))}
      {showPercent &&
        MATERIALS.map((m) => (
          <TableCell key={`p-${m.key}`} className="text-right tabular-nums">
            {num(r.percent[m.key])}
          </TableCell>
        ))}
      {showNutrition &&
        NUTRIENTS.map((n) => (
          <TableCell key={`n-${n.key}`} className="text-right tabular-nums">
            {num(r.nutrition[n.key], 3)}
          </TableCell>
        ))}

      <TableCell className="text-right">
        {off ? (
          <Badge
            tone="danger"
            appearance="soft"
            className="[--bdg-border:transparent] [--bdg-text:var(--danger-strong)] font-semibold tabular-nums"
          >
            {num(r.error)}
          </Badge>
        ) : (
          <span className="tabular-nums text-muted-foreground">
            {num(r.error)}
          </span>
        )}
      </TableCell>
    </TableRow>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "danger" | "success";
}) {
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-1 text-xl font-semibold tabular-nums",
          tone === "danger" && "text-danger-strong",
          tone === "success" && "text-success-solid"
        )}
      >
        {value}
      </p>
    </div>
  );
}
