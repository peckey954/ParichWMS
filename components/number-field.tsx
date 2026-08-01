"use client";

import * as React from "react";
import { formatNumber } from "@/lib/format";

/**
 * ช่องกรอกตัวเลขที่โชว์เครื่องหมายคั่นหลัก (1,000) ตอนไม่ได้โฟกัส
 * แต่ปล่อยให้พิมพ์อิสระตอนกำลังแก้ แล้วค่อย parse ตอน blur
 * คืนค่าเป็น props ให้เอาไปกระจายใส่ <Input> หรือ <InputGroupInput> ก็ได้
 */
export function useNumberField(
  value: number,
  onValueChange: (next: number) => void,
  digits = 0
) {
  const [draft, setDraft] = React.useState<string | null>(null);

  return {
    value: draft ?? formatNumber(value, digits),
    inputMode: "decimal" as const,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setDraft(e.target.value),
    onFocus: () => setDraft(String(value)),
    onBlur: () => {
      if (draft !== null) {
        const parsed = Number(draft.replace(/,/g, "").trim());
        onValueChange(Number.isFinite(parsed) && parsed >= 0 ? parsed : value);
      }
      setDraft(null);
    },
  };
}
