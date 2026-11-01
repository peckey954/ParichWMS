import { HouseIcon } from "lucide-react";
import { BreadcrumbLink } from "@peckey954/ui/components/ui/breadcrumb";

/** ต้นทางของ breadcrumb ทุกหน้า — ไอคอนบ้าน + "หน้าหลัก" ตามแบบ Figma */
export function HomeCrumb() {
  return (
    <BreadcrumbLink href="/" className="inline-flex items-center gap-1.5">
      <HouseIcon className="size-4" aria-hidden />
      หน้าหลัก
    </BreadcrumbLink>
  );
}
