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

/** หน่วยที่มีทศนิยม (ตัน ลิตร กก.) นับเป็นชิ้น — หน่วยนับอยู่แล้ว (ชิ้น ขวด) นับตามหน่วยนั้นเลย ไม่มี .00 */
const DECIMAL_UNITS = new Set(["ตัน", "ลิตร", "กก."]);

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
  const decimal = DECIMAL_UNITS.has(unit);
  const pieceUnit = decimal ? "ชิ้น" : unit;
  const fmt = decimal ? formatAmount : formatQty;
  const max = lotPieces(lot);

  // ย้าย — ตั้งต้นย้ายทั้งล็อต (กรณีที่เจอบ่อยสุด) คงเหลือยังเป็นขีดจนกว่าจะแก้จำนวน
  const [zone, setZone] = React.useState("");
  const [pieces, setPieces] = React.useState(max);
  // ปรับปรุง
  const [counted, setCounted] = React.useState(0);
  const [touched, setTouched] = React.useState(false);
  const [note, setNote] = React.useState("");
  // ข้อความเตือนช่องว่างขึ้นหลังกดบันทึกครั้งแรก — ยอดเกินสต็อกเตือนทันทีที่พิมพ์
  const [submitted, setSubmitted] = React.useState(false);

  const diff = countDiff(lot, counted);

  const errors = {
    zone: move && submitted && !zone ? "กรุณาเลือกโซน" : undefined,
    pieces: move
      ? pieces > max
        ? `กรุณาระบุจำนวนไม่เกินสต็อกที่มีอยู่ ${formatQty(max)} ${pieceUnit}`
        : submitted && pieces <= 0
          ? "กรุณาระบุจำนวน"
          : undefined
      : submitted && !touched
        ? "กรุณาระบุปริมาณ"
        : undefined,
    // ย้ายหรือปรับปรุงต้องบอกเหตุผลเสมอ ไม่งั้นตรวจย้อนหลังไม่ได้
    note: submitted && !note.trim() ? (move ? "กรุณาระบุหมายเหตุการย้าย" : "กรุณาระบุหมายเหตุการปรับปรุง") : undefined,
  };
  const valid = move
    ? Boolean(zone) && pieces > 0 && pieces <= max && note.trim() !== ""
    : touched && note.trim() !== "";

  // เปิดตรงจากลิงก์ (ไม่มีหน้าก่อนหน้า) ย้อนกลับแล้วไปหน้ารายการแทน
  const leave = () => (window.history.length > 1 ? router.back() : router.push(home.href));

  const save = () => {
    setSubmitted(true);
    if (!valid) return;
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
        note: note.trim(),
        requester: ACTOR,
        actor: ACTOR,
        status: "move",
      });
      toast.success("ย้ายสต็อกสำเร็จ", { description: `สินค้า: ${productName}` });
    } else {
      appendStockLog(scope, {
        code: `ADJ${tag}/01`,
        lotNumber: lot.code,
        productName,
        // ประวัติบันทึก "ส่วนต่าง" ไม่ใช่ยอดที่นับได้ เพราะสิ่งที่เปลี่ยนคือส่วนต่าง
        doneCount: counted - max,
        doneQty: diff,
        unit,
        zone: lot.zone,
        note: note.trim(),
        requester: ACTOR,
        actor: ACTOR,
        status: "adjust",
      });
      toast.success("ปรับปรุงสต็อกสำเร็จ", { description: `สินค้า: ${productName}` });
    }
    leave();
  };

  const stockLabel = `${decimal ? "ปริมาณ" : "จำนวน"}ในคลัง (${unit})`;
  const movedTouched = pieces !== max;

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col">
      <main className="@container mx-auto w-full max-w-7xl flex-1 px-4 pt-6 pb-6 sm:px-6">
        <Crumbs trail={[{ label: home.label, href: home.href }, { label: TITLE[action] }]} />

        <h1 className="mt-4 text-2xl font-bold tracking-tight">{TITLE[action]}</h1>

        {/* การ์ดล็อต — จอกว้าง: โซน+สินค้าซ้าย เลขล็อต+วันที่รับขวา / จอแคบ: เส้นคั่นแล้วเรียงลงมา */}
        <section className="mt-5 rounded-xl border border-border bg-card p-4">
          <div className="flex flex-col @3xl:flex-row @3xl:items-center @3xl:justify-between @3xl:gap-6">
            <div className="flex min-w-0 items-center gap-2 border-b border-border pb-4 @3xl:border-0 @3xl:pb-0">
              <span className="shrink-0 rounded-full bg-muted px-3 py-1 text-sm font-semibold text-primary">
                {lot.zone}
              </span>
              <p className="min-w-0 truncate font-semibold" title={productName}>
                {productName}
              </p>
            </div>
            <p className="mt-4 text-sm @3xl:mt-0 @3xl:shrink-0 @3xl:text-right">
              <span className="block font-semibold @3xl:mr-3 @3xl:inline">{lot.code}</span>
              <span className="text-muted-foreground">
                รับ {lot.receivedAt} ({lot.ageDays} วัน) · {lot.packNote}
              </span>
            </p>
          </div>

          <dl className="mt-4 grid grid-cols-2 gap-6 rounded-xl border border-brand-hover bg-brand px-4 py-5">
            <SummaryItem label={stockLabel}>{fmt(lot.qty)}</SummaryItem>
            {move ? (
              <SummaryItem label={`คงเหลือในคลัง (${unit})`}>
                {movedTouched && pieces <= max ? fmt(qtyAfterMove(lot, pieces)) : "-"}
              </SummaryItem>
            ) : (
              // ยังไม่ได้นับก็ยังไม่มีส่วนต่าง แสดงขีดไว้ก่อน พอนับแล้วขาดเป็นแดง เกินเป็นเขียว
              <SummaryItem
                label={`ส่วนต่าง (${unit})`}
                className={cn(
                  touched && diff < 0 && "text-danger-strong",
                  touched && diff > 0 && "text-success-strong"
                )}
              >
                {touched ? fmt(diff) : "-"}
              </SummaryItem>
            )}
          </dl>
        </section>

        <div className="mt-5 space-y-5">
          <div className="grid gap-5 @3xl:grid-cols-2 @3xl:gap-4">
            {move ? (
              <>
                <Field id="move-zone" label="โซนที่ต้องการย้าย" error={errors.zone}>
                  <Select value={zone} onValueChange={setZone}>
                    <SelectTrigger
                      id="move-zone"
                      aria-invalid={Boolean(errors.zone)}
                      className={cn("w-full bg-card", errors.zone && "border-danger-strong")}
                    >
                      <SelectValue placeholder="เลือกโซน" />
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
                </Field>
                <Field id="move-pieces" label={`จำนวนที่ต้องการย้าย (${pieceUnit})`} error={errors.pieces}>
                  <NumberStepper id="move-pieces" value={pieces} invalid={Boolean(errors.pieces)} onChange={setPieces} />
                </Field>
              </>
            ) : (
              <Field id="adjust-count" label={`นับจำนวนจริง (${pieceUnit})`} error={errors.pieces}>
                <NumberStepper
                  id="adjust-count"
                  value={counted}
                  invalid={Boolean(errors.pieces)}
                  onChange={(v) => {
                    setCounted(v);
                    setTouched(true);
                  }}
                />
              </Field>
            )}
          </div>

          <Field id="lot-note" label={move ? "หมายเหตุการย้าย" : "หมายเหตุการปรับปรุง"} error={errors.note}>
            <Textarea
              id="lot-note"
              rows={3}
              placeholder={errors.note ? "ระบุหมายเหตุ" : "หมายเหตุ"}
              value={note}
              aria-invalid={Boolean(errors.note)}
              onChange={(e) => setNote(e.target.value)}
              className={cn("bg-card", errors.note && "border-danger-strong")}
            />
          </Field>
        </div>
      </main>

      <div className="sticky bottom-0 z-30 border-t border-border bg-surface">
        <div className="mx-auto w-full max-w-7xl px-4 py-3 sm:px-6">
          <div className="grid grid-cols-2 gap-3 sm:flex sm:justify-between">
            <Button variant="outline-primary" className="sm:w-auto sm:min-w-20" onClick={leave}>
              ย้อนกลับ
            </Button>
            <Button className="sm:w-auto sm:min-w-20" onClick={save}>
              บันทึก
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** ช่องฟอร์ม — มีข้อผิดพลาดแล้วหัวช่องเป็นแดง ข้อความเตือนอยู่ใต้ช่อง */
function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className={cn(error && "text-danger-strong")}>
        {label}
      </Label>
      {children}
      {error && <p className="text-sm text-danger-strong">{error}</p>}
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
    <div className="min-w-0">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className={cn("mt-1 font-semibold tabular-nums", className)}>{children}</dd>
    </div>
  );
}

/**
 * ช่องกรอกจำนวนแบบมีปุ่มลบ/บวก
 * กรอกเองก็ได้ ปุ่มไว้ปรับทีละหน่วยตอนใช้บนมือถือ
 * ไม่ตัดเพดานให้เอง — กรอกเกินสต็อกแล้วขึ้นข้อความเตือนแทน ผู้ใช้จะได้รู้ว่าทำไมบันทึกไม่ได้
 */
function NumberStepper({
  id,
  value,
  invalid,
  onChange,
}: {
  id: string;
  value: number;
  invalid?: boolean;
  onChange: (v: number) => void;
}) {
  const clamp = (v: number) => Math.max(0, v);
  return (
    <div
      className={cn(
        "flex items-center rounded-md border border-input bg-card shadow-xs",
        invalid && "border-danger-strong"
      )}
    >
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
        aria-invalid={invalid}
        onChange={(e) => {
          const n = Number(e.target.value.replace(/[^\d]/g, ""));
          onChange(clamp(Number.isNaN(n) ? 0 : n));
        }}
        className="border-0 bg-transparent text-center tabular-nums shadow-none focus-visible:ring-0 aria-invalid:ring-0 dark:bg-transparent"
      />
      <Button type="button" variant="ghost" size="icon" aria-label="เพิ่มขึ้น" onClick={() => onChange(value + 1)}>
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
