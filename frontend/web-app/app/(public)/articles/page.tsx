import Link from "next/link";

export default function PublicArticlesPage() {
  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900">Tin tuc BICAP</h1>
      <p className="mt-2 text-sm text-gray-600">
        Danh sach bai viet dang duoc cap nhat trong sprint tiep theo.
      </p>

      <div className="mt-6 rounded-xl border border-dashed border-gray-300 bg-white p-5">
        <p className="text-sm text-gray-700">
          Ban co the mo trang chi tiet mau tai:
        </p>
        <Link
          href="/articles/demo"
          className="mt-3 inline-block text-sm font-medium text-green-700 hover:underline"
        >
          /articles/demo
        </Link>
      </div>
    </section>
  );
}

