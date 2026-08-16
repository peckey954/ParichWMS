"use client";

import * as React from "react";
import {
  DownloadIcon,
  ListFilterIcon,
  ListIcon,
  RotateCcwIcon,
  SearchIcon,
  SlidersHorizontalIcon,
  SquareCheckBigIcon,
  SquareIcon,
  TagIcon,
} from "lucide-react";
import { Badge } from "@peckey954/ui/components/ui/badge";
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
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@peckey954/ui/components/ui/input-group";
import { Label } from "@peckey954/ui/components/ui/label";
import { Separator } from "@peckey954/ui/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@peckey954/ui/components/ui/popover";
import { Tabs, TabsList, TabsTrigger } from "@peckey954/ui/components/ui/tabs";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@peckey954/ui/components/ui/toggle-group";
import { cn } from "@peckey954/ui/lib/utils";
import { toast } from "sonner";
import { useDevicePreview, useScrollState } from "@/components/device-preview";
import { BackToTop, StickyToolbar } from "@/components/sticky-toolbar";
import { HistoryList } from "@/components/stock/history-list";
import { StockLogProvider, useStockLog } from "@/components/stock/stock-log";
import { InboundList } from "@/components/stock/inbound-list";
import { IssueList } from "@/components/stock/issue-list";
import { ProductCard } from "@/components/stock/stock-parts";
import {
  CATEGORIES,
  CATEGORY_LABEL,
  INBOUND_DOCS,
  ISSUE_DOCS,
  PRODUCTS,
  countByCategory,
  isReturn,
  matchesHistory,
  matchesInbound,
  matchesIssue,
  matchesQuery,
  type CategoryId,
} from "@/lib/general-stock";

/** ชิปแถวบน — ประเภทสินค้าทั้งหมด บวกมุมมองประวัติต่อท้าย */
const CHIPS: { id: CategoryId | "history"; label: string }[] = [
  ...CATEGORIES.map((c) => ({ id: c.id as CategoryId | "history", label: c.label })),
  { id: "history", label: "ประวัติ" },
];

type IssueKind = "all" | "issue" | "return";

const ISSUE_KINDS: { id: IssueKind; label: string }[] = [
  { id: "all", label: "ทั้งหมด" },
  { id: "issue", label: "รอจ่ายออก" },
  { id: "return", label: "รอรับคืน" },
];

export default function GeneralStockPage() {
  // ห่อไว้ที่นี่เพราะทั้งกล่องย้าย/ปรับปรุง และแท็บประวัติ อยู่ใต้หน้านี้ทั้งคู่
  return (
    <StockLogProvider>
      <GeneralStockView />
    </StockLogProvider>
  );
}

function GeneralStockView() {
  // กรอบจำลองอุปกรณ์อยู่ที่ AppShell ปุ่มสลับอยู่บนหัวเรื่อง
  // หน้านี้ขอรู้แค่ว่าตอนนี้อยู่ในกรอบหรือไม่ เพื่อเลือกจุดยึดของแถบติดบน
  const { framed } = useDevicePreview();
  // ประวัติมาจาก context เพราะการย้าย/ปรับปรุงจะเพิ่มรายการใหม่เข้ามาระหว่างใช้งาน
  const { rows: logRows } = useStockLog();
  // เลื่อนลงซ่อนแถบเครื่องมือ เลื่อนขึ้นเอากลับมา และโผล่ปุ่มกลับขึ้นบนสุดเมื่อลงมาไกล
  const { hidden, showTop, scrollToTop, scrollIntoTop } = useScrollState();
  // ของจริงแยกประเภทกันเด็ดขาด ไม่มีมุมมอง "ทั้งหมด"
  // ชิปจึงเป็นการนำทาง (เลือกอยู่เสมอหนึ่งอัน) ไม่ใช่ตัวกรองที่ปิดได้
  // "history" เป็นมุมมองพิเศษ ไม่ใช่ประเภทสินค้า แต่อยู่แถวชิปเดียวกัน
  // เพราะผู้ใช้คิดว่ามันคือ "อีกอย่างที่เลือกดูได้" เหมือนกัน
  const [cat, setCat] = React.useState<CategoryId | "history">("sack");
  const isHistory = cat === "history";
  const [lowOnly, setLowOnly] = React.useState(false);
  const [sort, setSort] = React.useState("product");
  const [query, setQuery] = React.useState("");
  const [showChips, setShowChips] = React.useState(true);
  const [showActions, setShowActions] = React.useState(true);
  // เปิด/ปิดรายการล็อตพร้อมกันทั้งหน้า อยู่ในตัวกรองอย่างเดียว
  // ไม่มีปุ่มแยกรายใบ เพราะรายการยาวมาก กดทีละใบไม่ไหว
  const [showLots, setShowLots] = React.useState(true);
  const [tab, setTab] = React.useState<"stock" | "inbound" | "issue">("stock");
  const [inboundQuery, setInboundQuery] = React.useState("");
  const [issueQuery, setIssueQuery] = React.useState("");
  const [issueKind, setIssueKind] = React.useState<IssueKind>("all");

  // ค่าที่ popover เป็นเจ้าของ — ล้างได้ทีเดียวจบ
  // ไม่ล้างประเภทสินค้ากับคำค้น เพราะสองอย่างนั้นเป็นการนำทาง ไม่ใช่ตัวกรอง
  const isDefault =
    !lowOnly && sort === "product" && showChips && showActions && showLots;
  const resetFilters = () => {
    setLowOnly(false);
    setSort("product");
    setShowChips(true);
    setShowActions(true);
    setShowLots(true);
  };

  // จำนวนบนชิปเป็นยอดจริงของแต่ละประเภท ไม่เปลี่ยนตามคำค้น
  // เพราะเป็นป้ายบอกทาง ไม่ใช่ตัวนับผลลัพธ์
  const counts = countByCategory(PRODUCTS);

  // ค้นหาทำงานอยู่ในประเภทที่เปิดอยู่เท่านั้น
  const visible = isHistory
    ? []
    : PRODUCTS.filter(
        (p) =>
          p.category === cat && matchesQuery(p, query) && (!lowOnly || p.low)
      );

  const historyVisible = logRows.filter((r) => matchesHistory(r, query));

  // หาไม่เจอในประเภทนี้ แต่มีในประเภทอื่น — บอกไว้เผื่อเปิดผิดที่
  const hitsElsewhere =
    isHistory || query.trim() === "" || visible.length > 0
      ? []
      : CATEGORIES.filter(
          (c) =>
            c.id !== cat &&
            PRODUCTS.some(
              (p) =>
                p.category === c.id &&
                matchesQuery(p, query) &&
                (!lowOnly || p.low)
            )
        );

  const inboundVisible = INBOUND_DOCS.filter((d) =>
    matchesInbound(d, inboundQuery)
  );

  // จำนวนบนชิปนับจากยอดจริงทั้งหมด ไม่เปลี่ยนตามคำค้น เหมือนชิปประเภทสินค้า
  const issueCounts = {
    all: ISSUE_DOCS.length,
    issue: ISSUE_DOCS.filter((d) => !isReturn(d.status)).length,
    return: ISSUE_DOCS.filter((d) => isReturn(d.status)).length,
  };
  const issueVisible = ISSUE_DOCS.filter(
    (d) =>
      matchesIssue(d, issueQuery) &&
      (issueKind === "all" ||
        (issueKind === "return") === isReturn(d.status))
  );

  // ---------- เลื่อนแถวชิปให้เห็นประเภทที่เปิดอยู่ ----------
  const chipRowRef = React.useRef<HTMLDivElement>(null);
  const chipRefs = React.useRef<Record<string, HTMLButtonElement | null>>({});
  const stickyRef = React.useRef<HTMLDivElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);

  /**
   * เปลี่ยนประเภทแล้วต้องได้เห็นสินค้าชิ้นแรกทันที
   * ถ้าปล่อยไว้เฉย ๆ คนที่เลื่อนลงมาลึกแล้วกดสลับประเภท จะเจอกลางรายการใหม่
   * ซึ่งไม่มีความหมายอะไรเลย
   *
   * เลื่อนแค่พอให้หัวรายการมาอยู่ใต้แถบเครื่องมือ ไม่ได้เด้งขึ้นบนสุด
   * แถบเครื่องมือจึงยังติดขอบอยู่ที่เดิม ไม่กระโดด
   */
  const changeCat = (next: CategoryId | "history") => {
    setCat(next);
    const list = listRef.current;
    if (!list) return;
    const bar = stickyRef.current?.offsetHeight ?? 0;
    scrollIntoTop(list, bar + (framed ? 0 : 56));
  };

  React.useEffect(() => {
    const row = chipRowRef.current;
    const chip = chipRefs.current[cat];
    if (!row || !chip) return;

    // คำนวณเองแทน scrollIntoView เพราะตัวนั้นจะลากหน้าเว็บเลื่อนแนวตั้งไปด้วย
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
      <div>
        <div className="px-4 py-3 sm:px-6 sm:py-5">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">ระบบ</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-primary">
                  สต็อกทั่วไป
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {/* ---------- หัวเรื่อง ----------
               ไม่มีปุ่มตรงนี้ ปุ่มที่ใช้ได้เฉพาะบางแท็บอยู่ใต้แถบแท็บ
               ตำแหน่งข้างชื่อหน้าสื่อว่าใช้ได้ทั้งหน้า พอความจริงไม่ตรง
               หัวเรื่องจะกระตุกทุกครั้งที่สลับแท็บเพราะปุ่มโผล่มาแล้วหายไป */}
          <div className="mt-2 min-w-0 sm:mt-3">
            <h1 className="text-2xl font-semibold tracking-tight">
              สต็อกทั่วไป
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              จัดการสต็อกทั่วไป
            </p>
          </div>

          <Tabs
            value={tab}
            onValueChange={(v) => setTab(v as typeof tab)}
            className="mt-4 sm:mt-5"
          >
            <TabsList className="w-full">
              <TabsTrigger value="stock" className="flex-1">
                สต็อก ({PRODUCTS.length})
              </TabsTrigger>
              <TabsTrigger value="inbound" className="flex-1">
                รอรับเข้า ({INBOUND_DOCS.length})
              </TabsTrigger>
              <TabsTrigger value="issue" className="flex-1">
                รอจ่าย/คืน ({ISSUE_DOCS.length})
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {tab === "stock" && (
            <>
          {/* ---------- ประเภทสินค้า + ปุ่มซ่อน/แสดง — ติดบนตอนเลื่อน ----------
               รายการยาว ถ้าปุ่มอยู่บนสุดอย่างเดียวต้องเลื่อนกลับไปกด
               จึงยกสองอย่างที่ใช้ระหว่างไล่ดู (สลับประเภท + ซ่อน/แสดง) มาติดบนไว้
               ลบขอบซ้ายขวาออกด้วย -mx เพื่อให้พื้นหลังเต็มความกว้างตอนติด */}
          <StickyToolbar hidden={hidden} barRef={stickyRef}>
          <div className="flex items-center gap-2 pt-2">
            <div
              ref={chipRowRef}
              className={cn(
                "flex min-w-0 flex-1 items-center gap-2 overflow-x-auto",
                "flex-nowrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              )}
            >
              <div
                role="tablist"
                aria-label="ประเภทสินค้า"
                className="flex shrink-0 items-center gap-2"
              >
                {CHIPS.map((c) => {
                  const on = cat === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      role="tab"
                      ref={(el) => {
                        chipRefs.current[c.id] = el;
                      }}
                      onClick={() => changeCat(c.id)}
                      aria-selected={on}
                      className={cn(
                        "shrink-0 rounded-full border px-3 py-1 text-sm whitespace-nowrap transition-colors",
                        on
                          ? "border-primary bg-brand font-medium text-primary"
                          : "border-border text-foreground hover:bg-accent-hover"
                      )}
                    >
                      {c.label} (
                      {c.id === "history"
                        ? logRows.length
                        : counts[c.id as CategoryId]}
                      )
                    </button>
                  );
                })}
              </div>

              {/* ประวัติเป็นรายการเหตุการณ์ ไม่ใช่ยอดคงเหลือ จึงไม่มีเรื่องสต็อกต่ำ
                  ซ่อนชิปไปเลยดีกว่าโชว์แล้วกดไม่ได้ */}
              {!isHistory && (
                <>
                  <span className="h-5 w-px shrink-0 bg-border" aria-hidden />

                  {/* ชิปนี้ต่างจากชิปประเภทตรงที่เป็นตัวกรองเปิด/ปิดได้
                      จึงมีกล่องติ๊กนำหน้าให้เห็นว่ากดเลือกเพิ่มได้ ไม่ใช่ปุ่มสลับหน้า */}
                  <button
                    type="button"
                    role="checkbox"
                    onClick={() => setLowOnly((v) => !v)}
                    aria-checked={lowOnly}
                    className={cn(
                      "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-sm whitespace-nowrap transition-colors",
                      lowOnly
                        ? "border-primary bg-brand font-medium text-primary"
                        : "border-border text-foreground hover:bg-accent-hover"
                    )}
                  >
                    {lowOnly ? (
                      <SquareCheckBigIcon className="size-4" />
                    ) : (
                      <SquareIcon className="size-4 text-muted-foreground" />
                    )}
                    สต็อกต่ำ
                  </button>
                </>
              )}
            </div>
          </div>

          {/* ---------- ค้นหา + ปุ่ม — อยู่ในแถบติดบนเดียวกับชิป ----------
               ค้นเฉพาะในประเภทที่เปิดอยู่ จึงต้องอยู่ใต้ชิป
               ปุ่มตัวกรองกับซ่อน/แสดงมาอยู่ข้างช่องค้นหา ตามแบบร่าง */}
          <div className="mt-3 flex items-center gap-2">
            {/* พื้นขาว ตัดกับพื้นเทาของแถบที่ติดบน */}
            <InputGroup className="min-w-0 flex-1 bg-card">
              <InputGroupAddon align="inline-start">
                <SearchIcon />
              </InputGroupAddon>
              <InputGroupInput
                placeholder={
                  isHistory
                    ? "ค้นหา..."
                    : `ค้นหาใน ${CATEGORY_LABEL[cat as CategoryId]}`
                }
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </InputGroup>

            {/* ตัวเลือกการแสดงผลเก็บไว้ในนี้ ไม่ต้องกินแถวข้างนอก
                มีจุดบอกเมื่อมีการซ่อนอะไรอยู่ จะได้ไม่ลืมว่าเคยปิดไว้ */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline-primary"
                  size="icon"
                  aria-label="ตัวกรองและการแสดงผล"
                  className="relative shrink-0"
                >
                  <ListFilterIcon />
                  {!isDefault && (
                    <span className="absolute top-1 right-1 size-2 rounded-full bg-primary" />
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-72">
                <PopoverHeader>
                  <PopoverTitle>ตัวกรองและการแสดงผล</PopoverTitle>
                  <PopoverDescription>
                    เก็บของที่ตั้งครั้งเดียวจบไว้ในนี้ หน้าหลักจะได้ไม่รก
                  </PopoverDescription>
                </PopoverHeader>

                <div className="mt-4 space-y-2">
                  <Label className="text-sm">เรียงตาม</Label>
                  <ToggleGroup
                    type="single"
                    variant="outline"
                    size="sm"
                    value={sort}
                    onValueChange={(v) => v && setSort(v)}
                    className="w-full"
                  >
                    <ToggleGroupItem value="product" className="flex-1">
                      สินค้า
                    </ToggleGroupItem>
                    <ToggleGroupItem value="zone" className="flex-1">
                      โซน
                    </ToggleGroupItem>
                    <ToggleGroupItem value="fifo" className="flex-1">
                      FIFO
                    </ToggleGroupItem>
                  </ToggleGroup>
                </div>

                <Separator className="my-4" />

                <div className="space-y-3">
                  <Label className="text-sm">แสดงในรายการ</Label>

                  {/* ผูกค่าเดียวกับชิปสต็อกต่ำด้านบน กดที่ไหนอีกที่ก็ขยับตาม */}
                  <Label
                    htmlFor="filter-low"
                    className={cn(
                      "flex items-center gap-3 font-normal",
                      isHistory && "opacity-50"
                    )}
                  >
                    {/* ประวัติเป็นรายการเหตุการณ์ ไม่มียอดคงเหลือให้วัดว่าต่ำหรือไม่
                        จึงปิดไว้แทนที่จะเอาออก คนจะได้เห็นว่ามีตัวเลือกนี้อยู่ */}
                    <Checkbox
                      id="filter-low"
                      checked={lowOnly && !isHistory}
                      disabled={isHistory}
                      onCheckedChange={(v) => setLowOnly(v === true)}
                    />
                    เฉพาะสต็อกต่ำ
                  </Label>

                  <Label
                    htmlFor="show-chips"
                    className="flex items-center gap-3 font-normal"
                  >
                    <Checkbox
                      id="show-chips"
                      checked={showChips}
                      onCheckedChange={(v) => setShowChips(v === true)}
                    />
                    <span className="flex items-center gap-2">
                      <TagIcon className="size-4" />
                      ป้ายในรายการ
                    </span>
                  </Label>

                  <Label
                    htmlFor="show-actions"
                    className="flex items-center gap-3 font-normal"
                  >
                    <Checkbox
                      id="show-actions"
                      checked={showActions}
                      onCheckedChange={(v) => setShowActions(v === true)}
                    />
                    <span className="flex items-center gap-2">
                      <SlidersHorizontalIcon className="size-4" />
                      ปุ่มย้าย / ปรับปรุง
                    </span>
                  </Label>

                  {/* หุบ/กางรายการล็อตทั้งหน้าจากที่นี่ที่เดียว
                      ปิดแล้วเหลือแต่หัวสินค้า ไล่ดูภาพรวมได้เร็วขึ้นมาก */}
                  <Label
                    htmlFor="show-lots"
                    className={cn(
                      "flex items-center gap-3 font-normal",
                      isHistory && "opacity-50"
                    )}
                  >
                    <Checkbox
                      id="show-lots"
                      checked={showLots && !isHistory}
                      disabled={isHistory}
                      onCheckedChange={(v) => setShowLots(v === true)}
                    />
                    <span className="flex items-center gap-2">
                      <ListIcon className="size-4" />
                      รายการล็อตในสินค้า
                    </span>
                  </Label>
                </div>

                {/* ปิดไว้ตอนทุกอย่างเป็นค่าเริ่มต้นอยู่แล้ว จะได้รู้ว่ามีอะไรให้ล้างไหม */}
                <Separator className="my-4" />
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  disabled={isDefault}
                  onClick={resetFilters}
                >
                  <RotateCcwIcon />
                  ล้างค่า
                </Button>
              </PopoverContent>
            </Popover>

            {/* ส่งออกได้เฉพาะรายการของแท็บสต็อก จึงอยู่ในแถบของแท็บนี้
                ไม่ใช่ข้างชื่อหน้า — ไม่งั้นหัวเรื่องจะกระตุกตอนสลับแท็บ
                วางริมสุดเพราะเป็นงานทำครั้งเดียวจบ ไม่ได้ใช้ระหว่างไล่ดูรายการ
                เหมือนปุ่มอื่นในแถวนี้ */}
            <Button
              size="icon"
              aria-label="ส่งออก CSV"
              className="shrink-0"
              onClick={() =>
                toast.info("ส่งออก CSV", {
                  description: isHistory
                    ? "ประวัติการทำรายการ"
                    : CATEGORY_LABEL[cat as CategoryId],
                })
              }
            >
              <DownloadIcon />
            </Button>
          </div>
          </StickyToolbar>

          {/* ---------- รายการสินค้า / ประวัติ ---------- */}
          <div ref={listRef} className="mt-4 space-y-4">
            {isHistory && <HistoryList rows={historyVisible} />}

            {!isHistory &&
              visible.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  showLots={showLots}
                  showChips={showChips}
                  showActions={showActions}
                />
              ))}

            {!isHistory && visible.length === 0 && (
              <div className="rounded-xl border border-dashed border-border px-6 py-14 text-center">
                <p className="font-medium">
                  ไม่พบใน “{CATEGORY_LABEL[cat as CategoryId]}”
                </p>

                {hitsElsewhere.length > 0 ? (
                  <>
                    {/* ประเภทแยกกันก็จริง แต่คนหาเลขล็อตมักไม่รู้ว่าอยู่ประเภทไหน
                        บอกไว้ให้กดข้ามไปได้เลย ดีกว่าปล่อยให้ไล่เปิดทีละอัน */}
                    <p className="mt-1 text-sm text-muted-foreground">
                      แต่เจอในประเภทอื่น
                    </p>
                    <div className="mt-4 flex flex-wrap justify-center gap-2">
                      {hitsElsewhere.map((c) => (
                        <Button
                          key={c.id}
                          variant="outline-primary"
                          size="sm"
                          onClick={() => setCat(c.id)}
                        >
                          ไปที่ {CATEGORY_LABEL[c.id]}
                        </Button>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {query.trim()
                      ? "ลองใช้คำค้นสั้นลง หรือเอาตัวกรองบางอันออก"
                      : "ยังไม่มีสินค้าในประเภทนี้"}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* สรุปท้ายรายการนับสินค้ากับล็อต ประวัติไม่มีสองอย่างนี้ */}
          {!isHistory && (
            <div className="mt-8 flex items-center gap-2">
              <Badge tone="neutral" appearance="outline">
                {visible.length} สินค้า
              </Badge>
              <Badge tone="neutral" appearance="outline">
                {visible.reduce((n, p) => n + p.lots.length, 0)} ล็อต
              </Badge>
            </div>
          )}
            </>
          )}

          {/* ---------- แท็บรอรับเข้า — เอกสารสั่งซื้อ คนละชนิดกับสต็อก ----------
               ไม่มีชิปประเภท ไม่มีเรียงตาม ไม่มีปุ่มส่งออก เพราะไม่เกี่ยวกัน */}
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
                  <Button
                    variant="outline-primary"
                    size="icon"
                    aria-label="ตัวกรองเอกสารรอรับเข้า"
                    className="shrink-0"
                  >
                    <ListFilterIcon />
                  </Button>
                </div>
              </StickyToolbar>

              <div className="mt-4">
                <InboundList docs={inboundVisible} />
              </div>
            </>
          )}

          {/* ---------- แท็บรอจ่าย/คืน — ใบขอเบิกกับใบขอคืนอยู่ตารางเดียวกัน ---------- */}
          {tab === "issue" && (
            <>
              <StickyToolbar hidden={hidden} barRef={stickyRef}>
                {/* ทิศทางของเอกสาร เลือกได้ทีละอัน เลื่อนแนวนอนเอาบนจอแคบ */}
                <div
                  role="tablist"
                  aria-label="ประเภทเอกสาร"
                  className={cn(
                    "flex items-center gap-2 overflow-x-auto pt-2",
                    "flex-nowrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                  )}
                >
                  {ISSUE_KINDS.map((k) => {
                    const on = issueKind === k.id;
                    return (
                      <button
                        key={k.id}
                        type="button"
                        role="tab"
                        aria-selected={on}
                        onClick={() => setIssueKind(k.id)}
                        className={cn(
                          "shrink-0 rounded-full border px-3 py-1 text-sm whitespace-nowrap transition-colors",
                          on
                            ? "border-primary bg-brand font-medium text-primary"
                            : "border-border text-foreground hover:bg-accent-hover"
                        )}
                      >
                        {k.label} ({issueCounts[k.id]})
                      </button>
                    );
                  })}
                </div>

                <div className="mt-3 flex items-center gap-2">
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
                  <Button
                    variant="outline-primary"
                    size="icon"
                    aria-label="ตัวกรองใบขอเบิก / ขอคืน"
                    className="shrink-0"
                  >
                    <ListFilterIcon />
                  </Button>
                </div>
              </StickyToolbar>

              <div className="mt-4">
                <IssueList docs={issueVisible} />
              </div>
            </>
          )}

          <BackToTop show={showTop} onClick={scrollToTop} />
        </div>
      </div>
    </main>
  );
}
