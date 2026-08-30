"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  EyeIcon,
  HistoryIcon,
  ListChecksIcon,
  PlusIcon,
  SaveIcon,
  TriangleAlertIcon,
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@peckey954/ui/components/ui/card";
import { Empty, EmptyDescription, EmptyTitle } from "@peckey954/ui/components/ui/empty";
import { Input } from "@peckey954/ui/components/ui/input";
import { Label } from "@peckey954/ui/components/ui/label";
import { Separator } from "@peckey954/ui/components/ui/separator";
import { Switch } from "@peckey954/ui/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@peckey954/ui/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@peckey954/ui/components/ui/tabs";
import { toast } from "sonner";
import { ChipGroup } from "@/components/chip-group";
import { MultiSelectChips } from "@/components/multi-select-chips";
import { FailActionsEditor } from "@/components/qc/fail-actions-editor";
import { FormPreview } from "@/components/qc/form-preview";
import { HeaderFieldsEditor } from "@/components/qc/header-fields-editor";
import { ScheduleEditor } from "@/components/qc/schedule-editor";
import { ItemEditor } from "@/components/qc/item-editor";
import { VersionPreviewDialog } from "@/components/qc/version-preview-dialog";
import { Stepper } from "@/components/stepper";
import {
  ITEM_KIND_HINT,
  QC_TEMPLATES,
  ROLE_OPTIONS,
  STATUS_LABEL,
  STATUS_TONE,
  cloneItemDeep,
  dayBeforeISO,
  findOverlaps,
  hasNumericRule,
  newItem,
  nextRevisionLabel,
  uid,
  type ItemKind,
  type ItemSettings,
  type QcItem,
  type QcTemplate,
  type QcTemplateFamily,
} from "@/lib/qc-template";

export default function QcTemplateEditorPage() {
  const { familyId } = useParams<{ familyId: string }>();
  const family = QC_TEMPLATES.find((f) => f.id === familyId);

  if (!family) {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/qc/setup">ตรวจสอบคุณภาพสินค้า</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-primary">ไม่พบเทมเพลต</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <Empty className="mt-6 py-10">
          <EmptyTitle>ไม่พบเทมเพลตนี้</EmptyTitle>
          <EmptyDescription>
            อาจถูกลบไปแล้ว หรือลิงก์ไม่ถูกต้อง —{" "}
            <Link href="/qc/setup" className="text-primary hover:underline">
              กลับไปหน้ารวมเทมเพลต
            </Link>
          </EmptyDescription>
        </Empty>
      </main>
    );
  }

  // key={family.id} บังคับให้คอมโพเนนต์ข้างในสร้างใหม่ทุกครั้งที่สลับฟอร์ม
  // ไม่งั้น useState ตัวแรกจะค้างค่าฟอร์มเก่าไว้ตอนกดเปลี่ยนฟอร์มแบบไม่โหลดหน้าใหม่
  return <QcTemplateEditor key={family.id} family={family} />;
}

function QcTemplateEditor({ family }: { family: QcTemplateFamily }) {
  // ฉบับร่างที่กำลังแก้อยู่เสมอ — ถ้าฟอร์มนี้มีฉบับร่างค้างอยู่แล้วก็ใช้อันนั้น
  // ถ้าไม่มี (ทุกเวอร์ชันเผยแพร่ไปหมดแล้ว) สร้างฉบับร่างใหม่จากเวอร์ชันล่าสุดให้ทันที
  const [versions, setVersions] = React.useState<QcTemplate[]>(() => {
    const existingDraft = family.versions.find((v) => v.status === "draft");
    if (existingDraft) return family.versions;
    const newest = family.versions[0];
    const draft: QcTemplate = {
      ...newest,
      id: uid("tpl"),
      revision: nextRevisionLabel(newest.revision),
      status: "draft",
      effectiveFrom: "",
      effectiveTo: null,
    };
    return [draft, ...family.versions];
  });

  const tpl = versions.find((v) => v.status === "draft") ?? versions[0];
  const siblingVersions = versions.filter((v) => v.id !== tpl.id);

  const updateTpl = (updater: (t: QcTemplate) => QcTemplate) =>
    setVersions((vs) => vs.map((v) => (v.id === tpl.id ? updater(v) : v)));

  const patch = (p: Partial<QcTemplate>) => updateTpl((t) => ({ ...t, ...p }));

  const patchItem = (id: string, p: Partial<QcItem>) =>
    patch({
      items: tpl.items.map((it) => (it.id === id ? { ...it, ...p } : it)),
    });

  /**
   * จำนวนในการตรวจ (ประเภทการตรวจ + จำนวนครั้ง/แถว) ตั้งทีเดียวให้ทั้งฟอร์ม ไม่ใช่ทีละหัวข้อ
   *
   * ฟอร์มส่วนใหญ่ทุกหัวข้อหลักตั้งแบบเดียวกันหมดทั้งใบอยู่แล้ว — จะสุ่มตรวจของหลายชิ้น
   * ("รายข้อมูล") ก็ทุกหัวข้อเป็นแบบนั้น จะตรวจซ้ำหลายรอบ ("รายครั้ง") ก็ทุกหัวข้อเป็นแบบนั้น
   * ให้ตั้งทีละข้อแล้วต้องไล่กดยี่สิบรอบเพื่อค่าเดียวกัน จึงยกมาไว้จุดเดียวแทน
   * มีผลเฉพาะหัวข้อหลัก ไม่แตะหัวข้อย่อย เพราะหัวข้อย่อยไม่ได้ตรวจซ้ำพร้อมหัวข้อหลักเสมอไป
   */
  const patchAllItems = (p: Partial<QcItem>) =>
    patch({ items: tpl.items.map((it) => ({ ...it, ...p })) });

  // ตัวแทนค่าปัจจุบัน — อ่านจากหัวข้อแรก เพราะหลัง patchAllItems ทุกหัวข้อหลักค่าตรงกันเสมอ
  const repKind: ItemKind = tpl.items[0]?.kind ?? "check";
  const repDefaultRounds = tpl.items[0]?.defaultRounds ?? 1;
  const repMaxRounds = tpl.items[0]?.maxRounds ?? 1;

  const moveItem = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= tpl.items.length) return;
    const items = [...tpl.items];
    [items[i], items[j]] = [items[j], items[i]];
    patch({ items });
  };

  // แทรกสำเนาต่อท้ายต้นฉบับทันที ไม่ใช่ท้ายรายการ — หัวข้อที่โครงเหมือนกัน
  // มักอยู่ติดกันในฟอร์มจริง (เช่นข้อ 3–7 ในฟอร์มกระดาษต้นแบบ)
  const duplicateItem = (id: string) => {
    const i = tpl.items.findIndex((it) => it.id === id);
    if (i < 0) return;
    const items = [...tpl.items];
    items.splice(i + 1, 0, cloneItemDeep(tpl.items[i]));
    patch({ items });
  };

  /**
   * ยกการแสดงข้อมูลของข้อหนึ่งไปใช้กับทุกข้อในฟอร์ม
   *
   * ฟอร์มจริงส่วนใหญ่ตั้งเหมือนกันหมดทั้งใบ ต่างกันแค่ชื่อกับเกณฑ์
   * ไม่มีปุ่มนี้แปลว่าต้องเปิดกล่องทีละข้อยี่สิบรอบเพื่อตั้งค่าเดียวกัน
   *
   * "ระบบตัดสิน" ไปกับข้อที่ไม่มีเกณฑ์ตัวเลขไม่ได้ ข้อนั้นจะไม่มีอะไรตัดสินให้เลย
   * จึงลดให้เป็นผู้ตรวจติ๊กแทน ดีกว่าปล่อยให้ตั้งค่าที่ทำงานไม่ได้ค้างไว้
   */
  const applyToAll = (s: ItemSettings) => {
    const items = tpl.items.map((it) => ({
      ...it,
      ...s,
      verdict: s.verdict === "auto" && !hasNumericRule(it) ? "manual" : s.verdict,
    }));
    toast.success(`ใช้การแสดงข้อมูลกับ ${items.length} หัวข้อแล้ว`, {
      description: "หัวข้อย่อยยังเป็นค่าเดิม ตั้งแยกได้ในแต่ละข้อ",
    });
    patch({ items });
  };

  /**
   * ดึงโครงของเวอร์ชันเก่ามาตั้งเป็นฉบับร่างใหม่ — ทางย้อนกลับไปใช้งานเวอร์ชันก่อนหน้า
   * ไม่ทับเวอร์ชันเดิมในประวัติ แค่แทนที่ฉบับร่างที่กำลังแก้อยู่ตอนนี้ด้วยโครงเก่า
   * แล้วเว้นวันเริ่มใช้ไว้ให้ตั้งใหม่ ป้องกันลืมเผยแพร่ทับช่วงวันที่เดิมโดยไม่ตั้งใจ
   */
  const restoreVersion = (v: QcTemplate) => {
    const newestLabel = siblingVersions[0]?.revision ?? v.revision;
    const restored: QcTemplate = {
      ...v,
      id: uid("tpl"),
      revision: nextRevisionLabel(newestLabel),
      status: "draft",
      effectiveFrom: "",
      effectiveTo: null,
    };
    setVersions([restored, ...siblingVersions]);
    toast.success(`ดึงโครงจาก ${v.revision} มาเป็นฉบับร่าง ${restored.revision} แล้ว`, {
      description: "ตั้งวันที่เริ่มใช้ใหม่ก่อนเผยแพร่",
    });
  };

  const overlaps = findOverlaps(tpl.effectiveFrom, tpl.effectiveTo, siblingVersions);
  const untitled = tpl.items.filter((i) => !i.title.trim()).length;
  const canPublish =
    tpl.name.trim() !== "" &&
    tpl.effectiveFrom !== "" &&
    overlaps.length === 0 &&
    untitled === 0 &&
    tpl.items.length > 0;

  function handlePublish() {
    if (!canPublish) {
      toast.error("ยังเผยแพร่ไม่ได้ — แก้ข้อที่ค้างอยู่ก่อน");
      return;
    }
    // เผยแพร่ฉบับร่างนี้แล้วปิดเวอร์ชันที่เคยใช้งานอยู่ ให้เหลือ "ใช้งานอยู่" แค่เวอร์ชันเดียวเสมอ
    setVersions((vs) =>
      vs.map((v) => {
        if (v.id === tpl.id) return { ...v, status: "active" };
        if (v.status === "active") {
          return { ...v, status: "inactive", effectiveTo: v.effectiveTo ?? dayBeforeISO(tpl.effectiveFrom) };
        }
        return v;
      })
    );
    toast.success(`เผยแพร่ ${tpl.formCode} ${tpl.revision} แล้ว`, {
      description: `เริ่มใช้ ${tpl.effectiveFrom} · ${tpl.items.length} หัวข้อตรวจ`,
    });
  }

  return (
    <>
      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/qc/setup">ตรวจสอบคุณภาพสินค้า</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-primary">
                {tpl.name || "ยังไม่ได้ตั้งชื่อฟอร์ม"}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {tpl.name || "ยังไม่ได้ตั้งชื่อฟอร์ม"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              สร้างโครงฟอร์มตรวจคุณภาพเอง เพิ่ม–ลด–แก้หัวข้อได้โดยไม่ต้องแก้โปรแกรม
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge tone={STATUS_TONE[tpl.status]} appearance="soft">
              {STATUS_LABEL[tpl.status]}
            </Badge>
            <Badge tone="neutral" appearance="outline">
              {tpl.formCode} {tpl.revision}
            </Badge>
          </div>
        </div>

        <Tabs defaultValue="build" className="mt-6">
          <TabsList>
            <TabsTrigger value="build">
              <ListChecksIcon />
              โครงสร้างฟอร์ม
            </TabsTrigger>
            <TabsTrigger value="preview">
              <EyeIcon />
              ตัวอย่างฟอร์ม
            </TabsTrigger>
          </TabsList>

          {/* ================= โครงสร้างฟอร์ม ================= */}
          <TabsContent value="build" className="mt-6 space-y-6">
            {/* ---- 1. ข้อมูลเทมเพลต ---- */}
            <Card>
              <CardHeader>
                <CardTitle>1. ข้อมูลเทมเพลต</CardTitle>
                <CardDescription>
                  ชื่อฟอร์ม ช่วงเวลาที่ใช้ และกลุ่มผู้ใช้ที่เข้าถึงได้
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid gap-4 @2xl:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="tpl-name">ชื่อเทมเพลต</Label>
                    <Input
                      id="tpl-name"
                      value={tpl.name}
                      onChange={(e) => patch({ name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tpl-code">รหัสฟอร์ม</Label>
                    <Input
                      id="tpl-code"
                      value={tpl.formCode}
                      onChange={(e) => patch({ formCode: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tpl-rev">เวอร์ชัน</Label>
                    <Input
                      id="tpl-rev"
                      value={tpl.revision}
                      onChange={(e) => patch({ revision: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tpl-from">วันที่เริ่มใช้</Label>
                    <Input
                      id="tpl-from"
                      type="date"
                      value={tpl.effectiveFrom}
                      onChange={(e) => patch({ effectiveFrom: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tpl-to">
                      วันที่เลิกใช้{" "}
                      <span className="font-normal text-muted-foreground">
                        (เว้นว่าง = ใช้ต่อเนื่อง)
                      </span>
                    </Label>
                    <Input
                      id="tpl-to"
                      type="date"
                      value={tpl.effectiveTo ?? ""}
                      onChange={(e) =>
                        patch({ effectiveTo: e.target.value || null })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>กลุ่มผู้ใช้ที่ใช้ฟอร์มนี้ได้</Label>
                  <MultiSelectChips
                    options={ROLE_OPTIONS}
                    value={tpl.roles}
                    onValueChange={(v) => patch({ roles: v })}
                    placeholder="เลือกกลุ่มผู้ใช้"
                    searchPlaceholder="ค้นหากลุ่มผู้ใช้"
                    selectAllLabel="เลือกทั้งหมด"
                    maxChips={3}
                  />
                </div>

                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-0.5">
                    <Label htmlFor="tpl-active">เปิดใช้งานเทมเพลตนี้</Label>
                    <p className="text-sm text-muted-foreground">
                      ปิดไว้ได้ถ้ายังไม่พร้อมใช้ ผู้ตรวจจะยังไม่เห็นฟอร์มนี้
                    </p>
                  </div>
                  <Switch
                    id="tpl-active"
                    checked={tpl.status === "active"}
                    onCheckedChange={(c) =>
                      patch({ status: c ? "active" : "inactive" })
                    }
                  />
                </div>

                {/* ประวัติเวอร์ชัน + ตรวจวันที่ชนกัน */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <HistoryIcon className="size-4" />
                    <Label>ประวัติเวอร์ชันของฟอร์มนี้</Label>
                  </div>
                  <div className="overflow-x-auto rounded-lg border border-border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="pl-4">เวอร์ชัน</TableHead>
                          <TableHead>เริ่มใช้</TableHead>
                          <TableHead>เลิกใช้</TableHead>
                          <TableHead>สถานะ</TableHead>
                          <TableHead className="pr-4 text-right">ดู</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {versions.map((v) => {
                          const isCurrent = v.id === tpl.id;
                          const clash = overlaps.some((o) => o.id === v.id);
                          return (
                            <TableRow key={v.id}>
                              <TableCell className="pl-4 font-medium">
                                {v.revision}
                              </TableCell>
                              <TableCell className="tabular-nums">
                                {v.effectiveFrom || "—"}
                              </TableCell>
                              <TableCell className="tabular-nums">
                                {v.effectiveTo ?? "—"}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  tone={clash ? "danger" : STATUS_TONE[v.status]}
                                  appearance="soft"
                                >
                                  {clash ? "ช่วงวันที่ชนกัน" : STATUS_LABEL[v.status]}
                                </Badge>
                                {isCurrent && (
                                  <span className="ml-2 text-sm text-muted-foreground">
                                    กำลังแก้อยู่
                                  </span>
                                )}
                              </TableCell>
                              <TableCell className="pr-4 text-right">
                                {!isCurrent && (
                                  <VersionPreviewDialog
                                    version={v}
                                    onRestore={() => restoreVersion(v)}
                                  />
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>

                  {overlaps.length > 0 && (
                    <Alert variant="destructive">
                      <TriangleAlertIcon />
                      <AlertTitle>ช่วงวันที่ทับกับเวอร์ชันที่ใช้อยู่</AlertTitle>
                      <AlertDescription>
                        ชนกับ {overlaps.map((o) => o.revision).join(", ")} —
                        ต้องกำหนดวันเลิกใช้ของเวอร์ชันเดิม หรือเลื่อนวันเริ่มใช้ของเวอร์ชันนี้
                        ให้ไม่ซ้อนกันก่อนจึงจะเผยแพร่ได้
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* ---- 2. ส่วนหัวเอกสาร ---- */}
            <Card>
              <CardHeader>
                <CardTitle>2. ส่วนหัวเอกสาร</CardTitle>
                <CardDescription>
                  ช่องที่ผู้ตรวจต้องกรอกก่อนเริ่มตรวจ เช่น เลขที่เอกสาร สินค้า เครื่องจักร
                </CardDescription>
              </CardHeader>
              <CardContent>
                <HeaderFieldsEditor
                  fields={tpl.headerFields}
                  onChange={(headerFields) => patch({ headerFields })}
                />
              </CardContent>
            </Card>

            {/* ---- 3. หัวข้อตรวจ ---- */}
            <Card>
              <CardHeader>
                <CardTitle>3. หัวข้อตรวจ</CardTitle>
                <CardDescription>
                  แต่ละหัวข้อกำหนดชื่อ เกณฑ์ และช่องที่ผู้ตรวจต้องกรอกได้ ส่วนวิธีตรวจกับจำนวนครั้งอยู่ในปุ่มการแสดงข้อมูล
                  <span className="mt-1 block">
                    ช่องไหนไม่ต้องมีในใบตรวจให้เว้นว่างไว้ คอลัมน์นั้นจะไม่ขึ้นในฟอร์ม
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {tpl.items.length === 0 ? (
                  <Empty>
                    <EmptyTitle>ยังไม่มีหัวข้อตรวจ</EmptyTitle>
                    <EmptyDescription>
                      กดปุ่มด้านล่างเพื่อเพิ่มหัวข้อแรก
                    </EmptyDescription>
                  </Empty>
                ) : (
                  tpl.items.map((item, i) => (
                    <ItemEditor
                      key={item.id}
                      item={item}
                      index={i}
                      total={tpl.items.length}
                      onPatch={(p) => patchItem(item.id, p)}
                      onMove={(dir) => moveItem(i, dir)}
                      onRemove={() =>
                        patch({
                          items: tpl.items.filter((x) => x.id !== item.id),
                        })
                      }
                      onDuplicate={() => duplicateItem(item.id)}
                      onApplyToAll={tpl.items.length > 1 ? applyToAll : undefined}
                    />
                  ))
                )}

                <Button
                  variant="outline-primary"
                  onClick={() => patch({ items: [...tpl.items, newItem()] })}
                >
                  <PlusIcon />
                  เพิ่มหัวข้อตรวจ
                </Button>

                {untitled > 0 && (
                  <Alert variant="warning">
                    <TriangleAlertIcon />
                    <AlertTitle>ยังมี {untitled} หัวข้อที่ไม่ได้ตั้งชื่อ</AlertTitle>
                    <AlertDescription>
                      ต้องตั้งชื่อให้ครบก่อนจึงจะเผยแพร่เทมเพลตได้
                    </AlertDescription>
                  </Alert>
                )}

                <Separator />
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-0.5">
                    <Label htmlFor="allow-adhoc">
                      ผู้ตรวจเพิ่มหัวข้อเองได้ระหว่างตรวจ
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      แทนบรรทัดว่าง &quot;อื่นๆ&quot; ท้ายฟอร์มกระดาษ — เปิดไว้ถ้าฟอร์มนี้
                      มีเคสที่ตั้งเป็นหัวข้อตายตัวล่วงหน้าไม่ได้ทั้งหมด
                    </p>
                  </div>
                  <Switch
                    id="allow-adhoc"
                    checked={tpl.allowAdHocItems}
                    onCheckedChange={(c) => patch({ allowAdHocItems: c })}
                  />
                </div>
              </CardContent>
            </Card>

            {/* ---- 4. จำนวนในการตรวจ ---- */}
            <Card>
              <CardHeader>
                <CardTitle>4. จำนวนในการตรวจ</CardTitle>
                <CardDescription>
                  กำหนดจำนวนครั้งในการตรวจสอบ
                  <span className="mt-1 block">
                    ตั้งครั้งเดียวมีผลกับทุกหัวข้อหลักในฟอร์มนี้พร้อมกัน ไม่ต้องไล่ตั้งทีละหัวข้อ
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {tpl.items.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    ยังไม่มีหัวข้อตรวจ — เพิ่มหัวข้อในขั้นตอนที่ 3 ก่อน จึงจะตั้งจำนวนตรงนี้ได้
                  </p>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label>ประเภทการตรวจ</Label>
                      <ChipGroup
                        label="ประเภทการตรวจ"
                        options={(["check", "rows"] as ItemKind[]).map((k) => ({
                          id: k,
                          label: k === "check" ? "รายครั้ง" : "รายข้อมูล",
                          disabled:
                            k === "rows" &&
                            tpl.items.some((it) => it.children.length > 0),
                          hint: "มีหัวข้อที่มีหัวข้อย่อยอยู่ เปลี่ยนเป็นตารางไม่ได้ ต้องลบหัวข้อย่อยก่อน",
                        }))}
                        value={repKind}
                        onChange={(kind) => patchAllItems({ kind })}
                      />
                      <p className="text-sm text-muted-foreground">
                        {ITEM_KIND_HINT[repKind]}
                      </p>
                    </div>

                    {/* ไม่มีสวิตช์ "ครั้งเดียว/หลายครั้ง" แยกอีกชั้น — จำนวนขั้นต่ำ/สูงสุด
                        ตอบเรื่องนี้อยู่แล้วในตัวเอง ตั้งเป็น 1/1 ก็คือครั้งเดียว ไม่ต้องมีสวิตช์
                        คู่ขนานที่พูดเรื่องเดียวกันซ้ำ — ค่าเริ่มต้นเป็น 1/1 (ครั้งเดียว) เสมอ
                        repeatable ในข้อมูลก็ยังอยู่ ใช้จริงตอนตรวจ แค่อนุมานจาก maxRounds > 1
                        แทนที่จะมีสวิตช์ให้ตั้งเองซ้ำกับตัวเลข */}
                    <div className="grid gap-3 @2xl:grid-cols-2">
                      <Stepper
                        label="จำนวนขั้นต่ำ"
                        value={repDefaultRounds}
                        min={1}
                        max={repMaxRounds}
                        onChange={(defaultRounds) => patchAllItems({ defaultRounds })}
                      />
                      <Stepper
                        label="เพิ่มได้สูงสุด"
                        value={repMaxRounds}
                        min={repDefaultRounds}
                        max={99}
                        onChange={(maxRounds) =>
                          patchAllItems({ maxRounds, repeatable: maxRounds > 1 })
                        }
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* ---- 5. เมื่อผลตรวจไม่ผ่าน ---- */}
            <Card>
              <CardHeader>
                <CardTitle>5. เมื่อผลตรวจไม่ผ่าน</CardTitle>
                <CardDescription>
                  ตัวเลือกที่ผู้ตรวจต้องติ๊กว่าจะจัดการสินค้าที่ไม่ผ่านอย่างไร แก้ข้อความได้เอง
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <FailActionsEditor
                  actions={tpl.failActions}
                  onChange={(failActions) => patch({ failActions })}
                />
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-0.5">
                    <Label htmlFor="require-fa">บังคับเลือกเมื่อมีข้อไม่ผ่าน</Label>
                    <p className="text-sm text-muted-foreground">
                      ถ้าเปิด จะบันทึกใบตรวจไม่ได้จนกว่าจะเลือกวิธีจัดการ
                    </p>
                  </div>
                  <Switch
                    id="require-fa"
                    checked={tpl.requireFailAction}
                    onCheckedChange={(c) => patch({ requireFailAction: c })}
                  />
                </div>
              </CardContent>
            </Card>

            {/* ---- 6. รอบการตรวจ ---- */}
            <Card>
              <CardHeader>
                <CardTitle>6. รอบการตรวจ</CardTitle>
                <CardDescription>
                  ฟอร์มนี้เปิดใบเมื่อมีเรื่องให้ตรวจ หรือต้องตรวจทุกวันตามช่วงเวลา
                  <span className="mt-1 block">
                    ตัวนี้เป็นตัวเดียวที่ตัดสินว่าฟอร์มดูเป็นปฏิทินและตารางทั้งเดือนได้ไหม
                    ไม่มีติ๊กเปิดปฏิทินแยก เพราะฟอร์มที่เปิดใบตามเหตุ ช่องว่างในปฏิทินแปลอะไรไม่ได้
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScheduleEditor
                  schedule={tpl.schedule}
                  onChange={(schedule) => patch({ schedule })}
                />
              </CardContent>
            </Card>

          </TabsContent>

          {/* ================= ตัวอย่างฟอร์ม ================= */}
          <TabsContent value="preview" className="mt-6">
            <Alert variant="brand" className="mb-6">
              <EyeIcon />
              <AlertTitle>นี่คือหน้าตาที่ผู้ตรวจจะเห็น</AlertTitle>
              <AlertDescription>
                สร้างจากโครงสร้างที่ตั้งไว้ทางแท็บซ้าย แก้โครงแล้วหน้านี้เปลี่ยนตามทันที
                — ช่องกรอกในหน้านี้ยังไม่บันทึกค่า
              </AlertDescription>
            </Alert>
            <FormPreview template={tpl} />
          </TabsContent>
        </Tabs>
      </main>

      {/* ---------- แถบปุ่มล่าง ---------- */}
      <div className="sticky bottom-0 border-t border-border bg-surface">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-8 py-3">
          <span className="text-sm text-muted-foreground">
            {tpl.items.length} หัวข้อตรวจ · {tpl.headerFields.length} ฟิลด์ส่วนหัว
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline-primary"
              onClick={() => toast.success("บันทึกฉบับร่างแล้ว")}
            >
              <SaveIcon />
              บันทึกร่าง
            </Button>
            <Button onClick={handlePublish}>เผยแพร่เทมเพลต</Button>
          </div>
        </div>
      </div>
    </>
  );
}
