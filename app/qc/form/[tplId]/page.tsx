"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
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
import { toast } from "sonner";
import { ChipGroup } from "@/components/chip-group";
import { TemplateForm } from "@/components/qc/template-form";
import { shiftLabel, templateOf, type QcShift } from "@/lib/qc-erp";

/* ------------------------------------------------------------------
   ใบตรวจของรายงานที่ไม่มีหน้าของตัวเอง — กดการ์ดจากหน้าหลักแล้วมาที่นี่

   ไม่มีอะไรตั้งไว้ในหน้านี้ ทุกช่องมาจากรายงาน แก้รายงานในหน้าตั้งค่าแล้ว
   ใบนี้เปลี่ยนตาม ตั้งรายงานใหม่เสร็จก็มีใบให้ทำทันทีโดยไม่ต้องรอใครทำหน้าให้

   รายงานที่เปิดใบตามรอบเวลา เลือกรอบก่อน — ตั้งต้นที่รอบที่กำลังเดินอยู่
   ไม่มีหลังบ้าน กดบันทึกแล้วไม่ได้เก็บจริง
------------------------------------------------------------------ */

/** รอบที่เวลาตอนนี้ตกอยู่ — ไม่มีรอบไหนครอบ ใช้รอบถัดไป */
function currentShift(slots: QcShift[], now: string): QcShift | undefined {
  const inside = (s: QcShift) =>
    s.to > s.from ? now >= s.from && now < s.to : now >= s.from || now < s.to;
  return (
    slots.find(inside) ??
    [...slots].sort((a, b) => a.from.localeCompare(b.from)).find((s) => s.from > now) ??
    slots[0]
  );
}

export default function TemplateFormPage() {
  const router = useRouter();
  const { tplId } = useParams<{ tplId: string }>();
  const tpl = templateOf(tplId);
  const slots = tpl?.schedule.recurring ? tpl.schedule.slots : [];
  const [slot, setSlot] = React.useState<string>(() => {
    const d = new Date();
    const now = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    return currentShift(slots, now)?.id ?? "";
  });

  if (!tpl) {
    return (
      <main className="mx-auto w-full max-w-lg px-4 py-20 text-center">
        <p className="font-medium">ไม่พบรายงานนี้</p>
        <Button asChild variant="outline-primary" className="mt-4">
          <Link href="/">กลับหน้าหลัก</Link>
        </Button>
      </main>
    );
  }

  const d = new Date();
  const docNo = `QC${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}/01`;

  return (
    <main className="@container mx-auto w-full max-w-6xl px-4 pt-6 sm:px-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">หน้าหลัก</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="text-primary">{tpl.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* บอกว่าใบนี้เดินตามรายงานไหน หัวข้อเปลี่ยนแล้วจะได้รู้ว่าไปแก้ที่ไหน */}
      <p className="mt-2 text-sm text-muted-foreground">
        {tpl.code} · เดินตามรายงาน{" "}
        <Link
          href={`/qc/setup-erp/${tpl.id}`}
          className="text-primary underline underline-offset-2"
        >
          {tpl.name}
        </Link>
      </p>

      <div className="mt-5">
        <TemplateForm
          key={tpl.id}
          tpl={tpl}
          title={`ใบ${tpl.name} ${docNo}`}
          before={
            slots.length > 0 && (
              <div className="mt-4 space-y-1.5">
                <Label>รอบเวลา</Label>
                <ChipGroup
                  label="รอบเวลา"
                  value={slot}
                  onChange={setSlot}
                  options={slots.map((s, i) => ({
                    id: s.id,
                    label: `ช่วงที่ ${i + 1} · ${shiftLabel(s)}`,
                  }))}
                />
              </div>
            )
          }
          onBack={() => router.back()}
          onSubmit={() => {
            const s = slots.find((x) => x.id === slot);
            toast.success(`บันทึก${tpl.name}แล้ว`, {
              description: `${docNo}${s ? ` · รอบ ${shiftLabel(s)}` : ""} — ตัวอย่าง ยังไม่ได้ต่อหลังบ้าน`,
            });
            router.push("/");
          }}
        />
      </div>
    </main>
  );
}
