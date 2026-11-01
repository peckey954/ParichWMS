"use client";

import * as React from "react";

/* ------------------------------------------------------------------
   บทบาทผู้ใช้ — ยังไม่มีระบบ login จริง จึงให้สลับดูได้จากเมนูโปรไฟล์

   ตอนนี้มีผลที่เดียว: เกรด A/B/C ของ Safety Stock บนการ์ดสินค้า
   ขึ้นเฉพาะ Admin กับ Procurement (ฝ่ายจัดซื้อใช้เกรดตัดสินใจสั่งของ
   คนหน้าคลังไม่ต้องเห็น) สวิตช์มีแค่ User / Admin ตามที่ใช้รีวิว

   จำค่าไว้ในเบราว์เซอร์ รีเฟรชแล้วยังเป็นบทบาทเดิม — อ่านหลัง mount
   เพื่อให้ฝั่งเซิร์ฟเวอร์กับเบราว์เซอร์เรนเดอร์รอบแรกตรงกัน (เริ่มที่ User)
------------------------------------------------------------------ */

export type Role = "user" | "admin" | "procurement";

export const ROLE_LABEL: Record<Role, string> = {
  user: "User",
  admin: "Admin",
  procurement: "Procurement",
};

/** บทบาทที่สลับได้จากเมนู */
export const SWITCHABLE_ROLES: Role[] = ["user", "admin"];

/** เห็นเกรด Safety Stock ได้ */
export const canSeeGrade = (r: Role) => r === "admin" || r === "procurement";

const KEY = "parich-role";

type Ctx = { role: Role; setRole: (r: Role) => void };
const RoleContext = React.createContext<Ctx | null>(null);

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = React.useState<Role>("user");

  React.useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- อ่านค่าที่จำไว้หลัง mount ให้ hydration ตรงกัน
      if (saved && saved in ROLE_LABEL) setRoleState(saved as Role);
    } catch {}
  }, []);

  const setRole = React.useCallback((r: Role) => {
    setRoleState(r);
    try {
      localStorage.setItem(KEY, r);
    } catch {}
  }, []);

  const value = React.useMemo(() => ({ role, setRole }), [role, setRole]);
  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole() {
  const ctx = React.useContext(RoleContext);
  if (!ctx) throw new Error("useRole ต้องอยู่ใน RoleProvider");
  return ctx;
}
