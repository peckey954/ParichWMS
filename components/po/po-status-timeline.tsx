"use client";

import * as React from "react";
import {
  CircleCheckIcon,
  CircleXIcon,
  PackageCheckIcon,
  PackagePlusIcon,
  TruckIcon,
} from "lucide-react";
import { DetailLine, StepRow } from "@/components/pr/pr-status-timeline";
import { poProgress, type PoDoc } from "@/lib/po";

/* ------------------------------------------------------------------
   ติดตามสถานะใบสั่งซื้อ — เรียงจากปลายทาง (บนสุด) ไปต้นทาง (ล่างสุด)
   แบบเดียวกับหน้าขอซื้อ PR: รับครบแล้ว → ทยอยรับ → รอรับสินค้า → อนุมัติ

   ขั้นอนุมัติเปลี่ยนตามผล (รออนุมัติ เหลือง / อนุมัติ / ไม่อนุมัติ แดง)
   ยกเลิกแทรกเหนือขั้นล่าสุดที่ไปถึง พร้อมผู้ยกเลิกและหมายเหตุ
------------------------------------------------------------------ */

const DEPT = "จัดซื้อ";

const CHIP = {
  green: "bg-[var(--chip-green)] text-[var(--chip-green-foreground)]",
  lime: "bg-[var(--chip-lime)] text-[var(--chip-lime-foreground)]",
  orange: "bg-[var(--chip-orange)] text-[var(--chip-orange-foreground)]",
  yellow: "bg-[var(--chip-yellow)] text-[var(--chip-yellow-foreground)]",
  red: "bg-[var(--chip-red)] text-[var(--chip-red-foreground)]",
};

type Row = {
  key: string;
  icon: typeof PackageCheckIcon;
  chip: string;
  label: string;
  reached: boolean;
  detail?: React.ReactNode;
};

export function PoStatusTimeline({
  doc,
  cancelled,
  cancelReason,
  cancelledBy,
}: {
  doc: PoDoc;
  cancelled: boolean;
  cancelReason?: string;
  cancelledBy?: string;
}) {
  const at = doc.createdAt.replace(" | ", " - ");
  const approved = doc.approval === "approved";
  const progress = poProgress(doc);
  const stamp = (actor?: string) => <DetailLine actor={actor ?? doc.requester} at={at} department={DEPT} />;

  const waitingRow: Row = { key: "waitingApproval", icon: CircleCheckIcon, chip: CHIP.yellow, label: "รออนุมัติ", reached: true, detail: stamp() };
  // ไม่อนุมัติ — ซ้อนเหนือ "รออนุมัติ" พร้อมเหตุผล (ตามแบบ) แก้แล้วบันทึกใบกลับเป็น
  // รออนุมัติ เหลือแถวเดียวเหมือนเริ่มใหม่
  const approvalRows: Row[] =
    doc.approval === "rejected"
      ? [
          {
            key: "approval",
            icon: CircleXIcon,
            chip: CHIP.red,
            label: "ไม่อนุมัติ",
            reached: true,
            detail: (
              <>
                {stamp(doc.approver)}
                {doc.rejectReason && (
                  <p className="text-sm text-muted-foreground">
                    เหตุผล: <span className="font-medium text-foreground">{doc.rejectReason}</span>
                  </p>
                )}
              </>
            ),
          },
          waitingRow,
        ]
      : approved
        ? [{ key: "approval", icon: CircleCheckIcon, chip: CHIP.yellow, label: "อนุมัติ", reached: true, detail: stamp(doc.approver) }]
        : [waitingRow];

  const rows: Row[] = [
    { key: "complete", icon: PackageCheckIcon, chip: CHIP.green, label: "รับสินค้าครบแล้ว", reached: approved && progress === "complete" },
    { key: "partial", icon: PackagePlusIcon, chip: CHIP.lime, label: "ทยอยรับสินค้า", reached: approved && progress !== "notStarted" },
    { key: "waiting", icon: TruckIcon, chip: CHIP.orange, label: "รอรับสินค้า", reached: approved, detail: approved ? stamp() : undefined },
    ...approvalRows,
  ];

  if (cancelled) {
    const firstReached = rows.findIndex((r) => r.reached);
    rows.splice(firstReached, 0, {
      key: "cancelled",
      icon: CircleXIcon,
      chip: CHIP.red,
      label: "ยกเลิก",
      reached: true,
      detail: (
        <>
          {stamp(cancelledBy)}
          {cancelReason && (
            <p className="text-sm text-muted-foreground">
              หมายเหตุ: <span className="font-medium text-foreground">{cancelReason}</span>
            </p>
          )}
        </>
      ),
    });
  }

  return (
    <ol>
      {rows.map((r, i) => (
        <li key={r.key} className="contents">
          <StepRow
            icon={r.icon}
            chipClass={r.chip}
            label={r.label}
            detail={r.reached ? r.detail ?? <span /> : undefined}
            isLast={i === rows.length - 1}
          />
        </li>
      ))}
    </ol>
  );
}
