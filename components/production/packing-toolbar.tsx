"use client";

import * as React from "react";
import { ListFilterIcon, SearchIcon } from "lucide-react";
import { Button } from "@peckey954/ui/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@peckey954/ui/components/ui/input-group";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@peckey954/ui/components/ui/dialog";
import { ActionButtons, type PackingAction } from "./packing-actions";

/* ------------------------------------------------------------------
   แถบเครื่องมือใต้แถบแท็บ

   มีเฉพาะปุ่มที่ใช้ได้กับแท็บที่เปิดอยู่เท่านั้น
   ปุ่มที่กดได้ทุกแท็บย้ายขึ้นไปอยู่ระดับหน้าแล้ว
   แยกกันแบบนี้ทำให้ตำแหน่งบอกขอบเขตได้ตรง และหัวหน้าไม่กระตุกตอนสลับแท็บ
------------------------------------------------------------------ */

export function PackingToolbar({
  query,
  onQuery,
  placeholder,
  actions,
  filter,
  filterActive,
  filterOpen,
  onFilterOpenChange,
  onFilter,
}: {
  query: string;
  onQuery: (v: string) => void;
  placeholder: string;
  actions: PackingAction[];
  /** เนื้อในของตัวกรอง ถ้าแท็บนั้นมีของให้กรอง — ไม่ส่งมาก็เป็นปุ่มเปล่า */
  filter?: React.ReactNode;
  /** มีอะไรถูกเปลี่ยนจากค่าเริ่มต้นไหม — ไม่ว่าจะเป็นติ๊ก การเรียง หรือดรอปดาวน์ */
  filterActive?: boolean;
  /** สั่งเปิด/ปิดจากข้างนอกได้ แถวสรุปตัวกรองกด "+2" แล้วต้องเปิดกล่องนี้ */
  filterOpen?: boolean;
  onFilterOpenChange?: (v: boolean) => void;
  onFilter?: () => void;
}) {
  const TITLE = "ตัวกรองและการแสดงผล";
  // ใช้ไอคอนเดียวกับปุ่มตัวกรองที่หน้าสต็อกและหน้าสูตร
  // ปุ่มทำงานเหมือนกันต้องหน้าตาเหมือนกัน ไม่งั้นคนต้องเรียนรู้ใหม่ทุกหน้า
  // จุดมุมขวาบนบอกว่ามีของถูกซ่อนอยู่ จะได้ไม่ลืมว่าเคยปิดไว้
  const trigger = (
    <Button
      variant="outline-primary"
      size="icon"
      aria-label="ตัวกรองและการแสดงผล"
      className="relative shrink-0"
      onClick={filter ? undefined : onFilter}
    >
      <ListFilterIcon />
      {/* จุดบอกว่ามีอะไรถูกเปลี่ยนไว้ ไม่บอกว่ากี่อย่าง
          ตัวเลขทำให้ต้องนิยามว่าอะไรนับอะไรไม่นับ ซึ่งคนอ่านไม่มีทางรู้
          สิ่งที่ต้องรู้จริง ๆ มีแค่ "ที่เห็นอยู่ไม่ใช่ของทั้งหมด" เท่านั้น
          ขนาดกับตำแหน่งตามคอมโพเนนต์ในไฟล์ออกแบบ — วงกลม 8px ห่างขอบ 4px */}
      {filterActive && (
        <span className="absolute top-1 right-1 size-2 rounded-full bg-primary" />
      )}
    </Button>
  );

  return (
    <div className="flex items-center gap-2">
      <div className="min-w-0 flex-1">
        <InputGroup className="bg-card">
          <InputGroupAddon align="inline-start">
            <SearchIcon />
          </InputGroupAddon>
          <InputGroupInput
            placeholder={placeholder}
            value={query}
            onChange={(e) => onQuery(e.target.value)}
          />
        </InputGroup>
      </div>

      {filter ? (
        <Dialog open={filterOpen} onOpenChange={onFilterOpenChange}>
          <DialogTrigger asChild>{trigger}</DialogTrigger>
          {/* กล่องกลางจอทุกขนาดหน้าจอ ไม่ใช่ popover ห้อยใต้ปุ่ม
              Popover ของ Radix ไม่ล็อกการเลื่อนของหน้าข้างหลัง เลื่อนสุดกล่อง
              แล้วมันไหลไปเลื่อนหน้าต่อ ซึ่งแยกไม่ออกว่าอะไรกำลังเลื่อนอยู่
              และ popover สูงได้แค่ระยะจากปุ่มถึงขอบล่าง ตัวกรองยาวกว่านั้น
              ส่วนที่เป็นดรอปดาวน์เลยถูกตัดหายไปโดยไม่มีอะไรบอกว่ายังมีต่อ

              กล่องกลางจอได้ความสูงเต็ม มีฉากหลังทึบ และล็อกการเลื่อนให้ด้วย

              overflow-hidden ทับกฎของโหมดจำลองอุปกรณ์ที่ตั้ง overflow-y:auto ไว้
              ไม่งั้นกล่องทั้งใบจะเลื่อน แล้วปุ่มล้างค่าที่ตรึงไว้ก็เลื่อนตามไปด้วย */}
          {/* ไม่มีคำอธิบายใต้หัวข้อ — aria-describedby ต้องเป็น undefined ชัด ๆ
              ไม่งั้น Radix เตือนว่าหา DialogDescription ไม่เจอ */}
          <DialogContent
            aria-describedby={undefined}
            className="flex max-h-[85svh] flex-col gap-0 overflow-hidden! p-0 sm:max-w-md"
          >
            <DialogHeader className="px-4 pt-4 text-left">
              <DialogTitle>{TITLE}</DialogTitle>
            </DialogHeader>
            {filter}
          </DialogContent>
        </Dialog>
      ) : (
        trigger
      )}

      <ActionButtons actions={actions} />
    </div>
  );
}
