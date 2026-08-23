"use client";

import * as React from "react";
import {
  ChevronDownIcon,
  CircleCheckIcon,
  CircleXIcon,
  MinusIcon,
  PlusIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { Badge } from "@peckey954/ui/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@peckey954/ui/components/ui/collapsible";
import { Input } from "@peckey954/ui/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@peckey954/ui/components/ui/input-group";
import { Label } from "@peckey954/ui/components/ui/label";
import { cn } from "@peckey954/ui/lib/utils";
import { useNumberField } from "@/components/number-field";
import {
  answerOf,
  editableIn,
  verdictOf,
  type Answer,
  type Round,
} from "@/lib/qc-inspect";
import { VERDICT_WORDS, showsTick, type QcItem } from "@/lib/qc-template";

/* ------------------------------------------------------------------
   หนึ่งครั้งที่ตรวจ = หนึ่งการ์ดหุบ/กางได้ในหน้า ไม่ใช่กล่องเด้งกลางจอ

   ของเดิมเป็นกล่องกลางจอ ซึ่งบังทั้งหน้าและสร้างพื้นที่เลื่อนซ้อนกันสองชั้น
   การ์ดในหน้าเห็นทุกรอบพร้อมกัน หัวการ์ดบอกผลของแต่ละรอบตั้งแต่ยังไม่กาง

   ทุกข้อวางเหมือนกันหมด ไม่ว่าจะมีช่องกรอกหรือไม่มี
     บรรทัดแรก  ชื่อข้อ + เกณฑ์
     ถ้ามีช่อง   ป้ายกำกับ + ช่องกรอกเต็มความกว้าง
     บรรทัดสุดท้าย  ผลการตรวจสอบ | หมายเหตุ  แบ่งครึ่งเสมอ
   ตำแหน่งปุ่มผ่าน/ไม่ผ่านจึงอยู่ที่เดิมทุกข้อ กวาดตาลงมาเป็นแนวตรง
   ไม่ใช่ขยับไปมาตามว่าข้อนั้นมีช่องกรอกหรือเปล่า
------------------------------------------------------------------ */

export function RoundCard({
  items,
  round,
  index,
  firstRound,
  open,
  onOpenChange,
  onPatchAnswer,
}: {
  items: QcItem[];
  round: Round;
  index: number;
  /** รอบแรก — ใช้ดึงคำตอบของข้อที่ตรวจครั้งเดียวมาโชว์ในรอบหลัง ๆ */
  firstRound: Round;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onPatchAnswer: (itemId: string, p: Partial<Answer>) => void;
}) {
  const mine = items.filter((i) => editableIn(i, index));
  let done = 0;
  let fail = 0;
  for (const i of mine) {
    const v = verdictOf(i, answerOf(round, i.id));
    if (v === null) continue;
    done += 1;
    if (!v) fail += 1;
  }

  return (
    <Collapsible
      open={open}
      onOpenChange={onOpenChange}
      className="overflow-hidden rounded-xl border border-border bg-card"
    >
      <CollapsibleTrigger className="flex w-full items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-accent-hover">
        <div className="min-w-0 flex-1">
          <p className="font-semibold">ตรวจสอบครั้งที่ {index + 1}</p>
          <p className="mt-0.5 text-sm text-muted-foreground tabular-nums">
            {round.date || "1/16/2026"} | {round.time || "10:42:52"}
          </p>
        </div>
        <RoundBadge total={mine.length} done={done} fail={fail} />
        <ChevronDownIcon
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180"
          )}
        />
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="space-y-3 border-t border-border p-4">
          {mine.map((item) => (
            <ItemBlock
              key={item.id}
              item={item}
              index={items.indexOf(item)}
              answer={answerOf(round, item.id)}
              onPatch={(p) => onPatchAnswer(item.id, p)}
            />
          ))}

          {/* ข้อที่ตรวจครั้งเดียวและตอบไปแล้ว ยังโชว์อยู่แต่แก้ไม่ได้
              ซ่อนทิ้งไปเลยแล้วผู้ตรวจจะสงสัยว่าข้อที่หายไปคืออะไร */}
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
      </CollapsibleContent>
    </Collapsible>
  );
}

function RoundBadge({
  total,
  done,
  fail,
}: {
  total: number;
  done: number;
  fail: number;
}) {
  if (fail > 0)
    return (
      <Badge tone="danger" appearance="soft">
        <CircleXIcon />
        ไม่ผ่าน
      </Badge>
    );
  if (done < total)
    return (
      <Badge tone="warning" appearance="soft">
        <TriangleAlertIcon />
        รอตรวจสอบ {total - done}/{total} ข้อ
      </Badge>
    );
  return (
    <Badge tone="success" appearance="soft">
      <CircleCheckIcon />
      ผ่าน
    </Badge>
  );
}

// ---------------------------------------------------------------

/**
 * หนึ่งข้อตรวจ — โครงเดียวกันทุกข้อ
 *
 * แถวล่างเป็นสองคอลัมน์เสมอ ผลการตรวจสอบกับหมายเหตุ
 * ข้อที่ไม่มีช่องกรอกก็ยังมีแถวนี้ที่ตำแหน่งเดิม ปุ่มผ่าน/ไม่ผ่านจึงอยู่แนวตรงกันทุกข้อ
 * ของเดิมให้หมายเหตุโผล่เฉพาะตอนกดไม่ผ่าน ซึ่งทำให้ความสูงของแต่ละข้อไม่เท่ากัน
 * และปุ่มขยับตำแหน่งทุกครั้งที่กด
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
  const needNote =
    item.note === "always" ||
    (item.note === "onFail" && answer.pass === false);

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      {/* ชื่อกับเกณฑ์อยู่บรรทัดเดียวกัน เกณฑ์เป็นคำขยายของชื่อ ไม่ใช่หัวข้อของตัวเอง */}
      <p className="text-sm">
        <span className="font-semibold">
          {index + 1}. {item.title}
        </span>
        {item.criteria && (
          <span className="ml-2 text-muted-foreground">
            เกณฑ์: {item.criteria}
          </span>
        )}
      </p>

      {item.fields.map((f) => (
        <div key={f.id} className="mt-3 space-y-1.5">
          <Label htmlFor={f.id} className="text-sm font-normal">
            {f.label}
            {f.unit && <span className="text-muted-foreground"> ({f.unit})</span>}
          </Label>
          {f.type === "number" ? (
            <NumberStepper
              id={f.id}
              label={f.label}
              value={answer.values[f.id] ?? ""}
              onValueChange={(v) =>
                onPatch({ values: { ...answer.values, [f.id]: v } })
              }
            />
          ) : (
            <Input
              id={f.id}
              className="bg-card"
              placeholder="—"
              value={answer.values[f.id] ?? ""}
              onChange={(e) =>
                onPatch({
                  values: { ...answer.values, [f.id]: e.target.value },
                })
              }
            />
          )}
        </div>
      ))}

      <div className="mt-3 grid gap-3 @2xl:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-sm font-normal">ผลการตรวจสอบ</Label>
          {showsTick(item) ? (
            <div className="grid grid-cols-2 gap-3">
              <Choice
                id={`${item.id}-pass`}
                label={pass}
                on={answer.pass === true}
                tone="pass"
                onClick={() => onPatch({ pass: true })}
              />
              <Choice
                id={`${item.id}-fail`}
                label={fail}
                on={answer.pass === false}
                tone="fail"
                onClick={() => onPatch({ pass: false })}
              />
            </div>
          ) : (
            <p className="flex h-11 items-center text-sm text-muted-foreground">
              ระบบตัดสินจากเกณฑ์
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={`${item.id}-note`} className="text-sm font-normal">
            หมายเหตุ{" "}
            <span className="text-muted-foreground">
              ({item.note === "optional" ? "ไม่บังคับ" : "บังคับ"})
            </span>
          </Label>
          <Input
            id={`${item.id}-note`}
            className={cn(
              "h-11 bg-card",
              needNote && answer.note.trim() === "" && "border-destructive"
            )}
            placeholder={
              needNote ? `ระบุเหตุผลที่${fail}` : "ระบุหมายเหตุ"
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
 * ช่องตัวเลขที่มีปุ่มลบ/บวก — ชุดเดียวกับที่ใช้ในใบชั่งกับใบผลิต
 * เก็บค่าเป็นตัวหนังสือเพราะช่องว่างกับเลขศูนย์ไม่ใช่เรื่องเดียวกัน
 * ว่าง = ยังไม่ได้ชั่ง ศูนย์ = ชั่งแล้วได้ศูนย์
 */
function NumberStepper({
  id,
  label,
  value,
  onValueChange,
}: {
  id: string;
  label: string;
  value: string;
  onValueChange: (v: string) => void;
}) {
  const num = value.trim() === "" ? 0 : Number(value) || 0;
  const field = useNumberField(num, (n) => onValueChange(String(n)), 2);
  const step = (delta: number) =>
    onValueChange(String(Math.max(0, Number((num + delta).toFixed(2)))));

  return (
    <InputGroup className="h-11 bg-card">
      <InputGroupAddon align="inline-start">
        <InputGroupButton
          size="icon-sm"
          aria-label={`ลด${label}`}
          onClick={() => step(-1)}
        >
          <MinusIcon />
        </InputGroupButton>
      </InputGroupAddon>
      <InputGroupInput {...field} id={id} className="text-center tabular-nums" />
      <InputGroupAddon align="inline-end">
        <InputGroupButton
          size="icon-sm"
          aria-label={`เพิ่ม${label}`}
          onClick={() => step(1)}
        >
          <PlusIcon />
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  );
}

/**
 * ปุ่มผ่าน/ไม่ผ่าน — เขียวกับแดง มีวงกลมบอกสถานะในตัว
 * สีเป็นตัวช่วยกวาดตาหาข้อที่ตก ไม่ใช่ตัวเดียวที่บอกว่าเลือกอะไรไว้
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
  return (
    <button
      id={id}
      type="button"
      role="radio"
      aria-checked={on}
      onClick={onClick}
      className={cn(
        "flex h-11 items-center gap-2 rounded-md border px-3",
        "text-sm whitespace-nowrap transition-colors",
        "focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
        on &&
          tone === "pass" &&
          "border-success-border bg-success font-medium text-success-foreground",
        on &&
          tone === "fail" &&
          "border-danger-border bg-danger font-medium text-danger-foreground",
        !on && "border-border text-foreground hover:bg-accent-hover"
      )}
    >
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
