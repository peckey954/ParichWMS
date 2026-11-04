"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@peckey954/ui/components/ui/button";
import { WeighingForm } from "@/components/weighing/weighing-form";
import { WeighingCrumbs } from "@/components/weighing/weighing-parts";
import { canEditWeighing, WEIGHING_EDIT_DAYS } from "@/lib/weighing";
import { useWeighingDoc } from "@/lib/weighing-store";

/* ------------------------------------------------------------------
   แก้ไขใบชั่งน้ำหนัก — เข้าจากปุ่มดินสอในใบที่ชั่งแล้ว ได้เฉพาะภายใน
   WEIGHING_EDIT_DAYS วันหลังชั่ง และใบสั่งซื้อยังไม่ปิด พิมพ์ลิงก์เข้ามาเอง
   หลังพ้นกำหนดก็กันไว้ตรงนี้อีกชั้น
------------------------------------------------------------------ */

export default function EditWeighingPage() {
  const params = useParams<{ id: string }>();
  const doc = useWeighingDoc(params.id);

  if (!doc || !canEditWeighing(doc)) {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 pt-6 pb-24 sm:px-6">
        <WeighingCrumbs />
        <div className="mt-10 rounded-xl border border-dashed border-border px-6 py-14 text-center">
          <p className="font-medium">{doc ? "ใบชั่งน้ำหนักนี้แก้ไขไม่ได้แล้ว" : "ไม่พบใบชั่งน้ำหนักนี้"}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            แก้ไขได้ภายใน {WEIGHING_EDIT_DAYS} วันหลังชั่ง และใบสั่งซื้อต้องยังไม่ปิด
          </p>
          <Button asChild variant="outline-primary" className="mt-4">
            <Link href={doc ? `/weighing/${doc.id}` : "/weighing"}>
              {doc ? "กลับไปใบชั่งน้ำหนัก" : "กลับไปหน้าชั่งน้ำหนัก"}
            </Link>
          </Button>
        </div>
      </main>
    );
  }

  return <WeighingForm key={doc.id} doc={doc} mode="edit" />;
}
