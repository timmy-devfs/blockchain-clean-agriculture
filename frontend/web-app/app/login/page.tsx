"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { axiosInstance } from "@bicap/api-client";
import { decodeJWT } from "@bicap/auth";
import type { ApiResponse, AuthTokens } from "@bicap/types";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const { data } = await axiosInstance.post<ApiResponse<AuthTokens>>("/api/auth/login", {
        email: email.trim(),
        password,
      });

      const accessToken = data.data.accessToken;
      const refreshToken = data.data.refreshToken;
      localStorage.setItem("bicap_access_token", accessToken);
      localStorage.setItem("bicap_refresh_token", refreshToken);
      document.cookie = `bicap_access_token=${accessToken}; path=/; max-age=900; SameSite=Strict`;

      const payload = decodeJWT(accessToken);
      const role = payload?.role;

      switch (role) {
        case "ADMIN":
          router.replace("/admin/dashboard");
          break;
        case "FARM_MANAGER":
          router.replace("/farm/dashboard");
          break;
        case "RETAILER":
          router.replace("/retailer/dashboard");
          break;
        case "SHIPPING_MANAGER":
          router.replace("/shipping/dashboard");
          break;
        default:
          router.replace("/search");
      }
    } catch {
      setError("Email hoac mat khau khong dung.");
    } finally {
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
      </div>
    </div>
  );
}
