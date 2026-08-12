import Link from "next/link";
import { ChevronRightIcon } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@peckey954/ui/components/ui/breadcrumb";
import { ModuleIcon } from "@/components/modules/module-icon";
import { SETTINGS_ITEMS } from "@/lib/modules";

export default function SettingsPage() {
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">ระบบ</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="text-primary">ตั้งค่าระบบ</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <h1 className="mt-2 text-2xl font-semibold">ตั้งค่าระบบ</h1>
      <p className="mt-1 text-muted-foreground">
        ตั้งค่าที่ทำครั้งเดียวแล้วใช้ยาว ไม่ใช่งานประจำวัน
      </p>

      <div className="mt-6 flex flex-col gap-3">
        {SETTINGS_ITEMS.map((s) => (
          <Link
            key={s.id}
            href={s.href}
            className="group flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-sm transition-[color,box-shadow,border-color] hover:border-primary hover:shadow-md focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <ModuleIcon name={s.icon} className="size-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-medium">{s.label}</span>
              <span className="mt-0.5 block text-sm text-muted-foreground">
                {s.description}
              </span>
            </span>
            <ChevronRightIcon
              className="size-5 shrink-0 text-muted-foreground transition-transform motion-safe:group-hover:translate-x-0.5"
              strokeWidth={1.5}
            />
          </Link>
        ))}
      </div>
    </main>
  );
}
