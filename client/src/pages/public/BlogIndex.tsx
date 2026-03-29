import { trpc } from "@/lib/trpc";
import { useI18n } from "@/lib/i18n";
import WzrdPublicHeader from "@/components/WzrdPublicHeader";

export default function BlogIndexPage() {
  const { locale } = useI18n();
  const postsQuery = trpc.blog.getPosts.useQuery({ limit: 20, offset: 0 }, { retry: false });

  return (
    <div className="wzrd-public-page min-h-screen">
      <WzrdPublicHeader credits={null} />
      <div className="wzrd-public-pt mx-auto max-w-5xl px-6 pb-20">
        <div className="mb-10 text-center">
          <p className="font-mono text-xs text-zinc-600 uppercase tracking-[0.2em] mb-3">
            // BLOG
          </p>
          <h1 className="text-4xl font-bold tracking-tight mb-2">
            {locale === "ar" ? "مقالات WZZRD AI" : "WZZRD AI Blog"}
          </h1>
          <p className="text-sm text-[#6B7280]">
            {locale === "ar"
              ? "محتوى عملي لتحسين البراند — خطوة بخطوة."
              : "Actionable brand engineering content — step by step."}
          </p>
        </div>

        {postsQuery.isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="wzrd-public-card p-6 animate-pulse"
              >
                <div className="h-5 w-2/3 rounded bg-[#F3F4F6]/60 mb-3" />
                <div className="h-4 w-full rounded bg-[#F3F4F6]/40 mb-2" />
                <div className="h-4 w-5/6 rounded bg-[#F3F4F6]/40" />
              </div>
            ))}
          </div>
        ) : postsQuery.error ? (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 text-sm text-red-300">
            {locale === "ar" ? "حدث خطأ أثناء تحميل المقالات." : "Failed to load posts."}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(postsQuery.data ?? []).map((p) => (
              <a
                key={p.id}
                href={`/blog/${p.slug}`}
                className="wzrd-public-card group p-6 transition hover:border-[#1B4FD8]/30"
              >
                <p className="font-mono text-[10px] text-[#9CA3AF] tracking-widest uppercase mb-2">
                  {p.publishedAt ? new Date(p.publishedAt).toLocaleDateString("ar-EG") : "—"}
                </p>
                <h2 className="text-lg font-bold text-[#111827] group-hover:text-[#1B4FD8] transition">
                  {locale === "ar" ? p.titleAr : p.titleEn}
                </h2>
                {((locale === "ar" ? p.excerptAr : p.excerptEn) || null) ? (
                  <p className="mt-2 text-sm text-[#6B7280] leading-relaxed line-clamp-3">
                    {locale === "ar" ? p.excerptAr : p.excerptEn}
                  </p>
                ) : null}
                <p className="mt-4 text-sm text-cyan-300/80 group-hover:text-cyan-200 transition">
                  {locale === "ar" ? "اقرأ المقال ←" : "Read post →"}
                </p>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

