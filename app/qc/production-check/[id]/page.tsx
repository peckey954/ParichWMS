"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  CheckIcon,
  CircleCheckIcon,
  CircleXIcon,
  LockIcon,
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
import { Label } from "@peckey954/ui/components/ui/label";
import { Textarea } from "@peckey954/ui/components/ui/textarea";
import { cn } from "@peckey954/ui/lib/utils";
import { toast } from "sonner";
import { CheckChip } from "@/components/check-chip";
import { rowTitle } from "@/components/qc/check-table";
import {
  PROD_STEP,
  INSPECTION_TYPE_VALUE,
} from "@/lib/qc-erp";
import {
  checkpointStateOf,
  checkpointsOfQueue,
  currentCheckpoint,
  demoTemplate,
  lotOf,
  nextQiName,
  saveStage,
  type Checkpoint,
  type Lot,
} from "@/lib/qc-production-demo";

/* ------------------------------------------------------------------
   ใบสั่งผลิตหนึ่งใบ — log ของทุกขั้น และฟอร์มของขั้นที่ถึงคิว

   ที่ต้องเห็น log ทั้งสามขั้นในหน้าเดียว เพราะสามใบตรวจนั้นอ้างใบสั่งผลิต
   ใบเดียวกัน แต่ ERPNext เก็บเป็นสามเอกสารแยกกัน ถ้าไม่รวมให้ตรงนี้
   คนจะต้องไปไล่เปิดทีละใบจากรายการ Quality Inspection เอง

   และ update_qc_reference เขียนทับช่อง quality_inspection ที่เอกสารต้นทาง
   ทุกครั้งที่ submit ใบใหม่ — ลิงก์ย้อนกลับจึงเหลือใบล่าสุดใบเดียวเสมอ
   หน้านี้จึงเป็นที่เดียวที่เห็นครบทั้งสามใบ
------------------------------------------------------------------ */

export default function ProductionCheckDetailPage() {
  const params = useParams<{ id: string }>();
  const search = useSearchParams();
  const router = useRouter();
  const [, bump] = React.useReducer((n: number) => n + 1, 0);

  const lot = lotOf(params.id);
  const tpl = demoTemplate();

  if (!lot || !tpl) {
    return (
      <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6">
        <div className="mt-10 rounded-xl border border-dashed border-border px-6 py-14 text-center">
          <p className="font-medium">ไม่พบใบสั่งผลิตนี้</p>
          <Button asChild variant="outline-primary" className="mt-4">
            <Link href="/qc/production-check">กลับไปหน้ารายการ</Link>
          </Button>
        </div>
      </main>
    );
  }

  const points = checkpointsOfQueue();
  const open = currentCheckpoint(lot);
  // กดชิปมาจากรายการ = เจาะมาดูจุดนั้น ไม่ได้ส่งมา = ดูจุดที่ถึงคิว
  const want = search.get("at");
  const focus = points.find((c) => c.key === want) ?? open;

  return (
    <main className="@container mx-auto w-full max-w-5xl px-4 py-6 sm:px-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/qc/production-check">ตรวจสอบสินค้าสำเร็จรูป</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{lot.code}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">{lot.code}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {lot.line} · รอบ{lot.round} · {lot.material} {lot.materialNote} ·{" "}
            {lot.ton.toFixed(2)} ตัน
          </p>
        </div>
        {open === null ? (
          <Badge appearance="soft" tone="success">
            <CircleCheckIcon className="size-3.5" />
            ตรวจครบทุกขั้นแล้ว
          </Badge>
        ) : (
          <Badge appearance="soft" tone="warning">
            เหลืออีก {points.filter((c) => !lot.done[c.key]).length} จุด
          </Badge>
        )}
      </div>

      {/* ---------- log ของทุกขั้น ---------- */}
      <h2 className="mt-6 font-semibold">ประวัติการตรวจ</h2>
      <p className="mt-0.5 mb-3 text-sm text-muted-foreground">
        หนึ่งจุด = หนึ่งใบตรวจของ ERPNext · ทั้งหมดอ้างใบสั่งผลิต {lot.code}{" "}
        ใบเดียวกัน
      </p>

      <ol className="space-y-3">
        {points.map((c, i) => (
          <StageLogItem
            key={c.key}
            lot={lot}
            point={c}
            index={i + 1}
            focused={c.key === focus?.key}
          />
        ))}
      </ol>

      {/* ---------- ฟอร์มของขั้นที่ถึงคิว ---------- */}
      {focus && !lot.done[focus.key] && (
        <StageForm
          lot={lot}
          point={focus}
          onSaved={() => {
            bump();
            router.replace(`/qc/production-check/${lot.id}`);
          }}
        />
      )}
    </main>
  );
}

/* ------------------------------------------------------------------
   หนึ่งบรรทัดใน log — ขั้นที่ตรวจแล้วโชว์ผล ขั้นที่ยังไม่ถึงบอกว่าติดอะไร
------------------------------------------------------------------ */

function StageLogItem({
  lot,
  point,
  index,
  focused,
}: {
  lot: Lot;
  point: Checkpoint;
  index: number;
  focused: boolean;
}) {
  const state = checkpointStateOf(lot, point);
  const res = lot.done[point.key];

  return (
    <li
      className={cn(
        "rounded-xl border p-4",
        focused ? "border-primary bg-brand" : "border-border bg-card"
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span
            className={cn(
              "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full text-sm",
              state === "done" && res?.verdict === "pass" &&
                "bg-success text-success-strong",
              state === "done" && res?.verdict === "fail" &&
                "bg-danger text-danger-strong",
              state === "current" && "bg-primary text-primary-foreground",
              state === "locked" && "border border-border text-muted-foreground"
            )}
          >
            {state === "done" ? <CheckIcon className="size-3.5" /> : index}
          </span>

          <div className="min-w-0">
            <p className="font-medium">{point.label}</p>
            {/* ป้ายช่วงการตรวจที่ ERPNext จะแปะให้ — สามขั้นนี้ได้คนละค่ากัน
                ซึ่งเป็นตัวที่ใช้แยกว่าใบไหนเป็นขั้นไหนโดยไม่ต้องสร้างฟิลด์เพิ่ม */}
            <p className="mt-0.5 font-mono text-xs text-muted-foreground">
              {PROD_STEP[point.step].doc} · inspection_type ={" "}
              {INSPECTION_TYPE_VALUE[PROD_STEP[point.step].actualType]}
            </p>

            {res && (
              <p className="mt-1.5 text-sm text-muted-foreground">
                {res.qi} · {res.at} · {res.by}
              </p>
            )}
            {res?.failed.length ? (
              <p className="mt-1 text-sm text-danger-strong">
                ไม่ผ่าน: {res.failed.join(" · ")}
              </p>
            ) : null}
            {res?.note ? (
              <p className="mt-1 text-sm text-muted-foreground">
                หมายเหตุ: {res.note}
              </p>
            ) : null}

            {state === "locked" && (
              <p className="mt-1.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                <LockIcon className="size-3.5" />
                ยังไม่ถึงคิว — ต้องตรวจขั้นก่อนหน้าให้เสร็จก่อน
              </p>
            )}
          </div>
        </div>

        {res && (
          <Badge
            appearance="soft"
            tone={res.verdict === "pass" ? "success" : "danger"}
          >
            {res.verdict === "pass" ? (
              <CircleCheckIcon className="size-3.5" />
            ) : (
              <CircleXIcon className="size-3.5" />
            )}
            {res.verdict === "pass" ? "ผ่าน" : "ไม่ผ่าน"}
          </Badge>
        )}
        {state === "current" && (
          <Badge appearance="soft" tone="brand">
            ถึงคิวแล้ว
          </Badge>
        )}
      </div>
    </li>
  );
}

/* ------------------------------------------------------------------
   ฟอร์มตรวจของขั้นที่ถึงคิว — หัวข้อมาจากเทมเพลตเดียวกันทุกขั้น

   สามขั้นใช้เทมเพลตอันเดียว ไม่ได้สร้างแยกจุดละอัน เพราะเทมเพลตเอาไปใช้
   กี่ใบก็ได้ แก้ทีเดียวจึงเปลี่ยนครบทุกขั้น
------------------------------------------------------------------ */

function StageForm({
  lot,
  point,
  onSaved,
}: {
  lot: Lot;
  point: Checkpoint;
  onSaved: () => void;
}) {
  const tpl = demoTemplate();
  const [marks, setMarks] = React.useState<Record<string, "pass" | "fail">>({});
  const [note, setNote] = React.useState("");

  if (!tpl) return null;
  const rows = tpl.rows;
  const keyed = rows.filter((r) => marks[r.id]).length;
  const failed = rows.filter((r) => marks[r.id] === "fail");
  // ไม่ผ่านข้อเดียว = ทั้งใบไม่ผ่าน ตรงกับ inspect_and_set_status ของ ERPNext
  const verdict = failed.length > 0 ? "fail" : "pass";

  const save = () => {
    if (keyed < rows.length) {
      toast.error(`ยังตรวจไม่ครบ — เหลืออีก ${rows.length - keyed} ข้อ`);
      return;
    }
    saveStage(lot.id, point.key, {
      qi: nextQiName(),
      at: new Date().toLocaleString("th-TH", {
        dateStyle: "short",
        timeStyle: "short",
      }),
      by: "อลิสา พรสุขสิริ",
      verdict,
      failed: failed.map((r) => rowTitle(r)),
      note: note.trim(),
    });
    toast.success(`บันทึก${point.label}แล้ว`, {
      description:
        verdict === "pass"
          ? "ผ่านทุกข้อ — จุดถัดไปเปิดให้ตรวจแล้ว"
          : `ไม่ผ่าน ${failed.length} ข้อ — จุดถัดไปยังเปิดให้ตรวจต่อได้`,
    });
    onSaved();
  };

  return (
    <section className="mt-6 rounded-2xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-semibold">ตรวจ{point.label}</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {rows.length} หัวข้อ จากเทมเพลต {tpl.name}
          </p>
        </div>
        {keyed > 0 && (
          <Badge
            appearance="soft"
            tone={
              keyed < rows.length ? "neutral" : verdict === "pass" ? "success" : "danger"
            }
          >
            {keyed < rows.length
              ? `คีย์แล้ว ${keyed}/${rows.length}`
              : verdict === "pass"
                ? "ผ่านทุกข้อ"
                : `ไม่ผ่าน ${failed.length} ข้อ`}
          </Badge>
        )}
      </div>

      <div className="mt-4 space-y-3">
        {rows.map((r, i) => (
          <div key={r.id} className="rounded-xl border border-border p-4">
            <p className="font-medium">
              {i + 1}. {rowTitle(r) || "ยังไม่ได้เลือกหัวข้อ"}
            </p>
            {r.criteria && (
              <p className="mt-0.5 text-sm text-muted-foreground">
                เกณฑ์: {r.criteria}
              </p>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              {(["pass", "fail"] as const).map((v) => (
                <CheckChip
                  key={v}
                  id={`${r.id}-${v}`}
                  label={v === "pass" ? "ผ่าน" : "ไม่ผ่าน"}
                  checked={marks[r.id] === v}
                  onChange={(on) =>
                    setMarks((p) => {
                      const next = { ...p };
                      if (on) next[r.id] = v;
                      else delete next[r.id];
                      return next;
                    })
                  }
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 space-y-1.5">
        <Label htmlFor="stage-note">
          หมายเหตุ{" "}
          <span className="font-normal text-muted-foreground">(ไม่บังคับ)</span>
        </Label>
        <Textarea
          id="stage-note"
          className="bg-card"
          rows={3}
          value={note}
          placeholder="ระบุหมายเหตุ"
          onChange={(e) => setNote(e.target.value)}
        />
      </div>

      {/* ไม่ผ่านแล้วยังเดินต่อได้ เพราะของที่ตกขั้นแรกอาจแก้แล้วผลิตต่อจริง
          การบล็อกจะทำให้ล็อตนั้นค้างในคิวตลอดไปทั้งที่หน้างานเดินไปแล้ว */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          ไม่ผ่านข้อเดียวถือว่าทั้งใบไม่ผ่าน ตรงกับ inspect_and_set_status
          ของ ERPNext — แต่จุดถัดไปยังเปิดให้ตรวจต่อ
        </p>
        <Button onClick={save}>บันทึก{point.label}</Button>
      </div>
    </section>
  );
}
