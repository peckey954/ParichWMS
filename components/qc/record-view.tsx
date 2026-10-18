"use client";

import * as React from "react";
import { CircleCheckIcon, CircleXIcon } from "lucide-react";
import { Badge } from "@peckey954/ui/components/ui/badge";
import { Ring } from "@/components/qc/record-calendar";
import {
  SOURCE,
  VERDICT_OPTION_LABEL,
  dispositionOf,
  paramOf,
  type DocField,
  type QiRow,
  type QiTemplate,
  type VerdictOption,
} from "@/lib/qc-erp";
import { thaiDate, type QcRecord } from "@/lib/qc-records";

/* ------------------------------------------------------------------
   ดูใบที่ทำแล้ว — ข้อความอ่านอย่างเดียว ไม่ใช่ฟอร์มที่กดเปลี่ยนได้

   คนเปิดจากปฏิทินหรือตารางส่วนใหญ่มาดูว่ารอบนั้นเป็นยังไง ไม่ได้มาแก้
   เปิดเป็นฟอร์มแล้วกดโดนปุ่มผลตรวจโดยไม่ตั้งใจได้ง่าย อยากแก้ต้องกดแก้ไขก่อน
------------------------------------------------------------------ */

export function VerdictBadge({ v }: { v: VerdictOption | "" | undefined }) {
  if (v === "pass")
    return (
      <Badge appearance="soft" tone="success">
        <CircleCheckIcon className="size-3.5" />
        ผ่าน
      </Badge>
    );
  if (v === "fail")
    return (
      <Badge appearance="soft" tone="danger">
        <CircleXIcon className="size-3.5" />
        ไม่ผ่าน
      </Badge>
    );
  return (
    <Badge appearance="soft" tone="neutral">
      <Ring state="missed" className="size-3.5" />
      {v === "na" ? "ไม่มี" : "ไม่ได้ตรวจ"}
    </Badge>
  );
}

const rowName = (row: QiRow) => {
  if (row.kind === "system") return row.source ? SOURCE[row.source].label : "-";
  const p = paramOf(row.parameterId);
  if (!p) return "-";
  return p.unit ? `${p.name} (${p.unit})` : p.name;
};

const fieldName = (f: DocField) =>
  f.kind === "system" ? (f.source ? SOURCE[f.source].label : "-") : f.label || "-";

function Item({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-0.5 font-medium">{value || "-"}</p>
    </div>
  );
}

export function RecordView({ tpl, rec }: { tpl: QiTemplate; rec: QcRecord }) {
  const fields = tpl.headerOn ? tpl.header : [];
  const disp = rec.disposition ? dispositionOf(rec.disposition)?.label : "";

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">
        ใบ{tpl.name} {rec.no}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {thaiDate(rec.date)} | {rec.time} · ผู้ตรวจสอบ {rec.by}
        {rec.editor && ` · แก้ไขล่าสุด: ${rec.editor}`}
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-semibold">การตรวจสอบ</h2>
        <span className="flex items-center gap-2 text-sm text-muted-foreground">
          ผลตรวจสอบ: <VerdictBadge v={rec.status} />
        </span>
      </div>

      {fields.length > 0 && (
        <div className="mt-3 grid gap-4 @2xl:grid-cols-3">
          {fields.map((f) => (
            <Item key={f.id} label={fieldName(f)} value={rec.header[f.id]} />
          ))}
        </div>
      )}

      <div className="mt-4 space-y-3">
        {tpl.rows.map((row, i) => {
          const v = rec.results[row.id];
          const val = rec.values[row.id];
          const reading =
            val?.nums?.filter(Boolean).join(" · ") || val?.text || val?.source || "";
          return (
            <section key={row.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="font-semibold">
                  {i + 1}. {rowName(row)}
                </p>
                <VerdictBadge v={v} />
              </div>
              <div className="mt-3 grid gap-3 @2xl:grid-cols-[14rem_1fr]">
                <Item
                  label="ผลการตรวจสอบ"
                  value={
                    reading
                      ? `${reading}${v ? ` — ${VERDICT_OPTION_LABEL[v as VerdictOption]}` : ""}`
                      : v
                        ? VERDICT_OPTION_LABEL[v as VerdictOption]
                        : "-"
                  }
                />
                <Item label="หมายเหตุ" value={val?.remark} />
              </div>
            </section>
          );
        })}
      </div>

      {disp && (
        <div className="mt-5">
          <Item label="ประเภทการรับสินค้า กรณีไม่ผ่านข้อใดข้อหนึ่ง" value={disp} />
        </div>
      )}
      <div className="mt-5">
        <Item label="หมายเหตุ" value={rec.note} />
      </div>
    </>
  );
}
