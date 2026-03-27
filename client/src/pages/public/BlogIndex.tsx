import { trpc } from "@/lib/trpc";
import { useI18n } from "@/lib/i18n";
import WzrdPublicHeader from "@/components/WzrdPublicHeader";

export default function BlogIndexPage() {
  const { locale } = useI18n();
  const postsQuery = trpc.blog.getPosts.useQuery({ limit: 20, offset: 0 }, { retry: false });

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <WzrdPublicHeader credits={null} />
      <div className="wzrd-public-pt mx-auto max-w-5xl px-6 pb-20">
        <div className="mb-10 text-center">
          <p className="font-mono text-xs text-zinc-600 uppercase tracking-[0.2em] mb-3">
            // BLOG
          </p>
          <h1 className="text-4xl font-bold tracking-tight mb-2">
            {locale === "ar" ? "مقالات WZZRD AI" : "WZZRD AI Blog"}
          </h1>
          <p className="text-sm text-zinc-400">
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
                className="rounded-2xl border border-zinc-800/50 bg-zinc-900/30 backdrop-blur-sm p-6 animate-pulse"
              >
                <div className="h-5 w-2/3 rounded bg-zinc-800/60 mb-3" />
                <div className="h-4 w-full rounded bg-zinc-800/40 mb-2" />
                <div className="h-4 w-5/6 rounded bg-zinc-800/40" />
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
                className="group rounded-2xl border border-zinc-800/50 bg-zinc-900/30 backdrop-blur-sm p-6 transition hover:border-zinc-700/50"
              >
                <p className="font-mono text-[10px] text-zinc-500 tracking-widest uppercase mb-2">
                  {p.publishedAt ? new Date(p.publishedAt).toLocaleDateString("ar-EG") : "—"}
                </p>
                <h2 className="text-lg font-bold text-zinc-100 group-hover:text-white transition">
                  {p.title}
                </h2>
                {p.excerpt ? (
                  <p className="mt-2 text-sm text-zinc-400 leading-relaxed line-clamp-3">
                    {p.excerpt}
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

