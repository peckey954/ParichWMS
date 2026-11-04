"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@peckey954/ui/components/ui/button";
import { formatDateSlash, parseDateSlash } from "@/components/date-select";
import { PoForm, toDraftLine, type DraftLine, type PoFormState } from "@/components/po/po-form";
import { PO_QUEUE_DOCS, type PoDoc, type PoLineItem } from "@/lib/po";
import { clearPoDraft, getPoDraft, savePoEdit, stashPoDraft, usePoOrder } from "@/lib/po-edits";
import { PR_PRODUCTS, PR_REASONS } from "@/lib/pr";

/* ------------------------------------------------------------------
   แก้ไขใบสั่งซื้อ — เข้าจากหน้าใบสั่งซื้อที่ "รออนุมัติ" หรือ "ไม่อนุมัติ"
   (ส่งกลับแก้ไข) ได้สองทาง: เมนู ⋮ > แก้ไข และลิงก์ "แก้ไขใบสั่งซื้อ" ในกล่อง
   แจ้งเตือนสีแดง ฟอร์มเดียวกับหน้าสร้างใบสั่งซื้อ (PoForm)

   บันทึกแล้วใบกลับไป "รออนุมัติ" ใหม่ ขึ้น toast "แก้ไขใบสั่งซื้อสำเร็จ" แล้ว
   พากลับหน้าใบสั่งซื้อ (ไม่มี backend — เก็บไว้ใน lib/po-edits ระหว่างเซสชัน)

   "+ เพิ่มสินค้า" ใช้หน้าเลือกใบขอซื้อเดียวกับตอนสร้าง (พา edit=<id> ไป) ก่อน
   ออกเก็บร่างที่กรอกค้างไว้ กลับมาพร้อม ?add=<ids ใบขอซื้อที่เพิ่งเลือก>
------------------------------------------------------------------ */

function toEditLine(item: PoLineItem): DraftLine {
  const product = PR_PRODUCTS.find(
    (p) => p.category === item.categoryId && p.name === item.productName && p.sub === item.productSub
  );
  return {
    key: item.id,
    productId: product?.id,
    categoryId: item.categoryId,
    categoryLabel: item.categoryLabel,
    group: item.group,
    productName: item.productName,
    productSub: item.productSub,
    packing: item.packing,
    packingOptions: product?.packingOptions ?? (item.packing ? [item.packing] : []),
    unit: item.unit,
    neededDate: item.neededDate,
    urgent: !!item.urgent,
    orderedQty: item.orderedQty,
    pricePerUnit: item.pricePerUnit,
    handlingPerUnit: item.handlingPerUnit,
    changeReason: "",
    // เทียบกับค่าในใบสั่งซื้อปัจจุบัน — แก้จำนวน/บรรจุภัณฑ์แล้วต้องใส่เหตุผล
    prRef: {
      code: item.prCode,
      requestedQty: item.orderedQty,
      originalPacking: item.packing,
      requester: item.requester,
      editedBy: item.editedBy,
    },
  };
}

function toFormState(po: PoDoc): PoFormState {
  return {
    poType: po.poType,
    company: po.company,
    expectedRange: { from: parseDateSlash(po.expectedFrom), to: parseDateSlash(po.expectedTo) },
    lines: po.lineItems.map(toEditLine),
    note: po.note ?? "",
  };
}

/** แปลงการ์ดในฟอร์มกลับเป็นรายการในใบ — รายการเดิมเก็บรอบ/ข้อมูลอื่นไว้ตามเดิม
 *  รายการที่เพิ่มจากใบขอซื้อใหม่สร้างจากใบขอซื้อนั้น */
function toLineItem(po: PoDoc, line: DraftLine): PoLineItem {
  const changeReason = line.changeReason.trim() || undefined;
  const values = {
    packing: line.packing,
    orderedQty: line.orderedQty,
    pricePerUnit: line.pricePerUnit,
    handlingPerUnit: line.handlingPerUnit,
  };
  const orig = po.lineItems.find((i) => i.id === line.key);
  if (orig) {
    const changed = (Object.keys(values) as (keyof typeof values)[]).some((k) => values[k] !== orig[k]);
    return {
      ...orig,
      ...values,
      changeReason: changeReason ?? orig.changeReason,
      editedBy: changed ? po.requester : orig.editedBy,
    };
  }
  const pr = PO_QUEUE_DOCS.find((d) => d.id === line.key);
  return {
    id: line.key,
    poId: po.id,
    categoryId: line.categoryId,
    categoryLabel: line.categoryLabel,
    group: line.group,
    productName: line.productName,
    productSub: line.productSub,
    unit: line.unit,
    neededDate: line.neededDate,
    urgent: line.urgent,
    prCode: line.prRef?.code ?? "-",
    requester: line.prRef?.requester ?? po.requester,
    editedBy: line.prRef?.editedBy,
    reason: pr?.reasons[0] ?? PR_REASONS[0],
    changeReason,
    rounds: [],
    ...values,
  };
}

export default function EditPoPage() {
  return (
    <React.Suspense fallback={null}>
      <EditPoContent />
    </React.Suspense>
  );
}

function EditPoContent() {
  const params = useParams<{ id: string }>();
  const po = usePoOrder(params.id);

  if (!po || po.status === "cancelled" || po.approval === "approved") {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 pt-6 pb-24 sm:px-6">
        <div className="mt-10 rounded-xl border border-dashed border-border px-6 py-14 text-center">
          <p className="font-medium">
            {po ? "ใบสั่งซื้อนี้แก้ไขไม่ได้แล้ว" : "ไม่พบใบสั่งซื้อนี้"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            แก้ไขได้เฉพาะใบที่รออนุมัติหรือไม่อนุมัติ (ส่งกลับแก้ไข) เท่านั้น
          </p>
          <Button asChild variant="outline-primary" className="mt-4">
            <Link href={po ? `/po/${po.id}` : "/po"}>
              {po ? "กลับไปหน้าใบสั่งซื้อ" : "กลับไปหน้าสั่งซื้อ PO"}
            </Link>
          </Button>
        </div>
      </main>
    );
  }

  return <EditPoForm po={po} />;
}

function EditPoForm({ po }: { po: PoDoc }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [form, setForm] = React.useState<PoFormState>(() => {
    const addIds = (searchParams.get("add") ?? "").split(",").filter(Boolean);
    // กลับมาจากหน้าเพิ่มสินค้า — ต่อจากร่างเดิม ไม่งั้นเริ่มจากข้อมูลใบ
    const base = (addIds.length > 0 && getPoDraft(po.id)) || toFormState(po);
    const have = new Set(base.lines.map((l) => l.key));
    const added = PO_QUEUE_DOCS.filter((d) => addIds.includes(d.id) && !have.has(d.id)).map(toDraftLine);
    return { ...base, lines: [...base.lines, ...added] };
  });

  const addItemsHref = React.useMemo(() => {
    const sp = new URLSearchParams();
    const ids = form.lines.map((l) => l.key).join(",");
    if (ids) sp.set("ids", ids);
    sp.set("edit", po.id);
    // รายการเดิมในใบไม่ได้อยู่ในคิวใบขอซื้อ — บอกประเภทไปตรงๆ ให้ล็อกประเภทได้
    if (form.lines[0]) sp.set("category", form.lines[0].categoryId);
    return `/po/create/add-items?${sp.toString()}`;
  }, [form.lines, po.id]);

  function handleSave() {
    const { company, lines, expectedRange } = form;
    if (!company) {
      toast.error("กรุณาเลือกบริษัทที่ทำการสั่งซื้อ");
      return;
    }
    if (lines.length === 0) {
      toast.error("กรุณาเพิ่มสินค้าอย่างน้อย 1 รายการ");
      return;
    }
    savePoEdit(po.id, {
      poType: form.poType,
      company,
      expectedFrom: expectedRange?.from ? formatDateSlash(expectedRange.from) : po.expectedFrom,
      expectedTo: expectedRange?.to
        ? formatDateSlash(expectedRange.to)
        : expectedRange?.from
          ? formatDateSlash(expectedRange.from)
          : po.expectedTo,
      note: form.note.trim() || undefined,
      lineItems: lines.map((l) => toLineItem(po, l)),
      editedBy: po.requester,
    });
    clearPoDraft(po.id);
    const names = [...new Set(lines.map((l) => [l.productName, l.productSub].filter(Boolean).join(" ")))];
    const shown = names.length > 2 ? `${names.slice(0, 2).join(", ")} และอีก ${names.length - 2} รายการ` : names.join(", ");
    toast.success("แก้ไขใบสั่งซื้อสำเร็จ", { description: `สินค้า: ${shown}` });
    router.replace(`/po/${po.id}`);
  }

  return (
    <PoForm
      title="แก้ไขใบสั่งซื้อ"
      value={form}
      onChange={setForm}
      addItemsHref={addItemsHref}
      onBeforeAddItems={() => stashPoDraft(po.id, form)}
      onSave={handleSave}
    />
  );
}
