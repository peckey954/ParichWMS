"use client";

import * as React from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@peckey954/ui/components/ui/breadcrumb";
import { SystemSettings } from "@/components/qc/system-settings";
import { DEFAULT_GUARD, type StockGuard } from "@/lib/qc-erp";

/* ตั้งค่าระบบของการตรวจคุณภาพ — มาจากปุ่มตั้งค่าระบบที่หัวหน้ารายการรายงาน */
export default function QcSystemSettingsPage() {
  const [guard, setGuard] = React.useState<StockGuard>(DEFAULT_GUARD);
  // ทะเบียนกลางเป็นอาเรย์ในโมดูล ไม่ได้อยู่ใน state — แก้แล้วต้องสั่งวาดใหม่เอง
  const [, bump] = React.useReducer((n: number) => n + 1, 0);

  return (
    <main className="@container mx-auto w-full max-w-5xl px-4 py-6 sm:px-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">หน้าหลัก</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/qc/setup-erp">ตั้งค่ารายงาน</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="text-primary">ตั้งค่าระบบ</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <h1 className="mt-4 text-2xl font-semibold tracking-tight">ตั้งค่าระบบ</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        ค่าที่ใช้ร่วมกันทุกรายงาน — การบังคับใช้กับการรับ–จ่ายของ ทะเบียนหัวข้อตรวจ
        และตัวเลือกจัดการของที่ไม่ผ่าน
      </p>

      <SystemSettings guard={guard} onChange={setGuard} onParamsChanged={bump} />
    </main>
  );
}
