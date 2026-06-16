import Link from 'next/link';
import Image from 'next/image';
import { Suspense } from 'react';
import { getPosts } from '@/actions/posts';
import type { PostVM } from '@/src/lib/serializers';
import BlogSearch from '@/src/components/blog/BlogSearch';

const PAGE_SIZE = 12;

const TAG_COLORS: Record<string, string> = {
  'ایمنی':         'bg-red-100 text-red-700',
  'ترمز':          'bg-orange-100 text-orange-700',
  'موتور':         'bg-slate-100 text-slate-700',
  'نگهداری':       'bg-green-100 text-green-700',
  'آموزش':         'bg-blue-100 text-blue-700',
  'DIY':           'bg-blue-100 text-blue-700',
  'مقایسه':        'bg-purple-100 text-purple-700',
  'برق':           'bg-amber-100 text-amber-700',
  'باطری':         'bg-amber-100 text-amber-700',
  'خنک‌کننده':    'bg-cyan-100 text-cyan-700',
  'فیلتر':         'bg-gray-100 text-gray-700',
  'روغن':          'bg-yellow-100 text-yellow-700',
  'تعلیق':         'bg-indigo-100 text-indigo-700',
  'لاستیک':        'bg-stone-100 text-stone-700',
  'عیب‌یابی':     'bg-rose-100 text-rose-700',
  'فصلی':          'bg-teal-100 text-teal-700',
  'زمستان':        'bg-sky-100 text-sky-700',
  'توصیه':         'bg-lime-100 text-lime-700',
  'راهنمای خرید': 'bg-violet-100 text-violet-700',
  'آگاهی‌رسانی':  'bg-pink-100 text-pink-700',
  'کیفیت':         'bg-emerald-100 text-emerald-700',
  'خرید':          'bg-violet-100 text-violet-700',
  'پژو':           'bg-blue-100 text-blue-700',
  'شمع':           'bg-orange-100 text-orange-700',
};

function tagClass(t: string) {
  return TAG_COLORS[t] ?? 'bg-accent/10 text-accent-dark';
}

// ── Post card ───────────────────────────────────────────────────────────────

function PostCard({ post, activeTag }: { post: PostVM; activeTag: string }) {
  return (
    <article className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex flex-col">
      <Link href={`/blog/${post.slug}`} className="block relative aspect-video overflow-hidden bg-silver-light">
        <Image
          src={post.coverImage}
          alt={post.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-300 hover:scale-105"
        />
      </Link>

      <div className="p-5 flex flex-col flex-1 gap-3">
        {/* Tags */}
        <div className="flex flex-wrap gap-1.5">
          {post.tags.slice(0, 3).map(t => (
            <Link
              key={t}
              href={activeTag === t ? '/blog' : `/blog?tag=${encodeURIComponent(t)}&page=1`}
              className={`text-xs font-semibold px-2 py-0.5 rounded-full transition-opacity hover:opacity-75 ${tagClass(t)} ${activeTag === t ? 'ring-2 ring-offset-1 ring-accent' : ''}`}
            >
              {t}
            </Link>
          ))}
        </div>

        {/* Title */}
        <Link href={`/blog/${post.slug}`}>
          <h2 className="font-bold text-charcoal leading-7 hover:text-accent-dark transition-colors line-clamp-2">
            {post.title}
          </h2>
        </Link>

        {/* Excerpt */}
        <p className="text-xs text-gray-500 leading-6 line-clamp-2 flex-1">
          {post.excerpt}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-50 text-xs text-gray-400">
          <span>{post.author}</span>
          <div className="flex items-center gap-2">
            <span>{post.publishedAt}</span>
            <span>·</span>
            <span>{post.readTime} دقیقه</span>
          </div>
        </div>
      </div>
    </article>
  );
}

// ── Pagination ──────────────────────────────────────────────────────────────

function Pagination({
  current,
  total,
  q,
  tag,
}: {
  current: number;
  total: number;
  q: string;
  tag: string;
}) {
  function href(p: number) {
    const params = new URLSearchParams();
    if (q)   params.set('q', q);
    if (tag) params.set('tag', tag);
    params.set('page', String(p));
    return `/blog?${params.toString()}`;
  }

  const pages: (number | '…')[] = [];
  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i);
  } else {
    pages.push(1);
    if (current > 3) pages.push('…');
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
      pages.push(i);
    }
    if (current < total - 2) pages.push('…');
    pages.push(total);
  }

  const btnBase =
    'inline-flex items-center justify-center h-9 min-w-[2.25rem] rounded-xl text-sm font-medium transition-colors px-2';

  return (
    <nav aria-label="صفحه‌بندی" className="flex items-center justify-center gap-1 mt-10 flex-wrap">
      {current > 1 && (
        <Link href={href(current - 1)} className={`${btnBase} border border-gray-200 bg-white text-charcoal hover:border-accent`}>
          ‹ قبلی
        </Link>
      )}

      {pages.map((p, i) =>
        p === '…' ? (
          <span key={`ellipsis-${i}`} className={`${btnBase} text-gray-400`}>…</span>
        ) : (
          <Link
            key={p}
            href={href(p)}
            aria-current={p === current ? 'page' : undefined}
            className={`${btnBase} ${
              p === current
                ? 'bg-accent text-charcoal font-bold border border-accent'
                : 'border border-gray-200 bg-white text-charcoal hover:border-accent'
            }`}
          >
            {p}
          </Link>
        ),
      )}

      {current < total && (
        <Link href={href(current + 1)} className={`${btnBase} border border-gray-200 bg-white text-charcoal hover:border-accent`}>
          بعدی ›
        </Link>
      )}
    </nav>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────

interface Props {
  searchParams: Promise<{ page?: string; q?: string; tag?: string }>;
}

async function BlogContent({ searchParams }: Props) {
  const { page = '1', q = '', tag = '' } = await searchParams;
  const pageNum = Math.max(1, parseInt(page, 10) || 1);

  const { posts, total, pages } = await getPosts(pageNum, q, tag);

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-charcoal mb-2">وبلاگ کارخودرو</h1>
        <p className="text-gray-500 text-sm">راهنماها، نکات فنی و اخبار دنیای خودرو</p>
      </div>

      {/* Search row */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <Suspense fallback={<div className="h-10 w-72 bg-gray-200 rounded-xl animate-pulse" />}>
          <BlogSearch defaultValue={q} />
        </Suspense>

        {tag && (
          <Link
            href={q ? `/blog?q=${encodeURIComponent(q)}&page=1` : '/blog'}
            className="flex items-center gap-1.5 bg-accent/10 text-accent-dark text-sm font-medium px-3 py-2 rounded-xl hover:bg-accent/20 transition-colors"
          >
            <span>#{tag}</span>
            <span className="text-base leading-none">×</span>
          </Link>
        )}
      </div>

      {/* Count */}
      <p className="text-sm text-gray-500 mb-6">
        {total.toLocaleString('fa-IR')} مقاله
        {(q || tag) && ' یافت شد'}
      </p>

      {/* Grid */}
      {posts.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {posts.map(post => (
              <PostCard key={post.id} post={post} activeTag={tag} />
            ))}
          </div>

          {pages > 1 && (
            <Pagination current={pageNum} total={pages} q={q} tag={tag} />
          )}
        </>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-20 flex flex-col items-center text-center px-4">
          <span className="text-5xl mb-4 select-none">🔍</span>
          <h3 className="text-lg font-bold text-charcoal mb-2">مقاله‌ای یافت نشد</h3>
          <p className="text-sm text-gray-500 mb-5">
            کلمه دیگری جستجو کنید یا فیلتر را پاک کنید
          </p>
          <Link
            href="/blog"
            className="bg-accent hover:bg-accent-dark text-charcoal font-semibold text-sm px-6 py-2 rounded-xl transition-colors"
          >
            نمایش همه مقالات
          </Link>
        </div>
      )}
    </div>
  );
}

function BlogContentSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="mb-8">
        <div className="h-9 w-48 bg-gray-200 rounded-xl animate-pulse mb-2" />
        <div className="h-4 w-64 bg-gray-100 rounded animate-pulse" />
      </div>
      <div className="h-10 w-72 bg-gray-200 rounded-xl animate-pulse mb-4" />
      <div className="h-4 w-24 bg-gray-100 rounded animate-pulse mb-6" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden h-72 animate-pulse" />
        ))}
      </div>
    </div>
  );
}

export default function BlogPage({ searchParams }: Props) {
  return (
    <div className="bg-silver-light min-h-screen" dir="rtl">
      {/* Breadcrumb — static, no data needed */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <nav className="flex items-center gap-2 text-sm text-gray-500">
            <Link href="/" className="hover:text-accent transition-colors">خانه</Link>
            <span className="text-gray-300">/</span>
            <span className="text-charcoal font-medium">وبلاگ</span>
          </nav>
        </div>
      </div>

      <Suspense fallback={<BlogContentSkeleton />}>
        <BlogContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
