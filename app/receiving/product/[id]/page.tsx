"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ChevronDownIcon, PlusIcon } from "lucide-react";
import { Button } from "@peckey954/ui/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@peckey954/ui/components/ui/collapsible";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@peckey954/ui/components/ui/table";
import { cn } from "@peckey954/ui/lib/utils";
import { toast } from "sonner";
import { ChipGroup } from "@/components/chip-group";
import {
  CardHead,
  CardRow,
  COL_FIRST,
  HEAD_FIRST,
  ROW_HOVER_NAV,
  STICKY_HEAD,
  TableFrame,
  TablePager,
  paginate,
} from "@/components/stock/doc-parts";
import { Crumbs, FooterBar, Meta, ProductLine, Stat } from "@/components/receiving/parts";
import {
  DOC_TITLE,
  docOf,
  formatAt,
  formatTons,
  liveSlips,
  markDone,
  outstanding,
  receivedPieces,
  receivedQty,
  type ReceivingDoc,
  type Slip,
} from "@/lib/goods-receiving";

/* ------------------------------------------------------------------
   ใบรับเข้าสินค้า — หนึ่งใบ = สินค้าหนึ่งรายการ รับเข้าทีละสลิง

   การ์ดข้างบนคือยอดของทั้งใบ ตารางข้างล่างคือสลิงที่รับไปแล้วในใบนี้
   กดแถวไปดูสลิงนั้น — แก้ได้ภายในสามวัน ยกเลิกได้เฉพาะผู้ดูแลระบบ

   บันทึกร่างคือเก็บไว้ทำต่อ ใบยังอยู่แท็บรอรับเข้า บันทึกเข้าคลังคือปิดใบ
   ย้ายไปแท็บรับสินค้าแล้ว — ต้องมีสลิงอย่างน้อยหนึ่งสลิงถึงจะปิดได้
------------------------------------------------------------------ */

export default function ReceivingDocPage() {
  const { id } = useParams<{ id: string }>();
  const doc = docOf(id);
  if (!doc) {
    return (
      <main className="mx-auto w-full max-w-lg px-4 py-20 text-center">
        <p className="font-medium">ไม่พบใบรับเข้านี้</p>
        <Button asChild variant="outline-primary" className="mt-4">
          <Link href="/receiving/product">กลับไปหน้ารับเข้าสินค้า</Link>
        </Button>
      </main>
    );
  }
  return <DocSheet key={doc.id} doc={doc} />;
}

type TabId = "live" | "cancelled";

function DocSheet({ doc }: { doc: ReceivingDoc }) {
  const router = useRouter();
  const [tab, setTab] = React.useState<TabId>("live");
  const [page, setPage] = React.useState(1);
  const live = liveSlips(doc);
  const cancelled = doc.slips.filter((s) => s.cancelled);
  // ล่าสุดอยู่บน — คนเปิดใบระหว่างรับของมาดูสลิงที่เพิ่งยกเข้าไป
  const shown = [...(tab === "live" ? live : cancelled)].reverse();
  const { pages, safe, slice } = paginate(shown, page, 10);
  const tons = doc.unit === "ตัน";
  const slipHref = (s: Slip) => `/receiving/product/${doc.id}/${s.id}`;
  const left = outstanding(doc);

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col">
      <main className="@container mx-auto w-full max-w-7xl flex-1 px-4 pt-6 pb-6 sm:px-6">
        <Crumbs trail={[{ label: "รับเข้าสินค้า", href: "/receiving/product" }, { label: "ใบรับเข้าสินค้า" }]} />

        <h1 className="mt-4 text-2xl font-bold tracking-tight">
          {DOC_TITLE[doc.source]} {doc.code}
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">{doc.createdAt}</p>

        <Collapsible defaultOpen className="mt-5 rounded-xl border border-border bg-card px-4 py-6">
          <CollapsibleTrigger asChild>
            <button type="button" className="group flex w-full items-start justify-between gap-3 text-left">
              <ProductLine doc={doc} />
              <span className="flex shrink-0 items-center gap-3">
                <span className="hidden text-sm font-semibold @2xl:inline">{doc.supplier}</span>
                <ChevronDownIcon className="size-5 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
              </span>
            </button>
          </CollapsibleTrigger>

          {/* ยอดรับอยู่นอกส่วนที่หุบ — เป็นตัวเลขที่ต้องเทียบกับตารางตลอดทั้งหน้า */}
          <div className="mt-4 grid gap-4 rounded-xl border border-brand-hover bg-brand px-4 py-6 @xl:grid-cols-2">
            {tons ? (
              <>
                <Stat label="รับเข้า (ตัน)" value={formatTons(receivedQty(doc))} />
                <Stat label="รับเข้า (ชิ้น)" value={live.length ? receivedPieces(doc).toLocaleString("en-US") : "-"} />
              </>
            ) : (
              <>
                <Stat label={`รับเข้า (${doc.unit})`} value={live.length ? receivedQty(doc).toLocaleString("en-US") : "-"} />
                <Stat label="รับเข้า (สลิง)" value={live.length ? String(live.length) : "-"} />
              </>
            )}
          </div>

          <CollapsibleContent>
            <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 @3xl:grid-cols-4">
              <Meta label={doc.source === "external" ? "ทะเบียนรถ" : "ไลน์ผลิต"} value={doc.source === "external" ? doc.truck : doc.supplier} />
              <Meta label="วันที่รถจะเข้า" value={doc.arriveDate} />
              <Meta
                label={`รอรับเข้า (${doc.unit})`}
                value={left > 0 ? (tons ? formatTons(left) : left.toLocaleString("en-US")) : "-"}
              />
              <Meta label="หมายเหตุจากผู้สั่งซื้อ" value={doc.buyerNote} />
              <Meta label="เลขที่ใบขอซื้อ" value={doc.prCode} />
              <Meta label="PRQ Unique ID" value={doc.prqId} />
              <Meta label="ผู้ทำใบขอซื้อ" value={doc.prMaker} />
              <Meta label="ผู้แก้ไขขอซื้อล่าสุด" value="-" />
              <Meta label="ผู้ทำใบสั่งซื้อ" value={doc.poMaker} />
              <Meta label="ผู้แก้ไขสั่งซื้อล่าสุด" value="-" />
              <Meta label="เหตุผลการซื้อ" value={doc.reason} />
              <Meta label="ช่วงวันที่รถส่งสินค้า" value={`${doc.deliveryFrom} - ยังไม่ระบุ`} />
            </div>
          </CollapsibleContent>
        </Collapsible>

        {doc.slips.length > 0 && (
          <ChipGroup
            className="mt-6"
            label="กรองสลิง"
            value={tab}
            onChange={(v) => {
              setTab(v);
              setPage(1);
            }}
            options={[
              { id: "live" as const, label: `รับเข้า (${live.length})` },
              { id: "cancelled" as const, label: `ยกเลิก (${cancelled.length})` },
            ]}
          />
        )}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold">รับเข้าสินค้าต่อสลิง</h2>
          {!doc.done && (
            <Button asChild>
              <Link href={`/receiving/product/${doc.id}/add`}>
                <PlusIcon />
                เพิ่มการรับเข้าสินค้า
              </Link>
            </Button>
          )}
        </div>

        <div className="mt-4">
          {shown.length === 0 ? (
            <div className="flex h-60 flex-col items-center justify-center gap-2 rounded-xl border border-border bg-card text-center">
              <p className="text-lg font-bold">ไม่มีข้อมูล</p>
              <p className="text-muted-foreground">
                {tab === "live" ? "กรุณาเพิ่มการรับเข้าสินค้า" : "ไม่มีสลิงที่ยกเลิก"}
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-3 @3xl:hidden">
                {slice.map((s) => (
                  <div key={s.id} className="relative rounded-xl border border-border bg-card p-4">
                    <CardHead code={s.no} at={formatAt(s.at)} href={slipHref(s)} />
                    <dl className="mt-3 space-y-1.5 text-sm">
                      <CardRow label="เบอร์ตู้คอนเทนเนอร์">{s.containerNo ?? "-"}</CardRow>
                      <CardRow label="บรรจุภัณฑ์">{s.packing}</CardRow>
                      {tons && <CardRow label="ปริมาณรับเข้าต่อสลิง (ตัน)">{formatTons(s.tons ?? 0)}</CardRow>}
                      <CardRow label={`จำนวนรับเข้าต่อสลิง (${tons ? "ชิ้น" : doc.unit})`}>{s.count.toLocaleString("en-US")}</CardRow>
                      <CardRow label="หมายเหตุ" className="font-normal">{s.note ?? "-"}</CardRow>
                    </dl>
                  </div>
                ))}
                <TablePager page={safe} pages={pages} onChange={setPage} />
              </div>

              <div className="hidden @3xl:block">
                <TableFrame>
                  <Table>
                    <TableHeader className={STICKY_HEAD}>
                      <TableRow>
                        <TableHead className={cn(HEAD_FIRST, "min-w-52")}>เลขที่รับสินค้า</TableHead>
                        <TableHead className="min-w-28">เบอร์ตู้คอนเทนเนอร์</TableHead>
                        <TableHead className="min-w-24">บรรจุภัณฑ์</TableHead>
                        <TableHead className="w-full" />
                        {tons && <TableHead className="min-w-36 text-right">ปริมาณรับเข้าต่อสลิง (ตัน)</TableHead>}
                        <TableHead className="min-w-36 text-right">
                          จำนวนรับเข้าต่อสลิง ({tons ? "ชิ้น" : doc.unit})
                        </TableHead>
                        <TableHead className="min-w-40">หมายเหตุ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {slice.map((s) => (
                        <TableRow
                          key={s.id}
                          onClick={() => router.push(slipHref(s))}
                          className={cn("cursor-pointer", ROW_HOVER_NAV)}
                        >
                          <TableCell className={COL_FIRST}>
                            <Link href={slipHref(s)} className="block font-medium whitespace-nowrap hover:underline">
                              {s.no}
                            </Link>
                            <span className="block text-sm whitespace-nowrap text-muted-foreground tabular-nums">
                              {formatAt(s.at)}
                            </span>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">{s.containerNo ?? "-"}</TableCell>
                          <TableCell className="whitespace-nowrap">{s.packing}</TableCell>
                          <TableCell />
                          {tons && <TableCell className="text-right tabular-nums">{formatTons(s.tons ?? 0)}</TableCell>}
                          <TableCell className="text-right tabular-nums">{s.count.toLocaleString("en-US")}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{s.note ?? "-"}</TableCell>
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

      <FooterBar
        left={
          <Button variant="outline-primary" onClick={() => router.push("/receiving/product")}>
            ย้อนกลับ
          </Button>
        }
        right={
          !doc.done && (
            <>
              <Button
                variant="outline-primary"
                onClick={() =>
                  toast.success(`บันทึกร่าง ${doc.code} แล้ว`, {
                    description: "ใบยังอยู่ในแท็บรอรับเข้า กลับมารับต่อได้",
                  })
                }
              >
                บันทึกร่าง
              </Button>
              <Button
                onClick={() => {
                  if (live.length === 0) {
                    toast.error("รับเข้าสินค้าไม่สำเร็จ", {
                      description: "ยังไม่มีการรับเข้าสินค้า กรุณาเพิ่มการรับเข้าอย่างน้อยหนึ่งสลิง",
                    });
                    return;
                  }
                  markDone(doc);
                  toast.success("รับเข้าสินค้าสำเร็จ", { description: `สินค้า: ${doc.productName}` });
                  router.push("/receiving/product");
                }}
              >
                บันทึกเข้าคลัง
              </Button>
            </>
          )
        }
      />
    </div>
  );
}
