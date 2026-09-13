"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { PlusIcon, RotateCcwIcon, Trash2Icon, UserPlusIcon } from "lucide-react";
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
  InputGroupInput,
} from "@peckey954/ui/components/ui/input-group";
import { Label } from "@peckey954/ui/components/ui/label";
import { cn } from "@peckey954/ui/lib/utils";
import { toast } from "sonner";
import { useNumberField } from "@/components/number-field";
import {
  APPROVAL_LAYERS,
  APPROVAL_ROLE_LABEL,
  APPROVAL_ROLE_TH,
  approvalImpact,
  DEFAULT_APPROVAL_CONFIG,
  formatBaht,
  layersWithoutApprover,
  type ApprovalConfig,
  type ApproverLayer,
} from "@/lib/approval-setup";

/* ------------------------------------------------------------------
   ตั้งค่าการอนุมัติใบสั่งซื้อ

   วงเงินเป็นตัวตัดว่าใบนั้นต้องเข้าสายอนุมัติหรือไม่ — ต่ำกว่าเส้นคือ Procurement
   สร้างใบแล้วจบในตัว ไม่ต้องให้ใครอนุมัติ ตั้งแต่เส้นขึ้นไปถึงเข้าสายสองชั้น
   Factory Manager แล้วต่อ Director

   Procurement จึงไม่ใช่ "ชั้นอนุมัติ" ที่ตั้งผู้มีสิทธิ์ได้ อำนาจของเขาคือวงเงิน
   ที่ต่ำกว่าเส้น ต้องโชว์ไว้บนหน้าให้เห็นคู่กัน ไม่งั้นคนอ่านจะไม่รู้ว่าใบเล็ก ๆ
   ใครเป็นคนรับผิดชอบ

   เส้นแบ่งกำกวมได้ง่ายมาก จึงเขียนกำกับทั้งสองฝั่งเสมอว่าค่าที่เท่ากับเส้นพอดีไปทางไหน
------------------------------------------------------------------ */

export default function ApprovalSetupPage() {
  const router = useRouter();
  const [config, setConfig] = React.useState<ApprovalConfig>(
    DEFAULT_APPROVAL_CONFIG
  );

  const dirty =
    JSON.stringify(config) !== JSON.stringify(DEFAULT_APPROVAL_CONFIG);
  const impact = React.useMemo(() => approvalImpact(config), [config]);
  const orphanLayers = layersWithoutApprover(config);

  const amount = useNumberField(config.directorFromBaht, (next) =>
    setConfig((c) => ({ ...c, directorFromBaht: next }))
  );

  const setApprovers = (layer: ApproverLayer, next: string[]) =>
    setConfig((c) => ({ ...c, approvers: { ...c.approvers, [layer]: next } }));

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
              <BreadcrumbLink href="/approve">อนุมัติ</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-primary">
                ตั้งค่าการอนุมัติ
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="mt-2 sm:mt-3">
          <h1 className="text-2xl font-semibold tracking-tight">
            ตั้งค่าการอนุมัติ
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            กำหนดวงเงินที่ใบสั่งซื้อต้องเข้าสายอนุมัติ และผู้มีสิทธิ์อนุมัติของแต่ละชั้น
          </p>
        </div>

        {orphanLayers.length > 0 && (
          <p className="mt-3 rounded-xl border border-chip-yellow-foreground/40 bg-chip-yellow px-4 py-3 text-sm">
            {orphanLayers.map((l) => APPROVAL_ROLE_TH[l]).join(" และ ")}
            ยังไม่มีผู้มีสิทธิ์อนุมัติ — ใบที่ต้องผ่านชั้นนั้นจะค้างโดยไม่มีใครกดได้
          </p>
        )}

        {/* ---------- วงเงิน ---------- */}
        <section className="mt-4 rounded-xl border border-border bg-card p-4 sm:p-5">
          <h2 className="text-base font-semibold">วงเงินที่ต้องอนุมัติ</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            คิดจากราคารวมทั้งใบสั่งซื้อ (รวมค่าจัดการแล้ว)
          </p>

          <div className="mt-4 grid gap-4 @3xl:grid-cols-[18rem_1fr] @3xl:items-start">
            <div className="grid gap-1.5">
              <Label htmlFor="director-from">ตั้งแต่</Label>
              <InputGroup className="bg-card">
                <InputGroupInput
                  id="director-from"
                  className="text-right tabular-nums"
                  {...amount}
                />
                <InputGroupAddon align="inline-end">บาท</InputGroupAddon>
              </InputGroup>
            </div>

            {/* เขียนกฎออกมาเป็นสองบรรทัดที่ครอบคลุมทุกยอด ไม่ใช่บอกแค่ฝั่งเดียว
                แล้วปล่อยให้เดาเองว่ายอดที่เท่ากับเส้นพอดีอยู่ข้างไหน */}
            <dl className="grid gap-2 rounded-xl bg-surface p-4 text-sm">
              <div className="flex flex-wrap items-baseline gap-x-2">
                <dt className="text-muted-foreground">
                  ต่ำกว่า {formatBaht(config.directorFromBaht)} บาท
                </dt>
                <dd className="font-medium">
                  ไม่ต้องอนุมัติ — {APPROVAL_ROLE_LABEL.procurement} สร้างใบแล้วจบ
                </dd>
              </div>
              <div className="flex flex-wrap items-baseline gap-x-2">
                <dt className="text-muted-foreground">
                  ตั้งแต่ {formatBaht(config.directorFromBaht)} บาทขึ้นไป
                </dt>
                <dd className="font-medium">
                  {APPROVAL_ROLE_LABEL.factoryManager} →{" "}
                  <span className="text-primary">
                    {APPROVAL_ROLE_LABEL.director}
                  </span>
                </dd>
              </div>
              <p className="mt-1 text-muted-foreground">
                ยอดที่เท่ากับ {formatBaht(config.directorFromBaht)} บาทพอดี
                ถือว่า<span className="text-foreground">ต้องอนุมัติ</span>
              </p>
            </dl>
          </div>

          {/* ---------- ผลกระทบกับใบจริง ----------
              ตัวเลขวงเงินลอย ๆ บอกไม่ได้ว่าตั้งแล้วงานกรรมการจะหนักขึ้นแค่ไหน
              ทาบกับใบสั่งซื้อที่มีอยู่จริงให้เห็นทันทีตอนขยับเลข */}
          <div className="mt-4 border-t border-border pt-4">
            <p className="text-sm font-medium">
              ใบสั่งซื้อในระบบตอนนี้ {impact.total} ใบ
            </p>
            <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm">
              <p>
                <span className="text-muted-foreground">ต้องอนุมัติ </span>
                <span className="font-semibold text-primary tabular-nums">
                  {impact.needsApproval}
                </span>
                <span className="text-muted-foreground"> ใบ</span>
              </p>
              <p>
                <span className="text-muted-foreground">
                  ไม่ต้องอนุมัติ{" "}
                </span>
                <span className="font-semibold tabular-nums">
                  {impact.noApproval}
                </span>
                <span className="text-muted-foreground"> ใบ</span>
              </p>
            </div>

            <p className="mt-2 text-sm text-muted-foreground">
              ยอดต่อใบอยู่ระหว่าง{" "}
              <span className="text-foreground tabular-nums">
                {formatBaht(impact.min)}
              </span>{" "}
              –{" "}
              <span className="text-foreground tabular-nums">
                {formatBaht(impact.max)}
              </span>{" "}
              บาท
              {impact.needsApproval === impact.total && impact.total > 0 && (
                <>
                  {" — ทุกใบสูงกว่าวงเงินที่ตั้งไว้ ถ้าอยากให้บางใบไม่ต้องอนุมัติ"}
                  {" ต้องตั้งเส้นสูงกว่า "}
                  <span className="text-foreground tabular-nums">
                    {formatBaht(impact.min)}
                  </span>
                </>
              )}
            </p>

            <p className="mt-3 text-sm text-muted-foreground">
              ใบที่ยอดใกล้เส้นที่สุด — ขยับวงเงินนิดเดียวกลุ่มนี้จะสลับฝั่งก่อนใคร
            </p>
            <div className="mt-2 overflow-hidden rounded-xl border border-border">
              {impact.nearest.map((r) => (
                <div
                  key={r.doc.id}
                  className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-t border-border px-3 py-2.5 text-sm first:border-0"
                >
                  <span className="font-medium">{r.doc.code}</span>
                  <span className="tabular-nums">{formatBaht(r.total)} บาท</span>
                  <span
                    className={cn(
                      "w-32 shrink-0 text-end",
                      r.needsApproval ? "text-primary" : "text-muted-foreground"
                    )}
                  >
                    {r.needsApproval ? "ต้องอนุมัติ" : "ไม่ต้องอนุมัติ"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- ผู้มีสิทธิ์อนุมัติ ---------- */}
        <section className="mt-4 rounded-xl border border-border bg-card p-4 sm:p-5">
          <h2 className="text-base font-semibold">ผู้มีสิทธิ์อนุมัติ</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            เฉพาะใบที่ถึงวงเงิน สองชั้นเท่านั้น ไล่จากบนลงล่าง
          </p>

          <div className="mt-4 space-y-4">
            {APPROVAL_LAYERS.map((layer, i) => (
              <LayerBox
                key={layer}
                step={i + 1}
                layer={layer}
                names={config.approvers[layer]}
                onChange={(next) => setApprovers(layer, next)}
              />
            ))}
          </div>

          {/* Procurement ไม่ได้อยู่ในสาย แต่ต้องอธิบายไว้ ไม่งั้นคนอ่านจะคิดว่าลืมใส่
              แล้วไปเพิ่มเองจนกลายเป็นคนสร้างใบอนุมัติใบตัวเอง */}
          <div className="mt-4 rounded-xl border border-dashed border-border px-4 py-3">
            <p className="text-sm font-medium">
              {APPROVAL_ROLE_LABEL.procurement} — ใบที่ต่ำกว่า{" "}
              {formatBaht(config.directorFromBaht)} บาท
            </p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              ฝ่ายจัดซื้อสร้างใบแล้วจบในตัว ไม่ต้องให้ใครอนุมัติ จึงไม่มีรายชื่อ
              ให้ตั้ง — อำนาจของชั้นนี้คือวงเงินด้านบน ไม่ใช่การไปเซ็นรับรองใบของคนอื่น
            </p>
          </div>
        </section>
      </main>

      {/* ---------- แถบปุ่มล่าง ---------- */}
      <div className="sticky bottom-0 z-30 border-t border-border bg-surface">
        <div className="mx-auto w-full max-w-7xl px-4 py-3 sm:px-8">
          <div className="flex flex-col gap-3 @lg:hidden">
            {dirty && (
              <Button
                variant="outline-primary"
                className="w-full"
                onClick={() => setConfig(DEFAULT_APPROVAL_CONFIG)}
              >
                <RotateCcwIcon />
                คืนค่าเริ่มต้น
              </Button>
            )}
            <div className="flex items-center gap-3">
              <Button
                variant="outline-primary"
                className="flex-1"
                onClick={() => router.back()}
              >
                ย้อนกลับ
              </Button>
              <Button className="flex-1" onClick={() => save(config, impact)}>
                บันทึก
              </Button>
            </div>
          </div>

          <div className="hidden items-center justify-between gap-3 @lg:flex">
            <Button variant="outline-primary" onClick={() => router.back()}>
              ย้อนกลับ
            </Button>
            <div className="flex items-center gap-3">
              <Button
                variant="outline-primary"
                disabled={!dirty}
                onClick={() => setConfig(DEFAULT_APPROVAL_CONFIG)}
              >
                <RotateCcwIcon />
                คืนค่าเริ่มต้น
              </Button>
              <Button onClick={() => save(config, impact)}>บันทึก</Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function save(
  config: ApprovalConfig,
  impact: ReturnType<typeof approvalImpact>
) {
  toast.success("บันทึกการตั้งค่าการอนุมัติแล้ว", {
    description: `ต้องอนุมัติตั้งแต่ ${formatBaht(config.directorFromBaht)} บาทขึ้นไป · กระทบ ${impact.needsApproval} ใบจาก ${impact.total} ใบ`,
  });
}

/** ชั้นอนุมัติหนึ่งชั้น พร้อมรายชื่อผู้มีสิทธิ์ */
function LayerBox({
  step,
  layer,
  names,
  onChange,
}: {
  step: number;
  layer: ApproverLayer;
  names: string[];
  onChange: (next: string[]) => void;
}) {
  const [draft, setDraft] = React.useState("");
  const trimmed = draft.trim();
  const duplicate = names.includes(trimmed);

  function add() {
    if (trimmed === "" || duplicate) return;
    onChange([...names, trimmed]);
    setDraft("");
  }

  return (
    <div className="rounded-xl border border-border p-4">
      <div className="flex flex-wrap items-baseline gap-x-2">
        {/* ลำดับชั้นมีความหมายจริง ใบไล่จากชั้น 1 ไป 2 จึงใส่เลขกำกับ */}
        <span className="font-mono text-sm text-primary">ชั้น {step}</span>
        <h3 className="font-semibold">{APPROVAL_ROLE_LABEL[layer]}</h3>
        <span className="text-sm text-muted-foreground">
          {APPROVAL_ROLE_TH[layer]}
        </span>

      </div>

      {names.length === 0 ? (
        <p className="mt-3 rounded-lg border border-dashed border-border px-3 py-4 text-center text-sm text-danger-strong">
          ยังไม่มีผู้มีสิทธิ์อนุมัติในชั้นนี้
        </p>
      ) : (
        <ul className="mt-3 grid gap-2">
          {names.map((n) => (
            <li
              key={n}
              className="flex items-center gap-2 rounded-lg bg-surface px-3 py-2"
            >
              <span className="min-w-0 flex-1 truncate text-sm">{n}</span>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`เอา ${n} ออกจาก ${APPROVAL_ROLE_LABEL[layer]}`}
                className="shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                onClick={() => onChange(names.filter((x) => x !== n))}
              >
                <Trash2Icon />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-3 flex items-start gap-2">
        <div className="grid min-w-0 flex-1 gap-1.5">
          <InputGroup className="bg-card">
            <InputGroupAddon align="inline-start">
              <UserPlusIcon />
            </InputGroupAddon>
            <InputGroupInput
              aria-label={`เพิ่มผู้มีสิทธิ์อนุมัติชั้น ${APPROVAL_ROLE_LABEL[layer]}`}
              placeholder="ชื่อผู้มีสิทธิ์อนุมัติ"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  add();
                }
              }}
            />
          </InputGroup>
          {duplicate && (
            <p className="text-sm text-danger-strong">
              {trimmed} อยู่ในชั้นนี้แล้ว
            </p>
          )}
        </div>
        <Button
          variant="outline-primary"
          className="shrink-0"
          disabled={trimmed === "" || duplicate}
          onClick={add}
        >
          <PlusIcon />
          เพิ่ม
        </Button>
      </div>
    </div>
  );
}
