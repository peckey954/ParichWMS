"use client";

import * as React from "react";
import type { CSSProperties } from "react";
import { Toaster } from "@peckey954/ui/components/ui/sonner";

/* ------------------------------------------------------------------
   ที่อยู่ของ toast ทั้งแอป

   จอกว้าง — บนกลาง ใต้แถบหัว (สูง 56px) มุมล่างทับปุ่มบันทึก/ย้อนกลับ
   ที่ติดขอบล่างแทบทุกหน้า

   มือถือ — ขึ้นจากด้านล่าง เหนือแถบปุ่มล่างพอดี นิ้วกับสายตาอยู่ที่ปุ่ม
   บันทึกอยู่แล้ว ผลของการกดจึงโผล่ตรงนั้น และอยู่ที่เดียวกันทุกหน้า
   ความสูงของแถบล่างต่างกันไปแต่ละหน้า (บางหน้าไม่มีเลย) จึงวัดจากของจริง
   แล้วส่งเป็นตัวแปร --toast-bottom ให้ toast ลอยเหนือแถบเสมอ ไม่ทับปุ่ม

   ทั้งสองแบบอยู่ 3 วินาทีแล้วหายเอง ไม่ค้างบังงานที่ทำต่อ
------------------------------------------------------------------ */

/** จุดตัดเดียวกับที่ sonner ใช้สลับเป็นแบบเต็มความกว้างของมือถือ */
const MOBILE_QUERY = "(max-width: 600px)";

function subscribe(cb: () => void) {
  const mq = window.matchMedia(MOBILE_QUERY);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

function useIsMobile() {
  return React.useSyncExternalStore(
    subscribe,
    () => window.matchMedia(MOBILE_QUERY).matches,
    () => false
  );
}

/**
 * ความสูงของแถบที่ติดขอบล่างจออยู่ตอนนี้ (0 ถ้าไม่มี)
 * นับเฉพาะแถบที่ก้นแตะขอบล่างจอจริง ๆ — แถบ sticky ที่ยังไม่ถึงขอบ
 * (หน้าสั้น) ไม่ได้บังอะไร ไม่ต้องหลบ
 */
function bottomBarHeight() {
  let h = 0;
  const bars = document.querySelectorAll<HTMLElement>(
    ".sticky.bottom-0, .fixed.bottom-0"
  );
  for (const el of bars) {
    if (el.closest("[data-sonner-toaster]")) continue;
    const r = el.getBoundingClientRect();
    if (r.height > 0 && r.height < 240 && Math.abs(r.bottom - window.innerHeight) < 2) {
      h = Math.max(h, r.height);
    }
  }
  return h;
}

function useBottomBarVar(enabled: boolean) {
  React.useEffect(() => {
    const root = document.documentElement;
    if (!enabled) {
      root.style.removeProperty("--toast-bottom");
      return;
    }
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() =>
        root.style.setProperty("--toast-bottom", `${bottomBarHeight()}px`)
      );
    };
    update();
    // เปลี่ยนหน้า เปิด/ปิดแถบ หรือเลื่อนจนแถบ sticky มาแตะขอบ ล้วนเปลี่ยนค่าได้
    const mo = new MutationObserver(update);
    mo.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      mo.disconnect();
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update);
    };
  }, [enabled]);
}

export function ToasterHost() {
  const mobile = useIsMobile();
  useBottomBarVar(mobile);

  return (
    // toast สำเร็จ (success) ทั้งแอปใช้สีแบรนด์ส้มอ่อนแทนเขียว semantic
    // เริ่มต้นของ DS — ต้องเปิด richColors ด้วยไม่งั้นตัวแปรสีพวกนี้ไม่มีผล
    // และต้องยกค่าตัวอื่น (--normal-*, --warning-*, --error-*) มาด้วยครบ
    // เพราะ prop style ที่ส่งจากตรงนี้แทนที่ style เดิมของ DS ทั้งก้อน
    // ไม่ได้ merge ทีละตัวแปร
    <Toaster
      richColors
      position={mobile ? "bottom-center" : "top-center"}
      offset={72}
      mobileOffset={{
        bottom: "calc(var(--toast-bottom, 0px) + 12px)",
        left: 16,
        right: 16,
      }}
      duration={3000}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
          "--success-bg": "var(--brand)",
          "--success-text": "var(--primary)",
          "--success-border": "var(--primary)",
          "--warning-bg": "var(--warning)",
          "--warning-text": "var(--warning-foreground)",
          "--warning-border": "var(--warning-border)",
          "--error-bg": "var(--danger)",
          "--error-text": "var(--danger-foreground)",
          "--error-border": "var(--danger-border)",
        } as CSSProperties
      }
    />
  );
}
