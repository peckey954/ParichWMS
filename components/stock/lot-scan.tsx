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
     สแกนเลขที่สินค้า  เปิดกล้อง อ่านทีละป้าย ติดแล้วปิดเอง
     สแกนจากรูปภาพ    หยิบรูปป้ายที่ถ่ายไว้ เลือกได้หลายรูป อ่านแล้วทิ้งรูป
   ผลบอก (ตามแบบ Figma)
     กล้อง   อ่านไม่ผ่าน (ไม่พบ/คนละสินค้า) ขึ้นการ์ดแดงบนกล้อง กล้องยังเปิดให้สแกนใหม่
             อ่านผ่านแล้วปิดกล้อง กลับหน้าพร้อม toast "สแกนสำเร็จ"
     รูป     ผ่านหมด = toast "สแกนสำเร็จ N รายการ" / ไม่ผ่านเลย = toast "สแกนไม่สำเร็จ"
             ผ่านบางส่วน = modal สรุปเลข Lot ที่ผ่าน กับจำนวนที่ไม่ผ่าน
   หน้ากล้องมีปุ่มรูปภาพมุมขวาล่าง ปิดกล้องแล้วเปิดคลังรูปต่อได้เลย

   reject (ถ้าส่งมา) ปัดตก Lot ที่เจอแต่ใช้ในใบนี้ไม่ได้ เช่นคนละสินค้า
   ขึ้นเป็น toast สีแดงแยกจากไม่พบ

   hold (ถ้าส่งมา) พัก Lot ที่ต้องถามก่อนเพิ่ม เช่นสลิงที่เลือกล็อคไว้แล้ว
   กล้องปิดเหมือนอ่านผ่าน แต่ไม่เพิ่มเข้ารายการ — ส่งให้ onHold ไปถามเอง

   ---------- ยังเป็นของจำลอง ----------
   กล้องกับการถอดบาร์โค้ดยังไม่ได้ต่อของจริง "กล้อง" อ่านได้ Lot แรกในรายการ
   ที่ยังไม่ได้เลือก (เรียงเก่าสุดก่อน = FIFO) ชิป "ผลจำลอง" สลับไปดูทางไม่พบสินค้าได้
------------------------------------------------------------------ */

type Via = "scan" | "photo";
type Simulate = "found" | "notfound" | "rejected" | "held" | "partial";
type Outcome = "found" | "already" | "notfound" | "rejected" | "held" | "empty";

const READ_MS = 900;
/** การ์ดแดงค้างบนกล้องก่อนเล็งใหม่ */
const RETRY_MS = 2200;
const AIM_MS = 1800;
/** ป้ายแรกหลังเปิดกล้อง — หน้าสแกนเปิดกล้องเองทันทีที่เข้า ต้องมีเวลาพอกดชิปผลจำลองก่อนกล้องอ่าน */
const FIRST_AIM_MS = 3500;
/** กดชิปผลจำลองบนกล้องแล้วอ่านผลนั้นแทบทันที */
const CHIP_AIM_MS = 700;

export type ScanLot = { id: string; code: string; zone: string };

/** เลขป้ายที่ไม่มีอยู่จริง — เปลี่ยนเลขท้ายเป็น 99 เลขที่ลงท้ายด้วยตัวอักษร (WT…/01A) ต่อ 99 ท้ายแทน
 *  ไม่งั้นได้เลขเดิมกลับมา แล้วผล "ไม่พบ" กลายเป็นเจอ */
const missingCode = (code: string) => (/\d+$/.test(code) ? code.replace(/\d+$/, "99") : `${code}-99`);

/** ผลที่ "กล้อง" จะอ่านได้ — force บังคับผลจำลองเมื่อข้อมูลในใบไม่มีของที่ทำให้เกิดผลนั้นจริง
 *  เช่น เลือก "มีล็อคแล้ว" แต่ไม่มี Lot ไหนมีล็อค ถ้าไม่บังคับ ชิปจะกลายเป็น "พบ" เงียบๆ */
type MockRead = { code: string | null; force?: "rejected" | "held" };

export function useLotScanner<L extends ScanLot>({
  lots,
  picked,
  onAdd,
  reject,
  rejectLabel = "ใช้ Lot นี้ไม่ได้",
  hold,
  onHold,
  holdLabel = "ต้องยืนยันก่อน",
  mockZone = "",
  describe,
  inputId,
  selectId,
}: {
  /** Lot ที่สแกนเจอได้ — ป้ายที่ไม่อยู่ในนี้นับเป็นไม่พบ */
  lots: L[];
  picked: string[];
  onAdd: (lot: L) => void;
  /** เหตุผลที่ใช้ Lot นี้ไม่ได้ — undefined = ใช้ได้ */
  reject?: (lot: L) => string | undefined;
  /** ชื่อผลจำลอง/หัว toast ของ reject เช่น "คนละสินค้า" */
  rejectLabel?: string;
  /** Lot ที่ต้องถามก่อนเพิ่ม — true = ไม่เพิ่มเอง ส่งให้ onHold */
  hold?: (lot: L) => boolean;
  onHold?: (lot: L) => void;
  /** ชื่อผลจำลองของ hold เช่น "มีล็อคแล้ว" */
  holdLabel?: string;
  /** ล็อคที่ใช้แสดงตอนบังคับผลจำลอง hold กับ Lot ที่ยังไม่มีล็อค */
  mockZone?: string;
  /** บรรทัดรองบน toast ตอนเจอ Lot เดียว เช่น "PD…/01 · 80 ตัน" */
  describe: (lot: L) => string;
  inputId: string;
  /** ช่องเลือก Lot — ปุ่ม "เลือก Lot" บน toast ไม่พบ เลื่อนไปเปิดช่องนี้ ไม่ส่ง = สแกนอย่างเดียว */
  selectId?: string;
}) {
  const isPhone = useIsPhone();
  const [simulate, setSimulateState] = React.useState<Simulate>("found");
  const [scannerOpen, setScannerOpenState] = React.useState(false);
  const [reading, setReading] = React.useState<{ done: number; total: number } | null>(null);
  const [flashId, setFlashId] = React.useState<string>();
  /** รูปผ่านบางส่วน — modal สรุป */
  const [partial, setPartial] = React.useState<{ found: string[]; failed: number } | null>(null);

  // สแกนหลายรูปต่อกันในรอบเดียว ต้องเห็น Lot ที่เพิ่งเพิ่มก่อน React วาดใหม่
  const live = React.useRef({ lots, picked, onAdd, reject, hold, onHold, describe });
  React.useEffect(() => {
    live.current = { lots, picked, onAdd, reject, hold, onHold, describe };
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

  const toastCard = (tone: "ok" | "error", title: string, detail: string, withSelect = false) =>
    toast.custom((id) => (
      <ResultCard
        tone={tone}
        className="w-[min(32rem,calc(100vw-2rem))] shadow-lg"
        title={title}
        detail={detail}
        aside={
          withSelect &&
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

  const endSession = () => {
    const rep = sessionRef.current;
    sessionRef.current = null;
    if (!rep) return;
    const found = rep.found.length;
    // กล้องบอกผลไม่ผ่านบนกล้องไปแล้วทีละป้าย สรุปแค่ที่ผ่าน
    const failed = rep.via === "scan" ? 0 : rep.missing.length + rep.rejected.length;
    if (found > 0 && failed === 0) toastCard("ok", "สแกนสำเร็จ", `${found} รายการ`);
    else if (found > 0) setPartial({ found: rep.found.map((l) => l.code), failed });
    else if (failed > 0) toastCard("error", "สแกนไม่สำเร็จ", "กรุณาตรวจสอบ", true);
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

  /** ป้ายที่ "กล้อง" จะอ่านได้ — Lot แรกที่ยังไม่ได้เลือกและใช้ได้
   *  ผลจำลองคนละสินค้า/มีล็อคแล้ว ใช้ Lot ที่เป็นแบบนั้นจริงก่อน ไม่มีก็บังคับผลกับ Lot แรก */
  const mockRead = (): MockRead => {
    const { lots: pool, picked: chosen, reject: rejects, hold: holds } = live.current;
    if (pool.length === 0) return { code: null };
    if (simulateRef.current === "notfound") return { code: missingCode(pool[0].code) };
    const open = pool.filter((l) => !chosen.includes(l.id) && !rejects?.(l));
    const first = open[0] ?? pool.find((l) => !chosen.includes(l.id)) ?? pool[0];
    if (simulateRef.current === "rejected") {
      const real = pool.find((l) => rejects?.(l));
      return real ? { code: real.code } : { code: first.code, force: "rejected" };
    }
    if (simulateRef.current === "held") {
      const real = open.find((l) => holds?.(l));
      return real ? { code: real.code } : { code: first.code, force: "held" };
    }
    // ป้ายที่ต้องถามก่อนมาทีหลัง — สแกนไล่ไปเรื่อยๆ จะไม่เจอคำถามจนกว่าจะหมดป้ายปกติ
    return { code: (open.find((l) => !holds?.(l)) ?? open[0])?.code ?? null };
  };

  const applyCode = (
    code: string | null,
    force?: MockRead["force"]
  ): { outcome: Outcome; lot?: L; reason?: string } => {
    const session = sessionRef.current;
    if (code === null) return { outcome: "empty" };
    const hit = live.current.lots.find((l) => l.code.toUpperCase() === code.trim().toUpperCase());
    if (!hit) {
      session?.missing.push(code);
      return { outcome: "notfound" };
    }
    const reason =
      live.current.reject?.(hit) ?? (force === "rejected" ? "กรุณาสแกน Lot ของสินค้าเดียวกัน" : undefined);
    if (reason) {
      session?.rejected.push({ lot: hit, reason });
      return { outcome: "rejected", lot: hit, reason };
    }
    const forceHold = force === "held" && Boolean(live.current.onHold);
    if (!live.current.picked.includes(hit.id) && (forceHold || live.current.hold?.(hit))) {
      live.current.onHold?.(forceHold && !hit.zone ? { ...hit, zone: mockZone } : hit);
      return { outcome: "held", lot: hit };
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
        // ผลจำลองบางส่วน: รูปคู่ผ่าน รูปคี่ไม่พบ
        const failThis = simulateRef.current === "partial" && index % 2 === 1;
        const read = failThis ? { code: (live.current.lots[0] ? missingCode(live.current.lots[0].code) : null) } : mockRead();
        const { outcome } = applyCode(read.code, read.force);
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
    // ผลจำลองบางส่วนต้องมีอย่างน้อยสองป้าย — รูปเดียวนับเป็นรูปที่มีสองป้าย (ป้ายหลังอ่านไม่ได้)
    const total = simulateRef.current === "partial" ? Math.max(2, photos.length) : photos.length;
    setReading({ done: 0, total });
    readPhoto(total, 0);
  };

  const simulateOptions: { value: Simulate; label: string }[] = [
    // ป้ายสั้นให้พอดีจอมือถือแถวเดียว
    { value: "found", label: "พบ" },
    { value: "notfound", label: "ไม่พบ" },
    ...(reject ? [{ value: "rejected" as const, label: "คนละสินค้า" }] : []),
    ...(hold ? [{ value: "held" as const, label: holdLabel }] : []),
    { value: "partial", label: "รูปบางส่วน" },
  ];

  return {
    isPhone,
    rejectLabel,
    hasSelect: Boolean(selectId),
    openLotSelect,
    partial,
    closePartial: () => setPartial(null),
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

/**
 * กล้องจำลอง — เปิดแล้ว "อ่าน" ป้ายเองหลังเล็งครู่หนึ่ง ทีละป้าย
 * ผ่านแล้วปิดเอง / ไม่ผ่านขึ้นการ์ดแดงบนกล้องค้างไว้ครู่หนึ่งแล้วเล็งใหม่
 * modal "สแกนสำเร็จบางส่วน" ของการเลือกรูปก็อยู่ที่นี่
 * input เลือกรูปอยู่ที่นี่ (นอก Dialog) เพราะคอมโพเนนต์นี้อยู่บนหน้าตลอด
 */
export function ScannerDialog({ scan }: { scan: LotScanner }) {
  const { isPhone } = scan;
  const open = scan.scannerOpen;
  const [phase, setPhase] = React.useState<Phase>({ kind: "aiming", code: null });
  /** ผลไม่ผ่านของป้ายล่าสุด — โชว์บนกล้อง */
  const [error, setError] = React.useState<{ title: string; detail: string } | null>(null);
  /** เพิ่มทีละหนึ่งเพื่อเล็งใหม่หลังอ่านไม่ผ่าน */
  const [round, setRound] = React.useState(0);

  const { mockRead, applyCode, setScannerOpen, setSimulate, rejectLabel } = scan;
  const live = React.useRef({ mockRead, applyCode, setScannerOpen, setSimulate, rejectLabel });
  React.useEffect(() => {
    live.current = { mockRead, applyCode, setScannerOpen, setSimulate, rejectLabel };
  });

  // ชิปผลจำลองบนกล้อง — หน้าสแกนเปิดกล้องทันทีที่เข้า ชิปบนหน้าจึงโดนกล้องบัง
  // "รูปบางส่วน" เป็นผลของการเลือกรูปเท่านั้น กดบนกล้องแล้วเปิดคลังรูปต่อเลย
  const aim = React.useRef<"first" | "chip" | "next">("first");
  const pickSimulate = (v: (typeof scan.simulateOptions)[number]["value"]) => {
    aim.current = "chip";
    scan.setSimulate(v);
    if (v === "partial") scan.pickPhotosFromScanner();
  };

  // เปิดกล้องรอบใหม่ ล้างการ์ดแดงของรอบก่อน (ปรับ state ระหว่าง render แทน effect)
  const [wasOpen, setWasOpen] = React.useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setError(null);
  }

  // ระหว่างเปิดกล้องไม่ให้ toast ใดๆ ทับภาพ (ดู globals.css) — รวมแจ้งเตือนใหม่ของแอปที่เด้งหลังโหลดหน้า
  React.useEffect(() => {
    if (!open) return;
    document.body.dataset.scanning = "";
    return () => {
      delete document.body.dataset.scanning;
    };
  }, [open]);

  React.useEffect(() => {
    if (!open) {
      aim.current = "first";
      return;
    }
    // เลือกผลจำลองบนหน้ามาก่อนแล้วกดสแกน ไม่ต้องรอนานเผื่อกดชิป
    const first = aim.current === "first" && scan.simulate === "found";
    const delay = first ? FIRST_AIM_MS : aim.current === "chip" ? CHIP_AIM_MS : AIM_MS;
    aim.current = "next";
    const { code, force } = live.current.mockRead();
    setPhase({ kind: "aiming", code });
    let retry: ReturnType<typeof setTimeout> | undefined;
    const t = setTimeout(() => {
      const { outcome, reason } = live.current.applyCode(code, force);
      setPhase({ kind: outcome, code });
      if (outcome === "notfound" || outcome === "rejected") {
        setError(
          outcome === "rejected"
            ? { title: live.current.rejectLabel, detail: reason ?? "" }
            : { title: "ไม่พบสินค้าที่ตรงกับบาร์โค้ด", detail: "กรุณาตรวจสอบอีกครั้ง" }
        );
        retry = setTimeout(() => {
          // ผลจำลองแบบไม่ผ่านใช้ครั้งเดียว ป้ายถัดไปกลับเป็นพบสินค้า
          live.current.setSimulate("found");
          setError(null);
          setRound((r) => r + 1);
        }, RETRY_MS);
        return;
      }
      if (outcome === "empty") toast.info("เลือกครบทุก Lot ของสินค้านี้แล้ว");
      live.current.setScannerOpen(false);
    }, delay);
    return () => {
      clearTimeout(t);
      clearTimeout(retry);
    };
  }, [open, scan.simulate, round]);

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
          {/* ภาพกล้องเต็มที่เหลือ — ทับดำ 40% ให้เห็นภาพกล้องอยู่ข้างใต้ มีแค่ปุ่มรูปภาพมุมขวาล่าง */}
          <div className="relative min-h-0 flex-1">
            <Viewfinder
              phase={{ kind: phase.kind === "rejected" || phase.kind === "held" ? "found" : phase.kind, code: phase.code }}
              className="h-full bg-black/40"
            />
            {/* ของจำลอง — ถอดทิ้งพร้อม SimulateToggle เมื่อต่อกล้องจริง */}
            {phase.kind === "aiming" && !error && (
              <div className="absolute inset-x-4 top-4">
                <SimulateToggle dark state={{ simulate: scan.simulate, setSimulate: pickSimulate }} options={scan.simulateOptions} />
              </div>
            )}
            <div className="absolute inset-x-6 bottom-[max(1.5rem,env(safe-area-inset-bottom))] flex justify-end max-sm:inset-x-4">
              {error ? (
                <ResultCard
                  tone="error"
                  title={error.title}
                  detail={error.detail}
                  className="w-full shadow-lg"
                  aside={
                    scan.hasSelect && (
                      <Button size="sm" variant="outline" className="shrink-0 bg-card" onClick={scan.openLotSelect}>
                        เลือก Lot
                      </Button>
                    )
                  }
                />
              ) : (
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
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={Boolean(scan.partial)} onOpenChange={(o) => !o && scan.closePartial()}>
        <DialogContent className="max-w-[calc(100vw-2rem)] gap-0 p-6 text-center sm:max-w-md">
          <DialogTitle className="text-lg">สแกนสำเร็จบางส่วน</DialogTitle>
          <DialogDescription asChild>
            <div className="mt-2 space-y-1 text-muted-foreground">
              <p>สแกนสำเร็จ: {scan.partial?.found.length} รายการ</p>
              {scan.partial?.found.map((code) => (
                <p key={code} className="tabular-nums">
                  {code}
                </p>
              ))}
              <p>สแกนไม่สำเร็จ: {scan.partial?.failed} รายการ</p>
              <p>กรุณาตรวจสอบ</p>
            </div>
          </DialogDescription>
          <Button className="mt-6 w-full" onClick={scan.closePartial}>
            ตกลง
          </Button>
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
