"use client";

import * as React from "react";
import Link from "next/link";
import { ListFilterIcon, SearchIcon, Settings2Icon } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@peckey954/ui/components/ui/breadcrumb";
import { Button } from "@peckey954/ui/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@peckey954/ui/components/ui/input-group";
import { RecipeTable } from "@/components/production/recipe-table";
import { RECIPES, RECIPE_UPDATED_AT, matchesRecipe } from "@/lib/recipe";

export default function WeeklyRecipePage() {
  const [query, setQuery] = React.useState("");
  const visible = RECIPES.filter((r) => matchesRecipe(r, query));

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-3 sm:px-6 sm:py-5">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">ระบบ</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="text-primary">
              สูตรผลิตประจำสัปดาห์
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mt-2 flex flex-wrap items-start justify-between gap-3 sm:mt-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">
            สูตรการผลิตประจำสัปดาห์
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            แนะนำสูตรการผลิต อัปเดตล่าสุด {RECIPE_UPDATED_AT}
          </p>
        </div>

        {/* ตัวเลขในตารางเป็นผลลัพธ์ที่คำนวณมาแล้ว แก้ที่นี่ไม่ได้
            ต้องเข้าไปแก้ต้นทางในหน้าตั้งค่าแล้วสั่งคำนวณใหม่ */}
        <Button asChild variant="outline-primary">
          <Link href="/production/recipe/setup">
            <Settings2Icon />
            ตั้งค่าสูตร
          </Link>
        </Button>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <InputGroup className="min-w-0 flex-1 bg-card">
          <InputGroupAddon align="inline-start">
            <SearchIcon />
          </InputGroupAddon>
          <InputGroupInput
            placeholder="ค้นหา..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </InputGroup>
        <Button
          variant="outline-primary"
          size="icon"
          aria-label="ตัวกรองสูตรการผลิต"
          className="shrink-0"
        >
          <ListFilterIcon />
        </Button>
      </div>

      <div className="mt-4">
        <RecipeTable rows={visible} />
      </div>

      <div className="mt-6">
        <Button asChild variant="outline-primary">
          <Link href="/">ย้อนกลับ</Link>
        </Button>
      </div>
    </main>
  );
}
