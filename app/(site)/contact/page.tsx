import { Suspense } from 'react';
import Link from 'next/link';
import { getPublicSiteSettings, getSocialLinks } from '@/actions/site-settings';
import { contactPhonesForRole, settingLines } from '@/src/lib/site-settings-display';
import { SocialLinksRow } from '@/src/components/layout/SocialLinksRow';
import { getCurrentUser } from '@/src/lib/session';
import { pricingRoleFromUser } from '@/src/lib/user-role';

export default function ContactPage() {
  return (
    <div className="bg-silver-light min-h-screen" dir="rtl">
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <nav className="flex items-center gap-2 text-sm text-gray-500">
            <Link href="/" className="hover:text-accent transition-colors">خانه</Link>
            <span className="text-gray-300">/</span>
            <span className="text-charcoal font-medium">تماس با ما</span>
          </nav>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12 space-y-6">
        <Suspense fallback={<ContactSkeleton />}>
          <ContactContent />
        </Suspense>
      </div>
    </div>
  );
}

async function ContactContent() {
  const [settings, socialLinks, user] = await Promise.all([
    getPublicSiteSettings(),
    getSocialLinks(),
    getCurrentUser(),
  ]);

  const phoneLines = contactPhonesForRole(settings, pricingRoleFromUser(user?.role));
  const addressLines = settingLines(settings.address);
  const workingHourLines = settingLines(settings.workingHours);

  const cards = [
    phoneLines.length > 0
      ? { icon: '📞', title: 'تلفن', lines: phoneLines }
      : null,
    settings.email
      ? { icon: '📧', title: 'ایمیل', lines: [settings.email] }
      : null,
    addressLines.length > 0
      ? { icon: '📍', title: 'آدرس', lines: addressLines }
      : null,
    workingHourLines.length > 0
      ? { icon: '🕐', title: 'ساعات کاری', lines: workingHourLines }
      : null,
  ].filter(Boolean) as { icon: string; title: string; lines: string[] }[];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
      <h1 className="text-3xl font-black text-charcoal mb-6">تماس با ما</h1>
      {cards.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {cards.map((item) => (
            <div key={item.title} className="flex items-start gap-4 bg-silver-light rounded-xl p-5">
              <span className="text-3xl">{item.icon}</span>
              <div>
                <h3 className="font-bold text-charcoal mb-1">{item.title}</h3>
                {item.lines.map((line) => (
                  <p key={line} className="text-sm text-gray-600">{line}</p>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500">اطلاعات تماس هنوز در پنل مدیریت ثبت نشده است.</p>
      )}

      {socialLinks.length > 0 && (
        <div className="mt-8 pt-8 border-t border-gray-100">
          <h2 className="font-bold text-charcoal mb-4">شبکه‌های اجتماعی</h2>
          <SocialLinksRow links={socialLinks} size="md" />
        </div>
      )}
    </div>
  );
}

function ContactSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 animate-pulse">
      <div className="h-9 w-40 bg-gray-200 rounded-lg mb-6" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-start gap-4 bg-silver-light rounded-xl p-5">
            <div className="w-10 h-10 bg-gray-200 rounded-lg shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-20 bg-gray-200 rounded" />
              <div className="h-3 w-32 bg-gray-100 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
