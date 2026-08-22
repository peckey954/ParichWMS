"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
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
import { DateSelect, formatDateSlash } from "@/components/date-select";
import { useNumberField } from "@/components/number-field";
import {
  formatPrQty,
  PR_CATEGORIES,
  PR_CATEGORY_LABEL,
  PR_REASONS,
  PR_REASON_LABEL,
  productsOf,
  type PrCategoryId,
  type PrProduct,
  type PrReason,
} from "@/lib/pr";

/* ------------------------------------------------------------------
   สร้างใบขอซื้อ — เผยทีละช่องตามลำดับที่ต้องกรอกจริง ไม่ใช่กางฟอร์มยาวให้เห็น
   หมดตั้งแต่แรก เพราะ "สินค้าขอซื้อ" ต้องรู้ประเภทก่อนถึงจะกรองตัวเลือกได้
   และช่องที่เหลือ (บรรจุภัณฑ์/จำนวน/เหตุผล/วันที่) ล้วนผูกกับสินค้าที่เลือก

   ไม่มี backend จริงตามธรรมชาติของแอปนี้ — บันทึกแล้วขึ้น toast แล้วกลับไปหน้า
   ที่เข้ามา เหมือนหน้าใบผลิต

   ย้อนกลับระหว่างกรอกค้างไว้ต้องถามก่อน เพราะข้อมูลหายทันทีไม่มีร่างเก็บไว้
------------------------------------------------------------------ */

export default function CreatePrPage() {
  const router = useRouter();

  const [categoryId, setCategoryId] = React.useState<PrCategoryId | undefined>();
  const [productId, setProductId] = React.useState<string | undefined>();
  const [packing, setPacking] = React.useState<string | undefined>();
  const [qty, setQty] = React.useState(0);
  const [reasons, setReasons] = React.useState<PrReason[]>([]);
  const [neededDate, setNeededDate] = React.useState<Date | undefined>();
  const [confirmLeaveOpen, setConfirmLeaveOpen] = React.useState(false);

  const products = categoryId ? productsOf(categoryId) : [];
  const product: PrProduct | undefined = products.find((p) => p.id === productId);

  const isDirty = categoryId !== undefined;
  const canSave =
    Boolean(categoryId && product && packing && qty > 0 && reasons.length > 0 && neededDate);

  const toggleReason = (r: PrReason, checked: boolean) =>
    setReasons((prev) => (checked ? [...prev, r] : prev.filter((x) => x !== r)));

  function goBack() {
    if (isDirty) setConfirmLeaveOpen(true);
    else router.back();
  }

  function handleSave() {
    if (!canSave || !product || !neededDate) return;
    toast.success("สร้างใบขอซื้อแล้ว", {
      description: `${product.name}${product.sub ? ` ${product.sub}` : ""} — ${formatPrQty(qty)} ${product.unit} ต้องการ ${formatDateSlash(neededDate)}`,
    });
    router.back();
  }

  return (
    // ขั้นแรกของฟอร์มมีแค่ช่องเดียว เนื้อหาสั้นกว่าจอ — ถ้าไม่กำหนดความสูงขั้นต่ำ
    // แถบปุ่มด้านล่าง (sticky bottom-0) จะลอยอยู่ใต้เนื้อหาสั้นๆ แทนที่จะติด
    // ขอบล่างจอจริง เพราะ sticky ยึดตามตำแหน่งที่เลื่อนผ่าน ไม่ใช่ผลักไปสุดขอบ
    // ให้ flex-1 ใน main ดันแถบปุ่มลงไปสุดความสูงขั้นต่ำนี้แทน
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col">
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pt-6 pb-24 sm:px-6">
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
              <BreadcrumbPage className="text-primary">สร้างใบขอซื้อ</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <h1 className="mt-2 text-2xl font-semibold tracking-tight">สร้างใบขอซื้อ</h1>

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

          {/* ---------- ขั้นที่ 2: สินค้า — โผล่หลังเลือกประเภทแล้วเท่านั้น ---------- */}
          {categoryId && (
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
          )}

          {/* ---------- ขั้นที่ 3: ที่เหลือทั้งหมด — โผล่พร้อมกันหลังเลือกสินค้าแล้ว ---------- */}
          {product && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="packing">บรรจุภัณฑ์</Label>
                <Select value={packing} onValueChange={setPacking}>
                  <SelectTrigger id="packing" className="w-full bg-card">
                    <SelectValue placeholder="เลือกบรรจุภัณฑ์" />
                  </SelectTrigger>
                  <SelectContent>
                    {product.packingOptions.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="qty">ขอซื้อ ({product.unit})</Label>
                <QtyStepper
                  id="qty"
                  value={qty}
                  onValueChange={setQty}
                  digits={["ตัน", "ลิตร", "กก."].includes(product.unit) ? 2 : 0}
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
            </>
          )}
        </div>
      </main>

      {/* ---------- แถบปุ่มล่าง ----------
           ปุ่มชิดขอบซ้าย-ขวาของแถบเต็มความกว้างจริง ไม่ผูกความกว้างกับ
           max-w-3xl ของฟอร์มด้านบน — ฟอร์มแคบเพื่อให้อ่านง่าย แต่แถบปุ่ม
           กว้างเต็มพื้นที่เนื้อหาเสมอ */}
      <div className="sticky bottom-0 z-30 border-t border-border bg-background">
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
              เมื่อออกจากหน้านี้แล้ว ข้อมูลจะไม่ถูกบันทึก
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
