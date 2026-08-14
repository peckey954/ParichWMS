"use client";

import * as React from "react";
import { TriangleAlertIcon } from "lucide-react";
import { Badge } from "@peckey954/ui/components/ui/badge";
import { Button } from "@peckey954/ui/components/ui/button";
import {
  Dialog,
  DialogClose,
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
  TableHead,
  TableHeader,
  TableRow,
} from "@peckey954/ui/components/ui/table";
import { cn } from "@peckey954/ui/lib/utils";
import {
  SUGGESTED_MATERIALS,
  SUGGEST_DATE,
  formatQty,
  isShort,
  type SuggestedMaterial,
} from "@/lib/packing-list";

/* ------------------------------------------------------------------
   แนะนำวัตถุดิบใช้ผลิตวันนี้ — ดูอย่างเดียว

   จอกว้าง — ตาราง 3 คอลัมน์ เทียบยอดในคลังกับยอดที่แนะนำข้ามแถวได้
   จอแคบ  — รายการ ชื่อขึ้นก่อน ยอดที่แนะนำเป็นตัวใหญ่ทางขวา
            ยอดในคลังลงไปเป็นบรรทัดรองใต้ชื่อ

   เหตุผลที่จอแคบไม่ใช้ตาราง — สามคอลัมน์นี้มีตัวเลขพร้อมหน่วยสองชุด
   บีบลงจอ 390px แล้วเลขจะตกบรรทัดจนอ่านไม่ออกว่าเลขไหนของคอลัมน์ไหน
   สิ่งที่คนต้องรู้จริง ๆ คือ "เบิกอะไร เท่าไร" ยอดในคลังเป็นข้อมูลประกอบ
   จึงลดชั้นลงไปได้โดยไม่เสียความหมาย

   ⚠️ container query บน DialogContent วัดจาก content box ไม่ใช่ความกว้างกล่อง
   กล่องกว้าง 672 แต่มี padding ข้างละ 24 เหลือ 624 ที่เอาไปเทียบจริง
   ใช้ @2xl (672) จึงไม่มีวันติดแม้บนจอกว้าง ต้องใช้ @xl (576)
------------------------------------------------------------------ */

export function SuggestMaterialsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const rows = SUGGESTED_MATERIALS;
  const short = rows.filter(isShort);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="@container sm:max-w-2xl">
        <DialogHeader className="text-left">
          <DialogTitle>แนะนำวัตถุดิบใช้ผลิตวันนี้</DialogTitle>
          <DialogDescription>
            {SUGGEST_DATE} · คำนวณจากใบผลิตที่ค้างอยู่ {rows.length} รายการ
          </DialogDescription>
        </DialogHeader>

        {/* ของไม่พอต้องรู้ตั้งแต่ตรงนี้ ไม่ใช่ไปรู้ตอนเบิกไม่ออกที่หน้าคลัง */}
        {short.length > 0 && (
          <p className="flex items-start gap-2 rounded-lg bg-chip-yellow p-3 text-sm">
            <TriangleAlertIcon className="mt-0.5 size-4 shrink-0" />
            <span>
              มี <span className="font-semibold">{short.length} รายการ</span>{" "}
              ที่ของในคลังน้อยกว่ายอดที่แนะนำ ต้องสั่งเพิ่มหรือปรับแผนก่อน
            </span>
          </p>
        )}

        {/* ---------- จอแคบ: รายการ ---------- */}
        <div className="max-h-[52vh] overflow-y-auto rounded-lg border border-border @xl:hidden">
          {rows.map((m, i) => (
            <MaterialRow
              key={m.id}
              material={m}
              last={i === rows.length - 1}
            />
          ))}
        </div>

        {/* ---------- จอกว้าง: ตาราง ---------- */}
        <div className="hidden max-h-[52vh] overflow-y-auto rounded-lg border border-border @xl:block">
          <Table>
            <TableHeader className="[&_th]:sticky [&_th]:top-0 [&_th]:z-10 [&_th]:bg-card">
              <TableRow>
                <TableHead>วัตถุดิบ</TableHead>
                <TableHead className="text-right whitespace-nowrap">
                  ทั้งหมดในคลัง WIP
                </TableHead>
                <TableHead className="text-right">แนะนำ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">{m.name}</TableCell>
                  <TableCell
                    className={cn(
                      "text-right whitespace-nowrap tabular-nums",
                      isShort(m) && "text-danger-strong"
                    )}
                  >
                    {formatQty(m.stock)} {m.unit}
                  </TableCell>
                  <TableCell className="text-right font-semibold whitespace-nowrap tabular-nums">
                    {formatQty(m.suggest)} {m.unit}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline-primary" className="w-full sm:w-32">
              ย้อนกลับ
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MaterialRow({
  material: m,
  last,
}: {
  material: SuggestedMaterial;
  last: boolean;
}) {
  const shortfall = isShort(m);

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-3",
        !last && "border-b border-border"
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium" title={m.name}>
          {m.name}
        </p>
        {/* ยอดในคลังเป็นข้อมูลประกอบ อยู่บรรทัดรอง แต่ถ้าไม่พอต้องสะดุดตา */}
        <p
          className={cn(
            "mt-0.5 text-sm tabular-nums",
            shortfall ? "text-danger-strong" : "text-muted-foreground"
          )}
        >
          ในคลัง {formatQty(m.stock)} {m.unit}
        </p>
      </div>

      <div className="shrink-0 text-right">
        <p className="font-semibold tabular-nums">
          {formatQty(m.suggest)}
          <span className="ml-1 text-sm font-normal text-muted-foreground">
            {m.unit}
          </span>
        </p>
        {shortfall ? (
          <Badge
            appearance="soft"
            className="[--bdg-border:transparent] [--bdg-surface:var(--chip-red)] [--bdg-text:var(--chip-red-foreground)] mt-0.5 font-semibold"
          >
            ของไม่พอ
          </Badge>
        ) : (
          <p className="text-sm text-muted-foreground">แนะนำ</p>
        )}
      </div>
    </div>
  );
}
