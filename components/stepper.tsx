"use client";

import { MinusIcon, PlusIcon } from "lucide-react";
import { Input } from "@peckey954/ui/components/ui/input";
import { Label } from "@peckey954/ui/components/ui/label";
import { cn } from "@peckey954/ui/lib/utils";

/* ------------------------------------------------------------------
   ช่องตัวเลขที่มีปุ่มลบ/บวก

   ใช้กับจำนวนที่คนคิดเป็น "เพิ่มอีกหนึ่ง" ไม่ใช่จำนวนที่พิมพ์ทีเดียวจบ
   เช่นจำนวนครั้งที่ตรวจ หรือจำนวนแถวที่เพิ่มได้ ซึ่งอยู่แถว ๆ 1–20
   พิมพ์เองก็ได้ แต่ส่วนใหญ่กดปุ่มเร็วกว่า
------------------------------------------------------------------ */

export function Stepper({
  label,
  value,
  min,
  max,
  onChange,
  className,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  className?: string;
}) {
  const clamp = (v: number) => Math.min(max, Math.max(min, v));
  const id = `stepper-${label}`;

  return (
    <div className={className}>
      <Label htmlFor={id} className="text-sm font-normal text-muted-foreground">
        {label}
      </Label>
      <div className="mt-2 flex items-center rounded-md border border-border bg-card">
        <StepButton
          label={`ลด${label}`}
          disabled={value <= min}
          onClick={() => onChange(clamp(value - 1))}
        >
          <MinusIcon />
        </StepButton>
        <Input
          id={id}
          type="number"
          value={value}
          min={min}
          max={max}
          onChange={(e) => onChange(clamp(Number(e.target.value) || min))}
          className="h-10 min-w-0 flex-1 border-0 bg-transparent text-center tabular-nums shadow-none focus-visible:ring-0"
        />
        <StepButton
          label={`เพิ่ม${label}`}
          disabled={value >= max}
          onClick={() => onChange(clamp(value + 1))}
        >
          <PlusIcon />
        </StepButton>
      </div>
    </div>
  );
}

function StepButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex size-10 shrink-0 items-center justify-center rounded-md text-muted-foreground",
        "transition-colors hover:text-foreground disabled:opacity-40",
        "focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
        "[&_svg]:size-4"
      )}
    >
      {children}
    </button>
  );
}
