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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@peckey954/ui/components/ui/select";
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
import { TableFrame } from "@/components/stock/doc-parts";
import {
  canReturn,
  closeGoodsIssue,
  formatCount,
  formatQty,
  goodsIssueOf,
  isCountUnit,
  requestIssueTab,
  returnLotsFor,
  type GoodsIssueDoc,
  type ReturnLot,
} from "@/lib/goods-issue";
import { GOODS_ZONES } from "@/lib/goods-stock";

/* ------------------------------------------------------------------
   รับคืนสินค้า — ใบขอคืน (ภายใน/ภายนอก/กวาดพื้น) ตาม Figma Tab 3

   ใบขอคืนมากับ Lot แล้ว (ของที่เคยจ่ายออกจาก Lot ไหน ก็คืนเข้า Lot นั้น)
   คลังกรอกเฉพาะที่คืนจริง กับเลือกโซนที่จะเก็บกลับต่อ Lot
   ช่องคืนตั้งต้นเท่ายอดขอคืน ส่วนใหญ่แค่เลือกโซนแล้วบันทึก

   สินค้าตัน: กรอกทั้งปริมาณ (ตัน) และจำนวน (ชิ้น) แยกกัน เพราะของคืนอาจ
   ไม่เต็มถุง — กล่องส้มบอกค่าเฉลี่ยต่อชิ้นให้เห็นว่าผิดสังเกตไหม
   สินค้าชิ้น/ขวด: มีแต่จำนวน

   กวาดพื้นไม่มี Lot (ของตกหล่นไม่รู้มาจากไหน) — ปริมาณช่องเดียวกับโซนรับเข้า

   คืนน้อยกว่าที่ขอ ต้องใส่เหตุผลในหมายเหตุ (เช่น สูญหาย)
------------------------------------------------------------------ */

const isSweep = (d: GoodsIssueDoc) => d.status === "returnSweep";

export default function GoodsReturnPage() {
  const { id } = useParams<{ id: string }>();
  const doc = goodsIssueOf(id);
  if (!doc || !canReturn(doc)) return <NotFound done={Boolean(doc)} sweep={Boolean(doc && isSweep(doc))} />;
  return <ReturnSheet key={doc.id} doc={doc} />;
}

type LotInput = { qty: string; count: string; zone: string };

/** ตัวเลขที่พิมพ์ — ตันมีทศนิยม ชิ้น/ขวดไม่มี */
const clean = (v: string, decimals: boolean) => v.replace(decimals ? /[^\d.]/g : /\D/g, "");

function ReturnSheet({ doc }: { doc: GoodsIssueDoc }) {
  const router = useRouter();
  const sweep = isSweep(doc);
  const byCount = isCountUnit(doc.unit);
  const u = doc.unit;
  const fmt = (v: number) => formatQty(v, u);
  const lots = React.useMemo(() => returnLotsFor(doc), [doc]);
  /** สินค้าตันที่ใบมีจำนวนชิ้น — กรอกได้ทั้งสองช่อง */
  const withCount = !byCount && !sweep && lots.some((l) => l.count !== undefined);
  const requested = Math.abs(doc.qty);
  const decimals = byCount ? 0 : 2;

  const [inputs, setInputs] = React.useState<Record<string, LotInput>>(() =>
    Object.fromEntries(
      lots.map((l) => [
        l.id,
        { qty: l.qty.toFixed(decimals), count: l.count !== undefined ? String(l.count) : "", zone: "" },
      ])
    )
  );
  const [sweepQty, setSweepQty] = React.useState(requested.toFixed(decimals));
  const [sweepZone, setSweepZone] = React.useState("");
  const [note, setNote] = React.useState("");
  const [tried, setTried] = React.useState(false);

  const setLot = (id: string, patch: Partial<LotInput>) =>
    setInputs((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));

  // ---------- ตรวจ ----------

  const rows = lots.map((lot) => {
    const v = inputs[lot.id];
    const qty = Number(v.qty) || 0;
    const count = Number(v.count) || 0;
    const qtyError =
      v.qty === "" ? "กรอกจำนวน" : qty > lot.qty + 1e-9 ? `เกินที่ขอคืน ${fmt(lot.qty)}` : undefined;
    const countError =
      !withCount || lot.count === undefined
        ? undefined
        : v.count === ""
          ? "กรอกจำนวน"
          : count > lot.count
            ? `เกินที่ขอคืน ${formatCount(lot.count)}`
            : undefined;
    const zoneError = v.zone ? undefined : "เลือกโซน";
    return { lot, v, qty, count, qtyError, countError, zoneError };
  });

  const totalQty = sweep ? Number(sweepQty) || 0 : rows.reduce((s, r) => s + r.qty, 0);
  const totalCount = rows.reduce((s, r) => s + r.count, 0);
  const sweepError =
    sweepQty === "" ? "กรอกปริมาณ" : totalQty > requested + 1e-9 ? `เกินที่ขอคืน ${fmt(requested)}` : undefined;
  const short = totalQty < requested - 1e-9;
  const noteMissing = short && note.trim() === "";
  const fieldsOk = sweep
    ? !sweepError && Boolean(sweepZone)
    : rows.every((r) => !r.qtyError && !r.countError && !r.zoneError);
  const canSubmit = fieldsOk && !noteMissing && totalQty > 0;

  const save = () => {
    if (!canSubmit) {
      setTried(true);
      toast.error(totalQty <= 0 ? "ปริมาณคืนต้องมากกว่า 0" : noteMissing && fieldsOk ? "กรุณาระบุเหตุผลที่คืนไม่ครบ" : "กรุณากรอกข้อมูลให้ครบ");
      return;
    }
    closeGoodsIssue(doc.id);
    requestIssueTab();
    toast.success("คืนสินค้าสำเร็จ", { description: `สินค้า: ${doc.productName}` });
    router.push("/stock/goods");
  };

  const title = sweep ? "รับคืนวัตถุดิบกวาดพื้น" : "รับคืนสินค้า";
  const perPiece = totalCount > 0 ? totalQty / totalCount : 0;

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col">
      <main className="@container mx-auto w-full max-w-7xl flex-1 px-4 pt-6 pb-6 sm:px-6">
        <Crumbs trail={[{ label: "สต็อกสินค้า", href: "/stock/goods" }, { label: title }]} />

        <h1 className="mt-4 text-2xl font-bold tracking-tight">
          {title} <span className="whitespace-nowrap">{doc.code}</span>
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">{doc.createdAt}</p>

        <Collapsible defaultOpen className="mt-5 rounded-xl border border-border bg-card px-4 py-5">
          <div className="flex items-start justify-between gap-3">
            <p className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
              <span className="font-semibold">{doc.productName}</span>
              {[doc.productType, doc.group, doc.packing ?? (byCount ? u : undefined)]
                .filter(Boolean)
                .map((t) => (
                  <React.Fragment key={t}>
                    <span className="h-4 w-px bg-border" aria-hidden />
                    <span className="text-sm">{t}</span>
                  </React.Fragment>
                ))}
            </p>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="แสดง/ซ่อนรายละเอียด" className="group -mt-1 -mr-2">
                <ChevronDownIcon className="size-5 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
              </Button>
            </CollapsibleTrigger>
          </div>

          <CollapsibleContent>
            <div
              className={cn(
                "mt-4 grid grid-cols-2 gap-4 rounded-xl border border-brand-hover bg-brand px-4 py-5",
                withCount && "@3xl:grid-cols-3"
              )}
            >
              <Stat label={`${byCount ? "จำนวนขอคืน" : "ปริมาณขอคืน"} (${u})`} value={fmt(requested)} />
              {withCount && (
                <Stat
                  label={`ปริมาณคืนเฉลี่ย (${u})`}
                  value={totalCount > 0 ? `${perPiece.toFixed(2)} ${u}/ชิ้น   ${formatCount(totalCount)} ชิ้น` : "-"}
                />
              )}
              <Stat label={`${byCount ? "จำนวนคืน" : "ปริมาณคืน"} (${u})`} value={fmt(totalQty)} />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 @3xl:grid-cols-3">
              <Meta label="ผู้ขอคืน" value={doc.requester} />
              <Meta label="ผู้แก้ไขขอคืนล่าสุด" value={doc.lastEditor ?? doc.editedBy} />
              <Meta label="หมายเหตุผู้ขอคืน" value={doc.requesterNote ?? doc.note} />
            </div>
          </CollapsibleContent>
        </Collapsible>

        <div className="mt-4 space-y-4">
          {sweep ? (
            <div className="grid gap-4 @3xl:grid-cols-2">
              <StepperField
                id="sweep-qty"
                label={`ปริมาณคืน (${u})`}
                value={sweepQty}
                onChange={setSweepQty}
                step={1}
                decimals={decimals}
                error={tried ? sweepError : undefined}
              />
              <div className="space-y-1.5">
                <Label htmlFor="sweep-zone" className={cn(tried && !sweepZone && "text-danger-strong")}>
                  โซนรับเข้า
                </Label>
                <ZoneSelect
                  id="sweep-zone"
                  value={sweepZone}
                  onChange={setSweepZone}
                  invalid={tried && !sweepZone}
                />
                {tried && !sweepZone && <p className="text-sm text-danger-strong">เลือกโซน</p>}
              </div>
            </div>
          ) : (
            <>
              <ReturnTable
                rows={rows}
                unit={u}
                byCount={byCount}
                withCount={withCount}
                tried={tried}
                onChange={setLot}
                decimals={decimals}
              />
              <ReturnCards
                rows={rows}
                unit={u}
                byCount={byCount}
                withCount={withCount}
                tried={tried}
                onChange={setLot}
                decimals={decimals}
              />
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="return-note" className={cn(tried && noteMissing && "text-danger-strong")}>
              หมายเหตุ
              {!short && <span className="font-normal text-muted-foreground">(ไม่บังคับ)</span>}
            </Label>
            <Textarea
              id="return-note"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={short ? "ระบุเหตุผลที่คืนน้อยกว่าที่ขอ เช่น สูญหาย" : "ระบุหมายเหตุ"}
              aria-invalid={(tried && noteMissing) || undefined}
              className={cn("bg-card", tried && noteMissing && "border-danger-strong")}
            />
            {tried && noteMissing && <p className="text-sm text-danger-strong">คืนน้อยกว่าที่ขอ กรุณาระบุเหตุผล</p>}
          </div>
        </div>
      </main>

      <div className="sticky bottom-0 z-30 border-t border-border bg-surface">
        <div className="mx-auto w-full max-w-7xl px-4 py-3 sm:px-6">
          <div className="grid grid-cols-2 gap-3 sm:flex sm:justify-between">
            <Button variant="outline-primary" onClick={() => router.back()}>
              ย้อนกลับ
            </Button>
            <Button onClick={save}>บันทึก</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

type Row = {
  lot: ReturnLot;
  v: LotInput;
  qtyError?: string;
  countError?: string;
  zoneError?: string;
};

type ListProps = {
  rows: Row[];
  unit: string;
  byCount: boolean;
  withCount: boolean;
  tried: boolean;
  decimals: number;
  onChange: (id: string, patch: Partial<LotInput>) => void;
};

const lotLine = (l: ReturnLot) => `รับ ${l.receivedAt} (${l.ageDays} วัน)`;

function ZoneSelect({
  id,
  value,
  onChange,
  invalid,
  className,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  invalid?: boolean;
  className?: string;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        id={id}
        aria-invalid={invalid || undefined}
        className={cn("w-full bg-card", invalid && "border-danger-strong", className)}
      >
        <SelectValue placeholder="เลือกโซน" />
      </SelectTrigger>
      <SelectContent>
        {GOODS_ZONES.map((z) => (
          <SelectItem key={z} value={z}>
            {z}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function NumInput({
  id,
  value,
  error,
  decimals,
  onChange,
  className,
}: {
  id: string;
  value: string;
  error?: string;
  decimals: boolean;
  onChange: (v: string) => void;
  className?: string;
}) {
  return (
    <div className={className}>
      <Input
        id={id}
        inputMode={decimals ? "decimal" : "numeric"}
        aria-invalid={Boolean(error) || undefined}
        className={cn("bg-card text-right tabular-nums", error && "border-danger-strong")}
        value={value}
        onChange={(e) => onChange(clean(e.target.value, decimals))}
      />
      {error && <p className="mt-1 text-right text-xs text-danger-strong">{error}</p>}
    </div>
  );
}

/** จอกว้าง — ตารางตามแบบ ช่องกรอกอยู่ฝั่งขวาติดกับยอดขอคืน */
function ReturnTable({ rows, unit, byCount, withCount, tried, decimals, onChange }: ListProps) {
  const fmt = (v: number) => formatQty(v, unit);
  return (
    <div className="hidden @3xl:block">
      <TableFrame>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Lot</TableHead>
              <TableHead className="text-right">
                {byCount ? "จำนวนขอคืน" : "ปริมาณขอคืน"}
                <br />({unit})
              </TableHead>
              {withCount && (
                <TableHead className="text-right">
                  จำนวนขอคืน
                  <br />
                  (ชิ้น)
                </TableHead>
              )}
              <TableHead className="w-32 text-right">
                {byCount ? "จำนวนคืน" : "ปริมาณคืน"}
                <br />({unit})
              </TableHead>
              {withCount && (
                <TableHead className="w-32 text-right">
                  จำนวนคืน
                  <br />
                  (ชิ้น)
                </TableHead>
              )}
              <TableHead className="w-44">โซน</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.lot.id} className="hover:bg-transparent">
                <TableCell className="align-top">
                  <span className="block font-medium">{r.lot.code}</span>
                  <span className="block text-sm text-muted-foreground">{lotLine(r.lot)}</span>
                </TableCell>
                <TableCell className="text-right align-top tabular-nums">{fmt(r.lot.qty)}</TableCell>
                {withCount && (
                  <TableCell className="text-right align-top tabular-nums">
                    {r.lot.count !== undefined ? formatCount(r.lot.count) : "-"}
                  </TableCell>
                )}
                <TableCell className="align-top">
                  <NumInput
                    id={`qty-${r.lot.id}`}
                    value={r.v.qty}
                    error={r.qtyError}
                    decimals={decimals > 0}
                    onChange={(qty) => onChange(r.lot.id, { qty })}
                  />
                </TableCell>
                {withCount && (
                  <TableCell className="align-top">
                    <NumInput
                      id={`count-${r.lot.id}`}
                      value={r.v.count}
                      error={r.countError}
                      decimals={false}
                      onChange={(count) => onChange(r.lot.id, { count })}
                    />
                  </TableCell>
                )}
                <TableCell className="align-top">
                  <ZoneSelect
                    id={`zone-${r.lot.id}`}
                    value={r.v.zone}
                    onChange={(zone) => onChange(r.lot.id, { zone })}
                    invalid={tried && Boolean(r.zoneError)}
                  />
                  {tried && r.zoneError && <p className="mt-1 text-xs text-danger-strong">{r.zoneError}</p>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableFrame>
    </div>
  );
}

/** จอแคบ — การ์ดต่อ Lot ยอดขอคืนด้านบน ช่องกรอกด้านล่าง */
function ReturnCards({ rows, unit, byCount, withCount, tried, decimals, onChange }: ListProps) {
  const fmt = (v: number) => formatQty(v, unit);
  return (
    <div className="space-y-3 @3xl:hidden">
      {rows.map((r) => (
        <div key={r.lot.id} className="rounded-xl border border-border bg-card p-4">
          <p className="font-semibold">{r.lot.code}</p>
          <p className="text-sm text-muted-foreground">{lotLine(r.lot)}</p>

          <dl className="mt-3 space-y-1.5 border-t border-border pt-3 text-sm">
            {withCount && r.lot.count !== undefined && (
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">จำนวนขอคืน (ชิ้น):</dt>
                <dd className="font-semibold tabular-nums">{formatCount(r.lot.count)}</dd>
              </div>
            )}
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">
                {byCount ? "จำนวนขอคืน" : "ปริมาณขอคืน"} ({unit}):
              </dt>
              <dd className="font-semibold tabular-nums">{fmt(r.lot.qty)}</dd>
            </div>
          </dl>

          <div className="mt-3 space-y-3 border-t border-border pt-3">
            <CardField id={`m-qty-${r.lot.id}`} label={`${byCount ? "จำนวนคืน" : "ปริมาณคืน"} (${unit}):`}>
              <NumInput
                id={`m-qty-${r.lot.id}`}
                className="w-40"
                value={r.v.qty}
                error={r.qtyError}
                decimals={decimals > 0}
                onChange={(qty) => onChange(r.lot.id, { qty })}
              />
            </CardField>
            {withCount && (
              <CardField id={`m-count-${r.lot.id}`} label="จำนวนคืน (ชิ้น):">
                <NumInput
                  id={`m-count-${r.lot.id}`}
                  className="w-40"
                  value={r.v.count}
                  error={r.countError}
                  decimals={false}
                  onChange={(count) => onChange(r.lot.id, { count })}
                />
              </CardField>
            )}
            <CardField id={`m-zone-${r.lot.id}`} label="โซน:">
              <div className="w-40">
                <ZoneSelect
                  id={`m-zone-${r.lot.id}`}
                  value={r.v.zone}
                  onChange={(zone) => onChange(r.lot.id, { zone })}
                  invalid={tried && Boolean(r.zoneError)}
                />
                {tried && r.zoneError && <p className="mt-1 text-right text-xs text-danger-strong">{r.zoneError}</p>}
              </div>
            </CardField>
          </div>
        </div>
      ))}
    </div>
  );
}

function CardField({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <Label htmlFor={id} className="mt-2.5 font-normal text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}

function NotFound({ done, sweep }: { done: boolean; sweep: boolean }) {
  const title = sweep ? "รับคืนวัตถุดิบกวาดพื้น" : "รับคืนสินค้า";
  return (
    <main className="mx-auto w-full max-w-3xl px-4 pt-6 pb-24 sm:px-6">
      <Crumbs trail={[{ label: "สต็อกสินค้า", href: "/stock/goods" }, { label: title }]} />
      <div className="mt-10 rounded-xl border border-dashed border-border px-6 py-14 text-center">
        <p className="font-medium">{done ? "ใบนี้รับคืนไปแล้ว หรือไม่ใช่ใบขอคืน" : "ไม่พบใบขอคืนนี้"}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {done ? "ดูรายการที่ยังรอรับคืนได้ที่แท็บรอจ่าย/คืน" : "เอกสารอาจถูกลบหรือลิงก์ไม่ถูกต้อง"}
        </p>
        <Button asChild variant="outline-primary" className="mt-4">
          <Link href="/stock/goods">กลับไปหน้าสต็อกสินค้า</Link>
        </Button>
      </div>
    </main>
  );
}
