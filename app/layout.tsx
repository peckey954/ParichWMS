import type { Metadata } from "next";
import { Sarabun } from "next/font/google";
import { Toaster } from "@peckey954/ui/components/ui/sonner";
import { AppShell } from "@/components/app-shell";
import { ThemeProvider } from "@/components/providers";
import "./globals.css";

// ต้องมี subset "thai" ไม่งั้นตัวอักษรไทยจะตกไปใช้ฟอนต์สำรอง
const brandFont = Sarabun({
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-brand",
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
      data-brand="parichwms"
      className={brandFont.variable}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-background text-foreground font-sans antialiased">
        <ThemeProvider>
          <AppShell>{children}</AppShell>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
