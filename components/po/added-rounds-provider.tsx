"use client";

import * as React from "react";
import type { PoRound } from "@/lib/po";

/* ------------------------------------------------------------------
   สถานะ "รอบการรับสินค้า" ที่แก้ไขระหว่างใช้งานเซสชันนี้ — สามอย่าง:

     1) entries   รอบใหม่ที่เพิ่มจากหน้า "เพิ่มรอบ"
     2) patches   แก้ไขรอบที่มีอยู่แล้ว (ไม่ว่าจะเป็นรอบจากข้อมูลตัวอย่าง หรือ
                  รอบที่เพิ่งเพิ่มเองใน entries ก็แก้ผ่านทางนี้เหมือนกันหมด —
                  ไม่ต้องสนใจว่าที่มาคือไหน เก็บแค่ patch แยกต่างหากแล้วให้
                  applyRoundEdits ผสานให้ตอนอ่าน)
     3) deletedIds รอบที่ถูกลบ

   หน้า "เพิ่มรอบ" (app/po/[id]/receive/[itemId]/add/page.tsx, ใช้ทั้งโหมด
   เพิ่ม/แก้ไข/ลบ) เป็นคนละหน้ากับหน้าใบสั่งซื้อ (app/po/[id]/page.tsx) และหน้า
   รายละเอียดรอบ (app/po/[id]/receive/[itemId]/[roundId]/page.tsx) ที่โชว์ผล —
   คนละ route กัน ข้ามหน้าไปมา React state ธรรมดาเก็บไม่ได้ จึงต้องยกสถานะนี้
   ขึ้นมาไว้ที่ provider ระดับแอป (components/app-shell.tsx) เหมือน
   NotificationsProvider

   entries เก็บโดย unshift (ล่าสุดขึ้นก่อนเสมอ) เพราะรอบใหม่ต้องขึ้นเป็น "แถว
   บนสุด" ของตาราง "รอบการรับสินค้า" ที่รวมทุกรายการสินค้าในใบเดียวกันไว้ใน
   ตารางเดียว — ต้องมีลำดับ "ล่าสุดก่อน" ข้ามรายการสินค้าได้ด้วย

   ไม่มี backend จริงตามธรรมชาติของแอปนี้ — เก็บแค่ใน memory ของเซสชันนี้
   รีเฟรชหน้าเว็บแล้วหายกลับไปเป็นข้อมูลตัวอย่างเดิม (เหมือนที่อื่นทั้งแอป)
------------------------------------------------------------------ */

export type AddedRoundEntry = { lineItemId: string; round: PoRound };

type RoundPatches = Record<string, Partial<PoRound>>;

type AddedRoundsContextValue = {
  /** รอบที่เพิ่มไว้ทั้งหมด (ทุกรายการสินค้ารวมกัน) เรียงล่าสุดก่อน */
  entries: AddedRoundEntry[];
  addRound: (lineItemId: string, round: PoRound) => void;
  /** รอบที่เพิ่มไว้แล้วของรายการสินค้านี้โดยเฉพาะ (ยังไม่ผสาน patch/ลบ —
   *  ใช้ applyRoundEdits ต่ออีกทีถ้าต้องการค่าที่ถูกต้องจริง) */
  roundsFor: (lineItemId: string) => PoRound[];
  patches: RoundPatches;
  updateRound: (roundId: string, patch: Partial<PoRound>) => void;
  deletedIds: Set<string>;
  deleteRound: (roundId: string) => void;
};

const AddedRoundsContext = React.createContext<AddedRoundsContextValue | null>(null);

export function AddedRoundsProvider({ children }: { children: React.ReactNode }) {
  const [entries, setEntries] = React.useState<AddedRoundEntry[]>([]);
  const [patches, setPatches] = React.useState<RoundPatches>({});
  const [deletedIds, setDeletedIds] = React.useState<Set<string>>(new Set());

  const addRound = React.useCallback((lineItemId: string, round: PoRound) => {
    // unshift ไม่ push — รอบที่เพิ่งเพิ่มต้องขึ้นก่อนเสมอ
    setEntries((prev) => [{ lineItemId, round }, ...prev]);
  }, []);

  const roundsFor = React.useCallback(
    (lineItemId: string) =>
      entries.filter((e) => e.lineItemId === lineItemId).map((e) => e.round),
    [entries]
  );

  const updateRound = React.useCallback((roundId: string, patch: Partial<PoRound>) => {
    setPatches((prev) => ({ ...prev, [roundId]: { ...prev[roundId], ...patch } }));
  }, []);

  const deleteRound = React.useCallback((roundId: string) => {
    setDeletedIds((prev) => new Set(prev).add(roundId));
  }, []);

  const value = React.useMemo(
    () => ({ entries, addRound, roundsFor, patches, updateRound, deletedIds, deleteRound }),
    [entries, addRound, roundsFor, patches, updateRound, deletedIds, deleteRound]
  );

  return (
    <AddedRoundsContext.Provider value={value}>{children}</AddedRoundsContext.Provider>
  );
}

export function useAddedRounds() {
  const ctx = React.useContext(AddedRoundsContext);
  if (!ctx) throw new Error("useAddedRounds ต้องถูกใช้ภายใต้ AddedRoundsProvider");
  return ctx;
}

/** ผสาน patch เข้ากับรอบต้นฉบับ — คืน null ถ้ารอบนั้นถูกลบไปแล้ว ใช้ที่เดียวกัน
 *  ทุกจุดที่อ่านรอบ (หน้าใบสั่งซื้อ, หน้ารายละเอียดรอบ, ฟอร์มแก้ไข) กันลืมผสาน
 *  บางที่แล้วเห็นข้อมูลไม่ตรงกัน */
export function applyRoundEdits(
  round: PoRound,
  patches: RoundPatches,
  deletedIds: Set<string>
): PoRound | null {
  if (deletedIds.has(round.id)) return null;
  const patch = patches[round.id];
  return patch ? { ...round, ...patch } : round;
}
