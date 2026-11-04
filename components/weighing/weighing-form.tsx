"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { MinusIcon, PlusIcon } from "lucide-react";
import { Button } from "@peckey954/ui/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@peckey954/ui/components/ui/input-group";
import { Input } from "@peckey954/ui/components/ui/input";
import { Label } from "@peckey954/ui/components/ui/label";
import { Textarea } from "@peckey954/ui/components/ui/textarea";
import { cn } from "@peckey954/ui/lib/utils";
import { toast } from "sonner";
import { FileUpload, toViewerFiles, useDocUpload } from "@/components/file-upload";
import { useFileViewer } from "@/components/file-viewer-provider";
import { useNumberField } from "@/components/number-field";
import { TimeField, toHHMM } from "@/components/time-field";
import {
  SectionHeading,
  toDocFiles,
  toFileRefs,
  WeighingCrumbs,
  WeighingHeader,
} from "@/components/weighing/weighing-parts";
import { formatTon, netKg, WEIGHING_CURRENT_USER, type WeighingDoc } from "@/lib/weighing";
import { saveWeighing } from "@/lib/weighing-store";

/* ------------------------------------------------------------------
   ฟอร์มใบชั่งน้ำหนัก — กดใบรอชั่งจากรายการ (หรือปุ่มชั่งน้ำหนัก) แล้วมาหน้านี้
   กรอกได้เลย ไม่มีชั้นกลาง (ตามแบบ) ใช้ทั้งชั่งครั้งแรก (mode="create") และ
   แก้ไขใบที่ชั่งแล้วภายในสามวัน (mode="edit")

   กรอกน้ำหนักเป็น กก. ตามตาชั่งจริง โชว์ค่าแปลงเป็นตันข้างป้ายช่อง (ตามโน้ต
   "น้ำหนักต้องแปลงเป็นตัน") กล่องส้มบนหัวใบคำนวณสดจากช่องที่กรอกอยู่
   เวลาเข้า/ออกตั้งต้นเป็นเวลาปัจจุบัน แต่เลื่อนเปลี่ยนได้

   รับเข้า: ชั่งเข้ารถพร้อมสินค้า / ชั่งออกรถเปล่า / น้ำหนักตามผู้ขาย + เอกสาร
   ของพาริชและของผู้ขาย — จ่ายออก: ชั่งเข้ารถเปล่า / ชั่งออกรถพร้อมสินค้า
   เอกสารของพาริชอย่างเดียว (ไม่มีใบชั่งผู้ขาย)
------------------------------------------------------------------ */

export function WeighingForm({ doc, mode }: { doc: WeighingDoc; mode: "create" | "edit" }) {
  const router = useRouter();
  const inbound = doc.kind === "inbound";
  const rec = doc.record;

  const [inKg, setInKg] = React.useState(rec?.inKg ?? 0);
  const [inAt, setInAt] = React.useState(rec?.inAt ?? "");
  const [outKg, setOutKg] = React.useState(rec?.outKg ?? 0);
  const [outAt, setOutAt] = React.useState(rec?.outAt ?? "");
  const [sellerKg, setSellerKg] = React.useState(rec?.sellerKg ?? 0);
  const [note, setNote] = React.useState(rec?.note ?? "");
  const [phone, setPhone] = React.useState(rec?.phone ?? "");
  const [address, setAddress] = React.useState(rec?.address ?? "");

  // เวลาเข้า/ออกตั้งต้นเป็นเวลาปัจจุบัน — อ่านหลัง mount เท่านั้น กัน hydration
  // ไม่ตรงกันระหว่างเซิร์ฟเวอร์กับเครื่อง ไม่ทับค่าที่มีอยู่แล้ว (ร่าง/แก้ไข)
  React.useEffect(() => {
    const now = toHHMM(new Date());
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setInAt((prev) => prev || now);
    setOutAt((prev) => prev || now);
  }, []);

  const parichDocs = useDocUpload(toDocFiles(rec?.parichFiles));
  const sellerDocs = useDocUpload(toDocFiles(rec?.sellerFiles));
  const idCardDocs = useDocUpload(toDocFiles(rec?.idCardFiles));
  const { openViewer } = useFileViewer();
  const viewerFiles = [
    ...toViewerFiles(parichDocs.files, "เอกสารชั่งน้ำหนักของพาริช"),
    ...(inbound ? toViewerFiles(sellerDocs.files, "เอกสารชั่งน้ำหนักของผู้ขาย") : []),
    ...toViewerFiles(idCardDocs.files, "เอกสารสำเนาบัตรประชาชนคนขับ"),
  ];
  const open = (id: string) => openViewer(viewerFiles, id);

  const netTon = netKg(doc.kind, inKg, outKg) / 1000;
  const sellerTon = inbound ? sellerKg / 1000 : 0;

  function handleSave(asDraft: boolean) {
    if (!asDraft) {
      if (inKg <= 0 || outKg <= 0) {
        toast.error("กรุณากรอกน้ำหนักชั่งเข้าและชั่งออก");
        return;
      }
      if (inbound ? inKg <= outKg : outKg <= inKg) {
        toast.error(
          inbound
            ? "น้ำหนักชั่งเข้า (รถพร้อมสินค้า) ต้องมากกว่าชั่งออก (รถเปล่า)"
            : "น้ำหนักชั่งออก (รถพร้อมสินค้า) ต้องมากกว่าชั่งเข้า (รถเปล่า)"
        );
        return;
      }
      if (parichDocs.uploading || sellerDocs.uploading || idCardDocs.uploading) {
        toast.error("เอกสารยังอัปโหลดไม่เสร็จ");
        return;
      }
    }

    saveWeighing(doc.id, asDraft ? "draft" : "weighed", {
      inKg,
      inAt,
      outKg,
      outAt,
      sellerKg: inbound ? sellerKg : undefined,
      note: note.trim() || undefined,
      phone: phone.trim() || undefined,
      address: address.trim() || undefined,
      parichFiles: toFileRefs(parichDocs.files),
      sellerFiles: inbound ? toFileRefs(sellerDocs.files) : [],
      idCardFiles: toFileRefs(idCardDocs.files),
      weigher: rec?.weigher ?? WEIGHING_CURRENT_USER,
      editor: mode === "edit" ? WEIGHING_CURRENT_USER : rec?.editor,
    });

    const description = `เลขที่ใบชั่งน้ำหนัก: ${doc.code}`;
    if (asDraft) {
      toast.success("บันทึกร่างการชั่งน้ำหนักสำเร็จ", { description });
      return;
    }
    toast.success(mode === "edit" ? "แก้ไขใบชั่งน้ำหนักสำเร็จ" : "ชั่งน้ำหนักสำเร็จ", { description });
    // บันทึกแล้วกลับหน้ารายการ (ตามแบบ) — แก้ไขกลับแท็บชั่งแล้ว ชั่งครั้งแรก
    // กลับแท็บรอชั่ง ทำใบถัดไปต่อได้เลย
    router.push(mode === "edit" ? "/weighing?tab=weighed" : "/weighing");
  }

  return (
    <>
      <main className="@container mx-auto w-full max-w-6xl px-4 pt-6 pb-24 sm:px-6">
        <WeighingCrumbs />
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          {mode === "edit" ? "แก้ไขใบชั่งน้ำหนัก" : "ใบชั่งน้ำหนัก"}{" "}
          <span className="block @lg:inline">{doc.code}</span>
        </h1>

        <WeighingHeader doc={doc} netTon={netTon} sellerTon={sellerTon} />

        <SectionHeading
          index={1}
          title="ข้อมูลสินค้า"
          subtitle="ข้อมูลสินค้า น้ำหนัก และเอกสารการชั่งน้ำหนัก"
        />

        {/* น้ำหนักกับเวลาอยู่คู่กันแถวเดียว (ตามแบบ) — ชั่งเข้าคู่เวลาเข้า
            ชั่งออกคู่เวลาออก จอแคบเรียงลงทีละช่อง */}
        <div className="mt-4 grid gap-4 @2xl:grid-cols-2">
          <div className="space-y-1.5">
            <WeightLabel htmlFor="in-kg" kg={inKg}>
              {inbound ? "ชั่งเข้ารถพร้อมสินค้า (กก.)" : "ชั่งเข้ารถเปล่า (กก.)"}
            </WeightLabel>
            <WeightStepper id="in-kg" value={inKg} onValueChange={setInKg} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="in-at">เวลาเข้า</Label>
            <TimeField id="in-at" value={inAt} onValueChange={setInAt} />
          </div>
          <div className="space-y-1.5">
            <WeightLabel htmlFor="out-kg" kg={outKg}>
              {inbound ? "ชั่งออกรถเปล่า (กก.)" : "ชั่งออกรถพร้อมสินค้า (กก.)"}
            </WeightLabel>
            <WeightStepper id="out-kg" value={outKg} onValueChange={setOutKg} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="out-at">เวลาออก</Label>
            <TimeField id="out-at" value={outAt} onValueChange={setOutAt} />
          </div>
          {inbound && (
            <div className="space-y-1.5">
              <WeightLabel htmlFor="seller-kg" kg={sellerKg}>
                น้ำหนักสินค้าตามผู้ขาย (กก.)
              </WeightLabel>
              <WeightStepper id="seller-kg" value={sellerKg} onValueChange={setSellerKg} />
            </div>
          )}
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

        <div className="mt-6 space-y-6">
          <FileUpload
            title="เอกสารชั่งน้ำหนักของพาริช"
            dropLabel="อัปโหลด / ลากไฟล์ใบชั่งน้ำหนักของพาริช"
            files={parichDocs.files}
            onAdd={parichDocs.add}
            onRemove={parichDocs.remove}
            onRetry={parichDocs.retry}
            onOpen={open}
          />
          {inbound && (
            <FileUpload
              title="เอกสารชั่งน้ำหนักของผู้ขาย"
              dropLabel="อัปโหลด / ลากไฟล์ใบชั่งน้ำหนักของผู้ขาย"
              files={sellerDocs.files}
              onAdd={sellerDocs.add}
              onRemove={sellerDocs.remove}
              onRetry={sellerDocs.retry}
              onOpen={open}
            />
          )}
        </div>

        <SectionHeading
          index={2}
          title="ข้อมูลทะเบียนรถ"
          subtitle="ข้อมูลสำเนาบัตรประชาชนคนขับรถ"
          className="mt-8"
        />

        <div className="mt-4 grid gap-4 @2xl:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="phone">
              เบอร์โทรศัพท์ <span className="font-normal text-muted-foreground">(ไม่บังคับ)</span>
            </Label>
            <Input
              id="phone"
              inputMode="tel"
              className="bg-card"
              placeholder="ระบุเบอร์โทรศัพท์"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="address">
              ที่อยู่ <span className="font-normal text-muted-foreground">(ไม่บังคับ)</span>
            </Label>
            <Input
              id="address"
              className="bg-card"
              placeholder="ระบุที่อยู่"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>
        </div>

        <div className="mt-6">
          <FileUpload
            title="เอกสารสำเนาบัตรประชาชนคนขับ"
            dropLabel="อัปโหลด / ลากไฟล์สำเนาบัตรประชาชนคนขับ"
            files={idCardDocs.files}
            onAdd={idCardDocs.add}
            onRemove={idCardDocs.remove}
            onRetry={idCardDocs.retry}
            onOpen={open}
          />
        </div>
      </main>

      {/* บันทึกร่างไม่ตรวจอะไร — รถยังไม่ออกก็ยังไม่มีน้ำหนักชั่งออก ต้องเก็บงาน
          ค้างไว้กลางทางได้ ใบที่ชั่งแล้ว (แก้ไข) ไม่มีร่าง บันทึกทับได้อย่างเดียว */}
      <div className="sticky bottom-0 z-30 border-t border-border bg-surface">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-8 py-3">
          <Button variant="outline-primary" onClick={() => router.back()}>
            ย้อนกลับ
          </Button>
          <div className="flex items-center gap-3">
            {mode === "create" && (
              <Button variant="outline-primary" onClick={() => handleSave(true)}>
                บันทึกร่าง
              </Button>
            )}
            <Button onClick={() => handleSave(false)}>บันทึก</Button>
          </div>
        </div>
      </div>
    </>
  );
}

/** ป้ายช่องน้ำหนัก (กก.) + ค่าแปลงเป็นตันชิดขวา — ยังไม่มีค่าซ่อนแบบกันที่ไว้
 *  (invisible) ไม่งั้นพอเริ่มพิมพ์แล้วแถวสูงขึ้น เนื้อหาด้านล่างขยับ */
function WeightLabel({
  htmlFor,
  kg,
  children,
}: {
  htmlFor: string;
  kg: number;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <Label htmlFor={htmlFor}>{children}</Label>
      <span className={cn("text-sm leading-none font-medium tabular-nums", kg <= 0 && "invisible")}>
        {formatTon(kg / 1000)} ตัน
      </span>
    </div>
  );
}

/** กรอกน้ำหนักเป็น กก. ขั้นละ 10 กก. ตามความละเอียดจริงของตาชั่งรถบรรทุก */
function WeightStepper({
  id,
  value,
  onValueChange,
}: {
  id: string;
  value: number;
  onValueChange: (next: number) => void;
}) {
  const field = useNumberField(value, onValueChange, 2);
  const step = (delta: number) => onValueChange(Math.max(0, value + delta));
  return (
    <InputGroup className="bg-card">
      <InputGroupAddon align="inline-start">
        <InputGroupButton size="icon-xs" aria-label="ลดน้ำหนัก" onClick={() => step(-10)}>
          <MinusIcon />
        </InputGroupButton>
      </InputGroupAddon>
      <InputGroupInput {...field} id={id} className="text-center" />
      <InputGroupAddon align="inline-end">
        <InputGroupButton size="icon-xs" aria-label="เพิ่มน้ำหนัก" onClick={() => step(10)}>
          <PlusIcon />
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  );
}
