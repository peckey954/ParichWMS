"use client";

import * as React from "react";
import { ListFilterIcon, PencilIcon, Trash2Icon, UploadIcon } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@peckey954/ui/components/ui/breadcrumb";
import { Button } from "@peckey954/ui/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@peckey954/ui/components/ui/dialog";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@peckey954/ui/components/ui/input-group";
import { SearchIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@peckey954/ui/components/ui/select";
import { Switch } from "@peckey954/ui/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@peckey954/ui/components/ui/table";
import { cn } from "@peckey954/ui/lib/utils";
import { toast } from "sonner";
import {
  AllSetupFilter,
  EMPTY_FILTER,
  isFilterEmpty,
  type AllFilter,
} from "@/components/pr/all-setup-filter";
import { EditDataDialog } from "@/components/pr/edit-data-dialog";
import { UploadDataDialog } from "@/components/pr/upload-data-dialog";
import { usePrSetup } from "@/components/pr/pr-setup-provider";
import { SetupFooter } from "@/components/pr/setup-footer";
import {
  COL_FIRST,
  COL_LAST,
  HEAD_FIRST,
  HEAD_LAST,
  paginate,
  STICKY_HEAD,
  TableFrame,
  TablePager,
} from "@/components/stock/doc-parts";

/* ------------------------------------------------------------------
   ตั้งค่าสินค้า — หน้าเดียวจบ

   ทุกช่องในตารางแก้ได้ตรงนั้นเลย ชื่อสินค้าเป็นช่องกรอก ส่วนหมวด/ประเภท/คลัง
   เป็นดรอปดาวน์ ไม่ต้องเปิดกล่องเพื่อแก้ของทีละตัว

   เหลือปุ่มบนหัวสองปุ่ม เพราะสองอันนี้เป็นงานคนละชนิดกับการแก้ในตาราง:
   - เพิ่ม/แก้ไขข้อมูล = แก้ "ตัวเลือก" ที่ดรอปดาวน์ในตารางมีให้เลือก
     (จะมีประเภทอะไรบ้าง หมวดอะไรบ้าง คลังอะไรบ้าง) และจัดสมาชิกทีเดียวเป็นชุด
   - อัปโหลดข้อมูล = ตั้งทั้งชุดจากไฟล์ในครั้งเดียว พร้อมปุ่มดาวน์โหลดตัวอย่างข้างใน

   คลังของสินค้าเป็นของตัวเอง ไม่ได้คำนวณจากประเภทแล้ว — ประเภทเป็นแค่ค่าตั้งต้น
   ตอนสร้าง/นำเข้า ของจริงมีข้อยกเว้นรายตัวที่กฎเดียวครอบไม่ได้ (ดู SetupProduct)

   ปิดใช้งานแทนลบ — ของที่มีใบขอซื้อเก่าอ้างถึงต้องไม่หายไปจากระบบ
------------------------------------------------------------------ */

const PAGE_SIZE = 20;
const NONE = "__none__";

export default function AllSetupPage() {
  const {
    setup,
    products,
    renameProduct,
    setProductCategory,
    setProductGroup,
    setProductWarehouse,
    setProductEnabled,
    removeProduct,
    reset,
    dirty,
  } = usePrSetup();

  const [query, setQuery] = React.useState("");
  const [filter, setFilter] = React.useState<AllFilter>(EMPTY_FILTER);
  const [filterOpen, setFilterOpen] = React.useState(false);
  const [page, setPage] = React.useState(1);

  // ดรอปดาวน์กรองสามอันบนแถบเครื่องมือเป็นทางลัดของตัวกรองชุดเดียวกัน
  // เลือกได้ทีละอันต่อช่อง ส่วนกล่องตัวกรองเลือกได้หลายอัน — ค่าอยู่ที่เดียวกันหมด
  const quick = (key: "warehouseIds" | "categoryIds" | "groupIds") =>
    filter[key].length === 1 ? filter[key][0] : NONE;
  const setQuick = (
    key: "warehouseIds" | "categoryIds" | "groupIds",
    v: string,
  ) => {
    setFilter((f) => ({ ...f, [key]: v === NONE ? [] : [v] }));
    setPage(1);
  };

  const catLabel = (id: string) =>
    setup.categories.find((c) => c.id === id)?.label ?? "";
  const groupLabel = (id: string) =>
    setup.groups.find((g) => g.id === id)?.label ?? "";
  const whLabel = (id: string) =>
    setup.warehouses.find((w) => w.id === id)?.label ?? "";

  const q = query.trim().toLowerCase();
  const rows = products.filter((p) => {
    if (q !== "") {
      const hay = `${p.name} ${catLabel(p.categoryId)} ${groupLabel(p.groupId)} ${whLabel(p.warehouseId)}`;
      if (!hay.toLowerCase().includes(q)) return false;
    }
    if (filter.categoryIds.length && !filter.categoryIds.includes(p.categoryId))
      return false;
    if (filter.groupIds.length && !filter.groupIds.includes(p.groupId))
      return false;
    if (filter.warehouseIds.length && !filter.warehouseIds.includes(p.warehouseId))
      return false;
    if (filter.status !== "all" && p.enabled !== (filter.status === "on"))
      return false;
    return true;
  });
  const { pages, safe, slice } = paginate(rows, page, PAGE_SIZE);

  // ของที่ปิดใช้งานยังโชว์ในตาราง แต่ต้องเลือกในใบขอซื้อใหม่ไม่ได้
  // ดรอปดาวน์ในตารางจึงเสนอเฉพาะตัวที่เปิดอยู่ ยกเว้นตัวที่แถวนี้ใช้อยู่แล้ว
  const optionsFor = <T extends { id: string; label: string; enabled: boolean }>(
    list: T[],
    current: string,
  ) => list.filter((x) => x.enabled || x.id === current);

  return (
    <>
      <main className="mx-auto w-full max-w-7xl px-4 pt-3 pb-24 sm:px-6 sm:pt-5">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">ระบบ</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/pr">ขอซื้อ PR</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-primary">ตั้งค่าสินค้า</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="mt-2 flex flex-wrap items-center justify-between gap-3 sm:mt-3">
          <h1 className="text-2xl font-semibold tracking-tight">ตั้งค่าสินค้า</h1>
          <div className="flex shrink-0 items-center gap-2">
            <EditDataDialog>
              <Button variant="outline-primary">
                <PencilIcon />
                เพิ่ม/แก้ไขข้อมูล
              </Button>
            </EditDataDialog>
            <UploadDataDialog onDone={() => setPage(1)}>
              <Button>
                <UploadIcon />
                อัปโหลดข้อมูล
              </Button>
            </UploadDataDialog>
          </div>
        </div>

        <div className="mt-4 grid gap-2 @3xl:grid-cols-[1fr_10rem_10rem_10rem_auto] @3xl:items-center">
          <InputGroup className="bg-card">
            <InputGroupAddon align="inline-start">
              <SearchIcon />
            </InputGroupAddon>
            <InputGroupInput
              aria-label="ค้นหา"
              placeholder="ค้นหา..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
            />
          </InputGroup>

          <QuickFilter
            label="คลัง"
            value={quick("warehouseIds")}
            options={setup.warehouses}
            onChange={(v) => setQuick("warehouseIds", v)}
          />
          <QuickFilter
            label="ประเภท"
            value={quick("categoryIds")}
            options={setup.categories}
            onChange={(v) => setQuick("categoryIds", v)}
          />
          <QuickFilter
            label="หมวด"
            value={quick("groupIds")}
            options={setup.groups}
            onChange={(v) => setQuick("groupIds", v)}
          />

          <Dialog open={filterOpen} onOpenChange={setFilterOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline-primary"
                size="icon"
                aria-label="ตัวกรองเพิ่มเติม"
                className="relative justify-self-start @3xl:justify-self-auto"
              >
                <ListFilterIcon />
                {/* จุดบอกว่ามีอะไรถูกกรองไว้ ไม่บอกว่ากี่อย่าง */}
                {!isFilterEmpty(filter) && (
                  <span className="absolute top-1 right-1 size-2 rounded-full bg-primary" />
                )}
              </Button>
            </DialogTrigger>
            <DialogContent aria-describedby={undefined} className="sm:max-w-md">
              <DialogHeader className="text-left">
                <DialogTitle>ตัวกรอง</DialogTitle>
              </DialogHeader>
              <AllSetupFilter
                value={filter}
                onApply={(next) => {
                  setFilter(next);
                  setPage(1);
                  setFilterOpen(false);
                }}
              />
            </DialogContent>
          </Dialog>
        </div>

        <p className="mt-2 text-sm text-muted-foreground">
          {q === "" && isFilterEmpty(filter)
            ? `${products.length} รายการ`
            : `${rows.length} จาก ${products.length} รายการ`}
          {products.some((p) => !p.enabled) &&
            ` · ปิดใช้งาน ${products.filter((p) => !p.enabled).length} รายการ`}
        </p>

        <div className="mt-2">
          {rows.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border px-4 py-12 text-center text-sm text-muted-foreground">
              {products.length === 0
                ? "ยังไม่มีสินค้า — กดอัปโหลดข้อมูลเพื่อตั้งทั้งชุดในครั้งเดียว"
                : "ไม่พบสินค้าที่ตรงกับที่ค้นหรือกรองไว้"}
            </p>
          ) : (
            <TableFrame>
              <Table>
                <TableHeader className={STICKY_HEAD}>
                  <TableRow>
                    <TableHead className={cn(HEAD_FIRST, "min-w-56")}>สินค้า</TableHead>
                    <TableHead className="min-w-44">หมวด</TableHead>
                    <TableHead className="min-w-44">ประเภทสินค้า</TableHead>
                    <TableHead className="min-w-44">คลัง</TableHead>
                    <TableHead className={cn(HEAD_LAST, "min-w-44")}>
                      การใช้งาน
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {slice.map((p) => (
                    <TableRow key={p.id} className={cn(!p.enabled && "opacity-60")}>
                      <TableCell className={COL_FIRST}>
                        <InputGroup className="bg-card">
                          <InputGroupInput
                            aria-label={`ชื่อของ ${p.name}`}
                            value={p.name}
                            placeholder="ตั้งชื่อสินค้า"
                            onChange={(e) => renameProduct(p.id, e.target.value)}
                          />
                        </InputGroup>
                        <span className="mt-1 block text-xs text-muted-foreground">
                          {p.unit}
                          {p.packing ? ` · ${p.packing}` : ""}
                        </span>
                      </TableCell>

                      <TableCell>
                        <CellSelect
                          label={`หมวดของ ${p.name}`}
                          placeholder="เลือกหมวด"
                          value={p.groupId}
                          options={optionsFor(setup.groups, p.groupId)}
                          onChange={(v) => setProductGroup(p.id, v)}
                        />
                      </TableCell>

                      <TableCell>
                        <CellSelect
                          label={`ประเภทของ ${p.name}`}
                          placeholder="เลือกประเภท"
                          value={p.categoryId}
                          options={optionsFor(setup.categories, p.categoryId)}
                          onChange={(v) => setProductCategory(p.id, v)}
                        />
                      </TableCell>

                      <TableCell>
                        <CellSelect
                          label={`คลังของ ${p.name}`}
                          placeholder="เลือกคลัง"
                          value={p.warehouseId}
                          options={optionsFor(setup.warehouses, p.warehouseId)}
                          onChange={(v) => setProductWarehouse(p.id, v)}
                        />
                      </TableCell>

                      <TableCell className={COL_LAST}>
                        <div className="flex items-center justify-between gap-3">
                          <label className="flex cursor-pointer items-center gap-2">
                            <Switch
                              checked={p.enabled}
                              onCheckedChange={(v) => setProductEnabled(p.id, v)}
                              aria-label={`การใช้งานของ ${p.name}`}
                            />
                            <span className="text-sm whitespace-nowrap">
                              {p.enabled ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                            </span>
                          </label>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`ลบ ${p.name}`}
                            className="shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => {
                              removeProduct(p.id);
                              toast.success("ลบสินค้าแล้ว", { description: p.name });
                            }}
                          >
                            <Trash2Icon />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <TablePager page={safe} pages={pages} onChange={setPage} />
            </TableFrame>
          )}
        </div>
      </main>

      <SetupFooter
        dirty={
          dirty.products || dirty.categories || dirty.groups || dirty.warehouses
        }
        onReset={() => {
          reset();
          setPage(1);
        }}
        onSave={() =>
          toast.success("บันทึกการตั้งค่าสินค้าแล้ว", {
            description: `${products.length} รายการ · ${setup.categories.length} ประเภท · ${setup.groups.length} หมวด · ${setup.warehouses.length} คลัง`,
          })
        }
      />
    </>
  );
}

/** ดรอปดาวน์กรองบนแถบเครื่องมือ — ชื่อชั้นข้อมูลเป็น placeholder ตามภาพ */
function QuickFilter({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { id: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger aria-label={`กรองตาม${label}`} className="w-full bg-card">
        <SelectValue placeholder={label} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NONE}>{label}ทั้งหมด</SelectItem>
        {options
          .filter((o) => o.label.trim() !== "")
          .map((o) => (
            <SelectItem key={o.id} value={o.id}>
              {o.label}
            </SelectItem>
          ))}
      </SelectContent>
    </Select>
  );
}

/** ช่องเลือกในตาราง — ค่าว่างต้องเห็นชัดว่ายังไม่ได้เลือก ไม่ใช่ช่องว่างเปล่า
 *  ที่แยกไม่ออกว่าไม่มีข้อมูลหรือระบบไม่ได้เรนเดอร์ */
function CellSelect({
  label,
  placeholder,
  value,
  options,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  options: { id: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <Select value={value || NONE} onValueChange={(v) => onChange(v === NONE ? "" : v)}>
      <SelectTrigger
        aria-label={label}
        className={cn("w-full bg-card", !value && "text-muted-foreground")}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NONE}>{placeholder}</SelectItem>
        {options
          .filter((o) => o.label.trim() !== "")
          .map((o) => (
            <SelectItem key={o.id} value={o.id}>
              {o.label}
            </SelectItem>
          ))}
      </SelectContent>
    </Select>
  );
}
