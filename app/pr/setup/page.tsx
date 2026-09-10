"use client";

import Link from "next/link";
import {
  ChevronRightIcon,
  ClipboardPlusIcon,
  HistoryIcon,
  LayersIcon,
  PackageIcon,
  TableIcon,
  WarehouseIcon,
} from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@peckey954/ui/components/ui/breadcrumb";
import { usePrSetup } from "@/components/pr/pr-setup-provider";
import { categoriesWithoutWarehouse } from "@/lib/pr-setup";

/* ------------------------------------------------------------------
   ตั้งค่าใบขอซื้อ — หน้ารวมทาง

   สี่ส่วนแยกกันคนละหน้า เรียงตามทิศทางที่ของอ้างถึงกัน:
   คลัง ← ประเภท ← สินค้า → หมวด  ต้องมีคลังก่อนถึงกำหนดปลายทางของประเภทได้
   และมีประเภทก่อนถึงจัดสินค้าเข้าประเภทได้ อ่านจากบนลงล่างจึงเป็นลำดับที่ทำจริง

   หมวดแขวนอยู่ข้างสินค้าอย่างเดียว ไม่เกี่ยวกับคลัง จึงวางไว้ก่อนสินค้า
   (ตั้งให้ครบก่อนเข้าไปจัด) แต่ไม่ได้อยู่ในสายที่กำหนดเส้นทางเข้าคลัง

   แยกหน้าเพราะสินค้าโตได้ไม่จำกัด (อัปโหลด CSV ทีเดียวเป็นร้อยรายการ)
   ถ้ารวมหน้าเดียวส่วนที่นิ่งอย่างคลังจะจมอยู่ท้ายรายการยาว ๆ
   ไม่เสียอะไรเพราะ PrSetupProvider อยู่ระดับ AppShell — เดินไปมาระหว่างสี่หน้า
   ของที่แก้ค้างไว้ไม่หาย และแต่ละส่วนบันทึกแยกกันได้ (ดูคอมเมนต์ SetupSlice)

   การ์ดต้องบอกสถานะสด ไม่ใช่เมนูตาย — เห็นตั้งแต่หน้านี้ว่าส่วนไหนมีปัญหาค้างอยู่
------------------------------------------------------------------ */

export default function PrSetupHubPage() {
  const { setup, products, dirty, changes } = usePrSetup();

  const orphanCategories = categoriesWithoutWarehouse(setup).length;
  const uncategorized = products.filter((p) => p.categoryId === "").length;
  const ungrouped = products.filter((p) => p.groupId === "").length;

  const cards = [
    {
      href: "/pr/setup/warehouses",
      icon: WarehouseIcon,
      label: "คลัง",
      description: "ที่เก็บของที่ขอซื้อเข้ามา",
      count: `${setup.warehouses.length} คลัง`,
      warn: null as string | null,
      dirty: dirty.warehouses,
    },
    {
      href: "/pr/setup/categories",
      icon: ClipboardPlusIcon,
      label: "ประเภทสินค้า",
      description: "ประเภทที่เลือกได้ตอนสร้างใบขอซื้อ และคลังปลายทางของแต่ละประเภท",
      count: `${setup.categories.length} ประเภท`,
      warn:
        orphanCategories > 0
          ? `${orphanCategories} ประเภทยังไม่ได้เลือกคลัง`
          : null,
      dirty: dirty.categories,
    },
    {
      href: "/pr/setup/groups",
      icon: LayersIcon,
      label: "หมวดสินค้า",
      description: "สายผลิตภัณฑ์ที่ใช้จัดกลุ่มสินค้า — ไม่เกี่ยวกับคลังปลายทาง",
      count: `${setup.groups.length} หมวด · จัดแล้ว ${products.length - ungrouped} รายการ`,
      // หมวดไม่บังคับ ของที่ยังไม่ระบุหมวดจึงไม่ใช่ปัญหา ไม่ต้องเตือนแดง
      warn: null,
      dirty: dirty.groups,
    },
    {
      href: "/pr/setup/products",
      icon: PackageIcon,
      label: "สินค้า",
      description: "รายการสินค้าที่ขอซื้อได้ เพิ่มทีละรายการหรืออัปโหลดทั้งไฟล์",
      count: `${products.length} รายการ`,
      warn:
        uncategorized > 0 ? `${uncategorized} รายการยังไม่ระบุประเภท` : null,
      dirty: dirty.products,
    },
    {
      href: "/pr/setup/changes",
      icon: HistoryIcon,
      label: "ประวัติการเปลี่ยนแปลง",
      description: "ใครเปลี่ยนอะไรตอนไหน โดยเฉพาะเส้นทางเข้าคลัง",
      count:
        changes.length === 0
          ? "ยังไม่มีการเปลี่ยนแปลงในเซสชันนี้"
          : `${changes.length} รายการ`,
      warn: null,
      // อ่านอย่างเดียว ไม่มีอะไรให้บันทึก
      dirty: false,
    },
  ];

  return (
    <main className="mx-auto w-full max-w-4xl px-4 pt-3 pb-10 sm:px-6 sm:pt-5">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">ระบบ</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/pr">ขอซื้อ PR</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="text-primary">ตั้งค่าใบขอซื้อ</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mt-2 sm:mt-3">
        <h1 className="text-2xl font-semibold tracking-tight">ตั้งค่าใบขอซื้อ</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          ตั้งจากบนลงล่าง — มีคลังก่อน แล้วกำหนดว่าประเภทไหนเข้าคลังไหน
          ตั้งหมวดไว้จัดกลุ่ม สุดท้ายจัดสินค้าเข้าประเภทและหมวด แต่ละส่วนบันทึกแยกกัน
        </p>
      </div>

      {/* ทางเลือกที่สองไว้เทียบกัน — ยึดจากสินค้าเป็นหลัก แทนที่จะไล่ตั้งทีละชั้น
          ตั้งใจวางไว้ก่อนการ์ด จะได้เห็นว่ามีสองแบบให้ลองตั้งแต่แรก */}
      <Link
        href="/pr/setup/all"
        className="mt-5 flex items-center gap-3 rounded-xl border border-dashed border-primary/50 bg-brand px-4 py-3 text-sm transition-colors hover:border-primary"
      >
        <TableIcon className="size-4 shrink-0 text-primary" />
        <span className="min-w-0 flex-1">
          <span className="font-medium">ลองแบบหน้าเดียว</span>
          <span className="mt-0.5 block text-muted-foreground">
            ตารางสินค้าเดียวเห็นครบทั้งหมวด ประเภท คลัง — แก้โครงจากปุ่มมุมขวาบน
          </span>
        </span>
        <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" />
      </Link>

      <div className="mt-4 flex flex-col gap-3">
        {cards.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="group flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-sm transition-[color,box-shadow,border-color] hover:border-primary hover:shadow-md focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <c.icon className="size-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{c.label}</span>
                {/* ไม่มี backend จริง ป้ายนี้บอกแค่ว่ายังไม่ได้กดบันทึกในส่วนนั้น */}
                {c.dirty && (
                  <span className="rounded-full bg-[var(--chip-orange)] px-2 py-0.5 text-xs text-chip-orange-foreground">
                    ยังไม่ได้บันทึก
                  </span>
                )}
              </span>
              <span className="mt-0.5 block text-sm text-muted-foreground">
                {c.description}
              </span>
              <span className="mt-1 block text-sm">
                <span className="text-muted-foreground">{c.count}</span>
                {c.warn && (
                  <>
                    <span className="text-muted-foreground"> · </span>
                    <span className="text-danger-strong">{c.warn}</span>
                  </>
                )}
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
