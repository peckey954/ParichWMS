"use client";

import * as React from "react";
import { Button } from "@peckey954/ui/components/ui/button";
import { cn } from "@peckey954/ui/lib/utils";

/* ------------------------------------------------------------------
   ปุ่มคำสั่งของหน้าผลิตแบ่งบรรจุ

   ใช้ร่วมกันสองที่
     บนหัวหน้า  — ปุ่มที่กดได้ทุกแท็บ จึงมีสิทธิ์อยู่ระดับหน้า
                  อยู่ที่เดิมตลอด ไม่โผล่มาแล้วหายไปตอนสลับแท็บ
     ใต้แถบแท็บ — ปุ่มที่ใช้ได้เฉพาะแท็บนั้น

   จอแคบเหลือแต่ไอคอน ป้ายชื่อไปอยู่ใน aria-label
   เขียนเป็นสองปุ่มแล้วซ่อนทีละตัว ไม่ใช่วัดความกว้างตอนรัน
   เพราะ container query ทำงานตั้งแต่เฟรมแรก ไม่มีจังหวะกระพริบ
------------------------------------------------------------------ */

export type PackingAction = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  /** ปุ่มหลักของกลุ่ม ใช้สีทึบ */
  primary?: boolean;
  onSelect: () => void;
};

export function ActionButtons({
  actions,
  className,
}: {
  actions: PackingAction[];
  className?: string;
}) {
  if (actions.length === 0) return null;

  return (
    <div className={cn("flex shrink-0 items-center gap-2", className)}>
      {actions.map((a) => {
        const variant = a.primary ? "default" : "outline-primary";
        return (
          <React.Fragment key={a.id}>
            <Button
              variant={variant}
              size="icon"
              aria-label={a.label}
              onClick={a.onSelect}
              className="@3xl:hidden"
            >
              <a.icon className="size-4" />
            </Button>
            <Button
              variant={variant}
              onClick={a.onSelect}
              className="hidden @3xl:inline-flex"
            >
              <a.icon className="size-4" />
              {a.label}
            </Button>
          </React.Fragment>
        );
      })}
    </div>
  );
}
