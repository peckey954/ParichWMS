"use client";

import * as React from "react";
import { notFound, useRouter } from "next/navigation";
import { CheckIcon, ClockIcon, XIcon } from "lucide-react";
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
import { Input } from "@peckey954/ui/components/ui/input";
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
import {
  MATERIALS,
  SHIFTS,
  SHIFT_LABEL,
  TANKS,
  TODAY,
  answerOf,
  findSheet,
  newSheet,
  sheetStatus,
  type CheckSheet,
  type MaterialAnswer,
  type MaterialResult,
  type Shift,
} from "@/lib/qc-check";

/* ------------------------------------------------------------------
   ใบตรวจวัตถุดิบในถังหนึ่งใบ

   วันที่กับกะเป็นของที่คนกรอกเลือกเอง ไม่ใช่อนุมานจากเวลาที่กดบันทึก
   กะกลางคืนกดบันทึกตอนตีหนึ่งแล้วใบไปตกวันถัดไป ปฏิทินจะขึ้นว่าเมื่อวานขาด
   ทั้งที่ทำแล้ว ส่วน "บันทึกเมื่อ" ระบบประทับให้เองและแก้ไม่ได้
   สองค่านี้ต่างกัน และความต่างคือสิ่งที่บอกว่าใบไหนกรอกย้อนหลัง

   ทุกรายการวางโครงเดียวกัน ชื่อวัตถุดิบได้บรรทัดของตัวเองเต็มความกว้าง
   แถวล่างเป็นสองคอลัมน์เสมอ ผลการตรวจสอบกับหมายเหตุ
   ปุ่มจึงอยู่ตำแหน่งเดียวกันทุกรายการ และเป็นโครงเดียวกับใบตรวจรับสินค้า
------------------------------------------------------------------ */

export default function MaterialSheetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = React.use(params);

  // เส้นทาง new = เปิดใบใหม่ ยังไม่มีในข้อมูล
  const existing = id === "new" ? null : findSheet(id);
  if (id !== "new" && !existing) notFound();

  return (
    <SheetEditor
      key={id}
      initial={existing ?? newSheet("new", TODAY, "morning")}
      isNew={id === "new"}
    />
  );
}

function SheetEditor({
  initial,
  isNew,
}: {
  initial: CheckSheet;
  isNew: boolean;
}) {
  const router = useRouter();
  const [sheet, setSheet] = React.useState<CheckSheet>(initial);

  const patch = (p: Partial<CheckSheet>) => setSheet((s) => ({ ...s, ...p }));
  const patchAnswer = (material: string, p: Partial<MaterialAnswer>) =>
    setSheet((s) => ({
      ...s,
      answers: {
        ...s.answers,
        [material]: { ...answerOf(s, material), ...p },
      },
    }));

  const st = sheetStatus(sheet);

  const save = () => {
    if (!sheet.tank) {
      toast.error("ยังไม่ได้เลือกถังวัตถุดิบ");
      return;
    }
    if (st.done < st.total) {
      toast.error(`ยังตรวจไม่ครบ เหลืออีก ${st.total - st.done} รายการ`, {
        description: "ต้องเลือกปกติหรือผิดปกติให้ครบทุกรายการก่อนบันทึก",
      });
      return;
    }
    // ระบบประทับเวลาให้ตอนกดบันทึก ไม่ใช่ให้คนพิมพ์เอง
    const stamp = `${TODAY} ${new Date().toTimeString().slice(0, 5)}`;
    patch({ savedAt: stamp });
    toast.success(`บันทึกใบตรวจ ${sheet.code} แล้ว`, {
      description: `${sheet.date} กะ${SHIFT_LABEL[sheet.shift]} · ประทับเวลา ${stamp}`,
    });
    router.push("/qc/checks/material");
  };

  return (
    <main className="@container mx-auto w-full max-w-5xl px-4 pt-6 pb-24 sm:px-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/qc/checks">QC ตรวจสอบ</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/qc/checks/material">
              ตรวจวัตถุดิบในถัง
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="text-primary">ใบตรวจสอบ</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          ใบตรวจสอบวัตถุดิบ {sheet.code}
        </h1>
        {/* ประทับเวลาขึ้นหลังบันทึกเท่านั้น ใบที่ยังไม่บันทึกจึงบอกได้ว่ายังเป็นร่าง */}
        {sheet.savedAt ? (
          <Badge tone="neutral" appearance="soft">
            <ClockIcon />
            บันทึกเมื่อ {sheet.savedAt}
          </Badge>
        ) : (
          <Badge tone="warning" appearance="soft">
            ยังไม่บันทึก
          </Badge>
        )}
      </div>

      {/* ---------- ใบนี้เป็นของวันไหน กะไหน ถังไหน ---------- */}
      <div className="mt-4 grid gap-4 @2xl:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="sheet-date">วันที่ตรวจ</Label>
          <Input
            id="sheet-date"
            type="date"
            className="bg-card tabular-nums"
            value={sheet.date}
            onChange={(e) => patch({ date: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sheet-shift">กะ</Label>
          <Select
            value={sheet.shift}
            onValueChange={(v) => patch({ shift: v as Shift })}
          >
            <SelectTrigger id="sheet-shift" className="w-full bg-card">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SHIFTS.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  กะ{s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="sheet-tank">ถังวัตถุดิบ</Label>
          <Select value={sheet.tank} onValueChange={(tank) => patch({ tank })}>
            <SelectTrigger id="sheet-tank" className="w-full bg-card">
              <SelectValue placeholder="เลือกถังวัตถุดิบ" />
            </SelectTrigger>
            <SelectContent>
              {TANKS.map((t) => (
                <SelectItem key={t} value={t}>
                  ถังวัตถุดิบ {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">การตรวจสอบ</h2>
        <span className="text-sm text-muted-foreground">
          ตรวจแล้ว {st.done}/{st.total} รายการ
          {st.abnormal > 0 && ` · ผิดปกติ ${st.abnormal}`}
        </span>
      </div>

      <div className="mt-4 space-y-3">
        {MATERIALS.map((mat) => (
          <MaterialRow
            key={mat}
            material={mat}
            answer={answerOf(sheet, mat)}
            onPatch={(p) => patchAnswer(mat, p)}
          />
        ))}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Button variant="outline" onClick={() => router.back()}>
            ย้อนกลับ
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant="outline-primary"
              onClick={() =>
                toast.success(`บันทึกร่าง ${sheet.code} แล้ว`, {
                  description: "ยังไม่ประทับเวลา ใบนี้ยังไม่นับว่าตรวจแล้ว",
                })
              }
            >
              บันทึกร่าง
            </Button>
            <Button className="w-28" onClick={save}>
              {isNew ? "บันทึก" : "บันทึกการแก้ไข"}
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}

// ---------------------------------------------------------------

function MaterialRow({
  material,
  answer,
  onPatch,
}: {
  material: string;
  answer: MaterialAnswer;
  onPatch: (p: Partial<MaterialAnswer>) => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      {/* ชื่อวัตถุดิบได้บรรทัดของตัวเองเต็มความกว้าง ไม่ต้องแย่งที่กับปุ่ม
          แถวล่างเป็นสองคอลัมน์เสมอ ผลการตรวจสอบกับหมายเหตุ
          ปุ่มจึงอยู่ตำแหน่งเดียวกันทุกรายการ กวาดตาลงมาเป็นแนวตรง
          และเป็นโครงเดียวกับใบตรวจรับสินค้า ทั้งระบบวางเหมือนกัน */}
      <p className="font-semibold">
        {material}{" "}
        <span className="font-normal text-muted-foreground">(KG)</span>
      </p>

      <div className="mt-3 grid gap-3 @2xl:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-sm font-normal">ผลการตรวจสอบ</Label>
          <div
            role="radiogroup"
            aria-label={`ผลการตรวจสอบ ${material}`}
            className="grid grid-cols-2 gap-3"
          >
            <Choice
              id={`${material}-normal`}
              label="ปกติ"
              on={answer.result === "normal"}
              tone="normal"
              onClick={() => onPatch({ result: "normal" })}
            />
            <Choice
              id={`${material}-abnormal`}
              label="ผิดปกติ"
              on={answer.result === "abnormal"}
              tone="abnormal"
              onClick={() => onPatch({ result: "abnormal" })}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={`${material}-note`} className="text-sm font-normal">
            หมายเหตุ{" "}
            <span className="text-muted-foreground">
              ({answer.result === "abnormal" ? "บังคับ" : "ไม่บังคับ"})
            </span>
          </Label>
          <Input
            id={`${material}-note`}
            className={cn(
              "h-11 bg-card",
              answer.result === "abnormal" &&
                answer.note.trim() === "" &&
                "border-destructive"
            )}
            placeholder={
              answer.result === "abnormal"
                ? "ระบุว่าผิดปกติยังไง"
                : "ระบุหมายเหตุ"
            }
            value={answer.note}
            onChange={(e) => onPatch({ note: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * ปุ่มปกติ/ผิดปกติ — เขียวกับแดง มีไอคอนกำกับสำหรับคนที่แยกสีไม่ออก
 * สีขึ้นเฉพาะปุ่มที่ถูกเลือก ยังไม่เลือกก็เป็นปุ่มเปล่าทั้งคู่
 */
function Choice({
  id,
  label,
  on,
  tone,
  onClick,
}: {
  id: string;
  label: string;
  on: boolean;
  tone: MaterialResult;
  onClick: () => void;
}) {
  const Icon = tone === "normal" ? CheckIcon : XIcon;
  return (
    <button
      id={id}
      type="button"
      role="radio"
      aria-checked={on}
      onClick={onClick}
      className={cn(
        "flex h-11 items-center justify-center gap-2 rounded-md border px-3",
        "text-sm transition-colors",
        "focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
        on &&
          tone === "normal" &&
          "border-success-border bg-success font-medium text-success-foreground",
        on &&
          tone === "abnormal" &&
          "border-danger-border bg-danger font-medium text-danger-foreground",
        !on && "border-border text-foreground hover:bg-accent-hover"
      )}
    >
      <Icon className={cn("size-4", !on && "opacity-40")} />
      {label}
    </button>
  );
}
