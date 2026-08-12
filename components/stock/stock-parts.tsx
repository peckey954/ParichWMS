"use client";

import * as React from "react";
import { ChevronDownIcon } from "lucide-react";
import { Badge } from "@peckey954/ui/components/ui/badge";
import { Button } from "@peckey954/ui/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
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
        <Badge key={it.key} tone="warning" appearance="soft">
          {it.label} {formatQty(it.qty)} {it.unit}
        </Badge>
      ))}
    </>
  );
}

/**
 * แถวของ chip
 * จอแคบ — บรรทัดเดียว ไม่ตัดบรรทัด เลื่อนแนวนอนเอาถ้ายาวเกิน (ซ่อนแถบเลื่อน)
 * จอกว้าง — @3xl:contents ยุบกล่องนี้ทิ้ง chip จึงไหลต่อท้ายในแถวเดิม
 */
function ChipRow({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "flex min-w-0 items-center gap-2 overflow-x-auto",
        "flex-nowrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        "@3xl:contents"
      )}
    >
      {children}
    </div>
  );
}

function ZoneTag({ zone }: { zone: string }) {
  return (
    <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground">
      {zone}
    </span>
  );
}

/** ปุ่มโชว์ตลอด — จอกว้างอยู่ท้ายแถว จอแคบเรียงเต็มความกว้างสองปุ่ม */
function LotActions() {
  return (
    <div className="flex w-full gap-2 @3xl:w-auto">
      <Button variant="outline-primary" size="sm" className="flex-1 @3xl:flex-none">
        ย้าย
      </Button>
      <Button variant="outline-primary" size="sm" className="flex-1 @3xl:flex-none">
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
  return (
    <div className="border-t border-border px-4 py-3">
      {/* จอกว้าง: ข้อมูล | ปุ่ม | ยอด อยู่แถวเดียว
          จอแคบ: ยอดขึ้นไปอยู่ขวาของหัวแถว แล้วปุ่มลงมาเต็มความกว้างข้างล่าง */}
      <div className="flex flex-col gap-3 @3xl:flex-row @3xl:items-start @3xl:justify-between">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-start justify-between gap-3">
            {/* จอแคบ: โซน+เลขล็อตบรรทัดหนึ่ง แล้ว chip ลงบรรทัดใหม่
                จอกว้าง: @3xl:contents ทำให้ chip กลับไปไหลต่อท้ายในแถวเดียวกัน */}
            <div className="flex min-w-0 flex-col gap-2 @3xl:flex-row @3xl:flex-wrap @3xl:items-center">
              <div className="flex items-center gap-2">
                <ZoneTag zone={lot.zone} />
                <span className="font-medium">{lot.code}</span>
              </div>

              {showChips &&
                (lot.condition ||
                  pendingEntries(lot.pending, unit).length > 0) && (
                  <ChipRow>
                    {lot.condition && (
                      <ConditionChip condition={lot.condition} />
                    )}
                    <PendingChips pending={lot.pending} unit={unit} />
                  </ChipRow>
                )}
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

          <p className="text-sm text-muted-foreground">
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
  defaultOpen,
  showChips,
  showActions,
}: {
  product: Product;
  defaultOpen: boolean;
  showChips: boolean;
  showActions: boolean;
}) {
  const total = productTotal(product);
  const pending = rollupPending(product);

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <Collapsible defaultOpen={defaultOpen}>
        <div className="px-4 py-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1 space-y-2">
              {/* จอแคบ: ชื่อสินค้าบรรทัดหนึ่ง แล้ว chip ทั้งชุดลงบรรทัดใหม่
                  จอกว้าง: @3xl:contents ทำให้ chip กลับไปไหลต่อท้ายชื่อ */}
              <div className="flex flex-col gap-2 @3xl:flex-row @3xl:flex-wrap @3xl:items-center @3xl:gap-x-2 @3xl:gap-y-1.5">
                <span className="font-semibold">{product.name}</span>

                {showChips && (
                  <ChipRow>
                    <CategoryChip product={product} />
                    <Badge tone="neutral" appearance="soft">
                      {product.packing}
                    </Badge>
                    {product.low && (
                      <Badge tone="danger" appearance="soft">
                        สต็อกต่ำ
                      </Badge>
                    )}
                    <PendingChips pending={pending} unit={product.unit} />
                  </ChipRow>
                )}
              </div>

              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  className="group flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                >
                  {product.lots.length} รายการ · {zoneCount(product)} โซน
                  <ChevronDownIcon className="size-4 transition-transform group-data-[state=open]:rotate-180" />
                </button>
              </CollapsibleTrigger>
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
