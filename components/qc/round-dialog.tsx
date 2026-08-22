"use client";

import * as React from "react";
import { CheckIcon, ChevronDownIcon, XIcon } from "lucide-react";
import { Badge } from "@peckey954/ui/components/ui/badge";
import { Button } from "@peckey954/ui/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@peckey954/ui/components/ui/collapsible";
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
  verdictOf,
  type Answer,
  type Round,
} from "@/lib/qc-inspect";
import { VERDICT_WORDS, showsTick, type QcItem } from "@/lib/qc-template";

/* ------------------------------------------------------------------
   กล่องกรอกผลตรวจของหนึ่งครั้ง

   บนมือถือเป็นแผ่นเต็มจอ ไม่ใช่กล่องลอยกลางจอ
   กล่อง 358px ในจอ 390px คือเสียขอบข้างเปล่า ๆ แล้วยังได้พื้นที่เลื่อนซ้อนกันสองชั้น
   ตอนกรอกอยู่ไม่มีเหตุผลต้องเห็นหน้าข้างหลัง บนเดสก์ท็อปยังเป็นกล่องกลางจอเหมือนเดิม

   วางในแนวตั้งล้วน ชื่อหัวข้อ เกณฑ์ ช่องกรอก แล้วปุ่มผ่าน/ไม่ผ่าน
   ของเดิมเอาชื่อไปแย่งที่กับปุ่มในแถวเดียวกัน ปุ่มกว้างคงที่ 160px
   เหลือให้ชื่อ 60px บนมือถือ ชื่อเลยแตกเป็นบรรทัดละคำ

   สามอย่างที่ตัดความสูงลงได้มากที่สุด
     ช่องหมายเหตุโผล่เฉพาะตอนกดไม่ผ่าน — เจ็ดในแปดข้อไม่ได้ใช้
     ข้อที่ติ๊กอย่างเดียวไม่มีบล็อกช่องกรอก — ห้าในแปดข้อ
     ข้อมูลสินค้าหุบไว้ เป็นบริบท ไม่ใช่สิ่งที่ต้องกรอก
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

  // ใบมีแปดข้อ เลื่อนไปกลางทางแล้วต้องรู้ว่าเหลืออีกกี่ข้อ
  // โดยไม่ต้องเลื่อนกลับขึ้นไปนับเอง
  let pass = 0;
  let fail = 0;
  for (const i of mine) {
    const v = verdictOf(i, answerOf(round, i.id));
    if (v === true) pass += 1;
    if (v === false) fail += 1;
  }
  const left = mine.length - pass - fail;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* จอเล็กเต็มจอ จอใหญ่กล่องกลางจอ — ทับค่าที่ DS ตั้งไว้เฉพาะช่วง max-sm
          ปุ่มกากบาทของ DS ใช้ focus: ซึ่งติดตอนคลิกเมาส์ด้วย ปิดวงแหวนนั้นแล้ว
          คืนให้เฉพาะ focus-visible ซึ่งขึ้นเฉพาะตอนกด Tab */}
      <DialogContent
        aria-describedby={undefined}
        className={cn(
          "flex flex-col gap-0 overflow-hidden! p-0",
          "max-h-[90svh] sm:max-w-2xl",
          "max-sm:top-0 max-sm:left-0 max-sm:h-svh max-sm:max-h-svh max-sm:w-screen",
          "max-sm:max-w-none max-sm:translate-x-0 max-sm:translate-y-0",
          "max-sm:rounded-none max-sm:border-0",
          "[&_[data-slot=dialog-close]]:focus:ring-0 [&_[data-slot=dialog-close]]:focus:ring-offset-0",
          "[&_[data-slot=dialog-close]]:focus-visible:ring-2 [&_[data-slot=dialog-close]]:focus-visible:ring-ring"
        )}
      >
        {/* ---- หัวติดบน: ครั้งที่เท่าไหร่ + ความคืบหน้า ---- */}
        <DialogHeader className="border-b border-border px-4 pt-4 pb-3 text-left">
          <DialogTitle className="pr-8">ตรวจครั้งที่ {index + 1}</DialogTitle>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge tone="success" appearance="soft">
              <CheckIcon />
              ผ่าน {pass}
            </Badge>
            <Badge tone="danger" appearance="soft">
              <XIcon />
              ไม่ผ่าน {fail}
            </Badge>
            <span className="text-sm text-muted-foreground">
              เหลืออีก {left} ข้อ
            </span>
          </div>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
          {/* ---- เวลากับวันที่ของรอบนี้ ค่าเดียวใช้ทั้งรอบ ---- */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor={`${round.id}-time`} className="text-sm">
                เวลาตรวจสอบ
              </Label>
              <TimeField
                id={`${round.id}-time`}
                value={round.time}
                onValueChange={(time) => onPatchRound({ time })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`${round.id}-date`} className="text-sm">
                วันที่ตรวจ
              </Label>
              <Input
                id={`${round.id}-date`}
                type="date"
                className="h-10 bg-card tabular-nums"
                value={round.date}
                onChange={(e) => onPatchRound({ date: e.target.value })}
              />
            </div>
          </div>

          {/* ---- ของอะไร ยอดเท่าไหร่ — หุบไว้ เป็นบริบท ไม่ใช่สิ่งที่ต้องกรอก ---- */}
          <Collapsible className="rounded-lg border border-border bg-card">
            <CollapsibleTrigger className="flex w-full items-center gap-2 px-4 py-3 text-left transition-colors hover:bg-accent-hover">
              <span className="min-w-0 flex-1 truncate text-sm">
                <span className="font-medium">{product}</span>
                <span className="text-muted-foreground">
                  {" "}
                  · {ton.toLocaleString("th-TH", { minimumFractionDigits: 2 })}{" "}
                  ตัน
                </span>
              </span>
              <Badge tone="brand" appearance="soft">
                {lot}
              </Badge>
              <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground" />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="space-y-1 border-t border-border px-4 py-3 text-sm">
                <p className="text-muted-foreground">
                  วัตถุดิบ · {packing} · ล็อต {lot}
                </p>
                <p>{supplier}</p>
              </div>
            </CollapsibleContent>
          </Collapsible>

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
                const [p, f] = VERDICT_WORDS[item.verdictWording];
                return (
                  <div
                    key={item.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-dashed border-border px-4 py-3"
                  >
                    <span className="text-sm text-muted-foreground">
                      {items.indexOf(item) + 1}. {item.title} — ตรวจครั้งเดียว
                    </span>
                    {v === null ? (
                      <span className="text-sm text-muted-foreground">
                        ยังไม่ได้ตรวจ
                      </span>
                    ) : (
                      <Badge tone={v ? "success" : "danger"} appearance="soft">
                        {v ? p : f}
                      </Badge>
                    )}
                  </div>
                );
              })}
        </div>

        <div className="flex items-center gap-3 border-t border-border p-4">
          <Button
            variant="outline"
            className="h-11 flex-1 sm:flex-none"
            onClick={() => onOpenChange(false)}
          >
            ย้อนกลับ
          </Button>
          <Button className="h-11 flex-1 sm:ml-auto sm:w-32 sm:flex-none" onClick={onSave}>
            บันทึก
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------

/**
 * หนึ่งข้อตรวจ — เรียงลงเป็นแนวตั้งล้วน
 *
 * ชื่อกับเกณฑ์ได้ความกว้างเต็ม ไม่ต้องแย่งที่กับปุ่ม
 * ปุ่มผ่าน/ไม่ผ่านอยู่ล่างสุดของบล็อก แบ่งครึ่ง สูง 44px
 * เพราะเป็นสิ่งสุดท้ายที่ทำหลังอ่านเกณฑ์และคีย์ค่าเสร็จ ลำดับบนจอตรงกับลำดับที่ทำจริง
 */
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
  const noteRef = React.useRef<HTMLInputElement>(null);

  // หมายเหตุโผล่ตอนที่ต้องใช้จริง ไม่ใช่ขึ้นค้างไว้ทุกข้อตลอดเวลา
  // ข้อที่บังคับทุกครั้งก็ยังขึ้นตลอดตามที่ตั้งไว้ในเทมเพลต
  const showNote =
    item.note === "always" || (answer.pass === false && item.note !== "off");

  const tick = (v: boolean) => {
    onPatch({ pass: v });
    // กดไม่ผ่านแล้วโฟกัสช่องเหตุผลให้เลย เป็นสิ่งถัดไปที่ต้องทำอยู่แล้ว
    if (v === false && item.note !== "off") {
      requestAnimationFrame(() => noteRef.current?.focus());
    }
  };

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="font-semibold">
        {index + 1}. {item.title}
      </p>
      {item.criteria && (
        <p className="mt-0.5 text-sm text-muted-foreground">
          เกณฑ์: {item.criteria}
        </p>
      )}

      {item.fields.length > 0 && (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {item.fields.map((f) => (
            <div key={f.id} className="space-y-1.5">
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
                  "h-11 bg-card",
                  f.type === "number" && "text-right tabular-nums"
                )}
                placeholder={f.type === "number" ? "0.00" : "—"}
                value={answer.values[f.id] ?? ""}
                onChange={(e) =>
                  onPatch({
                    values: { ...answer.values, [f.id]: e.target.value },
                  })
                }
              />
            </div>
          ))}
        </div>
      )}

      {/* ผลที่คำนวณจากเกณฑ์ขึ้นเป็นตัวช่วยก่อนกด ไม่ได้ติ๊กให้ ผู้ตรวจยังตัดสินเอง */}
      {computed !== null && (
        <p className="mt-2 text-sm text-muted-foreground">
          ตามเกณฑ์: {computed ? pass : fail}
        </p>
      )}

      {showsTick(item) && (
        <div className="mt-3 grid grid-cols-2 gap-3 sm:max-w-sm">
          <Choice
            id={`${item.id}-pass`}
            label={pass}
            on={answer.pass === true}
            tone="pass"
            onClick={() => tick(true)}
          />
          <Choice
            id={`${item.id}-fail`}
            label={fail}
            on={answer.pass === false}
            tone="fail"
            onClick={() => tick(false)}
          />
        </div>
      )}

      {showNote && (
        <div className="mt-3 space-y-1.5">
          <Label htmlFor={`${item.id}-note`} className="text-sm font-normal">
            หมายเหตุ{" "}
            <span className="text-muted-foreground">
              ({item.note === "optional" ? "ไม่บังคับ" : "บังคับ"})
            </span>
          </Label>
          <Input
            id={`${item.id}-note`}
            ref={noteRef}
            className={cn(
              "h-11 bg-card",
              item.note !== "optional" &&
                answer.note.trim() === "" &&
                "border-destructive"
            )}
            placeholder={`ระบุเหตุผลที่${fail}`}
            value={answer.note}
            onChange={(e) => onPatch({ note: e.target.value })}
          />
        </div>
      )}
    </div>
  );
}

/**
 * ปุ่มผ่าน/ไม่ผ่าน — เขียวกับแดง แบ่งครึ่งความกว้าง สูง 44px
 *
 * ไม่ได้ใช้วงกลมติ๊กสองอันที่หน้าตาเหมือนกัน เพราะใบหนึ่งมีแปดข้อ
 * กวาดตาลงมาต้องเห็นทันทีว่าข้อไหนแดงโดยไม่ต้องอ่านตัวหนังสือทีละบรรทัด
 * สีขึ้นเฉพาะปุ่มที่ถูกเลือก ยังไม่เลือกก็เป็นปุ่มเปล่าทั้งคู่
 * ไม่ใช่เขียวไว้ก่อน ซึ่งอ่านว่าผ่านแล้วทั้งที่ยังไม่มีใครตรวจ
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
  tone: "pass" | "fail";
  onClick: () => void;
}) {
  const Icon = tone === "pass" ? CheckIcon : XIcon;
  return (
    <button
      id={id}
      type="button"
      role="radio"
      aria-checked={on}
      onClick={onClick}
      className={cn(
        "flex h-11 items-center justify-center gap-2 rounded-md border px-3",
        "text-sm font-medium transition-colors",
        "focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
        on &&
          tone === "pass" &&
          "border-success-border bg-success text-success-foreground",
        on &&
          tone === "fail" &&
          "border-danger-border bg-danger text-danger-foreground",
        !on && "border-border font-normal text-foreground hover:bg-accent-hover"
      )}
    >
      {/* ไอคอนบอกสถานะซ้ำอีกชั้น สำหรับคนที่แยกเขียวกับแดงไม่ออก
          สีเป็นตัวช่วยกวาดตา ไม่ใช่ตัวเดียวที่บอกว่าเลือกอะไรไว้ */}
      <Icon className={cn("size-4", !on && "opacity-40")} />
      {label}
    </button>
  );
}
