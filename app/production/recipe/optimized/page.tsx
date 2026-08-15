"use client";

import * as React from "react";
import Link from "next/link";
import {
  DownloadIcon,
  PlayIcon,
  SearchIcon,
  Settings2Icon,
  TriangleAlertIcon,
} from "lucide-react";
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
import { toast } from "sonner";
import { useRecipeRun } from "@/components/production/recipe-run";
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

const VIEWS: { id: View; label: string; short: string }[] = [
  { id: "weight", label: "น้ำหนักวัตถุดิบ", short: "น้ำหนัก" },
  { id: "percent", label: "สัดส่วนวัตถุดิบ", short: "สัดส่วน" },
  { id: "nutrition", label: "ธาตุอาหารที่ได้", short: "ธาตุอาหาร" },
  { id: "all", label: "ทั้งหมด", short: "ทั้งหมด" },
];

const PAGE_SIZE = 12;

const num = (v: number, d = 2) =>
  v.toLocaleString("th-TH", { minimumFractionDigits: d, maximumFractionDigits: d });

export default function OptimizedFormulaPage() {
  const { runAt, stale, markRun } = useRecipeRun();
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

  /** คำนวณสดทุกครั้งอยู่แล้ว ปุ่มนี้จึงแค่ประทับเวลาใหม่และเคลียร์คำเตือน */
  const recalc = () => {
    markRun();
    toast.success("คำนวณสูตรใหม่แล้ว", {
      description: `ใช้ต้นทุนและค่าธาตุอาหารล่าสุด ${all.length} สูตร`,
    });
  };

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
              สูตรที่เหมาะสม
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mt-2 flex items-start justify-between gap-3 sm:mt-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">
            สูตรที่เหมาะสม
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            ผลการ Optimized Formula จากต้นทุนและค่าธาตุอาหารล่าสุด ·
            คำนวณล่าสุด {runAt}
          </p>
        </div>

        {/* ทางเข้าหน้าแก้ข้อมูลอยู่ในนี้ ไม่ใช่ที่หน้าสูตรประจำสัปดาห์
            คนต้องเห็นผลก่อนว่าตอนนี้เป็นยังไง แล้วค่อยตัดสินใจว่าจะแก้อะไร
            ส่งออก CSV เหลือแต่ไอคอนบนจอแคบ โหลดไฟล์ลงมือถือแล้วใช้ต่อยาก */}
        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            aria-label="ส่งออก CSV"
            className="@3xl:hidden"
          >
            <DownloadIcon />
          </Button>
          <Button variant="outline" className="hidden @3xl:inline-flex">
            <DownloadIcon />
            ส่งออก CSV
          </Button>

          <Button asChild variant="outline-primary">
            <Link href="/production/recipe/setup">
              <Settings2Icon className="hidden @3xl:inline" />
              ตั้งค่าข้อมูล
            </Link>
          </Button>
        </div>
      </div>

      {/* ---------- เตือนว่าผลที่เห็นเก่าไปแล้ว ----------
           กับดักที่ใหญ่ที่สุดของหน้านี้ — มีคนแก้ต้นทุนแล้วไม่ได้กด RUN
           ตัวเลขที่เห็นจะเป็นของเก่าโดยไม่มีอะไรบอก
           แล้วคนจะตัดสินใจจากต้นทุนที่ไม่ตรงกับความจริง */}
      {stale && (
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-chip-yellow-foreground/40 bg-chip-yellow px-4 py-3 text-sm">
          <TriangleAlertIcon className="size-4 shrink-0" />
          <p className="min-w-0 flex-1">
            ข้อมูลตั้งต้นถูกแก้หลังคำนวณครั้งล่าสุด
            ตัวเลขที่เห็นยังไม่รวมสิ่งที่เพิ่งแก้
          </p>
          <Button size="sm" onClick={recalc}>
            <PlayIcon />
            คำนวณใหม่
          </Button>
        </div>
      )}

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

      {/* ---------- เลือกมุมมอง + ค้นหา ----------
           ใช้ชิปกลมแบบเดียวกับหน้าสูตรประจำสัปดาห์
           จอแคบใช้ชื่อย่อ ปุ่มสี่อันจึงลงจอได้โดยไม่ต้องเลื่อนแนวนอน */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <div
          role="radiogroup"
          aria-label="ชุดข้อมูลที่แสดง"
          className="flex flex-wrap gap-2"
        >
          {VIEWS.map((v) => {
            const on = view === v.id;
            return (
              <button
                key={v.id}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => setView(v.id)}
                className={cn(
                  "shrink-0 rounded-full border px-3 py-1 text-sm whitespace-nowrap transition-colors",
                  "focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
                  on
                    ? "border-primary bg-brand font-medium text-primary"
                    : "border-border text-foreground hover:bg-accent-hover"
                )}
              >
                <span className="@3xl:hidden">{v.short}</span>
                <span className="hidden @3xl:inline">{v.label}</span>
              </button>
            );
          })}
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
          <>
          {/* ---------- จอแคบ: การ์ด ----------
               24 คอลัมน์บีบลงจอ 390px แล้วหัวตารางโดนตัดกลางคำ
               เลื่อนไปทางขวาก็ไม่รู้แล้วว่าเลขไหนของคอลัมน์อะไร
               การ์ดวางป้ายกำกับคู่กับค่าเสมอ ไม่มีทางอ่านผิดคอลัมน์ */}
          <div className="space-y-3 @3xl:hidden">
            {slice.map((r) => (
              <RowCard
                key={r.id}
                row={r}
                showWeight={showWeight}
                showPercent={showPercent}
                showNutrition={showNutrition}
              />
            ))}
            <TablePager page={safe} pages={pages} onChange={setPage} />
          </div>

          <div className="hidden @3xl:block">
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
          </div>
          </>
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

/**
 * การ์ดสำหรับจอแคบ
 *
 * หน้านี้ตอบคำถามว่า "สูตรนี้คุ้มไหม และตรงเป้าไหม"
 * ต้นทุนต่อถุงกับผลต่างจึงขึ้นก่อนเป็นแถบสรุป แยกจากตัวเลขรายวัตถุดิบ
 * ที่เป็นข้อมูลประกอบ ไม่ใช่คำตอบ
 */
function RowCard({
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

  const cells: { label: string; value: string }[] = [
    ...(showWeight
      ? MATERIALS.map((m) => ({
          label: `${m.label} (KG)`,
          value: num(r.weight[m.key]),
        }))
      : []),
    ...(showPercent
      ? MATERIALS.map((m) => ({
          label: `${m.label} (%)`,
          value: num(r.percent[m.key]),
        }))
      : []),
    ...(showNutrition
      ? NUTRIENTS.map((n) => ({
          label: `${n.label} จริง`,
          value: num(r.nutrition[n.key], 3),
        }))
      : []),
  ];

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="rounded-lg bg-brand px-3 py-2.5">
        <p className="font-semibold">{r.sku}</p>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-sm">
          <span>{RECIPE_GROUP_LABEL[r.group]}</span>
          <span className="text-border" aria-hidden>
            |
          </span>
          <span className="tabular-nums">{r.size} Kg</span>
        </p>
      </div>

      {/* สองตัวนี้คือคำตอบของหน้า จึงเด่นกว่าตัวเลขรายวัตถุดิบข้างล่าง */}
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div>
          <p className="text-sm text-muted-foreground">ต้นทุน/ถุง</p>
          <p className="mt-0.5 font-semibold tabular-nums">
            {num(r.totalCost)}
            <span className="ml-1 text-sm font-normal text-muted-foreground">
              บาท
            </span>
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">ผลต่างจากเป้า</p>
          <p
            className={cn(
              "mt-0.5 font-semibold tabular-nums",
              off ? "text-danger-strong" : "text-muted-foreground"
            )}
          >
            {num(r.error)}
            {off && (
              <Badge
                tone="danger"
                appearance="soft"
                className="ml-2 align-middle"
              >
                ไม่เข้าเป้า
              </Badge>
            )}
          </p>
        </div>
      </div>

      <dl className="mt-3 space-y-1.5 text-sm">
        {cells.map((c) => (
          <div key={c.label} className="flex items-baseline justify-between gap-3">
            <dt className="text-muted-foreground">{c.label}:</dt>
            <dd className="font-semibold tabular-nums">{c.value}</dd>
          </div>
        ))}
      </dl>
    </div>
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
