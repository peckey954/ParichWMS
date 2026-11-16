"use client";

import { useParams } from "next/navigation";
import { BulkLotPage } from "@/components/stock/bulk-lot-action";

/** /stock/raw/bulk/move หรือ /adjust — ย้าย/ปรับปรุงหลายรายการของสต็อกวัตถุดิบ */
export default function RawBulkLotPage() {
  const { action } = useParams<{ action: string }>();
  return <BulkLotPage scope="raw" action={action} />;
}
