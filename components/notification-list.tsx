"use client";

import Link from "next/link";
import { ChevronRightIcon } from "lucide-react";
import { cn } from "@peckey954/ui/lib/utils";
import { ModuleIcon } from "@/components/modules/module-icon";
import type { AppNotification } from "@/lib/notifications";

/* ------------------------------------------------------------------
   รายการแจ้งเตือน — ใช้ร่วมกันทั้งในกระดิ่งบนหัวเรื่อง (popover) และหน้ารวม
   /notifications หน้าตาเดียวกันเป๊ะ ต่างกันแค่กล่องที่ครอบข้างนอก

   ทั้งแถวเป็นลิงก์เดียว ไม่มีปุ่มแยกในตัวอย่างเดิม ("ไปหน้าใบขอซื้อ") — ตาม
   ธรรมเนียมเดียวกับการ์ด/แถวเอกสารอื่นทั้งแอปนี้ที่กดได้ทั้งแถว (po-order-list,
   approve-list ฯลฯ) มีแค่ hover เปลี่ยนพื้นหลัง + ลูกศรขวาเป็นตัวบอกว่ากดได้
   แทนปุ่มลอยที่ซ้ำซ้อนกับตัวแถวเอง
------------------------------------------------------------------ */

export function NotificationList({
  notifications,
  isRead,
  onNavigate,
}: {
  notifications: AppNotification[];
  isRead: (id: string) => boolean;
  /** เรียกตอนกดแถว — ให้ตั้งเป็นอ่านแล้ว (และปิด popover ถ้ามี) */
  onNavigate: (id: string) => void;
}) {
  if (notifications.length === 0) {
    return (
      <p className="px-4 py-8 text-center text-sm text-muted-foreground">
        ยังไม่มีการแจ้งเตือน
      </p>
    );
  }

  return (
    <div className="divide-y divide-border">
      {notifications.map((n) => {
        const read = isRead(n.id);
        return (
          <Link
            key={n.id}
            href={n.href}
            onClick={() => onNavigate(n.id)}
            className="group flex gap-3 px-4 py-3 outline-none transition-colors hover:bg-accent-hover focus-visible:bg-accent-hover"
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-cat-orange text-cat-orange-foreground">
              <ModuleIcon name="squareCheck" className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                <p className="font-medium">{n.title}</p>
                <p className="shrink-0 text-xs whitespace-nowrap text-muted-foreground">
                  {n.at}
                </p>
              </div>
              <p className="mt-0.5 text-sm text-muted-foreground">{n.description}</p>
              {!read && (
                <p className="mt-2 text-sm font-medium text-primary">ยังไม่อ่าน</p>
              )}
            </div>
            <ChevronRightIcon
              className={cn(
                "mt-1 size-4 shrink-0 self-center text-muted-foreground transition-transform",
                "group-hover:translate-x-0.5"
              )}
            />
          </Link>
        );
      })}
    </div>
  );
}
