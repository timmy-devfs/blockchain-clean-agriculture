// app/trace/page.tsx — Redirect từ search form trên landing page
// Xử lý GET /trace?id=LH0001-F32L → redirect sang /trace/LH0001-F32L

import { redirect } from 'next/navigation';

export default function TraceRedirectPage({ searchParams }: { searchParams: { id?: string } }) {
  const id = searchParams.id?.trim();
  if (id) {
    redirect(`/trace/${encodeURIComponent(id)}`);
  }
  redirect('/');
}