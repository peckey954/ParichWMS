"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
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
import { Switch } from "@peckey954/ui/components/ui/switch";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@peckey954/ui/components/ui/tabs";
import { cn } from "@peckey954/ui/lib/utils";
import { toast } from "sonner";
import { CheckChip } from "@/components/check-chip";
import { ChipGroup } from "@/components/chip-group";
import { TimeField } from "@/components/time-field";
import { MultiSelectChips } from "@/components/multi-select-chips";
import { DRAG_ITEM_ATTR, DragHandle } from "@/components/drag-handle";
import { SearchSelect } from "@/components/qc/search-select";
import { TemplateForm } from "@/components/qc/template-form";
import {
  CheckTable,
  RowEditDialog,
  criteriaProblems,
} from "@/components/qc/check-table";
import {
  DEFAULT_SCHEDULE,
  DEFAULT_GUARD,
  type GuardAction,
  REF_MENU,
  refMenusFor,
  type RefMenu,
  newShift,
  shiftOvernight,
  newRow,
  templateOf,
  OPERATION_POOL,
  PHOTO_KEYS,
  PHOTO_LABEL,
  type PhotoMode,
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
  addReportType,
  DISPOSITIONS,
  dispositionChoices,
  showsDispositions,
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
  // หัวข้อที่กำลังเพิ่ม — ยังไม่อยู่ในตาราง จนกว่าจะกดบันทึกในกล่อง
  const [adding, setAdding] = React.useState<QiRow | null>(null);
  /* ค่าระบบ — ของจริงอ่านจาก Stock Settings ตัวเดียวทั้งระบบ ที่นี่ไม่มีหลังบ้าน
     จึงอ่านค่าตั้งต้นมาโชว์ ให้เห็นว่า "ตามค่าระบบ" ตอนนี้แปลว่าอะไร */
  const guard = DEFAULT_GUARD;

  const patch = (next: Partial<QiTemplate>) => setTpl((p) => ({ ...p, ...next }));
  const patchSchedule = (next: Partial<QiSchedule>) =>
    setTpl((p) => ({ ...p, schedule: { ...p.schedule, ...next } }));
  const stage = stageOf(tpl);
  const choices = dispositionChoices(tpl);
  // เลขหัวข้อเดินตามที่โชว์จริง — ผลตรวจที่ไม่ผ่านซ่อนได้ เลขที่เหลือต้องไม่ข้าม
  const order = [
    "info",
    "header",
    "checks",
    "link",
    ...(showsDispositions(tpl) ? ["dispose"] : []),
    "verdict",
    "extra",
    "schedule",
  ];
  const no = (key: string) => order.indexOf(key) + 1;

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
    // บังคับเลือกผลตรวจแต่ไม่มีตัวเลือก — ผู้ตรวจจะติดบันทึกใบที่ไม่ผ่านไม่ได้เลย
    if (tpl.linkDocs && tpl.onRejected === "dispose" && choices.length === 0) {
      toast.error("ยังไม่ได้เลือกตัวเลือกผลตรวจที่ไม่ผ่าน", {
        description: "ตั้งให้บังคับเลือกผลตรวจไว้ ต้องเปิดอย่างน้อยหนึ่งตัวเลือก",
      });
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
            {/* ---------- ข้อมูลรายงาน ---------- */}
            <Section
              index={no("info")}
              title="ข้อมูลรายงาน"
              note="กำหนดข้อมูลรายงาน"
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
                    // ประเภทที่ปิดไว้เลือกใหม่ไม่ได้ แต่ตัวที่รายงานนี้ใช้อยู่ต้องยังเห็น
                    options={REPORT_TYPES.filter(
                      (t) => t.active || t.id === tpl.reportType
                    ).map((t) => ({
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

              </div>
            </Section>

            {/* ---------- 2 ส่วนหัวเอกสาร ----------
                 ปิดแล้วช่องที่ตั้งไว้ยังเก็บอยู่ เปิดกลับมาไม่ต้องตั้งใหม่ */}
            <Section
              index={no("header")}
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
              index={no("checks")}
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
              {/* เปิดกล่องก่อน กรอกครบแล้วกดบันทึกถึงขึ้นในตาราง — ไม่ใส่แถวว่าง
                  ลงตารางไว้ก่อน ซึ่งเป็นแถวที่ลืมกรอกแล้วค้างเป็นหัวข้อไร้ชื่อ */}
              <AddButton onClick={() => setAdding(newRow())}>
                เพิ่มหัวข้อตรวจ
              </AddButton>
              {adding && (
                <RowEditDialog
                  row={adding}
                  onSave={(row) =>
                    setTpl((p) => ({ ...p, rows: [...p.rows, row] }))
                  }
                  onClose={() => setAdding(null)}
                />
              )}
            </Section>

            {/* ---------- เชื่อมโยงเอกสาร ----------
                 อยู่หลังหัวข้อตรวจ เพราะเป็นเรื่องว่าใบนี้ผูกกับการรับ–จ่ายของไหม
                 ไม่ใช่เรื่องว่าตรวจอะไร รายงานใหม่เริ่มที่ปิด เปิดเองเมื่อใช่
                 ปิดแล้วซ่อนทั้งแถว ไม่ใช่ปล่อยให้เห็นสี่ช่องที่กรอกแล้วไม่มีผล */}
            <Section
              index={no("link")}
              title="เชื่อมโยงเอกสาร"
              note="กำหนดช่วงการเชื่อมโยงกับเอกสารในระบบ"
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
                    : "ไม่มีการเชื่อมโยงกับเอกสารในระบบ"}
                </SwitchLabel>
              }
            >
              {tpl.linkDocs && (
                <div className="grid gap-4 @xl:grid-cols-2 @5xl:grid-cols-4">
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
                          patch({ onNotSubmitted: v as GuardAction })
                        }
                      >
                        <SelectTrigger id="tpl-sub" className="w-full bg-card">
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

                    <Field id="tpl-rej" label="ตรวจไม่ผ่านแล้วจะเดินเอกสารต่อ">
                      <Select
                        value={
                          tpl.onRejected === "system"
                            ? guard.onRejected
                            : tpl.onRejected
                        }
                        onValueChange={(v) =>
                          patch({ onRejected: v as RejectFlow })
                        }
                      >
                        <SelectTrigger id="tpl-rej" className="w-full bg-card">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(["warn", "stop", "off", "dispose"] as const).map((k) => (
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
                                  </div>
              )}
            </Section>

            {/* ---------- ผลตรวจที่ไม่ผ่าน ----------
                 ขึ้นสองกรณี — ผูกเอกสารแล้วตั้งให้บังคับเลือกผลตรวจ (ยอดเข้าคลัง
                 ขึ้นกับที่เลือก) กับไม่ผูกเอกสาร (เลือกไว้เป็นข้อมูล ไม่บังคับ)
                 ผูกเอกสารแล้วตั้ง Warn / Stop / ไม่บังคับตรวจ เอกสารจัดการเอง
                 ไม่มีขั้นนี้ จึงซ่อนทั้งก้อน */}
            {showsDispositions(tpl) && (
              <Section
                index={no("dispose")}
                title="ผลตรวจที่ไม่ผ่าน"
                note={`กำหนดตัวเลือกการจัดการสินค้าที่ไม่ผ่าน ถ้าเลือกตัวเลือกเดียว เมื่อไม่ผ่านข้อมูลจะเลือกให้อัตโนมัติ${
                  tpl.linkDocs ? "" : " (ไม่บังคับ)"
                }`}
              >
                <div className="flex flex-wrap gap-2">
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
                {/* บังคับเลือกแต่ไม่ได้เปิดตัวเลือกไว้สักตัว ผู้ตรวจจะติดบันทึกไม่ได้ */}
                {tpl.linkDocs && dispositionChoices(tpl).length === 0 && (
                  <p className="mt-2 text-sm text-danger-strong">
                    เลือกอย่างน้อยหนึ่งตัวเลือก — ตั้งให้บังคับเลือกผลตรวจไว้ที่การเชื่อมโยงเอกสาร
                  </p>
                )}
              </Section>
            )}

            {/* ---------- ตัวเลือกการตัดสิน ----------
                 เลือกชุดเดียว ไม่ใช่ติ๊กทีละปุ่ม — ผ่านกับไม่ผ่านต้องมีเสมอ
                 ต่างกันแค่มี "ไม่มี" ให้ข้อที่ไม่เกี่ยวกับของล็อตนั้นไหม */}
            <Section
              index={no("verdict")}
              title="ตัวเลือกการตัดสิน"
              note="กำหนดตัวเลือกการตัดสิน"
            >
              <ChipGroup
                label="ตัวเลือกการตัดสิน"
                value={tpl.verdicts.includes("na") ? "withNa" : "passFail"}
                onChange={(v) =>
                  patch({
                    verdicts: v === "withNa" ? ["pass", "fail", "na"] : ["pass", "fail"],
                  })
                }
                options={[
                  { id: "passFail" as const, label: "ผ่าน/ไม่ผ่าน" },
                  { id: "withNa" as const, label: "ผ่าน/ไม่ผ่าน/ไม่มี" },
                ]}
              />
            </Section>

            {/* ---------- 4 ข้อมูลเพิ่มเติม ---------- */}
            <Section
              index={no("extra")}
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

            {/* ---------- 7 รอบเวลาทำงาน ----------
                 อยู่ท้ายสุดเพราะฟอร์มส่วนใหญ่ไม่ได้เปิด — ฟอร์มที่เกิดจากใบรับของ
                 ไม่มีรอบเวลา เปิดมาเจอกะสี่ช่องก่อนจะงงว่าต้องกรอกไหม */}
            <Section
              index={no("schedule")}
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

          {/* ---------- ตัวอย่างใบตรวจ ----------
               วาดจากที่ตั้งไว้ในแท็บแรกสด ๆ ด้วยตัวเดียวกับใบตรวจจริงในหน้าเมนู
               สิ่งที่เห็นตรงนี้คือสิ่งที่ผู้ตรวจจะเจอ ไม่ใช่ภาพจำลองอีกชุด */}
          <TabsContent value="preview" className="mt-6">
            <TemplateForm
              tpl={tpl}
              title={`ใบ${tpl.name || "ยังไม่ได้ตั้งชื่อรายงาน"} ${tpl.linkDocs ? "POXXXXXXXX" : "QCXXXXXXXX"}`}
            />
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
type RejectFlow = Exclude<QiTemplate["onRejected"], "system">;

const FLOW_LABEL: Record<RejectFlow, string> = {
  warn: "เตือนแต่ไปต่อได้ - Warn",
  stop: "ห้ามผ่าน - Stop",
  off: "ไม่บังคับตรวจ",
  dispose: `บังคับเลือกผลตรวจ ${DISPOSITIONS.map((d) => d.label).join(", ")}`,
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
