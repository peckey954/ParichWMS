import { formatAmount } from "./general-stock";
import { pad, stampOf, truckOf, type WaitDoc, type WaitKind } from "./goods-waiting";
import { RAW_PRODUCTS, rawGroupOf } from "./raw-stock";

/* ------------------------------------------------------------------
   แท็บ "รอรับเข้า/จ่าย/คืน" ของสต็อกวัตถุดิบ (Figma RM Stock: Tab รอรับเช้า/จ่าย/คืน)

   การ์ดชุดเดียวกับสต็อกสินค้า (GoodsWaitingList) ชิปเหลือ รอรับเข้า / รอรับคืน /
   รอจ่ายออก — วัตถุดิบไม่มีรับเข้าจากไลน์ผลิต
     รอรับเข้า         — รับวัตถุดิบภายนอกตามใบสั่งซื้อ (PO) มีรถ
     รอจ่ายออก (ภายนอก) — PRI มีรถ
     รอจ่ายออก (ภายใน)  — REQ ส่งไลน์ผลิต
     รอรับคืน (กวาดพื้น/ภายนอก/ภายใน)

   หน้าทำรายการ (รับเข้า / สั่งจ่าย / รับคืน) ของวัตถุดิบยังไม่ได้ทำ จึงยังไม่มี
   ปุ่มท้ายแถว — แบบเดียวกับที่สต็อกทั่วไปทำไว้ตอนยังไม่มีหน้า
------------------------------------------------------------------ */

export const RAW_WAIT_KINDS: { id: WaitKind | "all"; label: string }[] = [
  { id: "all", label: "ทั้งหมด" },
  { id: "inbound", label: "รอรับเข้า" },
  { id: "return", label: "รอรับคืน" },
  { id: "issue", label: "รอจ่ายออก" },
];

const SUPPLIER = "เอซี อินเตอร์เนชั่นแนล เทรดดิ้ง จำกัด";

type Spec = {
  prefix: string;
  status: string;
  statusLabel: string;
  kind: WaitKind;
  external: boolean;
  amountLabel: string;
};

const SPECS: Spec[] = [
  { prefix: "PO", status: "inbound", statusLabel: "รอรับเข้า", kind: "inbound", external: true, amountLabel: "รอรับเข้า" },
  { prefix: "PRI", status: "issueExternal", statusLabel: "รอจ่ายออก (ภายนอก)", kind: "issue", external: true, amountLabel: "รอจ่ายออก" },
  { prefix: "REQ", status: "issueInternal", statusLabel: "รอจ่ายออก (ภายใน)", kind: "issue", external: false, amountLabel: "รอจ่ายออก" },
  { prefix: "WT", status: "returnSweep", statusLabel: "รอรับคืน (กวาดพื้น)", kind: "return", external: false, amountLabel: "รอรับคืน" },
  { prefix: "RTN", status: "returnExternal", statusLabel: "รอรับคืน (ภายนอก)", kind: "return", external: true, amountLabel: "รอรับคืน" },
  { prefix: "REQ", status: "returnInternal", statusLabel: "รอรับคืน (ภายใน)", kind: "return", external: false, amountLabel: "รอรับคืน" },
];

/** จำนวนใบต่อชนิด เรียงตาม SPECS — รวม 14 ใบตามตัวเลขบนแท็บในแบบ */
const COUNTS = [4, 2, 2, 2, 2, 2];

function makeDocs(): WaitDoc[] {
  const out: WaitDoc[] = [];
  let n = 0;
  SPECS.forEach((spec, si) => {
    for (let k = 0; k < COUNTS[si]; k++) {
      n += 1;
      const day = 16 - (n % 9);
      const code = `${spec.prefix}2601${pad(day)}/${pad(k + 1)}`;
      const createdAt = `1/${day}/2026 | ${pad(8 + (n % 9))}:${pad((n * 7) % 60)}:${pad((n * 13) % 60)}`;
      // ภายนอกมีสองสินค้า (หนึ่งแถวต่อสินค้าต่อทะเบียนรถ) ภายในหนึ่งสินค้า
      const lines = spec.external ? 2 : 1;
      const truck = `กข - ${1234 + n * 7}`;
      out.push({
        id: `rw-${n}`,
        kind: spec.kind,
        code,
        createdAt,
        party: spec.external ? SUPPLIER : undefined,
        status: spec.status,
        statusLabel: spec.statusLabel,
        external: spec.external,
        amountLabel: spec.amountLabel,
        items: Array.from({ length: lines }, (_, i) => {
          const p = RAW_PRODUCTS[(n * 3 + i) % RAW_PRODUCTS.length];
          const qty = 100 + ((n * 37 + i * 53) % 8) * 100;
          return {
            key: `rw-${n}-${i}`,
            productName: p.name,
            tags: ["ปุ๋ยจัมโบ้", rawGroupOf(p.name), p.packing === rawGroupOf(p.name) ? undefined : p.packing].filter(
              (t): t is string => Boolean(t)
            ),
            sub: spec.external ? `${code}B-${pad(i + 1)}` : undefined,
            truck: spec.external ? truckOf(truck, i) : undefined,
            arriveDate: spec.external ? createdAt.split("|")[0].trim() : undefined,
            qty: formatAmount(qty),
            unit: "ตัน",
            // ภายนอก: คันแรกชั่งเสร็จแล้ว คันที่สองยังรอชั่ง
            weighed: spec.external ? i === 0 : undefined,
          };
        }),
      });
    }
  });
  return out;
}

const RAW_WAIT_DOCS = makeDocs();

/** ใบที่ค้างทั้งหมด ใหม่สุดขึ้นก่อน */
export function rawWaitingDocs(q: string): WaitDoc[] {
  const s = q.trim().toLowerCase();
  return RAW_WAIT_DOCS.filter(
    (d) =>
      !s ||
      [d.code, d.party ?? "", ...d.items.map((x) => x.productName)].some((v) => v.toLowerCase().includes(s))
  ).sort((a, b) => stampOf(b.createdAt) - stampOf(a.createdAt));
}
