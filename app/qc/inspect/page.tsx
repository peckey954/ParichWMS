"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@peckey954/ui/components/ui/tabs";
import { cn } from "@peckey954/ui/lib/utils";
import { toast } from "sonner";
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
  roundDone,
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
   ใบตรวจจริง — หน้าที่ผู้ตรวจกรอกหน้าไลน์

   หน่วยของงานคือรอบ ไม่ใช่ข้อ ผู้ตรวจเดินไปที่ไลน์ตอน 10:00
   แล้วตรวจครบทุกข้อรวดเดียว กลับมาใหม่ 13:00 ทำอีกรอบ
   ฟอร์มกระดาษต้นฉบับจึงวางรอบเป็นคอลัมน์ ข้อเป็นแถว
   หนึ่งเที่ยว = ไล่กรอกลงหนึ่งคอลัมน์จากบนถึงล่าง

   หน้านี้จึงเป็นแท็บต่อรอบ ไม่ใช่เอาสามรอบมากางพร้อมกันในตารางของแต่ละข้อ
   แบบนั้นตอน 10:00 ต้องเลื่อนหาแถว "ครั้งที่ 1" ของทุกข้อทีละข้อ
   แล้วข้ามแถวของรอบที่ยังไม่ถึงซึ่งคาอยู่รอให้คีย์ผิด

   เวลากับผู้ตรวจอยู่หัวรอบ ไม่ได้อยู่ในแต่ละข้อ
   เดินไปครั้งเดียวแล้วพิมพ์ 10:00 แปดหนคือตอบคำถามเดิมแปดครั้ง

   มีแท็บ "ดูทั้งใบ" คู่กันเสมอ เพราะแท็บต่อรอบตอบไม่ได้ว่า
   "ครั้งที่ 1 ผ่าน ครั้งที่ 2 ไม่ผ่าน เกิดอะไรขึ้นระหว่างนั้น"
   ตารางเต็มใบวางเหมือนกระดาษเป๊ะ กวาดตาแนวนอนทีเดียวเห็นว่าข้อไหนเปลี่ยน
------------------------------------------------------------------ */

const fmtTon = (v: number) =>
  v.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function QcInspectPage() {
  const router = useRouter();
  const items = INSPECT_TEMPLATE.items;

  const [docRef, setDocRef] = React.useState(INSPECT_DOC.refOptions[0]);
  const [product, setProduct] = React.useState(INSPECT_DOC.product);
  const [rounds, setRounds] = React.useState<Round[]>([newRound("r1")]);
  const [tab, setTab] = React.useState("r1");

  const patchAnswer = (
    roundId: string,
    itemId: string,
    p: Partial<Answer>
  ) =>
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

  const addRound = () => {
    const id = `r${rounds.length + 1}`;
    setRounds((rs) => [...rs, newRound(id)]);
    setTab(id);
  };

  const failed = items.filter((i) => overallOf(i, rounds) === false);

  const save = () => {
    const bad = rounds.findIndex((r, i) => !roundDone(items, r, i));
    if (bad >= 0) {
      toast.error(`ครั้งที่ ${bad + 1} ยังกรอกไม่ครบ`, {
        description: "ต้องมีเวลาที่ตรวจ ค่าที่วัด ผลการตรวจ และเหตุผลของข้อที่ไม่ผ่าน",
      });
      setTab(rounds[bad].id);
      return;
    }
    toast.success(`บันทึกใบตรวจ ${INSPECT_TEMPLATE.formCode} แล้ว`, {
      description:
        failed.length > 0
          ? `ไม่ผ่าน ${failed.length} ข้อ — ต้องระบุการจัดการก่อนปิดงาน`
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
            <BreadcrumbPage className="text-primary">ใบตรวจ</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <h1 className="mt-2 text-2xl font-semibold tracking-tight">
        {INSPECT_TEMPLATE.name}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {INSPECT_TEMPLATE.formCode} {INSPECT_TEMPLATE.revision}
      </p>

      {/* ---------- ใบตรวจนี้ผูกกับเอกสารไหน ---------- */}
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

      {/* ---------- ของอะไร ของใคร และยอดที่ต้องตรวจ ---------- */}
      <div className="mt-4 rounded-xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="font-semibold">{product}</span>
            <span className="text-sm text-muted-foreground">
              {INSPECT_DOC.kind}
            </span>
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

        <div className="mt-3 grid gap-4 rounded-lg bg-brand p-4 @2xl:grid-cols-4">
          <Stat label="ตรวจสอบ (ตัน)" value={fmtTon(INSPECT_DOC.inspectTon)} />
          <Stat label="ตรวจแล้ว (ครั้ง)" value={String(rounds.length)} />
          <Stat
            label="ข้อที่ไม่ผ่าน"
            value={failed.length === 0 ? "—" : String(failed.length)}
            danger={failed.length > 0}
          />
          <Stat
            label="สถานะใบตรวจ"
            value={
              rounds.every((r, i) => roundDone(items, r, i))
                ? "กรอกครบแล้ว"
                : "ยังกรอกไม่ครบ"
            }
          />
        </div>
      </div>

      {/* ---------- แท็บต่อรอบ + ตารางเต็มใบ ---------- */}
      <Tabs value={tab} onValueChange={setTab} className="mt-6 gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <TabsList>
            {rounds.map((r, i) => (
              <TabsTrigger key={r.id} value={r.id} className="gap-1.5">
                ครั้งที่ {i + 1}
                {/* จุดบอกว่ารอบไหนกรอกครบแล้ว ไม่ต้องเข้าไปเปิดดูทีละแท็บ */}
                <span
                  className={cn(
                    "size-1.5 rounded-full",
                    roundDone(items, r, i) ? "bg-success-strong" : "bg-border"
                  )}
                />
              </TabsTrigger>
            ))}
            <TabsTrigger value="all">ดูทั้งใบ</TabsTrigger>
          </TabsList>

          {canAddRound(items, rounds.length) && (
            <Button variant="outline-primary" size="sm" onClick={addRound}>
              <PlusIcon />
              เพิ่มครั้ง
            </Button>
          )}
        </div>

        {rounds.map((round, ri) => (
          <TabsContent key={round.id} value={round.id} className="space-y-4">
            <RoundHead
              index={ri}
              round={round}
              onPatch={(p) => patchRound(round.id, p)}
            />

            {items
              .filter((i) => editableIn(i, ri))
              .map((item) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  index={items.indexOf(item)}
                  answer={answerOf(round, item.id)}
                  onPatch={(p) => patchAnswer(round.id, item.id, p)}
                />
              ))}

            {/* ข้อที่ตรวจครั้งเดียวไม่หายไปเฉย ๆ ในรอบหลัง ๆ
                ยังอยู่ในหน้าแต่จางและกดไม่ได้ พร้อมคำตอบที่บันทึกไว้รอบแรก
                ซ่อนทิ้งไปเลยแล้วผู้ตรวจจะสงสัยว่าข้อ 3–7 หายไปไหน */}
            {ri > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  ตรวจครั้งเดียว — บันทึกไว้แล้วเมื่อ {rounds[0].time || "—"}
                </p>
                {items
                  .filter((i) => !editableIn(i, ri))
                  .map((item) => (
                    <DoneRow
                      key={item.id}
                      item={item}
                      index={items.indexOf(item)}
                      answer={answerOf(rounds[0], item.id)}
                    />
                  ))}
              </div>
            )}
          </TabsContent>
        ))}

        <TabsContent value="all">
          <SheetView items={items} rounds={rounds} />
        </TabsContent>
      </Tabs>

      {/* ---------- แถบบันทึก ---------- */}
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

/** เวลากับผู้ตรวจของรอบนี้ — ค่าเดียวใช้ทั้งรอบ ไม่ใช่ถามซ้ำทุกข้อ */
function RoundHead({
  index,
  round,
  onPatch,
}: {
  index: number;
  round: Round;
  onPatch: (p: Partial<Round>) => void;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="font-semibold">ตรวจครั้งที่ {index + 1}</p>
      <div className="mt-3 grid gap-4 @2xl:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor={`${round.id}-time`}>เวลาที่ตรวจ</Label>
          <TimeField
            id={`${round.id}-time`}
            value={round.time}
            onValueChange={(time) => onPatch({ time })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${round.id}-date`}>วันที่ตรวจ</Label>
          <Input
            id={`${round.id}-date`}
            type="date"
            className="bg-card tabular-nums"
            value={round.date}
            onChange={(e) => onPatch({ date: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${round.id}-by`}>ผู้ตรวจ</Label>
          <Select
            value={round.inspector}
            onValueChange={(inspector) => onPatch({ inspector })}
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
  );
}

function ItemRow({
  item,
  index,
  answer,
  onPatch,
}: {
  item: QcItem;
  index: number;
  answer: Answer;
  onPatch: (p: Partial<Answer>) => void;
}) {
  const [pass, fail] = VERDICT_WORDS[item.verdictWording];
  const ruleText = describeItemRules(item);
  const verdict = verdictOf(item, answer);
  const computed = computedOf(item, answer);
  const needNote = noteMissing(item, answer);

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
        <div className="min-w-0">
          <p className="font-semibold">
            {index + 1}. {item.title}
          </p>
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
        <Verdict value={verdict} words={[pass, fail]} />
      </div>

      <div className="mt-3 grid gap-4 @3xl:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
        {/* ช่องที่ต้องคีย์ — ไม่มีเลยก็ไม่ต้องมีคอลัมน์นี้ */}
        {item.fields.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {item.fields.map((f) => (
              <div key={f.id} className="min-w-32 flex-1 space-y-2">
                <Label htmlFor={f.id} className="text-sm font-normal">
                  {f.label}
                  {f.unit && (
                    <span className="text-muted-foreground"> ({f.unit})</span>
                  )}
                </Label>
                <Input
                  id={f.id}
                  type={f.type === "number" ? "number" : "text"}
                  inputMode={f.type === "number" ? "decimal" : undefined}
                  className={cn(
                    "bg-card",
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

        {showsTick(item) && (
          <div className="space-y-2">
            <Label className="text-sm font-normal">ผลการตรวจ</Label>
            <RadioGroup
              className="flex h-9 items-center gap-4"
              value={answer.pass === null ? "" : answer.pass ? "p" : "f"}
              onValueChange={(v) => onPatch({ pass: v === "p" })}
            >
              <Label
                htmlFor={`${item.id}-p`}
                className="flex items-center gap-2 font-normal"
              >
                <RadioGroupItem id={`${item.id}-p`} value="p" />
                {pass}
              </Label>
              <Label
                htmlFor={`${item.id}-f`}
                className="flex items-center gap-2 font-normal"
              >
                <RadioGroupItem id={`${item.id}-f`} value="f" />
                {fail}
              </Label>
            </RadioGroup>
            {/* ผลที่คำนวณจากเกณฑ์ขึ้นเป็นตัวช่วย ไม่ได้ติ๊กให้ ผู้ตรวจยังตัดสินเอง */}
            {computed !== null && (
              <p className="text-sm text-muted-foreground">
                ตามเกณฑ์: {computed ? pass : fail}
              </p>
            )}
          </div>
        )}

        {item.note !== "off" && (
          <div className="space-y-2">
            <Label htmlFor={`${item.id}-note`} className="text-sm font-normal">
              หมายเหตุ{" "}
              <span className="text-muted-foreground">
                ({item.note === "always"
                  ? "บังคับ"
                  : item.note === "onFail"
                    ? `บังคับเมื่อ${fail}`
                    : "ไม่บังคับ"})
              </span>
            </Label>
            <Input
              id={`${item.id}-note`}
              className={cn("bg-card", needNote && "border-destructive")}
              placeholder={needNote ? `ระบุเหตุผลที่${fail}` : "—"}
              value={answer.note}
              onChange={(e) => onPatch({ note: e.target.value })}
            />
          </div>
        )}
      </div>
    </div>
  );
}

/** ข้อที่ตรวจครั้งเดียวและตอบไปแล้ว — อ่านได้ แก้ไม่ได้ */
function DoneRow({
  item,
  index,
  answer,
}: {
  item: QcItem;
  index: number;
  answer: Answer;
}) {
  const [pass, fail] = VERDICT_WORDS[item.verdictWording];
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dashed border-border px-4 py-3">
      <span className="text-sm text-muted-foreground">
        {index + 1}. {item.title}
      </span>
      <Verdict value={verdictOf(item, answer)} words={[pass, fail]} />
    </div>
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

/**
 * ตารางเต็มใบ — วางเหมือนฟอร์มกระดาษต้นฉบับ ข้อเป็นแถว รอบเป็นคอลัมน์
 *
 * แท็บต่อรอบตอบไม่ได้ว่า "ครั้งที่ 1 ผ่าน ครั้งที่ 2 ไม่ผ่าน เกิดอะไรขึ้น"
 * ตารางนี้กวาดตาแนวนอนทีเดียวเห็นว่าข้อไหนเปลี่ยนสถานะระหว่างรอบ
 * และเป็นตัวที่พิมพ์ออกมาแล้วตรงกับใบที่ผู้ตรวจสอบภายนอกคุ้นอยู่แล้ว
 */
function SheetView({ items, rounds }: { items: QcItem[]; rounds: Round[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <Table>
        <TableHeader className="[&_th]:h-auto [&_th]:py-3 [&_th]:leading-snug">
          <TableRow>
            <TableHead className="w-14 pl-4">ข้อ</TableHead>
            <TableHead className="min-w-52">รายการตรวจ</TableHead>
            <TableHead className="min-w-56">เกณฑ์มาตรฐาน</TableHead>
            {rounds.map((r, i) => (
              <TableHead key={r.id} className="min-w-32 text-center">
                ครั้งที่ {i + 1}
                <span className="block font-normal text-muted-foreground tabular-nums">
                  {r.time || "—"}
                </span>
              </TableHead>
            ))}
            <TableHead className="min-w-28 pr-4 text-center">สรุป</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item, i) => {
            const [pass, fail] = VERDICT_WORDS[item.verdictWording];
            return (
              <TableRow key={item.id}>
                <TableCell className="pl-4 tabular-nums">{i + 1}</TableCell>
                <TableCell>
                  <span className="font-medium">{item.title}</span>
                  {item.description && (
                    <span className="block text-sm text-muted-foreground">
                      {item.description}
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {item.criteria || describeItemRules(item) || "—"}
                </TableCell>

                {rounds.map((r, ri) => {
                  // ข้อที่ตรวจครั้งเดียว ช่องของรอบหลังเป็นขีด ไม่ใช่ "รอตรวจ"
                  if (!editableIn(item, ri))
                    return (
                      <TableCell key={r.id} className="text-center text-sm text-muted-foreground">
                        —
                      </TableCell>
                    );
                  const a = answerOf(r, item.id);
                  const v = verdictOf(item, a);
                  const shown = item.fields
                    .map((f) => a.values[f.id])
                    .filter((x) => x && x.trim() !== "")
                    .join(" / ");
                  return (
                    <TableCell key={r.id} className="text-center">
                      {shown && (
                        <span className="block text-sm tabular-nums">
                          {shown}
                        </span>
                      )}
                      <Verdict value={v} words={[pass, fail]} />
                      {a.note && (
                        <span className="mt-1 block text-sm text-muted-foreground">
                          {a.note}
                        </span>
                      )}
                    </TableCell>
                  );
                })}

                <TableCell className="pr-4 text-center">
                  <Verdict
                    value={overallOf(item, rounds)}
                    words={[pass, fail]}
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
