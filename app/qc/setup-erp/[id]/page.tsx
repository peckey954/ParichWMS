"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  CircleCheckIcon,
  CircleXIcon,
  EyeIcon,
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
import { SchedulePreviewCalendar } from "@/components/qc/schedule-calendar";
import { TimeField } from "@/components/time-field";
import { MultiSelectChips } from "@/components/multi-select-chips";
import { DRAG_ITEM_ATTR, DragHandle } from "@/components/drag-handle";
import { SearchSelect } from "@/components/qc/search-select";
import {
  CheckTable,
  criteriaProblems,
  rowTitle,
} from "@/components/qc/check-table";
import {
  DEFAULT_SCHEDULE,
  DEFAULT_GUARD,
  type GuardAction,
  MAX_READINGS,
  REF_MENU,
  refMenusFor,
  type RefMenu,
  usesQualityInspection,
  describeCriteria,
  dispositionOf,
  docsPerDay,
  newShift,
  shiftOvernight,
  newRow,
  paramOf,
  passValues,
  readingLabels,
  templateOf,
  OPERATION_POOL,
  PHOTO_KEYS,
  PHOTO_LABEL,
  type PhotoMode,
  sourcePool,
  SOURCE,
  blankTemplate,
  commitTemplate,
  NEW_TEMPLATE_ID,
  type QiRow,
  type QiSchedule,
  type QiTemplate,
  type SourceId,
  type DocField,
  type Stage,
  HEADER_SOURCES,
  PRODUCT_TYPES,
  REPORT_TYPES,
  STAGE,
  STAGE_KEYS,
  VERDICT_OPTION_KEYS,
  VERDICT_OPTION_LABEL,
  addReportType,
  newDocField,
  stageOf,
  stagePatch,
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
            <Link href="/qc/setup-erp">กลับไปหน้าตั้งค่ารายงาน QC</Link>
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
  /* ค่าระบบ — ของจริงอ่านจาก Stock Settings ตัวเดียวทั้งระบบ ที่นี่ไม่มีหลังบ้าน
     จึงอ่านค่าตั้งต้นมาโชว์ ให้เห็นว่า "ตามค่าระบบ" ตอนนี้แปลว่าอะไร */
  const guard = DEFAULT_GUARD;
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
  const stage = stageOf(tpl);
  // ตัวเลือกที่ยังไม่ได้ตั้งชื่อไม่ขึ้นในใบ — ช่องว่างให้กดไม่ได้บอกอะไรผู้ตรวจ
  const dispositions = tpl.dispositions.filter((d) => d.trim() !== "");

  const patchRow = (id: string, next: Partial<QiRow>) =>
    setTpl((p) => ({
      ...p,
      rows: p.rows.map((r) => (r.id === id ? { ...r, ...next } : r)),
    }));


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
      warnBlankCriteria();
      return;
    }

    toast.success("บันทึกรายงานแล้ว", {
      description: `${tpl.name} · ${tpl.rows.length} หัวข้อ — ตัวอย่างหน้าตั้งค่า ยังไม่ได้ต่อหลังบ้าน`,
    });
    warnBlankCriteria();
  };

  /**
   * ด่านสุดท้ายก่อนเอาฟอร์มไปใช้ — เตือนรวม ไม่บล็อกการบันทึก
   *
   * แถบเตือนที่แถวมองข้ามได้ถ้าฟอร์มยาวยี่สิบสี่ข้อแล้วเลื่อนผ่านไป ตรงนี้คือ
   * จังหวะเดียวที่ยังทันแก้ แต่ไม่บล็อกเพราะฟอร์มกระดาษกว่าจะตั้งครบใช้หลายรอบ
   * ต้องเซฟร่างค้างไว้ได้ บล็อกเมื่อไหร่คนจะเลี่ยงด้วยการใส่เกณฑ์มั่ว ๆ ไปก่อน
   * ซึ่งแย่กว่าเว้นว่างไว้ตรง ๆ
   *
   * ปุ่มติ๊กให้ทุกข้อรวดเดียว — คนกดยังเป็นคนตัดสินอยู่ ไม่ได้ติ๊กให้เองเงียบ ๆ
   */
  const warnBlankCriteria = () => {
    const { alwaysPass, alwaysFail, total } = criteriaProblems(tpl.rows);
    if (total === 0) return;

    const parts = [
      alwaysPass.length > 0 ? `${alwaysPass.length} ข้อจะขึ้นว่าผ่านทุกใบ` : "",
      alwaysFail.length > 0 ? `${alwaysFail.length} ข้อจะขึ้นว่าไม่ผ่านทุกใบ` : "",
    ].filter(Boolean);

    toast.warning(`มี ${total} หัวข้อที่ระบบตัดสินให้ไม่ได้`, {
      description: `ยังไม่ได้ใส่ค่าที่ถือว่าผ่าน — ${parts.join(" · ")} ถ้าตั้งใจให้ผู้ตรวจตัดสินเอง กดปุ่มนี้ได้เลย`,
      duration: 10000,
      action: {
        label: "ให้ผู้ตรวจตัดสินเอง",
        onClick: () => {
          const ids = new Set(
            [...alwaysPass, ...alwaysFail].map((r) => r.id)
          );
          setTpl((p) => ({
            ...p,
            rows: p.rows.map((r) =>
              ids.has(r.id) ? { ...r, manualInspection: true } : r
            ),
          }));
          toast.success(`ติ๊กผู้ตรวจตัดสินเองให้ ${ids.size} ข้อแล้ว`);
        },
      },
    });
  };

  return (
    <>
      <main className="@container mx-auto w-full max-w-7xl px-4 pt-6 pb-24 sm:px-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">หน้าหลัก</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/qc/setup-erp">ตั้งค่ารายงาน</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-primary">รายงาน</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight">
              รายงานตรวจสอบ QC
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              สร้างแบบรายงานตรวจคุณภาพ เพิ่ม ลบ และแก้ไขหัวข้อการตรวจได้ตามกำหนด
            </p>
          </div>
          {/* เปิด/ปิดได้จากตรงนี้เลย ไม่ต้องกลับไปหน้ารายการ — ปิดแล้วฟอร์มยังอยู่
              แค่ไม่ถูกหยิบไปใช้กับใบตรวจใหม่ ใบเก่าที่ออกไปแล้วไม่กระทบ */}
          <SwitchLabel
            checked={tpl.active}
            onCheckedChange={(v) => patch({ active: v })}
          >
            เปิดใช้งาน
          </SwitchLabel>
        </div>

        <Tabs defaultValue="build" className="mt-5">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="build">โครงสร้างรายงาน</TabsTrigger>
            <TabsTrigger value="preview">ตัวอย่างรายงาน</TabsTrigger>
          </TabsList>

          <TabsContent value="build">
            {/* ---------- 1 ข้อมูลและเงื่อนไข ----------
                 สวิตช์เชื่อมโยงเอกสารอยู่หัวก้อน เพราะมันตัดสินว่าแถวที่สองมีไหม
                 รายงานที่ผู้ตรวจเปิดเอง (ตรวจเครื่องจักร ตรวจคลัง) ไม่มีช่วงการตรวจ
                 ไม่มีเอกสาร และไม่มีเอกสารให้บล็อก — ซ่อนทั้งแถว ไม่ใช่ปล่อยให้เห็น
                 สี่ช่องที่กรอกแล้วไม่มีผล */}
            <Section
              index={1}
              title="ข้อมูลและเงื่อนไขการตรวจสอบ"
              note="กำหนดข้อมูลรายงาน ช่วงการตรวจสอบ เอกสารอ้างอิง และเงื่อนไขการดำเนินงาน"
              action={
                <SwitchLabel
                  checked={tpl.linkDocs}
                  onCheckedChange={(on) =>
                    patch(
                      on
                        ? { linkDocs: true }
                        : {
                            linkDocs: false,
                            phase: "",
                            prodSteps: [],
                            operations: [],
                            refMenu: "",
                          }
                    )
                  }
                >
                  {tpl.linkDocs
                    ? "เชื่อมโยงกับเอกสารในระบบ"
                    : "ไม่มีเชื่อมโยงกับเอกสารในระบบ"}
                </SwitchLabel>
              }
            >
              <div className="grid gap-4 @xl:grid-cols-2 @5xl:grid-cols-4">
                <Field id="tpl-name" label="ชื่อรายงาน">
                  <Input
                    id="tpl-name"
                    className="bg-card"
                    placeholder="ระบุชื่อรายงาน"
                    value={tpl.name}
                    onChange={(e) => patch({ name: e.target.value })}
                  />
                </Field>

                <Field id="tpl-code" label="รหัสรายงาน" optional>
                  <Input
                    id="tpl-code"
                    className="bg-card"
                    placeholder="ระบุรหัสรายงาน"
                    value={tpl.code}
                    onChange={(e) => patch({ code: e.target.value })}
                  />
                </Field>

                {/* หมวดย่อยของการ์ดในหน้าหลัก — เพิ่มประเภทใหม่ได้จากในช่องเลย
                    หมวดใหม่ขึ้นในหน้าหลักทันทีที่มีรายงานเปิดใช้อยู่ในหมวดนั้น */}
                <Field id="tpl-type" label="ประเภทรายงาน">
                  <SearchSelect
                    id="tpl-type"
                    value={tpl.reportType}
                    placeholder="เลือกประเภท"
                    options={REPORT_TYPES.map((t) => ({
                      value: t.id,
                      label: t.label,
                    }))}
                    createLabel="เพิ่มประเภทใหม่"
                    onCreate={(label) => addReportType(label).id}
                    onChange={(v) => patch({ reportType: v })}
                  />
                </Field>

                <Field id="tpl-product" label="ประเภทสินค้า">
                  <MultiSelectChips
                    id="tpl-product"
                    className="h-9 w-full bg-card"
                    placeholder="เลือกประเภทสินค้า"
                    searchPlaceholder="ค้นหา"
                    selectAllLabel="ทั้งหมด"
                    options={PRODUCT_TYPES.map((p) => ({ label: p, value: p }))}
                    value={tpl.productTypes}
                    onValueChange={(v) => patch({ productTypes: v })}
                  />
                </Field>

                {tpl.linkDocs && (
                  <>
                    <Field id="tpl-stage" label="ช่วงการตรวจสอบ">
                      <Select
                        value={stage}
                        onValueChange={(v) => {
                          const next = stagePatch(v as Stage);
                          // ออกจากช่วงที่มีระหว่างผลิตแล้วขั้นตอนไม่มีความหมายอีก
                          // เอกสารที่เลือกไว้ใช้กับช่วงใหม่ไม่ได้ก็ล้างทิ้ง
                          patch({
                            ...next,
                            operations: next.prodSteps.includes("during")
                              ? tpl.operations
                              : [],
                            refMenu: refMenusFor(next.phase).includes(
                              tpl.refMenu as RefMenu
                            )
                              ? tpl.refMenu
                              : "",
                          });
                        }}
                      >
                        <SelectTrigger id="tpl-stage" className="w-full bg-card">
                          <SelectValue placeholder="เลือกช่วงการตรวจ" />
                        </SelectTrigger>
                        <SelectContent>
                          {STAGE_KEYS.map((k) => (
                            <SelectItem key={k} value={k}>
                              {STAGE[k].label} - {STAGE[k].erp}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>

                    <Field id="tpl-ref" label="เอกสารอ้างอิง">
                      <SearchSelect
                        id="tpl-ref"
                        value={tpl.refMenu}
                        disabled={tpl.phase === ""}
                        placeholder={
                          tpl.phase === "" ? "เลือกช่วงการตรวจก่อน" : "เลือกเอกสาร"
                        }
                        options={refMenusFor(tpl.phase).map((m) => ({
                          value: m,
                          label: `${REF_MENU[m].label} - ${REF_MENU[m].erp}`,
                        }))}
                        onChange={(v) => patch({ refMenu: v as RefMenu })}
                      />
                    </Field>

                    {/* "ตามค่าระบบ" ไม่ได้เป็นตัวเลือกแล้ว — โชว์ค่าที่ระบบใช้อยู่จริง
                        แทนคำว่าตามค่าระบบ ที่ต้องไปเปิดอีกหน้าถึงจะรู้ว่าแปลว่าอะไร */}
                    <Field id="tpl-sub" label="ยังไม่ได้ตรวจแล้วจะเดินเอกสารต่อ">
                      <Select
                        value={
                          tpl.onNotSubmitted === "system"
                            ? guard.onNotSubmitted
                            : tpl.onNotSubmitted
                        }
                        onValueChange={(v) =>
                          patch({ onNotSubmitted: v as GuardAction | "off" })
                        }
                      >
                        <SelectTrigger id="tpl-sub" className="w-full bg-card">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(["warn", "stop", "off"] as const).map((k) => (
                            <SelectItem key={k} value={k}>
                              {FLOW_LABEL[k]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>

                    <Field id="tpl-rej" label="ตรวจไม่ผ่านแล้วจะเดินเอกสารต่อ">
                      <Select
                        value={
                          tpl.onRejected === "system"
                            ? guard.onRejected
                            : tpl.onRejected
                        }
                        onValueChange={(v) =>
                          patch({ onRejected: v as GuardAction })
                        }
                      >
                        <SelectTrigger id="tpl-rej" className="w-full bg-card">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(["warn", "stop"] as const).map((k) => (
                            <SelectItem key={k} value={k}>
                              {FLOW_LABEL[k]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>

                    {/* ระหว่างผลิตหนึ่งขั้นตอน = หนึ่งใบงาน = หนึ่งใบตรวจ ต้องรู้ว่า
                        ขั้นตอนไหนบ้าง ไม่งั้นใบงานผลิตทุกใบจะเปิดใบตรวจให้หมด */}
                    {tpl.prodSteps.includes("during") && (
                      <div className="@xl:col-span-2">
                        <Field id="tpl-ops" label="ขั้นตอนการผลิตที่ต้องตรวจ">
                          <MultiSelectChips
                            id="tpl-ops"
                            className="h-9 w-full bg-card"
                            placeholder="เลือกขั้นตอน — หนึ่งขั้นตอน = หนึ่งใบตรวจ"
                            options={OPERATION_POOL.map((o) => ({
                              label: o,
                              value: o,
                            }))}
                            value={tpl.operations}
                            onValueChange={(v) => patch({ operations: v })}
                          />
                        </Field>
                      </div>
                    )}
                  </>
                )}
              </div>
            </Section>

            {/* ---------- 2 ส่วนหัวเอกสาร ----------
                 ปิดแล้วช่องที่ตั้งไว้ยังเก็บอยู่ เปิดกลับมาไม่ต้องตั้งใหม่ */}
            <Section
              index={2}
              title="ส่วนหัวเอกสาร"
              note="ช่องที่ผู้ตรวจต้องระบุก่อนเริ่มตรวจ เช่น สินค้า, เครื่องจักร"
              action={
                <SwitchLabel
                  checked={tpl.headerOn}
                  onCheckedChange={(on) =>
                    patch({
                      headerOn: on,
                      header:
                        on && tpl.header.length === 0
                          ? [newDocField()]
                          : tpl.header,
                    })
                  }
                >
                  เพิ่มหัวเอกสาร
                </SwitchLabel>
              }
            >
              {tpl.headerOn && (
                <HeaderFieldsTable
                  fields={tpl.header}
                  onChange={(header) => patch({ header })}
                />
              )}
            </Section>

            {/* ---------- 3 หัวข้อตรวจ ---------- */}
            <Section
              index={3}
              title="หัวข้อตรวจ"
              note="กำหนดหัวข้อ เกณฑ์ และการตัดสิน"
              action={
                /* คนละตัวกับติ๊กรายข้อในตาราง — ตัวนี้คือ manual_inspection
                   ที่หัวใบ ทำให้ระบบไม่เขียนทับผลรวมทั้งใบ ผลรายข้อยังคำนวณให้ */
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={tpl.manualWholeDoc}
                    onCheckedChange={(v) => patch({ manualWholeDoc: v === true })}
                  />
                  ผู้ตรวจตัดสินเองทั้งใบ
                </label>
              }
            >
              <CheckTable
                rows={tpl.rows}
                onChange={(rows) => patch({ rows })}
                onPatch={patchRow}
              />
              <AddButton
                onClick={() =>
                  setTpl((p) => ({ ...p, rows: [...p.rows, newRow()] }))
                }
              >
                เพิ่มหัวข้อตรวจ
              </AddButton>
            </Section>

            {/* ---------- 4 ข้อมูลเพิ่มเติม ---------- */}
            <Section
              index={4}
              title="ข้อมูลเพิ่มเติม"
              note="กำหนดการระบุหมายเหตุและแนบรูปภาพเอกสาร"
            >
              <div className="grid gap-4 @xl:grid-cols-2">
                <Field id="tpl-remark" label="หมายเหตุ">
                  <AttachSelect
                    id="tpl-remark"
                    value={tpl.remark}
                    onChange={(v) => patch({ remark: v })}
                  />
                </Field>
                <Field id="tpl-photo" label="แนบรูปภาพ/เอกสาร">
                  <AttachSelect
                    id="tpl-photo"
                    value={tpl.photo}
                    onChange={(v) => patch({ photo: v })}
                  />
                </Field>
              </div>
            </Section>

            {/* ---------- 5 ตัวเลือกการตัดสิน ----------
                 ต้องเหลืออย่างน้อยหนึ่งปุ่ม ไม่งั้นผู้ตรวจไม่มีอะไรให้กด */}
            <Section
              index={5}
              title="ตัวเลือกการตัดสิน"
              note="กำหนดตัวเลือกการตัดสิน"
            >
              <div className="flex flex-wrap gap-2">
                {VERDICT_OPTION_KEYS.map((k) => (
                  <CheckChip
                    key={k}
                    id={`verdict-${k}`}
                    label={VERDICT_OPTION_LABEL[k]}
                    checked={tpl.verdicts.includes(k)}
                    onChange={(on) => {
                      if (!on && tpl.verdicts.length === 1) return;
                      patch({
                        verdicts: on
                          ? VERDICT_OPTION_KEYS.filter(
                              (x) => x === k || tpl.verdicts.includes(x)
                            )
                          : tpl.verdicts.filter((x) => x !== k),
                      });
                    }}
                  />
                ))}
              </div>
            </Section>

            {/* ---------- 6 ผลตรวจที่ไม่ผ่าน ----------
                 สวิตช์คือ "มีขั้นนี้ไหม" — ปิดคือไม่ผ่านแล้วจบที่ผลตรวจ ไม่ต้องเลือก
                 ว่าจะจัดการของยังไง ตัวเลือกเป็นของฟอร์มนี้ พิมพ์ตั้งชื่อเองได้ */}
            <Section
              index={6}
              title="ผลตรวจที่ไม่ผ่าน"
              note={
                tpl.requireDisposition
                  ? "ผู้ตรวจต้องเลือกว่าจะจัดการสินค้าที่ไม่ผ่านอย่างไร"
                  : "กำหนดตัวเลือกการจัดการสินค้าที่ไม่ผ่าน"
              }
              action={
                <SwitchLabel
                  checked={tpl.requireDisposition}
                  onCheckedChange={(on) =>
                    patch({
                      requireDisposition: on,
                      dispositions:
                        on && tpl.dispositions.length === 0
                          ? ["repack", "accept", "return"]
                          : tpl.dispositions,
                    })
                  }
                >
                  บังคับเลือกเมื่อมีข้อไม่ผ่าน
                </SwitchLabel>
              }
            >
              {tpl.requireDisposition && (
                <>
                  <ul className="space-y-3">
                    {tpl.dispositions.map((d, i) => (
                      <RowCard
                        key={`${i}-${d}`}
                        label={`ตัวเลือกที่ ${i + 1}`}
                        total={tpl.dispositions.length}
                        onMove={(dir) =>
                          patch({ dispositions: move(tpl.dispositions, i, dir) })
                        }
                        onRemove={() =>
                          patch({
                            dispositions: tpl.dispositions.filter(
                              (_, j) => j !== i
                            ),
                          })
                        }
                      >
                        <Input
                          aria-label={`ตัวเลือกที่ ${i + 1}`}
                          className="w-full bg-card @xl:w-80"
                          placeholder="ระบุตัวเลือก เช่น ส่งคืน"
                          defaultValue={dispositionOf(d)?.label ?? d}
                          onBlur={(e) => {
                            const v = e.target.value.trim();
                            if (v === (dispositionOf(d)?.label ?? d)) return;
                            patch({
                              dispositions: tpl.dispositions.map((x, j) =>
                                j === i ? v : x
                              ),
                            });
                          }}
                        />
                      </RowCard>
                    ))}
                  </ul>
                  <AddButton
                    onClick={() =>
                      patch({ dispositions: [...tpl.dispositions, ""] })
                    }
                  >
                    เพิ่มตัวเลือก
                  </AddButton>
                </>
              )}
            </Section>

            {/* ---------- 7 รอบเวลาทำงาน ----------
                 อยู่ท้ายสุดเพราะฟอร์มส่วนใหญ่ไม่ได้เปิด — ฟอร์มที่เกิดจากใบรับของ
                 ไม่มีรอบเวลา เปิดมาเจอกะสี่ช่องก่อนจะงงว่าต้องกรอกไหม */}
            <Section
              index={7}
              title="เปิดใบตามรอบเวลาทำงาน"
              note="ระบบจะขึ้นข้อมูลให้ทำเอกสารตามช่วงเวลาการทำงานที่ตั้งไว้ ไม่รวมวันหยุดทำงานและวันหยุดนักขัตฤกษ์ วันไหนไม่มีข้อมูล ระบบจะขึ้นว่ายังไม่มีใครทำ จึงดูเป็นปฏิทินทั้งเดือนได้"
              action={
                <SwitchLabel
                  checked={tpl.schedule.recurring}
                  onCheckedChange={(on) =>
                    patch({
                      schedule: on
                        ? {
                            recurring: true,
                            allDay: false,
                            slots:
                              tpl.schedule.slots.length > 0
                                ? tpl.schedule.slots
                                : [newShift("08:30", "12:00")],
                          }
                        : // ปิดแล้วเก็บช่วงที่ตั้งไว้ เปิดใหม่จะได้ไม่ต้องตั้งซ้ำ
                          { ...DEFAULT_SCHEDULE, slots: tpl.schedule.slots },
                    })
                  }
                >
                  ดูเป็นปฏิทินทั้งเดือนได้
                </SwitchLabel>
              }
            >
              {tpl.schedule.recurring && (
                <ScheduleEditor schedule={tpl.schedule} onChange={patchSchedule} />
              )}
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
              {tpl.rows.map((row, i) =>
                row.kind === "system" ? (
                  <PreviewSystemRow
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
                ) : (
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
                )
              )}

              {tpl.rows.length === 0 && (
                <p className="rounded-lg border border-dashed border-border px-6 py-12 text-center text-sm text-muted-foreground">
                  ยังไม่มีหัวข้อตรวจ ใบตรวจจึงยังว่างเปล่า
                </p>
              )}
            </div>

            {tpl.requireDisposition && dispositions.length > 0 && !plain && (
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
                  {dispositions.map((id) => (
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
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
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
     หนึ่งช่วงเวลา = หนึ่งใบต่อวัน ลากจัดลำดับได้ ลบได้ทีละช่วง
     ช่วงที่เวลาจบน้อยกว่าเวลาเริ่มคือข้ามเที่ยงคืน อ่านจากเวลาเอง ไม่ให้ติ๊กบอก

     ช่องเลือกวันไม่มี เพราะวันทำงานไม่ใช่เรื่องของฟอร์ม — อ่านจาก Holiday List
     ของบริษัท ตั้งซ้ำรายฟอร์มมีแต่จะตอบไม่ตรงกัน */
function ScheduleEditor({
  schedule,
  onChange,
}: {
  schedule: QiSchedule;
  onChange: (next: Partial<QiSchedule>) => void;
}) {
  const slots = schedule.slots;
  const patchSlot = (id: string, p: Partial<{ from: string; to: string }>) =>
    onChange({ slots: slots.map((s) => (s.id === id ? { ...s, ...p } : s)) });

  return (
    <>
      <ul className="space-y-3">
        {slots.map((sl, i) => (
          <RowCard
            key={sl.id}
            label={`ช่วงที่ ${i + 1}`}
            total={slots.length}
            onMove={(dir) => onChange({ slots: move(slots, i, dir) })}
            onRemove={() => onChange({ slots: slots.filter((x) => x.id !== sl.id) })}
          >
            <div className="flex flex-wrap items-center gap-3">
              <TimeField
                aria-label={`เวลาเริ่มช่วงที่ ${i + 1}`}
                className="w-36"
                value={sl.from}
                onValueChange={(v) => patchSlot(sl.id, { from: v })}
              />
              <span className="text-sm">ถึง</span>
              <TimeField
                aria-label={`เวลาสิ้นสุดช่วงที่ ${i + 1}`}
                className="w-36"
                value={sl.to}
                onValueChange={(v) => patchSlot(sl.id, { to: v })}
              />
              {shiftOvernight(sl) && (
                <Badge appearance="soft" tone="neutral">
                  ข้ามเที่ยงคืน
                </Badge>
              )}
            </div>
          </RowCard>
        ))}
      </ul>
      <AddButton
        onClick={() => onChange({ allDay: false, slots: [...slots, newShift()] })}
      >
        เพิ่มช่วงเวลา
      </AddButton>
    </>
  );
}

/* ---------- ส่วนหัวเอกสาร ----------
     ตารางเดียวกับหัวข้อตรวจ แต่ตั้งแค่สามอย่าง — เอามาจากไหน อะไร บังคับไหม
     ดึงจากระบบเลือกได้จากรายการ ส่วนข้อความพิมพ์ชื่อช่องเอง

     จอแคบเรียงเป็นการ์ดทีละช่อง หัวตารางซ่อน ป้ายย้ายไปอยู่ในช่องแทน */
function HeaderFieldsTable({
  fields,
  onChange,
}: {
  fields: DocField[];
  onChange: (next: DocField[]) => void;
}) {
  const patchField = (id: string, p: Partial<DocField>) =>
    onChange(fields.map((f) => (f.id === id ? { ...f, ...p } : f)));
  const grid =
    "@3xl:grid @3xl:grid-cols-[12rem_minmax(0,1fr)_6rem_5.5rem] @3xl:items-center @3xl:gap-4";

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div
          className={cn(
            "hidden border-b border-border px-4 py-3 text-sm text-muted-foreground",
            grid
          )}
        >
          <span>ประเภทข้อมูล</span>
          <span>ข้อมูล</span>
          <span className="text-center">บังคับกรอก</span>
          <span />
        </div>
        <ul>
          {fields.map((f, i) => (
            <li
              key={f.id}
              {...{ [DRAG_ITEM_ATTR]: "" }}
              className={cn(
                "flex flex-col gap-3 bg-card px-4 py-3",
                i > 0 && "border-t border-border",
                grid
              )}
            >
              <div className="space-y-1.5">
                <Label htmlFor={`hd-kind-${f.id}`} className="@3xl:sr-only">
                  ประเภทข้อมูล
                </Label>
                <Select
                  value={f.kind}
                  onValueChange={(v) =>
                    patchField(f.id, { kind: v as DocField["kind"], source: "", label: "" })
                  }
                >
                  <SelectTrigger id={`hd-kind-${f.id}`} className="w-full bg-card">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="system">ดึงจากระบบ</SelectItem>
                    <SelectItem value="text">ข้อความ</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor={`hd-data-${f.id}`} className="@3xl:sr-only">
                  ข้อมูล
                </Label>
                {f.kind === "system" ? (
                  <Select
                    value={f.source}
                    onValueChange={(v) => patchField(f.id, { source: v as SourceId })}
                  >
                    <SelectTrigger id={`hd-data-${f.id}`} className="w-full bg-card">
                      <SelectValue placeholder="เลือกข้อมูล" />
                    </SelectTrigger>
                    <SelectContent>
                      {HEADER_SOURCES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {SOURCE[s].label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id={`hd-data-${f.id}`}
                    className="bg-card"
                    placeholder="ระบุชื่อช่อง เช่น เลขที่ล็อต"
                    value={f.label}
                    onChange={(e) => patchField(f.id, { label: e.target.value })}
                  />
                )}
              </div>

              <div className="flex items-center justify-between gap-3 @3xl:contents">
                <label className="flex items-center gap-2 text-sm @3xl:justify-center">
                  <Checkbox
                    checked={f.required}
                    aria-label="บังคับกรอก"
                    onCheckedChange={(v) => patchField(f.id, { required: v === true })}
                  />
                  <span className="@3xl:sr-only">บังคับกรอก</span>
                </label>
                <div className="flex items-center justify-end gap-1">
                  <DragHandle
                    label={`หัวเอกสารช่องที่ ${i + 1}`}
                    disabled={fields.length < 2}
                    onMove={(dir) => onChange(move(fields, i, dir))}
                  />
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`ลบหัวเอกสารช่องที่ ${i + 1}`}
                    onClick={() => onChange(fields.filter((x) => x.id !== f.id))}
                  >
                    <Trash2Icon />
                  </Button>
                </div>
              </div>
            </li>
          ))}
          {fields.length === 0 && (
            <li className="px-4 py-10 text-center">
              <p className="font-medium">ไม่มีข้อมูล</p>
              <p className="mt-1 text-sm text-muted-foreground">กรุณาเพิ่มหัวเอกสาร</p>
            </li>
          )}
        </ul>
      </div>
      <AddButton onClick={() => onChange([...fields, newDocField()])}>
        เพิ่มหัวเอกสาร
      </AddButton>
    </>
  );
}

/** สลับของในรายการขึ้น/ลงหนึ่งช่อง — ชนขอบแล้วคืนของเดิม */
function move<T>(list: T[], i: number, dir: -1 | 1): T[] {
  const j = i + dir;
  if (j < 0 || j >= list.length) return list;
  const next = [...list];
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}

/** ป้ายของการเดินเอกสารต่อ — ใช้คำเดียวกับ Stock Settings มีชื่อภาษาอังกฤษต่อท้าย
 *  เพราะคนที่ตั้งค่านี้ต้องไปตั้งคู่กันใน ERPNext ด้วย */
const FLOW_LABEL: Record<GuardAction | "off", string> = {
  warn: "เตือนแต่ไปต่อได้ - Warn",
  stop: "ห้ามผ่าน - Stop",
  off: "ไม่บังคับตรวจ",
};

/* ---------- การ์ดหนึ่งแถว ----------
     ใช้ร่วมกันระหว่างตัวเลือกของที่ไม่ผ่านกับช่วงเวลา — ป้ายซ้าย ช่องกลาง
     ปุ่มลากกับลบชิดขวา จอแคบป้ายกับปุ่มอยู่บรรทัดบน ช่องลงบรรทัดล่าง */
function RowCard({
  label,
  total,
  onMove,
  onRemove,
  children,
}: {
  label: string;
  total: number;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
  children: React.ReactNode;
}) {
  return (
    <li
      {...{ [DRAG_ITEM_ATTR]: "" }}
      className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-xl border border-border bg-card px-4 py-3 @xl:px-5"
    >
      <span className="order-1 shrink-0 text-sm font-medium">{label}</span>
      <div className="order-3 w-full min-w-0 @xl:order-2 @xl:w-auto @xl:flex-1">
        {children}
      </div>
      <div className="order-2 ml-auto flex shrink-0 items-center gap-1 @xl:order-3">
        <DragHandle label={label} disabled={total < 2} onMove={onMove} />
        <Button variant="ghost" size="icon-sm" aria-label={`ลบ${label}`} onClick={onRemove}>
          <Trash2Icon />
        </Button>
      </div>
    </li>
  );
}

function AddButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-3 flex justify-center">
      <Button variant="outline-primary" size="sm" onClick={onClick}>
        <PlusIcon />
        {children}
      </Button>
    </div>
  );
}

/** หมายเหตุกับแนบรูปใช้ตัวเลือกชุดเดียวกัน — ผู้ตรวจต้องใส่ไหม */
function AttachSelect({
  id,
  value,
  onChange,
}: {
  id: string;
  value: PhotoMode;
  onChange: (v: PhotoMode) => void;
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as PhotoMode)}>
      <SelectTrigger id={id} className="w-full bg-card">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {PHOTO_KEYS.map((k) => (
          <SelectItem key={k} value={k}>
            {PHOTO_LABEL[k]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function Field({
  id,
  label,
  optional,
  children,
}: {
  id: string;
  label: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0 space-y-1.5">
      <Label htmlFor={id}>
        {label}
        {optional && " "}
        {optional && (
          <span className="font-normal text-muted-foreground">(ไม่บังคับ)</span>
        )}
      </Label>
      {children}
    </div>
  );
}

function SwitchLabel({
  checked,
  onCheckedChange,
  children,
}: {
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="flex shrink-0 items-center gap-2 text-sm">
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
      {children}
    </label>
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
          : /* ค่าที่ถือว่าผ่านมีได้หลายค่า — ตรงค่าใดค่าหนึ่งก็ผ่าน
               ของจริงใน ERPNext เป็น acceptance_formula ที่เขียนว่า
               reading_value in (...) ไม่ใช่เทียบ value ตรง ๆ */
            passValues(row.value).includes(st.text.trim())
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
/** ช่องเลือกจากรายการของระบบ — ใช้ทั้งหัวเอกสารและหัวข้อที่ดึงจากระบบ */
function SourceSelect({
  id,
  source,
}: {
  id: string;
  source: SourceId | "";
}) {
  const pool = source === "" ? [] : sourcePool(source);
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

/* ------------------------------------------------------------------
   หนึ่งหัวข้อที่ดึงจากระบบในใบตรวจ

   ไม่มีเกณฑ์ให้ระบบตัดสิน ผู้ตรวจเลือกจากรายการแล้วชี้ขาดเอง จึงมีแต่ดรอปดาวน์
   กับปุ่มผ่าน/ไม่ผ่าน ไม่มีช่องคีย์ตัวเลขและไม่มีแถบบอกว่าระบบตัดสินให้แล้ว
------------------------------------------------------------------ */

function PreviewSystemRow({
  index,
  row,
  plain,
  verdict = "passFail",
  state,
  onChange,
}: {
  index: number;
  row: QiRow;
  plain?: boolean;
  verdict?: VerdictWords;
  state: RoundState;
  onChange: (next: Partial<RoundState>) => void;
}) {
  const words = VERDICT[plain ? "passFail" : verdict];
  const title = rowTitle(row) || "ยังไม่ได้เลือกหัวข้อ";

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="font-medium">
        {index}. {title}
      </p>
      {row.criteria !== "" && !plain && (
        <p className="mt-0.5 text-sm text-muted-foreground">
          เกณฑ์: {row.criteria}
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-end gap-4">
        <div className="min-w-56 space-y-1.5">
          <Label htmlFor={`pv-sys-${row.id}`} className="text-sm">
            {title}
          </Label>
          <SourceSelect id={`pv-sys-${row.id}`} source={row.source ?? ""} />
        </div>

        <div className="flex gap-2">
          {(["pass", "fail"] as const).map((k) => (
            <CheckChip
              key={k}
              id={`pv-sys-${row.id}-${k}`}
              label={k === "pass" ? words.pass : words.fail}
              checked={state.manual === k}
              onChange={(v) => onChange({ manual: v ? k : null })}
            />
          ))}
        </div>
      </div>

      {!plain && (
        <FieldNote custom={!!row.source && SOURCE[row.source].custom}>
          {row.source ? SOURCE[row.source].store : "ยังไม่ได้เลือกแหล่งข้อมูล"}
        </FieldNote>
      )}
    </div>
  );
}

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
              {/* ตั้งค่าที่ถือว่าผ่านไว้หลายค่า = ให้เลือก ไม่ใช่ให้พิมพ์
                  พิมพ์เองแล้วสะกดต่างนิดเดียวก็ไม่ตรงกับที่ตั้งไว้ แล้วจะตก
                  ทั้งที่ของถูกต้อง */}
              {passValues(row.value).length > 1 ? (
                <Select
                  value={state.text}
                  onValueChange={(v) => onChange({ text: v })}
                >
                  <SelectTrigger
                    id={`preview-${row.id}-${i}`}
                    className="w-full bg-card"
                  >
                    <SelectValue placeholder="เลือกค่าที่ตรวจได้" />
                  </SelectTrigger>
                  <SelectContent>
                    {passValues(row.value).map((o) => (
                      <SelectItem key={o} value={o}>
                        {o}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id={`preview-${row.id}-${i}`}
                  className="bg-card"
                  placeholder={row.value || "ระบุค่าที่ตรวจได้"}
                  value={state.text}
                  onChange={(e) => onChange({ text: e.target.value })}
                />
              )}
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
            {index !== undefined && `${index}. `}
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
