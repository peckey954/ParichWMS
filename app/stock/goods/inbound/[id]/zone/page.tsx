"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@peckey954/ui/components/ui/button";
import { toast } from "sonner";
import { Crumbs } from "@/components/receiving/parts";
import { ZoneAssignFields, useZoneAssign } from "@/components/stock/zone-assign";
import type { InboundPiece } from "@/lib/general-stock";
import {
  formatInboundQty,
  getGoodsInboundReceipt,
  isCountUnit,
  isGoodsInboundOpen,
  liveSlips,
  setSlipZones,
  type GoodsInboundReceipt,
  type GoodsSlip,
} from "@/lib/goods-inbound";

/* ------------------------------------------------------------------
   เลือกโซนรับเข้า ของสต็อกสินค้า — ชิ้นส่วนเดียวกับสต็อกทั่วไป (zone-assign)
   เลือกโซน แล้วสแกนป้ายสลิง/เลือกจากรายการ บันทึกแล้วกลับไปใบรับเข้า
------------------------------------------------------------------ */

export default function GoodsZoneAssignPage() {
  const { id } = useParams<{ id: string }>();
  const receipt = React.useMemo(() => getGoodsInboundReceipt(id), [id]);
  if (!receipt || !isGoodsInboundOpen(receipt.doc)) return <NotFound />;
  return <ZoneSheet key={receipt.doc.id} receipt={receipt} />;
}

function ZoneSheet({ receipt }: { receipt: GoodsInboundReceipt }) {
  const router = useRouter();
  const { doc } = receipt;
  const slips = liveSlips(receipt.slips);
  // บรรทัดรองใต้เลขสลิง ตามแบบ: "50 กก. · 0.50 ตัน · 24 ชิ้น"
  const describe = React.useCallback(
    (p: InboundPiece) => {
      const s = p as GoodsSlip;
      const base = `${s.packing} · ${formatInboundQty(s.qty, doc.unit)} ${doc.unit}`;
      return isCountUnit(doc.unit) ? base : `${base} · ${s.count.toLocaleString("en-US")} ชิ้น`;
    },
    [doc.unit]
  );
  const state = useZoneAssign(slips, describe);

  const save = () => {
    if (!state.zone || state.picked.size === 0) return;
    const ids = [...state.picked];
    setSlipZones(ids, state.zone);
    toast.success("เลือกโซนรับเข้าสำเร็จ", { description: `${ids.length} รายการ · โซน ${state.zone}` });
    router.push(`/stock/goods/inbound/${doc.id}`);
  };

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col">
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 pt-6 pb-6 sm:px-6">
        <Crumbs
          trail={[
            { label: "สต็อกสินค้า", href: "/stock/goods" },
            { label: "ใบรับเข้าสินค้า", href: `/stock/goods/inbound/${doc.id}` },
            { label: "เลือกโซนรับเข้า" },
          ]}
        />
        <h1 className="mt-4 text-2xl font-bold tracking-tight">เลือกโซนรับเข้า</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          เลือกโซนแล้วสแกนเลขที่ติดบนสินค้าหรือเลือกจากรายการ
        </p>
        <div className="mt-5">
          <ZoneAssignFields state={state} listClassName="max-h-[55svh]" />
        </div>
      </main>

      <div className="sticky bottom-0 z-30 border-t border-border bg-surface">
        <div className="mx-auto w-full max-w-7xl px-4 py-3 sm:px-6">
          <div className="grid grid-cols-2 gap-3 sm:flex sm:justify-between">
            <Button variant="outline-primary" onClick={() => router.back()}>
              ย้อนกลับ
            </Button>
            <Button disabled={!state.canSubmit} onClick={save}>
              บันทึก
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function NotFound() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 pt-6 pb-24 sm:px-6">
      <Crumbs trail={[{ label: "สต็อกสินค้า", href: "/stock/goods" }, { label: "เลือกโซนรับเข้า" }]} />
      <div className="mt-10 rounded-xl border border-dashed border-border px-6 py-14 text-center">
        <p className="font-medium">ไม่พบใบรับเข้านี้ หรือรับเข้าครบแล้ว</p>
        <Button asChild variant="outline-primary" className="mt-4">
          <Link href="/stock/goods">กลับไปหน้าสต็อกสินค้า</Link>
        </Button>
      </div>
    </main>
  );
}
