"use client";

import * as React from "react";
import Link from "next/link";
import { PlusIcon, Trash2Icon } from "lucide-react";
import { Badge } from "@peckey954/ui/components/ui/badge";
import { Button } from "@peckey954/ui/components/ui/button";
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
  formatPrQty,
  formatReasons,
  PR_CATEGORY_LABEL,
  type PrDoc,
} from "@/lib/pr";
import {
  CardBox,
  CardRow,
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

/* ------------------------------------------------------------------
   รายการคิวรอสร้างใบสั่งซื้อ — เลือกได้หลายใบด้วยกล่องติ๊ก (ไปรวมเป็น
   ใบสั่งซื้อเดียวกัน) เฉพาะใบที่ยัง "ส่งคำขอแล้ว" เท่านั้นที่เลือก/ลบ/สร้าง
   ใบสั่งซื้อได้ — ใบที่ "ยกเลิก" ไปแล้วเป็นแค่ประวัติ ไม่มีอะไรให้ทำต่อ

   จอกว้าง — ตาราง จอแคบ — การ์ด ใช้ชิ้นส่วนร่วมจาก components/stock/doc-parts
------------------------------------------------------------------ */

const PAGE_SIZE = 15;

// เขียนคลาสเต็มทุกตัว ห้ามประกอบชื่อด้วย template string
// Tailwind อ่านซอร์สเป็นข้อความตรงๆ ถ้าประกอบเอาตอนรัน utility จะไม่ถูกสร้าง
const URGENT_CHIP =
  "[--bdg-surface:var(--chip-orange)] [--bdg-text:var(--chip-orange-foreground)]";
const CANCELLED_CHIP =
  "[--bdg-surface:var(--chip-red)] [--bdg-text:var(--chip-red-foreground)]";

function isActionable(d: PrDoc) {
  return d.status !== "cancelled";
}

export function PoList({
  docs,
  selected,
  onToggleOne,
  onToggleAll,
  onCreate,
  onDeleteRequest,
}: {
  docs: PrDoc[];
  selected: Set<string>;
  onToggleOne: (id: string, checked: boolean) => void;
  onToggleAll: (ids: string[], checked: boolean) => void;
  onCreate: (doc: PrDoc) => void;
  onDeleteRequest: (doc: PrDoc) => void;
}) {
  const [page, setPage] = React.useState(1);
  const { pages, safe, slice } = paginate(docs, page, PAGE_SIZE);

  if (docs.length === 0) {
    return <EmptyDocs title="ไม่พบใบขอซื้อ" hint="ลองใช้คำค้นสั้นลง" />;
  }

  const selectableIds = slice.filter(isActionable).map((d) => d.id);
  const selectedOnPage = selectableIds.filter((id) => selected.has(id));
  const allOnPageSelected =
    selectableIds.length > 0 && selectedOnPage.length === selectableIds.length;
  const someOnPageSelected = selectedOnPage.length > 0 && !allOnPageSelected;

  return (
    <>
      {/* ---------- จอแคบ: การ์ด ---------- */}
      <div className="@3xl:hidden">
        <div className="space-y-4">
          {slice.map((d) => (
            <PoCard
              key={d.id}
              doc={d}
              checked={selected.has(d.id)}
              onToggle={(checked) => onToggleOne(d.id, checked)}
              onCreate={() => onCreate(d)}
              onDeleteRequest={() => onDeleteRequest(d)}
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
                <TableHead className={cn(HEAD_FIRST, "w-64")}>
                  <div className="flex items-center gap-3">
                    <Checkbox
                      aria-label="เลือกทั้งหมดในหน้านี้"
                      checked={
                        allOnPageSelected
                          ? true
                          : someOnPageSelected
                            ? "indeterminate"
                            : false
                      }
                      disabled={selectableIds.length === 0}
                      onCheckedChange={(v) => onToggleAll(selectableIds, v !== false)}
                    />
                    <span>เลขที่ใบขอซื้อ</span>
                  </div>
                </TableHead>
                <TableHead>ประเภท</TableHead>
                <TableHead>หมวด</TableHead>
                <TableHead>สินค้า</TableHead>
                <TableHead>บรรจุภัณฑ์</TableHead>
                <TableHead className="text-right">ขอซื้อ</TableHead>
                <TableHead>เหตุผลการซื้อ</TableHead>
                <TableHead>วันที่ต้องการสินค้า</TableHead>
                <TableHead>ผู้ขอซื้อ</TableHead>
                <TableHead className={HEAD_LAST}>การดำเนินการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {slice.map((d) => {
                const actionable = isActionable(d);
                return (
                  <TableRow key={d.id}>
                    <TableCell className={COL_FIRST}>
                      <div className="flex items-start gap-3">
                        {actionable ? (
                          <Checkbox
                            aria-label={`เลือก ${d.code}`}
                            className="mt-0.5"
                            checked={selected.has(d.id)}
                            onCheckedChange={(v) => onToggleOne(d.id, v !== false)}
                          />
                        ) : (
                          <span className="mt-0.5 size-4 shrink-0" aria-hidden />
                        )}
                        <div>
                          <Link
                            href={`/pr/${d.id}`}
                            className="block font-medium whitespace-nowrap hover:underline"
                          >
                            {d.code}
                          </Link>
                          <span className="block text-sm text-muted-foreground">
                            {d.createdAt}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {PR_CATEGORY_LABEL[d.categoryId]}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{d.group}</TableCell>
                    <TableCell>
                      <span className="block font-medium whitespace-nowrap">
                        {d.productName}
                      </span>
                      {d.productSub && (
                        <span className="block text-sm text-muted-foreground">
                          {d.productSub}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {d.packing ?? "-"}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap tabular-nums">
                      {formatPrQty(d.qty)} {d.unit}
                    </TableCell>
                    <TableCell
                      className="max-w-40 truncate"
                      title={formatReasons(d.reasons)}
                    >
                      {formatReasons(d.reasons)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {d.neededDate}
                      {d.urgent && (
                        <span className="block text-sm font-medium text-primary">
                          เร่งด่วน
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="block whitespace-nowrap">{d.requester}</span>
                      {actionable ? (
                        d.editedBy && (
                          <span className="block text-sm whitespace-nowrap text-muted-foreground">
                            แก้ไขล่าสุด: {d.editedBy}
                          </span>
                        )
                      ) : (
                        <>
                          <span className="block text-sm whitespace-nowrap text-muted-foreground">
                            ผู้ยกเลิก: {d.cancelActor}
                          </span>
                          <span className="block text-sm whitespace-nowrap text-muted-foreground">
                            เหตุผล: {d.cancelReason}
                          </span>
                        </>
                      )}
                    </TableCell>
                    <TableCell className={COL_LAST}>
                      {actionable && (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline-primary"
                            size="sm"
                            className="rounded-full"
                            onClick={() => onCreate(d)}
                          >
                            <PlusIcon />
                            สร้างใบสั่งซื้อ
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`ลบ ${d.code}`}
                            className="shrink-0 text-muted-foreground hover:text-destructive"
                            onClick={() => onDeleteRequest(d)}
                          >
                            <Trash2Icon />
                          </Button>
                        </div>
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

function PoCard({
  doc: d,
  checked,
  onToggle,
  onCreate,
  onDeleteRequest,
}: {
  doc: PrDoc;
  checked: boolean;
  onToggle: (checked: boolean) => void;
  onCreate: () => void;
  onDeleteRequest: () => void;
}) {
  const actionable = isActionable(d);

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-baseline justify-between gap-2">
        <div className="flex min-w-0 items-baseline gap-3">
          {actionable && (
            <Checkbox
              aria-label={`เลือก ${d.code}`}
              checked={checked}
              onCheckedChange={(v) => onToggle(v !== false)}
            />
          )}
          <Link href={`/pr/${d.id}`} className="font-semibold hover:underline">
            {d.code}
          </Link>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="text-sm text-muted-foreground">{d.createdAt}</span>
          {actionable && (
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`ลบ ${d.code}`}
              className="text-muted-foreground hover:text-destructive"
              onClick={onDeleteRequest}
            >
              <Trash2Icon />
            </Button>
          )}
        </div>
      </div>

      <CardBox className="mt-3">
        <p className="font-medium">
          {d.productName}
          {d.productSub && ` ${d.productSub}`}
        </p>
        <p className="flex flex-wrap items-center gap-x-2 text-sm">
          <span>{PR_CATEGORY_LABEL[d.categoryId]}</span>
          <span>{d.group}</span>
          {d.packing && <span>{d.packing}</span>}
        </p>
      </CardBox>

      <dl className="mt-3 space-y-1.5 text-sm">
        <CardRow label={`ขอซื้อ (${d.unit})`}>{formatPrQty(d.qty)}</CardRow>
        <CardRow label="เหตุผลการซื้อ">{formatReasons(d.reasons)}</CardRow>
        <CardRow label="วันที่ต้องการสินค้า">{d.neededDate}</CardRow>
        <CardRow label="ผู้ขอซื้อ">{d.requester}</CardRow>
        {actionable ? (
          d.editedBy && <CardRow label="แก้ไขล่าสุด">{d.editedBy}</CardRow>
        ) : (
          <>
            <CardRow label="ผู้ยกเลิก">{d.cancelActor}</CardRow>
            <CardRow label="เหตุผล">{d.cancelReason}</CardRow>
          </>
        )}
      </dl>

      {(d.urgent || !actionable) && (
        <>
          <Separator className="mt-3" />
          <div className="mt-3 flex justify-end">
            {!actionable ? (
              <Badge appearance="soft" className={cn("[--bdg-border:transparent] font-semibold", CANCELLED_CHIP)}>
                ยกเลิก
              </Badge>
            ) : (
              <Badge appearance="soft" className={cn("[--bdg-border:transparent] font-semibold", URGENT_CHIP)}>
                เร่งด่วน
              </Badge>
            )}
          </div>
        </>
      )}

      {actionable && (
        <Button className="mt-3 w-full" variant="outline-primary" onClick={onCreate}>
          <PlusIcon />
          สร้างใบสั่งซื้อ
        </Button>
      )}
    </div>
  );
}
