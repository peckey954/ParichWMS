"use client";

import { ChevronDownIcon, ChevronUpIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { Button } from "@peckey954/ui/components/ui/button";
import { Input } from "@peckey954/ui/components/ui/input";
import { uid, type FailAction } from "@/lib/qc-template";

export function FailActionsEditor({
  actions,
  onChange,
}: {
  actions: FailAction[];
  onChange: (next: FailAction[]) => void;
}) {
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= actions.length) return;
    const next = [...actions];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <div className="space-y-3">
      {actions.map((a, i) => (
        <div key={a.id} className="flex items-center gap-2">
          <span className="w-6 shrink-0 text-sm tabular-nums text-muted-foreground">
            {i + 1}.
          </span>
          <Input
            value={a.label}
            placeholder="เช่น Repack / รับสภาพ / ส่งคืน"
            onChange={(e) =>
              onChange(
                actions.map((x) =>
                  x.id === a.id ? { ...x, label: e.target.value } : x
                )
              )
            }
          />
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="เลื่อนขึ้น"
            disabled={i === 0}
            onClick={() => move(i, -1)}
          >
            <ChevronUpIcon />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="เลื่อนลง"
            disabled={i === actions.length - 1}
            onClick={() => move(i, 1)}
          >
            <ChevronDownIcon />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="ลบตัวเลือก"
            onClick={() => onChange(actions.filter((x) => x.id !== a.id))}
          >
            <Trash2Icon />
          </Button>
        </div>
      ))}

      <Button
        variant="outline-primary"
        onClick={() => onChange([...actions, { id: uid("fa"), label: "" }])}
      >
        <PlusIcon />
        เพิ่มตัวเลือก
      </Button>
    </div>
  );
}
