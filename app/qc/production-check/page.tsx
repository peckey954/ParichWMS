"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckIcon, FlaskConicalIcon, SearchIcon } from "lucide-react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@peckey954/ui/components/ui/alert";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@peckey954/ui/components/ui/breadcrumb";
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
import { ROW_HOVER_NAV } from "@/components/stock/doc-parts";
import { PROD_STEP, type ProdStep } from "@/lib/qc-erp";
import {
  LOTS,
  currentStage,
  demoTemplate,
  pendingCount,
  stageStateOf,
  stagesOfQueue,
  type Lot,
} from "@/lib/qc-production-demo";

/* ------------------------------------------------------------------
   คิวตรวจของใบสั่งผลิต — หนึ่งแถวต่อหนึ่งใบ ไม่ใช่หนึ่งแถวต่อหนึ่งขั้น

   สามขั้นอ้างใบสั่งผลิตใบเดียวกัน แตกเป็นสามแถวแล้วจะได้เลขซ้ำสามรอบ
   ซึ่งกวาดตาแล้วแยกไม่ออกว่าอันไหนคืออันไหน รวมเป็นแถวเดียวแล้วเอาขั้นมา
   เป็นชิปในแถว ได้ทั้งตัวตนของใบและความคืบหน้าในบรรทัดเดียว

   ชิปเรียงตามลำดับจริงและกดได้ทีละอัน ขั้นที่ยังไม่ถึงคิวกดไม่ได้ —
   ตรวจหลังผลิตทั้งที่ยังไม่ได้ตรวจก่อนผลิตคือตรวจของที่ยังไม่มี

   ขั้นมาจาก tpl.stages ของเทมเพลตจริง ไม่ได้ตั้งซ้ำไว้ที่นี่
------------------------------------------------------------------ */

export default function ProductionCheckPage() {
  const router = useRouter();
  const [tab, setTab] = React.useState("pending");
  const [query, setQuery] = React.useState("");
  const [, bump] = React.useReducer((n: number) => n + 1, 0);

  const tpl = demoTemplate();
  const stages = stagesOfQueue();

  const q = query.trim().toLowerCase();
  const rows = LOTS.filter((l) => {
    const open = currentStage(l) !== null;
    if (tab === "pending" ? !open : open) return false;
    return (
      q === "" ||
      l.code.toLowerCase().includes(q) ||
      l.material.toLowerCase().includes(q) ||
      l.product.toLowerCase().includes(q)
    );
  });

  return (
    <main className="@container mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage className="text-primary">
              ตรวจสอบสินค้าสำเร็จรูป
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <h1 className="mt-3 text-2xl font-semibold tracking-tight">
        ตรวจสอบสินค้าสำเร็จรูป
      </h1>
      {/* บอกว่าเมนูนี้เดินตามเทมเพลตไหน ไม่งั้นพอหัวข้อตรวจเปลี่ยนจะหาไม่เจอ
          ว่าไปแก้ที่ไหน */}
      <p className="mt-1 text-sm text-muted-foreground">
        เดินตามเทมเพลต{" "}
        <Link
          href="/qc/setup-erp/t-inproc"
          className="text-primary underline underline-offset-2"
        >
          {tpl?.name ?? "—"}
        </Link>{" "}
        · {stages.length} ขั้น · {tpl?.rows.length ?? 0} หัวข้อต่อขั้น
      </p>

      <Alert className="mt-4">
        <FlaskConicalIcon />
        <AlertTitle>หน้านี้เป็นตัวอย่าง ไม่ได้ต่อกับข้อมูลจริง</AlertTitle>
        <AlertDescription>
          ขั้นที่ต้องตรวจอ่านมาจากเทมเพลตจริง เพิ่มหรือลดจุดในหน้าตั้งค่าแล้ว
          ชิปในตารางนี้เปลี่ยนตามทันที
        </AlertDescription>
      </Alert>

      <Tabs value={tab} onValueChange={setTab} className="mt-5">
        <TabsList className="w-full">
          {/* นับเป็น "ใบที่ยังมีงานค้าง" ไม่ใช่ "จำนวนขั้นที่ค้าง" เพราะตารางนี้
              หนึ่งแถวคือหนึ่งใบ ตัวเลขบนแท็บกับจำนวนแถวต้องตรงกัน */}
          <TabsTrigger value="pending" className="flex-1">
            รอตรวจ ({pendingCount()})
          </TabsTrigger>
          <TabsTrigger value="done" className="flex-1">
            ตรวจครบแล้ว ({LOTS.length - pendingCount()})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <InputGroup className="mt-4 w-full max-w-sm bg-card">
        <InputGroupAddon align="inline-start">
          <SearchIcon />
        </InputGroupAddon>
        <InputGroupInput
          placeholder="ค้นหาเลขที่ใบผลิตหรือวัตถุดิบ..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </InputGroup>

      <div className="mt-4 overflow-x-auto rounded-xl border border-border bg-card">
        <Table className="min-w-[980px]">
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-44">เลขที่ใบผลิต</TableHead>
              <TableHead className="min-w-24">ไลน์ผลิต</TableHead>
              <TableHead className="min-w-20">รอบ</TableHead>
              <TableHead className="min-w-32">วัตถุดิบ</TableHead>
              <TableHead className="min-w-28">รอตรวจสอบ</TableHead>
              <TableHead className="min-w-80">ขั้นการตรวจ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((lot) => (
              <TableRow
                key={lot.id}
                className={cn("cursor-pointer", ROW_HOVER_NAV)}
                onClick={() => router.push(`/qc/production-check/${lot.id}`)}
              >
                <TableCell>
                  <span className="font-medium">{lot.code}</span>
                  <span className="block text-sm text-muted-foreground">
                    {lot.createdAt}
                  </span>
                </TableCell>
                <TableCell>{lot.line}</TableCell>
                <TableCell>{lot.round}</TableCell>
                <TableCell>
                  <span>{lot.material}</span>
                  <span className="block text-sm text-muted-foreground">
                    {lot.materialNote}
                  </span>
                </TableCell>
                <TableCell className="tabular-nums">
                  {lot.ton.toFixed(2)} ตัน
                </TableCell>
                {/* ชิปกินคลิกเอง ไม่ให้ไหลขึ้นไปเปิดแถว เพราะกดชิปคือเจาะไปขั้นนั้น
                    ส่วนกดที่ว่างของแถวคือเปิดดูทั้งใบ เป็นคนละเจตนา */}
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <StageChips lot={lot} onChanged={bump} />
                </TableCell>
              </TableRow>
            ))}

            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-14 text-center">
                  <p className="font-medium">ไม่มีข้อมูล</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {tab === "pending"
                      ? "ไม่มีใบที่รอตรวจ"
                      : "ยังไม่มีใบที่ตรวจครบทุกขั้น"}
                  </p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <p className="mt-3 text-sm text-muted-foreground">
        ✓ ตรวจแล้ว · ● ถึงคิวแล้ว กดเพื่อตรวจ · ○ ยังไม่ถึงคิว
      </p>
    </main>
  );
}

/* ------------------------------------------------------------------
   สามขั้นในแถวเดียว — สถานะอ่านจากผลที่บันทึกไว้ ไม่ได้เก็บแยก
------------------------------------------------------------------ */

function StageChips({ lot, onChanged }: { lot: Lot; onChanged: () => void }) {
  const router = useRouter();
  void onChanged;

  return (
    <div className="flex flex-wrap gap-1.5">
      {stagesOfQueue().map((s) => (
        <StageChip key={s} lot={lot} stage={s} onOpen={() =>
          router.push(`/qc/production-check/${lot.id}?stage=${s}`)
        } />
      ))}
    </div>
  );
}

function StageChip({
  lot,
  stage,
  onOpen,
}: {
  lot: Lot;
  stage: ProdStep;
  onOpen: () => void;
}) {
  const state = stageStateOf(lot, stage);
  const res = lot.done[stage];
  // ชื่อขั้นตัดคำว่าอะไรในวงเล็บออก ชิปในตารางต้องสั้นพอให้สามอันอยู่บรรทัดเดียว
  const label = PROD_STEP[stage].label;

  return (
    <button
      type="button"
      disabled={state === "locked"}
      onClick={onOpen}
      title={
        state === "locked"
          ? "ยังไม่ถึงคิว — ต้องตรวจขั้นก่อนหน้าให้เสร็จก่อน"
          : state === "done"
            ? `${res?.qi} · ${res?.at} · ${res?.by}`
            : "ถึงคิวแล้ว กดเพื่อตรวจ"
      }
      className={cn(
        "flex min-h-8 items-center gap-1.5 rounded-full border px-3 text-sm whitespace-nowrap transition-colors",
        state === "done" &&
          (res?.verdict === "fail"
            ? "border-danger-border bg-danger text-danger-strong"
            : "border-success-border bg-success text-success-strong"),
        state === "current" &&
          "border-primary bg-brand font-medium text-primary hover:bg-accent-hover",
        // จางและกดไม่ได้ ไม่ใช่ซ่อน — ต้องเห็นว่ายังเหลืออีกกี่ขั้น
        state === "locked" && "border-dashed border-border text-muted-foreground"
      )}
    >
      {state === "done" && <CheckIcon className="size-3.5" />}
      {state === "current" && (
        <span className="size-1.5 rounded-full bg-primary" />
      )}
      {state === "locked" && (
        <span className="size-1.5 rounded-full border border-current" />
      )}
      {label}
    </button>
  );
}
