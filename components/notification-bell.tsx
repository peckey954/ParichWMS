"use client";

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

   จอกว้าง — กดแล้วกางเป็น popover แสดงรายการ เลื่อนดูในนั้นได้เลย (max-h +
   overflow-y-auto) ไม่มีปุ่ม/ลิงก์ "ดูทั้งหมด" พาไปหน้าใหญ่แยกต่างหากอีกต่อไป
   ตามแบบที่ส่งมา — popover เดียวจบ ไม่ต้องมีทางไปไหนต่อ

   จอแคบ — popover ลอยเล็กๆ ไม่มีที่พอให้อ่านสบาย กดกระดิ่งแล้วพาไปหน้า
   /notifications เต็มหน้าตรงๆ แทนเลย (คนละองค์ประกอบกับปุ่มจอกว้าง ไม่ใช่
   Popover เดิมที่แค่ซ่อน/โชว์ด้วย CSS เพราะ Popover ของ Radix กดแล้วจะพยายาม
   เปิดตัวเองอยู่ดีแม้จะซ่อนด้วย CSS ก็ตาม)
------------------------------------------------------------------ */

function UnreadBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="absolute top-1 right-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground tabular-nums">
      {count}
    </span>
  );
}

export function NotificationBell() {
  const { notifications, unreadCount, isRead, markRead, bellOpen, setBellOpen } =
    useNotifications();

  const ariaLabel =
    unreadCount > 0 ? `การแจ้งเตือน ยังไม่อ่าน ${unreadCount} รายการ` : "การแจ้งเตือน";

  function handleNavigate(id: string) {
    markRead(id);
    setBellOpen(false);
  }

  return (
    <>
      <Button asChild variant="ghost" size="icon" aria-label={ariaLabel} className="relative sm:hidden">
        <Link href="/notifications">
          <BellIcon />
          <UnreadBadge count={unreadCount} />
        </Link>
      </Button>

      <div className="hidden sm:block">
        <Popover open={bellOpen} onOpenChange={setBellOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" aria-label={ariaLabel} className="relative">
              <BellIcon />
              <UnreadBadge count={unreadCount} />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-96 max-w-[calc(100vw-2rem)] gap-0 p-0">
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
          </PopoverContent>
        </Popover>
      </div>
    </>
  );
}
