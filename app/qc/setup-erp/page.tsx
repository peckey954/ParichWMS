"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronRightIcon,
  ListFilterIcon,
  PlusIcon,
  SearchIcon,
  SettingsIcon,
} from "lucide-react";
import { Badge } from "@peckey954/ui/components/ui/badge";
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
  DialogTrigger,
} from "@peckey954/ui/components/ui/dialog";
import { Input } from "@peckey954/ui/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@peckey954/ui/components/ui/input-group";
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
import { ChipGroup } from "@/components/chip-group";
import { DateSelect, formatDateSlash } from "@/components/date-select";
import { MultiSelectChips } from "@/components/multi-select-chips";
import { EmptyBox } from "@/components/qc/system-settings";
import {
  ROW_HOVER_NAV,
  TablePager,
  paginate,
} from "@/components/stock/doc-parts";
import {
  NEW_TEMPLATE_ID,
  QI_TEMPLATES,
  REF_MENU,
  REPORT_TYPES,
  STAGE,
  hrefOf,
  reportTypeOf,
  setTemplateActive,
  stageOf,
  type QiTemplate,
} from "@/lib/qc-erp";

/* ------------------------------------------------------------------
   ตั้งค่ารายงานตรวจสอบ QC — รายการรายงานทั้งหมด

   ตารางเดียว กดแถวเข้าไปแก้โครงสร้างทีละรายงาน สวิตช์ท้ายแถวเปิด/ปิดได้เลย
   โดยไม่ต้องเข้าไปข้างใน

   ตั้งค่าระบบ (Stock Settings + ทะเบียนกลาง) เคยเป็นแท็บคู่กับรายการ ย้ายไป
   อยู่หลังปุ่มที่หัวหน้า เพราะเป็นงานนาน ๆ ทำที ไม่ควรแย่งที่ตารางที่ใช้ทุกวัน
------------------------------------------------------------------ */

type ActiveFilter = "all" | "on" | "off";

type Filter = { types: string[]; active: ActiveFilter };

const NO_FILTER: Filter = { types: [], active: "all" };

const PAGE_SIZES = [10, 20, 50];

export default function SetupQcPage() {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [date, setDate] = React.useState<Date | undefined>();
  const [filter, setFilter] = React.useState<Filter>(NO_FILTER);
  const [page, setPage] = React.useState(1);
  const [size, setSize] = React.useState(10);
  // ของที่สร้างใหม่ต่อท้ายอาเรย์ในโมดูล ไม่ได้อยู่ใน state — ต้องสั่งวาดใหม่เอง
  const [, bump] = React.useReducer((n: number) => n + 1, 0);

  const q = query.trim().toLowerCase();
  const day = date ? formatDateSlash(date) : "";
  const templates = QI_TEMPLATES.filter(
    (t) =>
      (!q ||
        t.name.toLowerCase().includes(q) ||
        t.code.toLowerCase().includes(q)) &&
      (!day || t.updatedAt === day) &&
      (filter.types.length === 0 || filter.types.includes(t.reportType)) &&
      (filter.active === "all" || t.active === (filter.active === "on"))
  );
  const filterActive =
    filter.types.length > 0 || filter.active !== NO_FILTER.active;
  const { pages, safe, slice } = paginate(templates, page, size);

  // เปลี่ยนเงื่อนไขค้นแล้วกลับหน้าแรก — ค้างหน้า 3 ไว้ทั้งที่ผลเหลือหน้าเดียวคือจอว่าง
  const reset =
    <T,>(set: (v: T) => void) =>
    (v: T) => {
      set(v);
      setPage(1);
    };

  return (
    <main className="@container mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">หน้าหลัก</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="text-primary">ตั้งค่ารายงาน</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">
            ตั้งค่ารายงานตรวจสอบ QC
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            รายงานตรวจคุณภาพทั้งหมด กดเข้าไปแก้โครงสร้าง หรือเปิด-ปิดการใช้งานได้จากตาราง
          </p>
        </div>
        {/* ตั้งค่าระบบเป็นงานนาน ๆ ทำที ปุ่มรองจึงเป็น outline และอยู่ก่อนปุ่มหลัก
            จอแคบเหลือไอคอนอย่างเดียว ไม่งั้นสองปุ่มเบียดจนปุ่มหลักตกบรรทัด */}
        <div className="flex shrink-0 items-center gap-2">
          <Button asChild variant="outline-primary" size="icon" className="@3xl:hidden">
            <Link href="/qc/setup-erp/system" aria-label="ตั้งค่าระบบ">
              <SettingsIcon />
            </Link>
          </Button>
          <Button asChild variant="outline-primary" className="hidden @3xl:inline-flex">
            <Link href="/qc/setup-erp/system">
              <SettingsIcon />
              ตั้งค่าระบบ
            </Link>
          </Button>
          {/* ไปหน้าตั้งค่าเลย ไม่ถามชื่อในกล่องก่อน — ช่องที่จะถามก็คือช่องแรก
              ของหัวข้อ 1 อยู่แล้ว ถามก่อนคือได้กรอกสองรอบ */}
          <Button onClick={() => router.push(`/qc/setup-erp/${NEW_TEMPLATE_ID}`)}>
            <PlusIcon />
            เพิ่มรายงาน
          </Button>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2 @3xl:flex-nowrap">
        <InputGroup className="w-full min-w-0 bg-card @3xl:flex-1">
          <InputGroupAddon align="inline-start">
            <SearchIcon />
          </InputGroupAddon>
          <InputGroupInput
            placeholder="ค้นหา..."
            value={query}
            onChange={(e) => reset(setQuery)(e.target.value)}
          />
        </InputGroup>
        <div className="flex w-full items-center gap-2 @3xl:w-auto">
          <DateSelect
            className="min-w-0 flex-1 @3xl:w-72 @3xl:flex-none"
            placeholder="วันที่"
            value={date}
            onValueChange={reset(setDate)}
          />
          <FilterButton
            value={filter}
            active={filterActive}
            onApply={reset(setFilter)}
          />
        </div>
      </div>

      {templates.length === 0 ? (
        <EmptyBox text="ไม่พบรายงานที่ค้นหา" />
      ) : (
        <>
          <TemplateCards templates={slice} />
          <TemplateTable templates={slice} onToggled={bump} />
          <Pager
            page={safe}
            pages={pages}
            size={size}
            onPage={setPage}
            onSize={(n) => {
              setSize(n);
              setPage(1);
            }}
          />
        </>
      )}
    </main>
  );
}

/* ---------- ตัวกรอง ----------
     กล่องกลางจอ ชุดเดียวกับหน้าขอซื้อ — แก้ในกล่องก่อน กดตกลงถึงมีผล
     จุดบนปุ่มบอกว่ามีอะไรถูกเปลี่ยนไว้ ไม่บอกว่ากี่อย่าง */
function FilterButton({
  value,
  active,
  onApply,
}: {
  value: Filter;
  active: boolean;
  onApply: (next: Filter) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState(value);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setDraft(value);
      }}
    >
      <DialogTrigger asChild>
        <Button
          variant="outline-primary"
          size="icon"
          aria-label="ตัวกรอง"
          className="relative shrink-0"
        >
          <ListFilterIcon />
          {active && (
            <span className="absolute top-1 right-1 size-2 rounded-full bg-primary" />
          )}
        </Button>
      </DialogTrigger>
      <DialogContent aria-describedby={undefined} className="sm:max-w-md">
        <DialogHeader className="text-left">
          <DialogTitle>ตัวกรอง</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="flt-type">ประเภทรายงาน</Label>
            <MultiSelectChips
              id="flt-type"
              className="w-full bg-card"
              placeholder="ทุกประเภท"
              options={REPORT_TYPES.map((t) => ({ label: t.label, value: t.id }))}
              value={draft.types}
              onValueChange={(types) => setDraft((d) => ({ ...d, types }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label>การใช้งาน</Label>
            <ChipGroup
              label="การใช้งาน"
              value={draft.active}
              onChange={(active) => setDraft((d) => ({ ...d, active }))}
              options={[
                { id: "all" as const, label: "ทั้งหมด" },
                { id: "on" as const, label: "เปิดใช้งาน" },
                { id: "off" as const, label: "ปิดใช้งาน" },
              ]}
            />
          </div>
        </div>
        <DialogFooter className="flex-row justify-between gap-2 sm:justify-between">
          <Button variant="ghost" onClick={() => setDraft(NO_FILTER)}>
            ล้างตัวกรอง
          </Button>
          <Button
            onClick={() => {
              onApply(draft);
              setOpen(false);
            }}
          >
            ตกลง
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** ช่วงการตรวจสอบสองบรรทัด ไทยบน อังกฤษล่าง — ไม่มีคือรายงานที่ไม่ผูกเอกสาร */
function StageCell({ t }: { t: QiTemplate }) {
  const s = stageOf(t);
  if (s === "") return <span className="text-muted-foreground">-</span>;
  return (
    <>
      <span>{STAGE[s].label}</span>
      <span className="block text-sm text-muted-foreground">{STAGE[s].erp}</span>
    </>
  );
}

/* ---------- จอแคบ ----------
     การ์ดทีละใบ — ตารางหกคอลัมน์บีบจนอ่านไม่ออกบนมือถือ
     สถานะเป็นป้ายอ่านอย่างเดียว ทั้งการ์ดเป็นลิงก์ มีสวิตช์ซ้อนข้างในจะกดโดนกันเอง */
function TemplateCards({ templates }: { templates: QiTemplate[] }) {
  return (
    <div className="mt-4 grid gap-3 @3xl:hidden">
      {templates.map((t) => {
        const s = stageOf(t);
        const type = reportTypeOf(t.reportType);
        return (
          <Link
            key={t.id}
            href={hrefOf(t)}
            className="block rounded-lg border border-border bg-card p-4 active:bg-accent"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium">{t.name}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">{t.code}</p>
              </div>
              <ChevronRightIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {type && (
                <Badge appearance="soft" tone="brand">
                  {type.label}
                </Badge>
              )}
              {s !== "" && (
                <Badge appearance="outline" tone="neutral">
                  {STAGE[s].label}
                </Badge>
              )}
              {t.refMenu !== "" && (
                <Badge appearance="outline" tone="neutral">
                  {REF_MENU[t.refMenu].label}
                </Badge>
              )}
            </div>
            <div className="mt-3 flex items-center justify-between gap-3 border-t border-border pt-2 text-sm text-muted-foreground">
              <span className="truncate">
                {t.editor ?? t.owner} · {t.updatedAt}
              </span>
              <Badge appearance="soft" tone={t.active ? "success" : "neutral"}>
                {t.active ? "เปิดใช้งาน" : "ปิดใช้งาน"}
              </Badge>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

/* ---------- จอกว้าง ---------- */
function TemplateTable({
  templates,
  onToggled,
}: {
  templates: QiTemplate[];
  onToggled: () => void;
}) {
  const router = useRouter();
  return (
    <div className="mt-4 hidden overflow-hidden rounded-t-xl border border-b-0 border-border bg-card @3xl:block">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-56 pl-4">ชื่อรายงาน</TableHead>
            <TableHead className="min-w-28">ประเภทการตรวจสอบ</TableHead>
            <TableHead className="min-w-32">เอกสารอ้างอิง</TableHead>
            <TableHead className="min-w-40">ผู้ทำรายการ</TableHead>
            <TableHead className="min-w-32">วันที่อัปเดตล่าสุด</TableHead>
            <TableHead className="min-w-32 pr-4">การใช้งาน</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {templates.map((t) => (
            // ทั้งแถวเป็นเป้ากด — คนกวาดตาอ่านคอลัมน์ขวาอยู่แล้วกดตรงนั้นเลย
            <TableRow
              key={t.id}
              onClick={() => router.push(hrefOf(t))}
              className={cn("cursor-pointer", ROW_HOVER_NAV)}
            >
              <TableCell className="pl-4">
                <span className="font-medium">{t.name}</span>
                <span className="block text-sm text-muted-foreground">{t.code}</span>
              </TableCell>
              <TableCell>
                <StageCell t={t} />
              </TableCell>
              <TableCell>
                {t.refMenu === "" ? (
                  <span className="text-muted-foreground">-</span>
                ) : (
                  REF_MENU[t.refMenu].label
                )}
              </TableCell>
              <TableCell>
                <span className="font-medium">{t.owner}</span>
                {/* คนแก้ล่าสุดอยู่ใต้คนสร้าง ไม่ใช่คอลัมน์แยก — ส่วนใหญ่เป็นคน
                    เดียวกัน แยกคอลัมน์ไปก็ว่างครึ่งตาราง */}
                {t.editor && (
                  <span className="block text-sm text-muted-foreground">
                    แก้ไขล่าสุด: {t.editor}
                  </span>
                )}
              </TableCell>
              <TableCell className="tabular-nums">{t.updatedAt}</TableCell>
              {/* กดสวิตช์แล้วต้องไม่เปิดหน้ารายละเอียดตามไปด้วย */}
              <TableCell className="pr-4" onClick={(e) => e.stopPropagation()}>
                <label className="flex items-center gap-2 text-sm">
                  <Switch
                    checked={t.active}
                    onCheckedChange={(v) => {
                      setTemplateActive(t.id, v);
                      onToggled();
                    }}
                  />
                  {t.active ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                </label>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

/* ---------- แบ่งหน้า ----------
     ติดใต้ตารางในกรอบเดียวกันบนจอกว้าง จอแคบเป็นแถวแยกใต้การ์ด
     ไปที่หน้าพิมพ์เลขแล้วกด Enter — กดปุ่มทีละหน้าไปหน้า 40 ไม่ไหว */
function Pager({
  page,
  pages,
  size,
  onPage,
  onSize,
}: {
  page: number;
  pages: number;
  size: number;
  onPage: (p: number) => void;
  onSize: (n: number) => void;
}) {
  const [jump, setJump] = React.useState("");

  return (
    <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 @3xl:mt-0 @3xl:rounded-t-none">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>แถวต่อหน้า</span>
        <Select value={String(size)} onValueChange={(v) => onSize(Number(v))}>
          <SelectTrigger className="w-20 bg-card" aria-label="แถวต่อหน้า">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PAGE_SIZES.map((n) => (
              <SelectItem key={n} value={String(n)}>
                {n}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {/* TablePager ซ่อนตัวเองเมื่อมีหน้าเดียว — ช่องไปที่หน้าก็ไม่มีความหมาย */}
        <div className="[&>nav]:border-0 [&>nav]:p-0">
          <TablePager page={page} pages={pages} onChange={onPage} />
        </div>
        {pages > 1 && (
          <form
            className="flex items-center gap-2 text-sm text-muted-foreground"
            onSubmit={(e) => {
              e.preventDefault();
              const n = Number(jump);
              if (Number.isInteger(n) && n >= 1 && n <= pages) onPage(n);
              setJump("");
            }}
          >
            <Label htmlFor="pager-jump" className="font-normal">
              ไปที่หน้า
            </Label>
            <Input
              id="pager-jump"
              inputMode="numeric"
              className="w-16 bg-card"
              placeholder={String(page)}
              value={jump}
              onChange={(e) => setJump(e.target.value.replace(/\D/g, ""))}
            />
          </form>
        )}
      </div>
    </div>
  );
}
