"use client";

import { PlusIcon, Trash2Icon } from "lucide-react";
import { Button } from "@peckey954/ui/components/ui/button";
import { Label } from "@peckey954/ui/components/ui/label";
import { Switch } from "@peckey954/ui/components/ui/switch";
import { ChipGroup } from "@/components/chip-group";
import { TimeField } from "@/components/time-field";
import {
  SCHEDULE_MODE_HINT,
  SKIP_DAYS_LABEL,
  newSlot,
  slotOvernight,
  type Schedule,
  type SkipDays,
  type TimeSlot,
} from "@/lib/qc-template";

/* ------------------------------------------------------------------
   รอบการตรวจ

   มีแค่สองทาง จึงเป็นสวิตช์เดียว ไม่ใช่ตัวเลือกสองอัน — ปิด (ค่าเริ่มต้น) = เปิดใบตามเหตุ
   ปกติ เปิด = ตรวจตามรอบเวลา ถึงตั้งช่วงเวลาให้ตั้ง ปฏิทินกับตารางทั้งเดือนตามมาเอง
   ไม่ต้องมีติ๊กเปิดปฏิทินแยกอีกชั้น เพราะฟอร์มที่เปิดใบตามเหตุ ไม่มีจำนวนใบที่ควรมีต่อวัน
   ปฏิทินของมันจะเต็มไปด้วยช่องว่างที่แปลไม่ได้ว่าคือ "ยังไม่ทำ" หรือ "ไม่มีอะไรให้ทำ"
------------------------------------------------------------------ */

export function ScheduleEditor({
  schedule,
  onChange,
}: {
  schedule: Schedule;
  onChange: (next: Schedule) => void;
}) {
  const set = (patch: Partial<Schedule>) => onChange({ ...schedule, ...patch });

  const patchSlot = (id: string, p: Partial<TimeSlot>) =>
    set({ slots: schedule.slots.map((s) => (s.id === id ? { ...s, ...p } : s)) });

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-0.5">
          <Label htmlFor="sch-recurring">เปิดใบตามรอบเวลาทำงาน</Label>
          <p className="text-sm text-muted-foreground">
            {SCHEDULE_MODE_HINT[schedule.mode]}
          </p>
        </div>
        <Switch
          id="sch-recurring"
          checked={schedule.mode === "recurring"}
          onCheckedChange={(c) =>
            set({
              mode: c ? "recurring" : "perEvent",
              // เปิดครั้งแรกให้มีช่วงเวลาแรกรอไว้เลย เปิดแล้วเจอลิสต์ว่างคือให้คนเดาต่อว่าต้องทำอะไร
              slots: c && schedule.slots.length === 0 ? [newSlot()] : schedule.slots,
            })
          }
        />
      </div>

      {schedule.mode === "recurring" && (
        <>
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <Label>ช่วงเวลาที่ต้องตรวจในหนึ่งวัน</Label>
                <p className="text-sm text-muted-foreground">
                  หนึ่งช่วงเวลาคือหนึ่งใบต่อวัน — ตั้งไว้ {schedule.slots.length} ใบต่อวัน
                </p>
              </div>
              <Button
                variant="outline-primary"
                size="sm"
                onClick={() => set({ slots: [...schedule.slots, newSlot()] })}
              >
                <PlusIcon />
                เพิ่มช่วงเวลา
              </Button>
            </div>

            {schedule.slots.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                ยังไม่ได้ตั้งช่วงเวลา — ต้องมีอย่างน้อยหนึ่งช่วง ปฏิทินจึงจะรู้ว่าวันหนึ่งควรมีกี่ใบ
              </p>
            ) : (
              <div className="space-y-2">
                {schedule.slots.map((s, i) => (
                  <div
                    key={s.id}
                    className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-border p-3"
                  >
                    <span className="w-16 shrink-0 text-sm text-muted-foreground">
                      ช่วงที่ {i + 1}
                    </span>
                    <TimeField
                      aria-label={`เวลาเริ่มของช่วงที่ ${i + 1}`}
                      className="w-32"
                      value={s.from}
                      onValueChange={(from) => patchSlot(s.id, { from })}
                    />
                    <span className="text-muted-foreground">ถึง</span>
                    <TimeField
                      aria-label={`เวลาสิ้นสุดของช่วงที่ ${i + 1}`}
                      className="w-32"
                      value={s.to}
                      onValueChange={(to) => patchSlot(s.id, { to })}
                    />
                    {/* ช่วงที่คร่อมเที่ยงคืนไม่ต้องให้ติ๊กบอก อ่านจากเวลาได้เอง
                        ให้ติ๊กเองเมื่อไหร่ก็ตั้งขัดกับเวลาจริงได้เมื่อนั้น */}
                    {slotOvernight(s) && (
                      <span className="text-sm text-muted-foreground">
                        ข้ามคืน — ใบเป็นของวันที่ช่วงเวลาเริ่ม
                      </span>
                    )}
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="ml-auto"
                      aria-label={`ลบช่วงที่ ${i + 1}`}
                      onClick={() =>
                        set({ slots: schedule.slots.filter((x) => x.id !== s.id) })
                      }
                    >
                      <Trash2Icon />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>วันที่ต้องตรวจ</Label>
            <ChipGroup
              label="วันที่ต้องตรวจ"
              options={(["none", "weekend"] as SkipDays[]).map((d) => ({
                id: d,
                label: SKIP_DAYS_LABEL[d],
              }))}
              value={schedule.skipDays}
              onChange={(skipDays) => set({ skipDays })}
            />
            <p className="text-sm text-muted-foreground">
              วันที่เว้นไว้จะขึ้นเป็นวันหยุดในปฏิทิน ไม่ใช่วันที่ตรวจไม่ครบ
            </p>
          </div>
        </>
      )}
    </div>
  );
}
