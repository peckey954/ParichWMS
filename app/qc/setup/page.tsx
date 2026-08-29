"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRightIcon, FileTextIcon, SearchIcon } from "lucide-react";
import { Badge } from "@peckey954/ui/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@peckey954/ui/components/ui/breadcrumb";
import { Card, CardContent } from "@peckey954/ui/components/ui/card";
import { Empty, EmptyDescription, EmptyTitle } from "@peckey954/ui/components/ui/empty";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@peckey954/ui/components/ui/input-group";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@peckey954/ui/components/ui/table";
import { cn } from "@peckey954/ui/lib/utils";
import { ChipGroup } from "@/components/chip-group";
import { ROW_HOVER_NAV } from "@/components/stock/doc-parts";
import {
  QC_TEMPLATES,
  SHAPE_HINT,
  SHAPE_LABEL,
  STATUS_LABEL,
  STATUS_TONE,
  activeVersion,
  describeSchedule,
  draftVersion,
  representativeVersion,
  templateShapes,
  type ShapeId,
} from "@/lib/qc-template";

/**
 * หน้าแรกของการตั้งค่าเทมเพลต QC — ตารางรวมทุกรหัสฟอร์มในระบบ
 * กดแถวเข้าไปดู/แก้โครงสร้างของฟอร์มนั้นทีละอัน ที่ /qc/setup/[familyId]
 *
 * แต่ละแถวคือ "รหัสฟอร์ม" หนึ่งอัน ซึ่งข้างในมีได้หลายเวอร์ชัน (ดูที่หน้ารายละเอียด)
 * คอลัมน์เวอร์ชันในตารางนี้จึงโชว์เฉพาะตัวแทน — เวอร์ชันที่ใช้งานอยู่ก่อน
 * ถ้ายังไม่เคยเผยแพร่ก็โชว์ฉบับร่างแทน
 *
 * คอลัมน์รูปแบบอ่านออกมาจากโครงฟอร์มจริง ไม่ได้เก็บเป็นค่าให้เลือกเอง
 * ป้ายจึงตรงกับฟอร์มเสมอ ไม่มีทางเป็นป้ายที่ค้างไว้จากตอนที่ฟอร์มยังเป็นอีกแบบ
 * และเป็นที่ที่ตอบว่า "ฟอร์มแบบนี้ตั้งยังไง" — กดชิปกรองแล้วเปิดดูของจริงได้เลย
 */
export default function QcTemplateListPage() {
  const [query, setQuery] = React.useState("");
  const [shape, setShape] = React.useState<ShapeId | "all">("all");
  const router = useRouter();

  // อ่านรูปแบบของทุกฟอร์มรอบเดียว ใช้ทั้งกรองและวาดป้ายในตาราง
  const rows = QC_TEMPLATES.map((family) => ({
    family,
    rep: representativeVersion(family),
    shapes: templateShapes(representativeVersion(family)),
  }));

  // ชิปกรองขึ้นเฉพาะรูปแบบที่มีฟอร์มใช้จริง กดแล้วเจอศูนย์ผลลัพธ์ไม่ควรเกิดขึ้นได้
  const usedShapes = (Object.keys(SHAPE_LABEL) as ShapeId[]).filter((id) =>
    rows.some((r) => r.shapes.includes(id))
  );

  const q = query.trim().toLowerCase();
  const visible = rows.filter(({ family, rep, shapes }) => {
    if (shape !== "all" && !shapes.includes(shape)) return false;
    if (!q) return true;
    return (
      rep.name.toLowerCase().includes(q) || family.formCode.toLowerCase().includes(q)
    );
  });

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage className="text-primary">
              ตรวจสอบคุณภาพสินค้า
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mt-4">
        <h1 className="text-2xl font-semibold tracking-tight">
          เทมเพลตฟอร์ม QC
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          ทุกฟอร์มตรวจคุณภาพในระบบ กดเข้าไปดูโครงสร้าง แก้ไข หรือย้อนดูเวอร์ชันเก่าได้ทีละฟอร์ม
        </p>
      </div>

      <div className="mt-4 space-y-3">
        <InputGroup className="max-w-sm bg-card">
          <InputGroupAddon align="inline-start">
            <SearchIcon />
          </InputGroupAddon>
          <InputGroupInput
            placeholder="ค้นหาชื่อฟอร์มหรือรหัสฟอร์ม..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </InputGroup>

        <ChipGroup
          label="กรองตามรูปแบบฟอร์ม"
          options={[
            { id: "all" as const, label: "ทุกรูปแบบ" },
            ...usedShapes.map((id) => ({
              id,
              label: SHAPE_LABEL[id],
              hint: SHAPE_HINT[id],
            })),
          ]}
          value={shape}
          onChange={setShape}
        />
      </div>

      {visible.length === 0 ? (
        <Card className="mt-4 py-0">
          <CardContent className="px-0">
            <Empty className="py-10">
              <EmptyTitle>ไม่พบเทมเพลตที่ค้นหา</EmptyTitle>
              <EmptyDescription>
                ลองใช้คำค้นสั้นลง หรือเลือกทุกรูปแบบ
              </EmptyDescription>
            </Empty>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* มือถือ: การ์ดทีละใบ — คนตรวจ QC ส่วนใหญ่เปิดหน้านี้จากมือถือ
              ตารางคอลัมน์เยอะบีบจนอ่านยากและกดเป้าหมายเล็กเกินนิ้ว
              การ์ดจึงจัดลำดับข้อมูลใหม่ตามที่ใช้จริงหน้างาน: ชื่อฟอร์มก่อน
              ตามด้วยรูปแบบ/สถานะเวอร์ชัน แล้วปิดท้ายด้วยวันที่เริ่มใช้กับจำนวนหัวข้อ */}
          <div className="mt-4 grid gap-3 md:hidden">
            {visible.map(({ family, rep, shapes }) => {
              const active = activeVersion(family);
              const draft = draftVersion(family);
              const href = `/qc/setup/${family.id}`;
              return (
                <Link
                  key={family.id}
                  href={href}
                  className="block rounded-lg border bg-card p-4 active:bg-muted/60"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium">
                        {rep.name || "ยังไม่ได้ตั้งชื่อฟอร์ม"}
                      </p>
                      <span className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
                        <FileTextIcon className="size-3.5 shrink-0" />
                        {family.formCode}
                      </span>
                    </div>
                    <ChevronRightIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {/* ไม่มีป้ายเลย = ฟอร์มที่ตั้งตามค่าเริ่มต้นทั้งใบ
                        ต้องเขียนออกมาให้เห็น ช่องว่างเปล่า ๆ อ่านว่าข้อมูลหาย */}
                    {shapes.length === 0 && (
                      <Badge tone="neutral" appearance="outline">
                        แบบพื้นฐาน
                      </Badge>
                    )}
                    {shapes.map((id) => (
                      <Badge
                        key={id}
                        tone={id === "recurring" ? "brand" : "neutral"}
                        appearance="soft"
                      >
                        {SHAPE_LABEL[id]}
                      </Badge>
                    ))}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {describeSchedule(rep)}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    {active ? (
                      <Badge tone={STATUS_TONE.active} appearance="soft">
                        {active.revision}
                      </Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        ยังไม่เคยเผยแพร่
                      </span>
                    )}
                    {draft && (
                      <Badge tone={STATUS_TONE.draft} appearance="outline">
                        {draft.revision} · {STATUS_LABEL.draft}
                      </Badge>
                    )}
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t pt-2 text-sm text-muted-foreground">
                    <span className="tabular-nums">
                      เริ่มใช้ {rep.effectiveFrom || "—"}
                    </span>
                    <span className="tabular-nums">
                      {rep.items.length} หัวข้อตรวจ
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* จอกว้าง: ตารางเดิม — คอลัมน์เทียบกันได้ในแนวนอนโดยไม่ต้องเลื่อน */}
          <Card className="mt-4 hidden py-0 md:block">
            <CardContent className="px-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-56 pl-4">ชื่อฟอร์ม</TableHead>
                      <TableHead className="min-w-64">รูปแบบ</TableHead>
                      <TableHead>เวอร์ชันที่ใช้งาน</TableHead>
                      <TableHead>ฉบับร่าง</TableHead>
                      <TableHead>เริ่มใช้</TableHead>
                      <TableHead className="text-right pr-4">หัวข้อตรวจ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visible.map(({ family, rep, shapes }) => {
                      const active = activeVersion(family);
                      const draft = draftVersion(family);
                      const href = `/qc/setup/${family.id}`;
                      return (
                        <TableRow
                          key={family.id}
                          // ทั้งแถวกดได้ ไม่ใช่แค่ตัวอักษรชื่อฟอร์ม
                          onClick={() => router.push(href)}
                          className={cn("cursor-pointer", ROW_HOVER_NAV)}
                        >
                          <TableCell className="pl-4">
                            <Link
                              href={href}
                              className="block font-medium hover:underline"
                            >
                              {rep.name || "ยังไม่ได้ตั้งชื่อฟอร์ม"}
                            </Link>
                            <span className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
                              <FileTextIcon className="size-3.5" />
                              {family.formCode}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1.5">
                              {/* ไม่มีป้ายเลย = ฟอร์มที่ตั้งตามค่าเริ่มต้นทั้งใบ
                                  ต้องเขียนออกมาให้เห็น ช่องว่างเปล่า ๆ อ่านว่าข้อมูลหาย */}
                              {shapes.length === 0 && (
                                <Badge
                                  tone="neutral"
                                  appearance="outline"
                                  title="ตั้งตามค่าเริ่มต้นทั้งใบ ไม่มีอะไรตั้งพิเศษ"
                                >
                                  แบบพื้นฐาน
                                </Badge>
                              )}
                              {shapes.map((id) => (
                                <Badge
                                  key={id}
                                  tone={id === "recurring" ? "brand" : "neutral"}
                                  appearance="soft"
                                  title={SHAPE_HINT[id]}
                                >
                                  {SHAPE_LABEL[id]}
                                </Badge>
                              ))}
                            </div>
                            <span className="mt-1 block text-sm text-muted-foreground">
                              {describeSchedule(rep)}
                            </span>
                          </TableCell>
                          <TableCell>
                            {active ? (
                              <div>
                                <Badge tone={STATUS_TONE.active} appearance="soft">
                                  {active.revision}
                                </Badge>
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground">
                                ยังไม่เคยเผยแพร่
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            {draft ? (
                              <Badge tone={STATUS_TONE.draft} appearance="outline">
                                {draft.revision} · {STATUS_LABEL.draft}
                              </Badge>
                            ) : (
                              <span className="text-sm text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="tabular-nums whitespace-nowrap">
                            {rep.effectiveFrom || "—"}
                          </TableCell>
                          <TableCell className="pr-4 text-right tabular-nums">
                            {rep.items.length}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </main>
  );
}
