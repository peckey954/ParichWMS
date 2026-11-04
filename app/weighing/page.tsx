"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { ListFilterIcon, SearchIcon } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@peckey954/ui/components/ui/breadcrumb";
import { HomeCrumb } from "@/components/home-crumb";
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
import { DateSelect } from "@/components/date-select";
import { useDevicePreview, useScrollState } from "@/components/device-preview";
import { BackToTop, StickyToolbar } from "@/components/sticky-toolbar";
import {
  isWeighingViewDefault,
  matchesWeighingView,
  WEIGHING_VIEW_DEFAULT,
  WeighingFilter,
  type WeighingView,
} from "@/components/weighing/weighing-filter";
import { WeighingList } from "@/components/weighing/weighing-list";
import {
  isWeighingDone,
  matchesWeighing,
  matchesWeighingChip,
  WEIGHING_DONE_CHIP_LABEL,
  WEIGHING_DONE_CHIPS,
  WEIGHING_PENDING_CHIP_LABEL,
  WEIGHING_PENDING_CHIPS,
  type WeighingDoneChip,
  type WeighingPendingChip,
} from "@/lib/weighing";
import { useWeighingDocs } from "@/lib/weighing-store";

/* ------------------------------------------------------------------
   ชั่งน้ำหนัก — หน้ารายการ (ชั้นบนสุดของสองชั้น ตามแบบ)
   กดแถวแล้วไปใบชั่งน้ำหนักเลย รอชั่ง = ฟอร์มกรอก ชั่งแล้ว = หน้าดู

   แท็บ รอชั่งน้ำหนัก (ชิป ทั้งหมด/รับเข้า/จ่ายออก) และ ชั่งน้ำหนักแล้ว
   (ชิป ชั่งน้ำหนัก/ยกเลิก) — ใบที่ใบสั่งซื้อปิดแล้วย้ายไปแท็บชั่งแล้วเอง
   สลับแท็บใหญ่ไม่ขยับจอ สลับชิปเลื่อนรายการขึ้นมาใต้แถบเครื่องมือ
   (มาตรฐานเดียวกับหน้าสั่งซื้อ PO)
------------------------------------------------------------------ */

export default function WeighingListPage() {
  return (
    <React.Suspense fallback={null}>
      <WeighingListContent />
    </React.Suspense>
  );
}

function WeighingListContent() {
  const searchParams = useSearchParams();
  const { framed } = useDevicePreview();
  const { hidden, showTop, scrollToTop, scrollIntoTop, armScrollGuard, releaseScrollGuard } =
    useScrollState();
  const stickyRef = React.useRef<HTMLDivElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);

  const [tab, setTab] = React.useState<"pending" | "weighed">(() =>
    searchParams.get("tab") === "weighed" ? "weighed" : "pending"
  );
  const [pendingChip, setPendingChip] = React.useState<WeighingPendingChip>("all");
  const [doneChip, setDoneChip] = React.useState<WeighingDoneChip>("weighed");
  const [query, setQuery] = React.useState("");
  const [view, setView] = React.useState<WeighingView>(WEIGHING_VIEW_DEFAULT);
  const [filterOpen, setFilterOpen] = React.useState(false);
  const filterActive = !isWeighingViewDefault({ ...view, docDate: undefined });

  const all = useWeighingDocs();
  const pendingDocs = React.useMemo(() => all.filter((d) => !isWeighingDone(d)), [all]);
  const weighedDocs = React.useMemo(() => all.filter(isWeighingDone), [all]);
  const tabDocs = tab === "pending" ? pendingDocs : weighedDocs;
  const chip = tab === "pending" ? pendingChip : doneChip;
  const chips: (WeighingPendingChip | WeighingDoneChip)[] =
    tab === "pending" ? WEIGHING_PENDING_CHIPS : WEIGHING_DONE_CHIPS;
  const chipLabel = (c: WeighingPendingChip | WeighingDoneChip) =>
    tab === "pending"
      ? WEIGHING_PENDING_CHIP_LABEL[c as WeighingPendingChip]
      : WEIGHING_DONE_CHIP_LABEL[c as WeighingDoneChip];

  // ตัวเลขบนชิปนับตามค้นหา/ตัวกรองที่ใช้อยู่ด้วย จะได้ตรงกับที่เห็นในรายการ
  const filtered = tabDocs.filter((d) => matchesWeighing(d, query) && matchesWeighingView(d, view));
  const visible = filtered.filter((d) => matchesWeighingChip(d, chip));

  function changeChip(next: WeighingPendingChip | WeighingDoneChip) {
    if (tab === "pending") setPendingChip(next as WeighingPendingChip);
    else setDoneChip(next as WeighingDoneChip);
    const list = listRef.current;
    if (!list) return;
    const bar = stickyRef.current?.offsetHeight ?? 0;
    scrollIntoTop(list, bar + (framed ? 0 : 56));
  }

  return (
    <main className="mx-auto w-full max-w-7xl">
      <div className="px-4 py-3 sm:px-6 sm:py-5">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <HomeCrumb />
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-primary">ชั่งน้ำหนัก</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="mt-2 min-w-0 sm:mt-3">
          <h1 className="text-2xl font-semibold tracking-tight">ชั่งน้ำหนัก</h1>
          <p className="mt-1 text-sm text-muted-foreground">จัดการเอกสารชั่งน้ำหนักรถและสินค้า</p>
        </div>

        <Tabs
          value={tab}
          onPointerDownCapture={armScrollGuard}
          onValueChange={(v) => {
            setTab(v as typeof tab);
            releaseScrollGuard();
          }}
          className="mt-4 sm:mt-5"
        >
          <TabsList className="w-full">
            <TabsTrigger value="pending" className="flex-1">
              รอชั่งน้ำหนัก ({pendingDocs.length})
            </TabsTrigger>
            <TabsTrigger value="weighed" className="flex-1">
              ชั่งน้ำหนักแล้ว ({weighedDocs.length})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <StickyToolbar hidden={hidden} barRef={stickyRef}>
          <div className="flex items-center gap-2 pt-2">
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
            {/* วันที่เอกสาร — ค่าเดียวกับช่องแรกในกล่องตัวกรอง */}
            <DateSelect
              value={view.docDate}
              onValueChange={(d) => setView((v) => ({ ...v, docDate: d }))}
              placeholder="วันที่"
              className="hidden w-52 shrink-0 sm:flex"
            />
            <Dialog open={filterOpen} onOpenChange={setFilterOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline-primary"
                  size="icon"
                  aria-label="ตัวกรองใบชั่งน้ำหนัก"
                  className="relative shrink-0"
                >
                  <ListFilterIcon />
                  {filterActive && (
                    <span className="absolute top-1 right-1 size-2 rounded-full bg-primary" />
                  )}
                </Button>
              </DialogTrigger>
              <DialogContent aria-describedby={undefined} className="gap-0 p-0 sm:max-w-2xl">
                <DialogHeader className="px-4 pt-4 text-left">
                  <DialogTitle>ตัวกรองและการแสดงผล</DialogTitle>
                </DialogHeader>
                <WeighingFilter
                  docs={tabDocs}
                  value={view}
                  onApply={(next) => {
                    setView(next);
                    setFilterOpen(false);
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>

          <div
            role="tablist"
            aria-label="กรองใบชั่งน้ำหนัก"
            className="mt-3 flex items-center gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {chips.map((c) => {
              const on = chip === c;
              return (
                <button
                  key={c}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  onClick={() => changeChip(c)}
                  className={cn(
                    "shrink-0 rounded-full border px-3 py-1 text-sm whitespace-nowrap transition-colors",
                    on
                      ? "border-primary bg-brand font-medium text-primary"
                      : "border-border text-foreground hover:bg-accent-hover"
                  )}
                >
                  {chipLabel(c)} ({filtered.filter((d) => matchesWeighingChip(d, c)).length})
                </button>
              );
            })}
          </div>
        </StickyToolbar>

        <div
          ref={listRef}
          key={`${tab}-${chip}`}
          className="mt-4 animate-in slide-in-from-bottom-3 fade-in duration-300"
        >
          <WeighingList docs={visible} variant={tab} />
        </div>

        <BackToTop show={showTop} onClick={scrollToTop} />
      </div>
    </main>
  );
}
