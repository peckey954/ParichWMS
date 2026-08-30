"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDownIcon,
  CircleCheckIcon,
  CircleDashedIcon,
  CircleXIcon,
  LockIcon,
  PencilIcon,
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@peckey954/ui/components/ui/collapsible";
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
  roundDone,
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
   ใบตรวจจริง — หน้าที่ผู้ตรวจกรอกหน้าไลน์

   หน่วยของงานคือรอบ ไม่ใช่ข้อ ผู้ตรวจเดินไปที่ไลน์ตอน 10:00
   แล้วตรวจครบทุกข้อรวดเดียว กลับมาใหม่ 13:00 ทำอีกรอบ
   ฟอร์มกระดาษต้นฉบับจึงวางรอบเป็นคอลัมน์ ข้อเป็นแถว
   หนึ่งเที่ยว = ไล่กรอกลงหนึ่งคอลัมน์จากบนถึงล่าง

   หน้านี้จึงเป็นการ์ดต่อรอบ หุบ/กางได้ ไม่ใช่เอาสามรอบมากางพร้อมกัน
   ในตารางของแต่ละข้อ แบบนั้นตอน 10:00 ต้องเลื่อนหาแถว "ครั้งที่ 1"
   ของทุกข้อทีละข้อ แล้วข้ามแถวของรอบที่ยังไม่ถึงซึ่งคาอยู่รอให้คีย์ผิด

   ไม่ใช้แท็บ เพราะแท็บโชว์ได้ทีละรอบ จะรู้ว่ารอบไหนเสร็จแล้วต้องกดเข้าไปดูทีละอัน
   การ์ดเรียงลงมาเห็นทุกรอบพร้อมกัน หัวการ์ดบอกเวลา ผู้ตรวจ และผลของรอบนั้น

   บันทึกทีละรอบ ไม่ใช่กดทีเดียวตอนจบทั้งใบ
   รอบห่างกันเป็นชั่วโมง ผู้ตรวจไม่ได้เปิดหน้าจอค้างไว้ทั้งวัน
   บันทึกแล้วล็อกไว้ กดแก้ไขเพื่อเปิดกลับมาได้ถ้าคีย์ผิด

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
  /**
   * กางได้ทีละรอบ ไม่ใช่หลายรอบพร้อมกัน
   *
   * เพราะปุ่มบันทึกอยู่ที่แถบล่างของหน้าซึ่งมีอันเดียว
   * ถ้ากางสองรอบพร้อมกัน ปุ่มนั้นจะตอบไม่ได้ว่ากำลังจะบันทึกรอบไหน
   * อยากเทียบข้ามรอบใช้การ์ดสรุปทั้งใบ ซึ่งเปิดแยกจากรอบได้
   */
  const [openRound, setOpenRound] = React.useState<string | null>("r1");
  const [openAll, setOpenAll] = React.useState(false);

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

  /** เพิ่มรอบแล้วกางอันใหม่ หุบอันเก่า คนกดเพิ่งบอกว่าจะทำรอบใหม่ */
  const addRound = () => {
    const id = `r${rounds.length + 1}`;
    setRounds((rs) => [...rs, newRound(id)]);
    setOpenRound(id);
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


  /**
   * บันทึกทีละรอบ ไม่ใช่กดทีเดียวตอนจบทั้งใบ
   * รอบห่างกันเป็นชั่วโมง ผู้ตรวจไม่ได้เปิดหน้าจอค้างไว้ทั้งวัน
   * บันทึกแล้วหุบการ์ดให้เลย รอบที่เสร็จแล้วไม่ต้องกินที่ต่อ
   */
  const saveRound = (round: Round, ri: number) => {
    if (!roundDone(items, round, ri)) {
      toast.error(`ครั้งที่ ${ri + 1} ยังกรอกไม่ครบ`, {
        description: "ต้องมีเวลาที่ตรวจ ค่าที่วัด ผลการตรวจ และเหตุผลของข้อที่ไม่ผ่าน",
      });
      return;
    }
    patchRound(round.id, { saved: true });
    setOpenRound(null);
    toast.success(`บันทึกครั้งที่ ${ri + 1} แล้ว`, {
      description: `${round.time}${round.inspector ? ` · ${round.inspector}` : ""}`,
    });
  };

  const allSaved = rounds.every((r) => r.saved);

  // รอบที่กำลังกางอยู่และยังไม่ได้บันทึก คือสิ่งที่ปุ่มบนแถบล่างหมายถึง
  const activeIndex = rounds.findIndex(
    (r) => r.id === openRound && !r.saved
  );
  const activeRound = activeIndex >= 0 ? rounds[activeIndex] : null;

  /** ปิดใบตรวจได้ต่อเมื่อบันทึกครบทุกรอบแล้ว ไม่ใช่แค่กรอกครบ */
  const closeSheet = () => {
    const bad = rounds.findIndex((r) => !r.saved);
    if (bad >= 0) {
      toast.error(`ยังไม่ได้บันทึกครั้งที่ ${bad + 1}`, {
        description: "บันทึกให้ครบทุกครั้งก่อนปิดใบตรวจ",
      });
      setOpenRound(rounds[bad].id);
      return;
    }
    toast.success(`ปิดใบตรวจ ${INSPECT_TEMPLATE.formCode} แล้ว`, {
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

      {/* ---------- การ์ดต่อรอบ + สรุปทั้งใบ ---------- */}
      <div className="mt-6 space-y-3">
        {rounds.map((round, ri) => (
          <RoundCard
            key={round.id}
            items={items}
            round={round}
            index={ri}
            firstRound={rounds[0]}
            open={openRound === round.id}
            onOpenChange={(v) => setOpenRound(v ? round.id : null)}
            onPatchRound={(p) => patchRound(round.id, p)}
            onPatchAnswer={(itemId, p) => patchAnswer(round.id, itemId, p)}
            summaryOf={(item) => summaryText(item, rounds)}
          />
        ))}

        {canAddRound(items, rounds.length) && (
          <Button variant="outline-primary" className="w-full" onClick={addRound}>
            <PlusIcon />
            เพิ่มครั้งที่ {rounds.length + 1}
          </Button>
        )}

        {/* สรุปทั้งใบเป็นการ์ดหุบได้เหมือนกัน หุบไว้ตั้งแต่แรกเพราะเป็นของที่ดูตอนจบ
            ไม่ใช่ของที่ใช้ระหว่างกรอก */}
        <Collapsible
          open={openAll}
          onOpenChange={setOpenAll}
          className="overflow-hidden rounded-xl border border-border bg-card"
        >
          <CollapsibleTrigger className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-accent-hover">
            <div className="min-w-0 flex-1">
              <span className="font-semibold">สรุปทั้งใบ</span>
              <span className="ml-3 text-sm text-muted-foreground">
                ข้อเป็นแถว ครั้งเป็นคอลัมน์ เทียบข้ามรอบได้
              </span>
            </div>
            <ChevronDownIcon
              className={cn(
                "size-4 shrink-0 text-muted-foreground transition-transform",
                openAll && "rotate-180"
              )}
            />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SheetView items={items} rounds={rounds} />
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* ---------- แถบบันทึก ---------- */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-8 py-3">
          <span className="text-sm text-muted-foreground">
            บันทึกแล้ว {rounds.filter((r) => r.saved).length}/{rounds.length} ครั้ง
            · {items.length} ข้อตรวจ
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => router.back()}>
              ย้อนกลับ
            </Button>
            {/* ปุ่มหลักมีอันเดียวเสมอ และเปลี่ยนความหมายตามรอบที่กำลังกางอยู่
                กำลังกรอกรอบไหนอยู่ก็บันทึกรอบนั้น กรอกครบทุกรอบแล้วค่อยปิดทั้งใบ
                มีปุ่มบันทึกทั้งในการ์ดและที่แถบล่างพร้อมกัน คนใช้จะไม่รู้ว่าสองอันต่างกันยังไง */}
            {activeRound ? (
              <Button onClick={() => saveRound(activeRound, activeIndex)}>
                บันทึกครั้งที่ {activeIndex + 1}
              </Button>
            ) : (
              <Button disabled={!allSaved} onClick={closeSheet}>
                ปิดใบตรวจ
              </Button>
            )}
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

/**
 * หนึ่งรอบ = หนึ่งการ์ดที่หุบ/กางได้
 *
 * หัวการ์ดซ้ายบอกว่าครั้งที่เท่าไหร่ เวลา และใครตรวจ ขวาบอกผลของรอบนั้น
 * หุบอยู่ก็ยังตอบได้ว่ารอบไหนเสร็จแล้วผลเป็นยังไง ไม่ต้องกางทุกใบมาไล่หา
 * ปุ่มหุบอยู่ขวาสุด ห่างจากชื่อรอบซึ่งเป็นสิ่งที่ตากวาดหาก่อน
 *
 * บันทึกแล้วล็อกทั้งการ์ด กดแก้ไขเพื่อปลดล็อกได้ถ้าคีย์ผิด
 * เหมือนคอลัมน์ในกระดาษที่เขียนเสร็จแล้วไม่กลับไปเขียนทับโดยไม่ตั้งใจ
 */
function RoundCard({
  items,
  round,
  index,
  firstRound,
  open,
  onOpenChange,
  onPatchRound,
  onPatchAnswer,
  summaryOf,
}: {
  items: QcItem[];
  round: Round;
  index: number;
  /** รอบแรก — ใช้ดึงคำตอบของข้อที่ตรวจครั้งเดียวมาโชว์ในรอบหลัง ๆ */
  firstRound: Round;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onPatchRound: (p: Partial<Round>) => void;
  onPatchAnswer: (itemId: string, p: Partial<Answer>) => void;
  summaryOf: (item: QcItem) => { label: string; value: string }[];
}) {
  const mine = items.filter((i) => editableIn(i, index));
  let done = 0;
  let fail = 0;
  for (const i of mine) {
    const v = verdictOf(i, answerOf(round, i.id));
    if (v === null) continue;
    done += 1;
    if (!v) fail += 1;
  }

  return (
    <Collapsible
      open={open}
      onOpenChange={onOpenChange}
      className="overflow-hidden rounded-xl border border-border bg-card"
    >
      <CollapsibleTrigger className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-accent-hover">
        <div className="min-w-0 flex-1">
          <span className="font-semibold">ตรวจครั้งที่ {index + 1}</span>
          <span className="ml-3 text-sm text-muted-foreground tabular-nums">
            {round.time || "ยังไม่ระบุเวลา"}
            {round.inspector && ` · ${round.inspector}`}
          </span>
        </div>

        {round.saved && (
          <Badge tone="neutral" appearance="soft">
            <LockIcon />
            บันทึกแล้ว
          </Badge>
        )}
        <RoundBadge total={mine.length} done={done} fail={fail} />

        {/* ปุ่มหุบอยู่ขวาสุด */}
        <ChevronDownIcon
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180"
          )}
        />
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="space-y-4 border-t border-border p-4">
          <RoundHead
            index={index}
            round={round}
            locked={round.saved}
            onPatch={onPatchRound}
          />

          {items
            .filter((i) => editableIn(i, index))
            .map((item) => (
              <ItemRow
                key={item.id}
                item={item}
                index={items.indexOf(item)}
                answer={answerOf(round, item.id)}
                summary={summaryOf(item)}
                locked={round.saved}
                onPatch={(p) => onPatchAnswer(item.id, p)}
              />
            ))}

          {/* ข้อที่ตรวจครั้งเดียวไม่หายไปเฉย ๆ ในรอบหลัง ๆ
              ยังอยู่ในหน้าแต่จางและกดไม่ได้ พร้อมคำตอบที่บันทึกไว้รอบแรก */}
          {index > 0 && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                ตรวจครั้งเดียว — บันทึกไว้แล้วเมื่อ {firstRound.time || "—"}
              </p>
              {items
                .filter((i) => !editableIn(i, index))
                .map((item) => (
                  <DoneRow
                    key={item.id}
                    item={item}
                    index={items.indexOf(item)}
                    answer={answerOf(firstRound, item.id)}
                  />
                ))}
            </div>
          )}

          {/* ปุ่มบันทึกไม่ได้อยู่ตรงนี้ อยู่ที่แถบล่างของหน้าซึ่งเห็นตลอดเวลา
              การ์ดของรอบสูงกว่าหนึ่งจอ ปุ่มท้ายการ์ดต้องเลื่อนลงไปหาทุกครั้ง
              เหลือแค่ปุ่มแก้ไข ซึ่งเป็นของเฉพาะการ์ดใบนี้และนาน ๆ ใช้ที */}
          {round.saved && (
            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={() => onPatchRound({ saved: false })}
              >
                <PencilIcon />
                แก้ไขครั้งที่ {index + 1}
              </Button>
            </div>
          )}
        </div>
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

/** เวลากับผู้ตรวจของรอบนี้ — ค่าเดียวใช้ทั้งรอบ ไม่ใช่ถามซ้ำทุกข้อ */
function RoundHead({
  round,
  locked,
  onPatch,
}: {
  index: number;
  round: Round;
  /** บันทึกรอบนี้ไปแล้ว แก้ไม่ได้จนกว่าจะกดแก้ไข */
  locked: boolean;
  onPatch: (p: Partial<Round>) => void;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="grid gap-4 @2xl:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor={`${round.id}-time`}>เวลาตรวจสอบ</Label>
          <TimeField
            id={`${round.id}-time`}
            value={round.time}
            onValueChange={(time) => onPatch({ time })}
            disabled={locked}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${round.id}-date`}>วันที่ตรวจ</Label>
          <Input
            id={`${round.id}-date`}
            type="date"
            disabled={locked}
            className="bg-card tabular-nums"
            value={round.date}
            onChange={(e) => onPatch({ date: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${round.id}-by`}>ผู้ตรวจ</Label>
          <Select
            value={round.inspector}
            disabled={locked}
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
  summary,
  locked,
  onPatch,
}: {
  item: QcItem;
  index: number;
  answer: Answer;
  /** ตัวเลขรวมของทุกครั้ง เช่นน้ำหนักรวม หรือค่าเฉลี่ยความแข็ง */
  summary: { label: string; value: string }[];
  /** บันทึกรอบนี้ไปแล้ว แก้ไม่ได้จนกว่าจะกดแก้ไข */
  locked: boolean;
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
        {/* ตัวเลขรวมของทุกครั้งอยู่ข้างผลตรวจ คนอ่านจะได้ไม่ต้องบวกเอง */}
        <div className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-1">
          {summary.map((s) => (
            <span key={s.label} className="text-sm text-muted-foreground">
              {s.label}:{" "}
              <span className="font-semibold text-foreground tabular-nums">
                {s.value}
              </span>
            </span>
          ))}
          <Verdict value={verdict} words={[pass, fail]} />
        </div>
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
                  disabled={locked}
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
            <Label className="text-sm font-normal">ผลการตรวจสอบ</Label>
            <RadioGroup
              disabled={locked}
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
              disabled={locked}
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
    // ระยะในเซลล์กับกรอบใช้ชุดเดียวกับตารางอื่นในระบบ ไม่ได้ตั้งเองซ้ำอีกที
    <TableFrame>
      <Table>
        <TableHeader className={cn(STICKY_HEAD, "[&_th]:leading-snug")}>
          <TableRow>
            <TableHead className={cn(HEAD_FIRST, "min-w-56")}>
              รายการตรวจ
            </TableHead>
            <TableHead className="min-w-60">เกณฑ์มาตรฐาน</TableHead>
            {rounds.map((r, i) => (
              <TableHead key={r.id} className="min-w-32 text-center">
                ครั้งที่ {i + 1}
                <span className="block font-normal text-muted-foreground tabular-nums">
                  {r.time || "—"}
                </span>
              </TableHead>
            ))}
            <TableHead className="min-w-28 text-center">สรุป</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item, i) => {
            const [pass, fail] = VERDICT_WORDS[item.verdictWording];
            return (
              <TableRow key={item.id}>
                <TableCell className={COL_FIRST}>
                  <span className="text-muted-foreground tabular-nums">
                    {i + 1}.
                  </span>{" "}
                  <span className="font-medium">{item.title}</span>
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

                <TableCell className="text-center">
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
    </TableFrame>
  );
}
