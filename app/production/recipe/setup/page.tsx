"use client";

import * as React from "react";
import Link from "next/link";
import {
  CoinsIcon,
  PackageIcon,
  SlidersHorizontalIcon,
} from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@peckey954/ui/components/ui/breadcrumb";
import { Button } from "@peckey954/ui/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@peckey954/ui/components/ui/tabs";
import { cn } from "@peckey954/ui/lib/utils";
import { CostSetup } from "@/components/production/cost-setup";
import { InputSetup } from "@/components/production/input-setup";

/* ------------------------------------------------------------------
   ตั้งค่าสูตรการผลิต — วางโครงไว้ก่อน รายละเอียดของแต่ละหน้ารอสรุปทีหลัง

   สามหน้านี้คือต้นทางของตัวเลขในตารางสูตรประจำสัปดาห์
   Input = เงื่อนไข/ข้อจำกัดที่ใช้คำนวณ
   SKU   = รายการสินค้าและสเปกของแต่ละสูตร
   Cost  = ต้นทุนวัตถุดิบที่ใช้หาสูตรที่คุ้มที่สุด
------------------------------------------------------------------ */

type SetupTab = "input" | "sku" | "cost";

const TABS: {
  id: SetupTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  purpose: string;
  /** สิ่งที่หน้านี้จะมี รอยืนยันรายละเอียดอีกที */
  planned: string[];
}[] = [
  {
    id: "input",
    label: "Input ข้อมูล",
    icon: SlidersHorizontalIcon,
    purpose:
      "ต้นทุนและค่าธาตุอาหารของวัตถุดิบ กด RUN แล้วระบบจะคำนวณสูตรที่คุ้มที่สุดให้",
    planned: [],
  },
  {
    id: "sku",
    label: "ตั้งค่า SKU",
    icon: PackageIcon,
    purpose: "รายการสินค้าที่ผลิต ขนาดบรรจุ และการเคลือบของแต่ละสูตร",
    planned: [
      "รายการ SKU ทั้งหมด แยกตามกลุ่มสูตร",
      "ขนาดบรรจุ และชนิดกระสอบ",
      "เคลือบ Nitro / เคลือบ Power ของแต่ละ SKU",
      "เปิด–ปิดการใช้งาน SKU โดยไม่ต้องลบทิ้ง",
    ],
  },
  {
    id: "cost",
    label: "ตั้งค่าต้นทุน",
    icon: CoinsIcon,
    purpose:
      "ต้นทุนต่อถุงและราคาขายจริงของแต่ละสูตร ค่าที่เหมือนกันทุกสูตรแก้ครั้งเดียวจบ",
    planned: [],
  },
];

export default function RecipeSetupPage() {
  const [tab, setTab] = React.useState<SetupTab>("input");
  const active = TABS.find((t) => t.id === tab)!;

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-3 sm:px-6 sm:py-5">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">ระบบ</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/production/recipe">
              สูตรผลิตประจำสัปดาห์
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="text-primary">ตั้งค่าสูตร</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mt-2 flex flex-wrap items-start justify-between gap-3 sm:mt-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">ตั้งค่าสูตร</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            ต้นทางของตัวเลขในตารางสูตรประจำสัปดาห์ แก้ที่นี่แล้วสั่งคำนวณใหม่
          </p>
        </div>
      </div>

      <Tabs
        value={tab}
        onValueChange={(v) => setTab(v as SetupTab)}
        className="mt-5"
      >
        <TabsList className="w-full">
          {TABS.map((t) => (
            <TabsTrigger key={t.id} value={t.id} className="flex-1">
              <t.icon className="size-4" />
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {tab === "input" && (
        <div className="mt-4">
          <InputSetup />
        </div>
      )}

      {tab === "cost" && (
        <div className="mt-4">
          <CostSetup />
        </div>
      )}

      {/* แท็บ SKU ยังเป็นโครง บอกไว้ตรง ๆ ว่าจะมีอะไร
          จะได้คุยกันได้ว่าตกอะไรไปก่อนจะลงมือทำจริง */}
      {tab === "sku" && (
      <div className="mt-4 rounded-xl border border-border bg-card p-5">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand text-primary">
            <active.icon className="size-5" />
          </span>
          <div className="min-w-0">
            <h2 className="font-semibold">{active.label}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {active.purpose}
            </p>
          </div>
        </div>

        <div className="mt-5 rounded-lg border border-dashed border-border p-4">
          <p className="text-sm font-medium">หน้านี้จะมี</p>
          <ul className="mt-2 space-y-1.5">
            {active.planned.map((line) => (
              <li
                key={line}
                className={cn(
                  "flex gap-2 text-sm text-muted-foreground",
                  "before:mt-2 before:size-1.5 before:shrink-0 before:rounded-full before:bg-border"
                )}
              >
                {line}
              </li>
            ))}
          </ul>
        </div>

      </div>
      )}

      <div className="mt-6">
        <Button asChild variant="outline-primary">
          <Link href="/production/recipe">ย้อนกลับ</Link>
        </Button>
      </div>
    </main>
  );
}
