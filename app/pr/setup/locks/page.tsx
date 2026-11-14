"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { Switch } from "@peckey954/ui/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@peckey954/ui/components/ui/tabs";
import { cn } from "@peckey954/ui/lib/utils";
import { toast } from "sonner";
import { SetupCrumbs, SetupFooter } from "@/components/pr/setup-footer";
import { usePrSetup } from "@/components/pr/pr-setup-provider";
import { duplicateLockIds, lockKey, type StorageLock } from "@/lib/pr-setup";

/* ------------------------------------------------------------------
   ล็อค — ตำแหน่งเก็บของในแต่ละคลัง (เดิมเรียกโซน)

   เลือกคลังจากแท็บด้านบนครั้งเดียว แล้วทุกแถวในตารางเป็นของคลังนั้น
   ไม่ต้องมีช่องเลือกคลังทุกแถว — ล็อคหนึ่งอยู่คลังเดียว และตอนตั้งค่าจริง
   คนไล่ใส่ทีละคลังอยู่แล้ว การให้เลือกคลังซ้ำทุกแถวมีแต่เปิดโอกาสเลือกผิด

   ตารางพิมพ์ได้ทันทีและใส่ได้เรื่อย ๆ:
   - Enter ไปแถวถัดไป ถ้าเป็นแถวสุดท้ายที่มีชื่อแล้วจะเพิ่มแถวใหม่ให้
   - วางรายชื่อหลายบรรทัด (ก็อปคอลัมน์จาก Excel) แตกเป็นหลายแถวทีเดียว
   - ชื่อซ้ำในคลังเดียวกันขึ้นแดงที่แถวนั้นเลย ไม่รอกดบันทึก

   เข้าจากแถวคลังในหน้าคลัง (?wh=) จึงเปิดมาที่คลังนั้นทันที
------------------------------------------------------------------ */

export default function LocksPage() {
  return (
    <React.Suspense fallback={null}>
      <LocksScreen />
    </React.Suspense>
  );
}

function LocksScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    setup,
    addLock,
    addLocks,
    renameLock,
    deleteLock,
    setEntityEnabled,
    reset,
    dirty,
  } = usePrSetup();

  const warehouses = setup.warehouses;
  const requested = searchParams.get("wh");
  const [whId, setWhId] = React.useState(
    () =>
      warehouses.find((w) => w.id === requested)?.id ?? warehouses[0]?.id ?? "",
  );
  const wh = warehouses.find((w) => w.id === whId);

  const rows = setup.locks.filter((l) => l.warehouseId === whId);
  const dupes = duplicateLockIds(setup.locks);

  const [confirm, setConfirm] = React.useState<StorageLock | null>(null);

  // ย้าย focus หลังเพิ่มแถวหรือสลับคลัง — แถวนั้นอาจยังไม่ถูกวาด จึงจำไอดีไว้
  // แล้วโฟกัสหลังวาดเสร็จ ถ้าแถวมีอยู่แล้วก็โฟกัสได้ทันที
  const inputs = React.useRef(new Map<string, HTMLInputElement>());
  const pendingFocus = React.useRef<string | null>(null);
  const setFocusId = (id: string) => {
    const el = inputs.current.get(id);
    if (el) el.focus();
    else pendingFocus.current = id;
  };
  React.useEffect(() => {
    const id = pendingFocus.current;
    if (!id) return;
    inputs.current.get(id)?.focus();
    pendingFocus.current = null;
  }, [setup.locks, whId]);

  const switchWarehouse = (id: string) => {
    setWhId(id);
    // แทนที่ URL ไม่ใช่ push — สลับแท็บไม่ควรกลายเป็นประวัติให้กดย้อนกลับทีละคลัง
    router.replace(`/pr/setup/locks?wh=${id}`, { scroll: false });
  };

  const addRow = (after?: string) => setFocusId(addLock(whId, "", after));

  const onEnter = (l: StorageLock, i: number) => {
    const next = rows[i + 1];
    if (next) setFocusId(next.id);
    else if (l.label.trim()) addRow(l.id);
  };

  /** วางหลายชื่อ — แถวที่วางลงถ้ายังว่างได้ชื่อแรก ที่เหลือแทรกต่อจากแถวนั้น
   *  ข้ามชื่อที่มีอยู่แล้วในคลังนี้ และบอกว่าข้ามไปกี่ชื่อ ไม่ใช่เงียบ */
  const onPaste = (l: StorageLock, e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData("text");
    if (!/[\r\n\t]/.test(text)) return; // ชื่อเดียว ปล่อยให้วางปกติ
    e.preventDefault();

    const taken = new Set(
      rows.filter((r) => r.id !== l.id).map((r) => lockKey(r.label)),
    );
    const names: string[] = [];
    let skipped = 0;
    for (const raw of text.split(/[\r\n\t]+/)) {
      const name = raw.trim();
      if (!name) continue;
      if (taken.has(lockKey(name))) {
        skipped += 1;
        continue;
      }
      taken.add(lockKey(name));
      names.push(name);
    }
    if (names.length === 0) {
      toast.error("ไม่มีล็อคใหม่ให้เพิ่ม", {
        description: `${skipped} ชื่อมีอยู่แล้วใน${wh?.label ?? "คลังนี้"}`,
      });
      return;
    }

    const empty = !l.label.trim();
    if (empty) renameLock(l.id, names[0]);
    addLocks(whId, empty ? names.slice(1) : names, l.id);
    toast.success(`เพิ่ม ${names.length} ล็อค`, {
      description:
        skipped > 0 ? `ข้าม ${skipped} ชื่อที่มีอยู่แล้วในคลังนี้` : wh?.label,
    });
  };

  const save = () => {
    const mine = dupes.size > 0 ? setup.locks.filter((l) => dupes.has(l.id)) : [];
    if (mine.length > 0) {
      const first = mine[0];
      const where = warehouses.find((w) => w.id === first.warehouseId);
      toast.error("บันทึกไม่ได้ — มีชื่อล็อคซ้ำ", {
        description: `"${first.label.trim()}" ซ้ำกันใน${where?.label ?? "คลังเดียวกัน"}`,
      });
      if (first.warehouseId !== whId) switchWarehouse(first.warehouseId);
      setFocusId(first.id);
      return;
    }
    // แถวที่เพิ่มแล้วไม่ได้ใส่ชื่อ ทิ้งไปเลย ไม่ใช่บันทึกล็อคไร้ชื่อ
    const blank = setup.locks.filter((l) => !l.label.trim());
    blank.forEach((l) => deleteLock(l.id));
    const total = setup.locks.length - blank.length;
    toast.success("บันทึกล็อคแล้ว", {
      description: `${total} ล็อค ใน ${warehouses.length} คลัง`,
    });
  };

  return (
    <>
      <main className="mx-auto w-full max-w-7xl px-4 pt-3 pb-24 sm:px-6 sm:pt-5">
        <SetupCrumbs page="ล็อค" />

        <div className="mt-2 sm:mt-3">
          <h1 className="text-2xl font-semibold tracking-tight">ล็อค</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            ตำแหน่งเก็บของในแต่ละคลัง — เลือกคลังด้านล่างแล้วพิมพ์ชื่อล็อคต่อกันได้เลย
            กด Enter เพื่อขึ้นแถวใหม่ หรือวางรายชื่อจาก Excel ทีเดียวทั้งคอลัมน์
          </p>
        </div>

        {warehouses.length === 0 ? (
          <p className="mt-4 rounded-xl border border-dashed border-border px-4 py-12 text-center text-sm text-muted-foreground">
            ยังไม่มีคลัง — เพิ่มคลังที่หน้าคลังก่อน แล้วค่อยกลับมาใส่ล็อค
          </p>
        ) : (
          <>
            <Tabs
              value={whId}
              onValueChange={switchWarehouse}
              className="mt-4 sm:mt-5"
            >
              <TabsList className="w-full">
                {warehouses.map((w) => {
                  const name = w.label.trim() || "(ยังไม่ได้ตั้งชื่อ)";
                  // จอแคบสามแท็บเต็มชื่อไม่พอ ตัด "สต็อก" ที่ซ้ำกันทุกคลังออก
                  const short = name.replace(/^สต็อก\s*/, "") || name;
                  const count = setup.locks.filter((l) => l.warehouseId === w.id).length;
                  return (
                    <TabsTrigger key={w.id} value={w.id} className="flex-1">
                      <span className="@3xl:hidden">{short}</span>
                      <span className="hidden @3xl:inline">{name}</span> ({count})
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </Tabs>

            <div className="mt-4 rounded-xl border border-border bg-card">
              {/* หัวตาราง — จอแคบไม่มี เพราะแต่ละแถวพับเป็นสองบรรทัดแล้ว */}
              <div className="hidden grid-cols-[2.5rem_minmax(0,22rem)_1fr_auto] items-center gap-4 border-b border-border px-5 py-3 text-sm text-muted-foreground @3xl:grid">
                <span>#</span>
                <span>ชื่อล็อค</span>
                <span>การใช้งาน</span>
                <span className="w-9" />
              </div>

              {rows.length === 0 ? (
                <p className="px-4 py-10 text-center text-sm text-muted-foreground">
                  {wh?.label || "คลังนี้"}ยังไม่มีล็อค — กดเพิ่มล็อคด้านล่าง
                </p>
              ) : (
                <ol>
                  {rows.map((l, i) => {
                    const dup = dupes.has(l.id);
                    return (
                      <li
                        key={l.id}
                        className={cn(
                          "grid grid-cols-[2rem_1fr_auto] items-start gap-x-3 gap-y-2 border-b border-border px-4 py-3 @3xl:grid-cols-[2.5rem_minmax(0,22rem)_1fr_auto] @3xl:gap-x-4 @3xl:px-5",
                          !l.enabled && "bg-muted/40",
                        )}
                      >
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
                              onKeyDown={(e) => {
                                // ระหว่างพิมพ์ไทยด้วย IME Enter คือยืนยันคำ ไม่ใช่ขึ้นแถวใหม่
                                if (e.key !== "Enter" || e.nativeEvent.isComposing) return;
                                e.preventDefault();
                                onEnter(l, i);
                              }}
                              onPaste={(e) => onPaste(l, e)}
                            />
                          </InputGroup>
                          {dup && (
                            <p className="mt-1 text-xs text-danger-strong">
                              ชื่อซ้ำกับล็อคอื่นใน{wh?.label || "คลังนี้"}
                            </p>
                          )}
                        </div>

                        {/* จอแคบ: สวิตช์ลงไปบรรทัดล่างใต้ช่องชื่อ ปุ่มลบอยู่ขวาของช่องชื่อ */}
                        <label className="col-start-2 row-start-2 flex w-fit cursor-pointer items-center gap-2 @3xl:col-start-3 @3xl:row-start-1 @3xl:pt-1.5">
                          <Switch
                            checked={l.enabled}
                            onCheckedChange={(v) => setEntityEnabled("locks", l.id, v)}
                            aria-label={`การใช้งานของล็อค ${l.label || `แถวที่ ${i + 1}`}`}
                          />
                          <span className="text-sm whitespace-nowrap">
                            {l.enabled ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                          </span>
                        </label>

                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`ลบล็อค ${l.label || `แถวที่ ${i + 1}`}`}
                          className="col-start-3 row-start-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive @3xl:col-start-4"
                          onClick={() => {
                            // ล็อคที่มากับระบบอาจมีของวางอยู่ ต้องถามก่อน
                            // แถวที่เพิ่งเพิ่มเองยังไม่มีอะไรอ้างถึง ลบได้ทันที
                            if (l.builtIn) setConfirm(l);
                            else deleteLock(l.id);
                          }}
                        >
                          <Trash2Icon />
                        </Button>
                      </li>
                    );
                  })}
                </ol>
              )}

              <div className="p-3 @3xl:px-5">
                <Button
                  variant="ghost"
                  className="w-full justify-center border border-dashed border-border text-primary hover:border-primary hover:bg-brand"
                  onClick={() => addRow()}
                >
                  <PlusIcon />
                  เพิ่มล็อค
                </Button>
              </div>
            </div>
          </>
        )}
      </main>

      <SetupFooter
        dirty={dirty.locks}
        onReset={() => reset("locks")}
        onSave={save}
      />

      <AlertDialog
        open={confirm !== null}
        onOpenChange={(o) => !o && setConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ลบล็อคนี้?</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{confirm?.label || "(ยังไม่ได้ตั้งชื่อ)"}&quot; อาจมีของวางอยู่
              ถ้าลบ ของในล็อคนี้จะไม่มีตำแหน่ง ถ้าแค่เลิกใช้ ให้ปิดใช้งานแทน
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
