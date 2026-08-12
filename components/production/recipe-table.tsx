"use client";

import * as React from "react";
import { CheckIcon } from "lucide-react";
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
  MATERIAL_COLUMNS,
  RECIPE_GROUP_LABEL,
  type Recipe,
} from "@/lib/recipe";

const PAGE_SIZE = 10;

/** ตัวเลขว่างแสดงขีด ไม่ใช่ 0 เพราะ 0 แปลว่าใส่แต่ใส่ศูนย์ คนละเรื่องกับไม่ได้ใช้ */
function Kg({ v }: { v?: number }) {
  if (v === undefined) return <span className="text-muted-foreground">-</span>;
  return <span className="tabular-nums">{v.toFixed(2)}</span>;
}

/**
 * ช่องเคลือบ
 * ข้อมูลจริงดูได้อย่างเดียว จึงเป็นไอคอนถูก ไม่ใช่ checkbox
 * checkbox สื่อว่ากดเปลี่ยนได้ ซึ่งไม่จริงสำหรับหน้านี้
 */
function CoatMark({ on, label }: { on: boolean; label: string }) {
  return on ? (
    <span className="flex items-center justify-center" title={label}>
      <CheckIcon className="size-4 text-success-solid" strokeWidth={2.5} />
      <span className="sr-only">{label}</span>
    </span>
  ) : (
    <span className="block text-center text-muted-foreground">
      <span aria-hidden>-</span>
      <span className="sr-only">ไม่{label}</span>
    </span>
  );
}

export function RecipeTable({ rows }: { rows: Recipe[] }) {
  const [page, setPage] = React.useState(1);
  const { pages, safe, slice } = paginate(rows, page, PAGE_SIZE);

  if (rows.length === 0) {
    return (
      <EmptyDocs
        title="ไม่พบสูตรการผลิต"
        hint="ลองใช้คำค้นสั้นลง หรือค้นด้วยชื่อกลุ่มสูตร"
      />
    );
  }

  return (
    <>
      {/* ---------- จอแคบ: การ์ด ---------- */}
      <div className="space-y-4 @3xl:hidden">
        {slice.map((r) => (
          <RecipeCard key={r.id} recipe={r} />
        ))}
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
                <TableHead className="text-right">บรรจุภัณฑ์</TableHead>
                <TableHead className="text-center">เคลือบ Nitro</TableHead>
                <TableHead className="text-center">เคลือบ Power</TableHead>
                {MATERIAL_COLUMNS.map((c) => (
                  <TableHead key={c.key} className="text-right">
                    {c.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {slice.map((r, i) => {
                // ชื่อกลุ่มขึ้นเฉพาะแถวแรกของกลุ่ม แถวถัดไปเป็นขีด
                // จะได้เห็นว่ากลุ่มเริ่มตรงไหนโดยไม่ต้องอ่านซ้ำทุกบรรทัด
                const first = i === 0 || slice[i - 1].group !== r.group;
                return (
                  <TableRow key={r.id}>
                    <TableCell
                      className={cn(COL_FIRST, "whitespace-nowrap")}
                    >
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
                    {MATERIAL_COLUMNS.map((c) => (
                      <TableCell key={c.key} className="text-right">
                        <Kg v={r[c.key] as number | undefined} />
                      </TableCell>
                    ))}
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

function RecipeCard({ recipe: r }: { recipe: Recipe }) {
  const used = MATERIAL_COLUMNS.filter(
    (c) => (r[c.key] as number | undefined) !== undefined
  );
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="font-semibold">{r.sku}</span>
        <span className="text-sm tabular-nums text-muted-foreground">
          {r.size} Kg
        </span>
      </div>

      <div className="mt-3 rounded-lg bg-brand px-3 py-2.5">
        <p className="text-sm">{RECIPE_GROUP_LABEL[r.group]}</p>
        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-medium">
          <span className="flex items-center gap-1.5">
            <CoatMark on={r.coatNitro} label="เคลือบ Nitro" />
            เคลือบ Nitro
          </span>
          <span className="flex items-center gap-1.5">
            <CoatMark on={r.coatPower} label="เคลือบ Power" />
            เคลือบ Power
          </span>
        </div>
      </div>

      <dl className="mt-3 space-y-1.5 text-sm">
        {used.map((c) => (
          <div
            key={c.key}
            className="flex items-baseline justify-between gap-3"
          >
            <dt className="text-muted-foreground">{c.label}</dt>
            <dd className="font-semibold">
              <Kg v={r[c.key] as number | undefined} />
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
