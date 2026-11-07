import {
  GOODS_INBOUND_DOCS,
  formatInboundQty,
  isGoodsInboundOpen,
  matchesGoodsInbound,
  type GoodsInboundDoc,
} from "./goods-inbound";
import {
  GOODS_ISSUE_DOCS,
  GOODS_ISSUE_STATUS_LABEL,
  formatQty,
  goodsDocHref,
  isGoodsIssueOpen,
  isGoodsReturn,
  matchesGoodsIssue,
  type GoodsIssueDoc,
} from "./goods-issue";

/* ------------------------------------------------------------------
   แท็บ "รอรับเข้า/จ่าย/คืน" ของสต็อกสินค้า (Figma: Tab รอรับเข้า/จ่าย/คืน)

   รวมใบที่ยังค้างทุกแบบไว้ในรายการเดียว แยกด้วยชิป
     รอรับเข้า      — รับสินค้าภายนอก (PO)
     รอรับเข้าผลิต  — รับเข้าจากไลน์ผลิต (PD)
     รอรับคืน       — คืนภายใน / ภายนอก / กวาดพื้น
     รอจ่ายออก      — จ่ายภายใน / ภายนอก

   หนึ่งการ์ด = หนึ่งใบ ในการ์ดเป็นรายการสินค้า
   หนึ่งใบมีได้หลายสินค้า ภายนอก (รับเข้า จ่ายออก คืนภายนอก) มีทะเบียนรถกับ
   วันที่รถเข้า และแตกเป็นหนึ่งแถวต่อสินค้าต่อทะเบียนรถ เพราะแต่ละคันมีใบชั่ง
   ของตัวเอง (Note to Dev ในแบบ) ข้อมูลตัวอย่างทุกใบมีสองสินค้า ยกเว้นใบผลิต
   ที่หนึ่งใบสั่งผลิตคือสินค้าเดียว
   ภายใน (ผลิต จ่ายภายใน คืนภายใน กวาดพื้น) ไม่มีข้อมูลรถ
------------------------------------------------------------------ */

export type WaitKind = "inbound" | "production" | "return" | "issue";

export const WAIT_KINDS: { id: WaitKind | "all"; label: string }[] = [
  { id: "all", label: "ทั้งหมด" },
  { id: "inbound", label: "รอรับเข้า" },
  { id: "production", label: "รอรับเข้าผลิต" },
  { id: "return", label: "รอรับคืน" },
  { id: "issue", label: "รอจ่ายออก" },
];

/** คำบนปุ่มท้ายแถว */
export const WAIT_ACTION: Record<WaitKind, string> = {
  inbound: "รับเข้า",
  production: "รับเข้า",
  return: "รับคืน",
  issue: "สั่งจ่าย",
};

export type WaitItem = {
  key: string;
  productName: string;
  /** ประเภท | หมวด | บรรจุภัณฑ์ ต่อท้ายชื่อ */
  tags: string[];
  /** บรรทัดที่สองใต้ชื่อ — เลขที่ย่อยของแถว หรือไลน์ผลิต */
  sub?: string;
  truck?: string;
  arriveDate?: string;
  /** ใบผลิต: สั่งผลิตกับผลิตได้จริง (ตัวเลขล้วน หน่วยเดียวกับ qty) */
  ordered?: string;
  produced?: string;
  /** ยอดรอ ตัวเลขล้วน เช่น "800.00" — หน่วยแยกไว้ใน unit */
  qty: string;
  unit: string;
  /** ภายนอก: รถคันนี้ชั่งน้ำหนักเสร็จแล้ว (ติ๊ก) หรือยังรอ (นาฬิกา) */
  weighed?: boolean;
  /** ค่าของคอลัมน์เสริม (WaitDoc.extra) เรียงตามหัวคอลัมน์ */
  extra?: { value: string; tone?: "pos" | "neg" }[];
  /** เปิดดูรายละเอียดของแถวนี้ */
  detailHref?: string;
};

export type WaitDoc = {
  id: string;
  kind: WaitKind;
  code: string;
  createdAt: string;
  /** บริษัทคู่ค้า — ภายในไม่มี */
  party?: string;
  /** คีย์สีของ StatusChip */
  status: string;
  statusLabel: string;
  /** มีคอลัมน์ทะเบียนรถ/วันที่รถเข้า */
  external: boolean;
  /** หัวคอลัมน์ยอด */
  amountLabel: string;
  /** ปุ่มท้ายแถว (+ รับเข้า / สั่งจ่าย / รับคืน) — ไม่มีก็ไม่มีปุ่ม เช่น ประวัติ */
  href?: string;
  /** เลขที่ใบเป็นลิงก์ไปหน้ารายละเอียด (ใช้ในประวัติ) */
  detailHref?: string;
  /** คอลัมน์เสริมก่อนคอลัมน์ยอด เช่น "ส่วนต่าง" ของรายการปรับปรุง (หน่วยเดียวกับยอด) */
  extra?: string[];
  items: WaitItem[];
};

const hash = (s: string) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 100000, 7);
export const pad = (n: number) => String(n).padStart(2, "0");

/** ทะเบียนรถคันที่สองขึ้นไป — ต่อจากคันแรกให้ดูเป็นรถชุดเดียวกัน */
export const truckOf = (first: string, i: number) =>
  i === 0 ? first : first.replace(/\d+$/, (n) => String(Number(n) + i * 111).padStart(n.length, "0"));

/** ทะเบียนรถตัวอย่างสำหรับใบที่ไม่ได้ใส่รถไว้ — คงที่ตามเลขใบ ไม่สุ่มใหม่ทุกครั้ง */
export const sampleTruck = (id: string) => `กค - ${String(1000 + (hash(id) % 9000)).padStart(4, "0")}`;

/**
 * ใบจริงมีได้หลายสินค้า แต่ข้อมูลตัวอย่างหนึ่งใบมีสินค้าเดียว
 * จึงยืมสินค้าจากใบอื่นในชุดเดียวกันมาเป็นรายการที่สอง — เลือกตามเลขใบ ได้ตัวเดิมทุกครั้ง
 */
export function companionOf<T extends { id: string; productName: string }>(
  list: readonly T[],
  d: T,
  ok: (x: T) => boolean = () => true
) {
  const pool = list.filter((x) => x.productName !== d.productName && ok(x));
  return pool.length ? pool[hash(d.id) % pool.length] : undefined;
}

/** ใบนี้กับสินค้าที่ยืมมา — หนึ่งแถวต่อสินค้า */
export const withCompanion = <T extends { id: string; productName: string }>(
  list: readonly T[],
  d: T,
  ok?: (x: T) => boolean
) => [d, companionOf(list, d, ok)].filter(Boolean) as T[];

const tagsOf = (d: { productType: string; group: string; packing?: string }) =>
  [d.productType, d.group, d.packing].filter(Boolean) as string[];

function fromInbound(d: GoodsInboundDoc): WaitDoc {
  const href = `/stock/goods/inbound/${d.id}`;
  if (d.source === "production") {
    return {
      id: d.id,
      kind: "production",
      code: d.code,
      createdAt: d.createdAt,
      status: "inboundProduction",
      statusLabel: "รอรับเข้าผลิต",
      external: false,
      amountLabel: "รอรับเข้า",
      href,
      items: [
        {
          key: d.id,
          productName: d.productName,
          // ใบผลิตขึ้นไลน์แทนประเภท (ตามแบบ: ไลน์ 1 | Bulk | 50 กก.)
          tags: [d.line, d.group, d.packing].filter(Boolean) as string[],
          ordered: d.orderQty !== undefined ? formatInboundQty(d.orderQty, d.unit) : undefined,
          produced: d.producedQty !== undefined ? formatInboundQty(d.producedQty, d.unit) : undefined,
          qty: formatInboundQty(d.qty, d.unit),
          unit: d.unit,
        },
      ],
    };
  }
  const lines = withCompanion(GOODS_INBOUND_DOCS, d, (x) => x.source !== "production");
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
    href,
    // หนึ่งแถวต่อสินค้าต่อทะเบียนรถ — แต่ละคันมีใบชั่งของตัวเอง
    items: lines.map((x, i) => ({
      key: `${d.id}-${i}`,
      productName: x.productName,
      tags: tagsOf(x),
      sub: `${d.code}-${pad(i + 1)}`,
      truck: truckOf(d.truck ?? "-", i),
      arriveDate: d.arriveDate,
      qty: formatInboundQty(x.qty, x.unit),
      unit: x.unit,
      weighed: i === 0,
    })),
  };
}

function fromIssue(d: GoodsIssueDoc): WaitDoc {
  const ret = isGoodsReturn(d.status);
  const external = d.status === "issueExternal" || d.status === "returnExternal";
  // สินค้าตัวที่สองมาจากใบชนิดเดียวกัน หน่วยและประเภทจะได้เข้ากัน
  const lines = withCompanion(GOODS_ISSUE_DOCS, d, (x) => x.status === d.status);
  // ใบคืนภายนอกในข้อมูลตัวอย่างไม่ได้ใส่รถไว้ — เติมให้คงที่ตามเลขใบ ไม่สุ่มใหม่ทุกครั้ง
  const firstTruck = d.truck && d.truck !== "-" ? d.truck : sampleTruck(d.id);
  const arrive = d.arriveDate && d.arriveDate !== "-" ? d.arriveDate : d.createdAt.split("|")[0].trim();
  return {
    id: d.id,
    kind: ret ? "return" : "issue",
    code: d.code,
    createdAt: d.createdAt,
    party: external ? d.customer : undefined,
    status: d.status,
    statusLabel: GOODS_ISSUE_STATUS_LABEL[d.status],
    external,
    amountLabel: ret ? "รอรับคืน" : "รอจ่ายออก",
    href: goodsDocHref(d),
    items: lines.map((x, i) => ({
      key: `${d.id}-${i}`,
      productName: x.productName,
      tags: tagsOf(x),
      sub: external ? `${d.code}-${pad(i + 1)}` : undefined,
      truck: external ? truckOf(firstTruck, i) : undefined,
      arriveDate: external ? arrive : undefined,
      qty: formatQty(Math.abs(x.qty), x.unit),
      unit: x.unit,
      weighed: external ? i === 0 : undefined,
    })),
  };
}

/** "1/16/2026 | 10:42:52" → เวลาเทียบกันได้ ใหม่สุดขึ้นก่อน */
export function stampOf(createdAt: string) {
  const [date, time = "00:00:00"] = createdAt.split("|").map((s) => s.trim());
  const [m, d, y] = date.split("/").map(Number);
  const [hh, mm, ss] = time.split(":").map(Number);
  return new Date(y, m - 1, d, hh, mm, ss).getTime();
}

/** ใบที่ยังค้างทั้งหมด ใหม่สุดขึ้นก่อน — คำนวณใหม่ทุกครั้ง เพราะใบที่ปิดแล้วต้องหลุดทันที */
export function waitingDocs(q: string): WaitDoc[] {
  const inbound = GOODS_INBOUND_DOCS.filter((d) => isGoodsInboundOpen(d) && matchesGoodsInbound(d, q)).map(
    fromInbound
  );
  const issue = GOODS_ISSUE_DOCS.filter((d) => isGoodsIssueOpen(d) && matchesGoodsIssue(d, q)).map(fromIssue);
  return [...inbound, ...issue].sort((a, b) => stampOf(b.createdAt) - stampOf(a.createdAt));
}
