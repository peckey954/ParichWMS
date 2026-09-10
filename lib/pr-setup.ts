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

import {
  PR_CATEGORIES,
  PR_CATEGORY_LABEL,
  PR_DOCS,
  PR_PRODUCTS,
  type PrStatus,
} from "@/lib/pr";

export type Warehouse = {
  id: string;
  label: string;
  /** คลังที่ระบบมีมาแต่แรก — ลบได้ แต่เตือนก่อนเพราะมีเอกสารอ้างถึงอยู่ */
  builtIn: boolean;
  /** ปิดใช้งานแทนลบ — เอกสารเก่าที่อ้างถึงยังอ่านได้ แต่เลือกในใบใหม่ไม่ได้ */
  enabled: boolean;
};

export const DEFAULT_WAREHOUSES: Warehouse[] = [
  { id: "stock-general", label: "สต็อกทั่วไป", builtIn: true, enabled: true },
  { id: "stock-raw", label: "สต็อกวัตถุดิบ", builtIn: true, enabled: true },
  { id: "stock-fg", label: "สต็อกสินค้า", builtIn: true, enabled: true },
];

export type PrCategorySetting = {
  id: string;
  label: string;
  /** คลังปลายทาง — ว่างได้ แต่หน้าตั้งค่าจะเตือน เพราะขอซื้อเข้ามาแล้วไม่รู้จะลงที่ไหน */
  warehouseIds: string[];
  /** ประเภทที่มากับระบบ มีสินค้าผูกอยู่แล้ว (ดู PR_PRODUCTS) — ที่เพิ่มเองยังไม่มีสินค้า */
  builtIn: boolean;
  enabled: boolean;
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
    enabled: true,
  }),
);

/**
 * หมวดสินค้า — แบ่งสินค้าตามสายผลิตภัณฑ์/แบรนด์ (PNR, แม่ปุ๋ย, Bio, ...)
 *
 * ต่างจากประเภทตรงที่ **หมวดผูกกับสินค้าอย่างเดียว ไม่เกี่ยวกับคลังเลย**
 * ประเภทเป็นตัวบอกว่าของเข้าคลังไหน ส่วนหมวดเป็นแค่การจัดกลุ่มไว้ดู/ค้น
 * สินค้าหนึ่งตัวจึงมีทั้งประเภทและหมวด และสองอันนี้ไม่ต้องสอดคล้องกัน
 */
export type ProductGroup = {
  id: string;
  label: string;
  /** หมวดที่มากับระบบ — มีสินค้าผูกอยู่แล้ว (ดู group ใน PR_PRODUCTS) */
  builtIn: boolean;
  enabled: boolean;
};

export const DEFAULT_GROUPS: ProductGroup[] = [
  { id: "grp-pnr", label: "PNR", builtIn: true , enabled: true },
  { id: "grp-mother", label: "แม่ปุ๋ย", builtIn: true , enabled: true },
  { id: "grp-bio", label: "Bio", builtIn: true , enabled: true },
  { id: "grp-bulk", label: "Bulk", builtIn: true , enabled: true },
  { id: "grp-compound", label: "Compound", builtIn: true , enabled: true },
  { id: "grp-pagro", label: "PAGRO", builtIn: true , enabled: true },
  { id: "grp-organic", label: "อินทรีย์เคมี", builtIn: true , enabled: true },
  // ไม่ได้อยู่ในรายการที่ส่งมา แต่ prod-7 ใช้อยู่จริง ถ้าไม่ใส่สินค้าตัวนั้น
  // จะเด้งเป็น "ไม่ระบุหมวด" ตั้งแต่เปิดหน้าครั้งแรกโดยไม่มีใครไปแตะ
  { id: "grp-label", label: "ฉลากสินค้า", builtIn: true , enabled: true },
];

export type PrSetup = {
  categories: PrCategorySetting[];
  warehouses: Warehouse[];
  groups: ProductGroup[];
};

export const DEFAULT_PR_SETUP: PrSetup = {
  categories: DEFAULT_PR_CATEGORIES,
  warehouses: DEFAULT_WAREHOUSES,
  groups: DEFAULT_GROUPS,
};

/** ไอดีใหม่จากตัวนับที่ส่งเข้ามา ไม่ใช่ Date.now/Math.random — สองตัวนั้นทำให้
 *  ฝั่งเซิร์ฟเวอร์กับเบราว์เซอร์ได้คนละค่า แล้ว hydration พัง */
export const newCategoryId = (seq: number) => `cat-${seq}`;
export const newWarehouseId = (seq: number) => `wh-${seq}`;
export const newGroupId = (seq: number) => `grp-${seq}`;

/** ลบคลังต้องดึงออกจากทุกประเภทที่อ้างถึงด้วย ไม่งั้นจะเหลือ id ค้างที่ชี้ไป
 *  คลังที่ไม่มีอยู่แล้ว ซึ่งมองจากหน้าจอไม่เห็นเลยว่าพัง */
export function removeWarehouse(setup: PrSetup, warehouseId: string): PrSetup {
  return {
    ...setup,
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
// ผลกระทบต่อเอกสารที่มีอยู่
//
// ค่าตั้งค่าไม่ได้ลอยอยู่เดี่ยว ๆ — ใบขอซื้อทุกใบชี้กลับมาที่ประเภทด้วย
// categoryId ก่อนแก้หรือลบจึงต้องตอบให้ได้ว่ากระทบใบไหนบ้าง ไม่ใช่เปลี่ยนเงียบ ๆ
// แล้วให้ไปเจอเองหน้างาน
//
// แยกนับ "ใบที่ยังเดินอยู่" กับ "ใบที่จบแล้ว" เพราะสองอย่างนี้ความหมายต่างกันมาก:
// ใบที่จบแล้วเป็นประวัติ เปลี่ยนอะไรก็ไม่กระทบใครแล้ว (และชื่อที่โชว์ก็ปักไว้ใน
// categoryLabel ตั้งแต่วันสร้าง) ส่วนใบที่ยังเดินอยู่คือของที่มีคนรออยู่จริง
// ---------------------------------------------------------------

/** ใบขอซื้อที่ยังไม่จบเส้นทาง — ยังมีคนรอของอยู่ */
const OPEN_PR_STATUS: PrStatus[] = ["sent", "ordered", "partial"];

export type CategoryImpact = {
  /** ใบที่ยังเดินอยู่ — กระทบคนที่รอของจริง */
  open: number;
  /** ใบที่เข้าคลังแล้วหรือถูกยกเลิก — เป็นประวัติ ไม่กระทบใครแล้ว */
  closed: number;
};

export function categoryImpact(categoryId: string): CategoryImpact {
  let open = 0;
  let closed = 0;
  for (const d of PR_DOCS) {
    if (d.categoryId !== categoryId) continue;
    if (OPEN_PR_STATUS.includes(d.status)) open += 1;
    else closed += 1;
  }
  return { open, closed };
}

/** สรุปผลกระทบเป็นข้อความไทยประโยคเดียว คืน null เมื่อไม่มีใบไหนใช้ประเภทนี้เลย */
export function describeCategoryImpact(impact: CategoryImpact): string | null {
  const { open, closed } = impact;
  if (open === 0 && closed === 0) return null;
  if (open === 0) return `มีใบขอซื้อที่จบแล้ว ${closed} ใบใช้ประเภทนี้อยู่`;
  if (closed === 0) return `มีใบขอซื้อที่ยังเดินอยู่ ${open} ใบใช้ประเภทนี้`;
  return `มีใบขอซื้อที่ยังเดินอยู่ ${open} ใบ และใบที่จบแล้วอีก ${closed} ใบใช้ประเภทนี้`;
}

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
  /** หมวดสินค้า อ้าง ProductGroup.id — ว่างได้ ไม่กระทบเส้นทางเข้าคลัง */
  groupId: string;
  /**
   * คลังของสินค้าตัวนี้เอง อ้าง Warehouse.id
   *
   * เดิมคลังคำนวณจากประเภทอย่างเดียว (ประเภทหนึ่งไปคลังไหน สินค้าก็ไปตาม)
   * แต่ของจริงมีข้อยกเว้นรายตัว — สินค้าตัวหนึ่งในประเภทเดียวกันอาจเก็บคนละที่
   * ตอนนี้จึงให้สินค้าถือคลังของตัวเอง แล้วใช้เส้นทางของประเภทเป็นค่าตั้งต้น
   * ตอนสร้าง/นำเข้า (ดู warehouseForCategory) ไม่ใช่เป็นตัวบังคับ
   */
  warehouseId: string;
  unit: string;
  packing?: string;
  /**
   * ปิดใช้งานแทนการลบ — สินค้าที่เคยมีใบขอซื้ออ้างถึงต้องไม่หายไปจากระบบ
   * ไม่งั้นเอกสารเก่าจะชี้ไปที่ว่าง ปิดแล้วแค่เลือกในใบใหม่ไม่ได้ ใบเก่ายังอ่านได้ปกติ
   */
  enabled: boolean;
};

/** สินค้าตั้งต้น — เอาจาก PR_PRODUCTS ทั้งหมด
 *  `group` ในข้อมูลเดิมเก็บเป็นชื่อหมวด ไม่ใช่ไอดี จึงต้องเทียบชื่อกลับมาเป็นไอดี */
export function defaultProducts(): SetupProduct[] {
  const idOfLabel = new Map(DEFAULT_GROUPS.map((g) => [g.label, g.id]));
  return PR_PRODUCTS.map((p) => ({
    id: p.id,
    name: p.sub ? `${p.name} ${p.sub}` : p.name,
    categoryId: p.category,
    groupId: idOfLabel.get(p.group) ?? "",
    warehouseId: DEFAULT_ROUTING[p.category]?.[0] ?? "",
    unit: p.unit,
    packing: p.packingOptions[0],
    enabled: true,
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

/** คลังตั้งต้นของสินค้าที่อยู่ประเภทหนึ่ง — คลังแรกที่ประเภทนั้นส่งของไป
 *  ใช้ตอนสร้าง/นำเข้าเท่านั้น หลังจากนั้นสินค้าถือคลังของตัวเองแล้วแก้ได้อิสระ */
export function warehouseForCategory(setup: PrSetup, categoryId: string): string {
  return setup.categories.find((c) => c.id === categoryId)?.warehouseIds[0] ?? "";
}

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
  group: ["หมวด", "หมวดสินค้า", "group", "brand"],
  warehouse: ["คลัง", "คลังปลายทาง", "warehouse", "store"],
  unit: ["หน่วย", "หน่วยนับ", "unit"],
  packing: ["บรรจุภัณฑ์", "บรรจุ", "packing", "package"],
};

type CsvProductRow = {
  name: string;
  category: string;
  group: string;
  warehouse: string;
  unit: string;
  packing: string;
};

export type CsvImportResult = {
  rows: {
    name: string;
    categoryId: string;
    groupId: string;
    unit: string;
    packing?: string;
  }[];
  /**
   * เส้นทางที่ไฟล์บอกมาและระบบยังไม่มี — ประเภทที่ยังไม่ได้เลือกคลังเลย
   * ไฟล์เดียวจึงตั้งโครงทั้งชุดได้ในครั้งเดียว ไม่ต้องไปตั้งคลังทีละหน้าก่อน
   * ประเภทที่ตั้งคลังไว้แล้วจะไม่ถูกเขียนทับ แต่จะรายงานไว้ใน routingConflicts
   */
  newRouting: { categoryId: string; categoryLabel: string; warehouseLabel: string; warehouseId: string }[];
  /** ไฟล์บอกคลังที่ต่างจากที่ตั้งไว้ — ไม่แก้ให้ แต่ต้องบอกว่าเห็นแล้วและไม่ได้ทำตาม */
  routingConflicts: { categoryLabel: string; fileWarehouse: string; current: string }[];
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
  groups: ProductGroup[],
  warehouses: Warehouse[] = [],
): CsvImportResult {
  const empty = { rows: [], skipped: [], newRouting: [], routingConflicts: [] };
  const table = parseCsv(text);
  if (table.length < 2) {
    return { ...empty, fatal: "ไฟล์ว่าง หรือมีแต่หัวตารางไม่มีข้อมูล" };
  }

  const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, "");
  const header = table[0].map(norm);
  const indexOf = (field: keyof CsvProductRow) =>
    header.findIndex((h) => HEADER_ALIASES[field].some((a) => norm(a) === h));

  const iName = indexOf("name");
  const iCat = indexOf("category");
  const iGroup = indexOf("group");
  const iWh = indexOf("warehouse");
  const iUnit = indexOf("unit");
  const iPack = indexOf("packing");

  if (iName === -1) {
    return {
      ...empty,
      fatal:
        'ไม่พบคอลัมน์ "ชื่อสินค้า" — หัวตารางต้องมีอย่างน้อย ชื่อสินค้า, ประเภท, หน่วย',
    };
  }

  const byLabel = new Map(categories.map((c) => [norm(c.label), c.id]));
  const groupByLabel = new Map(groups.map((g) => [norm(g.label), g.id]));
  const whByLabel = new Map(warehouses.map((w) => [norm(w.label), w]));
  const catById = new Map(categories.map((c) => [c.id, c]));
  const rows: CsvImportResult["rows"] = [];
  const skipped: CsvImportResult["skipped"] = [];
  const newRouting: CsvImportResult["newRouting"] = [];
  const routingConflicts: CsvImportResult["routingConflicts"] = [];
  const seenRouting = new Set<string>();

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
    // หมวดไม่บังคับ และไม่รู้จักก็ไม่ทิ้งทั้งแถว — มันไม่กระทบเส้นทางเข้าคลัง
    // ต่างจากประเภทที่ผิดแล้วของไม่รู้จะลงที่ไหน ปล่อยเป็นไม่ระบุหมวดแล้วมาเลือกทีหลังได้
    const groupRaw = iGroup === -1 ? "" : (r[iGroup] ?? "").trim();
    const groupId = groupRaw ? (groupByLabel.get(norm(groupRaw)) ?? "") : "";

    const unit = iUnit === -1 ? "" : (r[iUnit] ?? "").trim();
    if (!unit) {
      skipped.push({ line, reason: "ไม่มีหน่วยนับ" });
      return;
    }
    // คอลัมน์คลัง — ไม่ได้ผูกกับตัวสินค้า แต่ผูกกับประเภทของมัน
    // ไฟล์เดียวจึงตั้งได้ทั้งรายการสินค้าและเส้นทางเข้าคลัง ไม่ต้องไปตั้งทีละหน้าก่อน
    const whRaw = iWh === -1 ? "" : (r[iWh] ?? "").trim();
    if (whRaw && categoryId) {
      const cat = catById.get(categoryId);
      const wh = whByLabel.get(norm(whRaw));
      // กันรายงานซ้ำด้วยคู่ ประเภท+คลัง ไม่ใช่ประเภทอย่างเดียว — ไฟล์ที่บอกคลัง
      // ไม่ตรงกันเองระหว่างแถว ต้องรายงานให้ครบทุกคลังที่มันบอกมา ไม่ใช่เอาแถวแรกแล้วจบ
      const key = `${categoryId}|${wh?.id ?? whRaw}`;
      if (cat && wh && !seenRouting.has(key)) {
        seenRouting.add(key);
        if (cat.warehouseIds.length === 0) {
          // ประเภทเดียวกันแต่ไฟล์บอกหลายคลัง ตั้งให้เฉพาะคลังแรกที่เจอ
          // ที่เหลือรายงานเป็นข้อขัดแย้ง จะได้รู้ว่าไฟล์เองก็ไม่นิ่ง
          if (!newRouting.some((n) => n.categoryId === categoryId)) {
            newRouting.push({
              categoryId,
              categoryLabel: cat.label,
              warehouseId: wh.id,
              warehouseLabel: wh.label,
            });
          } else {
            routingConflicts.push({
              categoryLabel: cat.label,
              fileWarehouse: wh.label,
              current:
                newRouting.find((n) => n.categoryId === categoryId)
                  ?.warehouseLabel ?? "",
            });
          }
        } else if (!cat.warehouseIds.includes(wh.id)) {
          // ไม่เขียนทับของที่ตั้งไว้แล้ว การย้ายคลังกระทบใบขอซื้อที่ค้างอยู่
          // ต้องให้คนกดเองในหน้าตั้งค่า ไม่ใช่ไฟล์ที่อัปมาสั่งได้เงียบ ๆ
          routingConflicts.push({
            categoryLabel: cat.label,
            fileWarehouse: wh.label,
            current: cat.warehouseIds
              .map((id) => warehouses.find((w) => w.id === id)?.label ?? "?")
              .join(", "),
          });
        }
      }
    }

    const packing = iPack === -1 ? "" : (r[iPack] ?? "").trim();
    rows.push({
      name,
      categoryId: categoryId ?? "",
      groupId,
      unit,
      packing: packing || undefined,
    });
  });

  return { rows, skipped, newRouting, routingConflicts };
}

// ---------------------------------------------------------------
// ประวัติการเปลี่ยนแปลงค่าตั้งค่า
//
// ไม่ใช่ log เผื่อไว้ — วันที่ของไปโผล่ผิดคลัง คำถามแรกคือ "ใครเปลี่ยนเส้นทางนี้
// ตอนไหน" ถ้าไม่เก็บก็ตอบไม่ได้เลย และไม่มีทางรู้ว่าใบที่ค้างอยู่ตอนนั้นใช้ค่าไหน
//
// ต่างจาก HistoryRow ใน general-stock ที่เป็นการเคลื่อนไหวของ "ของ"
// อันนี้เป็นการเปลี่ยน "ค่าตั้ง" คนละเรื่องกัน จึงแยกกันคนละที่
// ---------------------------------------------------------------

export type SetupAction =
  | "add"
  | "rename"
  | "delete"
  | "assign"
  | "route"
  | "reset";

export const SETUP_ACTION_LABEL: Record<SetupAction, string> = {
  add: "เพิ่ม",
  rename: "เปลี่ยนชื่อ",
  delete: "ลบ",
  /** จัดสินค้าเข้าประเภทหรือหมวด */
  assign: "จัดเข้า",
  /** สับสวิตช์คลังปลายทางของประเภท — บรรทัดที่สำคัญที่สุดในประวัติ */
  route: "เปลี่ยนคลังปลายทาง",
  reset: "คืนค่าเริ่มต้น",
};

export const SETUP_SLICE_LABEL: Record<string, string> = {
  warehouses: "คลัง",
  categories: "ประเภทสินค้า",
  groups: "หมวดสินค้า",
  products: "สินค้า",
};

export type SetupChange = {
  id: string;
  /** เวลาที่กด — เก็บเป็น epoch ms ให้เรียงและจัดรูปแบบทีหลังได้
   *  ห้ามเรียก Date.now() ตอนสร้างค่าเริ่มต้นระดับโมดูล จะทำให้ SSR/CSR ไม่ตรงกัน
   *  ที่นี่ปลอดภัยเพราะค่าถูกสร้างตอนผู้ใช้กดเท่านั้น ซึ่งเกิดหลัง hydration แล้ว */
  at: number;
  actor: string;
  slice: string;
  action: SetupAction;
  /** ชื่อของสิ่งที่ถูกแก้ ณ ตอนนั้น */
  target: string;
  from?: string;
  to?: string;
};

/** ผู้ใช้ที่ล็อกอินอยู่ — ยังไม่มีระบบผู้ใช้จริง ตรึงไว้คนเดียวก่อน
 *  แต่ให้ log มีช่อง actor ตั้งแต่ต้น จะได้ไม่ต้องย้อนมาแก้โครงทีหลัง */
export const SETUP_ACTOR = "อลิสา พรสุขสิริ";

export const newChangeId = (seq: number) => `chg-${seq}`;

/** เวลาแบบเดียวกับที่เอกสารอื่นในแอปใช้ เช่น "8/9/2026 | 14:32:10" */
export function formatChangeTime(at: number): string {
  const d = new Date(at);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()} | ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/**
 * ต่อท้ายประวัติ แต่ยุบการเปลี่ยนชื่อรัว ๆ ให้เหลือรายการเดียว
 *
 * ช่องชื่อยิง onChange ทุกตัวอักษรที่พิมพ์ ถ้าเก็บดิบ ๆ พิมพ์ชื่อเดียวจะได้ log
 * สิบกว่าบรรทัดจนอ่านไม่ออก จึงเขียนทับรายการล่าสุดถ้าเป็นการเปลี่ยนชื่อของตัวเดิม
 * และถ้าพิมพ์ไปพิมพ์มาแล้วกลับมาเท่าเดิม ให้ถอดรายการนั้นทิ้งไปเลย ไม่ใช่บันทึก
 * ว่า "เปลี่ยนจาก ก เป็น ก"
 */
export function appendChange(
  log: SetupChange[],
  entry: SetupChange
): SetupChange[] {
  const last = log[0];
  if (
    entry.action === "rename" &&
    last?.action === "rename" &&
    last.slice === entry.slice &&
    last.target === entry.target
  ) {
    const merged = { ...last, at: entry.at, to: entry.to };
    const rest = log.slice(1);
    return merged.from === merged.to ? rest : [merged, ...rest];
  }
  if (entry.action === "rename" && entry.from === entry.to) return log;
  return [entry, ...log];
}
