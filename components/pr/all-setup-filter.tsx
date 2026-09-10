"use client";

import * as React from "react";
import { Button } from "@peckey954/ui/components/ui/button";
import { CheckChip } from "@/components/check-chip";
import { usePrSetup } from "@/components/pr/pr-setup-provider";

/* ------------------------------------------------------------------
   ตัวกรองของหน้าตั้งค่าสินค้าแบบหน้าเดียว

   แก้ในกล่องก่อน กดตกลงถึงมีผล — ชุดเดียวกับตัวกรองหน้าอื่นในแอป
   กากบาทหรือ Esc คือยกเลิก ค่าที่แก้ค้างไว้ไม่มีผล
------------------------------------------------------------------ */

export type AllFilter = {
  categoryIds: string[];
  groupIds: string[];
  warehouseIds: string[];
  status: "all" | "on" | "off";
};

export const EMPTY_FILTER: AllFilter = {
  categoryIds: [],
  groupIds: [],
  warehouseIds: [],
  status: "all",
};

export const isFilterEmpty = (f: AllFilter) =>
  f.categoryIds.length === 0 &&
  f.groupIds.length === 0 &&
  f.warehouseIds.length === 0 &&
  f.status === "all";

const STATUS: { id: AllFilter["status"]; label: string }[] = [
  { id: "all", label: "ทั้งหมด" },
  { id: "on", label: "เปิดใช้งาน" },
  { id: "off", label: "ปิดใช้งาน" },
];

export function AllSetupFilter({
  value,
  onApply,
}: {
  value: AllFilter;
  onApply: (next: AllFilter) => void;
}) {
  const { setup } = usePrSetup();
  const [draft, setDraft] = React.useState(value);

  const toggle = (key: "categoryIds" | "groupIds" | "warehouseIds", id: string, on: boolean) =>
    setDraft((d) => ({
      ...d,
      [key]: on ? [...d[key], id] : d[key].filter((x) => x !== id),
    }));

  return (
    <div className="grid gap-5">
      <Section label="ประเภทสินค้า">
        {setup.categories
          .filter((c) => c.label.trim() !== "")
          .map((c) => (
            <CheckChip
              key={c.id}
              id={`f-cat-${c.id}`}
              label={c.label}
              checked={draft.categoryIds.includes(c.id)}
              onChange={(v) => toggle("categoryIds", c.id, v)}
            />
          ))}
      </Section>

      <Section label="หมวดสินค้า">
        {setup.groups
          .filter((g) => g.label.trim() !== "")
          .map((g) => (
            <CheckChip
              key={g.id}
              id={`f-grp-${g.id}`}
              label={g.label}
              checked={draft.groupIds.includes(g.id)}
              onChange={(v) => toggle("groupIds", g.id, v)}
            />
          ))}
      </Section>

      <Section label="คลังปลายทาง">
        {setup.warehouses.map((w) => (
          <CheckChip
            key={w.id}
            id={`f-wh-${w.id}`}
            label={w.label || "(ยังไม่ได้ตั้งชื่อ)"}
            checked={draft.warehouseIds.includes(w.id)}
            onChange={(v) => toggle("warehouseIds", w.id, v)}
          />
        ))}
      </Section>

      <Section label="การใช้งาน">
        {STATUS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setDraft((d) => ({ ...d, status: s.id }))}
            aria-pressed={draft.status === s.id}
            className={
              draft.status === s.id
                ? "rounded-full border border-primary bg-brand px-3 py-1 text-sm font-medium text-primary"
                : "rounded-full border border-border px-3 py-1 text-sm hover:bg-accent-hover"
            }
          >
            {s.label}
          </button>
        ))}
      </Section>

      <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
        <Button
          variant="outline-primary"
          disabled={isFilterEmpty(draft)}
          onClick={() => setDraft(EMPTY_FILTER)}
        >
          ล้างตัวกรอง
        </Button>
        <Button onClick={() => onApply(draft)}>ตกลง</Button>
      </div>
    </div>
  );
}

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}
