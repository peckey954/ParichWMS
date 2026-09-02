"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ChevronDownIcon, FileTextIcon } from "lucide-react";
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
import { cn } from "@peckey954/ui/lib/utils";
import { applyRoundEdits, useAddedRounds } from "@/components/po/added-rounds-provider";
import {
  formatPoQty,
  getPoLineItem,
  PO_ROUND_STATUS_LABEL,
  type PoRoundStatus,
} from "@/lib/po";
import { PR_CATEGORY_LABEL } from "@/lib/pr";

/* ------------------------------------------------------------------
   ใบรับเข้าวัตถุดิบ — รายละเอียดรอบรับเข้าหนึ่งรอบ ดูอย่างเดียว (ไม่มีแก้ไข
   ที่นี่ — แก้ไขได้เฉพาะรอบสถานะ "รอรถขนส่ง" ที่หน้าฟอร์ม
   app/po/[id]/receive/[itemId]/add/page.tsx เท่านั้น) เข้ามาจากกดแถวสถานะ
   "รอตรวจสอบ QC" / "สินค้าเข้าคลังแล้ว" / "ส่งคืน" ในตาราง "รอบการรับสินค้า"
   ของหน้าใบสั่งซื้อ (ดู roundHref ใน app/po/[id]/page.tsx)

   สามแท็บย่อยตามขั้นตอนจริงของงานรับเข้า:
     "ข้อมูลรับเข้าคลัง"  สรุปยอดรับเข้า/ไม่ผ่าน/เข้าคลังของรอบนี้
     "ข้อมูลชั่งน้ำหนัก"   น้ำหนักจริง/ตามผู้ขาย/ส่วนต่าง + เอกสารชั่ง/ทะเบียนรถ
     "QC ตรวจสอบ"        ผลตรวจ — รอบที่ยังไม่ตรวจ (waitingQc) ยังไม่มีผลให้ดู
                          ข้อมูลชั่งน้ำหนักยังเห็นครบตามปกติ มีแค่แท็บนี้ที่ว่าง

   รอบสถานะ "รอรถขนส่ง" ไม่มีทางมาถึงหน้านี้เลย (roundHref พาไปหน้าแก้ไขแทน)
   จึงมีข้อมูลชั่ง/ผู้รับ/ผู้ชั่งครบเสมอที่นี่ — ไม่ต้องกันเคส undefined ของ
   ฟิลด์กลุ่มนั้น

   ไม่มี backend จริงตามธรรมชาติของแอปนี้ — เอกสารในการ์ดเป็นของตัวอย่างเฉยๆ
   กดไม่ได้ (ไม่มีไฟล์จริงให้เปิด)
------------------------------------------------------------------ */

// เขียนคลาสเต็มทุกตัว ห้ามประกอบชื่อด้วย template string
const ROUND_STATUS_CHIP: Record<PoRoundStatus, string> = {
  waitingTruck: "[--bdg-surface:var(--chip-yellow)] [--bdg-text:var(--chip-yellow-foreground)]",
  waitingQc: "[--bdg-surface:var(--chip-orange)] [--bdg-text:var(--chip-orange-foreground)]",
  stocked: "[--bdg-surface:var(--chip-green)] [--bdg-text:var(--chip-green-foreground)]",
  returned: "[--bdg-surface:var(--chip-red)] [--bdg-text:var(--chip-red-foreground)]",
};

function RoundStatusChip({ status }: { status: PoRoundStatus }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full border border-transparent px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap bg-(--bdg-surface) text-(--bdg-text)",
        ROUND_STATUS_CHIP[status]
      )}
    >
      {PO_ROUND_STATUS_LABEL[status]}
    </span>
  );
}

type SubTab = "receiving" | "weighing" | "qc";

const SUB_TABS: { id: SubTab; label: string }[] = [
  { id: "receiving", label: "ข้อมูลรับเข้าคลัง" },
  { id: "weighing", label: "ข้อมูลชั่งน้ำหนัก" },
  { id: "qc", label: "QC ตรวจสอบ" },
];

export default function PoRoundDetailPage() {
  const params = useParams<{ id: string; itemId: string; roundId: string }>();
  const { entries, patches, deletedIds } = useAddedRounds();
  const [subTab, setSubTab] = React.useState<SubTab>("receiving");

  const found = React.useMemo(
    () => getPoLineItem(params.id, params.itemId),
    [params.id, params.itemId]
  );

  // หารอบทั้งจากข้อมูลตัวอย่าง (item.rounds) และรอบที่เพิ่งเพิ่มระหว่างเซสชันนี้
  // (entries) แล้วผสาน patch/เช็คว่าถูกลบไปหรือยังด้วย applyRoundEdits ตัวเดียว
  // กับทุกจุดที่อ่านรอบ กันเห็นข้อมูลไม่ตรงกัน
  const round = React.useMemo(() => {
    if (!found) return null;
    const candidate =
      found.item.rounds.find((r) => r.id === params.roundId) ??
      entries.find((e) => e.round.id === params.roundId)?.round;
    if (!candidate) return null;
    return applyRoundEdits(candidate, patches, deletedIds);
  }, [found, entries, patches, deletedIds, params.roundId]);

  if (!found || !round) {
    return (
      <main className="mx-auto w-full max-w-4xl px-4 pt-6 pb-24 sm:px-6">
        <Crumbs poId={params.id} />
        <div className="mt-10 rounded-xl border border-dashed border-border px-6 py-14 text-center">
          <p className="font-medium">ไม่พบรอบรับเข้านี้</p>
          <p className="mt-1 text-sm text-muted-foreground">เอกสารอาจถูกลบหรือลิงก์ไม่ถูกต้อง</p>
          <Button asChild variant="outline-primary" className="mt-4">
            <Link href={`/po/${params.id}`}>กลับไปหน้าใบสั่งซื้อ</Link>
          </Button>
        </div>
      </main>
    );
  }

  const { po, item } = found;
  const diffTon =
    round.receivedTon != null && round.sellerWeightTon != null
      ? round.receivedTon - round.sellerWeightTon
      : undefined;
  const diffPercent =
    diffTon != null && round.sellerWeightTon
      ? (diffTon / round.sellerWeightTon) * 100
      : undefined;

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col">
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 pt-6 pb-6 sm:px-6">
        <Crumbs poId={po.id} code={round.code} />

        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          ใบรับเข้าวัตถุดิบ {po.code}
        </h1>
        <p className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          {po.createdAt}
          <RoundStatusChip status={round.status} />
        </p>

        {/* ---------- หัวรายการ — ตัวเลขหลัก (รับเข้า/ไม่ผ่าน/เข้าคลัง) เห็น
            ตลอดไม่ว่าจะหุบหรือกาง ส่วนผู้รับ/ผู้ชั่งเป็นข้อมูลอ้างอิงเพิ่มเติม
            หุบไว้เป็นค่าเริ่มต้น (แบบเดียวกับหน้าใบอนุมัติ) ---------- */}
        <Collapsible className="mt-5 rounded-xl border border-border bg-card">
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="group flex w-full items-start justify-between gap-3 px-4 py-3.5 text-left"
            >
              <div className="min-w-0 flex-1 @lg:flex @lg:items-center @lg:gap-3">
                <span className="block font-semibold">
                  {item.productName}
                  {item.productSub && ` ${item.productSub}`}
                </span>
                <span className="mt-0.5 block text-sm text-muted-foreground @lg:mt-0">
                  {PR_CATEGORY_LABEL[item.categoryId]} | {item.group}
                  {item.packing && ` | ${item.packing}`}
                </span>
              </div>
              <span className="flex shrink-0 items-center gap-2">
                <span className="hidden text-sm font-medium @sm:inline">{po.company}</span>
                <ChevronDownIcon className="size-5 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
              </span>
            </button>
          </CollapsibleTrigger>

          <div className="px-4 pb-4">
            <div className="grid gap-4 rounded-lg bg-brand p-4 @sm:grid-cols-3">
              <Stat label="รับเข้า (ตัน)" value={formatPoQty(round.receivedTon ?? 0)} />
              <Stat
                label="ไม่ผ่าน (ตัน)"
                value={round.failedTon != null ? `- ${formatPoQty(round.failedTon)}` : "-"}
                danger={round.failedTon != null && round.failedTon > 0}
              />
              <Stat
                label="เข้าคลัง (ตัน)"
                value={round.stockedTon != null ? formatPoQty(round.stockedTon) : "-"}
              />
            </div>
          </div>

          <CollapsibleContent className="px-4 pb-4">
            <div className="grid grid-cols-2 gap-4 text-sm @lg:grid-cols-4">
              <MetaField label="ผู้รับสินค้า" value={round.receiver ?? "-"} />
              <MetaField label="ผู้แก้ไขรับสินค้าล่าสุด" value={round.receiverEditedBy ?? "-"} />
              <MetaField label="ผู้ชั่งสินค้า" value={round.weigher ?? "-"} />
              <MetaField label="ผู้แก้ไขชั่งสินค้าล่าสุด" value={round.weigherEditedBy ?? "-"} />
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* ---------- แท็บย่อย ---------- */}
        <div className="mt-5 flex items-center gap-2 overflow-x-auto">
          {SUB_TABS.map((t) => {
            const active = subTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setSubTab(t.id)}
                className={cn(
                  "shrink-0 rounded-full border px-3 py-1 text-sm whitespace-nowrap transition-colors",
                  active
                    ? "border-primary bg-brand font-medium text-primary"
                    : "border-border text-foreground hover:bg-accent-hover"
                )}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {subTab === "receiving" && (
          <div className="mt-5 rounded-xl border border-border bg-card p-4">
            <div className="grid grid-cols-2 gap-4 text-sm @lg:grid-cols-4">
              <MetaField label="ทะเบียนรถ" value={round.plate} />
              <MetaField label="เบอร์ตู้คอนเทนเนอร์" value={round.containerNo ?? "-"} />
              <MetaField label="วันที่รถเข้า" value={round.arriveDate} />
              <MetaField label="เลขที่ ID ล็อต" value={round.batchId ?? "-"} />
            </div>
            <p className="mt-4 text-sm text-muted-foreground">หมายเหตุ</p>
            <p className="mt-0.5 text-sm font-medium">{round.note ?? "-"}</p>
          </div>
        )}

        {subTab === "weighing" && (
          <div className="mt-5 space-y-6">
            <div>
              <h2 className="font-semibold">1. ข้อมูลสินค้า</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                ข้อมูลสินค้า น้ำหนัก และเอกสารการชั่งน้ำหนักของพาริชและผู้ขาย
              </p>

              <div className="mt-3 grid gap-4 rounded-lg bg-brand p-4 @sm:grid-cols-3">
                <Stat label="น้ำหนักจริง (ตัน)" value={formatPoQty(round.receivedTon ?? 0)} />
                <Stat
                  label="น้ำหนักตามผู้ขาย (ตัน)"
                  value={round.sellerWeightTon != null ? formatPoQty(round.sellerWeightTon) : "-"}
                />
                <div>
                  <p className="text-sm text-muted-foreground">ส่วนต่าง (ตัน)</p>
                  {diffTon != null ? (
                    <p className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                      <span
                        className={cn(
                          "font-semibold tabular-nums",
                          diffTon < 0 && "text-danger-strong"
                        )}
                      >
                        {diffTon > 0 ? "+" : ""}
                        {formatPoQty(diffTon)}
                      </span>
                      {diffPercent != null && diffPercent !== 0 && (
                        <span
                          className={cn(
                            "text-sm font-medium",
                            diffTon < 0 ? "text-danger-strong" : "text-muted-foreground"
                          )}
                        >
                          {diffTon < 0 ? "สูญหาย" : "ได้เพิ่ม"} {Math.abs(diffPercent).toFixed(2)}%
                        </span>
                      )}
                    </p>
                  ) : (
                    <p className="mt-1 font-semibold">-</p>
                  )}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4 text-sm @sm:grid-cols-3">
                <div>
                  <p className="text-muted-foreground">ชั่งเข้ารถพร้อมสินค้า (กก.)</p>
                  <p className="mt-0.5 font-medium">
                    {round.grossKg != null ? formatPoQty(round.grossKg) : "-"}
                    {round.grossAt && (
                      <span className="ml-1.5 font-normal text-muted-foreground">
                        {round.grossAt}
                      </span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">ชั่งออกรถเปล่า (กก.)</p>
                  <p className="mt-0.5 font-medium">
                    {round.tareKg != null ? formatPoQty(round.tareKg) : "-"}
                    {round.tareAt && (
                      <span className="ml-1.5 font-normal text-muted-foreground">
                        {round.tareAt}
                      </span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">หมายเหตุ</p>
                  <p className="mt-0.5 font-medium">{round.weighNote ?? "-"}</p>
                </div>
              </div>

              <div className="mt-4">
                <p className="text-sm font-medium">เอกสารชั่งน้ำหนักของพาริช</p>
                <div className="mt-2">
                  <DocPlaceholderCard />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm font-medium">เอกสารชั่งน้ำหนักของผู้ขาย</p>
                <div className="mt-2">
                  <DocPlaceholderCard />
                </div>
              </div>
            </div>

            <div>
              <h2 className="font-semibold">2. ข้อมูลทะเบียนรถ</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                ข้อมูลทะเบียนรถ และสำเนาบัตรประชาชนคนขับรถ
              </p>

              <div className="mt-3">
                <p className="text-sm text-muted-foreground">ทะเบียนรถ</p>
                <p className="mt-0.5 font-medium">{round.plate}</p>
              </div>
              <div className="mt-4">
                <p className="text-sm font-medium">เอกสารสำเนาบัตรประชาชนคนขับ</p>
                <div className="mt-2">
                  <DocPlaceholderCard />
                </div>
              </div>
            </div>
          </div>
        )}

        {subTab === "qc" && (
          <div className="mt-5 rounded-xl border border-border bg-card p-4">
            {round.status === "waitingQc" ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                ยังไม่มีผลตรวจสอบ QC — รอตรวจสอบอยู่
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-4 text-sm @lg:grid-cols-4">
                <MetaField label="ผลตรวจสอบ QC" value={round.qcResult ?? "-"} />
                <MetaField
                  label="ไม่ผ่าน (ตัน)"
                  value={round.failedTon != null ? formatPoQty(round.failedTon) : "-"}
                />
                <MetaField
                  label="เข้าคลัง (ตัน)"
                  value={round.stockedTon != null ? formatPoQty(round.stockedTon) : "-"}
                />
              </div>
            )}
          </div>
        )}
      </main>

      {/* ---------- แถบปุ่มล่าง — ดูอย่างเดียว มีแค่ปุ่มย้อนกลับ ไม่มีแก้ไข ---------- */}
      <div className="sticky bottom-0 z-30 border-t border-border bg-surface">
        <div className="mx-auto flex w-full max-w-4xl items-center px-8 py-3">
          <BackButton />
        </div>
      </div>
    </div>
  );
}

function BackButton() {
  const router = useRouter();
  return (
    <Button variant="outline-primary" onClick={() => router.back()}>
      ย้อนกลับ
    </Button>
  );
}

function Crumbs({ poId, code }: { poId?: string; code?: string }) {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/">ระบบ</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink href="/po">สั่งซื้อ PO</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        {poId ? (
          <>
            <BreadcrumbItem>
              <BreadcrumbLink href={`/po/${poId}`}>ใบสั่งซื้อ</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-primary">
                รอบการรับเข้า{code ? ` ${code}` : ""}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </>
        ) : (
          <BreadcrumbItem>
            <BreadcrumbPage className="text-primary">รอบการรับเข้า</BreadcrumbPage>
          </BreadcrumbItem>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

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
      <p className={cn("mt-1 font-semibold tabular-nums", danger && "text-danger-strong")}>
        {value}
      </p>
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

/** เอกสารตัวอย่าง — ไม่มีไฟล์จริง กดไม่ได้ (แอปนี้ไม่มี backend ให้อัปโหลดจริง)
    ขนาด 96px เท่ากับการ์ดเอกสารที่อื่นในแอป (components/file-upload.tsx) */
function DocPlaceholderCard() {
  return (
    <div className="flex size-24 flex-col items-center justify-center gap-1 rounded-lg border border-border bg-card px-1.5 text-center">
      <FileTextIcon className="size-6 text-primary" strokeWidth={1.5} />
      <span className="line-clamp-2 text-[11px] leading-tight font-medium">
        เอกสารการชั่ง No.12X4534567890...
      </span>
      <span className="text-[11px] leading-tight text-muted-foreground">6.6MB</span>
    </div>
  );
}
