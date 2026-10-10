"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckIcon, FlaskConicalIcon, SearchIcon } from "lucide-react";
import { Badge } from "@peckey954/ui/components/ui/badge";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@peckey954/ui/components/ui/alert";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@peckey954/ui/components/ui/breadcrumb";
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
import { ROW_HOVER_NAV } from "@/components/stock/doc-parts";
import {
  LOTS,
  checkpointsOfQueue,
  currentCheckpoint,
  demoTemplate,
  pendingCount,
  type Lot,
} from "@/lib/qc-production-demo";

/* ------------------------------------------------------------------
   คิวตรวจของใบสั่งผลิต — หนึ่งแถวต่อหนึ่งใบ ไม่ใช่หนึ่งแถวต่อหนึ่งขั้น

   สามขั้นอ้างใบสั่งผลิตใบเดียวกัน แตกเป็นสามแถวแล้วจะได้เลขซ้ำสามรอบ
   ซึ่งกวาดตาแล้วแยกไม่ออกว่าอันไหนคืออันไหน รวมเป็นแถวเดียวแล้วเอาขั้นมา
   เป็นชิปในแถว ได้ทั้งตัวตนของใบและความคืบหน้าในบรรทัดเดียว

   ชิปเรียงตามลำดับจริงและกดได้ทีละอัน ขั้นที่ยังไม่ถึงคิวกดไม่ได้ —
   ตรวจหลังผลิตทั้งที่ยังไม่ได้ตรวจก่อนผลิตคือตรวจของที่ยังไม่มี

   ขั้นมาจาก tpl.stages ของเทมเพลตจริง ไม่ได้ตั้งซ้ำไว้ที่นี่
------------------------------------------------------------------ */

export default function ProductionCheckPage() {
  const router = useRouter();
  const [tab, setTab] = React.useState("pending");
  const [query, setQuery] = React.useState("");

  const tpl = demoTemplate();
  const points = checkpointsOfQueue();

  const q = query.trim().toLowerCase();
  const rows = LOTS.filter((l) => {
    const open = currentCheckpoint(l) !== null;
    if (tab === "pending" ? !open : open) return false;
    return (
      q === "" ||
      l.code.toLowerCase().includes(q) ||
      l.material.toLowerCase().includes(q) ||
      l.product.toLowerCase().includes(q)
    );
  });

  return (
    <main className="@container mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage className="text-primary">
              ตรวจสอบสินค้าสำเร็จรูป
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <h1 className="mt-3 text-2xl font-semibold tracking-tight">
        ตรวจสอบสินค้าสำเร็จรูป
      </h1>
      {/* บอกว่าเมนูนี้เดินตามเทมเพลตไหน ไม่งั้นพอหัวข้อตรวจเปลี่ยนจะหาไม่เจอ
          ว่าไปแก้ที่ไหน */}
      <p className="mt-1 text-sm text-muted-foreground">
        เดินตามเทมเพลต{" "}
        <Link
          href="/qc/setup-erp/t-inproc"
          className="text-primary underline underline-offset-2"
        >
          {tpl?.name ?? "—"}
        </Link>{" "}
        · {points.length} จุดตรวจ · {tpl?.rows.length ?? 0} หัวข้อต่อขั้น
      </p>

      <Alert className="mt-4">
        <FlaskConicalIcon />
        <AlertTitle>หน้านี้เป็นตัวอย่าง ไม่ได้ต่อกับข้อมูลจริง</AlertTitle>
        <AlertDescription>
          ขั้นที่ต้องตรวจอ่านมาจากเทมเพลตจริง เพิ่มหรือลดจุดในหน้าตั้งค่าแล้ว
          ชิปในตารางนี้เปลี่ยนตามทันที
        </AlertDescription>
      </Alert>

      <Tabs value={tab} onValueChange={setTab} className="mt-5">
        <TabsList className="w-full">
          {/* นับเป็น "ใบที่ยังมีงานค้าง" ไม่ใช่ "จำนวนขั้นที่ค้าง" เพราะตารางนี้
              หนึ่งแถวคือหนึ่งใบ ตัวเลขบนแท็บกับจำนวนแถวต้องตรงกัน */}
          <TabsTrigger value="pending" className="flex-1">
            รอตรวจ ({pendingCount()})
          </TabsTrigger>
          <TabsTrigger value="done" className="flex-1">
            ตรวจครบแล้ว ({LOTS.length - pendingCount()})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <InputGroup className="mt-4 w-full max-w-sm bg-card">
        <InputGroupAddon align="inline-start">
          <SearchIcon />
        </InputGroupAddon>
        <InputGroupInput
          placeholder="ค้นหาเลขที่ใบผลิตหรือวัตถุดิบ..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </InputGroup>

      <div className="mt-4 overflow-x-auto rounded-xl border border-border bg-card">
        <Table className="min-w-[980px]">
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-44">เลขที่ใบผลิต</TableHead>
              <TableHead className="min-w-24">ไลน์ผลิต</TableHead>
              <TableHead className="min-w-20">รอบ</TableHead>
              <TableHead className="min-w-32">วัตถุดิบ</TableHead>
              <TableHead className="min-w-28">รอตรวจสอบ</TableHead>
              <TableHead className="min-w-44">สถานะ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((lot) => (
              <TableRow
                key={lot.id}
                className={cn("cursor-pointer", ROW_HOVER_NAV)}
                onClick={() => router.push(`/qc/production-check/${lot.id}`)}
              >
                <TableCell>
                  <span className="font-medium">{lot.code}</span>
                  <span className="block text-sm text-muted-foreground">
                    {lot.createdAt}
                  </span>
                </TableCell>
                <TableCell>{lot.line}</TableCell>
                <TableCell>{lot.round}</TableCell>
                <TableCell>
                  <span>{lot.material}</span>
                  <span className="block text-sm text-muted-foreground">
                    {lot.materialNote}
                  </span>
                </TableCell>
                <TableCell className="tabular-nums">
                  {lot.ton.toFixed(2)} ตัน
                </TableCell>
                <TableCell>
                  <StageStatus lot={lot} />
                </TableCell>
              </TableRow>
            ))}

            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-14 text-center">
                  <p className="font-medium">ไม่มีข้อมูล</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {tab === "pending"
                      ? "ไม่มีใบที่รอตรวจ"
                      : "ยังไม่มีใบที่ตรวจครบทุกขั้น"}
                  </p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <p className="mt-3 text-sm text-muted-foreground">
        ✓ ตรวจแล้ว · ● ถึงคิวแล้ว กดเพื่อตรวจ · ○ ยังไม่ถึงคิว
      </p>
    </main>
  );
}

/* ------------------------------------------------------------------
   สถานะของใบ — โชว์เฉพาะจุดที่รอทำอยู่ จุดเดียว

   เคยโชว์ทุกจุดเป็นชิปเรียงกัน ซึ่งบอกความคืบหน้าได้ดีแต่ทำให้ตารางอ่านยาก
   เพราะแต่ละแถวมีของให้กวาดตาสี่ชิ้นทั้งที่ทำได้ทีละชิ้น คิวคือรายการงาน
   ที่ต้องทำตอนนี้ ไม่ใช่รายงานความคืบหน้า — ความคืบหน้าทั้งใบดูในหน้าใบ

   สถานะอ่านจากผลที่บันทึกไว้ ไม่ได้เก็บแยก
------------------------------------------------------------------ */

function StageStatus({ lot }: { lot: Lot }) {
  const open = currentCheckpoint(lot);

  if (!open)
    return (
      <Badge appearance="soft" tone="success">
        <CheckIcon className="size-3.5" />
        ตรวจครบแล้ว
      </Badge>
    );

  // ชื่อจุดอย่างเดียวพอ ขึ้นต้นว่า "รอตรวจ" ทุกแถวแล้วอ่านซ้ำโดยไม่ได้อะไรเพิ่ม
  // แต่คอลัมน์ชื่อสถานะ จึงต้องมีคำว่ารออยู่ ไม่งั้นอ่านเป็นชื่อขั้นเฉย ๆ
  return (
    <Badge appearance="soft" tone="warning">
      รอตรวจ{open.operation ?? open.label}
    </Badge>
  );
}

