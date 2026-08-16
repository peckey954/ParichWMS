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
import {
  CwipFilter,
  cwipActiveCount,
  isCwipDefault,
} from "@/components/production/cwip-filter";
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
  // สถานะที่คนคุมไลน์กดเปลี่ยนเอง เก็บทับของเดิมเฉพาะใบที่ถูกแก้
  const [stages, setStages] = React.useState<Record<string, OrderStage>>({});
  // เลื่อนลงซ่อนแถบค้นหา เลื่อนขึ้นเอากลับมา แบบเดียวกับหน้าสต็อกทั่วไป
  const { hidden, showTop, scrollToTop, barRef } = useStickyToolbar();

  const withStage = (o: (typeof WAITING_ORDERS)[number]) =>
    stages[o.id] ? { ...o, stage: stages[o.id] } : o;

  const waiting = WAITING_ORDERS.map(withStage).filter((o) =>
    matchesOrder(o, query)
  );
  const done = DONE_ORDERS.filter((o) => matchesOrder(o, query));

  // ชิปสต็อกต่ำกับติ๊กในตัวกรองสั่งของเดียวกัน กดที่ไหนก็ได้ผลเหมือนกัน
  const cwip = filterCwip(CWIP_PRODUCTS, {
    query,
    lowOnly: cwipChip === "low" || cwipView.lowOnly,
    incomingOnly: cwipView.incomingOnly,
    kinds: cwipView.kinds,
    zones: cwipView.zones,
    sort: cwipView.sort,
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

  const PLACEHOLDER: Record<Tab, string> = {
    waiting: "ค้นหาเลขที่ใบผลิต หรือสูตร...",
    cwip: "ค้นหาสินค้า เลขล็อต หรือโซน...",
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

      {/* ติดบนและซ่อนตัวเองตอนเลื่อนลง เหมือนหน้าสต็อกทั่วไป
          แท็บ "ผลิตแล้ว" มี 46 ใบ ถ้าค้นหาอยู่บนสุดอย่างเดียว
          เลื่อนลงไปแล้วต้องลากกลับขึ้นทั้งหน้าเพื่อพิมพ์คำค้น */}
      <StickyToolbar hidden={hidden} barRef={barRef}>
        <div className="pt-2">
          <PackingToolbar
            query={query}
            onQuery={setQuery}
            placeholder={PLACEHOLDER[tab]}
            actions={TAB_ACTIONS[tab]}
            /* มีของให้กรองจริงเฉพาะแท็บ CWIP อีกสองแท็บเป็นตารางใบผลิต
               ยังไม่ได้ตกลงว่าจะกรองอะไร จึงปล่อยเป็นปุ่มเปล่าไว้ก่อน */
            filter={
              tab === "cwip" && isStockView ? (
                <CwipFilter view={cwipView} onChange={setCwipView} />
              ) : undefined
            }
            filterActive={
              tab === "cwip" && isStockView && !isCwipDefault(cwipView)
            }
            filterCount={
              tab === "cwip" && isStockView
                ? cwipActiveCount(cwipView)
                : undefined
            }
            onFilter={() => soon("ตัวกรอง")}
          />

          {/* ชิปอยู่ใต้ค้นหาในแถบติดบนเดียวกัน สลับมุมมองได้ตลอดตอนเลื่อน
              เลื่อนแนวนอนบนจอแคบ ห้าชิปลงจอ 390px ไม่หมด */}
          {tab === "cwip" && (
            <div
              role="tablist"
              aria-label="มุมมองสต็อก CWIP"
              className={cn(
                "mt-3 flex items-center gap-2 overflow-x-auto",
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
        </div>
      </StickyToolbar>

      <div className="mt-3">
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
          <PackingOrders orders={done} emptyTitle="ไม่พบใบผลิตที่ผลิตแล้ว" />
        )}
      </div>

      <SuggestMaterialsDialog open={suggestOpen} onOpenChange={setSuggestOpen} />

      <BackToTop show={showTop} onClick={scrollToTop} />
    </main>
  );
}
