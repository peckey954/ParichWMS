"use client";

import * as React from "react";
import Link from "next/link";
import { CalendarIcon, ListFilterIcon, PlusIcon, SearchIcon } from "lucide-react";
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
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@peckey954/ui/components/ui/input-group";
import { cn } from "@peckey954/ui/lib/utils";
import { useDevicePreview, useScrollState } from "@/components/device-preview";
import { BackToTop, StickyToolbar } from "@/components/sticky-toolbar";
import { PrList } from "@/components/pr/pr-list";
import { matchesPr, PR_DOCS, PR_STATUS_LABEL, type PrStatus } from "@/lib/pr";

/* ------------------------------------------------------------------
   ขอซื้อ PR — หน้ารายการ ต้นทางของสายการจัดซื้อ

   สถานะเป็นชิปกรองแบบเลือกได้ทีละอัน (เหมือนชิปประเภทสินค้าในหน้าสต็อกทั่วไป)
   ไม่ใช่แท็บใหญ่ เพราะที่นี่มีหกตัวเลือกและ "ทั้งหมด" เป็นค่าเริ่มต้น
   สลับชิปแล้วเลื่อนจอไปจุดเริ่มรายการทันที ตามมาตรฐานเดียวกับหน้าสต็อกทั่วไป
------------------------------------------------------------------ */

type StatusChip = "all" | PrStatus;

const STATUS_CHIPS: StatusChip[] = [
  "all",
  "sent",
  "ordered",
  "partial",
  "stocked",
  "cancelled",
];

const CHIP_LABEL: Record<StatusChip, string> = {
  all: "ทั้งหมด",
  ...PR_STATUS_LABEL,
};

export default function PrListPage() {
  const { framed } = useDevicePreview();
  const { hidden, showTop, scrollToTop, scrollIntoTop } = useScrollState();

  const [status, setStatus] = React.useState<StatusChip>("all");
  const [query, setQuery] = React.useState("");

  const chipRowRef = React.useRef<HTMLDivElement>(null);
  const chipRefs = React.useRef<Record<string, HTMLButtonElement | null>>({});
  const stickyRef = React.useRef<HTMLDivElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);

  const counts = React.useMemo(() => {
    const c: Record<StatusChip, number> = {
      all: PR_DOCS.length,
      sent: 0,
      ordered: 0,
      partial: 0,
      stocked: 0,
      cancelled: 0,
    };
    for (const d of PR_DOCS) c[d.status] += 1;
    return c;
  }, []);

  const visible = PR_DOCS.filter(
    (d) => (status === "all" || d.status === status) && matchesPr(d, query)
  );

  const changeStatus = (next: StatusChip) => {
    setStatus(next);
    const list = listRef.current;
    if (!list) return;
    const bar = stickyRef.current?.offsetHeight ?? 0;
    scrollIntoTop(list, bar + (framed ? 0 : 56));
  };

  // เลื่อนแถวชิปให้เห็นตัวที่เปิดอยู่ เหมือนหน้าสต็อกทั่วไป
  React.useEffect(() => {
    const row = chipRowRef.current;
    const chip = chipRefs.current[status];
    if (!row || !chip) return;
    const rowBox = row.getBoundingClientRect();
    const chipBox = chip.getBoundingClientRect();
    const pad = 12;
    if (chipBox.left < rowBox.left) {
      row.scrollBy({ left: chipBox.left - rowBox.left - pad, behavior: "smooth" });
    } else if (chipBox.right > rowBox.right) {
      row.scrollBy({ left: chipBox.right - rowBox.right + pad, behavior: "smooth" });
    }
  }, [status]);

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
                <BreadcrumbPage className="text-primary">ขอซื้อ PR</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="mt-2 flex flex-wrap items-start justify-between gap-3 sm:mt-3">
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold tracking-tight">ขอซื้อ PR</h1>
              <p className="mt-1 text-sm text-muted-foreground">การขอซื้อสินค้า</p>
            </div>
            <Button asChild>
              <Link href="/pr/create">
                <PlusIcon />
                <span className="sm:hidden">สร้าง</span>
                <span className="hidden sm:inline">สร้างใบขอซื้อ</span>
              </Link>
            </Button>
          </div>

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
                  {STATUS_CHIPS.map((c) => {
                    const on = status === c;
                    return (
                      <button
                        key={c}
                        type="button"
                        role="tab"
                        ref={(el) => {
                          chipRefs.current[c] = el;
                        }}
                        onClick={() => changeStatus(c)}
                        aria-selected={on}
                        className={cn(
                          "shrink-0 rounded-full border px-3 py-1 text-sm whitespace-nowrap transition-colors",
                          on
                            ? "border-primary bg-brand font-medium text-primary"
                            : "border-border text-foreground hover:bg-accent-hover"
                        )}
                      >
                        {CHIP_LABEL[c]} ({counts[c]})
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
              {/* ยังไม่มีตัวเลือกช่วงวันที่ในระบบ — ช่องนี้เป็นเลย์เอาต์ตามแบบไว้ก่อน
                  เหมือนปุ่มตัวกรองข้างๆ ที่ยังไม่ผูกเงื่อนไขจริง */}
              <InputGroup className="hidden w-48 shrink-0 bg-card @lg:flex">
                <InputGroupAddon align="inline-start">
                  <CalendarIcon />
                </InputGroupAddon>
                <InputGroupInput readOnly placeholder="วันที่" />
              </InputGroup>
              <Button
                variant="outline-primary"
                size="icon"
                aria-label="ตัวกรองใบขอซื้อ"
                className="shrink-0"
              >
                <ListFilterIcon />
              </Button>
            </div>
          </StickyToolbar>

          <div
            ref={listRef}
            key={status}
            className="mt-4 animate-in slide-in-from-bottom-3 fade-in duration-300"
          >
            <PrList docs={visible} />
          </div>

          <BackToTop show={showTop} onClick={scrollToTop} />
        </div>
      </div>
    </main>
  );
}
