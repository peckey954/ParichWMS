"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { ReceiptNotFound, ReceiptSheet } from "@/components/stock/goods-receipt";
import { getGoodsInboundReceipt, isGoodsInboundOpen } from "@/lib/goods-inbound";

/* ------------------------------------------------------------------
   ใบรับเข้าสินค้า — ภายนอก (PO) หรือ ผลิต (PD) ตาม Figma Tab 2.1 / 2.2
   ตัวหน้าอยู่ที่ components/stock/goods-receipt (ใช้ร่วมกับรับคืนภายนอก)
------------------------------------------------------------------ */

export default function GoodsInboundPage() {
  const { id } = useParams<{ id: string }>();
  const receipt = React.useMemo(() => getGoodsInboundReceipt(id), [id]);
  if (!receipt || receipt.doc.source === "return" || !isGoodsInboundOpen(receipt.doc))
    return <ReceiptNotFound done={Boolean(receipt)} crumb="ใบรับเข้าสินค้า" />;
  return <ReceiptSheet key={receipt.doc.id} receipt={receipt} />;
}
