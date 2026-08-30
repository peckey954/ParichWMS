"use client";

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
   NotificationList ตัวเดียวกัน) ต่างกันแค่เป็นหน้าเต็มแทนกล่อง popover
   ลอย ๆ เข้าถึงได้ทั้งจากกระดิ่ง ("ดูการแจ้งเตือนทั้งหมด") และจาก toast
   แจ้งจำนวนที่ขึ้นตอนเข้าเว็บ (components/app-shell.tsx)
------------------------------------------------------------------ */

export default function NotificationsPage() {
  const { notifications, unreadCount, isRead, markRead } = useNotifications();

  return (
    <main className="mx-auto w-full max-w-3xl px-4 pt-6 pb-24 sm:px-6">
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

      <div className="mt-6 rounded-xl border border-border bg-card">
        <NotificationList
          notifications={notifications}
          isRead={isRead}
          onNavigate={markRead}
        />
      </div>
    </main>
  );
}
