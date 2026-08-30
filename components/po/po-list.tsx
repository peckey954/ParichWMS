"use client";

import * as React from "react";
import Link from "next/link";
import { Trash2Icon } from "lucide-react";
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
  type PrCategoryId,
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
  ROW_HOVER_NAV,
  STICKY_HEAD,
  TableFrame,
  TablePager,
  paginate,
} from "@/components/stock/doc-parts";

/* ------------------------------------------------------------------
   รายการคิวรอสร้างใบสั่งซื้อ — เลือกได้หลายใบด้วยกล่องติ๊ก (ไปรวมเป็น
   ใบสั่งซื้อเดียวกัน) เฉพาะใบที่ยัง "ส่งคำขอแล้ว" เท่านั้นที่เลือก/ลบ/สร้าง
   ใบสั่งซื้อได้ — ใบที่ "ยกเลิก" ไปแล้วเป็นแค่ประวัติ ไม่มีอะไรให้ทำต่อ

   รวมใบขอซื้อหลายใบเป็นใบสั่งซื้อเดียวกันได้เฉพาะ "ประเภทสินค้า" เดียวกัน —
   เลือกใบแรกแล้วประเภทนั้นจะถูกล็อกไว้ (lockedCategory) ใบอื่นที่คนละประเภท
   ทั้งกล่องติ๊กและปุ่ม "สร้างใบสั่งซื้อ" ของใบนั้นจะกดไม่ได้จนกว่าจะล้างการเลือก
   กล่องติ๊กยังต้องอยู่ครบทุกแถวเสมอ (ไม่ใช่ซ่อนตอนกดไม่ได้) เพื่อให้แนวคอลัมน์
   ตรงกันทั้งตาราง — ใช้ disabled แทนการซ่อน

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
  lockedCategory,
  onToggleOne,
  onCreate,
  onDeleteRequest,
}: {
  docs: PrDoc[];
  selected: Set<string>;
  /** ประเภทสินค้าที่ล็อกไว้จากใบแรกที่เลือก — null แปลว่ายังไม่ได้เลือกอะไรเลย */
  lockedCategory: PrCategoryId | null;
  onToggleOne: (id: string, checked: boolean) => void;
  onCreate: (doc: PrDoc) => void;
  onDeleteRequest: (doc: PrDoc) => void;
}) {
  const [page, setPage] = React.useState(1);
  const { pages, safe, slice } = paginate(docs, page, PAGE_SIZE);

  if (docs.length === 0) {
    return <EmptyDocs title="ไม่พบใบขอซื้อ" hint="ลองใช้คำค้นสั้นลง" />;
  }

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
              categoryLocked={lockedCategory !== null && d.categoryId !== lockedCategory}
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
                {/* กว้างพอให้วันเวลาไม่ตัดคำ ("1/16/2026 | 10:42:52" ยาวกว่าที่
                    คอลัมน์แคบๆ จะพอ) */}
                <TableHead className={cn(HEAD_FIRST, "min-w-48")}>เลขที่ใบขอซื้อ</TableHead>
                {/* แยกประเภท/หมวด/บรรจุภัณฑ์เป็นคอลัมน์ของตัวเอง ตามหน้าขอซื้อ PR
                    (components/pr/pr-list.tsx) แต่สลับให้สินค้าขึ้นก่อน */}
                <TableHead>สินค้า</TableHead>
                <TableHead>ประเภท</TableHead>
                <TableHead>หมวด</TableHead>
                <TableHead>บรรจุภัณฑ์</TableHead>
                <TableHead className="text-right">ขอซื้อ</TableHead>
                <TableHead>เหตุผลการซื้อ</TableHead>
                <TableHead>วันที่ต้องการสินค้า</TableHead>
                <TableHead>ผู้ขอซื้อ</TableHead>
                {/* ไม่มีหัวคอลัมน์ — คอลัมน์นี้มีแต่ปุ่ม บอกตัวเองอยู่แล้วว่าทำอะไร */}
                <TableHead className={HEAD_LAST} />
              </TableRow>
            </TableHeader>
            <TableBody>
              {slice.map((d) => {
                const actionable = isActionable(d);
                const categoryLocked = lockedCategory !== null && d.categoryId !== lockedCategory;
                return (
                  <TableRow key={d.id} className={ROW_HOVER_NAV}>
                    <TableCell className={COL_FIRST}>
                      <div className="flex items-start gap-3">
                        <Checkbox
                          aria-label={`เลือก ${d.code}`}
                          className="mt-0.5"
                          checked={selected.has(d.id)}
                          disabled={!actionable || categoryLocked}
                          onCheckedChange={(v) => onToggleOne(d.id, v !== false)}
                        />
                        <div>
                          <Link
                            href={`/pr/${d.id}`}
                            className="block font-medium whitespace-nowrap hover:underline"
                          >
                            {d.code}
                          </Link>
                          <span className="block text-sm whitespace-nowrap text-muted-foreground">
                            {d.createdAt}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="block font-medium whitespace-nowrap">
                        {d.productName}
                        {d.productSub && ` ${d.productSub}`}
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {PR_CATEGORY_LABEL[d.categoryId]}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{d.group}</TableCell>
                    <TableCell className="whitespace-nowrap">{d.packing ?? "-"}</TableCell>
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
                      <span className="block">{d.neededDate}</span>
                      {d.urgent && (
                        <Badge
                          appearance="soft"
                          className={cn("mt-1 [--bdg-border:transparent] font-semibold", URGENT_CHIP)}
                        >
                          เร่งด่วน
                        </Badge>
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
                            disabled={categoryLocked}
                            onClick={() => onCreate(d)}
                          >
                            สร้างใบสั่งซื้อ
                          </Button>
                          <Button
                            variant="outline-primary"
                            size="icon"
                            aria-label={`ลบ ${d.code}`}
                            className="shrink-0"
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
  categoryLocked,
  onToggle,
  onCreate,
  onDeleteRequest,
}: {
  doc: PrDoc;
  checked: boolean;
  /** ล็อกจากประเภทของใบแรกที่เลือกไว้ — ใบนี้คนละประเภทเลยกดเลือก/สร้างไม่ได้ */
  categoryLocked: boolean;
  onToggle: (checked: boolean) => void;
  onCreate: () => void;
  onDeleteRequest: () => void;
}) {
  const actionable = isActionable(d);

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      {/* items-start (ไม่ใช่ items-center) เพราะเลขที่ใบ/วันที่แยกเป็นสองบรรทัด
          ตอนนี้ — เดิมอยู่แถวเดียวกันหมด (เช็คบ็อกซ์+เลขที่ใบ+วันที่+ปุ่มลบ)
          อัดแน่นเกินไปจนวันที่ตัดคำ แยกวันที่ลงบรรทัดใหม่ใต้เลขที่ใบแทน
          (เหมือนคอลัมน์แรกของตารางจอกว้างด้านบนอยู่แล้ว) */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-3">
          <Checkbox
            aria-label={`เลือก ${d.code}`}
            className="mt-0.5"
            checked={checked}
            disabled={!actionable || categoryLocked}
            onCheckedChange={(v) => onToggle(v !== false)}
          />
          <div className="min-w-0">
            <Link href={`/pr/${d.id}`} className="block font-semibold hover:underline">
              {d.code}
            </Link>
            <span className="block text-sm whitespace-nowrap text-muted-foreground">
              {d.createdAt}
            </span>
          </div>
        </div>
        {/* ปุ่มลบอยู่บนสุดคู่กับเลขที่ใบ — ไม่ใช่ลงไปอยู่แถวล่างสุดกับปุ่มอื่น
            ใช้ outline-primary แบบเดียวกับปุ่มไอคอนอื่นในแอป (เช่นปุ่มตัวกรอง)
            ไม่ใช่ ghost เฉยๆ ตามแบบ */}
        {actionable && (
          <Button
            variant="outline-primary"
            size="icon"
            aria-label={`ลบ ${d.code}`}
            className="shrink-0"
            onClick={onDeleteRequest}
          >
            <Trash2Icon />
          </Button>
        )}
      </div>

      <CardBox className="mt-3">
        <p className="font-medium">
          {d.productName}
          {d.productSub && ` ${d.productSub}`}
        </p>
        {/* เส้นคั่น "|" ระหว่างประเภท/หมวด/บรรจุภัณฑ์ — ตามแบบเดียวกับ
            ProductLabel ของหน้าสั่งซื้อ/อนุมัติ (po-order-list.tsx, approve-list.tsx) */}
        <p className="text-sm">
          {PR_CATEGORY_LABEL[d.categoryId]} | {d.group}
          {d.packing && ` | ${d.packing}`}
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

      {/* สถานะซ้าย ปุ่มขวา แถวเดียวกันเสมอ — ไม่ใช่ปุ่มเต็มความกว้างแยกแถวล่างสุด
          ไม่มีสถานะให้โชว์ก็ปล่อยฝั่งซ้ายว่างไว้ ปุ่มยังอยู่ขวาเหมือนเดิม */}
      <Separator className="mt-3" />
      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="min-w-0">
          {!actionable ? (
            <Badge appearance="soft" className={cn("[--bdg-border:transparent] font-semibold", CANCELLED_CHIP)}>
              ยกเลิก
            </Badge>
          ) : (
            d.urgent && (
              <Badge appearance="soft" className={cn("[--bdg-border:transparent] font-semibold", URGENT_CHIP)}>
                เร่งด่วน
              </Badge>
            )
          )}
        </div>
        {actionable && (
          <Button variant="outline-primary" disabled={categoryLocked} onClick={onCreate}>
            สร้างใบสั่งซื้อ
          </Button>
        )}
      </div>
    </div>
  );
}
