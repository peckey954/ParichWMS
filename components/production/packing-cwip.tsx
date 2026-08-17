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
  type CwipFlatLot,
  type CwipLot,
  type CwipLotGroup,
  type CwipProduct,
  type CwipSort,
  type SortDir,
} from "@/lib/packing-list";

/* ------------------------------------------------------------------
   สต็อก CWIP — ของที่เบิกมาไว้ที่ไลน์แล้วยังไม่ได้ใช้หมด

   จัดเป็นสินค้า > ล็อต เพราะของชิ้นเดียวกันมาจากหลายล็อตหลายโซน
   และการคืนกลับคลังทำเป็นล็อต ไม่ใช่ทำรวมทั้งสินค้า

   ปุ่มจึงอยู่ที่แถวของแต่ละล็อต ไม่ใช่ปุ่มระดับหน้า
   ปุ่มระดับหน้าที่ทำกับ "ของชิ้นไหนก็ไม่รู้" คือปุ่มที่กดแล้วต้องถามต่อ
------------------------------------------------------------------ */

/** สิ่งที่เลือกซ่อน/แสดงได้จากปุ่มตัวกรอง — ชุดเดียวกับหน้าสต็อกทั่วไป */
export type CwipView = {
  showChips: boolean;
  showActions: boolean;
  showLots: boolean;
  /** ว่าง = เอาทั้งหมด ไม่ใช่ไม่เอาอะไรเลย */
  kinds: string[];
  products: string[];
  sort: CwipSort;
  dir: SortDir;
};

export const CWIP_VIEW_DEFAULT: CwipView = {
  showChips: true,
  showActions: true,
  showLots: true,
  kinds: [],
  products: [],
  sort: "product",
  dir: "asc",
};

export function PackingCwip({
  products,
  view,
  zoneGroups,
  fifoRows,
}: {
  products: CwipProduct[];
  view: CwipView;
  zoneGroups: CwipLotGroup[];
  fifoRows: CwipFlatLot[];
}) {
  if (products.length === 0) {
    return (
      <EmptyDocs
        title="ไม่มีของค้างที่ไลน์ผลิต"
        hint="ลองใช้คำค้นสั้นลง หรือเอาตัวกรองบางอันออก"
      />
    );
  }

  /* หน่วยของรายการเปลี่ยนตามโหมดที่เลือก ไม่ใช่การ์ดเดิมสลับลำดับ
     แบบเดียวกับหน้าสต็อกทั่วไป คนที่ใช้หน้านั้นเป็นแล้วต้องใช้หน้านี้ได้ทันที */
  if (view.sort === "zone") {
    return (
      <div className="space-y-4">
        {zoneGroups.map((g) => (
          <section
            key={g.id}
            className="overflow-hidden rounded-xl border border-border bg-card"
          >
            <div className="flex items-center gap-2 p-4">
              <ZoneTag zone={g.zone} />
              <div className="min-w-0">
                <h3 className="font-semibold">{g.title}</h3>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {g.rows.length} รายการ ·{" "}
                  {new Set(g.rows.map((r) => r.product.id)).size} สินค้า
                </p>
              </div>
            </div>

            {g.rows.map((row) => (
              <FlatLotRow
                key={row.lot.id}
                row={row}
                showZone={false}
                view={view}
              />
            ))}
          </section>
        ))}
      </div>
    );
  }

  if (view.sort === "fifo") {
    return (
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {fifoRows.map((row) => (
          <FlatLotRow key={row.lot.id} row={row} showZone view={view} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} view={view} />
      ))}
    </div>
  );
}

/** ป้ายโซน — ข้อความสีแบรนด์บนพื้นเทาอ่อน ตามที่ตกลงกันไว้ในหน้าสต็อก */
function ZoneTag({ zone }: { zone: string }) {
  return (
    <span className="shrink-0 rounded-md bg-secondary px-2.5 py-0.5 text-sm font-semibold text-primary">
      {zone}
    </span>
  );
}

/**
 * แถวล็อตของโหมดโซนกับ FIFO — หน่วยของรายการคือล็อต ไม่ใช่สินค้า
 * ชื่อสินค้าจึงย้ายเข้ามาอยู่ในแถว
 *
 * ป้ายอยู่บรรทัดของตัวเองใต้ชื่อ ไม่ต่อท้ายชื่อ
 * ชื่อสินค้าที่นี่ยาวกว่าหน้าสต็อกมาก ("8-24-24+0.5Mg No filler")
 * ต่อป้ายท้ายชื่อแล้วมันจะห่อบรรทัดคาบเกี่ยวกัน อ่านไม่ออกว่าป้ายไหนของอะไร
 *
 * ไม่มีป้ายหมวดสินค้าแบบหน้าสต็อกทั่วไป เพราะ CWIP รวมทุกหมวดไว้ด้วยกันอยู่แล้ว
 * ไม่ได้แยกดูทีละหมวด ป้ายจึงไม่ได้ช่วยแยกอะไร — แต่ป้ายชนิด (Bulk / แม่ปุ๋ย)
 * ยังอยู่ เพราะเป็นคุณสมบัติของของชิ้นนั้น ไม่ใช่ทางที่เลือกดู
 */
function FlatLotRow({
  row: { lot, product },
  showZone,
  view,
}: {
  row: CwipFlatLot;
  showZone: boolean;
  view: CwipView;
}) {
  const act = (what: string) =>
    toast.success(`${what} — ${product.name}`, {
      description: `ล็อต ${lot.code} · โซน ${lot.zone}`,
    });

  const qty = (
    <>
      <span className="text-lg font-semibold">{formatQty(lot.qty)}</span>{" "}
      <span className="text-sm text-muted-foreground">{product.unit}</span>
    </>
  );

  return (
    <div className="border-t border-border p-4">
      <div className="flex flex-col @2xl:flex-row @2xl:items-center @2xl:justify-between @2xl:gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              {showZone && <ZoneTag zone={lot.zone} />}
              <span className="font-semibold">{product.name}</span>
            </div>
            <p className="shrink-0 text-right tabular-nums @2xl:hidden">{qty}</p>
          </div>

          {/* ป้ายบรรทัดของตัวเอง เลื่อนแนวนอนบนจอแคบแทนการห่อบรรทัด */}
          {view.showChips && (
            <div
              className={cn(
                "mt-2 flex items-center gap-2 overflow-x-auto",
                "flex-nowrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              )}
            >
              <Badge tone="neutral" appearance="soft">
                {product.kind}
              </Badge>
              {product.low && (
                <Badge
                  appearance="soft"
                  className="[--bdg-border:transparent] [--bdg-surface:var(--chip-red)] [--bdg-text:var(--chip-red-foreground)] font-semibold"
                >
                  สต็อกต่ำ
                </Badge>
              )}
              {product.incoming !== undefined && (
                <Badge
                  appearance="soft"
                  className="[--bdg-border:transparent] [--bdg-surface:var(--chip-yellow)] [--bdg-text:var(--chip-yellow-foreground)] font-semibold"
                >
                  รอรับเข้า {formatQty(product.incoming)} {product.unit}
                </Badge>
              )}
            </div>
          )}

          <p className="mt-2 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{lot.code}</span>
            <span className="block">
              รับ {lot.receivedAt} ({lot.ageDays} วัน) · {formatQty(lot.pieces)}{" "}
              ชิ้น{lot.perPiece !== "-" && ` (${lot.perPiece})`}
            </span>
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          {view.showActions && (
            <div className="mt-3 flex w-full items-center gap-2 @2xl:mt-0 @2xl:w-auto">
              <Button
                variant="outline-primary"
                className="flex-1 @2xl:w-28 @2xl:flex-none"
                onClick={() => act("คืนกลับคลัง")}
              >
                คืนกลับคลัง
              </Button>
              <Button
                variant="outline-primary"
                className="flex-1 @2xl:w-28 @2xl:flex-none"
                onClick={() => act("ปรับปรุง")}
              >
                ปรับปรุง
              </Button>
            </div>
          )}
          <p className="hidden w-24 text-right tabular-nums @2xl:block">{qty}</p>
        </div>
      </div>
    </div>
  );
}

function ProductCard({
  product: p,
  view,
}: {
  product: CwipProduct;
  view: CwipView;
}) {
  const total = cwipTotal(p);

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card">
      {/* ---------- หัวสินค้า ---------- */}
      <div className="flex flex-wrap items-start gap-x-3 gap-y-2 p-4">
        <div className="min-w-48 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold">{p.name}</h3>
            {view.showChips && (
              <>
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
              </>
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

      {view.showLots &&
        p.lots.map((l) => (
          <React.Fragment key={l.id}>
            <Separator />
            <LotRow
              lot={l}
              unit={p.unit}
              product={p.name}
              showActions={view.showActions}
            />
          </React.Fragment>
        ))}
    </section>
  );
}

function LotRow({
  lot: l,
  unit,
  product,
  showActions,
}: {
  lot: CwipLot;
  unit: string;
  product: string;
  showActions: boolean;
}) {
  const act = (what: string) =>
    toast.success(`${what} — ${product}`, {
      description: `ล็อต ${l.code} · โซน ${l.zone}`,
    });

  const qty = (
    <>
      <span className="text-lg font-semibold">{formatQty(l.qty)}</span>{" "}
      <span className="text-sm text-muted-foreground">{unit}</span>
    </>
  );

  return (
    <div className="p-4">
      {/* วางแบบเดียวกับล็อตในหน้าสต็อกทั่วไป
          จอกว้าง: ข้อมูล | ปุ่ม | ยอด อยู่แถวเดียว
          จอแคบ: ยอดขึ้นไปอยู่ขวาของบรรทัดโซน แล้วปุ่มลงมาเต็มความกว้างข้างล่าง
          ยอดต้องอยู่มุมบนขวาเสมอ ไม่ใช่ไหลไปอยู่ใต้ปุ่ม
          เพราะคนกวาดตาหาตัวเลขที่ขอบขวาของหัวแถว ไม่ได้ไล่อ่านจากล่างขึ้นบน */}
      <div className="flex flex-col @2xl:flex-row @2xl:items-center @2xl:justify-between @2xl:gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              {/* โซนเป็นข้อความสีแบรนด์ ไม่ใช่ชิป ตามที่ตกลงกันไว้ในหน้าสต็อก */}
              <span className="rounded-md bg-secondary px-2.5 py-0.5 font-semibold text-primary">
                {l.zone}
              </span>
              <span className="font-medium">{l.code}</span>
            </div>

            <p className="shrink-0 text-right tabular-nums @2xl:hidden">{qty}</p>
          </div>

          <p className="mt-1 text-sm text-muted-foreground">
            รับ {l.receivedAt} ({l.ageDays} วัน) · {formatQty(l.pieces)} ชิ้น
            {l.perPiece !== "-" && ` (${l.perPiece})`}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          {/* ปุ่มอยู่ที่ล็อต จอแคบเรียงเต็มความกว้างให้กดง่ายด้วยนิ้วโป้ง
              ระยะห่างอยู่ที่ตัวปุ่มเอง ไม่ใช่ที่ gap ของกล่องแม่
              ถ้าอยู่ที่แม่ พอปิดปุ่มแล้ว gap ยังเหลือค้างเป็นช่องว่างเปล่า 12px */}
          {showActions && (
            <div className="mt-3 flex w-full items-center gap-2 @2xl:mt-0 @2xl:w-auto">
              <Button
                variant="outline-primary"
                className="flex-1 @2xl:w-28 @2xl:flex-none"
                onClick={() => act("คืนกลับคลัง")}
              >
                คืนกลับคลัง
              </Button>
              <Button
                variant="outline-primary"
                className="flex-1 @2xl:w-28 @2xl:flex-none"
                onClick={() => act("ปรับปรุง")}
              >
                ปรับปรุง
              </Button>
            </div>
          )}

          <p className="hidden w-24 text-right tabular-nums @2xl:block">{qty}</p>
        </div>
      </div>
    </div>
  );
}
