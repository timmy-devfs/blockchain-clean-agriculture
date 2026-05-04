type SearchPageProps = {
  searchParams?: {
    q?: string;
  };
};

export default function PublicSearchPage({ searchParams }: SearchPageProps) {
  const keyword = searchParams?.q?.trim() ?? "";

  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900">Tim kiem san pham</h1>
      <p className="mt-2 text-sm text-gray-600">
        Khu vuc search dang duoc hoan thien de tich hop truy xuat chuoi nong
        nghiep sach.
      </p>

      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-4">
        <p className="text-sm text-gray-700">
          Tu khoa hien tai:{" "}
          <span className="font-semibold text-green-700">
            {keyword || "(chua nhap)"}
          </span>
        </p>
      </div>
    </section>
  );
}

