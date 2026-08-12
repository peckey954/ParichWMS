"use client";

import {
  BoxesIcon,
  ChartNoAxesColumnIcon,
  ClipboardCheckIcon,
  CircleCheckBigIcon,
  ClipboardListIcon,
  ClipboardPlusIcon,
  FileOutputIcon,
  FilePlusIcon,
  LayoutGridIcon,
  ListOrderedIcon,
  ListTodoIcon,
  MessageCircleWarningIcon,
  PackageCheckIcon,
  PackageIcon,
  PackageSearchIcon,
  PaletteIcon,
  ScaleIcon,
  ScanSearchIcon,
  SearchCheckIcon,
  SearchIcon,
  SettingsIcon,
  ShoppingCartIcon,
  SquareCheckBigIcon,
  WarehouseIcon,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@peckey954/ui/lib/utils";
import type { GroupTone } from "@/lib/modules";

const ICONS: Record<string, LucideIcon> = {
  squareCheck: SquareCheckBigIcon,
  cart: ShoppingCartIcon,
  circleCheck: CircleCheckBigIcon,
  scale: ScaleIcon,
  warehouse: WarehouseIcon,
  package: PackageIcon,
  boxes: BoxesIcon,
  clipboardPlus: ClipboardPlusIcon,
  clipboardList: ClipboardListIcon,
  clipboardCheck: ClipboardCheckIcon,
  chart: ChartNoAxesColumnIcon,
  listOrdered: ListOrderedIcon,
  filePlus: FilePlusIcon,
  packageSearch: PackageSearchIcon,
  listTodo: ListTodoIcon,
  scanSearch: ScanSearchIcon,
  searchCheck: SearchCheckIcon,
  packageCheck: PackageCheckIcon,
  search: SearchIcon,
  complaint: MessageCircleWarningIcon,
  fileOutput: FileOutputIcon,
  settings: SettingsIcon,
  palette: PaletteIcon,
  grid: LayoutGridIcon,
};

/** เส้นไอคอนบางกว่าค่าเริ่มต้นของ lucide (2) ให้ตรงกับไฟล์ Figma */
export const ICON_STROKE = 1.5;

export function ModuleIcon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const Icon = ICONS[name] ?? LayoutGridIcon;
  return <Icon className={className} strokeWidth={ICON_STROKE} />;
}

/** พื้นกล่องไอคอนของแต่ละหมวด — token ล้วน ดูค่าจริงได้ที่ app/globals.css */
export const TONE_BOX: Record<GroupTone, string> = {
  yellow: "bg-cat-yellow text-cat-yellow-foreground",
  blue: "bg-cat-blue text-cat-blue-foreground",
  orange: "bg-cat-orange text-cat-orange-foreground",
  purple: "bg-cat-purple text-cat-purple-foreground",
  sky: "bg-cat-sky text-cat-sky-foreground",
};

/** จุดกลมหน้าชื่อหมวด ใช้สีเข้มของหมวดนั้น */
export const TONE_DOT: Record<GroupTone, string> = {
  yellow: "bg-cat-yellow-foreground",
  blue: "bg-cat-blue-foreground",
  orange: "bg-cat-orange-foreground",
  purple: "bg-cat-purple-foreground",
  sky: "bg-cat-sky-foreground",
};

export function IconBox({
  name,
  tone,
  className,
}: {
  name: string;
  tone: GroupTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "flex size-12 shrink-0 items-center justify-center rounded-xl",
        TONE_BOX[tone],
        className
      )}
    >
      <ModuleIcon name={name} className="size-6" />
    </span>
  );
}
