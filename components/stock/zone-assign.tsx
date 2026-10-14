"use client";

import * as React from "react";
import {
  CircleAlertIcon,
  CircleCheckIcon,
  RotateCcwIcon,
  ScanBarcodeIcon,
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

   ช่องเลขที่ไม่มีปุ่ม "เพิ่ม" — พิมพ์แล้วรายการข้างล่างหดเหลือชิ้นที่ใช่ ค่อยติ๊กเอา
   ของจะถูกเลือกได้ทางเดียวคือติ๊กในรายการ ไม่ว่าจะมาจากสแกนหรือพิมพ์เลข

   ---------- สองหน้าจอ หนึ่งชุดตรรกะ ----------

   จอกว้างเปิดเป็นกล่อง (ZoneAssignDialog) จอแคบเป็นหน้าเต็มของตัวเอง
   (/stock/inbound/[id]/zone) เพราะกล่องบนมือถือเหลือความสูงให้รายการไม่ถึงครึ่งจอ
   ทั้งที่รายการคือของที่ต้องกวาดตาหามากที่สุดในงานนี้

   ทั้งสองทางใช้ useZoneAssign + ZoneAssignFields ตัวเดียวกัน ต่างกันแค่กรอบ
   ที่ห่ออยู่ข้างนอกกับที่วางแถบผลสแกน

   ---------- ตอนนี้การสแกนเป็นตัวอย่าง ----------

   กดสแกนแล้วขึ้นภาพกล้องจำลองค้างไว้สองวินาที ส่องหาป้ายบนกระสอบ จับโค้ดติด
   แล้วค่อยตัดเข้ารายการตามเดิม ไม่ได้เปิดกล้องจริง — กล้องต้องขอสิทธิ์และต้อง
   รันบน https เดโมจะพังบนเครื่องที่เปิดดูผ่าน ip ในออฟฟิศ

   แต่จังหวะที่เห็นตรงกับของจริงทุกขั้น — ยกกล้องส่อง จับติด แล้วขึ้นข้อมูลของ
   เลขที่อ่านได้ให้ยืนยันด้วยตา ตอนต่อกล้องจริงเปลี่ยนแค่ที่มาของเลข
------------------------------------------------------------------ */

/** ผลของการสแกน/พิมพ์เลขครั้งล่าสุด — piece มีเมื่ออ่านเจอชิ้นจริง */
type ScanResult = {
  ok: boolean;
  text: string;
  piece?: InboundPiece;
} | null;

/**
 * ขั้นของกล้องที่เปิดอยู่
 * boot คือกำลังเปิดกล้อง aim คือยังส่องหา lock คือจับโค้ดติดแล้ว
 */
type ScanPhase = "boot" | "aim" | "lock";

/**
 * ช่วงเปิดกล้อง — กล้องมือถือจริงก็ดำอยู่แวบหนึ่งก่อนภาพจะมา ตัดช่วงนี้ทิ้งแล้ว
 * ภาพจะเด้งขึ้นมาทันทีที่กดจนดูเหมือนรูปที่เตรียมไว้ ไม่เหมือนกล้องที่เพิ่งเปิด
 */
const BOOT_MS = 500;
/** ช่วงส่องหา ของจริงกล้องก็ใช้เวลาประมาณนี้กว่าจะจับโค้ดติด */
const AIM_MS = 1200;
/** จับติดแล้วค้างไว้ให้ทันอ่านว่าได้เลขอะไร ก่อนตัดกลับไปที่รายการ */
const LOCK_MS = 700;

export function useZoneAssign(pieces: InboundPiece[]) {
  const [picked, setPicked] = React.useState<Set<string>>(new Set());
  const [zone, setZone] = React.useState<string>();
  const [query, setQuery] = React.useState("");
  const [result, setResult] = React.useState<ScanResult>(null);
  /** กล้องที่เปิดค้างอยู่ตอนนี้ — null คือยังไม่ได้กดสแกน */
  const [scan, setScan] = React.useState<{
    phase: ScanPhase;
    piece: InboundPiece;
  } | null>(null);

  // อ่านค่าล่าสุดจากในตัวจับเวลาโดยไม่ต้องผูกมันไว้กับ state ทุกตัว
  const pickedRef = React.useRef(picked);
  // สองจังหวะ (ส่องหา แล้วจับติด) จึงเก็บเป็นชุด ปิดกลางคันต้องตายทั้งคู่
  const timersRef = React.useRef<ReturnType<typeof setTimeout>[]>([]);

  React.useEffect(() => {
    pickedRef.current = picked;
  }, [picked]);

  // ออกจากหน้า/ปิดกล่องกลางคันแล้วตัวจับเวลาต้องตายตาม ไม่งั้นมันไปเซ็ต state
  // ของสิ่งที่ถอดไปแล้ว
  React.useEffect(() => {
    return () => {
      for (const t of timersRef.current) clearTimeout(t);
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

  const clearAll = () => {
    setPicked(new Set());
    setResult(null);
    setQuery("");
  };

  /**
   * เลือกชิ้นหนึ่ง พร้อมขึ้นแถบยืนยันว่าได้ชิ้นไหน
   *
   * ล้างคำค้นทิ้งด้วย ไม่งั้นชิ้นที่เพิ่งเลือกอาจอยู่นอกคำค้นเดิมจนไม่เห็นในรายการ
   * แล้วดูเหมือนกดไปแล้วไม่มีอะไรเกิดขึ้น
   */
  const take = (hit: InboundPiece, text: string) => {
    setPicked((prev) => new Set(prev).add(hit.id));
    setQuery("");
    setResult({ ok: true, text, piece: hit });
  };

  /**
   * จำลองการสแกน — เปิดกล้องค้างไว้สองวินาที แล้วค่อยหยิบชิ้นนั้นเข้ารายการ
   *
   * เอาชิ้นที่ยังไม่มีโซนขึ้นก่อนเสมอ เพราะนั่นคืองานที่คนเปิดหน้านี้มาทำ
   * ของที่มีโซนแล้วจะโผล่ก็ต่อเมื่อไม่เหลืออะไรให้ระบุแล้วจริง ๆ
   *
   * เลือกชิ้นตั้งแต่ตอนกด ไม่ใช่ตอนจบ เพราะภาพกล้องต้องส่องเห็นบาร์โค้ดของชิ้นนั้น
   * ระหว่างรออยู่แล้ว ถ้าไปเลือกตอนจบ เลขบนจอกับเลขที่ได้จะเป็นคนละตัว
   */
  const simulateScan = () => {
    if (scan) return;
    const done = pickedRef.current;
    const hit =
      pieces.find((p) => !done.has(p.id) && !p.zone) ??
      pieces.find((p) => !done.has(p.id));

    // ไม่เหลืออะไรให้สแกนก็ไม่ต้องเปิดกล้องให้รอเก้อสองวินาที
    if (!hit) {
      setResult({ ok: false, text: "เลือกครบทุกชิ้นในใบนี้แล้ว" });
      return;
    }

    setResult(null);
    setScan({ phase: "boot", piece: hit });

    timersRef.current = [
      setTimeout(() => setScan({ phase: "aim", piece: hit }), BOOT_MS),
      setTimeout(
        () => setScan({ phase: "lock", piece: hit }),
        BOOT_MS + AIM_MS
      ),
      setTimeout(() => {
        setScan(null);
        take(hit, "สแกนสำเร็จ");
      }, BOOT_MS + AIM_MS + LOCK_MS),
    ];
  };

  /**
   * เอ็นเทอร์ในช่องเลขที่ — ทำงานเมื่อคำค้นเหลือชิ้นเดียวเท่านั้น
   *
   * เครื่องยิงบาร์โค้ดพิมพ์เลขให้เองแล้วเคาะเอ็นเทอร์ต่อท้าย ยิงแล้วต้องยกมือ
   * ไปติ๊กในรายการอีกทีคือเสียจังหวะเปล่า ๆ แต่ถ้าคำค้นยังเหลือหลายชิ้น
   * ไม่เดาให้ ปล่อยให้เลือกเองจากรายการ
   */
  const acceptOnlyMatch = () => {
    if (visible.length !== 1) return;
    const hit = visible[0];
    if (picked.has(hit.id)) {
      setQuery("");
      setResult({ ok: false, text: "เลือกไว้อยู่แล้ว", piece: hit });
      return;
    }
    take(hit, "เลือกเลขที่รับสินค้าแล้ว");
  };

  return {
    pieces,
    picked,
    zone,
    setZone,
    query,
    setQuery,
    result,
    scan,
    visible,
    waiting,
    isAllPicked,
    toggle,
    toggleAll,
    clearAll,
    simulateScan,
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

      {/* ---------- กรอบสแกน ----------
           เส้นประบอกว่าตรงนี้คือที่ที่ของจริงต้องเอาเลขมาส่อง ไม่ใช่กล่องข้อมูล
           กดแล้วกรอบเดิมนี่แหละกลายเป็นภาพกล้อง ไม่ได้เปิดกล่องใหม่ซ้อนขึ้นมา
           สายตาจะได้อยู่ที่เดิมตลอดทั้งจังหวะ */}
      <div className="rounded-xl border border-dashed border-primary bg-brand px-4 py-6">
        {state.scan ? (
          <ScanCamera scan={state.scan} />
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 py-2 text-center">
            <ScanBarcodeIcon className="size-8 text-primary" />
            <p className="font-medium">สแกนเลขที่เพื่อเลือกโซนรับสินค้าเข้าคลัง</p>
            <Button variant="outline-primary" onClick={state.simulateScan}>
              สแกนเลขที่รับสินค้า
            </Button>
          </div>
        )}
      </div>

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
        <Label htmlFor="zone-code">ระบุเลขที่รับสินค้า</Label>
        <Input
          id="zone-code"
          autoComplete="off"
          className="bg-card"
          placeholder="ระบุเลขที่รับสินค้า"
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
                onToggle={() => state.toggle(p.id)}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------
   ภาพกล้องจำลอง

   ของเดิมกดสแกนแล้วขึ้นวงกลมหมุน ซึ่งบอกได้แค่ว่าระบบกำลังทำอะไรสักอย่าง
   แต่ไม่ได้บอกว่าคนหน้างานต้องทำอะไร ของจริงคือยกมือถือขึ้นส่องป้ายบนกระสอบ
   ภาพกล้องเล่าขั้นนั้นตรง ๆ — ส่องหา จับติด แล้วตัดเข้ารายการ คนที่ดูเดโม
   จะได้เห็นทั้งเส้นทางโดยไม่ต้องให้ใครอธิบายประกอบ

   บาร์โค้ดที่เห็นวาดจากเลขที่รับสินค้าของชิ้นนั้นเอง ความกว้างแท่งคิดจากตัวอักษร
   ในเลข เลขเดิมจึงได้ลายเดิมทุกครั้ง ไม่ได้สุ่ม — ไม่งั้นภาพจะเต้นทุกรอบที่
   รีเรนเดอร์ และเดโมซ้ำสองรอบจะได้คนละลายทั้งที่เป็นของชิ้นเดียวกัน
------------------------------------------------------------------ */

/** ความกว้างแท่งบาร์โค้ด สลับแท่งทึบกับช่องว่าง ตำแหน่งคู่คือแท่งทึบ */
function barWidths(code: string) {
  const out: number[] = [];
  for (const ch of code.replace(/[^0-9a-z]/gi, "")) {
    const c = ch.charCodeAt(0);
    out.push(1 + (c % 3), 1 + ((c >> 2) % 2), 2 + ((c >> 3) % 3), 1);
  }
  return out;
}

/** มุมกรอบเล็งสี่มุม — คลาสตำแหน่งกับด้านที่ตีเส้นของแต่ละมุม */
const AIM_CORNERS = [
  "top-3 left-3 rounded-tl-md border-t-2 border-l-2",
  "top-3 right-3 rounded-tr-md border-t-2 border-r-2",
  "bottom-3 left-3 rounded-bl-md border-b-2 border-l-2",
  "bottom-3 right-3 rounded-br-md border-r-2 border-b-2",
];

function ScanCamera({
  scan,
}: {
  scan: { phase: ScanPhase; piece: InboundPiece };
}) {
  const booting = scan.phase === "boot";
  const locked = scan.phase === "lock";
  const code = scan.piece.receiptCode;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative aspect-[4/3] w-full max-w-72 overflow-hidden rounded-xl bg-neutral-900">
        {/* ป้ายบนกระสอบ เอียงนิดหน่อยเพราะถ่ายจากมือ ไม่ใช่วางบนแท่นสแกน
            พอจับติดแล้วค่อยหมุนเข้าที่และขยับเข้ามา เหมือนกล้องโฟกัสได้
            ช่วงเปิดกล้องยังไม่มีภาพ จอจึงดำอยู่กับตัวโหลดอย่างเดียว */}
        <div
          className={cn(
            "absolute inset-0 flex items-center justify-center transition-opacity duration-300",
            booting && "opacity-0"
          )}
        >
          <div
            className={cn(
              "w-4/5 rounded-sm bg-white px-3 py-3 shadow-lg",
              "transition-transform duration-500",
              locked ? "scale-105" : "-rotate-2"
            )}
          >
            <div className="flex h-12 items-stretch justify-center gap-px">
              {barWidths(code).map((w, i) => (
                <span
                  key={i}
                  style={{ width: w * 2 }}
                  className={i % 2 === 0 ? "bg-neutral-900" : ""}
                />
              ))}
            </div>
            <p className="mt-1.5 text-center font-mono text-[11px] tracking-wider text-neutral-900">
              {code}
            </p>
          </div>
        </div>

        {/* ตัวโหลดของดีไซน์ซิสเต็ม ไม่วาดตัวหมุนเองให้หลุดจากของที่ใช้ทั้งระบบ */}
        {booting && (
          <span className="absolute inset-0 flex items-center justify-center">
            <Spinner className="size-8 text-primary" />
          </span>
        )}

        {/* เส้นกวาดมีเฉพาะช่วงส่องหา — ยังไม่เปิดกล้องก็ยังไม่มีอะไรให้กวาด
            และถ้าจับติดแล้วยังวิ่งอยู่จะดูเหมือนยังหาไม่เจอ */}
        {scan.phase === "aim" && (
          <span className="animate-scan-sweep absolute inset-x-6 top-0 h-0.5 bg-primary shadow-[0_0_14px_3px] shadow-primary/60" />
        )}

        {AIM_CORNERS.map((pos) => (
          <span
            key={pos}
            className={cn(
              "absolute size-7 transition-colors",
              pos,
              locked
                ? "border-primary"
                : booting
                  ? "border-white/25"
                  : "border-white/60"
            )}
          />
        ))}

        {/* แฟลชวาบเดียวตอนจับติด บอกว่า "ถ่ายแล้ว" โดยไม่ต้องมีตัวหนังสือ */}
        {locked && (
          <span className="animate-cam-flash pointer-events-none absolute inset-0 bg-white" />
        )}

        <p className="absolute inset-x-0 bottom-2 text-center text-[11px] text-white/60">
          ภาพกล้องจำลอง ไม่ได้เปิดกล้องจริง
        </p>
      </div>

      {/* บรรทัดสถานะอยู่นอกจอกล้อง จะได้อ่านได้ทั้งตอนมืดและตอนแฟลชขาววาบ */}
      <p
        className={cn(
          "flex items-center gap-1.5 text-sm font-medium",
          locked ? "text-primary" : "text-muted-foreground"
        )}
      >
        {locked ? (
          <>
            <CircleCheckIcon className="size-4" />
            จับโค้ดได้ {code}
          </>
        ) : booting ? (
          <>
            <Spinner className="size-4" />
            กำลังเปิดกล้อง...
          </>
        ) : (
          <>
            <ScanBarcodeIcon className="size-4" />
            ส่องกล้องไปที่ป้ายบนสินค้า...
          </>
        )}
      </p>
    </div>
  );
}

/**
 * แถบผลสแกน — อยู่ติดปุ่มบันทึก ไม่ใช่ toast มุมจอ
 *
 * ของหน้าตาเหมือนกันห้าสิบชิ้นวางกองกัน ต้องเห็นว่าเพิ่งได้ "ชิ้นไหน" และมันมี
 * โซนอยู่ก่อนแล้วหรือเปล่า ก่อนกดบันทึก สแกนรัว ๆ หลายชิ้น toast จะซ้อนกัน
 * จนอ่านไม่ทัน แถบนี้ทับของเดิมเสมอจึงเหลือให้อ่านทีละอันเดียว
 */
export function ZoneScanResult({ state }: { state: ZoneAssign }) {
  const { result } = state;
  if (!result) return null;
  const p = result.piece;

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
        </div>
      </div>
      {p && <ZoneTag zone={p.zone} />}
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
  onToggle,
}: {
  piece: InboundPiece;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <li className="border-b border-border last:border-b-0">
      <label
        className={cn(
          "flex cursor-pointer items-center gap-3 px-3 py-2.5 transition-colors",
          checked ? "bg-brand" : "hover:bg-accent"
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
