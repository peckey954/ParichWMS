"use client";

import Link from "next/link";
import { CheckIcon, XIcon } from "lucide-react";
import { Button } from "@peckey954/ui/components/ui/button";
import { cn } from "@peckey954/ui/lib/utils";
import { ModuleIcon, TONE_BOX } from "@/components/modules/module-icon";
import type { AppNotification } from "@/lib/notifications";

/* ------------------------------------------------------------------
   รายการแจ้งเตือน — ใช้ร่วมกันทั้งในกระดิ่งบนหัวเรื่อง (popover) และหน้ารวม
   /notifications หน้าตาเดียวกันเป๊ะ ต่างกันแค่กล่องที่ครอบข้างนอก

   แต่ละแถวมีปุ่ม "ไปหน้าใบขอซื้อ" ของตัวเอง (outline-primary ตามแบบ) แทนที่
   จะให้ทั้งแถวเป็นลิงก์เดียว — ตั้งใจไว้แบบนี้ตามแบบที่ส่งมา
------------------------------------------------------------------ */

/** ไอคอนหน้าแถว — ปกติเป็นไอคอนของเมนูที่เกี่ยวข้อง (สีตามหมวดเดียวกับการ์ด
    เมนูหน้าแรก) ยกเว้นแจ้งเตือนที่เป็นผลลัพธ์ชัดเจน (อนุมัติ/ไม่อนุมัติ,
    ยกเลิก) ใช้เครื่องหมายถูก/กากบาทแทน สื่อผลลัพธ์ตรงกว่าไอคอนเมนูเฉยๆ */
function NotificationIcon({ n }: { n: AppNotification }) {
  if (n.outcome === "fail") {
    return (
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-danger-strong text-white">
        <XIcon className="size-4" />
      </span>
    );
  }
  if (n.outcome === "success") {
    return (
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-success-strong text-white">
        <CheckIcon className="size-4" />
      </span>
    );
  }
  return (
    <span
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-full",
        TONE_BOX[n.moduleTone]
      )}
    >
      <ModuleIcon name={n.moduleIcon} className="size-4" />
    </span>
  );
}

export function NotificationList({
  notifications,
  isRead,
  onNavigate,
}: {
  notifications: AppNotification[];
  isRead: (id: string) => boolean;
  /** เรียกตอนกด "ไปหน้าใบขอซื้อ" — ให้ตั้งเป็นอ่านแล้ว (และปิด popover ถ้ามี) */
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
          <div key={n.id} className="flex gap-3 px-4 py-3">
            <NotificationIcon n={n} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                <p className="font-medium">{n.title}</p>
                <p className="shrink-0 text-xs whitespace-nowrap text-muted-foreground">
                  {n.at}
                </p>
              </div>
              <p className="mt-0.5 text-sm text-muted-foreground">{n.description}</p>
              <div className="mt-2 flex items-center justify-between gap-3">
                <Button asChild variant="outline-primary" size="sm" onClick={() => onNavigate(n.id)}>
                  <Link href={n.href}>ไปหน้าใบขอซื้อ</Link>
                </Button>
                <span
                  className={cn(
                    "shrink-0 text-sm whitespace-nowrap",
                    read ? "text-muted-foreground" : "font-medium text-primary"
                  )}
                >
                  {read ? "อ่านแล้ว" : "ยังไม่อ่าน"}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
