"use client";

import * as React from "react";
import { MinusIcon, PlusIcon } from "lucide-react";
import { Badge } from "@peckey954/ui/components/ui/badge";
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
import { Textarea } from "@peckey954/ui/components/ui/textarea";
import { cn } from "@peckey954/ui/lib/utils";
import { toast } from "sonner";
import { ChipGroup } from "@/components/chip-group";
import { FailAttachments } from "@/components/qc/fail-attachments";
import {
  SOURCE,
  VERDICT_OPTION_LABEL,
  dispositionChoices,
  dispositionRule,
  paramOf,
  passValues,
  readingLabels,
  sourcePool,
  type DocField,
  type PhotoMode,
  type QiRow,
  type QiTemplate,
  type VerdictOption,
} from "@/lib/qc-erp";

/* ------------------------------------------------------------------
   ใบตรวจที่วาดจากรายงานตรง ๆ — ใช้สองที่

     แท็บตัวอย่างรายงาน   เห็นว่าผู้ตรวจจะเจออะไร แก้โครงแล้วเปลี่ยนตามทันที
     หน้าเมนูจากหน้าหลัก  รายงานที่ไม่มีหน้าของตัวเอง ทำงานได้ด้วยใบนี้เลย

   ไม่มีอะไรตั้งไว้ในไฟล์นี้ ทุกช่องอ่านจากรายงาน — หัวเอกสาร หัวข้อตรวจ
   ปุ่มตัดสิน หมายเหตุ แนบไฟล์ และผลตรวจที่ไม่ผ่าน

   ช่องที่ตั้งเป็น "บังคับเมื่อไม่ผ่าน" ป้ายเปลี่ยนตามผลจริง — ยังไม่มีข้อตกขึ้น
   ว่าไม่บังคับ พอมีข้อตกเปลี่ยนเป็นบังคับทันที คนกรอกรู้ก่อนกดบันทึก
------------------------------------------------------------------ */

export type RowState = {
  verdict: VerdictOption | "";
  nums: string[];
  text: string;
  source: string;
  remark: string;
};

const EMPTY: RowState = { verdict: "", nums: [], text: "", source: "", remark: "" };

/**
 * รันสูตรของ ERPNext กับค่าที่คีย์ — reading_1…reading_10, mean, and/or/not
 *
 * ตัวรันจริงอยู่ที่ ERPNext ตอนบันทึก (frappe.safe_eval) ตรงนี้รันให้เห็นผล
 * ตั้งแต่หน้างาน แทนที่ตัวเลขด้วยค่าก่อนแล้วยอมเฉพาะตัวเลขกับเครื่องหมาย
 * ไม่มีชื่ออื่นเหลือให้เรียกอะไรได้ สูตรที่อ่านไม่ออกคืนว่างไว้ ไม่ใช่เดาว่าตก
 */
function runFormula(f: string, vals: number[]): boolean | null {
  const mean = vals.reduce((a, b) => a + b, 0) / (vals.length || 1);
  const expr = f
    .replace(/reading_(\d+)/g, (_, n) => String(vals[Number(n) - 1] ?? NaN))
    .replace(/\bmean\b/g, String(mean))
    .replace(/\band\b/g, "&&")
    .replace(/\bor\b/g, "||")
    .replace(/\bnot\b/g, "!");
  if (!/^[\d.\s+\-*/()<>=!&|NaN]+$/.test(expr)) return null;
  try {
    const out = new Function(`return (${expr});`)();
    return typeof out === "boolean" ? out : null;
  } catch {
    return null;
  }
}

/** ผลของหนึ่งหัวข้อ — ระบบตัดสินให้เมื่อมีเกณฑ์ที่เทียบได้ ที่เหลือผู้ตรวจกดเอง */
function judge(row: QiRow, st: RowState): VerdictOption | "" {
  if (askVerdict(row)) return st.verdict;
  if (row.numeric) {
    const vals = st.nums.slice(0, row.readings).map((x) => Number(x));
    if (vals.length < row.readings || st.nums.some((x) => x.trim() === ""))
      return "";
    if (row.formulaBased) {
      const ok = runFormula(row.formula, vals);
      return ok === null ? "" : ok ? "pass" : "fail";
    }
    const lo = row.min ?? 0;
    const hi = row.max ?? 0;
    return vals.every((v) => Number.isFinite(v) && v >= lo && v <= hi) ? "pass" : "fail";
  }
  if (st.text.trim() === "") return "";
  const ok = passValues(row.value).map((v) => v.toLowerCase());
  return ok.includes(st.text.trim().toLowerCase()) ? "pass" : "fail";
}

/** ผู้ตรวจต้องกดผลเองไหม — ติ๊กตัดสินเอง หรือไม่มีเกณฑ์ให้เทียบ
 *  สูตรที่ไม่ใช้ตัวเลข (reading_value) ยังรันที่นี่ไม่ได้ ให้ผู้ตรวจกดเอง */
const askVerdict = (row: QiRow) =>
  row.kind === "system" ||
  row.manualInspection ||
  (row.formulaBased && !row.numeric) ||
  (!row.numeric && !row.formulaBased && row.value.trim() === "");

const rowName = (row: QiRow) => {
  if (row.kind === "system") return row.source ? SOURCE[row.source].label : "ยังไม่ได้เลือกข้อมูล";
  const p = paramOf(row.parameterId);
  if (!p) return "ยังไม่ได้เลือกหัวข้อ";
  return p.unit ? `${p.name} (${p.unit})` : p.name;
};

const fieldName = (f: DocField) =>
  f.kind === "system" ? (f.source ? SOURCE[f.source].label : "ยังไม่ได้เลือกข้อมูล") : f.label || "ไม่มีชื่อ";

/** บังคับไหม ตามที่ตั้งไว้ และตามผลตอนนี้ */
const mustFill = (mode: PhotoMode, failed: boolean) =>
  mode === "required" || (mode === "onFail" && failed);

function Hint({ mode, failed }: { mode: PhotoMode; failed: boolean }) {
  const must = mustFill(mode, failed);
  return (
    <span className={cn("font-normal", must ? "text-danger-strong" : "text-muted-foreground")}>
      {must ? "(บังคับ)" : "(ไม่บังคับ)"}
    </span>
  );
}

/** สิ่งที่ผู้ตรวจกรอกทั้งใบ — ส่งเข้ามาเปิดใบเดิมขึ้นมาแก้ และส่งออกตอนบันทึก */
export type FormValues = {
  header: Record<string, string>;
  rows: Record<string, RowState>;
  disposition: string;
  note: string;
  /** ผลรวมที่ผู้ตรวจชี้เอง — ใช้เมื่อตั้ง "ผู้ตรวจตัดสินเองทั้งใบ" */
  whole?: "" | "pass" | "fail";
};

export type FormResult = {
  values: FormValues;
  /** ผลรวมทั้งใบ */
  overall: "pass" | "fail";
  /** ผลรายข้อ คีย์คือ id ของแถว */
  verdicts: Record<string, VerdictOption | "">;
  failed: boolean;
};

export function TemplateForm({
  tpl,
  title,
  initial,
  onSubmit,
  onBack,
  before,
}: {
  tpl: QiTemplate;
  title: string;
  initial?: FormValues;
  /** ส่งมา = ใบจริง มีแถบบันทึกท้ายหน้าและเช็คความครบก่อนบันทึก */
  onSubmit?: (r: FormResult) => void;
  onBack?: () => void;
  /** ของที่อยู่ระหว่างชื่อใบกับหัวเอกสาร เช่น รอบเวลา */
  before?: React.ReactNode;
}) {
  const [rows, setRows] = React.useState<Record<string, RowState>>(initial?.rows ?? {});
  const [header, setHeader] = React.useState<Record<string, string>>(initial?.header ?? {});
  const [disposition, setDisposition] = React.useState(initial?.disposition ?? "");
  const [note, setNote] = React.useState(initial?.note ?? "");
  const [whole, setWhole] = React.useState<"" | "pass" | "fail">(initial?.whole ?? "");
  const [files, setFiles] = React.useState(0);

  const stOf = (id: string) => rows[id] ?? EMPTY;
  const patch = (id: string, p: Partial<RowState>) =>
    setRows((prev) => ({ ...prev, [id]: { ...stOf(id), ...p } }));

  const verdicts = tpl.rows.map((r) => judge(r, stOf(r.id)));
  /* ผู้ตรวจชี้ผลทั้งใบเอง เฉพาะใบที่มีข้อซึ่งระบบตัดสินให้ — ถ้าทุกข้อผู้ตรวจกดเอง
     อยู่แล้ว ผลรวมก็คือผลของข้อเหล่านั้น ถามซ้ำอีกช่องมีแต่จะขัดกันเอง */
  const askWhole = tpl.manualWholeDoc && tpl.rows.some((r) => !askVerdict(r));
  const failed = askWhole ? whole === "fail" : verdicts.includes("fail");
  const rule = dispositionRule(tpl);
  const choices = dispositionChoices(tpl);
  const picked = disposition || (choices.length === 1 ? choices[0].id : "");
  const fields = tpl.headerOn ? tpl.header : [];

  const submit = () => {
    const missing: string[] = [];
    for (const f of fields)
      if (f.required && !header[f.id]?.trim()) missing.push(fieldName(f));
    tpl.rows.forEach((r, i) => {
      if (verdicts[i] === "") missing.push(`ผลข้อ ${i + 1}`);
      const rowFailed = verdicts[i] === "fail";
      if (r.remark !== "off" && mustFill(r.remark, rowFailed) && !stOf(r.id).remark.trim())
        missing.push(`หมายเหตุข้อ ${i + 1}`);
    });
    if (askWhole && !whole) missing.push("ผลการตรวจสอบ");
    if (failed && rule === "required" && !picked) missing.push("ประเภทการรับสินค้า");
    if (tpl.photo !== "off" && mustFill(tpl.photo, failed) && files === 0)
      missing.push("เอกสาร/รูปภาพ");
    if (tpl.remark !== "off" && mustFill(tpl.remark, failed) && !note.trim())
      missing.push("หมายเหตุ");

    if (missing.length > 0) {
      toast.error("ยังกรอกไม่ครบ", {
        description:
          missing.length <= 3 ? missing.join(" · ") : `${missing.slice(0, 3).join(" · ")} และอีก ${missing.length - 3} ช่อง`,
      });
      return;
    }
    onSubmit?.({
      values: { header, rows, disposition: picked, note, whole },
      overall: failed ? "fail" : "pass",
      verdicts: Object.fromEntries(tpl.rows.map((r, i) => [r.id, verdicts[i]])),
      failed,
    });
  };

  return (
    <>
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      {before}

      <h3 className="mt-5 font-semibold">การตรวจสอบ</h3>

      {fields.length > 0 && (
        <div
          className={cn(
            "mt-3 grid gap-4 @2xl:grid-cols-2",
            fields.length >= 3 && "@4xl:grid-cols-3"
          )}
        >
          {fields.map((f) => {
            const name = fieldName(f);
            const id = `form-hd-${f.id}`;
            return (
              <div key={f.id} className="space-y-1.5">
                <Label htmlFor={id}>
                  {name}
                  {!f.required && (
                    <span className="font-normal text-muted-foreground">(ไม่บังคับ)</span>
                  )}
                </Label>
                {f.kind === "system" && f.source ? (
                  <Select
                    value={header[f.id] ?? ""}
                    onValueChange={(v) => setHeader((h) => ({ ...h, [f.id]: v }))}
                  >
                    <SelectTrigger id={id} className="w-full bg-card">
                      <SelectValue placeholder={`เลือก${name}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {sourcePool(f.source).map((o) => (
                        <SelectItem key={o} value={o}>
                          {o}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id={id}
                    className="bg-card"
                    placeholder={`ระบุ${name}`}
                    value={header[f.id] ?? ""}
                    onChange={(e) => setHeader((h) => ({ ...h, [f.id]: e.target.value }))}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-4 space-y-3">
        {tpl.rows.map((r, i) => (
          <FormRow
            key={r.id}
            index={i + 1}
            row={r}
            options={tpl.verdicts}
            state={stOf(r.id)}
            verdict={verdicts[i]}
            onChange={(p) => patch(r.id, p)}
          />
        ))}
        {tpl.rows.length === 0 && (
          <p className="rounded-lg border border-dashed border-border px-6 py-12 text-center text-sm text-muted-foreground">
            ยังไม่มีหัวข้อตรวจ
          </p>
        )}
      </div>

      {askWhole && (
        <div className="mt-5 space-y-1.5">
          <Label>ผลการตรวจสอบ</Label>
          <ChipGroup
            label="ผลการตรวจสอบทั้งใบ"
            value={whole}
            onChange={setWhole}
            options={[
              { id: "pass" as const, label: "ผ่าน" },
              { id: "fail" as const, label: "ไม่ผ่าน" },
            ]}
          />
        </div>
      )}

      {/* ตัวเลือกเดียวเลือกไว้ให้เลย ไม่มีอะไรให้ตัดสินใจ */}
      {failed && rule !== "none" && (
        <div className="mt-5 space-y-1.5">
          <Label>
            ประเภทการรับสินค้า กรณีไม่ผ่านข้อใดข้อหนึ่ง
            <span
              className={cn(
                "font-normal",
                rule === "required" ? "text-danger-strong" : "text-muted-foreground"
              )}
            >
              {rule === "required" ? "(บังคับ)" : "(ไม่บังคับ)"}
            </span>
          </Label>
          <ChipGroup
            label="ประเภทการรับสินค้า"
            value={picked}
            onChange={setDisposition}
            options={choices.map((d) => ({ id: d.id, label: d.label }))}
          />
        </div>
      )}

      {tpl.photo !== "off" && (
        <div className="mt-5">
          <FailAttachments
            title={`เอกสาร/รูปภาพ ${mustFill(tpl.photo, failed) ? "(บังคับ)" : "(ไม่บังคับ)"}`}
            onCountChange={setFiles}
          />
        </div>
      )}

      {tpl.remark !== "off" && (
        <div className="mt-5 space-y-1.5">
          <Label htmlFor="form-note">
            หมายเหตุ <Hint mode={tpl.remark} failed={failed} />
          </Label>
          <Textarea
            id="form-note"
            className="bg-card"
            rows={3}
            placeholder="ระบุหมายเหตุ"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
      )}

      {onSubmit && (
        <div className="sticky bottom-0 z-30 -mx-4 mt-8 border-t border-border bg-surface px-4 py-3 sm:-mx-6 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <Button variant="outline-primary" onClick={onBack}>
              ย้อนกลับ
            </Button>
            <Button className="w-28" onClick={submit}>
              บันทึก
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

function FormRow({
  index,
  row,
  options,
  state,
  verdict,
  onChange,
}: {
  index: number;
  row: QiRow;
  options: VerdictOption[];
  state: RowState;
  verdict: VerdictOption | "";
  onChange: (p: Partial<RowState>) => void;
}) {
  const ask = askVerdict(row);
  const labels = readingLabels(row);

  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="font-semibold">
          {index}. {rowName(row)}
        </p>
        {/* ระบบตัดสินให้ — โชว์ผลทันทีที่กรอกครบ ข้อที่ผู้ตรวจกดเองไม่ต้องมีป้ายซ้ำ */}
        {!ask && verdict !== "" && (
          <Badge appearance="soft" tone={verdict === "pass" ? "success" : "danger"}>
            {VERDICT_OPTION_LABEL[verdict]}
          </Badge>
        )}
      </div>
      {row.criteria.trim() && (
        <p className="mt-0.5 text-sm text-muted-foreground">เกณฑ์: {row.criteria}</p>
      )}

      {row.kind === "system" && row.source && (
        <div className="mt-3 max-w-md">
          <Select value={state.source} onValueChange={(v) => onChange({ source: v })}>
            <SelectTrigger aria-label={rowName(row)} className="w-full bg-card">
              <SelectValue placeholder={`เลือก${SOURCE[row.source].label}`} />
            </SelectTrigger>
            <SelectContent>
              {sourcePool(row.source).map((o) => (
                <SelectItem key={o} value={o}>
                  {o}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* ตัวเลขกับหมายเหตุอยู่แถวเดียวกันบนจอกว้าง — สองสามช่องสั้น ๆ
          เรียงลงทีละบรรทัดแล้วการ์ดสูงเกินจำเป็น */}
      {row.kind === "text" && row.numeric && (
        <div
          className={cn(
            "mt-3 grid gap-3 @lg:grid-cols-2",
            labels.length + (row.remark !== "off" ? 1 : 0) >= 3 && "@3xl:grid-cols-3"
          )}
        >
          {labels.map((l, i) => (
            <div key={i} className="space-y-1.5">
              <Label htmlFor={`${row.id}-n${i}`}>{l}</Label>
              <Stepper
                id={`${row.id}-n${i}`}
                value={state.nums[i] ?? ""}
                onChange={(v) => {
                  const nums = [...state.nums];
                  while (nums.length < row.readings) nums.push("");
                  nums[i] = v;
                  onChange({ nums });
                }}
              />
            </div>
          ))}
          {row.remark !== "off" && (
            <RemarkField row={row} state={state} verdict={verdict} onChange={onChange} />
          )}
        </div>
      )}

      {row.kind === "text" && !row.numeric && !ask && (
        <div className="mt-3 max-w-md">
          <Input
            aria-label={rowName(row)}
            className="bg-card"
            placeholder="ระบุผล"
            value={state.text}
            onChange={(e) => onChange({ text: e.target.value })}
          />
        </div>
      )}

      {ask && (
        <div className="mt-3 space-y-1.5">
          <Label>ผลการตรวจสอบ</Label>
          <ChipGroup
            label={`ผลการตรวจสอบข้อ ${index}`}
            value={state.verdict}
            onChange={(v) => onChange({ verdict: v })}
            options={options.map((o) => ({ id: o, label: VERDICT_OPTION_LABEL[o] }))}
          />
        </div>
      )}

      {row.remark !== "off" && !(row.kind === "text" && row.numeric) && (
        <div className="mt-3">
          <RemarkField row={row} state={state} verdict={verdict} onChange={onChange} />
        </div>
      )}
    </section>
  );
}

function RemarkField({
  row,
  state,
  verdict,
  onChange,
}: {
  row: QiRow;
  state: RowState;
  verdict: VerdictOption | "";
  onChange: (p: Partial<RowState>) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={`${row.id}-remark`}>
        หมายเหตุ <Hint mode={row.remark} failed={verdict === "fail"} />
      </Label>
      <Input
        id={`${row.id}-remark`}
        className="bg-card"
        placeholder="ระบุหมายเหตุ"
        value={state.remark}
        onChange={(e) => onChange({ remark: e.target.value })}
      />
    </div>
  );
}

/** ช่องตัวเลขมีปุ่มลบ/บวก — หน้างานกดเพิ่มทีละขั้นได้ด้วยนิ้ว ไม่ต้องเปิดคีย์บอร์ด */
function Stepper({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const step = (d: number) => {
    const n = Number(value || 0) + d;
    onChange(String(Math.round(n * 100) / 100));
  };
  return (
    <div className="flex h-9 items-center rounded-md border border-input bg-card shadow-xs focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50">
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="ลด"
        className="ml-1 shrink-0"
        onClick={() => step(-0.1)}
      >
        <MinusIcon />
      </Button>
      <input
        id={id}
        inputMode="decimal"
        className="h-full min-w-0 flex-1 bg-transparent text-center text-sm outline-none tabular-nums"
        placeholder="0.00"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/[^\d.-]/g, ""))}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="เพิ่ม"
        className="mr-1 shrink-0"
        onClick={() => step(0.1)}
      >
        <PlusIcon />
      </Button>
    </div>
  );
}
