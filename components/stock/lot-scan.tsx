"use client";

import * as React from "react";
import { ScanBarcodeIcon, XIcon } from "lucide-react";
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
     สแกนจากรูปภาพ    หยิบรูปป้ายที่ถ่ายไว้ เลือกได้หลายรูป อ่านแล้วทิ้งรูป
   ผลบอกด้วย toast ทีเดียวต่อรอบ (ไม่ใช่ต่อป้าย) — สำเร็จกี่ Lot ไม่พบกี่ป้าย

   ---------- ยังเป็นของจำลอง ----------
   กล้องกับการถอดบาร์โค้ดยังไม่ได้ต่อของจริง "กล้อง" อ่านได้ Lot แรกในรายการ
   ที่ยังไม่ได้เลือก (เรียงเก่าสุดก่อน = FIFO) ชิป "ผลจำลอง" สลับไปดูทางไม่พบสินค้าได้
------------------------------------------------------------------ */

type Via = "scan" | "photo";
type Simulate = "found" | "notfound";
type Outcome = "found" | "already" | "notfound" | "empty";

const READ_MS = 900;
const AIM_MS = 1800;

export type ScanLot = { id: string; code: string; zone: string };

export function useLotScanner<L extends ScanLot>({
  lots,
  picked,
  onAdd,
  describe,
  inputId,
  selectId,
}: {
  /** Lot ที่สแกนเจอได้ — ป้ายที่ไม่อยู่ในนี้นับเป็นไม่พบ */
  lots: L[];
  picked: string[];
  onAdd: (lot: L) => void;
  /** บรรทัดรองบน toast ตอนเจอ Lot เดียว เช่น "PD…/01 · 80 ตัน" */
  describe: (lot: L) => string;
  inputId: string;
  /** ช่องเลือก Lot — ปุ่ม "เลือก Lot" บน toast ไม่พบ เลื่อนไปเปิดช่องนี้ */
  selectId: string;
}) {
  const isPhone = useIsPhone();
  const [simulate, setSimulateState] = React.useState<Simulate>("found");
  const [scannerOpen, setScannerOpenState] = React.useState(false);
  const [reading, setReading] = React.useState<{ done: number; total: number } | null>(null);
  const [flashId, setFlashId] = React.useState<string>();

  // สแกนหลายรูปต่อกันในรอบเดียว ต้องเห็น Lot ที่เพิ่งเพิ่มก่อน React วาดใหม่
  const live = React.useRef({ lots, picked, onAdd, describe });
  React.useEffect(() => {
    live.current = { lots, picked, onAdd, describe };
  });
  const simulateRef = React.useRef(simulate);
  const sessionRef = React.useRef<{ via: Via; found: L[]; missing: string[] } | null>(null);
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
    if (!rep || (rep.found.length === 0 && rep.missing.length === 0)) return;
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
    if (open) sessionRef.current = { via: "scan", found: [], missing: [] };
    else if (sessionRef.current?.via === "scan") endSession();
    setScannerOpenState(open);
  }

  /** ป้ายที่ "กล้อง" จะอ่านได้ — Lot แรกที่ยังไม่ได้เลือก */
  const mockRead = (): string | null => {
    const { lots: pool, picked: chosen } = live.current;
    if (pool.length === 0) return null;
    if (simulateRef.current === "notfound") return pool[0].code.replace(/\d+$/, "99");
    return pool.find((l) => !chosen.includes(l.id))?.code ?? null;
  };

  const applyCode = (code: string | null): { outcome: Outcome } => {
    const session = sessionRef.current;
    if (code === null) return { outcome: "empty" };
    const hit = live.current.lots.find((l) => l.code.toUpperCase() === code.trim().toUpperCase());
    if (!hit) {
      session?.missing.push(code);
      return { outcome: "notfound" };
    }
    clearTimeout(flashTimer.current);
    setFlashId(hit.id);
    flashTimer.current = setTimeout(() => setFlashId(undefined), 1600);
    if (session && !session.found.some((l) => l.id === hit.id)) session.found.push(hit);
    if (live.current.picked.includes(hit.id)) return { outcome: "already" };
    live.current.picked = [...live.current.picked, hit.id];
    live.current.onAdd(hit);
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
    sessionRef.current = { via: "photo", found: [], missing: [] };
    setReading({ done: 0, total: photos.length });
    readPhoto(photos.length, 0);
  };

  return {
    isPhone,
    simulate,
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
  };
}

export type LotScanner = ReturnType<typeof useLotScanner>;

/** กล่องเส้นประ — ปุ่มเปิดกล้อง ปุ่มเลือกรูป และลากรูปมาวางได้บนจอกว้าง */
export function CaptureTile({ scan, prompt }: { scan: LotScanner; prompt: string }) {
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
      <SimulateToggle state={scan} />
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
    </div>
  );
}

type Phase = { kind: "aiming" | Outcome; code: string | null };

/** กล้องจำลอง — เปิดแล้ว "อ่าน" ป้ายเองหลังเล็งครู่หนึ่ง แล้วปิดเอง */
export function ScannerDialog({ scan }: { scan: LotScanner }) {
  const { isPhone } = scan;
  const open = scan.scannerOpen;
  const [phase, setPhase] = React.useState<Phase>({ kind: "aiming", code: null });

  const { mockRead, applyCode, setScannerOpen } = scan;
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
  }, [open, scan.simulate]);

  return (
    <Dialog open={open} onOpenChange={scan.setScannerOpen}>
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
          <Button variant="ghost" size="icon" aria-label="ปิด" onClick={() => scan.setScannerOpen(false)}>
            <XIcon />
          </Button>
        </div>
        <Viewfinder phase={phase} className={isPhone ? "min-h-0 flex-1" : "h-[min(58dvh,580px)]"}>
          {phase.kind === "aiming" && <SimulateToggle state={scan} dark />}
        </Viewfinder>
        <div className="flex min-h-14 items-center justify-center gap-2 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-sm text-muted-foreground">
          <Spinner className="size-4" />
          กำลังค้นหาบาร์โค้ด...
        </div>
      </DialogContent>
    </Dialog>
  );
}
