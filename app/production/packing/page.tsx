"use client";

import * as React from "react";
import {
  ArrowUpFromLineIcon,
  BrushCleaningIcon,
  DownloadIcon,
  LightbulbIcon,
} from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@peckey954/ui/components/ui/breadcrumb";
import { Tabs, TabsList, TabsTrigger } from "@peckey954/ui/components/ui/tabs";
import { toast } from "sonner";
import { PackingCwip } from "@/components/production/packing-cwip";
import { PackingOrders } from "@/components/production/packing-orders";
import {
  PackingToolbar,
  type TabAction,
} from "@/components/production/packing-toolbar";
import {
  CWIP_PRODUCTS,
  DONE_ORDERS,
  WAITING_ORDERS,
  matchesCwip,
  matchesOrder,
} from "@/lib/packing-list";

/* ------------------------------------------------------------------
   รายการผลิตแบ่งบรรจุ

   ปุ่มคำสั่งของแต่ละแท็บอยู่ใต้แถบแท็บ ไม่ใช่ข้างชื่อหน้า
   เพราะปุ่มพวกนี้ใช้ได้เฉพาะแท็บที่เปิดอยู่ ตำแหน่งต้องบอกขอบเขตให้ตรง
   ถ้าไปวางข้างชื่อหน้า พอสลับแท็บแล้วปุ่มเปลี่ยน แถบหัวจะกระตุก
   และมุมขวาบนจะกลายเป็นตำแหน่งที่มีปุ่มคนละตัวในแต่ละแท็บ เสี่ยงกดผิด

   ข้างชื่อหน้าเหลือไว้ให้ปุ่มที่ใช้ได้ทุกแท็บเท่านั้น ตอนนี้ยังไม่มี
------------------------------------------------------------------ */

type Tab = "waiting" | "cwip" | "done";

export default function PackingListPage() {
  const [tab, setTab] = React.useState<Tab>("waiting");
  const [query, setQuery] = React.useState("");

  const waiting = WAITING_ORDERS.filter((o) => matchesOrder(o, query));
  const done = DONE_ORDERS.filter((o) => matchesOrder(o, query));
  const cwip = CWIP_PRODUCTS.filter((p) => matchesCwip(p, query));

  const soon = (what: string) => toast.info(what, { description: "ยังไม่ได้ต่อกับหลังบ้าน" });

  /*
   * ปุ่มของแต่ละแท็บ
   *
   * ส่งออก CSV ตั้ง desktopOnly ไว้ — โหลดไฟล์ลงมือถือแล้วเปิดต่อไม่สะดวก
   * ไม่ใช่ทุกคำสั่งต้องมีครบทุกขนาดจอ
   */
  const ACTIONS: Record<Tab, TabAction[]> = {
    waiting: [
      {
        id: "suggest",
        label: "แนะนำวัตถุดิบที่ใช้วันนี้",
        // หลอดไฟ = ข้อเสนอแนะ อ่านง่ายและไม่ติดภาพ AI แบบไอคอนประกาย
        icon: LightbulbIcon,
        primary: true,
        onSelect: () => soon("แนะนำวัตถุดิบที่ใช้วันนี้"),
      },
    ],
    cwip: [
      {
        id: "csv",
        label: "ส่งออก CSV",
        icon: DownloadIcon,
        desktopOnly: true,
        onSelect: () => soon("ส่งออก CSV"),
      },
      {
        id: "sweep",
        label: "รายงานกวาดพื้น",
        icon: BrushCleaningIcon,
        onSelect: () => soon("รายงานกวาดพื้น"),
      },
      {
        id: "issue",
        label: "เบิกจากคลัง",
        icon: ArrowUpFromLineIcon,
        primary: true,
        onSelect: () => soon("เบิกจากคลัง"),
      },
    ],
    done: [
      {
        id: "csv",
        label: "ส่งออก CSV",
        icon: DownloadIcon,
        desktopOnly: true,
        onSelect: () => soon("ส่งออก CSV"),
      },
    ],
  };

  const PLACEHOLDER: Record<Tab, string> = {
    waiting: "ค้นหาเลขที่ใบผลิต หรือสูตร...",
    cwip: "ค้นหาสินค้า เลขล็อต หรือโซน...",
    done: "ค้นหาเลขที่ใบผลิต หรือสูตร...",
  };

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 sm:py-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">ระบบ</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="text-primary">
              ผลิตแบ่งบรรจุ
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mt-2 sm:mt-3">
        <h1 className="text-2xl font-semibold tracking-tight">ผลิตแบ่งบรรจุ</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          ผลิตสินค้า ไลน์กลาง แบ่งบรรจุ
        </p>
      </div>

      <Tabs
        value={tab}
        onValueChange={(v) => setTab(v as Tab)}
        className="mt-4 sm:mt-5"
      >
        <TabsList className="w-full">
          <TabsTrigger value="waiting" className="flex-1">
            รอผลิต ({WAITING_ORDERS.length})
          </TabsTrigger>
          <TabsTrigger value="cwip" className="flex-1">
            สต็อก CWIP ({CWIP_PRODUCTS.length})
          </TabsTrigger>
          <TabsTrigger value="done" className="flex-1">
            ผลิตแล้ว ({DONE_ORDERS.length})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="mt-3">
        <PackingToolbar
          query={query}
          onQuery={setQuery}
          placeholder={PLACEHOLDER[tab]}
          actions={ACTIONS[tab]}
          onFilter={() => soon("ตัวกรอง")}
        />
      </div>

      <div className="mt-3">
        {tab === "waiting" && (
          <PackingOrders orders={waiting} emptyTitle="ไม่พบใบผลิตที่รออยู่" />
        )}
        {tab === "cwip" && <PackingCwip products={cwip} />}
        {tab === "done" && (
          <PackingOrders orders={done} emptyTitle="ไม่พบใบผลิตที่ผลิตแล้ว" />
        )}
      </div>
    </main>
  );
}
