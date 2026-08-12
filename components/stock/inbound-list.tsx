"use client";

import * as React from "react";
import { Button } from "@peckey954/ui/components/ui/button";
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
  formatQty,
  outstandingQty,
  type InboundDoc,
} from "@/lib/general-stock";
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
} from "./doc-parts";

/**
 * เอกสารรอรับเข้า
 * จอกว้าง — ตาราง เพราะเทียบยอดสั่งซื้อกับยอดรับแล้วข้ามแถวได้ง่าย
 * จอแคบ — การ์ด เพราะตารางสิบคอลัมน์บนมือถือต้องเลื่อนซ้ายขวาตลอด
 *
 * ใช้ container query (@3xl) ไม่ใช่ breakpoint ของหน้าต่าง
 * เพราะกรอบจำลองอุปกรณ์วัดจากความกว้างของกล่อง ไม่ใช่ขนาดจอจริง
 */
const PAGE_SIZE = 8;

export function InboundList({ docs }: { docs: InboundDoc[] }) {
  const [page, setPage] = React.useState(1);
  const { pages, safe, slice } = paginate(docs, page, PAGE_SIZE);

  if (docs.length === 0) {
    return (
      <EmptyDocs title="ไม่พบเอกสารรอรับเข้า" hint="ลองใช้คำค้นสั้นลง" />
    );
  }

  return (
    <>
      {/* ---------- จอแคบ: การ์ด ---------- */}
      <div className="space-y-4 @3xl:hidden">
        {docs.map((d) => (
          <InboundCard key={d.id} doc={d} />
        ))}
      </div>

      {/* ---------- จอกว้าง: ตาราง ---------- */}
      <div className="hidden @3xl:block">
        <TableFrame>
          <Table>
            <TableHeader className={STICKY_HEAD}>
              <TableRow>
                <TableHead className={HEAD_FIRST}>เลขที่ใบสั่งซื้อ</TableHead>
                <TableHead>สินค้า</TableHead>
                <TableHead>บริษัท</TableHead>
                <TableHead>วันที่รถจะเข้าล่าสุด</TableHead>
                <TableHead>ทะเบียนรถที่จะเข้าล่าสุด</TableHead>
                <TableHead>บรรจุภัณฑ์</TableHead>
                <TableHead className="text-right">สั่งซื้อ</TableHead>
                <TableHead className="text-right">รับแล้ว</TableHead>
                <TableHead className={cn(HEAD_LAST, "text-right")}>รับเข้าสินค้า</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {slice.map((d) => {
                const left = outstandingQty(d);
                return (
                  <TableRow key={d.id}>
                    <TableCell className={COL_FIRST}>
                      <span className="block font-medium whitespace-nowrap">
                        {d.code}
                      </span>
                      <span className="block text-sm text-muted-foreground">
                        {d.createdAt}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="block font-medium">{d.productName}</span>
                      {d.productSub && (
                        <span className="block text-sm text-muted-foreground">
                          {d.productSub}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="max-w-56 truncate" title={d.supplier}>
                      {d.supplier}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {d.arriveDate}
                    </TableCell>
                    <TableCell
                      className="max-w-40 truncate text-muted-foreground"
                      title={d.truck}
                    >
                      {d.truck}
                    </TableCell>
                    <TableCell>{d.packing ?? "-"}</TableCell>
                    <TableCell className="text-right whitespace-nowrap tabular-nums">
                      {formatQty(d.orderQty)} {d.orderUnit}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap tabular-nums">
                      {d.receivedQty > 0 ? (
                        <span className="font-semibold">
                          {formatQty(d.receivedQty)} {d.orderUnit}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                      {left > 0 && (
                        <span className="block text-sm text-danger-strong">
                          ค้างรับ {formatQty(left)}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className={cn(COL_LAST, "text-right")}>
                      <Button variant="outline-primary" size="sm">
                        รับเข้า
                      </Button>
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

function InboundCard({ doc }: { doc: InboundDoc }) {
  const left = outstandingQty(doc);
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <CardHead code={doc.code} at={doc.createdAt} />

      <CardBox className="mt-3">
        <p className="font-medium">
          {doc.productName}
          {doc.productSub && ` ${doc.productSub}`}
        </p>
        <p className="text-sm">{doc.supplier}</p>
      </CardBox>

      <CardBox className="mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <span className="font-medium">{doc.truck}</span>
        <span className="text-sm">
          วันที่รถจะเข้า: <span className="font-semibold">{doc.arriveDate}</span>
        </span>
      </CardBox>

      <dl className="mt-3 space-y-1.5 text-sm">
        <CardRow label={`สั่งซื้อ (${doc.orderUnit})`}>
          {formatQty(doc.orderQty)}
        </CardRow>
        {doc.receivedQty > 0 && (
          <CardRow label={`รับแล้ว (${doc.orderUnit})`}>
            {formatQty(doc.receivedQty)}
          </CardRow>
        )}
        {left > 0 && (
          <CardRow label="ค้างรับ" className="text-danger-strong">
            {formatQty(left)} {doc.orderUnit}
          </CardRow>
        )}
        {doc.packing && <CardRow label="บรรจุภัณฑ์">{doc.packing}</CardRow>}
      </dl>

      <Separator className="mt-3" />

      <div className="mt-3 flex justify-end">
        <Button variant="outline-primary" size="sm">
          รับเข้า
        </Button>
      </div>
    </div>
  );
}
