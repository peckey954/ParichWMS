"use client";

import * as React from "react";
import Link from "next/link";
import { CalendarIcon, ListFilterIcon, SearchIcon } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@peckey954/ui/components/ui/breadcrumb";
import { Button } from "@peckey954/ui/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@peckey954/ui/components/ui/input-group";
import { Tabs, TabsList, TabsTrigger } from "@peckey954/ui/components/ui/tabs";
import { useScrollState } from "@/components/device-preview";
import { BackToTop, StickyToolbar } from "@/components/sticky-toolbar";
import { WeighingList } from "@/components/weighing/weighing-list";
import { matchesWeighing, WEIGHING_DOCS } from "@/lib/weighing";

/* ------------------------------------------------------------------
   ชั่งน้ำหนัก — หน้ารายการ ชั้นบนสุดของสามชั้น
   รายการนี้ → กดแล้วไปใบชั่งน้ำหนักของ PO นั้น (รวมทุกรอบที่รถเข้ามาชั่ง)
   → กด "เพิ่มการชั่งน้ำหนัก" ในหน้านั้นอีกทีถึงจะเป็นฟอร์มกรอกชั่งจริง

   สองแท็บ รอชั่ง/ชั่งแล้ว ไม่มีชิปย่อยใต้แท็บเหมือนหน้าสต็อกทั่วไป จึงไม่ต้อง
   เลื่อนจอตอนสลับแท็บ (scrollIntoTop) — สลับแท็บใหญ่ต้องเป็นแค่การสลับข้อมูล
   เฉยๆ ไม่ขยับจอ ตามมาตรฐานเดียวกับแท็บ สต็อก/รอรับเข้า/รอจ่าย-คืน
------------------------------------------------------------------ */

export default function WeighingListPage() {
  const { hidden, showTop, scrollToTop, armScrollGuard, releaseScrollGuard } =
    useScrollState();
  const stickyRef = React.useRef<HTMLDivElement>(null);

  const [tab, setTab] = React.useState<"pending" | "weighed">("pending");
  const [query, setQuery] = React.useState("");

  const pendingDocs = React.useMemo(
    () => WEIGHING_DOCS.filter((d) => d.status === "pending"),
    []
  );
  const weighedDocs = React.useMemo(
    () => WEIGHING_DOCS.filter((d) => d.status === "weighed"),
    []
  );
  const visible = (tab === "pending" ? pendingDocs : weighedDocs).filter((d) =>
    matchesWeighing(d, query)
  );

  return (
    <main className="mx-auto w-full max-w-7xl">
      <div>
        <div className="px-4 py-3 sm:px-6 sm:py-5">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">ระบบ</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-primary">ชั่งน้ำหนัก</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {/* ปุ่มไปต้นแบบ Ver 2 — จุดเดียวในแอปที่ลิงก์ไปหน้านั้น (ตั้งใจไม่ผูก
              เข้ากับ flow เดิมทั้งระบบ แค่ให้กดเข้าไปดู/ทดลองได้จากตรงนี้) */}
          <div className="mt-2 flex flex-wrap items-start justify-between gap-3 sm:mt-3">
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold tracking-tight">ชั่งน้ำหนัก</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                จัดการเอกสารชั่งน้ำหนักรถและสินค้า
              </p>
            </div>
            <Button asChild variant="outline-primary" size="sm" className="shrink-0">
              <Link href="/weighing/v2">ลองดูต้นแบบ Ver 2</Link>
            </Button>
          </div>

          <Tabs
            value={tab}
            onPointerDownCapture={armScrollGuard}
            onValueChange={(v) => {
              setTab(v as typeof tab);
              releaseScrollGuard();
            }}
            className="mt-4 sm:mt-5"
          >
            <TabsList className="w-full">
              <TabsTrigger value="pending" className="flex-1">
                รอชั่งน้ำหนัก ({pendingDocs.length})
              </TabsTrigger>
              <TabsTrigger value="weighed" className="flex-1">
                ชั่งน้ำหนักแล้ว ({weighedDocs.length})
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <StickyToolbar hidden={hidden} barRef={stickyRef}>
            <div className="flex items-center gap-2 pt-2">
              <InputGroup className="min-w-0 flex-1 bg-card">
                <InputGroupAddon align="inline-start">
                  <SearchIcon />
                </InputGroupAddon>
                <InputGroupInput
                  placeholder="ค้นหา..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </InputGroup>
              {/* ยังไม่มีตัวเลือกช่วงวันที่ในระบบ — ช่องนี้เป็นเลย์เอาต์ตามแบบไว้ก่อน
                  เหมือนปุ่มตัวกรองข้างๆ ที่ยังไม่ผูกเงื่อนไขจริงในหน้ารอรับเข้า/รอจ่าย-คืน */}
              <InputGroup className="hidden w-48 shrink-0 bg-card @lg:flex">
                <InputGroupAddon align="inline-start">
                  <CalendarIcon />
                </InputGroupAddon>
                <InputGroupInput readOnly placeholder="วันที่" />
              </InputGroup>
              <Button
                variant="outline-primary"
                size="icon"
                aria-label="ตัวกรองใบชั่งน้ำหนัก"
                className="shrink-0"
              >
                <ListFilterIcon />
              </Button>
            </div>
          </StickyToolbar>

          <div
            key={tab}
            className="mt-4 animate-in slide-in-from-bottom-3 fade-in duration-300"
          >
            <WeighingList docs={visible} />
          </div>

          <BackToTop show={showTop} onClick={scrollToTop} />
        </div>
      </div>
    </main>
  );
}
