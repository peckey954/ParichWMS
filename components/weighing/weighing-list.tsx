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
  paginate,
} from "@/components/stock/doc-parts";
import { PAGE_SIZES, Pager } from "@/components/stock/goods-waiting-list";

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
 *
 * แบ่งหน้าแบบเต็ม (แถวต่อหน้า | เลขหน้า | ไปที่หน้า) ตัวเดียวกับแท็บรอรับเข้า
 */

export function WeighingList({
  docs,
  variant,
}: {
  docs: WeighingDoc[];
  variant: "pending" | "weighed";
}) {
  const [page, setPage] = React.useState(1);
  const [size, setSize] = React.useState(PAGE_SIZES[0]);
  const { pages, safe, slice } = paginate(docs, page, size);
  const router = useRouter();

  if (docs.length === 0) {
    return <EmptyDocs title="ไม่พบใบชั่งน้ำหนัก" hint="ลองใช้คำค้นสั้นลง" />;
  }

  const href = (id: string) => `/weighing/${id}`;
  const tonOf = (d: WeighingDoc) => {
    const ton = variant === "pending" ? d.expectedTon : weighingNetTon(d);
    return ton ? formatTon(ton) : undefined;
  };
  const valueOf = (d: WeighingDoc) => {
    const ton = tonOf(d);
    return ton ? `${ton} ตัน` : "-";
  };

  return (
    <div className="space-y-4">
      {/* ---------- จอแคบ: การ์ด ---------- */}
      <div className="space-y-4 @3xl:hidden">
        {slice.map((d) => (
          <WeighingCard key={d.id} doc={d} href={href(d.id)} ton={tonOf(d)} variant={variant} />
        ))}
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
        </TableFrame>
      </div>

      <Pager
        page={safe}
        pages={pages}
        size={size}
        onPage={setPage}
        onSize={(n) => {
          setSize(n);
          setPage(1);
        }}
      />
    </div>
  );
}

/**
 * การ์ดจอแคบตามแบบ (Figma 64:70898)
 *   เลขที่ใบ ··········· วันเวลา
 *   กล่องส้ม: ชื่อสินค้า / ประเภท | หมวด | บรรจุภัณฑ์ / บริษัท
 *   ทะเบียนรถ · วันที่รถจะเข้า · รอชั่ง (ตัน) — หัวข้อซ้าย ค่าชิดขวา หน่วยอยู่ในหัวข้อ
 */
function WeighingCard({
  doc,
  href,
  ton,
  variant,
}: {
  doc: WeighingDoc;
  href: string;
  ton?: string;
  variant: "pending" | "weighed";
}) {
  const tags = [doc.category, doc.group, doc.packing].filter(Boolean) as string[];
  return (
    // ลิงก์คลุมทั้งใบด้วย after:inset-0 (ใน CardHead) — ทั้งการ์ดไปหน้าใบชั่ง
    <div className="relative space-y-4 rounded-xl border border-border bg-card p-4 shadow-sm">
      <CardHead code={doc.code} at={doc.createdAt} href={href} />

      <CardBox className="space-y-1 rounded-xl p-2 text-sm">
        <p className="font-semibold">
          {doc.productName}
          {doc.productSub && ` ${doc.productSub}`}
        </p>
        {tags.length > 0 && (
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
            {tags.map((t, i) => (
              <React.Fragment key={t}>
                {i > 0 && <span className="h-4 w-px bg-border" aria-hidden />}
                <span>{t}</span>
              </React.Fragment>
            ))}
          </p>
        )}
        <p className="truncate font-semibold">{doc.supplier}</p>
      </CardBox>

      <dl className="space-y-2 text-sm">
        <CardRow label="ทะเบียนรถ">{doc.plate}</CardRow>
        <CardRow label="วันที่รถจะเข้า">{doc.arriveDate}</CardRow>
        <CardRow label={`${variant === "pending" ? "รอชั่งน้ำหนัก" : "ชั่งน้ำหนัก"} (ตัน)`}>
          {ton ?? "-"}
        </CardRow>
      </dl>
    </div>
  );
}
