import {
  CheckCircle2Icon,
  InfoIcon,
  PackagePlusIcon,
  SearchIcon,
  TriangleAlertIcon,
} from "lucide-react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@peckey954/ui/components/ui/alert";
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
import { Textarea } from "@peckey954/ui/components/ui/textarea";
import { ThemeToggle } from "@/components/theme-toggle";

const TONES = ["brand", "success", "warning", "danger", "neutral"] as const;
const APPEARANCES = ["solid", "soft", "outline"] as const;

const BUTTON_VARIANTS = [
  "default",
  "secondary",
  "outline",
  "outline-primary",
  "ghost",
  "link",
  "destructive",
] as const;

const STOCK = [
  { lot: "PO260116/01-04", sku: "21-0-0", zone: "A-02", qty: 20, ton: 16 },
  { lot: "PO260116/05-08", sku: "46-0-0", zone: "B-01", qty: 180, ton: 144 },
  { lot: "PO260117/01-02", sku: "16-20-0", zone: "C-03", qty: 1240, ton: 992 },
];

export default function DesignSystemPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <header className="flex items-start justify-between gap-4">
        <div className="space-y-1.5">
          <Badge tone="brand" appearance="soft">
            @peckey954/ui 0.2.0
          </Badge>
          <h1 className="text-2xl font-semibold tracking-tight">
            หน้าทดสอบ design system
          </h1>
          <p className="text-sm text-muted-foreground">
            แบรนด์ parich · tint pure · ฟอนต์ Sarabun — กดปุ่มขวาบนเพื่อสลับ
            สว่าง/มืด แล้วดูว่าทุกอย่างยังถูกต้อง
          </p>
        </div>
        <ThemeToggle />
      </header>

      <Separator className="my-8" />

      {/* ---------------- ปุ่ม ---------------- */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">ปุ่ม</h2>
          <p className="text-sm text-muted-foreground">
            ทุก variant รวม outline-primary ที่เพิ่มมาใน 0.2.0
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {BUTTON_VARIANTS.map((v) => (
            <Button key={v} variant={v}>
              {v}
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button size="sm">เล็ก</Button>
          <Button>ปกติ</Button>
          <Button size="lg">ใหญ่</Button>
          <Button size="icon" aria-label="ค้นหา">
            <SearchIcon />
          </Button>
          <Button variant="outline-primary">
            <PackagePlusIcon />
            ไอคอนรับสีจากปุ่มเอง
          </Button>
          <Button disabled>ปิดใช้งาน</Button>
        </div>
      </section>

      {/* ---------------- Badge ---------------- */}
      <section className="mt-10 space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Badge — tone × appearance</h2>
          <p className="text-sm text-muted-foreground">
            5 tone × 3 appearance = 15 แบบ ไม่มี prop variant แล้ว
          </p>
        </div>
        <Card className="py-0">
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">tone</TableHead>
                  {APPEARANCES.map((a) => (
                    <TableHead key={a}>{a}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {TONES.map((t) => (
                  <TableRow key={t}>
                    <TableCell className="pl-4 font-medium">{t}</TableCell>
                    {APPEARANCES.map((a) => (
                      <TableCell key={a}>
                        <Badge tone={t} appearance={a}>
                          รอผลิต
                        </Badge>
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>

      {/* ---------------- Alert ---------------- */}
      <section className="mt-10 space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Alert — 4 variant พื้นทึบ</h2>
          <p className="text-sm text-muted-foreground">
            ไอคอนรับสีจากตัวอักษรเอง ไม่บังคับสีสด
          </p>
        </div>
        <div className="space-y-3">
          <Alert>
            <InfoIcon />
            <AlertTitle>default — พื้นการ์ด</AlertTitle>
            <AlertDescription>
              ใช้กับข้อความทั่วไปที่ไม่ได้บอกสถานะอะไรเป็นพิเศษ
            </AlertDescription>
          </Alert>
          <Alert variant="warning">
            <TriangleAlertIcon />
            <AlertTitle>warning — ล็อตนี้ใกล้หมดอายุใน 7 วัน</AlertTitle>
            <AlertDescription>
              ควรจ่ายออกก่อนล็อตอื่นตามหลัก FEFO
            </AlertDescription>
          </Alert>
          <Alert variant="brand">
            <CheckCircle2Icon />
            <AlertTitle>brand — สีเดียวกับกรอบ radio ตอนถูกเลือก</AlertTitle>
            <AlertDescription>
              ใช้เน้นข้อมูลที่เกี่ยวกับแบรนด์หรือขั้นตอนถัดไป
            </AlertDescription>
          </Alert>
          <Alert variant="destructive">
            <TriangleAlertIcon />
            <AlertTitle>destructive — ใช้เกินจำนวนคงเหลือในคลัง</AlertTitle>
            <AlertDescription>
              แก้จำนวนที่ใช้ให้ไม่เกินยอดคงเหลือก่อนบันทึก
            </AlertDescription>
          </Alert>
        </div>
      </section>

      {/* ---------------- ฟอร์ม ---------------- */}
      <section className="mt-10 space-y-4">
        <h2 className="text-lg font-semibold">ฟอร์ม</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>input · select · textarea</CardTitle>
              <CardDescription>ช่องกรอกพื้นฐาน</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="lot">รหัสล็อต</Label>
                <Input id="lot" placeholder="PO260116/01-04" />
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
              <div className="space-y-2">
                <Label htmlFor="note">หมายเหตุ</Label>
                <Textarea id="note" placeholder="ระบุหมายเหตุ" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>checkbox · radio-group</CardTitle>
              <CardDescription>
                แบบมีกรอบครอบ ประกอบจาก Field + FieldLabel
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <FieldLabel htmlFor="urgent">
                <Field orientation="horizontal">
                  <Checkbox id="urgent" defaultChecked />
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
                  <Button className="w-full">เปิด dialog</Button>
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
        </div>
      </section>

      {/* ---------------- ตาราง ---------------- */}
      <section className="mt-10 space-y-4">
        <div>
          <h2 className="text-lg font-semibold">ตาราง</h2>
          <p className="text-sm text-muted-foreground">
            หัวสองบรรทัดใช้ span block · ช่องตัวเลขชิดขวา + tabular-nums
          </p>
        </div>
        <Card className="py-0">
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">
                    รหัสล็อต
                    <span className="block font-normal text-muted-foreground">
                      สินค้า
                    </span>
                  </TableHead>
                  <TableHead>ตำแหน่ง</TableHead>
                  <TableHead className="text-right">
                    จำนวน
                    <span className="block font-normal text-muted-foreground">
                      กระสอบ
                    </span>
                  </TableHead>
                  <TableHead className="text-right">
                    ปริมาณ
                    <span className="block font-normal text-muted-foreground">
                      ตัน
                    </span>
                  </TableHead>
                  <TableHead className="pr-4">สถานะ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {STOCK.map((r) => (
                  <TableRow key={r.lot}>
                    <TableCell className="pl-4 font-medium">
                      {r.lot}
                      <span className="block text-xs font-normal text-muted-foreground">
                        {r.sku}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {r.zone}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {r.qty.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {r.ton.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </TableCell>
                    <TableCell className="pr-4">
                      <Badge
                        tone={r.ton > 100 ? "success" : "warning"}
                        appearance="soft"
                      >
                        {r.ton > 100 ? "พร้อมจ่าย" : "รอตรวจ"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>

      {/* ---------------- สีของแบรนด์ ---------------- */}
      <section className="mt-10 space-y-4">
        <div>
          <h2 className="text-lg font-semibold">สีของแบรนด์</h2>
          <p className="text-sm text-muted-foreground">
            ทุกช่องอ้าง token ไม่มีค่าสีจริงในโค้ดหน้านี้
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-lg bg-primary p-4 text-primary-foreground">
            <p className="text-sm font-medium">primary</p>
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
