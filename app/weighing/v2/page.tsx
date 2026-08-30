"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  CheckIcon,
  ChevronLeftIcon,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@peckey954/ui/components/ui/select";
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
  MULTI_PRODUCT_DEMO_ROUND,
  parichSlipNo,
  PO_LINE_ITEMS_POOL,
  type TruckProduct,
  type WeighCheckpoint,
} from "@/lib/weighing";

/* ------------------------------------------------------------------
   ชั่งน้ำหนัก Ver 2 — รองรับรถคันเดียวที่ขนหลายสินค้า (1-3 รายการ)

   แยกเป็นหน้า/route ต่างหาก (/weighing/v2) ไม่แตะระบบชั่งน้ำหนักเดิมที่
   /weighing เลย เพราะยังไม่สรุปว่าจะใช้แบบไหน — ไว้เทียบกันดูก่อนค่อยตัดสินใจ
   ทีหลังว่าจะรวมเป็นระบบเดียวยังไง (ไม่มีลิงก์เชื่อมจากหน้ารายการ /weighing
   มาที่นี่ตั้งใจ เข้าถึงได้เฉพาะกดลิงก์ตรงๆ เท่านั้น)

   ปัญหาของโมเดลเดิม (WeighingRound): รถหนึ่งคันมีแค่ "ชั่งเข้า" กับ
   "ชั่งออก" สองจุด ใช้ได้ก็ต่อเมื่อรถคันนั้นขนสินค้าเดียว — แต่หน้างานจริง
   รถคันเดียวขนได้ 1-3 สินค้า ต้องชั่งเป็นลำดับ: เข้าเต็มคัน → ลงสินค้าที่ 1
   แล้วชั่ง → ลงสินค้าที่ 2 แล้วชั่ง → ... → ลงสินค้าสุดท้ายแล้วชั่ง (=รถเปล่า)
   น้ำหนักสินค้าแต่ละตัว = ผลต่างระหว่างจุดชั่งที่ติดกันสองจุด (ดู lib/weighing.ts
   ส่วน "ต้นแบบ — รถหนึ่งคันมีหลายสินค้า" สำหรับที่มาของโมเดลข้อมูล)

   หน้านี้แบ่งเป็นสองช่วง:
   1) ตั้งค่าก่อนชั่ง (setup) — คีย์แค่ "จำนวนสินค้าในรถคันนี้" เฉยๆ ไม่ให้เลือก
      ว่าเป็นสินค้าตัวไหน/เรียงลำดับยังไงล่วงหน้า เพราะหน้างานจริงมักไม่รู้ก่อน
      ว่าจะลงตัวไหนก่อนหลัง (คนขับ/พขร. ตัดสินใจหน้างานตามที่จอดสะดวก) รู้แค่
      "รถคันนี้มีของกี่ตัว" ล่วงหน้าเท่านั้น
   2) ชั่งจริง (weighing) — ขั้นบันไดทีละจุดชั่งตามลำดับที่ลงจริงหน้างาน แต่ละ
      จุดมีดรอปดาวให้เลือกว่า "ตัวที่กำลังลงตอนนี้คือสินค้าตัวไหน" (เลือกได้
      เฉพาะตัวที่ยังไม่ถูกเลือกไปแล้วในจุดก่อนหน้า) ค่อยตัดสินใจตอนถึงจุดนั้น
      จริงๆ ไม่ต้องเดาล่วงหน้าตั้งแต่ต้น ล็อกขั้นที่ยังไม่ถึงคิว แก้จำนวนสินค้า
      ย้อนกลับไม่ได้แล้วถ้าเริ่มชั่งจุดแรกไปแล้ว

   เอกสารอ้างอิงต่อสินค้า (ตามที่ต้องมี): ใบชั่งของพาริช (ระบบสร้างเลขที่ให้
   อัตโนมัติทันทีที่บันทึกน้ำหนักตัวนั้นสำเร็จ — ไม่ต้องกรอกเอง), ใบชั่งของ
   ผู้จำหน่าย (กรอกเลขที่เอง เพราะเป็นใบที่ผู้ขายออกเอง), และไฟล์แนบสามหมวด
   ท้ายหน้า (ของพาริช/ของผู้ขาย/สำเนาคนขับ) ซึ่งยึดตามรถทั้งคัน ไม่ใช่แยกตาม
   สินค้า เพราะโดยงานจริงคือชุดเอกสารเดียวกันที่หน้าชั่งต่อรถหนึ่งคัน

   ไม่ต้องมี backend จริง — เก็บทุกอย่างใน state ของหน้านี้เท่านั้น
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

const round = MULTI_PRODUCT_DEMO_ROUND;

export default function MultiProductWeighingDemoPage() {
  const router = useRouter();

  const [phase, setPhase] = React.useState<"setup" | "weighing">("setup");
  const [count, setCount] = React.useState(1);

  const [checkpoints, setCheckpoints] = React.useState<WeighCheckpoint[]>([]);
  // แต่ละช่อง — undefined จนกว่าจะเลือกจากดรอปดาวตอนถึงจุดชั่งนั้นจริงๆ
  const [slots, setSlots] = React.useState<(TruckProduct | undefined)[]>([]);

  // จุดแรกที่ยังไม่ถูกบันทึก = ขั้นที่กำลังทำงานอยู่ตอนนี้ — ก่อนหน้านั้นคือ
  // "เสร็จแล้ว" หลังจากนั้นคือ "ล็อกไว้" ยังกรอกไม่ได้
  const activeSeq = checkpoints.findIndex((c) => c.ton == null);
  const allDone = phase === "weighing" && activeSeq === -1;
  // ยังไม่ได้บันทึกจุดชั่งเข้าเลย — แก้จำนวนสินค้าย้อนกลับได้อยู่
  const canEditCount = checkpoints[0]?.ton == null;

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

  function startWeighing() {
    setCheckpoints(Array.from({ length: count + 1 }, (_, i) => ({ seq: i })));
    setSlots(Array.from({ length: count }, () => undefined));
    setPhase("weighing");
  }

  function saveCheckpoint(seq: number, ton: number, at: string) {
    setCheckpoints((prev) =>
      prev.map((c) => (c.seq === seq ? { ...c, ton, at } : c))
    );
  }

  function saveSlot(
    index: number,
    product: TruckProduct,
    supplierTon: number,
    supplierSlipNo: string
  ) {
    setSlots((prev) =>
      prev.map((s, i) =>
        i === index
          ? { ...product, supplierTon, supplierSlipNo, parichSlipNo: parichSlipNo(round.receiptCode, index) }
          : s
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
              <BreadcrumbPage className="text-primary">ชั่งน้ำหนัก Ver 2</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <h1 className="mt-2 text-2xl font-semibold tracking-tight">ชั่งน้ำหนัก Ver 2</h1>
        <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
          รองรับรถหนึ่งคันขนหลายสินค้า (1-3 รายการ) — แยกไว้คนละหน้ากับระบบ
          ชั่งน้ำหนักเดิม เพราะยังไม่สรุปว่าจะใช้แบบไหน
        </p>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          {phase === "setup"
            ? "ระบุแค่จำนวนสินค้าที่รถคันนี้ขนมา ยังไม่ต้องรู้ว่าเป็นตัวไหน — ค่อยเลือกตอนถึงจุดชั่งนั้นจริงๆ"
            : "ลองกรอกได้จริงตั้งแต่จุดแรก — ถึงคิวไหนค่อยเลือกว่าตัวที่กำลังลงคือสินค้าตัวไหน กรอกจุดที่ N ได้ก็ต่อเมื่อจุดที่ N-1 บันทึกแล้วเท่านั้น"}
        </p>

        {/* ---------- หัวใบ: รถ + PO (คงที่ ไม่ให้แก้ในต้นแบบนี้) ---------- */}
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
        </div>

        {phase === "setup" ? (
          <SetupSection
            count={count}
            max={PO_LINE_ITEMS_POOL.length}
            onChangeCount={setCount}
            onStart={startWeighing}
          />
        ) : (
          <>
            <div className="mt-5 rounded-lg bg-brand p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">
                  รถคันนี้ขนมา {slots.length} รายการ — ลงแล้ว{" "}
                  {slots.filter((s) => s != null).length}/{slots.length}
                </p>
                {canEditCount && (
                  <button
                    type="button"
                    onClick={() => setPhase("setup")}
                    className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                  >
                    <ChevronLeftIcon className="size-3.5" />
                    แก้ไขจำนวนสินค้า
                  </button>
                )}
              </div>
              {slots.some((s) => s != null) && (
                <ol className="mt-2 flex flex-wrap gap-2">
                  {slots.map((s, i) =>
                    s ? (
                      <li
                        key={s.id}
                        className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-sm"
                      >
                        <span className="font-semibold text-primary">{i + 1}.</span>
                        <span className="font-medium">{s.productName}</span>
                        {s.productSub && (
                          <span className="text-muted-foreground">{s.productSub}</span>
                        )}
                      </li>
                    ) : null
                  )}
                </ol>
              )}
            </div>

            {/* ---------- ขั้นตอนการชั่ง ---------- */}
            <div className="mt-8 space-y-3">
              <h2 className="text-lg font-semibold">ขั้นตอนการชั่ง</h2>

              {/* จุดที่ 0 — ชั่งเข้ารถพร้อมสินค้าทั้งหมด ไม่ผูกกับสินค้าตัวใดตัวหนึ่ง */}
              <WeighStepCard
                state={activeSeq === -1 || activeSeq > 0 ? "done" : activeSeq === 0 ? "active" : "locked"}
                title={`ชั่งเข้า (รถ + สินค้าทั้งหมด ${slots.length} รายการ)`}
                checkpoint={checkpoints[0]}
                onSaveGross={(ton, at) => {
                  saveCheckpoint(0, ton, at);
                  toast.success("บันทึกชั่งเข้าแล้ว", {
                    description: `${round.plate} — ${formatTon(ton)} ตัน`,
                  });
                }}
              />

              {slots.map((slot, i) => {
                const seq = i + 1;
                const isLast = i === slots.length - 1;
                const state =
                  activeSeq === -1 || activeSeq > seq
                    ? "done"
                    : activeSeq === seq
                      ? "active"
                      : "locked";
                const prevTon = checkpoints[i]?.ton;
                // เลือกได้เฉพาะสินค้าที่ยังไม่ถูกเลือกไปแล้วในจุดอื่น
                const takenIds = new Set(
                  slots.filter((s, si) => si !== i && s).map((s) => s!.id)
                );
                const availableProducts = PO_LINE_ITEMS_POOL.filter(
                  (p) => !takenIds.has(p.id)
                );

                return (
                  <WeighStepCard
                    key={i}
                    state={state}
                    title={
                      isLast
                        ? `ลงสินค้าสุดท้าย (ชั่งเสร็จ = รถเปล่า)`
                        : `ลงสินค้าที่ ${seq}`
                    }
                    checkpoint={checkpoints[seq]}
                    prevTon={prevTon}
                    slot={slot}
                    availableProducts={availableProducts}
                    onSaveProduct={(product, ton, at, supplierTon, supplierSlipNo) => {
                      saveCheckpoint(seq, ton, at);
                      saveSlot(i, product, supplierTon, supplierSlipNo);
                      const net = prevTon != null ? Math.round((prevTon - ton) * 100) / 100 : null;
                      toast.success(`บันทึกน้ำหนัก ${product.productName} แล้ว`, {
                        description:
                          net != null
                            ? `เลขที่ใบชั่งพาริช ${parichSlipNo(round.receiptCode, i)} — สินค้าจริง ${formatTon(net)} ตัน`
                            : `เลขที่ใบชั่งพาริช ${parichSlipNo(round.receiptCode, i)}`,
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
                      {slots.filter((s): s is TruckProduct => s != null).length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={6}
                            className="py-6 text-center text-sm text-muted-foreground"
                          >
                            ยังไม่มีสินค้าที่ชั่งเสร็จ
                          </TableCell>
                        </TableRow>
                      ) : (
                        slots.map((s, i) => {
                          if (!s) return null;
                          const net = computeNet(checkpoints, i);
                          const diff =
                            net != null && s.supplierTon != null
                              ? Math.round((net - s.supplierTon) * 100) / 100
                              : null;
                          return (
                            <TableRow key={s.id}>
                              <TableCell className={COL_FIRST}>
                                <span className="block font-medium whitespace-nowrap">
                                  {s.productName}
                                  {s.productSub && ` ${s.productSub}`}
                                </span>
                              </TableCell>
                              <TableCell className="whitespace-nowrap">
                                {s.parichSlipNo ?? <span className="text-muted-foreground">-</span>}
                              </TableCell>
                              <TableCell className="whitespace-nowrap">
                                {s.supplierSlipNo || (
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
                                {s.supplierTon != null ? (
                                  formatTon(s.supplierTon)
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
                        })
                      )}
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
          </>
        )}
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

/** ตั้งค่าก่อนชั่ง — คีย์แค่จำนวนสินค้าที่รถคันนี้ขนมา ไม่ถามว่าเป็นตัวไหน/
    เรียงลำดับยังไง เพราะหน้างานจริงมักไม่รู้ล่วงหน้าว่าจะลงตัวไหนก่อน
    ค่อยเลือกตัวตอนถึงจุดชั่งนั้นจริงๆ (ดูดรอปดาวในแต่ละขั้นของ WeighStepCard) */
function SetupSection({
  count,
  max,
  onChangeCount,
  onStart,
}: {
  count: number;
  max: number;
  onChangeCount: (next: number) => void;
  onStart: () => void;
}) {
  const clamp = (n: number) => Math.min(max, Math.max(1, n));

  return (
    <div className="mt-5 max-w-sm rounded-xl border border-border bg-card p-4">
      <Label htmlFor="truck-count">จำนวนสินค้าในรถคันนี้</Label>
      <p className="mt-0.5 text-sm text-muted-foreground">
        ใบสั่งซื้อนี้มีทั้งหมด {max} รายการ — รถคันนี้ไม่จำเป็นต้องขนมาครบทุกตัว
      </p>
      <div className="mt-3">
        <InputGroup className="bg-card">
          <InputGroupAddon align="inline-start">
            <InputGroupButton
              size="icon-xs"
              aria-label="ลดจำนวน"
              onClick={() => onChangeCount(clamp(count - 1))}
            >
              <MinusIcon />
            </InputGroupButton>
          </InputGroupAddon>
          <InputGroupInput
            id="truck-count"
            readOnly
            value={count}
            className="text-center tabular-nums"
          />
          <InputGroupAddon align="inline-end">
            <InputGroupButton
              size="icon-xs"
              aria-label="เพิ่มจำนวน"
              onClick={() => onChangeCount(clamp(count + 1))}
            >
              <PlusIcon />
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      </div>

      <div className="mt-4 flex justify-end">
        <Button onClick={onStart}>เริ่มชั่ง</Button>
      </div>
    </div>
  );
}

/** เผื่อผลจากการคำนวณ (checkpoints ล่าสุดใน state) ไม่ตรงกันเอง — คำนวณสด
    จาก state ตรงๆ ทุกครั้งที่เรนเดอร์ ไม่พึ่งค่าที่ cache ไว้ */
function computeNet(checkpoints: WeighCheckpoint[], index: number): number | null {
  const a = checkpoints[index]?.ton;
  const b = checkpoints[index + 1]?.ton;
  if (a == null || b == null) return null;
  return Math.round((a - b) * 100) / 100;
}

/** การ์ดหนึ่งขั้นตอนการชั่ง — สามสถานะ: เสร็จแล้ว (เขียว, พับเก็บ)/กำลังทำ
    (ฟอร์มกรอกเปิดอยู่ มีดรอปดาวเลือกสินค้าด้วยถ้าเป็นขั้นที่ผูกกับสินค้า)/
    ล็อกไว้ (เทา, กรอกไม่ได้จนกว่าขั้นก่อนหน้าจะเสร็จ) */
function WeighStepCard({
  state,
  title,
  checkpoint,
  prevTon,
  slot,
  availableProducts,
  onSaveGross,
  onSaveProduct,
}: {
  state: "done" | "active" | "locked";
  title: string;
  checkpoint: WeighCheckpoint;
  /** น้ำหนักจุดก่อนหน้า — ใช้โชว์เป็นข้อมูลอ้างอิงตอนกรอก และคำนวณน้ำหนักสด */
  prevTon?: number;
  /** มีเฉพาะขั้นที่ผูกกับสินค้าตัวหนึ่ง (ไม่ใช่ขั้น "ชั่งเข้า" แรกสุด) —
      undefined จนกว่าจะเลือกจากดรอปดาวแล้วบันทึกสำเร็จ */
  slot?: TruckProduct;
  /** ตัวเลือกในดรอปดาว — เฉพาะขั้นที่ผูกกับสินค้า (ไม่ส่งมาก็แปลว่าไม่ใช่ขั้นนั้น) */
  availableProducts?: TruckProduct[];
  /** ขั้น "ชั่งเข้า" แรกสุด — ไม่ผูกกับสินค้า */
  onSaveGross?: (ton: number, at: string) => void;
  /** ขั้นที่ผูกกับสินค้าหนึ่งตัว — ต้องเลือกจากดรอปดาวก่อนถึงจะบันทึกได้ */
  onSaveProduct?: (
    product: TruckProduct,
    ton: number,
    at: string,
    supplierTon: number,
    supplierSlipNo: string
  ) => void;
}) {
  const [ton, setTon] = React.useState(0);
  const [at, setAt] = React.useState("11:00");
  const [supplierTon, setSupplierTon] = React.useState(0);
  const [supplierSlipNo, setSupplierSlipNo] = React.useState("");
  const [productId, setProductId] = React.useState<string | undefined>(undefined);

  const isProductStep = availableProducts !== undefined;
  const chosenProduct = availableProducts?.find((p) => p.id === productId);
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
            {slot
              ? `${title}: ${slot.productName}${slot.productSub ? ` ${slot.productSub}` : ""}`
              : title}
          </p>
          <p className="text-sm text-muted-foreground">
            {checkpoint.ton != null && formatTon(checkpoint.ton)} ตัน
            {checkpoint.at && ` · ${checkpoint.at}`}
          </p>
        </div>
        {slot && (
          <div className="mt-2 grid grid-cols-2 gap-3 pl-6 text-sm @lg:grid-cols-4">
            <MetaField label="น้ำหนักจริง" value={net != null ? `${formatTon(net)} ตัน` : "-"} />
            <MetaField
              label="ตามผู้ขาย"
              value={slot.supplierTon != null ? `${formatTon(slot.supplierTon)} ตัน` : "-"}
            />
            <MetaField label="เลขที่ใบชั่งพาริช" value={slot.parichSlipNo ?? "-"} />
            <MetaField label="เลขที่ใบชั่งผู้จำหน่าย" value={slot.supplierSlipNo || "-"} />
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

      {isProductStep && (
        <div className="mt-3 space-y-1.5">
          <Label htmlFor={`product-${title}`}>สินค้าที่กำลังลงตอนนี้</Label>
          <Select value={productId} onValueChange={setProductId}>
            <SelectTrigger id={`product-${title}`} className="w-full bg-card">
              <SelectValue placeholder="เลือกสินค้าที่ลง" />
            </SelectTrigger>
            <SelectContent>
              {(availableProducts ?? []).map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.productName}
                  {p.productSub && ` ${p.productSub}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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

      {isProductStep && (
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
          disabled={ton <= 0 || (isProductStep && !chosenProduct)}
          onClick={() => {
            if (isProductStep) {
              if (!chosenProduct) return;
              onSaveProduct?.(chosenProduct, ton, at, supplierTon, supplierSlipNo);
            } else {
              onSaveGross?.(ton, at);
            }
          }}
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
