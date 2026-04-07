import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BICAP System",
  description: "End-to-end FE->BE test page"
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

