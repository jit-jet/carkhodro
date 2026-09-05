import type { InvoiceSeller } from '@/src/lib/invoice-seller-types';

/** Fallback used only when the singleton settings row is absent or incomplete. */
export const DEFAULT_INVOICE_SELLER: InvoiceSeller = {
  brandName: 'کارخودرو',
  storeName: 'فروشگاه قطعات خودرو شاه گل',
  website: 'WWW.CARKHODRO.COM',
  websiteUrl: 'https://carkhodro.com',
  logoUrl: '/logo.png',
  country: 'ایران',
  province: 'خراسان رضوی',
  city: 'مشهد',
  postalCode: '۹۱۶۵۶۱۸۶۹۵',
  address: 'بلوار جمهوری اسلامی ۸، نبش شهید صیادتی ۱۹',
  phone: '۰۵۱۳۳۴۳۳۳۷۱',
  categoriesNote:
    'قطعات موتوری، جلوبندی، برقی، انژکتوری — برندهای ویژن، والئو، آیسین، اپتی‌بلت، WAX، امیرنیا، پاورگریپ، تیتیک، فران‌تک، قائم، رینگ مارموت، رینگ ماشین‌کاران، تری‌پارت، کمک KDS و کوشاران، کمک ایران، فنر لول زمان و … SM، موتوپاور، هانتر، شرق',
  trustNote:
    'فاکتور تا تسویه کامل نزد خریدار امانت می‌باشد. لطفاً وجه فاکتور را به شماره زیر واریز نمایید.',
  bankName: 'مهر ایران',
  bankAccountHolder: 'حسین شاه گل زاده',
  cardNumber: '۶۰۶۳۷۳۱۲۱۱۲۳۸۷۷۰',
  sheba: 'IR۰۹۰۶۰۰۳۶۱۹۷۰۰۱۷۹۸۵۶۶۷۰۰۱',
};
