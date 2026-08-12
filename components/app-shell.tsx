"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BellIcon,
  MenuIcon,
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
  WarehouseIcon,
} from "lucide-react";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@peckey954/ui/components/ui/tooltip";
import { cn } from "@peckey954/ui/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { ModuleIcon, TONE_DOT } from "@/components/modules/module-icon";
import {
  MODULE_GROUPS,
  SYSTEM_LINKS,
  modulesOf,
  readyModules,
} from "@/lib/modules";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [expanded, setExpanded] = React.useState(true);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-border bg-background">
        <div className="flex h-14 items-center gap-3 px-4">
          {/* จอแคบ — เมนูเป็นลิ้นชัก จอกว้างใช้เมนูข้างถาวรแทน */}
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
            <SheetContent side="left" className="w-80 overflow-y-auto p-0">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <BrandMark />
                  Parich WMS
                </SheetTitle>
              </SheetHeader>
              <SidebarNav pathname={pathname} closeOnClick />
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
            "sticky top-14 hidden h-[calc(100vh-3.5rem)] shrink-0 overflow-y-auto",
            "border-r border-border bg-sidebar lg:block",
            "transition-[width] duration-200",
            expanded ? "w-72" : "w-16"
          )}
        >
          <div
            className={cn(
              "flex items-center px-3 py-2",
              expanded ? "justify-end" : "justify-center"
            )}
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setExpanded((v) => !v)}
              aria-label={expanded ? "ย่อเมนู" : "ขยายเมนู"}
            >
              {expanded ? <PanelLeftCloseIcon /> : <PanelLeftOpenIcon />}
            </Button>
          </div>

          {expanded ? (
            <SidebarNav pathname={pathname} />
          ) : (
            <IconRail pathname={pathname} />
          )}
        </aside>

        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------
   เมนูเต็ม — จัดกลุ่มตามทะเบียนโมดูล ใช้ทั้งในลิ้นชัก (จอแคบ)
   และเมนูข้างแบบขยาย (จอกว้าง)
------------------------------------------------------------------ */
function SidebarNav({
  pathname,
  closeOnClick = false,
}: {
  pathname: string;
  closeOnClick?: boolean;
}) {
  /** ในลิ้นชักต้องปิดเมนูหลังกด ในเมนูข้างถาวรไม่ต้อง */
  const link = (
    key: string,
    href: string,
    icon: string,
    label: string
  ) => {
    const node = (
      <NavLink
        href={href}
        icon={icon}
        label={label}
        active={pathname === href}
      />
    );
    return closeOnClick ? (
      <SheetClose asChild key={key}>
        {node}
      </SheetClose>
    ) : (
      <React.Fragment key={key}>{node}</React.Fragment>
    );
  };

  return (
    <nav className="flex flex-col gap-5 px-3 pt-1 pb-6">
      <section className="space-y-1">
        <GroupLabel>หน้าหลัก</GroupLabel>
        {link("home", "/", "grid", "ระบบทั้งหมด")}
      </section>

      {MODULE_GROUPS.map((g) => (
        <section key={g.id} className="space-y-1">
          <GroupLabel dot={TONE_DOT[g.tone]}>{g.label}</GroupLabel>
          {modulesOf(g.id).map((m) =>
            m.href ? (
              link(m.id, m.href, m.icon, m.label)
            ) : (
              <NavLink key={m.id} icon={m.icon} label={m.label} />
            )
          )}
        </section>
      ))}

      <section className="space-y-1">
        <GroupLabel>ตั้งค่าระบบ</GroupLabel>
        {SYSTEM_LINKS.map((s) => link(s.id, s.href, s.icon, s.label))}
      </section>
    </nav>
  );
}

/**
 * แถบไอคอน — เอาเฉพาะหน้าที่เปิดใช้งานได้จริง
 * ถ้ายัดทุกโมดูลลงมาโดยไม่มีชื่อกำกับ จะกลายเป็นไอคอนยี่สิบตัวที่เดาไม่ออกว่าอะไร
 */
function IconRail({ pathname }: { pathname: string }) {
  const links = [
    { id: "home", href: "/", icon: "grid", label: "ระบบทั้งหมด" },
    ...readyModules().map((m) => ({
      id: m.id,
      href: m.href!,
      icon: m.icon,
      label: m.label,
    })),
    ...SYSTEM_LINKS,
  ];

  return (
    <TooltipProvider delayDuration={200}>
      <nav className="flex flex-col items-center gap-1 pb-6">
        {links.map((l) => {
          const active = pathname === l.href;
          return (
            <Tooltip key={l.id}>
              <TooltipTrigger asChild>
                <Link
                  href={l.href}
                  aria-label={l.label}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex size-10 items-center justify-center rounded-md transition-colors",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground hover:bg-accent-hover"
                  )}
                >
                  <ModuleIcon name={l.icon} className="size-5" />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">{l.label}</TooltipContent>
            </Tooltip>
          );
        })}
      </nav>
    </TooltipProvider>
  );
}

function GroupLabel({
  children,
  dot,
}: {
  children: React.ReactNode;
  dot?: string;
}) {
  return (
    <p className="flex items-center gap-2 px-3 pt-1 pb-0.5 text-xs font-medium text-muted-foreground">
      {dot && <span className={cn("size-2 rounded-full", dot)} aria-hidden />}
      {children}
    </p>
  );
}

/** ไม่ส่ง href = ยังไม่ได้ทำหน้านั้น แสดงเป็นข้อความจาง ๆ กดไม่ได้ */
const NavLink = React.forwardRef<
  HTMLAnchorElement,
  Omit<React.ComponentPropsWithoutRef<"a">, "href"> & {
    href?: string;
    icon: string;
    label: string;
    active?: boolean;
  }
>(function NavLink({ href, icon, label, active, className, ...props }, ref) {
  const base =
    "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors";

  if (!href) {
    return (
      <span
        className={cn(base, "text-muted-foreground opacity-60")}
        title="ยังไม่ได้ทำหน้านี้"
      >
        <ModuleIcon name={icon} className="size-4 shrink-0" />
        <span className="truncate">{label}</span>
      </span>
    );
  }

  return (
    <Link
      ref={ref}
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        base,
        active
          ? "bg-primary text-primary-foreground"
          : "text-foreground hover:bg-accent-hover",
        className
      )}
      {...props}
    >
      <ModuleIcon name={icon} className="size-4 shrink-0" />
      <span className="truncate">{label}</span>
    </Link>
  );
});

function BrandMark() {
  return (
    <span
      aria-hidden
      className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground"
    >
      <WarehouseIcon className="size-4" />
    </span>
  );
}
