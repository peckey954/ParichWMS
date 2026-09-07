"use client";

import * as React from "react";
import { PlusIcon, Trash2Icon, UploadIcon } from "lucide-react";
import { Button } from "@peckey954/ui/components/ui/button";
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
import { SearchIcon } from "lucide-react";
import { toast } from "sonner";
import { usePrSetup } from "@/components/pr/pr-setup-provider";
import {
  importProductsCsv,
  warehousesOfProduct,
  type CsvImportResult,
} from "@/lib/pr-setup";

/* ------------------------------------------------------------------
   สินค้า — ส่วนที่สามของหน้าตั้งค่าใบขอซื้อ ต่อจากประเภทสินค้าและคลัง

   รายการเดียวรวมสินค้าทั้งหมด ไม่แยกตามคลัง เพราะสินค้าไม่ได้สังกัดคลัง
   มันสังกัด "ประเภท" แล้วประเภทเป็นตัวบอกว่าเข้าคลังไหน (ตั้งไว้ในส่วนแรก)
   ดรอปดาวน์ประเภทจึงอยู่ที่แถวของสินค้าตัวนั้นเลย เปลี่ยนแล้วมีผลทันที
   ไม่ใช่ตัวกรองข้างบน — บรรทัดใต้ชื่อบอกคลังปลายทางที่ได้จากประเภทนั้น

   ไม่มี backend — ของที่เพิ่มอยู่ในหน่วยความจำของเซสชันนี้เท่านั้น
------------------------------------------------------------------ */

const NO_CATEGORY = "__none__";

export function PrProductsSection() {
  const {
    setup,
    products,
    addProduct,
    addProducts,
    setProductCategory,
    removeProduct,
  } = usePrSetup();
  const [query, setQuery] = React.useState("");
  const [addOpen, setAddOpen] = React.useState(false);
  const [preview, setPreview] = React.useState<CsvImportResult | null>(null);
  const fileRef = React.useRef<HTMLInputElement>(null);

  // อัปโหลดทีเดียวได้เป็นร้อยแถว ถ้าไม่มีช่องค้นจะหาของที่เพิ่งเพิ่มไม่เจอ
  const q = query.trim().toLowerCase();
  const rows =
    q === ""
      ? products
      : products.filter((p) => p.name.toLowerCase().includes(q));

  const namedCategories = setup.categories.filter((c) => c.label.trim() !== "");

  /** ไฟล์ตัวอย่าง — ใส่ BOM ไว้ข้างหน้า ไม่งั้นเปิดใน Excel บนวินโดวส์
   *  ภาษาไทยจะกลายเป็นอักขระขยะทั้งไฟล์ */
  function downloadTemplate() {
    const sample = namedCategories[0]?.label ?? "";
    const csv =
      "\ufeff" +
      [
        "ชื่อสินค้า,ประเภท,หน่วย,บรรจุภัณฑ์",
        // ครอบชื่อประเภทด้วยคำพูดไว้ เผื่อคนตั้งชื่อประเภทที่มีจุลภาคอยู่ข้างใน
        `ตัวอย่างสินค้า,"${sample.replace(/"/g, '""')}",ตัน,50 Kg`,
      ].join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "ตัวอย่างสินค้า.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleFile(file: File) {
    // .xlsx เป็น ZIP+XML อ่านตรง ๆ ไม่ได้ ต้องมีไลบรารีถอดรหัส — บอกทางออกให้ชัด
    // ดีกว่าปล่อยให้อ่านแล้วได้อักขระขยะเต็มตาราง
    if (/\.(xlsx|xls)$/i.test(file.name)) {
      toast.error("ยังอ่านไฟล์ Excel โดยตรงไม่ได้", {
        description:
          "เปิดใน Excel แล้ว Save As เป็น CSV UTF-8 ก่อน แล้วอัปโหลดใหม่",
      });
      return;
    }
    setPreview(importProductsCsv(await file.text(), setup.categories));
  }

  function confirmImport() {
    if (!preview) return;
    const n = addProducts(preview.rows);
    toast.success(`เพิ่มสินค้า ${n} รายการแล้ว`, {
      description:
        preview.skipped.length > 0
          ? `ข้าม ${preview.skipped.length} แถวที่ข้อมูลไม่ครบ`
          : undefined,
    });
    setPreview(null);
  }

  return (
    <section className="mt-4 rounded-xl border border-border bg-card p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-semibold">สินค้า</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            สินค้าทั้งหมดที่ขอซื้อได้ — เลือกประเภทที่ท้ายแต่ละรายการ
            แล้วของจะเข้าคลังตามที่ตั้งไว้ให้ประเภทนั้น
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="outline-primary"
            onClick={() => fileRef.current?.click()}
          >
            <UploadIcon />
            อัปโหลด
          </Button>
          <Button variant="outline-primary" onClick={() => setAddOpen(true)}>
            <PlusIcon />
            เพิ่มสินค้า
          </Button>
        </div>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept=".csv,.txt,.tsv,.xlsx,.xls"
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          // ล้างค่าไว้ เลือกไฟล์เดิมซ้ำอีกครั้งจะได้ยังเกิด change
          e.target.value = "";
        }}
      />

      {/* บอกรูปแบบไฟล์ไว้ตรงนี้ ไม่ใช่รอให้อัปโหลดพลาดก่อนแล้วค่อยบอก */}
      <p className="mt-3 text-sm text-muted-foreground">
        ไฟล์ CSV ต้องมีหัวตาราง{" "}
        <span className="text-foreground">
          ชื่อสินค้า, ประเภท, หน่วย, บรรจุภัณฑ์
        </span>{" "}
        <button
          type="button"
          onClick={downloadTemplate}
          className="text-primary underline underline-offset-2"
        >
          ดาวน์โหลดไฟล์ตัวอย่าง
        </button>
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <InputGroup className="min-w-0 flex-1 bg-card">
          <InputGroupAddon align="inline-start">
            <SearchIcon />
          </InputGroupAddon>
          <InputGroupInput
            aria-label="ค้นหาสินค้า"
            placeholder="ค้นหาสินค้า..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </InputGroup>
        <p className="shrink-0 text-sm text-muted-foreground">
          {q === ""
            ? `${products.length} รายการ`
            : `${rows.length} จาก ${products.length} รายการ`}
        </p>
      </div>

      {rows.length === 0 ? (
        <p className="mt-3 rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
          {products.length === 0
            ? "ยังไม่มีสินค้า — กดเพิ่มสินค้า หรืออัปโหลดไฟล์"
            : `ไม่พบสินค้าที่ตรงกับ "${query.trim()}"`}
        </p>
      ) : (
        /* ล็อกความสูงไว้ให้เลื่อนในกล่อง ไม่งั้นอัปโหลดทีเดียวร้อยแถว
           แถบปุ่มบันทึกจะหายไปไกลจากจอ */
        <div className="mt-2 max-h-[30rem] overflow-y-auto rounded-xl border border-border">
          {rows.map((p) => {
            const dest = warehousesOfProduct(setup, p.categoryId);
            return (
              <div
                key={p.id}
                className="grid gap-2 border-t border-border px-3 py-3 first:border-0 @3xl:grid-cols-[1fr_15rem_auto] @3xl:items-center @3xl:gap-3"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{p.name}</p>
                  <p className="mt-0.5 truncate text-sm text-muted-foreground">
                    {p.unit}
                    {p.packing ? ` · ${p.packing}` : ""}
                    {" · "}
                    {dest.length > 0 ? (
                      `เข้า ${dest.map((w) => w.label || "(ยังไม่ได้ตั้งชื่อ)").join(", ")}`
                    ) : (
                      /* ประเภทที่ยังไม่ได้เลือกคลัง — ส่วนบนของหน้าเตือนรวมไว้แล้ว
                         ตรงนี้บอกซ้ำที่ตัวสินค้า จะได้รู้ว่ากระทบตัวไหนบ้าง */
                      <span className="text-danger-strong">
                        ยังไม่ได้เลือกคลัง
                      </span>
                    )}
                  </p>
                </div>

                <Select
                  value={p.categoryId || NO_CATEGORY}
                  onValueChange={(v) =>
                    setProductCategory(p.id, v === NO_CATEGORY ? "" : v)
                  }
                >
                  <SelectTrigger
                    aria-label={`ประเภทของ ${p.name}`}
                    className="w-full bg-card"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_CATEGORY}>ไม่ระบุประเภท</SelectItem>
                    {namedCategories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  size="icon"
                  aria-label={`ลบ ${p.name}`}
                  className="justify-self-end border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => {
                    removeProduct(p.id);
                    toast.success("ลบสินค้าแล้ว", { description: p.name });
                  }}
                >
                  <Trash2Icon />
                </Button>
              </div>
            );
          })}
        </div>
      )}

      <AddProductDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        categories={namedCategories}
        onAdd={(p) => {
          addProduct(p);
          toast.success("เพิ่มสินค้าแล้ว", { description: p.name });
        }}
      />

      <ImportPreviewDialog
        result={preview}
        onCancel={() => setPreview(null)}
        onConfirm={confirmImport}
      />
    </section>
  );
}

function AddProductDialog({
  open,
  onOpenChange,
  categories,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  categories: { id: string; label: string }[];
  onAdd: (p: {
    name: string;
    categoryId: string;
    unit: string;
    packing?: string;
  }) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* ฟอร์มอยู่ในคอมโพเนนต์ข้างใน DialogContent ซึ่ง Radix ถอดออกตอนปิด
          ค่าที่คีไว้จึงล้างเองทุกครั้งที่เปิดใหม่ ไม่ต้องมี effect คอยไล่ล้าง */}
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="text-left">
          <DialogTitle>เพิ่มสินค้า</DialogTitle>
          <DialogDescription>
            ประเภทที่เลือกเป็นตัวกำหนดว่าของเข้าคลังไหน
          </DialogDescription>
        </DialogHeader>
        <AddProductForm
          categories={categories}
          onCancel={() => onOpenChange(false)}
          onAdd={(p) => {
            onAdd(p);
            onOpenChange(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

function AddProductForm({
  categories,
  onCancel,
  onAdd,
}: {
  categories: { id: string; label: string }[];
  onCancel: () => void;
  onAdd: (p: {
    name: string;
    categoryId: string;
    unit: string;
    packing?: string;
  }) => void;
}) {
  const [name, setName] = React.useState("");
  const [categoryId, setCategoryId] = React.useState<string | undefined>();
  const [unit, setUnit] = React.useState("");
  const [packing, setPacking] = React.useState("");

  const canAdd = name.trim() !== "" && unit.trim() !== "";

  function submit() {
    onAdd({
      name: name.trim(),
      categoryId: categoryId ?? "",
      unit: unit.trim(),
      packing: packing.trim() || undefined,
    });
  }

  return (
    <>
      <div className="grid gap-4">
        <div className="grid gap-1.5">
          <Label htmlFor="p-name">ชื่อสินค้า</Label>
          <InputGroup className="bg-card">
            <InputGroupInput
              id="p-name"
              value={name}
              placeholder="เช่น แม่ปุ๋ย 46-0-0 ยูเรีย"
              onChange={(e) => setName(e.target.value)}
            />
          </InputGroup>
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="p-cat">ประเภทสินค้า</Label>
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger id="p-cat" className="w-full bg-card">
              <SelectValue placeholder="เลือกประเภท" />
            </SelectTrigger>
            <SelectContent>
              {categories
                .filter((c) => c.label.trim() !== "")
                .map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.label}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-4 @lg:grid-cols-2">
          <div className="grid gap-1.5">
            <Label htmlFor="p-unit">หน่วยนับ</Label>
            <InputGroup className="bg-card">
              <InputGroupInput
                id="p-unit"
                value={unit}
                placeholder="ตัน / ชิ้น / ลิตร"
                onChange={(e) => setUnit(e.target.value)}
              />
            </InputGroup>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="p-pack">
              บรรจุภัณฑ์{" "}
              <span className="font-normal text-muted-foreground">
                (ไม่บังคับ)
              </span>
            </Label>
            <InputGroup className="bg-card">
              <InputGroupInput
                id="p-pack"
                value={packing}
                placeholder="เช่น 50 Kg"
                onChange={(e) => setPacking(e.target.value)}
              />
            </InputGroup>
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline-primary" onClick={onCancel}>
          ยกเลิก
        </Button>
        <Button disabled={!canAdd} onClick={submit}>
          เพิ่มสินค้า
        </Button>
      </DialogFooter>
    </>
  );
}

/** สรุปผลอ่านไฟล์ก่อนเพิ่มจริง — ต้องให้เห็นว่าอะไรจะเข้า อะไรถูกข้าม
 *  และเพราะอะไร ไม่ใช่เพิ่มเงียบ ๆ แล้วค่อยไปงงทีหลังว่าของหายไปไหน */
function ImportPreviewDialog({
  result,
  onCancel,
  onConfirm,
}: {
  result: CsvImportResult | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const fatal = result?.fatal;
  const rows = result?.rows ?? [];
  const skipped = result?.skipped ?? [];

  return (
    <Dialog open={result !== null} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="flex max-h-[85vh] flex-col sm:max-w-lg">
        <DialogHeader className="text-left">
          <DialogTitle>ตรวจไฟล์ก่อนเพิ่ม</DialogTitle>
          <DialogDescription>
            {fatal ? "ไฟล์นี้ใช้ไม่ได้" : "ตรวจดูก่อนว่าอะไรจะเข้า อะไรถูกข้าม"}
          </DialogDescription>
        </DialogHeader>

        {/* chip-red ไม่ได้ลงทะเบียนเป็นคลาส Tailwind (มีแต่ตัว foreground)
            เขียนเป็นรูปวงเล็บอ้างตัวแปรตรง ๆ ไม่งั้นคอมไพล์แล้วสีหายเงียบ */}
        {fatal ? (
          <p className="rounded-xl border border-destructive/40 bg-[var(--chip-red)] px-4 py-3 text-sm">
            {fatal}
          </p>
        ) : (
          <div className="-mx-6 overflow-y-auto px-6">
            <p className="text-sm">
              อ่านได้ <span className="font-semibold">{rows.length}</span>{" "}
              รายการ
              {skipped.length > 0 && (
                <>
                  {" · ข้าม "}
                  <span className="font-semibold text-danger-strong">
                    {skipped.length}
                  </span>
                  {" แถว"}
                </>
              )}
            </p>

            {rows.length > 0 && (
              <ul className="mt-3 space-y-1 text-sm">
                {rows.slice(0, 8).map((r, i) => (
                  <li
                    key={i}
                    className="flex flex-wrap gap-x-2 text-muted-foreground"
                  >
                    <span className="font-medium text-foreground">
                      {r.name}
                    </span>
                    <span>· {r.unit}</span>
                    {r.packing && <span>· {r.packing}</span>}
                  </li>
                ))}
                {rows.length > 8 && (
                  <li className="text-muted-foreground">
                    และอีก {rows.length - 8} รายการ
                  </li>
                )}
              </ul>
            )}

            {skipped.length > 0 && (
              <div className="mt-4 rounded-xl border border-chip-yellow-foreground/40 bg-chip-yellow px-4 py-3">
                <p className="text-sm font-medium">แถวที่ข้าม</p>
                <ul className="mt-1 space-y-0.5 text-sm">
                  {skipped.slice(0, 6).map((s) => (
                    <li key={s.line}>
                      บรรทัด {s.line} — {s.reason}
                    </li>
                  ))}
                  {skipped.length > 6 && (
                    <li>และอีก {skipped.length - 6} แถว</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline-primary" onClick={onCancel}>
            {fatal ? "ปิด" : "ยกเลิก"}
          </Button>
          {!fatal && (
            <Button disabled={rows.length === 0} onClick={onConfirm}>
              เพิ่ม {rows.length} รายการ
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
