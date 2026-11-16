"use client";

import { useParams } from "next/navigation";
import { LotHistoryPage } from "@/components/stock/history-docs";

/** /stock/raw/history/<id> — ดูย้าย/ปรับปรุงที่ทำไปแล้วของสต็อกวัตถุดิบ */
export default function RawHistoryPage() {
  const { id } = useParams<{ id: string }>();
  return <LotHistoryPage key={id} scope="raw" id={id} />;
}
