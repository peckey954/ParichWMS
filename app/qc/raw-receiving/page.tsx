"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CircleCheckIcon,
  CircleXIcon,
  ListFilterIcon,
  SearchIcon,
} from "lucide-react";
import { Badge } from "@peckey954/ui/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
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
import {
  DONE_DOCS,
  OUTCOME_CHIP,
  OUTCOME_LABEL,
  PENDING_DOCS,
  RAW_ITEMS,
  itemResult,
  outcomeOf,
  type RawDoc,
} from "@/lib/qc-raw-receiving";

/* ------------------------------------------------------------------
   ตรวจรับวัตถุดิบ — รายการใบที่รอตรวจกับที่ตรวจไปแล้ว

   สองแท็บเป็นสองกองงานคนละแบบ ไม่ใช่ตัวกรองของกองเดียวกัน
   ฝั่งรอตรวจคือคิวที่ต้องทำ ฝั่งตรวจแล้วคือของที่เอาไว้ย้อนดู

   คอลัมน์จึงคนละชุดด้วย ไม่ใช่ตารางเดียวที่ซ่อนคอลัมน์บางอัน
   ฝั่งรอตรวจอยากรู้ว่าใครส่งมา ของกี่ตัน ใครรับไว้ — ข้อมูลสำหรับ "หยิบไปทำ"
   ฝั่งตรวจแล้วอยากรู้ว่าแต่ละข้อผ่านไหม แล้วสรุปจบยังไง — ข้อมูลสำหรับ "ตามผล"
   ยัดลงตารางเดียวกันได้คอลัมน์ว่างครึ่งตารางทั้งสองฝั่ง
------------------------------------------------------------------ */

const PAGE_SIZE = 15;

export default function QcRawReceivingPage() {
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
            <BreadcrumbLink href="/">หน้าหลัก</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="text-primary">
              ตรวจรับวัตถุดิบ
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mt-4">
        <h1 className="text-2xl font-semibold tracking-tight">ตรวจรับวัตถุดิบ</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          ตรวจรับวัตถุดิบเข้าคลัง
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
            รอตรวจวัตถุดิบ ({PENDING_DOCS.length})
          </TabsTrigger>
          <TabsTrigger value="done" className="flex-1">
            ตรวจวัตถุดิบแล้ว ({DONE_DOCS.length > 99 ? "99+" : DONE_DOCS.length})
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
            {tab === "pending" ? (
              <PendingTable docs={slice} />
            ) : (
              <DoneTable docs={slice} />
            )}
            <TablePager page={safe} pages={pages} onChange={setPage} />
          </>
        )}
      </div>
    </main>
  );
}

// ---------------------------------------------------------------

const href = (d: RawDoc) => `/qc/raw-receiving/${d.id}`;

/** เลขที่ใบ + เวลา — คอลัมน์แรกของทั้งสองตาราง */
function CodeCell({ doc }: { doc: RawDoc }) {
  return (
    <TableCell className={COL_FIRST}>
      <Link href={href(doc)} className="font-medium hover:underline">
        {doc.code}
      </Link>
      <span className="block text-sm text-muted-foreground tabular-nums">
        {doc.createdAt}
      </span>
    </TableCell>
  );
}

function ProductCell({ doc }: { doc: RawDoc }) {
  return (
    <TableCell>
      <span className="font-medium">{doc.product}</span>
      <span className="block text-sm text-muted-foreground">
        {doc.productNote}
      </span>
    </TableCell>
  );
}

const fmtTon = (v: number) =>
  `${v.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ตัน`;

// ---------------------------------------------------------------

function PendingTable({ docs }: { docs: RawDoc[] }) {
  const router = useRouter();

  return (
    <TableFrame>
      <Table>
        <TableHeader className={STICKY_HEAD}>
          <TableRow>
            <TableHead className={cn(HEAD_FIRST, "min-w-48")}>
              เลขที่ใบตรวจสอบ
            </TableHead>
            <TableHead className="min-w-32">วัตถุดิบ</TableHead>
            <TableHead className="min-w-64">บริษัท</TableHead>
            <TableHead className="min-w-32 text-right">รอตรวจสอบ</TableHead>
            <TableHead className="min-w-44">ผู้รับสินค้า</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {docs.map((d) => (
            <TableRow
              key={d.id}
              // ทั้งแถวกดได้ ไม่ใช่แค่เลขที่ใบที่เป็นลิงก์
              onClick={() => router.push(href(d))}
              className={cn("cursor-pointer", ROW_HOVER_NAV)}
            >
              <CodeCell doc={d} />
              <ProductCell doc={d} />
              <TableCell className="text-sm">{d.supplier}</TableCell>
              <TableCell className="text-right tabular-nums whitespace-nowrap">
                {fmtTon(d.ton)}
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
          ))}
        </TableBody>
      </Table>
    </TableFrame>
  );
}

// ---------------------------------------------------------------

function DoneTable({ docs }: { docs: RawDoc[] }) {
  const router = useRouter();

  return (
    <TableFrame>
      <Table>
        <TableHeader className={STICKY_HEAD}>
          <TableRow>
            <TableHead className={cn(HEAD_FIRST, "min-w-48")}>
              เลขที่ใบตรวจสอบ
            </TableHead>
            <TableHead className="min-w-32">วัตถุดิบ</TableHead>
            <TableHead className="min-w-28 text-right">ตรวจสอบ</TableHead>
            {/* หัวคอลัมน์ผลรายข้อดึงชื่อมาจากโครงฟอร์ม ไม่ได้พิมพ์ซ้ำ
                แก้ชื่อข้อในฟอร์มแล้วหัวตารางต้องเปลี่ยนตาม ไม่งั้นสองที่จะไม่ตรงกัน */}
            {RAW_ITEMS.map((i) => (
              <TableHead key={i.id} className="min-w-28 text-center">
                ผล{i.title.replace("ตรวจสอบ", "")}
              </TableHead>
            ))}
            <TableHead className="min-w-40">หมายเหตุ</TableHead>
            <TableHead className={cn(HEAD_LAST, "min-w-32")}>
              ผลตรวจสอบ QC
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {docs.map((d) => {
            const outcome = outcomeOf(d);
            const notes = RAW_ITEMS.map((i) => d.result?.notes[i.id])
              .filter(Boolean)
              .join(" · ");
            return (
              <TableRow
                key={d.id}
                onClick={() => router.push(href(d))}
                className={cn("cursor-pointer", ROW_HOVER_NAV)}
              >
                <CodeCell doc={d} />
                <ProductCell doc={d} />
                <TableCell className="text-right tabular-nums whitespace-nowrap">
                  {fmtTon(d.ton)}
                </TableCell>
                {RAW_ITEMS.map((i) => (
                  <TableCell key={i.id} className="text-center">
                    <Mark
                      pass={
                        d.result ? itemResult(i, d.result.values).pass : null
                      }
                      title={i.title}
                    />
                  </TableCell>
                ))}
                <TableCell className="text-sm text-muted-foreground">
                  {notes || "-"}
                </TableCell>
                <TableCell className={COL_LAST}>
                  {outcome && (
                    <Badge
                      appearance="soft"
                      className={cn(
                        "[--bdg-border:transparent] font-semibold",
                        OUTCOME_CHIP[outcome]
                      )}
                    >
                      {OUTCOME_LABEL[outcome]}
                    </Badge>
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

/**
 * ผลของข้อหนึ่งในตาราง — วงกลมถูก/ผิดอย่างเดียว ไม่มีคำกำกับ
 *
 * ทั้งคอลัมน์เป็นคำถามเดียวกันซ้ำ ๆ หัวคอลัมน์บอกไปแล้วว่าถามอะไร
 * ใส่คำว่า "ผ่าน" ทุกช่องคือพิมพ์คำเดิมยี่สิบครั้งในหน้าจอเดียว
 * แต่เครื่องอ่านหน้าจอไม่เห็นสี จึงต้องมีคำอยู่ใน sr-only
 */
function Mark({ pass, title }: { pass: boolean | null; title: string }) {
  if (pass === null)
    return <span className="text-muted-foreground">-</span>;
  return pass ? (
    <>
      <CircleCheckIcon
        className="inline size-5 text-success-strong"
        aria-hidden
      />
      <span className="sr-only">{title} ผ่าน</span>
    </>
  ) : (
    <>
      <CircleXIcon className="inline size-5 text-danger-strong" aria-hidden />
      <span className="sr-only">{title} ไม่ผ่าน</span>
    </>
  );
}
