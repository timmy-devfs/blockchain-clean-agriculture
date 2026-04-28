// app/trace/page.tsx — Redirect từ search form trên landing page
// GET /trace?id=LH0001-F32L → /trace/LH0001-F32L
// Next 15: searchParams có thể là Promise; Next 14: object — dùng Promise.resolve để tương thích.

import { redirect } from 'next/navigation';

export default async function TraceRedirectPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }> | { id?: string };
}) {
  const sp = await Promise.resolve(searchParams);
  const id = sp.id?.trim();
  if (id) {
    redirect(`/trace/${encodeURIComponent(id)}`);
  }
  redirect('/');
}