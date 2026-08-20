"use client";

import * as React from "react";
import { CircleDashedIcon, PlusIcon, Trash2Icon } from "lucide-react";
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
  NOTE_COLUMN_HINT,
  VERDICT_WORDS,
  buildPreviewBlocks,
  describeItemRules,
  showsAutoStatus,
  showsTick,
  type HeaderField,
  type QcItem,
  type QcTemplate,
} from "@/lib/qc-template";

/**
 * หัวตารางในหน้านี้เกือบทุกช่องมีสองบรรทัด — ชื่อคอลัมน์กับคำอธิบายใต้ชื่อ
 * เช่น "ผลการตรวจ / ผู้ตรวจติ๊กเอง" หรือ "หมายเหตุ / บังคับเมื่อไม่ผ่าน"
 * h-10 ของ DS ตั้งไว้สำหรับหัวบรรทัดเดียว สองบรรทัดแล้วตัวหนังสือชนขอบบนล่าง
 * ปล่อยให้สูงตามเนื้อหาแล้วให้ระยะห่างบนล่างเท่ากันแทน
 */
const HEAD_TALL = "[&_th]:h-auto [&_th]:py-3 [&_th]:leading-snug";

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
          // ข้อในตารางเดียวกันตั้งหมายเหตุไม่เหมือนกันได้ หัวคอลัมน์จึงบอกได้
          // เฉพาะตอนทุกข้อตรงกัน ไม่งั้นเขียนไปก็ผิดกับบางแถวอยู่ดี
          const noteModes = new Set(block.items.map(({ item }) => item.note));
          const groupNote = noteModes.size === 1 ? [...noteModes][0] : null;
          const showNote = groupNote !== "off";
          // เว้นเกณฑ์ไว้ทุกข้อ = ตารางนี้ไม่มีคอลัมน์เกณฑ์ ไม่ใช่มีคอลัมน์ที่เต็มไปด้วยขีด
          // มีบางข้อกรอกไว้ คอลัมน์ยังต้องอยู่ ข้อที่ว่างค่อยขึ้นขีดตามเดิม
          const showCriteria = block.items.some(({ item }) => item.criteria.trim());
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
                    <TableHeader className={HEAD_TALL}>
                      <TableRow>
                        <TableHead className="w-14 pl-4">ข้อ</TableHead>
                        <TableHead className="min-w-48">รายการตรวจ</TableHead>
                        {showCriteria && (
                          <TableHead className="min-w-56">เกณฑ์มาตรฐาน</TableHead>
                        )}
                        <TableHead className="w-48">ผลการตรวจ</TableHead>
                        {showNote && (
                          <TableHead className="min-w-56 pr-4">
                            หมายเหตุ
                            {groupNote && (
                              <span className="block font-normal text-muted-foreground">
                                {NOTE_COLUMN_HINT[groupNote]}
                              </span>
                            )}
                          </TableHead>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {block.items.map(({ item, index }) => (
                        <TableRow key={item.id}>
                          <TableCell className="pl-4 tabular-nums">
                            {index + 1}
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">
                              {item.title || "—"}
                            </span>
                            {item.description && (
                              <span className="block font-normal text-muted-foreground">
                                {item.description}
                              </span>
                            )}
                          </TableCell>
                          {showCriteria && (
                            <TableCell className="text-muted-foreground">
                              {item.criteria || "—"}
                            </TableCell>
                          )}
                          <TableCell>
                            <TickChoice id={item.id} pass={pass} fail={fail} />
                          </TableCell>
                          {showNote && (
                            <TableCell className="pr-4">
                              {item.note !== "off" ? (
                                <Input placeholder="—" />
                              ) : (
                                <span className="text-sm text-muted-foreground">
                                  —
                                </span>
                              )}
                            </TableCell>
                          )}
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

      {/* ---------- อื่นๆ — แทนบรรทัดว่างท้ายฟอร์มกระดาษ ---------- */}
      {template.allowAdHocItems && <AdHocItemsPreview />}

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

/**
 * หัวข้อที่ผู้ตรวจพิมพ์เองระหว่างตรวจจริง — คนละแบบกับหัวข้อที่ตั้งไว้ล่วงหน้า
 * ในตัวสร้าง จึงเริ่มจากศูนย์แถวเสมอ ไม่มีอะไรให้ preview ล่วงหน้า
 * นอกจากปุ่ม "เพิ่มรายการ" ที่ผู้ตรวจจะเห็นตอนใช้งานจริง
 */
function AdHocItemsPreview() {
  const [rows, setRows] = React.useState<number[]>([]);
  const nextId = React.useRef(0);

  return (
    <div className="space-y-3">
      <Separator />
      <div className="flex items-center justify-between gap-3">
        <div>
          <Label>อื่น ๆ</Label>
          <p className="text-sm text-muted-foreground">
            ผู้ตรวจเพิ่มหัวข้อตรวจเองได้ระหว่างตรวจจริง
          </p>
        </div>
        <Button
          variant="outline-primary"
          size="sm"
          onClick={() => {
            nextId.current += 1;
            setRows((r) => [...r, nextId.current]);
          }}
        >
          <PlusIcon />
          เพิ่มรายการ
        </Button>
      </div>

      {rows.length > 0 && (
        <div className="space-y-2">
          {rows.map((id) => (
            <div key={id} className="flex items-center gap-2">
              <Input placeholder="ระบุหัวข้อตรวจ" className="flex-1" />
              <TickChoice id={`adhoc-${id}`} pass="ผ่าน" fail="ไม่ผ่าน" />
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="ลบรายการ"
                onClick={() => setRows((r) => r.filter((x) => x !== id))}
              >
                <Trash2Icon />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------

function ItemPreview({ item, index }: { item: QcItem; index: number }) {
  const rounds = Math.max(1, item.repeatable ? item.defaultRounds : 1);
  const ruleText = describeItemRules(item);
  const [pass, fail] = VERDICT_WORDS[item.verdictWording];
  const tick = showsTick(item);
  const autoStatus = showsAutoStatus(item);
  // เว้นเกณฑ์ไว้ทุกข้อย่อย = ไม่มีคอลัมน์เกณฑ์ เหมือนตารางข้อที่ติ๊กอย่างเดียว
  const childCriteria = item.children.some((c) => c.criteria.trim());
  const childNote = item.children.some((c) => c.note !== "off");

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold">
            {index + 1}. {item.title || "ยังไม่ได้ตั้งชื่อหัวข้อ"}
          </h3>
          {item.description && (
            <p className="mt-0.5 text-sm text-muted-foreground">
              {item.description}
            </p>
          )}
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
              <TableHeader className={HEAD_TALL}>
                <TableRow>
                  <TableHead className="min-w-64 pl-4">หัวข้อย่อย</TableHead>
                  {childCriteria && (
                    <TableHead className="min-w-56">เกณฑ์มาตรฐาน</TableHead>
                  )}
                  <TableHead className="w-48">ผลการตรวจ</TableHead>
                  {childNote && (
                    <TableHead className="min-w-48 pr-4">หมายเหตุ</TableHead>
                  )}
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
                        {c.description && (
                          <span className="block font-normal text-muted-foreground">
                            {c.description}
                          </span>
                        )}
                      </TableCell>
                      {childCriteria && (
                        <TableCell className="text-muted-foreground">
                          {c.criteria || "—"}
                        </TableCell>
                      )}
                      <TableCell>
                        {showsTick(c) ? (
                          <TickChoice id={c.id} pass={p} fail={f} />
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            ระบบตัดสินให้
                          </span>
                        )}
                      </TableCell>
                      {childNote && (
                        <TableCell className="pr-4">
                          {c.note !== "off" ? (
                            <Input placeholder="—" />
                          ) : (
                            <span className="text-sm text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        /* ตารางเดียวรองรับได้ทั้ง คีย์ค่า / ติ๊ก / ทั้งสองอย่าง */
        <Card className="py-0">
          <CardContent className="px-0">
            <Table>
              <TableHeader className={HEAD_TALL}>
                <TableRow>
                  {item.repeatable && (
                    <TableHead className="w-20 pl-4">ครั้ง</TableHead>
                  )}

                  {item.fields.map((f, ci) => (
                    <TableHead
                      key={f.id}
                      className={cellPad(
                        f.type === "number" ? "min-w-32 text-right" : "min-w-48",
                        !item.repeatable && ci === 0
                      )}
                    >
                      {f.label || "—"}
                      {f.type === "number" && f.unit && (
                        <span className="block font-normal text-muted-foreground">
                          ({f.unit})
                        </span>
                      )}
                    </TableHead>
                  ))}

                  {item.withDate && (
                    <TableHead className="w-40">วันที่ตรวจ</TableHead>
                  )}

                  {item.withTime && (
                    <TableHead className="w-32 text-right">เวลาที่ตรวจ</TableHead>
                  )}

                  {tick && (
                    <TableHead
                      className={cellPad(
                        "w-48",
                        !item.repeatable &&
                          item.fields.length === 0 &&
                          !item.withDate &&
                          !item.withTime
                      )}
                    >
                      ผลการตรวจ
                      <span className="block font-normal text-muted-foreground">
                        ผู้ตรวจติ๊กเอง
                      </span>
                    </TableHead>
                  )}

                  {item.note !== "off" && (
                    <TableHead className="min-w-48">
                      หมายเหตุ
                      <span className="block font-normal text-muted-foreground">
                        {NOTE_COLUMN_HINT[item.note]}
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

                    {item.fields.map((f, ci) => (
                      <TableCell
                        key={f.id}
                        className={cellPad("", !item.repeatable && ci === 0)}
                      >
                        {f.type === "number" ? (
                          <Input
                            type="number"
                            className="text-right tabular-nums"
                            placeholder="0.00"
                          />
                        ) : (
                          <Input placeholder="—" />
                        )}
                      </TableCell>
                    ))}

                    {item.withDate && (
                      <TableCell>
                        <Input type="date" className="tabular-nums" />
                      </TableCell>
                    )}

                    {item.withTime && (
                      <TableCell>
                        <Input type="time" className="tabular-nums" />
                      </TableCell>
                    )}

                    {tick && (
                      <TableCell
                        className={cellPad(
                          "",
                          !item.repeatable &&
                          item.fields.length === 0 &&
                          !item.withDate &&
                          !item.withTime
                        )}
                      >
                        <TickChoice
                          id={`${item.id}-${r}`}
                          pass={pass}
                          fail={fail}
                        />
                      </TableCell>
                    )}

                    {item.note !== "off" && (
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
