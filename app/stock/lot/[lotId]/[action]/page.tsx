"use client";

import { useParams } from "next/navigation";
import { LotActionPage } from "@/components/stock/lot-action";

/** /stock/lot/<lotId>/move หรือ /adjust — ใช้ทั้งสต็อกทั่วไปและสต็อกสินค้า */
export default function StockLotActionPage() {
  const { lotId, action } = useParams<{ lotId: string; action: string }>();
  return <LotActionPage key={`${lotId}/${action}`} lotId={lotId} action={action} />;
}
