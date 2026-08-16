"use client";

import * as React from "react";
import {
  BrushCleaningIcon,
  DownloadIcon,
  ListTodoIcon,
  WarehouseIcon,
} from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@peckey954/ui/components/ui/breadcrumb";
import { Tabs, TabsList, TabsTrigger } from "@peckey954/ui/components/ui/tabs";
import { toast } from "sonner";
import {
  CWIP_VIEW_DEFAULT,
  PackingCwip,
  type CwipView,
} from "@/components/production/packing-cwip";
import { CwipFilter, isCwipDefault } from "@/components/production/cwip-filter";
import { CwipActiveFilters } from "@/components/production/cwip-active-filters";
import { PackingOrders } from "@/components/production/packing-orders";
import {
  CwipHistoryList,
  CwipRequestList,
} from "@/components/production/cwip-views";
import {
  ActionButtons,
  type PackingAction,
} from "@/components/production/packing-actions";
import { PackingToolbar } from "@/components/production/packing-toolbar";
import { useDevicePreview } from "@/components/device-preview";
import {
  BackToTop,
  StickyToolbar,
  useStickyToolbar,
} from "@/components/sticky-toolbar";
import { SuggestMaterialsDialog } from "@/components/production/suggest-materials-dialog";
import {
  CWIP_HISTORY,
  CWIP_INBOUND,
  CWIP_PRODUCTS,
  CWIP_RETURNS,
  DONE_ORDERS,
  WAITING_ORDERS,
  cwipLowCount,
  filterCwip,
  matchesMove,
  matchesOrder,
  matchesRequest,
  type OrderStage,
} from "@/lib/packing-list";
import { cn } from "@peckey954/ui/lib/utils";

/* ------------------------------------------------------------------
   รายการผลิตแบ่งบรรจุ

   ปุ่มคำสั่งของแต่ละแท็บอยู่ใต้แถบแท็บ ไม่ใช่ข้างชื่อหน้า
   เพราะปุ่มพวกนี้ใช้ได้เฉพาะแท็บที่เปิดอยู่ ตำแหน่งต้องบอกขอบเขตให้ตรง
   ถ้าไปวางข้างชื่อหน้า พอสลับแท็บแล้วปุ่มเปลี่ยน แถบหัวจะกระตุก
   และมุมขวาบนจะกลายเป็นตำแหน่งที่มีปุ่มคนละตัวในแต่ละแท็บ เสี่ยงกดผิด

   ข้างชื่อหน้าเหลือไว้ให้ปุ่มที่ใช้ได้ทุกแท็บเท่านั้น ตอนนี้ยังไม่มี
------------------------------------------------------------------ */

type Tab = "waiting" | "cwip" | "done";

/* ชิปของแท็บ CWIP — เลือกได้ทีละอัน เป็นการนำทาง ไม่ใช่ตัวกรองที่ปิดได้
   สองอันแรกเป็นยอดคงเหลือ (การ์ดสินค้า > ล็อต)
   สามอันหลังเป็นเอกสาร (ตาราง) คนละชนิดกันแต่อยู่ในแท็บเดียวกัน
   เพราะทั้งหมดคือ "ของที่ไลน์ผลิต" ที่คนคุมไลน์ต้องดูในที่เดียว */
type CwipChip = "stock" | "low" | "inbound" | "returns" | "history";

export default function PackingListPage() {
  const [tab, setTab] = React.useState<Tab>("waiting");
  const [query, setQuery] = React.useState("");
  const [suggestOpen, setSuggestOpen] = React.useState(false);
  // สิ่งที่เลือกซ่อน/แสดงได้ในแท็บ CWIP — ตัวกรองเป็นเจ้าของค่าชุดนี้
  const [cwipView, setCwipView] = React.useState<CwipView>(CWIP_VIEW_DEFAULT);
  const [cwipChip, setCwipChip] = React.useState<CwipChip>("stock");
  const [filterOpen, setFilterOpen] = React.useState(false);
  // สถานะที่คนคุมไลน์กดเปลี่ยนเอง เก็บทับของเดิมเฉพาะใบที่ถูกแก้
  const [stages, setStages] = React.useState<Record<string, OrderStage>>({});
  // แถบค้นหา+ชิปล็อกติดบนตลอด แบบเดียวกับหน้าสต็อกทั่วไป
  const { showTop, scrollToTop, scrollIntoTop, barRef } = useStickyToolbar();
  const { framed } = useDevicePreview();

  /**
   * สลับแท็บหรือชิป CWIP แล้วต้องเห็นรายการแรกทันที เหมือนหน้าสต็อกทั่วไป
   * ทุกแท็บ/ชิปใช้ก้อนรายการเดียวกัน (listRef ด้านล่าง) ทีละก้อนเท่านั้น
   * จึงเลื่อนใน effect หลัง render ข้ามรอบแรกไว้ ไม่งั้นหน้าเด้งเองตอนเพิ่งโหลด
   */
  const listRef = React.useRef<HTMLDivElement>(null);
  const scrollListToTop = React.useCallback(() => {
    const list = listRef.current;
    if (!list) return;
    const bar = barRef.current?.offsetHeight ?? 0;
    scrollIntoTop(list, bar + (framed ? 0 : 56));
  }, [barRef, framed, scrollIntoTop]);

  const mountedRef = React.useRef(false);
  React.useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    scrollListToTop();
  }, [tab, cwipChip, scrollListToTop]);

  const withStage = (o: (typeof WAITING_ORDERS)[number]) =>
    stages[o.id] ? { ...o, stage: stages[o.id] } : o;

  const waiting = WAITING_ORDERS.map(withStage).filter((o) =>
    matchesOrder(o, query)
  );
  const done = DONE_ORDERS.filter((o) => matchesOrder(o, query));

  // สต็อกต่ำมาจากชิปแถวบนอย่างเดียว ไม่มีติ๊กซ้ำในกล่องตัวกรอง
  const cwip = filterCwip(CWIP_PRODUCTS, {
    query,
    lowOnly: cwipChip === "low",
    kinds: cwipView.kinds,
    zones: cwipView.zones,
    lots: cwipView.lots,
    products: cwipView.products,
    sort: cwipView.sort,
    dir: cwipView.dir,
  });
  const inbound = CWIP_INBOUND.filter((d) => matchesRequest(d, query));
  const returns = CWIP_RETURNS.filter((d) => matchesRequest(d, query));
  const history = CWIP_HISTORY.filter((m) => matchesMove(m, query));

  const CWIP_CHIPS: { id: CwipChip; label: string; count: number }[] = [
    { id: "stock", label: "สต็อกสินค้า", count: CWIP_PRODUCTS.length },
    { id: "low", label: "สต็อกต่ำ", count: cwipLowCount(CWIP_PRODUCTS) },
    { id: "inbound", label: "รอรับเข้า", count: CWIP_INBOUND.length },
    { id: "returns", label: "รอคืนกลับคลัง", count: CWIP_RETURNS.length },
    { id: "history", label: "ประวัติ", count: CWIP_HISTORY.length },
  ];

  /** ชิปที่เป็นยอดคงเหลือ — อีกสามอันเป็นเอกสาร ใช้ตัวกรองคนละชุด */
  const isStockView = cwipChip === "stock" || cwipChip === "low";

  const soon = (what: string) => toast.info(what, { description: "ยังไม่ได้ต่อกับหลังบ้าน" });

  /*
   * ปุ่มระดับหน้า — กดได้ทุกแท็บ จึงอยู่ข้างชื่อหน้าได้
   * อยู่ที่เดิมตลอด ไม่โผล่มาแล้วหายไป หัวหน้าจึงไม่กระตุกตอนสลับแท็บ
   */
  const PAGE_ACTIONS: PackingAction[] = [
    {
      id: "sweep",
      label: "รายงานกวาดพื้น",
      icon: BrushCleaningIcon,
      onSelect: () => soon("รายงานกวาดพื้น"),
    },
    {
      id: "issue",
      label: "เบิกจากคลัง",
      icon: WarehouseIcon,
      onSelect: () => soon("เบิกจากคลัง"),
    },
    {
      id: "suggest",
      label: "แนะนำวัตถุดิบที่ใช้วันนี้",
      // รายการมีติ๊ก = สิ่งที่ต้องไปหยิบทีละอย่าง ตรงกับสิ่งที่กล่องนี้บอก
      icon: ListTodoIcon,
      primary: true,
      onSelect: () => setSuggestOpen(true),
    },
  ];

  /** ปุ่มที่ใช้ได้เฉพาะแท็บนั้น อยู่ใต้แถบแท็บ — ส่งออกได้เฉพาะรายการสต็อก */
  const TAB_ACTIONS: Record<Tab, PackingAction[]> = {
    waiting: [],
    cwip: [
      {
        id: "csv",
        label: "ส่งออก CSV",
        icon: DownloadIcon,
        onSelect: () => soon("ส่งออก CSV"),
      },
    ],
    done: [],
  };

  /** ข้อความในช่องค้นหาบอกว่าตอนนี้ค้นอะไรได้บ้าง — ต่างกันทุกชิป */
  const CWIP_PLACEHOLDER: Record<CwipChip, string> = {
    stock: "ค้นหาสินค้า เลขล็อต หรือโซน...",
    low: "ค้นหาสินค้า เลขล็อต หรือโซน...",
    inbound: "ค้นหาเลขที่ขอเบิก สินค้า หรือผู้ทำรายการ...",
    returns: "ค้นหาเลขที่ขอคืน สินค้า หรือผู้ทำรายการ...",
    history: "ค้นหาเลขที่ทำรายการ Lot หรือผู้ทำรายการ...",
  };

  const PLACEHOLDER: Record<Tab, string> = {
    waiting: "ค้นหาเลขที่ใบผลิต หรือสูตร...",
    cwip: CWIP_PLACEHOLDER[cwipChip],
    done: "ค้นหาเลขที่ใบผลิต หรือสูตร...",
  };

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 sm:py-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">ระบบ</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="text-primary">
              ผลิตแบ่งบรรจุ
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mt-2 flex items-start justify-between gap-3 sm:mt-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">ผลิตแบ่งบรรจุ</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            ผลิตสินค้า ไลน์กลาง แบ่งบรรจุ
          </p>
        </div>
        <ActionButtons actions={PAGE_ACTIONS} />
      </div>

      <Tabs
        value={tab}
        onValueChange={(v) => setTab(v as Tab)}
        className="mt-4 sm:mt-5"
      >
        <TabsList className="w-full">
          <TabsTrigger value="waiting" className="flex-1">
            รอผลิต ({WAITING_ORDERS.length})
          </TabsTrigger>
          <TabsTrigger value="cwip" className="flex-1">
            สต็อก CWIP ({CWIP_PRODUCTS.length})
          </TabsTrigger>
          <TabsTrigger value="done" className="flex-1">
            ผลิตแล้ว ({DONE_ORDERS.length})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* ล็อกติดบนตลอด เหมือนหน้าสต็อกทั่วไป
          แท็บ "ผลิตแล้ว" มี 46 ใบ ถ้าค้นหาอยู่บนสุดอย่างเดียว
          เลื่อนลงไปแล้วต้องลากกลับขึ้นทั้งหน้าเพื่อพิมพ์คำค้น */}
      <StickyToolbar barRef={barRef}>
        <div className="pt-2">
          {/* ชิปอยู่เหนือช่องค้นหา เพราะชิปคือขอบเขต ส่วนค้นหาคือการหาข้างในขอบเขตนั้น
              แต่ละชิปเป็นข้อมูลคนละชุด (การ์ดสินค้า / ตารางเอกสาร / ตารางประวัติ)
              สิ่งที่ค้นได้จึงต่างกันด้วย ดูได้จาก placeholder ที่เปลี่ยนตามชิป
              อ่านจากบนลงล่างต้องเรียงตามการครอบ แท็บ > ชิป > ค้นหา
              เหมือนหน้าสต็อกทั่วไปที่วางแบบนี้อยู่แล้ว

              เลื่อนแนวนอนบนจอแคบ ห้าชิปลงจอ 390px ไม่หมด */}
          {tab === "cwip" && (
            <div
              role="tablist"
              aria-label="มุมมองสต็อก CWIP"
              className={cn(
                "mb-3 flex items-center gap-2 overflow-x-auto",
                "flex-nowrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              )}
            >
              {CWIP_CHIPS.map((c) => {
                const on = cwipChip === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    role="tab"
                    aria-selected={on}
                    onClick={() => setCwipChip(c.id)}
                    className={cn(
                      "shrink-0 rounded-full border px-3 py-1 text-sm whitespace-nowrap transition-colors",
                      on
                        ? "border-primary bg-brand font-medium text-primary"
                        : "border-border text-foreground hover:bg-accent-hover"
                    )}
                  >
                    {c.label} ({c.count})
                  </button>
                );
              })}

            </div>
          )}

          <PackingToolbar
            query={query}
            onQuery={setQuery}
            placeholder={PLACEHOLDER[tab]}
            actions={TAB_ACTIONS[tab]}
            /* มีของให้กรองจริงเฉพาะแท็บ CWIP อีกสองแท็บเป็นตารางใบผลิต
               ยังไม่ได้ตกลงว่าจะกรองอะไร จึงปล่อยเป็นปุ่มเปล่าไว้ก่อน */
            filter={
              tab === "cwip" && isStockView ? (
                <CwipFilter
                  view={cwipView}
                  onApply={(next) => {
                    setCwipView(next);
                    setFilterOpen(false);
                  }}
                />
              ) : undefined
            }
            filterActive={
              tab === "cwip" && isStockView && !isCwipDefault(cwipView)
            }
            filterOpen={filterOpen}
            onFilterOpenChange={setFilterOpen}
            onFilter={() => soon("ตัวกรอง")}
          />

          {/* บอกว่ากรองอะไรอยู่ อยู่ติดกับรายการเพราะมันอธิบายรายการ
              ไม่มีอะไรกรองก็ไม่มีแถวนี้ ไม่จองที่ว่างไว้ */}
          {tab === "cwip" && isStockView && (
            <CwipActiveFilters
              view={cwipView}
              onChange={setCwipView}
              onOpenFilter={() => setFilterOpen(true)}
            />
          )}

        </div>
      </StickyToolbar>

      <div ref={listRef} className="mt-3">
        {tab === "waiting" && (
          <PackingOrders
            orders={waiting}
            emptyTitle="ไม่พบใบผลิตที่รออยู่"
            onStage={(id, stage) =>
              setStages((prev) => ({ ...prev, [id]: stage }))
            }
          />
        )}

        {tab === "cwip" && isStockView && (
          <PackingCwip products={cwip} view={cwipView} />
        )}
        {tab === "cwip" && cwipChip === "inbound" && (
          <CwipRequestList
            rows={inbound}
            codeLabel="เลขที่ขอเบิก"
            tonLabel="ปริมาณขอเบิก"
            qtyLabel="จำนวนขอเบิก"
            emptyTitle="ไม่มีใบขอเบิกที่รอรับเข้า"
          />
        )}
        {tab === "cwip" && cwipChip === "returns" && (
          <CwipRequestList
            rows={returns}
            codeLabel="เลขที่ขอคืนกลับคลัง"
            tonLabel="ปริมาณขอคืน"
            qtyLabel="จำนวนขอคืน"
            emptyTitle="ไม่มีใบขอคืนกลับคลัง"
          />
        )}
        {tab === "cwip" && cwipChip === "history" && (
          <CwipHistoryList rows={history} />
        )}
        {tab === "done" && (
          <PackingOrders
            orders={done}
            emptyTitle="ไม่พบใบผลิตที่ผลิตแล้ว"
            showStage={false}
          />
        )}
      </div>

      <SuggestMaterialsDialog open={suggestOpen} onOpenChange={setSuggestOpen} />

      <BackToTop show={showTop} onClick={scrollToTop} />
    </main>
  );
}
