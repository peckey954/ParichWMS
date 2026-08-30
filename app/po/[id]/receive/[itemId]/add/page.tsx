"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { MinusIcon, PlusIcon } from "lucide-react";
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
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@peckey954/ui/components/ui/input-group";
import { Label } from "@peckey954/ui/components/ui/label";
import { Textarea } from "@peckey954/ui/components/ui/textarea";
import { toast } from "sonner";
import { DateSelect } from "@/components/date-select";
import { useNumberField } from "@/components/number-field";
import { PR_CATEGORY_LABEL } from "@/lib/pr";
import { formatPoQty, getPoLineItem } from "@/lib/po";

/* ------------------------------------------------------------------
   เพิ่มรอบรับเข้า — หนึ่งหน้าต่อรอบหนึ่งรอบของ "รายการสินค้าหนึ่งรายการ"
   เท่านั้น เข้ามาจากปุ่ม "เพิ่มรอบรับเข้า" ใต้การ์ดรายการนั้นในหน้าใบสั่งซื้อ
   กรอกแค่รายการเดียวจบในหน้านี้ — ไม่มีการพาไปกรอกรายการถัดไปต่อเนื่องกัน

   ไม่มี backend จริงตามธรรมชาติของแอปนี้ — บันทึกแล้วขึ้น toast แล้วพากลับไป
   หน้าใบสั่งซื้อ
------------------------------------------------------------------ */

export default function AddPoRoundPage() {
  return (
    <React.Suspense fallback={null}>
      <AddPoRoundForm />
    </React.Suspense>
  );
}

function AddPoRoundForm() {
  const router = useRouter();
  const params = useParams<{ id: string; itemId: string }>();

  const found = React.useMemo(
    () => getPoLineItem(params.id, params.itemId),
    [params.id, params.itemId]
  );

  // ค่าเริ่มต้นเป็นวันนี้เสมอ — ผู้ใช้ส่วนใหญ่คีย์ข้อมูลตอนรถมาถึงจริง
  // วันที่รถเข้าจึงมักเป็นวันนี้อยู่แล้ว
  const [arriveDate, setArriveDate] = React.useState<Date | undefined>(() => new Date());
  const [plate, setPlate] = React.useState("");
  const [containerNo, setContainerNo] = React.useState("");
  const [receivedQty, setReceivedQty] = React.useState(0);
  const [note, setNote] = React.useState("");

  if (!found) {
    return (
      <main className="mx-auto w-full max-w-4xl px-4 pt-6 pb-24 sm:px-6">
        <Crumbs />
        <div className="mt-10 rounded-xl border border-dashed border-border px-6 py-14 text-center">
          <p className="font-medium">ไม่พบรายการสินค้านี้</p>
          <p className="mt-1 text-sm text-muted-foreground">เอกสารอาจถูกลบหรือลิงก์ไม่ถูกต้อง</p>
          <Button asChild variant="outline-primary" className="mt-4">
            <Link href="/po">กลับไปหน้าสั่งซื้อ PO</Link>
          </Button>
        </div>
      </main>
    );
  }

  const { po, item } = found;
  const seq = String(item.rounds.length + 1).padStart(2, "0");
  const code = `${po.code}/${item.id.split("-li")[1] ?? "01"}-${seq}`;

  function handleSave() {
    if (!plate.trim()) {
      toast.error("กรุณาระบุทะเบียนรถ");
      return;
    }

    toast.success(`บันทึกรอบรับเข้า ${code} แล้ว`, {
      description: `${item.productName} — ${plate.trim()}${
        receivedQty > 0 ? ` · รับเข้า ${formatPoQty(receivedQty)} ${item.unit}` : ""
      }`,
    });

    router.push(`/po/${po.id}`);
  }

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col">
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 pt-6 pb-6 sm:px-6">
        <Crumbs poId={po.id} />

        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          เพิ่มการรับเข้าสินค้า {code}
        </h1>

        {/* ---------- หัวรายการ — กล่องพื้นสีแบรนด์ (ตามแบบ) ไม่ใช่การ์ดขาวเฉยๆ
            จอแคบ: 3 บรรทัดซ้อนกัน (ชื่อ / ประเภท·หมวด·บรรจุภัณฑ์ / บริษัท)
            จอกว้าง: ยุบเหลือบรรทัดเดียว — ชื่อ+รายละเอียดชิดซ้าย บริษัทชิดขวา
            (ตามแบบ) ---------- */}
        <div className="mt-5 rounded-xl border border-border bg-brand px-4 py-3.5">
          <div className="@3xl:hidden">
            <p className="font-semibold">
              {item.productName}
              {item.productSub && ` ${item.productSub}`}
            </p>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {PR_CATEGORY_LABEL[item.categoryId]} | {item.group}
              {item.packing && ` | ${item.packing}`}
            </p>
            <p className="mt-3 text-sm">{po.company}</p>
          </div>
          <div className="hidden @3xl:flex @3xl:items-baseline @3xl:justify-between @3xl:gap-4">
            <p className="min-w-0 truncate">
              <span className="font-semibold">
                {item.productName}
                {item.productSub && ` ${item.productSub}`}
              </span>
              <span className="ml-3 text-sm text-muted-foreground">
                {PR_CATEGORY_LABEL[item.categoryId]} | {item.group}
                {item.packing && ` | ${item.packing}`}
              </span>
            </p>
            <p className="shrink-0 text-sm">{po.company}</p>
          </div>
        </div>

        {/* ---------- วันที่ / ทะเบียนรถ / เบอร์ตู้ ---------- */}
        <div className="mt-8 grid gap-5 @lg:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="arrive-date">วันที่รถจะเข้า</Label>
            <DateSelect id="arrive-date" value={arriveDate} onValueChange={setArriveDate} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="plate">ทะเบียนรถ</Label>
            <InputGroup className="bg-card">
              <InputGroupInput
                id="plate"
                placeholder="ระบุทะเบียนรถ"
                value={plate}
                onChange={(e) => setPlate(e.target.value)}
              />
            </InputGroup>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="container">
              เบอร์ตู้คอนเทนเนอร์{" "}
              <span className="font-normal text-muted-foreground">(ไม่บังคับ)</span>
            </Label>
            <InputGroup className="bg-card">
              <InputGroupInput
                id="container"
                placeholder="ระบุเบอร์ตู้คอนเทนเนอร์"
                value={containerNo}
                onChange={(e) => setContainerNo(e.target.value)}
              />
            </InputGroup>
          </div>
        </div>

        {/* ---------- ปริมาณ ---------- */}
        <div className="mt-8 space-y-1.5">
          <Label htmlFor="received-qty">
            ปริมาณจะรับเข้า ({item.unit}){" "}
            <span className="font-normal text-muted-foreground">(ไม่บังคับ)</span>
          </Label>
          <QtyStepper id="received-qty" value={receivedQty} onValueChange={setReceivedQty} />
        </div>

        <div className="mt-8 space-y-1.5">
          <Label htmlFor="note">
            หมายเหตุ <span className="font-normal text-muted-foreground">(ไม่บังคับ)</span>
          </Label>
          <Textarea
            id="note"
            className="bg-card"
            placeholder="ระบุหมายเหตุ"
            rows={3}
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
    </div>
  );
}

function Crumbs({ poId }: { poId?: string }) {
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
        {poId ? (
          <>
            <BreadcrumbItem>
              <BreadcrumbLink href={`/po/${poId}`}>ใบสั่งซื้อ</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-primary">รอบการรับสินค้า</BreadcrumbPage>
            </BreadcrumbItem>
          </>
        ) : (
          <BreadcrumbItem>
            <BreadcrumbPage className="text-primary">เพิ่มการรับเข้าสินค้า</BreadcrumbPage>
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
}: {
  id: string;
  value: number;
  onValueChange: (next: number) => void;
}) {
  const field = useNumberField(value, onValueChange, 2);
  const step = (delta: number) =>
    onValueChange(Math.max(0, Number((value + delta).toFixed(2))));

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
