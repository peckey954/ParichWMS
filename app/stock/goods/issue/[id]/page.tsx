"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ChevronDownIcon } from "lucide-react";
import { Button } from "@peckey954/ui/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@peckey954/ui/components/ui/collapsible";
import { toast } from "sonner";
import { Crumbs, Meta, Stat } from "@/components/receiving/parts";
import { LotPickFields, useLotPick } from "@/components/stock/lot-pick";
import {
  canIssue,
  closeGoodsIssue,
  formatQty,
  goodsIssueOf,
  requestIssueTab,
  type GoodsIssueDoc,
} from "@/lib/goods-issue";

/* ------------------------------------------------------------------
   จ่ายสินค้า — หนึ่งใบขอเบิก = สินค้าหนึ่งรายการ (Flow จ่ายออก ใน Figma)

   หัวใบบอกว่าต้องจ่ายอะไร เท่าไร ให้ใคร ข้างล่างคือ Lot ที่หยิบออกจริง
   สแกนป้ายหรือเลือกจากรายการ แล้วกรอกจำนวนชิ้นต่อ Lot

   ตัวเลขในกล่องส้มเปลี่ยนตาม Lot ที่เลือก เทียบกับยอดขอเบิกได้ทันที
   ว่าจ่ายครบหรือยัง โดยไม่ต้องบวกเลขในตารางเอง

   ใบภายนอกมีผู้รับ ทะเบียนรถ วันรถเข้า ใบภายใน (ส่งไลน์ผลิต) ไม่มี
   แต่มีสถานะการจ่าย ให้บันทึกได้ว่าจ่ายไม่ได้พร้อมเหตุผล
------------------------------------------------------------------ */

export default function GoodsIssuePage() {
  const { id } = useParams<{ id: string }>();
  const doc = goodsIssueOf(id);
  if (!doc || !canIssue(doc)) return <NotFound paid={Boolean(doc)} />;
  return <IssueSheet key={doc.id} doc={doc} />;
}

function IssueSheet({ doc }: { doc: GoodsIssueDoc }) {
  const router = useRouter();
  const state = useLotPick(doc);
  const picked = state.rows.length > 0;

  const internal = state.withOutcome;
  const u = state.byCount ? doc.unit : "ตัน";
  const fmt = (v: number) => formatQty(v, u);

  const save = () => {
    if (!state.canSubmit) return;
    closeGoodsIssue(doc.id);
    requestIssueTab();
    if (state.failed)
      toast.success("บันทึกไม่สามารถจ่ายได้", { description: `${doc.code} · ${state.note.trim()}` });
    else
      toast.success("จ่ายสินค้าสำเร็จ", {
        description: `${doc.code} · ${state.rows.length} Lot · ${fmt(state.totalOut)} ${u}`,
      });
    router.push("/stock/goods");
  };

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col">
      <main className="@container mx-auto w-full max-w-7xl flex-1 px-4 pt-6 pb-6 sm:px-6">
        <Crumbs trail={[{ label: "สต็อกสินค้า", href: "/stock/goods" }, { label: "จ่ายสินค้า" }]} />

        <h1 className="mt-4 text-2xl font-bold tracking-tight">
          จ่ายสินค้า <span className="whitespace-nowrap">{doc.code}</span>
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">{doc.createdAt}</p>

        {/* จอแคบหุบรายละเอียดได้ — กล่องส้มอยู่นอกส่วนที่หุบ เพราะต้องเทียบกับ
            Lot ข้างล่างตลอดทั้งหน้า จอกว้างเปิดค้างไว้และไม่มีปุ่มหุบ */}
        <Collapsible defaultOpen className="mt-5 rounded-xl border border-border bg-card px-4 py-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="font-semibold">{doc.productName}</span>
                {[doc.productType, doc.group, doc.packing].filter(Boolean).map((t) => (
                  <React.Fragment key={t}>
                    <span className="h-4 w-px bg-border" aria-hidden />
                    <span className="text-sm">{t}</span>
                  </React.Fragment>
                ))}
              </p>
              {doc.customer && !internal && <p className="text-sm font-semibold @3xl:hidden">{doc.customer}</p>}
            </div>
            {doc.customer && !internal && (
              <span className="hidden shrink-0 text-sm font-semibold @3xl:inline">{doc.customer}</span>
            )}
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="แสดง/ซ่อนรายละเอียด" className="group -mt-1 -mr-2 @3xl:hidden">
                <ChevronDownIcon className="size-5 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
              </Button>
            </CollapsibleTrigger>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4 rounded-xl border border-brand-hover bg-brand px-4 py-5 @3xl:grid-cols-3">
            <Stat label={`${internal ? "ขอเบิก" : "ปริมาณขอเบิก"} (${u})`} value={fmt(state.requested)} />
            <Stat label={`คงเหลือในคลัง (${u})`} value={picked ? fmt(state.stockOut) : "-"} />
            <Stat
              label={`รวมจ่ายออก (${u})`}
              value={picked && !state.failed ? fmt(state.totalOut) : "-"}
            />
          </div>

          <CollapsibleContent>
            {internal ? (
              <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
                <Meta label="ผู้ขอเบิก" value={doc.requester} />
                <Meta label="ผู้แก้ไขขอเบิกล่าสุด" value={doc.lastEditor ?? doc.editedBy} />
              </div>
            ) : (
              <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 @3xl:grid-cols-4">
                <Meta label="ทะเบียนรถ" value={doc.truck} />
                <Meta label="วันที่รถจะเข้า" value={doc.arriveDate} />
                <Meta label="ผู้ขอเบิก" value={doc.requester} />
                <Meta label="หมายเหตุจากผู้ขอเบิก" value={doc.requesterNote ?? doc.note} />
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>

        <div className="mt-4">
          <LotPickFields state={state} />
        </div>
      </main>

      {/* ---------- แถบล่าง ----------
           จอคอม: ย้อนกลับชิดซ้าย บันทึกชิดขวา มือถือ: สองปุ่มกว้างเท่ากัน */}
      <div className="sticky bottom-0 z-30 border-t border-border bg-surface">
        <div className="mx-auto w-full max-w-7xl px-4 py-3 sm:px-6">
          <div className="grid grid-cols-2 gap-3 sm:flex sm:justify-between">
            <Button variant="outline-primary" onClick={() => router.back()}>
              ย้อนกลับ
            </Button>
            <Button disabled={!state.canSubmit} onClick={save}>
              บันทึก
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function NotFound({ paid }: { paid: boolean }) {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 pt-6 pb-24 sm:px-6">
      <Crumbs trail={[{ label: "สต็อกสินค้า", href: "/stock/goods" }, { label: "จ่ายสินค้า" }]} />
      <div className="mt-10 rounded-xl border border-dashed border-border px-6 py-14 text-center">
        <p className="font-medium">{paid ? "ใบนี้จ่ายสินค้าไปแล้ว หรือไม่ใช่ใบจ่ายออก" : "ไม่พบใบขอเบิกนี้"}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {paid ? "ดูรายการที่ยังรอจ่ายได้ที่แท็บรอจ่าย/คืน" : "เอกสารอาจถูกลบหรือลิงก์ไม่ถูกต้อง"}
        </p>
        <Button asChild variant="outline-primary" className="mt-4">
          <Link href="/stock/goods">กลับไปหน้าสต็อกสินค้า</Link>
        </Button>
      </div>
    </main>
  );
}
