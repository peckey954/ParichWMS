"use client";

import * as React from "react";
import { MonitorIcon, SmartphoneIcon, TabletIcon } from "lucide-react";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@peckey954/ui/components/ui/toggle-group";
import { cn } from "@peckey954/ui/lib/utils";

/* ------------------------------------------------------------------
   เครื่องมือดูหน้าจอขนาดอื่นตอนรีวิวดีไซน์
   ปุ่มอยู่บนหัวเรื่องข้างปุ่มสลับโหมดมืด ใช้ได้กับทุกหน้า
   ตัวกรอบจำลองครอบพื้นที่เนื้อหาไว้ที่ AppShell ที่เดียว
------------------------------------------------------------------ */

export type Device = "desktop" | "tablet" | "mobile";

export const DEVICE: Record<
  Device,
  { label: string; width: string; height: string }
> = {
  desktop: { label: "เดสก์ท็อป", width: "100%", height: "auto" },
  tablet: { label: "แท็บเล็ต", width: "834px", height: "900px" },
  mobile: { label: "มือถือ", width: "390px", height: "780px" },
};

type Ctx = {
  device: Device;
  framed: boolean;
  setDevice: (d: Device) => void;
  /** กล่องที่เลื่อนจริงตอนจำลองอุปกรณ์ ตอนเต็มจอคือหน้าต่าง */
  frameRef: React.RefObject<HTMLDivElement | null>;
};

const DevicePreviewContext = React.createContext<Ctx>({
  device: "desktop",
  framed: false,
  setDevice: () => {},
  frameRef: { current: null },
});

export const useDevicePreview = () => React.useContext(DevicePreviewContext);



export function DevicePreviewProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [device, setDevice] = React.useState<Device>("desktop");
  const frameRef = React.useRef<HTMLDivElement>(null);
  const framed = device !== "desktop";

  /*
   * บอกตำแหน่งและขนาดของกรอบจำลองให้ CSS รู้
   *
   * Dialog / Sheet / Drawer วาดผ่าน portal ไปไว้ที่ body จึงอยู่นอกกรอบ
   * container query มองไม่เห็น และ breakpoint ของหน้าต่างก็ยังเป็นขนาดจอจริง
   * ผลคือกดเปิดในโหมดมือถือแล้วได้กล่องขนาดเดสก์ท็อป
   *
   * แก้ด้วยการส่งพิกัดกรอบออกไปเป็นตัวแปร CSS แล้วให้ globals.css
   * ดึงกล่องพวกนี้กลับมาอยู่ในกรอบและคุมขนาดตามอุปกรณ์ที่เลือก
   */
  React.useEffect(() => {
    const root = document.documentElement;

    const clear = () => {
      root.removeAttribute("data-device-frame");
      for (const k of ["x", "y", "w", "h", "r", "b"]) {
        root.style.removeProperty(`--frame-${k}`);
      }
    };

    if (!framed) {
      clear();
      return;
    }

    const apply = () => {
      const el = frameRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      root.setAttribute("data-device-frame", "on");
      root.style.setProperty("--frame-x", `${r.left}px`);
      root.style.setProperty("--frame-y", `${r.top}px`);
      root.style.setProperty("--frame-w", `${r.width}px`);
      root.style.setProperty("--frame-h", `${r.height}px`);
      // ระยะจากขอบขวา/ขอบล่างของหน้าต่าง ใช้กับถาดที่ยึดจากสองด้านนั้น
      root.style.setProperty("--frame-r", `${window.innerWidth - r.right}px`);
      root.style.setProperty("--frame-b", `${window.innerHeight - r.bottom}px`);
    };

    apply();
    const ro = new ResizeObserver(apply);
    if (frameRef.current) ro.observe(frameRef.current);
    window.addEventListener("resize", apply);
    // true = ดักตอนหน้าเลื่อน กรอบขยับตามแล้วกล่องต้องขยับด้วย
    window.addEventListener("scroll", apply, true);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", apply);
      window.removeEventListener("scroll", apply, true);
      clear();
    };
  }, [framed]);

  const value = React.useMemo(
    () => ({ device, framed, setDevice, frameRef }),
    [device, framed]
  );
  return (
    <DevicePreviewContext.Provider value={value}>
      {children}
    </DevicePreviewContext.Provider>
  );
}

/**
 * สถานะการเลื่อนของหน้า
 *
 * ต้องรู้ก่อนว่าใครเป็นตัวเลื่อน — ตอนจำลองอุปกรณ์คือกรอบ ตอนเต็มจอคือหน้าต่าง
 * ไม่งั้นดักฟังผิดตัวแล้วจะไม่เกิดอะไรขึ้นเลยในโหมดจำลอง
 *
 * หลักที่ควรเป็น (แบบเดียวกับแถบที่อยู่บนสุดของเบราว์เซอร์เอง / แอปทั่วไป):
 * เลื่อนลงอ่าน (นิ้วสไลด์ขึ้น) = ซ่อนแถบให้เห็นเนื้อหาเต็ม ๆ
 * เลื่อนขึ้นหา (นิ้วสไลด์ลง) = เอาแถบกลับมาทันที ไม่ต้องเลื่อนกลับสุดก่อน
 *
 * hidden  = กำลังเลื่อนลงเกิน hideAfter แล้ว ใช้ซ่อนแถบเครื่องมือ
 * showTop = เลื่อนลงมาไกลแล้ว ควรมีปุ่มกลับขึ้นบนสุด
 */
export function useScrollState({ hideAfter = 160, topAfter = 700 } = {}) {
  const { framed, frameRef } = useDevicePreview();
  const [state, setState] = React.useState({ hidden: false, showTop: false });
  // scrollIntoTop เลื่อนหน้าเองโปรแกรมมาติก ไม่ใช่นิ้วผู้ใช้
  // ถ้าจุดหมายอยู่ต่ำกว่า hideAfter จะถูกอ่านผิดว่า "เลื่อนลงอ่าน" แล้วซ่อนแถบทันที
  // ทั้งที่กำลังจะโชว์แถบพร้อมรายการชุดใหม่ ตั้งค่านี้ไว้ให้รอบ scroll ถัดไปข้ามการซ่อน
  const ignoreNextRef = React.useRef(false);

  React.useEffect(() => {
    const el = framed ? frameRef.current : null;
    const target: HTMLElement | Window = el ?? window;
    const read = () => (el ? el.scrollTop : window.scrollY);

    let last = read();
    let ticking = false;

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        const y = read();

        if (ignoreNextRef.current) {
          ignoreNextRef.current = false;
          last = y;
          setState((prev) => {
            const showTop = y > topAfter;
            return prev.hidden === false && prev.showTop === showTop
              ? prev
              : { hidden: false, showTop };
          });
          return;
        }

        const dy = y - last;
        // ขยับน้อยกว่านี้ถือว่าเป็นการสั่น ไม่นับเป็นการเปลี่ยนทิศ
        const moved = Math.abs(dy) > 6;
        if (moved) last = y;

        setState((prev) => {
          const hidden = moved ? dy > 0 && y > hideAfter : prev.hidden;
          const showTop = y > topAfter;
          return prev.hidden === hidden && prev.showTop === showTop
            ? prev
            : { hidden, showTop };
        });
      });
    };

    target.addEventListener("scroll", onScroll, { passive: true });
    return () => target.removeEventListener("scroll", onScroll);
  }, [framed, frameRef, hideAfter, topAfter]);

  const scrollToTop = React.useCallback(() => {
    const el = framed ? frameRef.current : null;
    (el ?? window).scrollTo({ top: 0, behavior: "smooth" });
  }, [framed, frameRef]);

  /**
   * เลื่อนให้หัวของ el มาอยู่ใต้ขอบบน โดยเว้นระยะ offset ให้แถบที่ติดบน
   *
   * ไม่ใช้ smooth — สลับแท็บ/ชิปมักกระโดดข้ามระยะไกล (เผลอเลื่อนลึกไว้ก่อนสลับ)
   * เลื่อนแบบ smooth จะเห็นเนื้อหาเดิมไหลผ่านตาไปเรื่อย ๆ เหมือนลากมาตั้งแต่บนสุด
   * เปลี่ยนเป็นกระโดดตรง แล้วให้รายการชุดใหม่เป็นฝ่ายไถลเข้ามาแทน (ดู animate-in
   * ที่ตัวรายการ) เห็นการเปลี่ยนแปลงชัดกว่าแต่ไม่ต้องนั่งดูหน้าเลื่อนยาว ๆ
   *
   * ตั้ง ignoreNextRef ไว้เสมอ ไม่ว่าจะเลื่อนขึ้นหรือลง เพราะกระโดดครั้งเดียว
   * แถบต้องโผล่แน่ ๆ ไม่ต้องพึ่งให้ทิศเลื่อนมาตัดสินแทน
   */
  const scrollIntoTop = React.useCallback(
    (el: HTMLElement, offset = 0) => {
      ignoreNextRef.current = true;
      // เผื่อกรณีเป้าหมายอยู่ตำแหน่งเดิมพอดี ไม่มี scroll event เกิดขึ้นเลย
      // ค่านี้ต้องไม่ค้าง ไม่งั้นจะไปกินการเลื่อนจริงครั้งถัดไปของผู้ใช้ฟรี ๆ
      window.setTimeout(() => {
        ignoreNextRef.current = false;
      }, 100);
      const frame = framed ? frameRef.current : null;
      if (frame) {
        const top =
          el.getBoundingClientRect().top -
          frame.getBoundingClientRect().top +
          frame.scrollTop -
          offset;
        frame.scrollTo({ top: Math.max(0, top) });
      } else {
        const top = el.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top: Math.max(0, top) });
      }
    },
    [framed, frameRef]
  );

  /**
   * กันแท็บใหญ่ (ไม่ได้ล็อกติดจอ กดได้ก็ต่อเมื่ออยู่ใกล้บนสุดอยู่แล้ว) เลื่อนจอ
   * เอง — ควรแค่เปลี่ยนข้อมูล ไม่มีอะไรขยับ
   *
   * armScrollGuard จับตำแหน่งไว้ตอน pointerdown (ต้องเป็น capture phase ผูกไว้
   * ที่ตัวห่อ ให้ทำงานก่อน handler ของปุ่มแท็บเอง)
   *
   * ตัวที่แอบเลื่อนไม่ใช่แค่โฟกัสของปุ่มตอนกด (เกิดทันที) แต่รวมถึงตอนเบราว์เซอร์
   * รีโฟลว์เพราะเนื้อหาแท็บใหม่สูงไม่เท่าเดิม (มาช้ากว่านั้นอีก บางทีหลายสิบ ms
   * หลัง render เสร็จ) แก้ครั้งเดียวคร่อมเฟรมถัดไปไม่พอ ต้องดักฟัง scroll ต่อไป
   * อีกพักหนึ่ง เจอหลุดจากตำแหน่งที่จับไว้เมื่อไหร่ดึงกลับทันที
   *
   * ตั้ง ignoreNextRef คู่กับทุกครั้งที่ดึงกลับ ไม่งั้นการดึงกลับเองจะถูกแถบ
   * ชิป+ค้นหาอ่านผิดว่าเป็นการเลื่อนลงอ่านของผู้ใช้แล้วซ่อนตัวไปฟรี ๆ
   */
  const scrollGuardRef = React.useRef<number | null>(null);

  const armScrollGuard = React.useCallback(() => {
    const el = framed ? frameRef.current : null;
    scrollGuardRef.current = el ? el.scrollTop : window.scrollY;
  }, [framed, frameRef]);

  const releaseScrollGuard = React.useCallback(() => {
    const before = scrollGuardRef.current;
    if (before === null) return;
    scrollGuardRef.current = null;

    const el = framed ? frameRef.current : null;
    const target: HTMLElement | Window = el ?? window;
    const read = () => (el ? el.scrollTop : window.scrollY);
    const restore = () => {
      ignoreNextRef.current = true;
      window.setTimeout(() => {
        ignoreNextRef.current = false;
      }, 100);
      if (el) el.scrollTo({ top: before });
      else window.scrollTo({ top: before });
    };

    restore();

    const onDrift = () => {
      if (read() !== before) restore();
    };
    target.addEventListener("scroll", onDrift, { passive: true });
    window.setTimeout(() => {
      target.removeEventListener("scroll", onDrift);
    }, 500);
  }, [framed, frameRef]);

  return {
    ...state,
    scrollToTop,
    scrollIntoTop,
    armScrollGuard,
    releaseScrollGuard,
  };
}

/** ปุ่มไอคอนสามอันบนหัวเรื่อง */
export function DevicePreviewToggle({ className }: { className?: string }) {
  const { device, setDevice } = useDevicePreview();
  return (
    <ToggleGroup
      type="single"
      variant="outline"
      size="sm"
      value={device}
      onValueChange={(v) => v && setDevice(v as Device)}
      className={className}
    >
      <ToggleGroupItem value="desktop" aria-label="ดูแบบเดสก์ท็อป">
        <MonitorIcon />
      </ToggleGroupItem>
      <ToggleGroupItem value="tablet" aria-label="ดูแบบแท็บเล็ต">
        <TabletIcon />
      </ToggleGroupItem>
      <ToggleGroupItem value="mobile" aria-label="ดูแบบมือถือ">
        <SmartphoneIcon />
      </ToggleGroupItem>
    </ToggleGroup>
  );
}

/**
 * กรอบจำลองอุปกรณ์
 *
 * ตอนจำลอง กรอบต้องเป็น "ตัวเลื่อน" จริง ไม่ใช่แค่กล่อง overflow-hidden
 * เพราะ position: sticky ยึดกับบรรพบุรุษที่เลื่อนได้เท่านั้น
 * ถ้าใช้ overflow-hidden แถบติดบนในหน้าสต็อกจะไม่ทำงาน
 *
 * @container ต้องมีตลอดไม่ว่าจะจำลองหรือไม่ เพราะหน้าอื่นใช้ container query
 * วัดความกว้างจากกล่องนี้ ไม่ใช่จากขนาดหน้าต่าง
 */
export function DeviceFrame({ children }: { children: React.ReactNode }) {
  const { device, framed, frameRef } = useDevicePreview();
  return (
    <div
      ref={frameRef}
      className={cn(
        "@container mx-auto w-full bg-surface transition-[max-width] duration-300",
        framed &&
          "my-4 overflow-y-auto overscroll-contain rounded-2xl border border-border shadow-sm"
      )}
      style={{
        maxWidth: DEVICE[device].width,
        height: framed ? DEVICE[device].height : undefined,
      }}
    >
      {children}
    </div>
  );
}
