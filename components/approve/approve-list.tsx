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
import { PR_CATEGORY_LABEL } from "@/lib/pr";
import { EmptyDocs, TablePager, paginate } from "@/components/stock/doc-parts";

/* ------------------------------------------------------------------
   รายการใบสั่งซื้อรออนุมัติ — หนึ่งแผงต่อหนึ่งใบ เหมือนแท็บ "สั่งซื้อ" ของหน้า
   /po (po-order-list.tsx) แต่จอแคบ/จอกว้างจัดวางต่างกันตามแบบ:

   จอแคบ — ชื่อบริษัทใส่กล่องพื้นเน้น (ไม่มีตารางหัวคอลัมน์ให้เน้นแทน) ราคารวม
   ทั้งใบไปอยู่ท้ายการ์ดเดี่ยวๆ ไม่มีจำนวนรายการกำกับซ้ำ (จอแคบพื้นที่จำกัด)

   จอกว้าง — บริษัทเป็นตัวหนังสือธรรมดา (มีตารางหัวคอลัมน์พื้นเทาเน้นอยู่แล้ว
   ด้านล่าง ไม่ต้องซ้ำกล่องสี) จำนวนรายการ+ราคารวมไปอยู่หัวแผงเลยแทนท้ายการ์ด
   เพราะจอกว้างมีที่พอโชว์คู่กับเลขที่ใบในแถวเดียว

   กดทั้งแผง/แถวสินค้าพาไปหน้า "ใบอนุมัติ" (/approve/[id]) — หน้าแยกต่างหาก
   ไม่ใช่ modal เพราะเป็นเอกสารทั้งใบ (ตามธรรมเนียมเดียวกับเอกสารอื่นทั้งแอปนี้
   /po/[id], /pr/[id] ฯลฯ ไม่เคยเป็น modal) ที่นั่นมีปุ่มอนุมัติ/ไม่อนุมัติจริง
   ส่วนที่นี่เน้นไล่ดูราคารวมแต่ละใบเปรียบเทียบกันเร็วๆ ก่อน
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
  const goToDoc = () => router.push(`/approve/${d.id}`);

  return (
    <div
      onClick={goToDoc}
      className="cursor-pointer overflow-hidden rounded-xl border border-border bg-card"
    >
      <div className="flex items-start justify-between gap-3 px-4 pt-3.5">
        <div className="min-w-0 flex-1">
          <span className="block whitespace-nowrap">
            <span className="font-semibold">{d.code}</span>
            <span className="ml-2 text-sm text-muted-foreground">{d.createdAt}</span>
          </span>
        </div>

        {/* กันคลิกลอยไม่ให้ทะลุไปนำทางทั้งใบ — โซนนี้แค่ดูราคา/สลับมุมมอง */}
        <div className="flex shrink-0 items-center gap-4" onClick={(e) => e.stopPropagation()}>
          {/* จอกว้างเท่านั้น — จำนวนรายการ+ราคารวมไว้ที่หัวแผงเลย จอแคบไปอยู่
              ท้ายการ์ดแทน (ดูฟังก์ชัน footer ท้ายไฟล์) */}
          <div className="hidden items-baseline gap-2 whitespace-nowrap @3xl:flex">
            <span className="text-sm text-foreground">{d.lineItems.length} รายการ</span>
            <span className="text-sm text-muted-foreground">ราคารวมทั้งหมด (บาท):</span>
            <span className="text-sm font-semibold tabular-nums">{formatPoBaht(poTotalPrice(d))}</span>
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

      {/* บริษัท — แยกออกมาเป็นแถวเต็มความกว้างของตัวเอง (ไม่ซ้อนอยู่ในคอลัมน์
          flex-1 เดียวกับเลขที่ใบ) เพื่อให้กล่องพื้นเน้นบนจอแคบยาวเต็มการ์ด
          เว้นระยะจากขอบการ์ดเท่ากับที่อื่นทุกจุด (px-4) ไม่ใช่แค่กว้างเท่า
          ความยาวชื่อบริษัทเหมือนก่อนหน้านี้ */}
      <div className="px-4 pt-1.5 pb-3.5 @3xl:hidden">
        <div className="rounded-md bg-brand px-3 py-2">
          <span className="block text-sm font-medium text-foreground">{d.company}</span>
          <span className="mt-0.5 block text-sm text-muted-foreground">
            สินค้า {d.lineItems.length} รายการ
          </span>
        </div>
      </div>
      <div className="hidden px-4 pt-1 pb-3.5 @3xl:block">
        <span className="text-sm font-semibold text-foreground">{d.company}</span>
      </div>

      {open && (
        <>
          <div className="hidden @3xl:block">
            <ApproveTable po={d} onNavigate={goToDoc} />
          </div>
          <div className="@3xl:hidden">
            <ApproveListSimple po={d} />
          </div>
        </>
      )}

      {/* จอแคบเท่านั้น — ราคารวมท้ายการ์ด จอกว้างมีอยู่ที่หัวแผงแล้วไม่ต้องซ้ำ
          ไม่มีจำนวนรายการกำกับตรงนี้ (จอกว้างเท่านั้นที่โชว์คู่กันด้านบน)

          เส้นคั่นด้านบนใช้ mx-4 (ระยะขอบ) แทน px-4 (แค่ padding ภายใน) เพราะ
          border-top วาดตามกรอบนอกของกล่องเสมอ ไม่สนใจ padding ข้างใน — ต้องใช้
          margin ถึงจะทำให้เส้นสั้นกว่ากล่องจริง เว้นห่างจากขอบการ์ดเท่ากับเส้น
          คั่นระหว่างรายการสินค้า ไม่ใช่เส้นเต็มขอบแบบก่อนหน้านี้ */}
      <div className="mx-4 flex items-center justify-between gap-2 border-t border-border py-3 @3xl:hidden">
        <span className="text-sm text-muted-foreground">รวมทั้งหมด (บาท):</span>
        <span className="text-sm font-semibold tabular-nums">{formatPoBaht(poTotalPrice(d))}</span>
      </div>
    </div>
  );
}

/** ป้ายกำกับสินค้าสองบรรทัด — ชื่อ (+ชิปเร่งด่วนถ้ามี) แล้วบรรทัดถัดมาเป็น
    ประเภท/หมวด/บรรจุภัณฑ์ คั่นด้วย "|" ใช้ทั้งการ์ดจอแคบและเซลล์ตารางจอกว้าง
    เหมือนกันทุกที่ (ต่างจาก po-order-list.tsx ตรงที่ไม่มีบรรทัดเลข PO ย่อยที่นี่
    — ใบอนุมัติดูราคารวมแต่ละรายการ ไม่ต้องอ้างอิงเลขย่อยระดับนี้) */
function ProductLabel({ item }: { item: PoLineItem }) {
  return (
    <>
      <span className="block truncate font-medium">
        {item.productName}
        {item.productSub && ` ${item.productSub}`}
        {item.urgent && <UrgentChip />}
      </span>
      <span className="mt-1 block truncate text-sm text-muted-foreground">
        {PR_CATEGORY_LABEL[item.categoryId]} | {item.group}
        {item.packing && ` | ${item.packing}`}
      </span>
    </>
  );
}

/** หัวตารางพื้นเทา ตามแบบ (เหมือนโทนเดียวกับ COL_HEAD ของ po-order-list.tsx) */
const COL_HEAD =
  "[&_th]:h-9 [&_th]:bg-surface [&_th]:px-4 [&_th]:text-xs [&_th]:font-medium [&_th]:text-muted-foreground [&_th]:whitespace-nowrap";
/** DS TableCell ปกติมี padding แค่ p-2 (8px) แคบกว่าระยะขอบการ์ดที่เหลือ (px-4
    ทั้งหัวแผง/ท้ายแผง) ทำให้แถวสินค้าดูชิดขอบการ์ดกว่าส่วนอื่น ต้องขยับเป็น
    16px ให้เท่ากันทุกด้านของการ์ด */
const COL_BODY = "[&_td]:px-4 [&_td]:py-3";

/** จอกว้าง — ตารางย่อดูเร็ว 4 คอลัมน์ ไม่มีคอลัมน์รับเข้า/ค้างรับเหมือนแท็บ
    "สั่งซื้อ" เพราะใบพวกนี้ยังไม่เริ่มรับเข้าเลย ราคาต่อหน่วย/ค่าจัดการแยกย่อย
    ดูต่อได้จากหน้าใบอนุมัติ (กดแถวไปถึงได้เลย) ตารางนี้แค่ให้ไล่เทียบราคารวม
    ของแต่ละรายการเร็ว ๆ */
function ApproveTable({ po, onNavigate }: { po: PoDoc; onNavigate: () => void }) {
  return (
    <Table className={cn("table-fixed", COL_HEAD, COL_BODY)}>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead>สินค้า</TableHead>
          <TableHead className="w-32 text-right">สั่งซื้อ</TableHead>
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
              {formatPoBaht(lineItemUnitPrice(item))}
            </TableCell>
            {/* ราคารวมต่อรายการ — เน้นหนา ไม่ต้องถึงขนาดสีแบรนด์เหมือนยอดรวมทั้งใบ
                ที่หัวแผง (ตัวเลขนั้นสรุปทั้งใบ ที่นี่แค่รายรายการ) */}
            <TableCell className="text-right whitespace-nowrap font-semibold tabular-nums">
              {formatPoBaht(lineItemTotalPrice(item))}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

/** จอแคบ — แค่รายชื่อสินค้า ไม่มีตัวเลข (ราคารวมทั้งใบอยู่ท้ายการ์ดแล้ว ราคาราย
    ตัวดูต่อได้จากหน้าใบอนุมัติ กดที่แผง/แถวนี้ก็ไปถึงได้เหมือนกัน)

    เส้นคั่นระหว่างรายการเว้นระยะจากขอบการ์ดซ้าย/ขวา ~16px ไม่ใช่เส้นเต็มขอบ —
    ทำได้โดยย้าย padding แนวนอนไปไว้ที่กล่องนอก (px-4) แล้วให้ divide-y ตีเส้น
    บนตัว "แถว" เอง (ซึ่งความกว้างเท่ากับพื้นที่ในกรอบ padding พอดี ไม่ใช่เต็ม
    ความกว้างการ์ด) ไม่ใช่ใส่ px-4 ที่ตัวแถวแต่ละแถวแบบเดิม */
function ApproveListSimple({ po }: { po: PoDoc }) {
  return (
    <div className="divide-y divide-border px-4">
      {po.lineItems.map((item) => (
        <div key={item.id} className="py-3 text-sm">
          <ProductLabel item={item} />
        </div>
      ))}
    </div>
  );
}
