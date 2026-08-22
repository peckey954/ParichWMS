"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@peckey954/ui/components/ui/badge";
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
  PR_STATUS_LABEL,
  type PrDoc,
  type PrStatus,
} from "@/lib/pr";
import {
  CardBox,
  CardHead,
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

/**
 * รายการใบขอซื้อ — กดแถว/การ์ดแล้วไปหน้ารายละเอียดของใบนั้น
 * (แก้ไข/ยกเลิกได้จากหน้ารายละเอียด เฉพาะตอนสถานะ "ส่งคำขอแล้ว")
 *
 * จอกว้าง — ตาราง จอแคบ — การ์ด ใช้ชิ้นส่วนร่วมจาก components/stock/doc-parts
 * (เลย์เอาต์เอกสารทั่วไป ไม่ใช่ตรรกะเฉพาะสต็อก)
 */
const PAGE_SIZE = 15;

/** สีชิปสถานะ — พื้นสีอ่อนไม่มีขอบ (ตัดขอบด้วย --bdg-border:transparent)
 *  เขียนคลาสเต็มทุกตัว ห้ามประกอบชื่อด้วย template string เพราะ Tailwind
 *  อ่านซอร์สเป็นข้อความตรงๆ ประกอบเอาตอนรันแล้ว utility จะไม่ถูกสร้าง */
const PR_STATUS_CHIP: Record<PrStatus, string> = {
  sent: "[--bdg-surface:var(--chip-yellow)] [--bdg-text:var(--chip-yellow-foreground)]",
  ordered:
    "[--bdg-surface:var(--chip-orange)] [--bdg-text:var(--chip-orange-foreground)]",
  partial: "[--bdg-surface:var(--chip-lime)] [--bdg-text:var(--chip-lime-foreground)]",
  stocked: "[--bdg-surface:var(--chip-green)] [--bdg-text:var(--chip-green-foreground)]",
  cancelled: "[--bdg-surface:var(--chip-red)] [--bdg-text:var(--chip-red-foreground)]",
};

function PrStatusChip({ status }: { status: PrStatus }) {
  return (
    <Badge
      appearance="soft"
      className={cn(
        "[--bdg-border:transparent] font-semibold whitespace-nowrap",
        PR_STATUS_CHIP[status]
      )}
    >
      {PR_STATUS_LABEL[status]}
    </Badge>
  );
}

export function PrList({ docs }: { docs: PrDoc[] }) {
  const [page, setPage] = React.useState(1);
  const { pages, safe, slice } = paginate(docs, page, PAGE_SIZE);
  const router = useRouter();

  if (docs.length === 0) {
    return <EmptyDocs title="ไม่พบใบขอซื้อ" hint="ลองใช้คำค้นสั้นลง" />;
  }

  return (
    <>
      {/* ---------- จอแคบ: การ์ด ---------- */}
      <div className="@3xl:hidden">
        <div className="space-y-4">
          {slice.map((d) => (
            <PrCard key={d.id} doc={d} />
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
                <TableHead className={HEAD_FIRST}>เลขที่ใบขอซื้อ</TableHead>
                <TableHead>ประเภท</TableHead>
                <TableHead>หมวด</TableHead>
                <TableHead>สินค้า</TableHead>
                <TableHead>บรรจุภัณฑ์</TableHead>
                <TableHead className="text-right">ขอซื้อ</TableHead>
                <TableHead>เหตุผลการซื้อ</TableHead>
                <TableHead>วันที่ต้องการสินค้า</TableHead>
                <TableHead>ผู้ขอซื้อ</TableHead>
                <TableHead className={HEAD_LAST}>สถานะ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {slice.map((d) => (
                <TableRow
                  key={d.id}
                  // ทั้งแถวกดได้ ไม่ใช่เฉพาะตัวอักษรเลขที่ใบ — เป้าเล็กแค่คำเดียว
                  // ในแถวสูง 65px คือกดพลาดตลอด ยังเป็น <a> จริงในเซลล์แรกด้วย
                  onClick={() => router.push(`/pr/${d.id}`)}
                  className="cursor-pointer"
                >
                  <TableCell className={COL_FIRST}>
                    <Link
                      href={`/pr/${d.id}`}
                      className="block font-medium whitespace-nowrap hover:underline"
                    >
                      {d.code}
                    </Link>
                    <span className="block text-sm text-muted-foreground">
                      {d.createdAt}
                    </span>
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
                  <TableCell className="whitespace-nowrap">{d.neededDate}</TableCell>
                  <TableCell>
                    <span className="block whitespace-nowrap">{d.requester}</span>
                    {d.editedBy && (
                      <span className="block text-sm whitespace-nowrap text-muted-foreground">
                        แก้ไขล่าสุด: {d.editedBy}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className={COL_LAST}>
                    <PrStatusChip status={d.status} />
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

function PrCard({ doc: d }: { doc: PrDoc }) {
  return (
    // ลิงก์คลุมทั้งใบด้วย after:inset-0 ใน CardHead แทนที่จะเอา <a> ครอบเนื้อหา
    // เพราะการ์ดไม่มีปุ่มซ้อนอยู่ข้างในเหมือนการ์ดอื่น จะครอบทั้งใบตรงๆ ก็ได้
    // แต่ใช้ลิงก์ที่ CardHead ให้อยู่แล้วเพื่อความสม่ำเสมอกับการ์ดเอกสารอื่น
    <div className="relative rounded-xl border border-border bg-card p-4">
      <CardHead code={d.code} at={d.createdAt} href={`/pr/${d.id}`} />

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
        <CardRow label="ผู้ขอซื้อ">{d.requester}</CardRow>
        <CardRow label="วันที่ต้องการสินค้า">{d.neededDate}</CardRow>
        {d.editedBy && <CardRow label="แก้ไขล่าสุด">{d.editedBy}</CardRow>}
      </dl>

      <Separator className="mt-3" />

      <div className="mt-3 flex justify-end">
        <PrStatusChip status={d.status} />
      </div>
    </div>
  );
}
