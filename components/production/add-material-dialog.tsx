"use client";

import * as React from "react";
import { PlusIcon } from "lucide-react";
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
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldTitle,
} from "@peckey954/ui/components/ui/field";
import {
  RadioGroup,
  RadioGroupItem,
} from "@peckey954/ui/components/ui/radio-group";
import { formatNumber } from "@/lib/format";
import { ADDABLE_MATERIALS, type MaterialLine } from "@/lib/production-order";

export function AddMaterialDialog({
  existingIds,
  onAdd,
}: {
  existingIds: string[];
  onAdd: (line: MaterialLine) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [picked, setPicked] = React.useState<string | undefined>(undefined);

  const choices = ADDABLE_MATERIALS.filter((m) => !existingIds.includes(m.id));

  function handleAdd() {
    const found = choices.find((m) => m.id === picked);
    if (!found) return;
    onAdd({ ...found, useQty: 0, sweepTon: 0 });
    setPicked(undefined);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="border-primary text-primary hover:text-primary"
        >
          <PlusIcon />
          เพิ่มสินค้า
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>เพิ่มวัตถุดิบ / สินค้า</DialogTitle>
          <DialogDescription>
            เลือกรายการที่ต้องการเพิ่มเข้าใบผลิตนี้
          </DialogDescription>
        </DialogHeader>

        {choices.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            เพิ่มครบทุกรายการที่มีแล้ว
          </p>
        ) : (
          <RadioGroup value={picked} onValueChange={setPicked} className="gap-3">
            {choices.map((m) => (
              <FieldLabel htmlFor={m.id} key={m.id}>
                <Field orientation="horizontal">
                  <RadioGroupItem id={m.id} value={m.id} />
                  <FieldContent>
                    <FieldTitle>{m.name}</FieldTitle>
                    <FieldDescription>
                      {m.sub ? `${m.sub} · ` : ""}
                      คงเหลือ {formatNumber(m.stockQty)} {m.suggestUnit}
                    </FieldDescription>
                  </FieldContent>
                </Field>
              </FieldLabel>
            ))}
          </RadioGroup>
        )}

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">ยกเลิก</Button>
          </DialogClose>
          <Button onClick={handleAdd} disabled={!picked}>
            เพิ่ม
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
