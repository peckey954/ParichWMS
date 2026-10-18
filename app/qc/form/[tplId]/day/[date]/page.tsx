"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { CircleCheckIcon, CircleXIcon } from "lucide-react";
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
import { cn } from "@peckey954/ui/lib/utils";
import { Ring, STATE_LABEL } from "@/components/qc/record-calendar";
import { shiftLabel, templateOf } from "@/lib/qc-erp";
import { docNo, recordAt, slotState, thaiDate } from "@/lib/qc-records";

/* ------------------------------------------------------------------
   รอบของวันหนึ่ง — มาจากการกดวันในปฏิทิน

   หนึ่งการ์ดต่อหนึ่งรอบ รอบล่าสุดอยู่บน เพราะคนเปิดหน้านี้มักมาดูรอบที่เพิ่ง
   ผ่านไป รอบที่ตรวจแล้วกดเข้าไปดูใบ รอบที่ไม่มีใบบอกว่าไม่ได้ตรวจ และรอบ
   ที่กำลังเดินของวันนี้กดไปตรวจได้เลย
------------------------------------------------------------------ */

export default function DayPage() {
  const router = useRouter();
  const { tplId, date } = useParams<{ tplId: string; date: string }>();
  const tpl = templateOf(tplId);

  if (!tpl || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return (
      <main className="mx-auto w-full max-w-lg px-4 py-20 text-center">
        <p className="font-medium">ไม่พบข้อมูลวันนี้</p>
        <Button asChild variant="outline-primary" className="mt-4">
          <Link href={tpl ? `/qc/form/${tpl.id}` : "/"}>ย้อนกลับ</Link>
        </Button>
      </main>
    );
  }

  const [y, m, d] = date.split("-").map(Number);
  const day = new Date(y, m - 1, d);
  const slots = tpl.schedule.slots;
  const order = slots.map((s, i) => ({ s, i })).reverse();
  const isToday = isSameDay(day, new Date());

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
              <BreadcrumbLink href={`/qc/form/${tpl.id}`}>{tpl.name}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-primary">ใบ{tpl.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <h1 className="mt-4 text-2xl font-semibold tracking-tight">
          ใบ{tpl.name} {docNo(date, 0).split("/")[0]}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{thaiDate(date)}</p>

        <ul className="mt-5 grid gap-3 @3xl:grid-cols-2">
          {order.map(({ s, i }) => {
            const rec = recordAt(tpl.id, date, s.id);
            const st = slotState(tpl, day, s);
            const canDo = !rec && isToday && st === "future";
            const card = (
              <>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold">{rec?.no ?? docNo(date, i)}</p>
                    <p className="text-sm text-muted-foreground">
                      ช่วงที่ {i + 1} · {shiftLabel(s)}
                    </p>
                  </div>
                  <span className="text-sm text-muted-foreground tabular-nums">
                    {rec?.time ?? "-"}
                  </span>
                </div>
                <dl className="mt-3 text-sm">
                  <div className="flex justify-between gap-3 border-b border-border pb-3">
                    <dt className="text-muted-foreground">ผู้ตรวจสอบ:</dt>
                    <dd className="font-medium">{rec?.by ?? "-"}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3 pt-3">
                    <dt className="text-muted-foreground">ผลตรวจสอบ:</dt>
                    <dd>
                      {rec ? (
                        rec.status === "pass" ? (
                          <Badge appearance="soft" tone="success">
                            <CircleCheckIcon className="size-3.5" />
                            ผ่าน
                          </Badge>
                        ) : (
                          <Badge appearance="soft" tone="danger">
                            <CircleXIcon className="size-3.5" />
                            ไม่ผ่าน
                          </Badge>
                        )
                      ) : canDo ? (
                        <span className="font-medium text-primary">ตรวจสอบ</span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          <Ring state={st} className="size-3.5" />
                          {STATE_LABEL[st]}
                        </span>
                      )}
                    </dd>
                  </div>
                </dl>
              </>
            );
            const cls = "block rounded-xl border border-border bg-card p-4 shadow-xs";
            const link = "transition-colors hover:border-primary hover:bg-brand";
            return (
              <li key={s.id}>
                {rec ? (
                  <Link href={`/qc/form/${tpl.id}/${rec.id}`} className={cn(cls, link)}>
                    {card}
                  </Link>
                ) : canDo ? (
                  <Link href={`/qc/form/${tpl.id}/new`} className={cn(cls, link)}>
                    {card}
                  </Link>
                ) : (
                  <div className={cls}>{card}</div>
                )}
              </li>
            );
          })}
        </ul>
      </main>

      <div className="sticky bottom-0 z-30 border-t border-border bg-surface">
        <div className="mx-auto w-full max-w-6xl px-4 py-3 sm:px-6">
          <Button
            variant="outline-primary"
            className="w-full sm:w-auto"
            onClick={() => router.push(`/qc/form/${tpl.id}`)}
          >
            ย้อนกลับ
          </Button>
        </div>
      </div>
    </>
  );
}

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();
