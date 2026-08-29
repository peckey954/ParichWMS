"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ChevronDownIcon,
  CircleXIcon,
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
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@peckey954/ui/components/ui/alert";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@peckey954/ui/components/ui/dropdown-menu";
import { cn } from "@peckey954/ui/lib/utils";
import { toast } from "sonner";
import { PrStatusTimeline } from "@/components/pr/pr-status-timeline";
import {
  formatPrQty,
  formatReasons,
  getPrDoc,
  PR_CATEGORY_LABEL,
  PR_STATUS_LABEL,
} from "@/lib/pr";

/* ------------------------------------------------------------------
   ใบขอซื้อ — เข้ามาจากการกดแถว/การ์ดในหน้ารายการ

   แก้ไข/ยกเลิกได้เฉพาะตอนสถานะ "ส่งคำขอแล้ว" เท่านั้น เพราะพ้นจุดนี้ไปแล้ว
   ฝั่งจัดซื้อได้ออกใบสั่งซื้อไปแล้ว แก้ย้อนหลังจะไม่ตรงกับสิ่งที่คุยกับผู้ขาย
   ไปแล้ว — เมนูจุดสามจุด (แก้ไข/ยกเลิกเอกสาร) จึงโผล่เฉพาะสถานะนี้
------------------------------------------------------------------ */

// สีชิปเดียวกับตารางรายการ ไม่มีขอบ พื้นอ่อน
const STATUS_CHIP: Record<string, string> = {
  sent: "[--bdg-surface:var(--chip-yellow)] [--bdg-text:var(--chip-yellow-foreground)]",
  ordered:
    "[--bdg-surface:var(--chip-orange)] [--bdg-text:var(--chip-orange-foreground)]",
  partial: "[--bdg-surface:var(--chip-lime)] [--bdg-text:var(--chip-lime-foreground)]",
  stocked: "[--bdg-surface:var(--chip-green)] [--bdg-text:var(--chip-green-foreground)]",
  cancelled: "[--bdg-surface:var(--chip-red)] [--bdg-text:var(--chip-red-foreground)]",
};

export default function PrDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const doc = React.useMemo(() => getPrDoc(params.id), [params.id]);
  const [cancelOpen, setCancelOpen] = React.useState(false);

  if (!doc) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 pt-6 pb-24 sm:px-6">
        <Crumbs />
        <div className="mt-10 rounded-xl border border-dashed border-border px-6 py-14 text-center">
          <p className="font-medium">ไม่พบใบขอซื้อนี้</p>
          <p className="mt-1 text-sm text-muted-foreground">
            เอกสารอาจถูกลบหรือลิงก์ไม่ถูกต้อง
          </p>
          <Button asChild variant="outline-primary" className="mt-4">
            <Link href="/pr">กลับไปหน้าขอซื้อ PR</Link>
          </Button>
        </div>
      </main>
    );
  }

  const safeDoc = doc;
  const canEdit = safeDoc.status === "sent";

  function handleCancel() {
    setCancelOpen(false);
    toast.success(`ยกเลิกใบขอซื้อ ${safeDoc.code} แล้ว`);
    router.push("/pr");
  }

  return (
    // เนื้อหาสั้นกว่าจอได้ (ใบที่ยกเลิกไม่มีตารางยาวๆ) — ถ้าไม่กำหนดความสูง
    // ขั้นต่ำ ปุ่มย้อนกลับ (sticky bottom-0) จะลอยอยู่ใต้เนื้อหาแทนติดขอบล่าง
    // จอจริง ให้ flex-1 ใน main ดันปุ่มลงไปสุดความสูงขั้นต่ำนี้แทนเสมอ
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col">
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pt-6 pb-6 sm:px-6">
        <Crumbs />

        <div className="mt-4 flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              ใบขอซื้อ PR {doc.code}
            </h1>
            <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
              {doc.createdAt}
              <Badge
                appearance="soft"
                className={cn(
                  "[--bdg-border:transparent] font-semibold",
                  STATUS_CHIP[doc.status]
                )}
              >
                {PR_STATUS_LABEL[doc.status]}
              </Badge>
            </p>
          </div>

          {canEdit && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label={`ตัวเลือกเพิ่มเติมสำหรับใบขอซื้อ ${doc.code}`}
                  className="shrink-0"
                >
                  <EllipsisVerticalIcon />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-40">
                <DropdownMenuItem asChild>
                  <Link href={`/pr/${doc.id}/edit`}>
                    <PencilIcon />
                    แก้ไข
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setCancelOpen(true)}>
                  <Trash2Icon />
                  ยกเลิกเอกสาร
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {doc.status === "cancelled" && (
          <Alert variant="destructive" className="mt-4">
            <CircleXIcon />
            <AlertTitle>ยกเลิก</AlertTitle>
            <AlertDescription>
              เหตุผล: {doc.cancelReason}
              <br />
              ผู้ยกเลิก: {doc.cancelActor}
            </AlertDescription>
          </Alert>
        )}

        {/* หุบไว้ก่อนเสมอ — เห็นแค่สินค้ากับยอดขอซื้อ/เหตุผลก็พอตอบคำถามหลักได้แล้ว
            กดขยายค่อยเห็นรายละเอียด (วันที่ต้องการ/ผู้ขอซื้อ/ผู้แก้ไขล่าสุด) */}
        <Collapsible className="mt-5 rounded-xl border border-border bg-card">
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="group flex w-full items-start justify-between gap-3 px-4 pt-4 pb-3 text-left"
            >
              <span className="flex min-w-0 flex-1 flex-col gap-y-1">
                <span className="font-semibold">
                  {doc.productName}
                  {doc.productSub && ` ${doc.productSub}`}
                </span>
                <span className="flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground">
                  <span>{PR_CATEGORY_LABEL[doc.categoryId]}</span>
                  <span className="text-border" aria-hidden>
                    |
                  </span>
                  <span>{doc.group}</span>
                  {doc.packing && (
                    <>
                      <span className="text-border" aria-hidden>
                        |
                      </span>
                      <span>{doc.packing}</span>
                    </>
                  )}
                </span>
              </span>
              <ChevronDownIcon className="mt-0.5 size-5 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
            </button>
          </CollapsibleTrigger>

          <div className="px-4 pb-4">
            <div className="grid grid-cols-2 gap-4 rounded-lg bg-brand p-4">
              <SummaryStat label={`ขอซื้อ (${doc.unit})`} value={formatPrQty(doc.qty)} />
              <SummaryStat label="เหตุผลการซื้อ" value={formatReasons(doc.reasons)} />
            </div>
          </div>

          <CollapsibleContent className="px-4 pb-4">
            <div className="grid grid-cols-2 gap-3 text-sm @2xl:grid-cols-3">
              <MetaField label="วันที่ต้องการสินค้า" value={doc.neededDate} />
              <MetaField label="ผู้ขอซื้อ" value={doc.requester} />
              <MetaField label="ผู้แก้ไขล่าสุด" value={doc.editedBy ?? "-"} />
            </div>
          </CollapsibleContent>
        </Collapsible>

        <div className="mt-6">
          <span className="inline-flex items-center rounded-full border border-primary px-3 py-1 text-sm font-medium text-primary">
            ติดตามสถานะ
          </span>
        </div>

        <div className="mt-4">
          <PrStatusTimeline doc={doc} />
        </div>
      </main>

      {/* ---------- แถบปุ่มล่าง ---------- */}
      <div className="sticky bottom-0 z-30 border-t border-border bg-surface">
        <div className="mx-auto flex w-full max-w-3xl items-center px-4 py-3 sm:px-6">
          <Button variant="outline-primary" onClick={() => router.back()}>
            ย้อนกลับ
          </Button>
        </div>
      </div>

      <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยกเลิกใบขอซื้อนี้ใช่ไหม?</AlertDialogTitle>
            <AlertDialogDescription>
              เอกสารจะเปลี่ยนเป็นสถานะยกเลิก แก้ไขกลับไม่ได้
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ไม่ยกเลิก</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancel}>ยืนยันยกเลิก</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
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
          <BreadcrumbLink href="/pr">ขอซื้อ PR</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage className="text-primary">ใบขอซื้อ</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}

function MetaField({ label, value }: { label: string; value: string }) {
  return (
    <p>
      <span className="block text-muted-foreground">{label}:</span>
      <span className="font-medium">{value}</span>
    </p>
  );
}
