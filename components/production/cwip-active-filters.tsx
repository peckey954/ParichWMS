"use client";

import * as React from "react";
import { RotateCcwIcon, XIcon } from "lucide-react";
import { cn } from "@peckey954/ui/lib/utils";
import { type CwipView } from "./packing-cwip";

/* ------------------------------------------------------------------
   แถวบอกว่ากรองอะไรอยู่

   ตัวกรองคือสถานะที่มองไม่เห็น ท่าพังที่เจอบ่อยที่สุดคือ
   กรองไว้ ลืม กลับมาอีกวัน เห็นรายการสั้นผิดปกติ แล้วสรุปว่า "ของหมด"
   ทั้งที่จริงคือ "กรองไว้" — ในคลังการสรุปผิดแบบนี้ทำให้สั่งของผิด

   เลขบนปุ่มตัวกรองบอกว่ากี่เงื่อนไข แต่ไม่บอกว่าอะไร แถวนี้บอก

   อยู่ในการ์ดมีขอบ ไม่ใช่ป้ายลอย ๆ บนพื้นหน้า
   เหนือช่องค้นหามีชิปกลมอยู่แล้วห้าอันซึ่งหน้าตาใกล้กันมาก แต่ความหมายตรงข้าม
   ชิปบน = "กำลังดูอันนี้" ป้ายในนี้ = "กรองอันนี้อยู่ กด ✕ แล้วหาย"
   กรอบของการ์ดคือสิ่งที่แยกสองอย่างนี้ออกจากกัน ไม่ใช่รูปทรงของป้าย

   ป้ายบอกชื่อฟิลด์กับจำนวน ไม่ใช่ค่าทุกตัว
   เลือกโซนไว้หกอันแล้วพิมพ์ชื่อครบทั้งหกจะกินความกว้างเกินช่องค้นหา
   ยกเว้นเลือกอันเดียว ค่อยโชว์ค่าจริง เพราะกรณีนั้นค่ามันบอกอะไรได้
------------------------------------------------------------------ */

type Token = { key: string; label: string; clear: Partial<CwipView> };

function tokensOf(view: CwipView): Token[] {
  const t: Token[] = [];

  if (view.kinds.length > 0) {
    t.push({
      key: "kinds",
      label:
        view.kinds.length === 1
          ? `หมวด: ${view.kinds[0]}`
          : `หมวด (${view.kinds.length})`,
      clear: { kinds: [] },
    });
  }

  if (view.products.length > 0) {
    t.push({
      key: "products",
      label:
        view.products.length === 1
          ? `สินค้า: ${view.products[0]}`
          : `สินค้า (${view.products.length})`,
      clear: { products: [] },
    });
  }

  return t;
}

const MAX_SHOWN = 3;

export function CwipActiveFilters({
  view,
  onChange,
  onOpenFilter,
}: {
  view: CwipView;
  onChange: (next: CwipView) => void;
  /** จอแคบกดบรรทัดสรุปแล้วเปิดกล่องตัวกรองไปแก้ข้างในเอา */
  onOpenFilter?: () => void;
}) {
  const tokens = tokensOf(view);

  // ไม่มีอะไรกรอง = ไม่มีแถว ไม่จองที่ว่างไว้
  // ความรกจะเกิดต่อเมื่อผู้ใช้เป็นคนสร้างมันขึ้นมาเอง
  if (tokens.length === 0) return null;

  const shown = tokens.slice(0, MAX_SHOWN);
  const rest = tokens.length - shown.length;

  const clearAll = () =>
    onChange({
      ...view,
      kinds: [],
      products: [],
    });

  return (
    <>
      {/* ---------- จอแคบ: บรรทัดเดียว ----------
           390px ใส่ป้ายแล้วตกสามบรรทัด ซึ่งคือความรกที่พยายามเลี่ยงพอดี
           บอกแค่จำนวน กดแล้วเข้าไปแก้ในกล่องตัวกรอง */}
      <button
        type="button"
        onClick={onOpenFilter}
        className={cn(
          "mt-3 flex w-full items-center justify-between gap-3 rounded-lg",
          "bg-secondary px-3 py-2 text-left text-sm @3xl:hidden"
        )}
      >
        <span>
          กรองอยู่{" "}
          <span className="font-semibold tabular-nums">{tokens.length}</span>{" "}
          เงื่อนไข
        </span>
        <span
          role="button"
          tabIndex={0}
          aria-label="ล้างตัวกรองทั้งหมด"
          onClick={(e) => {
            e.stopPropagation();
            clearAll();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              e.stopPropagation();
              clearAll();
            }
          }}
          className="shrink-0 font-medium text-primary"
        >
          ล้างค่า
        </span>
      </button>

      {/* ---------- จอกว้าง: การ์ดป้ายถอดได้ทีละอัน ----------
           อยู่ในการ์ดมีขอบ ไม่ใช่ป้ายลอย ๆ บนพื้นหน้า
           กรอบคือสิ่งที่แยกมันออกจากชิปนำทางด้านบนที่หน้าตาใกล้กัน
           ในกรอบ = เงื่อนไขที่กรองอยู่ นอกกรอบ = อันที่กำลังเลือกดู */}
      <div className="mt-3 hidden rounded-xl border border-border bg-card px-4 py-3 @3xl:block">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="text-sm text-muted-foreground">ตัวกรอง:</span>

          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
            {shown.map((t) => (
              <span
                key={t.key}
                className="flex items-center gap-1.5 rounded-full border border-border bg-brand py-1 pr-1.5 pl-3 text-sm"
              >
                {t.label}
                <button
                  type="button"
                  aria-label={`เอา ${t.label} ออก`}
                  onClick={() => onChange({ ...view, ...t.clear })}
                  className="rounded-full p-0.5 text-muted-foreground transition-colors hover:text-foreground"
                >
                  <XIcon className="size-3.5" />
                </button>
              </span>
            ))}

            {rest > 0 && (
              <button
                type="button"
                onClick={onOpenFilter}
                className="rounded-full border border-dashed border-border px-3 py-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                +{rest}
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={clearAll}
            className="ml-auto flex shrink-0 items-center gap-1.5 text-sm font-medium text-primary"
          >
            <RotateCcwIcon className="size-4" />
            ล้างค่า
          </button>
        </div>
      </div>
    </>
  );
}
