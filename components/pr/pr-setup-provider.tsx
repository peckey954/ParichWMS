"use client";

import * as React from "react";
import {
  DEFAULT_PR_SETUP,
  defaultProducts,
  newCategoryId,
  newProductId,
  newWarehouseId,
  removeWarehouse,
  toggleCategoryWarehouse,
  type PrSetup,
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
  removeProduct: (id: string) => void;
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
  reset: () => void;
  dirty: boolean;
};

const Ctx = React.createContext<PrSetupCtx | null>(null);

export function PrSetupProvider({ children }: { children: React.ReactNode }) {
  const [setup, setSetup] = React.useState<PrSetup>(DEFAULT_PR_SETUP);
  const [products, setProducts] =
    React.useState<SetupProduct[]>(defaultProducts);
  // ตัวนับสำหรับตั้งไอดีของใหม่ — ไม่ใช้ Date.now/Math.random เพราะฝั่งเซิร์ฟเวอร์
  // กับเบราว์เซอร์จะได้คนละค่าแล้ว hydration พัง
  const seq = React.useRef(0);

  const value = React.useMemo<PrSetupCtx>(
    () => ({
      setup,
      products,
      addProduct: (p) =>
        setProducts((prev) => [
          { ...p, id: newProductId(++seq.current) },
          ...prev,
        ]),
      addProducts: (rows) => {
        if (rows.length === 0) return 0;
        const added = rows.map((r) => ({
          ...r,
          id: newProductId(++seq.current),
        }));
        setProducts((prev) => [...added, ...prev]);
        return added.length;
      },
      setProductCategory: (id, categoryId) =>
        setProducts((prev) =>
          prev.map((p) => (p.id === id ? { ...p, categoryId } : p)),
        ),
      removeProduct: (id) =>
        setProducts((prev) => prev.filter((p) => p.id !== id)),
      addCategory: () =>
        setSetup((s) => ({
          ...s,
          categories: [
            ...s.categories,
            {
              id: newCategoryId(++seq.current),
              label: "",
              warehouseIds: [],
              builtIn: false,
            },
          ],
        })),
      renameCategory: (id, label) =>
        setSetup((s) => ({
          ...s,
          categories: s.categories.map((c) =>
            c.id === id ? { ...c, label } : c,
          ),
        })),
      deleteCategory: (id) =>
        setSetup((s) => ({
          ...s,
          categories: s.categories.filter((c) => c.id !== id),
        })),
      toggleWarehouse: (categoryId, warehouseId, on) =>
        setSetup((s) =>
          toggleCategoryWarehouse(s, categoryId, warehouseId, on),
        ),
      addWarehouse: () =>
        setSetup((s) => ({
          ...s,
          warehouses: [
            ...s.warehouses,
            { id: newWarehouseId(++seq.current), label: "", builtIn: false },
          ],
        })),
      renameWarehouse: (id, label) =>
        setSetup((s) => ({
          ...s,
          warehouses: s.warehouses.map((w) =>
            w.id === id ? { ...w, label } : w,
          ),
        })),
      // สินค้าไม่ต้องแตะตอนลบคลัง — มันสังกัดประเภท ไม่ได้สังกัดคลัง
      // removeWarehouse ดึงคลังออกจากประเภทให้แล้ว ของเลยแค่ไม่มีปลายทางชั่วคราว
      deleteWarehouse: (id) => setSetup((s) => removeWarehouse(s, id)),
      reset: () => {
        setSetup(DEFAULT_PR_SETUP);
        setProducts(defaultProducts());
      },
      dirty:
        JSON.stringify(setup) !== JSON.stringify(DEFAULT_PR_SETUP) ||
        JSON.stringify(products) !== JSON.stringify(defaultProducts()),
    }),
    [setup, products],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePrSetup() {
  const ctx = React.useContext(Ctx);
  if (!ctx) throw new Error("usePrSetup ต้องอยู่ใน PrSetupProvider");
  return ctx;
}
