"use client";

import * as React from "react";
import { MinusIcon, PlusIcon, TriangleAlertIcon, Trash2Icon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@peckey954/ui/components/ui/alert";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@peckey954/ui/components/ui/breadcrumb";
import { Button } from "@peckey954/ui/components/ui/button";
import { Card, CardContent } from "@peckey954/ui/components/ui/card";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@peckey954/ui/components/ui/input-group";
import { Input } from "@peckey954/ui/components/ui/input";
import { Label } from "@peckey954/ui/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@peckey954/ui/components/ui/select";
import { Separator } from "@peckey954/ui/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@peckey954/ui/components/ui/table";
import { Textarea } from "@peckey954/ui/components/ui/textarea";
import { toast } from "sonner";
import { AddMaterialDialog } from "@/components/production/add-material-dialog";
import { useNumberField } from "@/components/number-field";
import { StatusBadge } from "@/components/status-badge";
import { formatDateTime, formatNumber, formatTon } from "@/lib/format";
import {
  SEED_ORDER,
  stockTon,
  usedTon,
  type MaterialLine,
} from "@/lib/production-order";

export default function ProductionOrderPage() {
  const [order, setOrder] = React.useState(SEED_ORDER);

  const patchMaterial = (id: string, patch: Partial<MaterialLine>) =>
    setOrder((o) => ({
      ...o,
      materials: o.materials.map((m) => (m.id === id ? { ...m, ...patch } : m)),
    }));

  const removeMaterial = (id: string) =>
    setOrder((o) => ({
      ...o,
      materials: o.materials.filter((m) => m.id !== id),
    }));

  const addMaterial = (line: MaterialLine) =>
    setOrder((o) => ({ ...o, materials: [...o.materials, line] }));

  const overStock = order.materials.filter((m) => m.useQty > m.stockQty);
  const sweepRows = order.materials.filter((m) => m.sweepable);

  function handleSave() {
    if (overStock.length > 0) {
      toast.error("บันทึกไม่ได้ — มีรายการที่ใช้เกินจำนวนคงเหลือ");
      return;
    }
    toast.success(`บันทึกใบผลิต ${order.code} แล้ว`, {
      description: `ปริมาณผลิตได้จริง ${formatTon(order.actualTon)} ตัน`,
    });
  }

  return (
    <>
      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">ระบบ</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/production/packing">
                ผลิตแบ่งบรรจุ
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-primary">ใบผลิต</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <h1 className="mt-4 text-2xl font-semibold tracking-tight">
          ใบผลิต {order.code}
        </h1>
        <div className="mt-1.5 flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            {formatDateTime(order.createdAt)}
          </span>
          <StatusBadge status={order.status} />
        </div>

        {/* ---------- ข้อมูลสูตร / ยอดสั่งผลิต ---------- */}
        <Card className="mt-5">
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-medium">{order.formula}</span>
                <Separator orientation="vertical" className="h-4!" />
                <span className="text-sm">{order.packing}</span>
                <Separator orientation="vertical" className="h-4!" />
                <span className="text-sm">{order.bagSize}</span>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className="font-medium">{order.line}</span>
                <span>
                  <span className="text-muted-foreground">รอบ: </span>
                  {order.round}
                </span>
              </div>
            </div>

            <div className="grid gap-4 rounded-lg bg-muted p-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">สั่งผลิต (ตัน)</p>
                <p className="mt-1 text-lg font-semibold">
                  {formatTon(order.orderedTon)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  ปริมาณผลิต (ตัน)
                </p>
                <p className="mt-1 text-lg font-semibold">
                  {formatTon(order.plannedTon)}
                </p>
              </div>
            </div>

            <p className="text-sm">
              <span className="text-muted-foreground">ผู้สั่งผลิต: </span>
              <span className="font-medium">{order.requesterName}</span>
            </p>
          </CardContent>
        </Card>

        {/* ---------- วัตถุดิบ / สินค้าที่ใช้ ---------- */}
        <div className="mt-8 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">วัตถุดิบ/สินค้าที่ใช้ในการผลิต</h2>
          <AddMaterialDialog
            existingIds={order.materials.map((m) => m.id)}
            onAdd={addMaterial}
          />
        </div>

        <Card className="mt-4 py-0">
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">วัตถุดิบ/สินค้า</TableHead>
                  <TableHead className="text-right">แนะนำใช้</TableHead>
                  <TableHead className="min-w-56">Lot</TableHead>
                  <TableHead className="text-right">
                    ปริมาณคงเหลือ
                    <br />
                    ในคลัง
                  </TableHead>
                  <TableHead className="text-right">
                    จำนวนคงเหลือ
                    <br />
                    ในคลัง
                  </TableHead>
                  <TableHead className="text-right">ปริมาณที่ใช้</TableHead>
                  <TableHead className="text-right">จำนวนที่ใช้</TableHead>
                  <TableHead className="w-12 pr-4" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.materials.map((m) => (
                  <MaterialRow
                    key={m.id}
                    material={m}
                    onPatch={(patch) => patchMaterial(m.id, patch)}
                    onRemove={() => removeMaterial(m.id)}
                  />
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {overStock.length > 0 && (
          <Alert variant="destructive" className="mt-4">
            <TriangleAlertIcon />
            <AlertTitle>ใช้เกินจำนวนคงเหลือในคลัง</AlertTitle>
            <AlertDescription>
              {overStock.map((m) => m.name).join(", ")} —
              แก้จำนวนที่ใช้ให้ไม่เกินยอดคงเหลือก่อนบันทึก
            </AlertDescription>
          </Alert>
        )}

        {/* ---------- ปุ๋ยกวาดพื้น ---------- */}
        {sweepRows.length > 0 && (
          <>
            <h2 className="mt-8 text-lg font-semibold">ข้อมูลปุ๋ยกวาดพื้น</h2>
            <Card className="mt-4 py-0">
              <CardContent className="px-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-4">วัตถุดิบ</TableHead>
                      <TableHead className="w-48 text-right">
                        ปริมาณกวาดพื้น
                        <br />
                        (ตัน)
                      </TableHead>
                      <TableHead className="w-40 pr-4 text-right">
                        ปริมาณสูญเสีย
                        <br />
                        (ตัน)
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sweepRows.map((m) => (
                      <SweepRow
                        key={m.id}
                        material={m}
                        onPatch={(patch) => patchMaterial(m.id, patch)}
                      />
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        )}

        {/* ---------- การผลิต ---------- */}
        <h2 className="mt-8 text-lg font-semibold">การผลิต</h2>

        <div className="mt-4 max-w-md space-y-2">
          <Label htmlFor="actual-ton">ปริมาณผลิตได้จริง (ตัน)</Label>
          <TonStepper
            id="actual-ton"
            value={order.actualTon}
            onValueChange={(actualTon) => setOrder((o) => ({ ...o, actualTon }))}
          />
        </div>

        <div className="mt-5 space-y-2">
          <Label htmlFor="note">
            หมายเหตุ{" "}
            <span className="font-normal text-muted-foreground">
              (ไม่บังคับ)
            </span>
          </Label>
          <Textarea
            id="note"
            placeholder="ระบุหมายเหตุ"
            rows={3}
            value={order.note}
            onChange={(e) =>
              setOrder((o) => ({ ...o, note: e.target.value }))
            }
          />
        </div>
      </main>

      {/* ---------- แถบปุ่มล่าง ---------- */}
      <div className="sticky bottom-0 z-30 border-t border-border bg-background">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Button
            variant="outline"
            className="border-primary text-primary hover:text-primary"
          >
            ย้อนกลับ
          </Button>
          <Button onClick={handleSave}>บันทึก</Button>
        </div>
      </div>
    </>
  );
}

function MaterialRow({
  material: m,
  onPatch,
  onRemove,
}: {
  material: MaterialLine;
  onPatch: (patch: Partial<MaterialLine>) => void;
  onRemove: () => void;
}) {
  const qtyField = useNumberField(m.useQty, (useQty) => onPatch({ useQty }));
  const used = usedTon(m);
  const stock = stockTon(m);
  const over = m.useQty > m.stockQty;

  return (
    <TableRow>
      <TableCell className="pl-4 align-top">
        <div className="font-medium">{m.name}</div>
        {m.sub && (
          <div className="text-xs text-muted-foreground">{m.sub}</div>
        )}
      </TableCell>
      <TableCell className="text-right align-top whitespace-nowrap">
        {formatNumber(m.suggestQty, m.suggestDigits)} {m.suggestUnit}
      </TableCell>
      <TableCell className="align-top">
        <Select value={m.lot} onValueChange={(lot) => onPatch({ lot })}>
          <SelectTrigger className="w-full" aria-label={`Lot ของ ${m.name}`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {m.lots.map((lot) => (
              <SelectItem key={lot} value={lot}>
                {lot}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell className="text-right align-top whitespace-nowrap">
        {stock === null ? "-" : `${formatTon(stock)} ตัน`}
      </TableCell>
      <TableCell className="text-right align-top whitespace-nowrap">
        <div>{formatNumber(m.stockQty)}</div>
        {m.tonPerUnit !== null && (
          <div className="text-xs text-muted-foreground">
            {m.tonPerUnit} ตัน/ชิ้น
          </div>
        )}
      </TableCell>
      <TableCell className="text-right align-top whitespace-nowrap">
        {used === null ? "-" : `${formatTon(used)} ตัน`}
      </TableCell>
      <TableCell className="align-top">
        <Input
          {...qtyField}
          aria-invalid={over}
          aria-label={`จำนวนที่ใช้ของ ${m.name}`}
          className="ml-auto w-24 text-right"
        />
      </TableCell>
      <TableCell className="pr-4 align-top">
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`ลบ ${m.name}`}
          onClick={onRemove}
        >
          <Trash2Icon />
        </Button>
      </TableCell>
    </TableRow>
  );
}

function SweepRow({
  material: m,
  onPatch,
}: {
  material: MaterialLine;
  onPatch: (patch: Partial<MaterialLine>) => void;
}) {
  const sweepField = useNumberField(
    m.sweepTon,
    (sweepTon) => onPatch({ sweepTon }),
    2
  );

  return (
    <TableRow>
      <TableCell className="pl-4">
        <div className="font-medium">{m.name}</div>
        {m.sub && <div className="text-xs text-muted-foreground">{m.sub}</div>}
      </TableCell>
      <TableCell>
        <Input
          {...sweepField}
          aria-label={`ปริมาณกวาดพื้นของ ${m.name}`}
          className="ml-auto w-32 text-right"
        />
      </TableCell>
      {/* ปุ๋ยที่กวาดพื้นได้ = ส่วนที่หลุดออกจากไลน์ ถือเป็นปริมาณสูญเสียของล็อตนั้น */}
      <TableCell className="pr-4 text-right whitespace-nowrap">
        {m.sweepTon > 0 ? formatTon(m.sweepTon) : "-"}
      </TableCell>
    </TableRow>
  );
}

function TonStepper({
  id,
  value,
  onValueChange,
}: {
  id: string;
  value: number;
  onValueChange: (next: number) => void;
}) {
  const field = useNumberField(value, onValueChange, 2);
  const step = (delta: number) =>
    onValueChange(Math.max(0, Number((value + delta).toFixed(2))));

  return (
    <InputGroup>
      <InputGroupAddon align="inline-start">
        <InputGroupButton
          size="icon-xs"
          aria-label="ลดปริมาณ"
          onClick={() => step(-1)}
        >
          <MinusIcon />
        </InputGroupButton>
      </InputGroupAddon>
      <InputGroupInput {...field} id={id} className="text-center" />
      <InputGroupAddon align="inline-end">
        <InputGroupButton
          size="icon-xs"
          aria-label="เพิ่มปริมาณ"
          onClick={() => step(1)}
        >
          <PlusIcon />
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  );
}
