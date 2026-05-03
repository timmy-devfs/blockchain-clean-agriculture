"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Toast } from "@bicap/ui";
import {
  createShipment,
  getAxiosErrorMessage,
  getConfirmedOrdersForShipping,
  getShippingDrivers,
  getShippingVehicles,
  type PendingConfirmedOrderRow,
  type ShippingDriverRow,
  type ShippingVehicleRow,
} from "@/lib/api";

function tomorrowIsoDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

function AssignShipmentModal({
  order,
  drivers,
  vehicles,
  onClose,
  onConfirm,
  isSubmitting,
}: {
  order: PendingConfirmedOrderRow;
  drivers: ShippingDriverRow[];
  vehicles: ShippingVehicleRow[];
  onClose: () => void;
  onConfirm: (driverId: number, vehicleId: number) => void;
  isSubmitting: boolean;
}) {
  const [driverId, setDriverId] = useState<number>(drivers[0]?.id ?? 0);
  const [vehicleId, setVehicleId] = useState<number>(vehicles[0]?.id ?? 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold text-gray-900">Tạo chuyến hàng</h2>
        <p className="mt-1 font-mono text-xs text-gray-500">Đơn #{order.id.slice(0, 8)}…</p>
        <p className="mt-2 text-sm text-gray-600">{order.deliveryAddress ?? "—"}</p>

        <div className="mt-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-600">Tài xế</label>
            <select
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              value={driverId || ""}
              onChange={(e) => setDriverId(Number(e.target.value))}
            >
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.fullName}
                  {d.phone ? ` — ${d.phone}` : ""}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600">Phương tiện</label>
            <select
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              value={vehicleId || ""}
              onChange={(e) => setVehicleId(Number(e.target.value))}
            >
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.licensePlate} — {v.type}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Hủy
          </Button>
          <Button
            type="button"
            disabled={isSubmitting || !driverId || !vehicleId}
            onClick={() => onConfirm(driverId, vehicleId)}
          >
            {isSubmitting ? "Đang tạo…" : "Xác nhận"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function ShippingDashboardPage() {
  const queryClient = useQueryClient();
  const [modalOrder, setModalOrder] = useState<PendingConfirmedOrderRow | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const pendingQuery = useQuery({
    queryKey: ["confirmed-orders"],
    queryFn: getConfirmedOrdersForShipping,
    refetchInterval: 10_000,
  });

  const driversQuery = useQuery({
    queryKey: ["shipping-drivers"],
    queryFn: getShippingDrivers,
  });

  const vehiclesQuery = useQuery({
    queryKey: ["shipping-vehicles"],
    queryFn: getShippingVehicles,
  });

  const createMu = useMutation({
    mutationFn: async ({
      order,
      driverId,
      vehicleId,
    }: {
      order: PendingConfirmedOrderRow;
      driverId: number;
      vehicleId: number;
    }) => {
      await createShipment({
        orderId: order.orderId,
        driverId,
        vehicleId,
        farmId: order.farmId,
        retailerId: order.retailerId,
        deliveryAddress: order.deliveryAddress,
        scheduledDate: tomorrowIsoDate(),
      });
    },
    onSuccess: () => {
      setToast({ msg: "Đã tạo chuyến hàng.", type: "success" });
      setModalOrder(null);
      void queryClient.invalidateQueries({ queryKey: ["confirmed-orders"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-shipments"] });
    },
    onError: (e: unknown) => {
      setToast({ msg: getAxiosErrorMessage(e, "Không tạo được shipment"), type: "error" });
    },
  });

  const pending = pendingQuery.data ?? [];
  const drivers = driversQuery.data ?? [];
  const vehicles = vehiclesQuery.data ?? [];

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-gray-200 bg-white px-6 py-5">
        <h1 className="text-2xl font-bold text-gray-900">Điều phối vận chuyển</h1>
        <p className="text-sm text-gray-500">Đơn đã xác nhận — tạo chuyến và gán tài xế</p>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <section>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Đơn hàng chờ tạo chuyến
          </h2>

          {pendingQuery.isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-24 animate-pulse rounded-xl bg-gray-200" />
              ))}
            </div>
          ) : pending.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 bg-white py-16 text-center text-gray-500">
              Không có đơn CONFIRMED nào chờ vận chuyển.
            </div>
          ) : (
            <div className="space-y-4">
              {pending.map((row) => (
                <div
                  key={`${row.id}-${row.orderId}`}
                  className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-mono text-xs text-gray-400">Order ID (Mongo)</p>
                    <p className="font-mono text-sm text-gray-800">{row.id}</p>
                    <p className="mt-2 text-sm text-gray-600">{row.deliveryAddress ?? "—"}</p>
                  </div>
                  <Button type="button" onClick={() => setModalOrder(row)}>
                    Tạo chuyến hàng
                  </Button>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {modalOrder && (driversQuery.isLoading || vehiclesQuery.isLoading) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="rounded-xl bg-white px-8 py-6 text-sm text-gray-600 shadow-xl">
            Đang tải danh sách tài xế và phương tiện…
          </div>
        </div>
      )}

      {modalOrder && !driversQuery.isLoading && !vehiclesQuery.isLoading && drivers.length > 0 && vehicles.length > 0 && (
        <AssignShipmentModal
          order={modalOrder}
          drivers={drivers}
          vehicles={vehicles}
          isSubmitting={createMu.isPending}
          onClose={() => !createMu.isPending && setModalOrder(null)}
          onConfirm={(driverId, vehicleId) => {
            createMu.mutate({ order: modalOrder, driverId, vehicleId });
          }}
        />
      )}

      {modalOrder && !driversQuery.isLoading && !vehiclesQuery.isLoading && (drivers.length === 0 || vehicles.length === 0) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-w-sm rounded-xl bg-white p-6 text-center shadow-xl">
            <p className="text-sm text-gray-700">
              Cần có ít nhất một tài xế và một phương tiện trong hệ thống.
            </p>
            <Button className="mt-4" type="button" onClick={() => setModalOrder(null)}>
              Đóng
            </Button>
          </div>
        </div>
      )}

      {toast && (
        <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
