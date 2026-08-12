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
  // เลือกประเภทได้ทีละอย่างเดียว — null = ทั้งหมด
  const [cat, setCat] = React.useState<CategoryId | null>(null);
  const [lowOnly, setLowOnly] = React.useState(false);
  const [sort, setSort] = React.useState("product");
  const [showChips, setShowChips] = React.useState(true);
  const [showActions, setShowActions] = React.useState(true);

  const changeDevice = (d: Device) => setView({ device: d, expanded: true });
  const toggleExpand = () => setView((v) => ({ ...v, expanded: !v.expanded }));

  const counts = countByCategory(PRODUCTS);

  const visible = PRODUCTS.filter(
    (p) => (cat === null || p.category === cat) && (!lowOnly || p.low)
  );

  // กดซ้ำที่อันเดิม = กลับไปดูทั้งหมด จะได้ไม่ต้องเลื่อนไปหาปุ่ม "ทั้งหมด"
  const pickCat = (id: CategoryId) => setCat((c) => (c === id ? null : id));

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

          {/* ---------- ค้นหา + เครื่องมือ ---------- */}
          <div className="mt-4 flex flex-col gap-3 @3xl:flex-row @3xl:items-center">
            <InputGroup className="flex-1">
              <InputGroupAddon align="inline-start">
                <SearchIcon />
              </InputGroupAddon>
              <InputGroupInput placeholder="ค้นหา..." />
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

          {/* ---------- ชิปกรองประเภท — บรรทัดเดียว ปัดเลื่อน เลือกได้ทีละอัน ---------- */}
          <div
            className={cn(
              "mt-4 flex items-center gap-2 overflow-x-auto",
              "flex-nowrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            )}
            role="group"
            aria-label="กรองตามประเภทสินค้า"
          >
            <button
              type="button"
              onClick={() => setCat(null)}
              aria-pressed={cat === null}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1 text-sm transition-colors",
                cat === null
                  ? "border-primary bg-brand text-primary"
                  : "border-border text-foreground hover:bg-accent-hover"
              )}
            >
              ทั้งหมด ({PRODUCTS.length})
            </button>

            {CATEGORIES.map((c) => {
              const on = cat === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => pickCat(c.id)}
                  aria-pressed={on}
                  className={cn(
                    "shrink-0 rounded-full border px-3 py-1 text-sm whitespace-nowrap transition-colors",
                    on
                      ? "border-primary bg-brand text-primary"
                      : "border-border text-foreground hover:bg-accent-hover"
                  )}
                >
                  {CATEGORY_LABEL[c.id]} ({counts[c.id]})
                </button>
              );
            })}
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
              <div className="rounded-xl border border-dashed border-border py-16 text-center">
                <p className="font-medium">ไม่พบสินค้าตามตัวกรอง</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  ลองเอาตัวกรองบางอันออก
                </p>
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
