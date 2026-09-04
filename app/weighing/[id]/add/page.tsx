"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { MinusIcon, PlusIcon } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbEllipsis,
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
import { TimeField, toHHMM } from "@/components/time-field";
import { formatTon, getWeighingReceipt, siblingWeighingDocs } from "@/lib/weighing";

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
  return (
    <React.Suspense fallback={null}>
      <AddWeighingRoundForm />
    </React.Suspense>
  );
}

function AddWeighingRoundForm() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const receipt = React.useMemo(() => getWeighingReceipt(params.id), [params.id]);
  const doc = receipt?.doc;

  // สินค้าอื่นในใบสั่งซื้อเดียวกัน — ใช้ทำดรอปดาวน์ "สินค้า" ด้านบนกับปุ่ม
  // "บันทึกแล้วเพิ่มรายการถัดไป" รวมตัวเองไว้ในผลลัพธ์แล้ว (ดู siblingWeighingDocs)
  const siblings = React.useMemo(
    () => (doc ? siblingWeighingDocs(doc.poCode) : []),
    [doc]
  );

  const plateOptions = React.useMemo(
    () =>
      (doc?.truck ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    [doc?.truck]
  );

  // มาจากการกด "บันทึกแล้วเพิ่มรายการถัดไป" หรือสลับสินค้าในดรอปดาวน์ด้านบน —
  // ยึดทะเบียนรถเดิมที่กรอกไว้ในหน้าก่อนหน้า (รถคันเดียวส่งหลายสินค้าพร้อมกัน)
  const carriedPlate = searchParams.get("plate");

  const [plateMode, setPlateMode] = React.useState<"system" | "manual">(() => {
    if (carriedPlate) return plateOptions.includes(carriedPlate) ? "system" : "manual";
    return plateOptions.length > 0 ? "system" : "manual";
  });
  const [plateSystem, setPlateSystem] = React.useState<string | undefined>(() =>
    carriedPlate && plateOptions.includes(carriedPlate) ? carriedPlate : plateOptions[0]
  );
  const [plateManual, setPlateManual] = React.useState(() =>
    carriedPlate && !plateOptions.includes(carriedPlate) ? carriedPlate : ""
  );
  // กรอกเป็น กก. ตามหน้างานจริง (ตาชั่งรถบรรทุกอ่านเป็น กก.) แต่ทั้งกล่องสรุป
  // ด้านบนและใบชั่งอื่นๆ ในระบบคิดเป็นตัน — แปลงตอนคำนวณ/แสดงผลเท่านั้น
  // ตัวแปร state ยังเก็บเป็น กก. ตรงๆ ไม่ปัดเศษเป็นตันแล้วเก็บ กันคลาดเคลื่อนสะสม
  const [grossKg, setGrossKg] = React.useState(0);
  const [grossAt, setGrossAt] = React.useState("");
  const [tareKg, setTareKg] = React.useState(0);
  const [tareAt, setTareAt] = React.useState("");
  const [supplierKg, setSupplierKg] = React.useState(0);
  const [note, setNote] = React.useState("");

  // เวลาเข้า/ออกตั้งต้นเป็นเวลาปัจจุบันเสมอ ไม่ใช่เลขตายตัว — อ่านหลัง mount
  // เท่านั้น (ไม่ใช่ตอน useState initializer) กัน hydration ไม่ตรงกันระหว่าง
  // เซิร์ฟเวอร์กับไคลเอนต์ เหมือนที่ TimeField เองก็อ่าน "ตอนนี้" ตอนเปิดกล่อง
  // เท่านั้นเช่นกัน ไม่ทับเวลาที่ผู้ใช้แก้ไว้แล้วถ้าพลาดมา render ซ้ำ
  React.useEffect(() => {
    const now = toHHMM(new Date());
    // ตั้งใจอ่านนาฬิกาเครื่อง (ระบบภายนอกที่ React ไม่รู้จัก) ครั้งเดียวตอน mount
    // เพื่อกัน hydration ไม่ตรงกัน — ไม่มีทางอื่นที่ไม่ใช่ effect สำหรับกรณีนี้
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setGrossAt((prev) => prev || now);
    setTareAt((prev) => prev || now);
  }, []);

  // เอกสารแนบเริ่มว่างเสมอ ให้ผู้ใช้อัปโหลดเองจริงๆ ไม่ตั้งต้นไฟล์ตัวอย่างมาให้
  const parichDocs = useDocUpload([]);
  const supplierDocs = useDocUpload([]);
  const idCardDocs = useDocUpload([]);

  const [openFileId, setOpenFileId] = React.useState<string | null>(null);

  // รวมไฟล์ทั้งสามช่องเป็นชุดเดียวให้ตัวอ่าน แต่ยังคงที่มาไว้เพื่อจัดกลุ่มในราง
  const viewerFiles: ViewerFile[] = [
    ...toViewer(parichDocs.files, "เอกสารของพาริช"),
    ...toViewer(supplierDocs.files, "เอกสารของผู้ขาย"),
    ...toViewer(idCardDocs.files, "สำเนาบัตรประชาชนคนขับ"),
  ];

  // คำนวณสดจากช่องที่กรอกอยู่ กรอกผิดจะเห็นส่วนต่างเพี้ยนทันที — กรอกเป็น กก.
  // แต่ทุกอย่างที่แสดง/เทียบกันในหน้านี้เป็นตันเสมอ หารด้วย 1000 ตอนคำนวณเท่านั้น
  const supplierTon = supplierKg / 1000;
  const netTon = Math.max(0, (grossKg - tareKg) / 1000);
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

  // ไปหน้ากรอกของสินค้าอื่นในใบสั่งซื้อเดียวกัน พกทะเบียนรถที่กรอกไว้ไปด้วย
  // ผ่าน query string — ไม่ต้องพิมพ์ทะเบียนรถซ้ำเพราะรถคันเดียวกันจริง
  function goToSibling(targetId: string, plate: string) {
    const qs = plate ? `?plate=${encodeURIComponent(plate)}` : "";
    router.push(`/weighing/${targetId}/add${qs}`);
  }

  // กรอกครบพอที่จะบันทึกจริงได้แล้วหรือยัง — ใช้ตัดสินว่าจะโชว์ปุ่ม "บันทึกแล้ว
  // เพิ่มรายการถัดไป" ไหม ปุ่มนี้ควรโผล่ตอนกรอกใบนี้เสร็จแล้วเท่านั้น ไม่ใช่
  // ปุ่มถาวรที่กดตั้งแต่หน้ายังว่างแล้วเด้ง error ใส่ (แบบเดียวกับ canSave ของ
  // หน้าใบขอซื้อ app/pr/create/page.tsx)
  const plateNow = plateMode === "system" ? plateSystem : plateManual.trim();
  const canSave = Boolean(plateNow) && grossKg > tareKg;

  function handleSave(mode: "draft" | "save" | "next") {
    const plate = plateMode === "system" ? plateSystem : plateManual.trim();
    if (!plate) {
      toast.error("กรุณาระบุทะเบียนรถ");
      return;
    }
    if (mode !== "draft" && grossKg <= tareKg) {
      toast.error("น้ำหนักชั่งเข้าต้องมากกว่าชั่งออก");
      return;
    }
    if (
      mode !== "draft" &&
      (parichDocs.uploading || supplierDocs.uploading || idCardDocs.uploading)
    ) {
      toast.error("เอกสารยังอัปโหลดไม่เสร็จ");
      return;
    }
    toast.success(
      mode === "draft" ? "บันทึกฉบับร่างแล้ว" : `บันทึกการชั่ง ${safeDoc.code}-${seq} แล้ว`,
      { description: `${plate} — น้ำหนักสินค้าจริง ${formatTon(netTon)} ตัน` }
    );
    if (mode === "save") {
      router.back();
    } else if (mode === "next") {
      const currentIndex = siblings.findIndex((s) => s.id === safeDoc.id);
      const next = siblings[(currentIndex + 1) % siblings.length];
      if (next) goToSibling(next.id, plate);
    }
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
            {/* จอแคบยุบชั้นนี้เหลือ ⋯ และตัดเลขที่ใบออกจากชั้นถัดไป — ไม่งั้น
                breadcrumb ยาวเกินจนตกลงไปสองบรรทัด ยังกดกลับไปหน้ารายการได้
                เหมือนเดิม (อ่านชื่อจริงได้จาก aria-label) */}
            <BreadcrumbItem>
              <BreadcrumbLink
                href="/weighing"
                aria-label="ชั่งน้ำหนัก"
                className="@lg:hidden"
              >
                <BreadcrumbEllipsis className="size-4" />
              </BreadcrumbLink>
              <BreadcrumbLink href="/weighing" className="hidden @lg:inline">
                ชั่งน้ำหนัก
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href={`/weighing/${doc.id}`}>
                ใบชั่งน้ำหนัก
                <span className="hidden @lg:inline"> {doc.code}</span>
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

        {/* จอแคบ: เลขที่ใบลงบรรทัดใหม่ ไม่ให้ตัดคำกลางเลขจนอ่านไม่รู้เรื่อง
            (เช่น "PO260115/01A-" ขึ้นบรรทัดหนึ่ง เหลือ "02" อีกบรรทัด) */}
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          เพิ่มการชั่งน้ำหนัก{" "}
          <span className="block @lg:inline">
            {doc.code}-{seq}
          </span>
        </h1>

        {/* ---------- สองหัวข้อ ----------
             1. ข้อมูลสินค้า — สินค้า/น้ำหนัก/เอกสารชั่งของพาริช+ผู้ขาย
             2. ข้อมูลทะเบียนรถ — ทะเบียนรถ/หมายเหตุผู้สั่งซื้อ/สำเนาบัตรคนขับ
             แยกสองก้อนเพราะเป็นคนละคำถาม "สินค้าอะไร/หนักเท่าไหร่" กับ
             "รถคันไหน/คนขับใคร" ไม่ต้องไล่อ่านรวดเดียวจากบนสุดถึงล่างสุด */}
        <SectionHeading
          index={1}
          title="ข้อมูลสินค้า"
          subtitle="ข้อมูลสินค้า น้ำหนัก และเอกสารการชั่งน้ำหนัก"
        />

        {/* ---------- สลับสินค้า ----------
             ใบสั่งซื้อเดียวกันมีได้หลายสินค้า (ดู siblingWeighingDocs) — สลับ
             ไปกรอกสินค้าอื่นในใบเดียวกันได้โดยไม่ต้องพิมพ์ทะเบียนรถซ้ำ เพราะ
             รถคันเดียวกันมักส่งหลายสินค้าพร้อมกัน ขึ้นเฉพาะตอนมีสินค้าอื่นจริง */}
        {siblings.length > 1 && (
          <div className="mt-4 space-y-1.5">
            <Label htmlFor="product-switch">สินค้า</Label>
            <Select
              value={safeDoc.id}
              onValueChange={(id) => {
                if (id === safeDoc.id) return;
                const plate = plateMode === "system" ? plateSystem : plateManual.trim();
                goToSibling(id, plate ?? "");
              }}
            >
              <SelectTrigger id="product-switch" className="w-full bg-card @lg:w-80">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {siblings.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.code} — {s.productName}
                    {s.productSub && ` ${s.productSub}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

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
              ส่วนต่างเป็นสีแดงเมื่อได้ของน้อยกว่าที่ผู้ขายแจ้ง ซึ่งคือเงินที่หายไป
              จอแคบสองคอลัมน์ ไม่ใช่เรียงลงมาทีละอัน — น้ำหนักจริงกับน้ำหนักตาม
              ผู้ขายต้องอยู่บรรทัดเดียวกันถึงจะเทียบกันได้ในสายตาเดียว */}
          <div className="mt-3 grid grid-cols-2 gap-4 rounded-lg bg-brand p-4 @2xl:grid-cols-3">
            <Stat label="น้ำหนักจริง (ตัน)" value={formatTon(netTon)} />
            <Stat label="น้ำหนักตามผู้ขาย (ตัน)" value={formatTon(supplierTon)} />
            <Stat
              label="ส่วนต่าง (ตัน)"
              value={`${diffTon > 0 ? "+" : ""}${formatTon(diffTon)}`}
              tone={diffTon < 0 ? "bad" : undefined}
            />
          </div>
        </div>

        {/* ---------- น้ำหนักชั่ง ----------
             เข้ากับออกอยู่แถวเดียวกัน เพราะสองค่านี้ต้องเทียบกันตลอด
             แยกคนละแถวแล้วต้องเลื่อนสายตาขึ้นลงเพื่อตรวจว่าเข้ามากกว่าออกจริง
             กรอกเป็น กก. ตามตาชั่งจริงหน้างาน แต่โชว์ค่าแปลงเป็นตันชิดขวาของ
             ป้ายชื่อช่องไว้เสมอ กันงงว่ากรอกไปตัวไหนกันแน่ ไม่ต้องกดคำนวณเอง */}
        <div className="mt-6 grid gap-4 @2xl:grid-cols-4">
          <div className="space-y-1.5">
            <WeightLabel htmlFor="gross-kg" kg={grossKg}>
              ชั่งเข้ารถพร้อมสินค้า (กก.)
            </WeightLabel>
            <WeightStepper id="gross-kg" value={grossKg} onValueChange={setGrossKg} />
          </div>
          <div className="space-y-1.5">
            {/* ครอบด้วย flex แถวเดียวกับ WeightLabel ข้างๆ ให้โครงสร้างสูงเท่ากัน
                เป๊ะๆ เสมอ ไม่ใช่หวังพึ่งว่าบรรทัดเดี่ยวจะสูงพอดีเอง */}
            <div className="flex items-baseline justify-between gap-2">
              <Label htmlFor="gross-at">เวลาเข้า</Label>
            </div>
            <TimeField id="gross-at" value={grossAt} onValueChange={setGrossAt} />
          </div>
          <div className="space-y-1.5">
            <WeightLabel htmlFor="tare-kg" kg={tareKg}>
              ชั่งออกรถเปล่า (กก.)
            </WeightLabel>
            <WeightStepper id="tare-kg" value={tareKg} onValueChange={setTareKg} />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-baseline justify-between gap-2">
              <Label htmlFor="tare-at">เวลาออก</Label>
            </div>
            <TimeField id="tare-at" value={tareAt} onValueChange={setTareAt} />
          </div>

          <div className="space-y-1.5 @2xl:col-span-2">
            <WeightLabel htmlFor="supplier-kg" kg={supplierKg}>
              น้ำหนักสินค้าตามผู้ขาย (กก.)
            </WeightLabel>
            <WeightStepper
              id="supplier-kg"
              value={supplierKg}
              onValueChange={setSupplierKg}
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

        {/* ---------- เอกสารแนบของสินค้า ----------
             แยกสองช่องตามที่มาของเอกสาร ไม่ใช่กองรวมช่องเดียว
             เวลาเคลมกับผู้ขายต้องหยิบเฉพาะใบของผู้ขายออกมา
             กองรวมกันแล้วต้องมาไล่เปิดทีละไฟล์ว่าอันไหนของใคร
             (สำเนาบัตรคนขับอยู่หัวข้อ 2 ข้อมูลทะเบียนรถแทน — เป็นเอกสารของ
             "คนขับ/รถ" ไม่ใช่ของสินค้า) */}
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
        </div>

        <SectionHeading
          index={2}
          title="ข้อมูลทะเบียนรถ"
          subtitle="ข้อมูลทะเบียนรถ และสำเนาบัตรประชาชนคนขับ"
          className="mt-8"
        />

        {/* ---------- ทะเบียนรถ ---------- */}
        <div className="mt-4 grid gap-4 @2xl:grid-cols-2">
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

        <div className="mt-6">
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
           คนต้องเก็บงานค้างไว้กลางทางได้ ส่วนบันทึกจริงถึงจะตรวจครบ

           จอแคบ vs จอกว้างเป็นคนละเลย์เอาต์ตั้งใจ เหมือนหน้าใบขอซื้อ
           (app/pr/create/page.tsx) — ป้ายปุ่มยาว อยู่แถวเดียวกันสี่ปุ่มบนจอ
           มือถือไม่พอดี จอแคบเลยแยกเป็นแถวละปุ่ม: บันทึกร่าง / บันทึกแล้วเพิ่ม
           รายการถัดไป กว้างเต็มคนละแถว แล้วค่อย ย้อนกลับ+บันทึก แบ่งครึ่งแถว
           ล่างสุด — จอกว้างมีที่พอ อยู่แถวเดียวได้ ใช้ @lg: ไม่ใช่ lg: ตาม
           ธรรมเนียมเดียวกัน (วัดจากกล่อง @container ของ DeviceFrame ไม่ใช่
           ขนาดจอจริง)

           "บันทึกแล้วเพิ่มรายการถัดไป" ขึ้นก็ต่อเมื่อกรอกครบพอจะบันทึกได้แล้ว
           (canSave) และมีสินค้าตัวอื่นในใบให้ไปต่อจริง — ไม่ใช่ปุ่มถาวรที่กด
           ตั้งแต่หน้ายังว่างแล้วเด้ง error ใส่ */}
      <div className="sticky bottom-0 z-30 border-t border-border bg-surface">
        <div className="mx-auto w-full max-w-6xl px-8 py-3">
          {/* ---------- จอแคบ: แยกแถว ---------- */}
          <div className="flex flex-col gap-3 @lg:hidden">
            <Button
              variant="outline-primary"
              className="w-full"
              onClick={() => handleSave("draft")}
            >
              บันทึกร่าง
            </Button>
            {siblings.length > 1 && canSave && (
              <Button
                variant="outline-primary"
                className="w-full"
                onClick={() => handleSave("next")}
              >
                บันทึกแล้วเพิ่มรายการถัดไป
              </Button>
            )}
            <div className="flex items-center gap-3">
              <Button
                variant="outline-primary"
                className="flex-1"
                onClick={() => router.back()}
              >
                ย้อนกลับ
              </Button>
              <Button className="flex-1" onClick={() => handleSave("save")}>
                บันทึก
              </Button>
            </div>
          </div>

          {/* ---------- จอกว้าง: แถวเดียว ---------- */}
          <div className="hidden items-center justify-between gap-3 @lg:flex">
            <Button variant="outline-primary" onClick={() => router.back()}>
              ย้อนกลับ
            </Button>
            <div className="flex items-center gap-3">
              <Button variant="outline-primary" onClick={() => handleSave("draft")}>
                บันทึกร่าง
              </Button>
              {siblings.length > 1 && canSave && (
                <Button variant="outline-primary" onClick={() => handleSave("next")}>
                  บันทึกแล้วเพิ่มรายการถัดไป
                </Button>
              )}
              <Button onClick={() => handleSave("save")}>บันทึก</Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/** หัวข้อใหญ่ของแต่ละก้อนในฟอร์ม — เลขนำหน้า + ชื่อหัวข้อ + คำอธิบายสั้นใต้ชื่อ */
function SectionHeading({
  index,
  title,
  subtitle,
  className,
}: {
  index: number;
  title: string;
  subtitle: string;
  className?: string;
}) {
  return (
    <div className={cn("mt-4", className)}>
      <h2 className="text-base font-semibold">
        {index}. {title}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
    </div>
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

/** ป้ายชื่อช่องกรอกน้ำหนัก (กก.) พร้อมค่าแปลงเป็นตันชิดขวา — คำนวณสดตามที่กรอก
 *  ยังไม่มีค่า (0) ซ่อนด้วย invisible ไม่ใช่ไม่เรนเดอร์ — ต้องกันพื้นที่ไว้เท่ากัน
 *  เสมอ ไม่งั้นพอเริ่มพิมพ์แล้วมีข้อความโผล่ ความสูงแถวจะเปลี่ยนแล้วเนื้อหา
 *  ด้านล่างขยับ */
function WeightLabel({
  htmlFor,
  kg,
  children,
}: {
  htmlFor: string;
  kg: number;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <Label htmlFor={htmlFor}>{children}</Label>
      <span
        className={cn(
          // leading-none ให้ตรงกับ Label ข้างๆ เป๊ะ (Label ของดีไซน์ซิสเต็มตั้ง
          // leading-none ไว้ แต่ span เปล่าใช้ line-height ปกติของเบราว์เซอร์ซึ่ง
          // สูงกว่า ทำให้แถวนี้สูงกว่าแถวเวลาเข้า/ออกที่มีแค่ Label เดี่ยวๆ)
          "text-sm leading-none font-medium tabular-nums",
          kg <= 0 && "invisible"
        )}
      >
        {formatTon(kg / 1000)} ตัน
      </span>
    </div>
  );
}

/** กรอกน้ำหนักเป็น กก. — ขั้นละ 10 กก. ตามความละเอียดจริงของตาชั่งรถบรรทุก
 *  ไม่มีทศนิยม ต่างจากค่าตันที่แปลงแสดงผล (formatTon ปัดสองตำแหน่งเสมอ) */
function WeightStepper({
  id,
  value,
  onValueChange,
}: {
  id: string;
  value: number;
  onValueChange: (next: number) => void;
}) {
  const field = useNumberField(value, onValueChange, 0);
  const step = (delta: number) => onValueChange(Math.max(0, value + delta));

  return (
    <InputGroup className="bg-card">
      <InputGroupAddon align="inline-start">
        <InputGroupButton size="icon-xs" aria-label="ลดน้ำหนัก" onClick={() => step(-10)}>
          <MinusIcon />
        </InputGroupButton>
      </InputGroupAddon>
      <InputGroupInput {...field} id={id} className="text-center" />
      <InputGroupAddon align="inline-end">
        <InputGroupButton size="icon-xs" aria-label="เพิ่มน้ำหนัก" onClick={() => step(10)}>
          <PlusIcon />
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  );
}
