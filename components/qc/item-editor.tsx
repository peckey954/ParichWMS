"use client";

import * as React from "react";
import { CopyIcon, PlusIcon, Trash2Icon } from "lucide-react";
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
import { DRAG_ITEM_ATTR, DragHandle } from "@/components/drag-handle";
import { ItemSettingsDialog } from "@/components/qc/item-settings-dialog";
import { Stepper } from "@/components/stepper";
import {
  FIELD_TYPE_HINT,
  FIELD_TYPE_LABEL,
  REF_SOURCES,
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
   และหัวข้อย่อย ส่วน "ตรวจยังไง บันทึกยังไง" อยู่ในกล่องการแสดงข้อมูล
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
  /** ยกการแสดงข้อมูลของข้อนี้ไปใช้กับทุกข้อในฟอร์ม — มีเฉพาะหัวข้อหลัก */
  onApplyToAll?: (settings: ItemSettings) => void;
}) {
  const isChild = depth > 0;
  const isRows = item.kind === "rows";
  const label = isChild ? `หัวข้อย่อยที่ ${index + 1}` : `หัวข้อที่ ${index + 1}`;
  const badges = itemBadges(item);

  const patchField = (id: string, p: Partial<QcField>) =>
    onPatch({
      fields: item.fields.map((f) => (f.id === id ? { ...f, ...p } : f)),
    });

  return (
    <Card {...{ [DRAG_ITEM_ATTR]: "" }} className={cn(isChild && "border-dashed")}>
      <CardContent className="space-y-4">
        {/* ---- แถวบน: ลำดับ + ป้ายสรุป + ปุ่มจัดการ ----
             จอแคบเรียงสามชั้น ชื่อกับปุ่มไอคอนบรรทัดแรก ป้ายบรรทัดสอง
             แล้วปุ่มการแสดงข้อมูลเต็มความกว้างบรรทัดสาม
             ยัดทุกอย่างบรรทัดเดียวบน 326px แล้วปุ่มจะตกบรรทัดมั่วไปหมด
             จอกว้างสลับลำดับกลับเป็นแถวเดียวด้วย order ไม่ต้องมี DOM สองชุด */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="order-1 font-semibold">{label}</span>

          <div className="order-2 ml-auto flex shrink-0 items-center gap-1 @2xl:order-4 @2xl:ml-0">
            {/* ปุ่มเดียวลากขึ้นลง แทนลูกศรสองปุ่ม
                ย้ายข้อ 8 ไปข้อ 2 ด้วยลูกศรคือกดหกครั้ง ลากทีเดียวจบ
                ปิดเมื่อมีใบเดียว เพราะไม่มีอะไรให้สลับด้วย */}
            <DragHandle
              label={label}
              disabled={total < 2}
              onMove={onMove}
            />
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
              placeholder="ข้อความย่อยใต้ชื่อหัวข้อ"
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
          isRows={isRows}
          onAdd={() => onPatch({ fields: [...item.fields, newField()] })}
          onPatchField={patchField}
          onRemoveField={(id) =>
            onPatch({ fields: item.fields.filter((f) => f.id !== id) })
          }
        />

        {/* ---- จำนวนในการตรวจ (เฉพาะหัวข้อย่อย) ----
             หัวข้อหลักย้ายไปตั้งรวมที่ "4. จำนวนในการตรวจ" ของทั้งฟอร์มแล้ว (มีผลกับทุกหัวข้อ
             หลักพร้อมกัน ไม่ต้องไล่ตั้งทีละข้อ) แต่หัวข้อย่อยอยู่นอกเหนือจากตรงนั้น เพราะหัวข้อย่อย
             ไม่ได้ตรวจซ้ำพร้อมกับหัวข้อหลักเสมอไป จึงยังต้องมีจุดตั้งของตัวเองอยู่ที่นี่ */}
        {isChild && (
          <div className="space-y-2">
            <Label>จำนวนในการตรวจ</Label>
            <RepeatCountFields item={item} onPatch={onPatch} />
          </div>
        )}

        {/* ---- หัวข้อย่อย — ซ้อนได้ชั้นเดียว ---- */}
        {!isChild && !isRows && (
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

/**
 * "ครั้งเดียว/ตรวจซ้ำได้หลายครั้ง" ของข้อแบบ "รายครั้ง" (kind ไม่ใช่ rows)
 * ใช้ร่วมกันทั้งหัวข้อหลักและหัวข้อย่อย เพราะหัวข้อย่อยก็ตรวจซ้ำเป็นรอบได้เหมือนกัน
 * แค่ไม่มีให้เลือกประเภทการตรวจเอง (หัวข้อย่อยเป็น "รายครั้ง" เสมอ ไม่มีทางเป็นตาราง)
 */
/**
 * ไม่มีสวิตช์ "ครั้งเดียว/หลายครั้ง" แยกอีกชั้น — จำนวนขั้นต่ำ/สูงสุดตอบเรื่องนี้อยู่แล้ว
 * ตั้งเป็น 1/1 ก็คือครั้งเดียว ค่าเริ่มต้นของหัวข้อใหม่จึงเป็น 1/1 เสมอ
 * repeatable ในข้อมูลยังอยู่ (ใช้จริงตอนตรวจ) แค่อนุมานจาก maxRounds > 1 แทนที่จะมีสวิตช์
 * ให้ตั้งเองซ้ำกับตัวเลข
 */
function RepeatCountFields({
  item,
  onPatch,
}: {
  item: QcItem;
  onPatch: (patch: Partial<QcItem>) => void;
}) {
  return (
    <div className="grid gap-3 @2xl:grid-cols-2">
      <Stepper
        label="จำนวนขั้นต่ำ"
        value={item.defaultRounds}
        min={1}
        max={item.maxRounds}
        onChange={(defaultRounds) => onPatch({ defaultRounds })}
      />
      <Stepper
        label="เพิ่มได้สูงสุด"
        value={item.maxRounds}
        min={item.defaultRounds}
        max={99}
        onChange={(maxRounds) => onPatch({ maxRounds, repeatable: maxRounds > 1 })}
      />
    </div>
  );
}

function FieldsSection({
  item,
  isRows,
  onAdd,
  onPatchField,
  onRemoveField,
}: {
  item: QcItem;
  /** ตารางเพิ่มแถวเอง — ช่องชุดเดียวกันนี้กลายเป็นคอลัมน์ จึงต้องเรียกให้ตรงกับที่เห็น */
  isRows: boolean;
  onAdd: () => void;
  onPatchField: (id: string, p: Partial<QcField>) => void;
  onRemoveField: (id: string) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <Label>{isRows ? "คอลัมน์ในตาราง" : "การระบุข้อมูล"}</Label>
        <Button variant="outline-primary" size="sm" onClick={onAdd}>
          <PlusIcon />
          {isRows ? "เพิ่มคอลัมน์" : "เพิ่มข้อมูล"}
        </Button>
      </div>

      {item.fields.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {isRows
            ? "ยังไม่มีคอลัมน์ — ตารางจะมีแต่ช่องผลตรวจกับหมายเหตุ"
            : "ไม่มีช่องให้กรอก — หัวข้อนี้ผู้ตรวจติ๊กผลอย่างเดียว"}
        </p>
      ) : (
        <div className="space-y-3">
          {item.fields.map((f, i) => (
            <FieldCard
              key={f.id}
              field={f}
              index={i}
              isRows={isRows}
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
  isRows,
  onPatch,
  onRemove,
}: {
  field: QcField;
  index: number;
  isRows: boolean;
  onPatch: (p: Partial<QcField>) => void;
  onRemove: () => void;
}) {
  const isNumber = f.type === "number";

  /**
   * สลับประเภทแล้วต้องล้างของที่ประเภทใหม่ใช้ไม่ได้ทิ้ง
   * ไม่งั้นหน่วย เกณฑ์ ตัวเลือก จะค้างอยู่เป็นข้อมูลที่มองไม่เห็นแต่ยังถูกบันทึก
   * แล้วสลับกลับมาทีหลังเจอค่าเก่าโผล่ขึ้นมาเองโดยไม่มีใครสั่ง
   */
  const switchType = (type: FieldType) =>
    onPatch({
      type,
      unit: type === "number" ? f.unit : "",
      rule: type === "number" ? f.rule : emptyRule(),
      options: type === "choice" ? f.options : [],
      source: type === "ref" ? f.source : "",
    });

  return (
    <Card className="border-dashed py-0">
      <CardContent className="space-y-4 px-4 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-sm font-medium">
            {isRows ? "คอลัมน์ที่" : "การระบุข้อมูลที่"} {index + 1}
          </span>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="ลบช่องนี้"
            onClick={onRemove}
          >
            <Trash2Icon />
          </Button>
        </div>

        {/* สี่ประเภทลงแถวเดียวกับป้าย "ประเภท" ไม่พอที่บนจอแคบ
            แยกเป็นบรรทัดของตัวเองแล้วชิปตกบรรทัดได้ตามปกติ */}
        <div className="space-y-2">
          <Label>ประเภทข้อมูล</Label>
          <ChoiceGroup
            label="ประเภทข้อมูล"
            options={(["text", "number", "choice", "ref"] as FieldType[]).map(
              (t) => ({ id: t, label: FIELD_TYPE_LABEL[t] })
            )}
            value={f.type}
            onChange={switchType}
          />
          <p className="text-sm text-muted-foreground">
            {FIELD_TYPE_HINT[f.type]}
          </p>
        </div>

        <div className="grid gap-4 @2xl:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={`${f.id}-label`}>
              {isRows ? "ชื่อคอลัมน์" : "ชื่อข้อมูล"}
            </Label>
            <Input
              id={`${f.id}-label`}
              value={f.label}
              placeholder={isRows ? "ระบุชื่อคอลัมน์" : "ระบุชื่อข้อมูล"}
              className="bg-card"
              onChange={(e) => onPatch({ label: e.target.value })}
            />
          </div>

          {f.type === "ref" && (
            <div className="space-y-2">
              <Label htmlFor={`${f.id}-src`}>ดึงจากตาราง</Label>
              <Select
                value={f.source || "none"}
                onValueChange={(v) => onPatch({ source: v === "none" ? "" : v })}
              >
                <SelectTrigger id={`${f.id}-src`} className="w-full bg-card">
                  <SelectValue placeholder="เลือกตาราง" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">ยังไม่ได้เลือก</SelectItem>
                  {REF_SOURCES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

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

        {f.type === "choice" && (
          <CommaOptionsInput
            id={`${f.id}-options`}
            options={f.options}
            onChange={(options) => onPatch({ options })}
          />
        )}

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

/**
 * คำที่ผู้ตรวจเลือกได้ในช่องแบบตัวเลือก
 *
 * ตั้งเป็นคำ ไม่ใช่เลข 1/2/3 เพราะเลขต้องมีคำอธิบายกำกับอยู่ดี
 * ฟอร์มกระดาษเขียน "(1) วัตถุดิบ (2) ผลิตภัณฑ์" ก็เพราะเขียนคำเต็มทุกช่องไม่ไหว
 * ในจอไม่มีข้อจำกัดนั้น เก็บคำไปเลยแล้วไม่ต้องมีใครจำว่า 2 แปลว่าอะไร
 */
/**
 * ตัวเลือกของช่องแบบ "ตัวเลือก" — พิมพ์คั่นด้วยคอมมาบรรทัดเดียว ไม่ใช่แถวแยกทีละอัน
 * แถวแยกกินพื้นที่มากเกินไปสำหรับของที่มักมีแค่สองสามคำสั้น ๆ (เช่น L1, L2)
 *
 * เก็บข้อความดิบไว้ในตัวเอง ไม่ผูกตรงกับ options ทุกตัวอักษร เพราะ join/split ตัดช่องว่าง
 * ท้ายทิ้งทุกครั้งที่ re-render — พิมพ์ ", " ค้างไว้ระหว่างพิมพ์ตัวเลือกถัดไปจะโดนลบตามไปด้วย
 * ถ้าผูกตรง ๆ ทำให้พิมพ์คอมมาแล้วเว้นวรรคต่อไม่ได้
 */
function CommaOptionsInput({
  id,
  options,
  onChange,
}: {
  id: string;
  options: string[];
  onChange: (next: string[]) => void;
}) {
  const [text, setText] = React.useState(() => options.join(", "));

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>ตัวเลือก</Label>
      <Input
        id={id}
        value={text}
        placeholder="คั่นด้วยคอมมา เช่น L1, L2, L3"
        className="bg-card"
        onChange={(e) => {
          const v = e.target.value;
          setText(v);
          onChange(
            v
              .split(",")
              .map((s) => s.trim())
              .filter((s) => s !== "")
          );
        }}
      />
    </div>
  );
}
