"use client";

import * as React from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@peckey954/ui/components/ui/breadcrumb";
import { Button } from "@peckey954/ui/components/ui/button";
import { Label } from "@peckey954/ui/components/ui/label";
import { MinusIcon, PlusIcon } from "lucide-react";
import { cn } from "@peckey954/ui/lib/utils";
import type { ReceivingDoc } from "@/lib/goods-receiving";

/* ชิ้นส่วนที่หน้ารับเข้าสินค้าใช้ร่วมกัน — ใบ เพิ่ม/แก้สลิง และดูสลิง */

export function Crumbs({ trail }: { trail: { label: string; href?: string }[] }) {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/">หน้าหลัก</BreadcrumbLink>
        </BreadcrumbItem>
        {trail.map((t, i) => (
          <React.Fragment key={t.label}>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              {i === trail.length - 1 || !t.href ? (
                <BreadcrumbPage className="text-primary">{t.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink href={t.href}>{t.label}</BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

/** สินค้า | ประเภท | หมวด | บรรจุภัณฑ์ — บรรทัดหัวที่ทุกหน้าของใบนี้ขึ้นเหมือนกัน */
export function ProductLine({ doc, className }: { doc: ReceivingDoc; className?: string }) {
  return (
    <span className={cn("flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1", className)}>
      <span className="font-semibold">{doc.productName}</span>
      {[doc.productType, doc.group, doc.packing].map((t, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span className="h-4 w-px bg-border" aria-hidden />}
          <span className="text-sm">{t}</span>
        </React.Fragment>
      ))}
    </span>
  );
}

/** แถบสินค้าสีส้มอ่อนเหนือฟอร์มเพิ่ม/แก้สลิง */
export function ProductStrip({ doc }: { doc: ReceivingDoc }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-hover bg-brand px-4 py-4">
      <ProductLine doc={doc} />
      <span className="text-sm font-semibold">{doc.supplier}</span>
    </div>
  );
}

export function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-sm font-semibold tabular-nums">{value}</p>
    </div>
  );
}

export function Meta({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold">{value || "-"}</p>
    </div>
  );
}

/** ช่องตัวเลขมีปุ่มลบ/บวก — หน้างานกดเพิ่มทีละขั้นได้ด้วยนิ้ว */
export function StepperField({
  id,
  label,
  value,
  onChange,
  step,
  decimals,
  error,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  step: number;
  decimals: number;
  error?: string;
}) {
  const bump = (d: number) => {
    const n = Math.max(0, Number(value || 0) + d);
    onChange(n.toFixed(decimals));
  };
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className={cn(error && "text-danger-strong")}>
        {label}
      </Label>
      <div
        className={cn(
          "flex h-9 items-center rounded-md border bg-card shadow-xs focus-within:ring-[3px] focus-within:ring-ring/50",
          error ? "border-danger-strong" : "border-input focus-within:border-ring"
        )}
      >
        <Button type="button" variant="ghost" size="icon-sm" aria-label="ลด" className="ml-1" onClick={() => bump(-step)}>
          <MinusIcon />
        </Button>
        <input
          id={id}
          inputMode={decimals > 0 ? "decimal" : "numeric"}
          className="h-full min-w-0 flex-1 bg-transparent text-center text-sm tabular-nums outline-none"
          placeholder={(0).toFixed(decimals)}
          value={value}
          onChange={(e) =>
            onChange(e.target.value.replace(decimals > 0 ? /[^\d.]/g : /\D/g, ""))
          }
        />
        <Button type="button" variant="ghost" size="icon-sm" aria-label="เพิ่ม" className="mr-1" onClick={() => bump(step)}>
          <PlusIcon />
        </Button>
      </div>
      {error && <p className="text-sm text-danger-strong">{error}</p>}
    </div>
  );
}

/** แถบปุ่มล่างติดขอบจอ — ย้อนกลับซ้าย ปุ่มทำงานขวา */
export function FooterBar({ left, right }: { left: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="sticky bottom-0 z-30 border-t border-border bg-surface">
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        {left}
        {right && <div className="flex flex-wrap items-center gap-2">{right}</div>}
      </div>
    </div>
  );
}
