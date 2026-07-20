import Link from 'next/link';
import { getPublicSiteSettings, getSocialLinks } from '@/actions/site-settings';
import { settingLines } from '@/src/lib/site-settings-display';
import { SocialLinksRow } from '@/src/components/layout/SocialLinksRow';

export default async function ContactPage() {
  const [settings, socialLinks] = await Promise.all([
    getPublicSiteSettings(),
    getSocialLinks(),
  ]);

  const phoneLines = [settings.phone, settings.secondaryPhone].filter(Boolean);
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
      </div>
    </div>
  );
}
