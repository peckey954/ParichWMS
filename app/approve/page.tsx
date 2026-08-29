"use client";

import * as React from "react";
import { ListFilterIcon, RotateCcwIcon, SearchIcon } from "lucide-react";
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
import { DateRangeSelect, DateSelect, parseDateSlash, type DateRange } from "@/components/date-select";
import { useDevicePreview, useScrollState } from "@/components/device-preview";
import { EmptyDocs } from "@/components/stock/doc-parts";
import { BackToTop, StickyToolbar } from "@/components/sticky-toolbar";
import { ApproveList } from "@/components/approve/approve-list";
import {
  APPROVE_CHIP_LABEL,
  matchesApproveChip,
  matchesPoOrder,
  PO_ORDER_DOCS,
  type ApproveChip,
} from "@/lib/po";

/* ------------------------------------------------------------------
   อนุมัติสั่งซื้อ — รีวิวใบสั่งซื้อก่อนอนุมัติ ใช้ข้อมูลชุดเดียวกับแท็บ "สั่งซื้อ"
   ของหน้า /po (PO_ORDER_DOCS) แค่มุมมองเป็นสามชิปแบบเดียวกับแท็บ "ขอซื้อ"
   (รอดำเนินการ/เร่งด่วน/ยกเลิก) แทนสถานะรับเข้า เพราะใบพวกนี้ยังไม่เริ่มรับเข้า
   สิ่งที่ต้องตัดสินใจคือราคา ไม่ใช่ความคืบหน้า

   แท็บ "ประวัติ" ยังไม่เปิดใช้งาน รอไฟล์ออกแบบ (เหมือนแท็บ "ซื้อแล้ว" ของ /po)
------------------------------------------------------------------ */

const CHIPS: ApproveChip[] = ["all", "urgent", "cancelled"];

export default function ApprovePage() {
  const { framed } = useDevicePreview();
  const { hidden, showTop, scrollToTop, scrollIntoTop } = useScrollState();

  const [tab, setTab] = React.useState<"pending" | "history">("pending");
  const [chip, setChip] = React.useState<ApproveChip>("all");
  const [query, setQuery] = React.useState("");
  const [quickDate, setQuickDate] = React.useState<Date>();
  const [dateRange, setDateRange] = React.useState<DateRange>();
  const [filterOpen, setFilterOpen] = React.useState(false);
  const filterActive = !!dateRange?.from;

  const chipRowRef = React.useRef<HTMLDivElement>(null);
  const chipRefs = React.useRef<Record<string, HTMLButtonElement | null>>({});
  const stickyRef = React.useRef<HTMLDivElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);

  const counts = React.useMemo(() => {
    const c: Record<ApproveChip, number> = { all: 0, urgent: 0, cancelled: 0 };
    for (const d of PO_ORDER_DOCS) {
      if (matchesApproveChip(d, "all")) c.all += 1;
      if (matchesApproveChip(d, "urgent")) c.urgent += 1;
      if (matchesApproveChip(d, "cancelled")) c.cancelled += 1;
    }
    return c;
  }, []);

  const visible = PO_ORDER_DOCS.filter((d) => {
    if (!matchesApproveChip(d, chip)) return false;
    if (!matchesPoOrder(d, query)) return false;

    const from = quickDate ?? dateRange?.from;
    const to = dateRange?.to;
    if (from || to) {
      const poFrom = parseDateSlash(d.expectedFrom);
      const poTo = parseDateSlash(d.expectedTo);
      if (!poFrom || !poTo) return false;
      if (from && poTo < from) return false;
      if (to && poFrom > to) return false;
    }

    return true;
  });

  const changeChip = (next: ApproveChip) => {
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
                <BreadcrumbPage className="text-primary">อนุมัติสั่งซื้อ</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="mt-2 min-w-0 sm:mt-3">
            <h1 className="text-2xl font-semibold tracking-tight">อนุมัติสั่งซื้อ</h1>
            <p className="mt-1 text-sm text-muted-foreground">อนุมัติการสั่งซื้อสินค้า</p>
          </div>

          <Tabs
            value={tab}
            onValueChange={(v) => setTab(v as typeof tab)}
            className="mt-4 sm:mt-5"
          >
            <TabsList className="w-full">
              <TabsTrigger value="pending" className="flex-1">
                รออนุมัติ ({PO_ORDER_DOCS.length})
              </TabsTrigger>
              <TabsTrigger value="history" className="flex-1">
                ประวัติ (99+)
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {tab === "pending" && (
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
                            {APPROVE_CHIP_LABEL[c]} ({counts[c]})
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
                        aria-label="ตัวกรองใบสั่งซื้อ"
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
                      className="gap-0 p-0 sm:max-w-md [&_[data-slot=dialog-close]]:focus:ring-0 [&_[data-slot=dialog-close]]:focus:ring-offset-0 [&_[data-slot=dialog-close]]:focus-visible:ring-2 [&_[data-slot=dialog-close]]:focus-visible:ring-ring [&_[data-slot=dialog-close]]:focus-visible:ring-offset-2"
                    >
                      <DialogHeader className="px-4 pt-4 text-left">
                        <DialogTitle>ตัวกรองและการแสดงผล</DialogTitle>
                      </DialogHeader>
                      <ApproveFilter
                        value={dateRange}
                        onApply={(next) => {
                          setDateRange(next);
                          setFilterOpen(false);
                        }}
                      />
                    </DialogContent>
                  </Dialog>
                </div>
              </StickyToolbar>

              <div
                ref={listRef}
                key={chip}
                className="mt-4 animate-in slide-in-from-bottom-3 fade-in duration-300"
              >
                <ApproveList docs={visible} />
              </div>
            </>
          )}

          {tab === "history" && (
            <div className="mt-4">
              <EmptyDocs title="แท็บประวัติยังไม่เปิดใช้งาน" hint="อยู่ระหว่างออกแบบหน้านี้ กลับมาดูใหม่อีกครั้ง" />
            </div>
          )}

          <BackToTop show={showTop} onClick={scrollToTop} />
        </div>
      </div>
    </main>
  );
}

/** ตัวกรอง — ช่วงวันที่คาดว่าสินค้าจะเข้า เหมือนกล่องตัวกรองของแท็บ "สั่งซื้อ"
    ในหน้า /po (app/po/page.tsx) แก้ในกล่องก่อน กดตกลงถึงมีผล */
function ApproveFilter({
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
          <Label htmlFor="approve-expected-range" className="text-sm">
            ช่วงวันที่คาดว่าสินค้าจะเข้า
          </Label>
          <div className="mt-2">
            <DateRangeSelect
              id="approve-expected-range"
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
