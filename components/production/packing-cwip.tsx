"use client";

import * as React from "react";
import { Badge } from "@peckey954/ui/components/ui/badge";
import { Button } from "@peckey954/ui/components/ui/button";
import { Separator } from "@peckey954/ui/components/ui/separator";
import { cn } from "@peckey954/ui/lib/utils";
import { toast } from "sonner";
import { EmptyDocs } from "@/components/stock/doc-parts";
import {
  cwipTotal,
  cwipZones,
  formatQty,
  type CwipLot,
  type CwipProduct,
} from "@/lib/packing-list";

/* ------------------------------------------------------------------
   สต็อก CWIP — ของที่เบิกมาไว้ที่ไลน์แล้วยังไม่ได้ใช้หมด

   จัดเป็นสินค้า > ล็อต เพราะของชิ้นเดียวกันมาจากหลายล็อตหลายโซน
   และการคืนกลับคลังทำเป็นล็อต ไม่ใช่ทำรวมทั้งสินค้า

   ปุ่มจึงอยู่ที่แถวของแต่ละล็อต ไม่ใช่ปุ่มระดับหน้า
   ปุ่มระดับหน้าที่ทำกับ "ของชิ้นไหนก็ไม่รู้" คือปุ่มที่กดแล้วต้องถามต่อ
------------------------------------------------------------------ */

export function PackingCwip({ products }: { products: CwipProduct[] }) {
  if (products.length === 0) {
    return (
      <EmptyDocs
        title="ไม่มีของค้างที่ไลน์ผลิต"
        hint="ลองใช้คำค้นสั้นลง หรือดูแท็บอื่น"
      />
    );
  }

  return (
    <div className="space-y-3">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}

function ProductCard({ product: p }: { product: CwipProduct }) {
  const total = cwipTotal(p);

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card">
      {/* ---------- หัวสินค้า ---------- */}
      <div className="flex flex-wrap items-start gap-x-3 gap-y-2 p-4">
        <div className="min-w-48 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold">{p.name}</h3>
            <Badge tone="neutral" appearance="soft">
              {p.kind}
            </Badge>
            {p.low && (
              <Badge
                appearance="soft"
                className="[--bdg-border:transparent] [--bdg-surface:var(--chip-red)] [--bdg-text:var(--chip-red-foreground)] font-semibold"
              >
                สต็อกต่ำ
              </Badge>
            )}
            {p.incoming !== undefined && (
              <Badge
                appearance="soft"
                className="[--bdg-border:transparent] [--bdg-surface:var(--chip-yellow)] [--bdg-text:var(--chip-yellow-foreground)] font-semibold"
              >
                รอรับเข้า {formatQty(p.incoming)} {p.unit}
              </Badge>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {p.lots.length} รายการ · {cwipZones(p)} โซน
          </p>
        </div>

        <p className="shrink-0 text-right">
          <span className="text-lg font-semibold tabular-nums">
            {formatQty(total)}
          </span>
          <span className="ml-1 text-sm text-muted-foreground">{p.unit}</span>
        </p>
      </div>

      {p.lots.map((l) => (
        <React.Fragment key={l.id}>
          <Separator />
          <LotRow lot={l} unit={p.unit} product={p.name} />
        </React.Fragment>
      ))}
    </section>
  );
}

function LotRow({
  lot: l,
  unit,
  product,
}: {
  lot: CwipLot;
  unit: string;
  product: string;
}) {
  const act = (what: string) =>
    toast.success(`${what} — ${product}`, {
      description: `ล็อต ${l.code} · โซน ${l.zone}`,
    });

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-3 p-4">
      <div className="min-w-48 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          {/* โซนเป็นข้อความสีแบรนด์ ไม่ใช่ชิป ตามที่ตกลงกันไว้ในหน้าสต็อก */}
          <span className="rounded-md bg-secondary px-2.5 py-0.5 font-semibold text-primary">
            {l.zone}
          </span>
          <span className="font-medium">{l.code}</span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          รับ {l.receivedAt} ({l.ageDays} วัน) · {formatQty(l.pieces)} ชิ้น
          {l.perPiece !== "-" && ` (${l.perPiece})`}
        </p>
      </div>

      {/* ปุ่มอยู่ที่ล็อต จอแคบเรียงเต็มความกว้างให้กดง่ายด้วยนิ้วโป้ง */}
      <div className="flex w-full items-center gap-2 @2xl:w-auto">
        <Button
          variant="outline-primary"
          className="flex-1 @2xl:w-28 @2xl:flex-none"
          onClick={() => act("คืนกลับคลัง")}
        >
          คืนกลับคลัง
        </Button>
        <Button
          variant="outline"
          className="flex-1 @2xl:w-28 @2xl:flex-none"
          onClick={() => act("ปรับปรุง")}
        >
          ปรับปรุง
        </Button>
      </div>

      <p className={cn("shrink-0 text-right", "w-full @2xl:w-24")}>
        <span className="text-lg font-semibold tabular-nums">
          {formatQty(l.qty)}
        </span>
        <span className="ml-1 text-sm text-muted-foreground">{unit}</span>
      </p>
    </div>
  );
}
