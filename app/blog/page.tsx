import Link from 'next/link';

const POSTS = [
  {
    slug: '1',
    title: 'راهنمای تعویض فیلتر روغن در خانه',
    excerpt: 'تعویض فیلتر روغن یکی از ساده‌ترین کارهای نگهداری خودرو است که می‌توانید با ابزار ساده در منزل انجام دهید.',
    category: 'آموزش',
    date: '۱۴۰۳/۰۹/۱۵',
    readTime: '۵ دقیقه',
  },
  {
    slug: '2',
    title: 'چگونه لنت ترمز فرسوده را تشخیص دهیم؟',
    excerpt: 'لنت ترمز یکی از مهم‌ترین اجزای ایمنی خودرو است. در این مطلب نشانه‌های فرسودگی لنت را بررسی می‌کنیم.',
    category: 'ایمنی',
    date: '۱۴۰۳/۰۹/۰۸',
    readTime: '۴ دقیقه',
  },
  {
    slug: '3',
    title: 'بهترین برندهای فیلتر هوا برای پژو ۲۰۶',
    excerpt: 'فیلتر هوا نقش مهمی در عمر موتور دارد. در این مقاله برندهای معتبر فیلتر هوا برای پژو ۲۰۶ را مقایسه می‌کنیم.',
    category: 'مقایسه',
    date: '۱۴۰۳/۰۹/۰۱',
    readTime: '۶ دقیقه',
  },
  {
    slug: '4',
    title: 'نگهداری سیستم خنک‌کننده در فصل تابستان',
    excerpt: 'گرمای تابستان فشار زیادی به سیستم خنک‌کننده خودرو وارد می‌کند. این راهنما به شما کمک می‌کند از آسیب جلوگیری کنید.',
    category: 'نگهداری',
    date: '۱۴۰۳/۰۸/۲۰',
    readTime: '۷ دقیقه',
  },
];

const CATEGORY_COLORS: Record<string, string> = {
  'آموزش':   'bg-blue-100 text-blue-700',
  'ایمنی':   'bg-red-100 text-red-700',
  'مقایسه':  'bg-purple-100 text-purple-700',
  'نگهداری': 'bg-green-100 text-green-700',
};

export default function BlogPage() {
  return (
    <div className="bg-silver-light min-h-screen" dir="rtl">
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <nav className="flex items-center gap-2 text-sm text-gray-500">
            <Link href="/" className="hover:text-accent transition-colors">خانه</Link>
            <span className="text-gray-300">/</span>
            <span className="text-charcoal font-medium">وبلاگ</span>
          </nav>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-black text-charcoal mb-2">وبلاگ کارخودرو</h1>
        <p className="text-gray-500 text-sm mb-8">راهنماها، نکات فنی و اخبار دنیای خودرو</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {POSTS.map(post => (
            <article key={post.slug} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              <div className="h-40 bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center">
                <span className="text-5xl">🔧</span>
              </div>
              <div className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${CATEGORY_COLORS[post.category] ?? 'bg-gray-100 text-gray-600'}`}>
                    {post.category}
                  </span>
                  <span className="text-xs text-gray-400">{post.date}</span>
                  <span className="text-xs text-gray-400">·</span>
                  <span className="text-xs text-gray-400">{post.readTime} مطالعه</span>
                </div>
                <h2 className="font-bold text-charcoal mb-2 leading-6">{post.title}</h2>
                <p className="text-xs text-gray-500 leading-6 line-clamp-2">{post.excerpt}</p>
                <div className="mt-4">
                  <span className="text-xs font-semibold text-accent-dark hover:underline cursor-pointer">
                    ادامه مطلب ›
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
