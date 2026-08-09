"use client";

import * as React from "react";
import {
  ArrowRightLeftIcon,
  PlusIcon,
  SaveIcon,
  Trash2Icon,
  TriangleAlertIcon,
  TruckIcon,
} from "lucide-react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@peckey954/ui/components/ui/alert";
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@peckey954/ui/components/ui/card";
import { Input } from "@peckey954/ui/components/ui/input";
import { Label } from "@peckey954/ui/components/ui/label";
import { Separator } from "@peckey954/ui/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@peckey954/ui/components/ui/table";
import { Textarea } from "@peckey954/ui/components/ui/textarea";
import { cn } from "@peckey954/ui/lib/utils";
import { toast } from "sonner";
import { TruckDocsDialog } from "@/components/weighing/truck-docs-dialog";
import {
  DIFF_LABEL,
  DIFF_TONE,
  SEED_SHEET,
  computeTotals,
  diffKind,
  docCount,
  formatKg,
  formatSignedKg,
  isWeightInvalid,
  netKg,
  newTruck,
  truckDiffKg,
  type Truck,
  type WeighingSheet,
} from "@/lib/weighing";

export default function WeighingPage() {
  const [sheet, setSheet] = React.useState<WeighingSheet>(SEED_SHEET);

  const patch = (p: Partial<WeighingSheet>) => setSheet((s) => ({ ...s, ...p }));

  const patchTruck = (id: string, p: Partial<Truck>) =>
    setSheet((s) => ({
      ...s,
      trucks: s.trucks.map((t) => (t.id === id ? { ...t, ...p } : t)),
    }));

  const totals = computeTotals(sheet.trucks);
  const totalKind = diffKind(totals.diffKg);
  const invalidTrucks = sheet.trucks.filter(isWeightInvalid);
  const missingDocs = sheet.trucks.filter((t) => docCount(t) < 2);

  const canConfirm =
    sheet.trucks.length > 0 &&
    totals.pendingTrucks === 0 &&
    invalidTrucks.length === 0 &&
    missingDocs.length === 0;

  function handleConfirm() {
    if (!canConfirm) {
      toast.error("ยืนยันไม่ได้ — ยังมีรายการที่ค้างอยู่");
      return;
    }
    patch({ status: "confirmed" });
    toast.success(`ยืนยันใบชั่ง ${sheet.code} แล้ว`, {
      description: `รับเข้า ${formatKg(totals.parichKg)} กก. · ส่วนต่าง ${formatSignedKg(totals.diffKg)} กก.`,
    });
  }

  return (
    <>
      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">ระบบ</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/weighing">รับสินค้าเข้า</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-primary">
                ใบชั่งน้ำหนัก
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              ใบชั่งน้ำหนัก {sheet.code}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              ชั่งรถพร้อมของแล้วชั่งรถเปล่า ระบบหักให้เป็นน้ำหนักสินค้าจริง
              แล้วเทียบกับใบชั่งของซัพพลายเออร์
            </p>
          </div>
          <Badge
            tone={sheet.status === "confirmed" ? "success" : "warning"}
            appearance="soft"
          >
            {sheet.status === "confirmed" ? "ยืนยันแล้ว" : "ฉบับร่าง"}
          </Badge>
        </div>

        {/* ---------- ข้อมูลใบรับ ---------- */}
        <Card className="mt-5">
          <CardContent>
            <div className="grid gap-4 rounded-lg bg-muted p-4 sm:grid-cols-2 lg:grid-cols-3">
              <Info label="เลขที่ใบสั่งซื้อ" value={sheet.poCode} />
              <Info label="ซัพพลายเออร์" value={sheet.supplierName} />
              <Info label="สินค้า" value={sheet.productName} />
              <Info label="วันที่รับ" value={sheet.receivedDate} />
              <Info label="คลังปลายทาง" value={sheet.warehouse} />
              <Info
                label="จำนวนรถ"
                value={`${sheet.trucks.length} คัน`}
              />
            </div>
          </CardContent>
        </Card>

        {/* ---------- สรุปยอดรวมทั้งใบ ---------- */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>สรุปยอดรวมทั้งใบ</CardTitle>
            <CardDescription>
              เทียบเฉพาะ {totals.comparableTrucks} จาก {totals.totalTrucks} คัน
              ที่ชั่งครบสองรอบและมีเลขจากใบชั่งซัพพลายเออร์แล้ว
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <SummaryTile
                label="น้ำหนักสินค้าจริง — ชั่งที่ Parich"
                value={`${formatKg(totals.parichKg)} กก.`}
              />
              <SummaryTile
                label="ตามใบชั่งของซัพพลายเออร์"
                value={`${formatKg(totals.supplierKg)} กก.`}
              />
              <div className="rounded-lg border border-border p-4">
                <p className="text-sm text-muted-foreground">ส่วนต่าง</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums">
                  {formatSignedKg(totals.diffKg)} กก.
                </p>
                <div className="mt-2 flex items-center gap-2">
                  {totalKind && (
                    <Badge tone={DIFF_TONE[totalKind]} appearance="soft">
                      {DIFF_LABEL[totalKind]}
                    </Badge>
                  )}
                  <span className="text-sm tabular-nums text-muted-foreground">
                    {totals.diffPercent > 0 ? "+" : ""}
                    {totals.diffPercent.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              <ArrowRightLeftIcon className="mr-1 inline size-4 align-text-bottom" />
              ชั่งได้มากกว่าใบของซัพพลายเออร์ถือเป็น{" "}
              <span className="font-medium text-foreground">ของแถม</span>{" "}
              ได้น้อยกว่าถือเป็น{" "}
              <span className="font-medium text-foreground">สูญหาย</span>
            </p>
          </CardContent>
        </Card>

        {/* ---------- ตารางรถแต่ละคัน ---------- */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">รถบรรทุกแต่ละคัน</h2>
            <p className="text-sm text-muted-foreground">
              แนบเอกสารครบแล้ว {totals.docsComplete} จาก {totals.totalTrucks} คัน
            </p>
          </div>
          <Button
            variant="outline-primary"
            onClick={() => patch({ trucks: [...sheet.trucks, newTruck()] })}
          >
            <PlusIcon />
            เพิ่มรถบรรทุก
          </Button>
        </div>

        <Card className="mt-4 py-0">
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-52 pl-4">
                    ทะเบียนรถ
                    <span className="block font-normal text-muted-foreground">
                      คนขับ
                    </span>
                  </TableHead>
                  <TableHead className="min-w-36 text-right">
                    ชั่งเข้า
                    <span className="block font-normal text-muted-foreground">
                      รถพร้อมของ (กก.)
                    </span>
                  </TableHead>
                  <TableHead className="min-w-36 text-right">
                    ชั่งออก
                    <span className="block font-normal text-muted-foreground">
                      รถเปล่า (กก.)
                    </span>
                  </TableHead>
                  <TableHead className="min-w-32 text-right">
                    สินค้าจริง
                    <span className="block font-normal text-muted-foreground">
                      หักแล้ว (กก.)
                    </span>
                  </TableHead>
                  <TableHead className="min-w-36 text-right">
                    ใบชั่งซัพพลายเออร์
                    <span className="block font-normal text-muted-foreground">
                      (กก.)
                    </span>
                  </TableHead>
                  <TableHead className="min-w-40 text-right">ส่วนต่าง</TableHead>
                  <TableHead className="w-28 text-center">เอกสาร</TableHead>
                  <TableHead className="w-12 pr-4" />
                </TableRow>
              </TableHeader>

              <TableBody>
                {sheet.trucks.map((t) => {
                  const net = netKg(t);
                  const invalid = isWeightInvalid(t);
                  const diff = truckDiffKg(t);
                  const kind = diffKind(diff);

                  return (
                    <TableRow key={t.id}>
                      {/* Input ของ DS เป็น inline-block — ต้องครอบด้วย block
                          container ไม่งั้นสองช่องจะไปเรียงข้างกันในช่องเดียว */}
                      <TableCell className="pl-4">
                        <div className="flex flex-col gap-2">
                          <Input
                            value={t.plate}
                            placeholder="ทะเบียนรถ"
                            onChange={(e) =>
                              patchTruck(t.id, { plate: e.target.value })
                            }
                          />
                          <Input
                            value={t.driverName}
                            placeholder="ชื่อคนขับ"
                            onChange={(e) =>
                              patchTruck(t.id, { driverName: e.target.value })
                            }
                          />
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-col gap-2">
                          <Input
                            type="number"
                            className="text-right tabular-nums"
                            value={t.grossKg ?? ""}
                            placeholder="0"
                            onChange={(e) =>
                              patchTruck(t.id, {
                                grossKg:
                                  e.target.value === ""
                                    ? null
                                    : Number(e.target.value),
                              })
                            }
                          />
                          <Input
                            type="time"
                            className="tabular-nums"
                            value={t.grossAt}
                            onChange={(e) =>
                              patchTruck(t.id, { grossAt: e.target.value })
                            }
                          />
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-col gap-2">
                          <Input
                            type="number"
                            className="text-right tabular-nums"
                            value={t.tareKg ?? ""}
                            placeholder="0"
                            onChange={(e) =>
                              patchTruck(t.id, {
                                tareKg:
                                  e.target.value === ""
                                    ? null
                                    : Number(e.target.value),
                              })
                            }
                          />
                          <Input
                            type="time"
                            className="tabular-nums"
                            value={t.tareAt}
                            onChange={(e) =>
                              patchTruck(t.id, { tareAt: e.target.value })
                            }
                          />
                        </div>
                      </TableCell>

                      {/* คำนวณให้ ไม่ให้แก้ด้วยมือ */}
                      <TableCell className="text-right">
                        {net === null ? (
                          <span className="text-sm text-muted-foreground">
                            รอชั่งให้ครบ
                          </span>
                        ) : (
                          <span
                            className={cn(
                              "font-semibold tabular-nums",
                              invalid && "text-destructive"
                            )}
                          >
                            {formatKg(net)}
                          </span>
                        )}
                      </TableCell>

                      <TableCell>
                        <Input
                          type="number"
                          className="text-right tabular-nums"
                          value={t.supplierKg ?? ""}
                          placeholder="0"
                          onChange={(e) =>
                            patchTruck(t.id, {
                              supplierKg:
                                e.target.value === ""
                                  ? null
                                  : Number(e.target.value),
                            })
                          }
                        />
                      </TableCell>

                      <TableCell className="text-right">
                        {diff === null || kind === null ? (
                          <span className="text-sm text-muted-foreground">—</span>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            <span className="font-medium tabular-nums">
                              {formatSignedKg(diff)}
                            </span>
                            <Badge tone={DIFF_TONE[kind]} appearance="soft">
                              {DIFF_LABEL[kind]}
                            </Badge>
                          </div>
                        )}
                      </TableCell>

                      <TableCell className="text-center">
                        <TruckDocsDialog
                          truck={t}
                          onPatch={(p) => patchTruck(t.id, p)}
                        />
                      </TableCell>

                      <TableCell className="pr-4">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`ลบรถ ${t.plate || "คันนี้"}`}
                          onClick={() =>
                            patch({
                              trucks: sheet.trucks.filter((x) => x.id !== t.id),
                            })
                          }
                        >
                          <Trash2Icon />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>

              {sheet.trucks.length > 0 && (
                <TableFooter>
                  <TableRow>
                    <TableCell className="pl-4 font-medium">
                      รวม {totals.comparableTrucks} คันที่เทียบได้
                    </TableCell>
                    <TableCell />
                    <TableCell />
                    <TableCell className="text-right font-semibold tabular-nums">
                      {formatKg(totals.parichKg)}
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">
                      {formatKg(totals.supplierKg)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span className="font-semibold tabular-nums">
                          {formatSignedKg(totals.diffKg)}
                        </span>
                        {totalKind && (
                          <Badge
                            tone={DIFF_TONE[totalKind]}
                            appearance="soft"
                          >
                            {DIFF_LABEL[totalKind]}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center tabular-nums">
                      {totals.docsComplete}/{totals.totalTrucks}
                    </TableCell>
                    <TableCell className="pr-4" />
                  </TableRow>
                </TableFooter>
              )}
            </Table>
          </CardContent>
        </Card>

        {/* ---------- เตือนรายการที่ค้าง ---------- */}
        {invalidTrucks.length > 0 && (
          <Alert variant="destructive" className="mt-4">
            <TriangleAlertIcon />
            <AlertTitle>น้ำหนักชั่งออกมากกว่าหรือเท่ากับชั่งเข้า</AlertTitle>
            <AlertDescription>
              {invalidTrucks.map((t) => t.plate || "รถที่ยังไม่ระบุทะเบียน").join(", ")}{" "}
              — น่าจะคีย์สลับช่องกัน ตรวจแล้วแก้ก่อนยืนยัน
            </AlertDescription>
          </Alert>
        )}

        {totals.pendingTrucks > 0 && (
          <Alert variant="warning" className="mt-4">
            <TruckIcon />
            <AlertTitle>
              ยังเทียบไม่ได้ {totals.pendingTrucks} คัน
            </AlertTitle>
            <AlertDescription>
              ต้องชั่งครบทั้งรถพร้อมของและรถเปล่า พร้อมคีย์เลขจากใบชั่งซัพพลายเออร์
              ให้ครบทุกคัน ยอดส่วนต่างด้านบนจึงจะเป็นตัวเลขสุดท้าย
            </AlertDescription>
          </Alert>
        )}

        {missingDocs.length > 0 && (
          <Alert variant="warning" className="mt-4">
            <TriangleAlertIcon />
            <AlertTitle>เอกสารแนบยังไม่ครบ {missingDocs.length} คัน</AlertTitle>
            <AlertDescription>
              แต่ละคันต้องมีทั้งใบชั่งของซัพพลายเออร์และสำเนาบัตรประชาชนคนขับ —{" "}
              {missingDocs.map((t) => t.plate || "รถที่ยังไม่ระบุทะเบียน").join(", ")}
            </AlertDescription>
          </Alert>
        )}

        {/* ---------- หมายเหตุรวม ---------- */}
        <div className="mt-8 space-y-2">
          <Label htmlFor="sheet-note">
            หมายเหตุของใบชั่งนี้{" "}
            <span className="font-normal text-muted-foreground">(ไม่บังคับ)</span>
          </Label>
          <Textarea
            id="sheet-note"
            value={sheet.note}
            placeholder="เช่น ฝนตกระหว่างลงของ น้ำหนักอาจคลาดเคลื่อนเล็กน้อย"
            onChange={(e) => patch({ note: e.target.value })}
          />
        </div>

        <Separator className="mt-8" />
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-dashed border-border p-4">
            <p className="text-sm font-medium">ผู้ชั่ง</p>
            <p className="mt-1 text-sm text-muted-foreground">
              ลงชื่ออัตโนมัติจากผู้ใช้ที่ล็อกอิน
            </p>
          </div>
          <div className="rounded-lg border border-dashed border-border p-4">
            <p className="text-sm font-medium">วันและเวลาที่ยืนยัน</p>
            <p className="mt-1 text-sm text-muted-foreground">
              บันทึกอัตโนมัติเมื่อกดยืนยันใบชั่ง
            </p>
          </div>
        </div>
      </main>

      {/* ---------- แถบปุ่มล่าง ---------- */}
      <div className="sticky bottom-0 border-t border-border bg-background">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <span className="text-sm text-muted-foreground">
            {sheet.trucks.length} คัน · รับเข้า {formatKg(totals.parichKg)} กก. ·
            ส่วนต่าง {formatSignedKg(totals.diffKg)} กก.
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline-primary"
              onClick={() => toast.success("บันทึกฉบับร่างแล้ว")}
            >
              <SaveIcon />
              บันทึกร่าง
            </Button>
            <Button onClick={handleConfirm}>ยืนยันใบชั่ง</Button>
          </div>
        </div>
      </div>
    </>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  );
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}
