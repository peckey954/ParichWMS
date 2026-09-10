"use client";

import * as React from "react";
import { ArrowRightIcon } from "lucide-react";
import { Badge } from "@peckey954/ui/components/ui/badge";
import { cn } from "@peckey954/ui/lib/utils";
import { SetupCrumbs } from "@/components/pr/setup-footer";
import { usePrSetup } from "@/components/pr/pr-setup-provider";
import { paginate, TablePager } from "@/components/stock/doc-parts";
import {
  formatChangeTime,
  SETUP_ACTION_LABEL,
  SETUP_SLICE_LABEL,
  type SetupAction,
} from "@/lib/pr-setup";

/* ------------------------------------------------------------------
   ประวัติการเปลี่ยนค่าตั้ง

   ไม่ใช่ log เผื่อไว้ — วันที่ของไปโผล่ผิดคลัง คำถามแรกคือ "ใครเปลี่ยนเส้นทางนี้
   ตอนไหน" ถ้าไม่เก็บก็ตอบไม่ได้เลย บรรทัด "เปลี่ยนคลังปลายทาง" จึงเน้นสีไว้
   เพราะเป็นตัวเดียวที่ทำให้ของไปโผล่คนละที่จริง ๆ

   ต่างจากประวัติในหน้าสต็อกที่เป็นการเคลื่อนไหวของ "ของ" — อันนี้เป็นการเปลี่ยน
   "ค่าตั้ง" คนละเรื่องกัน จึงอยู่คนละหน้า

   ไม่มี backend — ประวัติอยู่ในหน่วยความจำของเซสชันนี้ รีเฟรชแล้วหาย
------------------------------------------------------------------ */

const PAGE_SIZE = 25;

/** เน้นเฉพาะสองอันที่เปลี่ยนพฤติกรรมของระบบจริง ที่เหลือเป็นการจัดบ้าน */
const TONE: Partial<Record<SetupAction, string>> = {
  route: "[--bdg-surface:var(--chip-orange)] [--bdg-text:var(--chip-orange-foreground)]",
  delete: "[--bdg-surface:var(--chip-red)] [--bdg-text:var(--chip-red-foreground)]",
};

export default function ChangesPage() {
  const { changes } = usePrSetup();
  const [page, setPage] = React.useState(1);
  const { pages, safe, slice } = paginate(changes, page, PAGE_SIZE);

  return (
    <main className="mx-auto w-full max-w-7xl px-4 pt-3 pb-10 sm:px-6 sm:pt-5">
      <SetupCrumbs page="ประวัติการเปลี่ยนแปลง" />

      <div className="mt-2 sm:mt-3">
        <h1 className="text-2xl font-semibold tracking-tight">
          ประวัติการเปลี่ยนแปลง
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          ทุกการแก้ค่าตั้งค่าใบขอซื้อ เรียงใหม่สุดก่อน —
          ใช้ตอบว่าใครเปลี่ยนอะไรตอนไหน โดยเฉพาะเส้นทางเข้าคลังที่ทำให้ของไปโผล่คนละที่
        </p>
      </div>

      {changes.length === 0 ? (
        <p className="mt-5 rounded-xl border border-dashed border-border px-4 py-12 text-center text-sm text-muted-foreground">
          ยังไม่มีการเปลี่ยนแปลงในเซสชันนี้ — ลองแก้อะไรสักอย่างที่หน้าคลัง
          ประเภทสินค้า หมวด หรือสินค้า แล้วกลับมาดู
        </p>
      ) : (
        <div className="mt-5 overflow-hidden rounded-xl border border-border bg-card">
          {slice.map((c) => (
            <div
              key={c.id}
              className="grid gap-1.5 border-t border-border px-4 py-3.5 first:border-0 @3xl:grid-cols-[11rem_9rem_1fr_10rem] @3xl:items-baseline @3xl:gap-4"
            >
              <time className="text-sm text-muted-foreground tabular-nums">
                {formatChangeTime(c.at)}
              </time>

              <div>
                <Badge
                  appearance="soft"
                  className={cn("font-medium", TONE[c.action])}
                >
                  {SETUP_ACTION_LABEL[c.action]}
                </Badge>
              </div>

              <p className="min-w-0">
                <span className="text-muted-foreground">
                  {SETUP_SLICE_LABEL[c.slice] ?? c.slice}
                </span>
                {/* การเปลี่ยนชื่อเก็บ target เป็น id เพื่อยุบการพิมพ์รัว ๆ ให้เหลือ
                    รายการเดียว (ดู appendChange) ชื่อจริงอยู่ในคู่ from → to อยู่แล้ว
                    จึงไม่ต้องเอา id มาโชว์ให้อ่านไม่รู้เรื่อง */}
                {c.action !== "rename" && (
                  <>
                    <span className="text-muted-foreground"> · </span>
                    <span className="font-medium">{c.target}</span>
                  </>
                )}
                {(c.from || c.to) && (
                  <span className="mt-0.5 flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
                    {c.from && <span>{c.from}</span>}
                    <ArrowRightIcon className="size-3.5 shrink-0" />
                    {c.to ? (
                      <span className="text-foreground">{c.to}</span>
                    ) : (
                      <span>ปลดออก</span>
                    )}
                  </span>
                )}
              </p>

              <p className="text-sm text-muted-foreground @3xl:text-end">
                {c.actor}
              </p>
            </div>
          ))}
          <TablePager page={safe} pages={pages} onChange={setPage} />
        </div>
      )}
    </main>
  );
}
