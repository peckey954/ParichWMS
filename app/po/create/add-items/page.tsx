"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ListFilterIcon, SearchIcon } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@peckey954/ui/components/ui/breadcrumb";
import { Button } from "@peckey954/ui/components/ui/button";
import { Checkbox } from "@peckey954/ui/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@peckey954/ui/components/ui/dialog";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@peckey954/ui/components/ui/input-group";
import { Badge } from "@peckey954/ui/components/ui/badge";
import { Separator } from "@peckey954/ui/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@peckey954/ui/components/ui/table";
import { cn } from "@peckey954/ui/lib/utils";
import { PrFilter, PR_VIEW_DEFAULT, isPrViewDefault, type PrView } from "@/components/pr/pr-filter";
import { parseDateSlash } from "@/components/date-select";
import {
  CardBox,
  CardRow,
  COL_FIRST,
  COL_LAST,
  EmptyDocs,
  HEAD_FIRST,
  HEAD_LAST,
  STICKY_HEAD,
  TableFrame,
  TablePager,
  paginate,
} from "@/components/stock/doc-parts";
import {
  formatPrQty,
  formatReasons,
  matchesPr,
  PR_CATEGORY_LABEL,
  PR_PRODUCTS,
  type PrCategoryId,
  type PrDoc,
} from "@/lib/pr";
import { matchesPoQueueChip, PO_QUEUE_CHIP_LABEL, PO_QUEUE_DOCS, type PoQueueChip } from "@/lib/po";

/* ------------------------------------------------------------------
   เพิ่มสินค้า — เข้ามาจากปุ่ม "+ เพิ่มสินค้า" ในหน้าสร้างใบสั่งซื้อ แทนที่
   กล่อง dialog เดิม (เลือกแค่ประเภท+สินค้าจากแคตตาล็อกล้วนๆ ไม่มีที่มา) ด้วย
   หน้าเต็มหน้าคล้ายแท็บ "ขอซื้อ" ของ /po จริงๆ — ติ๊กเลือกได้จากคิวใบขอซื้อ
   จริง ได้ข้อมูลอ้างอิง (ผู้ขอซื้อ/วันที่ต้องการ/เหตุผลการซื้อ) ติดมาด้วย

   ใบที่ถูกเพิ่มไปแล้วในใบร่างปัจจุบัน (พาสมาทาง query "ids") ไม่โผล่ในรายการ
   นี้อีก (เพิ่มซ้ำไม่ได้) ส่วนใบที่ "ยกเลิก" ไปแล้วก็ไม่โผล่เช่นกัน — เอาไป
   สร้างใบสั่งซื้อไม่ได้อยู่แล้ว ไม่มีชิป "ยกเลิก" ให้เลือกดูในหน้านี้เหมือน
   แท็บขอซื้อหลัก (สโคปหน้านี้แคบกว่า แค่ไว้เพิ่มของเข้าใบร่างเท่านั้น)

   ล็อกประเภทสินค้าให้ตรงกับของที่มีอยู่แล้วในใบร่าง (กติกาเดียวกับทั้งแอป —
   รวมได้เฉพาะประเภทเดียวกันในใบสั่งซื้อเดียว) — กรองใบคนละประเภทออกจากรายการ
   ไปเลย ไม่ใช่แค่โชว์ไว้แล้วกดไม่ได้ (ไม่งั้นต้องไล่หาเองว่าอันไหนกดได้ในรายการ
   ยาวๆ) ใบร่างว่างเปล่า (ยังไม่มีสินค้า หรือลบออกจนหมด) เท่านั้นที่ยังไม่ล็อก
   โชว์ทุกประเภทให้เลือกตั้งต้นใหม่

   กด "เพิ่มสินค้า" ที่แถบล่างแล้วพากลับไปหน้าสร้างใบสั่งซื้อ พร้อม ids รวม
   (ของเดิม + ที่เพิ่งติ๊กใหม่) ส่วนช่องอื่นๆ ที่กรอกไว้ในหน้าสร้างใบสั่งซื้อ
   (ประเภทการสั่งซื้อ/บริษัท/ช่วงวันที่/หมายเหตุ) พาไป-กลับทาง query param
   เหมือนกันเพื่อไม่ให้หายตอนกดย้อนกลับมาเพิ่มสินค้าเพิ่ม
------------------------------------------------------------------ */

const CHIPS: PoQueueChip[] = ["all", "urgent"];
const PAGE_SIZE = 15;

const URGENT_CHIP =
  "[--bdg-surface:var(--chip-orange)] [--bdg-text:var(--chip-orange-foreground)]";

export default function AddItemsPage() {
  return (
    <React.Suspense fallback={null}>
      <AddItemsContent />
    </React.Suspense>
  );
}

function AddItemsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const existingIds = React.useMemo(
    () => new Set((searchParams.get("ids") ?? "").split(",").filter(Boolean)),
    [searchParams]
  );

  // ประเภทสินค้าที่ล็อกไว้แล้วจากของที่มีอยู่ในใบร่าง — ใบว่างเปล่ายังไม่ล็อก
  const lockedCategory: PrCategoryId | null = React.useMemo(() => {
    if (existingIds.size === 0) return null;
    const first = PO_QUEUE_DOCS.find((d) => existingIds.has(d.id));
    return first?.categoryId ?? null;
  }, [existingIds]);

  // ตัวเลือกในหน้านี้ — เอาที่มีอยู่แล้วในใบร่างออก กับใบที่ยกเลิกไปแล้วออก
  // ล็อกประเภทไว้แล้ว (มีสินค้าอยู่ในใบร่างแล้วอย่างน้อยหนึ่งรายการ) กรองให้
  // เหลือแต่ประเภทเดียวกันไปเลย ไม่ต้องมาไล่หาเองว่าอันไหนกดได้ — ใบร่างว่าง
  // เปล่า (ลบสินค้าออกจนหมด) ถึงจะยังไม่ล็อก โชว์ทุกประเภทให้เลือกตั้งต้นใหม่
  const availableDocs = React.useMemo(
    () =>
      PO_QUEUE_DOCS.filter(
        (d) =>
          !existingIds.has(d.id) &&
          d.status !== "cancelled" &&
          (lockedCategory === null || d.categoryId === lockedCategory)
      ),
    [existingIds, lockedCategory]
  );

  const [chip, setChip] = React.useState<PoQueueChip>("all");
  const [query, setQuery] = React.useState("");
  const [view, setView] = React.useState<PrView>(PR_VIEW_DEFAULT);
  const [filterOpen, setFilterOpen] = React.useState(false);
  const filterActive = !isPrViewDefault(view);
  const [selected, setSelected] = React.useState<Set<string>>(new Set());

  const counts = React.useMemo(() => {
    const c: Record<PoQueueChip, number> = { all: 0, urgent: 0, cancelled: 0 };
    for (const d of availableDocs) {
      if (matchesPoQueueChip(d, "all")) c.all += 1;
      if (matchesPoQueueChip(d, "urgent")) c.urgent += 1;
    }
    return c;
  }, [availableDocs]);

  const visible = availableDocs.filter((d) => {
    if (!matchesPoQueueChip(d, chip)) return false;
    if (!matchesPr(d, query)) return false;

    const from = view.neededRange?.from;
    const to = view.neededRange?.to;
    if (from || to) {
      const needed = parseDateSlash(d.neededDate);
      if (!needed) return false;
      if (from && needed < from) return false;
      if (to && needed > to) return false;
    }

    if (view.codeQuery.trim() !== "") {
      if (!d.code.toLowerCase().includes(view.codeQuery.trim().toLowerCase())) return false;
    }

    if (view.categories.length > 0 && !view.categories.includes(d.categoryId)) return false;

    if (view.productIds.length > 0) {
      const matches = view.productIds.some((id) => {
        const p = PR_PRODUCTS.find((x) => x.id === id);
        return p && p.category === d.categoryId && p.name === d.productName && p.sub === d.productSub;
      });
      if (!matches) return false;
    }

    if (view.packings.length > 0 && (!d.packing || !view.packings.includes(d.packing))) {
      return false;
    }

    if (view.requesters.length > 0 && !view.requesters.includes(d.requester)) return false;

    return true;
  });

  function toggleOne(id: string, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function handleConfirm() {
    const sp = new URLSearchParams();
    sp.set("ids", [...existingIds, ...selected].join(","));
    for (const key of ["poType", "company", "from", "to", "note"]) {
      const v = searchParams.get(key);
      if (v) sp.set(key, v);
    }
    router.push(`/po/create?${sp.toString()}`);
  }

  return (
    <>
      <main className="mx-auto w-full max-w-7xl px-4 pt-6 pb-28 sm:px-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">ระบบ</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/po">สั่งซื้อ PO</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-primary">เพิ่มสินค้า</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="mt-2 min-w-0 sm:mt-3">
          <h1 className="text-2xl font-semibold tracking-tight">เพิ่มสินค้า</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            เลือกใบขอซื้อที่ต้องการเพิ่มเข้าใบสั่งซื้อนี้
          </p>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto flex-nowrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div role="tablist" aria-label="สถานะใบขอซื้อ" className="flex shrink-0 items-center gap-2">
              {CHIPS.map((c) => {
                const on = chip === c;
                return (
                  <button
                    key={c}
                    type="button"
                    role="tab"
                    onClick={() => setChip(c)}
                    aria-selected={on}
                    className={cn(
                      "shrink-0 rounded-full border px-3 py-1 text-sm whitespace-nowrap transition-colors",
                      on
                        ? "border-primary bg-brand font-medium text-primary"
                        : "border-border text-foreground hover:bg-accent-hover"
                    )}
                  >
                    {PO_QUEUE_CHIP_LABEL[c]} ({counts[c]})
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <InputGroup className="min-w-0 flex-1 bg-card">
            <InputGroupAddon align="inline-start">
              <SearchIcon />
            </InputGroupAddon>
            <InputGroupInput
              placeholder="ค้นหา..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </InputGroup>

          <Dialog open={filterOpen} onOpenChange={setFilterOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline-primary"
                size="icon"
                aria-label="ตัวกรองและการแสดงผล"
                className="relative shrink-0"
              >
                <ListFilterIcon />
                {filterActive && (
                  <span className="absolute top-1 right-1 size-2 rounded-full bg-primary" />
                )}
              </Button>
            </DialogTrigger>
            <DialogContent
              aria-describedby={undefined}
              className="flex max-h-[85svh] flex-col gap-0 overflow-hidden! p-0 sm:max-w-md [&_[data-slot=dialog-close]]:focus:ring-0 [&_[data-slot=dialog-close]]:focus:ring-offset-0 [&_[data-slot=dialog-close]]:focus-visible:ring-2 [&_[data-slot=dialog-close]]:focus-visible:ring-ring [&_[data-slot=dialog-close]]:focus-visible:ring-offset-2"
            >
              <DialogHeader className="px-4 pt-4 text-left">
                <DialogTitle>ตัวกรองและการแสดงผล</DialogTitle>
              </DialogHeader>
              <PrFilter
                view={view}
                onApply={(next) => {
                  setView(next);
                  setFilterOpen(false);
                }}
              />
            </DialogContent>
          </Dialog>
        </div>

        <div className="mt-4">
          <AddItemsList docs={visible} selected={selected} onToggleOne={toggleOne} />
        </div>
      </main>

      {/* ---------- แถบปุ่มล่าง ---------- */}
      <div className="sticky bottom-0 z-30 border-t border-border bg-surface">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Button variant="outline-primary" onClick={() => router.back()}>
            ย้อนกลับ
          </Button>
          <Button onClick={handleConfirm} disabled={selected.size === 0}>
            เพิ่มสินค้า{selected.size > 0 ? ` (${selected.size})` : ""}
          </Button>
        </div>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------
   รายชื่อใบขอซื้อให้เลือกเพิ่ม — โครงหน้าตาเดียวกับ components/po/po-list.tsx
   (การ์ด/ตาราง คอลัมน์เดียวกัน) แต่ตัดปุ่ม "สร้างใบสั่งซื้อ"/ถังขยะต่อแถวออก
   เพราะบริบทหน้านี้แคบกว่า — แค่ติ๊กเลือกไว้ ยืนยันทีเดียวที่แถบล่างเท่านั้น

   ไม่มีกล่องติ๊กที่กดไม่ได้อีกแล้ว (docs ที่ส่งมาถูกกรองเหลือแต่ประเภทเดียวกัน
   ไปแล้วจากหน้าเรียก) ทุกแถวที่เห็นกดเลือกได้หมด */
function AddItemsList({
  docs,
  selected,
  onToggleOne,
}: {
  docs: PrDoc[];
  selected: Set<string>;
  onToggleOne: (id: string, checked: boolean) => void;
}) {
  const [page, setPage] = React.useState(1);
  const { pages, safe, slice } = paginate(docs, page, PAGE_SIZE);

  if (docs.length === 0) {
    return <EmptyDocs title="ไม่พบใบขอซื้อ" hint="ลองใช้คำค้นสั้นลง" />;
  }

  return (
    <>
      {/* ---------- จอแคบ: การ์ด ---------- */}
      <div className="@3xl:hidden">
        <div className="space-y-4">
          {slice.map((d) => (
            <AddItemsCard
              key={d.id}
              doc={d}
              checked={selected.has(d.id)}
              onToggle={(checked) => onToggleOne(d.id, checked)}
            />
          ))}
        </div>
        <TablePager page={safe} pages={pages} onChange={setPage} />
      </div>

      {/* ---------- จอกว้าง: ตาราง ---------- */}
      <div className="hidden @3xl:block">
        <TableFrame>
          <Table>
            <TableHeader className={STICKY_HEAD}>
              <TableRow>
                <TableHead className={cn(HEAD_FIRST, "min-w-48")}>เลขที่ใบขอซื้อ</TableHead>
                <TableHead>สินค้า</TableHead>
                <TableHead>ประเภท</TableHead>
                <TableHead>หมวด</TableHead>
                <TableHead>บรรจุภัณฑ์</TableHead>
                <TableHead className="text-right">ขอซื้อ</TableHead>
                <TableHead>เหตุผลการซื้อ</TableHead>
                <TableHead>วันที่ต้องการสินค้า</TableHead>
                <TableHead className={HEAD_LAST}>ผู้ขอซื้อ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {slice.map((d) => {
                return (
                  <TableRow key={d.id} className="hover:bg-transparent">
                    <TableCell className={COL_FIRST}>
                      {/* label ครอบทั้งกล่องติ๊ก+เลขที่ใบ+วันที่ — คลิกได้ทั้งก้อน
                          ไม่ใช่แค่กล่องติ๊กเล็กๆ (ดู po-list.tsx pattern เดียวกัน)
                          เลขที่ใบไม่ใช่ลิงก์ไปหน้าใบขอซื้ออีกต่อไป ข้อมูลครบอยู่
                          ในตารางนี้แล้ว */}
                      <label className="flex items-start gap-3 py-1 -my-1 cursor-pointer">
                        <Checkbox
                          aria-label={`เลือก ${d.code}`}
                          className="mt-0.5"
                          checked={selected.has(d.id)}
                          onCheckedChange={(v) => onToggleOne(d.id, v !== false)}
                        />
                        <div>
                          <span className="block font-medium whitespace-nowrap">{d.code}</span>
                          <span className="block text-sm whitespace-nowrap text-muted-foreground">
                            {d.createdAt}
                          </span>
                        </div>
                      </label>
                    </TableCell>
                    <TableCell>
                      <span className="block font-medium whitespace-nowrap">
                        {d.productName}
                        {d.productSub && ` ${d.productSub}`}
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {PR_CATEGORY_LABEL[d.categoryId]}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{d.group}</TableCell>
                    <TableCell className="whitespace-nowrap">{d.packing ?? "-"}</TableCell>
                    <TableCell className="text-right whitespace-nowrap tabular-nums">
                      {formatPrQty(d.qty)} {d.unit}
                    </TableCell>
                    <TableCell
                      className="max-w-40 truncate"
                      title={formatReasons(d.reasons)}
                    >
                      {formatReasons(d.reasons)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <span className="block">{d.neededDate}</span>
                      {d.urgent && (
                        <Badge
                          appearance="soft"
                          className={cn("mt-1 [--bdg-border:transparent] font-semibold", URGENT_CHIP)}
                        >
                          เร่งด่วน
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className={COL_LAST}>
                      <span className="block whitespace-nowrap">{d.requester}</span>
                      {d.editedBy && (
                        <span className="block text-sm whitespace-nowrap text-muted-foreground">
                          แก้ไขล่าสุด: {d.editedBy}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          <TablePager page={safe} pages={pages} onChange={setPage} />
        </TableFrame>
      </div>
    </>
  );
}

function AddItemsCard({
  doc: d,
  checked,
  onToggle,
}: {
  doc: PrDoc;
  checked: boolean;
  onToggle: (checked: boolean) => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <label className="flex items-start gap-3 py-1 -my-1 cursor-pointer">
        <Checkbox
          aria-label={`เลือก ${d.code}`}
          className="mt-0.5"
          checked={checked}
          onCheckedChange={(v) => onToggle(v !== false)}
        />
        <div className="min-w-0">
          <span className="block font-semibold">{d.code}</span>
          <span className="block text-sm whitespace-nowrap text-muted-foreground">
            {d.createdAt}
          </span>
        </div>
      </label>

      <CardBox className="mt-3">
        <p className="text-base font-semibold">
          {d.productName}
          {d.productSub && ` ${d.productSub}`}
        </p>
        <p className="mt-2 text-sm">
          {PR_CATEGORY_LABEL[d.categoryId]} <span className="text-border" aria-hidden>|</span> {d.group}
          {d.packing && (
            <>
              {" "}
              <span className="text-border" aria-hidden>|</span> {d.packing}
            </>
          )}
        </p>
      </CardBox>

      <dl className="mt-3 space-y-1.5 text-sm">
        <CardRow label={`ขอซื้อ (${d.unit})`}>{formatPrQty(d.qty)}</CardRow>
        <CardRow label="เหตุผลการซื้อ">{formatReasons(d.reasons)}</CardRow>
        <CardRow label="วันที่ต้องการสินค้า">{d.neededDate}</CardRow>
        <CardRow label="ผู้ขอซื้อ">{d.requester}</CardRow>
        {d.editedBy && <CardRow label="แก้ไขล่าสุด">{d.editedBy}</CardRow>}
      </dl>

      {d.urgent && (
        <>
          <Separator className="mt-3" />
          <div className="mt-3">
            <Badge appearance="soft" className={cn("[--bdg-border:transparent] font-semibold", URGENT_CHIP)}>
              เร่งด่วน
            </Badge>
          </div>
        </>
      )}
    </div>
  );
}
