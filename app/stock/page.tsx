"use client";

import * as React from "react";
import {
  ChevronsDownUpIcon,
  ChevronsUpDownIcon,
  DownloadIcon,
  ListFilterIcon,
  MonitorIcon,
  SearchIcon,
  SlidersHorizontalIcon,
  SmartphoneIcon,
  TabletIcon,
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
import { Tabs, TabsList, TabsTrigger } from "@peckey954/ui/components/ui/tabs";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@peckey954/ui/components/ui/toggle-group";
import { cn } from "@peckey954/ui/lib/utils";
import { ProductCard } from "@/components/stock/stock-parts";
import {
  CATEGORIES,
  CATEGORY_LABEL,
  PRODUCTS,
  countByCategory,
  matchesQuery,
  type CategoryId,
} from "@/lib/general-stock";

type Device = "desktop" | "tablet" | "mobile";

const DEVICE: Record<Device, { label: string; width: string; px: string }> = {
  desktop: { label: "เดสก์ท็อป", width: "100%", px: "เต็มจอ" },
  tablet: { label: "แท็บเล็ต", width: "834px", px: "834px" },
  mobile: { label: "มือถือ", width: "390px", px: "390px" },
};

export default function GeneralStockPage() {
  // เก็บอุปกรณ์กับสถานะย่อ/กางไว้ก้อนเดียว จะได้เปลี่ยนพร้อมกันในการ setState ครั้งเดียว
  const [view, setView] = React.useState<{ device: Device; expanded: boolean }>({
    device: "desktop",
    expanded: true,
  });
  const { device, expanded } = view;
  // ของจริงแยกประเภทกันเด็ดขาด ไม่มีมุมมอง "ทั้งหมด"
  // ชิปจึงเป็นการนำทาง (เลือกอยู่เสมอหนึ่งอัน) ไม่ใช่ตัวกรองที่ปิดได้
  const [cat, setCat] = React.useState<CategoryId>("sack");
  const [lowOnly, setLowOnly] = React.useState(false);
  const [sort, setSort] = React.useState("product");
  const [query, setQuery] = React.useState("");
  const [showChips, setShowChips] = React.useState(true);
  const [showActions, setShowActions] = React.useState(true);

  const changeDevice = (d: Device) => setView({ device: d, expanded: true });
  const toggleExpand = () => setView((v) => ({ ...v, expanded: !v.expanded }));

  // จำนวนบนชิปเป็นยอดจริงของแต่ละประเภท ไม่เปลี่ยนตามคำค้น
  // เพราะเป็นป้ายบอกทาง ไม่ใช่ตัวนับผลลัพธ์
  const counts = countByCategory(PRODUCTS);

  // ค้นหาทำงานอยู่ในประเภทที่เปิดอยู่เท่านั้น
  const visible = PRODUCTS.filter(
    (p) => p.category === cat && matchesQuery(p, query) && (!lowOnly || p.low)
  );

  // หาไม่เจอในประเภทนี้ แต่มีในประเภทอื่น — บอกไว้เผื่อเปิดผิดที่
  const hitsElsewhere =
    query.trim() === "" || visible.length > 0
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

  // ---------- เลื่อนแถวชิปให้เห็นประเภทที่เปิดอยู่ ----------
  const chipRowRef = React.useRef<HTMLDivElement>(null);
  const chipRefs = React.useRef<Record<string, HTMLButtonElement | null>>({});

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
    <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
      {/* ---------- แถบเครื่องมือสำหรับรีวิวดีไซน์ ---------- */}
      <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-muted px-4 py-3">
        <Label className="text-sm">ดูแบบ</Label>
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          value={device}
          onValueChange={(v) => v && changeDevice(v as Device)}
        >
          <ToggleGroupItem value="desktop" aria-label="ดูแบบเดสก์ท็อป">
            <MonitorIcon />
            เดสก์ท็อป
          </ToggleGroupItem>
          <ToggleGroupItem value="tablet" aria-label="ดูแบบแท็บเล็ต">
            <TabletIcon />
            แท็บเล็ต
          </ToggleGroupItem>
          <ToggleGroupItem value="mobile" aria-label="ดูแบบมือถือ">
            <SmartphoneIcon />
            มือถือ
          </ToggleGroupItem>
        </ToggleGroup>
        <span className="text-sm tabular-nums text-muted-foreground">
          {DEVICE[device].px}
        </span>
      </div>

      {/* ---------- กรอบจำลองอุปกรณ์ ---------- */}
      <div
        className={cn(
          "@container mx-auto w-full transition-[max-width] duration-300",
          device !== "desktop" &&
            "overflow-hidden rounded-2xl border border-border shadow-sm"
        )}
        style={{ maxWidth: DEVICE[device].width }}
      >
        <div className="px-4 py-5 sm:px-6">
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

          <h1 className="mt-3 text-2xl font-semibold tracking-tight">
            สต็อกทั่วไป
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">จัดการสต็อกทั่วไป</p>

          <Tabs defaultValue="stock" className="mt-5">
            <TabsList className="w-full">
              <TabsTrigger value="stock" className="flex-1">
                สต็อกสินค้า ({PRODUCTS.length})
              </TabsTrigger>
              <TabsTrigger value="inbound" className="flex-1">
                รอรับเข้า (3)
              </TabsTrigger>
              <TabsTrigger value="issue" className="flex-1">
                รอจ่าย/คืน (4)
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* ---------- ประเภทสินค้า = การนำทาง อยู่เหนือช่องค้นหา ----------
               แต่ละประเภทแยกกันเด็ดขาด ไม่มี "ทั้งหมด" เลือกอยู่เสมอหนึ่งอัน
               บรรทัดเดียว ปัดเลื่อนได้บนจอแคบ */}
          <div
            ref={chipRowRef}
            className={cn(
              "mt-4 flex items-center gap-2 overflow-x-auto",
              "flex-nowrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            )}
            role="tablist"
            aria-label="ประเภทสินค้า"
          >
            {CATEGORIES.map((c) => {
              const on = cat === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  role="tab"
                  ref={(el) => {
                    chipRefs.current[c.id] = el;
                  }}
                  onClick={() => setCat(c.id)}
                  aria-selected={on}
                  className={cn(
                    "shrink-0 rounded-full border px-3 py-1 text-sm whitespace-nowrap transition-colors",
                    on
                      ? "border-primary bg-brand font-medium text-primary"
                      : "border-border text-foreground hover:bg-accent-hover"
                  )}
                >
                  {CATEGORY_LABEL[c.id]} ({counts[c.id]})
                </button>
              );
            })}
          </div>

          {/* ---------- ค้นหา — อยู่ใต้ประเภท เพราะค้นเฉพาะในประเภทที่เปิดอยู่ ---------- */}
          <div className="mt-3 flex flex-col gap-3 @3xl:flex-row @3xl:items-center">
            <InputGroup className="flex-1">
              <InputGroupAddon align="inline-start">
                <SearchIcon />
              </InputGroupAddon>
              <InputGroupInput
                placeholder={`ค้นหาใน ${CATEGORY_LABEL[cat]} — ชื่อ รหัส เลขล็อต หรือโซน`}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </InputGroup>
            <div className="flex items-center gap-2">
              <Button variant="outline-primary" size="icon" aria-label="ตัวกรอง">
                <ListFilterIcon />
              </Button>
              <Button variant="outline-primary" className="flex-1 @3xl:flex-none">
                <DownloadIcon />
                ส่งออก CSV
              </Button>
            </div>
          </div>

          {/* ---------- เรียงลำดับ + ตัวควบคุมมุมมอง ---------- */}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted-foreground">เรียงตาม</span>
              <ToggleGroup
                type="single"
                variant="outline"
                size="sm"
                value={sort}
                onValueChange={(v) => v && setSort(v)}
              >
                <ToggleGroupItem value="product">สินค้า</ToggleGroupItem>
                <ToggleGroupItem value="zone">โซน</ToggleGroupItem>
                <ToggleGroupItem value="fifo">FIFO</ToggleGroupItem>
              </ToggleGroup>

              <Label
                htmlFor="low-only"
                className="flex items-center gap-2 rounded-full border border-border px-3 py-1 text-sm font-normal"
              >
                <Checkbox
                  id="low-only"
                  checked={lowOnly}
                  onCheckedChange={(v) => setLowOnly(v === true)}
                />
                สต็อกต่ำ
              </Label>
            </div>

            {/* ซ่อนป้าย/ปุ่มเพื่อให้กวาดตาดูตัวเลขได้ง่ายขึ้น
                ติดไว้เป็น ToggleGroup ชุดเดียว จะได้ไม่มีปุ่มเรียงเต็มแถว */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted-foreground">แสดง</span>
              <ToggleGroup
                type="multiple"
                variant="outline"
                size="sm"
                value={[
                  ...(showChips ? ["chips"] : []),
                  ...(showActions ? ["actions"] : []),
                ]}
                onValueChange={(vals) => {
                  setShowChips(vals.includes("chips"));
                  setShowActions(vals.includes("actions"));
                }}
              >
                <ToggleGroupItem value="chips" aria-label="แสดงป้ายทั้งหมด">
                  <TagIcon />
                  ป้าย
                </ToggleGroupItem>
                <ToggleGroupItem value="actions" aria-label="แสดงปุ่มจัดการ">
                  <SlidersHorizontalIcon />
                  ปุ่มจัดการ
                </ToggleGroupItem>
              </ToggleGroup>

              <Button variant="ghost" size="sm" onClick={toggleExpand}>
                {expanded ? <ChevronsDownUpIcon /> : <ChevronsUpDownIcon />}
                {expanded ? "ย่อทั้งหมด" : "กางทั้งหมด"}
              </Button>
            </div>
          </div>

          {/* ---------- รายการสินค้า ---------- */}
          <div className="mt-5 space-y-4">
            {visible.map((p) => (
              // ใส่สถานะย่อ/กางไว้ใน key เพื่อรีเซ็ต Collapsible ตอนกดย่อ/กางทั้งหมด
              <ProductCard
                key={`${p.id}-${expanded}`}
                product={p}
                defaultOpen={expanded}
                showChips={showChips}
                showActions={showActions}
              />
            ))}

            {visible.length === 0 && (
              <div className="rounded-xl border border-dashed border-border px-6 py-14 text-center">
                <p className="font-medium">
                  ไม่พบใน “{CATEGORY_LABEL[cat]}”
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

          <div className="mt-8 flex items-center gap-2">
            <Badge tone="neutral" appearance="outline">
              {visible.length} สินค้า
            </Badge>
            <Badge tone="neutral" appearance="outline">
              {visible.reduce((n, p) => n + p.lots.length, 0)} ล็อต
            </Badge>
          </div>
        </div>
      </div>
    </main>
  );
}
