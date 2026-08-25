"use client";

import * as React from "react";
import { PencilIcon } from "lucide-react";
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
import {
  GroupHeaderRow,
  useGroupStickyTop,
} from "@/components/production/group-header-row";
import { RECIPE_GROUP_LABEL } from "@/lib/recipe";
import {
  COST_FIELDS,
  computeCost,
  formatBaht,
  isBlank,
  type CostRow,
  type FieldKey,
} from "@/lib/recipe-cost";

/* ------------------------------------------------------------------
   ตารางเต็มบนจอกว้าง — 17 ช่องกรอก + 4 คอลัมน์ผลคำนวณ

   หน้าตาตรงกับไฟล์ต้นทางที่สุด ใช้ตอนอยากเห็นภาพรวมหรือเทียบข้ามสูตร

   หัวคอลัมน์ทุกอันเป็นสีข้อความปกติเหมือนกันหมด (เคยลองให้หัวคอลัมน์ที่กรอกได้
   เป็นสีแบรนด์ไว้ แต่สีส้มไปแย่งความสนใจจากขีดส้ม primary ที่แถวหัวกลุ่มสูตร
   ซึ่งเป็นตัวบอกกลุ่มจริง ๆ จึงเก็บสีส้มไว้ที่เดียวคือแถวหัวกลุ่ม)

   ชื่อสูตรตรึงซ้าย ราคาขายตรึงขวา เพราะสองอย่างนี้ต้องเห็นตลอด
   ตอนเลื่อนไล่แก้ตัวเลขตรงกลาง
------------------------------------------------------------------ */

export function CostTable({
  rows,
  onPatch,
  onOpenRow,
}: {
  rows: CostRow[];
  onPatch: (id: string, key: FieldKey, value: string) => void;
  onOpenRow: (row: CostRow) => void;
}) {
  // วัดความสูงจริงของแถวหัวตาราง ไว้ตรึงแถวหัวกลุ่มให้อยู่ใต้หัวตารางพอดี
  // เหมือนตารางสูตรประจำสัปดาห์ / สูตรที่เหมาะสม
  const { headRef, top: groupTop } = useGroupStickyTop();

  return (
    <TableFrame>
      <Table>
        <TableHeader className={STICKY_HEAD}>
          <TableRow ref={headRef}>
            <TableHead className={cn(HEAD_FIRST, "min-w-64")}>สูตร</TableHead>
            <TableHead className="text-right whitespace-nowrap">
              บรรจุ (กก.)
            </TableHead>

            {COST_FIELDS.map((f) => (
              <TableHead key={f.key} className="text-right whitespace-nowrap">
                {f.label}
              </TableHead>
            ))}

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
            const r = computeCost(row);
            // เทียบกับแถวก่อนหน้าตรง ๆ ไม่เก็บสถานะไว้นอกลูป
            const head = i === 0 || rows[i - 1].group !== row.group;

            return (
              <React.Fragment key={row.id}>
                {head && (
                  <GroupHeaderRow
                    label={RECIPE_GROUP_LABEL[row.group]}
                    top={groupTop}
                  />
                )}
                <TableRow>
                  <TableCell className={COL_FIRST}>
                    <span className="block font-medium">{row.sku}</span>
                  </TableCell>

                  <TableCell className="text-right tabular-nums">
                    {row.size}
                  </TableCell>

                  {COST_FIELDS.map((f) => (
                    <TableCell key={f.key}>
                      <Input
                        aria-label={`${f.label} ของ ${row.sku}`}
                        inputMode="decimal"
                        placeholder="0"
                        value={row[f.key]}
                        onChange={(e) => onPatch(row.id, f.key, e.target.value)}
                        className={cn(
                          "w-24 text-right tabular-nums",
                          // ช่องว่างขอบเหลือง ไล่หาช่องที่ยังไม่ได้กรอกได้ด้วยตา
                          isBlank(row[f.key]) && "border-chip-yellow-foreground/50"
                        )}
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
                      aria-label={`เปิดสูตร ${row.sku}`}
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
                  </TableCell>
                </TableRow>
              </React.Fragment>
            );
          })}
        </TableBody>
      </Table>
    </TableFrame>
  );
}
