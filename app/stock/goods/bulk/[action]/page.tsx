"use client";

import { useParams } from "next/navigation";
import { BulkLotPage } from "@/components/stock/bulk-lot-action";

/** /stock/goods/bulk/move หรือ /adjust — ย้าย/ปรับปรุงหลายรายการของสต็อกสินค้า */
export default function GoodsBulkLotPage() {
  const { action } = useParams<{ action: string }>();
  return <BulkLotPage scope="goods" action={action} />;
}
