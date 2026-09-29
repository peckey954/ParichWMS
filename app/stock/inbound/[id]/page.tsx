"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ChevronDownIcon, PlusIcon } from "lucide-react";
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
import { ZoneAssignDialog } from "@/components/stock/zone-assign";
import {
  getInboundReceipt,
  livePieces,
  outstandingQty,
  pieceStatus,
  receivedCount,
  receivedTons,
  rejectedTons,
  setPieceZones,
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
   ปุ่ม "ระบุโซน" คือทางเข้าของงานนั้น
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

  // ไม่มีหลังบ้านจริง โซนที่เพิ่งระบุจึงเก็บไว้ในหน้านี้ก่อน
  const [pieces, setPieces] = React.useState<InboundPiece[]>(receipt.pieces);
  const [tab, setTab] = React.useState<TabId>("live");
  const [zoneOpen, setZoneOpen] = React.useState(false);

  const live = livePieces(pieces);
  const cancelled = pieces.filter((p) => p.cancelled);
  const shown = tab === "live" ? live : cancelled;
  const waiting = waitingZoneCount(pieces);

  const assignZone = (ids: string[], zone: string) => {
    const set = new Set(ids);
    setPieces((prev) => prev.map((p) => (set.has(p.id) ? { ...p, zone } : p)));
    // เขียนลงที่เดียวกับที่หน้าเลือกโซนของจอแคบเขียน ไม่งั้นสองทางนี้จะจำคนละอย่าง
    setPieceZones(ids, zone);
    toast.success(`เลือกโซน ${zone} แล้ว`, {
      description: `${ids.length} ชิ้น`,
    });
  };

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
          <div className="flex flex-wrap items-center gap-2">
            {/* ตัวเลขบนปุ่มคือจำนวนชิ้นที่ยังรอโซน คนที่เข้ามาทำงานนี้โดยเฉพาะ
                ต้องรู้ตั้งแต่เปิดหน้าว่ามีงานค้างอยู่กี่ชิ้น ไม่ต้องไล่อ่านทั้งตาราง

                จอแคบพาไปหน้าเลือกโซนเต็มหน้า จอกว้างเปิดเป็นกล่องบนหน้านี้เลย
                งานเดียวกัน แต่บนมือถือต้องเห็นรายการเต็มจอ ไม่ใช่มองผ่านช่องกล่อง
                ที่เหลือความสูงให้รายการไม่ถึงครึ่งจอ */}
            {live.length === 0 ? (
              <Button variant="outline-primary" disabled>
                เลือกโซนรับเข้า
              </Button>
            ) : (
              <>
                <Button
                  asChild
                  variant="outline-primary"
                  className="@2xl:hidden"
                >
                  <Link href={`/stock/inbound/${doc.id}/zone`}>
                    เลือกโซนรับเข้า{waiting > 0 ? ` (${waiting})` : ""}
                  </Link>
                </Button>
                <Button
                  variant="outline-primary"
                  className="hidden @2xl:inline-flex"
                  onClick={() => setZoneOpen(true)}
                >
                  เลือกโซนรับเข้า{waiting > 0 ? ` (${waiting})` : ""}
                </Button>
              </>
            )}
            <Button asChild>
              <Link href={`/stock/inbound/${doc.id}/add`}>
                <PlusIcon />
                เพิ่มการรับเข้าสินค้า
              </Link>
            </Button>
          </div>
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
                กดเพิ่มการรับเข้าสินค้าเมื่อรถมาถึง
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
        <div className="mx-auto flex w-full max-w-6xl items-center px-8 py-3">
          <Button variant="outline-primary" onClick={() => router.back()}>
            ย้อนกลับ
          </Button>
        </div>
      </div>

      {/* เมานต์เฉพาะตอนเปิด สถานะที่เลือก/สแกนไว้จึงเริ่มใหม่ทุกครั้ง
          ไม่ใช่ค้างของรอบก่อนไว้ให้คนถัดไปกดทับโดยไม่รู้ตัว */}
      {zoneOpen && (
        <ZoneAssignDialog
          open
          onOpenChange={setZoneOpen}
          pieces={live}
          onAssign={assignZone}
        />
      )}
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
