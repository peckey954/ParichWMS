"use client";

import * as React from "react";
import { PlusIcon, Trash2Icon } from "lucide-react";
import { Button } from "@peckey954/ui/components/ui/button";
import { cn } from "@peckey954/ui/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@peckey954/ui/components/ui/dialog";
import {
  InputGroup,
  InputGroupInput,
} from "@peckey954/ui/components/ui/input-group";
import { Label } from "@peckey954/ui/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@peckey954/ui/components/ui/select";
import { Switch } from "@peckey954/ui/components/ui/switch";
import { toast } from "sonner";
import { MultiSelectChips } from "@/components/multi-select-chips";
import { usePrSetup } from "@/components/pr/pr-setup-provider";

/* ------------------------------------------------------------------
   เพิ่ม/แก้ไขข้อมูล — กล่องเดียวคุมทั้งสามชั้นโครง

   ตารางในหน้าหลักแก้ "ค่าของสินค้าแต่ละตัว" ได้อยู่แล้ว กล่องนี้ทำอีกงานหนึ่ง
   คือแก้ "ตัวเลือก" ที่ดรอปดาวน์ในตารางมีให้เลือก — จะมีประเภทอะไรบ้าง
   หมวดอะไรบ้าง คลังอะไรบ้าง

   เลือกชั้นก่อนแล้วค่อยเห็นรายการ เพราะสามชั้นกางพร้อมกันในกล่องเดียวยาวเกิน
   จนเลื่อนหาไม่เจอ และคนที่เปิดกล่องนี้มักตั้งใจแก้ชั้นเดียวอยู่แล้ว

   ช่องสมาชิกใช้เลือกหลายรายการ = ย้ายเข้าออกทีเดียวเป็นชุด เอาสินค้าออกจากชิป
   คือปลดออกจริง สินค้านั้นจะกลายเป็น "ไม่ระบุ" ไม่ใช่ค้างอยู่กับกลุ่มเดิมเงียบ ๆ
------------------------------------------------------------------ */

type Slice = "categories" | "groups" | "warehouses";

const SLICE_OPTIONS: { id: Slice; label: string }[] = [
  { id: "categories", label: "ประเภทสินค้า" },
  { id: "groups", label: "หมวด" },
  { id: "warehouses", label: "คลัง" },
];

export function EditDataDialog({ children }: { children: React.ReactNode }) {
  const [slice, setSlice] = React.useState<Slice | undefined>();

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="@container flex max-h-[88svh] w-[min(60rem,94vw)] flex-col gap-0 overflow-hidden p-0 sm:max-w-none">
        <DialogHeader className="px-6 pt-6 text-left">
          <DialogTitle>เพิ่ม/แก้ไขข้อมูล</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 overflow-y-auto px-6 py-4">
          <div className="grid gap-1.5">
            <Label htmlFor="ed-slice">ข้อมูล</Label>
            <Select value={slice} onValueChange={(v) => setSlice(v as Slice)}>
              <SelectTrigger id="ed-slice" className="w-full bg-card">
                <SelectValue placeholder="เลือกข้อมูล" />
              </SelectTrigger>
              <SelectContent>
                {SLICE_OPTIONS.map((o) => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {slice === undefined ? (
            <div className="rounded-xl border border-border px-4 py-14 text-center">
              <p className="font-medium">ไม่มีข้อมูล</p>
              <p className="mt-1 text-sm text-muted-foreground">
                กรุณาเลือกข้อมูลที่ต้องการแก้ไข
              </p>
            </div>
          ) : (
            <Editor slice={slice} />
          )}
        </div>

        <DialogFooter className="border-t border-border px-6 py-4">
          <Button variant="outline-primary" className="flex-1">
            ย้อนกลับ
          </Button>
          <Button
            className="flex-1"
            disabled={slice === undefined}
            onClick={() =>
              toast.success(
                `บันทึก${SLICE_OPTIONS.find((o) => o.id === slice)?.label ?? ""}แล้ว`,
              )
            }
          >
            บันทึก
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Editor({ slice }: { slice: Slice }) {
  const {
    setup,
    products,
    addCategory,
    renameCategory,
    deleteCategory,
    addGroup,
    renameGroup,
    deleteGroup,
    addWarehouse,
    renameWarehouse,
    deleteWarehouse,
    setEntityEnabled,
    setMembers,
    setWarehouseCategories,
  } = usePrSetup();

  // กดลบครั้งแรกให้ปุ่มเปลี่ยนเป็น "ยืนยันลบ" แทนการซ้อนกล่องยืนยันอีกชั้น
  // กล่องซ้อนกล่องสามชั้นกดยากมากบนมือถือ
  const [confirmId, setConfirmId] = React.useState<string | null>(null);

  const rows = setup[slice];
  const addRow = { categories: addCategory, groups: addGroup, warehouses: addWarehouse }[slice];
  const rename = { categories: renameCategory, groups: renameGroup, warehouses: renameWarehouse }[slice];
  const remove = { categories: deleteCategory, groups: deleteGroup, warehouses: deleteWarehouse }[slice];

  const word = SLICE_OPTIONS.find((o) => o.id === slice)!.label;
  // ประเภทกับหมวดมีสมาชิกเป็น "สินค้า" ส่วนคลังมีสมาชิกเป็น "ประเภท"
  // เพราะสินค้าไม่ได้ผูกกับคลังผ่านความเป็นสมาชิก แต่ผ่านช่องคลังของตัวเองในตาราง
  const memberWord = slice === "warehouses" ? "ประเภทสินค้า" : "สินค้า";
  const memberOptions =
    slice === "warehouses"
      ? setup.categories
          .filter((c) => c.label.trim() !== "")
          .map((c) => ({ label: c.label, value: c.id }))
      : products.map((p) => ({ label: p.name, value: p.id }));

  const membersOf = (ownerId: string) => {
    if (slice === "warehouses")
      return setup.categories
        .filter((c) => c.warehouseIds.includes(ownerId))
        .map((c) => c.id);
    const key = slice === "categories" ? "categoryId" : "groupId";
    return products.filter((p) => p[key] === ownerId).map((p) => p.id);
  };

  const setOwnerMembers = (ownerId: string, ids: string[]) => {
    if (slice === "warehouses") setWarehouseCategories(ownerId, ids);
    else setMembers(slice === "categories" ? "category" : "group", ownerId, ids);
  };

  return (
    <div className="grid gap-3">
      {/* หัวคอลัมน์บอกครั้งเดียวบนสุด ไม่ซ้ำทุกบรรทัด — ซ้ำทุกบรรทัดกินความสูง
          เกือบเท่าตัวข้อมูลเอง พอมีสิบกว่าแถวแล้วต้องเลื่อนหาทั้งที่ของไม่เยอะ */}
      <div className="hidden gap-3 px-1 text-sm text-muted-foreground @2xl:grid @2xl:grid-cols-[13rem_1fr_11rem_2.25rem]">
        <span>{word}</span>
        <span>{memberWord}</span>
        <span>การใช้งาน</span>
        <span className="sr-only">ลบ</span>
      </div>

      <div className="grid gap-2">
        {rows.map((row) => {
          const confirming = confirmId === row.id;
          return (
            <div
              key={row.id}
              className={cn(
                "grid gap-2 @2xl:grid-cols-[13rem_1fr_11rem_2.25rem] @2xl:items-center @2xl:gap-3",
                // จอแคบยังต้องแยกบรรทัดพร้อมหัวข้อกำกับ ไม่งั้นสี่ช่องเบียดจนกดไม่โดน
                "rounded-xl border border-border p-3 @2xl:border-0 @2xl:p-0",
              )}
            >
              <div className="grid gap-1.5">
                <Label
                  htmlFor={`ed-${row.id}`}
                  className="text-muted-foreground @2xl:hidden"
                >
                  {word}
                </Label>
                <InputGroup className="bg-card">
                  <InputGroupInput
                    id={`ed-${row.id}`}
                    value={row.label}
                    placeholder={`ตั้งชื่อ${word}`}
                    onChange={(e) => rename(row.id, e.target.value)}
                  />
                </InputGroup>
              </div>

              <div className="grid min-w-0 gap-1.5">
                <Label className="text-muted-foreground @2xl:hidden">
                  {memberWord}
                </Label>
                <MultiSelectChips
                  options={memberOptions}
                  value={membersOf(row.id)}
                  onValueChange={(v) => setOwnerMembers(row.id, v)}
                  placeholder={`เลือก${memberWord}`}
                  searchPlaceholder={`ค้นหา${memberWord}`}
                  maxChips={2}
                  className="bg-card"
                />
              </div>

              <div className="flex items-center justify-between gap-2 @2xl:contents">
                <label className="flex cursor-pointer items-center gap-2">
                  <Switch
                    checked={row.enabled}
                    onCheckedChange={(v) => setEntityEnabled(slice, row.id, v)}
                    aria-label={`การใช้งานของ ${row.label || word}`}
                  />
                  <span className="text-sm whitespace-nowrap">
                    {row.enabled ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                  </span>
                </label>
                <Button
                  variant={confirming ? "destructive" : "ghost"}
                  size={confirming ? "sm" : "icon"}
                  aria-label={`ลบ${word} ${row.label || "ที่ยังไม่ได้ตั้งชื่อ"}`}
                  className={
                    confirming
                      ? "shrink-0"
                      : "shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  }
                  onClick={() => {
                    if (!confirming) {
                      setConfirmId(row.id);
                      return;
                    }
                    const n = membersOf(row.id).length;
                    remove(row.id);
                    toast.success(`ลบ${word}แล้ว`, {
                      description:
                        n > 0
                          ? `${memberWord} ${n} รายการถูกปลดออก`
                          : row.label || "(ยังไม่ได้ตั้งชื่อ)",
                    });
                    setConfirmId(null);
                  }}
                >
                  {confirming ? "ยืนยันลบ" : <Trash2Icon />}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <Button variant="outline-primary" className="w-full" onClick={addRow}>
        <PlusIcon />
        เพิ่ม{word}
      </Button>
    </div>
  );
}
