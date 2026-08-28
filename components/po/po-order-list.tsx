"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDownIcon } from "lucide-react";
import { Badge } from "@peckey954/ui/components/ui/badge";
import { Button } from "@peckey954/ui/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@peckey954/ui/components/ui/table";
import { cn } from "@peckey954/ui/lib/utils";
import {
  formatPoQty,
  lineItemPendingQty,
  lineItemReceivedQty,
  PO_PROGRESS_LABEL,
  poProgress,
  type PoDoc,
  type PoLineItem,
} from "@/lib/po";
import { EmptyDocs, TablePager, paginate } from "@/components/stock/doc-parts";

/* ------------------------------------------------------------------
   รายการใบสั่งซื้อ — แต่ละใบเป็นการ์ด/แผงของตัวเอง (ไม่ใช่แถวร่วมตารางเดียวกัน
   ทั้งหมด) กดที่แผงเพื่อกาง แล้วเห็นรายการสินค้าข้างในเป็นตารางย่อยของตัวเอง
   พร้อมปุ่ม "เพิ่มรอบ" ต่อรายการตรงนั้นเลย ไม่ต้องกดเข้าไปหน้าใบสั่งซื้อก่อน

   ใช้แผงเดียวกันทั้งจอกว้าง/จอแคบ ไม่ต้องแยกเลย์เอาต์การ์ด/ตารางแบบหน้าอื่น —
   หัวแผงเป็นแถว flex-wrap เดียว ยุบ/ขยายเองตามความกว้างจอ

   กดตรงไหนของทั้งใบก็ตาม (หัวแผง หรือแถวสินค้าข้างในที่กางอยู่) พาไปหน้า
   ใบสั่งซื้อเสมอ เพราะจากตรงนี้ไปได้แค่ที่เดียวคือหน้านั้น — ไม่ต้องแยกว่า
   ตรงไหนกดได้ตรงไหนกดไม่ได้ ยกเว้นสองจุดที่ตั้งใจให้ทำอย่างอื่น: ลูกศร
   กาง/ยุบ (แค่สลับมุมมอง ไม่นำทางไปไหน) กับปุ่ม "เพิ่มรอบ" (ไปหน้าฟอร์ม
   เพิ่มรอบของสินค้านั้น คนละหน้ากับหน้าใบสั่งซื้อ) สองจุดนี้กันคลิกลอยไม่ให้
   ทะลุไปเป็นการนำทางของทั้งใบ
------------------------------------------------------------------ */
const PAGE_SIZE = 15;

// เขียนคลาสเต็มทุกตัว ห้ามประกอบชื่อด้วย template string
const PROGRESS_CHIP: Record<ReturnType<typeof poProgress>, string> = {
  notStarted:
    "[--bdg-surface:var(--chip-yellow)] [--bdg-text:var(--chip-yellow-foreground)]",
  partial: "[--bdg-surface:var(--chip-lime)] [--bdg-text:var(--chip-lime-foreground)]",
  complete: "[--bdg-surface:var(--chip-green)] [--bdg-text:var(--chip-green-foreground)]",
};
const CANCELLED_CHIP =
  "[--bdg-surface:var(--chip-red)] [--bdg-text:var(--chip-red-foreground)]";
const URGENT_CHIP =
  "[--bdg-surface:var(--chip-orange)] [--bdg-text:var(--chip-orange-foreground)]";

function UrgentChip() {
  return (
    <Badge appearance="soft" className={cn("[--bdg-border:transparent] ml-2 font-semibold", URGENT_CHIP)}>
      เร่งด่วน
    </Badge>
  );
}

function StatusChip({ doc }: { doc: PoDoc }) {
  if (doc.status === "cancelled") {
    return (
      <Badge appearance="soft" className={cn("[--bdg-border:transparent] font-semibold", CANCELLED_CHIP)}>
        ยกเลิก
      </Badge>
    );
  }
  const p = poProgress(doc);
  return (
    <Badge appearance="soft" className={cn("[--bdg-border:transparent] font-semibold", PROGRESS_CHIP[p])}>
      {PO_PROGRESS_LABEL[p]}
    </Badge>
  );
}

export function PoOrderList({ docs }: { docs: PoDoc[] }) {
  const [page, setPage] = React.useState(1);
  const { pages, safe, slice } = paginate(docs, page, PAGE_SIZE);

  // เปิดไว้ทุกแผงเป็นค่าเริ่มต้น — เก็บเฉพาะ id ที่ถูก "ปิด" เอง (ไม่ใช่เก็บ id
  // ที่เปิด) ใบใหม่ที่โผล่มาจากการค้นหา/เปลี่ยนหน้าจะเปิดอยู่เองโดยไม่ต้อง
  // ซิงก์สถานะเพิ่ม เพราะค่าเริ่มต้นของทุกใบคือ "เปิด" อยู่แล้ว
  const [collapsed, setCollapsed] = React.useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (docs.length === 0) {
    return <EmptyDocs title="ไม่พบใบสั่งซื้อ" hint="ลองใช้คำค้นสั้นลง" />;
  }

  return (
    <>
      <div className="space-y-3">
        {slice.map((d) => (
          <PoOrderPanel key={d.id} doc={d} open={!collapsed.has(d.id)} onToggle={() => toggle(d.id)} />
        ))}
      </div>
      <TablePager page={safe} pages={pages} onChange={setPage} />
    </>
  );
}

function PoOrderPanel({
  doc: d,
  open,
  onToggle,
}: {
  doc: PoDoc;
  open: boolean;
  onToggle: () => void;
}) {
  const router = useRouter();
  const goToDoc = () => router.push(`/po/${d.id}`);

  return (
    <div
      onClick={goToDoc}
      className={cn(
        "cursor-pointer overflow-hidden rounded-xl border border-border bg-card",
        // ทั้งการ์ดไปหน้าเดียวกันหมดทั้งแท่ง (รวมแถวสินค้าข้างในตอนกางอยู่)
        // ฟีดแบ็กตอนชี้จึงเป็นการยกทั้งการ์ดขึ้นนิดหนึ่งเหมือนการ์ดเมนูหลัก
        // ไม่ใช่ไฮไลต์สีพื้นหลังทีละแถว ซึ่งจะดูเหมือนแต่ละแถวกดแล้วไปคนละที่
        "transition-[transform,box-shadow] duration-150",
        "hover:shadow-md motion-safe:hover:-translate-y-0.5",
        "motion-safe:active:translate-y-0 active:shadow-sm"
      )}
    >
      <div className="flex items-start justify-between gap-3 px-4 py-3.5">
        {/* วันที่แยกบรรทัดของตัวเองบนจอแคบ (ไม่พอที่จะอยู่แถวเดียวกับเลขที่ใบ)
            แต่จอกว้างยังอยู่แถวเดียวกันได้สบายๆ — บริษัทเป็นตัวหนา (semibold)
            ทั้งสองขนาดจอ แยกบรรทัดของตัวเองอยู่แล้วเหมือนเดิม */}
        <div className="min-w-0 flex-1">
          <span className="block">
            <span className="font-semibold hover:underline">{d.code}</span>
            <span className="ml-2 hidden text-sm text-muted-foreground @3xl:inline">
              {d.createdAt}
            </span>
          </span>
          <span className="block text-sm text-muted-foreground @3xl:hidden">{d.createdAt}</span>
          <span className="mt-0.5 block truncate text-sm font-semibold text-foreground">
            {d.company}
          </span>
        </div>

        {/* กันคลิกลอยไม่ให้ทะลุไปนำทางทั้งใบ — โซนนี้แค่ดูสถานะ/สลับมุมมอง */}
        <div className="flex shrink-0 items-center gap-3" onClick={(e) => e.stopPropagation()}>
          <StatusChip doc={d} />
          <button
            type="button"
            onClick={onToggle}
            aria-label={open ? "ซ่อนรายการสินค้า" : "ดูรายการสินค้า"}
            className="shrink-0 text-muted-foreground"
          >
            <ChevronDownIcon
              className={cn("size-4 transition-transform", open && "rotate-180")}
            />
          </button>
        </div>
      </div>

      {/* เส้นคั่นบางๆ พอ ไม่ใช่กล่องซ้อนกล่อง — พื้นหลัง/ระยะขอบเดียวกับแผงนอก
          ทั้งหมด ตารางย่อยข้างในจึงต้องเผื่อ padding แนวนอนเท่าหัวแผง (px-4)
          เองผ่าน className ของ Table แทนที่จะครอบด้วย div กล่องอีกชั้น

          จอแคบ vs จอกว้างเป็นคนละแบบตรงนี้ตั้งใจ — จอกว้างมีที่พอโชว์ตัวเลข
          สั่งซื้อ/รับเข้า/ค้างรับ จอแคบเอาแค่ชื่อสินค้า+ปุ่มพอ ไม่ใส่ตัวเลข
          เพราะพื้นที่แคบ ใส่ตัวเลขแล้วอ่านยากกว่าเดิม ตัวเลขเต็มไปดูที่หน้า
          ใบสั่งซื้อได้อยู่แล้ว (กดที่แผงนี้เองก็ไปถึงได้) */}
      {open && (
        <div className="border-t border-border">
          <div className="hidden @3xl:block">
            <ProductTable po={d} onNavigate={goToDoc} />
          </div>
          <div className="@3xl:hidden">
            <ProductListSimple po={d} onNavigate={goToDoc} />
          </div>
        </div>
      )}
    </div>
  );
}

/** ความกว้างคอลัมน์ตายตัว (table-fixed) ไม่ให้แต่ละแผงกว้างไม่เท่ากันเองตาม
    ความยาวข้อความในแผงนั้น — "สินค้า" อย่างเดียวที่ยืด/หดตามที่เหลือ
    คอลัมน์ปุ่มเผื่อระยะขวาสุด 24px (pr-6) ไม่ให้ปุ่มชิดขอบเกินไป */
const COL_HEAD =
  "[&_th]:h-9 [&_th]:bg-surface [&_th]:px-4 [&_th]:text-xs [&_th]:font-medium [&_th]:text-muted-foreground [&_th]:whitespace-nowrap";
const COL_BODY = "[&_td]:px-4 [&_td]:py-3";
const COL_LAST_PAD = "[&_th:last-child]:pr-6 [&_td:last-child]:pr-6";

/** ป้ายกำกับสินค้า — ชื่อ + หมวด (เช่น Bulk/PNR) + บรรจุภัณฑ์ ไม่ใส่ประเภท
    สินค้าเต็ม (เช่น "วัตถุดิบปุ๋ยกระสอบ") อีกต่อไป ยาวเกินไม่จำเป็น หมวดสั้นกว่า
    บอกพอแล้วว่าเป็นสินค้ากลุ่มไหน — จอแคบ (stacked) แยกชื่อกับหมวด/บรรจุภัณฑ์
    เป็นคนละบรรทัด เพราะพื้นที่แคบใส่รวมบรรทัดเดียวจะยาวจนตัดคำ */
function ProductLabel({ item, stacked }: { item: PoLineItem; stacked?: boolean }) {
  const meta = (
    <>
      {item.group}
      {item.packing && ` · ${item.packing}`}
    </>
  );

  if (stacked) {
    return (
      <>
        <span className="block truncate font-medium">
          {item.productName}
          {item.productSub && ` ${item.productSub}`}
        </span>
        <span className="block truncate text-sm text-muted-foreground">
          {meta}
          {item.urgent && <UrgentChip />}
        </span>
      </>
    );
  }

  return (
    <>
      <span className="font-medium">{item.productName}</span>
      {item.productSub && <span className="text-muted-foreground"> {item.productSub}</span>}
      <span className="text-muted-foreground"> · {meta}</span>
      {item.urgent && <UrgentChip />}
    </>
  );
}

/** จอกว้าง — ตารางย่อยมีหัวคอลัมน์ของตัวเอง เบากว่าหัวข้อของแผงด้านนอก
    คั่นด้วยเส้นบางๆ ของแถวเอง ไม่ใช้กล่อง/พื้นหลังแยกซ้อนอีกชั้น แถวกดได้
    เหมือนแผงข้างนอก พาไปหน้าใบสั่งซื้อเดียวกัน ยกเว้นปุ่มเพิ่มรอบที่กันคลิกลอยไว้ */
function ProductTable({ po, onNavigate }: { po: PoDoc; onNavigate: () => void }) {
  const cancelled = po.status === "cancelled";
  return (
    <Table className={cn("table-fixed", COL_HEAD, COL_BODY, COL_LAST_PAD)}>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead>สินค้า</TableHead>
          <TableHead className="w-32 text-right">สั่งซื้อ</TableHead>
          <TableHead className="w-32 text-right">รับเข้า</TableHead>
          <TableHead className="w-32 text-right">ค้างรับ</TableHead>
          <TableHead className="w-36" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {po.lineItems.map((item) => {
          const received = lineItemReceivedQty(item);
          const pending = lineItemPendingQty(item);
          return (
            <TableRow key={item.id} onClick={onNavigate} className="cursor-pointer hover:bg-transparent">
              <TableCell className="truncate">
                <ProductLabel item={item} />
              </TableCell>
              <TableCell className="text-right whitespace-nowrap tabular-nums">
                {formatPoQty(item.orderedQty)} {item.unit}
              </TableCell>
              <TableCell className="text-right whitespace-nowrap tabular-nums">
                {formatPoQty(received)} {item.unit}
              </TableCell>
              <TableCell className="text-right whitespace-nowrap tabular-nums">
                {!cancelled && pending > 0 ? (
                  <span className="font-medium text-danger-strong">
                    {formatPoQty(pending)} {item.unit}
                  </span>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell className="whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                {!cancelled && (
                  <Button asChild variant="outline-primary" size="sm">
                    <Link href={`/po/${po.id}/receive/${item.id}/add`}>
                      เพิ่มรอบ
                    </Link>
                  </Button>
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

/** จอแคบ — แค่รายชื่อสินค้า (สองบรรทัด) + ปุ่มเพิ่มรอบ ไม่มีตัวเลข ที่แคบไม่พอ
    ให้ตัวเลขสามคอลัมน์อ่านง่าย ตัวเลขเต็มดูได้จากหน้าใบสั่งซื้อ (กดที่แถวก็ไป
    ถึงได้เหมือนกัน) */
function ProductListSimple({ po, onNavigate }: { po: PoDoc; onNavigate: () => void }) {
  const cancelled = po.status === "cancelled";
  return (
    <div className="divide-y divide-border">
      {po.lineItems.map((item) => (
        <div
          key={item.id}
          onClick={onNavigate}
          className="flex cursor-pointer items-center justify-between gap-3 px-4 py-3"
        >
          <div className="min-w-0 flex-1 text-sm">
            <ProductLabel item={item} stacked />
          </div>
          {!cancelled && (
            <div onClick={(e) => e.stopPropagation()} className="shrink-0">
              <Button asChild variant="outline-primary" size="sm">
                <Link href={`/po/${po.id}/receive/${item.id}/add`}>
                  เพิ่มรอบ
                </Link>
              </Button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
