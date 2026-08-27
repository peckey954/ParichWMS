"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { EyeIcon, FileXIcon, Settings2Icon } from "lucide-react";
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
   ตั้งค่าต้นทุนผลิต — ต้นทุนกับธาตุอาหารของวัตถุดิบ

   ช่องเดียวที่แก้แล้วทำให้ตัวเลขในหน้า "สูตรที่เหมาะสม" เปลี่ยนจริง
   แก้ตรงนี้เป็นการแก้ "ร่าง" เท่านั้น ยังไม่มีใครเห็นนอกจากคนแก้เอง
   ลองปรับค่าไปมา แล้วกด "ดูผลลัพธ์" เพื่อดูว่าเปลี่ยนไปยังไงบ้าง

   "บันทึกร่าง" กับ "เผยแพร่" ไม่ได้อยู่ที่หน้านี้ — ย้ายไปอยู่แถบปุ่มล่างของ
   หน้าดูผลลัพธ์แทน เพราะต้องให้เห็นผลก่อนเสมอถึงจะตัดสินใจได้ว่าจะแค่เก็บร่างไว้
   หรือจะเผยแพร่ให้ทุกคนเห็นเลย

   ปุ่ม "ยกเลิก" อยู่ถาวรที่แถบปุ่มล่าง แต่กดได้เฉพาะตอนร่างต่างจากค่าที่เผยแพร่แล้ว
   จริง ๆ (hasUnpublished) — เผื่อกรณีแก้ไปแล้วเปลี่ยนใจไม่เอาของที่เพิ่งแก้เลย อยากกลับไป
   ใช้ชุดที่เผยแพร่ล่าสุดแทนโดยไม่ต้องแก้คืนเองทีละช่อง มีกล่องยืนยันก่อนเสมอ
   เพราะทิ้งของที่แก้ไปแล้วกู้คืนไม่ได้ (เดิมปุ่มนี้ซ่อนอยู่ในแบนเนอร์เหลืองด้านบน
   ย้ายมารวมที่แถบล่างที่เดียว ไม่ให้มีสองที่ทำเรื่องเดียวกัน)
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
              <BreadcrumbPage className="text-primary">ตั้งค่าต้นทุนผลิต</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="mt-2 flex flex-wrap items-start justify-between gap-3 sm:mt-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight">ตั้งค่าต้นทุนผลิต</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              ต้นทุนและค่าธาตุอาหารของวัตถุดิบ — แก้ตรงนี้แล้วกด &quot;ดูผลลัพธ์&quot; ได้
              ก่อนเผยแพร่จริง
            </p>
          </div>
        </div>

        {/* ---------- แถบเตือนมีของแก้ค้างไว้ ----------
             ขึ้นเฉพาะตอนร่างต่างจากค่าที่เผยแพร่แล้วจริง ๆ แค่บอกสถานะเฉย ๆ
             ปุ่มทิ้งค่าย้ายไปรวมอยู่ที่แถบปุ่มล่าง ("ยกเลิก") ที่เดียวแล้ว
             ไม่ต้องมีปุ่มซ้ำสองที่ */}
        {hasUnpublished && (
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-chip-yellow-foreground/40 bg-chip-yellow px-4 py-3 text-sm">
            <Settings2Icon className="size-4 shrink-0" />
            <p className="min-w-0 flex-1">
              มีการแก้ไขที่ยังไม่เผยแพร่ ถ้าไม่เอาที่แก้ไปแล้ว กลับไปใช้ค่าที่เผยแพร่
              ล่าสุดแทนได้ด้วยปุ่ม &quot;ยกเลิก&quot; ที่แถบด้านล่าง
            </p>
          </div>
        )}

        <div className="mt-5">
          <InputSetup />
        </div>
      </main>

      <AlertDialog open={confirmResetOpen} onOpenChange={setConfirmResetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยกเลิกการแก้ไขที่ยังไม่เผยแพร่ใช่ไหม?</AlertDialogTitle>
            <AlertDialogDescription>
              การแก้ไขทั้งหมดที่ยังไม่เผยแพร่จะหายไป แล้วกลับไปใช้ค่าที่เผยแพร่
              ล่าสุดแทน กู้คืนไม่ได้หลังจากนี้
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ไม่ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                resetDraft();
                setConfirmResetOpen(false);
              }}
            >
              ยืนยันยกเลิก
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ---------- แถบปุ่มล่าง ----------
           ปุ่มชิดขอบซ้าย-ขวาของแถบเต็มความกว้างจริง ไม่ผูกความกว้างกับ
           max-w-7xl ของเนื้อหาด้านบน — เนื้อหาแคบลงเพื่อให้อ่านง่าย แต่แถบปุ่ม
           กว้างเต็มพื้นที่เสมอ

           "ย้อนกลับ" ชิดซ้ายสุดเสมอ — ตำแหน่งเดียวกับทุกหน้าที่มีแถบปุ่มล่างในระบบนี้
           ("ตั้งค่าต้นทุน", หน้าพรีวิวสูตรที่เหมาะสม) ไม่ย้ายมันหนีไปแค่หน้านี้หน้าเดียว
           เพราะเป็นตำแหน่งที่คนใช้จำได้ข้ามหลายหน้าอยู่แล้ว "ยกเลิก" อยู่ต่อท้ายในกลุ่ม
           เดียวกัน แต่คั่นด้วยเส้นแบ่งบางๆ (ใช้ pattern เดียวกับเส้นคั่นชิปในหน้าสต็อก
           ทั่วไป) บอกว่าเป็นคนละประเภทงานกับ "ย้อนกลับ" — ไม่ใช่แค่ปุ่มนำทางเฉยๆ
           แต่เป็นการล้างค่าที่แก้ไปแล้ว "ดูผลลัพธ์" ยังอยู่โดดเดี่ยวขวาสุดเหมือนทุกหน้า
           ที่ให้ปุ่มหลักอยู่ขวาสุดเดี่ยวๆ — บันทึกร่าง/เผยแพร่ย้ายไปแถบล่างของหน้า
           ผลลัพธ์แล้ว ไม่ต้องมีปุ่มบันทึกซ้ำสองที่

           "ยกเลิก" ใช้ variant="outline" ทับสีชุด destructive เอง (ไม่ใช่
           variant="destructive" ของ DS ซึ่งพื้นแดงทึบ) ให้หน้าตาตรงกับปุ่ม
           ยกเลิกแบบขอบแดง/ตัวหนังสือแดงตามไฟล์ออกแบบ — กดได้เฉพาะตอนมีของให้ทิ้งจริง
           (hasUnpublished) เหมือนตอนที่ปุ่มนี้ยังซ่อนอยู่ในแบนเนอร์เหลือง สีแดง+ไอคอน+
           ปกติกดไม่ได้อยู่แล้ว ช่วยกันกดพลาดกับ "ย้อนกลับ" ที่อยู่ข้างกันได้พออยู่แล้ว
           โดยไม่ต้องแยกฝั่ง */}
      <div className="sticky bottom-0 z-30 border-t border-border bg-background">
        <div className="flex w-full items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Button variant="outline-primary" onClick={() => router.back()}>
              ย้อนกลับ
            </Button>
            <span className="h-6 w-px shrink-0 bg-border" aria-hidden />
            <Button
              variant="outline"
              disabled={!hasUnpublished}
              className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive disabled:text-muted-foreground"
              onClick={() => setConfirmResetOpen(true)}
            >
              <FileXIcon />
              ยกเลิก
            </Button>
          </div>
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
