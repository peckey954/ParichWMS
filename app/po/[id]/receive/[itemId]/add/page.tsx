"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { MinusIcon, PlusIcon, TruckIcon } from "lucide-react";
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
import { Switch } from "@peckey954/ui/components/ui/switch";
import { Textarea } from "@peckey954/ui/components/ui/textarea";
import { toast } from "sonner";
import { DateSelect, formatDateSlash } from "@/components/date-select";
import { useNumberField } from "@/components/number-field";
import { PR_CATEGORY_LABEL } from "@/lib/pr";
import { formatPoQty, getPoLineItem } from "@/lib/po";

/* ------------------------------------------------------------------
   เพิ่มรอบรับเข้า — หนึ่งหน้าต่อรอบหนึ่งรอบของ "รายการสินค้าหนึ่งรายการ"
   เท่านั้น เข้ามาจากปุ่ม "เพิ่มรอบรับเข้า" ใต้การ์ดรายการนั้นในหน้าใบสั่งซื้อ

   รถหนึ่งคันส่งได้หลายสินค้าพร้อมกัน แต่ยอดรับต้องแยกบันทึกทีละสินค้าเสมอ —
   สวิตช์ "รถคันนี้ส่งสินค้าอื่นในใบนี้ด้วย" คือทางลัดของกรณีนั้น บันทึกรอบนี้
   เสร็จแล้วพาไปหน้ากรอกของรายการถัดไปทันที พร้อมดึงวันที่/ทะเบียนรถ/เบอร์ตู้
   คอนเทนเนอร์ (ของรถคันเดียวกัน ไม่เปลี่ยน) มาเติมให้ ไม่ต้องพิมพ์ซ้ำ — ไล่ไป
   ทีละรายการที่ยังไม่ได้คีย์ในเชนเดียวกัน (ส่งต่อผ่าน query param "visited")
   จนกว่าจะครบทุกรายการในใบ หรือกดปิดสวิตช์ไว้เมื่อไหร่ก็จบเชนแค่นั้น

   ไม่มี backend จริงตามธรรมชาติของแอปนี้ — บันทึกแล้วขึ้น toast แล้วพาไปขั้นต่อไป
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
  const searchParams = useSearchParams();

  const found = React.useMemo(
    () => getPoLineItem(params.id, params.itemId),
    [params.id, params.itemId]
  );

  // ค่าที่ส่งต่อมาจากรอบก่อนหน้าของรถคันเดียวกัน (ถ้ามี) — เติมให้ทันทีไม่ต้องพิมพ์ซ้ำ
  const prefillPlate = searchParams.get("plate") ?? "";
  const prefillArrive = searchParams.get("arrive");
  const prefillContainer = searchParams.get("container") ?? "";
  const visitedIds = React.useMemo(
    () => new Set((searchParams.get("visited") ?? "").split(",").filter(Boolean)),
    [searchParams]
  );

  const [arriveDate, setArriveDate] = React.useState<Date | undefined>(
    prefillArrive
      ? (() => {
          const [d, m, y] = prefillArrive.split("/").map(Number);
          return d && m && y ? new Date(y, m - 1, d) : undefined;
        })()
      : undefined
  );
  const [plate, setPlate] = React.useState(prefillPlate);
  const [containerNo, setContainerNo] = React.useState(prefillContainer);
  const [receivedQty, setReceivedQty] = React.useState(0);
  const [note, setNote] = React.useState("");
  const [sameTruck, setSameTruck] = React.useState(true);

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

  // รายการอื่นในใบเดียวกันที่ยังไม่ถูกคีย์ในเชนรถคันนี้ — ใช้ตัดสินว่าจะโชว์
  // สวิตช์ "รถคันนี้ส่งของอื่นด้วย" ไหม และถ้าติ๊กไว้จะพาไปรายการไหนต่อ
  const remainingOthers = po.lineItems.filter(
    (i) => i.id !== item.id && !visitedIds.has(i.id)
  );

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

    if (sameTruck && remainingOthers.length > 0) {
      const next = remainingOthers[0];
      const nextVisited = [...visitedIds, item.id].join(",");
      const qp = new URLSearchParams({
        plate: plate.trim(),
        container: containerNo.trim(),
        visited: nextVisited,
      });
      if (arriveDate) qp.set("arrive", formatDateSlash(arriveDate));
      router.push(`/po/${po.id}/receive/${next.id}/add?${qp.toString()}`);
      return;
    }

    router.push(`/po/${po.id}`);
  }

  return (
    <>
      <main className="mx-auto w-full max-w-4xl px-4 pt-6 pb-24 sm:px-6">
        <Crumbs poId={po.id} poCode={po.code} productName={item.productName} />

        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          เพิ่มการรับเข้าสินค้า{code}
        </h1>

        {/* ---------- หัวรายการ ---------- */}
        <div className="mt-4 rounded-xl border border-border bg-card p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="font-semibold">
                {item.productName}
                {item.productSub && ` ${item.productSub}`}
              </span>
              <span className="text-sm text-muted-foreground">
                {PR_CATEGORY_LABEL[item.categoryId]}
              </span>
              {item.packing && (
                <>
                  <span className="text-border" aria-hidden>|</span>
                  <span className="text-sm text-muted-foreground">{item.packing}</span>
                </>
              )}
            </p>
            <p className="text-sm">{po.company}</p>
          </div>
        </div>

        {/* ---------- วันที่ / ทะเบียนรถ / เบอร์ตู้ ---------- */}
        <div className="mt-6 grid gap-4 @lg:grid-cols-3">
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
        <div className="mt-4 space-y-1.5">
          <Label htmlFor="received-qty">
            ปริมาณจะรับเข้า ({item.unit}){" "}
            <span className="font-normal text-muted-foreground">(ไม่บังคับ)</span>
          </Label>
          <QtyStepper id="received-qty" value={receivedQty} onValueChange={setReceivedQty} />
        </div>

        <div className="mt-4 space-y-1.5">
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

        {/* ---------- สวิตช์รถคันเดียวส่งหลายสินค้า ----------
             โผล่เฉพาะตอนใบนี้ยังมีรายการอื่นที่ยังไม่ได้คีย์ในเชนนี้ —
             ใบที่มีรายการเดียว หรือคีย์ครบทุกรายการแล้วไม่ต้องโชว์ */}
        {remainingOthers.length > 0 && (
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-border bg-brand px-4 py-3.5">
            <TruckIcon className="mt-0.5 size-4 shrink-0 text-primary" />
            <div className="min-w-0 flex-1">
              <Label htmlFor="same-truck" className="text-sm font-medium">
                รถคันนี้ส่งสินค้าอื่นในใบสั่งซื้อนี้ด้วยไหม
              </Label>
              <p className="mt-0.5 text-sm text-muted-foreground">
                ติ๊กไว้แล้วกด &quot;บันทึกแล้วไปรายการถัดไป&quot; — ระบบพาไปกรอกรอบของ{" "}
                <span className="font-medium text-foreground">{remainingOthers[0].productName}</span>{" "}
                ทันที พร้อมดึงทะเบียนรถ/เบอร์ตู้คันนี้มาเติมให้ ไม่ต้องพิมพ์ซ้ำ
              </p>
            </div>
            <Switch
              id="same-truck"
              checked={sameTruck}
              onCheckedChange={setSameTruck}
              className="mt-0.5 shrink-0"
            />
          </div>
        )}
      </main>

      {/* ---------- แถบปุ่มล่าง ---------- */}
      <div className="sticky bottom-0 z-30 border-t border-border bg-background">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Button variant="outline-primary" onClick={() => router.back()}>
            ย้อนกลับ
          </Button>
          <Button onClick={handleSave}>
            {sameTruck && remainingOthers.length > 0 ? "บันทึกแล้วไปรายการถัดไป" : "บันทึก"}
          </Button>
        </div>
      </div>
    </>
  );
}

function Crumbs({
  poId,
  poCode,
  productName,
}: {
  poId?: string;
  poCode?: string;
  productName?: string;
}) {
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
          <BreadcrumbItem>
            <BreadcrumbLink href={`/po/${poId}`}>ใบสั่งซื้อ {poCode}</BreadcrumbLink>
          </BreadcrumbItem>
        ) : (
          <BreadcrumbItem>
            <BreadcrumbPage className="text-primary">เพิ่มการรับเข้าสินค้า</BreadcrumbPage>
          </BreadcrumbItem>
        )}
        {poId && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-primary">
                เพิ่มการรับเข้าสินค้า{productName ? ` — ${productName}` : ""}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </>
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
