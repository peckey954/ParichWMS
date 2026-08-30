"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { CheckIcon, MenuIcon, XIcon } from "lucide-react";
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
import { toast } from "sonner";
import {
  DeviceFrame,
  DevicePreviewProvider,
  DevicePreviewToggle,
} from "@/components/device-preview";
import { LightTooltip } from "@/components/light-tooltip";
import { NotificationBell } from "@/components/notification-bell";
import { NotificationsProvider, useNotifications } from "@/components/notifications-provider";
import { RecipeRunProvider } from "@/components/production/recipe-run";
import { ThemeToggle } from "@/components/theme-toggle";
import { ModuleIcon } from "@/components/modules/module-icon";
import { PendingBadge } from "@/components/modules/pending-badge";
import {
  MODULE_GROUPS,
  SYSTEM_LINK,
  modulesOf,
  type ModuleItem,
} from "@/lib/modules";
import type { AppNotification } from "@/lib/notifications";

/** ไอคอนของ toast แจ้งเตือน — ไม่มีกล่องพื้นสีเหมือนในลิสต์ (ที่นี่แค่สัญลักษณ์
    เล็กๆ ต้นหัวข้อ) ปล่อยให้สืบสีส้มจาก toast เอง (currentColor) แทน ปกติเป็น
    ไอคอนเมนูที่เกี่ยวข้อง ยกเว้นเป็นผลลัพธ์ชัดเจน (อนุมัติ/ไม่อนุมัติ) ถึงใช้
    เครื่องหมายถูก/กากบาทแทน */
function ToastNotificationIcon({ n }: { n: AppNotification }) {
  if (n.outcome === "fail") return <XIcon className="size-4" />;
  if (n.outcome === "success") return <CheckIcon className="size-4" />;
  return <ModuleIcon name={n.moduleIcon} className="size-4" />;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <DevicePreviewProvider>
      {/* สถานะการคำนวณสูตรอยู่ที่นี่ เพราะต้องข้ามหน้าได้
          หน้าตั้งค่าแก้ข้อมูล แล้วหน้าผลลัพธ์ต้องรู้ว่าผลที่แสดงอยู่เก่าไปแล้ว */}
      <RecipeRunProvider>
        {/* เหมือนกัน — สถานะอ่านแล้ว/ยังไม่อ่านต้องข้ามหน้าได้ (กระดิ่งกับ
            หน้า /notifications ต้องเห็นค่าเดียวกัน) */}
        <NotificationsProvider>
          <Shell>{children}</Shell>
        </NotificationsProvider>
      </RecipeRunProvider>
    </DevicePreviewProvider>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  // ค่าเริ่มต้นคือหุบ — เปิดหน้าไหนก็เห็นเนื้อหาเต็มความกว้างไว้ก่อน
  const [expanded, setExpanded] = React.useState(false);
  const { notifications, unreadCount, isRead, markRead, setBellOpen } = useNotifications();

  // แจ้งจำนวนแจ้งเตือนที่ยังไม่อ่านทันทีที่เข้าเว็บ (โหลดหน้าใหม่ทั้งหน้า) —
  // effect นี้อยู่ใน Shell ซึ่งอยู่นอก {children} จึงไม่ remount ตอนเปลี่ยน
  // หน้าแบบ client-side, [] ว่างเปล่าเลยขึ้นแค่ครั้งเดียวต่อการโหลดจริงหนึ่งครั้ง
  // ไม่ใช่ทุกครั้งที่กดลิงก์เปลี่ยนหน้าในแอป
  //
  // มีแจ้งเตือนเดียว — โชว์ชื่อ/รายละเอียดของอันนั้นตรงๆ กดปุ่มแล้วพาไปหน้า
  // เอกสารนั้นทันที ไม่ต้องผ่านรายการก่อน
  // มีมากกว่าหนึ่ง — โชว์แค่จำนวนรวม กดปุ่มแล้ว:
  //   จอกว้าง — เปิด popover กระดิ่งตัวเดิม (เหมือนกดกระดิ่งเอง ไม่ใช่สร้าง
  //   หน้าต่างแยกใหม่ — ของเดิมที่มีอยู่แล้วถูกที่สุด แค่เปิดจากปุ่มนี้ได้ด้วย)
  //   จอแคบ — ไปหน้า /notifications เต็มหน้าตรงๆ (มือถือไม่มีที่พอให้ popover
  //   ลอยแบบจอกว้าง เต็มหน้าอ่านง่ายกว่า)
  React.useEffect(() => {
    if (unreadCount === 0) return;
    // หน่วงเล็กน้อยก่อนยิง toast — <Toaster> (คนละ component, อยู่ถัดจาก
    // AppShell ใน layout.tsx) ยัง mount ไม่เสร็จตอน effect นี้ทำงาน ถ้าเรียก
    // toast() ทันทีจะยิงไปก่อนที่ตัว Toaster จะ subscribe รับค่า ข้อความเลย
    // หายเงียบ ๆ ไม่ขึ้นอะไรเลย (เจอบั๊กนี้จริงตอนพัฒนา) หน่วง 1 tick ก็พอ
    // แต่ใส่ไว้สัก 400ms เผื่อจังหวะ เพราะรู้สึกเป็นธรรมชาติกว่าโผล่ทันทีที่วาดจอ
    const timer = setTimeout(() => {
      const unread = notifications.filter((n) => !isRead(n.id));
      // หัวข้อตัวหนาแค่นั้นพอ (ไม่ขยาย font-size — ลองแล้วดูใหญ่เกินไป)
      // คำอธิบายบังคับสีส้มด้วย classNames ตรงนี้ (ไม่พึ่งกฎ CSS ใน globals.css
      // อย่างเดียว) เพราะเชื่อถือได้กว่า — เจอปัญหาสีไม่ติดมาแล้วรอบหนึ่ง
      // ปุ่ม action ของ toast นี้ปรับเป็น outline ส้ม (พื้นขาวชัดเจน ไม่ใช่ใส/
      // โปร่งแสงจนเห็นพื้นหลังกล่อง toast ทะลุ — ขอบ+ตัวอักษรส้ม) แทนปุ่มพื้นทึบ
      // เริ่มต้นของ sonner ให้เข้าธีมปุ่มรองของทั้งแอป — ต้องใส่ ! เพราะกฎ
      // [data-button]/[data-description] ของ sonner specificity สูงกว่า
      const classNames = {
        title: "font-semibold",
        description: "text-primary!",
        actionButton: "bg-white! text-primary! border! border-primary!",
      };

      if (unread.length === 1) {
        const n = unread[0];
        // .success ไม่ใช่เพราะมีอะไร "สำเร็จ" แต่เพื่อให้ได้สีส้มแบรนด์เดียวกับ
        // toast สำเร็จอื่น ๆ ทั้งแอป (ตั้งไว้ผ่าน --success-* ใน app/layout.tsx)
        toast.success(n.title, {
          description: n.description,
          icon: <ToastNotificationIcon n={n} />,
          classNames,
          action: {
            label: "ไปดู",
            onClick: () => {
              markRead(n.id);
              router.push(n.href);
            },
          },
        });
      } else {
        toast.success(`มีการแจ้งเตือนใหม่ ${unread.length} รายการ`, {
          description: "กดเพื่อดูรายการแจ้งเตือนทั้งหมด",
          classNames,
          action: {
            label: "ดูการแจ้งเตือน",
            onClick: () => {
              const isDesktop = window.matchMedia("(min-width: 640px)").matches;
              if (isDesktop) setBellOpen(true);
              else router.push("/notifications");
            },
          },
        });
      }
    }, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
            {/* [&>button]:hidden ปิดปุ่มปิดที่ DS ใส่มาให้เอง
                ของเดิมโดน Radix โฟกัสอัตโนมัติตอนเปิด เลยขึ้นวงแหวนสีส้มรอบกากบาท
                ทำเป็นปุ่มของเราแทน จะได้เป็นกากบาทเปล่า ๆ ไม่มีพื้นหลัง */}
            <SheetContent
              side="left"
              className="w-80 gap-0 p-0 [&>button]:hidden"
            >
              <SheetHeader className="flex-row items-center justify-between border-b border-sidebar-border">
                <SheetTitle className="flex items-center gap-2">
                  <BrandMark />
                  Parich WMS
                </SheetTitle>
                <SheetClose
                  aria-label="ปิดเมนู"
                  className="rounded-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  <XIcon className="size-5" strokeWidth={1.5} />
                </SheetClose>
              </SheetHeader>
              <SidebarBody pathname={pathname} closeOnClick />
            </SheetContent>
          </Sheet>

          <Link href="/" className="flex items-center gap-2">
            <BrandMark />
            <span className="font-semibold">Parich WMS</span>
          </Link>

          <div className="ml-auto flex items-center gap-1">
            {/* เครื่องมือรีวิวดีไซน์ ซ่อนบนจอแคบเพราะจอแคบก็คือมือถืออยู่แล้ว */}
            <DevicePreviewToggle className="mr-1 hidden md:flex" />
            <ThemeToggle />
            <NotificationBell />
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
        <div className="min-w-0 flex-1 bg-surface">
          <DeviceFrame>{children}</DeviceFrame>
        </div>
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
        <nav className="flex flex-col gap-0.5">{item(SYSTEM_LINK)}</nav>
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
 * โลโก้เต็มใบ ไม่ตัดส่วนไหนออก
 * รูปเป็นแนวตั้ง (592x652) จึงล็อกความสูงแล้วปล่อยความกว้างตามสัดส่วน
 * ถ้าบังคับเป็นจัตุรัสรูปจะถูกบีบหรือโดนครอบตัด
 */
function BrandMark() {
  return (
    <Image
      src="/parich-logo.png"
      alt=""
      width={592}
      height={652}
      priority
      className="h-9 w-auto shrink-0 rounded-md"
    />
  );
}
