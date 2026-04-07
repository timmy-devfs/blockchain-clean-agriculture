import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BICAP System - Shipping",
  description: "Shipping management web"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

