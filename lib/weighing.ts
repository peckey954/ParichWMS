// ============================================================
// ใบชั่งน้ำหนักรับสินค้าเข้า
//
// หนึ่งใบรับ = ซัพพลายเออร์รายเดียว สินค้าตัวเดียว แต่มีรถมาได้หลายคัน
// แต่ละคันชั่ง 2 รอบ: เข้ามาพร้อมของ แล้วชั่งอีกทีตอนรถเปล่า
// น้ำหนักสินค้าจริง = ชั่งเข้า − ชั่งออก
//
// เทียบยอดรวมของเรากับใบชั่งของซัพพลายเออร์
//   ได้มากกว่า = ของแถม · ได้น้อยกว่า = สูญหาย
// ============================================================

export type Attachment = {
  fileName: string;
  /** ขนาดเป็นไบต์ ใช้โชว์ให้รู้ว่าอัปโหลดสำเร็จจริง */
  size: number;
};

export type Truck = {
  id: string;
  plate: string;
  driverName: string;
  /** น้ำหนักรถบรรทุกพร้อมของ (กก.) */
  grossKg: number | null;
  grossAt: string;
  /** น้ำหนักรถบรรทุกเปล่า (กก.) */
  tareKg: number | null;
  tareAt: string;
  /** น้ำหนักที่ระบุในใบชั่งของซัพพลายเออร์ (กก.) */
  supplierKg: number | null;
  /** ใบชั่งของซัพพลายเออร์ที่สแกนอัปโหลด */
  supplierTicket: Attachment | null;
  /** สำเนาบัตรประชาชนคนขับ */
  driverIdCard: Attachment | null;
  note: string;
};

export type WeighingStatus = "draft" | "confirmed";

export type WeighingSheet = {
  id: string;
  code: string;
  status: WeighingStatus;
  poCode: string;
  supplierName: string;
  productName: string;
  receivedDate: string;
  warehouse: string;
  trucks: Truck[];
  note: string;
};

// ---------------------------------------------------------------
// ตัวช่วยคำนวณ
// ---------------------------------------------------------------

let seq = 0;
/** เรียกเฉพาะใน event handler เท่านั้น กัน hydration ไม่ตรง */
export const uid = (prefix: string) => `${prefix}-${++seq}`;

export function newTruck(): Truck {
  return {
    id: uid("truck"),
    plate: "",
    driverName: "",
    grossKg: null,
    grossAt: "",
    tareKg: null,
    tareAt: "",
    supplierKg: null,
    supplierTicket: null,
    driverIdCard: null,
    note: "",
  };
}

/** น้ำหนักสินค้าจริงของคันนี้ — null ถ้ายังชั่งไม่ครบสองรอบ */
export function netKg(t: Truck): number | null {
  if (t.grossKg === null || t.tareKg === null) return null;
  return t.grossKg - t.tareKg;
}

/** ชั่งออกต้องน้อยกว่าชั่งเข้าเสมอ ไม่งั้นแปลว่าคีย์สลับกัน */
export function isWeightInvalid(t: Truck): boolean {
  const n = netKg(t);
  return n !== null && n <= 0;
}

/** ส่วนต่างของคันนี้ = ของเรา − ของซัพพลายเออร์ */
export function truckDiffKg(t: Truck): number | null {
  const n = netKg(t);
  if (n === null || t.supplierKg === null) return null;
  return n - t.supplierKg;
}

export type DiffKind = "bonus" | "loss" | "even";

export function diffKind(diff: number | null): DiffKind | null {
  if (diff === null) return null;
  if (diff > 0) return "bonus";
  if (diff < 0) return "loss";
  return "even";
}

export const DIFF_LABEL: Record<DiffKind, string> = {
  bonus: "ของแถม",
  loss: "สูญหาย",
  even: "ตรงพอดี",
};

/** tone ของ Badge ตามชนิดส่วนต่าง */
export const DIFF_TONE: Record<DiffKind, "success" | "danger" | "neutral"> = {
  bonus: "success",
  loss: "danger",
  even: "neutral",
};

export type Totals = {
  parichKg: number;
  supplierKg: number;
  diffKg: number;
  diffPercent: number;
  /** คันที่ชั่งครบสองรอบและมีเลขใบชั่งซัพพลายเออร์แล้ว = เอามาเทียบกันได้ */
  comparableTrucks: number;
  /** คันที่ยังเทียบไม่ได้ เพราะชั่งไม่ครบหรือยังไม่ได้คีย์เลขของซัพพลายเออร์ */
  pendingTrucks: number;
  totalTrucks: number;
  /** คันที่แนบเอกสารครบทั้งสองอย่าง */
  docsComplete: number;
};

/**
 * ยอดรวมนับเฉพาะคันที่ "เทียบกันได้" คือชั่งครบสองรอบและมีเลขของซัพพลายเออร์
 * ถ้าเอาคันที่ยังชั่งไม่เสร็จมารวมด้วย ส่วนต่างจะดูเหมือนของหายมหาศาล
 * ทั้งที่แค่ยังชั่งรถเปล่าไม่เสร็จ
 */
export function computeTotals(trucks: Truck[]): Totals {
  let parichKg = 0;
  let supplierKg = 0;
  let comparableTrucks = 0;
  let docsComplete = 0;

  for (const t of trucks) {
    const n = netKg(t);
    if (n !== null && n > 0 && t.supplierKg !== null) {
      parichKg += n;
      supplierKg += t.supplierKg;
      comparableTrucks += 1;
    }
    if (t.supplierTicket && t.driverIdCard) docsComplete += 1;
  }

  const diffKg = parichKg - supplierKg;
  return {
    parichKg,
    supplierKg,
    diffKg,
    diffPercent: supplierKg > 0 ? (diffKg / supplierKg) * 100 : 0,
    comparableTrucks,
    pendingTrucks: trucks.length - comparableTrucks,
    totalTrucks: trucks.length,
    docsComplete,
  };
}

/** นับเอกสารที่แนบแล้วของคันนี้ (เต็ม 2) */
export function docCount(t: Truck): number {
  return (t.supplierTicket ? 1 : 0) + (t.driverIdCard ? 1 : 0);
}

export const formatKg = (v: number) =>
  v.toLocaleString("th-TH", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

/** ใส่เครื่องหมายบวกให้ค่าที่เป็นบวก เพื่อให้อ่านส่วนต่างได้ทันที */
export const formatSignedKg = (v: number) =>
  `${v > 0 ? "+" : ""}${formatKg(v)}`;

// ---------------------------------------------------------------
// ข้อมูลตั้งต้น
// ---------------------------------------------------------------

export const SEED_SHEET: WeighingSheet = {
  id: "wb-260809-01",
  code: "WB260809/01",
  status: "draft",
  poCode: "PO260805/012",
  supplierName: "บจก. ไทยเคมิคอล อะกริ",
  productName: "แม่ปุ๋ย 46-0-0 (ยูเรีย)",
  receivedDate: "2026-08-09",
  warehouse: "คลังวัตถุดิบ A",
  trucks: [
    {
      id: "truck-a",
      plate: "70-8891 ชลบุรี",
      driverName: "สมชาย ใจดี",
      grossKg: 32450,
      grossAt: "08:15",
      tareKg: 14980,
      tareAt: "09:40",
      supplierKg: 17400,
      supplierTicket: { fileName: "ticket-70-8891.pdf", size: 284_120 },
      driverIdCard: { fileName: "idcard-somchai.jpg", size: 512_400 },
      note: "",
    },
    {
      id: "truck-b",
      plate: "71-2043 ระยอง",
      driverName: "ประเสริฐ มั่นคง",
      grossKg: 31200,
      grossAt: "10:05",
      tareKg: 15100,
      tareAt: "11:20",
      supplierKg: 16250,
      supplierTicket: { fileName: "ticket-71-2043.pdf", size: 261_880 },
      driverIdCard: null,
      note: "รอสำเนาบัตรจากคนขับ",
    },
    {
      id: "truck-c",
      plate: "82-4417 ฉะเชิงเทรา",
      driverName: "วิรัตน์ แสงทอง",
      grossKg: 30890,
      grossAt: "13:30",
      tareKg: null,
      tareAt: "",
      supplierKg: 15900,
      supplierTicket: null,
      driverIdCard: null,
      note: "ยังไม่ได้ชั่งรถเปล่า",
    },
  ],
  note: "",
};
