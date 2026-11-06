"use client";

import * as React from "react";
import Link from "next/link";
import { CheckIcon, ChevronUpIcon, Clock8Icon, PlusIcon } from "lucide-react";
import { Button } from "@peckey954/ui/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@peckey954/ui/components/ui/collapsible";
import { WAIT_ACTION, type WaitDoc, type WaitItem } from "@/lib/goods-waiting";
import { EmptyDocs, StatusChip, TablePager, paginate } from "./doc-parts";

/* ------------------------------------------------------------------
   รายการใบรอรับเข้า/จ่าย/คืน — หนึ่งการ์ดต่อใบ (Figma: Tab รอรับเข้า/จ่าย/คืน)

   หัวการ์ด: เลขที่ใบ วันเวลา บริษัท (ภายนอก) | ชิปสถานะ  N รายการ  ⌃ หุบ/กาง
   ในการ์ด:  สินค้า | ทะเบียนรถ | วันที่รถเข้า | ยอดรอ | ปุ่ม + รับเข้า/สั่งจ่าย/รับคืน
   ภายในไม่มีสองคอลัมน์รถ

   จอแคบยังไม่มีแบบ: แถวเรียงลงมา ยอดกับปุ่มอยู่บรรทัดล่างของแต่ละแถว
------------------------------------------------------------------ */

const PAGE_SIZE = 10;

export function GoodsWaitingList({ docs }: { docs: WaitDoc[] }) {
  const [page, setPage] = React.useState(1);
  const { pages, safe, slice } = paginate(docs, page, PAGE_SIZE);

  if (docs.length === 0) {
    return <EmptyDocs title="ไม่มีรายการรอ" hint="ใบที่ทำครบแล้วย้ายไปอยู่ในประวัติของแท็บสต็อก" />;
  }

  return (
    <div className="space-y-4">
      {slice.map((d) => (
        <DocCard key={d.id} doc={d} />
      ))}
      <TablePager page={safe} pages={pages} onChange={setPage} />
    </div>
  );
}

function DocCard({ doc }: { doc: WaitDoc }) {
  return (
    <Collapsible defaultOpen className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex flex-col gap-2 px-4 py-4 @3xl:flex-row @3xl:items-center @3xl:justify-between @3xl:gap-4 @3xl:px-6">
        <div className="min-w-0">
          <p className="text-sm">
            <span className="font-medium">{doc.code}</span>{" "}
            <span className="text-muted-foreground">{doc.createdAt}</span>
          </p>
          {doc.party && <p className="mt-1 truncate text-sm font-semibold">{doc.party}</p>}
        </div>
        <div className="flex shrink-0 items-center justify-between gap-3 @3xl:justify-start">
          <StatusChip status={doc.status} label={doc.statusLabel} />
          <span className="flex items-center gap-1">
            <span className="text-sm whitespace-nowrap">{doc.items.length} รายการ</span>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="icon" className="group size-8" aria-label="แสดง/ซ่อนรายการ">
                <ChevronUpIcon className="transition-transform group-data-[state=closed]:rotate-180" />
              </Button>
            </CollapsibleTrigger>
          </span>
        </div>
      </div>

      <CollapsibleContent>
        {/* ---------- จอกว้าง: ตาราง ---------- */}
        <table className="hidden w-full text-sm @3xl:table">
          <thead>
            <tr className="border-y border-border bg-muted/60 text-left text-muted-foreground">
              <th className="px-6 py-2.5 font-normal">สินค้า</th>
              {doc.external && (
                <>
                  <th className="w-36 px-3 py-2.5 font-normal">ทะเบียนรถ</th>
                  <th className="w-36 px-3 py-2.5 font-normal">วันที่รถเข้า</th>
                </>
              )}
              <th className="w-40 px-3 py-2.5 font-normal">{doc.amountLabel}</th>
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
                {doc.external && (
                  <>
                    <td className="px-3 py-3 font-semibold whitespace-nowrap">{it.truck}</td>
                    <td className="px-3 py-3 font-semibold whitespace-nowrap">{it.arriveDate}</td>
                  </>
                )}
                <td className="px-3 py-3">
                  <Amount item={it} />
                </td>
                <td className="px-6 py-3 text-right">
                  <ActionButton doc={doc} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* ---------- จอแคบ: แถวเรียงลงมา ---------- */}
        <ul className="@3xl:hidden">
          {doc.items.map((it) => (
            <li key={it.key} className="border-t border-border px-4 py-3">
              <ProductCell item={it} />
              {doc.external && (
                <dl className="mt-2 grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <dt className="text-muted-foreground">ทะเบียนรถ</dt>
                    <dd className="font-semibold">{it.truck}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">วันที่รถเข้า</dt>
                    <dd className="font-semibold">{it.arriveDate}</dd>
                  </div>
                </dl>
              )}
              <div className="mt-3 flex items-center justify-between gap-3">
                <div className="text-sm">
                  <p className="text-muted-foreground">{doc.amountLabel}</p>
                  <Amount item={it} />
                </div>
                <ActionButton doc={doc} />
              </div>
            </li>
          ))}
        </ul>
      </CollapsibleContent>
    </Collapsible>
  );
}

/** ชื่อสินค้า | ประเภท | หมวด | บรรจุ แล้วบรรทัดล่างเป็นเลขที่ย่อยหรือไลน์ผลิต */
function ProductCell({ item }: { item: WaitItem }) {
  return (
    <div className="min-w-0">
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="font-semibold">{item.productName}</span>
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
function Amount({ item }: { item: WaitItem }) {
  return (
    <span className="inline-flex items-center gap-2 font-semibold whitespace-nowrap tabular-nums">
      {item.amount}
      {item.weighed !== undefined &&
        (item.weighed ? (
          <span
            title="ชั่งน้ำหนักแล้ว"
            className="inline-flex size-5 items-center justify-center rounded-full bg-brand text-primary"
          >
            <CheckIcon className="size-3" aria-label="ชั่งน้ำหนักแล้ว" />
          </span>
        ) : (
          <span title="รอชั่งน้ำหนัก" className="inline-flex size-5 items-center justify-center text-muted-foreground">
            <Clock8Icon className="size-4" aria-label="รอชั่งน้ำหนัก" />
          </span>
        ))}
    </span>
  );
}

function ActionButton({ doc }: { doc: WaitDoc }) {
  if (!doc.href) return null;
  return (
    <Button asChild variant="outline-primary" size="sm" className="shrink-0">
      <Link href={doc.href}>
        <PlusIcon />
        {WAIT_ACTION[doc.kind]}
      </Link>
    </Button>
  );
}
