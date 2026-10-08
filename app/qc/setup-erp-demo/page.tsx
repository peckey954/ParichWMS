"use client";

import * as React from "react";
import Link from "next/link";
import {
  ChevronDownIcon,
  ChevronsUpDownIcon,
  ChevronUpIcon,
  FlaskConicalIcon,
  MinusIcon,
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
import { CheckChip } from "@/components/check-chip";
import { ChipGroup } from "@/components/chip-group";
import { ITEM_POOL } from "@/lib/qc-erp";

/* ------------------------------------------------------------------
   ตัวอย่างหน้าตั้งค่าแบบใหม่ — หน้าแยก ไม่แตะของจริง

   หน้านี้ไม่ได้ต่อกับ QI_TEMPLATES ตั้งอะไรในนี้ไม่กระทบเทมเพลตจริงสักใบ

   รอบนี้ยุบ "ข้อมูลของตัวอย่างที่สุ่ม" ที่เคยแยกเป็นหัวข้อของตัวเอง เข้ามาเป็น
   ประเภทข้อมูลอันหนึ่งของหัวข้อตรวจ — เลือก "ดึงจากระบบ" แล้วหัวข้อนั้นก็กลาย
   เป็นช่องเลือกจากรายการของระบบ ไม่ต้องมีตารางที่สองอีกตาราง

   และวิธีนี้ตรงกับ ERPNext มากกว่าตารางแยกด้วย เพราะ reading_1…reading_10 เป็น
   Data ไม่ใช่ Float จึงเก็บ "15-15-15" หรือ "35" ได้ หนึ่งหัวข้อคีย์ได้ถึงสิบค่า
   = สุ่มได้สิบกระสอบในหัวข้อเดียว โดยไม่ต้องสร้างอะไรเพิ่ม

   เพดานสิบค่าเป็นของ ERPNext และหนึ่งหัวข้อมีผลผ่าน/ไม่ผ่านอันเดียว ไม่ใช่
   อันละกระสอบ — สองข้อนี้คือสิ่งที่แลกมากับการไม่ต้อง custom
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

// ---------------------------------------------------------------
// สองแกนที่ประกอบกันเป็นหนึ่งหัวข้อ — แยกกันคนละคอลัมน์เพราะเป็นคนละคำถาม
//
//   ผู้ตรวจกรอกอะไร   เลือกได้อันเดียว คีย์ตัวเลขกับคีย์ข้อความพร้อมกันไม่ได้
//   ตัดสินยังไง        เลือกได้อันเดียวเหมือนกัน แต่รายการเปลี่ยนตามอันบน
//   ตรวจสอบเอง        ติ๊กแยก ซ้อนทับสองอันบนได้ — ของ ERPNext เป็น Check
//                      คนละตัวกับ numeric จริง ๆ ไม่ใช่ตัวเลือกที่สี่
// ---------------------------------------------------------------

type Entry = "number" | "text" | "choice" | "system" | "tick";

const ENTRY: Record<Entry, { label: string; store: string }> = {
  number: { label: "ตัวเลข", store: "numeric = 1 · reading_1…reading_10" },
  text: { label: "ข้อความ", store: "numeric = 0 · reading_value" },
  choice: { label: "ตัวเลือก", store: "numeric = 0 · value = คำที่ให้เลือก" },
  system: { label: "ดึงจากระบบ", store: "numeric = 0 · reading_1…reading_10" },
  tick: { label: "ติ๊กอย่างเดียว", store: "numeric = 0 · ไม่มีช่องให้กรอก" },
};

const ENTRIES = Object.keys(ENTRY) as Entry[];

type Judge = "range" | "formula" | "value" | "none";

const JUDGE: Record<Judge, { label: string; store: string }> = {
  range: { label: "ช่วงต่ำ–สูง", store: "min_value / max_value" },
  formula: {
    label: "สูตร",
    store: "formula_based_criteria = 1 · acceptance_formula",
  },
  value: { label: "ค่าที่ถือว่าผ่าน", store: "value" },
  none: { label: "ไม่ตัดสินให้", store: "ผู้ตรวจชี้ขาดอย่างเดียว" },
};

/** เกณฑ์ที่เลือกได้ เปลี่ยนตามว่าผู้ตรวจกรอกอะไร — ไม่ใช่รายการเดียวกันทุกแบบ */
function judgesOf(entry: Entry): Judge[] {
  if (entry === "number") return ["range", "formula", "none"];
  if (entry === "text") return ["value", "formula", "none"];
  if (entry === "choice") return ["value", "none"];
  return ["none"];
}

// ---------------------------------------------------------------

type RemarkMode = "off" | "optional" | "onFail";

const REMARK: Record<RemarkMode, string> = {
  off: "ไม่มี",
  optional: "ไม่บังคับ",
  onFail: "บังคับเมื่อไม่ผ่าน",
};

const REMARK_KEYS = Object.keys(REMARK) as RemarkMode[];

type CheckRow = {
  id: string;
  name: string;
  entry: Entry;
  judge: Judge;
  source: SourceId | "";
  min: string;
  max: string;
  formula: string;
  value: string;
  /** manual_inspection — ติ๊กคู่กับเกณฑ์ข้างบนได้ ระบบจะเก็บค่าแต่ไม่ตัดสินให้ */
  manual: boolean;
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
  name: "",
  entry: "tick",
  judge: "none",
  source: "",
  min: "",
  max: "",
  formula: "",
  value: "",
  manual: true,
  readings: 1,
  labels: [],
  criteria: "",
  remark: "onFail",
});

const mk = (p: Partial<CheckRow>): CheckRow => ({ ...blankCheck(), ...p });

const SEED_CHECKS: CheckRow[] = [
  mk({
    name: "สูตรที่สุ่มตรวจ",
    entry: "system",
    source: "item",
    readings: 3,
    labels: ["กระสอบที่ 1", "กระสอบที่ 2", "กระสอบที่ 3"],
    criteria: "สุ่มจากกองที่เพิ่งออกจากไลน์",
  }),
  mk({
    name: "น้ำหนักบรรจุ",
    entry: "number",
    judge: "range",
    min: "50.2",
    max: "50.8",
    manual: false,
    readings: 3,
    criteria: "ชั่งทุกกระสอบที่สุ่ม",
  }),
  mk({
    name: "ขนาดสลิง",
    entry: "choice",
    judge: "value",
    value: "30 / 35 / 40",
    readings: 3,
    criteria: "ต้องตรงกับที่ระบุในใบสั่งผลิต",
  }),
  mk({
    name: "การเย็บกระสอบ",
    criteria: "ด้ายต้องติดตลอดแนว ฝีเข็มสม่ำเสมอ ไม่หลุดไม่ขาด",
  }),
  mk({
    name: "น้ำหนักเฉลี่ยทั้งชุด",
    entry: "number",
    judge: "formula",
    formula: "mean > 50.2",
    manual: false,
    readings: 3,
    criteria: "เฉลี่ยทั้งชุดต้องไม่ต่ำกว่าเกณฑ์",
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
  { id: nid(), label: "เครื่องจักร", source: "machine", required: false },
];

/** ชื่อช่องคีย์ทีละช่อง — ช่องที่ไม่ได้ตั้งชื่อตกเป็น "ครั้งที่ N" */
const readingLabels = (r: CheckRow) =>
  Array.from(
    { length: r.readings },
    (_, i) => r.labels[i]?.trim() || `ครั้งที่ ${i + 1}`
  );

/** บรรทัดสรุปบนหัวการ์ดตอนหุบอยู่ — อ่านจากที่ตั้งไว้ ไม่ได้เก็บแยก */
function describe(r: CheckRow) {
  const bits: string[] = [ENTRY[r.entry].label];
  if (r.entry === "system")
    bits.push(r.source === "" ? "ยังไม่ได้เลือกแหล่ง" : SOURCE[r.source].label);
  if (r.judge === "range") bits.push(`${r.min || "0"}–${r.max || "0"}`);
  if (r.judge === "formula") bits.push(r.formula || "ยังไม่ได้เขียนสูตร");
  if (r.judge === "value") bits.push(r.value || "ยังไม่ได้ใส่ค่า");
  if (r.entry !== "tick" && r.readings > 1) bits.push(`คีย์ ${r.readings} ค่า`);
  if (r.manual) bits.push("ตรวจสอบเอง");
  return bits.join(" · ");
}

export default function SetupErpDemoPage() {
  const [header, setHeader] = React.useState<DocField[]>(SEED_HEADER);
  const [checks, setChecks] = React.useState<CheckRow[]>(SEED_CHECKS);
  const [open, setOpen] = React.useState<string[]>([]);

  const toggle = (id: string) =>
    setOpen((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  /* เหตุผลที่ลง ERPNext ไม่ได้ — อ่านจากแหล่งข้อมูลที่ตั้งไว้ ไม่มีช่องให้เลือกเอง
     ทั้งส่วนหัวเอกสารและหัวข้อตรวจนับรวมกัน เพราะทั้งคู่ชี้ไปของชิ้นเดียวกัน */
  const blockers = [
    ...header
      .filter((f) => f.source !== "" && SOURCE[f.source].custom)
      .map((f) => `ส่วนหัว “${f.label || "ไม่มีชื่อ"}” ← ${SOURCE[f.source as SourceId].label}`),
    ...checks
      .filter((r) => r.entry === "system" && r.source !== "" && SOURCE[r.source].custom)
      .map((r) => `หัวข้อ “${r.name || "ไม่มีชื่อ"}” ← ${SOURCE[r.source as SourceId].label}`),
  ];
  const onErpnext = blockers.length === 0;

  const patch = (id: string, next: Partial<CheckRow>) =>
    setChecks((p) => p.map((r) => (r.id === id ? { ...r, ...next } : r)));

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
        FM-QC-02-06 — ตารางตัวอย่างยุบเข้ามาเป็นประเภทข้อมูลของหัวข้อตรวจแล้ว
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
            : `เพราะ ${blockers.join(" · ")} — ไม่ได้ให้เลือกเอง อ่านจากแหล่งข้อมูลที่ตั้งไว้`}
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
            note="หนึ่งหัวข้อ = หนึ่งแถวใน readings · กดที่หัวการ์ดเพื่อเปิดดูการตั้งค่าที่เหลือ"
          >
            <div className="space-y-3">
              {checks.map((r, i) => (
                <CheckCard
                  key={r.id}
                  index={i + 1}
                  row={r}
                  isFirst={i === 0}
                  isLast={i === checks.length - 1}
                  open={open.includes(r.id)}
                  onToggle={() => toggle(r.id)}
                  onChange={(next) => patch(r.id, next)}
                  onMove={(d) =>
                    setChecks((p) => {
                      const j = i + d;
                      if (j < 0 || j >= p.length) return p;
                      const next = [...p];
                      [next[i], next[j]] = [next[j], next[i]];
                      return next;
                    })
                  }
                  onRemove={() =>
                    setChecks((p) => p.filter((x) => x.id !== r.id))
                  }
                />
              ))}

              {checks.length === 0 && (
                <div className="rounded-xl border border-dashed border-border px-6 py-12 text-center">
                  <p className="font-medium">ยังไม่มีหัวข้อตรวจในฟอร์มนี้</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    กด “เพิ่มหัวข้อตรวจ” แล้วพิมพ์ชื่อหัวข้อที่ต้องการ
                  </p>
                </div>
              )}

              <div className="flex justify-center">
                <Button
                  variant="outline-primary"
                  onClick={() => {
                    const r = blankCheck();
                    setChecks((p) => [...p, r]);
                    // เปิดการ์ดใหม่ไว้เลย เพิ่มมาแล้วหุบอยู่คือต้องกดอีกทีทุกครั้ง
                    setOpen((p) => [...p, r.id]);
                  }}
                >
                  <PlusIcon />
                  เพิ่มหัวข้อตรวจ
                </Button>
              </div>
            </div>
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
    </main>
  );
}

/* ------------------------------------------------------------------
   หนึ่งหัวข้อตรวจ — หุบไว้เห็นบรรทัดสรุป กางออกตั้งได้ครบ

   ที่ต้องหุบเพราะช่องมันเยอะเกินกว่าจะวางเป็นตารางแถวเดียวได้ — ชื่อ ประเภท
   เกณฑ์ จำนวนค่า ชื่อค่าทีละช่อง เกณฑ์ที่คนอ่าน หมายเหตุ รวมเจ็ดกลุ่ม
   กางหมดทุกข้อพร้อมกันคือหน้ายาวจนหาข้อที่จะแก้ไม่เจอ
------------------------------------------------------------------ */

function CheckCard({
  index,
  row,
  isFirst,
  isLast,
  open,
  onToggle,
  onChange,
  onMove,
  onRemove,
}: {
  index: number;
  row: CheckRow;
  isFirst: boolean;
  isLast: boolean;
  open: boolean;
  onToggle: () => void;
  onChange: (next: Partial<CheckRow>) => void;
  onMove: (delta: number) => void;
  onRemove: () => void;
}) {
  const judges = judgesOf(row.entry);
  // ข้อที่ไม่มีเกณฑ์ในระบบ ระบบตัดสินให้ไม่ได้อยู่แล้ว ติ๊กนี้จึงล็อกเปิดไว้
  const manualLocked = row.judge === "none";

  return (
    <div className="rounded-xl border border-border bg-card">
      {/* หัวการ์ดทั้งแถบเป็นปุ่มกาง ไม่ใช่ลูกศรเล็ก ๆ อันเดียวที่ต้องเล็งกด */}
      <div className="flex items-start gap-2 p-4">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          className="min-w-0 flex-1 text-left"
        >
          <p className="font-medium">
            {index}. {row.name || "ยังไม่ได้ตั้งชื่อหัวข้อ"}
          </p>
          <p className="mt-0.5 text-sm text-muted-foreground">{describe(row)}</p>
          {row.criteria && (
            <p className="mt-0.5 text-sm text-muted-foreground">
              เกณฑ์: {row.criteria}
            </p>
          )}
        </button>

        <div className="flex shrink-0 items-center">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="เลื่อนขึ้น"
            disabled={isFirst}
            onClick={() => onMove(-1)}
          >
            <ChevronUpIcon />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="เลื่อนลง"
            disabled={isLast}
            onClick={() => onMove(1)}
          >
            <ChevronDownIcon />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="ลบหัวข้อนี้"
            onClick={onRemove}
          >
            <Trash2Icon />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={open ? "หุบ" : "กางออกเพื่อตั้งค่า"}
            onClick={onToggle}
          >
            <ChevronsUpDownIcon />
          </Button>
        </div>
      </div>

      {open && (
        <div className="space-y-5 border-t border-border p-4">
          <div className="space-y-1.5">
            <Label htmlFor={`${row.id}-name`}>ชื่อหัวข้อ</Label>
            <Input
              id={`${row.id}-name`}
              className="bg-card"
              value={row.name}
              placeholder="พิมพ์ชื่อหัวข้อ"
              onChange={(e) => onChange({ name: e.target.value })}
            />
            {/* ชื่อหัวข้อไม่ใช่ข้อความอิสระ เป็น Link ไปทะเบียนกลาง พิมพ์ชื่อที่
                ยังไม่มีคือสร้างหัวข้อใหม่ลงทะเบียนไปด้วย ซึ่งเป็นเหตุผลว่าทำไม
                ช่องกรอกอิสระไม่ต้อง custom สักช่อง */}
            <FieldNote>
              Quality Inspection Parameter · ลงทะเบียนหัวข้อตรวจกลาง
            </FieldNote>
          </div>

          {/* ชิปเปล่า = เลือกได้อันเดียว คีย์ตัวเลขกับคีย์ข้อความพร้อมกันไม่ได้ */}
          <div className="space-y-1.5">
            <Label>ผู้ตรวจกรอกอะไร</Label>
            <ChipGroup
              label="ผู้ตรวจกรอกอะไร"
              options={ENTRIES.map((e) => ({ id: e, label: ENTRY[e].label }))}
              value={row.entry}
              onChange={(v) => {
                // เกณฑ์ที่เคยเลือกไว้อาจใช้กับประเภทใหม่ไม่ได้ ตกไปตัวแรกที่ใช้ได้
                const next = judgesOf(v);
                onChange({
                  entry: v,
                  judge: next.includes(row.judge) ? row.judge : next[0],
                  source: v === "system" ? row.source : "",
                  readings: v === "tick" ? 1 : row.readings,
                });
              }}
            />
            <FieldNote>{ENTRY[row.entry].store}</FieldNote>
          </div>

          {row.entry === "system" && (
            <div className="space-y-1.5">
              <Label htmlFor={`${row.id}-src`}>ดึงจากไหน</Label>
              <Select
                value={row.source}
                onValueChange={(v) => onChange({ source: v as SourceId })}
              >
                <SelectTrigger id={`${row.id}-src`} className="w-full bg-card">
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
              <FieldNote
                custom={row.source !== "" && SOURCE[row.source].custom}
              >
                {row.source === ""
                  ? "ยังไม่ได้เลือกแหล่งข้อมูล"
                  : SOURCE[row.source].store}
              </FieldNote>
            </div>
          )}

          {/* รายการเกณฑ์เปลี่ยนตามอันบน ไม่ใช่รายการเดียวกันทุกแบบ */}
          {judges.length > 1 && (
            <div className="space-y-1.5">
              <Label>ตัดสินยังไง</Label>
              <ChipGroup
                label="ตัดสินยังไง"
                options={judges.map((j) => ({ id: j, label: JUDGE[j].label }))}
                value={row.judge}
                onChange={(v) =>
                  onChange({
                    judge: v,
                    manual: v === "none" ? true : row.manual,
                  })
                }
              />
              <FieldNote>{JUDGE[row.judge].store}</FieldNote>
            </div>
          )}

          {row.judge === "range" && (
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
              {/* ค่าสูงสุดว่าง = ศูนย์ ไม่ใช่ไม่จำกัด เพราะ ERPNext เทียบ
                  flt(min) <= v <= flt(max) แล้ว flt ของค่าว่างคือ 0 —
                  ปล่อยว่างไว้คือฟอร์มที่ตกทุกใบโดยไม่มีใครรู้ว่าทำไม */}
              {row.max.trim() === "" && !row.manual && (
                <p className="text-sm text-danger-strong">
                  ไม่ใส่ค่าสูงสุด ERPNext อ่านเป็น 0 แล้วทุกใบจะไม่ผ่าน
                </p>
              )}
            </div>
          )}

          {row.judge === "formula" && (
            <div className="space-y-1.5">
              <Label htmlFor={`${row.id}-f`}>สูตร</Label>
              <Input
                id={`${row.id}-f`}
                className="bg-card font-mono text-sm"
                value={row.formula}
                placeholder="เช่น mean > 50.2"
                onChange={(e) => onChange({ formula: e.target.value })}
              />
              <FieldNote>
                {row.entry === "number"
                  ? "ตัวแปรที่ใช้ได้: reading_1…reading_10 และ mean"
                  : "ตัวแปรที่ใช้ได้: reading_value"}
              </FieldNote>
            </div>
          )}

          {row.judge === "value" && (
            <div className="space-y-1.5">
              <Label htmlFor={`${row.id}-v`}>
                {row.entry === "choice" ? "คำที่ให้เลือก" : "ค่าที่ถือว่าผ่าน"}
              </Label>
              <Input
                id={`${row.id}-v`}
                className="bg-card"
                value={row.value}
                placeholder={
                  row.entry === "choice" ? "คั่นด้วย /  เช่น 30 / 35 / 40" : "ค่าที่ถือว่าผ่าน"
                }
                onChange={(e) => onChange({ value: e.target.value })}
              />
            </div>
          )}

          {/* ชิปมีกล่องติ๊ก = ติ๊กได้ ไม่ใช่ตัวเลือกที่ห้าของแถวบน
              ของ ERPNext manual_inspection เป็น Check คนละตัวกับ numeric จริง ๆ */}
          <div className="space-y-1.5">
            <Label>ใครตัดสิน</Label>
            <CheckChip
              id={`${row.id}-manual`}
              label="ผู้ตรวจตัดสินเอง ระบบไม่ชี้ขาดให้"
              checked={row.manual}
              onChange={(v) => !manualLocked && onChange({ manual: v })}
            />
            <FieldNote custom>
              {manualLocked
                ? "ไม่มีเกณฑ์ในระบบ ระบบตัดสินให้ไม่ได้อยู่แล้ว"
                : "custom_manual_inspection → manual_inspection ของแถวในใบตรวจ · ติ๊กคู่กับเกณฑ์ข้างบนได้"}
            </FieldNote>
          </div>

          {row.entry !== "tick" && (
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
                <div className="mt-2 grid gap-2 @lg:grid-cols-2">
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
            <Label>หมายเหตุรายข้อ</Label>
            <ChipGroup
              label="หมายเหตุรายข้อ"
              options={REMARK_KEYS.map((k) => ({ id: k, label: REMARK[k] }))}
              value={row.remark}
              onChange={(v) => onChange({ remark: v })}
            />
            <FieldNote custom>custom_remark ที่แถวของใบตรวจ</FieldNote>
          </div>
        </div>
      )}
    </div>
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
      {/* เลื่อนแนวนอนได้ สี่คอลัมน์ลงจอแคบไม่พอ และบีบให้พอคือได้ช่องชื่อ
          ที่พิมพ์แล้วอ่านไม่ออกว่าพิมพ์อะไรไป */}
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

  return (
    <div className="rounded-xl border border-border p-4">
      <p className="font-medium">
        {index}. {row.name || "ยังไม่ได้ตั้งชื่อหัวข้อ"}
      </p>
      {row.criteria && (
        <p className="mt-0.5 text-sm text-muted-foreground">
          เกณฑ์: {row.criteria}
        </p>
      )}

      {/* ช่องกรอกโผล่เฉพาะหัวข้อที่มีอะไรให้กรอก ข้อที่ติ๊กอย่างเดียวมีแต่ปุ่ม
          ผ่าน/ไม่ผ่าน ไม่มีช่องว่างเปล่าให้งงว่าต้องกรอกอะไรลงไป */}
      {row.entry !== "tick" && (
        <div className="mt-3 grid gap-3 @lg:grid-cols-3">
          {labels.map((l, i) => (
            <div key={i} className="space-y-1.5">
              <Label htmlFor={`pvc-${row.id}-${i}`} className="text-sm">
                {l}
              </Label>
              {row.entry === "system" ? (
                <PoolSelect id={`pvc-${row.id}-${i}`} source={row.source} />
              ) : row.entry === "choice" ? (
                <Select>
                  <SelectTrigger id={`pvc-${row.id}-${i}`} className="w-full bg-card">
                    <SelectValue placeholder="เลือก" />
                  </SelectTrigger>
                  <SelectContent>
                    {row.value
                      .split("/")
                      .map((o) => o.trim())
                      .filter(Boolean)
                      .map((o) => (
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
                  inputMode={row.entry === "number" ? "decimal" : "text"}
                  placeholder={row.entry === "number" ? "0" : "ระบุ"}
                />
              )}
            </div>
          ))}
        </div>
      )}

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
