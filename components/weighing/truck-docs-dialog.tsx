"use client";

import { PaperclipIcon } from "lucide-react";
import { Badge } from "@peckey954/ui/components/ui/badge";
import { Button } from "@peckey954/ui/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@peckey954/ui/components/ui/dialog";
import { Label } from "@peckey954/ui/components/ui/label";
import { Textarea } from "@peckey954/ui/components/ui/textarea";
import { AttachmentSlot } from "@/components/weighing/attachment-slot";
import { docCount, type Truck } from "@/lib/weighing";

export function TruckDocsDialog({
  truck,
  onPatch,
}: {
  truck: Truck;
  onPatch: (patch: Partial<Truck>) => void;
}) {
  const count = docCount(truck);
  const complete = count === 2;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <PaperclipIcon />
          <Badge
            tone={complete ? "success" : "warning"}
            appearance="soft"
            className="tabular-nums"
          >
            {count}/2
          </Badge>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            เอกสารแนบ — {truck.plate || "ยังไม่ได้ใส่ทะเบียน"}
          </DialogTitle>
          <DialogDescription>
            สแกนเอกสารแล้วอัปโหลดเก็บไว้กับใบชั่งคันนี้ รองรับรูปภาพและ PDF
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 sm:grid-cols-2">
          <AttachmentSlot
            id={`sup-${truck.id}`}
            label="ใบชั่งของซัพพลายเออร์"
            hint="รูปถ่ายหรือ PDF ของใบชั่งต้นทาง"
            value={truck.supplierTicket}
            onChange={(supplierTicket) => onPatch({ supplierTicket })}
          />
          <AttachmentSlot
            id={`id-${truck.id}`}
            label="สำเนาบัตรประชาชนคนขับ"
            hint="ใช้ยืนยันตัวคนขับที่นำของมาส่ง"
            value={truck.driverIdCard}
            onChange={(driverIdCard) => onPatch({ driverIdCard })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`note-${truck.id}`}>
            หมายเหตุของคันนี้{" "}
            <span className="font-normal text-muted-foreground">
              (ไม่บังคับ)
            </span>
          </Label>
          <Textarea
            id={`note-${truck.id}`}
            value={truck.note}
            placeholder="เช่น รอสำเนาบัตรจากคนขับ"
            onChange={(e) => onPatch({ note: e.target.value })}
          />
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button>เสร็จสิ้น</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
