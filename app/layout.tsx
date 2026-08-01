import type { Metadata } from "next";
import { Sarabun } from "next/font/google";
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
  title: "ParichWMS",
  description: "ระบบจัดการคลังสินค้า ParichWMS",
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
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
