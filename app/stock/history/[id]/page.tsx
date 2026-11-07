"use client";

import { useParams } from "next/navigation";
import { LotHistoryPage } from "@/components/stock/history-docs";

/** /stock/history/<id> — ดูย้าย/ปรับปรุงที่ทำไปแล้วของสต็อกทั่วไป */
export default function GeneralHistoryPage() {
  const { id } = useParams<{ id: string }>();
  return <LotHistoryPage key={id} scope="general" id={id} />;
}
