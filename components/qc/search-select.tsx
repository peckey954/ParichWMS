"use client";

import * as React from "react";
import { CheckIcon, ChevronDownIcon, PlusIcon } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@peckey954/ui/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@peckey954/ui/components/ui/popover";
import { cn } from "@peckey954/ui/lib/utils";

/* ------------------------------------------------------------------
   ช่องเลือกอันเดียวที่พิมพ์ค้นได้ — หน้าตาเดียวกับ Select ของ DS

   Select ของ DS ค้นไม่ได้ ใช้ได้กับรายการสั้นที่กวาดตาจบ ส่วนช่องนี้ใช้กับ
   รายการที่ยาวขึ้นได้เรื่อย ๆ เช่นประเภทรายงานที่ผู้ใช้เพิ่มเอง

   onCreate ใส่มาเมื่อไหร่ แถวบนสุดคือ "เพิ่ม…ใหม่" — พิมพ์ชื่อที่ยังไม่มีแล้ว
   กดได้เลย ไม่ต้องออกไปหน้าอื่นก่อนแล้วค่อยกลับมาเลือก
------------------------------------------------------------------ */

export type SearchOption = { value: string; label: string };

export function SearchSelect({
  id,
  value,
  options,
  onChange,
  placeholder = "เลือก",
  disabled,
  createLabel,
  onCreate,
}: {
  id?: string;
  value: string;
  options: SearchOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  /** ป้ายของแถวสร้างใหม่ตอนยังไม่ได้พิมพ์อะไร เช่น "เพิ่มประเภทใหม่" */
  createLabel?: string;
  /** สร้างของใหม่จากคำที่พิมพ์ — คืน value ของตัวที่สร้าง */
  onCreate?: (label: string) => string;
}) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  // กดแถวเพิ่มใหม่ตอนยังไม่ได้พิมพ์ — ไม่มีชื่อให้สร้าง เปลี่ยนช่องค้นเป็นช่องตั้งชื่อแทน
  const [naming, setNaming] = React.useState(false);
  const listId = React.useId();
  const inputId = React.useId();

  const selected = options.find((o) => o.value === value);
  const q = search.trim().toLowerCase();
  const matches = options.filter((o) => !q || o.label.toLowerCase().includes(q));
  const exact = options.some((o) => o.label.toLowerCase() === q);

  const pick = (v: string) => {
    onChange(v);
    setOpen(false);
    setSearch("");
    setNaming(false);
  };

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setSearch("");
          setNaming(false);
        }
      }}
    >
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          disabled={disabled}
          className={cn(
            "flex h-9 w-full items-center justify-between gap-2 rounded-md border border-input bg-card px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow]",
            "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
            "data-[state=open]:border-ring data-[state=open]:ring-[3px] data-[state=open]:ring-ring/50",
            "disabled:cursor-not-allowed disabled:opacity-50"
          )}
        >
          <span
            className={cn("truncate text-left", !selected && "text-muted-foreground")}
          >
            {selected ? selected.label : placeholder}
          </span>
          <ChevronDownIcon
            className={cn(
              "size-4 shrink-0 text-muted-foreground transition-transform",
              open && "rotate-180"
            )}
          />
        </button>
      </PopoverTrigger>

      <PopoverContent
        id={listId}
        align="start"
        className="w-(--radix-popover-trigger-width) min-w-(--radix-popover-trigger-width) p-0"
      >
        <Command shouldFilter={false}>
          <CommandInput
            id={inputId}
            value={search}
            onValueChange={setSearch}
            placeholder={naming ? "พิมพ์ชื่อที่จะเพิ่ม" : "ค้นหา"}
          />
          <CommandList className="max-h-72">
            <CommandEmpty>ไม่พบรายการที่ค้นหา</CommandEmpty>
            {onCreate && !exact && (
              <CommandGroup>
                <CommandItem
                  value="__new__"
                  onSelect={() => {
                    if (q !== "") return pick(onCreate(search.trim()));
                    setNaming(true);
                    document.getElementById(inputId)?.focus();
                  }}
                >
                  <PlusIcon className="size-4" />
                  <span className="truncate">
                    {q === ""
                      ? (createLabel ?? "เพิ่มใหม่")
                      : `เพิ่ม “${search.trim()}”`}
                  </span>
                </CommandItem>
              </CommandGroup>
            )}
            {matches.length > 0 && (
              <CommandGroup>
                {matches.map((o) => (
                  <CommandItem key={o.value} value={o.value} onSelect={() => pick(o.value)}>
                    <span className="flex-1 truncate">{o.label}</span>
                    <CheckIcon
                      className={cn(
                        "size-4",
                        o.value === value ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
