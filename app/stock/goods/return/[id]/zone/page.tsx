"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { slipScanPool } from "@/components/stock/goods-receipt";
import { ZoneScanNotFound, ZoneScanSheet, type ZoneScanItem } from "@/components/stock/zone-scan-sheet";
import { getGoodsInboundReceipt, setSlipZones } from "@/lib/goods-inbound";
import {
  canReturn,
  formatCount,
  goodsIssueOf,
  isCountUnit,
  otherReturnDoc,
  returnLotsFor,
  setReturnLotZones,
  type GoodsIssueDoc,
} from "@/lib/goods-issue";

/* ------------------------------------------------------------------
   เลือกล็อครับเข้า ของใบรับคืน (components/stock/zone-scan-sheet)
     ภายนอก  สแกนป้ายสลิง เหมือนรับเข้าภายนอก
     ภายใน   สแกนป้าย Lot ที่ขอคืน
   กวาดพื้นไม่มีหน้านี้ — เลือกล็อคในหน้ารับคืนเลย
------------------------------------------------------------------ */

function lotPool(doc: GoodsIssueDoc): ZoneScanItem[] {
  const unit = isCountUnit(doc.unit) ? doc.unit : "ชิ้น";
  const toItems = (d: GoodsIssueDoc, own: boolean) =>
    returnLotsFor(d).map((l) => ({
      id: l.id,
      code: l.code,
      zone: l.zone ?? "",
      line: `${l.packing ?? d.unit} · ขอคืน ${formatCount(l.count)} ${unit}`,
      own,
    }));
  const other = otherReturnDoc(doc);
  return [...toItems(doc, true), ...(other ? toItems(other, false) : [])];
}

export default function GoodsReturnZonePage() {
  const { id } = useParams<{ id: string }>();
  const doc = goodsIssueOf(id);
  const external = doc?.status === "returnExternal";
  const pool = React.useMemo(() => {
    if (!doc) return [];
    if (!external) return lotPool(doc);
    const receipt = getGoodsInboundReceipt(doc.id);
    return receipt ? slipScanPool(receipt) : [];
  }, [doc, external]);

  const home = { label: "สต็อกสินค้า", href: "/stock/goods" };
  if (!doc || !canReturn(doc) || doc.status === "returnSweep")
    return <ZoneScanNotFound crumbs={[home]} message="ไม่พบใบขอคืนนี้ หรือรับคืนไปแล้ว" />;
  const back = `/stock/goods/return/${doc.id}`;
  return (
    <ZoneScanSheet
      key={doc.id}
      pool={pool}
      back={back}
      crumbs={[home, { label: "รับคืนสินค้า", href: back }]}
      onSave={external ? setSlipZones : setReturnLotZones}
      photoInputId="goods-return-zone-photo"
    />
  );
}
