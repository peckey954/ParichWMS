"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { BellIcon, MenuIcon } from "lucide-react";
import { Avatar, AvatarFallback } from "@peckey954/ui/components/ui/avatar";
import { Button } from "@peckey954/ui/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@peckey954/ui/components/ui/sheet";
import { TooltipProvider } from "@peckey954/ui/components/ui/tooltip";
import { cn } from "@peckey954/ui/lib/utils";
import { LightTooltip } from "@/components/light-tooltip";
import { ThemeToggle } from "@/components/theme-toggle";
import { ModuleIcon } from "@/components/modules/module-icon";
import { PendingBadge } from "@/components/modules/pending-badge";
import {
  MODULE_GROUPS,
  SYSTEM_LINKS,
  modulesOf,
  type ModuleItem,
} from "@/lib/modules";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // ค่าเริ่มต้นคือหุบ — เปิดหน้าไหนก็เห็นเนื้อหาเต็มความกว้างไว้ก่อน
  const [expanded, setExpanded] = React.useState(false);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-border bg-background">
        <div className="flex h-14 items-center gap-3 px-4">
          {/* จอกว้าง — ปุ่มนี้สลับเมนูข้างระหว่างแถบไอคอนกับแบบเต็ม */}
          <Button
            variant="ghost"
            size="icon"
            aria-label={expanded ? "หุบเมนู" : "ขยายเมนู"}
            aria-expanded={expanded}
            onClick={() => setExpanded((v) => !v)}
            className="hidden lg:inline-flex"
          >
            <MenuIcon />
          </Button>

          {/* จอแคบ — ปุ่มเดียวกันเปิดเป็นลิ้นชักแทน */}
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="เปิดเมนู"
                className="lg:hidden"
              >
                <MenuIcon />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 gap-0 p-0">
              <SheetHeader className="border-b border-sidebar-border">
                <SheetTitle className="flex items-center gap-2">
                  <BrandMark />
                  Parich WMS
                </SheetTitle>
              </SheetHeader>
              <SidebarBody pathname={pathname} closeOnClick />
            </SheetContent>
          </Sheet>

          <Link href="/" className="flex items-center gap-2">
            <BrandMark />
            <span className="font-semibold">Parich WMS</span>
          </Link>

          <div className="ml-auto flex items-center gap-1">
            <ThemeToggle />
            <Button variant="ghost" size="icon" aria-label="การแจ้งเตือน">
              <BellIcon />
            </Button>
            <Avatar className="ml-1 size-8">
              <AvatarFallback className="text-xs">CN</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        <aside
          className={cn(
            "sticky top-14 hidden h-[calc(100vh-3.5rem)] shrink-0 flex-col",
            "border-r border-sidebar-border bg-sidebar lg:flex",
            "transition-[width] duration-200",
            expanded ? "w-72" : "w-16"
          )}
        >
          <SidebarBody pathname={pathname} collapsed={!expanded} />
        </aside>

        {/* พื้นที่เนื้อหาเป็นเทาอ่อน ให้การ์ดสีขาวลอยขึ้นมา ตามไฟล์ Figma */}
        <div className="min-w-0 flex-1 bg-surface">{children}</div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------
   ตัวเมนูจริง ใช้ร่วมกันสามที่ — ลิ้นชักจอแคบ เมนูข้างแบบเต็ม และแบบหุบ
   ต่างกันแค่ collapsed กับต้องปิดลิ้นชักหลังกดหรือไม่
------------------------------------------------------------------ */
function SidebarBody({
  pathname,
  collapsed = false,
  closeOnClick = false,
}: {
  pathname: string;
  collapsed?: boolean;
  closeOnClick?: boolean;
}) {
  const item = (m: {
    id: string;
    href?: string;
    icon: string;
    label: string;
    pending?: number;
  }) => {
    const node = (
      <NavItem
        href={m.href}
        icon={m.icon}
        label={m.label}
        pending={m.pending}
        collapsed={collapsed}
        active={pathname === m.href}
      />
    );
    // ปิดลิ้นชักได้เฉพาะอันที่กดไปไหนได้จริง
    return closeOnClick && m.href ? (
      <SheetClose asChild key={m.id}>
        {node}
      </SheetClose>
    ) : (
      <React.Fragment key={m.id}>{node}</React.Fragment>
    );
  };

  const body = (
    <>
      <div className="flex-1 overflow-y-auto px-2 py-3">
        <nav className={cn("flex flex-col", collapsed ? "gap-3" : "gap-4")}>
          <section className="flex flex-col gap-0.5">
            {!collapsed && <GroupLabel>หน้าหลัก</GroupLabel>}
            {item({ id: "home", href: "/", icon: "grid", label: "ระบบทั้งหมด" })}
          </section>

          {MODULE_GROUPS.map((g) => (
            <section key={g.id} className="flex flex-col gap-0.5">
              {!collapsed && <GroupLabel>{g.label}</GroupLabel>}
              {modulesOf(g.id).map((m: ModuleItem) => item(m))}
            </section>
          ))}
        </nav>
      </div>

      <div className="border-t border-sidebar-border px-2 py-3">
        <nav className="flex flex-col gap-0.5">
          {SYSTEM_LINKS.map((s) => item(s))}
        </nav>
      </div>
    </>
  );

  return (
    <TooltipProvider delayDuration={200}>
      {closeOnClick ? (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {body}
        </div>
      ) : (
        body
      )}
    </TooltipProvider>
  );
}

function GroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-3 pt-1 pb-1 text-xs font-medium text-muted-foreground">
      {children}
    </p>
  );
}

/**
 * ไม่มี href = ยังไม่ได้ทำหน้านั้น หน้าตาเหมือนอันอื่นทุกอย่าง แค่กดแล้วไม่ไปไหน
 * ไม่ทำให้จางลงตามที่ตกลงกันไว้
 */
const NavItem = React.forwardRef<
  HTMLElement,
  Omit<React.ComponentPropsWithoutRef<"a">, "href"> & {
    href?: string;
    icon: string;
    label: string;
    pending?: number;
    active?: boolean;
    collapsed?: boolean;
  }
>(function NavItem(
  { href, icon, label, pending, active, collapsed, className, ...props },
  ref
) {
  const base = cn(
    "flex items-center rounded-md text-sm transition-colors",
    collapsed ? "size-10 justify-center self-center" : "gap-3 px-3 py-2",
    active
      ? "bg-brand font-medium text-primary ring-1 ring-primary/20 ring-inset"
      : "text-sidebar-foreground"
  );

  const inner = (
    <>
      <ModuleIcon name={icon} className="size-5 shrink-0" />
      {!collapsed && (
        <>
          <span className="truncate">{label}</span>
          {pending !== undefined && (
            <PendingBadge count={pending} className="ml-1 shrink-0" />
          )}
        </>
      )}
    </>
  );

  // ตอนหุบไม่มีข้อความในปุ่มเลย ต้องใส่ชื่อกำกับไว้ให้โปรแกรมอ่านหน้าจอ
  const a11yLabel = collapsed ? label : undefined;

  const node = href ? (
    <Link
      ref={ref as React.Ref<HTMLAnchorElement>}
      href={href}
      aria-label={a11yLabel}
      aria-current={active ? "page" : undefined}
      className={cn(base, !active && "hover:bg-accent-hover", className)}
      {...props}
    >
      {inner}
    </Link>
  ) : (
    <span
      ref={ref as React.Ref<HTMLSpanElement>}
      aria-label={a11yLabel}
      aria-disabled
      className={cn(base, className)}
    >
      {inner}
    </span>
  );

  // ตอนหุบไม่มีชื่อกำกับ ต้องมี tooltip ไม่งั้นเดาไอคอนไม่ออก
  if (!collapsed) return node;
  return (
    <LightTooltip
      label={
        <>
          {label}
          {pending !== undefined && ` · รอ ${pending}`}
        </>
      }
    >
      {node}
    </LightTooltip>
  );
});

/**
 * โลโก้บนหัวเรื่อง ใช้เฉพาะส่วนต้นไม้ที่ตัดมาเป็นสี่เหลี่ยมจัตุรัส
 * โลโก้เต็มมีคำว่า PARICH อยู่ด้วย พอย่อเหลือ 32px ตัวหนังสือจะอ่านไม่ออก
 * และซ้ำกับข้อความ "Parich WMS" ที่อยู่ติดกันอยู่แล้ว
 * ตัวเต็มเก็บไว้ที่ public/parich-logo.png เผื่อใช้กับหน้าล็อกอินหรือเอกสารพิมพ์
 */
function BrandMark() {
  return (
    <Image
      src="/parich-mark.png"
      alt=""
      width={400}
      height={400}
      priority
      className="size-8 shrink-0 rounded-md"
    />
  );
}
