"use client";

import * as React from "react";
import {
  DownloadIcon,
  FileTextIcon,
  InfoIcon,
  Trash2Icon,
  UploadIcon,
} from "lucide-react";
import { Button } from "@peckey954/ui/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@peckey954/ui/components/ui/dialog";
import { LightTooltip } from "@/components/light-tooltip";
import { cn } from "@peckey954/ui/lib/utils";
import { toast } from "sonner";
import { usePrSetup } from "@/components/pr/pr-setup-provider";
import {
  importProductsCsv,
  warehouseForCategory,
  type CsvImportResult,
} from "@/lib/pr-setup";

/* ------------------------------------------------------------------
   อัปโหลดข้อมูล — ตั้งทั้งชุดจากไฟล์เดียว

   ตัวอย่างข้อมูลอยู่บนสุดก่อนช่องอัปโหลด เพราะคำถามแรกของคนที่กดเข้ามาคือ
   "ไฟล์ต้องหน้าตายังไง" ไม่ใช่ "จะวางไฟล์ตรงไหน" — ตอบก่อนแล้วค่อยให้ทำ
   ปุ่มดาวน์โหลดตัวอย่างอยู่คู่กับตารางนั้น จะได้ไม่ต้องเดาหัวคอลัมน์เอง

   เลือกไฟล์แล้วยังไม่เข้าทันที ต้องกดบันทึกอีกที และถ้ามีอะไรต้องเตือน
   (แถวที่อ่านไม่ได้ / คลังที่ไฟล์บอกแต่ระบบไม่ทำตาม) จะขึ้นให้เห็นก่อนกด
------------------------------------------------------------------ */

const SAMPLE_HEAD = ["สินค้า", "หมวด", "ประเภทสินค้า", "คลัง"];
const SAMPLE_ROW = ["21-0-0 ฟูเจียนผง", "Bulk", "ปุ๋ยจัมโบ้", "สต็อกวัตถุดิบ"];

export function UploadDataDialog({
  children,
  onDone,
}: {
  children: React.ReactNode;
  onDone?: () => void;
}) {
  const { setup, addProducts, toggleWarehouse } = usePrSetup();
  const [open, setOpen] = React.useState(false);
  const [file, setFile] = React.useState<File | null>(null);
  const [result, setResult] = React.useState<CsvImportResult | null>(null);
  const [dragging, setDragging] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  function reset() {
    setFile(null);
    setResult(null);
    setDragging(false);
  }

  async function take(f: File) {
    // .xlsx เป็น ZIP+XML อ่านตรง ๆ ไม่ได้ ต้องมีไลบรารีถอดรหัส — บอกทางออกให้ชัด
    // ดีกว่าปล่อยให้อ่านแล้วได้อักขระขยะเต็มตาราง
    if (/\.(xlsx|xls)$/i.test(f.name)) {
      toast.error("ยังอ่านไฟล์ Excel โดยตรงไม่ได้", {
        description: "เปิดใน Excel แล้ว Save As เป็น CSV UTF-8 ก่อน แล้วอัปโหลดใหม่",
      });
      return;
    }
    setFile(f);
    setResult(
      importProductsCsv(await f.text(), setup.categories, setup.groups, setup.warehouses),
    );
  }

  /** ไฟล์ตัวอย่าง — ใส่ BOM ไว้ข้างหน้า ไม่งั้นเปิดใน Excel บนวินโดวส์
   *  ภาษาไทยจะกลายเป็นอักขระขยะทั้งไฟล์ */
  function downloadTemplate() {
    const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const cat = setup.categories.find((c) => c.label.trim() !== "")?.label ?? "";
    const grp = setup.groups.find((g) => g.label.trim() !== "")?.label ?? "";
    const wh = setup.warehouses.find((w) => w.label.trim() !== "")?.label ?? "";
    const csv =
      "﻿" +
      [
        "ชื่อสินค้า,หมวด,ประเภท,คลัง,หน่วย,บรรจุภัณฑ์",
        [SAMPLE_ROW[0], esc(grp), esc(cat), esc(wh), "ตัน", "50 Kg"].join(","),
      ].join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "ตัวอย่างข้อมูลสินค้า.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function save() {
    if (!result || result.fatal) return;
    // ไฟล์เดียวตั้งได้ทั้งรายการสินค้าและเส้นทางเข้าคลังของประเภทที่ยังไม่เคยตั้ง
    for (const r of result.newRouting) toggleWarehouse(r.categoryId, r.warehouseId, true);
    const n = addProducts(
      result.rows.map((r) => ({
        ...r,
        enabled: true,
        // ไฟล์ระบุคลังของประเภทมาแล้ว ใช้อันนั้นเป็นคลังตั้งต้นของสินค้าเลย
        warehouseId:
          result.newRouting.find((x) => x.categoryId === r.categoryId)?.warehouseId ??
          warehouseForCategory(setup, r.categoryId),
      })),
    );
    toast.success(`นำเข้า ${n} รายการแล้ว`, {
      description:
        [
          result.newRouting.length > 0 && `ตั้งคลังให้ ${result.newRouting.length} ประเภท`,
          result.skipped.length > 0 && `ข้าม ${result.skipped.length} แถว`,
        ]
          .filter(Boolean)
          .join(" · ") || undefined,
    });
    reset();
    setOpen(false);
    onDone?.();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) reset();
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="flex max-h-[88svh] flex-col gap-0 overflow-hidden p-0 sm:max-w-xl">
        <DialogHeader className="px-6 pt-6 text-left">
          <DialogTitle>อัปโหลดข้อมูล</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 overflow-y-auto px-6 py-4">
          {/* ---------- ตัวอย่างข้อมูล ---------- */}
          <div className="rounded-xl border border-border p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="flex items-center gap-1.5 font-medium">
                ตัวอย่างข้อมูล
                <LightTooltip label="หัวคอลัมน์ต้องสะกดตามนี้ ลำดับสลับได้ ส่วนหน่วยกับบรรจุภัณฑ์ใส่เพิ่มได้">
                  <InfoIcon className="size-4 text-muted-foreground" />
                </LightTooltip>
              </p>
              <Button variant="outline-primary" size="sm" onClick={downloadTemplate}>
                <DownloadIcon />
                ดาวน์โหลดตัวอย่าง
              </Button>
            </div>

            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-md text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {SAMPLE_HEAD.map((h) => (
                      <th
                        key={h}
                        scope="col"
                        className="px-3 py-2 text-start font-normal text-muted-foreground"
                      >
                        {h} <span className="text-danger-strong">*</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {SAMPLE_ROW.map((v) => (
                      <td key={v} className="px-3 py-2 whitespace-nowrap">
                        {v}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* ---------- ช่องวางไฟล์ ---------- */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              const f = e.dataTransfer.files?.[0];
              if (f) take(f);
            }}
            className={cn(
              "grid justify-items-center gap-1 rounded-xl border border-dashed px-4 py-8 text-center transition-colors",
              dragging ? "border-primary bg-brand" : "border-primary/40 bg-brand/50",
            )}
          >
            <UploadIcon className="size-6 text-primary" strokeWidth={1.5} />
            <p className="mt-1 font-medium">อัปโหลด / ลากไฟล์มาวางในพื้นที่นี้ได้</p>
            <p className="text-sm text-muted-foreground">
              รองรับไฟล์ CSV (.csv) — ไฟล์ Excel ให้ Save As เป็น CSV ก่อน
            </p>
            <Button
              variant="outline-primary"
              size="sm"
              className="mt-2"
              onClick={() => inputRef.current?.click()}
            >
              อัปโหลดไฟล์
            </Button>
            <input
              ref={inputRef}
              type="file"
              accept=".csv,.txt,.tsv,.xlsx,.xls"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) take(f);
                // ล้างค่าไว้ เลือกไฟล์เดิมซ้ำอีกครั้งจะได้ยังเกิด change
                e.target.value = "";
              }}
            />
          </div>

          {/* ---------- ไฟล์ที่เลือกไว้ + ผลการอ่าน ---------- */}
          {file && (
            <div className="rounded-xl border border-border">
              <div className="flex items-center gap-3 p-4">
                <FileTextIcon className="size-5 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / 1024).toFixed(0)} KB
                    {result && !result.fatal && ` · อ่านได้ ${result.rows.length} รายการ`}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="เอาไฟล์ออก"
                  className="shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  onClick={reset}
                >
                  <Trash2Icon />
                </Button>
              </div>

              {result?.fatal && (
                <p className="border-t border-border bg-[var(--chip-red)] px-4 py-3 text-sm">
                  {result.fatal}
                </p>
              )}

              {result?.newRouting.length ? (
                <p className="border-t border-border bg-brand px-4 py-3 text-sm">
                  จะตั้งคลังให้ {result.newRouting.length} ประเภทที่ยังไม่เคยตั้ง —{" "}
                  {result.newRouting
                    .map((r) => `${r.categoryLabel} → ${r.warehouseLabel}`)
                    .join(", ")}
                </p>
              ) : null}

              {result?.routingConflicts.length ? (
                <p className="border-t border-border bg-chip-yellow px-4 py-3 text-sm">
                  คลังในไฟล์ต่างจากที่ตั้งไว้ {result.routingConflicts.length} ประเภท —
                  ไม่เขียนทับให้ เพราะย้ายคลังกระทบใบขอซื้อที่ค้างอยู่ ต้องแก้ที่
                  &ldquo;เพิ่ม/แก้ไขข้อมูล&rdquo; เอง
                </p>
              ) : null}

              {result?.skipped.length ? (
                <div className="border-t border-border px-4 py-3">
                  <p className="text-sm font-medium">
                    ข้าม {result.skipped.length} แถวที่ข้อมูลไม่ครบ
                  </p>
                  <ul className="mt-1 space-y-0.5 text-sm text-muted-foreground">
                    {result.skipped.slice(0, 4).map((s) => (
                      <li key={s.line}>
                        บรรทัด {s.line} — {s.reason}
                      </li>
                    ))}
                    {result.skipped.length > 4 && (
                      <li>และอีก {result.skipped.length - 4} แถว</li>
                    )}
                  </ul>
                </div>
              ) : null}
            </div>
          )}
        </div>

        <DialogFooter className="border-t border-border px-6 py-4">
          <Button variant="outline-primary" onClick={() => setOpen(false)}>
            ยกเลิก
          </Button>
          <Button
            disabled={!result || !!result.fatal || result.rows.length === 0}
            onClick={save}
          >
            บันทึก
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
