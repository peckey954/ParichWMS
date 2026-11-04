"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { CircleXIcon, PencilIcon } from "lucide-react";
import { Button } from "@peckey954/ui/components/ui/button";
import { FileCards, toViewerFiles } from "@/components/file-upload";
import { useFileViewer } from "@/components/file-viewer-provider";
import { WeighingForm } from "@/components/weighing/weighing-form";
import {
  MetaField,
  SectionHeading,
  toDocFiles,
  WeighingCrumbs,
  WeighingHeader,
} from "@/components/weighing/weighing-parts";
import {
  canEditWeighing,
  canWeigh,
  formatTon,
  WEIGHING_EDIT_DAYS,
  weighingNetTon,
  type WeighingDoc,
} from "@/lib/weighing";
import { useWeighingDoc } from "@/lib/weighing-store";

/* ------------------------------------------------------------------
   ใบชั่งน้ำหนัก — หน้าเดียวสองโหมดตามสถานะ (ตามแบบ)
     รอชั่ง → ฟอร์มกรอกเลย (WeighingForm) กดจากรายการแล้วชั่งได้ทันที
     ชั่งแล้ว/ยกเลิก/ใบสั่งซื้อปิดแล้ว → ดูอย่างเดียว
       ชั่งแล้วภายใน WEIGHING_EDIT_DAYS วันและใบสั่งซื้อยังไม่ปิด มีปุ่มดินสอ
       มุมขวาบนไปหน้าแก้ไข พ้นกำหนด/ปิดใบแล้วไม่มีปุ่ม
       ยกเลิกโดยแอดมิน ขึ้นกล่องแดงพร้อมเหตุผลและผู้ยกเลิก
------------------------------------------------------------------ */

export default function WeighingSlipPage() {
  const params = useParams<{ id: string }>();
  const doc = useWeighingDoc(params.id);

  if (!doc) {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 pt-6 pb-24 sm:px-6">
        <WeighingCrumbs />
        <div className="mt-10 rounded-xl border border-dashed border-border px-6 py-14 text-center">
          <p className="font-medium">ไม่พบใบชั่งน้ำหนักนี้</p>
          <p className="mt-1 text-sm text-muted-foreground">เอกสารอาจถูกลบหรือลิงก์ไม่ถูกต้อง</p>
          <Button asChild variant="outline-primary" className="mt-4">
            <Link href="/weighing">กลับไปหน้าชั่งน้ำหนัก</Link>
          </Button>
        </div>
      </main>
    );
  }

  if (canWeigh(doc)) return <WeighingForm key={doc.id} doc={doc} mode="create" />;
  return <WeighingView doc={doc} />;
}

function WeighingView({ doc }: { doc: WeighingDoc }) {
  const router = useRouter();
  const { openViewer } = useFileViewer();
  const inbound = doc.kind === "inbound";
  const rec = doc.record;
  const cancelled = doc.status === "cancelled";

  const parich = toDocFiles(rec?.parichFiles);
  const seller = toDocFiles(rec?.sellerFiles);
  const idCard = toDocFiles(rec?.idCardFiles);
  const viewerFiles = [
    ...toViewerFiles(parich, "เอกสารชั่งน้ำหนักของพาริช"),
    ...toViewerFiles(seller, "เอกสารชั่งน้ำหนักของผู้ขาย"),
    ...toViewerFiles(idCard, "เอกสารสำเนาบัตรประชาชนคนขับ"),
  ];
  const open = (id: string) => openViewer(viewerFiles, id);

  const netTon = weighingNetTon(doc) ?? 0;
  const sellerTon = (rec?.sellerKg ?? 0) / 1000;
  const kg = (v?: number, at?: string) =>
    v ? (
      <>
        {formatTon(v)} <span className="ml-1 font-normal text-muted-foreground">{at}</span>
      </>
    ) : (
      "-"
    );

  return (
    <>
      <main className="@container mx-auto w-full max-w-6xl px-4 pt-6 pb-24 sm:px-6">
        <WeighingCrumbs />

        <div className="mt-2 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight">
              ใบชั่งน้ำหนัก <span className="block @lg:inline">{doc.code}</span>
            </h1>
            <p className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              {doc.createdAt}
              {cancelled && (
                <span className="rounded-full bg-[var(--chip-red)] px-2.5 py-0.5 text-xs font-semibold text-[var(--chip-red-foreground)]">
                  ยกเลิก
                </span>
              )}
            </p>
          </div>
          {canEditWeighing(doc) && (
            <Button asChild variant="outline" size="icon" className="shrink-0">
              <Link
                href={`/weighing/${doc.id}/edit`}
                aria-label={`แก้ไขใบชั่งน้ำหนัก ${doc.code} (ภายใน ${WEIGHING_EDIT_DAYS} วันหลังชั่ง)`}
              >
                <PencilIcon />
              </Link>
            </Button>
          )}
        </div>

        {cancelled && (
          <div
            role="status"
            className="mt-4 flex gap-3 rounded-xl border border-danger-border bg-danger px-4 py-3 text-sm text-danger-strong"
          >
            <CircleXIcon className="mt-0.5 size-5 shrink-0" />
            <div>
              <p className="font-semibold">ยกเลิก</p>
              <p className="mt-0.5">เหตุผล: {doc.cancelReason ?? "-"}</p>
              <p>ผู้ยกเลิก: {doc.cancelledBy ?? "-"}</p>
            </div>
          </div>
        )}

        <WeighingHeader doc={doc} netTon={netTon} sellerTon={sellerTon} netLabel="น้ำหนักจริง (ตัน)" />

        <SectionHeading index={1} title="ข้อมูลสินค้า" subtitle="ข้อมูลสินค้า น้ำหนัก และเอกสารการชั่งน้ำหนัก" />
        <div className={inbound ? "mt-4 grid grid-cols-2 gap-4 @2xl:grid-cols-4" : "mt-4 grid grid-cols-2 gap-4 @2xl:grid-cols-3"}>
          <MetaField
            label={inbound ? "ชั่งเข้ารถพร้อมสินค้า (กก.)" : "ชั่งเข้ารถเปล่า (กก.)"}
            value={kg(rec?.inKg, rec?.inAt)}
          />
          <MetaField
            label={inbound ? "ชั่งออกรถเปล่า (กก.)" : "ชั่งออกรถพร้อมสินค้า (กก.)"}
            value={kg(rec?.outKg, rec?.outAt)}
          />
          {inbound && <MetaField label="น้ำหนักสินค้าตามผู้ขาย (กก.)" value={kg(rec?.sellerKg)} />}
          <MetaField label="หมายเหตุ" value={rec?.note ?? "-"} />
        </div>
        <div className="mt-6 space-y-6">
          <FileCards title="เอกสารชั่งน้ำหนักของพาริช" files={parich} onOpen={open} />
          {inbound && <FileCards title="เอกสารชั่งน้ำหนักของผู้ขาย" files={seller} onOpen={open} />}
        </div>

        <SectionHeading index={2} title="ข้อมูลทะเบียนรถ" subtitle="ข้อมูลสำเนาบัตรประชาชนคนขับรถ" className="mt-8" />
        <div className="mt-4 grid grid-cols-2 gap-4">
          <MetaField label="เบอร์โทรศัพท์" value={rec?.phone ?? "-"} />
          <MetaField label="ที่อยู่" value={rec?.address ?? "-"} />
        </div>
        <div className="mt-6">
          <FileCards title="เอกสารสำเนาบัตรประชาชนคนขับ" files={idCard} onOpen={open} />
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4 @2xl:grid-cols-4">
          <MetaField label="ผู้ชั่งน้ำหนัก" value={rec?.weigher ?? "-"} />
          <MetaField label="ผู้แก้ไขชั่งน้ำหนักล่าสุด" value={rec?.editor ?? "-"} />
        </div>
      </main>

      <div className="sticky bottom-0 z-30 border-t border-border bg-surface">
        <div className="mx-auto flex w-full max-w-6xl items-center px-8 py-3">
          <Button variant="outline-primary" onClick={() => router.back()}>
            ย้อนกลับ
          </Button>
        </div>
      </div>
    </>
  );
}
