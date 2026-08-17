"use client";

import * as React from "react";
import { ImageIcon, PlusIcon, RotateCwIcon, XIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@peckey954/ui/components/ui/dialog";
import { cn } from "@peckey954/ui/lib/utils";

/* ------------------------------------------------------------------
   ช่องเพิ่มรูปภาพ

   ของจริงคนถ่ายด้วยมือถือหน้าท่ารถ สัญญาณไม่ดี ไฟล์จากกล้องก็ใหญ่
   สามอย่างนี้จึงต้องมีสถานะของตัวเอง ไม่ใช่ขึ้นหรือไม่ขึ้นเท่านั้น
     กำลังอัป   — มีแถบความคืบหน้า จะได้รู้ว่าค้างหรือกำลังไป
     ไฟล์ใหญ่ไป — บอกลิมิตเป็นตัวเลข ไม่ใช่ "ไฟล์ไม่ถูกต้อง"
     อัปไม่สำเร็จ — มีปุ่มลองใหม่ในกรอบเดิม ไม่ต้องเลือกไฟล์ซ้ำ

   กดที่รูปแล้วเปิดดูเต็มจอ เพราะรูปย่อ 96px ดูไม่ออกว่าของเสียหายตรงไหน
   ซึ่งเป็นเหตุผลเดียวที่ต้องแนบรูปตั้งแต่แรก
------------------------------------------------------------------ */

/** ขีดจำกัดของไฟล์ที่รับได้ — ตรงกับข้อความที่โชว์ตอนไฟล์ใหญ่เกิน */
export const MAX_FILE_MB = 50;

export type Photo = {
  id: string;
  name: string;
  /** blob URL ของไฟล์ — ไม่มีตอนที่ยังอัปไม่สำเร็จ */
  url?: string;
  status: "uploading" | "done" | "tooLarge" | "failed";
  /** 0–100 ใช้ตอนกำลังอัป */
  progress: number;
};

export function PhotoUpload({
  photos,
  onAdd,
  onRemove,
  onRetry,
  label = "เพิ่มรูปภาพ",
}: {
  photos: Photo[];
  onAdd: (files: FileList) => void;
  onRemove: (id: string) => void;
  onRetry: (id: string) => void;
  label?: string;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [preview, setPreview] = React.useState<Photo | null>(null);

  return (
    <>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={cn(
            "flex size-24 shrink-0 flex-col items-center justify-center gap-1.5 rounded-lg",
            "border border-primary bg-brand text-sm font-medium text-primary",
            "transition-colors hover:bg-accent-hover",
            "focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
          )}
        >
          <PlusIcon className="size-5" />
          {label}
        </button>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          onChange={(e) => {
            if (e.target.files?.length) onAdd(e.target.files);
            // ล้างค่าไว้ เลือกไฟล์เดิมซ้ำอีกครั้งจะได้ยังเกิด change
            e.target.value = "";
          }}
        />

        {photos.map((p) => (
          <PhotoTile
            key={p.id}
            photo={p}
            onRemove={() => onRemove(p.id)}
            onRetry={() => onRetry(p.id)}
            onOpen={() => p.status === "done" && setPreview(p)}
          />
        ))}
      </div>

      {/* ดูเต็มจอ — รูปย่อ 96px ดูไม่ออกว่าของเสียหายตรงไหน */}
      <Dialog
        open={preview !== null}
        onOpenChange={(v) => !v && setPreview(null)}
      >
        <DialogContent
          aria-describedby={undefined}
          className="max-w-3xl gap-0 overflow-hidden p-0"
        >
          <DialogTitle className="px-4 py-3 text-base">
            {preview?.name}
          </DialogTitle>
          {preview?.url && (
            // ไฟล์มาจาก blob URL ในเครื่อง next/image ปรับขนาดให้ไม่ได้
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview.url}
              alt={preview.name}
              className="max-h-[75vh] w-full bg-secondary object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function PhotoTile({
  photo: p,
  onRemove,
  onRetry,
  onOpen,
}: {
  photo: Photo;
  onRemove: () => void;
  onRetry: () => void;
  onOpen: () => void;
}) {
  const bad = p.status === "tooLarge" || p.status === "failed";

  return (
    <div className="relative size-24 shrink-0">
      <div
        className={cn(
          "size-full overflow-hidden rounded-lg border",
          bad ? "border-destructive bg-chip-red" : "border-border bg-card"
        )}
      >
        {p.status === "done" && p.url ? (
          <button
            type="button"
            onClick={onOpen}
            aria-label={`ดูรูป ${p.name} เต็มจอ`}
            className="size-full focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={p.url}
              alt={p.name}
              className="size-full object-cover"
            />
          </button>
        ) : p.status === "uploading" ? (
          <div className="flex size-full flex-col items-center justify-center gap-2 text-muted-foreground">
            <ImageIcon className="size-6" />
            {/* แถบความคืบหน้าอยู่ขอบล่างของกรอบ ไม่ใช่ตัวเลขเปอร์เซ็นต์
                เพราะสิ่งที่คนอยากรู้คือ "ยังไปอยู่ไหม" ไม่ใช่ "ไปกี่เปอร์เซ็นต์" */}
            <span className="absolute inset-x-0 bottom-0 h-1 bg-secondary">
              <span
                className="block h-full bg-primary transition-[width] duration-200"
                style={{ width: `${p.progress}%` }}
              />
            </span>
          </div>
        ) : (
          <button
            type="button"
            onClick={onRetry}
            className="flex size-full flex-col items-center justify-center gap-1.5 px-1 text-center text-xs font-medium text-danger-strong"
          >
            <RotateCwIcon className="size-5" />
            {p.status === "tooLarge" ? (
              <>
                ขนาดไฟล์เกิน
                <br />
                {MAX_FILE_MB} MB
              </>
            ) : (
              <>
                เพิ่มรูปภาพ
                <br />
                ไม่สำเร็จ
              </>
            )}
          </button>
        )}
      </div>

      {/* ปุ่มลบอยู่นอกกรอบรูป จะได้ไม่บังภาพที่กำลังตรวจ */}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`ลบรูป ${p.name}`}
        className={cn(
          "absolute -top-2 -right-2 flex size-6 items-center justify-center rounded-full",
          "border border-border bg-card text-muted-foreground shadow-sm",
          "transition-colors hover:text-foreground",
          "focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
        )}
      >
        <XIcon className="size-3.5" />
      </button>
    </div>
  );
}
