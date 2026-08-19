"use client";

import * as React from "react";
import { FileTextIcon, RotateCwIcon, UploadIcon, XIcon } from "lucide-react";
import { Button } from "@peckey954/ui/components/ui/button";
import { cn } from "@peckey954/ui/lib/utils";

/* ------------------------------------------------------------------
   ช่องแนบเอกสาร

   ต่างจากช่องแนบรูปตรงที่ของที่แนบเป็น PDF เป็นหลัก ซึ่งไม่มีรูปย่อให้ดู
   การ์ดจึงต้องโชว์ชื่อไฟล์กับขนาดแทน เพราะสองอย่างนี้คือสิ่งเดียว
   ที่บอกได้ว่าแนบไฟล์ถูกใบหรือเปล่าโดยไม่ต้องเปิดดู

   ช่องลากไฟล์กว้างเต็มแถว ไม่ใช่กล่องสี่เหลี่ยมจัตุรัสเล็ก ๆ
   เพราะเป้าของการลากคือพื้นที่ ยิ่งกว้างยิ่งลากไม่พลาด
   และยังมีปุ่มให้กดเลือกไฟล์เอง สำหรับคนที่ไม่ลาก

   สถานะเหมือนช่องแนบรูป — กำลังอัป / ใหญ่เกิน / ไม่สำเร็จ
   เพราะเป็นปัญหาชุดเดียวกัน คนที่เคยเจอที่หนึ่งจะอ่านอีกที่ออกทันที
------------------------------------------------------------------ */

export const MAX_DOC_MB = 50;
export const MAX_DOC_COUNT = 5;

export type DocFile = {
  id: string;
  name: string;
  /** ขนาดเป็นไบต์ โชว์ให้รู้ว่าไฟล์ที่แนบคือใบที่ตั้งใจจริง */
  size: number;
  status: "uploading" | "done" | "tooLarge" | "failed";
  progress: number;
};

export const formatFileSize = (bytes: number) =>
  bytes >= 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1)}MB`
    : `${Math.max(1, Math.round(bytes / 1024))}KB`;

export function FileUpload({
  title,
  dropLabel,
  files,
  onAdd,
  onRemove,
  onRetry,
}: {
  title: string;
  /** ข้อความในช่องลากไฟล์ บอกว่าช่องนี้รับเอกสารใบไหน */
  dropLabel: string;
  files: DocFile[];
  onAdd: (files: FileList) => void;
  onRemove: (id: string) => void;
  onRetry: (id: string) => void;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = React.useState(false);
  const full = files.length >= MAX_DOC_COUNT;

  return (
    <section className="space-y-2">
      <div>
        <p className="font-medium">{title}</p>
        {/* บอกกติกาไว้ก่อนแนบ ไม่ใช่ให้ไปเจอตอนแนบแล้วไม่ผ่าน */}
        <p className="mt-0.5 text-sm text-muted-foreground">
          อัปโหลดได้สูงสุด {MAX_DOC_COUNT} ไฟล์ รองรับไฟล์ PDF, PNG และ JPG
          โดยแต่ละไฟล์มีขนาดไม่เกิน {MAX_DOC_MB} MB
        </p>
      </div>

      <div className="flex flex-wrap items-stretch gap-3">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            if (!full) setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            if (!full && e.dataTransfer.files.length) onAdd(e.dataTransfer.files);
          }}
          className={cn(
            // เส้นประบอกว่ากล่องนี้ยังว่าง รอของมาใส่ — ชุดเดียวกับช่องแนบรูป
            "flex min-h-[9.5rem] w-full flex-col items-center justify-center gap-2 rounded-lg px-4 py-5",
            "border border-dashed text-center @2xl:w-[26rem]",
            full
              ? "border-border bg-muted text-muted-foreground"
              : "border-primary bg-brand",
            dragging && "border-primary bg-accent-hover"
          )}
        >
          <UploadIcon
            className={cn("size-6", full ? "text-muted-foreground" : "text-primary")}
            strokeWidth={1.5}
          />
          <p className="text-sm">
            {full ? `แนบครบ ${MAX_DOC_COUNT} ไฟล์แล้ว` : dropLabel}
          </p>
          {!full && (
            <Button
              type="button"
              variant="outline-primary"
              size="sm"
              onClick={() => inputRef.current?.click()}
            >
              อัปโหลดไฟล์
            </Button>
          )}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg"
          multiple
          className="sr-only"
          onChange={(e) => {
            if (e.target.files?.length) onAdd(e.target.files);
            // ล้างค่าไว้ เลือกไฟล์เดิมซ้ำอีกครั้งจะได้ยังเกิด change
            e.target.value = "";
          }}
        />

        {files.map((f) => (
          <DocCard
            key={f.id}
            file={f}
            onRemove={() => onRemove(f.id)}
            onRetry={() => onRetry(f.id)}
          />
        ))}
      </div>
    </section>
  );
}

function DocCard({
  file: f,
  onRemove,
  onRetry,
}: {
  file: DocFile;
  onRemove: () => void;
  onRetry: () => void;
}) {
  const bad = f.status === "tooLarge" || f.status === "failed";

  return (
    <div className="relative w-[7.5rem] shrink-0">
      <div
        className={cn(
          "flex h-[9.5rem] w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-lg border px-2 text-center",
          bad ? "border-destructive bg-chip-red" : "border-border bg-card"
        )}
      >
        {bad ? (
          <button
            type="button"
            onClick={onRetry}
            className="flex flex-col items-center gap-2 text-danger-strong"
          >
            <RotateCwIcon className="size-6" />
            <span className="line-clamp-2 text-xs font-medium text-foreground">
              {f.name}
            </span>
            <span className="text-xs font-medium">
              {f.status === "tooLarge"
                ? `ขนาดไฟล์เกิน ${MAX_DOC_MB} MB`
                : "อัปโหลดไม่สำเร็จ"}
            </span>
          </button>
        ) : (
          <>
            <FileTextIcon className="size-8 text-primary" strokeWidth={1.5} />
            <span className="line-clamp-2 text-xs font-medium">{f.name}</span>
            <span className="text-xs text-muted-foreground">
              {formatFileSize(f.size)}
            </span>
          </>
        )}

        {/* แถบความคืบหน้าอยู่ขอบล่างของการ์ด บอกว่ายังไปอยู่ไหม
            เต็มแถบค้างไว้ตอนเสร็จ เป็นเครื่องหมายว่าไฟล์นี้ขึ้นครบแล้ว */}
        {(f.status === "uploading" || f.status === "done") && (
          <span className="absolute inset-x-0 bottom-0 h-1 bg-secondary">
            <span
              className="block h-full bg-primary transition-[width] duration-200"
              style={{ width: `${f.progress}%` }}
            />
          </span>
        )}
      </div>

      {/* ปุ่มลบอยู่นอกกรอบ จะได้ไม่บังชื่อไฟล์ */}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`ลบไฟล์ ${f.name}`}
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

/**
 * สถานะของช่องแนบเอกสารหนึ่งช่อง
 *
 * แยกเป็น hook เพราะหน้าหนึ่งมีหลายช่อง (ของพาริช / ของผู้ขาย / บัตรคนขับ)
 * ทั้งสามช่องมีกฎเหมือนกันเป๊ะ ต่างกันแค่ชื่อ ไม่ควรเขียนซ้ำสามรอบ
 */
export function useDocUpload() {
  const [files, setFiles] = React.useState<DocFile[]>([]);
  const seq = React.useRef(0);

  // ไม่มีหลังบ้านจริง — ไต่ความคืบหน้าให้เห็นว่าอัปอยู่
  const start = React.useCallback((id: string) => {
    let pct = 0;
    const timer = setInterval(() => {
      pct += 20;
      setFiles((prev) =>
        prev.map((f) =>
          f.id === id
            ? pct >= 100
              ? { ...f, status: "done", progress: 100 }
              : { ...f, progress: pct }
            : f
        )
      );
      if (pct >= 100) clearInterval(timer);
    }, 220);
  }, []);

  const add = (incoming: FileList) => {
    setFiles((prev) => {
      // ตัดที่เกินโควตาทิ้งตั้งแต่ตรงนี้ ไม่ปล่อยให้เกินแล้วค่อยบ่นทีหลัง
      const room = MAX_DOC_COUNT - prev.length;
      const picked = Array.from(incoming).slice(0, Math.max(0, room));
      const next: DocFile[] = picked.map((file) => {
        seq.current += 1;
        const id = `doc-${seq.current}`;
        const tooLarge = file.size > MAX_DOC_MB * 1024 * 1024;
        if (!tooLarge) start(id);
        return {
          id,
          name: file.name,
          size: file.size,
          status: tooLarge ? "tooLarge" : "uploading",
          progress: 0,
        };
      });
      return [...prev, ...next];
    });
  };

  const remove = (id: string) =>
    setFiles((prev) => prev.filter((f) => f.id !== id));

  const retry = (id: string) =>
    setFiles((prev) => {
      const target = prev.find((f) => f.id === id);
      // ไฟล์ใหญ่เกินลองใหม่กี่ครั้งก็ใหญ่เท่าเดิม ต้องไปเลือกไฟล์อื่นมา
      if (!target || target.status === "tooLarge") return prev;
      start(id);
      return prev.map((f) =>
        f.id === id ? { ...f, status: "uploading", progress: 0 } : f
      );
    });

  const uploading = files.some((f) => f.status === "uploading");

  return { files, add, remove, retry, uploading };
}
