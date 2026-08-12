"use client";

import * as React from "react";
import { Badge } from "@peckey954/ui/components/ui/badge";
import { Button } from "@peckey954/ui/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
} from "@peckey954/ui/components/ui/collapsible";
import { cn } from "@peckey954/ui/lib/utils";
import {
  CATEGORY_LABEL,
  CONDITION_LABEL,
  formatQty,
  pendingEntries,
  productTotal,
  rollupPending,
  zoneCount,
  type Lot,
  type LotCondition,
  type Product,
} from "@/lib/general-stock";

/* ------------------------------------------------------------------
   Version B — ป้ายมีสีทุกใบเหมือนแบบร่างเดิม

   สีของสภาพล็อตที่ DS ยังไม่มี tone ให้ (ม่วง/ฟ้า) ใช้วิธี override
   ตัวแปร --bdg-* ของ Badge เอง ซึ่งเป็นช่องทางที่ component เปิดไว้
   ให้ขยาย tone อยู่แล้ว จึงยังเป็น token ล้วน ไม่มีสี hardcode
------------------------------------------------------------------ */

const CONDITION_CHIP: Record<LotCondition, string> = {
  repack:
    "[--bdg-surface:var(--tone-violet)] [--bdg-text:var(--tone-violet-foreground)] [--bdg-border:var(--tone-violet)]",
  accepted:
    "[--bdg-surface:var(--tone-blue)] [--bdg-text:var(--tone-blue-foreground)] [--bdg-border:var(--tone-blue)]",
  sweep:
    "[--bdg-surface:var(--tone-blue)] [--bdg-text:var(--tone-blue-foreground)] [--bdg-border:var(--tone-blue)]",
};

function ConditionChip({ condition }: { condition: LotCondition }) {
  return (
    <Badge appearance="soft" className={cn(CONDITION_CHIP[condition])}>
      {CONDITION_LABEL[condition]}
    </Badge>
  );
}

function CategoryChip({ product }: { product: Product }) {
  return (
    <Badge tone="brand" appearance="outline">
      {CATEGORY_LABEL[product.category]}
    </Badge>
  );
}

/** ป้ายพื้นอ่อนในหน้านี้ไม่มีเส้นขอบ ให้ดูเป็นพื้นสีล้วนก้อนเดียว */
const NO_BORDER = "[--bdg-border:transparent]";

function PendingChips({
  pending,
  unit,
}: {
  pending: ReturnType<typeof rollupPending>;
  unit: string;
}) {
  const items = pendingEntries(pending, unit);
  return (
    <>
      {items.map((it) => (
        <Badge
          key={it.key}
          tone="warning"
          appearance="soft"
          className={NO_BORDER}
        >
          {it.label} {formatQty(it.qty)} {it.unit}
        </Badge>
      ))}
    </>
  );
}

/** ป้ายสต็อกต่ำ — แดงสดกว่าค่าเริ่มต้นของ DS ดูรายละเอียดที่ app/globals.css */
function LowChip() {
  return (
    <Badge
      tone="danger"
      appearance="soft"
      className={cn(NO_BORDER, "[--bdg-text:var(--danger-strong)] font-semibold")}
    >
      สต็อกต่ำ
    </Badge>
  );
}

/**
 * จอกว้าง — display:contents ยุบกล่องนี้ทิ้ง chip จึงไหลต่อท้ายชื่อในแถวเดิม
 * จอแคบ — ซ่อน แล้วไปใช้ ChipScroller แทน
 */
function ChipsInline({ children }: { children: React.ReactNode }) {
  return <div className="hidden @3xl:contents">{children}</div>;
}

/**
 * แถวชิปของจอแคบ — บรรทัดเดียว เลื่อนแนวนอน ไม่ตัดบรรทัด
 *
 * ไม่ใช้ระยะขอบติดลบแล้ว กล่องนี้จึงกว้างเท่าเนื้อในการ์ด
 * ชิปตัวสุดท้ายจะหยุดห่างจากขอบการ์ด 16 เสมอ ไม่วิ่งไปชนขอบเวลาเลื่อน
 * ต้องวางเป็นลูกโดยตรงของกล่องที่มี px-4 ไม่งั้นระยะจะไม่ตรง
 */
function ChipScroller({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "mt-2 flex items-center gap-2 overflow-x-auto",
        "flex-nowrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        "@3xl:hidden"
      )}
    >
      {children}
    </div>
  );
}

/**
 * ป้ายโซน — รหัสตำแหน่งในคลัง ตัวอักษรสีแบรนด์บนพื้นเทาอ่อน
 * ไม่ระบุฟอนต์ จึงรับ font-sans (Sarabun) ต่อมาจากข้างบน
 */
function ZoneTag({ zone }: { zone: string }) {
  return (
    <span className="rounded-md bg-secondary px-2.5 py-0.5 text-sm font-semibold text-primary">
      {zone}
    </span>
  );
}

/**
 * ปุ่มโชว์ตลอด
 * จอแคบ — เรียงเต็มความกว้างสองปุ่ม แบ่งครึ่งเท่ากัน
 * จอกว้าง — อยู่ท้ายแถว กว้างเท่ากันทั้งคู่ (w-24) ไม่ใช่กว้างตามความยาวคำ
 */
function LotActions() {
  return (
    <div className="flex w-full gap-2 @3xl:w-auto">
      <Button
        variant="outline-primary"
        size="sm"
        className="flex-1 @3xl:w-24 @3xl:flex-none"
      >
        ย้าย
      </Button>
      <Button
        variant="outline-primary"
        size="sm"
        className="flex-1 @3xl:w-24 @3xl:flex-none"
      >
        ปรับปรุง
      </Button>
    </div>
  );
}

function LotRow({
  lot,
  unit,
  showChips,
  showActions,
}: {
  lot: Lot;
  unit: string;
  showChips: boolean;
  showActions: boolean;
}) {
  const hasChips =
    lot.condition !== undefined ||
    pendingEntries(lot.pending, unit).length > 0;

  const chips = (
    <>
      {lot.condition && <ConditionChip condition={lot.condition} />}
      <PendingChips pending={lot.pending} unit={unit} />
    </>
  );

  return (
    <div className="border-t border-border p-4">
      {/* จอกว้าง: ข้อมูล | ปุ่ม | ยอด อยู่แถวเดียว จัดกึ่งกลางแนวตั้ง
          จอแคบ: ยอดขึ้นไปอยู่ขวาของหัวแถว แล้วปุ่มลงมาเต็มความกว้างข้างล่าง */}
      <div className="flex flex-col gap-3 @3xl:flex-row @3xl:items-center @3xl:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <ZoneTag zone={lot.zone} />
              <span className="font-medium">{lot.code}</span>
              {showChips && hasChips && <ChipsInline>{chips}</ChipsInline>}
            </div>

            <p className="shrink-0 text-right tabular-nums @3xl:hidden">
              <span
                className={cn(
                  "text-lg font-semibold",
                  lot.low && "text-destructive"
                )}
              >
                {formatQty(lot.qty)}
              </span>{" "}
              <span className="text-sm text-muted-foreground">{unit}</span>
            </p>
          </div>

          {/* จอแคบเท่านั้น — แถวชิปกว้างเท่าการ์ด เลื่อนดูได้ */}
          {showChips && hasChips && <ChipScroller>{chips}</ChipScroller>}

          <p className="mt-2 text-sm text-muted-foreground">
            รับ {lot.receivedAt} ({lot.ageDays} วัน) · {lot.packNote}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          {showActions && <LotActions />}
          <p className="hidden w-28 text-right tabular-nums @3xl:block">
            <span
              className={cn(
                "text-lg font-semibold",
                lot.low && "text-destructive"
              )}
            >
              {formatQty(lot.qty)}
            </span>{" "}
            <span className="text-sm text-muted-foreground">{unit}</span>
          </p>
        </div>
      </div>
    </div>
  );
}

export function ProductCard({
  product,
  showLots,
  showChips,
  showActions,
}: {
  product: Product;
  /** เปิด/ปิดรายการล็อตพร้อมกันทั้งหน้า สั่งจากตัวกรอง ไม่มีปุ่มแยกรายใบ */
  showLots: boolean;
  showChips: boolean;
  showActions: boolean;
}) {
  const total = productTotal(product);
  const pending = rollupPending(product);

  const chips = (
    <>
      <CategoryChip product={product} />
      <Badge tone="neutral" appearance="soft" className={NO_BORDER}>
        {product.packing}
      </Badge>
      {product.low && <LowChip />}
      <PendingChips pending={pending} unit={product.unit} />
    </>
  );

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <Collapsible open={showLots}>
        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            {/* จอกว้าง: ชิปไหลต่อท้ายชื่อในแถวเดียวกัน */}
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1.5">
              <span className="font-semibold">{product.name}</span>
              {showChips && <ChipsInline>{chips}</ChipsInline>}
            </div>

            <p className="shrink-0 text-right tabular-nums">
              <span
                className={cn(
                  "text-lg font-semibold",
                  product.low && "text-destructive"
                )}
              >
                {formatQty(total)}
              </span>{" "}
              <span className="text-sm text-muted-foreground">
                {product.unit}
              </span>
            </p>
          </div>

          {/* จอแคบเท่านั้น — แถวชิปกว้างเท่าการ์ด เลื่อนดูได้ */}
          {showChips && <ChipScroller>{chips}</ChipScroller>}

          {/* บรรทัดนับ เป็นข้อความเฉย ๆ ไม่ใช่ปุ่ม ปุ่มหุบ/กางย้ายไปอยู่ท้ายการ์ด */}
          <p className="mt-2 text-sm text-muted-foreground">
            {product.lots.length} รายการ · {zoneCount(product)} โซน
          </p>
        </div>

        <CollapsibleContent>
          {product.lots.map((lot) => (
            <LotRow
              key={lot.id}
              lot={lot}
              unit={product.unit}
              showChips={showChips}
              showActions={showActions}
            />
          ))}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
