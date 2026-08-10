import { Suspense, type ReactNode } from 'react';
import Link from 'next/link';
import { getPublicSiteSettings, getSocialLinks } from '@/actions/site-settings';
import { contactPhonesForRole, phoneTelHref, settingLines } from '@/src/lib/site-settings-display';
import { SocialLinksRow } from '@/src/components/layout/SocialLinksRow';
import { getCurrentUser } from '@/src/lib/session';
import { isWholesaleUser, pricingRoleFromUser } from '@/src/lib/user-role';
import type { Metadata } from 'next';
import { buildStaticPageMetadata } from '@/src/lib/static-page-metadata';

export function generateMetadata(): Promise<Metadata> {
  return buildStaticPageMetadata('/contact', { title: 'تماس با ما | کارخودرو', description: 'راه‌های ارتباط با فروشگاه کارخودرو' });
}

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

type ContactCard = {
  key: string;
  title: string;
  icon: ReactNode;
  lines: { text: string; href?: string }[];
};

async function ContactContent() {
  const [settings, socialLinks, user] = await Promise.all([
    getPublicSiteSettings(),
    getSocialLinks(),
    getCurrentUser(),
  ]);

  const phoneLines = contactPhonesForRole(settings, pricingRoleFromUser(user?.role));
  const addressLines = settingLines(settings.address);
  const workingHourLines = settingLines(settings.workingHours);
  const showSocialLinks = isWholesaleUser(pricingRoleFromUser(user?.role));

  const cards: ContactCard[] = [
    phoneLines.length > 0
      ? {
          key: 'phone',
          title: 'تلفن',
          icon: <PhoneIcon />,
          lines: phoneLines.map((phone) => ({
            text: phone,
            href: phoneTelHref(phone),
          })),
        }
      : null,
    settings.email
      ? {
          key: 'email',
          title: 'ایمیل',
          icon: <MailIcon />,
          lines: [{ text: settings.email, href: `mailto:${settings.email}` }],
        }
      : null,
    addressLines.length > 0
      ? {
          key: 'address',
          title: 'آدرس',
          icon: <MapPinIcon />,
          lines: addressLines.map((line) => ({ text: line })),
        }
      : null,
    workingHourLines.length > 0
      ? {
          key: 'hours',
          title: 'ساعات کاری',
          icon: <ClockIcon />,
          lines: workingHourLines.map((line) => ({ text: line })),
        }
      : null,
  ].filter(Boolean) as ContactCard[];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
      <h1 className="text-3xl font-black text-charcoal mb-6">تماس با ما</h1>
      {cards.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {cards.map((item) => (
            <div
              key={item.key}
              className="group flex items-start gap-4 rounded-2xl border border-gray-100 bg-silver-light/70 p-5 transition-all duration-200 hover:border-accent/40 hover:bg-white hover:shadow-md"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent-dark ring-1 ring-accent/25 transition-colors group-hover:bg-accent group-hover:text-charcoal group-hover:ring-accent">
                {item.icon}
              </span>
              <div className="min-w-0 pt-0.5">
                <h3 className="mb-1.5 font-bold text-charcoal">{item.title}</h3>
                <div className="space-y-1">
                  {item.lines.map((line) =>
                    line.href ? (
                      <a
                        key={line.text}
                        href={line.href}
                        dir="ltr"
                        className="block text-sm text-gray-600 transition-colors hover:text-accent-dark"
                      >
                        {line.text}
                      </a>
                    ) : (
                      <p key={line.text} className="text-sm leading-6 text-gray-600">
                        {line.text}
                      </p>
                    ),
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500">اطلاعات تماس هنوز در پنل مدیریت ثبت نشده است.</p>
      )}

      {showSocialLinks && socialLinks.length > 0 && (
        <div className="mt-8 border-t border-gray-100 pt-8">
          <h2 className="mb-4 font-bold text-charcoal">شبکه‌های اجتماعی</h2>
          <SocialLinksRow links={socialLinks} size="md" />
        </div>
      )}
    </div>
  );
}

function ContactSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
      <div className="mb-6 h-9 w-40 rounded-lg bg-gray-200" />
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-start gap-4 rounded-2xl bg-silver-light p-5">
            <div className="h-12 w-12 shrink-0 rounded-xl bg-gray-200" />
            <div className="flex-1 space-y-2 pt-1">
              <div className="h-4 w-20 rounded bg-gray-200" />
              <div className="h-3 w-32 rounded bg-gray-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden>
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.67A2 2 0 012 .84h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.66a16 16 0 006.25 6.25l1.18-1.18a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 15.92z" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 01-2.06 0L2 7" />
    </svg>
  );
}

function MapPinIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden>
      <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 01-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0116 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  );
}
