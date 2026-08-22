"use client";

import * as React from "react";
import Link from "next/link";
import { ListFilterIcon, PlusIcon, SearchIcon } from "lucide-react";
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
import { cn } from "@peckey954/ui/lib/utils";
import { parseDateSlash } from "@/components/date-select";
import { useDevicePreview, useScrollState } from "@/components/device-preview";
import { BackToTop, StickyToolbar } from "@/components/sticky-toolbar";
import { PrFilter, PR_VIEW_DEFAULT, isPrViewDefault, type PrView } from "@/components/pr/pr-filter";
import { PrList } from "@/components/pr/pr-list";
import {
  matchesPr,
  PR_DOCS,
  PR_PRODUCTS,
  PR_STATUS_LABEL,
  type PrStatus,
} from "@/lib/pr";

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
  const [view, setView] = React.useState<PrView>(PR_VIEW_DEFAULT);
  const [filterOpen, setFilterOpen] = React.useState(false);
  const filterActive = !isPrViewDefault(view);

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

  const visible = PR_DOCS.filter((d) => {
    if (status !== "all" && d.status !== status) return false;
    if (!matchesPr(d, query)) return false;

    const from = view.neededRange?.from;
    const to = view.neededRange?.to;
    if (from || to) {
      const needed = parseDateSlash(d.neededDate);
      if (!needed) return false;
      if (from && needed < from) return false;
      if (to && needed > to) return false;
    }

    if (view.codeQuery.trim() !== "") {
      if (!d.code.toLowerCase().includes(view.codeQuery.trim().toLowerCase())) return false;
    }

    if (view.categories.length > 0 && !view.categories.includes(d.categoryId)) return false;

    // สินค้าเก็บเป็น id — ใบขอซื้อเก็บแค่ประเภท/ชื่อ/หมวดที่คัดลอกไว้ตอนสร้าง
    // จึงต้องย้อนหา product ที่ id นั้นตรงกับข้อมูลของใบก่อน
    if (view.productIds.length > 0) {
      const matches = view.productIds.some((id) => {
        const p = PR_PRODUCTS.find((x) => x.id === id);
        return p && p.category === d.categoryId && p.name === d.productName && p.sub === d.productSub;
      });
      if (!matches) return false;
    }

    if (view.packings.length > 0 && (!d.packing || !view.packings.includes(d.packing))) {
      return false;
    }

    if (view.requesters.length > 0 && !view.requesters.includes(d.requester)) return false;

    return true;
  });

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
              {/* ตัวกรองเป็นกล่องกลางจอ ชุดเดียวกับหน้าสต็อกทั่วไป
                  แก้ในกล่องก่อน กดตกลงถึงมีผล กากบาทกับ Esc คือยกเลิก */}
              <Dialog open={filterOpen} onOpenChange={setFilterOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline-primary"
                    size="icon"
                    aria-label="ตัวกรองและการแสดงผล"
                    className="relative shrink-0"
                  >
                    <ListFilterIcon />
                    {/* จุดบอกว่ามีอะไรถูกเปลี่ยนไว้ ไม่บอกว่ากี่อย่าง */}
                    {filterActive && (
                      <span className="absolute top-1 right-1 size-2 rounded-full bg-primary" />
                    )}
                  </Button>
                </DialogTrigger>
                <DialogContent
                  aria-describedby={undefined}
                  className="flex max-h-[85svh] flex-col gap-0 overflow-hidden! p-0 sm:max-w-md [&_[data-slot=dialog-close]]:focus:ring-0 [&_[data-slot=dialog-close]]:focus:ring-offset-0 [&_[data-slot=dialog-close]]:focus-visible:ring-2 [&_[data-slot=dialog-close]]:focus-visible:ring-ring [&_[data-slot=dialog-close]]:focus-visible:ring-offset-2"
                >
                  <DialogHeader className="px-4 pt-4 text-left">
                    <DialogTitle>ตัวกรองและการแสดงผล</DialogTitle>
                  </DialogHeader>
                  <PrFilter
                    view={view}
                    onApply={(next) => {
                      setView(next);
                      setFilterOpen(false);
                    }}
                  />
                </DialogContent>
              </Dialog>
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
