"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  CalendarDaysIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CircleCheckIcon,
  CircleXIcon,
  CopyIcon,
  EyeIcon,
  InfoIcon,
  ListChecksIcon,
  MinusIcon,
  PlusIcon,
  Trash2Icon,
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
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@peckey954/ui/components/ui/input-group";
import { Input } from "@peckey954/ui/components/ui/input";
import { Label } from "@peckey954/ui/components/ui/label";
import {
  RadioGroup,
  RadioGroupItem,
} from "@peckey954/ui/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@peckey954/ui/components/ui/select";
import { Switch } from "@peckey954/ui/components/ui/switch";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@peckey954/ui/components/ui/tabs";
import { Textarea } from "@peckey954/ui/components/ui/textarea";
import { cn } from "@peckey954/ui/lib/utils";
import { toast } from "sonner";
import { CheckChip } from "@/components/check-chip";
import { ChoiceGroup } from "@/components/choice-group";
import { ChipGroup } from "@/components/chip-group";
import { SchedulePreviewCalendar } from "@/components/qc/schedule-calendar";
import { TimeField } from "@/components/time-field";
import { MultiSelectChips } from "@/components/multi-select-chips";
import { ParamCombobox } from "@/components/qc/param-picker";
import {
  DEFAULT_SCHEDULE,
  ORIGIN,
  FLAG,
  DISPOSITIONS,
  INSPECTION_TYPE_LABEL,
  INSPECTION_TYPE_VALUE,
  SUBJECT,
  SUBJECT_KEYS,
  MAX_READINGS,
  REF_DOCS_OF,
  REF_DOC_LABEL,
  REF_DOC_VALUE,
  REMARK_LABEL,
  targetPool,
  usesQualityInspection,
  cloneRow,
  describeCriteria,
  dispositionOf,
  explainRow,
  originOf,
  docsPerDay,
  newShift,
  shiftOvernight,
  newRow,
  paramOf,
  readingLabels,
  templateOf,
  blankTemplate,
  commitTemplate,
  NEW_TEMPLATE_ID,
  type FlagKey,
  type InspectionType,
  type QiRow,
  type QiSchedule,
  type QiTemplate,
  type RefDoc,
  type RemarkMode,
  type Subject,
} from "@/lib/qc-erp";

/* ------------------------------------------------------------------
   ตั้งค่าเทมเพลตหนึ่งฟอร์ม — โครงเดียวกับ Quality Inspection Template

   หน้านี้คือคำตอบของ "ปรับออกมาแล้วหน้าตั้งค่าจะเป็นยังไง" ตัวจริง
   เทียบกับหน้าเดิมที่ /qc/setup/[familyId] แล้วจะเห็นว่าสั้นลงเยอะ เพราะ
   ของที่ ERPNext ไม่มีที่เก็บให้ ถูกตัดออกหมด ไม่ได้ทำเป็นช่องที่ตั้งแล้วไม่มีผล

   สองแท็บเหมือนหน้าตั้งค่าเดิม — ตั้งค่าทางซ้าย เห็นผลทางขวา
   แท็บตัวอย่างไม่ได้เก็บอะไรของตัวเอง วาดจากที่ตั้งไว้ในแท็บแรกสด ๆ

   แท็บแรกมีสี่ก้อน เรียงตามลำดับที่คนตั้งค่าคิดจริง
     1  ฟอร์มนี้ใช้ตอนไหน (ประเภทการตรวจ + เอกสารอ้างอิง)
     2  ตรวจอะไรบ้าง (หัวข้อ + เกณฑ์)
     3  ใช้กับสินค้าตัวไหน — ไม่ผูกไว้ ฟอร์มจะไม่มีวันถูกเรียก
     4  ไม่ผ่านแล้วให้เลือกอะไรได้บ้าง

   ก้อน 1, 3, 4 ไม่มีในหน้าตั้งค่าเดิมเลย และเป็นสามก้อนที่ทำให้ใบตรวจ
   ไปผูกกับของจริงได้ ของเดิมตั้งฟอร์มสวยแค่ไหนก็ยังไม่มีใครรู้ว่าจะเอาไปใช้ตอนไหน
------------------------------------------------------------------ */

export default function SetupQcTemplatePage() {
  const params = useParams<{ id: string }>();
  // /qc/setup-erp/new = กดเพิ่มรายงานมา ยังไม่มีอะไรในรายการ สร้างร่างให้แก้เลย
  const seed = React.useMemo(
    () =>
      params.id === NEW_TEMPLATE_ID ? blankTemplate() : templateOf(params.id),
    [params.id]
  );

  if (!seed) {
    return (
      <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6">
        <div className="mt-10 rounded-xl border border-dashed border-border px-6 py-14 text-center">
          <p className="font-medium">ไม่พบเทมเพลตนี้</p>
          <Button asChild variant="outline-primary" className="mt-4">
            <Link href="/qc/setup-erp">กลับไปหน้า Setup QC</Link>
          </Button>
        </div>
      </main>
    );
  }

  return (
    <Editor key={seed.id} seed={seed} isNew={params.id === NEW_TEMPLATE_ID} />
  );
}

function Editor({ seed, isNew }: { seed: QiTemplate; isNew: boolean }) {
  const router = useRouter();
  const [tpl, setTpl] = React.useState<QiTemplate>(seed);
  // ดูใบแบบที่ยังไม่ได้สร้าง custom field อะไรเลย — ของแท็บตัวอย่างอย่างเดียว
  const [plain, setPlain] = React.useState(false);
  /* ค่าที่คีย์ในแท็บตัวอย่าง เก็บรวมที่นี่ไม่ใช่ในการ์ด เพราะผลรวมทั้งใบต้องอ่าน
     จากทุกแถวพร้อมกัน — ERPNext เองก็ตัดสินทั้งใบจาก readings ทั้งตาราง */
  const [tries, setTries] = React.useState<Record<string, RoundState>>({});
  const tryOf = (id: string) => tries[id] ?? EMPTY_ROUND;
  /* สองคำถามที่ต่างกัน อย่าเอามาใช้แทนกัน
       inspectsItem   ฟอร์มนี้ตรวจ "ของ" หรือตรวจสถานที่/เครื่องจักร
                      → ตัดสินว่ามีช่องผูกสินค้า เอกสารอ้างอิง และผลตรวจที่ไม่ผ่านไหม
       usesQualityInspection  ใบของฟอร์มนี้ลง doctype ของ ERPNext ได้ไหม
                      → ต้องตรวจของ "และ" มีเอกสารเป็นตัวเปิดใบ
     ฟอร์มสุ่มตรวจผลิตภัณฑ์สำเร็จรูปคือตัวที่คำตอบสองอันนี้ไม่ตรงกัน */
  const inspectsItem = tpl.subject === "item";
  // ใบที่ลง Quality Inspection ติดคำว่า Accepted/Rejected ตายตัว ส่วนใบที่ไปอยู่
  // doctype ของเราเลือกคำเองได้ ใบตรวจถังจึงใช้ ปกติ/ผิดปกติ ตามกระดาษ
  const verdict: VerdictWords = usesQualityInspection(tpl)
    ? "passFail"
    : "normal";
  const overall = overallStatus(
    tpl.rows.map((r) => computeRound(r, tryOf(r.id)).status)
  );

  const patch = (next: Partial<QiTemplate>) => setTpl((p) => ({ ...p, ...next }));
  const patchSchedule = (next: Partial<QiSchedule>) =>
    setTpl((p) => ({ ...p, schedule: { ...p.schedule, ...next } }));
  // ที่มาของใบอ่านจากโครงสด ๆ — เปิดรอบการตรวจหรือเอาเอกสารอ้างอิงออก
  // ป้ายเปลี่ยนทันที ไม่มีที่ให้ป้ายค้างไว้จนโกหก
  const origin = originOf(tpl);


  /** ย้ายหัวข้อขึ้น/ลง — ฟอร์มกระดาษมีลำดับข้อตายตัว ตั้งผิดลำดับต้องย้ายได้ */
  const moveRow = (id: string, delta: number) =>
    setTpl((p) => {
      const i = p.rows.findIndex((r) => r.id === id);
      const j = i + delta;
      if (i < 0 || j < 0 || j >= p.rows.length) return p;
      const rows = [...p.rows];
      [rows[i], rows[j]] = [rows[j], rows[i]];
      return { ...p, rows };
    });

  /**
   * คัดลอกทั้งชุดต่อท้าย — ฟอร์มกระดาษที่มีคอลัมน์ "ตรวจครั้งที่ 1/2/3"
   *
   * ERPNext คัดลอกแถวเทมเพลตลงใบแบบหนึ่งต่อหนึ่ง ไม่ได้คูณให้ตามจำนวนรอบ
   * เทมเพลตจึงต้องมีแถวครบทุกรอบเอง — แปดข้อสามรอบคือยี่สิบสี่แถวจริง ๆ
   * กดปุ่มนี้สองครั้งแทนการกดคัดลอกทีละข้อสิบหกครั้ง
   */
  const duplicateAll = () =>
    setTpl((p) => ({ ...p, rows: [...p.rows, ...p.rows.map(cloneRow)] }));

  /** คัดลอกวางไว้ใต้ข้อเดิม — ฟอร์มที่มีข้อโครงเหมือนกันหลายข้อจะได้ไม่ต้องตั้งซ้ำ */
  const duplicateRow = (id: string) =>
    setTpl((p) => {
      const i = p.rows.findIndex((r) => r.id === id);
      if (i < 0) return p;
      const rows = [...p.rows];
      rows.splice(i + 1, 0, cloneRow(rows[i]));
      return { ...p, rows };
    });

  const patchRow = (id: string, next: Partial<QiRow>) =>
    setTpl((p) => ({
      ...p,
      rows: p.rows.map((r) => (r.id === id ? { ...r, ...next } : r)),
    }));

  /**
   * เปลี่ยนประเภทการตรวจแล้วเอกสารอ้างอิงต้องล้างตาม
   * ใบรับของกับใบส่งของอยู่คนละประเภทกัน ค้างไว้แล้วจะได้เทมเพลตที่บันทึกไม่ผ่าน
   * ตอนยิงเข้า ERPNext โดยหน้าจอไม่ได้บอกอะไรเลย
   */
  const changeType = (t: InspectionType) =>
    patch({ inspectionType: t, refDocs: [] });

  const save = () => {
    /* ชื่อรายงานคือ ID ของเอกสารใน ERPNext (autoname: field:quality_inspection_
       template_name) ไม่มีชื่อก็ไม่มีเอกสาร จึงเป็นช่องเดียวที่กันไว้ตรงนี้
       ที่เหลือปล่อยให้บันทึกร่างไว้ก่อนได้ ฟอร์มกระดาษกว่าจะตั้งครบใช้หลายรอบ */
    if (tpl.name.trim() === "") {
      toast.error("กรุณาตั้งชื่อรายงาน");
      return;
    }

    if (isNew) {
      commitTemplate({ ...tpl, name: tpl.name.trim() });
      toast.success("เพิ่มรายงานแล้ว", {
        description: `${tpl.name.trim()} · ${tpl.rows.length} หัวข้อ — ตัวอย่างหน้าตั้งค่า ยังไม่ได้ต่อหลังบ้าน`,
      });
      // เปลี่ยน URL จาก /new เป็น id จริง กดรีเฟรชแล้วจะได้ไม่กลายเป็นร่างเปล่าอีกใบ
      router.replace(`/qc/setup-erp/${tpl.id}`);
      return;
    }

    toast.success("บันทึกรายงานแล้ว", {
      description: `${tpl.name} · ${tpl.rows.length} หัวข้อ — ตัวอย่างหน้าตั้งค่า ยังไม่ได้ต่อหลังบ้าน`,
    });
  };

  return (
    <>
      <main className="@container mx-auto w-full max-w-5xl px-4 pt-6 pb-24 sm:px-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">หน้าหลัก</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/qc/setup-erp">
                ตั้งค่ารายงานตรวจสอบ QC
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-primary">ตั้งค่ารายงาน</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight">
              ตั้งค่ารายงานตรวจสอบ QC
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              สร้างแบบรายงานตรวจคุณภาพได้ตามต้องการ เพิ่ม ลบ และแก้ไขหัวข้อการตรวจได้ตามกำหนด
            </p>
          </div>
          {/* เปิด/ปิดได้จากตรงนี้เลย ไม่ต้องกลับไปหน้ารายการ — ปิดแล้วฟอร์มยังอยู่
              แค่ไม่ถูกหยิบไปใช้กับใบตรวจใหม่ ใบเก่าที่ออกไปแล้วไม่กระทบ */}
          <div className="shrink-0 text-right">
            <label className="flex items-center gap-2 text-sm">
              <Switch
                checked={tpl.active}
                onCheckedChange={(v) => patch({ active: v })}
              />
              เปิดใช้งานรายงานนี้
            </label>
            <FieldNote custom>custom_disabled</FieldNote>
          </div>
        </div>

        {/* ฟอร์มที่ลง ERPNext ตรง ๆ ไม่ได้ ต้องบอกตั้งแต่บรรทัดแรกของหน้า
             ไม่ใช่ปล่อยให้ตั้งค่าจนจบแล้วค่อยมีคนมาบอกว่าของแบบนี้ระบบไม่รับ */}
        {/* ฟอร์มที่ไม่ได้เกิดจากเอกสาร ต้องบอกตั้งแต่บรรทัดแรกของหน้า
             ไม่ใช่ปล่อยให้ตั้งค่าจนจบแล้วค่อยมีคนมาบอกว่าของแบบนี้ระบบไม่รับ */}
        {origin !== "doc" && (
          <Alert variant="warning" className="mt-4">
            <InfoIcon />
            <AlertTitle>ที่มาของใบ: {ORIGIN[origin].label}</AlertTitle>
            <AlertDescription>{ORIGIN[origin].hint}</AlertDescription>
          </Alert>
        )}

        {/* ข้อควรระวังเฉพาะใบนี้ที่อ่านจากโครงไม่ได้ */}
        {tpl.note && (
          <Alert variant="brand" className="mt-3">
            <InfoIcon />
            <AlertDescription>{tpl.note}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="build" className="mt-5">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="build">
              <ListChecksIcon />
              โครงสร้างรายงาน
            </TabsTrigger>
            <TabsTrigger value="preview">
              <EyeIcon />
              ตัวอย่างรายงาน
            </TabsTrigger>
          </TabsList>

          <TabsContent value="build">
        {/* ---------- 1 ข้อมูลรายงาน ----------
             รวมสามเรื่องที่เคยแยกกันอยู่คนละก้อน — ชื่อ/ช่วงการตรวจ/ของที่ผูก
             เพราะทั้งสามอย่างตอบคำถามเดียวกันว่า "ใบนี้คือใบอะไร ของใคร"
             คนตั้งค่าตอบรวดเดียวจบ ไม่ต้องเลื่อนลงไปผูกสินค้าท้ายหน้าอีกรอบ */}
        <Section
          index={1}
          title="ข้อมูลรายงาน"
          note="ชื่อรายงาน ช่วงที่ใช้ เอกสารที่อ้างอิง และของที่ฟอร์มนี้ผูกอยู่"
        >
          <div className="grid gap-4 @2xl:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="tpl-name">ชื่อรายงาน</Label>
              <Input
                id="tpl-name"
                className="bg-card"
                placeholder="ระบุชื่อรายงาน"
                value={tpl.name}
                onChange={(e) => patch({ name: e.target.value })}
              />
              {/* ชื่อคือ ID ของเอกสาร การเปลี่ยนชื่อจึงเป็น rename ที่ Frappe
                  ต้องตามไปแก้ลิงก์ในใบตรวจเก่าให้ ไม่ใช่แค่แก้ข้อความ */}
              <FieldNote>
                quality_inspection_template_name · ชื่อนี้คือ ID ของเอกสาร
              </FieldNote>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tpl-code">
                รหัสรายงาน{" "}
                <span className="font-normal text-muted-foreground">
                  (ไม่บังคับ)
                </span>
              </Label>
              <Input
                id="tpl-code"
                className="bg-card"
                placeholder="ระบุรหัสรายงาน"
                value={tpl.code}
                onChange={(e) => patch({ code: e.target.value })}
              />
              <FieldNote custom>custom_code</FieldNote>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="inspection-type">ช่วงการตรวจสอบ</Label>
              <Select
                value={tpl.inspectionType}
                onValueChange={(v) => changeType(v as InspectionType)}
              >
                <SelectTrigger id="inspection-type" className="w-full bg-card">
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
              <FieldNote>
                inspection_type (ใบตรวจ · บังคับกรอก) · เทมเพลตเก็บล่วงหน้าที่
                custom_inspection_type · สามค่านี้ ERPNext กำหนดมาตายตัว
              </FieldNote>
            </div>

            {/* เอกสารสต็อกมีความหมายเฉพาะตอนตรวจสินค้า ตรวจเครื่องจักรหรือคลัง
                ไม่มีใบรับของมาเกี่ยวข้องเลย — ปิดช่องไว้แทนที่จะซ่อนทั้งช่อง
                เพราะซ่อนแล้วช่องที่เหลือจะเลื่อนขึ้นมาแทนที่ทุกครั้งที่สลับประเภท */}
            <div className="space-y-1.5">
              <Label htmlFor="ref-docs">
                เอกสารอ้างอิง{" "}
                <span className="font-normal text-muted-foreground">
                  (ไม่บังคับ)
                </span>
              </Label>
              <MultiSelectChips
                id="ref-docs"
                className="w-full bg-card"
                disabled={!inspectsItem}
                placeholder={
                  inspectsItem
                    ? "เลือกเอกสาร"
                    : "ฟอร์มที่ไม่ได้ตรวจสินค้าไม่มีเอกสารสต็อกมาเกี่ยว"
                }
                options={REF_DOCS_OF[tpl.inspectionType].map((d) => ({
                  label: `${REF_DOC_LABEL[d]} — ${REF_DOC_VALUE[d]}`,
                  value: d,
                }))}
                value={tpl.refDocs}
                onValueChange={(v) =>
                  setTpl((p) => ({
                    ...p,
                    refDocs: v as RefDoc[],
                    requireBefore:
                      p.refDocs.length === 0 && v.length > 0
                        ? true
                        : p.requireBefore,
                  }))
                }
              />
              {/* ตัวเลือกเปลี่ยนตามช่วงการตรวจ ไม่ใช่โชว์ทั้งเจ็ดตัวตลอด
                  เลือกใบส่งของให้การตรวจรับเข้าได้ = ตั้งค่าที่ไม่มีทางถูกใช้

                  ว่างไว้ = ฟอร์มที่ไม่มีเอกสารเป็นตัวเปิดใบ ป้ายที่มาของใบ
                  ข้างบนจะอ่านออกมาเป็น "เปิดเอง" ให้เอง */}
              <FieldNote>
                reference_type (ใบตรวจ · บังคับกรอก) · เทมเพลตเก็บล่วงหน้าที่
                custom_reference_types · ตัวเลือกเปลี่ยนตามช่วงการตรวจ
              </FieldNote>
            </div>

            {/* ช่องนี้เป็นตัวตัดสินว่าใบตรวจจะไปเก็บที่ Quality Inspection
                หรือ doctype ของเรา — เลือกผิดคือเลือกฐานข้อมูลผิด ไม่ใช่แค่ป้ายผิด

                สองตัวเลือกตายตัว ไม่ใช่สี่ และกริดล็อกไว้สองคอลัมน์
                สลับไปมากี่ครั้งปุ่มก็อยู่ตำแหน่งเดิมเสมอ */}
            <div className="space-y-2">
              <Label>ประเภทการตรวจ</Label>
              <RadioGroup
                className="grid grid-cols-2 gap-2"
                value={tpl.subject}
                onValueChange={(v) =>
                  patch({
                    subject: v as Subject,
                    // ของที่ผูกไว้เป็นคนละชนิดกันแล้ว ล้างทิ้ง ไม่ใช่ค้างสินค้า
                    // ไว้ในฟอร์มตรวจเครื่องจักร
                    targets: [],
                    // ไม่ใช่สินค้า = ไม่มีเอกสารสต็อกมาเกี่ยว และไม่มีของให้ตัดสิน
                    ...(v === "item" ? null : { refDocs: [], dispositions: [] }),
                  })
                }
              >
                {SUBJECT_KEYS.map((k) => (
                  <Label
                    key={k}
                    htmlFor={`subject-${k}`}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2.5 font-normal",
                      tpl.subject === k && "border-primary bg-brand font-medium"
                    )}
                  >
                    <RadioGroupItem id={`subject-${k}`} value={k} />
                    {SUBJECT[k].label}
                  </Label>
                ))}
              </RadioGroup>
              <FieldNote custom>
                custom_subject · เก็บใบที่ {SUBJECT[tpl.subject].store}
              </FieldNote>
            </div>

            {/* ของที่ผูก — ERPNext เรียกฟอร์มจากของที่ตรวจ ไม่ได้เรียกจากคนเปิดใบ
                ไม่ผูกไว้ ฟอร์มจะไม่มีวันถูกเรียกใช้

                โชว์เสมอทั้งสองประเภท เปลี่ยนแค่ป้ายกับรายการที่เลือกได้ —
                ฟอร์มที่ไม่ผูกกับอะไรเลยคือเว้นช่องนี้ว่าง ไม่ใช่ช่องหายไป */}
            <div className="space-y-1.5">
              <Label htmlFor="targets">{SUBJECT[tpl.subject].label}</Label>
              <MultiSelectChips
                id="targets"
                className="w-full bg-card"
                disabled={!inspectsItem}
                placeholder={SUBJECT[tpl.subject].placeholder}
                options={targetPool(tpl.subject).map((i) => ({
                  label: i,
                  value: i,
                }))}
                value={tpl.targets}
                onValueChange={(v) => patch({ targets: v })}
              />
              <FieldNote custom={!inspectsItem}>
                {inspectsItem
                  ? "Item · quality_inspection_template (เขียนกลับไปที่ข้อมูลสินค้า)"
                  : SUBJECT[tpl.subject].store}
              </FieldNote>
            </div>
          </div>

          {/* เตือนเฉพาะฟอร์มตรวจสินค้า เพราะมีแต่ฟอร์มพวกนี้ที่ระบบเป็นคนเรียกใช้
              ฟอร์มตรวจเครื่องจักรหรือคลังคนเปิดใบเอง ไม่ผูกไว้ก็ยังใช้ได้ */}
          {usesQualityInspection(tpl) && tpl.targets.length === 0 && (
            <p className="mt-4 flex items-start gap-2 rounded-lg border border-danger-border bg-danger px-4 py-3 text-sm">
              <InfoIcon className="mt-0.5 size-4 shrink-0 text-danger-strong" />
              ยังไม่ได้ผูกกับสินค้าตัวไหน ฟอร์มนี้จะไม่ถูกเรียกใช้ตอนรับของ
            </p>
          )}

          {/* ติ๊กบังคับตรวจอยู่ที่ Item เฉพาะขาซื้อกับขาขาย — ระหว่างผลิตไม่มี
              ที่ Item เลย ของ ERPNext ใช้ติ๊ก inspection_required บนตัวใบ
              เบิก-โอนสต็อกรายใบแทน ตั้งล่วงหน้าจากฟอร์มไม่ได้ จึงบอกไว้
              ไม่ใช่โชว์สวิตช์ที่กดแล้วไม่มีผล */}
          {usesQualityInspection(tpl) &&
            (tpl.inspectionType === "inProcess" ? (
              <div className="mt-4 rounded-lg bg-brand px-4 py-3 text-sm">
                <p className="font-medium">
                  ฟอร์มระหว่างผลิตตั้งบังคับตรวจล่วงหน้าไม่ได้
                </p>
                <p className="mt-1 text-muted-foreground">
                  ข้อมูลสินค้ามีติ๊กบังคับตรวจแค่ก่อนซื้อกับก่อนส่ง — ใบเบิก-โอนสต็อก
                  ต้องติ๊ก{" "}
                  <span className="font-mono text-xs">inspection_required</span>{" "}
                  บนตัวใบเองรายใบ ส่วนใบงานผลิต (Job Card) ERPNext ไม่บล็อกให้เลย
                  ต้องเขียน validation เพิ่ม
                </p>
              </div>
            ) : (
              <div className="mt-4">
                {/* สวิตช์อยู่หน้าข้อความบรรทัดเดียว ไม่ใช่กล่องเต็มความกว้าง —
                    มันเป็นเงื่อนไขต่อท้ายของช่องสินค้าข้างบน ไม่ใช่หัวข้อของตัวเอง */}
                <label className="flex items-center gap-3">
                  <Switch
                    checked={tpl.requireBefore}
                    disabled={tpl.targets.length === 0}
                    onCheckedChange={(v) => patch({ requireBefore: v })}
                  />
                  <span className="text-sm font-medium">
                    {tpl.inspectionType === "outgoing"
                      ? "ต้องตรวจก่อนส่งของ"
                      : "ต้องตรวจก่อนรับของเข้าคลัง"}
                  </span>
                </label>
                {/* ติ๊กนี้ไม่ได้เก็บที่ฟอร์ม — ERPNext เก็บที่ข้อมูลสินค้ารายตัว
                    บอกไว้ว่าจะไปเขียนที่ไหนกี่ตัว ไม่งั้นกดแล้วไม่รู้ว่ากระทบอะไร */}
                <p className="mt-1 text-sm text-muted-foreground">
                  {tpl.targets.length === 0
                    ? "ผูกสินค้าก่อน — ติ๊กนี้ไปอยู่ที่ข้อมูลสินค้า ไม่ได้อยู่ที่ฟอร์ม"
                    : `จะไปติ๊กที่ข้อมูลสินค้า ${tpl.targets.length} ตัวที่ผูกไว้`}
                </p>
                {/* ERPNext มีบิตเดียวต่อทิศทาง เลือกอ้างอิงแค่ใบเดียวก็บังคับ
                    ทั้งกลุ่ม — ต้องเขียนไว้ ไม่งั้นจะงงว่าทำไมใบที่ไม่ได้เลือกก็โดนบล็อก */}
                <p className="text-sm text-muted-foreground">
                  {tpl.inspectionType === "outgoing"
                    ? "ครอบใบส่งของและใบแจ้งหนี้ขายพร้อมกัน แยกรายเอกสารไม่ได้"
                    : "ครอบใบรับของ ใบแจ้งหนี้ซื้อ และใบรับงานจ้างผลิตพร้อมกัน แยกรายเอกสารไม่ได้"}
                </p>
                <FieldNote>
                  Item ·{" "}
                  {tpl.inspectionType === "outgoing"
                    ? "inspection_required_before_delivery"
                    : "inspection_required_before_purchase"}
                </FieldNote>
              </div>
            ))}
        </Section>

        {/* ---------- 2 หัวข้อตรวจ ---------- */}
        {/* เพิ่มหัวข้อที่นี่ = หยิบชื่อจากทะเบียนมาใส่ฟอร์มนี้ แล้วตั้งเกณฑ์ของมัน
             ชื่อที่ยังไม่มีในทะเบียนก็พิมพ์สร้างได้จากในช่องเลย ทะเบียนเต็ม ๆ
             (ไว้แก้ชื่อ/ดูตัวที่ไม่มีใครใช้) อยู่ท้ายแท็บตั้งค่าระบบของหน้า Setup QC */}
        <Section
          index={2}
          title={`หัวข้อตรวจ (${tpl.rows.length})`}
          note="กำหนดหัวข้อ เกณฑ์ และการตัดสิน · หนึ่งหัวข้อ = หนึ่งแถวใน readings = หนึ่งเกณฑ์"
        >
          <div className="space-y-3">
            {tpl.rows.map((row, i) => (
              <RowCard
                key={row.id}
                index={i + 1}
                row={row}
                isFirst={i === 0}
                isLast={i === tpl.rows.length - 1}
                onChange={(next) => patchRow(row.id, next)}
                onMove={(delta) => moveRow(row.id, delta)}
                onDuplicate={() => duplicateRow(row.id)}
                onRemove={() =>
                  setTpl((p) => ({
                    ...p,
                    rows: p.rows.filter((r) => r.id !== row.id),
                  }))
                }
              />
            ))}
            {tpl.rows.length === 0 && (
              <div className="rounded-lg border border-dashed border-border px-6 py-12 text-center">
                <p className="font-medium">ยังไม่มีหัวข้อตรวจในฟอร์มนี้</p>
                <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
                  กด “เพิ่มหัวข้อตรวจ” แล้วพิมพ์ชื่อหัวข้อที่ต้องการ —
                  เจอของเดิมก็เลือกเลย ไม่เจอก็กดสร้างใหม่ได้ในช่องเดียวกัน
                </p>
              </div>
            )}

            <div className="flex flex-wrap justify-center gap-2">
              <Button
                variant="outline-primary"
                size="sm"
                onClick={() =>
                  setTpl((p) => ({ ...p, rows: [...p.rows, newRow()] }))
                }
              >
                <PlusIcon />
                เพิ่มหัวข้อตรวจ
              </Button>
              {tpl.rows.length > 0 && (
                <Button variant="ghost" size="sm" onClick={duplicateAll}>
                  <CopyIcon />
                  คัดลอกทั้งชุดต่อท้าย ({tpl.rows.length} ข้อ)
                </Button>
              )}
            </div>
          </div>
        </Section>

        {/* ---------- 3 ผลตรวจที่ไม่ผ่าน ---------- */}
        {/* repack / รับสภาพ / ส่งคืน เป็นการตัดสินใจกับ "ของ" ตรวจเครื่องจักร
            กับตรวจคลังไม่มีของให้ตัดสิน ซ่อนทั้งก้อนไปเลย */}
        {inspectsItem && (
        <Section
          index={3}
          title="ผลตรวจที่ไม่ผ่าน"
          note="ผู้ตรวจต้องเลือกว่าจะจัดการสินค้าที่ไม่ผ่านอย่างไร"
          action={
            /* บังคับเลือกไหม เป็นของฟอร์ม ไม่ใช่ของรายการกลาง — บางฟอร์ม
               ไม่ผ่านแล้วต้องตัดสินทันที บางฟอร์มรอให้หัวหน้ามาดูก่อนได้
               ปิดไว้ตอนยังไม่ได้เลือกตัวเลือกเลย เพราะไม่มีอะไรให้บังคับ */
            <div className="shrink-0 text-right">
              <label className="flex items-center gap-2 text-sm">
                <Switch
                  checked={tpl.requireDisposition}
                  disabled={tpl.dispositions.length === 0}
                  onCheckedChange={(v) => patch({ requireDisposition: v })}
                />
                บังคับเลือกเมื่อมีข้อไม่ผ่าน
              </label>
              <FieldNote custom>custom_require_disposition</FieldNote>
            </div>
          }
        >
          <FieldNote custom>
            custom_dispositions ที่เทมเพลต · custom_disposition ที่ใบตรวจ
          </FieldNote>

          {/* ติ๊กเลือกจากรายการกลาง ไม่ใช่พิมพ์เอง — แก้ชื่อหรือเพิ่มตัวเลือก
              ทำที่แท็บตั้งค่าระบบ เพราะแต่ละตัวผูกกับ script ที่เดฟเขียนไว้ */}
          <div className="mt-2 flex flex-wrap gap-2">
            {DISPOSITIONS.map((d) => (
              <CheckChip
                key={d.id}
                id={`disp-${d.id}`}
                label={d.label}
                checked={tpl.dispositions.includes(d.id)}
                onChange={(on) =>
                  patch({
                    dispositions: on
                      ? [...tpl.dispositions, d.id]
                      : tpl.dispositions.filter((x) => x !== d.id),
                  })
                }
              />
            ))}
          </div>

          {tpl.dispositions.length > 0 && (
            <>
              <ul className="mt-4 space-y-2">
                {tpl.dispositions.map((id) => {
                  const d = dispositionOf(id);
                  if (!d) return null;
                  return (
                    <li
                      key={id}
                      className="flex flex-wrap items-baseline gap-x-2 gap-y-1 rounded-lg bg-surface px-3 py-2 text-sm"
                    >
                      <span className="font-medium">{d.label}</span>
                      <span className="text-muted-foreground">{d.effect}</span>
                      <span className="font-mono text-xs text-muted-foreground">
                        {d.field}
                      </span>
                    </li>
                  );
                })}
              </ul>

            </>
          )}
        </Section>
        )}

        {/* ---------- 4 รอบเวลาทำงาน ----------
             ของใหม่ทั้งก้อน และเป็นก้อนเดียวในหน้านี้ที่ ERPNext ไม่มีที่เก็บให้เลย
             เขียนกำกับไว้ว่าต้องสร้างอะไรเพิ่ม ไม่ใช่ทำให้ดูเหมือนตั้งแล้วใช้ได้ทันที

             อยู่ท้ายสุดเพราะเป็นก้อนที่ฟอร์มส่วนใหญ่ไม่ได้เปิด — ฟอร์มที่เกิดจาก
             ใบรับของไม่มีรอบเวลา เปิดมาเจอกะสี่ช่องก่อนจะงงว่าต้องกรอกไหม */}
        <Section
          index={4}
          title="เปิดใบตามรอบเวลาทำงาน"
          note="ระบบจะขึ้นข้อมูลให้ทำเอกสารตามช่วงเวลาการทำงานที่ตั้งไว้ ไม่รวมวันหยุดทำงานและวันหยุดนักขัตฤกษ์ วันไหนไม่มีข้อมูล ระบบจะขึ้นว่ายังไม่มีใครทำ จึงดูเป็นปฏิทินทั้งเดือนได้"
          action={
            <div className="shrink-0 text-right">
              <label className="flex items-center gap-2 text-sm">
                <Switch
                  checked={tpl.schedule.recurring}
                  onCheckedChange={(on) =>
                    patch({
                      schedule: on
                        ? {
                            ...tpl.schedule,
                            recurring: true,
                            // เปิดครั้งแรกให้เป็นวันละครั้งไว้ก่อน — เป็นแบบที่เข้าใจ
                            // ง่ายที่สุด ใครต้องการกะค่อยสลับเอง
                            allDay:
                              tpl.schedule.slots.length === 0 ||
                              tpl.schedule.allDay,
                          }
                        : // ปิดแล้วเก็บกะที่ตั้งไว้ไว้ก่อน เปิดใหม่จะได้ไม่ต้องตั้งซ้ำ
                          { ...DEFAULT_SCHEDULE, slots: tpl.schedule.slots },
                    })
                  }
                />
                ดูเป็นปฏิทินทั้งเดือนได้
              </label>
              <FieldNote custom>doctype QC Schedule</FieldNote>
            </div>
          }
        >
          <ScheduleEditor schedule={tpl.schedule} onChange={patchSchedule} />
        </Section>

          </TabsContent>

          {/* ---------- ตัวอย่างใบตรวจที่ได้ ----------
               อ่านออกมาจากที่ตั้งไว้ในแท็บแรกสด ๆ ไม่ใช่รูปนิ่ง — แก้เกณฑ์แล้ว
               เห็นผลทันทีว่าคนหน้างานจะเจอช่องแบบไหน ตั้งจำนวนค่าไว้ 5 ได้ห้าช่องจริง

               ช่องในหน้านี้คีย์ได้จริงและตัดสินผ่าน/ไม่ผ่านด้วยกติกาเดียวกับ ERPNext
               (เทียบทุกค่ากับ min/max, mean เฉลี่ยเฉพาะช่องที่คีย์แล้ว) — ตั้งเกณฑ์ผิด
               จะเห็นตั้งแต่ตรงนี้ ไม่ใช่ไปเห็นตอนผู้ตรวจคีย์ใบจริงแล้วตกทุกใบ */}
          <TabsContent value="preview" className="mt-6">
            <Alert variant="brand" className="mb-4">
              <EyeIcon />
              <AlertTitle>นี่คือหน้าตาที่ผู้ตรวจจะเห็น</AlertTitle>
              <AlertDescription>
                สร้างจากโครงสร้างที่ตั้งไว้ทางแท็บซ้าย แก้โครงแล้วหน้านี้เปลี่ยนตามทันที
                — ค่าที่คีย์ในหน้านี้ใช้ลองเกณฑ์เท่านั้น ไม่ได้บันทึก
              </AlertDescription>
            </Alert>

            <label className="mb-6 flex items-start justify-between gap-4 rounded-lg border border-border bg-card px-4 py-3">
              <span className="min-w-0">
                <span className="block text-sm font-medium">
                  ดูแบบ ERPNext ล้วน
                </span>
                <span className="block text-sm text-muted-foreground">
                  ถอด custom field ออกให้หมด เหลือเฉพาะที่ลง ERPNext ได้วันนี้
                  โดยไม่ต้องสร้างฟิลด์เพิ่ม — เปิดดูเพื่อเทียบว่าที่เพิ่มมาแลกกับอะไร
                </span>
              </span>
              <Switch checked={plain} onCheckedChange={setPlain} />
            </label>

            {/* ไล่ให้ครบว่าอะไรหายไป ไม่ใช่ให้ไปไล่จับผิดเองทีละจุด —
                ของพวกนี้คือรายการที่เดฟต้องสร้างเพิ่มทั้งหมด ไม่มากกว่านี้ */}
            {plain && (
              <div className="mb-6 rounded-lg border border-border bg-surface px-4 py-3">
                <p className="text-sm font-medium">ที่หายไปเมื่อไม่สร้าง custom field</p>
                <ul className="mt-1 space-y-1 text-sm text-muted-foreground">
                  <li>ชื่อช่องคีย์รายหัวข้อ — เหลือ Reading 1 … Reading {MAX_READINGS}</li>
                  <li>บรรทัดเกณฑ์ที่ผู้ตรวจอ่าน</li>
                  <li>ช่องหมายเหตุรายข้อ — เหลือหมายเหตุท้ายใบอันเดียว</li>
                  <li>ตัวเลือกจัดการของที่ไม่ผ่าน (Repack / รับสภาพ / ส่งคืน)</li>
                  <li>ปฏิทินรายเดือนของฟอร์มตามรอบเวลา</li>
                </ul>
                <p className="mt-2 text-sm">
                  <span className="text-muted-foreground">ที่ยังอยู่ครบ: </span>
                  ช่องคีย์ 1–10 ค่า · เกณฑ์ต่ำสุด–สูงสุด · สูตร · ผ่าน/ไม่ผ่านรายข้อและทั้งใบ ·
                  หมายเหตุท้ายใบ · ผู้ตรวจและผู้ตรวจทาน
                </p>
              </div>
            )}

            {/* ฟอร์มตามรอบเวลาต้องเห็นปฏิทินด้วย ไม่ใช่เห็นแค่ใบเดียว
                เพราะสิ่งที่คนเปิดฟอร์มแบบนี้ดูทุกวันคือ "วันไหนยังไม่มีใครทำ" */}
            {tpl.schedule.recurring && docsPerDay(tpl.schedule) > 0 && !plain && (
              <div className="mb-6 rounded-xl border border-border bg-card p-4">
                <p className="font-medium">ปฏิทินรายเดือนที่จะได้</p>
                <p className="mt-0.5 mb-3 text-sm text-muted-foreground">
                  หนึ่งจุดคือหนึ่งใบต่อวัน — ตั้งไว้ {docsPerDay(tpl.schedule)} ใบต่อวัน ·
                  เฉพาะวันทำงาน เว้นวันหยุดตามปฏิทินของบริษัท
                </p>
                <SchedulePreviewCalendar
                  schedule={{
                    mode: "recurring",
                    // วันละครั้งไม่มีกะ แต่ปฏิทินนับจุดจากจำนวนช่วงเวลา
                    // ส่งช่วงหลอกหนึ่งอันไปให้มันวาดจุดเดียว
                    slots: tpl.schedule.allDay
                      ? [{ id: "all-day", from: "", to: "" }]
                      : tpl.schedule.slots,
                    // ช่องเทาแทนวันหยุดที่มาจาก Holiday List — ตัวอย่างใช้เสาร์–อาทิตย์
                    // ซึ่งเป็น weekly_off ที่โรงงานส่วนใหญ่ตั้งไว้
                    skipDays: "weekend",
                  }}
                />
              </div>
            )}

            <h2 className="text-xl font-semibold tracking-tight">
              ใบ{tpl.name}
              {usesQualityInspection(tpl) && " PO260115/01-01"}
            </h2>

            {/* หัวใบ — ของที่ตรวจกับยอดของมัน
                Quality Inspection เก็บเองแค่ item_code / item_name / batch_no /
                sample_size ส่วนผู้ขายกับยอดรับ-ยอดไม่ผ่าน อยู่ที่ใบรับของ
                ต้องดึงข้าม doctype มาแสดง ไม่ได้เก็บซ้ำไว้ที่ใบตรวจ */}
            {usesQualityInspection(tpl) && (
              <PreviewDocHeader item={tpl.targets[0]} />
            )}

            <div className="mt-6 mb-3 flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-semibold">การตรวจสอบ</h3>
                <FieldNote>
                  status (หัวใบ) · inspect_and_set_status() ตั้งให้เองจาก readings
                  ไม่ผ่านข้อเดียว = ทั้งใบไม่ผ่าน
                </FieldNote>
              </div>
              {overall === "pass" && (
                <Badge appearance="soft" tone="success">
                  <CircleCheckIcon className="size-3.5" />
                  ผลรวมทั้งใบ: {VERDICT[plain ? "passFail" : verdict].pass}
                </Badge>
              )}
              {overall === "fail" && (
                <Badge appearance="soft" tone="danger">
                  <CircleXIcon className="size-3.5" />
                  ผลรวมทั้งใบ: {VERDICT[plain ? "passFail" : verdict].fail}
                </Badge>
              )}
              {overall === null && tpl.rows.length > 0 && (
                <Badge appearance="outline" tone="neutral">
                  ยังตรวจไม่ครบทุกข้อ
                </Badge>
              )}
            </div>

            <div className="space-y-3">
              {tpl.rows.map((row, i) => (
                <PreviewRow
                  key={row.id}
                  index={i + 1}
                  row={row}
                  plain={plain}
                  verdict={verdict}
                  state={tryOf(row.id)}
                  onChange={(next) =>
                    setTries((prev) => ({
                      ...prev,
                      [row.id]: { ...tryOf(row.id), ...next },
                    }))
                  }
                />
              ))}

              {tpl.rows.length === 0 && (
                <p className="rounded-lg border border-dashed border-border px-6 py-12 text-center text-sm text-muted-foreground">
                  ยังไม่มีหัวข้อตรวจ ใบตรวจจึงยังว่างเปล่า
                </p>
              )}
            </div>

            {tpl.dispositions.length > 0 && !plain && (
              <div className="mt-4">
                <p className="text-sm font-medium">
                  ประเภทการรับสินค้า กรณีไม่ผ่านข้อใดข้อหนึ่ง{" "}
                  {tpl.requireDisposition && (
                    <span className="font-normal text-danger-strong">
                      (บังคับเลือก)
                    </span>
                  )}
                </p>
                <RadioGroup className="mt-2 grid gap-2 @lg:grid-cols-3">
                  {tpl.dispositions.map((id) => (
                    <Label
                      key={id}
                      htmlFor={`preview-disp-${id}`}
                      className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2.5 font-normal"
                    >
                      <RadioGroupItem id={`preview-disp-${id}`} value={id} />
                      {dispositionOf(id)?.label ?? id}
                    </Label>
                  ))}
                </RadioGroup>
                <FieldNote custom>custom_disposition ที่ใบตรวจ</FieldNote>
              </div>
            )}

            {/* หมายเหตุท้ายใบเป็นของ ERPNext เอง ไม่ต้องสร้างเพิ่ม —
                คนละช่องกับหมายเหตุรายข้อที่ต้องทำเป็น custom field */}
            <div className="mt-4 space-y-1.5">
              <Label htmlFor="preview-remarks">
                หมายเหตุ{" "}
                <span className="font-normal text-muted-foreground">(ไม่บังคับ)</span>
              </Label>
              <Textarea
                id="preview-remarks"
                className="bg-card"
                rows={3}
                placeholder="ระบุหมายเหตุ"
              />
              <FieldNote>remarks</FieldNote>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <div className="sticky bottom-0 z-30 border-t border-border bg-surface">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Button variant="outline-primary" onClick={() => router.back()}>
            ย้อนกลับ
          </Button>
          <Button onClick={save}>บันทึก</Button>
        </div>
      </div>
    </>
  );
}

/* ---------- รอบการตรวจ ----------
     สวิตช์เดียว ไม่ใช่สองตัวเลือก — ปิด (ค่าเริ่มต้น) คือเปิดใบตามเอกสารแบบปกติ
     ของ ERPNext เปิดคือทำตามกะ ซึ่งต้องเขียนของเพิ่มเอง จึงต้องบอกให้ชัดตอนเปิด

     ที่มาของใบไม่มีช่องให้เลือกแยก — อ่านจากสวิตช์นี้กับช่องเอกสารอ้างอิงเอา
     ตัวตั้งค่ามีที่เดียวเสมอ ป้ายจึงตรงกับของจริงโดยไม่ต้องมีใครมาคอยดูแล */
function ScheduleEditor({
  schedule,
  onChange,
}: {
  schedule: QiSchedule;
  onChange: (next: Partial<QiSchedule>) => void;
}) {
  const patchSlot = (id: string, p: Partial<{ from: string; to: string }>) =>
    onChange({
      slots: schedule.slots.map((s) => (s.id === id ? { ...s, ...p } : s)),
    });

  const moveSlot = (id: string, delta: number) => {
    const i = schedule.slots.findIndex((s) => s.id === id);
    const j = i + delta;
    if (i < 0 || j < 0 || j >= schedule.slots.length) return;
    const slots = [...schedule.slots];
    [slots[i], slots[j]] = [slots[j], slots[i]];
    onChange({ slots });
  };

  return (
    <div className="space-y-4">
      {!schedule.recurring ? (
        <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
          ปิดไว้ = ใบเกิดจากเอกสารสต็อกตามปกติ ไม่มีปฏิทินและไม่มีใบรอไว้ล่วงหน้า
        </p>
      ) : (
        <>
      {/* ไม่ได้ขู่ให้กลัว แต่ถ้าไม่เขียนไว้ตรงนี้ จะมีคนตั้งกะเสร็จแล้วรอใบที่ไม่มีวันมา */}
          <Alert variant="warning">
            <CalendarDaysIcon />
            <AlertTitle>ส่วนนี้ ERPNext ไม่มีมาให้ ต้องเขียนเพิ่ม 3 อย่าง</AlertTitle>
            <AlertDescription>
              <ul className="mt-1 list-disc space-y-1 pl-4">
                <li>
                  doctype <span className="font-mono text-xs">QC Schedule</span>{" "}
                  เก็บช่วงเวลาที่ตั้งไว้ข้างล่างนี้
                </li>
                <li>
                  scheduled job สร้าง Quality Inspection เป็นร่างล่วงหน้าทุกกะ โดย
                  ข้ามวันที่อยู่ใน Holiday List ของบริษัท
                </li>
                {!schedule.allDay && (
                  <li>
                    custom field{" "}
                    <span className="font-mono text-xs">custom_shift</span> ที่ Quality
                    Inspection เพื่อบอกว่าใบนี้ของกะไหน
                  </li>
                )}
              </ul>
            </AlertDescription>
          </Alert>

          {/* วันละครั้ง กับ ตามรอบกะ ต่างกันที่เวลามีความหมายไหม — ฟอร์มที่ขอแค่
              "ตรวจสักครั้งในวันนั้น" ไม่ควรต้องกรอกเวลาเริ่ม-จบที่ไม่มีใครใช้ */}
          <div className="space-y-2">
            <Label>ความถี่</Label>
            <ChipGroup
              label="ตรวจบ่อยแค่ไหนในหนึ่งวัน"
              value={schedule.allDay ? "day" : "shift"}
              onChange={(v) =>
                onChange({
                  allDay: v === "day",
                  slots:
                    v === "shift" && schedule.slots.length === 0
                      ? [newShift()]
                      : schedule.slots,
                })
              }
              options={[
                {
                  id: "day" as const,
                  label: "วันละครั้ง",
                  hint: "วันละใบเดียว ตรวจตอนไหนของวันก็ได้",
                },
                {
                  id: "shift" as const,
                  label: "ตามรอบกะ",
                  hint: "หนึ่งกะหนึ่งใบ ใบบอกได้ว่าเป็นของกะไหน",
                },
              ]}
            />
          </div>

          {!schedule.allDay && (
          <div className="space-y-3">
            <div className="min-w-0">
              <Label>ช่วงเวลาที่ต้องตรวจในหนึ่งวัน</Label>
              <p className="text-sm text-muted-foreground">
                หนึ่งช่วงเวลาคือหนึ่งใบต่อวัน — ตั้งไว้ {schedule.slots.length} ใบต่อวัน
              </p>
            </div>

            {schedule.slots.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
                ยังไม่ได้ตั้งช่วงเวลา — ต้องมีอย่างน้อยหนึ่งช่วง ปฏิทินจึงจะรู้ว่าวันหนึ่งควรมีกี่ใบ
              </p>
            ) : (
              <div className="space-y-2">
                {schedule.slots.map((s, i) => (
                  <div
                    key={s.id}
                    className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-border p-3"
                  >
                    <span className="w-14 shrink-0 text-sm text-muted-foreground">
                      ช่วงที่ {i + 1}
                    </span>
                    <TimeField
                      aria-label={`เวลาเริ่มของช่วงที่ ${i + 1}`}
                      className="w-32"
                      value={s.from}
                      onValueChange={(from) => patchSlot(s.id, { from })}
                    />
                    <span className="text-muted-foreground">ถึง</span>
                    <TimeField
                      aria-label={`เวลาสิ้นสุดของช่วงที่ ${i + 1}`}
                      className="w-32"
                      value={s.to}
                      onValueChange={(to) => patchSlot(s.id, { to })}
                    />
                    {shiftOvernight(s) && (
                      <span className="text-sm text-muted-foreground">
                        ข้ามคืน — ใบเป็นของวันที่กะเริ่ม
                      </span>
                    )}
                    {/* เรียงกะตามเวลาจริงที่เดินงาน ไม่ใช่ตามลำดับที่กดเพิ่ม
                        กะดึกที่เพิ่มทีหลังต้องย้ายขึ้นไปอยู่ตำแหน่งที่ถูกได้ */}
                    <div className="ml-auto flex shrink-0 items-center">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        disabled={i === 0}
                        aria-label={`ย้ายช่วงที่ ${i + 1} ขึ้น`}
                        onClick={() => moveSlot(s.id, -1)}
                      >
                        <ChevronUpIcon />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        disabled={i === schedule.slots.length - 1}
                        aria-label={`ย้ายช่วงที่ ${i + 1} ลง`}
                        onClick={() => moveSlot(s.id, 1)}
                      >
                        <ChevronDownIcon />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`ลบช่วงที่ ${i + 1}`}
                        onClick={() =>
                          onChange({
                            slots: schedule.slots.filter((x) => x.id !== s.id),
                          })
                        }
                      >
                        <Trash2Icon />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-center">
              <Button
                variant="outline-primary"
                size="sm"
                onClick={() =>
                  onChange({ slots: [...schedule.slots, newShift()] })
                }
              >
                <PlusIcon />
                เพิ่มช่วงเวลา
              </Button>
            </div>
          </div>
          )}

          {/* ติ๊กวันเองทั้งเจ็ด ไม่ใช่เลือกจากสองแบบที่เดาไว้ให้ — โรงงานเดิน
              จ–ส บ้าง เจ็ดวันบ้าง หรือตรวจเฉพาะ จ/พ/ศ ก็มี และวันที่ไม่ติ๊กคือ
              ตัวที่ทำให้ช่องว่างในปฏิทินแปลความได้ว่า "ไม่ต้องทำ" ไม่ใช่ "ขาด" */}
          {/* ไม่มีช่องติ๊กวันและไม่มีช่องเลือกปฏิทินวันหยุด — วันทำงานไม่ใช่
              เรื่องที่ตั้งรายฟอร์ม Holiday List ของบริษัทตอบไว้แล้วทั้งสองชั้น
              (weekly_off = วันหยุดประจำสัปดาห์, holidays = วันหยุดนักขัตฤกษ์)
              ให้ตั้งซ้ำตรงนี้ = เปิดทางให้สองที่ตอบไม่ตรงกัน แล้วไม่มีใครรู้ว่าอันไหนจริง */}
          <div className="rounded-lg bg-surface px-4 py-3">
            <p className="text-sm font-medium">
              เปิดใบเฉพาะวันทำงาน เว้นวันหยุดให้อัตโนมัติ
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              อ่านจากปฏิทินวันหยุดของบริษัท ทั้งวันหยุดประจำสัปดาห์และวันหยุดนักขัตฤกษ์
              — เปลี่ยนวันหยุดที่เดียว ทุกฟอร์มตามให้เอง
            </p>
            <FieldNote>
              Company · default_holiday_list → Holiday List (weekly_off + holidays)
            </FieldNote>
          </div>
        </>
      )}
    </div>
  );
}

/* ---------- หนึ่งหัวข้อตรวจ ---------- */
/**
 * สูตรที่เขียนไว้ยังใช้ได้กับที่ติ๊กไว้ตอนนี้ไหม
 *
 * ตัวแปรที่สูตรใช้ได้เปลี่ยนตามติ๊ก "คีย์เป็นตัวเลข" — สลับติ๊กแล้วสูตรเดิมค้างอยู่
 * โดยไม่มีใครบอก ERPNext จะ throw error ตอนตรวจจริง ซึ่งสายไปแล้ว
 */
function formulaProblem(row: QiRow): string | null {
  if (!row.formulaBased || row.formula.trim() === "") return null;

  const slots = [...row.formula.matchAll(/reading_(\d+)/g)].map((m) =>
    Number(m[1])
  );
  const usesValue = /reading_value/.test(row.formula);

  if (!row.numeric) {
    if (slots.length > 0)
      return `สูตรอ้าง reading_${slots[0]} แต่ข้อนี้ไม่ได้คีย์เป็นตัวเลข มีแค่ reading_value ให้ใช้`;
    return null;
  }

  if (usesValue)
    return "สูตรอ้าง reading_value แต่ข้อนี้คีย์เป็นตัวเลข ใช้ reading_1 … หรือ mean แทน";

  const over = slots.filter((n) => n > row.readings);
  if (over.length > 0)
    return `สูตรอ้าง reading_${over[0]} แต่ตั้งให้คีย์แค่ ${row.readings} ค่า ช่องนั้นจะเป็น 0 เสมอ`;

  return null;
}

function RowCard({
  index,
  row,
  isFirst,
  isLast,
  onChange,
  onMove,
  onDuplicate,
  onRemove,
}: {
  index: number;
  row: QiRow;
  isFirst: boolean;
  isLast: boolean;
  onChange: (next: Partial<QiRow>) => void;
  onMove: (delta: number) => void;
  onDuplicate: () => void;
  onRemove: () => void;
}) {
  const p = paramOf(row.parameterId);
  const formulaIssue = formulaProblem(row);
  const unit = p?.unit ? ` (${p.unit})` : "";

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="font-medium">หัวข้อที่ {index}</p>
        {/* ย้าย/คัดลอก/ลบ อยู่ชิดขวาบนของการ์ด ไม่ต้องเปิดอะไรก่อน
            ลำดับข้อในฟอร์มกระดาษตายตัว ตั้งผิดลำดับแล้วต้องลบพิมพ์ใหม่คือเสียเวลาเปล่า */}
        <div className="flex shrink-0 items-center">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="ลบหัวข้อนี้"
            onClick={onRemove}
          >
            <TrashIcon />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="คัดลอกหัวข้อนี้"
            onClick={onDuplicate}
          >
            <CopyIcon />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            disabled={isFirst}
            aria-label="ย้ายขึ้น"
            onClick={() => onMove(-1)}
          >
            <ChevronUpIcon />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            disabled={isLast}
            aria-label="ย้ายลง"
            onClick={() => onMove(1)}
          >
            <ChevronDownIcon />
          </Button>
        </div>
      </div>

      {/* สามช่องที่ทุกข้อต้องมีเหมือนกัน อยู่แถวเดียวกัน — เลื่อนดูทั้งฟอร์มแล้ว
          อ่านไล่ลงมาเป็นคอลัมน์ได้ว่าข้อไหนตั้งเกณฑ์ไว้ ข้อไหนยังว่าง */}
      <div className="mt-3 grid gap-3 @2xl:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor={`param-${row.id}`}>หัวข้อ</Label>
          {/* พิมพ์ค้นหาได้ ไม่เจอก็กดสร้างใหม่ลงทะเบียนตรงนั้น
              ไม่ต้องออกไปหน้าอื่นก่อนแล้วกลับมาหาว่าค้างไว้ตรงไหน */}
          <ParamCombobox
            id={`param-${row.id}`}
            value={row.parameterId}
            onChange={(v) => onChange({ parameterId: v })}
          />
          <FieldNote>
            specification → Quality Inspection Parameter
            {p?.group ? ` · parameter_group = ${p.group}` : ""}
          </FieldNote>
        </div>

        {/* เกณฑ์ที่เขียนให้คนอ่าน — คนละอันกับ min/max หรือสูตรข้างล่าง
            ข้อที่ให้ติ๊กเองไม่มีเกณฑ์ในระบบเลย บรรทัดนี้คือทั้งหมดที่ผู้ตรวจมี */}
        <div className="space-y-1.5">
          <Label htmlFor={`criteria-${row.id}`}>
            เกณฑ์{" "}
            {!row.manualInspection && (
              <span className="font-normal text-muted-foreground">(ไม่บังคับ)</span>
            )}
          </Label>
          <Input
            id={`criteria-${row.id}`}
            className="bg-card"
            placeholder="ระบุเกณฑ์"
            value={row.criteria}
            onChange={(e) => onChange({ criteria: e.target.value })}
          />
          <FieldNote custom>custom_criteria · ตั้งต่างกันได้ทุกฟอร์ม</FieldNote>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={`remark-${row.id}`}>หมายเหตุ</Label>
          <Select
            value={row.remark}
            onValueChange={(v) => onChange({ remark: v as RemarkMode })}
          >
            <SelectTrigger id={`remark-${row.id}`} className="w-full bg-card">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {/* เรียงจากที่เข้มที่สุดลงไป — ค่าที่คนเลือกบ่อยที่สุดอยู่บนสุด */}
              {(["onFail", "optional", "off"] as RemarkMode[]).map((m) => (
                <SelectItem key={m} value={m}>
                  {REMARK_LABEL[m]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldNote custom>custom_remark</FieldNote>
        </div>
      </div>

      {/* คำอธิบายกลางของหัวข้อนี้ อ่านอย่างเดียว แก้ที่ทะเบียน
          โชว์ไว้กันคนเขียนซ้ำกับที่มีอยู่แล้ว */}
      {p?.description && (
        <p className="mt-2 rounded-lg bg-surface px-3 py-2 text-sm text-muted-foreground">
          คำอธิบายจากทะเบียน: {p.description}
        </p>
      )}

      <div className="mt-3 space-y-3">
        {/* ติ๊กสามตัวตรงกับ ERPNext ตัวต่อตัว ไม่ได้ยุบเป็นตัวเลือกเดียว
            เพราะ manual_inspection ติ๊กคู่กับ numeric หรือ formula ได้จริง —
            คีย์ค่าเก็บไว้เหมือนเดิม แต่คนเป็นคนชี้ขาดว่าผ่านหรือไม่ */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">ประเภทการตัดสิน:</span>
          {JUDGE_ORDER.map((k) => (
            <CheckChip
              key={k}
              id={`${k}-${row.id}`}
              label={FLAG[k].label}
              checked={row[k]}
              onChange={(on) => onChange({ [k]: on })}
            />
          ))}
        </div>
        {/* บรรทัดที่มีป้าย CUSTOM ต้องมีเฉพาะของที่เดฟต้องสร้างเพิ่ม —
            ฟิลด์ของ ERPNext ที่ติ๊กอยู่แยกไปอีกบรรทัด ไม่งั้นอ่านเหมือนต้องสร้างทั้งแถว */}
        <FieldNote>
          {JUDGE_ORDER.filter((k) => row[k] && !FLAG[k].custom)
            .map((k) => `${FLAG[k].field} = 1`)
            .join(" · ") || "ไม่ติ๊กอะไรเลย = เทียบ reading_value กับ value"}
        </FieldNote>
        {row.manualInspection && (
          <FieldNote custom>{FLAG.manualInspection.field}</FieldNote>
        )}
        {/* แปลติ๊กสามตัวเป็นประโยคเดียว — ชุดที่ใช้บ่อยที่สุดคือ "ติ๊กอย่างเดียว"
            ซึ่งเกิดจากไม่ติ๊กตัวหนึ่งบวกติ๊กอีกตัวหนึ่ง มองจากติ๊กเปล่า ๆ ไม่ออก */}
        <p className="rounded-lg bg-brand px-3 py-2 text-sm">
          <span className="text-muted-foreground">แปลว่า: </span>
          <span className="font-medium">{explainRow(row)}</span>
        </p>

        {/* ช่องเกณฑ์เปลี่ยนตามวิธีตัดสิน ไม่ใช่โชว์ทุกช่องแล้วให้เดาว่าอันไหนมีผล
            ERPNext เองก็ซ่อน–โชว์ด้วย depends_on แบบเดียวกัน
            depends_on ของจริง: min/max โชว์เมื่อ numeric และไม่ได้ใช้สูตร */}
        {row.numeric && !row.formulaBased && (
          <div className="grid gap-3 @lg:grid-cols-3">
            <StepperField
              id={`min-${row.id}`}
              label={`เริ่มต้น${unit}`}
              hint="min_value"
              placeholder="0"
              value={row.min}
              onChange={(v) => onChange({ min: v })}
            />
            <StepperField
              id={`max-${row.id}`}
              label={`สูงสุด${unit}`}
              hint="max_value"
              placeholder="0"
              value={row.max}
              onChange={(v) => onChange({ max: v })}
            />
            <ReadingsField row={row} onChange={onChange} />
            {/* เทียบทุกค่าที่คีย์ ไม่ใช่ค่าเฉลี่ย — ERPNext เขียนกำกับไว้เองว่า
                Applied on each reading ถ้าเกณฑ์จริงคือค่าเฉลี่ยต้องไปใช้สูตร */}
            <p className="text-sm text-muted-foreground @lg:col-span-3">
              {row.manualInspection ? (
                <span className="text-danger-strong">
                  ติ๊กผู้ตรวจเลือกผลผ่าน/ไม่ผ่านเองอยู่ ช่วงนี้จะไม่ถูกใช้ตัดสิน เป็นแค่ตัวเลขอ้างอิงให้ผู้ตรวจดู
                </span>
              ) : (
                "เทียบกับทุกค่าที่คีย์ ไม่ใช่ค่าเฉลี่ย — ถ้าเกณฑ์คือค่าเฉลี่ย ให้ติ๊กตัดสินด้วยสูตรแล้วเขียน mean"
              )}
            </p>
            {/* ERPNext เทียบ flt(min) <= v <= flt(max) โดย flt ของค่าว่างคือ 0
                ไม่มีฝั่งไหนแปลว่าไม่จำกัด ปล่อยสูงสุดเป็น 0 ไว้คือฟอร์มที่ตกทุกใบ */}
            {!row.manualInspection && (row.max ?? 0) === 0 && (
              <p className="text-sm text-danger-strong @lg:col-span-3">
                ค่าสูงสุดเป็น 0 — ERPNext เทียบว่าต้องไม่เกิน 0 ค่าที่มากกว่านั้นจะไม่ผ่านทุกครั้ง
              </p>
            )}
            {row.readings > 1 && (
              <div className="@lg:col-span-3">
                <ReadingLabelsField row={row} onChange={onChange} />
              </div>
            )}
          </div>
        )}

        {/* ค่าที่ถือว่าผ่านซ่อนไปเมื่อติ๊กตั้งผลเอง — ของ ERPNext ยังโชว์อยู่
            เพราะ depends_on ของมันไม่ได้เช็ค manual (เทมเพลตของเขาไม่มี manual
            ให้เช็คด้วยซ้ำ) แต่ของเราเพิ่มติ๊กนั้นเองที่เทมเพลต จึงกำหนดเองได้ว่า
            ติ๊กแล้วช่องนี้หายไป ไม่ใช่โชว์ค้างไว้ให้กรอกแล้วไม่มีผล */}
        {!row.numeric && !row.formulaBased && !row.manualInspection && (
          <div className="space-y-1.5">
            {/* ไม่ติดป้าย (ไม่บังคับ) ทั้งที่ ERPNext ไม่ได้ตั้ง reqd ไว้ —
                เพราะช่องนี้โผล่เฉพาะข้อที่ผู้ตรวจต้องคีย์ข้อความจริง ๆ
                เว้นว่างแล้วข้อนั้นไม่ผ่านทุกใบ บอกว่าไม่บังคับคือบอกผิด */}
            <Label htmlFor={`value-${row.id}`}>
              ค่าที่ถือว่าผ่าน{" "}
              <span className="font-normal text-muted-foreground">
                (เทียบแบบตรงตัวอักษร)
              </span>
            </Label>
            <Input
              id={`value-${row.id}`}
              className="bg-card"
              placeholder="ระบุค่า"
              value={row.value}
              onChange={(e) => onChange({ value: e.target.value })}
            />
            <FieldNote>value</FieldNote>
            {/* ERPNext ไม่ได้บังคับกรอกช่องนี้ แต่เว้นว่างแล้วมันเทียบกับค่าว่าง
                ซึ่งแปลว่าผู้ตรวจคีย์อะไรลงไปก็ไม่ผ่าน ต้องเขียนเตือนไว้
                ไม่งั้นจะกลายเป็นฟอร์มที่ตกทุกใบโดยไม่มีใครรู้ว่าเพราะอะไร */}
            {row.value.trim() === "" && (
              <p className="text-sm text-danger-strong">
                เว้นว่าง = ไม่มีค่าให้เทียบ ผู้ตรวจคีย์อะไรลงไปข้อนี้จะไม่ผ่านทุกครั้ง
              </p>
            )}
          </div>
        )}

        {row.formulaBased && (
          <div className="space-y-3">
            {row.numeric && (
              <div className="@lg:w-1/3">
                <ReadingsField row={row} onChange={onChange} />
              </div>
            )}
            {row.numeric && row.readings > 1 && (
              <ReadingLabelsField row={row} onChange={onChange} />
            )}
            <div className="space-y-1.5">
              <Label htmlFor={`formula-${row.id}`} className="gap-1.5">
                สูตร
                <InfoIcon className="size-3.5 text-muted-foreground" />
              </Label>
              <Textarea
                id={`formula-${row.id}`}
                className="bg-card font-mono text-sm"
                rows={2}
                placeholder="ระบุสูตร เช่น (reading_1 + reading_2) / 2 >= 0.4"
                value={row.formula}
                onChange={(e) => onChange({ formula: e.target.value })}
              />
              {/* สูตรอ้างชื่อช่องตามจำนวนที่ตั้งไว้ ลดจำนวนช่องแล้วสูตรที่อ้าง
                  ช่องที่หายไปจะพังเงียบ ๆ ตอนตรวจจริง จึงพิมพ์ชื่อช่องที่ใช้ได้ไว้ตรงนี้

                  ERPNext ใส่ mean มาให้ในสูตรของข้อที่คีย์ตัวเลข — เขียน
                  mean >= 0.4 ได้เลย ไม่ต้องบวกเองแล้วหารจำนวนครั้ง ซึ่งพังทันที
                  ที่มีคนเปลี่ยนจำนวนค่าที่คีย์ */}
              <FieldNote>
                acceptance_formula · ใช้ได้:{" "}
                {row.numeric ? `${readingRefs(row)} · mean` : "reading_value"}
              </FieldNote>
              {formulaIssue && (
                <p className="rounded-lg border border-danger-border bg-danger px-3 py-2 text-sm text-danger-strong">
                  {formulaIssue}
                </p>
              )}
              {/* ตัวอย่างสามบรรทัดลอกจากใต้ช่องสูตรของ ERPNext เอง —
                  คนที่ไม่เคยเขียนสูตรต้องเห็นหน้าตาของจริงก่อน ไม่ใช่เห็นแค่ชื่อตัวแปร */}
              <div className="rounded-lg bg-surface px-3 py-2 text-xs text-muted-foreground">
                <p>เขียนเป็นเงื่อนไขที่ตอบได้ว่าจริงหรือเท็จ จริง = ผ่าน</p>
                <ul className="mt-1 space-y-0.5 font-mono">
                  <li>reading_1 &gt; 0.2 and reading_1 &lt; 0.5</li>
                  <li>mean &gt; 3.5</li>
                  <li>reading_value in (&quot;A&quot;, &quot;B&quot;, &quot;C&quot;)</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/** ลำดับติ๊กตามที่คนอ่านฟอร์มคิด — ใครตัดสินก่อน แล้วค่อยว่าด้วยวิธีคีย์ค่า */
const JUDGE_ORDER: FlagKey[] = ["manualInspection", "numeric", "formulaBased"];

/**
 * ชื่อกำกับช่องคีย์ทีละช่อง
 *
 * ERPNext ตั้งป้ายไว้ตายตัวว่า Reading 1 … Reading 10 แก้ได้แต่ทั้งระบบ ไม่ได้
 * แก้รายหัวข้อ — ฟอร์มกระดาษที่ใช้ตะแกรงคนละขนาดในหัวข้อเดียวจึงอ่านไม่ออกว่า
 * ช่องไหนคือช่องไหน ช่องนี้คือที่เก็บชื่อพวกนั้น
 */
function ReadingLabelsField({
  row,
  onChange,
}: {
  row: QiRow;
  onChange: (next: Partial<QiRow>) => void;
}) {
  const setLabel = (i: number, v: string) => {
    const next = Array.from(
      { length: row.readings },
      (_, n) => row.labels?.[n] ?? ""
    );
    next[i] = v;
    onChange({ labels: next });
  };

  return (
    <div className="space-y-1.5">
      <Label>
        ชื่อช่องคีย์{" "}
        <span className="font-normal text-muted-foreground">(ไม่บังคับ)</span>
      </Label>
      <div className="grid gap-2 @lg:grid-cols-2">
        {Array.from({ length: row.readings }, (_, i) => (
          <Input
            key={i}
            className="bg-card"
            aria-label={`ชื่อช่องที่ ${i + 1}`}
            placeholder={`ครั้งที่ ${i + 1}`}
            value={row.labels?.[i] ?? ""}
            onChange={(e) => setLabel(i, e.target.value)}
          />
        ))}
      </div>
      <FieldNote custom>
        custom_reading_labels · ERPNext มีป้ายให้แค่ Reading 1 … Reading{" "}
        {MAX_READINGS}
      </FieldNote>
    </div>
  );
}

/** จำนวนช่องที่ผู้ตรวจต้องคีย์ — โผล่เฉพาะข้อที่คีย์เป็นตัวเลข */
function ReadingsField({
  row,
  onChange,
}: {
  row: QiRow;
  onChange: (next: Partial<QiRow>) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={`readings-${row.id}`}>จำนวนค่าที่ต้องระบุ</Label>
      <Select
        value={String(row.readings)}
        onValueChange={(v) => onChange({ readings: Number(v) })}
      >
        <SelectTrigger id={`readings-${row.id}`} className="w-full bg-card">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Array.from({ length: MAX_READINGS }, (_, i) => i + 1).map((n) => (
            <SelectItem key={n} value={String(n)}>
              {n === 1 ? "คีย์ค่าเดียว" : `${n} ค่า`}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {/* แยกสองบรรทัดเพราะเป็นคนละเรื่อง — ช่องคีย์เป็นของ ERPNext ที่มีครบทุกแถว
          อยู่แล้ว ส่วนที่ต้องสร้างเพิ่มคือ "โชว์กี่ช่อง" ซึ่งของเดิมไม่มีแนวคิดนี้
          เขียนรวมบรรทัดเดียวจะอ่านเหมือนช่องคีย์เองก็ต้องสร้าง */}
      <FieldNote>
        reading_1 … reading_{MAX_READINGS} มีครบทุกแถวอยู่แล้ว (ใบตรวจ · ของ ERPNext)
      </FieldNote>
      <FieldNote custom>
        custom_readings · เก็บว่าโชว์กี่ช่อง ของเดิมโชว์ครบสิบแล้วคีย์เท่าที่ใช้
      </FieldNote>
    </div>
  );
}

/* ---------- หัวใบในหน้าตัวอย่าง ----------
     ของที่ตรวจกับยอดของมัน — ส่วนนี้คือที่ที่เดฟต้องระวังที่สุด เพราะดูเหมือน
     เป็นหน้าเดียวกันแต่ข้อมูลมาจากสาม doctype

       item_code / item_name / batch_no / sample_size  →  Quality Inspection เอง
       ชื่อผู้ขาย                                        →  ใบรับของ (supplier)
       ยอดรับ / ยอดไม่ผ่าน / ยอดเข้าคลัง                 →  แถวสินค้าในใบรับของ

     ยอดพวกนี้ห้ามเก็บซ้ำไว้ที่ใบตรวจ — ใบรับของแก้ยอดทีหลังได้ แล้วเลขสองที่
     จะไม่ตรงกันโดยไม่มีใครรู้ */
function PreviewDocHeader({ item }: { item?: string }) {
  return (
    <div className="mt-3 rounded-xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold">{item ?? "21-0-0 ฟูเจียนผง"}</span>
          <span className="text-sm text-muted-foreground">วัตถุดิบ</span>
          <span className="text-sm text-muted-foreground">·</span>
          <span className="text-sm text-muted-foreground">Bulk</span>
          <Badge appearance="soft" tone="brand">
            A-9M
          </Badge>
        </div>
        <span className="text-sm text-muted-foreground">
          บริษัท เอชซี อินเตอร์เนชั่นแนล เทรดดิ้ง จำกัด
        </span>
      </div>

      <div className="mt-3 grid gap-3 rounded-lg bg-brand px-4 py-3 @lg:grid-cols-4">
        {[
          ["ตรวจสอบ (ตัน)", "800.00"],
          ["ไม่ผ่าน (ตัน)", "-"],
          ["เข้าคลังเฉลี่ย (ตัน)", "-"],
          ["เข้าคลัง (ตัน)", "-"],
        ].map(([label, value]) => (
          <div key={label}>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="font-medium tabular-nums">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-3 grid gap-3 @lg:grid-cols-2">
        <div>
          <p className="text-sm text-muted-foreground">ผู้รับสินค้า</p>
          <p className="font-medium">อลิสา พรสุขสิริ</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">ผู้แก้ไขรับสินค้าล่าสุด</p>
          <p className="font-medium">-</p>
        </div>
      </div>

      <div className="mt-3">
        <FieldNote>
          item_code · item_name · batch_no · sample_size · reference_name
        </FieldNote>
        <FieldNote custom>
          ชื่อผู้ขายกับยอดตัน ไม่ได้อยู่ที่ใบตรวจ — ต้องดึงจากใบรับของมาแสดง
        </FieldNote>
      </div>
    </div>
  );
}

/* ---------- หนึ่งหัวข้อในหน้าตัวอย่าง ----------
     หัวข้อหนึ่งข้อแสดงเป็นการ์ดเดียว แต่ข้างในแตกเป็นรอบ ๆ ตามที่ตั้งไว้
     เพราะฝั่ง ERPNext หนึ่งรอบคือหนึ่งแถวใน readings ที่มี status ของตัวเอง
     คนตรวจจึงเห็นหัวข้อเดียวแบบกระดาษ แต่ข้อมูลที่ได้ตรงกับโครงของจริง */
type VerdictWords = "passFail" | "normal";

const VERDICT: Record<VerdictWords, { pass: string; fail: string }> = {
  passFail: { pass: "ผ่าน", fail: "ไม่ผ่าน" },
  normal: { pass: "ปกติ", fail: "ผิดปกติ" },
};

/* ค่าที่คีย์ของหนึ่งแถว เก็บไว้ที่หน้า ไม่ใช่ในการ์ด เพราะผลรวมทั้งใบต้องอ่าน
   จากทุกแถวพร้อมกัน — ERPNext เองก็ตัดสินทั้งใบจาก readings ทั้งตารางเหมือนกัน */
type RoundState = {
  /** null = ยังไม่ได้คีย์ ซึ่งไม่ใช่เรื่องเดียวกับศูนย์ */
  nums: Record<number, number | null>;
  text: string;
  manual: "pass" | "fail" | null;
};

const EMPTY_ROUND: RoundState = { nums: {}, text: "", manual: null };

/* ผ่าน/ไม่ผ่านของหนึ่งแถว คิดด้วยกติกาเดียวกับ inspect_and_set_status
     manual_inspection ติ๊กไว้  → ระบบไม่ตัดสิน คนเลือกเอง
     formula_based_criteria    → รันสูตร
     numeric                   → เทียบทุกค่าที่คีย์กับ min/max ไม่ใช่ค่าเฉลี่ย
     นอกนั้น                    → เทียบ reading_value กับ value ตรงตัวอักษร
   ยังไม่มีใครคีย์ = ยังไม่มีผล ไม่ใช่ผ่าน */
function computeRound(row: QiRow, st: RoundState) {
  const keyed = Array.from({ length: row.readings }, (_, i) => st.nums[i]).filter(
    (v): v is number => typeof v === "number"
  );
  const sum = keyed.reduce((a, b) => a + b, 0);
  // ERPNext เฉลี่ยเฉพาะช่องที่คีย์แล้ว (calculate_mean) ไม่ได้หารด้วยจำนวนช่องทั้งหมด
  const mean = keyed.length ? sum / keyed.length : 0;
  const touched = row.numeric ? keyed.length > 0 : st.text.trim() !== "";

  const data: Record<string, number | string> = row.numeric
    ? {
        ...Object.fromEntries(
          Array.from({ length: MAX_READINGS }, (_, i) => [
            `reading_${i + 1}`,
            st.nums[i] ?? 0,
          ])
        ),
        mean,
      }
    : { reading_value: st.text };

  const formulaResult = row.formulaBased ? evalFormula(row.formula, data) : null;
  const readout = row.formulaBased ? formulaReadout(row.formula, data) : null;

  const status: "pass" | "fail" | null = row.manualInspection
    ? st.manual
    : !touched
      ? null
      : row.formulaBased
        ? formulaResult === null
          ? null
          : formulaResult
            ? "pass"
            : "fail"
        : row.numeric
          ? keyed.every((n) => n >= (row.min ?? 0) && n <= (row.max ?? 0))
            ? "pass"
            : "fail"
          : st.text.trim() === row.value.trim()
            ? "pass"
            : "fail";

  return { keyed, sum, mean, touched, formulaResult, readout, status };
}

/** ผลรวมทั้งใบ — ไม่ผ่านข้อเดียวคือทั้งใบไม่ผ่าน ตรงกับ inspect_and_set_status */
function overallStatus(
  statuses: ("pass" | "fail" | null)[]
): "pass" | "fail" | null {
  if (statuses.includes("fail")) return "fail";
  if (statuses.length > 0 && statuses.every((s) => s !== null)) return "pass";
  return null;
}

/* ---------- หนึ่งหัวข้อในหน้าตัวอย่าง = หนึ่งแถวใน readings ---------- */
function PreviewRow({
  index,
  row,
  plain,
  verdict = "passFail",
  state,
  onChange,
}: {
  index: number;
  row: QiRow;
  /** ถอด custom field ออกหมด — ป้ายช่อง เกณฑ์ที่คนอ่าน และหมายเหตุรายข้อหายไป */
  plain?: boolean;
  verdict?: VerdictWords;
  state: RoundState;
  onChange: (next: Partial<RoundState>) => void;
}) {
  const p = paramOf(row.parameterId);
  // แบบ ERPNext ล้วนบังคับ Accepted/Rejected เสมอ คำอื่นต้องมี doctype ของตัวเอง
  const words = VERDICT[plain ? "passFail" : verdict];
  // ของ ERPNext ล้วนไม่มีชื่อช่องรายหัวข้อ ได้ Reading 1 … 10 ตามที่ doctype ตั้งไว้
  const labels = plain
    ? row.numeric
      ? Array.from({ length: row.readings }, (_, i) => `Reading ${i + 1}`)
      : ["Reading Value"]
    : readingLabels(row);

  const { keyed, sum, mean, touched, readout, status } = computeRound(row, state);
  const tickOnly = row.manualInspection && !row.numeric && !row.formulaBased;

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
        <div className="min-w-0">
          <p className="font-medium">
            {index}. {p?.name ?? "ยังไม่ได้เลือกหัวข้อ"}
          </p>
          {/* เกณฑ์ที่คนอ่านมาก่อน ส่วนที่เครื่องใช้ตัดสินเป็นบรรทัดรอง —
              คนยืนตรวจอ่าน (reading_2 + reading_3) / 2500 * 100 ไม่รู้เรื่อง */}
          {row.criteria && !plain ? (
            <>
              <p className="mt-0.5 text-sm text-muted-foreground">
                เกณฑ์: {row.criteria}
              </p>
              <p className="mt-0.5 font-mono text-xs break-all text-muted-foreground">
                {describeCriteria(row)}
              </p>
            </>
          ) : (
            <p className="mt-0.5 text-sm text-muted-foreground">
              เกณฑ์: {describeCriteria(row)}
            </p>
          )}
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-x-3 gap-y-1">
          {/* ค่าเฉลี่ยคือตัวแปร mean ที่เขียนในสูตรได้ตรง ๆ โชว์ไว้ให้เห็นว่า
              เลขที่สูตรจะได้คือเลขไหน ไม่ต้องไปคิดเองตอนเขียนสูตร */}
          {row.numeric && labels.length > 1 && keyed.length > 0 && (
            <>
              <span className="text-sm text-muted-foreground">
                รวม:{" "}
                <span className="font-medium tabular-nums text-foreground">
                  {sum.toFixed(2)}
                </span>
                {p?.unit ? ` ${p.unit}` : ""}
              </span>
              <span className="text-sm text-muted-foreground">
                เฉลี่ย (mean):{" "}
                <span className="font-medium tabular-nums text-foreground">
                  {mean.toFixed(2)}
                </span>
                {p?.unit ? ` ${p.unit}` : ""}
              </span>
            </>
          )}
          {readout && touched && (
            <span className="text-sm text-muted-foreground">
              ค่าที่ใช้ตัดสิน:{" "}
              <span className="font-medium tabular-nums text-foreground">
                {readout.value.toFixed(2)}
              </span>{" "}
              · เกณฑ์ {readout.op} {readout.bound}
            </span>
          )}
          {status === "pass" && (
            <Badge appearance="soft" tone="success">
              <CircleCheckIcon className="size-3.5" />
              {words.pass}
            </Badge>
          )}
          {status === "fail" && (
            <Badge appearance="soft" tone="danger">
              <CircleXIcon className="size-3.5" />
              {words.fail}
            </Badge>
          )}
          {/* ยังไม่คีย์ = ยังไม่มีผล บอกให้ชัดดีกว่าปล่อยว่างจนดูเหมือนป้ายหาย */}
          {status === null && !touched && !row.manualInspection && (
            <Badge appearance="outline" tone="neutral">
              ยังไม่ได้คีย์ค่า
            </Badge>
          )}
          {/* สูตรที่แปลงเป็นเงื่อนไขในเครื่องไม่ได้ ไม่เดาผลให้ —
              โชว์ป้ายที่อาจไม่ตรงกับของจริงอันตรายกว่าไม่โชว์ */}
          {status === null && touched && row.formulaBased && (
            <Badge appearance="outline" tone="warning">
              สูตรนี้ตัวอย่างคำนวณให้ไม่ได้
            </Badge>
          )}
        </div>
      </div>

      <div
        className={cn(
          "mt-3 grid gap-3",
          tickOnly && "hidden",
          labels.length > 2 ? "@lg:grid-cols-4" : "@lg:grid-cols-2"
        )}
      >
        {labels.map((l, i) =>
          row.numeric ? (
            <StepperField
              key={l + i}
              id={`preview-${row.id}-${i}`}
              label={l}
              placeholder="ยังไม่ได้คีย์"
              step={0.1}
              value={state.nums[i] ?? null}
              onChange={(v) => onChange({ nums: { ...state.nums, [i]: v } })}
            />
          ) : (
            <div key={l + i} className="space-y-1.5">
              <Label htmlFor={`preview-${row.id}-${i}`}>{l}</Label>
              <Input
                id={`preview-${row.id}-${i}`}
                className="bg-card"
                placeholder="ระบุค่าที่ตรวจได้"
                value={state.text}
                onChange={(e) => onChange({ text: e.target.value })}
              />
            </div>
          )
        )}
      </div>

      {/* ติ๊กผู้ตรวจเลือกผลเอง = มีปุ่มสองปุ่มเพิ่มมาในใบจริง และมีได้พร้อม
          ช่องคีย์ค่าข้างบน ตรงกับฟอร์มกระดาษที่มีทั้งช่องวัดและช่องติ๊ก */}
      {row.manualInspection && (
        <div className="mt-3 space-y-1.5">
          <p className="text-sm text-muted-foreground">ผลการตรวจสอบ</p>
          <ChoiceGroup
            label="ผลการตรวจสอบ"
            value={state.manual ?? ""}
            onChange={(v) =>
              onChange({ manual: v === "" ? null : (v as "pass" | "fail") })
            }
            options={[
              { id: "pass" as const, label: words.pass },
              { id: "fail" as const, label: words.fail },
            ]}
          />
        </div>
      )}

      {row.remark !== "off" && !plain && (
        <div className="mt-3 space-y-1">
          <p className="text-sm text-muted-foreground">
            หมายเหตุ{" "}
            <span className="text-xs">
              ({row.remark === "onFail" ? "บังคับเมื่อไม่ผ่าน" : "ไม่บังคับ"})
            </span>
          </p>
          <Textarea className="bg-card" rows={2} placeholder="ระบุหมายเหตุ" />
        </div>
      )}

      {/* ช่องที่เห็นในข้อนี้ไปลงฟิลด์ไหน — แยกบรรทัดบนของ ERPNext กับบรรทัดล่าง
          ที่ต้องสร้างเพิ่ม เพราะสองอย่างนี้ราคาต่างกันมากตอนประเมินงาน */}
      <div className="mt-3 border-t border-border pt-2">
        <FieldNote>
          specification ·{" "}
          {row.numeric
            ? `reading_1 … reading_${row.readings}`
            : "reading_value"}{" "}
          · status
          {row.numeric && !row.formulaBased ? " · min_value · max_value" : ""}
          {row.formulaBased ? " · acceptance_formula" : ""}
          {row.manualInspection ? " · manual_inspection (ของแถวในใบ)" : ""}
        </FieldNote>
        {!plain && (
          <FieldNote custom>{customFieldsOf(row).join(" · ")}</FieldNote>
        )}
        {/* เลขสรุปไม่ได้เก็บลงฐานข้อมูล ERPNext ไม่มีฟิลด์ประเภทคำนวณ —
            เขียนไว้กันเข้าใจว่าจะไปดึงรายงานย้อนหลังจากเลขพวกนี้ได้ */}
        {row.numeric && row.readings > 1 && !plain && (
          <FieldNote>
            รวม · เฉลี่ย · ค่าที่ใช้ตัดสิน คำนวณบนหน้าจอด้วย Client Script ไม่ได้เก็บลงฐานข้อมูล
          </FieldNote>
        )}
      </div>
    </div>
  );
}

/** ฟิลด์ที่ข้อนี้ต้องสร้างเพิ่มใน ERPNext — อ่านจากที่ตั้งไว้ ไม่ได้เขียนตายไว้ */
function customFieldsOf(row: QiRow): string[] {
  const out = ["custom_criteria"];
  if (row.numeric && row.readings > 1)
    out.push("custom_readings", "custom_reading_labels");
  if (row.manualInspection) out.push("custom_manual_inspection");
  if (row.remark !== "off") out.push("custom_remark");
  return out;
}

/* ---------- ชิ้นส่วนเล็ก ๆ ---------- */

function Section({
  index,
  title,
  note,
  action,
  children,
}: {
  /** เลขลำดับก้อน — ฟอร์มกระดาษของโรงงานเรียงเป็นข้อ หน้าจอจึงเรียงให้ตรงกัน */
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
          {note && <p className="mt-0.5 text-sm text-muted-foreground">{note}</p>}
        </div>
        {action}
      </div>
      <div className="mt-3">{children}</div>
    </section>
  );
}

/**
 * ชื่อฟิลด์จริงของ ERPNext ใต้ช่อง — เดฟจะได้แมปได้โดยไม่ต้องเปิดเอกสารเทียบ
 *
 * ช่องที่ ERPNext ไม่มีติดป้าย custom ไว้ด้วย เพราะสองอย่างนี้ราคาต่างกันมาก
 * ของที่มีอยู่แล้วแค่ตั้งค่า ส่วนของที่ติดป้ายต้องสร้างฟิลด์เพิ่มก่อนถึงจะใช้ได้
 */
function FieldNote({
  children,
  custom,
}: {
  children: React.ReactNode;
  custom?: boolean;
}) {
  return (
    <p className="font-mono text-xs text-muted-foreground">
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

function StepperField({
  id,
  label,
  hint,
  placeholder = "ไม่จำกัด",
  value,
  step = 1,
  onChange,
}: {
  id: string;
  label: string;
  hint?: string;
  placeholder?: string;
  value: number | null;
  step?: number;
  onChange: (v: number | null) => void;
}) {
  // กดปุ่มตอนยังว่างอยู่ = เริ่มนับจากศูนย์ ไม่ใช่ติดลบจากค่าที่ไม่มี
  const bump = (delta: number) =>
    onChange(Number(((value ?? 0) + delta).toFixed(2)));

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <InputGroup className="h-10 bg-card">
        <InputGroupAddon align="inline-start">
          <InputGroupButton
            size="icon-sm"
            aria-label={`ลด${label}`}
            onClick={() => bump(-step)}
          >
            <MinusIcon />
          </InputGroupButton>
        </InputGroupAddon>
        <InputGroupInput
          id={id}
          inputMode="decimal"
          className="text-center tabular-nums"
          placeholder={placeholder}
          value={value === null ? "" : String(value)}
          onChange={(e) => {
            const raw = e.target.value.trim();
            onChange(raw === "" ? null : Number(raw));
          }}
        />
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            size="icon-sm"
            aria-label={`เพิ่ม${label}`}
            onClick={() => bump(step)}
          >
            <PlusIcon />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
      {hint && <p className="font-mono text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

/**
 * ลองสูตรของ ERPNext ในหน้าตัวอย่าง
 *
 * ของจริงรันด้วย frappe.safe_eval ฝั่งเซิร์ฟเวอร์ตอนบันทึก ซึ่งเป็น Python
 * ที่นี่แปลงคำที่ต่างกันให้เป็น JavaScript แล้วรันในเครื่อง — ไวยากรณ์ที่ฟอร์ม
 * จริงใช้มีไม่กี่แบบ (เปรียบเทียบ, and/or/not, in (...)) ครอบได้หมด
 *
 * ผ่านตัวกรองตัวอักษรก่อนเสมอ สูตรที่มีอย่างอื่นปนจะคืน null แล้วหน้าจอ
 * บอกว่าคำนวณให้ไม่ได้ ดีกว่าโชว์ผลที่อาจไม่ตรงกับของจริง
 */
function runExpr(
  expr: string,
  data: Record<string, number | string>
): unknown {
  const js = expr
    .replace(/\bnot\b/g, "!")
    .replace(/\band\b/g, "&&")
    .replace(/\bor\b/g, "||")
    // Python: reading_value in ("A", "B") — JS ไม่มี in แบบนี้
    .replace(/(\w+)\s+in\s+\(([^)]*)\)/g, "[$2].includes($1)");

  if (!/^[\w\s.+\-*/()<>=!&|,"'[\]]*$/.test(js)) return null;

  try {
    const keys = Object.keys(data);
    const fn = new Function(...keys, `"use strict"; return (${js});`);
    return fn(...keys.map((k) => data[k]));
  } catch {
    return null;
  }
}

function evalFormula(
  formula: string,
  data: Record<string, number | string>
): boolean | null {
  const out = runExpr(formula, data);
  return out === null ? null : Boolean(out);
}

/**
 * เลขที่สูตรเอาไปเทียบจริง ๆ พร้อมเกณฑ์ของมัน
 *
 * ฟอร์มกระดาษเขียน "% รวม" ไว้หัวข้อ ซึ่งเป็นคนละเลขกับที่เกณฑ์ใช้ตัดสิน
 * (รวมสี่ตะแกรง แต่เกณฑ์คิดจากสองตะแกรงกลาง) โชว์เลขที่ผิดฝั่งแล้วคนหน้างาน
 * จะงงว่าทำไมเลขที่เห็นไม่ตรงกับผลที่ได้ — อ่านฝั่งซ้ายของสูตรมาโชว์แทน
 * จึงตรงกับที่ตัดสินเสมอ ไม่ว่าใครจะแก้สูตรเป็นอะไร
 */
function formulaReadout(
  formula: string,
  data: Record<string, number | string>
): { value: number; op: string; bound: string } | null {
  // สูตรที่มีหลายเงื่อนไขต่อกันไม่มีเลขเดียวให้อ่าน
  if (/\b(and|or|not)\b/.test(formula)) return null;

  const m = formula.match(/^([^<>=!]+)(>=|<=|==|!=|>|<)(.+)$/);
  if (!m) return null;

  const value = runExpr(m[1], data);
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return { value, op: m[2], bound: m[3].trim() };
}

const readingRefs = (row: QiRow) =>
  Array.from({ length: row.readings }, (_, i) => {
    const named = row.labels?.[i]?.trim();
    return named ? `reading_${i + 1} = ${named}` : `reading_${i + 1}`;
  }).join(" · ");
