"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CloudUploadIcon,
  CoinsIcon,
  FlaskConicalIcon,
  SaveIcon,
  SearchIcon,
  Settings2Icon,
  SlidersHorizontalIcon,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@peckey954/ui/components/ui/alert-dialog";
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
import {
  BackToTop,
  StickyToolbar,
  useStickyToolbar,
} from "@/components/sticky-toolbar";
import {
  GroupHeaderRow,
  useGroupStickyTop,
} from "@/components/production/group-header-row";
import { useRecipeRun } from "@/components/production/recipe-run";
import { RECIPE_GROUP_LABEL } from "@/lib/recipe";
import type { RawMaterialDraft } from "@/lib/recipe-input";
import {
  MATERIALS,
  NUTRIENTS,
  computeOptimized,
  matchesOptimized,
  type OptimizedRow,
} from "@/lib/recipe-optimized";

/* ------------------------------------------------------------------
   ตารางผลลัพธ์ "สูตรที่เหมาะสม" — ใช้ร่วมกันสองโหมด

   published = หน้าจริงที่ทุกคนเห็น อ่านจากค่าที่เผยแพร่แล้ว
   preview   = ผลลัพธ์จากร่างที่กำลังแก้ในตั้งค่าข้อมูล ยังไม่มีใครเห็นนอกจาก
               คนแก้เอง มีแถบบอกชัดเจน + ปุ่มเผยแพร่พร้อมกล่องยืนยัน

   24 คอลัมน์ในหน้าเดียวคือเลื่อนซ้ายขวาตลอดเวลา แต่จริง ๆ มันคือ
   "สามมุมมองของเรื่องเดียวกัน" ไม่ใช่ 24 เรื่อง
     น้ำหนัก  → ใช้ตอนสั่งวัตถุดิบ
     สัดส่วน  → ใช้ตอนตรวจสูตร
     ธาตุอาหาร → ใช้ตอนเช็กว่าตรงเป้าไหม
   จึงให้เลือกดูทีละมุม โดยตรึงสูตร/ขนาด/ต้นทุน ไว้เสมอ

   กลุ่มสูตรเดิมเป็นคอลัมน์ที่ซ้ำชื่อกลุ่มทุกแถว (หรือขีดคั่นถ้าซ้ำ) กินที่แนวนอน
   ไปเปล่า ๆ เปลี่ยนเป็นแถวหัวกลุ่มเต็มความกว้าง ตรึงอยู่ใต้หัวตารางจนกว่าจะ
   เลื่อนผ่านกลุ่มนั้น (เหมือนหัวข้อ A-Z ใน contact list) แทน
------------------------------------------------------------------ */

type View = "weight" | "percent" | "nutrition" | "all";

const VIEWS: { id: View; label: string; short: string }[] = [
  { id: "weight", label: "น้ำหนักวัตถุดิบ", short: "น้ำหนัก" },
  { id: "percent", label: "สัดส่วนวัตถุดิบ", short: "สัดส่วน" },
  { id: "nutrition", label: "ธาตุอาหารที่ได้", short: "ธาตุอาหาร" },
  { id: "all", label: "ทั้งหมด", short: "ทั้งหมด" },
];

// ตั้งสูงกว่าจำนวนสูตรมอคทั้งหมด (33 = 4 Nitro + 23 Bulk ธรรมดา + 6 Bulk กราเวียร์)
// ตั้งใจให้ทั้ง 3 กลุ่มอยู่หน้าเดียวกัน จะได้เลื่อนทดสอบแถบหัวกลุ่มตรึงผ่านทั้ง
// 3 กลุ่มรวดเดียว ไม่ต้องเปลี่ยนหน้าเพื่อไปเจอกลุ่มถัดไป
const PAGE_SIZE = 40;

const num = (v: number, d = 2) =>
  v.toLocaleString("th-TH", { minimumFractionDigits: d, maximumFractionDigits: d });

export function OptimizedFormulaView({
  materials,
  mode,
}: {
  materials: RawMaterialDraft[];
  mode: "published" | "preview";
}) {
  const router = useRouter();
  const { runAt, hasUnpublished, draftSavedAt, publish, saveDraft } = useRecipeRun();
  const [view, setView] = React.useState<View>("weight");
  const [query, setQuery] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  // เลื่อนลงซ่อนแถบชิป+ค้นหา เลื่อนขึ้นเอากลับมา แบบเดียวกับหน้าสต็อกทั่วไป
  const { hidden, showTop, scrollToTop, barRef } = useStickyToolbar();
  // วัดความสูงจริงของแถวหัวตาราง ไว้ตรึงแถวหัวกลุ่มให้อยู่ใต้หัวตารางพอดี
  const { headRef, top: groupTop } = useGroupStickyTop();

  const all = React.useMemo(() => computeOptimized(undefined, materials), [materials]);
  const rows = all.filter((r) => matchesOptimized(r, query));
  const { pages, safe, slice } = paginate(rows, page, PAGE_SIZE);

  const showWeight = view === "weight" || view === "all";
  const showPercent = view === "percent" || view === "all";
  const showNutrition = view === "nutrition" || view === "all";

  const isPreview = mode === "preview";

  function confirmPublish() {
    setConfirmOpen(false);
    publish();
    router.push("/production/recipe/optimized");
  }

  return (
    <>
    <main
      className={cn(
        "mx-auto w-full max-w-7xl px-4 sm:px-6",
        // จอพรีวิวมีแถบปุ่มตรึงล่างของตัวเอง เนื้อหาจึงต้องเผื่อที่ไม่ให้โดนบัง
        isPreview ? "pt-3 pb-24 sm:pt-5" : "py-3 sm:py-5"
      )}
    >
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
          {isPreview ? (
            <>
              <BreadcrumbItem>
                <BreadcrumbLink href="/production/recipe/optimized">
                  สูตรที่เหมาะสม
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-primary">ดูผลลัพธ์</BreadcrumbPage>
              </BreadcrumbItem>
            </>
          ) : (
            <BreadcrumbItem>
              <BreadcrumbPage className="text-primary">สูตรที่เหมาะสม</BreadcrumbPage>
            </BreadcrumbItem>
          )}
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mt-2 flex flex-wrap items-start justify-between gap-3 sm:mt-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">
            {isPreview ? "ผลลัพธ์สูตรที่เหมาะสม" : "สูตรที่เหมาะสม"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isPreview
              ? `ผลลัพธ์จากร่างที่ยังไม่เผยแพร่ · บันทึกร่างล่าสุด ${draftSavedAt ?? "ยังไม่เคยบันทึก"}`
              : `ผลการ Optimized Formula จากต้นทุนและค่าธาตุอาหารล่าสุด · เผยแพร่ล่าสุด ${runAt}`}
          </p>
        </div>

        {/* ทางเข้าหน้าแก้ข้อมูลอยู่ในนี้ ไม่ใช่ที่หน้าสูตรประจำสัปดาห์
            คนต้องเห็นผลก่อนว่าตอนนี้เป็นยังไง แล้วค่อยตัดสินใจว่าจะแก้อะไร */}
        {isPreview ? (
          <Button asChild variant="outline-primary" className="shrink-0">
            <Link href="/production/recipe/setup/input">
              <SlidersHorizontalIcon />
              ตั้งค่าข้อมูล
            </Link>
          </Button>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline-primary" className="shrink-0">
              <Link href="/production/recipe/setup/formula">
                <FlaskConicalIcon />
                ตั้งค่าสูตร
              </Link>
            </Button>
            <Button asChild variant="outline-primary" className="shrink-0">
              <Link href="/production/recipe/setup/cost">
                <CoinsIcon />
                ตั้งค่าต้นทุน
              </Link>
            </Button>
            <Button asChild className="shrink-0">
              <Link href="/production/recipe/setup/input">
                <SlidersHorizontalIcon />
                ตั้งค่าข้อมูล
              </Link>
            </Button>
          </div>
        )}
      </div>

      {/* ---------- แถบร่าง/เผยแพร่ ----------
           ปุ่มกดจริง (บันทึกร่าง/เผยแพร่) ย้ายไปอยู่แถบปุ่มล่างสุดของหน้าแล้ว
           แถบนี้เหลือหน้าที่แค่บอกสถานะ ไม่ต้องมีปุ่มซ้ำสองที่ */}
      {isPreview ? (
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-chip-orange-foreground/40 bg-chip-orange px-4 py-3 text-sm">
          <CloudUploadIcon className="size-4 shrink-0" />
          <p className="min-w-0 flex-1">
            นี่คือผลลัพธ์จากร่างที่ยังไม่เผยแพร่ ยังไม่มีใครเห็นนอกจากคุณ —
            กด &quot;บันทึกร่าง&quot; หรือ &quot;เผยแพร่&quot; ได้จากแถบด้านล่าง
          </p>
        </div>
      ) : (
        hasUnpublished && (
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-chip-yellow-foreground/40 bg-chip-yellow px-4 py-3 text-sm">
            <Settings2Icon className="size-4 shrink-0" />
            <p className="min-w-0 flex-1">
              มีการแก้ไขที่ตั้งค่าข้อมูล
              {draftSavedAt ? ` บันทึกร่างล่าสุดเมื่อ ${draftSavedAt} ` : " "}
              ซึ่งยังไม่เผยแพร่ ตัวเลขที่เห็นอยู่นี้ยังไม่รวมสิ่งที่เพิ่งแก้
            </p>
            <Button asChild size="sm" variant="outline-primary">
              <Link href="/production/recipe/optimized/preview">ดูผลลัพธ์</Link>
            </Button>
          </div>
        )
      )}

      {/* ---------- จำนวนสูตรทั้งหมด ---------- */}
      <p className="mt-4 text-sm text-muted-foreground">
        การดูข้อมูลทั้งหมด ({all.length} สูตร):
      </p>

      {/* ---------- เลือกมุมมอง + ค้นหา ----------
           ใช้ชิปกลมแบบเดียวกับหน้าสูตรประจำสัปดาห์
           จอแคบใช้ชื่อย่อ ปุ่มสี่อันจึงลงจอได้โดยไม่ต้องเลื่อนแนวนอน

           ล็อกติดบนตลอด เหมือนหน้าสต็อกทั่วไป
           สลับมุมมองได้จากตรงไหนของตารางก็ได้ ไม่ต้องเลื่อนกลับขึ้นบนสุด */}
      <StickyToolbar hidden={hidden} barRef={barRef}>
        <div className="flex flex-col gap-2 pt-2">
          <InputGroup className="w-full bg-card">
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
        </div>
      </StickyToolbar>

      <div className="mt-4">
        {rows.length === 0 ? (
          <EmptyDocs title="ไม่พบสูตร" hint="ลองใช้คำค้นสั้นลง" />
        ) : (
          <>
            {/* ---------- จอแคบ: การ์ด ----------
                 24 คอลัมน์บีบลงจอ 390px แล้วหัวตารางโดนตัดกลางคำ
                 เลื่อนไปทางขวาก็ไม่รู้แล้วว่าเลขไหนของคอลัมน์อะไร
                 การ์ดวางป้ายกำกับคู่กับค่าเสมอ ไม่มีทางอ่านผิดคอลัมน์
                 กลุ่มอยู่ในหัวการ์ดตัวเองแล้ว ไม่ต้องมีหัวคั่นกลุ่มซ้ำ */}
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
                    <TableRow ref={headRef}>
                      <TableHead className={HEAD_FIRST}>สูตร</TableHead>
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
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {slice.map((r, i) => {
                      const firstOfGroup = i === 0 || slice[i - 1].group !== r.group;
                      return (
                        <React.Fragment key={r.id}>
                          {firstOfGroup && (
                            <GroupHeaderRow
                              label={RECIPE_GROUP_LABEL[r.group]}
                              top={groupTop}
                            />
                          )}
                          <Row
                            row={r}
                            showWeight={showWeight}
                            showPercent={showPercent}
                            showNutrition={showNutrition}
                          />
                        </React.Fragment>
                      );
                    })}
                  </TableBody>
                </Table>

                <TablePager page={safe} pages={pages} onChange={setPage} />
              </TableFrame>
            </div>
          </>
        )}
      </div>

      {/* หน้าพรีวิวมีแถบปุ่มตรึงล่างสูง ~72px ยกปุ่มกลับขึ้นบนสุดให้พ้นแถบนั้น
          หน้าปกติไม่มีแถบล่าง ใช้ระยะเริ่มต้นของ BackToTop ตามเดิม */}
      <BackToTop
        show={showTop}
        onClick={scrollToTop}
        className={isPreview ? "bottom-20" : undefined}
      />

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>เผยแพร่สูตรที่เหมาะสมชุดนี้ใช่ไหม?</AlertDialogTitle>
            <AlertDialogDescription>
              ตัวเลขจะอัปเดตในหน้าสูตรที่เหมาะสมทันที ทุกคนจะเห็นค่าชุดนี้แทนของเดิม
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยังไม่เผยแพร่</AlertDialogCancel>
            <AlertDialogAction onClick={confirmPublish}>ยืนยันเผยแพร่</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>

    {/* ---------- แถบปุ่มล่าง (เฉพาะหน้าดูผลลัพธ์) ----------
         ย้อนกลับซ้าย บันทึกร่าง/เผยแพร่ขวา กดตัดสินใจได้จากตรงนี้เลย
         ไม่ต้องเลื่อนกลับไปหน้าตั้งค่าข้อมูลก่อน — เห็นผลแล้วค่อยตัดสินใจ
         กว้างเต็มพื้นที่เสมอ ไม่ผูกกับ max-w-7xl ของเนื้อหาด้านบน เหมือนหน้า
         ตั้งค่าอื่น ๆ ในกลุ่มนี้ */}
    {isPreview && (
      <div className="sticky bottom-0 z-30 border-t border-border bg-surface">
        <div className="flex w-full items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Button variant="outline-primary" onClick={() => router.back()}>
            ย้อนกลับ
          </Button>
          <div className="flex items-center gap-3">
            <Button variant="outline-primary" onClick={saveDraft}>
              <SaveIcon />
              บันทึกร่าง
            </Button>
            <Button onClick={() => setConfirmOpen(true)}>
              <CloudUploadIcon />
              เผยแพร่
            </Button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}

/**
 * การ์ดสำหรับจอแคบ
 *
 * หน้านี้ตอบคำถามว่าสูตรนี้ต้นทุนเท่าไร ต้นทุนต่อถุงจึงขึ้นก่อน
 * แยกจากตัวเลขรายวัตถุดิบที่เป็นข้อมูลประกอบ ไม่ใช่คำตอบ
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

      {/* ต้นทุนคือคำตอบของหน้า จึงเด่นกว่าตัวเลขรายวัตถุดิบข้างล่าง */}
      <div className="mt-3">
        <p className="text-sm text-muted-foreground">ต้นทุน/ถุง</p>
        <p className="mt-0.5 font-semibold tabular-nums">
          {num(r.totalCost)}
          <span className="ml-1 text-sm font-normal text-muted-foreground">
            บาท
          </span>
        </p>
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
  return (
    <TableRow>
      <TableCell className={cn(COL_FIRST, "whitespace-nowrap")}>
        <span className="font-medium">{r.sku}</span>
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
    </TableRow>
  );
}
