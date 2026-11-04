"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@peckey954/ui/components/ui/table";
import { cn } from "@peckey954/ui/lib/utils";
import { formatTon, weighingNetTon, type WeighingDoc } from "@/lib/weighing";
import {
  CardBox,
  CardHead,
  CardRow,
  COL_FIRST,
  EmptyDocs,
  HEAD_FIRST,
  ROW_HOVER_NAV,
  STICKY_HEAD,
  TableFrame,
  TablePager,
  paginate,
} from "@/components/stock/doc-parts";

/**
 * รายการใบชั่งน้ำหนัก — จอกว้างเป็นตาราง จอแคบเป็นการ์ด ใช้ชิ้นส่วนร่วมชุด
 * เดียวกับแท็บรอรับเข้า (components/stock/doc-parts)
 *
 * หนึ่งแถว = ใบชั่งหนึ่งใบ (รถหนึ่งคัน สินค้าหนึ่งรายการ) กดทั้งแถว/การ์ดแล้ว
 * ไปหน้าใบชั่งน้ำหนักเลย — รอชั่งคือฟอร์มกรอกทันที ชั่งแล้วคือหน้าดู (ตามแบบ
 * ไม่มีชั้นกลางและไม่มีปุ่มท้ายแถวแล้ว)
 *
 * คอลัมน์สุดท้าย: แท็บรอชั่ง = ยอดที่รอชั่ง ("-" = ยังไม่ระบุ)
 * แท็บชั่งแล้ว = น้ำหนักที่ชั่งได้จริง
 */
const PAGE_SIZE = 15;

export function WeighingList({
  docs,
  variant,
}: {
  docs: WeighingDoc[];
  variant: "pending" | "weighed";
}) {
  const [page, setPage] = React.useState(1);
  const { pages, safe, slice } = paginate(docs, page, PAGE_SIZE);
  const router = useRouter();

  if (docs.length === 0) {
    return <EmptyDocs title="ไม่พบใบชั่งน้ำหนัก" hint="ลองใช้คำค้นสั้นลง" />;
  }

  const href = (id: string) => `/weighing/${id}`;
  const valueOf = (d: WeighingDoc) => {
    const ton = variant === "pending" ? d.expectedTon : weighingNetTon(d);
    return ton ? `${formatTon(ton)} ตัน` : "-";
  };

  return (
    <>
      {/* ---------- จอแคบ: การ์ด ---------- */}
      <div className="@3xl:hidden">
        <div className="space-y-4">
          {slice.map((d) => (
            <WeighingCard key={d.id} doc={d} href={href(d.id)} value={valueOf(d)} variant={variant} />
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
                <TableHead className={HEAD_FIRST}>เลขที่ใบชั่งน้ำหนัก</TableHead>
                <TableHead>สินค้า</TableHead>
                <TableHead>ประเภท</TableHead>
                <TableHead>หมวด</TableHead>
                <TableHead className="text-right">บรรจุภัณฑ์</TableHead>
                <TableHead>บริษัท</TableHead>
                <TableHead>วันที่รถจะเข้า</TableHead>
                <TableHead>ทะเบียนรถ</TableHead>
                <TableHead className="text-right">
                  {variant === "pending" ? "รอชั่งน้ำหนัก" : "ชั่งน้ำหนัก"}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {slice.map((d) => (
                <TableRow
                  key={d.id}
                  // ทั้งแถวกดได้ ยังมี <a> จริงในเซลล์แรกไว้ให้คีย์บอร์ด/เปิดแท็บใหม่
                  onClick={() => router.push(href(d.id))}
                  className={cn("cursor-pointer", ROW_HOVER_NAV)}
                >
                  <TableCell className={COL_FIRST}>
                    <Link href={href(d.id)} className="block font-medium whitespace-nowrap hover:underline">
                      {d.code}
                    </Link>
                    <span className="block text-sm whitespace-nowrap text-muted-foreground">
                      {d.createdAt}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="block font-medium">{d.productName}</span>
                    {d.productSub && (
                      <span className="block text-sm text-muted-foreground">{d.productSub}</span>
                    )}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{d.category}</TableCell>
                  <TableCell className="whitespace-nowrap">{d.group}</TableCell>
                  <TableCell className="text-right whitespace-nowrap">{d.packing ?? "-"}</TableCell>
                  <TableCell className="max-w-64 truncate" title={d.supplier}>
                    {d.supplier}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{d.arriveDate}</TableCell>
                  <TableCell className="whitespace-nowrap">{d.plate}</TableCell>
                  <TableCell className="text-right whitespace-nowrap tabular-nums">{valueOf(d)}</TableCell>
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

function WeighingCard({
  doc,
  href,
  value,
  variant,
}: {
  doc: WeighingDoc;
  href: string;
  value: string;
  variant: "pending" | "weighed";
}) {
  return (
    // ลิงก์คลุมทั้งใบด้วย after:inset-0 (ใน CardHead) — ทั้งการ์ดไปหน้าใบชั่ง
    <div className="relative rounded-xl border border-border bg-card p-4">
      <CardHead code={doc.code} at={doc.createdAt} href={href} />

      <CardBox className="mt-3">
        <p className="font-medium">
          {doc.productName}
          {doc.productSub && ` ${doc.productSub}`}
        </p>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {[doc.category, doc.group, doc.packing].filter(Boolean).join(" | ")}
        </p>
        <p className="mt-1 text-sm font-medium">{doc.supplier}</p>
      </CardBox>

      <CardBox className="mt-2">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-sm">
          <span className="font-medium">{doc.plate}</span>
          <span>
            <span className="text-muted-foreground">วันที่รถจะเข้า: </span>
            <span className="font-medium">{doc.arriveDate}</span>
          </span>
        </div>
      </CardBox>

      <dl className="mt-3 space-y-1.5 text-sm">
        <CardRow label={variant === "pending" ? "รอชั่งน้ำหนัก" : "ชั่งน้ำหนัก"}>{value}</CardRow>
      </dl>
    </div>
  );
}
