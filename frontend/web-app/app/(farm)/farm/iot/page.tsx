"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DataTable } from "@bicap/ui";
import type { Column } from "@bicap/ui";
import type { IoTReading } from "@bicap/types";
import { ProtectedRoute, useAuth } from "@bicap/auth";
import { UserRole } from "@bicap/types";
import { getIoTReadings } from "@/lib/api";

type ReadingTypeFilter = "ALL" | IoTReading["type"];

const REFRESH_MS = 30_000;

const TYPE_CHIPS: Array<{ label: string; value: ReadingTypeFilter }> = [
  { label: "TẤT CẢ", value: "ALL" },
  { label: "NHIỆT ĐỘ", value: "TEMPERATURE" },
  { label: "ĐỘ ẨM", value: "HUMIDITY" },
  { label: "pH", value: "PH" },
];

const IOT_COLUMNS: Column<IoTReading>[] = [
  {
    key: "recordedAt",
    header: "Thời gian",
    render: (value) => (
      <span className="text-sm text-gray-600">
        {new Date(String(value)).toLocaleString("vi-VN")}
      </span>
    ),
  },
  {
    key: "type",
    header: "Loại",
    render: (value) => {
      const type = String(value) as IoTReading["type"];
      const map: Record<IoTReading["type"], string> = {
        TEMPERATURE: "Nhiệt độ",
        HUMIDITY: "Độ ẩm",
        PH: "pH",
      };
      return <span className="font-medium text-gray-800">{map[type] ?? type}</span>;
    },
  },
  {
    key: "value",
    header: "Giá trị",
    render: (value) => <span className="font-semibold text-gray-900">{Number(value).toFixed(2)}</span>,
  },
  {
    key: "unit",
    header: "Đơn vị",
    render: (value) => <span className="text-gray-600">{String(value)}</span>,
  },
  {
    key: "isAlert",
    header: "Cảnh báo",
    render: (value) => (
      <span
        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
          value ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"
        }`}
      >
        {value ? "Có" : "Không"}
      </span>
    ),
  },
];

function normalizeRows(result?: { data: IoTReading[] }): IoTReading[] {
  return Array.isArray(result?.data) ? result.data : [];
}

function averageToday(rows: IoTReading[]): number | null {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayRows = rows.filter((r) => new Date(r.recordedAt) >= startOfDay);
  if (todayRows.length === 0) return null;
  const sum = todayRows.reduce((acc, cur) => acc + Number(cur.value ?? 0), 0);
  return sum / todayRows.length;
}

function isOutOfRange(type: IoTReading["type"], value: number | null): boolean {
  if (value == null) return false;
  if (type === "TEMPERATURE") return value < 15 || value > 35;
  if (type === "HUMIDITY") return value < 40 || value > 80;
  return value < 5.5 || value > 7.5;
}

function typeMeta(type: IoTReading["type"]) {
  if (type === "TEMPERATURE") return { icon: "🌡️", title: "Nhiệt độ TB hôm nay" };
  if (type === "HUMIDITY") return { icon: "💧", title: "Độ ẩm TB hôm nay" };
  return { icon: "🧪", title: "pH TB hôm nay" };
}

function IoTStatCard({
  type,
  value,
  unit,
}: {
  type: IoTReading["type"];
  value: number | null;
  unit?: string;
}) {
  const { icon, title } = typeMeta(type);
  const danger = isOutOfRange(type, value);
  return (
    <div
      className={`rounded-xl border bg-white p-4 shadow-sm ${
        danger ? "border-red-300" : "border-gray-100"
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</p>
      <div className="mt-2 flex items-center gap-2">
        <span className="text-xl">{icon}</span>
        <span className="text-2xl font-bold text-gray-900">
          {value == null ? "—" : value.toFixed(2)}
        </span>
        <span className="text-sm text-gray-500">{unit ?? ""}</span>
      </div>
      <p className={`mt-2 text-xs ${danger ? "text-red-600" : "text-gray-500"}`}>
        {danger ? "Ngoài ngưỡng bình thường" : "Trong ngưỡng bình thường"}
      </p>
    </div>
  );
}

export default function FarmIotPage() {
  const { user } = useAuth();
  const farmId = user?.id ?? "";
  const [activeType, setActiveType] = useState<ReadingTypeFilter>("ALL");

  const allQuery = useQuery({
    queryKey: ["farm-iot", farmId, "ALL"],
    queryFn: () => getIoTReadings(farmId),
    enabled: Boolean(farmId),
    refetchInterval: REFRESH_MS,
  });
  const tempQuery = useQuery({
    queryKey: ["farm-iot", farmId, "TEMPERATURE"],
    queryFn: () => getIoTReadings(farmId, "TEMPERATURE"),
    enabled: Boolean(farmId),
    refetchInterval: REFRESH_MS,
  });
  const humidityQuery = useQuery({
    queryKey: ["farm-iot", farmId, "HUMIDITY"],
    queryFn: () => getIoTReadings(farmId, "HUMIDITY"),
    enabled: Boolean(farmId),
    refetchInterval: REFRESH_MS,
  });
  const phQuery = useQuery({
    queryKey: ["farm-iot", farmId, "PH"],
    queryFn: () => getIoTReadings(farmId, "PH"),
    enabled: Boolean(farmId),
    refetchInterval: REFRESH_MS,
  });

  const allRows = normalizeRows(allQuery.data);
  const filteredRows = useMemo(() => {
    if (activeType === "ALL") return allRows;
    return allRows.filter((r) => r.type === activeType);
  }, [allRows, activeType]);

  const now = Date.now();
  const alertsIn24h = allRows.filter(
    (r) => r.isAlert && now - new Date(r.recordedAt).getTime() <= 24 * 60 * 60 * 1000,
  );

  const avgTemp = averageToday(normalizeRows(tempQuery.data));
  const avgHumidity = averageToday(normalizeRows(humidityQuery.data));
  const avgPh = averageToday(normalizeRows(phQuery.data));

  const isLoading = allQuery.isLoading || tempQuery.isLoading || humidityQuery.isLoading || phQuery.isLoading;
  const isOffline = allQuery.isError || !farmId;
  const hasNoData = !isLoading && filteredRows.length === 0;

  return (
    <ProtectedRoute allowedRoles={[UserRole.FARM_MANAGER]}>
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">IoT Monitor</h1>
          <p className="text-sm text-gray-500">Theo dõi cảm biến theo thời gian thực (refresh mỗi 30 giây)</p>
        </div>
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
            isOffline ? "bg-gray-100 text-gray-600" : "bg-emerald-100 text-emerald-700"
          }`}
        >
          {isOffline ? "OFFLINE" : "LIVE"}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <IoTStatCard
          type="TEMPERATURE"
          value={avgTemp}
          unit={normalizeRows(tempQuery.data)[0]?.unit ?? "°C"}
        />
        <IoTStatCard
          type="HUMIDITY"
          value={avgHumidity}
          unit={normalizeRows(humidityQuery.data)[0]?.unit ?? "%"}
        />
        <IoTStatCard type="PH" value={avgPh} unit={normalizeRows(phQuery.data)[0]?.unit ?? "pH"} />
      </div>

      {alertsIn24h.length > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <p className="font-semibold text-red-700">
            Cảnh báo: phát hiện {alertsIn24h.length} bản ghi bất thường trong 24 giờ qua
          </p>
          <ul className="mt-2 list-disc pl-5 text-sm text-red-700">
            {alertsIn24h.slice(0, 5).map((r) => (
              <li key={r.id}>
                {new Date(r.recordedAt).toLocaleString("vi-VN")} - {r.type}: {Number(r.value).toFixed(2)} {r.unit}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-wrap gap-1.5">
        {TYPE_CHIPS.map((chip) => (
          <button
            key={chip.value}
            onClick={() => setActiveType(chip.value)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              activeType === chip.value
                ? "bg-indigo-600 text-white shadow-sm"
                : "border border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
            }`}
          >
            {chip.label}
          </button>
        ))}
      </div>

      <DataTable<IoTReading>
        columns={IOT_COLUMNS}
        data={filteredRows}
        isLoading={isLoading}
        keyField="id"
        emptyMessage="Chưa có dữ liệu IoT"
      />

      {hasNoData && (
        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 py-10 text-center">
          <p className="text-3xl">📡</p>
          <p className="mt-2 font-medium text-gray-700">Chưa có dữ liệu IoT</p>
          <p className="mt-1 text-sm text-gray-500">
            Hệ thống chưa ghi nhận readings cho farm hiện tại hoặc cảm biến chưa gửi dữ liệu.
          </p>
        </div>
      )}
    </div>
    </ProtectedRoute>
  );
}
