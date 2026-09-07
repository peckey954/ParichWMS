"use client";

import * as React from "react";
import { Badge } from "@peckey954/ui/components/ui/badge";
import { cn } from "@peckey954/ui/lib/utils";
import {
  DEFAULT_SAFETY_CONFIG,
  SAFETY_RANK_LABEL,
  type SafetyRank,
  type SafetyStockConfig,
} from "@/lib/safety-stock";

/**
 * เกณฑ์ Safety Stock ที่ตั้งไว้ — ต้องข้ามหน้าได้
 *
 * หน้าตั้งค่า (/stock/safety-stock) เป็นคนแก้ แต่คนที่เอาไปใช้จริงคือการ์ด
 * สินค้าในหน้าสต็อกทั่วไป (คนละ route กัน) ถ้าเก็บเป็น state ของหน้าตั้งค่าเอง
 * ปรับเสร็จเดินออกจากหน้าปุ๊บค่าก็หายทันที หน้าตั้งค่าจะกลายเป็นหน้าที่กดแล้ว
 * ไม่มีอะไรเกิดขึ้น — เหตุผลเดียวกับที่ AddedRoundsProvider/RecipeRunProvider
 * ต้องอยู่ระดับ AppShell
 *
 * ไม่มี backend — ค่าอยู่ในหน่วยความจำของเซสชันนี้เท่านั้น รีเฟรชแล้วกลับเป็น
 * ค่าเริ่มต้น เหมือนสถานะอื่น ๆ ทั้งแอปนี้
 */
type SafetyStockCtx = {
  config: SafetyStockConfig;
  setConfig: React.Dispatch<React.SetStateAction<SafetyStockConfig>>;
  reset: () => void;
  /** ต่างจากค่าเริ่มต้นแล้วหรือยัง — ใช้เปิด/ปิดปุ่มคืนค่าเริ่มต้น */
  dirty: boolean;
};

const Ctx = React.createContext<SafetyStockCtx | null>(null);

export function SafetyStockProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = React.useState<SafetyStockConfig>(
    DEFAULT_SAFETY_CONFIG
  );
  const value = React.useMemo<SafetyStockCtx>(
    () => ({
      config,
      setConfig,
      reset: () => setConfig(DEFAULT_SAFETY_CONFIG),
      dirty: JSON.stringify(config) !== JSON.stringify(DEFAULT_SAFETY_CONFIG),
    }),
    [config]
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSafetyStock() {
  const ctx = React.useContext(Ctx);
  if (!ctx) throw new Error("useSafetyStock ต้องอยู่ใน SafetyStockProvider");
  return ctx;
}

/**
 * ชิปเกรด A/B/C — เทาไล่น้ำหนัก ไม่ใช่เขียว/เหลือง/แดง
 *
 * เหตุผลที่ไม่ใช้สีตามความหมาย:
 *
 * 1. เกรดเป็น "ลำดับ" ไม่ใช่ "ประเภท" — A>B>C เรียงกันอยู่แล้ว ข้อมูลแบบเรียง
 *    ลำดับต้องเข้ารหัสด้วยน้ำหนักของสีเดียว (เข้ม→อ่อน) การใช้คนละสีคือวิธี
 *    เข้ารหัสข้อมูลที่ไม่มีลำดับ พอใช้ผิดชนิด คนอ่านต้องมาท่องว่าสีไหนแปลว่าอะไร
 *
 * 2. เกรด C ไม่ใช่ของเสีย — เป็นแค่ของที่ใช้น้อย ซึ่งเป็นเรื่องปกติดี ถ้าให้
 *    C เป็นเหลือง (สีเตือนของแอปนี้) หรือแดง จะอ่านเหมือนมีปัญหาต้องรีบแก้
 *    ทั้งที่ไม่มีอะไรผิด และเขียวสำหรับ A ก็สื่อว่า "ดี" ทั้งที่มันแค่ "ใช้เยอะ"
 *
 * 3. สีบอกสถานะถูกจองไปหมดแล้วในการ์ดใบเดียวกัน — แดงคือสต็อกต่ำ ส้มคือแบรนด์
 *    เหลืองคือคำเตือน เขียวคือปกติ ถ้าเกรดไปใช้ชุดเดียวกัน การ์ดจะมีสีที่ขัดกัน
 *    เอง เช่นชิปเขียว "เกรด A" อยู่ข้างชิปแดง "สต็อกต่ำ" ซึ่งส่งสัญญาณสวนทางกัน
 *
 * 4. ชิปนี้ขึ้นทุกใบไม่มีเว้น — ของที่อยู่ทุกที่ต้องเงียบ ไม่งั้นมันกลบของที่
 *    ควรสะดุดตาจริง ๆ (สต็อกต่ำ) ซึ่งมีไม่กี่ใบ
 *
 * ใช้ tone="neutral" ของ DS แล้วไล่ด้วย appearance สามระดับ ได้ ramp ที่อ่าน
 * เป็นลำดับทันทีโดยไม่ต้องเพิ่ม token ใหม่เลย
 */
const RANK_APPEARANCE: Record<SafetyRank, "solid" | "soft" | "outline"> = {
  A: "solid", // เข้มสุด = ตัวหลักของคลัง
  B: "soft",
  C: "outline", // เบาสุด = ของหางแถว
};

/** สีของ ramp — ส้มแบรนด์ ไล่ solid → soft → outline
 *
 *  ใช้ส้มได้ก็ต่อเมื่อชิป "ประเภทสินค้า" ข้างชื่อถูกลดเป็นสีเทาแล้วเท่านั้น
 *  (ดู CategoryChip ใน stock-parts.tsx) ไม่งั้นเกรด C ซึ่งเป็นส้มแบบเส้นขอบ
 *  จะหน้าตาเหมือนชิปประเภทเป๊ะจนแยกไม่ออกว่าอันไหนคืออะไร */
const RANK_TONE = "brand" as const;

// เขียนคลาสเต็มทุกตัว ห้ามประกอบชื่อด้วย template string
//
// ใช้ bg-[var(--chip-…)] ไม่ใช่ bg-chip-… เพราะ globals.css ลงทะเบียนชิปเป็น
// คลาส Tailwind ไว้แค่บางสี ที่เหลือเขียนแบบสำเร็จรูปแล้วคอมไพล์ออกมาเป็น
// ค่าว่างเงียบ ๆ ส่วนแบบ arbitrary value อ้าง CSS variable ตรง ๆ ใช้ได้ครบทุกสี
const RANK_MARK: Record<SafetyRank, string> = {
  A: "bg-[var(--chip-green)] text-[var(--chip-green-foreground)]",
  B: "bg-[var(--chip-blue)] text-[var(--chip-blue-foreground)]",
  C: "bg-[var(--chip-yellow)] text-[var(--chip-yellow-foreground)]",
};

/**
 * เครื่องหมายอันดับ A/B/C แบบวงกลมตัวเดียว — ใช้ในหน้าตั้งค่า ซึ่งมีคำว่า
 * "อันดับ" พาดหัวคอลัมน์อยู่แล้ว ตัวอักษรเดี่ยวจึงอ่านออกโดยไม่ต้องมีคำกำกับ
 * และไม่ไปแย่งพื้นที่กับช่องกรอกสองช่องในแถวเดียวกัน
 *
 * ต่างจาก RankChip ที่ใช้ในหน้าสต็อกทั่วไป ตรงนั้นชิปไปอยู่ปนกับชิปอื่นเต็มแถว
 * เลยต้องมีคำว่า "เกรด" กำกับ ไม่งั้นตัว A เดี่ยว ๆ อ่านไม่ออกว่าคืออะไร
 */
export function RankMark({
  rank,
  className,
}: {
  rank: SafetyRank;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
        RANK_MARK[rank],
        className
      )}
      aria-label={SAFETY_RANK_LABEL[rank]}
    >
      {rank}
    </span>
  );
}

/** ชิปเกรด A/B/C — เขียนคำว่า "เกรด" กำกับเสมอ ไม่ปล่อยตัวอักษรลอย ๆ
 *  ตัว A เดี่ยว ๆ ในแถวที่มีชิปอื่นเต็มไปหมดอ่านไม่ออกว่าหมายถึงอะไร */
export function RankChip({
  rank,
  className,
}: {
  rank: SafetyRank;
  className?: string;
}) {
  return (
    <Badge
      tone={RANK_TONE}
      appearance={RANK_APPEARANCE[rank]}
      className={cn("font-semibold", className)}
    >
      {SAFETY_RANK_LABEL[rank]}
    </Badge>
  );
}
