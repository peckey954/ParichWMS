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
import { pad, sampleTruck, stampOf, truckOf, withCompanion, type WaitDoc, type WaitKind } from "./goods-waiting";

/* ------------------------------------------------------------------
   แท็บ "รอรับเข้า/จ่าย/คืน" ของสต็อกทั่วไป — แบบเดียวกับสต็อกสินค้า
   (lib/goods-waiting.ts) ใช้การ์ดชุดเดียวกัน ต่างกันที่ข้อมูล

   สต็อกทั่วไปไม่มีรับเข้าจากไลน์ผลิต ชิปจึงเหลือ รอรับเข้า / รอรับคืน / รอจ่ายออก
   หนึ่งใบมีได้หลายสินค้า หนึ่งแถวต่อสินค้าต่อทะเบียนรถ (ข้อมูลตัวอย่างใบละสองสินค้า)
   ใบจ่าย/คืนภายนอกมีรถ ข้อมูลตัวอย่างไม่ได้ใส่ไว้จึงเติมทะเบียนคงที่ตามเลขใบ
   ใบเบิก/คืนยังไม่มีหน้าทำรายการ จึงไม่มีปุ่มท้ายแถว
------------------------------------------------------------------ */

export const GENERAL_WAIT_KINDS: { id: WaitKind | "all"; label: string }[] = [
  { id: "all", label: "ทั้งหมด" },
  { id: "inbound", label: "รอรับเข้า" },
  { id: "return", label: "รอรับคืน" },
  { id: "issue", label: "รอจ่ายออก" },
];

const qtyOf = (v: number, unit: string) => (unit === "ตัน" ? formatAmount(v) : formatQty(v));

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
    items: withCompanion(INBOUND_DOCS, d).map((x, i) => ({
      key: `${d.id}-${i}`,
      productName: x.productName,
      tags: [x.productSub, x.packing].filter(Boolean) as string[],
      sub: `${d.code}-${pad(i + 1)}`,
      truck: truckOf(d.truck, i),
      arriveDate: d.arriveDate,
      // ใบที่ยืมมาอาจรับครบไปแล้ว ใช้ยอดสั่งแทน แถวจะได้ไม่เป็นศูนย์
      qty: qtyOf(i === 0 ? outstandingQty(x) : outstandingQty(x) || x.orderQty, x.orderUnit),
      unit: x.orderUnit,
    })),
  };
}

function fromIssue(d: IssueDoc): WaitDoc {
  const ret = isReturn(d.status);
  const external = d.status === "issueExternal" || d.status === "returnExternal";
  const arrive = d.createdAt.split("|")[0].trim();
  return {
    id: d.id,
    kind: ret ? "return" : "issue",
    code: d.code,
    createdAt: d.createdAt,
    status: d.status,
    statusLabel: ISSUE_STATUS_LABEL[d.status],
    external,
    amountLabel: ret ? "รอรับคืน" : "รอจ่ายออก",
    items: withCompanion(ISSUE_DOCS, d, (x) => x.status === d.status).map((x, i) => ({
      key: `${d.id}-${i}`,
      productName: x.productName,
      tags: x.packing ? [x.packing] : [],
      sub: external ? `${d.code}-${pad(i + 1)}` : x.note,
      truck: external ? truckOf(sampleTruck(d.id), i) : undefined,
      arriveDate: external ? arrive : undefined,
      qty: qtyOf(Math.abs(x.qty), x.unit),
      unit: x.unit,
    })),
  };
}

/** ใบที่ยังค้างทั้งหมดของสต็อกทั่วไป ใหม่สุดขึ้นก่อน */
export function generalWaitingDocs(q: string): WaitDoc[] {
  const inbound = INBOUND_DOCS.filter((d) => isInboundOpen(d) && matchesInbound(d, q)).map(fromInbound);
  const issue = ISSUE_DOCS.filter((d) => matchesIssue(d, q)).map(fromIssue);
  return [...inbound, ...issue].sort((a, b) => stampOf(b.createdAt) - stampOf(a.createdAt));
}
