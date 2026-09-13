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

                มือถือเรียงใบละแถว — สองใบต่อแถวทำให้ชื่อยาวโดนตัดท้ายเกือบทุกใบ
                ("ตรวจวัตถุดิบก่อนผลิต" "สูตรการผลิตประจำสัปดาห์") ซึ่งเป็นข้อมูล
                ชิ้นเดียวที่คนใช้เลือกเมนู การ์ดสลับเป็นแนวนอนในโหมดนี้ด้วย
                ความสูงจึงไม่ได้เพิ่มเป็นเท่าตัวตามจำนวนแถว */}
            <div className="mt-3 grid gap-3 @2xl:grid-cols-3 @4xl:grid-cols-4">
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
        <PendingBadge
          count={m.pending}
          // แนวนอนวางกลางแถว แนวตั้งวางมุมบนขวาเหมือนเดิม
          className="absolute top-1/2 right-4 -translate-y-1/2 @2xl:top-3 @2xl:right-3 @2xl:translate-y-0"
        />
      )}
      {tone && (
        <IconBox
          name={m.icon}
          tone={tone}
          className="shrink-0 transition-transform duration-150 motion-safe:group-hover:scale-105"
        />
      )}
      {/* มือถือ: การ์ดเต็มความกว้าง ชื่อจึงห่อบรรทัดได้เต็ม ๆ ไม่ต้องตัดท้าย
          จอกว้าง: การ์ดแคบลง ตัดท้ายเป็น … เพื่อให้ทุกใบสูงเท่ากัน
          ชื่อเต็มอยู่ใน title ให้ชี้ดูได้ทั้งสองแบบ

          ไม่มีไอคอน = ไม่ต้องเว้นระยะเผื่อไอคอนบนจอกว้าง การ์ดเตี้ยลงเหลือ
          สองบรรทัด ไม่ใช่สูงเท่าเดิมแล้วมีที่ว่างค้างอยู่ข้างบน */}
      <div
        className={cn(
          "min-w-0 flex-1",
          tone && "@2xl:mt-6",
          m.pending !== undefined && "pr-12 @2xl:pr-0"
        )}
      >
        <p className="font-semibold @2xl:truncate" title={m.label}>
          {m.label}
        </p>
        <p className="mt-0.5 truncate text-sm text-muted-foreground">
          {m.code}
        </p>
      </div>
    </>
  );

  // มือถือเป็นแถวแนวนอน (ไอคอนซ้าย ชื่อขวา) จอกว้างกลับเป็นการ์ดแนวตั้ง
  const base = cn(
    "group relative flex h-full items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-sm",
    "@2xl:flex-col @2xl:items-stretch @2xl:gap-0"
  );

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
