"use client";

import * as React from "react";
import { SearchIcon, StarIcon } from "lucide-react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@peckey954/ui/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@peckey954/ui/components/ui/select";
import { cn } from "@peckey954/ui/lib/utils";
import { MODULE_GROUPS } from "@/lib/modules";
import { REPORT_TYPES, type ReportType } from "@/lib/reports";

/* ------------------------------------------------------------------
   รายการชนิดเอกสาร

   จอกว้างเป็นแถบซ้ายที่ค้างอยู่ตลอด เพราะบัญชีสลับชนิดเอกสารบ่อยมาก
   ถ้าเป็นดรอปดาวน์จะต้องกดเปิดทุกครั้ง ช้ากว่ากันมากเมื่อทำวันละหลายสิบรอบ

   ช่องค้นหาอยู่ในกล่องเดียวกับรายการ ไม่ลอยอยู่ข้างบน — มันคือเครื่องมือ
   ของรายการนี้อันเดียว ไม่ได้ค้นอย่างอื่นในหน้า อยู่ในกรอบเดียวกันจึงอ่านถูก

   ---------- รายการโปรด ----------

   ติดดาวแล้วขึ้นไปอยู่กลุ่มบนสุด และ "หายออกจากหมวดเดิม" ไม่ใช่โผล่สองที่
   นี่คือเงื่อนไขเดียวที่ทำให้กลุ่มปักหมุดใช้ได้จริง — ของเดิมตั้งใจไม่ทำกลุ่ม
   ใช้บ่อยไว้ เพราะชื่อเดียวกันโผล่สองที่แล้วตัวเลขจำนวนเอกสารจะถูกนับซ้ำ
   จนดูเหมือนมีเอกสารสองชุด ย้ายแทนการก๊อปจึงแก้ปัญหานั้นไปในตัว

   ดาวโผล่เฉพาะตอนชี้เมาส์ (และตอนโฟกัสด้วยคีย์บอร์ด) ไม่ว่าจะติดดาวไว้แล้วหรือยัง
   สิ่งที่บอกว่าอันไหนเป็นรายการโปรดคือ "มันอยู่ในกลุ่มรายการโปรด" ไม่ใช่ไอคอนดาว
   ดาวเป็นแค่ปุ่มสำหรับสลับ ไม่ใช่ป้ายสถานะ — รายการสิบกว่าบรรทัดที่มีดาวค้างทุกแถว
   กวนสายตาโดยไม่เพิ่มข้อมูลอะไรที่หัวกลุ่มยังไม่ได้บอก

   ที่ซ่อนได้โดยไม่ต้องห่วงจอสัมผัส เพราะแถบซ้ายนี้ขึ้นเฉพาะจอกว้าง (@3xl ขึ้นไป)
   ซึ่งมีเมาส์อยู่แล้ว จอแคบใช้ดรอปดาวน์แทนและติดดาวไม่ได้ตั้งแต่แรก
   เพราะแถวในดรอปดาวน์กดแล้วปิดทันที ปุ่มซ้อนข้างในจึงกดไม่ติด

   ไม่มีตัวเลขจำนวนเอกสารในรายการ — ตัวเลขเดียวกันอยู่บนหัวข้อฝั่งขวาแล้ว
   ("ใบขอซื้อ (18 รายงาน)") เขียนสองที่คือบอกเรื่องเดิมซ้ำ
------------------------------------------------------------------ */

const FAVORITES_KEY = "parich.reports.favorites";

/* ------------------------------------------------------------------
   ชนิดเอกสารที่ติดดาวไว้

   เก็บลงเบราว์เซอร์เพราะประโยชน์ทั้งหมดของมันคือ "เปิดมาแล้วของที่ใช้ทุกวัน
   อยู่บนสุดเลย" ถ้าหายทุกครั้งที่รีเฟรชก็ไม่ต้องมีก็ได้

   อ่านผ่าน useSyncExternalStore ไม่ใช่ useState + useEffect เพราะ localStorage
   เป็นที่เก็บข้อมูลนอก React จริง ๆ — React มี API สำหรับกรณีนี้โดยเฉพาะ
   ได้ค่าฝั่งเซิร์ฟเวอร์เป็นว่างเสมอโดยไม่ทำให้ hydration ไม่ตรงกัน
   และได้ซิงก์ข้ามแท็บมาฟรี ๆ จาก event "storage"

   getSnapshot ต้องคืน "ตัวเดิม" ถ้าข้อมูลไม่เปลี่ยน ไม่งั้น React จะเรนเดอร์วนไม่จบ
   จึงจำสตริงดิบที่อ่านได้ล่าสุดไว้ แล้ว parse ใหม่เฉพาะตอนที่มันต่างจากเดิม
------------------------------------------------------------------ */

const NONE: string[] = [];
const listeners = new Set<() => void>();

/** undefined = ยังไม่เคยอ่าน หรือถูกสั่งให้อ่านใหม่ (null เป็นค่าที่ getItem คืนได้จริง) */
let cachedRaw: string | null | undefined;
let cachedIds: string[] = NONE;

function readFavorites(): string[] {
  try {
    const raw = window.localStorage.getItem(FAVORITES_KEY);
    if (raw === cachedRaw) return cachedIds;
    cachedRaw = raw;

    let parsed: unknown = null;
    try {
      parsed = raw ? JSON.parse(raw) : null;
    } catch {
      parsed = null;
    }
    // กรองกับรายการจริงเสมอ ชนิดเอกสารที่ถูกถอดออกไปแล้วจะได้ไม่ค้างอยู่
    cachedIds = Array.isArray(parsed)
      ? REPORT_TYPES.filter((t) => parsed.includes(t.id)).map((t) => t.id)
      : NONE;
  } catch {
    // โหมดส่วนตัว หรือผู้ใช้ปิดที่เก็บข้อมูลของเว็บไว้ — ใช้งานต่อได้ แค่ไม่จำ
    cachedIds = NONE;
  }
  return cachedIds;
}

function subscribeFavorites(onChange: () => void) {
  listeners.add(onChange);
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

function writeFavorites(next: string[]) {
  try {
    window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
  } catch {
    // เขียนไม่ได้ก็ยังให้ติดดาวได้ในรอบนี้ ไม่ต้องขึ้น error ให้ตกใจ
  }
  cachedRaw = undefined; // บังคับให้อ่านใหม่รอบหน้า
  listeners.forEach((fn) => fn());
}

function useFavorites() {
  const ids = React.useSyncExternalStore(
    subscribeFavorites,
    readFavorites,
    () => NONE
  );

  const toggle = React.useCallback((id: string) => {
    const cur = readFavorites();
    writeFavorites(
      cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]
    );
  }, []);

  return { ids, toggle };
}

export function TypeList({
  value,
  onChange,
}: {
  value: string;
  onChange: (id: string) => void;
}) {
  const [query, setQuery] = React.useState("");
  const favorites = useFavorites();
  const fav = React.useMemo(() => new Set(favorites.ids), [favorites.ids]);

  const matched = React.useMemo(() => {
    const s = query.trim().toLowerCase();
    if (!s) return REPORT_TYPES;
    return REPORT_TYPES.filter(
      (t) =>
        t.label.toLowerCase().includes(s) ||
        t.prefix.toLowerCase().includes(s) ||
        t.code.toLowerCase().includes(s)
    );
  }, [query]);

  /**
   * รายการโปรดขึ้นก่อน แล้วค่อยหมวดปกติที่ตัดตัวติดดาวออกไปแล้ว
   *
   * เรียงในกลุ่มโปรดตามลำดับของ REPORT_TYPES ไม่ใช่ตามลำดับที่กดดาว
   * เรียงตามลำดับที่กดแล้วรายการจะสลับที่ทุกครั้งที่ติด/ถอดดาว หาของยาก
   */
  const groups = React.useMemo(() => {
    const favItems = matched.filter((t) => fav.has(t.id));
    const rest = MODULE_GROUPS.map((g) => ({
      id: g.id as string,
      label: g.label,
      items: matched.filter((t) => t.group === g.id && !fav.has(t.id)),
    })).filter((g) => g.items.length > 0);

    return favItems.length > 0
      ? [{ id: "__fav", label: "รายการโปรด", items: favItems }, ...rest]
      : rest;
  }, [matched, fav]);

  return (
    <>
      {/* ---------- จอแคบ: ดรอปดาวน์ ---------- */}
      <div className="@3xl:hidden">
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger className="w-full bg-card">
            <SelectValue placeholder="เลือกชนิดเอกสาร" />
          </SelectTrigger>
          <SelectContent>
            {groups.map((g) => (
              <SelectGroup key={g.id}>
                <SelectLabel>{g.label}</SelectLabel>
                {g.items.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* ---------- จอกว้าง: แถบซ้าย ---------- */}
      <div className="hidden @3xl:block">
        {/* ค้างไว้ตอนเลื่อนตาราง จะได้สลับชนิดเอกสารโดยไม่ต้องเลื่อนกลับขึ้นบน */}
        <nav
          aria-label="ชนิดเอกสาร"
          className="sticky top-4 flex max-h-[calc(100dvh-8rem)] flex-col rounded-xl border border-border bg-card p-3"
        >
          <InputGroup className="bg-card">
            <InputGroupAddon align="inline-start">
              <SearchIcon />
            </InputGroupAddon>
            <InputGroupInput
              placeholder="ค้นหาประเภทเอกสาร..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </InputGroup>

          <div className="mt-2 min-h-0 flex-1 overflow-y-auto">
            {groups.map((g) => (
              <div key={g.id} className="mb-1 last:mb-0">
                {/* หัวกลุ่มหน้าตาเดียวกันหมด รวมทั้งรายการโปรด — มันคือหมวดหนึ่ง
                    ในรายการเดียวกัน ไม่ใช่ของพิเศษที่ต้องตะโกนด้วยสีหรือไอคอน
                    ลำดับที่มันอยู่บนสุดบอกความสำคัญไปแล้ว */}
                <p className="px-2 pt-3 pb-1 text-sm font-medium text-muted-foreground">
                  {g.label}
                </p>
                {g.items.map((t) => (
                  <TypeRow
                    key={t.id}
                    type={t}
                    active={t.id === value}
                    starred={fav.has(t.id)}
                    onClick={() => onChange(t.id)}
                    onToggleStar={() => favorites.toggle(t.id)}
                  />
                ))}
              </div>
            ))}

            {matched.length === 0 && (
              <p className="px-2 py-6 text-center text-sm text-muted-foreground">
                ไม่พบชนิดเอกสารที่ค้นหา
              </p>
            )}
          </div>
        </nav>
      </div>
    </>
  );
}

function TypeRow({
  type,
  active,
  starred,
  onClick,
  onToggleStar,
}: {
  type: ReportType;
  active: boolean;
  starred: boolean;
  onClick: () => void;
  onToggleStar: () => void;
}) {
  return (
    // ปุ่มดาวซ้อนในปุ่มเลือกไม่ได้ แถวจึงเป็น div ที่ถือพื้นหลัง hover/active ไว้
    // แล้วมีปุ่มสองอันอยู่ข้างใน กดตรงชื่อ = เลือก กดตรงดาว = ติด/ถอดดาว
    <div
      className={cn(
        "group flex items-center rounded-lg transition-colors",
        active ? "bg-brand" : "hover:bg-accent"
      )}
    >
      <button
        type="button"
        onClick={onClick}
        aria-current={active ? "true" : undefined}
        className={cn(
          "flex min-w-0 flex-1 items-center gap-2 rounded-lg py-2 pl-2 text-left",
          "focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
        )}
      >
        <span className="min-w-0 flex-1">
          <span
            className={cn(
              "block truncate text-sm",
              active ? "font-semibold text-primary" : "font-medium"
            )}
          >
            {type.label}
          </span>
          <span className="block truncate text-xs text-muted-foreground">
            {type.code}
          </span>
        </span>
      </button>

      {/* ซ่อนด้วย opacity ไม่ใช่ถอดออกจากหน้า ที่ว่างของปุ่มจึงยังจองไว้เท่าเดิม
          ถอดออกแล้วชื่อเอกสารจะขยับทุกครั้งที่เมาส์ผ่าน อ่านแล้วรู้สึกกระตุก
          โผล่ตอนโฟกัสด้วย ไล่ทีละแถวด้วย Tab แล้วยังติดดาวได้ */}
      <button
        type="button"
        onClick={onToggleStar}
        aria-pressed={starred}
        aria-label={
          starred
            ? `เอา ${type.label} ออกจากรายการโปรด`
            : `เพิ่ม ${type.label} ในรายการโปรด`
        }
        className={cn(
          "mr-1 flex size-8 shrink-0 items-center justify-center rounded-md",
          "opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100",
          "focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
          starred ? "text-primary" : "text-muted-foreground hover:text-foreground"
        )}
      >
        <StarIcon className={cn("size-4", starred && "fill-current")} />
      </button>
    </div>
  );
}
