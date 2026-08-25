"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { EyeIcon, RotateCcwIcon, Settings2Icon } from "lucide-react";
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
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@peckey954/ui/components/ui/breadcrumb";
import { Button } from "@peckey954/ui/components/ui/button";
import { useRecipeRun } from "@/components/production/recipe-run";
import { InputSetup } from "@/components/production/input-setup";

/* ------------------------------------------------------------------
   ตั้งค่าข้อมูล — ต้นทุนกับธาตุอาหารของวัตถุดิบ

   ช่องเดียวที่แก้แล้วทำให้ตัวเลขในหน้า "สูตรที่เหมาะสม" เปลี่ยนจริง
   แก้ตรงนี้เป็นการแก้ "ร่าง" เท่านั้น ยังไม่มีใครเห็นนอกจากคนแก้เอง
   ลองปรับค่าไปมา แล้วกด "ดูผลลัพธ์" เพื่อดูว่าเปลี่ยนไปยังไงบ้าง

   "บันทึกร่าง" กับ "เผยแพร่" ไม่ได้อยู่ที่หน้านี้ — ย้ายไปอยู่แถบปุ่มล่างของ
   หน้าดูผลลัพธ์แทน เพราะต้องให้เห็นผลก่อนเสมอถึงจะตัดสินใจได้ว่าจะแค่เก็บร่างไว้
   หรือจะเผยแพร่ให้ทุกคนเห็นเลย

   "ย้อนกลับไปอัปเดตก่อนหน้า" ขึ้นเฉพาะตอนร่างต่างจากค่าที่เผยแพร่แล้วจริง ๆ
   (hasUnpublished) — เผื่อกรณีแก้ไปแล้วเปลี่ยนใจไม่เอาของที่เพิ่งแก้เลย อยากกลับไป
   ใช้ชุดที่เผยแพร่ล่าสุดแทนโดยไม่ต้องแก้คืนเองทีละช่อง มีกล่องยืนยันก่อนเสมอ
   เพราะทิ้งของที่แก้ไปแล้วกู้คืนไม่ได้
------------------------------------------------------------------ */

export default function RecipeInputSetupPage() {
  const router = useRouter();
  const { hasUnpublished, resetDraft } = useRecipeRun();
  const [confirmResetOpen, setConfirmResetOpen] = React.useState(false);

  return (
    <>
      <main className="mx-auto w-full max-w-7xl px-4 pt-3 pb-24 sm:px-6 sm:pt-5">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">ระบบ</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/production/recipe">
                สูตรผลิตประจำสัปดาห์
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/production/recipe/optimized">
                สูตรที่เหมาะสม
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-primary">ตั้งค่าข้อมูล</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="mt-2 flex flex-wrap items-start justify-between gap-3 sm:mt-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight">ตั้งค่าข้อมูล</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              ต้นทุนและค่าธาตุอาหารของวัตถุดิบ — แก้ตรงนี้แล้วกด &quot;ดูผลลัพธ์&quot; ได้
              ก่อนเผยแพร่จริง
            </p>
          </div>
        </div>

        {/* ---------- แถบเตือนมีของแก้ค้างไว้ ----------
             ขึ้นเฉพาะตอนร่างต่างจากค่าที่เผยแพร่แล้วจริง ๆ เผื่อกรณีแก้ไปแล้ว
             เปลี่ยนใจ อยากกลับไปใช้ชุดที่เผยแพร่ล่าสุดแทนโดยไม่ต้องแก้คืนเอง */}
        {hasUnpublished && (
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-chip-yellow-foreground/40 bg-chip-yellow px-4 py-3 text-sm">
            <Settings2Icon className="size-4 shrink-0" />
            <p className="min-w-0 flex-1">
              มีการแก้ไขที่ยังไม่เผยแพร่ ถ้าไม่เอาที่แก้ไปแล้ว กลับไปใช้ค่าที่เผยแพร่
              ล่าสุดแทนได้
            </p>
            <Button
              size="sm"
              variant="outline-primary"
              onClick={() => setConfirmResetOpen(true)}
            >
              <RotateCcwIcon />
              ย้อนกลับไปอัปเดตก่อนหน้า
            </Button>
          </div>
        )}

        <div className="mt-5">
          <InputSetup />
        </div>
      </main>

      <AlertDialog open={confirmResetOpen} onOpenChange={setConfirmResetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ย้อนกลับไปอัปเดตก่อนหน้าใช่ไหม?</AlertDialogTitle>
            <AlertDialogDescription>
              การแก้ไขทั้งหมดที่ยังไม่เผยแพร่จะหายไป แล้วกลับไปใช้ค่าที่เผยแพร่
              ล่าสุดแทน กู้คืนไม่ได้หลังจากนี้
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                resetDraft();
                setConfirmResetOpen(false);
              }}
            >
              ยืนยันย้อนกลับ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ---------- แถบปุ่มล่าง ----------
           ปุ่มชิดขอบซ้าย-ขวาของแถบเต็มความกว้างจริง ไม่ผูกความกว้างกับ
           max-w-7xl ของเนื้อหาด้านบน — เนื้อหาแคบลงเพื่อให้อ่านง่าย แต่แถบปุ่ม
           กว้างเต็มพื้นที่เสมอ

           เหลือปุ่มเดียวคือ "ดูผลลัพธ์" — บันทึกร่าง/เผยแพร่ย้ายไปแถบล่างของ
           หน้าผลลัพธ์แล้ว ไม่ต้องมีปุ่มบันทึกซ้ำสองที่ */}
      <div className="sticky bottom-0 z-30 border-t border-border bg-background">
        <div className="flex w-full items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Button variant="outline-primary" onClick={() => router.back()}>
            ย้อนกลับ
          </Button>
          <Button asChild>
            <Link href="/production/recipe/optimized/preview">
              <EyeIcon />
              ดูผลลัพธ์
            </Link>
          </Button>
        </div>
      </div>
    </>
  );
}
