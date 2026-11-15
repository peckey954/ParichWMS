"use client";

import { useParams } from "next/navigation";
import { LotActionPage } from "@/components/stock/lot-action";
import { LotPrintPage } from "@/components/stock/lot-print";

/** /stock/lot/<lotId>/move, /adjust หรือ /print — ใช้ทั้งสต็อกทั่วไปและสต็อกสินค้า */
export default function StockLotActionPage() {
  const { lotId, action } = useParams<{ lotId: string; action: string }>();
  if (action === "print") return <LotPrintPage key={lotId} lotId={lotId} />;
  return <LotActionPage key={`${lotId}/${action}`} lotId={lotId} action={action} />;
}
