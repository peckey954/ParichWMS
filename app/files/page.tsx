"use client";

import { useRouter } from "next/navigation";
import { FileTextIcon } from "lucide-react";
import { Button } from "@peckey954/ui/components/ui/button";
import { FileViewer } from "@/components/file-viewer";
import { useFileViewer } from "@/components/file-viewer-provider";

/* ------------------------------------------------------------------
   หน้าดูเอกสาร — เดิมเป็นกล่องซ้อนอยู่บนหน้าฟอร์ม

   แยกออกมาเป็นหน้าเพราะเอกสารที่มาดูคือใบชั่งกระดาษที่สแกนมา ตัวเลขเล็กมาก
   กล่องซ้อนกินขอบไปรอบด้านและยังมีฉากมืดคั่น เหลือพื้นที่อ่านจริงน้อยกว่าที่ควร
   เป็นหน้าแล้วได้เต็มความกว้าง และปุ่มย้อนกลับของเบราว์เซอร์ทำงานตามที่คนคาด

   ไฟล์อยู่ใน FileViewerProvider ระดับ AppShell — รีเฟรชหน้านี้ตรง ๆ แล้วรายการหาย
   จึงต้องมีสถานะว่างที่บอกทางกลับ ไม่ใช่หน้าขาวเปล่า
------------------------------------------------------------------ */

export default function FilesPage() {
  const router = useRouter();
  const { files, openId, setOpenId } = useFileViewer();

  if (files.length === 0 || openId === null) {
    return (
      <main className="mx-auto flex w-full max-w-lg flex-col items-center gap-3 px-4 py-20 text-center">
        <FileTextIcon className="size-10 text-muted-foreground" strokeWidth={1.5} />
        <h1 className="text-lg font-medium">ไม่มีเอกสารที่เปิดค้างไว้</h1>
        <p className="text-sm text-muted-foreground">
          หน้านี้แสดงเอกสารที่กดดูจากหน้าฟอร์ม รีเฟรชแล้วรายการจะหาย
          กลับไปกดที่ไฟล์ในฟอร์มอีกครั้ง
        </p>
        <Button variant="outline-primary" className="mt-2" onClick={() => router.back()}>
          ย้อนกลับ
        </Button>
      </main>
    );
  }

  return (
    // หักความสูงของแถบหัวแอปออก ให้ตัวอ่านเอกสารกินพื้นที่ที่เหลือทั้งหมดพอดี
    // ไม่ใช่ดันหน้าให้ยาวเกินจอจนเกิดแถบเลื่อนสองชั้น
    <div className="flex h-[calc(100svh-3.5rem)] flex-col">
      <FileViewer
        files={files}
        openId={openId}
        onOpenChange={setOpenId}
        onClose={() => router.back()}
      />
    </div>
  );
}
