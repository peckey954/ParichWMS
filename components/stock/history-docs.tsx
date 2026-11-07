"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRightIcon } from "lucide-react";
import { Badge } from "@peckey954/ui/components/ui/badge";
import { Button } from "@peckey954/ui/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@peckey954/ui/components/ui/table";
import { cn } from "@peckey954/ui/lib/utils";
import { Crumbs } from "@/components/receiving/parts";
import { StatusChip, TableFrame } from "@/components/stock/doc-parts";
import { GoodsWaitingList } from "@/components/stock/goods-waiting-list";
import { DECIMAL_UNITS, SCOPES } from "@/components/stock/lot-action";
import { stockLogRows, type StockScope } from "@/components/stock/stock-log";
import {
  CATEGORIES,
  HISTORY_ROWS,
  HISTORY_STATUS_LABEL,
  formatAmount,
  formatQty,
  lotPieces,
  type HistoryRow,
  type Lot,
} from "@/lib/general-stock";
import {
  GOODS_CATEGORIES,
  GOODS_HISTORY,
  goodsHistoryHref,
  goodsHistoryStatus,
  goodsRowType,
  historyLines,
  type GoodsHistoryRow,
} from "@/lib/goods-stock";
import type { WaitDoc, WaitKind } from "@/lib/goods-waiting";

/* ------------------------------------------------------------------
   แท็บประวัติ — หนึ่งการ์ดต่อใบ แบบเดียวกับแท็บรอรับเข้า/จ่าย/คืน
   (Figma: สต็อก - ประวัติ) ไม่มีปุ่มท้ายแถว กดเลขที่ใบหรือชื่อสินค้าเพื่อดูรายละเอียด

   ย้าย/ปรับปรุงหลายรายการบันทึกหนึ่งแถวต่อ Lot แต่ใช้เลขที่ใบเดียวกัน
   จึงรวมแถวที่ เลขที่ + เวลา + สถานะ ตรงกัน เป็นใบเดียว

   ย้าย/ปรับปรุงเปิดเป็นหน้าเต็ม (/…/history/<id>) ไม่ใช่กล่องกลางจอแล้ว
   ใบอื่นของสต็อกสินค้าเปิดหน้าใบเดิม ส่วนสต็อกทั่วไปยังไม่มีหน้าใบรับเข้า/จ่าย/คืน
------------------------------------------------------------------ */

const BASE: Record<StockScope, string> = { general: "/stock", goods: "/stock/goods" };
const INITIAL: Record<StockScope, HistoryRow[]> = { general: HISTORY_ROWS, goods: GOODS_HISTORY };

const CATEGORY_LABEL = Object.fromEntries(
  [...CATEGORIES, ...GOODS_CATEGORIES].map((c) => [c.id, c.label])
) as Record<string, string>;

/** หัวคอลัมน์ยอดตามชนิดรายการ */
const AMOUNT_LABEL: Record<HistoryRow["status"], string> = {
  inbound: "รับเข้า",
  issueInternal: "จ่ายออก",
  issueExternal: "จ่ายออก",
  failed: "จ่ายออก",
  returnInternal: "รับคืน",
  returnExternal: "รับคืน",
  returnSweep: "รับคืน",
  move: "ย้าย",
  adjust: "ปรับปรุง",
};

const isLotAction = (r: HistoryRow) => r.status === "move" || r.status === "adjust";

/** แถวที่เป็นใบเดียวกัน */
const docKey = (r: HistoryRow) => `${r.code}|${r.createdAt}|${r.status}`;

function groupRows(rows: HistoryRow[]) {
  const map = new Map<string, HistoryRow[]>();
  for (const r of rows) {
    const k = docKey(r);
    const list = map.get(k);
    if (list) list.push(r);
    else map.set(k, [r]);
  }
  return [...map.values()];
}

function statusOf(scope: StockScope, r: HistoryRow) {
  if (scope === "goods") return goodsHistoryStatus(r as GoodsHistoryRow);
  return { key: r.status, label: HISTORY_STATUS_LABEL[r.status] };
}

function productOf(scope: StockScope, name: string) {
  return SCOPES[scope].products.find((p) => p.name === name);
}

/** แท็กต่อท้ายชื่อสินค้า — ประเภท | หมวด | บรรจุ */
function tagsOf(scope: StockScope, r: HistoryRow) {
  if (scope === "goods") {
    const t = goodsRowType(r as GoodsHistoryRow);
    return [t.productType, t.group, r.packing].filter(Boolean) as string[];
  }
  const p = productOf(scope, r.productName);
  return [p && CATEGORY_LABEL[p.category], r.packing ?? p?.packing].filter(Boolean) as string[];
}

/** Lot ที่อ้างถึงในแถว — ข้อมูลตัวอย่างเก่าบางแถวอ้างเลขที่ไม่มีในสต็อกแล้ว */
function lotOf(scope: StockScope, r: HistoryRow): Lot | undefined {
  if (!r.lotNumber) return undefined;
  const p = productOf(scope, r.productName);
  return (
    p?.lots.find((l) => l.code === r.lotNumber) ??
    SCOPES[scope].products.flatMap((x) => x.lots).find((l) => l.code === r.lotNumber)
  );
}

const fmtOf = (unit: string) => (DECIMAL_UNITS.has(unit) ? formatAmount : formatQty);
const signed = (v: number, fmt: (v: number) => string) => `${v > 0 ? "+" : ""}${fmt(v)}`;

/** ยอดในคลังตอนทำรายการ — ปรับปรุงไม่ได้เปลี่ยนยอดล็อตจริง จึงเป็นยอดก่อนนับ */
function stockOf(scope: StockScope, r: HistoryRow) {
  const lot = lotOf(scope, r);
  if (lot) return { qty: lot.qty, pieces: lotPieces(lot) };
  // ไม่มีล็อตอ้างอิง ใช้ค่าคงที่แบบเดียวกับกล่องเดิม ตัวเลขจะได้ไม่เปลี่ยนทุกครั้งที่เปิด
  const moved = Math.abs(r.doneQty ?? r.doneCount ?? 0);
  return { qty: Math.max(moved, 500), pieces: 500 };
}

export function historyDetailHref(scope: StockScope, r: HistoryRow) {
  if (isLotAction(r)) return `${BASE[scope]}/history/${r.id}`;
  return scope === "goods" ? goodsHistoryHref(r) : undefined;
}

const KIND: Partial<Record<HistoryRow["status"], WaitKind>> = {
  inbound: "inbound",
  returnInternal: "return",
  returnExternal: "return",
  returnSweep: "return",
};

/** แปลงประวัติเป็นใบสำหรับรายการการ์ด */
export function historyDocs(scope: StockScope, rows: HistoryRow[]): WaitDoc[] {
  return groupRows(rows).map((group) => {
    const first = group[0];
    const s = statusOf(scope, first);
    const detailHref = historyDetailHref(scope, first);
    const adjust = first.status === "adjust";
    return {
      id: first.id,
      kind: KIND[first.status] ?? "issue",
      code: first.code,
      createdAt: first.createdAt,
      status: s.key,
      statusLabel: s.label,
      external: false,
      amountLabel: AMOUNT_LABEL[first.status],
      detailHref,
      extra: adjust ? ["ส่วนต่าง"] : undefined,
      items: group.map((r) => {
        const unit = r.unit ?? "ตัน";
        const fmt = fmtOf(unit);
        const diff = r.doneQty ?? 0;
        const amount =
          r.status === "failed"
            ? "-"
            : adjust
              ? fmt(stockOf(scope, r).qty + diff)
              : r.doneQty !== undefined
                ? fmt(Math.abs(r.doneQty))
                : r.doneCount !== undefined || r.askedCount !== undefined
                  ? formatQty(Math.abs(r.doneCount ?? r.askedCount ?? 0))
                  : "-";
        return {
          key: r.id,
          productName: r.productName,
          tags: tagsOf(scope, r),
          sub: r.lotNumber,
          qty: amount,
          unit: r.doneQty === undefined && r.doneCount !== undefined ? "ชิ้น" : unit,
          detailHref,
          extra: adjust
            ? [{ value: signed(diff, fmt), tone: diff > 0 ? "pos" : diff < 0 ? "neg" : undefined }]
            : undefined,
        };
      }),
    };
  });
}

export function HistoryDocList({ scope, rows }: { scope: StockScope; rows: HistoryRow[] }) {
  return (
    <GoodsWaitingList
      docs={historyDocs(scope, rows)}
      empty={{ title: "ไม่พบประวัติการทำรายการ", hint: "ลองใช้คำค้นสั้นลง หรือค้นด้วยเลขที่ทำรายการ" }}
    />
  );
}

/* ------------------------------------------------------------------
   หน้าดูย้าย / ปรับปรุง ที่ทำไปแล้ว (Figma: ดูข้อมูลประวัติ - ปรับปรุงสต็อก)

   ใบเดียว Lot เดียว: การ์ดสินค้ามีเลข Lot กับโซนอยู่ขวา แล้วรายละเอียดเรียงแนวนอน
   หลาย Lot: การ์ดสินค้าเป็นยอดรวม แล้วตาราง Lot เหมือนตอนบันทึก
   อ่านอย่างเดียว ปุ่มเดียวคือย้อนกลับ
------------------------------------------------------------------ */

export function LotHistoryPage({ scope, id }: { scope: StockScope; id: string }) {
  const all = stockLogRows(scope, INITIAL[scope]);
  const row = all.find((r) => r.id === id);
  if (!row || !isLotAction(row)) return <NotFound scope={scope} />;
  const rows = all.filter((r) => docKey(r) === docKey(row));
  return <LotHistorySheet scope={scope} rows={rows} />;
}

function LotHistorySheet({ scope, rows }: { scope: StockScope; rows: HistoryRow[] }) {
  const router = useRouter();
  const home = SCOPES[scope];
  const r0 = rows[0];
  const move = r0.status === "move";
  const title = move ? "ย้ายสต็อก" : "ปรับปรุงสต็อก";
  const s = statusOf(scope, r0);
  const unit = r0.unit ?? "ตัน";
  const decimal = DECIMAL_UNITS.has(unit);
  const pieceUnit = decimal ? "ชิ้น" : unit;
  const fmt = fmtOf(unit);
  const multi = rows.length > 1;

  const lines = rows.map((r) => {
    const stock = stockOf(scope, r);
    const lot = lotOf(scope, r);
    // ไม่มีล็อตในสต็อกแล้ว ใช้วันรับจากข้อมูลจำลองของประวัติแทน
    const line = lot ?? historyLines(r as GoodsHistoryRow, 1)[0];
    const diff = r.doneQty ?? 0;
    return {
      r,
      stock,
      zone: r.zone ?? lot?.zone ?? "-",
      receivedLine: `รับ ${line.receivedAt ?? "-"} (${line.ageDays ?? "-"} วัน)${lot ? ` · ${lot.packNote}` : ""}`,
      amount: move ? Math.abs(r.doneQty ?? 0) : diff,
      pieces: move ? Math.abs(r.doneCount ?? 0) : stock.pieces + (r.doneCount ?? 0),
    };
  });
  const stockTotal = lines.reduce((t, l) => t + l.stock.qty, 0);
  const amountTotal = lines.reduce((t, l) => t + l.amount, 0);
  const piecesTotal = lines.reduce((t, l) => t + l.pieces, 0);
  const amountLabel = move ? `${decimal ? "ปริมาณ" : "จำนวน"}ย้าย (${unit})` : `ส่วนต่าง (${unit})`;
  const stockLabel = `${decimal ? "ปริมาณ" : "จำนวน"}ในคลัง (${unit})`;
  const diffTone = (v: number) => cn(v > 0 && "text-success-strong", v < 0 && "text-danger-strong");
  const actor = r0.actor ?? r0.requester;

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col">
      <main className="@container mx-auto w-full max-w-7xl flex-1 px-4 pt-6 pb-6 sm:px-6">
        <Crumbs trail={[{ label: home.label, href: home.href }, { label: title }]} />

        <h1 className="mt-4 text-2xl font-bold tracking-tight">
          {title} <span className="whitespace-nowrap">{r0.code}</span>
        </h1>
        <p className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          {r0.createdAt}
          <StatusChip status={s.key} label={s.label} />
        </p>

        {/* การ์ดสินค้า — ใบเดียวมีเลข Lot กับโซนอยู่ขวา หลาย Lot มีแค่ยอดรวม */}
        <section className="mt-5 rounded-xl border border-border bg-card p-4">
          <div className="flex flex-col gap-3 @3xl:flex-row @3xl:items-center @3xl:justify-between @3xl:gap-6">
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="font-semibold">{r0.productName}</span>
              {tagsOf(scope, r0).map((t) => (
                <React.Fragment key={t}>
                  <span className="h-3.5 w-px bg-border" aria-hidden />
                  <span className="text-sm">{t}</span>
                </React.Fragment>
              ))}
            </p>
            {!multi && (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-border pt-3 text-sm @3xl:justify-end @3xl:border-0 @3xl:pt-0">
                <span>
                  <span className="mr-2 font-semibold">{r0.lotNumber ?? r0.code}</span>
                  <span className="text-muted-foreground">{lines[0].receivedLine}</span>
                </span>
                <ZoneMove from={lines[0].zone} to={move ? r0.zoneTo : undefined} />
              </div>
            )}
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-6 rounded-xl border border-brand-hover bg-brand px-4 py-5">
            <Stat label={stockLabel}>{fmt(stockTotal)}</Stat>
            <Stat label={amountLabel} className={move ? undefined : diffTone(amountTotal)}>
              {move ? fmt(amountTotal) : signed(amountTotal, fmt)}
            </Stat>
          </dl>
        </section>

        {multi && (
          <>
            {/* ---------- จอกว้าง: ตาราง Lot ---------- */}
            <div className="mt-5 hidden @3xl:block">
              <TableFrame>
                <Table>
                  <TableHeader>
                    <TableRow className="[&>th]:py-2 [&>th]:align-bottom [&>th]:whitespace-pre-line">
                      <TableHead>Lot</TableHead>
                      <TableHead className="w-28">โซน</TableHead>
                      <TableHead className="w-28">บรรจุภัณฑ์</TableHead>
                      <TableHead className="w-32 text-right">{stockLabel.replace(" (", "\n(")}</TableHead>
                      <TableHead className="w-32 text-right">{amountLabel.replace(" (", "\n(")}</TableHead>
                      <TableHead className="w-32 text-right">
                        {move ? `จำนวนย้าย\n(${pieceUnit})` : `นับจำนวนจริง\n(${pieceUnit})`}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lines.map((l) => (
                      <TableRow key={l.r.id}>
                        <TableCell>
                          <span className="block font-medium">{l.r.lotNumber ?? "-"}</span>
                          <span className="block text-sm text-muted-foreground">{l.receivedLine}</span>
                        </TableCell>
                        <TableCell>
                          <ZoneMove from={l.zone} to={move ? l.r.zoneTo : undefined} />
                        </TableCell>
                        <TableCell>{l.r.packing ?? productOf(scope, l.r.productName)?.packing ?? "-"}</TableCell>
                        <TableCell className="text-right tabular-nums">{fmt(l.stock.qty)}</TableCell>
                        <TableCell className={cn("text-right tabular-nums", !move && diffTone(l.amount))}>
                          {move ? fmt(l.amount) : signed(l.amount, fmt)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{formatQty(l.pieces)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableFrame>
            </div>

            {/* ---------- จอแคบ: การ์ดต่อ Lot ---------- */}
            <div className="mt-5 space-y-3 @3xl:hidden">
              {lines.map((l) => (
                <div key={l.r.id} className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-center gap-3">
                    <ZoneMove from={l.zone} to={move ? l.r.zoneTo : undefined} />
                    <span className="min-w-0 flex-1 truncate font-semibold">{l.r.lotNumber ?? "-"}</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{l.receivedLine}</p>
                  <dl className="mt-3 space-y-1.5 border-t border-border pt-3 text-sm">
                    <Row label={`${stockLabel}:`}>{fmt(l.stock.qty)}</Row>
                    <Row label={`${amountLabel}:`} className={move ? undefined : diffTone(l.amount)}>
                      {move ? fmt(l.amount) : signed(l.amount, fmt)}
                    </Row>
                    <Row label={move ? `จำนวนย้าย (${pieceUnit}):` : `นับจำนวนจริง (${pieceUnit}):`}>
                      {formatQty(l.pieces)}
                    </Row>
                  </dl>
                </div>
              ))}
            </div>
          </>
        )}

        {/* รายละเอียดเรียงแนวนอนบนจอกว้าง ซ้อนลงมาบนจอแคบ */}
        <dl className={cn("mt-5 grid gap-5 @3xl:gap-6", move ? "@3xl:grid-cols-4" : "@3xl:grid-cols-3")}>
          {move && <Stat label="โซนที่ต้องการย้าย">{r0.zoneTo ?? "-"}</Stat>}
          <Stat label={move ? `จำนวนที่ต้องการย้าย (${pieceUnit})` : `นับจำนวนจริง (${pieceUnit})`}>
            {formatQty(piecesTotal)}
          </Stat>
          <Stat label={move ? "หมายเหตุ" : "หมายเหตุการปรับปรุง"}>{r0.note ?? "-"}</Stat>
          <Stat label={move ? "ผู้ย้าย" : "ผู้ปรับปรุง"}>{actor}</Stat>
        </dl>
      </main>

      <div className="sticky bottom-0 z-30 border-t border-border bg-surface">
        <div className="mx-auto w-full max-w-7xl px-4 py-3 sm:px-6">
          <Button
            variant="outline-primary"
            className="w-full sm:w-auto"
            onClick={() => (window.history.length > 1 ? router.back() : router.push(home.href))}
          >
            ย้อนกลับ
          </Button>
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className={cn("mt-1 font-semibold break-words tabular-nums", className)}>{children}</dd>
    </div>
  );
}

function Row({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={cn("font-semibold tabular-nums", className)}>{children}</dd>
    </div>
  );
}

/** ป้ายโซน — ย้ายแสดงต้นทาง → ปลายทางในป้ายเดียว */
function ZoneMove({ from, to }: { from: string; to?: string }) {
  return (
    <Badge appearance="soft" className="shrink-0 gap-1.5 whitespace-nowrap">
      {from}
      {to && (
        <>
          <ArrowRightIcon className="size-3.5" />
          {to}
        </>
      )}
    </Badge>
  );
}

function NotFound({ scope }: { scope: StockScope }) {
  const home = SCOPES[scope];
  return (
    <main className="mx-auto w-full max-w-3xl px-4 pt-6 pb-24 sm:px-6">
      <Crumbs trail={[{ label: home.label, href: home.href }, { label: "ไม่พบรายการ" }]} />
      <div className="mt-10 rounded-xl border border-dashed border-border px-6 py-14 text-center">
        <p className="font-medium">ไม่พบรายการนี้</p>
        <p className="mt-1 text-sm text-muted-foreground">ลิงก์อาจไม่ถูกต้อง หรือรายการถูกล้างไปตอนรีเฟรชหน้า</p>
        <Button asChild variant="outline-primary" className="mt-4">
          <Link href={home.href}>กลับไปหน้าสต็อก</Link>
        </Button>
      </div>
    </main>
  );
}
