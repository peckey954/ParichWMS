"use client";

import * as React from "react";
import { ImageIcon, ScanBarcodeIcon, XIcon } from "lucide-react";
import { Button } from "@peckey954/ui/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@peckey954/ui/components/ui/dialog";
import { Spinner } from "@peckey954/ui/components/ui/spinner";
import { cn } from "@peckey954/ui/lib/utils";
import { toast } from "sonner";
import {
  ResultCard,
  SimulateToggle,
  Viewfinder,
  useIsPhone,
} from "@/components/stock/zone-assign";

/* ------------------------------------------------------------------
   สแกนป้าย Lot — ใช้ร่วมกันระหว่างหน้าจ่ายออก (lot-pick) กับหน้า
   ย้าย/ปรับปรุงหลายรายการ (bulk-lot-action)

   สองทางเข้า ได้ผลเดียวกันคือ Lot ถูกเพิ่มเข้ารายการ
     สแกนเลขที่สินค้า  เปิดกล้อง อ่านป้ายติดแล้วปิดเอง
                       (continuous: กล้องค้างไว้ สแกนต่อได้เรื่อยๆ ผลขึ้นบนกล้อง กด "เสร็จ" ปิดเอง)
     สแกนจากรูปภาพ    หยิบรูปป้ายที่ถ่ายไว้ เลือกได้หลายรูป อ่านแล้วทิ้งรูป
   ผลบอกด้วย toast ทีเดียวต่อรอบ (ไม่ใช่ต่อป้าย) — สำเร็จกี่ Lot ไม่พบกี่ป้าย
   หน้ากล้องมีปุ่มรูปภาพมุมขวาล่าง ปิดกล้องแล้วเปิดคลังรูปต่อได้เลย

   reject (ถ้าส่งมา) ปัดตก Lot ที่เจอแต่ใช้ในใบนี้ไม่ได้ เช่นคนละสินค้า
   ขึ้นเป็น toast สีแดงแยกจากไม่พบ

   ---------- ยังเป็นของจำลอง ----------
   กล้องกับการถอดบาร์โค้ดยังไม่ได้ต่อของจริง "กล้อง" อ่านได้ Lot แรกในรายการ
   ที่ยังไม่ได้เลือก (เรียงเก่าสุดก่อน = FIFO) ชิป "ผลจำลอง" สลับไปดูทางไม่พบสินค้าได้
------------------------------------------------------------------ */

type Via = "scan" | "photo";
type Simulate = "found" | "notfound" | "rejected";
type Outcome = "found" | "already" | "notfound" | "rejected" | "empty";

const READ_MS = 900;
const AIM_MS = 1800;

export type ScanLot = { id: string; code: string; zone: string };

export function useLotScanner<L extends ScanLot>({
  lots,
  picked,
  onAdd,
  reject,
  rejectLabel = "ใช้ Lot นี้ไม่ได้",
  describe,
  inputId,
  selectId,
  continuous = false,
}: {
  /** Lot ที่สแกนเจอได้ — ป้ายที่ไม่อยู่ในนี้นับเป็นไม่พบ */
  lots: L[];
  picked: string[];
  onAdd: (lot: L) => void;
  /** เหตุผลที่ใช้ Lot นี้ไม่ได้ — undefined = ใช้ได้ */
  reject?: (lot: L) => string | undefined;
  /** ชื่อผลจำลอง/หัว toast ของ reject เช่น "คนละสินค้า" */
  rejectLabel?: string;
  /** บรรทัดรองบน toast ตอนเจอ Lot เดียว เช่น "PD…/01 · 80 ตัน" */
  describe: (lot: L) => string;
  inputId: string;
  /** ช่องเลือก Lot — ปุ่ม "เลือก Lot" บน toast ไม่พบ เลื่อนไปเปิดช่องนี้ ไม่ส่ง = สแกนอย่างเดียว */
  selectId?: string;
  /** กล้องไม่ปิดเองหลังอ่านติด — ผลบอกบนกล้องแทน toast */
  continuous?: boolean;
}) {
  const isPhone = useIsPhone();
  const [simulate, setSimulateState] = React.useState<Simulate>("found");
  const [scannerOpen, setScannerOpenState] = React.useState(false);
  const [reading, setReading] = React.useState<{ done: number; total: number } | null>(null);
  const [flashId, setFlashId] = React.useState<string>();

  // สแกนหลายรูปต่อกันในรอบเดียว ต้องเห็น Lot ที่เพิ่งเพิ่มก่อน React วาดใหม่
  const live = React.useRef({ lots, picked, onAdd, reject, describe });
  React.useEffect(() => {
    live.current = { lots, picked, onAdd, reject, describe };
  });
  const simulateRef = React.useRef(simulate);
  const sessionRef = React.useRef<{
    via: Via;
    found: L[];
    missing: string[];
    rejected: { lot: L; reason: string }[];
  } | null>(null);
  const timersRef = React.useRef<ReturnType<typeof setTimeout>[]>([]);
  const flashTimer = React.useRef<ReturnType<typeof setTimeout>>(undefined);

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

  const openLotSelect = () => {
    if (!selectId) return;
    setScannerOpen(false);
    setTimeout(() => {
      const el = document.getElementById(selectId);
      if (!el) return;
      el.scrollIntoView({ block: "center", behavior: "smooth" });
      el.focus({ preventScroll: true });
      el.click();
    }, 80);
  };

  const endSession = () => {
    const rep = sessionRef.current;
    sessionRef.current = null;
    // สแกนต่อเนื่องเห็นผลบนกล้องทีละป้ายแล้ว ไม่ต้องสรุปซ้ำ
    if (rep?.via === "scan" && continuous) return;
    if (!rep || (rep.found.length === 0 && rep.missing.length === 0 && rep.rejected.length === 0)) return;
    if (rep.found.length > 0) {
      const one = rep.found.length === 1 ? rep.found[0] : undefined;
      toast.custom(() => (
        <ResultCard
          tone="ok"
          className="w-[min(32rem,calc(100vw-2rem))] shadow-lg"
          title="สแกนสำเร็จ"
          detail={one ? live.current.describe(one) : `${rep.found.length} Lot`}
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
            selectId && (
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
            )
          }
        />
      ));
    }
    if (rep.rejected.length > 0) {
      const one = rep.rejected.length === 1 ? rep.rejected[0] : undefined;
      toast.custom(() => (
        <ResultCard
          tone="error"
          className="w-[min(32rem,calc(100vw-2rem))] shadow-lg"
          title={rejectLabel}
          detail={one ? `${one.lot.code} · ${one.reason}` : `${rep.rejected.length} Lot · ${rep.rejected[0].reason}`}
        />
      ));
    }
  };

  function setScannerOpen(open: boolean) {
    if (open) {
      // ผลรอบก่อนยังค้างอยู่ — ล้างออกไม่ให้ซ้อนบนกล้อง
      toast.dismiss();
      sessionRef.current = { via: "scan", found: [], missing: [], rejected: [] };
    }
    else if (sessionRef.current?.via === "scan") endSession();
    setScannerOpenState(open);
  }

  /** ป้ายที่ "กล้อง" จะอ่านได้ — Lot แรกที่ยังไม่ได้เลือกและใช้ได้ (ผลจำลองคนละสินค้า = Lot แรกที่ใช้ไม่ได้) */
  const mockRead = (): string | null => {
    const { lots: pool, picked: chosen, reject: rejects } = live.current;
    if (pool.length === 0) return null;
    if (simulateRef.current === "notfound") return pool[0].code.replace(/\d+$/, "99");
    if (simulateRef.current === "rejected") return pool.find((l) => rejects?.(l))?.code ?? null;
    return pool.find((l) => !chosen.includes(l.id) && !rejects?.(l))?.code ?? null;
  };

  const applyCode = (code: string | null): { outcome: Outcome; lot?: L; reason?: string } => {
    const session = sessionRef.current;
    if (code === null) return { outcome: "empty" };
    const hit = live.current.lots.find((l) => l.code.toUpperCase() === code.trim().toUpperCase());
    if (!hit) {
      session?.missing.push(code);
      return { outcome: "notfound" };
    }
    const reason = live.current.reject?.(hit);
    if (reason) {
      session?.rejected.push({ lot: hit, reason });
      return { outcome: "rejected", lot: hit, reason };
    }
    clearTimeout(flashTimer.current);
    setFlashId(hit.id);
    flashTimer.current = setTimeout(() => setFlashId(undefined), 1600);
    if (session && !session.found.some((l) => l.id === hit.id)) session.found.push(hit);
    if (live.current.picked.includes(hit.id)) return { outcome: "already", lot: hit };
    live.current.picked = [...live.current.picked, hit.id];
    live.current.onAdd(hit);
    return { outcome: "found", lot: hit };
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
    sessionRef.current = { via: "photo", found: [], missing: [], rejected: [] };
    setReading({ done: 0, total: photos.length });
    readPhoto(photos.length, 0);
  };

  const simulateOptions: { value: Simulate; label: string }[] = [
    { value: "found", label: "พบสินค้า" },
    { value: "notfound", label: "ไม่พบสินค้า" },
    ...(reject ? [{ value: "rejected" as const, label: rejectLabel }] : []),
  ];

  return {
    isPhone,
    continuous,
    rejectLabel,
    /** ใช้กับ lot ที่ applyCode คืนมาเท่านั้น จึงเป็น L เสมอ */
    describe: (lot: ScanLot) => live.current.describe(lot as L),
    simulate,
    simulateOptions,
    setSimulate,
    scannerOpen,
    setScannerOpen,
    reading,
    flashId,
    mockRead,
    applyCode,
    scanPhotos,
    inputId,
    pickPhotos: () => document.getElementById(inputId)?.click(),
    /** จากหน้ากล้อง — ปิดกล้องแล้วเปิดคลังรูป (ยังอยู่ในจังหวะกดของผู้ใช้ เบราว์เซอร์จึงยอมเปิด) */
    pickPhotosFromScanner: () => {
      setScannerOpen(false);
      document.getElementById(inputId)?.click();
    },
  };
}

export type LotScanner = ReturnType<typeof useLotScanner>;

/** กล่องเส้นประ — ปุ่มเปิดกล้อง ปุ่มเลือกรูป และลากรูปมาวางได้บนจอกว้าง */
export function CaptureTile({ scan, prompt, error }: { scan: LotScanner; prompt: string; error?: string }) {
  const [dragging, setDragging] = React.useState(false);
  return (
    <div
      onDragOver={(e) => {
        if (scan.isPhone || scan.reading) return;
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        if (scan.isPhone) return;
        e.preventDefault();
        setDragging(false);
        scan.scanPhotos([...e.dataTransfer.files]);
      }}
      className={cn(
        "flex flex-col items-center gap-3 rounded-xl border border-dashed border-primary bg-brand px-4 py-8 text-center transition-colors",
        error && "border-danger-strong",
        dragging && "bg-brand-hover ring-[3px] ring-primary/30"
      )}
    >
      {scan.reading ? (
        <Spinner className="size-7 text-muted-foreground" />
      ) : (
        <ScanBarcodeIcon className="size-7 text-muted-foreground" />
      )}
      <p className="font-medium">
        {!scan.reading
          ? prompt
          : scan.reading.total > 1
            ? `กำลังอ่านรูปที่ ${scan.reading.done + 1} จาก ${scan.reading.total}...`
            : "กำลังอ่านบาร์โค้ดจากรูป..."}
      </p>
      {error && !scan.reading && <p className="-mt-2 text-sm text-danger-strong">{error}</p>}
      <div className="flex flex-wrap justify-center gap-2">
        <Button variant="outline-primary" size="sm" className="bg-card" onClick={() => scan.setScannerOpen(true)}>
          สแกนเลขที่สินค้า
        </Button>
        <Button
          variant="outline-primary"
          size="sm"
          className="bg-card"
          disabled={Boolean(scan.reading)}
          onClick={scan.pickPhotos}
        >
          สแกนจากรูปภาพ
        </Button>
      </div>
      <SimulateToggle state={scan} options={scan.simulateOptions} />
    </div>
  );
}

type Phase = { kind: "aiming" | Outcome; code: string | null };

type Last = { tone: "ok" | "error"; title: string; detail?: string; zone?: string };

/** ผลค้างบนกล้องก่อนเล็งป้ายถัดไป (สแกนต่อเนื่อง) */
const RESULT_MS = 1400;

/**
 * กล้องจำลอง — เปิดแล้ว "อ่าน" ป้ายเองหลังเล็งครู่หนึ่ง
 * ปกติอ่านติดแล้วปิดเอง / continuous ค้างไว้ บอกผลบนกล้อง แล้วเล็งป้ายถัดไป
 * input เลือกรูปอยู่ที่นี่ (นอก Dialog) เพราะคอมโพเนนต์นี้อยู่บนหน้าตลอด
 */
export function ScannerDialog({ scan }: { scan: LotScanner }) {
  const { isPhone, continuous } = scan;
  const open = scan.scannerOpen;
  const [phase, setPhase] = React.useState<Phase>({ kind: "aiming", code: null });
  const [added, setAdded] = React.useState(0);
  const [last, setLast] = React.useState<Last | null>(null);
  /** เพิ่มทีละหนึ่งเพื่อเริ่มเล็งป้ายถัดไป */
  const [round, setRound] = React.useState(0);

  const { mockRead, applyCode, setScannerOpen, setSimulate, describe, rejectLabel } = scan;
  const live = React.useRef({ mockRead, applyCode, setScannerOpen, setSimulate, describe, rejectLabel });
  React.useEffect(() => {
    live.current = { mockRead, applyCode, setScannerOpen, setSimulate, describe, rejectLabel };
  });

  // ระหว่างเปิดกล้องไม่ให้ toast ใดๆ ทับภาพ (ดู globals.css) — รวมแจ้งเตือนใหม่ของแอปที่เด้งหลังโหลดหน้า
  React.useEffect(() => {
    if (!open) return;
    document.body.dataset.scanning = "";
    return () => {
      delete document.body.dataset.scanning;
    };
  }, [open]);

  // เปิดกล้องรอบใหม่ เริ่มนับใหม่ (ปรับ state ระหว่าง render แทน effect)
  const [wasOpen, setWasOpen] = React.useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setAdded(0);
      setLast(null);
    }
  }

  React.useEffect(() => {
    if (!open) return;
    const code = live.current.mockRead();
    setPhase({ kind: "aiming", code });
    let next: ReturnType<typeof setTimeout> | undefined;
    const t = setTimeout(() => {
      const { outcome, lot, reason } = live.current.applyCode(code);
      setPhase({ kind: outcome, code });
      if (!continuous) {
        if (outcome === "empty") toast.info("เลือกครบทุก Lot ของสินค้านี้แล้ว");
        live.current.setScannerOpen(false);
        return;
      }
      if (outcome === "empty") {
        // ไม่มีป้ายให้อ่านแล้ว หยุดเล็ง รอกดเสร็จ
        setLast({ tone: "ok", title: "สแกนครบทุก Lot ของสินค้านี้แล้ว" });
        return;
      }
      if (outcome === "found") setAdded((n) => n + 1);
      setLast(
        outcome === "found"
          ? { tone: "ok", title: "เพิ่มแล้ว", detail: lot && live.current.describe(lot), zone: lot?.zone }
          : outcome === "already"
            ? { tone: "ok", title: "Lot นี้อยู่ในรายการแล้ว", detail: lot?.code }
            : outcome === "rejected"
              ? { tone: "error", title: live.current.rejectLabel, detail: lot && `${lot.code} · ${reason}` }
              : { tone: "error", title: "ไม่พบ Lot ที่ตรงกับบาร์โค้ด", detail: code ?? undefined }
      );
      next = setTimeout(() => {
        // ผลจำลองแบบผิดพลาดใช้ครั้งเดียว ป้ายถัดไปกลับเป็นพบสินค้า
        if (outcome === "notfound" || outcome === "rejected") live.current.setSimulate("found");
        setRound((r) => r + 1);
      }, RESULT_MS);
    }, AIM_MS);
    return () => {
      clearTimeout(t);
      clearTimeout(next);
    };
  }, [open, scan.simulate, round, continuous]);

  return (
    <>
    <Dialog open={open} onOpenChange={scan.setScannerOpen}>
      <DialogContent
        showCloseButton={false}
        className={cn(
          "flex flex-col gap-0 overflow-hidden p-0",
          isPhone
            ? "inset-0 h-dvh max-w-none translate-x-0 translate-y-0 rounded-none border-0"
            : "h-[min(92dvh,900px)] sm:max-w-3xl"
        )}
      >
        <div className="flex items-start justify-between gap-2 px-6 pt-5 pb-4 max-sm:px-4">
          <div>
            <DialogTitle className="text-lg">สแกนบาร์โค้ด</DialogTitle>
            <DialogDescription className="mt-1">วางบาร์โค้ดให้อยู่ในตำแหน่งสแกน</DialogDescription>
          </div>
          <Button variant="ghost" size="icon" aria-label="ปิด" onClick={() => scan.setScannerOpen(false)}>
            <XIcon />
          </Button>
        </div>
        {/* ภาพกล้องเต็มที่เหลือ — ทับดำ 40% ให้เห็นภาพกล้องอยู่ข้างใต้ มีแค่ปุ่มรูปภาพมุมขวาล่าง
            ผลจำลองสลับได้ที่กล่องสแกนบนหน้า ไม่โชว์บนกล้อง */}
        <div className="relative min-h-0 flex-1">
          <Viewfinder
            phase={{ kind: phase.kind === "rejected" ? "found" : phase.kind, code: phase.code }}
            className="h-full bg-black/40"
          />
          {continuous && last && (
            <div className="absolute inset-x-4 top-4 flex justify-center" aria-live="polite">
              <ResultCard
                tone={last.tone}
                title={last.title}
                detail={last.detail}
                zone={last.zone}
                className="w-full max-w-md shadow-lg"
              />
            </div>
          )}
          <div className="absolute inset-x-6 bottom-[max(1.5rem,env(safe-area-inset-bottom))] flex items-center justify-between gap-3 max-sm:inset-x-4">
            {continuous && added > 0 ? (
              <Button className="h-11 px-5" onClick={() => scan.setScannerOpen(false)}>
                เสร็จ · {added} Lot
              </Button>
            ) : (
              <span />
            )}
            <Button
              variant="outline"
              size="icon"
              className="size-11 rounded-lg border-0 bg-black/60 text-white hover:bg-black/70 hover:text-white"
              aria-label="เลือกรูปจากเครื่อง"
              title="เลือกรูปจากเครื่อง"
              onClick={scan.pickPhotosFromScanner}
            >
              <ImageIcon />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
      <input
        id={scan.inputId}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          const files = [...(e.target.files ?? [])];
          e.target.value = "";
          if (files.length > 0) scan.scanPhotos(files);
        }}
      />
    </>
  );
}
