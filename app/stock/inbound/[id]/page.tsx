"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ChevronDownIcon, PlusIcon } from "lucide-react";
import { Badge } from "@peckey954/ui/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@peckey954/ui/components/ui/breadcrumb";
import { Button } from "@peckey954/ui/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@peckey954/ui/components/ui/collapsible";
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
  CardBox,
  CardHead,
  CardRow,
  COL_FIRST,
  COL_LAST,
  HEAD_FIRST,
  HEAD_LAST,
  STICKY_HEAD,
  TableFrame,
} from "@/components/stock/doc-parts";
import {
  getInboundReceipt,
  outstandingQty,
  INBOUND_ROUND_STATUS_LABEL,
  QC_RESULT_LABEL,
  formatQty,
  type InboundRound,
  type InboundRoundStatus,
  type QcResult,
} from "@/lib/general-stock";

/* ------------------------------------------------------------------
   ใบรับเข้าสต็อกทั่วไป — เข้ามาจากปุ่ม "รับเข้า" บนการ์ด/ตารางแท็บรอรับเข้า

   ข้อมูลใบสั่ง (ประเภทสินค้า/ผู้ทำใบ/เหตุผลซื้อ) พับเก็บได้เพราะดูอ้างอิง
   ไม่ใช่งานหลักของหน้านี้ — งานหลักคือตาราง "รอบการรับเข้าสินค้า" ข้างล่าง
   สรุปยอดสี่ช่อง (สั่งซื้อ/รับเข้า/ไม่ผ่าน/เข้าคลัง) อยู่นอกส่วนที่พับ
   เพราะเป็นตัวเลขอ้างอิงที่ต้องเทียบกับตารางรอบตลอด เหมือนกับยอดสั่งผลิต
   ในหน้าใบผลิต — ให้เห็นได้แม้การ์ดยังหุบอยู่
------------------------------------------------------------------ */

const QC_CHIP: Record<QcResult, string> = {
  accepted:
    "[--bdg-surface:var(--chip-blue)] [--bdg-text:var(--chip-blue-foreground)]",
  repack:
    "[--bdg-surface:var(--chip-purple)] [--bdg-text:var(--chip-purple-foreground)]",
  passed:
    "[--bdg-surface:var(--chip-green)] [--bdg-text:var(--chip-green-foreground)]",
  returned:
    "[--bdg-surface:var(--chip-red)] [--bdg-text:var(--chip-red-foreground)]",
};

function QcChip({ result }: { result: QcResult }) {
  return (
    <Badge
      appearance="soft"
      className={cn(
        "[--bdg-border:transparent] font-semibold whitespace-nowrap",
        QC_CHIP[result]
      )}
    >
      {QC_RESULT_LABEL[result]}
    </Badge>
  );
}

const ROUND_STATUS_CHIP: Record<InboundRoundStatus, string> = {
  waitingTruck:
    "[--bdg-surface:var(--chip-yellow)] [--bdg-text:var(--chip-yellow-foreground)]",
  waitingQc:
    "[--bdg-surface:var(--chip-orange)] [--bdg-text:var(--chip-orange-foreground)]",
  stocked:
    "[--bdg-surface:var(--chip-green)] [--bdg-text:var(--chip-green-foreground)]",
  returned:
    "[--bdg-surface:var(--chip-red)] [--bdg-text:var(--chip-red-foreground)]",
};

function RoundStatusChip({ status }: { status: InboundRoundStatus }) {
  return (
    <Badge
      appearance="soft"
      className={cn(
        "[--bdg-border:transparent] font-semibold whitespace-nowrap",
        ROUND_STATUS_CHIP[status]
      )}
    >
      {INBOUND_ROUND_STATUS_LABEL[status]}
    </Badge>
  );
}

export default function InboundReceiptPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const receipt = React.useMemo(
    () => getInboundReceipt(params.id),
    [params.id]
  );
  const rounds = receipt?.rounds ?? [];

  if (!receipt) {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 pt-6 pb-24 sm:px-6">
        <Crumbs />
        <div className="mt-10 rounded-xl border border-dashed border-border px-6 py-14 text-center">
          <p className="font-medium">ไม่พบใบรับเข้านี้</p>
          <p className="mt-1 text-sm text-muted-foreground">
            เอกสารอาจถูกลบหรือลิงก์ไม่ถูกต้อง
          </p>
          <Button asChild variant="outline-primary" className="mt-4">
            <Link href="/stock">กลับไปหน้าสต็อกทั่วไป</Link>
          </Button>
        </div>
      </main>
    );
  }

  const { doc, meta } = receipt;
  const left = outstandingQty(doc);
  // ยอดไม่ผ่าน/เข้าคลังอิงจากตาราง rounds จริง ไม่ใช่ค่านิ่งตอนสร้างข้อมูล
  // เผื่อเพิ่มรอบใหม่แล้วยอดต้องขยับตาม
  const rejectedQty = rounds.reduce((sum, r) => sum + (r.rejectedQty ?? 0), 0);
  const stockedQty = rounds.reduce((sum, r) => sum + (r.stockedQty ?? 0), 0);

  return (
    // เนื้อหาสั้นกว่าจอได้ (ใบที่ยังไม่มีรอบรับเข้าเลย) — ถ้าไม่กำหนดความสูง
    // ขั้นต่ำ ปุ่มย้อนกลับ (sticky bottom-0) จะลอยอยู่ใต้เนื้อหาแทนติดขอบล่าง
    // จอจริง ให้ flex-1 ใน main ดันปุ่มลงไปสุดความสูงขั้นต่ำนี้แทนเสมอ
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col">
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-6 pb-6 sm:px-6">
        <Crumbs />

        <h1 className="mt-4 text-2xl font-semibold tracking-tight">
          ใบรับเข้าสต็อกทั่วไป {doc.code}
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">{doc.createdAt}</p>

        {/* หุบไว้ก่อนเสมอ — เห็นแค่สรุปยอดก็พอตอบคำถามหลักได้แล้ว กดขยายค่อยเห็น
            รายละเอียดใบสั่งซื้อ */}
        <Collapsible className="mt-5 rounded-xl border border-border bg-card">
          <CollapsibleTrigger asChild>
            {/* items-start กันปุ่มหุบไหลตามเนื้อหาที่ห่อบรรทัด — ปักไว้ชิดขวาบนเสมอ */}
            <button
              type="button"
              className="group flex w-full items-start justify-between gap-3 px-4 pt-4 pb-3 text-left"
            >
              <span className="flex min-w-0 flex-1 flex-col gap-y-1">
                <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="font-medium">{doc.productName}</span>
                  {doc.productSub && (
                    <span className="text-sm text-muted-foreground">
                      {doc.productSub}
                    </span>
                  )}
                  {doc.packing && (
                    <>
                      <span className="hidden text-border @2xl:inline" aria-hidden>
                        |
                      </span>
                      <span className="text-sm">{doc.packing}</span>
                    </>
                  )}
                </span>
                <span className="text-sm font-medium">{doc.supplier}</span>
              </span>
              <ChevronDownIcon className="mt-0.5 size-5 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
            </button>
          </CollapsibleTrigger>

          {/* อยู่นอกส่วนที่หุบ — สี่ยอดนี้คือตัวเลขอ้างอิงที่ต้องเทียบกับตารางรอบตลอดทั้งหน้า */}
          <div className="px-4 pb-4">
            <div className="grid grid-cols-2 gap-4 rounded-lg bg-brand p-4 @xl:grid-cols-4">
              <SummaryStat
                label={`สั่งซื้อ (${doc.orderUnit})`}
                value={formatQty(doc.orderQty)}
              />
              <SummaryStat
                label={`รับเข้า (${doc.orderUnit})`}
                value={formatQty(doc.receivedQty)}
                note={left > 0 ? `ค้างรับ ${formatQty(left)}` : undefined}
              />
              <SummaryStat
                label={`ไม่ผ่าน (${doc.orderUnit})`}
                value={rejectedQty > 0 ? `-${formatQty(rejectedQty)}` : formatQty(0)}
                valueClassName={rejectedQty > 0 ? "text-danger-strong" : undefined}
              />
              <SummaryStat
                label={`เข้าคลัง (${doc.orderUnit})`}
                value={formatQty(stockedQty)}
              />
            </div>
          </div>

          <CollapsibleContent className="px-4 pb-4">
            <div className="grid grid-cols-2 gap-3 text-sm @2xl:grid-cols-4">
              <MetaField label="เลขที่ใบขอซื้อ" value={meta.prCode} />
              <MetaField label="PRQ Unique ID" value={meta.prqId} />
              <MetaField label="ผู้ทำใบขอซื้อ" value={meta.prMaker} />
              <MetaField label="ผู้แก้ไขขอซื้อล่าสุด" value={meta.prEditor ?? "-"} />
              <MetaField label="ผู้ทำใบสั่งซื้อ" value={meta.poMaker} />
              <MetaField label="ผู้แก้ไขสั่งซื้อล่าสุด" value={meta.poEditor ?? "-"} />
              <MetaField label="เหตุผลการซื้อ" value={meta.reason} />
              <MetaField
                label="ช่วงวันที่จัดส่ง"
                value={`${meta.deliveryFrom} - ยังไม่ระบุ`}
              />
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* ---------- รอบการรับเข้าสินค้า ---------- */}
        <div className="mt-8 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">รอบการรับเข้าสินค้า</h2>
          <Button
            asChild
            variant="outline"
            className="border-primary text-primary hover:text-primary"
          >
            <Link href={`/stock/inbound/${doc.id}/add`}>
              <PlusIcon />
              เพิ่มการรับเข้าสินค้า
            </Link>
          </Button>
        </div>

        {/* ---------- จอแคบ: การ์ดต่อรอบหนึ่งรอบ ---------- */}
        <div className="mt-4 space-y-3 @3xl:hidden">
          {rounds.map((r) => (
            <RoundCard key={r.id} round={r} unit={doc.orderUnit} />
          ))}
        </div>

        {/* ---------- จอกว้าง: ตาราง ---------- */}
        <div className="mt-4 hidden @3xl:block">
          <TableFrame>
            <Table>
              <TableHeader className={STICKY_HEAD}>
                <TableRow>
                  <TableHead className={HEAD_FIRST}>เลขที่รับสินค้า</TableHead>
                  <TableHead>เลขที่ ID</TableHead>
                  <TableHead>ทะเบียนรถ</TableHead>
                  <TableHead>วันที่รถจะเข้า</TableHead>
                  <TableHead>เบอร์ตู้คอนเทนเนอร์</TableHead>
                  <TableHead>โซน</TableHead>
                  <TableHead>บรรจุภัณฑ์</TableHead>
                  <TableHead className="text-right">
                    รับเข้า ({doc.orderUnit})
                  </TableHead>
                  <TableHead className="text-right">
                    ไม่ผ่าน ({doc.orderUnit})
                  </TableHead>
                  <TableHead>ผลตรวจสอบ QC</TableHead>
                  <TableHead className="text-right">
                    เข้าคลัง ({doc.orderUnit})
                  </TableHead>
                  <TableHead className={HEAD_LAST}>สถานะ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rounds.map((r) => (
                  <RoundRow key={r.id} round={r} />
                ))}
              </TableBody>
            </Table>
          </TableFrame>
        </div>
      </main>

      {/* ---------- แถบปุ่มล่าง ---------- */}
      <div className="sticky bottom-0 z-30 border-t border-border bg-surface">
        <div className="mx-auto flex w-full max-w-6xl items-center px-8 py-3">
          <Button variant="outline-primary" onClick={() => router.back()}>
            ย้อนกลับ
          </Button>
        </div>
      </div>
    </div>
  );
}

function Crumbs() {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/">ระบบ</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink href="/stock">สต็อกทั่วไป</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage className="text-primary">
            ใบรับเข้าสต็อกทั่วไป
          </BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

function SummaryStat({
  label,
  value,
  note,
  valueClassName,
}: {
  label: string;
  value: string;
  note?: string;
  valueClassName?: string;
}) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <span className={cn("text-lg font-semibold tabular-nums", valueClassName)}>
          {value}
        </span>
        {note && (
          <span className="text-sm font-medium text-danger-strong">{note}</span>
        )}
      </p>
    </div>
  );
}

function MetaField({ label, value }: { label: string; value: string }) {
  return (
    <p>
      {/* ไม่มี ":" ท้ายป้ายกำกับ — ป้ายกับค่าคนละบรรทัดกัน ไม่ใช่บรรทัดเดียวกัน
          เครื่องหมาย ":" ใช้ตอนป้าย/ค่าอยู่บรรทัดเดียวกันเท่านั้น (เช่น CardRow) */}
      <span className="block text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </p>
  );
}

function RoundRow({ round: r }: { round: InboundRound }) {
  return (
    <TableRow>
      <TableCell className={COL_FIRST}>
        <span className="block font-medium whitespace-nowrap">
          {r.receiptCode}
        </span>
      </TableCell>
      <TableCell className="whitespace-nowrap text-muted-foreground">
        {r.batchId}
      </TableCell>
      <TableCell className="whitespace-nowrap">{r.plate}</TableCell>
      <TableCell className="whitespace-nowrap">{r.arriveDate}</TableCell>
      <TableCell className="whitespace-nowrap">{r.containerNo ?? "-"}</TableCell>
      <TableCell>{r.zone ?? "-"}</TableCell>
      <TableCell>{r.packing ?? "-"}</TableCell>
      <TableCell className="text-right whitespace-nowrap tabular-nums">
        {r.receivedQty != null ? formatQty(r.receivedQty) : "-"}
      </TableCell>
      <TableCell className="text-right whitespace-nowrap tabular-nums">
        {r.rejectedQty != null ? (
          <span className="text-danger-strong">-{formatQty(r.rejectedQty)}</span>
        ) : (
          "-"
        )}
      </TableCell>
      <TableCell>{r.qcResult ? <QcChip result={r.qcResult} /> : "-"}</TableCell>
      <TableCell className="text-right whitespace-nowrap tabular-nums">
        {r.stockedQty != null ? formatQty(r.stockedQty) : "-"}
      </TableCell>
      <TableCell className={COL_LAST}>
        <RoundStatusChip status={r.status} />
      </TableCell>
    </TableRow>
  );
}

function RoundCard({ round: r, unit }: { round: InboundRound; unit: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <CardHead code={r.receiptCode} at={r.arriveDate} />
      <p className="mt-1 text-sm text-muted-foreground">{r.batchId}</p>

      <CardBox className="mt-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <span className="font-medium">{r.plate}</span>
        {r.zone && (
          <span className="text-sm">
            โซน: <span className="font-semibold">{r.zone}</span>
          </span>
        )}
      </CardBox>

      <dl className="mt-3 space-y-1.5 text-sm">
        {r.containerNo && (
          <CardRow label="เบอร์ตู้คอนเทนเนอร์">{r.containerNo}</CardRow>
        )}
        {r.packing && <CardRow label="บรรจุภัณฑ์">{r.packing}</CardRow>}
        {r.receivedQty != null && (
          <CardRow label={`รับเข้า (${unit})`}>{formatQty(r.receivedQty)}</CardRow>
        )}
        {r.rejectedQty != null && (
          <CardRow label={`ไม่ผ่าน (${unit})`} className="text-danger-strong">
            -{formatQty(r.rejectedQty)}
          </CardRow>
        )}
        {r.stockedQty != null && (
          <CardRow label={`เข้าคลัง (${unit})`}>{formatQty(r.stockedQty)}</CardRow>
        )}
      </dl>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        {r.qcResult ? <QcChip result={r.qcResult} /> : <span />}
        <RoundStatusChip status={r.status} />
      </div>
    </div>
  );
}
