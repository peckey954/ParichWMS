"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRightIcon } from "lucide-react";
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
  formatInboundQty,
  type GoodsInboundDoc,
  type GoodsInboundSource,
} from "@/lib/goods-inbound";
import {
  CardBox,
  CardHead,
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
} from "./doc-parts";

/**
 * ใบรอรับเข้าของสต็อกสินค้า — ตารางของสองแหล่งคอลัมน์ไม่เหมือนกัน
 *   ผลิต     ไลน์ รอบ สูตร สั่งผลิต ปริมาณผลิต
 *   ภายนอก   บริษัท วันที่รถเข้า ทะเบียนรถ
 * ทั้งแถวกดเปิดใบรับเข้า จอแคบเป็นการ์ด
 */
const PAGE_SIZE = 15;

export const goodsInboundHref = (d: GoodsInboundDoc) => `/stock/goods/inbound/${d.id}`;

export function GoodsInboundList({
  docs,
  source,
}: {
  docs: GoodsInboundDoc[];
  source: GoodsInboundSource;
}) {
  const router = useRouter();
  const [page, setPage] = React.useState(1);
  const { pages, safe, slice } = paginate(docs, page, PAGE_SIZE);
  const production = source === "production";

  if (docs.length === 0) {
    return <EmptyDocs title="ไม่มีใบรอรับเข้า" hint="ใบที่รับเข้าครบแล้วย้ายไปอยู่ในประวัติ" />;
  }

  const qty = (d: GoodsInboundDoc) => formatInboundQty(d.qty, d.unit);

  return (
    <>
      {/* ---------- จอแคบ: การ์ด ---------- */}
      <div className="@3xl:hidden">
        <div className="space-y-4">
          {slice.map((d) => (
            <div key={d.id} className="relative rounded-xl border border-border bg-card p-4">
              <CardHead code={d.code} at={d.createdAt} href={goodsInboundHref(d)} />
              <CardBox className="mt-3">
                <p className="font-medium">{d.productName}</p>
                <p className="text-sm text-muted-foreground">
                  {(production ? [d.group, d.packing] : [d.productType, d.group, d.packing]).join(" · ")}
                </p>
              </CardBox>
              <dl className="mt-3 space-y-1.5 text-sm">
                {production ? (
                  <>
                    <CardRow label="ไลน์ผลิต">{`${d.line} · รอบ${d.round}`}</CardRow>
                    <CardRow label={`สั่งผลิต (${d.unit})`}>{formatInboundQty(d.orderQty ?? 0, d.unit)}</CardRow>
                    <CardRow label={`ปริมาณผลิต (${d.unit})`}>
                      {formatInboundQty(d.producedQty ?? 0, d.unit)}
                    </CardRow>
                  </>
                ) : (
                  <>
                    <CardRow label="บริษัท">{d.supplier}</CardRow>
                    <CardRow label="ทะเบียนรถ">{d.truck}</CardRow>
                    <CardRow label="วันที่รถเข้า">{d.arriveDate}</CardRow>
                  </>
                )}
              </dl>
              <Separator className="mt-3" />
              <div className="mt-3 flex items-center justify-between gap-3 text-sm">
                <span>
                  รอรับเข้า{" "}
                  <span className="font-semibold tabular-nums">
                    {qty(d)} {d.unit}
                  </span>
                </span>
                <span className="flex items-center gap-0.5 font-medium text-primary">
                  รับเข้า
                  <ChevronRightIcon className="size-4" />
                </span>
              </div>
            </div>
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
                <TableHead className={HEAD_FIRST}>{production ? "เลขที่ใบผลิต" : "เลขที่ใบสั่งซื้อ"}</TableHead>
                {production ? (
                  <>
                    <TableHead>ไลน์ผลิต</TableHead>
                    <TableHead>รอบ</TableHead>
                    <TableHead>สูตร</TableHead>
                    <TableHead>หมวด</TableHead>
                    <TableHead>บรรจุภัณฑ์</TableHead>
                    <TableHead className="text-right">สั่งผลิต (ตัน)</TableHead>
                    <TableHead className="text-right">ปริมาณผลิต (ตัน)</TableHead>
                  </>
                ) : (
                  <>
                    <TableHead>สินค้า</TableHead>
                    <TableHead>ประเภท</TableHead>
                    <TableHead>หมวด</TableHead>
                    <TableHead className="text-right">บรรจุภัณฑ์</TableHead>
                    <TableHead>บริษัท</TableHead>
                    <TableHead>วันที่รถเข้า</TableHead>
                    <TableHead>ทะเบียนรถ</TableHead>
                  </>
                )}
                <TableHead className={cn(HEAD_LAST, "text-right")}>
                  {production ? "รอรับเข้า (ตัน)" : "รอรับเข้า"}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {slice.map((d) => {
                const href = goodsInboundHref(d);
                return (
                  <TableRow
                    key={d.id}
                    onClick={() => router.push(href)}
                    className={cn("cursor-pointer", ROW_HOVER_NAV)}
                  >
                    <TableCell className={COL_FIRST}>
                      <Link href={href} className="block font-medium whitespace-nowrap hover:underline">
                        {d.code}
                      </Link>
                      <span className="block text-sm whitespace-nowrap text-muted-foreground">{d.createdAt}</span>
                    </TableCell>
                    {production ? (
                      <>
                        <TableCell className="whitespace-nowrap">{d.line}</TableCell>
                        <TableCell>{d.round}</TableCell>
                        <TableCell className="font-medium">{d.productName}</TableCell>
                        <TableCell>{d.group}</TableCell>
                        <TableCell className="whitespace-nowrap">{d.packing}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatInboundQty(d.orderQty ?? 0, d.unit)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatInboundQty(d.producedQty ?? 0, d.unit)}
                        </TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell>{d.productName}</TableCell>
                        <TableCell className="whitespace-nowrap">{d.productType}</TableCell>
                        <TableCell>{d.group}</TableCell>
                        <TableCell className="text-right whitespace-nowrap">{d.packing}</TableCell>
                        <TableCell className="min-w-56">{d.supplier}</TableCell>
                        <TableCell className="whitespace-nowrap">{d.arriveDate}</TableCell>
                        <TableCell className="whitespace-nowrap">{d.truck}</TableCell>
                      </>
                    )}
                    <TableCell className={cn(COL_LAST, "text-right whitespace-nowrap tabular-nums")}>
                      {qty(d)}
                      {!production && ` ${d.unit}`}
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
