import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { Sarabun } from "next/font/google";
import { Toaster } from "@peckey954/ui/components/ui/sonner";
import { AppShell } from "@/components/app-shell";
import { ThemeProvider } from "@/components/providers";
import "./globals.css";

// ต้องมี subset "thai" ไม่งั้นตัวอักษรไทยจะตกไปใช้ฟอนต์สำรอง
// ชื่อ variable ต้องเป็น --font-sarabun เป๊ะ ๆ เพราะ styles.css ของ DS
// มองหาชื่อนี้ตรง ๆ ที่ html[data-font="sarabun"]
const sarabun = Sarabun({
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sarabun",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Parich WMS",
  description: "ระบบจัดการคลังสินค้า Parich WMS",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="th"
      className={sarabun.variable}
      data-brand="parich"
      data-tint="pure"
      data-font="sarabun"
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-background text-foreground font-sans antialiased">
        <ThemeProvider>
          <AppShell>{children}</AppShell>
          {/* toast สำเร็จ (success) ทั้งแอปใช้สีแบรนด์ส้มอ่อนแทนเขียว semantic
              เริ่มต้นของ DS — ต้องเปิด richColors ด้วยไม่งั้นตัวแปรสีพวกนี้ไม่มีผล
              และต้องยกค่าตัวอื่น (--normal-*, --warning-*, --error-*) มาด้วยครบ
              เพราะ prop style ที่ส่งจากตรงนี้แทนที่ style เดิมของ DS ทั้งก้อน
              ไม่ได้ merge ทีละตัวแปร

              ตำแหน่ง — ไม่ระบุ position/offset เอง ปล่อยเป็นค่าเริ่มต้นของ
              sonner (มุมล่างขวา) ตามที่ขอกลับมาใช้แบบเดิม */}
          <Toaster
            richColors
            style={
              {
                "--normal-bg": "var(--popover)",
                "--normal-text": "var(--popover-foreground)",
                "--normal-border": "var(--border)",
                "--border-radius": "var(--radius)",
                "--success-bg": "var(--brand)",
                "--success-text": "var(--primary)",
                "--success-border": "var(--primary)",
                "--warning-bg": "var(--warning)",
                "--warning-text": "var(--warning-foreground)",
                "--warning-border": "var(--warning-border)",
                "--error-bg": "var(--danger)",
                "--error-text": "var(--danger-foreground)",
                "--error-border": "var(--danger-border)",
              } as CSSProperties
            }
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
