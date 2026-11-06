import {
  INBOUND_DOCS,
  ISSUE_DOCS,
  ISSUE_STATUS_LABEL,
  formatAmount,
  formatQty,
  isInboundOpen,
  isReturn,
  matchesInbound,
  matchesIssue,
  outstandingQty,
  type InboundDoc,
  type IssueDoc,
} from "./general-stock";
import { stampOf, type WaitDoc, type WaitKind } from "./goods-waiting";

/* ------------------------------------------------------------------
   แท็บ "รอรับเข้า/จ่าย/คืน" ของสต็อกทั่วไป — แบบเดียวกับสต็อกสินค้า
   (lib/goods-waiting.ts) ใช้การ์ดชุดเดียวกัน ต่างกันที่ข้อมูล

   สต็อกทั่วไปไม่มีรับเข้าจากไลน์ผลิต ชิปจึงเหลือ รอรับเข้า / รอรับคืน / รอจ่ายออก
   ใบรับเข้าหนึ่งใบคือรถหนึ่งคันอยู่แล้ว ไม่ต้องแตกแถวตามรถ
   ใบเบิก/คืนเป็นงานภายใน ไม่มีข้อมูลรถ และยังไม่มีหน้าทำรายการ จึงไม่มีปุ่มท้ายแถว
------------------------------------------------------------------ */

export const GENERAL_WAIT_KINDS: { id: WaitKind | "all"; label: string }[] = [
  { id: "all", label: "ทั้งหมด" },
  { id: "inbound", label: "รอรับเข้า" },
  { id: "return", label: "รอรับคืน" },
  { id: "issue", label: "รอจ่ายออก" },
];

const amountOf = (v: number, unit: string) => `${unit === "ตัน" ? formatAmount(v) : formatQty(v)} ${unit}`;

function fromInbound(d: InboundDoc): WaitDoc {
  return {
    id: d.id,
    kind: "inbound",
    code: d.code,
    createdAt: d.createdAt,
    party: d.supplier,
    status: "inbound",
    statusLabel: "รอรับเข้า",
    external: true,
    amountLabel: "รอรับเข้า",
    href: `/stock/inbound/${d.id}/add`,
    items: [
      {
        key: d.id,
        productName: d.productName,
        tags: [d.productSub, d.packing].filter(Boolean) as string[],
        truck: d.truck,
        arriveDate: d.arriveDate,
        amount: amountOf(outstandingQty(d), d.orderUnit),
      },
    ],
  };
}

function fromIssue(d: IssueDoc): WaitDoc {
  const ret = isReturn(d.status);
  return {
    id: d.id,
    kind: ret ? "return" : "issue",
    code: d.code,
    createdAt: d.createdAt,
    status: d.status,
    statusLabel: ISSUE_STATUS_LABEL[d.status],
    external: false,
    amountLabel: ret ? "รอรับคืน" : "รอจ่ายออก",
    items: [
      {
        key: d.id,
        productName: d.productName,
        tags: d.packing ? [d.packing] : [],
        sub: d.note,
        amount: amountOf(Math.abs(d.qty), d.unit),
      },
    ],
  };
}

/** ใบที่ยังค้างทั้งหมดของสต็อกทั่วไป ใหม่สุดขึ้นก่อน */
export function generalWaitingDocs(q: string): WaitDoc[] {
  const inbound = INBOUND_DOCS.filter((d) => isInboundOpen(d) && matchesInbound(d, q)).map(fromInbound);
  const issue = ISSUE_DOCS.filter((d) => matchesIssue(d, q)).map(fromIssue);
  return [...inbound, ...issue].sort((a, b) => stampOf(b.createdAt) - stampOf(a.createdAt));
}
