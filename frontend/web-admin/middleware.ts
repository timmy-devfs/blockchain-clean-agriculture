//Lưu ý: Middleware đọc token từ cookie bicap_access_token. Bạn cần lưu token vào cookie khi login (bên cạnh localStorage) để middleware Edge Runtime đọc được. Sẽ xử lý ở bước login page.
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/unauthorized"];

function decodeJWTPayload(token: string): { role?: string; exp?: number } | null {
  try {
    const base64 = token.split(".")[1];
    // atob không có trong Edge Runtime → dùng Buffer
    const decoded = Buffer.from(base64, "base64").toString("utf-8");
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Bỏ qua các route public
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const token = request.cookies.get("bicap_access_token")?.value
    ?? request.headers.get("authorization")?.replace("Bearer ", "");

  // Chưa có token → về login
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const payload = decodeJWTPayload(token);

  // Token hết hạn
  if (!payload || (payload.exp && Date.now() / 1000 >= payload.exp)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Không phải ADMIN → về unauthorized
  if (payload.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};