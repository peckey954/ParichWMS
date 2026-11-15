"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDownIcon } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@peckey954/ui/components/ui/alert-dialog";
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
import { toast } from "sonner";
import { Crumbs, Meta, Stat } from "@/components/receiving/parts";
import {
  CardRow,
  COL_FIRST,
  EmptyDocs,
  HEAD_FIRST,
  STICKY_HEAD,
  TableFrame,
  TablePager,
  paginate,
} from "@/components/stock/doc-parts";
import type { ZoneScanItem } from "@/components/stock/zone-scan-sheet";
import {
  closeGoodsInbound,
  formatInboundQty,
  isCountUnit,
  liveSlips,
  otherProductReceipt,
  requestGoodsInboundTab,
  slipCount,
  slipQty,
  waitingSlips,
  type GoodsInboundReceipt,
  type GoodsSlip,
} from "@/lib/goods-inbound";
import { requestIssueTab } from "@/lib/goods-issue";

/* ------------------------------------------------------------------
   ใบรับเข้าแบบสลิง — รับเข้าภายนอก (PO) / ผลิต (PD) / รับคืนภายนอก
   (Figma Stock-In External, Stock-In Production, Stock-in Return)

   หัวใบต่างกันตามแหล่ง ส่วนล่างเหมือนกัน: สลิงที่รับมาแล้ว รอเลือกล็อค
   ปุ่มเลือกล็อคไปหน้าสแกน เปิดกล้องให้สแกนป้ายสลิงทันที

   ชิป QC ตรวจสอบ ขึ้นเฉพาะสินค้าตัน (มีเอกสารอ้างอิงจาก QC) — ชิ้น/ขวดไม่มีตรวจ QC

   บันทึก — เลือกล็อคครบทุกสลิง = รับเสร็จ ใบออกจากแท็บรอรับ ไปอยู่ในประวัติ
            ยังไม่ครบ = เตือนก่อน บันทึกได้ แต่ใบยังค้างที่รอรับ
------------------------------------------------------------------ */

/** หน้าของใบนี้ — รับคืนอยู่ใต้ /return ที่เดียวกับใบคืนภายใน/กวาดพื้น */
export function receiptHref(r: GoodsInboundReceipt) {
  return r.doc.source === "return" ? `/stock/goods/return/${r.doc.id}` : `/stock/goods/inbound/${r.doc.id}`;
}

export const receiptCrumb = (r: GoodsInboundReceipt) =>
  r.doc.source === "return" ? "รับคืนสินค้า" : "ใบรับเข้าสินค้า";

/** สลิงที่สแกนได้ในหน้าเลือกล็อค — ของใบนี้ กับของใบอื่นที่เป็นคนละสินค้า */
export function slipScanPool(r: GoodsInboundReceipt): ZoneScanItem[] {
  const { unit } = r.doc;
  const line = (s: GoodsSlip) => {
    const base = `${s.packing} · ${formatInboundQty(s.qty, unit)} ${unit}`;
    return isCountUnit(unit) ? base : `${base} · ${s.count.toLocaleString("en-US")} ชิ้น`;
  };
  const toItem = (s: GoodsSlip, own: boolean) => ({ id: s.id, code: s.receiptCode, zone: s.zone ?? "", line: line(s), own });
  const other = otherProductReceipt(r.doc);
  return [
    ...liveSlips(r.slips).map((s) => toItem(s, true)),
    ...liveSlips(other?.slips ?? []).map((s) => toItem(s, false)),
  ];
}

type SlipTab = "in" | "cancel" | "qc";

export function ReceiptSheet({ receipt }: { receipt: GoodsInboundReceipt }) {
  const router = useRouter();
  const { doc, meta, slips } = receipt;
  const production = doc.source === "production";
  const ret = doc.source === "return";
  const u = doc.unit;
  const fmt = (v: number) => formatInboundQty(v, u);
  const byCount = isCountUnit(u);

  const [tab, setTab] = React.useState<SlipTab>("in");
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const live = liveSlips(slips);
  const cancelled = slips.filter((s) => s.cancelled);
  const waiting = waitingSlips(slips);
  const waitWord = ret ? "รอรับคืน" : "รอรับเข้า";

  const finish = () => {
    if (waiting === 0) {
      closeGoodsInbound(receipt);
      if (ret) toast.success("คืนสินค้าสำเร็จ", { description: `สินค้า: ${doc.productName}` });
      else toast.success("รับเข้าสินค้าสำเร็จ", { description: `${production ? "ใบผลิต" : "ใบสั่งซื้อ"}: ${doc.code}` });
    } else {
      toast.success("บันทึกแล้ว ยังเลือกล็อคไม่ครบ", {
        description: `เหลือ ${waiting} สลิง ใบยังอยู่ที่${waitWord}`,
      });
    }
    if (ret) requestIssueTab();
    else requestGoodsInboundTab();
    router.push("/stock/goods");
  };

  const title = production ? "ใบรับเข้าสินค้าผลิต" : ret ? "รับคืนสินค้า" : "ใบรับเข้าสินค้าภายนอก";
  const right = production ? (
    <>
      {doc.line} <span className="font-normal">รอบ:</span> {doc.round}
    </>
  ) : (
    doc.supplier
  );
  const tags = production ? [doc.group, doc.packing] : [doc.productType, doc.group, doc.packing];

  const stats = production
    ? [
        { label: `สั่งผลิต (${u})`, value: fmt(doc.orderQty ?? 0) },
        { label: `ปริมาณผลิต (${u})`, value: fmt(doc.producedQty ?? 0) },
        { label: "เข้าคลัง (ชิ้น)", value: slipCount(slips).toLocaleString("en-US") },
        { label: `เข้าคลัง (${u})`, value: fmt(slipQty(slips)) },
      ]
    : [
        { label: `รับเข้า (${u})`, value: fmt(slipQty(slips)) },
        ...(byCount ? [] : [{ label: "รับเข้า (ชิ้น)", value: slipCount(slips).toLocaleString("en-US") }]),
        { label: `ไม่ผ่าน (${u})`, value: "-" },
        { label: `เข้าคลัง (${u})`, value: fmt(slipQty(slips)) },
      ];

  const chips: { id: SlipTab; label: string }[] = [
    { id: "in", label: `รับเข้า (${live.length})` },
    { id: "cancel", label: `ยกเลิก (${cancelled.length})` },
    ...(byCount ? [] : [{ id: "qc" as const, label: "QC ตรวจสอบ" }]),
  ];

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col">
      <main className="@container mx-auto w-full max-w-7xl flex-1 px-4 pt-6 pb-6 sm:px-6">
        <Crumbs trail={[{ label: "สต็อกสินค้า", href: "/stock/goods" }, { label: receiptCrumb(receipt) }]} />

        <h1 className="mt-4 text-2xl font-bold tracking-tight">
          {title} <span className="whitespace-nowrap">{doc.code}</span>
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">{doc.createdAt}</p>

        <Collapsible defaultOpen className="mt-5 rounded-xl border border-border bg-card px-4 py-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              {/* มือถือ: ชื่อสินค้าบรรทัดเดียว แท็กลงบรรทัดถัดไป / จอกว้าง: ต่อกันแถวเดียว */}
              <div className="flex flex-col gap-1 @3xl:flex-row @3xl:flex-wrap @3xl:items-center @3xl:gap-x-2">
                <span className="font-semibold">{doc.productName}</span>
                <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                  {tags.map((v, i) => (
                    <React.Fragment key={v}>
                      <span className={cn("h-4 w-px bg-border", i === 0 && "hidden @3xl:block")} aria-hidden />
                      <span>{v}</span>
                    </React.Fragment>
                  ))}
                </p>
              </div>
              <p className="text-sm font-semibold @3xl:hidden">{right}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="hidden text-sm font-semibold @3xl:inline">{right}</span>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="แสดง/ซ่อนรายละเอียด" className="group -mt-1 -mr-2">
                  <ChevronDownIcon className="size-5 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
                </Button>
              </CollapsibleTrigger>
            </div>
          </div>

          {/* กล่องส้มอยู่นอกส่วนที่หุบ — เป็นตัวเลขที่ต้องเทียบกับตารางตลอดหน้า */}
          <div
            className={cn(
              "mt-4 grid grid-cols-2 gap-4 rounded-xl border border-brand-hover bg-brand px-4 py-5",
              stats.length === 4 ? "@3xl:grid-cols-4" : "@3xl:grid-cols-3"
            )}
          >
            {stats.map((s) => (
              <Stat key={s.label} label={s.label} value={s.value} />
            ))}
          </div>

          <CollapsibleContent>
            <div className={cn("mt-4 grid grid-cols-2 gap-x-4 gap-y-3", ret ? "@3xl:grid-cols-3" : "@3xl:grid-cols-4")}>
              {production ? (
                <>
                  <Meta label="ผู้สั่งผลิต" value={meta.orderer} />
                  <Meta label="ผู้แก้ไขสั่งผลิตล่าสุด" value={meta.ordererEditor} />
                  <Meta label="ผู้ผลิต" value={meta.producer} />
                  <Meta label="ผู้แก้ไขผลิตล่าสุด" value={meta.producerEditor} />
                </>
              ) : ret ? (
                <>
                  {/* ทะเบียนรถ/วันที่รถจะเข้า มีในแบบมือถือ — จอกว้างเอาไว้แถวเดียวกันให้ครบ */}
                  <Meta label="ทะเบียนรถ" value={doc.truck} />
                  <Meta label="วันที่รถจะเข้า" value={doc.arriveDate} />
                  <Meta label="ผู้ขอคืน" value={doc.requester} />
                  <Meta label="ผู้แก้ไขขอคืนล่าสุด" value={doc.requestEditor} />
                  <Meta label="หมายเหตุผู้ขอคืน" value={doc.requesterNote} />
                </>
              ) : (
                <>
                  <Meta label="ทะเบียนรถ" value={doc.truck} />
                  <Meta label="วันที่รถจะเข้า" value={doc.arriveDate} />
                  <Meta label={`รอรับเข้า (${u})`} value={waiting > 0 ? fmt(doc.qty) : "-"} />
                  <Meta label="หมายเหตุจากผู้สั่งซื้อ" value={meta.buyerNote} />
                  <Meta label="เลขที่ใบขอซื้อ" value={meta.prCode} />
                  <Meta label="PRQ Unique ID" value={meta.prqId} />
                  <Meta label="ผู้ทำใบขอซื้อ" value={meta.prMaker} />
                  <Meta label="ผู้แก้ไขขอซื้อล่าสุด" value={meta.prEditor} />
                  <Meta label="ผู้ทำใบสั่งซื้อ" value={meta.poMaker} />
                  <Meta label="ผู้แก้ไขสั่งซื้อล่าสุด" value={meta.poEditor} />
                  <Meta label="เหตุผลการซื้อ" value={meta.reason} />
                  <Meta label="ช่วงวันที่รถส่งสินค้า" value={`${meta.deliveryFrom} - ยังไม่ระบุ`} />
                </>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* ---------- สลิง ---------- */}
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
                  : "border-border bg-card hover:bg-accent-hover"
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
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-semibold">{tab === "in" ? "รับเข้าสินค้าต่อสลิง" : "สลิงที่ยกเลิก"}</h2>
              {live.length === 0 ? (
                <Button disabled>{ret ? "เลือกล็อค" : "สแกนเลือกล็อค"}</Button>
              ) : (
                <Button asChild>
                  <Link href={`${receiptHref(receipt)}/zone`}>{ret ? "เลือกล็อค" : "สแกนเลือกล็อค"}</Link>
                </Button>
              )}
            </div>
            <div className="mt-3">
              {(tab === "in" ? live : cancelled).length === 0 ? (
                <EmptyDocs
                  title={tab === "in" ? "ยังไม่มีสลิงที่รับเข้า" : "ไม่มีสลิงที่ยกเลิก"}
                  hint={tab === "in" ? "สลิงที่รับเข้าจะขึ้นที่นี่" : "ทุกสลิงของใบนี้ยังใช้งานอยู่"}
                />
              ) : (
                <SlipList key={tab} rows={tab === "in" ? live : cancelled} external={!production} unit={u} />
              )}
            </div>
            {/* ใบคืนผ่านการตรวจความถูกต้องมาแล้ว (ที่ไม่ถูกต้องถูกส่งคืน ไม่ได้มาถึงคลัง) */}
            {ret && (
              <div className="mt-5">
                <Meta label="ความถูกต้องของสินค้า" value="ถูกต้อง" />
              </div>
            )}
          </>
        )}
      </main>

      <div className="sticky bottom-0 z-30 border-t border-border bg-surface">
        <div className="mx-auto w-full max-w-7xl px-4 py-3 sm:px-6">
          <div className="grid grid-cols-2 gap-3 sm:flex sm:justify-between">
            <Button variant="outline-primary" onClick={() => router.back()}>
              ย้อนกลับ
            </Button>
            <Button disabled={live.length === 0} onClick={() => (waiting > 0 ? setConfirmOpen(true) : finish())}>
              บันทึก
            </Button>
          </div>
        </div>
      </div>

      {/* บันทึกทั้งที่ยังมีสลิงไม่มีล็อค — ทำได้ แต่ต้องรู้ก่อนว่าใบยังค้างที่รอรับ */}
      <MissingZoneDialog open={confirmOpen} onOpenChange={setConfirmOpen} onConfirm={finish} waitWord={waitWord} />
    </div>
  );
}

export function MissingZoneDialog({
  open,
  onOpenChange,
  onConfirm,
  waitWord,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onConfirm: () => void;
  waitWord: string;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent size="sm" className="data-[size=sm]:max-w-[22rem]">
        <AlertDialogHeader>
          <AlertDialogTitle>พบสินค้าที่ยังไม่ได้เลือกล็อค</AlertDialogTitle>
          <AlertDialogDescription>
            สินค้าบางรายการยังไม่ได้เลือกล็อค หากบันทึกรายการจะยังคงอยู่ในสถานะ{waitWord}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel variant="outline-primary">ย้อนกลับ</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>บันทึก</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function ZoneCell({ zone }: { zone?: string }) {
  return zone ? (
    <span className="inline-block rounded-md bg-secondary px-2.5 py-0.5 text-sm font-semibold whitespace-nowrap text-primary">
      {zone}
    </span>
  ) : (
    <span className="text-muted-foreground">-</span>
  );
}

function SlipList({ rows, external, unit }: { rows: GoodsSlip[]; external: boolean; unit: string }) {
  const [page, setPage] = React.useState(1);
  const { pages, safe, slice } = paginate(rows, page, 10);
  const fmt = (v: number) => formatInboundQty(v, unit);
  const byCount = isCountUnit(unit);

  return (
    <>
      {/* จอแคบ: การ์ดต่อสลิง */}
      <div className="space-y-3 @3xl:hidden">
        {slice.map((s) => (
          <div key={s.id} className="rounded-xl border border-border bg-card p-4">
            {/* ตามแบบ: เลขสลิง + วันที่แถวเดียว แล้วรายการหัวข้อ:ค่า ล็อคอยู่แถวสุดท้าย */}
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-semibold">{s.receiptCode}</span>
              <span className="shrink-0 text-sm text-muted-foreground">{s.createdAt}</span>
            </div>
            <dl className="mt-3 space-y-1.5 text-sm">
              {external && <CardRow label="เบอร์ตู้คอนเทนเนอร์">{s.containerNo ?? "-"}</CardRow>}
              {external && <CardRow label="บรรจุภัณฑ์">{s.packing}</CardRow>}
              {!byCount && <CardRow label={`ปริมาณรับเข้าต่อสลิง (${unit})`}>{fmt(s.qty)}</CardRow>}
              <CardRow label={`จำนวนรับเข้าต่อสลิง (${byCount ? unit : "ชิ้น"})`}>
                {s.count.toLocaleString("en-US")}
              </CardRow>
              <CardRow label="หมายเหตุ">{s.note ?? "-"}</CardRow>
              <CardRow label="ล็อค">
                <ZoneCell zone={s.zone} />
              </CardRow>
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
                {external && (
                  <TableHead>
                    เบอร์ตู้
                    <br />
                    คอนเทนเนอร์
                  </TableHead>
                )}
                <TableHead>ล็อค</TableHead>
                {external && <TableHead>บรรจุภัณฑ์</TableHead>}
                {/* ชิ้น/ขวด ไม่มีปริมาณ มีแต่จำนวน */}
                {!byCount && (
                  <TableHead className="text-right">
                    ปริมาณรับเข้าต่อสลิง
                    <br />({unit})
                  </TableHead>
                )}
                <TableHead className="text-right">
                  จำนวนรับเข้าต่อสลิง
                  <br />({byCount ? unit : "ชิ้น"})
                </TableHead>
                <TableHead>หมายเหตุ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {slice.map((s) => (
                <TableRow key={s.id} className="hover:bg-transparent">
                  <TableCell className={COL_FIRST}>
                    <span className="block font-medium whitespace-nowrap">{s.receiptCode}</span>
                    <span className="block text-sm whitespace-nowrap text-muted-foreground">{s.createdAt}</span>
                  </TableCell>
                  {external && <TableCell className="whitespace-nowrap">{s.containerNo ?? "-"}</TableCell>}
                  <TableCell>
                    <ZoneCell zone={s.zone} />
                  </TableCell>
                  {external && <TableCell className="whitespace-nowrap">{s.packing}</TableCell>}
                  {!byCount && <TableCell className="text-right tabular-nums">{fmt(s.qty)}</TableCell>}
                  <TableCell className="text-right tabular-nums">{s.count.toLocaleString("en-US")}</TableCell>
                  <TableCell>{s.note ?? "-"}</TableCell>
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

export function ReceiptNotFound({ done, crumb, ret }: { done: boolean; crumb: string; ret?: boolean }) {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 pt-6 pb-24 sm:px-6">
      <Crumbs trail={[{ label: "สต็อกสินค้า", href: "/stock/goods" }, { label: crumb }]} />
      <div className="mt-10 rounded-xl border border-dashed border-border px-6 py-14 text-center">
        <p className="font-medium">
          {done ? (ret ? "ใบนี้รับคืนไปแล้ว" : "ใบนี้รับเข้าครบแล้ว") : ret ? "ไม่พบใบขอคืนนี้" : "ไม่พบใบรับเข้านี้"}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {done ? "ดูรายการได้ที่ประวัติในแท็บสต็อกสินค้า" : "เอกสารอาจถูกลบหรือลิงก์ไม่ถูกต้อง"}
        </p>
        <Button asChild variant="outline-primary" className="mt-4">
          <Link href="/stock/goods">กลับไปหน้าสต็อกสินค้า</Link>
        </Button>
      </div>
    </main>
  );
}
