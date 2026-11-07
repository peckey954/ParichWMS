// ============================================================
// สต็อกสินค้า — แท็บสต็อกกับประวัติ (Figma "Tab 1 - Stock" โหนด 78-216371)
//
// หน้าตาเหมือนสต็อกทั่วไปทุกอย่าง (การ์ดสินค้า ล็อต ย้าย/ปรับปรุง เรียงตาม
// สินค้า/โซน/FIFO) ต่างกันแค่ของในคลัง: มีสามประเภทคือ สินค้าผลิต สินค้า OEM
// และปุ๋ยกระสอบ จึงใช้ชนิดข้อมูล Product/Lot/HistoryRow ชุดเดิม ชิ้นส่วนหน้าจอ
// ของสต็อกทั่วไปหยิบมาใช้ได้ตรง ๆ
//
// ประวัติของหน้านี้กดเข้าไปดูรายละเอียดได้ — แต่ละชนิดรายการมีหน้าของตัวเอง
// (ใบรับเข้าผลิต / ใบรับเข้าภายนอก / จ่ายสินค้า / รับคืนสินค้า) ส่วนย้ายกับ
// ปรับปรุงเป็นรายการเล็ก เปิดเป็นกล่องกลางจอทับรายการเดิมตามแบบ
//
// ข้อมูลจำลองล้วน ทุกค่าอิง seeded() ไม่มี Math.random
// ============================================================

import type {
  CategoryId,
  HistoryRow,
  HistoryStatus,
  Lot,
  LotCondition,
  Product,
} from "./general-stock";

/** ประเภทของสต็อกสินค้า เรียงตามชิปในแบบ */
export const GOODS_CATEGORIES: { id: CategoryId; label: string }[] = [
  { id: "produced", label: "สินค้าผลิต" },
  { id: "oem", label: "สินค้า OEM" },
  { id: "sackFert", label: "ปุ๋ยกระสอบ" },
];

const pad = (n: number) => String(n).padStart(2, "0");

function seeded(n: number) {
  let s = n * 9301 + 49297;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

const pick = <T,>(pool: T[], rnd: () => number) =>
  pool[Math.floor(rnd() * pool.length)];

// ---------------------------------------------------------------
// สินค้าในคลัง
// ---------------------------------------------------------------

export const GOODS_ZONES = ["A-9M", "A-1", "A-2", "A-3", "A-4M", "B-1"];

const NAMES: Record<string, string[]> = {
  produced: [
    "20-8-8 + 1Mg No Filler",
    "30-0-0 No Filler (No coat)",
    "15-10-30 + 0.1Mg + 0.2S",
    "วัตถุดิบไม่ระบุประเภท",
  ],
  oem: [
    "10-0-4+OM 50%",
    "8-24-24+0.5Mg+0.38 No filler",
    "16-16-8 OEM",
    "13-13-21 OEM",
  ],
  sackFert: [
    "46-0-0 ยูเรีย เม็ด",
    "16-20-0 เม็ดปั้น",
    "18-46-0 DAP",
    "0-0-60 MOP",
  ],
};

const PREFIX = ["PD", "FG", "WT"];
const CONDITIONS: (LotCondition | undefined)[] = [
  undefined,
  "repack",
  undefined,
  "sweep",
  undefined,
  "accepted",
];

function makeProducts(): Product[] {
  const out: Product[] = [];
  let n = 0;
  for (const cat of GOODS_CATEGORIES) {
    NAMES[cat.id].forEach((name, i) => {
      n += 1;
      const rnd = seeded(500 + n * 7);
      const bulk = name === "วัตถุดิบไม่ระบุประเภท" || i % 3 === 2;
      const kg = i % 2 === 0 ? 50 : 40;
      const lotCount = 2 + Math.floor(rnd() * 3);
      const lots: Lot[] = Array.from({ length: lotCount }, (_, j) => {
        const pieces = j === 0 && n % 3 === 1 ? 160 : 500 + Math.floor(rnd() * 6) * 100;
        const qty = Math.round((pieces * kg) / 1000);
        const day = 10 + ((n * 3 + j * 5) % 18);
        const age = 20 + ((n * 7 + j * 11) % 40);
        const pending: Lot["pending"] = {};
        const roll = (n + j) % 7;
        if (roll === 1) pending.inbound = 300;
        if (roll === 3) pending.issue = 300;
        if (roll === 5) pending.returning = 300;
        return {
          id: `gs${n}-l${j}`,
          zone: GOODS_ZONES[(n + j * 2) % GOODS_ZONES.length],
          code: `${name === "วัตถุดิบไม่ระบุประเภท" ? "WT" : PREFIX[(n + j) % 2]}2605${pad(day)}/${pad(j + 1)}`,
          condition: CONDITIONS[(n + j) % CONDITIONS.length],
          receivedAt: `5/${day}/2026`,
          ageDays: age,
          qty,
          packNote: bulk ? `${pieces} ชิ้น` : `${pieces} ชิ้น (${kg} กก.)`,
          pieces,
          kgPerPiece: kg,
          pending,
        };
      });
      out.push({
        id: `gs${n}`,
        name,
        sku: `FG-${pad(n)}`,
        category: cat.id,
        packing: bulk ? "Bulk" : `${kg} กก.`,
        unit: "ตัน",
        low: false,
        lots,
      });
    });
  }
  return out;
}

export const GOODS_PRODUCTS: Product[] = makeProducts();

export function countGoods(products: Product[]) {
  const out = {} as Record<CategoryId, number>;
  for (const c of GOODS_CATEGORIES) {
    out[c.id] = products.filter((p) => p.category === c.id).length;
  }
  return out;
}

const productByName = new Map(GOODS_PRODUCTS.map((p) => [p.name, p]));
const CAT_LABEL = Object.fromEntries(
  GOODS_CATEGORIES.map((c) => [c.id, c.label])
) as Record<CategoryId, string>;

// ---------------------------------------------------------------
// ประวัติ
// ---------------------------------------------------------------

/** แถวประวัติของสต็อกสินค้า — มีประเภท/หมวดเพิ่ม และแยกรับเข้าจากการผลิต */
export type GoodsHistoryRow = HistoryRow & {
  productType?: string;
  group?: string;
  /** รับเข้าจากไลน์ผลิต (PD) ต่างจากรับเข้าจากภายนอก (FG/PO) */
  source?: "production";
};

/** ป้ายสถานะตามแบบ — ไม่มีคำว่า "จาก" และแยก "รับเข้า (ผลิต)" ออกมา */
const LABEL: Record<HistoryStatus, string> = {
  returnInternal: "รับคืน (ภายใน)",
  returnExternal: "รับคืน (ภายนอก)",
  returnSweep: "รับคืน (กวาดพื้น)",
  inbound: "รับเข้า",
  issueInternal: "จ่ายออก (ภายใน)",
  issueExternal: "จ่ายออก (ภายนอก)",
  move: "ย้าย",
  adjust: "ปรับปรุง",
  failed: "ไม่สามารถจ่ายได้",
};

export function goodsHistoryStatus(r: GoodsHistoryRow) {
  if (r.status === "inbound" && r.source === "production") {
    return { key: "inboundProduction", label: "รับเข้า (ผลิต)" };
  }
  return { key: r.status, label: LABEL[r.status] };
}

/** ประเภท/หมวดของแถว — แถวที่เพิ่งเกิดจากกล่องย้าย/ปรับปรุงไม่มีติดมา หาจากชื่อสินค้า */
export function goodsRowType(r: GoodsHistoryRow) {
  const p = productByName.get(r.productName);
  return {
    productType: r.productType ?? (p ? CAT_LABEL[p.category] : "-"),
    group: r.group ?? "Bulk",
  };
}

/** ย้าย/ปรับปรุงเปิดหน้าย้าย/ปรับปรุง (history-docs) ที่เหลือเปิดหน้าใบของตัวเอง */
export const opensAsDialog = (r: HistoryRow) =>
  r.status === "move" || r.status === "adjust";

export const goodsHistoryHref = (r: HistoryRow) =>
  `/stock/goods/history/${r.id}`;

const ACTOR = "อลิสา พรสุขสิริ";
const ACTORS = [ACTOR, "ธนกฤต ศรีบุญเรือง", "พิมพ์ชนก วงศ์อารีย์"];
const AT = "1/16/2026 | 10:42:52";

/** สิบเอ็ดแถวแรกตามตารางในแบบ */
const SEED: GoodsHistoryRow[] = [
  { id: "gh-1", code: "REQ260705/01", createdAt: AT, productName: "10-0-4+OM 50%", productType: "สินค้า OEM", group: "Bulk", packing: "40 กก.", askedCount: 400, doneCount: 400, doneQty: 400, unit: "ตัน", zone: "A-9M", requester: ACTOR, actor: ACTOR, status: "returnInternal", lotNumber: "PD260512/04", note: "เหลือจากการผลิต", receiverNote: "นับได้น้อยกว่าจำนวนจริง" },
  { id: "gh-2", code: "REQ260705/02", createdAt: AT, productName: "10-0-4+OM 50%", productType: "ปุ๋ยกระสอบ", group: "Bulk", packing: "40 กก.", askedCount: 40, unit: "ตัน", requester: ACTOR, status: "failed", receiverNote: "สต็อกของหมด" },
  { id: "gh-3", code: "WT260705/01", createdAt: AT, productName: "วัตถุดิบไม่ระบุประเภท", productType: "สินค้าผลิต", group: "Bulk", askedCount: 300, doneCount: 300, unit: "ตัน", zone: "A-9M", requester: ACTOR, actor: ACTOR, status: "returnSweep", lotNumber: "WT260512/04" },
  { id: "gh-4", code: "REQ260705/03", createdAt: AT, productName: "10-0-4+OM 50%", productType: "ปุ๋ยกระสอบ", group: "Bulk", askedCount: 300, doneCount: 300, unit: "ตัน", zone: "A-9M", requester: ACTOR, actor: ACTOR, status: "returnExternal", lotNumber: "PD260514/04", note: "ลูกค้าคืนสินค้า" },
  { id: "gh-5", code: "MV260705/01", createdAt: AT, productName: "10-0-4+OM 50%", productType: "ปุ๋ยกระสอบ", group: "Bulk", packing: "40 กก.", askedCount: 10, doneCount: 10, doneQty: 10, unit: "ตัน", zone: "A-4M", zoneTo: "A-2", note: "จัดพื้นที่ล็อตใหม่", requester: ACTOR, actor: ACTOR, status: "move", lotNumber: "FG260514/04" },
  { id: "gh-6", code: "REQ260705/04", createdAt: AT, productName: "10-0-4+OM 50%", productType: "สินค้า OEM", group: "Bulk", packing: "40 กก.", askedCount: -10, doneCount: -10, doneQty: -400, unit: "ลิตร", zone: "A-9M", requester: ACTOR, actor: ACTOR, status: "issueInternal" },
  { id: "gh-7", code: "MV260705/02", createdAt: AT, productName: "10-0-4+OM 50%", productType: "สินค้า OEM", group: "Bulk", askedCount: 40, doneCount: 40, unit: "ตัน", zone: "A-4M", zoneTo: "A-2", note: "จัดพื้นที่ล็อตใหม่", requester: ACTOR, actor: ACTOR, status: "move", lotNumber: "PD260514/04" },
  { id: "gh-8", code: "ADJ260705/01", createdAt: AT, productName: "10-0-4+OM 50%", productType: "สินค้า OEM", group: "Bulk", packing: "40 กก.", askedCount: 5, doneCount: 5, doneQty: 10, unit: "ตัน", zone: "A-9M", note: "ของแตกเสียหายระหว่างจัดเก็บ", requester: ACTOR, actor: ACTOR, status: "adjust", lotNumber: "PD260514/04" },
  { id: "gh-9", code: "PD260115/01", createdAt: AT, productName: "8-24-24+0.5Mg+0.38 No filler", productType: "สินค้าผลิต", group: "Bulk", packing: "50 กก.", askedCount: 400, doneCount: 400, doneQty: 800, unit: "ตัน", zone: "A-9M", requester: ACTOR, actor: ACTOR, status: "inbound", source: "production" },
  { id: "gh-10", code: "PRI260114/02A", createdAt: AT, productName: "10-0-4+OM 50%", productType: "ปุ๋ยกระสอบ", group: "Bulk", packing: "50 กก.", askedCount: -50, doneCount: -50, doneQty: -300, unit: "ตัน", zone: "A-9M", requester: ACTOR, actor: ACTOR, status: "issueExternal" },
  { id: "gh-11", code: "PO260115/01A", createdAt: AT, productName: "10-0-4+OM 50%", productType: "ปุ๋ยกระสอบ", group: "Bulk", packing: "50 กก.", askedCount: 500, doneCount: 500, doneQty: 800, unit: "ตัน", zone: "A-9M", requester: ACTOR, actor: ACTOR, status: "inbound" },
];

const CYCLE: HistoryStatus[] = [
  "inbound",
  "issueExternal",
  "returnInternal",
  "move",
  "inbound",
  "issueInternal",
  "adjust",
  "returnExternal",
  "failed",
  "returnSweep",
];

const NOTES = [
  "จัดพื้นที่ล็อตใหม่",
  "ของแตกเสียหายระหว่างจัดเก็บ",
  "นับสต็อกประจำเดือน",
  "ย้ายเข้าโซนใกล้ประตู",
];

function moreHistory(count = 34): GoodsHistoryRow[] {
  return Array.from({ length: count }, (_, i) => {
    const rnd = seeded(1300 + i);
    const p = GOODS_PRODUCTS[(i * 5) % GOODS_PRODUCTS.length];
    const status = CYCLE[i % CYCLE.length];
    const production = status === "inbound" && i % 2 === 0;
    const out = status.startsWith("issue");
    const failed = status === "failed";
    const sign = out ? -1 : 1;
    const count = Math.round((10 + rnd() * 390) / 10) * 10;
    const kg = Number(p.packing.match(/\d+/)?.[0] ?? 50);
    const tons = Math.round((count * kg) / 10) / 100;
    const day = 28 - (i % 20);
    const who = pick(ACTORS, rnd);
    const zone = pick(GOODS_ZONES, rnd);
    const prefix =
      status === "inbound"
        ? production
          ? "PD"
          : "PO"
        : status === "move"
          ? "MV"
          : status === "adjust"
            ? "ADJ"
            : status === "returnSweep"
              ? "WT"
              : status === "issueExternal"
                ? "PRI"
                : "REQ";
    const adjustDiff = status === "adjust" ? (i % 2 ? -1 : 1) * (1 + Math.floor(rnd() * 9)) : 0;
    return {
      id: `gh-g${i + 1}`,
      code: `${prefix}2606${pad(day)}/${pad((i % 9) + 1)}`,
      createdAt: `6/${day}/2026 | ${pad(8 + (i % 9))}:${pad((i * 7) % 60)}:${pad((i * 13) % 60)}`,
      lotNumber: failed ? undefined : p.lots[i % p.lots.length].code,
      productName: p.name,
      productType: CAT_LABEL[p.category],
      group: "Bulk",
      packing: p.packing === "Bulk" ? undefined : p.packing,
      askedCount: sign * count,
      doneCount: failed ? undefined : status === "adjust" ? adjustDiff : sign * count,
      doneQty: failed ? undefined : status === "adjust" ? adjustDiff : sign * tons,
      unit: "ตัน",
      zone: failed ? undefined : zone,
      zoneTo:
        status === "move" ? GOODS_ZONES.filter((z) => z !== zone)[i % 5] : undefined,
      note:
        status === "move" || status === "adjust" ? pick(NOTES, rnd) : undefined,
      receiverNote: failed ? "สต็อกของหมด" : undefined,
      requester: who,
      actor: failed ? undefined : who,
      status,
      source: production ? "production" : undefined,
    } satisfies GoodsHistoryRow;
  });
}

export const GOODS_HISTORY: GoodsHistoryRow[] = [...SEED, ...moreHistory()];

export function matchesGoodsHistory(r: GoodsHistoryRow, q: string): boolean {
  const s = q.trim().toLowerCase();
  if (!s) return true;
  return [
    r.code,
    r.lotNumber ?? "",
    r.productName,
    r.productType ?? "",
    r.zone ?? "",
    r.requester,
    r.note ?? "",
  ].some((v) => v.toLowerCase().includes(s));
}

// ---------------------------------------------------------------
// รายละเอียดประวัติ — สร้างจากแถวเดิมเสมอ ตัวเลขในหน้ารายละเอียดจึงตรงกับ
// ตัวเลขในตาราง
// ---------------------------------------------------------------

export type HistoryLine = {
  id: string;
  code: string;
  at?: string;
  zone: string;
  receivedAt?: string;
  ageDays?: number;
  tons: number;
  pieces: number;
  container?: string;
  packing?: string;
};

const CUSTOMER = "บริษัท เอชซี อินเตอร์เนชั่นแนล เทรดดิ้ง จำกัด";

/** เวลาของแถวแยกเป็นวันที่ — ใช้กับช่องวันที่รถจะเข้า */
const dateOf = (at: string) => at.split(" | ")[0];

/** ตันกับชิ้นของแถว ไม่ติดลบ — หน้ารายละเอียดบอกทิศทางด้วยหัวข้ออยู่แล้ว */
function amounts(r: GoodsHistoryRow) {
  const pieces = Math.abs(r.doneCount ?? r.askedCount ?? 0);
  const tons = Math.abs(r.doneQty ?? r.doneCount ?? r.askedCount ?? 0);
  return { pieces, tons };
}

/** แบ่งยอดรวมเป็นหลายบรรทัด (สลิง/ล็อต) ให้ผลรวมตรงกับยอดเดิมพอดี */
function split(total: number, parts: number, decimals: number) {
  const f = 10 ** decimals;
  const each = Math.floor((total / parts) * f) / f;
  return Array.from({ length: parts }, (_, i) =>
    i === parts - 1 ? Math.round((total - each * (parts - 1)) * f) / f : each
  );
}

export function historyLines(r: GoodsHistoryRow, parts: number): HistoryLine[] {
  const rnd = seeded(hash(r.id));
  const { pieces, tons } = amounts(r);
  const t = split(tons, parts, 2);
  const p = split(pieces, parts, 0);
  // ป้าย Lot ตามแบบ เช่น PD260115/01A-06-01 — ไม่มีเลขล็อตติดมา ใช้เลขใบแทน
  const base = r.lotNumber ?? `PD${r.code.replace(/^[A-Z]+/, "")}`;
  return Array.from({ length: parts }, (_, i) => ({
    id: `${r.id}-${i}`,
    code:
      r.status === "inbound"
        ? `${r.code}-${pad(parts - i)}`
        : `${base}-06-${pad(i + 1)}`,
    at: r.createdAt,
    zone: i === 0 ? (r.zone ?? "A-9M") : pick(GOODS_ZONES, rnd),
    receivedAt: `5/${pad(10 + Math.floor(rnd() * 18))}/2026`,
    ageDays: 20 + Math.floor(rnd() * 40),
    tons: t[i],
    pieces: p[i],
    container: i === 0 ? "-" : `AB-${1000 + Math.floor(rnd() * 9000)}`,
    packing: r.packing ?? "Bulk",
  }));
}

/** ส่วนหัวของใบ — คนละชุดตามชนิดรายการ */
export function historyMeta(r: GoodsHistoryRow) {
  const rnd = seeded(hash(r.id) + 3);
  return {
    customer: CUSTOMER,
    truck: `กส - ${1000 + Math.floor(rnd() * 9000)}`,
    arriveDate: dateOf(r.createdAt),
    line: 1 + Math.floor(rnd() * 3),
    prNo: `PR2601${pad(1 + Math.floor(rnd() * 28))}/01`,
    uniqueId: Math.floor(rnd() * 0xfffffff).toString(16).padStart(7, "0"),
    cancelled: Math.floor(rnd() * 3),
  };
}

export const goodsHistoryOf = (id: string, rows: GoodsHistoryRow[]) =>
  rows.find((r) => r.id === id);

export const historyAmounts = amounts;
