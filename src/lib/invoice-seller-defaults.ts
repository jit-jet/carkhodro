import { SITE_SETTING_DEFAULTS } from '@/src/lib/site-branding';
import type { InvoiceContent, InvoiceSeller } from '@/src/lib/invoice-seller-types';

/** Fallback used only when the singleton settings row is absent or incomplete. */
export const DEFAULT_INVOICE_CONTENT: InvoiceContent = {
  brandName: 'کارخودرو',
  storeName: 'فروشگاه قطعات خودرو شاه گل',
  website: 'WWW.CARKHODRO.com',
  websiteUrl: 'https://carkhodro.com',
  country: 'ایران',
  province: 'خراسان رضوی',
  city: 'مشهد',
  postalCode: '۹۱۶۵۶۱۸۶۹۵',
  address: 'بلوار جمهوری اسلامی ۸، نبش شهید صیادتی ۱۹',
  phone: '۰۵۱۳۳۴۳۳۳۷۱',
  description:
    '<p>قطعات موتوری، جلوبندی، برقی، انژکتوری — برندهای ویژن، والئو، آیسین، اپتی‌بلت، WAX، امیرنیا، پاورگریپ، تیتیک، فران‌تک، قائم، رینگ مارموت، رینگ ماشین‌کاران، تری‌پارت، کمک KDS و کوشاران، کمک ایران، فنر لول زمان و … SM، موتوپاور، هانتر، شرق</p><p>فاکتور تا تسویه کامل نزد خریدار امانت می‌باشد. لطفاً وجه فاکتور را به شماره زیر واریز نمایید.</p>',
  bankName: 'مهر ایران',
  bankAccountHolder: 'حسین شاه گل زاده',
  cardNumber: '۶۰۶۳۷۳۱۲۱۱۲۳۸۷۷۰',
  sheba: 'IR۰۹۰۶۰۰۳۶۱۹۷۰۰۱۷۹۸۵۶۶۷۰۰۱',
};

export const DEFAULT_INVOICE_SELLER: InvoiceSeller = {
  ...DEFAULT_INVOICE_CONTENT,
  logoUrl: SITE_SETTING_DEFAULTS.logoUrl,
};
