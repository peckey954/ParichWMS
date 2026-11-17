"use client";

import * as React from "react";
import {
  ChevronsUpDownIcon,
  CircleXIcon,
  HouseIcon,
  ListFilterIcon,
  PencilIcon,
  PlusIcon,
  RotateCcwIcon,
  SearchIcon,
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
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@peckey954/ui/components/ui/breadcrumb";
import { Button } from "@peckey954/ui/components/ui/button";
import { Checkbox } from "@peckey954/ui/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@peckey954/ui/components/ui/dialog";
import {
  InputGroup,
  InputGroupAddon,
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
import { SetupFooter } from "@/components/pr/setup-footer";
import { usePrSetup } from "@/components/pr/pr-setup-provider";
import { PRODUCTS } from "@/lib/general-stock";
import { GOODS_PRODUCTS } from "@/lib/goods-stock";
import { duplicateLockIds, type StorageLock } from "@/lib/pr-setup";

/* ------------------------------------------------------------------
   ตั้งค่าล็อคสินค้า — ล็อคทุกคลังในตารางเดียว (ข้อมูลชุดเดียวกับหน้าล็อค
   ในตั้งค่าคลังสินค้า แก้ที่ไหนก็เห็นทั้งสองหน้า)

   ตาม Figma "Setting Storage" (Production Support Screens 360-150919)
   - ค้นหา + เลือกสถานะ (จอแคบย้ายสถานะเข้าไปในปุ่มตัวกรอง) แล้วชิปคลัง
   - ติ๊กแถวแล้วขึ้น แก้ไขคลัง | ลบ ซ้าย "เลือกแล้ว N รายการ" ขวา
   - เพิ่มล็อคจากชิปคลังไหน แถวใหม่เป็นของคลังนั้น
   - ลาก ⌃⌄ เพื่อเรียงลำดับ แถวที่ติ๊กไว้ย้ายไปด้วยกันเป็นกลุ่ม
   - ลบ / เปิด / ปิดใช้งาน ต้องยืนยันทุกครั้ง ล็อคที่ยังมีของปิดไม่ได้
   - ชื่อซ้ำ: กดบันทึกแล้วขึ้นแถบแดงเหนือตาราง ช่องที่ซ้ำขอบแดง
------------------------------------------------------------------ */

const ALL = "__all__";

type Status = "on" | "off";
type Drop = { id: string; place: "before" | "after" };
type Ask =
  | { kind: "delete"; ids: string[] }
  | { kind: "toggle"; lock: StorageLock; on: boolean }
  | { kind: "blocked"; lock: StorageLock };

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

/** เวลาใต้หัวข้อ toast ตามแบบ — 19/09/2026 | 12:04:06 */
function stamp(now = new Date()) {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(now.getDate())}/${p(now.getMonth() + 1)}/${now.getFullYear()} | ${p(now.getHours())}:${p(now.getMinutes())}:${p(now.getSeconds())}`;
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
    dirty,
  } = usePrSetup();
  const warehouses = setup.warehouses;
  const whName = (id: string) =>
    warehouses.find((w) => w.id === id)?.label.trim() || "(ยังไม่ได้ตั้งชื่อ)";

  // ---------- ค้นหา / สถานะ / ชิปคลัง ----------
  const [query, setQuery] = React.useState("");
  const [status, setStatus] = React.useState<Status | undefined>();
  const [filterOpen, setFilterOpen] = React.useState(false);
  const [draftStatus, setDraftStatus] = React.useState<Status | undefined>();
  const [filter, setFilter] = React.useState<string>(ALL);

  const q = query.trim().toUpperCase();
  // ตัวเลขบนชิปนับตามค้นหา/สถานะที่ใช้อยู่ด้วย จะได้ตรงกับที่เห็นในตาราง
  const matched = setup.locks.filter(
    (l) =>
      (!q || l.label.toUpperCase().includes(q)) &&
      (!status || l.enabled === (status === "on")),
  );
  const rows =
    filter === ALL ? matched : matched.filter((l) => l.warehouseId === filter);
  const dupes = duplicateLockIds(setup.locks);
  const [showDupes, setShowDupes] = React.useState(false);
  const dupBanner = showDupes && dupes.size > 0;

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
    toast.success("แก้ไขคลังสำเร็จ", { description: stamp() });
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
    // จับที่ ⌃⌄ แต่ภาพที่ลากเป็นทั้งแถว
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
    if (ids && at) {
      moveLocksNear(ids, at.id, at.place);
      toast.success("เปลี่ยนลำดับล็อคสำเร็จ", { description: stamp() });
    }
    endDrag();
  };

  // ---------- เพิ่ม / ลบ / เปิด-ปิด / บันทึก ----------
  const inputs = React.useRef(new Map<string, HTMLInputElement>());
  const pendingFocus = React.useRef<string | null>(null);
  React.useEffect(() => {
    const id = pendingFocus.current;
    if (!id) return;
    inputs.current.get(id)?.focus();
    pendingFocus.current = null;
  }, [setup.locks]);
  // เพิ่มจากชิปคลังไหน แถวใหม่เป็นของคลังนั้น (ทั้งหมด = คลังแรก)
  const addRow = () => {
    const wh = filter === ALL ? warehouses[0]?.id : filter;
    if (!wh) return;
    // แถวใหม่ต้องเห็นทันที — ล้างค้นหา/สถานะที่อาจซ่อนมันอยู่
    setQuery("");
    setStatus(undefined);
    pendingFocus.current = addLock(wh);
  };

  const [ask, setAsk] = React.useState<Ask | null>(null);
  const label = (l: StorageLock) => l.label.trim() || "(ยังไม่ได้ตั้งชื่อ)";

  // แถวว่างที่เพิ่งกดเพิ่มแล้วไม่ได้ใช้ ลบได้ทันทีไม่ต้องถาม
  const askDelete = (ids: string[]) => {
    const named = ids.filter((id) =>
      setup.locks.find((l) => l.id === id)?.label.trim(),
    );
    if (named.length === 0) ids.forEach(deleteLock);
    else setAsk({ kind: "delete", ids });
  };
  const confirmDelete = (ids: string[]) => {
    ids.forEach(deleteLock);
    setSelected((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.delete(id));
      return next;
    });
    toast.success("ลบล็อคสำเร็จ", { description: stamp() });
  };

  const askToggle = (l: StorageLock, on: boolean) => {
    if (!on && lotsIn(l, whName(l.warehouseId)).length > 0)
      setAsk({ kind: "blocked", lock: l });
    else setAsk({ kind: "toggle", lock: l, on });
  };

  const save = () => {
    if (dupes.size > 0) {
      setShowDupes(true);
      const first = setup.locks.find((l) => dupes.has(l.id));
      if (first) {
        if (filter !== ALL && filter !== first.warehouseId) setFilter(ALL);
        setQuery("");
        setStatus(undefined);
        inputs.current.get(first.id)?.focus();
      }
      return;
    }
    setShowDupes(false);
    setup.locks.filter((l) => !l.label.trim()).forEach((l) => deleteLock(l.id));
    toast.success("บันทึกล็อคสินค้าสำเร็จ", { description: stamp() });
  };

  const chips = [
    { id: ALL, label: `ทั้งหมด (${matched.length})` },
    ...warehouses.map((w) => ({
      id: w.id,
      label: `${w.label.trim() || "(ยังไม่ได้ตั้งชื่อ)"} (${matched.filter((l) => l.warehouseId === w.id).length})`,
    })),
  ];
  // มือถือเป็นตารางเดียวกันแต่ความกว้างคอลัมน์ตายตัว แล้วเลื่อนซ้าย-ขวาเอา
  // (คอลัมน์ว่างตัวที่ 4 ดันการใช้งานไปชิดขวา มีเฉพาะจอกว้าง)
  const cols =
    "grid-cols-[1.25rem_7rem_9.5rem_8.5rem_2.25rem_2.25rem] @3xl:grid-cols-[1.25rem_7.5rem_10rem_1fr_8.5rem_2.25rem_2.25rem]";

  const statusSelect = (
    value: Status | undefined,
    onChange: (v: Status | undefined) => void,
    props: { id?: string; className?: string },
  ) => (
    <Select
      value={value ?? ""}
      onValueChange={(v) => onChange(v === ALL ? undefined : (v as Status))}
    >
      <SelectTrigger
        id={props.id}
        aria-label="สถานะการใช้งาน"
        className={cn("bg-card", props.className)}
      >
        <SelectValue placeholder="เลือกสถานะ" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>ทั้งหมด</SelectItem>
        <SelectItem value="on">เปิดใช้งาน</SelectItem>
        <SelectItem value="off">ปิดใช้งาน</SelectItem>
      </SelectContent>
    </Select>
  );

  return (
    <>
      <main className="@container mx-auto w-full max-w-7xl px-4 pt-3 pb-24 sm:px-6 sm:pt-5">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/settings" className="inline-flex items-center gap-1.5">
                <HouseIcon className="size-4" aria-hidden />
                ระบบ
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-primary">ตั้งค่าล็อคสินค้า</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="mt-2 sm:mt-3">
          <h1 className="text-2xl font-semibold tracking-tight">ตั้งค่าล็อคสินค้า</h1>
          <p className="mt-1 text-muted-foreground">ตั้งค่าล็อคและเลือกประเภทสินค้า</p>
        </div>

        {/* ค้นหา | เลือกสถานะ (จอแคบเป็นปุ่มตัวกรอง) */}
        <div className="mt-6 flex items-center gap-3 @3xl:gap-4">
          <InputGroup className="min-w-0 flex-1 bg-card">
            <InputGroupAddon align="inline-start">
              <SearchIcon />
            </InputGroupAddon>
            <InputGroupInput
              placeholder="ค้นหา..."
              aria-label="ค้นหาล็อค"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </InputGroup>
          {statusSelect(status, setStatus, { className: "hidden w-56 shrink-0 @3xl:flex" })}
          <Button
            variant="outline-primary"
            size="icon"
            aria-label="ตัวกรองล็อค"
            className="relative shrink-0 @3xl:hidden"
            onClick={() => {
              setDraftStatus(status);
              setFilterOpen(true);
            }}
          >
            <ListFilterIcon />
            {status && <span className="absolute top-1 right-1 size-2 rounded-full bg-primary" />}
          </Button>
        </div>

        {/* ชิปคลัง — จอแคบเลื่อนซ้าย-ขวาในแถวเดียว */}
        <div
          role="radiogroup"
          aria-label="คลัง"
          className="mt-4 flex items-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {chips.map((c) => {
            const on = filter === c.id;
            return (
              <button
                key={c.id}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => setFilter(c.id)}
                className={cn(
                  "shrink-0 rounded-full border px-3 py-1.5 text-xs whitespace-nowrap transition-colors",
                  on
                    ? "border-primary bg-brand text-foreground"
                    : "border-border bg-card text-foreground hover:bg-accent-hover",
                )}
              >
                {c.label}
              </button>
            );
          })}
        </div>

        {/* แถบงานหลายรายการ — ขึ้นเมื่อมีแถวที่ติ๊ก */}
        {selected.size > 0 && (
          <div className="mt-4 flex items-center gap-2">
            <Button
              variant="outline-primary"
              size="sm"
              className="bg-card"
              onClick={() => {
                setBulkTo("");
                setBulkOpen(true);
              }}
            >
              <PencilIcon />
              แก้ไขคลัง
            </Button>
            <Button
              variant="outline-primary"
              size="sm"
              className="bg-card"
              onClick={() => askDelete([...selected])}
            >
              <Trash2Icon />
              ลบ
            </Button>
            <span className="ml-auto text-sm font-medium text-primary">
              เลือกแล้ว {selected.size} รายการ
            </span>
          </div>
        )}

        {dupBanner && (
          <div
            role="alert"
            className="mt-4 flex gap-2 rounded-xl border border-danger-border bg-danger px-4 py-3 text-danger-strong shadow-xs"
          >
            <CircleXIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
            <div className="text-sm">
              <p className="font-semibold">ชื่อซ้ำกันบนระบบ</p>
              <p className="mt-0.5">กรุณาตรวจสอบ</p>
            </div>
          </div>
        )}

        {rows.length === 0 ? (
          <div className="mt-4 flex min-h-44 flex-col items-center justify-center rounded-xl border border-border bg-card px-4 py-10 text-center shadow-xs @3xl:min-h-48">
            <p className="text-lg font-semibold">ไม่มีข้อมูล</p>
            <p className="text-muted-foreground">
              {q || status ? "ลองเปลี่ยนคำค้นหรือสถานะ" : "กรุณาเพิ่มล็อค"}
            </p>
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-xl border border-border bg-card shadow-xs">
            <div className="w-max min-w-full @3xl:w-auto">
              <div
                className={cn(
                  "grid items-center gap-x-4 border-b border-border px-4 py-3 text-sm whitespace-nowrap text-muted-foreground",
                  cols,
                )}
              >
                <Checkbox
                  checked={allState}
                  onCheckedChange={toggleAll}
                  aria-label="เลือกทั้งหมดที่เห็นอยู่"
                />
                <span>ล็อค</span>
                <span>คลัง</span>
                <span aria-hidden className="hidden @3xl:block" />
                <span>การใช้งาน</span>
                <span aria-hidden />
                <span aria-hidden />
              </div>

              <ol onDragLeave={(e) => e.currentTarget === e.target && setDrop(null)}>
                {rows.map((l, i) => {
                  const dup = dupes.has(l.id);
                  const dragging = dragIds?.includes(l.id);
                  const name = l.label || `แถวที่ ${i + 1}`;
                  return (
                    <li
                      key={l.id}
                      onDragOver={(e) => overRow(l, e)}
                      onDrop={dropRow}
                      className={cn(
                        "relative grid items-center gap-x-4 border-b border-border px-4 py-2 last:border-b-0",
                        cols,
                        dragging && "opacity-40",
                      )}
                    >
                      {/* เส้นบอกตำแหน่งที่จะวาง */}
                      {drop?.id === l.id && (
                        <span
                          aria-hidden
                          className={cn(
                            "pointer-events-none absolute inset-x-0 h-0.5 bg-primary",
                            drop.place === "before" ? "-top-px" : "-bottom-px",
                          )}
                        />
                      )}
                      <Checkbox
                        checked={selected.has(l.id)}
                        onCheckedChange={(v) => toggle(l.id, v === true)}
                        aria-label={`เลือกล็อค ${name}`}
                      />

                      <InputGroup className="bg-card">
                        <InputGroupInput
                          ref={(el) => {
                            if (el) inputs.current.set(l.id, el);
                            else inputs.current.delete(l.id);
                          }}
                          aria-label={`ชื่อล็อคแถวที่ ${i + 1}`}
                          aria-invalid={dup || undefined}
                          value={l.label}
                          placeholder="ระบุล็อค"
                          onChange={(e) => renameLock(l.id, e.target.value)}
                        />
                      </InputGroup>

                      <Select
                        value={l.warehouseId}
                        onValueChange={(v) => moveLocksToWarehouse([l.id], v)}
                      >
                        <SelectTrigger aria-label={`คลังของล็อค ${name}`} className="w-full bg-card">
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

                      <span aria-hidden className="hidden @3xl:block" />

                      <label className="flex w-fit cursor-pointer items-center gap-3">
                        <Switch
                          checked={l.enabled}
                          onCheckedChange={(v) => askToggle(l, v)}
                          aria-label={`การใช้งานของล็อค ${name}`}
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
                        aria-label={`ลากเพื่อเรียงล็อค ${name}`}
                        title="ลากเพื่อเรียงลำดับ"
                        className="cursor-grab text-foreground active:cursor-grabbing"
                      >
                        <ChevronsUpDownIcon />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`ลบล็อค ${name}`}
                        className="text-foreground hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => askDelete([l.id])}
                      >
                        <Trash2Icon />
                      </Button>
                    </li>
                  );
                })}
              </ol>
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-center">
          <Button
            variant="outline-primary"
            className="bg-card"
            onClick={addRow}
            disabled={warehouses.length === 0}
          >
            <PlusIcon />
            เพิ่มล็อค
          </Button>
        </div>
      </main>

      <SetupFooter dirty={dirty.locks} onSave={save} />

      {/* จอแคบ: ตัวกรองสถานะ */}
      <Dialog open={filterOpen} onOpenChange={setFilterOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader className="text-left">
            <DialogTitle>ตัวกรองและการแสดงผล</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="lock-status">สถานะ</Label>
            {statusSelect(draftStatus, setDraftStatus, { id: "lock-status", className: "w-full" })}
          </div>
          <div className="flex items-center justify-between gap-3">
            <Button variant="ghost" className="text-primary" onClick={() => setDraftStatus(undefined)}>
              <RotateCcwIcon />
              ล้างค่า
            </Button>
            <Button
              onClick={() => {
                setStatus(draftStatus);
                setFilterOpen(false);
              }}
            >
              ตกลง
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader className="text-left">
            <DialogTitle>แก้ไขคลัง</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="bulk-warehouse">ประเภทสินค้า</Label>
            <Select value={bulkTo} onValueChange={setBulkTo}>
              <SelectTrigger id="bulk-warehouse" className="w-full">
                <SelectValue placeholder="ประเภทสินค้า" />
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
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline-primary" onClick={() => setBulkOpen(false)}>
              ย้อนกลับ
            </Button>
            <Button disabled={!bulkTo} onClick={applyBulk}>
              บันทึก
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ยืนยัน ลบ / เปิด / ปิดใช้งาน — กล่องเล็กหัวข้อกลาง ตามแบบ */}
      <AlertDialog open={ask !== null} onOpenChange={(o) => !o && setAsk(null)}>
        <AlertDialogContent size="sm" className="data-[size=sm]:max-w-[25rem]">
          {ask?.kind === "delete" && (
            <>
              <AlertDialogHeader className="text-center sm:text-center">
                <AlertDialogTitle>คุณต้องการลบล็อคใช่ไหม?</AlertDialogTitle>
                <AlertDialogDescription>
                  {ask.ids.length > 1 && `${ask.ids.length} ล็อคที่เลือก`}
                  {ask.ids.length > 1 && <br />}
                  หากลบแล้วจะไม่สามารถกู้คืนข้อมูลได้อีก
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel variant="outline-primary">ย้อนกลับ</AlertDialogCancel>
                <AlertDialogAction onClick={() => confirmDelete(ask.ids)}>ลบ</AlertDialogAction>
              </AlertDialogFooter>
            </>
          )}
          {ask?.kind === "toggle" && (
            <>
              <AlertDialogHeader className="text-center sm:text-center">
                <AlertDialogTitle>
                  คุณต้องการ{ask.on ? "เปิด" : "ปิด"}ใช้งานใช่ไหม?
                </AlertDialogTitle>
                <AlertDialogDescription>ล็อค: {label(ask.lock)}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel variant="outline-primary">ย้อนกลับ</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    setEntityEnabled("locks", ask.lock.id, ask.on);
                    toast.success(`${ask.on ? "เปิด" : "ปิด"}ใช้งานสำเร็จ`, {
                      description: `ล็อค: ${label(ask.lock)}`,
                    });
                  }}
                >
                  {ask.on ? "เปิด" : "ปิด"}ใช้งาน
                </AlertDialogAction>
              </AlertDialogFooter>
            </>
          )}
          {ask?.kind === "blocked" && (
            <>
              <AlertDialogHeader className="text-center sm:text-center">
                <AlertDialogTitle>ไม่สามารถปิดใช้งานได้</AlertDialogTitle>
                <AlertDialogDescription>
                  ล็อค {label(ask.lock)} ยังมีสินค้าคงเหลือ
                  <br />
                  กรุณาย้ายสินค้าออกจากล็อคให้หมด
                  <br />
                  แล้วลองอีกครั้ง
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogAction className="col-span-full w-full">ตกลง</AlertDialogAction>
              </AlertDialogFooter>
            </>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
