// ============================================================
// ขอซื้อ PR — ใบขอซื้อสินค้า ต้นทางของสายการจัดซื้อ (PR → PO → รับเข้า)
//
// หนึ่งใบขอซื้อ = สินค้าตัวเดียว จำนวนเดียว ไม่มีหลายรายการรวมในใบเดียว
// ต่างจากใบรับเข้า/ใบชั่งที่มีหลายรอบ เพราะ PR คือ "คำขอ" ไม่ใช่เอกสารที่ต้อง
// ทยอยอัปเดตหลายครั้ง — สร้างครั้งเดียว จบ แล้วสถานะขยับไปตามขั้นถัดไปเอง
// (ส่งคำขอแล้ว → สั่งซื้อแล้ว → สินค้าทยอยเข้าแล้ว → สินค้าเข้าคลังแล้ว)
// หรือหลุดไป "ยกเลิก" ระหว่างทางก็ได้
// ============================================================

export type PrStatus = "sent" | "ordered" | "partial" | "stocked" | "cancelled";

export const PR_STATUS_LABEL: Record<PrStatus, string> = {
  sent: "ส่งคำขอแล้ว",
  ordered: "สั่งซื้อแล้ว",
  partial: "สินค้าทยอยเข้าแล้ว",
  stocked: "สินค้าเข้าคลังแล้ว",
  cancelled: "ยกเลิก",
};

export type PrReason = "produce" | "sell" | "other";

export const PR_REASON_LABEL: Record<PrReason, string> = {
  produce: "ผลิต",
  sell: "ขาย",
  other: "อื่นๆ",
};

export const PR_REASONS: PrReason[] = ["produce", "sell", "other"];

/* ------------------------------------------------------------------
   เส้นทางสถานะ — แสดงในหน้ารายละเอียดเป็นสี่ขั้นเรียงจากปลายทางไปต้นทาง
   (เข้าคลังแล้ว → ทยอยรับ → สั่งซื้อ → ส่งคำขอ) ขั้นที่ยังไปไม่ถึงใช้ป้ายกริยา
   ("สั่งซื้อสินค้า") ส่วนขั้นที่ถึงแล้วใช้ป้ายกริยาสมบูรณ์ ("สั่งซื้อแล้ว")
   — ยกเว้น "ทยอยรับสินค้า" กับ "รับสินค้าเข้าคลัง" ที่ใช้คำเดียวกันทั้งสอง
   สถานะ เพราะเป็นคำอธิบายขั้นตอนที่คลังใช้เรียกเหมือนกันไม่ว่าจะถึงหรือยัง
   ถ้ายกเลิกระหว่างทาง จะมาแทนที่ตำแหน่งขั้น "สั่งซื้อ" เสมอ (ยกเลิกได้ก็ต่อเมื่อ
   ยังไม่สั่งซื้อ — ดู PR_STATUS_LABEL.sent ที่เป็นขั้นเดียวที่แก้ไข/ยกเลิกได้)
------------------------------------------------------------------ */
export type PrTimelineStepId = "sent" | "ordered" | "partial" | "stocked";

export const PR_TIMELINE_PENDING_LABEL: Record<PrTimelineStepId, string> = {
  sent: "ส่งคำขอแล้ว",
  ordered: "สั่งซื้อสินค้า",
  partial: "ทยอยรับสินค้า",
  stocked: "รับสินค้าเข้าคลัง",
};

export const PR_TIMELINE_DONE_LABEL: Record<PrTimelineStepId, string> = {
  sent: "ส่งคำขอแล้ว",
  ordered: "สั่งซื้อแล้ว",
  partial: "ทยอยรับสินค้า",
  stocked: "รับสินค้าเข้าคลัง",
};

export type PrTimelineEntry = {
  step: PrTimelineStepId;
  actor: string;
  at: string;
  department: string;
};

export type PrCategoryId =
  | "jumboFert"
  | "sackFert"
  | "sack"
  | "sticker"
  | "giveaway"
  | "lineSupply"
  | "oem";

export const PR_CATEGORY_LABEL: Record<PrCategoryId, string> = {
  jumboFert: "วัตถุดิบปุ๋ยจัมโบ้",
  sackFert: "วัตถุดิบปุ๋ยกระสอบ",
  sack: "กระสอบ",
  sticker: "สติกเกอร์",
  giveaway: "ของแจกของแถม",
  lineSupply: "ของใช้ในไลน์ผลิต",
  oem: "สินค้าสำเร็จรูป OEM",
};

export const PR_CATEGORIES: PrCategoryId[] = [
  "jumboFert",
  "sackFert",
  "sack",
  "sticker",
  "giveaway",
  "lineSupply",
  "oem",
];

/** สินค้าที่ขอซื้อได้ — เลือกประเภทก่อนถึงเห็นตัวเลือกสินค้าในประเภทนั้น
 *  หมวด/บรรจุภัณฑ์/หน่วยผูกกับสินค้าแต่ละตัวไว้ เลือกสินค้าแล้วช่องพวกนี้เติมตามให้ */
export type PrProduct = {
  id: string;
  category: PrCategoryId;
  /** หมวดย่อยของสินค้า เช่น "แม่ปุ๋ย" "PNR" — โชว์ในตารางรายการ ไม่ใช่ตัวเลือกในฟอร์ม */
  group: string;
  name: string;
  sub?: string;
  packingOptions: string[];
  unit: string;
};

export const PR_PRODUCTS: PrProduct[] = [
  {
    id: "prod-1",
    category: "jumboFert",
    group: "PNR",
    name: "16-16-16",
    sub: "เม็ดคละ",
    packingOptions: ["1 ตัน", "500 กก."],
    unit: "ตัน",
  },
  {
    id: "prod-2",
    category: "jumboFert",
    group: "PNR",
    name: "21-0-0",
    sub: "จัมโบ้แดง",
    packingOptions: ["1 ตัน"],
    unit: "ตัน",
  },
  {
    id: "prod-3",
    category: "sackFert",
    group: "แม่ปุ๋ย",
    name: "21-0-0",
    sub: "ฟูเจียน ผง",
    packingOptions: ["50 Kg", "25 Kg"],
    unit: "ตัน",
  },
  {
    id: "prod-4",
    category: "sackFert",
    group: "แม่ปุ๋ย",
    name: "46-0-0",
    sub: "ยูเรีย เม็ด",
    packingOptions: ["50 Kg", "25 Kg"],
    unit: "ตัน",
  },
  {
    id: "prod-5",
    category: "sackFert",
    group: "อินทรีย์เคมี",
    name: "16-20-0",
    sub: "เม็ดปั้น",
    packingOptions: ["50 Kg"],
    unit: "ตัน",
  },
  {
    id: "prod-6",
    category: "sack",
    group: "แม่ปุ๋ย",
    name: "กระสอบเปล่า 50 kg",
    sub: "ลายเรือใบ",
    packingOptions: ["มัดละ 100"],
    unit: "ใบ",
  },
  {
    id: "prod-7",
    category: "sticker",
    group: "ฉลากสินค้า",
    name: "สติกเกอร์ QR",
    sub: "แบบม้วน",
    packingOptions: ["1,000 ดวง"],
    unit: "ชิ้น",
  },
  {
    id: "prod-8",
    category: "giveaway",
    group: "Compound",
    name: "เสื้อโปโลพนักงาน",
    sub: "ไซซ์ XL",
    packingOptions: ["-"],
    unit: "ตัว",
  },
  {
    id: "prod-9",
    category: "lineSupply",
    group: "PAGRO",
    name: "ถุงมือผ้าเคลือบยาง",
    sub: "ไซซ์ L",
    packingOptions: ["โหล"],
    unit: "คู่",
  },
  {
    id: "prod-10",
    category: "lineSupply",
    group: "PAGRO",
    name: "เทปพันสายพาน",
    sub: "หน้ากว้าง 2 นิ้ว",
    packingOptions: ["ม้วน"],
    unit: "ม้วน",
  },
  {
    id: "prod-11",
    category: "oem",
    group: "Compound",
    name: "16-20-0",
    sub: "เม็ดปั้น OEM",
    packingOptions: ["50 Kg", "25 Kg"],
    unit: "ตัน",
  },
  {
    id: "prod-12",
    category: "oem",
    group: "แม่ปุ๋ย",
    name: "10-0-4+OM 50%",
    sub: "ฟูเจียน ผง OEM",
    packingOptions: ["40 Kg"],
    unit: "ตัน",
  },
];

export const productsOf = (category: PrCategoryId) =>
  PR_PRODUCTS.filter((p) => p.category === category);

export type PrDoc = {
  id: string;
  code: string;
  createdAt: string;
  categoryId: PrCategoryId;
  group: string;
  productName: string;
  productSub?: string;
  packing?: string;
  qty: number;
  unit: string;
  reasons: PrReason[];
  /** วันที่ต้องการสินค้า — รูปแบบ dd/mm/yyyy (ปี ค.ศ. ตามที่ใช้ทั้งแอป) */
  neededDate: string;
  requester: string;
  /** มีค่าเฉพาะใบที่เคยถูกแก้ไขหลังสร้าง ไม่ใช่ทุกใบจะมี */
  editedBy?: string;
  status: PrStatus;
  /** ประวัติเฉพาะขั้นที่ถึงแล้ว เรียงเก่าสุดก่อน ใช้วาดเส้นทางสถานะ */
  timeline: PrTimelineEntry[];
  /** มีค่าเฉพาะใบที่ถูกยกเลิก */
  cancelReason?: string;
  cancelActor?: string;
  cancelAt?: string;
};

export function matchesPr(d: PrDoc, q: string): boolean {
  const s = q.trim().toLowerCase();
  if (!s) return true;
  return [
    d.code,
    d.productName,
    d.productSub ?? "",
    PR_CATEGORY_LABEL[d.categoryId],
    d.group,
    d.requester,
  ].some((v) => v.toLowerCase().includes(s));
}

export const formatPrQty = (v: number) =>
  v.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const formatReasons = (reasons: PrReason[]) =>
  reasons.map((r) => PR_REASON_LABEL[r]).join(", ");

/**
 * สุ่มแบบกำหนดเมล็ดไว้ ผลลัพธ์เหมือนเดิมทุกครั้ง
 * ห้ามใช้ Math.random เพราะฝั่งเซิร์ฟเวอร์กับเบราว์เซอร์จะได้คนละค่า แล้ว hydration พัง
 */
function seeded(n: number) {
  let s = n * 9301 + 49297;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

const pad = (n: number) => String(n).padStart(2, "0");
const pick = <T,>(pool: T[], rnd: () => number) => pool[Math.floor(rnd() * pool.length)];

const REQUESTER_POOL = [
  "อลิสา พรสุขสิริ",
  "ธนกฤต ศรีบุญเรือง",
  "พิมพ์ชนก วงศ์อารีย์",
  "ณัฐวุฒิ แก้วประเสริฐ",
  "สุชานาถ อินทร์ทอง",
  "กิตติพงศ์ ใจดีงาม",
];

function docStamp(seq: number, rnd: () => number) {
  const day = 18 - (seq % 14);
  return `1/${day}/2026 | ${pad(8 + (seq % 9))}:${pad(Math.floor(rnd() * 60))}:${pad(Math.floor(rnd() * 60))}`;
}

/** วันเวลาแบบเดียวกับที่ใช้ในเส้นทางสถานะ — dd/mm/yyyy - HH:MM:SS */
function timelineStamp(rnd: () => number) {
  return `${pad(1 + Math.floor(rnd() * 28))}/${pad(1 + Math.floor(rnd() * 12))}/2026 - ${pad(Math.floor(rnd() * 24))}:${pad(Math.floor(rnd() * 60))}:${pad(Math.floor(rnd() * 60))}`;
}

const PURCHASE_DEPT = "จัดซื้อ";
const WAREHOUSE_DEPT = "คลังสินค้า";

const CANCEL_REASON_POOL = [
  "เอกสารไม่ถูกต้อง",
  "ข้อมูลไม่ถูกต้อง",
  "เปลี่ยนแผนการสั่งซื้อ",
  "ซ้ำกับใบขอซื้ออื่น",
];

/**
 * สร้างเส้นทางสถานะให้ตรงกับ status — ยกเลิกได้เฉพาะช่วง "ส่งคำขอแล้ว"
 * เท่านั้น (ตรงกับกฎที่ว่าแก้ไข/ยกเลิกได้เฉพาะตอนยังไม่สั่งซื้อ) จึงมีแค่ขั้น
 * "ส่งคำขอแล้ว" ก่อนเปลี่ยนเป็นยกเลิกเสมอ ไม่มีกรณียกเลิกหลังสั่งซื้อไปแล้ว
 */
function buildTimeline(
  status: PrStatus,
  requester: string,
  rnd: () => number
): Pick<PrDoc, "timeline" | "cancelReason" | "cancelActor" | "cancelAt"> {
  const warehouseActor = pick(REQUESTER_POOL, rnd);
  const timeline: PrTimelineEntry[] = [
    { step: "sent", actor: requester, at: timelineStamp(rnd), department: PURCHASE_DEPT },
  ];

  if (status === "cancelled") {
    return {
      timeline,
      cancelReason: pick(CANCEL_REASON_POOL, rnd),
      cancelActor: requester,
      cancelAt: timelineStamp(rnd),
    };
  }

  if (status === "ordered" || status === "partial" || status === "stocked") {
    timeline.push({
      step: "ordered",
      actor: requester,
      at: timelineStamp(rnd),
      department: PURCHASE_DEPT,
    });
  }
  if (status === "partial" || status === "stocked") {
    timeline.push({
      step: "partial",
      actor: warehouseActor,
      at: timelineStamp(rnd),
      department: WAREHOUSE_DEPT,
    });
  }
  if (status === "stocked") {
    timeline.push({
      step: "stocked",
      actor: warehouseActor,
      at: timelineStamp(rnd),
      department: WAREHOUSE_DEPT,
    });
  }

  return { timeline };
}

/** สถานะวนตามรอบ 5 — ตารางตัวอย่างจึงมีครบทุกสถานะให้เห็นสีชิปครบชุด */
const STATUS_CYCLE: PrStatus[] = ["sent", "ordered", "partial", "stocked", "cancelled"];

function morePr(count = 30): PrDoc[] {
  return Array.from({ length: count }, (_, i) => {
    const rnd = seeded(900 + i);
    const product = pick(PR_PRODUCTS, rnd);
    const qty = Math.round((20 + rnd() * 980) / 10) * 10;
    const day = 18 - (i % 14);
    const status = STATUS_CYCLE[i % STATUS_CYCLE.length];
    const requester = pick(REQUESTER_POOL, rnd);
    // สุ่มเหตุผลอย่างน้อยหนึ่งอย่างเสมอ ไม่มีใบไหนไม่มีเหตุผลการซื้อ
    const reasons = PR_REASONS.filter(() => rnd() < 0.45);
    if (reasons.length === 0) reasons.push(pick(PR_REASONS, rnd));

    return {
      id: `pr-g${i + 1}`,
      code: `PRQ2601${pad(day)}/${pad((i % 9) + 1)}`,
      createdAt: docStamp(i, rnd),
      categoryId: product.category,
      group: product.group,
      productName: product.name,
      productSub: product.sub,
      packing: pick(product.packingOptions, rnd),
      qty,
      unit: product.unit,
      reasons,
      neededDate: `${pad(1 + Math.floor(rnd() * 28))}/${pad(1 + Math.floor(rnd() * 12))}/2026`,
      requester,
      editedBy: rnd() < 0.35 ? pick(REQUESTER_POOL, rnd) : undefined,
      status,
      ...buildTimeline(status, requester, rnd),
    } satisfies PrDoc;
  });
}

export const PR_DOCS: PrDoc[] = morePr();

export function getPrDoc(id: string): PrDoc | undefined {
  return PR_DOCS.find((d) => d.id === id);
}
