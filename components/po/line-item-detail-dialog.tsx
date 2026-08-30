"use client";

import * as React from "react";
import { Badge } from "@peckey954/ui/components/ui/badge";
import { Button } from "@peckey954/ui/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@peckey954/ui/components/ui/dialog";
import { cn } from "@peckey954/ui/lib/utils";
import {
  formatPoBaht,
  formatPoQty,
  lineItemFailedQty,
  lineItemPendingQty,
  lineItemReceivedQty,
  lineItemStockedQty,
  lineItemTotalPrice,
  lineItemUnitPrice,
  type PoDoc,
  type PoLineItem,
} from "@/lib/po";
import { PR_CATEGORY_LABEL, PR_REASON_LABEL } from "@/lib/pr";

/* ------------------------------------------------------------------
   รายละเอียดสินค้าหนึ่งรายการในใบสั่งซื้อ — กดที่แถว/การ์ดในตาราง "รายการ
   สินค้า" ของหน้าใบสั่งซื้อ (app/po/[id]/page.tsx) แล้วเปิด modal นี้ขึ้นมา
   รวมทุกตัวเลข (สั่งซื้อ/รับเข้า/ไม่ผ่าน/เข้าคลัง/ราคา) กับข้อมูลอ้างอิงจาก
   ใบขอซื้อ (PR) ต้นทางของรายการนี้ไว้ในที่เดียว ไม่ต้องเลื่อนหาในตารางกว้างๆ

   ใช้ state ควบคุมจากภายนอก (open/onOpenChange) ตามแบบ CostRowModal
   (components/production/cost-row-modal.tsx) — item เป็น null ได้ตอนปิดอยู่

   โครงสร้างก็เอาแบบเดียวกับ CostRowModal ด้วย — max-h + flex flex-col ให้หัว/
   ท้าย modal ปักอยู่กับที่ตลอด มีแค่โซนกลาง (ราคา+ข้อมูลอ้างอิง) ที่เลื่อนเอง
   ถ้าเนื้อหายาวเกินจอ (เดิมปล่อยให้ทั้งกล่อง modal เป็นก้อนเดียวแล้วให้ CSS
   จำลองอุปกรณ์ (globals.css, data-device-frame) บีบขนาด+เลื่อนทั้งกล่องแทน —
   หัว/ท้ายเลื่อนหายไปด้วยเวลาเนื้อหายาว ดูลอยแปลกๆ) กล่องตัวเลขหลัก (สั่งซื้อ/
   รับเข้า/ไม่ผ่าน/เข้าคลัง) ปักไว้นอกโซนเลื่อนเช่นกัน เห็นตลอดเวลาเลื่อนดู
   รายละเอียดด้านล่าง เหมือนกล่องราคารวมของหน้าใบอนุมัติ (app/approve/[id]/page.tsx)
------------------------------------------------------------------ */

// เขียนคลาสเต็มทุกตัว ห้ามประกอบชื่อด้วย template string
const URGENT_CHIP =
  "[--bdg-surface:var(--chip-orange)] [--bdg-text:var(--chip-orange-foreground)]";

function UrgentChip() {
  return (
    <Badge appearance="soft" className={cn("[--bdg-border:transparent] font-semibold", URGENT_CHIP)}>
      เร่งด่วน
    </Badge>
  );
}

export function PoLineItemDetailDialog({
  po,
  item,
  open,
  onOpenChange,
}: {
  po: PoDoc;
  item: PoLineItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!item) return null;

  const cancelled = po.status === "cancelled";
  const received = lineItemReceivedQty(item);
  const pending = lineItemPendingQty(item);
  const failed = lineItemFailedQty(item);
  const stocked = lineItemStockedQty(item);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="@container flex max-h-[85vh] flex-col sm:max-w-lg">
        <DialogHeader className="text-left">
          <DialogTitle>
            {item.productName}
            {item.productSub && ` ${item.productSub}`}
          </DialogTitle>
          <DialogDescription>
            {PR_CATEGORY_LABEL[item.categoryId]} <span className="text-border" aria-hidden>|</span> {item.group}
            {item.packing && (
              <>
                {" "}
                <span className="text-border" aria-hidden>|</span> {item.packing}
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        {/* ---------- ตัวเลขหลักของรายการนี้ — กล่องเน้นสีแบรนด์เหมือนกล่อง
            ราคารวม/วันที่ในหัวใบด้านนอก (Stat ใน app/po/[id]/page.tsx) ปักไว้
            นอกโซนเลื่อนด้านล่าง เห็นตลอดไม่ว่าจะเลื่อนดูรายละเอียดแค่ไหน ---------- */}
        <div className="grid gap-4 rounded-lg bg-brand p-4 @sm:grid-cols-2">
          <Stat label="สั่งซื้อ" value={`${formatPoQty(item.orderedQty)} ${item.unit}`} />
          <div>
            <Stat label="รับเข้า" value={`${formatPoQty(received)} ${item.unit}`} />
            {!cancelled && pending > 0 && (
              <p className="mt-1 text-sm font-medium text-danger-strong">
                ค้างรับ {formatPoQty(pending)} {item.unit}
              </p>
            )}
          </div>
          <Stat
            label="ไม่ผ่าน"
            value={failed > 0 ? `- ${formatPoQty(failed)} ${item.unit}` : "-"}
          />
          <Stat label="เข้าคลัง" value={`${formatPoQty(stocked)} ${item.unit}`} />
        </div>

        {/* ---------- ราคา + ข้อมูลอ้างอิงจากใบขอซื้อต้นทาง — โซนเดียวที่เลื่อน
            ได้ ถ้ายาวเกินจอ หัว/กล่องตัวเลขด้านบนกับปุ่มด้านล่างยังปักอยู่ที่เดิม
            (-mx-6 px-6 ชดเชย padding ของ DialogContent เอง กันแถบเลื่อนไปโผล่
            ทับขอบขวาของเนื้อหา เหมือนกับ CostRowModal) ---------- */}
        <div className="-mx-6 overflow-y-auto px-6">
          <div className="grid gap-4 pb-1 text-sm @sm:grid-cols-2">
            <Field label="ราคาสั่งต่อหน่วย" value={`${formatPoBaht(item.pricePerUnit)} บาท`} />
            <Field label="ค่าจัดการต่อหน่วย" value={`${formatPoBaht(item.handlingPerUnit)} บาท`} />
            <Field label="ราคารวมต่อหน่วย" value={`${formatPoBaht(lineItemUnitPrice(item))} บาท`} />
            <Field label="ราคารวมทั้งหมด" value={`${formatPoBaht(lineItemTotalPrice(item))} บาท`} />
            <Field label="เลขที่ใบขอซื้อ" value={item.prCode} />
            <Field label="ขอซื้อ" value={`${formatPoQty(item.orderedQty)} ${item.unit}`} />
            <div>
              <Field label="วันที่ต้องการสินค้า" value={item.neededDate} />
              {item.urgent && (
                <div className="mt-1">
                  <UrgentChip />
                </div>
              )}
            </div>
            <Field label="ผู้ขอซื้อ" value={item.requester} />
            <Field label="ผู้แก้ไขขอซื้อล่าสุด" value={item.editedBy ?? "-"} />
            <Field label="เหตุผลการซื้อ" value={PR_REASON_LABEL[item.reason]} />
            <Field
              className="@sm:col-span-2"
              label="เหตุผลเปลี่ยนข้อมูลสั่งซื้อ"
              value={item.changeReason ?? "-"}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline-primary" className="w-full" onClick={() => onOpenChange(false)}>
            ย้อนกลับ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function Field({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-muted-foreground">{label}</p>
      <p className="mt-0.5 font-medium">{value}</p>
    </div>
  );
}
