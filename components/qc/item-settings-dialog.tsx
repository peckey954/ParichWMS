"use client";

import * as React from "react";
import { RotateCcwIcon, SquarePenIcon } from "lucide-react";
import { Button } from "@peckey954/ui/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@peckey954/ui/components/ui/dialog";
import { Label } from "@peckey954/ui/components/ui/label";
import { CheckChip } from "@/components/check-chip";
import { ChipGroup, type Chip } from "@/components/chip-group";
import {
  ITEM_SETTINGS_DEFAULT,
  isSettingsDefault,
  type ItemSettings,
  type NoteMode,
} from "@/lib/qc-template";

/* ------------------------------------------------------------------
   กล่องการแสดงข้อมูล

   เดิมเป็นแผงกางออกในการ์ด ซึ่งซ้อนอยู่ในการ์ดที่ซ้อนการ์ดอีกที
   กางพร้อมกันหลายข้อแล้วหน้ายาวจนหาข้อที่กำลังแก้ไม่เจอ
   ย้ายมาเป็นกล่องกลางจอ ชุดเดียวกับตัวกรองในหน้าสต็อก
   แก้ในกล่องก่อน กดตกลงถึงมีผล กากบาทกับ Esc คือยกเลิก

   ในกล่องมีแต่ "ตรวจยังไง บันทึกยังไง" ซึ่งเป็นก้อนที่ยกไปใช้กับข้ออื่นได้ทั้งก้อน
   ส่วนชื่อหัวข้อ เกณฑ์ ช่องกรอก และหัวข้อย่อย อยู่บนการ์ดตามเดิม
   เพราะเป็นของเฉพาะข้อนั้น ยกไปใช้ที่อื่นไม่ได้

   เรื่องหนึ่งอยู่ที่เดียว ไม่มีสวิตช์เปิด/ปิดคู่กับตัวเลือกที่พูดเรื่องเดิมซ้ำ
   เช่นหมายเหตุ — "ไม่มี" เป็นตัวเลือกหนึ่งในแถวเดียวกับความบังคับ
   ไม่ใช่ติ๊กเปิดข้างบนแล้วมีสามตัวเลือกซ่อนอยู่ข้างล่างอีกที
------------------------------------------------------------------ */

/**
 * การตรวจสอบเป็นแถวเดียว ไม่ใช่ "ตัดสินยังไง" แล้วมี "ใช้คำว่าอะไร" ซ่อนอยู่ข้างล่างอีกที
 * คนตั้งฟอร์มคิดเป็น "ข้อนี้ติ๊กผ่าน/ไม่ผ่าน" ไม่ได้คิดแยกสองชั้น
 */
type VerdictChoice = "passFail" | "normalAbnormal" | "auto" | "none";

const VERDICT_CHIPS: { id: VerdictChoice; label: string; hint?: string }[] = [
  { id: "passFail", label: "ผ่าน/ไม่ผ่าน" },
  { id: "normalAbnormal", label: "ปกติ/ผิดปกติ" },
  {
    id: "auto",
    label: "ระบบตัดสิน",
    hint: "ระบบตัดสินจากเกณฑ์ของช่องตัวเลข ผู้ตรวจไม่ต้องติ๊ก",
  },
  { id: "none", label: "ไม่มี" },
];

/** ป้ายในกล่องนี้ยาวกว่าป้ายบนการ์ด เพราะตรงนี้คือที่ที่ต้องอ่านให้เข้าใจก่อนเลือก */
const NOTE_CHIPS: { id: NoteMode; label: string }[] = [
  { id: "optional", label: "ไม่บังคับ" },
  { id: "onFail", label: "บังคับระบุเมื่อไม่ผ่าน/ไม่ปกติ" },
  { id: "always", label: "บังคับ" },
  { id: "off", label: "ไม่มี" },
];

const toSettings = (c: VerdictChoice): Partial<ItemSettings> =>
  c === "none"
    ? { verdict: "none" }
    : c === "auto"
      ? { verdict: "auto" }
      : { verdict: "manual", verdictWording: c };

export function ItemSettingsDialog({
  title,
  className,
  settings,
  /** ตั้งเกณฑ์ตัวเลขไว้ในช่องแล้วหรือยัง — ไม่มีก็ให้ระบบตัดสินไม่ได้ */
  canAutoJudge,
  onApply,
  onApplyToAll,
}: {
  title: string;
  className?: string;
  settings: ItemSettings;
  canAutoJudge: boolean;
  onApply: (next: ItemSettings) => void;
  /** มีเฉพาะหัวข้อหลักที่มีเพื่อนร่วมฟอร์ม — ฟอร์ม 20 ข้อที่ตั้งเหมือนกันจะได้ไม่ต้องเปิดกล่อง 20 รอบ */
  onApplyToAll?: (next: ItemSettings) => void;
}) {
  const [open, setOpen] = React.useState(false);
  // ค่าที่กำลังแก้อยู่ในกล่อง ยังไม่มีผลกับหัวข้อจนกว่าจะกดตกลง
  const [draft, setDraft] = React.useState(settings);

  const set = (next: Partial<ItemSettings>) =>
    setDraft((prev) => ({ ...prev, ...next }));

  // เปิดกล่องทีไรเริ่มจากค่าปัจจุบันเสมอ ไม่ใช่ค่าที่ค้างจากการเปิดครั้งก่อน
  const start = (v: boolean) => {
    if (v) setDraft(settings);
    setOpen(v);
  };

  const verdictValue: VerdictChoice =
    draft.verdict === "none"
      ? "none"
      : draft.verdict === "auto"
        ? "auto"
        : draft.verdictWording;

  const verdictChips: Chip<VerdictChoice>[] = VERDICT_CHIPS.map((c) => ({
    ...c,
    disabled: c.id === "auto" && !canAutoJudge,
    hint:
      c.id === "auto" && !canAutoJudge
        ? "ต้องมีช่องตัวเลขที่ตั้งเกณฑ์ไว้อย่างน้อยหนึ่งช่องก่อน"
        : c.hint,
  }));

  return (
    <Dialog open={open} onOpenChange={start}>
      <DialogTrigger asChild>
        <Button variant="outline-primary" size="sm" className={className}>
          <SquarePenIcon />
          การแสดงข้อมูล
        </Button>
      </DialogTrigger>

      {/* ปุ่มกากบาทของ DS ใช้ focus: ซึ่งติดตอนคลิกเมาส์ด้วย
          กดปิดแล้วเลยมีกรอบส้มค้างไว้ทั้งที่ไม่ได้ใช้คีย์บอร์ด
          ปิดวงแหวนของ focus แล้วคืนให้เฉพาะ focus-visible ซึ่งขึ้นเฉพาะตอนกด Tab */}
      <DialogContent
        aria-describedby={undefined}
        // กว้างกว่ากล่องตัวกรองหนึ่งขั้น เพราะชิปหมายเหตุยาวกว่าชิปทั่วไปมาก
        // "บังคับระบุเมื่อไม่ผ่าน/ไม่ปกติ" ต้องอ่านครบ ตัดบรรทัดกลางคำไม่ได้
        className="flex max-h-[85svh] flex-col gap-0 overflow-hidden! p-0 sm:max-w-lg [&_[data-slot=dialog-close]]:focus:ring-0 [&_[data-slot=dialog-close]]:focus:ring-offset-0 [&_[data-slot=dialog-close]]:focus-visible:ring-2 [&_[data-slot=dialog-close]]:focus-visible:ring-ring [&_[data-slot=dialog-close]]:focus-visible:ring-offset-2"
      >
        <DialogHeader className="px-4 pt-4 text-left">
          {/* บอกด้วยว่ากำลังแก้ข้อไหน ฟอร์มยาว ๆ เปิดกล่องแล้วลืมได้ง่าย */}
          <DialogTitle className="pr-8">การแสดงข้อมูล — {title}</DialogTitle>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
          <Section title="การตรวจสอบ">
            <ChipGroup
              label="การตรวจสอบ"
              options={verdictChips}
              value={verdictValue}
              onChange={(c) => set(toSettings(c))}
            />
          </Section>

          <Section title="หมายเหตุ">
            <ChipGroup
              label="หมายเหตุ"
              options={NOTE_CHIPS}
              value={draft.note}
              onChange={(note) => set({ note })}
            />
          </Section>

          {/* บังคับหรือข้ามได้ — ข้อที่ข้ามได้จะมีตัวเลือก "ไม่ได้ตรวจ" เพิ่มให้ผู้ตรวจ
              และไม่ถูกนับว่าใบไม่ครบ ต่างจากข้อบังคับที่เว้นว่างแล้วบันทึกไม่ได้
              คนละเรื่องกับหมายเหตุ ซึ่งบังคับ "คำอธิบาย" ไม่ใช่ "คำตอบ" */}
          <Section title="การกรอก">
            <ChipGroup
              label="การกรอก"
              options={[
                { id: "required", label: "ต้องตอบทุกใบ" },
                {
                  id: "optional",
                  label: "ข้ามได้",
                  hint: "ผู้ตรวจติ๊ก ไม่ได้ตรวจ ได้ และใบยังนับว่าครบ",
                },
              ]}
              value={draft.required ? "required" : "optional"}
              onChange={(v) => set({ required: v === "required" })}
            />
          </Section>

          {/* วันที่กับเวลาไม่มีเนื้อหาให้เว้นว่าง จึงต้องมีติ๊กบอกว่าเอาหรือไม่เอา
              ต่างจากชื่อย่อยกับเกณฑ์ที่ "ว่าง = ไม่มี" ตอบตัวเองอยู่แล้ว
              วันที่ในหัวเอกสารคือวันที่ของทั้งใบ ส่วนอันนี้คือของแต่ละครั้งที่ตรวจ
              ข้อที่ตรวจซ้ำข้ามวันจึงต้องรู้ว่าครั้งไหนวันไหน

              สองอันนี้ติ๊กพร้อมกันได้ จึงเป็นชิปที่มีกล่องติ๊กอยู่ข้างใน
              ต่างจากชิปเปล่าด้านบนที่เลือกได้อันเดียว */}
          <Section title="ข้อมูลแสดงเพิ่มเติม">
            <div className="flex flex-wrap gap-2">
              <CheckChip
                id="qc-with-time"
                label="เวลา"
                checked={draft.withTime}
                onChange={(withTime) => set({ withTime })}
              />
              <CheckChip
                id="qc-with-date"
                label="วันที่"
                checked={draft.withDate}
                onChange={(withDate) => set({ withDate })}
              />
            </div>
          </Section>
        </div>

        {/* ล้างค่าอยู่คนละมุมกับตกลง กดพลาดสลับกันคือเสียงานที่เพิ่งตั้ง */}
        <div className="flex items-center justify-between gap-2 border-t border-border px-4 py-3">
          <Button
            variant="ghost"
            className="h-10 text-primary"
            disabled={isSettingsDefault(draft)}
            onClick={() => setDraft(ITEM_SETTINGS_DEFAULT)}
          >
            <RotateCcwIcon />
            ล้างค่า
          </Button>

          <div className="flex items-center gap-2">
            {onApplyToAll && (
              <Button
                variant="outline"
                className="h-10"
                onClick={() => {
                  onApplyToAll(draft);
                  setOpen(false);
                }}
              >
                ใช้กับทุกหัวข้อ
              </Button>
            )}
            <Button
              className="h-10 w-24"
              onClick={() => {
                onApply(draft);
                setOpen(false);
              }}
            >
              ตกลง
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * หัวข้อกับเนื้อหาในกล่อง — ชุดเดียวกับกล่องตัวกรองในหน้าสต็อก
 * ทุกหัวข้อขนาดเท่ากัน ไม่มีเส้นคั่น ใช้ระยะห่างแทน
 */
function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label className="text-sm">{title}</Label>
      <div className="mt-2">{children}</div>
    </div>
  );
}
