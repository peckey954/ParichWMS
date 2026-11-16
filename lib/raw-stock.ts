// ============================================================
// สต็อกวัตถุดิบ — แท็บสต็อกกับประวัติ (Figma "- RM Stock ✏️" หน้า 3-28813)
//
// หน้าตาเหมือนสต็อกสินค้า (การ์ดสินค้า Lot เรียงตามสินค้า/ล็อค/FIFO) จึงใช้
// ชนิดข้อมูล Product/Lot/HistoryRow ชุดเดิม ต่างกันที่ของในคลัง:
//   - วัตถุดิบมีประเภทเดียวคือปุ๋ยจัมโบ้ คีเป็นปริมาณ (ตัน) ทศนิยม .00 เสมอ
//   - หนึ่ง Lot คือหนึ่งชิ้น (จัมโบ้หนึ่งใบ) เพราะรับเข้าต่อชิ้น ไม่ใช่ต่อสลิง
//     ย้ายจึงย้ายทั้ง Lot แบ่งไม่ได้ (Note ในแบบ) ปรับปรุงกรอกปริมาณจริงเป็นตัน
//   - เลข Lot ตามแบบ: เลขรายการใบสั่งซื้อ + รอบรับ + ลำดับชิ้น เช่น PO261110/01A-01-01
//     ของกวาดพื้นใช้เลข WT
//
// ข้อมูลจำลองล้วน ทุกค่าอิง seeded() ไม่มี Math.random
// ============================================================

import type { CategoryId, HistoryStatus, Lot, LotCondition, Product } from "./general-stock";
import type { GoodsHistoryRow } from "./goods-stock";

/** ประเภทของสต็อกวัตถุดิบ — ในแบบมีชิปเดียว */
export const RAW_CATEGORIES: { id: CategoryId; label: string }[] = [
  { id: "jumboFert", label: "ปุ๋ยจัมโบ้" },
];

const pad = (n: number) => String(n).padStart(2, "0");

function seeded(n: number) {
  let s = n * 9301 + 49297;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

const pick = <T,>(pool: T[], rnd: () => number) => pool[Math.floor(rnd() * pool.length)];

// ---------------------------------------------------------------
// วัตถุดิบในคลัง
// ---------------------------------------------------------------

export const RAW_ZONES = ["A-9M", "A-1", "A-2", "A-3", "A-4M", "B-1", "B-2"];

/** ชื่อ / หมวด / น้ำหนักบรรจุต่อถุงย่อย (กก.) — หมวด Bulk ไม่มีถุงย่อย */
const NAMES: { name: string; group: string; kg?: number }[] = [
  { name: "0-0-60 เม็ดแดง", group: "Bulk", kg: 50 },
  { name: "21-0-0 ผง สีน้ำตาล", group: "Bulk" },
  { name: "46-0-0 เม็ดโฟม", group: "Bulk", kg: 50 },
  { name: "21-0-0 ฟูเจียนผง", group: "Bulk", kg: 50 },
  { name: "18-46-0 DAP", group: "Bulk", kg: 50 },
  { name: "0-0-60 MOP ผง", group: "Bulk" },
  { name: "16-20-0 เม็ดปั้น", group: "PNR", kg: 50 },
  { name: "13-0-46 โพแทสเซียมไนเตรต", group: "PNR", kg: 25 },
  { name: "Filler ดินขาว", group: "Bulk" },
  { name: "Dolomite ผง", group: "Bulk", kg: 50 },
  { name: "Kieserite เม็ด", group: "PNR", kg: 25 },
];

/** สภาพของ Lot วนตามลำดับ — ส่วนใหญ่ผ่านปกติ (ไม่มีชิป) */
const CONDITIONS: (LotCondition | undefined)[] = [undefined, "repack", undefined, undefined, "accepted", undefined];

/** ตันต่อชิ้นของจัมโบ้ — ใบละครึ่งตันถึงหนึ่งตัน */
const TONS_PER_PIECE = [0.5, 0.5, 0.8, 1];

function makeProducts(): Product[] {
  return NAMES.map(({ name, group, kg }, i) => {
    const n = i + 1;
    const rnd = seeded(900 + n * 11);
    const tonsPerPiece = TONS_PER_PIECE[i % TONS_PER_PIECE.length];
    const lotCount = 2 + Math.floor(rnd() * 4);
    const po = `PO2611${pad(10 + (n % 18))}/${pad((n % 4) + 1)}A`;
    const lots: Lot[] = Array.from({ length: lotCount }, (_, j) => {
      const day = 10 + ((n * 3 + j * 5) % 18);
      const age = 20 + ((n * 7 + j * 11) % 40);
      // ทุกสินค้ามีกวาดพื้นได้หนึ่ง Lot ท้ายรายการ (บางสินค้า)
      const sweep = j === lotCount - 1 && n % 4 === 2;
      const pending: Lot["pending"] = {};
      const roll = (n + j) % 7;
      if (roll === 1) pending.inbound = 300;
      if (roll === 3) pending.issue = 300;
      if (roll === 5) pending.returning = 300;
      const each = kg ? `${tonsPerPiece} ตัน/ชิ้น (${kg} กก.)` : `${tonsPerPiece} ตัน/ชิ้น`;
      return {
        id: `rm${n}-l${j}`,
        zone: RAW_ZONES[(n + j * 2) % RAW_ZONES.length],
        code: sweep ? `WT2605${pad(day)}/${pad(j + 1)}` : `${po}-${pad(1 + Math.floor(j / 3))}-${pad((j % 3) + 1)}`,
        condition: sweep ? "sweep" : CONDITIONS[(n + j) % CONDITIONS.length],
        receivedAt: `5/${day}/2026`,
        ageDays: age,
        qty: tonsPerPiece,
        packNote: each,
        pieces: 1,
        kgPerPiece: tonsPerPiece * 1000,
        pending,
      };
    });
    return {
      id: `rm${n}`,
      name,
      sku: `RM-${pad(n)}`,
      category: "jumboFert" as CategoryId,
      packing: kg ? `${kg} กก.` : group,
      unit: "ตัน",
      low: false,
      lots,
    };
  });
}

export const RAW_PRODUCTS: Product[] = makeProducts();

/** หมวด (Bulk / PNR) ของวัตถุดิบ — ใช้เป็นแท็กและตัวกรอง */
export const rawGroupOf = (name: string) => NAMES.find((x) => x.name === name)?.group ?? "Bulk";

export const RAW_GROUPS = [...new Set(NAMES.map((x) => x.group))];
export const RAW_PACKINGS = [...new Set(RAW_PRODUCTS.map((p) => p.packing))];

export function countRaw(products: Product[]) {
  const out = {} as Record<CategoryId, number>;
  for (const c of RAW_CATEGORIES) out[c.id] = products.filter((p) => p.category === c.id).length;
  return out;
}

// ---------------------------------------------------------------
// ประวัติ — ชนิดแถวเดียวกับสต็อกสินค้า (มีประเภท/หมวด) แต่ไม่มีรับเข้าผลิต
// ---------------------------------------------------------------

const ACTOR = "อลิสา พรสุขสิริ";
const ACTORS = [ACTOR, "ธนกฤต ศรีบุญเรือง", "พิมพ์ชนก วงศ์อารีย์"];

const CYCLE: HistoryStatus[] = [
  "inbound",
  "issueInternal",
  "returnInternal",
  "move",
  "inbound",
  "issueExternal",
  "adjust",
  "returnExternal",
  "failed",
  "returnSweep",
];

const PREFIX: Record<HistoryStatus, string> = {
  inbound: "PO",
  issueInternal: "REQ",
  issueExternal: "PRI",
  returnInternal: "REQ",
  returnExternal: "RTN",
  returnSweep: "WT",
  move: "MV",
  adjust: "ADJ",
  failed: "REQ",
};

const NOTES = ["จัดพื้นที่ล็อตใหม่", "ของแตกเสียหายระหว่างจัดเก็บ", "นับสต็อกประจำเดือน", "ย้ายเข้าล็อคใกล้ประตู"];

function makeHistory(count = 40): GoodsHistoryRow[] {
  return Array.from({ length: count }, (_, i) => {
    const rnd = seeded(2100 + i);
    const p = RAW_PRODUCTS[(i * 5) % RAW_PRODUCTS.length];
    const lot = p.lots[i % p.lots.length];
    const status = CYCLE[i % CYCLE.length];
    const out = status.startsWith("issue");
    const failed = status === "failed";
    const lotAction = status === "move" || status === "adjust";
    // รับเข้า/จ่าย/คืนเป็นหลายชิ้น ย้าย/ปรับปรุงเป็นทีละ Lot (ชิ้นเดียว)
    const pieces = lotAction ? 1 : 2 + Math.floor(rnd() * 30);
    const tons = Math.round(pieces * lot.qty * 100) / 100;
    const adjustDiff = status === "adjust" ? (i % 2 ? -1 : 1) * Math.round((0.05 + rnd() * 0.2) * 100) / 100 : 0;
    const sign = out ? -1 : 1;
    const day = 28 - (i % 20);
    const who = pick(ACTORS, rnd);
    const zone = lot.zone;
    return {
      id: `rh-${i + 1}`,
      code: `${PREFIX[status]}2606${pad(day)}/${pad((i % 9) + 1)}`,
      createdAt: `6/${day}/2026 | ${pad(8 + (i % 9))}:${pad((i * 7) % 60)}:${pad((i * 13) % 60)}`,
      lotNumber: failed ? undefined : lot.code,
      productName: p.name,
      productType: "ปุ๋ยจัมโบ้",
      group: rawGroupOf(p.name),
      packing: p.packing === "Bulk" || p.packing === "PNR" ? undefined : p.packing,
      askedCount: sign * pieces,
      doneCount: failed ? undefined : status === "adjust" ? 0 : sign * pieces,
      doneQty: failed ? undefined : status === "adjust" ? adjustDiff : sign * tons,
      unit: "ตัน",
      zone: failed ? undefined : zone,
      zoneTo: status === "move" ? RAW_ZONES.filter((z) => z !== zone)[i % 5] : undefined,
      note: lotAction ? pick(NOTES, rnd) : undefined,
      receiverNote: failed ? "สต็อกของหมด" : undefined,
      requester: who,
      actor: failed ? undefined : who,
      status,
    } satisfies GoodsHistoryRow;
  });
}

export const RAW_HISTORY: GoodsHistoryRow[] = makeHistory();
