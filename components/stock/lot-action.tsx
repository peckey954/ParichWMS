"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MinusIcon, PlusIcon } from "lucide-react";
import { Button } from "@peckey954/ui/components/ui/button";
import { Input } from "@peckey954/ui/components/ui/input";
import { Label } from "@peckey954/ui/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@peckey954/ui/components/ui/select";
import { Textarea } from "@peckey954/ui/components/ui/textarea";
import { cn } from "@peckey954/ui/lib/utils";
import { toast } from "sonner";
import { Crumbs } from "@/components/receiving/parts";
import { appendStockLog, type StockScope } from "./stock-log";
import {
  PRODUCTS,
  ZONES,
  countDiff,
  piecesToQty,
  formatAmount,
  formatQty,
  lotPieces,
  qtyAfterMove,
  type Lot,
  type Product,
} from "@/lib/general-stock";
import { GOODS_PRODUCTS, GOODS_ZONES } from "@/lib/goods-stock";

/** ผู้ทำรายการ — ยังไม่มีระบบผู้ใช้ ใช้ชื่อเดียวกับข้อมูลตัวอย่างไปก่อน */
const ACTOR = "อลิสา พรสุขสิริ";

/* ------------------------------------------------------------------
   หน้าย้ายสต็อก / ปรับปรุงสต็อก ของล็อตหนึ่ง — เปิดจากเมนู ⋮ ของแถวล็อต

   เป็นหน้าเต็ม ไม่ใช่กล่อง: บนมือถือฟอร์มมีช่องเลือกโซน ช่องจำนวน และหมายเหตุ
   กล่องลอยแล้วคีย์บอร์ดบังครึ่งจอ หน้าเต็มเลื่อนได้ปกติ ปุ่มบันทึกติดล่างเสมอ

   ใช้หน้าเดียวกันทั้งสต็อกทั่วไปและสต็อกสินค้า — รู้ว่าเป็นของคลังไหนจากล็อตเอง
   ย้อนกลับ/บันทึกแล้วกลับไปหน้ารายการเดิม แท็บและชิปยังอยู่ที่เดิม
------------------------------------------------------------------ */

export type LotAction = "move" | "adjust";

const SCOPES: Record<StockScope, { label: string; href: string; products: Product[]; zones: string[] }> = {
  general: { label: "สต็อกทั่วไป", href: "/stock", products: PRODUCTS, zones: ZONES },
  goods: { label: "สต็อกสินค้า", href: "/stock/goods", products: GOODS_PRODUCTS, zones: GOODS_ZONES },
};

function findLot(id: string) {
  for (const scope of ["goods", "general"] as const) {
    for (const product of SCOPES[scope].products) {
      const lot = product.lots.find((l) => l.id === id);
      if (lot) return { scope, product, lot };
    }
  }
  return undefined;
}

const TITLE: Record<LotAction, string> = { move: "ย้ายสต็อก", adjust: "ปรับปรุงสต็อก" };

export function LotActionPage({ lotId, action }: { lotId: string; action: string }) {
  const found = findLot(lotId);
  if (!found || (action !== "move" && action !== "adjust")) return <NotFound />;
  const { scope, product, lot } = found;
  return (
    <LotSheet scope={scope} action={action} lot={lot} productName={product.name} unit={product.unit} />
  );
}

function LotSheet({
  scope,
  action,
  lot,
  productName,
  unit,
}: {
  scope: StockScope;
  action: LotAction;
  lot: Lot;
  productName: string;
  unit: string;
}) {
  const router = useRouter();
  const home = SCOPES[scope];
  const move = action === "move";

  // ย้าย
  const [zone, setZone] = React.useState("");
  const [pieces, setPieces] = React.useState(0);
  // ปรับปรุง
  const [counted, setCounted] = React.useState(0);
  const [touched, setTouched] = React.useState(false);
  const [note, setNote] = React.useState("");

  const diff = countDiff(lot, counted);
  // ต้องเลือกโซนและใส่จำนวนก่อน / ยอดไม่ตรงต้องบอกเหตุผลเสมอ ไม่งั้นตรวจย้อนหลังไม่ได้
  const canSave = move ? Boolean(zone) && pieces > 0 : touched && (diff === 0 || note.trim() !== "");

  // เปิดตรงจากลิงก์ (ไม่มีหน้าก่อนหน้า) ย้อนกลับแล้วไปหน้ารายการแทน
  const leave = () => (window.history.length > 1 ? router.back() : router.push(home.href));

  const save = () => {
    const tag = lot.code.replace(/\D/g, "").slice(0, 6);
    if (move) {
      appendStockLog(scope, {
        code: `MV${tag}/01`,
        lotNumber: lot.code,
        productName,
        askedCount: pieces,
        doneCount: pieces,
        doneQty: piecesToQty(lot, pieces),
        unit,
        zone: lot.zone,
        zoneTo: zone,
        note: note.trim() || undefined,
        requester: ACTOR,
        actor: ACTOR,
        status: "move",
      });
      toast.success("บันทึกการย้ายแล้ว", {
        description: `${lot.code} · ${formatQty(pieces)} ชิ้น จาก ${lot.zone} ไป ${zone}`,
      });
    } else {
      appendStockLog(scope, {
        code: `ADJ${tag}/01`,
        lotNumber: lot.code,
        productName,
        // ประวัติบันทึก "ส่วนต่าง" ไม่ใช่ยอดที่นับได้ เพราะสิ่งที่เปลี่ยนคือส่วนต่าง
        doneCount: counted - lotPieces(lot),
        doneQty: diff,
        unit,
        zone: lot.zone,
        note: note.trim() || undefined,
        requester: ACTOR,
        actor: ACTOR,
        status: "adjust",
      });
      toast.success("บันทึกการปรับปรุงแล้ว", {
        description: `${lot.code} · นับได้ ${formatQty(counted)} ชิ้น · ส่วนต่าง ${formatAmount(diff)} ${unit}`,
      });
    }
    leave();
  };

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col">
      <main className="@container mx-auto w-full max-w-3xl flex-1 px-4 pt-6 pb-6 sm:px-6">
        <Crumbs trail={[{ label: home.label, href: home.href }, { label: TITLE[action] }]} />

        <h1 className="mt-4 text-2xl font-bold tracking-tight">{TITLE[action]}</h1>

        <section className="mt-5 rounded-xl border border-border bg-card px-4 py-5">
          {/* ชิปโซนเกาะกับชื่อสินค้าเสมอ ชื่อยาวเกินตัดท้าย ชื่อเต็มชี้ดูได้จาก title */}
          <div className="flex items-center gap-3">
            <span className="shrink-0 rounded-md bg-secondary px-2.5 py-0.5 text-sm font-semibold text-primary">
              {lot.zone}
            </span>
            <p className="min-w-0 flex-1 truncate font-semibold" title={productName}>
              {productName}
            </p>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {lot.code} · รับ {lot.receivedAt} ({lot.ageDays} วัน)
          </p>

          <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4 rounded-xl border border-brand-hover bg-brand px-4 py-5 @md:grid-cols-3">
            <SummaryItem label={`ปริมาณในคลัง (${unit})`}>{formatAmount(lot.qty)}</SummaryItem>
            <SummaryItem label="จำนวนในคลัง (ชิ้น)">
              <span className="flex flex-wrap items-baseline gap-x-3">
                <span>{formatQty(lotPieces(lot))} ชิ้น</span>
                {lot.kgPerPiece && <span className="font-normal">{lot.kgPerPiece} Kg/ชิ้น</span>}
              </span>
            </SummaryItem>
            {move ? (
              <SummaryItem label={`คงเหลือในคลัง (${unit})`}>
                {formatAmount(qtyAfterMove(lot, pieces))}
              </SummaryItem>
            ) : (
              // ยังไม่ได้นับก็ยังไม่มีส่วนต่าง แสดงขีดไว้ก่อน พอนับแล้วขาดเป็นแดง เกินเป็นเขียว
              <SummaryItem
                label={`ส่วนต่าง (${unit})`}
                className={cn(
                  !touched && "text-muted-foreground",
                  touched && diff < 0 && "text-danger-strong",
                  touched && diff > 0 && "text-success-strong"
                )}
              >
                {touched ? formatAmount(diff) : "-"}
              </SummaryItem>
            )}
          </dl>
        </section>

        <div className="mt-5 space-y-5">
          {move ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="move-zone">โซนที่ต้องการย้าย</Label>
                <Select value={zone} onValueChange={setZone}>
                  <SelectTrigger id="move-zone" className="w-full bg-card">
                    <SelectValue placeholder="เลือกโซนปลายทาง" />
                  </SelectTrigger>
                  <SelectContent>
                    {home.zones
                      .filter((z) => z !== lot.zone)
                      .map((z) => (
                        <SelectItem key={z} value={z}>
                          {z}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="move-pieces">จำนวนที่ต้องการย้าย (ชิ้น)</Label>
                <NumberStepper id="move-pieces" value={pieces} max={lotPieces(lot)} onChange={setPieces} />
                <p className="text-sm text-muted-foreground">ย้ายได้มากสุด {formatQty(lotPieces(lot))} ชิ้น</p>
              </div>
            </>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="adjust-count">นับจำนวนจริง (ชิ้น)</Label>
              <NumberStepper
                id="adjust-count"
                value={counted}
                max={lotPieces(lot) * 2}
                onChange={(v) => {
                  setCounted(v);
                  setTouched(true);
                }}
              />
              <p className="text-sm text-muted-foreground">ในระบบมี {formatQty(lotPieces(lot))} ชิ้น</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="lot-note">{move ? "หมายเหตุการย้าย" : "หมายเหตุการปรับปรุง"}</Label>
            <Textarea
              id="lot-note"
              rows={3}
              placeholder={!move && touched && diff !== 0 ? "ระบุเหตุผลที่ยอดไม่ตรง" : "หมายเหตุ"}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="bg-card"
            />
          </div>
        </div>
      </main>

      <div className="sticky bottom-0 z-30 border-t border-border bg-surface">
        <div className="mx-auto w-full max-w-3xl px-4 py-3 sm:px-6">
          <div className="grid grid-cols-2 gap-3 sm:flex sm:justify-between">
            <Button variant="outline-primary" className="sm:w-32" onClick={leave}>
              ย้อนกลับ
            </Button>
            <Button className="sm:w-32" disabled={!canSave} onClick={save}>
              บันทึก
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryItem({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div>
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className={cn("mt-1 font-semibold tabular-nums", className)}>{children}</dd>
    </div>
  );
}

/**
 * ช่องกรอกจำนวนแบบมีปุ่มลบ/บวก
 * กรอกเองก็ได้ ปุ่มไว้ปรับทีละหน่วยตอนใช้บนมือถือ
 * บังคับให้อยู่ในช่วง 0 ถึง max เสมอ กันกรอกเกินของที่มีจริง
 */
function NumberStepper({
  id,
  value,
  max,
  onChange,
}: {
  id: string;
  value: number;
  max: number;
  onChange: (v: number) => void;
}) {
  const clamp = (v: number) => Math.min(max, Math.max(0, v));
  return (
    <div className="flex items-center rounded-md border border-input bg-card shadow-xs">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="ลดลง"
        disabled={value <= 0}
        onClick={() => onChange(clamp(value - 1))}
      >
        <MinusIcon />
      </Button>
      <Input
        id={id}
        inputMode="numeric"
        value={value}
        onChange={(e) => {
          const n = Number(e.target.value.replace(/[^\d]/g, ""));
          onChange(clamp(Number.isNaN(n) ? 0 : n));
        }}
        className="border-0 bg-transparent text-center font-semibold tabular-nums shadow-none focus-visible:ring-0 dark:bg-transparent"
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="เพิ่มขึ้น"
        disabled={value >= max}
        onClick={() => onChange(clamp(value + 1))}
      >
        <PlusIcon />
      </Button>
    </div>
  );
}

function NotFound() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 pt-6 pb-24 sm:px-6">
      <Crumbs trail={[{ label: "สต็อกทั่วไป", href: "/stock" }, { label: "ไม่พบล็อต" }]} />
      <div className="mt-10 rounded-xl border border-dashed border-border px-6 py-14 text-center">
        <p className="font-medium">ไม่พบล็อตนี้</p>
        <p className="mt-1 text-sm text-muted-foreground">ล็อตอาจถูกย้ายออกหมดแล้ว หรือลิงก์ไม่ถูกต้อง</p>
        <Button asChild variant="outline-primary" className="mt-4">
          <Link href="/stock">กลับไปหน้าสต็อก</Link>
        </Button>
      </div>
    </main>
  );
}
