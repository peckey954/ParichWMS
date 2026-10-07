"use client";

import * as React from "react";
import { PencilIcon, PlusIcon, SearchIcon, Trash2Icon } from "lucide-react";
import { Badge } from "@peckey954/ui/components/ui/badge";
import { Button } from "@peckey954/ui/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@peckey954/ui/components/ui/dialog";
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
import { ParamQuickAdd } from "@/components/qc/param-picker";
import { toast } from "sonner";
import {
  QI_PARAMETERS,
  removeParameter,
  usedByCount,
  type QiParameter,
} from "@/lib/qc-erp";

/* ------------------------------------------------------------------
   ทะเบียนหัวข้อตรวจทั้งอัน

   ใช้สองที่ด้วยโค้ดชุดเดียว
     ในแท็บตั้งค่าระบบ   งานดูแลข้อมูล — หาตัวซ้ำ ดูว่าอันไหนไม่มีใครใช้
     ในกล่องจากช่องเลือก  ตอนกำลังตั้งฟอร์มแล้วอยากเห็นทั้งทะเบียนก่อนตัดสินใจ

   ทางที่สองคือ "Advanced Search" ของ Frappe ที่ติดมากับ Link field ทุกตัว
   ซึ่งเป็นเหตุผลที่ทะเบียนไม่ต้องมีแท็บของตัวเอง — ของที่ใช้ตอนกำลังทำงานอยู่
   ควรเปิดได้จากตรงที่ทำงานอยู่ ไม่ใช่ให้เดินออกไปอีกแท็บแล้วเดินกลับมา
------------------------------------------------------------------ */

export function ParamRegistryTable({
  onPick,
  onChanged,
}: {
  /** ใส่มาเมื่อเปิดเพื่อเลือก — แถวจะกดได้ ไม่ใส่คือดูอย่างเดียว */
  onPick?: (parameterId: string) => void;
  onChanged?: () => void;
}) {
  const [adding, setAdding] = React.useState(false);
  const [editing, setEditing] = React.useState<QiParameter | null>(null);
  const [query, setQuery] = React.useState("");
  const [, bump] = React.useReducer((n: number) => n + 1, 0);

  const q = query.trim().toLowerCase();
  const rows = QI_PARAMETERS.filter(
    (p) =>
      !q || p.name.toLowerCase().includes(q) || p.group.toLowerCase().includes(q)
  );
  const unused = QI_PARAMETERS.filter((p) => usedByCount(p.id) === 0).length;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <InputGroup className="min-w-0 flex-1 bg-card">
          <InputGroupAddon align="inline-start">
            <SearchIcon />
          </InputGroupAddon>
          <InputGroupInput
            placeholder="ค้นหาหัวข้อตรวจ..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </InputGroup>
        <Button variant="outline-primary" size="sm" onClick={() => setAdding(true)}>
          <PlusIcon />
          เพิ่มหัวข้อ
        </Button>
      </div>

      {/* หัวข้อที่ไม่มีใครใช้คือของที่สร้างค้างไว้แล้วลืม ต้องนับให้เห็น
          ไม่งั้นทะเบียนจะรกขึ้นเรื่อย ๆ โดยไม่มีใครรู้ว่าต้องไปสะสางตรงไหน */}
      {unused > 0 && (
        <p className="text-sm text-muted-foreground">
          มี {unused} หัวข้อที่ยังไม่มีฟอร์มไหนใช้
        </p>
      )}

      <div className="max-h-96 overflow-y-auto rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-44">หัวข้อตรวจ</TableHead>
              <TableHead className="min-w-24">กลุ่ม</TableHead>
              <TableHead className="min-w-16">หน่วย</TableHead>
              <TableHead className="min-w-28 text-right">ใช้ในฟอร์ม</TableHead>
              {!onPick && <TableHead className="w-24" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={onPick ? 4 : 5}
                  className="py-10 text-center text-muted-foreground"
                >
                  ไม่พบหัวข้อตรวจที่ค้นหา
                </TableCell>
              </TableRow>
            ) : (
              rows.map((p) => {
                const used = usedByCount(p.id);
                return (
                  <TableRow
                    key={p.id}
                    onClick={onPick ? () => onPick(p.id) : undefined}
                    className={cn(onPick && "cursor-pointer hover:bg-surface")}
                  >
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>
                      {/* ยังไม่จัดกลุ่มไม่ใช่ข้อมูลหาย เขียนออกมาเป็นคำ
                          ไม่ใช่ปล่อยช่องว่างให้อ่านว่าโหลดไม่ขึ้น */}
                      {p.group ? (
                        <Badge appearance="soft" tone="neutral">
                          {p.group}
                        </Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          ยังไม่จัดกลุ่ม
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {p.unit || "-"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {used > 0 ? (
                        `${used} ฟอร์ม`
                      ) : (
                        <span className="text-muted-foreground">ยังไม่มีใครใช้</span>
                      )}
                    </TableCell>
                    {/* ปุ่มแก้/ลบไม่โชว์ตอนเปิดมาเพื่อเลือก — ตอนนั้นคนกำลังทำงาน
                        อื่นอยู่ กดพลาดโดนลบคือเสียของจริง */}
                    {!onPick && (
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`แก้ไข ${p.name}`}
                          onClick={() => setEditing(p)}
                        >
                          <PencilIcon />
                        </Button>
                        {/* ลบได้เฉพาะตัวที่ไม่มีฟอร์มไหนใช้ — ลบตัวที่ใช้อยู่แล้ว
                            ใบตรวจเก่าจะชี้ไปหาของที่ไม่มี ERPNext ก็กันแบบเดียวกัน */}
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          disabled={used > 0}
                          title={
                            used > 0
                              ? `ลบไม่ได้ มี ${used} ฟอร์มใช้อยู่`
                              : undefined
                          }
                          aria-label={`ลบ ${p.name}`}
                          onClick={() => {
                            removeParameter(p.id);
                            bump();
                            onChanged?.();
                            toast.success(`ลบ “${p.name}” ออกจากทะเบียนแล้ว`);
                          }}
                        >
                          <Trash2Icon />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {adding && (
        <ParamQuickAdd
          onClose={() => setAdding(false)}
          onCreated={(p) => {
            bump();
            onChanged?.();
            onPick?.(p.id);
          }}
        />
      )}

      {editing && (
        <ParamQuickAdd
          editing={editing}
          onClose={() => setEditing(null)}
          onCreated={() => {
            bump();
            onChanged?.();
          }}
        />
      )}
    </div>
  );
}

/** ทะเบียนแบบเปิดเป็นกล่อง — ตรงกับ Advanced Search ของ Link field ใน Frappe */
export function ParamRegistryDialog({
  onClose,
  onPick,
}: {
  onClose: () => void;
  onPick: (parameterId: string) => void;
}) {
  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="flex max-h-[90dvh] flex-col sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>ทะเบียนหัวข้อตรวจ</DialogTitle>
          <DialogDescription>
            กดที่แถวเพื่อเลือกหัวข้อนั้นใส่ฟอร์ม — คอลัมน์ขวาบอกว่าหัวข้อนั้นมีฟอร์มอื่นใช้อยู่กี่ฟอร์ม
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <ParamRegistryTable
            onPick={(id) => {
              onPick(id);
              onClose();
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
