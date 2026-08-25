"use client";

import * as React from "react";
import { TableCell, TableRow } from "@peckey954/ui/components/ui/table";

/* ------------------------------------------------------------------
   แถวหัวกลุ่ม — เต็มความกว้างตาราง ตรึงอยู่ใต้หัวตาราง (STICKY_HEAD, top-0)
   จนกว่าจะเลื่อนผ่านไปเจอกลุ่มถัดไป เหมือนหัวข้อ A-Z ใน contact list

   ใช้แทนคอลัมน์ "กลุ่ม/กลุ่มสูตร" เดิมที่ซ้ำชื่อกลุ่มทุกแถว (หรือขีดคั่นถ้าซ้ำ)
   กินที่แนวนอนไปเปล่า ๆ — ย้ายกลุ่มมาเป็นแถวคั่นแทน อ่านง่ายกว่าและไม่กิน
   ความกว้างคอลัมน์ข้อมูลจริง

   ดีไซน์อ้างอิงหน้าตั้งค่าต้นทุน (Figma) — พื้นส้มอ่อน (bg-chip-orange) + ขีดส้มเข้ม
   ทึบด้านซ้าย แทนพื้นส้มเข้มเต็มแถบเดิม (bg-brand)
   ใช้ทุกตารางที่มีกลุ่มสูตรให้เหมือนกันหมด (สูตรประจำสัปดาห์ / สูตรที่เหมาะสม / ตั้งค่า
   ต้นทุน) — เดิม bg-chip-orange ยังไม่เคยขึ้นสีจริงเพราะไม่ได้ลงทะเบียนเป็น Tailwind
   theme color มาก่อน (ดู app/globals.css ที่เพิ่งเพิ่ม --color-chip-orange เข้าไป)

   ขีดซ้าย + ตัวหนังสือใช้ text-primary/border-l-primary (ส้ม primary ของแบรนด์)
   ไม่ใช่ chip-orange-foreground — สองสีนี้หน้าตาเหมือนกันเป๊ะในโหมดสว่าง (ทั้งคู่คือ
   #f97316) แต่ในโหมดมืด chip-orange-foreground จางกว่า primary มาก ใช้ primary
   จะได้สีส้มที่ตรงกับปุ่ม/แบรนด์จริงในทุกโหมด ส่วนพื้นหลังยังคงเป็น bg-chip-orange
   (ส้มอ่อนมาก) เพราะแค่ต้องการพื้นรองไม่ใช่สีเน้น

   border-l-primary ต้องมี ! (important) ต่อท้ายเสมอ — TableFrame (doc-parts.tsx)
   ใส่ "[&_td]:border-border" ไว้กับทุก td ในตาราง ซึ่ง compile ออกมาเป็น
   ".xxx td { border-color: var(--border) }" คือ class+type selector specificity
   (0,1,1) สูงกว่า class เดี่ยวอย่าง .border-l-primary (0,1,0) ธรรมดา ๆ ชนแล้ว
   TableFrame ชนะเสมอ ต่อให้ border-l-primary มาทีหลังใน className ก็ตาม (เคยลองแล้ว
   ขีดซ้ายออกมาเป็นสีเทาแทนที่จะเป็นส้ม) ต้องบังคับ ! ให้ชนะแบบไม่ง้อ specificity
   ส่วน border-b ปล่อยให้ TableFrame ให้สีเทาตามปกติได้เลย ไม่ต้องตั้งสีเอง

   ระยะ top ต้องเท่ากับความสูงจริงของแถวหัวตาราง ไม่งั้นแถวนี้จะโผล่ทับ/โดนหัว
   ตารางทับบางส่วนตอนเลื่อน (เคยเขียนเป็นเลข px ตายตัวจากการวัดครั้งเดียว พอมีคน
   แก้ padding หัวตารางทีหลัง เลขเดิมก็เพี้ยนทันที) จึงเปลี่ยนมาวัดสดด้วย
   ResizeObserver ผ่าน useGroupStickyTop แทน — หัวตารางเปลี่ยนความสูงยังไงก็ยัง
   ตรงเสมอ ไม่ต้องจำมาแก้เลขเอง

   z-20 ไม่ใช่ z-10 — คอลัมน์แรกของทุกแถวข้อมูล (COL_FIRST) ก็ตรึงด้วยเหมือนกัน
   (ตรึงซ้ายแนวนอน) และใช้ z-10 เท่ากัน ถ้าแถวนี้ก็ z-10 ตอนเลื่อน DOM ของ
   COL_FIRST ในแถวข้อมูลที่อยู่ "หลัง" แถวนี้จะชนะการเรียงชั้นแล้ววาดทับข้อความ
   ชื่อกลุ่มที่อยู่ตำแหน่งซ้ายสุดจนมองไม่เห็น (เห็นแถบสีส้มว่างเปล่า) — เคยเจอบั๊กนี้
   มาแล้วจริง ต้องตั้งสูงกว่า COL_FIRST ไว้ก่อนเสมอ
------------------------------------------------------------------ */

/**
 * วัดความสูงจริงของแถวหัวตารางแบบสด แล้วคืนค่าที่ต้อง top ไว้ให้แถวหัวกลุ่ม
 *
 * ใช้คู่กัน: เอา headRef ไปแปะที่ <TableRow> ในตัว TableHeader ของตารางเดียวกัน
 * แล้วเอาค่า top ที่ได้ไปส่งต่อให้ทุก <GroupHeaderRow> ในตารางนั้น
 */
export function useGroupStickyTop() {
  const headRef = React.useRef<HTMLTableRowElement>(null);
  // ค่าเริ่มต้นกันแถวกระโดดตอนยังไม่ทันวัดเสร็จเฟรมแรก
  const [top, setTop] = React.useState(53);

  React.useLayoutEffect(() => {
    const el = headRef.current;
    if (!el) return;
    const update = () => setTop(el.getBoundingClientRect().height);
    update();
    // จอแคบ/กว้างสลับกันความสูงหัวตารางอาจไม่เท่ากัน (ตัดคำ 1 หรือ 2 บรรทัด)
    // ต้องวัดใหม่ทุกครั้งที่ขนาดเปลี่ยน ไม่ใช่วัดครั้งเดียวตอน mount
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return { headRef, top };
}

export function GroupHeaderRow({ label, top }: { label: string; top: number }) {
  return (
    <TableRow className="hover:bg-transparent">
      <TableCell
        colSpan={100}
        style={{ top }}
        className="sticky z-20 border-b border-l-4 border-l-primary! bg-chip-orange py-1 text-sm font-semibold text-primary"
      >
        {label}
      </TableCell>
    </TableRow>
  );
}
