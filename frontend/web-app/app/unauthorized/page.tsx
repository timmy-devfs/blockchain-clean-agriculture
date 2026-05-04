import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50 px-4 text-center">
      <div className="text-6xl">🚫</div>
      <h1 className="text-2xl font-bold text-gray-900">Khong co quyen truy cap</h1>
      <Link
        href="/login"
        className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
      >
        Ve trang dang nhap
      </Link>
    </div>
  );
}
