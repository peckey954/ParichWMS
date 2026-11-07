"use client";

import * as React from "react";
import { Trash2Icon } from "lucide-react";
import { Badge } from "@peckey954/ui/components/ui/badge";
import { Button } from "@peckey954/ui/components/ui/button";
import { Input } from "@peckey954/ui/components/ui/input";
import { Label } from "@peckey954/ui/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@peckey954/ui/components/ui/radio-group";
import { Textarea } from "@peckey954/ui/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@peckey954/ui/components/ui/table";
import { cn } from "@peckey954/ui/lib/utils";
import { MultiSelectChips } from "@/components/multi-select-chips";
import { TableFrame } from "@/components/stock/doc-parts";
import { CaptureTile, ScannerDialog, useLotScanner } from "@/components/stock/lot-scan";
import {
  LOW_LOT_TONS,
  formatCount,
  formatTons,
  isCountUnit,
  lotTons,
  lotsFor,
  requestCount,
  requestTons,
  type GoodsIssueDoc,
  type GoodsLot,
} from "@/lib/goods-issue";

/* ------------------------------------------------------------------
   เลือก Lot ที่จะจ่ายออก — ตาม Flow จ่ายออก ใน Figma

   สามทางเข้า ได้ผลเดียวกันคือ Lot เพิ่มเข้ารายการจ่าย
     สแกนเลขที่สินค้า  เปิดกล้อง อ่านป้ายติดแล้วปิดเอง
     สแกนจากรูปภาพ    หยิบรูปป้ายที่ถ่ายไว้ เลือกได้หลายรูป อ่านแล้วทิ้งรูป
     เลือก Lot        ดรอปดาวน์ค้นหาได้ ติ๊กได้หลาย Lot

   กล้องกับรูปใช้ชิ้นส่วนชุดเดียวกับหน้าเลือกโซนรับเข้า (zone-assign)
   ผลบอกด้วย toast ด้านบน 3 วินาที ไม่ทับปุ่มบันทึก/ย้อนกลับ

   Lot ที่เพิ่มเข้ามาตั้งจำนวนจ่ายให้เลย เท่าที่ยังขาดจากยอดขอเบิก
   ไม่เกินที่ Lot นั้นมี — ส่วนใหญ่กดบันทึกได้ทันที แก้ตัวเลขได้ถ้าหยิบจริงไม่ตรง

   ใบจ่ายภายในมีสถานะการจ่าย — "ไม่สามารถจ่ายได้" ปิดช่องจำนวนทั้งหมด (เป็น -)
   และบังคับเหตุผล จ่ายสำเร็จแต่ได้น้อยกว่าที่ขอก็บังคับเหตุผลเช่นกัน

   สินค้าที่นับเป็นชิ้น/ขวด ไม่มีคอลัมน์ตัน — คงเหลือกับยอดจ่ายเป็นจำนวนตรง ๆ

   ---------- ยังเป็นของจำลอง ----------
   กล้องกับการถอดบาร์โค้ดยังไม่ได้ต่อของจริง "กล้อง" อ่านได้ Lot เก่าสุด
   ที่ยังไม่ได้เลือก (FIFO) ชิป "ผลจำลอง" สลับไปดูทางไม่พบสินค้าได้
------------------------------------------------------------------ */

const LOT_SELECT_ID = "issue-lot";
const PHOTO_INPUT_ID = "issue-photo";

export type IssueOutcome = "success" | "failed";

const lotLine = (l: GoodsLot, byCount: boolean) =>
  byCount
    ? `รับ ${l.receivedAt} (${l.ageDays} วัน)`
    : `รับ ${l.receivedAt} (${l.ageDays} วัน) · ${formatCount(l.pieces)} ชิ้น (${l.kgPerPiece} กก.)`;

export function useLotPick(doc: GoodsIssueDoc) {
  const lots = React.useMemo(() => lotsFor(doc), [doc]);
  const byCount = isCountUnit(doc.unit);
  /** ใบภายในต้องเลือกสถานะการจ่าย ใบภายนอกจ่ายได้อย่างเดียว */
  const withOutcome = doc.status === "issueInternal";
  const [outcome, setOutcome] = React.useState<IssueOutcome>("success");
  /** ลำดับที่เพิ่มเข้ามา — แถวในตารางเรียงตามนี้ ไม่กระโดดสลับที่ */
  const [picked, setPickedState] = React.useState<string[]>([]);
  /** จำนวนจ่าย (ชิ้น) ต่อ Lot เก็บเป็นข้อความตามที่พิมพ์ */
  const [counts, setCounts] = React.useState<Record<string, string>>({});
  const [note, setNote] = React.useState("");

  const pickedRef = React.useRef(picked);
  const countsRef = React.useRef(counts);

  React.useEffect(() => {
    pickedRef.current = picked;
    countsRef.current = counts;
  }, [picked, counts]);

  const lotOf = (id: string) => lots.find((l) => l.id === id);

  /** ชิ้นที่ยังขาดจากยอดขอเบิก หลังหักที่กรอกไว้แล้ว */
  const piecesStillNeeded = (current: Record<string, string>, ids: string[], kg: number) => {
    const need = byCount ? requestCount(doc) : Math.ceil((requestTons(doc) * 1000) / kg);
    const have = ids.reduce((s, id) => s + (Number(current[id]) || 0), 0);
    return Math.max(0, need - have);
  };

  /** ตั้งรายการ Lot ใหม่ทั้งชุด — Lot ที่เพิ่งเข้ามาได้จำนวนจ่ายตั้งต้นให้ */
  const setPicked = (next: string[]) => {
    const prev = pickedRef.current;
    const nextCounts: Record<string, string> = {};
    for (const id of next)
      if (countsRef.current[id] !== undefined) nextCounts[id] = countsRef.current[id];
    const kept = next.filter((id) => prev.includes(id));
    for (const id of next) {
      if (prev.includes(id)) continue;
      const lot = lotOf(id);
      if (!lot) continue;
      const left = piecesStillNeeded(nextCounts, kept, lot.kgPerPiece);
      nextCounts[id] = String(Math.min(lot.pieces, left));
      kept.push(id);
    }
    // เรียงตามที่เลือกจริง ของเดิมอยู่ที่เดิม ของใหม่ต่อท้าย
    const ordered = [...prev.filter((id) => next.includes(id)), ...next.filter((id) => !prev.includes(id))];
    pickedRef.current = ordered;
    countsRef.current = nextCounts;
    setPickedState(ordered);
    setCounts(nextCounts);
  };

  const remove = (id: string) => setPicked(pickedRef.current.filter((x) => x !== id));
  const setCount = (id: string, v: string) =>
    setCounts((prev) => ({ ...prev, [id]: v.replace(/\D/g, "") }));

  // ---------- สแกน ----------

  const scan = useLotScanner({
    lots,
    picked,
    onAdd: (lot) => setPicked([...pickedRef.current, lot.id]),
    describe: (one) =>
      `${one.code} · ${byCount ? `${formatCount(one.pieces)} ${doc.unit}` : `${formatTons(lotTons(one))} ตัน`}`,
    inputId: PHOTO_INPUT_ID,
    selectId: LOT_SELECT_ID,
  });

  // ---------- ยอดรวม ----------

  const failed = withOutcome && outcome === "failed";
  const pieceWord = byCount ? doc.unit : "ชิ้น";
  const rows = picked.map((id) => {
    const lot = lotOf(id)!;
    const raw = counts[id] ?? "";
    const n = failed ? 0 : Number(raw) || 0;
    const error = failed
      ? undefined
      : raw === "" || n === 0
        ? "กรอกจำนวน"
        : n > lot.pieces
          ? `เกินคงเหลือ ${formatCount(lot.pieces)} ${pieceWord}`
          : undefined;
    return { lot, raw, n, tons: (n * lot.kgPerPiece) / 1000, error };
  });
  const totalTons = rows.reduce((s, r) => s + r.tons, 0);
  const stockTons = rows.reduce((s, r) => s + lotTons(r.lot), 0);
  /** ยอดในหน่วยของใบ — ตัน หรือ ชิ้น/ขวด */
  const totalOut = byCount ? rows.reduce((s, r) => s + r.n, 0) : totalTons;
  const stockOut = byCount ? rows.reduce((s, r) => s + r.lot.pieces, 0) : stockTons;
  const requested = byCount ? requestCount(doc) : requestTons(doc);
  /** จ่ายสำเร็จแต่ได้ไม่ครบ — ภายในต้องบอกเหตุผล */
  const short = withOutcome && !failed && rows.length > 0 && totalOut < requested - 1e-9;
  const noteRequired = failed || short;
  const canSubmit = failed
    ? note.trim() !== ""
    : rows.length > 0 && rows.every((r) => !r.error) && (!noteRequired || note.trim() !== "");

  return {
    doc,
    lots,
    picked,
    setPicked,
    remove,
    setCount,
    note,
    setNote,
    scan,
    flashId: scan.flashId,
    rows,
    totalTons,
    stockTons,
    byCount,
    withOutcome,
    outcome,
    setOutcome,
    failed,
    short,
    noteRequired,
    totalOut,
    stockOut,
    requested,
    canSubmit,
  };
}

export type LotPick = ReturnType<typeof useLotPick>;

/** ทั้งชุดตั้งแต่กล่องสแกนลงไปถึงหมายเหตุ */
export function LotPickFields({ state }: { state: LotPick }) {
  const options = state.lots.map((l) => ({
    value: l.id,
    label: l.code,
    badge: <span className="text-primary">{l.zone}</span>,
    description: lotLine(l, state.byCount),
    keywords: [l.zone],
    meta: state.byCount ? (
      <span className="font-semibold tabular-nums">
        {formatCount(l.pieces)} <span className="font-normal text-foreground">{state.doc.unit}</span>
      </span>
    ) : (
      <span
        className={cn(
          "tabular-nums",
          lotTons(l) < LOW_LOT_TONS ? "text-danger-strong" : "font-semibold"
        )}
      >
        {formatTons(lotTons(l))} <span className="font-normal text-foreground">ตัน</span>
      </span>
    ),
  }));

  return (
    <div className="space-y-4">
      <CaptureTile scan={state.scan} prompt="สแกนเลขที่ติดบนสินค้าเพื่อเลือก Lot ที่จะจ่ายออก" />

      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        หรือ
        <span className="h-px flex-1 bg-border" />
      </div>

      <div className="scroll-mt-24 space-y-2">
        <Label htmlFor={LOT_SELECT_ID}>Lot</Label>
        <MultiSelectChips
          id={LOT_SELECT_ID}
          className="bg-card"
          options={options}
          value={state.picked}
          onValueChange={state.setPicked}
          placeholder="เลือก Lot"
          searchPlaceholder="ค้นหา"
          emptyText="ไม่พบ Lot ที่ค้นหา"
          hideSelectAll
        />
      </div>

      {state.rows.length === 0 ? (
        <div className="flex h-40 flex-col items-center justify-center gap-1 rounded-xl border border-border bg-card text-center">
          <p className="text-lg font-bold">ไม่มีข้อมูล</p>
          <p className="text-muted-foreground">กรุณาเพิ่ม Lot</p>
        </div>
      ) : (
        <>
          <LotCards state={state} />
          <LotTable state={state} />
        </>
      )}

      {state.withOutcome && (
        <div className="space-y-2">
          <Label>สถานะการจ่าย</Label>
          <RadioGroup
            value={state.outcome}
            onValueChange={(v) => state.setOutcome(v as IssueOutcome)}
            className="grid gap-3 @lg:grid-cols-2"
          >
            <RadioBox id="outcome-failed" value="failed">
              ไม่สามารถจ่ายได้
            </RadioBox>
            <RadioBox id="outcome-success" value="success">
              จ่ายสำเร็จ
            </RadioBox>
          </RadioGroup>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="issue-note">
          {state.short ? "หมายเหตุจ่ายได้น้อยกว่าปริมาณที่ขอเบิก" : "หมายเหตุ"}
          {!state.noteRequired && <span className="font-normal text-muted-foreground">(ไม่บังคับ)</span>}
        </Label>
        <Textarea
          id="issue-note"
          rows={3}
          value={state.note}
          onChange={(e) => state.setNote(e.target.value)}
          placeholder={state.failed ? "ระบุเหตุผลที่จ่ายไม่ได้ เช่น สต็อกหมด" : "ระบุหมายเหตุ"}
          className="bg-card"
        />
      </div>

      <ScannerDialog scan={state.scan} />
    </div>
  );
}

/** ตัวเลือกแบบกล่อง — ไฮไลต์กรอบ/พื้นตอนถูกเลือก แบบเดียวกับหน้ารับเข้า */
function RadioBox({ id, value, children }: { id: string; value: string; children: React.ReactNode }) {
  return (
    <Label
      htmlFor={id}
      className={cn(
        "flex cursor-pointer items-center gap-2.5 rounded-lg border border-border bg-card px-4 py-3 text-sm font-medium",
        "has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-brand"
      )}
    >
      <RadioGroupItem id={id} value={value} />
      {children}
    </Label>
  );
}

function ZoneBadge({ zone }: { zone: string }) {
  return (
    <Badge appearance="soft" className="shrink-0 whitespace-nowrap">
      {zone}
    </Badge>
  );
}

function CountInput({
  id,
  value,
  error,
  onChange,
  className,
  disabled,
}: {
  id: string;
  value: string;
  error?: string;
  onChange: (v: string) => void;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <div className={className}>
      <Input
        id={id}
        inputMode="numeric"
        disabled={disabled}
        aria-invalid={Boolean(error) || undefined}
        className={cn("bg-card text-right tabular-nums", error && "border-danger-strong")}
        value={disabled ? "-" : value}
        onChange={(e) => onChange(e.target.value)}
      />
      {error && <p className="mt-1 text-right text-xs text-danger-strong">{error}</p>}
    </div>
  );
}

/** จอกว้าง — ตาราง เทียบคงเหลือกับยอดจ่ายข้ามแถวได้ในสายตาเดียว */
function LotTable({ state }: { state: LotPick }) {
  const u = state.byCount ? state.doc.unit : "ชิ้น";
  return (
    <div className="hidden @3xl:block">
      <TableFrame>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-24">โซน</TableHead>
              <TableHead>Lot</TableHead>
              <TableHead className="text-right">
                คงเหลือในคลัง
                <br />({state.byCount ? u : "ตัน"})
              </TableHead>
              {!state.byCount && (
                <TableHead className="text-right">
                  ปริมาณจ่าย
                  <br />
                  (ตัน)
                </TableHead>
              )}
              <TableHead className="w-36 text-right">
                จำนวนจ่าย
                <br />({u})
              </TableHead>
              <TableHead className="w-14">
                <span className="sr-only">ลบ</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {state.rows.map((r) => (
              <TableRow
                key={r.lot.id}
                className={cn(state.flashId === r.lot.id && "bg-brand")}
              >
                <TableCell className="align-top">
                  <ZoneBadge zone={r.lot.zone} />
                </TableCell>
                <TableCell className="align-top">
                  <span className="block font-medium">{r.lot.code}</span>
                  <span className="block text-sm text-muted-foreground">{lotLine(r.lot, state.byCount)}</span>
                </TableCell>
                <TableCell className="text-right align-top tabular-nums">
                  {state.byCount ? formatCount(r.lot.pieces) : formatTons(lotTons(r.lot))}
                </TableCell>
                {!state.byCount && (
                  <TableCell className="text-right align-top tabular-nums">
                    {state.failed ? "-" : formatTons(r.tons)}
                  </TableCell>
                )}
                <TableCell className="align-top">
                  <CountInput
                    id={`count-${r.lot.id}`}
                    disabled={state.failed}
                    value={r.raw}
                    error={r.error}
                    onChange={(v) => state.setCount(r.lot.id, v)}
                  />
                </TableCell>
                <TableCell className="align-top">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`เอา ${r.lot.code} ออก`}
                    onClick={() => state.remove(r.lot.id)}
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
  );
}

/** จอแคบ — การ์ดต่อ Lot ตามแบบมือถือ */
function LotCards({ state }: { state: LotPick }) {
  return (
    <div className="space-y-3 @3xl:hidden">
      {state.rows.map((r) => (
        <div
          key={r.lot.id}
          className={cn(
            "rounded-xl border border-border bg-card p-4",
            state.flashId === r.lot.id && "ring-2 ring-primary"
          )}
        >
          <div className="flex items-center gap-3">
            <ZoneBadge zone={r.lot.zone} />
            <span className="min-w-0 flex-1 truncate font-semibold">{r.lot.code}</span>
            <Button
              variant="ghost"
              size="icon"
              aria-label={`เอา ${r.lot.code} ออก`}
              onClick={() => state.remove(r.lot.id)}
            >
              <Trash2Icon />
            </Button>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">{lotLine(r.lot, state.byCount)}</p>

          <dl className="mt-3 space-y-1.5 border-t border-border pt-3 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">คงเหลือในคลัง ({state.byCount ? state.doc.unit : "ตัน"}):</dt>
              <dd className="font-semibold tabular-nums">
                {state.byCount ? formatCount(r.lot.pieces) : formatTons(lotTons(r.lot))}
              </dd>
            </div>
            {!state.byCount && (
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">ปริมาณจ่าย (ตัน):</dt>
                <dd className="font-semibold tabular-nums">{state.failed ? "-" : formatTons(r.tons)}</dd>
              </div>
            )}
          </dl>

          <div className="mt-3 flex items-start justify-between gap-3 border-t border-border pt-3">
            <Label htmlFor={`m-count-${r.lot.id}`} className="mt-2.5 font-normal text-muted-foreground">
              จำนวนจ่าย ({state.byCount ? state.doc.unit : "ชิ้น"}):
            </Label>
            <CountInput
              id={`m-count-${r.lot.id}`}
              disabled={state.failed}
              className="w-40"
              value={r.raw}
              error={r.error}
              onChange={(v) => state.setCount(r.lot.id, v)}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
