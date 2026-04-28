import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/unauthorized", "/search", "/articles", "/trace"];

type JwtPayload = {
  sub?: string;
  role?: string;
  email?: string;
  exp?: number;
};

const roleRouteGuard: Array<{ prefix: string; allowedRoles: string[] | null }> = [
  { prefix: "/admin", allowedRoles: ["ADMIN"] },
  { prefix: "/dashboard", allowedRoles: ["ADMIN"] },
  { prefix: "/accounts", allowedRoles: ["ADMIN"] },
  { prefix: "/farms", allowedRoles: ["ADMIN"] },
  { prefix: "/seasons", allowedRoles: ["ADMIN"] },
  { prefix: "/orders", allowedRoles: ["ADMIN"] },
  { prefix: "/shipments", allowedRoles: ["ADMIN"] },
  { prefix: "/contracts", allowedRoles: ["ADMIN"] },
  { prefix: "/reports", allowedRoles: ["ADMIN"] },
  { prefix: "/farm", allowedRoles: ["FARM_MANAGER"] },
  { prefix: "/retailer", allowedRoles: ["RETAILER"] },
  { prefix: "/shipping", allowedRoles: ["SHIPPING_MANAGER", "SHIP_DRIVER"] },
  { prefix: "/public", allowedRoles: null },
];

const roleHomePath: Record<string, string> = {
  ADMIN: "/admin/dashboard",
  FARM_MANAGER: "/farm/dashboard",
  RETAILER: "/retailer/dashboard",
  SHIPPING_MANAGER: "/shipping/dashboard",
  SHIP_DRIVER: "/shipping/dashboard",
  GUEST: "/search",
};

function decodeJWTPayload(token: string): JwtPayload | null {
  try {
    const base64Payload = token.split(".")[1];
    if (!base64Payload) return null;
    const normalized = base64Payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
    const decoded = atob(padded);
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const token = request.cookies.get("bicap_access_token")?.value
    ?? request.headers.get("authorization")?.replace("Bearer ", "");

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const payload = decodeJWTPayload(token);

  if (!payload || (payload.exp && Date.now() / 1000 >= payload.exp)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const target = roleRouteGuard.find((item) => pathname.startsWith(item.prefix));
  if (!target) {
    const homePath = payload.role ? roleHomePath[payload.role] : "/search";
    return NextResponse.redirect(new URL(homePath ?? "/search", request.url));
  }

  if (target.allowedRoles && (!payload.role || !target.allowedRoles.includes(payload.role))) {
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};