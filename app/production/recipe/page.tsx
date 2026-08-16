"use client";

import * as React from "react";
import Link from "next/link";
import { ListFilterIcon, SearchIcon, Settings2Icon } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@peckey954/ui/components/ui/breadcrumb";
import { Button } from "@peckey954/ui/components/ui/button";
import { cn } from "@peckey954/ui/lib/utils";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@peckey954/ui/components/ui/input-group";
import {
  BackToTop,
  StickyToolbar,
  useStickyToolbar,
} from "@/components/sticky-toolbar";
import { RecipeTable } from "@/components/production/recipe-table";
import {
  RECIPES,
  RECIPE_UPDATED_AT,
  RECIPE_VIEWS,
  matchesRecipe,
  type RecipeView,
} from "@/lib/recipe";

export default function WeeklyRecipePage() {
  const [query, setQuery] = React.useState("");
  const [view, setView] = React.useState<RecipeView>("material");
  const visible = RECIPES.filter((r) => matchesRecipe(r, query));
  // แถบค้นหา+ชิปล็อกติดบนตลอด แบบเดียวกับหน้าสต็อกทั่วไป
  const { showTop, scrollToTop, barRef } = useStickyToolbar();

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-3 sm:px-6 sm:py-5">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">ระบบ</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="text-primary">
              สูตรผลิตประจำสัปดาห์
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* ไม่ใช้ flex-wrap ปุ่มจะได้อยู่แถวเดียวกับชื่อหน้าเสมอ ไม่ตกลงไปข้างล่าง
          ชื่อหน้าใช้ชื่อสั้นบนจอแคบอยู่แล้ว จึงไม่เบียดกัน */}
      <div className="mt-2 flex items-start justify-between gap-3 sm:mt-3">
        <div className="min-w-0">
          {/* จอแคบใช้ชื่อสั้น ชื่อเต็มยาวจนดันปุ่มตกบรรทัด */}
          <h1 className="text-2xl font-semibold tracking-tight">
            <span className="@3xl:hidden">สูตรการผลิต</span>
            <span className="hidden @3xl:inline">สูตรการผลิตประจำสัปดาห์</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            แนะนำสูตรการผลิตประจำสัปดาห์ อัปเดตล่าสุด {RECIPE_UPDATED_AT}
          </p>
        </div>

        {/* พาไปหน้าผลคำนวณก่อน ไม่ใช่หน้าแก้ข้อมูล
            คนเปิดมาเพื่อ "ดู" บ่อยกว่ามาแก้ และหน้าแก้มีช่องกรอกห้าร้อยกว่าช่อง
            กดพลาดเข้าไปแล้วเผลอพิมพ์ทับได้ ส่วนหน้าผลลัพธ์ดูอย่างเดียว ไม่เสียหาย
            ชื่อปุ่มบอกสิ่งที่จะได้ ไม่ใช่ "ตั้งค่า" ซึ่งสัญญาว่าจะได้หน้าแก้ไข */}
        <Button asChild variant="outline-primary" className="shrink-0">
          <Link href="/production/recipe/optimized">
            <Settings2Icon className="hidden @3xl:inline" />
            <span className="@3xl:hidden">สูตรที่เหมาะสม</span>
            <span className="hidden @3xl:inline">ดูสูตรที่เหมาะสม</span>
          </Link>
        </Button>
      </div>

      {/* ค้นหากับชิปอยู่ในแถบเดียวกัน ล็อกติดบนตลอด
          เหมือนหน้าสต็อกทั่วไป — รายการยาว 53 สูตร ถ้าเครื่องมืออยู่บนสุดอย่างเดียว
          เลื่อนลงไปแล้วจะสลับมุมมองไม่ได้ ต้องลากกลับขึ้นไปทั้งหน้า */}
      <StickyToolbar barRef={barRef}>
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
          <Button
            variant="outline-primary"
            size="icon"
            aria-label="ตัวกรองสูตรการผลิต"
            className="shrink-0"
          >
            <ListFilterIcon />
          </Button>
        </div>

        {/* ---------- เลือกชุดข้อมูลที่จะดู ----------
             ข้อมูลเต็มมี 20 คอลัมน์ ไม่มีใครใช้พร้อมกัน
             สลับที่ระดับหน้า ไม่ใช่พับ/กางทีละแถว เพราะคนคิดแบบ
             "วันนี้ฉันดูน้ำหนัก" ไม่ใช่ "แถวนี้ดูน้ำหนัก แถวหน้าดูธาตุอาหาร"

             ใช้ชิปกลมแบบเดียวกับชิปประเภทสินค้าในหน้าสต็อก
             จอแคบป้ายกำกับขึ้นบรรทัดของตัวเอง ชิปจะได้ไม่ถูกบีบ */}
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
          <p className="text-sm text-muted-foreground">
            การดูข้อมูลทั้งหมด ({visible.length} สูตร):
          </p>
          <div role="radiogroup" aria-label="ชุดข้อมูลที่แสดง" className="flex flex-wrap gap-2">
            {RECIPE_VIEWS.map((v) => {
              const on = view === v.id;
              return (
                <button
                  key={v.id}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => setView(v.id)}
                  className={cn(
                    "shrink-0 rounded-full border px-3 py-1 text-sm whitespace-nowrap transition-colors",
                    "focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
                    on
                      ? "border-primary bg-brand font-medium text-primary"
                      : "border-border text-foreground hover:bg-accent-hover"
                  )}
                >
                  {v.short}
                </button>
              );
            })}
          </div>
        </div>
      </StickyToolbar>

      <div className="mt-3">
        <RecipeTable rows={visible} view={view} />
      </div>

      <div className="mt-6">
        <Button asChild variant="outline-primary">
          <Link href="/">ย้อนกลับ</Link>
        </Button>
      </div>

      <BackToTop show={showTop} onClick={scrollToTop} />
    </main>
  );
}
