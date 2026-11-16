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
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@peckey954/ui/components/ui/table";
import { cn } from "@peckey954/ui/lib/utils";
import {
  formatPoBaht,
  formatPoQty,
  lineItemFailedQty,
  lineItemPendingQty,
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
   รวมทุกตัวเลข (สั่งซื้อ/ตัดขายส่ง/ไม่ผ่าน/เข้าคลัง/ราคา) ของรายการนี้ — ยอดรวม
   จากทุกใบขอซื้อที่รวมมา — แล้วตามด้วยใบขอซื้อ (PR) ต้นทาง
     ใบเดียว   ช่องข้อมูลใบขอซื้อต่อท้ายราคา ตาม Figma
     หลายใบ    หัว modal บอกเลขทุกใบ แล้วตารางใบละแถวพร้อมยอดรวมท้าย modal

   ใช้ state ควบคุมจากภายนอก (open/onOpenChange) ตามแบบ CostRowModal
   (components/production/cost-row-modal.tsx) — item เป็น null ได้ตอนปิดอยู่

   โครงสร้างก็เอาแบบเดียวกับ CostRowModal ด้วย — max-h + flex flex-col ให้หัว/
   ท้าย modal ปักอยู่กับที่ตลอด มีแค่ล็อคกลาง (ราคา+ข้อมูลอ้างอิง) ที่เลื่อนเอง
   ถ้าเนื้อหายาวเกินจอ (เดิมปล่อยให้ทั้งกล่อง modal เป็นก้อนเดียวแล้วให้ CSS
   จำลองอุปกรณ์ (globals.css, data-device-frame) บีบขนาด+เลื่อนทั้งกล่องแทน —
   หัว/ท้ายเลื่อนหายไปด้วยเวลาเนื้อหายาว ดูลอยแปลกๆ) กล่องตัวเลขหลัก (สั่งซื้อ/ตัดขายส่ง/
   ไม่ผ่าน/เข้าคลัง) ปักไว้นอกล็อคเลื่อนเช่นกัน เห็นตลอดเวลาเลื่อนดู
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
  const pending = lineItemPendingQty(item);
  const failed = lineItemFailedQty(item);
  const stocked = lineItemStockedQty(item);
  // ส่วนต่างน้ำหนักชั่ง vs ตามผู้ขาย — มีค่าเฉพาะรายการที่เริ่มรับเข้าไปแล้ว
  // (ดู lineItemStarted ใน lib/po.ts ตอนสร้างข้อมูลตัวอย่าง)
  const weighDiff =
    item.weighedKg != null && item.sellerWeightKg != null
      ? item.weighedKg - item.sellerWeightKg
      : undefined;
  const multi = item.prs.length > 1;
  const single = multi ? undefined : item.prs[0];
  const weighDiffPercent =
    weighDiff != null && item.sellerWeightKg
      ? (weighDiff / item.sellerWeightKg) * 100
      : undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] flex-col sm:max-w-2xl lg:max-w-5xl">
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
          {/* รวมหลายใบขอซื้อ — บอกตั้งแต่หัว modal ว่ามาจากใบไหนบ้าง รายละเอียดแต่ละใบอยู่ท้าย */}
          {multi && (
            <p className="text-sm">
              <span className="text-muted-foreground">รวมจาก {item.prs.length} ใบขอซื้อ:</span>{" "}
              <span className="font-medium">{item.prs.map((p) => p.prCode).join(", ")}</span>
            </p>
          )}
        </DialogHeader>

        {/* ---------- ตัวเลขหลักของรายการนี้ — กล่องเน้นสีแบรนด์เหมือนกล่อง
            ราคารวม/วันที่ในหัวใบด้านนอก (Stat ใน app/po/[id]/page.tsx) ปักไว้
            นอกล็อคเลื่อนด้านล่าง เห็นตลอดไม่ว่าจะเลื่อนดูรายละเอียดแค่ไหน ---------- */}
        {/* ตาม Figma: สั่งซื้อ / ตัดขายส่ง / ไม่ผ่าน / เข้าคลัง — ค้างรับต่อท้ายเข้าคลัง
            (จอกว้างบรรทัดเดียวกัน จอแคบขึ้นบรรทัดใหม่) ยอดรับเข้าดิบดูได้ที่ตารางรอบการรับสินค้า */}
        <div className="grid grid-cols-2 gap-4 rounded-lg bg-brand p-4 sm:grid-cols-4">
          <Stat label="สั่งซื้อ" value={`${formatPoQty(item.orderedQty)} ${item.unit}`} />
          <Stat
            label="ตัดขายส่ง"
            value={item.wholesaleQty ? `${formatPoQty(item.wholesaleQty)} ${item.unit}` : "-"}
          />
          <Stat
            label="ไม่ผ่าน"
            value={failed > 0 ? `- ${formatPoQty(failed)} ${item.unit}` : "-"}
          />
          <div>
            <p className="text-sm text-muted-foreground">เข้าคลัง</p>
            <p className="mt-1 flex flex-wrap items-baseline gap-x-2">
              <span className="font-semibold tabular-nums">
                {formatPoQty(stocked)} {item.unit}
              </span>
              {!cancelled && pending > 0 && (
                <span className="basis-full text-sm font-medium text-danger-strong tabular-nums sm:basis-auto">
                  ค้างรับ {formatPoQty(pending)}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* ---------- ราคา + ข้อมูลอ้างอิงจากใบขอซื้อต้นทาง — ล็อคเดียวที่เลื่อน
            ได้ ถ้ายาวเกินจอ หัว/กล่องตัวเลขด้านบนกับปุ่มด้านล่างยังปักอยู่ที่เดิม
            (-mx-6 px-6 ชดเชย padding ของ DialogContent เอง กันแถบเลื่อนไปโผล่
            ทับขอบขวาของเนื้อหา เหมือนกับ CostRowModal) ---------- */}
        <div className="-mx-6 overflow-y-auto px-6">
          <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
            {/* น้ำหนักตามผู้ขาย/ส่วนต่าง (เทียบน้ำหนักชั่ง) ตาม Figma — น้ำหนักชั่งเองดูที่
                ตาราง "รายการสินค้า" มีค่าเฉพาะรายการที่เริ่มรับเข้าไปแล้ว ยังไม่เริ่มโชว์ "-" */}
            <Field
              label="น้ำหนักตามผู้ขาย"
              value={item.sellerWeightKg != null ? `${formatPoQty(item.sellerWeightKg)} กก.` : "-"}
            />
            <div>
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
            {/* ใบขอซื้อใบเดียว — ช่องข้อมูลต่อท้ายราคาแบบเดียวกับ Figma */}
            {single && (
              <>
                <Field label="เลขที่ใบขอซื้อ" value={single.prCode} />
                <Field label="ขอซื้อ" value={`${formatPoQty(single.requestedQty)} ${item.unit}`} />
              </>
            )}
            <div>
              <Field
                label={multi ? "วันที่ต้องการ (เร็วสุด)" : "วันที่ต้องการสินค้า"}
                value={item.neededDate}
              />
              {item.urgent && (
                <div className="mt-1">
                  <UrgentChip />
                </div>
              )}
            </div>
            {single && (
              <>
                <Field label="ผู้ขอซื้อ" value={single.requester} />
                <Field label="ผู้แก้ไขขอซื้อล่าสุด" value={single.editedBy ?? "-"} />
                <Field label="เหตุผลการซื้อ" value={PR_REASON_LABEL[single.reason]} />
                <Field
                  className="col-span-full"
                  label="เหตุผลเปลี่ยนข้อมูลสั่งซื้อ"
                  value={single.changeReason ?? "-"}
                />
              </>
            )}
          </div>

          {/* ---------- หลายใบขอซื้อ — ใบละแถว ยอดสั่งซื้อรวมทุกใบ = สั่งซื้อในกล่องด้านบน
              จอกว้างเป็นตาราง จอแคบเป็นการ์ดใบละใบ ---------- */}
          {multi && (
            <section className="mt-5 pb-1">
              <h3 className="text-sm font-semibold">
                ใบขอซื้อที่รวมมา <span className="font-normal">({item.prs.length} ใบ)</span>
              </h3>

              <div className="mt-2 hidden overflow-hidden rounded-lg border border-border sm:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>เลขที่ใบขอซื้อ</TableHead>
                      <TableHead className="text-right">ขอซื้อ</TableHead>
                      <TableHead className="text-right">สั่งซื้อ</TableHead>
                      <TableHead>วันที่ต้องการ</TableHead>
                      <TableHead>ผู้ขอซื้อ</TableHead>
                      <TableHead>เหตุผลการซื้อ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {item.prs.map((pr) => (
                      <TableRow key={pr.prCode} className="align-top">
                        <TableCell className="whitespace-nowrap">
                          <span className="font-medium">{pr.prCode}</span>
                          {pr.urgent && (
                            <span className="ml-1.5">
                              <UrgentChip />
                            </span>
                          )}
                          {/* แก้ไขหลังส่งคำขอ — ใครแก้ และทำไมสั่งต่างจากที่ขอ */}
                          {pr.editedBy && (
                            <span className="mt-1 block max-w-56 text-xs whitespace-normal text-muted-foreground">
                              แก้ไขโดย {pr.editedBy}
                              {pr.changeReason && ` · ${pr.changeReason}`}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap tabular-nums">
                          {formatPoQty(pr.requestedQty)}
                        </TableCell>
                        <TableCell
                          className={cn(
                            "text-right whitespace-nowrap tabular-nums",
                            pr.orderedQty !== pr.requestedQty && "font-semibold"
                          )}
                        >
                          {formatPoQty(pr.orderedQty)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">{pr.neededDate}</TableCell>
                        <TableCell className="whitespace-nowrap">{pr.requester}</TableCell>
                        <TableCell className="whitespace-nowrap">{PR_REASON_LABEL[pr.reason]}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell className="font-semibold">รวม ({item.unit})</TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">
                        {formatPoQty(item.prs.reduce((sum, p) => sum + p.requestedQty, 0))}
                      </TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">
                        {formatPoQty(item.orderedQty)}
                      </TableCell>
                      <TableCell colSpan={3} />
                    </TableRow>
                  </TableFooter>
                </Table>
              </div>

              <ul className="mt-2 space-y-2 sm:hidden">
                {item.prs.map((pr) => (
                  <li key={pr.prCode} className="rounded-lg border border-border p-3 text-sm">
                    <p className="flex flex-wrap items-center gap-2 font-semibold">
                      {pr.prCode}
                      {pr.urgent && <UrgentChip />}
                    </p>
                    <div className="mt-2 grid grid-cols-2 gap-3">
                      <Field label="ขอซื้อ" value={`${formatPoQty(pr.requestedQty)} ${item.unit}`} />
                      <Field label="สั่งซื้อ" value={`${formatPoQty(pr.orderedQty)} ${item.unit}`} />
                      <Field label="วันที่ต้องการสินค้า" value={pr.neededDate} />
                      <Field label="ผู้ขอซื้อ" value={pr.requester} />
                      <Field label="เหตุผลการซื้อ" value={PR_REASON_LABEL[pr.reason]} />
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
            </section>
          )}
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
