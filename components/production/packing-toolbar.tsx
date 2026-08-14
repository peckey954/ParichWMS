"use client";

import * as React from "react";
import { EllipsisVerticalIcon, SearchIcon, SlidersHorizontalIcon } from "lucide-react";
import { Button } from "@peckey954/ui/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@peckey954/ui/components/ui/dropdown-menu";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@peckey954/ui/components/ui/input-group";
import { cn } from "@peckey954/ui/lib/utils";

/* ------------------------------------------------------------------
   แถบเครื่องมือของแท็บ

   ปุ่มพวกนี้ใช้ได้เฉพาะแท็บที่เปิดอยู่ จึงต้องอยู่ "ใต้" แถบแท็บ
   ไม่ใช่ข้างชื่อหน้า — ตำแหน่งข้างชื่อหน้าสื่อว่าใช้ได้ทั้งหน้า
   พอความจริงไม่ตรงกับที่ตำแหน่งบอก คนจะสะดุดทุกครั้งที่สลับแท็บ
   และแถบชื่อหน้าจะกระตุกเพราะจำนวนปุ่มไม่เท่ากันในแต่ละแท็บ

   จอแคบไม่มีที่พอสำหรับสามปุ่ม จึงไม่ได้ย้ายที่ แต่ยุบจำนวน
     ปุ่มหลัก 1 ปุ่ม โชว์ตรง ๆ / ที่เหลือเข้าเมนู ⋯
   บางปุ่มไม่มีเหตุผลให้มีบนมือถือเลย (โหลด CSV ลงมือถือแล้วทำอะไรต่อ)
   ตัวนั้นตั้ง desktopOnly ไว้ ไม่ต้องไปกินที่ในเมนู
------------------------------------------------------------------ */

export type TabAction = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  /** ปุ่มเด่นของแท็บนี้ จอแคบจะโชว์ตัวนี้ตัวเดียว */
  primary?: boolean;
  /** ซ่อนบนจอแคบไปเลย ไม่เอาเข้าเมนูด้วย */
  desktopOnly?: boolean;
  onSelect: () => void;
};

export function PackingToolbar({
  query,
  onQuery,
  placeholder,
  actions,
  onFilter,
}: {
  query: string;
  onQuery: (v: string) => void;
  placeholder: string;
  actions: TabAction[];
  onFilter: () => void;
}) {
  const onMobile = actions.filter((a) => !a.desktopOnly);
  const primary = onMobile.find((a) => a.primary) ?? onMobile[0];
  const rest = onMobile.filter((a) => a !== primary);

  return (
    // ความสูงคงที่ทุกแท็บ ไม่ว่าแท็บนั้นจะมีกี่ปุ่ม แถบแท็บด้านบนจะได้ไม่ขยับ
    <div className="flex min-h-14 flex-wrap items-center gap-2">
      <div className="min-w-48 flex-1">
        <InputGroup className="bg-card">
          <InputGroupAddon align="inline-start">
            <SearchIcon />
          </InputGroupAddon>
          <InputGroupInput
            placeholder={placeholder}
            value={query}
            onChange={(e) => onQuery(e.target.value)}
          />
        </InputGroup>
      </div>

      <Button
        variant="outline-primary"
        size="icon"
        aria-label="ตัวกรอง"
        onClick={onFilter}
      >
        <SlidersHorizontalIcon />
      </Button>

      {/* ---------- จอกว้าง: กางทุกปุ่ม ----------
          ปุ่มที่ทำงานกับของจริงอยู่ท้ายสุด ปุ่มปลอดภัยอยู่ริม
          จะได้ไม่กดโดนตอนเล็งปุ่มริมขวา */}
      <div className="hidden items-center gap-2 @3xl:flex">
        {actions.map((a) => (
          <Button
            key={a.id}
            variant={a.primary ? "outline-primary" : "outline"}
            onClick={a.onSelect}
          >
            <a.icon className="size-4" />
            {a.label}
          </Button>
        ))}
      </div>

      {/* ---------- จอแคบ: ปุ่มหลักหนึ่งตัว ที่เหลือเข้าเมนู ---------- */}
      <div className="flex items-center gap-2 @3xl:hidden">
        {primary && (
          <Button variant="outline-primary" onClick={primary.onSelect}>
            <primary.icon className="size-4" />
            {primary.label}
          </Button>
        )}

        {rest.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" aria-label="คำสั่งอื่น">
                <EllipsisVerticalIcon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {rest.map((a) => (
                <DropdownMenuItem key={a.id} onSelect={a.onSelect}>
                  <a.icon className={cn("size-4")} />
                  {a.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}
