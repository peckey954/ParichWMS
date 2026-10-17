"use client";

import * as React from "react";
import Link from "next/link";
import { SearchIcon, TriangleAlertIcon } from "lucide-react";
import { Badge } from "@peckey954/ui/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@peckey954/ui/components/ui/breadcrumb";
import { Button } from "@peckey954/ui/components/ui/button";
import { Checkbox } from "@peckey954/ui/components/ui/checkbox";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@peckey954/ui/components/ui/input-group";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@peckey954/ui/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@peckey954/ui/components/ui/tabs";
import { cn } from "@peckey954/ui/lib/utils";
import { toast } from "sonner";
import {
  ITEM_POOL,
  QC_DIRECTION_FIELD,
  hrefOf,
  isContested,
  itemQcOf,
  setItemQc,
  templatesOfItem,
  type QcDirection,
} from "@/lib/qc-erp";

/* ------------------------------------------------------------------
   สินค้าที่ต้องตรวจคุณภาพ — ติ๊กบังคับตรวจรายสินค้า

   ทำไมถึงเป็นหน้าของตัวเอง ไม่ใช่สวิตช์ในหน้าเทมเพลตเหมือนเดิม
   inspection_required_before_purchase / _before_delivery เป็นช่องของ Item
   ไม่ใช่ของ Quality Inspection Template พอให้ตั้งจากหน้าเทมเพลต มันกลายเป็น
   หลายฟอร์มเขียนช่องเดียวกัน และงานจริงคือ "กวาดดูทั้งคลังว่าตัวไหนบังคับบ้าง"
   ซึ่งทำจากในฟอร์มทีละใบไม่ได้เลย

   หน้านี้แก้ได้แค่สองติ๊กนั้น — เพิ่ม/ลบ/แก้ชื่อสินค้ายังอยู่ที่ทะเบียนสินค้า
   และ "ฟอร์มที่ใช้" เป็นอ่านอย่างเดียว เพราะเจ้าของช่องนั้นคือหน้าเทมเพลต
   หนึ่งช่องมีผู้เขียนที่เดียวเสมอ ไม่งั้นกลับไปทับกันเหมือนเดิม
------------------------------------------------------------------ */

type TabId = "all" | "on" | "off";

const TAB_LABEL: Record<TabId, string> = {
  all: "ทั้งหมด",
  on: "บังคับอยู่",
  off: "ยังไม่บังคับ",
};

const TAB_KEYS = Object.keys(TAB_LABEL) as TabId[];

/** อ่านสถานะของสินค้าหนึ่งตัวให้ครบในที่เดียว — ทั้งติ๊ก ฟอร์มที่ผูก และช่องโหว่ */
function readItem(item: string) {
  const qc = itemQcOf(item);
  const tpls = templatesOfItem(item);
  const wantsPurchase = tpls.some((t) => t.inspectionType === "incoming");
  const wantsDelivery = tpls.some((t) => t.inspectionType === "outgoing");
  return {
    item,
    qc,
    tpls,
    enforced: qc.beforePurchase || qc.beforeDelivery,
    // ผูกฟอร์มไว้แล้วแต่ไม่ได้ติ๊ก = ฟอร์มมีอยู่แต่ไม่มีอะไรบังคับให้ตรวจ
    // เป็นความพังที่เงียบที่สุดในชุดนี้ เพราะหน้าเทมเพลตดูแล้วเหมือนเสร็จ
    gap:
      (wantsPurchase && !qc.beforePurchase) ||
      (wantsDelivery && !qc.beforeDelivery),
  };
}

export default function QcItemsPage() {
  const [query, setQuery] = React.useState("");
  const [tab, setTab] = React.useState<TabId>("all");
  const [picked, setPicked] = React.useState<string[]>([]);
  // ITEM_QC อยู่ระดับโมดูลเหมือนของอื่นในหน้านี้ ต้องสั่งวาดใหม่เอง
  const [, bump] = React.useReducer((n: number) => n + 1, 0);

  const rows = ITEM_POOL.map(readItem);
  const q = query.trim().toLowerCase();
  const shown = rows.filter((r) => {
    if (q && !r.item.toLowerCase().includes(q)) return false;
    if (tab === "on") return r.enforced;
    if (tab === "off") return !r.enforced;
    return true;
  });

  const count: Record<TabId, number> = {
    all: rows.length,
    on: rows.filter((r) => r.enforced).length,
    off: rows.filter((r) => !r.enforced).length,
  };
  const gaps = rows.filter((r) => r.gap).length;

  const toggle = (item: string, dir: QcDirection, on: boolean) => {
    setItemQc(item, dir, on);
    bump();
  };

  /* ติ๊กทีละตัวในคลังที่มีสินค้าเป็นร้อยคือเหตุผลที่หน้านี้เกิดขึ้น
     เลือกหลายแถวแล้วสั่งทีเดียวจึงต้องมี ไม่ใช่ของแถม */
  const bulk = (dir: QcDirection, on: boolean) => {
    picked.forEach((i) => setItemQc(i, dir, on));
    bump();
    setPicked([]);
    toast.success(
      `${on ? "บังคับ" : "ยกเลิกบังคับ"}${
        dir === "purchase" ? "ตรวจก่อนรับเข้า" : "ตรวจก่อนส่งออก"
      } ${picked.length} รายการแล้ว`,
      { description: `เขียนที่ Item · ${QC_DIRECTION_FIELD[dir]}` }
    );
  };

  const allShownPicked =
    shown.length > 0 && shown.every((r) => picked.includes(r.item));

  return (
    <main className="@container mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">ระบบ</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/qc/setup-erp">ตั้งค่ารายงาน QC</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="text-primary">
              สินค้าที่ต้องตรวจ
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mt-4">
        <h1 className="text-2xl font-semibold tracking-tight">
          สินค้าที่ต้องตรวจคุณภาพ
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          ติ๊กว่าสินค้าตัวไหนต้องตรวจก่อนรับเข้าหรือก่อนส่งออก — เป็นตัวบังคับจริง
          ที่ทำให้ใบรับของและใบส่งของเดินต่อไม่ได้ถ้ายังไม่มีใบตรวจ
        </p>
      </div>

      {/* บอกตั้งแต่ต้นว่าค่านี้ไม่ได้อยู่ที่ฟอร์ม ไม่งั้นคนจะกลับไปหาในหน้าเทมเพลต
          และบอกว่าใครเป็นคนตัดสินว่า "ไม่ตรวจแล้วจะห้ามหรือแค่เตือน" */}
      <div className="mt-4 rounded-xl border border-border bg-card p-4 text-sm sm:p-5">
        <p>
          ติ๊กพวกนี้เก็บที่{" "}
          <span className="font-medium">ข้อมูลสินค้ารายตัว</span>{" "}
          ไม่ได้เก็บที่ฟอร์มตรวจ — สินค้าหนึ่งตัวมีค่าชุดเดียว ทุกฟอร์มที่ผูกตัวนั้นใช้ร่วมกัน
        </p>
        <p className="mt-2 text-muted-foreground">
          ส่วนที่ว่าไม่ตรวจแล้วจะ{" "}
          <span className="font-medium text-foreground">ห้ามผ่าน</span> หรือ{" "}
          <span className="font-medium text-foreground">แค่เตือน</span>{" "}
          เป็นค่าของทั้งระบบ ตั้งที่{" "}
          <Link
            href="/qc/setup-erp"
            className="font-medium text-primary underline underline-offset-2"
          >
            ตั้งค่ารายงาน QC › ตั้งค่าระบบ
          </Link>
        </p>
        <p className="mt-2 font-mono text-xs text-muted-foreground">
          Item · inspection_required_before_purchase ·
          inspection_required_before_delivery
        </p>
      </div>

      {/* ช่องโหว่ที่หน้าเทมเพลตมองไม่เห็น — ขึ้นเฉพาะตอนมีจริง ไม่ใช่แถบสรุปถาวร */}
      {gaps > 0 && (
        <p className="mt-3 flex items-start gap-2 rounded-lg border border-warning-border bg-warning px-4 py-3 text-sm">
          <TriangleAlertIcon className="mt-0.5 size-4 shrink-0 text-warning-strong" />
          <span>
            สินค้า {gaps} ตัวผูกฟอร์มตรวจไว้แล้วแต่ยังไม่ได้ติ๊กบังคับ —
            ฟอร์มจะไม่ถูกเรียกใช้ตอนรับหรือส่งของ
          </span>
        </p>
      )}

      <Tabs
        value={tab}
        onValueChange={(v) => setTab(v as TabId)}
        className="mt-5"
      >
        <TabsList className="w-full">
          {TAB_KEYS.map((k) => (
            <TabsTrigger key={k} value={k} className="flex-1">
              {TAB_LABEL[k]} ({count[k]})
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="mt-4">
        <InputGroup className="w-full max-w-sm bg-card">
          <InputGroupAddon align="inline-start">
            <SearchIcon />
          </InputGroupAddon>
          <InputGroupInput
            placeholder="ค้นหาชื่อสินค้า..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </InputGroup>
      </div>

      {/* แถบคำสั่งหมู่โผล่เมื่อเลือกแล้วเท่านั้น ไม่ใช่ปุ่มที่กดไม่ได้ค้างอยู่ตลอด */}
      {picked.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-primary bg-brand px-4 py-3">
          <span className="text-sm font-medium">
            เลือกไว้ {picked.length} รายการ
          </span>
          <div className="ms-auto flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline-primary"
              onClick={() => bulk("purchase", true)}
            >
              บังคับก่อนรับเข้า
            </Button>
            <Button
              size="sm"
              variant="outline-primary"
              onClick={() => bulk("delivery", true)}
            >
              บังคับก่อนส่งออก
            </Button>
            <Button size="sm" variant="outline" onClick={() => setPicked([])}>
              ล้างการเลือก
            </Button>
          </div>
        </div>
      )}

      {shown.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-border px-6 py-14 text-center">
          <p className="font-medium">ไม่พบสินค้าที่ค้นหา</p>
          <p className="mt-1 text-sm text-muted-foreground">
            ลองใช้คำค้นสั้นลง หรือดูที่แท็บทั้งหมด
          </p>
        </div>
      ) : (
        <>
          {/* จอแคบเป็นการ์ด — สองติ๊กกับชื่อฟอร์มบีบลงสี่คอลัมน์บนมือถือไม่ได้ */}
          <div className="mt-4 grid gap-3 @3xl:hidden">
            {shown.map((r) => (
              <div
                key={r.item}
                className="rounded-lg border border-border bg-card p-4"
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    className="mt-1"
                    checked={picked.includes(r.item)}
                    onCheckedChange={(v) =>
                      setPicked((p) =>
                        v === true
                          ? [...p, r.item]
                          : p.filter((x) => x !== r.item)
                      )
                    }
                    aria-label={`เลือก ${r.item}`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{r.item}</p>
                    <TemplateCell item={r.item} tpls={r.tpls} />
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <DirToggle
                    item={r.item}
                    dir="purchase"
                    on={r.qc.beforePurchase}
                    onToggle={toggle}
                  />
                  <DirToggle
                    item={r.item}
                    dir="delivery"
                    on={r.qc.beforeDelivery}
                    onToggle={toggle}
                  />
                </div>
                {r.gap && <GapBadge />}
              </div>
            ))}
          </div>

          {/* จอกว้างเป็นตาราง — งานจริงคือกวาดตาลงคอลัมน์ติ๊กว่าตัวไหนยังว่าง
              ซึ่งเป็นสิ่งเดียวที่การ์ดเรียงต่อกันทำให้ไม่ได้ */}
          <div className="mt-4 hidden overflow-hidden rounded-xl border border-border bg-card @3xl:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={allShownPicked}
                      onCheckedChange={(v) =>
                        setPicked(v === true ? shown.map((r) => r.item) : [])
                      }
                      aria-label="เลือกทั้งหมดที่แสดงอยู่"
                    />
                  </TableHead>
                  <TableHead className="min-w-64">สินค้า</TableHead>
                  <TableHead className="min-w-32">ตรวจก่อนรับเข้า</TableHead>
                  <TableHead className="min-w-32">ตรวจก่อนส่งออก</TableHead>
                  <TableHead className="min-w-56">ฟอร์มที่ใช้</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shown.map((r) => (
                  <TableRow key={r.item}>
                    <TableCell>
                      <Checkbox
                        checked={picked.includes(r.item)}
                        onCheckedChange={(v) =>
                          setPicked((p) =>
                            v === true
                              ? [...p, r.item]
                              : p.filter((x) => x !== r.item)
                          )
                        }
                        aria-label={`เลือก ${r.item}`}
                      />
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{r.item}</span>
                      {r.gap && <GapBadge />}
                    </TableCell>
                    <TableCell>
                      <Checkbox
                        checked={r.qc.beforePurchase}
                        onCheckedChange={(v) =>
                          toggle(r.item, "purchase", v === true)
                        }
                        aria-label={`ตรวจก่อนรับเข้า ${r.item}`}
                      />
                    </TableCell>
                    <TableCell>
                      <Checkbox
                        checked={r.qc.beforeDelivery}
                        onCheckedChange={(v) =>
                          toggle(r.item, "delivery", v === true)
                        }
                        aria-label={`ตรวจก่อนส่งออก ${r.item}`}
                      />
                    </TableCell>
                    <TableCell>
                      <TemplateCell item={r.item} tpls={r.tpls} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </main>
  );
}

/* ---------- ติ๊กหนึ่งทิศบนการ์ด ---------- */
function DirToggle({
  item,
  dir,
  on,
  onToggle,
}: {
  item: string;
  dir: QcDirection;
  on: boolean;
  onToggle: (item: string, dir: QcDirection, on: boolean) => void;
}) {
  return (
    <label
      className={cn(
        "flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm",
        on && "border-primary bg-brand font-medium"
      )}
    >
      <Checkbox
        checked={on}
        onCheckedChange={(v) => onToggle(item, dir, v === true)}
      />
      {dir === "purchase" ? "ก่อนรับเข้า" : "ก่อนส่งออก"}
    </label>
  );
}

/* ---------- ฟอร์มที่ผูกไว้ — อ่านอย่างเดียว เจ้าของช่องคือหน้าเทมเพลต ---------- */
function TemplateCell({
  item,
  tpls,
}: {
  item: string;
  tpls: ReturnType<typeof templatesOfItem>;
}) {
  if (tpls.length === 0)
    return (
      <span className="block text-sm text-muted-foreground">
        ยังไม่มีฟอร์มผูกไว้
      </span>
    );

  return (
    <div className="mt-0.5 space-y-1">
      {tpls.map((t) => (
        <Link
          key={t.id}
          href={hrefOf(t)}
          className="block text-sm text-primary underline underline-offset-2"
        >
          {t.name}
        </Link>
      ))}
      {/* Item.quality_inspection_template เป็น Link เดี่ยว เก็บได้ใบเดียว
          ฟอร์มที่เกินมาคือของที่จะหายตอนขึ้นระบบจริง ต้องเห็นตั้งแต่ตอนนี้ */}
      {isContested(item) && (
        <Badge appearance="soft" tone="warning">
          {tpls.length} ฟอร์มแย่งช่องเดียวกัน
        </Badge>
      )}
    </div>
  );
}

function GapBadge() {
  return (
    <Badge appearance="soft" tone="warning" className="mt-1">
      ผูกฟอร์มแล้วแต่ยังไม่บังคับ
    </Badge>
  );
}
