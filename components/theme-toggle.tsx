"use client";

import { MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@peckey954/ui/components/ui/button";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <Button
      variant="outline"
      size="icon"
      aria-label="สลับโหมดสว่าง / มืด"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      {/* สลับไอคอนด้วย CSS ไม่ใช่ state — กัน hydration mismatch ตอน SSR */}
      <MoonIcon className="dark:hidden" />
      <SunIcon className="hidden dark:block" />
    </Button>
  );
}
