"use client";

import * as React from "react";
import Link from "next/link";
import {
  ChevronsUpDownIcon,
  FlaskConicalIcon,
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
import { ITEM_POOL } from "@/lib/qc-erp";

/* ------------------------------------------------------------------
   ตัวอย่างหน้าตั้งค่าแบบใหม่ — หน้าแยก ไม่แตะของจริง

   หน้านี้ไม่ได้ต่อกับ QI_TEMPLATES ตั้งอะไรในนี้ไม่กระทบเทมเพลตจริงสักใบ

   ของใหม่สองก้อนที่ลองในนี้
     1  ส่วนหัวเอกสาร — ช่องที่ผู้ตรวจกรอกครั้งเดียวต่อใบ ตั้งเองได้ว่ามีช่องอะไร
        ดึงจากไหน บังคับกรอกไหม
     2  ข้อมูลของตัวอย่างที่สุ่ม — คอลัมน์ที่ซ้ำทุกแถว ใช้ตารางหน้าตาเดียวกัน

   และสิ่งที่หายไปจากของเดิม: ชิปให้เลือกว่าใบไปลง Quality Inspection หรือ
   QC Check — ไม่ต้องเลือกแล้ว อ่านจากแหล่งข้อมูลที่ตั้งไว้เอา เพราะคำตอบมัน
   อยู่ในนั้นอยู่แล้ว เลือกคลังสินค้าหรือเครื่องจักรเมื่อไหร่ก็คือลง ERPNext ไม่ได้
   ให้เลือกซ้ำอีกช่องมีแต่จะตั้งขัดกันเองแล้วต้องมาเตือนทีหลัง
------------------------------------------------------------------ */

// ---------------------------------------------------------------
// แหล่งข้อมูลที่ดึงมาให้เลือกได้ — ตัวที่ตัดสินว่าใบนี้ลง ERPNext ได้ไหม
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
    store: "Quality Inspection · item_code → Item",
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
    store: "Quality Inspection · batch_no → Batch",
    custom: false,
    pool: ["LOT-260115-01", "LOT-260115-02"],
  },
  user: {
    label: "ผู้ตรวจ",
    store: "Quality Inspection · inspected_by → User",
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
// ประเภทข้อมูลของหนึ่งช่อง
// ---------------------------------------------------------------

type FieldKind = "system" | "text" | "number" | "choice";

const KIND_LABEL: Record<FieldKind, string> = {
  system: "ดึงจากระบบ",
  text: "ข้อความ",
  number: "ตัวเลข",
  choice: "ตัวเลือก",
};

const KINDS = Object.keys(KIND_LABEL) as FieldKind[];

type DocField = {
  id: string;
  label: string;
  kind: FieldKind;
  /** ใช้เมื่อ kind = system */
  source: SourceId | "";
  /** ใช้เมื่อ kind = choice */
  options: string[];
  /** ใช้เมื่อ kind = number */
  unit: string;
  required: boolean;
};

let seq = 0;
const nid = () => `f-${++seq}`;

const blankField = (): DocField => ({
  id: nid(),
  label: "",
  kind: "system",
  source: "",
  options: [],
  unit: "",
  required: false,
});

/* ตั้งต้นตามใบตรวจรับสินค้าภายนอก — สองช่องแรกลง ERPNext ได้
   ช่องเครื่องจักรคือตัวที่ทำให้ทั้งใบลง ERPNext ไม่ได้ ลองลบดูแล้วแถบบนจะพลิก */
const SEED_HEADER: DocField[] = [
  {
    id: nid(),
    label: "วัตถุดิบสินค้า",
    kind: "system",
    source: "item",
    options: [],
    unit: "",
    required: true,
  },
  {
    id: nid(),
    label: "เลขที่เอกสาร",
    kind: "system",
    source: "docPr",
    options: [],
    unit: "",
    required: true,
  },
  {
    id: nid(),
    label: "เครื่องจักร",
    kind: "system",
    source: "machine",
    options: [],
    unit: "",
    required: false,
  },
];

/* คอลัมน์ที่ซ้ำทุกแถวของใบสุ่มตรวจ — ตรงกับกระดาษ FM-QC-02-06 */
const SEED_SAMPLE: DocField[] = [
  {
    id: nid(),
    label: "สูตร",
    kind: "system",
    source: "item",
    options: [],
    unit: "",
    required: true,
  },
  {
    id: nid(),
    label: "น้ำหนักที่ชั่ง",
    kind: "number",
    source: "",
    options: [],
    unit: "กก.",
    required: true,
  },
  {
    id: nid(),
    label: "สลิง",
    kind: "choice",
    source: "",
    options: ["30", "35", "40"],
    unit: "",
    required: false,
  },
];

// ---------------------------------------------------------------
// หนึ่งหัวข้อตรวจ — Item Quality Inspection Parameter
//
// ชื่อหัวข้อคือ Link ไปทะเบียน Quality Inspection Parameter ไม่ใช่ข้อความอิสระ
// ส่วนวิธีตัดสินมีสามทางที่ ERPNext รองรับตรงตัว และติ๊ก "ตรวจสอบเอง" ซ้อนทับได้
// ---------------------------------------------------------------

type CheckKind = "number" | "formula" | "text" | "tick";

const CHECK_KIND: Record<CheckKind, { label: string; store: string }> = {
  number: {
    label: "ตัวเลข",
    store: "numeric = 1 · min_value / max_value",
  },
  formula: {
    label: "สูตร",
    store: "formula_based_criteria = 1 · acceptance_formula",
  },
  text: {
    label: "ข้อความ",
    store: "numeric = 0 · value = ค่าที่ถือว่าผ่าน",
  },
  tick: {
    label: "ติ๊กอย่างเดียว",
    store: "numeric = 0 · ไม่มีเกณฑ์ในระบบ ผู้ตรวจชี้ขาด",
  },
};

const CHECK_KINDS = Object.keys(CHECK_KIND) as CheckKind[];

type CheckRow = {
  id: string;
  name: string;
  kind: CheckKind;
  min: string;
  max: string;
  formula: string;
  value: string;
  /** manual_inspection — ซ้อนทับวิธีตัดสินข้างบนได้ ระบบจะไม่ตัดสินให้ */
  manual: boolean;
  /** เกณฑ์ที่เขียนให้คนยืนตรวจอ่าน — ไม่มีใน ERPNext */
  criteria: string;
};

const blankCheck = (): CheckRow => ({
  id: nid(),
  name: "",
  kind: "tick",
  min: "",
  max: "",
  formula: "",
  value: "",
  manual: true,
  criteria: "",
});

const SEED_ROWS: CheckRow[] = [
  {
    ...blankCheck(),
    name: "การเย็บกระสอบ",
    criteria: "ด้ายต้องติดตลอดแนว ฝีเข็มสม่ำเสมอ ไม่หลุดไม่ขาด",
  },
  {
    ...blankCheck(),
    name: "ความคมชัดของสูตรปุ๋ย",
    criteria: "ตัวเลขสูตรปุ๋ยบนกระสอบต้องอ่านออกชัดเจน",
  },
  {
    ...blankCheck(),
    name: "น้ำหนักบรรจุ",
    kind: "number",
    min: "50.2",
    max: "50.8",
    manual: false,
    criteria: "ชั่งทุกกระสอบที่สุ่ม",
  },
  {
    ...blankCheck(),
    name: "น้ำหนักรวมของที่สุ่ม",
    kind: "formula",
    formula: "mean > 50.2",
    manual: false,
    criteria: "เฉลี่ยทั้งชุดต้องไม่ต่ำกว่าเกณฑ์",
  },
];

/**
 * ช่องนี้ ERPNext มีที่เก็บให้ไหม
 *
 * ช่องที่ผู้ตรวจกรอกเองไม่ต้อง custom เลยสักช่อง — ตั้งชื่อหัวข้อแล้วลงทะเบียน
 * Quality Inspection Parameter ช่องนั้นก็กลายเป็นแถวในตาราง readings ทันที
 * ตาราง readings เพิ่มแถวได้ไม่จำกัด จึงเป็นที่เก็บช่องกรอกอิสระของ ERPNext อยู่แล้ว
 *
 * เคยแมปช่องข้อความไปที่ description ซึ่งผิด — description เป็นคำอธิบายของใบ
 * ไม่ใช่ช่องเก็บค่าที่ผู้ตรวจกรอก และมีช่องเดียวต่อใบ
 *
 * ที่เป็น custom จริงเหลือทางเดียวคือดึงจากระบบจากของที่ Quality Inspection
 * ไม่มีช่อง Link ไปหา — คลังสินค้ากับเครื่องจักร
 */
function fieldStore(f: DocField) {
  if (f.kind === "system") {
    if (f.source === "") return { custom: false, text: "ยังไม่ได้เลือกแหล่งข้อมูล" };
    return { custom: SOURCE[f.source].custom, text: SOURCE[f.source].store };
  }
  if (f.kind === "number")
    return {
      custom: false,
      text: "ทะเบียนหัวข้อตรวจ → readings · numeric = 1 · reading_1",
    };
  if (f.kind === "choice")
    return {
      custom: false,
      text: "ทะเบียนหัวข้อตรวจ → readings · numeric = 0 · value = คำที่ให้เลือก",
    };
  return {
    custom: false,
    text: "ทะเบียนหัวข้อตรวจ → readings · numeric = 0 · reading_value",
  };
}

export default function SetupErpDemoPage() {
  const [header, setHeader] = React.useState<DocField[]>(SEED_HEADER);
  const [sample, setSample] = React.useState<DocField[]>(SEED_SAMPLE);
  const [checks, setChecks] = React.useState<CheckRow[]>(SEED_ROWS);
  const [samples, setSamples] = React.useState<{ id: string }[]>([
    { id: nid() },
    { id: nid() },
  ]);

  /* เหตุผลที่ลง ERPNext ไม่ได้ — อ่านจากที่ตั้งไว้ ไม่มีช่องให้เลือกเอง
     ตารางตัวอย่างนับรวมด้วยเพราะ Quality Inspection ไม่มีแนวคิดนี้เลย
     ใบหนึ่งใบเก็บสินค้าได้ตัวเดียว สุ่มคนละสูตรมาแผ่นเดียวจึงลงไม่ได้ */
  const blockers = [
    ...header
      .filter((f) => fieldStore(f).custom)
      .map((f) => `ส่วนหัวเอกสาร “${f.label || "ช่องที่ยังไม่ได้ตั้งชื่อ"}”`),
    ...(sample.length > 0 ? [`ตารางข้อมูลตัวอย่าง (${sample.length} คอลัมน์)`] : []),
  ];
  const onErpnext = blockers.length === 0;

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
        FM-QC-02-06 — ใบที่ต้องใช้ของใหม่ครบทั้งสองก้อน
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

      {/* แถบบอกปลายทาง — อ่านจากที่ตั้งไว้ ไม่ใช่ช่องให้เลือก
          ลบช่องเครื่องจักรกับคอลัมน์ตัวอย่างออกให้หมดแล้วแถบนี้จะพลิกเป็นเขียว */}
      <div
        className={cn(
          "mt-4 rounded-xl border px-4 py-3",
          onErpnext
            ? "border-success-border bg-success"
            : "border-border bg-brand"
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
          {onErpnext ? (
            <>
              ทุกช่องมีที่เก็บใน doctype มาตรฐาน — บล็อกการรับของได้
              อยู่ใต้ Stock Settings และเข้ารายงานมาตรฐานของ ERPNext
            </>
          ) : (
            <>
              เพราะ {blockers.join(" · ")} — ไม่ได้ให้เลือกเอง
              อ่านจากแหล่งข้อมูลที่ตั้งไว้ ลบตัวที่ทำให้ติดออกแล้วจะกลับไปลง
              ERPNext ได้เอง
            </>
          )}
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
            note="ช่องที่ผู้ตรวจต้องกรอกก่อนเริ่มตรวจ เช่น เลขที่เอกสาร สินค้า เครื่องจักร · กรอกครั้งเดียวต่อใบ"
          >
            <FieldTable
              fields={header}
              onChange={setHeader}
              addLabel="เพิ่มหัวเอกสาร"
              nameHead="หัวเอกสาร"
            />
          </Section>

          <Section
            index={2}
            title="ข้อมูลของตัวอย่างที่สุ่ม"
            note="คอลัมน์ที่ซ้ำทุกแถว — ไม่ใช่หัวข้อตรวจ ไม่ได้ตอบว่าผ่านไหม แต่ตอบว่าตัวอย่างที่สุ่มมาคืออันไหน"
          >
            <FieldTable
              fields={sample}
              onChange={setSample}
              addLabel="เพิ่มคอลัมน์"
              nameHead="ชื่อคอลัมน์"
              alwaysCustom="QC Check Sample"
            />
          </Section>

          <Section
            index={3}
            title={`หัวข้อตรวจ (${checks.length})`}
            note="สิ่งที่ตัดสินว่าผ่านหรือไม่ผ่าน · หนึ่งหัวข้อ = หนึ่งแถวใน readings = หนึ่งเกณฑ์"
          >
            <CheckTable rows={checks} onChange={setChecks} />
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
                    <FieldInput id={`pv-${f.id}`} field={f} />
                  </div>
                ))}
              </div>
            )}

            {sample.length > 0 && (
              <>
                <h3 className="mt-6 mb-2 font-semibold">ตัวอย่างที่สุ่มมา</h3>
                {/* เลื่อนแนวนอนได้ คอลัมน์ตั้งเองได้จึงกว้างเท่าไหร่ก็ได้
                    ล็อกความกว้างแล้วตัดคำคือหน้างานอ่านไม่ออกว่าคอลัมน์ไหน */}
                <div className="overflow-x-auto rounded-xl border border-border">
                  <table className="w-full min-w-[640px] text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium">#</th>
                        {sample.map((c) => (
                          <th
                            key={c.id}
                            className="px-3 py-2 text-left font-medium whitespace-nowrap"
                          >
                            {c.label || "ยังไม่ได้ตั้งชื่อ"}
                            {c.kind === "number" && c.unit && (
                              <span className="font-normal text-muted-foreground">
                                {" "}
                                ({c.unit})
                              </span>
                            )}
                          </th>
                        ))}
                        <th className="px-3 py-2 text-left font-medium">ผล</th>
                      </tr>
                    </thead>
                    <tbody>
                      {samples.map((s, i) => (
                        <tr key={s.id} className="border-t border-border">
                          <td className="px-3 py-2 text-muted-foreground tabular-nums">
                            {i + 1}
                          </td>
                          {sample.map((c) => (
                            <td key={c.id} className="px-3 py-2">
                              <FieldInput id={`${s.id}-${c.id}`} field={c} />
                            </td>
                          ))}
                          <td className="px-3 py-2">
                            <VerdictPick id={s.id} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-3 flex justify-center">
                  <Button
                    variant="outline-primary"
                    onClick={() =>
                      setSamples((p) => [...p, { id: nid() }])
                    }
                  >
                    <PlusIcon />
                    เพิ่มตัวอย่าง
                  </Button>
                </div>
                <FieldNote custom>
                  QC Check Sample — จำนวนแถวไม่ตายตัวตามเทมเพลต
                  สุ่มได้กี่กระสอบก็เพิ่มเท่านั้น
                </FieldNote>
              </>
            )}

            <h3 className="mt-6 mb-2 font-semibold">การตรวจสอบ</h3>
            <div className="space-y-3">
              {checks.map((r, i) => (
                <div key={r.id} className="rounded-xl border border-border p-4">
                  <p className="font-medium">
                    {i + 1}. {r.name || "ยังไม่ได้ตั้งชื่อหัวข้อ"}
                  </p>
                  {r.criteria && (
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      เกณฑ์: {r.criteria}
                    </p>
                  )}
                  <div className="mt-3 flex flex-wrap items-end gap-4">
                    {/* ช่องคีย์โผล่เฉพาะหัวข้อที่มีอะไรให้คีย์ ข้อที่ติ๊กอย่างเดียว
                        มีแต่ปุ่มผ่าน/ไม่ผ่าน ไม่มีช่องว่างเปล่าให้งงว่าต้องกรอกอะไร */}
                    {r.kind !== "tick" && (
                      <div className="space-y-1.5">
                        <Label htmlFor={`pvc-${r.id}`} className="text-sm">
                          {r.kind === "number" || r.kind === "formula"
                            ? `ค่าที่วัดได้${r.kind === "number" && r.min && r.max ? ` (${r.min}–${r.max})` : ""}`
                            : "ค่าที่ตรวจพบ"}
                        </Label>
                        <Input
                          id={`pvc-${r.id}`}
                          className="w-48 bg-card"
                          inputMode={r.kind === "text" ? "text" : "decimal"}
                          placeholder={r.kind === "text" ? r.value || "ระบุ" : "0"}
                        />
                      </div>
                    )}
                    <VerdictPick id={r.id} />
                  </div>
                  {/* ข้อที่ติ๊กตรวจสอบเองระบบไม่ตัดสินให้ ต้องบอกไว้ ไม่งั้นคนคีย์
                      จะรอให้มันเปลี่ยนสีเองแล้วไม่เปลี่ยน */}
                  {r.manual && r.kind !== "tick" && (
                    <FieldNote custom>
                      ติ๊กตรวจสอบเอง — เก็บค่าที่วัดไว้ แต่ระบบไม่ตัดสินให้
                    </FieldNote>
                  )}
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </main>
  );
}

/* ------------------------------------------------------------------
   ตารางตั้งช่อง — ใช้ตัวเดียวกันทั้งส่วนหัวเอกสารและคอลัมน์ตัวอย่าง
   สองก้อนนี้ตั้งเหมือนกันทุกช่อง ต่างแค่กรอกครั้งเดียวต่อใบ หรือซ้ำทุกแถว
------------------------------------------------------------------ */

function FieldTable({
  fields,
  onChange,
  addLabel,
  nameHead,
  alwaysCustom,
}: {
  fields: DocField[];
  onChange: (next: DocField[]) => void;
  addLabel: string;
  nameHead: string;
  /** ก้อนที่ไม่มีทางลง ERPNext ได้ไม่ว่าตั้งยังไง — บอกไปเลยว่าไปอยู่ไหน */
  alwaysCustom?: string;
}) {
  const patch = (id: string, next: Partial<DocField>) =>
    onChange(fields.map((f) => (f.id === id ? { ...f, ...next } : f)));

  const move = (id: string, delta: number) => {
    const i = fields.findIndex((f) => f.id === id);
    const j = i + delta;
    if (i < 0 || j < 0 || j >= fields.length) return;
    const next = [...fields];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <>
      {/* ตารางเลื่อนแนวนอนได้ ห้าคอลัมน์ลงจอแคบไม่พอ และบีบให้พอคือได้ช่อง
          ชื่อที่พิมพ์แล้วอ่านไม่ออกว่าพิมพ์อะไรไป */}
      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full min-w-[840px]">
          <thead>
            <tr className="border-b border-border text-sm text-muted-foreground">
              <th className="px-4 py-3 text-left font-normal">{nameHead}</th>
              <th className="w-48 px-4 py-3 text-left font-normal">
                ประเภทข้อมูล
              </th>
              <th className="px-4 py-3 text-left font-normal">
                ตัวเลือก / แหล่งข้อมูล
              </th>
              <th className="w-28 px-4 py-3 text-center font-normal">
                บังคับกรอก
              </th>
              <th className="w-24 px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {fields.map((f, i) => {
              const store = alwaysCustom
                ? { custom: true, text: `${alwaysCustom} · ${KIND_LABEL[f.kind]}` }
                : fieldStore(f);

              return (
                <tr key={f.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 align-top">
                    <Input
                      aria-label={nameHead}
                      className="bg-card"
                      value={f.label}
                      placeholder="ระบุชื่อช่อง"
                      onChange={(e) => patch(f.id, { label: e.target.value })}
                    />
                  </td>

                  <td className="px-4 py-3 align-top">
                    <Select
                      value={f.kind}
                      onValueChange={(v) =>
                        // เปลี่ยนประเภทแล้วล้างค่าของประเภทเดิม ไม่งั้นจะเหลือ
                        // แหล่งข้อมูลค้างอยู่ในช่องที่ไม่ได้ดึงจากระบบแล้ว
                        patch(f.id, {
                          kind: v as FieldKind,
                          source: "",
                          options: [],
                          unit: "",
                        })
                      }
                    >
                      <SelectTrigger aria-label="ประเภทข้อมูล" className="w-full bg-card">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {KINDS.map((k) => (
                          <SelectItem key={k} value={k}>
                            {KIND_LABEL[k]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>

                  <td className="px-4 py-3 align-top">
                    {f.kind === "system" ? (
                      <Select
                        value={f.source}
                        onValueChange={(v) =>
                          patch(f.id, { source: v as SourceId })
                        }
                      >
                        <SelectTrigger
                          aria-label="แหล่งข้อมูล"
                          className="w-full bg-card"
                        >
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
                    ) : f.kind === "choice" ? (
                      <Input
                        aria-label="คำที่ให้เลือก"
                        className="bg-card"
                        value={f.options.join(" / ")}
                        placeholder="คั่นด้วย /  เช่น 30 / 35 / 40"
                        onChange={(e) =>
                          patch(f.id, {
                            options: e.target.value
                              .split("/")
                              .map((s) => s.trim())
                              .filter(Boolean),
                          })
                        }
                      />
                    ) : f.kind === "number" ? (
                      <Input
                        aria-label="หน่วย"
                        className="bg-card"
                        value={f.unit}
                        placeholder="หน่วย เช่น กก."
                        onChange={(e) => patch(f.id, { unit: e.target.value })}
                      />
                    ) : (
                      <p className="py-2 text-sm text-muted-foreground">
                        ผู้ตรวจพิมพ์เอง ไม่มีรายการให้เลือก
                      </p>
                    )}
                    <FieldNote custom={store.custom}>{store.text}</FieldNote>
                  </td>

                  <td className="px-4 py-3 text-center align-top">
                    <Checkbox
                      aria-label="บังคับกรอก"
                      className="mt-2.5"
                      checked={f.required}
                      onCheckedChange={(v) =>
                        patch(f.id, { required: v === true })
                      }
                    />
                  </td>

                  <td className="px-4 py-3 align-top">
                    <div className="mt-1 flex items-center justify-end">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="สลับกับช่องก่อนหน้า"
                        disabled={i === 0}
                        onClick={() => move(f.id, -1)}
                      >
                        <ChevronsUpDownIcon />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="ลบช่องนี้"
                        onClick={() =>
                          onChange(fields.filter((x) => x.id !== f.id))
                        }
                      >
                        <Trash2Icon />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {fields.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center">
                  <p className="font-medium">ยังไม่มีช่องในส่วนนี้</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    กด “{addLabel}” เพื่อเพิ่มช่องแรก
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
          onClick={() => onChange([...fields, blankField()])}
        >
          <PlusIcon />
          {addLabel}
        </Button>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------
   ตารางหัวข้อตรวจ — ของที่หายไปรอบก่อน เอากลับมาครบ

   สามคอลัมน์ขวาคือสิ่งที่ ERPNext ใช้ตัดสินจริง
     ประเภทข้อมูล   numeric / formula_based_criteria
     เกณฑ์ตัดสิน     min_value-max_value / acceptance_formula / value
     ตรวจสอบเอง     manual_inspection ซ้อนทับสองอันบนได้ ติ๊กแล้วระบบไม่ตัดสินให้
------------------------------------------------------------------ */

function CheckTable({
  rows,
  onChange,
}: {
  rows: CheckRow[];
  onChange: (next: CheckRow[]) => void;
}) {
  const patch = (id: string, next: Partial<CheckRow>) =>
    onChange(rows.map((r) => (r.id === id ? { ...r, ...next } : r)));

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full min-w-[1020px]">
          <thead>
            <tr className="border-b border-border text-sm text-muted-foreground">
              <th className="px-4 py-3 text-left font-normal">หัวข้อตรวจ</th>
              <th className="w-40 px-4 py-3 text-left font-normal">
                ประเภทข้อมูล
              </th>
              <th className="w-64 px-4 py-3 text-left font-normal">เกณฑ์ตัดสิน</th>
              <th className="px-4 py-3 text-left font-normal">
                เกณฑ์ที่ผู้ตรวจอ่าน
              </th>
              <th className="w-28 px-4 py-3 text-center font-normal">
                ตรวจสอบเอง
              </th>
              <th className="w-16 px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 align-top">
                  <Input
                    aria-label="หัวข้อตรวจ"
                    className="bg-card"
                    value={r.name}
                    placeholder="พิมพ์ชื่อหัวข้อ"
                    onChange={(e) => patch(r.id, { name: e.target.value })}
                  />
                  {/* ชื่อหัวข้อไม่ใช่ข้อความอิสระ — เป็น Link ไปทะเบียนกลาง
                      พิมพ์ชื่อที่ยังไม่มีคือสร้างหัวข้อใหม่ลงทะเบียนไปด้วย
                      ซึ่งเป็นเหตุผลว่าทำไมช่องกรอกอิสระไม่ต้อง custom สักช่อง */}
                  <FieldNote>
                    Quality Inspection Parameter · ลงทะเบียนหัวข้อตรวจกลาง
                  </FieldNote>
                </td>

                <td className="px-4 py-3 align-top">
                  <Select
                    value={r.kind}
                    onValueChange={(v) =>
                      // ล้างเกณฑ์ของประเภทเดิม ไม่งั้นจะเหลือสูตรค้างอยู่ในข้อ
                      // ที่เปลี่ยนไปเป็นช่วงตัวเลขแล้ว ซึ่งมองไม่เห็นจากหน้าจอ
                      patch(r.id, {
                        kind: v as CheckKind,
                        min: "",
                        max: "",
                        formula: "",
                        value: "",
                      })
                    }
                  >
                    <SelectTrigger aria-label="ประเภทข้อมูล" className="w-full bg-card">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CHECK_KINDS.map((k) => (
                        <SelectItem key={k} value={k}>
                          {CHECK_KIND[k].label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>

                <td className="px-4 py-3 align-top">
                  {r.kind === "number" ? (
                    <div className="flex items-center gap-2">
                      <Input
                        aria-label="ค่าต่ำสุด"
                        className="bg-card"
                        inputMode="decimal"
                        value={r.min}
                        placeholder="ต่ำสุด"
                        onChange={(e) => patch(r.id, { min: e.target.value })}
                      />
                      <span className="text-muted-foreground">–</span>
                      <Input
                        aria-label="ค่าสูงสุด"
                        className="bg-card"
                        inputMode="decimal"
                        value={r.max}
                        placeholder="สูงสุด"
                        onChange={(e) => patch(r.id, { max: e.target.value })}
                      />
                    </div>
                  ) : r.kind === "formula" ? (
                    <Input
                      aria-label="สูตร"
                      className="bg-card font-mono text-sm"
                      value={r.formula}
                      placeholder="เช่น mean > 50.2"
                      onChange={(e) => patch(r.id, { formula: e.target.value })}
                    />
                  ) : r.kind === "text" ? (
                    <Input
                      aria-label="ค่าที่ถือว่าผ่าน"
                      className="bg-card"
                      value={r.value}
                      placeholder="ค่าที่ถือว่าผ่าน"
                      onChange={(e) => patch(r.id, { value: e.target.value })}
                    />
                  ) : (
                    <p className="py-2 text-sm text-muted-foreground">
                      ไม่มีเกณฑ์ในระบบ ผู้ตรวจติ๊กเอง
                    </p>
                  )}
                  <FieldNote>{CHECK_KIND[r.kind].store}</FieldNote>
                  {/* ค่าสูงสุดว่าง = ศูนย์ ไม่ใช่ไม่จำกัด เพราะ ERPNext เทียบ
                      flt(min) <= v <= flt(max) แล้ว flt ของค่าว่างคือ 0 —
                      ปล่อยว่างไว้คือฟอร์มที่ตกทุกใบโดยไม่มีใครรู้ */}
                  {r.kind === "number" && r.max.trim() === "" && !r.manual && (
                    <p className="mt-1 text-sm text-danger-strong">
                      ไม่ใส่ค่าสูงสุด ERPNext อ่านเป็น 0 แล้วทุกใบจะไม่ผ่าน
                    </p>
                  )}
                </td>

                <td className="px-4 py-3 align-top">
                  <Input
                    aria-label="เกณฑ์ที่ผู้ตรวจอ่าน"
                    className="bg-card"
                    value={r.criteria}
                    placeholder="เขียนให้คนที่ยืนตรวจอ่าน"
                    onChange={(e) => patch(r.id, { criteria: e.target.value })}
                  />
                  <FieldNote custom>custom_criteria ที่แถวเทมเพลต</FieldNote>
                </td>

                <td className="px-4 py-3 text-center align-top">
                  <Checkbox
                    aria-label="ตรวจสอบเอง"
                    className="mt-2.5"
                    checked={r.manual}
                    disabled={r.kind === "tick"}
                    onCheckedChange={(v) => patch(r.id, { manual: v === true })}
                  />
                </td>

                <td className="px-4 py-3 align-top">
                  <div className="mt-1 flex justify-end">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="ลบหัวข้อนี้"
                      onClick={() =>
                        onChange(rows.filter((x) => x.id !== r.id))
                      }
                    >
                      <Trash2Icon />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}

            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center">
                  <p className="font-medium">ยังไม่มีหัวข้อตรวจในฟอร์มนี้</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    กด “เพิ่มหัวข้อตรวจ” แล้วพิมพ์ชื่อหัวข้อที่ต้องการ
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

/** ช่องกรอกหนึ่งช่องในแท็บตัวอย่าง — หน้าตาเปลี่ยนตามประเภทข้อมูล */
function FieldInput({ id, field }: { id: string; field: DocField }) {
  const opts =
    field.kind === "system"
      ? field.source === ""
        ? []
        : SOURCE[field.source].pool
      : field.options;

  if (field.kind === "system" || field.kind === "choice") {
    return (
      <Select>
        <SelectTrigger id={id} className="w-full min-w-40 bg-card">
          <SelectValue
            placeholder={opts.length === 0 ? "ยังไม่ได้ตั้งแหล่งข้อมูล" : "เลือก"}
          />
        </SelectTrigger>
        <SelectContent>
          {opts.map((o) => (
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
      className="min-w-28 bg-card"
      inputMode={field.kind === "number" ? "decimal" : "text"}
      placeholder={field.kind === "number" ? "0" : "ระบุข้อมูล"}
    />
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
          aria-label={`${k === "pass" ? "ผ่าน" : "ไม่ผ่าน"} แถว ${id}`}
          className={cn(
            "min-h-8 rounded-full border px-3 text-xs whitespace-nowrap transition-colors",
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
