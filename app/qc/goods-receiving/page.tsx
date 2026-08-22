"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ListFilterIcon, SearchIcon } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@peckey954/ui/components/ui/breadcrumb";
import { Button } from "@peckey954/ui/components/ui/button";
import { Input } from "@peckey954/ui/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@peckey954/ui/components/ui/input-group";
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
import {
  COL_FIRST,
  EmptyDocs,
  HEAD_FIRST,
  STICKY_HEAD,
  TableFrame,
  TablePager,
  paginate,
} from "@/components/stock/doc-parts";
import {
  DONE_DOCS,
  PENDING_DOCS,
  type ReceivingDoc,
} from "@/lib/qc-receiving";

/* ------------------------------------------------------------------
   ตรวจรับสินค้า — รายการใบที่รอตรวจกับที่ตรวจไปแล้ว

   แท็บสองอันเป็นสองกองงานคนละแบบ ไม่ใช่ตัวกรองของกองเดียวกัน
   ฝั่งรอตรวจคือคิวที่ต้องทำ ฝั่งตรวจแล้วคือของที่เอาไว้ย้อนดู
   ตัวเลขบนแท็บจึงเป็นจำนวนงานค้าง ไม่ใช่จำนวนผลลัพธ์ของคำค้น
------------------------------------------------------------------ */

const PAGE_SIZE = 15;

export default function QcReceivingPage() {
  const [tab, setTab] = React.useState("pending");
  const [query, setQuery] = React.useState("");
  const [date, setDate] = React.useState("");
  const [page, setPage] = React.useState(1);

  const source = tab === "pending" ? PENDING_DOCS : DONE_DOCS;
  const q = query.trim().toLowerCase();
  const rows = source.filter(
    (d) =>
      q === "" ||
      d.code.toLowerCase().includes(q) ||
      d.product.toLowerCase().includes(q) ||
      d.supplier.toLowerCase().includes(q) ||
      d.receiver.toLowerCase().includes(q)
  );
  const { pages, safe, slice } = paginate(rows, page, PAGE_SIZE);

  return (
    <main className="@container mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage className="text-primary">
              ตรวจรับสินค้า
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mt-4">
        <h1 className="text-2xl font-semibold tracking-tight">ตรวจรับสินค้า</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          ตรวจรับสินค้าเข้าคลัง
        </p>
      </div>

      <Tabs
        value={tab}
        onValueChange={(v) => {
          setTab(v);
          setPage(1);
        }}
        className="mt-4 gap-4"
      >
        <TabsList className="w-full">
          <TabsTrigger value="pending" className="flex-1">
            รอตรวจสินค้า ({PENDING_DOCS.length})
          </TabsTrigger>
          <TabsTrigger value="done" className="flex-1">
            ตรวจสินค้าแล้ว ({DONE_DOCS.length > 99 ? "99+" : DONE_DOCS.length})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <InputGroup className="min-w-0 flex-1 bg-card">
          <InputGroupAddon align="inline-start">
            <SearchIcon />
          </InputGroupAddon>
          <InputGroupInput
            placeholder="ค้นหา..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
          />
        </InputGroup>
        <Input
          type="date"
          aria-label="วันที่"
          className="w-full bg-card tabular-nums @2xl:w-52"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <Button
          variant="outline-primary"
          size="icon"
          aria-label="ตัวกรอง"
          className="shrink-0"
        >
          <ListFilterIcon />
        </Button>
      </div>

      <div className="mt-4">
        {slice.length === 0 ? (
          <EmptyDocs title="ไม่พบใบตรวจสอบ" hint="ลองใช้คำค้นสั้นลง" />
        ) : (
          <>
            <ReceivingTable docs={slice} />
            <TablePager page={safe} pages={pages} onChange={setPage} />
          </>
        )}
      </div>
    </main>
  );
}

function ReceivingTable({ docs }: { docs: ReceivingDoc[] }) {
  const router = useRouter();

  return (
    <TableFrame>
      <Table>
        <TableHeader className={STICKY_HEAD}>
          <TableRow>
            <TableHead className={cn(HEAD_FIRST, "min-w-48")}>
              เลขที่ใบตรวจสอบ
            </TableHead>
            <TableHead className="min-w-32">สินค้า</TableHead>
            <TableHead className="min-w-64">บริษัท</TableHead>
            <TableHead className="min-w-32 text-right">รอตรวจสอบ</TableHead>
            <TableHead className="min-w-44">ผู้รับสินค้า</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {docs.map((d) => {
            const href = `/qc/goods-receiving/${d.id}`;
            return (
              <TableRow
                key={d.id}
                // ทั้งแถวกดได้ ไม่ใช่แค่ตัวเลขที่เป็นลิงก์
                onClick={() => router.push(href)}
                className="cursor-pointer"
              >
                <TableCell className={COL_FIRST}>
                  <Link href={href} className="font-medium hover:underline">
                    {d.code}
                  </Link>
                  <span className="block text-sm text-muted-foreground tabular-nums">
                    {d.createdAt}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="font-medium">{d.product}</span>
                  <span className="block text-sm text-muted-foreground">
                    {d.productNote}
                  </span>
                </TableCell>
                <TableCell className="text-sm">{d.supplier}</TableCell>
                <TableCell className="text-right tabular-nums whitespace-nowrap">
                  {d.ton.toLocaleString("th-TH", { minimumFractionDigits: 2 })}{" "}
                  ตัน
                </TableCell>
                <TableCell>
                  <span className="text-sm">{d.receiver}</span>
                  {/* ใครแก้ล่าสุดขึ้นเฉพาะใบที่เคยถูกแก้ ใบที่ยังไม่มีใครแตะไม่ต้องมีบรรทัดว่าง */}
                  {d.editor && (
                    <span className="block text-sm text-muted-foreground">
                      แก้ไขล่าสุด: {d.editor}
                    </span>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableFrame>
  );
}
