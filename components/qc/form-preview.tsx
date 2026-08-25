"use client";

import * as React from "react";
import {
  CalendarDaysIcon,
  ChevronDownIcon,
  CircleDashedIcon,
  ClockIcon,
  PlusIcon,
  Trash2Icon,
  TriangleAlertIcon,
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
import { cn } from "@peckey954/ui/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@peckey954/ui/components/ui/tabs";
import { Textarea } from "@peckey954/ui/components/ui/textarea";
import { SchedulePreviewCalendar } from "@/components/qc/schedule-calendar";
import { TimeField } from "@/components/time-field";
import { VerdictChoice } from "@/components/qc/verdict-choice";
import {
  NOTE_COLUMN_HINT,
  SKIP_DAYS_LABEL,
  VERDICT_WORDS,
  buildPreviewBlocks,
  describeItemRules,
  showsAutoStatus,
  showsCalendar,
  showsTick,
  slotLabel,
  slotOvernight,
  type HeaderField,
  type QcField,
  type QcItem,
  type QcTemplate,
} from "@/lib/qc-template";

export function FormPreview({ template }: { template: QcTemplate }) {
  const blocks = buildPreviewBlocks(template.items);

  /**
   * "รายครั้ง" ไม่ใช่เรื่องของข้อใดข้อหนึ่ง แต่เป็นเรื่องของทั้งใบ — ตรงกับของจริงที่ใบตรวจรับ
   * สินค้าใช้ (RoundCard ใน @/components/qc/round-card.tsx): กดเพิ่มรอบทีเดียว ทุกข้อที่ตั้งไว้ว่า
   * ตรวจซ้ำได้ขึ้นพร้อมกันในการ์ดเดียวกัน ไม่ใช่ข้อใครข้อมันมีปุ่มเพิ่ม/การ์ดแยกของตัวเอง
   * ข้อที่ตรวจครั้งเดียว (ไม่ repeatable) ก็ยังอยู่ในการ์ดรอบเดียวกัน แค่ตอบได้แค่รอบแรก
   * รอบหลังโชว์เป็นแถวอ่านอย่างเดียว — เหมือนของจริงเป๊ะ
   *
   * ข้อแบบ "รายข้อมูล" (kind: rows) กับหัวข้อที่มีหัวข้อย่อยยังแยกออกมาต่างหาก เพราะเป็นคนละเรื่อง
   * รายข้อมูลคือแต่ละใบเป็นของคนละชิ้น ไม่เกี่ยวกับ "รอบตรวจ" ของทั้งใบเลย
   */
  const usesRounds = template.items.some(
    (it) => it.kind === "check" && it.children.length === 0 && it.repeatable
  );
  const roundItems = template.items
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => item.kind === "check" && item.children.length === 0);
  const leftoverBlocks = usesRounds
    ? blocks.filter(
        (b) => b.kind === "single" && (b.item.kind === "rows" || b.item.children.length > 0)
      )
    : blocks;

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

      {/* รอบการตรวจอยู่เหนือหัวเอกสาร เพราะเป็นสิ่งที่ตอบว่า "ทำไมถึงมาเปิดใบนี้"
          ฟอร์มตามรอบเวลาเปิดใบเพราะถึงรอบ ไม่ได้เปิดเพราะมีของมาให้ตรวจ */}
      {showsCalendar(template) && (
        <div className="rounded-xl border border-border bg-muted p-4">
          <div className="flex items-center gap-2">
            <CalendarDaysIcon className="size-4 text-primary" />
            <p className="font-medium">
              ฟอร์มนี้ตรวจตามรอบเวลา — วันละ {template.schedule.slots.length} ใบ
            </p>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            ตรวจ{SKIP_DAYS_LABEL[template.schedule.skipDays]} —
            วันไหนไม่มีใบครบทุกช่วงเวลาจะขึ้นเป็นช่องว่างในปฏิทินและตารางทั้งเดือน
          </p>

          {/* เลือกดูเป็นปฏิทินหรือรายการช่วงเวลาได้ — แบบเดียวกับหน้าใบตรวจวัตถุดิบในถัง
              ที่นี่เป็นแค่ตัวอย่างโครง ยังไม่มีใบจริง จุดในปฏิทินจึงไม่ใช่สถานะทำ/ไม่ทำ */}
          <Tabs defaultValue="calendar" className="mt-3 gap-3">
            <TabsList>
              <TabsTrigger value="calendar">
                <CalendarDaysIcon />
                ปฏิทิน
              </TabsTrigger>
              <TabsTrigger value="list">
                <ClockIcon />
                ช่วงเวลา
              </TabsTrigger>
            </TabsList>

            <TabsContent value="calendar">
              <div className="rounded-lg border border-border bg-card p-3">
                <SchedulePreviewCalendar schedule={template.schedule} />
              </div>
            </TabsContent>

            <TabsContent value="list">
              <div className="flex flex-wrap gap-2">
                {template.schedule.slots.map((sl) => (
                  <span
                    key={sl.id}
                    className="rounded-full border border-border bg-card px-3 py-1 text-sm tabular-nums"
                  >
                    {slotLabel(sl)}
                    {slotOvernight(sl) && (
                      <span className="ml-1 text-muted-foreground">ข้ามคืน</span>
                    )}
                  </span>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}

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
      {usesRounds && <SharedRoundsPreview items={roundItems} />}

      {leftoverBlocks.map((block, bi) => {
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
              {/* การ์ดทีละข้อทุกจอ ไม่มีตารางเลย — ตารางหลายคอลัมน์บนจอแคบบีบจนติ๊กผลตรวจยาก
                  คอลัมน์ขวาสุด (ผลการตรวจ) มักโดนตัดพ้นขอบจอไปเลย ส่วนจอกว้างก็เอาการ์ดเดิม
                  มาเรียงยาวต่อ ไม่ต้องมีสองแบบให้ดูแลคู่กัน */}
              <div className="space-y-3">
                {block.items.map(({ item, index }) => (
                  <PreviewCardShell
                    key={item.id}
                    eyebrow={`ข้อ ${index + 1}`}
                    title={item.title || "—"}
                    description={item.description}
                    criteria={showCriteria ? item.criteria || "—" : undefined}
                  >
                    <VerdictCardChoice
                      id={item.id}
                      pass={pass}
                      fail={fail}
                      skippable={!item.required}
                    />
                    {showNote && (
                      <FieldRow
                        label={
                          groupNote
                            ? `หมายเหตุ · ${NOTE_COLUMN_HINT[groupNote]}`
                            : "หมายเหตุ"
                        }
                      >
                        {item.note !== "off" ? (
                          <Input placeholder="—" />
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </FieldRow>
                    )}
                  </PreviewCardShell>
                ))}
              </div>
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
  // ตารางเพิ่มแถวเองมีสถานะของตัวเอง (แถวที่ผู้ตรวจกดเพิ่ม) จึงเป็นคนละคอมโพเนนต์
  // ไม่ใช่ตารางเดิมที่ใส่ if เพิ่มเข้าไป
  // key ผูกกับจำนวนแถวตั้งต้น — ตั้งค่าในตัวสร้างเปลี่ยนเมื่อไหร่ ตารางตัวอย่างเริ่มใหม่
  // ใช้ key แทน effect ที่คอย setState ตาม prop ซึ่งเรนเดอร์ซ้อนโดยไม่จำเป็น
  if (item.kind === "rows")
    return (
      <RowsItemPreview
        key={item.defaultRounds}
        item={item}
        index={index}
      />
    );

  // ข้อที่ไม่มีหัวข้อย่อยและ "ตรวจซ้ำได้" ไม่ผ่านมาถึงตรงนี้แล้ว — FormPreview ระดับบนสุด
  // ดักออกไปรวมกับข้ออื่นที่ตรวจซ้ำได้ใน SharedRoundsPreview (การ์ดรอบเดียวกันทั้งใบ) แทน

  const ruleText = describeItemRules(item);
  const [pass, fail] = VERDICT_WORDS[item.verdictWording];
  const tick = showsTick(item);
  const autoStatus = showsAutoStatus(item);
  // เว้นเกณฑ์ไว้ทุกข้อย่อย = ไม่มีคอลัมน์เกณฑ์ เหมือนตารางข้อที่ติ๊กอย่างเดียว
  const childCriteria = item.children.some((c) => c.criteria.trim());
  const childNote = item.children.some((c) => c.note !== "off");

  return (
    <section className="space-y-3">
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

      {/* หัวข้อที่มีหัวข้อย่อย → การ์ดทีละหัวข้อย่อยทุกจอ ไม่มีตาราง */}
      {item.children.length > 0 ? (
        <div className="space-y-3">
          {item.children.map((c, ci) => {
            const [p, f] = VERDICT_WORDS[c.verdictWording];
            return (
              <PreviewCardShell
                key={c.id}
                eyebrow={`${index + 1}.${ci + 1}`}
                title={c.title || "—"}
                description={c.description}
                criteria={childCriteria ? c.criteria || "—" : undefined}
              >
                {showsTick(c) ? (
                  <VerdictCardChoice
                    id={c.id}
                    pass={p}
                    fail={f}
                    skippable={!c.required}
                  />
                ) : (
                  <span className="text-sm text-muted-foreground">
                    ระบบตัดสินให้
                  </span>
                )}
                {childNote && (
                  <FieldRow label="หมายเหตุ">
                    {c.note !== "off" ? (
                      <Input placeholder="—" />
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </FieldRow>
                )}
              </PreviewCardShell>
            );
          })}
        </div>
      ) : (
        /* มาถึงตรงนี้ได้คือ item.repeatable ต้องเป็น false เสมอ (ไม่งั้น FormPreview
           ระดับบนสุดจะดักไปรวมกับ SharedRoundsPreview ตั้งแต่แรกแล้ว) จึงมีแค่ชุดข้อมูลเดียวเสมอ
           การ์ดใบเดียวทุกจอ ไม่มีตาราง ไม่มีแนวคิด "ครั้งที่" ให้ต้องพับเก็บ */
        <div className="space-y-3 rounded-lg border border-border bg-card p-4">
          {item.fields.map((f) => (
            <FieldRow
              key={f.id}
              label={
                f.type === "number" && f.unit
                  ? `${f.label || "—"} (${f.unit})`
                  : f.label || "—"
              }
            >
              <FieldInput field={f} />
            </FieldRow>
          ))}

          {item.withDate && (
            <FieldRow label="วันที่ตรวจ">
              <Input type="date" className="tabular-nums" />
            </FieldRow>
          )}

          {item.withTime && (
            <FieldRow label="เวลาที่ตรวจ">
              <TimeField aria-label="เวลาที่ตรวจ" />
            </FieldRow>
          )}

          {tick && (
            <FieldRow label="ผลการตรวจ · ผู้ตรวจติ๊กเอง">
              <VerdictCardChoice
                id={`${item.id}-0`}
                pass={pass}
                fail={fail}
                skippable={!item.required}
              />
            </FieldRow>
          )}

          {item.note !== "off" && (
            <FieldRow label={`หมายเหตุ · ${NOTE_COLUMN_HINT[item.note]}`}>
              <Input placeholder="—" />
            </FieldRow>
          )}

          {autoStatus && (
            <FieldRow label="สถานะ · ระบบคำนวณ">
              <span
                className="inline-flex items-center gap-1 text-sm text-muted-foreground"
                title="ยังไม่ได้คีย์ค่า"
              >
                <CircleDashedIcon className="size-4" />
                รอค่า
              </span>
            </FieldRow>
          )}
        </div>
      )}

      {tick && autoStatus && (
        <p className="text-sm text-muted-foreground">
          ระบบจะขึ้นผลที่คำนวณจากเกณฑ์ในคอลัมน์สถานะ แต่ผลที่บันทึกจริงคือช่องที่ผู้ตรวจติ๊ก
        </p>
      )}
    </section>
  );
}

/**
 * "รายครั้ง" ของทั้งใบ — ไม่ใช่ของข้อใดข้อหนึ่ง
 *
 * กดเพิ่มรอบทีเดียว ทุกข้อที่ตั้งไว้ว่าตรวจซ้ำได้ขึ้นพร้อมกันในการ์ดเดียวกัน ตรงกับของจริง
 * ที่ใบตรวจรับสินค้าใช้ (RoundCard ใน @/components/qc/round-card.tsx) — ไม่ใช่ข้อใครข้อมัน
 * มีปุ่มเพิ่ม/การ์ดของตัวเอง เพราะรอบตรวจเป็นแนวคิดของ "ไปตรวจหนึ่งเที่ยว" ไม่ใช่ของแต่ละข้อ
 *
 * ข้อที่ตรวจครั้งเดียว (ไม่ repeatable) ก็ยังอยู่ในการ์ดรอบเดียวกัน แค่ตอบได้แค่รอบแรก
 * รอบหลังโชว์เป็นแถวอ่านอย่างเดียว — ไม่งั้นผู้ตรวจจะสงสัยว่าข้อนั้นหายไปไหน
 *
 * ลบรอบได้ (ต่างจากของจริงที่ไม่ให้ลบ เพราะรอบคือประวัติที่เกิดขึ้นจริงแล้ว) เพราะที่นี่
 * เป็นแค่ตัวอย่างให้คนตั้งฟอร์มลองกดเล่น ไม่ใช่ข้อมูลจริงที่ต้องเก็บไว้
 */
function SharedRoundsPreview({
  items,
}: {
  items: { item: QcItem; index: number }[];
}) {
  const [rounds, setRounds] = React.useState<number[]>([0]);
  const nextId = React.useRef(1);
  // id ที่มีอยู่ตั้งแต่เปิดใบ — รอบที่กดเพิ่มทีหลังไม่อยู่ในเซตนี้ จึงต้องกางทันที
  const [initialIds] = React.useState(() => new Set(rounds));

  const quota = Math.max(
    1,
    ...items.map(({ item }) => (item.repeatable ? item.maxRounds : 1))
  );
  const canAdd = items.some(
    ({ item }) => item.repeatable && item.maxRounds > rounds.length
  );

  return (
    <div className="space-y-3">
      {rounds.map((id, r) => (
        <RoundPreviewCard
          key={id}
          index={r}
          openInitially={!initialIds.has(id)}
          onRemove={
            rounds.length > 1
              ? () => setRounds((x) => x.filter((v) => v !== id))
              : undefined
          }
        >
          <div className="space-y-3">
            {items.map(({ item, index }) => (
              <RoundItemRow
                key={item.id}
                item={item}
                index={index}
                roundKey={id}
                editable={r === 0 || item.repeatable}
              />
            ))}
          </div>
        </RoundPreviewCard>
      ))}

      {/* ปุ่มเพิ่มอยู่ล่างกลางเสมอ — ตำแหน่งเดียวกับ RowsItemPreview ไม่ว่าจะเป็นรายครั้งหรือรายข้อมูล */}
      <div className="flex flex-col items-center gap-1.5">
        <Button
          variant="outline-primary"
          size="sm"
          disabled={!canAdd}
          onClick={() => {
            setRounds((r) => [...r, nextId.current]);
            nextId.current += 1;
          }}
        >
          <PlusIcon />
          เพิ่มครั้งที่ตรวจ
        </Button>
        <span className="text-sm text-muted-foreground tabular-nums">
          {rounds.length} / {quota} ครั้ง
        </span>
      </div>
    </div>
  );
}

/** หนึ่งข้อภายในการ์ดของรอบหนึ่ง — โครงเดียวกับ ItemBlock ของ RoundCard จริง */
function RoundItemRow({
  item,
  index,
  roundKey,
  editable,
}: {
  item: QcItem;
  index: number;
  roundKey: number;
  editable: boolean;
}) {
  const ruleText = describeItemRules(item);
  const [pass, fail] = VERDICT_WORDS[item.verdictWording];
  const tick = showsTick(item);
  const autoStatus = showsAutoStatus(item);

  // ข้อที่ตรวจครั้งเดียวและตอบไปแล้ว — ยังโชว์อยู่แต่แก้ไม่ได้ ไม่ใช่ซ่อนหายไป
  // ไม่งั้นผู้ตรวจจะสงสัยว่าข้อนี้หายไปไหนตอนเปิดรอบถัดมา (เหมือนของจริงเป๊ะ)
  if (!editable) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-dashed border-border px-4 py-3">
        <span className="text-sm text-muted-foreground">
          {index + 1}. {item.title || "—"} — ตรวจครั้งเดียว
        </span>
        <span className="text-sm text-muted-foreground">ยังไม่ได้ตรวจ</span>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-sm">
        <span className="font-semibold">
          {index + 1}. {item.title || "ยังไม่ได้ตั้งชื่อหัวข้อ"}
        </span>
        {(item.criteria || ruleText) && (
          <span className="ml-2 text-muted-foreground">
            เกณฑ์: {item.criteria || ruleText}
          </span>
        )}
      </p>

      <div className="@container">
        {item.fields.length > 0 && (
          <div className="mt-3 grid gap-3 @lg:grid-cols-2">
            {item.fields.map((f) => (
              <FieldRow
                key={f.id}
                label={
                  f.type === "number" && f.unit
                    ? `${f.label || "—"} (${f.unit})`
                    : f.label || "—"
                }
              >
                <FieldInput field={f} />
              </FieldRow>
            ))}
          </div>
        )}

        <div className="mt-3 grid gap-3 @lg:grid-cols-2">
          {item.withDate && (
            <FieldRow label="วันที่ตรวจ">
              <Input type="date" className="tabular-nums" />
            </FieldRow>
          )}

          {item.withTime && (
            <FieldRow label="เวลาที่ตรวจ">
              <TimeField aria-label="เวลาที่ตรวจ" />
            </FieldRow>
          )}

          {tick && (
            <FieldRow label="ผลการตรวจ · ผู้ตรวจติ๊กเอง">
              <VerdictCardChoice
                id={`${item.id}-r${roundKey}`}
                pass={pass}
                fail={fail}
                skippable={!item.required}
              />
            </FieldRow>
          )}

          {item.note !== "off" && (
            <FieldRow label={`หมายเหตุ · ${NOTE_COLUMN_HINT[item.note]}`}>
              <Input placeholder="—" />
            </FieldRow>
          )}

          {autoStatus && (
            <FieldRow label="สถานะ · ระบบคำนวณ">
              <span
                className="inline-flex items-center gap-1 text-sm text-muted-foreground"
                title="ยังไม่ได้คีย์ค่า"
              >
                <CircleDashedIcon className="size-4" />
                รอค่า
              </span>
            </FieldRow>
          )}
        </div>
      </div>

      {tick && autoStatus && (
        <p className="mt-2 text-sm text-muted-foreground">
          ระบบจะขึ้นผลที่คำนวณจากเกณฑ์ในคอลัมน์สถานะ แต่ผลที่บันทึกจริงคือช่องที่ผู้ตรวจติ๊ก
        </p>
      )}
    </div>
  );
}

/**
 * ตารางที่ผู้ตรวจกดเพิ่มแถวเองตอนตรวจ
 *
 * ต่างจากข้อที่ตรวจซ้ำหลายครั้ง ตรงที่ตรงนั้นทุกครั้งพูดถึงของชิ้นเดิม
 * เลขครั้งจึงมีความหมาย ส่วนตรงนี้แต่ละแถวคือของคนละชิ้น เลขแถวเป็นแค่ลำดับ
 * คอลัมน์แรกที่ดึงจากระบบต่างหากที่บอกว่าแถวนี้พูดถึงอะไร
 *
 * ลบแถวได้ทุกแถว ไม่มีแถวที่ลบไม่ได้ เพราะการเปิดใบมาแล้วเจอแถวที่เอาออกไม่ได้
 * คือการบังคับให้กรอกของที่วันนี้อาจไม่ได้ตรวจ
 */
function RowsItemPreview({ item, index }: { item: QcItem; index: number }) {
  const [rows, setRows] = React.useState(() =>
    Array.from({ length: Math.max(1, item.defaultRounds) }, (_, i) => i)
  );
  const nextId = React.useRef(rows.length);
  // id ที่มีอยู่ตั้งแต่เปิดใบ — แถวที่กดเพิ่มทีหลังไม่อยู่ในเซตนี้ จึงต้องกางทันที
  // เป็น state ไม่ใช่ ref เพราะอ่านค่าตอน render ด้วย (ref อ่านตอน render ไม่ได้)
  const [initialIds] = React.useState(() => new Set(rows));

  const [pass, fail] = VERDICT_WORDS[item.verdictWording];
  const tick = showsTick(item);
  const autoStatus = showsAutoStatus(item);
  const full = rows.length >= item.maxRounds;

  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-base font-semibold">
          {index + 1}. {item.title || "ยังไม่ได้ตั้งชื่อหัวข้อ"}
        </h3>
        {item.description && (
          <p className="mt-0.5 text-sm text-muted-foreground">
            {item.description}
          </p>
        )}
      </div>

      {/* "รายข้อมูล" — แต่ละใบคือของคนละชิ้น ไม่ใช่ของเดิมตรวจซ้ำ (นั่นคือ "รายครั้ง"
          ของหัวข้อที่ item.repeatable แทน) ทั้งสองแบบจึงใช้การ์ดพับ/กางแบบเดียวกัน
          (RoundPreviewCard) หน้าตาตรงกับตอนตรวจจริง ต่างแค่ตรงนี้ลบได้เพราะกดเพิ่มเอง */}
      <div className="space-y-3">
        {rows.map((id, r) => (
          <RoundPreviewCard
            key={id}
            index={r}
            openInitially={!initialIds.has(id)}
            onRemove={() => setRows((x) => x.filter((v) => v !== id))}
          >
            {/* @container ผูกกับความกว้างจริงของการ์ดใบนี้ ให้ฟิลด์ข้างในกางสองคอลัมน์ได้
                เมื่อการ์ดเต็มความกว้างคอนเทนเนอร์ (จอกว้าง) แต่ยุบเหลือคอลัมน์เดียวเมื่อจอแคบ (มือถือ) */}
            <div className="@container">
              <div className="grid gap-3 @lg:grid-cols-2">
                {item.withDate && (
                  <FieldRow label="วันที่">
                    <Input type="date" className="tabular-nums" />
                  </FieldRow>
                )}
                {item.withTime && (
                  <FieldRow label="เวลา">
                    <TimeField aria-label="เวลา" />
                  </FieldRow>
                )}
                {item.fields.map((f) => (
                  <FieldRow
                    key={f.id}
                    label={
                      f.type === "number" && f.unit
                        ? `${f.label || "—"} (${f.unit})`
                        : f.label || "—"
                    }
                  >
                    <FieldInput field={f} />
                  </FieldRow>
                ))}
                {tick && (
                  <FieldRow label="ผลการตรวจ · ผู้ตรวจติ๊กเอง">
                    <VerdictCardChoice
                      id={`${item.id}-row-${id}`}
                      pass={pass}
                      fail={fail}
                      skippable={!item.required}
                    />
                  </FieldRow>
                )}
                {item.note !== "off" && (
                  <FieldRow label={`หมายเหตุ · ${NOTE_COLUMN_HINT[item.note]}`}>
                    <Input placeholder="—" />
                  </FieldRow>
                )}
                {autoStatus && (
                  <FieldRow label="สถานะ · ระบบคำนวณ">
                    <span
                      className="inline-flex items-center gap-1 text-sm text-muted-foreground"
                      title="ยังไม่ได้คีย์ค่า"
                    >
                      <CircleDashedIcon className="size-4" />
                      รอค่า
                    </span>
                  </FieldRow>
                )}
              </div>
            </div>
          </RoundPreviewCard>
        ))}
      </div>

      {/* ปุ่มเพิ่มอยู่ล่างกลางเสมอ ไม่ว่าจะเป็นรายครั้งหรือรายข้อมูล — กวาดตาลงมาเจอ
          ปุ่มเดิมทุกครั้งหลังดูใบสุดท้าย ไม่ต้องเลื่อนย้อนขึ้นไปหาปุ่มบนหัวข้อ */}
      <div className="flex flex-col items-center gap-1.5">
        <Button
          variant="outline-primary"
          size="sm"
          disabled={full}
          onClick={() => {
            nextId.current += 1;
            setRows((r) => [...r, nextId.current]);
          }}
        >
          <PlusIcon />
          เพิ่มข้อมูลที่ตรวจ
        </Button>
        <span className="text-sm text-muted-foreground tabular-nums">
          {rows.length} / {item.maxRounds} รายการ
        </span>
      </div>
    </section>
  );
}

/**
 * การ์ดพับ/กางได้หนึ่งใบต่อหนึ่ง "ข้อมูลตรวจ" — หน้าตาเดียวกับ RoundCard ที่ผู้ตรวจ
 * ใช้จริงตอนตรวจ (ใบตรวจวัตถุดิบในถัง) เพื่อให้ตัวอย่างฟอร์มตรงกับของจริง
 * ไม่ใช่แค่คล้าย ๆ กัน — คนตั้งฟอร์มจะได้เห็นเลยว่าตรวจจริงหน้าตาเป็นแบบนี้
 *
 * ใช้ร่วมกันทั้งสองแบบที่หัวข้อทำซ้ำได้ — "รายครั้ง" (ตรวจของเดิมซ้ำหลายรอบ)
 * กับ "รายข้อมูล" (แต่ละใบคือของคนละชิ้น ผู้ตรวจกดเพิ่มเอง) ทั้งสองแบบคือแนวคิดเดียวกัน
 * ต่างกันแค่ว่ากำหนดจำนวนไว้ล่วงหน้า หรือกดเพิ่มเองระหว่างตรวจ — onRemove จึงมีเฉพาะแบบหลัง
 *
 * เปิดไว้ตอนเริ่มต้นเฉพาะใบแรกให้เห็นตัวอย่างทันทีโดยไม่ต้องกดกาง ใบถัดไปที่มีมาแต่แรกเก็บพับไว้ก่อน
 * ส่วนใบที่กดเพิ่มเองระหว่างดู (openInitially) ต้องกางทันที — เพิ่งกดเพิ่มแล้วต้องกดกางอีกทีมากดซ้ำ
 * ป้าย "รอตรวจ" ตายตัวเสมอ เพราะหน้านี้เป็น preview ไม่มีคำตอบจริงให้คำนวณสถานะ
 */
function RoundPreviewCard({
  index,
  openInitially = false,
  onRemove,
  children,
}: {
  index: number;
  /** true เมื่อใบนี้เพิ่งถูกเพิ่มด้วยปุ่ม (ไม่ใช่ใบที่มีอยู่แต่แรก) */
  openInitially?: boolean;
  /** มีให้ลบได้เฉพาะแบบ "รายข้อมูล" ที่ผู้ตรวจกดเพิ่มเอง — รอบตรวจซ้ำมีจำนวนตายตัว ลบไม่ได้ */
  onRemove?: () => void;
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(index === 0 || openInitially);
  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="overflow-hidden rounded-xl border border-border bg-card"
    >
      <div className="flex items-center">
        <CollapsibleTrigger className="flex flex-1 items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-accent-hover">
          <p className="flex-1 font-semibold">ข้อมูลตรวจที่ {index + 1}</p>
          <Badge tone="warning" appearance="soft">
            <TriangleAlertIcon />
            รอตรวจ
          </Badge>
          <ChevronDownIcon
            className={cn(
              "size-4 shrink-0 text-muted-foreground transition-transform",
              open && "rotate-180"
            )}
          />
        </CollapsibleTrigger>
        {onRemove && (
          <Button
            variant="ghost"
            size="icon-sm"
            className="mr-3 shrink-0"
            aria-label={`ลบข้อมูลตรวจที่ ${index + 1}`}
            onClick={onRemove}
          >
            <Trash2Icon />
          </Button>
        )}
      </div>
      <CollapsibleContent>
        <div className="border-t border-border p-4">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  );
}

/**
 * การ์ดหนึ่งใบแทนหนึ่งแถวตารางบนมือถือ — ใช้ร่วมกันทั้งตารางแบบติ๊กอย่างเดียว
 * และตารางหัวข้อย่อย ที่มีคอลัมน์ "ลำดับ / ชื่อ / เกณฑ์" เหมือนกัน
 * ต่างกันแค่เนื้อหาส่วนผลตรวจข้างล่าง จึงแยกเป็น children แทนที่จะทำสอง component
 */
function PreviewCardShell({
  eyebrow,
  title,
  description,
  criteria,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  criteria?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="font-medium">
        {eyebrow && (
          <span className="mr-1.5 text-muted-foreground tabular-nums">
            {eyebrow}
          </span>
        )}
        {title}
      </p>
      {description && (
        <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
      )}
      {criteria !== undefined && (
        <p className="mt-0.5 text-sm text-muted-foreground">
          เกณฑ์: {criteria}
        </p>
      )}
      <div className="mt-3 space-y-3">{children}</div>
    </div>
  );
}

/** แถวคีย์-ค่าหนึ่งช่องในการ์ด — ป้ายชื่ออยู่บน ช่องกรอกเต็มความกว้างข้างล่าง
 * เอาไว้แทนหัวคอลัมน์ตารางที่การ์ดไม่มีที่ให้ */
function FieldRow({
  label,
  children,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-sm text-muted-foreground">{label}</p>
      {children}
    </div>
  );
}

/**
 * ช่องติ๊กผลตรวจ
 *
 * ข้อที่ข้ามได้มีตัวเลือกที่สามว่า "ไม่ได้ตรวจ" — ไม่ใช่ปล่อยให้เว้นว่าง
 * เพราะเว้นว่างแยกไม่ออกระหว่าง "ตั้งใจข้าม" กับ "ลืมกรอก" ซึ่งเป็นคนละเรื่องกัน
 * เรื่องเดียวกับที่ปฏิทินต้องขึ้นวันครบทั้งเดือน — ช่องว่างต้องแปลได้ความหมายเดียว
 */
function TickChoice({
  id,
  pass,
  fail,
  skippable = false,
}: {
  id: string;
  pass: string;
  fail: string;
  skippable?: boolean;
}) {
  return (
    <RadioGroup className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <Label htmlFor={`${id}-p`} className="flex items-center gap-2 font-normal">
        <RadioGroupItem id={`${id}-p`} value="pass" />
        {pass}
      </Label>
      <Label htmlFor={`${id}-f`} className="flex items-center gap-2 font-normal">
        <RadioGroupItem id={`${id}-f`} value="fail" />
        {fail}
      </Label>
      {skippable && (
        <Label
          htmlFor={`${id}-s`}
          className="flex items-center gap-2 font-normal text-muted-foreground"
        >
          <RadioGroupItem id={`${id}-s`} value="skip" />
          ไม่ได้ตรวจ
        </Label>
      )}
    </RadioGroup>
  );
}

/**
 * ผลตรวจในการ์ดมือถือ — ปุ่มใหญ่สีเขียว/แดงแบบเดียวกับใบตรวจวัตถุดิบจริง (RoundCard)
 * แทนวิทยุตัวเล็กของ TickChoice ที่ใช้ในตารางเดสก์ท็อป เพราะปุ่มเล็กกดแม่นยากบนมือถือ
 * ที่นี่เป็นแค่ preview ไม่มีที่เก็บค่าจริง จึงเก็บว่าเลือกอะไรไว้ในตัวเอง
 */
function VerdictCardChoice({
  id,
  pass,
  fail,
  skippable = false,
}: {
  id: string;
  pass: string;
  fail: string;
  skippable?: boolean;
}) {
  const [value, setValue] = React.useState<"pass" | "fail" | "skip" | null>(
    null
  );
  return (
    <div className="grid grid-cols-2 gap-2">
      <VerdictChoice
        id={`${id}-p`}
        label={pass}
        on={value === "pass"}
        tone="pass"
        onClick={() => setValue("pass")}
      />
      <VerdictChoice
        id={`${id}-f`}
        label={fail}
        on={value === "fail"}
        tone="fail"
        onClick={() => setValue("fail")}
      />
      {skippable && (
        <VerdictChoice
          id={`${id}-s`}
          label="ไม่ได้ตรวจ"
          on={value === "skip"}
          tone="skip"
          onClick={() => setValue("skip")}
          className="col-span-2"
        />
      )}
    </div>
  );
}

/** ช่องกรอกหนึ่งช่องในใบตรวจ — หน้าตาตามประเภทที่ตั้งไว้ในตัวสร้าง */
function FieldInput({ field: f }: { field: QcField }) {
  if (f.type === "number") {
    return (
      <Input type="number" className="text-right tabular-nums" placeholder="0.00" />
    );
  }

  if (f.type === "choice") {
    return (
      <Select>
        <SelectTrigger className="w-full" aria-label={f.label || "เลือก"}>
          <SelectValue placeholder="เลือก" />
        </SelectTrigger>
        <SelectContent>
          {f.options.length === 0 ? (
            <SelectItem value="none" disabled>
              ยังไม่ได้ตั้งตัวเลือก
            </SelectItem>
          ) : (
            f.options.map((o, i) => (
              <SelectItem key={`${f.id}-${i}`} value={o || `opt-${i}`}>
                {o || `ตัวเลือกที่ ${i + 1}`}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    );
  }

  if (f.type === "ref") {
    return (
      <Select>
        <SelectTrigger className="w-full" aria-label={f.label || "เลือกจากระบบ"}>
          <SelectValue placeholder={`เลือกจาก${f.source || "ระบบ"}`} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="sample-1">ตัวอย่างรายการที่ 1</SelectItem>
          <SelectItem value="sample-2">ตัวอย่างรายการที่ 2</SelectItem>
        </SelectContent>
      </Select>
    );
  }

  return <Input placeholder="—" />;
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
