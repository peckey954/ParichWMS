"use client";

import * as React from "react";
import {
  FileUpload,
  toViewerFiles,
  useDocUpload,
} from "@/components/file-upload";
import { FileViewer } from "@/components/file-viewer";

/* ------------------------------------------------------------------
   เอกสาร/รูปภาพของใบตรวจ — ขึ้นตอนมีข้อที่ไม่ผ่าน

   รูปขึ้นเป็นรูปย่อในการ์ดสี่เหลี่ยม PDF ขึ้นเป็นไอคอนกับชื่อไฟล์ กดใบไหนก็เปิด
   หน้าดูเอกสารที่ไฟล์นั้น แล้วไล่ดูใบอื่นต่อได้ทั้งชุด (ปุ่มลูกศร / [ ] / รางซ้าย)
   เพราะของเสียมักถ่ายหลายมุมของกองเดียวกัน คนดูไล่ติดกันเป็นชุด

   ตัวดูเอกสารวางทับเต็มจอในหน้านี้เอง ไม่ได้เดินไปหน้า /files แบบหน้าชั่งน้ำหนัก
   เพราะใบตรวจยังกรอกไม่เสร็จ เดินออกจากหน้าแล้วค่าที่คีย์ไว้กับไฟล์ที่แนบจะหาย
   ปิดตัวดูแล้วกลับมาที่ฟอร์มเดิม ทุกอย่างยังอยู่
------------------------------------------------------------------ */

export function FailAttachments() {
  const docs = useDocUpload();
  const [openId, setOpenId] = React.useState<string | null>(null);
  const viewerFiles = toViewerFiles(docs.files, "เอกสาร/รูปภาพของใบตรวจ");

  // เปิดตัวดูอยู่ — ล็อกการเลื่อนของหน้าข้างหลัง ไม่งั้นเลื่อนในเอกสารแล้วฟอร์มเลื่อนตาม
  React.useEffect(() => {
    if (openId === null) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [openId]);

  return (
    <>
      <FileUpload
        title="เอกสาร/รูปภาพ"
        dropLabel="อัปโหลด / ลากไฟล์เอกสารหรือรูปภาพ"
        files={docs.files}
        onAdd={docs.add}
        onRemove={docs.remove}
        onRetry={docs.retry}
        onOpen={setOpenId}
      />

      {openId !== null && viewerFiles.length > 0 && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="ดูเอกสาร"
          className="fixed inset-0 z-50 flex flex-col bg-card"
        >
          <FileViewer
            files={viewerFiles}
            openId={openId}
            onOpenChange={setOpenId}
            onClose={() => setOpenId(null)}
          />
        </div>
      )}
    </>
  );
}
