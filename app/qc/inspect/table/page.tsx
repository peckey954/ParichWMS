"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronDownIcon,
  CircleCheckIcon,
  CircleDashedIcon,
  CircleXIcon,
  PlusIcon,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@peckey954/ui/components/ui/table";
import { cn } from "@peckey954/ui/lib/utils";
import { toast } from "sonner";
import {
  COL_FIRST,
  HEAD_FIRST,
  STICKY_HEAD,
  TableFrame,
} from "@/components/stock/doc-parts";
import { TimeField } from "@/components/time-field";
import {
  INSPECTORS,
  INSPECT_DOC,
  INSPECT_TEMPLATE,
  answerOf,
  canAddRound,
  computedOf,
  editableIn,
  newRound,
  noteMissing,
  overallOf,
  summaryText,
  verdictOf,
  type Answer,
  type Round,
} from "@/lib/qc-inspect";
import {
  VERDICT_WORDS,
  describeItemRules,
  showsTick,
  type QcItem,
} from "@/lib/qc-template";

/* ------------------------------------------------------------------
   ใบตรวจแบบตาราง — อีกแพทเทิร์นหนึ่งของหน้าเดียวกับ /qc/inspect

   ต่างจากแบบแท็บสองอย่าง
     รอบเป็นการ์ดหุบ/กางได้ ไม่ใช่แท็บ — เห็นทุกรอบพร้อมกันในหน้าเดียว
     ว่ารอบไหนตรวจแล้วผลเป็นยังไง โดยไม่ต้องกดสลับไปทีละแท็บ
     ข้อตรวจเป็นแถวในตาราง ไม่ใช่การ์ดต่อข้อ — แปดข้ออยู่ในความสูงหนึ่งจอ
     แทนที่จะเป็นการ์ดแปดใบเรียงลงไปยาวสามจอ

   ช่องที่ต้องคีย์รวมอยู่ในคอลัมน์เดียว ไม่ได้แตกเป็นคอลัมน์ละช่อง
   เพราะแต่ละข้อมีช่องไม่เท่ากัน — ข้อ 2 มีสามช่อง (N P K) ข้อ 3–7 ไม่มีเลย
   แตกเป็นคอลัมน์จริงจะได้ตารางที่ว่างเป็นส่วนใหญ่

   ข้อที่ตรวจครั้งเดียวยังเป็นแถวอยู่ในรอบหลัง ๆ แต่ช่องกรอกถูกปิด
   โครงตารางจึงเหมือนกันทุกรอบ กวาดตาหาแถวเดิมได้ที่ตำแหน่งเดิม
------------------------------------------------------------------ */

const fmtTon = (v: number) =>
  v.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** หัวการ์ดต้องบอกผลรวมของรอบให้ได้ตอนที่การ์ดหุบอยู่ */
function summarize(items: QcItem[], round: Round, ri: number) {
  const mine = items.filter((i) => editableIn(i, ri));
  let done = 0;
  let fail = 0;
  for (const i of mine) {
    const v = verdictOf(i, answerOf(round, i.id));
    if (v === null) continue;
    done += 1;
    if (!v) fail += 1;
  }
  return { total: mine.length, done, fail };
}

export default function QcInspectTablePage() {
  const router = useRouter();
  const items = INSPECT_TEMPLATE.items;

  const [docRef, setDocRef] = React.useState(INSPECT_DOC.refOptions[0]);
  const [product, setProduct] = React.useState(INSPECT_DOC.product);
  const [rounds, setRounds] = React.useState<Round[]>([newRound("r1")]);
  // กางเฉพาะรอบแรกไว้ตั้งแต่เปิดหน้า รอบที่ยังไม่ถึงไม่ต้องกินที่
  const [open, setOpen] = React.useState<Record<string, boolean>>({ r1: true });

  const patchAnswer = (roundId: string, itemId: string, p: Partial<Answer>) =>
    setRounds((rs) =>
      rs.map((r) =>
        r.id !== roundId
          ? r
          : {
              ...r,
              answers: {
                ...r.answers,
                [itemId]: { ...answerOf(r, itemId), ...p },
              },
            }
      )
    );

  const patchRound = (roundId: string, p: Partial<Round>) =>
    setRounds((rs) => rs.map((r) => (r.id === roundId ? { ...r, ...p } : r)));

  /** เพิ่มรอบแล้วกางอันใหม่ หุบอันเก่า — คนกดเพิ่งบอกว่าจะทำรอบใหม่ */
  const addRound = () => {
    const id = `r${rounds.length + 1}`;
    setRounds((rs) => [...rs, newRound(id)]);
    setOpen({ [id]: true });
  };

  const failed = items.filter((i) => overallOf(i, rounds) === false);

  /**
   * ยอดที่ไม่ผ่านคิดตามสัดส่วนข้อที่ตก — ยังไม่มีหลังบ้านให้ผูกยอดจริง
   * ตรวจยังไม่เสร็จก็ยังบอกไม่ได้ ขึ้นขีดไว้ตามแบบ
   */
  const answered = items.some((i) => overallOf(i, rounds) !== null);
  const failTon = answered
    ? (INSPECT_DOC.inspectTon * failed.length) / items.length
    : null;
  const inTon = failTon === null ? null : INSPECT_DOC.inspectTon - failTon;


  const save = () => {
    const bad = rounds.findIndex((r, i) => {
      if (r.time === "") return true;
      const s = summarize(items, r, i);
      if (s.done < s.total) return true;
      return items
        .filter((x) => editableIn(x, i))
        .some((x) => noteMissing(x, answerOf(r, x.id)));
    });
    if (bad >= 0) {
      toast.error(`ครั้งที่ ${bad + 1} ยังกรอกไม่ครบ`, {
        description: "ต้องมีเวลาที่ตรวจ ผลการตรวจทุกข้อ และเหตุผลของข้อที่ไม่ผ่าน",
      });
      setOpen({ [rounds[bad].id]: true });
      return;
    }
    toast.success(`บันทึกใบตรวจ ${INSPECT_TEMPLATE.formCode} แล้ว`, {
      description:
        failed.length > 0
          ? `ไม่ผ่าน ${failed.length} ข้อ`
          : `ตรวจ ${rounds.length} ครั้ง ผ่านทุกข้อ`,
    });
  };

  return (
    <main className="@container mx-auto w-full max-w-6xl px-4 pt-6 pb-24 sm:px-6">
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
            <BreadcrumbPage className="text-primary">ใบตรวจ (แบบตาราง)</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {INSPECT_TEMPLATE.name}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {INSPECT_TEMPLATE.formCode} {INSPECT_TEMPLATE.revision}
          </p>
        </div>
        {/* ลิงก์ไปอีกแพทเทิร์นหนึ่ง จะได้สลับดูเทียบกันได้โดยไม่ต้องพิมพ์ URL เอง */}
        <Button asChild variant="outline" size="sm">
          <Link href="/qc/inspect">ดูแบบแท็บต่อรอบ</Link>
        </Button>
      </div>

      <div className="mt-4 grid gap-4 @2xl:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="doc-ref">เลขที่เอกสาร (Ref.)</Label>
          <Select value={docRef} onValueChange={setDocRef}>
            <SelectTrigger id="doc-ref" className="w-full bg-card">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {INSPECT_DOC.refOptions.map((o) => (
                <SelectItem key={o} value={o}>
                  {o}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="doc-product">วัตถุดิบ/สินค้า</Label>
          <Select value={product} onValueChange={setProduct}>
            <SelectTrigger id="doc-product" className="w-full bg-card">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {INSPECT_DOC.productOptions.map((o) => (
                <SelectItem key={o} value={o}>
                  {o}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="font-semibold">{product}</span>
            <span className="text-sm text-muted-foreground">{INSPECT_DOC.kind}</span>
            <span className="text-border" aria-hidden>
              |
            </span>
            <span className="text-sm text-muted-foreground">
              {INSPECT_DOC.packing}
            </span>
            <Badge tone="brand" appearance="soft">
              {INSPECT_DOC.lot}
            </Badge>
          </p>
          <p className="text-sm">{INSPECT_DOC.supplier}</p>
        </div>
        {/* สี่ตัวเลขตามแบบ — สองตัวหลังคำนวณจากยอดที่ตรวจกับสัดส่วนที่ไม่ผ่าน
            ของที่ไม่ผ่านไม่ได้เข้าคลัง ยอดเข้าคลังจึงเป็นยอดตรวจลบส่วนที่ตก */}
        <div className="mt-3 grid gap-4 rounded-lg bg-brand p-4 @2xl:grid-cols-4">
          <Stat label="ตรวจสอบ (ตัน)" value={fmtTon(INSPECT_DOC.inspectTon)} />
          <Stat
            label="ไม่ผ่าน (ตัน)"
            value={failTon === null ? "-" : fmtTon(failTon)}
            danger={!!failTon}
          />
          <Stat
            label="เข้าคลังเฉลี่ย (ตัน)"
            value={inTon === null ? "-" : fmtTon(inTon / rounds.length)}
          />
          <Stat label="เข้าคลัง (ตัน)" value={inTon === null ? "-" : fmtTon(inTon)} />
        </div>
      </div>

      {/* ---------- การ์ดต่อรอบ หุบ/กางได้ ---------- */}
      <div className="mt-6 space-y-3">
        {rounds.map((round, ri) => (
          <RoundCard
            key={round.id}
            items={items}
            round={round}
            index={ri}
            allRounds={rounds}
            firstRound={rounds[0]}
            open={open[round.id] ?? false}
            onOpenChange={(v) =>
              setOpen((o) => ({ ...o, [round.id]: v }))
            }
            onPatchRound={(p) => patchRound(round.id, p)}
            onPatchAnswer={(itemId, p) => patchAnswer(round.id, itemId, p)}
          />
        ))}

        {canAddRound(items, rounds.length) && (
          <Button variant="outline-primary" className="w-full" onClick={addRound}>
            <PlusIcon />
            เพิ่มครั้งที่ {rounds.length + 1}
          </Button>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <span className="text-sm text-muted-foreground">
            {rounds.length} ครั้ง · {items.length} ข้อตรวจ
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => router.back()}>
              ย้อนกลับ
            </Button>
            <Button onClick={save}>บันทึกใบตรวจ</Button>
          </div>
        </div>
      </div>
    </main>
  );
}

// ---------------------------------------------------------------

function Stat({
  label,
  value,
  danger,
}: {
  label: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-0.5 text-lg font-semibold tabular-nums",
          danger && "text-danger-strong"
        )}
      >
        {value}
      </p>
    </div>
  );
}

function RoundCard({
  items,
  round,
  index,
  allRounds,
  firstRound,
  open,
  onOpenChange,
  onPatchRound,
  onPatchAnswer,
}: {
  items: QcItem[];
  round: Round;
  index: number;
  /** ทุกรอบ — ตัวเลขรวมอย่างน้ำหนักรวมกับค่าเฉลี่ยคิดข้ามรอบ ไม่ใช่แค่รอบนี้ */
  allRounds: Round[];
  /** รอบแรก — ใช้ดึงคำตอบของข้อที่ตรวจครั้งเดียวมาโชว์ในรอบหลัง ๆ */
  firstRound: Round;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onPatchRound: (p: Partial<Round>) => void;
  onPatchAnswer: (itemId: string, p: Partial<Answer>) => void;
}) {
  const s = summarize(items, round, index);

  return (
    <Collapsible
      open={open}
      onOpenChange={onOpenChange}
      className="overflow-hidden rounded-xl border border-border bg-card"
    >
      {/* ---- หัวการ์ด: ครั้งที่เท่าไหร่อยู่ซ้าย ผลตรวจอยู่ขวา ----
           หุบอยู่ก็ยังต้องตอบให้ได้ว่ารอบนี้ตรวจแล้วหรือยัง ผลเป็นยังไง
           ไม่งั้นต้องกางทุกใบเพื่อหาว่าอันไหนยังไม่เสร็จ */}
      <CollapsibleTrigger className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-accent-hover">
        <ChevronDownIcon
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180"
          )}
        />
        <div className="min-w-0 flex-1">
          <span className="font-semibold">ตรวจครั้งที่ {index + 1}</span>
          <span className="ml-3 text-sm text-muted-foreground tabular-nums">
            {round.time || "ยังไม่ระบุเวลา"}
            {round.inspector && ` · ${round.inspector}`}
          </span>
        </div>
        <RoundBadge {...s} />
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="border-t border-border px-4 py-4">
          {/* เวลากับผู้ตรวจเป็นของรอบ ไม่ใช่ของแต่ละข้อ */}
          <div className="grid gap-4 @2xl:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor={`${round.id}-time`}>เวลาตรวจสอบ</Label>
              <TimeField
                id={`${round.id}-time`}
                value={round.time}
                onValueChange={(time) => onPatchRound({ time })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${round.id}-date`}>วันที่ตรวจ</Label>
              <Input
                id={`${round.id}-date`}
                type="date"
                className="bg-card tabular-nums"
                value={round.date}
                onChange={(e) => onPatchRound({ date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${round.id}-by`}>ผู้ตรวจ</Label>
              <Select
                value={round.inspector}
                onValueChange={(inspector) => onPatchRound({ inspector })}
              >
                <SelectTrigger id={`${round.id}-by`} className="w-full bg-card">
                  <SelectValue placeholder="เลือกผู้ตรวจ" />
                </SelectTrigger>
                <SelectContent>
                  {INSPECTORS.map((n) => (
                    <SelectItem key={n} value={n}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* ---- ตารางข้อตรวจ ----
             ใช้ TableFrame ชุดเดียวกับตารางอื่นในระบบ ระยะในเซลล์ 16px
             ไม่ใช่ 8px ของ DS ซึ่งแน่นเกินไปสำหรับตารางที่มีช่องกรอกอยู่ข้างใน
             ปิดกรอบนอกไว้เพราะการ์ดของรอบมีกรอบอยู่แล้ว เหลือแค่เส้นบน */}
        <TableFrame className="rounded-none border-0 border-t border-border">
          <Table>
            <TableHeader className={cn(STICKY_HEAD, "[&_th]:leading-snug")}>
              <TableRow>
                {/* ตรึงคอลัมน์เดียว ไม่ใช่สองคอลัมน์ซ้อนกัน
                    ตรึงสองคอลัมน์ต้องรู้ความกว้างของคอลัมน์แรกเป๊ะ ๆ ไปใส่เป็น left ของอันที่สอง
                    ตารางกว้างอัตโนมัติแล้วเลขไม่ตรง คอลัมน์ที่สองจะเลื่อนไปทับคอลัมน์ถัดไป
                    เอาลำดับข้อมาไว้ในเซลล์เดียวกับหัวข้อไปเลย เหมือนที่กระดาษอ่านว่า "8 ความชื้น" */}
                <TableHead className={cn(HEAD_FIRST, "min-w-56")}>
                  หัวข้อ
                </TableHead>
                <TableHead className="min-w-60">เกณฑ์</TableHead>
                <TableHead className="min-w-48">ค่าที่วัด</TableHead>
                <TableHead className="min-w-44">ผลการตรวจสอบ</TableHead>
                <TableHead className="min-w-48">หมายเหตุ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item, i) => (
                <ItemLine
                  summary={summaryText(item, allRounds)}
                  key={item.id}
                  item={item}
                  index={i}
                  editable={editableIn(item, index)}
                  answer={answerOf(
                    editableIn(item, index) ? round : firstRound,
                    item.id
                  )}
                  onPatch={(p) => onPatchAnswer(item.id, p)}
                />
              ))}
            </TableBody>
          </Table>
        </TableFrame>
      </CollapsibleContent>
    </Collapsible>
  );
}

function RoundBadge({
  total,
  done,
  fail,
}: {
  total: number;
  done: number;
  fail: number;
}) {
  if (fail > 0)
    return (
      <Badge tone="danger" appearance="soft">
        <CircleXIcon />
        ไม่ผ่าน {fail} ข้อ
      </Badge>
    );
  if (done === 0)
    return (
      <span className="flex shrink-0 items-center gap-1 text-sm text-muted-foreground">
        <CircleDashedIcon className="size-4" />
        ยังไม่ตรวจ
      </span>
    );
  if (done < total)
    return (
      <Badge tone="warning" appearance="soft">
        กรอกแล้ว {done}/{total}
      </Badge>
    );
  return (
    <Badge tone="success" appearance="soft">
      <CircleCheckIcon />
      ผ่าน {done}/{total}
    </Badge>
  );
}

/**
 * หนึ่งข้อตรวจ = หนึ่งแถว
 *
 * ช่องที่ต้องคีย์อยู่รวมในคอลัมน์ "ค่าที่วัด" คอลัมน์เดียว
 * เพราะแต่ละข้อมีช่องไม่เท่ากัน แตกเป็นคอลัมน์จริงจะได้ตารางที่ว่างเป็นส่วนใหญ่
 *
 * รอบหลัง ๆ ข้อที่ตรวจครั้งเดียวยังเป็นแถวอยู่ แต่ปิดไม่ให้แก้
 * และโชว์คำตอบจากรอบแรก โครงตารางเลยเหมือนกันทุกรอบ หาแถวเดิมได้ที่เดิม
 */
function ItemLine({
  item,
  index,
  editable,
  answer,
  summary,
  onPatch,
}: {
  item: QcItem;
  index: number;
  editable: boolean;
  answer: Answer;
  summary: { label: string; value: string }[];
  onPatch: (p: Partial<Answer>) => void;
}) {
  const [pass, fail] = VERDICT_WORDS[item.verdictWording];
  const verdict = verdictOf(item, answer);
  const computed = computedOf(item, answer);
  const needNote = editable && noteMissing(item, answer);
  const rowId = `${item.id}-${editable ? "e" : "ro"}`;

  return (
    <TableRow className={cn(!editable && "text-muted-foreground")}>
      <TableCell className={COL_FIRST}>
        <span className="text-muted-foreground tabular-nums">{index + 1}.</span>{" "}
        <span className="font-medium">{item.title}</span>
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {item.criteria || describeItemRules(item) || "—"}
      </TableCell>

      {/* ตัวเลขรวมของทุกครั้งอยู่ใต้ช่องค่าที่วัด ไม่ได้แยกเป็นคอลัมน์ของตัวเอง
          เป็นตัวเลขชุดเดียวกัน แค่มองคนละมุม — ครั้งนี้เท่าไหร่ กับรวมทุกครั้งเท่าไหร่
          แยกคอลัมน์แล้วตารางล้นออกนอกกรอบ 133px ทั้งที่มีข้อมูลแค่สองในแปดแถว */}
      <TableCell>
        {item.fields.length === 0 ? (
          <span className="text-sm text-muted-foreground">—</span>
        ) : (
          <div className="flex flex-wrap gap-2">
            {item.fields.map((f) => (
              <div key={f.id} className="min-w-24 flex-1">
                <Label
                  htmlFor={`${rowId}-${f.id}`}
                  className="text-xs font-normal text-muted-foreground"
                >
                  {f.label}
                  {f.unit && ` (${f.unit})`}
                </Label>
                <Input
                  id={`${rowId}-${f.id}`}
                  type={f.type === "number" ? "number" : "text"}
                  inputMode={f.type === "number" ? "decimal" : undefined}
                  disabled={!editable}
                  className={cn(
                    "mt-1 bg-card",
                    f.type === "number" && "text-right tabular-nums"
                  )}
                  placeholder={f.type === "number" ? "0.00" : "—"}
                  value={answer.values[f.id] ?? ""}
                  onChange={(e) =>
                    onPatch({
                      values: { ...answer.values, [f.id]: e.target.value },
                    })
                  }
                />
              </div>
            ))}
          </div>
        )}

        {summary.length > 0 && (
          <div className="mt-2">
            {summary.map((s) => (
              <span key={s.label} className="block text-xs whitespace-nowrap">
                <span className="text-muted-foreground">{s.label}: </span>
                <span className="font-semibold tabular-nums">{s.value}</span>
              </span>
            ))}
          </div>
        )}
      </TableCell>

      <TableCell>
        {!editable ? (
          // ตรวจครั้งเดียวและตอบไปแล้ว รอบนี้ได้แค่อ่าน
          <div className="flex items-center gap-2">
            <Verdict value={verdict} words={[pass, fail]} />
            <span className="text-sm">ครั้งที่ 1</span>
          </div>
        ) : showsTick(item) ? (
          <>
            <RadioGroup
              className="flex items-center gap-4"
              value={answer.pass === null ? "" : answer.pass ? "p" : "f"}
              onValueChange={(v) => onPatch({ pass: v === "p" })}
            >
              <Label
                htmlFor={`${rowId}-p`}
                className="flex items-center gap-2 font-normal"
              >
                <RadioGroupItem id={`${rowId}-p`} value="p" />
                {pass}
              </Label>
              <Label
                htmlFor={`${rowId}-f`}
                className="flex items-center gap-2 font-normal"
              >
                <RadioGroupItem id={`${rowId}-f`} value="f" />
                {fail}
              </Label>
            </RadioGroup>
            {computed !== null && (
              <span className="mt-1 block text-xs text-muted-foreground">
                ตามเกณฑ์: {computed ? pass : fail}
              </span>
            )}
          </>
        ) : (
          <Verdict value={verdict} words={[pass, fail]} />
        )}
      </TableCell>

      <TableCell>
        {item.note === "off" ? (
          <span className="text-sm text-muted-foreground">—</span>
        ) : (
          <Input
            aria-label={`หมายเหตุของ ${item.title}`}
            disabled={!editable}
            className={cn("bg-card", needNote && "border-destructive")}
            placeholder={needNote ? `ระบุเหตุผลที่${fail}` : "—"}
            value={answer.note}
            onChange={(e) => onPatch({ note: e.target.value })}
          />
        )}
      </TableCell>
    </TableRow>
  );
}

function Verdict({
  value,
  words,
}: {
  value: boolean | null;
  words: [string, string];
}) {
  if (value === null)
    return (
      <span className="flex shrink-0 items-center gap-1 text-sm text-muted-foreground">
        <CircleDashedIcon className="size-4" />
        รอตรวจ
      </span>
    );
  return value ? (
    <Badge tone="success" appearance="soft">
      <CircleCheckIcon />
      {words[0]}
    </Badge>
  ) : (
    <Badge tone="danger" appearance="soft">
      <CircleXIcon />
      {words[1]}
    </Badge>
  );
}
