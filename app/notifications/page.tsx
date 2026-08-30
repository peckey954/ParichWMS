"use client";

import { useRouter } from "next/navigation";
import { ChevronLeftIcon } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@peckey954/ui/components/ui/breadcrumb";
import { NotificationList } from "@/components/notification-list";
import { useNotifications } from "@/components/notifications-provider";

/* ------------------------------------------------------------------
   หน้ารวมการแจ้งเตือน — เนื้อหาเดียวกับที่กระดิ่งบนหัวเรื่องแสดง (ใช้
   NotificationList ตัวเดียวกัน) หน้านี้เป็นทางเข้าสำหรับ "จอแคบ" (มือถือ)
   เท่านั้นตอนนี้ — จอกว้างเลื่อนดูในตัว popover ของกระดิ่งพอ ไม่มีลิงก์ "ดูทั้งหมด"
   พามาที่นี่แล้ว (components/notification-bell.tsx) เข้าถึงหน้านี้ได้จาก
   กระดิ่งเองตอนจอแคบ กับจาก toast แจ้งจำนวนที่ขึ้นตอนเข้าเว็บ (app-shell.tsx)

   หัวหน้าจอแคบ — แถบย้อนกลับ + ชื่อหน้าเต็มความกว้าง แทน breadcrumb/h1 แบบ
   มาตรฐาน (จอแคบไม่มีที่พอให้ทั้งคู่ อ่านยาก) ตามแบบที่ส่งมา จอกว้างยังใช้
   breadcrumb/h1 เดียวกับหน้าอื่นทั้งแอปเหมือนเดิม
------------------------------------------------------------------ */

export default function NotificationsPage() {
  const router = useRouter();
  const { notifications, unreadCount, isRead, markRead } = useNotifications();

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col">
      <div className="sticky top-14 z-30 flex items-center gap-3 border-b border-border bg-background px-4 py-3 sm:hidden">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="ย้อนกลับ"
          className="shrink-0 text-foreground"
        >
          <ChevronLeftIcon className="size-5" />
        </button>
        <p className="font-semibold">การแจ้งเตือน</p>
        <p className="ml-auto shrink-0 text-sm whitespace-nowrap text-muted-foreground">
          ยังไม่อ่าน {unreadCount} รายการ
        </p>
      </div>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pt-4 pb-24 sm:px-6 sm:pt-6">
        <div className="hidden sm:block">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">ระบบ</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-primary">การแจ้งเตือน</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="mt-2 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">การแจ้งเตือน</h1>
            <p className="text-sm text-muted-foreground">ยังไม่อ่าน {unreadCount} รายการ</p>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-border bg-card sm:mt-6">
          <NotificationList
            notifications={notifications}
            isRead={isRead}
            onNavigate={markRead}
          />
        </div>
      </main>
    </div>
  );
}
