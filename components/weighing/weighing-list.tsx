"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@peckey954/ui/components/ui/button";
import { Separator } from "@peckey954/ui/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@peckey954/ui/components/ui/table";
import { cn } from "@peckey954/ui/lib/utils";
import { formatTon, type WeighingDoc } from "@/lib/weighing";
import {
  CardBox,
  CardHead,
  CardRow,
  COL_FIRST,
  COL_LAST,
  EmptyDocs,
  HEAD_FIRST,
  HEAD_LAST,
  ROW_HOVER_NAV,
  STICKY_HEAD,
  TableFrame,
  TablePager,
  paginate,
} from "@/components/stock/doc-parts";

/**
 * รายการใบชั่งน้ำหนัก — ทั้งการ์ดและแถวตารางกดแล้วไปหน้าเดียวกันคือ
 * "ใบชั่งน้ำหนัก" (รวมทุกรอบที่รถเข้ามาชั่งของ PO นั้น) ไม่มีทางลัดข้ามไป
 * หน้ากรอกชั่งจริงตรง ๆ เหมือนแท็บรอรับเข้า เพราะที่นี่ต้องเห็นก่อนว่า
 * PO นี้เคยชั่งไปกี่รอบแล้ว ก่อนจะเพิ่มรอบใหม่
 *
 * จอกว้าง — ตาราง จอแคบ — การ์ด เหมือนแท็บรอรับเข้า ใช้ชิ้นส่วนร่วมชุดเดียวกัน
 * (components/stock/doc-parts) เพราะเป็นเลย์เอาต์เอกสารทั่วไป ไม่ใช่ตรรกะเฉพาะสต็อก
 */
const PAGE_SIZE = 15;

export function WeighingList({ docs }: { docs: WeighingDoc[] }) {
  const [page, setPage] = React.useState(1);
  const { pages, safe, slice } = paginate(docs, page, PAGE_SIZE);
  const router = useRouter();

  if (docs.length === 0) {
    return <EmptyDocs title="ไม่พบใบชั่งน้ำหนัก" hint="ลองใช้คำค้นสั้นลง" />;
  }

  return (
    <>
      {/* ---------- จอแคบ: การ์ด ---------- */}
      <div className="@3xl:hidden">
        <div className="space-y-4">
          {slice.map((d) => (
            <WeighingCard key={d.id} doc={d} />
          ))}
        </div>
        <TablePager page={safe} pages={pages} onChange={setPage} />
      </div>

      {/* ---------- จอกว้าง: ตาราง ---------- */}
      <div className="hidden @3xl:block">
        <TableFrame>
          <Table>
            <TableHeader className={STICKY_HEAD}>
              <TableRow>
                <TableHead className={HEAD_FIRST}>เลขที่ใบชั่งน้ำหนัก</TableHead>
                <TableHead>วัตถุดิบ</TableHead>
                <TableHead>บริษัท</TableHead>
                <TableHead>วันที่รถจะเข้าล่าสุด</TableHead>
                <TableHead>ทะเบียนรถที่จะเข้าล่าสุด</TableHead>
                <TableHead className="text-right">สั่งซื้อ</TableHead>
                <TableHead className={cn(HEAD_LAST, "text-right")}>ชั่งน้ำหนัก</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {slice.map((d) => (
                <TableRow
                  key={d.id}
                  // ทั้งแถวกดได้ ไม่ใช่เฉพาะตัวอักษรเลขที่ใบ — เป้าเล็กแค่คำเดียว
                  // ในแถวสูง 65px คือกดพลาดตลอด ยังเป็น <a> จริงในเซลล์แรกด้วย
                  onClick={() => router.push(`/weighing/${d.id}`)}
                  className={cn("cursor-pointer", ROW_HOVER_NAV)}
                >
                  <TableCell className={COL_FIRST}>
                    <Link
                      href={`/weighing/${d.id}`}
                      className="block font-medium whitespace-nowrap hover:underline"
                    >
                      {d.code}
                    </Link>
                    <span className="block text-sm text-muted-foreground">
                      {d.createdAt}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="block font-medium">{d.productName}</span>
                    {d.productSub && (
                      <span className="block text-sm text-muted-foreground">
                        {d.productSub}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="max-w-56 truncate" title={d.supplier}>
                    {d.supplier}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{d.arriveDate}</TableCell>
                  <TableCell
                    className="max-w-40 truncate text-muted-foreground"
                    title={d.truck}
                  >
                    {d.truck}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap tabular-nums">
                    {formatTon(d.orderTon)} ตัน
                  </TableCell>
                  {/* ปุ่มยืนยันทางไปหน้าเดียวกับที่ทั้งแถวกดได้ — ให้มีเป้ากดชัดเจน
                      บนแถวยาว ไม่ใช่ทางลัดไปที่อื่น */}
                  <TableCell
                    className={cn(COL_LAST, "text-right")}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button asChild variant="outline-primary" size="sm">
                      <Link href={`/weighing/${d.id}`}>ชั่งน้ำหนัก</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <TablePager page={safe} pages={pages} onChange={setPage} />
        </TableFrame>
      </div>
    </>
  );
}

function WeighingCard({ doc }: { doc: WeighingDoc }) {
  return (
    // ลิงก์คลุมทั้งใบด้วย after:inset-0 แทนที่จะเอา <a> ครอบเนื้อหา
    // เพราะในการ์ดมีปุ่มอยู่ด้วย ปุ่มซ้อนในลิงก์เป็น HTML ที่ผิด
    <div className="relative rounded-xl border border-border bg-card p-4">
      <CardHead code={doc.code} at={doc.createdAt} href={`/weighing/${doc.id}`} />

      <CardBox className="mt-3">
        <p className="font-medium">
          {doc.productName}
          {doc.productSub && ` ${doc.productSub}`}
        </p>
        <p className="text-sm">{doc.supplier}</p>
      </CardBox>

      <dl className="mt-3 space-y-1.5 text-sm">
        <CardRow label="วันที่รถจะเข้า">{doc.arriveDate}</CardRow>
        <CardRow label="ทะเบียนรถ">{doc.truck}</CardRow>
        <CardRow label="สั่งซื้อ">{formatTon(doc.orderTon)} ตัน</CardRow>
      </dl>

      <Separator className="mt-3" />

      {/* z-10 ให้ปุ่มลอยเหนือลิงก์ที่คลุมทั้งใบ ไม่งั้นกดไม่โดน */}
      <div className="relative z-10 mt-3 flex justify-end">
        <Button asChild variant="outline-primary" size="sm">
          <Link href={`/weighing/${doc.id}`}>ชั่งน้ำหนัก</Link>
        </Button>
      </div>
    </div>
  );
}
