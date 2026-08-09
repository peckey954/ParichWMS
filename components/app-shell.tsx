"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BellIcon,
  BoxesIcon,
  ClipboardCheckIcon,
  FactoryIcon,
  FileChartColumnIcon,
  LayoutDashboardIcon,
  MenuIcon,
  PackageMinusIcon,
  PackagePlusIcon,
  ScaleIcon,
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
import { cn } from "@peckey954/ui/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";

const NAV = [
  { href: "/dashboard", label: "แดชบอร์ด", icon: LayoutDashboardIcon },
  { href: "/receiving", label: "รับสินค้าเข้า", icon: PackagePlusIcon },
  { href: "/weighing", label: "ใบชั่งน้ำหนัก", icon: ScaleIcon },
  { href: "/", label: "ผลิตแบ่งบรรจุ", icon: FactoryIcon },
  { href: "/issuing", label: "จ่ายสินค้าออก", icon: PackageMinusIcon },
  { href: "/stock", label: "สต็อกคงเหลือ", icon: BoxesIcon },
  { href: "/qc/setup", label: "ตั้งค่าเทมเพลต QC", icon: ClipboardCheckIcon },
  { href: "/reports", label: "รายงาน", icon: FileChartColumnIcon },
  { href: "/design-system", label: "Design system", icon: WarehouseIcon },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-border bg-background">
        <div className="flex h-14 items-center gap-3 px-4">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="เปิดเมนู">
                <MenuIcon />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <BrandMark />
                  Parich WMS
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1 px-4 pb-4">
                {NAV.map((item) => {
                  const active = pathname === item.href;
                  return (
                    <SheetClose asChild key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                          active
                            ? "bg-primary text-primary-foreground"
                            : "text-foreground hover:bg-accent-hover"
                        )}
                      >
                        <item.icon className="size-4" />
                        {item.label}
                      </Link>
                    </SheetClose>
                  );
                })}
              </nav>
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

      <div className="flex-1">{children}</div>
    </div>
  );
}

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
