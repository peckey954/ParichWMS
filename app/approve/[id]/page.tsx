"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ChevronDownIcon } from "lucide-react";
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
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@peckey954/ui/components/ui/dialog";
import { Label } from "@peckey954/ui/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@peckey954/ui/components/ui/table";
import { Textarea } from "@peckey954/ui/components/ui/textarea";
import { cn } from "@peckey954/ui/lib/utils";
import { toast } from "sonner";
import {
  CardRow,
  COL_FIRST,
  COL_LAST,
  EmptyDocs,
  HEAD_FIRST,
  HEAD_LAST,
  ROW_HOVER_NAV,
  STICKY_HEAD,
  TableFrame,
} from "@/components/stock/doc-parts";
import {
  APPROVAL_OUTCOME_LABEL,
  formatPoBaht,
  formatPoQty,
  getApprovalDoc,
  lineItemTotalPrice,
  lineItemUnitPrice,
  poTotalPrice,
  type ApprovalOutcome,
  type PoDoc,
} from "@/lib/po";

/* ------------------------------------------------------------------
   ใบอนุมัติ — หน้าเต็มแยกต่างหาก ไม่ใช่ modal เพราะเอกสารทั้งใบ (ไม่ใช่แค่
   รายการสินค้าย่อยแบบที่ /po/[id] เปิด modal ดูรายละเอียดสินค้าทีละตัว) ทุก
   เอกสารระดับ "ทั้งใบ" ในแอปนี้ (ใบสั่งซื้อ /po/[id], ใบขอซื้อ /pr/[id], ใบชั่ง
   ฯลฯ) เปิดเป็นหน้าแยกเสมอ ไม่เคยเป็น modal — มี breadcrumb/URL ของตัวเอง
   กด back ของเบราว์เซอร์ได้ตรงไปตรงมา ทำแบบเดียวกันเพื่อความสม่ำเสมอ

   หน้านี้เปิดได้ทั้งจากคิว "รออนุมัติ" และแท็บ "ประวัติ" (getApprovalDoc หาทั้ง
   สองที่) — ใบที่มาจากประวัติตัดสินใจไปแล้ว (มี approvalStatus) จึงไม่มีปุ่ม
   อนุมัติ/ไม่อนุมัติให้กดซ้ำ แค่ดูอย่างเดียว มีชิปผลลัพธ์ + เหตุผลไม่อนุมัติ (ถ้ามี)
   แทนที่แถบปุ่มล่าง

   กดไม่อนุมัติต้องกรอกเหตุผลก่อนถึงจะยืนยันได้ — ใช้ Dialog ธรรมดา ไม่ใช่
   AlertDialog เพราะมีช่องกรอกข้อมูลอยู่ข้างใน

   ไม่มี backend จริง — กดอนุมัติ/ไม่อนุมัติแล้วขึ้น toast แล้วพากลับไปหน้ารายการ
   ไม่ได้เขียนผลจริงลงในข้อมูลตัวอย่าง (เหมือนปุ่มอื่นๆ ทั้งแอปนี้)
------------------------------------------------------------------ */

// เขียนคลาสเต็มทุกตัว ห้ามประกอบชื่อด้วย template string
const URGENT_CHIP =
  "[--bdg-surface:var(--chip-orange)] [--bdg-text:var(--chip-orange-foreground)]";
const APPROVAL_STATUS_CHIP: Record<ApprovalOutcome, string> = {
  approved: "[--bdg-surface:var(--chip-green)] [--bdg-text:var(--chip-green-foreground)]",
  rejected: "[--bdg-surface:var(--chip-red)] [--bdg-text:var(--chip-red-foreground)]",
};

function UrgentChip() {
  return (
    <Badge appearance="soft" className={cn("[--bdg-border:transparent] ml-2 font-semibold", URGENT_CHIP)}>
      เร่งด่วน
    </Badge>
  );
}

/** ชิปผลอนุมัติ — โผล่เฉพาะใบที่มาจากแท็บ "ประวัติ" (ตัดสินใจไปแล้ว) */
function ApprovalStatusChip({ status }: { status: ApprovalOutcome }) {
  return (
    <Badge
      appearance="soft"
      className={cn("[--bdg-border:transparent] font-semibold", APPROVAL_STATUS_CHIP[status])}
    >
      {APPROVAL_OUTCOME_LABEL[status]}
    </Badge>
  );
}

/** เลข PO แยกตามรายการสินค้า — เลขที่ใบ + ตัวอักษรเรียงตามลำดับสินค้าในใบ
    เหมือนกับที่ใช้ในหน้ารายการ (approve-list.tsx) และหน้าใบสั่งซื้อ (/po/[id]) */
function lineItemCode(po: PoDoc, index: number): string {
  return `${po.code}${String.fromCharCode(65 + index)}`;
}

export default function ApproveDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const po = React.useMemo(() => getApprovalDoc(params.id), [params.id]);
  const [rejectOpen, setRejectOpen] = React.useState(false);
  const [rejectReason, setRejectReason] = React.useState("");

  if (!po) {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 pt-6 pb-24 sm:px-6">
        <Crumbs />
        <div className="mt-10 rounded-xl border border-dashed border-border px-6 py-14 text-center">
          <p className="font-medium">ไม่พบใบสั่งซื้อนี้</p>
          <p className="mt-1 text-sm text-muted-foreground">เอกสารอาจถูกลบหรือลิงก์ไม่ถูกต้อง</p>
          <Button asChild variant="outline-primary" className="mt-4">
            <Link href="/approve">กลับไปหน้าอนุมัติสั่งซื้อ</Link>
          </Button>
        </div>
      </main>
    );
  }

  // ใบที่มาจากแท็บ "ประวัติ" มี approvalStatus ติดมาด้วยเสมอ — ใบจากคิว
  // "รออนุมัติ" ไม่มีฟิลด์นี้เลย ใช้ตัดสินว่าตัดสินใจไปแล้วหรือยัง
  const decided = "approvalStatus" in po ? po.approvalStatus : undefined;
  const rejectedReasonText = "rejectReason" in po ? po.rejectReason : undefined;

  function handleApprove() {
    toast.success(`อนุมัติใบสั่งซื้อ ${po!.code} แล้ว`);
    router.push("/approve");
  }

  function handleReject() {
    if (!rejectReason.trim()) {
      toast.error("กรุณาระบุเหตุผลการไม่อนุมัติ");
      return;
    }
    setRejectOpen(false);
    toast.success(`ไม่อนุมัติใบสั่งซื้อ ${po!.code} แล้ว`);
    router.push("/approve");
  }

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col">
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-6 pb-6 sm:px-6">
        <Crumbs code={po.code} />

        <h1 className="mt-2 text-2xl font-semibold tracking-tight">ใบอนุมัติ {po.code}</h1>
        <p className="mt-1.5 flex items-center gap-2 text-sm text-muted-foreground">
          {po.createdAt}
          {decided && <ApprovalStatusChip status={decided} />}
        </p>

        {decided === "rejected" && rejectedReasonText && (
          <div className="mt-4 rounded-xl border border-danger-border bg-danger px-4 py-3 text-sm">
            <span className="text-muted-foreground">เหตุผลที่ไม่อนุมัติ: </span>
            {rejectedReasonText}
          </div>
        )}

        {/* ---------- ข้อมูลใบสั่งซื้อ — หุบไว้เป็นค่าเริ่มต้น มีแค่ราคารวม/วันที่
            (กล่องพื้นสีแบรนด์) ที่เห็นตลอดไม่ว่าจะหุบหรือกาง เพราะเป็นตัวเลขหลัก
            ที่ต้องใช้ตัดสินใจทันทีที่เข้าหน้า ส่วนผู้สั่งซื้อ/ผู้แก้ไข/หมายเหตุ/
            ผู้อนุมัติเป็นแค่ข้อมูลอ้างอิงเพิ่มเติม ไม่ต้องโชว์ตั้งแต่แรกก็ได้
            ---------- */}
        <Collapsible className="mt-5 rounded-xl border border-border bg-card">
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="group flex w-full items-start justify-between gap-3 px-4 py-3.5 text-left"
            >
              <div className="min-w-0 flex-1 @lg:flex @lg:items-center @lg:gap-3">
                <span className="block font-semibold">ข้อมูลใบสั่งซื้อ</span>
                <span className="mt-0.5 block text-sm text-muted-foreground @lg:mt-0">
                  บริษัท {po.company}
                </span>
              </div>
              <ChevronDownIcon className="mt-0.5 size-5 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
            </button>
          </CollapsibleTrigger>

          <div className="px-4 pb-4">
            <div className="grid gap-4 rounded-lg bg-brand p-4 @lg:grid-cols-2">
              <Stat label="ราคารวมทั้งหมด (บาท)" value={formatPoBaht(poTotalPrice(po))} />
              <Stat
                label="คาดการณ์ช่วงวันที่สินค้าจะเข้า"
                value={`${po.expectedFrom} - ${po.expectedTo}`}
              />
            </div>
          </div>

          <CollapsibleContent className="px-4 pb-4">
            <div className="grid grid-cols-2 gap-4 text-sm @2xl:grid-cols-4">
              <MetaField label="ผู้สั่งซื้อ" value={po.requester} />
              <MetaField label="ผู้แก้ไขสั่งซื้อล่าสุด" value={po.editedBy ?? "-"} />
              <MetaField label="หมายเหตุ" value={po.note ?? "-"} />
              <MetaField label="ผู้อนุมัติ" value={po.approver ?? "-"} />
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* ---------- รายการสินค้า ---------- */}
        <div className="mt-6">
          <h2 className="text-base font-semibold">รายการสินค้า ({po.lineItems.length} รายการ)</h2>
          <div className="mt-3">
            <ApproveLineItemsTable po={po} />
          </div>
        </div>
      </main>

      {/* ---------- แถบปุ่มล่าง — ใบที่ตัดสินใจไปแล้ว (จากแท็บ "ประวัติ") เหลือ
          แค่ปุ่มย้อนกลับ ไม่มีปุ่มอนุมัติ/ไม่อนุมัติให้กดซ้ำ ---------- */}
      <div className="sticky bottom-0 z-30 border-t border-border bg-surface">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Button variant="outline-primary" onClick={() => router.back()}>
            ย้อนกลับ
          </Button>
          {!decided && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="border-destructive/40 text-destructive hover:bg-destructive/10"
                onClick={() => setRejectOpen(true)}
              >
                ไม่อนุมัติ
              </Button>
              <Button onClick={handleApprove}>อนุมัติ</Button>
            </div>
          )}
        </div>
      </div>

      {/* ---------- ยืนยันไม่อนุมัติ — ต้องกรอกเหตุผลก่อนถึงจะกดยืนยันได้
          (Dialog ธรรมดา ไม่ใช่ AlertDialog เพราะมีช่องกรอกข้อมูลอยู่ข้างใน) ---------- */}
      <Dialog
        open={rejectOpen}
        onOpenChange={(next) => {
          setRejectOpen(next);
          if (!next) setRejectReason("");
        }}
      >
        <DialogContent>
          <DialogHeader className="text-left">
            <DialogTitle>คุณต้องการไม่อนุมัติการสั่งซื้อสินค้าใช่ไหม?</DialogTitle>
            <DialogDescription>กรุณาระบุเหตุผลการไม่อนุมัติ</DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="reject-reason">เหตุผลการไม่อนุมัติ</Label>
            <Textarea
              id="reject-reason"
              className="bg-card"
              rows={4}
              placeholder="ระบุเหตุผล"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline-primary" className="flex-1">
                ย้อนกลับ
              </Button>
            </DialogClose>
            <Button className="flex-1" onClick={handleReject}>
              ไม่อนุมัติ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Crumbs({ code }: { code?: string }) {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/">ระบบ</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink href="/approve">อนุมัติสั่งซื้อ</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage className="text-primary">
            ใบอนุมัติ{code ? ` ${code}` : ""}
          </BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-base font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function MetaField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-muted-foreground">{label}</p>
      <p className="mt-0.5 font-medium">{value}</p>
    </div>
  );
}

/** ตารางราคาต่อรายการ — ไม่มีคอลัมน์รับเข้า/ค้างรับเหมือน /po/[id] เพราะใบพวกนี้
    ยังไม่เริ่มรับเข้าเลย สิ่งที่ผู้อนุมัติต้องเห็นคือราคาล้วนๆ */
function ApproveLineItemsTable({ po }: { po: PoDoc }) {
  if (po.lineItems.length === 0) {
    return <EmptyDocs title="ไม่มีรายการสินค้า" hint="" />;
  }

  return (
    <>
      {/* ---------- จอแคบ: การ์ด ---------- */}
      <div className="space-y-3 @3xl:hidden">
        {po.lineItems.map((item, index) => (
          <div key={item.id} className="rounded-xl border border-border bg-card p-4">
            <p className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="font-medium">{lineItemCode(po, index)}</span>
              {item.urgent && <UrgentChip />}
            </p>
            <div className="mt-2 rounded-lg bg-brand px-3 py-2.5">
              <p className="text-base font-semibold">
                {item.productName}
                {item.productSub && ` ${item.productSub}`}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {item.group}
                {item.packing && ` · ${item.packing}`}
              </p>
            </div>
            <dl className="mt-3 space-y-1.5 text-sm">
              <CardRow label={`สั่งซื้อ (${item.unit})`}>{formatPoQty(item.orderedQty)}</CardRow>
              <CardRow label={`ราคาสั่งต่อ${item.unit} (บาท)`}>{formatPoBaht(item.pricePerUnit)}</CardRow>
              <CardRow label={`ค่าจัดการต่อ${item.unit} (บาท)`}>{formatPoBaht(item.handlingPerUnit)}</CardRow>
              <CardRow label={`ราคารวมต่อ${item.unit} (บาท)`}>{formatPoBaht(lineItemUnitPrice(item))}</CardRow>
              <CardRow label="ราคารวมทั้งหมด (บาท)">{formatPoBaht(lineItemTotalPrice(item))}</CardRow>
            </dl>
          </div>
        ))}
      </div>

      {/* ---------- จอกว้าง: ตาราง ---------- */}
      <div className="hidden @3xl:block">
        <TableFrame>
          <Table>
            <TableHeader className={STICKY_HEAD}>
              <TableRow>
                <TableHead className={HEAD_FIRST}>สินค้า</TableHead>
                <TableHead>เลขที่ใบสั่งซื้อ</TableHead>
                <TableHead className="text-right">สั่งซื้อ</TableHead>
                <TableHead className="text-right">ราคาสั่งต่อหน่วย (บาท)</TableHead>
                <TableHead className="text-right">ค่าจัดการต่อหน่วย (บาท)</TableHead>
                <TableHead className="text-right">ราคารวมต่อหน่วย (บาท)</TableHead>
                <TableHead className={cn(HEAD_LAST, "text-right")}>ราคารวมทั้งหมด (บาท)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {po.lineItems.map((item, index) => (
                <TableRow key={item.id} className={ROW_HOVER_NAV}>
                  <TableCell className={cn(COL_FIRST, "whitespace-nowrap")}>
                    <span className="text-base font-semibold">
                      {item.productName}
                      {item.productSub && ` ${item.productSub}`}
                    </span>
                    {item.urgent && <UrgentChip />}
                    <span className="mt-2 block text-sm text-muted-foreground">
                      {item.group}
                      {item.packing && ` · ${item.packing}`}
                    </span>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{lineItemCode(po, index)}</TableCell>
                  <TableCell className="text-right whitespace-nowrap tabular-nums">
                    {formatPoQty(item.orderedQty)} {item.unit}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap tabular-nums">
                    {formatPoBaht(item.pricePerUnit)}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap tabular-nums">
                    {formatPoBaht(item.handlingPerUnit)}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap tabular-nums">
                    {formatPoBaht(lineItemUnitPrice(item))}
                  </TableCell>
                  <TableCell className={cn(COL_LAST, "text-right whitespace-nowrap font-semibold tabular-nums")}>
                    {formatPoBaht(lineItemTotalPrice(item))}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableFrame>
      </div>
    </>
  );
}
