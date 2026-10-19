"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@peckey954/ui/components/ui/button";
import { Input } from "@peckey954/ui/components/ui/input";
import { Label } from "@peckey954/ui/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@peckey954/ui/components/ui/select";
import { Textarea } from "@peckey954/ui/components/ui/textarea";
import { cn } from "@peckey954/ui/lib/utils";
import { toast } from "sonner";
import { Crumbs, FooterBar, ProductStrip, StepperField } from "@/components/receiving/parts";
import {
  ADD_TITLE,
  ME,
  PACKING_OPTIONS,
  addSlip,
  nextSlipNo,
  updateSlip,
  type ReceivingDoc,
  type Slip,
} from "@/lib/goods-receiving";

/* ------------------------------------------------------------------
   เพิ่ม/แก้การรับเข้าหนึ่งสลิง

   ของที่นับเป็นตันกรอกทั้งน้ำหนักต่อสลิงและจำนวนชิ้นในสลิง — ใบสั่งซื้อพูดเป็น
   ตัน แต่คนหน้าโกดังนับเป็นชิ้น สองฝั่งต้องเทียบกันได้
   ของที่นับเป็นชิ้นหรือลังกรอกจำนวนอย่างเดียว ไม่มีทศนิยม

   เพิ่มใหม่มีสองปุ่ม บันทึกแล้วพิมพ์ใบติดสลิงกลับไปที่ใบ หรือพิมพ์แล้วขึ้นฟอร์ม
   ว่างของสลิงถัดไปเลย — รถยกยกของออกทีละสลิงติดกัน ไม่ต้องย้อนไปกดเพิ่มใหม่
------------------------------------------------------------------ */

type Values = { container: string; packing: string; tons: string; count: string; note: string };
type Errors = Partial<Record<keyof Values, string>>;

const blank = (doc: ReceivingDoc): Values => ({
  container: "",
  // หน่วยที่มีบรรจุภัณฑ์ทางเดียวเลือกไว้ให้เลย ไม่ต้องให้คนกดเลือกสิ่งที่ไม่มีทางเลือก
  packing: PACKING_OPTIONS[doc.unit].length === 1 ? PACKING_OPTIONS[doc.unit][0] : doc.packing,
  tons: "",
  count: "",
  note: "",
});

export function SlipForm({ doc, slip }: { doc: ReceivingDoc; slip?: Slip }) {
  const router = useRouter();
  const tons = doc.unit === "ตัน";
  const [v, setV] = React.useState<Values>(
    slip
      ? {
          container: slip.containerNo ?? "",
          packing: slip.packing,
          tons: slip.tons === null ? "" : slip.tons.toFixed(2),
          count: String(slip.count),
          note: slip.note ?? "",
        }
      : blank(doc)
  );
  const [errors, setErrors] = React.useState<Errors>({});
  // นับใหม่ทุกครั้งที่บันทึก — ฟอร์ม "เพิ่มรายการถัดไป" ต้องขึ้นเลขสลิงใหม่
  const [, bump] = React.useReducer((n: number) => n + 1, 0);
  const no = slip?.no ?? nextSlipNo(doc);
  const docHref = `/receiving/product/${doc.id}`;
  const set = (k: keyof Values) => (val: string) => {
    setV((p) => ({ ...p, [k]: val }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const validate = () => {
    const e: Errors = {};
    if (!v.packing) e.packing = "กรุณาเลือกบรรจุภัณฑ์";
    if (tons && !(Number(v.tons) > 0)) e.tons = "กรุณาระบุรับเข้า";
    if (!(Number(v.count) > 0)) e.count = "กรุณาระบุรับเข้า";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const payload = () => ({
    containerNo: v.container.trim() || undefined,
    packing: v.packing,
    tons: tons ? Number(v.tons) : null,
    count: Math.round(Number(v.count)),
    note: v.note.trim() || undefined,
  });

  const save = (next: boolean) => {
    if (!validate()) return;
    if (slip) {
      updateSlip(slip, { ...payload(), editor: ME });
      toast.success("แก้ไขการรับเข้าสินค้าต่อสลิงสำเร็จ", { description: slip.no });
      router.push(`${docHref}/${slip.id}`);
      return;
    }
    const s = addSlip(doc, { ...payload(), at: new Date(), receiver: ME, cancelled: false });
    toast.success("รับเข้าสินค้าต่อสลิงสำเร็จ", {
      description: `${s.no} — ส่งพิมพ์ใบติดสลิงแล้ว`,
    });
    if (next) {
      // เก็บบรรจุภัณฑ์ไว้ สลิงถัดไปของรถคันเดียวกันมักเป็นบรรจุภัณฑ์เดิม
      setV((p) => ({ ...blank(doc), packing: p.packing }));
      bump();
      window.scrollTo({ top: 0 });
    } else router.push(docHref);
  };

  const title = slip ? "แก้ไขการรับเข้าสินค้า" : ADD_TITLE[doc.source];

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col">
      <main className="@container mx-auto w-full max-w-7xl flex-1 px-4 pt-6 pb-6 sm:px-6">
        <Crumbs
          trail={[
            { label: "รับเข้าสินค้า", href: "/receiving/product" },
            { label: "ใบรับเข้าสินค้า", href: docHref },
            { label: slip ? "แก้ไขการรับเข้า" : "เพิ่มการรับเข้า" },
          ]}
        />
        <h1 className="mt-4 text-2xl font-bold tracking-tight">
          {title} {no}
        </h1>

        <div className="mt-5">
          <ProductStrip doc={doc} />
        </div>

        <div className="mt-5 grid gap-4 @3xl:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="slip-container">
              เบอร์ตู้คอนเทนเนอร์ <span className="font-normal text-muted-foreground">(ไม่บังคับ)</span>
            </Label>
            <Input
              id="slip-container"
              className="bg-card"
              placeholder="ระบุเบอร์ตู้"
              value={v.container}
              onChange={(e) => set("container")(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="slip-packing" className={cn(errors.packing && "text-danger-strong")}>
              บรรจุภัณฑ์
            </Label>
            <Select value={v.packing} onValueChange={set("packing")}>
              <SelectTrigger
                id="slip-packing"
                className={cn("w-full bg-card", errors.packing && "border-danger-strong")}
              >
                <SelectValue placeholder="เลือกบรรจุภัณฑ์" />
              </SelectTrigger>
              <SelectContent>
                {PACKING_OPTIONS[doc.unit].map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.packing && <p className="text-sm text-danger-strong">{errors.packing}</p>}
          </div>

          {tons && (
            <StepperField
              id="slip-tons"
              label="ปริมาณรับเข้าต่อสลิง (ตัน)"
              value={v.tons}
              onChange={set("tons")}
              step={0.05}
              decimals={2}
              error={errors.tons}
            />
          )}
          <StepperField
            id="slip-count"
            label={`จำนวนรับเข้าต่อสลิง (${tons ? "ชิ้น" : doc.unit})`}
            value={v.count}
            onChange={set("count")}
            step={1}
            decimals={0}
            error={errors.count}
          />

          <div className="space-y-1.5 @3xl:col-span-2">
            <Label htmlFor="slip-note">
              หมายเหตุ <span className="font-normal text-muted-foreground">(ไม่บังคับ)</span>
            </Label>
            <Textarea
              id="slip-note"
              className="bg-card"
              rows={3}
              placeholder="ระบุหมายเหตุ"
              value={v.note}
              onChange={(e) => set("note")(e.target.value)}
            />
          </div>
        </div>
      </main>

      <FooterBar
        left={
          <Button variant="outline-primary" onClick={() => router.back()}>
            ย้อนกลับ
          </Button>
        }
        right={
          slip ? (
            <Button className="min-w-24" onClick={() => save(false)}>
              บันทึก
            </Button>
          ) : (
            <>
              <Button variant="outline-primary" onClick={() => save(false)}>
                บันทึกและพิมพ์
              </Button>
              <Button onClick={() => save(true)}>บันทึกและพิมพ์แล้วเพิ่มรายการถัดไป</Button>
            </>
          )
        }
      />
    </div>
  );
}
