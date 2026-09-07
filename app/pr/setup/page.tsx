"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { PlusIcon, RotateCcwIcon, Trash2Icon, WarehouseIcon } from "lucide-react";
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
import {
  InputGroup,
  InputGroupInput,
} from "@peckey954/ui/components/ui/input-group";
import { Label } from "@peckey954/ui/components/ui/label";
import { toast } from "sonner";
import { CheckChip } from "@/components/check-chip";
import { PrProductsSection } from "@/components/pr/pr-products-section";
import { usePrSetup } from "@/components/pr/pr-setup-provider";
import { categoriesWithoutWarehouse } from "@/lib/pr-setup";

/* ------------------------------------------------------------------
   ตั้งค่าใบขอซื้อ — ประเภทสินค้า และคลังปลายทางของแต่ละประเภท

   สองส่วนแยกกันชัดเจน: ประเภทสินค้า (พร้อมคลังปลายทาง) กับรายชื่อคลัง
   เพิ่ม/ลดได้ทั้งสองฝั่ง ลบคลังแล้วประเภทที่เคยชี้ไปคลังนั้นจะถูกดึงออกให้เอง
   ไม่ทิ้ง id ค้างที่ชี้ไปคลังที่ไม่มีอยู่ (ดู removeWarehouse ใน lib/pr-setup.ts)

   ไม่มี backend จริงตามธรรมชาติของแอปนี้ — กดบันทึกแล้วขึ้น toast เฉย ๆ
------------------------------------------------------------------ */

export default function PrSetupPage() {
  const router = useRouter();
  const {
    setup,
    addCategory,
    renameCategory,
    deleteCategory,
    toggleWarehouse,
    addWarehouse,
    renameWarehouse,
    deleteWarehouse,
    reset,
    dirty,
  } = usePrSetup();

  const [confirm, setConfirm] = React.useState<
    { kind: "category" | "warehouse"; id: string; label: string } | null
  >(null);

  const orphans = categoriesWithoutWarehouse(setup);

  function handleSave() {
    toast.success("บันทึกการตั้งค่าใบขอซื้อแล้ว", {
      description: `${setup.categories.length} ประเภทสินค้า · ${setup.warehouses.length} คลัง`,
    });
  }

  function confirmDelete() {
    if (!confirm) return;
    if (confirm.kind === "category") deleteCategory(confirm.id);
    else deleteWarehouse(confirm.id);
    toast.success(
      confirm.kind === "category" ? "ลบประเภทสินค้าแล้ว" : "ลบคลังแล้ว",
      { description: confirm.label || "(ยังไม่ได้ตั้งชื่อ)" }
    );
    setConfirm(null);
  }

  return (
    <>
      <main className="mx-auto w-full max-w-7xl px-4 pt-3 pb-24 sm:px-6 sm:pt-5">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">ระบบ</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/pr">ขอซื้อ PR</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-primary">ตั้งค่าใบขอซื้อ</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="mt-2 min-w-0 sm:mt-3">
          <h1 className="text-2xl font-semibold tracking-tight">ตั้งค่าใบขอซื้อ</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            กำหนดประเภทสินค้าที่ขอซื้อได้ และแต่ละประเภทเมื่อของเข้ามาแล้วจะไปอยู่คลังไหน
            — หนึ่งประเภทเลือกได้หลายคลัง
          </p>
        </div>

        {orphans.length > 0 && (
          <p className="mt-3 rounded-xl border border-chip-yellow-foreground/40 bg-chip-yellow px-4 py-3 text-sm">
            มี {orphans.length} ประเภทที่ยังไม่ได้เลือกคลัง — ขอซื้อเข้ามาแล้วระบบจะไม่รู้ว่าของลงคลังไหน
          </p>
        )}

        {/* ---------- ประเภทสินค้า ---------- */}
        <section className="mt-4 rounded-xl border border-border bg-card p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-base font-semibold">ประเภทสินค้า</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                ประเภทที่เลือกได้ตอนสร้างใบขอซื้อ และคลังปลายทางของแต่ละประเภท
              </p>
            </div>
            <Button variant="outline-primary" onClick={addCategory}>
              <PlusIcon />
              เพิ่มประเภทสินค้า
            </Button>
          </div>

          <div className="mt-4 space-y-3">
            {setup.categories.map((c) => (
              <div
                key={c.id}
                className="grid gap-3 border-t border-border pt-3 first:border-0 first:pt-0 @3xl:grid-cols-[16rem_1fr_auto] @3xl:items-start @3xl:gap-4"
              >
                <div className="grid gap-1.5">
                  <Label htmlFor={`cat-${c.id}`} className="text-muted-foreground">
                    ชื่อประเภท
                  </Label>
                  <InputGroup className="bg-card">
                    <InputGroupInput
                      id={`cat-${c.id}`}
                      value={c.label}
                      placeholder="ตั้งชื่อประเภทสินค้า"
                      onChange={(e) => renameCategory(c.id, e.target.value)}
                    />
                  </InputGroup>
                </div>

                <div className="grid gap-1.5">
                  <span className="text-sm text-muted-foreground">คลังปลายทาง</span>
                  <div className="flex flex-wrap gap-2">
                    {setup.warehouses.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        ยังไม่มีคลัง — เพิ่มคลังด้านล่างก่อน
                      </p>
                    ) : (
                      setup.warehouses.map((w) => (
                        <CheckChip
                          key={w.id}
                          id={`${c.id}-${w.id}`}
                          label={w.label || "(ยังไม่ได้ตั้งชื่อ)"}
                          checked={c.warehouseIds.includes(w.id)}
                          onChange={(v) => toggleWarehouse(c.id, w.id, v)}
                        />
                      ))
                    )}
                  </div>
                </div>

                <div className="flex @3xl:pt-6">
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label={`ลบประเภท ${c.label || "ที่ยังไม่ได้ตั้งชื่อ"}`}
                    className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() =>
                      setConfirm({ kind: "category", id: c.id, label: c.label })
                    }
                  >
                    <Trash2Icon />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ---------- คลัง ---------- */}
        <section className="mt-4 rounded-xl border border-border bg-card p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-base font-semibold">คลัง</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                ลบคลังแล้วประเภทที่เคยส่งเข้าคลังนั้นจะถูกปลดออกให้อัตโนมัติ
              </p>
            </div>
            <Button variant="outline-primary" onClick={addWarehouse}>
              <PlusIcon />
              เพิ่มคลัง
            </Button>
          </div>

          <div className="mt-4 space-y-3">
            {setup.warehouses.map((w) => {
              const used = setup.categories.filter((c) =>
                c.warehouseIds.includes(w.id)
              ).length;
              return (
                <div
                  key={w.id}
                  className="grid gap-3 border-t border-border pt-3 first:border-0 first:pt-0 @3xl:grid-cols-[16rem_1fr_auto] @3xl:items-center @3xl:gap-4"
                >
                  <InputGroup className="bg-card">
                    <InputGroupInput
                      aria-label="ชื่อคลัง"
                      value={w.label}
                      placeholder="ตั้งชื่อคลัง"
                      onChange={(e) => renameWarehouse(w.id, e.target.value)}
                    />
                  </InputGroup>

                  <p className="flex items-center gap-2 text-sm text-muted-foreground">
                    <WarehouseIcon className="size-4 shrink-0" />
                    {used > 0 ? `รับ ${used} ประเภทสินค้า` : "ยังไม่มีประเภทไหนส่งเข้าคลังนี้"}
                  </p>

                  <Button
                    variant="outline"
                    size="icon"
                    aria-label={`ลบคลัง ${w.label || "ที่ยังไม่ได้ตั้งชื่อ"}`}
                    className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() =>
                      setConfirm({ kind: "warehouse", id: w.id, label: w.label })
                    }
                  >
                    <Trash2Icon />
                  </Button>
                </div>
              );
            })}
          </div>
        </section>

        {/* ---------- สินค้า ---------- */}
        <PrProductsSection />
      </main>

      {/* ---------- แถบปุ่มล่าง ---------- */}
      <div className="sticky bottom-0 z-30 border-t border-border bg-surface">
        <div className="mx-auto w-full max-w-7xl px-4 py-3 sm:px-8">
          <div className="flex flex-col gap-3 @lg:hidden">
            {dirty && (
              <Button variant="outline-primary" className="w-full" onClick={reset}>
                <RotateCcwIcon />
                คืนค่าเริ่มต้น
              </Button>
            )}
            <div className="flex items-center gap-3">
              <Button
                variant="outline-primary"
                className="flex-1"
                onClick={() => router.back()}
              >
                ย้อนกลับ
              </Button>
              <Button className="flex-1" onClick={handleSave}>
                บันทึก
              </Button>
            </div>
          </div>

          <div className="hidden items-center justify-between gap-3 @lg:flex">
            <Button variant="outline-primary" onClick={() => router.back()}>
              ย้อนกลับ
            </Button>
            <div className="flex items-center gap-3">
              <Button variant="outline-primary" disabled={!dirty} onClick={reset}>
                <RotateCcwIcon />
                คืนค่าเริ่มต้น
              </Button>
              <Button onClick={handleSave}>บันทึก</Button>
            </div>
          </div>
        </div>
      </div>

      {/* ลบแล้วกู้คืนไม่ได้ ต้องถามก่อนเสมอ — โดยเฉพาะของที่มีเอกสารเก่าอ้างถึงอยู่ */}
      <AlertDialog open={confirm !== null} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirm?.kind === "category" ? "ลบประเภทสินค้านี้?" : "ลบคลังนี้?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirm?.kind === "category"
                ? `"${confirm?.label || "(ยังไม่ได้ตั้งชื่อ)"}" จะหายจากตัวเลือกตอนสร้างใบขอซื้อ ใบเก่าที่ใช้ประเภทนี้อยู่ยังอยู่เหมือนเดิม`
                : `"${confirm?.label || "(ยังไม่ได้ตั้งชื่อ)"}" จะถูกปลดออกจากทุกประเภทที่ส่งของเข้าคลังนี้`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>ลบ</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
