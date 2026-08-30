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

  // เพิ่มทีละ 1 ทุกครั้งที่ "บันทึกและเพิ่มรายการถัดไป" — ใช้เป็น key บังคับ
  // ให้ Select ตัวเลือกสินค้า remount ใหม่ ไม่งั้นพอเซ็ต productId กลับเป็น
  // undefined เฉยๆ ตัว Select ยังค้างโชว์ชื่อสินค้าตัวเก่าอยู่ (ไม่ขึ้น
  // placeholder ให้เอง เป็นเรื่องปกติของ Select ที่ค่า controlled หายไปโดย
  // ไม่ได้มาจากการเลือกใหม่ของผู้ใช้เอง)
  const [productFieldKey, setProductFieldKey] = React.useState(0);

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

  /** บันทึกใบนี้แล้วเปิดว่างสำหรับสินค้าตัวถัดไปทันที ไม่พากลับหน้ารายการ —
   *  เก็บประเภทสินค้า/เหตุผลการซื้อ/วันที่ต้องการสินค้าไว้เหมือนเดิม เพราะของจริง
   *  มักสั่งหลายสินค้าในประเภทเดียวกัน เหตุผลเดียวกัน วันที่ต้องการเดียวกัน
   *  รอบเดียว ล้างแค่สินค้า/บรรจุภัณฑ์/จำนวนที่ผูกกับตัวที่เพิ่งบันทึกไปเท่านั้น */
  function handleSaveAndNext() {
    if (!canSave || !product || !neededDate) return;
    toast.success("สร้างใบขอซื้อแล้ว", {
      description: `${product.name}${product.sub ? ` ${product.sub}` : ""} — ${formatPrQty(qty)} ${product.unit} ต้องการ ${formatDateSlash(neededDate)}`,
    });
    setProductId(undefined);
    setPacking(undefined);
    setQty(0);
    setProductFieldKey((k) => k + 1);
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
                key={productFieldKey}
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
           กว้างเต็มพื้นที่เนื้อหาเสมอ

           จอแคบ vs จอกว้างเป็นคนละเลย์เอาต์ตั้งใจ — "บันทึกและเพิ่มรายการ
           ถัดไป" ป้ายยาว อยู่แถวเดียวกับอีกสองปุ่มบนจอมือถือไม่พอดี (ล้น/
           บีบจนกดยาก) จอแคบเลยซ้อน 2 แถวแทน: แถวบนปุ่มนี้กว้างเต็ม แถวล่าง
           ย้อนกลับ/บันทึกแบ่งครึ่งเท่ากัน — จอกว้างมีที่พอ อยู่แถวเดียวได้

           ใช้ container query (@lg:) ไม่ใช่ sm: — ทั้งแอปวัดความกว้าง "มือถือ/
           แท็บเล็ต/เดสก์ท็อป" จากกล่อง @container ของ DeviceFrame
           (components/device-preview.tsx) ไม่ใช่ขนาดหน้าต่างจริง ปุ่มลองดู
           จอมือถือที่หัวแอปถึงจะมีผลกับ media query ธรรมดา sm:/lg: ไม่ได้เลย
           เพราะกรอบจำลองแค่บีบกล่อง ไม่ได้ย่อหน้าต่างเบราว์เซอร์จริง */}
      <div className="sticky bottom-0 z-30 border-t border-border bg-surface">
        {/* ---------- จอแคบ: ซ้อน 2 แถว ---------- */}
        <div className="flex w-full flex-col gap-3 px-8 py-3 @lg:hidden">
          {/* ของจริงมักสั่งหลายสินค้าในประเภท/เหตุผล/วันที่ต้องการเดียวกันรอบเดียว
              ปุ่มนี้บันทึกใบปัจจุบันแล้วเปิดว่างสำหรับสินค้าตัวถัดไปต่อเลย
              ไม่ต้องเลือกประเภท/เหตุผล/วันที่ซ้ำ — โผล่เฉพาะตอนกรอกจนกดบันทึกได้
              แล้วเท่านั้น ไม่ใช่ปุ่มถาวรที่กดไม่ได้เฉยๆ ตั้งแต่หน้ายังว่าง */}
          {canSave && (
            <Button variant="outline-primary" onClick={handleSaveAndNext} className="w-full">
              บันทึกและเพิ่มรายการถัดไป
            </Button>
          )}
          <div className="flex items-center gap-3">
            <Button variant="outline-primary" onClick={goBack} className="flex-1">
              ย้อนกลับ
            </Button>
            <Button disabled={!canSave} onClick={handleSave} className="flex-1">
              บันทึก
            </Button>
          </div>
        </div>

        {/* ---------- จอกว้าง: แถวเดียว ---------- */}
        <div className="hidden w-full items-center justify-between gap-3 px-8 py-3 @lg:flex">
          <Button variant="outline-primary" onClick={goBack}>
            ย้อนกลับ
          </Button>
          <div className="flex items-center gap-2">
            {canSave && (
              <Button variant="outline-primary" onClick={handleSaveAndNext}>
                บันทึกและเพิ่มรายการถัดไป
              </Button>
            )}
            <Button disabled={!canSave} onClick={handleSave}>
              บันทึก
            </Button>
          </div>
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
