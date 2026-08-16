"use client";

import * as React from "react";
import {
  DownloadIcon,
  ListFilterIcon,
  SearchIcon,
  SquareCheckBigIcon,
  SquareIcon,
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
import { useDevicePreview, useScrollState } from "@/components/device-preview";
import { BackToTop, StickyToolbar } from "@/components/sticky-toolbar";
import { HistoryList } from "@/components/stock/history-list";
import { StockLogProvider, useStockLog } from "@/components/stock/stock-log";
import { InboundList } from "@/components/stock/inbound-list";
import { IssueList } from "@/components/stock/issue-list";
import { ProductCard } from "@/components/stock/stock-parts";
import { FifoList, ZoneGroups } from "@/components/stock/lot-list";
import {
  STOCK_VIEW_DEFAULT,
  StockFilter,
  isStockDefault,
  type StockView,
} from "@/components/stock/stock-filter";
import {
  CATEGORIES,
  CATEGORY_LABEL,
  INBOUND_DOCS,
  ISSUE_DOCS,
  PRODUCTS,
  countByCategory,
  groupByZone,
  isReturn,
  matchesHistory,
  matchesInbound,
  matchesIssue,
  matchesQuery,
  sortFifo,
  sortProducts,
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
  const [query, setQuery] = React.useState("");
  // ทุกอย่างที่ตัวกรองเป็นเจ้าของอยู่ในก้อนเดียว แก้ในกล่องแล้วกดตกลงทีเดียวจบ
  const [view, setView] = React.useState<StockView>(STOCK_VIEW_DEFAULT);
  const [filterOpen, setFilterOpen] = React.useState(false);
  const [tab, setTab] = React.useState<"stock" | "inbound" | "issue">("stock");
  const [inboundQuery, setInboundQuery] = React.useState("");
  const [issueQuery, setIssueQuery] = React.useState("");
  const [issueKind, setIssueKind] = React.useState<IssueKind>("all");

  // จุดบนปุ่มขึ้นเมื่อมีอะไรต่างจากค่าเริ่มต้น ไม่ว่าจะเป็นติ๊ก การเรียง หรือดรอปดาวน์
  const filterActive = !isStockDefault(view);
  const lowOnly = view.lowOnly;

  // จำนวนบนชิปเป็นยอดจริงของแต่ละประเภท ไม่เปลี่ยนตามคำค้น
  // เพราะเป็นป้ายบอกทาง ไม่ใช่ตัวนับผลลัพธ์
  const counts = countByCategory(PRODUCTS);

  /**
   * ค้นหาทำงานอยู่ในประเภทที่เปิดอยู่เท่านั้น
   *
   * โซนกรองที่ระดับล็อต ไม่ใช่ระดับสินค้า
   * เลือกโซน A-1 แล้วต้องเห็นเฉพาะล็อตที่อยู่ A-1 ไม่ใช่เห็นทุกล็อตของสินค้านั้น
   * ไม่งั้นยอดรวมที่โชว์จะไม่ตรงกับสิ่งที่เห็นในรายการ
   */
  // ประเภทมาจากดรอปดาวน์ถ้าเลือกไว้ ไม่งั้นใช้ชิปที่เปิดอยู่
  // ดรอปดาวน์เลือกได้หลายประเภท ส่วนชิปเลือกได้ทีละอัน จึงให้ดรอปดาวน์ชนะ
  const cats: CategoryId[] =
    view.kinds.length > 0 ? view.kinds : [cat as CategoryId];

  const visible = isHistory
    ? []
    : PRODUCTS.filter(
        (p) =>
          cats.includes(p.category) &&
          matchesQuery(p, query) &&
          (!lowOnly || p.low)
      ).filter(
        (p) => view.products.length === 0 || view.products.includes(p.name)
      );

  // สามโหมดนี้เปลี่ยนหน่วยของรายการ ไม่ได้เปลี่ยนแค่ลำดับ
  const byProduct = sortProducts(visible, view.dir);
  const zoneGroups = groupByZone(visible, view.dir);
  const fifoRows = sortFifo(visible, view.dir);

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
   * เปลี่ยนประเภท/แท็บ/มุมมองแล้วต้องได้เห็นรายการแรกทันที
   * ถ้าปล่อยไว้เฉย ๆ คนที่เลื่อนลงมาลึกแล้วกดสลับ จะเจอกลางรายการใหม่ที่ไม่เกี่ยวกันเลย
   * (หรือพื้นที่ว่าง ถ้ารายการใหม่สั้นกว่าตำแหน่งที่เลื่อนอยู่)
   *
   * เลื่อนแค่พอให้หัวรายการมาอยู่ใต้แถบเครื่องมือ ไม่ได้เด้งขึ้นบนสุดทั้งหน้า
   * แถบเครื่องมือจึงยังติดขอบอยู่ที่เดิม ไม่กระโดด
   */
  const scrollListToTop = React.useCallback(() => {
    const list = listRef.current;
    if (!list) return;
    const bar = stickyRef.current?.offsetHeight ?? 0;
    scrollIntoTop(list, bar + (framed ? 0 : 56));
  }, [framed, scrollIntoTop]);

  const changeCat = (next: CategoryId | "history") => {
    setCat(next);
    scrollListToTop();
  };

  const changeIssueKind = (next: IssueKind) => {
    setIssueKind(next);
    scrollListToTop();
  };

  // แท็บใหญ่ (สต็อก / รอรับเข้า / รอจ่าย-คืน) ไม่ล็อกอยู่ในแถบติดบน อยู่บนสุด
  // ของหน้าอยู่แล้วตามปกติ กดได้ก็ต่อเมื่อเลื่อนอยู่ใกล้บนสุดพออยู่แล้ว
  // จึงแค่สลับข้อมูลเฉย ๆ ไม่ต้องมีพิธีเลื่อน/อนิเมชันแบบชิป

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
                    onClick={() =>
                      setView((v) => ({ ...v, lowOnly: !v.lowOnly }))
                    }
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

            {/* ตัวกรองเป็นกล่องกลางจอ ชุดเดียวกับหน้าสต็อก CWIP
                แก้ในกล่องก่อน กดตกลงถึงมีผล กากบาทกับ Esc คือยกเลิก
                เลขบนปุ่มบอกว่ากรองอยู่กี่เงื่อนไข ไม่ใช่แค่ว่ามีหรือไม่มี */}
            <Dialog open={filterOpen} onOpenChange={setFilterOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline-primary"
                  size="icon"
                  aria-label="ตัวกรองและการแสดงผล"
                  className="relative shrink-0"
                >
                  <ListFilterIcon />
                  {/* จุดบอกว่ามีอะไรถูกเปลี่ยนไว้ ไม่บอกว่ากี่อย่าง
                      ขนาดกับตำแหน่งตามคอมโพเนนต์ในไฟล์ออกแบบ */}
                  {filterActive && (
                    <span className="absolute top-1 right-1 size-2 rounded-full bg-primary" />
                  )}
                </Button>
              </DialogTrigger>
              {/* ไม่มีคำอธิบายใต้หัวข้อ — aria-describedby ต้องเป็น undefined ชัด ๆ
                  ไม่งั้น Radix เตือนว่าหา DialogDescription ไม่เจอ */}
              {/* ปุ่มกากบาทของ DS ใช้ focus: ซึ่งติดตอนคลิกเมาส์ด้วย
                  กดปิดแล้วเลยมีกรอบส้มค้างไว้ทั้งที่ไม่ได้ใช้คีย์บอร์ด
                  ปิดวงแหวนของ focus แล้วคืนให้เฉพาะ focus-visible ซึ่งขึ้นเฉพาะตอนกด Tab */}
              <DialogContent
                aria-describedby={undefined}
                className="flex max-h-[85svh] flex-col gap-0 overflow-hidden! p-0 sm:max-w-md [&_[data-slot=dialog-close]]:focus:ring-0 [&_[data-slot=dialog-close]]:focus:ring-offset-0 [&_[data-slot=dialog-close]]:focus-visible:ring-2 [&_[data-slot=dialog-close]]:focus-visible:ring-ring [&_[data-slot=dialog-close]]:focus-visible:ring-offset-2"
              >
                <DialogHeader className="px-4 pt-4 text-left">
                  <DialogTitle>ตัวกรองและการแสดงผล</DialogTitle>
                </DialogHeader>
                <StockFilter
                  view={view}
                  onApply={(next) => {
                    setView(next);
                    setFilterOpen(false);
                  }}
                />
              </DialogContent>
            </Dialog>

            {/* ส่งออกได้เฉพาะรายการของแท็บสต็อก จึงอยู่ในแถบของแท็บนี้
                ไม่ใช่ข้างชื่อหน้า — ไม่งั้นหัวเรื่องจะกระตุกตอนสลับแท็บ
                วางริมสุดเพราะเป็นงานทำครั้งเดียวจบ ไม่ได้ใช้ระหว่างไล่ดูรายการ
                เหมือนปุ่มอื่นในแถวนี้
                เส้นขอบไม่ใช่พื้นทึบ เพราะนาน ๆ ใช้ที ไม่ควรเด่นกว่าของที่ใช้ทุกวัน */}
            <Button
              variant="outline-primary"
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

          {/* ---------- รายการสินค้า / ประวัติ ----------
               key=cat บังคับ React ถอด/สร้างก้อนนี้ใหม่ทุกครั้งที่สลับชิป
               ให้เห็นรายการชุดใหม่ไถลขึ้นมาจริง ๆ ไม่ใช่แค่เปลี่ยนข้อมูลเฉย ๆ
               ตำแหน่งเลื่อนหน้ากระโดดไปรอที่จุดหมายแล้ว (scrollListToTop)
               ที่เห็นไหลจึงเป็นแค่การ์ดเข้าที่ ไม่ใช่หน้าเลื่อนยาว */}
          <div
            ref={listRef}
            key={cat}
            className="mt-4 animate-in slide-in-from-bottom-3 fade-in space-y-4 duration-300"
          >
            {isHistory && <HistoryList rows={historyVisible} />}

            {/* หน่วยของรายการเปลี่ยนตามโหมดที่เลือก ไม่ใช่ตารางเดิมสลับลำดับ
                สินค้า = การ์ดสินค้า ล็อตอยู่ข้างใน
                โซน   = กลุ่มตามโซน หัวกลุ่มบอกว่าโซนนี้มีอะไรบ้าง
                FIFO  = ไล่ล็อตรวดเดียว ไม่มีหัวกลุ่ม */}
            {!isHistory &&
              view.sort === "product" &&
              byProduct.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  showLots={view.showLots}
                  showChips={view.showChips}
                  showActions={view.showActions}
                />
              ))}

            {!isHistory && view.sort === "zone" && (
              <ZoneGroups
                groups={zoneGroups}
                showChips={view.showChips}
                showActions={view.showActions}
              />
            )}

            {!isHistory && view.sort === "fifo" && fifoRows.length > 0 && (
              <FifoList
                rows={fifoRows}
                showChips={view.showChips}
                showActions={view.showActions}
              />
            )}

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

              <div
                ref={listRef}
                className="mt-4 animate-in slide-in-from-bottom-3 fade-in duration-300"
              >
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
                        onClick={() => changeIssueKind(k.id)}
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

              <div
                ref={listRef}
                key={issueKind}
                className="mt-4 animate-in slide-in-from-bottom-3 fade-in duration-300"
              >
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
