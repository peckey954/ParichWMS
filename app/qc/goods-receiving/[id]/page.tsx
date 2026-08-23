"use client";

import * as React from "react";
import { notFound, useRouter } from "next/navigation";
import { ChevronUpIcon, PlusIcon } from "lucide-react";
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
import { Empty, EmptyDescription, EmptyTitle } from "@peckey954/ui/components/ui/empty";
import { Label } from "@peckey954/ui/components/ui/label";
import { Textarea } from "@peckey954/ui/components/ui/textarea";
import { cn } from "@peckey954/ui/lib/utils";
import { toast } from "sonner";
import { RoundCard } from "@/components/qc/round-card";
import {
  answerOf,
  canAddRound,
  newRound,
  noteMissing,
  type Answer,
  type Round,
} from "@/lib/qc-inspect";
import {
  DISPOSITIONS,
  RECEIVING_TEMPLATE,
  findDoc,
  roundDigest,
  tonnage,
  type Disposition,
} from "@/lib/qc-receiving";

/* ------------------------------------------------------------------
   ใบตรวจสอบรับสินค้าหนึ่งใบ

   แต่ละครั้งที่ตรวจเป็นการ์ดหุบ/กางได้ในหน้า ไม่ใช่กล่องเด้งกลางจอ
   กล่องกลางจอบังทั้งหน้าและสร้างพื้นที่เลื่อนซ้อนกันสองชั้น
   การ์ดในหน้าเห็นทุกรอบพร้อมกัน หัวการ์ดบอกผลของแต่ละรอบตั้งแต่ยังไม่กาง

   หน้านี้ตอบสามคำถาม ตรวจไปกี่ครั้ง ผลรวมเป็นยังไง แล้วจะทำยังไงกับของ
   ข้อที่ไม่ผ่านเป็นตัวตัดสินว่าจะ repack รับสภาพ หรือส่งคืน ซึ่งเลือกอยู่ท้ายหน้านี้
------------------------------------------------------------------ */

const fmtTon = (v: number) =>
  v.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function QcReceivingDocPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = React.use(params);
  const doc = findDoc(id);
  if (!doc) notFound();

  return <ReceivingSheet key={doc.id} doc={doc} />;
}

function ReceivingSheet({ doc }: { doc: NonNullable<ReturnType<typeof findDoc>> }) {
  const router = useRouter();
  const items = RECEIVING_TEMPLATE.items;

  const [rounds, setRounds] = React.useState<Round[]>([]);
  // กางทีละใบ กางหลายใบพร้อมกันแล้วหน้ายาวเป็นพันพิกเซลโดยไม่ได้ช่วยอะไร
  const [openRound, setOpenRound] = React.useState<string | null>(null);
  const [disposition, setDisposition] = React.useState<Disposition | null>(null);
  const [note, setNote] = React.useState("");
  const [openInfo, setOpenInfo] = React.useState(true);

  const digests = rounds.map((r, i) => roundDigest(items, r, i));
  const hasFail = digests.some((d) => d.pass === false);
  // ยังไม่มีใครตรวจอะไรเลย ก็ยังบอกไม่ได้ว่าของจะเข้าคลังเท่าไหร่
  const started = digests.some((d) => d.done > 0);
  const ton = started
    ? tonnage(doc.ton, hasFail, disposition)
    : { fail: null as number | null, warehouse: null as number | null };

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

  /** เพิ่มครั้งแล้วกางใบใหม่ให้เลย ไม่ต้องกดอีกทีเพื่อเริ่มกรอก */
  const addRound = () => {
    const id = `r${rounds.length + 1}`;
    setRounds((rs) => [...rs, newRound(id)]);
    setOpenRound(id);
  };

  const saveDraft = () => {
    toast.success(`บันทึกร่าง ${doc.code} แล้ว`, {
      description: `ตรวจไปแล้ว ${rounds.length} ครั้ง`,
    });
  };

  const save = () => {
    if (rounds.length === 0) {
      toast.error("ยังไม่มีครั้งที่ตรวจ", { description: "กดเพิ่มครั้งที่ตรวจก่อน" });
      return;
    }
    const missing = rounds.flatMap((r, ri) =>
      items
        .filter((i) => ri === 0 || i.repeatable)
        .filter((i) => noteMissing(i, answerOf(r, i.id)))
        .map((i) => ({ ri, title: i.title }))
    );
    if (missing.length > 0) {
      toast.error("ยังระบุเหตุผลไม่ครบ", {
        description: `ครั้งที่ ${missing[0].ri + 1} ข้อ "${missing[0].title}" ไม่ผ่าน ต้องระบุหมายเหตุ`,
      });
      setOpenRound(rounds[missing[0].ri].id);
      return;
    }
    if (hasFail && disposition === null) {
      toast.error("ยังไม่ได้เลือกประเภทการรับสินค้า", {
        description: "มีข้อที่ไม่ผ่าน ต้องระบุว่าจะทำยังไงกับของ",
      });
      return;
    }
    toast.success(`บันทึกใบตรวจสอบ ${doc.code} แล้ว`, {
      description:
        ton.warehouse === null
          ? undefined
          : `เข้าคลัง ${fmtTon(ton.warehouse)} ตัน`,
    });
    router.back();
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
            <BreadcrumbLink href="/qc/goods-receiving">ตรวจรับสินค้า</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="text-primary">ใบตรวจสอบ</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <h1 className="mt-2 text-2xl font-semibold tracking-tight">
        ใบตรวจสอบรับสินค้า {doc.code}-01
      </h1>

      {/* ---------- ของอะไร ยอดเท่าไหร่ ใครรับ ---------- */}
      <Collapsible
        open={openInfo}
        onOpenChange={setOpenInfo}
        className="mt-4 rounded-xl border border-border bg-card"
      >
        <CollapsibleTrigger className="flex w-full flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-4 pt-4 text-left">
          <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="font-semibold">{doc.product} ฟูเจียนผง</span>
            <span className="text-sm text-muted-foreground">วัตถุดิบ</span>
            <span className="text-border" aria-hidden>
              |
            </span>
            <span className="text-sm text-muted-foreground">{doc.packing}</span>
            <span className="text-border" aria-hidden>
              |
            </span>
            <span className="text-sm text-muted-foreground">{doc.bagSize}</span>
            <Badge tone="brand" appearance="soft">
              {doc.lot}
            </Badge>
          </p>
          <span className="flex items-center gap-3 text-sm">
            {doc.supplier}
            <ChevronUpIcon
              className={cn(
                "size-4 shrink-0 text-muted-foreground transition-transform",
                !openInfo && "rotate-180"
              )}
            />
          </span>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="p-4">
            {/* สี่ตัวเลขนี้คือผลของทั้งใบ ยอดเข้าคลังเปลี่ยนตามที่เลือกท้ายหน้า */}
            <div className="grid gap-4 rounded-lg bg-brand p-4 @2xl:grid-cols-4">
              <Stat label="ตรวจสอบ (ตัน)" value={fmtTon(doc.ton)} />
              <Stat
                label="ไม่ผ่าน (ตัน)"
                value={ton.fail === null ? "-" : fmtTon(ton.fail)}
                note={
                  ton.fail !== null && disposition
                    ? DISPOSITIONS.find((d) => d.id === disposition)?.label
                    : undefined
                }
                danger={ton.fail !== null}
              />
              {/* เฉลี่ยต่อครั้งที่ตรวจ ไม่มีของเข้าคลังก็ไม่มีอะไรให้เฉลี่ย */}
              <Stat
                label="เข้าคลังเฉลี่ย (ตัน)"
                value={
                  !ton.warehouse || rounds.length === 0
                    ? "-"
                    : fmtTon(ton.warehouse / rounds.length)
                }
              />
              <Stat
                label="เข้าคลัง (ตัน)"
                value={ton.warehouse === null ? "-" : fmtTon(ton.warehouse)}
              />
            </div>

            <div className="mt-4 grid gap-4 @2xl:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">ผู้รับสินค้า</p>
                <p className="mt-0.5 font-semibold">{doc.receiver}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  ผู้แก้ไขรับสินค้าล่าสุด
                </p>
                <p className="mt-0.5 font-semibold">{doc.editor || "-"}</p>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* ---------- ครั้งที่ตรวจ ---------- */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">การตรวจสอบ</h2>
        <Button
          onClick={addRound}
          disabled={!canAddRound(items, rounds.length)}
        >
          <PlusIcon />
          เพิ่มครั้งที่ตรวจ
        </Button>
      </div>

      <div className="mt-4 space-y-3">
        {rounds.length === 0 ? (
          <div className="rounded-xl border border-border bg-card">
            <Empty className="py-16">
              <EmptyTitle>ไม่มีข้อมูล</EmptyTitle>
              <EmptyDescription>กรุณาเพิ่มครั้งที่ตรวจ</EmptyDescription>
            </Empty>
          </div>
        ) : (
          rounds.map((round, i) => (
            <RoundCard
              key={round.id}
              items={items}
              round={round}
              index={i}
              firstRound={rounds[0]}
              open={openRound === round.id}
              onOpenChange={(v) => setOpenRound(v ? round.id : null)}
              onPatchAnswer={(itemId, p) => patchAnswer(round.id, itemId, p)}
            />
          ))
        )}
      </div>

      {/* ---------- ไม่ผ่านแล้วทำยังไงกับของ ----------
           ขึ้นเฉพาะตอนมีข้อที่ไม่ผ่านจริง ผ่านหมดแล้วไม่มีอะไรให้ตัดสิน
           การเลือกตรงนี้เปลี่ยนยอดเข้าคลังในกล่องข้างบนทันที */}
      {hasFail && (
        <div className="mt-6">
          <Label>ประเภทการรับสินค้า กรณีไม่ผ่านข้อใดข้อหนึ่ง</Label>
          <div className="mt-2 grid gap-3 @2xl:grid-cols-3">
            {DISPOSITIONS.map((d) => (
              <button
                key={d.id}
                type="button"
                role="radio"
                aria-checked={disposition === d.id}
                onClick={() => setDisposition(d.id)}
                className={cn(
                  "flex min-h-11 items-center gap-3 rounded-lg border px-4 text-sm transition-colors",
                  disposition === d.id
                    ? "border-primary bg-brand font-medium text-primary"
                    : "border-border bg-card hover:bg-accent-hover"
                )}
              >
                <span
                  className={cn(
                    "flex size-4 shrink-0 items-center justify-center rounded-full border",
                    disposition === d.id ? "border-current" : "border-border"
                  )}
                >
                  {disposition === d.id && (
                    <span className="size-2 rounded-full bg-current" />
                  )}
                </span>
                {d.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6">
        <Label htmlFor="doc-note">
          หมายเหตุ{" "}
          <span className="font-normal text-muted-foreground">(ไม่บังคับ)</span>
        </Label>
        <Textarea
          id="doc-note"
          className="mt-2 bg-card"
          placeholder="ระบุหมายเหตุ"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>

      {/* ---------- แถบบันทึก ---------- */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Button variant="outline" onClick={() => router.back()}>
            ย้อนกลับ
          </Button>
          {/* ร่างเก็บของที่กรอกค้างไว้โดยไม่ตรวจความครบ ใบตรวจกินเวลาข้ามกะได้
              บันทึกคือปิดงาน ต้องกรอกครบและเลือกวิธีจัดการของที่ไม่ผ่านแล้ว */}
          <div className="flex items-center gap-2">
            <Button variant="outline-primary" onClick={saveDraft}>
              บันทึกร่าง
            </Button>
            <Button className="w-28" onClick={save}>
              บันทึก
            </Button>
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
  note,
  danger,
}: {
  label: string;
  value: string;
  note?: string;
  danger?: boolean;
}) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-lg font-semibold tabular-nums">
        <span className={cn(danger && "text-danger-strong")}>{value}</span>
        {note && (
          <span className="ml-2 text-sm font-normal text-danger-strong">
            ({note})
          </span>
        )}
      </p>
    </div>
  );
}
