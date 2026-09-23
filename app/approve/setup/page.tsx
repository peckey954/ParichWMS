"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  CircleXIcon,
  MinusIcon,
  PlusIcon,
} from "lucide-react";
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
import { cn } from "@peckey954/ui/lib/utils";
import { toast } from "sonner";
import { MultiSelectChips } from "@/components/multi-select-chips";
import { useNumberField } from "@/components/number-field";
import {
  APPROVER_OPTIONS,
  blankGroup,
  blankTier,
  CATEGORY_OPTIONS,
  DEFAULT_APPROVAL_CONFIG,
  issueHeadline,
  issuesOf,
  redFieldsOf,
  round2,
  stampNow,
  type ApprovalConfig,
  type ApprovalGroup,
  type ApprovalTier,
  type Issue,
} from "@/lib/approval-setup";
import type { PrCategoryId } from "@/lib/pr";

/* ------------------------------------------------------------------
   ตั้งค่าการอนุมัติใบสั่งซื้อ

   ประเภทสินค้าเป็นหัว ช่วงวงเงินเป็นชั้นอยู่ข้างใน
   "สินค้าประเภท C ใบที่ยอดอยู่ระหว่าง A ถึง B ให้คนกลุ่ม D อนุมัติ"

   ที่ต้องเป็นลำดับนี้เพราะวงเงินมีความหมายก็ต่อเมื่อรู้ว่าพูดถึงสินค้าประเภทไหน
   พอรวมชั้นของประเภทเดียวกันไว้ด้วยกัน บันไดวงเงินอ่านต่อเนื่องลงมาได้ทีเดียว

   ---------- จังหวะที่เตือน ----------

   ช่องว่างคือสถานะตั้งต้นของทุกชั้น ไม่ใช่ความผิดที่คนทำ ทำแดงตอนคลิกผ่าน
   เท่ากับด่าเขาที่ยังไปไม่ถึง คนส่วนใหญ่ไล่กรอกวงเงินให้ครบทั้งบันไดก่อน
   แล้วค่อยย้อนมาใส่ผู้อนุมัติทีเดียว ระหว่างนั้นจะแดงทั้งหน้าทั้งที่ทำถูกตามลำดับของเขา

   เรื่องซ้ำ/ไม่ต่อเนื่องก็เหมือนกัน ระหว่างไล่กรอกชั้นถัดไปมันขาดเป็นธรรมดา

     ก่อนกดบันทึกครั้งแรก   เตือนตอนคลิกออกจากช่อง และเฉพาะเคสที่ดูชั้นเดียวก็รู้
                            (เริ่มต้น > สูงสุด) ที่เหลือเงียบไว้
     หลังกดบันทึกครั้งแรก   โชว์ทุกจุด และคำนวณใหม่ทุกครั้งที่พิมพ์
                            กรอบแดงกับตัวนับต้องลดลงสด ๆ ไม่ใช่รอกดบันทึกอีกรอบ

   ---------- เตือนตรงไหน ----------

   สองที่ คนละหน้าที่กัน ไม่ใช่พูดเรื่องเดียวกันซ้ำ

     แถบบน   เหลือกี่จุด กำลังชี้จุดไหนอยู่ และปุ่มกระโดดไปทีละจุด
     ตรงจุด  กรอบแดง + ข้อความที่บอกตัวเลขจริงและผลที่ตามมา ไม่ใช่ "กรุณาแก้ไข"

   แถบบนต้อง sticky ใต้แถบหัวเว็บ ไม่ใช่วางลอยอยู่ในสายเลื่อนเฉย ๆ
   เพราะพอเริ่มแก้จุดแรกหน้าก็เลื่อนลงไปแล้ว แถบที่ไม่ค้างจะหายจากจอทันที
   กลายเป็นของที่ต้องเลื่อนกลับขึ้นไปหา ซึ่งคือปัญหาที่แถบนี้ตั้งใจจะแก้ตั้งแต่แรก

   ไม่มีปุ่มปิดแถบ ปิดได้เมื่อไหร่ตัวนับกับปุ่มกระโดดก็หายไปทั้งที่จุดที่ผิดยังอยู่ครบ
   แถบจะหายเองเมื่อแก้หมด ซึ่งเป็นวิธีปิดที่ตรงกับความหมายของมัน

   ปุ่มบันทึกไม่ disable — ปุ่มที่กดไม่ได้ไม่บอกว่าทำไม กดแล้วพาไปจุดแรกแทน
------------------------------------------------------------------ */

export default function ApprovalSetupPage() {
  const router = useRouter();
  const [config, setConfig] = React.useState<ApprovalConfig>(
    DEFAULT_APPROVAL_CONFIG
  );
  const [leaving, setLeaving] = React.useState(false);

  /** กดบันทึกไปแล้วอย่างน้อยหนึ่งครั้ง — จากนี้โชว์ทุกจุดและอัปเดตสด */
  const [showAll, setShowAll] = React.useState(false);
  /** ชั้นที่เคยคลิกออกจากช่องวงเงินแล้ว ใช้เตือนเคสช่วงกลับหัวก่อนกดบันทึก */
  const [touched, setTouched] = React.useState<Set<string>>(new Set());
  const [cursor, setCursor] = React.useState(0);

  const issues = issuesOf(config);
  const visible = issues.filter(
    (i) => showAll || (i.kind === "range" && touched.has(i.tierId))
  );
  const red = redFieldsOf(visible);
  const at = visible.length === 0 ? 0 : Math.min(cursor, visible.length - 1);

  // เทียบเฉพาะกฎ ไม่รวมเวลาอัปเดต ไม่งั้นกดบันทึกแล้วยังนับว่ามีของค้าง
  const dirty =
    JSON.stringify(config.groups) !==
    JSON.stringify(DEFAULT_APPROVAL_CONFIG.groups);

  /**
   * เลื่อนไปหาจุดที่ผิดแล้วโฟกัสให้เลย
   *
   * รอสองเฟรมเพราะจุดที่เพิ่งเปลี่ยนเป็นโชว์ (ข้อความตรงรอยต่อ) ยังไม่มีตัวตน
   * ใน DOM ตอนที่สั่ง setState เฟรมเดียวบางทีก็ยังไม่ทัน
   */
  const jumpTo = (issue: Issue) => {
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        const el = document.getElementById(issue.anchorId);
        if (!el) return;
        el.scrollIntoView({ block: "center", behavior: "smooth" });
        el.focus?.({ preventScroll: true });
      })
    );
  };

  const step = (delta: number) => {
    if (visible.length === 0) return;
    const next = (((at + delta) % visible.length) + visible.length) % visible.length;
    setCursor(next);
    jumpTo(visible[next]);
  };

  const patchGroup = (groupId: string, patch: Partial<ApprovalGroup>) =>
    setConfig((c) => ({
      ...c,
      groups: c.groups.map((g) => (g.id === groupId ? { ...g, ...patch } : g)),
    }));

  const patchTier = (
    groupId: string,
    tierId: string,
    patch: Partial<ApprovalTier>
  ) =>
    setConfig((c) => ({
      ...c,
      groups: c.groups.map((g) =>
        g.id !== groupId
          ? g
          : {
              ...g,
              tiers: g.tiers.map((t) =>
                t.id === tierId ? { ...t, ...patch } : t
              ),
            }
      ),
    }));

  /** ชั้นใหม่ไปอยู่บนสุดของกลุ่มนั้น — ของเดิมที่อยู่ล่างไม่ขยับ */
  const addTier = (groupId: string) =>
    setConfig((c) => ({
      ...c,
      groups: c.groups.map((g) =>
        g.id !== groupId ? g : { ...g, tiers: [blankTier(g.tiers[0]), ...g.tiers] }
      ),
    }));

  const addGroup = () =>
    setConfig((c) => ({ ...c, groups: [...c.groups, blankGroup()] }));

  const save = () => {
    if (issues.length > 0) {
      setShowAll(true);
      setCursor(0);
      jumpTo(issues[0]);
      toast.error(`ยังแก้ไม่ครบ ${issues.length} จุด`, {
        description: issues[0].message,
      });
      return;
    }
    setConfig((c) => ({ ...c, updatedAt: stampNow() }));
    const tiers = config.groups.flatMap((g) => g.tiers);
    toast.success("บันทึกการตั้งค่าการอนุมัติแล้ว", {
      description: `${config.groups.length} ประเภทสินค้า · ${tiers.filter((t) => t.enabled).length} ช่วงวงเงินที่เปิดใช้งาน จากทั้งหมด ${tiers.length} ช่วง`,
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
          <Button className="shrink-0" onClick={addGroup}>
            <PlusIcon />
            เพิ่มประเภทสินค้า
          </Button>
        </div>

        {/* ---------- แถบบอกว่าเหลือกี่จุด ----------
            อยู่บนสุดของเนื้อหาและ "ค้างไว้" ใต้แถบหัวเว็บ (top-14 = h-14 ของ header)
            ไม่ใช่อยู่ในสายเลื่อนเฉย ๆ — ไม่งั้นพอเริ่มแก้จุดแรกมันก็เลื่อนหายไป
            กลายเป็นของที่ต้องเลื่อนกลับขึ้นไปหาเอง ซึ่งคือสิ่งที่แถบนี้ควรแก้

            พาดหัวบอกชนิดของปัญหา บรรทัดล่างบอกจุดที่กำลังชี้อยู่จริง ๆ
            พร้อมตัวเลขของมัน ไม่ใช่ "กรุณาตรวจสอบใหม่อีกครั้ง" ซึ่งไม่ได้บอกว่าตรวจตรงไหน */}
        {visible.length > 0 && (
          <div className="sticky top-14 z-20 -mx-4 mt-4 bg-background px-4 pb-1 sm:-mx-6 sm:px-6">
            <div className="flex items-start gap-3 rounded-lg border border-danger-border bg-danger px-4 py-3">
              <CircleXIcon className="mt-0.5 size-5 shrink-0 text-danger-strong" />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-danger-strong">
                  {issueHeadline(visible)}
                </p>
                <p className="mt-0.5 truncate text-sm text-danger-foreground">
                  {visible[at].message}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {visible.length > 1 && (
                  <span className="mr-1 hidden text-sm tabular-nums text-danger-foreground sm:inline">
                    {at + 1}/{visible.length}
                  </span>
                )}
                <JumpButton label="จุดก่อนหน้า" onClick={() => step(-1)}>
                  <ChevronUpIcon />
                </JumpButton>
                <JumpButton label="จุดถัดไป" onClick={() => step(1)}>
                  <ChevronDownIcon />
                </JumpButton>
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 space-y-4">
          {config.groups.map((group) => (
            <GroupCard
              key={group.id}
              group={group}
              issues={visible.filter((i) => i.groupId === group.id)}
              red={red}
              onPatchGroup={(patch) => patchGroup(group.id, patch)}
              onPatchTier={(tierId, patch) => patchTier(group.id, tierId, patch)}
              onTouchTier={(tierId) =>
                setTouched((prev) => new Set(prev).add(tierId))
              }
              onAddTier={() => addTier(group.id)}
            />
          ))}
        </div>
      </main>

      {/* ---------- แถบปุ่มล่าง ---------- */}
      <div className="sticky bottom-0 z-30 border-t border-border bg-surface">
        <div className="mx-auto w-full max-w-7xl px-4 py-3 sm:px-8">
          {/* ตัวนับย้ายขึ้นไปอยู่แถบบนแล้ว ไม่ซ้ำอีกที่ — บอกเรื่องเดียวกันสองที่
              แปลว่าที่หนึ่งไม่จำเป็น และคนจะไม่แน่ใจว่าต้องมองอันไหน */}
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

function JumpButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={cn(
        "flex size-7 items-center justify-center rounded-md border border-danger-border",
        "transition-colors hover:bg-danger-border/40",
        "focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
        "[&_svg]:size-4"
      )}
    >
      {children}
    </button>
  );
}

/** ประเภทสินค้าหนึ่งกลุ่ม พร้อมบันไดวงเงินของมัน */
function GroupCard({
  group,
  issues,
  red,
  onPatchGroup,
  onPatchTier,
  onTouchTier,
  onAddTier,
}: {
  group: ApprovalGroup;
  issues: Issue[];
  red: Set<string>;
  onPatchGroup: (patch: Partial<ApprovalGroup>) => void;
  onPatchTier: (tierId: string, patch: Partial<ApprovalTier>) => void;
  onTouchTier: (tierId: string) => void;
  onAddTier: () => void;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card">
      {/* หัวกลุ่ม — ประเภทสินค้าอยู่บนสุด อ่านก่อนเสมอว่ากำลังตั้งของอะไร
          พื้นหลังต่างจากชั้นข้างล่างเพื่อให้เห็นว่าเป็นหัว ไม่ใช่แถวหนึ่งของบันได */}
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border bg-surface p-4 sm:p-5">
        <div className="grid min-w-0 flex-1 gap-1.5 @3xl:max-w-lg">
          <Label htmlFor={`${group.id}-categories`} className="font-semibold">
            ประเภทสินค้า
          </Label>
          <MultiSelectChips
            id={`${group.id}-categories`}
            options={CATEGORY_OPTIONS}
            value={group.categories}
            onValueChange={(v) =>
              onPatchGroup({ categories: v as PrCategoryId[] })
            }
            // ไม่เลือกอะไรเลย = คุมทุกประเภท ป้ายจึงเป็น "ทั้งหมด" ไม่ใช่ "เลือก..."
            // ว่างตรงนี้จึงไม่เคยเป็น error — เป็นค่าที่ใช้ได้จริง
            placeholder="ทั้งหมด"
            selectAllLabel="ทั้งหมด"
            searchPlaceholder="ค้นหา"
            maxChips={3}
            className="bg-card"
          />
        </div>
        <Button variant="outline-primary" className="shrink-0" onClick={onAddTier}>
          <PlusIcon />
          เพิ่มช่วงวงเงิน
        </Button>
      </div>

      {/* บันไดวงเงินของประเภทนี้ เรียงสูงลงต่ำ */}
      <div>
        {group.tiers.map((tier) => {
          const mine = issues.filter((i) => i.tierId === tier.id);
          const seam = mine.find((i) => i.kind === "gap" || i.kind === "overlap");
          return (
            <React.Fragment key={tier.id}>
              <TierRow
                tier={tier}
                rangeIssue={mine.find((i) => i.kind === "range")}
                approverIssue={mine.find((i) => i.kind === "approver")}
                red={red}
                onPatch={(patch) => onPatchTier(tier.id, patch)}
                onTouch={() => onTouchTier(tier.id)}
              />
              {seam && <ChainNote issue={seam} />}
            </React.Fragment>
          );
        })}
      </div>
    </section>
  );
}

/**
 * บันไดขาดตรงไหนบอกตรงนั้น
 *
 * เหตุผลทั้งหมดที่ยกประเภทสินค้าขึ้นเป็นหัว คือให้ชั้นวงเงินของประเภทเดียวกัน
 * อยู่ติดกันจนอ่านออกว่าต่อเนื่องไหม บอกตรงรอยต่อเลยจะได้ไม่ต้องให้คนไล่ลบเลขเอง
 *
 * ต่อกันสนิทไม่มีบรรทัดนี้ — ขึ้นป้าย "ต่อเนื่อง" ทุกรอยต่อแล้วป้ายก็เลิกบอกอะไร
 * หลักเดียวกับจุดบนปุ่มตัวกรองในหน้าสต็อก
 */
function ChainNote({ issue }: { issue: Issue }) {
  return (
    <p
      id={issue.anchorId}
      tabIndex={-1}
      className="scroll-mt-24 border-t border-border bg-danger px-4 py-2 text-sm text-danger-foreground focus-visible:outline-none sm:px-5"
    >
      {issue.message}
    </p>
  );
}

/** หนึ่งชั้นวงเงิน — ช่วงเงิน ผู้อนุมัติ และสวิตช์เปิดใช้งาน */
function TierRow({
  tier,
  rangeIssue,
  approverIssue,
  red,
  onPatch,
  onTouch,
}: {
  tier: ApprovalTier;
  rangeIssue?: Issue;
  approverIssue?: Issue;
  red: Set<string>;
  onPatch: (patch: Partial<ApprovalTier>) => void;
  onTouch: () => void;
}) {
  return (
    // จอกว้างเรียงเป็นแถวเดียวให้กวาดสายตาลงคอลัมน์ได้ จอแคบซ้อนลงมา
    // items-start เพื่อให้แถวที่มีข้อความ error อยู่ใต้ช่อง ไม่ดันช่องอื่นลอยตาม
    <div className="border-t border-border p-4 first:border-t-0 sm:p-5">
      <div className="grid gap-4 @5xl:grid-cols-[1fr_1fr_1.4fr_auto] @5xl:items-start">
        <BahtField
          id={`${tier.id}-min`}
          label="วงเงินเริ่มต้น (บาท)"
          value={tier.minBaht}
          invalid={red.has(`${tier.id}-min`)}
          onValueChange={(v) => onPatch({ minBaht: v })}
          onBlurred={onTouch}
        />
        <BahtField
          id={`${tier.id}-max`}
          label="วงเงินสูงสุด (บาท)"
          value={tier.maxBaht}
          invalid={red.has(`${tier.id}-max`)}
          onValueChange={(v) => onPatch({ maxBaht: v })}
          onBlurred={onTouch}
        />

        <div className="grid content-start gap-1.5">
          <Label htmlFor={`${tier.id}-approvers`}>
            ผู้อนุมัติ{" "}
            <span className="font-normal text-muted-foreground">
              (อนุมัติเพียง 1 คน)
            </span>
          </Label>
          <MultiSelectChips
            id={`${tier.id}-approvers`}
            options={APPROVER_OPTIONS}
            value={tier.approverIds}
            onValueChange={(v) => onPatch({ approverIds: v })}
            placeholder="เลือกผู้อนุมัติ"
            searchPlaceholder="ค้นหา"
            hideSelectAll
            maxChips={2}
            className={cn(
              "scroll-mt-24 bg-card",
              red.has(`${tier.id}-approvers`) && "border-destructive"
            )}
          />
          {approverIssue && <FieldError>{approverIssue.message}</FieldError>}
        </div>

        {/* ปิดใช้งานแทนลบ ค่าที่ตั้งไว้ยังอยู่ครบ เปิดกลับมาใช้ได้ทันที
            และชั้นที่ปิดอยู่ไม่ถูกตรวจ จอดชั้นที่กรอกค้างไว้ได้โดยไม่โดนบล็อก */}
        <div className="flex items-center gap-2 @5xl:h-9 @5xl:pt-7">
          <Switch
            id={`${tier.id}-enabled`}
            checked={tier.enabled}
            onCheckedChange={(v) => onPatch({ enabled: v })}
          />
          <Label htmlFor={`${tier.id}-enabled`} className="whitespace-nowrap">
            เปิดใช้งาน
          </Label>
        </div>
      </div>

      {/* ช่วงกลับหัวเป็นเรื่องของสองช่องคู่กัน ข้อความจึงอยู่ใต้ทั้งคู่
          ไม่ใช่ใต้ช่องใดช่องหนึ่งซึ่งจะอ่านเหมือนว่าช่องนั้นผิดอยู่ช่องเดียว */}
      {rangeIssue && (
        <FieldError className="mt-2">{rangeIssue.message}</FieldError>
      )}
    </div>
  );
}

function FieldError({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p className={cn("text-sm text-danger-strong", className)}>{children}</p>
  );
}

/** ช่องกรอกจำนวนเงิน พร้อมปุ่มลด/เพิ่มสองข้าง */
function BahtField({
  id,
  label,
  value,
  invalid,
  onValueChange,
  onBlurred,
  step = 1000,
}: {
  id: string;
  label: string;
  value: number;
  invalid?: boolean;
  onValueChange: (next: number) => void;
  onBlurred?: () => void;
  step?: number;
}) {
  const field = useNumberField(value, onValueChange, 2);
  const bump = (delta: number) =>
    onValueChange(Math.max(0, round2(value + delta)));

  return (
    <div className="grid content-start gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <InputGroup
        className={cn("scroll-mt-24 bg-card", invalid && "border-destructive")}
      >
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
          aria-invalid={invalid || undefined}
          className="text-center tabular-nums"
          onBlur={() => {
            field.onBlur();
            onBlurred?.();
          }}
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
