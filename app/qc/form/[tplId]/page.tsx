"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  CircleCheckIcon,
  CircleXIcon,
  ListFilterIcon,
  PlusIcon,
  SearchIcon,
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
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@peckey954/ui/components/ui/input-group";
import { Label } from "@peckey954/ui/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@peckey954/ui/components/ui/tabs";
import { cn } from "@peckey954/ui/lib/utils";
import { ChipGroup } from "@/components/chip-group";
import { DateSelect, formatDateSlash } from "@/components/date-select";
import { RecordCalendar } from "@/components/qc/record-calendar";
import { ROW_HOVER_NAV, TablePager, paginate } from "@/components/stock/doc-parts";
import {
  SOURCE,
  paramOf,
  reportTypeOf,
  templateOf,
  type QiRow,
  type VerdictOption,
} from "@/lib/qc-erp";
import { recordsOf, thaiDate, type QcRecord } from "@/lib/qc-records";

/* ------------------------------------------------------------------
   หน้าเมนูของรายงานที่วาดจากเทมเพลต — กดการ์ดจากหน้าหลักแล้วมาที่นี่

   สองแท็บ
     ปฏิทิน   รายงานที่เปิดตามรอบเวลา หนึ่งวงกลมต่อหนึ่งรอบ กดวันดูทีละรอบ
     รายการ   ใบที่ทำแล้วทั้งหมด หนึ่งคอลัมน์ต่อหนึ่งหัวข้อตรวจ

   รายงานที่ไม่ได้เปิดตามรอบไม่มีปฏิทิน มีแต่รายการ

   ปุ่มตรวจสอบไม่ถามว่ารอบไหน — อ่านจากเวลาที่กด ถ้ารอบนั้นตรวจไปแล้ว
   เปิดใบเดิมขึ้นมาแทนการได้ใบที่สองของรอบเดียวกัน
------------------------------------------------------------------ */

type Tab = "calendar" | "list";
type ResultFilter = "all" | "pass" | "fail";

const rowHead = (r: QiRow) => {
  if (r.kind === "system") return r.source ? SOURCE[r.source].label : "-";
  const p = paramOf(r.parameterId);
  if (!p) return "-";
  return p.unit ? `${p.name} (${p.unit})` : p.name;
};

function Mark({ v }: { v: VerdictOption | "" | undefined }) {
  if (v === "pass")
    return <CircleCheckIcon aria-label="ผ่าน" className="size-5 text-success-strong" strokeWidth={1.5} />;
  if (v === "fail")
    return <CircleXIcon aria-label="ไม่ผ่าน" className="size-5 text-danger-strong" strokeWidth={1.5} />;
  // ไม่มี / ยังไม่ได้ตรวจข้อนี้ — วงกลมเส้นประ
  return (
    <span
      aria-label={v === "na" ? "ไม่มี" : "ไม่ได้ตรวจ"}
      className="inline-block size-5 rounded-full border-[1.5px] border-dashed border-muted-foreground"
    />
  );
}

function Result({ r }: { r: QcRecord }) {
  return r.status === "pass" ? (
    <Badge appearance="soft" tone="success">
      <CircleCheckIcon className="size-3.5" />
      ผ่าน
    </Badge>
  ) : (
    <Badge appearance="soft" tone="danger">
      <CircleXIcon className="size-3.5" />
      ไม่ผ่าน
    </Badge>
  );
}

const count99 = (n: number) => (n > 99 ? "99+" : String(n));

export default function TemplateMenuPage() {
  const router = useRouter();
  const { tplId } = useParams<{ tplId: string }>();
  const tpl = templateOf(tplId);
  const recurring = !!tpl?.schedule.recurring && tpl.schedule.slots.length > 0;
  const [tab, setTab] = React.useState<Tab>(recurring ? "calendar" : "list");
  const [cancelled, setCancelled] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [date, setDate] = React.useState<Date | undefined>();
  const [result, setResult] = React.useState<ResultFilter>("all");
  const [page, setPage] = React.useState(1);

  if (!tpl) {
    return (
      <main className="mx-auto w-full max-w-lg px-4 py-20 text-center">
        <p className="font-medium">ไม่พบรายงานนี้</p>
        <Button asChild variant="outline-primary" className="mt-4">
          <Link href="/">กลับหน้าหลัก</Link>
        </Button>
      </main>
    );
  }

  const all = recordsOf(tpl.id);
  const active = all.filter((r) => !r.cancelled);
  const voided = all.filter((r) => r.cancelled);
  const q = query.trim().toLowerCase();
  const day = date ? formatDateSlash(date) : "";
  const rows = (cancelled ? voided : active).filter(
    (r) =>
      (!q ||
        r.no.toLowerCase().includes(q) ||
        r.note.toLowerCase().includes(q) ||
        r.by.toLowerCase().includes(q)) &&
      (!day || thaiDate(r.date) === day) &&
      (result === "all" || r.status === result)
  );
  const { pages, safe, slice } = paginate(rows, page, 10);
  const reset = <T,>(set: (v: T) => void) => (v: T) => {
    set(v);
    setPage(1);
  };
  const open = (r: QcRecord) => router.push(`/qc/form/${tpl.id}/${r.id}`);

  return (
    <main className="@container mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">หน้าหลัก</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="text-primary">{tpl.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">{tpl.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {[tpl.code, reportTypeOf(tpl.reportType)?.label].filter(Boolean).join(" · ")}
          </p>
        </div>
        <Button onClick={() => router.push(`/qc/form/${tpl.id}/new`)}>
          <PlusIcon />
          ตรวจสอบ
        </Button>
      </div>

      {recurring && (
        <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)} className="mt-5">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="calendar">ปฏิทิน</TabsTrigger>
            <TabsTrigger value="list">รายการ ({count99(active.length)})</TabsTrigger>
          </TabsList>
        </Tabs>
      )}

      {tab === "calendar" && recurring ? (
        <div className="mt-4">
          <RecordCalendar tpl={tpl} />
        </div>
      ) : (
        <>
          <div className="mt-4 flex flex-wrap items-center gap-2 @3xl:flex-nowrap">
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
                className="min-w-0 flex-1 @3xl:w-64 @3xl:flex-none"
                placeholder="วันที่"
                value={date}
                onValueChange={reset(setDate)}
              />
              <ResultFilterButton value={result} onApply={reset(setResult)} />
            </div>
          </div>

          <ChipGroup
            className="mt-3"
            label="สถานะใบตรวจ"
            value={cancelled ? "void" : "ok"}
            onChange={(v) => reset(setCancelled)(v === "void")}
            options={[
              { id: "ok" as const, label: `รายการ (${count99(active.length)})` },
              { id: "void" as const, label: `ยกเลิก (${voided.length})` },
            ]}
          />

          {rows.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-border px-6 py-14 text-center">
              <p className="font-medium">ไม่มีใบตรวจ</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {q || day || result !== "all"
                  ? "ไม่มีใบที่ตรงกับที่ค้นหา"
                  : "กดตรวจสอบเพื่อเริ่มใบแรก"}
              </p>
            </div>
          ) : (
            <>
              {/* จอแคบ — การ์ดทีละใบ หัวข้อเรียงลงพร้อมผล */}
              <div className="mt-4 grid gap-3 @3xl:hidden">
                {slice.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => open(r)}
                    className="rounded-xl border border-border bg-card p-4 text-left active:bg-accent"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="font-semibold">{r.no}</span>
                      <span className="text-sm text-muted-foreground">
                        {thaiDate(r.date)} | {r.time}
                      </span>
                    </div>
                    <dl className="mt-3 space-y-1.5 text-sm">
                      {tpl.rows.map((row) => (
                        <div key={row.id} className="flex items-center justify-between gap-3">
                          <dt className="text-muted-foreground">{rowHead(row)}:</dt>
                          <dd>
                            <Mark v={r.results[row.id]} />
                          </dd>
                        </div>
                      ))}
                      <div className="flex justify-between gap-3">
                        <dt className="text-muted-foreground">หมายเหตุ:</dt>
                        <dd className="text-right">{r.note || "-"}</dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt className="text-muted-foreground">ผู้ตรวจสอบ:</dt>
                        <dd className="font-medium">{r.by}</dd>
                      </div>
                    </dl>
                    <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-sm">
                      <span className="text-muted-foreground">ผลตรวจสอบ:</span>
                      <Result r={r} />
                    </div>
                  </button>
                ))}
              </div>

              {/* จอกว้าง — หนึ่งคอลัมน์ต่อหนึ่งหัวข้อ เลขใบตรึงซ้าย ผลตรึงขวา */}
              <div className="mt-4 hidden overflow-x-auto rounded-t-xl border border-b-0 border-border bg-card @3xl:block">
                <table className="w-full min-w-[960px] text-sm">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground">
                      <th className="sticky left-0 z-10 bg-card px-4 py-3 text-left font-normal">
                        เลขที่ใบตรวจสอบ
                      </th>
                      {tpl.rows.map((row) => (
                        <th key={row.id} className="px-3 py-3 text-center font-normal">
                          {rowHead(row)}
                        </th>
                      ))}
                      <th className="px-3 py-3 text-left font-normal">หมายเหตุ</th>
                      <th className="min-w-40 px-3 py-3 text-left font-normal">ผู้ตรวจสอบ</th>
                      <th className="sticky right-0 z-10 bg-card px-4 py-3 text-left font-normal whitespace-nowrap">
                        ผลตรวจสอบ
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {slice.map((r) => (
                      <tr
                        key={r.id}
                        onClick={() => open(r)}
                        className={cn("cursor-pointer border-b border-border last:border-0", ROW_HOVER_NAV)}
                      >
                        <td className="sticky left-0 z-10 bg-card px-4 py-3 group-hover:bg-surface">
                          <span className="block font-medium">{r.no}</span>
                          <span className="block whitespace-nowrap text-muted-foreground">
                            {thaiDate(r.date)} | {r.time}
                          </span>
                        </td>
                        {tpl.rows.map((row) => (
                          <td key={row.id} className="px-3 py-3 text-center">
                            <span className="inline-flex">
                              <Mark v={r.results[row.id]} />
                            </span>
                          </td>
                        ))}
                        <td className="max-w-48 truncate px-3 py-3">{r.note || "-"}</td>
                        <td className="px-3 py-3">
                          <span className="block font-medium">{r.by}</span>
                          {r.editor && (
                            <span className="block text-muted-foreground">
                              แก้ไขล่าสุด: {r.editor}
                            </span>
                          )}
                        </td>
                        <td className="sticky right-0 z-10 bg-card px-4 py-3 group-hover:bg-surface">
                          <Result r={r} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-3 rounded-xl border border-border bg-card @3xl:mt-0 @3xl:rounded-t-none [&>nav]:border-0">
                <TablePager page={safe} pages={pages} onChange={setPage} />
                {pages <= 1 && (
                  <p className="px-4 py-3 text-center text-sm text-muted-foreground">
                    {rows.length} ใบ
                  </p>
                )}
              </div>
            </>
          )}
        </>
      )}
    </main>
  );
}

/* ตัวกรองกลางจอ ชุดเดียวกับหน้าอื่น — จุดบนปุ่มบอกว่ามีอะไรถูกเปลี่ยนไว้ */
function ResultFilterButton({
  value,
  onApply,
}: {
  value: ResultFilter;
  onApply: (v: ResultFilter) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState(value);
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) setDraft(value);
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline-primary" size="icon" aria-label="ตัวกรอง" className="relative shrink-0">
          <ListFilterIcon />
          {value !== "all" && (
            <span className="absolute top-1 right-1 size-2 rounded-full bg-primary" />
          )}
        </Button>
      </DialogTrigger>
      <DialogContent aria-describedby={undefined} className="sm:max-w-md">
        <DialogHeader className="text-left">
          <DialogTitle>ตัวกรอง</DialogTitle>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label>ผลตรวจสอบ</Label>
          <ChipGroup
            label="ผลตรวจสอบ"
            value={draft}
            onChange={setDraft}
            options={[
              { id: "all" as const, label: "ทั้งหมด" },
              { id: "pass" as const, label: "ผ่าน" },
              { id: "fail" as const, label: "ไม่ผ่าน" },
            ]}
          />
        </div>
        <DialogFooter className="flex-row justify-between gap-2 sm:justify-between">
          <Button variant="ghost" onClick={() => setDraft("all")}>
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
