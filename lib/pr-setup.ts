// ============================================================
// ตั้งค่าใบขอซื้อ — ประเภทสินค้า และคลังปลายทางของแต่ละประเภท
//
// ของที่ขอซื้อเข้ามาไม่ได้ไปกองรวมที่เดียว ปุ๋ยสำเร็จรูปเข้าสต็อกสินค้า
// แม่ปุ๋ยเข้าสต็อกวัตถุดิบ ส่วนกระสอบ/สติกเกอร์/ของใช้ในไลน์เข้าสต็อกทั่วไป
// หน้าตั้งค่านี้คือที่เดียวที่กำหนดว่าประเภทไหนไปคลังไหน และเพิ่ม/ลดได้ทั้งสองฝั่ง
//
// หนึ่งประเภทไปได้หลายคลัง — ของบางอย่างเก็บสองที่จริง เช่นกระสอบเปล่าที่ทั้ง
// สต็อกทั่วไปและสต็อกวัตถุดิบต่างก็ถือไว้ใช้เอง
// ============================================================

import { PR_CATEGORIES, PR_CATEGORY_LABEL, PR_PRODUCTS } from "@/lib/pr";

export type Warehouse = {
  id: string;
  label: string;
  /** คลังที่ระบบมีมาแต่แรก — ลบได้ แต่เตือนก่อนเพราะมีเอกสารอ้างถึงอยู่ */
  builtIn: boolean;
};

export const DEFAULT_WAREHOUSES: Warehouse[] = [
  { id: "stock-general", label: "สต็อกทั่วไป", builtIn: true },
  { id: "stock-raw", label: "สต็อกวัตถุดิบ", builtIn: true },
  { id: "stock-fg", label: "สต็อกสินค้า", builtIn: true },
];

export type PrCategorySetting = {
  id: string;
  label: string;
  /** คลังปลายทาง — ว่างได้ แต่หน้าตั้งค่าจะเตือน เพราะขอซื้อเข้ามาแล้วไม่รู้จะลงที่ไหน */
  warehouseIds: string[];
  /** ประเภทที่มากับระบบ มีสินค้าผูกอยู่แล้ว (ดู PR_PRODUCTS) — ที่เพิ่มเองยังไม่มีสินค้า */
  builtIn: boolean;
};

/** คลังปลายทางตั้งต้นของประเภทที่มากับระบบ */
const DEFAULT_ROUTING: Record<string, string[]> = {
  jumboFert: ["stock-fg"],
  sackFert: ["stock-raw"],
  sack: ["stock-general"],
  sticker: ["stock-general"],
  giveaway: ["stock-general"],
  lineSupply: ["stock-general"],
  oem: ["stock-fg"],
};

export const DEFAULT_PR_CATEGORIES: PrCategorySetting[] = PR_CATEGORIES.map(
  (id) => ({
    id,
    label: PR_CATEGORY_LABEL[id],
    warehouseIds: DEFAULT_ROUTING[id] ?? [],
    builtIn: true,
  }),
);

export type PrSetup = {
  categories: PrCategorySetting[];
  warehouses: Warehouse[];
};

export const DEFAULT_PR_SETUP: PrSetup = {
  categories: DEFAULT_PR_CATEGORIES,
  warehouses: DEFAULT_WAREHOUSES,
};

/** ไอดีใหม่จากตัวนับที่ส่งเข้ามา ไม่ใช่ Date.now/Math.random — สองตัวนั้นทำให้
 *  ฝั่งเซิร์ฟเวอร์กับเบราว์เซอร์ได้คนละค่า แล้ว hydration พัง */
export const newCategoryId = (seq: number) => `cat-${seq}`;
export const newWarehouseId = (seq: number) => `wh-${seq}`;

/** ลบคลังต้องดึงออกจากทุกประเภทที่อ้างถึงด้วย ไม่งั้นจะเหลือ id ค้างที่ชี้ไป
 *  คลังที่ไม่มีอยู่แล้ว ซึ่งมองจากหน้าจอไม่เห็นเลยว่าพัง */
export function removeWarehouse(setup: PrSetup, warehouseId: string): PrSetup {
  return {
    warehouses: setup.warehouses.filter((w) => w.id !== warehouseId),
    categories: setup.categories.map((c) => ({
      ...c,
      warehouseIds: c.warehouseIds.filter((id) => id !== warehouseId),
    })),
  };
}

export function toggleCategoryWarehouse(
  setup: PrSetup,
  categoryId: string,
  warehouseId: string,
  on: boolean,
): PrSetup {
  return {
    ...setup,
    categories: setup.categories.map((c) =>
      c.id !== categoryId
        ? c
        : {
            ...c,
            warehouseIds: on
              ? [...c.warehouseIds, warehouseId]
              : c.warehouseIds.filter((id) => id !== warehouseId),
          },
    ),
  };
}

/** ประเภทที่ยังไม่ได้เลือกคลัง — ขอซื้อเข้ามาแล้วไม่รู้จะลงคลังไหน */
export const categoriesWithoutWarehouse = (setup: PrSetup) =>
  setup.categories.filter((c) => c.warehouseIds.length === 0);

// ---------------------------------------------------------------
// สินค้า — เพิ่มทีละตัว หรืออัปโหลดทีเดียวทั้งไฟล์
// ---------------------------------------------------------------

/**
 * สินค้าไม่ผูกกับคลังโดยตรง — ผูกกับ "ประเภท" แล้วประเภทเป็นตัวบอกว่าเข้าคลังไหน
 * (ดู PrCategorySetting.warehouseIds) เส้นทางจึงมีที่ตั้งอยู่ที่เดียว ย้ายคลังของ
 * ประเภทหนึ่ง สินค้าทั้งกองในประเภทนั้นย้ายตามทันที ไม่ต้องไล่แก้ทีละตัว
 * และไม่มีทางเกิดสภาพสินค้าอยู่คลังที่ประเภทตัวเองไม่ได้ส่งไป
 */
export type SetupProduct = {
  id: string;
  name: string;
  /** ประเภทสินค้า อ้าง PrCategorySetting.id — ว่างได้ถ้าไฟล์ที่อัปมาไม่ได้ระบุ */
  categoryId: string;
  unit: string;
  packing?: string;
};

/** สินค้าตั้งต้น — เอาจาก PR_PRODUCTS ทั้งหมด */
export function defaultProducts(): SetupProduct[] {
  return PR_PRODUCTS.map((p) => ({
    id: p.id,
    name: p.sub ? `${p.name} ${p.sub}` : p.name,
    categoryId: p.category,
    unit: p.unit,
    packing: p.packingOptions[0],
  }));
}

/** คลังปลายทางของสินค้าตัวหนึ่ง — มาจากประเภทที่มันสังกัดอยู่ */
export function warehousesOfProduct(
  setup: PrSetup,
  categoryId: string,
): Warehouse[] {
  const cat = setup.categories.find((c) => c.id === categoryId);
  if (!cat) return [];
  return setup.warehouses.filter((w) => cat.warehouseIds.includes(w.id));
}

export const newProductId = (seq: number) => `wp-${seq}`;

// ---------------------------------------------------------------
// อ่านไฟล์ CSV
// ---------------------------------------------------------------

/**
 * แยกบรรทัด CSV เป็นช่อง — รองรับค่าที่ครอบด้วยเครื่องหมายคำพูด และมีจุลภาค
 * หรือขึ้นบรรทัดใหม่อยู่ข้างใน ("" คือคำพูดหนึ่งตัวตามมาตรฐาน CSV)
 *
 * เขียนเองแทนใช้ไลบรารี เพราะรูปแบบที่ต้องรับมีแค่นี้จริง ๆ และไม่อยากลง
 * dependency เพิ่มในโปรเจกต์ต้นแบบ
 */
export function parseCsv(text: string): string[][] {
  // ตัด BOM ที่ Excel ใส่มาหน้าไฟล์ ไม่ตัดแล้วหัวคอลัมน์แรกจะแมตช์ไม่ติด
  const src = text.replace(/^﻿/, "");
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          cell += '"';
          i++;
        } else quoted = false;
      } else cell += ch;
      continue;
    }
    if (ch === '"') quoted = true;
    else if (ch === "," || ch === "\t") {
      row.push(cell);
      cell = "";
    } else if (ch === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (ch !== "\r") cell += ch;
  }
  row.push(cell);
  rows.push(row);

  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

/** ชื่อหัวคอลัมน์ที่ยอมรับ — ไทยและอังกฤษ เพราะไฟล์ที่ส่งกันจริงมีทั้งสองแบบ */
const HEADER_ALIASES: Record<keyof CsvProductRow, string[]> = {
  name: ["ชื่อสินค้า", "สินค้า", "ชื่อ", "name", "product"],
  category: ["ประเภท", "ประเภทสินค้า", "category"],
  unit: ["หน่วย", "หน่วยนับ", "unit"],
  packing: ["บรรจุภัณฑ์", "บรรจุ", "packing", "package"],
};

type CsvProductRow = {
  name: string;
  category: string;
  unit: string;
  packing: string;
};

export type CsvImportResult = {
  rows: { name: string; categoryId: string; unit: string; packing?: string }[];
  /** แถวที่อ่านไม่ได้ พร้อมเหตุผล — ต้องบอกให้ครบ ไม่ใช่เงียบแล้วข้ามไป */
  skipped: { line: number; reason: string }[];
  /** ไม่เจอหัวคอลัมน์ที่จำเป็น = ทั้งไฟล์ใช้ไม่ได้ ไม่ใช่แค่บางแถว */
  fatal?: string;
};

/**
 * แปลงข้อความ CSV เป็นรายการสินค้าที่พร้อมเพิ่ม
 *
 * จับคู่ชื่อประเภทในไฟล์กับประเภทที่ตั้งไว้ในระบบ (เทียบแบบไม่สนตัวพิมพ์/ช่องว่าง)
 * ประเภทที่ไม่รู้จักไม่ทำให้ทั้งไฟล์ล้ม แต่จะถูกข้ามและรายงานกลับไป
 */
export function importProductsCsv(
  text: string,
  categories: PrCategorySetting[],
): CsvImportResult {
  const table = parseCsv(text);
  if (table.length < 2) {
    return {
      rows: [],
      skipped: [],
      fatal: "ไฟล์ว่าง หรือมีแต่หัวตารางไม่มีข้อมูล",
    };
  }

  const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, "");
  const header = table[0].map(norm);
  const indexOf = (field: keyof CsvProductRow) =>
    header.findIndex((h) => HEADER_ALIASES[field].some((a) => norm(a) === h));

  const iName = indexOf("name");
  const iCat = indexOf("category");
  const iUnit = indexOf("unit");
  const iPack = indexOf("packing");

  if (iName === -1) {
    return {
      rows: [],
      skipped: [],
      fatal:
        'ไม่พบคอลัมน์ "ชื่อสินค้า" — หัวตารางต้องมีอย่างน้อย ชื่อสินค้า, ประเภท, หน่วย',
    };
  }

  const byLabel = new Map(categories.map((c) => [norm(c.label), c.id]));
  const rows: CsvImportResult["rows"] = [];
  const skipped: CsvImportResult["skipped"] = [];

  table.slice(1).forEach((r, i) => {
    const line = i + 2; // +1 ข้ามหัวตาราง +1 ให้เลขบรรทัดเริ่มที่ 1 เหมือนที่คนเห็นในไฟล์
    const name = (r[iName] ?? "").trim();
    if (!name) {
      skipped.push({ line, reason: "ไม่มีชื่อสินค้า" });
      return;
    }
    const catRaw = iCat === -1 ? "" : (r[iCat] ?? "").trim();
    const categoryId = catRaw ? byLabel.get(norm(catRaw)) : undefined;
    if (catRaw && !categoryId) {
      skipped.push({ line, reason: `ไม่รู้จักประเภท "${catRaw}"` });
      return;
    }
    const unit = iUnit === -1 ? "" : (r[iUnit] ?? "").trim();
    if (!unit) {
      skipped.push({ line, reason: "ไม่มีหน่วยนับ" });
      return;
    }
    const packing = iPack === -1 ? "" : (r[iPack] ?? "").trim();
    rows.push({
      name,
      categoryId: categoryId ?? "",
      unit,
      packing: packing || undefined,
    });
  });

  return { rows, skipped };
}
