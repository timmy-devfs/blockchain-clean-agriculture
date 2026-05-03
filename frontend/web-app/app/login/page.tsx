"use client";

import { FormEvent, useState } from "react";
import { useAuth } from "@bicap/auth";
import { tokenStorage } from "@bicap/api-client";
import { decodeJWT } from "@bicap/auth";

const ROLE_HOME: Record<string, string> = {
  ADMIN: "/admin/dashboard",
  FARM_MANAGER: "/farm/dashboard",
  RETAILER: "/retailer/dashboard",
  SHIPPING_MANAGER: "/shipping/dashboard",
  SHIP_DRIVER: "/shipping/dashboard",
  SHIPPER: "/shipping/dashboard",
  GUEST: "/public",
};

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Cập nhật cả AuthProvider context lẫn localStorage + cookie qua tokenStorage.setTokens().
      await login(email.trim(), password);

      const token = tokenStorage.getAccessToken();
      if (token) {
        document.cookie = `bicap_access_token=${encodeURIComponent(token)}; path=/; max-age=28800; SameSite=Strict`;
      }
      const role = token ? decodeJWT(token)?.role : null;
      const target = (role && ROLE_HOME[role]) ?? "/public";

      // Hard-nav để chắc chắn middleware đọc cookie mới và mọi context được mount lại sạch sẽ.
      window.location.href = target;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "";
      setError(message || "Email hoac mat khau khong dung.");
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-linear-to-br from-gray-950 via-gray-900 to-emerald-950 px-4">
      <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-green-500/10 blur-3xl" />

      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-green-400 to-emerald-600 shadow-lg shadow-green-900/40">
            <span className="text-xl font-black text-white">B</span>
          </div>
          <h1 className="text-2xl font-bold text-white">BICAP</h1>
          <p className="mt-1 text-sm text-gray-400">Dang nhap he thong da vai tro</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-300">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@bicap.vn"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-gray-500 outline-none transition focus:border-green-400/60 focus:ring-2 focus:ring-green-400/20"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-300">Mat khau</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="******"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-gray-500 outline-none transition focus:border-green-400/60 focus:ring-2 focus:ring-green-400/20"
            />
          </div>

          {error ? (
            <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2.5 text-sm text-rose-400">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isLoading}
            className="mt-2 w-full rounded-xl bg-linear-to-r from-green-500 to-emerald-600 py-3 text-sm font-semibold text-white shadow-lg shadow-green-900/30 transition hover:from-green-400 hover:to-emerald-500 disabled:opacity-60"
          >
            {isLoading ? "Dang dang nhap..." : "Dang nhap"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-500">
          Chưa có tài khoản?{" "}
          <a href="/register" className="font-medium text-green-600 hover:underline">
            Đăng ký ngay
          </a>
        </p>

        <div className="mt-6 grid grid-cols-2 gap-2 text-center text-[11px] text-gray-400">
          <span>admin@bicap.io / 123456</span>
          <span>farm1@bicap.io / 123456</span>
          <span>retail1@bicap.io / 123456</span>
          <span>shipper1@bicap.io / 123456</span>
        </div>
      </div>
    </div>
  );
}
