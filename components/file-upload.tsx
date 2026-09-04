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

/**
 * ความสูงร่วมของช่องลากไฟล์กับการ์ดไฟล์ — ทั้งสองอย่างอยู่แถวเดียวกัน สูงไม่
 * เท่ากันเมื่อไหร่แถวจะดูขรุขระทันที จึงผูกไว้ที่ค่าเดียวกันตรงนี้ ไม่ใช่ต่างคน
 * ต่างตั้งแล้วหวังว่าจะบังเอิญเท่ากัน (ของเดิมช่องลากไฟล์สูงตามเนื้อหา ~144px
 * ส่วนการ์ดล็อกไว้ 96px เลยเตี้ยกว่ากันเห็นชัด)
 *
 * 9rem = 144px คือความสูงที่ช่องลากไฟล์ต้องใช้จริงเมื่อเรียงไอคอน/ข้อความ/ปุ่ม
 * ในแนวตั้ง — การ์ดไฟล์ยืดตามมาให้เท่ากัน แถมได้ที่ให้ชื่อไฟล์หายใจมากขึ้นด้วย
 */
const BOX_H = "h-36";

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
  onOpen,
}: {
  title: string;
  /** ข้อความในช่องลากไฟล์ บอกว่าช่องนี้รับเอกสารใบไหน */
  dropLabel: string;
  files: DocFile[];
  onAdd: (files: FileList) => void;
  onRemove: (id: string) => void;
  onRetry: (id: string) => void;
  /** กดการ์ดแล้วเปิดดูเต็มจอ ไม่ส่งมาก็เป็นการ์ดอ่านอย่างเดียว */
  onOpen?: (id: string) => void;
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

      {/* items-start ไม่ใช่ items-stretch — ช่องลากไฟล์สูงตามเนื้อหา (สูงกว่า
          การ์ดไฟล์ 96px) การ์ดจึงต้องเกาะขอบบนของแถว ไม่ใช่ยืดตามหรือลอยกลาง */}
      <div className="flex flex-wrap items-start gap-3">
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
            // เรียงแนวตั้งกึ่งกลางทั้งไอคอน/ข้อความ/ปุ่ม เหมือนกันทั้งมือถือและเว็บ
            // (เดิมเรียงแนวนอน ไอคอนซ้าย ข้อความกับปุ่มชิดซ้าย) ความสูงใช้ค่า
            // ร่วมกับการ์ดไฟล์ (BOX_H) จะได้สูงเท่ากันทั้งแถว
            "flex w-full flex-col items-center justify-center gap-2 rounded-lg px-4 text-center",
            BOX_H,
            "border border-dashed @2xl:w-[26rem]",
            // ชี้หรือลากไฟล์มาวางแล้วส้มเข้มขึ้น ไม่ใช่หม่นลงเป็นเทา
            // ตอนลากคนมองอยู่ที่ปลายเมาส์ สีต้องเข้มขึ้นชัดว่าปล่อยตรงนี้ได้
            full
              ? "border-border bg-muted text-muted-foreground"
              : "border-primary bg-brand transition-colors hover:bg-brand-hover",
            dragging && !full && "bg-brand-hover"
          )}
        >
          <UploadIcon
            className={cn(
              "size-6 shrink-0",
              full ? "text-muted-foreground" : "text-primary"
            )}
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
            onOpen={onOpen && (() => onOpen(f.id))}
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
  onOpen,
}: {
  file: DocFile;
  onRemove: () => void;
  onRetry: () => void;
  onOpen?: () => void;
}) {
  const bad = f.status === "tooLarge" || f.status === "failed";
  // กดเปิดได้เฉพาะไฟล์ที่ขึ้นครบแล้ว ที่ยังโหลดอยู่หรือพังไม่มีอะไรให้ดู
  const openable = f.status === "done" && onOpen;

  return (
    // จตุรัส 144px — สูงเท่าช่องลากไฟล์ที่อยู่แถวเดียวกันเป๊ะ (BOX_H) และกว้าง
    // เท่าความสูงให้เป็นจตุรัสเหมือนเดิม ไม่ใช่การ์ดสูงเรียวผอม
    <div className={cn("relative w-36 shrink-0", BOX_H)}>
      {/* hover ต้องอยู่ที่กล่องนอกนี้ (มีเส้นขอบ) ไม่ใช่แค่ปุ่มข้างในเฉยๆ —
          เดิม hover:bg-brand-hover อยู่ที่ปุ่ม ทำให้พื้นในเปลี่ยนสีแต่เส้นขอบ
          ของกล่องนอกยังเป็นสีเทาเดิม ดูเหมือนขอบขาวค้างอยู่รอบๆ พื้นสีส้ม */}
      <div
        className={cn(
          // px-4 (16px) กันชื่อไฟล์/ขนาดไฟล์ชิดขอบการ์ดเกินไป — ระยะเดียวกันทุก
          // สถานะ (ปกติ/เปิดดูได้/พัง) จึงใส่ไว้ที่กล่องนอกนี้กล่องเดียว ปุ่ม
          // "เปิดดูได้" ข้างในไม่ต้องมี padding ซ้อนของตัวเองอีกชั้น
          "flex size-full flex-col items-center justify-center gap-1 overflow-hidden rounded-lg border px-4 text-center transition-colors",
          bad
            ? "border-destructive bg-chip-red"
            : openable
              ? "border-border bg-card hover:border-primary hover:bg-brand-hover"
              : "border-border bg-card"
        )}
      >
        {bad ? (
          <button
            type="button"
            onClick={onRetry}
            className="flex flex-col items-center gap-2 text-danger-strong"
          >
            <RotateCwIcon className="size-5" />
            <span className="line-clamp-2 text-[11px] leading-tight font-medium text-foreground">
              {f.name}
            </span>
            <span className="text-[11px] leading-tight font-medium">
              {f.status === "tooLarge"
                ? `ขนาดไฟล์เกิน ${MAX_DOC_MB} MB`
                : "อัปโหลดไม่สำเร็จ"}
            </span>
          </button>
        ) : openable ? (
          <button
            type="button"
            onClick={onOpen}
            aria-label={`ดูเอกสาร ${f.name}`}
            className="flex size-full flex-col items-center justify-center gap-1 rounded-md focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            <FileTextIcon className="size-6 text-primary" strokeWidth={1.5} />
            <span className="line-clamp-2 text-[11px] leading-tight font-medium">
              {f.name}
            </span>
            <span className="text-[11px] leading-tight text-muted-foreground">
              {formatFileSize(f.size)}
            </span>
          </button>
        ) : (
          <>
            <FileTextIcon className="size-6 text-primary" strokeWidth={1.5} />
            <span className="line-clamp-2 text-[11px] leading-tight font-medium">
              {f.name}
            </span>
            <span className="text-[11px] leading-tight text-muted-foreground">
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
export function useDocUpload(seed: DocFile[] = []) {
  const [files, setFiles] = React.useState<DocFile[]>(seed);
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
    // อ่าน FileList ออกมาเป็น array ตรงนี้ทันที ห้ามไปอ่านข้างใน updater ของ
    // setFiles — ช่อง <input type="file"> ถูกล้างค่า (e.target.value = "")
    // ทันทีหลัง onAdd() คืนค่า เพื่อให้เลือกไฟล์เดิมซ้ำแล้วยังเกิด change อยู่
    // ซึ่งล้าง FileList ก้อนเดียวกันนี้ทิ้งไปด้วย updater ทำงานทีหลัง กว่าจะ
    // ไปอ่านก็ไม่เหลือไฟล์แล้ว = กดปุ่มอัปโหลดแล้วไฟล์ไม่ขึ้น (ลากไฟล์มาวาง
    // ไม่เจอปัญหานี้ เพราะ dataTransfer.files ไม่ได้ถูกล้าง จึงดูเหมือนบางที
    // ก็ขึ้นบางทีก็ไม่ขึ้น)
    // ตัดที่เกินโควตาทิ้งตั้งแต่ตรงนี้ ไม่ปล่อยให้เกินแล้วค่อยบ่นทีหลัง
    const room = Math.max(0, MAX_DOC_COUNT - files.length);
    const picked = Array.from(incoming).slice(0, room);
    if (picked.length === 0) return;

    const next: DocFile[] = picked.map((file) => {
      seq.current += 1;
      const tooLarge = file.size > MAX_DOC_MB * 1024 * 1024;
      return {
        id: `doc-${seq.current}`,
        name: file.name,
        size: file.size,
        status: tooLarge ? "tooLarge" : "uploading",
        progress: 0,
      };
    });

    setFiles((prev) => [...prev, ...next]);
    // ไต่ความคืบหน้าหลังสั่ง setFiles แล้ว ไม่ใช่ระหว่างอยู่ใน updater —
    // updater ต้องบริสุทธิ์ StrictMode เรียกซ้ำสองรอบ ถ้าตั้ง interval ข้างใน
    // จะได้ interval ซ้อนกันสองชุดต่อไฟล์ (และเลข seq เดินสองที)
    for (const f of next) {
      if (f.status === "uploading") start(f.id);
    }
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
