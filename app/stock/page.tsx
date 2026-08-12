"use client";

import * as React from "react";
import {
  DownloadIcon,
  EyeIcon,
  EyeOffIcon,
  ListFilterIcon,
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
import { useDevicePreview } from "@/components/device-preview";
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
  matchesInbound,
  matchesIssue,
  matchesQuery,
  type CategoryId,
} from "@/lib/general-stock";

type IssueKind = "all" | "issue" | "return";

const ISSUE_KINDS: { id: IssueKind; label: string }[] = [
  { id: "all", label: "ทั้งหมด" },
  { id: "issue", label: "รอจ่ายออก" },
  { id: "return", label: "รอรับคืน" },
];

export default function GeneralStockPage() {
  // กรอบจำลองอุปกรณ์อยู่ที่ AppShell ปุ่มสลับอยู่บนหัวเรื่อง
  // หน้านี้ขอรู้แค่ว่าตอนนี้อยู่ในกรอบหรือไม่ เพื่อเลือกจุดยึดของแถบติดบน
  const { framed } = useDevicePreview();
  // ของจริงแยกประเภทกันเด็ดขาด ไม่มีมุมมอง "ทั้งหมด"
  // ชิปจึงเป็นการนำทาง (เลือกอยู่เสมอหนึ่งอัน) ไม่ใช่ตัวกรองที่ปิดได้
  const [cat, setCat] = React.useState<CategoryId>("sack");
  const [lowOnly, setLowOnly] = React.useState(false);
  const [sort, setSort] = React.useState("product");
  const [query, setQuery] = React.useState("");
  const [showChips, setShowChips] = React.useState(true);
  const [showActions, setShowActions] = React.useState(true);
  const [tab, setTab] = React.useState<"stock" | "inbound" | "issue">("stock");
  const [inboundQuery, setInboundQuery] = React.useState("");
  const [issueQuery, setIssueQuery] = React.useState("");
  const [issueKind, setIssueKind] = React.useState<IssueKind>("all");

  // ปุ่มรูปตาเป็นสวิตช์ตัวใหญ่ — เปิด/ปิดพร้อมกันทั้งป้ายและปุ่ม
  // ส่วนใน popover ยังแยกเปิดปิดทีละอย่างได้ ทั้งสองทางเขียนค่าชุดเดียวกันจึงไม่หลุดกัน
  const allShown = showChips && showActions;
  const toggleAll = () => {
    setShowChips(!allShown);
    setShowActions(!allShown);
  };

  // ค่าที่ popover เป็นเจ้าของ — ล้างได้ทีเดียวจบ
  // ไม่ล้างประเภทสินค้ากับคำค้น เพราะสองอย่างนั้นเป็นการนำทาง ไม่ใช่ตัวกรอง
  const isDefault = !lowOnly && sort === "product" && showChips && showActions;
  const resetFilters = () => {
    setLowOnly(false);
    setSort("product");
    setShowChips(true);
    setShowActions(true);
  };

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

          {/* ---------- หัวเรื่อง + ปุ่มเฉพาะแท็บ ----------
               ปุ่มพวกนี้ทำงานกับข้อมูลของแท็บสต็อกเท่านั้น พอไปแท็บอื่น
               ซึ่งเป็นเอกสารคนละชนิดจึงต้องหายไป ไม่ใช่ปุ่มประจำหน้า */}
          <div className="mt-3 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold tracking-tight">
                สต็อกทั่วไป
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                จัดการสต็อกทั่วไป
              </p>
            </div>

            {tab === "stock" && (
              <div className="flex shrink-0 items-center gap-2">
                {/* ส่งออกเป็นงานทำครั้งเดียวจบ ไม่ต้องเอื้อมถึงตอนไล่ดูรายการ
                    จึงอยู่บนหัวเรื่องพอ ส่วนปุ่มซ่อน/แสดงย้ายไปอยู่แถบติดบน */}
                <Button
                  variant="outline-primary"
                  size="icon"
                  aria-label="ส่งออก CSV"
                >
                  <DownloadIcon />
                </Button>
              </div>
            )}
          </div>

          <Tabs
            value={tab}
            onValueChange={(v) => setTab(v as typeof tab)}
            className="mt-5"
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
          {/* พื้นหลังต้องเป็นสีเดียวกับพื้นที่เนื้อหา (bg-surface) ไม่งั้นตอนติดบน
              จะเห็นเป็นแถบสีขาวโผล่ทับของข้างหลังชัดเป็นเหลี่ยม
              ในโหมดจำลอง กรอบเป็นตัวเลื่อนเอง จึงยึดที่ขอบบนกรอบ (top-0)
              โหมดเต็มจอ หน้าเว็บเป็นตัวเลื่อน ต้องเว้นให้หัวเรื่องที่ติดบนอยู่ (top-14) */}
          <div
            className={cn(
              "sticky z-30 -mx-4 mt-4 border-b border-border bg-surface px-4 pt-1 pb-3 sm:-mx-6 sm:px-6",
              framed ? "top-0" : "top-14"
            )}
          >
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
            </div>
          </div>

          {/* ---------- ค้นหา + ปุ่ม — อยู่ในแถบติดบนเดียวกับชิป ----------
               ค้นเฉพาะในประเภทที่เปิดอยู่ จึงต้องอยู่ใต้ชิป
               ปุ่มตัวกรองกับซ่อน/แสดงมาอยู่ข้างช่องค้นหา ตามแบบร่าง */}
          <div className="mt-3 flex items-center gap-2">
            <InputGroup className="min-w-0 flex-1">
              <InputGroupAddon align="inline-start">
                <SearchIcon />
              </InputGroupAddon>
              <InputGroupInput
                placeholder={`ค้นหาใน ${CATEGORY_LABEL[cat]}`}
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
                    className="flex items-center gap-3 font-normal"
                  >
                    <Checkbox
                      id="filter-low"
                      checked={lowOnly}
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

            {/* ปุ่มซ่อน/แสดงมาอยู่ข้างค้นหา อยู่ในแถบติดบนจึงเอื้อมถึงตลอดตอนเลื่อน */}
            <Button
              variant="outline-primary"
              size="icon"
              aria-label={allShown ? "ซ่อนป้ายและปุ่ม" : "แสดงป้ายและปุ่ม"}
              aria-pressed={!allShown}
              onClick={toggleAll}
              className="shrink-0"
            >
              {allShown ? <EyeIcon /> : <EyeOffIcon />}
            </Button>
          </div>
          </div>

          {/* ---------- รายการสินค้า ---------- */}
          <div className="mt-4 space-y-4">
            {visible.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                defaultOpen
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
            </>
          )}

          {/* ---------- แท็บรอรับเข้า — เอกสารสั่งซื้อ คนละชนิดกับสต็อก ----------
               ไม่มีชิปประเภท ไม่มีเรียงตาม ไม่มีปุ่มส่งออก เพราะไม่เกี่ยวกัน */}
          {tab === "inbound" && (
            <>
              <div className="mt-4 flex items-center gap-2">
                <InputGroup className="min-w-0 flex-1">
                  <InputGroupAddon align="inline-start">
                    <SearchIcon />
                  </InputGroupAddon>
                  <InputGroupInput
                    placeholder="ค้นหาเลขเอกสาร สินค้า ผู้ขาย หรือทะเบียนรถ"
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

              <div className="mt-4">
                <InboundList docs={inboundVisible} />
              </div>
            </>
          )}

          {/* ---------- แท็บรอจ่าย/คืน — ใบขอเบิกกับใบขอคืนอยู่ตารางเดียวกัน ---------- */}
          {tab === "issue" && (
            <>
              <div className="mt-4 flex items-center gap-2">
                <InputGroup className="min-w-0 flex-1">
                  <InputGroupAddon align="inline-start">
                    <SearchIcon />
                  </InputGroupAddon>
                  <InputGroupInput
                    placeholder="ค้นหาเลขที่ขอเบิก สินค้า ผู้ขอ หรือหมายเหตุ"
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

              {/* ทิศทางของเอกสาร เลือกได้ทีละอัน เลื่อนแนวนอนเอาบนจอแคบ */}
              <div
                role="tablist"
                aria-label="ประเภทเอกสาร"
                className={cn(
                  "mt-3 flex items-center gap-2 overflow-x-auto",
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

              <div className="mt-4">
                <IssueList docs={issueVisible} />
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
