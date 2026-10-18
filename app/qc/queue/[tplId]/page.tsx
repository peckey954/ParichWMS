"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  CheckIcon,
  FlaskConicalIcon,
  ListFilterIcon,
  SearchIcon,
} from "lucide-react";
import { Badge } from "@peckey954/ui/components/ui/badge";
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
import { Button } from "@peckey954/ui/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@peckey954/ui/components/ui/dialog";
import { Label } from "@peckey954/ui/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@peckey954/ui/components/ui/tabs";
import { cn } from "@peckey954/ui/lib/utils";
import { ChipGroup } from "@/components/chip-group";
import { DateSelect, formatDateSlash } from "@/components/date-select";
import { MultiSelectChips } from "@/components/multi-select-chips";
import { ROW_HOVER_NAV } from "@/components/stock/doc-parts";
import { REF_MENU, type DocField, type QiTemplate } from "@/lib/qc-erp";
import {
  LOTS,
  checkpointsOfQueue,
  currentCheckpoint,
  queueTemplate,
  pendingCount,
  headerLabelOf,
  headerValueOf,
  resultsOf,
  type Checkpoint,
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

export default function QcQueuePage() {
  const router = useRouter();
  const params = useParams<{ tplId: string }>();
  const [tab, setTab] = React.useState("pending");
  const [query, setQuery] = React.useState("");
  const [date, setDate] = React.useState<Date | undefined>();
  const [filter, setFilter] = React.useState<QueueFilter>(NO_FILTER);

  const tplId = params.tplId;
  const tpl = queueTemplate(tplId);
  const points = checkpointsOfQueue(tplId);

  const fields = filterFields(tpl);
  const inspectors = inspectorsOf(tplId);
  const day = date ? formatDateSlash(date) : "";
  const filterActive = isFiltered(filter);

  const q = query.trim().toLowerCase();
  const rows = LOTS.filter((l) => {
    const open = currentCheckpoint(l, tplId);
    if (tab === "pending" ? !open : open) return false;
    if (day && !l.createdAt.startsWith(day)) return false;
    if (!matches(l, tplId, filter, fields, tab === "pending" ? open : null))
      return false;
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
              {tpl?.name ?? "คิวตรวจ"}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <h1 className="mt-3 text-2xl font-semibold tracking-tight">
        {tpl?.name ?? "คิวตรวจ"}
      </h1>
      {/* บอกว่าเมนูนี้เดินตามเทมเพลตไหน ไม่งั้นพอหัวข้อตรวจเปลี่ยนจะหาไม่เจอ
          ว่าไปแก้ที่ไหน */}
      <p className="mt-1 text-sm text-muted-foreground">
        เดินตามเทมเพลต{" "}
        <Link
          href={`/qc/setup-erp/${tplId}`}
          className="text-primary underline underline-offset-2"
        >
          {tpl?.name ?? "—"}
        </Link>{" "}
        · {points.length} จุดตรวจ · {tpl?.rows.length ?? 0} หัวข้อต่อขั้น
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
            รอตรวจ ({pendingCount(tplId)})
          </TabsTrigger>
          <TabsTrigger value="done" className="flex-1">
            ตรวจครบแล้ว ({LOTS.length - pendingCount(tplId)})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="mt-4 flex flex-wrap items-center gap-2 @3xl:flex-nowrap">
        <InputGroup className="w-full min-w-0 bg-card @3xl:flex-1">
          <InputGroupAddon align="inline-start">
            <SearchIcon />
          </InputGroupAddon>
          <InputGroupInput
            placeholder={`ค้นหาเลขที่${
              tpl && tpl.refMenu !== "" ? REF_MENU[tpl.refMenu].label : "ใบผลิต"
            }หรือวัตถุดิบ...`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </InputGroup>
        <div className="flex w-full items-center gap-2 @3xl:w-auto">
          <DateSelect
            className="min-w-0 flex-1 @3xl:w-64 @3xl:flex-none"
            placeholder="วันที่สั่งผลิต"
            value={date}
            onValueChange={setDate}
          />
          <QueueFilterButton
            value={filter}
            active={filterActive}
            onApply={setFilter}
            fields={fields}
            inspectors={inspectors}
            // จุดที่รอตรวจมีความหมายเฉพาะแท็บรอตรวจ ใบที่ครบแล้วไม่มีจุดค้าง
            checkpoints={tab === "pending" ? points : []}
          />
        </div>
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-border bg-card">
        <Table className="min-w-[980px]">
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-44">เลขที่ใบผลิต</TableHead>
              <TableHead className="min-w-24">ไลน์ผลิต</TableHead>
              <TableHead className="min-w-20">รอบ</TableHead>
              <TableHead className="min-w-32">วัตถุดิบ</TableHead>
              <TableHead className="min-w-28">รอตรวจสอบ</TableHead>
              <TableHead className="min-w-44">สถานะ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((lot) => (
              <TableRow
                key={lot.id}
                className={cn("cursor-pointer", ROW_HOVER_NAV)}
                onClick={() => router.push(`/qc/queue/${tplId}/${lot.id}`)}
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
                <TableCell>
                  <StageStatus lot={lot} tplId={tplId} />
                </TableCell>
              </TableRow>
            ))}

            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-14 text-center">
                  <p className="font-medium">ไม่มีข้อมูล</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {filterActive || day || q
                      ? "ไม่มีใบที่ตรงกับตัวกรอง ลองล้างตัวกรองหรือเลือกวันอื่น"
                      : tab === "pending"
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
   สถานะของใบ — โชว์เฉพาะจุดที่รอทำอยู่ จุดเดียว

   เคยโชว์ทุกจุดเป็นชิปเรียงกัน ซึ่งบอกความคืบหน้าได้ดีแต่ทำให้ตารางอ่านยาก
   เพราะแต่ละแถวมีของให้กวาดตาสี่ชิ้นทั้งที่ทำได้ทีละชิ้น คิวคือรายการงาน
   ที่ต้องทำตอนนี้ ไม่ใช่รายงานความคืบหน้า — ความคืบหน้าทั้งใบดูในหน้าใบ

   สถานะอ่านจากผลที่บันทึกไว้ ไม่ได้เก็บแยก
------------------------------------------------------------------ */

function StageStatus({ lot, tplId }: { lot: Lot; tplId: string }) {
  const open = currentCheckpoint(lot, tplId);

  if (!open)
    return (
      <Badge appearance="soft" tone="success">
        <CheckIcon className="size-3.5" />
        ตรวจครบแล้ว
      </Badge>
    );

  // ชื่อจุดอย่างเดียวพอ ขึ้นต้นว่า "รอตรวจ" ทุกแถวแล้วอ่านซ้ำโดยไม่ได้อะไรเพิ่ม
  // แต่คอลัมน์ชื่อสถานะ จึงต้องมีคำว่ารออยู่ ไม่งั้นอ่านเป็นชื่อขั้นเฉย ๆ
  return (
    <Badge appearance="soft" tone="warning">
      รอตรวจ{open.operation ?? open.label}
    </Badge>
  );
}


/* ------------------------------------------------------------------
   ตัวกรองที่งอกจากเทมเพลต

   ไม่ได้เขียนตัวกรองไว้รายหน้า — หน้าคิวนี้ใช้ร่วมกันทุกเทมเพลต ตัวกรองจึง
   อ่านจากสิ่งที่ตั้งไว้ในเทมเพลตเอง

     ทุกเทมเพลตมีเหมือนกัน  ผลตรวจ · ผู้ตรวจ · วันที่
     จากช่วงการตรวจ        จุดที่รอตรวจ (ก่อน / ระหว่าง·ขั้นตอน / หลังผลิต)
     จากส่วนหัวเอกสาร      ช่องแบบ "ดึงจากระบบ" ทุกช่อง เช่น สินค้า เครื่องจักร

   ตัวเลือกในแต่ละช่องอ่านจากข้อมูลในตาราง ไม่ใช่รายการทั้งระบบ — กรองแล้ว
   ต้องเจออะไรสักอย่างเสมอ ตัวเลือกที่ไม่มีแถวไหนมีคือตัวเลือกหลอก

   ช่องหัวเอกสารแบบ "ข้อความ" ไม่ทำเป็นตัวกรอง คนพิมพ์กันคนละแบบ ได้ตัวเลือก
   ซ้ำกันเต็มไปหมด ให้ใช้ช่องค้นหาแทน และไม่ทำตัวกรองรายหัวข้อตรวจ หัวข้อ
   ยี่สิบข้อจะกลายเป็นตัวกรองยี่สิบช่อง ใช้ "ผลตรวจ: มีข้อไม่ผ่าน" แทน
------------------------------------------------------------------ */

type ResultFilter = "all" | "fail" | "pass" | "none";

type QueueFilter = {
  result: ResultFilter;
  /** Checkpoint.key ของจุดที่รอตรวจอยู่ */
  checkpoints: string[];
  inspectors: string[];
  /** id ของช่องหัวเอกสาร → ค่าที่เลือก */
  header: Record<string, string[]>;
};

const NO_FILTER: QueueFilter = {
  result: "all",
  checkpoints: [],
  inspectors: [],
  header: {},
};

type FilterField = { field: DocField; label: string; options: string[] };

/** ช่องหัวเอกสารที่กรองได้ พร้อมตัวเลือกที่อ่านจากล็อตในตาราง */
function filterFields(tpl: QiTemplate | undefined): FilterField[] {
  if (!tpl?.headerOn) return [];
  return tpl.header.flatMap((field) => {
    if (field.kind !== "system" || field.source === "") return [];
    const source = field.source;
    const options = [
      ...new Set(LOTS.map((l) => headerValueOf(l, source)).filter(Boolean)),
    ].sort((a, b) => a.localeCompare(b, "th"));
    // แหล่งที่ล็อตไม่มีค่าให้เลย ทำตัวกรองไปก็เลือกอะไรไม่ได้
    if (options.length === 0) return [];
    return [{ field, label: headerLabelOf(source), options }];
  });
}

/** คนที่เคยตรวจใบของเทมเพลตนี้ — อ่านจากผลที่บันทึกไว้จริง */
const inspectorsOf = (tplId: string) =>
  [...new Set(LOTS.flatMap((l) => resultsOf(l, tplId).map((r) => r.by)))].sort(
    (a, b) => a.localeCompare(b, "th")
  );

const isFiltered = (f: QueueFilter) =>
  f.result !== "all" ||
  f.checkpoints.length > 0 ||
  f.inspectors.length > 0 ||
  Object.values(f.header).some((v) => v.length > 0);

function matches(
  lot: Lot,
  tplId: string,
  f: QueueFilter,
  fields: FilterField[],
  open: Checkpoint | null
) {
  const results = resultsOf(lot, tplId);
  if (f.result === "fail" && !results.some((r) => r.verdict === "fail"))
    return false;
  if (
    f.result === "pass" &&
    (results.length === 0 || results.some((r) => r.verdict === "fail"))
  )
    return false;
  if (f.result === "none" && results.length > 0) return false;

  // แท็บตรวจครบแล้วไม่มีจุดค้าง open จึงว่าง — ตัวกรองนี้ข้ามไป ไม่ใช่ซ่อนทุกแถว
  if (open && f.checkpoints.length > 0 && !f.checkpoints.includes(open.key))
    return false;
  if (
    f.inspectors.length > 0 &&
    !results.some((r) => f.inspectors.includes(r.by))
  )
    return false;

  // ช่องที่ตั้งไว้ในเทมเพลตแล้วถูกลบทีหลัง ค่าที่เลือกค้างไว้ไม่มีผล
  for (const { field } of fields) {
    const picked = f.header[field.id] ?? [];
    if (field.source === "" || picked.length === 0) continue;
    if (!picked.includes(headerValueOf(lot, field.source))) return false;
  }
  return true;
}

/* กล่องตัวกรองกลางจอ ชุดเดียวกับหน้าอื่น — แก้ในกล่องก่อน กดตกลงถึงมีผล
   จุดบนปุ่มบอกว่ามีอะไรถูกเปลี่ยนไว้ ไม่บอกว่ากี่อย่าง */
function QueueFilterButton({
  value,
  active,
  onApply,
  fields,
  inspectors,
  checkpoints,
}: {
  value: QueueFilter;
  active: boolean;
  onApply: (next: QueueFilter) => void;
  fields: FilterField[];
  inspectors: string[];
  checkpoints: Checkpoint[];
}) {
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState(value);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setDraft(value);
      }}
    >
      <DialogTrigger asChild>
        <Button
          variant="outline-primary"
          size="icon"
          aria-label="ตัวกรอง"
          className="relative shrink-0"
        >
          <ListFilterIcon />
          {active && (
            <span className="absolute top-1 right-1 size-2 rounded-full bg-primary" />
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="flex max-h-[85svh] flex-col sm:max-w-md">
        <DialogHeader className="text-left">
          <DialogTitle>ตัวกรอง</DialogTitle>
          <DialogDescription>
            ช่องตัวกรองมาจากที่ตั้งไว้ในเทมเพลต ตัวเลือกมาจากข้อมูลในตาราง
          </DialogDescription>
        </DialogHeader>

        <div className="-mx-6 min-h-0 flex-1 space-y-4 overflow-y-auto px-6">
          <div className="space-y-1.5">
            <Label>ผลตรวจ</Label>
            <ChipGroup
              label="ผลตรวจ"
              value={draft.result}
              onChange={(result) => setDraft((d) => ({ ...d, result }))}
              options={[
                { id: "all" as const, label: "ทั้งหมด" },
                { id: "fail" as const, label: "มีข้อไม่ผ่าน" },
                { id: "pass" as const, label: "ผ่านทุกจุดที่ตรวจ" },
                { id: "none" as const, label: "ยังไม่ได้ตรวจ" },
              ]}
            />
          </div>

          {checkpoints.length > 1 && (
            <div className="space-y-1.5">
              <Label htmlFor="flt-cp">จุดที่รอตรวจ</Label>
              <MultiSelectChips
                id="flt-cp"
                className="w-full bg-card"
                placeholder="ทุกจุด"
                options={checkpoints.map((c) => ({ label: c.label, value: c.key }))}
                value={draft.checkpoints}
                onValueChange={(checkpoints) =>
                  setDraft((d) => ({ ...d, checkpoints }))
                }
              />
            </div>
          )}

          {fields.map(({ field, label, options }) => (
            <div key={field.id} className="space-y-1.5">
              <Label htmlFor={`flt-${field.id}`}>{label}</Label>
              <MultiSelectChips
                id={`flt-${field.id}`}
                className="w-full bg-card"
                placeholder={`ทุก${label}`}
                options={options.map((o) => ({ label: o, value: o }))}
                value={draft.header[field.id] ?? []}
                onValueChange={(v) =>
                  setDraft((d) => ({ ...d, header: { ...d.header, [field.id]: v } }))
                }
              />
            </div>
          ))}

          {inspectors.length > 0 && (
            <div className="space-y-1.5">
              <Label htmlFor="flt-by">ผู้ตรวจ</Label>
              <MultiSelectChips
                id="flt-by"
                className="w-full bg-card"
                placeholder="ทุกคน"
                options={inspectors.map((p) => ({ label: p, value: p }))}
                value={draft.inspectors}
                onValueChange={(inspectors) => setDraft((d) => ({ ...d, inspectors }))}
              />
            </div>
          )}
        </div>

        <DialogFooter className="flex-row justify-between gap-2 sm:justify-between">
          <Button variant="ghost" onClick={() => setDraft(NO_FILTER)}>
            ล้างตัวกรอง
          </Button>
          <Button
            onClick={() => {
              onApply(draft);
              setOpen(false);
            }}
          >
            ตกลง
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
