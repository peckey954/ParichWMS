"use client";

import * as React from "react";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  CopyIcon,
  PlusIcon,
  SettingsIcon,
  Trash2Icon,
} from "lucide-react";
import { Badge } from "@peckey954/ui/components/ui/badge";
import { Button } from "@peckey954/ui/components/ui/button";
import { Card, CardContent } from "@peckey954/ui/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@peckey954/ui/components/ui/collapsible";
import { Input } from "@peckey954/ui/components/ui/input";
import { Label } from "@peckey954/ui/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@peckey954/ui/components/ui/select";
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
import { cn } from "@peckey954/ui/lib/utils";
import {
  CAPTURE_LABEL,
  CAPTURE_PRESET_LABEL,
  RULE_OP_LABEL,
  VERDICT_LABEL,
  VERDICT_WORDING_LABEL,
  capturePresetValue,
  cloneItemDeep,
  describeBehaviour,
  describeRule,
  matchCapturePreset,
  newColumn,
  newItem,
  type CapturePreset,
  type CaptureMode,
  type QcItem,
  type RuleOp,
  type VerdictMode,
  type VerdictWording,
} from "@/lib/qc-template";

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
}: {
  item: QcItem;
  index: number;
  total: number;
  depth?: number;
  onPatch: (patch: Partial<QcItem>) => void;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
  onDuplicate: () => void;
}) {
  const [open, setOpen] = React.useState(false);
  // เลือก "กำหนดเอง" เองทั้งที่ค่าปัจจุบันตรงกับพรีเซ็ตพอดี (เช่น หัวข้อใหม่ที่ยังไม่ได้แก้)
  // ต้องมีสถานะแยกไว้ ไม่งั้น dropdown จะเด้งกลับไปโชว์ชื่อพรีเซ็ตทันทีเพราะยังไม่มีอะไรเปลี่ยน
  const [forceCustom, setForceCustom] = React.useState(false);
  const isChild = depth > 0;
  const isMeasure = item.capture === "number";
  const preset = forceCustom ? "custom" : matchCapturePreset(item);

  const patchColumn = (id: string, p: Partial<QcItem["columns"][number]>) =>
    onPatch({
      columns: item.columns.map((c) => (c.id === id ? { ...c, ...p } : c)),
    });

  const ruleUnit = item.columns[0]?.unit ?? "";
  const ruleText = describeRule(item.rule, ruleUnit);

  return (
    <Card className={cn(isChild && "border-dashed")}>
      <CardContent className="space-y-4">
        {/* ---- แถวบน: ลำดับ + ชื่อหัวข้อ + ปุ่มจัดการ ---- */}
        <div className="flex items-start gap-3">
          <span className="mt-2 w-6 shrink-0 text-sm font-medium tabular-nums text-muted-foreground">
            {isChild ? `${index + 1})` : `${index + 1}.`}
          </span>

          <div className="flex-1 space-y-3">
            <Input
              value={item.title}
              placeholder={isChild ? "ชื่อหัวข้อย่อย" : "ชื่อหัวข้อตรวจ เช่น น้ำหนักของปุ๋ย"}
              onChange={(e) => onPatch({ title: e.target.value })}
            />
            <Input
              value={item.criteria}
              placeholder="เกณฑ์มาตรฐาน เช่น น้ำหนักต่อกระสอบ ≥ 50.2 kg"
              onChange={(e) => onPatch({ criteria: e.target.value })}
            />
          </div>

          <div className="flex shrink-0 gap-1">
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
        </div>

        {/* ---- รูปแบบหัวข้อ — พรีเซ็ตรวมสองแกนเดิม (คีย์อะไร/ตัดสินยังไง)
             ให้เลือกทีเดียวจบสำหรับ 4 แบบที่พบบ่อยสุด ไม่ตรงพรีเซ็ตไหนค่อย
             สลับ "กำหนดเอง" แล้วเห็นตัวควบคุมดิบทั้งสองแกนเหมือนเดิม ---- */}
        <div className="grid gap-3 pl-9 @2xl:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor={`${item.id}-preset`}>รูปแบบหัวข้อนี้</Label>
            <Select
              value={preset}
              onValueChange={(v) => {
                const next = v as CapturePreset;
                if (next === "custom") {
                  setForceCustom(true);
                  return;
                }
                setForceCustom(false);
                const { capture, verdict } = capturePresetValue(next);
                onPatch({
                  capture,
                  verdict,
                  columns:
                    capture === "number" && item.columns.length === 0
                      ? [newColumn()]
                      : item.columns,
                });
              }}
            >
              <SelectTrigger id={`${item.id}-preset`} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(
                  Object.keys(CAPTURE_PRESET_LABEL) as Exclude<
                    CapturePreset,
                    "custom"
                  >[]
                ).map((p) => (
                  <SelectItem key={p} value={p}>
                    {CAPTURE_PRESET_LABEL[p]}
                  </SelectItem>
                ))}
                <SelectItem value="custom">กำหนดเอง</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {preset === "custom" && (
            <>
              <div className="space-y-2">
                <Label htmlFor={`${item.id}-capture`}>ผู้ตรวจต้องคีย์อะไร</Label>
                <Select
                  value={item.capture}
                  onValueChange={(v) => {
                    const capture = v as CaptureMode;
                    onPatch({
                      capture,
                      columns:
                        capture === "number" && item.columns.length === 0
                          ? [newColumn()]
                          : item.columns,
                    });
                  }}
                >
                  <SelectTrigger id={`${item.id}-capture`} className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(CAPTURE_LABEL) as CaptureMode[]).map((c) => (
                      <SelectItem key={c} value={c}>
                        {CAPTURE_LABEL[c]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`${item.id}-verdict`}>ตัดสินผ่าน/ไม่ผ่านยังไง</Label>
                <Select
                  value={item.verdict}
                  onValueChange={(v) => onPatch({ verdict: v as VerdictMode })}
                >
                  <SelectTrigger id={`${item.id}-verdict`} className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(VERDICT_LABEL) as VerdictMode[]).map((v) => (
                      <SelectItem
                        key={v}
                        value={v}
                        disabled={v === "auto" && item.capture !== "number"}
                      >
                        {VERDICT_LABEL[v]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {item.verdict === "manual" && (
            <div className="space-y-2">
              <Label htmlFor={`${item.id}-wording`}>คำที่ใช้บนปุ่มติ๊ก</Label>
              <Select
                value={item.verdictWording}
                onValueChange={(v) =>
                  onPatch({ verdictWording: v as VerdictWording })
                }
              >
                <SelectTrigger id={`${item.id}-wording`} className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(
                    Object.keys(VERDICT_WORDING_LABEL) as VerdictWording[]
                  ).map((w) => (
                    <SelectItem key={w} value={w}>
                      {VERDICT_WORDING_LABEL[w]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* ---- สรุปสั้น ๆ + ปุ่มกางการตั้งค่า ---- */}
        <div className="flex flex-wrap items-center gap-2 pl-9">
          <Badge tone="brand" appearance="soft">
            {describeBehaviour(item)}
          </Badge>
          {item.repeatable && (
            <Badge tone="neutral" appearance="soft">
              บันทึกได้ {item.maxRounds} ครั้ง
            </Badge>
          )}
          {ruleText && (
            <Badge tone="neutral" appearance="outline">
              {ruleText}
            </Badge>
          )}
          {item.children.length > 0 && (
            <Badge tone="neutral" appearance="outline">
              หัวข้อย่อย {item.children.length}
            </Badge>
          )}

          <Collapsible open={open} onOpenChange={setOpen} className="ml-auto">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm">
                <SettingsIcon />
                {open ? "ซ่อนการตั้งค่า" : "ตั้งค่าเพิ่มเติม"}
              </Button>
            </CollapsibleTrigger>
          </Collapsible>
        </div>

        {/* ---- การตั้งค่าเพิ่มเติม ---- */}
        <Collapsible open={open} onOpenChange={setOpen}>
          <CollapsibleContent className="space-y-5 pl-9">
            <Separator />

            {/* ช่องตัวเลขที่ต้องกรอก */}
            {isMeasure && (
              <div className="space-y-3">
                <Label>ช่องที่ต้องกรอก</Label>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-48">ชื่อช่อง</TableHead>
                      <TableHead className="w-40">หน่วย</TableHead>
                      <TableHead className="w-16" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {item.columns.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell>
                          <Input
                            value={c.label}
                            placeholder="เช่น น้ำหนักที่ชั่ง"
                            onChange={(e) =>
                              patchColumn(c.id, { label: e.target.value })
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={c.unit}
                            placeholder="kg / %"
                            onChange={(e) =>
                              patchColumn(c.id, { unit: e.target.value })
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label="ลบช่อง"
                            onClick={() =>
                              onPatch({
                                columns: item.columns.filter(
                                  (x) => x.id !== c.id
                                ),
                              })
                            }
                          >
                            <Trash2Icon />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    onPatch({ columns: [...item.columns, newColumn()] })
                  }
                >
                  <PlusIcon />
                  เพิ่มช่องกรอก
                </Button>

                {/* เกณฑ์ตัวเลข — ใช้ได้ทั้งตัดสินเองและเป็นตัวช่วยตอนผู้ตรวจติ๊ก */}
                <p className="text-sm text-muted-foreground">
                  {item.verdict === "auto"
                    ? "ระบบจะตัดสินผ่าน/ไม่ผ่านจากเกณฑ์นี้ให้เอง"
                    : item.verdict === "manual"
                      ? "ผู้ตรวจติ๊กเอง แต่ระบบจะขึ้นผลที่คำนวณจากเกณฑ์นี้ให้ดูเป็นตัวช่วย"
                      : "ตั้งเกณฑ์ไว้ได้ แต่จะไม่ถูกนำไปตัดสินเพราะเลือกไม่ต้องตัดสิน"}
                </p>
                <div className="grid gap-3 @2xl:grid-cols-3">
                  <div className="space-y-2">
                    <Label>เกณฑ์ตัวเลข</Label>
                    <Select
                      value={item.rule.op}
                      onValueChange={(v) =>
                        onPatch({ rule: { ...item.rule, op: v as RuleOp } })
                      }
                    >
                      <SelectTrigger className="w-full">
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

                  {(item.rule.op === "gte" || item.rule.op === "between") && (
                    <div className="space-y-2">
                      <Label>ค่าต่ำสุด</Label>
                      <Input
                        type="number"
                        className="text-right tabular-nums"
                        value={item.rule.min ?? ""}
                        onChange={(e) =>
                          onPatch({
                            rule: {
                              ...item.rule,
                              min:
                                e.target.value === ""
                                  ? null
                                  : Number(e.target.value),
                            },
                          })
                        }
                      />
                    </div>
                  )}

                  {(item.rule.op === "lte" || item.rule.op === "between") && (
                    <div className="space-y-2">
                      <Label>ค่าสูงสุด</Label>
                      <Input
                        type="number"
                        className="text-right tabular-nums"
                        value={item.rule.max ?? ""}
                        onChange={(e) =>
                          onPatch({
                            rule: {
                              ...item.rule,
                              max:
                                e.target.value === ""
                                  ? null
                                  : Number(e.target.value),
                            },
                          })
                        }
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* สวิตช์ตัวเลือก */}
            <div className="space-y-3">
              <SwitchRow
                id={`${item.id}-repeat`}
                label="บันทึกได้หลายครั้ง"
                description="เปิดเมื่อหัวข้อนี้ต้องตรวจซ้ำ เช่น ตรวจครั้งที่ 1 / 2 / 3"
                checked={item.repeatable}
                onChange={(c) => onPatch({ repeatable: c })}
              />

              {item.repeatable && (
                <div className="grid gap-3 pl-6 @2xl:grid-cols-2">
                  <div className="space-y-2">
                    <Label>จำนวนครั้งเริ่มต้น</Label>
                    <Input
                      type="number"
                      min={1}
                      className="text-right tabular-nums"
                      value={item.defaultRounds}
                      onChange={(e) =>
                        onPatch({ defaultRounds: Number(e.target.value) || 1 })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>เพิ่มได้สูงสุด</Label>
                    <Input
                      type="number"
                      min={1}
                      className="text-right tabular-nums"
                      value={item.maxRounds}
                      onChange={(e) =>
                        onPatch({ maxRounds: Number(e.target.value) || 1 })
                      }
                    />
                  </div>
                </div>
              )}

              <SwitchRow
                id={`${item.id}-time`}
                label="มีช่องเวลาที่ตรวจ"
                description="บันทึกเวลาของแต่ละครั้งที่ตรวจ"
                checked={item.withTime}
                onChange={(c) => onPatch({ withTime: c })}
              />
              <SwitchRow
                id={`${item.id}-note`}
                label="มีช่องหมายเหตุ"
                description="ให้ผู้ตรวจพิมพ์หมายเหตุเพิ่มเติมได้"
                checked={item.withNote}
                onChange={(c) => onPatch({ withNote: c })}
              />
            </div>

            {/* หัวข้อย่อย — ซ้อนได้ชั้นเดียว */}
            {!isChild && (
              <div className="space-y-3">
                <Separator />
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <Label>หัวข้อย่อย</Label>
                    <p className="text-sm text-muted-foreground">
                      ใช้กับฟอร์มที่จัดเป็นกลุ่ม เช่น ใบตรวจก่อนผลิตที่มีหัวข้อใหญ่แล้วแตกเป็นข้อย่อย
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      onPatch({ children: [...item.children, newItem()] })
                    }
                  >
                    <PlusIcon />
                    เพิ่มหัวข้อย่อย
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
                            children: item.children.filter(
                              (x) => x.id !== child.id
                            ),
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
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}

function SwitchRow({
  id,
  label,
  description,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="space-y-0.5">
        <Label htmlFor={id}>{label}</Label>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
