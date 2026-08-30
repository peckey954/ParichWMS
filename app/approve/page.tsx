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
import { DateRangeSelect, DateSelect, parseDateSlash, type DateRange } from "@/components/date-select";
import { useScrollState } from "@/components/device-preview";
import { BackToTop, StickyToolbar } from "@/components/sticky-toolbar";
import { ApproveList } from "@/components/approve/approve-list";
import {
  matchesApproveChip,
  matchesPoOrder,
  PO_APPROVAL_HISTORY_DOCS,
  PO_ORDER_DOCS,
} from "@/lib/po";

/* ------------------------------------------------------------------
   อนุมัติสั่งซื้อ — รีวิวใบสั่งซื้อก่อนอนุมัติ ใช้ข้อมูลชุดเดียวกับแท็บ "สั่งซื้อ"
   ของหน้า /po (PO_ORDER_DOCS) ไม่มีชิปกรองสถานะเหมือนหน้าอื่น (ตามแบบ) — ใบที่
   ยกเลิกไปแล้วกรองออกไปเลยเสมอ (เดิมเป็นพฤติกรรมของชิป "รอดำเนินการ" ที่เป็น
   ค่าเริ่มต้นอยู่แล้ว ตอนนี้กลายเป็นพฤติกรรมเดียวตายตัว ไม่มีชิป "ยกเลิก" ให้
   สลับไปดูอีกที) กรองได้แค่คำค้นหา + ช่วงวันที่ (กล่องตัวกรอง/วันที่ด่วน)

   แท็บ "ประวัติ" — ใบที่อนุมัติ/ไม่อนุมัติไปแล้ว คนละชุดข้อมูลกับคิวรออนุมัติ
   (PO_APPROVAL_HISTORY_DOCS ไม่ใช่ PO_ORDER_DOCS) มีตัวกรอง/ค้นหาของตัวเอง
   แยกจากแท็บ "รออนุมัติ" ใช้ ApproveList การ์ด/ตารางชุดเดียวกัน แค่มีชิปผล
   อนุมัติเพิ่มเข้ามา (docs มี approvalStatus ส่วนคิวรออนุมัติไม่มี)
------------------------------------------------------------------ */

export default function ApprovePage() {
  const { hidden, showTop, scrollToTop } = useScrollState();

  const [tab, setTab] = React.useState<"pending" | "history">("pending");
  const [query, setQuery] = React.useState("");
  const [quickDate, setQuickDate] = React.useState<Date>();
  const [dateRange, setDateRange] = React.useState<DateRange>();
  const [filterOpen, setFilterOpen] = React.useState(false);
  const filterActive = !!dateRange?.from;

  const stickyRef = React.useRef<HTMLDivElement>(null);

  // ไม่มีชิปให้สลับแล้ว แต่ยังต้องกรองใบที่ยกเลิกไปแล้วออกจากคิวรออนุมัติเสมอ
  // (เดิมคือพฤติกรรมของชิป "รอดำเนินการ" ซึ่งเป็นค่าเริ่มต้น) นับจำนวนไว้โชว์
  // ที่ป้ายแท็บด้วย ไม่ใช้ PO_ORDER_DOCS.length ตรงๆ เพราะนั่นรวมใบที่ยกเลิกด้วย
  const pendingCount = React.useMemo(
    () => PO_ORDER_DOCS.filter((d) => matchesApproveChip(d, "all")).length,
    []
  );

  const visible = PO_ORDER_DOCS.filter((d) => {
    if (!matchesApproveChip(d, "all")) return false;
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

  // ---------- แท็บ "ประวัติ" ----------
  const [historyQuery, setHistoryQuery] = React.useState("");
  const [historyQuickDate, setHistoryQuickDate] = React.useState<Date>();
  const [historyDateRange, setHistoryDateRange] = React.useState<DateRange>();
  const [historyFilterOpen, setHistoryFilterOpen] = React.useState(false);
  const historyFilterActive = !!historyDateRange?.from;

  const visibleHistory = PO_APPROVAL_HISTORY_DOCS.filter((d) => {
    if (!matchesPoOrder(d, historyQuery)) return false;

    const from = historyQuickDate ?? historyDateRange?.from;
    const to = historyDateRange?.to;
    if (from || to) {
      const poFrom = parseDateSlash(d.expectedFrom);
      const poTo = parseDateSlash(d.expectedTo);
      if (!poFrom || !poTo) return false;
      if (from && poTo < from) return false;
      if (to && poFrom > to) return false;
    }

    return true;
  });

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
                รออนุมัติ ({pendingCount})
              </TabsTrigger>
              <TabsTrigger value="history" className="flex-1">
                ประวัติ (99+)
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {tab === "pending" && (
            <>
              <StickyToolbar hidden={hidden} barRef={stickyRef}>
                <div className="flex items-center gap-2">
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

              <div className="mt-4">
                <ApproveList docs={visible} />
              </div>
            </>
          )}

          {tab === "history" && (
            <>
              <StickyToolbar hidden={hidden} barRef={stickyRef}>
                <div className="flex items-center gap-2">
                  <InputGroup className="min-w-0 flex-1 bg-card">
                    <InputGroupAddon align="inline-start">
                      <SearchIcon />
                    </InputGroupAddon>
                    <InputGroupInput
                      placeholder="ค้นหา..."
                      value={historyQuery}
                      onChange={(e) => setHistoryQuery(e.target.value)}
                    />
                  </InputGroup>

                  <DateSelect
                    value={historyQuickDate}
                    onValueChange={setHistoryQuickDate}
                    placeholder="วันที่"
                    className="hidden w-44 shrink-0 sm:flex"
                  />

                  <Dialog open={historyFilterOpen} onOpenChange={setHistoryFilterOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline-primary"
                        size="icon"
                        aria-label="ตัวกรองใบสั่งซื้อ"
                        className="relative shrink-0"
                      >
                        <ListFilterIcon />
                        {historyFilterActive && (
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
                        value={historyDateRange}
                        onApply={(next) => {
                          setHistoryDateRange(next);
                          setHistoryFilterOpen(false);
                        }}
                      />
                    </DialogContent>
                  </Dialog>
                </div>
              </StickyToolbar>

              <div className="mt-4">
                <ApproveList docs={visibleHistory} />
              </div>
            </>
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
