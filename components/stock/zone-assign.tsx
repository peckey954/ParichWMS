"use client";

import * as React from "react";
import {
  CircleCheckIcon,
  CircleXIcon,
  RotateCcwIcon,
  ScanBarcodeIcon,
  XIcon,
} from "lucide-react";
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
import { Checkbox } from "@peckey954/ui/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@peckey954/ui/components/ui/dialog";
import { Input } from "@peckey954/ui/components/ui/input";
import { Label } from "@peckey954/ui/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@peckey954/ui/components/ui/select";
import { Spinner } from "@peckey954/ui/components/ui/spinner";
import { cn } from "@peckey954/ui/lib/utils";
import { toast } from "sonner";
import { ZONES, formatQty, type InboundPiece } from "@/lib/general-stock";

/* ------------------------------------------------------------------
   เลือกโซนรับเข้า — ตาม Flow เพิ่มโซน ใน Figma (Tab 2.2 Stock-In Choose Zone)

   คนที่ทำงานนี้ไม่ใช่คนเดียวกับคนที่รับของหน้าโกดัง และมาทำทีหลัง ลำดับที่ทำจริงคือ

     1  ยืนอยู่หน้าโซนไหน เลือกโซนนั้นไว้ก่อน
     2  ไล่สแกนเลขที่ติดบนของที่กำลังจะวางลงตรงนั้น หรือค้นหาเลขแล้วติ๊กจากรายการ
     3  กดบันทึกครั้งเดียวให้ทุกชิ้นที่เลือกไว้

   เป็นหน้าเต็มทั้งจอคอมและมือถือ (/stock/inbound/[id]/zone) ไม่ใช่กล่องบนหน้าใบ

   ---------- สองปุ่มเสมอ ----------

     สแกนเลขที่สินค้า  เปิดกล้อง
     สแกนจากรูปภาพ    หยิบรูปป้ายที่ถ่ายไว้ (มือถือ = คลังรูป, คอม = เลือกไฟล์/ลากมาวาง)
                       เลือกได้หลายรูป อ่านเลขแล้วจบ ไม่เก็บรูป

   ---------- ผลสแกน: จอคอมกับมือถือบอกคนละแบบ ----------

   จอคอม    กล้องเป็นกล่อง มีแค่ "กำลังค้นหาบาร์โค้ด..." อ่านติดแล้วกล่องปิดเอง
            ติ๊กในรายการ แล้วบอกผลด้วย toast มุมล่างขวา ("สแกนสำเร็จ" / ไม่พบ)
   มือถือ   กล้องเต็มจอ อ่านติดแล้วค้างหน้ากล้องไว้ บอกผลในแผงล่าง ให้กด "สแกน"
            ชิ้นต่อไปได้ทันที กด "เสร็จสิ้น" แล้วสรุปผลทั้งรอบเป็นแถบเหนือปุ่มบันทึก

   ทั้งสองแบบไม่มีไอคอนสถานะทับบนบาร์โค้ด — ผลอยู่ที่ข้อความ ไม่ใช่ที่ภาพกล้อง

   ไม่พบสินค้ามีปุ่ม "ระบุเลข" เสมอ กดแล้วพากลับมาหน้านี้ เลื่อนไปที่ช่องระบุเลข
   พร้อมเคอร์เซอร์ในช่อง ไม่ต้องไล่หาเอง

   ---------- ยังเป็นของจำลอง ----------

   กล้องกับการถอดบาร์โค้ดยังไม่ได้ต่อของจริง เลขที่อ่านได้มาจากชิ้นในใบนี้เอง
   ส่วนผลไม่พบสลับได้จากชิป "ผลจำลอง" เพื่อดู flow ให้ครบทั้งสองทาง
------------------------------------------------------------------ */

/** มาจากทางไหน — ข้อความผลต่างกันนิดหน่อยตามทาง */
type Via = "scan" | "photo" | "manual";

/** ผลรวมของหนึ่งรอบ (เปิดกล้องหนึ่งครั้ง / เลือกรูปหนึ่งชุด / กด Enter หนึ่งครั้ง) */
type Report = { via: Via; found: InboundPiece[]; missing: string[] };

/** ผลที่เดโมจะให้ออก — ยังไม่มีตัวถอดบาร์โค้ดจริง */
type Simulate = "found" | "notfound";

type Outcome = "found" | "already" | "notfound" | "empty";

/** กำลังอ่านรูปอยู่ — done คืออ่านไปแล้วกี่รูปจากทั้งหมด */
type Reading = { done: number; total: number } | null;

/** เวลาอ่านต่อหนึ่งรูป ถอดบาร์โค้ดจริงในเครื่องก็อยู่ราวนี้ */
const READ_MS = 900;
/** เวลาส่องกล้องจนจับติด */
const AIM_MS = 1800;

/** ช่องเลขที่กับช่องไฟล์ — ปุ่มในกล่องสแกนและแถบผลต้องสั่งมันได้ หาด้วย id */
const CODE_INPUT_ID = "zone-code";
const PHOTO_INPUT_ID = "zone-photo";

/** จอแคบ = ถือมือถืออยู่ */
export function useIsPhone() {
  return React.useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia("(max-width: 639px)");
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => window.matchMedia("(max-width: 639px)").matches,
    () => false
  );
}

const pieceLine = (p: InboundPiece) =>
  `${p.receiptCode} ${p.packing} · ${formatQty(p.qty)} ตัน`;

export function useZoneAssign(pieces: InboundPiece[]) {
  const isPhone = useIsPhone();
  const [picked, setPicked] = React.useState<Set<string>>(new Set());
  const [zone, setZone] = React.useState<string>();
  const [query, setQuery] = React.useState("");
  /** ผลรอบล่าสุดที่โชว์เป็นแถบบนมือถือ — จอคอมใช้ toast แทน จึงว่างตลอด */
  const [report, setReport] = React.useState<Report | null>(null);
  const [simulate, setSimulateState] = React.useState<Simulate>("found");
  const [scannerOpen, setScannerOpenState] = React.useState(false);
  const [reading, setReading] = React.useState<Reading>(null);
  /** ชิ้นที่เพิ่งได้มา — กะพริบในรายการให้ตาตามทัน */
  const [flashId, setFlashId] = React.useState<string>();

  // อ่านค่าล่าสุดจากในตัวจับเวลาโดยไม่ต้องผูกมันไว้กับ state ทุกตัว
  const pickedRef = React.useRef(picked);
  const simulateRef = React.useRef(simulate);
  const sessionRef = React.useRef<Report | null>(null);
  const timersRef = React.useRef<ReturnType<typeof setTimeout>[]>([]);
  const flashTimer = React.useRef<ReturnType<typeof setTimeout>>(undefined);

  React.useEffect(() => {
    pickedRef.current = picked;
  }, [picked]);

  // เซ็ต ref ทันทีตอนสลับ — กล่องสแกนเริ่มรอบใหม่ใน effect ของมันเอง
  // ซึ่งวิ่งก่อน effect ของ hook นี้ ถ้ารอ effect มันจะอ่านค่าเก่า
  const setSimulate = (v: Simulate) => {
    simulateRef.current = v;
    setSimulateState(v);
  };

  React.useEffect(() => {
    return () => {
      for (const t of timersRef.current) clearTimeout(t);
      clearTimeout(flashTimer.current);
    };
  }, []);

  // คำค้นเทียบทั้งเลขเต็มและท่อนท้าย บางทีคนอ่านจากป้ายแล้วพิมพ์แค่ท้ายเลข
  const q = query.trim().toUpperCase();
  const visible = q
    ? pieces.filter((p) => p.receiptCode.toUpperCase().includes(q))
    : pieces;
  /** ชิ้นที่ยังไม่มีโซนในรายการที่เห็นอยู่ตอนนี้ — ปุ่มเลือกรวดเดียวทำแค่เท่าที่เห็น */
  const waiting = visible.filter((p) => !p.zone);

  const isAllPicked = (list: InboundPiece[]) =>
    list.length > 0 && list.every((p) => picked.has(p.id));

  const toggle = (id: string) =>
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  /**
   * ชิปเลือกรวดเดียว — ครบอยู่แล้วกดซ้ำคือเอาออก
   * ทบเข้ากับที่เลือกไว้เดิม ไม่ใช่เขียนทับ
   */
  const toggleAll = (list: InboundPiece[]) => {
    const remove = isAllPicked(list);
    setPicked((prev) => {
      const next = new Set(prev);
      for (const p of list) {
        if (remove) next.delete(p.id);
        else next.add(p.id);
      }
      return next;
    });
  };

  const clearAll = () => {
    for (const t of timersRef.current) clearTimeout(t);
    setReading(null);
    setPicked(new Set());
    pickedRef.current = new Set();
    setReport(null);
    setQuery("");
  };

  /** เปลี่ยนโซนหลังยืนยันแล้ว — ของที่ติ๊กไว้เป็นของโซนเดิม ล้างทิ้งทั้งหมด */
  const changeZone = (next: string) => {
    clearAll();
    setZone(next);
  };

  const focusManual = () => {
    setScannerOpen(false);
    // รอกล่องสแกนปิดก่อน ไม่งั้นมันคืนโฟกัสไปที่ปุ่มสแกนทับ
    setTimeout(() => {
      const input = document.getElementById(CODE_INPUT_ID);
      if (!(input instanceof HTMLInputElement)) return;
      input.scrollIntoView({ block: "center", behavior: "smooth" });
      input.focus({ preventScroll: true });
      input.select();
    }, 80);
  };

  // ---------- รอบของการสแกน ----------

  const startSession = (via: Via) => {
    sessionRef.current = { via, found: [], missing: [] };
    setReport(null);
  };

  /**
   * จบรอบ — จอคอมบอกด้วย toast มุมล่างขวา มือถือค้างเป็นแถบเหนือปุ่มบันทึก
   * ทั้งสองแบบแยก "เจอ" กับ "ไม่พบ" เป็นคนละก้อน เพราะสแกนหลายรูปได้ทั้งสองอย่าง
   * พร้อมกัน ไม่ควรให้อันหนึ่งกลบอีกอัน
   */
  const endSession = () => {
    const rep = sessionRef.current;
    sessionRef.current = null;
    if (!rep || (rep.found.length === 0 && rep.missing.length === 0)) return;
    if (isPhone) {
      setReport(rep);
      return;
    }
    if (rep.found.length > 0) {
      const one = rep.found.length === 1 ? rep.found[0] : undefined;
      toast.custom(() => (
        <ResultCard
          tone="ok"
          className="w-[min(32rem,calc(100vw-2rem))] shadow-lg"
          title={rep.via === "manual" ? "เลือกสินค้าแล้ว" : "สแกนสำเร็จ"}
          detail={one ? pieceLine(one) : `${rep.found.length} รายการ`}
          zone={one ? (one.zone ?? null) : undefined}
        />
      ));
    }
    if (rep.missing.length > 0) {
      toast.custom((id) => (
        <ResultCard
          tone="error"
          className="w-[min(32rem,calc(100vw-2rem))] shadow-lg"
          title="ไม่พบสินค้าที่ตรงกับบาร์โค้ด"
          detail={
            rep.missing.length === 1
              ? rep.missing[0]
              : `${rep.missing.length} รายการ`
          }
          onManual={() => {
            toast.dismiss(id);
            focusManual();
          }}
        />
      ));
    }
  };

  /** เปิด/ปิดกล้อง — เปิดคือเริ่มรอบใหม่ ปิดคือจบรอบแล้วบอกผล */
  function setScannerOpen(open: boolean) {
    if (open) startSession("scan");
    else if (sessionRef.current?.via === "scan") endSession();
    setScannerOpenState(open);
  }

  /**
   * เลขที่ที่ "กล้อง" จะอ่านได้ในรอบนี้
   *
   * โหมดเจอ: หยิบชิ้นที่ยังไม่ได้เลือกและยังไม่มีโซนก่อน null คือไม่เหลือให้เลือกแล้ว
   * โหมดไม่พบ: เลขหน้าตาเหมือนของในใบ แต่ไม่ตรงกับชิ้นไหน
   */
  const mockRead = (): string | null => {
    if (simulateRef.current === "notfound") {
      const base = pieces[0]?.receiptCode ?? "GS-0000-1-01";
      return base.replace(/\d+$/, "99");
    }
    const done = pickedRef.current;
    const hit =
      pieces.find((p) => !done.has(p.id) && !p.zone) ??
      pieces.find((p) => !done.has(p.id));
    return hit?.receiptCode ?? null;
  };

  /**
   * ได้เลขมาหนึ่งเลข — เทียบกับชิ้นในใบ ติ๊กให้ถ้าเจอ แล้วนับเข้ารอบที่กำลังทำอยู่
   *
   * ล้างคำค้นทิ้งด้วย ไม่งั้นชิ้นที่เพิ่งเลือกอาจอยู่นอกคำค้นเดิมจนไม่เห็นในรายการ
   */
  const applyCode = (
    code: string | null
  ): { outcome: Outcome; piece?: InboundPiece } => {
    const session = sessionRef.current;
    if (code === null) return { outcome: "empty" };
    const hit = pieces.find(
      (p) => p.receiptCode.toUpperCase() === code.trim().toUpperCase()
    );
    if (!hit) {
      session?.missing.push(code);
      return { outcome: "notfound" };
    }

    setQuery("");
    clearTimeout(flashTimer.current);
    setFlashId(hit.id);
    flashTimer.current = setTimeout(() => setFlashId(undefined), 1600);
    if (session && !session.found.some((p) => p.id === hit.id))
      session.found.push(hit);

    if (pickedRef.current.has(hit.id)) return { outcome: "already", piece: hit };
    // อัปเดต ref ทันที รูปถัดไปในชุดเดียวกันจะได้ไม่หยิบชิ้นเดิมซ้ำ
    pickedRef.current = new Set(pickedRef.current).add(hit.id);
    setPicked((prev) => new Set(prev).add(hit.id));
    return { outcome: "found", piece: hit };
  };

  /**
   * อ่านรูปทีละใบ ติ๊กไปทีละชิ้น ไม่ใช่รอครบแล้วค่อยติ๊กรวดเดียว
   * เห็นรายการติ๊กไล่ลงมาบอกได้ทั้งว่ายังทำงานอยู่และได้ชิ้นไหนไปแล้วบ้าง
   */
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
          toast.info("เลือกครบทุกชิ้นในใบนี้แล้ว");
        endSession();
      }, READ_MS),
    ];
  };

  /** สแกนจากรูปที่ถ่ายไว้ — อ่านเลขแล้วทิ้งรูป ไม่เก็บไว้ที่ไหน */
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

  /**
   * เอ็นเทอร์ในช่องเลขที่ — เครื่องยิงบาร์โค้ดพิมพ์เลขให้เองแล้วเคาะเอ็นเทอร์ต่อท้าย
   * เลขตรงเป๊ะหรือคำค้นเหลือชิ้นเดียวก็ติ๊กให้ ไม่มีชิ้นไหนตรงเลยก็บอกว่าไม่พบ
   * แต่ถ้ายังเหลือหลายชิ้นไม่เดาให้
   */
  const acceptOnlyMatch = () => {
    if (!q) return;
    const exact = pieces.find((p) => p.receiptCode.toUpperCase() === q);
    const code = exact
      ? exact.receiptCode
      : visible.length === 1
        ? visible[0].receiptCode
        : visible.length === 0
          ? query.trim()
          : null;
    if (code === null) return;
    startSession("manual");
    applyCode(code);
    endSession();
  };

  const pickPhotos = () => document.getElementById(PHOTO_INPUT_ID)?.click();

  return {
    isPhone,
    pieces,
    picked,
    zone,
    setZone,
    changeZone,
    query,
    setQuery,
    report,
    reading,
    simulate,
    setSimulate,
    scannerOpen,
    setScannerOpen,
    flashId,
    visible,
    waiting,
    isAllPicked,
    toggle,
    toggleAll,
    clearAll,
    mockRead,
    applyCode,
    scanPhotos,
    pickPhotos,
    focusManual,
    acceptOnlyMatch,
    canSubmit: Boolean(zone) && picked.size > 0,
  };
}

export type ZoneAssign = ReturnType<typeof useZoneAssign>;

/** ตัวหน้าจอทั้งชุด ตั้งแต่โซนลงไปถึงรายการ */
export function ZoneAssignFields({
  state,
  listClassName,
}: {
  state: ZoneAssign;
  /** ความสูงกรอบรายการ */
  listClassName?: string;
}) {
  const { pieces, picked, visible, waiting } = state;
  /** โซนที่กำลังจะเปลี่ยนไป — รอคนยืนยันก่อนเพราะของที่ติ๊กไว้จะหายหมด */
  const [pendingZone, setPendingZone] = React.useState<string>();

  return (
    <div className="space-y-4">
      {/* ---------- โซนปลายทาง ----------
           อยู่บนสุด เพราะลำดับที่คนทำจริงคือยืนอยู่หน้าโซนก่อน แล้วค่อยไล่สแกน */}
      <div className="space-y-2">
        <Label htmlFor="zone-target">โซน</Label>
        <Select
          value={state.zone}
          onValueChange={(v) => {
            if (state.zone && v !== state.zone && picked.size > 0)
              setPendingZone(v);
            else state.setZone(v);
          }}
        >
          <SelectTrigger id="zone-target" className="w-full bg-card">
            <SelectValue placeholder="เลือกโซนรับเข้า" />
          </SelectTrigger>
          <SelectContent>
            {ZONES.map((z) => (
              <SelectItem key={z} value={z}>
                {z}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <CaptureTiles state={state} />

      {/* คั่นให้เห็นว่าข้างล่างคืออีกทางหนึ่งของงานเดียวกัน ไม่ใช่ขั้นถัดไป */}
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        หรือ
        <span className="h-px flex-1 bg-border" />
      </div>

      {/* ---------- ระบุเลขที่เอง ----------
           ป้ายเปื้อน ป้ายยับ หรือของวางชิดกำแพงจนส่องไม่ติด เป็นเรื่องที่เกิดทุกวัน
           ทางนี้จึงเปิดไว้ตลอด เครื่องยิงบาร์โค้ดก็ยิงเข้าช่องนี้ได้เลย */}
      <div className="scroll-mt-24 space-y-2">
        <Label htmlFor={CODE_INPUT_ID}>ระบุเลขที่สินค้า</Label>
        <Input
          id={CODE_INPUT_ID}
          autoComplete="off"
          className="bg-card"
          placeholder="ระบุเลขที่สินค้า"
          value={state.query}
          onKeyDown={(e) => {
            if (e.key !== "Enter") return;
            e.preventDefault();
            state.acceptOnlyMatch();
          }}
          onChange={(e) => state.setQuery(e.target.value)}
        />
      </div>

      {/* ---------- เลือกรวดเดียว + ยอดที่เลือกไว้ ---------- */}
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <ActionChip
            on={state.isAllPicked(visible)}
            disabled={visible.length === 0}
            onClick={() => state.toggleAll(visible)}
          >
            เลือกทั้งหมด ({visible.length})
          </ActionChip>
          <ActionChip
            on={state.isAllPicked(waiting)}
            disabled={waiting.length === 0}
            onClick={() => state.toggleAll(waiting)}
          >
            เลือกที่ยังไม่มีโซน ({waiting.length})
          </ActionChip>
        </div>

        <div className="flex items-center gap-1">
          <p className="text-sm text-muted-foreground">
            เลือกแล้ว{" "}
            <span className="font-semibold text-foreground tabular-nums">
              {picked.size}
            </span>{" "}
            จาก {pieces.length} รายการ
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="text-primary hover:text-primary"
            disabled={picked.size === 0 && state.query === ""}
            onClick={state.clearAll}
          >
            <RotateCcwIcon />
            ล้างค่า
          </Button>
        </div>
      </div>

      {/* ---------- รายการ ---------- */}
      <div
        className={cn(
          "overflow-y-auto rounded-lg border border-border",
          listClassName ?? "max-h-72"
        )}
      >
        {pieces.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-muted-foreground">
            ยังไม่มีชิ้นที่รับเข้าในใบนี้
          </p>
        ) : visible.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-muted-foreground">
            ไม่พบเลขที่ {state.query.trim()} ในใบรับเข้านี้
          </p>
        ) : (
          <ul>
            {visible.map((p) => (
              <PieceRow
                key={p.id}
                piece={p}
                checked={picked.has(p.id)}
                flash={state.flashId === p.id}
                onToggle={() => state.toggle(p.id)}
              />
            ))}
          </ul>
        )}
      </div>

      <ScannerDialog state={state} />

      {/* ---------- เปลี่ยนโซนทั้งที่ติ๊กของไว้แล้ว ---------- */}
      <AlertDialog
        open={pendingZone !== undefined}
        onOpenChange={(o) => !o && setPendingZone(undefined)}
      >
        <AlertDialogContent size="sm" className="data-[size=sm]:max-w-[22rem]">
          <AlertDialogHeader>
            <AlertDialogTitle>
              พบข้อมูลมีการเลือกโซนไว้ก่อนหน้าแล้ว
            </AlertDialogTitle>
            <AlertDialogDescription>
              หากเปลี่ยนโซน ข้อมูลที่เลือกไว้ก่อนหน้าจะถูกล้าง
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel variant="outline-primary">ย้อนกลับ</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingZone) state.changeZone(pendingZone);
                setPendingZone(undefined);
              }}
            >
              เปลี่ยนโซน
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* ------------------------------------------------------------------
   สองทางเข้า — สแกนกล้องกับสแกนจากรูป (สองปุ่มเสมอ)

   บนมือถือหยิบจากคลังรูป บนคอมเลือกไฟล์หรือลากรูปมาวางในกรอบ
   ไม่ใส่ capture ในช่องไฟล์ — ทางถ่ายใหม่มีปุ่มสแกนแล้ว ปุ่มนี้มีไว้หยิบรูปเก่า
   ล้างค่าในช่องทุกครั้งหลังหยิบ ไม่งั้นเลือก "รูปเดิม" ซ้ำรอบสองจะไม่เกิด change
------------------------------------------------------------------ */

function CaptureTiles({ state }: { state: ZoneAssign }) {
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
          ? "สแกนเลขที่เพื่อเลือกโซนรับสินค้าเข้าคลัง"
          : state.reading.total > 1
            ? `กำลังอ่านรูปที่ ${state.reading.done + 1} จาก ${state.reading.total}...`
            : "กำลังอ่านบาร์โค้ดจากรูป..."}
      </p>

      <div className="flex flex-wrap justify-center gap-2">
        <Button
          variant="outline-primary"
          size="sm"
          className="bg-card"
          onClick={() => state.setScannerOpen(true)}
        >
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

/**
 * ชิปสลับผลจำลอง — มีไว้ให้เดินดู flow ไม่พบสินค้าได้
 * ตัวถอดบาร์โค้ดจริงมาเมื่อไรชิปนี้ถอดทิ้ง
 */
function SimulateToggle({
  state,
  dark,
}: {
  state: ZoneAssign;
  dark?: boolean;
}) {
  const options: { value: Simulate; label: string }[] = [
    { value: "found", label: "พบสินค้า" },
    { value: "notfound", label: "ไม่พบสินค้า" },
  ];
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 text-xs",
        dark ? "text-white/70" : "text-muted-foreground"
      )}
    >
      ผลจำลอง
      <div
        className={cn(
          "flex rounded-full border border-dashed p-0.5",
          dark ? "border-white/40" : "border-border"
        )}
      >
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            aria-pressed={state.simulate === o.value}
            onClick={() => state.setSimulate(o.value)}
            className={cn(
              "rounded-full px-2.5 py-1 transition-colors",
              state.simulate === o.value
                ? dark
                  ? "bg-white font-medium text-neutral-900"
                  : "bg-brand font-medium text-primary"
                : dark
                  ? "text-white/80 hover:text-white"
                  : "hover:text-foreground"
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------
   กล่องสแกน — ภาพจำลองของกล้อง

   จอคอม   กล่องกลางจอ มีแค่ "กำลังค้นหาบาร์โค้ด..." อ่านติดแล้วปิดเอง ผลไปที่ toast
   มือถือ  เต็มจอ อ่านติดแล้วค้างไว้ บอกผลในแผงล่าง กด "สแกน" ชิ้นถัดไป
           หรือ "เสร็จสิ้น" กลับไปหน้าเลือกโซน
------------------------------------------------------------------ */

type ScanPhase =
  | { kind: "aiming"; code: string | null }
  | { kind: Outcome; code: string | null; piece?: InboundPiece };

function ScannerDialog({ state }: { state: ZoneAssign }) {
  const { isPhone } = state;
  const open = state.scannerOpen;
  const [phase, setPhase] = React.useState<ScanPhase>({
    kind: "aiming",
    code: null,
  });
  const [round, setRound] = React.useState(0);

  // เริ่มรอบส่องใหม่ทุกครั้งที่เปิด กดสแกนต่อ หรือสลับผลจำลองระหว่างส่อง
  const { mockRead, applyCode, setScannerOpen } = state;
  const live = React.useRef({ mockRead, applyCode, setScannerOpen, isPhone });
  React.useEffect(() => {
    live.current = { mockRead, applyCode, setScannerOpen, isPhone };
  });

  React.useEffect(() => {
    if (!open) return;
    const code = live.current.mockRead();
    setPhase({ kind: "aiming", code });
    const t = setTimeout(() => {
      const { outcome, piece } = live.current.applyCode(code);
      setPhase({ kind: outcome, code, piece });
      // จอคอมไม่ค้างหน้ากล้อง อ่านติดแล้วปิดเอง ผลไปบอกที่ toast
      if (!live.current.isPhone) {
        if (outcome === "empty") toast.info("เลือกครบทุกชิ้นในใบนี้แล้ว");
        live.current.setScannerOpen(false);
      }
    }, AIM_MS);
    return () => clearTimeout(t);
  }, [open, round, state.simulate]);

  const again = () => setRound((r) => r + 1);
  const close = () => state.setScannerOpen(false);

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
            <DialogDescription className="mt-1">
              วางบาร์โค้ดให้อยู่ในตำแหน่งสแกน
            </DialogDescription>
          </div>
          <Button variant="ghost" size="icon" aria-label="ปิด" onClick={close}>
            <XIcon />
          </Button>
        </div>

        <Viewfinder
          phase={phase}
          className={isPhone ? "min-h-0 flex-1" : "h-[min(58dvh,580px)]"}
        >
          {phase.kind === "aiming" && <SimulateToggle state={state} dark />}
        </Viewfinder>

        <div className="space-y-3 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {phase.kind === "aiming" || !isPhone ? (
            <div className="flex min-h-14 items-center justify-center gap-2 text-sm text-muted-foreground">
              <Spinner className="size-4" />
              กำลังค้นหาบาร์โค้ด...
            </div>
          ) : (
            <>
              <ScanPanel
                phase={phase}
                picked={state.picked.size}
                total={state.pieces.length}
                onManual={state.focusManual}
              />
              {phase.kind === "empty" ? (
                <Button className="w-full" onClick={close}>
                  เสร็จสิ้น
                </Button>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline-primary" onClick={close}>
                    เสร็จสิ้น
                  </Button>
                  <Button onClick={again}>
                    <ScanBarcodeIcon />
                    สแกน
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** ผลของการส่องครั้งล่าสุดในหน้ากล้องบนมือถือ */
function ScanPanel({
  phase,
  picked,
  total,
  onManual,
}: {
  phase: ScanPhase;
  picked: number;
  total: number;
  onManual: () => void;
}) {
  if (phase.kind === "notfound")
    return (
      <ResultCard
        tone="error"
        title="ไม่พบสินค้าที่ตรงกับบาร์โค้ด"
        detail={phase.code ?? ""}
        onManual={onManual}
      />
    );
  if (phase.kind === "empty")
    return <ResultCard tone="ok" title="เลือกครบทุกชิ้นในใบนี้แล้ว" />;
  const p = "piece" in phase ? phase.piece : undefined;
  return (
    <ResultCard
      tone="ok"
      title={phase.kind === "already" ? "สินค้านี้เลือกไว้แล้ว" : "เลือกสินค้าแล้ว"}
      detail={p ? `${p.receiptCode} · ${p.packing} · ${formatQty(p.qty)} ตัน` : undefined}
      aside={
        <span className="text-xs text-muted-foreground tabular-nums">
          {picked}/{total}
        </span>
      }
    />
  );
}

/**
 * การ์ดผล — ใช้ร่วมกันทั้ง toast (จอคอม) แถบเหนือปุ่มบันทึก (มือถือ) และแผงหน้ากล้อง
 * ไม่พบสินค้ามีปุ่ม "ระบุเลข" ติดมาเสมอ
 */
function ResultCard({
  tone,
  title,
  detail,
  zone,
  aside,
  onManual,
  className,
}: {
  tone: "ok" | "error";
  title: string;
  detail?: string;
  /** undefined = ไม่โชว์ป้ายโซน, null = ชิ้นนั้นยังไม่มีโซน */
  zone?: string | null;
  aside?: React.ReactNode;
  onManual?: () => void;
  className?: string;
}) {
  const ok = tone === "ok";
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 rounded-lg border px-4 py-3",
        ok ? "border-primary/40 bg-brand" : "border-danger-border bg-danger",
        className
      )}
    >
      <div className="flex min-w-0 items-start gap-2">
        {ok ? (
          <CircleCheckIcon className="mt-0.5 size-4 shrink-0 text-primary" />
        ) : (
          <CircleXIcon className="mt-0.5 size-4 shrink-0 text-danger-strong" />
        )}
        <div className="min-w-0">
          <p
            className={cn(
              "text-sm font-semibold",
              ok ? "text-primary" : "text-danger-strong"
            )}
          >
            {title}
          </p>
          {detail && (
            <p
              className={cn(
                "mt-0.5 truncate text-sm",
                ok ? "text-primary/80" : "text-danger-strong/80"
              )}
            >
              {detail}
            </p>
          )}
        </div>
      </div>
      {aside}
      {zone !== undefined && <ZoneTag zone={zone ?? undefined} />}
      {onManual && (
        <Button
          size="sm"
          variant="outline"
          className="shrink-0 bg-card"
          onClick={onManual}
        >
          ระบุเลข
        </Button>
      )}
    </div>
  );
}

/** ภาพกล้องจำลอง — ส่องหาอยู่มีกรอบกับเลเซอร์ อ่านติดแล้วเหลือแค่ป้าย */
function Viewfinder({
  phase,
  className,
  children,
}: {
  phase: ScanPhase;
  className?: string;
  children?: React.ReactNode;
}) {
  const aiming = phase.kind === "aiming";

  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center gap-6 overflow-hidden bg-neutral-950 px-4 py-6",
        className
      )}
    >
      <div className="relative w-full max-w-72">
        <div
          className={cn(
            "mx-auto w-[85%] rounded-md bg-white px-4 py-3 text-neutral-900 shadow-lg transition-transform duration-500",
            aiming ? "-rotate-3 scale-95" : "rotate-0 scale-100"
          )}
        >
          <p className="text-[10px] font-semibold tracking-wide text-neutral-500">
            เลขที่รับสินค้า
          </p>
          {phase.code ? (
            <>
              <Barcode value={phase.code} className="mt-1 h-14 w-full" />
              <p className="mt-1 text-center font-mono text-xs tracking-wider">
                {phase.code}
              </p>
            </>
          ) : (
            <p className="py-6 text-center text-xs text-neutral-500">
              ไม่มีป้ายเหลือให้สแกน
            </p>
          )}
        </div>

        {aiming && (
          <div className="pointer-events-none absolute -inset-3">
            {[
              "top-0 left-0 border-t-4 border-l-4 rounded-tl-lg",
              "top-0 right-0 border-t-4 border-r-4 rounded-tr-lg",
              "bottom-0 left-0 border-b-4 border-l-4 rounded-bl-lg",
              "bottom-0 right-0 border-b-4 border-r-4 rounded-br-lg",
            ].map((c) => (
              <span key={c} className={cn("absolute size-7 border-white", c)} />
            ))}
            <span className="absolute inset-x-2 h-0.5 animate-[scan-line_1.4s_ease-in-out_infinite_alternate] bg-red-500 shadow-[0_0_10px_2px_rgba(239,68,68,0.7)]" />
          </div>
        )}
      </div>

      {children && <div className="relative">{children}</div>}
    </div>
  );
}

/** บาร์โค้ดหน้าตาพอเชื่อได้จากตัวอักษรในเลขที่ — ภาพประกอบ ไม่ได้เข้ารหัสจริง */
function Barcode({ value, className }: { value: string; className?: string }) {
  const bars: { x: number; w: number }[] = [];
  let x = 0;
  const push = (w: number, gap: number) => {
    bars.push({ x, w });
    x += w + gap;
  };
  push(1, 1);
  push(1, 1);
  for (const ch of value) {
    const c = ch.charCodeAt(0);
    push((c % 3) + 1, ((c >> 2) % 2) + 1);
    push(((c >> 1) % 2) + 1, ((c >> 3) % 3) + 1);
  }
  push(1, 1);
  push(1, 0);

  return (
    <svg
      viewBox={`0 0 ${x} 40`}
      preserveAspectRatio="none"
      className={className}
      aria-hidden
    >
      {bars.map((b, i) => (
        <rect key={i} x={b.x} y={0} width={b.w} height={40} fill="currentColor" />
      ))}
    </svg>
  );
}

/**
 * แถบผลบนมือถือ — สรุปทั้งรอบเหนือปุ่มบันทึก (จอคอมใช้ toast จึงไม่ขึ้นแถบนี้)
 * เจอกับไม่พบแยกเป็นคนละการ์ด สแกนหลายรูปได้ทั้งสองอย่างพร้อมกัน
 */
export function ZoneScanResult({ state }: { state: ZoneAssign }) {
  const rep = state.report;
  if (!rep) return null;
  const one = rep.found.length === 1 ? rep.found[0] : undefined;

  return (
    <div className="space-y-2">
      {rep.found.length > 0 && (
        <ResultCard
          tone="ok"
          title="เลือกสินค้าแล้ว"
          detail={one ? pieceLine(one) : `${rep.found.length} รายการ`}
          zone={one ? (one.zone ?? null) : undefined}
        />
      )}
      {rep.missing.length > 0 && (
        <ResultCard
          tone="error"
          title="ไม่พบสินค้าที่ตรงกับบาร์โค้ด"
          detail={
            rep.missing.length === 1
              ? rep.missing[0]
              : `${rep.missing.length} รายการ`
          }
          onManual={state.focusManual}
        />
      )}
    </div>
  );
}

/** ปุ่มทรงชิป — ทำงานทันทีที่กด ไม่ใช่ตัวเลือกที่รอกดยืนยันทีหลัง */
function ActionChip({
  on,
  disabled,
  onClick,
  children,
}: {
  on: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex min-h-10 shrink-0 items-center rounded-full border px-4",
        "text-sm whitespace-nowrap transition-colors",
        "hover:bg-accent-hover",
        "focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
        "disabled:opacity-50 disabled:hover:bg-transparent",
        on
          ? "border-primary font-medium text-primary"
          : "border-border text-foreground"
      )}
    >
      {children}
    </button>
  );
}

/** โซนปัจจุบันของชิ้นหนึ่ง — ยังไม่มีโซนคือสถานะปกติ ไม่ใช่ข้อมูลขาด */
function ZoneTag({ zone }: { zone?: string }) {
  if (!zone)
    return (
      <Badge
        appearance="outline"
        className="shrink-0 bg-card whitespace-nowrap"
      >
        ยังไม่มีโซน
      </Badge>
    );
  return (
    <Badge appearance="soft" className="shrink-0 whitespace-nowrap">
      {zone}
    </Badge>
  );
}

function PieceRow({
  piece: p,
  checked,
  flash,
  onToggle,
}: {
  piece: InboundPiece;
  checked: boolean;
  /** เพิ่งได้มาจากสแกน — เลื่อนมาให้เห็นแล้วกะพริบกรอบ */
  flash?: boolean;
  onToggle: () => void;
}) {
  const ref = React.useRef<HTMLLIElement>(null);
  React.useEffect(() => {
    if (flash) ref.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [flash]);

  return (
    <li ref={ref} className="border-b border-border last:border-b-0">
      <label
        className={cn(
          "flex cursor-pointer items-center gap-3 px-3 py-2.5 transition-colors",
          checked ? "bg-brand" : "hover:bg-accent",
          flash && "ring-2 ring-primary ring-inset"
        )}
      >
        <Checkbox checked={checked} onCheckedChange={onToggle} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium">
            {p.receiptCode}
          </span>
          <span className="block truncate text-xs text-muted-foreground">
            {p.packing} · {formatQty(p.qty)} ตัน
            {!p.correct && " · ไม่ถูกต้อง"}
          </span>
        </span>
        {/* ชิ้นที่มีโซนแล้วยังเลือกได้ แต่ต้องเห็นก่อนว่ากำลังย้ายของที่เก็บไปแล้ว */}
        {p.zone ? (
          <ZoneTag zone={p.zone} />
        ) : (
          <span className="shrink-0 text-xs whitespace-nowrap text-muted-foreground">
            ยังไม่มีโซน
          </span>
        )}
      </label>
    </li>
  );
}
