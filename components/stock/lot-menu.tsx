"use client";

import Link from "next/link";
import { ArrowUpDownIcon, EllipsisVerticalIcon, PrinterIcon, ReplaceIcon } from "lucide-react";
import { Button } from "@peckey954/ui/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@peckey954/ui/components/ui/dropdown-menu";
import type { Lot } from "@/lib/general-stock";

/* ------------------------------------------------------------------
   ปุ่ม ⋮ ท้ายแถวล็อต — ตามแบบเหลือแค่ "พิมพ์บาร์โค้ด"
   ย้าย/ปรับปรุงย้ายไปอยู่ที่ ⋮ บนหัวหน้า (BulkMenu) ทำได้หลาย Lot ในใบเดียว

   พิมพ์บาร์โค้ดเปิดเป็นหน้าเต็ม (/stock/lot/<id>/print) เป็นลิงก์จริง
   คลิกกลางเปิดแท็บใหม่ได้ ย้อนกลับแล้วกลับมาที่แท็บ/ชิปเดิม
------------------------------------------------------------------ */

export function LotMenu({ lot }: { lot: Lot }) {
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8 shrink-0 text-foreground" aria-label={`จัดการ ${lot.code}`}>
          <EllipsisVerticalIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-44">
        <DropdownMenuItem asChild>
          <Link href={`/stock/lot/${lot.id}/print`}>
            <PrinterIcon />
            พิมพ์บาร์โค้ด
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * ปุ่ม ⋮ บนหัวหน้าสต็อก — ย้าย / ปรับปรุง กดแล้วเข้าหน้าสแกนเลย (หนึ่งใบ สินค้าเดียว หลาย Lot)
 * เป็นงานระดับทั้งหน้า ไม่ผูกกับแท็บ จึงอยู่ข้างชื่อหน้าได้โดยหัวเรื่องไม่กระตุก
 */
export function BulkMenu({ base }: { base: "/stock" | "/stock/goods" }) {
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="shrink-0" aria-label="ย้าย/ปรับปรุงสต็อก">
          <EllipsisVerticalIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-36">
        <DropdownMenuItem asChild>
          <Link href={`${base}/bulk/move`}>
            <ReplaceIcon />
            ย้าย
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`${base}/bulk/adjust`}>
            <ArrowUpDownIcon />
            ปรับปรุง
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
