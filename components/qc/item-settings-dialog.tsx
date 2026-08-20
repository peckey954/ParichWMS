"use client";

import * as React from "react";
import { MinusIcon, PlusIcon, RotateCcwIcon, SquarePenIcon } from "lucide-react";
import { Button } from "@peckey954/ui/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@peckey954/ui/components/ui/dialog";
import { Input } from "@peckey954/ui/components/ui/input";
import { Label } from "@peckey954/ui/components/ui/label";
import { cn } from "@peckey954/ui/lib/utils";
import { CheckChip } from "@/components/check-chip";
import { ChoiceGroup, type Choice } from "@/components/choice-group";
import {
  ITEM_SETTINGS_DEFAULT,
  NOTE_MODE_HINT,
  NOTE_MODE_LABEL,
  VERDICT_HINT,
  VERDICT_LABEL,
  VERDICT_WORDING_LABEL,
  isSettingsDefault,
  type ItemSettings,
  type NoteMode,
  type VerdictMode,
  type VerdictWording,
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

const VERDICT_ORDER: VerdictMode[] = ["manual", "auto", "none"];
const WORDING_ORDER: VerdictWording[] = ["passFail", "normalAbnormal"];
const NOTE_ORDER: NoteMode[] = ["off", "optional", "onFail", "always"];

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

  const verdictOptions: Choice<VerdictMode>[] = VERDICT_ORDER.map((v) => ({
    id: v,
    label: VERDICT_LABEL[v],
    disabled: v === "auto" && !canAutoJudge,
    disabledHint: "ต้องมีช่องตัวเลขที่ตั้งเกณฑ์ไว้อย่างน้อยหนึ่งช่องก่อน",
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
        className="flex max-h-[85svh] flex-col gap-0 overflow-hidden! p-0 sm:max-w-md [&_[data-slot=dialog-close]]:focus:ring-0 [&_[data-slot=dialog-close]]:focus:ring-offset-0 [&_[data-slot=dialog-close]]:focus-visible:ring-2 [&_[data-slot=dialog-close]]:focus-visible:ring-ring [&_[data-slot=dialog-close]]:focus-visible:ring-offset-2"
      >
        <DialogHeader className="px-4 pt-4 text-left">
          {/* บอกด้วยว่ากำลังแก้ข้อไหน ฟอร์มยาว ๆ เปิดกล่องแล้วลืมได้ง่าย */}
          <DialogTitle className="pr-8">การแสดงข้อมูล — {title}</DialogTitle>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
          <Section title="การตรวจสอบ">
            <ChoiceGroup
              label="การตรวจสอบ"
              options={verdictOptions}
              value={draft.verdict}
              onChange={(verdict) => set({ verdict })}
            />
            <Hint>{VERDICT_HINT[draft.verdict]}</Hint>

            {/* คำที่ใช้บนปุ่มติ๊กมีความหมายเฉพาะตอนผู้ตรวจติ๊กเอง
                โหมดอื่นไม่มีปุ่มให้ติ๊ก ตัวเลือกนี้จึงไม่ต้องอยู่ */}
            {draft.verdict === "manual" && (
              <div className="mt-3">
                <Label className="text-sm font-normal text-muted-foreground">
                  คำที่ใช้บนปุ่มติ๊ก
                </Label>
                <ChoiceGroup
                  className="mt-2"
                  label="คำที่ใช้บนปุ่มติ๊ก"
                  options={WORDING_ORDER.map((w) => ({
                    id: w,
                    label: VERDICT_WORDING_LABEL[w],
                  }))}
                  value={draft.verdictWording}
                  onChange={(verdictWording) => set({ verdictWording })}
                />
              </div>
            )}
          </Section>

          <Section title="หมายเหตุ">
            <ChoiceGroup
              label="หมายเหตุ"
              options={NOTE_ORDER.map((n) => ({
                id: n,
                label: NOTE_MODE_LABEL[n],
              }))}
              value={draft.note}
              onChange={(note) => set({ note })}
            />
            <Hint>{NOTE_MODE_HINT[draft.note]}</Hint>
          </Section>

          <Section title="จำนวนครั้ง">
            <ChoiceGroup
              label="จำนวนครั้ง"
              options={[
                { id: "once", label: "ครั้งเดียว" },
                { id: "many", label: "มากกว่า 1 ครั้ง" },
              ]}
              value={draft.repeatable ? "many" : "once"}
              onChange={(v) =>
                set(
                  v === "many"
                    ? {
                        repeatable: true,
                        // เปิดครั้งแรกให้เริ่มที่สองครั้ง เพราะ "หลายครั้ง" ที่แปลว่าครั้งเดียวไม่มีความหมาย
                        defaultRounds: Math.max(2, draft.defaultRounds),
                        maxRounds: Math.max(3, draft.maxRounds),
                      }
                    : { repeatable: false }
                )
              }
            />

            {draft.repeatable && (
              <div className="mt-3 grid grid-cols-2 gap-3">
                <Stepper
                  label="จำนวนครั้งเริ่มต้น"
                  value={draft.defaultRounds}
                  min={1}
                  max={draft.maxRounds}
                  onChange={(defaultRounds) => set({ defaultRounds })}
                />
                <Stepper
                  label="เพิ่มได้สูงสุด"
                  value={draft.maxRounds}
                  // เพิ่มได้สูงสุดน้อยกว่าจำนวนที่ขึ้นให้ตั้งแต่แรกไม่ได้ ตารางจะขัดกับตัวเอง
                  min={draft.defaultRounds}
                  max={20}
                  onChange={(maxRounds) => set({ maxRounds })}
                />
              </div>
            )}
          </Section>

          {/* วันที่กับเวลาไม่มีเนื้อหาให้เว้นว่าง จึงต้องมีติ๊กบอกว่าเอาหรือไม่เอา
              ต่างจากชื่อย่อยกับเกณฑ์ที่ "ว่าง = ไม่มี" ตอบตัวเองอยู่แล้ว
              วันที่ในหัวเอกสารคือวันที่ของทั้งใบ ส่วนอันนี้คือของแต่ละครั้งที่ตรวจ
              ข้อที่ตรวจซ้ำข้ามวันจึงต้องรู้ว่าครั้งไหนวันไหน */}
          <Section title="ช่องเพิ่มเติม">
            <div className="flex flex-wrap gap-2">
              <CheckChip
                id="qc-with-date"
                label="วันที่ตรวจ"
                checked={draft.withDate}
                onChange={(withDate) => set({ withDate })}
              />
              <CheckChip
                id="qc-with-time"
                label="เวลาที่ตรวจ"
                checked={draft.withTime}
                onChange={(withTime) => set({ withTime })}
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

/** บรรทัดอธิบายว่าตัวเลือกที่เลือกอยู่แปลว่าอะไรตอนตรวจจริง */
function Hint({ children }: { children: React.ReactNode }) {
  return <p className="mt-2 text-sm text-muted-foreground">{children}</p>;
}

/**
 * ช่องตัวเลขที่มีปุ่มลบ/บวก
 * ค่าที่ใช้จริงอยู่ระหว่าง 1 ถึง 20 พิมพ์เองก็ได้แต่ส่วนใหญ่กดปุ่มเร็วกว่า
 */
function Stepper({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  const clamp = (v: number) => Math.min(max, Math.max(min, v));
  const id = `stepper-${label}`;

  return (
    <div>
      <Label htmlFor={id} className="text-sm font-normal text-muted-foreground">
        {label}
      </Label>
      <div className="mt-2 flex items-center rounded-md border border-border bg-card">
        <StepButton
          label={`ลด${label}`}
          disabled={value <= min}
          onClick={() => onChange(clamp(value - 1))}
        >
          <MinusIcon />
        </StepButton>
        <Input
          id={id}
          type="number"
          value={value}
          min={min}
          max={max}
          onChange={(e) => onChange(clamp(Number(e.target.value) || min))}
          className="h-10 min-w-0 flex-1 border-0 bg-transparent text-center tabular-nums shadow-none focus-visible:ring-0"
        />
        <StepButton
          label={`เพิ่ม${label}`}
          disabled={value >= max}
          onClick={() => onChange(clamp(value + 1))}
        >
          <PlusIcon />
        </StepButton>
      </div>
    </div>
  );
}

function StepButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex size-10 shrink-0 items-center justify-center rounded-md text-muted-foreground",
        "transition-colors hover:text-foreground disabled:opacity-40",
        "focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
        "[&_svg]:size-4"
      )}
    >
      {children}
    </button>
  );
}
