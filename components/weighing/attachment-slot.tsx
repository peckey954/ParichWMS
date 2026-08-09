"use client";

import * as React from "react";
import { FileTextIcon, UploadIcon, XIcon } from "lucide-react";
import { Button } from "@peckey954/ui/components/ui/button";
import { Label } from "@peckey954/ui/components/ui/label";
import { cn } from "@peckey954/ui/lib/utils";
import type { Attachment } from "@/lib/weighing";

const formatSize = (bytes: number) =>
  bytes >= 1_048_576
    ? `${(bytes / 1_048_576).toFixed(1)} MB`
    : `${Math.round(bytes / 1024)} KB`;

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

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>

      {/* input จริงถูกซ่อนไว้ ให้ปุ่มของ DS เป็นตัวเปิดแทน หน้าตาจะได้ตรงระบบ */}
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onChange({ fileName: f.name, size: f.size });
          e.target.value = "";
        }}
      />

      {value ? (
        <div
          className={cn(
            "flex items-center gap-3 rounded-lg border border-border p-3"
          )}
        >
          <FileTextIcon className="size-5 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{value.fileName}</p>
            <p className="text-sm text-muted-foreground">
              {formatSize(value.size)}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`ลบไฟล์ ${label}`}
            onClick={() => onChange(null)}
          >
            <XIcon />
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={cn(
            "flex w-full flex-col items-center gap-1 rounded-lg border border-dashed border-border p-4 text-center transition-colors",
            "hover:bg-accent-hover focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
          )}
        >
          <UploadIcon className="size-5" />
          <span className="text-sm font-medium">แนบไฟล์สแกน</span>
          <span className="text-sm text-muted-foreground">{hint}</span>
        </button>
      )}
    </div>
  );
}
