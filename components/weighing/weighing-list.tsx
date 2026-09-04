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
import { formatTon, weighedTonSoFar, type WeighingDoc } from "@/lib/weighing";
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
 * รายการใบชั่งน้ำหนัก — จอกว้างเป็นตาราง จอแคบเป็นการ์ด ใช้ชิ้นส่วนร่วมชุด
 * เดียวกับแท็บรอรับเข้า (components/stock/doc-parts) เพราะเป็นเลย์เอาต์
 * เอกสารทั่วไป ไม่ใช่ตรรกะเฉพาะสต็อก
 *
 * ทั้งแถว/การ์ดกดแล้วไปหน้า "ใบชั่งน้ำหนัก" (ดีเทลรวม รวมทุกรอบที่เคยชั่งของ
 * PO นั้น) เสมอทั้งสองแท็บ — ต้องเห็นก่อนว่า PO นี้เคยชั่งไปกี่รอบแล้วก่อนเพิ่ม
 * รอบใหม่ ส่วนปุ่ม "ชั่งน้ำหนัก" ท้ายแถว/การ์ด (โผล่เฉพาะแท็บ variant="pending"
 * ที่มี action ให้กดต่อทันที) เป็นทางลัดข้ามไปหน้า "เพิ่มการชั่งน้ำหนัก" ตรงๆ
 * แยกปลายทางจากตัวแถวโดยตั้งใจ — กดตารางไปดูภาพรวม กดปุ่มไปกรอกชั่งเลย
 */
const PAGE_SIZE = 15;

export function WeighingList({
  docs,
  variant,
}: {
  docs: WeighingDoc[];
  variant: "pending" | "weighed";
}) {
  const [page, setPage] = React.useState(1);
  const { pages, safe, slice } = paginate(docs, page, PAGE_SIZE);
  const router = useRouter();

  if (docs.length === 0) {
    return <EmptyDocs title="ไม่พบใบชั่งน้ำหนัก" hint="ลองใช้คำค้นสั้นลง" />;
  }

  const detailHref = (id: string) => `/weighing/${id}`;
  const addHref = (id: string) => `/weighing/${id}/add`;

  return (
    <>
      {/* ---------- จอแคบ: การ์ด ---------- */}
      <div className="@3xl:hidden">
        <div className="space-y-4">
          {slice.map((d) => (
            <WeighingCard
              key={d.id}
              doc={d}
              detailHref={detailHref(d.id)}
              addHref={addHref(d.id)}
              variant={variant}
            />
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
                <TableHead>บรรจุภัณฑ์</TableHead>
                <TableHead>บริษัท</TableHead>
                <TableHead>วันที่รถจะเข้าล่าสุด</TableHead>
                <TableHead>ทะเบียนรถที่จะเข้าล่าสุด</TableHead>
                <TableHead className="text-right">สั่งซื้อ</TableHead>
                <TableHead
                  className={cn("text-right", variant === "weighed" && HEAD_LAST)}
                >
                  น้ำหนักสินค้า
                </TableHead>
                {variant === "pending" && (
                  <TableHead className={cn(HEAD_LAST, "text-right")}>
                    ชั่งน้ำหนัก
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {slice.map((d) => {
                const weighed = weighedTonSoFar(d);
                const href = detailHref(d.id);
                return (
                  <TableRow
                    key={d.id}
                    // ทั้งแถวกดได้ ไม่ใช่เฉพาะตัวอักษรเลขที่ใบ — เป้าเล็กแค่คำเดียว
                    // ในแถวสูง 65px คือกดพลาดตลอด ยังเป็น <a> จริงในเซลล์แรกด้วย
                    // ไปหน้าดีเทลรวมเสมอ ไม่ใช่หน้ากรอกชั่ง (ดูปุ่ม "ชั่งน้ำหนัก"
                    // ท้ายแถวสำหรับทางลัดไปหน้ากรอกชั่งตรงๆ)
                    onClick={() => router.push(href)}
                    className={cn("cursor-pointer", ROW_HOVER_NAV)}
                  >
                    <TableCell className={COL_FIRST}>
                      <Link
                        href={href}
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
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {d.packing}
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
                    <TableCell
                      className={cn(
                        "text-right whitespace-nowrap tabular-nums",
                        variant === "weighed" && COL_LAST
                      )}
                    >
                      {weighed === null ? "-" : `${formatTon(weighed)} ตัน`}
                    </TableCell>
                    {/* ทางลัดข้ามไปหน้ากรอกชั่งตรงๆ — ต่างจากแถวที่ไปหน้าดีเทลรวม
                        โผล่เฉพาะแท็บรอชั่งเท่านั้น แท็บชั่งแล้วไม่มี action
                        ให้กดต่อจากตารางนี้ทันที */}
                    {variant === "pending" && (
                      <TableCell
                        className={cn(COL_LAST, "text-right")}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button asChild variant="outline-primary" size="sm">
                          <Link href={addHref(d.id)}>ชั่งน้ำหนัก</Link>
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          <TablePager page={safe} pages={pages} onChange={setPage} />
        </TableFrame>
      </div>
    </>
  );
}

function WeighingCard({
  doc,
  detailHref,
  addHref,
  variant,
}: {
  doc: WeighingDoc;
  detailHref: string;
  addHref: string;
  variant: "pending" | "weighed";
}) {
  const weighed = weighedTonSoFar(doc);
  return (
    // ลิงก์คลุมทั้งใบด้วย after:inset-0 แทนที่จะเอา <a> ครอบเนื้อหา
    // เพราะในการ์ดมีปุ่มอยู่ด้วย ปุ่มซ้อนในลิงก์เป็น HTML ที่ผิด
    // ทั้งการ์ดไปหน้าดีเทลรวม ปุ่ม "ชั่งน้ำหนัก" ท้ายการ์ดต่างหากที่ลัดไปกรอกชั่ง
    <div className="relative rounded-xl border border-border bg-card p-4">
      <CardHead code={doc.code} at={doc.createdAt} href={detailHref} />

      <CardBox className="mt-3">
        <p className="font-medium">
          {doc.productName}
          {doc.productSub && ` ${doc.productSub}`}
        </p>
        <p className="text-sm">{doc.supplier}</p>
      </CardBox>

      <dl className="mt-3 space-y-1.5 text-sm">
        <CardRow label="บรรจุภัณฑ์">{doc.packing}</CardRow>
        <CardRow label="วันที่รถจะเข้า">{doc.arriveDate}</CardRow>
        <CardRow label="ทะเบียนรถ">{doc.truck}</CardRow>
        <CardRow label="สั่งซื้อ">{formatTon(doc.orderTon)} ตัน</CardRow>
        <CardRow label="น้ำหนักสินค้า">
          {weighed === null ? "-" : `${formatTon(weighed)} ตัน`}
        </CardRow>
      </dl>

      {variant === "pending" && (
        <>
          <Separator className="mt-3" />
          {/* z-10 ให้ปุ่มลอยเหนือลิงก์ที่คลุมทั้งใบ ไม่งั้นกดไม่โดน */}
          <div className="relative z-10 mt-3 flex justify-end">
            <Button asChild variant="outline-primary" size="sm">
              <Link href={addHref}>ชั่งน้ำหนัก</Link>
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
