"use client";

import { ChevronDownIcon, ChevronUpIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { Button } from "@peckey954/ui/components/ui/button";
import { Checkbox } from "@peckey954/ui/components/ui/checkbox";
import { Input } from "@peckey954/ui/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@peckey954/ui/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@peckey954/ui/components/ui/table";
import {
  FIELD_KIND_LABEL,
  newHeaderField,
  type FieldKind,
  type HeaderField,
} from "@/lib/qc-template";

const REF_SOURCES = ["สินค้า", "เครื่องจักร", "ใบสั่งผลิต", "คลังสินค้า", "สูตรการผลิต"];

export function HeaderFieldsEditor({
  fields,
  onChange,
}: {
  fields: HeaderField[];
  onChange: (next: HeaderField[]) => void;
}) {
  const patch = (id: string, p: Partial<HeaderField>) =>
    onChange(fields.map((f) => (f.id === id ? { ...f, ...p } : f)));

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= fields.length) return;
    const next = [...fields];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-48">ชื่อฟิลด์</TableHead>
            <TableHead className="min-w-40">ชนิดข้อมูล</TableHead>
            <TableHead className="min-w-56">
              ตัวเลือก / แหล่งข้อมูล
              <span className="block font-normal text-muted-foreground">
                ใช้กับชนิด เลือกจากรายการ และ ดึงจากระบบ
              </span>
            </TableHead>
            <TableHead className="w-28 text-center">บังคับกรอก</TableHead>
            <TableHead className="w-28" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {fields.map((f, i) => (
            <TableRow key={f.id}>
              <TableCell>
                <Input
                  value={f.label}
                  placeholder="เช่น เลขที่ใบสั่งผลิต"
                  onChange={(e) => patch(f.id, { label: e.target.value })}
                />
              </TableCell>

              <TableCell>
                <Select
                  value={f.kind}
                  onValueChange={(v) => patch(f.id, { kind: v as FieldKind })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(FIELD_KIND_LABEL) as FieldKind[]).map((k) => (
                      <SelectItem key={k} value={k}>
                        {FIELD_KIND_LABEL[k]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableCell>

              <TableCell>
                {f.kind === "select" ? (
                  <Input
                    value={f.options.join(", ")}
                    placeholder="คั่นแต่ละตัวเลือกด้วยจุลภาค"
                    onChange={(e) =>
                      patch(f.id, {
                        options: e.target.value
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean),
                      })
                    }
                  />
                ) : f.kind === "ref" ? (
                  <Select
                    value={f.source ?? ""}
                    onValueChange={(v) => patch(f.id, { source: v })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="เลือกแหล่งข้อมูล" />
                    </SelectTrigger>
                    <SelectContent>
                      {REF_SOURCES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <span className="text-sm text-muted-foreground">—</span>
                )}
              </TableCell>

              <TableCell className="text-center">
                <Checkbox
                  checked={f.required}
                  aria-label={`บังคับกรอก ${f.label || "ฟิลด์นี้"}`}
                  onCheckedChange={(c) => patch(f.id, { required: c === true })}
                />
              </TableCell>

              <TableCell>
                <div className="flex justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="เลื่อนขึ้น"
                    disabled={i === 0}
                    onClick={() => move(i, -1)}
                  >
                    <ChevronUpIcon />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="เลื่อนลง"
                    disabled={i === fields.length - 1}
                    onClick={() => move(i, 1)}
                  >
                    <ChevronDownIcon />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="ลบฟิลด์"
                    onClick={() => onChange(fields.filter((x) => x.id !== f.id))}
                  >
                    <Trash2Icon />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Button
        variant="outline-primary"
        onClick={() => onChange([...fields, newHeaderField()])}
      >
        <PlusIcon />
        เพิ่มฟิลด์ส่วนหัว
      </Button>
    </div>
  );
}
