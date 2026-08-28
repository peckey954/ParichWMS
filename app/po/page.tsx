"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ListFilterIcon, RotateCcwIcon, SearchIcon } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@peckey954/ui/components/ui/alert-dialog";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@peckey954/ui/components/ui/breadcrumb";
import { Button } from "@peckey954/ui/components/ui/button";
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
import { Label } from "@peckey954/ui/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@peckey954/ui/components/ui/tabs";
import { cn } from "@peckey954/ui/lib/utils";
import { toast } from "sonner";
import { DateRangeSelect, DateSelect, parseDateSlash, type DateRange } from "@/components/date-select";
import { useDevicePreview, useScrollState } from "@/components/device-preview";
import { EmptyDocs } from "@/components/stock/doc-parts";
import { BackToTop, StickyToolbar } from "@/components/sticky-toolbar";
import { PrFilter, PR_VIEW_DEFAULT, isPrViewDefault, type PrView } from "@/components/pr/pr-filter";
import { PoList } from "@/components/po/po-list";
import { PoOrderList } from "@/components/po/po-order-list";
import { matchesPr, PR_PRODUCTS, type PrCategoryId, type PrDoc } from "@/lib/pr";
import {
  matchesPoOrder,
  matchesPoQueueChip,
  PO_ORDER_DOCS,
  PO_QUEUE_CHIP_LABEL,
  PO_QUEUE_DOCS,
  PO_STATUS_LABEL,
  type PoQueueChip,
  type PoStatus,
} from "@/lib/po";

/* ------------------------------------------------------------------
   สั่งซื้อ PO — หน้ารวมงานจัดซื้อ สามช่วง

   แท็บใหญ่ (ขอซื้อ/สั่งซื้อ/ซื้อแล้ว) เป็นสามกองงานคนละแบบ ไม่ใช่ตัวกรอง
   ของกองเดียวกัน จึงไม่ล็อกอยู่ในแถบติดบนเหมือนชิป — ตามมาตรฐานเดียวกับ
   หน้าสต็อกทั่วไป มีแค่แท็บ "ขอซื้อ" เท่านั้นที่เปิดใช้งานตามไฟล์ออกแบบ

   ในแท็บ "ขอซื้อ" ชิปสถานะเลือกได้ทีละอัน ("ทั้งหมด" เป็นค่าเริ่มต้น)
   สลับชิปแล้วเลื่อนจอไปจุดเริ่มรายการทันที ตามมาตรฐานเดียวกับหน้าขอซื้อ PR
------------------------------------------------------------------ */

const CHIPS: PoQueueChip[] = ["all", "urgent", "cancelled"];

export default function PoPage() {
  const router = useRouter();
  const { framed } = useDevicePreview();
  const { hidden, showTop, scrollToTop, scrollIntoTop } = useScrollState();

  const [tab, setTab] = React.useState<"queue" | "po" | "done">("po");

  // ลบแบบเดโม — เอาออกจากรายการที่หน้านี้ถือไว้เอง ไม่ได้แตะข้อมูลต้นทาง
  const [removedIds, setRemovedIds] = React.useState<Set<string>>(new Set());
  const docs = React.useMemo(
    () => PO_QUEUE_DOCS.filter((d) => !removedIds.has(d.id)),
    [removedIds]
  );

  const [chip, setChip] = React.useState<PoQueueChip>("all");
  const [query, setQuery] = React.useState("");
  const [quickDate, setQuickDate] = React.useState<Date>();
  const [view, setView] = React.useState<PrView>(PR_VIEW_DEFAULT);
  const [filterOpen, setFilterOpen] = React.useState(false);
  const filterActive = !isPrViewDefault(view);

  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [pendingDelete, setPendingDelete] = React.useState<PrDoc | null>(null);

  // ---------- แท็บ "สั่งซื้อ" ----------
  const [poChip, setPoChip] = React.useState<PoStatus>("pending");
  const [poQuery, setPoQuery] = React.useState("");
  const [poDateRange, setPoDateRange] = React.useState<DateRange>();
  const [poFilterOpen, setPoFilterOpen] = React.useState(false);
  const poFilterActive = !!poDateRange?.from;
  const poCounts = React.useMemo(() => {
    const c: Record<PoStatus, number> = { pending: 0, cancelled: 0 };
    for (const d of PO_ORDER_DOCS) c[d.status] += 1;
    return c;
  }, []);
  const poVisible = PO_ORDER_DOCS.filter((d) => {
    if (d.status !== poChip) return false;
    if (!matchesPoOrder(d, poQuery)) return false;

    // ช่วงวันที่คาดว่าสินค้าจะเข้าของใบนั้น "ทับซ้อน" กับช่วงที่เลือกกรองไว้ไหม
    if (poDateRange?.from || poDateRange?.to) {
      const poFrom = parseDateSlash(d.expectedFrom);
      const poTo = parseDateSlash(d.expectedTo);
      if (!poFrom || !poTo) return false;
      if (poDateRange.from && poTo < poDateRange.from) return false;
      if (poDateRange.to && poFrom > poDateRange.to) return false;
    }

    return true;
  });

  // รวมหลายใบเป็นใบสั่งซื้อเดียวกันได้เฉพาะประเภทสินค้าเดียวกัน — ใบแรกที่ติ๊ก
  // ล็อกประเภทไว้ ใบอื่นที่คนละประเภทจะกดเลือก/สร้างไม่ได้จนกว่าจะล้างการเลือก
  // หาจาก docs (ทั้งคิว ไม่ใช่แค่ที่กรองด้วยชิปอยู่) เผื่อสลับชิประหว่างเลือกค้างไว้
  const lockedCategory: PrCategoryId | null = React.useMemo(() => {
    if (selected.size === 0) return null;
    const first = docs.find((d) => selected.has(d.id));
    return first?.categoryId ?? null;
  }, [docs, selected]);

  const chipRowRef = React.useRef<HTMLDivElement>(null);
  const chipRefs = React.useRef<Record<string, HTMLButtonElement | null>>({});
  const stickyRef = React.useRef<HTMLDivElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);

  const counts = React.useMemo(() => {
    const c: Record<PoQueueChip, number> = { all: 0, urgent: 0, cancelled: 0 };
    for (const d of docs) {
      if (matchesPoQueueChip(d, "all")) c.all += 1;
      if (matchesPoQueueChip(d, "urgent")) c.urgent += 1;
      if (matchesPoQueueChip(d, "cancelled")) c.cancelled += 1;
    }
    return c;
  }, [docs]);

  const visible = docs.filter((d) => {
    if (!matchesPoQueueChip(d, chip)) return false;
    if (!matchesPr(d, query)) return false;

    // ช่องวันที่ด่วนบนแถบเครื่องมือ กับช่วงวันที่ในกล่องตัวกรอง เป็นค่าเดียวกัน
    // เลือกจากช่องด่วนคือกำหนด from ตรงๆ ให้ผลเหมือนเลือกวันเดียวในกล่องตัวกรอง
    const from = quickDate ?? view.neededRange?.from;
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

  const changeChip = (next: PoQueueChip) => {
    setChip(next);
    const list = listRef.current;
    if (!list) return;
    const bar = stickyRef.current?.offsetHeight ?? 0;
    scrollIntoTop(list, bar + (framed ? 0 : 56));
  };

  const changePoChip = (next: PoStatus) => {
    setPoChip(next);
    const list = listRef.current;
    if (!list) return;
    const bar = stickyRef.current?.offsetHeight ?? 0;
    scrollIntoTop(list, bar + (framed ? 0 : 56));
  };

  React.useEffect(() => {
    const row = chipRowRef.current;
    const el = chipRefs.current[chip];
    if (!row || !el) return;
    const rowBox = row.getBoundingClientRect();
    const elBox = el.getBoundingClientRect();
    const pad = 12;
    if (elBox.left < rowBox.left) {
      row.scrollBy({ left: elBox.left - rowBox.left - pad, behavior: "smooth" });
    } else if (elBox.right > rowBox.right) {
      row.scrollBy({ left: elBox.right - rowBox.right + pad, behavior: "smooth" });
    }
  }, [chip]);

  const toggleOne = (id: string, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const handleCreate = (doc: PrDoc) => {
    router.push(`/po/create?ids=${doc.id}`);
  };

  const handleCreateSelected = () => {
    router.push(`/po/create?ids=${Array.from(selected).join(",")}`);
    setSelected(new Set());
  };

  const handleDelete = () => {
    if (!pendingDelete) return;
    setRemovedIds((prev) => new Set(prev).add(pendingDelete.id));
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(pendingDelete.id);
      return next;
    });
    toast.success("ลบใบขอซื้อแล้ว", { description: pendingDelete.code });
    setPendingDelete(null);
  };

  return (
    <main className="mx-auto w-full max-w-7xl">
      <div>
        <div className="px-4 py-3 sm:px-6 sm:py-5">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">ระบบ</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-primary">สั่งซื้อ PO</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="mt-2 min-w-0 sm:mt-3">
            <h1 className="text-2xl font-semibold tracking-tight">สั่งซื้อ PO</h1>
            <p className="mt-1 text-sm text-muted-foreground">สั่งซื้อสินค้า</p>
          </div>

          <Tabs
            value={tab}
            onValueChange={(v) => setTab(v as typeof tab)}
            className="mt-4 sm:mt-5"
          >
            <TabsList className="w-full">
              <TabsTrigger value="po" className="flex-1">
                สั่งซื้อ ({PO_ORDER_DOCS.length})
              </TabsTrigger>
              <TabsTrigger value="queue" className="flex-1">
                ขอซื้อ ({counts.all})
              </TabsTrigger>
              <TabsTrigger value="done" className="flex-1">
                ซื้อแล้ว (99+)
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {tab === "queue" && (
            <>
              <StickyToolbar hidden={hidden} barRef={stickyRef}>
                <div className="flex items-center gap-2 pt-2">
                  <div
                    ref={chipRowRef}
                    className={cn(
                      "flex min-w-0 flex-1 items-center gap-2 overflow-x-auto",
                      "flex-nowrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                    )}
                  >
                    <div role="tablist" aria-label="สถานะใบขอซื้อ" className="flex shrink-0 items-center gap-2">
                      {CHIPS.map((c) => {
                        const on = chip === c;
                        return (
                          <button
                            key={c}
                            type="button"
                            role="tab"
                            ref={(el) => {
                              chipRefs.current[c] = el;
                            }}
                            onClick={() => changeChip(c)}
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

                  {/* ช่องวันที่ด่วน — ทางลัดของช่วงวันที่ต้องการสินค้าในกล่องตัวกรอง
                      ซ่อนบนจอแคบเพราะยังกดตัวกรองเต็มรูปแบบได้อยู่แล้ว */}
                  <DateSelect
                    value={quickDate}
                    onValueChange={setQuickDate}
                    placeholder="วันที่"
                    className="hidden w-44 shrink-0 sm:flex"
                  />

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

                {/* แถบสร้างใบสั่งซื้อรวม — โผล่เฉพาะตอนติ๊กเลือกไว้อย่างน้อยหนึ่งใบ
                    เท่านั้น ไม่ใช่ปุ่มถาวรที่กดไม่ได้เฉยๆ ตอนยังไม่มีอะไรให้รวม */}
                {selected.size > 0 && (
                  <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                    <Button onClick={handleCreateSelected}>
                      สร้างใบสั่งซื้อ
                    </Button>
                    <p className="text-sm text-muted-foreground">
                      วัตถุดิบเดียวกันเลือกรวมใน 1 ใบสั่งซื้อได้
                    </p>
                  </div>
                )}
              </StickyToolbar>

              <div
                ref={listRef}
                key={chip}
                className="mt-4 animate-in slide-in-from-bottom-3 fade-in duration-300"
              >
                <PoList
                  docs={visible}
                  selected={selected}
                  lockedCategory={lockedCategory}
                  onToggleOne={toggleOne}
                  onCreate={handleCreate}
                  onDeleteRequest={setPendingDelete}
                />
              </div>
            </>
          )}

          {tab === "po" && (
            <>
              <StickyToolbar hidden={hidden} barRef={stickyRef}>
                <div className="flex items-center gap-2 pt-2">
                  <div
                    ref={chipRowRef}
                    className={cn(
                      "flex min-w-0 flex-1 items-center gap-2 overflow-x-auto",
                      "flex-nowrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                    )}
                  >
                    <div role="tablist" aria-label="สถานะใบสั่งซื้อ" className="flex shrink-0 items-center gap-2">
                      {(["pending", "cancelled"] as PoStatus[]).map((s) => {
                        const on = poChip === s;
                        return (
                          <button
                            key={s}
                            type="button"
                            role="tab"
                            onClick={() => changePoChip(s)}
                            aria-selected={on}
                            className={cn(
                              "shrink-0 rounded-full border px-3 py-1 text-sm whitespace-nowrap transition-colors",
                              on
                                ? "border-primary bg-brand font-medium text-primary"
                                : "border-border text-foreground hover:bg-accent-hover"
                            )}
                          >
                            {PO_STATUS_LABEL[s]} ({poCounts[s]})
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
                      value={poQuery}
                      onChange={(e) => setPoQuery(e.target.value)}
                    />
                  </InputGroup>
                  {/* วันที่ย้ายเข้าไปอยู่ในกล่องตัวกรองแล้ว ไม่ใช่ช่องลอยอยู่บนแถบเครื่องมือ
                      เหมือนหน้าขอซื้อ PR — กรองตามช่วงวันที่คาดว่าสินค้าจะเข้าของใบนั้น */}
                  <Dialog open={poFilterOpen} onOpenChange={setPoFilterOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline-primary"
                        size="icon"
                        aria-label="ตัวกรองใบสั่งซื้อ"
                        className="relative shrink-0"
                      >
                        <ListFilterIcon />
                        {poFilterActive && (
                          <span className="absolute top-1 right-1 size-2 rounded-full bg-primary" />
                        )}
                      </Button>
                    </DialogTrigger>
                    <DialogContent
                      aria-describedby={undefined}
                      className="gap-0 p-0 sm:max-w-md [&_[data-slot=dialog-close]]:focus:ring-0 [&_[data-slot=dialog-close]]:focus:ring-offset-0 [&_[data-slot=dialog-close]]:focus-visible:ring-2 [&_[data-slot=dialog-close]]:focus-visible:ring-ring [&_[data-slot=dialog-close]]:focus-visible:ring-offset-2"
                    >
                      <DialogHeader className="px-4 pt-4 text-left">
                        <DialogTitle>ตัวกรองและการแสดงผล</DialogTitle>
                      </DialogHeader>
                      <PoOrderFilter
                        value={poDateRange}
                        onApply={(next) => {
                          setPoDateRange(next);
                          setPoFilterOpen(false);
                        }}
                      />
                    </DialogContent>
                  </Dialog>
                </div>
              </StickyToolbar>

              <div
                key={poChip}
                className="mt-4 animate-in slide-in-from-bottom-3 fade-in duration-300"
              >
                <PoOrderList docs={poVisible} />
              </div>
            </>
          )}

          {tab === "done" && (
            <div className="mt-4">
              <EmptyDocs title="แท็บซื้อแล้วยังไม่เปิดใช้งาน" hint="อยู่ระหว่างออกแบบหน้านี้ กลับมาดูใหม่อีกครั้ง" />
            </div>
          )}

          <BackToTop show={showTop} onClick={scrollToTop} />
        </div>
      </div>

      <AlertDialog open={!!pendingDelete} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ลบใบขอซื้อนี้ใช่ไหม?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete?.code} จะถูกลบออกจากคิวรอสร้างใบสั่งซื้อ
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ไม่ลบ</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>ยืนยันลบ</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}

/** ตัวกรองของแท็บ "สั่งซื้อ" — ตอนนี้มีแค่ช่วงวันที่คาดว่าสินค้าจะเข้า (ย้ายมา
    จากช่องลอยบนแถบเครื่องมือเดิม) ตามแบบเดียวกับ PrFilter: แก้ในกล่องก่อน
    กดตกลงถึงมีผล กากบาทกับ Esc คือยกเลิก */
function PoOrderFilter({
  value,
  onApply,
}: {
  value: DateRange | undefined;
  onApply: (next: DateRange | undefined) => void;
}) {
  const [draft, setDraft] = React.useState(value);
  const isDefault = !draft?.from;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
        <div>
          <Label htmlFor="po-expected-range" className="text-sm">
            ช่วงวันที่คาดว่าสินค้าจะเข้า
          </Label>
          <div className="mt-2">
            <DateRangeSelect
              id="po-expected-range"
              value={draft}
              onValueChange={setDraft}
              placeholder="เลือกวันที่"
              className="bg-card"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3">
        <Button
          variant="ghost"
          className="h-10 text-primary"
          disabled={isDefault}
          onClick={() => setDraft(undefined)}
        >
          <RotateCcwIcon />
          ล้างค่า
        </Button>
        <Button className="h-10 w-28" onClick={() => onApply(draft)}>
          ตกลง
        </Button>
      </div>
    </div>
  );
}
