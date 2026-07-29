/**
 * Rules & Terms Page — /rules
 * ────────────────────────────
 * Server-rendered page; body comes from admin-managed RulesContent
 * (falls back to defaults when the DB row is missing/empty).
 * Linked from PhoneStep ("ورود → قوانین") and SignupForm checkbox.
 */

import Link from 'next/link';
import type { Metadata } from 'next';
import { getPublicRulesContent } from '@/actions/rules';

export const metadata: Metadata = {
  title: 'قوانین و مقررات | کارخودرو',
  description: 'قوانین و شرایط استفاده از خدمات فروشگاه آنلاین کارخودرو',
};

export default async function RulesPage() {
  const content = await getPublicRulesContent();

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <nav className="flex items-center gap-2 text-xs text-gray-400 mb-8" aria-label="breadcrumb">
        <Link href="/" className="hover:text-accent-dark transition-colors">خانه</Link>
        <span>/</span>
        <span className="text-charcoal font-medium">قوانین و مقررات</span>
      </nav>

      <div className="mb-10">
        <h1 className="text-3xl font-extrabold text-charcoal mb-3">قوانین و مقررات</h1>
        {content.updatedLabel ? (
          <p className="text-sm text-gray-500 leading-6">{content.updatedLabel}</p>
        ) : null}
        <div className="mt-4 h-1 w-16 bg-accent rounded-full" />
      </div>

      {content.intro ? (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-6 py-5 mb-8 text-sm text-amber-900 leading-7">
          {content.intro}
        </div>
      ) : null}

      <div
        className="blog-body"
        dangerouslySetInnerHTML={{ __html: content.body }}
      />

      <div className="mt-12 bg-charcoal text-white rounded-2xl px-6 py-6 text-sm leading-7">
        <p className="text-gray-300">
          در صورت داشتن هرگونه سؤال درباره‌ی این قوانین، می‌توانید با تیم پشتیبانی ما در تماس باشید.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/contact"
            className="bg-accent hover:bg-accent-dark text-charcoal font-semibold px-6 py-2.5 rounded-xl transition-colors text-sm"
          >
            تماس با ما
          </Link>
        </div>
      </div>
    </div>
  );
}
