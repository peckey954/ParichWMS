"use client";

import * as React from "react";
import {
  ChevronDownIcon,
  GiftIcon,
  MoreHorizontalIcon,
  PackageIcon,
  PencilIcon,
  TagIcon,
  TruckIcon,
  WrenchIcon,
} from "lucide-react";
import { Badge } from "@peckey954/ui/components/ui/badge";
import { Button } from "@peckey954/ui/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@peckey954/ui/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@peckey954/ui/components/ui/dropdown-menu";
import { cn } from "@peckey954/ui/lib/utils";
import {
  CATEGORY_LABEL,
  CONDITION_LABEL,
  formatQty,
  pendingEntries,
  productTotal,
  rollupPending,
  zoneCount,
  type CategoryId,
  type Lot,
  type Product,
} from "@/lib/general-stock";

export const CATEGORY_ICON: Record<
  CategoryId,
  React.ComponentType<{ className?: string }>
> = {
  sack: PackageIcon,
  sticker: TagIcon,
  giveaway: GiftIcon,
  lineSupply: WrenchIcon,
};

/**
 * หัวข้อกลุ่มประเภทสินค้า
 *
 * นี่คือหัวใจของการแก้ปัญหา badge กลืนกัน — ประเภทสินค้าเป็น "โครงสร้างของหน้า"
 * ไม่ใช่สถานะของแถว จึงยกออกมาเป็นหัวข้อกลุ่มที่มีไอคอน แทนที่จะเป็นชิปใบหนึ่ง
 * ที่ไปยืนแข่งกับสถานะอื่นในแถวเดียวกัน
 */
export function CategoryHeader({
  category,
  count,
}: {
  category: CategoryId;
  count: number;
}) {
  const Icon = CATEGORY_ICON[category];
  return (
    <div className="flex items-center gap-3 pt-2">
      <span className="flex size-9 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
        <Icon className="size-4.5" />
      </span>
      <div>
        <h2 className="text-base font-semibold tracking-tight">
          {CATEGORY_LABEL[category]}
        </h2>
        <p className="text-sm text-muted-foreground">{count} สินค้า</p>
      </div>
      <div className="ml-3 h-px flex-1 bg-border" />
    </div>
  );
}

/* ------------------------------------------------------------------
   ลำดับชั้นของป้าย — ดังจากบนลงล่าง
   1. ต้องจัดการ      solid   (สต็อกต่ำ)
   2. มีของค้าง       outline สีเตือน (รอรับเข้า / รอจ่าย / รอคืน)
   3. ข้อมูลประกอบ    outline สีกลาง (สภาพล็อต)
   4. สเปก/โซน        ข้อความเปล่า ไม่ใช่ป้าย
------------------------------------------------------------------ */

function LowBadge() {
  return (
    <Badge tone="danger" appearance="solid">
      สต็อกต่ำ
    </Badge>
  );
}

function PendingBadges({
  pending,
  unit,
  legacy,
}: {
  pending: ReturnType<typeof rollupPending>;
  unit: string;
  legacy: boolean;
}) {
  const items = pendingEntries(pending, unit);
  if (items.length === 0) return null;
  return (
    <>
      {items.map((it) => (
        <Badge
          key={it.key}
          tone="warning"
          appearance={legacy ? "soft" : "outline"}
        >
          {it.label} {formatQty(it.qty)} {it.unit}
        </Badge>
      ))}
    </>
  );
}

function ConditionBadge({
  condition,
  legacy,
}: {
  condition: NonNullable<Lot["condition"]>;
  legacy: boolean;
}) {
  return (
    <Badge tone={legacy ? "brand" : "neutral"} appearance={legacy ? "soft" : "outline"}>
      {CONDITION_LABEL[condition]}
    </Badge>
  );
}

function ZoneTag({ zone }: { zone: string }) {
  return (
    <span className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
      {zone}
    </span>
  );
}

function LotActions({ compactOnly }: { compactOnly?: boolean }) {
  return (
    <>
      {/* จอกว้าง: ปุ่มเต็ม — จอแคบ: ยุบเป็นเมนูจุดสามจุด ไม่กินความสูง 2 แถว */}
      <div className={cn("hidden gap-2", !compactOnly && "@3xl:flex")}>
        <Button variant="outline-primary" size="sm">
          ย้าย
        </Button>
        <Button variant="outline-primary" size="sm">
          ปรับปรุง
        </Button>
      </div>
      <div className={cn("flex", !compactOnly && "@3xl:hidden")}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label="การจัดการล็อต">
              <MoreHorizontalIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <TruckIcon />
              ย้ายโซน
            </DropdownMenuItem>
            <DropdownMenuItem>
              <PencilIcon />
              ปรับปรุงยอด
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );
}

function LotRow({
  lot,
  unit,
  legacy,
}: {
  lot: Lot;
  unit: string;
  legacy: boolean;
}) {
  return (
    <div className="border-t border-border px-4 py-3">
      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <ZoneTag zone={lot.zone} />
            <span className="font-medium">{lot.code}</span>
            {lot.condition && (
              <ConditionBadge condition={lot.condition} legacy={legacy} />
            )}
            <PendingBadges
              pending={lot.pending}
              unit={unit}
              legacy={legacy}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            รับ {lot.receivedAt} ({lot.ageDays} วัน) · {lot.packNote}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <LotActions />
          <p className="w-24 text-right tabular-nums">
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
  legacy,
  defaultOpen,
}: {
  product: Product;
  legacy: boolean;
  defaultOpen: boolean;
}) {
  // ปล่อยให้ Collapsible คุมสถานะเอง แล้วให้ผู้เรียกใช้ key รีเซ็ตตอนสั่งย่อ/กางทั้งหมด
  // วิธีนี้ไม่ต้อง sync state ด้วย useEffect ซึ่งผิดกฎ react-hooks/set-state-in-effect
  const total = productTotal(product);
  const pending = rollupPending(product);
  const Icon = CATEGORY_ICON[product.category];

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <Collapsible defaultOpen={defaultOpen}>
        <div className="px-4 py-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
                <span className="font-semibold">{product.name}</span>

                {/* แบบเดิม: ประเภทสินค้าเป็นชิปใบหนึ่งในแถวเดียวกับสถานะ
                    แบบใหม่: ยกไปเป็นหัวข้อกลุ่ม เหลือแค่ไอคอนจาง ๆ ไว้อ้างอิง */}
                {legacy ? (
                  <Badge tone="brand" appearance="soft">
                    {CATEGORY_LABEL[product.category]}
                  </Badge>
                ) : (
                  <Icon
                    className="size-4 shrink-0 text-muted-foreground"
                    aria-hidden
                  />
                )}

                {legacy ? (
                  <Badge tone="neutral" appearance="soft">
                    {product.packing}
                  </Badge>
                ) : (
                  <span className="text-sm text-muted-foreground">
                    · {product.packing}
                  </span>
                )}

                {product.low && <LowBadge />}
                <PendingBadges
                  pending={pending}
                  unit={product.unit}
                  legacy={legacy}
                />
              </div>

              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  className="group flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                >
                  {product.lots.length} ล็อต · {zoneCount(product)} โซน
                  {/* หมุนลูกศรจาก data-state ของ Radix ไม่ต้องถือ state ใน JS */}
                  <ChevronDownIcon className="size-4 transition-transform group-data-[state=open]:rotate-180" />
                </button>
              </CollapsibleTrigger>
            </div>

            <p className="shrink-0 text-right tabular-nums">
              <span
                className={cn(
                  "text-xl font-semibold",
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
              legacy={legacy}
            />
          ))}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
