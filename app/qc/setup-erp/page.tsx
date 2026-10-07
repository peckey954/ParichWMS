"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronRightIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@peckey954/ui/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@peckey954/ui/components/ui/dialog";
import { Input } from "@peckey954/ui/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@peckey954/ui/components/ui/input-group";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@peckey954/ui/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@peckey954/ui/components/ui/tabs";
import { cn } from "@peckey954/ui/lib/utils";
import { toast } from "sonner";
import { ParamRegistryTable } from "@/components/qc/param-registry";
import { ROW_HOVER_NAV } from "@/components/stock/doc-parts";
import {
  DEFAULT_GUARD,
  GUARD_LABEL,
  INSPECTION_TYPE_LABEL,
  INSPECTION_TYPE_VALUE,
  INSPECTION_TYPE_LABEL as TYPE_LABEL,
  QI_PARAMETERS,
  QI_TEMPLATES,
  DISPOSITIONS,
  QI_GROUPS,
  REF_DOC_LABEL,
  addGroup,
  addDisposition,
  addTemplate,
  dispositionUsedBy,
  groupUsedBy,
  removeDisposition,
  removeGroup,
  renameGroup,
  hrefOf,
  setTemplateActive,
  updateDisposition,
  type Disposition,
  type GuardAction,
  type InspectionType,
  type StockGuard,
} from "@/lib/qc-erp";

/* ------------------------------------------------------------------
   Setup QC — หน้าตั้งค่าที่ปรับให้ลง ERPNext ได้ตรง ๆ

   คนละหน้ากับ "ตั้งค่ารายงาน QC" (/qc/setup) ที่ยังอยู่เหมือนเดิม
   เก็บของเดิมไว้เพราะมันคือฟอร์มที่โรงงานใช้จริงตอนนี้ ส่วนหน้านี้คือภาพว่า
   ถ้าย้ายไป ERPNext แล้วหน้าตั้งค่าจะเหลือหน้าตาแบบไหน

   สองแท็บ
     เทมเพลต      Quality Inspection Template — ฟอร์มหนึ่งใบ
     ตั้งค่าระบบ  Stock Settings + ทะเบียนหัวข้อตรวจ

   ทะเบียนหัวข้อตรวจ (Quality Inspection Parameter) ไม่ได้เป็นแท็บของตัวเอง
   เพราะ ERPNext เองก็ไม่ได้ให้เดินออกจากฟอร์มไปจัดทะเบียนก่อน — Link field
   ของ Frappe มีทั้งรายการที่มีอยู่ "Create a new …" และ "Advanced Search"
   อยู่ในดรอปดาวน์เดียวกัน เราจึงยกทั้งสามอย่างไปไว้ในช่องเลือกหัวข้อของหน้าเทมเพลต

   ตารางทะเบียนยังอยู่ท้ายแท็บตั้งค่าระบบ สำหรับงานดูแลข้อมูลที่นาน ๆ ทำที
   คือหาตัวซ้ำ ดูว่าอันไหนไม่มีใครใช้ และจัดกลุ่มย้อนหลัง
------------------------------------------------------------------ */

type TabId = "templates" | "system";

export default function SetupQcPage() {
  const [tab, setTab] = React.useState<TabId>("templates");
  const [query, setQuery] = React.useState("");
  const [guard, setGuard] = React.useState<StockGuard>(DEFAULT_GUARD);
  const [newTemplate, setNewTemplate] = React.useState(false);
  // ของที่สร้างใหม่ต่อท้ายอาเรย์ในโมดูล ไม่ได้อยู่ใน state — ต้องสั่งวาดใหม่เอง
  const [, bump] = React.useReducer((n: number) => n + 1, 0);

  const q = query.trim().toLowerCase();
  const templates = QI_TEMPLATES.filter(
    (t) =>
      !q ||
      t.name.toLowerCase().includes(q) ||
      t.code.toLowerCase().includes(q)
  );
  return (
    <main className="@container mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">ระบบ</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="text-primary">Setup QC</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mt-4">
        <h1 className="text-2xl font-semibold tracking-tight">Setup QC</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          ตั้งค่าการตรวจคุณภาพตามโครงของ ERPNext — ทุกช่องในหน้านี้มีที่อยู่จริงใน
          doctype ไม่ต้องดัดตอนขึ้นระบบ
        </p>
      </div>

      <WhatChanged />

      <Tabs
        value={tab}
        onValueChange={(v) => setTab(v as TabId)}
        className="mt-5"
      >
        <TabsList className="w-full">
          <TabsTrigger value="templates" className="flex-1">
            เทมเพลต ({QI_TEMPLATES.length})
          </TabsTrigger>
          <TabsTrigger value="system" className="flex-1">
            ตั้งค่าระบบ
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {tab === "templates" && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <InputGroup className="w-full max-w-sm bg-card">
            <InputGroupAddon align="inline-start">
              <SearchIcon />
            </InputGroupAddon>
            <InputGroupInput
              placeholder="ค้นหาชื่อฟอร์มหรือรหัส..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </InputGroup>
          <Button variant="outline-primary" onClick={() => setNewTemplate(true)}>
            <PlusIcon />
            สร้างเทมเพลต
          </Button>
        </div>
      )}

      {tab === "templates" && (
        <TemplateList templates={templates} onToggled={bump} />
      )}
      {tab === "system" && (
        <SystemSettings guard={guard} onChange={setGuard} onParamsChanged={bump} />
      )}

      {/* เมานต์เฉพาะตอนเปิด ช่องที่กรอกค้างไว้รอบก่อนจึงไม่ตามมาหลอกรอบถัดไป */}
      {newTemplate && (
        <NewTemplateDialog onClose={() => setNewTemplate(false)} />
      )}
    </main>
  );
}

/* ---------- สร้างเทมเพลตใหม่ ----------
     ถามแค่สามอย่างที่ตั้งทีหลังไม่ได้/ตั้งทีหลังแล้วเสียเวลา — ชื่อ รหัส
     และประเภทการตรวจ ที่เหลือไปตั้งในหน้าของมันซึ่งเห็นผลทันทีทุกช่อง
     ถามครบทุกช่องตั้งแต่กล่องนี้ = ฟอร์มยาวที่ยังไม่เห็นว่ากำลังตั้งอะไรอยู่ */
function NewTemplateDialog({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [code, setCode] = React.useState("");
  const [type, setType] = React.useState<InspectionType>("incoming");

  const create = () => {
    if (name.trim() === "") {
      toast.error("กรุณาตั้งชื่อฟอร์ม");
      return;
    }
    const t = addTemplate({
      name: name.trim(),
      code: code.trim() || "ยังไม่มีรหัส",
      inspectionType: type,
    });
    onClose();
    // พาไปตั้งค่าต่อเลย สร้างเสร็จแล้วเด้งกลับมาหน้ารายการคือให้หาเองอีกรอบ
    router.push(`/qc/setup-erp/${t.id}`);
  };

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>สร้างเทมเพลต</DialogTitle>
          <DialogDescription>
            ตั้งสามอย่างนี้ก่อน แล้วไปใส่หัวข้อตรวจกับเกณฑ์ในหน้าถัดไป
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="tpl-name">ชื่อฟอร์ม</Label>
            <Input
              id="tpl-name"
              autoFocus
              className="bg-card"
              placeholder="เช่น ตรวจรับวัตถุดิบ"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <p className="font-mono text-xs text-muted-foreground">
              quality_inspection_template_name · ชื่อนี้คือ ID ของเอกสาร
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tpl-code">
              รหัสฟอร์ม{" "}
              <span className="font-normal text-muted-foreground">(ไม่บังคับ)</span>
            </Label>
            <Input
              id="tpl-code"
              className="bg-card"
              placeholder="เช่น FM-QC-01-02"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tpl-type">ประเภทการตรวจ</Label>
            <Select
              value={type}
              onValueChange={(v) => setType(v as InspectionType)}
            >
              <SelectTrigger id="tpl-type" className="w-full bg-card">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {/* โชว์ค่าจริงของ ERPNext คู่ชื่อไทยเหมือนหน้าตั้งค่าเทมเพลต
                    สามค่านี้ ERPNext กำหนดมาตายตัว เพิ่มเองไม่ได้ */}
                {(Object.keys(TYPE_LABEL) as InspectionType[]).map((t) => (
                  <SelectItem key={t} value={t}>
                    {TYPE_LABEL[t]} — {INSPECTION_TYPE_VALUE[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="font-mono text-xs text-muted-foreground">
              inspection_type · เป็นตัวกำหนดว่าเลือกเอกสารอ้างอิงอะไรได้บ้าง
            </p>
          </div>
        </div>

        <DialogFooter className="grid grid-cols-2 gap-3">
          <Button variant="outline-primary" onClick={onClose}>
            ยกเลิก
          </Button>
          <Button onClick={create}>สร้างแล้วไปตั้งค่า</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------- ต่างจากของเดิมยังไง ----------
     หุบไว้ ไม่ใช่กางค้าง — คนที่เข้ามาตั้งค่าจริงอ่านรอบเดียวก็พอ
     แต่ต้องหาเจอตอนสงสัยว่าทำไมช่องที่เคยมีหายไป */
function WhatChanged() {
  return (
    <Collapsible className="mt-4 rounded-xl border border-border bg-card">
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="group flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
        >
          <span className="min-w-0">
            <span className="block font-medium">
              ต่างจาก “ตั้งค่ารายงาน QC” เดิมยังไง
            </span>
            <span className="block text-sm text-muted-foreground">
              ปรับ 5 · เพิ่ม 4 · ย้ายออก 3
            </span>
          </span>
          <ChevronRightIcon className="size-5 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-90" />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="grid gap-4 border-t border-border px-4 py-4 @2xl:grid-cols-3">
        <ChangeGroup
          title="ปรับ"
          tone="brand"
          items={[
            "ชื่อหัวข้อตรวจมาจากทะเบียนกลาง พิมพ์สร้างใหม่ได้ แต่ไม่ใช่ข้อความลอยในฟอร์ม",
            "หนึ่งหัวข้อมีเกณฑ์เดียว — หลายช่องที่คำนวณรวมกันใช้สูตรแทน",
            "หัวข้อย่อยซ้อนชั้นเปลี่ยนเป็นกลุ่มชั้นเดียว",
            "ผ่าน/ไม่ผ่านอย่างเดียว ไม่มีให้ตั้งคำว่าปกติ/ผิดปกติรายฟอร์ม",
            "ตรวจซ้ำในข้อเดียวได้ไม่เกิน 10 ครั้ง ตามเพดานของ ERPNext",
          ]}
        />
        <ChangeGroup
          title="เพิ่ม"
          tone="success"
          items={[
            "ประเภทการตรวจ — รับเข้า / ส่งออก / ระหว่างผลิต (ERPNext บังคับ)",
            "เอกสารที่ใบตรวจอ้างอิง เช่น ใบรับของ ใบส่งของ ใบงานผลิต",
            "ผูกฟอร์มกับสินค้า + ติ๊กว่าต้องตรวจก่อนรับ",
            "ไม่ผ่านแล้วให้ระบบห้ามผ่านหรือแค่เตือน",
          ]}
        />
        <ChangeGroup
          title="ย้ายออก"
          tone="neutral"
          items={[
            "รอบเวลา/กะ และปฏิทิน — ไปเป็นตารางการตรวจแยก",
            "ตารางที่ผู้ตรวจเพิ่มแถวเอง เช่นทะเบียน COA",
            "ช่องหัวเอกสารที่ตั้งเองได้ — หัวใบของ ERPNext ตายตัว",
          ]}
        />
      </CollapsibleContent>
    </Collapsible>
  );
}

function ChangeGroup({
  title,
  tone,
  items,
}: {
  title: string;
  tone: "brand" | "success" | "neutral";
  items: string[];
}) {
  return (
    <div>
      <Badge tone={tone} appearance="soft">
        {title} ({items.length})
      </Badge>
      <ul className="mt-2 space-y-1.5 text-sm">
        {items.map((t) => (
          <li key={t} className="flex gap-2">
            <span className="mt-2 size-1 shrink-0 rounded-full bg-muted-foreground" />
            <span className="text-muted-foreground">{t}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------- แท็บเทมเพลต ---------- */
function TemplateList({
  templates,
  onToggled,
}: {
  templates: typeof QI_TEMPLATES;
  onToggled: () => void;
}) {
  const router = useRouter();
  if (templates.length === 0) return <EmptyBox text="ไม่พบเทมเพลตที่ค้นหา" />;

  return (
    <>
      {/* จอแคบเป็นการ์ด — ตารางหกคอลัมน์บีบจนอ่านไม่ออกบนมือถือ */}
      <div className="mt-4 grid gap-3 @3xl:hidden">
        {templates.map((t) => (
          <Link
            key={t.id}
            href={hrefOf(t)}
            className="block rounded-lg border border-border bg-card p-4 active:bg-accent"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium">{t.name}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {t.code}
                </p>
              </div>
              <ChevronRightIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <Badge appearance="soft" tone="brand">
                {INSPECTION_TYPE_LABEL[t.inspectionType]}
              </Badge>
              {t.refDocs.map((d) => (
                <Badge key={d} appearance="outline" tone="neutral">
                  {REF_DOC_LABEL[d]}
                </Badge>
              ))}
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {t.editor ?? t.owner} · {t.updatedAt}
            </p>
            {/* สถานะเปิด/ปิดบนการ์ดเป็นป้ายอ่านอย่างเดียว ไม่ใช่สวิตช์ —
                ทั้งการ์ดเป็นลิงก์อยู่แล้ว มีสวิตช์ซ้อนข้างในจะกดโดนกันเอง */}
            <Badge
              appearance="soft"
              tone={t.active ? "success" : "neutral"}
              className="mt-2"
            >
              {t.active ? "เปิดใช้งาน" : "ปิดใช้งาน"}
            </Badge>
          </Link>
        ))}
      </div>

      {/* จอกว้างเป็นตาราง — คอลัมน์ "ผูกกับสินค้า" ต้องเทียบข้ามแถวได้
          เพราะฟอร์มที่ยังไม่ผูกสินค้าคือฟอร์มที่จะไม่มีวันถูกเรียกใช้ */}
      <div className="mt-4 hidden overflow-hidden rounded-xl border border-border bg-card @3xl:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-56">ชื่อฟอร์ม</TableHead>
              <TableHead className="min-w-28">ประเภทการตรวจ</TableHead>
              <TableHead className="min-w-32">เอกสารอ้างอิง</TableHead>
              <TableHead className="min-w-40">ผู้ทำรายการ</TableHead>
              <TableHead className="min-w-32">วันที่อัปเดตล่าสุด</TableHead>
              <TableHead className="min-w-32">การใช้งาน</TableHead>

            </TableRow>
          </TableHeader>
          <TableBody>
            {templates.map((t) => (
              // ทั้งแถวเป็นเป้ากด ไม่ใช่เฉพาะชื่อฟอร์ม — คนกวาดตาอ่านคอลัมน์ขวา
              // อยู่แล้วกดตรงนั้นเลย ต้องเลื่อนกลับมากดชื่อคือเป้าที่มองไม่เห็น
              <TableRow
                key={t.id}
                onClick={() => router.push(hrefOf(t))}
                className={cn("cursor-pointer", ROW_HOVER_NAV)}
              >
                <TableCell>
                  <span className="font-medium">{t.name}</span>
                  <span className="block text-sm text-muted-foreground">
                    {t.code}
                  </span>
                </TableCell>
                <TableCell>
                  <span>{INSPECTION_TYPE_LABEL[t.inspectionType]}</span>
                  <span className="block text-xs text-muted-foreground">
                    {INSPECTION_TYPE_VALUE[t.inspectionType]}
                  </span>
                </TableCell>
                <TableCell className="text-sm">
                  {t.refDocs.length > 0
                    ? t.refDocs.map((d) => REF_DOC_LABEL[d]).join(", ")
                    : "-"}
                </TableCell>
                <TableCell>
                  <span className="font-medium">{t.owner}</span>
                  {/* คนแก้ล่าสุดอยู่ใต้คนสร้าง ไม่ใช่คอลัมน์แยก — สองชื่อนี้
                      ส่วนใหญ่เป็นคนเดียวกัน แยกคอลัมน์ไปก็ว่างครึ่งตาราง */}
                  {t.editor && (
                    <span className="block text-sm text-muted-foreground">
                      แก้ไขล่าสุด: {t.editor}
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-sm tabular-nums">
                  {t.updatedAt}
                </TableCell>
                {/* กดสวิตช์แล้วต้องไม่เปิดหน้ารายละเอียดตามไปด้วย
                    ทั้งแถวเป็นเป้ากด สวิตช์จึงต้องกันคลิกไม่ให้ไหลขึ้นไป */}
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <label className="flex items-center gap-2 text-sm">
                    <Switch
                      checked={t.active}
                      onCheckedChange={(v) => {
                        setTemplateActive(t.id, v);
                        onToggled();
                      }}
                    />
                    {t.active ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                  </label>
                </TableCell>

              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}

/* ---------- แท็บตั้งค่าระบบ ---------- */
function SystemSettings({
  guard,
  onChange,
  onParamsChanged,
}: {
  guard: StockGuard;
  onChange: (next: StockGuard) => void;
  onParamsChanged: () => void;
}) {
  return (
    <div className="mt-4 space-y-4">
      <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
        <h2 className="font-semibold">การบังคับใช้กับการรับ–จ่ายของ</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          เป็นค่าของทั้งระบบ ไม่ใช่รายฟอร์มหรือรายวัตถุดิบ — อยากให้บางตัวห้ามผ่าน
          บางตัวแค่เตือน ต้องเขียน script เพิ่ม
        </p>
        {/* ค่านี้ตัวเดียวครอบทุกเอกสารที่มีการตรวจ รวมระหว่างผลิต — เขียนไว้
            ไม่งั้นจะอ่านว่าครอบแค่ขาซื้อขาขาย แล้วไปตั้งความคาดหวังผิด */}
        <p className="mt-2 rounded-lg bg-surface px-3 py-2 text-sm text-muted-foreground">
          ใช้กับ <span className="font-medium text-foreground">ทุกเอกสาร</span> ที่มีการตรวจ
          — ใบรับของ · ใบแจ้งหนี้ซื้อ · ใบรับงานจ้างผลิต · ใบส่งของ · ใบแจ้งหนี้ขาย ·
          ใบเบิก-โอนสต็อก (ระหว่างผลิต)
        </p>

        <div className="mt-4 grid gap-4 @2xl:grid-cols-2">
          <GuardField
            id="on-rejected"
            label="ตรวจไม่ผ่านแล้วจะเดินเอกสารต่อ"
            hint="action_if_quality_inspection_is_rejected"
            value={guard.onRejected}
            onValueChange={(v) => onChange({ ...guard, onRejected: v })}
          />
          <GuardField
            id="on-not-submitted"
            label="ยังไม่ได้ตรวจแล้วจะเดินเอกสารต่อ"
            hint="action_if_quality_inspection_is_not_submitted"
            value={guard.onNotSubmitted}
            onValueChange={(v) => onChange({ ...guard, onNotSubmitted: v })}
          />
        </div>

        <label className="mt-4 flex items-start justify-between gap-4 rounded-lg bg-brand px-4 py-3">
          <span className="min-w-0">
            <span className="block text-sm font-medium">
              ให้ตรวจย้อนหลังได้หลังรับของไปแล้ว
            </span>
            <span className="block text-sm text-muted-foreground">
              ปิดไว้ = ต้องตรวจให้เสร็จก่อนถึงจะรับของได้ ·
              allow_to_make_quality_inspection_after_purchase_or_delivery ·
              ชื่อฟิลด์บอกขอบเขตแค่ซื้อ-ขาย ยังไม่ได้ยืนยันว่าครอบใบเบิก-โอนสต็อกด้วยไหม
            </span>
          </span>
          <Switch
            checked={guard.allowAfter}
            onCheckedChange={(v) => onChange({ ...guard, allowAfter: v })}
          />
        </label>
      </section>

      <DispositionRegistry />

      {/* ---------- ทะเบียนหัวข้อตรวจ ----------
           งานที่ทำตรงนี้คือดูทั้งทะเบียนทีเดียว — หาตัวซ้ำ ดูว่าอันไหนไม่มีใครใช้
           และจัดกลุ่มย้อนหลัง ส่วนการเลือก/สร้างหัวข้อตอนกำลังตั้งฟอร์ม
           ทำได้ในช่องของหน้าเทมเพลตโดยไม่ต้องเดินมาที่นี่ */}
      <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
        <h2 className="font-semibold">
          ทะเบียนหัวข้อตรวจ ({QI_PARAMETERS.length})
        </h2>
        <p className="mt-1 mb-3 text-sm text-muted-foreground">
          เก็บแค่ชื่อกับกลุ่ม ไม่ได้เก็บเกณฑ์ — ความชื้นในฟอร์มรับวัตถุดิบกับใน
          ฟอร์มก่อนผลิตต้องเป็นตัวเดียวกัน รายงานย้อนหลังถึงรวมกันได้
        </p>
        <ParamRegistryTable onChanged={onParamsChanged} />
      </section>

      <GroupRegistry onChanged={onParamsChanged} />

    </div>
  );
}

/* ---------- กลุ่มหัวข้อตรวจ ----------
     ERPNext เก็บกลุ่มเป็น doctype ของตัวเอง (Quality Inspection Parameter Group)
     ไม่ใช่ข้อความในชื่อหัวข้อ ที่นี่จึงต้องมีที่จัดการของมันเอง

     เปลี่ยนชื่อกลุ่มแล้วหัวข้อที่อยู่ในกลุ่มนั้นย้ายตามให้เอง และถ้าเปลี่ยนเป็น
     ชื่อที่มีอยู่แล้วคือยุบสองกลุ่มรวมกัน ซึ่งเป็นวิธีเก็บกวาดกลุ่มที่ตั้งซ้ำ */
function GroupRegistry({ onChanged }: { onChanged: () => void }) {
  const [adding, setAdding] = React.useState(false);
  const [draft, setDraft] = React.useState("");
  const [editing, setEditing] = React.useState<string | null>(null);
  const [, bump] = React.useReducer((n: number) => n + 1, 0);

  const refresh = () => {
    bump();
    onChanged();
  };

  const commitAdd = () => {
    if (draft.trim() === "") {
      setAdding(false);
      return;
    }
    const name = addGroup(draft);
    setDraft("");
    setAdding(false);
    refresh();
    toast.success(`เพิ่มกลุ่ม “${name}” แล้ว`);
  };

  return (
    <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="font-semibold">กลุ่มหัวข้อตรวจ ({QI_GROUPS.length})</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            ใช้แบ่งหัวข้อในใบตรวจให้อ่านง่าย — ไม่บังคับ หัวข้อที่ไม่จัดกลุ่มก็ใช้ได้ปกติ
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setAdding(true)}>
          <PlusIcon />
          เพิ่มกลุ่ม
        </Button>
      </div>

      <div className="mt-3 overflow-hidden rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-48">ชื่อกลุ่ม</TableHead>
              <TableHead className="min-w-32 text-right">หัวข้อในกลุ่ม</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {QI_GROUPS.map((g) => {
              const used = groupUsedBy(g);
              return (
                <TableRow key={g}>
                  <TableCell>
                    {/* แก้ชื่อในแถวเลย ไม่ต้องเปิดกล่อง — กลุ่มมีช่องเดียว
                        เปิดกล่องเพื่อแก้ข้อความบรรทัดเดียวคือขั้นตอนเกินจำเป็น */}
                    {editing === g ? (
                      <Input
                        autoFocus
                        defaultValue={g}
                        className="bg-card"
                        onBlur={(e) => {
                          renameGroup(g, e.target.value);
                          setEditing(null);
                          refresh();
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") e.currentTarget.blur();
                          if (e.key === "Escape") setEditing(null);
                        }}
                      />
                    ) : (
                      <span className="font-medium">{g}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {used > 0 ? (
                      `${used} หัวข้อ`
                    ) : (
                      <span className="text-muted-foreground">ว่าง</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`แก้ชื่อกลุ่ม ${g}`}
                      onClick={() => setEditing(g)}
                    >
                      <PencilIcon />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      disabled={used > 0}
                      title={used > 0 ? `ลบไม่ได้ มี ${used} หัวข้ออยู่ในกลุ่มนี้` : undefined}
                      aria-label={`ลบกลุ่ม ${g}`}
                      onClick={() => {
                        removeGroup(g);
                        refresh();
                        toast.success(`ลบกลุ่ม “${g}” แล้ว`);
                      }}
                    >
                      <Trash2Icon />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}

            {adding && (
              <TableRow>
                <TableCell colSpan={3}>
                  <Input
                    autoFocus
                    className="bg-card"
                    placeholder="ชื่อกลุ่มใหม่ เช่น จุลชีววิทยา"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onBlur={commitAdd}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") e.currentTarget.blur();
                      if (e.key === "Escape") {
                        setDraft("");
                        setAdding(false);
                      }
                    }}
                  />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <p className="mt-2 font-mono text-xs text-muted-foreground">
        Quality Inspection Parameter Group · เปลี่ยนชื่อเป็นกลุ่มที่มีอยู่แล้ว = ยุบรวมกัน
      </p>
    </section>
  );
}

/* ---------- ผลตรวจที่ไม่ผ่าน ----------
     รายการกลาง ไม่ให้พิมพ์อิสระในแต่ละฟอร์ม เพราะแต่ละตัวผูกกับ server script
     ที่เดฟเขียน พิมพ์ชื่อเพี้ยนไปตัวเดียว script ก็ไม่รู้จัก ผู้ตรวจเลือกได้
     บันทึกผ่าน แต่ยอดสต็อกไม่ขยับ และไม่มีอะไรเตือน

     คอลัมน์ "ผลกับสต็อก" เป็นสเปคให้เดฟ ไม่ใช่ของที่ระบบทำให้เอง — เขียนไว้
     ตรงนี้เพื่อให้คนตั้งค่ากับคนเขียนโค้ดอ่านของเดียวกัน */
function DispositionRegistry() {
  const [adding, setAdding] = React.useState(false);
  const [editing, setEditing] = React.useState<Disposition | null>(null);
  const [, bump] = React.useReducer((n: number) => n + 1, 0);

  return (
    <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="font-semibold">
            ผลตรวจที่ไม่ผ่าน ({DISPOSITIONS.length})
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            ตัวเลือกที่ผู้ตรวจเลือกได้เมื่อของไม่ผ่าน — แต่ละฟอร์มเปิดใช้เฉพาะที่
            เกี่ยวข้องได้ ส่วนผลกับสต็อกต้องให้เดฟเขียน server script
          </p>
        </div>
        <Button variant="outline-primary" size="sm" onClick={() => setAdding(true)}>
          <PlusIcon />
          เพิ่มตัวเลือก
        </Button>
      </div>

      <div className="mt-3 overflow-hidden rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-32">ตัวเลือก</TableHead>
              <TableHead className="min-w-56">ผลกับสต็อก</TableHead>
              <TableHead className="min-w-52">ต้องไปเขียนที่</TableHead>
              <TableHead className="min-w-24 text-right">ใช้ในฟอร์ม</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {DISPOSITIONS.map((d) => {
              const used = dispositionUsedBy(d.id);
              return (
                <TableRow key={d.id}>
                  <TableCell className="font-medium">{d.label}</TableCell>
                  <TableCell className="text-sm">{d.effect}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {d.field}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {used > 0 ? (
                      `${used} ฟอร์ม`
                    ) : (
                      <span className="text-muted-foreground">ยังไม่มีใครใช้</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`แก้ไข ${d.label}`}
                      onClick={() => setEditing(d)}
                    >
                      <PencilIcon />
                    </Button>
                    {/* ลบตัวที่ฟอร์มยังเปิดใช้อยู่ไม่ได้ — ใบตรวจเก่าจะอ้างค่าที่หายไป */}
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      disabled={used > 0}
                      title={used > 0 ? `ลบไม่ได้ มี ${used} ฟอร์มใช้อยู่` : undefined}
                      aria-label={`ลบ ${d.label}`}
                      onClick={() => {
                        removeDisposition(d.id);
                        bump();
                        toast.success(`ลบ “${d.label}” แล้ว`);
                      }}
                    >
                      <Trash2Icon />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {(adding || editing) && (
        <DispositionDialog
          editing={editing}
          onClose={() => {
            setAdding(false);
            setEditing(null);
          }}
          onSaved={bump}
        />
      )}
    </section>
  );
}

function DispositionDialog({
  editing,
  onClose,
  onSaved,
}: {
  editing: Disposition | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [label, setLabel] = React.useState(editing?.label ?? "");
  const [effect, setEffect] = React.useState(editing?.effect ?? "");
  const [field, setField] = React.useState(editing?.field ?? "");

  const save = () => {
    if (label.trim() === "") {
      toast.error("กรุณาตั้งชื่อตัวเลือก");
      return;
    }
    const payload = {
      label: label.trim(),
      effect: effect.trim(),
      field: field.trim(),
    };
    if (editing) updateDisposition(editing.id, payload);
    else addDisposition(payload);
    onSaved();
    onClose();
    toast.success(editing ? `แก้ “${payload.label}” แล้ว` : `เพิ่ม “${payload.label}” แล้ว`, {
      description: "อย่าลืมบอกเดฟให้เขียน script รองรับตัวเลือกนี้ด้วย",
    });
  };

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {editing ? "แก้ไขตัวเลือก" : "เพิ่มตัวเลือกใหม่"}
          </DialogTitle>
          <DialogDescription>
            ตั้งที่นี่แล้วทุกฟอร์มหยิบไปใช้ร่วมกัน — ชื่อที่ตั้งคือค่าที่ server
            script จะอ่าน เปลี่ยนชื่อแล้วต้องแก้ script ตาม
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="disp-label">ชื่อตัวเลือก</Label>
            <Input
              id="disp-label"
              autoFocus
              className="bg-card"
              placeholder="เช่น ส่งคืน"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="disp-effect">ผลกับสต็อก</Label>
            <Input
              id="disp-effect"
              className="bg-card"
              placeholder="เช่น ตัดออกจากยอดรับ แล้วออกใบคืนของผู้ขาย"
              value={effect}
              onChange={(e) => setEffect(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              เขียนให้คนอ่าน ระบบไม่ได้ทำตามนี้เอง ต้องมีคนเขียน script
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="disp-field">ต้องไปเขียนที่</Label>
            <Input
              id="disp-field"
              className="bg-card font-mono text-sm"
              placeholder="เช่น rejected_qty + Purchase Return"
              value={field}
              onChange={(e) => setField(e.target.value)}
            />
            <p className="font-mono text-xs text-muted-foreground">
              สเปคให้เดฟ · ฟิลด์ในใบรับของที่ต้องถูกเซ็ต
            </p>
          </div>
        </div>

        <DialogFooter className="grid grid-cols-2 gap-3">
          <Button variant="outline-primary" onClick={onClose}>
            ยกเลิก
          </Button>
          <Button onClick={save}>{editing ? "บันทึก" : "เพิ่ม"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function GuardField({
  id,
  label,
  hint,
  value,
  onValueChange,
}: {
  id: string;
  label: string;
  hint: string;
  value: GuardAction;
  onValueChange: (v: GuardAction) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Select value={value} onValueChange={(v) => onValueChange(v as GuardAction)}>
        <SelectTrigger id={id} className="w-full bg-card">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {(["stop", "warn"] as GuardAction[]).map((a) => (
            <SelectItem key={a} value={a}>
              {GUARD_LABEL[a]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="font-mono text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

function EmptyBox({ text }: { text: string }) {
  return (
    <div className={cn("mt-4 rounded-xl border border-dashed border-border", "px-6 py-14 text-center")}>
      <p className="font-medium">{text}</p>
      <p className="mt-1 text-sm text-muted-foreground">ลองใช้คำค้นสั้นลง</p>
    </div>
  );
}
