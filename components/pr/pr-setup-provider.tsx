"use client";

import * as React from "react";
import {
  DEFAULT_PR_SETUP,
  defaultProducts,
  appendChange,
  newCategoryId,
  newChangeId,
  newGroupId,
  newProductId,
  newWarehouseId,
  removeWarehouse,
  SETUP_ACTOR,
  SETUP_SLICE_LABEL,
  toggleCategoryWarehouse,
  type PrSetup,
  type SetupAction,
  type SetupChange,
  type SetupProduct,
} from "@/lib/pr-setup";

/**
 * ประเภทสินค้า + คลังปลายทางของใบขอซื้อ — ต้องข้ามหน้าได้
 *
 * หน้าตั้งค่า (/pr/setup) เป็นคนแก้ แต่คนที่เอาไปใช้คือฟอร์มสร้างใบขอซื้อ
 * (คนละ route กัน) ถ้าเก็บเป็น state ของหน้าตั้งค่าเอง ปรับเสร็จเดินออกจากหน้า
 * ค่าก็หายทันที หน้าตั้งค่าจะกลายเป็นหน้าที่กดแล้วไม่มีอะไรเกิดขึ้น — เหตุผล
 * เดียวกับ SafetyStockProvider/AddedRoundsProvider ที่ต้องอยู่ระดับ AppShell
 *
 * ไม่มี backend — ค่าอยู่ในหน่วยความจำของเซสชันนี้ รีเฟรชแล้วกลับเป็นค่าเริ่มต้น
 */
type PrSetupCtx = {
  setup: PrSetup;
  products: SetupProduct[];
  addProduct: (p: Omit<SetupProduct, "id">) => void;
  /** เพิ่มทีเดียวหลายรายการจากไฟล์ที่อัปโหลด — คืนจำนวนที่เพิ่มจริง */
  addProducts: (rows: Omit<SetupProduct, "id">[]) => number;
  setProductCategory: (id: string, categoryId: string) => void;
  setProductGroup: (id: string, groupId: string) => void;
  setProductWarehouse: (id: string, warehouseId: string) => void;
  renameProduct: (id: string, name: string) => void;
  /** เปิด/ปิดใช้งานของชั้นโครง — เหตุผลเดียวกับสินค้า คือลบไม่ได้เพราะมีเอกสารอ้างอยู่ */
  setEntityEnabled: (
    slice: "warehouses" | "categories" | "groups",
    id: string,
    on: boolean,
  ) => void;
  /** ตั้งสมาชิกของประเภท/หมวดทีเดียวทั้งชุดจากช่องเลือกหลายรายการ
   *  สินค้าที่หลุดออกจากชุดจะกลายเป็น "ไม่ระบุ" ไม่ใช่ค้างอยู่กับกลุ่มเดิมเงียบ ๆ */
  setMembers: (
    kind: "category" | "group",
    ownerId: string,
    productIds: string[],
  ) => void;
  /** ตั้งว่าคลังหนึ่งรับประเภทไหนบ้าง — อีกด้านของ toggleWarehouse */
  setWarehouseCategories: (warehouseId: string, categoryIds: string[]) => void;
  /** ปิดใช้งานแทนการลบ — ของที่มีเอกสารเก่าอ้างถึงต้องไม่หายไปจากระบบ */
  setProductEnabled: (id: string, on: boolean) => void;
  /** ย้ายสินค้าหลายตัวพร้อมกัน — ย้ายทีละตัวสิบกว่ารอบคือที่มาของการย้ายตกหล่น */
  moveProducts: (
    ids: string[],
    to: { categoryId?: string; groupId?: string },
  ) => void;
  /** ย้ายประเภททั้งกลุ่มไปอีกคลัง — ปลดคลังเดิมออกแล้วใส่คลังใหม่ให้ทุกตัวที่เลือก */
  moveCategoriesToWarehouse: (
    categoryIds: string[],
    fromWarehouseId: string,
    toWarehouseId: string,
  ) => void;
  removeProduct: (id: string) => void;
  /** จำนวนสินค้าที่สังกัดประเภทหนึ่ง — ใช้บอกผลกระทบก่อนกดลบประเภท */
  countProductsIn: (categoryId: string) => number;
  /** จำนวนสินค้าที่สังกัดหมวดหนึ่ง — ใช้บอกผลกระทบก่อนกดลบหมวด */
  countProductsInGroup: (groupId: string) => number;
  addGroup: () => void;
  renameGroup: (id: string, label: string) => void;
  deleteGroup: (id: string) => void;
  addCategory: () => void;
  renameCategory: (id: string, label: string) => void;
  deleteCategory: (id: string) => void;
  toggleWarehouse: (
    categoryId: string,
    warehouseId: string,
    on: boolean,
  ) => void;
  addWarehouse: () => void;
  renameWarehouse: (id: string, label: string) => void;
  deleteWarehouse: (id: string) => void;
  /** ไม่ระบุส่วน = คืนค่าเริ่มต้นทั้งหมด */
  reset: (slice?: SetupSlice) => void;
  dirty: Record<SetupSlice, boolean>;
  /** ประวัติการเปลี่ยนค่าตั้ง ใหม่สุดอยู่บนสุด */
  changes: SetupChange[];
};

/**
 * สี่ส่วนของการตั้งค่า แยกหน้ากันคนละ route และบันทึกแยกกัน
 *
 * ไม่ต้องบันทึกพร้อมกัน เพราะความผูกพันระหว่างสี่ส่วนอยู่ที่ "ตอนลบ" ไม่ใช่ตอนบันทึก
 * (ลบคลัง → ปลดออกจากทุกประเภท / ลบประเภทหรือหมวด → ปลดออกจากสินค้า) ซึ่งจัดการ
 * ในตัว operation เองแล้ว การแยกบันทึกยังทำให้เปลี่ยนชื่อคลังหนึ่งอันไม่ต้องส่ง
 * สินค้าเป็นร้อยรายการขึ้นไปทั้งกอง
 */
export type SetupSlice = "warehouses" | "categories" | "groups" | "products";

const Ctx = React.createContext<PrSetupCtx | null>(null);

export function PrSetupProvider({ children }: { children: React.ReactNode }) {
  const [setup, setSetup] = React.useState<PrSetup>(DEFAULT_PR_SETUP);
  const [products, setProducts] =
    React.useState<SetupProduct[]>(defaultProducts);
  const [changes, setChanges] = React.useState<SetupChange[]>([]);
  // ตัวนับสำหรับตั้งไอดีของใหม่ — ไม่ใช้ Date.now/Math.random เพราะฝั่งเซิร์ฟเวอร์
  // กับเบราว์เซอร์จะได้คนละค่าแล้ว hydration พัง
  const seq = React.useRef(0);

  /** บันทึกหนึ่งบรรทัดลงประวัติ — เรียกจากทุก action ที่เปลี่ยนค่าจริง
   *  Date.now() ตรงนี้ปลอดภัย เพราะรันตอนผู้ใช้กดเท่านั้น ไม่ใช่ตอน render แรก */
  const log = React.useCallback(
    (
      slice: SetupSlice,
      action: SetupAction,
      target: string,
      extra?: { from?: string; to?: string },
    ) => {
      seq.current += 1;
      setChanges((prev) =>
        appendChange(prev, {
          id: newChangeId(seq.current),
          at: Date.now(),
          actor: SETUP_ACTOR,
          slice,
          action,
          target: target || "(ยังไม่ได้ตั้งชื่อ)",
          ...extra,
        }),
      );
    },
    [],
  );

  const value = React.useMemo<PrSetupCtx>(
    () => ({
      setup,
      products,
      addProduct: (p) => {
        setProducts((prev) => [
          { ...p, id: newProductId(++seq.current) },
          ...prev,
        ]);
        log("products", "add", p.name);
      },
      addProducts: (rows) => {
        if (rows.length === 0) return 0;
        const added = rows.map((r) => ({
          ...r,
          id: newProductId(++seq.current),
        }));
        setProducts((prev) => [...added, ...prev]);
        log("products", "add", `อัปโหลดไฟล์ ${added.length} รายการ`);
        return added.length;
      },
      setProductCategory: (id, categoryId) => {
        const p = products.find((x) => x.id === id);
        const name = (cid: string) =>
          setup.categories.find((c) => c.id === cid)?.label ?? "ไม่ระบุประเภท";
        setProducts((prev) =>
          prev.map((x) => (x.id === id ? { ...x, categoryId } : x)),
        );
        // ย้ายประเภทของสินค้า = ย้ายคลังปลายทางของมันไปด้วย จึงต้องอยู่ในประวัติ
        log("products", "assign", p?.name ?? "", {
          from: name(p?.categoryId ?? ""),
          to: name(categoryId),
        });
      },
      setProductEnabled: (id, on) => {
        const p = products.find((x) => x.id === id);
        setProducts((prev) =>
          prev.map((x) => (x.id === id ? { ...x, enabled: on } : x)),
        );
        log("products", on ? "add" : "delete", p?.name ?? "", {
          to: on ? "เปิดใช้งาน" : "ปิดใช้งาน",
        });
      },
      moveProducts: (ids, to) => {
        if (ids.length === 0) return;
        setProducts((prev) =>
          prev.map((p) => (ids.includes(p.id) ? { ...p, ...to } : p)),
        );
        const label =
          to.categoryId !== undefined
            ? (setup.categories.find((c) => c.id === to.categoryId)?.label ??
              "ไม่ระบุประเภท")
            : (setup.groups.find((g) => g.id === to.groupId)?.label ??
              "ไม่ระบุหมวด");
        log(
          to.categoryId !== undefined ? "products" : "groups",
          "assign",
          `${ids.length} รายการ`,
          { to: label },
        );
      },
      moveCategoriesToWarehouse: (categoryIds, fromId, toId) => {
        if (categoryIds.length === 0 || fromId === toId) return;
        setSetup((s) => ({
          ...s,
          categories: s.categories.map((c) =>
            categoryIds.includes(c.id)
              ? {
                  ...c,
                  warehouseIds: [
                    ...c.warehouseIds.filter((id) => id !== fromId),
                    ...(c.warehouseIds.includes(toId) ? [] : [toId]),
                  ],
                }
              : c,
          ),
        }));
        const name = (id: string) =>
          setup.warehouses.find((w) => w.id === id)?.label ?? "?";
        log("categories", "route", `${categoryIds.length} ประเภท`, {
          from: name(fromId),
          to: name(toId),
        });
      },
      setProductWarehouse: (id, warehouseId) => {
        const p = products.find((x) => x.id === id);
        setProducts((prev) =>
          prev.map((x) => (x.id === id ? { ...x, warehouseId } : x)),
        );
        const name = (wid: string) =>
          setup.warehouses.find((w) => w.id === wid)?.label ?? "ไม่ระบุคลัง";
        log("products", "route", p?.name ?? "", {
          from: name(p?.warehouseId ?? ""),
          to: name(warehouseId),
        });
      },
      renameProduct: (id, name) => {
        const before = products.find((x) => x.id === id)?.name ?? "";
        setProducts((prev) =>
          prev.map((x) => (x.id === id ? { ...x, name } : x)),
        );
        log("products", "rename", id, { from: before, to: name });
      },
      setEntityEnabled: (slice, id, on) => {
        setSetup((s) => ({
          ...s,
          [slice]: s[slice].map((x) => (x.id === id ? { ...x, enabled: on } : x)),
        }));
        const label =
          setup[slice].find((x) => x.id === id)?.label ?? "";
        log(slice, on ? "add" : "delete", label, {
          to: on ? "เปิดใช้งาน" : "ปิดใช้งาน",
        });
      },
      setMembers: (kind, ownerId, productIds) => {
        const key = kind === "category" ? "categoryId" : "groupId";
        setProducts((prev) =>
          prev.map((p) => {
            const inNow = productIds.includes(p.id);
            const wasMine = p[key] === ownerId;
            if (inNow && !wasMine) return { ...p, [key]: ownerId };
            // ถูกเอาออกจากชุด — ต้องปลดออกจริง ไม่ใช่ปล่อยค้างไว้กับเจ้าของเดิม
            if (!inNow && wasMine) return { ...p, [key]: "" };
            return p;
          }),
        );
        const owner =
          kind === "category"
            ? setup.categories.find((c) => c.id === ownerId)?.label
            : setup.groups.find((g) => g.id === ownerId)?.label;
        log(
          kind === "category" ? "categories" : "groups",
          "assign",
          owner ?? "",
          { to: `${productIds.length} รายการ` },
        );
      },
      setWarehouseCategories: (warehouseId, categoryIds) => {
        setSetup((s) => ({
          ...s,
          categories: s.categories.map((c) => {
            const inNow = categoryIds.includes(c.id);
            const has = c.warehouseIds.includes(warehouseId);
            if (inNow && !has)
              return { ...c, warehouseIds: [...c.warehouseIds, warehouseId] };
            if (!inNow && has)
              return {
                ...c,
                warehouseIds: c.warehouseIds.filter((id) => id !== warehouseId),
              };
            return c;
          }),
        }));
        log(
          "warehouses",
          "route",
          setup.warehouses.find((w) => w.id === warehouseId)?.label ?? "",
          { to: `${categoryIds.length} ประเภท` },
        );
      },
      removeProduct: (id) => {
        log("products", "delete", products.find((p) => p.id === id)?.name ?? "");
        setProducts((prev) => prev.filter((p) => p.id !== id));
      },
      countProductsIn: (categoryId) =>
        products.filter((p) => p.categoryId === categoryId).length,
      countProductsInGroup: (groupId) =>
        products.filter((p) => p.groupId === groupId).length,
      setProductGroup: (id, groupId) => {
        const p = products.find((x) => x.id === id);
        const name = (gid: string) =>
          setup.groups.find((g) => g.id === gid)?.label ?? "ไม่ระบุหมวด";
        setProducts((prev) =>
          prev.map((x) => (x.id === id ? { ...x, groupId } : x)),
        );
        log("groups", "assign", p?.name ?? "", {
          from: name(p?.groupId ?? ""),
          to: name(groupId),
        });
      },
      addGroup: () => {
        setSetup((s) => ({
          ...s,
          groups: [
            ...s.groups,
            { id: newGroupId(++seq.current), label: "", builtIn: false, enabled: true },
          ],
        }));
        log("groups", "add", "หมวดใหม่");
      },
      renameGroup: (id, label) => {
        const before = setup.groups.find((g) => g.id === id)?.label ?? "";
        setSetup((s) => ({
          ...s,
          groups: s.groups.map((g) => (g.id === id ? { ...g, label } : g)),
        }));
        log("groups", "rename", id, { from: before, to: label });
      },
      deleteGroup: (id) => {
        log("groups", "delete", setup.groups.find((g) => g.id === id)?.label ?? "");
        setSetup((s) => ({ ...s, groups: s.groups.filter((g) => g.id !== id) }));
        // เหตุผลเดียวกับ deleteCategory — ห้ามปล่อยให้สินค้าถือ id ที่ไม่มีอยู่แล้ว
        // แต่ลบหมวดไม่กระทบเส้นทางเข้าคลัง เพราะหมวดไม่ได้ผูกกับคลัง
        setProducts((prev) =>
          prev.map((p) => (p.groupId === id ? { ...p, groupId: "" } : p)),
        );
      },
      addCategory: () => {
        setSetup((s) => ({
          ...s,
          categories: [
            ...s.categories,
            {
              id: newCategoryId(++seq.current),
              label: "",
              warehouseIds: [],
              builtIn: false,
              enabled: true,
            },
          ],
        }));
        log("categories", "add", "ประเภทใหม่");
      },
      renameCategory: (id, label) => {
        const before = setup.categories.find((c) => c.id === id)?.label ?? "";
        setSetup((s) => ({
          ...s,
          categories: s.categories.map((c) =>
            c.id === id ? { ...c, label } : c,
          ),
        }));
        log("categories", "rename", id, { from: before, to: label });
      },
      deleteCategory: (id) => {
        log(
          "categories",
          "delete",
          setup.categories.find((c) => c.id === id)?.label ?? "",
        );
        setSetup((s) => ({
          ...s,
          categories: s.categories.filter((c) => c.id !== id),
        }));
        // สินค้าที่สังกัดประเภทที่ถูกลบต้องกลายเป็น "ไม่ระบุประเภท" ไม่ใช่ถือ id
        // ที่ไม่มีอยู่แล้ว — ถ้าปล่อยค้าง ดรอปดาวน์ในแถวนั้นจะกลายเป็นช่องว่างที่
        // อธิบายไม่ได้ (Radix ไม่มี item ให้แสดง) และคลังปลายทางจะหายไปเงียบ ๆ
        // ไม่ลบตัวสินค้าทิ้ง — คนตั้งใจลบประเภท ไม่ได้ตั้งใจลบของ
        setProducts((prev) =>
          prev.map((p) => (p.categoryId === id ? { ...p, categoryId: "" } : p)),
        );
      },
      toggleWarehouse: (categoryId, warehouseId, on) => {
        setSetup((s) =>
          toggleCategoryWarehouse(s, categoryId, warehouseId, on),
        );
        // บรรทัดที่สำคัญที่สุดในประวัติทั้งหมด — เส้นทางเข้าคลังเปลี่ยนเมื่อไหร่
        // ของก็ไปโผล่คนละที่ทันที ต้องตอบได้ว่าใครสับสวิตช์นี้ตอนไหน
        const cat = setup.categories.find((c) => c.id === categoryId)?.label ?? "";
        const wh = setup.warehouses.find((w) => w.id === warehouseId)?.label ?? "";
        log("categories", "route", cat, {
          from: on ? undefined : wh,
          to: on ? wh : undefined,
        });
      },
      addWarehouse: () => {
        setSetup((s) => ({
          ...s,
          warehouses: [
            ...s.warehouses,
            { id: newWarehouseId(++seq.current), label: "", builtIn: false, enabled: true },
          ],
        }));
        log("warehouses", "add", "คลังใหม่");
      },
      renameWarehouse: (id, label) => {
        const before = setup.warehouses.find((w) => w.id === id)?.label ?? "";
        setSetup((s) => ({
          ...s,
          warehouses: s.warehouses.map((w) =>
            w.id === id ? { ...w, label } : w,
          ),
        }));
        log("warehouses", "rename", id, { from: before, to: label });
      },
      // สินค้าไม่ต้องแตะตอนลบคลัง — มันสังกัดประเภท ไม่ได้สังกัดคลัง
      // removeWarehouse ดึงคลังออกจากประเภทให้แล้ว ของเลยแค่ไม่มีปลายทางชั่วคราว
      deleteWarehouse: (id) => {
        log(
          "warehouses",
          "delete",
          setup.warehouses.find((w) => w.id === id)?.label ?? "",
        );
        setSetup((s) => removeWarehouse(s, id));
      },
      reset: (slice) => {
        log(slice ?? "categories", "reset", slice ? SETUP_SLICE_LABEL[slice] : "ทุกส่วน");
        if (!slice || slice === "warehouses") {
          setSetup((s) => ({ ...s, warehouses: DEFAULT_PR_SETUP.warehouses }));
        }
        if (!slice || slice === "categories") {
          setSetup((s) => ({ ...s, categories: DEFAULT_PR_SETUP.categories }));
        }
        if (!slice || slice === "groups") {
          setSetup((s) => ({ ...s, groups: DEFAULT_PR_SETUP.groups }));
        }
        if (!slice || slice === "products") setProducts(defaultProducts());
      },
      changes,
      dirty: {
        warehouses:
          JSON.stringify(setup.warehouses) !==
          JSON.stringify(DEFAULT_PR_SETUP.warehouses),
        categories:
          JSON.stringify(setup.categories) !==
          JSON.stringify(DEFAULT_PR_SETUP.categories),
        groups:
          JSON.stringify(setup.groups) !==
          JSON.stringify(DEFAULT_PR_SETUP.groups),
        products:
          JSON.stringify(products) !== JSON.stringify(defaultProducts()),
      },
    }),
    [setup, products, changes, log],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePrSetup() {
  const ctx = React.useContext(Ctx);
  if (!ctx) throw new Error("usePrSetup ต้องอยู่ใน PrSetupProvider");
  return ctx;
}
