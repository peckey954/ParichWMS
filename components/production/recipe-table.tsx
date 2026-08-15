"use client";

import * as React from "react";
import { CheckIcon } from "lucide-react";
import { Badge } from "@peckey954/ui/components/ui/badge";
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
import { NUTRIENTS, type NutrientKey } from "@/lib/recipe-input";
import { nutritionByRecipe } from "@/lib/recipe-optimized";
import {
  MATERIAL_COLUMNS,
  RECIPE_GROUP_LABEL,
  type Recipe,
  type RecipeView,
} from "@/lib/recipe";

/* ------------------------------------------------------------------
   ตารางสูตรประจำสัปดาห์ — ดูอย่างเดียว

   ข้อมูลเต็มมี 20 คอลัมน์ ซึ่งไม่มีใครต้องใช้พร้อมกัน
   คนหน้าไลน์ต้องการน้ำหนักวัตถุดิบ ส่วนเปอร์เซ็นต์ธาตุอาหารไว้ตรวจทาน
   จึงสลับชุดข้อมูลที่ระดับหน้า เหลือให้อ่านทีละ 12 คอลัมน์

   จอกว้าง — ตาราง ชื่อกลุ่มขึ้นแถวแรกของกลุ่ม
   จอแคบ  — การ์ด ใช้หัวคั่นกลุ่มแทนการซ้ำชื่อกลุ่มในทุกใบ
------------------------------------------------------------------ */

const PAGE_SIZE = 10;

type Cell = { label: string; value?: number; digits: number };

/** ตัวเลขว่างแสดงขีด ไม่ใช่ 0 เพราะ 0 แปลว่าใส่แต่ใส่ศูนย์ คนละเรื่องกับไม่ได้ใช้ */
function Num({ v, digits = 2 }: { v?: number; digits?: number }) {
  if (v === undefined) return <span className="text-muted-foreground">-</span>;
  return <span className="tabular-nums">{v.toFixed(digits)}</span>;
}

/**
 * ช่องเคลือบ
 * ข้อมูลจริงดูได้อย่างเดียว จึงเป็นไอคอนถูก ไม่ใช่ checkbox
 * checkbox สื่อว่ากดเปลี่ยนได้ ซึ่งไม่จริงสำหรับหน้านี้
 */
function CoatMark({ on, label }: { on: boolean; label: string }) {
  return on ? (
    <span className="flex items-center justify-center" title={label}>
      <CheckIcon className="size-4 text-success-strong" strokeWidth={2.5} />
      <span className="sr-only">{label}</span>
    </span>
  ) : (
    <span className="block text-center text-muted-foreground">
      <span aria-hidden>-</span>
      <span className="sr-only">ไม่{label}</span>
    </span>
  );
}

export function RecipeTable({
  rows,
  view,
}: {
  rows: Recipe[];
  view: RecipeView;
}) {
  const [page, setPage] = React.useState(1);

  // เปลี่ยนคำค้นแล้วกลับหน้าแรก ปรับตอนเรนเดอร์ ไม่ใช้ effect
  const key = `${rows.length}:${rows[0]?.id ?? ""}`;
  const [lastKey, setLastKey] = React.useState(key);
  if (lastKey !== key) {
    setLastKey(key);
    setPage(1);
  }

  // ธาตุอาหารคำนวณจากน้ำหนักวัตถุดิบ ไม่ได้เก็บซ้ำไว้อีกชุด
  const nutrition = React.useMemo(() => nutritionByRecipe(), []);
  const { pages, safe, slice } = paginate(rows, page, PAGE_SIZE);

  if (rows.length === 0) {
    return (
      <EmptyDocs
        title="ไม่พบสูตรการผลิต"
        hint="ลองใช้คำค้นสั้นลง หรือค้นด้วยชื่อกลุ่มสูตร"
      />
    );
  }

  /** ค่าดิบของแถว ยังไม่แปลงเป็น element เพื่อให้กรองค่าว่างได้ตรง ๆ */
  const cells = (r: Recipe): Cell[] => {
    const material = MATERIAL_COLUMNS.map((c) => ({
      label: c.label,
      value: r[c.key] as number | undefined,
      digits: 2,
    }));
    const nutrients = NUTRIENTS.map((n) => ({
      label: `${n.label} (%)`,
      value: nutrition.get(r.id)?.[n.key as NutrientKey],
      digits: 3,
    }));

    if (view === "material") return material;
    if (view === "nutrition") return nutrients;
    return [...material, ...nutrients];
  };

  return (
    <>
      {/* ---------- จอแคบ: การ์ด ---------- */}
      <div className="@3xl:hidden">
        <div className="space-y-3">
          {slice.map((r, i) => (
            <React.Fragment key={r.id}>
              {/* หัวคั่นกลุ่ม ดีกว่าใส่ชื่อกลุ่มซ้ำในทุกการ์ด */}
              {(i === 0 || slice[i - 1].group !== r.group) && (
                <p className="pt-1 text-sm font-medium text-muted-foreground">
                  {RECIPE_GROUP_LABEL[r.group]}
                </p>
              )}
              <RecipeCard recipe={r} cells={cells(r)} />
            </React.Fragment>
          ))}
        </div>
        <TablePager page={safe} pages={pages} onChange={setPage} />
      </div>

      {/* ---------- จอกว้าง: ตาราง ---------- */}
      <div className="hidden @3xl:block">
        <TableFrame>
          <Table>
            <TableHeader className={STICKY_HEAD}>
              <TableRow>
                <TableHead className={HEAD_FIRST}>กลุ่มสูตร</TableHead>
                <TableHead>สูตร</TableHead>
                <TableHead className="text-right whitespace-nowrap">
                  บรรจุภัณฑ์
                </TableHead>
                <TableHead className="text-center whitespace-nowrap">
                  เคลือบ Nitro
                </TableHead>
                <TableHead className="text-center whitespace-nowrap">
                  เคลือบ Power
                </TableHead>
                {/* หัวคอลัมน์อ่านจากแถวแรก จะได้ตรงกับช่องข้อมูลเสมอ
                    ไม่ต้องเขียนเงื่อนไขชุดคอลัมน์ซ้ำสองที่ */}
                {cells(slice[0]).map((c) => (
                  <TableHead
                    key={c.label}
                    className="text-right whitespace-nowrap"
                  >
                    {c.label}
                  </TableHead>
                ))}
                <TableHead className="whitespace-nowrap">หมายเหตุ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {slice.map((r, i) => {
                // ชื่อกลุ่มขึ้นเฉพาะแถวแรกของกลุ่ม แถวถัดไปเป็นขีด
                // จะได้เห็นว่ากลุ่มเริ่มตรงไหนโดยไม่ต้องอ่านซ้ำทุกบรรทัด
                const first = i === 0 || slice[i - 1].group !== r.group;
                return (
                  <TableRow key={r.id}>
                    <TableCell className={cn(COL_FIRST, "whitespace-nowrap")}>
                      {first ? (
                        <span className="font-medium">
                          {RECIPE_GROUP_LABEL[r.group]}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{r.sku}</TableCell>
                    <TableCell className="text-right whitespace-nowrap tabular-nums">
                      {r.size} Kg
                    </TableCell>
                    <TableCell>
                      <CoatMark on={r.coatNitro} label="เคลือบ Nitro" />
                    </TableCell>
                    <TableCell>
                      <CoatMark on={r.coatPower} label="เคลือบ Power" />
                    </TableCell>
                    {cells(r).map((c) => (
                      <TableCell key={c.label} className="text-right">
                        <Num v={c.value} digits={c.digits} />
                      </TableCell>
                    ))}
                    <TableCell className="max-w-56 truncate" title={r.note}>
                      {r.note ?? (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          <TablePager page={safe} pages={pages} onChange={setPage} />
        </TableFrame>
      </div>
    </>
  );
}

function RecipeCard({
  recipe: r,
  cells,
}: {
  recipe: Recipe;
  cells: Cell[];
}) {
  // ค่าที่ไม่ได้ใช้ไม่ต้องจองบรรทัด การ์ดจะได้สั้นเท่าที่มีของจริง
  const shown = cells.filter((c) => c.value !== undefined);

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <span className="font-semibold">{r.sku}</span>
        <span className="text-sm text-muted-foreground tabular-nums">
          {r.size} Kg
        </span>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
        <span className="flex items-center gap-1.5">
          <CoatMark on={r.coatNitro} label="เคลือบ Nitro" />
          เคลือบ Nitro
        </span>
        <span className="flex items-center gap-1.5">
          <CoatMark on={r.coatPower} label="เคลือบ Power" />
          เคลือบ Power
        </span>
      </div>

      <dl className="mt-3 space-y-1.5 rounded-lg bg-brand px-3 py-2.5 text-sm">
        {shown.map((c) => (
          <div key={c.label} className="flex items-baseline justify-between gap-3">
            <dt className="text-muted-foreground">{c.label}</dt>
            <dd className="font-semibold">
              <Num v={c.value} digits={c.digits} />
            </dd>
          </div>
        ))}
      </dl>

      {/* หมายเหตุมีไม่กี่สูตร ขึ้นเฉพาะที่มีจริง ไม่ต้องจองที่ไว้ */}
      {r.note && (
        <p className="mt-3 flex items-start gap-2 text-sm">
          <Badge tone="warning" appearance="soft" className="shrink-0">
            หมายเหตุ
          </Badge>
          <span className="min-w-0 flex-1">{r.note}</span>
        </p>
      )}
    </div>
  );
}
