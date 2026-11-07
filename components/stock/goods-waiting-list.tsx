"use client";

import * as React from "react";
import Link from "next/link";
import {
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  Clock8Icon,
  ListFilterIcon,
  PlusIcon,
  SearchIcon,
} from "lucide-react";
import { Button } from "@peckey954/ui/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@peckey954/ui/components/ui/collapsible";
import { Input } from "@peckey954/ui/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@peckey954/ui/components/ui/input-group";
import { Label } from "@peckey954/ui/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@peckey954/ui/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@peckey954/ui/components/ui/select";
import { cn } from "@peckey954/ui/lib/utils";
import { DateRangeSelect, type DateRange } from "@/components/date-select";
import { WAIT_ACTION, type WaitDoc, type WaitItem } from "@/lib/goods-waiting";
import { EmptyDocs, StatusChip } from "./doc-parts";

/* ------------------------------------------------------------------
   รายการใบรอรับเข้า/จ่าย/คืน — หนึ่งการ์ดต่อใบ (Figma: Tab รอรับเข้า/จ่าย/คืน)
   ใช้ทั้งสต็อกสินค้าและสต็อกทั่วไป

   จอกว้าง
     หัวการ์ด: เลขที่ใบ วันเวลา / บริษัท        | ชิปสถานะ  N รายการ  ⌃
     ตาราง:    สินค้า | ทะเบียนรถ | วันที่รถเข้า | ยอดรอ | + รับเข้า
               (ใบผลิตเป็น สั่งผลิต | ปริมาณผลิต แทนสองคอลัมน์รถ)
   จอแคบ (แบบมือถือ)
     หัวการ์ด: เลขที่ใบ ·········· วันเวลา  ⌃ / บริษัท
     แถว:      ชื่อสินค้า / แท็ก ········ [รับเข้า]
               เลขที่ย่อย แล้ว "หัวข้อ: ค่า" ชิดขวา ยอดรอมีหน่วยในหัวข้อ
     ท้ายการ์ด: N รายการ ··········· ชิปสถานะ
------------------------------------------------------------------ */

export const PAGE_SIZES = [10, 20, 50];

export function GoodsWaitingList({
  docs,
  empty = { title: "ไม่มีรายการรอ", hint: "ใบที่ทำครบแล้วย้ายไปอยู่ในประวัติของแท็บสต็อก" },
}: {
  docs: WaitDoc[];
  empty?: { title: string; hint: string };
}) {
  const [page, setPage] = React.useState(1);
  const [size, setSize] = React.useState(PAGE_SIZES[0]);
  const pages = Math.max(1, Math.ceil(docs.length / size));
  const safe = Math.min(page, pages);
  const slice = docs.slice((safe - 1) * size, safe * size);

  if (docs.length === 0) {
    return <EmptyDocs title={empty.title} hint={empty.hint} />;
  }

  return (
    <div className="space-y-4">
      {slice.map((d) => (
        <DocCard key={d.id} doc={d} />
      ))}
      <Pager
        page={safe}
        pages={pages}
        size={size}
        onPage={setPage}
        onSize={(n) => {
          setSize(n);
          setPage(1);
        }}
      />
    </div>
  );
}

/** คอลัมน์/บรรทัดเสริมของใบ — ภายนอกเป็นข้อมูลรถ ใบผลิตเป็นยอดสั่งกับยอดผลิต */
function extraFields(
  doc: WaitDoc,
  it: WaitItem
): { label: string; value?: string; tone?: "pos" | "neg"; unit?: boolean }[] {
  if (doc.extra)
    return doc.extra.map((label, i) => ({
      label: `${label} (${it.unit})`,
      value: it.extra?.[i]?.value,
      tone: it.extra?.[i]?.tone,
      unit: true,
    }));
  if (doc.external)
    return [
      { label: "ทะเบียนรถ", value: it.truck },
      { label: "วันที่รถเข้า", value: it.arriveDate },
    ];
  if (doc.kind === "production")
    return [
      { label: `สั่งผลิต (${it.unit})`, value: it.ordered, unit: true },
      { label: `ปริมาณผลิต (${it.unit})`, value: it.produced, unit: true },
    ];
  return [];
}

function DocCard({ doc }: { doc: WaitDoc }) {
  const unit = doc.items[0]?.unit ?? "";
  const heads = extraFields(doc, doc.items[0]).map((f) =>
    // หัวคอลัมน์บนจอกว้างไม่มีหน่วย หน่วยอยู่ติดตัวเลขในช่องอยู่แล้ว
    f.unit ? f.label.replace(/ \(.*\)$/, "") : f.label
  );
  const tone = (t?: "pos" | "neg") => cn(t === "pos" && "text-success-strong", t === "neg" && "text-danger-strong");
  return (
    <Collapsible defaultOpen className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
      <div className="flex items-start gap-3 px-4 py-4 @3xl:items-center @3xl:px-6">
        <div className="min-w-0 flex-1">
          <p className="flex items-baseline justify-between gap-3 text-sm @3xl:justify-start @3xl:gap-1.5">
            {doc.detailHref ? (
              <Link href={doc.detailHref} className="font-semibold hover:underline @3xl:font-medium">
                {doc.code}
              </Link>
            ) : (
              <span className="font-semibold @3xl:font-medium">{doc.code}</span>
            )}
            <span className="text-muted-foreground">{doc.createdAt}</span>
          </p>
          {doc.party && <p className="mt-2 truncate text-sm font-semibold @3xl:mt-1">{doc.party}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className="hidden items-center gap-3 @3xl:flex">
            <StatusChip status={doc.status} label={doc.statusLabel} />
            <span className="text-sm whitespace-nowrap">{doc.items.length} รายการ</span>
          </span>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="icon" className="group -my-1 size-8" aria-label="แสดง/ซ่อนรายการ">
              <ChevronUpIcon className="transition-transform group-data-[state=closed]:rotate-180" />
            </Button>
          </CollapsibleTrigger>
        </div>
      </div>

      <CollapsibleContent>
        {/* ---------- จอกว้าง: ตาราง ---------- */}
        <table className="hidden w-full text-sm @3xl:table">
          <thead>
            <tr className="border-y border-border bg-muted/60 text-muted-foreground">
              <th className="px-6 py-2.5 text-left font-normal">สินค้า</th>
              {heads.map((h) => (
                <th key={h} className="w-36 px-3 py-2.5 text-right font-normal">
                  {h}
                </th>
              ))}
              <th className="w-40 px-3 py-2.5 text-right font-normal">{doc.amountLabel}</th>
              <th className="w-32 px-6 py-2.5">
                <span className="sr-only">ทำรายการ</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {doc.items.map((it) => (
              <tr key={it.key} className="border-b border-border last:border-0">
                <td className="px-6 py-3">
                  <ProductCell item={it} />
                </td>
                {extraFields(doc, it).map((f) => (
                  <td
                    key={f.label}
                    className={cn("px-3 py-3 text-right font-semibold whitespace-nowrap tabular-nums", tone(f.tone))}
                  >
                    {f.value ?? "-"}
                    {f.unit && f.value && <span className="font-normal text-foreground"> {unit}</span>}
                  </td>
                ))}
                <td className="px-3 py-3 text-right">
                  <Amount item={it} withUnit />
                </td>
                <td className="px-6 py-3 text-right">
                  <ActionButton doc={doc} withIcon />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* ---------- จอแคบ: แถวเรียงลงมา ---------- */}
        <ul className="@3xl:hidden">
          {doc.items.map((it) => (
            <li key={it.key} className="border-t border-border px-4 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <ItemName item={it} />
                  <Tags tags={it.tags} className="mt-1" />
                </div>
                <ActionButton doc={doc} />
              </div>
              {it.sub && <p className="mt-2 text-sm font-medium">{it.sub}</p>}
              <dl className="mt-3 space-y-1.5 text-sm">
                {extraFields(doc, it).map((f) => (
                  <div key={f.label} className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">{f.label}:</dt>
                    <dd className={cn("font-semibold tabular-nums", tone(f.tone))}>{f.value ?? "-"}</dd>
                  </div>
                ))}
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">
                    {doc.amountLabel} ({it.unit}):
                  </dt>
                  <dd>
                    <Amount item={it} />
                  </dd>
                </div>
              </dl>
            </li>
          ))}
        </ul>
      </CollapsibleContent>

      {/* ท้ายการ์ดจอแคบ — จอกว้างย้ายสองอย่างนี้ขึ้นไปอยู่บนหัวการ์ด */}
      <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3 text-sm @3xl:hidden">
        <span>{doc.items.length} รายการ</span>
        <StatusChip status={doc.status} label={doc.statusLabel} />
      </div>
    </Collapsible>
  );
}

/** ชื่อสินค้า — แถวที่มีหน้ารายละเอียดกดเข้าไปดูได้ */
function ItemName({ item }: { item: WaitItem }) {
  if (!item.detailHref) return <span className="block font-semibold @3xl:inline">{item.productName}</span>;
  return (
    <Link href={item.detailHref} className="block font-semibold hover:underline @3xl:inline">
      {item.productName}
    </Link>
  );
}

function Tags({ tags, className }: { tags: string[]; className?: string }) {
  if (tags.length === 0) return null;
  return (
    <p className={cn("flex flex-wrap items-center gap-x-2 gap-y-1 text-sm", className)}>
      {tags.map((t, i) => (
        <React.Fragment key={t}>
          {i > 0 && <span className="h-3.5 w-px bg-border" aria-hidden />}
          <span>{t}</span>
        </React.Fragment>
      ))}
    </p>
  );
}

/** จอกว้าง: ชื่อสินค้า | แท็กต่อท้ายบรรทัดเดียว แล้วบรรทัดล่างเป็นเลขที่ย่อย */
function ProductCell({ item }: { item: WaitItem }) {
  return (
    <div className="min-w-0">
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <ItemName item={item} />
        {item.tags.map((t) => (
          <React.Fragment key={t}>
            <span className="h-3.5 w-px bg-border" aria-hidden />
            <span className="text-sm">{t}</span>
          </React.Fragment>
        ))}
      </p>
      {item.sub && <p className="mt-1.5 text-sm font-medium">{item.sub}</p>}
    </div>
  );
}

/**
 * ยอดรอ — ภายนอกมีเครื่องหมายต่อท้าย บอกว่ารถคันนี้ชั่งเสร็จแล้วหรือยัง
 * ติ๊กส้ม = ชั่งแล้ว นาฬิกาเทา = รอชั่ง
 */
function Amount({ item, withUnit }: { item: WaitItem; withUnit?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2 font-semibold whitespace-nowrap tabular-nums">
      <span>
        {item.qty}
        {withUnit && item.qty !== "-" && <span className="font-normal"> {item.unit}</span>}
      </span>
      {item.weighed !== undefined &&
        (item.weighed ? (
          <span
            title="ชั่งน้ำหนักแล้ว"
            className="inline-flex size-4 items-center justify-center rounded-full bg-brand text-primary"
          >
            <CheckIcon className="size-3" aria-label="ชั่งน้ำหนักแล้ว" />
          </span>
        ) : (
          <span title="รอชั่งน้ำหนัก" className="inline-flex size-4 items-center justify-center text-muted-foreground">
            <Clock8Icon className="size-3.5" aria-label="รอชั่งน้ำหนัก" />
          </span>
        ))}
    </span>
  );
}

function ActionButton({ doc, withIcon }: { doc: WaitDoc; withIcon?: boolean }) {
  if (!doc.href) return null;
  return (
    <Button asChild variant="outline-primary" size="sm" className="shrink-0">
      <Link href={doc.href}>
        {withIcon && <PlusIcon />}
        {WAIT_ACTION[doc.kind]}
      </Link>
    </Button>
  );
}

/**
 * แบ่งหน้าตามแบบ — แถวต่อหน้า | ก่อนหน้า 1 2 … ถัดไป | ไปที่หน้า
 * จอแคบเหลือแค่ปุ่มเลขหน้า แถวต่อหน้ากับไปที่หน้าซ่อนไว้ เพราะกว้างไม่พอ
 */
export function Pager({
  page,
  pages,
  size,
  onPage,
  onSize,
}: {
  page: number;
  pages: number;
  size: number;
  onPage: (p: number) => void;
  onSize: (n: number) => void;
}) {
  const [jump, setJump] = React.useState("");
  const nums: (number | "gap")[] = [];
  for (let i = 1; i <= pages; i++) {
    if (i === 1 || i === pages || Math.abs(i - page) <= 1) nums.push(i);
    else if (nums.at(-1) !== "gap") nums.push("gap");
  }
  const go = () => {
    const n = Number(jump);
    if (Number.isInteger(n) && n >= 1 && n <= pages) onPage(n);
    setJump("");
  };

  return (
    <nav aria-label="แบ่งหน้า" className="flex flex-wrap items-center justify-center gap-3 pt-2 @3xl:justify-between">
      <div className="hidden items-center gap-2 text-sm text-muted-foreground @3xl:flex">
        <Label htmlFor="wait-page-size" className="font-normal">
          แถวต่อหน้า
        </Label>
        <Select value={String(size)} onValueChange={(v) => onSize(Number(v))}>
          <SelectTrigger id="wait-page-size" size="sm" className="w-20 bg-card text-foreground">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PAGE_SIZES.map((n) => (
              <SelectItem key={n} value={String(n)}>
                {n}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="text-primary"
            disabled={page === 1}
            onClick={() => onPage(page - 1)}
          >
            <ChevronLeftIcon />
            <span className="max-sm:sr-only">ก่อนหน้า</span>
          </Button>
          {nums.map((n, i) =>
            n === "gap" ? (
              <span key={`gap-${i}`} className="px-1 text-muted-foreground">
                …
              </span>
            ) : (
              <Button
                key={n}
                variant={n === page ? "outline-primary" : "ghost"}
                size="sm"
                className={cn("min-w-8 px-2", n === page && "bg-card")}
                aria-current={n === page ? "page" : undefined}
                onClick={() => onPage(n)}
              >
                {n}
              </Button>
            )
          )}
          <Button
            variant="ghost"
            size="sm"
            className="text-primary"
            disabled={page === pages}
            onClick={() => onPage(page + 1)}
          >
            <span className="max-sm:sr-only">ถัดไป</span>
            <ChevronRightIcon />
          </Button>
        </div>

        <div className="hidden items-center gap-2 text-sm text-muted-foreground @3xl:flex">
          <Label htmlFor="wait-page-jump" className="font-normal">
            ไปที่หน้า
          </Label>
          <Input
            id="wait-page-jump"
            inputMode="numeric"
            placeholder={String(page)}
            value={jump}
            onChange={(e) => setJump(e.target.value.replace(/\D/g, ""))}
            onKeyDown={(e) => e.key === "Enter" && go()}
            onBlur={go}
            className="h-8 w-16 bg-card"
          />
        </div>
      </div>
    </nav>
  );
}

/**
 * แถวค้นหาของแท็บรอ — ค้นหา | วันที่ (จอกว้าง) | ปุ่มตัวกรอง
 * จอแคบตามแบบมีแค่ค้นหากับปุ่มตัวกรอง ช่องวันที่ย้ายเข้าไปอยู่ในปุ่มตัวกรอง
 * จุดบนปุ่มบอกว่ากรองวันที่อยู่
 */
export function WaitSearchRow({
  query,
  onQuery,
  range,
  onRange,
}: {
  query: string;
  onQuery: (q: string) => void;
  range?: DateRange;
  onRange: (r: DateRange | undefined) => void;
}) {
  return (
    <div className="flex items-center gap-2 pt-2">
      <InputGroup className="min-w-0 flex-1 bg-card">
        <InputGroupAddon align="inline-start">
          <SearchIcon />
        </InputGroupAddon>
        <InputGroupInput placeholder="ค้นหา..." value={query} onChange={(e) => onQuery(e.target.value)} />
      </InputGroup>
      <DateRangeSelect
        value={range}
        onValueChange={onRange}
        placeholder="วันที่"
        className="hidden w-64 shrink-0 @3xl:flex"
      />
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline-primary" size="icon" aria-label="ตัวกรอง" className="relative shrink-0">
            <ListFilterIcon />
            {range?.from && <span className="absolute top-1 right-1 size-2 rounded-full bg-primary" />}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-72 space-y-2">
          <Label htmlFor="wait-filter-date">วันที่สร้างใบ</Label>
          <DateRangeSelect id="wait-filter-date" value={range} onValueChange={onRange} placeholder="วันที่" />
          {range?.from && (
            <Button variant="ghost" size="sm" className="px-0 text-primary" onClick={() => onRange(undefined)}>
              ล้างค่า
            </Button>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}
