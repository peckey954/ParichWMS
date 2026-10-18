"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { PlusIcon, SearchIcon } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@peckey954/ui/components/ui/breadcrumb";
import { Button } from "@peckey954/ui/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@peckey954/ui/components/ui/dialog";
import { Input } from "@peckey954/ui/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@peckey954/ui/components/ui/input-group";
import { Label } from "@peckey954/ui/components/ui/label";
import { Switch } from "@peckey954/ui/components/ui/switch";
import { cn } from "@peckey954/ui/lib/utils";
import { toast } from "sonner";
import { ParamQuickAdd } from "@/components/qc/param-picker";
import { ROW_HOVER_NAV } from "@/components/stock/doc-parts";
import {
  QI_GROUPS,
  QI_PARAMETERS,
  REPORT_TYPES,
  addGroup,
  addReportType,
  groupActive,
  groupUsedBy,
  renameGroup,
  renameReportType,
  reportTypeUsedBy,
  setGroupActive,
  setParameterActive,
  setReportTypeActive,
  usedByCount,
  type QiParameter,
} from "@/lib/qc-erp";

/* ------------------------------------------------------------------
   ตั้งค่าระบบของรายงาน QC — ทะเบียนกลางสามชุดที่ทุกรายงานใช้ร่วมกัน

     ประเภทรายงาน    หมวดย่อยในหน้าหลัก
     กลุ่มหัวข้อตรวจ  ใช้จัดหัวข้อในใบตรวจ
     หัวข้อตรวจ      ชื่อหัวข้อที่หยิบไปใส่ในรายงาน

   ปิดแทนลบ — ของที่รายงานใช้อยู่ลบไม่ได้ ไม่งั้นรายงานเก่าจะชี้ไปหาของที่ไม่มี
   ปิดแล้วแค่ไม่เสนอให้เลือกใหม่ ที่ใช้อยู่แล้วยังอยู่ครบ

   กดแถวเพื่อแก้ชื่อ ปุ่มมุมขวาบนของแต่ละก้อนเพิ่มของใหม่
------------------------------------------------------------------ */

export default function QcSystemSettingsPage() {
  const router = useRouter();
  // ทะเบียนเป็นอาเรย์ในโมดูล ไม่ได้อยู่ใน state — แก้แล้วต้องสั่งวาดใหม่เอง
  const [, bump] = React.useReducer((n: number) => n + 1, 0);

  return (
    <>
      <main className="@container mx-auto w-full max-w-6xl px-4 pt-6 pb-24 sm:px-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">หน้าหลัก</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/qc/setup-erp">ตั้งค่ารายงานตรวจสอบ QC</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-primary">ตั้งค่าระบบ</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <h1 className="mt-4 text-2xl font-semibold tracking-tight">ตั้งค่าระบบ</h1>

        <div className="mt-5 space-y-4">
          <ReportTypes onChanged={bump} />
          <Groups onChanged={bump} />
          <Parameters onChanged={bump} />
        </div>
      </main>

      <div className="sticky bottom-0 z-30 border-t border-border bg-surface">
        <div className="mx-auto flex w-full max-w-6xl items-center px-4 py-3 sm:px-6">
          <Button variant="outline-primary" onClick={() => router.back()}>
            ย้อนกลับ
          </Button>
        </div>
      </div>
    </>
  );
}

/* ---------- ประเภทรายงาน ---------- */
function ReportTypes({ onChanged }: { onChanged: () => void }) {
  // null = ปิดกล่อง · "" = เพิ่มใหม่ · id = แก้ชื่อตัวนั้น
  const [editing, setEditing] = React.useState<string | null>(null);
  const current = REPORT_TYPES.find((t) => t.id === editing);

  return (
    <Card
      title={`ประเภทรายงาน (${REPORT_TYPES.length})`}
      note="ใช้แบ่งประเภทการตรวจในหน้าหลัก"
      addLabel="เพิ่มประเภท"
      onAdd={() => setEditing("")}
    >
      <RegistryTable head={["ชื่อประเภท", "รายงานภายใต้ประเภท"]}>
        {REPORT_TYPES.map((t) => (
          <RegistryRow
            key={t.id}
            name={t.label}
            count={countText(reportTypeUsedBy(t.id), "รายงาน")}
            active={t.active}
            onOpen={() => setEditing(t.id)}
            onToggle={(on) => {
              setReportTypeActive(t.id, on);
              onChanged();
            }}
          />
        ))}
      </RegistryTable>

      {editing !== null && (
        <NameDialog
          title={current ? "แก้ชื่อประเภทรายงาน" : "เพิ่มประเภทรายงาน"}
          label="ชื่อประเภท"
          initial={current?.label ?? ""}
          onClose={() => setEditing(null)}
          onSave={(name) => {
            if (current) renameReportType(current.id, name);
            else {
              const exists = REPORT_TYPES.some(
                (t) => t.label.toLowerCase() === name.toLowerCase()
              );
              addReportType(name);
              if (exists) toast.info(`มีประเภท “${name}” อยู่แล้ว`);
            }
            onChanged();
          }}
        />
      )}
    </Card>
  );
}

/* ---------- กลุ่มหัวข้อตรวจ ---------- */
function Groups({ onChanged }: { onChanged: () => void }) {
  const [editing, setEditing] = React.useState<string | null>(null);
  const isNew = editing === "";

  return (
    <Card
      title={`กลุ่มหัวข้อตรวจ (${QI_GROUPS.length})`}
      note="กำหนดกลุ่ม เพื่อใช้แบ่งหัวข้อในใบตรวจ"
      addLabel="เพิ่มกลุ่ม"
      onAdd={() => setEditing("")}
    >
      <RegistryTable head={["ชื่อกลุ่ม", "หัวข้อในกลุ่ม"]}>
        {QI_GROUPS.map((g) => (
          <RegistryRow
            key={g}
            name={g}
            count={countText(groupUsedBy(g), "หัวข้อ")}
            active={groupActive(g)}
            onOpen={() => setEditing(g)}
            onToggle={(on) => {
              setGroupActive(g, on);
              onChanged();
            }}
          />
        ))}
      </RegistryTable>

      {editing !== null && (
        <NameDialog
          title={isNew ? "เพิ่มกลุ่มหัวข้อตรวจ" : "แก้ชื่อกลุ่มหัวข้อตรวจ"}
          label="ชื่อกลุ่ม"
          initial={editing}
          // ชื่อซ้ำกับกลุ่มที่มีอยู่ = รวมสองกลุ่มเป็นกลุ่มเดียว ต้องบอกก่อนกด
          hint={
            isNew
              ? undefined
              : "ตั้งชื่อซ้ำกับกลุ่มที่มีอยู่ หัวข้อในกลุ่มนี้จะย้ายไปรวมกับกลุ่มนั้น"
          }
          onClose={() => setEditing(null)}
          onSave={(name) => {
            if (isNew) addGroup(name);
            else renameGroup(editing, name);
            onChanged();
          }}
        />
      )}
    </Card>
  );
}

/* ---------- หัวข้อตรวจ ----------
     ค้นได้ทั้งชื่อหัวข้อและชื่อกลุ่ม — หัวข้อเยอะขึ้นเรื่อย ๆ ไล่ด้วยตาไม่ไหว */
function Parameters({ onChanged }: { onChanged: () => void }) {
  const [query, setQuery] = React.useState("");
  // undefined = ปิดกล่อง · null = เพิ่มใหม่ · หัวข้อ = แก้ตัวนั้น
  const [editing, setEditing] = React.useState<QiParameter | null | undefined>();

  const q = query.trim().toLowerCase();
  const rows = QI_PARAMETERS.filter(
    (p) => !q || p.name.toLowerCase().includes(q) || p.group.toLowerCase().includes(q)
  );
  const grid = "@2xl:grid-cols-[minmax(0,1fr)_9rem_5rem_9rem_8.5rem]";

  return (
    <Card
      title={`หัวข้อตรวจ (${QI_PARAMETERS.length})`}
      note="กำหนดข้อมูลหัวข้อตรวจและกลุ่ม"
      addLabel="เพิ่มหัวข้อตรวจ"
      onAdd={() => setEditing(null)}
    >
      <InputGroup className="mb-3 bg-card">
        <InputGroupAddon align="inline-start">
          <SearchIcon />
        </InputGroupAddon>
        <InputGroupInput
          placeholder="ค้นหาหัวข้อตรวจ หรือกลุ่ม..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </InputGroup>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <div
          className={cn(
            "hidden items-center gap-4 border-b border-border px-4 py-3 text-sm text-muted-foreground @2xl:grid",
            grid
          )}
        >
          <span>หัวข้อตรวจ</span>
          <span>กลุ่ม</span>
          <span>หน่วย</span>
          <span className="text-right">รายงานที่ใช้หัวข้อ</span>
          <span />
        </div>
        {rows.map((p, i) => (
          <div
            key={p.id}
            className={cn(
              "flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 text-sm @2xl:grid",
              grid,
              i > 0 && "border-t border-border",
              ROW_HOVER_NAV
            )}
          >
            <button
              type="button"
              onClick={() => setEditing(p)}
              className="min-w-0 basis-full truncate text-left font-medium hover:underline @2xl:basis-auto @2xl:font-normal"
            >
              {p.name}
            </button>
            <span className="text-muted-foreground @2xl:text-foreground">
              {p.group || "-"}
            </span>
            <span className="text-muted-foreground @2xl:text-foreground">
              {p.unit || "—"}
            </span>
            <span className="text-muted-foreground @2xl:text-right @2xl:text-foreground">
              {countText(usedByCount(p.id), "รายงาน")}
            </span>
            <ActiveSwitch
              className="ml-auto @2xl:ml-0"
              checked={p.active !== false}
              label={p.name}
              onChange={(on) => {
                setParameterActive(p.id, on);
                onChanged();
              }}
            />
          </div>
        ))}
        {rows.length === 0 && (
          <p className="px-4 py-10 text-center text-sm text-muted-foreground">
            ไม่พบหัวข้อตรวจที่ค้นหา
          </p>
        )}
      </div>

      {editing !== undefined && (
        <ParamQuickAdd
          editing={editing ?? undefined}
          defaultName={editing ? "" : query.trim()}
          onClose={() => setEditing(undefined)}
          onCreated={onChanged}
        />
      )}
    </Card>
  );
}

// ---------------------------------------------------------------

/** ศูนย์แสดงเป็นขีด — "0 รายงาน" อ่านเป็นข้อมูลหาย ขีดอ่านว่ายังไม่มีใครใช้ */
const countText = (n: number, unit: string) => (n === 0 ? "-" : `${n} ${unit}`);

function Card({
  title,
  note,
  addLabel,
  onAdd,
  children,
}: {
  title: string;
  note: string;
  addLabel: string;
  onAdd: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-semibold">{title}</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">{note}</p>
        </div>
        <Button variant="outline-primary" size="sm" onClick={onAdd}>
          <PlusIcon />
          {addLabel}
        </Button>
      </div>
      <div className="mt-3">{children}</div>
    </section>
  );
}

const ROW_GRID = "grid grid-cols-[minmax(0,1fr)_auto_8.5rem] items-center gap-4";

function RegistryTable({
  head,
  children,
}: {
  head: [string, string];
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card [&>*+*]:border-t [&>*+*]:border-border">
      <div className={cn(ROW_GRID, "px-4 py-3 text-sm text-muted-foreground")}>
        <span>{head[0]}</span>
        <span className="text-right">{head[1]}</span>
        <span />
      </div>
      {children}
    </div>
  );
}

function RegistryRow({
  name,
  count,
  active,
  onOpen,
  onToggle,
}: {
  name: string;
  count: string;
  active: boolean;
  onOpen: () => void;
  onToggle: (on: boolean) => void;
}) {
  return (
    <div className={cn(ROW_GRID, "px-4 py-3 text-sm", ROW_HOVER_NAV)}>
      <button
        type="button"
        onClick={onOpen}
        className="min-w-0 truncate text-left hover:underline"
      >
        {name}
      </button>
      <span className="text-right tabular-nums">{count}</span>
      <ActiveSwitch checked={active} label={name} onChange={onToggle} />
    </div>
  );
}

function ActiveSwitch({
  checked,
  label,
  onChange,
  className,
}: {
  checked: boolean;
  label: string;
  onChange: (on: boolean) => void;
  className?: string;
}) {
  return (
    <label className={cn("flex items-center gap-2 text-sm", className)}>
      <Switch checked={checked} aria-label={`เปิดใช้งาน ${label}`} onCheckedChange={onChange} />
      {checked ? "เปิดใช้งาน" : "ปิดใช้งาน"}
    </label>
  );
}

function NameDialog({
  title,
  label,
  initial,
  hint,
  onClose,
  onSave,
}: {
  title: string;
  label: string;
  initial: string;
  hint?: string;
  onClose: () => void;
  onSave: (name: string) => void;
}) {
  const [name, setName] = React.useState(initial);
  const id = React.useId();

  const save = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error(`กรุณาระบุ${label}`);
      return;
    }
    onSave(trimmed);
    onClose();
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent aria-describedby={undefined} className="sm:max-w-md">
        <DialogHeader className="text-left">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-1.5"
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
        >
          <Label htmlFor={id}>{label}</Label>
          <Input
            id={id}
            autoFocus
            className="bg-card"
            placeholder={`ระบุ${label}`}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
        </form>
        <DialogFooter>
          <Button variant="outline-primary" onClick={onClose}>
            ยกเลิก
          </Button>
          <Button onClick={save}>บันทึก</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
