"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Trash2Icon } from "lucide-react";
import { Button } from "@peckey954/ui/components/ui/button";
import { Label } from "@peckey954/ui/components/ui/label";
import { cn } from "@peckey954/ui/lib/utils";
import { toast } from "sonner";
import { Crumbs } from "@/components/receiving/parts";
import { TreeMultiSelect, type TreeGroup } from "@/components/tree-multi-select";
import { DECIMAL_UNITS, SCOPES, findLot } from "./lot-action";
import type { StockScope } from "./stock-log";
import { RemoveLotDialog, Summary, ZoneBadge, productTags } from "./bulk-lot-action";
import { SimulateToggle } from "./zone-assign";
import {
  formatAmount,
  formatQty,
  lotPieces,
  piecesToQty,
  type Lot,
  type Product,
} from "@/lib/general-stock";

/* ------------------------------------------------------------------
   พิมพ์บาร์โค้ด — เปิดจากปุ่ม ⋮ ของแถว Lot (ย้าย/ปรับปรุงอยู่ที่ ⋮ บนหัวหน้า)

   แถวในสต็อกคือ Lot ใหญ่หนึ่งใบ (เช่น PO260115/01A) แต่ตอนรับเข้าแตกเป็นเลขย่อย
   ต่อรอบรถ (…/01A-01) และต่อสลิงในรอบนั้น (…/01A-01-01) — ป้ายติดที่สลิง
   ช่องเลือกจึงเป็นสองชั้นเฉพาะ Lot ที่กด: รอบรถ → สลิง (มีป้ายล็อคของตัวเอง)
   พิมพ์แล้วกลับหน้ารายการ บอกผลด้วย toast — สำเร็จ / ไม่สำเร็จพร้อมรหัส error

   ---------- ยังเป็นของจำลอง ----------
   ยังไม่มีข้อมูลรอบรถ/สลิงจริง แตก Lot ตามจำนวนชิ้น (≤ 4 รอบ × ≤ 4 สลิง)
   และยังไม่ได้ต่อเครื่องพิมพ์ ชิป "ผลจำลอง" สลับดูทางพิมพ์ไม่สำเร็จได้
------------------------------------------------------------------ */

type Simulate = "ok" | "fail";
const SIMULATE_OPTIONS: { value: Simulate; label: string }[] = [
  { value: "ok", label: "พิมพ์สำเร็จ" },
  { value: "fail", label: "พิมพ์ไม่สำเร็จ" },
];

/** สลิง — หน่วยที่ติดป้ายบาร์โค้ด */
type PrintLabel = { id: string; code: string; lot: Lot; pieces: number; qty: number };
/** รอบรถ — กลุ่มของสลิงที่รับเข้าพร้อมกัน */
type Round = { id: string; code: string; pieces: number; qty: number; slings: PrintLabel[] };

const pad = (n: number) => String(n).padStart(2, "0");
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** แบ่ง total เป็น n ส่วนเกือบเท่ากัน เศษไปอยู่ส่วนแรก ๆ */
const split = (total: number, n: number) =>
  Array.from({ length: n }, (_, i) => Math.floor(total / n) + (i < total % n ? 1 : 0));

function roundsOf(lot: Lot): Round[] {
  const pieces = lotPieces(lot);
  return split(pieces, clamp(Math.ceil(pieces / 300), 1, 4)).map((rp, r) => {
    const code = `${lot.code}-${pad(r + 1)}`;
    const slings = split(rp, clamp(Math.ceil(rp / 100), 1, 4)).map((sp, i) => ({
      id: `${lot.id}:${r + 1}:${i + 1}`,
      code: `${code}-${pad(i + 1)}`,
      lot,
      pieces: sp,
      qty: piecesToQty(lot, sp),
    }));
    return { id: `${lot.id}:${r + 1}`, code, pieces: rp, qty: piecesToQty(lot, rp), slings };
  });
}

function openCode() {
  const d = new Date();
  return `PRT${String(d.getFullYear()).slice(2)}${pad(d.getMonth() + 1)}${pad(d.getDate())}/01`;
}

export function LotPrintPage({ lotId }: { lotId: string }) {
  const found = findLot(lotId);
  if (!found) return null;
  return <PrintSheet key={lotId} scope={found.scope} product={found.product} lot={found.lot} />;
}

function PrintSheet({ scope, product, lot }: { scope: StockScope; product: Product; lot: Lot }) {
  const router = useRouter();
  const home = SCOPES[scope];
  const [code] = React.useState(openCode);
  const unit = product.unit;
  const decimal = DECIMAL_UNITS.has(unit);
  const pieceUnit = decimal ? "ชิ้น" : unit;
  const fmt = decimal ? formatAmount : formatQty;

  const [picked, setPicked] = React.useState<string[]>([]);
  const [pendingRemove, setPendingRemove] = React.useState<PrintLabel>();
  const [submitted, setSubmitted] = React.useState(false);
  const [simulate, setSimulate] = React.useState<Simulate>("ok");

  const rounds = React.useMemo(() => roundsOf(lot), [lot]);
  const labels = rounds.flatMap((r) => r.slings);
  // เรียงตามลำดับใน Lot ไม่ใช่ลำดับที่ติ๊ก — รายการด้านล่างจะไม่สลับที่
  const rows = labels.filter((l) => picked.includes(l.id));

  const qtyMeta = (v: number) => (
    <span className="font-semibold tabular-nums">
      {fmt(v)} <span className="font-normal text-foreground">{unit}</span>
    </span>
  );
  const weight = lot.kgPerPiece ? ` (${lot.kgPerPiece} กก.)` : "";
  const line = (pieces: number) => `รับ ${lot.receivedAt} (${lot.ageDays} วัน) · ${formatQty(pieces)} ${pieceUnit}${weight}`;
  const groups: TreeGroup[] = rounds.map((r) => ({
    value: r.id,
    label: r.code,
    description: line(r.pieces),
    meta: qtyMeta(r.qty),
    children: r.slings.map((l) => ({
      value: l.id,
      label: l.code,
      badge: <span className="text-primary">{lot.zone}</span>,
      description: line(l.pieces),
      meta: qtyMeta(l.qty),
    })),
  }));

  const lotsError = submitted && rows.length === 0 ? "กรุณาเลือก Lot อย่างน้อย 1 รายการ" : undefined;

  // เปิดตรงจากลิงก์ (ไม่มีหน้าก่อนหน้า) ย้อนกลับแล้วไปหน้ารายการแทน
  const leave = () => (window.history.length > 1 ? router.back() : router.push(home.href));

  const print = () => {
    setSubmitted(true);
    if (rows.length === 0) return;
    if (simulate === "fail") toast.error("พิมพ์บาร์โค้ดไม่สำเร็จ", { description: "Error abcde1234 กรุณาติดต่อผู้ดูแล" });
    else toast.success("พิมพ์บาร์โค้ดสำเร็จ", { description: `สินค้า: ${product.name}` });
    leave();
  };

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col">
      <main className="@container mx-auto w-full max-w-7xl flex-1 px-4 pt-6 pb-6 sm:px-6">
        <Crumbs trail={[{ label: home.label, href: home.href }, { label: "พิมพ์บาร์โค้ด" }]} />
        <h1 className="mt-4 text-2xl font-bold tracking-tight" suppressHydrationWarning>
          พิมพ์บาร์โค้ด {code}
        </h1>

        <div className="mt-5 space-y-5">
          <section className="rounded-xl border border-border bg-card p-4">
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="font-semibold">{product.name}</span>
              {productTags(product).map((t) => (
                <React.Fragment key={t}>
                  <span className="h-3.5 w-px bg-border" aria-hidden />
                  <span className="text-sm">{t}</span>
                </React.Fragment>
              ))}
            </p>
            <dl className="mt-4 rounded-xl border border-brand-hover bg-brand px-4 py-3">
              <Summary label={`Lot ${lot.code} · ${decimal ? "ปริมาณ" : "จำนวน"}ในคลัง (${unit})`}>{fmt(lot.qty)}</Summary>
            </dl>
          </section>

          <div className="space-y-2 @3xl:max-w-[calc(50%-0.5rem)]">
            <Label htmlFor="print-lots">Lot</Label>
            <TreeMultiSelect
              id="print-lots"
              className="bg-card"
              groups={groups}
              value={picked}
              onValueChange={setPicked}
              placeholder="เลือก Lot"
              searchPlaceholder="ค้นหา"
              emptyText="ไม่พบ Lot ที่ค้นหา"
              selectAllMeta={qtyMeta(lot.qty)}
              invalid={Boolean(lotsError)}
            />
          </div>

          {rows.length === 0 ? (
            <div
              className={cn(
                "flex h-40 flex-col items-center justify-center gap-1 rounded-xl border bg-card text-center",
                lotsError ? "border-danger-strong" : "border-border"
              )}
            >
              <p className="text-lg font-bold">ไม่มีข้อมูล</p>
              <p className={lotsError ? "text-danger-strong" : "text-muted-foreground"}>{lotsError ?? "กรุณาเพิ่ม Lot"}</p>
            </div>
          ) : (
            <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
              {rows.map((l) => (
                <li key={l.id} className="flex items-center gap-3 px-4 py-3">
                  <ZoneBadge zone={l.lot.zone} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{l.code}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      {line(l.pieces)}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" aria-label={`เอา ${l.code} ออก`} onClick={() => setPendingRemove(l)}>
                    <Trash2Icon />
                  </Button>
                </li>
              ))}
            </ul>
          )}

          <div className="flex justify-center">
            <SimulateToggle state={{ simulate, setSimulate }} options={SIMULATE_OPTIONS} />
          </div>
        </div>

        <RemoveLotDialog
          code={pendingRemove?.code}
          onClose={() => setPendingRemove(undefined)}
          onConfirm={() => pendingRemove && setPicked((prev) => prev.filter((id) => id !== pendingRemove.id))}
        />
      </main>

      <div className="sticky bottom-0 z-30 border-t border-border bg-surface">
        <div className="mx-auto w-full max-w-7xl px-4 py-3 sm:px-6">
          <div className="grid grid-cols-2 gap-3 sm:flex sm:justify-between">
            <Button variant="outline-primary" className="sm:w-auto sm:min-w-20" onClick={leave}>
              ย้อนกลับ
            </Button>
            <Button className="sm:w-auto sm:min-w-20" onClick={print}>
              พิมพ์บาร์โค้ด
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
