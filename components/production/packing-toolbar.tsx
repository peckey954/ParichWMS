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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@peckey954/ui/components/ui/popover";
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
  onFilter,
}: {
  query: string;
  onQuery: (v: string) => void;
  placeholder: string;
  actions: PackingAction[];
  /** เนื้อในของตัวกรอง ถ้าแท็บนั้นมีของให้กรอง — ไม่ส่งมาก็เป็นปุ่มเปล่า */
  filter?: React.ReactNode;
  /** มีตัวกรองทำงานอยู่ไหม ใช้ตัดสินว่าจะขึ้นจุดบนปุ่มหรือเปล่า */
  filterActive?: boolean;
  onFilter?: () => void;
}) {
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
        <Popover>
          <PopoverTrigger asChild>{trigger}</PopoverTrigger>
          <PopoverContent align="end" className="w-72">
            {filter}
          </PopoverContent>
        </Popover>
      ) : (
        trigger
      )}

      <ActionButtons actions={actions} />
    </div>
  );
}
