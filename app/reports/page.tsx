"use client";

import * as React from "react";
import {
  DownloadIcon,
  SearchIcon,
  TriangleAlertIcon,
} from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@peckey954/ui/components/ui/breadcrumb";
import { Button } from "@peckey954/ui/components/ui/button";
import { Checkbox } from "@peckey954/ui/components/ui/checkbox";
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
import { cn } from "@peckey954/ui/lib/utils";
import { toast } from "sonner";
import { HistoryPanel, type HistoryEntry } from "@/components/reports/history-panel";
import { RangePicker } from "@/components/reports/range-picker";
import { Stat } from "@/components/reports/report-parts";
import { ReportTable } from "@/components/reports/report-table";
import { TypeList } from "@/components/reports/type-list";
import {
  FORMATS,
  REPORT_TYPES,
  buildCsv,
  fileName,
  formatBaht,
  formatCount,
  formatRange,
  getReportType,
  inRange,
  matchesRow,
  presetRange,
  rowsFor,
  type FormatId,
  type PresetId,
  type Range,
} from "@/lib/reports";

/* ------------------------------------------------------------------
   ส่งออกรายงาน — หน้าที่ฝ่ายบัญชีเปิดค้างไว้ทั้งวัน

   ลำดับการใช้งานจริงมีสี่จังหวะ วางหน้าตามลำดับนั้นจากซ้ายไปขวา บนลงล่าง
     1. เลือกชนิดเอกสาร     → แถบซ้าย ค้างไว้ตลอด
     2. เลือกงวด            → แถบเครื่องมือบนสุด ค่าเริ่มต้นคือเดือนที่แล้ว
     3. กระทบยอดก่อนโหลด    → แถบตัวเลขสรุป + คำเตือนใบที่ยังไม่สมบูรณ์
     4. ดาวน์โหลด           → ปุ่มหลัก บอกจำนวนใบที่จะได้ไว้บนปุ่มเลย

   สิ่งที่ตั้งใจไม่ทำ — ไม่มีปุ่ม "ส่งออกทั้งหมดทุกชนิด" ในปุ่มเดียว
   เพราะเอกสารแต่ละชนิดคนละคอลัมน์ รวมไฟล์เดียวแล้วใช้งานไม่ได้จริง
------------------------------------------------------------------ */

const ACTOR = "อลิสา พรสุขสิริ";

export default function ReportsPage() {
  const [typeId, setTypeId] = React.useState("po");
  const [preset, setPreset] = React.useState<PresetId>("lastMonth");
  const [range, setRange] = React.useState<Range>(presetRange("lastMonth"));
  const [query, setQuery] = React.useState("");
  const [format, setFormat] = React.useState<FormatId>("csv");
  const [includeDraft, setIncludeDraft] = React.useState(false);
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [history, setHistory] = React.useState<HistoryEntry[]>([]);

  const type = getReportType(typeId)!;

  // เอกสารทั้งหมดของชนิดนี้ สร้างครั้งเดียวต่อชนิด ไม่สร้างใหม่ทุกครั้งที่เลื่อนวัน
  const all = React.useMemo(() => rowsFor(typeId), [typeId]);

  const inPeriod = React.useMemo(
    () => all.filter((r) => inRange(r.date, range)),
    [all, range]
  );

  const drafts = inPeriod.filter((r) => r.status === "draft");

  /** แถวที่จะเอาไปออกไฟล์จริง — กรองฉบับร่างออกก่อนเป็นค่าเริ่มต้น */
  const exportable = React.useMemo(
    () => inPeriod.filter((r) => includeDraft || r.status !== "draft"),
    [inPeriod, includeDraft]
  );

  /** แถวที่โชว์ในตาราง คำค้นมีผลกับสายตาเท่านั้น ไม่ตัดของออกจากไฟล์ */
  const visible = React.useMemo(
    () => exportable.filter((r) => matchesRow(r, query)),
    [exportable, query]
  );

  // จำนวนของแต่ละชนิดในงวดเดียวกัน ใช้โชว์ข้างชื่อในแถบซ้าย
  const counts = React.useMemo(() => {
    const out: Record<string, number> = {};
    for (const t of REPORT_TYPES) {
      out[t.id] = rowsFor(t.id).filter((r) => inRange(r.date, range)).length;
    }
    return out;
  }, [range]);

  /** ไม่ติ๊กอะไรเลย = เอาทั้งงวด ซึ่งเป็นสิ่งที่คนต้องการเกือบทุกครั้ง */
  const picked = selected.size > 0
    ? exportable.filter((r) => selected.has(r.id))
    : exportable;

  const totalAmount = picked.reduce((sum, r) => sum + (r.amount ?? 0), 0);

  const clearSelection = () => setSelected(new Set());

  const changeType = (id: string) => {
    setTypeId(id);
    clearSelection();
  };

  const changeRange = (p: PresetId, r: Range) => {
    setPreset(p);
    setRange(r);
    clearSelection();
  };

  const toggleRow = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleAll = () =>
    setSelected((prev) =>
      visible.every((r) => prev.has(r.id))
        ? new Set()
        : new Set(visible.map((r) => r.id))
    );

  const download = () => {
    if (picked.length === 0) return;

    const name = fileName(type, range, format);
    // CSV สร้างไฟล์จริงให้เลย อีกสองแบบต้องต่อกับหลังบ้านก่อน
    if (format === "csv") {
      const blob = new Blob([buildCsv(type, picked)], {
        type: "text/csv;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("ดาวน์โหลดแล้ว", {
        description: `${type.label} ${formatCount(picked.length)} ใบ`,
      });
    } else {
      toast.info("กำลังเตรียมไฟล์", {
        description: `${type.label} ${formatCount(picked.length)} ใบ — ระบบจะส่งลิงก์ให้เมื่อเสร็จ`,
      });
    }

    const now = new Date();
    const p = (n: number) => String(n).padStart(2, "0");
    setHistory((prev) => [
      {
        id: `${Date.now()}`,
        typeLabel: type.label,
        range: formatRange(range),
        rows: picked.length,
        format: FORMATS.find((f) => f.id === format)!.label,
        fileName: name,
        at: `${p(now.getDate())}/${p(now.getMonth() + 1)}/${now.getFullYear()} ${p(now.getHours())}:${p(now.getMinutes())}`,
        by: ACTOR,
      },
      ...prev,
    ]);
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
        <TypeList value={typeId} onChange={changeType} counts={counts} />

        <div className="min-w-0 space-y-4">
          {/* ---------- แถบเครื่องมือ ---------- */}
          <section className="rounded-xl border border-border bg-card p-4">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h2 className="text-lg font-semibold">{type.label}</h2>
              <span className="text-sm text-muted-foreground">{type.code}</span>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <RangePicker
                preset={preset}
                range={range}
                onChange={changeRange}
              />

              <Select
                value={format}
                onValueChange={(v) => setFormat(v as FormatId)}
              >
                <SelectTrigger className="w-56 bg-card">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FORMATS.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* ปุ่มหลัก บอกจำนวนใบไว้บนปุ่ม จะได้ไม่ต้องเดาว่ากดแล้วได้อะไร */}
              <Button
                size="lg"
                className="ml-auto"
                onClick={download}
                disabled={picked.length === 0}
              >
                <DownloadIcon />
                ดาวน์โหลด {formatCount(picked.length)} ใบ
              </Button>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
              <div className="min-w-56 flex-1">
                <InputGroup className="bg-card">
                  <InputGroupAddon align="inline-start">
                    <SearchIcon />
                  </InputGroupAddon>
                  <InputGroupInput
                    placeholder={`ค้นหาเลขที่เอกสาร หรือ${type.partyLabel}...`}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </InputGroup>
              </div>

              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={includeDraft}
                  onCheckedChange={(v) => {
                    setIncludeDraft(v === true);
                    clearSelection();
                  }}
                />
                รวมฉบับร่างด้วย
              </label>

              {selected.size > 0 && (
                <Button variant="ghost" size="sm" onClick={clearSelection}>
                  ล้างที่เลือก ({selected.size})
                </Button>
              )}
            </div>

            {query.trim() !== "" && (
              <p className="mt-2 text-sm text-muted-foreground">
                คำค้นกรองเฉพาะที่แสดงในตาราง
                ไฟล์ที่ดาวน์โหลดยังได้ครบทั้งงวดตามที่เลือกไว้
              </p>
            )}
          </section>

          {/* ---------- ตัวเลขสรุปไว้กระทบยอด ---------- */}
          <div className="grid grid-cols-2 gap-3 @3xl:grid-cols-4">
            <Stat
              label={selected.size > 0 ? "เอกสารที่เลือก" : "เอกสารในงวด"}
              value={formatCount(picked.length)}
              suffix="ใบ"
            />
            <Stat
              label="มูลค่ารวม"
              value={type.hasAmount ? formatBaht(totalAmount) : "-"}
              suffix={type.hasAmount ? "บาท" : undefined}
            />
            {/* ช่วงวันที่ยาวกว่าช่องอื่น จอแคบให้กินสองคอลัมน์ไปเลย จะได้ไม่โดนตัด */}
            <Stat
              label="ช่วงวันที่"
              value={formatRange(range)}
              long
              className="col-span-2 @3xl:col-span-1"
            />
            <Stat
              label="ยังไม่สมบูรณ์"
              value={formatCount(drafts.length)}
              suffix="ใบ"
              tone={drafts.length > 0 ? "warning" : undefined}
            />
          </div>

          {/* ---------- คำเตือนฉบับร่าง ----------
              เรื่องนี้ต้องเด้งใส่หน้า ไม่ใช่ซ่อนในตาราง
              ใบที่ยังไม่ปิดหลุดเข้าไปในงวดแล้วแก้ทีหลังยากมาก */}
          {drafts.length > 0 && (
            <div
              className={cn(
                "flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border p-4",
                includeDraft
                  ? "border-chip-yellow-foreground/40 bg-chip-yellow"
                  : "border-border bg-card"
              )}
            >
              <TriangleAlertIcon className="size-5 shrink-0" strokeWidth={1.5} />
              <p className="min-w-0 flex-1 text-sm">
                งวดนี้มี{type.label}
                <span className="font-semibold"> {drafts.length} ใบ</span>{" "}
                ที่ยังเป็นฉบับร่าง{" "}
                {includeDraft
                  ? "ตอนนี้รวมอยู่ในไฟล์ที่จะดาวน์โหลดด้วย"
                  : "ไม่ได้รวมอยู่ในไฟล์ที่จะดาวน์โหลด"}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIncludeDraft((v) => !v);
                  clearSelection();
                }}
              >
                {includeDraft ? "ไม่รวมฉบับร่าง" : "รวมฉบับร่างด้วย"}
              </Button>
            </div>
          )}

          <ReportTable
            type={type}
            rows={visible}
            selected={selected}
            onToggle={toggleRow}
            onToggleAll={toggleAll}
          />

          <HistoryPanel
            entries={history}
            onRepeat={(e) =>
              toast.info("ดาวน์โหลดซ้ำ", { description: e.fileName })
            }
          />
        </div>
      </div>
    </main>
  );
}
