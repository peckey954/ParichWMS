"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { ViewerFile } from "@/components/file-viewer";

/**
 * ชุดไฟล์ที่กำลังเปิดดูอยู่ — ต้องข้ามหน้าได้
 *
 * หน้าดูเอกสารเป็น route ของตัวเอง (/files) แต่ไฟล์เกิดจากช่องอัปโหลดในหน้าฟอร์ม
 * ซึ่งเป็นคนละ route กัน ถ้าเก็บเป็น state ของหน้าฟอร์มเอง เดินออกจากหน้าปุ๊บ
 * รายการก็หาย หน้าดูเอกสารจะเปิดมาว่างเปล่าทันที — เหตุผลเดียวกับ PrSetupProvider
 * ที่ต้องอยู่ระดับ AppShell
 *
 * blob URL ของไฟล์ยังใช้ได้ตลอดอายุแท็บ การเดินไปมาระหว่างสองหน้าจึงไม่ทำให้รูปหาย
 * แต่รีเฟรชแล้วหมด — หน้าดูเอกสารจึงต้องมีสถานะว่างที่อธิบายตัวเองได้
 */
type FileViewerCtx = {
  files: ViewerFile[];
  openId: string | null;
  /** เปิดหน้าดูเอกสารพร้อมส่งชุดไฟล์กับไฟล์ที่จะเปิดก่อน */
  openViewer: (files: ViewerFile[], id: string) => void;
  /** สลับไฟล์ระหว่างที่อยู่ในหน้าดูเอกสาร */
  setOpenId: (id: string) => void;
};

const Ctx = React.createContext<FileViewerCtx | null>(null);

export function FileViewerProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [files, setFiles] = React.useState<ViewerFile[]>([]);
  const [openId, setOpenId] = React.useState<string | null>(null);

  const value = React.useMemo<FileViewerCtx>(
    () => ({
      files,
      openId,
      openViewer: (next, id) => {
        setFiles(next);
        setOpenId(id);
        router.push("/files");
      },
      setOpenId,
    }),
    [files, openId, router]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useFileViewer() {
  const ctx = React.useContext(Ctx);
  if (!ctx) throw new Error("useFileViewer ต้องอยู่ใน FileViewerProvider");
  return ctx;
}
