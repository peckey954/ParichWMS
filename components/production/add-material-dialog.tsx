"use client";

import * as React from "react";
import { PlusIcon } from "lucide-react";
import { Button } from "@peckey954/ui/components/ui/button";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@peckey954/ui/components/ui/select";
import { cn } from "@peckey954/ui/lib/utils";
import { formatDate, formatNumber, formatTon } from "@/lib/format";
import { ADDABLE_MATERIALS, type MaterialLine } from "@/lib/production-order";

/* ------------------------------------------------------------------
   เพิ่มวัตถุดิบ/สินค้าเข้าใบผลิต — เลือกไล่ระดับ ประเภท > สินค้า > ล็อต

   เลือก Lot ได้หลายก้อนพร้อมกัน เพราะของจริงมักไม่พอในล็อตเดียว
   คนหน้างานหยิบจากหลายล็อตรวมกันเป็นปกติ ไม่ใช่ข้อยกเว้น

   เปลี่ยนประเภท/สินค้าแล้วล้างตัวเลือกที่อยู่ใต้มันทิ้งเสมอ
   ไม่งั้นจะค้าง Lot ของสินค้าเก่าไว้ทั้งที่หน้าจอเปลี่ยนไปแล้ว
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
              <Select
                value={materialId}
                onValueChange={handleMaterialChange}
                disabled={!categoryId}
              >
                <SelectTrigger id="am-material" className="w-full bg-card">
                  <SelectValue placeholder="เลือกสินค้า" />
                </SelectTrigger>
                <SelectContent>
                  {materialsInCategory.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                      {m.sub ? ` ${m.sub}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
