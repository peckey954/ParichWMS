"use client";

import * as React from "react";
import { ChevronDownIcon, ChevronRightIcon, XIcon } from "lucide-react";
import { Badge } from "@peckey954/ui/components/ui/badge";
import { Checkbox } from "@peckey954/ui/components/ui/checkbox";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@peckey954/ui/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@peckey954/ui/components/ui/popover";
import { cn } from "@peckey954/ui/lib/utils";

/* ------------------------------------------------------------------
   multi-select แบบสองชั้น (กลุ่ม → รายการย่อย) — ตามแบบหน้าพิมพ์บาร์โค้ด
   ที่เลือก Lot แล้วกางดูป้ายแต่ละใบข้างใน

   หน้าตาและพฤติกรรมตาม MultiSelect ของ DS ทุกอย่าง (ช่องค้นหา, เลือกทั้งหมด,
   ตัวเลขนับมุมขวา) และล็อกกล่องเป็นแถวเดียวแบบ MultiSelectChips
   ค่าที่เลือกคือรายการย่อยเท่านั้น — ติ๊กกลุ่ม = ติ๊กลูกทุกใบที่เห็นอยู่
   ชิปบนกล่องยุบเป็นหนึ่งชิปต่อกลุ่ม กด ✕ แล้วเอาลูกของกลุ่มนั้นออกทั้งหมด
------------------------------------------------------------------ */

export type TreeOption = {
  value: string;
  label: string;
  badge?: React.ReactNode;
  description?: React.ReactNode;
  meta?: React.ReactNode;
};

export type TreeGroup = TreeOption & { children: TreeOption[] };

const text = (o: TreeOption) =>
  [o.label, typeof o.description === "string" ? o.description : ""].join(" ").toLowerCase();

export function TreeMultiSelect({
  groups,
  value,
  onValueChange,
  placeholder = "เลือกรายการ",
  searchPlaceholder = "ค้นหา",
  emptyText = "ไม่พบรายการที่ค้นหา",
  selectAllLabel = "ทั้งหมด",
  selectAllMeta,
  id,
  className,
  invalid,
}: {
  groups: TreeGroup[];
  value: string[];
  onValueChange: (value: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  selectAllLabel?: string;
  selectAllMeta?: React.ReactNode;
  id?: string;
  className?: string;
  invalid?: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [expanded, setExpanded] = React.useState<Set<string>>(new Set());
  const selected = React.useMemo(() => new Set(value), [value]);

  // ค้นเจอที่กลุ่ม = เห็นลูกทั้งหมด / เจอที่ลูก = เห็นเฉพาะลูกที่ตรง
  const q = search.trim().toLowerCase();
  const visible = React.useMemo(
    () =>
      groups.flatMap((g) => {
        if (!q || text(g).includes(q)) return [g];
        const kids = g.children.filter((c) => text(c).includes(q));
        return kids.length ? [{ ...g, children: kids }] : [];
      }),
    [groups, q]
  );
  const inView = visible.flatMap((g) => g.children.map((c) => c.value));
  const pickedInView = inView.filter((v) => selected.has(v));
  const state = (vals: string[]) => {
    const n = vals.filter((v) => selected.has(v)).length;
    return n === 0 ? false : n === vals.length ? true : ("indeterminate" as const);
  };

  const setMany = (vals: string[], on: boolean) => {
    if (on) onValueChange([...value, ...vals.filter((v) => !selected.has(v))]);
    else {
      const drop = new Set(vals);
      onValueChange(value.filter((v) => !drop.has(v)));
    }
  };
  const toggleOne = (v: string) => setMany([v], !selected.has(v));
  const toggleGroup = (g: TreeGroup) => {
    const vals = g.children.map((c) => c.value);
    setMany(vals, state(vals) !== true);
  };
  const toggleExpand = (gv: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(gv)) next.delete(gv);
      else next.add(gv);
      return next;
    });

  const chips = groups.filter((g) => g.children.some((c) => selected.has(c.value)));

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setSearch("");
      }}
    >
      <PopoverTrigger asChild>
        <div
          id={id}
          role="combobox"
          aria-expanded={open}
          aria-invalid={invalid || undefined}
          tabIndex={0}
          data-state={open ? "open" : "closed"}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setOpen(true);
            }
          }}
          className={cn(
            "flex h-10 w-full cursor-pointer items-center gap-2 rounded-md border border-input bg-transparent px-3 py-1.5 text-sm shadow-xs transition-[color,box-shadow] outline-none",
            "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
            "data-[state=open]:border-ring data-[state=open]:ring-[3px] data-[state=open]:ring-ring/50",
            invalid && "border-danger-strong",
            className
          )}
        >
          <div className="flex min-w-0 flex-1 flex-nowrap items-center gap-1.5 overflow-x-auto">
            {chips.length === 0 ? (
              <span className="text-muted-foreground">{placeholder}</span>
            ) : (
              chips.map((g) => (
                <Badge
                  key={g.value}
                  tone="brand"
                  appearance="outline"
                  className="shrink-0 gap-1 border-primary/40 py-1 pr-1 pl-2 text-primary"
                >
                  <span className="truncate">{g.label}</span>
                  <span
                    role="button"
                    tabIndex={-1}
                    aria-label={`เอา ${g.label} ออก`}
                    className="grid size-4 place-content-center rounded-sm transition-colors hover:bg-primary/10"
                    onPointerDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setMany(g.children.map((c) => c.value), false);
                    }}
                  >
                    <XIcon className="size-3" />
                  </span>
                </Badge>
              ))
            )}
          </div>
          {value.length > 0 && <Badge className="min-w-6 justify-center">{value.length}</Badge>}
          <ChevronDownIcon
            className={cn("size-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")}
          />
        </div>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="w-(--radix-popover-trigger-width) min-w-(--radix-popover-trigger-width) p-0"
      >
        <Command shouldFilter={false}>
          <CommandInput value={search} onValueChange={setSearch} placeholder={searchPlaceholder} />
          <CommandList className="max-h-80">
            <CommandEmpty>{emptyText}</CommandEmpty>
            {inView.length > 0 && (
              <>
                <CommandGroup>
                  <CommandItem value="__all__" onSelect={() => setMany(inView, pickedInView.length !== inView.length)} className="gap-3">
                    <Checkbox checked={state(inView)} tabIndex={-1} aria-hidden className="pointer-events-none" />
                    <span className="flex-1 font-medium">{selectAllLabel}</span>
                    {selectAllMeta != null && <span className="shrink-0 text-sm">{selectAllMeta}</span>}
                  </CommandItem>
                </CommandGroup>
                <CommandSeparator />
              </>
            )}
            <CommandGroup>
              {visible.map((g) => {
                // ค้นหาอยู่ = กางทุกกลุ่มที่เจอ ไม่ต้องกดลูกศรเอง
                const isOpen = Boolean(q) || expanded.has(g.value);
                return (
                  <React.Fragment key={g.value}>
                    <CommandItem value={g.value} onSelect={() => toggleGroup(g)} className="items-start gap-2 py-2.5">
                      <button
                        type="button"
                        aria-label={isOpen ? `ยุบ ${g.label}` : `กาง ${g.label}`}
                        aria-expanded={isOpen}
                        className="-ml-1 grid size-5 shrink-0 place-content-center rounded-sm text-muted-foreground hover:bg-accent"
                        onPointerDown={(e) => e.preventDefault()}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleExpand(g.value);
                        }}
                      >
                        {isOpen ? <ChevronDownIcon className="size-4" /> : <ChevronRightIcon className="size-4" />}
                      </button>
                      <Row option={g} checked={state(g.children.map((c) => c.value))} />
                    </CommandItem>
                    {isOpen &&
                      g.children.map((c) => (
                        <CommandItem
                          key={c.value}
                          value={c.value}
                          onSelect={() => toggleOne(c.value)}
                          className="items-start gap-3 py-2.5 pl-10"
                        >
                          <Row option={c} checked={selected.has(c.value)} />
                        </CommandItem>
                      ))}
                  </React.Fragment>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function Row({ option, checked }: { option: TreeOption; checked: boolean | "indeterminate" }) {
  return (
    <>
      <Checkbox checked={checked} tabIndex={-1} aria-hidden className="pointer-events-none mt-0.5" />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          {option.badge != null && (
            <Badge tone="neutral" appearance="soft">
              {option.badge}
            </Badge>
          )}
          <span className="truncate font-medium">{option.label}</span>
        </div>
        {option.description != null && <span className="text-xs text-muted-foreground">{option.description}</span>}
      </div>
      {option.meta != null && <div className="shrink-0 self-center text-sm">{option.meta}</div>}
    </>
  );
}
