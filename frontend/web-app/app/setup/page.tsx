"use client";

import { useCallback, useEffect, useState } from "react";
import { axiosInstance } from "@bicap/api-client";
import type { ApiResponse } from "@bicap/types";
import { isAxiosError } from "axios";

const DEMO_ACCOUNTS = [
  { email: "admin@bicap.io", password: "123456", fullName: "BICAP Administrator", role: "ADMIN" },
  { email: "farm1@bicap.io", password: "123456", fullName: "Nguyen Van A", role: "FARM_MANAGER" },
  { email: "retail1@bicap.io", password: "123456", fullName: "Retail Demo", role: "RETAILER" },
  { email: "shipper1@bicap.io", password: "123456", fullName: "Shipping Demo", role: "SHIPPER" },
] as const;

type LineStatus = "pending" | "ok" | "skip" | "err";

interface ProgressLine {
  email: string;
  status: LineStatus;
  detail?: string;
}

export default function SetupPage() {
  const [gateLoading, setGateLoading] = useState(true);
  const [systemEmpty, setSystemEmpty] = useState<boolean | null>(null);
  const [gateError, setGateError] = useState("");

  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [lines, setLines] = useState<ProgressLine[]>(() =>
    DEMO_ACCOUNTS.map((a) => ({ email: a.email, status: "pending" }))
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setGateLoading(true);
      setGateError("");
      try {
        const { data: body } = await axiosInstance.get<ApiResponse<{ systemEmpty: boolean }>>(
          "/api/auth/bootstrap-status"
        );
        if (!cancelled) setSystemEmpty(body.data.systemEmpty);
      } catch {
        if (!cancelled) {
          setGateError("Không kiểm tra được trạng thái hệ thống. Kiểm tra API Gateway và identity-service.");
          setSystemEmpty(null);
        }
      } finally {
        if (!cancelled) setGateLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const runSeed = useCallback(async () => {
    setRunning(true);
    setDone(false);
    setLines(DEMO_ACCOUNTS.map((a) => ({ email: a.email, status: "pending" })));

    for (let i = 0; i < DEMO_ACCOUNTS.length; i++) {
      const acc = DEMO_ACCOUNTS[i];
      try {
        await axiosInstance.post("/api/auth/register", {
          email: acc.email,
          password: acc.password,
          fullName: acc.fullName,
          role: acc.role,
        });
        setLines((prev) => {
          const next = [...prev];
          next[i] = { email: acc.email, status: "ok" };
          return next;
        });
      } catch (err) {
        const msg = isAxiosError(err)
          ? String((err.response?.data as { message?: string })?.message ?? err.message)
          : err instanceof Error
            ? err.message
            : "Loi";
        const skip = msg.toLowerCase().includes("exist") || msg.includes("1001");
        setLines((prev) => {
          const next = [...prev];
          next[i] = {
            email: acc.email,
            status: skip ? "skip" : "err",
            detail: msg,
          };
          return next;
        });
        if (!skip) break;
      }
    }

    setRunning(false);
    setDone(true);
  }, []);

  if (gateLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-gray-950 via-gray-900 to-emerald-950 px-4 text-gray-300">
        Đang kiểm tra...
      </div>
    );
  }

  if (systemEmpty === false) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-linear-to-br from-gray-950 via-gray-900 to-emerald-950 px-4">
        <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl">
          <h1 className="text-xl font-bold text-white">Hệ thống đã có tài khoản</h1>
          <p className="mt-2 text-sm text-gray-400">Trang seed demo chỉ dùng khi database chưa có user nào.</p>
          <a
            href="/login"
            className="mt-6 inline-block rounded-xl bg-linear-to-r from-green-500 to-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-green-900/30"
          >
            Đăng nhập
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-linear-to-br from-gray-950 via-gray-900 to-emerald-950 px-4 py-12">
      <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />
      <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-green-400 to-emerald-600 shadow-lg shadow-green-900/40">
            <span className="text-xl font-black text-white">B</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Quick Setup — Demo</h1>
          <p className="mt-1 text-sm text-gray-400">Tạo nhanh 4 tài khoản demo (chỉ khi DB trống)</p>
        </div>

        {gateError ? <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">{gateError}</div> : null}

        <ul className="mb-6 space-y-2 text-sm text-gray-300">
          {DEMO_ACCOUNTS.map((a) => (
            <li key={a.email} className="flex justify-between rounded-lg border border-white/5 bg-white/5 px-3 py-2">
              <span>{a.email}</span>
              <span className="text-gray-500">{a.role}</span>
            </li>
          ))}
        </ul>

        <button
          type="button"
          disabled={running || systemEmpty !== true}
          onClick={runSeed}
          className="w-full rounded-xl bg-linear-to-r from-green-500 to-emerald-600 py-3 text-sm font-semibold text-white shadow-lg shadow-green-900/30 transition hover:from-green-400 hover:to-emerald-500 disabled:opacity-60"
        >
          {running ? "Đang tạo..." : "Tạo tất cả tài khoản demo"}
        </button>

        <ul className="mt-6 space-y-2 font-mono text-xs text-gray-400">
          {lines.map((line) => (
            <li key={line.email} className="flex flex-wrap items-baseline gap-2">
              <span>
                {line.status === "ok" && "✓"}
                {line.status === "skip" && "○"}
                {line.status === "err" && "✗"}
                {line.status === "pending" && "…"}{" "}
                {line.email}
              </span>
              {line.detail ? <span className="text-rose-400/90">{line.detail}</span> : null}
            </li>
          ))}
        </ul>

        {done && !running ? (
          <p className="mt-6 text-center text-sm text-emerald-300">
            Hoàn thành!{" "}
            <a href="/login" className="font-semibold underline hover:text-emerald-200">
              Bấm đây để đăng nhập
            </a>
          </p>
        ) : null}

        <p className="mt-6 text-center text-sm text-gray-500">
          <a href="/login" className="text-emerald-400 hover:underline">
            Đăng nhập
          </a>
        </p>
      </div>
    </div>
  );
}
