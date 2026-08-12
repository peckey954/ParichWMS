"use client";

import { ArrowRightIcon } from "lucide-react";
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
  HISTORY_STATUS_LABEL,
  formatAmount,
  formatQty,
  type HistoryRow,
} from "@/lib/general-stock";
import { CardBox, CardHead, CardRow, EmptyDocs, StatusChip } from "./doc-parts";

/** ป้ายโซนแบบเดียวกับในรายการสต็อก */
function Zone({ zone }: { zone: string }) {
  return (
    <span className="rounded-md bg-secondary px-2.5 py-0.5 text-sm font-semibold text-primary">
      {zone}
    </span>
  );
}

/** ย้ายโซนต้องเห็นทั้งต้นทางและปลายทาง */
function ZoneCell({ from, to }: { from?: string; to?: string }) {
  if (!from) return <span className="text-muted-foreground">-</span>;
  if (!to) return <Zone zone={from} />;
  return (
    <span className="flex items-center gap-1.5 whitespace-nowrap">
      <Zone zone={from} />
      <ArrowRightIcon className="size-4 text-muted-foreground" strokeWidth={1.5} />
      <Zone zone={to} />
    </span>
  );
}

/** ตัวเลขที่มีทิศทาง ค่าว่างแสดงขีด */
function Num({
  v,
  suffix,
  tone = true,
}: {
  v?: number;
  suffix?: string;
  tone?: boolean;
}) {
  if (v === undefined) return <span className="text-muted-foreground">-</span>;
  return (
    <span
      className={cn(
        "font-semibold tabular-nums",
        tone && (v < 0 ? "text-danger-strong" : "text-success-solid")
      )}
    >
      {suffix ? formatAmount(v) : formatQty(v)}
      {suffix && <span className="ml-1 font-normal">{suffix}</span>}
    </span>
  );
}

/**
 * ประวัติการทำรายการ
 * จอกว้าง — ตาราง จอแคบ — การ์ด เหมือนอีกสองแท็บ
 *
 * นี่คือ "เหตุการณ์" ไม่ใช่ยอดคงเหลือ จึงไม่มีเรื่องสต็อกต่ำให้กรอง
 */
export function HistoryList({ rows }: { rows: HistoryRow[] }) {
  if (rows.length === 0) {
    return (
      <EmptyDocs
        title="ไม่พบประวัติการทำรายการ"
        hint="ลองใช้คำค้นสั้นลง หรือค้นด้วยเลขล็อต"
      />
    );
  }

  return (
    <>
      {/* ---------- จอแคบ: การ์ด ---------- */}
      <div className="space-y-4 @3xl:hidden">
        {rows.map((r) => (
          <HistoryCard key={r.id} row={r} />
        ))}
      </div>

      {/* ---------- จอกว้าง: ตาราง ---------- */}
      <div className="hidden overflow-hidden rounded-xl border border-border bg-card @3xl:block">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>เลขที่ทำรายการ</TableHead>
                <TableHead>Lot Number</TableHead>
                <TableHead>สินค้า</TableHead>
                <TableHead>บรรจุภัณฑ์</TableHead>
                <TableHead className="text-right">จำนวนขอทำรายการ</TableHead>
                <TableHead className="text-right">จำนวนทำรายการจริง</TableHead>
                <TableHead className="text-right">ปริมาณทำรายการจริง</TableHead>
                <TableHead>โซน</TableHead>
                <TableHead>หมายเหตุ</TableHead>
                <TableHead>สถานะ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <span className="block font-medium whitespace-nowrap">
                      {r.code}
                    </span>
                    <span className="block text-sm whitespace-nowrap text-muted-foreground">
                      {r.createdAt}
                    </span>
                  </TableCell>
                  <TableCell className="max-w-36 truncate" title={r.lotNumber}>
                    {r.lotNumber ?? "-"}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {r.productName}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {r.packing ?? "-"}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    <Num v={r.askedCount} tone={false} />
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    <Num v={r.doneCount} />
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    <Num v={r.doneQty} suffix={r.unit} />
                  </TableCell>
                  <TableCell>
                    <ZoneCell from={r.zone} to={r.zoneTo} />
                  </TableCell>
                  <TableCell className="max-w-40 truncate" title={r.note}>
                    {r.note ?? "-"}
                  </TableCell>
                  <TableCell>
                    <StatusChip
                      status={r.status}
                      label={HISTORY_STATUS_LABEL[r.status]}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </>
  );
}

function HistoryCard({ row: r }: { row: HistoryRow }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <CardHead code={r.code} at={r.createdAt} />

      <CardBox className="mt-3">
        <p className="font-medium">{r.productName}</p>
        {r.lotNumber && <p className="text-sm">{r.lotNumber}</p>}
      </CardBox>

      <dl className="mt-3 space-y-1.5 text-sm">
        {r.askedCount !== undefined && (
          <CardRow label={`จำนวนขอทำรายการ${r.unit ? ` (${r.unit})` : ""}`}>
            <Num v={r.askedCount} tone={false} />
          </CardRow>
        )}
        {r.doneCount !== undefined && (
          <CardRow label={`จำนวนทำรายการจริง${r.unit ? ` (${r.unit})` : ""}`}>
            <Num v={r.doneCount} />
          </CardRow>
        )}
        {r.doneQty !== undefined && (
          <CardRow label={`ปริมาณทำรายการจริง${r.unit ? ` (${r.unit})` : ""}`}>
            <Num v={r.doneQty} />
          </CardRow>
        )}
        {r.packing && <CardRow label="บรรจุภัณฑ์">{r.packing}</CardRow>}
        <CardRow label="ผู้ขอทำรายการ">{r.requester}</CardRow>
        {r.actor && <CardRow label="ผู้ทำรายการ">{r.actor}</CardRow>}
        {r.note && <CardRow label="หมายเหตุ">{r.note}</CardRow>}
        {r.receiverNote && (
          <CardRow label="หมายเหตุผู้รับ">{r.receiverNote}</CardRow>
        )}
      </dl>

      <Separator className="mt-3" />

      <div className="mt-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 text-sm">
        <span className="flex items-center gap-2">
          <span className="text-muted-foreground">โซน:</span>
          <ZoneCell from={r.zone} to={r.zoneTo} />
        </span>
        <span className="flex items-center gap-2">
          <span className="text-muted-foreground">สถานะ:</span>
          <StatusChip
            status={r.status}
            label={HISTORY_STATUS_LABEL[r.status]}
          />
        </span>
      </div>
    </div>
  );
}
