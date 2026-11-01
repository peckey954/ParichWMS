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
  GOODS_ISSUE_STATUS_LABEL,
  formatCount,
  formatQty,
  goodsDocHref,
  isGoodsReturn,
  type GoodsIssueDoc,
} from "@/lib/goods-issue";
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
  SignedNumber,
  StatusChip,
  TableFrame,
  TablePager,
  paginate,
} from "./doc-parts";

/**
 * ใบขอเบิก / ขอคืน ของสต็อกสินค้า
 * จอกว้าง — ตาราง จอแคบ — การ์ด เหมือนแท็บเดียวกันของสต็อกทั่วไป
 *
 * ใบจ่ายออก (ภายใน/ภายนอก) เปิดหน้าจ่ายสินค้า ใบรับคืนเปิดหน้ารับคืนสินค้า
 * ใบที่ทำไปแล้วหลุดจากแท็บนี้ จึงไม่มีแถวที่กดไม่ได้ค้างอยู่
 */
const PAGE_SIZE = 15;

const hrefOf = goodsDocHref;

export function GoodsIssueList({ docs }: { docs: GoodsIssueDoc[] }) {
  const router = useRouter();
  const [page, setPage] = React.useState(1);
  const { pages, safe, slice } = paginate(docs, page, PAGE_SIZE);

  if (docs.length === 0) {
    return (
      <EmptyDocs title="ไม่พบใบขอเบิก / ขอคืน" hint="ลองใช้คำค้นสั้นลง หรือเลือกประเภทอื่น" />
    );
  }

  return (
    <>
      {/* ---------- จอแคบ: การ์ด ---------- */}
      <div className="@3xl:hidden">
        <div className="space-y-4">
          {slice.map((d) => (
            <IssueCard key={d.id} doc={d} />
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
                <TableHead className={HEAD_FIRST}>เลขที่ขอเบิก</TableHead>
                <TableHead>สินค้า</TableHead>
                <TableHead>ประเภท</TableHead>
                <TableHead>หมวด</TableHead>
                <TableHead className="text-right">บรรจุภัณฑ์</TableHead>
                <TableHead className="text-right">จำนวน</TableHead>
                <TableHead className="text-right">ปริมาณ</TableHead>
                <TableHead>หมายเหตุ</TableHead>
                <TableHead>ผู้ขอทำรายการ</TableHead>
                <TableHead className={HEAD_LAST}>สถานะ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {slice.map((d) => {
                const plus = isGoodsReturn(d.status);
                const href = hrefOf(d);
                return (
                  <TableRow
                    key={d.id}
                    // ทั้งแถวกดได้ ไม่ใช่เฉพาะเลขที่ — ยังเป็น <a> จริงในเซลล์แรก
                    onClick={href ? () => router.push(href) : undefined}
                    className={cn(href ? cn("cursor-pointer", ROW_HOVER_NAV) : "hover:bg-transparent")}
                  >
                    <TableCell className={COL_FIRST}>
                      {href ? (
                        <Link href={href} className="block font-medium whitespace-nowrap hover:underline">
                          {d.code}
                        </Link>
                      ) : (
                        <span className="block font-medium whitespace-nowrap">{d.code}</span>
                      )}
                      <span className="block text-sm whitespace-nowrap text-muted-foreground">{d.createdAt}</span>
                    </TableCell>
                    <TableCell>{d.productName}</TableCell>
                    <TableCell className="whitespace-nowrap">{d.productType}</TableCell>
                    <TableCell>{d.group}</TableCell>
                    <TableCell className="text-right whitespace-nowrap">{d.packing ?? "-"}</TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      {d.count === undefined ? (
                        <span className="text-muted-foreground">-</span>
                      ) : (
                        <SignedNumber value={formatCount(d.count)} positive={plus} />
                      )}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <SignedNumber value={formatQty(d.qty, d.unit)} suffix={d.unit} positive={plus} />
                    </TableCell>
                    <TableCell className="max-w-40 truncate" title={d.note}>
                      {d.note ?? "-"}
                    </TableCell>
                    <TableCell>
                      <span className="block font-medium whitespace-nowrap">{d.requester}</span>
                      {d.editedBy && (
                        <span className="block text-sm whitespace-nowrap text-muted-foreground">
                          แก้ไขล่าสุด: {d.editedBy}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className={COL_LAST}>
                      <StatusChip status={d.status} label={GOODS_ISSUE_STATUS_LABEL[d.status]} />
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

function IssueCard({ doc }: { doc: GoodsIssueDoc }) {
  const plus = isGoodsReturn(doc.status);
  const word = plus ? "ขอคืน" : "ขอเบิก";
  const href = hrefOf(doc);

  return (
    <div className="relative rounded-xl border border-border bg-card p-4">
      <CardHead code={doc.code} at={doc.createdAt} href={href} />

      <CardBox className="mt-3">
        <p className="font-medium">{doc.productName}</p>
        <p className="text-sm text-muted-foreground">
          {[doc.productType, doc.group, doc.packing].filter(Boolean).join(" · ")}
        </p>
      </CardBox>

      <dl className="mt-3 space-y-1.5 text-sm">
        {doc.count !== undefined && (
          <CardRow label={`จำนวน${word}`}>
            <SignedNumber value={formatCount(doc.count)} positive={plus} />
          </CardRow>
        )}
        <CardRow label={`ปริมาณ${word} (${doc.unit})`}>
          <SignedNumber value={formatQty(doc.qty, doc.unit)} positive={plus} />
        </CardRow>
        <CardRow label="ผู้ขอทำรายการ">{doc.requester}</CardRow>
        {doc.editedBy && <CardRow label="ผู้แก้ไขล่าสุด">{doc.editedBy}</CardRow>}
        {doc.note && <CardRow label="หมายเหตุ">{doc.note}</CardRow>}
      </dl>

      <Separator className="mt-3" />

      <div className="mt-3 flex items-center justify-between gap-3 text-sm">
        <StatusChip status={doc.status} label={GOODS_ISSUE_STATUS_LABEL[doc.status]} />
        {href && (
          <span className="flex items-center gap-0.5 font-medium text-primary">
            {plus ? "รับคืนสินค้า" : "จ่ายสินค้า"}
            <ChevronRightIcon className="size-4" />
          </span>
        )}
      </div>
    </div>
  );
}
