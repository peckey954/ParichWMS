"use client";

import * as React from "react";
import { Badge } from "@peckey954/ui/components/ui/badge";
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
  COL_FIRST,
  EmptyDocs,
  HEAD_FIRST,
  STICKY_HEAD,
  TableFrame,
  TablePager,
  paginate,
} from "@/components/stock/doc-parts";
import {
  MOVE_LABEL,
  formatQty,
  formatTon,
  type CwipMove,
  type CwipMoveKind,
  type CwipRequest,
} from "@/lib/packing-list";

/* ------------------------------------------------------------------
   มุมมองที่เป็น "เอกสาร" ของแท็บสต็อก CWIP

   สามชิปนี้ไม่ใช่ยอดคงเหลือ จึงไม่ใช่การ์ดสินค้า > ล็อตแบบชิปสต็อก
   เป็นรายการเอกสารที่ต้องเทียบกันข้ามแถว จอกว้างจึงเป็นตาราง
   จอแคบเป็นการ์ด เพราะแปดคอลัมน์บีบลงจอ 390px แล้วอ่านไม่ออก

   วางแบบเดียวกับการ์ดใบผลิตในแท็บรอผลิต — เลขที่ซ้าย วันเวลาขวา
   กล่องพื้นส้มบอกว่าเอกสารนี้เกี่ยวกับของชิ้นไหน แล้วค่อยเป็นตัวเลข
------------------------------------------------------------------ */

const PAGE_SIZE = 12;

/** ตัวเลขที่ยังไม่ได้ระบุแสดงเป็นขีด ไม่ใช่ 0 — ศูนย์แปลว่ากรอกแล้วว่าไม่มี */
const dash = (v: string | undefined) => v ?? "-";

function usePager<T>(rows: T[]) {
  const [page, setPage] = React.useState(1);
  const key = `${rows.length}`;
  const [lastKey, setLastKey] = React.useState(key);
  if (lastKey !== key) {
    setLastKey(key);
    setPage(1);
  }
  return { ...paginate(rows, page, PAGE_SIZE), setPage };
}

/* ============================ ใบขอเบิก / ใบขอคืน ============================ */

export function CwipRequestList({
  rows,
  codeLabel,
  tonLabel,
  qtyLabel,
  emptyTitle,
}: {
  rows: CwipRequest[];
  codeLabel: string;
  tonLabel: string;
  qtyLabel: string;
  emptyTitle: string;
}) {
  const { pages, safe, slice, setPage } = usePager(rows);

  if (rows.length === 0) {
    return <EmptyDocs title={emptyTitle} hint="ลองใช้คำค้นสั้นลง" />;
  }

  return (
    <>
      {/* ---------- จอแคบ: การ์ด ---------- */}
      <div className="@3xl:hidden">
        <div className="space-y-3">
          {slice.map((d) => (
            <div
              key={d.id}
              className="rounded-xl border border-border bg-card p-4"
            >
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-semibold">{d.code}</span>
                <span className="shrink-0 text-sm text-muted-foreground">
                  {d.createdAt}
                </span>
              </div>

              <div className="mt-3 rounded-lg bg-brand px-3 py-2.5">
                <p className="font-medium">
                  {d.name} {d.sub}
                </p>
                <p className="mt-0.5 text-sm">{d.kind}</p>
              </div>

              <dl className="mt-3 space-y-1.5 text-sm">
                <Line label={tonLabel} value={dash(formatTon(d.ton))} />
                <Line
                  label={qtyLabel}
                  value={d.qty === undefined ? "-" : formatQty(d.qty)}
                />
                <Line label="ผู้ทำรายการ" value={d.staff} />
                {d.editedBy && (
                  <Line label="ผู้แก้ไขล่าสุด" value={d.editedBy} />
                )}
              </dl>
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
                <TableHead className={cn(HEAD_FIRST, "min-w-44")}>
                  {codeLabel}
                </TableHead>
                <TableHead>ประเภทสินค้า</TableHead>
                <TableHead>สินค้า</TableHead>
                <TableHead className="text-right whitespace-nowrap">
                  {tonLabel}
                </TableHead>
                <TableHead className="text-right whitespace-nowrap">
                  {qtyLabel}
                </TableHead>
                <TableHead>ผู้ทำรายการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {slice.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className={COL_FIRST}>
                    <span className="block font-medium whitespace-nowrap">
                      {d.code}
                    </span>
                    <span className="block text-sm text-muted-foreground">
                      {d.createdAt}
                    </span>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{d.kind}</TableCell>
                  <TableCell>
                    <span className="block whitespace-nowrap">{d.name}</span>
                    <span className="block text-sm text-muted-foreground">
                      {d.sub}
                    </span>
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap tabular-nums">
                    {d.ton === undefined ? "-" : `${formatTon(d.ton)} ตัน`}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {d.qty === undefined ? "-" : formatQty(d.qty)}
                  </TableCell>
                  <TableCell>
                    <span className="block whitespace-nowrap">{d.staff}</span>
                    {d.editedBy && (
                      <span className="block text-sm whitespace-nowrap text-muted-foreground">
                        แก้ไขล่าสุด: {d.editedBy}
                      </span>
                    )}
                  </TableCell>
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

/* ================================ ประวัติ ================================ */

// เขียนคลาสเต็มทุกตัว ห้ามประกอบชื่อด้วย template string
const MOVE_CHIP: Record<CwipMoveKind, string> = {
  issue:
    "[--bdg-surface:var(--chip-pink)] [--bdg-text:var(--chip-pink-foreground)]",
  return:
    "[--bdg-surface:var(--chip-blue)] [--bdg-text:var(--chip-blue-foreground)]",
  adjust:
    "[--bdg-surface:var(--chip-yellow)] [--bdg-text:var(--chip-yellow-foreground)]",
  receive:
    "[--bdg-surface:var(--chip-green)] [--bdg-text:var(--chip-green-foreground)]",
  failed:
    "[--bdg-surface:var(--chip-red)] [--bdg-text:var(--chip-red-foreground)]",
};

function MoveChip({ kind }: { kind: CwipMoveKind }) {
  return (
    <Badge
      appearance="soft"
      className={cn("[--bdg-border:transparent] font-semibold", MOVE_CHIP[kind])}
    >
      {MOVE_LABEL[kind]}
    </Badge>
  );
}

/** ของเข้าเป็นเขียว ของออกเป็นแดง อ่านทิศทางได้โดยไม่ต้องดูคอลัมน์สถานะ */
function Delta({ value }: { value?: number }) {
  if (value === undefined) return <>-</>;
  return (
    <span
      className={cn(
        "font-semibold tabular-nums",
        value < 0 ? "text-danger-strong" : "text-success-strong"
      )}
    >
      {value > 0 ? "+" : ""}
      {formatQty(value)}
    </span>
  );
}

export function CwipHistoryList({ rows }: { rows: CwipMove[] }) {
  const { pages, safe, slice, setPage } = usePager(rows);

  if (rows.length === 0) {
    return <EmptyDocs title="ไม่พบประวัติ" hint="ลองใช้คำค้นสั้นลง" />;
  }

  return (
    <>
      {/* ---------- จอแคบ: การ์ด ---------- */}
      <div className="@3xl:hidden">
        <div className="space-y-3">
          {slice.map((m) => (
            <div
              key={m.id}
              className="rounded-xl border border-border bg-card p-4"
            >
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-semibold">{m.code}</span>
                <span className="shrink-0 text-sm text-muted-foreground">
                  {m.createdAt}
                </span>
              </div>

              <div className="mt-3 rounded-lg bg-brand px-3 py-2.5">
                <p className="font-medium">
                  {m.name} {m.sub}
                </p>
                <p className="mt-0.5 text-sm">{m.lot}</p>
              </div>

              <dl className="mt-3 space-y-1.5 text-sm">
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-muted-foreground">จำนวน:</dt>
                  <dd>
                    <Delta value={m.delta} />
                  </dd>
                </div>
                <Line label="ปริมาณ (ตัน)" value={dash(formatTon(m.ton))} />
                <Line label="หมายเหตุ" value={m.note ?? "-"} />
                {m.requestedBy && (
                  <Line label="ผู้ขอทำรายการ" value={m.requestedBy} />
                )}
                <Line label="ผู้ทำรายการ" value={m.staff} />
              </dl>

              <div className="mt-3 flex justify-end border-t border-border pt-3">
                <MoveChip kind={m.kind} />
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
                <TableHead className={cn(HEAD_FIRST, "min-w-44")}>
                  เลขที่ทำรายการ
                </TableHead>
                <TableHead>Lot Number</TableHead>
                <TableHead>สินค้า</TableHead>
                <TableHead className="text-right">จำนวน</TableHead>
                <TableHead className="text-right">ปริมาณ</TableHead>
                <TableHead>หมายเหตุ</TableHead>
                <TableHead>ผู้ขอทำรายการ</TableHead>
                <TableHead>ผู้ทำรายการ</TableHead>
                <TableHead>สถานะ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {slice.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className={COL_FIRST}>
                    <span className="block font-medium whitespace-nowrap">
                      {m.code}
                    </span>
                    <span className="block text-sm text-muted-foreground">
                      {m.createdAt}
                    </span>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{m.lot}</TableCell>
                  <TableCell>
                    <span className="block whitespace-nowrap">{m.name}</span>
                    <span className="block text-sm text-muted-foreground">
                      {m.sub}
                    </span>
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    <Delta value={m.delta} />
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap tabular-nums">
                    {m.ton === undefined ? "-" : `${formatTon(m.ton)} ตัน`}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {m.note ?? "-"}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {m.requestedBy ?? "-"}
                  </TableCell>
                  <TableCell>
                    <span className="block whitespace-nowrap">{m.staff}</span>
                    {m.editedBy && (
                      <span className="block text-sm whitespace-nowrap text-muted-foreground">
                        แก้ไขล่าสุด: {m.editedBy}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <MoveChip kind={m.kind} />
                  </TableCell>
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

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-muted-foreground">{label}:</dt>
      <dd className="text-right font-semibold tabular-nums">{value}</dd>
    </div>
  );
}
