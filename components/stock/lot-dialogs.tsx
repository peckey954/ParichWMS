"use client";

import * as React from "react";
import { MinusIcon, PlusIcon } from "lucide-react";
import { Button } from "@peckey954/ui/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Textarea } from "@peckey954/ui/components/ui/textarea";
import { cn } from "@peckey954/ui/lib/utils";
import { toast } from "sonner";
import { useStockLog } from "./stock-log";
import {
  ZONES,
  countDiff,
  piecesToQty,
  formatAmount,
  formatQty,
  lotPieces,
  qtyAfterMove,
  type Lot,
} from "@/lib/general-stock";

/** ผู้ทำรายการ — ยังไม่มีระบบผู้ใช้ ใช้ชื่อเดียวกับข้อมูลตัวอย่างไปก่อน */
const ACTOR = "อลิสา พรสุขสิริ";

/* ------------------------------------------------------------------
   กล่องย้ายสต็อก และกล่องปรับปรุงสต็อก

   ชื่องานเป็นหัวกล่อง ไม่ใช่ชื่อสินค้า เพราะสองกล่องนี้เปิดจากปุ่มที่อยู่
   ติดกันในแถวเดียวกัน ถ้าหัวเป็นชื่อสินค้าจะเหมือนกันเป๊ะทั้งคู่
   กดพลาดแล้วไม่มีอะไรบอกว่าเปิดอันไหนอยู่
   และ DialogTitle คือชื่อที่โปรแกรมอ่านหน้าจอประกาศตอนเปิดกล่อง
   มันต้องบอกว่า "กำลังจะทำอะไร" ไม่ใช่ "ทำกับอะไร"
------------------------------------------------------------------ */

/** หัวกล่อง — ชื่องาน แล้วตามด้วยล็อตที่กำลังทำอยู่ */
function LotHeading({
  title,
  lot,
  productName,
}: {
  title: string;
  lot: Lot;
  productName: string;
}) {
  return (
    <DialogHeader className="gap-3 text-left">
      <DialogTitle className="text-lg">{title}</DialogTitle>

      <div>
        {/* ชิปโซนเป็นคอลัมน์ซ้ายคงที่ ไม่ใช่ flex-wrap
            ของเดิมพอชื่อสินค้ายาวเกินบรรทัด ชิปจะถูกดันไปลอยอยู่บรรทัดบนคนเดียว
            แบบนี้ชิปเกาะกับชื่อสินค้าเสมอ หัวกล่องสูงเท่าเดิมทุกสินค้า
            ชื่อยาวเกินตัดท้ายเป็น … ชื่อเต็มยังชี้ดูได้จาก title */}
        <div className="flex items-center gap-3">
          <span className="shrink-0 rounded-md bg-secondary px-2.5 py-0.5 text-sm font-semibold text-primary">
            {lot.zone}
          </span>
          <p className="min-w-0 flex-1 truncate font-medium" title={productName}>
            {productName}
          </p>
        </div>

        {/* บรรทัดล็อตอยู่นอกคอลัมน์ของชื่อสินค้า จึงเริ่มชิดขอบซ้ายเท่าชิปโซน
            ไม่ถูกดันเข้าไปตามความกว้างของชิป */}
        <p className="mt-1 text-sm text-muted-foreground">
          {lot.code} · รับ {lot.receivedAt} ({lot.ageDays} วัน)
        </p>
      </div>
    </DialogHeader>
  );
}

/** กล่องสรุปยอด พื้นส้มอ่อน จอแคบเรียงลงมา จอกว้างเรียงเป็นคอลัมน์ */
function SummaryBox({ children }: { children: React.ReactNode }) {
  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-4 rounded-lg bg-brand px-4 py-3 @md:grid-cols-3">
      {children}
    </dl>
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
    <div>
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className={cn("mt-1 font-semibold tabular-nums", className)}>
        {children}
      </dd>
    </div>
  );
}

/**
 * ช่องกรอกจำนวนแบบมีปุ่มลบ/บวก
 * กรอกเองก็ได้ ปุ่มไว้ปรับทีละหน่วยตอนใช้บนมือถือ
 * บังคับให้อยู่ในช่วง 0 ถึง max เสมอ กันกรอกเกินของที่มีจริง
 */
function NumberStepper({
  id,
  value,
  max,
  onChange,
}: {
  id: string;
  value: number;
  max: number;
  onChange: (v: number) => void;
}) {
  const clamp = (v: number) => Math.min(max, Math.max(0, v));
  return (
    <div className="flex items-center rounded-md border border-input bg-card shadow-xs">
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
        onChange={(e) => {
          const n = Number(e.target.value.replace(/[^\d]/g, ""));
          onChange(clamp(Number.isNaN(n) ? 0 : n));
        }}
        className="border-0 bg-transparent text-center font-semibold tabular-nums shadow-none focus-visible:ring-0 dark:bg-transparent"
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="เพิ่มขึ้น"
        disabled={value >= max}
        onClick={() => onChange(clamp(value + 1))}
      >
        <PlusIcon />
      </Button>
    </div>
  );
}

/** ปุ่มท้ายกล่อง กว้างเท่ากันทั้งคู่ */
function Actions({
  onSave,
  saveDisabled,
}: {
  onSave: () => void;
  saveDisabled?: boolean;
}) {
  return (
    <DialogFooter className="grid grid-cols-2 gap-3 sm:flex sm:justify-end">
      <DialogClose asChild>
        <Button variant="outline-primary" className="sm:w-32">
          ย้อนกลับ
        </Button>
      </DialogClose>
      <Button className="sm:w-32" disabled={saveDisabled} onClick={onSave}>
        บันทึก
      </Button>
    </DialogFooter>
  );
}

/** จำนวนชิ้นพร้อมน้ำหนักต่อชิ้น ใช้ซ้ำในทั้งสองกล่อง */
function PiecesValue({ lot }: { lot: Lot }) {
  return (
    <span className="flex flex-wrap items-baseline gap-x-3">
      <span>{formatQty(lotPieces(lot))} ชิ้น</span>
      {lot.kgPerPiece && (
        <span className="font-normal">{lot.kgPerPiece} Kg/ชิ้น</span>
      )}
    </span>
  );
}

/* ------------------------------ ย้ายสต็อก ------------------------------ */

export function MoveLotDialog({
  lot,
  productName,
  unit,
  children,
}: {
  lot: Lot;
  productName: string;
  unit: string;
  children: React.ReactNode;
}) {
  const { addLog } = useStockLog();
  const max = lotPieces(lot);
  const [open, setOpen] = React.useState(false);
  const [zone, setZone] = React.useState("");
  const [pieces, setPieces] = React.useState(0);
  const [note, setNote] = React.useState("");

  // key ทำให้ฟอร์มเริ่มใหม่ทุกครั้งที่เปิด ไม่ค้างค่าจากรอบก่อน
  const reset = () => {
    setZone("");
    setPieces(0);
    setNote("");
  };

  const save = () => {
    addLog({
      code: `MV${lot.code.replace(/\D/g, "").slice(0, 6)}/01`,
      lotNumber: lot.code,
      productName,
      askedCount: pieces,
      doneCount: pieces,
      doneQty: piecesToQty(lot, pieces),
      unit,
      zone: lot.zone,
      zoneTo: zone,
      note: note.trim() || undefined,
      requester: ACTOR,
      actor: ACTOR,
      status: "move",
    });
    toast.success("บันทึกการย้ายแล้ว", {
      description: `${lot.code} · ${formatQty(pieces)} ชิ้น จาก ${lot.zone} ไป ${zone}`,
    });
    setOpen(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (v) reset();
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="@container sm:max-w-lg">
        <LotHeading title="ย้ายสต็อก" lot={lot} productName={productName} />

        <SummaryBox>
          <SummaryItem label={`ปริมาณในคลัง (${unit})`}>
            {formatAmount(lot.qty)}
          </SummaryItem>
          <SummaryItem label="จำนวนในคลัง (ชิ้น)">
            <PiecesValue lot={lot} />
          </SummaryItem>
          <SummaryItem label={`คงเหลือในคลัง (${unit})`}>
            {formatAmount(qtyAfterMove(lot, pieces))}
          </SummaryItem>
        </SummaryBox>

        <div className="space-y-2">
          <Label htmlFor="move-zone">โซนที่ต้องการย้าย</Label>
          <Select value={zone} onValueChange={setZone}>
            <SelectTrigger id="move-zone" className="w-full">
              <SelectValue placeholder="เลือกโซนปลายทาง" />
            </SelectTrigger>
            <SelectContent>
              {ZONES.filter((z) => z !== lot.zone).map((z) => (
                <SelectItem key={z} value={z}>
                  {z}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="move-pieces">จำนวนที่ต้องการย้าย (ชิ้น)</Label>
          <NumberStepper
            id="move-pieces"
            value={pieces}
            max={max}
            onChange={setPieces}
          />
          <p className="text-sm text-muted-foreground">
            ย้ายได้มากสุด {formatQty(max)} ชิ้น
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="move-note">หมายเหตุการย้าย</Label>
          <Textarea
            id="move-note"
            placeholder="หมายเหตุ"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        {/* ต้องเลือกโซนและใส่จำนวนก่อน ไม่งั้นบันทึกไปก็ไม่มีความหมาย */}
        <Actions onSave={save} saveDisabled={!zone || pieces === 0} />
      </DialogContent>
    </Dialog>
  );
}

/* ---------------------------- ปรับปรุงสต็อก ---------------------------- */

export function AdjustLotDialog({
  lot,
  productName,
  unit,
  children,
}: {
  lot: Lot;
  productName: string;
  unit: string;
  children: React.ReactNode;
}) {
  const { addLog } = useStockLog();
  const max = lotPieces(lot) * 2;
  const [open, setOpen] = React.useState(false);
  const [counted, setCounted] = React.useState(0);
  const [touched, setTouched] = React.useState(false);
  const [note, setNote] = React.useState("");

  const diff = countDiff(lot, counted);

  const save = () => {
    addLog({
      code: `ADJ${lot.code.replace(/\D/g, "").slice(0, 6)}/01`,
      lotNumber: lot.code,
      productName,
      // ประวัติบันทึก "ส่วนต่าง" ไม่ใช่ยอดที่นับได้ เพราะสิ่งที่เปลี่ยนคือส่วนต่าง
      doneCount: counted - lotPieces(lot),
      doneQty: diff,
      unit,
      zone: lot.zone,
      note: note.trim() || undefined,
      requester: ACTOR,
      actor: ACTOR,
      status: "adjust",
    });
    toast.success("บันทึกการปรับปรุงแล้ว", {
      description: `${lot.code} · นับได้ ${formatQty(counted)} ชิ้น · ส่วนต่าง ${formatAmount(diff)} ${unit}`,
    });
    setOpen(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (v) {
          setCounted(0);
          setTouched(false);
          setNote("");
        }
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="@container sm:max-w-lg">
        <LotHeading title="ปรับปรุงสต็อก" lot={lot} productName={productName} />

        <SummaryBox>
          <SummaryItem label={`ปริมาณในคลัง (${unit})`}>
            {formatAmount(lot.qty)}
          </SummaryItem>
          <SummaryItem label="จำนวนในคลัง (ชิ้น)">
            <PiecesValue lot={lot} />
          </SummaryItem>
          {/* ยังไม่ได้นับก็ยังไม่มีส่วนต่าง แสดงขีดไว้ก่อน
              พอนับแล้วค่อยขึ้นสี ขาดเป็นแดง เกินเป็นเขียว */}
          <SummaryItem
            label={`ส่วนต่าง (${unit})`}
            className={cn(
              !touched && "text-muted-foreground",
              touched && diff < 0 && "text-danger-strong",
              touched && diff > 0 && "text-success-strong"
            )}
          >
            {touched ? formatAmount(diff) : "-"}
          </SummaryItem>
        </SummaryBox>

        <div className="space-y-2">
          <Label htmlFor="adjust-count">นับจำนวนจริง (ชิ้น)</Label>
          <NumberStepper
            id="adjust-count"
            value={counted}
            max={max}
            onChange={(v) => {
              setCounted(v);
              setTouched(true);
            }}
          />
          <p className="text-sm text-muted-foreground">
            ในระบบมี {formatQty(lotPieces(lot))} ชิ้น
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="adjust-note">หมายเหตุการปรับปรุง</Label>
          <Textarea
            id="adjust-note"
            placeholder="หมายเหตุ"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        {/* ยอดไม่ตรงต้องบอกเหตุผลเสมอ ไม่งั้นตรวจย้อนหลังไม่ได้ว่าหายไปไหน */}
        <Actions
          onSave={save}
          saveDisabled={!touched || (diff !== 0 && note.trim() === "")}
        />
      </DialogContent>
    </Dialog>
  );
}
