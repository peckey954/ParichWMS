"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { MinusIcon, PlusIcon } from "lucide-react";
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
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
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
import { toast } from "sonner";
import { DateSelect, formatDateSlash, parseDateSlash } from "@/components/date-select";
import { useNumberField } from "@/components/number-field";
import {
  formatPrQty,
  getPrDoc,
  PR_CATEGORIES,
  PR_CATEGORY_LABEL,
  PR_PRODUCTS,
  PR_REASONS,
  PR_REASON_LABEL,
  productsOf,
  type PrCategoryId,
  type PrProduct,
  type PrReason,
} from "@/lib/pr";

/* ------------------------------------------------------------------
   แก้ไขใบขอซื้อ — เข้าได้เฉพาะตอนสถานะ "ส่งคำขอแล้ว" เท่านั้น (ดูเหตุผลใน
   app/pr/[id]/page.tsx) ต่างจากหน้าสร้างตรงที่ค่าทุกช่องมีอยู่แล้วตั้งแต่ต้น
   จึงกางฟอร์มเต็มให้เห็นทุกช่องทันที ไม่ต้องเผยทีละขั้นเหมือนตอนสร้างใหม่

   ย้อนกลับได้ตรงๆ ถ้ายังไม่แก้อะไร แต่ถ้าแก้ไปแล้วต้องถามก่อนออก — เทียบกับ
   ค่าตั้งต้นที่โหลดมา ไม่ใช่แค่ "มีค่าอยู่ในช่อง" แบบหน้าสร้าง เพราะที่นี่ทุกช่อง
   มีค่าอยู่แล้วตั้งแต่เปิดหน้ามา
------------------------------------------------------------------ */

export default function EditPrPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const doc = React.useMemo(() => getPrDoc(params.id), [params.id]);

  const initialProduct = React.useMemo(
    () =>
      doc
        ? PR_PRODUCTS.find(
            (p) =>
              p.category === doc.categoryId &&
              p.name === doc.productName &&
              p.sub === doc.productSub
          )
        : undefined,
    [doc]
  );

  const [categoryId, setCategoryId] = React.useState<PrCategoryId | undefined>(
    doc?.categoryId
  );
  const [productId, setProductId] = React.useState<string | undefined>(
    initialProduct?.id
  );
  const [packing, setPacking] = React.useState<string | undefined>(doc?.packing);
  const [qty, setQty] = React.useState(doc?.qty ?? 0);
  const [reasons, setReasons] = React.useState<PrReason[]>(doc?.reasons ?? []);
  const [neededDate, setNeededDate] = React.useState<Date | undefined>(
    doc ? parseDateSlash(doc.neededDate) : undefined
  );
  const [confirmLeaveOpen, setConfirmLeaveOpen] = React.useState(false);

  const products = categoryId ? productsOf(categoryId) : [];
  const product: PrProduct | undefined = products.find((p) => p.id === productId);

  const toggleReason = (r: PrReason, checked: boolean) =>
    setReasons((prev) => (checked ? [...prev, r] : prev.filter((x) => x !== r)));

  if (!doc) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 pt-6 pb-24 sm:px-6">
        <Crumbs />
        <div className="mt-10 rounded-xl border border-dashed border-border px-6 py-14 text-center">
          <p className="font-medium">ไม่พบใบขอซื้อนี้</p>
          <p className="mt-1 text-sm text-muted-foreground">
            เอกสารอาจถูกลบหรือลิงก์ไม่ถูกต้อง
          </p>
          <Button asChild variant="outline-primary" className="mt-4">
            <Link href="/pr">กลับไปหน้าขอซื้อ PR</Link>
          </Button>
        </div>
      </main>
    );
  }

  const safeDoc = doc;

  if (safeDoc.status !== "sent") {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 pt-6 pb-24 sm:px-6">
        <Crumbs code={safeDoc.code} id={safeDoc.id} />
        <div className="mt-10 rounded-xl border border-dashed border-border px-6 py-14 text-center">
          <p className="font-medium">ใบขอซื้อนี้แก้ไขไม่ได้แล้ว</p>
          <p className="mt-1 text-sm text-muted-foreground">
            แก้ไขได้เฉพาะตอนสถานะ &ldquo;ส่งคำขอแล้ว&rdquo; เท่านั้น
          </p>
          <Button asChild variant="outline-primary" className="mt-4">
            <Link href={`/pr/${safeDoc.id}`}>กลับไปดูใบขอซื้อ</Link>
          </Button>
        </div>
      </main>
    );
  }

  const neededDateStr = neededDate ? formatDateSlash(neededDate) : "";
  const reasonsChanged =
    reasons.length !== safeDoc.reasons.length ||
    reasons.some((r) => !safeDoc.reasons.includes(r));

  const isDirty =
    categoryId !== safeDoc.categoryId ||
    productId !== initialProduct?.id ||
    packing !== safeDoc.packing ||
    qty !== safeDoc.qty ||
    reasonsChanged ||
    neededDateStr !== safeDoc.neededDate;

  const canSave = Boolean(
    categoryId && product && packing && qty > 0 && reasons.length > 0 && neededDate
  );

  function goBack() {
    if (isDirty) setConfirmLeaveOpen(true);
    else router.back();
  }

  function handleSave() {
    if (!canSave || !product || !neededDate) return;
    toast.success(`บันทึกการแก้ไขใบขอซื้อ ${safeDoc.code} แล้ว`, {
      description: `${product.name}${product.sub ? ` ${product.sub}` : ""} — ${formatPrQty(qty)} ${product.unit} ต้องการ ${formatDateSlash(neededDate)}`,
    });
    router.push(`/pr/${safeDoc.id}`);
  }

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col">
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pt-6 pb-24 sm:px-6">
        <Crumbs code={safeDoc.code} id={safeDoc.id} />

        <h1 className="mt-2 text-2xl font-semibold tracking-tight">แก้ไขใบขอซื้อ</h1>

        <div className="mt-6 grid gap-5 @2xl:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="category">ประเภทสินค้า</Label>
            <Select
              value={categoryId}
              onValueChange={(v) => {
                setCategoryId(v as PrCategoryId);
                setProductId(undefined);
                setPacking(undefined);
              }}
            >
              <SelectTrigger id="category" className="w-full bg-card">
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
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="product">สินค้าขอซื้อ</Label>
            <Select
              value={productId}
              onValueChange={(v) => {
                setProductId(v);
                setPacking(undefined);
              }}
            >
              <SelectTrigger id="product" className="w-full bg-card">
                <SelectValue placeholder="เลือกสินค้า" />
              </SelectTrigger>
              <SelectContent>
                {products.length === 0 ? (
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">
                    ประเภทนี้ยังไม่มีสินค้าในระบบ
                  </div>
                ) : (
                  products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                      {p.sub && ` ${p.sub}`}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="packing">บรรจุภัณฑ์</Label>
            <Select value={packing} onValueChange={setPacking}>
              <SelectTrigger id="packing" className="w-full bg-card">
                <SelectValue placeholder="เลือกบรรจุภัณฑ์" />
              </SelectTrigger>
              <SelectContent>
                {(product?.packingOptions ?? []).map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="qty">ขอซื้อ ({product?.unit ?? safeDoc.unit})</Label>
            <QtyStepper
              id="qty"
              value={qty}
              onValueChange={setQty}
              digits={["ตัน", "ลิตร", "กก."].includes(product?.unit ?? safeDoc.unit) ? 2 : 0}
            />
          </div>

          <div className="space-y-2">
            <Label>เหตุผลการซื้อ</Label>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              {PR_REASONS.map((r) => (
                <Label
                  key={r}
                  htmlFor={`reason-${r}`}
                  className="flex cursor-pointer items-center gap-2 font-normal"
                >
                  <Checkbox
                    id={`reason-${r}`}
                    checked={reasons.includes(r)}
                    onCheckedChange={(c) => toggleReason(r, c === true)}
                  />
                  {PR_REASON_LABEL[r]}
                </Label>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="needed-date">วันที่ต้องการสินค้า</Label>
            <DateSelect
              id="needed-date"
              value={neededDate}
              onValueChange={setNeededDate}
              placeholder="เลือกวันที่ต้องการสินค้า"
            />
          </div>
        </div>
      </main>

      {/* ---------- แถบปุ่มล่าง ----------
           ปุ่มชิดขอบซ้าย-ขวาของแถบเต็มความกว้างจริง ไม่ผูกความกว้างกับ
           max-w-3xl ของฟอร์มด้านบน — ฟอร์มแคบเพื่อให้อ่านง่าย แต่แถบปุ่ม
           กว้างเต็มพื้นที่เนื้อหาเสมอ */}
      <div className="sticky bottom-0 z-30 border-t border-border bg-surface">
        <div className="flex w-full items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Button variant="outline-primary" onClick={goBack}>
            ย้อนกลับ
          </Button>
          <Button disabled={!canSave} onClick={handleSave}>
            บันทึก
          </Button>
        </div>
      </div>

      {/* ---------- ยืนยันออกจากหน้าทั้งที่ยังไม่บันทึก ---------- */}
      <AlertDialog open={confirmLeaveOpen} onOpenChange={setConfirmLeaveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>คุณต้องการออกจากหน้านี้ใช่ไหม?</AlertDialogTitle>
            <AlertDialogDescription>
              เมื่อออกจากหน้านี้แล้ว การแก้ไขจะไม่ถูกบันทึก
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>อยู่หน้านี้ต่อ</AlertDialogCancel>
            <AlertDialogAction onClick={() => router.back()}>
              ออกจากหน้านี้
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Crumbs({ code, id }: { code?: string; id?: string }) {
  return (
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
        {code && id ? (
          <>
            <BreadcrumbItem>
              <BreadcrumbLink href={`/pr/${id}`}>ใบขอซื้อ {code}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-primary">แก้ไขใบขอซื้อ</BreadcrumbPage>
            </BreadcrumbItem>
          </>
        ) : (
          <BreadcrumbItem>
            <BreadcrumbPage className="text-primary">แก้ไขใบขอซื้อ</BreadcrumbPage>
          </BreadcrumbItem>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

function QtyStepper({
  id,
  value,
  onValueChange,
  digits,
}: {
  id: string;
  value: number;
  onValueChange: (next: number) => void;
  digits: number;
}) {
  const field = useNumberField(value, onValueChange, digits);
  const step = (delta: number) =>
    onValueChange(Math.max(0, Number((value + delta).toFixed(digits))));

  return (
    <InputGroup className="bg-card">
      <InputGroupAddon align="inline-start">
        <InputGroupButton size="icon-xs" aria-label="ลดจำนวน" onClick={() => step(-1)}>
          <MinusIcon />
        </InputGroupButton>
      </InputGroupAddon>
      <InputGroupInput {...field} id={id} className="text-center" />
      <InputGroupAddon align="inline-end">
        <InputGroupButton size="icon-xs" aria-label="เพิ่มจำนวน" onClick={() => step(1)}>
          <PlusIcon />
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  );
}
