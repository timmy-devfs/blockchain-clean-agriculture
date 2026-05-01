"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ARTICLES_INDEX } from "@/public-site/data/articles-content";
import { PUBLIC_PRODUCT_IMAGE_OVERRIDES } from "@/public-site/data/public-product-images";

type ProductCardData = {
  id: string;
  name: string;
  farmName: string;
  province: string;
  imageUrl?: string;
  certification?: string;
};

type Announcement = {
  id: string;
  title: string;
  message?: string;
};

type ArticlePreview = {
  id: string;
  title: string;
  category: string;
  date: string;
  thumbnail?: string;
};

const FALLBACK_PRODUCTS: ProductCardData[] = [
  { id: "SP001", name: "Gạo ST25 Sóc Trăng", farmName: "Farm Mekong Delta", province: "Sóc Trăng", certification: "VietGAP", imageUrl: PUBLIC_PRODUCT_IMAGE_OVERRIDES.SP001 },
  { id: "SP002", name: "Cà phê Arabica Đà Lạt", farmName: "Highland Coffee Farm", province: "Lâm Đồng", certification: "OCOP", imageUrl: PUBLIC_PRODUCT_IMAGE_OVERRIDES.SP002 },
  { id: "SP004", name: "Thanh long ruột đỏ", farmName: "Dragon Fruit Farm", province: "Bình Thuận", certification: "GlobalGAP", imageUrl: PUBLIC_PRODUCT_IMAGE_OVERRIDES.SP004 },
];

const FALLBACK_ARTICLES: ArticlePreview[] = ARTICLES_INDEX.slice(0, 3).map((a) => ({
  id: a.id,
  title: a.title,
  category: a.category,
  date: a.date,
}));

function normalizePublicData<T>(payload: unknown): T | null {
  if (payload != null && typeof payload === "object" && "data" in payload) {
    return (payload as { data: T }).data;
  }
  return payload as T;
}

function mapFeaturedProducts(payload: unknown): ProductCardData[] {
  const data = normalizePublicData<unknown>(payload);
  const rows = Array.isArray(data)
    ? data
    : Array.isArray((data as { content?: unknown[] } | null)?.content)
      ? (data as { content: unknown[] }).content
      : [];
  return rows
    .map((row) => {
      const r = row as Record<string, unknown>;
      const id = String(r.id ?? r.code ?? "");
      return {
        id,
        name: String(r.name ?? r.productName ?? "Nông sản"),
        farmName: String(r.farmName ?? r.farm ?? "Nông trại BICAP"),
        province: String(r.province ?? r.origin ?? "Việt Nam"),
        imageUrl:
          (typeof r.imageUrl === "string" && r.imageUrl.trim()) ||
          PUBLIC_PRODUCT_IMAGE_OVERRIDES[id.toUpperCase()],
        certification: String(r.certification ?? r.badge ?? "Blockchain xác thực"),
      } as ProductCardData;
    })
    .filter((x) => x.id && x.name);
}

function mapAnnouncements(payload: unknown): Announcement[] {
  const data = normalizePublicData<unknown>(payload);
  const rows = Array.isArray(data)
    ? data
    : Array.isArray((data as { content?: unknown[] } | null)?.content)
      ? (data as { content: unknown[] }).content
      : [];
  return rows
    .map((row, i) => {
      const r = row as Record<string, unknown>;
      return {
        id: String(r.id ?? `ann-${i}`),
        title: String(r.title ?? "Thông báo"),
        message: String(r.message ?? r.content ?? ""),
      };
    })
    .filter((x) => x.title);
}

function mapArticles(payload: unknown): ArticlePreview[] {
  const data = normalizePublicData<unknown>(payload);
  const rows = Array.isArray(data)
    ? data
    : Array.isArray((data as { content?: unknown[] } | null)?.content)
      ? (data as { content: unknown[] }).content
      : [];
  return rows
    .map((row) => {
      const r = row as Record<string, unknown>;
      return {
        id: String(r.id ?? ""),
        title: String(r.title ?? "Bài viết"),
        category: String(r.category ?? "Tin tức"),
        date: String(r.date ?? r.publishedAt ?? ""),
        thumbnail: typeof r.thumbnail === "string" ? r.thumbnail : undefined,
      };
    })
    .filter((x) => x.id && x.title)
    .slice(0, 3);
}

function ProductCard({ name, farmName, province, imageUrl, certification }: ProductCardData) {
  return (
    <article className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="h-44 bg-linear-to-br from-green-100 to-emerald-50">
        {imageUrl ? (
          <img src={imageUrl} alt={name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-4xl">🌿</div>
        )}
      </div>
      <span className="absolute right-3 top-3 rounded-full bg-emerald-600 px-2 py-1 text-xs font-semibold text-white">
        {certification ?? "Blockchain"}
      </span>
      <div className="space-y-1 p-4">
        <h3 className="line-clamp-2 text-base font-semibold text-gray-900">{name}</h3>
        <p className="text-sm text-gray-600">{farmName}</p>
        <p className="text-xs text-gray-500">{province}</p>
      </div>
    </article>
  );
}

export default function PublicLandingPage() {
  const [featuredProducts, setFeaturedProducts] = useState<ProductCardData[]>(FALLBACK_PRODUCTS);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [articles, setArticles] = useState<ArticlePreview[]>(FALLBACK_ARTICLES);
  const [announcementIndex, setAnnouncementIndex] = useState(0);

  useEffect(() => {
    let mounted = true;

    async function loadPublicSections() {
      try {
        const res = await fetch("/api/public/products/featured", { cache: "no-store" });
        if (res.ok) {
          const body = (await res.json()) as unknown;
          const rows = mapFeaturedProducts(body);
          if (mounted && rows.length > 0) setFeaturedProducts(rows.slice(0, 6));
        }
      } catch {
        // fallback data is already set
      }

      try {
        const res = await fetch("/api/public/announcements", { cache: "no-store" });
        if (res.ok) {
          const body = (await res.json()) as unknown;
          if (mounted) setAnnouncements(mapAnnouncements(body));
        }
      } catch {
        if (mounted) setAnnouncements([]);
      }

      try {
        const res = await fetch("/api/public/articles?page=0&size=3", { cache: "no-store" });
        if (res.ok) {
          const body = (await res.json()) as unknown;
          const rows = mapArticles(body);
          if (mounted && rows.length > 0) setArticles(rows);
        }
      } catch {
        // keep fallback
      }
    }

    void loadPublicSections();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (announcements.length <= 1) return;
    const id = window.setInterval(() => {
      setAnnouncementIndex((cur) => (cur + 1) % announcements.length);
    }, 5000);
    return () => window.clearInterval(id);
  }, [announcements.length]);

  const activeAnnouncement = useMemo(
    () => (announcements.length > 0 ? announcements[announcementIndex] : null),
    [announcements, announcementIndex],
  );

  return (
    <main className="bg-gray-50">
      <section className="relative overflow-hidden bg-linear-to-br from-green-900 to-green-700 px-6 py-20 text-white">
        <div className="pointer-events-none absolute -right-20 -top-16 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-14 -left-16 h-52 w-52 rounded-full bg-emerald-300/20 blur-2xl" />

        <div className="mx-auto max-w-5xl text-center">
          <h1 className="text-4xl font-bold leading-tight md:text-5xl">
            Nông sản sạch — Minh bạch từ gốc
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-green-100 md:text-lg">
            Quét QR để truy xuất nguồn gốc blockchain ngay trên điện thoại
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/search"
              className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-green-800 transition hover:bg-green-50"
            >
              Tìm kiếm nông sản
            </Link>
            <Link
              href="/trace"
              className="rounded-xl border border-white/40 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
            >
              Quét mã QR
            </Link>
          </div>
        </div>
      </section>

      {activeAnnouncement && (
        <section className="border-b border-emerald-200 bg-emerald-50 px-6 py-4">
          <div className="mx-auto max-w-5xl transition-all duration-500">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Thông báo</p>
            <p className="mt-1 text-sm font-semibold text-emerald-900">{activeAnnouncement.title}</p>
            {activeAnnouncement.message ? (
              <p className="mt-0.5 text-sm text-emerald-800">{activeAnnouncement.message}</p>
            ) : null}
          </div>
        </section>
      )}

      <section className="px-6 py-14">
        <div className="mx-auto max-w-5xl">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Nổi bật</p>
              <h2 className="mt-1 text-2xl font-bold text-gray-900">Sản phẩm tiêu biểu</h2>
            </div>
            <Link href="/products" className="text-sm font-semibold text-emerald-700 hover:text-emerald-800">
              Xem tất cả →
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {featuredProducts.slice(0, 6).map((product) => (
              <ProductCard key={product.id} {...product} />
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-6 py-14">
        <div className="mx-auto max-w-5xl">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Bài viết</p>
              <h2 className="mt-1 text-2xl font-bold text-gray-900">Góc chia sẻ mới nhất</h2>
            </div>
            <Link href="/articles" className="text-sm font-semibold text-emerald-700 hover:text-emerald-800">
              Xem tất cả bài viết →
            </Link>
          </div>

          <div className="space-y-3">
            {articles.slice(0, 3).map((article) => (
              <Link
                key={article.id}
                href={`/articles/${article.id}`}
                className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4 transition hover:border-emerald-300 md:flex-row md:items-center"
              >
                <div className="h-20 w-full shrink-0 rounded-lg bg-linear-to-br from-green-200 to-emerald-100 md:w-28">
                  {article.thumbnail ? (
                    <img src={article.thumbnail} alt={article.title} className="h-full w-full rounded-lg object-cover" />
                  ) : null}
                </div>
                <div className="min-w-0">
                  <span className="inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                    {article.category}
                  </span>
                  <h3 className="mt-2 line-clamp-2 text-base font-semibold text-gray-900">{article.title}</h3>
                  <p className="mt-1 text-xs text-gray-500">{article.date}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-gray-200 bg-gray-950 px-6 py-8 text-center text-gray-300">
        <p className="text-sm">
          BICAP © 2025 — Blockchain Integration in Clean Agricultural Production
        </p>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-4 text-sm">
          <Link href="/search" className="hover:text-white">Tìm kiếm</Link>
          <Link href="/articles" className="hover:text-white">Bài viết</Link>
          <Link href="/trace" className="hover:text-white">Truy xuất QR</Link>
          <Link href="/login" className="hover:text-white">Đăng nhập</Link>
        </div>
      </footer>
    </main>
  );
}
