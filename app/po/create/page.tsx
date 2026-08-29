"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDownIcon, MinusIcon, PlusIcon, Trash2Icon } from "lucide-react";
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@peckey954/ui/components/ui/collapsible";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@peckey954/ui/components/ui/dialog";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@peckey954/ui/components/ui/input-group";
import { Label } from "@peckey954/ui/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@peckey954/ui/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@peckey954/ui/components/ui/select";
import { Textarea } from "@peckey954/ui/components/ui/textarea";
import { cn } from "@peckey954/ui/lib/utils";
import { toast } from "sonner";
import { DateRangeSelect, type DateRange } from "@/components/date-select";
import { useNumberField } from "@/components/number-field";
import { PR_CATEGORIES, PR_CATEGORY_LABEL, PR_PRODUCTS, type PrCategoryId, type PrDoc, type PrProduct } from "@/lib/pr";
import { COMPANY_POOL, formatPoBaht, formatPoQty, PO_QUEUE_DOCS } from "@/lib/po";

/* ------------------------------------------------------------------
   สร้างใบสั่งซื้อ — มาจากปุ่ม "สร้างใบสั่งซื้อ" ในแท็บ "ขอซื้อ" เสมอ พาสรหัส
   ใบขอซื้อที่ติ๊กไว้มาทาง query param "ids" (คั่นด้วยจุลภาค) เลือกใบเดียว
   ก็ได้การ์ดสินค้าใบเดียว เลือกหลายใบก็ได้หลายการ์ด — เพิ่ม/ลบการ์ดต่อจากนี้
   ในหน้านี้ได้อีกด้วย แต่ต้องเป็นประเภทสินค้าเดียวกับการ์ดแรกเสมอ (กติกาเดียว
   กับตอนติ๊กเลือกในแท็บขอซื้อ)

   ไม่มี backend จริงตามธรรมชาติของแอปนี้ — กด "บันทึก" แล้วขึ้น toast แล้วพา
   กลับไปแท็บ "สั่งซื้อ" ไม่ได้เขียนใบใหม่ลงในข้อมูลตัวอย่างจริง
------------------------------------------------------------------ */

type DraftLine = {
  key: string;
  productId?: string;
  categoryId: PrCategoryId;
  group: string;
  productName: string;
  productSub?: string;
  packing?: string;
  packingOptions: string[];
  unit: string;
  neededDate: string;
  urgent: boolean;
  orderedQty: number;
  pricePerUnit: number;
  handlingPerUnit: number;
  /** ย้อนไปดูใบขอซื้อต้นทางได้ — มีเฉพาะแถวที่มาจากใบขอซื้อจริง
   *  แถวที่กด "เพิ่มสินค้า" เองในหน้านี้ไม่มีใบขอซื้อรองรับ จึงไม่มีข้อมูลชุดนี้ */
  prRef?: {
    code: string;
    requestedQty: number;
    requester: string;
    editedBy?: string;
  };
};

function toDraftLine(pr: PrDoc): DraftLine {
  const product = PR_PRODUCTS.find(
    (p) => p.category === pr.categoryId && p.name === pr.productName && p.sub === pr.productSub
  );
  return {
    key: pr.id,
    productId: product?.id,
    categoryId: pr.categoryId,
    group: pr.group,
    productName: pr.productName,
    productSub: pr.productSub,
    packing: pr.packing ?? product?.packingOptions[0],
    packingOptions: product?.packingOptions ?? (pr.packing ? [pr.packing] : []),
    unit: pr.unit,
    neededDate: pr.neededDate,
    urgent: !!pr.urgent,
    orderedQty: pr.qty,
    pricePerUnit: 0,
    handlingPerUnit: 0,
    prRef: {
      code: pr.code,
      requestedQty: pr.qty,
      requester: pr.requester,
      editedBy: pr.editedBy,
    },
  };
}

const lineUnitPrice = (line: DraftLine) => line.pricePerUnit + line.handlingPerUnit;
const lineTotalPrice = (line: DraftLine) => lineUnitPrice(line) * line.orderedQty;

export default function CreatePoPage() {
  return (
    <React.Suspense fallback={null}>
      <CreatePoForm />
    </React.Suspense>
  );
}

function CreatePoForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const selectedDocs = React.useMemo(() => {
    const ids = new Set((searchParams.get("ids") ?? "").split(",").filter(Boolean));
    return PO_QUEUE_DOCS.filter((d) => ids.has(d.id));
  }, [searchParams]);

  const [poType, setPoType] = React.useState<"po" | "poi">("po");
  const [company, setCompany] = React.useState<string | undefined>();
  const [expectedRange, setExpectedRange] = React.useState<DateRange>();
  const [lines, setLines] = React.useState<DraftLine[]>(() => selectedDocs.map(toDraftLine));
  const [note, setNote] = React.useState("");

  const keyCounterRef = React.useRef(0);

  const lockedCategory: PrCategoryId | null = lines[0]?.categoryId ?? null;
  const addedProductIds = React.useMemo(
    () => lines.map((l) => l.productId).filter((id): id is string => !!id),
    [lines]
  );
  const totalPrice = React.useMemo(
    () => lines.reduce((sum, l) => sum + lineTotalPrice(l), 0),
    [lines]
  );

  function updateLine(key: string, patch: Partial<DraftLine>) {
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  }

  function removeLine(key: string) {
    setLines((prev) => prev.filter((l) => l.key !== key));
  }

  function addLine(product: PrProduct) {
    setLines((prev) => [
      ...prev,
      {
        key: `new-${keyCounterRef.current++}`,
        productId: product.id,
        categoryId: product.category,
        group: product.group,
        productName: product.name,
        productSub: product.sub,
        packing: product.packingOptions[0],
        packingOptions: product.packingOptions,
        unit: product.unit,
        neededDate: "",
        urgent: false,
        orderedQty: 0,
        pricePerUnit: 0,
        handlingPerUnit: 0,
      },
    ]);
  }

  function handleSave() {
    if (!company) {
      toast.error("กรุณาเลือกบริษัทที่ทำการสั่งซื้อ");
      return;
    }
    if (lines.length === 0) {
      toast.error("กรุณาเพิ่มสินค้าอย่างน้อย 1 รายการ");
      return;
    }

    toast.success("สร้างใบสั่งซื้อแล้ว", {
      description: `${company} — ${lines.length} รายการ · ${formatPoBaht(totalPrice)} บาท`,
    });
    router.push("/po");
  }

  return (
    <>
      <main className="@container mx-auto w-full max-w-4xl px-4 pt-6 pb-24 sm:px-6">
        <Crumbs />

        <h1 className="mt-2 text-2xl font-semibold tracking-tight">สร้างใบสั่งซื้อ</h1>

        {/* ---------- หัวใบ ----------
             ประเภทการสั่งซื้อแยกเป็นแถวของตัวเองเสมอ ไม่ได้อยู่ในกริด 3 คอลัมน์กับอีกสองช่อง
             เพราะช่อง PO/POI มีสองปุ่มซ้อนกันอยู่แล้ว ถ้าไปแบ่งพื้นที่กับบริษัท+วันที่อีก
             จะเหลือที่ต่อปุ่มไม่พอให้ตัวหนังสือ "POI - ต่างประเทศ" ขึ้นเต็มคำ */}
        <div className="mt-4 space-y-4">
          <div className="space-y-1.5">
            <Label>ประเภทการสั่งซื้อ</Label>
            <RadioGroup
              value={poType}
              onValueChange={(v) => setPoType(v as "po" | "poi")}
              className="grid grid-cols-2 gap-3"
            >
              <RadioBox id="po-type-po" value="po">
                PO - ในประเทศ
              </RadioBox>
              <RadioBox id="po-type-poi" value="poi">
                POI - ต่างประเทศ
              </RadioBox>
            </RadioGroup>
          </div>

          <div className="grid gap-4 @lg:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="po-company">บริษัทที่ทำการสั่งซื้อ</Label>
              <Select value={company} onValueChange={setCompany}>
                <SelectTrigger id="po-company" className="w-full bg-card">
                  <SelectValue placeholder="เลือกบริษัท" />
                </SelectTrigger>
                <SelectContent>
                  {COMPANY_POOL.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="po-expected">
                คาดการณ์ช่วงวันที่สินค้าจะเข้า{" "}
                <span className="font-normal text-muted-foreground">(ไม่บังคับ)</span>
              </Label>
              <DateRangeSelect
                id="po-expected"
                value={expectedRange}
                onValueChange={setExpectedRange}
                placeholder="เลือกช่วงวันที่"
                className="bg-card"
              />
            </div>
          </div>
        </div>

        {/* ---------- หัวข้อสินค้า + ปุ่มเพิ่ม ---------- */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold">สินค้า ({lines.length} รายการ)</h2>
          <AddProductDialog
            lockedCategory={lockedCategory}
            addedProductIds={addedProductIds}
            onAdd={addLine}
          />
        </div>

        {/* ---------- สรุปราคารวม ---------- */}
        <div className="mt-3 rounded-lg border border-border bg-brand px-4 py-3.5">
          <p className="text-sm text-muted-foreground">ราคารวมทั้งหมด (บาท)</p>
          <p className="mt-1 text-lg font-semibold tabular-nums">
            {lines.length > 0 ? formatPoBaht(totalPrice) : "-"}
          </p>
        </div>

        {/* ---------- การ์ดสินค้า ---------- */}
        <div className="mt-4 space-y-4">
          {lines.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border px-6 py-14 text-center">
              <p className="font-medium">ยังไม่มีสินค้าในใบนี้</p>
              <p className="mt-1 text-sm text-muted-foreground">
                กด &quot;เพิ่มสินค้า&quot; ด้านบนเพื่อเริ่มเพิ่มรายการ
              </p>
            </div>
          ) : (
            lines.map((line) => (
              <ProductCard
                key={line.key}
                line={line}
                onChange={(patch) => updateLine(line.key, patch)}
                onRemove={() => removeLine(line.key)}
              />
            ))
          )}
        </div>

        {/* ---------- หมายเหตุ ---------- */}
        <div className="mt-6 space-y-1.5">
          <Label htmlFor="po-note">
            หมายเหตุ <span className="font-normal text-muted-foreground">(ไม่บังคับ)</span>
          </Label>
          <Textarea
            id="po-note"
            className="bg-card"
            rows={3}
            placeholder="ระบุหมายเหตุ"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
      </main>

      {/* ---------- แถบปุ่มล่าง ---------- */}
      <div className="sticky bottom-0 z-30 border-t border-border bg-surface">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Button variant="outline-primary" onClick={() => router.back()}>
            ย้อนกลับ
          </Button>
          <Button onClick={handleSave}>บันทึก</Button>
        </div>
      </div>
    </>
  );
}

function Crumbs() {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/">ระบบ</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink href="/po">สั่งซื้อ PO</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage className="text-primary">สร้างใบสั่งซื้อ</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

/** ตัวเลือกแบบกล่อง — ไฮไลต์กรอบ/พื้นตอนถูกเลือก อิง data-state ของ RadioGroupItem เอง */
function RadioBox({
  id,
  value,
  children,
}: {
  id: string;
  value: string;
  children: React.ReactNode;
}) {
  return (
    <Label
      htmlFor={id}
      className={cn(
        "flex cursor-pointer items-center gap-2.5 rounded-lg border border-border bg-card px-4 py-3 text-sm font-medium",
        "has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-brand"
      )}
    >
      <RadioGroupItem id={id} value={value} />
      {children}
    </Label>
  );
}

function ProductCard({
  line,
  onChange,
  onRemove,
}: {
  line: DraftLine;
  onChange: (patch: Partial<DraftLine>) => void;
  onRemove: () => void;
}) {
  return (
    <Collapsible defaultOpen className="rounded-xl border border-border bg-card">
      <div className="flex flex-wrap items-start justify-between gap-3 p-4 pb-0">
        <div className="min-w-0">
          <p className="font-medium">
            {line.productName}
            {line.productSub && ` ${line.productSub}`}
          </p>
          <p className="mt-0.5 text-sm whitespace-nowrap text-muted-foreground">
            {PR_CATEGORY_LABEL[line.categoryId]} · {line.group}
            {line.packing && ` · ${line.packing}`}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {/* วันที่มาจากใบขอซื้อที่คนขอกรอกไว้แล้ว — ดูอย่างเดียว แก้ไม่ได้ในหน้านี้ */}
          <span className="text-sm whitespace-nowrap text-muted-foreground">
            วันที่ต้องการสินค้า:{" "}
            <span className="font-medium text-foreground tabular-nums">
              {line.neededDate || "-"}
            </span>
          </span>
          {line.urgent && (
            <span className="inline-flex shrink-0 items-center rounded-full border border-transparent px-3 py-1 text-xs font-semibold whitespace-nowrap [--bdg-surface:var(--chip-orange)] [--bdg-text:var(--chip-orange-foreground)] bg-(--bdg-surface) text-(--bdg-text)">
              เร่งด่วน
            </span>
          )}
          <Button variant="ghost" size="icon" aria-label="ลบสินค้านี้" onClick={onRemove}>
            <Trash2Icon />
          </Button>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="แสดง/ซ่อนรายละเอียด" className="group">
              <ChevronDownIcon className="transition-transform group-data-[state=open]:rotate-180" />
            </Button>
          </CollapsibleTrigger>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 pt-1.5 pb-3 text-sm">
        <span className="text-muted-foreground">
          ราคารวมต่อ{line.unit} (บาท):{" "}
          <span className="font-medium text-foreground tabular-nums">
            {lineUnitPrice(line) > 0 ? formatPoBaht(lineUnitPrice(line)) : "-"}
          </span>
        </span>
        <span className="text-muted-foreground">
          ราคารวมทั้งหมด (บาท):{" "}
          <span className="font-medium text-foreground tabular-nums">
            {lineTotalPrice(line) > 0 ? formatPoBaht(lineTotalPrice(line)) : "-"}
          </span>
        </span>
      </div>

      <CollapsibleContent className="border-t border-border px-4 pt-4 pb-4">
        <div className="grid gap-4 @lg:grid-cols-4">
          <div className="space-y-1.5">
            <Label>บรรจุภัณฑ์</Label>
            {line.packingOptions.length > 0 ? (
              <Select value={line.packing} onValueChange={(v) => onChange({ packing: v })}>
                <SelectTrigger className="w-full bg-card">
                  <SelectValue placeholder="เลือกบรรจุภัณฑ์" />
                </SelectTrigger>
                <SelectContent>
                  {line.packingOptions.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="flex h-9 items-center rounded-md border border-border bg-card px-3 text-sm text-muted-foreground">
                {line.packing ?? "-"}
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>สั่งซื้อ ({line.unit})</Label>
            <NumberStepper
              value={line.orderedQty}
              onValueChange={(v) => onChange({ orderedQty: v })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>ราคาสั่งต่อ{line.unit} (บาท)</Label>
            <NumberStepper
              value={line.pricePerUnit}
              onValueChange={(v) => onChange({ pricePerUnit: v })}
              step={10}
            />
          </div>
          <div className="space-y-1.5">
            <Label>ค่าการจัดการต่อ{line.unit} (บาท)</Label>
            <NumberStepper
              value={line.handlingPerUnit}
              onValueChange={(v) => onChange({ handlingPerUnit: v })}
              step={10}
            />
          </div>
        </div>

        {/* ---------- อ้างอิงใบขอซื้อต้นทาง ----------
             ดูอย่างเดียว ไม่มีปุ่มแก้ ไม่ใช่ข้อมูลที่ต้องตัดสินใจอะไรตรงนี้ต่อ
             แค่เผื่อต้องย้อนไปดูว่าใบขอซื้อใบไหนขอมา ขอไว้เท่าไหร่ ใครขอ ใครแก้ล่าสุด
             เว้นระยะห่างจากช่องกรอกด้านบนด้วยเส้นคั่น ให้รู้ว่าเป็นข้อมูลอ้างอิง
             ไม่ใช่ส่วนหนึ่งของแบบฟอร์มที่ต้องกรอก แถวนี้จึงไม่มี Select/Stepper เลย
             มีเฉพาะรายการที่มาจากใบขอซื้อจริง (prRef) เท่านั้น กดเพิ่มสินค้าเองไม่มีใบขอซื้อรองรับ */}
        {line.prRef && (
          <div className="mt-4 grid gap-4 border-t border-border pt-4 @lg:grid-cols-4">
            <div className="space-y-1.5">
              <p className="text-sm text-muted-foreground">เลขที่ใบขอซื้อ</p>
              <p className="text-sm font-medium">{line.prRef.code}</p>
            </div>
            <div className="space-y-1.5">
              <p className="text-sm text-muted-foreground">ขอซื้อ ({line.unit})</p>
              <p className="text-sm font-medium tabular-nums">
                {formatPoQty(line.prRef.requestedQty)}
              </p>
            </div>
            <div className="space-y-1.5">
              <p className="text-sm text-muted-foreground">ผู้ขอซื้อ</p>
              <p className="text-sm font-medium">{line.prRef.requester}</p>
            </div>
            <div className="space-y-1.5">
              <p className="text-sm text-muted-foreground">ผู้แก้ไขขอซื้อล่าสุด</p>
              <p className="text-sm font-medium">{line.prRef.editedBy ?? "-"}</p>
            </div>
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}

function NumberStepper({
  value,
  onValueChange,
  step = 1,
}: {
  value: number;
  onValueChange: (next: number) => void;
  step?: number;
}) {
  const field = useNumberField(value, onValueChange, 2);
  const bump = (delta: number) =>
    onValueChange(Math.max(0, Number((value + delta).toFixed(2))));

  return (
    <InputGroup className="bg-card">
      <InputGroupAddon align="inline-start">
        <InputGroupButton size="icon-xs" aria-label="ลดจำนวน" onClick={() => bump(-step)}>
          <MinusIcon />
        </InputGroupButton>
      </InputGroupAddon>
      <InputGroupInput {...field} className="text-center" />
      <InputGroupAddon align="inline-end">
        <InputGroupButton size="icon-xs" aria-label="เพิ่มจำนวน" onClick={() => bump(step)}>
          <PlusIcon />
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  );
}

/** เพิ่มการ์ดสินค้าใหม่เข้าใบ — ล็อกประเภทสินค้าให้ตรงกับการ์ดแรกเสมอ
 *  (รวมได้เฉพาะประเภทเดียวกัน ตามกติกาเดียวกับตอนติ๊กเลือกในแท็บขอซื้อ) */
function AddProductDialog({
  lockedCategory,
  addedProductIds,
  onAdd,
}: {
  lockedCategory: PrCategoryId | null;
  addedProductIds: string[];
  onAdd: (product: PrProduct) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [categoryId, setCategoryId] = React.useState<PrCategoryId | undefined>(
    lockedCategory ?? undefined
  );
  const [productId, setProductId] = React.useState<string | undefined>();

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      setCategoryId(lockedCategory ?? undefined);
      setProductId(undefined);
    }
  }

  const productsInCategory = PR_PRODUCTS.filter(
    (p) => p.category === categoryId && !addedProductIds.includes(p.id)
  );

  function handleCategoryChange(next: string) {
    setCategoryId(next as PrCategoryId);
    setProductId(undefined);
  }

  function handleAdd() {
    const product = PR_PRODUCTS.find((p) => p.id === productId);
    if (!product) return;
    onAdd(product);
    setProductId(undefined);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-primary text-primary hover:text-primary">
          <PlusIcon />
          เพิ่มสินค้า
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>เพิ่มสินค้า</DialogTitle>
          <DialogDescription className="sr-only">
            เลือกสินค้าที่ต้องการเพิ่มเข้าใบสั่งซื้อนี้
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="add-category">ประเภทสินค้า</Label>
            <Select
              value={categoryId}
              onValueChange={handleCategoryChange}
              disabled={!!lockedCategory}
            >
              <SelectTrigger id="add-category" className="w-full bg-card">
                <SelectValue placeholder="เลือกประเภทสินค้า" />
              </SelectTrigger>
              <SelectContent>
                {PR_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {PR_CATEGORY_LABEL[c]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {lockedCategory && (
              <p className="text-sm text-muted-foreground">
                รวมสินค้าในใบเดียวกันได้เฉพาะประเภทเดียวกันเท่านั้น
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="add-product">สินค้า</Label>
            <Select value={productId} onValueChange={setProductId} disabled={!categoryId}>
              <SelectTrigger id="add-product" className="w-full bg-card">
                <SelectValue
                  placeholder={
                    productsInCategory.length > 0 ? "เลือกสินค้า" : "ไม่มีสินค้าให้เพิ่มแล้ว"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {productsInCategory.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                    {p.sub ? ` ${p.sub}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">ย้อนกลับ</Button>
          </DialogClose>
          <Button onClick={handleAdd} disabled={!productId}>
            เพิ่ม
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
