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

type Ctx = { device: Device; framed: boolean; setDevice: (d: Device) => void };

const DevicePreviewContext = React.createContext<Ctx>({
  device: "desktop",
  framed: false,
  setDevice: () => {},
});

export const useDevicePreview = () => React.useContext(DevicePreviewContext);

export function DevicePreviewProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [device, setDevice] = React.useState<Device>("desktop");
  const value = React.useMemo(
    () => ({ device, framed: device !== "desktop", setDevice }),
    [device]
  );
  return (
    <DevicePreviewContext.Provider value={value}>
      {children}
    </DevicePreviewContext.Provider>
  );
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
  const { device, framed } = useDevicePreview();
  return (
    <div
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
