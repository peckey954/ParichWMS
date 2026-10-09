"use client";

import * as React from "react";
import {
  ChevronsUpDownIcon,
  CircleXIcon,
  CopyIcon,
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
import { cn } from "@peckey954/ui/lib/utils";
import { CheckChip } from "@/components/check-chip";
import { ParamCombobox } from "@/components/qc/param-picker";
import {
  CHECK_SOURCES,
  MAX_READINGS,
  REMARK_LABEL,
  ROW_KIND,
  ROW_KINDS,
  SOURCE,
  cloneRow,
  paramOf,
  type QiRow,
  type RemarkMode,
  type RowKind,
  type SourceId,
} from "@/lib/qc-erp";

/* ------------------------------------------------------------------
   ตารางตั้งหัวข้อตรวจ + กล่องแก้ไข — ใช้ร่วมกันทุกฟอร์ม

   ตารางเก็บสี่ช่องที่ต้องกวาดตาเทียบข้ามแถว — ประเภทข้อมูล หัวข้อ เกณฑ์
   ใครตัดสิน ที่เหลือไปอยู่ในกล่องแก้ไข

   ช่องเกณฑ์ในตารางโชว์ "เกณฑ์ที่ผู้ตรวจอ่าน" เป็นบรรทัดหลัก แล้วสรุปวิธีตัดสิน
   ของเครื่องไว้บรรทัดรอง — คนที่กวาดตาดูตารางอยากรู้ว่าข้อนี้ตรวจอะไร
   ไม่ได้อยากรู้ว่า min_value เท่าไหร่ ตัวเลขพวกนั้นดูในกล่องตอนจะแก้ก็ทัน

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
 * สรุปวิธีตัดสินของเครื่องเป็นบรรทัดเดียว — ไว้ใต้เกณฑ์ที่คนอ่าน
 *
 * ไล่ตามติ๊กสามตัวของ ERPNext ตรงตัว เพราะสามตัวนั้นคือทั้งหมดที่กำหนดว่า
 * ผู้ตรวจจะเจอช่องแบบไหนและใครเป็นคนชี้ขาด
 */
export function judgeSummary(r: QiRow): string {
  if (r.kind === "system") return "ดึงจากระบบ · ผู้ตรวจเลือกจากรายการ";
  const bits = [r.numeric ? "ตัวเลข" : "ข้อความ"];
  if (r.formulaBased) bits.push("สูตร");
  if (r.manualInspection) bits.push("ผู้ตรวจตัดสินเอง");
  if (r.numeric && r.readings > 1) bits.push(`ระบุ ${r.readings} ค่า`);
  return bits.join(" · ");
}

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
  if (r.kind === "system" || r.manualInspection || r.formulaBased) return null;
  if (r.numeric && r.max === null)
    return "หัวข้อนี้ยังไม่ได้ใส่ช่วงที่ถือว่าผ่าน ระบบจึงไม่มีอะไรไว้ตัดสิน ต้องให้ผู้ตรวจตัดสินเอง ไม่งั้นข้อนี้จะขึ้นว่าไม่ผ่านทุกใบ";
  if (!r.numeric && r.value.trim() === "")
    return "หัวข้อนี้ยังไม่ได้ใส่ค่าที่ถือว่าผ่าน ระบบจึงไม่มีอะไรไว้ตัดสิน ต้องให้ผู้ตรวจตัดสินเอง ไม่งั้นข้อนี้จะขึ้นว่าผ่านทุกใบ";
  return null;
}

/**
 * นับข้อที่เว้นเกณฑ์ว่างไว้ แยกตามว่าจะเพี้ยนไปทางไหน
 *
 * ใช้ตอนกดบันทึกเป็นด่านสุดท้าย — แถบเตือนที่หัวตารางมองข้ามได้ถ้าเลื่อนผ่านไป
 * ตอนบันทึกคือจังหวะเดียวที่ยังทันแก้ก่อนเอาไปใช้จริง
 */
export function criteriaProblems(rows: QiRow[]) {
  const alwaysPass = rows.filter(
    (r) =>
      r.kind !== "system" &&
      !r.manualInspection &&
      !r.formulaBased &&
      !r.numeric &&
      r.value.trim() === ""
  );
  const alwaysFail = rows.filter(
    (r) =>
      r.kind !== "system" &&
      !r.manualInspection &&
      !r.formulaBased &&
      r.numeric &&
      r.max === null
  );
  return { alwaysPass, alwaysFail, total: alwaysPass.length + alwaysFail.length };
}

const numText = (v: number | null) => (v === null ? "" : String(v));
const toNum = (v: string) => {
  const t = v.trim();
  if (t === "") return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
};

/* ==================================================================
   ตาราง
================================================================== */

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

  const duplicate = (i: number) => {
    const next = [...rows];
    next.splice(i + 1, 0, cloneRow(rows[i]));
    onChange(next);
  };

  return (
    <>
      <CriteriaBanner
        rows={rows}
        onFixAll={(ids) =>
          onChange(
            rows.map((r) =>
              ids.includes(r.id) ? { ...r, manualInspection: true } : r
            )
          )
        }
      />

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full min-w-[900px]">
          <thead>
            <tr className="border-b border-border text-sm text-muted-foreground">
              <th className="w-40 px-4 py-3 text-left font-normal">
                ประเภทข้อมูล
              </th>
              <th className="px-4 py-3 text-left font-normal">หัวข้อตรวจ</th>
              <th className="px-4 py-3 text-left font-normal">เกณฑ์</th>
              <th className="w-32 px-4 py-3 text-center font-normal">
                ผู้ตรวจตัดสินเอง
              </th>
              <th className="w-36 px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id} className="border-b border-border last:border-0">
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
                </td>

                <td className="px-4 py-3 align-top">
                  {r.kind === "system" ? (
                    <p className="py-2 text-sm text-muted-foreground">
                      ไม่มีการตัดสิน เนื่องจากเป็นการเลือกข้อมูลที่ใช้ตรวจสอบ
                    </p>
                  ) : (
                    <div className="py-1">
                      <p className="text-sm">
                        {r.criteria.trim() || (
                          <span className="text-muted-foreground">
                            ยังไม่ได้เขียนเกณฑ์
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {judgeSummary(r)}
                      </p>
                    </div>
                  )}
                </td>

                <td className="px-4 py-3 text-center align-top">
                  <Checkbox
                    aria-label="ผู้ตรวจตัดสินเอง"
                    // ขอบแดงชี้ว่าแถบเตือนข้างบนกำลังพูดถึงแถวไหน ฟอร์มยี่สิบสี่ข้อ
                    // ถ้าบอกแต่ชื่อหัวข้อก็ยังต้องไล่หาเองอยู่ดี
                    className={cn(
                      "mt-3",
                      blankCriteriaWarning(r) &&
                        "border-danger-strong data-[state=unchecked]:border-danger-strong"
                    )}
                    checked={r.manualInspection}
                    disabled={r.kind === "system"}
                    onCheckedChange={(v) =>
                      onPatch(r.id, { manualInspection: v === true })
                    }
                  />
                </td>

                <td className="px-4 py-3 align-top">
                  <div className="mt-1 flex items-center justify-end">
                    {/* ไอคอนเดียวสลับขึ้นลง — คลิกซ้ายครึ่งบนคือขึ้น ครึ่งล่างคือลง
                        ใช้ปุ่มเดียวแทนลูกศรสองอัน ตารางจะได้ไม่กว้างเกินจำเป็น */}
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="เลื่อนขึ้น"
                      disabled={i === 0}
                      onClick={() => move(i, -1)}
                    >
                      <ChevronsUpDownIcon />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="คัดลอกหัวข้อนี้"
                      onClick={() => duplicate(i)}
                    >
                      <CopyIcon />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="ตั้งค่าหัวข้อนี้"
                      disabled={r.kind === "system"}
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
                <td colSpan={5} className="px-4 py-14 text-center">
                  <p className="font-medium">ไม่มีข้อมูล</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    กรุณาเพิ่มหัวข้อตรวจ
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

/* ==================================================================
   แถบเตือนรวมเหนือตาราง — ไม่ติ๊กให้เองเงียบ ๆ

   ข้อที่เว้นเกณฑ์ว่างมีสองความหมายที่หน้าตาเหมือนกันเป๊ะ คือ "ตั้งใจให้คนตัดสิน"
   กับ "ลืมใส่เกณฑ์" ติ๊กให้เองอัตโนมัติคือเลือกข้างให้ว่าเป็นอันแรกเสมอ
   ซึ่งทำให้ข้อที่ลืมใส่เกณฑ์กลายเป็นข้อที่ไม่มีวันถูกตรวจอัตโนมัติอีกเลย
   โดยคนตั้งค่าไม่เคยรู้ว่าตัวเองลืม — เป็นปัญหาชนิดเดียวกับที่กำลังจะแก้

   ให้ปุ่มกดแทน จบในคลิกเดียวเหมือนกัน แต่คนกดเป็นคนตัดสินว่าอันไหนคืออันไหน
================================================================== */

function CriteriaBanner({
  rows,
  onFixAll,
}: {
  rows: QiRow[];
  onFixAll: (ids: string[]) => void;
}) {
  const bad = rows.filter((r) => blankCriteriaWarning(r) !== null);
  if (bad.length === 0) return null;

  const names = bad.map((r) => rowTitle(r) || "หัวข้อที่ยังไม่ได้เลือก");
  const head =
    bad.length <= 3
      ? `หัวข้อตรวจ ${names.join(" · ")} ยังไม่ได้กำหนดวิธีการตัดสินผล`
      : `มี ${bad.length} หัวข้อตรวจที่ยังไม่ได้กำหนดวิธีการตัดสินผล`;

  return (
    <div className="mb-3 flex flex-wrap items-start justify-between gap-3 rounded-xl border border-danger-border bg-danger px-4 py-3">
      <div className="flex min-w-0 items-start gap-2">
        <CircleXIcon className="mt-0.5 size-4 shrink-0 text-danger-strong" />
        <div className="min-w-0">
          <p className="font-medium text-danger-strong">{head}</p>
          <p className="mt-0.5 text-sm">
            ระบบไม่สามารถประเมินผลได้ กรุณากำหนดการตัดสิน
            หรือเลือกให้ผู้ตรวจตัดสินผลเอง
          </p>
        </div>
      </div>
      <Button
        variant="outline"
        className="shrink-0 bg-card"
        onClick={() => onFixAll(bad.map((r) => r.id))}
      >
        ผู้ตรวจตัดสินเอง
      </Button>
    </div>
  );
}

/* ==================================================================
   กล่องตั้งค่าหัวข้อ

   ติ๊กสามตัวเรียงติดกันเป็นชิปใต้คำว่า "ประเภทการตัดสิน" ตรงกับ ERPNext ที่
   numeric / formula_based_criteria / manual_inspection เป็น Check สามตัวที่
   ไม่มี depends_on ทั้งสามตัว ติ๊กครบทุกแบบได้ และแต่ละแบบให้ผลคนละอย่าง

   ช่องใต้ชิปเปลี่ยนตามที่ติ๊ก — สูตร / ช่วงต่ำ-สูง / ค่าที่ถือว่าผ่าน
   ซึ่งตรงกับ depends_on ของ ERPNext ตัวต่อตัว
================================================================== */

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
  const u = unit ? ` (${unit})` : "";
  const labels = row.labels ?? [];

  const setLabel = (i: number, v: string) => {
    const next = [...labels];
    while (next.length < row.readings) next.push("");
    next[i] = v;
    onChange({ labels: next });
  };

  const addReading = () => {
    if (row.readings >= MAX_READINGS) return;
    onChange({ readings: row.readings + 1, labels: [...labels, ""] });
  };

  const removeReading = (i: number) => {
    if (row.readings <= 1) return;
    const next = [...labels];
    next.splice(i, 1);
    onChange({ readings: row.readings - 1, labels: next });
  };

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>หัวข้อตรวจ</DialogTitle>
          <DialogDescription>
            กำหนดหัวข้อ เกณฑ์ การตัดสิน จำนวนค่าที่ต้องระบุ และหมายเหตุของหัวข้อ
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] space-y-4 overflow-y-auto px-1">
          <div className="grid gap-4 sm:grid-cols-[10rem_1fr]">
            <div className="space-y-1.5">
              <Label htmlFor={`${row.id}-kind`}>ประเภทข้อมูล</Label>
              <Select value={row.kind} disabled>
                <SelectTrigger id={`${row.id}-kind`} className="w-full bg-card">
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
            </div>

            <div className="space-y-1.5">
              <Label htmlFor={`${row.id}-param`}>หัวข้อตรวจ</Label>
              <ParamCombobox
                id={`${row.id}-param`}
                value={row.parameterId}
                onChange={(v) => onChange({ parameterId: v })}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={`${row.id}-c`}>
              เกณฑ์{" "}
              <span className="font-normal text-muted-foreground">
                (ไม่บังคับ)
              </span>
            </Label>
            <Textarea
              id={`${row.id}-c`}
              className="bg-card"
              rows={3}
              value={row.criteria}
              placeholder="ระบุเกณฑ์"
              onChange={(e) => onChange({ criteria: e.target.value })}
            />
            <FieldNote custom>
              custom_criteria — เขียนให้คนที่ยืนตรวจอ่าน คนละช่องกับเกณฑ์ที่
              เครื่องใช้ตัดสินข้างล่าง
            </FieldNote>
          </div>

          {/* สามตัวนี้ติ๊กพร้อมกันได้จริง ไม่ใช่ตัวเลือกที่แข่งกัน */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">
              ประเภทการตัดสิน:
            </span>
            <CheckChip
              id={`${row.id}-numeric`}
              label="ตัวเลข"
              checked={row.numeric}
              onChange={(v) =>
                // ไม่ติ๊กตัวเลข = เหลือ reading_value ช่องเดียว ช่องคีย์ 1-10
                // ถูกซ่อนทั้งก้อน (section_break_14 depends_on numeric)
                // จำนวนค่าจึงต้องตกกลับเป็น 1 ไม่ใช่ค้างเลขเดิมไว้หลอก
                onChange({ numeric: v, ...(v ? {} : { readings: 1 }) })
              }
            />
            <CheckChip
              id={`${row.id}-formula`}
              label="สูตร"
              checked={row.formulaBased}
              onChange={(v) => onChange({ formulaBased: v })}
            />
            <CheckChip
              id={`${row.id}-manual`}
              label="ผู้ตรวจตัดสินเอง"
              checked={row.manualInspection}
              onChange={(v) => onChange({ manualInspection: v })}
            />
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
                  "เช่น\nmean < 80\n\nหรือยาวกว่านั้น\n(reading_2 + reading_3) / 2500 * 100 >= 80"
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
            <div className="grid gap-4 sm:grid-cols-2">
              <StepperField
                id={`${row.id}-min`}
                label={`เริ่มต้น${u}`}
                value={row.min}
                onChange={(v) => onChange({ min: v })}
              />
              <StepperField
                id={`${row.id}-max`}
                label={`สูงสุด${u}`}
                value={row.max}
                onChange={(v) => onChange({ max: v })}
              />
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label htmlFor={`${row.id}-v`}>
                ค่าที่ถือว่าผ่าน{" "}
                <span className="font-normal text-muted-foreground">
                  (ไม่บังคับ)
                </span>
              </Label>
              <Input
                id={`${row.id}-v`}
                className="bg-card"
                value={row.value}
                placeholder="เช่น ปกติ  หรือ  30"
                onChange={(e) => onChange({ value: e.target.value })}
              />
              {/* คั่นด้วย / = ให้เลือก ไม่ใช่ให้พิมพ์ — ในใบตรวจจะขึ้นเป็น
                  ดรอปดาวน์ให้เอง ไม่ต้องตั้งประเภทเพิ่มอีกช่อง */}
              <FieldNote>value · คั่นด้วย / จะขึ้นเป็นดรอปดาวน์ในใบตรวจ</FieldNote>
            </div>
          )}

          {blankCriteriaWarning(row) && (
            <p className="text-sm text-danger-strong">
              {blankCriteriaWarning(row)}
            </p>
          )}

          {/* จำนวนค่า = จำนวนช่องที่ตั้งชื่อไว้ ไม่ใช่ตัวเลขแยกอีกช่อง
              นับจากรายการตรง ๆ แล้วตั้งชื่อไปพร้อมกัน จะได้ไม่มีทางที่จำนวนกับ
              ชื่อไม่ตรงกัน ซึ่งเกิดได้แน่ถ้าให้ปรับเลขกับแก้ชื่อคนละที่ */}
          {row.numeric && (
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold">จำนวนค่าที่ต้องระบุ</p>
                <Button
                  variant="outline-primary"
                  size="sm"
                  disabled={row.readings >= MAX_READINGS}
                  onClick={addReading}
                >
                  <PlusIcon />
                  เพิ่มจำนวน
                </Button>
              </div>

              {Array.from({ length: row.readings }, (_, i) => (
                <div key={i} className="space-y-1.5">
                  <Label htmlFor={`${row.id}-l${i}`}>
                    ชื่อช่องที่ต้องระบุ{" "}
                    <span className="font-normal text-muted-foreground">
                      (ไม่บังคับ)
                    </span>
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id={`${row.id}-l${i}`}
                      className="bg-card"
                      value={labels[i] ?? ""}
                      placeholder={`ครั้งที่ ${i + 1}`}
                      onChange={(e) => setLabel(i, e.target.value)}
                    />
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`ลบช่องที่ ${i + 1}`}
                      disabled={row.readings <= 1}
                      onClick={() => removeReading(i)}
                    >
                      <Trash2Icon />
                    </Button>
                  </div>
                </div>
              ))}

              <FieldNote custom={row.readings > 1}>
                {row.readings > 1
                  ? `reading_1…reading_${row.readings} · custom_reading_labels — ERPNext ตั้งป้ายไว้ตายตัวว่า Reading 1…10 แก้รายหัวข้อไม่ได้`
                  : "reading_1"}
              </FieldNote>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor={`${row.id}-r`}>หมายเหตุหัวข้อ</Label>
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

        <DialogFooter className="grid grid-cols-2 gap-3">
          <Button variant="outline-primary" onClick={onClose}>
            ย้อนกลับ
          </Button>
          <Button onClick={onClose}>บันทึก</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** ช่องตัวเลขที่มีปุ่มบวกลบ — ว่างได้ ซึ่งไม่ใช่เรื่องเดียวกับศูนย์ */
function StepperField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
}) {
  const step = (d: number) => onChange((value ?? 0) + d);
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-center rounded-lg border border-border bg-card">
        <Button
          variant="ghost"
          size="icon-sm"
          className="m-1"
          aria-label={`ลด ${label}`}
          onClick={() => step(-1)}
        >
          <MinusIcon />
        </Button>
        <Input
          id={id}
          inputMode="decimal"
          className="border-0 bg-transparent text-center shadow-none focus-visible:ring-0"
          value={numText(value)}
          placeholder="ไม่ระบุ"
          onChange={(e) => onChange(toNum(e.target.value))}
        />
        <Button
          variant="ghost"
          size="icon-sm"
          className="m-1"
          aria-label={`เพิ่ม ${label}`}
          onClick={() => step(1)}
        >
          <PlusIcon />
        </Button>
      </div>
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
