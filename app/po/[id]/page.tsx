"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ChevronDownIcon,
  CircleAlertIcon,
  CircleXIcon,
  DownloadIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  Trash2Icon,
} from "lucide-react";
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
import { HomeCrumb } from "@/components/home-crumb";
import { Button } from "@peckey954/ui/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@peckey954/ui/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@peckey954/ui/components/ui/dropdown-menu";
import { Label } from "@peckey954/ui/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@peckey954/ui/components/ui/radio-group";
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
import { applyRoundEdits, useAddedRounds } from "@/components/po/added-rounds-provider";
import { PoLineItemDetailDialog } from "@/components/po/line-item-detail-dialog";
import { PoStatusChip } from "@/components/po/po-order-list";
import { PoStatusTimeline } from "@/components/po/po-status-timeline";
import { Textarea } from "@peckey954/ui/components/ui/textarea";
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
  formatPoBaht,
  poDisplayStatus,
  formatPoQty,
  lineItemFailedQty,
  lineItemPendingQty,
  lineItemReceivedQty,
  lineItemStarted,
  lineItemStockedQty,
  lineItemTotalPrice,
  lineItemUnitPrice,
  PO_REOPEN_DAYS,
  PO_ROUND_STATUS_LABEL,
  type PoWholesale,
  poProgress,
  poTotalPrice,
  type PoDoc,
  type PoLineItem,
  type PoRound,
  type PoRoundStatus,
} from "@/lib/po";
import { usePoOrder } from "@/lib/po-edits";

/* ------------------------------------------------------------------
   ใบสั่งซื้อ — โครงตามไฟล์ออกแบบ: กล่อง "ข้อมูลใบสั่งซื้อ" พับ/กางได้ (ราคารวม
   + ช่วงวันที่คาดว่าสินค้าจะเข้า) → ตารางรายการสินค้าแบบแบน (แถวเดียวต่อสินค้า
   ไม่ต้องกาง) → ชิปสลับมุมมองย่อย → ตาราง "รอบการรับสินค้า" รวมทุกรายการสินค้า
   ในใบเดียวกันไว้ในตารางเดียว (แต่ละแถวบอกบรรจุภัณฑ์ของตัวเองอยู่แล้ว จึงไม่ปน
   กันแม้จะรวมทุกสินค้าไว้ในตารางเดียว)

   คนละหน้าที่กับตอนกางแผงในหน้ารายการ (PoOrderList) — ที่นั่นเน้นเร็ว/เฉพาะ
   สินค้าที่ยังค้างรับ ส่วนหน้านี้คือภาพเต็มของทั้งใบ รวมประวัติทุกรอบเรียงกัน
------------------------------------------------------------------ */

// เขียนคลาสเต็มทุกตัว ห้ามประกอบชื่อด้วย template string
const URGENT_CHIP =
  "[--bdg-surface:var(--chip-orange)] [--bdg-text:var(--chip-orange-foreground)]";
/** สีชิปสถานะรอบรับเข้า — ใช้ชุดสี chip-* เดียวกับที่หน้าอื่นทั้งแอปใช้กับชิป
    สถานะหลายแบบ (เช่น PROGRESS_CHIP ของ po-order-list.tsx) ไม่ใช้ tone ของ
    Badge ตรงๆ (warning/neutral) เพราะสีไม่ตรงกับดีไซน์ — "รอตรวจสอบ QC" ต้อง
    เป็นส้ม (chip-orange) แยกจาก "รอรถขนส่ง" ที่เป็นเหลือง (chip-yellow) */
const ROUND_STATUS_CHIP: Record<PoRoundStatus, string> = {
  waitingTruck: "[--bdg-surface:var(--chip-yellow)] [--bdg-text:var(--chip-yellow-foreground)]",
  waitingQc: "[--bdg-surface:var(--chip-orange)] [--bdg-text:var(--chip-orange-foreground)]",
  stocked: "[--bdg-surface:var(--chip-green)] [--bdg-text:var(--chip-green-foreground)]",
  returned: "[--bdg-surface:var(--chip-red)] [--bdg-text:var(--chip-red-foreground)]",
};

function UrgentChip() {
  return (
    <Badge appearance="soft" className={cn("[--bdg-border:transparent] ml-2 font-semibold", URGENT_CHIP)}>
      เร่งด่วน
    </Badge>
  );
}

function RoundStatusChip({ status }: { status: PoRoundStatus }) {
  return (
    <Badge
      appearance="soft"
      className={cn("[--bdg-border:transparent] font-semibold", ROUND_STATUS_CHIP[status])}
    >
      {PO_ROUND_STATUS_LABEL[status]}
    </Badge>
  );
}

type SubTab = "rounds" | "wholesale" | "status";

const SUB_TABS: { id: SubTab; label: string }[] = [
  { id: "rounds", label: "รอบการรับสินค้า" },
  { id: "wholesale", label: "ตัดขายส่ง" },
  { id: "status", label: "ติดตามสถานะ" },
];

export default function PoOrderDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  // ผ่าน usePoOrder — ใบที่เพิ่งแก้ไขแล้วบันทึก (กลับไปรออนุมัติ) เห็นค่าใหม่ทันที
  const po = usePoOrder(params.id);
  const [subTab, setSubTab] = React.useState<SubTab>("rounds");
  const [productFilter, setProductFilter] = React.useState<string>("all");
  const [cancelOpen, setCancelOpen] = React.useState(false);
  const [cancelReason, setCancelReason] = React.useState("");
  // ยกเลิกระหว่างเซสชันนี้ — อยู่หน้าเดิม ขึ้นกล่องแดง "เอกสารถูกยกเลิก" ค้างไว้
  // ให้เห็นชัด (ตามแบบ) ไม่ใช่เด้งกลับหน้ารายการ
  const [cancelledNow, setCancelledNow] = React.useState<{ reason: string } | null>(null);
  // ปิดใบสั่งซื้อ — ตั้งต้นจากข้อมูล (closedDaysAgo) ปิด/เปิดในหน้านี้เก็บแค่
  // state หน้านี้ (ไม่มี backend) ปิดแล้วเปิดกลับได้ภายใน PO_REOPEN_DAYS วัน
  // (เผื่อกดผิด) พ้นจากนั้นตัวเลือก "เปิดรับสินค้าอยู่" กดไม่ได้
  const [closed, setClosed] = React.useState(() => po?.closedDaysAgo != null);
  const reopenLocked = (po?.closedDaysAgo ?? 0) > PO_REOPEN_DAYS;
  // ค่าที่กำลังรอยืนยัน — RadioGroup ไม่อัปเดต `closed` ทันทีที่กด แค่เปิด
  // dialog ถามก่อน ค่า radio ที่โชว์ยังผูกกับ `closed` เดิมอยู่ ถ้ากดยกเลิกใน
  // dialog ก็เท่ากับไม่เกิดอะไรขึ้น ตัวเลือกจะเด้งกลับไปที่เดิมเองโดยอัตโนมัติ
  // (ไม่ต้องเขียนโค้ด revert เพิ่ม เพราะ value ของ RadioGroup มาจาก closed เสมอ)
  const [pendingClosed, setPendingClosed] = React.useState<boolean | null>(null);
  const { entries: addedEntries, patches, deletedIds } = useAddedRounds();

  if (!po) {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 pt-6 pb-24 sm:px-6">
        <Crumbs />
        <div className="mt-10 rounded-xl border border-dashed border-border px-6 py-14 text-center">
          <p className="font-medium">ไม่พบใบสั่งซื้อนี้</p>
          <p className="mt-1 text-sm text-muted-foreground">เอกสารอาจถูกลบหรือลิงก์ไม่ถูกต้อง</p>
          <Button asChild variant="outline-primary" className="mt-4">
            <Link href="/po">กลับไปหน้าสั่งซื้อ PO</Link>
          </Button>
        </div>
      </main>
    );
  }

  const cancelled = po.status === "cancelled" || cancelledNow !== null;
  const shownCancelReason = cancelledNow?.reason ?? po.cancelReason;
  const shownCancelledBy = cancelledNow ? po.requester : po.cancelledBy;
  // ยังไม่อนุมัติ/ไม่อนุมัติ/ยกเลิก — ยังไม่มีรอบรับสินค้าให้ดู เหลือแค่ติดตามสถานะ
  // ปิดใบแล้วเพิ่ม/แก้รอบไม่ได้อีก (เอาปุ่มออก) ตามแบบ
  const canAddRound = !cancelled && !closed && po.approval === "approved";
  const showRounds = !cancelled && po.approval === "approved";
  const subTabs = showRounds
    ? SUB_TABS.filter((t) => t.id !== "wholesale" || po.wholesale.length > 0)
    : SUB_TABS.filter((t) => t.id === "status");
  const activeSubTab: SubTab = showRounds ? subTab : "status";
  // รอบที่เพิ่งเพิ่มระหว่างเซสชันนี้ (มาจากหน้า "เพิ่มรอบ" คนละหน้ากัน ดู
  // AddedRoundsProvider) ต้องขึ้นเป็นแถวบนสุดของตารางเสมอ — ก่อนรอบจากข้อมูล
  // ตัวอย่าง (item.rounds) ทั้งหมด ไม่ว่าจะเป็นรายการสินค้าไหนในใบนี้ก็ตาม
  // addedEntries เรียงล่าสุดก่อนอยู่แล้ว (ดู provider) จึงกรองแล้วต่อหน้าตรงๆ
  // ได้เลยไม่ต้อง sort เพิ่ม
  // ผสาน patch (แก้ไข) และกรองรอบที่ถูกลบออกด้วย applyRoundEdits ตัวเดียวกัน
  // ทุกจุดที่อ่านรอบ (ดู AddedRoundsProvider) — คืน null แปลว่าถูกลบไปแล้ว
  const lineItemById = new Map(po.lineItems.map((item) => [item.id, item]));
  const addedRounds = addedEntries
    .filter((e) => lineItemById.has(e.lineItemId))
    .flatMap((e) => {
      const round = applyRoundEdits(e.round, patches, deletedIds);
      return round ? [{ round, item: lineItemById.get(e.lineItemId)! }] : [];
    });
  const seededRounds = po.lineItems.flatMap((item) =>
    item.rounds.flatMap((r) => {
      const round = applyRoundEdits(r, patches, deletedIds);
      return round ? [{ round, item }] : [];
    })
  );
  const allRounds = [...addedRounds, ...seededRounds];
  const visibleRounds =
    productFilter === "all" ? allRounds : allRounds.filter((r) => r.item.id === productFilter);

  function handleCancel() {
    const reason = cancelReason.trim();
    if (!reason) return;
    setCancelOpen(false);
    setCancelReason("");
    setCancelledNow({ reason });
    toast.success("ยกเลิกเอกสารสำเร็จ", { description: `ใบสั่งซื้อ ${po!.code}` });
  }

  // เลือกที่ RadioGroup แค่เปิด dialog ถามยืนยันก่อน ยังไม่เปลี่ยนสถานะจริง —
  // เปลี่ยนจริงตอนกดยืนยันใน dialog เท่านั้น (handleConfirmToggleClosed)
  function handleRadioChange(next: boolean) {
    setPendingClosed(next);
  }

  function handleConfirmToggleClosed() {
    if (pendingClosed === null) return;
    setClosed(pendingClosed);
    toast.success(pendingClosed ? "ปิดใบสั่งซื้อสำเร็จ" : "เปิดรับสินค้าอีกครั้งแล้ว", {
      description: `เลขที่ใบสั่งซื้อ: ${po!.code}`,
    });
    setPendingClosed(null);
  }

  function handleDownloadReport() {
    // ไม่มี backend จริง — แค่ยืนยันด้วย toast ยังรับไม่ครบก็ส่งออกได้ แต่จะมี
    // เฉพาะรอบที่รับแล้ว
    toast.success("ส่งออกรายงานสำเร็จ", {
      description: `ใบสั่งซื้อ ${po!.code} — PDF ใบสั่งซื้อ ใบชั่ง และสำเนาคนขับทุกรอบที่รับแล้ว`,
    });
  }

  const progress = poProgress(po);
  // สถานะเปิด/ปิดใบ + ส่งออกรายงาน — ตั้งแต่เริ่มทยอยรับสินค้าเป็นต้นไป
  const canCloseEarly = !cancelled && (closed || progress !== "notStarted");
  // เมนู ⋮ — แก้ไขได้ตอนรออนุมัติ/ไม่อนุมัติ (ส่งกลับแก้ไข) อนุมัติแล้วแก้ไม่ได้
  // ยกเลิกได้จนถึง "รอรับสินค้า" เริ่มรับสินค้าแล้วไม่มีเมนู
  const canEdit = !cancelled && po.approval !== "approved";
  const canCancel = !cancelled && !closed && (po.approval !== "approved" || progress === "notStarted");
  const editHref = `/po/${po.id}/edit`;

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col">
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-6 pb-6 sm:px-6">
        <Crumbs code={po.code} />

        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">ใบสั่งซื้อ {po.code}</h1>
            <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
              {po.createdAt}
              <PoStatusChip doc={po} status={cancelled ? "cancelled" : poDisplayStatus(po, closed)} />
            </p>
          </div>

          {/* ปิดใบก่อนกำหนด + ดาวน์โหลดรายงาน — โผล่เฉพาะตอน "ทยอยรับสินค้า"
              (ดู canCloseEarly) จัดกลุ่มไว้ด้วยกัน แยกจากเมนู "..." ที่เป็นคนละ
              เรื่อง (แก้ไขข้อมูล/ยกเลิกทั้งใบ) */}
          <div className="flex flex-wrap items-center gap-4">
            {canCloseEarly && (
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <span className="text-muted-foreground whitespace-nowrap">สถานะใบสั่งซื้อ:</span>
                <RadioGroup
                  value={closed ? "closed" : "open"}
                  onValueChange={(v) => handleRadioChange(v === "closed")}
                  className="flex flex-wrap items-center gap-3"
                >
                  <RadioOption id="po-status-open" value="open" disabled={closed && reopenLocked}>
                    เปิดรับสินค้าอยู่
                  </RadioOption>
                  <RadioOption id="po-status-closed" value="closed">
                    ปิดใบสั่งซื้อแล้ว
                  </RadioOption>
                </RadioGroup>
              </div>
            )}
            {canCloseEarly && (
              <Button variant="outline-primary" className="shrink-0" onClick={handleDownloadReport}>
                <DownloadIcon />
                ส่งออกรายงาน
              </Button>
            )}

          {(canEdit || canCancel) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label={`ตัวเลือกเพิ่มเติมสำหรับใบสั่งซื้อ ${po.code}`}
                  className="shrink-0"
                >
                  <EllipsisVerticalIcon />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-40">
                {canEdit && (
                  <DropdownMenuItem asChild>
                    <Link href={editHref}>
                      <PencilIcon />
                      แก้ไข
                    </Link>
                  </DropdownMenuItem>
                )}
                {canCancel && (
                  <DropdownMenuItem onSelect={() => setCancelOpen(true)}>
                    <Trash2Icon />
                    ยกเลิกเอกสาร
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          </div>
        </div>

        {/* ไม่อนุมัติ — ส่งกลับมาให้แก้ กดลิงก์ในกล่องนี้หรือเมนู ⋮ > แก้ไข ก็ได้ */}
        {!cancelled && po.approval === "rejected" && (
          <div
            role="status"
            className="mt-4 flex gap-3 rounded-xl border border-danger-border bg-danger px-4 py-3 text-sm text-danger-strong"
          >
            <CircleAlertIcon className="mt-0.5 size-5 shrink-0" />
            <div>
              <p className="font-semibold">ส่งกลับแก้ไข</p>
              <p className="mt-0.5">
                ไม่อนุมัติเนื่องจาก{po.rejectReason ?? "ข้อมูลไม่ถูกต้อง"} หากต้องการแก้ไข กรุณากด{" "}
                <Link href={editHref} className="font-medium underline underline-offset-2">
                  แก้ไขใบสั่งซื้อ
                </Link>
              </p>
            </div>
          </div>
        )}

        {cancelled && (
          <div
            role="status"
            className="mt-4 flex gap-3 rounded-xl border border-danger-border bg-danger px-4 py-3 text-sm text-danger-strong"
          >
            <CircleXIcon className="mt-0.5 size-5 shrink-0" />
            <div>
              <p className="font-semibold">เอกสารถูกยกเลิก</p>
              <p className="mt-0.5">เหตุผล: {shownCancelReason ?? "-"}</p>
              <p>ผู้ยกเลิก: {shownCancelledBy ?? "-"}</p>
            </div>
          </div>
        )}

        {/* ---------- ข้อมูลใบสั่งซื้อ — หุบไว้เป็นค่าเริ่มต้น เห็นแค่การ์ดราคา/
            วันที่เล็กๆ พอ กดกางถึงเห็นผู้สั่งซื้อ/ผู้แก้ไข/หมายเหตุ/ผู้อนุมัติ ---------- */}
        <Collapsible className="mt-5 rounded-xl border border-border bg-card">
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="group flex w-full items-start justify-between gap-3 px-4 py-3.5 text-left"
            >
              {/* จอแคบ: ชื่อบริษัทยาวเกินอยู่แถวเดียวกับหัวข้อ ตัดลงมาเป็น
                  บรรทัดของตัวเอง — จอกว้าง (@lg) มีที่พอ กลับไปอยู่แถวเดียวกัน */}
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

          {/* ---------- ใครสั่ง/แก้ไข/อนุมัติใบนี้ — ระดับทั้งใบ ไม่ใช่ต่อรายการ ---------- */}
          <CollapsibleContent className="px-4 pb-4">
            <div className="grid grid-cols-2 gap-4 text-sm @2xl:grid-cols-4">
              <MetaField label="ผู้สั่งซื้อ" value={po.requester} />
              <MetaField label="ผู้แก้ไขสั่งซื้อล่าสุด" value={po.editedBy ?? "-"} />
              <MetaField label="หมายเหตุ" value={po.note ?? "-"} />
              <MetaField label="ผู้อนุมัติ" value={po.approver ?? "-"} />
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* ---------- รายการสินค้า — แถวเดียวต่อสินค้า ไม่ต้องกาง ---------- */}
        <div className="mt-6">
          <h2 className="text-base font-semibold">รายการสินค้า ({po.lineItems.length} รายการ)</h2>
          <div className="mt-3">
            <LineItemsTable po={po} canAddRound={canAddRound} />
          </div>
        </div>

        {/* ---------- ชิปสลับมุมมองย่อย ---------- */}
        <div role="tablist" aria-label="มุมมองใบสั่งซื้อ" className="mt-8 flex flex-wrap items-center gap-2">
          {subTabs.map((t) => {
            const on = activeSubTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => setSubTab(t.id)}
                className={cn(
                  "shrink-0 rounded-full border px-3 py-1 text-sm whitespace-nowrap transition-colors",
                  on
                    ? "border-primary bg-brand font-medium text-primary"
                    : "border-border text-foreground hover:bg-accent-hover"
                )}
              >
                {t.label}
                {t.id === "rounds" && ` (${allRounds.length})`}
                {t.id === "wholesale" && ` (${po.wholesale.length})`}
              </button>
            );
          })}
        </div>

        {activeSubTab === "rounds" ? (
          <div className="mt-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-base font-semibold">รอบการรับสินค้า</h2>
              {/* ดรอปดาวน์กรองตามสินค้า — ค่าเริ่มต้น "สินค้าทั้งหมด" เห็นทุกรอบ
                  รวมกัน เลือกสินค้าเจาะจงแล้วเหลือแค่รอบของสินค้านั้น */}
              <Select value={productFilter} onValueChange={setProductFilter}>
                <SelectTrigger className="w-full bg-card @lg:w-64" aria-label="กรองตามสินค้า">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">สินค้าทั้งหมด</SelectItem>
                  {po.lineItems.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.productName}
                      {item.productSub && ` ${item.productSub}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="mt-3">
              <RoundsTable rows={visibleRounds} locked={!canAddRound} />
            </div>
          </div>
        ) : activeSubTab === "wholesale" ? (
          <div className="mt-4">
            <h2 className="text-base font-semibold">รายการตัดขายส่ง</h2>
            <div className="mt-3">
              <WholesaleTable po={po} rows={po.wholesale} />
            </div>
          </div>
        ) : activeSubTab === "status" ? (
          <div className="mt-5">
            <PoStatusTimeline
              doc={po}
              cancelled={cancelled}
              cancelReason={shownCancelReason}
              cancelledBy={shownCancelledBy}
            />
          </div>
        ) : (
          <div className="mt-4">
            <EmptyDocs
              title={`แท็บ${SUB_TABS.find((t) => t.id === activeSubTab)?.label}ยังไม่เปิดใช้งาน`}
              hint="อยู่ระหว่างออกแบบหน้านี้ กลับมาดูใหม่อีกครั้ง"
            />
          </div>
        )}
      </main>

      <div className="sticky bottom-0 z-30 border-t border-border bg-surface">
        <div className="mx-auto flex w-full max-w-6xl items-center px-8 py-3">
          <Button variant="outline-primary" onClick={() => router.back()}>
            ย้อนกลับ
          </Button>
        </div>
      </div>

      <AlertDialog
        open={cancelOpen}
        onOpenChange={(open) => {
          setCancelOpen(open);
          if (!open) setCancelReason("");
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>คุณต้องยกเลิกเอกสารใช่ไหม?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <span>
                <span className="block font-medium text-primary">ใบสั่งซื้อ {po.code}</span>
                {po.approval === "rejected"
                  ? "ยกเลิกแล้วรายการสินค้าจะคืนกลับไปที่คำขอ PR"
                  : "หากยกเลิกแล้วจะไม่สามารถกู้คืนข้อมูลได้อีก"}
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-1.5 text-left">
            <Label htmlFor="po-cancel-reason">เหตุผลการยกเลิก</Label>
            <Textarea
              id="po-cancel-reason"
              className="bg-card"
              placeholder="เหตุผล..."
              rows={3}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>ย้อนกลับ</AlertDialogCancel>
            <AlertDialogAction disabled={!cancelReason.trim()} onClick={handleCancel}>
              ยกเลิกเอกสาร
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ยืนยันก่อนสลับสถานะเปิด/ปิดใบสั่งซื้อ — กดตัวเลือกแค่เปิด dialog นี้
          ยังไม่เปลี่ยนสถานะจริง (ดู handleRadioChange) ปิด dialog โดยไม่กด
          ยืนยันแล้วตัวเลือกจะเด้งกลับที่เดิมเอง เพราะ value ของ RadioGroup
          อ้างอิงจาก `closed` ตรงๆ ไม่ใช่ `pendingClosed` */}
      <AlertDialog
        open={pendingClosed !== null}
        onOpenChange={(next) => !next && setPendingClosed(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingClosed
                ? "ปิดใบสั่งซื้อนี้ใช่ไหม?"
                : "เปิดรับสินค้าใบสั่งซื้อนี้อีกครั้งใช่ไหม?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingClosed
                ? "ใบนี้ยังรับสินค้าไม่ครบ ปิดแล้วจะไม่มีรอบรับเข้าเพิ่มอีก"
                : "จะกลับไปเป็นสถานะทยอยรับสินค้า รับรอบเพิ่มได้ตามปกติ"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmToggleClosed}>
              {pendingClosed ? "ยืนยันปิดใบ" : "ยืนยันเปิดรับสินค้า"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Crumbs({ code }: { code?: string }) {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <HomeCrumb />
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/po">สั่งซื้อ PO</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage className="text-primary">
            ใบสั่งซื้อ{code ? ` ${code}` : ""}
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

/** ตัวเลือกวิทยุแบบข้อความล้วน ไม่มีกรอบกล่องเหมือน RadioBox ของหน้าสร้าง
    ใบสั่งซื้อ (app/po/create/page.tsx) — ใช้ Label + htmlFor จับคู่ id ของ
    RadioGroupItem แบบเดียวกัน กดที่ข้อความก็เลือกได้เหมือนกดปุ่มวิทยุตรงๆ */
/** ตัวเลือกแบบกล่อง (ไม่ใช่แค่จุดวิทยุ+ตัวหนังสือเปล่าๆ) — พื้นที่กดกว้างขึ้น
    ทั้งกล่อง ไม่ต้องเล็งจุดวิทยุพอดี ไฮไลต์กรอบ/พื้นตอนถูกเลือกด้วย data-state
    ของ RadioGroupItem เอง แบบเดียวกับ RadioBox ของหน้าสร้างใบสั่งซื้อ
    (app/po/create/page.tsx) */
function RadioOption({
  id,
  value,
  disabled,
  children,
}: {
  id: string;
  value: string;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Label
      htmlFor={id}
      className={cn(
        "flex cursor-pointer items-center gap-2.5 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium",
        "has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-brand",
        disabled && "cursor-not-allowed text-muted-foreground opacity-60"
      )}
    >
      <RadioGroupItem id={id} value={value} disabled={disabled} />
      {children}
    </Label>
  );
}

/** ตารางรายการสินค้า — แถวเดียวต่อสินค้า ไม่มีการกาง เพราะประวัติรอบเต็มอยู่
    ในตาราง "รอบการรับสินค้า" ข้างล่างอยู่แล้ว ตรงนี้บอกแค่ยอดรวมต่อสินค้า */
/** เลข PO แยกตามรายการสินค้า — เลขที่ใบ + ตัวอักษรเรียงตามลำดับสินค้าในใบ
    (A ตัวแรก, B ตัวที่สอง, ...) ใช้อ้างอิงรายการนี้แยกจากรายการอื่นในใบเดียวกัน
    เหมือนกับที่ใช้ในแผงรายการของหน้ารายการ (po-order-list.tsx) */
function lineItemCode(po: PoDoc, index: number): string {
  return `${po.code}${String.fromCharCode(65 + index)}`;
}

function LineItemsTable({ po, canAddRound }: { po: PoDoc; canAddRound: boolean }) {
  const cancelled = po.status === "cancelled";
  // กดที่แถว/การ์ดรายการไหนก็ได้เพื่อดูรายละเอียดเต็มของสินค้านั้น — ยกเว้น
  // ปุ่ม "เพิ่มรอบ" ที่กันคลิกลอยไว้ (พาไปคนละหน้า ไม่ใช่เปิด modal)
  const [selected, setSelected] = React.useState<PoLineItem | null>(null);

  if (po.lineItems.length === 0) {
    return <EmptyDocs title="ไม่มีรายการสินค้า" hint="" />;
  }

  return (
    <>
      {/* ---------- จอแคบ: ลิสต์เดียวคั่นเส้นบางๆ ไม่ใส่ตัวเลข — เอาไว้แค่ระบุ
          สินค้า+ปุ่มเพิ่มรอบ ตัวเลขเต็มดูได้จากตาราง "รอบการรับสินค้า" ข้างล่าง
          (กรองตามสินค้านี้ได้จากดรอปดาวน์ตรงนั้น) หรือกดที่การ์ดเพื่อดูรายละเอียด
          เต็มของสินค้านั้นในทันที ---------- */}
      <div className="divide-y divide-border rounded-xl border border-border bg-card @3xl:hidden">
        {po.lineItems.map((item, index) => (
          <div
            key={item.id}
            onClick={() => setSelected(item)}
            className="flex cursor-pointer items-center justify-between gap-3 px-4 py-3"
          >
            <div className="min-w-0 flex-1 text-sm">
              <p className="text-base font-semibold">
                {item.productName}
                {item.productSub && ` ${item.productSub}`}
              </p>
              <p className="mt-2 text-muted-foreground">
                {item.categoryLabel} <span className="text-border" aria-hidden>|</span> {item.group}
                {item.packing && (
                  <>
                    {" "}
                    <span className="text-border" aria-hidden>|</span> {item.packing}
                  </>
                )}
              </p>
              <p className="mt-4 font-medium">
                {lineItemCode(po, index)}
                {item.urgent && <UrgentChip />}
              </p>
            </div>
            {canAddRound && (
              <div onClick={(e) => e.stopPropagation()} className="shrink-0">
                <Button asChild variant="outline-primary" size="sm">
                  <Link href={`/po/${po.id}/receive/${item.id}/add`}>เพิ่มรอบ</Link>
                </Button>
              </div>
            )}
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
                <TableHead className="text-right">ตัดขายส่ง</TableHead>
                <TableHead className="text-right">รับเข้า</TableHead>
                <TableHead className="text-right">ไม่ผ่าน</TableHead>
                <TableHead className="text-right">เข้าคลัง</TableHead>
                <TableHead className="text-right">น้ำหนักชั่ง (กก.)</TableHead>
                <TableHead className="text-right">น้ำหนักตามผู้ขาย (กก.)</TableHead>
                <TableHead className="text-right">ส่วนต่าง (กก.)</TableHead>
                <TableHead className="text-right">ราคาสั่งต่อหน่วย (บาท)</TableHead>
                <TableHead className="text-right">ค่าจัดการต่อหน่วย (บาท)</TableHead>
                <TableHead className="text-right">ราคารวมต่อหน่วย (บาท)</TableHead>
                <TableHead className="text-right">ราคารวมทั้งหมด (บาท)</TableHead>
                <TableHead className={HEAD_LAST} />
              </TableRow>
            </TableHeader>
            <TableBody>
              {po.lineItems.map((item, index) => {
                const started = lineItemStarted(item);
                const received = lineItemReceivedQty(item);
                const pending = lineItemPendingQty(item);
                const failed = lineItemFailedQty(item);
                const stocked = lineItemStockedQty(item);
                const weighDiff =
                  item.weighedKg != null && item.sellerWeightKg != null
                    ? item.weighedKg - item.sellerWeightKg
                    : undefined;
                return (
                  <TableRow
                    key={item.id}
                    onClick={() => setSelected(item)}
                    className={cn("cursor-pointer", ROW_HOVER_NAV)}
                  >
                    <TableCell className={cn(COL_FIRST, "whitespace-nowrap")}>
                      <span className="text-base font-semibold">
                        {item.productName}
                        {item.productSub && ` ${item.productSub}`}
                      </span>
                      {item.urgent && <UrgentChip />}
                      <span className="mt-2 block text-sm text-muted-foreground">
                        {item.categoryLabel} <span className="text-border" aria-hidden>|</span> {item.group}
                        {item.packing && (
                          <>
                            {" "}
                            <span className="text-border" aria-hidden>|</span> {item.packing}
                          </>
                        )}
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <span className="font-medium">{lineItemCode(po, index)}</span>
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap tabular-nums">
                      {formatPoQty(item.orderedQty)} {item.unit}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap tabular-nums">
                      {item.wholesaleQty ? (
                        `${formatPoQty(item.wholesaleQty)} ${item.unit}`
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap tabular-nums">
                      {started ? (
                        <>
                          {formatPoQty(received)} {item.unit}
                          {/* ค้างรับ — ซ้อนใต้ยอดรับเข้าแทนแยกคอลัมน์ เพราะเป็น
                              ส่วนขยายของตัวเลขเดียวกัน (สั่งซื้อ − รับเข้าแล้ว)
                              โผล่เฉพาะตอนเริ่มรับแล้วแต่ยังไม่ครบ — ยังไม่เริ่ม
                              เลยไม่ต้องบอกว่า "ค้างรับ" เพราะทั้งแถวคือ "-" อยู่แล้ว */}
                          {!cancelled && pending > 0 && (
                            <span className="block text-sm font-normal text-danger-strong">
                              ค้างรับ: {formatPoQty(pending)} {item.unit}
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap tabular-nums">
                      {failed > 0 ? (
                        <span className="font-medium text-danger-strong">
                          - {formatPoQty(failed)} {item.unit}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap tabular-nums">
                      {started ? (
                        `${formatPoQty(stocked)} ${item.unit}`
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap tabular-nums">
                      {item.weighedKg != null ? (
                        formatPoQty(item.weighedKg)
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap tabular-nums">
                      {item.sellerWeightKg != null ? (
                        formatPoQty(item.sellerWeightKg)
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap tabular-nums">
                      {weighDiff != null ? (
                        <span className={cn("font-medium", weighDiff < 0 && "text-danger-strong")}>
                          {weighDiff > 0 ? "+" : ""}
                          {formatPoQty(weighDiff)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
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
                    <TableCell className="text-right whitespace-nowrap font-medium tabular-nums">
                      {formatPoBaht(lineItemTotalPrice(item))}
                    </TableCell>
                    <TableCell className={COL_LAST} onClick={(e) => e.stopPropagation()}>
                      {canAddRound && (
                        <Button asChild variant="outline-primary" size="sm">
                          <Link href={`/po/${po.id}/receive/${item.id}/add`}>
                            เพิ่มรอบ
                          </Link>
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableFrame>
      </div>

      <PoLineItemDetailDialog
        po={po}
        item={selected}
        open={selected !== null}
        onOpenChange={(v) => !v && setSelected(null)}
      />
    </>
  );
}

/** ตาราง "รอบการรับสินค้า" — รวมทุกรอบจากทุกรายการสินค้าในใบไว้ในตารางเดียว
    แต่ละแถวบอกบรรจุภัณฑ์ของตัวเองอยู่แล้ว จึงยังรู้ว่าแถวไหนเป็นของสินค้าไหน
    แม้จะรวมกันไว้ในตารางเดียว — ตรงกับไฟล์ออกแบบ */
/** สถานะ "รอรถขนส่ง" ยังไม่มีตัวเลขให้ดู กดแล้วพาไปฟอร์มแก้ไข (หน้าเดียวกับ
 *  "เพิ่มรอบ" แค่เปิดโหมดแก้ไข — ดู app/po/[id]/receive/[itemId]/add/page.tsx)
 *  สถานะอื่น (รอตรวจสอบ QC/เข้าคลังแล้ว/ส่งคืน) มีข้อมูลจริงให้ดูแล้ว พาไปหน้า
 *  รายละเอียดรอบ (ดูอย่างเดียว) แทน */
function roundHref(item: PoLineItem, round: PoRound, locked = false) {
  // round.id มาจากเลขที่รับสินค้า (code) ซึ่งมี "/" ปนอยู่เสมอ (เช่น
  // "PO260116/03/01-01-r") ต้อง encodeURIComponent ก่อนใส่เป็นส่วนหนึ่งของ
  // URL เสมอ ไม่งั้น "/" จะถูกตีความเป็นตัวแบ่ง path เพิ่ม ทำให้จำนวน segment
  // ไม่ตรงกับ [roundId] แล้ว 404 — query string ก็เข้ารหัสไว้ด้วยเผื่อ browser
  // ตัวไหนตีความ "/" ในนั้นแปลกๆ แม้ปกติจะปลอดภัยกว่า path segment ก็ตาม
  const encodedId = encodeURIComponent(round.id);
  // ปิดใบ/ยกเลิกแล้ว — แก้รอบ "รอรถขนส่ง" ไม่ได้อีก ไปหน้าดูรายละเอียดแทน
  return round.status === "waitingTruck" && !locked
    ? `/po/${item.poId}/receive/${item.id}/add?roundId=${encodedId}`
    : `/po/${item.poId}/receive/${item.id}/${encodedId}`;
}

function RoundsTable({
  rows,
  locked,
}: {
  rows: { round: PoRound; item: PoLineItem }[];
  locked: boolean;
}) {
  const router = useRouter();

  if (rows.length === 0) {
    return <EmptyDocs title="ยังไม่มีรอบรับเข้า" hint="กด “เพิ่มรอบ” ที่รายการสินค้าด้านบนเพื่อเริ่มบันทึก" />;
  }

  return (
    <>
      {/* ---------- จอแคบ: การ์ดเรียบๆ — เอาแค่ทะเบียนรถ/รับเข้า/สถานะพอ ที่เหลือ
          (บรรจุภัณฑ์/ไม่ผ่าน/ผลตรวจสอบ QC/เข้าคลัง) โผล่เฉพาะรอบที่มีค่าจริงแล้ว
          เท่านั้น ไม่งั้นการ์ดรกด้วยข้อมูลที่ยังไม่เกิดขึ้น (เช่นรอบที่ยังไม่ตรวจ QC)
          กดทั้งการ์ดพาไปหน้าแก้ไข/รายละเอียดของรอบนั้น (ดู roundHref) ---------- */}
      <div className="space-y-3 @3xl:hidden">
        {rows.map(({ round: r, item }) => (
          <div
            key={r.id}
            onClick={() => router.push(roundHref(item, r, locked))}
            className="cursor-pointer rounded-xl border border-border bg-card p-4"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="font-semibold">{r.code}</span>
              <span className="text-sm text-muted-foreground">{r.arriveDate}</span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {r.plate}
              {r.containerNo && ` · ${r.containerNo}`}
            </p>
            <dl className="mt-3 space-y-1.5 text-sm">
              <CardRow label="รับเข้า">
                {r.receivedTon != null ? `${formatPoQty(r.receivedTon)} ${item.unit}` : "-"}
              </CardRow>
              {r.failedTon != null && (
                <CardRow label="ไม่ผ่าน" className="text-danger-strong">
                  - {formatPoQty(r.failedTon)} {item.unit}
                </CardRow>
              )}
              {r.qcResult && <CardRow label="ผลตรวจสอบ QC">{r.qcResult}</CardRow>}
              {r.stockedTon != null && (
                <CardRow label="เข้าคลัง">
                  {formatPoQty(r.stockedTon)} {item.unit}
                </CardRow>
              )}
              <CardRow label="สถานะ">
                <RoundStatusChip status={r.status} />
              </CardRow>
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
                <TableHead className={HEAD_FIRST}>เลขที่รับสินค้า</TableHead>
                <TableHead>สินค้า</TableHead>
                <TableHead>เลขที่ ID</TableHead>
                <TableHead>ทะเบียนรถ</TableHead>
                <TableHead>วันที่รถจะเข้า</TableHead>
                <TableHead>เบอร์ตู้คอนเทนเนอร์</TableHead>
                <TableHead>บรรจุภัณฑ์</TableHead>
                {/* ไม่ใส่หน่วยไว้ที่หัวตาราง เพราะรอบรับในใบเดียวกันอาจเป็นคนละสินค้า
                    คนละหน่วยกันได้ (ตัน/กก./ลิตร ฯลฯ) หน่วยจึงต้องอยู่ติดกับตัวเลข
                    ในแต่ละแถวแทน ไม่ใช่ค่าตายตัวที่หัวตาราง */}
                <TableHead className="text-right">รับเข้า</TableHead>
                <TableHead className="text-right">ไม่ผ่าน</TableHead>
                <TableHead>ผลตรวจสอบ QC</TableHead>
                <TableHead className="text-right">เข้าคลัง</TableHead>
                <TableHead className={HEAD_LAST}>สถานะ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(({ round: r, item }) => (
                <TableRow
                  key={r.id}
                  onClick={() => router.push(roundHref(item, r, locked))}
                  className={cn("cursor-pointer", ROW_HOVER_NAV)}
                >
                  <TableCell className={COL_FIRST}>
                    <span className="block font-medium whitespace-nowrap">{r.code}</span>
                    <span className="block text-sm text-muted-foreground">{r.arriveDate}</span>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <span className="block font-medium">{item.productName}</span>
                    {item.productSub && (
                      <span className="block text-sm text-muted-foreground">{item.productSub}</span>
                    )}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">{r.batchId ?? "-"}</TableCell>
                  <TableCell className="whitespace-nowrap">{r.plate}</TableCell>
                  <TableCell className="whitespace-nowrap">{r.arriveDate}</TableCell>
                  <TableCell className="whitespace-nowrap">{r.containerNo ?? "-"}</TableCell>
                  <TableCell className="whitespace-nowrap">{item.packing ?? "-"}</TableCell>
                  <TableCell className="text-right whitespace-nowrap tabular-nums">
                    {r.receivedTon != null ? (
                      `${formatPoQty(r.receivedTon)} ${item.unit}`
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap tabular-nums">
                    {r.failedTon != null ? (
                      <span className="text-danger-strong">
                        - {formatPoQty(r.failedTon)} {item.unit}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {r.qcResult ?? <span className="text-muted-foreground">-</span>}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap tabular-nums">
                    {r.stockedTon != null ? (
                      `${formatPoQty(r.stockedTon)} ${item.unit}`
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className={COL_LAST}>
                    <RoundStatusChip status={r.status} />
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

/** รายการตัดขายส่ง — ดึงจาก ERP (ขายให้ลูกค้าก่อนเข้าโรงงาน) ดูอย่างเดียว */
function WholesaleTable({ po, rows }: { po: PoDoc; rows: PoWholesale[] }) {
  const itemById = new Map(po.lineItems.map((i) => [i.id, i]));
  return (
    <TableFrame>
      <Table>
        <TableHeader className={STICKY_HEAD}>
          <TableRow>
            <TableHead className={HEAD_FIRST}>เลขที่ใบสั่งซื้อ (ขายส่ง)</TableHead>
            <TableHead>สินค้า</TableHead>
            <TableHead>ประเภทสินค้า</TableHead>
            <TableHead>หมวด</TableHead>
            <TableHead className="text-right">บรรจุภัณฑ์</TableHead>
            <TableHead>ทะเบียนรถ</TableHead>
            <TableHead>วันที่รถเข้า</TableHead>
            <TableHead>เบอร์ตู้คอนเทนเนอร์</TableHead>
            <TableHead>ชื่อลูกค้า</TableHead>
            <TableHead className="text-right">ปริมาณตัดขาย</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((w) => {
            const item = itemById.get(w.lineItemId);
            return (
              <TableRow key={w.id}>
                <TableCell className={cn(COL_FIRST, "whitespace-nowrap")}>
                  <span className="block font-medium">{w.code}</span>
                  <span className="block text-sm text-muted-foreground">{w.createdAt}</span>
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {item?.productName}
                  {item?.productSub && (
                    <span className="block text-sm text-muted-foreground">{item.productSub}</span>
                  )}
                </TableCell>
                <TableCell className="whitespace-nowrap">{item?.categoryLabel}</TableCell>
                <TableCell className="whitespace-nowrap">{item?.group}</TableCell>
                <TableCell className="text-right whitespace-nowrap">{item?.packing ?? "-"}</TableCell>
                <TableCell className="whitespace-nowrap">{w.plate}</TableCell>
                <TableCell className="whitespace-nowrap">{w.arriveDate}</TableCell>
                <TableCell className="whitespace-nowrap">{w.containerNo}</TableCell>
                <TableCell className="whitespace-nowrap">{w.customer}</TableCell>
                <TableCell className="text-right font-medium whitespace-nowrap tabular-nums">
                  {formatPoQty(w.qty)} {item?.unit}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableFrame>
  );
}
