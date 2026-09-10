"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { RotateCcwIcon } from "lucide-react";
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
   แถบปุ่มล่างของหน้าตั้งค่า — ย้อนกลับ / คืนค่าเริ่มต้น / บันทึก

   สามหน้าย่อยของ /pr/setup ใช้แถบเดียวกันหมด แยกออกมาเพื่อไม่ต้องก็อป
   โครง sticky กับการแยกจอแคบ/กว้างซ้ำสามรอบ แล้วแก้ไม่ครบทีหลัง

   จอแคบ: คืนค่าเริ่มต้นขึ้นบรรทัดบนและโผล่เฉพาะตอนมีอะไรให้คืนจริง ๆ
   ไม่งั้นสามปุ่มเบียดกันจนกดพลาด
------------------------------------------------------------------ */

export function SetupFooter({
  dirty,
  onReset,
  onSave,
}: {
  dirty: boolean;
  onReset: () => void;
  onSave: () => void;
}) {
  const router = useRouter();

  return (
    <div className="sticky bottom-0 z-30 border-t border-border bg-surface">
      <div className="mx-auto w-full max-w-7xl px-4 py-3 sm:px-8">
        <div className="flex flex-col gap-3 @lg:hidden">
          {dirty && (
            <Button variant="outline-primary" className="w-full" onClick={onReset}>
              <RotateCcwIcon />
              คืนค่าเริ่มต้น
            </Button>
          )}
          <div className="flex items-center gap-3">
            <Button
              variant="outline-primary"
              className="flex-1"
              onClick={() => router.back()}
            >
              ย้อนกลับ
            </Button>
            <Button className="flex-1" onClick={onSave}>
              บันทึก
            </Button>
          </div>
        </div>

        <div className="hidden items-center justify-between gap-3 @lg:flex">
          <Button variant="outline-primary" onClick={() => router.back()}>
            ย้อนกลับ
          </Button>
          <div className="flex items-center gap-3">
            <Button variant="outline-primary" disabled={!dirty} onClick={onReset}>
              <RotateCcwIcon />
              คืนค่าเริ่มต้น
            </Button>
            <Button onClick={onSave}>บันทึก</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Breadcrumb ของสามหน้าย่อย ต่างกันแค่ชื่อหน้าสุดท้าย */
export function SetupCrumbs({ page }: { page: string }) {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/">ระบบ</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink href="/pr">ขอซื้อ PR</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink href="/pr/setup">ตั้งค่าใบขอซื้อ</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage className="text-primary">{page}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
