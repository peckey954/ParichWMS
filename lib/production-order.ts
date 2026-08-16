import type { OrderStatus } from "@/components/status-badge";

export type MaterialLine = {
  id: string;
  name: string;
  /** บรรทัดที่สองใต้ชื่อ เช่น แหล่งที่มา/ลักษณะ */
  sub?: string;
  suggestQty: number;
  suggestDigits: number;
  suggestUnit: string;
  lots: string[];
  lot: string;
  /** จำนวนคงเหลือในคลัง (นับเป็นชิ้น/กระสอบ) */
  stockQty: number;
  /** ตัน ต่อ 1 หน่วยนับ — null = สินค้านี้ไม่คิดเป็นตัน (เช่น สติกเกอร์) */
  tonPerUnit: number | null;
  /** จำนวนที่ใช้ (ผู้ใช้แก้ได้) */
  useQty: number;
  /** วัตถุดิบนี้เข้าข่ายต้องบันทึกปุ๋ยกวาดพื้นหรือไม่ */
  sweepable: boolean;
  /** ปริมาณกวาดพื้น (ตัน) */
  sweepTon: number;
};

export type ProductionOrder = {
  code: string;
  createdAt: string;
  status: OrderStatus;
  formula: string;
  packing: string;
  bagSize: string;
  line: string;
  round: string;
  orderedTon: number;
  plannedTon: number;
  requesterName: string;
  /** คนที่แก้ยอดสั่งผลิตล่าสุด ไม่มี = ใบนี้ยังไม่เคยถูกแก้ */
  editedBy?: string;
  actualTon: number;
  note: string;
  materials: MaterialLine[];
};

const LOTS = ["PO260116/01-04", "PO260116/05-08", "PO260117/01-02"];

export const SEED_ORDER: ProductionOrder = {
  code: "PD260116/01",
  createdAt: "2026-01-16T10:42:52",
  status: "waiting",
  formula: "8-24-24+0.5Mg+0.38 No filler",
  packing: "Bulk",
  bagSize: "50 Kg",
  line: "ไลน์ 1",
  round: "ปกติ",
  orderedTon: 800,
  plannedTon: 800,
  requesterName: "อลิสา พรสุขสิริ",
  actualTon: 800,
  note: "",
  materials: [
    {
      id: "m-21-0-0",
      name: "21-0-0",
      sub: "ฟูเจียน ผง",
      suggestQty: 20,
      suggestDigits: 2,
      suggestUnit: "ตัน",
      lots: LOTS,
      lot: LOTS[0],
      stockQty: 20,
      tonPerUnit: 0.8,
      useQty: 6,
      sweepable: true,
      sweepTon: 0,
    },
    {
      id: "m-sack",
      name: "กระสอบ",
      suggestQty: 20,
      suggestDigits: 0,
      suggestUnit: "กส",
      lots: LOTS,
      lot: LOTS[0],
      stockQty: 20,
      tonPerUnit: 0.8,
      useQty: 6,
      sweepable: false,
      sweepTon: 0,
    },
    {
      id: "m-sticker",
      name: "สติกเกอร์",
      suggestQty: 1000,
      suggestDigits: 0,
      suggestUnit: "ชิ้น",
      lots: LOTS,
      lot: LOTS[0],
      stockQty: 1000,
      tonPerUnit: null,
      useQty: 1000,
      sweepable: false,
      sweepTon: 0,
    },
  ],
};

/** ล็อตหนึ่งก้อนของวัตถุดิบที่เลือกเพิ่มได้ — ใช้เลือกได้หลายล็อตพร้อมกันในกล่องเพิ่มสินค้า */
export type LotOption = {
  code: string;
  /** โซนที่เก็บในคลัง เช่น A-9M */
  zone: string;
  /** วันที่รับเข้า แบบ ISO — แสดงผลผ่าน formatDate */
  receivedAt: string;
  ageDays: number;
  pieces: number;
  ton: number;
  /** เหลือน้อย — ตัวเลขในแถวขึ้นแดงเตือนก่อนเลือก */
  low?: boolean;
};

/** วัตถุดิบที่เลือกเพิ่มเข้าใบผลิตได้ จัดกลุ่มด้วยประเภทสินค้า */
export type AddableMaterial = {
  id: string;
  category: string;
  name: string;
  sub?: string;
  suggestQty: number;
  suggestDigits: number;
  suggestUnit: string;
  tonPerUnit: number | null;
  sweepable: boolean;
  lotOptions: LotOption[];
};

export const ADDABLE_MATERIALS: AddableMaterial[] = [
  {
    id: "m-46-0-0",
    category: "วัตถุดิบแม่ปุ๋ย",
    name: "46-0-0",
    sub: "ยูเรีย เม็ด",
    suggestQty: 12,
    suggestDigits: 2,
    suggestUnit: "ตัน",
    tonPerUnit: 0.5,
    sweepable: true,
    lotOptions: [
      {
        code: "PO260116/01-04",
        zone: "A-9M",
        receivedAt: "2026-05-14",
        ageDays: 44,
        pieces: 500,
        ton: 80,
      },
      {
        code: "PO260116/05-08",
        zone: "A-9M",
        receivedAt: "2026-05-14",
        ageDays: 44,
        pieces: 13,
        ton: 2,
        low: true,
      },
      {
        code: "PO260117/01-02",
        zone: "B-3L",
        receivedAt: "2026-05-20",
        ageDays: 38,
        pieces: 13,
        ton: 2,
        low: true,
      },
    ],
  },
  {
    id: "m-0-0-60",
    category: "วัตถุดิบแม่ปุ๋ย",
    name: "0-0-60",
    sub: "โพแทสเซียมคลอไรด์",
    suggestQty: 8,
    suggestDigits: 2,
    suggestUnit: "ตัน",
    tonPerUnit: 0.8,
    sweepable: true,
    lotOptions: [
      {
        code: "PO260115/02-05",
        zone: "A-4K",
        receivedAt: "2026-05-10",
        ageDays: 48,
        pieces: 31,
        ton: 25,
      },
      {
        code: "PO260115/06-07",
        zone: "A-4K",
        receivedAt: "2026-05-22",
        ageDays: 36,
        pieces: 5,
        ton: 4,
        low: true,
      },
    ],
  },
  {
    id: "m-thread",
    category: "วัสดุสิ้นเปลือง",
    name: "ด้ายเย็บกระสอบ",
    suggestQty: 2,
    suggestDigits: 0,
    suggestUnit: "ม้วน",
    tonPerUnit: null,
    sweepable: false,
    lotOptions: [
      {
        code: "PO260114/03-01",
        zone: "C-1S",
        receivedAt: "2026-04-28",
        ageDays: 60,
        pieces: 60,
        ton: 0,
      },
    ],
  },
];

/** ปริมาณที่ใช้ (ตัน) — null เมื่อสินค้านั้นไม่คิดเป็นตัน */
export function usedTon(m: MaterialLine): number | null {
  return m.tonPerUnit === null ? null : m.useQty * m.tonPerUnit;
}

/** ปริมาณคงเหลือในคลัง (ตัน) — null เมื่อสินค้านั้นไม่คิดเป็นตัน */
export function stockTon(m: MaterialLine): number | null {
  return m.tonPerUnit === null ? null : m.stockQty * m.tonPerUnit;
}
