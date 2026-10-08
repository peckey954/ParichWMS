"use client";

import * as React from "react";
import Link from "next/link";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  FlaskConicalIcon,
  MinusIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@peckey954/ui/components/ui/alert";
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@peckey954/ui/components/ui/tabs";
import { cn } from "@peckey954/ui/lib/utils";
import { ITEM_POOL, QI_PARAMETERS } from "@/lib/qc-erp";

/* ------------------------------------------------------------------
   ตัวอย่างหน้าตั้งค่าแบบใหม่ — หน้าแยก ไม่แตะของจริง

   หน้านี้ไม่ได้ต่อกับ QI_TEMPLATES ตั้งอะไรในนี้ไม่กระทบเทมเพลตจริงสักใบ

   ตารางเก็บเฉพาะสี่อย่างที่ต้องกวาดตาเทียบข้ามแถว — หัวข้อ ประเภทข้อมูล
   เกณฑ์ ใครตัดสิน ที่เหลือไปอยู่ในกล่องแก้ไข

   ใช้กล่องแทนการกางแถวในตาราง เพราะตารางนี้เลื่อนแนวนอนได้ แถวที่กางออกมา
   จะอยู่ในพื้นที่เลื่อนไปด้วย กางแล้วต้องเลื่อนกลับมาซ้ายถึงจะเห็น

   ชื่อหัวข้อเป็นดรอปดาวน์เสมอ ไม่ใช่ช่องพิมพ์ — ของ ERPNext ช่อง specification
   เป็น Link ไปทะเบียน Quality Inspection Parameter พิมพ์อิสระไม่ได้อยู่แล้ว
   และนั่นคือตัวกันไม่ให้เกิด "ความชื้น" กับ "ความชื้น (%)" เป็นคนละหัวข้อ

   ติ๊กสามตัว numeric / formula_based_criteria / manual_inspection เป็น Check
   อิสระจากกันใน ERPNext จริง ๆ จึงเป็นกล่องติ๊ก ไม่ใช่ตัวเลือกที่แข่งกันเอง
------------------------------------------------------------------ */

const MAX_READINGS = 10;

// ---------------------------------------------------------------
// แหล่งข้อมูลที่ดึงมาให้เลือกได้
//
// custom = Quality Inspection ไม่มีช่องให้เก็บ ไม่ใช่ว่าทำไม่ได้
// แต่ต้องไปอยู่ doctype QC Check ที่เราสร้างเอง
// ---------------------------------------------------------------

type SourceId =
  | "item"
  | "docPr"
  | "docDn"
  | "docSe"
  | "docJc"
  | "batch"
  | "user"
  | "warehouse"
  | "machine";

const SOURCE: Record<
  SourceId,
  { label: string; store: string; custom: boolean; pool: string[] }
> = {
  item: {
    label: "สินค้า",
    store: "item_code → Item",
    custom: false,
    pool: ITEM_POOL,
  },
  docPr: {
    label: "ใบรับสินค้าภายนอก",
    store: "reference_type = Purchase Receipt · reference_name",
    custom: false,
    pool: ["PR260115/01-01", "PR260115/01-02", "PR260114/03-01"],
  },
  docDn: {
    label: "ใบส่งของ",
    store: "reference_type = Delivery Note · reference_name",
    custom: false,
    pool: ["DN260115/01-01", "DN260114/02-01"],
  },
  docSe: {
    label: "ใบเบิก-โอนสต็อก",
    store: "reference_type = Stock Entry · reference_name",
    custom: false,
    pool: ["SE260115/01-01", "SE260115/01-02"],
  },
  docJc: {
    label: "ใบงานผลิต",
    store: "reference_type = Job Card · reference_name",
    custom: false,
    pool: ["JC260115/L1-01", "JC260115/L2-01"],
  },
  batch: {
    label: "ล็อต",
    store: "batch_no → Batch",
    custom: false,
    pool: ["LOT-260115-01", "LOT-260115-02"],
  },
  user: {
    label: "ผู้ตรวจ",
    store: "inspected_by → User",
    custom: false,
    pool: ["อลิสา พรสุขสิริ", "ณัฐพล ศรีวิไล"],
  },
  warehouse: {
    label: "คลังสินค้า",
    store: "QC Check · Link → Warehouse",
    custom: true,
    pool: [
      "สต็อกทั่วไป",
      "สต็อกวัตถุดิบ",
      "สต็อกสินค้า",
      "สต็อก WIP",
      "สต็อก CWIP",
    ],
  },
  machine: {
    label: "เครื่องจักร",
    store: "QC Check · Link → Asset",
    custom: true,
    pool: ["L1", "L2"],
  },
};

const SOURCE_IDS = Object.keys(SOURCE) as SourceId[];

/* หัวข้อตรวจดึงได้แค่สามอย่าง — ของที่ "ตรวจ" ได้จริง
   เอกสารกับผู้ตรวจไม่ได้อยู่ในนี้เพราะมันเป็นของหัวใบ ไม่ใช่หัวข้อที่ตัดสินผ่าน */
const CHECK_SOURCES: SourceId[] = ["item", "warehouse", "machine"];

// ---------------------------------------------------------------

type Kind = "text" | "system";

const KIND: Record<Kind, { label: string; store: string }> = {
  text: {
    label: "ข้อความ",
    store: "specification → ทะเบียนหัวข้อตรวจ",
  },
  system: {
    label: "ดึงจากระบบ",
    store: "ผู้ตรวจเลือกจากรายการของระบบ ไม่ได้พิมพ์เอง",
  },
};

const KINDS = Object.keys(KIND) as Kind[];

type RemarkMode = "off" | "optional" | "onFail";

const REMARK: Record<RemarkMode, string> = {
  off: "ไม่มี",
  optional: "ไม่บังคับ",
  onFail: "บังคับเมื่อไม่ผ่าน",
};

const REMARK_KEYS = Object.keys(REMARK) as RemarkMode[];

type CheckRow = {
  id: string;
  kind: Kind;
  /** ชื่อหัวข้อจากทะเบียน — ใช้เมื่อ kind = text */
  name: string;
  /** ของที่ดึงมา — ใช้เมื่อ kind = system และเป็นชื่อหัวข้อไปในตัว */
  source: SourceId | "";
  /** numeric — คีย์ตัวเลขหลายค่า ไม่ติ๊กคือคีย์ข้อความช่องเดียว */
  numeric: boolean;
  /** formula_based_criteria — ติ๊กคู่กับ numeric ได้ */
  formulaBased: boolean;
  /** manual_inspection — ติ๊กคู่กับสองอันบนได้ ระบบจะเก็บค่าแต่ไม่ตัดสินให้ */
  manual: boolean;
  min: string;
  max: string;
  formula: string;
  value: string;
  /** reading_1…reading_10 — เพดานสิบเป็นของ ERPNext */
  readings: number;
  /** custom_reading_labels — ชื่อกำกับทีละช่อง ว่างได้ ตกเป็น "ครั้งที่ N" */
  labels: string[];
  /** custom_criteria — เกณฑ์ที่เขียนให้คนยืนตรวจอ่าน */
  criteria: string;
  remark: RemarkMode;
};

let seq = 0;
const nid = () => `n-${++seq}`;

const blankCheck = (): CheckRow => ({
  id: nid(),
  kind: "text",
  name: "",
  source: "",
  numeric: false,
  formulaBased: false,
  manual: true,
  min: "",
  max: "",
  formula: "",
  value: "",
  readings: 1,
  labels: [],
  criteria: "",
  remark: "onFail",
});

const mk = (p: Partial<CheckRow>): CheckRow => ({ ...blankCheck(), ...p });

const SEED_CHECKS: CheckRow[] = [
  mk({
    kind: "system",
    source: "item",
    readings: 3,
    labels: ["กระสอบที่ 1", "กระสอบที่ 2", "กระสอบที่ 3"],
    criteria: "สุ่มจากกองที่เพิ่งออกจากไลน์",
  }),
  mk({
    name: "น้ำหนักบรรจุ",
    numeric: true,
    manual: false,
    min: "50.2",
    max: "50.8",
    readings: 3,
    criteria: "ชั่งทุกกระสอบที่สุ่ม",
  }),
  mk({
    name: "การเย็บกระสอบ",
    criteria: "ด้ายต้องติดตลอดแนว ฝีเข็มสม่ำเสมอ ไม่หลุดไม่ขาด",
  }),
  mk({
    name: "ความชื้น",
    numeric: true,
    formulaBased: true,
    manual: false,
    formula: "mean < 80",
    readings: 3,
    criteria: "เฉลี่ยทั้งชุดต้องไม่เกินเกณฑ์",
  }),
  mk({
    kind: "system",
    source: "machine",
    criteria: "ระบุเครื่องที่ผลิตล็อตนี้",
  }),
];

// ---------------------------------------------------------------
// ส่วนหัวเอกสาร — ช่องที่กรอกครั้งเดียวต่อใบ
// ---------------------------------------------------------------

type DocField = {
  id: string;
  label: string;
  source: SourceId | "";
  required: boolean;
};

const SEED_HEADER: DocField[] = [
  { id: nid(), label: "วัตถุดิบสินค้า", source: "item", required: true },
  { id: nid(), label: "เลขที่เอกสาร", source: "docPr", required: true },
];

// ---------------------------------------------------------------
// อ่านจากที่ตั้งไว้ ไม่ได้เก็บแยก
// ---------------------------------------------------------------

const rowName = (r: CheckRow) =>
  r.kind === "system"
    ? r.source === ""
      ? ""
      : SOURCE[r.source].label
    : r.name;

const readingLabels = (r: CheckRow) =>
  Array.from(
    { length: r.readings },
    (_, i) => r.labels[i]?.trim() || `ครั้งที่ ${i + 1}`
  );

/** สรุปเกณฑ์ลงช่องเดียวในตาราง — ตรงกับที่ ERPNext จะเอาไปตัดสินจริง */
function describeCriteria(r: CheckRow) {
  if (r.formulaBased) return r.formula.trim() || "ยังไม่ได้เขียนสูตร";
  if (r.numeric) return `${r.min || "0"} – ${r.max || "0"}`;
  if (r.value.trim() !== "") return `ต้องเป็น ${r.value}`;
  return "ไม่มีเกณฑ์ในระบบ";
}

export default function SetupErpDemoPage() {
  const [header, setHeader] = React.useState<DocField[]>(SEED_HEADER);
  const [checks, setChecks] = React.useState<CheckRow[]>(SEED_CHECKS);
  const [editing, setEditing] = React.useState<string | null>(null);

  const patch = (id: string, next: Partial<CheckRow>) =>
    setChecks((p) => p.map((r) => (r.id === id ? { ...r, ...next } : r)));

  /* เหตุผลที่ลง ERPNext ไม่ได้ — อ่านจากแหล่งข้อมูลที่ตั้งไว้ ไม่มีช่องให้เลือกเอง
     ทั้งส่วนหัวเอกสารและหัวข้อตรวจนับรวมกัน เพราะทั้งคู่ชี้ไปของชิ้นเดียวกัน */
  const blockers = [
    ...header
      .filter((f) => f.source !== "" && SOURCE[f.source].custom)
      .map((f) => `ส่วนหัว “${f.label || "ไม่มีชื่อ"}”`),
    ...checks
      .filter((r) => r.kind === "system" && r.source !== "" && SOURCE[r.source].custom)
      .map((r) => `หัวข้อ “${rowName(r)}”`),
  ];
  const onErpnext = blockers.length === 0;
  const editRow = checks.find((r) => r.id === editing) ?? null;

  return (
    <main className="@container mx-auto w-full max-w-5xl px-4 py-6 sm:px-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/qc/setup-erp">ตั้งค่ารายงานตรวจสอบ QC</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>ตัวอย่างก่อนแก้จริง</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <h1 className="mt-3 text-2xl font-semibold tracking-tight">
        สุ่มตรวจผลิตภัณฑ์สำเร็จรูป
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        FM-QC-02-06 — ตารางเก็บของที่ต้องเทียบข้ามแถว ที่เหลืออยู่ในกล่องแก้ไข
      </p>

      <Alert className="mt-4">
        <FlaskConicalIcon />
        <AlertTitle>หน้านี้เป็นตัวอย่าง ไม่ได้ต่อกับข้อมูลจริง</AlertTitle>
        <AlertDescription>
          ตั้งอะไรในนี้ไม่กระทบเทมเพลตจริงสักใบ กดรีเฟรชแล้วกลับเป็นค่าตั้งต้น
          ของจริงยังอยู่ที่{" "}
          <Link href="/qc/setup-erp" className="underline">
            ตั้งค่ารายงานตรวจสอบ QC
          </Link>{" "}
          เหมือนเดิมทุกอย่าง
        </AlertDescription>
      </Alert>

      {/* ปลายทางเป็นผลลัพธ์ ไม่ใช่ช่องให้เลือก — ลบตัวที่ติดออกแล้วพลิกเป็นเขียว */}
      <div
        className={cn(
          "mt-4 rounded-xl border px-4 py-3",
          onErpnext ? "border-success-border bg-success" : "border-border bg-brand"
        )}
      >
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium">
            {onErpnext
              ? "ใบของฟอร์มนี้ลง Quality Inspection ของ ERPNext ได้"
              : "ใบของฟอร์มนี้ต้องไปลง QC Check"}
          </p>
          {!onErpnext && (
            <Badge
              appearance="soft"
              tone="warning"
              className="font-mono text-[10px] uppercase"
            >
              custom
            </Badge>
          )}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {onErpnext
            ? "ทุกช่องมีที่เก็บใน doctype มาตรฐาน — บล็อกการรับของได้ อยู่ใต้ Stock Settings และเข้ารายงานมาตรฐาน"
            : `เพราะ ${blockers.join(" · ")} ดึงจากของที่ Quality Inspection ไม่มีช่องเก็บ`}
        </p>
      </div>

      <Tabs defaultValue="structure" className="mt-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="structure">โครงสร้างรายงาน</TabsTrigger>
          <TabsTrigger value="preview">ตัวอย่างรายงาน</TabsTrigger>
        </TabsList>

        {/* ================= โครงสร้าง ================= */}
        <TabsContent value="structure">
          <Section
            index={1}
            title="ส่วนหัวเอกสาร"
            note="ช่องที่ผู้ตรวจกรอกครั้งเดียวต่อใบ เช่น เลขที่เอกสาร สินค้า เครื่องจักร"
          >
            <HeaderTable fields={header} onChange={setHeader} />
          </Section>

          <Section
            index={2}
            title={`หัวข้อตรวจ (${checks.length})`}
            note="หนึ่งหัวข้อ = หนึ่งแถวใน readings · กดดินสอเพื่อตั้งเกณฑ์ จำนวนค่า และหมายเหตุ"
          >
            <CheckTable
              rows={checks}
              onChange={setChecks}
              onEdit={setEditing}
              onPatch={patch}
            />
          </Section>
        </TabsContent>

        {/* ================= ตัวอย่างรายงาน ================= */}
        <TabsContent value="preview">
          <div className="mt-6 rounded-2xl border border-border bg-card p-5">
            <h2 className="text-xl font-semibold tracking-tight">
              ใบสุ่มตรวจผลิตภัณฑ์สำเร็จรูป QC260115/01-01
            </h2>

            {header.length > 0 && (
              <div className="mt-5 grid gap-4 @2xl:grid-cols-3">
                {header.map((f) => (
                  <div key={f.id} className="space-y-1.5">
                    <Label htmlFor={`pv-${f.id}`}>
                      {f.label || "ยังไม่ได้ตั้งชื่อ"}{" "}
                      {!f.required && (
                        <span className="font-normal text-muted-foreground">
                          (ไม่บังคับ)
                        </span>
                      )}
                    </Label>
                    <PoolSelect id={`pv-${f.id}`} source={f.source} />
                  </div>
                ))}
              </div>
            )}

            <h3 className="mt-6 mb-3 font-semibold">การตรวจสอบ</h3>
            <div className="space-y-3">
              {checks.map((r, i) => (
                <PreviewCheck key={r.id} index={i + 1} row={r} />
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {editRow && (
        <EditDialog
          row={editRow}
          onChange={(next) => patch(editRow.id, next)}
          onClose={() => setEditing(null)}
        />
      )}
    </main>
  );
}

/* ------------------------------------------------------------------
   ตารางหัวข้อตรวจ — สี่ช่องที่ต้องกวาดตาเทียบข้ามแถว

   เกณฑ์เป็นข้อความอ่านอย่างเดียว ไม่ใช่ช่องกรอก เพราะมันมีสามหน้าตา
   (ช่วงต่ำ-สูง / สูตร / ค่าที่ถือว่าผ่าน) ยัดลงช่องเดียวแล้วกรอกไม่ได้
   แต่ "อ่าน" ได้ ซึ่งเป็นสิ่งที่ต้องการจากตาราง
------------------------------------------------------------------ */

function CheckTable({
  rows,
  onChange,
  onEdit,
  onPatch,
}: {
  rows: CheckRow[];
  onChange: (next: CheckRow[]) => void;
  onEdit: (id: string) => void;
  onPatch: (id: string, next: Partial<CheckRow>) => void;
}) {
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
                  {/* ดรอปดาวน์เสมอ ไม่ใช่ช่องพิมพ์ — ของ ERPNext specification
                      เป็น Link ไปทะเบียน พิมพ์อิสระไม่ได้อยู่แล้ว
                      เลือกดึงจากระบบแล้วรายการเหลือสามอย่างที่ "ตรวจ" ได้จริง */}
                  <Select
                    value={r.kind === "system" ? r.source : r.name}
                    onValueChange={(v) =>
                      onPatch(
                        r.id,
                        r.kind === "system"
                          ? { source: v as SourceId }
                          : { name: v }
                      )
                    }
                  >
                    <SelectTrigger aria-label="หัวข้อตรวจ" className="w-full bg-card">
                      <SelectValue placeholder="เลือกหัวข้อ" />
                    </SelectTrigger>
                    <SelectContent>
                      {r.kind === "system"
                        ? CHECK_SOURCES.map((s) => (
                            <SelectItem key={s} value={s}>
                              {SOURCE[s].label}
                              {SOURCE[s].custom && " — ไม่มีใน ERPNext"}
                            </SelectItem>
                          ))
                        : QI_PARAMETERS.map((p) => (
                            <SelectItem key={p.id} value={p.name}>
                              {p.name}
                              {p.unit && ` (${p.unit})`}
                            </SelectItem>
                          ))}
                    </SelectContent>
                  </Select>
                  <FieldNote
                    custom={
                      r.kind === "system" &&
                      r.source !== "" &&
                      SOURCE[r.source].custom
                    }
                  >
                    {r.kind === "system"
                      ? r.source === ""
                        ? "ยังไม่ได้เลือกแหล่งข้อมูล"
                        : SOURCE[r.source].store
                      : "Quality Inspection Parameter · ทะเบียนหัวข้อตรวจ"}
                  </FieldNote>
                </td>

                <td className="px-4 py-3 align-top">
                  <Select
                    value={r.kind}
                    onValueChange={(v) =>
                      // สลับประเภทแล้วชื่อหัวข้อใช้ร่วมกันไม่ได้ ล้างทั้งคู่
                      // ไม่งั้นจะเหลือชื่อจากทะเบียนค้างอยู่ในข้อที่ดึงจากระบบ
                      onPatch(r.id, { kind: v as Kind, name: "", source: "" })
                    }
                  >
                    <SelectTrigger aria-label="ประเภทข้อมูล" className="w-full bg-card">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {KINDS.map((k) => (
                        <SelectItem key={k} value={k}>
                          {KIND[k].label}
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
                  {/* ค่าสูงสุดว่าง = ศูนย์ ไม่ใช่ไม่จำกัด เพราะ ERPNext เทียบ
                      flt(min) <= v <= flt(max) แล้ว flt ของค่าว่างคือ 0 —
                      ปล่อยว่างไว้คือข้อที่ตกทุกใบโดยไม่มีใครรู้ว่าทำไม */}
                  {r.numeric &&
                    !r.formulaBased &&
                    !r.manual &&
                    r.max.trim() === "" && (
                      <p className="mt-1 text-sm text-danger-strong">
                        ไม่ใส่ค่าสูงสุด ERPNext อ่านเป็น 0 แล้วทุกใบจะไม่ผ่าน
                      </p>
                    )}
                </td>

                <td className="px-4 py-3 text-center align-top">
                  <Checkbox
                    aria-label="ผู้ตรวจตัดสินเอง"
                    className="mt-3"
                    checked={r.manual}
                    onCheckedChange={(v) => onPatch(r.id, { manual: v === true })}
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
                      onClick={() => onEdit(r.id)}
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
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex justify-center">
        <Button
          variant="outline-primary"
          onClick={() => onChange([...rows, blankCheck()])}
        >
          <PlusIcon />
          เพิ่มหัวข้อตรวจ
        </Button>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------
   กล่องตั้งค่าหัวข้อ — ของที่ไม่ต้องเทียบข้ามแถว

   ติ๊กตัวเลขกับติ๊กสูตรเป็นกล่องติ๊กสองใบที่ติ๊กพร้อมกันได้ ตรงกับ ERPNext
   ที่ numeric กับ formula_based_criteria เป็น Check คนละตัว และติ๊กคู่กันแล้ว
   ความหมายเปลี่ยน — สูตรจะได้ reading_1…reading_10 กับ mean แทน reading_value
------------------------------------------------------------------ */

function EditDialog({
  row,
  onChange,
  onClose,
}: {
  row: CheckRow;
  onChange: (next: Partial<CheckRow>) => void;
  onClose: () => void;
}) {
  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {rowName(row) || "หัวข้อที่ยังไม่ได้เลือก"}
          </DialogTitle>
          <DialogDescription>
            ตั้งเกณฑ์ จำนวนค่าที่คีย์ และหมายเหตุของหัวข้อนี้
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] space-y-5 overflow-y-auto px-1">
          <div className="space-y-2">
            <Label>วิธีตัดสิน</Label>
            {/* สองใบนี้ติ๊กพร้อมกันได้จริง ไม่ใช่ตัวเลือกที่แข่งกัน */}
            <div className="space-y-2">
              <label className="flex items-start gap-3 rounded-lg border border-border px-3 py-2.5">
                <Checkbox
                  className="mt-0.5"
                  checked={row.numeric}
                  onCheckedChange={(v) => onChange({ numeric: v === true })}
                />
                <span className="text-sm">
                  <span className="font-medium">คีย์เป็นตัวเลข</span>
                  <span className="block text-muted-foreground">
                    ได้ช่องคีย์หลายค่า · ไม่ติ๊กคือได้ช่องเดียวให้คีย์ข้อความ
                  </span>
                </span>
              </label>

              <label className="flex items-start gap-3 rounded-lg border border-border px-3 py-2.5">
                <Checkbox
                  className="mt-0.5"
                  checked={row.formulaBased}
                  onCheckedChange={(v) => onChange({ formulaBased: v === true })}
                />
                <span className="text-sm">
                  <span className="font-medium">ตัดสินด้วยสูตร</span>
                  <span className="block text-muted-foreground">
                    ใช้สูตรแทนช่วงต่ำ–สูง หรือค่าที่ถือว่าผ่าน
                  </span>
                </span>
              </label>
            </div>
            <FieldNote>numeric · formula_based_criteria</FieldNote>
          </div>

          {row.formulaBased ? (
            <div className="space-y-1.5">
              <Label htmlFor={`${row.id}-f`}>สูตร</Label>
              <Input
                id={`${row.id}-f`}
                className="bg-card font-mono text-sm"
                value={row.formula}
                placeholder="เช่น mean < 80"
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
              <Label>ช่วงที่ถือว่าผ่าน</Label>
              <div className="flex items-center gap-2">
                <Input
                  aria-label="ค่าต่ำสุด"
                  className="w-32 bg-card"
                  inputMode="decimal"
                  value={row.min}
                  placeholder="ต่ำสุด"
                  onChange={(e) => onChange({ min: e.target.value })}
                />
                <span className="text-muted-foreground">–</span>
                <Input
                  aria-label="ค่าสูงสุด"
                  className="w-32 bg-card"
                  inputMode="decimal"
                  value={row.max}
                  placeholder="สูงสุด"
                  onChange={(e) => onChange({ max: e.target.value })}
                />
              </div>
              <FieldNote>min_value / max_value</FieldNote>
              {row.max.trim() === "" && !row.manual && (
                <p className="text-sm text-danger-strong">
                  ไม่ใส่ค่าสูงสุด ERPNext อ่านเป็น 0 แล้วทุกใบจะไม่ผ่าน
                </p>
              )}
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
              <FieldNote>value</FieldNote>
            </div>
          )}

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

            {row.readings > 1 && (
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {Array.from({ length: row.readings }, (_, i) => (
                  <Input
                    key={i}
                    aria-label={`ชื่อค่าที่ ${i + 1}`}
                    className="bg-card"
                    value={row.labels[i] ?? ""}
                    placeholder={`ครั้งที่ ${i + 1}`}
                    onChange={(e) => {
                      const next = [...row.labels];
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
                {REMARK_KEYS.map((k) => (
                  <SelectItem key={k} value={k}>
                    {REMARK[k]}
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

/* ---------- ส่วนหัวเอกสาร ---------- */

function HeaderTable({
  fields,
  onChange,
}: {
  fields: DocField[];
  onChange: (next: DocField[]) => void;
}) {
  const patch = (id: string, next: Partial<DocField>) =>
    onChange(fields.map((f) => (f.id === id ? { ...f, ...next } : f)));

  return (
    <>
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
                    <SelectTrigger aria-label="แหล่งข้อมูล" className="w-full bg-card">
                      <SelectValue placeholder="เลือกแหล่งข้อมูล" />
                    </SelectTrigger>
                    <SelectContent>
                      {SOURCE_IDS.map((s) => (
                        <SelectItem key={s} value={s}>
                          {SOURCE[s].label}
                          {SOURCE[s].custom && " — ไม่มีใน ERPNext"}
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
                  <p className="font-medium">ยังไม่มีช่องในส่วนนี้</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    กด “เพิ่มหัวเอกสาร” เพื่อเพิ่มช่องแรก
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex justify-center">
        <Button
          variant="outline-primary"
          onClick={() =>
            onChange([
              ...fields,
              { id: nid(), label: "", source: "", required: false },
            ])
          }
        >
          <PlusIcon />
          เพิ่มหัวเอกสาร
        </Button>
      </div>
    </>
  );
}

/* ---------- แท็บตัวอย่าง ---------- */

function PreviewCheck({ index, row }: { index: number; row: CheckRow }) {
  const labels = readingLabels(row);
  const choices = row.value
    .split("/")
    .map((o) => o.trim())
    .filter(Boolean);
  // ค่าที่ถือว่าผ่านเขียนคั่นด้วย / = ให้เลือก ไม่ใช่ให้พิมพ์
  const asChoice = !row.numeric && !row.formulaBased && choices.length > 1;

  return (
    <div className="rounded-xl border border-border p-4">
      <p className="font-medium">
        {index}. {rowName(row) || "ยังไม่ได้เลือกหัวข้อ"}
      </p>
      {row.criteria && (
        <p className="mt-0.5 text-sm text-muted-foreground">
          เกณฑ์: {row.criteria}
        </p>
      )}

      <div className="mt-3 grid gap-3 @lg:grid-cols-3">
        {labels.map((l, i) => (
          <div key={i} className="space-y-1.5">
            <Label htmlFor={`pvc-${row.id}-${i}`} className="text-sm">
              {l}
            </Label>
            {row.kind === "system" ? (
              <PoolSelect id={`pvc-${row.id}-${i}`} source={row.source} />
            ) : asChoice ? (
              <Select>
                <SelectTrigger id={`pvc-${row.id}-${i}`} className="w-full bg-card">
                  <SelectValue placeholder="เลือก" />
                </SelectTrigger>
                <SelectContent>
                  {choices.map((o) => (
                    <SelectItem key={o} value={o}>
                      {o}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                id={`pvc-${row.id}-${i}`}
                className="bg-card"
                inputMode={row.numeric ? "decimal" : "text"}
                placeholder={row.numeric ? "0" : row.value || "ระบุ"}
              />
            )}
          </div>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <VerdictPick id={row.id} />
        {row.manual && (
          <span className="text-sm text-muted-foreground">
            ระบบไม่ตัดสินให้ ผู้ตรวจชี้ขาด
          </span>
        )}
      </div>

      {row.remark !== "off" && (
        <div className="mt-3 space-y-1.5">
          <Label htmlFor={`pvr-${row.id}`} className="text-sm">
            หมายเหตุ{" "}
            <span className="font-normal text-muted-foreground">
              ({REMARK[row.remark]})
            </span>
          </Label>
          <Input
            id={`pvr-${row.id}`}
            className="bg-card"
            placeholder="ระบุหมายเหตุ"
          />
        </div>
      )}
    </div>
  );
}

function PoolSelect({ id, source }: { id: string; source: SourceId | "" }) {
  const pool = source === "" ? [] : SOURCE[source].pool;
  return (
    <Select>
      <SelectTrigger id={id} className="w-full bg-card">
        <SelectValue
          placeholder={pool.length === 0 ? "ยังไม่ได้ตั้งแหล่งข้อมูล" : "เลือก"}
        />
      </SelectTrigger>
      <SelectContent>
        {pool.map((o) => (
          <SelectItem key={o} value={o}>
            {o}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function VerdictPick({ id }: { id: string }) {
  const [v, setV] = React.useState<"" | "pass" | "fail">("");
  return (
    <div className="flex gap-1.5">
      {(["pass", "fail"] as const).map((k) => (
        <button
          key={k}
          type="button"
          onClick={() => setV((p) => (p === k ? "" : k))}
          aria-pressed={v === k}
          aria-label={`${k === "pass" ? "ผ่าน" : "ไม่ผ่าน"} ${id}`}
          className={cn(
            "min-h-9 rounded-full border px-4 text-sm whitespace-nowrap transition-colors",
            v === k
              ? k === "pass"
                ? "border-success-border bg-success text-success-strong"
                : "border-danger-border bg-danger text-danger-strong"
              : "border-border text-muted-foreground"
          )}
        >
          {k === "pass" ? "ผ่าน" : "ไม่ผ่าน"}
        </button>
      ))}
    </div>
  );
}

function Section({
  index,
  title,
  note,
  children,
}: {
  index?: number;
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-6">
      <div className="min-w-0">
        <h2 className="font-semibold">
          {index !== undefined && (
            <span className="text-muted-foreground">{index}. </span>
          )}
          {title}
        </h2>
        {note && <p className="mt-0.5 text-sm text-muted-foreground">{note}</p>}
      </div>
      <div className="mt-3">{children}</div>
    </section>
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
