"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { CheckIcon, ChevronDownIcon, PlusIcon, SearchIcon } from "lucide-react";
import { Button } from "@peckey954/ui/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@peckey954/ui/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@peckey954/ui/components/ui/dialog";
import { Input } from "@peckey954/ui/components/ui/input";
import { Textarea } from "@peckey954/ui/components/ui/textarea";
import { Label } from "@peckey954/ui/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@peckey954/ui/components/ui/popover";
import { cn } from "@peckey954/ui/lib/utils";
import { toast } from "sonner";
import {
  QI_GROUPS,
  QI_PARAMETERS,
  addGroup,
  addParameter,
  updateParameter,
  paramOf,
  type QiParameter,
} from "@/lib/qc-erp";

/** ป้ายที่ใช้เรียกหัวข้อที่ยังไม่ได้จัดกลุ่ม — ไม่ใช่ชื่อกลุ่มจริง */
const NO_GROUP = "ยังไม่จัดกลุ่ม";

/**
 * กล่องทะเบียนอยู่คนละไฟล์และไฟล์นั้น import ParamQuickAdd จากที่นี่กลับมา
 * โหลดแบบขี้เกียจจึงตัดวงไม่ให้สองไฟล์เรียกกันไปมาตอนโมดูลเริ่มทำงาน
 */
const ParamRegistryDialog = dynamic(
  () => import("@/components/qc/param-registry").then((m) => m.ParamRegistryDialog),
  { ssr: false }
);

/* ------------------------------------------------------------------
   ช่องเลือกหัวข้อตรวจ — พิมพ์ค้นหาได้ ไม่เจอก็สร้างใหม่ตรงนั้น

   ตรงกับพฤติกรรมของ Link field ใน Frappe ที่พิมพ์ชื่อที่ยังไม่มีแล้วขึ้น
   "Create a new ..." ให้กดสร้าง ไม่ใช่ตันอยู่แค่ของที่มี

   ที่ต้องเป็นช่องค้นหา ไม่ใช่ช่องพิมพ์เปล่า ๆ เพราะของเดิมพิมพ์อิสระแล้ว
   "ความชื้น" กับ "ค่าความชื้น" กลายเป็นคนละหัวข้อ รายงานรวมกันไม่ได้
   ให้เห็นของที่มีอยู่ก่อนเสมอ แล้วปุ่มสร้างใหม่อยู่ท้ายรายการ คนจึงเลือกของเดิม
   โดยไม่ต้องตั้งใจ และยังสร้างใหม่ได้เมื่อไม่มีจริง ๆ

   ตอนสร้างถามกลุ่มด้วย เพราะกลุ่มเป็นของที่ ERPNext เก็บแยก
   (Quality Inspection Parameter Group) ไม่ใช่ข้อความในชื่อหัวข้อ
------------------------------------------------------------------ */

export function ParamCombobox({
  id,
  value,
  onChange,
}: {
  id: string;
  /** id ของหัวข้อในทะเบียน — ว่าง = ยังไม่ได้เลือก */
  value: string;
  onChange: (parameterId: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [adding, setAdding] = React.useState(false);
  const [browsing, setBrowsing] = React.useState(false);
  const listId = React.useId();

  const selected = paramOf(value);
  const q = search.trim().toLowerCase();
  const matches = QI_PARAMETERS.filter(
    (p) => !q || p.name.toLowerCase().includes(q) || p.group.toLowerCase().includes(q)
  );
  const exact = QI_PARAMETERS.some(
    (p) => p.name.trim().toLowerCase() === q && q !== ""
  );

  // เรียงตามกลุ่ม ไม่ใช่เรียงตามลำดับที่สร้าง — คนหาหัวข้อจากกลุ่มที่มันสังกัด
  // หัวข้อที่ยังไม่จัดกลุ่มไปรวมอยู่ถังท้ายสุด ไม่ใช่หายไปจากรายการ
  const groups = QI_GROUPS.filter((g) => matches.some((p) => p.group === g));
  const ungrouped = matches.filter((p) => !p.group);

  /**
   * แถวที่ไฮไลต์อยู่
   *
   * cmdk ไฮไลต์แถวแรกของรายการให้เอง ซึ่งตอนนี้คือปุ่มเพิ่ม — พิมพ์แล้วเคาะ
   * เอ็นเทอร์จะได้กล่องสร้างใหม่ทุกครั้ง ทั้งที่ของที่พิมพ์หาอยู่ในรายการแล้ว
   * จึงบังคับให้ไฮไลต์ผลค้นหาตัวแรกแทน
   *
   * ที่ผู้ใช้เลื่อนเลือกเองยังชนะ แต่เฉพาะตอนที่มันยังอยู่ในรายการ พิมพ์ต่อ
   * จนตัวที่เลือกไว้หลุดออกจากผลค้นหา ไฮไลต์จะกลับไปเกาะตัวแรกเอง
   */
  const fallback = matches[0]?.id ?? "__new__";
  const [picked, setPicked] = React.useState("");
  const active =
    picked === "__new__" ||
    picked === "__browse__" ||
    matches.some((p) => p.id === picked)
      ? picked
      : fallback;

  return (
    <>
      <Popover
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setSearch("");
        }}
      >
        <PopoverTrigger asChild>
          <button
            id={id}
            type="button"
            role="combobox"
            aria-expanded={open}
            aria-controls={listId}
            data-state={open ? "open" : "closed"}
            className={cn(
              "flex h-9 w-full items-center justify-between gap-2 rounded-md border border-input bg-card px-3 py-1.5 text-sm shadow-xs outline-none transition-[color,box-shadow]",
              "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
              "data-[state=open]:border-ring data-[state=open]:ring-[3px] data-[state=open]:ring-ring/50"
            )}
          >
            <span
              className={cn(
                "truncate text-left",
                !selected && "text-muted-foreground"
              )}
            >
              {selected
                ? selected.group
                  ? `${selected.name} · ${selected.group}`
                  : selected.name
                : "พิมพ์ค้นหาหรือเลือกหัวข้อตรวจ"}
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
          <Command shouldFilter={false} value={active} onValueChange={setPicked}>
            <CommandInput
              value={search}
              onValueChange={setSearch}
              placeholder="พิมพ์ชื่อหัวข้อ"
            />
            <CommandList className="max-h-72">
              {/* ไม่เจอแล้วยังต้องมีทางไปต่อ — ปุ่มสร้างอยู่บนสุดเสมอ
                  CommandEmpty จึงบอกแค่ว่าไม่เจอ ไม่ได้เป็นทางตัน */}
              <CommandEmpty>ไม่พบหัวข้อที่ค้นหา</CommandEmpty>

              {/* ปุ่มเพิ่มอยู่อันแรก ไม่ใช่ท้ายรายการ — ถึงจะต่างจาก Frappe
                  แต่คนที่พิมพ์ชื่อที่ยังไม่มีจะเห็นทางไปต่อทันทีโดยไม่ต้องกวาดตา
                  ลงไปสุดรายการ

                  แถวที่ไฮไลต์ไว้ยังเป็นผลค้นหาตัวแรกเสมอ (ดู active ข้างล่าง)
                  เคาะเอ็นเทอร์รัว ๆ จึงยังได้ของที่มีอยู่ ไม่ใช่เด้งกล่องสร้างใหม่ */}
              {!exact && (
                <CommandGroup>
                  <CommandItem
                    value="__new__"
                    onSelect={() => {
                      setOpen(false);
                      setAdding(true);
                    }}
                  >
                    <PlusIcon className="size-4" />
                    <span className="truncate">
                      {q === ""
                        ? "เพิ่มหัวข้อตรวจใหม่"
                        : `เพิ่ม “${search.trim()}” เป็นหัวข้อใหม่`}
                    </span>
                  </CommandItem>
                </CommandGroup>
              )}
              {groups.map((g) => (
                <CommandGroup key={g} heading={g}>
                  {matches
                    .filter((p) => p.group === g)
                    .map((p) => (
                      <CommandItem
                        key={p.id}
                        value={p.id}
                        onSelect={() => {
                          onChange(p.id);
                          setOpen(false);
                          setSearch("");
                        }}
                      >
                        <CheckIcon
                          className={cn(
                            "size-4",
                            p.id === value ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <span className="flex-1 truncate">{p.name}</span>
                        {p.unit && (
                          <span className="text-xs text-muted-foreground">
                            {p.unit}
                          </span>
                        )}
                      </CommandItem>
                    ))}
                </CommandGroup>
              ))}

              {ungrouped.length > 0 && (
                <CommandGroup heading={NO_GROUP}>
                  {ungrouped.map((p) => (
                    <CommandItem
                      key={p.id}
                      value={p.id}
                      onSelect={() => {
                        onChange(p.id);
                        setOpen(false);
                        setSearch("");
                      }}
                    >
                      <CheckIcon
                        className={cn(
                          "size-4",
                          p.id === value ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <span className="flex-1 truncate">{p.name}</span>
                      {p.unit && (
                        <span className="text-xs text-muted-foreground">
                          {p.unit}
                        </span>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {/* ตรงกับ Advanced Search ของ Link field ใน Frappe — ทางออกสำหรับ
                  ตอนทะเบียนยาวจนพิมพ์หาไม่ถูก โดยไม่ต้องมีแท็บทะเบียนแยก */}
              <CommandGroup>
                <CommandItem
                  value="__browse__"
                  onSelect={() => {
                    setOpen(false);
                    setBrowsing(true);
                  }}
                >
                  <SearchIcon className="size-4" />
                  <span>ดูทั้งทะเบียน</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {QI_PARAMETERS.length} หัวข้อ
                  </span>
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {browsing && (
        <ParamRegistryDialog
          onClose={() => setBrowsing(false)}
          onPick={(id) => {
            onChange(id);
            setSearch("");
          }}
        />
      )}

      {adding && (
        <ParamQuickAdd
          defaultName={search.trim()}
          onClose={() => {
            setAdding(false);
            setSearch("");
          }}
          onCreated={(p) => onChange(p.id)}
        />
      )}
    </>
  );
}

/* ------------------------------------------------------------------
   สร้างหัวข้อใหม่ลงทะเบียน — ตรงกับ quick entry ของ Frappe
   ถามสามช่องเท่าที่ทะเบียนเก็บจริง ไม่ถามเกณฑ์ เพราะเกณฑ์เป็นของฟอร์ม
   หัวข้อเดียวกันอยู่คนละฟอร์มมีเกณฑ์ต่างกันได้ — วัตถุดิบคนละตัวรับความชื้นไม่เท่ากัน
------------------------------------------------------------------ */

export function ParamQuickAdd({
  defaultName = "",
  editing,
  onClose,
  onCreated,
}: {
  defaultName?: string;
  /** ส่งมาเมื่อเปิดเพื่อแก้ของเดิม ไม่ส่ง = สร้างใหม่ */
  editing?: QiParameter;
  onClose: () => void;
  onCreated?: (p: QiParameter) => void;
}) {
  const [name, setName] = React.useState(editing?.name ?? defaultName);
  // เริ่มที่ "ยังไม่จัดกลุ่ม" ไม่ใช่กลุ่มแรกในรายการ — ตั้งค่าเริ่มต้นเป็นกลุ่มใด
  // กลุ่มหนึ่งแปลว่าคนที่กดผ่านเร็ว ๆ จะได้หัวข้อที่อยู่ผิดกลุ่มโดยไม่รู้ตัว
  const [group, setGroup] = React.useState(editing?.group ?? "");
  const [unit, setUnit] = React.useState(editing?.unit ?? "");
  const [description, setDescription] = React.useState(
    editing?.description ?? ""
  );

  const create = () => {
    const trimmed = name.trim();
    if (trimmed === "") {
      toast.error("กรุณาตั้งชื่อหัวข้อตรวจ");
      return;
    }
    // ชื่อซ้ำในทะเบียนคือต้นเหตุที่รายงานรวมกันไม่ได้ กันตั้งแต่ตอนสร้าง
    const dup = QI_PARAMETERS.find(
      (p) =>
        p.id !== editing?.id &&
        p.name.trim().toLowerCase() === trimmed.toLowerCase()
    );
    if (dup) {
      toast.error(
        dup.group
          ? `“${dup.name}” มีอยู่แล้วในกลุ่ม ${dup.group}`
          : `“${dup.name}” มีอยู่แล้วในทะเบียน`
      );
      onCreated?.(dup);
      onClose();
      return;
    }
    if (editing) {
      updateParameter(editing.id, {
        name: trimmed,
        group,
        unit: unit.trim(),
        description: description.trim() || undefined,
      });
      onCreated?.({ ...editing, name: trimmed, group, unit: unit.trim() });
      onClose();
      toast.success(`แก้ “${trimmed}” แล้ว`, {
        description:
          trimmed !== editing.name
            ? "เปลี่ยนชื่อหัวข้อ — ของจริงต้อง rename เอกสารให้ Frappe ตามไปแก้ลิงก์ในใบตรวจเก่าด้วย"
            : undefined,
      });
      return;
    }
    const p = addParameter({
      name: trimmed,
      group,
      unit: unit.trim(),
      description: description.trim() || undefined,
    });
    onCreated?.(p);
    onClose();
    toast.success(`เพิ่ม “${p.name}” ในทะเบียนแล้ว`, {
      description: `${p.group ? `กลุ่ม ${p.group}` : NO_GROUP}${
        p.unit ? ` · หน่วย ${p.unit}` : ""
      }`,
    });
  };

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {editing ? "แก้ไขหัวข้อตรวจ" : "เพิ่มหัวข้อตรวจใหม่"}
          </DialogTitle>
          <DialogDescription>
            เก็บแค่ชื่อ กลุ่ม และหน่วย — เกณฑ์ผ่าน/ไม่ผ่านไปตั้งในฟอร์มแต่ละอัน
            เพราะวัตถุดิบคนละตัวใช้เกณฑ์ไม่เท่ากัน
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="qa-name">ชื่อหัวข้อตรวจ</Label>
            <Input
              id="qa-name"
              autoFocus
              className="bg-card"
              placeholder="เช่น ค่าความเป็นกรด-ด่าง"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <p className="font-mono text-xs text-muted-foreground">
              specification · ชื่อนี้คือ ID ของเอกสารในทะเบียน
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="qa-group">
              กลุ่ม{" "}
              <span className="font-normal text-muted-foreground">
                (ไม่บังคับ)
              </span>
            </Label>
            <GroupCombobox id="qa-group" value={group} onChange={setGroup} />
            <p className="font-mono text-xs text-muted-foreground">
              parameter_group · เก็บแยกเป็นอีก doctype ไม่ใช่ข้อความในชื่อ
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="qa-unit">
              หน่วย{" "}
              <span className="font-normal text-muted-foreground">(ไม่บังคับ)</span>
            </Label>
            <Input
              id="qa-unit"
              className="bg-card"
              placeholder="เช่น % หรือ กก."
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
            />
            <p className="font-mono text-xs text-muted-foreground">
              ไม่มีใน ERPNext · custom field
            </p>
          </div>

          {/* คำอธิบายกลางของหัวข้อ ใช้ร่วมทุกฟอร์ม จึงเขียนได้แค่สิ่งที่จริงทุกฟอร์ม
              เช่นวิธีวัด ส่วนตัวเลขเกณฑ์ไปเขียนที่แถวของแต่ละฟอร์ม */}
          <div className="space-y-1.5">
            <Label htmlFor="qa-desc">
              คำอธิบายหัวข้อ{" "}
              <span className="font-normal text-muted-foreground">(ไม่บังคับ)</span>
            </Label>
            <Textarea
              id="qa-desc"
              className="bg-card"
              rows={2}
              placeholder="เช่น วัดด้วยเครื่องวัดความชื้นแบบเข็มเสียบ"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <p className="font-mono text-xs text-muted-foreground">
              description · ใช้ร่วมทุกฟอร์ม ตัวเลขเกณฑ์เขียนที่แถวของแต่ละฟอร์ม
            </p>
          </div>
        </div>

        <DialogFooter className="grid grid-cols-2 gap-3">
          <Button variant="outline-primary" onClick={onClose}>
            ยกเลิก
          </Button>
          <Button onClick={create}>
            {editing ? "บันทึก" : "เพิ่มในทะเบียน"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------
   ช่องกลุ่ม — เลือกของเดิม พิมพ์สร้างใหม่ หรือไม่ใส่เลยก็ได้

   ERPNext ไม่ได้แถมกลุ่มมาให้สักตัว ผู้ใช้สร้างเองทั้งหมด รายการที่เห็นจึงเป็น
   แค่ค่าตั้งต้น ไม่ใช่รายการปิด — ถ้าพิมพ์เพิ่มไม่ได้ คนจะไปยัดชื่อกลุ่มไว้ใน
   ชื่อหัวข้อแทน ("เคมี - ความชื้น") ซึ่งพังตรงที่รายงานกรองตามกลุ่มไม่ได้
------------------------------------------------------------------ */
function GroupCombobox({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string;
  onChange: (group: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [adding, setAdding] = React.useState(false);
  const listId = React.useId();

  const q = search.trim().toLowerCase();
  const matches = QI_GROUPS.filter((g) => !q || g.toLowerCase().includes(q));
  const exact = QI_GROUPS.some((g) => g.toLowerCase() === q && q !== "");

  const pick = (g: string) => {
    onChange(g);
    setOpen(false);
    setSearch("");
  };

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setSearch("");
      }}
    >
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          data-state={open ? "open" : "closed"}
          className={cn(
            "flex h-9 w-full items-center justify-between gap-2 rounded-md border border-input bg-card px-3 py-1.5 text-sm shadow-xs outline-none transition-[color,box-shadow]",
            "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
            "data-[state=open]:border-ring data-[state=open]:ring-[3px] data-[state=open]:ring-ring/50"
          )}
        >
          <span className={cn("truncate text-left", !value && "text-muted-foreground")}>
            {value || NO_GROUP}
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
            value={search}
            onValueChange={setSearch}
            placeholder="พิมพ์ชื่อกลุ่ม"
          />
          <CommandList className="max-h-64">
            <CommandEmpty>ไม่พบกลุ่มที่ค้นหา</CommandEmpty>

            {/* ปุ่มเพิ่มอยู่อันแรกเสมอเหมือนช่องหัวข้อตรวจ — โชว์เฉพาะตอนพิมพ์
                แล้วคนที่เปิดดรอปดาวน์มาเฉย ๆ จะไม่รู้ว่าสร้างกลุ่มใหม่ได้ */}
            {!exact && (
              <CommandGroup>
                <CommandItem
                  value="__newgroup__"
                  onSelect={() => {
                    setOpen(false);
                    setAdding(true);
                  }}
                >
                  <PlusIcon className="size-4" />
                  <span className="truncate">
                    {q === ""
                      ? "เพิ่มกลุ่มใหม่"
                      : `เพิ่มกลุ่ม “${search.trim()}”`}
                  </span>
                </CommandItem>
              </CommandGroup>
            )}

            <CommandGroup>
              {/* ทางเลือก "ไม่จัดกลุ่ม" อยู่บนสุด ไม่ใช่ต้องลบข้อความทิ้งเอง */}
              <CommandItem value="__none__" onSelect={() => pick("")}>
                <CheckIcon
                  className={cn("size-4", value === "" ? "opacity-100" : "opacity-0")}
                />
                <span className="text-muted-foreground">{NO_GROUP}</span>
              </CommandItem>
              {matches.map((g) => (
                <CommandItem key={g} value={g} onSelect={() => pick(g)}>
                  <CheckIcon
                    className={cn("size-4", g === value ? "opacity-100" : "opacity-0")}
                  />
                  {g}
                </CommandItem>
              ))}
            </CommandGroup>

          </CommandList>
        </Command>
      </PopoverContent>

      {adding && (
        <GroupQuickAdd
          defaultName={search.trim()}
          onClose={() => {
            setAdding(false);
            setSearch("");
          }}
          onCreated={onChange}
        />
      )}
    </Popover>
  );
}

/** กล่องเพิ่มกลุ่ม — ช่องเดียว เพราะกลุ่มเก็บแค่ชื่อ */
function GroupQuickAdd({
  defaultName,
  onClose,
  onCreated,
}: {
  defaultName: string;
  onClose: () => void;
  onCreated: (group: string) => void;
}) {
  const [name, setName] = React.useState(defaultName);

  const create = () => {
    if (name.trim() === "") {
      toast.error("กรุณาตั้งชื่อกลุ่ม");
      return;
    }
    const g = addGroup(name);
    onCreated(g);
    onClose();
    toast.success(`เพิ่มกลุ่ม “${g}” แล้ว`);
  };

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>เพิ่มกลุ่มใหม่</DialogTitle>
          <DialogDescription>
            กลุ่มใช้แบ่งหัวข้อในใบตรวจให้อ่านง่าย ใช้ร่วมกันทุกฟอร์ม
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1.5">
          <Label htmlFor="gq-name">ชื่อกลุ่ม</Label>
          <Input
            id="gq-name"
            autoFocus
            className="bg-card"
            placeholder="เช่น จุลชีววิทยา"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") create();
            }}
          />
          <p className="font-mono text-xs text-muted-foreground">
            Quality Inspection Parameter Group
          </p>
        </div>

        <DialogFooter className="grid grid-cols-2 gap-3">
          <Button variant="outline-primary" onClick={onClose}>
            ยกเลิก
          </Button>
          <Button onClick={create}>เพิ่มกลุ่ม</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
