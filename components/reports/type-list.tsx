"use client";

import * as React from "react";
import { SearchIcon } from "lucide-react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@peckey954/ui/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@peckey954/ui/components/ui/select";
import { cn } from "@peckey954/ui/lib/utils";
import { MODULE_GROUPS } from "@/lib/modules";
import { REPORT_TYPES, type ReportType } from "@/lib/reports";

/* ------------------------------------------------------------------
   รายการชนิดเอกสาร

   จอกว้างเป็นแถบซ้ายที่ค้างอยู่ตลอด เพราะบัญชีสลับชนิดเอกสารบ่อยมาก
   ถ้าเป็นดรอปดาวน์จะต้องกดเปิดทุกครั้ง ช้ากว่ากันมากเมื่อทำวันละหลายสิบรอบ

   ช่องค้นหาอยู่ในกล่องเดียวกับรายการ ไม่ลอยอยู่ข้างบน — มันคือเครื่องมือ
   ของรายการนี้อันเดียว ไม่ได้ค้นอย่างอื่นในหน้า อยู่ในกรอบเดียวกันจึงอ่านถูก

   เรียงตามหมวดไปตรง ๆ ไม่มีกลุ่ม "ใช้บ่อย" ปักไว้ข้างบน เพราะชื่อเดียวกัน
   จะโผล่สองที่ในรายการเดียว แล้วนับจำนวนซ้ำจนดูเหมือนมีเอกสารสองชุด

   จอแคบใช้ดรอปดาวน์แทน แถบซ้ายกินความกว้างเกินไป
------------------------------------------------------------------ */

export function TypeList({
  value,
  onChange,
  counts,
}: {
  value: string;
  onChange: (id: string) => void;
  /** จำนวนเอกสารในช่วงวันที่ที่เลือก ใช้บอกว่าเลือกไปแล้วจะเจออะไร */
  counts: Record<string, number>;
}) {
  const [query, setQuery] = React.useState("");

  const matched = React.useMemo(() => {
    const s = query.trim().toLowerCase();
    if (!s) return REPORT_TYPES;
    return REPORT_TYPES.filter(
      (t) =>
        t.label.toLowerCase().includes(s) ||
        t.prefix.toLowerCase().includes(s) ||
        t.code.toLowerCase().includes(s)
    );
  }, [query]);

  const groups = MODULE_GROUPS.map((g) => ({
    ...g,
    items: matched.filter((t) => t.group === g.id),
  })).filter((g) => g.items.length > 0);

  return (
    <>
      {/* ---------- จอแคบ: ดรอปดาวน์ ---------- */}
      <div className="@3xl:hidden">
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger className="w-full bg-card">
            <SelectValue placeholder="เลือกชนิดเอกสาร" />
          </SelectTrigger>
          <SelectContent>
            {MODULE_GROUPS.map((g) => {
              const items = REPORT_TYPES.filter((t) => t.group === g.id);
              if (items.length === 0) return null;
              return (
                <SelectGroup key={g.id}>
                  <SelectLabel>{g.label}</SelectLabel>
                  {items.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.label} ({counts[t.id] ?? 0})
                    </SelectItem>
                  ))}
                </SelectGroup>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      {/* ---------- จอกว้าง: แถบซ้าย ---------- */}
      <div className="hidden @3xl:block">
        {/* ค้างไว้ตอนเลื่อนตาราง จะได้สลับชนิดเอกสารโดยไม่ต้องเลื่อนกลับขึ้นบน */}
        <nav
          aria-label="ชนิดเอกสาร"
          className="sticky top-4 flex max-h-[calc(100dvh-8rem)] flex-col rounded-xl border border-border bg-card p-3"
        >
          <InputGroup className="bg-card">
            <InputGroupAddon align="inline-start">
              <SearchIcon />
            </InputGroupAddon>
            <InputGroupInput
              placeholder="ค้นหาประเภทเอกสาร..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </InputGroup>

          <div className="mt-2 min-h-0 flex-1 overflow-y-auto">
            {groups.map((g) => (
              <div key={g.id} className="mb-1 last:mb-0">
                <p className="px-2 pt-3 pb-1 text-sm font-medium text-muted-foreground">
                  {g.label}
                </p>
                {g.items.map((t) => (
                  <TypeButton
                    key={t.id}
                    type={t}
                    active={t.id === value}
                    count={counts[t.id] ?? 0}
                    onClick={() => onChange(t.id)}
                  />
                ))}
              </div>
            ))}

            {matched.length === 0 && (
              <p className="px-2 py-6 text-center text-sm text-muted-foreground">
                ไม่พบชนิดเอกสารที่ค้นหา
              </p>
            )}
          </div>
        </nav>
      </div>
    </>
  );
}

function TypeButton({
  type,
  active,
  count,
  onClick,
}: {
  type: ReportType;
  active: boolean;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "true" : undefined}
      className={cn(
        "flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left",
        "transition-colors hover:bg-accent",
        "focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
        active && "bg-brand hover:bg-brand"
      )}
    >
      <span className="min-w-0 flex-1">
        <span
          className={cn(
            "block truncate text-sm",
            active ? "font-semibold text-primary" : "font-medium"
          )}
        >
          {type.label}
        </span>
        <span className="block truncate text-xs text-muted-foreground">
          {type.code}
        </span>
      </span>
      {/* จำนวนในช่วงที่เลือก ศูนย์ก็ยังโชว์ จะได้รู้ว่างวดนั้นไม่มีเอกสารจริง ๆ
          ไม่ใช่กดผิดชนิด */}
      <span
        className={cn(
          "shrink-0 text-sm tabular-nums",
          count === 0 ? "text-muted-foreground/60" : "text-muted-foreground"
        )}
      >
        {count}
      </span>
    </button>
  );
}
