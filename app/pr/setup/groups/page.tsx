"use client";

import * as React from "react";
import { PackageIcon, PlusIcon, Trash2Icon } from "lucide-react";
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
   หมวดสินค้า — สายผลิตภัณฑ์/แบรนด์ (PNR, แม่ปุ๋ย, Bio, Bulk, ...)

   **หมวดผูกกับสินค้าอย่างเดียว ไม่เกี่ยวกับคลังเลย** จึงไม่มีชิปเลือกคลัง
   เหมือนหน้าประเภทสินค้า — ประเภทเป็นตัวบอกว่าของเข้าคลังไหน ส่วนหมวดเป็นแค่
   การจัดกลุ่มไว้ดู/ค้น สินค้าหนึ่งตัวมีทั้งสองอย่างและไม่ต้องสอดคล้องกัน
------------------------------------------------------------------ */

export default function GroupsPage() {
  const {
    setup,
    addGroup,
    renameGroup,
    deleteGroup,
    countProductsInGroup,
    reset,
    dirty,
  } = usePrSetup();

  const [confirm, setConfirm] = React.useState<{
    id: string;
    label: string;
  } | null>(null);

  const affected = confirm ? countProductsInGroup(confirm.id) : 0;

  return (
    <>
      <main className="mx-auto w-full max-w-7xl px-4 pt-3 pb-24 sm:px-6 sm:pt-5">
        <SetupCrumbs page="หมวดสินค้า" />

        <div className="mt-2 flex flex-wrap items-start justify-between gap-3 sm:mt-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight">หมวดสินค้า</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              สายผลิตภัณฑ์ที่ใช้จัดกลุ่มสินค้า — ใช้กับสินค้าอย่างเดียว
              ไม่เกี่ยวกับคลังปลายทาง (ตรงนั้นกำหนดที่ประเภทสินค้า)
            </p>
          </div>
          <Button variant="outline-primary" className="shrink-0" onClick={addGroup}>
            <PlusIcon />
            เพิ่มหมวด
          </Button>
        </div>

        <div className="mt-4 rounded-xl border border-border bg-card p-4 sm:p-5">
          {setup.groups.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
              ยังไม่มีหมวด — กดเพิ่มหมวดด้านบน
            </p>
          ) : (
            <div className="space-y-3">
              {setup.groups.map((g) => {
                const used = countProductsInGroup(g.id);
                return (
                  <div
                    key={g.id}
                    className="grid gap-3 border-t border-border pt-3 first:border-0 first:pt-0 @3xl:grid-cols-[16rem_1fr_auto] @3xl:items-center @3xl:gap-4"
                  >
                    <InputGroup className="bg-card">
                      <InputGroupInput
                        aria-label="ชื่อหมวด"
                        value={g.label}
                        placeholder="ตั้งชื่อหมวด"
                        onChange={(e) => renameGroup(g.id, e.target.value)}
                      />
                    </InputGroup>

                    <p className="flex items-center gap-2 text-sm text-muted-foreground">
                      <PackageIcon className="size-4 shrink-0" />
                      {used > 0
                        ? `มีสินค้า ${used} รายการ`
                        : "ยังไม่มีสินค้าในหมวดนี้"}
                    </p>

                    <Button
                      variant="outline"
                      size="icon"
                      aria-label={`ลบหมวด ${g.label || "ที่ยังไม่ได้ตั้งชื่อ"}`}
                      className="justify-self-end border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => setConfirm({ id: g.id, label: g.label })}
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
        dirty={dirty.groups}
        onReset={() => reset("groups")}
        onSave={() =>
          toast.success("บันทึกหมวดสินค้าแล้ว", {
            description: `${setup.groups.length} หมวด`,
          })
        }
      />

      <AlertDialog
        open={confirm !== null}
        onOpenChange={(o) => !o && setConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ลบหมวดนี้?</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{confirm?.label || "(ยังไม่ได้ตั้งชื่อ)"}&quot;
              จะหายจากตัวเลือกหมวดของสินค้า
              {affected > 0
                ? ` และสินค้า ${affected} รายการในหมวดนี้จะกลายเป็นยังไม่ระบุหมวด (ตัวสินค้าไม่หาย และยังเข้าคลังตามประเภทเดิม)`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!confirm) return;
                deleteGroup(confirm.id);
                toast.success("ลบหมวดแล้ว", {
                  description:
                    affected > 0
                      ? `สินค้า ${affected} รายการกลายเป็นยังไม่ระบุหมวด`
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
