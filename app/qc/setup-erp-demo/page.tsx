"use client";

import * as React from "react";
import Link from "next/link";
import {
  FlaskConicalIcon,
  InfoIcon,
  PlusIcon,
  TrashIcon,
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
import { ChipGroup } from "@/components/chip-group";
import { MultiSelectChips } from "@/components/multi-select-chips";
import { ITEM_POOL, REF_DOCS_OF, REF_DOC_LABEL } from "@/lib/qc-erp";

/* ------------------------------------------------------------------
   ตัวอย่างหน้าตั้งค่าแบบเลือกเครื่องได้ — หน้าแยก ไม่แตะของจริง

   หน้านี้ไม่ได้ต่อกับ QI_TEMPLATES และไม่ได้ import อะไรที่เขียนกลับไปได้
   ตั้งอะไรในนี้ไม่กระทบเทมเพลตจริงสักใบ กดรีเฟรชแล้วกลับเป็นค่าตั้งต้น
   มีไว้ดูหน้าตาสามชิ้นที่จะเพิ่มก่อนตัดสินใจว่าจะเอาเข้าของจริงไหม

     1  ชิปเลือกว่าใบไปลง Quality Inspection หรือ QC Check — ของเดิมคิดเอาเงียบ ๆ
     2  หัวข้อ "ข้อมูลของตัวอย่างที่สุ่ม" — ของใหม่ทั้งก้อน
     3  ตัวอย่างรายงานที่เป็นตารางเพิ่มแถวได้ — ของเดิมเป็นการ์ดตายตัวตามหัวข้อ

   ตั้งค่าตั้งต้นเป็น FM-QC-02-06 สุ่มตรวจผลิตภัณฑ์สำเร็จรูป เพราะเป็นใบเดียว
   ที่ต้องใช้ครบทั้งสามชิ้น
------------------------------------------------------------------ */

// ---------------------------------------------------------------
// เครื่องที่ใบไปลง — ของเดิมอ่านจาก subject + refDocs ไม่ได้เก็บเป็นฟิลด์
// ---------------------------------------------------------------

type Engine = "qi" | "qcCheck";

const ENGINE: Record<
  Engine,
  { label: string; doctype: string; hint: string; custom: boolean }
> = {
  qi: {
    label: "ลงระบบ ERPNext",
    doctype: "Quality Inspection",
    hint: "ใบตรวจเป็นเอกสารของ ERPNext — บล็อกการรับของได้ อยู่ใต้ Stock Settings และเข้ารายงานมาตรฐาน แลกกับต้องมีเอกสารเป็นตัวเปิดใบเสมอ",
    custom: false,
  },
  qcCheck: {
    label: "ฟอร์มของเราเอง",
    doctype: "QC Check",
    hint: "doctype ที่เราสร้างเอง — ไม่ต้องมีเอกสารอ้างอิง ใส่คอลัมน์ข้อมูลตัวอย่างได้ เลือกคำว่า ปกติ/ผิดปกติ ได้ แลกกับไม่ได้ของแถมที่ ERPNext ผูกไว้ให้",
    custom: true,
  },
};

// ---------------------------------------------------------------
// คอลัมน์ข้อมูลของตัวอย่าง — ของใหม่ทั้งหมด ไม่มีอะไรใน ERPNext ใกล้เคียง
//
// ต่างจากหัวข้อตรวจตรงที่ไม่ได้ตอบว่าผ่านหรือไม่ผ่าน แต่ตอบว่า
// "ตัวอย่างที่สุ่มมาคืออันไหน" — สูตรอะไร สลิงเบอร์ไหน หนักเท่าไหร่
// ---------------------------------------------------------------

type ColKind = "item" | "choice" | "number" | "text";

const COL_KIND: Record<
  ColKind,
  { label: string; field: string; hint: string }
> = {
  item: {
    label: "สินค้า",
    field: "Link → Item",
    hint: "ดึงรายการสินค้าของ ERPNext มาให้เลือก ไม่ต้องทำทะเบียนใหม่",
  },
  choice: {
    label: "ตัวเลือก",
    field: "Select",
    hint: "คำที่ตั้งไว้เท่านั้น เช่นเบอร์สลิง",
  },
  number: { label: "ตัวเลข", field: "Float", hint: "คีย์ตัวเลข มีหน่วยกำกับ" },
  text: { label: "ข้อความ", field: "Data", hint: "พิมพ์อิสระ" },
};

const COL_KINDS = Object.keys(COL_KIND) as ColKind[];

type SampleCol = {
  id: string;
  label: string;
  kind: ColKind;
  /** ใช้เมื่อ kind = choice */
  options: string[];
  /** ใช้เมื่อ kind = number */
  unit: string;
};

let seq = 0;
const nid = () => `c-${++seq}`;

const SEED_COLS: SampleCol[] = [
  { id: nid(), label: "สูตร", kind: "item", options: [], unit: "" },
  { id: nid(), label: "น้ำหนักที่ชั่ง", kind: "number", options: [], unit: "กก." },
  { id: nid(), label: "สลิง", kind: "choice", options: ["30", "35", "40"], unit: "" },
];

/** หัวข้อตรวจของ FM-QC-02-06 — โชว์เฉย ๆ ให้เห็นว่าส่วนนี้ไม่ได้เปลี่ยน */
const SEED_ROWS = [
  { name: "การเย็บกระสอบ", criteria: "ด้ายต้องติดตลอดแนว ฝีเข็มสม่ำเสมอ ไม่หลุดไม่ขาด" },
  { name: "ความคมชัดของสูตรปุ๋ย", criteria: "ตัวเลขสูตรปุ๋ยบนกระสอบต้องอ่านออกชัดเจน" },
];

type Sample = {
  id: string;
  values: Record<string, string>;
  status: "" | "pass" | "fail";
};

const emptySample = (): Sample => ({ id: nid(), values: {}, status: "" });

export default function SetupErpDemoPage() {
  const [engine, setEngine] = React.useState<Engine>("qcCheck");
  const [refDocs, setRefDocs] = React.useState<string[]>([]);
  const [cols, setCols] = React.useState<SampleCol[]>(SEED_COLS);
  const [samples, setSamples] = React.useState<Sample[]>([
    emptySample(),
    emptySample(),
  ]);

  // ตัวเลือกที่ขัดกับที่ตั้งไว้ — เตือน ไม่ใช่แอบแก้ให้
  const missingRefDoc = engine === "qi" && refDocs.length === 0;

  const patchCol = (id: string, next: Partial<SampleCol>) =>
    setCols((p) => p.map((c) => (c.id === id ? { ...c, ...next } : c)));

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6">
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
        FM-QC-02-06 — ใบเดียวที่ต้องใช้ครบทั้งสามชิ้นที่จะเพิ่ม
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

      <Tabs defaultValue="structure" className="mt-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="structure">โครงสร้างรายงาน</TabsTrigger>
          <TabsTrigger value="preview">ตัวอย่างรายงาน</TabsTrigger>
        </TabsList>

        {/* ================= โครงสร้าง ================= */}
        <TabsContent value="structure">
          {/* ---------- 1 ใบนี้ไปลงที่ไหน ---------- */}
          <Section
            index={1}
            title="ใบตรวจของฟอร์มนี้ไปลงที่ไหน"
            note="ของเดิมคิดเอาเองจากที่ตั้งไว้ โดยไม่เคยบอกว่าคิดได้ว่าอะไร"
          >
            <ChipGroup
              label="ใบตรวจของฟอร์มนี้ไปลงที่ไหน"
              options={(Object.keys(ENGINE) as Engine[]).map((e) => ({
                id: e,
                label: ENGINE[e].label,
              }))}
              value={engine}
              onChange={setEngine}
            />

            <div className="mt-3 rounded-xl border border-border bg-card p-4">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium">{ENGINE[engine].doctype}</p>
                {ENGINE[engine].custom && (
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
                {ENGINE[engine].hint}
              </p>
            </div>

            <div className="mt-4 space-y-1.5">
              <Label htmlFor="demo-refdocs">
                เอกสารอ้างอิง{" "}
                <span className="font-normal text-muted-foreground">
                  {engine === "qi" ? "(บังคับ)" : "(ไม่ใช้กับฟอร์มของเราเอง)"}
                </span>
              </Label>
              <MultiSelectChips
                id="demo-refdocs"
                className="w-full bg-card"
                disabled={engine !== "qi"}
                placeholder={
                  engine === "qi"
                    ? "เลือกเอกสาร"
                    : "ฟอร์มของเราเองเปิดใบได้เองโดยไม่ต้องมีเอกสาร"
                }
                options={REF_DOCS_OF.inProcess.map((d) => ({
                  label: REF_DOC_LABEL[d],
                  value: d,
                }))}
                value={refDocs}
                onValueChange={setRefDocs}
              />
              <FieldNote>Quality Inspection · reference_type</FieldNote>
            </div>

            {/* ตัวเลือกที่ขัดกับที่ตั้งไว้ — บอกว่าพังตรงไหนและแก้ยังไงได้บ้าง
                ไม่ใช่แค่ขึ้นแดงแล้วปล่อยให้เดาเอง */}
            {missingRefDoc && (
              <p className="mt-3 flex items-start gap-2 rounded-lg border border-danger-border bg-danger px-4 py-3 text-sm">
                <InfoIcon className="mt-0.5 size-4 shrink-0 text-danger-strong" />
                <span>
                  ฟอร์มนี้ยังไม่มีเอกสารอ้างอิง แต่ Quality Inspection บังคับช่อง
                  reference_type ตั้งแต่ตอนกด Save — ใบนี้จะบันทึกแม้แต่ draft
                  ไม่ได้ เลือกเอกสารสักอย่าง หรือย้ายไปฟอร์มของเราเอง
                </span>
              </p>
            )}
          </Section>

          {/* ---------- 2 ข้อมูลของตัวอย่างที่สุ่ม ---------- */}
          {engine === "qcCheck" ? (
            <Section
              index={2}
              title="ข้อมูลของตัวอย่างที่สุ่ม"
              note="ไม่ใช่หัวข้อตรวจ — ไม่ได้ตอบว่าผ่านไหม แต่ตอบว่าตัวอย่างที่สุ่มมาคืออันไหน"
            >
              <div className="space-y-3">
                {cols.map((c, i) => (
                  <div
                    key={c.id}
                    className="rounded-xl border border-border bg-card p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-medium">คอลัมน์ที่ {i + 1}</p>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="ลบคอลัมน์นี้"
                        onClick={() =>
                          setCols((p) => p.filter((x) => x.id !== c.id))
                        }
                      >
                        <TrashIcon />
                      </Button>
                    </div>

                    <div className="mt-3 grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label htmlFor={`${c.id}-label`}>ชื่อคอลัมน์</Label>
                        <Input
                          id={`${c.id}-label`}
                          className="bg-card"
                          value={c.label}
                          placeholder="เช่น สูตร"
                          onChange={(e) =>
                            patchCol(c.id, { label: e.target.value })
                          }
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor={`${c.id}-kind`}>ชนิดข้อมูล</Label>
                        <Select
                          value={c.kind}
                          onValueChange={(v) =>
                            patchCol(c.id, { kind: v as ColKind })
                          }
                        >
                          <SelectTrigger
                            id={`${c.id}-kind`}
                            className="w-full bg-card"
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {COL_KINDS.map((k) => (
                              <SelectItem key={k} value={k}>
                                {COL_KIND[k].label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FieldNote custom>
                          QC Check Sample · {COL_KIND[c.kind].field}
                        </FieldNote>
                      </div>

                      {/* ช่องที่สามเปลี่ยนตามชนิด — ชนิดที่ไม่ต้องตั้งอะไรต่อ
                          ขึ้นเป็นคำอธิบายแทน ไม่ปล่อยให้ที่ว่างหาย
                          แล้วช่องอื่นเลื่อนขึ้นมาแทนทุกครั้งที่สลับชนิด */}
                      <div className="space-y-1.5 sm:col-span-2">
                        {c.kind === "choice" ? (
                          <>
                            <Label htmlFor={`${c.id}-opts`}>
                              คำที่ให้เลือก
                            </Label>
                            <Input
                              id={`${c.id}-opts`}
                              className="bg-card"
                              value={c.options.join(" / ")}
                              placeholder="คั่นด้วย /  เช่น 30 / 35 / 40"
                              onChange={(e) =>
                                patchCol(c.id, {
                                  options: e.target.value
                                    .split("/")
                                    .map((s) => s.trim())
                                    .filter(Boolean),
                                })
                              }
                            />
                          </>
                        ) : c.kind === "number" ? (
                          <>
                            <Label htmlFor={`${c.id}-unit`}>หน่วย</Label>
                            <Input
                              id={`${c.id}-unit`}
                              className="bg-card"
                              value={c.unit}
                              placeholder="เช่น กก."
                              onChange={(e) =>
                                patchCol(c.id, { unit: e.target.value })
                              }
                            />
                          </>
                        ) : (
                          <p className="pt-6 text-sm text-muted-foreground">
                            {COL_KIND[c.kind].hint}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-3 flex justify-center">
                <Button
                  variant="outline-primary"
                  onClick={() =>
                    setCols((p) => [
                      ...p,
                      {
                        id: nid(),
                        label: "",
                        kind: "text",
                        options: [],
                        unit: "",
                      },
                    ])
                  }
                >
                  <PlusIcon />
                  เพิ่มคอลัมน์
                </Button>
              </div>
            </Section>
          ) : (
            <Section
              index={2}
              title="ข้อมูลของตัวอย่างที่สุ่ม"
              note="มีเฉพาะฟอร์มของเราเอง"
            >
              <div className="rounded-xl border border-dashed border-border px-6 py-10 text-center">
                <p className="text-sm text-muted-foreground">
                  Quality Inspection เก็บสินค้าไว้ที่หัวใบช่องเดียว
                  (<span className="font-mono">item_code</span>) และตาราง
                  readings ไม่มีช่องสินค้าเลย
                  <br />
                  ใบที่สุ่มของคนละสูตรมาไว้แผ่นเดียวจึงลงไม่ได้ —
                  ย้ายไปฟอร์มของเราเองถึงจะตั้งคอลัมน์พวกนี้ได้
                </p>
                <Button
                  variant="outline-primary"
                  className="mt-4"
                  onClick={() => setEngine("qcCheck")}
                >
                  ย้ายไปฟอร์มของเราเอง
                </Button>
              </div>
            </Section>
          )}

          {/* ---------- 3 หัวข้อตรวจ ---------- */}
          <Section
            index={3}
            title="หัวข้อตรวจ"
            note="ส่วนนี้ไม่เปลี่ยน — ใส่ไว้ให้เห็นว่าสองก้อนนี้อยู่ด้วยกันแล้วหน้าตาเป็นยังไง"
          >
            <div className="space-y-3">
              {SEED_ROWS.map((r, i) => (
                <div
                  key={r.name}
                  className="rounded-xl border border-border bg-card p-4"
                >
                  <p className="font-medium">
                    {i + 1}. {r.name}
                  </p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    เกณฑ์: {r.criteria}
                  </p>
                  <FieldNote>
                    Item Quality Inspection Parameter · specification
                  </FieldNote>
                </div>
              ))}
            </div>
          </Section>
        </TabsContent>

        {/* ================= ตัวอย่างรายงาน ================= */}
        <TabsContent value="preview">
          <div className="mt-6 rounded-2xl border border-border bg-card p-5">
            <h2 className="text-xl font-semibold tracking-tight">
              ใบสุ่มตรวจผลิตภัณฑ์สำเร็จรูป QC260115/01-01
            </h2>

            {engine === "qcCheck" && cols.length > 0 && (
              <>
                <h3 className="mt-6 mb-2 font-semibold">ตัวอย่างที่สุ่มมา</h3>
                {/* ตารางเลื่อนแนวนอนได้ คอลัมน์ตั้งเองได้จึงกว้างเท่าไหร่ก็ได้
                    ล็อกความกว้างไว้แล้วตัดคำคือหน้างานอ่านไม่ออกว่าคอลัมน์ไหน */}
                <div className="overflow-x-auto rounded-xl border border-border">
                  <table className="w-full min-w-[640px] text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium">#</th>
                        {cols.map((c) => (
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
                          {cols.map((c) => (
                            <td key={c.id} className="px-3 py-2">
                              <SampleCell
                                col={c}
                                value={s.values[c.id] ?? ""}
                                onChange={(v) =>
                                  setSamples((p) =>
                                    p.map((x) =>
                                      x.id === s.id
                                        ? {
                                            ...x,
                                            values: { ...x.values, [c.id]: v },
                                          }
                                        : x
                                    )
                                  )
                                }
                              />
                            </td>
                          ))}
                          <td className="px-3 py-2">
                            <div className="flex gap-1.5">
                              {(["pass", "fail"] as const).map((v) => (
                                <button
                                  key={v}
                                  type="button"
                                  onClick={() =>
                                    setSamples((p) =>
                                      p.map((x) =>
                                        x.id === s.id
                                          ? {
                                              ...x,
                                              status: x.status === v ? "" : v,
                                            }
                                          : x
                                      )
                                    )
                                  }
                                  className={cn(
                                    "min-h-8 rounded-full border px-3 text-xs whitespace-nowrap transition-colors",
                                    s.status === v
                                      ? v === "pass"
                                        ? "border-success-border bg-success text-success-strong"
                                        : "border-danger-border bg-danger text-danger-strong"
                                      : "border-border text-muted-foreground"
                                  )}
                                >
                                  {v === "pass" ? "ผ่าน" : "ไม่ผ่าน"}
                                </button>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-3 flex justify-center">
                  <Button
                    variant="outline-primary"
                    onClick={() => setSamples((p) => [...p, emptySample()])}
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
              {SEED_ROWS.map((r, i) => (
                <div
                  key={r.name}
                  className="rounded-xl border border-border p-4"
                >
                  <p className="font-medium">
                    {i + 1}. {r.name}
                  </p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    เกณฑ์: {r.criteria}
                  </p>
                </div>
              ))}
            </div>

            {engine === "qi" && (
              <p className="mt-6 flex items-start gap-2 rounded-lg border border-danger-border bg-danger px-4 py-3 text-sm">
                <InfoIcon className="mt-0.5 size-4 shrink-0 text-danger-strong" />
                <span>
                  ฝั่ง ERPNext ไม่มีตารางตัวอย่าง — ใบหนึ่งใบเก็บสินค้าได้ตัวเดียว
                  สุ่ม 5 กระสอบคนละสูตรต้องเปิด 5 ใบ สลับไปดูฝั่งฟอร์มของเราเอง
                  เพื่อเทียบ
                </span>
              </p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </main>
  );
}

/** ช่องคีย์หนึ่งช่องในตารางตัวอย่าง — หน้าตาเปลี่ยนตามชนิดของคอลัมน์ */
function SampleCell({
  col,
  value,
  onChange,
}: {
  col: SampleCol;
  value: string;
  onChange: (v: string) => void;
}) {
  if (col.kind === "item" || col.kind === "choice") {
    const opts = col.kind === "item" ? ITEM_POOL : col.options;
    return (
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full min-w-40 bg-card">
          <SelectValue placeholder="เลือก" />
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
      className="min-w-28 bg-card"
      inputMode={col.kind === "number" ? "decimal" : "text"}
      value={value}
      placeholder={col.kind === "number" ? "0" : ""}
      onChange={(e) => onChange(e.target.value)}
    />
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
