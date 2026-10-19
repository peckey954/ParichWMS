"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ListFilterIcon, SearchIcon } from "lucide-react";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@peckey954/ui/components/ui/dialog";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@peckey954/ui/components/ui/input-group";
import { Label } from "@peckey954/ui/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@peckey954/ui/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@peckey954/ui/components/ui/tabs";
import { cn } from "@peckey954/ui/lib/utils";
import { ChipGroup } from "@/components/chip-group";
import { DateSelect, formatDateSlash } from "@/components/date-select";
import { MultiSelectChips } from "@/components/multi-select-chips";
import {
  CardBox,
  CardHead,
  CardRow,
  COL_FIRST,
  EmptyDocs,
  HEAD_FIRST,
  ROW_HOVER_NAV,
  STICKY_HEAD,
  TableFrame,
  TablePager,
  paginate,
} from "@/components/stock/doc-parts";
import {
  RECEIVING_DOCS,
  SOURCE_LABEL,
  formatAmount,
  outstanding,
  receivedQty,
  type ReceivingDoc,
  type ReceivingSource,
} from "@/lib/goods-receiving";

/* ------------------------------------------------------------------
   รับเข้าสินค้า — ใบที่รอรับของเข้าคลังสินค้า

   สองแท็บ รอรับเข้า / รับสินค้าแล้ว และแยกที่มาเป็นชิป จากการผลิตกับภายนอก
   เพราะสองที่มานี้คนรับคนละกลุ่ม เปิดหน้ามาแล้วเห็นแต่ของตัวเองก่อน

   กดแถวเข้าไปที่ใบ แล้วรับของทีละสลิงในหน้านั้น
------------------------------------------------------------------ */

type Tab = "pending" | "done";
type Filter = { types: string[]; groups: string[] };
const NO_FILTER: Filter = { types: [], groups: [] };
const PAGE_SIZE = 10;
const count99 = (n: number) => (n > 99 ? "99+" : String(n));

export default function GoodsReceivingPage() {
  const router = useRouter();
  const [tab, setTab] = React.useState<Tab>("pending");
  const [source, setSource] = React.useState<ReceivingSource>("external");
  const [query, setQuery] = React.useState("");
  const [date, setDate] = React.useState<Date | undefined>();
  const [filter, setFilter] = React.useState<Filter>(NO_FILTER);
  const [page, setPage] = React.useState(1);

  const inTab = RECEIVING_DOCS.filter((d) => d.done === (tab === "done"));
  const bySource = (s: ReceivingSource) => inTab.filter((d) => d.source === s);
  const q = query.trim().toLowerCase();
  const day = date ? formatDateSlash(date) : "";
  const rows = bySource(source).filter(
    (d) =>
      (!q ||
        d.code.toLowerCase().includes(q) ||
        d.productName.toLowerCase().includes(q) ||
        d.supplier.toLowerCase().includes(q) ||
        d.truck.toLowerCase().includes(q)) &&
      (!day || d.arriveDate === day) &&
      (filter.types.length === 0 || filter.types.includes(d.productType)) &&
      (filter.groups.length === 0 || filter.groups.includes(d.group))
  );
  const { pages, safe, slice } = paginate(rows, page, PAGE_SIZE);
  const pendingCount = RECEIVING_DOCS.filter((d) => !d.done).length;
  const doneCount = RECEIVING_DOCS.length - pendingCount;
  const reset =
    <T,>(set: (v: T) => void) =>
    (v: T) => {
      set(v);
      setPage(1);
    };
  const href = (d: ReceivingDoc) => `/receiving/product/${d.id}`;
  // แท็บรอรับเข้าบอกยอดที่ยังค้าง แท็บรับแล้วบอกยอดที่รับไป
  const amountOf = (d: ReceivingDoc) => {
    const v = tab === "pending" ? outstanding(d) : receivedQty(d);
    return v > 0 ? formatAmount(d, v) : "-";
  };
  const amountHead = tab === "pending" ? "รอรับเข้า" : "รับเข้า";

  return (
    <main className="@container mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">หน้าหลัก</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="text-primary">รับเข้าสินค้า</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <h1 className="mt-4 text-2xl font-semibold tracking-tight">รับเข้าสินค้า</h1>
      <p className="mt-1 text-sm text-muted-foreground">นับจำนวนเพื่อรับเข้าสินค้า</p>

      <Tabs value={tab} onValueChange={(v) => reset(setTab)(v as Tab)} className="mt-5">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pending">รอรับเข้า ({count99(pendingCount)})</TabsTrigger>
          <TabsTrigger value="done">รับสินค้าแล้ว ({count99(doneCount)})</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="mt-4 flex flex-wrap items-center gap-2 @3xl:flex-nowrap">
        <InputGroup className="w-full min-w-0 bg-card @3xl:flex-1">
          <InputGroupAddon align="inline-start">
            <SearchIcon />
          </InputGroupAddon>
          <InputGroupInput
            placeholder="ค้นหา..."
            value={query}
            onChange={(e) => reset(setQuery)(e.target.value)}
          />
        </InputGroup>
        <div className="flex w-full items-center gap-2 @3xl:w-auto">
          <DateSelect
            className="min-w-0 flex-1 @3xl:w-64 @3xl:flex-none"
            placeholder="วันที่"
            value={date}
            onValueChange={reset(setDate)}
          />
          <FilterButton value={filter} onApply={reset(setFilter)} />
        </div>
      </div>

      <ChipGroup
        className="mt-3"
        label="ที่มาของสินค้า"
        value={source}
        onChange={reset(setSource)}
        options={(["production", "external"] as const).map((s) => ({
          id: s,
          label: `${SOURCE_LABEL[s].replace("รอรับเข้า", tab === "pending" ? "รอรับเข้า" : "รับเข้า")} (${bySource(s).length})`,
        }))}
      />

      <div className="mt-4">
        {rows.length === 0 ? (
          <EmptyDocs
            title={tab === "pending" ? "ไม่มีใบที่รอรับเข้า" : "ยังไม่มีใบที่รับสินค้าแล้ว"}
            hint={q || day ? "ลองใช้คำค้นสั้นลงหรือเลือกวันอื่น" : "ใบใหม่จะขึ้นเมื่อมีใบสั่งซื้อหรือใบสั่งผลิต"}
          />
        ) : (
          <>
            {/* จอแคบ — การ์ดทีละใบ */}
            <div className="space-y-3 @3xl:hidden">
              {slice.map((d) => (
                <div key={d.id} className="relative rounded-xl border border-border bg-card p-4">
                  <CardHead code={d.code} at={d.createdAt} href={href(d)} />
                  <CardBox className="mt-3">
                    <p className="font-medium">{d.productName}</p>
                    <p className="text-sm">{d.supplier}</p>
                  </CardBox>
                  <dl className="mt-3 space-y-1.5 text-sm">
                    <CardRow label="ประเภท">{d.productType}</CardRow>
                    <CardRow label="หมวด">{d.group}</CardRow>
                    <CardRow label="บรรจุภัณฑ์">{d.packing}</CardRow>
                    <CardRow label="วันที่รถจะเข้า">{d.arriveDate}</CardRow>
                    <CardRow label="ทะเบียนรถ">{d.truck}</CardRow>
                    <CardRow label={amountHead}>{amountOf(d)}</CardRow>
                  </dl>
                </div>
              ))}
              <TablePager page={safe} pages={pages} onChange={setPage} />
            </div>

            {/* จอกว้าง — ตาราง เลขที่ใบตรึงซ้าย */}
            <div className="hidden @3xl:block">
              <TableFrame>
                <Table>
                  <TableHeader className={STICKY_HEAD}>
                    <TableRow>
                      <TableHead className={HEAD_FIRST}>
                        {source === "external" ? "เลขที่ใบสั่งซื้อ" : "เลขที่ใบสั่งผลิต"}
                      </TableHead>
                      <TableHead>สินค้า</TableHead>
                      <TableHead>ประเภท</TableHead>
                      <TableHead>หมวด</TableHead>
                      <TableHead className="text-right">บรรจุภัณฑ์</TableHead>
                      <TableHead>{source === "external" ? "บริษัท" : "ไลน์ผลิต"}</TableHead>
                      <TableHead className="text-right">วันที่รถจะเข้า</TableHead>
                      <TableHead>ทะเบียนรถ</TableHead>
                      <TableHead className="text-right">{amountHead}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {slice.map((d) => (
                      <TableRow
                        key={d.id}
                        onClick={() => router.push(href(d))}
                        className={cn("cursor-pointer", ROW_HOVER_NAV)}
                      >
                        <TableCell className={COL_FIRST}>
                          <Link href={href(d)} className="block font-medium whitespace-nowrap hover:underline">
                            {d.code}
                          </Link>
                          <span className="block text-sm whitespace-nowrap text-muted-foreground">
                            {d.createdAt}
                          </span>
                        </TableCell>
                        <TableCell className="font-medium whitespace-nowrap">{d.productName}</TableCell>
                        <TableCell className="whitespace-nowrap">{d.productType}</TableCell>
                        <TableCell>{d.group}</TableCell>
                        <TableCell className="text-right whitespace-nowrap">{d.packing}</TableCell>
                        <TableCell className="max-w-72 truncate" title={d.supplier}>
                          {d.supplier}
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap">{d.arriveDate}</TableCell>
                        <TableCell className="whitespace-nowrap">{d.truck}</TableCell>
                        <TableCell className="text-right whitespace-nowrap tabular-nums">
                          {amountOf(d)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <TablePager page={safe} pages={pages} onChange={setPage} />
              </TableFrame>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

/* ตัวกรองกลางจอ ชุดเดียวกับหน้าอื่น — จุดบนปุ่มบอกว่ามีอะไรถูกเปลี่ยนไว้ */
function FilterButton({ value, onApply }: { value: Filter; onApply: (f: Filter) => void }) {
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState(value);
  const types = [...new Set(RECEIVING_DOCS.map((d) => d.productType))];
  const groups = [...new Set(RECEIVING_DOCS.map((d) => d.group))];
  const active = value.types.length > 0 || value.groups.length > 0;
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) setDraft(value);
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline-primary" size="icon" aria-label="ตัวกรอง" className="relative shrink-0">
          <ListFilterIcon />
          {active && <span className="absolute top-1 right-1 size-2 rounded-full bg-primary" />}
        </Button>
      </DialogTrigger>
      <DialogContent aria-describedby={undefined} className="sm:max-w-md">
        <DialogHeader className="text-left">
          <DialogTitle>ตัวกรอง</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="rcv-type">ประเภท</Label>
            <MultiSelectChips
              id="rcv-type"
              className="w-full bg-card"
              placeholder="ทุกประเภท"
              options={types.map((t) => ({ label: t, value: t }))}
              value={draft.types}
              onValueChange={(t) => setDraft((d) => ({ ...d, types: t }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="rcv-group">หมวด</Label>
            <MultiSelectChips
              id="rcv-group"
              className="w-full bg-card"
              placeholder="ทุกหมวด"
              options={groups.map((g) => ({ label: g, value: g }))}
              value={draft.groups}
              onValueChange={(g) => setDraft((d) => ({ ...d, groups: g }))}
            />
          </div>
        </div>
        <DialogFooter className="flex-row justify-between gap-2 sm:justify-between">
          <Button variant="ghost" onClick={() => setDraft(NO_FILTER)}>
            ล้างตัวกรอง
          </Button>
          <Button
            onClick={() => {
              onApply(draft);
              setOpen(false);
            }}
          >
            ตกลง
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
