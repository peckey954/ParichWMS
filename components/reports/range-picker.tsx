"use client";

import * as React from "react";
import { CalendarIcon, ChevronDownIcon } from "lucide-react";
import { Button } from "@peckey954/ui/components/ui/button";
import { Input } from "@peckey954/ui/components/ui/input";
import { Label } from "@peckey954/ui/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@peckey954/ui/components/ui/popover";
import { Separator } from "@peckey954/ui/components/ui/separator";
import { cn } from "@peckey954/ui/lib/utils";
import {
  PRESETS,
  TODAY,
  formatRange,
  presetRange,
  type PresetId,
  type Range,
} from "@/lib/reports";

/* ------------------------------------------------------------------
   ตัวเลือกช่วงวันที่

   งานบัญชีคิดเป็นงวด ไม่ใช่เป็นวัน ตัวเลือกสำเร็จรูปจึงมาก่อน
   และค่าเริ่มต้นคือ "เดือนที่แล้ว" เพราะงานหลักของหน้านี้คือปิดงวด
   ตอนต้นเดือน ถ้าตั้งเป็นเดือนนี้จะได้ข้อมูลไม่ครบงวดแทบทุกครั้ง

   ช่องกรอกวันที่ใช้ input type=date ของเบราว์เซอร์
   พิมพ์ด้วยแป้นตัวเลขได้เลย เร็วกว่าจิ้มปฏิทินสำหรับคนที่ทำทุกวัน
------------------------------------------------------------------ */

export function RangePicker({
  preset,
  range,
  onChange,
}: {
  preset: PresetId;
  range: Range;
  onChange: (preset: PresetId, range: Range) => void;
}) {
  const [open, setOpen] = React.useState(false);

  const choose = (id: PresetId) => {
    if (id === "custom") return; // เลือกเองต้องกรอกวันที่ ไม่ใช่กดแล้วจบ
    onChange(id, presetRange(id));
    setOpen(false);
  };

  const setCustom = (part: "from" | "to", value: string) => {
    if (!value) return;
    const next = { ...range, [part]: value };
    // กันกรอกกลับหัว วันเริ่มต้องไม่เกินวันสิ้นสุด
    if (next.from > next.to) {
      if (part === "from") next.to = next.from;
      else next.from = next.to;
    }
    onChange("custom", next);
  };

  const label = PRESETS.find((p) => p.id === preset)?.label ?? "กำหนดเอง";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="justify-start bg-card font-normal">
          <CalendarIcon />
          <span className="truncate">
            <span className="font-medium">{label}</span>
            <span className="ml-2 text-muted-foreground tabular-nums">
              {formatRange(range)}
            </span>
          </span>
          <ChevronDownIcon className="ml-auto" />
        </Button>
      </PopoverTrigger>

      <PopoverContent align="start" className="w-80 p-0">
        <div className="p-2">
          {PRESETS.filter((p) => p.id !== "custom").map((p) => {
            const r = presetRange(p.id);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => choose(p.id)}
                aria-current={preset === p.id ? "true" : undefined}
                className={cn(
                  "flex w-full items-baseline justify-between gap-3 rounded-lg px-2 py-2 text-left text-sm",
                  "transition-colors hover:bg-accent",
                  "focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
                  preset === p.id && "bg-brand font-semibold text-primary hover:bg-brand"
                )}
              >
                <span>{p.label}</span>
                <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                  {formatRange(r)}
                </span>
              </button>
            );
          })}
        </div>

        <Separator />

        <div className="p-3">
          <p className="text-sm font-medium">กำหนดเอง</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label htmlFor="range-from" className="text-xs">
                ตั้งแต่
              </Label>
              <Input
                id="range-from"
                type="date"
                max={TODAY}
                value={range.from}
                onChange={(e) => setCustom("from", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="range-to" className="text-xs">
                ถึง
              </Label>
              <Input
                id="range-to"
                type="date"
                max={TODAY}
                value={range.to}
                onChange={(e) => setCustom("to", e.target.value)}
              />
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
