"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2Icon } from "lucide-react";
import { Button } from "@peckey954/ui/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@peckey954/ui/components/ui/dialog";
import { Label } from "@peckey954/ui/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@peckey954/ui/components/ui/select";
import { cn } from "@peckey954/ui/lib/utils";
import { toast } from "sonner";
import { Crumbs } from "@/components/receiving/parts";
import { RemoveLotDialog } from "@/components/stock/bulk-lot-action";
import { CaptureTile, ScannerDialog, useLotScanner } from "@/components/stock/lot-scan";
import { GOODS_ZONES } from "@/lib/goods-stock";

/* ------------------------------------------------------------------
   เลือกล็อครับเข้า ของสต็อกสินค้า — ตาม Figma Flow รับสินค้าภายนอกเข้าคลัง
   ใช้ร่วมกัน: รับเข้าภายนอก / รับเข้าผลิต / รับคืนภายนอก (สลิง) / รับคืนภายใน (Lot)

   กดปุ่มเลือกล็อคที่ใบแล้วเข้ามาที่กล้องเลย ทีละป้าย
   ลำดับบนหน้า: กล่องสแกน → ล็อค → Lot ที่สแกนแล้ว (ล่าสุดอยู่บน, ถังขยะยืนยันก่อนลบ)
   บันทึก = ทุกรายการได้ล็อคที่เลือก แล้วกลับไปที่ใบ

   ผลสแกน (ร่วมกับหน้าย้าย/ปรับปรุง ผ่าน lot-scan)
     ไม่พบ / ของสินค้าอื่น      การ์ดแดงบนกล้อง สแกนต่อได้
     มีล็อคอยู่แล้ว             ถามก่อน — เปลี่ยนล็อค หรือ ไม่เปลี่ยน
     รูปภาพผ่านบางส่วน          modal สรุป
------------------------------------------------------------------ */

export type ZoneScanItem = {
  id: string;
  /** เลขบนป้าย — สิ่งที่สแกนได้ */
  code: string;
  /** ล็อคปัจจุบัน ว่าง = ยังไม่มี */
  zone: string;
  /** บรรทัดรองในรายการ */
  line: string;
  /** false = ของใบอื่นคนละสินค้า สแกนเจอแต่ไม่รับ */
  own: boolean;
};

export function ZoneScanSheet({
  pool,
  back,
  crumbs,
  onSave,
  photoInputId,
}: {
  pool: ZoneScanItem[];
  back: string;
  /** breadcrumb ก่อน "เลือกล็อครับเข้า" */
  crumbs: { label: string; href?: string }[];
  onSave: (ids: string[], zone: string) => void;
  photoInputId: string;
}) {
  const router = useRouter();
  const [zone, setZone] = React.useState("");
  /** ล่าสุดอยู่บนสุดตามแบบ */
  const [picked, setPicked] = React.useState<string[]>([]);
  const [submitted, setSubmitted] = React.useState(false);
  const [pendingRemove, setPendingRemove] = React.useState<ZoneScanItem>();
  /** รายการที่มีล็อคอยู่แล้ว รอถามว่าจะเปลี่ยนไหม */
  const [held, setHeld] = React.useState<ZoneScanItem>();

  const add = (s: ZoneScanItem) => setPicked((prev) => (prev.includes(s.id) ? prev : [s.id, ...prev]));

  const scan = useLotScanner({
    lots: pool,
    picked,
    onAdd: add,
    reject: (s) => (s.own ? undefined : "กรุณาสแกน Lot ของสินค้าเดียวกัน"),
    rejectLabel: "สินค้าไม่ตรงกัน",
    hold: (s) => Boolean(s.zone),
    onHold: setHeld,
    holdLabel: "มีล็อคแล้ว",
    describe: (s) => s.code,
    inputId: photoInputId,
  });

  // มาจากปุ่มเลือกล็อคที่ใบ — เปิดกล้องทันที
  const { setScannerOpen } = scan;
  const autoOpened = React.useRef(false);
  React.useEffect(() => {
    if (autoOpened.current) return;
    autoOpened.current = true;
    setScannerOpen(true);
  }, [setScannerOpen]);

  const rows = picked.flatMap((id) => pool.filter((s) => s.id === id));
  const errors = {
    zone: submitted && !zone ? "กรุณาเลือกล็อค" : undefined,
    lots: submitted && rows.length === 0 ? "กรุณาสแกน Lot อย่างน้อย 1 รายการ" : undefined,
  };

  const save = () => {
    setSubmitted(true);
    if (!zone || rows.length === 0) return;
    onSave(picked, zone);
    toast.success("เลือกล็อครับเข้าสำเร็จ", { description: `${rows.length} รายการ` });
    router.push(back);
  };

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col">
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 pt-6 pb-6 sm:px-6">
        <Crumbs trail={[...crumbs, { label: "เลือกล็อครับเข้า" }]} />
        <h1 className="mt-4 text-2xl font-bold tracking-tight">เลือกล็อครับเข้า</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">เลือกล็อคแล้วสแกนเลขที่ติดบนสินค้า</p>

        <div className="mt-5 space-y-5">
          <CaptureTile scan={scan} prompt="สแกนเลขที่เพื่อเลือกล็อครับสินค้าเข้าคลัง" />

          <div className="space-y-2">
            <Label htmlFor="scan-zone">ล็อค</Label>
            <ZonePicker id="scan-zone" value={zone} onChange={setZone} invalid={Boolean(errors.zone)} />
            {errors.zone && <p className="text-sm text-danger-strong">{errors.zone}</p>}
          </div>

          {rows.length === 0 ? (
            <EmptyScan error={errors.lots} hint="กรุณาสแกน Lot" />
          ) : (
            <section className="space-y-3">
              <h2 className="font-semibold">Lot ({rows.length} รายการ)</h2>
              <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
                {rows.map((s) => (
                  <li
                    key={s.id}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 transition-colors",
                      scan.flashId === s.id && "bg-brand"
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{s.code}</p>
                      <p className="truncate text-sm text-muted-foreground">{s.line}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`เอา ${s.code} ออก`}
                      onClick={() => setPendingRemove(s)}
                    >
                      <Trash2Icon />
                    </Button>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <ScannerDialog scan={scan} />

        <RemoveLotDialog
          code={pendingRemove?.code}
          onClose={() => setPendingRemove(undefined)}
          onConfirm={() => pendingRemove && setPicked((prev) => prev.filter((x) => x !== pendingRemove.id))}
        />

        {/* มีล็อคอยู่แล้ว — เปลี่ยนได้ แต่ต้องตั้งใจ */}
        <Dialog open={Boolean(held)} onOpenChange={(o) => !o && setHeld(undefined)}>
          <DialogContent className="max-w-[calc(100vw-2rem)] gap-0 p-6 text-center sm:max-w-sm">
            <DialogTitle className="text-lg">พบ Lot มีการเลือกล็อคไว้ก่อนหน้าแล้ว</DialogTitle>
            <DialogDescription className="mt-2">
              {held?.code} อยู่ล็อค {held?.zone}
              <br />
              หากเปลี่ยนล็อค ข้อมูลที่เลือกล็อคไว้ก่อนหน้าจะถูกเปลี่ยน
            </DialogDescription>
            <div className="mt-6 grid gap-3">
              <Button
                onClick={() => {
                  if (held) add(held);
                  setHeld(undefined);
                }}
              >
                เปลี่ยนล็อค
              </Button>
              <Button variant="outline-primary" onClick={() => setHeld(undefined)}>
                ไม่เปลี่ยนล็อคที่เลือกแล้ว
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>

      <div className="sticky bottom-0 z-30 border-t border-border bg-surface">
        <div className="mx-auto w-full max-w-7xl px-4 py-3 sm:px-6">
          <div className="grid grid-cols-2 gap-3 sm:flex sm:justify-between">
            <Button variant="outline-primary" className="sm:w-auto sm:min-w-20" onClick={() => router.push(back)}>
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

export function ZonePicker({
  id,
  value,
  onChange,
  invalid,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  invalid?: boolean;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        id={id}
        aria-invalid={invalid || undefined}
        className={cn("w-full bg-card", invalid && "border-danger-strong")}
      >
        <SelectValue placeholder="เลือกล็อค" />
      </SelectTrigger>
      <SelectContent>
        {GOODS_ZONES.map((z) => (
          <SelectItem key={z} value={z}>
            {z}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/** กล่อง "ไม่มีข้อมูล" ใต้กล่องสแกน — ขอบแดงเมื่อกดบันทึกทั้งที่ยังไม่ได้สแกน */
export function EmptyScan({ error, hint }: { error?: string; hint: string }) {
  return (
    <div
      className={cn(
        "flex h-40 flex-col items-center justify-center gap-1 rounded-xl border bg-card text-center",
        error ? "border-danger-strong" : "border-border"
      )}
    >
      <p className="text-lg font-bold">ไม่มีข้อมูล</p>
      <p className={error ? "text-danger-strong" : "text-muted-foreground"}>{error ?? hint}</p>
    </div>
  );
}

export function ZoneScanNotFound({ crumbs, message }: { crumbs: { label: string; href?: string }[]; message: string }) {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 pt-6 pb-24 sm:px-6">
      <Crumbs trail={[...crumbs, { label: "เลือกล็อครับเข้า" }]} />
      <div className="mt-10 rounded-xl border border-dashed border-border px-6 py-14 text-center">
        <p className="font-medium">{message}</p>
        <Button asChild variant="outline-primary" className="mt-4">
          <Link href="/stock/goods">กลับไปหน้าสต็อกสินค้า</Link>
        </Button>
      </div>
    </main>
  );
}
