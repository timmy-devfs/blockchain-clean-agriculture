"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PublicNav } from "@/components/public/PublicNav";

const SAMPLE_CODES = ["DEMO", "SP001", "LH0001-F32L"];

export default function TraceSearchPage() {
  const [code, setCode] = useState("");
  const router = useRouter();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = code.trim();
    if (!q) return;
    router.push(`/trace/${encodeURIComponent(q)}`);
  }

  return (
    <main className="min-h-screen bg-[#fafaf7]">
      <PublicNav />

      <section className="border-b border-emerald-900/20 bg-gradient-to-br from-[#1a3d1a] to-[#2d6a2d] px-6 py-14 text-white">
        <div className="mx-auto max-w-xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">Truy xuất</p>
          <h1 className="mt-3 font-serif text-3xl font-bold md:text-4xl">Tra cứu theo mã QR / mã lô</h1>
          <p className="mt-3 text-sm text-white/75">
            Nhập mã in trên bao bì hoặc thử các mã mẫu bên dưới. Hệ thống gọi{" "}
            <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs">GET /api/public/trace/&#123;mã&#125;</code>{" "}
            (qua Gateway); nếu không có trên chuỗi sẽ thử dữ liệu demo.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-xl px-6 py-10">
        <form onSubmit={onSubmit} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <label htmlFor="qr-input" className="block text-sm font-medium text-gray-700">
            Mã QR / mã lô
          </label>
          <input
            id="qr-input"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="VD: DEMO, SP001, LH0001-F32L…"
            className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none ring-emerald-500/30 focus:border-emerald-500 focus:ring-2"
            autoComplete="off"
          />
          <button
            type="submit"
            className="mt-4 w-full rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            Tra cứu
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-gray-500">Gợi ý mã thử:</p>
        <div className="mt-2 flex flex-wrap justify-center gap-2">
          {SAMPLE_CODES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => {
                setCode(c);
                router.push(`/trace/${encodeURIComponent(c)}`);
              }}
              className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 hover:bg-emerald-100"
            >
              {c}
            </button>
          ))}
        </div>

        <p className="mt-10 text-center text-sm text-gray-500">
          <Link href="/public" className="font-semibold text-emerald-700 hover:text-emerald-800">
            ← Về trang công khai
          </Link>
        </p>
      </div>
    </main>
  );
}
