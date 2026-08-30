"use client";

import * as React from "react";
import Link from "next/link";
import { BellIcon } from "lucide-react";
import { Button } from "@peckey954/ui/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@peckey954/ui/components/ui/popover";
import { NotificationList } from "@/components/notification-list";
import { useNotifications } from "@/components/notifications-provider";

/* ------------------------------------------------------------------
   กระดิ่งแจ้งเตือนบนหัวเรื่อง — ป้ายตัวเลขมุมขวาบนบอกจำนวนที่ยังไม่อ่าน
   กดแล้วกางเป็น popover แสดงรายการล่าสุด กดปุ่ม "ไปหน้าใบขอซื้อ" ในแถวไหน
   ก็ตั้งเป็นอ่านแล้วทันที + ปิด popover ไปหน้านั้นเลย
------------------------------------------------------------------ */

export function NotificationBell() {
  const { notifications, unreadCount, isRead, markRead } = useNotifications();
  const [open, setOpen] = React.useState(false);

  function handleNavigate(id: string) {
    markRead(id);
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={
            unreadCount > 0 ? `การแจ้งเตือน ยังไม่อ่าน ${unreadCount} รายการ` : "การแจ้งเตือน"
          }
          className="relative"
        >
          <BellIcon />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground tabular-nums">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-96 max-w-[calc(100vw-2rem)] gap-0 p-0"
      >
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
          <p className="font-semibold">การแจ้งเตือน</p>
          <p className="text-sm text-muted-foreground">ยังไม่อ่าน {unreadCount} รายการ</p>
        </div>
        <div className="max-h-[60vh] overflow-y-auto">
          <NotificationList
            notifications={notifications}
            isRead={isRead}
            onNavigate={handleNavigate}
          />
        </div>
        <div className="border-t border-border p-2">
          <Button
            asChild
            variant="ghost"
            className="w-full justify-center text-primary"
            onClick={() => setOpen(false)}
          >
            <Link href="/notifications">ดูการแจ้งเตือนทั้งหมด</Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
