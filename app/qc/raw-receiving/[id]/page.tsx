"use client";

import * as React from "react";
import { notFound, useRouter } from "next/navigation";
import { ChevronUpIcon } from "lucide-react";
import { Badge } from "@peckey954/ui/components/ui/badge";
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@peckey954/ui/components/ui/collapsible";
import { Label } from "@peckey954/ui/components/ui/label";
import { Textarea } from "@peckey954/ui/components/ui/textarea";
import { cn } from "@peckey954/ui/lib/utils";
import { toast } from "sonner";
import { RawItemCard } from "@/components/qc/raw-item-card";
import {
  DISPOSITIONS,
  DISPOSITION_LABEL,
  OUTCOME_CHIP,
  OUTCOME_LABEL,
  RAW_ITEMS,
  anyFail,
  findDoc,
  itemResult,
  outcomeOf,
  tonnage,
  type Disposition,
  type RawDoc,
} from "@/lib/qc-raw-receiving";

/* ------------------------------------------------------------------
   ใบตรวจรับวัตถุดิบหนึ่งใบ — หน้าเดียว สองโหมด

   ใบที่ยังไม่ตรวจ = ฟอร์มกรอก
   ใบที่ตรวจแล้ว  = อ่านอย่างเดียว ตัวเลขเป็นตัวหนังสือ ไม่มีปุ่มบันทึก

   ทำเป็นหน้าเดียวกันไม่ใช่สองหน้า เพราะเนื้อหาเหมือนกันทั้งใบ ต่างแค่แก้ได้หรือไม่ได้
   แยกสองหน้าแล้วต้องไล่แก้ทั้งสองที่ทุกครั้งที่ฟอร์มเปลี่ยน แล้ววันหนึ่งมันจะไม่ตรงกัน
   ที่สำคัญกว่านั้นคือใบที่ตรวจแล้วต้องอ่านได้เหมือนตอนกรอกเป๊ะ ๆ คนถึงจะเช็กย้อนได้

   ใบที่ตรวจแล้วล็อกไว้เลย ไม่มีปุ่มแก้ไข — ใบตรวจรับคือหลักฐานว่าของเข้าคลังด้วยเงื่อนไขอะไร
   แก้ย้อนหลังได้เมื่อไหร่ ยอดที่คลังรับไว้ก็เชื่อไม่ได้อีกต่อไป
------------------------------------------------------------------ */

const fmtTon = (v: number) =>
  v.toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export default function QcRawReceivingDocPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = React.use(params);
  const doc = findDoc(id);
  if (!doc) notFound();

  return <RawSheet key={doc.id} doc={doc} />;
}

function RawSheet({ doc }: { doc: RawDoc }) {
  const router = useRouter();
  const readOnly = doc.done;

  // ใบที่ตรวจแล้วเปิดมาพร้อมค่าที่บันทึกไว้ ใบใหม่เริ่มจากว่าง
  const [values, setValues] = React.useState<Record<string, string>>(
    () => doc.result?.values ?? {}
  );
  const [notes, setNotes] = React.useState<Record<string, string>>(
    () => doc.result?.notes ?? {}
  );
  const [disposition, setDisposition] = React.useState<Disposition | null>(
    () => doc.result?.disposition ?? null
  );
  const [note, setNote] = React.useState(() => doc.result?.note ?? "");
  const [openInfo, setOpenInfo] = React.useState(true);

  const hasFail = anyFail(values);
  // ยังไม่มีใครคีย์อะไรเลย ก็ยังบอกไม่ได้ว่าของจะเข้าคลังเท่าไหร่
  const started = RAW_ITEMS.some((i) => itemResult(i, values).pass !== null);
  const ton = started
    ? tonnage(doc.ton, hasFail, disposition)
    : { fail: null as number | null, warehouse: null as number | null };
  const pieces = doc.bagKg > 0 ? (doc.ton * 1000) / doc.bagKg : 0;
  const outcome = outcomeOf(doc);

  const save = () => {
    const unfinished = RAW_ITEMS.find((i) => itemResult(i, values).pass === null);
    if (unfinished) {
      toast.error("ยังกรอกไม่ครบ", {
        description: `ข้อ "${unfinished.title}" ยังไม่มีค่าพอให้ตัดสินผล`,
      });
      return;
    }
    if (hasFail && disposition === null) {
      toast.error("ยังไม่ได้เลือกประเภทการรับสินค้า", {
        description: "มีข้อที่ไม่ผ่าน ต้องระบุว่าจะทำยังไงกับของ",
      });
      return;
    }
    toast.success(`บันทึกใบตรวจสอบ ${doc.code} แล้ว`, {
      description:
        ton.warehouse === null
          ? undefined
          : `เข้าคลัง ${fmtTon(ton.warehouse)} ตัน`,
    });
    router.back();
  };

  return (
    <main className="@container mx-auto w-full max-w-6xl px-4 pt-6 pb-24 sm:px-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">หน้าหลัก</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/qc/raw-receiving">
              ตรวจรับวัตถุดิบ
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="text-primary">ใบตรวจสอบ</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <h1 className="mt-2 text-2xl font-semibold tracking-tight">
        ใบตรวจสอบรับวัตถุดิบ {doc.code}-01
      </h1>

      {/* ใบที่ตรวจแล้วบอกตั้งแต่ใต้หัวเรื่องว่าจบยังไง คนเปิดมาย้อนดูถามข้อนี้ก่อนเสมอ
          ใบที่ยังไม่ตรวจไม่มีบรรทัดนี้ เพราะยังไม่มีผลอะไรให้บอก */}
      {readOnly && (
        <p className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground tabular-nums">
          {doc.createdAt}
          {outcome && (
            <Badge
              appearance="soft"
              className={cn(
                "[--bdg-border:transparent] font-semibold",
                OUTCOME_CHIP[outcome]
              )}
            >
              {OUTCOME_LABEL[outcome]}
            </Badge>
          )}
        </p>
      )}

      {/* ---------- ของอะไร ยอดเท่าไหร่ ใครรับ ---------- */}
      <Collapsible
        open={openInfo}
        onOpenChange={setOpenInfo}
        className="mt-4 rounded-xl border border-border bg-card"
      >
        <CollapsibleTrigger className="flex w-full flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-4 pt-4 text-left">
          <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="font-semibold">
              {doc.product} {doc.productNote}
            </span>
            <span className="text-sm text-muted-foreground">วัตถุดิบ</span>
            <span className="text-border" aria-hidden>
              |
            </span>
            <span className="text-sm text-muted-foreground">{doc.packing}</span>
            <span className="text-border" aria-hidden>
              |
            </span>
            <span className="text-sm text-muted-foreground">{doc.bagSize}</span>
            <Badge tone="brand" appearance="soft">
              {doc.lot}
            </Badge>
          </p>
          <span className="flex items-center gap-3 text-sm">
            {doc.supplier}
            <ChevronUpIcon
              className={cn(
                "size-4 shrink-0 text-muted-foreground transition-transform",
                !openInfo && "rotate-180"
              )}
            />
          </span>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="p-4">
            {/* สี่ตัวเลขนี้คือผลของทั้งใบ ยอดเข้าคลังเปลี่ยนตามที่เลือกท้ายหน้า */}
            <div className="grid gap-4 rounded-lg bg-brand p-4 @2xl:grid-cols-4">
              <Stat label="ตรวจสอบ (ตัน)" value={fmtTon(doc.ton)} />
              <Stat
                label="ไม่ผ่าน (ตัน)"
                value={ton.fail === null ? "-" : fmtTon(ton.fail)}
                note={
                  ton.fail !== null && disposition
                    ? DISPOSITION_LABEL[disposition]
                    : undefined
                }
                danger={ton.fail !== null}
              />
              {/* ยอดต่อหนึ่งชิ้น ไม่ใช่ยอดหารจำนวนครั้งที่ตรวจ
                  ของเข้าคลังเป็นชิ้น คนเบิกของก็คิดเป็นชิ้น ตันเป็นหน่วยของใบสั่งซื้อ */}
              <Stat
                label="เข้าคลังเฉลี่ย (ตัน)"
                value={
                  ton.warehouse === null || pieces === 0
                    ? "-"
                    : `${(ton.warehouse / pieces).toFixed(2)} ตัน/ชิ้น`
                }
                note={
                  ton.warehouse === null || pieces === 0
                    ? undefined
                    : `${pieces.toLocaleString("th-TH")} ชิ้น`
                }
              />
              <Stat
                label="เข้าคลัง (ตัน)"
                value={ton.warehouse === null ? "-" : fmtTon(ton.warehouse)}
              />
            </div>

            <div className="mt-4 grid gap-4 @2xl:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">ผู้รับสินค้า</p>
                <p className="mt-0.5 font-semibold">{doc.receiver}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  ผู้แก้ไขรับสินค้าล่าสุด
                </p>
                <p className="mt-0.5 font-semibold">{doc.editor || "-"}</p>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* ---------- สามข้อที่ต้องตรวจ ---------- */}
      <div className="mt-6 rounded-xl border border-border bg-card p-4">
        <h2 className="text-lg font-semibold">การตรวจสอบ</h2>

        <div className="mt-4 space-y-3">
          {RAW_ITEMS.map((item, i) => (
            <RawItemCard
              key={item.id}
              item={item}
              index={i}
              values={values}
              note={notes[item.id] ?? ""}
              readOnly={readOnly}
              onPatchValue={(fieldId, v) =>
                setValues((prev) => ({ ...prev, [fieldId]: v }))
              }
              onNoteChange={(v) =>
                setNotes((prev) => ({ ...prev, [item.id]: v }))
              }
            />
          ))}
        </div>

        {/* ---------- ไม่ผ่านแล้วทำยังไงกับของ ----------
            ขึ้นเฉพาะตอนมีข้อที่ไม่ผ่านจริง ผ่านหมดแล้วไม่มีอะไรให้ตัดสิน
            การเลือกตรงนี้เปลี่ยนยอดเข้าคลังในกล่องข้างบนทันที */}
        {hasFail && (
          <div className="mt-6 grid gap-4 @2xl:grid-cols-2">
            <div>
              <Label>ประเภทการรับสินค้า กรณีไม่ผ่านข้อใดข้อหนึ่ง</Label>
              {readOnly ? (
                <p className="mt-2 font-semibold">
                  {disposition ? DISPOSITION_LABEL[disposition] : "-"}
                </p>
              ) : (
                <div className="mt-2 grid gap-3 @4xl:grid-cols-3">
                  {DISPOSITIONS.map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      role="radio"
                      aria-checked={disposition === d.id}
                      onClick={() => setDisposition(d.id)}
                      className={cn(
                        "flex min-h-11 items-center gap-3 rounded-lg border px-4 text-sm transition-colors",
                        disposition === d.id
                          ? "border-primary bg-brand font-medium text-primary"
                          : "border-border bg-card hover:bg-accent-hover"
                      )}
                    >
                      <span
                        className={cn(
                          "flex size-4 shrink-0 items-center justify-center rounded-full border",
                          disposition === d.id ? "border-current" : "border-border"
                        )}
                      >
                        {disposition === d.id && (
                          <span className="size-2 rounded-full bg-current" />
                        )}
                      </span>
                      {d.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <DocNote
              readOnly={readOnly}
              value={note}
              onChange={setNote}
              className="@2xl:mt-0"
            />
          </div>
        )}

        {/* ผ่านหมดก็ยังมีช่องหมายเหตุของทั้งใบ แค่ไม่ต้องมีคอลัมน์คู่กับตัวเลือก */}
        {!hasFail && (
          <DocNote
            readOnly={readOnly}
            value={note}
            onChange={setNote}
            className="mt-6"
          />
        )}
      </div>

      {/* ---------- แถบท้ายหน้า ---------- */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-8">
          <Button variant="outline-primary" onClick={() => router.back()}>
            ย้อนกลับ
          </Button>
          {/* ใบที่ตรวจแล้วไม่มีปุ่มบันทึก — ปุ่มที่กดแล้วไม่เกิดอะไรแย่กว่าไม่มีปุ่ม
              ร่างเก็บของที่กรอกค้างไว้โดยไม่ตรวจความครบ ใบตรวจกินเวลาข้ามกะได้
              บันทึกคือปิดงาน ต้องกรอกครบและเลือกวิธีจัดการของที่ไม่ผ่านแล้ว */}
          {!readOnly && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline-primary"
                onClick={() =>
                  toast.success(`บันทึกร่าง ${doc.code} แล้ว`, {
                    description: "กลับมากรอกต่อได้จากรายการรอตรวจวัตถุดิบ",
                  })
                }
              >
                บันทึกร่าง
              </Button>
              <Button className="w-28" onClick={save}>
                บันทึก
              </Button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

// ---------------------------------------------------------------

function DocNote({
  readOnly,
  value,
  onChange,
  className,
}: {
  readOnly: boolean;
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label htmlFor="doc-note">
        หมายเหตุ{" "}
        <span className="font-normal text-muted-foreground">(ไม่บังคับ)</span>
      </Label>
      {readOnly ? (
        <p className={cn("mt-2", value ? "font-semibold" : "text-muted-foreground")}>
          {value || "-"}
        </p>
      ) : (
        <Textarea
          id="doc-note"
          className="mt-2 bg-card"
          placeholder="ระบุหมายเหตุ"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  note,
  danger,
}: {
  label: string;
  value: string;
  note?: string;
  danger?: boolean;
}) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-lg font-semibold tabular-nums">
        <span className={cn(danger && "text-danger-strong")}>{value}</span>
        {note && (
          <span
            className={cn(
              "ml-2 text-sm font-normal",
              danger ? "text-danger-strong" : "text-muted-foreground"
            )}
          >
            {note}
          </span>
        )}
      </p>
    </div>
  );
}
