"use client";

import {
  BoxesIcon,
  ChartNoAxesColumnIcon,
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
} from "lucide-react";
import { cn } from "@peckey954/ui/lib/utils";
import type { GroupTone } from "@/lib/modules";

const ICONS: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  squareCheck: SquareCheckBigIcon,
  cart: ShoppingCartIcon,
  circleCheck: CircleCheckBigIcon,
  scale: ScaleIcon,
  warehouse: WarehouseIcon,
  package: PackageIcon,
  boxes: BoxesIcon,
  clipboardPlus: ClipboardPlusIcon,
  clipboardList: ClipboardListIcon,
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

export function ModuleIcon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const Icon = ICONS[name] ?? LayoutGridIcon;
  return <Icon className={className} />;
}

/**
 * สีพื้นกล่องไอคอนแยกตามหมวด
 * amber/orange ใช้ token ของ DS ที่มีอยู่ ส่วน blue/violet ใช้ token เสริมที่เพิ่มไว้ใน globals.css
 */
export const TONE_BOX: Record<GroupTone, string> = {
  amber: "bg-warning text-warning-foreground",
  blue: "bg-tone-blue text-tone-blue-foreground",
  orange: "bg-brand text-primary",
  violet: "bg-tone-violet text-tone-violet-foreground",
};

/** จุดกลมหน้าชื่อหมวด ใช้สีเดียวกับกล่องไอคอนแต่เป็นตัวอักษร */
export const TONE_DOT: Record<GroupTone, string> = {
  amber: "bg-warning-solid",
  blue: "bg-tone-blue-foreground",
  orange: "bg-primary",
  violet: "bg-tone-violet-foreground",
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
        "flex size-10 shrink-0 items-center justify-center rounded-lg",
        TONE_BOX[tone],
        className
      )}
    >
      <ModuleIcon name={name} className="size-5" />
    </span>
  );
}
