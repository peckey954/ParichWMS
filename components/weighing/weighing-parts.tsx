"use client";

import * as React from "react";
import { ChevronDownIcon } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@peckey954/ui/components/ui/collapsible";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@peckey954/ui/components/ui/breadcrumb";
import Link from "next/link";
import { cn } from "@peckey954/ui/lib/utils";
import { HomeCrumb } from "@/components/home-crumb";
import { type DocFile } from "@/components/file-upload";
import {
  DIFF_LABEL,
  formatTon,
  weighingDiff,
  type WeighingDoc,
  type WeighingFileRef,
} from "@/lib/weighing";

/* ------------------------------------------------------------------
   ชิ้นส่วนร่วมของหน้าใบชั่งน้ำหนัก — ใช้ทั้งตอนกรอก (ฟอร์ม) และตอนดู
------------------------------------------------------------------ */

export function WeighingCrumbs() {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <HomeCrumb />
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/weighing">ชั่งน้ำหนัก</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage className="text-primary">ใบชั่งน้ำหนัก</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

/** หัวข้อใหญ่ของแต่ละก้อน — เลขนำหน้า + ชื่อหัวข้อ + คำอธิบายสั้นใต้ชื่อ */
export function SectionHeading({
  index,
  title,
  subtitle,
  className,
}: {
  index: number;
  title: string;
  subtitle: string;
  className?: string;
}) {
  return (
    <div className={cn("mt-6", className)}>
      <h2 className="text-base font-semibold">
        {index}. {title}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
    </div>
  );
}

export function MetaField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium break-words">{value}</p>
    </div>
  );
}

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <div className="mt-1 font-semibold tabular-nums">{children}</div>
    </div>
  );
}

const tonOrDash = (v: number | null | undefined) => (v ? formatTon(v) : "-");

/** ส่วนต่าง (ตัน) — แดง + ชิป "สูญหาย x%" เมื่อได้น้อยกว่าใบผู้ขาย เขียว + "ของแถม" เมื่อได้มากกว่า */
function DiffValue({ netTon, sellerTon }: { netTon: number; sellerTon: number }) {
  if (!netTon || !sellerTon) return <>-</>;
  const { diffTon, kind, percent } = weighingDiff(netTon, sellerTon);
  if (kind === "even") return <>{formatTon(0)}</>;
  const loss = kind === "loss";
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <span className={loss ? "text-danger-strong" : "text-success-strong"}>
        {formatTon(diffTon)}
      </span>
      <span
        className={cn(
          "rounded-full px-2 py-0.5 text-xs font-medium",
          loss
            ? "bg-[var(--chip-red)] text-[var(--chip-red-foreground)]"
            : "bg-[var(--chip-green)] text-[var(--chip-green-foreground)]"
        )}
      >
        {DIFF_LABEL[kind]}
        {loss && ` ${percent.toFixed(2)}%`}
      </span>
    </span>
  );
}

/**
 * การ์ดหัวใบ — สินค้า/บริษัท + กล่องส้มตัวเลขหลัก + ข้อมูลรถ/ผู้เกี่ยวข้อง
 *
 * ตัวเลขในกล่องส้มรับมาจากหน้าที่เรียก (ฟอร์มส่งค่าที่กำลังกรอกสดๆ หน้าดูส่ง
 * ค่าที่บันทึกแล้ว) รับเข้าหุบ/กางได้ ข้อมูลใบสั่งซื้อซ่อนไว้ตอนหุบ
 * จ่ายออกมีข้อมูลน้อย แสดงครบเลยไม่ต้องหุบ
 */
export function WeighingHeader({
  doc,
  netTon,
  sellerTon,
  netLabel = "น้ำหนักสินค้า (ตัน)",
}: {
  doc: WeighingDoc;
  netTon: number;
  sellerTon: number;
  netLabel?: string;
}) {
  const inbound = doc.kind === "inbound";
  const remaining = netTon > 0 ? Math.max(0, doc.orderTon - netTon) : null;

  const title = (
    <div className="min-w-0 flex-1 @lg:flex @lg:items-center @lg:justify-between @lg:gap-3">
      <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="font-semibold">
          {doc.productName}
          {doc.productSub && ` ${doc.productSub}`}
        </span>
        <span className="text-sm text-muted-foreground">
          {[doc.category, doc.group, doc.packing].filter(Boolean).join(" | ")}
        </span>
      </p>
      <p className="mt-0.5 text-sm font-medium @lg:mt-0 @lg:text-right">บริษัท {doc.supplier}</p>
    </div>
  );

  if (!inbound) {
    return (
      <section className="mt-5 rounded-xl border border-border bg-card p-4">
        {title}
        <div className="mt-3 grid grid-cols-2 gap-4 rounded-lg bg-brand p-4">
          <Stat label="เบิกจ่าย (ตัน)">{tonOrDash(doc.orderTon)}</Stat>
          <Stat label={netLabel}>{tonOrDash(netTon)}</Stat>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 @2xl:grid-cols-4">
          <MetaField label="ทะเบียนรถ" value={doc.plate} />
          <MetaField label="วันที่รถจะเข้า" value={doc.arriveDate} />
          <MetaField label="ผู้ทำใบสั่งจ่าย" value={doc.maker} />
          <MetaField label="ผู้แก้ไขสั่งจ่ายล่าสุด" value={doc.makerEditor ?? "-"} />
        </div>
      </section>
    );
  }

  return (
    <Collapsible className="mt-5 rounded-xl border border-border bg-card">
      <CollapsibleTrigger asChild>
        <button type="button" className="group flex w-full items-start gap-3 px-4 pt-4 text-left">
          {title}
          <ChevronDownIcon className="mt-0.5 size-5 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
        </button>
      </CollapsibleTrigger>

      <div className="px-4 pb-4">
        <div className="mt-3 grid grid-cols-2 gap-4 rounded-lg bg-brand p-4 @2xl:grid-cols-4">
          <Stat label="สั่งซื้อ (ตัน)">{tonOrDash(doc.orderTon)}</Stat>
          <Stat label={netLabel}>{tonOrDash(netTon)}</Stat>
          <Stat label="น้ำหนักตามผู้ขาย (ตัน)">{tonOrDash(sellerTon)}</Stat>
          <Stat label="ส่วนต่าง (ตัน)">
            <DiffValue netTon={netTon} sellerTon={sellerTon} />
          </Stat>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 @2xl:grid-cols-4">
          <MetaField label="ทะเบียนรถ" value={doc.plate} />
          <MetaField label="วันที่รถจะเข้า" value={doc.arriveDate} />
          <MetaField label="รอรับเข้า (ตัน)" value={tonOrDash(remaining)} />
          <MetaField label="หมายเหตุจากผู้สั่งซื้อ" value={doc.buyerNote ?? "-"} />
        </div>
        <CollapsibleContent>
          <div className="mt-4 grid grid-cols-2 gap-4 @2xl:grid-cols-4">
            <MetaField label="ผู้ทำใบสั่งซื้อ" value={doc.maker} />
            <MetaField label="ผู้แก้ไขสั่งซื้อล่าสุด" value={doc.makerEditor ?? "-"} />
            <MetaField label="เหตุผลการซื้อ" value={doc.reason ?? "-"} />
            <MetaField
              label="ช่วงวันที่รถส่งสินค้า"
              value={`${doc.deliveryFrom ?? "-"} - ${doc.deliveryTo ?? "ยังไม่ระบุ"}`}
            />
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

/** ไฟล์ที่บันทึกไว้ → DocFile (สถานะขึ้นครบแล้ว) ให้การ์ด/ตัวอ่านไฟล์ใช้ได้เลย */
export const toDocFiles = (refs: WeighingFileRef[] = []): DocFile[] =>
  refs.map((r) => ({ ...r, status: "done", progress: 100 }));

/** DocFile ที่อัปครบแล้ว → ไฟล์ที่เก็บกับใบชั่ง (ที่ยังอัปอยู่/พังไม่เก็บ) */
export const toFileRefs = (files: DocFile[]): WeighingFileRef[] =>
  files.filter((f) => f.status === "done").map(({ id, name, size }) => ({ id, name, size }));

