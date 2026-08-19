"use client";

import * as React from "react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  DownloadIcon,
  FileTextIcon,
  ImageIcon,
  PanelLeftIcon,
  PrinterIcon,
  XIcon,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@peckey954/ui/components/ui/dialog";
import { cn } from "@peckey954/ui/lib/utils";

/* ------------------------------------------------------------------
   กล่องดูเอกสารเต็มจอ

   เปิดมาแล้วเอกสารได้พื้นที่เกือบทั้งจอ ไม่ใช่ย่อลงมาแปะในหน้าฟอร์ม
   เพราะสิ่งที่คนมาทำคืออ่านตัวเลขในใบชั่ง ซึ่งเป็นตัวหนังสือขนาดเล็ก

   รางซ้ายสองชั้น — ไฟล์อยู่บน หน้าอยู่ล่าง
   ที่ต้องเห็นไฟล์ทั้งหมดพร้อมกัน ไม่ซ่อนไว้หลังดรอปดาวน์
   เพราะงานจริงคือเทียบใบชั่งของเรากับของผู้ขาย ต้องสลับไปมาเร็ว ๆ
   ซ่อนไว้แปลว่าต้องกดสองครั้งทุกรอบที่สลับ

   ไฟล์จัดกลุ่มตามที่มา ไม่ใช่กองเรียงกันเจ็ดใบ
   เพราะตอนเทียบคนคิดเป็น "ใบของเรา กับ ใบของเขา" อยู่แล้ว

   รูปไม่มีหน้า ชั้น "หน้า" จึงหายไปเลยเมื่อไฟล์ที่เปิดอยู่เป็นรูป
   ไม่ใช่โชว์รางที่มีช่องเดียวลอย ๆ
------------------------------------------------------------------ */

export type ViewerFile = {
  id: string;
  name: string;
  /** ที่มาของเอกสาร ใช้จัดกลุ่มในราง */
  group: string;
  kind: "pdf" | "image";
  /** blob URL — มีเฉพาะไฟล์รูป */
  url?: string;
  /** จำนวนหน้า ไฟล์รูปเป็น 1 เสมอ */
  pages: number;
};

export function FileViewer({
  files,
  openId,
  onOpenChange,
}: {
  files: ViewerFile[];
  openId: string | null;
  onOpenChange: (id: string | null) => void;
}) {
  const index = files.findIndex((f) => f.id === openId);
  const file = index >= 0 ? files[index] : null;

  const [page, setPage] = React.useState(1);
  const [railOpen, setRailOpen] = React.useState(true);

  // เปลี่ยนไฟล์แล้วกลับไปหน้าแรกเสมอ ปรับตอนเรนเดอร์ ไม่ใช้ effect
  const [lastId, setLastId] = React.useState(openId);
  if (lastId !== openId) {
    setLastId(openId);
    setPage(1);
  }

  const stepFile = (delta: number) => {
    if (files.length === 0) return;
    const next = (index + delta + files.length) % files.length;
    onOpenChange(files[next].id);
  };

  // จัดกลุ่มตามที่มา เรียงตามลำดับที่เจอครั้งแรก ไม่เรียงตามตัวอักษร
  // เพราะลำดับในฟอร์มคือลำดับที่คนคุ้น (ของเรา → ของผู้ขาย → บัตรคนขับ)
  const groups: { name: string; items: ViewerFile[] }[] = [];
  for (const f of files) {
    const g = groups.find((x) => x.name === f.group);
    if (g) g.items.push(f);
    else groups.push({ name: f.group, items: [f] });
  }

  return (
    <Dialog open={file !== null} onOpenChange={(v) => !v && onOpenChange(null)}>
      <DialogContent
        aria-describedby={undefined}
        showCloseButton={false}
        onKeyDown={(e) => {
          // วงเล็บเหลี่ยมสลับไฟล์ ลูกศรขึ้นลงเปลี่ยนหน้า
          // สองอย่างนี้คนละแกนกัน คีย์จึงต้องคนละชุด ไม่ให้กดสลับกันเอง
          if (e.key === "[") stepFile(-1);
          if (e.key === "]") stepFile(1);
          if (file && e.key === "ArrowDown")
            setPage((p) => Math.min(file.pages, p + 1));
          if (e.key === "ArrowUp") setPage((p) => Math.max(1, p - 1));
        }}
        className={cn(
          "@container flex h-[92vh] w-[96vw] max-w-none flex-col gap-0 overflow-hidden p-0",
          "sm:max-w-none"
        )}
      >
        {/* ---------- หัวกล่อง ---------- */}
        <div className="flex shrink-0 items-center gap-3 border-b border-border px-3 py-2.5">
          <button
            type="button"
            aria-label={railOpen ? "ซ่อนรางด้านซ้าย" : "แสดงรางด้านซ้าย"}
            aria-pressed={railOpen}
            onClick={() => setRailOpen((v) => !v)}
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-md",
              "text-muted-foreground transition-colors hover:bg-accent-hover hover:text-foreground",
              "focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
            )}
          >
            <PanelLeftIcon className="size-5" />
          </button>

          <div className="min-w-0 flex-1">
            <DialogTitle className="truncate text-base">
              {file?.name}
            </DialogTitle>
            {/* ตัวนับไฟล์อยู่บนหัว รู้ว่ามีอะไรรออยู่อีกแม้ตอนพับรางไว้ */}
            <p className="text-sm text-muted-foreground">
              {file?.kind === "pdf" ? `PDF · ${file.pages} หน้า` : "รูปภาพ"}
              {files.length > 1 && (
                <>
                  {" · "}
                  <span className="tabular-nums">
                    ไฟล์ {index + 1} / {files.length}
                  </span>
                </>
              )}
            </p>
          </div>

          {files.length > 1 && (
            <div className="hidden items-center gap-1 @2xl:flex">
              <IconBtn label="ไฟล์ก่อนหน้า" title="ไฟล์ก่อนหน้า ( [ )" onClick={() => stepFile(-1)}>
                <ChevronLeftIcon className="size-5" />
              </IconBtn>
              <IconBtn label="ไฟล์ถัดไป" title="ไฟล์ถัดไป ( ] )" onClick={() => stepFile(1)}>
                <ChevronRightIcon className="size-5" />
              </IconBtn>
            </div>
          )}

          <IconBtn label="พิมพ์" onClick={() => window.print()}>
            <PrinterIcon className="size-5" />
          </IconBtn>
          <IconBtn label="ดาวน์โหลด" onClick={() => {}}>
            <DownloadIcon className="size-5" />
          </IconBtn>
          <IconBtn label="ปิด" onClick={() => onOpenChange(null)}>
            <XIcon className="size-5" />
          </IconBtn>
        </div>

        {/* ---------- ตัวกล่อง ---------- */}
        <div className="relative flex min-h-0 flex-1">
          {railOpen && (
            <>
              {/* จอแคบรางลอยทับเอกสาร ไม่แบ่งความกว้าง
                  390px แบ่งรางแล้วเอกสารเหลือไม่ถึงครึ่ง อ่านไม่ออกอยู่ดี */}
              <button
                type="button"
                aria-label="ปิดราง"
                onClick={() => setRailOpen(false)}
                className="absolute inset-0 z-10 bg-black/40 @2xl:hidden"
              />
              <Rail
                groups={groups}
                file={file}
                page={page}
                onPickFile={(id) => onOpenChange(id)}
                onPickPage={setPage}
              />
            </>
          )}

          <div className="min-h-0 flex-1 overflow-auto bg-secondary p-4 @2xl:p-8">
            {file?.kind === "image" ? (
              file.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={file.url}
                  alt={file.name}
                  className="mx-auto max-w-3xl rounded-lg bg-card shadow-sm"
                />
              ) : (
                // ไฟล์ตัวอย่างไม่มีไฟล์จริงให้แสดง วางกรอบรูปแทน
                // ไม่ใช้หน้าเอกสารจำลอง เพราะรูปกับ PDF ต้องดูต่างกันตั้งแต่แรกเห็น
                <div className="mx-auto flex aspect-[4/3] w-full max-w-3xl flex-col items-center justify-center gap-3 rounded-lg bg-card text-muted-foreground shadow-sm">
                  <ImageIcon className="size-10" strokeWidth={1.5} />
                  <p className="text-sm">{file.name}</p>
                </div>
              )
            ) : (
              <MockPage file={file} page={page} />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Rail({
  groups,
  file,
  page,
  onPickFile,
  onPickPage,
}: {
  groups: { name: string; items: ViewerFile[] }[];
  file: ViewerFile | null;
  page: number;
  onPickFile: (id: string) => void;
  onPickPage: (p: number) => void;
}) {
  return (
    <div
      className={cn(
        "absolute inset-y-0 left-0 z-20 flex w-64 flex-col border-r border-border bg-card",
        "@2xl:static @2xl:z-auto @2xl:w-60"
      )}
    >
      {/* ชั้นไฟล์ตรึงไว้บนสุด เอกสาร 20 หน้าเลื่อนดูหน้าแล้วรายการไฟล์จะไม่หายไป */}
      <div className="flex shrink-0 flex-col border-b border-border px-3 py-3">
        <p className="px-1 text-xs font-medium text-muted-foreground">
          ไฟล์ ({groups.reduce((n, g) => n + g.items.length, 0)})
        </p>
        {/* สูงได้ไม่เกินครึ่งราง ที่เหลือยกให้หน้าย่อ
            ไฟล์น้อยก็ไม่กินที่เปล่า ไฟล์เยอะก็เลื่อนดูในตัวเอง */}
        <div className="mt-1.5 max-h-[45vh] space-y-3 overflow-y-auto">
          {groups.map((g) => (
            <div key={g.name}>
              <p className="px-1 text-xs text-muted-foreground">{g.name}</p>
              <div className="mt-1 space-y-0.5">
                {g.items.map((f) => {
                  const on = f.id === file?.id;
                  const Icon = f.kind === "pdf" ? FileTextIcon : ImageIcon;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => onPickFile(f.id)}
                      aria-current={on}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors",
                        on
                          ? "bg-brand font-medium text-primary"
                          : "text-foreground hover:bg-accent-hover"
                      )}
                    >
                      <Icon className="size-4 shrink-0" />
                      <span className="truncate">{f.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* รูปไม่มีหน้า ชั้นนี้จึงหายไปทั้งชั้น ไม่ใช่โชว์ช่องเดียวลอย ๆ */}
      {file && file.kind === "pdf" && (
        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
          <p className="px-1 text-xs font-medium text-muted-foreground">
            หน้า ({file.pages})
          </p>
          <div className="mt-2 space-y-2 px-6">
            {Array.from({ length: file.pages }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => onPickPage(n)}
                aria-current={n === page}
                className="block w-full"
              >
                <span
                  className={cn(
                    "block aspect-[1/1.35] w-full rounded border-2 bg-card p-1.5",
                    n === page ? "border-primary" : "border-border"
                  )}
                >
                  <MiniPage />
                </span>
                <span
                  className={cn(
                    "mt-1 block text-center text-xs tabular-nums",
                    n === page ? "font-semibold text-primary" : "text-muted-foreground"
                  )}
                >
                  {n}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/** เส้นแทนข้อความในหน้าย่อ — ตัวอย่างเฉย ๆ ยังไม่ได้ต่อกับตัวอ่าน PDF จริง */
function MiniPage() {
  return (
    <span className="flex h-full w-full flex-col gap-[3px]">
      <span className="h-1 w-1/2 rounded-full bg-border" />
      <span className="h-1 w-2/3 rounded-full bg-border" />
      <span className="mt-1 h-1 w-full rounded-full bg-border" />
      <span className="h-1 w-full rounded-full bg-border" />
      <span className="h-1 w-4/5 rounded-full bg-border" />
      <span className="mt-1 h-1 w-full rounded-full bg-border" />
      <span className="h-1 w-3/5 rounded-full bg-border" />
    </span>
  );
}

function MockPage({ file, page }: { file: ViewerFile | null; page: number }) {
  return (
    <div className="mx-auto aspect-[1/1.414] w-full max-w-3xl rounded-lg bg-card p-8 shadow-sm @2xl:p-12">
      <p className="text-sm text-muted-foreground">{file?.group}</p>
      <p className="mt-1 font-semibold">{file?.name}</p>
      <p className="mt-6 text-center text-lg font-semibold">ใบชั่งน้ำหนัก</p>
      <div className="mt-6 space-y-2.5">
        {Array.from({ length: 12 }, (_, i) => (
          <span
            key={i}
            className="block h-2 rounded-full bg-secondary"
            style={{ width: `${[92, 84, 96, 70, 88, 60, 94, 78, 90, 66, 86, 74][i]}%` }}
          />
        ))}
      </div>
      <p className="mt-10 text-center text-sm text-muted-foreground tabular-nums">
        หน้า {page}
      </p>
    </div>
  );
}

function IconBtn({
  label,
  title,
  onClick,
  children,
}: {
  label: string;
  title?: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={title ?? label}
      onClick={onClick}
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-md",
        "text-muted-foreground transition-colors hover:bg-accent-hover hover:text-foreground",
        "focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
      )}
    >
      {children}
    </button>
  );
}
