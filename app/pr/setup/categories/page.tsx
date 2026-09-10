"use client";

import * as React from "react";
import Link from "next/link";
import { PlusIcon, Trash2Icon } from "lucide-react";
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
import { Label } from "@peckey954/ui/components/ui/label";
import { toast } from "sonner";
import { CheckChip } from "@/components/check-chip";
import { SetupCrumbs, SetupFooter } from "@/components/pr/setup-footer";
import { usePrSetup } from "@/components/pr/pr-setup-provider";
import {
  categoriesWithoutWarehouse,
  categoryImpact,
  describeCategoryImpact,
} from "@/lib/pr-setup";

/* ------------------------------------------------------------------
   ประเภทสินค้า — ตัวกลางของสายการตั้งค่า

   ประเภทเป็นตัวเชื่อมสองด้าน: ขึ้นไปหาคลัง (ของประเภทนี้เข้าคลังไหน)
   และลงมาหาสินค้า (สินค้าตัวนี้อยู่ประเภทไหน) ลบประเภทหนึ่งจึงกระทบทั้งสองทาง
   ต้องบอกจำนวนสินค้าที่กระทบก่อนยืนยัน ไม่ใช่ลบแล้วค่อยไปเจอเองว่าของไม่มีประเภท

   หนึ่งประเภทไปได้หลายคลัง — ของบางอย่างเก็บสองที่จริง
------------------------------------------------------------------ */

export default function CategoriesPage() {
  const {
    setup,
    addCategory,
    renameCategory,
    deleteCategory,
    toggleWarehouse,
    countProductsIn,
    reset,
    dirty,
  } = usePrSetup();

  const [confirm, setConfirm] = React.useState<{
    id: string;
    label: string;
  } | null>(null);

  const orphans = categoriesWithoutWarehouse(setup);
  const affected = confirm ? countProductsIn(confirm.id) : 0;
  // ประเภทไม่ได้ผูกอยู่แค่กับสินค้า ใบขอซื้อทุกใบก็ชี้กลับมาที่นี่ด้วย
  const docImpact = confirm ? categoryImpact(confirm.id) : null;
  const docNote = docImpact ? describeCategoryImpact(docImpact) : null;

  return (
    <>
      <main className="mx-auto w-full max-w-7xl px-4 pt-3 pb-24 sm:px-6 sm:pt-5">
        <SetupCrumbs page="ประเภทสินค้า" />

        <div className="mt-2 flex flex-wrap items-start justify-between gap-3 sm:mt-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight">ประเภทสินค้า</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              ประเภทที่เลือกได้ตอนสร้างใบขอซื้อ และแต่ละประเภทเมื่อของเข้ามาแล้ว
              จะไปอยู่คลังไหน — หนึ่งประเภทเลือกได้หลายคลัง
            </p>
          </div>
          <Button variant="outline-primary" className="shrink-0" onClick={addCategory}>
            <PlusIcon />
            เพิ่มประเภท
          </Button>
        </div>

        {orphans.length > 0 && (
          <p className="mt-3 rounded-xl border border-chip-yellow-foreground/40 bg-chip-yellow px-4 py-3 text-sm">
            มี {orphans.length} ประเภทที่ยังไม่ได้เลือกคลัง —
            ขอซื้อเข้ามาแล้วระบบจะไม่รู้ว่าของลงคลังไหน
          </p>
        )}

        <div className="mt-4 rounded-xl border border-border bg-card p-4 sm:p-5">
          {setup.categories.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
              ยังไม่มีประเภทสินค้า — กดเพิ่มประเภทด้านบน
            </p>
          ) : (
            <div className="space-y-3">
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
                        /* คลังอยู่คนละหน้าแล้ว ต้องเป็นลิงก์พาไป ไม่ใช่บอกให้เลื่อนหา */
                        <Link
                          href="/pr/setup/warehouses"
                          className="text-sm text-primary underline underline-offset-2"
                        >
                          ยังไม่มีคลัง — ไปเพิ่มคลังก่อน
                        </Link>
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

                  <div className="flex flex-col items-start gap-1 @3xl:items-end @3xl:pt-6">
                    <Button
                      variant="outline"
                      size="icon"
                      aria-label={`ลบประเภท ${c.label || "ที่ยังไม่ได้ตั้งชื่อ"}`}
                      className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => setConfirm({ id: c.id, label: c.label })}
                    >
                      <Trash2Icon />
                    </Button>
                    {/* บอกน้ำหนักของประเภทนี้ตรงนี้เลย ไม่ต้องรอกดลบก่อนถึงจะรู้ */}
                    <UsageNote categoryId={c.id} products={countProductsIn(c.id)} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <SetupFooter
        dirty={dirty.categories}
        onReset={() => reset("categories")}
        onSave={() =>
          toast.success("บันทึกประเภทสินค้าแล้ว", {
            description: `${setup.categories.length} ประเภท${
              orphans.length > 0 ? ` · ${orphans.length} ประเภทยังไม่ได้เลือกคลัง` : ""
            }`,
          })
        }
      />

      {/* ลบประเภทกระทบสองทาง — ต้องบอกจำนวนสินค้าที่จะกลายเป็นไม่มีประเภทด้วย */}
      <AlertDialog
        open={confirm !== null}
        onOpenChange={(o) => !o && setConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ลบประเภทสินค้านี้?</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{confirm?.label || "(ยังไม่ได้ตั้งชื่อ)"}&quot;
              จะหายจากตัวเลือกตอนสร้างใบขอซื้อ
              {affected > 0 &&
                ` สินค้า ${affected} รายการที่อยู่ประเภทนี้จะกลายเป็นยังไม่ระบุประเภท (ตัวสินค้าไม่หาย)`}
            </AlertDialogDescription>
            {/* ใบขอซื้อที่เปิดค้างอยู่คือของที่มีคนรอจริง ต้องเห็นก่อนกดยืนยัน
                ตัวใบไม่พังเพราะชื่อประเภทปักไว้ใน categoryLabel ตั้งแต่วันสร้าง
                แต่คนที่ถือใบอยู่จะเลือกประเภทนี้ซ้ำไม่ได้อีกแล้ว */}
            {docNote && (
              <p className="rounded-xl border border-chip-yellow-foreground/40 bg-chip-yellow px-4 py-3 text-sm">
                {docNote} — ใบเหล่านั้นยังโชว์ชื่อ &ldquo;{confirm?.label}&rdquo; ตามที่บันทึกไว้
                วันที่สร้าง ไม่หายไปไหน แต่จะเลือกประเภทนี้ในใบใหม่ไม่ได้อีก
              </p>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!confirm) return;
                deleteCategory(confirm.id);
                toast.success("ลบประเภทสินค้าแล้ว", {
                  description:
                    affected > 0
                      ? `สินค้า ${affected} รายการกลายเป็นยังไม่ระบุประเภท`
                      : confirm.label || "(ยังไม่ได้ตั้งชื่อ)",
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

/** น้ำหนักของประเภทหนึ่ง: สินค้าที่สังกัด + ใบขอซื้อที่ยังเดินอยู่
 *  โชว์ตัวเลขใบที่ยังเดินอยู่เท่านั้น ใบที่จบแล้วเป็นประวัติ ไม่ได้ห้ามใครทำอะไร
 *  เลยไม่ควรมากินที่ในแถว (ตัวเต็มอยู่ในกล่องยืนยันตอนกดลบ) */
function UsageNote({
  categoryId,
  products,
}: {
  categoryId: string;
  products: number;
}) {
  const { open } = categoryImpact(categoryId);
  const bits: string[] = [];
  if (products > 0) bits.push(`สินค้า ${products}`);
  if (open > 0) bits.push(`ใบขอซื้อเดินอยู่ ${open}`);
  if (bits.length === 0) return null;
  return (
    <span className="text-xs text-muted-foreground @3xl:text-end">
      {bits.join(" · ")}
    </span>
  );
}
