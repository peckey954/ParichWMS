"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ChevronDownIcon } from "lucide-react";
import { Badge } from "@peckey954/ui/components/ui/badge";
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
  formatPoBaht,
  formatPoQty,
  lineItemUnitPrice,
  lineItemTotalPrice,
  poTotalPrice,
  type PoDoc,
  type PoLineItem,
} from "@/lib/po";
import { EmptyDocs, TablePager, paginate } from "@/components/stock/doc-parts";

/* ------------------------------------------------------------------
   รายการใบสั่งซื้อรออนุมัติ — หนึ่งแผงต่อหนึ่งใบ เหมือนแท็บ "สั่งซื้อ" ของหน้า
   /po (po-order-list.tsx) แต่หัวแผงโชว์ "ราคารวมทั้งหมด" แทนชิปสถานะ เพราะจุด
   ที่ผู้อนุมัติต้องตัดสินใจคือราคา ไม่ใช่ความคืบหน้าการรับเข้า (ใบพวกนี้ยังไม่
   เริ่มรับเข้าเลยสักใบ) — ตัวเลขนี้จึงต้องเด่นที่สุดในแถว ทั้งจอกว้าง/จอแคบ

   กดทั้งแผง/แถวสินค้าพาไปหน้าใบสั่งซื้อเดิม (/po/[id]) เพราะการอนุมัติจริง
   (ยังไม่มีปุ่มในไฟล์ออกแบบ) น่าจะเกิดที่หน้านั้นต่อไป — คนละหน้าที่กับที่นี่
   ที่นี่เน้นไล่ดูราคารวมแต่ละใบเปรียบเทียบกันเร็วๆ ก่อน
------------------------------------------------------------------ */
const PAGE_SIZE = 15;

// เขียนคลาสเต็มทุกตัว ห้ามประกอบชื่อด้วย template string
const URGENT_CHIP =
  "[--bdg-surface:var(--chip-orange)] [--bdg-text:var(--chip-orange-foreground)]";

function UrgentChip() {
  return (
    <Badge appearance="soft" className={cn("[--bdg-border:transparent] ml-2 font-semibold", URGENT_CHIP)}>
      เร่งด่วน
    </Badge>
  );
}

export function ApproveList({ docs }: { docs: PoDoc[] }) {
  const [page, setPage] = React.useState(1);
  const { pages, safe, slice } = paginate(docs, page, PAGE_SIZE);

  // เปิดไว้ทุกแผงเป็นค่าเริ่มต้น — เก็บเฉพาะ id ที่ถูก "ปิด" เอง (เหมือน po-order-list.tsx)
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
          <ApprovePanel key={d.id} doc={d} open={!collapsed.has(d.id)} onToggle={() => toggle(d.id)} />
        ))}
      </div>
      <TablePager page={safe} pages={pages} onChange={setPage} />
    </>
  );
}

function ApprovePanel({
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
      className="cursor-pointer overflow-hidden rounded-xl border border-border bg-card"
    >
      {/* จอแคบ: เรียงต่อกันเป็นแนวตั้งเสมอ (ไม่พึ่ง flex-wrap ให้ห่อเอง) —
          บล็อกราคามีสองบรรทัดซ้อนกันอยู่แล้ว ถ้าปล่อยให้ flex-wrap บีบอยู่แถว
          เดียวกับเลขที่ใบ ตัวหนังสือจะเบียดจนล้นทับกัน ต้องบังคับสลับเป็นคนละ
          แถวไปเลยตั้งแต่ต้น แล้วค่อยกลับมาเรียงเดียวกันตอนจอกว้างพอ (@lg) */}
      <div className="flex flex-col gap-3 px-4 py-3.5 @lg:flex-row @lg:items-start @lg:justify-between @lg:gap-4">
        <div className="min-w-0 @lg:flex-1">
          <span className="block whitespace-nowrap">
            <span className="font-semibold">{d.code}</span>
            <span className="ml-2 text-sm text-muted-foreground">{d.createdAt}</span>
          </span>
          <span className="mt-0.5 block text-sm font-semibold text-foreground">
            {d.company}
          </span>
        </div>

        {/* กันคลิกลอยไม่ให้ทะลุไปนำทางทั้งใบ — โซนนี้แค่ดูราคา/สลับมุมมอง */}
        <div className="flex shrink-0 items-center gap-4" onClick={(e) => e.stopPropagation()}>
          <div className="@lg:text-right">
            <p className="text-xs text-muted-foreground">
              {d.lineItems.length} รายการ · ราคารวมทั้งหมด (บาท)
            </p>
            {/* ตัวเลขที่ต้องเด่นที่สุดในแถว — ใหญ่/หนา/สีแบรนด์ ต่างจากตัวหนังสือ
                รอบข้างที่เป็นแค่ป้ายกำกับ (เลขที่ใบ/บริษัท/จำนวนรายการ) */}
            <p className="text-xl font-bold text-primary tabular-nums">
              {formatPoBaht(poTotalPrice(d))}
            </p>
          </div>
          <button
            type="button"
            onClick={onToggle}
            aria-label={open ? "ซ่อนรายการสินค้า" : "ดูรายการสินค้า"}
            className="shrink-0 text-muted-foreground"
          >
            <ChevronDownIcon className={cn("size-4 transition-transform", open && "rotate-180")} />
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border">
          <div className="hidden @3xl:block">
            <ApproveTable po={d} onNavigate={goToDoc} />
          </div>
          <div className="@3xl:hidden">
            <ApproveListSimple po={d} />
          </div>
        </div>
      )}
    </div>
  );
}

function ProductLabel({ item }: { item: PoLineItem }) {
  return (
    <>
      <span className="font-medium">{item.productName}</span>
      {item.productSub && <span className="text-muted-foreground"> {item.productSub}</span>}
      <span className="text-muted-foreground"> · {item.group}</span>
      {item.packing && <span className="text-muted-foreground"> · {item.packing}</span>}
      {item.urgent && <UrgentChip />}
    </>
  );
}

/** จอกว้าง — ตารางราคาต่อรายการ ไม่มีคอลัมน์รับเข้า/ค้างรับเหมือนแท็บ "สั่งซื้อ"
    เพราะใบพวกนี้ยังไม่เริ่มรับเข้าเลย สิ่งที่ต้องดูก่อนอนุมัติคือราคาล้วนๆ */
function ApproveTable({ po, onNavigate }: { po: PoDoc; onNavigate: () => void }) {
  return (
    <Table className="table-fixed">
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead>สินค้า</TableHead>
          <TableHead className="w-32 text-right">สั่งซื้อ</TableHead>
          <TableHead className="w-40 text-right">ราคาสั่งซื้อต่อหน่วย (บาท)</TableHead>
          <TableHead className="w-36 text-right">ค่าจัดการต่อหน่วย (บาท)</TableHead>
          <TableHead className="w-40 text-right">ราคารวมต่อหน่วย (บาท)</TableHead>
          <TableHead className="w-40 text-right">ราคารวมทั้งหมด (บาท)</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {po.lineItems.map((item) => (
          <TableRow key={item.id} onClick={onNavigate} className="cursor-pointer hover:bg-transparent">
            <TableCell className="truncate">
              <ProductLabel item={item} />
            </TableCell>
            <TableCell className="text-right whitespace-nowrap tabular-nums">
              {formatPoQty(item.orderedQty)} {item.unit}
            </TableCell>
            <TableCell className="text-right whitespace-nowrap tabular-nums">
              {formatPoBaht(item.pricePerUnit)}
            </TableCell>
            <TableCell className="text-right whitespace-nowrap tabular-nums">
              {formatPoBaht(item.handlingPerUnit)}
            </TableCell>
            <TableCell className="text-right whitespace-nowrap tabular-nums">
              {formatPoBaht(lineItemUnitPrice(item))}
            </TableCell>
            {/* ราคารวมต่อรายการ — เน้นหนา ไม่ต้องถึงขนาดสีแบรนด์เหมือนยอดรวมทั้งใบ
                ที่หัวแผง (ตัวเลขนั้นเด่นสุดในหน้านี้ ที่นี่แค่รองลงมา) */}
            <TableCell className="text-right whitespace-nowrap font-semibold tabular-nums">
              {formatPoBaht(lineItemTotalPrice(item))}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

/** จอแคบ — แค่รายชื่อสินค้า ไม่มีตัวเลข (ราคารวมทั้งใบเห็นเด่นอยู่บนหัวแผงแล้ว
    ราคารายตัวดูต่อได้จากหน้าใบสั่งซื้อ กดที่แผง/แถวนี้ก็ไปถึงได้เหมือนกัน) */
function ApproveListSimple({ po }: { po: PoDoc }) {
  return (
    <div className="divide-y divide-border">
      {po.lineItems.map((item) => (
        <div key={item.id} className="px-4 py-3 text-sm">
          <ProductLabel item={item} />
        </div>
      ))}
    </div>
  );
}
