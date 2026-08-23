import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRightIcon } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@peckey954/ui/components/ui/breadcrumb";
import { Button } from "@peckey954/ui/components/ui/button";
import { cn } from "@peckey954/ui/lib/utils";
import { SlotBadge } from "@/components/qc/slot-mark";
import {
  CHECK_SHEETS,
  MATERIALS,
  MONTH_NAMES,
  SHIFTS,
  SHIFT_LABEL,
  answerOf,
  isHoliday,
  sheetStatus,
  slotStatus,
} from "@/lib/qc-check";

/* ------------------------------------------------------------------
   หนึ่งวันในปฏิทิน — กดจากช่องวันแล้วมาที่นี่

   หน้านี้ตอบว่า "วันนี้กะไหนทำแล้ว กะไหนยัง" ซึ่งเป็นสิ่งที่ปฏิทินบอกได้แค่ด้วยจุด
   กะที่ยังไม่มีใบก็ขึ้นเป็นการ์ดพร้อมปุ่มเปิดใบ ไม่ใช่หายไปเฉย ๆ
   เพราะช่องว่างคือสิ่งที่ต้องเห็น ไม่ใช่สิ่งที่ต้องซ่อน
------------------------------------------------------------------ */

const thaiDate = (date: string) => {
  const [y, m, d] = date.split("-").map(Number);
  return `${d} ${MONTH_NAMES[m - 1]} ${y + 543}`;
};

export default async function CheckDayPage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = await params;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) notFound();

  const holiday = isHoliday(date);

  return (
    <main className="@container mx-auto w-full max-w-4xl px-4 py-6 sm:px-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/qc/checks">QC ตรวจสอบ</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/qc/checks/material">
              ตรวจวัตถุดิบในถัง
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="text-primary">
              {thaiDate(date)}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <h1 className="mt-4 text-2xl font-semibold tracking-tight">
        {thaiDate(date)}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {holiday ? "วันหยุด ไม่ต้องตรวจ" : "ตรวจวัตถุดิบในถัง ทั้งกะเช้าและกะบ่าย"}
      </p>

      <div className="mt-6 space-y-3">
        {SHIFTS.map((s) => {
          const { status, sheet } = slotStatus(CHECK_SHEETS, date, s.id);
          const st = sheet ? sheetStatus(sheet) : null;

          return (
            <div
              key={s.id}
              className={cn(
                "rounded-xl border border-border bg-card p-4",
                status === "missing" && "border-destructive"
              )}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="font-semibold">กะ{s.label}</p>
                <SlotBadge status={status} />
              </div>

              {sheet ? (
                <>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {sheet.code} · {sheet.tank} · {sheet.inspector}
                    {sheet.savedAt && ` · บันทึกเมื่อ ${sheet.savedAt}`}
                  </p>

                  {/* รายการที่ผิดปกติขึ้นมาเลย ไม่ต้องเข้าไปหาในใบ
                      เพราะนั่นคือเหตุผลเดียวที่คนเปิดหน้าวันนี้ดู */}
                  {MATERIALS.filter(
                    (m) => answerOf(sheet, m).result === "abnormal"
                  ).map((m) => (
                    <p key={m} className="mt-2 text-sm text-danger-strong">
                      {m} ผิดปกติ — {answerOf(sheet, m).note || "ไม่ได้ระบุเหตุผล"}
                    </p>
                  ))}

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                    <span className="text-sm text-muted-foreground">
                      ตรวจแล้ว {st!.done}/{st!.total} รายการ
                    </span>
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/qc/checks/material/${sheet.id}`}>
                        ดูใบตรวจ
                        <ChevronRightIcon />
                      </Link>
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {status === "holiday"
                      ? "วันหยุด ไม่ต้องเปิดใบ"
                      : status === "future"
                        ? "ยังไม่ถึงวัน"
                        : "ยังไม่มีใบตรวจของกะนี้"}
                  </p>
                  {status !== "holiday" && (
                    <div className="mt-3 flex justify-end">
                      <Button asChild size="sm">
                        <Link
                          href={`/qc/checks/material/new?date=${date}&shift=${s.id}`}
                        >
                          เปิดใบตรวจกะ{SHIFT_LABEL[s.id]}
                        </Link>
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </main>
  );
}
