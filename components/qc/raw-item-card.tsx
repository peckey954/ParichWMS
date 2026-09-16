"use client";

import { CircleCheckIcon, CircleXIcon } from "lucide-react";
import { Badge } from "@peckey954/ui/components/ui/badge";
import { Input } from "@peckey954/ui/components/ui/input";
import { Label } from "@peckey954/ui/components/ui/label";
import { NumberStepper } from "@/components/qc/number-stepper";
import {
  itemResult,
  shareOfSample,
  showsShare,
} from "@/lib/qc-raw-receiving";
import type { QcItem } from "@/lib/qc-template";

/* ------------------------------------------------------------------
   หนึ่งข้อตรวจของใบตรวจรับวัตถุดิบ

   ใบนี้ไม่มีรอบ ทุกข้อจึงกางอยู่พร้อมกันหมด ไม่ต้องกดเปิดทีละใบ
   ผู้ตรวจร่อนตะแกรงชุดเดียวแล้วไล่กรอกลงมาจนจบ การหุบการ์ดมีแต่จะเพิ่มจำนวนคลิก

   หัวข้อวางซ้าย ตัวเลขสรุปกับผลวางขวา — ผลเป็นสิ่งที่คนอ่านย้อนหลังมองหาก่อน
   จึงอยู่ระดับเดียวกับชื่อข้อ ไม่ใช่ซ่อนอยู่ท้ายการ์ด

   โหมดอ่านอย่างเดียวใช้โครงเดียวกันเป๊ะ เปลี่ยนแค่ช่องกรอกเป็นตัวหนังสือ
   คนละเลย์เอาต์กันแล้วใบเดิมจะอ่านไม่เหมือนกันระหว่างตอนกรอกกับตอนย้อนดู
------------------------------------------------------------------ */

export function RawItemCard({
  item,
  index,
  values,
  note,
  readOnly,
  onPatchValue,
  onNoteChange,
}: {
  item: QcItem;
  index: number;
  values: Record<string, string>;
  note: string;
  readOnly: boolean;
  onPatchValue: (fieldId: string, value: string) => void;
  onNoteChange: (value: string) => void;
}) {
  const { pass, summary } = itemResult(item, values);

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2">
        <div className="min-w-0">
          <p className="font-semibold">
            {index + 1}. {item.title}
          </p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            เกณฑ์: {item.criteria}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          {summary.map((s) => (
            <p key={s.label} className="text-sm text-muted-foreground">
              {s.label}:{" "}
              <span className="font-semibold text-foreground tabular-nums">
                {s.value}
              </span>
            </p>
          ))}
          <ResultBadge pass={pass} />
        </div>
      </div>

      {/* ช่องกรอกยืดเต็มแถวแล้วตัดบรรทัดเอง ไม่ได้ตั้งจำนวนคอลัมน์ตายตัว
          เพราะแต่ละข้อมีช่องไม่เท่ากัน (4 / 5 / 2) — ตั้งตายตัวต้องเขียนคลาสแยกทุกข้อ
          และช่องความแข็งห้าช่องจะแคบจนอ่านตัวเลขไม่ออกบนจอกลาง */}
      <div className="mt-4 flex flex-wrap gap-4">
        {item.fields.map((f) => {
          const share = showsShare(item.id) ? shareOfSample(values, f.id) : null;
          const raw = values[f.id] ?? "";
          return (
            <div key={f.id} className="min-w-44 flex-1 space-y-2">
              <div className="flex items-baseline justify-between gap-2">
                <Label htmlFor={f.id} className="text-sm font-normal">
                  {f.label}
                  {f.unit && (
                    <span className="text-muted-foreground"> ({f.unit})</span>
                  )}
                </Label>
                {/* กี่ % ของตัวอย่าง — ตัวเลขที่เกณฑ์ของข้อนี้พูดถึงจริง ๆ
                    ให้เห็นคู่กับกรัมที่เพิ่งคีย์ จะได้ไม่ต้องหารเอง */}
                {share && (
                  <span className="text-sm font-medium tabular-nums">
                    {share}
                  </span>
                )}
              </div>
              {readOnly ? (
                <p className="font-semibold tabular-nums">{readValue(raw)}</p>
              ) : (
                <NumberStepper
                  id={f.id}
                  label={f.label}
                  value={raw}
                  // ความแข็งกับความชื้นวัดละเอียด กดทีละ 1 แล้วกระโดดข้ามช่วงที่ใช้จริง
                  step={item.id === "size" ? 1 : 0.1}
                  onValueChange={(v) => onPatchValue(f.id, v)}
                />
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 space-y-2">
        <Label htmlFor={`${item.id}-note`} className="text-sm font-normal">
          หมายเหตุ{" "}
          <span className="text-muted-foreground">(ไม่บังคับ)</span>
        </Label>
        {readOnly ? (
          <p className={note ? "font-semibold" : "text-muted-foreground"}>
            {note || "-"}
          </p>
        ) : (
          <Input
            id={`${item.id}-note`}
            className="bg-card"
            placeholder="ระบุหมายเหตุ"
            value={note}
            onChange={(e) => onNoteChange(e.target.value)}
          />
        )}
      </div>
    </div>
  );
}

/**
 * ค่าที่คีย์ไว้ ตอนอ่านอย่างเดียว
 *
 * ทศนิยมสองตำแหน่งเท่ากับที่ช่องกรอกทิ้งไว้ตอนคลิกออก (useNumberField)
 * ไม่งั้นใบเดียวกันจะขึ้น "1100" ตอนย้อนดู แต่ "1,100.00" ตอนกรอก
 */
function readValue(raw: string) {
  if (raw.trim() === "") return "-";
  const n = Number(raw);
  return Number.isFinite(n)
    ? n.toLocaleString("th-TH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : raw;
}

/** ผลของข้อ — ยังกรอกไม่ครบก็ยังตัดสินไม่ได้ ไม่ใช่ "ไม่ผ่าน" */
function ResultBadge({ pass }: { pass: boolean | null }) {
  if (pass === null)
    return (
      <Badge tone="warning" appearance="soft">
        รอตรวจสอบ
      </Badge>
    );
  return pass ? (
    <Badge tone="success" appearance="soft">
      <CircleCheckIcon />
      ผ่าน
    </Badge>
  ) : (
    <Badge tone="danger" appearance="soft">
      <CircleXIcon />
      ไม่ผ่าน
    </Badge>
  );
}
