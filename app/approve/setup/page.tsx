"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { MinusIcon, PlusIcon } from "lucide-react";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@peckey954/ui/components/ui/dialog";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@peckey954/ui/components/ui/input-group";
import { Label } from "@peckey954/ui/components/ui/label";
import { Switch } from "@peckey954/ui/components/ui/switch";
import { toast } from "sonner";
import { MultiSelectChips } from "@/components/multi-select-chips";
import { useNumberField } from "@/components/number-field";
import {
  APPROVER_OPTIONS,
  blankRule,
  CATEGORY_OPTIONS,
  DEFAULT_APPROVAL_CONFIG,
  round2,
  stampNow,
  type ApprovalConfig,
  type ApprovalRule,
} from "@/lib/approval-setup";
import type { PrCategoryId } from "@/lib/pr";

/* ------------------------------------------------------------------
   ตั้งค่าการอนุมัติใบสั่งซื้อ

   หนึ่งบรรทัด = หนึ่งการอนุมัติ อ่านจากซ้ายไปขวาได้เป็นประโยคเดียว
   "ใบที่ยอดอยู่ระหว่าง A ถึง B และเป็นสินค้าประเภท C ให้คนกลุ่ม D อนุมัติ"
   จึงวางเป็นแถวเดียวจบ ไม่ซอยเป็นการ์ดย่อย — คนตั้งค่าเทียบหลายบรรทัดพร้อมกัน
   ได้ด้วยการกวาดสายตาลงคอลัมน์เดียว ซึ่งเป็นงานหลักของหน้านี้

   บรรทัดใหม่แทรกบนสุด เพราะรายการเรียงวงเงินจากสูงลงต่ำ และเพิ่มชั้นใหม่
   แทบทุกครั้งคือเพิ่มคนที่อยู่ "เหนือ" ของเดิม ไม่ใช่ไปแตะของเดิม

   ปิดใช้งานแทนลบ ค่าที่ตั้งไว้ยังอยู่ครบ เปิดกลับมาใช้ได้ทันที
------------------------------------------------------------------ */

export default function ApprovalSetupPage() {
  const router = useRouter();
  const [config, setConfig] = React.useState<ApprovalConfig>(
    DEFAULT_APPROVAL_CONFIG
  );
  const [leaving, setLeaving] = React.useState(false);

  // เทียบเฉพาะกฎ ไม่รวมเวลาอัปเดต ไม่งั้นกดบันทึกแล้วยังนับว่ามีของค้าง
  const dirty =
    JSON.stringify(config.rules) !==
    JSON.stringify(DEFAULT_APPROVAL_CONFIG.rules);

  const patchRule = (id: string, patch: Partial<ApprovalRule>) =>
    setConfig((c) => ({
      ...c,
      rules: c.rules.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    }));

  /** บรรทัดใหม่ไปอยู่บนสุด — ของเดิมที่อยู่ล่างไม่ขยับ */
  const addRule = () =>
    setConfig((c) => ({ ...c, rules: [blankRule(c.rules[0]), ...c.rules] }));

  const save = () => {
    setConfig((c) => ({ ...c, updatedAt: stampNow() }));
    toast.success("บันทึกการตั้งค่าการอนุมัติแล้ว", {
      description: `${config.rules.filter((r) => r.enabled).length} การอนุมัติที่เปิดใช้งาน จากทั้งหมด ${config.rules.length} รายการ`,
    });
  };

  /** ออกจากหน้าโดยยังไม่บันทึก ต้องถามก่อน ของที่คีย์ไว้หายทันทีที่ออก */
  const back = () => (dirty ? setLeaving(true) : router.back());

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
              <BreadcrumbPage className="text-primary">
                ตั้งค่าการอนุมัติ
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="mt-2 flex flex-wrap items-start justify-between gap-3 sm:mt-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight">
              ตั้งค่าการอนุมัติ
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              ตั้งค่าลำดับการอนุมัติ และวงเงินเพื่อกำหนดผู้มีสิทธิ์อนุมัติตามลำดับ
              อัปเดตล่าสุด {config.updatedAt}
            </p>
          </div>
          <Button className="shrink-0" onClick={addRule}>
            <PlusIcon />
            เพิ่มการอนุมัติ
          </Button>
        </div>

        <div className="mt-5 space-y-4">
          {config.rules.map((rule) => (
            <RuleRow
              key={rule.id}
              rule={rule}
              onPatch={(patch) => patchRule(rule.id, patch)}
            />
          ))}
        </div>
      </main>

      {/* ---------- แถบปุ่มล่าง ---------- */}
      <div className="sticky bottom-0 z-30 border-t border-border bg-surface">
        <div className="mx-auto w-full max-w-7xl px-4 py-3 sm:px-8">
          <div className="flex items-center gap-3 @lg:justify-between">
            <Button
              variant="outline-primary"
              className="flex-1 @lg:flex-none"
              onClick={back}
            >
              ย้อนกลับ
            </Button>
            <Button className="flex-1 @lg:flex-none" onClick={save}>
              บันทึก
            </Button>
          </div>
        </div>
      </div>

      {/* ---------- ยืนยันก่อนออกโดยไม่บันทึก ----------
          ขึ้นเฉพาะตอนมีของที่คีย์ไว้จริง กดย้อนกลับทั้งที่ยังไม่ได้แตะอะไร
          ไม่ควรโดนถาม เพราะไม่มีอะไรจะเสีย */}
      <Dialog open={leaving} onOpenChange={setLeaving}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center sm:text-center">
            <DialogTitle>คุณต้องการออกจากหน้านี้ใช่ไหม?</DialogTitle>
            <DialogDescription>
              เมื่อออกจากหน้านี้แล้ว ข้อมูลจะไม่ถูกบันทึก
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center">
            <Button
              variant="outline-primary"
              className="flex-1 sm:flex-none"
              onClick={() => setLeaving(false)}
            >
              อยู่หน้านี้ต่อ
            </Button>
            <Button
              className="flex-1 sm:flex-none"
              onClick={() => {
                setLeaving(false);
                router.back();
              }}
            >
              ออกจากหน้านี้
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/** หนึ่งการอนุมัติ — ช่วงวงเงิน ประเภทสินค้า ผู้อนุมัติ และสวิตช์เปิดใช้งาน */
function RuleRow({
  rule,
  onPatch,
}: {
  rule: ApprovalRule;
  onPatch: (patch: Partial<ApprovalRule>) => void;
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
      {/* จอกว้างเรียงเป็นแถวเดียวให้กวาดสายตาลงคอลัมน์ได้ จอแคบซ้อนลงมา
          items-end เพื่อให้สวิตช์ที่ไม่มีป้ายกำกับอยู่ระดับเดียวกับช่องกรอก */}
      <div className="grid gap-4 @5xl:grid-cols-[1fr_1fr_1fr_1.2fr_auto] @5xl:items-end">
        <BahtField
          id={`${rule.id}-min`}
          label="วงเงินเริ่มต้น (บาท)"
          value={rule.minBaht}
          onValueChange={(v) => onPatch({ minBaht: v })}
        />
        <BahtField
          id={`${rule.id}-max`}
          label="วงเงินสูงสุด (บาท)"
          value={rule.maxBaht}
          onValueChange={(v) => onPatch({ maxBaht: v })}
        />

        <div className="grid gap-1.5">
          <Label htmlFor={`${rule.id}-categories`}>ประเภทสินค้า</Label>
          <MultiSelectChips
            id={`${rule.id}-categories`}
            options={CATEGORY_OPTIONS}
            value={rule.categories}
            onValueChange={(v) => onPatch({ categories: v as PrCategoryId[] })}
            // ไม่เลือกอะไรเลย = คุมทุกประเภท ป้ายจึงเป็น "ทั้งหมด" ไม่ใช่ "เลือก..."
            placeholder="ทั้งหมด"
            selectAllLabel="ทั้งหมด"
            searchPlaceholder="ค้นหา"
            maxChips={2}
            className="bg-card"
          />
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor={`${rule.id}-approvers`}>
            ผู้อนุมัติ{" "}
            <span className="font-normal text-muted-foreground">
              (อนุมัติเพียง 1 คน)
            </span>
          </Label>
          <MultiSelectChips
            id={`${rule.id}-approvers`}
            options={APPROVER_OPTIONS}
            value={rule.approverIds}
            onValueChange={(v) => onPatch({ approverIds: v })}
            placeholder="เลือกผู้อนุมัติ"
            searchPlaceholder="ค้นหา"
            hideSelectAll
            maxChips={2}
            className="bg-card"
          />
        </div>

        {/* ปิดใช้งานแทนลบ ค่าที่ตั้งไว้ยังอยู่ครบ เปิดกลับมาใช้ได้ทันที */}
        <div className="flex items-center gap-2 @5xl:h-9">
          <Switch
            id={`${rule.id}-enabled`}
            checked={rule.enabled}
            onCheckedChange={(v) => onPatch({ enabled: v })}
          />
          <Label htmlFor={`${rule.id}-enabled`} className="whitespace-nowrap">
            เปิดใช้งาน
          </Label>
        </div>
      </div>
    </section>
  );
}

/** ช่องกรอกจำนวนเงิน พร้อมปุ่มลด/เพิ่มสองข้าง */
function BahtField({
  id,
  label,
  value,
  onValueChange,
  step = 1000,
}: {
  id: string;
  label: string;
  value: number;
  onValueChange: (next: number) => void;
  step?: number;
}) {
  const field = useNumberField(value, onValueChange, 2);
  const bump = (delta: number) =>
    onValueChange(Math.max(0, round2(value + delta)));

  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
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
        <InputGroupInput
          {...field}
          id={id}
          className="text-center tabular-nums"
        />
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
