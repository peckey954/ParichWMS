"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRightIcon, ChevronRightIcon } from "lucide-react";
import { Button } from "@peckey954/ui/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@peckey954/ui/components/ui/dialog";
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
import { formatAmount, formatQty } from "@/lib/general-stock";
import {
  goodsHistoryHref,
  goodsHistoryStatus,
  goodsRowType,
  historyLines,
  opensAsDialog,
  type GoodsHistoryRow,
} from "@/lib/goods-stock";
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
  StatusChip,
  TableFrame,
  TablePager,
  paginate,
} from "./doc-parts";

/* ------------------------------------------------------------------
   ประวัติของสต็อกสินค้า (Figma "สต็อก - ประวัติ")

   ทุกแถวกดดูรายละเอียดได้ — รับเข้า จ่ายออก รับคืน และจ่ายไม่สำเร็จ
   เปิดเป็นหน้าของใบนั้น ส่วนย้ายกับปรับปรุงเป็นรายการเล็กที่ไม่มีใบ
   เปิดเป็นกล่องกลางจอทับรายการเดิม ปิดแล้วกลับมาที่เดิมทันที
------------------------------------------------------------------ */

const PAGE_SIZE = 15;

function Zone({ zone }: { zone: string }) {
  return (
    <span className="rounded-md bg-secondary px-2.5 py-0.5 text-sm font-semibold text-primary">
      {zone}
    </span>
  );
}

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

/** ตัวเลขมีทิศทาง — เข้าเขียว ออกแดง ค่าว่างเป็นขีด */
function Num({
  v,
  suffix,
  tone = true,
  amount = false,
}: {
  v?: number;
  suffix?: string;
  tone?: boolean;
  amount?: boolean;
}) {
  if (v === undefined) return <span className="text-muted-foreground">-</span>;
  return (
    <span
      className={cn(
        "tabular-nums",
        tone && (v < 0 ? "text-danger-strong" : "text-success-strong")
      )}
    >
      {suffix || amount ? formatAmount(v) : formatQty(v)}
      {suffix && <span className="ml-1">{suffix}</span>}
    </span>
  );
}

function Status({ row }: { row: GoodsHistoryRow }) {
  const s = goodsHistoryStatus(row);
  return <StatusChip status={s.key} label={s.label} />;
}

export function GoodsHistoryList({ rows }: { rows: GoodsHistoryRow[] }) {
  const router = useRouter();
  const [page, setPage] = React.useState(1);
  const [dialogRow, setDialogRow] = React.useState<GoodsHistoryRow | null>(null);
  const { pages, safe, slice } = paginate(rows, page, PAGE_SIZE);

  const open = (r: GoodsHistoryRow) => {
    if (opensAsDialog(r)) setDialogRow(r);
    else router.push(goodsHistoryHref(r));
  };

  if (rows.length === 0) {
    return (
      <EmptyDocs
        title="ไม่พบประวัติการทำรายการ"
        hint="ลองใช้คำค้นสั้นลง หรือค้นด้วยเลขที่ทำรายการ"
      />
    );
  }

  return (
    <>
      {/* ---------- จอแคบ: การ์ด ---------- */}
      <div className="@3xl:hidden">
        <div className="space-y-4">
          {slice.map((r) => (
            <HistoryCard key={r.id} row={r} onOpen={() => setDialogRow(r)} />
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
                <TableHead className={HEAD_FIRST}>เลขที่ทำรายการ</TableHead>
                <TableHead>สินค้า</TableHead>
                <TableHead>ประเภท</TableHead>
                <TableHead>หมวด</TableHead>
                <TableHead className="text-right">บรรจุภัณฑ์</TableHead>
                <TableHead className="text-right">
                  จำนวนขอ
                  <br />
                  ทำรายการ
                </TableHead>
                <TableHead className="text-right">
                  จำนวน
                  <br />
                  ทำรายการจริง
                </TableHead>
                <TableHead className="text-right">
                  ปริมาณ
                  <br />
                  ทำรายการจริง
                </TableHead>
                <TableHead className="text-center">โซน</TableHead>
                <TableHead>หมายเหตุ</TableHead>
                <TableHead>ผู้ขอทำรายการ</TableHead>
                <TableHead>ผู้ทำรายการ</TableHead>
                <TableHead className={HEAD_LAST}>สถานะ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {slice.map((r) => {
                const t = goodsRowType(r);
                return (
                  <TableRow
                    key={r.id}
                    onClick={() => open(r)}
                    className={cn("cursor-pointer", ROW_HOVER_NAV)}
                  >
                    <TableCell className={COL_FIRST}>
                      {/* ลิงก์จริงไว้ให้คลิกขวาเปิดแท็บใหม่ได้ ย้าย/ปรับปรุงไม่มีหน้า จึงเป็นปุ่ม */}
                      {opensAsDialog(r) ? (
                        <span className="block font-medium whitespace-nowrap">{r.code}</span>
                      ) : (
                        <Link
                          href={goodsHistoryHref(r)}
                          onClick={(e) => e.stopPropagation()}
                          className="block font-medium whitespace-nowrap hover:underline"
                        >
                          {r.code}
                        </Link>
                      )}
                      <span className="block text-sm whitespace-nowrap text-muted-foreground">
                        {r.createdAt}
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{r.productName}</TableCell>
                    <TableCell className="whitespace-nowrap">{t.productType}</TableCell>
                    <TableCell className="whitespace-nowrap">{t.group}</TableCell>
                    <TableCell className="text-right whitespace-nowrap">
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
                      <span className="flex justify-center">
                        <ZoneCell from={r.zone} to={r.zoneTo} />
                      </span>
                    </TableCell>
                    <TableCell className="max-w-48 truncate" title={r.note}>
                      {r.note ?? "-"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{r.requester}</TableCell>
                    <TableCell className="whitespace-nowrap">{r.actor ?? "-"}</TableCell>
                    <TableCell className={COL_LAST}>
                      <Status row={r} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          <TablePager page={safe} pages={pages} onChange={setPage} />
        </TableFrame>
      </div>

      <HistoryDialog row={dialogRow} onClose={() => setDialogRow(null)} />
    </>
  );
}

/** คำเรียกจำนวนในการ์ดตามชนิดรายการ — อ่านทีละใบ บอกตรง ๆ เข้าใจเร็วกว่า */
const WORD: Partial<Record<GoodsHistoryRow["status"], string>> = {
  move: "ย้าย",
  adjust: "ปรับปรุง",
  inbound: "รับเข้า",
  returnInternal: "คืน",
  returnExternal: "คืน",
  returnSweep: "คืน",
  issueInternal: "จ่าย",
  issueExternal: "จ่าย",
  failed: "เบิก",
};

function HistoryCard({
  row: r,
  onOpen,
}: {
  row: GoodsHistoryRow;
  onOpen: () => void;
}) {
  const t = goodsRowType(r);
  const word = WORD[r.status] ?? "ทำรายการ";
  const dialog = opensAsDialog(r);

  return (
    <div className="relative rounded-xl border border-border bg-card p-4">
      {dialog ? (
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          {/* ทั้งการ์ดเป็นปุ่มเปิดกล่อง — ขยายพื้นที่กดคลุมการ์ดแบบเดียวกับลิงก์ */}
          <button
            type="button"
            onClick={onOpen}
            className="font-semibold after:absolute after:inset-0 focus-visible:outline-none"
          >
            {r.code}
          </button>
          <span className="text-sm text-muted-foreground">{r.createdAt}</span>
        </div>
      ) : (
        <CardHead code={r.code} at={r.createdAt} href={goodsHistoryHref(r)} />
      )}

      <CardBox className="mt-3">
        <p className="font-semibold">{r.productName}</p>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-sm">
          {[t.productType, t.group, r.packing].filter(Boolean).map((v, i) => (
            <React.Fragment key={i}>
              {i > 0 && <span className="h-3.5 w-px bg-border" aria-hidden />}
              <span>{v}</span>
            </React.Fragment>
          ))}
        </p>
      </CardBox>

      <dl className="mt-3 space-y-1.5 text-sm">
        <CardRow label={`จำนวนขอ${word} (ชิ้น)`}>
          <Num v={r.askedCount} tone={false} />
        </CardRow>
        {r.doneCount !== undefined && (
          <CardRow label={`จำนวน${word} (ชิ้น)`}>
            <Num v={r.doneCount} />
          </CardRow>
        )}
        {r.doneQty !== undefined && (
          <CardRow label={`ปริมาณ${word}${r.unit ? ` (${r.unit})` : ""}`}>
            <Num v={r.doneQty} amount />
          </CardRow>
        )}
        <CardRow label="ผู้ขอทำรายการ">{r.requester}</CardRow>
        <CardRow label="ผู้ทำรายการ">{r.actor ?? "-"}</CardRow>
        {r.note && <CardRow label="หมายเหตุ">{r.note}</CardRow>}
        {r.receiverNote && <CardRow label="หมายเหตุผู้รับ">{r.receiverNote}</CardRow>}
      </dl>

      <Separator className="mt-3" />

      <div className="mt-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 text-sm">
        <span className="flex items-center gap-2">
          <span className="text-muted-foreground">โซน:</span>
          <ZoneCell from={r.zone} to={r.zoneTo} />
        </span>
        <span className="flex items-center gap-1">
          <Status row={r} />
          <ChevronRightIcon className="size-4 text-muted-foreground" />
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------
   กล่องดูย้าย / ปรับปรุง — อ่านอย่างเดียว ปุ่มเดียวคือย้อนกลับ
------------------------------------------------------------------ */

function DialogStat({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className="min-w-0">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={cn("mt-1 font-semibold tabular-nums", className)}>{value}</p>
    </div>
  );
}

function HistoryDialog({
  row,
  onClose,
}: {
  row: GoodsHistoryRow | null;
  onClose: () => void;
}) {
  // จำแถวล่าสุดไว้ระหว่างกล่องกำลังปิด เนื้อหาจะได้ไม่หายวูบก่อนอนิเมชันจบ
  const [last, setLast] = React.useState(row);
  if (row && row !== last) setLast(row);
  const r = row ?? last;

  return (
    <Dialog open={Boolean(row)} onOpenChange={(v) => !v && onClose()}>
      <DialogContent aria-describedby={undefined} className="sm:max-w-lg">
        {r && <DialogBody row={r} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  );
}

function DialogBody({ row: r, onClose }: { row: GoodsHistoryRow; onClose: () => void }) {
  const move = r.status === "move";
  const [line] = historyLines(r, 1);
  const unit = r.unit ?? "ตัน";
  const qty = Math.abs(r.doneQty ?? r.doneCount ?? 0);
  // ปรับปรุงเก็บ "ส่วนต่าง" ไว้ในแถว ยอดในคลังก่อนนับย้อนจากเลขล็อตให้คงที่
  const stock = move ? Math.max(qty, 500) : 500;
  const diff = r.doneQty ?? r.doneCount ?? 0;

  return (
    <>
      <DialogHeader className="text-left">
        <DialogTitle>{move ? "ย้ายสต็อก" : "ปรับปรุงสต็อก"}</DialogTitle>
      </DialogHeader>

      <div className="space-y-4">
        <div>
          <p className="flex flex-wrap items-center gap-2">
            {r.zone && <Zone zone={r.zone} />}
            <span className="font-semibold">
              {r.productName}
              {r.packing && ` (${r.packing})`}
            </span>
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {r.lotNumber ?? r.code} · รับ {line.receivedAt} ({line.ageDays} วัน)
            <span className="ml-3 whitespace-nowrap">
              {move ? "ผู้ย้าย" : "ผู้ปรับปรุง"}: {r.actor ?? r.requester}
            </span>
          </p>
        </div>

        <div
          className={cn(
            "grid gap-4 rounded-xl bg-brand px-4 py-4",
            move ? "grid-cols-2" : "grid-cols-3"
          )}
        >
          <DialogStat label={`ปริมาณในคลัง (${unit})`} value={formatAmount(stock)} />
          {move ? (
            <DialogStat label={`ปริมาณย้าย (${unit})`} value={formatAmount(qty)} />
          ) : (
            <>
              <DialogStat label={`ปริมาณนับจริง (${unit})`} value={formatAmount(stock + diff)} />
              <DialogStat
                label={`ส่วนต่าง (${unit})`}
                value={`${diff > 0 ? "+" : ""}${formatAmount(diff)}`}
                className={diff < 0 ? "text-danger-strong" : "text-success-strong"}
              />
            </>
          )}
        </div>

        <div className={cn("grid gap-4", move && "grid-cols-2")}>
          {move && <DialogStat label="โซนที่ต้องการย้าย" value={r.zoneTo ?? "-"} />}
          <DialogStat label={move ? "หมายเหตุ" : "หมายเหตุการปรับปรุง"} value={r.note ?? "-"} />
        </div>

        <Button variant="outline-primary" className="w-full" onClick={onClose}>
          ย้อนกลับ
        </Button>
      </div>
    </>
  );
}
