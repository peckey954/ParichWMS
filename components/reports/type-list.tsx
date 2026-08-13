"use client";

import * as React from "react";
import { SearchIcon, StarIcon } from "lucide-react";
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
import { TONE_DOT } from "@/components/modules/module-icon";
import { MODULE_GROUPS } from "@/lib/modules";
import { PINNED_TYPES, REPORT_TYPES, type ReportType } from "@/lib/reports";

/* ------------------------------------------------------------------
   รายการชนิดเอกสาร

   จอกว้างเป็นแถบซ้ายที่ค้างอยู่ตลอด เพราะบัญชีสลับชนิดเอกสารบ่อยมาก
   ถ้าเป็นดรอปดาวน์จะต้องกดเปิดทุกครั้ง ช้ากว่ากันมากเมื่อทำวันละหลายสิบรอบ

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

  const pinned = matched.filter((t) => PINNED_TYPES.includes(t.id));
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
        <div className="sticky top-4 space-y-3">
          <InputGroup className="bg-card">
            <InputGroupAddon align="inline-start">
              <SearchIcon />
            </InputGroupAddon>
            <InputGroupInput
              placeholder="ค้นหาชนิดเอกสาร..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </InputGroup>

          <nav
            aria-label="ชนิดเอกสาร"
            className="max-h-[calc(100dvh-12rem)] overflow-y-auto rounded-xl border border-border bg-card p-2"
          >
            {pinned.length > 0 && (
              <Section
                label="ใช้บ่อย"
                icon={<StarIcon className="size-3.5 shrink-0" />}
              >
                {pinned.map((t) => (
                  <TypeButton
                    key={`pin-${t.id}`}
                    type={t}
                    active={t.id === value}
                    count={counts[t.id] ?? 0}
                    onClick={() => onChange(t.id)}
                  />
                ))}
              </Section>
            )}

            {groups.map((g) => (
              <Section
                key={g.id}
                label={g.label}
                icon={
                  <span
                    className={cn("size-2 shrink-0 rounded-full", TONE_DOT[g.tone])}
                    aria-hidden
                  />
                }
              >
                {g.items.map((t) => (
                  <TypeButton
                    key={t.id}
                    type={t}
                    active={t.id === value}
                    count={counts[t.id] ?? 0}
                    onClick={() => onChange(t.id)}
                  />
                ))}
              </Section>
            ))}

            {matched.length === 0 && (
              <p className="px-2 py-6 text-center text-sm text-muted-foreground">
                ไม่พบชนิดเอกสารที่ค้นหา
              </p>
            )}
          </nav>
        </div>
      </div>
    </>
  );
}

function Section({
  label,
  icon,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-1 last:mb-0">
      <p className="flex items-center gap-1.5 px-2 pt-2 pb-1 text-sm font-medium text-muted-foreground">
        {icon}
        {label}
      </p>
      {children}
    </div>
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
