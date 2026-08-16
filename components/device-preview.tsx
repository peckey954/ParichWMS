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

/**
 * จอแคบหรือเปล่า — ใช้กับของที่วาดผ่าน portal (Dialog / Drawer / Sheet)
 *
 * container query ใช้ไม่ได้ เพราะ portal วาดไปไว้ที่ body ไม่ได้อยู่ใน container
 * ตอนจำลองอุปกรณ์ก็ดูจากกรอบที่เลือก ไม่ใช่ความกว้างหน้าต่างจริง
 * ไม่งั้นเปิดโหมดมือถือบนเดสก์ท็อปแล้วจะยังได้พฤติกรรมของจอกว้าง
 *
 * useSyncExternalStore เพื่อให้ค่าฝั่งเซิร์ฟเวอร์เป็น false เสมอ ไม่ชนกับ hydration
 */
export function useNarrowScreen() {
  const { framed, device } = useDevicePreview();
  const wide = React.useSyncExternalStore(
    subscribeWide,
    () => window.matchMedia(WIDE).matches,
    () => true
  );
  return framed ? device === "mobile" : !wide;
}

const WIDE = "(min-width: 768px)";

function subscribeWide(onChange: () => void) {
  const mq = window.matchMedia(WIDE);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

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
 * hidden  = กำลังเลื่อนลง ใช้ซ่อนแถบเครื่องมือให้เห็นเนื้อหาเต็ม ๆ
 * showTop = เลื่อนลงมาไกลแล้ว ควรมีปุ่มกลับขึ้นบนสุด
 */
export function useScrollState({ hideAfter = 160, topAfter = 700 } = {}) {
  const { framed, frameRef } = useDevicePreview();
  const [state, setState] = React.useState({ hidden: false, showTop: false });

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

  /** เลื่อนให้หัวของ el มาอยู่ใต้ขอบบน โดยเว้นระยะ offset ให้แถบที่ติดบน */
  const scrollIntoTop = React.useCallback(
    (el: HTMLElement, offset = 0) => {
      const frame = framed ? frameRef.current : null;
      if (frame) {
        const top =
          el.getBoundingClientRect().top -
          frame.getBoundingClientRect().top +
          frame.scrollTop -
          offset;
        frame.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
      } else {
        const top = el.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
      }
    },
    [framed, frameRef]
  );

  return { ...state, scrollToTop, scrollIntoTop };
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
