"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ChevronDownIcon } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@peckey954/ui/components/ui/alert-dialog";
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
import { ChipGroup } from "@/components/chip-group";
import {
  CardBox,
  CardHead,
  CardRow,
  COL_FIRST,
  COL_LAST,
  HEAD_FIRST,
  HEAD_LAST,
  STICKY_HEAD,
  TableFrame,
} from "@/components/stock/doc-parts";
import {
  closeInbound,
  getInboundReceipt,
  requestInboundTab,
  livePieces,
  outstandingQty,
  pieceStatus,
  receivedCount,
  receivedTons,
  rejectedTons,
  stockedTons,
  waitingZoneCount,
  formatQty,
  PIECE_STATUS_LABEL,
  type InboundPiece,
  type InboundReceipt,
  type PieceStatus,
} from "@/lib/general-stock";

/* ------------------------------------------------------------------
   ใบรับเข้าสต็อกทั่วไป — หนึ่งใบ = ของที่มากับรถทะเบียนเดียว หนึ่งเที่ยว

   ทะเบียนรถกับวันที่รถเข้าอยู่บนการ์ดข้างบน ไม่ใช่คอลัมน์ในตาราง
   เพราะทุกแถวในใบนี้มาจากรถคันเดียวกันหมด เขียนซ้ำทุกแถวคือตอบคำถามเดิม
   สิบกว่าครั้งแล้วยังกินความกว้างที่ควรเป็นของข้อมูลที่ต่างกันจริง

   ตารางข้างล่างคือ "หนึ่งแถว = หนึ่งชิ้นที่รับเข้า" แต่ละชิ้นมีเลขที่รับสินค้า
   ของตัวเองที่พิมพ์ติดไปกับของจริง

   โซนไม่ได้กรอกตอนรับของ — คนละคนคนละเวลา คนรับของยืนอยู่หน้าโกดัง
   ส่วนคนเก็บของเข้าโซนมาทีหลัง ชิ้นที่ยังไม่มีโซนจึงเป็นสถานะปกติที่รอได้
   ปุ่ม "เลือกโซนรับเข้า" คือทางเข้าของงานนั้น และเป็นปุ่มเดียวของหน้านี้
   (Flow เพิ่มโซน ใน Figma)

   บันทึกที่แถบล่าง — เลือกโซนครบทุกชิ้น = รับเข้าเสร็จ ใบออกจากแท็บรอรับเข้า
   ยังไม่ครบ = เตือนก่อน บันทึกได้ แต่ใบยังค้างอยู่ที่รอรับเข้า
------------------------------------------------------------------ */

const STATUS_CHIP: Record<PieceStatus, string> = {
  // รอระบุโซน = งานที่ยังไม่จบ ใช้เหลืองชุดเดียวกับสถานะรออื่น ๆ ทั้งแอป
  waitingZone:
    "[--bdg-surface:var(--chip-yellow)] [--bdg-text:var(--chip-yellow-foreground)]",
  stocked:
    "[--bdg-surface:var(--chip-green)] [--bdg-text:var(--chip-green-foreground)]",
  cancelled:
    "[--bdg-surface:var(--chip-red)] [--bdg-text:var(--chip-red-foreground)]",
};

function StatusChip({ status }: { status: PieceStatus }) {
  return (
    <Badge
      appearance="soft"
      className={cn(
        "[--bdg-border:transparent] font-semibold whitespace-nowrap",
        STATUS_CHIP[status]
      )}
    >
      {PIECE_STATUS_LABEL[status]}
    </Badge>
  );
}

export default function InboundReceiptPage() {
  const params = useParams<{ id: string }>();
  const receipt = React.useMemo(
    () => getInboundReceipt(params.id),
    [params.id]
  );

  if (!receipt) return <NotFound />;
  // key กันสถานะโซนที่แก้ไว้ค้างข้ามใบ ตอนเปลี่ยน id ในแถบที่อยู่
  return <ReceiptSheet key={receipt.doc.id} receipt={receipt} />;
}

type TabId = "live" | "cancelled";

function ReceiptSheet({ receipt }: { receipt: InboundReceipt }) {
  const router = useRouter();
  const { doc, meta } = receipt;

  // โซนที่หน้าเลือกโซนบันทึกไว้ ใบที่สร้างใหม่ตอนเปิดหน้านี้อ่านมาให้แล้ว
  const pieces: InboundPiece[] = receipt.pieces;
  const [tab, setTab] = React.useState<TabId>("live");
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  const live = livePieces(pieces);
  const cancelled = pieces.filter((p) => p.cancelled);
  const shown = tab === "live" ? live : cancelled;
  const waiting = waitingZoneCount(pieces);

  /** บันทึกแล้วกลับไปแท็บรอรับเข้า — ครบทุกชิ้นใบจะหายจากแท็บนั้นไป */
  const finish = () => {
    if (waiting === 0) {
      closeInbound(doc.id);
      toast.success("รับเข้าสินค้าสำเร็จ", {
        description: `ใบสั่งซื้อ: ${doc.code}`,
      });
    } else {
      toast.success("เลือกโซนรับเข้าสำเร็จ", {
        description: `${live.length - waiting} รายการ`,
      });
    }
    requestInboundTab();
    router.push("/stock");
  };

  const save = () => (waiting > 0 ? setConfirmOpen(true) : finish());

  return (
    // เนื้อหาสั้นกว่าจอได้ (ใบที่ยังไม่มีชิ้นที่รับเข้าเลย) — ถ้าไม่กำหนดความสูง
    // ขั้นต่ำ ปุ่มย้อนกลับ (sticky bottom-0) จะลอยอยู่ใต้เนื้อหาแทนติดขอบล่างจอจริง
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col">
      <main className="@container mx-auto w-full max-w-6xl flex-1 px-4 pt-6 pb-6 sm:px-6">
        <Crumbs />

        <h1 className="mt-4 text-2xl font-semibold tracking-tight">
          ใบรับเข้าสต็อกทั่วไป {doc.code}
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">{doc.createdAt}</p>

        <Collapsible defaultOpen className="mt-5 rounded-xl border border-border bg-card">
          <CollapsibleTrigger asChild>
            {/* items-start กันปุ่มหุบไหลตามเนื้อหาที่ห่อบรรทัด — ปักไว้ชิดขวาบนเสมอ */}
            <button
              type="button"
              className="group flex w-full items-start justify-between gap-3 px-4 pt-4 pb-3 text-left"
            >
              <span className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1">
                <span className="font-medium">{doc.productName}</span>
                {doc.productSub && (
                  <span className="text-sm text-muted-foreground">
                    {doc.productSub}
                  </span>
                )}
                {doc.packing && (
                  <>
                    <span className="text-border" aria-hidden>
                      |
                    </span>
                    <span className="text-sm">{doc.packing}</span>
                  </>
                )}
              </span>
              <span className="flex shrink-0 items-center gap-3">
                <span className="hidden text-sm font-medium @2xl:inline">
                  {doc.supplier}
                </span>
                <ChevronDownIcon className="size-5 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
              </span>
            </button>
          </CollapsibleTrigger>

          {/* อยู่นอกส่วนที่หุบ — สี่ยอดนี้คือตัวเลขอ้างอิงที่ต้องเทียบกับตารางตลอดทั้งหน้า */}
          <div className="px-4 pb-4">
            <div className="grid grid-cols-2 gap-4 rounded-lg bg-brand p-4 @xl:grid-cols-4">
              <SummaryStat
                label={`รับเข้า (${doc.orderUnit})`}
                value={formatQty(receivedTons(pieces))}
              />
              {/* ชิ้นเป็นหน่วยที่คนหน้าโกดังนับจริง ตันเป็นหน่วยของใบสั่งซื้อ
                  ต้องเห็นคู่กันเพราะสองฝั่งเถียงกันด้วยคนละหน่วย */}
              <SummaryStat
                label="รับเข้า (ชิ้น)"
                value={String(receivedCount(pieces))}
              />
              <SummaryStat
                label={`ไม่ผ่าน (${doc.orderUnit})`}
                value={
                  rejectedTons(pieces) > 0
                    ? `-${formatQty(rejectedTons(pieces))}`
                    : "-"
                }
                valueClassName={
                  rejectedTons(pieces) > 0 ? "text-danger-strong" : undefined
                }
              />
              <SummaryStat
                label={`เข้าคลัง (${doc.orderUnit})`}
                value={formatQty(stockedTons(pieces))}
              />
            </div>
          </div>

          <CollapsibleContent className="px-4 pb-4">
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm @2xl:grid-cols-4">
              {/* ทะเบียนรถกับวันที่รถเข้าอยู่แถวแรก — เป็นของทั้งใบ และเป็นสิ่งที่
                  คนเปิดใบนี้ถามก่อนเสมอว่า "ของคันไหน เข้าวันไหน" */}
              <MetaField label="ทะเบียนรถ" value={doc.truck} />
              <MetaField label="วันที่รถจะเข้า" value={doc.arriveDate} />
              <MetaField
                label={`รอรับเข้า (${doc.orderUnit})`}
                value={
                  outstandingQty(doc) > 0 ? formatQty(outstandingQty(doc)) : "-"
                }
              />
              <MetaField label="หมายเหตุจากผู้สั่งซื้อ" value={meta.buyerNote ?? "-"} />

              <MetaField label="เลขที่ใบขอซื้อ" value={meta.prCode} />
              <MetaField label="PRQ Unique ID" value={meta.prqId} />
              <MetaField label="ผู้ทำใบขอซื้อ" value={meta.prMaker} />
              <MetaField label="ผู้แก้ไขขอซื้อล่าสุด" value={meta.prEditor ?? "-"} />

              <MetaField label="ผู้ทำใบสั่งซื้อ" value={meta.poMaker} />
              <MetaField label="ผู้แก้ไขสั่งซื้อล่าสุด" value={meta.poEditor ?? "-"} />
              <MetaField label="เหตุผลการซื้อ" value={meta.reason} />
              <MetaField
                label="ช่วงวันที่รถส่งสินค้า"
                value={`${meta.deliveryFrom} - ยังไม่ระบุ`}
              />
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* ---------- รอบการรับเข้าสินค้า ---------- */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">รอบการรับเข้าสินค้า</h2>
          {/* หน้าเลือกโซนเป็นหน้าเต็มทั้งจอคอมและมือถือ — รายการคือของที่ต้อง
              กวาดตาหามากที่สุด ไม่ควรมองผ่านช่องกล่อง */}
          {live.length === 0 ? (
            <Button disabled>เลือกโซนรับเข้า</Button>
          ) : (
            <Button asChild>
              <Link href={`/stock/inbound/${doc.id}/zone`}>เลือกโซนรับเข้า</Link>
            </Button>
          )}
        </div>

        <ChipGroup
          className="mt-4"
          label="กรองรายการรับเข้า"
          value={tab}
          onChange={setTab}
          options={[
            { id: "live", label: `รอบการรับเข้า (${live.length})` },
            { id: "cancelled", label: `ยกเลิก (${cancelled.length})` },
          ]}
        />

        {shown.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-border px-6 py-14 text-center">
            <p className="font-medium">
              {tab === "live" ? "ยังไม่มีการรับเข้าในใบนี้" : "ไม่มีรายการที่ยกเลิก"}
            </p>
            {tab === "live" && (
              <p className="mt-1 text-sm text-muted-foreground">
                ชิ้นที่รับเข้าจะขึ้นที่นี่หลังรถมาถึง
              </p>
            )}
          </div>
        ) : (
          <>
            {/* ---------- จอแคบ: การ์ดต่อชิ้น ---------- */}
            <div className="mt-4 space-y-3 @3xl:hidden">
              {shown.map((p) => (
                <PieceCard key={p.id} piece={p} unit={doc.orderUnit} />
              ))}
            </div>

            {/* ---------- จอกว้าง: ตาราง ---------- */}
            <div className="mt-4 hidden @3xl:block">
              <TableFrame>
                <Table>
                  <TableHeader className={STICKY_HEAD}>
                    <TableRow>
                      <TableHead className={cn(HEAD_FIRST, "min-w-52")}>
                        เลขที่รับสินค้า
                      </TableHead>
                      <TableHead className="min-w-40">
                        เบอร์ตู้คอนเทนเนอร์
                      </TableHead>
                      <TableHead className="min-w-24">โซน</TableHead>
                      <TableHead className="min-w-28">บรรจุภัณฑ์</TableHead>
                      <TableHead className="min-w-36 text-right">
                        ปริมาณรับเข้าต่อชิ้น ({doc.orderUnit})
                      </TableHead>
                      <TableHead className="min-w-36">
                        ความถูกต้องของสินค้า
                      </TableHead>
                      <TableHead className="min-w-40">หมายเหตุไม่ถูกต้อง</TableHead>
                      <TableHead className="min-w-36">หมายเหตุ</TableHead>
                      <TableHead className={cn(HEAD_LAST, "min-w-40")}>
                        สถานะ
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {shown.map((p) => (
                      <PieceRow key={p.id} piece={p} />
                    ))}
                  </TableBody>
                </Table>
              </TableFrame>
            </div>
          </>
        )}
      </main>

      {/* ---------- แถบปุ่มล่าง ---------- */}
      <div className="sticky bottom-0 z-30 border-t border-border bg-surface">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-8 py-3 max-sm:px-4">
          <Button variant="outline-primary" onClick={() => router.back()}>
            ย้อนกลับ
          </Button>
          <Button disabled={live.length === 0} onClick={save}>
            บันทึก
          </Button>
        </div>
      </div>

      {/* บันทึกทั้งที่ยังมีชิ้นไม่มีโซน — ทำได้ แต่ต้องรู้ก่อนว่าใบยังค้างที่รอรับเข้า */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent size="sm" className="data-[size=sm]:max-w-[22rem]">
          <AlertDialogHeader>
            <AlertDialogTitle>พบสินค้าที่ยังไม่ได้เลือกโซน</AlertDialogTitle>
            <AlertDialogDescription>
              สินค้าบางรายการยังไม่ได้เลือกโซน
              หากบันทึกรายการจะยังคงอยู่ในสถานะรอรับเข้า
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel variant="outline-primary">ย้อนกลับ</AlertDialogCancel>
            <AlertDialogAction onClick={finish}>บันทึก</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function NotFound() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 pt-6 pb-24 sm:px-6">
      <Crumbs />
      <div className="mt-10 rounded-xl border border-dashed border-border px-6 py-14 text-center">
        <p className="font-medium">ไม่พบใบรับเข้านี้</p>
        <p className="mt-1 text-sm text-muted-foreground">
          เอกสารอาจถูกลบหรือลิงก์ไม่ถูกต้อง
        </p>
        <Button asChild variant="outline-primary" className="mt-4">
          <Link href="/stock">กลับไปหน้าสต็อกทั่วไป</Link>
        </Button>
      </div>
    </main>
  );
}

function Crumbs() {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/">ระบบ</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink href="/stock">สต็อกทั่วไป</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage className="text-primary">
            ใบรับเข้าสต็อกทั่วไป
          </BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

function SummaryStat({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1">
        <span className={cn("text-lg font-semibold tabular-nums", valueClassName)}>
          {value}
        </span>
      </p>
    </div>
  );
}

function MetaField({ label, value }: { label: string; value: string }) {
  return (
    <p>
      {/* ไม่มี ":" ท้ายป้ายกำกับ — ป้ายกับค่าคนละบรรทัดกัน ไม่ใช่บรรทัดเดียวกัน */}
      <span className="block text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </p>
  );
}

/** ถูกต้อง/ไม่ถูกต้อง — ตัวที่ผิดเป็นสีแดง กวาดตาหาแถวที่มีปัญหาได้จากคอลัมน์เดียว */
function Correctness({ correct }: { correct: boolean }) {
  return correct ? (
    <span className="whitespace-nowrap">ถูกต้อง</span>
  ) : (
    <span className="font-medium whitespace-nowrap text-danger-strong">
      ไม่ถูกต้อง
    </span>
  );
}

function PieceRow({ piece: p }: { piece: InboundPiece }) {
  return (
    <TableRow>
      <TableCell className={COL_FIRST}>
        <span className="block font-medium whitespace-nowrap">
          {p.receiptCode}
        </span>
        <span className="block text-sm whitespace-nowrap text-muted-foreground tabular-nums">
          {p.createdAt}
        </span>
      </TableCell>
      <TableCell className="whitespace-nowrap">{p.containerNo ?? "-"}</TableCell>
      <TableCell>
        {p.zone ? (
          <Badge appearance="soft" className="whitespace-nowrap">
            {p.zone}
          </Badge>
        ) : (
          "-"
        )}
      </TableCell>
      <TableCell className="whitespace-nowrap">{p.packing}</TableCell>
      <TableCell className="text-right whitespace-nowrap tabular-nums">
        {formatQty(p.qty)}
      </TableCell>
      <TableCell>
        <Correctness correct={p.correct} />
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {p.wrongNote ?? "-"}
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {p.note ?? "-"}
      </TableCell>
      <TableCell className={COL_LAST}>
        <StatusChip status={pieceStatus(p)} />
      </TableCell>
    </TableRow>
  );
}

function PieceCard({ piece: p, unit }: { piece: InboundPiece; unit: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <CardHead code={p.receiptCode} at={p.createdAt} />

      <CardBox className="mt-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <span className="text-sm">
          โซน:{" "}
          <span className="font-semibold">
            {p.zone ?? "ยังไม่ระบุ"}
          </span>
        </span>
        <StatusChip status={pieceStatus(p)} />
      </CardBox>

      <dl className="mt-3 space-y-1.5 text-sm">
        <CardRow label="เบอร์ตู้คอนเทนเนอร์">{p.containerNo ?? "-"}</CardRow>
        <CardRow label="บรรจุภัณฑ์">{p.packing}</CardRow>
        <CardRow label={`ปริมาณรับเข้าต่อชิ้น (${unit})`}>
          {formatQty(p.qty)}
        </CardRow>
        <CardRow label="ความถูกต้องของสินค้า" className="font-normal">
          <Correctness correct={p.correct} />
        </CardRow>
        {p.wrongNote && (
          <CardRow label="หมายเหตุไม่ถูกต้อง" className="font-normal">
            {p.wrongNote}
          </CardRow>
        )}
        {p.note && (
          <CardRow label="หมายเหตุ" className="font-normal">
            {p.note}
          </CardRow>
        )}
      </dl>
    </div>
  );
}
