"use client";

import * as React from "react";
import { NOTIFICATIONS, type AppNotification } from "@/lib/notifications";

/* ------------------------------------------------------------------
   สถานะอ่านแล้ว/ยังไม่อ่านของการแจ้งเตือน — อยู่ที่นี่เพราะต้องใช้ร่วมกันสองที่
   (กระดิ่งบนหัวเรื่อง + หน้ารวม /notifications) กดอ่านที่ไหนอีกที่ก็ต้อง
   sync ตามด้วย เหมือน RecipeRunProvider ที่ทำไว้ให้ข้ามหน้าได้

   ไม่มี backend จริง — ค่าเริ่มต้นมาจาก NOTIFICATIONS.read ตรงๆ เก็บเป็น
   React state ล้วน ไม่ persist ข้ามการโหลดหน้าใหม่ (รีเฟรชแล้วกลับไปเป็น
   ค่าเริ่มต้นเหมือนเดิมทุกครั้ง ตรงกับที่ไม่มีระบบ login/บัญชีจริง)
------------------------------------------------------------------ */

type Ctx = {
  notifications: AppNotification[];
  unreadCount: number;
  isRead: (id: string) => boolean;
  markRead: (id: string) => void;
  /** สถานะเปิด/ปิดของ popover กระดิ่งบนหัวเรื่อง — ยกขึ้นมาไว้ที่นี่ (แทนที่จะ
      เป็น state ในตัว NotificationBell เอง) เพราะ toast ตอนเข้าเว็บใหม่
      (components/app-shell.tsx) ต้องเปิด popover ตัวเดียวกันนี้ได้จากปุ่ม
      action ของมันด้วย — ใช้กระดิ่งตัวเดิมซ้ำ ไม่สร้างหน้าต่างแยกใหม่ */
  bellOpen: boolean;
  setBellOpen: (open: boolean) => void;
};

const NotificationsContext = React.createContext<Ctx | null>(null);

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [readIds, setReadIds] = React.useState<Set<string>>(
    () => new Set(NOTIFICATIONS.filter((n) => n.read).map((n) => n.id))
  );
  const [bellOpen, setBellOpen] = React.useState(false);

  const isRead = React.useCallback((id: string) => readIds.has(id), [readIds]);
  const markRead = React.useCallback((id: string) => {
    setReadIds((prev) => (prev.has(id) ? prev : new Set(prev).add(id)));
  }, []);

  const unreadCount = NOTIFICATIONS.filter((n) => !readIds.has(n.id)).length;

  const value = React.useMemo(
    () => ({ notifications: NOTIFICATIONS, unreadCount, isRead, markRead, bellOpen, setBellOpen }),
    [unreadCount, isRead, markRead, bellOpen]
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = React.useContext(NotificationsContext);
  if (!ctx) {
    throw new Error("useNotifications ต้องอยู่ภายใน NotificationsProvider");
  }
  return ctx;
}
