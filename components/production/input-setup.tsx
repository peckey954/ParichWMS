"use client";

import * as React from "react";
import { PlusIcon, SearchIcon, TrashIcon } from "lucide-react";
import { Button } from "@peckey954/ui/components/ui/button";
import { Input } from "@peckey954/ui/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@peckey954/ui/components/ui/input-group";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@peckey954/ui/components/ui/table";
import { cn } from "@peckey954/ui/lib/utils";
import { useRecipeRun } from "@/components/production/recipe-run";
import {
  COL_FIRST,
  HEAD_FIRST,
  STICKY_HEAD,
  TableFrame,
} from "@/components/stock/doc-parts";
import {
  NUTRIENTS,
  type NutrientKey,
  type RawMaterialDraft,
  displayNumber,
  emptyMaterial,
  formatBaht,
  toNumber,
} from "@/lib/recipe-input";

/* ------------------------------------------------------------------
   แท็บตั้งค่าข้อมูล — ต้นทุนกับธาตุอาหารของวัตถุดิบ

   ตารางเดียว แถวเดียวคือวัตถุดิบหนึ่งตัว เหมือนไฟล์ต้นทาง
   เคยแยกเป็นสองส่วน (ต้นทุนกางไว้ ธาตุอาหารหุบไว้) แต่พอต้องเพิ่มวัตถุดิบใหม่
   ต้องกรอกชื่อที่ส่วนล่าง แล้วเลื่อนกลับขึ้นไปกรอกต้นทุนที่ส่วนบน
   รวมเป็นตารางเดียวแล้วไล่กรอกทีละแถวจนจบได้เลย

   จอแคบไม่ยุบเป็นการ์ด เลื่อนตารางแนวนอนเอา
   ตรึงคอลัมน์ชื่อไว้ซ้าย เลื่อนไปไกลแค่ไหนก็ยังรู้ว่ากรอกอยู่แถวไหน
   การกรอกตัวเลขแบบนี้ต้องเทียบกันข้ามแถวได้ ซึ่งการ์ดทำไม่ได้

   คอลัมน์ "ราคา" ในไฟล์เดิมตัดออกแล้ว เพราะซ้ำกับต้นทุน
------------------------------------------------------------------ */

/**
 * ปุ่มลบตรึงขวาเฉพาะจอกว้าง
 *
 * จอ 390px กรอบตารางกว้างจริง 322px คอลัมน์ชื่อที่ตรึงซ้ายกินไป 176px
 * ตรึงขวาอีกข้างเหลือที่เลื่อนไม่ถึง 100px ช่องต้นทุนโดนบังจนอ่านเลขไม่ครบ
 * จอแคบจึงปล่อยปุ่มลบไหลไปอยู่ท้ายสุดของแถว เลื่อนไปหาเอา
 *
 * เขียนคลาสเต็มทุกตัว เพราะ Tailwind สแกนหาสตริงตรง ๆ ในซอร์ส
 * ต่อคลาสจากตัวแปรแล้วมันจะไม่ generate ให้
 */
const COL_TRASH =
  "@3xl:sticky @3xl:right-0 @3xl:z-10 @3xl:border-l @3xl:border-border @3xl:bg-card";
const HEAD_TRASH =
  "w-12 @3xl:right-0 @3xl:z-30! @3xl:border-l @3xl:border-border";

export function InputSetup() {
  // แก้ที่นี่คือแก้ "ร่าง" เท่านั้น หน้าสูตรที่เหมาะสมจริงยังไม่เห็นจนกว่าจะเผยแพร่
  const { draftMaterials: rows, setDraftMaterials: setRows } = useRecipeRun();
  const [query, setQuery] = React.useState("");
  // ช่องที่เคอร์เซอร์อยู่ตอนนี้ — ช่องนั้นโชว์ค่าดิบ ที่เหลือโชว์แบบมีลูกน้ำ
  const [editing, setEditing] = React.useState<string | null>(null);
  const seq = React.useRef(0);

  const patch = (id: string, next: Partial<RawMaterialDraft>) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...next } : r)));

  const setNutrient = (id: string, key: NutrientKey, v: string) =>
    setRows((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, nutrients: { ...r.nutrients, [key]: v } } : r
      )
    );

  /**
   * แถวใหม่ขึ้นบนสุด ไม่ใช่ต่อท้าย
   * ตารางตรึงความสูงไว้ 60vh ถ้าต่อท้ายแล้วแถวใหม่จะไปโผล่นอกจอ
   * กดปุ่มแล้วไม่เห็นอะไรเกิดขึ้น เลยดูเหมือนปุ่มเสีย
   */
  const addRow = () => {
    seq.current += 1;
    setRows((prev) => [emptyMaterial(`new-${seq.current}`), ...prev]);
    // เคลียร์คำค้นไว้ ไม่งั้นแถวที่เพิ่งเพิ่มอาจโดนกรองออกจนดูเหมือนปุ่มเสีย
    setQuery("");
  };

  const removeRow = (id: string) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const totalCost = rows.reduce((sum, r) => sum + toNumber(r.cost), 0);
  const visible = rows.filter((r) =>
    r.name.toLowerCase().includes(query.trim().toLowerCase())
  );

  /** ค่าที่โชว์ในช่อง — ช่องที่กำลังพิมพ์อยู่ไม่ถูกจัดรูปแบบ */
  const shown = (key: string, raw: string) =>
    editing === key ? raw : displayNumber(raw);

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
        {/* ---------- หัวข้อ + ปุ่มเพิ่มวัตถุดิบ ----------
             ปุ่มอยู่แถวเดียวกับหัวข้อ ไม่ใช่ใต้ตาราง
             ตารางสูงถึง 60vh ปุ่มที่อยู่ใต้ตารางจะไกลเกินกว่าจะเห็น */}
        <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
          <div className="min-w-0">
            <p className="font-semibold">
              ตั้งค่าข้อมูล
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({rows.length} รายการ)
              </span>
            </p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              ธาตุอาหารไม่บังคับกรอก ค่าจะเป็น 0.00
            </p>
          </div>

          <Button variant="outline-primary" className="shrink-0" onClick={addRow}>
            <PlusIcon />
            เพิ่มวัตถุดิบ
          </Button>
        </div>

        <InputGroup className="mt-3 bg-card">
          <InputGroupAddon align="inline-start">
            <SearchIcon />
          </InputGroupAddon>
          <InputGroupInput
            placeholder="ค้นหาวัตถุดิบ..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </InputGroup>

        {query.trim() !== "" && (
          <p className="mt-2 text-sm text-muted-foreground">
            กรองอยู่ {visible.length} จาก {rows.length} รายการ
          </p>
        )}

        <p className="mt-3 text-sm text-muted-foreground">
          รวมต้นทุนที่กรอกไว้{" "}
          <span className="font-semibold text-foreground tabular-nums">
            {formatBaht(totalCost)}
          </span>{" "}
          บาท
        </p>

        {visible.length === 0 ? (
          <div className="mt-3 rounded-lg border border-dashed border-border py-10 text-center">
            <p className="font-medium">ไม่พบวัตถุดิบที่ค้นหา</p>
            <p className="mt-1 text-sm text-muted-foreground">
              ลองใช้คำค้นสั้นลง
            </p>
          </div>
        ) : (
        <div className="mt-3">
          <TableFrame>
            <Table>
              <TableHeader className={STICKY_HEAD}>
                <TableRow>
                  <TableHead className={cn(HEAD_FIRST, "min-w-44")}>
                    วัตถุดิบ
                  </TableHead>
                  <TableHead className="text-right">ต้นทุน (บาท/ตัน)</TableHead>
                  {NUTRIENTS.map((n) => (
                    <TableHead key={n.key} className="text-right">
                      {n.label} (%)
                    </TableHead>
                  ))}
                  <TableHead className={HEAD_TRASH} />
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((r) => {
                  const label = r.name.trim() || "วัตถุดิบใหม่";
                  return (
                    <TableRow key={r.id}>
                      <TableCell className={COL_FIRST}>
                        <Input
                          aria-label="ชื่อวัตถุดิบ"
                          placeholder="ระบุวัตถุดิบ"
                          value={r.name}
                          onChange={(e) => patch(r.id, { name: e.target.value })}
                        />
                      </TableCell>

                      <TableCell>
                        <Input
                          aria-label={`${label} ต้นทุนต่อตัน`}
                          inputMode="decimal"
                          placeholder="0.00"
                          value={shown(`cost-${r.id}`, r.cost)}
                          onFocus={() => setEditing(`cost-${r.id}`)}
                          onBlur={() => setEditing(null)}
                          onChange={(e) => patch(r.id, { cost: e.target.value })}
                          className="w-28 text-right tabular-nums"
                        />
                      </TableCell>

                      {NUTRIENTS.map((n) => (
                        <TableCell key={n.key}>
                          <Input
                            aria-label={`${label} ${n.label}`}
                            inputMode="decimal"
                            placeholder="0.00"
                            value={r.nutrients[n.key]}
                            onChange={(e) =>
                              setNutrient(r.id, n.key, e.target.value)
                            }
                            className="w-20 text-right tabular-nums"
                          />
                        </TableCell>
                      ))}

                      <TableCell className={COL_TRASH}>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`ลบ ${label}`}
                          onClick={() => removeRow(r.id)}
                        >
                          <TrashIcon />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableFrame>
        </div>
        )}
      </section>
    </div>
  );
}
