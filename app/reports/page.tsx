"use client";

import * as React from "react";
import { DownloadIcon, SearchIcon } from "lucide-react";
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
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@peckey954/ui/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@peckey954/ui/components/ui/select";
import { toast } from "sonner";
import { DateRangeSelect, type DateRange } from "@/components/date-select";
import { ReportTable } from "@/components/reports/report-table";
import { TypeList } from "@/components/reports/type-list";
import {
  DOC_STATUS_LABEL,
  REPORT_TYPES,
  buildCsv,
  fileName,
  formatCount,
  getReportType,
  inRange,
  matchesRow,
  presetRange,
  rowsFor,
  type DocStatus,
  type Range,
} from "@/lib/reports";

/* ------------------------------------------------------------------
   ส่งออกรายงาน — หน้าที่ฝ่ายบัญชีเปิดค้างไว้ทั้งวัน

   ลำดับการใช้งานจริงมีสามจังหวะ วางหน้าตามลำดับนั้นจากซ้ายไปขวา บนลงล่าง
     1. เลือกชนิดเอกสาร → แถบซ้าย ค้างไว้ตลอด
     2. กรองให้เหลือเท่าที่ต้องการ → คำค้น สถานะ และช่วงวันที่
     3. ส่งออก → ปุ่มหลักมุมขวาบน ได้ทุกใบที่ผ่านตัวกรองตอนนั้น

   ตัวกรองคือสิ่งเดียวที่กำหนดขอบเขตไฟล์ ไม่มีการติ๊กเลือกทีละใบซ้อนเข้ามาอีกชั้น
   มีสถานะเดียวให้จำ คนอ่านหน้าจอแล้วรู้ทันทีว่ากดส่งออกจะได้อะไร
   จำนวนใบจึงเขียนไว้ข้างชื่อชนิดเอกสารบนหัวข้อ ไม่ใช่ซ่อนอยู่ในปุ่ม

   สิ่งที่ตั้งใจไม่ทำ — ไม่มีปุ่ม "ส่งออกทั้งหมดทุกชนิด" ในปุ่มเดียว
   เพราะเอกสารแต่ละชนิดคนละคอลัมน์ รวมไฟล์เดียวแล้วใช้งานไม่ได้จริง
------------------------------------------------------------------ */

type StatusFilter = DocStatus | "all";

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "ทุกสถานะ" },
  { value: "complete", label: DOC_STATUS_LABEL.complete },
  { value: "draft", label: DOC_STATUS_LABEL.draft },
  { value: "cancelled", label: DOC_STATUS_LABEL.cancelled },
];

const toDate = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
};

const toIso = (d: Date) => {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

export default function ReportsPage() {
  const [typeId, setTypeId] = React.useState("pr");
  const [query, setQuery] = React.useState("");
  const [status, setStatus] = React.useState<StatusFilter>("all");
  // ค่าเริ่มต้นคือเดือนที่แล้ว เพราะงานหลักของหน้านี้คือปิดงวดตอนต้นเดือน
  // ถ้าตั้งเป็นเดือนนี้จะได้ข้อมูลไม่ครบงวดแทบทุกครั้ง
  const [period, setPeriod] = React.useState<DateRange>(() => {
    const r = presetRange("lastMonth");
    return { from: toDate(r.from), to: toDate(r.to) };
  });

  const type = getReportType(typeId)!;

  /** ช่วงวันที่ที่กรองจริง — เลือกค้างไว้ครึ่งเดียวถือว่ายังไม่กรอง
   *  ต้อง memo ไว้ ไม่งั้นอ็อบเจกต์ใหม่ทุกเรนเดอร์จะทำให้ตัวนับข้างล่าง
   *  ไล่สร้างเอกสารทุกชนิดใหม่หมดทุกครั้งที่พิมพ์คำค้นหนึ่งตัวอักษร */
  const range = React.useMemo<Range | null>(
    () =>
      period.from && period.to
        ? { from: toIso(period.from), to: toIso(period.to) }
        : null,
    [period.from, period.to]
  );

  // เอกสารทั้งหมดของชนิดนี้ สร้างครั้งเดียวต่อชนิด ไม่สร้างใหม่ทุกครั้งที่เลื่อนวัน
  const all = React.useMemo(() => rowsFor(typeId), [typeId]);

  /** แถวที่ผ่านตัวกรองครบทุกช่อง — ทั้งที่โชว์ในตารางและที่จะออกไปเป็นไฟล์ */
  const visible = React.useMemo(
    () =>
      all.filter(
        (r) =>
          (range === null || inRange(r.date, range)) &&
          (status === "all" || r.status === status) &&
          matchesRow(r, query)
      ),
    [all, range, status, query]
  );

  // จำนวนของแต่ละชนิดในงวดเดียวกัน ใช้โชว์ข้างชื่อในแถบซ้าย
  const counts = React.useMemo(() => {
    const out: Record<string, number> = {};
    for (const t of REPORT_TYPES) {
      const rows = rowsFor(t.id);
      out[t.id] =
        range === null
          ? rows.length
          : rows.filter((r) => inRange(r.date, range)).length;
    }
    return out;
  }, [range]);

  const exportCsv = () => {
    if (visible.length === 0) return;

    const name = fileName(type, range ?? { from: "ทั้งหมด", to: "ทั้งหมด" });
    const blob = new Blob([buildCsv(type, visible)], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);

    toast.success("ส่งออกรายงานแล้ว", {
      description: `${type.label} ${formatCount(visible.length)} รายงาน`,
    });
  };

  return (
    <main className="mx-auto w-full max-w-[1600px] px-4 py-4 sm:px-6 sm:py-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">ระบบ</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="text-primary">ส่งออกรายงาน</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mt-2 sm:mt-3">
        <h1 className="text-2xl font-semibold tracking-tight">ส่งออกรายงาน</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          ดึงเอกสารจากทุกโมดูลออกเป็นไฟล์ เลือกชนิดเอกสารและงวด
          ตรวจยอดให้ตรงก่อนแล้วค่อยดาวน์โหลด
        </p>
      </div>

      <div className="mt-5 grid gap-4 @3xl:grid-cols-[280px_minmax(0,1fr)]">
        <TypeList value={typeId} onChange={setTypeId} counts={counts} />

        <section className="min-w-0 rounded-xl border border-border bg-card p-4">
          {/* ---------- หัวข้อ: ชนิดเอกสารที่เลือก + จำนวนที่จะได้ ---------- */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-baseline gap-x-2">
              <h2 className="text-lg font-semibold">{type.label}</h2>
              <span className="text-sm text-muted-foreground">
                ({formatCount(visible.length)} รายงาน)
              </span>
            </div>
            {/* ปุ่มหลัก หยิบทุกใบที่ผ่านตัวกรองตอนนั้น ไม่ใช่เฉพาะหน้าที่เห็น */}
            <Button onClick={exportCsv} disabled={visible.length === 0}>
              <DownloadIcon />
              ส่งออกรายงาน
            </Button>
          </div>

          {/* ---------- ตัวกรอง ---------- */}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <div className="min-w-56 flex-1">
              <InputGroup className="bg-card">
                <InputGroupAddon align="inline-start">
                  <SearchIcon />
                </InputGroupAddon>
                <InputGroupInput
                  aria-label={`ค้นหาใน${type.label}`}
                  placeholder="ค้นหา..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </InputGroup>
            </div>

            <Select
              value={status}
              onValueChange={(v) => setStatus(v as StatusFilter)}
            >
              <SelectTrigger className="w-full bg-card @xl:w-56">
                <SelectValue placeholder="เลือกสถานะ" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <DateRangeSelect
              value={period}
              onValueChange={(r) => setPeriod(r ?? { from: undefined })}
              placeholder="เลือกช่วงวันที่"
              className="w-full @xl:w-72"
            />
          </div>

          <div className="mt-4">
            <ReportTable type={type} rows={visible} />
          </div>
        </section>
      </div>
    </main>
  );
}
