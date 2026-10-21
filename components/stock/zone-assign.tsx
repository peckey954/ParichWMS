"use client";

import * as React from "react";
import {
  CircleAlertIcon,
  CircleCheckIcon,
  KeyboardIcon,
  RotateCcwIcon,
  ScanBarcodeIcon,
  UploadIcon,
  XIcon,
} from "lucide-react";
import { Badge } from "@peckey954/ui/components/ui/badge";
import { Button } from "@peckey954/ui/components/ui/button";
import { Checkbox } from "@peckey954/ui/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
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
import { ZONES, formatQty, type InboundPiece } from "@/lib/general-stock";

/* ------------------------------------------------------------------
   เลือกโซนรับเข้า

   คนที่ทำงานนี้ไม่ใช่คนเดียวกับคนที่รับของหน้าโกดัง และมาทำทีหลัง
   มือถืออยู่ในมือ ของกองอยู่ตรงหน้า ลำดับที่ทำจริงคือ

     1  ยืนอยู่หน้าโซนไหน เลือกโซนนั้นไว้ก่อน
     2  ไล่สแกนเลขที่ติดบนของที่กำลังจะวางลงตรงนั้น หรือค้นหาเลขแล้วติ๊กจากรายการ
     3  กดบันทึกครั้งเดียวให้ทุกชิ้นที่เลือกไว้

   โซนจึงอยู่บนสุด ไม่ใช่ท้ายกล่อง และไม่ถามโซนซ้ำทุกชิ้น เพราะของที่ยกลงมา
   พร้อมกันแทบทั้งหมดไปโซนเดียวกัน

   ---------- สองหน้าจอ หนึ่งชุดตรรกะ ----------

   จอกว้างเปิดเป็นกล่อง (ZoneAssignDialog) จอแคบเป็นหน้าเต็มของตัวเอง
   (/stock/inbound/[id]/zone) เพราะกล่องบนมือถือเหลือความสูงให้รายการไม่ถึงครึ่งจอ
   ทั้งที่รายการคือของที่ต้องกวาดตาหามากที่สุดในงานนี้

   ทั้งสองทางใช้ useZoneAssign + ZoneAssignFields ตัวเดียวกัน ต่างกันแค่กรอบ
   ที่ห่ออยู่ข้างนอกกับที่วางแถบผลสแกน

   ---------- สแกนกับอัปโหลดรูปเป็นคนละปุ่ม ----------

   เดิมเป็นปุ่มเดียวที่ส่งต่อให้เครื่องเด้งเมนูเลือกเองว่าถ่ายหรือหยิบรูป คนใช้จริง
   ไม่รู้ว่ากดแล้วจะได้อะไร จึงแยกเป็นสองทางที่หน้าตาต่างกันชัด

     สแกนบาร์โค้ด   กรอบส่องกล้อง อ่านติดแล้วติ๊กให้ทันที สแกนต่อชิ้นถัดไปได้เลย
     อัปโหลดรูป     ป้ายที่ถ่ายเก็บไว้ตอนลงของ (ตอนนั้นมือไม่ว่าง) — บนมือถือ
                    หยิบจากรูปในเครื่อง บนคอมเลือกไฟล์หรือลากรูปมาวาง

   ทั้งสองทางลงเอยที่เดียวกัน: เจอชิ้นที่ตรงก็ติ๊กในรายการพร้อมบอก "เลือกสินค้าแล้ว"
   ไม่เจอก็บอกตรง ๆ ว่าไม่พบ แล้วให้ลองใหม่หรือกรอกเลขเองได้จากตรงนั้นเลย

   ---------- ยังเป็นของจำลอง ----------

   กล้องกับการถอดบาร์โค้ดยังไม่ได้ต่อของจริง เลขที่อ่านได้มาจากชิ้นในใบนี้เอง
   ส่วนผลไม่พบสลับได้จากชิป "ผลจำลอง" เพื่อดู flow ให้ครบทั้งสองทาง
   ของจริงต้องถอดในเครื่อง ไม่ใช่ส่งรูปขึ้นเซิร์ฟเวอร์ให้รอบนไวไฟโกดัง —
   เปลี่ยนแค่ที่มาของเลข จังหวะที่เห็นทั้งหมดคงเดิม
------------------------------------------------------------------ */

/** มาจากทางไหน — ปุ่มลองใหม่ต้องพากลับทางเดิม */
type Via = "scan" | "upload" | "manual";

/** ผลของการสแกน/อัปโหลด/พิมพ์เลขครั้งล่าสุด — piece มีเมื่อเจอชิ้นจริง */
type ScanResult = {
  ok: boolean;
  text: string;
  piece?: InboundPiece;
  /** เลขที่อ่านได้แต่ไม่ตรงกับชิ้นไหน — โชว์ให้เทียบกับป้ายจริง */
  code?: string;
  via: Via;
} | null;

/** ผลที่เดโมจะให้ออก — ยังไม่มีตัวถอดบาร์โค้ดจริง */
type Simulate = "found" | "notfound";

type Outcome = "found" | "already" | "notfound" | "empty";

/** รูปหนึ่งใบที่อัปโหลดเข้ามา */
type Upload = {
  id: string;
  name: string;
  url: string;
  status: "reading" | Outcome;
  code?: string;
  piece?: InboundPiece;
};

/** เวลาอ่านต่อหนึ่งรูป ถอดบาร์โค้ดจริงในเครื่องก็อยู่ราวนี้ */
const READ_MS = 900;
/** เวลาส่องกล้องจนจับติด */
const AIM_MS = 1800;

/**
 * ช่องเลขที่กับช่องไฟล์ — ปุ่มในกล่องสแกนและแถบผลต้องสั่งมันได้ หาด้วย id
 * แทนการส่ง ref ไปกับ state เพราะกล่องกับหน้าเต็มไม่เคยเปิดพร้อมกัน
 */
const CODE_INPUT_ID = "zone-code";
const UPLOAD_INPUT_ID = "zone-upload";

/** จอแคบ = ถือมือถืออยู่ อัปโหลดคือหยิบจากรูปในเครื่อง ไม่ใช่เลือกไฟล์จากคอม */
function useIsPhone() {
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

export function useZoneAssign(pieces: InboundPiece[]) {
  const [picked, setPicked] = React.useState<Set<string>>(new Set());
  const [zone, setZone] = React.useState<string>();
  const [query, setQuery] = React.useState("");
  const [result, setResult] = React.useState<ScanResult>(null);
  const [simulate, setSimulateState] = React.useState<Simulate>("found");
  const [scannerOpen, setScannerOpen] = React.useState(false);
  const [uploads, setUploads] = React.useState<Upload[]>([]);
  /** ชิ้นที่เพิ่งได้มา — กะพริบในรายการให้ตาตามทัน */
  const [flashId, setFlashId] = React.useState<string>();

  // อ่านค่าล่าสุดจากในตัวจับเวลาโดยไม่ต้องผูกมันไว้กับ state ทุกตัว
  const pickedRef = React.useRef(picked);
  const simulateRef = React.useRef(simulate);
  const uploadsRef = React.useRef(uploads);
  const timersRef = React.useRef<ReturnType<typeof setTimeout>[]>([]);
  const flashTimer = React.useRef<ReturnType<typeof setTimeout>>(undefined);

  React.useEffect(() => {
    pickedRef.current = picked;
    uploadsRef.current = uploads;
  }, [picked, uploads]);

  // เซ็ต ref ทันทีตอนสลับ — กล่องสแกนเริ่มรอบใหม่ใน effect ของมันเอง
  // ซึ่งวิ่งก่อน effect ของ hook นี้ ถ้ารอ effect มันจะอ่านค่าเก่า
  const setSimulate = (v: Simulate) => {
    simulateRef.current = v;
    setSimulateState(v);
  };

  // ออกจากหน้า/ปิดกล่องกลางคันแล้วตัวจับเวลาต้องตายตาม ไม่งั้นมันไปเซ็ต state
  // ของสิ่งที่ถอดไปแล้ว รูปที่สร้างลิงก์ไว้ก็ต้องคืนหน่วยความจำ
  React.useEffect(() => {
    return () => {
      for (const t of timersRef.current) clearTimeout(t);
      clearTimeout(flashTimer.current);
      for (const u of uploadsRef.current) URL.revokeObjectURL(u.url);
    };
  }, []);

  // คำค้นเทียบทั้งเลขเต็มและท่อนท้าย บางทีคนอ่านจากป้ายแล้วพิมพ์แค่ท้ายเลข
  const q = query.trim().toUpperCase();
  const visible = q
    ? pieces.filter((p) => p.receiptCode.toUpperCase().includes(q))
    : pieces;
  /** ชิ้นที่ยังไม่มีโซนในรายการที่เห็นอยู่ตอนนี้ — ปุ่มเลือกรวดเดียวทำแค่เท่าที่เห็น */
  const waiting = visible.filter((p) => !p.zone);
  const reading = uploads.some((u) => u.status === "reading");

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
   * ทบเข้ากับที่เลือกไว้เดิม ไม่ใช่เขียนทับ ไม่งั้นค้นหารอบใหม่แล้วกดชิป
   * ของที่ติ๊กไว้ก่อนหน้าหายไปทั้งชุดโดยไม่ได้ตั้งใจ
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

  const clearUploads = () => {
    for (const t of timersRef.current) clearTimeout(t);
    for (const u of uploadsRef.current) URL.revokeObjectURL(u.url);
    setUploads([]);
  };

  const clearAll = () => {
    setPicked(new Set());
    setResult(null);
    setQuery("");
    clearUploads();
  };

  /**
   * เลขที่ที่ "กล้อง" จะอ่านได้ในรอบนี้
   *
   * โหมดเจอ: หยิบชิ้นที่ยังไม่ได้เลือกและยังไม่มีโซนก่อน เพราะนั่นคืองานที่คน
   * เปิดหน้านี้มาทำ null คือไม่เหลือให้เลือกแล้ว
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
   * ได้เลขมาหนึ่งเลข — เทียบกับชิ้นในใบ ติ๊กให้ถ้าเจอ
   *
   * ล้างคำค้นทิ้งด้วย ไม่งั้นชิ้นที่เพิ่งเลือกอาจอยู่นอกคำค้นเดิมจนไม่เห็นในรายการ
   * แล้วดูเหมือนไม่มีอะไรเกิดขึ้น
   */
  const applyCode = (
    code: string | null,
    via: Via
  ): { outcome: Outcome; piece?: InboundPiece } => {
    if (code === null) {
      setResult({ ok: true, text: "เลือกครบทุกชิ้นในใบนี้แล้ว", via });
      return { outcome: "empty" };
    }
    const hit = pieces.find(
      (p) => p.receiptCode.toUpperCase() === code.trim().toUpperCase()
    );
    if (!hit) {
      setResult({
        ok: false,
        text: "ไม่พบสินค้าที่ตรงกับบาร์โค้ดนี้",
        code,
        via,
      });
      return { outcome: "notfound" };
    }

    setQuery("");
    clearTimeout(flashTimer.current);
    setFlashId(hit.id);
    flashTimer.current = setTimeout(() => setFlashId(undefined), 1600);

    if (pickedRef.current.has(hit.id)) {
      setResult({ ok: true, text: "สินค้านี้เลือกไว้แล้ว", piece: hit, via });
      return { outcome: "already", piece: hit };
    }
    // อัปเดต ref ทันที รูปถัดไปในชุดเดียวกันจะได้ไม่หยิบชิ้นเดิมซ้ำ
    pickedRef.current = new Set(pickedRef.current).add(hit.id);
    setPicked((prev) => new Set(prev).add(hit.id));
    setResult({ ok: true, text: "เลือกสินค้าแล้ว", piece: hit, via });
    return { outcome: "found", piece: hit };
  };

  /**
   * อ่านรูปทีละใบ ติ๊กไปทีละชิ้น ไม่ใช่รอครบแล้วค่อยติ๊กรวดเดียว
   *
   * เลือกมาห้ารูปแล้วเงียบไปสี่วินาทีครึ่ง คนจะนึกว่าค้าง เห็นแต่ละรูปเปลี่ยน
   * สถานะไล่ลงมาบอกได้ทั้งว่ายังทำงานอยู่และรูปไหนได้ชิ้นไหน
   */
  const readUpload = (ids: string[], index: number) => {
    if (index >= ids.length) return;
    timersRef.current = [
      setTimeout(() => {
        const code = mockRead();
        const { outcome, piece } = applyCode(code, "upload");
        setUploads((list) =>
          list.map((u) =>
            u.id === ids[index]
              ? { ...u, status: outcome, piece, code: code ?? undefined }
              : u
          )
        );
        readUpload(ids, index + 1);
      }, READ_MS),
    ];
  };

  /**
   * ได้รูปมาจากคลังรูปในโทรศัพท์หรือไฟล์ในคอม
   *
   * กรองเอาเฉพาะรูปก่อน หยิบ pdf มาแล้วปล่อยให้เดินจังหวะต่อคือหลอกว่าอ่านได้
   * ทั้งที่อ่านไม่ได้ อัปโหลดชุดใหม่ทับชุดเก่า รายการรูปจะได้ไม่ยาวสะสม
   */
  const uploadPhotos = (files: File[]) => {
    if (reading) return;
    const photos = files.filter((f) => f.type.startsWith("image/"));
    if (photos.length === 0) {
      setResult({
        ok: false,
        text: "ไฟล์นี้ไม่ใช่รูป อ่านบาร์โค้ดไม่ได้",
        via: "upload",
      });
      return;
    }
    clearUploads();
    setResult(null);
    const list: Upload[] = photos.map((f, i) => ({
      id: `${Date.now()}-${i}`,
      name: f.name,
      url: URL.createObjectURL(f),
      status: "reading",
    }));
    setUploads(list);
    readUpload(
      list.map((u) => u.id),
      0
    );
  };

  /**
   * เอ็นเทอร์ในช่องเลขที่
   *
   * เครื่องยิงบาร์โค้ดพิมพ์เลขให้เองแล้วเคาะเอ็นเทอร์ต่อท้าย ยิงแล้วต้องยกมือ
   * ไปติ๊กในรายการอีกทีคือเสียจังหวะเปล่า ๆ เลขตรงเป๊ะหรือคำค้นเหลือชิ้นเดียว
   * ก็ติ๊กให้ ไม่มีชิ้นไหนตรงเลยก็บอกว่าไม่พบ แต่ถ้ายังเหลือหลายชิ้นไม่เดาให้
   */
  const acceptOnlyMatch = () => {
    if (!q) return;
    const exact = pieces.find((p) => p.receiptCode.toUpperCase() === q);
    if (exact) return void applyCode(exact.receiptCode, "manual");
    if (visible.length === 1)
      return void applyCode(visible[0].receiptCode, "manual");
    if (visible.length === 0) applyCode(query.trim(), "manual");
  };

  const focusManual = () => {
    setScannerOpen(false);
    // รอกล่องสแกนปิดก่อน ไม่งั้นมันคืนโฟกัสไปที่ปุ่มสแกนทับ
    setTimeout(() => {
      const input = document.getElementById(CODE_INPUT_ID);
      if (input instanceof HTMLInputElement) {
        input.focus();
        input.select();
      }
    }, 50);
  };

  const pickUpload = () => document.getElementById(UPLOAD_INPUT_ID)?.click();

  return {
    pieces,
    picked,
    zone,
    setZone,
    query,
    setQuery,
    result,
    reading,
    uploads,
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
    clearUploads,
    mockRead,
    applyCode,
    uploadPhotos,
    pickUpload,
    focusManual,
    acceptOnlyMatch,
    canSubmit: Boolean(zone) && picked.size > 0,
  };
}

export type ZoneAssign = ReturnType<typeof useZoneAssign>;

/** ตัวหน้าจอทั้งชุด ตั้งแต่โซนลงไปถึงรายการ — ใช้ร่วมกันทั้งกล่องและหน้าเต็ม */
export function ZoneAssignFields({
  state,
  listClassName,
}: {
  state: ZoneAssign;
  /** ความสูงกรอบรายการ กล่องกับหน้าเต็มมีที่ว่างให้ไม่เท่ากัน */
  listClassName?: string;
}) {
  const { pieces, picked, visible, waiting } = state;

  return (
    <div className="space-y-4">
      {/* ---------- โซนปลายทาง ----------
           อยู่บนสุด เพราะลำดับที่คนทำจริงคือยืนอยู่หน้าโซนก่อน แล้วค่อยไล่สแกน
           ของที่จะวางลงตรงนั้น ไม่ใช่สแกนไปเรื่อยแล้วค่อยนึกตอนท้ายว่าจะลงตรงไหน */}
      <div className="space-y-2">
        <Label htmlFor="zone-target">โซน</Label>
        <Select value={state.zone} onValueChange={state.setZone}>
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
      <UploadList state={state} />

      {/* คั่นให้เห็นว่าข้างล่างคืออีกทางหนึ่งของงานเดียวกัน ไม่ใช่ขั้นถัดไป */}
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        หรือ
        <span className="h-px flex-1 bg-border" />
      </div>

      {/* ---------- ระบุเลขที่เอง ----------
           ป้ายเปื้อน ป้ายยับ หรือของวางชิดกำแพงจนส่องไม่ติด เป็นเรื่องที่เกิดทุกวัน
           ทางนี้จึงเปิดไว้ตลอด ไม่ใช่โผล่เฉพาะตอนสแกนไม่ติด
           พิมพ์แล้วรายการข้างล่างหดตามทันที ไม่มีปุ่มเพิ่มให้ต้องกดอีกที */}
      <div className="space-y-2">
        <Label htmlFor={CODE_INPUT_ID}>ระบุเลขที่รับสินค้า</Label>
        <Input
          id={CODE_INPUT_ID}
          autoComplete="off"
          className="bg-card"
          placeholder="ระบุเลขที่รับสินค้า แล้วกด Enter"
          value={state.query}
          onKeyDown={(e) => {
            if (e.key !== "Enter") return;
            e.preventDefault();
            state.acceptOnlyMatch();
          }}
          onChange={(e) => state.setQuery(e.target.value)}
        />
      </div>

      {/* ---------- เลือกรวดเดียว + ยอดที่เลือกไว้ ----------
           สองชิปนี้คือ "ลงโซนเดียวกันทั้งกอง" ในทางปฏิบัติ สแกนทีละชิ้นห้าสิบครั้ง
           คืองานเปล่า แยกเป็นสองชิปเพราะเป็นคนละเรื่องกัน — ทั้งหมดรวมของที่เก็บ
           เข้าที่ไปแล้วด้วย (คือย้ายโซนทั้งใบ) ส่วนอีกชิปแตะเฉพาะของที่ยังค้าง */}
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
            disabled={
              picked.size === 0 &&
              state.query === "" &&
              state.uploads.length === 0
            }
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
    </div>
  );
}

/* ------------------------------------------------------------------
   สองทางเข้า — สแกนกับอัปโหลด

   กรอบเส้นประเดียวตามดีไซน์ Parich แต่สองปุ่มแยกกัน ชื่อบอกตรง ๆ ว่ากดแล้วได้อะไร
   สแกนเปิดกล่องกล้อง อัปโหลดหยิบรูปที่ถ่ายเก็บไว้

   อัปโหลดบนมือถือคือหยิบจากคลังรูป บนคอมคือเลือกไฟล์หรือลากรูปมาวางในกรอบ
   ไม่ใส่ capture ในช่องไฟล์ — ทางถ่ายใหม่มีปุ่มสแกนแล้ว ปุ่มนี้มีไว้หยิบรูปเก่า

   ล้างค่าในช่องทุกครั้งหลังหยิบ ไม่งั้นเลือก "รูปเดิม" ซ้ำรอบสองจะไม่เกิด change
------------------------------------------------------------------ */

function CaptureTiles({ state }: { state: ZoneAssign }) {
  const isPhone = useIsPhone();
  const [dragging, setDragging] = React.useState(false);

  return (
    <div
      onDragOver={(e) => {
        if (isPhone || state.reading) return;
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        if (isPhone) return;
        e.preventDefault();
        setDragging(false);
        state.uploadPhotos([...e.dataTransfer.files]);
      }}
      className={cn(
        "flex flex-col items-center gap-3 rounded-xl border border-dashed border-primary bg-brand px-4 py-6 text-center transition-colors",
        dragging && "bg-brand-hover ring-[3px] ring-primary/30"
      )}
    >
      {state.reading ? (
        <Spinner className="size-7 text-primary" />
      ) : (
        <UploadIcon className="size-7 text-muted-foreground" />
      )}
      <div>
        <p className="font-medium">
          {state.reading ? "กำลังอ่านบาร์โค้ดจากรูป..." : "สแกน/อัปโหลดบาร์โค้ด"}
        </p>
        {!isPhone && !state.reading && (
          <p className="mt-0.5 text-xs text-muted-foreground">
            หรือลากรูปมาวางในกรอบนี้
          </p>
        )}
      </div>

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
          disabled={state.reading}
          onClick={state.pickUpload}
        >
          อัปโหลดรูปภาพ
        </Button>
      </div>

      <SimulateToggle state={state} />

      <input
        id={UPLOAD_INPUT_ID}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          const files = [...(e.target.files ?? [])];
          e.target.value = "";
          if (files.length > 0) state.uploadPhotos(files);
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

/**
 * รูปที่อัปโหลด — ทีละรูปเห็นว่าได้ชิ้นไหน หรือรูปไหนอ่านไม่เจอ
 * รูปที่ไม่พบต้องเห็นรูปตัวเองข้าง ๆ ไม่งั้นเลือกมาห้ารูปไม่รู้ว่ารูปไหนพัง
 */
function UploadList({ state }: { state: ZoneAssign }) {
  const isPhone = useIsPhone();
  if (state.uploads.length === 0) return null;
  const done = state.uploads.filter((u) => u.status !== "reading").length;

  return (
    <div className="rounded-lg border border-border">
      <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
        <p className="text-sm font-medium">
          รูปที่อัปโหลด{" "}
          <span className="font-normal text-muted-foreground tabular-nums">
            ({done}/{state.uploads.length})
          </span>
        </p>
        <Button
          variant="ghost"
          size="sm"
          disabled={state.reading}
          onClick={state.clearUploads}
        >
          <XIcon />
          ล้างรูป
        </Button>
      </div>
      <ul>
        {state.uploads.map((u) => (
          <li
            key={u.id}
            className="flex items-center gap-3 border-b border-border px-3 py-2.5 last:border-b-0"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- รูปจาก blob ในเครื่อง */}
            <img
              src={u.url}
              alt=""
              className="size-12 shrink-0 rounded-md border border-border object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs text-muted-foreground">{u.name}</p>
              <UploadStatus upload={u} />
            </div>
            {u.status === "notfound" && (
              <div className="flex shrink-0 flex-col gap-1 sm:flex-row">
                <Button
                  size="sm"
                  variant="outline-primary"
                  onClick={state.pickUpload}
                  disabled={state.reading}
                >
                  {isPhone ? "เลือกรูปใหม่" : "อัปโหลดใหม่"}
                </Button>
                <Button size="sm" variant="ghost" onClick={state.focusManual}>
                  กรอกเลขเอง
                </Button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function UploadStatus({ upload: u }: { upload: Upload }) {
  if (u.status === "reading")
    return (
      <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
        <Spinner className="size-3.5" />
        กำลังอ่านบาร์โค้ด...
      </p>
    );
  if (u.status === "notfound")
    return (
      <p className="mt-0.5 text-sm font-medium text-danger-strong">
        ไม่พบสินค้าที่ตรงกับบาร์โค้ดนี้
        <span className="block truncate text-xs font-normal text-muted-foreground">
          อ่านได้ {u.code}
        </span>
      </p>
    );
  if (u.status === "empty")
    return (
      <p className="mt-0.5 text-sm text-muted-foreground">
        เลือกครบทุกชิ้นในใบนี้แล้ว
      </p>
    );
  return (
    <p className="mt-0.5 text-sm">
      <span className="flex items-center gap-1 font-medium text-primary">
        <CircleCheckIcon className="size-3.5" />
        {u.status === "already" ? "เลือกไว้แล้ว" : "เลือกสินค้าแล้ว"}
      </span>
      <span className="block truncate text-xs text-muted-foreground">
        {u.piece?.receiptCode}
      </span>
    </p>
  );
}

/* ------------------------------------------------------------------
   กล่องสแกน — ภาพจำลองของกล้อง

   มือถือเปิดเต็มจอ เหมือนแอปกล้องที่คนคุ้น จอกว้างเป็นกล่องกลางจอ (กล้องเว็บแคม)
   จังหวะ: ส่องหา → จับติด → บอกผล

     เจอ      ติ๊กในรายการให้แล้ว บอก "เลือกสินค้าแล้ว" กดสแกนชิ้นถัดไปได้ทันที
              ไม่ปิดกล่องเอง เพราะงานจริงคือไล่สแกนทีละหลายชิ้น
     ไม่พบ    บอกเลขที่อ่านได้ให้เทียบกับป้าย แล้วให้สแกนใหม่หรือกรอกเลขเอง

   ป้ายในกรอบคือเลขที่ที่ "กล้อง" กำลังจะอ่าน วาดไว้ให้เห็นว่าส่องอะไรอยู่
------------------------------------------------------------------ */

type ScanPhase =
  | { kind: "aiming"; code: string | null }
  | { kind: Outcome; code: string | null; piece?: InboundPiece };

function ScannerDialog({ state }: { state: ZoneAssign }) {
  const isPhone = useIsPhone();
  const open = state.scannerOpen;
  const [phase, setPhase] = React.useState<ScanPhase>({
    kind: "aiming",
    code: null,
  });
  const [round, setRound] = React.useState(0);

  // เริ่มรอบส่องใหม่ทุกครั้งที่เปิด กดสแกนต่อ หรือสลับผลจำลองระหว่างส่อง
  const { mockRead, applyCode } = state;
  const readRef = React.useRef({ mockRead, applyCode });
  React.useEffect(() => {
    readRef.current = { mockRead, applyCode };
  });

  React.useEffect(() => {
    if (!open) return;
    const code = readRef.current.mockRead();
    setPhase({ kind: "aiming", code });
    const t = setTimeout(() => {
      const { outcome, piece } = readRef.current.applyCode(code, "scan");
      setPhase({ kind: outcome, code, piece });
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
            : "sm:max-w-md"
        )}
      >
        <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
          <div>
            <DialogTitle className="text-base">สแกนบาร์โค้ด</DialogTitle>
            <DialogDescription className="mt-0.5 text-xs">
              เล็งกรอบให้ตรงบาร์โค้ดบนป้ายสินค้า
            </DialogDescription>
          </div>
          <Button variant="ghost" size="icon" aria-label="ปิด" onClick={close}>
            <XIcon />
          </Button>
        </div>

        <Viewfinder
          phase={phase}
          className={isPhone ? "min-h-0 flex-1" : "aspect-[4/3]"}
        >
          {phase.kind === "aiming" && <SimulateToggle state={state} dark />}
        </Viewfinder>

        <div className="space-y-3 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <ScanPanel
            phase={phase}
            picked={state.picked.size}
            total={state.pieces.length}
          />

          {phase.kind === "aiming" ? (
            <Button
              variant="outline-primary"
              className="w-full"
              onClick={state.focusManual}
            >
              <KeyboardIcon />
              กรอกเลขเอง
            </Button>
          ) : phase.kind === "notfound" ? (
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline-primary" onClick={state.focusManual}>
                <KeyboardIcon />
                กรอกเลขเอง
              </Button>
              <Button onClick={again}>
                <RotateCcwIcon />
                สแกนใหม่
              </Button>
            </div>
          ) : phase.kind === "empty" ? (
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
                สแกนชิ้นถัดไป
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ScanPanel({
  phase,
  picked,
  total,
}: {
  phase: ScanPhase;
  picked: number;
  total: number;
}) {
  if (phase.kind === "aiming")
    return (
      <div className="flex min-h-14 items-center justify-center gap-2 text-sm text-muted-foreground">
        <Spinner className="size-4" />
        กำลังค้นหาบาร์โค้ด...
      </div>
    );

  if (phase.kind === "notfound")
    return (
      <div className="flex min-h-14 items-start gap-2 rounded-lg border border-danger-border bg-danger px-3 py-2.5">
        <CircleAlertIcon className="mt-0.5 size-4 shrink-0 text-danger-strong" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-danger-strong">
            ไม่พบสินค้าที่ตรงกับบาร์โค้ดนี้
          </p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            อ่านได้ {phase.code} — ตรวจป้ายแล้วสแกนใหม่ หรือกรอกเลขเอง
          </p>
        </div>
      </div>
    );

  if (phase.kind === "empty")
    return (
      <div className="flex min-h-14 items-center gap-2 rounded-lg border border-primary bg-brand px-3 py-2.5 text-sm font-medium text-primary">
        <CircleCheckIcon className="size-4 shrink-0" />
        เลือกครบทุกชิ้นในใบนี้แล้ว
      </div>
    );

  const p = phase.piece;
  return (
    <div className="flex min-h-14 items-start justify-between gap-2 rounded-lg border border-primary bg-brand px-3 py-2.5">
      <div className="flex min-w-0 items-start gap-2">
        <CircleCheckIcon className="mt-0.5 size-4 shrink-0 text-primary" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-primary">
            {phase.kind === "already" ? "สินค้านี้เลือกไว้แล้ว" : "เลือกสินค้าแล้ว"}
          </p>
          {p && (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {p.receiptCode} {p.packing} · {formatQty(p.qty)} ตัน
            </p>
          )}
        </div>
      </div>
      <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
        {picked}/{total}
      </span>
    </div>
  );
}

/** ภาพกล้องจำลอง — ป้ายสินค้าในกรอบส่อง เส้นเลเซอร์วิ่งระหว่างส่องหา */
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
  const bad = phase.kind === "notfound";
  const frame = aiming
    ? "border-white"
    : bad
      ? "border-danger-strong"
      : "border-success-strong";

  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center gap-4 overflow-hidden bg-neutral-900 px-4 py-6",
        className
      )}
    >
      {/* แสงเงาให้รู้สึกว่าเป็นภาพจากกล้อง ไม่ใช่กล่องดำเปล่า */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.12),transparent_70%)]" />

      <div className="relative w-full max-w-72">
        {/* ป้ายสินค้า */}
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

        {/* กรอบส่อง — มุมสี่มุม เปลี่ยนสีตามผล */}
        <div className="pointer-events-none absolute -inset-3">
          {[
            "top-0 left-0 border-t-4 border-l-4 rounded-tl-lg",
            "top-0 right-0 border-t-4 border-r-4 rounded-tr-lg",
            "bottom-0 left-0 border-b-4 border-l-4 rounded-bl-lg",
            "bottom-0 right-0 border-b-4 border-r-4 rounded-br-lg",
          ].map((c) => (
            <span
              key={c}
              className={cn("absolute size-7 transition-colors", frame, c)}
            />
          ))}
          {aiming && (
            <span className="absolute inset-x-2 h-0.5 animate-[scan-line_1.4s_ease-in-out_infinite_alternate] bg-red-500 shadow-[0_0_10px_2px_rgba(239,68,68,0.7)]" />
          )}
        </div>

        {!aiming && phase.kind !== "empty" && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              className={cn(
                "flex size-14 items-center justify-center rounded-full text-white shadow-lg",
                bad ? "bg-danger-strong" : "bg-success-strong"
              )}
            >
              {bad ? (
                <XIcon className="size-8" />
              ) : (
                <CircleCheckIcon className="size-8" />
              )}
            </span>
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
 * แถบผลล่าสุด — อยู่ติดปุ่มบันทึก ไม่ใช่ toast มุมจอ
 *
 * ของหน้าตาเหมือนกันห้าสิบชิ้นวางกองกัน ต้องเห็นว่าเพิ่งได้ "ชิ้นไหน" และมันมี
 * โซนอยู่ก่อนแล้วหรือเปล่า ก่อนกดบันทึก สแกนรัว ๆ หลายชิ้น toast จะซ้อนกัน
 * จนอ่านไม่ทัน แถบนี้ทับของเดิมเสมอจึงเหลือให้อ่านทีละอันเดียว
 *
 * ไม่พบสินค้า: มีปุ่มพากลับทางเดิม (สแกนใหม่/อัปโหลดใหม่) กับกรอกเลขเองติดมาด้วย
 */
export function ZoneScanResult({ state }: { state: ZoneAssign }) {
  const isPhone = useIsPhone();
  const { result } = state;
  if (!result) return null;
  const p = result.piece;
  const missing = !result.ok && result.code !== undefined;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-x-3 gap-y-2 rounded-lg border px-4 py-3",
        result.ok
          ? "border-primary bg-brand"
          : "border-danger-border bg-danger"
      )}
    >
      <div className="flex min-w-0 items-start gap-2">
        {result.ok ? (
          <CircleCheckIcon className="mt-0.5 size-4 shrink-0 text-primary" />
        ) : (
          <CircleAlertIcon className="mt-0.5 size-4 shrink-0 text-danger-strong" />
        )}
        <div className="min-w-0">
          <p
            className={cn(
              "text-sm font-medium",
              result.ok ? "text-primary" : "text-danger-strong"
            )}
          >
            {result.text}
          </p>
          {p && (
            <p className="mt-0.5 truncate text-sm text-muted-foreground">
              {p.receiptCode} {p.packing} · {formatQty(p.qty)} ตัน
            </p>
          )}
          {missing && (
            <p className="mt-0.5 truncate text-sm text-muted-foreground">
              {result.via === "manual" ? "เลขที่" : "บาร์โค้ด"} {result.code}
            </p>
          )}
        </div>
      </div>
      {p && <ZoneTag zone={p.zone} />}
      {missing && result.via !== "manual" && (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="ghost"
            className="text-primary hover:text-primary"
            onClick={state.focusManual}
          >
            กรอกเลขเอง
          </Button>
          <Button
            size="sm"
            variant="outline-primary"
            onClick={() =>
              result.via === "scan"
                ? state.setScannerOpen(true)
                : state.pickUpload()
            }
          >
            {result.via === "scan"
              ? "สแกนใหม่"
              : isPhone
                ? "เลือกรูปใหม่"
                : "อัปโหลดใหม่"}
          </Button>
        </div>
      )}
    </div>
  );
}

export function ZoneAssignDialog({
  open,
  onOpenChange,
  pieces,
  onAssign,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** ชิ้นที่ยังไม่ถูกยกเลิก — ทั้งที่มีโซนแล้วและยังไม่มี */
  pieces: InboundPiece[];
  onAssign: (ids: string[], zone: string) => void;
}) {
  const state = useZoneAssign(pieces);

  const submit = () => {
    if (!state.zone || state.picked.size === 0) return;
    onAssign([...state.picked], state.zone);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92dvh] flex-col gap-4 sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>เลือกโซนรับเข้า</DialogTitle>
          <DialogDescription>
            เลือกโซนแล้วสแกนเลขที่ติดบนสินค้าหรือเลือกจากรายการ
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <ZoneAssignFields state={state} />
        </div>

        {/* นอกกรอบที่เลื่อน — ผลสแกนต้องอยู่ในสายตาตลอด ไม่ใช่ต้องเลื่อนลงไปหา */}
        <ZoneScanResult state={state} />

        <DialogFooter className="grid grid-cols-2 gap-3">
          <Button variant="outline-primary" onClick={() => onOpenChange(false)}>
            ย้อนกลับ
          </Button>
          <Button disabled={!state.canSubmit} onClick={submit}>
            บันทึก
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
      <span className="shrink-0 text-xs whitespace-nowrap text-muted-foreground">
        ยังไม่มีโซน
      </span>
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
  /** เพิ่งได้มาจากสแกน/อัปโหลด — เลื่อนมาให้เห็นแล้วกะพริบกรอบ */
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
        {/* ชิ้นที่มีโซนแล้วยังเลือกได้ แต่ต้องเห็นก่อนว่ากำลังย้ายของที่เก็บไปแล้ว
            ไม่ใช่เพิ่งลงโซนครั้งแรก */}
        <ZoneTag zone={p.zone} />
      </label>
    </li>
  );
}
