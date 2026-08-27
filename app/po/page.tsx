"use client";

import * as React from "react";
import { ListFilterIcon, PlusIcon, SearchIcon } from "lucide-react";
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
import { Tabs, TabsList, TabsTrigger } from "@peckey954/ui/components/ui/tabs";
import { cn } from "@peckey954/ui/lib/utils";
import { toast } from "sonner";
import { DateSelect, parseDateSlash } from "@/components/date-select";
import { useDevicePreview, useScrollState } from "@/components/device-preview";
import { EmptyDocs } from "@/components/stock/doc-parts";
import { BackToTop, StickyToolbar } from "@/components/sticky-toolbar";
import { PrFilter, PR_VIEW_DEFAULT, isPrViewDefault, type PrView } from "@/components/pr/pr-filter";
import { PoList } from "@/components/po/po-list";
import { matchesPr, PR_PRODUCTS, type PrDoc } from "@/lib/pr";
import {
  PO_QUEUE_CHIP_LABEL,
  PO_QUEUE_DOCS,
  matchesPoQueueChip,
  type PoQueueChip,
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
  const { framed } = useDevicePreview();
  const { hidden, showTop, scrollToTop, scrollIntoTop } = useScrollState();

  const [tab, setTab] = React.useState<"queue" | "po" | "done">("queue");

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

  const toggleAll = (ids: string[], checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const id of ids) {
        if (checked) next.add(id);
        else next.delete(id);
      }
      return next;
    });
  };

  const handleCreate = (doc: PrDoc) => {
    toast.info("สร้างใบสั่งซื้อ", { description: `${doc.code} — ${doc.productName}` });
  };

  const handleCreateSelected = () => {
    toast.info("สร้างใบสั่งซื้อ", { description: `รวม ${selected.size} ใบขอซื้อ` });
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
              <TabsTrigger value="queue" className="flex-1">
                ขอซื้อ ({counts.all})
              </TabsTrigger>
              <TabsTrigger value="po" className="flex-1">
                สั่งซื้อ (20)
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

                {/* แถบเลือกไว้หลายใบ — โผล่เฉพาะตอนมีติ๊กไว้อย่างน้อยหนึ่งใบ
                    รวมหลายใบขอซื้อเป็นใบสั่งซื้อเดียวกันได้ */}
                {selected.size > 0 && (
                  <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-primary bg-brand px-3 py-2">
                    <span className="text-sm font-medium text-primary">
                      เลือกไว้ {selected.size} รายการ
                    </span>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>
                        ล้างการเลือก
                      </Button>
                      <Button size="sm" onClick={handleCreateSelected}>
                        <PlusIcon />
                        สร้างใบสั่งซื้อ
                      </Button>
                    </div>
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
                  onToggleOne={toggleOne}
                  onToggleAll={toggleAll}
                  onCreate={handleCreate}
                  onDeleteRequest={setPendingDelete}
                />
              </div>
            </>
          )}

          {tab !== "queue" && (
            <div className="mt-4">
              <EmptyDocs
                title={tab === "po" ? "แท็บสั่งซื้อยังไม่เปิดใช้งาน" : "แท็บซื้อแล้วยังไม่เปิดใช้งาน"}
                hint="อยู่ระหว่างออกแบบหน้านี้ กลับมาดูใหม่อีกครั้ง"
              />
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
