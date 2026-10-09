"use client";

import * as React from "react";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  MinusIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import { Badge } from "@peckey954/ui/components/ui/badge";
import { Button } from "@peckey954/ui/components/ui/button";
import { Checkbox } from "@peckey954/ui/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@peckey954/ui/components/ui/dialog";
import { Input } from "@peckey954/ui/components/ui/input";
import { Label } from "@peckey954/ui/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@peckey954/ui/components/ui/select";
import { Textarea } from "@peckey954/ui/components/ui/textarea";
import { ParamCombobox } from "@/components/qc/param-picker";
import {
  CHECK_SOURCES,
  MAX_READINGS,
  REMARK_LABEL,
  ROW_KIND,
  ROW_KINDS,
  SOURCE,
  SOURCE_IDS,
  describeCriteria,
  paramOf,
  type DocField,
  type QiRow,
  type RemarkMode,
  type RowKind,
  type SourceId,
} from "@/lib/qc-erp";

/* ------------------------------------------------------------------
   ตารางตั้งหัวข้อตรวจ + กล่องแก้ไข — ใช้ร่วมกันทุกฟอร์ม

   ตารางเก็บเฉพาะสี่ช่องที่ต้องกวาดตาเทียบข้ามแถว — หัวข้อ ประเภทข้อมูล
   เกณฑ์ ใครตัดสิน ที่เหลือไปอยู่ในกล่อง

   ใช้กล่องแทนการกางแถว เพราะตารางนี้เลื่อนแนวนอนได้ แถวที่กางออกมาจะอยู่ใน
   พื้นที่เลื่อนไปด้วย กางแล้วต้องเลื่อนกลับมาซ้ายถึงจะเห็นของที่เพิ่งเปิด

   ชื่อหัวข้อเป็นดรอปดาวน์เสมอ ไม่ใช่ช่องพิมพ์ — ของ ERPNext ช่อง specification
   เป็น Link ไปทะเบียน Quality Inspection Parameter พิมพ์อิสระไม่ได้อยู่แล้ว
   และนั่นคือตัวกันไม่ให้เกิด "ความชื้น" กับ "ความชื้น (%)" เป็นคนละหัวข้อ
------------------------------------------------------------------ */

/** ชื่อที่โชว์ของหนึ่งแถว — แถวที่ดึงจากระบบใช้ชื่อแหล่งข้อมูลเป็นชื่อหัวข้อ */
export const rowTitle = (r: QiRow) =>
  r.kind === "system"
    ? r.source
      ? SOURCE[r.source].label
      : ""
    : (paramOf(r.parameterId)?.name ?? "");

/**
 * ข้อที่เว้นเกณฑ์ว่างแล้วระบบยังตัดสินให้ — เป็นกับดักคนละแบบกันสองฝั่ง
 *
 * ฝั่งตัวเลข min_max_criteria_passed คืน has_reading ซึ่งเป็น False เมื่อไม่มี
 * ค่าไหนถูกคีย์เลย และต่อให้คีย์ ก็เทียบ flt(min) <= v <= flt(max) โดย flt ของ
 * ค่าว่างคือ 0 — เว้นค่าสูงสุดไว้คือข้อที่ "ตกทุกใบ"
 *
 * ฝั่งข้อความกลับกันคนละทาง set_status_based_on_acceptance_values เทียบ
 * (reading_value or "") == (value or "") — ไม่ได้ตั้งค่าที่ผ่านและผู้ตรวจไม่คีย์
 * อะไร จะได้ "" == "" ซึ่งเป็นจริง กลายเป็นข้อที่ "ผ่านทุกใบ" ทั้งที่ไม่มีใครตรวจ
 *
 * ทั้งสองแบบหายไปทันทีที่ติ๊กผู้ตรวจตัดสินเอง เพราะ inspect_and_set_status
 * ข้ามแถวที่ manual_inspection ทั้งแถว ไม่ประเมินเกณฑ์อะไรเลย
 */
export function blankCriteriaWarning(r: QiRow): string | null {
  if (r.manualInspection || r.formulaBased) return null;
  if (r.numeric && r.max === null)
    return "หัวข้อนี้ยังไม่ได้ใส่ช่วงที่ถือว่าผ่าน ระบบจึงไม่มีอะไรไว้ตัดสิน ต้องให้ผู้ตรวจตัดสินเอง ไม่งั้นข้อนี้จะขึ้นว่าไม่ผ่านทุกใบ";
  if (!r.numeric && r.value.trim() === "")
    return "หัวข้อนี้ยังไม่ได้ใส่ค่าที่ถือว่าผ่าน ระบบจึงไม่มีอะไรไว้ตัดสิน ต้องให้ผู้ตรวจตัดสินเอง ไม่งั้นข้อนี้จะขึ้นว่าผ่านทุกใบ";
  return null;
}

/**
 * นับข้อที่เว้นเกณฑ์ว่างไว้ แยกตามว่าจะเพี้ยนไปทางไหน
 *
 * ใช้ตอนกดบันทึกเป็นด่านสุดท้าย — แถบเตือนที่แถวมองข้ามได้ถ้าฟอร์มยาวยี่สิบสี่ข้อ
 * แล้วเลื่อนผ่านไป ตอนบันทึกคือจังหวะเดียวที่ยังทันแก้ก่อนเอาไปใช้จริง
 */
export function criteriaProblems(rows: QiRow[]) {
  const alwaysPass = rows.filter(
    (r) => !r.manualInspection && !r.formulaBased && !r.numeric && r.value.trim() === ""
  );
  const alwaysFail = rows.filter(
    (r) => !r.manualInspection && !r.formulaBased && r.numeric && r.max === null
  );
  return { alwaysPass, alwaysFail, total: alwaysPass.length + alwaysFail.length };
}

/**
 * แถบเตือนพร้อมปุ่มแก้ — ไม่ติ๊กให้เองเงียบ ๆ
 *
 * ข้อที่เว้นเกณฑ์ว่างมีสองความหมายที่หน้าตาเหมือนกันเป๊ะ คือ "ตั้งใจให้คนตัดสิน"
 * กับ "ลืมใส่เกณฑ์" ติ๊กให้เองอัตโนมัติคือเลือกข้างให้ว่าเป็นอันแรกเสมอ
 * ซึ่งทำให้ข้อที่ลืมใส่เกณฑ์กลายเป็นข้อที่ไม่มีวันถูกตรวจอัตโนมัติอีกเลย
 * โดยคนตั้งค่าไม่เคยรู้ว่าตัวเองลืม — เป็นปัญหาชนิดเดียวกับที่กำลังจะแก้
 *
 * ให้ปุ่มกดแทน จบในคลิกเดียวเหมือนกัน แต่คนกดเป็นคนตัดสินว่าอันไหนคืออันไหน
 */
function CriteriaWarning({
  row,
  onFix,
}: {
  row: QiRow;
  onFix: () => void;
}) {
  const msg = blankCriteriaWarning(row);
  if (!msg) return null;
  return (
    <div className="mt-1 rounded-lg border border-danger-border bg-danger px-3 py-2">
      <p className="text-sm text-danger-strong">{msg}</p>
      <Button
        variant="outline"
        size="sm"
        className="mt-2 bg-card"
        onClick={onFix}
      >
        ให้ผู้ตรวจตัดสินเอง
      </Button>
    </div>
  );
}

const numText = (v: number | null) => (v === null ? "" : String(v));
const toNum = (v: string) => {
  const t = v.trim();
  if (t === "") return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
};

export function CheckTable({
  rows,
  onChange,
  onPatch,
}: {
  rows: QiRow[];
  onChange: (next: QiRow[]) => void;
  onPatch: (id: string, next: Partial<QiRow>) => void;
}) {
  const [editing, setEditing] = React.useState<string | null>(null);
  const editRow = rows.find((r) => r.id === editing) ?? null;

  const move = (i: number, delta: number) => {
    const j = i + delta;
    if (j < 0 || j >= rows.length) return;
    const next = [...rows];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full min-w-[880px]">
          <thead>
            <tr className="border-b border-border text-sm text-muted-foreground">
              <th className="px-4 py-3 text-left font-normal">หัวข้อตรวจ</th>
              <th className="w-44 px-4 py-3 text-left font-normal">
                ประเภทข้อมูล
              </th>
              <th className="w-56 px-4 py-3 text-left font-normal">เกณฑ์</th>
              <th className="w-32 px-4 py-3 text-center font-normal">
                ผู้ตรวจตัดสินเอง
              </th>
              <th className="w-32 px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 align-top">
                  {r.kind === "system" ? (
                    <Select
                      value={r.source ?? ""}
                      onValueChange={(v) =>
                        onPatch(r.id, { source: v as SourceId })
                      }
                    >
                      <SelectTrigger
                        aria-label="หัวข้อตรวจ"
                        className="w-full bg-card"
                      >
                        <SelectValue placeholder="เลือกหัวข้อ" />
                      </SelectTrigger>
                      <SelectContent>
                        {CHECK_SOURCES.map((sid) => (
                          <SelectItem key={sid} value={sid}>
                            {SOURCE[sid].label}
                            {SOURCE[sid].custom && " — ไม่มีใน ERPNext"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    /* ค้นได้ และพิมพ์ชื่อที่ยังไม่มีแล้วกดสร้างลงทะเบียนได้ในช่อง
                       เดียวกัน ถ้าต้องออกไปหน้าทะเบียนก่อน คนจะเลือกหัวข้อที่
                       ใกล้เคียงไปก่อน แล้วทะเบียนก็ไม่ตรงกับฟอร์มตลอดไป */
                    <ParamCombobox
                      id={`${r.id}-param`}
                      value={r.parameterId}
                      onChange={(v) => onPatch(r.id, { parameterId: v })}
                    />
                  )}
                  <FieldNote
                    custom={
                      r.kind === "system" && !!r.source && SOURCE[r.source].custom
                    }
                  >
                    {r.kind === "system"
                      ? r.source
                        ? SOURCE[r.source].store
                        : "ยังไม่ได้เลือกแหล่งข้อมูล"
                      : "specification → Quality Inspection Parameter"}
                  </FieldNote>
                </td>

                <td className="px-4 py-3 align-top">
                  <Select
                    value={r.kind}
                    onValueChange={(v) =>
                      // สลับประเภทแล้วชื่อหัวข้อใช้ร่วมกันไม่ได้ ล้างทั้งคู่
                      // ไม่งั้นจะเหลือชื่อจากทะเบียนค้างในข้อที่ดึงจากระบบ
                      onPatch(r.id, {
                        kind: v as RowKind,
                        parameterId: "",
                        source: undefined,
                        // แถวที่ดึงจากระบบไม่มีเกณฑ์ให้ระบบตัดสิน ผู้ตรวจเลือก
                        // จากรายการแล้วชี้ขาดเอง ตั้งให้ตรงกันตั้งแต่สลับประเภท
                        // ไม่ใช่ปล่อยให้เหลือ numeric ค้างแล้วตัดสินมั่ว
                        ...(v === "system"
                          ? {
                              numeric: false,
                              formulaBased: false,
                              manualInspection: true,
                              readings: 1,
                            }
                          : {}),
                      })
                    }
                  >
                    <SelectTrigger
                      aria-label="ประเภทข้อมูล"
                      className="w-full bg-card"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROW_KINDS.map((k) => (
                        <SelectItem key={k} value={k}>
                          {ROW_KIND[k].label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>

                <td className="px-4 py-3 align-top">
                  <p className="py-2 text-sm">{describeCriteria(r)}</p>
                  <p className="text-sm text-muted-foreground">
                    {r.numeric ? "ตัวเลข" : "ข้อความ"}
                    {r.formulaBased && " · สูตร"}
                    {r.readings > 1 && ` · คีย์ ${r.readings} ค่า`}
                  </p>
                  <CriteriaWarning
                    row={r}
                    onFix={() => onPatch(r.id, { manualInspection: true })}
                  />
                </td>

                <td className="px-4 py-3 text-center align-top">
                  <Checkbox
                    aria-label="ผู้ตรวจตัดสินเอง"
                    className="mt-3"
                    checked={r.manualInspection}
                    onCheckedChange={(v) =>
                      onPatch(r.id, { manualInspection: v === true })
                    }
                  />
                </td>

                <td className="px-4 py-3 align-top">
                  <div className="mt-1 flex items-center justify-end">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="เลื่อนขึ้น"
                      disabled={i === 0}
                      onClick={() => move(i, -1)}
                    >
                      <ChevronUpIcon />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="เลื่อนลง"
                      disabled={i === rows.length - 1}
                      onClick={() => move(i, 1)}
                    >
                      <ChevronDownIcon />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="ตั้งค่าหัวข้อนี้"
                      onClick={() => setEditing(r.id)}
                    >
                      <PencilIcon />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="ลบหัวข้อนี้"
                      onClick={() => onChange(rows.filter((x) => x.id !== r.id))}
                    >
                      <Trash2Icon />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}

            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center">
                  <p className="font-medium">ยังไม่มีหัวข้อตรวจในฟอร์มนี้</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    กด “เพิ่มหัวข้อตรวจ” แล้วเลือกหัวข้อจากทะเบียน
                    ไม่เจอก็พิมพ์ชื่อใหม่แล้วกดสร้างได้ในช่องเดียวกัน
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editRow && (
        <RowEditDialog
          row={editRow}
          onChange={(next) => onPatch(editRow.id, next)}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
}

/* ------------------------------------------------------------------
   กล่องตั้งค่าหัวข้อ — ของที่ไม่ต้องเทียบข้ามแถว

   ติ๊กตัวเลขกับติ๊กสูตรเป็นกล่องติ๊กสองใบที่ติ๊กพร้อมกันได้ ตรงกับ ERPNext
   ที่ numeric กับ formula_based_criteria เป็น Check คนละตัว และติ๊กคู่กันแล้ว
   ความหมายเปลี่ยน — สูตรจะได้ reading_1…reading_10 กับ mean แทน reading_value
------------------------------------------------------------------ */

function RowEditDialog({
  row,
  onChange,
  onClose,
}: {
  row: QiRow;
  onChange: (next: Partial<QiRow>) => void;
  onClose: () => void;
}) {
  const unit = paramOf(row.parameterId)?.unit ?? "";

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{rowTitle(row) || "หัวข้อที่ยังไม่ได้เลือก"}</DialogTitle>
          <DialogDescription>
            ตั้งเกณฑ์ จำนวนค่าที่คีย์ และหมายเหตุของหัวข้อนี้
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] space-y-5 overflow-y-auto px-1">
          {/* อยู่ทั้งในตารางและในกล่อง — ในตารางไว้กวาดตาเทียบว่าข้อไหนระบบตัดสิน
              ข้อไหนคนตัดสิน ในกล่องไว้ตั้งตอนกำลังตั้งเกณฑ์อยู่ จะได้ไม่ต้อง
              ปิดกล่องออกไปติ๊กข้างนอกแล้วเปิดกลับเข้ามาใหม่ */}
          <label className="flex items-start gap-3 rounded-lg border border-border bg-muted px-3 py-2.5">
            <Checkbox
              className="mt-0.5"
              checked={row.manualInspection}
              onCheckedChange={(v) =>
                onChange({ manualInspection: v === true })
              }
            />
            <span className="text-sm">
              <span className="font-medium">ผู้ตรวจตัดสินเอง</span>
              <span className="block text-muted-foreground">
                ระบบเก็บค่าที่วัดไว้เหมือนเดิม แต่ไม่ชี้ขาดให้ —
                ติ๊กคู่กับเกณฑ์ข้างล่างได้
              </span>
              <FieldNote custom>
                custom_manual_inspection → manual_inspection ของแถวในใบตรวจ
              </FieldNote>
            </span>
          </label>

          {/* สองคำถามนี้แยกจากกันจริง ไม่ใช่ตัวเลือกที่แข่งกัน — ของ ERPNext
              numeric กับ formula_based_criteria ไม่มี depends_on ทั้งคู่
              ติ๊กครบทั้งสี่แบบได้ และแต่ละแบบให้ผลคนละอย่าง */}
          <div className="space-y-2">
            <Label>ผู้ตรวจคีย์อะไร</Label>
            <label className="flex items-start gap-3 rounded-lg border border-border px-3 py-2.5">
              <Checkbox
                className="mt-0.5"
                checked={row.numeric}
                onCheckedChange={(v) =>
                  // ไม่ติ๊กตัวเลข = เหลือ reading_value ช่องเดียว ช่องคีย์ 1-10
                  // ถูกซ่อนทั้งก้อน (section_break_14 depends_on numeric)
                  // จำนวนค่าจึงต้องตกกลับเป็น 1 ไม่ใช่ค้างเลขเดิมไว้หลอก
                  onChange({
                    numeric: v === true,
                    ...(v === true ? {} : { readings: 1 }),
                  })
                }
              />
              <span className="text-sm">
                <span className="font-medium">คีย์เป็นตัวเลข</span>
                <span className="block text-muted-foreground">
                  ติ๊ก = ช่องตัวเลข reading_1…reading_{MAX_READINGS} ·
                  ไม่ติ๊ก = ช่องข้อความ reading_value ช่องเดียว
                </span>
              </span>
            </label>
            <FieldNote>numeric</FieldNote>
          </div>

          <div className="space-y-2">
            <Label>ตัดสินยังไง</Label>
            <label className="flex items-start gap-3 rounded-lg border border-border px-3 py-2.5">
              <Checkbox
                className="mt-0.5"
                checked={row.formulaBased}
                onCheckedChange={(v) => onChange({ formulaBased: v === true })}
              />
              <span className="text-sm">
                <span className="font-medium">ตัดสินด้วยสูตร</span>
                <span className="block text-muted-foreground">
                  ติ๊กแล้วช่วงต่ำ–สูงกับค่าที่ถือว่าผ่านจะถูกซ่อน
                  ใช้สูตรแทนทั้งคู่
                </span>
              </span>
            </label>
            {/* บอกผลของสองติ๊กรวมกันเป็นประโยคเดียว เพราะสี่แบบที่เป็นไปได้
                ให้ตัวแปรในสูตรคนละชุด เขียนผิดชุดแล้วสูตรจะพังตอนรันจริง */}
            <p className="rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
              {row.formulaBased
                ? row.numeric
                  ? "คีย์ตัวเลขหลายค่า แล้วตัดสินด้วยสูตรที่ใช้ reading_1…reading_10 และ mean ได้"
                  : "คีย์ข้อความช่องเดียว แล้วตัดสินด้วยสูตรที่ใช้ได้แต่ reading_value"
                : row.numeric
                  ? "คีย์ตัวเลขหลายค่า แล้วตัดสินด้วยช่วงต่ำ–สูง ทุกค่าต้องอยู่ในช่วง"
                  : "คีย์ข้อความช่องเดียว แล้วเทียบกับค่าที่ถือว่าผ่านตรงตัว"}
            </p>
            <FieldNote>formula_based_criteria</FieldNote>
          </div>

          {row.formulaBased ? (
            <div className="space-y-1.5">
              <Label htmlFor={`${row.id}-f`}>สูตร</Label>
              {/* กล่องยาว ไม่ใช่ช่องบรรทัดเดียว — สูตรจริงยาวกว่าที่คิด เช่น
                  ตรวจทุกค่าพร้อมกันหรือซ้อน and/or หลายชั้น พิมพ์ในช่องบรรทัด
                  เดียวแล้วอ่านทวนไม่ออกว่าวงเล็บปิดตรงไหน */}
              <Textarea
                id={`${row.id}-f`}
                className="bg-card font-mono text-sm"
                rows={4}
                value={row.formula}
                placeholder={
                  "เช่น\nmean < 80\n\nหรือยาวกว่านั้น\nreading_1 < 80 and reading_2 < 80 and reading_3 < 80"
                }
                onChange={(e) => onChange({ formula: e.target.value })}
              />
              {/* ตัวแปรที่ใช้ได้เปลี่ยนตามว่าติ๊กตัวเลขไว้ไหม เขียนผิดชุดแล้ว
                  สูตรจะพังตอนรันจริงโดยหน้าจอไม่ได้บอกอะไร */}
              <FieldNote>
                {row.numeric
                  ? "acceptance_formula · ตัวแปรที่ใช้ได้: reading_1…reading_10 และ mean"
                  : "acceptance_formula · ตัวแปรที่ใช้ได้: reading_value"}
              </FieldNote>
            </div>
          ) : row.numeric ? (
            <div className="space-y-1.5">
              <Label>
                ช่วงที่ถือว่าผ่าน
                {unit && (
                  <span className="font-normal text-muted-foreground">
                    {" "}
                    ({unit})
                  </span>
                )}
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  aria-label="ค่าต่ำสุด"
                  className="w-32 bg-card"
                  inputMode="decimal"
                  value={numText(row.min)}
                  placeholder="ต่ำสุด"
                  onChange={(e) => onChange({ min: toNum(e.target.value) })}
                />
                <span className="text-muted-foreground">–</span>
                <Input
                  aria-label="ค่าสูงสุด"
                  className="w-32 bg-card"
                  inputMode="decimal"
                  value={numText(row.max)}
                  placeholder="สูงสุด"
                  onChange={(e) => onChange({ max: toNum(e.target.value) })}
                />
              </div>
              <FieldNote>min_value / max_value</FieldNote>
              <CriteriaWarning
                row={row}
                onFix={() => onChange({ manualInspection: true })}
              />
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label htmlFor={`${row.id}-v`}>
                ค่าที่ถือว่าผ่าน{" "}
                <span className="font-normal text-muted-foreground">
                  (ไม่ใส่ = ไม่มีเกณฑ์ ผู้ตรวจชี้ขาดอย่างเดียว)
                </span>
              </Label>
              <Input
                id={`${row.id}-v`}
                className="bg-card"
                value={row.value}
                placeholder="เช่น ปกติ  หรือ  30 / 35 / 40"
                onChange={(e) => onChange({ value: e.target.value })}
              />
              {/* คั่นด้วย / = ให้เลือก ไม่ใช่ให้พิมพ์ — ในใบตรวจจะขึ้นเป็น
                  ดรอปดาวน์ให้เอง ไม่ต้องตั้งประเภทเพิ่มอีกช่อง */}
              <FieldNote>value · คั่นด้วย / จะขึ้นเป็นดรอปดาวน์ในใบตรวจ</FieldNote>
              <CriteriaWarning
                row={row}
                onFix={() => onChange({ manualInspection: true })}
              />
            </div>
          )}

          {/* ไม่ติ๊กตัวเลขก็ไม่มีช่องให้นับ — reading_value มีช่องเดียวตายตัว
              โชว์สเต็ปเปอร์ไว้ก็ปรับได้แต่ไม่มีผลอะไรกับใบจริง */}
          {row.numeric && (
          <div className="space-y-1.5">
            <Label>คีย์กี่ค่าในหัวข้อนี้</Label>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon-sm"
                aria-label="ลดจำนวนค่า"
                disabled={row.readings <= 1}
                onClick={() => onChange({ readings: row.readings - 1 })}
              >
                <MinusIcon />
              </Button>
              <span className="w-10 text-center font-medium tabular-nums">
                {row.readings}
              </span>
              <Button
                variant="outline"
                size="icon-sm"
                aria-label="เพิ่มจำนวนค่า"
                disabled={row.readings >= MAX_READINGS}
                onClick={() => onChange({ readings: row.readings + 1 })}
              >
                <PlusIcon />
              </Button>
              <span className="text-sm text-muted-foreground">
                สูงสุด {MAX_READINGS} — เพดานของ ERPNext ไม่ใช่ของที่เราตั้งเอง
              </span>
            </div>
            {/* ใช้กับการวัดของชิ้นเดียวซ้ำหลายจุดแล้วเอามาเฉลี่ย ไม่ใช่ของหลายชิ้น
                ของหลายชิ้นคือเปิดสวิตช์สุ่มหลายตัวอย่าง ซึ่งแตกเป็นหลายใบให้ */}
            <p className="text-sm text-muted-foreground">
              วัดของชิ้นเดียวซ้ำหลายจุดแล้วเอามาเฉลี่ย —
              ถ้าเป็นของคนละชิ้นให้เปิดสวิตช์สุ่มหลายตัวอย่างแทน
            </p>

            {row.readings > 1 && (
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {Array.from({ length: row.readings }, (_, i) => (
                  <Input
                    key={i}
                    aria-label={`ชื่อค่าที่ ${i + 1}`}
                    className="bg-card"
                    value={row.labels?.[i] ?? ""}
                    placeholder={`ครั้งที่ ${i + 1}`}
                    onChange={(e) => {
                      const next = [...(row.labels ?? [])];
                      next[i] = e.target.value;
                      onChange({ labels: next });
                    }}
                  />
                ))}
              </div>
            )}
            <FieldNote custom={row.readings > 1}>
              {row.readings > 1
                ? "custom_reading_labels — ERPNext ตั้งป้ายไว้ตายตัวว่า Reading 1…10 แก้รายหัวข้อไม่ได้"
                : "reading_1"}
            </FieldNote>
          </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor={`${row.id}-c`}>เกณฑ์ที่ผู้ตรวจอ่าน</Label>
            <Input
              id={`${row.id}-c`}
              className="bg-card"
              value={row.criteria}
              placeholder="เขียนให้คนที่ยืนตรวจอ่าน"
              onChange={(e) => onChange({ criteria: e.target.value })}
            />
            <FieldNote custom>custom_criteria ที่แถวเทมเพลต</FieldNote>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={`${row.id}-r`}>หมายเหตุรายข้อ</Label>
            <Select
              value={row.remark}
              onValueChange={(v) => onChange({ remark: v as RemarkMode })}
            >
              <SelectTrigger id={`${row.id}-r`} className="w-full bg-card">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(REMARK_LABEL) as RemarkMode[]).map((k) => (
                  <SelectItem key={k} value={k}>
                    {REMARK_LABEL[k]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldNote custom>custom_remark ที่แถวของใบตรวจ</FieldNote>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onClose}>เสร็จแล้ว</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------
   ตารางส่วนหัวเอกสาร — ช่องที่กรอกครั้งเดียวต่อใบ
------------------------------------------------------------------ */

export function HeaderFieldTable({
  fields,
  onChange,
}: {
  fields: DocField[];
  onChange: (next: DocField[]) => void;
}) {
  const patch = (id: string, next: Partial<DocField>) =>
    onChange(fields.map((f) => (f.id === id ? { ...f, ...next } : f)));

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card">
      <table className="w-full min-w-[760px]">
        <thead>
          <tr className="border-b border-border text-sm text-muted-foreground">
            <th className="px-4 py-3 text-left font-normal">หัวเอกสาร</th>
            <th className="px-4 py-3 text-left font-normal">แหล่งข้อมูล</th>
            <th className="w-28 px-4 py-3 text-center font-normal">
              บังคับกรอก
            </th>
            <th className="w-16 px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {fields.map((f) => (
            <tr key={f.id} className="border-b border-border last:border-0">
              <td className="px-4 py-3 align-top">
                <Input
                  aria-label="หัวเอกสาร"
                  className="bg-card"
                  value={f.label}
                  placeholder="ระบุชื่อช่อง"
                  onChange={(e) => patch(f.id, { label: e.target.value })}
                />
              </td>
              <td className="px-4 py-3 align-top">
                <Select
                  value={f.source}
                  onValueChange={(v) => patch(f.id, { source: v as SourceId })}
                >
                  <SelectTrigger
                    aria-label="แหล่งข้อมูล"
                    className="w-full bg-card"
                  >
                    <SelectValue placeholder="เลือกแหล่งข้อมูล" />
                  </SelectTrigger>
                  <SelectContent>
                    {SOURCE_IDS.map((sid) => (
                      <SelectItem key={sid} value={sid}>
                        {SOURCE[sid].label}
                        {SOURCE[sid].custom && " — ไม่มีใน ERPNext"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldNote custom={f.source !== "" && SOURCE[f.source].custom}>
                  {f.source === ""
                    ? "ยังไม่ได้เลือกแหล่งข้อมูล"
                    : SOURCE[f.source].store}
                </FieldNote>
              </td>
              <td className="px-4 py-3 text-center align-top">
                <Checkbox
                  aria-label="บังคับกรอก"
                  className="mt-2.5"
                  checked={f.required}
                  onCheckedChange={(v) => patch(f.id, { required: v === true })}
                />
              </td>
              <td className="px-4 py-3 align-top">
                <div className="mt-1 flex justify-end">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="ลบช่องนี้"
                    onClick={() => onChange(fields.filter((x) => x.id !== f.id))}
                  >
                    <Trash2Icon />
                  </Button>
                </div>
              </td>
            </tr>
          ))}

          {fields.length === 0 && (
            <tr>
              <td colSpan={4} className="px-4 py-10 text-center">
                <p className="font-medium">ฟอร์มนี้ไม่มีหัวเอกสาร</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  วันที่ ผู้ตรวจ และเลขที่ใบ มากับตัวใบอยู่แล้ว
                  ตั้งเพิ่มเฉพาะช่องที่ฟอร์มนี้ต้องกรอกเองก่อนเริ่มตรวจ
                </p>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function FieldNote({
  children,
  custom,
}: {
  children: React.ReactNode;
  custom?: boolean;
}) {
  return (
    <p className="mt-1.5 font-mono text-xs text-muted-foreground">
      {custom && (
        <Badge
          appearance="soft"
          tone="warning"
          className="mr-1.5 align-middle font-mono text-[10px] uppercase"
        >
          custom
        </Badge>
      )}
      {children}
    </p>
  );
}
