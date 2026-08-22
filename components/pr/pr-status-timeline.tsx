"use client";

import * as React from "react";
import {
  CircleXIcon,
  PackageCheckIcon,
  PackagePlusIcon,
  ShoppingCartIcon,
  SquareCheckBigIcon,
} from "lucide-react";
import { cn } from "@peckey954/ui/lib/utils";
import {
  PR_TIMELINE_DONE_LABEL,
  PR_TIMELINE_PENDING_LABEL,
  type PrDoc,
  type PrTimelineStepId,
} from "@/lib/pr";

/* ------------------------------------------------------------------
   เส้นทางสถานะ — เรียงจากปลายทาง (บนสุด) ไปต้นทาง (ล่างสุด) ตรงข้ามกับ
   ลำดับเวลาจริง เพราะสิ่งที่คนเปิดหน้านี้อยากรู้ก่อนคือ "ตอนนี้ไปถึงไหนแล้ว
   เหลืออีกกี่ขั้นถึงจะจบ" ขั้นที่ยังไปไม่ถึงจึงลอยอยู่บนสุดให้เห็นเป้าหมาย
   ขั้นที่ผ่านมาแล้วอยู่ล่างสุดให้เห็นจุดเริ่ม

   ถ้ายกเลิก ขั้น "สั่งซื้อ" จะถูกแทนที่ด้วยขั้น "ยกเลิก" เสมอ เพราะยกเลิกได้
   เฉพาะตอนยังไม่สั่งซื้อ (ดูกฎเดียวกันใน lib/pr.ts buildTimeline)
------------------------------------------------------------------ */

const STEP_ORDER: PrTimelineStepId[] = ["stocked", "partial", "ordered", "sent"];

const STAGE_ICON: Record<PrTimelineStepId, typeof PackageCheckIcon> = {
  stocked: PackageCheckIcon,
  partial: PackagePlusIcon,
  ordered: ShoppingCartIcon,
  sent: SquareCheckBigIcon,
};

// สีชิปเดียวกับที่ใช้ในตารางรายการ — เขียนตรงๆ ไม่ประกอบด้วย template string
// เพราะ Tailwind อ่านซอร์สเป็นข้อความตรงๆ ประกอบเอาตอนรันแล้ว utility จะไม่ถูกสร้าง
const STAGE_CHIP: Record<PrTimelineStepId, string> = {
  stocked: "bg-[var(--chip-green)] text-[var(--chip-green-foreground)]",
  partial: "bg-[var(--chip-lime)] text-[var(--chip-lime-foreground)]",
  ordered: "bg-[var(--chip-orange)] text-[var(--chip-orange-foreground)]",
  sent: "bg-[var(--chip-yellow)] text-[var(--chip-yellow-foreground)]",
};

export function PrStatusTimeline({ doc }: { doc: PrDoc }) {
  const byStep = new Map(doc.timeline.map((e) => [e.step, e] as const));
  const showCancelled = doc.status === "cancelled";

  const rows: PrTimelineStepId[] = showCancelled
    ? STEP_ORDER.filter((s) => s !== "ordered")
    : STEP_ORDER;

  return (
    <ol>
      {rows.map((step, i) => {
        const isLast = i === rows.length - 1;
        // ยกเลิกแทรกแทนตำแหน่งขั้น "สั่งซื้อ" เสมอ — วาดต่อจาก "ทยอยรับสินค้า"
        const showCancelHere = showCancelled && step === "partial";

        return (
          <li key={step} className="contents">
            <StepRow
              icon={STAGE_ICON[step]}
              chipClass={STAGE_CHIP[step]}
              label={
                byStep.has(step)
                  ? PR_TIMELINE_DONE_LABEL[step]
                  : PR_TIMELINE_PENDING_LABEL[step]
              }
              entry={byStep.get(step)}
              isLast={isLast && !showCancelHere}
            />
            {showCancelHere && (
              <StepRow
                icon={CircleXIcon}
                chipClass="bg-[var(--chip-red)] text-[var(--chip-red-foreground)]"
                label="ยกเลิก"
                labelClassName="text-destructive"
                detail={
                  <>
                    <DetailLine actor={doc.cancelActor} at={doc.cancelAt} department={PURCHASE_DEPT_LABEL} />
                    {doc.cancelReason && (
                      <p className="text-sm text-muted-foreground">
                        เหตุผล:{" "}
                        <span className="font-medium text-foreground">{doc.cancelReason}</span>
                      </p>
                    )}
                  </>
                }
                isLast={isLast}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

// ยกเลิกเกิดขึ้นได้เฉพาะตอนยังไม่สั่งซื้อ ซึ่งเป็นงานฝั่งจัดซื้อเสมอ
const PURCHASE_DEPT_LABEL = "จัดซื้อ";

function DetailLine({
  actor,
  at,
  department,
}: {
  actor?: string;
  at?: string;
  department: string;
}) {
  return (
    <p className="text-sm text-muted-foreground">
      โดย: <span className="font-medium text-foreground">{actor}</span>
      {" | "}
      {at}
      {"  "}
      หน่วยงาน: <span className="font-medium text-foreground">{department}</span>
    </p>
  );
}

function StepRow({
  icon: Icon,
  chipClass,
  label,
  labelClassName,
  entry,
  detail,
  isLast,
}: {
  icon: typeof PackageCheckIcon;
  chipClass: string;
  label: string;
  labelClassName?: string;
  entry?: { actor: string; at: string; department: string };
  detail?: React.ReactNode;
  isLast: boolean;
}) {
  const reached = Boolean(entry) || Boolean(detail);
  return (
    <div className={cn("relative flex gap-3", isLast ? "pb-0" : "pb-6")}>
      {!isLast && (
        <span className="absolute top-8 bottom-0 left-4 w-px bg-border" aria-hidden />
      )}
      <span
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-full",
          reached ? chipClass : "bg-muted text-muted-foreground"
        )}
      >
        <Icon className="size-4" />
      </span>
      <div className="pt-1">
        <p
          className={cn(
            "font-semibold",
            !reached && "font-normal text-muted-foreground",
            labelClassName
          )}
        >
          {label}
        </p>
        {entry && (
          <DetailLine actor={entry.actor} at={entry.at} department={entry.department} />
        )}
        {detail}
      </div>
    </div>
  );
}
