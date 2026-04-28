type ArticleDetailPageProps = {
  params: {
    id: string;
  };
};

export default function ArticleDetailPage({ params }: ArticleDetailPageProps) {
  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900">Chi tiet bai viet</h1>
      <p className="mt-2 text-sm text-gray-600">
        Bai viet voi ma{" "}
        <span className="font-semibold text-green-700">{params.id}</span> dang
        duoc bo sung noi dung.
      </p>
    </section>
  );
}

