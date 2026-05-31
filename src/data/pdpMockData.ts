/**
 * PDP-specific mock data.
 * Base product fields come from mockDatabase.ts — only the extra fields that
 * are not present on the base Product are stored here so the swap to a real
 * API only requires touching this file.
 */

import { products } from './mockDatabase';
import type { Product } from './mockDatabase';

export interface PDPComment {
  id: number;
  author: string;
  date: string;   // Persian date string for display
  rating: number; // 1-5
  text: string;
  verified: boolean;
}

export interface PDPExtra {
  packQuantity: number;     // تعداد در بسته
  cartonQuantity: number;   // تعداد در کارتن
  isOriginal: boolean;      // اصلی
  description: string;
  comments: PDPComment[];
  relatedProductIds: number[];
}

export interface PDPProduct extends Product, PDPExtra {}

// ── Per-product PDP data ──────────────────────────────────────────────────────

const pdpExtras: Record<number, PDPExtra> = {
  // 1: فیلتر روغن موتور اصلی بوش
  1: {
    packQuantity: 1,
    cartonQuantity: 12,
    isOriginal: true,
    description: `فیلتر روغن موتور بوش با جدیدترین تکنولوژی‌های فیلتراسیون، آلودگی‌های ذره‌ای و میکروسکوپی موجود در روغن موتور را به طور کامل جذب می‌کند. این فیلتر دارای پوشش ضدخوردگی بوده و در برابر دمای بالا و فشار روغن مقاوم است. طراحی دقیق لایه‌های فیلتر تضمین می‌کند که روغن تمیز به موتور برسد و طول عمر موتور به حداکثر برسد.

مشخصات فنی:
• جنس بدنه: فولاد مقاوم با پوشش ضدزنگ
• جنس المان: کاغذ مخصوص با تراکم بالا
• فشار شکست: حداکثر ۱۲ بار
• دمای کار: ۴۰− تا ۱۵۰+ درجه سانتی‌گراد
• تناوب تعویض: هر ۵,۰۰۰ کیلومتر یا ۶ ماه`,
    comments: [
      { id: 1, author: 'محمد رضایی',  date: '۱۴۰۳/۰۸/۱۵', rating: 5, text: 'کیفیت عالی، کاملاً اصل، موتورم بعد از نصب روان‌تر کار می‌کنه.', verified: true },
      { id: 2, author: 'علی احمدی',   date: '۱۴۰۳/۰۷/۲۲', rating: 4, text: 'محصول خوبی هست ولی کمی گران‌قیمت. بسته‌بندی عالی بود.', verified: true },
      { id: 3, author: 'سارا کریمی',  date: '۱۴۰۳/۰۶/۱۰', rating: 5, text: 'دقیقاً همون چیزی که نیاز داشتم. سریع ارسال شد.', verified: false },
    ],
    relatedProductIds: [5, 6, 32, 23],
  },

  // 2: واتر پمپ موتور ایساکو
  2: {
    packQuantity: 1,
    cartonQuantity: 6,
    isOriginal: true,
    description: `واتر پمپ موتور ایساکو برای خودروهای پژو ۴۰۵ طراحی شده و دارای تأییدیه‌های رسمی ایران‌خودرو است. سیستم آب‌بندی مضاعف از نشت مایع خنک‌کننده جلوگیری کرده و طول عمر بالایی ارائه می‌دهد.

مشخصات فنی:
• دبی آب: ۶۰ لیتر در دقیقه
• حداکثر دما: ۱۱۰ درجه سانتی‌گراد
• جنس ایمپلر: آلومینیوم آنودایز شده
• نوع آب‌بندی: دوگانه`,
    comments: [
      { id: 1, author: 'حسین محمدی',  date: '۱۴۰۳/۰۹/۰۵', rating: 4, text: 'بعد از نصب خودروم به درستی خنک می‌شه. نصب آسون بود.', verified: true },
      { id: 2, author: 'فاطمه نظری',  date: '۱۴۰۳/۰۸/۱۸', rating: 5, text: 'محصول اصل ایساکو، قیمت مناسب با تخفیف خوب.', verified: true },
    ],
    relatedProductIds: [19, 20, 21, 22],
  },

  // 3: کیت کلاچ کامل واریان
  3: {
    packQuantity: 1,
    cartonQuantity: 4,
    isOriginal: true,
    description: `کیت کلاچ کامل سه‌پارچه واریان شامل صفحه کلاچ، دیسک کلاچ و بلبرینگ آزاد است. تولید با استانداردهای OEM و مواد اصطکاکی درجه یک، عمر مفید بیشتری نسبت به محصولات مشابه ارائه می‌دهد.

مشخصات فنی:
• نوع: سه‌پارچه (Three-Piece Kit)
• مواد اصطکاکی: ترکیب آرامید و رزین
• قطر دیسک: ۱۸۰ میلی‌متر
• گشتاور انتقالی: حداکثر ۱۸۰ نیوتون متر`,
    comments: [
      { id: 1, author: 'امیر تهرانی',  date: '۱۴۰۳/۱۰/۱۲', rating: 5, text: 'کیفیت فوق‌العاده! بعد از نصب احساس می‌کنم ماشین نو شده.', verified: true },
      { id: 2, author: 'رضا اکبری',    date: '۱۴۰۳/۰۹/۲۸', rating: 4, text: 'کیت کامل با همه قطعات اومد. نصب توسط تعمیرگاه انجام شد.', verified: true },
      { id: 3, author: 'مهدی شیرازی', date: '۱۴۰۳/۰۹/۱۵', rating: 5, text: 'بسته‌بندی خوب، قطعات اصل، ارسال سریع.', verified: false },
    ],
    relatedProductIds: [9, 10, 11, 12],
  },

  // 9: لنت ترمز جلو بوش
  9: {
    packQuantity: 2,
    cartonQuantity: 20,
    isOriginal: true,
    description: `لنت ترمز جلو دیسکی بوش با ترکیب مواد اصطکاکی پیشرفته، قدرت ترمزگیری بالا و صدای کمینه را تضمین می‌کند. این لنت با استاندارد ECE R-90 سازگار بوده و برای استفاده روزمره و شرایط سخت جاده‌ای ایده‌آل است.

مشخصات فنی:
• ضخامت: ۱۵ میلی‌متر (جدید)
• حداقل ضخامت قابل قبول: ۲ میلی‌متر
• مقاومت حرارتی: تا ۵۰۰ درجه سانتی‌گراد
• استاندارد: ECE R-90`,
    comments: [
      { id: 1, author: 'نادر قاسمی',  date: '۱۴۰۳/۰۷/۰۸', rating: 5, text: 'بهترین لنتی که تا حالا خریدم. ترمز عالی و بدون صدا.', verified: true },
      { id: 2, author: 'لیلا صادقی',  date: '۱۴۰۳/۰۶/۲۵', rating: 4, text: 'لنت بوش اصل. کیفیت خوب. قیمت مناسب.', verified: true },
    ],
    relatedProductIds: [10, 11, 12, 13],
  },

  // 14: شمع NGK اصلی
  14: {
    packQuantity: 4,
    cartonQuantity: 40,
    isOriginal: true,
    description: `شمع خودرو NGK اصلی با فناوری الکترود ایریدیوم، احتراق بهتر، مصرف کمتر سوخت و عملکرد بهتر موتور را فراهم می‌کند. این شمع‌ها برای خودروهای پژو ۲۰۶ طراحی شده و با مشخصات دقیق کارخانه تطابق دارند.

مشخصات فنی:
• نوع الکترود: ایریدیوم
• فاصله الکترود: ۱.۱ میلی‌متر
• حرارت شمع: ۶
• رزوه: M14 × 1.25`,
    comments: [
      { id: 1, author: 'کیوان موسوی', date: '۱۴۰۳/۰۸/۲۰', rating: 5, text: 'شمع اصل NGK. بعد از نصب مصرف بنزین کمتر شد.', verified: true },
      { id: 2, author: 'پریسا علوی',  date: '۱۴۰۳/۰۷/۱۵', rating: 4, text: 'بسته‌بندی اصل، سریع ارسال شد، کیفیت عالی.', verified: false },
      { id: 3, author: 'داوود کمالی', date: '۱۴۰۳/۰۶/۰۵', rating: 5, text: 'NGK همیشه بهترین بوده. توصیه می‌کنم.', verified: true },
    ],
    relatedProductIds: [1, 15, 16, 17],
  },

  // 23: روغن موتور بوش 4 لیتری
  23: {
    packQuantity: 1,
    cartonQuantity: 6,
    isOriginal: true,
    description: `روغن موتور ۴ لیتری بوش با ویسکوزیته 5W-40 برای موتورهای بنزینی و دیزلی مدرن فرموله شده است. محافظت کامل در دماهای بالا و پایین، کاهش سایش قطعات موتور و بهبود عملکرد از مزایای این روغن است.

مشخصات فنی:
• ویسکوزیته: 5W-40 ACEA A3/B4
• استاندارد: API SN Plus / CF
• حجم: ۴ لیتر
• فاصله تعویض: ۱۰,۰۰۰ کیلومتر یا ۱ سال`,
    comments: [
      { id: 1, author: 'بهروز منصوری', date: '۱۴۰۳/۱۰/۰۱', rating: 5, text: 'روغن اصل بوش. موتور بعد از تعویض خیلی روان شد.', verified: true },
      { id: 2, author: 'زینب حیدری',   date: '۱۴۰۳/۰۹/۱۲', rating: 5, text: 'قیمت مناسب، سریع ارسال شد. رضایت کامل.', verified: true },
      { id: 3, author: 'مجتبی فراهانی', date: '۱۴۰۳/۰۸/۰۴', rating: 4, text: 'خوب بود ولی دیر رسید. کیفیت روغن ایده‌آل.', verified: false },
    ],
    relatedProductIds: [24, 25, 26, 1],
  },
};

// ── Fallback generator for products without explicit PDP data ─────────────────

function getDefaultExtra(product: Product): PDPExtra {
  const related = products
    .filter(
      p =>
        p.id !== product.id &&
        (p.categoryId === product.categoryId || p.carModelId === product.carModelId),
    )
    .slice(0, 4)
    .map(p => p.id);

  return {
    packQuantity: 1,
    cartonQuantity: product.price > 500_000 ? 4 : 12,
    isOriginal: true,
    description: `${product.name} از برند معتبر ${product.brand} برای خودروهای ${product.carType} طراحی و تولید شده است. این محصول دارای گارانتی ${product.warranty} بوده و از کشور ${product.origin} وارد می‌شود. کیفیت ساخت بالا و تطابق دقیق با مشخصات فنی کارخانه از مزایای اصلی این محصول است.`,
    comments: [
      {
        id: 1,
        author: 'کاربر تأیید شده',
        date: '۱۴۰۳/۰۸/۰۱',
        rating: Math.round(product.rating),
        text: 'محصول با کیفیت، مطابق توضیحات سایت. ارسال سریع و بسته‌بندی مناسب.',
        verified: true,
      },
    ],
    relatedProductIds: related,
  };
}

// ── Public API ────────────────────────────────────────────────────────────────

export function getPDPProduct(id: number): PDPProduct | null {
  const product = products.find(p => p.id === id);
  if (!product) return null;
  const extra = pdpExtras[id] ?? getDefaultExtra(product);
  return { ...product, ...extra };
}

export function getRelatedProducts(ids: number[]): Product[] {
  return ids.flatMap(id => {
    const p = products.find(x => x.id === id);
    return p ? [p] : [];
  });
}

export type { Product };
