"use client";

import * as React from "react";
import Link from "next/link";
import { SearchIcon } from "lucide-react";
import { Badge } from "@peckey954/ui/components/ui/badge";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@peckey954/ui/components/ui/input-group";
import { cn } from "@peckey954/ui/lib/utils";
import { IconBox, TONE_DOT } from "@/components/modules/module-icon";
import {
  MODULE_GROUPS,
  MODULES,
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
      <div className="max-w-2xl">
        <InputGroup>
          <InputGroupAddon align="inline-start">
            <SearchIcon />
          </InputGroupAddon>
          <InputGroupInput
            placeholder="ค้นหาระบบ..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </InputGroup>
      </div>

      <div className="mt-6 space-y-8">
        {groups.map((g) => (
          <section key={g.id}>
            <div className="flex items-center gap-2">
              <span
                className={cn("size-3 shrink-0 rounded-full", TONE_DOT[g.tone])}
                aria-hidden
              />
              <h2 className="font-semibold">{g.label}</h2>
              <span className="text-sm text-muted-foreground">
                {g.items.length} ระบบ
              </span>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
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

      <p className="mt-10 text-sm text-muted-foreground">
        เปิดใช้งานแล้ว {MODULES.filter((m) => m.href).length} จาก{" "}
        {MODULES.length} ระบบ · ที่เหลือยังไม่ได้ทำหน้าจอ กดไม่ได้
      </p>
    </main>
  );
}

function ModuleCard({
  module: m,
  tone,
}: {
  module: ModuleItem;
  tone: Parameters<typeof IconBox>[0]["tone"];
}) {
  const body = (
    <>
      {m.pending !== undefined && (
        <Badge
          tone="warning"
          appearance="soft"
          className="absolute top-2 right-2"
        >
          รอ {m.pending}
        </Badge>
      )}
      <IconBox name={m.icon} tone={tone} />
      <div className="mt-3">
        <p className="font-medium">{m.label}</p>
        <p className="mt-0.5 text-sm text-muted-foreground">{m.code}</p>
      </div>
    </>
  );

  const base =
    "relative flex h-full flex-col rounded-xl border border-border bg-card p-4 transition-colors";

  // ยังไม่ได้ทำหน้านั้น — ทำให้กดไม่ได้และบอกไว้ตรง ๆ ดีกว่าปล่อยให้กดแล้วเจอ 404
  if (!m.href) {
    return (
      <div
        className={cn(base, "opacity-55")}
        aria-disabled
        title="ยังไม่ได้ทำหน้านี้"
      >
        {body}
      </div>
    );
  }

  return (
    <Link
      href={m.href}
      className={cn(
        base,
        "hover:border-primary hover:bg-accent-hover",
        "focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
      )}
    >
      {body}
    </Link>
  );
}
