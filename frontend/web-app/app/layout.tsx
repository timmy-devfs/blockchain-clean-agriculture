import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BICAP Platform",
  description:
    "BICAP Platform - Blockchain Integration in Clean Agricultural Production, cung cap cong cu van hanh theo role cho Admin, Farm Manager, Retailer, Shipping Manager va cong khai truy xuat nguon goc.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}