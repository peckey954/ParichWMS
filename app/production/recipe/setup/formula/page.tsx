"use client";

import { useRouter } from "next/navigation";
import { PackageIcon } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@peckey954/ui/components/ui/breadcrumb";
import { Button } from "@peckey954/ui/components/ui/button";

/* ------------------------------------------------------------------
   ตั้งค่าสูตร — ยังเป็นโครงไว้ก่อน รอสรุปรายละเอียดทีหลัง

   รายการสินค้าที่ผลิต ขนาดบรรจุ และการเคลือบของแต่ละสูตร
   (เดิมเป็นแท็บ "ตั้งค่า SKU" ในหน้าตั้งค่าสูตรรวม แยกออกมาเป็นหน้าของตัวเอง)
------------------------------------------------------------------ */

const PLANNED = [
  "รายการ SKU ทั้งหมด แยกตามกลุ่มสูตร",
  "ขนาดบรรจุ และชนิดกระสอบ",
  "เคลือบ Nitro / เคลือบ Power ของแต่ละ SKU",
  "เปิด–ปิดการใช้งาน SKU โดยไม่ต้องลบทิ้ง",
];

export default function RecipeFormulaSetupPage() {
  const router = useRouter();

  return (
    <>
      <main className="mx-auto w-full max-w-7xl px-4 pt-3 pb-24 sm:px-6 sm:pt-5">
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
              <BreadcrumbLink href="/production/recipe/optimized">
                สูตรที่เหมาะสม
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
              รายการสินค้าที่ผลิต ขนาดบรรจุ และการเคลือบของแต่ละสูตร
            </p>
          </div>
        </div>

        <div className="mt-5 rounded-xl border border-border bg-card p-5">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand text-primary">
              <PackageIcon className="size-5" />
            </span>
            <div className="min-w-0">
              <h2 className="font-semibold">ตั้งค่าสูตร</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                รายการสินค้าที่ผลิต ขนาดบรรจุ และการเคลือบของแต่ละสูตร
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-lg border border-dashed border-border p-4">
            <p className="text-sm font-medium">หน้านี้จะมี</p>
            <ul className="mt-2 space-y-1.5">
              {PLANNED.map((line) => (
                <li
                  key={line}
                  className="flex gap-2 text-sm text-muted-foreground before:mt-2 before:size-1.5 before:shrink-0 before:rounded-full before:bg-border"
                >
                  {line}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </main>

      {/* ---------- แถบปุ่มล่าง ---------- */}
      <div className="sticky bottom-0 z-30 border-t border-border bg-surface">
        <div className="flex w-full items-center px-8 py-3">
          <Button variant="outline-primary" onClick={() => router.back()}>
            ย้อนกลับ
          </Button>
        </div>
      </div>
    </>
  );
}
