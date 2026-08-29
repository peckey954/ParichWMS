"use client";

import { useRouter } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@peckey954/ui/components/ui/breadcrumb";
import { Button } from "@peckey954/ui/components/ui/button";
import { toast } from "sonner";
import { CostSetup } from "@/components/production/cost-setup";

/* ------------------------------------------------------------------
   ตั้งค่าต้นทุน — ต้นทุนต่อถุงและราคาขายจริงของแต่ละสูตร

   คนละคำนวณกับหน้า "สูตรที่เหมาะสม" (ซึ่งใช้แค่ต้นทุน+ธาตุอาหารจากตั้งค่า
   ข้อมูล) แก้ที่นี่จึงไม่มีระบบร่าง/เผยแพร่แบบตั้งค่าข้อมูล บันทึกแล้วจบเลย
------------------------------------------------------------------ */

export default function RecipeCostSetupPage() {
  const router = useRouter();

  const handleSave = () => {
    toast.success("บันทึกข้อมูลต้นทุนแล้ว");
    router.back();
  };

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
              <BreadcrumbPage className="text-primary">ตั้งค่าต้นทุน</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="mt-2 flex flex-wrap items-start justify-between gap-3 sm:mt-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight">ตั้งค่าต้นทุน</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              ต้นทุนต่อถุงและราคาขายจริงของแต่ละสูตร
            </p>
          </div>
        </div>

        <div className="mt-5">
          <CostSetup />
        </div>
      </main>

      {/* ---------- แถบปุ่มล่าง ---------- */}
      <div className="sticky bottom-0 z-30 border-t border-border bg-surface">
        <div className="flex w-full items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Button variant="outline-primary" onClick={() => router.back()}>
            ย้อนกลับ
          </Button>
          <Button onClick={handleSave}>บันทึก</Button>
        </div>
      </div>
    </>
  );
}
