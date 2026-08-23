"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeftIcon, ChevronRightIcon, DownloadIcon } from "lucide-react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@peckey954/ui/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@peckey954/ui/components/ui/tabs";
import { cn } from "@peckey954/ui/lib/utils";
import { toast } from "sonner";
import { SlotBadge, SlotCell, SlotDot } from "@/components/qc/slot-mark";
import {
  COL_FIRST,
  HEAD_FIRST,
  STICKY_HEAD,
  TableFrame,
} from "@/components/stock/doc-parts";
import {
  CHECK_SHEETS,
  MATERIALS,
  SHIFTS,
  shiftLabel,
  TODAY,
  WEEKDAYS,
  isHoliday,
  leadingBlanks,
  monthDays,
  monthLabel,
  monthSummary,
  sheetStatus,
  slotStatus,
  type Shift,
} from "@/lib/qc-check";

/* ------------------------------------------------------------------
   ใบตรวจวัตถุดิบในถัง — สามมุมมองของข้อมูลชุดเดียวกัน

   ภาพรวมเดือน  ปฏิทิน ตอบว่า "วันไหนขาด" ในจอเดียว ใช้ได้ทั้งเว็บและมือถือ
   ตาราง        แบบฟอร์มกระดาษ ตอบว่า "รายการไหนขาด" เฉพาะจอกว้าง
   รายการใบ     ใบที่ทำไปแล้ว จอกว้างเป็นตาราง จอแคบเป็นการ์ด

   สิ่งที่ทำให้ฟอร์มกระดาษมีค่าคือช่องว่าง ไม่ใช่ช่องที่กรอก
   มันพิมพ์วันที่ 1–31 ไว้ล่วงหน้า กวาดตาลงมาเห็นเลยว่าวันไหนไม่มีใครทำ
   ทุกมุมมองที่นี่จึงสร้างวันให้ครบทั้งเดือนก่อน แล้วค่อยเอาใบไปเติม
   ไม่ใช่ไล่จากใบที่มีอยู่ ซึ่งจะโชว์ได้แต่สิ่งที่ทำไปแล้ว
------------------------------------------------------------------ */

export default function MaterialCheckPage() {
  const router = useRouter();
  // สิงหาคม 2026 คือเดือนที่มีข้อมูลตัวอย่าง
  const [year, setYear] = React.useState(2026);
  const [month, setMonth] = React.useState(7);

  const days = monthDays(year, month);
  const sum = monthSummary(CHECK_SHEETS, year, month);

  const shiftMonth = (delta: number) => {
    const m = month + delta;
    if (m < 0) {
      setYear(year - 1);
      setMonth(11);
    } else if (m > 11) {
      setYear(year + 1);
      setMonth(0);
    } else setMonth(m);
  };

  return (
    <main className="@container mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/qc/checks">QC ตรวจสอบ</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="text-primary">
              ตรวจวัตถุดิบในถัง
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            ตรวจวัตถุดิบในถัง
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            FM-QC-02-05 · ตรวจทุกกะ วันละ {SHIFTS.length} กะ
          </p>
        </div>
        <Button onClick={() => router.push("/qc/checks/material/new")}>
          เปิดใบตรวจของวันนี้
        </Button>
      </div>

      {/* ---------- เลือกเดือน + สรุป ---------- */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            aria-label="เดือนก่อนหน้า"
            onClick={() => shiftMonth(-1)}
          >
            <ChevronLeftIcon />
          </Button>
          <span className="min-w-40 text-center font-semibold">
            {monthLabel(year, month)}
          </span>
          <Button
            variant="outline"
            size="icon"
            aria-label="เดือนถัดไป"
            onClick={() => shiftMonth(1)}
          >
            <ChevronRightIcon />
          </Button>
        </div>

        {/* ตัวเลขที่ต้องรีบเห็นคือจำนวนกะที่ขาด ไม่ใช่จำนวนที่ทำแล้ว */}
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="success" appearance="soft">
            ตรวจแล้ว {sum.done}
          </Badge>
          {sum.abnormal > 0 && (
            <Badge tone="danger" appearance="soft">
              ผิดปกติ {sum.abnormal}
            </Badge>
          )}
          {sum.partial > 0 && (
            <Badge tone="warning" appearance="soft">
              ไม่ครบ {sum.partial}
            </Badge>
          )}
          <Badge tone={sum.missing > 0 ? "danger" : "neutral"} appearance={sum.missing > 0 ? "solid" : "soft"}>
            ขาด {sum.missing}
          </Badge>
          <span className="text-sm text-muted-foreground">
            วันหยุด {sum.holiday} วัน
          </span>
        </div>
      </div>

      <Tabs defaultValue="calendar" className="mt-4 gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TabsList>
            <TabsTrigger value="calendar">ภาพรวมเดือน</TabsTrigger>
            {/* ตารางกว้าง 15 คอลัมน์ บนมือถือเลื่อนหาช่องนานกว่าดูปฏิทิน */}
            <TabsTrigger value="grid" className="hidden @3xl:inline-flex">
              ตาราง
            </TabsTrigger>
            <TabsTrigger value="list">รายการใบ</TabsTrigger>
          </TabsList>

          {/* ไฟล์ไว้เก็บแฟ้มกับส่งผู้ตรวจสอบ ไม่ใช่ตัวที่ใช้เช็กว่าวันไหนขาด */}
          <Button
            variant="outline-primary"
            onClick={() =>
              toast.success("กำลังสร้างไฟล์", {
                description: `ใบตรวจวัตถุดิบ ${monthLabel(year, month)} — รูปแบบเดียวกับฟอร์มกระดาษ`,
              })
            }
          >
            <DownloadIcon />
            ดาวน์โหลด
          </Button>
        </div>

        <TabsContent value="calendar">
          <MonthCalendar year={year} month={month} days={days} />
        </TabsContent>

        <TabsContent value="grid">
          <SheetGrid days={days} />
        </TabsContent>

        <TabsContent value="list">
          <SheetList days={days} />
        </TabsContent>
      </Tabs>
    </main>
  );
}

// ---------------------------------------------------------------

/**
 * ปฏิทินเดือน — หนึ่งช่องต่อหนึ่งวัน จุดข้างในหนึ่งจุดต่อหนึ่งกะ
 * ตอบคำถามเดียวคือ "วันไหนขาด" ซึ่งเป็นคำถามที่ถามบ่อยที่สุด
 * และเป็นมุมมองเดียวที่ลงจอมือถือได้ทั้งเดือนโดยไม่ต้องเลื่อนแนวนอน
 */
function MonthCalendar({
  year,
  month,
  days,
}: {
  year: number;
  month: number;
  days: string[];
}) {
  const blanks = leadingBlanks(year, month);

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="grid grid-cols-7 gap-1 text-center text-sm text-muted-foreground">
        {WEEKDAYS.map((w) => (
          <span key={w} className="py-1">
            {w}
          </span>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1">
        {Array.from({ length: blanks }, (_, i) => (
          <span key={`b-${i}`} />
        ))}

        {days.map((date) => {
          const holiday = isHoliday(date);
          const slots = SHIFTS.map((s) => ({
            shift: s.id,
            ...slotStatus(CHECK_SHEETS, date, s.id),
          }));
          const anyMissing = slots.some((s) => s.status === "missing");
          const anyBad = slots.some((s) => s.status === "abnormal");
          const isToday = date === TODAY;

          return (
            <Link
              key={date}
              href={`/qc/checks/material/day/${date}`}
              className={cn(
                "flex min-h-16 flex-col items-center gap-1.5 rounded-lg border p-2 transition-colors",
                "focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
                holiday
                  ? "border-transparent bg-muted text-muted-foreground"
                  : "border-border bg-card hover:bg-accent-hover",
                // วันที่ขาดขึ้นขอบแดงทั้งช่อง ไม่ใช่แค่จุดเล็ก ๆ ข้างใน
                // เพราะสิ่งที่ต้องเห็นตั้งแต่กวาดตาครั้งแรกคือช่องที่มีปัญหา
                anyMissing && "border-destructive bg-danger/40",
                anyBad && !anyMissing && "border-danger-border",
                isToday && "ring-2 ring-primary"
              )}
            >
              <span className="text-sm font-medium tabular-nums">
                {Number(date.slice(-2))}
              </span>
              {/* สี่กะเรียงสองแถวสองคอลัมน์ ไม่ใช่เรียงยาวสี่จุด
                  ช่องวันบนมือถือกว้างราว 48px สี่จุดเรียงกันจะชนขอบ
                  และเรียงเป็นตารางยังอ่านง่ายกว่าว่ากลางวันแถวบน กลางคืนแถวล่าง */}
              {!holiday && (
                <span className="grid grid-cols-2 gap-x-1.5 gap-y-1">
                  {slots.map((s) => (
                    <SlotDot
                      key={s.shift}
                      status={s.status}
                      title={`${shiftLabel(s.shift)} — ${s.status}`}
                    />
                  ))}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      <Legend />
    </div>
  );
}

function Legend() {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border pt-3 text-sm text-muted-foreground">
      <span className="flex items-center gap-1.5">
        <SlotDot status="done" title="ตรวจแล้ว" />
        ตรวจแล้ว
      </span>
      <span className="flex items-center gap-1.5">
        <SlotDot status="abnormal" title="ผิดปกติ" />
        ผิดปกติ
      </span>
      <span className="flex items-center gap-1.5">
        <SlotDot status="partial" title="ตรวจไม่ครบ" />
        ตรวจไม่ครบ
      </span>
      <span className="flex items-center gap-1.5">
        <SlotDot status="missing" title="ไม่ได้ตรวจ" />
        ไม่ได้ตรวจ
      </span>
      <span className="tabular-nums">
        สี่จุดเรียงจากซ้ายบน ={" "}
        {SHIFTS.map((s) => `${s.from}–${s.to}`).join(" · ")}
      </span>
    </div>
  );
}

/**
 * ตารางแบบฟอร์มกระดาษ — แถวเป็นวันที่ คอลัมน์เป็นวัตถุดิบ × กะ
 * ใช้ตอนอยากรู้ว่า "รายการไหน" ขาด ไม่ใช่แค่ "วันไหน"
 * วันหยุดกินทั้งแถวเป็นแถบเทา ตรงกับแถวเทาในฟอร์มกระดาษ
 */
function SheetGrid({ days }: { days: string[] }) {
  return (
    <>
      <p className="mb-2 text-sm text-muted-foreground tabular-nums">
        ในแต่ละช่อง สี่เครื่องหมายเรียงจากซ้ายบน ={" "}
        {SHIFTS.map((s) => `${s.from}–${s.to}`).join(" · ")}
      </p>
      <TableFrame>
      <Table>
        <TableHeader className={cn(STICKY_HEAD, "[&_th]:leading-snug")}>
          <TableRow>
            <TableHead className={cn(HEAD_FIRST, "min-w-28")}>วันที่</TableHead>
            {MATERIALS.map((m) => (
              <TableHead key={m} className="min-w-24 text-center">
                {m}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {days.map((date) => {
            const holiday = isHoliday(date);
            const label = `${Number(date.slice(-2))}/${Number(date.slice(5, 7))}/${Number(date.slice(0, 4)) + 543}`;

            if (holiday)
              return (
                <TableRow key={date} className="bg-muted">
                  <TableCell className={cn(COL_FIRST, "tabular-nums")}>
                    {label}
                  </TableCell>
                  <TableCell
                    colSpan={MATERIALS.length}
                    className="text-center text-sm text-muted-foreground"
                  >
                    วันหยุด
                  </TableCell>
                </TableRow>
              );

            return (
              <TableRow key={date}>
                <TableCell className={cn(COL_FIRST, "tabular-nums")}>
                  {label}
                </TableCell>
                {MATERIALS.map((mat) => (
                  <TableCell key={mat} className="text-center">
                    {/* สี่กะเรียงสองแถวเหมือนในปฏิทิน คอลัมน์จึงยังเป็นหนึ่งคอลัมน์ต่อวัตถุดิบ
                        ไม่ใช่แตกเป็นเจ็ดคูณสี่ยี่สิบแปดคอลัมน์ซึ่งกว้างจนใช้ไม่ได้ */}
                    <span className="inline-grid grid-cols-2 gap-x-3 gap-y-0.5">
                      {SHIFTS.map((s) => (
                        <CellMark
                          key={s.id}
                          date={date}
                          shift={s.id}
                          material={mat}
                        />
                      ))}
                    </span>
                  </TableCell>
                ))}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableFrame>
    </>
  );
}

/** ช่องเดียวในตาราง — ดูผลของวัตถุดิบตัวนั้นในกะนั้น */
function CellMark({
  date,
  shift,
  material,
}: {
  date: string;
  shift: Shift;
  material: string;
}) {
  const { status, sheet } = slotStatus(CHECK_SHEETS, date, shift);
  if (!sheet) return <SlotCell status={status} />;

  const a = sheet.answers[material];
  if (!a || a.result === null) return <SlotCell status="missing" />;
  return <SlotCell status={a.result === "abnormal" ? "abnormal" : "done"} />;
}

/**
 * รายการใบ — จอกว้างเป็นตาราง จอแคบเป็นการ์ด
 * ไล่จากวันในเดือนเหมือนกัน ใบที่ยังไม่มีก็ขึ้นแถวว่างพร้อมปุ่มเปิดใบ
 * ไม่ใช่ไล่จากใบที่มีอยู่ ซึ่งจะไม่มีทางเห็นวันที่ขาด
 */
function SheetList({ days }: { days: string[] }) {
  const rows = days
    .filter((d) => !isHoliday(d))
    .flatMap((date) =>
      SHIFTS.map((s) => ({
        date,
        shift: s.id,
        ...slotStatus(CHECK_SHEETS, date, s.id),
      }))
    )
    .filter((r) => r.status !== "future")
    .reverse();

  return (
    <>
      {/* จอแคบ — การ์ด */}
      <div className="space-y-3 @3xl:hidden">
        {rows.map((r) => (
          <div
            key={`${r.date}-${r.shift}`}
            className="rounded-xl border border-border bg-card p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-medium tabular-nums">
                {r.date} · กะ {shiftLabel(r.shift)}
              </span>
              <SlotBadge status={r.status} />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {r.sheet
                ? `${r.sheet.tank} · ${sheetStatus(r.sheet).done}/${MATERIALS.length} รายการ · ${r.sheet.inspector}`
                : "ยังไม่มีใบตรวจ"}
            </p>
            <div className="mt-3">
              <Button asChild variant="outline" size="sm" className="w-full">
                <Link
                  href={
                    r.sheet
                      ? `/qc/checks/material/${r.sheet.id}`
                      : `/qc/checks/material/new?date=${r.date}&shift=${r.shift}`
                  }
                >
                  {r.sheet ? "ดูใบตรวจ" : "เปิดใบตรวจ"}
                </Link>
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* จอกว้าง — ตาราง */}
      <div className="hidden @3xl:block">
        <TableFrame>
          <Table>
            <TableHeader className={STICKY_HEAD}>
              <TableRow>
                <TableHead className={cn(HEAD_FIRST, "min-w-36")}>
                  วันที่
                </TableHead>
                <TableHead className="min-w-20">กะ</TableHead>
                <TableHead className="min-w-32">ถัง</TableHead>
                <TableHead className="min-w-28 text-right">รายการ</TableHead>
                <TableHead className="min-w-32">สถานะ</TableHead>
                <TableHead className="min-w-40">ผู้ตรวจ</TableHead>
                <TableHead className="min-w-40">บันทึกเมื่อ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => {
                const href = r.sheet
                  ? `/qc/checks/material/${r.sheet.id}`
                  : `/qc/checks/material/new?date=${r.date}&shift=${r.shift}`;
                return (
                  <TableRow key={`${r.date}-${r.shift}`}>
                    <TableCell className={cn(COL_FIRST, "tabular-nums")}>
                      <Link href={href} className="font-medium hover:underline">
                        {r.date}
                      </Link>
                    </TableCell>
                    <TableCell className="tabular-nums whitespace-nowrap">{shiftLabel(r.shift)}</TableCell>
                    <TableCell className="text-sm">
                      {r.sheet?.tank ?? "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {r.sheet
                        ? `${sheetStatus(r.sheet).done}/${MATERIALS.length}`
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <SlotBadge status={r.status} />
                    </TableCell>
                    <TableCell className="text-sm">
                      {r.sheet?.inspector || "—"}
                    </TableCell>
                    {/* บันทึกเมื่อคือเวลาที่กดจริง ต่างจากวันที่ของกะ
                        ใบที่กรอกย้อนหลังจะเห็นได้จากคอลัมน์นี้ */}
                    <TableCell className="text-sm tabular-nums">
                      {r.sheet?.savedAt ?? "—"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableFrame>
      </div>
    </>
  );
}
