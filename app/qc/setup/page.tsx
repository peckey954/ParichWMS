"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileTextIcon, SearchIcon } from "lucide-react";
import { Badge } from "@peckey954/ui/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@peckey954/ui/components/ui/breadcrumb";
import { Card, CardContent } from "@peckey954/ui/components/ui/card";
import { Empty, EmptyDescription, EmptyTitle } from "@peckey954/ui/components/ui/empty";
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
import {
  QC_TEMPLATES,
  STATUS_LABEL,
  STATUS_TONE,
  activeVersion,
  draftVersion,
  representativeVersion,
} from "@/lib/qc-template";

/**
 * หน้าแรกของการตั้งค่าเทมเพลต QC — ตารางรวมทุกรหัสฟอร์มในระบบ
 * กดแถวเข้าไปดู/แก้โครงสร้างของฟอร์มนั้นทีละอัน ที่ /qc/setup/[familyId]
 *
 * แต่ละแถวคือ "รหัสฟอร์ม" หนึ่งอัน ซึ่งข้างในมีได้หลายเวอร์ชัน (ดูที่หน้ารายละเอียด)
 * คอลัมน์เวอร์ชันในตารางนี้จึงโชว์เฉพาะตัวแทน — เวอร์ชันที่ใช้งานอยู่ก่อน
 * ถ้ายังไม่เคยเผยแพร่ก็โชว์ฉบับร่างแทน
 */
export default function QcTemplateListPage() {
  const [query, setQuery] = React.useState("");
  const router = useRouter();

  const q = query.trim().toLowerCase();
  const visible = QC_TEMPLATES.filter((f) => {
    if (!q) return true;
    const rep = representativeVersion(f);
    return (
      rep.name.toLowerCase().includes(q) || f.formCode.toLowerCase().includes(q)
    );
  });

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage className="text-primary">
              ตรวจสอบคุณภาพสินค้า
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mt-4">
        <h1 className="text-2xl font-semibold tracking-tight">
          เทมเพลตฟอร์ม QC
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          ทุกฟอร์มตรวจคุณภาพในระบบ กดเข้าไปดูโครงสร้าง แก้ไข หรือย้อนดูเวอร์ชันเก่าได้ทีละฟอร์ม
        </p>
      </div>

      <div className="mt-4">
        <InputGroup className="max-w-sm bg-card">
          <InputGroupAddon align="inline-start">
            <SearchIcon />
          </InputGroupAddon>
          <InputGroupInput
            placeholder="ค้นหาชื่อฟอร์มหรือรหัสฟอร์ม..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </InputGroup>
      </div>

      <Card className="mt-4 py-0">
        <CardContent className="px-0">
          {visible.length === 0 ? (
            <Empty className="py-10">
              <EmptyTitle>ไม่พบเทมเพลตที่ค้นหา</EmptyTitle>
              <EmptyDescription>ลองใช้คำค้นสั้นลง</EmptyDescription>
            </Empty>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-56 pl-4">ชื่อฟอร์ม</TableHead>
                    <TableHead>เวอร์ชันที่ใช้งาน</TableHead>
                    <TableHead>ฉบับร่าง</TableHead>
                    <TableHead>เริ่มใช้</TableHead>
                    <TableHead className="text-right pr-4">หัวข้อตรวจ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visible.map((family) => {
                    const active = activeVersion(family);
                    const draft = draftVersion(family);
                    const rep = representativeVersion(family);
                    const href = `/qc/setup/${family.id}`;
                    return (
                      <TableRow
                        key={family.id}
                        // ทั้งแถวกดได้ ไม่ใช่แค่ตัวอักษรชื่อฟอร์ม
                        onClick={() => router.push(href)}
                        className="cursor-pointer"
                      >
                        <TableCell className="pl-4">
                          <Link
                            href={href}
                            className="block font-medium hover:underline"
                          >
                            {rep.name || "ยังไม่ได้ตั้งชื่อฟอร์ม"}
                          </Link>
                          <span className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
                            <FileTextIcon className="size-3.5" />
                            {family.formCode}
                          </span>
                        </TableCell>
                        <TableCell>
                          {active ? (
                            <div>
                              <Badge tone={STATUS_TONE.active} appearance="soft">
                                {active.revision}
                              </Badge>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              ยังไม่เคยเผยแพร่
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {draft ? (
                            <Badge tone={STATUS_TONE.draft} appearance="outline">
                              {draft.revision} · {STATUS_LABEL.draft}
                            </Badge>
                          ) : (
                            <span className="text-sm text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="tabular-nums whitespace-nowrap">
                          {rep.effectiveFrom || "—"}
                        </TableCell>
                        <TableCell className="pr-4 text-right tabular-nums">
                          {rep.items.length}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
