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
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@peckey954/ui/components/ui/input-group";
import { Label } from "@peckey954/ui/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@peckey954/ui/components/ui/radio-group";
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
  FileUpload,
  useDocUpload,
  type DocFile,
} from "@/components/file-upload";
import { FileViewer, type ViewerFile } from "@/components/file-viewer";
import { useNumberField } from "@/components/number-field";
import { TimeField } from "@/components/time-field";
import { formatTon, getWeighingReceipt } from "@/lib/weighing";

/* ------------------------------------------------------------------
   เพิ่มการชั่งน้ำหนัก — หนึ่งหน้าต่อรถหนึ่งคัน เข้ามาจากปุ่ม
   "เพิ่มการชั่งน้ำหนัก" ในหน้าใบชั่งน้ำหนักของ PO นั้น

   รถเข้ามาชั่งพร้อมของ แล้วลงของเสร็จชั่งอีกทีตอนรถเปล่า
   น้ำหนักสินค้าจริง = ชั่งเข้า − ชั่งออก แล้วเอาไปเทียบกับใบชั่งของผู้ขาย
   ส่วนต่างคือสิ่งที่ฝ่ายจัดซื้อใช้คุยกับผู้ขาย จึงต้องเห็นตลอดเวลาที่กรอก

   กล่องสรุปด้านบนคำนวณสดจากช่องที่กรอกอยู่ ไม่ใช่ค่าที่บันทึกไว้
   กรอกผิดจะเห็นส่วนต่างเพี้ยนทันที ไม่ต้องรอกดบันทึกก่อนถึงจะรู้

   ไม่มี backend จริงตามธรรมชาติของแอปนี้ — บันทึกแล้วขึ้น toast แล้วกลับไปหน้า
   ที่เข้ามา เหมือนหน้าใบผลิต ไม่ใช่ push ไปหน้าตายตัว
------------------------------------------------------------------ */

/** ไฟล์ตัวอย่างที่ถือว่าอัปเสร็จแล้ว — ยังไม่มีหลังบ้าน ใช้โชว์ตัวอ่านเอกสาร */
function seedDocs(prefix: string, names: string[]): DocFile[] {
  return names.map((name, i) => ({
    id: `${prefix}-${i + 1}`,
    name,
    size: 6_900_000,
    status: "done",
    progress: 100,
  }));
}

/**
 * แปลงไฟล์ที่แนบเป็นข้อมูลของตัวอ่าน
 *
 * จำนวนหน้าคำนวณจากขนาดไฟล์ให้ได้ค่าเดิมทุกครั้ง ไม่ใช่สุ่ม
 * สุ่มตอนเรนเดอร์แล้วค่าฝั่งเซิร์ฟเวอร์กับเบราว์เซอร์ไม่ตรงกัน hydration พัง
 */
function toViewer(files: DocFile[], group: string): ViewerFile[] {
  return files
    .filter((f) => f.status === "done")
    .map((f) => {
      const image = /\.(png|jpe?g)$/i.test(f.name);
      return {
        id: f.id,
        name: f.name,
        group,
        kind: image ? ("image" as const) : ("pdf" as const),
        pages: image ? 1 : Math.max(1, Math.min(12, Math.round(f.size / 2_000_000))),
      };
    });
}

export default function AddWeighingRoundPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const receipt = React.useMemo(() => getWeighingReceipt(params.id), [params.id]);
  const doc = receipt?.doc;

  const plateOptions = React.useMemo(
    () =>
      (doc?.truck ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    [doc?.truck]
  );

  const [plateMode, setPlateMode] = React.useState<"system" | "manual">(
    plateOptions.length > 0 ? "system" : "manual"
  );
  const [plateSystem, setPlateSystem] = React.useState<string | undefined>(
    plateOptions[0]
  );
  const [plateManual, setPlateManual] = React.useState("");
  const [grossTon, setGrossTon] = React.useState(0);
  const [grossAt, setGrossAt] = React.useState("11:00");
  const [tareTon, setTareTon] = React.useState(0);
  const [tareAt, setTareAt] = React.useState("11:00");
  const [supplierTon, setSupplierTon] = React.useState(0);
  const [note, setNote] = React.useState("");

  // ไฟล์ตัวอย่างที่แนบไว้แล้ว จะได้กดดูตัวอ่านเอกสารได้ทันทีโดยไม่ต้องอัปก่อน
  const parichDocs = useDocUpload(seedDocs("wp", ["ใบชั่งเข้า-PO260116.pdf", "ใบชั่งออก-PO260116.pdf"]));
  const supplierDocs = useDocUpload(seedDocs("ws", ["ใบชั่งผู้ขาย-HC-8842.pdf", "ใบกำกับสินค้า-HC-8842.pdf", "รูปหน้าตาชั่ง.jpg"]));
  const idCardDocs = useDocUpload(seedDocs("wi", ["สำเนาบัตร-คนขับ.pdf"]));

  const [openFileId, setOpenFileId] = React.useState<string | null>(null);

  // รวมไฟล์ทั้งสามช่องเป็นชุดเดียวให้ตัวอ่าน แต่ยังคงที่มาไว้เพื่อจัดกลุ่มในราง
  const viewerFiles: ViewerFile[] = [
    ...toViewer(parichDocs.files, "เอกสารของพาริช"),
    ...toViewer(supplierDocs.files, "เอกสารของผู้ขาย"),
    ...toViewer(idCardDocs.files, "สำเนาบัตรประชาชนคนขับ"),
  ];

  // คำนวณสดจากช่องที่กรอกอยู่ กรอกผิดจะเห็นส่วนต่างเพี้ยนทันที
  const netTon = Math.max(0, grossTon - tareTon);
  const diffTon = netTon - supplierTon;

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
              <BreadcrumbLink href="/weighing">ชั่งน้ำหนัก</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-primary">
                เพิ่มการชั่งน้ำหนัก
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="mt-10 rounded-xl border border-dashed border-border px-6 py-14 text-center">
          <p className="font-medium">ไม่พบใบชั่งน้ำหนักนี้</p>
          <p className="mt-1 text-sm text-muted-foreground">
            เอกสารอาจถูกลบหรือลิงก์ไม่ถูกต้อง
          </p>
          <Button asChild variant="outline-primary" className="mt-4">
            <Link href="/weighing">กลับไปหน้าชั่งน้ำหนัก</Link>
          </Button>
        </div>
      </main>
    );
  }

  const { doc: safeDoc, meta, rounds } = receipt;
  // เลขรอบต่อท้ายรหัสใบ — รอบถัดไปจากที่มีอยู่แล้วในใบนี้
  const seq = String(rounds.length + 1).padStart(2, "0");

  function handleSave(draft: boolean) {
    const plate = plateMode === "system" ? plateSystem : plateManual.trim();
    if (!plate) {
      toast.error("กรุณาระบุทะเบียนรถ");
      return;
    }
    if (!draft && grossTon <= tareTon) {
      toast.error("น้ำหนักชั่งเข้าต้องมากกว่าชั่งออก");
      return;
    }
    if (
      !draft &&
      (parichDocs.uploading || supplierDocs.uploading || idCardDocs.uploading)
    ) {
      toast.error("เอกสารยังอัปโหลดไม่เสร็จ");
      return;
    }
    toast.success(draft ? "บันทึกฉบับร่างแล้ว" : `บันทึกการชั่ง ${safeDoc.code}-${seq} แล้ว`, {
      description: `${plate} — น้ำหนักสินค้าจริง ${formatTon(netTon)} ตัน`,
    });
    if (!draft) router.back();
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
              <BreadcrumbLink href="/weighing">ชั่งน้ำหนัก</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href={`/weighing/${doc.id}`}>
                ใบชั่งน้ำหนัก {doc.code}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-primary">
                เพิ่มการชั่งน้ำหนัก
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          เพิ่มการชั่งน้ำหนัก {doc.code}-{seq}
        </h1>

        {/* ---------- หัวใบ ----------
             ชื่อสินค้ากับผู้ขายอยู่คนละมุม เพราะเป็นสองคำถามคนละข้อ
             "ของอะไร" กับ "ของใคร" ไม่ต้องอ่านต่อกันเป็นประโยค */}
        <div className="mt-4 rounded-xl border border-border bg-card p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="font-semibold">
                {doc.productName}
                {doc.productSub && ` ${doc.productSub}`}
              </span>
              <span className="text-sm text-muted-foreground">{doc.category}</span>
              {doc.packing && (
                <>
                  <span className="text-border" aria-hidden>
                    |
                  </span>
                  <span className="text-sm text-muted-foreground">{doc.packing}</span>
                </>
              )}
            </p>
            <p className="text-sm">{doc.supplier}</p>
          </div>

          {/* พื้นส้มอ่อน — สามตัวเลขนี้คือคำตอบของทั้งหน้า อ่านรวดเดียวจบ
              ส่วนต่างเป็นสีแดงเมื่อได้ของน้อยกว่าที่ผู้ขายแจ้ง ซึ่งคือเงินที่หายไป */}
          <div className="mt-3 grid gap-4 rounded-lg bg-brand p-4 @2xl:grid-cols-3">
            <Stat label="น้ำหนักจริง (ตัน)" value={formatTon(netTon)} />
            <Stat label="น้ำหนักตามผู้ขาย (ตัน)" value={formatTon(supplierTon)} />
            <Stat
              label="ส่วนต่าง (ตัน)"
              value={`${diffTon > 0 ? "+" : ""}${formatTon(diffTon)}`}
              tone={diffTon < 0 ? "bad" : undefined}
            />
          </div>
        </div>

        {/* ---------- ทะเบียนรถ ---------- */}
        <div className="mt-6 grid gap-4 @2xl:grid-cols-2">
          <div className="space-y-3">
            <Label>วิธีระบุทะเบียนรถ</Label>
            <RadioGroup
              value={plateMode}
              onValueChange={(v) => setPlateMode(v as "system" | "manual")}
              className="grid gap-3 @lg:grid-cols-2"
            >
              <RadioBox id="plate-system" value="system">
                ทะเบียนรถในระบบ
              </RadioBox>
              <RadioBox id="plate-manual" value="manual">
                ระบุทะเบียนรถเอง
              </RadioBox>
            </RadioGroup>
          </div>

          <div className="space-y-3">
            <Label htmlFor="plate">
              {plateMode === "system" ? "ทะเบียนรถในระบบ" : "ทะเบียนรถ"}
            </Label>
            {plateMode === "system" ? (
              <Select value={plateSystem} onValueChange={setPlateSystem}>
                <SelectTrigger id="plate" className="w-full bg-card">
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
            ) : (
              <InputGroup className="bg-card">
                <InputGroupInput
                  id="plate"
                  placeholder="ระบุทะเบียนรถ"
                  value={plateManual}
                  onChange={(e) => setPlateManual(e.target.value)}
                />
              </InputGroup>
            )}
          </div>
        </div>

        {/* หมายเหตุจากคนสั่งซื้อ — อ่านอย่างเดียว แต่ต้องเห็นก่อนลงตัวเลข
            เพราะมันบอกเงื่อนไขที่ทำให้ตัวเลขผิดไปจากปกติได้ */}
        {meta.buyerNote && (
          <p className="mt-4 rounded-lg bg-brand px-4 py-3 text-sm">
            <span className="text-muted-foreground">หมายเหตุจากผู้สั่งซื้อ: </span>
            <span className="font-medium">{meta.buyerNote}</span>
          </p>
        )}

        {/* ---------- น้ำหนักชั่ง ----------
             เข้ากับออกอยู่แถวเดียวกัน เพราะสองค่านี้ต้องเทียบกันตลอด
             แยกคนละแถวแล้วต้องเลื่อนสายตาขึ้นลงเพื่อตรวจว่าเข้ามากกว่าออกจริง */}
        <div className="mt-6 grid gap-4 @2xl:grid-cols-4">
          <div className="space-y-1.5">
            <Label htmlFor="gross-ton">ชั่งเข้ารถพร้อมสินค้า (ตัน)</Label>
            <TonStepper id="gross-ton" value={grossTon} onValueChange={setGrossTon} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="gross-at">เวลาเข้า</Label>
            <TimeField id="gross-at" value={grossAt} onValueChange={setGrossAt} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tare-ton">ชั่งออกรถเปล่า (ตัน)</Label>
            <TonStepper id="tare-ton" value={tareTon} onValueChange={setTareTon} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tare-at">เวลาออก</Label>
            <TimeField id="tare-at" value={tareAt} onValueChange={setTareAt} />
          </div>

          <div className="space-y-1.5 @2xl:col-span-2">
            <Label htmlFor="supplier-ton">น้ำหนักสินค้าตามผู้ขาย (ตัน)</Label>
            <TonStepper
              id="supplier-ton"
              value={supplierTon}
              onValueChange={setSupplierTon}
            />
          </div>
        </div>

        <div className="mt-4 space-y-1.5">
          <Label htmlFor="note">
            หมายเหตุ{" "}
            <span className="font-normal text-muted-foreground">(ไม่บังคับ)</span>
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

        {/* ---------- เอกสารแนบ ----------
             แยกสามช่องตามที่มาของเอกสาร ไม่ใช่กองรวมช่องเดียว
             เวลาเคลมกับผู้ขายต้องหยิบเฉพาะใบของผู้ขายออกมา
             กองรวมกันแล้วต้องมาไล่เปิดทีละไฟล์ว่าอันไหนของใคร */}
        <div className="mt-8 space-y-6">
          <FileUpload
            title="เอกสารชั่งน้ำหนักของพาริช"
            dropLabel="อัปโหลด / ลากไฟล์ใบชั่งน้ำหนักของพาริช"
            files={parichDocs.files}
            onAdd={parichDocs.add}
            onRemove={parichDocs.remove}
            onRetry={parichDocs.retry}
            onOpen={setOpenFileId}
          />
          <FileUpload
            title="เอกสารชั่งน้ำหนักของผู้ขาย"
            dropLabel="อัปโหลด / ลากไฟล์ใบชั่งน้ำหนักของผู้ขาย"
            files={supplierDocs.files}
            onAdd={supplierDocs.add}
            onRemove={supplierDocs.remove}
            onRetry={supplierDocs.retry}
            onOpen={setOpenFileId}
          />
          <FileUpload
            title="เอกสารสำเนาบัตรประชาชนคนขับ"
            dropLabel="อัปโหลด / ลากไฟล์สำเนาบัตรประชาชนคนขับ"
            files={idCardDocs.files}
            onAdd={idCardDocs.add}
            onRemove={idCardDocs.remove}
            onRetry={idCardDocs.retry}
            onOpen={setOpenFileId}
          />
        </div>
        <FileViewer
          files={viewerFiles}
          openId={openFileId}
          onOpenChange={setOpenFileId}
        />
      </main>

      {/* ---------- แถบปุ่มล่าง ----------
           บันทึกร่างไม่ตรวจอะไร เพราะรถยังไม่ออกก็ยังไม่มีน้ำหนักชั่งออก
           คนต้องเก็บงานค้างไว้กลางทางได้ ส่วนบันทึกจริงถึงจะตรวจครบ */}
      <div className="sticky bottom-0 z-30 border-t border-border bg-surface">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Button variant="outline-primary" onClick={() => router.back()}>
            ย้อนกลับ
          </Button>
          <div className="flex items-center gap-3">
            <Button variant="outline-primary" onClick={() => handleSave(true)}>
              บันทึกร่าง
            </Button>
            <Button onClick={() => handleSave(false)}>บันทึก</Button>
          </div>
        </div>
      </div>
    </>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "bad";
}) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-1 text-lg font-semibold tabular-nums",
          tone === "bad" && "text-danger-strong"
        )}
      >
        {value}
      </p>
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

function TonStepper({
  id,
  value,
  onValueChange,
}: {
  id: string;
  value: number;
  onValueChange: (next: number) => void;
}) {
  const field = useNumberField(value, onValueChange, 2);
  const step = (delta: number) =>
    onValueChange(Math.max(0, Number((value + delta).toFixed(2))));

  return (
    <InputGroup className="bg-card">
      <InputGroupAddon align="inline-start">
        <InputGroupButton size="icon-xs" aria-label="ลดน้ำหนัก" onClick={() => step(-1)}>
          <MinusIcon />
        </InputGroupButton>
      </InputGroupAddon>
      <InputGroupInput {...field} id={id} className="text-center" />
      <InputGroupAddon align="inline-end">
        <InputGroupButton size="icon-xs" aria-label="เพิ่มน้ำหนัก" onClick={() => step(1)}>
          <PlusIcon />
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  );
}
