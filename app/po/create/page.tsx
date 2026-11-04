"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { lineTotalPrice, PoForm, toDraftLine, type PoFormState } from "@/components/po/po-form";
import { formatPoBaht, PO_QUEUE_DOCS } from "@/lib/po";

/* ------------------------------------------------------------------
   สร้างใบสั่งซื้อ — มาจากปุ่ม "สร้างใบสั่งซื้อ" ในแท็บ "ขอซื้อ" เสมอ พาสรหัส
   ใบขอซื้อที่ติ๊กไว้มาทาง query param "ids" (คั่นด้วยจุลภาค) เลือกใบเดียว
   ก็ได้การ์ดสินค้าใบเดียว เลือกหลายใบก็ได้หลายการ์ด — เพิ่ม/ลบการ์ดต่อจากนี้
   ในหน้านี้ได้อีกด้วย แต่ต้องเป็นประเภทสินค้าเดียวกับการ์ดแรกเสมอ (กติกาเดียว
   กับตอนติ๊กเลือกในแท็บขอซื้อ)

   ไม่มี backend จริงตามธรรมชาติของแอปนี้ — กด "บันทึก" แล้วขึ้น toast แล้วพา
   กลับไปแท็บ "สั่งซื้อ" ไม่ได้เขียนใบใหม่ลงในข้อมูลตัวอย่างจริง
   ตัวฟอร์มอยู่ที่ components/po/po-form.tsx (ใช้ร่วมกับหน้าแก้ไขใบสั่งซื้อ)
------------------------------------------------------------------ */

export default function CreatePoPage() {
  return (
    <React.Suspense fallback={null}>
      <CreatePoForm />
    </React.Suspense>
  );
}

function CreatePoForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // ช่องหัวใบ + หมายเหตุ อ่านค่าตั้งต้นจาก query param ด้วย (ไม่ใช่แค่ ids) —
  // เผื่อกรอกไว้แล้วกด "เพิ่มสินค้า" ไปหน้าเลือกใบขอซื้อเพิ่มแล้วย้อนกลับมา
  // ค่าที่กรอกไว้ต้องไม่หายไป (ดู addItemsHref ด้านล่าง ที่พาค่าชุดนี้ไปด้วย)
  const [form, setForm] = React.useState<PoFormState>(() => {
    const ids = new Set((searchParams.get("ids") ?? "").split(",").filter(Boolean));
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    return {
      poType: searchParams.get("poType") === "poi" ? "poi" : "po",
      company: searchParams.get("company") ?? undefined,
      expectedRange: from ? { from: new Date(from), to: to ? new Date(to) : undefined } : undefined,
      lines: PO_QUEUE_DOCS.filter((d) => ids.has(d.id)).map(toDraftLine),
      note: searchParams.get("note") ?? "",
    };
  });

  // ปุ่ม "+ เพิ่มสินค้า" พาไปหน้าเลือกใบขอซื้อเต็มหน้า (คล้ายแท็บ "ขอซื้อ")
  // พาสถานะทั้งหมดของใบร่างนี้ไปทาง query param ด้วย (ไม่ใช่แค่ ids) เพื่อไม่ให้
  // ช่องที่กรอกไว้แล้วหายตอนย้อนกลับมา
  const addItemsHref = React.useMemo(() => {
    const { lines, poType, company, expectedRange, note } = form;
    const sp = new URLSearchParams();
    const ids = lines.map((l) => l.key).join(",");
    if (ids) sp.set("ids", ids);
    sp.set("poType", poType);
    if (company) sp.set("company", company);
    if (expectedRange?.from) sp.set("from", expectedRange.from.toISOString().slice(0, 10));
    if (expectedRange?.to) sp.set("to", expectedRange.to.toISOString().slice(0, 10));
    if (note.trim()) sp.set("note", note);
    return `/po/create/add-items?${sp.toString()}`;
  }, [form]);

  function handleSave() {
    const { company, lines } = form;
    if (!company) {
      toast.error("กรุณาเลือกบริษัทที่ทำการสั่งซื้อ");
      return;
    }
    if (lines.length === 0) {
      toast.error("กรุณาเพิ่มสินค้าอย่างน้อย 1 รายการ");
      return;
    }
    const totalPrice = lines.reduce((sum, l) => sum + lineTotalPrice(l), 0);
    toast.success("สร้างใบสั่งซื้อแล้ว", {
      description: `${company} — ${lines.length} รายการ · ${formatPoBaht(totalPrice)} บาท`,
    });
    // กลับไปแท็บ "ขอซื้อ" (ที่มาของหน้านี้เสมอ) ไม่ใช่แท็บเริ่มต้น — เผื่อทำ
    // รายการสร้างใบสั่งซื้อถัดไปต่อได้เลย
    router.push("/po?tab=queue");
  }

  return (
    <PoForm
      title="สร้างใบสั่งซื้อ"
      value={form}
      onChange={setForm}
      addItemsHref={addItemsHref}
      onSave={handleSave}
    />
  );
}
