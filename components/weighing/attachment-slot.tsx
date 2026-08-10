"use client";

import * as React from "react";
import {
  FileTextIcon,
  RefreshCwIcon,
  TriangleAlertIcon,
  UploadIcon,
  XIcon,
} from "lucide-react";
import { Button } from "@peckey954/ui/components/ui/button";
import { Label } from "@peckey954/ui/components/ui/label";
import { cn } from "@peckey954/ui/lib/utils";
import type { Attachment } from "@/lib/weighing";

const MAX_BYTES = 10 * 1024 * 1024;

const formatSize = (bytes: number) =>
  bytes >= 1_048_576
    ? `${(bytes / 1_048_576).toFixed(1)} MB`
    : `${Math.round(bytes / 1024)} KB`;

const isAllowed = (file: File) =>
  file.type.startsWith("image/") || file.type === "application/pdf";

export function AttachmentSlot({
  id,
  label,
  hint,
  value,
  onChange,
}: {
  id: string;
  label: string;
  hint: string;
  value: Attachment | null;
  onChange: (next: Attachment | null) => void;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  // ไฟล์ที่นามสกุลเป็นรูปแต่เนื้อในเสีย จะโหลด thumbnail ไม่ขึ้น
  const [thumbBroken, setThumbBroken] = React.useState(false);

  // ลากผ่านลูก ๆ ข้างในจะยิง dragleave รัว ๆ นับชั้นไว้กันไฮไลต์กะพริบ
  const depth = React.useRef(0);

  // blob URL ที่สร้างเองต้องคืนหน่วยความจำ ไม่งั้นค้างจนกว่าจะปิดแท็บ
  const createdUrl = React.useRef<string | null>(null);
  React.useEffect(
    () => () => {
      if (createdUrl.current) URL.revokeObjectURL(createdUrl.current);
    },
    []
  );

  function accept(file: File | undefined | null) {
    if (!file) return;
    if (!isAllowed(file)) {
      setError("รองรับเฉพาะไฟล์รูปภาพและ PDF");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError(`ไฟล์ใหญ่เกิน ${formatSize(MAX_BYTES)}`);
      return;
    }
    if (createdUrl.current) URL.revokeObjectURL(createdUrl.current);
    const previewUrl = file.type.startsWith("image/")
      ? URL.createObjectURL(file)
      : undefined;
    createdUrl.current = previewUrl ?? null;
    setError(null);
    setThumbBroken(false);
    onChange({ fileName: file.name, size: file.size, previewUrl });
  }

  function clear() {
    if (createdUrl.current) {
      URL.revokeObjectURL(createdUrl.current);
      createdUrl.current = null;
    }
    setError(null);
    onChange(null);
  }

  const dropZone = {
    onDragEnter: (e: React.DragEvent) => {
      e.preventDefault();
      depth.current += 1;
      setDragActive(true);
    },
    onDragOver: (e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
    },
    onDragLeave: (e: React.DragEvent) => {
      e.preventDefault();
      depth.current -= 1;
      if (depth.current <= 0) {
        depth.current = 0;
        setDragActive(false);
      }
    },
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      depth.current = 0;
      setDragActive(false);
      accept(e.dataTransfer.files?.[0]);
    },
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>

      <input
        ref={inputRef}
        id={id}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={(e) => {
          accept(e.target.files?.[0]);
          e.target.value = "";
        }}
      />

      {/* ทั้งกล่องเป็นพื้นที่วางไฟล์ — มีไฟล์อยู่แล้วก็ลากทับเพื่อแทนที่ได้ */}
      <div className="relative" {...dropZone}>
        {value ? (
          <div
            className={cn(
              "flex items-center gap-3 rounded-lg border border-border p-3 transition-colors",
              dragActive && "border-primary bg-brand"
            )}
          >
            {value.previewUrl && !thumbBroken ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={value.previewUrl}
                alt=""
                onError={() => setThumbBroken(true)}
                className="size-16 shrink-0 rounded-md border border-border object-cover"
              />
            ) : (
              <span className="flex size-16 shrink-0 items-center justify-center rounded-md border border-border">
                <FileTextIcon className="size-6" />
              </span>
            )}

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{value.fileName}</p>
              <p className="text-sm text-muted-foreground">
                {formatSize(value.size)}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                ลากไฟล์ใหม่มาวางทับเพื่อแทนที่
              </p>
            </div>

            <div className="flex shrink-0 flex-col gap-1">
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`เปลี่ยนไฟล์ ${label}`}
                onClick={() => inputRef.current?.click()}
              >
                <RefreshCwIcon />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`ลบไฟล์ ${label}`}
                onClick={clear}
              >
                <XIcon />
              </Button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className={cn(
              "flex min-h-40 w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-6 text-center transition-colors",
              "focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
              dragActive
                ? "border-primary bg-brand"
                : "border-border hover:bg-accent-hover"
            )}
          >
            <UploadIcon className="size-8" />
            <span className="text-sm font-medium">
              {dragActive ? "วางไฟล์ที่นี่" : "ลากไฟล์มาวาง หรือคลิกเพื่อเลือก"}
            </span>
            <span className="text-sm text-muted-foreground">{hint}</span>
            <span className="text-sm text-muted-foreground">
              รูปภาพหรือ PDF · ไม่เกิน {formatSize(MAX_BYTES)}
            </span>
          </button>
        )}
      </div>

      {error && (
        <p className="flex items-center gap-1.5 text-sm text-destructive">
          <TriangleAlertIcon className="size-4 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}
