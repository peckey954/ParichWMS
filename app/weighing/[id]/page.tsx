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
  computeReceiptTotals,
  diffKind,
  DIFF_LABEL,
  formatSignedTon,
  formatTon,
  getWeighingReceipt,
  netTon,
  roundDiffTon,
  WEIGHING_ROUND_STATUS_LABEL,
  type WeighingRound,
  type WeighingRoundStatus,
} from "@/lib/weighing";

/* ------------------------------------------------------------------
   ใบชั่งน้ำหนัก — เข้ามาจากปุ่ม "ชั่งน้ำหนัก" บนการ์ด/ตารางหน้ารายการ

   ข้อมูลใบสั่ง (ประเภทสินค้า/ผู้ทำใบ/เหตุผลซื้อ) พับเก็บได้เพราะดูอ้างอิง
   ไม่ใช่งานหลักของหน้านี้ — งานหลักคือตาราง "รอบการชั่งน้ำหนัก" ข้างล่าง
   สรุปยอดสามช่อง (น้ำหนักจริง/ตามผู้ขาย/ส่วนต่าง) อยู่นอกส่วนที่พับ
   เพราะเป็นตัวเลขอ้างอิงที่ต้องเทียบกับตารางรอบตลอด ให้เห็นได้แม้การ์ดยังหุบอยู่
------------------------------------------------------------------ */

const ROUND_STATUS_TONE: Record<
  WeighingRoundStatus,
  "warning" | "neutral" | "success"
> = {
  waitingTruck: "warning",
  draft: "neutral",
  weighed: "success",
};

function RoundStatusChip({ status }: { status: WeighingRoundStatus }) {
  return (
    <Badge tone={ROUND_STATUS_TONE[status]} appearance="soft" className="font-semibold">
      {WEIGHING_ROUND_STATUS_LABEL[status]}
    </Badge>
  );
}

export default function WeighingReceiptPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const receipt = React.useMemo(() => getWeighingReceipt(params.id), [params.id]);
  const rounds = receipt?.rounds ?? [];

  if (!receipt) {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 pt-6 pb-24 sm:px-6">
        <Crumbs />
        <div className="mt-10 rounded-xl border border-dashed border-border px-6 py-14 text-center">
          <p className="font-medium">ไม่พบใบชั่งน้ำหนักนี้</p>
          <p className="mt-1 text-sm text-muted-foreground">
            เอกสารอาจถูกลบหรือลิงก์ไม่ถูกต้อง
          </p>
          <Button asChild variant="outline-primary" className="mt-4">
            <Link href="/weighing">กลับไปหน้าชั่งน้ำหนัก</Link>
          </Button>
        </div>
      </main>
    );
  }

  const { doc, meta } = receipt;
  const totals = computeReceiptTotals(rounds);
  const kind = diffKind(totals.diffTon);

  return (
    // เนื้อหาสั้นกว่าจอได้ (ยังไม่เคยชั่งเลยไม่มีตารางยาวๆ) — ถ้าไม่กำหนดความสูง
    // ขั้นต่ำ ปุ่มย้อนกลับ (sticky bottom-0) จะลอยอยู่ใต้เนื้อหาแทนติดขอบล่าง
    // จอจริง ให้ flex-1 ใน main ดันปุ่มลงไปสุดความสูงขั้นต่ำนี้แทนเสมอ
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col">
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-6 pb-6 sm:px-6">
        <Crumbs code={doc.code} />

        <h1 className="mt-4 text-2xl font-semibold tracking-tight">
          ใบชั่งน้ำหนัก {doc.code}
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
                <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="font-semibold">
                    {doc.productName}
                    {doc.productSub && ` ${doc.productSub}`}
                  </span>
                  <span className="text-sm text-muted-foreground">{doc.category}</span>
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

          {/* อยู่นอกส่วนที่หุบ — สามยอดนี้คือตัวเลขอ้างอิงที่ต้องเทียบกับตารางรอบตลอดทั้งหน้า */}
          <div className="px-4 pb-4">
            <div className="grid gap-4 rounded-lg bg-brand p-4 @2xl:grid-cols-3">
              <SummaryStat label="น้ำหนักจริง (ตัน)" value={formatTon(totals.netTon)} />
              <SummaryStat
                label="น้ำหนักตามผู้ขาย (ตัน)"
                value={formatTon(totals.supplierTon)}
              />
              <div>
                <p className="text-sm text-muted-foreground">ส่วนต่าง (ตัน)</p>
                <p className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <span
                    className={cn(
                      "text-lg font-semibold tabular-nums",
                      totals.diffTon < 0 && "text-danger-strong"
                    )}
                  >
                    {formatSignedTon(totals.diffTon)}
                  </span>
                  {kind && (
                    <span
                      className={cn(
                        "text-sm font-medium",
                        kind === "loss" ? "text-danger-strong" : "text-muted-foreground"
                      )}
                    >
                      {DIFF_LABEL[kind]}{" "}
                      {totals.diffPercent !== 0 &&
                        `${totals.diffPercent > 0 ? "+" : ""}${totals.diffPercent.toFixed(2)}%`}
                    </span>
                  )}
                </p>
              </div>
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

        {/* ---------- รอบการชั่งน้ำหนัก ---------- */}
        <div className="mt-8 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">รอบการชั่งน้ำหนัก</h2>
          <Button
            asChild
            variant="outline"
            className="border-primary text-primary hover:text-primary"
          >
            <Link href={`/weighing/${doc.id}/add`}>
              <PlusIcon />
              เพิ่มการชั่งน้ำหนัก
            </Link>
          </Button>
        </div>

        {/* ---------- จอแคบ: การ์ดต่อรอบหนึ่งรอบ ---------- */}
        <div className="mt-4 space-y-3 @3xl:hidden">
          {rounds.map((r) => (
            <RoundCard key={r.id} round={r} />
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
                  <TableHead className="text-right">
                    ชั่งเข้ารถพร้อมสินค้า
                    <span className="block font-normal text-muted-foreground">(ตัน)</span>
                  </TableHead>
                  <TableHead className="text-right">
                    ชั่งออกรถเปล่า
                    <span className="block font-normal text-muted-foreground">(ตัน)</span>
                  </TableHead>
                  <TableHead className="text-right">
                    น้ำหนักสินค้าจริง
                    <span className="block font-normal text-muted-foreground">(ตัน)</span>
                  </TableHead>
                  <TableHead className="text-right">
                    น้ำหนักสินค้าตามผู้ขาย
                    <span className="block font-normal text-muted-foreground">(ตัน)</span>
                  </TableHead>
                  <TableHead className="text-right">ส่วนต่าง (ตัน)</TableHead>
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
      <div className="sticky bottom-0 z-30 border-t border-border bg-background">
        <div className="mx-auto flex w-full max-w-6xl items-center px-4 py-3 sm:px-6">
          <Button variant="outline-primary" onClick={() => router.back()}>
            ย้อนกลับ
          </Button>
        </div>
      </div>
    </div>
  );
}

function Crumbs({ code }: { code?: string }) {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/">ระบบ</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink href="/weighing">ชั่งน้ำหนัก</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage className="text-primary">
            ใบชั่งน้ำหนัก{code ? ` ${code}` : ""}
          </BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function MetaField({ label, value }: { label: string; value: string }) {
  return (
    <p>
      <span className="block text-muted-foreground">{label}:</span>
      <span className="font-medium">{value}</span>
    </p>
  );
}

/** ตัวเลข + เวลาชั่งอยู่บรรทัดเดียวกันในเซลล์เดียว — ยังไม่ได้ชั่งแสดงขีดกลาง */
function WeighCell({ ton, at }: { ton?: number; at?: string }) {
  if (ton == null) return <span className="text-muted-foreground">-</span>;
  return (
    <span className="block">
      <span className="font-medium tabular-nums">{formatTon(ton)}</span>
      {at && <span className="block text-sm text-muted-foreground">{at}</span>}
    </span>
  );
}

function RoundRow({ round: r }: { round: WeighingRound }) {
  const net = netTon(r);
  const diff = roundDiffTon(r);
  const kind = diffKind(diff);

  return (
    <TableRow>
      <TableCell className={COL_FIRST}>
        <span className="block font-medium whitespace-nowrap">{r.receiptCode}</span>
      </TableCell>
      <TableCell className="whitespace-nowrap text-muted-foreground">
        {r.batchId}
      </TableCell>
      <TableCell className="whitespace-nowrap">{r.plate}</TableCell>
      <TableCell className="whitespace-nowrap">{r.arriveDate}</TableCell>
      <TableCell className="text-right whitespace-nowrap tabular-nums">
        <WeighCell ton={r.grossTon} at={r.grossAt} />
      </TableCell>
      <TableCell className="text-right whitespace-nowrap tabular-nums">
        <WeighCell ton={r.tareTon} at={r.tareAt} />
      </TableCell>
      <TableCell className="text-right whitespace-nowrap tabular-nums">
        {net != null ? formatTon(net) : <span className="text-muted-foreground">-</span>}
      </TableCell>
      <TableCell className="text-right whitespace-nowrap tabular-nums">
        {r.supplierTon != null ? (
          formatTon(r.supplierTon)
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </TableCell>
      <TableCell className="text-right whitespace-nowrap tabular-nums">
        {diff == null || kind == null ? (
          <span className="text-muted-foreground">-</span>
        ) : (
          <span
            className={cn("font-medium", kind === "loss" && "text-danger-strong")}
          >
            {formatSignedTon(diff)}
          </span>
        )}
      </TableCell>
      <TableCell className={COL_LAST}>
        <RoundStatusChip status={r.status} />
      </TableCell>
    </TableRow>
  );
}

function RoundCard({ round: r }: { round: WeighingRound }) {
  const net = netTon(r);
  const diff = roundDiffTon(r);
  const kind = diffKind(diff);

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <CardHead code={r.receiptCode} at={r.arriveDate} />
      <p className="mt-1 text-sm text-muted-foreground">{r.batchId}</p>

      <CardBox className="mt-3">
        <span className="font-medium">{r.plate}</span>
      </CardBox>

      <dl className="mt-3 space-y-1.5 text-sm">
        <CardRow label="ชั่งเข้า (ตัน)">
          {r.grossTon != null ? formatTon(r.grossTon) : "-"}
        </CardRow>
        <CardRow label="ชั่งออก (ตัน)">
          {r.tareTon != null ? formatTon(r.tareTon) : "-"}
        </CardRow>
        <CardRow label="สินค้าจริง (ตัน)">{net != null ? formatTon(net) : "-"}</CardRow>
        <CardRow label="ตามผู้ขาย (ตัน)">
          {r.supplierTon != null ? formatTon(r.supplierTon) : "-"}
        </CardRow>
        {diff != null && (
          <CardRow
            label="ส่วนต่าง (ตัน)"
            className={kind === "loss" ? "text-danger-strong" : undefined}
          >
            {formatSignedTon(diff)}
          </CardRow>
        )}
      </dl>

      <div className="mt-3 flex justify-end">
        <RoundStatusChip status={r.status} />
      </div>
    </div>
  );
}
