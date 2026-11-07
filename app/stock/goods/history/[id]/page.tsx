"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ChevronDownIcon } from "lucide-react";
import { Button } from "@peckey954/ui/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@peckey954/ui/components/ui/collapsible";
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
import { Crumbs, Meta, Stat } from "@/components/receiving/parts";
import { LotHistoryPage } from "@/components/stock/history-docs";
import { stockLogRows } from "@/components/stock/stock-log";
import {
  CardRow,
  COL_FIRST,
  EmptyDocs,
  HEAD_FIRST,
  STICKY_HEAD,
  StatusChip,
  TableFrame,
  TablePager,
  paginate,
} from "@/components/stock/doc-parts";
import { formatAmount, formatQty } from "@/lib/general-stock";
import {
  GOODS_HISTORY,
  goodsHistoryOf,
  goodsHistoryStatus,
  goodsRowType,
  historyAmounts,
  historyLines,
  historyMeta,
  opensAsDialog,
  type GoodsHistoryRow,
  type HistoryLine,
} from "@/lib/goods-stock";

/* ------------------------------------------------------------------
   ดูประวัติ — รายการที่ทำไปแล้ว (Figma "กรณีกดเข้ามาดูประวัติรายการที่ทำไปแล้ว")

   หน้าเดียวรับทุกชนิดรายการ เลือกหน้าตาตามสถานะของแถว:
     รับเข้า (ผลิต)   → ใบรับเข้าสินค้าผลิต — สลิงที่เข้าคลังจากไลน์
     รับเข้า          → ใบรับเข้าสินค้าภายนอก — สลิงจากรถ/ตู้
     จ่ายออก          → จ่ายสินค้า — Lot ที่หยิบออก
     ไม่สามารถจ่ายได้ → จ่ายสินค้า — ไม่มี Lot มีแต่เหตุผล
     รับคืน           → รับคืนสินค้า — Lot ที่ของกลับเข้าไป

   ทุกหน้าอ่านอย่างเดียว ปุ่มเดียวคือย้อนกลับ หัวใบเป็นโครงเดียวกับหน้า
   จ่ายสินค้า (ชื่อสินค้า กล่องส้มตัวเลข แล้วรายละเอียด) คนที่เพิ่งจ่ายของ
   จึงเปิดดูย้อนหลังแล้วเจอที่เดิมทุกอย่าง
------------------------------------------------------------------ */

const ISSUE = new Set(["issueInternal", "issueExternal"]);
const RETURN = new Set(["returnInternal", "returnExternal", "returnSweep"]);

function crumbOf(r: GoodsHistoryRow) {
  if (r.status === "inbound") return "ใบรับเข้าสินค้า";
  if (RETURN.has(r.status)) return "รับคืนสินค้า";
  return "จ่ายสินค้า";
}

function titleOf(r: GoodsHistoryRow) {
  if (r.status === "inbound")
    return r.source === "production" ? "ใบรับเข้าสินค้าผลิต" : "ใบรับเข้าสินค้าภายนอก";
  if (RETURN.has(r.status)) return "รับคืนสินค้า";
  return "จ่ายสินค้า";
}

export default function GoodsHistoryPage() {
  const { id } = useParams<{ id: string }>();
  // รวมรายการที่เพิ่งบันทึกด้วย ไม่งั้นย้าย/ปรับปรุงที่เพิ่งทำจะเปิดไม่เจอ
  const row = goodsHistoryOf(id, stockLogRows("goods", GOODS_HISTORY) as GoodsHistoryRow[]);
  if (row && opensAsDialog(row)) return <LotHistoryPage scope="goods" id={id} />;
  if (!row) return <NotFound />;
  return <HistorySheet row={row} />;
}

function HistorySheet({ row: r }: { row: GoodsHistoryRow }) {
  const router = useRouter();
  const status = goodsHistoryStatus(r);

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col">
      <main className="@container mx-auto w-full max-w-7xl flex-1 px-4 pt-6 pb-6 sm:px-6">
        <Crumbs
          trail={[{ label: "สต็อกสินค้า", href: "/stock/goods" }, { label: crumbOf(r) }]}
        />

        <h1 className="mt-4 text-2xl font-bold tracking-tight">
          {titleOf(r)} <span className="whitespace-nowrap">{r.code}</span>
        </h1>
        <p className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          {r.createdAt}
          <StatusChip status={status.key} label={status.label} />
        </p>

        {r.status === "inbound" && r.source === "production" && <ProductionInbound row={r} />}
        {r.status === "inbound" && r.source !== "production" && <ExternalInbound row={r} />}
        {ISSUE.has(r.status) && <Issued row={r} />}
        {r.status === "failed" && <Failed row={r} />}
        {RETURN.has(r.status) && <Returned row={r} />}
      </main>

      {/* แถบล่าง — ปุ่มเดียว จอคอมชิดซ้าย มือถือเต็มความกว้าง */}
      <div className="sticky bottom-0 z-30 border-t border-border bg-surface">
        <div className="mx-auto w-full max-w-7xl px-4 py-3 sm:px-6">
          <Button
            variant="outline-primary"
            className="w-full sm:w-auto"
            onClick={() => router.back()}
          >
            ย้อนกลับ
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ หัวใบ ------------------------------ */

/**
 * การ์ดหัวใบ — ชื่อสินค้า | ประเภท | หมวด | บรรจุ ขวาบนคือคู่ค้าหรือไลน์
 * จอแคบหุบรายละเอียดได้ กล่องส้มอยู่นอกส่วนที่หุบเพราะเป็นตัวเลขหลัก
 */
function HeadCard({
  row: r,
  right,
  stats,
  statCols,
  children,
}: {
  row: GoodsHistoryRow;
  right?: React.ReactNode;
  stats: { label: string; value: string }[];
  statCols: string;
  children?: React.ReactNode;
}) {
  const t = goodsRowType(r);
  return (
    <Collapsible defaultOpen className="mt-5 rounded-xl border border-border bg-card px-4 py-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-semibold">{r.productName}</span>
            {[t.productType, t.group, r.packing].filter(Boolean).map((v, i) => (
              <React.Fragment key={i}>
                <span className="h-4 w-px bg-border" aria-hidden />
                <span className="text-sm">{v}</span>
              </React.Fragment>
            ))}
          </p>
          {right && <div className="text-sm font-semibold @3xl:hidden">{right}</div>}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {right && <span className="hidden text-sm font-semibold @3xl:inline">{right}</span>}
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="แสดง/ซ่อนรายละเอียด" className="group -mt-1 -mr-2">
              <ChevronDownIcon className="size-5 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
            </Button>
          </CollapsibleTrigger>
        </div>
      </div>

      <div className={cn("mt-4 grid gap-4 rounded-xl border border-brand-hover bg-brand px-4 py-5", statCols)}>
        {stats.map((s) => (
          <Stat key={s.label} label={s.label} value={s.value} />
        ))}
      </div>

      {children && (
        <CollapsibleContent>
          <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 @3xl:grid-cols-4">{children}</div>
        </CollapsibleContent>
      )}
    </Collapsible>
  );
}

function Zone({ zone }: { zone: string }) {
  return (
    <span className="inline-block rounded-md bg-secondary px-2.5 py-0.5 text-sm font-semibold text-primary">
      {zone}
    </span>
  );
}

const t2 = (v: number) => formatAmount(v);

/* ------------------------------ รับเข้า ------------------------------ */

type SlipTab = "in" | "cancel" | "qc";

/** ชิปสลับรายการสลิง — รับเข้า / ยกเลิก / QC ตรวจสอบ */
function SlipSection({
  lines,
  cancelled,
  external,
}: {
  lines: HistoryLine[];
  cancelled: HistoryLine[];
  external: boolean;
}) {
  const [tab, setTab] = React.useState<SlipTab>("in");
  const chips: { id: SlipTab; label: string }[] = [
    { id: "in", label: `รับเข้า (${lines.length})` },
    { id: "cancel", label: `ยกเลิก (${cancelled.length})` },
    { id: "qc", label: "QC ตรวจสอบ" },
  ];
  const rows = tab === "in" ? lines : cancelled;

  return (
    <>
      <div role="tablist" className="mt-6 flex flex-wrap items-center gap-2">
        {chips.map((c) => (
          <button
            key={c.id}
            type="button"
            role="tab"
            aria-selected={tab === c.id}
            onClick={() => setTab(c.id)}
            className={cn(
              "rounded-full border px-3 py-1 text-sm whitespace-nowrap transition-colors",
              tab === c.id
                ? "border-primary bg-brand font-medium text-primary"
                : "border-border hover:bg-accent-hover"
            )}
          >
            {c.label}
          </button>
        ))}
      </div>

      {tab === "qc" ? (
        <div className="mt-4">
          <EmptyDocs title="ยังไม่มีผล QC ของใบนี้" hint="ผลตรวจจะขึ้นที่นี่เมื่อ QC บันทึกแล้ว" />
        </div>
      ) : (
        <>
          <h2 className="mt-5 font-semibold">
            {tab === "in" ? "รับเข้าสินค้าต่อสลิง" : "สลิงที่ยกเลิก"}
          </h2>
          <div className="mt-3">
            {rows.length === 0 ? (
              <EmptyDocs title="ไม่มีสลิงที่ยกเลิก" hint="ทุกสลิงของใบนี้เข้าคลังครบ" />
            ) : (
              <SlipTable rows={rows} external={external} />
            )}
          </div>
        </>
      )}
    </>
  );
}

function SlipTable({ rows, external }: { rows: HistoryLine[]; external: boolean }) {
  const [page, setPage] = React.useState(1);
  const { pages, safe, slice } = paginate(rows, page, 10);
  return (
    <>
      {/* จอแคบ: การ์ดต่อสลิง */}
      <div className="space-y-3 @3xl:hidden">
        {slice.map((l) => (
          <div key={l.id} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2">
              <Zone zone={l.zone} />
              <span className="font-semibold">{l.code}</span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{l.at}</p>
            <Separator className="my-3" />
            <dl className="space-y-1.5 text-sm">
              {external && <CardRow label="เบอร์ตู้คอนเทนเนอร์">{l.container}</CardRow>}
              {external && <CardRow label="บรรจุภัณฑ์">{l.packing}</CardRow>}
              <CardRow label="ปริมาณรับเข้า (ตัน)">{t2(l.tons)}</CardRow>
              <CardRow label="จำนวนรับเข้า (ชิ้น)">{formatQty(l.pieces)}</CardRow>
            </dl>
          </div>
        ))}
        <TablePager page={safe} pages={pages} onChange={setPage} />
      </div>

      <div className="hidden @3xl:block">
        <TableFrame>
          <Table>
            <TableHeader className={STICKY_HEAD}>
              <TableRow>
                <TableHead className={HEAD_FIRST}>เลขที่รับสินค้า</TableHead>
                {external && <TableHead>เบอร์ตู้คอนเทนเนอร์</TableHead>}
                <TableHead>โซน</TableHead>
                {external && <TableHead>บรรจุภัณฑ์</TableHead>}
                <TableHead className="text-right">ปริมาณรับเข้าต่อสลิง (ตัน)</TableHead>
                <TableHead className="text-right">จำนวนรับเข้าต่อสลิง (ชิ้น)</TableHead>
                <TableHead>หมายเหตุ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {slice.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className={COL_FIRST}>
                    <span className="block font-medium whitespace-nowrap">{l.code}</span>
                    <span className="block text-sm whitespace-nowrap text-muted-foreground">{l.at}</span>
                  </TableCell>
                  {external && <TableCell>{l.container}</TableCell>}
                  <TableCell>
                    <Zone zone={l.zone} />
                  </TableCell>
                  {external && <TableCell className="whitespace-nowrap">{l.packing}</TableCell>}
                  <TableCell className="text-right tabular-nums">{t2(l.tons)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatQty(l.pieces)}</TableCell>
                  <TableCell>-</TableCell>
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

function ProductionInbound({ row: r }: { row: GoodsHistoryRow }) {
  const { pieces, tons } = historyAmounts(r);
  const m = historyMeta(r);
  const lines = historyLines(r, 6);
  const cancelled = historyLines({ ...r, id: `${r.id}-x`, doneQty: tons / 10, doneCount: 20 }, m.cancelled);
  return (
    <>
      <HeadCard
        row={r}
        right={
          <>
            ไลน์ {m.line} <span className="ml-1 font-normal text-muted-foreground">รอบ:</span> ปกติ
          </>
        }
        statCols="grid-cols-2 @3xl:grid-cols-4"
        stats={[
          { label: "สั่งผลิต (ตัน)", value: t2(tons) },
          { label: "ปริมาณผลิต (ตัน)", value: t2(tons) },
          { label: "เข้าคลัง (ชิ้น)", value: formatQty(pieces) },
          { label: "เข้าคลัง (ตัน)", value: t2(tons) },
        ]}
      >
        <Meta label="ผู้สั่งผลิต" value={r.requester} />
        <Meta label="ผู้แก้ไขสั่งผลิตล่าสุด" value="-" />
        <Meta label="ผู้ผลิต" value={r.actor ?? r.requester} />
        <Meta label="ผู้แก้ไขผลิตล่าสุด" value="-" />
      </HeadCard>
      <SlipSection lines={lines} cancelled={cancelled} external={false} />
    </>
  );
}

function ExternalInbound({ row: r }: { row: GoodsHistoryRow }) {
  const { pieces, tons } = historyAmounts(r);
  const m = historyMeta(r);
  const lines = historyLines(r, 6);
  const cancelled = historyLines({ ...r, id: `${r.id}-x`, doneQty: tons / 10, doneCount: 20 }, m.cancelled);
  return (
    <>
      <HeadCard
        row={r}
        right={m.customer}
        statCols="grid-cols-2 @3xl:grid-cols-4"
        stats={[
          { label: "รับเข้า (ตัน)", value: t2(tons) },
          { label: "รับเข้า (ชิ้น)", value: formatQty(pieces) },
          { label: "ไม่ผ่าน (ตัน)", value: "-" },
          { label: "เข้าคลัง (ตัน)", value: t2(tons) },
        ]}
      >
        <Meta label="ทะเบียนรถ" value={m.truck} />
        <Meta label="วันที่รถจะเข้า" value={m.arriveDate} />
        <Meta label="รอรับเข้า (ตัน)" value="-" />
        <Meta label="หมายเหตุจากผู้สั่งซื้อ" value="-" />
        <Meta label="เลขที่ใบขอซื้อ" value={m.prNo} />
        <Meta label="PRQ Unique ID" value={m.uniqueId} />
        <Meta label="ผู้ทำใบขอซื้อ" value={r.requester} />
        <Meta label="ผู้แก้ไขขอซื้อล่าสุด" value="-" />
        <Meta label="ผู้ทำใบสั่งซื้อ" value={r.actor ?? r.requester} />
        <Meta label="ผู้แก้ไขสั่งซื้อล่าสุด" value="-" />
        <Meta label="เหตุผลการซื้อ" value="ผลิต" />
        <Meta label="ช่วงวันที่รถส่งสินค้า" value={`${m.arriveDate} - ยังไม่ระบุ`} />
      </HeadCard>
      <SlipSection lines={lines} cancelled={cancelled} external />
    </>
  );
}

/* ------------------------------ จ่ายออก ------------------------------ */

function Issued({ row: r }: { row: GoodsHistoryRow }) {
  const { tons } = historyAmounts(r);
  const m = historyMeta(r);
  const lines = historyLines(r, 2);
  const internal = r.status === "issueInternal";
  return (
    <>
      <HeadCard
        row={r}
        right={internal ? "ไลน์ผลิต 2" : m.customer}
        statCols="grid-cols-2"
        stats={[
          { label: "ปริมาณขอเบิก (ตัน)", value: t2(tons) },
          { label: "รวมจ่ายออก (ตัน)", value: t2(tons) },
        ]}
      >
        <Meta label="ผู้จ่าย" value={r.actor ?? "-"} />
        <Meta label="ทะเบียนรถ" value={internal ? "-" : m.truck} />
        <Meta label="วันที่รถจะเข้า" value={m.arriveDate} />
        <Meta label="ผู้ขอเบิก" value={r.requester} />
        <Meta label="ผู้แก้ไขขอเบิกล่าสุด" value={r.requester} />
        <Meta label="วันที่ขอเบิก" value={r.createdAt} />
        <Meta label="หมายเหตุจากผู้ขอเบิก" value={r.note ?? "-"} />
      </HeadCard>

      <div className="mt-4">
        <LotTable
          lines={lines}
          cols={[
            { label: "ปริมาณจ่าย (ตัน)", get: (l) => t2(l.tons) },
            { label: "จำนวนจ่าย (ชิ้น)", get: (l) => formatQty(l.pieces) },
          ]}
          zoneFirst
        />
      </div>
    </>
  );
}

function Failed({ row: r }: { row: GoodsHistoryRow }) {
  const { tons } = historyAmounts(r);
  return (
    <>
      <HeadCard
        row={r}
        statCols="grid-cols-2"
        stats={[
          { label: "ขอเบิก (ตัน)", value: t2(tons) },
          { label: "รวมจ่ายออก (ตัน)", value: "-" },
        ]}
      >
        <Meta label="ผู้จ่าย" value={ACTOR_FALLBACK} />
        <Meta label="ผู้ขอเบิก" value={r.requester} />
        <Meta label="ผู้แก้ไขขอเบิกล่าสุด" value="-" />
        <Meta label="วันที่ขอเบิก" value={r.createdAt} />
      </HeadCard>

      <div className="mt-5 grid grid-cols-2 gap-4">
        <Meta label="สถานะการจ่าย" value="ไม่สามารถจ่ายได้" />
        <Meta label="หมายเหตุ" value={r.receiverNote ?? "-"} />
      </div>
    </>
  );
}

const ACTOR_FALLBACK = "อลิสา พรสุขสิริ";

/* ------------------------------ รับคืน ------------------------------ */

function Returned({ row: r }: { row: GoodsHistoryRow }) {
  const { tons, pieces } = historyAmounts(r);
  const lines = historyLines(r, 2);
  const per = pieces > 0 ? tons / pieces : 0;
  return (
    <>
      <HeadCard
        row={r}
        statCols="grid-cols-2 @3xl:grid-cols-3"
        stats={[
          { label: "ปริมาณขอคืน (ตัน)", value: t2(tons) },
          {
            label: "ปริมาณคืนเฉลี่ย (ตัน)",
            value: `${formatQty(Math.round(per * 100) / 100)} ตัน/ชิ้น · ${formatQty(pieces)} ชิ้น`,
          },
          { label: "ปริมาณคืน (ตัน)", value: t2(tons) },
        ]}
      >
        <Meta label="ผู้รับ" value={r.actor ?? "-"} />
        <Meta label="ผู้ขอคืน" value={r.requester} />
        <Meta label="ผู้แก้ไขขอคืนล่าสุด" value="-" />
        <Meta label="หมายเหตุผู้ขอคืน" value={r.note ?? "-"} />
      </HeadCard>

      <div className="mt-4">
        <LotTable
          lines={lines}
          cols={[
            { label: "ปริมาณขอคืน (ตัน)", get: (l) => t2(l.tons) },
            { label: "จำนวนขอคืน (ชิ้น)", get: (l) => formatQty(l.pieces) },
            { label: "ปริมาณคืน (ตัน)", get: (l) => t2(l.tons) },
            { label: "จำนวนคืน (ชิ้น)", get: (l) => formatQty(l.pieces) },
          ]}
        />
      </div>

      <div className="mt-5">
        <Meta label="หมายเหตุ" value={r.receiverNote ?? "-"} />
      </div>
    </>
  );
}

/* ------------------------------ ตาราง Lot ------------------------------ */

type LotCol = { label: string; get: (l: HistoryLine) => string };

/**
 * Lot ที่หยิบออก/คืนเข้า — จอกว้างเป็นตาราง จอแคบเป็นการ์ดต่อ Lot
 * จ่ายออกวางโซนไว้หน้าสุด (หยิบตามโซน) รับคืนวางโซนท้ายสุด (ของกลับไปที่ไหน)
 */
function LotTable({
  lines,
  cols,
  zoneFirst = false,
}: {
  lines: HistoryLine[];
  cols: LotCol[];
  zoneFirst?: boolean;
}) {
  const lotCell = (l: HistoryLine) => (
    <>
      <span className="block font-medium whitespace-nowrap">{l.code}</span>
      <span className="block text-sm whitespace-nowrap text-muted-foreground">
        รับ {l.receivedAt} ({l.ageDays} วัน)
        {zoneFirst && ` · ${formatQty(l.pieces)} ชิ้น`}
      </span>
    </>
  );

  return (
    <>
      <div className="space-y-3 @3xl:hidden">
        {lines.map((l) => (
          <div key={l.id} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2">
              <Zone zone={l.zone} />
              <span className="font-semibold">{l.code}</span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              รับ {l.receivedAt} ({l.ageDays} วัน)
            </p>
            <Separator className="my-3" />
            <dl className="space-y-1.5 text-sm">
              {cols.map((c) => (
                <CardRow key={c.label} label={c.label}>
                  {c.get(l)}
                </CardRow>
              ))}
            </dl>
          </div>
        ))}
      </div>

      <div className="hidden @3xl:block">
        <TableFrame>
          <Table>
            <TableHeader>
              <TableRow>
                {zoneFirst && <TableHead className="w-24">โซน</TableHead>}
                <TableHead>Lot</TableHead>
                {cols.map((c) => (
                  <TableHead key={c.label} className="text-right">
                    {c.label}
                  </TableHead>
                ))}
                {!zoneFirst && <TableHead>โซน</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {lines.map((l) => (
                <TableRow key={l.id}>
                  {zoneFirst && (
                    <TableCell>
                      <Zone zone={l.zone} />
                    </TableCell>
                  )}
                  <TableCell>{lotCell(l)}</TableCell>
                  {cols.map((c) => (
                    <TableCell key={c.label} className="text-right tabular-nums">
                      {c.get(l)}
                    </TableCell>
                  ))}
                  {!zoneFirst && (
                    <TableCell>
                      <Zone zone={l.zone} />
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableFrame>
      </div>
    </>
  );
}

function NotFound() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 pt-6 pb-24 sm:px-6">
      <Crumbs trail={[{ label: "สต็อกสินค้า", href: "/stock/goods" }, { label: "ประวัติ" }]} />
      <div className="mt-10 rounded-xl border border-dashed border-border px-6 py-14 text-center">
        <p className="font-medium">ไม่พบรายการนี้</p>
        <p className="mt-1 text-sm text-muted-foreground">
          ย้าย/ปรับปรุงดูได้จากแท็บประวัติในหน้าสต็อกสินค้า
        </p>
        <Button asChild variant="outline-primary" className="mt-4">
          <Link href="/stock/goods">กลับไปหน้าสต็อกสินค้า</Link>
        </Button>
      </div>
    </main>
  );
}
