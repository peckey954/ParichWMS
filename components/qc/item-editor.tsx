"use client";

import * as React from "react";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  CopyIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import { Badge } from "@peckey954/ui/components/ui/badge";
import { Button } from "@peckey954/ui/components/ui/button";
import { Card, CardContent } from "@peckey954/ui/components/ui/card";
import { Input } from "@peckey954/ui/components/ui/input";
import { Label } from "@peckey954/ui/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@peckey954/ui/components/ui/select";
import { cn } from "@peckey954/ui/lib/utils";
import { ChoiceGroup } from "@/components/choice-group";
import { ItemSettingsDialog } from "@/components/qc/item-settings-dialog";
import {
  FIELD_TYPE_LABEL,
  RULE_OP_LABEL,
  UNIT_OPTIONS,
  cloneItemDeep,
  emptyRule,
  hasNumericRule,
  itemBadges,
  newField,
  newItem,
  pickSettings,
  type FieldType,
  type ItemSettings,
  type QcField,
  type QcItem,
  type RuleOp,
} from "@/lib/qc-template";

/* ------------------------------------------------------------------
   การ์ดหัวข้อตรวจหนึ่งข้อ

   บนการ์ดมีแต่ของที่เป็นของข้อนี้ข้อเดียว — ชื่อ เกณฑ์ ช่องที่ต้องกรอก
   และหัวข้อย่อย ส่วน "ตรวจยังไง บันทึกยังไง" อยู่ในกล่องรูปแบบการตรวจ
   เพราะเป็นก้อนที่ยกไปใช้กับข้ออื่นทั้งก้อนได้

   ป้ายบนหัวการ์ดขึ้นเฉพาะค่าที่ไม่ใช่ค่าเริ่มต้น การ์ดที่มีป้ายจึงแปลว่า
   ข้อนี้ตั้งไว้ไม่เหมือนชาวบ้าน ซึ่งคือสิ่งเดียวที่ต้องรีบเห็นตอนกวาดตาดูทั้งฟอร์ม
------------------------------------------------------------------ */

function moveIn<T>(list: T[], i: number, dir: -1 | 1): T[] {
  const j = i + dir;
  if (j < 0 || j >= list.length) return list;
  const next = [...list];
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}

export function ItemEditor({
  item,
  index,
  total,
  depth = 0,
  onPatch,
  onMove,
  onRemove,
  onDuplicate,
  onApplyToAll,
}: {
  item: QcItem;
  index: number;
  total: number;
  depth?: number;
  onPatch: (patch: Partial<QcItem>) => void;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
  onDuplicate: () => void;
  /** ยกรูปแบบการตรวจของข้อนี้ไปใช้กับทุกข้อในฟอร์ม — มีเฉพาะหัวข้อหลัก */
  onApplyToAll?: (settings: ItemSettings) => void;
}) {
  const isChild = depth > 0;
  const label = isChild ? `หัวข้อย่อยที่ ${index + 1}` : `หัวข้อที่ ${index + 1}`;
  const badges = itemBadges(item);

  const patchField = (id: string, p: Partial<QcField>) =>
    onPatch({
      fields: item.fields.map((f) => (f.id === id ? { ...f, ...p } : f)),
    });

  return (
    <Card className={cn(isChild && "border-dashed")}>
      <CardContent className="space-y-4">
        {/* ---- แถวบน: ลำดับ + ป้ายสรุป + ปุ่มจัดการ ----
             จอแคบเรียงสามชั้น ชื่อกับปุ่มไอคอนบรรทัดแรก ป้ายบรรทัดสอง
             แล้วปุ่มรูปแบบการตรวจเต็มความกว้างบรรทัดสาม
             ยัดทุกอย่างบรรทัดเดียวบน 326px แล้วปุ่มจะตกบรรทัดมั่วไปหมด
             จอกว้างสลับลำดับกลับเป็นแถวเดียวด้วย order ไม่ต้องมี DOM สองชุด */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="order-1 font-semibold">{label}</span>

          <div className="order-2 ml-auto flex shrink-0 items-center gap-1 @2xl:order-4 @2xl:ml-0">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="เลื่อนขึ้น"
              disabled={index === 0}
              onClick={() => onMove(-1)}
            >
              <ChevronUpIcon />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="เลื่อนลง"
              disabled={index === total - 1}
              onClick={() => onMove(1)}
            >
              <ChevronDownIcon />
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
              aria-label="ลบหัวข้อ"
              onClick={onRemove}
            >
              <Trash2Icon />
            </Button>
          </div>

          {badges.length > 0 || item.children.length > 0 ? (
            <div className="order-3 flex w-full flex-wrap items-center gap-2 @2xl:order-2 @2xl:w-auto @2xl:flex-1">
              {badges.map((b) => (
                <Badge key={b} tone="neutral" appearance="soft">
                  {b}
                </Badge>
              ))}
              {item.children.length > 0 && (
                <Badge tone="neutral" appearance="outline">
                  หัวข้อย่อย {item.children.length}
                </Badge>
              )}
            </div>
          ) : (
            // ไม่มีป้ายก็ยังต้องมีตัวดันปุ่มไปชิดขวาบนจอกว้าง
            <div className="order-2 hidden flex-1 @2xl:block" />
          )}

          <div className="order-4 w-full @2xl:order-3 @2xl:w-auto">
            <ItemSettingsDialog
              className="w-full @2xl:w-auto"
              title={label}
              settings={pickSettings(item)}
              canAutoJudge={hasNumericRule(item)}
              onApply={(s) => onPatch(s)}
              onApplyToAll={onApplyToAll}
            />
          </div>
        </div>

        {/* ---- ชื่อหัวข้อกับเกณฑ์ ---- */}
        <div className="grid gap-4 @2xl:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={`${item.id}-title`}>หัวข้อ</Label>
            <Input
              id={`${item.id}-title`}
              value={item.title}
              placeholder="ระบุชื่อหัวข้อ"
              className="bg-card"
              onChange={(e) => onPatch({ title: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${item.id}-criteria`}>
              เกณฑ์{" "}
              <span className="font-normal text-muted-foreground">
                (ไม่บังคับ)
              </span>
            </Label>
            <Input
              id={`${item.id}-criteria`}
              value={item.criteria}
              placeholder="รายละเอียดเกณฑ์"
              className="bg-card"
              onChange={(e) => onPatch({ criteria: e.target.value })}
            />
          </div>

          {/* ข้อความย่อยใต้ชื่อหัวข้อ — บางข้อต้องบอกวิธีตรวจเพิ่ม
              เช่นสุ่มจากตรงไหน ใช้เครื่องมืออะไร ซึ่งยัดลงชื่อหัวข้อไม่ได้
              เว้นว่าง = ไม่มีบรรทัดนี้ในใบตรวจ ไม่ต้องมีติ๊กเปิด/ปิดอีกที */}
          <div className="space-y-2 @2xl:col-span-2">
            <Label htmlFor={`${item.id}-desc`}>
              รายละเอียดหัวข้อ{" "}
              <span className="font-normal text-muted-foreground">
                (ไม่บังคับ)
              </span>
            </Label>
            <Input
              id={`${item.id}-desc`}
              value={item.description}
              placeholder="ข้อความย่อยใต้ชื่อหัวข้อ — เว้นว่างได้"
              className="bg-card"
              onChange={(e) => onPatch({ description: e.target.value })}
            />
          </div>
        </div>

        {/* ---- ช่องที่ผู้ตรวจต้องกรอก ----
             ไม่มีสวิตช์เปิด/ปิดส่วนนี้ เพราะ "มีช่องกี่ช่อง" ตอบตัวเองอยู่แล้ว
             ปิดสวิตช์ทั้งที่มีช่องอยู่สามช่องแปลว่ามีข้อมูลที่มองไม่เห็น */}
        <FieldsSection
          item={item}
          onAdd={() => onPatch({ fields: [...item.fields, newField()] })}
          onPatchField={patchField}
          onRemoveField={(id) =>
            onPatch({ fields: item.fields.filter((f) => f.id !== id) })
          }
        />

        {/* ---- หัวข้อย่อย — ซ้อนได้ชั้นเดียว ---- */}
        {!isChild && (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <Label>หัวข้อย่อย</Label>
              <Button
                variant="outline-primary"
                size="sm"
                onClick={() =>
                  onPatch({ children: [...item.children, newItem()] })
                }
              >
                <PlusIcon />
                หัวข้อย่อย
              </Button>
            </div>

            {item.children.length > 0 && (
              <div className="space-y-3">
                {item.children.map((child, ci) => (
                  <ItemEditor
                    key={child.id}
                    item={child}
                    index={ci}
                    total={item.children.length}
                    depth={depth + 1}
                    onPatch={(p) =>
                      onPatch({
                        children: item.children.map((x) =>
                          x.id === child.id ? { ...x, ...p } : x
                        ),
                      })
                    }
                    onMove={(dir) =>
                      onPatch({ children: moveIn(item.children, ci, dir) })
                    }
                    onRemove={() =>
                      onPatch({
                        children: item.children.filter((x) => x.id !== child.id),
                      })
                    }
                    onDuplicate={() => {
                      const children = [...item.children];
                      children.splice(ci + 1, 0, cloneItemDeep(child));
                      onPatch({ children });
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------

function FieldsSection({
  item,
  onAdd,
  onPatchField,
  onRemoveField,
}: {
  item: QcItem;
  onAdd: () => void;
  onPatchField: (id: string, p: Partial<QcField>) => void;
  onRemoveField: (id: string) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <Label>การระบุข้อมูล</Label>
        <Button variant="outline-primary" size="sm" onClick={onAdd}>
          <PlusIcon />
          เพิ่มข้อมูล
        </Button>
      </div>

      {item.fields.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          ไม่มีช่องให้กรอก — หัวข้อนี้ผู้ตรวจติ๊กผลอย่างเดียว
        </p>
      ) : (
        <div className="space-y-3">
          {item.fields.map((f, i) => (
            <FieldCard
              key={f.id}
              field={f}
              index={i}
              onPatch={(p) => onPatchField(f.id, p)}
              onRemove={() => onRemoveField(f.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * หนึ่งช่องที่ผู้ตรวจต้องกรอก
 *
 * เกณฑ์ตัวเลขอยู่ในการ์ดนี้ ไม่ได้อยู่ระดับหัวข้อเหมือนเดิม
 * เพราะหัวข้อเดียวมีได้หลายช่อง (สูตรปุ๋ยมี N, P, K) แล้วแต่ละตัวมีช่วงของตัวเอง
 * ของเดิมมีเกณฑ์เดียวต่อหัวข้อ จึงบังคับให้ทุกช่องใช้ช่วงเดียวกันหมด
 *
 * ช่องข้อความไม่มีหน่วยและไม่มีเกณฑ์ — สองอันนั้นแปลความกับตัวหนังสือไม่ได้
 */
function FieldCard({
  field: f,
  index,
  onPatch,
  onRemove,
}: {
  field: QcField;
  index: number;
  onPatch: (p: Partial<QcField>) => void;
  onRemove: () => void;
}) {
  const isNumber = f.type === "number";

  return (
    <Card className="border-dashed py-0">
      <CardContent className="space-y-4 px-4 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-sm font-medium">
            การระบุข้อมูลที่ {index + 1}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">ประเภท</span>
            <ChoiceGroup
              fill={false}
              label="ประเภทข้อมูล"
              options={(["text", "number"] as FieldType[]).map((t) => ({
                id: t,
                label: FIELD_TYPE_LABEL[t],
              }))}
              value={f.type}
              onChange={(type) =>
                // สลับไปข้อความแล้วหน่วยกับเกณฑ์ไม่มีความหมาย ล้างทิ้งไม่ให้ค้างเป็นข้อมูลที่มองไม่เห็น
                onPatch(
                  type === "text"
                    ? { type, unit: "", rule: emptyRule() }
                    : { type }
                )
              }
            />
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="ลบช่องนี้"
              onClick={onRemove}
            >
              <Trash2Icon />
            </Button>
          </div>
        </div>

        <div className="grid gap-4 @2xl:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={`${f.id}-label`}>ชื่อข้อมูล</Label>
            <Input
              id={`${f.id}-label`}
              value={f.label}
              placeholder="ระบุชื่อข้อมูล"
              className="bg-card"
              onChange={(e) => onPatch({ label: e.target.value })}
            />
          </div>

          {isNumber && (
            <div className="space-y-2">
              <Label htmlFor={`${f.id}-unit`}>หน่วย</Label>
              <Select
                value={f.unit || "none"}
                onValueChange={(v) => onPatch({ unit: v === "none" ? "" : v })}
              >
                <SelectTrigger id={`${f.id}-unit`} className="w-full bg-card">
                  <SelectValue placeholder="เลือกหน่วย" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">ไม่มีหน่วย</SelectItem>
                  {UNIT_OPTIONS.map((u) => (
                    <SelectItem key={u} value={u}>
                      {u}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {isNumber && (
          <div className="grid gap-4 @2xl:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor={`${f.id}-op`}>เกณฑ์ตัวเลข</Label>
              <Select
                value={f.rule.op}
                onValueChange={(v) =>
                  onPatch({ rule: { ...f.rule, op: v as RuleOp } })
                }
              >
                <SelectTrigger id={`${f.id}-op`} className="w-full bg-card">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(RULE_OP_LABEL) as RuleOp[]).map((op) => (
                    <SelectItem key={op} value={op}>
                      {RULE_OP_LABEL[op]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {(f.rule.op === "gte" || f.rule.op === "between") && (
              <div className="space-y-2">
                <Label htmlFor={`${f.id}-min`}>ค่าต่ำสุด</Label>
                <Input
                  id={`${f.id}-min`}
                  type="number"
                  className="bg-card text-right tabular-nums"
                  value={f.rule.min ?? ""}
                  onChange={(e) =>
                    onPatch({
                      rule: {
                        ...f.rule,
                        min:
                          e.target.value === "" ? null : Number(e.target.value),
                      },
                    })
                  }
                />
              </div>
            )}

            {(f.rule.op === "lte" || f.rule.op === "between") && (
              <div className="space-y-2">
                <Label htmlFor={`${f.id}-max`}>ค่าสูงสุด</Label>
                <Input
                  id={`${f.id}-max`}
                  type="number"
                  className="bg-card text-right tabular-nums"
                  value={f.rule.max ?? ""}
                  onChange={(e) =>
                    onPatch({
                      rule: {
                        ...f.rule,
                        max:
                          e.target.value === "" ? null : Number(e.target.value),
                      },
                    })
                  }
                />
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
