"use client";

import * as React from "react";
import Link from "next/link";
import { SearchIcon } from "lucide-react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@peckey954/ui/components/ui/input-group";
import { cn } from "@peckey954/ui/lib/utils";
import { IconBox, TONE_DOT } from "@/components/modules/module-icon";
import { PendingBadge } from "@/components/modules/pending-badge";
import {
  MODULE_GROUPS,
  searchModules,
  type ModuleItem,
} from "@/lib/modules";

export default function AllModulesPage() {
  const [query, setQuery] = React.useState("");
  const matched = searchModules(query);

  const groups = MODULE_GROUPS.map((g) => ({
    ...g,
    items: matched.filter((m) => m.group === g.id),
  })).filter((g) => g.items.length > 0);

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
      {/* เต็มความกว้างของพื้นที่เนื้อหา (max-w-7xl ของ main) — เดิมมี max-w-2xl
          ครอบไว้อีกชั้น ทำให้ช่องค้นหาแคบกว่าเนื้อหาข้างล่างมาก ดูเหมือนเติม
          พื้นที่ไม่เต็ม/ลอยอยู่ตรงกลางแปลกๆ บนจอกว้าง
          พื้นช่องค้นหาเป็นสีการ์ด (ขาว) ให้ต่างจากพื้นเทาของพื้นที่เนื้อหา
          ค่าเริ่มต้นของ InputGroup เป็นพื้นโปร่ง สีเทาจะทะลุขึ้นมา */}
      <InputGroup className="bg-card">
        <InputGroupAddon align="inline-start">
          <SearchIcon />
        </InputGroupAddon>
        <InputGroupInput
          placeholder="ค้นหาระบบ..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </InputGroup>

      <div className="mt-6 space-y-8">
        {groups.map((g) => (
          <section key={g.id}>
            <div className="flex items-center gap-2">
              {/* หมวดที่ไม่มีสีประจำก็ไม่มีจุดนำหน้า — จุดสีคือคู่ของไอคอนบนการ์ด
                  มีจุดแต่การ์ดไม่มีสีเลยจะกลายเป็นสีที่ไม่ได้ชี้ไปหาอะไร */}
              {g.tone && (
                <span
                  className={cn(
                    "size-2.5 shrink-0 rounded-full",
                    TONE_DOT[g.tone]
                  )}
                  aria-hidden
                />
              )}
              <h2 className="font-semibold">{g.label}</h2>
              <span className="text-sm text-muted-foreground">
                {g.items.length} ระบบ
              </span>
            </div>

            {/* วัดจากความกว้างของกรอบเนื้อหา ไม่ใช่ขนาดหน้าต่าง
                ไม่งั้นโหมดจำลองมือถือจะยังขึ้นสี่ใบต่อแถวเพราะจอจริงยังกว้างอยู่

                มือถือ: หมวดที่ไม่มีไอคอนเรียงใบละแถว หมวดที่มีไอคอนสองใบต่อแถว
                การ์ดที่ไม่มีไอคอนมีแต่ชื่อกับรหัส สองใบต่อแถวจะเหลือที่ให้ชื่อ
                น้อยจนโดนตัดท้ายเกือบทุกใบ ทั้งที่ชื่อคือข้อมูลชิ้นเดียวที่ใช้เลือก
                — และการ์ดเตี้ยอยู่แล้ว เรียงใบละแถวจึงไม่ได้ทำให้หน้ายาวขึ้นมาก
                ส่วนการ์ดที่มีไอคอนสูงกว่าเท่าตัว ถ้าเรียงใบละแถวจะต้องเลื่อนนาน */}
            <div
              className={cn(
                "mt-3 grid gap-3 @2xl:grid-cols-3 @4xl:grid-cols-4",
                g.tone ? "grid-cols-2" : "grid-cols-1"
              )}
            >
              {g.items.map((m) => (
                <ModuleCard key={m.id} module={m} tone={g.tone} />
              ))}
            </div>
          </section>
        ))}

        {groups.length === 0 && (
          <div className="rounded-xl border border-dashed border-border py-16 text-center">
            <p className="font-medium">ไม่พบระบบที่ค้นหา</p>
            <p className="mt-1 text-sm text-muted-foreground">
              ลองใช้คำค้นสั้นลง หรือค้นด้วยรหัสฟอร์ม เช่น FM-QC
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

function ModuleCard({
  module: m,
  tone,
}: {
  module: ModuleItem;
  /** ไม่มี tone = การ์ดหมวดนี้ไม่มีไอคอน (ดู ModuleGroup.tone) */
  tone?: Parameters<typeof IconBox>[0]["tone"];
}) {
  const body = (
    <>
      {m.pending !== undefined && (
        <PendingBadge count={m.pending} className="absolute top-3 right-3" />
      )}
      {tone && (
        <IconBox
          name={m.icon}
          tone={tone}
          className="transition-transform duration-150 motion-safe:group-hover:scale-105"
        />
      )}
      {/* ชื่อยาวเกินการ์ดให้ตัดท้ายเป็น … ไม่ตกบรรทัดใหม่ การ์ดจะได้สูงเท่ากันทุกใบ
          ยกเว้นการ์ดไม่มีไอคอนบนมือถือที่เต็มความกว้างอยู่แล้ว ตรงนั้นปล่อยให้
          ห่อบรรทัดได้เต็ม ๆ — พอขึ้นจอกว้างการ์ดแคบลงก็กลับมาตัดเหมือนใบอื่น
          ชื่อเต็มอยู่ใน title ให้ชี้ดูได้ทุกกรณี

          ไม่มีไอคอน = ไม่ต้องเว้นระยะเผื่อไอคอน การ์ดเตี้ยลงเหลือสองบรรทัด
          ไม่ใช่การ์ดสูงเท่าเดิมที่มีที่ว่างค้างอยู่ข้างบน */}
      <div className={cn("min-w-0", tone ? "mt-6" : "pr-12")}>
        <p
          className={cn("font-semibold", tone ? "truncate" : "@2xl:truncate")}
          title={m.label}
        >
          {tone ? (
            <>
              <span className="sm:hidden">{m.shortLabel ?? m.label}</span>
              <span className="hidden sm:inline">{m.label}</span>
            </>
          ) : (
            m.label
          )}
        </p>
        <p className="mt-0.5 truncate text-sm text-muted-foreground">
          {m.code}
        </p>
      </div>
    </>
  );

  const base =
    "group relative flex h-full flex-col rounded-xl border border-border bg-card p-4 shadow-sm";

  // หน้าที่ยังไม่ได้ทำ — หน้าตาเหมือนใบอื่นทุกอย่าง แค่กดแล้วไม่ไปไหน
  // ไม่ใส่เอฟเฟกต์ตอนชี้ด้วย ไม่งั้นจะหลอกว่ากดได้
  if (!m.href) {
    return (
      <div className={base} aria-disabled>
        {body}
      </div>
    );
  }

  return (
    <Link
      href={m.href}
      className={cn(
        base,
        // ชี้ค้าง: ยกขึ้นเล็กน้อย เงาลึกขึ้น ขอบไม่เปลี่ยนสี
        "transition-[transform,box-shadow] duration-150",
        "hover:shadow-md motion-safe:hover:-translate-y-0.5",
        // กด: กดลงไปนิดหนึ่งให้รู้สึกว่ากดติด
        "motion-safe:active:translate-y-0 active:shadow-sm",
        "focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
      )}
    >
      {body}
    </Link>
  );
}
