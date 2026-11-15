"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Trash2Icon } from "lucide-react";
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
import { Badge } from "@peckey954/ui/components/ui/badge";
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
import { Crumbs } from "@/components/receiving/parts";
import { TableFrame } from "@/components/stock/doc-parts";
import { ACTOR, DECIMAL_UNITS, Field, SCOPES, type LotAction } from "./lot-action";
import { CaptureTile, ScannerDialog, useLotScanner } from "./lot-scan";
import { appendStockLog, type StockScope } from "./stock-log";
import {
  CATEGORIES,
  formatAmount,
  formatQty,
  lotPieces,
  piecesToQty,
  productTotal,
  type Lot,
  type Product,
} from "@/lib/general-stock";
import { GOODS_CATEGORIES } from "@/lib/goods-stock";

/* ------------------------------------------------------------------
   ย้าย / ปรับปรุง — เปิดจากปุ่ม ⋮ บนหัวหน้าสต็อก
   (Figma: Flow ปรับปรุงสต็อกแบบหลายรายการ)

   หนึ่งใบ = สินค้าเดียว หลาย Lot — เพิ่ม Lot ได้ทางสแกนอย่างเดียว ไม่มีช่องพิมพ์/เลือก Lot
     1. เข้าหน้าแล้วกล้องเปิดเลย อ่านทีละป้าย (ในกล้อง/กล่องสแกนเลือกรูปได้หลายรูป)
     2. ป้ายแรกกำหนดสินค้าของใบ ป้ายต่อไปต้องเป็นสินค้าเดียวกัน
        คนละสินค้าขึ้น error ไม่เพิ่มเข้าใบ — ลบ Lot ออกหมดแล้วสแกนสินค้าอื่นได้ใหม่
     3. กรอกจำนวนต่อ Lot (ย้าย: เลือกล็อคปลายทาง) แล้วบันทึกทีเดียว — ประวัติได้หนึ่งแถวต่อ Lot

   ปรับปรุง: กรอกแค่จำนวนชิ้นที่นับได้จริง (ไม่ชั่งใหม่) ส่วนต่างแปลงเป็นหน่วยสินค้าจากน้ำหนักต่อชิ้น
             ขึ้นเขียว (เกิน) / แดง (ขาด)
   ย้าย: ตั้งต้นย้ายทั้ง Lot แก้ลดได้ เกินคงเหลือเตือนทันที
------------------------------------------------------------------ */

const PHOTO_INPUT_ID = "bulk-photo";

const TITLE: Record<LotAction, string> = { move: "ย้ายสต็อก", adjust: "ปรับปรุงสต็อก" };
const PREFIX: Record<LotAction, string> = { move: "MV", adjust: "ADJ" };

const CATEGORY_LABEL = Object.fromEntries(
  [...CATEGORIES, ...GOODS_CATEGORIES].map((c) => [c.id, c.label])
) as Record<string, string>;

const pad = (n: number) => String(n).padStart(2, "0");

/** เลขที่ใบ — ใช้วันที่เครื่องผู้ใช้ */
function openStamp(action: LotAction) {
  const d = new Date();
  const ymd = `${String(d.getFullYear()).slice(2)}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
  return { code: `${PREFIX[action]}${ymd}/01` };
}

/** น้ำหนักต่อชิ้นต่อท้าย ถ้าบรรจุภัณฑ์ยังไม่ได้บอก (Bulk) */
export function productTags(p: Product) {
  const kg = p.lots.find((l) => l.kgPerPiece)?.kgPerPiece;
  const weight = kg && !p.packing.includes("กก.") ? `${kg} กก.` : undefined;
  return [CATEGORY_LABEL[p.category], p.packing, weight].filter((t): t is string => Boolean(t));
}

const lotLine = (l: Lot) => `รับ ${l.receivedAt} (${l.ageDays} วัน) · ${l.packNote}`;

export function BulkLotPage({ scope, action }: { scope: StockScope; action: string }) {
  if (action !== "move" && action !== "adjust") return null;
  return <BulkSheet key={`${scope}-${action}`} scope={scope} action={action} />;
}

function BulkSheet({ scope, action }: { scope: StockScope; action: LotAction }) {
  const router = useRouter();
  const home = SCOPES[scope];
  const move = action === "move";
  const [opened] = React.useState(() => openStamp(action));

  const [productId, setProductId] = React.useState("");
  const [zone, setZone] = React.useState("");
  /** ลำดับที่เพิ่มเข้ามา — แถวเรียงตามนี้ ไม่กระโดดสลับที่ */
  const [picked, setPicked] = React.useState<string[]>([]);
  /** จำนวนต่อ Lot (ชิ้น) เก็บเป็นข้อความตามที่พิมพ์ — ว่าง = ยังไม่ได้กรอก */
  const [counts, setCounts] = React.useState<Record<string, string>>({});
  const [note, setNote] = React.useState("");
  const [submitted, setSubmitted] = React.useState(false);

  const product = home.products.find((p) => p.id === productId);
  const unit = product?.unit ?? "ตัน";
  const decimal = DECIMAL_UNITS.has(unit);
  const pieceUnit = decimal ? "ชิ้น" : unit;
  const fmt = decimal ? formatAmount : formatQty;

  // สแกนเจอได้ทุก Lot ของคลัง — Lot ของสินค้าอื่นนับเป็นคนละสินค้า ไม่ใช่ไม่พบ
  const ownerOf = (lotId: string): Product | undefined =>
    home.products.find((p) => p.lots.some((l) => l.id === lotId));
  const scanPool = React.useMemo(() => home.products.flatMap((p) => p.lots), [home]);

  /** Lot ใหม่ย้ายทั้ง Lot เป็นค่าตั้งต้น — ปรับปรุงเว้นว่างไว้ให้นับเอง */
  const addLots = (lots: Lot[]) => {
    // Lot ล่าสุดอยู่บนสุดตามแบบ
    setPicked((prev) => [...lots.map((l) => l.id).filter((id) => !prev.includes(id)), ...prev]);
    if (move)
      setCounts((prev) => {
        const next = { ...prev };
        for (const l of lots) if (next[l.id] === undefined) next[l.id] = String(lotPieces(l));
        return next;
      });
  };

  const scan = useLotScanner({
    lots: scanPool,
    picked,
    onAdd: (lot) => {
      if (!productId) {
        // ป้ายแรกของใบ — กำหนดสินค้า
        setProductId(ownerOf(lot.id)?.id ?? "");
        setPicked([lot.id]);
        setCounts(move ? { [lot.id]: String(lotPieces(lot)) } : {});
        return;
      }
      addLots([lot]);
    },
    reject: (lot) => {
      const owner = ownerOf(lot.id);
      return product && owner && owner.id !== product.id ? "กรุณาสแกน Lot ของสินค้าเดียวกัน" : undefined;
    },
    rejectLabel: "สินค้าไม่ตรงกัน",
    describe: (l) => `${l.code} · ${fmt(l.qty)} ${ownerOf(l.id)?.unit ?? unit}`,
    inputId: PHOTO_INPUT_ID,
  });

  // สแกนได้เลย — เข้าหน้าแล้วเปิดกล้องทันที
  const { setScannerOpen } = scan;
  const autoOpened = React.useRef(false);
  React.useEffect(() => {
    if (autoOpened.current) return;
    autoOpened.current = true;
    setScannerOpen(true);
  }, [setScannerOpen]);

  /** เอา Lot สุดท้ายออกแล้ว ใบว่าง — ปลดสินค้าให้สแกนสินค้าอื่นได้ */
  /** Lot ที่กดถังขยะ รอยืนยันก่อนเอาออก (ตามแบบ) */
  const [pendingRemove, setPendingRemove] = React.useState<Lot>();
  const remove = (id: string) => {
    const next = picked.filter((x) => x !== id);
    setPicked(next);
    if (next.length === 0) {
      setProductId("");
      setCounts({});
    }
  };
  const setCount = (id: string, v: string) => setCounts((prev) => ({ ...prev, [id]: v.replace(/\D/g, "") }));

  // ---------- แถวและยอดรวม ----------

  const rows = picked.flatMap((id) => {
    const lot = product?.lots.find((l) => l.id === id);
    if (!lot) return [];
    const raw = counts[id] ?? "";
    const n = Number(raw) || 0;
    const max = lotPieces(lot);
    const filled = raw !== "";
    // ส่วนต่าง (ปรับปรุง) หรือ ปริมาณที่ย้ายออก (ย้าย) ในหน่วยของสินค้า
    const amount = move ? piecesToQty(lot, Math.min(n, max)) : filled ? piecesToQty(lot, n) - lot.qty : 0;
    const error = move
      ? n > max
        ? `เกินคงเหลือ ${formatQty(max)} ${pieceUnit}`
        : submitted && n <= 0
          ? "กรอกจำนวน"
          : submitted && zone && lot.zone === zone
            ? "อยู่ล็อคนี้แล้ว"
            : undefined
      : submitted && !filled
        ? "กรอกจำนวน"
        : undefined;
    return [{ lot, raw, n, filled, amount, error }];
  });
  const anyFilled = rows.some((r) => r.filled);
  const total = rows.reduce((s, r) => s + r.amount, 0);

  const errors = {
    zone: move && submitted && !zone ? "กรุณาเลือกล็อค" : undefined,
    lots: submitted && rows.length === 0 ? "กรุณาสแกน Lot อย่างน้อย 1 รายการ" : undefined,
    note: submitted && !note.trim() ? (move ? "กรุณาระบุหมายเหตุการย้าย" : "กรุณาระบุหมายเหตุการปรับปรุง") : undefined,
  };

  // เปิดตรงจากลิงก์ (ไม่มีหน้าก่อนหน้า) ย้อนกลับแล้วไปหน้ารายการแทน
  const leave = () => (window.history.length > 1 ? router.back() : router.push(home.href));

  const save = () => {
    setSubmitted(true);
    const rowsOk = rows.every((r) =>
      move ? r.n > 0 && r.n <= lotPieces(r.lot) && r.lot.zone !== zone : r.filled
    );
    if (!product || (move && !zone) || rows.length === 0 || !rowsOk || !note.trim()) return;
    // ประวัติเพิ่มรายการใหม่ไว้บนสุดทีละแถว วนจากท้ายเพื่อให้ Lot เรียงตามที่เลือก
    for (const r of [...rows].reverse()) {
      appendStockLog(scope, {
        code: opened.code,
        lotNumber: r.lot.code,
        productName: product.name,
        ...(move
          ? { askedCount: r.n, doneCount: r.n, doneQty: r.amount, zoneTo: zone }
          : // ประวัติบันทึก "ส่วนต่าง" ไม่ใช่ยอดที่นับได้ เพราะสิ่งที่เปลี่ยนคือส่วนต่าง
            { doneCount: r.n - lotPieces(r.lot), doneQty: r.amount }),
        unit,
        zone: r.lot.zone,
        note: note.trim(),
        requester: ACTOR,
        actor: ACTOR,
        status: action,
      });
    }
    toast.success(move ? "ย้ายสต็อกสำเร็จ" : "ปรับปรุงสต็อกสำเร็จ", {
      description: `สินค้า: ${product.name} · ${rows.length} Lot`,
    });
    leave();
  };

  const stockLabel = `${decimal ? "ปริมาณ" : "จำนวน"}ในคลัง (${unit})`;
  const amountLabel = move ? `${decimal ? "ปริมาณ" : "จำนวน"}ย้าย (${unit})` : `ส่วนต่าง (${unit})`;
  const inputLabel = move ? `จำนวนย้าย (${pieceUnit})` : `นับจำนวนจริง (${pieceUnit})`;
  /** ย้ายสินค้าหน่วยนับเป็นชิ้น/ขวด: ยอดย้ายเท่ากับช่องกรอก จึงไม่โชว์ซ้ำในแถว Lot */
  const showRowAmount = !move || decimal;
  const signed = (v: number) => `${v > 0 ? "+" : ""}${fmt(v)}`;
  const diffTone = (v: number) => cn(v > 0 && "text-success-strong", v < 0 && "text-danger-strong");

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col">
      <main className="@container mx-auto w-full max-w-7xl flex-1 px-4 pt-6 pb-6 sm:px-6">
        <Crumbs trail={[{ label: home.label, href: home.href }, { label: TITLE[action] }]} />

        <h1 className="mt-4 text-2xl font-bold tracking-tight" suppressHydrationWarning>
          {TITLE[action]} {opened.code}
        </h1>

        <div className="mt-5 space-y-5">
          {/* การ์ดสินค้า — ยอดรวมทั้งสินค้า กับยอดที่ใบนี้จะเปลี่ยน */}
          {product && (
            <section className="rounded-xl border border-border bg-card p-4">
              <p className="font-semibold">{product.name}</p>
              {/* ตามแบบ: ประเภท | บรรจุภัณฑ์ | น้ำหนักต่อชิ้น */}
              <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                {productTags(product).map((t, i) => (
                  <React.Fragment key={t}>
                    {i > 0 && <span className="h-3.5 w-px bg-border" aria-hidden />}
                    <span>{t}</span>
                  </React.Fragment>
                ))}
              </p>
              <dl className="mt-4 grid grid-cols-2 gap-6 rounded-xl border border-brand-hover bg-brand px-4 py-5">
                <Summary label={stockLabel}>{fmt(productTotal(product))}</Summary>
                <Summary label={amountLabel} className={move ? undefined : diffTone(total)}>
                  {rows.length === 0 || (!move && !anyFilled) ? "-" : move ? fmt(total) : signed(total)}
                </Summary>
              </dl>
            </section>
          )}

          {/* ข้อความตามแบบ Figma */}
          <CaptureTile scan={scan} prompt="สแกนเลขที่เพื่อเลือกล็อครับสินค้าเข้าคลัง" />

          {/* ตามแบบ: การ์ดสินค้า → กล่องสแกน → ล็อค → Lot */}
          {move && (
            <div className="@3xl:max-w-[calc(50%-0.5rem)]">
              <Field id="bulk-zone" label="ล็อคที่ต้องการย้าย" error={errors.zone}>
                <Select value={zone} onValueChange={setZone}>
                  <SelectTrigger
                    id="bulk-zone"
                    aria-invalid={Boolean(errors.zone)}
                    className={cn("w-full bg-card", errors.zone && "border-danger-strong")}
                  >
                    <SelectValue placeholder="เลือกล็อค" />
                  </SelectTrigger>
                  <SelectContent>
                    {home.zones.map((z) => (
                      <SelectItem key={z} value={z}>
                        {z}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
          )}

          {rows.length === 0 ? (
            <div
              className={cn(
                "flex h-40 flex-col items-center justify-center gap-1 rounded-xl border bg-card text-center",
                errors.lots ? "border-danger-strong" : "border-border"
              )}
            >
              <p className="text-lg font-bold">ไม่มีข้อมูล</p>
              <p className={errors.lots ? "text-danger-strong" : "text-muted-foreground"}>
                {errors.lots ?? "กรุณาเพิ่ม Lot"}
              </p>
            </div>
          ) : (
            <section className="space-y-3">
              <h2 className="font-semibold">Lot ({rows.length} รายการ)</h2>
              {/* ---------- จอกว้าง: ตาราง ---------- */}
              <div className="hidden @3xl:block">
                <TableFrame>
                  <Table>
                    <TableHeader>
                      <TableRow className="[&>th]:whitespace-pre-line [&>th]:align-bottom [&>th]:py-2">
                        <TableHead>Lot</TableHead>
                        <TableHead className="w-24">ล็อค</TableHead>
                        <TableHead className="w-28">บรรจุภัณฑ์</TableHead>
                        <TableHead className="w-32 text-right">
                          {stockLabel.replace(/ \(/, "\n(")}
                        </TableHead>
                        {showRowAmount && (
                          <TableHead className="w-32 text-right">{amountLabel.replace(/ \(/, "\n(")}</TableHead>
                        )}
                        <TableHead className="w-36 text-right">{inputLabel.replace(/ \(/, "\n(")}</TableHead>
                        <TableHead className="w-12">
                          <span className="sr-only">ลบ</span>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map((r) => (
                        <TableRow key={r.lot.id} className={cn(scan.flashId === r.lot.id && "bg-brand")}>
                          <TableCell className="align-top">
                            <span className="block font-medium">{r.lot.code}</span>
                            <span className="block text-sm text-muted-foreground">{lotLine(r.lot)}</span>
                          </TableCell>
                          <TableCell className="align-top">
                            <ZoneBadge zone={r.lot.zone} />
                          </TableCell>
                          <TableCell className="align-top">{product?.packing || "-"}</TableCell>
                          <TableCell className="text-right align-top tabular-nums">{fmt(r.lot.qty)}</TableCell>
                          {showRowAmount && (
                            <TableCell
                              className={cn("text-right align-top tabular-nums", !move && r.filled && diffTone(r.amount))}
                            >
                              {move ? fmt(r.amount) : r.filled ? signed(r.amount) : "-"}
                            </TableCell>
                          )}
                          <TableCell className="align-top">
                            <CountInput
                              id={`bulk-count-${r.lot.id}`}
                              label={`${inputLabel} ${r.lot.code}`}
                              value={r.raw}
                              error={r.error}
                              onChange={(v) => setCount(r.lot.id, v)}
                            />
                          </TableCell>
                          <TableCell className="align-top">
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={`เอา ${r.lot.code} ออก`}
                              onClick={() => setPendingRemove(r.lot)}
                            >
                              <Trash2Icon />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableFrame>
              </div>

              {/* ---------- จอแคบ: การ์ดต่อ Lot ---------- */}
              <div className="space-y-3 @3xl:hidden">
                {rows.map((r) => (
                  <div
                    key={r.lot.id}
                    className={cn(
                      "rounded-xl border border-border bg-card p-4",
                      scan.flashId === r.lot.id && "ring-2 ring-primary"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <ZoneBadge zone={r.lot.zone} />
                      <span className="min-w-0 flex-1 truncate font-semibold">{r.lot.code}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`เอา ${r.lot.code} ออก`}
                        onClick={() => setPendingRemove(r.lot)}
                      >
                        <Trash2Icon />
                      </Button>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{lotLine(r.lot)}</p>
                    <dl className="mt-3 space-y-1.5 border-t border-border pt-3 text-sm">
                      <div className="flex justify-between gap-3">
                        <dt className="text-muted-foreground">{stockLabel}:</dt>
                        <dd className="font-semibold tabular-nums">{fmt(r.lot.qty)}</dd>
                      </div>
                      {showRowAmount && (
                        <div className="flex justify-between gap-3">
                          <dt className="text-muted-foreground">{amountLabel}:</dt>
                          <dd className={cn("font-semibold tabular-nums", !move && r.filled && diffTone(r.amount))}>
                            {move ? fmt(r.amount) : r.filled ? signed(r.amount) : "-"}
                          </dd>
                        </div>
                      )}
                    </dl>
                    <div className="mt-3 flex items-start justify-between gap-3">
                      <Label htmlFor={`m-bulk-count-${r.lot.id}`} className="mt-2.5 font-normal text-muted-foreground">
                        {inputLabel}:
                      </Label>
                      <CountInput
                        id={`m-bulk-count-${r.lot.id}`}
                        className="w-40"
                        value={r.raw}
                        error={r.error}
                        onChange={(v) => setCount(r.lot.id, v)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <Field id="bulk-note" label={move ? "หมายเหตุการย้าย" : "หมายเหตุการปรับปรุง"} error={errors.note}>
            <Textarea
              id="bulk-note"
              rows={3}
              placeholder={errors.note ? "ระบุหมายเหตุ" : "หมายเหตุ"}
              value={note}
              aria-invalid={Boolean(errors.note)}
              onChange={(e) => setNote(e.target.value)}
              className={cn("bg-card", errors.note && "border-danger-strong")}
            />
          </Field>
        </div>

        <ScannerDialog scan={scan} />

        <RemoveLotDialog
          code={pendingRemove?.code}
          onClose={() => setPendingRemove(undefined)}
          onConfirm={() => pendingRemove && remove(pendingRemove.id)}
        />
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

/** ยืนยันก่อนเอา Lot ออกจากใบ (ตามแบบ) — code ว่าง = ปิดอยู่ */
export function RemoveLotDialog({
  code,
  onClose,
  onConfirm,
}: {
  code?: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog open={code !== undefined} onOpenChange={(o) => !o && onClose()}>
      <AlertDialogContent size="sm" className="data-[size=sm]:max-w-[22rem]">
        <AlertDialogHeader className="text-center sm:text-center">
          <AlertDialogTitle>คุณต้องการลบ Lot ใช่ไหม?</AlertDialogTitle>
          <AlertDialogDescription>
            Lot: {code}
            <br />
            หากลบแล้วจะไม่สามารถกู้คืนข้อมูลได้อีก
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel variant="outline-primary">ย้อนกลับ</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            ลบ
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function Summary({
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

export function ZoneBadge({ zone }: { zone: string }) {
  return (
    <Badge appearance="soft" className="shrink-0 whitespace-nowrap">
      {zone}
    </Badge>
  );
}

function CountInput({
  id,
  label,
  value,
  error,
  onChange,
  className,
}: {
  id: string;
  label?: string;
  value: string;
  error?: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  return (
    <div className={className}>
      <Input
        id={id}
        aria-label={label}
        inputMode="numeric"
        placeholder="0"
        aria-invalid={Boolean(error) || undefined}
        className={cn("bg-card text-right tabular-nums", error && "border-danger-strong")}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {error && <p className="mt-1 text-right text-xs text-danger-strong">{error}</p>}
    </div>
  );
}
