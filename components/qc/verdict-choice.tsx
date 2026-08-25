"use client";

import { cn } from "@peckey954/ui/lib/utils";

/**
 * ปุ่มผลตรวจ — เขียว/แดง มีวงกลมบอกสถานะในตัว ใช้ร่วมกันทุกที่ที่ต้องกาผลผ่าน/ไม่ผ่าน
 * สีเป็นตัวช่วยกวาดตาหาข้อที่ตก ไม่ใช่ตัวเดียวที่บอกว่าเลือกอะไรไว้ (มีวงกลม + ตัวหนาด้วย)
 *
 * เดิมอยู่ในใบตรวจวัตถุดิบ (RoundCard) ที่เดียว ย้ายมาไว้ตรงนี้เพื่อให้การ์ด
 * preview ของตัวสร้างฟอร์ม (FormPreview) ใช้ปุ่มหน้าตาเดียวกับที่ผู้ตรวจกดจริง
 */
export function VerdictChoice({
  id,
  label,
  on,
  tone,
  onClick,
  className,
}: {
  id: string;
  label: string;
  on: boolean;
  tone: "pass" | "fail" | "skip";
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      id={id}
      type="button"
      role="radio"
      aria-checked={on}
      onClick={onClick}
      className={cn(
        "flex h-11 items-center gap-2 rounded-md border px-3",
        "text-sm whitespace-nowrap transition-colors",
        "focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
        on &&
          tone === "pass" &&
          "border-success-border bg-success font-medium text-success-foreground",
        on &&
          tone === "fail" &&
          "border-danger-border bg-danger font-medium text-danger-foreground",
        on &&
          tone === "skip" &&
          "border-border bg-muted font-medium text-muted-foreground",
        !on && "border-border text-foreground hover:bg-accent-hover",
        className
      )}
    >
      <span
        className={cn(
          "flex size-4 shrink-0 items-center justify-center rounded-full border",
          on ? "border-current" : "border-border"
        )}
      >
        {on && <span className="size-2 rounded-full bg-current" />}
      </span>
      {label}
    </button>
  );
}
