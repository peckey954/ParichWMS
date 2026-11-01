import type { Metadata } from "next";
import { Sarabun } from "next/font/google";
import { AppShell } from "@/components/app-shell";
import { ThemeProvider } from "@/components/providers";
import { ToasterHost } from "@/components/toaster-host";
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
          <ToasterHost />
        </ThemeProvider>
      </body>
    </html>
  );
}
