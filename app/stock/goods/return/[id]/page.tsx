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
import { Input } from "@peckey954/ui/components/ui/input";
import { Label } from "@peckey954/ui/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@peckey954/ui/components/ui/table";
import { Textarea } from "@peckey954/ui/components/ui/textarea";
import { cn } from "@peckey954/ui/lib/utils";
import { toast } from "sonner";
import { Crumbs, Meta, Stat, StepperField } from "@/components/receiving/parts";
import { CardRow, TableFrame } from "@/components/stock/doc-parts";
import { MissingZoneDialog, ReceiptNotFound, ReceiptSheet, ZoneCell } from "@/components/stock/goods-receipt";
import { CaptureTile, ScannerDialog, useLotScanner } from "@/components/stock/lot-scan";
import { EmptyScan, ZonePicker, type ZoneScanItem } from "@/components/stock/zone-scan-sheet";
import { getGoodsInboundReceipt, isGoodsInboundOpen } from "@/lib/goods-inbound";
import {
  canReturn,
  closeGoodsIssue,
  formatCount,
  formatQty,
  goodsIssueOf,
  isCountUnit,
  otherReturnDoc,
  requestIssueTab,
  returnInputOf,
  returnLotsFor,
  setReturnInput,
  type GoodsIssueDoc,
  type ReturnLot,
} from "@/lib/goods-issue";

/* ------------------------------------------------------------------
   รับคืนสินค้า — ตาม Figma Stock-in Return (โหนด 332-374851)

   ภายนอก    ของคืนมากับรถเป็นสลิง หน้าตาเหมือนใบรับเข้าภายนอก
             (components/stock/goods-receipt) เลือกล็อคด้วยการสแกนป้ายสลิง
   ภายใน     Lot มากับใบแล้ว (เคยจ่ายออกจาก Lot ไหน ก็คืนเข้า Lot นั้น)
             คลังกรอกจำนวนที่คืนจริงต่อ Lot แล้วกด "เลือกล็อครับเข้า" ไปสแกน
   กวาดพื้น  ไม่มี Lot — สแกนเลขที่สินค้าก่อน แล้วค่อยกรอกปริมาณกับเลือกล็อค

   คืนน้อยกว่าที่ขอ ต้องใส่เหตุผลในหมายเหตุ (เช่น สูญหาย)
   ยังเลือกล็อคไม่ครบ บันทึกได้ แต่เตือนก่อนว่าใบยังค้างที่รอรับคืน
------------------------------------------------------------------ */

const isSweep = (d: GoodsIssueDoc) => d.status === "returnSweep";

export default function GoodsReturnPage() {
  const { id } = useParams<{ id: string }>();
  const doc = goodsIssueOf(id);
  const receipt = React.useMemo(
    () => (doc?.status === "returnExternal" ? getGoodsInboundReceipt(doc.id) : undefined),
    [doc]
  );
  if (!doc || !canReturn(doc))
    return <ReceiptNotFound done={Boolean(doc)} crumb={doc && isSweep(doc) ? "รับคืนวัตถุดิบกวาดพื้น" : "รับคืนสินค้า"} ret />;
  if (receipt) {
    if (!isGoodsInboundOpen(receipt.doc)) return <ReceiptNotFound done crumb="รับคืนสินค้า" ret />;
    return <ReceiptSheet key={doc.id} receipt={receipt} />;
  }
  return isSweep(doc) ? <SweepSheet key={doc.id} doc={doc} /> : <InternalSheet key={doc.id} doc={doc} />;
}

// ---------------------------------------------------------------
// หัวใบ — ชื่อสินค้า กล่องส้ม แล้วผู้ขอคืน
// ---------------------------------------------------------------

function DocHead({ doc, stats }: { doc: GoodsIssueDoc; stats: { label: string; value: string }[] }) {
  const tags = [doc.productType, doc.group, doc.packing ?? (isCountUnit(doc.unit) ? doc.unit : undefined)].filter(
    Boolean
  ) as string[];
  return (
    <Collapsible defaultOpen className="rounded-xl border border-border bg-card px-4 py-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1 @3xl:flex-row @3xl:flex-wrap @3xl:items-center @3xl:gap-x-2">
          <span className="font-semibold">{doc.productName}</span>
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
            {tags.map((t, i) => (
              <React.Fragment key={t}>
                <span className={cn("h-4 w-px bg-border", i === 0 && "hidden @3xl:block")} aria-hidden />
                <span>{t}</span>
              </React.Fragment>
            ))}
          </p>
        </div>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="แสดง/ซ่อนรายละเอียด" className="group -mt-1 -mr-2">
            <ChevronDownIcon className="size-5 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
          </Button>
        </CollapsibleTrigger>
      </div>

      <div
        className={cn(
          "mt-4 grid grid-cols-2 gap-4 rounded-xl border border-brand-hover bg-brand px-4 py-5",
          stats.length === 4 ? "@3xl:grid-cols-4" : stats.length === 3 && "@3xl:grid-cols-3"
        )}
      >
        {stats.map((s) => (
          <Stat key={s.label} label={s.label} value={s.value} />
        ))}
      </div>

      <CollapsibleContent>
        <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 @3xl:grid-cols-3">
          <Meta label="ผู้ขอคืน" value={doc.requester} />
          <Meta label="ผู้แก้ไขขอคืนล่าสุด" value={doc.lastEditor ?? doc.editedBy} />
          <Meta label="หมายเหตุผู้ขอคืน" value={doc.requesterNote ?? doc.note} />
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function Shell({
  doc,
  title,
  children,
  onSave,
}: {
  doc: GoodsIssueDoc;
  title: string;
  children: React.ReactNode;
  onSave: () => void;
}) {
  const router = useRouter();
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col">
      <main className="@container mx-auto w-full max-w-7xl flex-1 px-4 pt-6 pb-6 sm:px-6">
        <Crumbs trail={[{ label: "สต็อกสินค้า", href: "/stock/goods" }, { label: title }]} />
        <h1 className="mt-4 text-2xl font-bold tracking-tight">
          {title} <span className="whitespace-nowrap">{doc.code}</span>
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">{doc.createdAt}</p>
        <div className="mt-5 space-y-5">{children}</div>
      </main>

      <div className="sticky bottom-0 z-30 border-t border-border bg-surface">
        <div className="mx-auto w-full max-w-7xl px-4 py-3 sm:px-6">
          <div className="grid grid-cols-2 gap-3 sm:flex sm:justify-between">
            <Button variant="outline-primary" onClick={() => router.back()}>
              ย้อนกลับ
            </Button>
            <Button onClick={onSave}>บันทึก</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function NoteField({
  value,
  onChange,
  required,
  error,
}: {
  value: string;
  onChange: (v: string) => void;
  required: boolean;
  error?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor="return-note" className={cn(error && "text-danger-strong")}>
        หมายเหตุ
        {!required && <span className="font-normal text-muted-foreground">(ไม่บังคับ)</span>}
      </Label>
      <Textarea
        id="return-note"
        rows={3}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={required ? "ระบุเหตุผลที่คืนน้อยกว่าที่ขอ เช่น สูญหาย" : "ระบุหมายเหตุ"}
        aria-invalid={Boolean(error) || undefined}
        className={cn("bg-card", error && "border-danger-strong")}
      />
      {error && <p className="text-sm text-danger-strong">{error}</p>}
    </div>
  );
}

function done(router: ReturnType<typeof useRouter>, doc: GoodsIssueDoc) {
  closeGoodsIssue(doc.id);
  requestIssueTab();
  toast.success("คืนสินค้าสำเร็จ", { description: `สินค้า: ${doc.productName}` });
  router.push("/stock/goods");
}

// ---------------------------------------------------------------
// ภายใน — กรอกจำนวนคืนต่อ Lot แล้วไปสแกนเลือกล็อค
// ---------------------------------------------------------------

function InternalSheet({ doc }: { doc: GoodsIssueDoc }) {
  const router = useRouter();
  const u = doc.unit;
  const byCount = isCountUnit(u);
  const pieceUnit = byCount ? u : "ชิ้น";
  const fmt = (v: number) => formatQty(v, u);
  const lots = React.useMemo(() => returnLotsFor(doc), [doc]);
  const [inputs, setInputs] = React.useState<Record<string, string>>(() =>
    Object.fromEntries(lots.map((l) => [l.id, returnInputOf(l.id) ?? String(l.count)]))
  );
  const [note, setNote] = React.useState("");
  const [tried, setTried] = React.useState(false);
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  const setCount = (id: string, v: string) => {
    const clean = v.replace(/\D/g, "");
    setReturnInput(id, clean);
    setInputs((prev) => ({ ...prev, [id]: clean }));
  };

  const rows = lots.map((lot) => {
    const raw = inputs[lot.id];
    const count = Number(raw) || 0;
    // ปริมาณตามสัดส่วนของที่ขอ — ไม่ต้องรู้น้ำหนักต่อชิ้นของ Lot
    const qty = byCount ? count : Math.round(((lot.qty * count) / lot.count) * 100) / 100;
    const error = raw === "" ? "กรอกจำนวน" : count > lot.count ? `เกินที่ขอคืน ${formatCount(lot.count)}` : undefined;
    return { lot, raw, count, qty, error };
  });

  const askCount = lots.reduce((s, l) => s + l.count, 0);
  const totalCount = rows.reduce((s, r) => s + r.count, 0);
  const totalQty = rows.reduce((s, r) => s + r.qty, 0);
  const short = totalCount < askCount;
  const noteMissing = short && note.trim() === "";
  const missingZone = lots.filter((l) => !l.zone).length;

  const stats = byCount
    ? [
        { label: `ขอคืน (${u})`, value: formatCount(askCount) },
        { label: `เข้าคลัง (${u})`, value: formatCount(totalCount) },
      ]
    : [
        { label: `ขอคืน (${u})`, value: fmt(Math.abs(doc.qty)) },
        { label: "ขอคืน (ชิ้น)", value: formatCount(askCount) },
        { label: "เข้าคลัง (ชิ้น)", value: formatCount(totalCount) },
        { label: `เข้าคลัง (${u})`, value: fmt(totalQty) },
      ];

  const finish = () => {
    if (missingZone > 0) {
      requestIssueTab();
      toast.success("บันทึกแล้ว ยังเลือกล็อคไม่ครบ", { description: `เหลือ ${missingZone} Lot ใบยังอยู่ที่รอรับคืน` });
      router.push("/stock/goods");
      return;
    }
    done(router, doc);
  };

  const save = () => {
    setTried(true);
    if (rows.some((r) => r.error) || totalCount <= 0 || noteMissing) {
      toast.error(totalCount <= 0 ? "จำนวนคืนต้องมากกว่า 0" : noteMissing && rows.every((r) => !r.error) ? "กรุณาระบุเหตุผลที่คืนไม่ครบ" : "กรุณากรอกข้อมูลให้ครบ");
      return;
    }
    if (missingZone > 0) setConfirmOpen(true);
    else finish();
  };

  const line = (l: ReturnLot) =>
    `รับ ${l.receivedAt} (${l.ageDays} วัน) · ${formatCount(l.lotPieces)} ${pieceUnit}${l.packing && !byCount ? ` (${l.packing})` : ""}`;

  return (
    <Shell doc={doc} title="รับคืนสินค้า" onSave={save}>
      <DocHead doc={doc} stats={stats} />

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold">รับคืนสินค้า</h2>
          <Button asChild>
            <Link href={`/stock/goods/return/${doc.id}/zone`}>เลือกล็อครับเข้า</Link>
          </Button>
        </div>

        {/* จอแคบ — การ์ดต่อ Lot ยอดขอคืนกับล็อคด้านบน ช่องกรอกด้านล่าง */}
        <div className="space-y-3 @3xl:hidden">
          {rows.map((r) => (
            <div key={r.lot.id} className="rounded-xl border border-border bg-card p-4">
              <p className="font-semibold">{r.lot.code}</p>
              <p className="text-sm text-muted-foreground">{line(r.lot)}</p>
              <dl className="mt-3 space-y-1.5 border-t border-border pt-3 text-sm">
                <CardRow label={`จำนวนขอคืน (${pieceUnit})`}>{formatCount(r.lot.count)}</CardRow>
                {!byCount && <CardRow label={`ปริมาณคืน (${u})`}>{fmt(r.qty)}</CardRow>}
                <CardRow label="ล็อค">
                  <ZoneCell zone={r.lot.zone} />
                </CardRow>
              </dl>
              <div className="mt-3 flex items-start justify-between gap-3 border-t border-border pt-3">
                <Label htmlFor={`m-count-${r.lot.id}`} className="mt-2.5 font-normal text-muted-foreground">
                  จำนวนคืน ({pieceUnit}):
                </Label>
                <CountInput
                  id={`m-count-${r.lot.id}`}
                  className="w-40"
                  value={r.raw}
                  error={tried ? r.error : undefined}
                  onChange={(v) => setCount(r.lot.id, v)}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="hidden @3xl:block">
          <TableFrame>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lot</TableHead>
                  <TableHead>ล็อค</TableHead>
                  <TableHead>บรรจุภัณฑ์</TableHead>
                  <TableHead className="text-right">
                    จำนวนขอคืน
                    <br />({pieceUnit})
                  </TableHead>
                  {!byCount && (
                    <TableHead className="text-right">
                      ปริมาณคืน
                      <br />({u})
                    </TableHead>
                  )}
                  <TableHead className="w-32 text-right">
                    จำนวนคืน
                    <br />({pieceUnit})
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.lot.id} className="hover:bg-transparent">
                    <TableCell className="align-top">
                      <span className="block font-medium">{r.lot.code}</span>
                      <span className="block text-sm text-muted-foreground">{line(r.lot)}</span>
                    </TableCell>
                    <TableCell className="align-top">
                      <ZoneCell zone={r.lot.zone} />
                    </TableCell>
                    <TableCell className="align-top whitespace-nowrap">{r.lot.packing ?? "-"}</TableCell>
                    <TableCell className="text-right align-top tabular-nums">{formatCount(r.lot.count)}</TableCell>
                    {!byCount && <TableCell className="text-right align-top tabular-nums">{fmt(r.qty)}</TableCell>}
                    <TableCell className="align-top">
                      <CountInput
                        id={`count-${r.lot.id}`}
                        value={r.raw}
                        error={tried ? r.error : undefined}
                        onChange={(v) => setCount(r.lot.id, v)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableFrame>
        </div>
      </section>

      <NoteField
        value={note}
        onChange={setNote}
        required={short}
        error={tried && noteMissing ? "คืนน้อยกว่าที่ขอ กรุณาระบุเหตุผล" : undefined}
      />

      <MissingZoneDialog open={confirmOpen} onOpenChange={setConfirmOpen} onConfirm={finish} waitWord="รอรับคืน" />
    </Shell>
  );
}

function CountInput({
  id,
  value,
  error,
  onChange,
  className,
}: {
  id: string;
  value: string;
  error?: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  return (
    <div className={className}>
      <Input
        id={id}
        inputMode="numeric"
        aria-invalid={Boolean(error) || undefined}
        className={cn("bg-card text-right tabular-nums", error && "border-danger-strong")}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {error && <p className="mt-1 text-right text-xs text-danger-strong">{error}</p>}
    </div>
  );
}

// ---------------------------------------------------------------
// กวาดพื้น — สแกนเลขที่สินค้าก่อน แล้วกรอกปริมาณคืนกับล็อค
// ---------------------------------------------------------------

function SweepSheet({ doc }: { doc: GoodsIssueDoc }) {
  const router = useRouter();
  const u = doc.unit;
  const decimals = isCountUnit(u) ? 0 : 2;
  const requested = Math.abs(doc.qty);
  const fmt = (v: number) => formatQty(v, u);

  const [scanned, setScanned] = React.useState(false);
  const [qty, setQty] = React.useState(requested.toFixed(decimals));
  const [zone, setZone] = React.useState("");
  const [note, setNote] = React.useState("");
  const [tried, setTried] = React.useState(false);

  // ป้ายของใบนี้ กับของใบกวาดพื้นอื่นที่เป็นคนละสินค้า (สแกนแล้วขึ้นสินค้าไม่ตรงกัน)
  const pool = React.useMemo<ZoneScanItem[]>(() => {
    const other = otherReturnDoc(doc);
    const item = (d: GoodsIssueDoc, own: boolean) => ({ id: d.id, code: `${d.code}A`, zone: "", line: d.productName, own });
    return [item(doc, true), ...(other ? [item(other, false)] : [])];
  }, [doc]);

  const scan = useLotScanner({
    lots: pool,
    picked: scanned ? [doc.id] : [],
    onAdd: () => setScanned(true),
    reject: (s) => (s.own ? undefined : "กรุณาสแกนเลขที่สินค้าของใบนี้"),
    rejectLabel: "สินค้าไม่ตรงกัน",
    describe: (s) => s.code,
    inputId: "sweep-photo",
  });

  const value = Number(qty) || 0;
  const qtyError = qty === "" ? "กรอกปริมาณ" : value > requested + 1e-9 ? `เกินที่ขอคืน ${fmt(requested)}` : undefined;
  const short = value < requested - 1e-9;
  const noteMissing = short && note.trim() === "";

  const save = () => {
    setTried(true);
    if (!scanned) return;
    if (qtyError || !zone || value <= 0 || noteMissing) {
      toast.error(value <= 0 ? "ปริมาณคืนต้องมากกว่า 0" : "กรุณากรอกข้อมูลให้ครบ");
      return;
    }
    done(router, doc);
  };

  return (
    <Shell doc={doc} title="รับคืนวัตถุดิบกวาดพื้น" onSave={save}>
      {scanned && (
        <DocHead
          doc={doc}
          stats={[
            { label: `ปริมาณขอคืน (${u})`, value: fmt(requested) },
            { label: `ปริมาณคืน (${u})`, value: fmt(value) },
          ]}
        />
      )}

      <CaptureTile scan={scan} prompt="สแกนเลขที่เพื่อเลือกล็อครับสินค้าเข้าคลัง" />

      {!scanned ? (
        <EmptyScan hint="กรุณาสแกนเลขที่สินค้า" error={tried ? "กรุณาสแกนเลขที่สินค้าก่อนบันทึก" : undefined} />
      ) : (
        <>
          <div className="grid gap-4 @3xl:grid-cols-2">
            <StepperField
              id="sweep-qty"
              label={`ปริมาณคืน (${u})`}
              value={qty}
              onChange={setQty}
              step={1}
              decimals={decimals}
              error={tried ? qtyError : undefined}
            />
            <div className="space-y-1.5">
              <Label htmlFor="sweep-zone" className={cn(tried && !zone && "text-danger-strong")}>
                ล็อครับเข้า
              </Label>
              <ZonePicker id="sweep-zone" value={zone} onChange={setZone} invalid={tried && !zone} />
              {tried && !zone && <p className="text-sm text-danger-strong">กรุณาเลือกล็อค</p>}
            </div>
          </div>
          <NoteField
            value={note}
            onChange={setNote}
            required={short}
            error={tried && noteMissing ? "คืนน้อยกว่าที่ขอ กรุณาระบุเหตุผล" : undefined}
          />
        </>
      )}

      <ScannerDialog scan={scan} />
    </Shell>
  );
}
