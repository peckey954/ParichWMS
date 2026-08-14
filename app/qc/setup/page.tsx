"use client";

import * as React from "react";
import {
  CalendarClockIcon,
  EyeIcon,
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
import { MultiSelect } from "@peckey954/ui/components/ui/multi-select";
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
import { FailActionsEditor } from "@/components/qc/fail-actions-editor";
import { FormPreview } from "@/components/qc/form-preview";
import { HeaderFieldsEditor } from "@/components/qc/header-fields-editor";
import { ItemEditor } from "@/components/qc/item-editor";
import {
  PUBLISHED_VERSIONS,
  ROLE_OPTIONS,
  SEED_TEMPLATE,
  findOverlaps,
  newItem,
  type QcItem,
  type QcTemplate,
} from "@/lib/qc-template";

export default function QcSetupPage() {
  const [tpl, setTpl] = React.useState<QcTemplate>(SEED_TEMPLATE);

  const patch = (p: Partial<QcTemplate>) => setTpl((t) => ({ ...t, ...p }));

  const patchItem = (id: string, p: Partial<QcItem>) =>
    setTpl((t) => ({
      ...t,
      items: t.items.map((it) => (it.id === id ? { ...it, ...p } : it)),
    }));

  const moveItem = (i: number, dir: -1 | 1) =>
    setTpl((t) => {
      const j = i + dir;
      if (j < 0 || j >= t.items.length) return t;
      const items = [...t.items];
      [items[i], items[j]] = [items[j], items[i]];
      return { ...t, items };
    });

  const overlaps = findOverlaps(tpl.effectiveFrom, tpl.effectiveTo);
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
              <BreadcrumbLink href="/">ระบบ</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/qc/setup">ตรวจสอบคุณภาพสินค้า</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-primary">
                ตั้งค่าเทมเพลต
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              ตั้งค่าเทมเพลตฟอร์ม QC
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              สร้างโครงฟอร์มตรวจคุณภาพเอง เพิ่ม–ลด–แก้หัวข้อได้โดยไม่ต้องแก้โปรแกรม
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              tone={tpl.status === "active" ? "success" : "neutral"}
              appearance="soft"
            >
              {tpl.status === "active"
                ? "เปิดใช้งาน"
                : tpl.status === "draft"
                  ? "ฉบับร่าง"
                  : "ปิดใช้งาน"}
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
                  <MultiSelect
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
                    <CalendarClockIcon className="size-4" />
                    <Label>เวอร์ชันที่ประกาศใช้แล้วของรหัสฟอร์มนี้</Label>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>เวอร์ชัน</TableHead>
                        <TableHead>เริ่มใช้</TableHead>
                        <TableHead>เลิกใช้</TableHead>
                        <TableHead>สถานะ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {PUBLISHED_VERSIONS.map((v) => {
                        const clash = overlaps.some(
                          (o) => o.revision === v.revision
                        );
                        return (
                          <TableRow key={v.revision}>
                            <TableCell className="font-medium">
                              {v.revision}
                            </TableCell>
                            <TableCell className="tabular-nums">
                              {v.from}
                            </TableCell>
                            <TableCell className="tabular-nums">
                              {v.to ?? "—"}
                            </TableCell>
                            <TableCell>
                              <Badge
                                tone={
                                  clash
                                    ? "danger"
                                    : v.status === "active"
                                      ? "success"
                                      : "neutral"
                                }
                                appearance="soft"
                              >
                                {clash
                                  ? "ช่วงวันที่ชนกัน"
                                  : v.status === "active"
                                    ? "ใช้อยู่"
                                    : "เลิกใช้แล้ว"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>

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
                  แต่ละหัวข้อกำหนดเกณฑ์ วิธีบันทึกผล จำนวนครั้งที่ตรวจ และหัวข้อย่อยได้
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
              </CardContent>
            </Card>

            {/* ---- 4. เมื่อผลตรวจไม่ผ่าน ---- */}
            <Card>
              <CardHeader>
                <CardTitle>4. เมื่อผลตรวจไม่ผ่าน</CardTitle>
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

            {/* ---- 5. การลงชื่อ ---- */}
            <Card>
              <CardHeader>
                <CardTitle>5. การลงชื่อเมื่อตรวจเสร็จ</CardTitle>
                <CardDescription>
                  ทุกใบตรวจจะบันทึกผู้ทำและเวลาเสมอ ปิดสองอย่างนี้ไม่ได้
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-0.5">
                    <Label>ลงชื่อผู้ตรวจ + เวลาที่ตรวจเสร็จ</Label>
                    <p className="text-sm text-muted-foreground">
                      ดึงจากผู้ใช้ที่ล็อกอินและเวลาที่กดยืนยัน แก้ย้อนหลังไม่ได้
                    </p>
                  </div>
                  <Badge tone="success" appearance="soft">
                    บังคับเสมอ
                  </Badge>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-0.5">
                    <Label htmlFor="sig-approver">ต้องมีผู้อนุมัติอีกชั้น</Label>
                    <p className="text-sm text-muted-foreground">
                      เปิดเมื่อฟอร์มนี้ต้องให้หัวหน้ากดอนุมัติหลังผู้ตรวจส่ง
                    </p>
                  </div>
                  <Switch
                    id="sig-approver"
                    checked={tpl.signature.approver}
                    onCheckedChange={(c) =>
                      patch({ signature: { ...tpl.signature, approver: c } })
                    }
                  />
                </div>
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
      <div className="sticky bottom-0 border-t border-border bg-background">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
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
