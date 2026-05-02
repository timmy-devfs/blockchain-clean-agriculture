/**
 * Base URL for gateway public routes (browser & server).
 * NEXT_PUBLIC_API_URL is typically http://localhost/api → paths like /public/... are appended.
 */
export function getPublicApiBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost/api";
  return raw.replace(/\/+$/, "");
}
