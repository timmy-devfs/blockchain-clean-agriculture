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

  const [seedResult, setSeedResult] = useState<{
    log?: string[];
    ok?: boolean;
    error?: string;
    message?: string;
    ids?: Record<string, string>;
  } | null>(null);
  const [seeding, setSeeding] = useState(false);

  const handleSeedData = useCallback(async () => {
    setSeeding(true);
    setSeedResult(null);
    try {
      const res = await fetch("/api/seed", { method: "POST" });
      const data = (await res.json()) as {
        log?: string[];
        ok?: boolean;
        error?: string;
        message?: string;
        ids?: Record<string, string>;
      };
      setSeedResult(data);
    } catch (e) {
      setSeedResult({
        ok: false,
        error: e instanceof Error ? e.message : "Request failed",
        log: [],
      });
    } finally {
      setSeeding(false);
    }
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

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-linear-to-br from-gray-950 via-gray-900 to-emerald-950 px-4 py-12">
      <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />
      <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-green-400 to-emerald-600 shadow-lg shadow-green-900/40">
            <span className="text-xl font-black text-white">B</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Quick Setup — Demo</h1>
          <p className="mt-1 text-sm text-gray-400">
            Bước 1: tài khoản (khi DB trống) · Bước 2: farm, season, listing, đơn, fleet
          </p>
        </div>

        {systemEmpty === false ? (
          <div className="mb-4 rounded-xl border border-sky-500/30 bg-sky-500/10 px-3 py-2 text-sm text-sky-100">
            Hệ thống đã có tài khoản — bỏ qua bước 1 hoặc đăng nhập. Vẫn có thể chạy bước 2 để tạo dữ liệu
            mẫu (idempotent một phần: có thể báo trùng khi đã seed).
          </div>
        ) : null}

        {gateError ? <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">{gateError}</div> : null}

        <div>
          <h2 className="text-base font-semibold text-white">Bước 1: Tài khoản demo</h2>
          <p className="mt-1 text-sm text-gray-500">
            Chỉ cần khi <span className="text-gray-300">bootstrap-status</span> báo DB trống — nút sẽ khóa
            nếu không áp dụng.
          </p>
        </div>

        <ul className="mb-4 mt-3 space-y-2 text-sm text-gray-300">
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

        <ul className="mt-4 space-y-2 font-mono text-xs text-gray-400">
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
          <p className="mt-4 text-center text-sm text-emerald-300">
            Bước 1 xong!{" "}
            <a href="/login" className="font-semibold underline hover:text-emerald-200">
              Đăng nhập
            </a>{" "}
            hoặc tiếp tục bước 2.
          </p>
        ) : null}

        <div className="mt-8 border-t border-white/10 pt-6">
          <h2 className="text-base font-semibold text-white">Bước 2: Tạo dữ liệu mẫu</h2>
          <p className="mt-2 text-sm text-gray-400">
            Gọi API gateway từ máy chủ Next: đăng ký (an toàn khi đã có user), farm → duyệt → season → listing →
            đơn retailer → driver &amp; xe. Chạy sau khi các service và{" "}
            <code className="text-emerald-300/90">NEXT_PUBLIC_API_URL</code> trỏ đúng gateway.
          </p>
          <button
            type="button"
            onClick={handleSeedData}
            disabled={seeding}
            className="mt-4 rounded-xl bg-linear-to-r from-sky-500 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-sky-900/30 transition hover:from-sky-400 hover:to-blue-500 disabled:opacity-60"
          >
            {seeding ? "Đang seed..." : "Tạo dữ liệu mẫu"}
          </button>

          {seedResult ? (
            <div className="mt-4 max-h-80 overflow-y-auto rounded-xl border border-white/10 bg-black/30 p-4 font-mono text-xs">
              {(seedResult.log ?? []).map((line, i) => (
                <div
                  key={`${i}-${line.slice(0, 24)}`}
                  className={
                    line.startsWith("✓")
                      ? "text-emerald-400"
                      : line.startsWith("⚠")
                        ? "text-amber-300"
                        : "text-gray-400"
                  }
                >
                  {line}
                </div>
              ))}
              {seedResult.error ? <div className="mt-3 text-rose-400">{seedResult.error}</div> : null}
              {seedResult.ok ? (
                <div className="mt-3 font-sans font-semibold text-emerald-300">
                  Seed hoàn tất. Đăng nhập farm1 / shipper1 / retail1 để kiểm tra dashboard.
                </div>
              ) : null}
              {seedResult.message && !seedResult.ok ? (
                <div className="mt-2 font-sans text-gray-400">{seedResult.message}</div>
              ) : null}
            </div>
          ) : null}
        </div>

        <p className="mt-6 text-center text-sm text-gray-500">
          <a href="/login" className="text-emerald-400 hover:underline">
            Đăng nhập
          </a>
        </p>
      </div>
    </div>
  );
}
