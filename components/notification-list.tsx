"use client";

import Link from "next/link";
import { CircleCheckIcon, CircleXIcon } from "lucide-react";
import { Button } from "@peckey954/ui/components/ui/button";
import { cn } from "@peckey954/ui/lib/utils";
import { ModuleIcon, TONE_BOX } from "@/components/modules/module-icon";
import type { AppNotification } from "@/lib/notifications";

/* ------------------------------------------------------------------
   รายการแจ้งเตือน — ใช้ร่วมกันทั้งในกระดิ่งบนหัวเรื่อง (popover) และหน้ารวม
   /notifications หน้าตาเดียวกันเป๊ะ ต่างกันแค่กล่องที่ครอบข้างนอก

   แต่ละแถวมีปุ่ม "ไปหน้าใบขอซื้อ" ของตัวเอง (พื้นทึบสีแบรนด์ — primary ตามแบบ
   ที่ส่งมา ไม่ใช่ outline) แทนที่จะให้ทั้งแถวเป็นลิงก์เดียว — ตั้งใจไว้แบบนี้
   ตามแบบที่ส่งมา สีเดียวกันทุกแถวไม่ว่าแจ้งเตือนนั้นจะเป็นผลบวก/ลบ (ไม่มีปุ่ม
   สีแดงสำหรับแจ้งเตือนที่ถูกยกเลิก)
------------------------------------------------------------------ */

/** สีไอคอนเหลืองมาตรฐานของไอคอนแจ้งเตือน "ใบขอซื้อ" ทุกแบบ (#EAB308 ตามที่
    ยืนยันมา) — ใช้ตัวเดียวกันทั้งไอคอนผลลัพธ์ (circle-check/circle-x) และ
    ไอคอนเมนูปกติ (ModuleIcon) ไม่พึ่ง token เดิม (chip-yellow-foreground /
    cat-yellow-foreground) เพราะสีไม่ตรงเป๊ะกับที่ขอมา ต้องล็อกเป็นค่านี้ตรงๆ
    เพื่อให้ทุกไอคอนในรายการนี้เหลืองเฉดเดียวกันเป๊ะ ไม่ต่างกันทีละนิด */
const NOTIFICATION_ICON_COLOR = "text-[#eab308]";

/** ไอคอนหน้าแถว — ปกติเป็นไอคอนของเมนูที่เกี่ยวข้อง (วงกลม พื้นสีตามหมวด
    TONE_BOX[moduleTone] แต่ตัวไอคอนบังคับเหลือง #eab308 เหมือนกันหมด) ยกเว้น
    แจ้งเตือนที่เป็นผลลัพธ์ชัดเจน (อนุมัติ/ไม่อนุมัติ, ยกเลิก) ใช้กล่องคนละแบบ —
    สี่เหลี่ยมมุมโค้งพื้นเหลืองอ่อน (chip-yellow, #fefce8) ไอคอน circle-check/
    circle-x ของ Lucide ตามดีไซน์ Figma โหนด "Wrap" (node-id 1783:418557) แต่
    สีไอคอนก็ล็อกเป็น #eab308 เดียวกันกับไอคอนเมนูปกติด้านล่าง ไม่ใช่
    chip-yellow-foreground เดิม (เข้มไปหน่อย ไม่ตรงเฉดที่ขอ) */
function NotificationIcon({ n }: { n: AppNotification }) {
  if (n.outcome === "fail" || n.outcome === "success") {
    const Icon = n.outcome === "fail" ? CircleXIcon : CircleCheckIcon;
    return (
      <span
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-lg bg-(--chip-yellow) p-2",
          NOTIFICATION_ICON_COLOR
        )}
      >
        <Icon className="size-4" />
      </span>
    );
  }
  return (
    <span
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-full",
        TONE_BOX[n.moduleTone],
        NOTIFICATION_ICON_COLOR
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
          <div
            key={n.id}
            className={cn("flex gap-3 px-4 py-3", !read && "bg-brand")}
          >
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
                <Button asChild size="sm" onClick={() => onNavigate(n.id)}>
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
