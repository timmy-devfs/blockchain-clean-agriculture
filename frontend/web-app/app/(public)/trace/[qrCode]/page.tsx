type TracePageProps = {
  params: {
    qrCode: string;
  };
};

export default function PublicTracePage({ params }: TracePageProps) {
  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900">Truy xuat QR</h1>
      <p className="mt-2 text-sm text-gray-600">
        Ma QR <span className="font-semibold text-green-700">{params.qrCode}</span>{" "}
        dang duoc xu ly boi he thong truy xuat.
      </p>
    </section>
  );
}

