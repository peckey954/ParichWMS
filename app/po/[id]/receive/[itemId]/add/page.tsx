"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { MinusIcon, PlusIcon, Trash2Icon } from "lucide-react";
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
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@peckey954/ui/components/ui/input-group";
import { Label } from "@peckey954/ui/components/ui/label";
import { Textarea } from "@peckey954/ui/components/ui/textarea";
import { toast } from "sonner";
import { DateSelect, formatDateSlash, parseDateSlash } from "@/components/date-select";
import { useNumberField } from "@/components/number-field";
import { applyRoundEdits, useAddedRounds } from "@/components/po/added-rounds-provider";
import { PR_CATEGORY_LABEL } from "@/lib/pr";
import { formatPoQty, getPoLineItem, roundIdFromCode, type PoRound } from "@/lib/po";

/* ------------------------------------------------------------------
   เพิ่ม/แก้ไขรอบรับเข้า — หน้าเดียวกันสองโหมด แยกกันด้วย query param
   "roundId": ไม่มี = เพิ่มรอบใหม่ (มาจากปุ่ม "เพิ่มรอบ" ใต้การ์ดรายการสินค้า),
   มี = แก้ไขรอบที่มีอยู่แล้ว (มาจากกดแถวสถานะ "รอรถขนส่ง" ในตาราง "รอบการรับ
   สินค้า" — ดู roundHref ใน app/po/[id]/page.tsx) กรอกแค่รายการเดียวจบในหน้านี้
   ไม่มีการพาไปกรอกรายการถัดไปต่อเนื่องกัน

   บันทึกแล้วต้องขึ้น/อัปเดตแถวจริงในตาราง "รอบการรับสินค้า" ของหน้าใบสั่งซื้อ
   (ไม่ใช่แค่ toast ลอยๆ) — เก็บผ่าน AddedRoundsProvider (ยกสถานะขึ้นไปที่
   AppShell) เพราะเป็นคนละหน้ากัน ข้าม route ไปมา React state ธรรมดาข้ามไม่ได้
   แก้ไข/ลบได้เฉพาะรอบสถานะ "รอรถขนส่ง" เท่านั้น (ยังไม่มีตัวเลขรับเข้าจริง
   คีย์ได้แค่ข้อมูลรถ) — รอบที่ผ่านการชั่งไปแล้วดูได้อย่างเดียวที่หน้ารายละเอียด
   รอบ (app/po/[id]/receive/[itemId]/[roundId]/page.tsx) ต้องรอเมนู "ชั่งน้ำหนัก
   และรับสินค้า" มาคีย์ต่อถึงจะขยับสถานะ (เลขที่ ID ล็อตก็ยังไม่มีด้วยเหตุผล
   เดียวกัน — ดู PoRound.batchId ใน lib/po.ts)

   ไม่มี backend จริงตามธรรมชาติของแอปนี้ — ข้อมูลอยู่แค่ใน memory ของเซสชันนี้
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
  const roundId = searchParams.get("roundId");
  const { entries, roundsFor, addRound, patches, updateRound, deletedIds, deleteRound } =
    useAddedRounds();

  const found = React.useMemo(
    () => getPoLineItem(params.id, params.itemId),
    [params.id, params.itemId]
  );

  // โหมดแก้ไข — หารอบที่จะแก้จากทั้งข้อมูลตัวอย่าง (item.rounds) และรอบที่
  // เพิ่งเพิ่มระหว่างเซสชันนี้ (entries) แล้วผสาน patch/เช็คว่าถูกลบไปหรือยัง
  // ด้วย applyRoundEdits ตัวเดียวกับที่หน้าใบสั่งซื้อใช้ กันเห็นข้อมูลไม่ตรงกัน
  const editingRound = React.useMemo(() => {
    if (!roundId || !found) return null;
    const candidate =
      found.item.rounds.find((r) => r.id === roundId) ??
      entries.find((e) => e.round.id === roundId)?.round;
    if (!candidate) return null;
    return applyRoundEdits(candidate, patches, deletedIds);
  }, [roundId, found, entries, patches, deletedIds]);

  const isEdit = !!roundId;

  // ค่าเริ่มต้นเป็นวันนี้เสมอถ้าเป็นการเพิ่มรอบใหม่ — ผู้ใช้ส่วนใหญ่คีย์ข้อมูล
  // ตอนรถมาถึงจริง วันที่รถเข้าจึงมักเป็นวันนี้อยู่แล้ว โหมดแก้ไขดึงค่าเดิมมา
  // ใส่แทน (ตั้งค่าเริ่มต้นจาก editingRound ได้ตรงๆ เพราะ params.itemId ไม่
  // เปลี่ยนระหว่างที่หน้านี้ mount อยู่ ไม่ต้องกัง sync เพิ่ม)
  const [arriveDate, setArriveDate] = React.useState<Date | undefined>(() =>
    editingRound ? parseDateSlash(editingRound.arriveDate) : new Date()
  );
  const [plate, setPlate] = React.useState(() => editingRound?.plate ?? "");
  const [containerNo, setContainerNo] = React.useState(() => editingRound?.containerNo ?? "");
  const [receivedQty, setReceivedQty] = React.useState(0);
  const [note, setNote] = React.useState(() => editingRound?.note ?? "");
  const [deleteOpen, setDeleteOpen] = React.useState(false);

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

  if (isEdit && !editingRound) {
    return (
      <main className="mx-auto w-full max-w-4xl px-4 pt-6 pb-24 sm:px-6">
        <Crumbs poId={params.id} />
        <div className="mt-10 rounded-xl border border-dashed border-border px-6 py-14 text-center">
          <p className="font-medium">ไม่พบรอบรับเข้านี้</p>
          <p className="mt-1 text-sm text-muted-foreground">เอกสารอาจถูกลบหรือลิงก์ไม่ถูกต้อง</p>
          <Button asChild variant="outline-primary" className="mt-4">
            <Link href={`/po/${params.id}`}>กลับไปหน้าใบสั่งซื้อ</Link>
          </Button>
        </div>
      </main>
    );
  }

  // แก้ไขได้เฉพาะรอบสถานะ "รอรถขนส่ง" — รอบที่ผ่านการชั่งไปแล้วมีข้อมูลชุดอื่น
  // ที่ฟอร์มนี้ไม่ได้กรอก (น้ำหนัก/ผู้รับ/ผู้ชั่ง ฯลฯ) แก้ผ่านฟอร์มง่ายๆ นี้ไม่ได้
  // แล้ว ต้องดูที่หน้ารายละเอียดรอบแทน (ปกติกด "roundHref" จากตารางจะไม่มีทาง
  // มาถึงหน้านี้เลยถ้าไม่ใช่ "รอรถขนส่ง" — เช็คซ้ำไว้เผื่อมีคนพิมพ์ลิงก์เอง)
  if (isEdit && editingRound && editingRound.status !== "waitingTruck") {
    return (
      <main className="mx-auto w-full max-w-4xl px-4 pt-6 pb-24 sm:px-6">
        <Crumbs poId={params.id} />
        <div className="mt-10 rounded-xl border border-dashed border-border px-6 py-14 text-center">
          <p className="font-medium">รอบนี้แก้ไขไม่ได้แล้ว</p>
          <p className="mt-1 text-sm text-muted-foreground">
            รอบรับเข้าที่ผ่านการชั่งน้ำหนักแล้วดูได้ที่หน้ารายละเอียดรอบแทน
          </p>
          <Button asChild variant="outline-primary" className="mt-4">
            <Link href={`/po/${params.id}/receive/${params.itemId}/${encodeURIComponent(editingRound.id)}`}>
              ไปหน้ารายละเอียดรอบ
            </Link>
          </Button>
        </div>
      </main>
    );
  }

  const { po, item } = found;
  // นับรวมรอบที่เพิ่มไว้แล้วระหว่างเซสชันนี้ด้วย (roundsFor) ไม่ใช่แค่
  // item.rounds ที่มาจากข้อมูลตัวอย่าง — ไม่งั้นเพิ่มสองรอบติดกันจะได้เลขที่
  // ซ้ำกัน (โหมดแก้ไขใช้เลขที่เดิมของรอบนั้นตรงๆ ไม่ต้องคำนวณใหม่)
  const code = editingRound
    ? editingRound.code
    : `${po.code}/${item.id.split("-li")[1] ?? "01"}-${String(
        item.rounds.length + roundsFor(item.id).length + 1
      ).padStart(2, "0")}`;

  function handleSave() {
    if (!plate.trim()) {
      toast.error("กรุณาระบุทะเบียนรถ");
      return;
    }

    if (editingRound) {
      updateRound(editingRound.id, {
        plate: plate.trim(),
        containerNo: containerNo.trim() || undefined,
        arriveDate: arriveDate ? formatDateSlash(arriveDate) : "-",
        note: note.trim() || undefined,
      });
      toast.success(`แก้ไขรอบรับเข้า ${code} แล้ว`, {
        description: `${item.productName} — ${plate.trim()}`,
      });
    } else {
      const round: PoRound = {
        id: roundIdFromCode(code),
        code,
        plate: plate.trim(),
        containerNo: containerNo.trim() || undefined,
        arriveDate: arriveDate ? formatDateSlash(arriveDate) : "-",
        note: note.trim() || undefined,
        status: "waitingTruck",
      };
      addRound(item.id, round);
      toast.success(`บันทึกรอบรับเข้า ${code} แล้ว`, {
        description: `${item.productName} — ${plate.trim()}${
          receivedQty > 0 ? ` · คาดว่าจะรับเข้า ${formatPoQty(receivedQty)} ${item.unit}` : ""
        }`,
      });
    }

    // กลับไปหน้าที่มาก่อนหน้าเสมอ (router.back — เหมือนปุ่ม "ย้อนกลับ") ไม่ใช่
    // push ไปหน้าใบสั่งซื้อตายตัว — ปุ่ม "เพิ่มรอบ"/แถวในตารางกดเข้ามาได้จาก
    // หลายที่ (การ์ดในแท็บ "สั่งซื้อ" ของหน้า /po, หน้าใบสั่งซื้อ /po/[id])
    // บันทึกเสร็จควรกลับไปหน้านั้นๆ ไม่ใช่ถูกเด้งไปหน้าตายตัวทุกครั้ง
    router.back();
  }

  function handleDelete() {
    if (!editingRound) return;
    deleteRound(editingRound.id);
    toast.success(`ลบรอบรับเข้า ${code} แล้ว`);
    router.back();
  }

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col">
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 pt-6 pb-6 sm:px-6">
        <Crumbs poId={po.id} />

        <div className="mt-2 flex items-start justify-between gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">
            {isEdit ? "แก้ไขการรับเข้าสินค้า" : "เพิ่มการรับเข้าสินค้า"} {code}
          </h1>
          {/* ลบได้เฉพาะโหมดแก้ไข (รอบสถานะ "รอรถขนส่ง" เท่านั้นที่แก้ไขได้อยู่
              แล้ว — ดู roundHref ใน app/po/[id]/page.tsx) */}
          {isEdit && (
            <Button
              variant="ghost"
              size="icon"
              aria-label="ลบรอบรับเข้านี้"
              className="shrink-0"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2Icon />
            </Button>
          )}
        </div>

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
              {PR_CATEGORY_LABEL[item.categoryId]} <span className="text-border" aria-hidden>|</span> {item.group}
              {item.packing && (
                <>
                  {" "}
                  <span className="text-border" aria-hidden>|</span> {item.packing}
                </>
              )}
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
                {PR_CATEGORY_LABEL[item.categoryId]} <span className="text-border" aria-hidden>|</span> {item.group}
                {item.packing && (
                  <>
                    {" "}
                    <span className="text-border" aria-hidden>|</span> {item.packing}
                  </>
                )}
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
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-3 px-8 py-3">
          <Button variant="outline-primary" onClick={() => router.back()}>
            ย้อนกลับ
          </Button>
          <Button onClick={handleSave}>บันทึก</Button>
        </div>
      </div>

      {isEdit && (
        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>ลบรอบรับเข้านี้ใช่ไหม?</AlertDialogTitle>
              <AlertDialogDescription>
                {code} จะหายไปจากตาราง &quot;รอบการรับสินค้า&quot; การดำเนินการนี้แก้ไขกลับไม่ได้
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>ยืนยันลบ</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
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
