"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronDownIcon } from "lucide-react";
import { Badge } from "@peckey954/ui/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@peckey954/ui/components/ui/dropdown-menu";
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

/** สถานะที่คนหน้างานกดเปลี่ยนเองได้ — อีกสองอันระบบเป็นคนตั้งจากผลตรวจ QC */
const EDITABLE: OrderStage[] = ["waiting", "running"];

/**
 * ป้ายสถานะที่กดเปลี่ยนได้
 *
 * เปลี่ยนได้เฉพาะรอผลิต ↔ กำลังผลิต ซึ่งเป็นสิ่งที่คนคุมไลน์กดเองตอนเริ่มเดินเครื่อง
 * ส่วนรอตรวจสอบ QC กับผลิตเสร็จมาจากผลตรวจ ไม่ใช่สิ่งที่กดเลือกได้เอง
 * จึงคืนเป็นป้ายเฉย ๆ ไม่มีลูกศร คนจะได้ไม่กดแล้วสงสัยว่าทำไมไม่มีอะไรขึ้น
 */
function StageControl({
  stage,
  code,
  onChange,
}: {
  stage: OrderStage;
  code: string;
  onChange?: (next: OrderStage) => void;
}) {
  if (!onChange || !EDITABLE.includes(stage)) return <StageChip stage={stage} />;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`เปลี่ยนสถานะใบผลิต ${code}`}
          // การ์ดทั้งใบมีลิงก์คลุมอยู่ กันไม่ให้การกดปุ่มนี้ลากไปเปิดหน้าใบผลิต
          onClick={(e) => e.preventDefault()}
          className={cn(
            "flex items-center gap-1 rounded-md px-1 py-0.5 transition-colors",
            "hover:bg-accent-hover",
            "focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
          )}
        >
          <StageChip stage={stage} />
          <ChevronDownIcon className="size-4 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup
          value={stage}
          onValueChange={(v) => onChange(v as OrderStage)}
        >
          {EDITABLE.map((s) => (
            <DropdownMenuRadioItem key={s} value={s}>
              {STAGE_LABEL[s]}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function PackingOrders({
  orders,
  emptyTitle,
  onStage,
}: {
  orders: PackingOrder[];
  emptyTitle: string;
  /** ส่งมาเฉพาะแท็บที่แก้สถานะได้ ไม่ส่ง = ป้ายอ่านอย่างเดียว */
  onStage?: (id: string, stage: OrderStage) => void;
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
            <OrderCard
              key={o.id}
              order={o}
              onStage={onStage && ((stage) => onStage(o.id, stage))}
            />
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
                    <StageControl
                      stage={o.stage}
                      code={o.code}
                      onChange={onStage && ((stage) => onStage(o.id, stage))}
                    />
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
function OrderCard({
  order: o,
  onStage,
}: {
  order: PackingOrder;
  onStage?: (stage: OrderStage) => void;
}) {
  // ใบที่ยังไม่ได้ผลิต ยอดผลิตแล้ว/ไม่ผ่าน QC/เข้าคลัง เป็นขีดทั้งแถบ
  // ตัดทิ้งไปเลยดีกว่าโชว์ขีดสามบรรทัด ซึ่งไม่ได้บอกอะไรนอกจาก "ยังไม่มี"
  // การ์ดใบที่ยังไม่เริ่มจึงสั้นลง ไล่ดูรายการยาว ๆ ได้เร็วขึ้น
  const rows = [
    { label: "บรรจุภัณฑ์", value: o.packing },
    { label: "สั่งผลิต (ตัน)", value: formatTon(o.orderedTon) },
    { label: "ผลิตแล้ว (ตัน)", value: formatTon(o.producedTon) },
    { label: "ไม่ผ่าน QC (ตัน)", value: formatTon(o.failedTon), danger: true },
    { label: "เข้าคลัง (ตัน)", value: formatTon(o.storedTon) },
  ].filter((r) => r.value !== "-");

  return (
    // ลิงก์คลุมทั้งใบด้วย after:inset-0 แทนที่จะเอา <a> ครอบเนื้อหา
    // เพราะในการ์ดมีปุ่มเปลี่ยนสถานะอยู่ ปุ่มซ้อนในลิงก์เป็น HTML ที่ผิด
    // และกดแล้วจะลากไปเปิดหน้าใบผลิตแทนที่จะเปิดเมนู
    <div
      className={cn(
        "relative rounded-xl border border-border bg-card p-4",
        "transition-colors hover:bg-accent",
        "focus-within:ring-[3px] focus-within:ring-ring/50"
      )}
    >
      <div className="flex items-baseline justify-between gap-3">
        <Link
          href={`/production/packing/${o.id}`}
          className="font-semibold after:absolute after:inset-0 focus-visible:outline-none"
        >
          {o.code}
        </Link>
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
                r.danger && "text-danger-strong"
              )}
            >
              {r.value}
            </dd>
          </div>
        ))}
      </dl>

      <Separator className="mt-3" />
      {/* z-10 ให้ปุ่มลอยเหนือลิงก์ที่คลุมทั้งใบ ไม่งั้นกดไม่โดน */}
      <div className="relative z-10 mt-3 flex justify-end">
        <StageControl stage={o.stage} code={o.code} onChange={onStage} />
      </div>
    </div>
  );
}
