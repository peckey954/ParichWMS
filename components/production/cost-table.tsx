"use client";

import * as React from "react";
import { PencilIcon } from "lucide-react";
import { Badge } from "@peckey954/ui/components/ui/badge";
import { Button } from "@peckey954/ui/components/ui/button";
import { Input } from "@peckey954/ui/components/ui/input";
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
  COL_FIRST,
  COL_LAST,
  HEAD_FIRST,
  HEAD_LAST,
  STICKY_HEAD,
  TableFrame,
} from "@/components/stock/doc-parts";
import { RECIPE_GROUP_LABEL } from "@/lib/recipe";
import {
  ROW_FIELDS,
  computeCost,
  formatBaht,
  overrideCount,
  type CostDefaults,
  type CostRow,
  type RowFieldKey,
} from "@/lib/recipe-cost";

/* ------------------------------------------------------------------
   ตารางบนจอกว้าง

   คอลัมน์ที่กรอกได้เหลือสามช่อง ที่เหลือเป็นผลคำนวณ จึงไม่ต้องเลื่อน
   แนวนอนไกลเหมือนไฟล์ Excel ต้นทาง

   ชื่อสูตรตรึงซ้าย ราคาขายตรึงขวา เพราะสองอย่างนี้คือสิ่งที่ต้องเห็น
   ตลอดเวลาที่กำลังไล่แก้ตัวเลขตรงกลาง
------------------------------------------------------------------ */

export function CostTable({
  rows,
  defaults,
  onPatch,
  onOpenRow,
}: {
  rows: CostRow[];
  defaults: CostDefaults;
  onPatch: (id: string, key: RowFieldKey, value: string) => void;
  onOpenRow: (row: CostRow) => void;
}) {
  return (
    <TableFrame>
      <Table>
        <TableHeader className={STICKY_HEAD}>
          <TableRow>
            <TableHead className={cn(HEAD_FIRST, "min-w-72")}>สูตร</TableHead>
            <TableHead className="text-right">บรรจุ (กก.)</TableHead>
            <TableHead className="text-right">ต้นทุนวัตถุดิบ</TableHead>
            {ROW_FIELDS.map((f) => (
              // หัวคอลัมน์ที่กรอกได้เป็นสีแบรนด์ แยกจากคอลัมน์ผลคำนวณ
              <TableHead key={f.key} className="text-right text-primary">
                {f.label}
              </TableHead>
            ))}
            {/* หัวคอลัมน์ตัวเลขห้ามตกบรรทัดหรือโดนตัด ไม่งั้นอ่านไม่ออกว่าคอลัมน์อะไร */}
            <TableHead className="text-right whitespace-nowrap">
              ต้นทุนการผลิต
            </TableHead>
            <TableHead className="text-right whitespace-nowrap">
              ต้นทุนก่อน Rebate
            </TableHead>
            <TableHead className="text-right whitespace-nowrap">
              งบการตลาด
            </TableHead>
            <TableHead className="w-12" />
            <TableHead className={cn(HEAD_LAST, "text-right whitespace-nowrap")}>
              ต้นทุนรวม / ราคาขาย
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {rows.map((row, i) => {
            const r = computeCost(row, defaults);
            const overrides = overrideCount(row.override);
            // เทียบกับแถวก่อนหน้าตรง ๆ ไม่เก็บสถานะไว้นอกลูป
            // ตัวแปรที่ไล่เขียนทับระหว่างเรนเดอร์ทำให้ผลเพี้ยนตอนเรนเดอร์ซ้ำ
            const head = i === 0 || rows[i - 1].group !== row.group;

            return (
              <TableRow key={row.id}>
                <TableCell className={COL_FIRST}>
                  {/* ชื่อกลุ่มขึ้นแค่แถวแรกของกลุ่ม ไม่ซ้ำทุกแถวให้รก */}
                  {head && (
                    <span className="mb-0.5 block text-sm text-muted-foreground">
                      {RECIPE_GROUP_LABEL[row.group]}
                    </span>
                  )}
                  <span className="block font-medium">{row.sku}</span>
                </TableCell>

                <TableCell className="text-right tabular-nums">
                  {row.size}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatBaht(row.rawMaterial)}
                </TableCell>

                {ROW_FIELDS.map((f) => (
                  <TableCell key={f.key}>
                    <Input
                      aria-label={`${f.label} ของ ${row.sku}`}
                      inputMode="decimal"
                      placeholder="0"
                      value={row[f.key]}
                      onChange={(e) => onPatch(row.id, f.key, e.target.value)}
                      className="w-28 text-right tabular-nums"
                    />
                  </TableCell>
                ))}

                <TableCell className="text-right tabular-nums">
                  {formatBaht(r.production)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatBaht(r.beforeRebate)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatBaht(r.budgetTotal)}
                </TableCell>

                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`ตั้งค่าเฉพาะสูตร ${row.sku}`}
                    onClick={() => onOpenRow(row)}
                  >
                    <PencilIcon />
                  </Button>
                </TableCell>

                <TableCell className={cn(COL_LAST, "text-right")}>
                  <span className="block font-semibold whitespace-nowrap tabular-nums">
                    {formatBaht(r.total)}
                  </span>
                  <span className="block whitespace-nowrap text-primary tabular-nums">
                    {formatBaht(r.price)}
                  </span>
                  {overrides > 0 && (
                    <Badge tone="warning" appearance="soft" className="mt-1">
                      ทับ {overrides}
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableFrame>
  );
}
