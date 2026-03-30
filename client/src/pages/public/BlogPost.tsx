import { trpc } from "@/lib/trpc";
import { useI18n } from "@/lib/i18n";
import WzrdPublicHeader from "@/components/WzrdPublicHeader";
import ReactMarkdown from "react-markdown";
import { useRoute } from "wouter";

export default function BlogPostPage() {
  const { locale } = useI18n();
  const [match, params] = useRoute<{ slug: string }>("/blog/:slug");
  const slug = match ? params.slug : "";

  const postQuery = trpc.blog.getPostBySlug.useQuery(
    { slug },
    { enabled: Boolean(slug), retry: false }
  );

  const post = postQuery.data;
  const title = post ? (locale === "ar" ? post.titleAr : post.titleEn) : "";
  const content = post ? (locale === "ar" ? post.contentAr : post.contentEn) : "";

  return (
    <div className="wzrd-public-page min-h-screen">
      <WzrdPublicHeader credits={null} />
      <div className="wzrd-public-pt mx-auto max-w-3xl px-6 pb-20">
        <a
          href="/blog"
          className="inline-flex items-center gap-2 text-sm text-[#6B7280] hover:text-[#111827] transition mb-8"
        >
          ← {locale === "ar" ? "رجوع للمقالات" : "Back to blog"}
        </a>

        {postQuery.isLoading ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-8 w-3/4 rounded bg-[#F3F4F6]/60" />
            <div className="h-4 w-1/3 rounded bg-[#F3F4F6]/40" />
            <div className="h-4 w-full rounded bg-[#F3F4F6]/40" />
            <div className="h-4 w-11/12 rounded bg-[#F3F4F6]/40" />
            <div className="h-4 w-10/12 rounded bg-[#F3F4F6]/40" />
          </div>
        ) : postQuery.error ? (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 text-sm text-red-300">
            {locale === "ar" ? "المقال غير موجود أو غير منشور." : "Post not found or not published."}
          </div>
        ) : !post ? (
          <div className="wzrd-public-card p-6 text-sm" style={{color: '#6B7280'}}>
            {locale === "ar" ? "لا يوجد محتوى." : "No content."}
          </div>
        ) : (
          <article className="space-y-6">
            <header className="space-y-3">
              <p className="font-mono text-xs text-zinc-600 uppercase tracking-[0.2em]">
                // BLOG POST
              </p>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
                {title}
              </h1>
              <p className="text-sm text-[#6B7280]">
                {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : ""}
              </p>
            </header>

            <div className="wzrd-public-card p-6">
              <article className="prose prose-sm max-w-none text-[#374151] prose-headings:text-[#111827] prose-a:text-[#1B4FD8]">
                <ReactMarkdown>{content}</ReactMarkdown>
              </article>
            </div>
          </article>
        )}
      </div>
    </div>
  );
}

