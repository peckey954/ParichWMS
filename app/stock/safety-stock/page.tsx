"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { MinusIcon, PlusIcon } from "lucide-react";
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
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@peckey954/ui/components/ui/input-group";
import { Label } from "@peckey954/ui/components/ui/label";
import { cn } from "@peckey954/ui/lib/utils";
import { toast } from "sonner";
import { useNumberField } from "@/components/number-field";
import { RankMark } from "@/components/stock/safety-stock-provider";
import { useSafetyStock } from "@/components/stock/safety-stock-provider";
import { formatTon } from "@/lib/format";
import { CATEGORY_LABEL } from "@/lib/general-stock";
import {
  SAFETY_GROUPS,
  SAFETY_RANKS,
  type GroupPolicy,
  type SafetyGroupId,
  type SafetyRank,
  withCutoff,
  withPercent,
} from "@/lib/safety-stock";

/* ------------------------------------------------------------------
   ตั้งค่า Safety Stock — แบ่งอันดับสินค้าจากยอดคาดการณ์ แล้วคิดสต็อกสำรอง
   เป็น % ของยอดนั้น ค่าที่ได้คือ "เส้นสต็อกต่ำ" ของสินค้าแต่ละตัว

   หนึ่งการ์ดต่อหนึ่งกลุ่มหน่วยนับ หัวการ์ดบอกว่ากลุ่มนี้คลุมประเภทสินค้าไหนบ้าง
   (ชิป) และนับเป็นหน่วยอะไร ทั้งเส้นตัดอันดับและ % สำรองแยกอิสระต่อกลุ่ม

   หน้านี้มีแต่ตัวตั้งค่า ไม่มีตารางผลลัพธ์ — ผลไปโผล่เป็นชิปอันดับบนการ์ดสินค้า
   ในหน้าสต็อกทั่วไปแทน ซึ่งเป็นที่ที่คนทำงานมองอยู่แล้วจริง ๆ

   ไม่มี backend จริงตามธรรมชาติของแอปนี้ — กดบันทึกแล้วขึ้น toast เฉย ๆ
------------------------------------------------------------------ */

export default function SafetyStockSettingPage() {
  const router = useRouter();
  const { config, setConfig } = useSafetyStock();

  function handleSave() {
    toast.success("บันทึกการตั้งค่า Safety Stock แล้ว", {
      description: `ตั้งเกณฑ์ครบ ${SAFETY_GROUPS.length} กลุ่มสินค้า`,
    });
  }

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
              <BreadcrumbLink href="/stock">สต็อกทั่วไป</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-primary">
                ตั้งค่า Safety Stock
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="mt-2 min-w-0 sm:mt-3">
          <h1 className="text-2xl font-semibold tracking-tight">
            ตั้งค่า Safety Stock
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            แบ่งอันดับสินค้าจากยอดคาดการณ์ และ % ตัดอันดับที่ต้องการสำรอง
            เมื่อคงเหลือต่ำกว่าค่าสำรองถือว่าสต็อกต่ำ
          </p>
        </div>

        <div className="mt-4 space-y-4">
          {SAFETY_GROUPS.map((g) => (
            <GroupCard
              key={g.id}
              id={g.id}
              unit={g.unit}
              categories={g.categories.map((c) => CATEGORY_LABEL[c])}
              policy={config[g.id]}
              onCutoff={(key, next) =>
                setConfig((c) => withCutoff(c, g.id, key, next))
              }
              onPercent={(rank, next) =>
                setConfig((c) => withPercent(c, g.id, rank, next))
              }
            />
          ))}
        </div>
      </main>

      {/* ---------- แถบปุ่มล่าง ----------
           จอแคบแบ่งครึ่งเท่ากัน จอกว้างย้อนกลับชิดซ้าย บันทึกชิดขวา
           ใช้ @lg: ไม่ใช่ lg: เพราะทั้งแอปวัดความกว้างจากกล่อง @container
           ของ DeviceFrame ไม่ใช่ขนาดหน้าต่างจริง */}
      <div className="sticky bottom-0 z-30 border-t border-border bg-surface">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-8">
          <Button
            variant="outline-primary"
            className="flex-1 @lg:flex-none"
            onClick={() => router.back()}
          >
            ย้อนกลับ
          </Button>
          <Button className="flex-1 @lg:flex-none" onClick={handleSave}>
            บันทึก
          </Button>
        </div>
      </div>
    </>
  );
}

/** หนึ่งการ์ดต่อหนึ่งกลุ่มหน่วยนับ */
function GroupCard({
  id,
  unit,
  categories,
  policy,
  onCutoff,
  onPercent,
}: {
  id: SafetyGroupId;
  unit: string;
  categories: string[];
  policy: GroupPolicy;
  onCutoff: (key: "aFrom" | "bFrom", next: number) => void;
  onPercent: (rank: SafetyRank, next: number) => void;
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
      {/* ---------- หัวการ์ด ----------
           ชิปบอกว่ากลุ่มนี้คลุมประเภทสินค้าไหนบ้าง

           จัดลำดับด้วย order แทนการเขียนชิปซ้ำสองชุด —
           จอแคบ: "ประเภทสินค้า:" กับ "หน่วย" อยู่บรรทัดเดียวกัน ชิปตกลงบรรทัดใหม่
                  (ชิปห้าใบเรียงต่อท้ายในจอแคบแล้วดันหน่วยหลุดหายไปเลย)
           จอกว้าง: ชิปต่อท้ายป้ายในบรรทัดเดียวกัน หน่วยชิดขวาสุด
           ml-auto ดันหน่วยไปขวาได้ทั้งสองแบบ ไม่ต้องแยก layout */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">ประเภทสินค้า:</span>

        <div className="order-2 flex w-full flex-wrap items-center gap-2 @3xl:order-1 @3xl:w-auto">
          {categories.map((c) => (
            <Badge
              key={c}
              tone="neutral"
              appearance="outline"
              className="font-semibold"
            >
              {c}
            </Badge>
          ))}
        </div>

        <p className="order-1 ml-auto shrink-0 text-sm @3xl:order-2">
          <span className="text-muted-foreground">หน่วย: </span>
          <span className="font-semibold">{unit}</span>
        </p>
      </div>

      {/* ---------- หัวคอลัมน์ (เฉพาะจอกว้าง) ----------
           จอแคบไม่มีคอลัมน์ให้พาดหัว แต่ละช่องมี label ของตัวเองอยู่แล้ว */}
      <div className="mt-4 hidden gap-4 @3xl:grid @3xl:grid-cols-[3.5rem_1fr_1fr] @3xl:items-baseline">
        <span className="text-sm font-medium">อันดับ</span>
        <span className="text-sm font-medium">
          เกณฑ์ตัดอันดับจากยอดคาดการณ์ ({unit})
        </span>
        <span />
      </div>

      <div className="mt-3 space-y-3 @3xl:mt-2 @3xl:space-y-2">
        {SAFETY_RANKS.map((rank) => (
          <RankRow
            key={rank}
            groupId={id}
            rank={rank}
            unit={unit}
            policy={policy}
            onCutoff={onCutoff}
            onPercent={onPercent}
          />
        ))}
      </div>
    </section>
  );
}

function RankRow({
  groupId,
  rank,
  unit,
  policy,
  onCutoff,
  onPercent,
}: {
  groupId: SafetyGroupId;
  rank: SafetyRank;
  unit: string;
  policy: GroupPolicy;
  onCutoff: (key: "aFrom" | "bFrom", next: number) => void;
  onPercent: (rank: SafetyRank, next: number) => void;
}) {
  const isC = rank === "C";
  const cutId = `cutoff-${groupId}-${rank}`;
  const pctId = `percent-${groupId}-${rank}`;

  return (
    <div className="grid gap-3 border-t border-border pt-3 first:border-0 first:pt-0 @3xl:grid-cols-[3.5rem_1fr_1fr] @3xl:items-center @3xl:gap-4 @3xl:border-0 @3xl:pt-0">
      {/* อันดับ — จอแคบมีคำว่า "อันดับ:" นำหน้า จอกว้างเป็นคอลัมน์อยู่แล้ว */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground @3xl:hidden">
          อันดับ:
        </span>
        <RankMark rank={rank} />
      </div>

      {/* จอแคบมีหัวข้อกำกับซ้ำในแต่ละอันดับ ตามแบบ — จอกว้างพาดหัวคอลัมน์แล้ว */}
      <p className="text-sm font-medium @3xl:hidden">
        เกณฑ์ตัดอันดับจากยอดคาดการณ์
      </p>

      <div className="grid gap-3 @3xl:contents">
        {/* เกณฑ์ตัด — อันดับ C ไม่มีช่องกรอก เพราะเป็น "ส่วนที่เหลือ"
            ตั้งเส้นล่างให้ C ด้วยจะเกิดช่องว่างที่ไม่มีอันดับไหนรับ */}
        {isC ? (
          <div className="flex items-baseline gap-2 @3xl:min-h-9">
            <span className="text-sm text-muted-foreground">
              น้อยกว่า ({unit}):
            </span>
            <span className="text-sm font-semibold tabular-nums">
              {formatTon(policy.bFrom)}
            </span>
          </div>
        ) : (
          <Stepper
            id={cutId}
            label={`ตั้งแต่ (${unit})`}
            value={rank === "A" ? policy.aFrom : policy.bFrom}
            step={50}
            onValueChange={(next) =>
              onCutoff(rank === "A" ? "aFrom" : "bFrom", next)
            }
          />
        )}

        <Stepper
          id={pctId}
          label="สำรอง (%)"
          value={policy.percent[rank]}
          step={1}
          onValueChange={(next) => onPercent(rank, next)}
        />
      </div>
    </div>
  );
}

/** ช่องกรอกตัวเลขแบบมีปุ่มลด/เพิ่ม — ป้ายกำกับอยู่หน้าช่องบนจอกว้าง
 *  และอยู่บนช่องบนจอแคบ ตามแบบ */
function Stepper({
  id,
  label,
  value,
  step,
  onValueChange,
}: {
  id: string;
  label: string;
  value: number;
  step: number;
  onValueChange: (next: number) => void;
}) {
  const field = useNumberField(value, onValueChange, 2);
  const bump = (delta: number) =>
    onValueChange(Math.max(0, Number((value + delta).toFixed(2))));

  return (
    <div className="grid gap-2 @3xl:grid-cols-[auto_1fr] @3xl:items-center @3xl:gap-3">
      <Label htmlFor={id} className="whitespace-nowrap text-muted-foreground">
        {label}:
      </Label>
      <InputGroup className="bg-card">
        <InputGroupAddon align="inline-start">
          <InputGroupButton
            size="icon-xs"
            aria-label={`ลด ${label}`}
            onClick={() => bump(-step)}
          >
            <MinusIcon />
          </InputGroupButton>
        </InputGroupAddon>
        <InputGroupInput {...field} id={id} className={cn("text-center tabular-nums")} />
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            size="icon-xs"
            aria-label={`เพิ่ม ${label}`}
            onClick={() => bump(step)}
          >
            <PlusIcon />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </div>
  );
}
