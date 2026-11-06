"use client";

import * as React from "react";
import { DownloadIcon, ListFilterIcon, SearchIcon } from "lucide-react";
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
import { Switch } from "@peckey954/ui/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@peckey954/ui/components/ui/tabs";
import { cn } from "@peckey954/ui/lib/utils";
import { toast } from "sonner";
import { useDevicePreview, useScrollState } from "@/components/device-preview";
import { Crumbs } from "@/components/receiving/parts";
import { useRememberedState } from "@/components/remembered-state";
import { SortControl } from "@/components/sort-control";
import { BackToTop, StickyToolbar } from "@/components/sticky-toolbar";
import { EmptyDocs } from "@/components/stock/doc-parts";
import { GoodsHistoryList } from "@/components/stock/goods-history-list";
import { GoodsInboundList } from "@/components/stock/goods-inbound-list";
import { GoodsIssueList } from "@/components/stock/goods-issue-list";
import { FifoList, ZoneGroups } from "@/components/stock/lot-list";
import { useSafetyStock } from "@/components/stock/safety-stock-provider";
import { StockLogProvider, useStockLog } from "@/components/stock/stock-log";
import {
  STOCK_SORTS,
  STOCK_VIEW_DEFAULT,
  StockFilter,
  isStockDefault,
  type StockView,
} from "@/components/stock/stock-filter";
import { ProductCard } from "@/components/stock/stock-parts";
import {
  groupByZone,
  matchesQuery,
  sortFifo,
  sortProducts,
  type CategoryId,
} from "@/lib/general-stock";
import {
  GOODS_INBOUND_DOCS,
  GOODS_INBOUND_SOURCE_LABEL,
  clearGoodsInboundTabRequest,
  goodsInboundTabRequested,
  isGoodsInboundOpen,
  matchesGoodsInbound,
  type GoodsInboundSource,
} from "@/lib/goods-inbound";
import {
  GOODS_ISSUE_DOCS,
  isGoodsIssueOpen,
  isGoodsReturn,
  matchesGoodsIssue,
  clearIssueTabRequest,
  issueTabRequested,
} from "@/lib/goods-issue";
import {
  GOODS_CATEGORIES,
  GOODS_HISTORY,
  GOODS_PRODUCTS,
  countGoods,
  matchesGoodsHistory,
  type GoodsHistoryRow,
} from "@/lib/goods-stock";
import { isProductLow } from "@/lib/safety-stock";

/* ------------------------------------------------------------------
   สต็อกสินค้า — เมนูการคลังสินค้า

   แท็บสต็อก: หน้าตาเดียวกับสต็อกทั่วไป (Figma "Tab 1 - Stock") ชิปแถวบน
   เลือกประเภท สินค้าผลิต / สินค้า OEM / ปุ๋ยกระสอบ แล้วต่อท้ายด้วย "ประวัติ"
   ประวัติแต่ละแถวกดเข้าไปดูรายละเอียดของรายการนั้นได้

   แท็บรอจ่าย/คืน: Flow จ่ายออก กดใบจ่ายออกแล้วไปหน้าจ่ายสินค้า
   แท็บรอรับเข้ายังไม่มีแบบ จึงขึ้นป้ายบอกไว้
------------------------------------------------------------------ */

type Chip = CategoryId | "history";

const CHIPS: { id: Chip; label: string }[] = [
  ...GOODS_CATEGORIES.map((c) => ({ id: c.id as Chip, label: c.label })),
  { id: "history", label: "ประวัติ" },
];

const PRODUCT_NAMES = GOODS_PRODUCTS.map((p) => p.name);

type IssueKind = "all" | "issue" | "return";

const ISSUE_KINDS: { id: IssueKind; label: string }[] = [
  { id: "all", label: "ทั้งหมด" },
  { id: "issue", label: "รอจ่ายออก" },
  { id: "return", label: "รอรับคืน" },
];

const CHIP_CLASS = (on: boolean) =>
  cn(
    "shrink-0 rounded-full border px-3 py-1 text-sm whitespace-nowrap transition-colors",
    on
      ? "border-primary bg-brand font-medium text-primary"
      : "border-border text-foreground hover:bg-accent-hover"
  );

export default function GoodsStockPage() {
  // ย้าย/ปรับปรุงในแท็บสต็อกต้องไปโผล่ในประวัติทันที จึงห่อทั้งหน้าไว้
  return (
    <StockLogProvider scope="goods" initial={GOODS_HISTORY}>
      <GoodsStockView />
    </StockLogProvider>
  );
}

function GoodsStockView() {
  const { framed } = useDevicePreview();
  const { hidden, showTop, scrollToTop, scrollIntoTop, armScrollGuard, releaseScrollGuard } =
    useScrollState();
  const { config: safetyConfig } = useSafetyStock();
  const { rows: logRows } = useStockLog();

  // แท็บกับชิปจำไว้ข้ามหน้า — เปิดเอกสารแล้วย้อนกลับ ต้องกลับมาที่เดิม
  // บันทึกเสร็จแล้วสั่งเปิดแท็บไหน ค่านั้นชนะค่าที่จำไว้
  const [tab, setTab] = useRememberedState<"stock" | "inbound" | "issue">("goods.tab", "stock", () =>
    issueTabRequested() ? "issue" : goodsInboundTabRequested() ? "inbound" : undefined
  );
  React.useEffect(() => {
    clearIssueTabRequest();
    clearGoodsInboundTabRequest();
  }, []);

  // ---------- แท็บสต็อก ----------
  const [cat, setCat] = useRememberedState<Chip>("goods.cat", "produced");
  const isHistory = cat === "history";
  const [query, setQuery] = React.useState("");
  const [view, setView] = React.useState<StockView>(STOCK_VIEW_DEFAULT);
  const [filterOpen, setFilterOpen] = React.useState(false);
  const filterActive = !isStockDefault(view);

  const counts = countGoods(GOODS_PRODUCTS);
  const cats: CategoryId[] = view.kinds.length > 0 ? view.kinds : [cat as CategoryId];
  const visible = isHistory
    ? []
    : GOODS_PRODUCTS.filter(
        (p) =>
          cats.includes(p.category) &&
          matchesQuery(p, query) &&
          (!view.lowOnly || isProductLow(p, safetyConfig)) &&
          (view.products.length === 0 || view.products.includes(p.name))
      );
  const historyRows = logRows as GoodsHistoryRow[];
  const historyVisible = historyRows.filter((r) => matchesGoodsHistory(r, query));

  // ---------- แท็บรอรับเข้า ----------
  const [inboundQuery, setInboundQuery] = React.useState("");
  const [source, setSource] = useRememberedState<GoodsInboundSource>("goods.source", "production");
  const inboundOpen = GOODS_INBOUND_DOCS.filter(isGoodsInboundOpen);
  const inboundCounts: Record<GoodsInboundSource, number> = {
    production: inboundOpen.filter((d) => d.source === "production").length,
    external: inboundOpen.filter((d) => d.source === "external").length,
  };
  const inboundVisible = inboundOpen.filter(
    (d) => d.source === source && matchesGoodsInbound(d, inboundQuery)
  );

  // ---------- แท็บรอจ่าย/คืน ----------
  const [issueQuery, setIssueQuery] = React.useState("");
  const [kind, setKind] = useRememberedState<IssueKind>("goods.issueKind", "all");
  const open = GOODS_ISSUE_DOCS.filter(isGoodsIssueOpen);
  const issueCounts = {
    all: open.length,
    issue: open.filter((d) => !isGoodsReturn(d.status)).length,
    return: open.filter((d) => isGoodsReturn(d.status)).length,
  };
  const issueVisible = open.filter(
    (d) =>
      matchesGoodsIssue(d, issueQuery) &&
      (kind === "all" || (kind === "return") === isGoodsReturn(d.status))
  );

  const stickyRef = React.useRef<HTMLDivElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);

  /** สลับชิปแล้วเลื่อนให้หัวรายการมาอยู่ใต้แถบเครื่องมือ ไม่เด้งขึ้นบนสุดทั้งหน้า */
  const scrollListToTop = () => {
    const list = listRef.current;
    if (!list) return;
    const bar = stickyRef.current?.offsetHeight ?? 0;
    scrollIntoTop(list, bar + (framed ? 0 : 56));
  };

  // ---------- แถวชิปเลื่อนตามชิปที่เลือก (ชิปท้าย ๆ หลุดขอบบนมือถือ) ----------
  const chipRowRef = React.useRef<HTMLDivElement>(null);
  const chipRefs = React.useRef<Record<string, HTMLButtonElement | null>>({});
  React.useEffect(() => {
    const row = chipRowRef.current;
    const chip = chipRefs.current[cat];
    if (!row || !chip) return;
    const rowBox = row.getBoundingClientRect();
    const chipBox = chip.getBoundingClientRect();
    const pad = 12;
    if (chipBox.left < rowBox.left) {
      row.scrollBy({ left: chipBox.left - rowBox.left - pad, behavior: "smooth" });
    } else if (chipBox.right > rowBox.right) {
      row.scrollBy({ left: chipBox.right - rowBox.right + pad, behavior: "smooth" });
    }
  }, [cat]);

  return (
    <main className="mx-auto w-full max-w-7xl">
      <div className="px-4 py-3 sm:px-6 sm:py-5">
        <Crumbs trail={[{ label: "สต็อกสินค้า" }]} />

        <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:mt-3">สต็อกสินค้า</h1>
        <p className="mt-1 text-sm text-muted-foreground">จัดการสต็อกสินค้า</p>

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
            <TabsTrigger value="stock" className="flex-1">
              <span className="@3xl:hidden">สต็อก</span>
              <span className="hidden @3xl:inline">สต็อกสินค้า</span> ({GOODS_PRODUCTS.length})
            </TabsTrigger>
            <TabsTrigger value="inbound" className="flex-1">
              รอรับเข้า ({inboundOpen.length})
            </TabsTrigger>
            <TabsTrigger value="issue" className="flex-1">
              รอจ่าย/คืน ({open.length})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* ================= แท็บสต็อก ================= */}
        {tab === "stock" && (
          <>
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
                    className="flex max-h-[85svh] flex-col gap-0 overflow-hidden! p-0 sm:max-w-md"
                  >
                    <DialogHeader className="px-4 pt-4 text-left">
                      <DialogTitle>ตัวกรองและการแสดงผล</DialogTitle>
                    </DialogHeader>
                    <StockFilter
                      view={view}
                      categories={GOODS_CATEGORIES}
                      productNames={PRODUCT_NAMES}
                      onApply={(next) => {
                        setView(next);
                        setFilterOpen(false);
                      }}
                    />
                  </DialogContent>
                </Dialog>

                {/* จอกว้างมีที่พอใส่คำ จอแคบเหลือแค่ไอคอนตามแบบ */}
                <Button
                  variant="outline-primary"
                  aria-label="ส่งออก CSV"
                  className="shrink-0 max-@3xl:size-9 max-@3xl:px-0"
                  onClick={() =>
                    toast.info("ส่งออก CSV", {
                      description: isHistory
                        ? "ประวัติการทำรายการ"
                        : GOODS_CATEGORIES.find((c) => c.id === cat)?.label,
                    })
                  }
                >
                  <DownloadIcon />
                  <span className="hidden @3xl:inline">ส่งออก CSV</span>
                </Button>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <div
                  ref={chipRowRef}
                  className={cn(
                    "flex min-w-0 flex-1 items-center gap-2 overflow-x-auto",
                    "flex-nowrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                  )}
                >
                  <div role="tablist" aria-label="ประเภทสินค้า" className="flex shrink-0 items-center gap-2">
                    {CHIPS.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        role="tab"
                        ref={(el) => {
                          chipRefs.current[c.id] = el;
                        }}
                        aria-selected={cat === c.id}
                        onClick={() => {
                          setCat(c.id);
                          scrollListToTop();
                        }}
                        className={CHIP_CLASS(cat === c.id)}
                      >
                        {c.label} (
                        {c.id === "history"
                          ? historyRows.length > 99
                            ? "99+"
                            : historyRows.length
                          : counts[c.id as CategoryId]}
                        )
                      </button>
                    ))}
                  </div>

                  {/* ประวัติคือเหตุการณ์ ไม่ใช่ยอดคงเหลือ ไม่มีเรื่องสต็อกต่ำ */}
                  {!isHistory && (
                    <>
                      <span className="h-5 w-px shrink-0 bg-border" aria-hidden />
                      <label className="flex shrink-0 cursor-pointer items-center gap-2 text-sm whitespace-nowrap">
                        <Switch
                          checked={view.lowOnly}
                          onCheckedChange={(v) => setView((prev) => ({ ...prev, lowOnly: v }))}
                        />
                        <span>สต็อกต่ำ</span>
                      </label>
                    </>
                  )}
                </div>

                {!isHistory && (
                  <div className="hidden shrink-0 items-center gap-2 @3xl:flex">
                    <span className="text-sm text-muted-foreground">เรียงตาม:</span>
                    <SortControl
                      options={STOCK_SORTS}
                      value={view.sort}
                      dir={view.dir}
                      onChange={(sort, dir) => setView((v) => ({ ...v, sort, dir }))}
                    />
                  </div>
                )}
              </div>
            </StickyToolbar>

            <div
              ref={listRef}
              key={cat}
              className="mt-4 animate-in slide-in-from-bottom-3 fade-in space-y-4 duration-300"
            >
              {isHistory && <GoodsHistoryList rows={historyVisible} />}

              {!isHistory &&
                view.sort === "product" &&
                sortProducts(visible, view.dir).map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    showLots={view.showLots}
                    showChips={view.showChips}
                    showGrade={false}
                  />
                ))}

              {!isHistory && view.sort === "zone" && (
                <ZoneGroups
                  groups={groupByZone(visible, view.dir)}
                  showChips={view.showChips}
                />
              )}

              {!isHistory && view.sort === "fifo" && visible.length > 0 && (
                <FifoList
                  rows={sortFifo(visible, view.dir)}
                  showChips={view.showChips}
                />
              )}

              {!isHistory && visible.length === 0 && (
                <EmptyDocs
                  title={`ไม่พบใน “${GOODS_CATEGORIES.find((c) => c.id === cat)?.label}”`}
                  hint={
                    query.trim() || view.lowOnly
                      ? "ลองใช้คำค้นสั้นลง หรือปิดตัวกรองสต็อกต่ำ"
                      : "ยังไม่มีสินค้าในประเภทนี้"
                  }
                />
              )}
            </div>
          </>
        )}

        {/* ================= แท็บรอรับเข้า ================= */}
        {tab === "inbound" && (
          <>
            <StickyToolbar hidden={hidden} barRef={stickyRef}>
              <div className="flex items-center gap-2 pt-2">
                <InputGroup className="min-w-0 flex-1 bg-card">
                  <InputGroupAddon align="inline-start">
                    <SearchIcon />
                  </InputGroupAddon>
                  <InputGroupInput
                    placeholder="ค้นหา..."
                    value={inboundQuery}
                    onChange={(e) => setInboundQuery(e.target.value)}
                  />
                </InputGroup>
              </div>

              <div
                role="tablist"
                aria-label="แหล่งที่มา"
                className={cn(
                  "mt-3 flex items-center gap-2 overflow-x-auto",
                  "flex-nowrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                )}
              >
                {(["production", "external"] as const).map((k) => (
                  <button
                    key={k}
                    type="button"
                    role="tab"
                    aria-selected={source === k}
                    onClick={() => {
                      setSource(k);
                      scrollListToTop();
                    }}
                    className={CHIP_CLASS(source === k)}
                  >
                    {GOODS_INBOUND_SOURCE_LABEL[k]} ({inboundCounts[k]})
                  </button>
                ))}
              </div>
            </StickyToolbar>

            <div
              ref={listRef}
              key={source}
              className="mt-4 animate-in slide-in-from-bottom-3 fade-in duration-300"
            >
              <GoodsInboundList docs={inboundVisible} source={source} />
            </div>
          </>
        )}

        {/* ================= แท็บรอจ่าย/คืน ================= */}
        {tab === "issue" && (
          <>
            <StickyToolbar hidden={hidden} barRef={stickyRef}>
              <div className="flex items-center gap-2 pt-2">
                <InputGroup className="min-w-0 flex-1 bg-card">
                  <InputGroupAddon align="inline-start">
                    <SearchIcon />
                  </InputGroupAddon>
                  <InputGroupInput
                    placeholder="ค้นหา..."
                    value={issueQuery}
                    onChange={(e) => setIssueQuery(e.target.value)}
                  />
                </InputGroup>
              </div>

              <div
                role="tablist"
                aria-label="ประเภทเอกสาร"
                className={cn(
                  "mt-3 flex items-center gap-2 overflow-x-auto",
                  "flex-nowrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                )}
              >
                {ISSUE_KINDS.map((k) => (
                  <button
                    key={k.id}
                    type="button"
                    role="tab"
                    aria-selected={kind === k.id}
                    onClick={() => {
                      setKind(k.id);
                      scrollListToTop();
                    }}
                    className={CHIP_CLASS(kind === k.id)}
                  >
                    {k.label} ({issueCounts[k.id]})
                  </button>
                ))}
              </div>
            </StickyToolbar>

            <div
              ref={listRef}
              key={kind}
              className="mt-4 animate-in slide-in-from-bottom-3 fade-in duration-300"
            >
              <GoodsIssueList docs={issueVisible} />
            </div>
          </>
        )}

        <BackToTop show={showTop} onClick={scrollToTop} />
      </div>
    </main>
  );
}
