import Link from 'next/link';
import Image from 'next/image';
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getPostBySlug } from '@/actions/posts';
import type { PostDetailVM } from '@/src/lib/serializers';

const TAG_COLORS: Record<string, string> = {
  'ایمنی':        'bg-red-100 text-red-700',
  'ترمز':         'bg-orange-100 text-orange-700',
  'موتور':        'bg-slate-100 text-slate-700',
  'نگهداری':      'bg-green-100 text-green-700',
  'آموزش':        'bg-blue-100 text-blue-700',
  'DIY':          'bg-blue-100 text-blue-700',
  'مقایسه':       'bg-purple-100 text-purple-700',
  'برق':          'bg-amber-100 text-amber-700',
  'باطری':        'bg-amber-100 text-amber-700',
  'خنک‌کننده':   'bg-cyan-100 text-cyan-700',
  'فیلتر':        'bg-gray-100 text-gray-700',
  'روغن':         'bg-yellow-100 text-yellow-700',
  'تعلیق':        'bg-indigo-100 text-indigo-700',
  'لاستیک':       'bg-stone-100 text-stone-700',
  'عیب‌یابی':    'bg-rose-100 text-rose-700',
  'فصلی':         'bg-teal-100 text-teal-700',
  'زمستان':       'bg-sky-100 text-sky-700',
  'توصیه':        'bg-lime-100 text-lime-700',
  'راهنمای خرید': 'bg-violet-100 text-violet-700',
  'آگاهی‌رسانی': 'bg-pink-100 text-pink-700',
  'کیفیت':        'bg-emerald-100 text-emerald-700',
  'خرید':         'bg-violet-100 text-violet-700',
  'پژو':          'bg-blue-100 text-blue-700',
  'شمع':          'bg-orange-100 text-orange-700',
};

function tagClass(t: string) {
  return TAG_COLORS[t] ?? 'bg-accent/10 text-accent-dark';
}

// ── Inner component (suspendable) ───────────────────────────────────────────

async function PostContent({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post: PostDetailVM | null = await getPostBySlug(slug);
  if (!post) notFound();

  return (
    <div className="bg-silver-light min-h-screen" dir="rtl">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <nav className="flex items-center gap-2 text-sm text-gray-500">
            <Link href="/" className="hover:text-accent transition-colors">خانه</Link>
            <span className="text-gray-300">/</span>
            <Link href="/blog" className="hover:text-accent transition-colors">وبلاگ</Link>
            <span className="text-gray-300">/</span>
            <span className="text-charcoal font-medium line-clamp-1">{post.title}</span>
          </nav>
        </div>
      </div>

      <article className="max-w-4xl mx-auto px-4 py-10">
        {/* Back button */}
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-accent-dark transition-colors mb-6"
        >
          <svg className="w-4 h-4 rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          بازگشت به وبلاگ
        </Link>

        {/* Cover image */}
        <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-silver-light mb-8 shadow-sm">
          <Image
            src={post.coverImage}
            alt={post.title}
            fill
            priority
            sizes="(max-width: 896px) 100vw, 896px"
            className="object-cover"
          />
        </div>

        {/* Meta */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8 mb-6">
          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-4">
            {post.tags.map(t => (
              <Link
                key={t}
                href={`/blog?tag=${encodeURIComponent(t)}&page=1`}
                className={`text-xs font-semibold px-2.5 py-0.5 rounded-full hover:opacity-75 transition-opacity ${tagClass(t)}`}
              >
                {t}
              </Link>
            ))}
          </div>

          {/* Title */}
          <h1 className="text-2xl md:text-3xl font-black text-charcoal leading-9 mb-4">
            {post.title}
          </h1>

          {/* Author + date + read time */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 pb-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent-dark font-bold text-sm">
                {post.author.charAt(0)}
              </div>
              <span>{post.author}</span>
            </div>
            <span>{post.publishedAt}</span>
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" strokeLinecap="round" />
              </svg>
              <span>{post.readTime} دقیقه مطالعه</span>
            </div>
          </div>

          {/* Body */}
          <div
            className="blog-body mt-6"
            dangerouslySetInnerHTML={{ __html: post.body }}
          />
        </div>

        {/* Back CTA */}
        <div className="text-center mt-8">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 bg-accent hover:bg-accent-dark text-charcoal font-semibold text-sm px-6 py-3 rounded-xl transition-colors"
          >
            مشاهده سایر مقالات
          </Link>
        </div>
      </article>
    </div>
  );
}

// ── Skeleton ────────────────────────────────────────────────────────────────

function PostSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10 animate-pulse">
      <div className="h-4 w-48 bg-gray-200 rounded mb-6" />
      <div className="aspect-video w-full bg-gray-200 rounded-2xl mb-8" />
      <div className="bg-white rounded-2xl p-8 space-y-4">
        <div className="flex gap-2">
          {[1, 2, 3].map(i => <div key={i} className="h-5 w-16 bg-gray-200 rounded-full" />)}
        </div>
        <div className="h-8 w-3/4 bg-gray-200 rounded" />
        <div className="h-4 w-1/2 bg-gray-200 rounded" />
        {[1, 2, 3, 4].map(i => <div key={i} className="h-4 bg-gray-200 rounded" />)}
      </div>
    </div>
  );
}

// ── Route ───────────────────────────────────────────────────────────────────

export default function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <Suspense fallback={<PostSkeleton />}>
      <PostContent params={params} />
    </Suspense>
  );
}
