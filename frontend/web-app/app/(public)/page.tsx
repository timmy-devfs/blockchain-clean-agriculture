import Link from "next/link";

export default function PublicLandingPage() {
  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-5xl flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-3xl font-bold text-gray-900">BICAP Platform</h1>
      <p className="max-w-2xl text-sm text-gray-500">
        Landing page tam thoi cho nguoi dung cong khai. Chuc nang tim kiem va truy xuat se duoc hoan thien o phase tiep theo.
      </p>
      <div className="mt-2 flex gap-3">
        <Link
          href="/search"
          className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
        >
          Bat dau tim kiem
        </Link>
        <Link
          href="/login"
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          Dang nhap
        </Link>
      </div>
    </div>
  );
}
