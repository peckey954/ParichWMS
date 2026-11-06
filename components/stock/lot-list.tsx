"use client";

import * as React from "react";
import { Badge } from "@peckey954/ui/components/ui/badge";
import { cn } from "@peckey954/ui/lib/utils";
import { LotMenu } from "./lot-menu";
import { useSafetyStock } from "./safety-stock-provider";
import { isProductLow } from "@/lib/safety-stock";
import {
  CATEGORY_LABEL,
  CONDITION_LABEL,
  formatQty,
  pendingEntries,
  type FlatLot,
  type LotGroup,
} from "@/lib/general-stock";

/* ------------------------------------------------------------------
   รายการล็อตแบบไม่จัดกลุ่มตามสินค้า

   ใช้กับสองโหมด
     โซน  — จัดกลุ่มตามโซน หัวกลุ่มบอกว่าโซนนี้มีกี่รายการ กี่สินค้า
            ในแถวไม่มีป้ายโซนแล้ว เพราะหัวกลุ่มบอกไปแล้ว ซ้ำอีกก็เปลืองที่
     FIFO — ไม่มีหัวกลุ่ม ไล่ล็อตเรียงตามอายุรวด ในแถวมีป้ายโซนกำกับ
            เพราะของเก่าที่สุดกับอันถัดไปอาจอยู่คนละมุมโรงงาน

   ต่างจากการ์ดสินค้าตรงที่หน่วยของรายการคือ "ล็อต" ไม่ใช่ "สินค้า"
   ชื่อสินค้าจึงย้ายเข้ามาอยู่ในแถว
------------------------------------------------------------------ */

const NO_BORDER = "[--bdg-border:transparent]";

const CONDITION_CHIP = {
  repack:
    "[--bdg-surface:var(--tone-violet)] [--bdg-text:var(--tone-violet-foreground)] [--bdg-border:var(--tone-violet)]",
  accepted:
    "[--bdg-surface:var(--tone-blue)] [--bdg-text:var(--tone-blue-foreground)] [--bdg-border:var(--tone-blue)]",
  sweep:
    "[--bdg-surface:var(--tone-blue)] [--bdg-text:var(--tone-blue-foreground)] [--bdg-border:var(--tone-blue)]",
};

function ZoneTag({ zone }: { zone: string }) {
  return (
    <span className="shrink-0 rounded-md bg-secondary px-2.5 py-0.5 text-sm font-semibold text-primary">
      {zone}
    </span>
  );
}

function LotRow({
  row: { lot, product },
  showZone,
  showChips,
}: {
  row: FlatLot;
  showZone: boolean;
  showChips: boolean;
}) {
  // สต็อกต่ำมาจากเกณฑ์ Safety Stock ที่ตั้งไว้ ไม่ใช่ธงที่ติดมากับข้อมูล
  // ต้องใช้ที่มาเดียวกับการ์ดสินค้า ไม่งั้นสองที่บอกไม่ตรงกัน
  const { config } = useSafetyStock();
  const lowStock = isProductLow(product, config);

  const chips = (
    <>
      {/* ประเภทสินค้าขึ้นเป็นป้ายแรกเสมอ
          โหมดสินค้ามันอยู่บนหัวการ์ดของสินค้านั้น แต่สองโหมดนี้ไม่มีหัวการ์ดสินค้า
          ป้ายประเภทจึงต้องมาอยู่ในแถว ไม่งั้นไล่ดูข้ามโซนแล้วไม่รู้ว่าของชิ้นไหนคือประเภทอะไร
          ใช้ป้ายขอบสีแบรนด์ตัวเดียวกับที่การ์ดสินค้าใช้ จะได้อ่านเป็นของอย่างเดียวกัน */}
      <Badge tone="brand" appearance="outline">
        {CATEGORY_LABEL[product.category]}
      </Badge>
      <Badge tone="neutral" appearance="soft" className={NO_BORDER}>
        {product.packing}
      </Badge>
      {lot.condition && (
        <Badge appearance="soft" className={cn(CONDITION_CHIP[lot.condition])}>
          {CONDITION_LABEL[lot.condition]}
        </Badge>
      )}
      {lowStock && (
        <Badge
          tone="danger"
          appearance="soft"
          className={cn(NO_BORDER, "[--bdg-text:var(--danger-strong)] font-semibold")}
        >
          สต็อกต่ำ
        </Badge>
      )}
      {pendingEntries(lot.pending, product.unit).map((it) => (
        <Badge key={it.key} tone="warning" appearance="soft" className={NO_BORDER}>
          {it.label} {formatQty(it.qty)} {it.unit}
        </Badge>
      ))}
    </>
  );

  const qty = (
    <>
      <span
        className={cn("text-lg font-semibold", lot.low && "text-destructive")}
      >
        {formatQty(lot.qty)}
      </span>{" "}
      <span className="text-sm text-muted-foreground">{product.unit}</span>
    </>
  );

  return (
    <div className="border-t border-border p-4">
      {/* วางแบบเดียวกับแถวล็อตในการ์ดสินค้า
          จอกว้าง: ข้อมูล | ยอด | ⋮ แถวเดียว
          จอแคบ: ยอดขึ้นไปอยู่ขวาของบรรทัดหัว ⋮ อยู่ขวาของบรรทัดวันที่รับ */}
      <div className="flex flex-col @3xl:flex-row @3xl:items-center @3xl:justify-between @3xl:gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              {showZone && <ZoneTag zone={lot.zone} />}
              <span className="font-semibold">{product.name}</span>
              {showChips && (
                <span className="hidden items-center gap-2 @3xl:flex">
                  {chips}
                </span>
              )}
            </div>
            <p className="shrink-0 text-right tabular-nums @3xl:hidden">{qty}</p>
          </div>

          {/* จอแคบ: ป้ายลงมาอยู่แถวของตัวเอง เลื่อนแนวนอนได้ */}
          {showChips && (
            <div
              className={cn(
                "mt-2 flex items-center gap-2 overflow-x-auto",
                "flex-nowrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
                "@3xl:hidden"
              )}
            >
              {chips}
            </div>
          )}

          <p className="mt-2 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{lot.code}</span>
          </p>
          {/* จอแคบ: ปุ่ม ⋮ อยู่ขวาของบรรทัดวันที่รับ ตามแบบ */}
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              รับ {lot.receivedAt} ({lot.ageDays} วัน) · {lot.packNote}
            </p>
            <div className="@3xl:hidden">
              <LotMenu lot={lot} />
            </div>
          </div>
        </div>

        {/* จอกว้าง: ยอด แล้วปุ่ม ⋮ ท้ายแถว */}
        <div className="hidden shrink-0 items-center gap-3 @3xl:flex">
          <p className="w-28 text-right tabular-nums">{qty}</p>
          <LotMenu lot={lot} />
        </div>
      </div>
    </div>
  );
}

/** โหมดโซน — หัวกลุ่มบอกว่าในโซนนี้มีกี่ล็อต กี่สินค้า */
export function ZoneGroups({
  groups,
  showChips,
}: {
  groups: LotGroup[];
  showChips: boolean;
}) {
  return (
    <div className="space-y-4">
      {groups.map((g) => (
        <section
          key={g.id}
          className="overflow-hidden rounded-xl border border-border bg-card"
        >
          <div className="flex items-center gap-2 p-4">
            {g.zone && <ZoneTag zone={g.zone} />}
            <div className="min-w-0">
              <h3 className="font-semibold">{g.title}</h3>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {g.rows.length} รายการ ·{" "}
                {new Set(g.rows.map((r) => r.product.id)).size} สินค้า
              </p>
            </div>
          </div>

          {g.rows.map((row) => (
            <LotRow
              key={row.lot.id}
              row={row}
              showZone={false}
              showChips={showChips}
            />
          ))}
        </section>
      ))}
    </div>
  );
}

/** โหมด FIFO — ไม่มีหัวกลุ่ม ล็อตเรียงตามอายุรวดเดียว */
export function FifoList({
  rows,
  showChips,
}: {
  rows: FlatLot[];
  showChips: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      {rows.map((row) => (
        <LotRow
          key={row.lot.id}
          row={row}
          showZone
          showChips={showChips}
        />
      ))}
    </div>
  );
}
