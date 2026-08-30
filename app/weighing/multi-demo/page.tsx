"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  CheckIcon,
  LockIcon,
  MinusIcon,
  PlusIcon,
} from "lucide-react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@peckey954/ui/components/ui/table";
import { cn } from "@peckey954/ui/lib/utils";
import { toast } from "sonner";
import { FileUpload, useDocUpload, type DocFile } from "@/components/file-upload";
import { FileViewer, type ViewerFile } from "@/components/file-viewer";
import { useNumberField } from "@/components/number-field";
import { TimeField } from "@/components/time-field";
import {
  COL_FIRST,
  COL_LAST,
  HEAD_FIRST,
  HEAD_LAST,
  STICKY_HEAD,
  TableFrame,
} from "@/components/stock/doc-parts";
import {
  formatSignedTon,
  formatTon,
  MULTI_PRODUCT_DEMO,
  parichSlipNo,
  type TruckProduct,
  type WeighCheckpoint,
} from "@/lib/weighing";

/* ------------------------------------------------------------------
   ต้นแบบ — ชั่งน้ำหนักรถคันเดียวที่ขนหลายสินค้า (1-3 รายการ)

   ปัญหาของโมเดลเดิม (WeighingRound): รถหนึ่งคันมีแค่ "ชั่งเข้า" กับ
   "ชั่งออก" สองจุด ใช้ได้ก็ต่อเมื่อรถคันนั้นขนสินค้าเดียว — แต่หน้างานจริง
   รถคันเดียวขนได้ 1-3 สินค้า ต้องชั่งเป็นลำดับ: เข้าเต็มคัน → ลงสินค้าที่ 1
   แล้วชั่ง → ลงสินค้าที่ 2 แล้วชั่ง → ... → ลงสินค้าสุดท้ายแล้วชั่ง (=รถเปล่า)
   น้ำหนักสินค้าแต่ละตัว = ผลต่างระหว่างจุดชั่งที่ติดกันสองจุด (ดู lib/weighing.ts
   ส่วน "ต้นแบบ — รถหนึ่งคันมีหลายสินค้า" สำหรับที่มาของโมเดลข้อมูล)

   ออกแบบเป็นขั้นบันได (step-by-step) แทนฟอร์มกรอกทีเดียวทั้งหมด เพราะ:
   - เครื่องชั่งเป็นเครื่องแยก ไม่ได้ต่อกับระบบนี้ ต้องรอชั่งจริงหน้างานเสร็จ
     ทีละจุดก่อน ถึงจะมีเลขมาคีย์ — ฟอร์มเดียวกรอกทีเดียวจะบังคับให้คนคีย์นั่ง
     รอครบทุกจุดก่อนถึงจะบันทึกได้สักที ทั้งที่ของจริงมันทยอยเกิดเป็นชั่วโมง
   - กรอกแต่ละจุดแล้วเห็นน้ำหนักสินค้าตัวนั้นได้ทันที ไม่ต้องรอจนจบครบทุกสินค้า
     ถึงจะรู้ว่าตัวไหนขาด/เกิน
   - สินค้าที่ยังไม่ถึงคิว (ล็อกไว้) กันคีย์ผิดจุด/ผิดลำดับ เพราะลำดับชั่งต้อง
     ตรงกับลำดับลงของจริงหน้างานเป๊ะ ถึงจะคำนวณน้ำหนักถูก

   เอกสารอ้างอิงต่อสินค้า (ตามที่ต้องมี): ใบชั่งของพาริช (ระบบสร้างเลขที่ให้
   อัตโนมัติทันทีที่บันทึกน้ำหนักตัวนั้นสำเร็จ — ไม่ต้องกรอกเอง), ใบชั่งของ
   ผู้จำหน่าย (กรอกเลขที่เอง เพราะเป็นใบที่ผู้ขายออกเอง), และไฟล์แนบสามหมวด
   ท้ายหน้า (ของพาริช/ของผู้ขาย/สำเนาคนขับ) ซึ่งยึดตามรถทั้งคัน ไม่ใช่แยกตาม
   สินค้า เพราะโดยงานจริงคือชุดเอกสารเดียวกันที่หน้าชั่งต่อรถหนึ่งคัน

   ต้นแบบนี้ตั้งใจให้ทดลองกดได้จริงตั้งแต่จุดแรก (ยังไม่มีจุดไหนถูกบันทึกไว้
   เลย) จะได้เห็นทั้งลำดับการปลดล็อกทีละขั้นและผลลัพธ์ท้ายสุดในหน้าเดียวกัน
   ไม่ต้องมี backend จริง — บันทึกแล้วเก็บใน state ของหน้านี้เท่านั้น
------------------------------------------------------------------ */

function seedDocs(prefix: string, names: string[]): DocFile[] {
  return names.map((name, i) => ({
    id: `${prefix}-${i + 1}`,
    name,
    size: 6_900_000,
    status: "done",
    progress: 100,
  }));
}

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

export default function MultiProductWeighingDemoPage() {
  const router = useRouter();
  const round = MULTI_PRODUCT_DEMO;

  const [checkpoints, setCheckpoints] = React.useState<WeighCheckpoint[]>(
    round.checkpoints
  );
  const [products, setProducts] = React.useState<TruckProduct[]>(round.products);

  // จุดแรกที่ยังไม่ถูกบันทึก = ขั้นที่กำลังทำงานอยู่ตอนนี้ — ก่อนหน้านั้นคือ
  // "เสร็จแล้ว" หลังจากนั้นคือ "ล็อกไว้" ยังกรอกไม่ได้
  const activeSeq = checkpoints.findIndex((c) => c.ton == null);
  const allDone = activeSeq === -1;

  const parichDocs = useDocUpload(
    seedDocs("wp", ["ใบชั่งเข้า-PO260130-09.pdf", "ใบชั่งออก-PO260130-09.pdf"])
  );
  const supplierDocs = useDocUpload(
    seedDocs("ws", ["ใบชั่งผู้ขาย-รวม3รายการ.pdf"])
  );
  const idCardDocs = useDocUpload(seedDocs("wi", ["สำเนาบัตร-คนขับ.pdf"]));
  const [openFileId, setOpenFileId] = React.useState<string | null>(null);
  const viewerFiles: ViewerFile[] = [
    ...toViewer(parichDocs.files, "เอกสารของพาริช"),
    ...toViewer(supplierDocs.files, "เอกสารของผู้ขาย"),
    ...toViewer(idCardDocs.files, "สำเนาบัตรประชาชนคนขับ"),
  ];

  function saveCheckpoint(seq: number, ton: number, at: string) {
    setCheckpoints((prev) =>
      prev.map((c) => (c.seq === seq ? { ...c, ton, at } : c))
    );
  }

  function saveProductMeta(
    index: number,
    supplierTon: number,
    supplierSlipNo: string
  ) {
    setProducts((prev) =>
      prev.map((p, i) =>
        i === index
          ? {
              ...p,
              supplierTon,
              supplierSlipNo,
              parichSlipNo: parichSlipNo(round, index),
            }
          : p
      )
    );
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
              <BreadcrumbPage className="text-primary">
                ต้นแบบ: รถหนึ่งคันหลายสินค้า
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          ต้นแบบ: ชั่งน้ำหนักรถที่มีหลายสินค้า
        </h1>
        <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
          ลองกรอกได้จริงตั้งแต่จุดแรก — แต่ละจุดชั่งบันทึกแยกกันตามลำดับที่ลง
          ของจริงหน้างาน กรอกจุดที่ N ได้ก็ต่อเมื่อจุดที่ N-1 บันทึกแล้วเท่านั้น
        </p>

        {/* ---------- หัวใบ: รถ + รายการสินค้าตามลำดับที่จะลง ---------- */}
        <div className="mt-5 rounded-xl border border-border bg-card p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="font-semibold">{round.receiptCode}</span>
              <span className="text-sm text-muted-foreground">{round.batchId}</span>
            </p>
            <p className="text-sm">
              ทะเบียนรถ <span className="font-medium">{round.plate}</span>
              <span className="ml-3 text-muted-foreground">{round.arriveDate}</span>
            </p>
          </div>

          <div className="mt-3 rounded-lg bg-brand p-4">
            <p className="text-sm text-muted-foreground">
              ลำดับสินค้าที่จะลง ({products.length} รายการ)
            </p>
            <ol className="mt-2 flex flex-wrap gap-2">
              {products.map((p, i) => (
                <li
                  key={p.id}
                  className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-sm"
                >
                  <span className="font-semibold text-primary">{i + 1}.</span>
                  <span className="font-medium">{p.productName}</span>
                  {p.productSub && (
                    <span className="text-muted-foreground">{p.productSub}</span>
                  )}
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* ---------- ขั้นตอนการชั่ง ---------- */}
        <div className="mt-8 space-y-3">
          <h2 className="text-lg font-semibold">ขั้นตอนการชั่ง</h2>

          {/* จุดที่ 0 — ชั่งเข้ารถพร้อมสินค้าทั้งหมด ไม่ผูกกับสินค้าตัวใดตัวหนึ่ง */}
          <WeighStepCard
            state={activeSeq === -1 || activeSeq > 0 ? "done" : activeSeq === 0 ? "active" : "locked"}
            title={`ชั่งเข้า (รถ + สินค้าทั้งหมด ${products.length} รายการ)`}
            checkpoint={checkpoints[0]}
            onSave={(ton, at) => {
              saveCheckpoint(0, ton, at);
              toast.success("บันทึกชั่งเข้าแล้ว", {
                description: `${round.plate} — ${formatTon(ton)} ตัน`,
              });
            }}
          />

          {products.map((p, i) => {
            const seq = i + 1;
            const isLast = i === products.length - 1;
            const state =
              activeSeq === -1 || activeSeq > seq
                ? "done"
                : activeSeq === seq
                  ? "active"
                  : "locked";
            const prevTon = checkpoints[i]?.ton;

            return (
              <WeighStepCard
                key={p.id}
                state={state}
                title={
                  isLast
                    ? `ลงสินค้าสุดท้าย: ${p.productName}${p.productSub ? ` ${p.productSub}` : ""} (ชั่งเสร็จ = รถเปล่า)`
                    : `ลงสินค้าที่ ${seq}: ${p.productName}${p.productSub ? ` ${p.productSub}` : ""}`
                }
                checkpoint={checkpoints[seq]}
                prevTon={prevTon}
                product={p}
                onSave={(ton, at, supplierTon, supplierSlipNo) => {
                  saveCheckpoint(seq, ton, at);
                  saveProductMeta(i, supplierTon, supplierSlipNo);
                  const net = prevTon != null ? Math.round((prevTon - ton) * 100) / 100 : null;
                  toast.success(`บันทึกน้ำหนัก ${p.productName} แล้ว`, {
                    description:
                      net != null
                        ? `เลขที่ใบชั่งพาริช ${parichSlipNo(round, i)} — สินค้าจริง ${formatTon(net)} ตัน`
                        : `เลขที่ใบชั่งพาริช ${parichSlipNo(round, i)}`,
                  });
                }}
              />
            );
          })}

          {allDone && (
            <div className="flex items-center gap-2 rounded-xl border border-success-border bg-success px-4 py-3 text-sm font-medium text-success-foreground">
              <CheckIcon className="size-4 shrink-0" />
              ชั่งครบทุกสินค้าแล้ว รถคันนี้ชั่งออกเป็นรถเปล่าเรียบร้อย
            </div>
          )}
        </div>

        {/* ---------- สรุปผลการชั่ง ---------- */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold">สรุปผลการชั่งต่อสินค้า</h2>
          <div className="mt-3">
            <TableFrame>
              <Table className="table-fixed">
                <TableHeader className={STICKY_HEAD}>
                  <TableRow>
                    <TableHead className={HEAD_FIRST}>สินค้า</TableHead>
                    <TableHead>เลขที่ใบชั่งพาริช</TableHead>
                    <TableHead>เลขที่ใบชั่งผู้จำหน่าย</TableHead>
                    <TableHead className="text-right">น้ำหนักจริง (ตัน)</TableHead>
                    <TableHead className="text-right">ตามผู้ขาย (ตัน)</TableHead>
                    <TableHead className={cn(HEAD_LAST, "text-right")}>
                      ส่วนต่าง (ตัน)
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((p, i) => {
                    const net = computeNet(checkpoints, i);
                    const diff =
                      net != null && p.supplierTon != null
                        ? Math.round((net - p.supplierTon) * 100) / 100
                        : null;
                    return (
                      <TableRow key={p.id}>
                        <TableCell className={COL_FIRST}>
                          <span className="block font-medium whitespace-nowrap">
                            {p.productName}
                            {p.productSub && ` ${p.productSub}`}
                          </span>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {p.parichSlipNo ?? <span className="text-muted-foreground">-</span>}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {p.supplierSlipNo || (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap tabular-nums">
                          {net != null ? (
                            formatTon(net)
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap tabular-nums">
                          {p.supplierTon != null ? (
                            formatTon(p.supplierTon)
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className={cn(COL_LAST, "text-right whitespace-nowrap tabular-nums")}>
                          {diff != null ? (
                            <span
                              className={cn(
                                "font-medium",
                                diff < 0 && "text-danger-strong"
                              )}
                            >
                              {formatSignedTon(diff)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableFrame>
          </div>
        </div>

        {/* ---------- เอกสารแนบ — ยึดตามรถทั้งคัน ไม่แยกตามสินค้า ---------- */}
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
        <FileViewer files={viewerFiles} openId={openFileId} onOpenChange={setOpenFileId} />
      </main>

      <div className="sticky bottom-0 z-30 border-t border-border bg-surface">
        <div className="mx-auto flex w-full max-w-6xl items-center px-4 py-3 sm:px-6">
          <Button variant="outline-primary" onClick={() => router.back()}>
            ย้อนกลับ
          </Button>
        </div>
      </div>
    </>
  );
}

/** เผื่อ productNetTon (อ่านจาก round เดิมที่ยังไม่อัปเดต state) ไม่ตรงกับ
    checkpoints ล่าสุดใน state — คำนวณสดจาก state ตรงๆ อีกที กันเหตุการณ์
    ค่าไม่ sync ระหว่าง object คงที่ (MULTI_PRODUCT_DEMO) กับ state ที่แก้ไข */
function computeNet(checkpoints: WeighCheckpoint[], index: number): number | null {
  const a = checkpoints[index]?.ton;
  const b = checkpoints[index + 1]?.ton;
  if (a == null || b == null) return null;
  return Math.round((a - b) * 100) / 100;
}

/** การ์ดหนึ่งขั้นตอนการชั่ง — สามสถานะ: เสร็จแล้ว (เขียว, พับเก็บ)/กำลังทำ
    (ฟอร์มกรอกเปิดอยู่)/ล็อกไว้ (เทา, กรอกไม่ได้จนกว่าขั้นก่อนหน้าจะเสร็จ) */
function WeighStepCard({
  state,
  title,
  checkpoint,
  prevTon,
  product,
  onSave,
}: {
  state: "done" | "active" | "locked";
  title: string;
  checkpoint: WeighCheckpoint;
  /** น้ำหนักจุดก่อนหน้า — ใช้โชว์เป็นข้อมูลอ้างอิงตอนกรอก และคำนวณน้ำหนักสด */
  prevTon?: number;
  /** มีเฉพาะขั้นที่ผูกกับสินค้าตัวหนึ่ง (ไม่ใช่ขั้น "ชั่งเข้า" แรกสุด) */
  product?: TruckProduct;
  onSave: (ton: number, at: string, supplierTon: number, supplierSlipNo: string) => void;
}) {
  const [ton, setTon] = React.useState(0);
  const [at, setAt] = React.useState("11:00");
  const [supplierTon, setSupplierTon] = React.useState(0);
  const [supplierSlipNo, setSupplierSlipNo] = React.useState("");

  const liveNet = prevTon != null ? Math.max(0, Math.round((prevTon - ton) * 100) / 100) : null;

  if (state === "locked") {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-dashed border-border bg-surface px-4 py-3.5 text-muted-foreground">
        <LockIcon className="size-4 shrink-0" />
        <span className="text-sm">{title}</span>
        <span className="ml-auto shrink-0 text-sm">รอขั้นก่อนหน้าให้เสร็จก่อน</span>
      </div>
    );
  }

  if (state === "done") {
    const net = prevTon != null && checkpoint.ton != null
      ? Math.round((prevTon - checkpoint.ton) * 100) / 100
      : null;
    return (
      <div className="rounded-xl border border-border bg-card px-4 py-3.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-sm font-medium">
            <CheckIcon className="size-4 shrink-0 text-success-strong" />
            {title}
          </p>
          <p className="text-sm text-muted-foreground">
            {checkpoint.ton != null && formatTon(checkpoint.ton)} ตัน
            {checkpoint.at && ` · ${checkpoint.at}`}
          </p>
        </div>
        {product && (
          <div className="mt-2 grid grid-cols-2 gap-3 pl-6 text-sm @lg:grid-cols-4">
            <MetaField label="น้ำหนักจริง" value={net != null ? `${formatTon(net)} ตัน` : "-"} />
            <MetaField
              label="ตามผู้ขาย"
              value={product.supplierTon != null ? `${formatTon(product.supplierTon)} ตัน` : "-"}
            />
            <MetaField label="เลขที่ใบชั่งพาริช" value={product.parichSlipNo ?? "-"} />
            <MetaField label="เลขที่ใบชั่งผู้จำหน่าย" value={product.supplierSlipNo || "-"} />
          </div>
        )}
      </div>
    );
  }

  // state === "active"
  return (
    <div className="rounded-xl border border-primary bg-card p-4">
      <p className="font-medium">{title}</p>
      {prevTon != null && (
        <p className="mt-0.5 text-sm text-muted-foreground">
          น้ำหนักจุดก่อนหน้า: {formatTon(prevTon)} ตัน
        </p>
      )}

      <div className="mt-3 grid gap-4 @lg:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor={`ton-${title}`}>น้ำหนักที่ชั่งได้ (ตัน)</Label>
          <TonStepper id={`ton-${title}`} value={ton} onValueChange={setTon} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`at-${title}`}>เวลาชั่ง</Label>
          <TimeField id={`at-${title}`} value={at} onValueChange={setAt} />
        </div>
      </div>

      {product && (
        <>
          {liveNet != null && (
            <div className="mt-3 rounded-lg bg-brand p-3">
              <p className="text-sm text-muted-foreground">น้ำหนักสินค้านี้ (คำนวณสด)</p>
              <p className="mt-0.5 text-lg font-semibold tabular-nums">{formatTon(liveNet)} ตัน</p>
            </div>
          )}
          <div className="mt-3 grid gap-4 @lg:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor={`sup-ton-${title}`}>น้ำหนักตามใบชั่งผู้ขาย (ตัน)</Label>
              <TonStepper id={`sup-ton-${title}`} value={supplierTon} onValueChange={setSupplierTon} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`sup-slip-${title}`}>เลขที่ใบชั่งของผู้จำหน่าย</Label>
              <InputGroup className="bg-card">
                <InputGroupInput
                  id={`sup-slip-${title}`}
                  placeholder="ระบุเลขที่ใบชั่งของผู้จำหน่าย"
                  value={supplierSlipNo}
                  onChange={(e) => setSupplierSlipNo(e.target.value)}
                />
              </InputGroup>
            </div>
          </div>
        </>
      )}

      <div className="mt-4 flex justify-end">
        <Button
          disabled={ton <= 0}
          onClick={() => onSave(ton, at, supplierTon, supplierSlipNo)}
        >
          บันทึกจุดนี้
        </Button>
      </div>
    </div>
  );
}

function MetaField({ label, value }: { label: string; value: string }) {
  return (
    <p>
      <span className="block text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </p>
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
