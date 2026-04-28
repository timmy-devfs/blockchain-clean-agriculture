import type { ReactNode } from "react";
import Link from "next/link";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-4 px-4">
          <Link href="/search" className="text-lg font-bold text-green-700">
            BICAP
          </Link>
          <form action="/search" className="flex-1">
            <input
              name="q"
              placeholder="Tim san pham, ma lo, trang trai..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-green-600"
            />
          </form>
          <Link
            href="/login"
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
          >
            Dang nhap
          </Link>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
