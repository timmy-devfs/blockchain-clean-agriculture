"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type ApiResponse<T> = { code: number; message: string; data: T };

type Shipment = {
  id: number;
  orderId: number;
  farmId: number;
  retailerId: number;
  driverId: number | null;
  vehicleId: number | null;
  status: string;
  pickupAddress: string | null;
  deliveryAddress: string | null;
  scheduledDate: string | null;
};

type Driver = {
  id: number;
  fullName: string;
  phone: string | null;
  licenseNo: string | null;
  licenseClass: string | null;
  isActive: boolean | null;
};

type Vehicle = {
  id: number;
  licensePlate: string;
  type: string;
  capacity: number | null;
  isActive: boolean | null;
};

type HistoryRow = {
  id: number;
  shipmentId: number;
  status: string;
  changedAt: string;
  changedBy: string | null;
  note: string | null;
};

const DEFAULT_API_GATEWAY_URL = "http://localhost:8080";

async function j<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    cache: "no-store"
  });
  let body: unknown;
  try {
    body = await res.json();
  } catch {
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    throw new Error("Invalid JSON response");
  }
  const b = body as { code?: number; message?: string };
  if (!res.ok) throw new Error(b.message ?? `${res.status} ${res.statusText}`);
  if (typeof b.code === "number" && b.code !== 200) {
    throw new Error(b.message ?? `Mã lỗi ${b.code}`);
  }
  return body as T;
}

function StatusBadge({ status }: { status: string }) {
  const cls = `badge status_${status}`;
  return (
    <span className={cls} title={status}>
      <span className="dot" />
      <span style={{ fontWeight: 700 }}>{status}</span>
    </span>
  );
}

function nextActions(status: string): string[] {
  switch (status) {
    case "CREATED":
      return ["CANCELLED"];
    case "ASSIGNED":
      return ["PICKED_UP", "CANCELLED"];
    case "PICKED_UP":
      return ["IN_TRANSIT"];
    case "IN_TRANSIT":
      return ["DELIVERED", "DELAYED"];
    case "DELAYED":
      return ["IN_TRANSIT"];
    default:
      return [];
  }
}

export default function Page() {
  const apiBase =
    process.env.NEXT_PUBLIC_API_GATEWAY_URL ?? DEFAULT_API_GATEWAY_URL;
  const base = useMemo(() => `${apiBase}/api/shipping`, [apiBase]);

  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [statusNote, setStatusNote] = useState("");
  const [assignDriverId, setAssignDriverId] = useState<number | "">("");
  const [assignVehicleId, setAssignVehicleId] = useState<number | "">("");

  const [driverForm, setDriverForm] = useState({
    fullName: "",
    phone: "",
    licenseNo: "",
    licenseClass: "",
    isActive: true
  });

  const [vehicleForm, setVehicleForm] = useState({
    licensePlate: "",
    type: "TRUCK",
    capacity: 0,
    isActive: true
  });

  const [shipmentForm, setShipmentForm] = useState({
    orderId: 1,
    farmId: 1,
    retailerId: 1,
    pickupAddress: "Kho Farm A",
    deliveryAddress: "Sieu thi B",
    scheduledDate: ""
  });

  const reload = useCallback(async () => {
    setErr(null);
    try {
      const [s, d, v] = await Promise.all([
        j<ApiResponse<Shipment[]>>(`${base}/shipments`),
        j<ApiResponse<Driver[]>>(`${base}/drivers`),
        j<ApiResponse<Vehicle[]>>(`${base}/vehicles`)
      ]);
      setShipments(s.data ?? []);
      setDrivers(d.data ?? []);
      setVehicles(v.data ?? []);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    }
  }, [base]);

  const loadHistory = useCallback(
    async (shipmentId: number) => {
      setErr(null);
      try {
        const h = await j<ApiResponse<HistoryRow[]>>(
          `${base}/shipments/${shipmentId}/history`
        );
        setHistory(h.data ?? []);
      } catch (e) {
        setErr(e instanceof Error ? e.message : String(e));
      }
    },
    [base]
  );

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    if (selectedId != null) void loadHistory(selectedId);
    else setHistory([]);
  }, [selectedId, loadHistory]);

  const selected = shipments.find((s) => s.id === selectedId) ?? null;

  const createDriver = async () => {
    setErr(null);
    try {
      await j(`${base}/drivers`, {
        method: "POST",
        body: JSON.stringify(driverForm)
      });
      setDriverForm({
        fullName: "",
        phone: "",
        licenseNo: "",
        licenseClass: "",
        isActive: true
      });
      await reload();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    }
  };

  const createVehicle = async () => {
    setErr(null);
    try {
      await j(`${base}/vehicles`, {
        method: "POST",
        body: JSON.stringify(vehicleForm)
      });
      setVehicleForm({ licensePlate: "", type: "TRUCK", capacity: 0, isActive: true });
      await reload();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    }
  };

  const createShipment = async () => {
    setErr(null);
    try {
      await j(`${base}/shipments`, {
        method: "POST",
        body: JSON.stringify({
          ...shipmentForm,
          scheduledDate: shipmentForm.scheduledDate || null
        })
      });
      await reload();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    }
  };

  const doAssign = async () => {
    if (selectedId == null || assignDriverId === "" || assignVehicleId === "") {
      setErr("Chọn shipment, tài xế và xe.");
      return;
    }
    setErr(null);
    try {
      await j(`${base}/shipments/${selectedId}/assign`, {
        method: "POST",
        body: JSON.stringify({
          driverId: assignDriverId,
          vehicleId: assignVehicleId
        })
      });
      await reload();
      if (selectedId != null) await loadHistory(selectedId);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    }
  };

  const doStatus = async (status: string) => {
    if (selectedId == null) return;
    setErr(null);
    try {
      await j(`${base}/shipments/${selectedId}/status`, {
        method: "PATCH",
        body: JSON.stringify({
          status,
          note: statusNote || undefined
        })
      });
      setStatusNote("");
      await reload();
      await loadHistory(selectedId);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <div className="appShell">
      <div className="topbar">
        <div className="topbarInner">
          <div className="brand">
            <span style={{ width: 10, height: 10, borderRadius: 999, background: "#22c55e" }} />
            <span>BICAP System</span>
            <span className="pill">Shipping Admin</span>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <span className="pill">Gateway: {apiBase}</span>
            <button type="button" className="ghost" onClick={() => void reload()}>
              Reload
            </button>
          </div>
        </div>
      </div>

      <main className="container">
        <div className="layout">
          <div className="stack">
            <div className="card">
              <div className="toolbar">
                <div>
                  <div className="cardTitle">Tổng quan</div>
                  <div className="subtle">
                    Route <code>/api/shipping/**</code> đang whitelist để demo (không cần JWT).
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <span className="pill">Drivers: {drivers.length}</span>
                  <span className="pill">Vehicles: {vehicles.length}</span>
                  <span className="pill">Shipments: {shipments.length}</span>
                </div>
              </div>
              {err ? <div className="alert">{err}</div> : null}
            </div>

            <div className="card">
              <div className="cardTitle">Tạo tài xế</div>
          <label>Họ tên</label>
          <input
            value={driverForm.fullName}
            onChange={(e) => setDriverForm((s) => ({ ...s, fullName: e.target.value }))}
          />
          <label>Điện thoại</label>
          <input
            value={driverForm.phone}
            onChange={(e) => setDriverForm((s) => ({ ...s, phone: e.target.value }))}
          />
          <label>Số GPLX</label>
          <input
            value={driverForm.licenseNo}
            onChange={(e) => setDriverForm((s) => ({ ...s, licenseNo: e.target.value }))}
          />
          <label>Hạng</label>
          <input
            value={driverForm.licenseClass}
            onChange={(e) => setDriverForm((s) => ({ ...s, licenseClass: e.target.value }))}
          />
          <button type="button" onClick={() => void createDriver()}>
            Lưu tài xế
          </button>
            </div>

            <div className="card">
              <div className="cardTitle">Tạo xe</div>
          <label>Biển số</label>
          <input
            value={vehicleForm.licensePlate}
            onChange={(e) => setVehicleForm((s) => ({ ...s, licensePlate: e.target.value }))}
          />
          <label>Loại</label>
          <select
            value={vehicleForm.type}
            onChange={(e) => setVehicleForm((s) => ({ ...s, type: e.target.value }))}
          >
            <option value="TRUCK">TRUCK</option>
            <option value="VAN">VAN</option>
            <option value="MOTORBIKE">MOTORBIKE</option>
            <option value="REFRIGERATED_TRUCK">REFRIGERATED_TRUCK</option>
          </select>
          <label>Tải trọng (kg)</label>
          <input
            type="number"
            value={vehicleForm.capacity}
            onChange={(e) =>
              setVehicleForm((s) => ({ ...s, capacity: Number(e.target.value) }))
            }
          />
          <button type="button" onClick={() => void createVehicle()}>
            Lưu xe
          </button>
            </div>

            <div className="card">
              <div className="cardTitle">Tạo chuyến hàng</div>
              <div className="grid3">
          <div>
            <label>Order ID</label>
            <input
              type="number"
              value={shipmentForm.orderId}
              onChange={(e) =>
                setShipmentForm((s) => ({ ...s, orderId: Number(e.target.value) }))
              }
            />
            <label>Farm ID</label>
            <input
              type="number"
              value={shipmentForm.farmId}
              onChange={(e) =>
                setShipmentForm((s) => ({ ...s, farmId: Number(e.target.value) }))
              }
            />
            <label>Retailer ID</label>
            <input
              type="number"
              value={shipmentForm.retailerId}
              onChange={(e) =>
                setShipmentForm((s) => ({ ...s, retailerId: Number(e.target.value) }))
              }
            />
          </div>
          <div style={{ gridColumn: "span 2" }}>
            <label>Điểm lấy</label>
            <input
              value={shipmentForm.pickupAddress}
              onChange={(e) =>
                setShipmentForm((s) => ({ ...s, pickupAddress: e.target.value }))
              }
            />
            <label>Điểm giao</label>
            <input
              value={shipmentForm.deliveryAddress}
              onChange={(e) =>
                setShipmentForm((s) => ({ ...s, deliveryAddress: e.target.value }))
              }
            />
            <label>Ngày dự kiến (YYYY-MM-DD)</label>
            <input
              value={shipmentForm.scheduledDate}
              onChange={(e) =>
                setShipmentForm((s) => ({ ...s, scheduledDate: e.target.value }))
              }
            />
          </div>
        </div>
        <button type="button" onClick={() => void createShipment()}>
          Tạo chuyến
        </button>
            </div>
          </div>

          <div className="stack">
            <div className="card">
              <div className="toolbar">
                <div>
                  <div className="cardTitle">Danh sách chuyến</div>
                  <div className="subtle">Chọn một chuyến để thao tác bên dưới.</div>
                </div>
                {selected ? <StatusBadge status={selected.status} /> : <span className="pill">No selection</span>}
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Chọn</th>
                    <th>ID</th>
                    <th>Order</th>
                    <th>Trạng thái</th>
                    <th>Tài xế</th>
                    <th>Xe</th>
                    <th>Ngày</th>
                  </tr>
                </thead>
                <tbody>
                  {shipments.map((s) => (
                    <tr key={s.id}>
                      <td>
                        <input
                          type="radio"
                          name="pick"
                          checked={selectedId === s.id}
                          onChange={() => setSelectedId(s.id)}
                        />
                      </td>
                      <td>{s.id}</td>
                      <td>{s.orderId}</td>
                      <td>
                        <StatusBadge status={s.status} />
                      </td>
                      <td>{s.driverId ?? "-"}</td>
                      <td>{s.vehicleId ?? "-"}</td>
                      <td>{s.scheduledDate ?? "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {selected ? (
              <div className="card">
                <div className="toolbar">
                  <div>
                    <div className="cardTitle">Chi tiết chuyến #{selected.id}</div>
                    <div className="subtle">
                      {selected.pickupAddress} → {selected.deliveryAddress}
                    </div>
                  </div>
                  <StatusBadge status={selected.status} />
                </div>

          {selected.status === "CREATED" ? (
            <div style={{ marginTop: 8 }}>
              <div className="cardTitle">Phân công tài xế &amp; xe</div>
              <div className="row">
                <div>
                  <label>Tài xế</label>
                  <select
                    value={assignDriverId === "" ? "" : String(assignDriverId)}
                    onChange={(e) =>
                      setAssignDriverId(e.target.value ? Number(e.target.value) : "")
                    }
                  >
                    <option value="">—</option>
                    {drivers
                      .filter((d) => d.isActive !== false)
                      .map((d) => (
                        <option key={d.id} value={d.id}>
                          #{d.id} {d.fullName}
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label>Xe</label>
                  <select
                    value={assignVehicleId === "" ? "" : String(assignVehicleId)}
                    onChange={(e) =>
                      setAssignVehicleId(e.target.value ? Number(e.target.value) : "")
                    }
                  >
                    <option value="">—</option>
                    {vehicles
                      .filter((v) => v.isActive !== false)
                      .map((v) => (
                        <option key={v.id} value={v.id}>
                          #{v.id} {v.licensePlate}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
              <button type="button" onClick={() => void doAssign()}>
                Phân công (ASSIGNED)
              </button>
            </div>
          ) : null}

          <div style={{ marginTop: 16 }}>
            <div className="cardTitle">Đổi trạng thái</div>
            <label>Ghi chú (tuỳ chọn)</label>
            <input
              value={statusNote}
              onChange={(e) => setStatusNote(e.target.value)}
              placeholder="VD: kẹt xe, delay 30p"
            />
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
              {nextActions(selected.status).map((st) => (
                <button
                  key={st}
                  type="button"
                  className="secondary"
                  onClick={() => void doStatus(st)}
                >
                  {st}
                </button>
              ))}
              {nextActions(selected.status).length === 0 ? (
                <span style={{ opacity: 0.7 }}>Không còn bước tiếp theo.</span>
              ) : null}
            </div>
          </div>

          <div style={{ marginTop: 16 }}>
            <div className="cardTitle">Lịch sử</div>
            <table>
              <thead>
                <tr>
                  <th>Thời gian</th>
                  <th>Trạng thái</th>
                  <th>Bởi</th>
                  <th>Ghi chú</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h) => (
                  <tr key={h.id}>
                    <td>{h.changedAt}</td>
                    <td>{h.status}</td>
                    <td>{h.changedBy ?? "-"}</td>
                    <td>{h.note ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
              </div>
            ) : (
              <div className="card">
                <div className="cardTitle">Chưa chọn chuyến</div>
                <div className="subtle">Chọn 1 dòng trong bảng để xem chi tiết, phân công và đổi trạng thái.</div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
