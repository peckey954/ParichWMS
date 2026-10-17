"use client";

import * as React from "react";
import Link from "next/link";
import {
  ChevronRightIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import { Button } from "@peckey954/ui/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@peckey954/ui/components/ui/dialog";
import { Input } from "@peckey954/ui/components/ui/input";
import { Label } from "@peckey954/ui/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@peckey954/ui/components/ui/select";
import { Switch } from "@peckey954/ui/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@peckey954/ui/components/ui/table";
import { cn } from "@peckey954/ui/lib/utils";
import { toast } from "sonner";
import { ParamRegistryTable } from "@/components/qc/param-registry";
import { ROW_HOVER_NAV } from "@/components/stock/doc-parts";
import {
  GUARD_LABEL,
  QI_PARAMETERS,
  DISPOSITIONS,
  QI_GROUPS,
  addGroup,
  addDisposition,
  dispositionUsedBy,
  groupUsedBy,
  removeDisposition,
  removeGroup,
  renameGroup,
  updateDisposition,
  type Disposition,
  type GuardAction,
  type StockGuard,
} from "@/lib/qc-erp";

/* ------------------------------------------------------------------
   ตั้งค่าระบบของการตรวจคุณภาพ — Stock Settings + ทะเบียนกลาง

   แยกออกมาจากหน้ารายการรายงาน เพราะเป็นงานนาน ๆ ทำที อยู่หลังปุ่ม
   "ตั้งค่าระบบ" ที่หัวหน้ารายการ ไม่ได้เป็นแท็บที่แย่งที่ตารางรายงาน
------------------------------------------------------------------ */

/* ---------- แท็บตั้งค่าระบบ ---------- */
export function SystemSettings({
  guard,
  onChange,
  onParamsChanged,
}: {
  guard: StockGuard;
  onChange: (next: StockGuard) => void;
  onParamsChanged: () => void;
}) {
  return (
    <div className="mt-4 space-y-4">
      {/* การบังคับใช้มีสองชั้นและคนละที่เก็บ เรียงตามลำดับที่คนคิดจริง —
          "ตัวไหนต้องตรวจ" (Item) มาก่อน "ไม่ตรวจแล้วจะยังไง" (Stock Settings)
          ชั้นแรกเป็นหน้าของตัวเองเพราะเป็นรายสินค้า อยู่ในกล่องนี้ไม่ไหว */}
      <Link
        href="/qc/setup-erp/items"
        className={cn(
          "flex items-start gap-3 rounded-xl border border-border bg-card p-4 sm:p-5",
          ROW_HOVER_NAV
        )}
      >
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold">สินค้าที่ต้องตรวจคุณภาพ</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            ติ๊กรายสินค้าว่าตัวไหนต้องตรวจก่อนรับเข้าหรือก่อนส่งออก —
            เก็บที่ข้อมูลสินค้า ไม่ได้เก็บที่ฟอร์ม ตั้งทีเดียวได้ทั้งคลัง
          </p>
          <p className="mt-2 font-mono text-xs text-muted-foreground">
            Item · inspection_required_before_purchase ·
            inspection_required_before_delivery
          </p>
        </div>
        <ChevronRightIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      </Link>

      <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
        <h2 className="font-semibold">การบังคับใช้กับการรับ–จ่ายของ</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          เป็นค่าของทั้งระบบ ไม่ใช่รายฟอร์มหรือรายวัตถุดิบ — อยากให้บางตัวห้ามผ่าน
          บางตัวแค่เตือน ต้องเขียน script เพิ่ม
        </p>
        {/* ค่านี้ตัวเดียวครอบทุกเอกสารที่มีการตรวจ รวมระหว่างผลิต — เขียนไว้
            ไม่งั้นจะอ่านว่าครอบแค่ขาซื้อขาขาย แล้วไปตั้งความคาดหวังผิด */}
        <p className="mt-2 rounded-lg bg-surface px-3 py-2 text-sm text-muted-foreground">
          ใช้กับ <span className="font-medium text-foreground">ทุกเอกสาร</span> ที่มีการตรวจ
          — ใบรับของ · ใบแจ้งหนี้ซื้อ · ใบรับงานจ้างผลิต · ใบส่งของ · ใบแจ้งหนี้ขาย ·
          ใบเบิก-โอนสต็อก (ระหว่างผลิต)
        </p>

        <div className="mt-4 grid gap-4 @2xl:grid-cols-2">
          <GuardField
            id="on-rejected"
            label="ตรวจไม่ผ่านแล้วจะเดินเอกสารต่อ"
            hint="action_if_quality_inspection_is_rejected"
            value={guard.onRejected}
            onValueChange={(v) => onChange({ ...guard, onRejected: v })}
          />
          <GuardField
            id="on-not-submitted"
            label="ยังไม่ได้ตรวจแล้วจะเดินเอกสารต่อ"
            hint="action_if_quality_inspection_is_not_submitted"
            value={guard.onNotSubmitted}
            onValueChange={(v) => onChange({ ...guard, onNotSubmitted: v })}
          />
        </div>

        <label className="mt-4 flex items-start justify-between gap-4 rounded-lg bg-brand px-4 py-3">
          <span className="min-w-0">
            <span className="block text-sm font-medium">
              ให้ตรวจย้อนหลังได้หลังรับของไปแล้ว
            </span>
            <span className="block text-sm text-muted-foreground">
              ปิดไว้ = ต้องตรวจให้เสร็จก่อนถึงจะรับของได้ ·
              allow_to_make_quality_inspection_after_purchase_or_delivery ·
              ชื่อฟิลด์บอกขอบเขตแค่ซื้อ-ขาย ยังไม่ได้ยืนยันว่าครอบใบเบิก-โอนสต็อกด้วยไหม
            </span>
          </span>
          <Switch
            checked={guard.allowAfter}
            onCheckedChange={(v) => onChange({ ...guard, allowAfter: v })}
          />
        </label>
      </section>

      <DispositionRegistry />

      {/* ---------- ทะเบียนหัวข้อตรวจ ----------
           งานที่ทำตรงนี้คือดูทั้งทะเบียนทีเดียว — หาตัวซ้ำ ดูว่าอันไหนไม่มีใครใช้
           และจัดกลุ่มย้อนหลัง ส่วนการเลือก/สร้างหัวข้อตอนกำลังตั้งฟอร์ม
           ทำได้ในช่องของหน้าเทมเพลตโดยไม่ต้องเดินมาที่นี่ */}
      <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
        <h2 className="font-semibold">
          ทะเบียนหัวข้อตรวจ ({QI_PARAMETERS.length})
        </h2>
        <p className="mt-1 mb-3 text-sm text-muted-foreground">
          เก็บแค่ชื่อกับกลุ่ม ไม่ได้เก็บเกณฑ์ — ความชื้นในฟอร์มรับวัตถุดิบกับใน
          ฟอร์มก่อนผลิตต้องเป็นตัวเดียวกัน รายงานย้อนหลังถึงรวมกันได้
        </p>
        <ParamRegistryTable onChanged={onParamsChanged} />
      </section>

      <GroupRegistry onChanged={onParamsChanged} />

    </div>
  );
}

/* ---------- กลุ่มหัวข้อตรวจ ----------
     ERPNext เก็บกลุ่มเป็น doctype ของตัวเอง (Quality Inspection Parameter Group)
     ไม่ใช่ข้อความในชื่อหัวข้อ ที่นี่จึงต้องมีที่จัดการของมันเอง

     เปลี่ยนชื่อกลุ่มแล้วหัวข้อที่อยู่ในกลุ่มนั้นย้ายตามให้เอง และถ้าเปลี่ยนเป็น
     ชื่อที่มีอยู่แล้วคือยุบสองกลุ่มรวมกัน ซึ่งเป็นวิธีเก็บกวาดกลุ่มที่ตั้งซ้ำ */
function GroupRegistry({ onChanged }: { onChanged: () => void }) {
  const [adding, setAdding] = React.useState(false);
  const [draft, setDraft] = React.useState("");
  const [editing, setEditing] = React.useState<string | null>(null);
  const [, bump] = React.useReducer((n: number) => n + 1, 0);

  const refresh = () => {
    bump();
    onChanged();
  };

  const commitAdd = () => {
    if (draft.trim() === "") {
      setAdding(false);
      return;
    }
    const name = addGroup(draft);
    setDraft("");
    setAdding(false);
    refresh();
    toast.success(`เพิ่มกลุ่ม “${name}” แล้ว`);
  };

  return (
    <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="font-semibold">กลุ่มหัวข้อตรวจ ({QI_GROUPS.length})</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            ใช้แบ่งหัวข้อในใบตรวจให้อ่านง่าย — ไม่บังคับ หัวข้อที่ไม่จัดกลุ่มก็ใช้ได้ปกติ
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setAdding(true)}>
          <PlusIcon />
          เพิ่มกลุ่ม
        </Button>
      </div>

      <div className="mt-3 overflow-hidden rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-48">ชื่อกลุ่ม</TableHead>
              <TableHead className="min-w-32 text-right">หัวข้อในกลุ่ม</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {QI_GROUPS.map((g) => {
              const used = groupUsedBy(g);
              return (
                <TableRow key={g}>
                  <TableCell>
                    {/* แก้ชื่อในแถวเลย ไม่ต้องเปิดกล่อง — กลุ่มมีช่องเดียว
                        เปิดกล่องเพื่อแก้ข้อความบรรทัดเดียวคือขั้นตอนเกินจำเป็น */}
                    {editing === g ? (
                      <Input
                        autoFocus
                        defaultValue={g}
                        className="bg-card"
                        onBlur={(e) => {
                          renameGroup(g, e.target.value);
                          setEditing(null);
                          refresh();
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") e.currentTarget.blur();
                          if (e.key === "Escape") setEditing(null);
                        }}
                      />
                    ) : (
                      <span className="font-medium">{g}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {used > 0 ? (
                      `${used} หัวข้อ`
                    ) : (
                      <span className="text-muted-foreground">ว่าง</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`แก้ชื่อกลุ่ม ${g}`}
                      onClick={() => setEditing(g)}
                    >
                      <PencilIcon />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      disabled={used > 0}
                      title={used > 0 ? `ลบไม่ได้ มี ${used} หัวข้ออยู่ในกลุ่มนี้` : undefined}
                      aria-label={`ลบกลุ่ม ${g}`}
                      onClick={() => {
                        removeGroup(g);
                        refresh();
                        toast.success(`ลบกลุ่ม “${g}” แล้ว`);
                      }}
                    >
                      <Trash2Icon />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}

            {adding && (
              <TableRow>
                <TableCell colSpan={3}>
                  <Input
                    autoFocus
                    className="bg-card"
                    placeholder="ชื่อกลุ่มใหม่ เช่น จุลชีววิทยา"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onBlur={commitAdd}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") e.currentTarget.blur();
                      if (e.key === "Escape") {
                        setDraft("");
                        setAdding(false);
                      }
                    }}
                  />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <p className="mt-2 font-mono text-xs text-muted-foreground">
        Quality Inspection Parameter Group · เปลี่ยนชื่อเป็นกลุ่มที่มีอยู่แล้ว = ยุบรวมกัน
      </p>
    </section>
  );
}

/* ---------- ผลตรวจที่ไม่ผ่าน ----------
     รายการกลาง ไม่ให้พิมพ์อิสระในแต่ละฟอร์ม เพราะแต่ละตัวผูกกับ server script
     ที่เดฟเขียน พิมพ์ชื่อเพี้ยนไปตัวเดียว script ก็ไม่รู้จัก ผู้ตรวจเลือกได้
     บันทึกผ่าน แต่ยอดสต็อกไม่ขยับ และไม่มีอะไรเตือน

     คอลัมน์ "ผลกับสต็อก" เป็นสเปคให้เดฟ ไม่ใช่ของที่ระบบทำให้เอง — เขียนไว้
     ตรงนี้เพื่อให้คนตั้งค่ากับคนเขียนโค้ดอ่านของเดียวกัน */
function DispositionRegistry() {
  const [adding, setAdding] = React.useState(false);
  const [editing, setEditing] = React.useState<Disposition | null>(null);
  const [, bump] = React.useReducer((n: number) => n + 1, 0);

  return (
    <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="font-semibold">
            ผลตรวจที่ไม่ผ่าน ({DISPOSITIONS.length})
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            ตัวเลือกที่ผู้ตรวจเลือกได้เมื่อของไม่ผ่าน — แต่ละฟอร์มเปิดใช้เฉพาะที่
            เกี่ยวข้องได้ ส่วนผลกับสต็อกต้องให้เดฟเขียน server script
          </p>
        </div>
        <Button variant="outline-primary" size="sm" onClick={() => setAdding(true)}>
          <PlusIcon />
          เพิ่มตัวเลือก
        </Button>
      </div>

      <div className="mt-3 overflow-hidden rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-32">ตัวเลือก</TableHead>
              <TableHead className="min-w-56">ผลกับสต็อก</TableHead>
              <TableHead className="min-w-52">ต้องไปเขียนที่</TableHead>
              <TableHead className="min-w-24 text-right">ใช้ในฟอร์ม</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {DISPOSITIONS.map((d) => {
              const used = dispositionUsedBy(d.id);
              return (
                <TableRow key={d.id}>
                  <TableCell className="font-medium">{d.label}</TableCell>
                  <TableCell className="text-sm">{d.effect}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {d.field}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {used > 0 ? (
                      `${used} ฟอร์ม`
                    ) : (
                      <span className="text-muted-foreground">ยังไม่มีใครใช้</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`แก้ไข ${d.label}`}
                      onClick={() => setEditing(d)}
                    >
                      <PencilIcon />
                    </Button>
                    {/* ลบตัวที่ฟอร์มยังเปิดใช้อยู่ไม่ได้ — ใบตรวจเก่าจะอ้างค่าที่หายไป */}
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      disabled={used > 0}
                      title={used > 0 ? `ลบไม่ได้ มี ${used} ฟอร์มใช้อยู่` : undefined}
                      aria-label={`ลบ ${d.label}`}
                      onClick={() => {
                        removeDisposition(d.id);
                        bump();
                        toast.success(`ลบ “${d.label}” แล้ว`);
                      }}
                    >
                      <Trash2Icon />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {(adding || editing) && (
        <DispositionDialog
          editing={editing}
          onClose={() => {
            setAdding(false);
            setEditing(null);
          }}
          onSaved={bump}
        />
      )}
    </section>
  );
}

function DispositionDialog({
  editing,
  onClose,
  onSaved,
}: {
  editing: Disposition | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [label, setLabel] = React.useState(editing?.label ?? "");
  const [effect, setEffect] = React.useState(editing?.effect ?? "");
  const [field, setField] = React.useState(editing?.field ?? "");

  const save = () => {
    if (label.trim() === "") {
      toast.error("กรุณาตั้งชื่อตัวเลือก");
      return;
    }
    const payload = {
      label: label.trim(),
      effect: effect.trim(),
      field: field.trim(),
    };
    if (editing) updateDisposition(editing.id, payload);
    else addDisposition(payload);
    onSaved();
    onClose();
    toast.success(editing ? `แก้ “${payload.label}” แล้ว` : `เพิ่ม “${payload.label}” แล้ว`, {
      description: "อย่าลืมบอกเดฟให้เขียน script รองรับตัวเลือกนี้ด้วย",
    });
  };

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {editing ? "แก้ไขตัวเลือก" : "เพิ่มตัวเลือกใหม่"}
          </DialogTitle>
          <DialogDescription>
            ตั้งที่นี่แล้วทุกฟอร์มหยิบไปใช้ร่วมกัน — ชื่อที่ตั้งคือค่าที่ server
            script จะอ่าน เปลี่ยนชื่อแล้วต้องแก้ script ตาม
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="disp-label">ชื่อตัวเลือก</Label>
            <Input
              id="disp-label"
              autoFocus
              className="bg-card"
              placeholder="เช่น ส่งคืน"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="disp-effect">ผลกับสต็อก</Label>
            <Input
              id="disp-effect"
              className="bg-card"
              placeholder="เช่น ตัดออกจากยอดรับ แล้วออกใบคืนของผู้ขาย"
              value={effect}
              onChange={(e) => setEffect(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              เขียนให้คนอ่าน ระบบไม่ได้ทำตามนี้เอง ต้องมีคนเขียน script
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="disp-field">ต้องไปเขียนที่</Label>
            <Input
              id="disp-field"
              className="bg-card font-mono text-sm"
              placeholder="เช่น rejected_qty + Purchase Return"
              value={field}
              onChange={(e) => setField(e.target.value)}
            />
            <p className="font-mono text-xs text-muted-foreground">
              สเปคให้เดฟ · ฟิลด์ในใบรับของที่ต้องถูกเซ็ต
            </p>
          </div>
        </div>

        <DialogFooter className="grid grid-cols-2 gap-3">
          <Button variant="outline-primary" onClick={onClose}>
            ยกเลิก
          </Button>
          <Button onClick={save}>{editing ? "บันทึก" : "เพิ่ม"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function GuardField({
  id,
  label,
  hint,
  value,
  onValueChange,
}: {
  id: string;
  label: string;
  hint: string;
  value: GuardAction;
  onValueChange: (v: GuardAction) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Select value={value} onValueChange={(v) => onValueChange(v as GuardAction)}>
        <SelectTrigger id={id} className="w-full bg-card">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {(["stop", "warn"] as GuardAction[]).map((a) => (
            <SelectItem key={a} value={a}>
              {GUARD_LABEL[a]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="font-mono text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

export function EmptyBox({ text }: { text: string }) {
  return (
    <div className={cn("mt-4 rounded-xl border border-dashed border-border", "px-6 py-14 text-center")}>
      <p className="font-medium">{text}</p>
      <p className="mt-1 text-sm text-muted-foreground">ลองใช้คำค้นสั้นลง</p>
    </div>
  );
}
