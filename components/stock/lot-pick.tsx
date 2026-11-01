"use client";

import * as React from "react";
import { ScanBarcodeIcon, Trash2Icon, XIcon } from "lucide-react";
import { Badge } from "@peckey954/ui/components/ui/badge";
import { Button } from "@peckey954/ui/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@peckey954/ui/components/ui/dialog";
import { Input } from "@peckey954/ui/components/ui/input";
import { Label } from "@peckey954/ui/components/ui/label";
import { Spinner } from "@peckey954/ui/components/ui/spinner";
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
import { toast } from "sonner";
import { MultiSelectChips } from "@/components/multi-select-chips";
import { TableFrame } from "@/components/stock/doc-parts";
import {
  ResultCard,
  SimulateToggle,
  Viewfinder,
  useIsPhone,
} from "@/components/stock/zone-assign";
import {
  LOW_LOT_TONS,
  formatCount,
  formatTons,
  lotTons,
  lotsFor,
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

   ---------- ยังเป็นของจำลอง ----------
   กล้องกับการถอดบาร์โค้ดยังไม่ได้ต่อของจริง "กล้อง" อ่านได้ Lot เก่าสุด
   ที่ยังไม่ได้เลือก (FIFO) ชิป "ผลจำลอง" สลับไปดูทางไม่พบสินค้าได้
------------------------------------------------------------------ */

type Via = "scan" | "photo";
type Simulate = "found" | "notfound";
type Outcome = "found" | "already" | "notfound" | "empty";
type Report = { via: Via; found: GoodsLot[]; missing: string[] };

const READ_MS = 900;
const AIM_MS = 1800;
const LOT_SELECT_ID = "issue-lot";
const PHOTO_INPUT_ID = "issue-photo";

const lotLine = (l: GoodsLot) =>
  `รับ ${l.receivedAt} (${l.ageDays} วัน) · ${formatCount(l.pieces)} ชิ้น (${l.kgPerPiece} กก.)`;

export function useLotPick(doc: GoodsIssueDoc) {
  const isPhone = useIsPhone();
  const lots = React.useMemo(() => lotsFor(doc), [doc]);
  /** ลำดับที่เพิ่มเข้ามา — แถวในตารางเรียงตามนี้ ไม่กระโดดสลับที่ */
  const [picked, setPickedState] = React.useState<string[]>([]);
  /** จำนวนจ่าย (ชิ้น) ต่อ Lot เก็บเป็นข้อความตามที่พิมพ์ */
  const [counts, setCounts] = React.useState<Record<string, string>>({});
  const [note, setNote] = React.useState("");
  const [simulate, setSimulateState] = React.useState<Simulate>("found");
  const [scannerOpen, setScannerOpenState] = React.useState(false);
  const [reading, setReading] = React.useState<{ done: number; total: number } | null>(null);
  const [flashId, setFlashId] = React.useState<string>();

  const pickedRef = React.useRef(picked);
  const countsRef = React.useRef(counts);
  const simulateRef = React.useRef(simulate);
  const sessionRef = React.useRef<Report | null>(null);
  const timersRef = React.useRef<ReturnType<typeof setTimeout>[]>([]);
  const flashTimer = React.useRef<ReturnType<typeof setTimeout>>(undefined);

  React.useEffect(() => {
    pickedRef.current = picked;
    countsRef.current = counts;
  }, [picked, counts]);

  React.useEffect(
    () => () => {
      for (const t of timersRef.current) clearTimeout(t);
      clearTimeout(flashTimer.current);
    },
    []
  );

  const setSimulate = (v: Simulate) => {
    simulateRef.current = v;
    setSimulateState(v);
  };

  const lotOf = (id: string) => lots.find((l) => l.id === id);

  /** ชิ้นที่ยังขาดจากยอดขอเบิก หลังหักที่กรอกไว้แล้ว */
  const piecesStillNeeded = (current: Record<string, string>, ids: string[], kg: number) => {
    const need = Math.ceil((requestTons(doc) * 1000) / kg);
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

  const startSession = (via: Via) => {
    sessionRef.current = { via, found: [], missing: [] };
  };

  const openLotSelect = () => {
    setScannerOpen(false);
    setTimeout(() => {
      const el = document.getElementById(LOT_SELECT_ID);
      if (!el) return;
      el.scrollIntoView({ block: "center", behavior: "smooth" });
      el.focus({ preventScroll: true });
      el.click();
    }, 80);
  };

  const endSession = () => {
    const rep = sessionRef.current;
    sessionRef.current = null;
    if (!rep || (rep.found.length === 0 && rep.missing.length === 0)) return;
    if (rep.found.length > 0) {
      const one = rep.found.length === 1 ? rep.found[0] : undefined;
      toast.custom(() => (
        <ResultCard
          tone="ok"
          className="w-[min(32rem,calc(100vw-2rem))] shadow-lg"
          title="สแกนสำเร็จ"
          detail={one ? `${one.code} · ${formatTons(lotTons(one))} ตัน` : `${rep.found.length} Lot`}
          zone={one ? one.zone : undefined}
        />
      ));
    }
    if (rep.missing.length > 0) {
      toast.custom((id) => (
        <ResultCard
          tone="error"
          className="w-[min(32rem,calc(100vw-2rem))] shadow-lg"
          title="ไม่พบ Lot ที่ตรงกับบาร์โค้ด"
          detail={rep.missing.length === 1 ? rep.missing[0] : `${rep.missing.length} รายการ`}
          aside={
            <Button
              size="sm"
              variant="outline"
              className="shrink-0 bg-card"
              onClick={() => {
                toast.dismiss(id);
                openLotSelect();
              }}
            >
              เลือก Lot
            </Button>
          }
        />
      ));
    }
  };

  function setScannerOpen(open: boolean) {
    if (open) startSession("scan");
    else if (sessionRef.current?.via === "scan") endSession();
    setScannerOpenState(open);
  }

  /** ป้ายที่ "กล้อง" จะอ่านได้ — Lot เก่าสุดที่ยังไม่ได้เลือก */
  const mockRead = (): string | null => {
    if (simulateRef.current === "notfound") return lots[0].code.replace(/\d+$/, "99");
    const hit = lots.find((l) => !pickedRef.current.includes(l.id));
    return hit?.code ?? null;
  };

  const applyCode = (code: string | null): { outcome: Outcome } => {
    const session = sessionRef.current;
    if (code === null) return { outcome: "empty" };
    const hit = lots.find((l) => l.code.toUpperCase() === code.trim().toUpperCase());
    if (!hit) {
      session?.missing.push(code);
      return { outcome: "notfound" };
    }
    clearTimeout(flashTimer.current);
    setFlashId(hit.id);
    flashTimer.current = setTimeout(() => setFlashId(undefined), 1600);
    if (session && !session.found.some((l) => l.id === hit.id)) session.found.push(hit);
    if (pickedRef.current.includes(hit.id)) return { outcome: "already" };
    setPicked([...pickedRef.current, hit.id]);
    return { outcome: "found" };
  };

  const readPhoto = (total: number, index: number) => {
    timersRef.current = [
      setTimeout(() => {
        const { outcome } = applyCode(mockRead());
        if (index + 1 < total && outcome !== "empty") {
          setReading({ done: index + 1, total });
          readPhoto(total, index + 1);
          return;
        }
        setReading(null);
        if (outcome === "empty" && sessionRef.current?.found.length === 0)
          toast.info("เลือกครบทุก Lot ของสินค้านี้แล้ว");
        endSession();
      }, READ_MS),
    ];
  };

  const scanPhotos = (files: File[]) => {
    if (reading) return;
    const photos = files.filter((f) => f.type.startsWith("image/"));
    if (photos.length === 0) {
      toast.error("ไฟล์นี้ไม่ใช่รูป อ่านบาร์โค้ดไม่ได้");
      return;
    }
    startSession("photo");
    setReading({ done: 0, total: photos.length });
    readPhoto(photos.length, 0);
  };

  // ---------- ยอดรวม ----------

  const rows = picked.map((id) => {
    const lot = lotOf(id)!;
    const raw = counts[id] ?? "";
    const n = Number(raw) || 0;
    const error =
      raw === "" || n === 0 ? "กรอกจำนวน" : n > lot.pieces ? `เกินคงเหลือ ${formatCount(lot.pieces)} ชิ้น` : undefined;
    return { lot, raw, n, tons: (n * lot.kgPerPiece) / 1000, error };
  });
  const totalTons = rows.reduce((s, r) => s + r.tons, 0);
  const stockTons = rows.reduce((s, r) => s + lotTons(r.lot), 0);

  return {
    isPhone,
    doc,
    lots,
    picked,
    setPicked,
    remove,
    setCount,
    note,
    setNote,
    simulate,
    setSimulate,
    scannerOpen,
    setScannerOpen,
    reading,
    flashId,
    mockRead,
    applyCode,
    scanPhotos,
    pickPhotos: () => document.getElementById(PHOTO_INPUT_ID)?.click(),
    rows,
    totalTons,
    stockTons,
    canSubmit: rows.length > 0 && rows.every((r) => !r.error),
  };
}

export type LotPick = ReturnType<typeof useLotPick>;

/** ทั้งชุดตั้งแต่กล่องสแกนลงไปถึงหมายเหตุ */
export function LotPickFields({ state }: { state: LotPick }) {
  const options = state.lots.map((l) => ({
    value: l.id,
    label: l.code,
    badge: <span className="text-primary">{l.zone}</span>,
    description: lotLine(l),
    keywords: [l.zone],
    meta: (
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
      <CaptureTile state={state} />

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

      <div className="space-y-2">
        <Label htmlFor="issue-note">
          หมายเหตุ <span className="font-normal text-muted-foreground">(ไม่บังคับ)</span>
        </Label>
        <Textarea
          id="issue-note"
          rows={3}
          value={state.note}
          onChange={(e) => state.setNote(e.target.value)}
          placeholder="ระบุหมายเหตุ"
          className="bg-card"
        />
      </div>

      <ScannerDialog state={state} />
    </div>
  );
}

function CaptureTile({ state }: { state: LotPick }) {
  const [dragging, setDragging] = React.useState(false);
  return (
    <div
      onDragOver={(e) => {
        if (state.isPhone || state.reading) return;
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        if (state.isPhone) return;
        e.preventDefault();
        setDragging(false);
        state.scanPhotos([...e.dataTransfer.files]);
      }}
      className={cn(
        "flex flex-col items-center gap-3 rounded-xl border border-dashed border-primary bg-brand px-4 py-8 text-center transition-colors",
        dragging && "bg-brand-hover ring-[3px] ring-primary/30"
      )}
    >
      {state.reading ? (
        <Spinner className="size-7 text-muted-foreground" />
      ) : (
        <ScanBarcodeIcon className="size-7 text-muted-foreground" />
      )}
      <p className="font-medium">
        {!state.reading
          ? "สแกนเลขที่ติดบนสินค้าเพื่อเลือก Lot ที่จะจ่ายออก"
          : state.reading.total > 1
            ? `กำลังอ่านรูปที่ ${state.reading.done + 1} จาก ${state.reading.total}...`
            : "กำลังอ่านบาร์โค้ดจากรูป..."}
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        <Button variant="outline-primary" size="sm" className="bg-card" onClick={() => state.setScannerOpen(true)}>
          สแกนเลขที่สินค้า
        </Button>
        <Button
          variant="outline-primary"
          size="sm"
          className="bg-card"
          disabled={Boolean(state.reading)}
          onClick={state.pickPhotos}
        >
          สแกนจากรูปภาพ
        </Button>
      </div>
      <SimulateToggle state={state} />
      <input
        id={PHOTO_INPUT_ID}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          const files = [...(e.target.files ?? [])];
          e.target.value = "";
          if (files.length > 0) state.scanPhotos(files);
        }}
      />
    </div>
  );
}

type Phase = { kind: "aiming" | Outcome; code: string | null };

function ScannerDialog({ state }: { state: LotPick }) {
  const { isPhone } = state;
  const open = state.scannerOpen;
  const [phase, setPhase] = React.useState<Phase>({ kind: "aiming", code: null });

  const { mockRead, applyCode, setScannerOpen } = state;
  const live = React.useRef({ mockRead, applyCode, setScannerOpen });
  React.useEffect(() => {
    live.current = { mockRead, applyCode, setScannerOpen };
  });

  React.useEffect(() => {
    if (!open) return;
    const code = live.current.mockRead();
    setPhase({ kind: "aiming", code });
    const t = setTimeout(() => {
      const { outcome } = live.current.applyCode(code);
      setPhase({ kind: outcome, code });
      if (outcome === "empty") toast.info("เลือกครบทุก Lot ของสินค้านี้แล้ว");
      live.current.setScannerOpen(false);
    }, AIM_MS);
    return () => clearTimeout(t);
  }, [open, state.simulate]);

  return (
    <Dialog open={open} onOpenChange={state.setScannerOpen}>
      <DialogContent
        showCloseButton={false}
        className={cn(
          "flex flex-col gap-0 overflow-hidden p-0",
          isPhone
            ? "inset-0 h-dvh max-w-none translate-x-0 translate-y-0 rounded-none border-0"
            : "sm:max-w-3xl"
        )}
      >
        <div className="flex items-start justify-between gap-2 px-6 pt-5 pb-4 max-sm:px-4">
          <div>
            <DialogTitle className="text-lg">สแกนบาร์โค้ด</DialogTitle>
            <DialogDescription className="mt-1">วางบาร์โค้ดให้อยู่ในตำแหน่งสแกน</DialogDescription>
          </div>
          <Button variant="ghost" size="icon" aria-label="ปิด" onClick={() => state.setScannerOpen(false)}>
            <XIcon />
          </Button>
        </div>
        <Viewfinder phase={phase} className={isPhone ? "min-h-0 flex-1" : "h-[min(58dvh,580px)]"}>
          {phase.kind === "aiming" && <SimulateToggle state={state} dark />}
        </Viewfinder>
        <div className="flex min-h-14 items-center justify-center gap-2 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-sm text-muted-foreground">
          <Spinner className="size-4" />
          กำลังค้นหาบาร์โค้ด...
        </div>
      </DialogContent>
    </Dialog>
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

/** จอกว้าง — ตาราง เทียบคงเหลือกับยอดจ่ายข้ามแถวได้ในสายตาเดียว */
function LotTable({ state }: { state: LotPick }) {
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
                <br />
                (ตัน)
              </TableHead>
              <TableHead className="text-right">
                ปริมาณจ่าย
                <br />
                (ตัน)
              </TableHead>
              <TableHead className="w-36 text-right">
                จำนวนจ่าย
                <br />
                (ชิ้น)
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
                  <span className="block text-sm text-muted-foreground">{lotLine(r.lot)}</span>
                </TableCell>
                <TableCell className="text-right align-top tabular-nums">{formatTons(lotTons(r.lot))}</TableCell>
                <TableCell className="text-right align-top tabular-nums">{formatTons(r.tons)}</TableCell>
                <TableCell className="align-top">
                  <CountInput
                    id={`count-${r.lot.id}`}
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
          <p className="mt-2 text-sm text-muted-foreground">{lotLine(r.lot)}</p>

          <dl className="mt-3 space-y-1.5 border-t border-border pt-3 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">คงเหลือในคลัง (ตัน):</dt>
              <dd className="font-semibold tabular-nums">{formatTons(lotTons(r.lot))}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">ปริมาณจ่าย (ตัน):</dt>
              <dd className="font-semibold tabular-nums">{formatTons(r.tons)}</dd>
            </div>
          </dl>

          <div className="mt-3 flex items-start justify-between gap-3 border-t border-border pt-3">
            <Label htmlFor={`m-count-${r.lot.id}`} className="mt-2.5 font-normal text-muted-foreground">
              จำนวนจ่าย (ชิ้น):
            </Label>
            <CountInput
              id={`m-count-${r.lot.id}`}
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
