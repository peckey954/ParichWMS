"use client";

import * as React from "react";
import { SearchIcon, SlidersHorizontalIcon } from "lucide-react";
import { Button } from "@peckey954/ui/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@peckey954/ui/components/ui/input-group";
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
  onFilter,
}: {
  query: string;
  onQuery: (v: string) => void;
  placeholder: string;
  actions: PackingAction[];
  onFilter: () => void;
}) {
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

      <Button
        variant="outline-primary"
        size="icon"
        aria-label="ตัวกรอง"
        className="shrink-0"
        onClick={onFilter}
      >
        <SlidersHorizontalIcon />
      </Button>

      <ActionButtons actions={actions} />
    </div>
  );
}
