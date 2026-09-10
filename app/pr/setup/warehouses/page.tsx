"use client";

import * as React from "react";
import { PlusIcon, Trash2Icon, WarehouseIcon } from "lucide-react";
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
import {
  InputGroup,
  InputGroupInput,
} from "@peckey954/ui/components/ui/input-group";
import { toast } from "sonner";
import { SetupCrumbs, SetupFooter } from "@/components/pr/setup-footer";
import { usePrSetup } from "@/components/pr/pr-setup-provider";

/* ------------------------------------------------------------------
   คลัง — หน้าแรกของสายการตั้งค่า เพราะประเภทสินค้าอ้างถึงคลัง
   ต้องมีคลังอยู่ก่อนถึงจะกำหนดได้ว่าประเภทไหนเข้าคลังไหน

   ส่วนที่เล็กและนิ่งที่สุดในสามส่วน — สามแถวและแทบไม่เปลี่ยน
------------------------------------------------------------------ */

export default function WarehousesPage() {
  const {
    setup,
    addWarehouse,
    renameWarehouse,
    deleteWarehouse,
    reset,
    dirty,
  } = usePrSetup();

  const [confirm, setConfirm] = React.useState<{
    id: string;
    label: string;
  } | null>(null);

  return (
    <>
      <main className="mx-auto w-full max-w-7xl px-4 pt-3 pb-24 sm:px-6 sm:pt-5">
        <SetupCrumbs page="คลัง" />

        <div className="mt-2 flex flex-wrap items-start justify-between gap-3 sm:mt-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight">คลัง</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              ที่เก็บของที่ขอซื้อเข้ามา — กำหนดว่าประเภทไหนเข้าคลังไหนที่หน้าประเภทสินค้า
            </p>
          </div>
          <Button variant="outline-primary" className="shrink-0" onClick={addWarehouse}>
            <PlusIcon />
            เพิ่มคลัง
          </Button>
        </div>

        <div className="mt-4 rounded-xl border border-border bg-card p-4 sm:p-5">
          {setup.warehouses.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
              ยังไม่มีคลัง — กดเพิ่มคลังด้านบน
            </p>
          ) : (
            <div className="space-y-3">
              {setup.warehouses.map((w) => {
                const used = setup.categories.filter((c) =>
                  c.warehouseIds.includes(w.id),
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
                      {used > 0
                        ? `รับ ${used} ประเภทสินค้า`
                        : "ยังไม่มีประเภทไหนส่งเข้าคลังนี้"}
                    </p>

                    <Button
                      variant="outline"
                      size="icon"
                      aria-label={`ลบคลัง ${w.label || "ที่ยังไม่ได้ตั้งชื่อ"}`}
                      className="justify-self-end border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => setConfirm({ id: w.id, label: w.label })}
                    >
                      <Trash2Icon />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <SetupFooter
        dirty={dirty.warehouses}
        onReset={() => reset("warehouses")}
        onSave={() =>
          toast.success("บันทึกคลังแล้ว", {
            description: `${setup.warehouses.length} คลัง`,
          })
        }
      />

      {/* ลบแล้วกู้คืนไม่ได้ ต้องถามก่อนเสมอ — โดยเฉพาะของที่มีเอกสารเก่าอ้างถึงอยู่ */}
      <AlertDialog
        open={confirm !== null}
        onOpenChange={(o) => !o && setConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ลบคลังนี้?</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{confirm?.label || "(ยังไม่ได้ตั้งชื่อ)"}&quot;
              จะถูกปลดออกจากทุกประเภทที่ส่งของเข้าคลังนี้ สินค้าไม่หาย
              แต่ประเภทที่เหลือคลังเดียวอาจกลายเป็นไม่มีปลายทาง
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!confirm) return;
                deleteWarehouse(confirm.id);
                toast.success("ลบคลังแล้ว", {
                  description: confirm.label || "(ยังไม่ได้ตั้งชื่อ)",
                });
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
