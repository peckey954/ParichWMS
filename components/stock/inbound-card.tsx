"use client";

import { Button } from "@peckey954/ui/components/ui/button";
import { Separator } from "@peckey954/ui/components/ui/separator";
import { formatQty, type InboundDoc } from "@/lib/general-stock";

/** การ์ดเอกสารรอรับเข้า — คนละโครงกับการ์ดสต็อก เพราะเป็นเอกสารสั่งซื้อ ไม่ใช่ยอดคงเหลือ */
export function InboundCard({ doc }: { doc: InboundDoc }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="font-semibold">{doc.code}</span>
        <span className="text-sm text-muted-foreground">{doc.createdAt}</span>
      </div>

      <div className="mt-3 rounded-lg bg-muted px-3 py-2.5">
        <p className="font-medium">{doc.productName}</p>
        <p className="text-sm text-muted-foreground">{doc.supplier}</p>
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-lg bg-brand px-3 py-2.5">
        <span className="font-medium">{doc.truck}</span>
        <span className="text-sm">
          <span className="text-muted-foreground">วันที่รถจะเข้า: </span>
          <span className="font-medium">{doc.arriveDate}</span>
        </span>
      </div>

      <dl className="mt-3 space-y-1.5 text-sm">
        <div className="flex items-center justify-between gap-3">
          <dt className="text-muted-foreground">สั่งซื้อ ({doc.orderUnit}):</dt>
          <dd className="font-semibold tabular-nums">
            {formatQty(doc.orderQty)}
          </dd>
        </div>
        {doc.packing && (
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">บรรจุภัณฑ์:</dt>
            <dd className="font-semibold">{doc.packing}</dd>
          </div>
        )}
      </dl>

      <Separator className="mt-3" />

      <div className="mt-3 flex justify-end">
        <Button variant="outline-primary" size="sm">
          รับเข้า
        </Button>
      </div>
    </div>
  );
}
