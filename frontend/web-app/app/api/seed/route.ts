import axios, { isAxiosError } from "axios";
import { NextResponse } from "next/server";

/** Match packages/api-client: env often ends with `/api`; requests use `/api/...` paths. */
function gatewayOrigin(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost/api";
  const normalized = raw.replace(/\/+$/, "");
  return normalized.endsWith("/api") ? normalized.slice(0, -4) : normalized;
}

function extractMessage(err: unknown): string {
  if (isAxiosError(err)) {
    const d = err.response?.data as { message?: string; error?: string };
    return d?.message ?? d?.error ?? err.message;
  }
  return err instanceof Error ? err.message : String(err);
}

async function apiCall(
  method: string,
  path: string,
  body?: object,
  token?: string,
  retries = 2
): Promise<{ ok: true; data: unknown } | { ok: false; error: string }> {
  const base = gatewayOrigin();
  const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;
  let lastErr = "Unknown error";

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await axios({
        method,
        url,
        data: body,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        validateStatus: () => true,
      });

      if (res.status >= 200 && res.status < 300) {
        const payload = res.data as { data?: unknown };
        const data = payload?.data !== undefined ? payload.data : res.data;
        return { ok: true, data };
      }

      const d = res.data as { message?: string; error?: string };
      lastErr = d?.message ?? d?.error ?? `HTTP ${res.status}`;
    } catch (err) {
      lastErr = extractMessage(err);
    }

    if (attempt < retries) {
      await new Promise((r) => setTimeout(r, 350 * (attempt + 1)));
    }
  }

  return { ok: false, error: lastErr };
}

export async function POST() {
  const log: string[] = [];

  const accounts = [
    { email: "admin@bicap.io", password: "123456", fullName: "BICAP Admin", role: "ADMIN" },
    { email: "farm1@bicap.io", password: "123456", fullName: "Nguyen Van A", role: "FARM_MANAGER" },
    { email: "retail1@bicap.io", password: "123456", fullName: "Retail Demo", role: "RETAILER" },
    { email: "shipper1@bicap.io", password: "123456", fullName: "Shipping Demo", role: "SHIPPER" },
  ];

  for (const acc of accounts) {
    const r = await apiCall("POST", "/api/auth/register", acc);
    log.push(r.ok ? `✓ Register ${acc.email}` : `⚠ ${acc.email}: ${r.error} (có thể đã tồn tại)`);
  }

  const adminLogin = await apiCall("POST", "/api/auth/login", {
    email: "admin@bicap.io",
    password: "123456",
  });
  const farmLogin = await apiCall("POST", "/api/auth/login", {
    email: "farm1@bicap.io",
    password: "123456",
  });
  const shipLogin = await apiCall("POST", "/api/auth/login", {
    email: "shipper1@bicap.io",
    password: "123456",
  });
  const retailLogin = await apiCall("POST", "/api/auth/login", {
    email: "retail1@bicap.io",
    password: "123456",
  });

  if (!adminLogin.ok || !farmLogin.ok) {
    return NextResponse.json({
      ok: false,
      log,
      error: "Login thất bại (admin hoặc farm)",
      message: "Kiểm tra identity-service và tài khoản demo.",
    });
  }

  type TokenPayload = {
    accessToken?: string;
    user?: { id?: string };
  };
  const adminData = adminLogin.data as TokenPayload;
  const farmData = farmLogin.data as TokenPayload;
  const shipData = shipLogin.ok ? (shipLogin.data as TokenPayload) : undefined;
  const retailData = retailLogin.ok ? (retailLogin.data as TokenPayload) : undefined;

  const ADMIN_TOKEN = adminData.accessToken;
  const FARM_TOKEN = farmData.accessToken;
  const SHIP_TOKEN = shipData?.accessToken;
  const SHIP_UUID = shipData?.user?.id;
  const RETAIL_TOKEN = retailData?.accessToken;
  const RETAIL_UUID = retailData?.user?.id;

  if (!ADMIN_TOKEN || !FARM_TOKEN) {
    return NextResponse.json({ ok: false, log, error: "Thiếu accessToken sau login" });
  }

  log.push("✓ Login tài khoản (admin, farm, shipper, retailer theo từng bước)");

  let FARM_ID = "";
  const farmRes = await apiCall(
    "POST",
    "/api/farm/farms",
    {
      name: "Trang trại Demo BICAP",
      address: "123 Đường Lúa Vàng, Xã Phong Điền",
      province: "Cần Thơ",
      area: 5.0,
    },
    FARM_TOKEN
  );

  if (farmRes.ok) {
    const fr = farmRes.data as { id?: string; _id?: string };
    FARM_ID = fr.id ?? fr._id ?? "";
    log.push(FARM_ID ? `✓ Tạo farm: ${FARM_ID}` : "⚠ Farm: phản hồi không có id");
  } else {
    log.push(`⚠ Farm: ${farmRes.error}`);
  }

  if (FARM_ID) {
    const approveRes = await apiCall("PUT", `/api/farm/admin/farms/${FARM_ID}/approve`, {}, ADMIN_TOKEN);
    log.push(approveRes.ok ? "✓ Admin duyệt farm" : `⚠ Approve farm: ${approveRes.error}`);
  }

  let SEASON_ID = "";
  if (FARM_ID) {
    const seasonRes = await apiCall(
      "POST",
      "/api/farm/seasons",
      {
        farmId: FARM_ID,
        cropType: "Lúa ST25",
        startDate: "2026-01-01",
        estimatedEndDate: "2026-06-30",
      },
      FARM_TOKEN
    );

    if (seasonRes.ok) {
      const sr = seasonRes.data as { id?: string; _id?: string };
      SEASON_ID = sr.id ?? sr._id ?? "";
      log.push(SEASON_ID ? `✓ Tạo season: ${SEASON_ID}` : "⚠ Season: phản hồi không có id");
    } else {
      log.push(`⚠ Season: ${seasonRes.error}`);
    }
  }

  if (SEASON_ID) {
    const appSeason = await apiCall("PUT", `/api/farm/admin/seasons/${SEASON_ID}/approve`, {}, ADMIN_TOKEN);
    log.push(
      appSeason.ok ? "✓ Admin duyệt season (blockchain pending...)" : `⚠ Approve season: ${appSeason.error}`
    );
  }

  let LISTING_ID = "";
  if (SEASON_ID && FARM_ID) {
    const listRes = await apiCall(
      "POST",
      "/api/farm/marketplace/listings",
      {
        farmId: FARM_ID,
        seasonId: SEASON_ID,
        title: "Lúa ST25 Cần Thơ — blockchain VeChain",
        description: "Lúa ST25 Cần Thơ — được kiểm định blockchain VeChain",
        quantity: 200,
        unitPrice: 45000,
      },
      FARM_TOKEN
    );

    if (listRes.ok) {
      const lr = listRes.data as { id?: string; _id?: string };
      LISTING_ID = lr.id ?? lr._id ?? "";
      log.push(LISTING_ID ? `✓ Tạo listing: ${LISTING_ID}` : "⚠ Listing: phản hồi không có id");
    } else {
      log.push(`⚠ Listing: ${listRes.error}`);
    }
  }

  let ORDER_ID = "";
  if (LISTING_ID && FARM_ID && RETAIL_TOKEN && RETAIL_UUID) {
    const orderRes = await apiCall(
      "POST",
      "/api/retail/orders",
      {
        retailerId: RETAIL_UUID,
        farmId: FARM_ID,
        listingId: LISTING_ID,
        productName: "Lúa ST25 Cần Thơ",
        quantity: 50,
        unit: "kg",
        totalAmount: 2250000,
        depositAmount: 500000,
        deliveryAddress: "456 Chợ Đầu Mối, Q.Ninh Kiều, Cần Thơ",
        note: "Đơn hàng demo — seed",
        gateway: "VNPAY",
      },
      RETAIL_TOKEN
    );

    if (orderRes.ok) {
      const or = orderRes.data as { order?: { id?: string }; id?: string };
      ORDER_ID = or.order?.id ?? or.id ?? "";
      log.push(ORDER_ID ? `✓ Tạo đơn retailer: ${ORDER_ID}` : "✓ Tạo đơn retailer (OK)");
    } else {
      log.push(`⚠ Retail order: ${orderRes.error}`);
    }
  } else if (!RETAIL_TOKEN || !RETAIL_UUID) {
    log.push("⚠ Retail order: bỏ qua (login retailer thất bại hoặc thiếu user id)");
  }

  if (SHIP_TOKEN && SHIP_UUID) {
    const driverRes = await apiCall(
      "POST",
      "/api/shipping/drivers",
      {
        fullName: "Nguyen Van Tài xế",
        phone: "0901234567",
        licenseNumber: "B2-123456",
        identityUserId: SHIP_UUID,
      },
      SHIP_TOKEN
    );
    log.push(
      driverRes.ok
        ? `✓ Tạo driver (identityUserId=${SHIP_UUID})`
        : `⚠ Driver: ${driverRes.error}`
    );

    const vehicleRes = await apiCall(
      "POST",
      "/api/shipping/vehicles",
      {
        licensePlate: "51A-12345",
        type: "VAN",
        capacity: 1000,
      },
      SHIP_TOKEN
    );
    log.push(vehicleRes.ok ? "✓ Tạo vehicle" : `⚠ Vehicle: ${vehicleRes.error}`);
  } else {
    log.push("⚠ Shipper: bỏ qua driver/vehicle (login shipper thất bại)");
  }

  return NextResponse.json({
    ok: true,
    log,
    ids: { FARM_ID, SEASON_ID, LISTING_ID, ORDER_ID },
    message: "Seed hoàn tất! Reload trang dashboard để thấy dữ liệu.",
  });
}
