"use client";

import * as React from "react";
import {
  ChevronsUpDownIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@peckey954/ui/components/ui/alert-dialog";
import { Button } from "@peckey954/ui/components/ui/button";
import { Checkbox } from "@peckey954/ui/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { cn } from "@peckey954/ui/lib/utils";
import { toast } from "sonner";
import { ChipGroup } from "@/components/chip-group";
import { SetupFooter } from "@/components/pr/setup-footer";
import { usePrSetup } from "@/components/pr/pr-setup-provider";
import { Crumbs } from "@/components/receiving/parts";
import { PRODUCTS } from "@/lib/general-stock";
import { GOODS_PRODUCTS } from "@/lib/goods-stock";
import { duplicateLockIds, type StorageLock } from "@/lib/pr-setup";

/* ------------------------------------------------------------------
   ตั้งค่าล็อคสินค้า — ล็อคทุกคลังในตารางเดียว (ข้อมูลชุดเดียวกับหน้าล็อค
   ในตั้งค่าคลังสินค้า แก้ที่ไหนก็เห็นทั้งสองหน้า)

   ต่างจากหน้าล็อคเดิมตรงที่ทำงานข้ามคลังได้:
   - ชิปคลัง (มี "ทั้งหมด") แทนแท็บ — ดูทุกคลังพร้อมกันได้
   - แต่ละแถวมีช่องเลือกคลังของตัวเอง ย้ายล็อคไปคลังอื่นได้ทีละแถว
   - ติ๊กหลายแถวแล้ว "แก้ไขคลังหลายรายการ" ย้ายทั้งชุดในครั้งเดียว
   - ลากปุ่มย้าย (⌃⌄ ข้างถังขยะ) เพื่อเรียงลำดับ ถ้าแถวที่ลากถูกติ๊กอยู่
     แถวที่ติ๊กทั้งหมดย้ายไปด้วยกันเป็นกลุ่ม (เรียงตามลำดับเดิม)
   - ปิดใช้งานล็อคที่ยังมีของอยู่ ต้องยืนยันก่อน — ของเดิมยังอยู่ แต่ย้าย/รับเข้าไม่ได้
------------------------------------------------------------------ */

const ALL = "__all__";

type Drop = { id: string; place: "before" | "after" };

/** Lot ที่วางอยู่ในล็อคนี้ — ยังไม่มีข้อมูลสต็อกของคลังวัตถุดิบ เลยนับได้แค่สองคลัง */
function lotsIn(lock: StorageLock, warehouseLabel: string) {
  const products = /สินค้า/.test(warehouseLabel)
    ? GOODS_PRODUCTS
    : /ทั่วไป/.test(warehouseLabel)
      ? PRODUCTS
      : [];
  const key = lock.label.trim().toUpperCase();
  return products.flatMap((p) =>
    p.lots
      .filter((l) => l.zone.toUpperCase() === key)
      .map((l) => ({ product: p.name, lot: l })),
  );
}

export default function LockSettingsPage() {
  const {
    setup,
    addLock,
    renameLock,
    deleteLock,
    setEntityEnabled,
    moveLocksToWarehouse,
    moveLocksNear,
    reset,
    dirty,
  } = usePrSetup();
  const warehouses = setup.warehouses;
  const whName = (id: string) =>
    warehouses.find((w) => w.id === id)?.label.trim() || "(ยังไม่ได้ตั้งชื่อ)";

  const [filter, setFilter] = React.useState<string>(ALL);
  const rows =
    filter === ALL
      ? setup.locks
      : setup.locks.filter((l) => l.warehouseId === filter);
  const dupes = duplicateLockIds(setup.locks);

  // ---------- เลือกหลายแถว ----------
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const visibleSel = rows.filter((l) => selected.has(l.id));
  const allState =
    visibleSel.length === 0
      ? false
      : visibleSel.length === rows.length
        ? true
        : ("indeterminate" as const);
  const toggle = (id: string, on: boolean) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
  const toggleAll = () =>
    setSelected((prev) => {
      const next = new Set(prev);
      for (const l of rows) {
        if (allState === true) next.delete(l.id);
        else next.add(l.id);
      }
      return next;
    });

  const [bulkOpen, setBulkOpen] = React.useState(false);
  const [bulkTo, setBulkTo] = React.useState("");
  const applyBulk = () => {
    if (!bulkTo) return;
    const ids = setup.locks.filter((l) => selected.has(l.id)).map((l) => l.id);
    moveLocksToWarehouse(ids, bulkTo);
    toast.success("ย้ายคลังแล้ว", {
      description: `${ids.length} ล็อค → ${whName(bulkTo)}`,
    });
    setBulkOpen(false);
    setSelected(new Set());
  };

  // ---------- ลากเรียงลำดับ ----------
  // state ไว้วาด (จางแถวที่ลาก / เส้นตำแหน่งวาง) — ref ไว้อ่านใน handler
  // เพราะ dragover กับ drop มาติดกันเร็วกว่าที่ React จะวาดใหม่ทัน
  const [dragIds, setDragIds] = React.useState<string[] | null>(null);
  const [drop, setDrop] = React.useState<Drop | null>(null);
  const dragRef = React.useRef<string[] | null>(null);
  const dropRef = React.useRef<Drop | null>(null);
  const endDrag = () => {
    dragRef.current = null;
    dropRef.current = null;
    setDragIds(null);
    setDrop(null);
  };
  const startDrag = (l: StorageLock, e: React.DragEvent) => {
    // จับแถวที่ติ๊กอยู่ = ลากทั้งกลุ่มที่ติ๊ก (ทุกคลัง ตามลำดับในรายการ)
    const ids = selected.has(l.id)
      ? setup.locks.filter((x) => selected.has(x.id)).map((x) => x.id)
      : [l.id];
    dragRef.current = ids;
    setDragIds(ids);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", ids.join(","));
    // จับที่ ⋮⋮ แต่ภาพที่ลากเป็นทั้งแถว
    const row = (e.currentTarget as HTMLElement).closest("li");
    if (row) e.dataTransfer.setDragImage(row, 24, row.offsetHeight / 2);
  };
  const overRow = (l: StorageLock, e: React.DragEvent<HTMLElement>) => {
    const ids = dragRef.current;
    if (!ids || ids.includes(l.id)) return;
    e.preventDefault();
    const r = e.currentTarget.getBoundingClientRect();
    const place = e.clientY < r.top + r.height / 2 ? "before" : "after";
    const cur = dropRef.current;
    if (cur?.id !== l.id || cur.place !== place) {
      dropRef.current = { id: l.id, place };
      setDrop(dropRef.current);
    }
  };
  const dropRow = (e: React.DragEvent) => {
    e.preventDefault();
    const ids = dragRef.current,
      at = dropRef.current;
    if (ids && at) moveLocksNear(ids, at.id, at.place);
    endDrag();
  };

  // ---------- เพิ่ม / ลบ / บันทึก ----------
  const inputs = React.useRef(new Map<string, HTMLInputElement>());
  const pendingFocus = React.useRef<string | null>(null);
  React.useEffect(() => {
    const id = pendingFocus.current;
    if (!id) return;
    inputs.current.get(id)?.focus();
    pendingFocus.current = null;
  }, [setup.locks]);
  const addRow = () => {
    const wh = filter === ALL ? warehouses[0]?.id : filter;
    if (wh) pendingFocus.current = addLock(wh);
  };

  const [confirm, setConfirm] = React.useState<StorageLock | null>(null);
  /** ล็อคที่กดปิดแต่ยังมีของ — รอยืนยัน */
  const [confirmOff, setConfirmOff] = React.useState<{
    lock: StorageLock;
    lots: ReturnType<typeof lotsIn>;
  } | null>(null);
  const setEnabled = (l: StorageLock, on: boolean) => {
    const lots = on ? [] : lotsIn(l, whName(l.warehouseId));
    if (lots.length > 0) setConfirmOff({ lock: l, lots });
    else setEntityEnabled("locks", l.id, on);
  };

  const save = () => {
    const first = setup.locks.find((l) => dupes.has(l.id));
    if (first) {
      toast.error("บันทึกไม่ได้ — มีชื่อล็อคซ้ำ", {
        description: `"${first.label.trim()}" ซ้ำกันใน${whName(first.warehouseId)}`,
      });
      if (filter !== ALL && filter !== first.warehouseId) setFilter(ALL);
      inputs.current.get(first.id)?.focus();
      return;
    }
    const blank = setup.locks.filter((l) => !l.label.trim());
    blank.forEach((l) => deleteLock(l.id));
    toast.success("บันทึกล็อคแล้ว", {
      description: `${setup.locks.length - blank.length} ล็อค ใน ${warehouses.length} คลัง`,
    });
  };

  const chips = [
    { id: ALL, label: `ทั้งหมด (${setup.locks.length})` },
    ...warehouses.map((w) => ({
      id: w.id,
      label: `${w.label.trim() || "(ยังไม่ได้ตั้งชื่อ)"} (${setup.locks.filter((l) => l.warehouseId === w.id).length})`,
    })),
  ];
  // มือถือเป็นตารางเดียวกันแต่ความกว้างคอลัมน์ตายตัว แล้วเลื่อนซ้าย-ขวาเอา
  // (คอลัมน์ว่างตัวที่ 5 มีเฉพาะจอกว้าง)
  const cols =
    "grid-cols-[1.25rem_1.5rem_10rem_11rem_auto_2.25rem_2.25rem] @3xl:grid-cols-[1.25rem_2rem_minmax(0,16rem)_minmax(0,14rem)_1fr_auto_2.25rem_2.25rem]";

  return (
    <>
      <main className="@container mx-auto w-full max-w-7xl px-4 pt-3 pb-24 sm:px-6 sm:pt-5">
        <Crumbs
          trail={[
            { label: "ตั้งค่าระบบ", href: "/settings" },
            { label: "ตั้งค่าล็อคสินค้า" },
          ]}
        />

        <div className="mt-2 sm:mt-3">
          <h1 className="text-2xl font-semibold tracking-tight">ตั้งค่าล็อคสินค้า</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            ล็อคของทุกคลังในที่เดียว — เปลี่ยนคลังได้ทีละแถวหรือติ๊กหลายแถวแล้วย้ายทีเดียว ลากปุ่ม
            ⌃⌄ ข้างถังขยะเพื่อเรียงลำดับ แถวที่ติ๊กไว้จะย้ายไปด้วยกันเป็นกลุ่ม
          </p>
        </div>

        <ChipGroup
          label="คลัง"
          options={chips}
          value={filter}
          onChange={setFilter}
          className="mt-4 sm:mt-5"
        />

        {/* แถบงานหลายรายการ — ขึ้นเมื่อมีแถวที่ติ๊ก */}
        {selected.size > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-primary/40 bg-brand px-4 py-2.5">
            <span className="text-sm font-medium text-primary">
              เลือกแล้ว {selected.size} รายการ
            </span>
            <Button
              size="sm"
              className="ml-auto"
              onClick={() => {
                setBulkTo("");
                setBulkOpen(true);
              }}
            >
              <PencilIcon />
              แก้ไขคลังหลายรายการ
            </Button>
            <Button
              size="sm"
              variant="outline-primary"
              className="bg-card"
              onClick={() => setSelected(new Set())}
            >
              ล้างที่เลือก
            </Button>
          </div>
        )}

        <div className="mt-4 rounded-xl border border-border bg-card">
          <div className="overflow-x-auto">
            <div className="w-max min-w-full @3xl:w-auto">
              <div
                className={cn(
                  "grid items-center gap-x-3 border-b border-border px-4 py-3 text-sm whitespace-nowrap text-muted-foreground @3xl:gap-x-4 @3xl:px-5",
                  cols,
                )}
              >
                <Checkbox
                  checked={allState}
                  onCheckedChange={toggleAll}
                  aria-label="เลือกทั้งหมดที่เห็นอยู่"
                  disabled={rows.length === 0}
                />
                <span>#</span>
                <span>ชื่อล็อค</span>
                <span>คลัง</span>
                <span aria-hidden className="hidden @3xl:block" />
                <span>การใช้งาน</span>
                <span aria-hidden />
                <span aria-hidden />
              </div>

              {rows.length === 0 ? (
                <p className="px-4 py-10 text-center text-sm text-muted-foreground">
                  ยังไม่มีล็อค — กดเพิ่มล็อคด้านล่าง
                </p>
              ) : (
                <ol
                  onDragLeave={(e) =>
                    e.currentTarget === e.target && setDrop(null)
                  }
                >
                  {rows.map((l, i) => {
                    const dup = dupes.has(l.id);
                    const dragging = dragIds?.includes(l.id);
                    return (
                      <li
                        key={l.id}
                        onDragOver={(e) => overRow(l, e)}
                        onDrop={dropRow}
                        className={cn(
                          "relative grid items-start gap-x-3 border-b border-border px-4 py-3 @3xl:gap-x-4 @3xl:px-5",
                          cols,
                          !l.enabled && "bg-muted/40",
                          dragging && "opacity-40",
                        )}
                      >
                        {/* เส้นบอกตำแหน่งที่จะวาง */}
                        {drop?.id === l.id && (
                          <span
                            aria-hidden
                            className={cn(
                              "pointer-events-none absolute inset-x-0 h-0.5 bg-primary",
                              drop.place === "before"
                                ? "-top-px"
                                : "-bottom-px",
                            )}
                          />
                        )}
                        <Checkbox
                          className="mt-2.5"
                          checked={selected.has(l.id)}
                          onCheckedChange={(v) => toggle(l.id, v === true)}
                          aria-label={`เลือกล็อค ${l.label || `แถวที่ ${i + 1}`}`}
                        />
                        <span className="pt-2 text-sm text-muted-foreground tabular-nums">
                          {i + 1}
                        </span>

                        <div className="min-w-0">
                          <InputGroup className="bg-card">
                            <InputGroupInput
                              ref={(el) => {
                                if (el) inputs.current.set(l.id, el);
                                else inputs.current.delete(l.id);
                              }}
                              aria-label={`ชื่อล็อคแถวที่ ${i + 1}`}
                              aria-invalid={dup || undefined}
                              value={l.label}
                              placeholder="เช่น A-9M"
                              onChange={(e) => renameLock(l.id, e.target.value)}
                            />
                          </InputGroup>
                          {dup && (
                            <p className="mt-1 text-xs text-danger-strong">
                              ชื่อซ้ำกับล็อคอื่นใน{whName(l.warehouseId)}
                            </p>
                          )}
                        </div>

                        <div className="min-w-0">
                          <Select
                            value={l.warehouseId}
                            onValueChange={(v) =>
                              moveLocksToWarehouse([l.id], v)
                            }
                          >
                            <SelectTrigger
                              aria-label={`คลังของล็อค ${l.label || `แถวที่ ${i + 1}`}`}
                              className="w-full bg-card"
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {warehouses.map((w) => (
                                <SelectItem key={w.id} value={w.id}>
                                  {w.label.trim() || "(ยังไม่ได้ตั้งชื่อ)"}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <span aria-hidden className="hidden @3xl:block" />

                        {/* ชิดขวา: เปิด/ปิด → ย้าย → ลบ */}
                        <label className="flex w-fit cursor-pointer items-center gap-2 pt-1.5">
                          <Switch
                            checked={l.enabled}
                            onCheckedChange={(v) => setEnabled(l, v)}
                            aria-label={`การใช้งานของล็อค ${l.label || `แถวที่ ${i + 1}`}`}
                          />
                          <span className="text-sm whitespace-nowrap">
                            {l.enabled ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                          </span>
                        </label>

                        {/* ลากได้เฉพาะที่ปุ่มนี้ — ทั้งแถวลากได้แล้วจะเลือกข้อความในช่องชื่อไม่ได้ */}
                        <Button
                          variant="ghost"
                          size="icon"
                          draggable
                          onDragStart={(e) => startDrag(l, e)}
                          onDragEnd={endDrag}
                          aria-label={`ลากเพื่อเรียงล็อค ${l.label || `แถวที่ ${i + 1}`}`}
                          title="ลากเพื่อเรียงลำดับ"
                          className="cursor-grab text-foreground active:cursor-grabbing"
                        >
                          <ChevronsUpDownIcon />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`ลบล็อค ${l.label || `แถวที่ ${i + 1}`}`}
                          className="text-foreground hover:bg-destructive/10 hover:text-destructive"
                          onClick={() =>
                            l.builtIn ? setConfirm(l) : deleteLock(l.id)
                          }
                        >
                          <Trash2Icon />
                        </Button>
                      </li>
                    );
                  })}
                </ol>
              )}
            </div>
          </div>

          <div className="p-3 @3xl:px-5">
            <Button
              variant="ghost"
              className="w-full justify-center border border-dashed border-border text-primary hover:border-primary hover:bg-brand"
              onClick={addRow}
              disabled={warehouses.length === 0}
            >
              <PlusIcon />
              เพิ่มล็อค{filter !== ALL ? `ใน${whName(filter)}` : ""}
            </Button>
          </div>
        </div>
      </main>

      <SetupFooter
        dirty={dirty.locks}
        onReset={() => reset("locks")}
        onSave={save}
      />

      <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>แก้ไขคลังหลายรายการ</DialogTitle>
            <DialogDescription>
              ย้าย {selected.size} ล็อคที่เลือกไปยังคลังเดียวกัน
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="bulk-warehouse">คลัง</Label>
            <Select value={bulkTo} onValueChange={setBulkTo}>
              <SelectTrigger id="bulk-warehouse" className="w-full">
                <SelectValue placeholder="เลือกคลัง" />
              </SelectTrigger>
              <SelectContent>
                {warehouses.map((w) => (
                  <SelectItem key={w.id} value={w.id}>
                    {w.label.trim() || "(ยังไม่ได้ตั้งชื่อ)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              variant="outline-primary"
              onClick={() => setBulkOpen(false)}
            >
              ยกเลิก
            </Button>
            <Button disabled={!bulkTo} onClick={applyBulk}>
              ย้ายคลัง
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={confirmOff !== null}
        onOpenChange={(o) => !o && setConfirmOff(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              ปิดใช้งานล็อค {confirmOff?.lock.label}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              ล็อคนี้ยังมีของอยู่ {confirmOff?.lots.length} Lot (
              {[...new Set(confirmOff?.lots.map((x) => x.product))]
                .slice(0, 2)
                .join(", ")}
              {(new Set(confirmOff?.lots.map((x) => x.product)).size ?? 0) > 2
                ? " และอื่น ๆ"
                : ""}
              )
              <br />
              ถ้าปิดใช้งาน ของเดิมยังอยู่และดูได้ตามปกติ แต่จะย้ายหรือรับของเข้าล็อคนี้ไม่ได้
              ควรย้ายของออกก่อน
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel variant="outline-primary">
              ยกเลิก
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!confirmOff) return;
                setEntityEnabled("locks", confirmOff.lock.id, false);
                toast.success("ปิดใช้งานล็อคแล้ว", {
                  description: confirmOff.lock.label,
                });
                setConfirmOff(null);
              }}
            >
              ปิดใช้งาน
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={confirm !== null}
        onOpenChange={(o) => !o && setConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ลบล็อคนี้?</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{confirm?.label || "(ยังไม่ได้ตั้งชื่อ)"}&quot; อาจมีของวางอยู่ ถ้าลบ
              ของในล็อคนี้จะไม่มีตำแหน่ง ถ้าแค่เลิกใช้ ให้ปิดใช้งานแทน
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!confirm) return;
                deleteLock(confirm.id);
                toast.success("ลบล็อคแล้ว", { description: confirm.label });
                setConfirm(null);
              }}
            >
              ลบ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
