"use client";

import { useParams } from "next/navigation";
import { BulkLotPage } from "@/components/stock/bulk-lot-action";

/** /stock/bulk/move หรือ /adjust — ย้าย/ปรับปรุงหลายรายการของสต็อกทั่วไป */
export default function GeneralBulkLotPage() {
  const { action } = useParams<{ action: string }>();
  return <BulkLotPage scope="general" action={action} />;
}
