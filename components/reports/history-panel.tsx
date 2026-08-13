"use client";

import { ChevronDownIcon, DownloadIcon, HistoryIcon } from "lucide-react";
import { Badge } from "@peckey954/ui/components/ui/badge";
import { Button } from "@peckey954/ui/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@peckey954/ui/components/ui/collapsible";
import { Separator } from "@peckey954/ui/components/ui/separator";
import { formatCount } from "@/lib/reports";

/* ------------------------------------------------------------------
   ประวัติการดาวน์โหลด

   เหตุผลที่ต้องมี — ปิดงวดทีหนึ่งมีคนดึงหลายคน หลายรอบ
   ถ้าไม่บันทึกไว้ จะไม่มีทางรู้ว่าใบชุดนี้ดึงไปแล้วหรือยัง
   และถ้าดึงไปแล้วแต่ข้อมูลเปลี่ยนทีหลัง ก็ตามย้อนไม่ได้ว่าไฟล์ไหนเก่า

   หุบไว้เป็นค่าเริ่มต้น เพราะไม่ใช่ของที่ต้องดูทุกครั้ง
------------------------------------------------------------------ */

export type HistoryEntry = {
  id: string;
  typeLabel: string;
  range: string;
  rows: number;
  format: string;
  fileName: string;
  at: string;
  by: string;
};

export function HistoryPanel({
  entries,
  onRepeat,
}: {
  entries: HistoryEntry[];
  onRepeat: (entry: HistoryEntry) => void;
}) {
  return (
    <Collapsible className="rounded-xl border border-border bg-card">
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="group flex w-full items-center gap-3 p-4 text-left"
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand text-primary">
            <HistoryIcon className="size-5" strokeWidth={1.5} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-semibold">ประวัติการดาวน์โหลด</span>
            <span className="block text-sm text-muted-foreground">
              {entries.length === 0
                ? "ยังไม่มีการดาวน์โหลดในรอบนี้"
                : `${entries.length} รายการล่าสุด — เช็กก่อนว่าดึงงวดนี้ไปแล้วหรือยัง`}
            </span>
          </span>
          <ChevronDownIcon className="size-5 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
        </button>
      </CollapsibleTrigger>

      <CollapsibleContent className="px-4 pb-4">
        <Separator className="mb-3" />

        {entries.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            ดาวน์โหลดแล้วรายการจะมาขึ้นที่นี่ พร้อมช่วงวันที่และจำนวนใบ
          </p>
        ) : (
          <ul className="space-y-2">
            {entries.map((e) => (
              <li
                key={e.id}
                className="flex flex-wrap items-center gap-3 rounded-lg border border-border p-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{e.typeLabel}</span>
                    <Badge tone="neutral" appearance="soft">
                      {e.format}
                    </Badge>
                  </p>
                  <p className="mt-0.5 truncate text-sm text-muted-foreground">
                    {e.range} · {formatCount(e.rows)} ใบ · {e.at} · {e.by}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onRepeat(e)}
                  aria-label={`ดาวน์โหลด ${e.fileName} ซ้ำ`}
                >
                  <DownloadIcon />
                  ดาวน์โหลดซ้ำ
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
