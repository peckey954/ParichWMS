"use client";

import * as React from "react";
import { ChevronDownIcon, PlusIcon } from "lucide-react";
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
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@peckey954/ui/components/ui/dialog";
import { Label } from "@peckey954/ui/components/ui/label";
import { MultiSelect } from "@peckey954/ui/components/ui/multi-select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@peckey954/ui/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@peckey954/ui/components/ui/select";
import { cn } from "@peckey954/ui/lib/utils";
import { formatDate, formatNumber, formatTon } from "@/lib/format";
import {
  ADDABLE_MATERIALS,
  LOW_STOCK_TON,
  materialTotalPieces,
  materialTotalTon,
  type AddableMaterial,
  type MaterialLine,
} from "@/lib/production-order";

/* ------------------------------------------------------------------
   เพิ่มวัตถุดิบ/สินค้าเข้าใบผลิต — เลือกไล่ระดับ ประเภท > สินค้า > ล็อต

   เลือก Lot ได้หลายก้อนพร้อมกัน เพราะของจริงมักไม่พอในล็อตเดียว
   คนหน้างานหยิบจากหลายล็อตรวมกันเป็นปกติ ไม่ใช่ข้อยกเว้น

   เปลี่ยนประเภท/สินค้าแล้วล้างตัวเลือกที่อยู่ใต้มันทิ้งเสมอ
   ไม่งั้นจะค้าง Lot ของสินค้าเก่าไว้ทั้งที่หน้าจอเปลี่ยนไปแล้ว

   สินค้าเป็นดรอปดาวน์ค้นหาได้ ไม่ใช่ Select ธรรมดา — ของจริงมีเป็นสิบต่อประเภท
   ไล่กดทีละอันไม่ไหว ต้องพิมพ์ชื่อหาเอา แถมเห็นยอดรวมทั้งหมดต่อแถวก่อนเลือกด้วย
------------------------------------------------------------------ */

export function AddMaterialDialog({
  existingIds,
  onAdd,
}: {
  existingIds: string[];
  onAdd: (line: MaterialLine) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [categoryId, setCategoryId] = React.useState<string | undefined>();
  const [materialId, setMaterialId] = React.useState<string | undefined>();
  const [lotCodes, setLotCodes] = React.useState<string[]>([]);

  const availableMaterials = ADDABLE_MATERIALS.filter(
    (m) => !existingIds.includes(m.id)
  );
  const categories = Array.from(
    new Set(availableMaterials.map((m) => m.category))
  );
  const materialsInCategory = availableMaterials.filter(
    (m) => m.category === categoryId
  );
  const material = availableMaterials.find((m) => m.id === materialId);
  const lotOptions = material?.lotOptions ?? [];
  const selectedLots = lotOptions.filter((l) => lotCodes.includes(l.code));

  const reset = () => {
    setCategoryId(undefined);
    setMaterialId(undefined);
    setLotCodes([]);
  };

  function handleCategoryChange(next: string) {
    setCategoryId(next);
    setMaterialId(undefined);
    setLotCodes([]);
  }

  function handleMaterialChange(next: string) {
    setMaterialId(next);
    setLotCodes([]);
  }

  function handleSave() {
    if (!material || selectedLots.length === 0) return;
    onAdd({
      id: material.id,
      name: material.name,
      sub: material.sub,
      suggestQty: material.suggestQty,
      suggestDigits: material.suggestDigits,
      suggestUnit: material.suggestUnit,
      lots: selectedLots.map((l) => l.code),
      lot: selectedLots[0].code,
      stockQty: selectedLots.reduce((sum, l) => sum + l.pieces, 0),
      tonPerUnit: material.tonPerUnit,
      useQty: 0,
      sweepable: material.sweepable,
      sweepTon: 0,
    });
    reset();
    setOpen(false);
  }

  // รวมยอดของล็อตที่เลือกไว้ — เป็นตันถ้าสินค้านั้นคิดเป็นตัน ไม่งั้นนับเป็นหน่วยแทน
  const totalLabel =
    material?.tonPerUnit === null
      ? `รวมในระบบ (${material.suggestUnit})`
      : "รวมในระบบ (ตัน)";
  const totalValue =
    selectedLots.length === 0
      ? "-"
      : material?.tonPerUnit === null
        ? formatNumber(
            selectedLots.reduce((sum, l) => sum + l.pieces, 0),
            material.suggestDigits
          )
        : formatTon(selectedLots.reduce((sum, l) => sum + l.ton, 0));

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="border-primary text-primary hover:text-primary"
        >
          <PlusIcon />
          เพิ่มสินค้า
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>เพิ่มสินค้า</DialogTitle>
          <DialogDescription className="sr-only">
            เลือกประเภท สินค้า และล็อตที่ต้องการเพิ่มเข้าใบผลิตนี้
          </DialogDescription>
        </DialogHeader>

        {availableMaterials.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            เพิ่มครบทุกรายการที่มีแล้ว
          </p>
        ) : (
          <div className="space-y-4">
            {/* พื้นส้มอ่อนตัดกับฟอร์มด้านล่าง บอกผลรวมของล็อตที่ติ๊กไว้ตอนนี้ */}
            <div className="rounded-lg bg-brand px-4 py-3 text-sm">
              <span className="text-muted-foreground">{totalLabel}: </span>
              <span className="font-semibold tabular-nums">{totalValue}</span>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="am-category">ประเภทสินค้า</Label>
              <Select value={categoryId} onValueChange={handleCategoryChange}>
                <SelectTrigger id="am-category" className="w-full bg-card">
                  <SelectValue placeholder="เลือกประเภทสินค้า" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="am-material">สินค้า</Label>
              <ProductCombobox
                id="am-material"
                materials={materialsInCategory}
                value={materialId}
                onValueChange={handleMaterialChange}
                disabled={!categoryId}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="am-lot">Lot</Label>
              <MultiSelect
                id="am-lot"
                disabled={!materialId}
                options={lotOptions.map((l) => ({
                  value: l.code,
                  label: l.code,
                  badge: l.zone,
                  description: `รับ ${formatDate(l.receivedAt)} · อายุ ${l.ageDays} วัน · ${formatNumber(l.pieces)} ชิ้น`,
                  meta: (
                    <span
                      className={cn(
                        "font-medium tabular-nums",
                        l.low && "text-danger-strong"
                      )}
                    >
                      {material?.tonPerUnit === null
                        ? `${formatNumber(l.pieces)} ${material.suggestUnit}`
                        : `${formatTon(l.ton)} ตัน`}
                    </span>
                  ),
                }))}
                value={lotCodes}
                onValueChange={setLotCodes}
                placeholder="เลือก Lot"
                searchPlaceholder="ค้นหา"
                hideSelectAll
                className="min-h-10 bg-card"
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">ย้อนกลับ</Button>
          </DialogClose>
          <Button onClick={handleSave} disabled={selectedLots.length === 0}>
            บันทึก
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * ดรอปดาวน์เลือกสินค้าแบบค้นหาได้ — เลือกได้ทีละตัว ต่างจาก Lot ที่เลือกได้หลายก้อน
 *
 * แต่ละแถวโชว์ยอดรวมทุกล็อตของสินค้านั้นไว้ท้ายแถว ให้กะสต็อกได้ก่อนเปิดดู Lot จริง
 * ยอดต่ำกว่าเกณฑ์ขึ้นแดงเตือนเหมือนที่ทำไว้ในรายการ Lot
 */
function ProductCombobox({
  id,
  materials,
  value,
  onValueChange,
  disabled,
}: {
  id?: string;
  materials: AddableMaterial[];
  value?: string;
  onValueChange: (id: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const selected = materials.find((m) => m.id === value);
  const listId = React.useId();

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return materials;
    return materials.filter((m) =>
      `${m.name} ${m.sub ?? ""}`.toLowerCase().includes(q)
    );
  }, [materials, search]);

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (disabled && next) return;
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
          disabled={disabled}
          data-state={open ? "open" : "closed"}
          className={cn(
            "flex h-9 w-full items-center justify-between gap-2 rounded-md border border-input bg-card px-3 py-1.5 text-sm shadow-xs outline-none transition-[color,box-shadow]",
            "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
            "data-[state=open]:border-ring data-[state=open]:ring-[3px] data-[state=open]:ring-ring/50",
            "disabled:cursor-not-allowed disabled:opacity-50"
          )}
        >
          <span
            className={cn(
              "truncate text-left",
              !selected && "text-muted-foreground"
            )}
          >
            {selected ? `${selected.name}${selected.sub ? ` ${selected.sub}` : ""}` : "เลือกสินค้า"}
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
            placeholder="ค้นหา"
          />
          <CommandList className="max-h-72">
            <CommandEmpty>ไม่พบรายการที่ค้นหา</CommandEmpty>
            <CommandGroup>
              {filtered.map((m) => {
                const low =
                  m.tonPerUnit !== null &&
                  materialTotalTon(m) < LOW_STOCK_TON;
                return (
                  <CommandItem
                    key={m.id}
                    value={m.id}
                    onSelect={() => {
                      onValueChange(m.id);
                      setOpen(false);
                      setSearch("");
                    }}
                    className="justify-between gap-3"
                  >
                    <span className="truncate">
                      {m.name}
                      {m.sub ? ` ${m.sub}` : ""}
                    </span>
                    <span
                      className={cn(
                        "shrink-0 font-medium tabular-nums",
                        low && "text-danger-strong"
                      )}
                    >
                      {m.tonPerUnit === null
                        ? `${formatNumber(materialTotalPieces(m))} ${m.suggestUnit}`
                        : `${formatTon(materialTotalTon(m))} ตัน`}
                    </span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
