"use client";

import * as React from "react";
import {
  ChevronsDownUpIcon,
  ChevronsUpDownIcon,
  DownloadIcon,
  ListFilterIcon,
  MonitorIcon,
  SearchIcon,
  SmartphoneIcon,
  TabletIcon,
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
import { Tabs, TabsList, TabsTrigger } from "@peckey954/ui/components/ui/tabs";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@peckey954/ui/components/ui/toggle-group";
import { cn } from "@peckey954/ui/lib/utils";
import { CategoryHeader, ProductCard } from "@/components/stock/stock-parts";
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
  // ไม่ต้องใช้ useEffect ไป sync ทีหลัง
  const [view, setView] = React.useState<{ device: Device; expanded: boolean }>({
    device: "desktop",
    expanded: true,
  });
  const { device, expanded } = view;
  const [legacy, setLegacy] = React.useState(false);
  const [cats, setCats] = React.useState<CategoryId[]>([]);
  const [lowOnly, setLowOnly] = React.useState(false);
  const [sort, setSort] = React.useState("product");

  // จอมือถือควรเริ่มแบบยุบไว้ ไม่งั้นต้องเลื่อนยาวมากกว่าจะเจอสินค้าตัวถัดไป
  const changeDevice = (d: Device) =>
    setView({ device: d, expanded: d !== "mobile" });
  const toggleExpand = () =>
    setView((v) => ({ ...v, expanded: !v.expanded }));

  const counts = countByCategory(PRODUCTS);

  const visible = PRODUCTS.filter(
    (p) =>
      (cats.length === 0 || cats.includes(p.category)) && (!lowOnly || p.low)
  );

  const groups = CATEGORIES.map((c) => ({
    id: c.id,
    items: visible.filter((p) => p.category === c.id),
  })).filter((g) => g.items.length > 0);

  const toggleCat = (id: CategoryId) =>
    setCats((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
      {/* ---------- แถบเครื่องมือสำหรับรีวิวดีไซน์ ---------- */}
      <div className="mb-6 flex flex-wrap items-center gap-x-6 gap-y-3 rounded-xl border border-border bg-muted px-4 py-3">
        <div className="flex items-center gap-3">
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

        <Separator orientation="vertical" className="h-6!" />

        <div className="flex items-center gap-3">
          <Label className="text-sm">รูปแบบป้าย</Label>
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            value={legacy ? "legacy" : "new"}
            onValueChange={(v) => v && setLegacy(v === "legacy")}
          >
            <ToggleGroupItem value="legacy">แบบเดิม</ToggleGroupItem>
            <ToggleGroupItem value="new">แบบใหม่</ToggleGroupItem>
          </ToggleGroup>
        </div>
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
          <p className="mt-1 text-sm text-muted-foreground">
            กระสอบ สติกเกอร์ ของแจก และของใช้ในไลน์ผลิต
          </p>

          <Tabs defaultValue="stock" className="mt-5">
            <TabsList className="w-full @3xl:w-auto">
              <TabsTrigger value="stock" className="flex-1 @3xl:flex-none">
                สต็อก (7)
              </TabsTrigger>
              <TabsTrigger value="inbound" className="flex-1 @3xl:flex-none">
                รอรับเข้า (3)
              </TabsTrigger>
              <TabsTrigger value="issue" className="flex-1 @3xl:flex-none">
                รอเบิก/คืน (4)
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* ---------- ค้นหา + เครื่องมือ ---------- */}
          <div className="mt-4 flex flex-col gap-3 @3xl:flex-row @3xl:items-center">
            <InputGroup className="flex-1">
              <InputGroupAddon align="inline-start">
                <SearchIcon />
              </InputGroupAddon>
              <InputGroupInput placeholder="ค้นหาชื่อสินค้า รหัส หรือเลขล็อต" />
            </InputGroup>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" aria-label="ตัวกรอง">
                <ListFilterIcon />
              </Button>
              <Button variant="outline-primary" className="flex-1 @3xl:flex-none">
                <DownloadIcon />
                ส่งออก CSV
              </Button>
            </div>
          </div>

          {/* ---------- ชิปกรองประเภท ---------- */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {CATEGORIES.map((c) => {
              const on = cats.includes(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => toggleCat(c.id)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-sm transition-colors",
                    on
                      ? "border-primary bg-brand text-primary"
                      : "border-border text-muted-foreground hover:bg-accent-hover"
                  )}
                >
                  {CATEGORY_LABEL[c.id]} ({counts[c.id]})
                </button>
              );
            })}

            <Label
              htmlFor="low-only"
              className="ml-1 flex items-center gap-2 rounded-full border border-border px-3 py-1 text-sm font-normal"
            >
              <Checkbox
                id="low-only"
                checked={lowOnly}
                onCheckedChange={(v) => setLowOnly(v === true)}
              />
              เฉพาะสต็อกต่ำ
            </Label>
          </div>

          {/* ---------- เรียงลำดับ + ย่อ/กาง ---------- */}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
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
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={toggleExpand}
            >
              {expanded ? <ChevronsDownUpIcon /> : <ChevronsUpDownIcon />}
              {expanded ? "ย่อทั้งหมด" : "กางทั้งหมด"}
            </Button>
          </div>

          {/* ---------- รายการแบ่งตามประเภท ---------- */}
          <div className="mt-6 space-y-6">
            {groups.map((g) => (
              <section key={g.id} className="space-y-3">
                <CategoryHeader category={g.id} count={g.items.length} />
                {g.items.map((p) => (
                  // ใส่สถานะย่อ/กางไว้ใน key เพื่อรีเซ็ต Collapsible ตอนกดย่อ/กางทั้งหมด
                  <ProductCard
                    key={`${p.id}-${expanded}`}
                    product={p}
                    legacy={legacy}
                    defaultOpen={expanded}
                  />
                ))}
              </section>
            ))}

            {groups.length === 0 && (
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
