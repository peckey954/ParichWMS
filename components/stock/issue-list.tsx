"use client";

import * as React from "react";
import { Separator } from "@peckey954/ui/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@peckey954/ui/components/ui/table";
import {
  ISSUE_STATUS_LABEL,
  formatAmount,
  formatQty,
  isReturn,
  type IssueDoc,
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
  SignedNumber,
  StatusChip,
  TableFrame,
  TablePager,
  paginate,
} from "./doc-parts";

/**
 * ใบขอเบิก / ขอคืน
 * จอกว้าง — ตาราง จอแคบ — การ์ด เหตุผลเดียวกับแท็บรอรับเข้า
 *
 * จ่ายออกเก็บเป็นเลขติดลบ รับคืนเป็นบวก ตัวเลขจึงบอกทิศทางได้เองด้วยสี
 * ไม่ต้องพึ่งป้ายสถานะอย่างเดียว
 */
const PAGE_SIZE = 15;

export function IssueList({ docs }: { docs: IssueDoc[] }) {
  const [page, setPage] = React.useState(1);
  const { pages, safe, slice } = paginate(docs, page, PAGE_SIZE);

  if (docs.length === 0) {
    return (
      <EmptyDocs
        title="ไม่พบใบขอเบิก / ขอคืน"
        hint="ลองใช้คำค้นสั้นลง หรือเลือกประเภทอื่น"
      />
    );
  }

  return (
    <>
      {/* ---------- จอแคบ: การ์ด ---------- */}
      {/* แบ่งหน้าเหมือนฝั่งตาราง ไม่งั้นจอมือถือจะโหลดการ์ดทั้งกองพร้อมกัน */}
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
                <TableHead>บรรจุภัณฑ์</TableHead>
                <TableHead className="text-right">จำนวน</TableHead>
                <TableHead className="text-right">ปริมาณ</TableHead>
                <TableHead>หมายเหตุ</TableHead>
                <TableHead>ผู้ขอทำรายการ</TableHead>
                <TableHead className={HEAD_LAST}>สถานะ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {slice.map((d) => {
                const plus = isReturn(d.status);
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
                    <TableCell>{d.productName}</TableCell>
                    <TableCell>{d.packing ?? "-"}</TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      {d.count === undefined ? (
                        <span className="text-muted-foreground">-</span>
                      ) : (
                        <SignedNumber
                          value={formatQty(d.count)}
                          positive={plus}
                        />
                      )}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <SignedNumber
                        value={formatAmount(d.qty)}
                        suffix={d.unit}
                        positive={plus}
                      />
                    </TableCell>
                    <TableCell className="max-w-40 truncate" title={d.note}>
                      {d.note ?? "-"}
                    </TableCell>
                    <TableCell>
                      <span className="block font-medium">{d.requester}</span>
                      {d.editedBy && (
                        <span className="block text-sm text-muted-foreground">
                          แก้ไขล่าสุด: {d.editedBy}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className={COL_LAST}>
                      <StatusChip
                        status={d.status}
                        label={ISSUE_STATUS_LABEL[d.status]}
                      />
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

function IssueCard({ doc }: { doc: IssueDoc }) {
  const plus = isReturn(doc.status);
  const word = plus ? "ขอคืน" : "ขอเบิก";

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <CardHead code={doc.code} at={doc.createdAt} />

      <CardBox className="mt-3">
        <p className="font-medium">{doc.productName}</p>
      </CardBox>

      <dl className="mt-3 space-y-1.5 text-sm">
        {doc.count !== undefined && (
          <CardRow label={`จำนวน${word}`}>
            <SignedNumber value={formatQty(doc.count)} positive={plus} />
          </CardRow>
        )}
        <CardRow label={`ปริมาณ${word} (${doc.unit})`}>
          <SignedNumber value={formatAmount(doc.qty)} positive={plus} />
        </CardRow>
        {doc.packing && <CardRow label="บรรจุภัณฑ์">{doc.packing}</CardRow>}
        <CardRow label="ผู้ขอทำรายการ">{doc.requester}</CardRow>
        {doc.editedBy && <CardRow label="ผู้แก้ไขล่าสุด">{doc.editedBy}</CardRow>}
        {doc.note && <CardRow label="หมายเหตุ">{doc.note}</CardRow>}
      </dl>

      <Separator className="mt-3" />

      <div className="mt-3 flex items-baseline justify-between gap-3 text-sm">
        <span className="text-muted-foreground">สถานะ:</span>
        <StatusChip
          status={doc.status}
          label={ISSUE_STATUS_LABEL[doc.status]}
        />
      </div>
    </div>
  );
}
