"use client";

import * as React from "react";
import { EyeIcon, HistoryIcon } from "lucide-react";
import { Button } from "@peckey954/ui/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@peckey954/ui/components/ui/dialog";
import { FormPreview } from "@/components/qc/form-preview";
import type { QcTemplate } from "@/lib/qc-template";

/**
 * ดูโครงฟอร์มของเวอร์ชันเก่าแบบอ่านอย่างเดียว — ใช้ FormPreview ตัวเดียวกับแท็บ
 * "ตัวอย่างฟอร์ม" เพื่อให้เห็นหน้าตาเดียวกับที่ผู้ตรวจเคยเจอจริงตอนเวอร์ชันนั้นใช้งานอยู่
 *
 * มีปุ่ม "ใช้เวอร์ชันนี้เป็นฉบับร่างใหม่" ท้ายกล่อง — คือทางย้อนกลับไปใช้งาน
 * ไม่ได้ทับเวอร์ชันปัจจุบันตรง ๆ แต่ดึงโครงมาตั้งเป็นฉบับร่างใหม่ให้แก้/เผยแพร่ต่อ
 */
export function VersionPreviewDialog({
  version,
  onRestore,
}: {
  version: QcTemplate;
  onRestore: () => void;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <EyeIcon />
          ดู
        </Button>
      </DialogTrigger>

      <DialogContent
        aria-describedby={undefined}
        className="flex max-h-[85svh] flex-col gap-0 overflow-hidden! p-0 sm:max-w-3xl"
      >
        <DialogHeader className="px-4 pt-4 text-left">
          <DialogTitle className="pr-8">
            {version.name} — {version.revision}
          </DialogTitle>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          <FormPreview template={version} />
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border px-4 py-3">
          <Button
            variant="outline-primary"
            onClick={() => {
              onRestore();
              setOpen(false);
            }}
          >
            <HistoryIcon />
            ใช้เวอร์ชันนี้เป็นฉบับร่างใหม่
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
