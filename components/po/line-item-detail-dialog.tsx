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
   รวมทุกตัวเลข (สั่งซื้อ/รับเข้า/ไม่ผ่าน/เข้าคลัง/ราคา) ของรายการนี้ — ยอดรวม
   จากทุกใบขอซื้อที่รวมมา — แล้วตามด้วยรายการใบขอซื้อ (PR) ต้นทางทีละใบ

   ใช้ state ควบคุมจากภายนอก (open/onOpenChange) ตามแบบ CostRowModal
   (components/production/cost-row-modal.tsx) — item เป็น null ได้ตอนปิดอยู่

   โครงสร้างก็เอาแบบเดียวกับ CostRowModal ด้วย — max-h + flex flex-col ให้หัว/
   ท้าย modal ปักอยู่กับที่ตลอด มีแค่ล็อคกลาง (ราคา+ข้อมูลอ้างอิง) ที่เลื่อนเอง
   ถ้าเนื้อหายาวเกินจอ (เดิมปล่อยให้ทั้งกล่อง modal เป็นก้อนเดียวแล้วให้ CSS
   จำลองอุปกรณ์ (globals.css, data-device-frame) บีบขนาด+เลื่อนทั้งกล่องแทน —
   หัว/ท้ายเลื่อนหายไปด้วยเวลาเนื้อหายาว ดูลอยแปลกๆ) กล่องตัวเลขหลัก (สั่งซื้อ/
   รับเข้า/ไม่ผ่าน/เข้าคลัง) ปักไว้นอกล็อคเลื่อนเช่นกัน เห็นตลอดเวลาเลื่อนดู
   รายละเอียดด้านล่าง เหมือนกล่องราคารวมของหน้าใบอนุมัติ (app/approve/[id]/page.tsx)
------------------------------------------------------------------ */

// เขียนคลาสเต็มทุกตัว ห้ามประกอบชื่อด้วย template string
const URGENT_CHIP =
  "[--bdg-surface:var(--chip-orange)] [--bdg-text:var(--chip-orange-foreground)]";
const WEIGH_DIFF_CHIP = {
  loss: "[--bdg-surface:var(--chip-red)] [--bdg-text:var(--chip-red-foreground)]",
  gain: "[--bdg-surface:var(--chip-green)] [--bdg-text:var(--chip-green-foreground)]",
};

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
  // ส่วนต่างน้ำหนักชั่ง vs ตามผู้ขาย — มีค่าเฉพาะรายการที่เริ่มรับเข้าไปแล้ว
  // (ดู lineItemStarted ใน lib/po.ts ตอนสร้างข้อมูลตัวอย่าง)
  const weighDiff =
    item.weighedKg != null && item.sellerWeightKg != null
      ? item.weighedKg - item.sellerWeightKg
      : undefined;
  const weighDiffPercent =
    weighDiff != null && item.sellerWeightKg
      ? (weighDiff / item.sellerWeightKg) * 100
      : undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] flex-col sm:max-w-2xl">
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
            นอกล็อคเลื่อนด้านล่าง เห็นตลอดไม่ว่าจะเลื่อนดูรายละเอียดแค่ไหน ---------- */}
        <div className="grid grid-cols-2 gap-4 rounded-lg bg-brand p-4 sm:grid-cols-4">
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

        {/* ---------- ราคา + ข้อมูลอ้างอิงจากใบขอซื้อต้นทาง — ล็อคเดียวที่เลื่อน
            ได้ ถ้ายาวเกินจอ หัว/กล่องตัวเลขด้านบนกับปุ่มด้านล่างยังปักอยู่ที่เดิม
            (-mx-6 px-6 ชดเชย padding ของ DialogContent เอง กันแถบเลื่อนไปโผล่
            ทับขอบขวาของเนื้อหา เหมือนกับ CostRowModal) ---------- */}
        <div className="-mx-6 overflow-y-auto px-6">
          <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
            {/* น้ำหนักชั่ง/ตามผู้ขาย/ส่วนต่าง — เหมือนคอลัมน์เดียวกันในตาราง
                "รายการสินค้า" ของหน้าใบสั่งซื้อ (app/po/[id]/page.tsx) มีค่า
                เฉพาะรายการที่เริ่มรับเข้าไปแล้ว ยังไม่เริ่มโชว์ "-" ทั้งคู่ */}
            <Field
              label="น้ำหนักชั่ง"
              value={item.weighedKg != null ? `${formatPoQty(item.weighedKg)} กก.` : "-"}
            />
            <Field
              label="น้ำหนักตามผู้ขาย"
              value={item.sellerWeightKg != null ? `${formatPoQty(item.sellerWeightKg)} กก.` : "-"}
            />
            <div className="col-span-2">
              <p className="text-muted-foreground">ส่วนต่าง</p>
              {weighDiff != null ? (
                <p className="mt-0.5 flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      "font-medium tabular-nums",
                      weighDiff < 0 && "text-danger-strong"
                    )}
                  >
                    {weighDiff > 0 ? "+" : ""}
                    {formatPoQty(weighDiff)} กก.
                  </span>
                  {weighDiffPercent != null && weighDiffPercent !== 0 && (
                    <Badge
                      appearance="soft"
                      className={cn(
                        "[--bdg-border:transparent] font-semibold",
                        WEIGH_DIFF_CHIP[weighDiff < 0 ? "loss" : "gain"]
                      )}
                    >
                      {weighDiff < 0 ? "สูญหาย" : "ได้เพิ่ม"} {Math.abs(weighDiffPercent).toFixed(2)}%
                    </Badge>
                  )}
                </p>
              ) : (
                <p className="mt-0.5 font-medium">-</p>
              )}
            </div>
            <Field label="ราคาสั่งต่อหน่วย" value={`${formatPoBaht(item.pricePerUnit)} บาท`} />
            <Field label="ค่าจัดการต่อหน่วย" value={`${formatPoBaht(item.handlingPerUnit)} บาท`} />
            <Field label="ราคารวมต่อหน่วย" value={`${formatPoBaht(lineItemUnitPrice(item))} บาท`} />
            <Field label="ราคารวมทั้งหมด" value={`${formatPoBaht(lineItemTotalPrice(item))} บาท`} />
            <div>
              <Field label="วันที่ต้องการสินค้า" value={item.neededDate} />
              {item.urgent && (
                <div className="mt-1">
                  <UrgentChip />
                </div>
              )}
            </div>
          </div>

          {/* ---------- ใบขอซื้อที่รวมมาในรายการนี้ — ใบละกล่อง ยอดด้านบนเป็นผล
              รวมของทุกใบ (สั่งซื้อรวม, วันที่เร็วสุด, เร่งด่วนถ้ามีใบไหนเร่งด่วน)
              ใบเดียวก็แสดงแบบเดียวกัน หน้าตาไม่สลับไปมา ---------- */}
          <h3 className="mt-5 text-sm font-semibold">
            ใบขอซื้อ <span className="font-normal">({item.prs.length} ใบ)</span>
          </h3>
          <ul className="mt-2 space-y-2 pb-1">
            {item.prs.map((pr) => (
              <li key={pr.prCode} className="rounded-lg border border-border p-3 text-sm">
                <p className="flex flex-wrap items-center gap-2 font-semibold">
                  {pr.prCode}
                  {pr.urgent && <UrgentChip />}
                </p>
                <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <Field label="วันที่ต้องการสินค้า" value={pr.neededDate} />
                  <Field label="ขอซื้อ" value={`${formatPoQty(pr.requestedQty)} ${item.unit}`} />
                  <Field label="สั่งซื้อ" value={`${formatPoQty(pr.orderedQty)} ${item.unit}`} />
                  <Field label="เหตุผลการซื้อ" value={PR_REASON_LABEL[pr.reason]} />
                  <Field label="ผู้ขอซื้อ" value={pr.requester} />
                  <Field label="ผู้แก้ไขขอซื้อล่าสุด" value={pr.editedBy ?? "-"} />
                  {pr.changeReason && (
                    <Field
                      className="col-span-full"
                      label="เหตุผลเปลี่ยนข้อมูลสั่งซื้อ"
                      value={pr.changeReason}
                    />
                  )}
                </div>
              </li>
            ))}
          </ul>
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
