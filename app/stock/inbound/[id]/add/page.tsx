"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { MinusIcon, PlusIcon } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@peckey954/ui/components/ui/breadcrumb";
import { Button } from "@peckey954/ui/components/ui/button";
import { Input } from "@peckey954/ui/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@peckey954/ui/components/ui/input-group";
import { Label } from "@peckey954/ui/components/ui/label";
import {
  RadioGroup,
  RadioGroupItem,
} from "@peckey954/ui/components/ui/radio-group";
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
import {
  MAX_FILE_MB,
  PhotoUpload,
  type Photo,
} from "@/components/photo-upload";
import { useNumberField } from "@/components/number-field";
import { getInboundReceipt, formatQty, ZONES } from "@/lib/general-stock";

/* ------------------------------------------------------------------
   เพิ่มการรับเข้าสต็อกทั่วไป — ปุ่ม "รับเข้า" บนการ์ด/ตารางแท็บรอรับเข้า
   พาเข้ามาหน้านี้ตรง ๆ เพราะงานจริงของคนหน้างานคือ "กรอกรับเข้า" ไม่ใช่
   มาอ่านประวัติก่อน หน้าใบรับเข้า (log ทุกรอบ) ยังอยู่ กดเข้าถึงได้จาก
   breadcrumb หรือปุ่ม "เพิ่มการรับเข้าสินค้า" ในหน้านั้น

   ไม่มี backend จริงตามธรรมชาติของแอปนี้ — บันทึกแล้วขึ้น toast แล้ว
   กลับไปหน้าที่เข้ามา เหมือนหน้าใบผลิต ไม่ใช่ push ไปหน้าตายตัว
------------------------------------------------------------------ */

const PACKING_POOL = [
  "Bulk",
  "25 Kg",
  "40 Kg",
  "50 Kg",
  "ถุง",
  "กล่อง",
  "ม้วน",
  "ขวด",
  "โหล",
];

export default function AddInboundRoundPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const receipt = React.useMemo(
    () => getInboundReceipt(params.id),
    [params.id]
  );
  const doc = receipt?.doc;

  const plateOptions = React.useMemo(
    () =>
      (doc?.truck ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    [doc?.truck]
  );
  const packingOptions = React.useMemo(
    () =>
      Array.from(
        new Set(
          [doc?.packing, ...PACKING_POOL].filter(
            (v): v is string => Boolean(v)
          )
        )
      ),
    [doc?.packing]
  );

  const [plateMode, setPlateMode] = React.useState<"system" | "manual">(
    plateOptions.length > 0 ? "system" : "manual"
  );
  const [plateSystem, setPlateSystem] = React.useState<string | undefined>(
    plateOptions[0]
  );
  const [plateManual, setPlateManual] = React.useState("");
  const [containerNo, setContainerNo] = React.useState("");
  const [tonQty, setTonQty] = React.useState(0);
  const [pieceQty, setPieceQty] = React.useState(0);
  const [packing, setPacking] = React.useState(doc?.packing ?? "");
  const [zone, setZone] = React.useState<string | undefined>();
  const [quality, setQuality] = React.useState<"ok" | "bad">("ok");
  const [note, setNote] = React.useState("");
  // ของที่ไม่ถูกต้องต้องมีหลักฐาน — รูปกับเหตุผล เก็บแยกจากหมายเหตุทั่วไป
  const [badNote, setBadNote] = React.useState("");
  const [photos, setPhotos] = React.useState<Photo[]>([]);
  const seqRef = React.useRef(0);

  /**
   * จำลองการอัปโหลด — ไม่มีหลังบ้านจริง
   * ไฟล์ใหญ่เกินตัดตั้งแต่ก่อนเริ่มอัป ไม่ต้องรอให้เซิร์ฟเวอร์ปฏิเสธ
   */
  const startUpload = React.useCallback((id: string) => {
    let pct = 0;
    const timer = setInterval(() => {
      pct += 20;
      setPhotos((prev) =>
        prev.map((p) =>
          p.id === id
            ? pct >= 100
              ? { ...p, status: "done", progress: 100 }
              : { ...p, progress: pct }
            : p
        )
      );
      if (pct >= 100) clearInterval(timer);
    }, 220);
  }, []);

  const addPhotos = (files: FileList) => {
    const next: Photo[] = [];
    for (const file of Array.from(files)) {
      seqRef.current += 1;
      const id = `ph-${seqRef.current}`;
      const tooLarge = file.size > MAX_FILE_MB * 1024 * 1024;
      next.push({
        id,
        name: file.name,
        url: tooLarge ? undefined : URL.createObjectURL(file),
        status: tooLarge ? "tooLarge" : "uploading",
        progress: 0,
      });
      if (!tooLarge) startUpload(id);
    }
    setPhotos((prev) => [...prev, ...next]);
  };

  const removePhoto = (id: string) =>
    setPhotos((prev) => {
      // คืนหน่วยความจำของ blob ที่สร้างไว้ ไม่งั้นค้างจนกว่าจะปิดแท็บ
      const gone = prev.find((p) => p.id === id);
      if (gone?.url) URL.revokeObjectURL(gone.url);
      return prev.filter((p) => p.id !== id);
    });

  const retryPhoto = (id: string) =>
    setPhotos((prev) => {
      const target = prev.find((p) => p.id === id);
      // ไฟล์ใหญ่เกินลองใหม่กี่ครั้งก็ใหญ่เท่าเดิม ต้องไปเลือกไฟล์อื่นมา
      if (!target || target.status === "tooLarge") return prev;
      startUpload(id);
      return prev.map((p) =>
        p.id === id ? { ...p, status: "uploading", progress: 0 } : p
      );
    });

  if (!receipt || !doc) {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 pt-6 pb-24 sm:px-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">ระบบ</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/stock">สต็อกทั่วไป</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-primary">
                เพิ่มการรับเข้า
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="mt-10 rounded-xl border border-dashed border-border px-6 py-14 text-center">
          <p className="font-medium">ไม่พบใบรับเข้านี้</p>
          <p className="mt-1 text-sm text-muted-foreground">
            เอกสารอาจถูกลบหรือลิงก์ไม่ถูกต้อง
          </p>
          <Button asChild variant="outline-primary" className="mt-4">
            <Link href="/stock">กลับไปหน้าสต็อกทั่วไป</Link>
          </Button>
        </div>
      </main>
    );
  }

  const { doc: safeDoc, meta, rounds } = receipt;

  // เลขรอบต่อท้ายรหัสใบ — รอบถัดไปจากที่มีอยู่แล้วในใบนี้
  const seq = String(rounds.length + 1).padStart(2, "0");

  // สรุปยอดที่เคยรับเข้าจริงของใบนี้ (นับเฉพาะรอบที่ตรวจ QC จบแล้ว)
  // ไม่นับรอบ "รอตรวจสอบ QC" ที่ยังไม่แตกยอดจริง กันนับซ้ำกับรอบย่อยของมัน
  const settledRounds = rounds.filter(
    (r) => r.status === "stocked" || r.status === "returned"
  );
  const priorTotal =
    settledRounds.length > 0
      ? settledRounds.reduce((sum, r) => sum + (r.receivedQty ?? 0), 0)
      : null;
  const priorAvg =
    priorTotal !== null ? priorTotal / settledRounds.length : null;

  function handleSave() {
    const plate = plateMode === "system" ? plateSystem : plateManual.trim();
    if (!plate) {
      toast.error("กรุณาระบุทะเบียนรถ");
      return;
    }
    if (tonQty <= 0) {
      toast.error("กรุณาระบุจำนวนรับเข้า");
      return;
    }
    // ของที่ตีกลับไปหาผู้ขายต้องบอกได้ว่าเพราะอะไร ไม่งั้นเคลมไม่ได้
    if (quality === "bad" && badNote.trim() === "") {
      toast.error("กรุณาระบุหมายเหตุสินค้าไม่ถูกต้อง");
      return;
    }
    if (photos.some((p) => p.status === "uploading")) {
      toast.error("รูปภาพยังอัปโหลดไม่เสร็จ");
      return;
    }
    toast.success(`บันทึกการรับเข้า ${safeDoc.code}-${seq} แล้ว`, {
      description: `${plate} — ${formatQty(tonQty)} ${safeDoc.orderUnit}${
        zone ? ` เข้าโซน ${zone}` : ""
      }`,
    });
    // ไม่มี backend จริง — กลับไปหน้าที่เข้ามา เหมือนแบบหน้าใบผลิต
    router.back();
  }

  return (
    <>
      <main className="mx-auto w-full max-w-6xl px-4 pt-6 pb-24 sm:px-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">ระบบ</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/stock">สต็อกทั่วไป</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href={`/stock/inbound/${doc.id}`}>
                ใบรับเข้าสต็อกทั่วไป
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-primary">
                เพิ่มการรับเข้า
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <h1 className="mt-4 text-2xl font-semibold tracking-tight">
          เพิ่มการรับเข้าสต็อกทั่วไป {doc.code}-{seq}
        </h1>

        {/* ---------- ข้อมูลใบสั่งซื้อ — อ้างอิงอย่างเดียว ไม่แก้ที่นี่ ---------- */}
        <div className="mt-5 rounded-xl border border-border bg-card px-4 py-4">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="font-medium">{doc.productName}</span>
              {doc.productSub && (
                <span className="text-sm text-muted-foreground">
                  {doc.productSub}
                </span>
              )}
              {doc.packing && (
                <>
                  <span className="hidden text-border @2xl:inline" aria-hidden>
                    |
                  </span>
                  <span className="text-sm">{doc.packing}</span>
                </>
              )}
            </span>
            <span className="text-sm font-medium">{doc.supplier}</span>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-4 rounded-lg bg-brand p-4">
            <SummaryStat
              label={`รับเข้า (${doc.orderUnit})`}
              value={priorTotal !== null ? formatQty(priorTotal) : "-"}
            />
            <SummaryStat
              label={`รับเข้าเฉลี่ย (${doc.orderUnit})`}
              value={priorAvg !== null ? formatQty(priorAvg) : "-"}
            />
          </div>
        </div>

        {/* ---------- ฟอร์มรับเข้า ---------- */}
        <div className="mt-6 grid gap-5 @2xl:grid-cols-2">
          <div className="space-y-3 @2xl:col-span-2">
            <Label>วิธีระบุทะเบียนรถ</Label>
            <RadioGroup
              value={plateMode}
              onValueChange={(v) => setPlateMode(v as "system" | "manual")}
              className="grid gap-3 @lg:grid-cols-2"
            >
              <RadioBox id="plate-mode-system" value="system">
                ทะเบียนรถในระบบ
              </RadioBox>
              <RadioBox id="plate-mode-manual" value="manual">
                ระบุทะเบียนรถเอง
              </RadioBox>
            </RadioGroup>
          </div>

          {plateMode === "system" ? (
            <div className="space-y-1.5 @2xl:col-span-2">
              <Label htmlFor="plate-system">ทะเบียนรถในระบบ</Label>
              <Select value={plateSystem} onValueChange={setPlateSystem}>
                <SelectTrigger id="plate-system" className="w-full bg-card">
                  <SelectValue placeholder="เลือกทะเบียนรถ" />
                </SelectTrigger>
                <SelectContent>
                  {plateOptions.length === 0 ? (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      ใบนี้ยังไม่มีทะเบียนรถในระบบ
                    </div>
                  ) : (
                    plateOptions.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-1.5 @2xl:col-span-2">
              <Label htmlFor="plate-manual">ทะเบียนรถ</Label>
              <Input
                id="plate-manual"
                className="bg-card"
                placeholder="ระบุทะเบียนรถ"
                value={plateManual}
                onChange={(e) => setPlateManual(e.target.value)}
              />
            </div>
          )}

          {meta.buyerNote && (
            <div className="rounded-lg bg-brand px-4 py-3 text-sm @2xl:col-span-2">
              <span className="text-muted-foreground">
                หมายเหตุจากผู้สั่งซื้อ:{" "}
              </span>
              <span className="font-medium">{meta.buyerNote}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="container-no">
              เบอร์ตู้คอนเทนเนอร์{" "}
              <span className="font-normal text-muted-foreground">
                (ไม่บังคับ)
              </span>
            </Label>
            <Input
              id="container-no"
              className="bg-card"
              placeholder="ระบุเบอร์ตู้"
              value={containerNo}
              onChange={(e) => setContainerNo(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ton-qty">รับเข้า ({doc.orderUnit})</Label>
            <QtyStepper id="ton-qty" value={tonQty} onValueChange={setTonQty} digits={2} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="piece-qty">
              จำนวนรับเข้า (บรรจุภัณฑ์){" "}
              <span className="font-normal text-muted-foreground">
                (ไม่บังคับ)
              </span>
            </Label>
            <QtyStepper id="piece-qty" value={pieceQty} onValueChange={setPieceQty} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="packing">บรรจุภัณฑ์</Label>
            <Select value={packing || undefined} onValueChange={setPacking}>
              <SelectTrigger id="packing" className="w-full bg-card">
                <SelectValue placeholder="เลือกบรรจุภัณฑ์" />
              </SelectTrigger>
              <SelectContent>
                {packingOptions.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="zone">โซนรับเข้า</Label>
            <Select value={zone} onValueChange={setZone}>
              <SelectTrigger id="zone" className="w-full bg-card">
                <SelectValue placeholder="เลือกโซน" />
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

          <div className="space-y-3 @2xl:col-span-2">
            <Label>ความถูกต้องของสินค้า</Label>
            <RadioGroup
              value={quality}
              onValueChange={(v) => setQuality(v as "ok" | "bad")}
              className="grid gap-3 @lg:grid-cols-2"
            >
              <RadioBox id="quality-ok" value="ok">
                ถูกต้อง
              </RadioBox>
              <RadioBox id="quality-bad" value="bad">
                ไม่ถูกต้อง
              </RadioBox>
            </RadioGroup>
          </div>

          {/* ---------- ของไม่ถูกต้อง ต้องมีหลักฐาน ----------
               โผล่เฉพาะตอนเลือกไม่ถูกต้อง ไม่จองที่ว่างไว้
               รูปกับเหตุผลคือสิ่งที่ฝ่ายจัดซื้อใช้เคลมกับผู้ขาย
               ถ้าไม่บังคับ ของจะถูกตีกลับโดยไม่มีใครรู้ว่าเพราะอะไร */}
          {quality === "bad" && (
            <>
              <div className="space-y-2 @2xl:col-span-2">
                <Label>เพิ่มรูปภาพสินค้าที่ไม่ถูกต้อง</Label>
                <PhotoUpload
                  photos={photos}
                  onAdd={addPhotos}
                  onRemove={removePhoto}
                  onRetry={retryPhoto}
                />
              </div>

              <div className="space-y-1.5 @2xl:col-span-2">
                <Label htmlFor="bad-note">หมายเหตุสินค้าไม่ถูกต้อง</Label>
                <Textarea
                  id="bad-note"
                  className="bg-card"
                  placeholder="ระบุหมายเหตุ"
                  rows={3}
                  value={badNote}
                  onChange={(e) => setBadNote(e.target.value)}
                />
              </div>
            </>
          )}

          <div className="space-y-1.5 @2xl:col-span-2">
            <Label htmlFor="note">
              หมายเหตุ{" "}
              <span className="font-normal text-muted-foreground">
                (ไม่บังคับ)
              </span>
            </Label>
            <Textarea
              id="note"
              className="bg-card"
              placeholder="ระบุหมายเหตุ"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </div>
      </main>

      {/* ---------- แถบปุ่มล่าง ---------- */}
      <div className="sticky bottom-0 z-30 border-t border-border bg-surface">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-8 py-3">
          <Button variant="outline-primary" onClick={() => router.back()}>
            ย้อนกลับ
          </Button>
          <Button onClick={handleSave}>บันทึก</Button>
        </div>
      </div>
    </>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums">{value}</p>
    </div>
  );
}

/** ตัวเลือกแบบกล่อง — ไฮไลต์กรอบ/พื้นตอนถูกเลือก อิง data-state ของ RadioGroupItem เอง */
function RadioBox({
  id,
  value,
  children,
}: {
  id: string;
  value: string;
  children: React.ReactNode;
}) {
  return (
    <Label
      htmlFor={id}
      className={cn(
        "flex cursor-pointer items-center gap-2.5 rounded-lg border border-border bg-card px-4 py-3 text-sm font-medium",
        "has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-brand"
      )}
    >
      <RadioGroupItem id={id} value={value} />
      {children}
    </Label>
  );
}

function QtyStepper({
  id,
  value,
  onValueChange,
  digits = 0,
}: {
  id: string;
  value: number;
  onValueChange: (next: number) => void;
  digits?: number;
}) {
  const field = useNumberField(value, onValueChange, digits);
  const step = (delta: number) =>
    onValueChange(Math.max(0, Number((value + delta).toFixed(digits))));

  return (
    <InputGroup className="bg-card">
      <InputGroupAddon align="inline-start">
        <InputGroupButton size="icon-xs" aria-label="ลดจำนวน" onClick={() => step(-1)}>
          <MinusIcon />
        </InputGroupButton>
      </InputGroupAddon>
      <InputGroupInput {...field} id={id} className="text-center" />
      <InputGroupAddon align="inline-end">
        <InputGroupButton size="icon-xs" aria-label="เพิ่มจำนวน" onClick={() => step(1)}>
          <PlusIcon />
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  );
}
