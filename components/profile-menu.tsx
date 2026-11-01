"use client";

import * as React from "react";
import { ChevronDownIcon, LogOutIcon, RepeatIcon, UserIcon } from "lucide-react";
import { Avatar, AvatarFallback } from "@peckey954/ui/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@peckey954/ui/components/ui/dropdown-menu";
import { cn } from "@peckey954/ui/lib/utils";
import { toast } from "sonner";
import { ROLE_LABEL, SWITCHABLE_ROLES, useRole, type Role } from "@/components/role-provider";

/* ------------------------------------------------------------------
   เมนูโปรไฟล์มุมขวาบน — ตามแบบ: ชื่อ + เบอร์ แล้วเมนูสลับระบบ / ออกจากระบบ
   จอแคบเหลือแค่รูปโปรไฟล์

   ส่วน "ดูในบทบาท" เป็นของเดโม ใช้สลับ User/Admin ดูว่าหน้าไหนเปลี่ยนไปบ้าง
   (ระบบจริงบทบาทมาจากบัญชีที่ login ไม่ได้ให้เลือกเอง)
------------------------------------------------------------------ */

const USER = { name: "Pattawat Lastname", phone: "096-xxx-xxxx" };

const notYet = (what: string) => toast.info(`${what} ยังไม่เปิดใช้ในเดโมนี้`);

export function ProfileMenu() {
  const { role, setRole } = useRole();
  const [open, setOpen] = React.useState(false);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        aria-label="เมนูโปรไฟล์"
        className="ml-1 flex items-center gap-2.5 rounded-md p-1 outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Avatar className="size-8">
          <AvatarFallback>
            <UserIcon className="size-4 fill-current text-muted-foreground" />
          </AvatarFallback>
        </Avatar>
        <span className="hidden text-left leading-tight md:block">
          <span className="flex items-center gap-1.5 text-sm font-semibold">
            {USER.name}
            {role !== "user" && (
              <span className="rounded-full bg-brand px-1.5 py-px text-[10px] font-semibold text-primary">
                {ROLE_LABEL[role]}
              </span>
            )}
          </span>
          <span className="block text-xs text-muted-foreground">{USER.phone}</span>
        </span>
        <ChevronDownIcon
          className={cn(
            "hidden size-4 text-muted-foreground transition-transform md:block",
            open && "rotate-180"
          )}
        />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64">
        {/* จอแคบไม่มีชื่อบนแถบหัว เลยใส่ไว้หัวเมนูแทน */}
        <DropdownMenuLabel className="md:hidden">
          <span className="block font-semibold">{USER.name}</span>
          <span className="block text-xs font-normal text-muted-foreground">{USER.phone}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="md:hidden" />

        <DropdownMenuItem onSelect={() => notYet("โปรไฟล์")}>
          <UserIcon className="fill-current" />
          โปรไฟล์ของฉัน
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => notYet("Parich Client")}>
          <RepeatIcon />
          ไปยัง Parich Client
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => notYet("ERP")}>
          <RepeatIcon />
          ไปยัง ERP
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => toast.info("คุณอยู่ใน WMS แล้ว")}>
          <RepeatIcon />
          ไปยัง WMS
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          ดูในบทบาท (เดโม)
        </DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={role}
          onValueChange={(v) => {
            setRole(v as Role);
            toast.success(`สลับเป็น ${ROLE_LABEL[v as Role]}`);
          }}
        >
          {SWITCHABLE_ROLES.map((r) => (
            <DropdownMenuRadioItem key={r} value={r} onSelect={(e) => e.preventDefault()}>
              {ROLE_LABEL[r]}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>

        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => notYet("ออกจากระบบ")}>
          <LogOutIcon />
          ออกจากระบบ
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
