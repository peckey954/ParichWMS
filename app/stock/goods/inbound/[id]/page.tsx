"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
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
import {
  closeGoodsInbound,
  formatInboundQty,
  getGoodsInboundReceipt,
  isCountUnit,
  isGoodsInboundOpen,
  liveSlips,
  requestGoodsInboundTab,
  slipCount,
  slipQty,
  waitingSlips,
  type GoodsInboundReceipt,
  type GoodsSlip,
} from "@/lib/goods-inbound";

/* ------------------------------------------------------------------
   ใบรับเข้าสินค้า — ภายนอก (PO) หรือ ผลิต (PD) ตาม Figma Tab 2.1 / 2.2

   หัวใบต่างกันตามแหล่ง ส่วนล่างเหมือนกัน: สลิงที่รับมาแล้ว รอเลือกโซน
   ปุ่ม "เลือกโซนรับเข้า" ไปหน้าเลือกโซน (สแกน/เลือกจากรายการ)

   บันทึก — เลือกโซนครบทุกสลิง = รับเข้าเสร็จ ใบออกจากแท็บรอรับเข้า ไปอยู่ในประวัติ
            ยังไม่ครบ = เตือนก่อน บันทึกได้ แต่ใบยังค้างที่รอรับเข้า
------------------------------------------------------------------ */

export default function GoodsInboundPage() {
  const { id } = useParams<{ id: string }>();
  const receipt = React.useMemo(() => getGoodsInboundReceipt(id), [id]);
  if (!receipt || !isGoodsInboundOpen(receipt.doc)) return <NotFound done={Boolean(receipt)} />;
  return <ReceiptSheet key={receipt.doc.id} receipt={receipt} />;
}

type SlipTab = "in" | "cancel" | "qc";

function ReceiptSheet({ receipt }: { receipt: GoodsInboundReceipt }) {
  const router = useRouter();
  const { doc, meta, slips } = receipt;
  const production = doc.source === "production";
  const u = doc.unit;
  const fmt = (v: number) => formatInboundQty(v, u);
  const byCount = isCountUnit(u);

  const [tab, setTab] = React.useState<SlipTab>("in");
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const live = liveSlips(slips);
  const cancelled = slips.filter((s) => s.cancelled);
  const waiting = waitingSlips(slips);

  const finish = () => {
    if (waiting === 0) {
      closeGoodsInbound(receipt);
      toast.success("รับเข้าสินค้าสำเร็จ", { description: `${production ? "ใบผลิต" : "ใบสั่งซื้อ"}: ${doc.code}` });
    } else {
      toast.success("บันทึกแล้ว ยังเลือกโซนไม่ครบ", {
        description: `เหลือ ${waiting} สลิง ใบยังอยู่ที่รอรับเข้า`,
      });
    }
    requestGoodsInboundTab();
    router.push("/stock/goods");
  };

  const title = production ? "ใบรับเข้าสินค้าผลิต" : "ใบรับเข้าสินค้าภายนอก";
  const right = production ? (
    <>
      {doc.line} <span className="font-normal">รอบ:</span> {doc.round}
    </>
  ) : (
    doc.supplier
  );

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
    { id: "qc", label: "QC ตรวจสอบ" },
  ];

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col">
      <main className="@container mx-auto w-full max-w-7xl flex-1 px-4 pt-6 pb-6 sm:px-6">
        <Crumbs trail={[{ label: "สต็อกสินค้า", href: "/stock/goods" }, { label: "ใบรับเข้าสินค้า" }]} />

        <h1 className="mt-4 text-2xl font-bold tracking-tight">
          {title} <span className="whitespace-nowrap">{doc.code}</span>
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">{doc.createdAt}</p>

        <Collapsible defaultOpen className="mt-5 rounded-xl border border-border bg-card px-4 py-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="font-semibold">{doc.productName}</span>
                {(production ? [doc.group, doc.packing] : [doc.productType, doc.group, doc.packing]).map((v) => (
                  <React.Fragment key={v}>
                    <span className="h-4 w-px bg-border" aria-hidden />
                    <span className="text-sm">{v}</span>
                  </React.Fragment>
                ))}
              </p>
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
            <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 @3xl:grid-cols-4">
              {production ? (
                <>
                  <Meta label="ผู้สั่งผลิต" value={meta.orderer} />
                  <Meta label="ผู้แก้ไขสั่งผลิตล่าสุด" value={meta.ordererEditor} />
                  <Meta label="ผู้ผลิต" value={meta.producer} />
                  <Meta label="ผู้แก้ไขผลิตล่าสุด" value={meta.producerEditor} />
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
                <Button disabled>เลือกโซนรับเข้า</Button>
              ) : (
                <Button asChild>
                  <Link href={`/stock/goods/inbound/${doc.id}/zone`}>เลือกโซนรับเข้า</Link>
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

      {/* บันทึกทั้งที่ยังมีสลิงไม่มีโซน — ทำได้ แต่ต้องรู้ก่อนว่าใบยังค้างที่รอรับเข้า */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent size="sm" className="data-[size=sm]:max-w-[22rem]">
          <AlertDialogHeader>
            <AlertDialogTitle>พบสินค้าที่ยังไม่ได้เลือกโซน</AlertDialogTitle>
            <AlertDialogDescription>
              สินค้าบางรายการยังไม่ได้เลือกโซน หากบันทึกรายการจะยังคงอยู่ในสถานะรอรับเข้า
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel variant="outline-primary">ย้อนกลับ</AlertDialogCancel>
            <AlertDialogAction onClick={finish}>บันทึก</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ZoneCell({ zone }: { zone?: string }) {
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
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold">{s.receiptCode}</span>
              {s.zone ? <ZoneCell zone={s.zone} /> : <span className="text-sm text-muted-foreground">ยังไม่มีโซน</span>}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{s.createdAt}</p>
            <Separator className="my-3" />
            <dl className="space-y-1.5 text-sm">
              {external && <CardRow label="เบอร์ตู้คอนเทนเนอร์">{s.containerNo ?? "-"}</CardRow>}
              {external && <CardRow label="บรรจุภัณฑ์">{s.packing}</CardRow>}
              <CardRow label={`ปริมาณรับเข้า (${unit})`}>{fmt(s.qty)}</CardRow>
              {!byCount && <CardRow label="จำนวนรับเข้า (ชิ้น)">{s.count.toLocaleString("en-US")}</CardRow>}
              {s.note && <CardRow label="หมายเหตุ">{s.note}</CardRow>}
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
                <TableHead>โซน</TableHead>
                {external && <TableHead>บรรจุภัณฑ์</TableHead>}
                <TableHead className="text-right">
                  ปริมาณรับเข้าต่อสลิง
                  <br />({unit})
                </TableHead>
                {!byCount && (
                  <TableHead className="text-right">
                    จำนวนรับเข้าต่อสลิง
                    <br />
                    (ชิ้น)
                  </TableHead>
                )}
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
                  <TableCell className="text-right tabular-nums">{fmt(s.qty)}</TableCell>
                  {!byCount && <TableCell className="text-right tabular-nums">{s.count.toLocaleString("en-US")}</TableCell>}
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

function NotFound({ done }: { done: boolean }) {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 pt-6 pb-24 sm:px-6">
      <Crumbs trail={[{ label: "สต็อกสินค้า", href: "/stock/goods" }, { label: "ใบรับเข้าสินค้า" }]} />
      <div className="mt-10 rounded-xl border border-dashed border-border px-6 py-14 text-center">
        <p className="font-medium">{done ? "ใบนี้รับเข้าครบแล้ว" : "ไม่พบใบรับเข้านี้"}</p>
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
