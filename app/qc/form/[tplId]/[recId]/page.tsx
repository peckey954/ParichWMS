"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ClockIcon, PencilIcon, Trash2Icon } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@peckey954/ui/components/ui/breadcrumb";
import { Button } from "@peckey954/ui/components/ui/button";
import { toast } from "sonner";
import { RecordView } from "@/components/qc/record-view";
import { TemplateForm, type FormValues } from "@/components/qc/template-form";
import { shiftLabel, templateOf } from "@/lib/qc-erp";
import {
  cancelRecord,
  docNo,
  isoDate,
  nowTime,
  recordAt,
  recordOf,
  saveRecord,
  slotAt,
  thaiDate,
  type QcRecord,
} from "@/lib/qc-records";

/* ------------------------------------------------------------------
   หนึ่งใบตรวจ — /new คือใบใหม่ อย่างอื่นคือเปิดใบที่ทำแล้ว

   ใบใหม่ไม่ให้เลือกรอบ อ่านจากเวลาที่เปิด ถ้ารอบนั้นของวันนี้ตรวจไปแล้ว
   พาไปใบเดิมแทน — หนึ่งรอบหนึ่งใบ ทำซ้ำคือแก้ใบเดิม ไม่ใช่ได้สองใบที่ขัดกัน

   เปิดใบเดิมแล้วแก้ได้ บันทึกแล้วชื่อคนแก้ล่าสุดขึ้นในตาราง
------------------------------------------------------------------ */

const ME = "อลิสา พรสุขสิริ";

/** ใบที่บันทึกไว้ → ค่าตั้งต้นของฟอร์ม ข้อที่ระบบตัดสินเองไม่มีค่าเก็บไว้ก็ว่างไว้ */
function valuesOf(r: QcRecord): FormValues {
  const rows: FormValues["rows"] = {};
  for (const [id, verdict] of Object.entries(r.results))
    rows[id] = {
      verdict,
      nums: r.values[id]?.nums ?? [],
      text: r.values[id]?.text ?? "",
      source: r.values[id]?.source ?? "",
      remark: r.values[id]?.remark ?? "",
    };
  return { header: r.header, rows, disposition: r.disposition, note: r.note };
}

export default function RecordPage() {
  const router = useRouter();
  const { tplId, recId } = useParams<{ tplId: string; recId: string }>();
  const tpl = templateOf(tplId);
  const isNew = recId === "new";

  // อ่านเวลาครั้งเดียวตอนเปิด — นั่งกรอกข้ามเวลาเปลี่ยนรอบ ใบยังเป็นของรอบที่เปิด
  const [opened] = React.useState(() => new Date());
  const today = isoDate(opened);
  const slots = tpl?.schedule.recurring ? tpl.schedule.slots : [];
  const slot = slotAt(slots, nowTime(opened));
  const done = isNew && tpl && slot ? recordAt(tpl.id, today, slot.id) : undefined;
  const rec = isNew ? undefined : recordOf(recId);
  const search = useSearchParams();
  const [editing, setEditing] = React.useState(search.get("edit") === "1");
  const [, bump] = React.useReducer((n: number) => n + 1, 0);

  const slotText = slot ? `ช่วงที่ ${slots.indexOf(slot) + 1} · ${shiftLabel(slot)}` : "";

  // รอบนี้ตรวจแล้ว — ไปใบเดิม
  React.useEffect(() => {
    if (!done || !tpl) return;
    toast.info(
      `${slotText} ตรวจไปแล้ว — เปิดใบเดิม`,
      {
        description: `${done.no} · ${done.time} · ${done.by}`,
      }
    );
    // ทำซ้ำในรอบเดิม = ตั้งใจแก้ใบเดิม เปิดเป็นฟอร์มเลย ไม่ต้องกดแก้ไขอีกที
    router.replace(`/qc/form/${tpl.id}/${done.id}?edit=1`);
  }, [done, tpl, slotText, router]);

  if (!tpl || (!isNew && !rec)) {
    return (
      <main className="mx-auto w-full max-w-lg px-4 py-20 text-center">
        <p className="font-medium">ไม่พบใบตรวจนี้</p>
        <Button asChild variant="outline-primary" className="mt-4">
          <Link href={tpl ? `/qc/form/${tpl.id}` : "/"}>ย้อนกลับ</Link>
        </Button>
      </main>
    );
  }
  if (done) return null;

  const slotIndex = slot ? slots.indexOf(slot) : 0;
  const no = rec?.no ?? docNo(today, Math.max(0, slotIndex));
  const shownSlot = rec ? slots.find((s) => s.id === rec.slotId) : slot;
  const shownIndex = shownSlot ? slots.indexOf(shownSlot) : -1;
  const back = () =>
    router.push(rec?.slotId ? `/qc/form/${tpl.id}/day/${rec.date}` : `/qc/form/${tpl.id}`);

  /* ใบที่ทำแล้วเปิดมาเป็นข้อความก่อน — แก้ไขต้องกดปุ่ม ยกเลิกใบไม่ได้ลบทิ้ง
     ใบยังอยู่ในแท็บยกเลิก และรอบนั้นกลับไปว่างให้ตรวจใหม่ได้ */
  if (rec && !editing) {
    return (
      <>
        <main className="@container mx-auto w-full max-w-6xl px-4 pt-6 pb-24 sm:px-6">
          <div className="flex items-start justify-between gap-3">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/">หน้าหลัก</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href={`/qc/form/${tpl.id}`}>{tpl.name}</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-primary">ใบ{tpl.name}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            {!rec.cancelled && (
              <Button
                variant="outline"
                size="icon"
                aria-label="ยกเลิกใบตรวจนี้"
                title="ยกเลิกใบตรวจนี้"
                className="shrink-0 bg-card"
                onClick={() => {
                  cancelRecord(rec.id);
                  toast.success(`ยกเลิก ${rec.no} แล้ว`, {
                    description: "ดูได้ในแท็บรายการ › ยกเลิก รอบนี้ตรวจใหม่ได้",
                  });
                  bump();
                }}
              >
                <Trash2Icon />
              </Button>
            )}
          </div>
          {rec.cancelled && (
            <p className="mt-3 rounded-lg border border-danger-border bg-danger px-4 py-2 text-sm text-danger-strong">
              ใบนี้ถูกยกเลิกแล้ว
            </p>
          )}
          <div className="mt-4">
            <RecordView tpl={tpl} rec={rec} />
          </div>
        </main>
        <div className="sticky bottom-0 z-30 border-t border-border bg-surface">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <Button variant="outline-primary" onClick={back}>
              ย้อนกลับ
            </Button>
            {!rec.cancelled && (
              <Button variant="outline-primary" onClick={() => setEditing(true)}>
                <PencilIcon />
                แก้ไข
              </Button>
            )}
          </div>
        </div>
      </>
    );
  }

  return (
    <main className="@container mx-auto w-full max-w-6xl px-4 pt-6 sm:px-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">หน้าหลัก</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href={`/qc/form/${tpl.id}`}>{tpl.name}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="text-primary">{no}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mt-5">
        <TemplateForm
          key={rec?.id ?? "new"}
          tpl={tpl}
          title={`ใบ${tpl.name} ${no}`}
          initial={rec ? valuesOf(rec) : undefined}
          before={
            shownSlot && (
              <p className="mt-2 flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground">
                <ClockIcon className="size-4" />
                <span>
                  ช่วงที่ {shownIndex + 1} · {shiftLabel(shownSlot)}
                </span>
                <span>
                  {rec
                    ? `· ตรวจเมื่อ ${thaiDate(rec.date)} ${rec.time} โดย ${rec.by}`
                    : "· อ่านจากเวลาที่เปิดใบ"}
                </span>
              </p>
            )
          }
          onBack={() => (rec ? setEditing(false) : router.push(`/qc/form/${tpl.id}`))}
          onSubmit={({ values, verdicts, failed }) => {
            const saved = saveRecord({
              id: rec?.id,
              tplId: tpl.id,
              no,
              date: rec?.date ?? today,
              time: rec?.time ?? nowTime(opened),
              slotId: rec?.slotId ?? slot?.id ?? "",
              header: values.header,
              results: verdicts,
              values: values.rows,
              disposition: values.disposition,
              note: values.note,
              by: rec?.by ?? ME,
              editor: rec ? ME : undefined,
              status: failed ? "fail" : "pass",
              cancelled: rec?.cancelled ?? false,
            });
            toast.success(rec ? `แก้ไข ${saved.no} แล้ว` : `บันทึก ${saved.no} แล้ว`, {
              description: "ตัวอย่าง ยังไม่ได้ต่อหลังบ้าน — รีเฟรชแล้วกลับเป็นค่าตั้งต้น",
            });
            // แก้ใบเดิมแล้วกลับไปหน้าดูใบนั้น ใบใหม่กลับไปหน้ารายการของรายงาน
            if (rec) setEditing(false);
            else router.push(`/qc/form/${tpl.id}`);
          }}
        />
      </div>
    </main>
  );
}
