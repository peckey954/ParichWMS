"use client";

import { CircleDashedIcon, PlusIcon } from "lucide-react";
import { Badge } from "@peckey954/ui/components/ui/badge";
import { Button } from "@peckey954/ui/components/ui/button";
import { Card, CardContent } from "@peckey954/ui/components/ui/card";
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
import { Separator } from "@peckey954/ui/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@peckey954/ui/components/ui/table";
import { Textarea } from "@peckey954/ui/components/ui/textarea";
import {
  VERDICT_WORDS,
  buildPreviewBlocks,
  describeRule,
  showsAutoStatus,
  showsTick,
  type HeaderField,
  type QcItem,
  type QcTemplate,
} from "@/lib/qc-template";

export function FormPreview({ template }: { template: QcTemplate }) {
  const blocks = buildPreviewBlocks(template.items);

  return (
    <div className="space-y-6">
      {/* ---------- หัวเอกสาร ---------- */}
      <div>
        <h2 className="text-xl font-semibold tracking-tight">
          {template.name || "ยังไม่ได้ตั้งชื่อฟอร์ม"}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {template.formCode} {template.revision}
        </p>
      </div>

      <Card>
        <CardContent>
          <div className="grid gap-4 rounded-lg bg-muted p-4 @2xl:grid-cols-2 @4xl:grid-cols-3">
            {template.headerFields.map((f) => (
              <HeaderFieldPreview key={f.id} field={f} />
            ))}
            {template.headerFields.length === 0 && (
              <p className="text-sm text-muted-foreground">
                ยังไม่ได้กำหนดฟิลด์ส่วนหัว
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ---------- หัวข้อตรวจ ---------- */}
      {blocks.map((block, bi) => {
        if (block.kind === "group") {
          const first = block.items[0].index + 1;
          const last = block.items[block.items.length - 1].index + 1;
          const [pass, fail] = VERDICT_WORDS[block.wording];
          return (
            <section key={`g-${bi}`} className="space-y-3">
              <h3 className="text-base font-semibold">
                ข้อ {first}–{last}
                <span className="ml-2 font-normal text-muted-foreground">
                  ตรวจแบบติ๊ก {pass} / {fail}
                </span>
              </h3>
              <Card className="py-0">
                <CardContent className="px-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-14 pl-4">ข้อ</TableHead>
                        <TableHead className="min-w-48">รายการตรวจ</TableHead>
                        <TableHead className="min-w-56">เกณฑ์มาตรฐาน</TableHead>
                        <TableHead className="w-48">ผลการตรวจ</TableHead>
                        <TableHead className="min-w-56 pr-4">
                          หมายเหตุ
                          <span className="block font-normal text-muted-foreground">
                            ไม่บังคับ
                          </span>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {block.items.map(({ item, index }) => (
                        <TableRow key={item.id}>
                          <TableCell className="pl-4 tabular-nums">
                            {index + 1}
                          </TableCell>
                          <TableCell className="font-medium">
                            {item.title || "—"}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {item.criteria || "—"}
                          </TableCell>
                          <TableCell>
                            <TickChoice id={item.id} pass={pass} fail={fail} />
                          </TableCell>
                          <TableCell className="pr-4">
                            {item.withNote ? (
                              <Input placeholder="—" />
                            ) : (
                              <span className="text-sm text-muted-foreground">
                                —
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </section>
          );
        }

        return (
          <ItemPreview
            key={block.item.id}
            item={block.item}
            index={block.index}
          />
        );
      })}

      {/* ---------- หมายเหตุรวม ---------- */}
      <div className="space-y-2">
        <Label htmlFor="preview-note">
          หมายเหตุอื่น ๆ{" "}
          <span className="font-normal text-muted-foreground">(ไม่บังคับ)</span>
        </Label>
        <Textarea id="preview-note" placeholder="ระบุหมายเหตุเพิ่มเติม" />
      </div>

      {/* ---------- เมื่อไม่ผ่าน ---------- */}
      {template.failActions.length > 0 && (
        <div className="space-y-3">
          <Separator />
          <div>
            <Label>
              ประเภทการรับสินค้า กรณีไม่ผ่านข้อใดข้อหนึ่ง
              {template.requireFailAction && (
                <Badge tone="warning" appearance="soft" className="ml-2">
                  บังคับเลือก
                </Badge>
              )}
            </Label>
          </div>
          <RadioGroup className="grid gap-3 @2xl:grid-cols-3">
            {template.failActions.map((a) => (
              <Label
                key={a.id}
                htmlFor={`fa-${a.id}`}
                className="flex items-center gap-3 rounded-lg border border-border p-3"
              >
                <RadioGroupItem id={`fa-${a.id}`} value={a.id} />
                {a.label || "ยังไม่ได้ตั้งชื่อ"}
              </Label>
            ))}
          </RadioGroup>
        </div>
      )}

      {/* ---------- ลงชื่อ ---------- */}
      <Separator />
      <div className="grid gap-4 @2xl:grid-cols-3">
        {template.signature.inspector && (
          <SignatureSlot label="ผู้ตรวจสอบ" hint="ลงชื่ออัตโนมัติจากผู้ใช้ที่ล็อกอิน" />
        )}
        {template.signature.time && (
          <SignatureSlot label="วันและเวลาที่ตรวจเสร็จ" hint="บันทึกอัตโนมัติเมื่อกดยืนยัน" />
        )}
        {template.signature.approver && (
          <SignatureSlot label="ผู้อนุมัติ" hint="ต้องมีหัวหน้ากดอนุมัติอีกชั้น" />
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------

function ItemPreview({ item, index }: { item: QcItem; index: number }) {
  const rounds = Math.max(1, item.repeatable ? item.defaultRounds : 1);
  const ruleText = describeRule(item.rule, item.columns[0]?.unit ?? "");
  const [pass, fail] = VERDICT_WORDS[item.verdictWording];
  const tick = showsTick(item);
  const autoStatus = showsAutoStatus(item);

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold">
            {index + 1}. {item.title || "ยังไม่ได้ตั้งชื่อหัวข้อ"}
          </h3>
          {(item.criteria || ruleText) && (
            <p className="mt-0.5 text-sm text-muted-foreground">
              เกณฑ์: {item.criteria || ruleText}
            </p>
          )}
        </div>
        {item.repeatable && (
          <Button variant="outline-primary" size="sm">
            <PlusIcon />
            เพิ่มครั้ง
          </Button>
        )}
      </div>

      {/* หัวข้อที่มีหัวข้อย่อย → ตารางของข้อย่อย */}
      {item.children.length > 0 ? (
        <Card className="py-0">
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-64 pl-4">หัวข้อย่อย</TableHead>
                  <TableHead className="min-w-56">เกณฑ์มาตรฐาน</TableHead>
                  <TableHead className="w-48">ผลการตรวจ</TableHead>
                  <TableHead className="min-w-48 pr-4">หมายเหตุ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {item.children.map((c, ci) => {
                  const [p, f] = VERDICT_WORDS[c.verdictWording];
                  return (
                    <TableRow key={c.id}>
                      <TableCell className="pl-4">
                        <span className="font-medium">
                          {index + 1}.{ci + 1} {c.title || "—"}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {c.criteria || "—"}
                      </TableCell>
                      <TableCell>
                        {showsTick(c) ? (
                          <TickChoice id={c.id} pass={p} fail={f} />
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            ระบบตัดสินให้
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="pr-4">
                        {c.withNote ? (
                          <Input placeholder="—" />
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : item.capture === "text" ? (
        <Textarea placeholder="กรอกรายละเอียด" />
      ) : (
        /* ตารางเดียวรองรับได้ทั้ง คีย์ค่า / ติ๊ก / ทั้งสองอย่าง */
        <Card className="py-0">
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  {item.repeatable && (
                    <TableHead className="w-20 pl-4">ครั้ง</TableHead>
                  )}

                  {item.capture === "number" &&
                    item.columns.map((c, ci) => (
                      <TableHead
                        key={c.id}
                        className={cellPad(
                          "min-w-32 text-right",
                          !item.repeatable && ci === 0
                        )}
                      >
                        {c.label || "—"}
                        {c.unit && (
                          <span className="block font-normal text-muted-foreground">
                            ({c.unit})
                          </span>
                        )}
                      </TableHead>
                    ))}

                  {item.withTime && (
                    <TableHead className="w-32 text-right">เวลาที่ตรวจ</TableHead>
                  )}

                  {tick && (
                    <TableHead
                      className={cellPad(
                        "w-48",
                        !item.repeatable && item.capture !== "number"
                      )}
                    >
                      ผลการตรวจ
                      <span className="block font-normal text-muted-foreground">
                        ผู้ตรวจติ๊กเอง
                      </span>
                    </TableHead>
                  )}

                  {item.withNote && (
                    <TableHead className="min-w-48">
                      หมายเหตุ
                      <span className="block font-normal text-muted-foreground">
                        ไม่บังคับ
                      </span>
                    </TableHead>
                  )}

                  {autoStatus && (
                    <TableHead className="w-32 pr-4 text-center">
                      สถานะ
                      <span className="block font-normal text-muted-foreground">
                        ระบบคำนวณ
                      </span>
                    </TableHead>
                  )}
                </TableRow>
              </TableHeader>

              <TableBody>
                {Array.from({ length: rounds }, (_, r) => (
                  <TableRow key={r}>
                    {item.repeatable && (
                      <TableCell className="pl-4 tabular-nums">{r + 1}</TableCell>
                    )}

                    {item.capture === "number" &&
                      item.columns.map((c, ci) => (
                        <TableCell
                          key={c.id}
                          className={cellPad("", !item.repeatable && ci === 0)}
                        >
                          <Input
                            type="number"
                            className="text-right tabular-nums"
                            placeholder="0.00"
                          />
                        </TableCell>
                      ))}

                    {item.withTime && (
                      <TableCell>
                        <Input type="time" className="tabular-nums" />
                      </TableCell>
                    )}

                    {tick && (
                      <TableCell
                        className={cellPad(
                          "",
                          !item.repeatable && item.capture !== "number"
                        )}
                      >
                        <TickChoice
                          id={`${item.id}-${r}`}
                          pass={pass}
                          fail={fail}
                        />
                      </TableCell>
                    )}

                    {item.withNote && (
                      <TableCell>
                        <Input placeholder="—" />
                      </TableCell>
                    )}

                    {autoStatus && (
                      <TableCell className="pr-4 text-center">
                        <span
                          className="inline-flex items-center gap-1 text-sm text-muted-foreground"
                          title="ยังไม่ได้คีย์ค่า"
                        >
                          <CircleDashedIcon className="size-4" />
                          รอค่า
                        </span>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {tick && autoStatus && (
        <p className="text-sm text-muted-foreground">
          ระบบจะขึ้นผลที่คำนวณจากเกณฑ์ในคอลัมน์สถานะ แต่ผลที่บันทึกจริงคือช่องที่ผู้ตรวจติ๊ก
        </p>
      )}
    </section>
  );
}

/** ช่องแรกของแถวต้องมี pl-4 ให้เสมอกับหัวข้ออื่น */
function cellPad(base: string, isFirst: boolean) {
  return isFirst ? `${base} pl-4`.trim() : base;
}

function TickChoice({
  id,
  pass,
  fail,
}: {
  id: string;
  pass: string;
  fail: string;
}) {
  return (
    <RadioGroup className="flex items-center gap-4">
      <Label htmlFor={`${id}-p`} className="flex items-center gap-2 font-normal">
        <RadioGroupItem id={`${id}-p`} value="pass" />
        {pass}
      </Label>
      <Label htmlFor={`${id}-f`} className="flex items-center gap-2 font-normal">
        <RadioGroupItem id={`${id}-f`} value="fail" />
        {fail}
      </Label>
    </RadioGroup>
  );
}

function HeaderFieldPreview({ field }: { field: HeaderField }) {
  const id = `hfp-${field.id}`;
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {field.label || "ยังไม่ได้ตั้งชื่อฟิลด์"}
        {field.required && (
          <span className="ml-1 text-muted-foreground">*</span>
        )}
      </Label>

      {field.kind === "select" ? (
        <Select>
          <SelectTrigger id={id} className="w-full">
            <SelectValue placeholder="เลือก" />
          </SelectTrigger>
          <SelectContent>
            {field.options.map((o) => (
              <SelectItem key={o} value={o}>
                {o}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : field.kind === "ref" ? (
        <Select>
          <SelectTrigger id={id} className="w-full">
            <SelectValue placeholder={`เลือกจาก${field.source ?? "ระบบ"}`} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sample-1">ตัวอย่างรายการที่ 1</SelectItem>
            <SelectItem value="sample-2">ตัวอย่างรายการที่ 2</SelectItem>
          </SelectContent>
        </Select>
      ) : (
        <Input
          id={id}
          type={
            field.kind === "number"
              ? "number"
              : field.kind === "date"
                ? "date"
                : field.kind === "time"
                  ? "time"
                  : "text"
          }
        />
      )}
    </div>
  );
}

function SignatureSlot({ label, hint }: { label: string; hint: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border p-4">
      <p className="text-sm font-medium">{label}</p>
      <p className="mt-1 text-sm text-muted-foreground">{hint}</p>
    </div>
  );
}
