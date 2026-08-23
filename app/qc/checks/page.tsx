import Link from "next/link";
import { ClipboardCheckIcon } from "lucide-react";
import { Badge } from "@peckey954/ui/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@peckey954/ui/components/ui/breadcrumb";
import { cn } from "@peckey954/ui/lib/utils";
import { CHECK_KINDS } from "@/lib/qc-check";

/* ------------------------------------------------------------------
   QC ตรวจสอบ — รวมใบตรวจที่ทำซ้ำตามรอบไว้ที่เดียว

   ต่างจากใบตรวจรับสินค้าตรงที่ไม่ได้ผูกกับเอกสารใบใดใบหนึ่ง
   แต่ผูกกับ "วันและกะ" ตัวชี้วัดจึงเป็นความครบ ไม่ใช่ผลตรวจ

   ใบที่ยังไม่ได้ทำก็ขึ้นในรายการ แต่กดไม่ได้และเขียนว่ายังไม่เปิดใช้
   ซ่อนไปเลยแล้วคนใช้จะไม่รู้ว่าระบบตั้งใจจะมีอะไรบ้าง
------------------------------------------------------------------ */

export default function QcChecksPage() {
  return (
    <main className="@container mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage className="text-primary">QC ตรวจสอบ</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mt-4">
        <h1 className="text-2xl font-semibold tracking-tight">QC ตรวจสอบ</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          ใบตรวจที่ทำซ้ำตามรอบ ดูได้ทั้งรายวันและภาพรวมทั้งเดือน
        </p>
      </div>

      <div className="mt-6 grid gap-4 @2xl:grid-cols-2 @4xl:grid-cols-3">
        {CHECK_KINDS.map((k) => {
          const body = (
            <>
              <div className="flex items-start justify-between gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-cat-purple text-cat-purple-foreground">
                  <ClipboardCheckIcon className="size-5" />
                </span>
                {!k.href && (
                  <Badge tone="neutral" appearance="soft">
                    ยังไม่เปิดใช้
                  </Badge>
                )}
              </div>
              <p className="mt-3 font-semibold">{k.label}</p>
              <p className="mt-0.5 text-sm text-muted-foreground">{k.code}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {k.description}
              </p>
            </>
          );

          const shell =
            "rounded-xl border border-border bg-card p-4 transition-colors";

          return k.href ? (
            <Link
              key={k.id}
              href={k.href}
              className={cn(
                shell,
                "block hover:bg-accent-hover",
                "focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
              )}
            >
              {body}
            </Link>
          ) : (
            <div key={k.id} className={cn(shell, "opacity-60")}>
              {body}
            </div>
          );
        })}
      </div>
    </main>
  );
}
