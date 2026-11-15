"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { receiptHref, slipScanPool } from "@/components/stock/goods-receipt";
import { ZoneScanNotFound, ZoneScanSheet } from "@/components/stock/zone-scan-sheet";
import { getGoodsInboundReceipt, isGoodsInboundOpen, setSlipZones } from "@/lib/goods-inbound";

/** เลือกล็อครับเข้า ของใบรับเข้าภายนอก/ผลิต — สแกนป้ายสลิง (components/stock/zone-scan-sheet) */
export default function GoodsZoneAssignPage() {
  const { id } = useParams<{ id: string }>();
  const receipt = React.useMemo(() => getGoodsInboundReceipt(id), [id]);
  const pool = React.useMemo(() => (receipt ? slipScanPool(receipt) : []), [receipt]);
  const home = { label: "สต็อกสินค้า", href: "/stock/goods" };
  if (!receipt || receipt.doc.source === "return" || !isGoodsInboundOpen(receipt.doc))
    return <ZoneScanNotFound crumbs={[home]} message="ไม่พบใบรับเข้านี้ หรือรับเข้าครบแล้ว" />;
  const back = receiptHref(receipt);
  return (
    <ZoneScanSheet
      key={receipt.doc.id}
      pool={pool}
      back={back}
      crumbs={[home, { label: "ใบรับเข้าสินค้า", href: back }]}
      onSave={setSlipZones}
      photoInputId="goods-zone-photo"
    />
  );
}
