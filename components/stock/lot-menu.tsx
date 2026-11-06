"use client";

import * as React from "react";
import { ArrowUpDownIcon, EllipsisVerticalIcon, PrinterIcon, ReplaceIcon } from "lucide-react";
import { Button } from "@peckey954/ui/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@peckey954/ui/components/ui/dropdown-menu";
import { toast } from "sonner";
import { AdjustLotDialog, MoveLotDialog } from "./lot-dialogs";
import type { Lot } from "@/lib/general-stock";

/* ------------------------------------------------------------------
   ปุ่ม ⋮ ท้ายแถวล็อต — ตามแบบ: พิมพ์บาร์โค้ด / ย้าย / ปรับปรุง
   แทนปุ่มย้าย/ปรับปรุงสองปุ่มเดิม แถวจึงเตี้ยลง และไม่ต้องมีตัวเลือกซ่อนปุ่มในตัวกรอง

   กล่องย้าย/ปรับปรุงเปิดหลังเมนูปิดแล้ว (เปิดจากในเมนูตรง ๆ โฟกัสจะตีกัน)
   key เปลี่ยนทุกรอบที่เปิด ฟอร์มจึงเริ่มว่างเสมอ ไม่ค้างค่ารอบก่อน
------------------------------------------------------------------ */

type Action = "move" | "adjust";

export function LotMenu({
  lot,
  productName,
  unit,
}: {
  lot: Lot;
  productName: string;
  unit: string;
}) {
  const [action, setAction] = React.useState<Action | null>(null);
  const [round, setRound] = React.useState(0);

  const openDialog = (a: Action) => {
    setRound((n) => n + 1);
    setAction(a);
  };
  const dialog = { lot, productName, unit, onOpenChange: (v: boolean) => !v && setAction(null) };

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" className="size-9 shrink-0" aria-label={`จัดการ ${lot.code}`}>
            <EllipsisVerticalIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-44">
          <DropdownMenuItem
            onSelect={() => toast.success("ส่งพิมพ์บาร์โค้ดแล้ว", { description: lot.code })}
          >
            <PrinterIcon />
            พิมพ์บาร์โค้ด
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => openDialog("move")}>
            <ReplaceIcon />
            ย้าย
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => openDialog("adjust")}>
            <ArrowUpDownIcon />
            ปรับปรุง
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <MoveLotDialog key={`m${round}`} {...dialog} open={action === "move"} />
      <AdjustLotDialog key={`a${round}`} {...dialog} open={action === "adjust"} />
    </>
  );
}
