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
import { Switch } from "@peckey954/ui/components/ui/switch";
import { Textarea } from "@peckey954/ui/components/ui/textarea";
import {
  RadioGroup,
  RadioGroupItem,
} from "@peckey954/ui/components/ui/radio-group";
import { cn } from "@peckey954/ui/lib/utils";
import { CheckChip } from "@/components/check-chip";
import { MultiSelectChips } from "@/components/multi-select-chips";
import { TimeField } from "@/components/time-field";
import { ParamCombobox } from "@/components/qc/param-picker";
import { SchedulePreviewCalendar } from "@/components/qc/schedule-calendar";
import {
  DISPOSITIONS,
  INSPECTION_TYPE_LABEL,
  INSPECTION_TYPE_VALUE,
  ITEM_POOL,
  REF_DOCS_OF,
  REF_DOC_LABEL,
  paramOf,
  type InspectionType,
} from "@/lib/qc-erp";
import { newSlot, type TimeSlot } from "@/lib/qc-template";

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
  /** id ของหัวข้อในทะเบียน — ใช้เมื่อ kind = text ว่าง = ยังไม่ได้เลือก */
  paramId: string;
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
  paramId: "",
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
    paramId: "p-weight",
    numeric: true,
    manual: false,
    min: "50.2",
    max: "50.8",
    readings: 3,
    criteria: "ชั่งทุกกระสอบที่สุ่ม",
  }),
  mk({
    paramId: "p-seam",
    criteria: "ด้ายต้องติดตลอดแนว ฝีเข็มสม่ำเสมอ ไม่หลุดไม่ขาด",
  }),
  mk({
    paramId: "p-moist",
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
    : (paramOf(r.paramId)?.name ?? "");

const readingLabels = (r: CheckRow) =>
  Array.from(
    { length: r.readings },
    (_, i) => r.labels[i]?.trim() || `ครั้งที่ ${i + 1}`
  );

/** สรุปเกณฑ์ลงช่องเดียวในตาราง — ตรงกับที่ ERPNext จะเอาไปตัดสินจริง */
function describeCriteria(r: CheckRow) {
  if (r.formulaBased) {
    // สูตรหลายบรรทัดย่อให้เหลือบรรทัดเดียวตอนโชว์ในตาราง ไม่งั้นแถวจะสูงไม่เท่ากัน
    const one = r.formula.trim().replace(/\s+/g, " ");
    if (one === "") return "ยังไม่ได้เขียนสูตร";
    return one.length > 48 ? `${one.slice(0, 48)}…` : one;
  }
  if (r.numeric) return `${r.min || "0"} – ${r.max || "0"}`;
  if (r.value.trim() !== "") return `ต้องเป็น ${r.value}`;
  return "ไม่มีเกณฑ์ในระบบ";
}

export default function SetupErpDemoPage() {
  const [header, setHeader] = React.useState<DocField[]>(SEED_HEADER);
  const [checks, setChecks] = React.useState<CheckRow[]>(SEED_CHECKS);
  const [editing, setEditing] = React.useState<string | null>(null);

  // ---- 1 ข้อมูลรายงาน ----
  const [name, setName] = React.useState("สุ่มตรวจผลิตภัณฑ์สำเร็จรูป");
  const [code, setCode] = React.useState("FM-QC-02-06");
  const [type, setType] = React.useState<InspectionType>("inProcess");
  const [refDocs, setRefDocs] = React.useState<string[]>([]);
  const [subject, setSubject] = React.useState<"item" | "other">("other");
  const [targets, setTargets] = React.useState<string[]>([]);
  const [requireBefore, setRequireBefore] = React.useState(false);

  /* ตรวจหลายตัวอย่างต่อใบ — เปิดแล้วใบนี้ออกจาก Quality Inspection ทันที
     ไม่ใช่เพราะเราเลือกให้เป็นแบบนั้น แต่เพราะ reading_1…reading_10 ไม่ได้
     แปลว่า "ของสิบชิ้น" มันแปลว่า "วัดของชิ้นเดียวสิบครั้ง" ซึ่งพิสูจน์ได้จาก
     calculate_mean ที่เอาทุกค่ามาเฉลี่ยกัน — เฉลี่ยน้ำหนักข้ามสูตรที่ต่างกัน
     ไม่มีความหมาย และหนึ่งแถวมี status เดียว บอกไม่ได้ว่ากระสอบไหนตก */
  const [multiSample, setMultiSample] = React.useState(true);
  const [samples, setSamples] = React.useState<string[]>([nid(), nid(), nid()]);

  // ---- 4 ผลตรวจที่ไม่ผ่าน ----
  const [dispositions, setDispositions] = React.useState<string[]>([
    "accept",
    "repack",
  ]);
  const [requireDisposition, setRequireDisposition] = React.useState(true);

  // ---- 5 เปิดใบตามรอบเวลาทำงาน ----
  const [recurring, setRecurring] = React.useState(true);
  const [slots, setSlots] = React.useState<TimeSlot[]>([
    newSlot("08:30", "12:00"),
    newSlot("13:00", "18:00"),
    newSlot("19:00", "23:00"),
    newSlot("01:00", "05:00"),
  ]);

  const patch = (id: string, next: Partial<CheckRow>) =>
    setChecks((p) => p.map((r) => (r.id === id ? { ...r, ...next } : r)));

  /* เหตุผลที่ลง ERPNext ไม่ได้ — อ่านจากแหล่งข้อมูลที่ตั้งไว้ ไม่มีช่องให้เลือกเอง
     ทั้งส่วนหัวเอกสารและหัวข้อตรวจนับรวมกัน เพราะทั้งคู่ชี้ไปของชิ้นเดียวกัน */
  const blockers = [
    // ตรวจของที่ไม่ใช่สินค้า — Quality Inspection ไม่มีช่องเก็บเครื่องจักรหรือคลัง
    ...(subject === "other" ? ["ประเภทการตรวจไม่ใช่สินค้า"] : []),
    // reference_type / reference_name เป็น reqd=1 ที่ไม่มี depends_on
    // ไม่มีเอกสารคือบันทึกแม้แต่ draft ไม่ได้
    ...(subject === "item" && refDocs.length === 0
      ? ["ไม่ได้อ้างอิงเอกสาร"]
      : []),
    // item_code ก็ reqd=1 เหมือนกัน ไม่ผูกสินค้าคือไม่มีใบให้เปิด
    ...(subject === "item" && targets.length === 0
      ? ["ยังไม่ได้ผูกกับสินค้าตัวไหน"]
      : []),
    ...(multiSample ? ["เปิดตรวจหลายตัวอย่างต่อใบ"] : []),
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
            : `เพราะ ${blockers.join(" · ")} — ไม่ได้ให้เลือกเอง อ่านจากที่ตั้งไว้ทั้งหมด`}
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
            title="ข้อมูลรายงาน"
            note="ชื่อรายงาน ช่วงที่ใช้ เอกสารที่อ้างอิง และของที่ฟอร์มนี้ผูกอยู่"
          >
            <div className="grid gap-4 @2xl:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="d-name">ชื่อรายงาน</Label>
                <Input
                  id="d-name"
                  className="bg-card"
                  value={name}
                  placeholder="ระบุชื่อรายงาน"
                  onChange={(e) => setName(e.target.value)}
                />
                {/* ชื่อนี้คือ ID ของเอกสาร เปลี่ยนทีหลังคือ rename ที่ Frappe
                    ต้องตามไปแก้ลิงก์ในใบตรวจเก่าให้ด้วย ไม่ใช่แค่แก้ข้อความ */}
                <FieldNote>
                  quality_inspection_template_name · ชื่อนี้คือ ID ของเอกสาร
                </FieldNote>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="d-code">
                  รหัสรายงาน{" "}
                  <span className="font-normal text-muted-foreground">
                    (ไม่บังคับ)
                  </span>
                </Label>
                <Input
                  id="d-code"
                  className="bg-card"
                  value={code}
                  placeholder="ระบุรหัสรายงาน"
                  onChange={(e) => setCode(e.target.value)}
                />
                <FieldNote custom>custom_code ที่เทมเพลต</FieldNote>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="d-type">ช่วงการตรวจสอบ</Label>
                <Select
                  value={type}
                  onValueChange={(v) => {
                    // เปลี่ยนช่วงแล้วเอกสารอ้างอิงต้องล้างตาม ใบรับของกับใบส่งของ
                    // อยู่คนละช่วง ค้างไว้จะได้ฟอร์มที่ยิงเข้า ERPNext ไม่ผ่าน
                    setType(v as InspectionType);
                    setRefDocs([]);
                  }}
                >
                  <SelectTrigger id="d-type" className="w-full bg-card">
                    <SelectValue placeholder="เลือกช่วงการตรวจ" />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(INSPECTION_TYPE_LABEL) as InspectionType[]).map(
                      (t) => (
                        <SelectItem key={t} value={t}>
                          {INSPECTION_TYPE_LABEL[t]} — {INSPECTION_TYPE_VALUE[t]}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
                <FieldNote>inspection_type</FieldNote>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="d-ref">
                  เอกสารอ้างอิง{" "}
                  <span className="font-normal text-muted-foreground">
                    {subject === "item" ? "(บังคับถ้าจะลง ERPNext)" : "(ไม่ใช้)"}
                  </span>
                </Label>
                <MultiSelectChips
                  id="d-ref"
                  className="w-full bg-card"
                  disabled={subject !== "item"}
                  placeholder={
                    subject === "item"
                      ? "เลือกเอกสาร"
                      : "ฟอร์มที่ไม่ได้ตรวจสินค้าไม่มีเอกสารสต็อกมาเกี่ยว"
                  }
                  options={REF_DOCS_OF[type].map((d) => ({
                    label: REF_DOC_LABEL[d],
                    value: d,
                  }))}
                  value={refDocs}
                  onValueChange={setRefDocs}
                />
                <FieldNote>reference_type · reference_name</FieldNote>
              </div>

              <div className="space-y-1.5">
                <Label>ประเภทการตรวจ</Label>
                <RadioGroup
                  className="grid gap-2 @lg:grid-cols-2"
                  value={subject}
                  onValueChange={(v) => {
                    setSubject(v as "item" | "other");
                    if (v !== "item") {
                      setRefDocs([]);
                      setTargets([]);
                      setRequireBefore(false);
                    }
                  }}
                >
                  {(
                    [
                      ["item", "สินค้า"],
                      ["other", "คลัง/สินค้าในคลัง/เครื่องจักร/อื่นๆ"],
                    ] as const
                  ).map(([v, l]) => (
                    <Label
                      key={v}
                      htmlFor={`d-sub-${v}`}
                      className={cn(
                        "flex items-center gap-2 rounded-lg border px-3 py-2.5 font-normal",
                        subject === v
                          ? "border-primary bg-brand"
                          : "border-border bg-card"
                      )}
                    >
                      <RadioGroupItem id={`d-sub-${v}`} value={v} />
                      {l}
                    </Label>
                  ))}
                </RadioGroup>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="d-items">สินค้า</Label>
                <MultiSelectChips
                  id="d-items"
                  className="w-full bg-card"
                  disabled={subject !== "item"}
                  placeholder={
                    subject === "item"
                      ? "เลือกสินค้า"
                      : "ไม่ได้ผูกที่ฟอร์ม — ผู้ตรวจเลือกตอนเปิดใบ"
                  }
                  options={ITEM_POOL.map((i) => ({ label: i, value: i }))}
                  value={targets}
                  onValueChange={setTargets}
                />
                <FieldNote>
                  Item · quality_inspection_template (เขียนกลับไปที่ข้อมูลสินค้า)
                </FieldNote>
              </div>
            </div>

            {subject === "item" && (
              <label className="mt-4 flex items-center gap-3">
                <Switch
                  checked={requireBefore}
                  disabled={targets.length === 0}
                  onCheckedChange={setRequireBefore}
                />
                <span className="text-sm font-medium">
                  ต้องตรวจก่อนรับของเข้าคลัง
                </span>
              </label>
            )}
          </Section>

          <Section
            index={2}
            title="ส่วนหัวเอกสาร"
            note="ช่องที่ผู้ตรวจกรอกครั้งเดียวต่อใบ เช่น เลขที่เอกสาร สินค้า เครื่องจักร"
          >
            <HeaderTable fields={header} onChange={setHeader} />
          </Section>

          <Section
            index={3}
            title={`หัวข้อตรวจ (${checks.length})`}
            note="หนึ่งหัวข้อ = หนึ่งแถวใน readings · กดดินสอเพื่อตั้งเกณฑ์ จำนวนค่า และหมายเหตุ"
            action={
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={multiSample} onCheckedChange={setMultiSample} />
                ตรวจหลายตัวอย่างต่อใบ
              </label>
            }
          >
            {/* เปิดแล้วออกจาก ERPNext ทั้งใบ ต้องบอกว่าได้อะไรเสียอะไร ตรงนี้เลย
                ไม่ใช่ให้ไปเจอเองว่าแถบบนเปลี่ยนสีแล้วงงว่าทำไม */}
            <div
              className={cn(
                "mb-3 rounded-xl border px-4 py-3 text-sm",
                multiSample ? "border-border bg-brand" : "border-border bg-card"
              )}
            >
              {multiSample ? (
                <>
                  <p className="font-medium">
                    ตารางตัวอย่าง — แถวไม่จำกัด แต่ละแถวมีผลผ่าน/ไม่ผ่านของตัวเอง
                  </p>
                  <p className="mt-1 text-muted-foreground">
                    สุ่มกี่ตัวอย่างก็เพิ่มแถวเท่านั้น และตัดสินแยกรายแถวได้ —
                    แลกกับใบนี้ไปอยู่ QC Check ทั้งใบ
                  </p>
                </>
              ) : (
                <>
                  <p className="font-medium">
                    วัดซ้ำได้สูงสุด {MAX_READINGS} ครั้งต่อหัวข้อ
                    ผลผ่าน/ไม่ผ่านมีอันเดียวต่อหัวข้อ
                  </p>
                  <p className="mt-1 text-muted-foreground">
                    ใช้กับการวัดของชิ้นเดียวซ้ำหลายครั้งแล้วเอามาเฉลี่ย
                    ซึ่งเป็นสิ่งที่ reading_1…reading_10 ถูกทำมาเพื่อรองรับ
                  </p>
                </>
              )}
            </div>

            <CheckTable
              rows={checks}
              onChange={setChecks}
              onEdit={setEditing}
              onPatch={patch}
            />
          </Section>

          {/* ---------- 4 ผลตรวจที่ไม่ผ่าน ---------- */}
          {/* repack / รับสภาพ / ส่งคืน เป็นการตัดสินใจกับ "ของ" ฟอร์มที่ตรวจ
              เครื่องจักรหรือคลังไม่มีของให้ตัดสิน ซ่อนทั้งก้อนไปเลย */}
          {subject === "item" && (
            <Section
              index={4}
              title="ผลตรวจที่ไม่ผ่าน"
              note="ผู้ตรวจต้องเลือกว่าจะจัดการสินค้าที่ไม่ผ่านอย่างไร"
              action={
                <label className="flex items-center gap-2 text-sm">
                  <Switch
                    checked={requireDisposition}
                    disabled={dispositions.length === 0}
                    onCheckedChange={setRequireDisposition}
                  />
                  บังคับเลือกเมื่อมีข้อไม่ผ่าน
                </label>
              }
            >
              <div className="flex flex-wrap gap-2">
                {DISPOSITIONS.map((d) => (
                  <CheckChip
                    key={d.id}
                    id={`d-disp-${d.id}`}
                    label={d.label}
                    checked={dispositions.includes(d.id)}
                    onChange={(v) =>
                      setDispositions((p) =>
                        v ? [...p, d.id] : p.filter((x) => x !== d.id)
                      )
                    }
                  />
                ))}
              </div>
              {/* ERPNext ไม่มีช่องนี้เลย status มีแค่ Accepted/Rejected
                  และ validate_qi_rejection อ่านแค่ status ถ้า Stock Settings
                  ตั้ง Stop ไว้ มันจะบล็อกการรับของก่อนที่สคริปต์จะได้ทำงาน
                  ฟอร์มที่ใช้ช่องนี้จึงต้องตั้งเป็น Warn */}
              <FieldNote custom>
                custom_disposition ที่ใบตรวจ · ต้องตั้ง Stock Settings เป็น Warn
                ไม่งั้น Stop จะบล็อกการรับของก่อนที่จะได้เลือก
              </FieldNote>
            </Section>
          )}

          {/* ---------- 5 เปิดใบตามรอบเวลาทำงาน ---------- */}
          <Section
            index={subject === "item" ? 5 : 4}
            title="เปิดใบตามรอบเวลาทำงาน"
            note="ระบบจะขึ้นข้อมูลให้ทำเอกสารตามช่วงเวลาที่ตั้งไว้ ไม่รวมวันหยุดทำงานและวันหยุดนักขัตฤกษ์ วันไหนไม่มีข้อมูลแปลว่ายังไม่มีใครทำ"
            action={
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={recurring} onCheckedChange={setRecurring} />
                ดูเป็นปฏิทินทั้งเดือนได้
              </label>
            }
          >
            {recurring ? (
              <>
                <div className="space-y-3">
                  {slots.map((sl, i) => (
                    <div
                      key={sl.id}
                      className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4"
                    >
                      <span className="w-16 shrink-0 font-medium">
                        ช่วงที่ {i + 1}
                      </span>
                      <TimeField
                        aria-label={`เวลาเริ่มช่วงที่ ${i + 1}`}
                        className="w-36"
                        value={sl.from}
                        onValueChange={(v) =>
                          setSlots((p) =>
                            p.map((x) => (x.id === sl.id ? { ...x, from: v } : x))
                          )
                        }
                      />
                      <span className="text-muted-foreground">ถึง</span>
                      <TimeField
                        aria-label={`เวลาสิ้นสุดช่วงที่ ${i + 1}`}
                        className="w-36"
                        value={sl.to}
                        onValueChange={(v) =>
                          setSlots((p) =>
                            p.map((x) => (x.id === sl.id ? { ...x, to: v } : x))
                          )
                        }
                      />
                      {/* ช่วงที่เวลาจบน้อยกว่าเวลาเริ่ม = ข้ามเที่ยงคืน อ่านจากเวลาเอง
                          ไม่ให้ติ๊กบอก จะได้ไม่ขัดกับเวลาที่กรอกไว้จริง */}
                      {sl.to <= sl.from && (
                        <Badge appearance="soft" tone="neutral">
                          ข้ามเที่ยงคืน
                        </Badge>
                      )}
                      <div className="ml-auto">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`ลบช่วงที่ ${i + 1}`}
                          onClick={() =>
                            setSlots((p) => p.filter((x) => x.id !== sl.id))
                          }
                        >
                          <Trash2Icon />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-3 flex justify-center">
                  <Button
                    variant="outline-primary"
                    onClick={() => setSlots((p) => [...p, newSlot()])}
                  >
                    <PlusIcon />
                    เพิ่มช่วงเวลา
                  </Button>
                </div>

                <div className="mt-5 rounded-xl border border-border bg-card p-4">
                  <SchedulePreviewCalendar
                    schedule={{ mode: "recurring", slots, skipDays: "weekend" }}
                  />
                </div>

                {/* ERPNext ไม่มีอะไรที่เปิดใบตามเวลาเลย ทั้ง Quality Inspection
                    และ QC Check ต้องเขียน scheduled job เพิ่มเองทั้งคู่ */}
                <FieldNote custom>
                  ไม่มีใน ERPNext — ต้องเขียน scheduled job เพิ่ม ·
                  วันทำงานอ่านจาก Holiday List ของบริษัท ไม่ได้ตั้งซ้ำที่ฟอร์ม
                </FieldNote>
              </>
            ) : (
              <div className="rounded-xl border border-dashed border-border px-6 py-10 text-center">
                <p className="font-medium">เปิดใบตามเหตุ ไม่ใช่ตามเวลา</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  มีของเข้า-ออก หรือมีใบสั่งผลิต ถึงจะมีใบให้ทำ
                  จำนวนใบต่อวันไม่แน่นอน จึงไม่มีปฏิทินให้ดู
                </p>
              </div>
            )}
          </Section>
        </TabsContent>

        {/* ================= ตัวอย่างรายงาน ================= */}
        <TabsContent value="preview">
          <div className="mt-6 rounded-2xl border border-border bg-card p-5">
            <h2 className="text-xl font-semibold tracking-tight">
              ใบ{name || "ยังไม่ได้ตั้งชื่อรายงาน"} QC260115/01-01
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
            {multiSample ? (
              <SampleGrid
                checks={checks}
                samples={samples}
                onAdd={() => setSamples((p) => [...p, nid()])}
                onRemove={(id) =>
                  setSamples((p) => (p.length > 1 ? p.filter((x) => x !== id) : p))
                }
              />
            ) : (
              <div className="space-y-3">
                {checks.map((r, i) => (
                  <PreviewCheck key={r.id} index={i + 1} row={r} />
                ))}
              </div>
            )}

            {subject === "item" && dispositions.length > 0 && (
              <div className="mt-6">
                <p className="font-semibold">
                  ของที่ไม่ผ่านจะจัดการยังไง{" "}
                  {requireDisposition && (
                    <span className="font-normal text-danger-strong">
                      (บังคับเลือก)
                    </span>
                  )}
                </p>
                <RadioGroup className="mt-2 grid gap-2 @lg:grid-cols-3">
                  {dispositions.map((id) => {
                    const d = DISPOSITIONS.find((x) => x.id === id);
                    return (
                      <Label
                        key={id}
                        htmlFor={`pv-disp-${id}`}
                        className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2.5 font-normal"
                      >
                        <RadioGroupItem id={`pv-disp-${id}`} value={id} />
                        {d?.label ?? id}
                      </Label>
                    );
                  })}
                </RadioGroup>
                <FieldNote custom>custom_disposition ที่ใบตรวจ</FieldNote>
              </div>
            )}

            {/* หมายเหตุท้ายใบเป็นของ ERPNext เอง ไม่ต้องสร้างเพิ่ม —
                คนละช่องกับหมายเหตุรายข้อที่ต้องทำเป็น custom field */}
            <div className="mt-6 space-y-1.5">
              <Label htmlFor="pv-remarks">
                หมายเหตุ{" "}
                <span className="font-normal text-muted-foreground">
                  (ไม่บังคับ)
                </span>
              </Label>
              <Input
                id="pv-remarks"
                className="bg-card"
                placeholder="ระบุหมายเหตุ"
              />
              <FieldNote>remarks</FieldNote>
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
                  {r.kind === "system" ? (
                    <Select
                      value={r.source}
                      onValueChange={(v) => onPatch(r.id, { source: v as SourceId })}
                    >
                      <SelectTrigger aria-label="หัวข้อตรวจ" className="w-full bg-card">
                        <SelectValue placeholder="เลือกหัวข้อ" />
                      </SelectTrigger>
                      <SelectContent>
                        {CHECK_SOURCES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {SOURCE[s].label}
                            {SOURCE[s].custom && " — ไม่มีใน ERPNext"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    /* ไม่ใช่ดรอปดาวน์ธรรมดา — ค้นได้ และพิมพ์ชื่อที่ยังไม่มีแล้วกด
                       สร้างใหม่ลงทะเบียนได้ในช่องเดียวกัน เพราะถ้าสร้างหัวข้อใหม่
                       ต้องออกไปหน้าทะเบียนก่อน คนจะเลือกหัวข้อที่ใกล้เคียงไปก่อน
                       แล้วทะเบียนก็จะไม่ตรงกับฟอร์มตลอดไป */
                    <ParamCombobox
                      id={`${r.id}-param`}
                      value={r.paramId}
                      onChange={(v) => onPatch(r.id, { paramId: v })}
                    />
                  )}
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
                      : "specification → Quality Inspection Parameter · พิมพ์ชื่อใหม่แล้วกดสร้างลงทะเบียนได้"}
                  </FieldNote>
                </td>

                <td className="px-4 py-3 align-top">
                  <Select
                    value={r.kind}
                    onValueChange={(v) =>
                      // สลับประเภทแล้วชื่อหัวข้อใช้ร่วมกันไม่ได้ ล้างทั้งคู่
                      // ไม่งั้นจะเหลือชื่อจากทะเบียนค้างอยู่ในข้อที่ดึงจากระบบ
                      onPatch(r.id, { kind: v as Kind, paramId: "", source: "" })
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
          {/* อยู่ทั้งในตารางและในกล่อง — ในตารางไว้กวาดตาเทียบว่าข้อไหนระบบตัดสิน
              ข้อไหนคนตัดสิน ในกล่องไว้ตั้งตอนกำลังตั้งเกณฑ์อยู่ จะได้ไม่ต้อง
              ปิดกล่องออกไปติ๊กข้างนอกแล้วเปิดกลับเข้ามาใหม่ */}
          <label className="flex items-start gap-3 rounded-lg border border-border bg-muted px-3 py-2.5">
            <Checkbox
              className="mt-0.5"
              checked={row.manual}
              onCheckedChange={(v) => onChange({ manual: v === true })}
            />
            <span className="text-sm">
              <span className="font-medium">ผู้ตรวจตัดสินเอง</span>
              <span className="block text-muted-foreground">
                ระบบเก็บค่าที่วัดไว้เหมือนเดิม แต่ไม่ชี้ขาดให้ — ติ๊กคู่กับเกณฑ์ข้างล่างได้
              </span>
              <FieldNote custom>
                custom_manual_inspection → manual_inspection ของแถวในใบตรวจ
              </FieldNote>
            </span>
          </label>

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
              {/* กล่องยาว ไม่ใช่ช่องบรรทัดเดียว — สูตรจริงยาวกว่าที่คิด เช่น
                  ตรวจทุกค่าพร้อมกัน หรือซ้อน and/or หลายชั้น พิมพ์ในช่องบรรทัด
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

/* ------------------------------------------------------------------
   ตารางตัวอย่าง — หนึ่งแถวคือหนึ่งตัวอย่างที่สุ่มมา

   ต่างจากการวัดซ้ำสิบครั้งตรงที่แต่ละแถวมีผลผ่าน/ไม่ผ่านของตัวเอง
   ซึ่งเป็นสิ่งที่ Quality Inspection ทำไม่ได้ เพราะหนึ่งแถวใน readings
   มี status ช่องเดียว บอกได้แค่ว่า "หัวข้อน้ำหนักตก" ไม่ได้บอกว่ากระสอบไหนตก
------------------------------------------------------------------ */

function SampleGrid({
  checks,
  samples,
  onAdd,
  onRemove,
}: {
  checks: CheckRow[];
  samples: string[];
  onAdd: () => void;
  onRemove: (id: string) => void;
}) {
  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="px-3 py-2 text-left font-medium">#</th>
              {checks.map((r) => (
                <th
                  key={r.id}
                  className="px-3 py-2 text-left font-medium whitespace-nowrap"
                >
                  {rowName(r) || "ยังไม่ได้เลือกหัวข้อ"}
                </th>
              ))}
              <th className="px-3 py-2 text-left font-medium">ผล</th>
              <th className="w-12 px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {samples.map((sid, i) => (
              <tr key={sid} className="border-t border-border">
                <td className="px-3 py-2 text-muted-foreground tabular-nums">
                  {i + 1}
                </td>
                {checks.map((r) => (
                  <td key={r.id} className="px-3 py-2">
                    <CellInput id={`${sid}-${r.id}`} row={r} />
                  </td>
                ))}
                <td className="px-3 py-2">
                  <VerdictPick id={sid} />
                </td>
                <td className="px-3 py-2">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`ลบตัวอย่างที่ ${i + 1}`}
                    disabled={samples.length <= 1}
                    onClick={() => onRemove(sid)}
                  >
                    <Trash2Icon />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex justify-center">
        <Button variant="outline-primary" onClick={onAdd}>
          <PlusIcon />
          เพิ่มตัวอย่าง
        </Button>
      </div>
      <FieldNote custom>
        QC Check Sample — แถวไม่จำกัด และ status อยู่ที่แถว ไม่ใช่ที่หัวข้อ
      </FieldNote>
    </>
  );
}

/** ช่องกรอกหนึ่งช่องในตารางตัวอย่าง — หน้าตาเดียวกับในการ์ด แต่ไม่มีป้ายกำกับ */
function CellInput({ id, row }: { id: string; row: CheckRow }) {
  const choices = row.value
    .split("/")
    .map((o) => o.trim())
    .filter(Boolean);

  if (row.kind === "system") return <PoolSelect id={id} source={row.source} />;

  if (!row.numeric && !row.formulaBased && choices.length > 1) {
    return (
      <Select>
        <SelectTrigger id={id} className="w-full min-w-28 bg-card">
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
    );
  }

  return (
    <Input
      id={id}
      className="min-w-24 bg-card"
      inputMode={row.numeric ? "decimal" : "text"}
      placeholder={row.numeric ? "0" : row.value || "ระบุ"}
    />
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
  action,
  children,
}: {
  index?: number;
  title: string;
  note?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-semibold">
            {index !== undefined && (
              <span className="text-muted-foreground">{index}. </span>
            )}
            {title}
          </h2>
          {note && (
            <p className="mt-0.5 text-sm text-muted-foreground">{note}</p>
          )}
        </div>
        {action}
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
