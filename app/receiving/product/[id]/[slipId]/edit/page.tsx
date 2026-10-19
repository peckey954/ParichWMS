"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@peckey954/ui/components/ui/button";
import { SlipForm } from "@/components/receiving/slip-form";
import { canEditSlip, currentRole, docOf, slipOf } from "@/lib/goods-receiving";

/* แก้การรับเข้าหนึ่งสลิง — ภายในสามวัน หรือผู้ดูแลระบบ */
export default function EditSlipPage() {
  const { id, slipId } = useParams<{ id: string; slipId: string }>();
  const doc = docOf(id);
  const slip = doc && slipOf(doc, slipId);
  const allowed = slip && !slip.cancelled && (currentRole() === "admin" || canEditSlip(slip));
  if (!doc || !slip || !allowed)
    return (
      <main className="mx-auto w-full max-w-lg px-4 py-20 text-center">
        <p className="font-medium">{slip ? "สลิงนี้แก้ไขไม่ได้แล้ว" : "ไม่พบสลิงนี้"}</p>
        <p className="mt-1 text-sm text-muted-foreground">แก้ไขได้ภายใน 3 วันหลังรับเข้า เลยกำหนดแล้วติดต่อผู้ดูแลระบบ</p>
        <Button asChild variant="outline-primary" className="mt-4">
          <Link href={doc ? `/receiving/product/${doc.id}` : "/receiving/product"}>ย้อนกลับ</Link>
        </Button>
      </main>
    );
  return <SlipForm key={slip.id} doc={doc} slip={slip} />;
}
