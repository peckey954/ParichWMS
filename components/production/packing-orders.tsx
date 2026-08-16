"use client";

import * as React from "react";
import Link from "next/link";
import { Badge } from "@peckey954/ui/components/ui/badge";
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
  COL_FIRST,
  COL_LAST,
  EmptyDocs,
  HEAD_FIRST,
  HEAD_LAST,
  STICKY_HEAD,
  TableFrame,
  TablePager,
  paginate,
} from "@/components/stock/doc-parts";
import {
  STAGE_LABEL,
  formatTon,
  type OrderStage,
  type PackingOrder,
} from "@/lib/packing-list";

/* ------------------------------------------------------------------
   รายการใบผลิต — ใช้ทั้งแท็บรอผลิตและแท็บผลิตแล้ว

   จอกว้างเป็นตาราง เพราะต้องเทียบยอดสั่ง/ผลิตได้/ไม่ผ่าน QC ข้ามแถว
   จอแคบเป็นการ์ด ตารางเจ็ดคอลัมน์บีบลงมือถือแล้วอ่านไม่ออก
------------------------------------------------------------------ */

const PAGE_SIZE = 12;

// เขียนคลาสเต็มทุกตัว ห้ามประกอบชื่อด้วย template string
const STAGE_CHIP: Record<OrderStage, string> = {
  waiting:
    "[--bdg-surface:var(--chip-yellow)] [--bdg-text:var(--chip-yellow-foreground)]",
  running:
    "[--bdg-surface:var(--chip-green)] [--bdg-text:var(--chip-green-foreground)]",
  qc: "[--bdg-surface:var(--chip-orange)] [--bdg-text:var(--chip-orange-foreground)]",
  done: "[--bdg-surface:var(--chip-blue)] [--bdg-text:var(--chip-blue-foreground)]",
};

function StageChip({ stage }: { stage: OrderStage }) {
  return (
    <Badge
      appearance="soft"
      className={cn("[--bdg-border:transparent] font-semibold", STAGE_CHIP[stage])}
    >
      {STAGE_LABEL[stage]}
    </Badge>
  );
}

export function PackingOrders({
  orders,
  emptyTitle,
}: {
  orders: PackingOrder[];
  emptyTitle: string;
}) {
  const [page, setPage] = React.useState(1);

  // เปลี่ยนชุดข้อมูลแล้วกลับหน้าแรก ปรับตอนเรนเดอร์ ไม่ใช้ effect
  const key = `${orders.length}:${orders[0]?.id ?? ""}`;
  const [lastKey, setLastKey] = React.useState(key);
  if (lastKey !== key) {
    setLastKey(key);
    setPage(1);
  }

  const { pages, safe, slice } = paginate(orders, page, PAGE_SIZE);

  if (orders.length === 0) {
    return <EmptyDocs title={emptyTitle} hint="ลองใช้คำค้นสั้นลง" />;
  }

  return (
    <>
      {/* ---------- จอแคบ: การ์ด ---------- */}
      <div className="@3xl:hidden">
        <div className="space-y-3">
          {slice.map((o) => (
            <OrderCard key={o.id} order={o} />
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
                <TableHead className={cn(HEAD_FIRST, "min-w-40")}>
                  เลขที่ใบผลิต
                </TableHead>
                <TableHead>รอบ</TableHead>
                <TableHead>สูตร</TableHead>
                <TableHead>หมวด</TableHead>
                <TableHead>บรรจุภัณฑ์</TableHead>
                <TableHead className="text-right whitespace-nowrap">
                  สั่งผลิต (ตัน)
                </TableHead>
                <TableHead className="text-right whitespace-nowrap">
                  ผลิตแล้ว (ตัน)
                </TableHead>
                <TableHead className="text-right whitespace-nowrap">
                  ไม่ผ่าน QC (ตัน)
                </TableHead>
                <TableHead className="text-right whitespace-nowrap">
                  เข้าคลัง (ตัน)
                </TableHead>
                <TableHead className={HEAD_LAST}>สถานะ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {slice.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className={COL_FIRST}>
                    <Link
                      href={`/production/packing/${o.id}`}
                      className="block font-medium whitespace-nowrap hover:underline"
                    >
                      {o.code}
                    </Link>
                    <span className="block text-sm text-muted-foreground">
                      {o.createdAt}
                    </span>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{o.round}</TableCell>
                  <TableCell className="whitespace-nowrap">{o.formula}</TableCell>
                  <TableCell>{o.kind}</TableCell>
                  <TableCell className="whitespace-nowrap">{o.packing}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatTon(o.orderedTon)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatTon(o.producedTon)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {o.failedTon === undefined ? (
                      "-"
                    ) : (
                      <span className="text-danger-strong">
                        {formatTon(o.failedTon)}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatTon(o.storedTon)}
                  </TableCell>
                  <TableCell className={COL_LAST}>
                    <StageChip stage={o.stage} />
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

/**
 * การ์ดใบผลิตสำหรับจอแคบ
 *
 * สูตรกับรอบ/หมวด อยู่ในกล่องพื้นส้ม แยกจากตัวเลขข้างล่างอย่างชัดเจน
 * เพราะสองส่วนนี้ตอบคนละคำถาม — "ใบนี้ผลิตอะไร" กับ "ไปถึงไหนแล้ว"
 * แบบเดียวกับการ์ดในหน้าสูตรประจำสัปดาห์ ระบบเดียวกันต้องอ่านเหมือนกัน
 *
 * ป้ายสถานะอยู่มุมล่างขวา ไม่มีคำว่า "สถานะ:" นำหน้า
 * ตัวป้ายบอกอยู่แล้วว่าคืออะไร คำนำหน้าเป็นหมึกที่ไม่ได้เพิ่มความหมาย
 */
function OrderCard({ order: o }: { order: PackingOrder }) {
  const rows: { label: string; value: string; danger?: boolean }[] = [
    { label: "บรรจุภัณฑ์", value: o.packing },
    { label: "สั่งผลิต (ตัน)", value: formatTon(o.orderedTon) },
    { label: "ผลิตแล้ว (ตัน)", value: formatTon(o.producedTon) },
    { label: "ไม่ผ่าน QC (ตัน)", value: formatTon(o.failedTon), danger: true },
    { label: "เข้าคลัง (ตัน)", value: formatTon(o.storedTon) },
  ];

  return (
    <Link
      href={`/production/packing/${o.id}`}
      className={cn(
        "block rounded-xl border border-border bg-card p-4",
        "transition-colors hover:bg-accent",
        "focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
      )}
    >
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-semibold">{o.code}</span>
        <span className="shrink-0 text-sm text-muted-foreground">
          {o.createdAt}
        </span>
      </div>

      <div className="mt-3 rounded-lg bg-brand px-3 py-2.5">
        <p className="font-medium">{o.formula}</p>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-sm">
          <span>รอบ{o.round}</span>
          <span>{o.kind}</span>
        </p>
      </div>

      <dl className="mt-3 space-y-1.5 text-sm">
        {rows.map((r) => (
          <div
            key={r.label}
            className="flex items-baseline justify-between gap-3"
          >
            <dt className="text-muted-foreground">{r.label}:</dt>
            <dd
              className={cn(
                "font-semibold tabular-nums",
                r.danger && r.value !== "-" && "text-danger-strong"
              )}
            >
              {r.value}
            </dd>
          </div>
        ))}
      </dl>

      <Separator className="mt-3" />
      <div className="mt-3 flex justify-end">
        <StageChip stage={o.stage} />
      </div>
    </Link>
  );
}
