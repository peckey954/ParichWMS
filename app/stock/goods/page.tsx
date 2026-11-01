"use client";

import * as React from "react";
import { SearchIcon } from "lucide-react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@peckey954/ui/components/ui/input-group";
import { Tabs, TabsList, TabsTrigger } from "@peckey954/ui/components/ui/tabs";
import { cn } from "@peckey954/ui/lib/utils";
import { useDevicePreview, useScrollState } from "@/components/device-preview";
import { Crumbs } from "@/components/receiving/parts";
import { BackToTop, StickyToolbar } from "@/components/sticky-toolbar";
import { EmptyDocs } from "@/components/stock/doc-parts";
import { GoodsIssueList } from "@/components/stock/goods-issue-list";
import {
  GOODS_ISSUE_DOCS,
  isGoodsIssueOpen,
  isGoodsReturn,
  matchesGoodsIssue,
} from "@/lib/goods-issue";

/* ------------------------------------------------------------------
   สต็อกสินค้า — เมนูการคลังสินค้า

   ตอนนี้ทำแท็บรอจ่าย/คืนตาม Flow จ่ายออก ใน Figma ก่อน กดใบจ่ายออกแล้ว
   ไปหน้าจ่ายสินค้า แท็บสต็อกกับรอรับเข้ายังไม่มีแบบ จึงขึ้นป้ายบอกไว้
   และเปิดหน้านี้มาที่แท็บรอจ่าย/คืนเลย
------------------------------------------------------------------ */

type IssueKind = "all" | "issue" | "return";

const ISSUE_KINDS: { id: IssueKind; label: string }[] = [
  { id: "all", label: "ทั้งหมด" },
  { id: "issue", label: "รอจ่ายออก" },
  { id: "return", label: "รอรับคืน" },
];

export default function GoodsStockPage() {
  const { framed } = useDevicePreview();
  const { hidden, showTop, scrollToTop, scrollIntoTop, armScrollGuard, releaseScrollGuard } =
    useScrollState();
  const [tab, setTab] = React.useState<"stock" | "inbound" | "issue">("issue");
  const [query, setQuery] = React.useState("");
  const [kind, setKind] = React.useState<IssueKind>("all");

  const open = GOODS_ISSUE_DOCS.filter(isGoodsIssueOpen);
  // จำนวนบนชิปเป็นยอดจริง ไม่เปลี่ยนตามคำค้น เพราะเป็นป้ายบอกทาง
  const counts = {
    all: open.length,
    issue: open.filter((d) => !isGoodsReturn(d.status)).length,
    return: open.filter((d) => isGoodsReturn(d.status)).length,
  };
  const visible = open.filter(
    (d) =>
      matchesGoodsIssue(d, query) &&
      (kind === "all" || (kind === "return") === isGoodsReturn(d.status))
  );

  const stickyRef = React.useRef<HTMLDivElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);

  /** สลับชิปแล้วเลื่อนให้หัวรายการมาอยู่ใต้แถบเครื่องมือ ไม่เด้งขึ้นบนสุดทั้งหน้า */
  const changeKind = (next: IssueKind) => {
    setKind(next);
    const list = listRef.current;
    if (!list) return;
    const bar = stickyRef.current?.offsetHeight ?? 0;
    scrollIntoTop(list, bar + (framed ? 0 : 56));
  };

  return (
    <main className="mx-auto w-full max-w-7xl">
      <div className="px-4 py-3 sm:px-6 sm:py-5">
        <Crumbs trail={[{ label: "สต็อกสินค้า" }]} />

        <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:mt-3">สต็อกสินค้า</h1>
        <p className="mt-1 text-sm text-muted-foreground">จัดการสต็อก</p>

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
              สต็อก
            </TabsTrigger>
            <TabsTrigger value="inbound" className="flex-1">
              รอรับเข้า
            </TabsTrigger>
            <TabsTrigger value="issue" className="flex-1">
              รอจ่าย/คืน ({open.length})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {tab !== "issue" && (
          <div className="mt-4">
            <EmptyDocs
              title="แท็บนี้ยังไม่มีแบบ"
              hint="ตอนนี้ทำ Flow จ่ายออกไว้ที่แท็บรอจ่าย/คืน"
            />
          </div>
        )}

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
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
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
                {ISSUE_KINDS.map((k) => {
                  const on = kind === k.id;
                  return (
                    <button
                      key={k.id}
                      type="button"
                      role="tab"
                      aria-selected={on}
                      onClick={() => changeKind(k.id)}
                      className={cn(
                        "shrink-0 rounded-full border px-3 py-1 text-sm whitespace-nowrap transition-colors",
                        on
                          ? "border-primary bg-brand font-medium text-primary"
                          : "border-border text-foreground hover:bg-accent-hover"
                      )}
                    >
                      {k.label} ({counts[k.id]})
                    </button>
                  );
                })}
              </div>
            </StickyToolbar>

            <div
              ref={listRef}
              key={kind}
              className="mt-4 animate-in slide-in-from-bottom-3 fade-in duration-300"
            >
              <GoodsIssueList docs={visible} />
            </div>
          </>
        )}

        <BackToTop show={showTop} onClick={scrollToTop} />
      </div>
    </main>
  );
}
