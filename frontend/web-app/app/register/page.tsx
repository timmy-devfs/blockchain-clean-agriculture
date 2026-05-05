"use client";

import { FormEvent, useMemo, useState } from "react";
import { useAuth, decodeJWT } from "@bicap/auth";
import { axiosInstance, tokenStorage } from "@bicap/api-client";
import { isAxiosError } from "axios";

const ROLE_MAP: Record<string, string> = {
  "admin@bicap.io": "ADMIN",
  "farm1@bicap.io": "FARM_MANAGER",
  "farm2@bicap.io": "FARM_MANAGER",
  "retail1@bicap.io": "RETAILER",
  "retail2@bicap.io": "RETAILER",
  "shipper1@bicap.io": "SHIPPER",
  "shipper2@bicap.io": "SHIPPER",
};

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "ADMIN",
  FARM_MANAGER: "FARM_MANAGER",
  RETAILER: "RETAILER",
  SHIPPER: "SHIPPER",
  GUEST: "GUEST",
};

const DROPDOWN_ROLES = ["FARM_MANAGER", "RETAILER", "SHIPPER", "GUEST"] as const;

function detectMappedRole(email: string): string | null {
  const e = email.trim().toLowerCase();
  if (ROLE_MAP[e]) return ROLE_MAP[e];
  return null;
}

function resolveRegisterRole(email: string, selectedRole: string): string {
  const mapped = detectMappedRole(email);
  if (mapped) return mapped;
  const e = email.trim().toLowerCase();
  if (e.endsWith("@bicap.io")) return "GUEST";
  return selectedRole;
}

const ROLE_HOME: Record<string, string> = {
  ADMIN: "/admin/dashboard",
  FARM_MANAGER: "/farm/dashboard",
  RETAILER: "/retailer/dashboard",
  SHIPPING_MANAGER: "/shipping/dashboard",
  SHIP_DRIVER: "/shipping/dashboard",
  SHIPPER: "/shipping/dashboard",
  GUEST: "/public",
};

function pickErrorMessage(err: unknown): string {
  if (isAxiosError(err)) {
    const data = err.response?.data as { message?: string } | undefined;
    if (data?.message) return data.message;
  }
  if (err instanceof Error) return err.message;
  return "Dang ky that bai. Vui long thu lai.";
}

export default function RegisterPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("FARM_MANAGER");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const autoRole = useMemo(() => detectMappedRole(email), [email]);
  const bicapGuest = useMemo(() => {
    const e = email.trim().toLowerCase();
    return e.length > 0 && e.endsWith("@bicap.io") && !ROLE_MAP[e];
  }, [email]);

  const showAutoBadge = autoRole != null || bicapGuest;
  const autoRoleLabel = autoRole ?? (bicapGuest ? "GUEST" : null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    const role = resolveRegisterRole(email, selectedRole);
    if (!role) {
      setError("Vui lòng chọn vai trò");
      return;
    }

    setIsLoading(true);
    try {
      await axiosInstance.post("/api/auth/register", {
        email: email.trim(),
        password,
        fullName: fullName.trim(),
        role,
      });

      await login(email.trim(), password);

      const token = tokenStorage.getAccessToken();
      if (token) {
        document.cookie = `bicap_access_token=${encodeURIComponent(token)}; path=/; max-age=28800; SameSite=Strict`;
      }
      const payloadRole = token ? decodeJWT(token)?.role : null;
      const r = typeof payloadRole === "string" ? payloadRole : role;
      const target = ROLE_HOME[r] ?? "/public";
      window.location.href = target;
    } catch (err) {
      setError(pickErrorMessage(err));
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
          <p className="mt-1 text-sm text-gray-400">Đăng ký tài khoản</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-300">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-gray-500 outline-none transition focus:border-green-400/60 focus:ring-2 focus:ring-green-400/20"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-300">Họ và tên</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nguyen Van A"
              autoComplete="name"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-gray-500 outline-none transition focus:border-green-400/60 focus:ring-2 focus:ring-green-400/20"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-300">Mật khẩu</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Tối thiểu 6 ký tự"
              autoComplete="new-password"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-gray-500 outline-none transition focus:border-green-400/60 focus:ring-2 focus:ring-green-400/20"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-300">Vai trò</label>
            {showAutoBadge && autoRoleLabel ? (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
                🟢 Vai trò được xác định tự động: <span className="font-semibold">{ROLE_LABEL[autoRoleLabel] ?? autoRoleLabel}</span>
              </div>
            ) : (
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-green-400/60 focus:ring-2 focus:ring-green-400/20"
              >
                {DROPDOWN_ROLES.map((r) => (
                  <option key={r} value={r} className="bg-gray-900">
                    {r}
                  </option>
                ))}
              </select>
            )}
          </div>

          {error ? (
            <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2.5 text-sm text-rose-400">{error}</div>
          ) : null}

          <button
            type="submit"
            disabled={isLoading}
            className="mt-2 w-full rounded-xl bg-linear-to-r from-green-500 to-emerald-600 py-3 text-sm font-semibold text-white shadow-lg shadow-green-900/30 transition hover:from-green-400 hover:to-emerald-500 disabled:opacity-60"
          >
            {isLoading ? "Đang đăng ký..." : "Đăng ký"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-400">
          Đã có tài khoản?{" "}
          <a href="/login" className="font-medium text-emerald-400 hover:text-emerald-300 hover:underline">
            Đăng nhập
          </a>
        </p>
      </div>
    </div>
  );
}
