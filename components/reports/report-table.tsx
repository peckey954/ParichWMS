"use client";

import * as React from "react";
import { Checkbox } from "@peckey954/ui/components/ui/checkbox";
import { Separator } from "@peckey954/ui/components/ui/separator";
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
  COL_LAST,
  EmptyDocs,
  HEAD_FIRST,
  HEAD_LAST,
  STICKY_HEAD,
  TableFrame,
  TablePager,
  paginate,
} from "@/components/stock/doc-parts";
import { StatusChip } from "./report-parts";
import {
  formatBaht,
  formatDate,
  type ReportRow,
  type ReportType,
} from "@/lib/reports";

/* ------------------------------------------------------------------
   ตารางพรีวิวเอกสาร

   เลือกทีละใบได้ เพราะบัญชีไม่ได้ดึงทั้งงวดเสมอไป
   บางทีตามหาเฉพาะใบที่ผู้สอบบัญชีขอ หรือใบที่ต้องแก้แล้วส่งใหม่

   ติ๊กหัวตาราง = เลือกทั้งงวด ไม่ใช่แค่หน้าที่เห็น
   ถ้าเลือกแค่หน้าปัจจุบันคนจะเผลอโหลดไม่ครบโดยไม่รู้ตัว
------------------------------------------------------------------ */

const PAGE_SIZE = 15;

export function ReportTable({
  type,
  rows,
  selected,
  onToggle,
  onToggleAll,
}: {
  type: ReportType;
  rows: ReportRow[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  onToggleAll: () => void;
}) {
  const [page, setPage] = React.useState(1);

  // เปลี่ยนชนิดเอกสารหรือช่วงวันที่ = คนละชุดข้อมูล ต้องกลับหน้าแรก
  // ปรับค่าตอนเรนเดอร์ ไม่ใช้ effect เพราะ effect จะเรนเดอร์หน้าเก่าแวบหนึ่งก่อน
  const key = `${type.id}:${rows.length}`;
  const [lastKey, setLastKey] = React.useState(key);
  if (lastKey !== key) {
    setLastKey(key);
    setPage(1);
  }

  const { pages, safe, slice } = paginate(rows, page, PAGE_SIZE);

  if (rows.length === 0) {
    return (
      <EmptyDocs
        title={`ไม่มี${type.label}ในช่วงที่เลือก`}
        hint="ลองขยายช่วงวันที่ หรือเลือกชนิดเอกสารอื่น"
      />
    );
  }

  const allChecked = rows.every((r) => selected.has(r.id));
  const someChecked = !allChecked && rows.some((r) => selected.has(r.id));

  return (
    <>
      {/* ---------- จอแคบ: การ์ด ---------- */}
      <div className="@3xl:hidden">
        <div className="mb-3 flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3">
          <Checkbox
            id="select-all-cards"
            checked={allChecked ? true : someChecked ? "indeterminate" : false}
            onCheckedChange={onToggleAll}
          />
          <label htmlFor="select-all-cards" className="text-sm font-medium">
            เลือกทั้งหมดในช่วงนี้ ({rows.length})
          </label>
        </div>

        <div className="space-y-3">
          {slice.map((r) => (
            <RowCard
              key={r.id}
              type={type}
              row={r}
              checked={selected.has(r.id)}
              onToggle={() => onToggle(r.id)}
            />
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
                <TableHead className={cn(HEAD_FIRST, "w-12")}>
                  <Checkbox
                    aria-label="เลือกทุกเอกสารในช่วงนี้"
                    checked={
                      allChecked ? true : someChecked ? "indeterminate" : false
                    }
                    onCheckedChange={onToggleAll}
                  />
                </TableHead>
                <TableHead>เลขที่เอกสาร</TableHead>
                <TableHead>วันที่</TableHead>
                <TableHead>{type.partyLabel}</TableHead>
                <TableHead>{type.refLabel ?? "อ้างอิง"}</TableHead>
                <TableHead className="text-right">จำนวนรายการ</TableHead>
                {type.hasAmount && (
                  <TableHead className="text-right">มูลค่า (บาท)</TableHead>
                )}
                <TableHead className={HEAD_LAST}>สถานะ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {slice.map((r) => (
                <TableRow key={r.id} data-state={selected.has(r.id) ? "selected" : undefined}>
                  <TableCell className={COL_FIRST}>
                    <Checkbox
                      aria-label={`เลือก ${r.code}`}
                      checked={selected.has(r.id)}
                      onCheckedChange={() => onToggle(r.id)}
                    />
                  </TableCell>
                  <TableCell className="font-medium whitespace-nowrap">
                    {r.code}
                  </TableCell>
                  <TableCell className="whitespace-nowrap tabular-nums">
                    {formatDate(r.date)}
                  </TableCell>
                  <TableCell className="max-w-64 truncate" title={r.party}>
                    {r.party}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{r.ref ?? "-"}</TableCell>
                  <TableCell className="text-right tabular-nums">{r.items}</TableCell>
                  {type.hasAmount && (
                    <TableCell className="text-right font-semibold whitespace-nowrap tabular-nums">
                      {formatBaht(r.amount ?? 0)}
                    </TableCell>
                  )}
                  <TableCell className={COL_LAST}>
                    <StatusChip status={r.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <TablePager page={safe} pages={pages} onChange={setPage} />
        </TableFrame>
      </div>
    </>
  );
}

function RowCard({
  type,
  row,
  checked,
  onToggle,
}: {
  type: ReportType;
  row: ReportRow;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-start gap-3">
        <Checkbox
          aria-label={`เลือก ${row.code}`}
          checked={checked}
          onCheckedChange={onToggle}
          className="mt-1"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="font-semibold">{row.code}</span>
            <span className="text-sm text-muted-foreground tabular-nums">
              {formatDate(row.date)}
            </span>
          </div>

          <dl className="mt-3 space-y-1.5 text-sm">
            <Line label={type.partyLabel}>{row.party}</Line>
            <Line label={type.refLabel ?? "อ้างอิง"}>{row.ref ?? "-"}</Line>
            <Line label="จำนวนรายการ">{row.items}</Line>
            {type.hasAmount && (
              <Line label="มูลค่า (บาท)">{formatBaht(row.amount ?? 0)}</Line>
            )}
          </dl>

          <Separator className="mt-3" />
          <div className="mt-3 flex items-baseline justify-between gap-3 text-sm">
            <span className="text-muted-foreground">สถานะ:</span>
            <StatusChip status={row.status} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Line({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="shrink-0 text-muted-foreground">{label}:</dt>
      <dd className="truncate text-right font-semibold tabular-nums">{children}</dd>
    </div>
  );
}
