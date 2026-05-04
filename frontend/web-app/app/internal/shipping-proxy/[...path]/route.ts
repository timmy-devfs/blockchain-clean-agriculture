import { NextRequest, NextResponse } from "next/server";

function shippingGatewayBase(): string {
  const raw = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost/api").replace(/\/+$/, "");
  return raw.endsWith("/api") ? raw : `${raw}/api`;
}

async function forwardToShipping(
  req: NextRequest,
  path: string[],
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
) {
  if (path.length === 0) {
    return NextResponse.json({ message: "Missing shipping path" }, { status: 400 });
  }

  const target = `${shippingGatewayBase()}/shipping/${path.join("/")}`;
  const auth = req.headers.get("authorization") ?? "";
  const contentType = req.headers.get("content-type") ?? "application/json";

  const bodyText =
    method === "GET" || method === "DELETE" ? undefined : await req.text().catch(() => "");

  const upstream = await fetch(target, {
    method,
    headers: {
      ...(auth ? { Authorization: auth } : {}),
      ...(contentType ? { "Content-Type": contentType } : {}),
    },
    body: bodyText,
    cache: "no-store",
  });

  const text = await upstream.text();
  return new NextResponse(text, {
    status: upstream.status,
    headers: { "Content-Type": upstream.headers.get("content-type") ?? "application/json" },
  });
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  return forwardToShipping(req, path, "POST");
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  return forwardToShipping(req, path, "PATCH");
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  return forwardToShipping(req, path, "PUT");
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  return forwardToShipping(req, path, "DELETE");
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  return forwardToShipping(req, path, "GET");
}

