"use client";

import * as React from "react";
import { Badge } from "@peckey954/ui/components/ui/badge";
import { Button } from "@peckey954/ui/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@peckey954/ui/components/ui/dialog";
import { Input } from "@peckey954/ui/components/ui/input";
import { Label } from "@peckey954/ui/components/ui/label";
import { cn } from "@peckey954/ui/lib/utils";
import { TimeField } from "@/components/time-field";
import {
  answerOf,
  computedOf,
  editableIn,
  noteMissing,
  verdictOf,
  type Answer,
  type Round,
} from "@/lib/qc-inspect";
import { VERDICT_WORDS, showsTick, type QcItem } from "@/lib/qc-template";

/* ------------------------------------------------------------------
   กล่องกรอกผลตรวจของหนึ่งครั้ง

   เป็นกล่องกลางจอ ไม่ใช่การ์ดกางในหน้า เพราะการกรอกหนึ่งรอบคืองานที่ทำรวดเดียวจบ
   ผู้ตรวจเดินไปที่กองของ ไล่ตรวจครบทุกข้อ แล้วปิดกล่อง
   ระหว่างนั้นไม่ต้องเห็นรอบอื่นหรือส่วนอื่นของใบ

   ปุ่มผ่าน/ไม่ผ่านเป็นสีเขียวกับแดง ไม่ใช่วงกลมติ๊กสองอันที่หน้าตาเหมือนกัน
   ใบหนึ่งมีแปดข้อ กวาดตาลงมาต้องเห็นทันทีว่าข้อไหนแดง โดยไม่ต้องอ่านตัวหนังสือ
   สีอยู่บนปุ่มที่ถูกเลือกเท่านั้น ยังไม่ได้เลือกก็ยังเป็นปุ่มเปล่า ไม่ได้เขียวไว้ก่อน
------------------------------------------------------------------ */

export function RoundDialog({
  open,
  onOpenChange,
  items,
  round,
  index,
  firstRound,
  ton,
  product,
  supplier,
  packing,
  lot,
  onPatchRound,
  onPatchAnswer,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  items: QcItem[];
  round: Round;
  index: number;
  firstRound: Round;
  ton: number;
  product: string;
  supplier: string;
  packing: string;
  lot: string;
  onPatchRound: (p: Partial<Round>) => void;
  onPatchAnswer: (itemId: string, p: Partial<Answer>) => void;
  onSave: () => void;
}) {
  const mine = items.filter((i) => editableIn(i, index));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* ปุ่มกากบาทของ DS ใช้ focus: ซึ่งติดตอนคลิกเมาส์ด้วย
          ปิดวงแหวนของ focus แล้วคืนให้เฉพาะ focus-visible ซึ่งขึ้นเฉพาะตอนกด Tab */}
      <DialogContent
        aria-describedby={undefined}
        className="@container flex max-h-[90svh] flex-col gap-0 overflow-hidden! p-0 sm:max-w-3xl [&_[data-slot=dialog-close]]:focus:ring-0 [&_[data-slot=dialog-close]]:focus:ring-offset-0 [&_[data-slot=dialog-close]]:focus-visible:ring-2 [&_[data-slot=dialog-close]]:focus-visible:ring-ring [&_[data-slot=dialog-close]]:focus-visible:ring-offset-2"
      >
        <DialogHeader className="px-4 pt-4 text-left">
          <DialogTitle className="pr-8">ตรวจครั้งที่ {index + 1}</DialogTitle>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
          {/* ---- ของอะไร ยอดเท่าไหร่ ---- */}
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="font-semibold">{product}</span>
                <span className="text-sm text-muted-foreground">วัตถุดิบ</span>
                <span className="text-border" aria-hidden>
                  |
                </span>
                <span className="text-sm text-muted-foreground">{packing}</span>
                <Badge tone="brand" appearance="soft">
                  {lot}
                </Badge>
              </p>
              <p className="text-sm">{supplier}</p>
            </div>
            <p className="mt-3 rounded-md bg-brand px-4 py-3 text-sm">
              ตรวจสอบ (ตัน):{" "}
              <span className="font-semibold tabular-nums">
                {ton.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
              </span>
            </p>
          </div>

          {/* ---- เวลากับผู้ตรวจของรอบนี้ ค่าเดียวใช้ทั้งรอบ ---- */}
          <div className="grid gap-4 @2xl:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={`${round.id}-time`}>เวลาตรวจสอบ</Label>
              <TimeField
                id={`${round.id}-time`}
                value={round.time}
                onValueChange={(time) => onPatchRound({ time })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${round.id}-date`}>วันที่ตรวจ</Label>
              <Input
                id={`${round.id}-date`}
                type="date"
                className="bg-card tabular-nums"
                value={round.date}
                onChange={(e) => onPatchRound({ date: e.target.value })}
              />
            </div>
          </div>

          {mine.map((item) => (
            <ItemBlock
              key={item.id}
              item={item}
              index={items.indexOf(item)}
              answer={answerOf(round, item.id)}
              onPatch={(p) => onPatchAnswer(item.id, p)}
            />
          ))}

          {/* ข้อที่ตรวจครั้งเดียวและตอบไปแล้ว ยังโชว์อยู่แต่แก้ไม่ได้ */}
          {index > 0 &&
            items
              .filter((i) => !editableIn(i, index))
              .map((item) => {
                const a = answerOf(firstRound, item.id);
                const v = verdictOf(item, a);
                const [pass, fail] = VERDICT_WORDS[item.verdictWording];
                return (
                  <div
                    key={item.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dashed border-border px-4 py-3"
                  >
                    <span className="text-sm text-muted-foreground">
                      {items.indexOf(item) + 1}. {item.title} — ตรวจครั้งเดียว
                    </span>
                    {v === null ? (
                      <span className="text-sm text-muted-foreground">
                        ยังไม่ได้ตรวจ
                      </span>
                    ) : (
                      <Badge
                        tone={v ? "success" : "danger"}
                        appearance="soft"
                      >
                        {v ? pass : fail}
                      </Badge>
                    )}
                  </div>
                );
              })}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-border px-4 py-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            ย้อนกลับ
          </Button>
          <Button className="w-32" onClick={onSave}>
            บันทึก
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------

function ItemBlock({
  item,
  index,
  answer,
  onPatch,
}: {
  item: QcItem;
  index: number;
  answer: Answer;
  onPatch: (p: Partial<Answer>) => void;
}) {
  const [pass, fail] = VERDICT_WORDS[item.verdictWording];
  const computed = computedOf(item, answer);
  const needNote = noteMissing(item, answer);

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      {/* ชื่อกับเกณฑ์อยู่บรรทัดเดียวกัน เกณฑ์เป็นคำอธิบายของชื่อ ไม่ใช่หัวข้อของตัวเอง
          ปุ่มผ่าน/ไม่ผ่านอยู่ขวาสุด ตำแหน่งเดียวกันทุกข้อ กวาดตาลงมาเป็นแนวตรง */}
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <p className="min-w-0 flex-1">
          <span className="font-semibold">
            {index + 1}. {item.title}
          </span>
          {item.criteria && (
            <span className="ml-2 text-sm text-muted-foreground">
              เกณฑ์: {item.criteria}
            </span>
          )}
        </p>

        {showsTick(item) && (
          <div className="flex shrink-0 items-center gap-2">
            <span className="text-sm text-muted-foreground">ผลตรวจสอบ:</span>
            <PassFail
              id={item.id}
              words={[pass, fail]}
              value={answer.pass}
              onChange={(v) => onPatch({ pass: v })}
            />
          </div>
        )}
      </div>

      <div className="mt-3 grid gap-4 @2xl:grid-cols-2">
        {item.fields.map((f) => (
          <div key={f.id} className="space-y-2">
            <Label htmlFor={f.id} className="text-sm font-normal">
              {f.label}
              {f.unit && (
                <span className="text-muted-foreground"> ({f.unit})</span>
              )}
            </Label>
            <Input
              id={f.id}
              type={f.type === "number" ? "number" : "text"}
              inputMode={f.type === "number" ? "decimal" : undefined}
              className={cn(
                "bg-card",
                f.type === "number" && "text-right tabular-nums"
              )}
              placeholder={f.type === "number" ? "0.00" : "—"}
              value={answer.values[f.id] ?? ""}
              onChange={(e) =>
                onPatch({ values: { ...answer.values, [f.id]: e.target.value } })
              }
            />
            {/* ผลที่คำนวณจากเกณฑ์ขึ้นเป็นตัวช่วย ไม่ได้ติ๊กให้ ผู้ตรวจยังตัดสินเอง */}
            {computed !== null && f === item.fields[0] && (
              <p className="text-sm text-muted-foreground">
                ตามเกณฑ์: {computed ? pass : fail}
              </p>
            )}
          </div>
        ))}

        {item.note !== "off" && (
          <div className="space-y-2 @2xl:col-span-2">
            <Label htmlFor={`${item.id}-note`} className="text-sm font-normal">
              หมายเหตุ{" "}
              <span className="text-muted-foreground">
                (
                {item.note === "always"
                  ? "บังคับ"
                  : item.note === "onFail"
                    ? `บังคับเมื่อ${fail}`
                    : "ไม่บังคับ"}
                )
              </span>
            </Label>
            <Input
              id={`${item.id}-note`}
              className={cn("bg-card", needNote && "border-destructive")}
              placeholder={needNote ? `ระบุเหตุผลที่${fail}` : "—"}
              value={answer.note}
              onChange={(e) => onPatch({ note: e.target.value })}
            />
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * ปุ่มผ่าน/ไม่ผ่าน — เขียวกับแดง
 *
 * ไม่ได้ใช้ radio สองวงที่หน้าตาเหมือนกัน เพราะใบหนึ่งมีแปดข้อ
 * กวาดตาลงมาต้องเห็นทันทีว่าข้อไหนแดงโดยไม่ต้องอ่านตัวหนังสือทีละบรรทัด
 * สีขึ้นเฉพาะปุ่มที่ถูกเลือก ยังไม่ได้เลือกก็เป็นปุ่มเปล่าทั้งคู่
 * ไม่ใช่เขียวไว้ก่อนแล้วค่อยเปลี่ยน ซึ่งอ่านว่า "ผ่านแล้ว" ทั้งที่ยังไม่มีใครตรวจ
 */
function PassFail({
  id,
  words,
  value,
  onChange,
}: {
  id: string;
  words: [string, string];
  value: boolean | null;
  onChange: (v: boolean) => void;
}) {
  return (
    <div role="radiogroup" aria-label="ผลตรวจสอบ" className="flex gap-2">
      <Choice
        id={`${id}-pass`}
        label={words[0]}
        on={value === true}
        tone="pass"
        onClick={() => onChange(true)}
      />
      <Choice
        id={`${id}-fail`}
        label={words[1]}
        on={value === false}
        tone="fail"
        onClick={() => onChange(false)}
      />
    </div>
  );
}

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
  tone: "pass" | "fail";
  onClick: () => void;
}) {
  return (
    <button
      id={id}
      type="button"
      role="radio"
      aria-checked={on}
      onClick={onClick}
      className={cn(
        "flex min-h-9 items-center gap-2 rounded-md border px-3",
        "text-sm whitespace-nowrap transition-colors",
        "focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
        on && tone === "pass" && "border-success-border bg-success font-medium text-success-foreground",
        on && tone === "fail" && "border-danger-border bg-danger font-medium text-danger-foreground",
        !on && "border-border text-foreground hover:bg-accent-hover"
      )}
    >
      {/* วงกลมเล็กบอกว่าเลือกอยู่หรือยัง สำหรับคนที่แยกสีไม่ออก
          สีเป็นตัวช่วยกวาดตา ไม่ใช่ตัวเดียวที่บอกสถานะ */}
      <span
        className={cn(
          "flex size-4 shrink-0 items-center justify-center rounded-full border",
          on ? "border-current" : "border-border"
        )}
      >
        {on && <span className="size-2 rounded-full bg-current" />}
      </span>
      {label}
    </button>
  );
}
