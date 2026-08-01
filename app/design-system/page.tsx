"use client";

import { PackagePlusIcon } from "lucide-react";
import { Badge } from "@peckey954/ui/components/ui/badge";
import { Button } from "@peckey954/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@peckey954/ui/components/ui/card";
import { Checkbox } from "@peckey954/ui/components/ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@peckey954/ui/components/ui/dialog";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldTitle,
} from "@peckey954/ui/components/ui/field";
import { Input } from "@peckey954/ui/components/ui/input";
import { Label } from "@peckey954/ui/components/ui/label";
import {
  RadioGroup,
  RadioGroupItem,
} from "@peckey954/ui/components/ui/radio-group";
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

const LOTS = [
  {
    code: "PD260116/01-04",
    sku: "A-9M",
    zone: "โซน A · ชั้น 2",
    qty: "500 ชิ้น",
    status: "พร้อมจ่าย",
  },
  {
    code: "PD260116/05-08",
    sku: "B-4L",
    zone: "โซน B · ชั้น 1",
    qty: "180 ชิ้น",
    status: "รอตรวจ",
  },
  {
    code: "PD260117/01-02",
    sku: "C-2S",
    zone: "โซน C · ชั้น 3",
    qty: "1,240 ชิ้น",
    status: "พร้อมจ่าย",
  },
];

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-12">
      <header className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <Badge>ParichWMS</Badge>
          <h1 className="text-3xl font-semibold tracking-tight">
            ระบบจัดการคลังสินค้า
          </h1>
          <p className="text-muted-foreground">
            หน้าตัวอย่าง design system — สีส้ม #F97316 · ฟอนต์ Sarabun
          </p>
        </div>
      </header>

      <Separator className="my-8" />

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">ปุ่ม</h2>
        <div className="flex flex-wrap items-center gap-3">
          <Button>
            <PackagePlusIcon />
            รับสินค้าเข้า
          </Button>
          <Button variant="secondary">รอง</Button>
          <Button variant="outline">ขอบ</Button>
          <Button variant="ghost">โปร่ง</Button>
          <Button variant="link">ลิงก์</Button>
          <Button variant="destructive">ลบรายการ</Button>
          <Button disabled>ปิดใช้งาน</Button>
        </div>
      </section>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>สร้างใบรับสินค้า</CardTitle>
            <CardDescription>
              กรอกข้อมูลล็อตที่ต้องการรับเข้าคลัง
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="lot">รหัสล็อต</Label>
              <Input id="lot" placeholder="PD260116/01-04" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="zone">โซนจัดเก็บ</Label>
              <Select>
                <SelectTrigger id="zone" className="w-full">
                  <SelectValue placeholder="เลือกโซน" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="a">โซน A — สินค้าหมุนเร็ว</SelectItem>
                  <SelectItem value="b">โซน B — สินค้าทั่วไป</SelectItem>
                  <SelectItem value="c">โซน C — ควบคุมอุณหภูมิ</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <FieldLabel htmlFor="urgent">
              <Field orientation="horizontal">
                <Checkbox id="urgent" />
                <FieldContent>
                  <FieldTitle>ทำเครื่องหมายเร่งด่วน</FieldTitle>
                  <FieldDescription>
                    จะถูกจัดคิวขึ้นก่อนรายการอื่น
                  </FieldDescription>
                </FieldContent>
              </Field>
            </FieldLabel>

            <div className="space-y-3">
              <Label>วิธีตรวจนับ</Label>
              <RadioGroup defaultValue="full" className="gap-3">
                <FieldLabel htmlFor="count-full">
                  <Field orientation="horizontal">
                    <RadioGroupItem id="count-full" value="full" />
                    <FieldContent>
                      <FieldTitle>นับทั้งหมด</FieldTitle>
                      <FieldDescription>ตรวจทุกชิ้นในล็อต</FieldDescription>
                    </FieldContent>
                  </Field>
                </FieldLabel>
                <FieldLabel htmlFor="count-sample">
                  <Field orientation="horizontal">
                    <RadioGroupItem id="count-sample" value="sample" />
                    <FieldContent>
                      <FieldTitle>สุ่มตัวอย่าง</FieldTitle>
                      <FieldDescription>
                        สุ่ม 10% ของจำนวนทั้งหมด
                      </FieldDescription>
                    </FieldContent>
                  </Field>
                </FieldLabel>
              </RadioGroup>
            </div>

            <Dialog>
              <DialogTrigger asChild>
                <Button className="w-full">ยืนยันการรับเข้า</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>ยืนยันการรับสินค้าเข้าคลัง</DialogTitle>
                  <DialogDescription>
                    ระบบจะบันทึกล็อตนี้เข้าสต็อกทันที และแก้ไขย้อนหลังไม่ได้
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">ยกเลิก</Button>
                  </DialogClose>
                  <DialogClose asChild>
                    <Button>ยืนยัน</Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>ล็อตในคลัง</CardTitle>
            <CardDescription>รายการล่าสุด 3 รายการ</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>รหัสล็อต</TableHead>
                  <TableHead>ตำแหน่ง</TableHead>
                  <TableHead className="text-right">จำนวน</TableHead>
                  <TableHead>สถานะ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {LOTS.map((lot) => (
                  <TableRow key={lot.code}>
                    <TableCell className="font-medium">
                      {lot.code}
                      <span className="block text-xs text-muted-foreground">
                        {lot.sku}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {lot.zone}
                    </TableCell>
                    <TableCell className="text-right">{lot.qty}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          lot.status === "พร้อมจ่าย" ? "default" : "secondary"
                        }
                      >
                        {lot.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <section className="mt-8 space-y-4">
        <h2 className="text-lg font-semibold">สีของแบรนด์</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-lg bg-primary p-4 text-primary-foreground">
            <p className="text-sm font-medium">primary</p>
            <p className="text-xs opacity-80">#F97316</p>
          </div>
          <div className="rounded-lg bg-secondary p-4 text-secondary-foreground">
            <p className="text-sm font-medium">secondary</p>
          </div>
          <div className="rounded-lg bg-muted p-4 text-muted-foreground">
            <p className="text-sm font-medium">muted</p>
          </div>
          <div className="rounded-lg bg-destructive p-4 text-destructive-foreground">
            <p className="text-sm font-medium">destructive</p>
          </div>
        </div>
      </section>
    </main>
  );
}
