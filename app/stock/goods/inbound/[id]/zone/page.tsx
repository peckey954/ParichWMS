"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
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
import {
  GOODS_INBOUND_DOCS,
  formatInboundQty,
  getGoodsInboundReceipt,
  isCountUnit,
  isGoodsInboundOpen,
  liveSlips,
  setSlipZones,
  type GoodsInboundReceipt,
  type GoodsSlip,
} from "@/lib/goods-inbound";

/* ------------------------------------------------------------------
   เลือกล็อครับเข้า ของสต็อกสินค้า — ตาม Figma Flow รับสินค้าภายนอกเข้าคลัง

   กด "สแกนเลือกล็อค" ที่ใบรับเข้าแล้วเข้ามาที่กล้องเลย ทีละป้ายสลิง
   ลำดับบนหน้า: กล่องสแกน → ล็อค → Lot ที่สแกนแล้ว (ล่าสุดอยู่บน, ถังขยะยืนยันก่อนลบ)
   บันทึก = สลิงทุกใบในรายการได้ล็อคที่เลือก แล้วกลับไปใบรับเข้า

   ผลสแกน (ร่วมกับหน้าย้าย/ปรับปรุง ผ่าน lot-scan)
     ไม่พบ / สลิงของสินค้าอื่น   การ์ดแดงบนกล้อง สแกนต่อได้
     สลิงที่เลือกล็อคไว้แล้ว     ถามก่อน — เปลี่ยนล็อค หรือ ไม่เปลี่ยน
     รูปภาพผ่านบางส่วน           modal สรุป
------------------------------------------------------------------ */

const PHOTO_INPUT_ID = "goods-zone-photo";

type ScanSlip = { id: string; code: string; zone: string; slip: GoodsSlip; own: boolean };

export default function GoodsZoneAssignPage() {
  const { id } = useParams<{ id: string }>();
  const receipt = React.useMemo(() => getGoodsInboundReceipt(id), [id]);
  if (!receipt || !isGoodsInboundOpen(receipt.doc)) return <NotFound />;
  return <ZoneSheet key={receipt.doc.id} receipt={receipt} />;
}

function ZoneSheet({ receipt }: { receipt: GoodsInboundReceipt }) {
  const router = useRouter();
  const { doc } = receipt;
  const back = `/stock/goods/inbound/${doc.id}`;

  // สแกนเจอได้ทั้งสลิงของใบนี้ และสลิงของใบอื่นที่เป็นคนละสินค้า (นับเป็นสินค้าไม่ตรงกัน ไม่ใช่ไม่พบ)
  const pool = React.useMemo<ScanSlip[]>(() => {
    const toScan = (s: GoodsSlip, own: boolean) => ({ id: s.id, code: s.receiptCode, zone: s.zone ?? "", slip: s, own });
    const other = GOODS_INBOUND_DOCS.find((d) => d.productName !== doc.productName);
    const foreign = other ? liveSlips(getGoodsInboundReceipt(other.id)?.slips ?? []) : [];
    return [...liveSlips(receipt.slips).map((s) => toScan(s, true)), ...foreign.map((s) => toScan(s, false))];
  }, [receipt, doc.productName]);

  const [zone, setZone] = React.useState("");
  /** ล่าสุดอยู่บนสุดตามแบบ */
  const [picked, setPicked] = React.useState<string[]>([]);
  const [submitted, setSubmitted] = React.useState(false);
  const [pendingRemove, setPendingRemove] = React.useState<ScanSlip>();
  /** สลิงที่มีล็อคอยู่แล้ว รอถามว่าจะเปลี่ยนไหม */
  const [held, setHeld] = React.useState<ScanSlip>();

  const describe = (s: GoodsSlip) => {
    const base = `${s.packing} · ${formatInboundQty(s.qty, doc.unit)} ${doc.unit}`;
    return isCountUnit(doc.unit) ? base : `${base} · ${s.count.toLocaleString("en-US")} ชิ้น`;
  };

  const add = (s: ScanSlip) => setPicked((prev) => (prev.includes(s.id) ? prev : [s.id, ...prev]));

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
    inputId: PHOTO_INPUT_ID,
  });

  // กดสแกนเลือกล็อคมาจากใบรับเข้า — เปิดกล้องทันที
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
    setSlipZones(picked, zone);
    toast.success("เลือกล็อครับเข้าสำเร็จ", { description: `${rows.length} รายการ` });
    router.push(back);
  };

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col">
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 pt-6 pb-6 sm:px-6">
        <Crumbs
          trail={[
            { label: "สต็อกสินค้า", href: "/stock/goods" },
            { label: "ใบรับเข้าสินค้า", href: back },
            { label: "เลือกล็อครับเข้า" },
          ]}
        />
        <h1 className="mt-4 text-2xl font-bold tracking-tight">เลือกล็อครับเข้า</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">เลือกล็อคแล้วสแกนเลขที่ติดบนสินค้า</p>

        <div className="mt-5 space-y-5">
          <CaptureTile scan={scan} prompt="สแกนเลขที่เพื่อเลือกล็อครับสินค้าเข้าคลัง" />

          <div className="space-y-2">
            <Label htmlFor="goods-zone">ล็อค</Label>
            <Select value={zone} onValueChange={setZone}>
              <SelectTrigger
                id="goods-zone"
                aria-invalid={Boolean(errors.zone)}
                className={cn("w-full bg-card", errors.zone && "border-danger-strong")}
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
            {errors.zone && <p className="text-sm text-danger-strong">{errors.zone}</p>}
          </div>

          {rows.length === 0 ? (
            <div
              className={cn(
                "flex h-40 flex-col items-center justify-center gap-1 rounded-xl border bg-card text-center",
                errors.lots ? "border-danger-strong" : "border-border"
              )}
            >
              <p className="text-lg font-bold">ไม่มีข้อมูล</p>
              <p className={errors.lots ? "text-danger-strong" : "text-muted-foreground"}>
                {errors.lots ?? "กรุณาสแกน Lot"}
              </p>
            </div>
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
                      <p className="truncate text-sm text-muted-foreground">{describe(s.slip)}</p>
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

        {/* สลิงที่เลือกล็อคไว้แล้ว — เปลี่ยนได้ แต่ต้องตั้งใจ */}
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

function NotFound() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 pt-6 pb-24 sm:px-6">
      <Crumbs trail={[{ label: "สต็อกสินค้า", href: "/stock/goods" }, { label: "เลือกล็อครับเข้า" }]} />
      <div className="mt-10 rounded-xl border border-dashed border-border px-6 py-14 text-center">
        <p className="font-medium">ไม่พบใบรับเข้านี้ หรือรับเข้าครบแล้ว</p>
        <Button asChild variant="outline-primary" className="mt-4">
          <Link href="/stock/goods">กลับไปหน้าสต็อกสินค้า</Link>
        </Button>
      </div>
    </main>
  );
}
