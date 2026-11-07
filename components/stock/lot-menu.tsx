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
import { toast } from "sonner";
import type { Lot } from "@/lib/general-stock";

/* ------------------------------------------------------------------
   ปุ่ม ⋮ ท้ายแถวล็อต — ตามแบบ: พิมพ์บาร์โค้ด / ย้าย / ปรับปรุง
   แทนปุ่มย้าย/ปรับปรุงสองปุ่มเดิม แถวจึงเตี้ยลง และไม่ต้องมีตัวเลือกซ่อนปุ่มในตัวกรอง

   ย้าย/ปรับปรุงเปิดเป็นหน้าเต็ม (/stock/lot/<id>/…) เป็นลิงก์จริง
   คลิกกลางเปิดแท็บใหม่ได้ ย้อนกลับแล้วกลับมาที่แท็บ/ชิปเดิม
------------------------------------------------------------------ */

/** หน้าย้าย/ปรับปรุงของล็อต — หน้าเดียวใช้ทั้งสต็อกทั่วไปและสต็อกสินค้า */
const lotActionHref = (lot: Lot, action: "move" | "adjust") => `/stock/lot/${lot.id}/${action}`;

export function LotMenu({ lot }: { lot: Lot }) {
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8 shrink-0 text-foreground" aria-label={`จัดการ ${lot.code}`}>
          <EllipsisVerticalIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-44">
        <DropdownMenuItem onSelect={() => toast.success("ส่งพิมพ์บาร์โค้ดแล้ว", { description: lot.code })}>
          <PrinterIcon />
          พิมพ์บาร์โค้ด
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={lotActionHref(lot, "move")}>
            <ReplaceIcon />
            ย้าย
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={lotActionHref(lot, "adjust")}>
            <ArrowUpDownIcon />
            ปรับปรุง
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * ปุ่ม ⋮ บนหัวหน้าสต็อก — ย้าย/ปรับปรุงหลายรายการในใบเดียว
 * เป็นงานระดับทั้งหน้า ไม่ผูกกับแท็บ จึงอยู่ข้างชื่อหน้าได้โดยหัวเรื่องไม่กระตุก
 */
export function BulkMenu({ base }: { base: "/stock" | "/stock/goods" }) {
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="shrink-0" aria-label="ย้าย/ปรับปรุงหลายรายการ">
          <EllipsisVerticalIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-52">
        <DropdownMenuItem asChild>
          <Link href={`${base}/bulk/move`}>
            <ReplaceIcon />
            ย้ายหลายรายการ
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`${base}/bulk/adjust`}>
            <ArrowUpDownIcon />
            ปรับปรุงหลายรายการ
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
