export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50">
      <div className="text-6xl">🚫</div>
      <h1 className="text-2xl font-bold text-gray-900">Không có quyền truy cập</h1>
      <p className="text-gray-500">Tài khoản của bạn không có quyền Admin.</p>
      <a href="/login" className="rounded-lg bg-green-500 px-4 py-2 text-sm font-medium text-white hover:bg-green-600">
        Về trang đăng nhập
      </a>
    </div>
  );
}