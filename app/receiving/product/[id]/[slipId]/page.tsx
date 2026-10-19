"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { EllipsisVerticalIcon, PencilIcon, Trash2Icon } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@peckey954/ui/components/ui/alert-dialog";
import { Badge } from "@peckey954/ui/components/ui/badge";
import { Button } from "@peckey954/ui/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@peckey954/ui/components/ui/dropdown-menu";
import { toast } from "sonner";
import { ChipGroup } from "@/components/chip-group";
import { Crumbs, FooterBar, Meta, ProductLine, Stat } from "@/components/receiving/parts";
import {
  DOC_TITLE,
  EDIT_DAYS,
  ROLE_LABEL,
  canEditSlip,
  currentRole,
  docOf,
  formatAt,
  formatTons,
  setRole,
  slipOf,
  updateSlip,
  type Role,
} from "@/lib/goods-receiving";

/* ------------------------------------------------------------------
   ดูการรับเข้าหนึ่งสลิง — ข้อความอ่านอย่างเดียว

   คลังแก้ได้ภายในสามวันหลังรับ (ปุ่มดินสอมุมขวาบน) เลยแล้วปุ่มหายไป
   ผู้ดูแลระบบได้เมนูสามจุด แก้ไขได้ตลอด และยกเลิกเอกสารได้ — ยกเลิกแล้วกู้คืน
   ไม่ได้ จึงต้องยืนยันก่อนทุกครั้ง สลิงที่ยกเลิกยังอยู่ในแท็บยกเลิกของใบ

   ตัวอย่างนี้ไม่มีระบบสิทธิ์ สลับมุมมองคลัง/Admin ได้จากชิปใต้ชื่อ
------------------------------------------------------------------ */

export default function SlipPage() {
  const router = useRouter();
  const { id, slipId } = useParams<{ id: string; slipId: string }>();
  const doc = docOf(id);
  const slip = doc && slipOf(doc, slipId);
  const [role, setRoleState] = React.useState<Role>(currentRole());
  const [confirm, setConfirm] = React.useState(false);
  const [, bump] = React.useReducer((n: number) => n + 1, 0);

  if (!doc || !slip) {
    return (
      <main className="mx-auto w-full max-w-lg px-4 py-20 text-center">
        <p className="font-medium">ไม่พบสลิงนี้</p>
        <Button asChild variant="outline-primary" className="mt-4">
          <Link href={doc ? `/receiving/product/${doc.id}` : "/receiving/product"}>ย้อนกลับ</Link>
        </Button>
      </main>
    );
  }

  const tons = doc.unit === "ตัน";
  const editHref = `/receiving/product/${doc.id}/${slip.id}/edit`;
  const withinWindow = canEditSlip(slip);
  const isAdmin = role === "admin";

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col">
      <main className="@container mx-auto w-full max-w-7xl flex-1 px-4 pt-6 pb-6 sm:px-6">
        <Crumbs
          trail={[
            { label: "รับเข้าสินค้า", href: "/receiving/product" },
            { label: "ใบรับเข้าสินค้า", href: `/receiving/product/${doc.id}` },
            { label: "การรับเข้า" },
          ]}
        />

        <div className="mt-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight">
              {DOC_TITLE[doc.source]} {doc.code}
            </h1>
            <p className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span>{formatAt(slip.at)}</span>
              <span>· {slip.no}</span>
              {slip.cancelled && (
                <Badge appearance="soft" tone="danger">
                  ยกเลิกแล้ว
                </Badge>
              )}
            </p>
          </div>

          {!slip.cancelled &&
            (isAdmin ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="shrink-0 bg-card" aria-label="เมนูของสลิงนี้">
                    <EllipsisVerticalIcon />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => router.push(editHref)}>
                    <PencilIcon />
                    แก้ไข
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setConfirm(true)}>
                    <Trash2Icon />
                    ยกเลิกเอกสาร
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              withinWindow && (
                <Button asChild variant="outline" size="icon" className="shrink-0 bg-card" aria-label="แก้ไขสลิงนี้">
                  <Link href={editHref}>
                    <PencilIcon />
                  </Link>
                </Button>
              )
            ))}
        </div>

        {/* ตัวอย่างไม่มีระบบสิทธิ์ — สลับดูว่าแต่ละบทบาทเห็นปุ่มอะไร */}
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span>มุมมอง</span>
          <ChipGroup
            label="มุมมองผู้ใช้"
            value={role}
            onChange={(r) => {
              setRole(r);
              setRoleState(r);
            }}
            options={(["warehouse", "admin"] as const).map((r) => ({ id: r, label: ROLE_LABEL[r] }))}
          />
          {!isAdmin && !slip.cancelled && !withinWindow && (
            <span>· เลย {EDIT_DAYS} วันหลังรับเข้าแล้ว แก้ไขไม่ได้</span>
          )}
        </div>

        <section className="mt-5 rounded-xl border border-border bg-card px-4 py-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <ProductLine doc={doc} />
            <span className="text-sm font-semibold">{doc.supplier}</span>
          </div>
          <div className="mt-4 grid gap-4 rounded-xl border border-brand-hover bg-brand px-4 py-6 @xl:grid-cols-2">
            {tons && <Stat label="ปริมาณรับเข้าต่อสลิง (ตัน)" value={formatTons(slip.tons ?? 0)} />}
            <Stat
              label={`จำนวนรับเข้าต่อสลิง (${tons ? "ชิ้น" : doc.unit})`}
              value={slip.count.toLocaleString("en-US")}
            />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 @3xl:grid-cols-4">
            <Meta label="ผู้รับสินค้า" value={slip.receiver} />
            <Meta label="ผู้แก้ไขรับสินค้าล่าสุด" value={slip.editor} />
          </div>
        </section>

        <span className="mt-6 inline-flex rounded-full border border-primary bg-brand px-3 py-1 text-sm font-medium text-primary">
          ข้อมูลการรับเข้า
        </span>
        <div className="mt-4 grid grid-cols-2 gap-4 @3xl:grid-cols-4">
          <Meta label="เบอร์ตู้คอนเทนเนอร์" value={slip.containerNo} />
          {tons && <Meta label="ปริมาณรับเข้าต่อสลิง (ตัน)" value={formatTons(slip.tons ?? 0)} />}
          <Meta
            label={`จำนวนรับเข้าต่อสลิง (${tons ? "ชิ้น" : doc.unit})`}
            value={slip.count.toLocaleString("en-US")}
          />
          <Meta label="บรรจุภัณฑ์" value={slip.packing} />
        </div>
        <div className="mt-4">
          <Meta label="หมายเหตุ" value={slip.note} />
        </div>
      </main>

      <FooterBar
        left={
          <Button variant="outline-primary" onClick={() => router.push(`/receiving/product/${doc.id}`)}>
            ย้อนกลับ
          </Button>
        }
      />

      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>คุณต้องยกเลิกเอกสารการรับสินค้าใช่ไหม?</AlertDialogTitle>
            <AlertDialogDescription>
              การรับเข้าสินค้า {slip.no} หากยกเลิกเอกสารแล้วจะไม่สามารถกู้คืนข้อมูลได้อีก
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="grid grid-cols-2 gap-3">
            <AlertDialogCancel>ย้อนกลับ</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                updateSlip(slip, { cancelled: true, editor: ROLE_LABEL.admin });
                toast.success("ยกเลิกการรับเข้าสินค้าต่อสลิงสำเร็จ", { description: slip.no });
                bump();
                router.push(`/receiving/product/${doc.id}`);
              }}
            >
              ยกเลิกเอกสาร
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
