"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@peckey954/ui/components/ui/breadcrumb";
import { Button } from "@peckey954/ui/components/ui/button";
import { toast } from "sonner";
import {
  ZoneAssignFields,
  ZoneScanResult,
  useZoneAssign,
} from "@/components/stock/zone-assign";
import {
  getInboundReceipt,
  livePieces,
  setPieceZones,
  type InboundReceipt,
} from "@/lib/general-stock";

/* ------------------------------------------------------------------
   เลือกโซนรับเข้า — หน้าเต็มสำหรับจอแคบ

   งานเดียวกับกล่องบนจอกว้าง (ZoneAssignDialog) แต่คนที่ทำงานนี้จริงยืนอยู่
   หน้ากองของโดยมีแค่มือถือในมือ กล่องบนมือถือเหลือความสูงให้รายการไม่ถึงครึ่งจอ
   ทั้งที่รายการคือสิ่งที่ต้องกวาดตาหามากที่สุดในงานนี้ จอแคบจึงมาเป็นหน้าของตัวเอง
   เห็นเลขที่กับโซนของแต่ละชิ้นเต็ม ๆ

   เข้ามาได้จากปุ่ม "เลือกโซนรับเข้า" ในหน้าใบรับเข้า และเปิดตรงจากลิงก์ได้ด้วย
   เพราะอ่านใบจาก id ในที่อยู่เอง ไม่ได้รอรับของจากหน้าก่อนหน้า
------------------------------------------------------------------ */

export default function ZoneAssignPage() {
  const params = useParams<{ id: string }>();
  const receipt = React.useMemo(
    () => getInboundReceipt(params.id),
    [params.id]
  );

  if (!receipt) return <NotFound />;
  return <ZoneSheet key={receipt.doc.id} receipt={receipt} />;
}

function ZoneSheet({ receipt }: { receipt: InboundReceipt }) {
  const router = useRouter();
  const { doc } = receipt;
  const pieces = livePieces(receipt.pieces);
  const state = useZoneAssign(pieces);

  const save = () => {
    if (!state.zone || state.picked.size === 0) return;
    const ids = [...state.picked];
    // เก็บลงที่ที่หน้าใบรับเข้าอ่านเจอ ไม่ใช่ state ของหน้านี้ที่ตายตอนออกจากหน้า
    setPieceZones(ids, state.zone);
    toast.success(`เลือกโซน ${state.zone} แล้ว`, {
      description: `${ids.length} ชิ้น`,
    });
    router.push(`/stock/inbound/${doc.id}`);
  };

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col">
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pt-6 pb-6 sm:px-6">
        <Crumbs docId={doc.id} />

        <h1 className="mt-4 text-2xl font-semibold tracking-tight">
          เลือกโซนรับเข้า
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          เลือกโซนแล้วสแกนเลขที่ติดบนสินค้าหรือเลือกจากรายการ
        </p>

        <div className="mt-5">
          {/* รายการยังเลื่อนอยู่ในกรอบของตัวเอง ไม่ปล่อยยาวไปตามหน้า
              ห้าสิบชิ้นเรียงลงไปทั้งหน้าแปลว่าต้องเลื่อนผ่านมันทุกครั้งที่จะกลับ
              ไปแก้โซนข้างบน */}
          <ZoneAssignFields state={state} listClassName="max-h-[55svh]" />
        </div>
      </main>

      {/* ---------- แถบล่าง ----------
           ผลสแกนอยู่เหนือปุ่มบันทึก เห็นพร้อมกันว่าเพิ่งได้ชิ้นไหนมาและกำลังจะบันทึก */}
      <div className="sticky bottom-0 z-30 border-t border-border bg-surface">
        <div className="mx-auto w-full max-w-3xl px-4 py-3 sm:px-6">
          <ZoneScanResult state={state} />
          <div className="mt-3 grid grid-cols-2 gap-3 first:mt-0">
            <Button variant="outline-primary" onClick={() => router.back()}>
              ย้อนกลับ
            </Button>
            <Button disabled={!state.canSubmit} onClick={save}>
              บันทึก
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function NotFound() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 pt-6 pb-24 sm:px-6">
      <Crumbs />
      <div className="mt-10 rounded-xl border border-dashed border-border px-6 py-14 text-center">
        <p className="font-medium">ไม่พบใบรับเข้านี้</p>
        <p className="mt-1 text-sm text-muted-foreground">
          เอกสารอาจถูกลบหรือลิงก์ไม่ถูกต้อง
        </p>
        <Button asChild variant="outline-primary" className="mt-4">
          <Link href="/stock">กลับไปหน้าสต็อกทั่วไป</Link>
        </Button>
      </div>
    </main>
  );
}

function Crumbs({ docId }: { docId?: string }) {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/">ระบบ</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink href="/stock">สต็อกทั่วไป</BreadcrumbLink>
        </BreadcrumbItem>
        {docId && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href={`/stock/inbound/${docId}`}>
                ใบรับเข้าสต็อกทั่วไป
              </BreadcrumbLink>
            </BreadcrumbItem>
          </>
        )}
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage className="text-primary">
            เลือกโซนรับเข้า
          </BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
