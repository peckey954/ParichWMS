"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@peckey954/ui/components/ui/button";
import { SlipForm } from "@/components/receiving/slip-form";
import { docOf } from "@/lib/goods-receiving";

/* เพิ่มการรับเข้าหนึ่งสลิงของใบนี้ */
export default function AddSlipPage() {
  const { id } = useParams<{ id: string }>();
  const doc = docOf(id);
  if (!doc || doc.done)
    return (
      <main className="mx-auto w-full max-w-lg px-4 py-20 text-center">
        <p className="font-medium">{doc ? "ใบนี้บันทึกเข้าคลังแล้ว เพิ่มการรับเข้าไม่ได้" : "ไม่พบใบรับเข้านี้"}</p>
        <Button asChild variant="outline-primary" className="mt-4">
          <Link href={doc ? `/receiving/product/${doc.id}` : "/receiving/product"}>ย้อนกลับ</Link>
        </Button>
      </main>
    );
  return <SlipForm key={doc.id} doc={doc} />;
}
