"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@peckey954/ui/components/ui/tooltip";
import { cn } from "@peckey954/ui/lib/utils";

/**
 * Tooltip แบบพื้นขาว ขอบเทา ตัวอักษรดำ ให้เหมือนกล่องลอยอื่น ๆ ในระบบ
 *
 * ค่าเริ่มต้นของ DS เป็นพื้นเข้มตัวอักษรขาว (bg-foreground / text-background)
 * ที่นี่จึงเขียนทับด้วย token ของ popover ซึ่งเป็นชุดสีที่ DS ใช้กับ
 * Popover / Dropdown / Select อยู่แล้ว ป๊อปอัปทุกแบบจะได้หน้าตาเดียวกัน
 *
 * หัวลูกศรอยู่ข้างในตัว TooltipContent เลยเข้าถึงได้ทางลูกที่เป็น svg
 * ต้องเปลี่ยนทั้ง background และ fill เพราะ DS ใส่ไว้ทั้งสองอย่าง
 */
const LIGHT = cn(
  "border border-border bg-popover text-popover-foreground shadow-md",
  "[&_svg]:bg-popover [&_svg]:fill-popover"
);

export function LightTooltip({
  label,
  side = "right",
  children,
}: {
  label: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side={side} sideOffset={6} className={LIGHT}>
        {label}
      </TooltipContent>
    </Tooltip>
  );
}
