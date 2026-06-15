import 'dotenv/config';
import { PrismaClient, ShippingMethod, UserRole } from '../generated/prisma_client';
import { PrismaPg } from '@prisma/adapter-pg';

const prisma = new PrismaClient({
  adapter: new PrismaPg(process.env.DATABASE_URL!),
});

async function main() {
  // ── FAQs (idempotent — runs even when the rest is already seeded) ──────────
  const faqCount = await prisma.faq.count();
  if (faqCount === 0) {
    await prisma.faq.createMany({
      data: [
        {
          question: 'چگونه از اصالت قطعات مطمئن شوم؟',
          answer: 'تمامی محصولات کارخودرو دارای ضمانت اصالت کالا هستند و از منابع معتبر و رسمی تأمین می‌شوند. کد پیگیری ضمانت روی بسته‌بندی هر محصول درج شده است.',
          sortOrder: 1,
        },
        {
          question: 'مدت زمان ارسال چقدر است؟',
          answer: 'سفارشات تهران معمولاً ۲۴ ساعته و سایر شهرها ظرف ۴۸ تا ۷۲ ساعت کاری ارسال می‌شوند. پس از ثبت سفارش، کد رهگیری پستی از طریق پیامک ارسال می‌گردد.',
          sortOrder: 2,
        },
        {
          question: 'آیا امکان مرجوع کردن کالا وجود دارد؟',
          answer: 'بله. تا ۷ روز پس از دریافت کالا، در صورت عدم استفاده و سالم بودن بسته‌بندی، امکان مرجوع و بازگشت وجه وجود دارد.',
          sortOrder: 3,
        },
        {
          question: 'چه روش‌های پرداختی پذیرفته می‌شود؟',
          answer: 'پرداخت آنلاین از طریق درگاه بانکی، پرداخت در محل (کارت‌خوان) و پرداخت کارت به کارت برای سفارش‌های خاص امکان‌پذیر است.',
          sortOrder: 4,
        },
        {
          question: 'چطور قطعه مناسب خودرو خود را پیدا کنم؟',
          answer: 'از فیلتر جستجو بر اساس مدل خودرو در صفحه محصولات استفاده کنید. همچنین می‌توانید از طریق شماره تلفن پشتیبانی با کارشناسان فنی ما مشورت نمایید.',
          sortOrder: 5,
        },
        {
          question: 'آیا برای محصولات گارانتی وجود دارد؟',
          answer: 'اکثر محصولات دارای گارانتی برند سازنده هستند. مدت گارانتی روی صفحه هر محصول قید شده است.',
          sortOrder: 6,
        },
      ],
    });
    console.log('  6 FAQs seeded.');
  }

  const count = await prisma.product.count();
  if (count > 0) {
    console.log(`Already seeded (${count} products). Skipping.`);
    return;
  }

  // ── Provinces ──────────────────────────────────────────────────────────────
  const provinceNames = [
    'آذربایجان شرقی', 'آذربایجان غربی', 'اردبیل', 'اصفهان', 'البرز',
    'ایلام', 'بوشهر', 'تهران', 'چهارمحال و بختیاری', 'خراسان جنوبی',
    'خراسان رضوی', 'خراسان شمالی', 'خوزستان', 'زنجان', 'سمنان',
    'سیستان و بلوچستان', 'فارس', 'قزوین', 'قم', 'کردستان',
    'کرمان', 'کرمانشاه', 'کهگیلویه و بویراحمد', 'گلستان', 'گیلان',
    'لرستان', 'مازندران', 'مرکزی', 'هرمزگان', 'همدان', 'یزد',
  ];
  const provinces = await prisma.$transaction(
    provinceNames.map(name => prisma.province.create({ data: { name } })),
  );
  const provinceId = new Map(provinces.map(p => [p.name, p.id]));

  // ── Cities (one representative city per province) ──────────────────────────
  const cities = await prisma.$transaction(
    provinces.map(p => prisma.city.create({ data: { name: p.name, provinceId: p.id } })),
  );
  const cityId = new Map(cities.map(c => [c.name, c.id]));

  // ── Car Brands ─────────────────────────────────────────────────────────────
  const carBrandsInput = [
    { name: 'ایران خودرو', slug: 'iran-khodro', logoImage: '/tempt/ezam.webp', productCount: 4520 },
    { name: 'سایپا',       slug: 'saipa',        logoImage: '/tempt/ezam.webp', productCount: 3210 },
    { name: 'تویوتا',      slug: 'toyota',       logoImage: '/tempt/ezam.webp', productCount: 2840 },
    { name: 'هیوندای',     slug: 'hyundai',      logoImage: '/tempt/ezam.webp', productCount: 2150 },
    { name: 'کیا',         slug: 'kia',          logoImage: '/tempt/ezam.webp', productCount: 1980 },
    { name: 'نیسان',       slug: 'nissan',       logoImage: '/tempt/ezam.webp', productCount: 1750 },
    { name: 'مزدا',        slug: 'mazda',        logoImage: '/tempt/ezam.webp', productCount: 1340 },
    { name: 'بی‌ام‌و',    slug: 'bmw',          logoImage: '/tempt/ezam.webp', productCount: 2100 },
    { name: 'مرسدس',       slug: 'mercedes',     logoImage: '/tempt/ezam.webp', productCount: 1890 },
    { name: 'پژو',         slug: 'peugeot',      logoImage: '/tempt/ezam.webp', productCount: 3200 },
    { name: 'رنو',         slug: 'renault',      logoImage: '/tempt/ezam.webp', productCount: 2100 },
    { name: 'فولکس',       slug: 'volkswagen',   logoImage: '/tempt/ezam.webp', productCount: 1560 },
  ];
  const carBrands = await prisma.$transaction(
    carBrandsInput.map(b => prisma.carBrand.create({ data: b })),
  );
  // keyed by 1-based position matching mock carBrandId
  const cbId = (mockId: number) => carBrands[mockId - 1].id;

  // ── Car Models ─────────────────────────────────────────────────────────────
  // yearStart/yearEnd are Gregorian (Jalali + 621)
  const carModelsInput = [
    { carBrandId: cbId(1), name: 'پژو ۲۰۶',   yearStart: 2001, yearEnd: 2023 as number | null, image: '/tempt/quick.jpg' },
    { carBrandId: cbId(1), name: 'پژو ۴۰۵',   yearStart: 1991, yearEnd: 2023 as number | null, image: '/tempt/quick.jpg' },
    { carBrandId: cbId(1), name: 'سمند',       yearStart: 2002, yearEnd: 2023 as number | null, image: '/tempt/quick.jpg' },
    { carBrandId: cbId(1), name: 'دنا',        yearStart: 2012, yearEnd: 2023 as number | null, image: '/tempt/quick.jpg' },
    { carBrandId: cbId(1), name: 'پارس',       yearStart: 1998, yearEnd: 2022 as number | null, image: '/tempt/quick.jpg' },
    { carBrandId: cbId(2), name: 'پراید',      yearStart: 1989, yearEnd: 2021 as number | null, image: '/tempt/quick.jpg' },
    { carBrandId: cbId(2), name: 'تیبا',       yearStart: 2010, yearEnd: 2023 as number | null, image: '/tempt/quick.jpg' },
    { carBrandId: cbId(2), name: 'ساینا',      yearStart: 2015, yearEnd: 2023 as number | null, image: '/tempt/quick.jpg' },
    { carBrandId: cbId(2), name: 'شاهین',      yearStart: 2021, yearEnd: null,                  image: '/tempt/quick.jpg' },
    { carBrandId: cbId(3), name: 'کرولا',      yearStart: 2006, yearEnd: 2023 as number | null, image: '/tempt/quick.jpg' },
    { carBrandId: cbId(3), name: 'کمری',       yearStart: 2001, yearEnd: 2023 as number | null, image: '/tempt/quick.jpg' },
    { carBrandId: cbId(3), name: 'لندکروزر',   yearStart: 1996, yearEnd: 2023 as number | null, image: '/tempt/quick.jpg' },
    { carBrandId: cbId(4), name: 'آکسنت',      yearStart: 2009, yearEnd: 2022 as number | null, image: '/tempt/quick.jpg' },
    { carBrandId: cbId(4), name: 'النترا',     yearStart: 2006, yearEnd: 2023 as number | null, image: '/tempt/quick.jpg' },
    { carBrandId: cbId(4), name: 'توسان',      yearStart: 2013, yearEnd: 2023 as number | null, image: '/tempt/quick.jpg' },
    { carBrandId: cbId(5), name: 'ریو',        yearStart: 2009, yearEnd: 2022 as number | null, image: '/tempt/quick.jpg' },
    { carBrandId: cbId(5), name: 'سراتو',      yearStart: 2011, yearEnd: 2023 as number | null, image: '/tempt/quick.jpg' },
  ];
  const carModels = await prisma.$transaction(
    carModelsInput.map(m => prisma.carModel.create({ data: m })),
  );
  const cmId = (mockId: number) => carModels[mockId - 1].id;

  // ── Parts Brands ───────────────────────────────────────────────────────────
  const partsBrandsInput = [
    { name: 'بوش' },       // 1
    { name: 'ایساکو' },    // 2
    { name: 'NGK' },       // 3
    { name: 'واریان' },    // 4
    { name: 'کیان‌پارت' }, // 5
    { name: 'تکنو' },      // 6
    { name: 'مپکو' },      // 7
    { name: 'فدک' },       // 8
  ];
  const partsBrands = await prisma.$transaction(
    partsBrandsInput.map(b => prisma.partsBrand.create({ data: b })),
  );
  const pbId = (mockId: number) => partsBrands[mockId - 1].id;

  // ── Categories ─────────────────────────────────────────────────────────────
  const categoriesInput = [
    { key: 'engine',      name: 'موتور و قطعات',   image: '/logo.png', sortOrder: 1, productCount: 1284 },
    { key: 'body',        name: 'بدنه و شیشه',     image: '/logo.png', sortOrder: 2, productCount: 856  },
    { key: 'electrical',  name: 'برق و روشنایی',   image: '/logo.png', sortOrder: 3, productCount: 642  },
    { key: 'brake',       name: 'ترمز و تعلیق',    image: '/logo.png', sortOrder: 4, productCount: 524  },
    { key: 'cooling',     name: 'سیستم خنک‌کننده', image: '/logo.png', sortOrder: 5, productCount: 398  },
    { key: 'oil',         name: 'روغن و مایعات',   image: '/logo.png', sortOrder: 6, productCount: 312  },
    { key: 'accessories', name: 'لوازم جانبی',     image: '/logo.png', sortOrder: 7, productCount: 756  },
    { key: 'filter',      name: 'فیلترها',         image: '/logo.png', sortOrder: 8, productCount: 480  },
  ];
  const categories = await prisma.$transaction(
    categoriesInput.map(c => prisma.category.create({ data: c })),
  );
  const catId = (mockId: number) => categories[mockId - 1].id;

  // ── Products ───────────────────────────────────────────────────────────────
  type ProductSeed = {
    sku: string; name: string;
    pbMock: number; cmMock: number; catMock: number;
    price: number; oldPrice?: number;
    isOffer: boolean; stock: number;
    sales: number; views: number;
    rating: number; reviewCount: number;
    warranty: string; origin: string;
    pack: number; carton: number; isOriginal: boolean;
    desc?: string;
  };

  const productSeeds: ProductSeed[] = [
    { sku: 'BSH-ENG-206-001', name: 'فیلتر روغن موتور اصلی بوش',       pbMock: 1, cmMock: 1,  catMock: 1, price: 85000,                  isOffer: false, stock: 34, sales: 1240, views: 4520, rating: 4.5, reviewCount: 128, warranty: '۶ ماه',  origin: 'آلمان', pack: 1,  carton: 12, isOriginal: true,
      desc: 'فیلتر روغن موتور بوش با جدیدترین تکنولوژی‌های فیلتراسیون، آلودگی‌های ذره‌ای و میکروسکوپی موجود در روغن موتور را به طور کامل جذب می‌کند. پوشش ضدخوردگی و مقاومت در برابر دمای بالا و فشار روغن. تناوب تعویض: هر ۵٬۰۰۰ کیلومتر یا ۶ ماه.' },
    { sku: 'ISC-ENG-405-002', name: 'واتر پمپ موتور ایساکو اصلی',       pbMock: 2, cmMock: 2,  catMock: 1, price: 1150000, oldPrice: 1400000, isOffer: true,  stock: 12, sales: 340,  views: 1820, rating: 4.2, reviewCount: 43,  warranty: '۱۲ ماه', origin: 'ایران', pack: 1,  carton: 6,  isOriginal: true,
      desc: 'واتر پمپ موتور ایساکو برای خودروهای پژو ۴۰۵ طراحی شده و دارای تأییدیه‌های رسمی ایران‌خودرو است. سیستم آب‌بندی مضاعف از نشت مایع خنک‌کننده جلوگیری می‌کند. دبی آب: ۶۰ لیتر در دقیقه.' },
    { sku: 'VAR-ENG-PRA-003', name: 'کیت کلاچ کامل سه‌پارچه واریان',    pbMock: 4, cmMock: 6,  catMock: 1, price: 1200000, oldPrice: 1800000, isOffer: true,  stock: 8,  sales: 890,  views: 5240, rating: 4.6, reviewCount: 189, warranty: '۲۴ ماه', origin: 'ایران', pack: 1,  carton: 4,  isOriginal: true,
      desc: 'کیت کلاچ کامل سه‌پارچه واریان شامل صفحه کلاچ، دیسک کلاچ و بلبرینگ آزاد. مواد اصطکاکی درجه یک با قطر دیسک ۱۸۰ میلی‌متر و گشتاور انتقالی حداکثر ۱۸۰ نیوتون متر.' },
    { sku: 'BSH-ENG-SMD-004', name: 'تسمه تایم با مجموعه کامل بوش',     pbMock: 1, cmMock: 3,  catMock: 1, price: 450000,  oldPrice: 600000,  isOffer: true,  stock: 19, sales: 520,  views: 2800, rating: 4.3, reviewCount: 78,  warranty: '۱۲ ماه', origin: 'آلمان', pack: 1,  carton: 6,  isOriginal: true  },
    { sku: 'MPK-ENG-206-005', name: 'گژپین موتور استاندارد مپکو',        pbMock: 7, cmMock: 1,  catMock: 1, price: 320000,                     isOffer: false, stock: 6,  sales: 280,  views: 1540, rating: 4.1, reviewCount: 32,  warranty: '۶ ماه',  origin: 'ایران', pack: 1,  carton: 12, isOriginal: false },
    { sku: 'KYN-ENG-TBA-006', name: 'فیلتر هوای موتور کیان‌پارت',       pbMock: 5, cmMock: 7,  catMock: 1, price: 75000,                      isOffer: false, stock: 47, sales: 1580, views: 6200, rating: 4.6, reviewCount: 91,  warranty: '۶ ماه',  origin: 'ایران', pack: 1,  carton: 12, isOriginal: false },
    { sku: 'TKN-ENG-DNA-007', name: 'کمربند تایم با کیت کامل تکنو',     pbMock: 6, cmMock: 4,  catMock: 1, price: 290000,  oldPrice: 380000,  isOffer: true,  stock: 15, sales: 430,  views: 2100, rating: 4.3, reviewCount: 38,  warranty: '۱۲ ماه', origin: 'ایران', pack: 1,  carton: 6,  isOriginal: false },
    { sku: 'ISC-ENG-PRA-008', name: 'واشر سرسیلندر موتور ایساکو',        pbMock: 2, cmMock: 6,  catMock: 1, price: 580000,                     isOffer: false, stock: 0,  sales: 190,  views: 1020, rating: 4.0, reviewCount: 24,  warranty: '۶ ماه',  origin: 'ایران', pack: 1,  carton: 6,  isOriginal: true  },
    { sku: 'BSH-BRK-405-009', name: 'لنت ترمز جلو دیسکی بوش',           pbMock: 1, cmMock: 2,  catMock: 4, price: 420000,                     isOffer: false, stock: 22, sales: 720,  views: 3400, rating: 4.8, reviewCount: 74,  warranty: '۱۲ ماه', origin: 'آلمان', pack: 2,  carton: 20, isOriginal: true,
      desc: 'لنت ترمز جلو دیسکی بوش با مواد اصطکاکی پیشرفته، قدرت ترمزگیری بالا و صدای کمینه. سازگار با ECE R-90. ضخامت: ۱۵ میلی‌متر، مقاومت حرارتی تا ۵۰۰ درجه.' },
    { sku: 'VAR-BRK-SMD-010', name: 'دیسک ترمز چرخ جلو واریان',          pbMock: 4, cmMock: 3,  catMock: 4, price: 850000,  oldPrice: 1100000, isOffer: true,  stock: 11, sales: 360,  views: 2250, rating: 4.5, reviewCount: 52,  warranty: '۱۲ ماه', origin: 'ایران', pack: 1,  carton: 4,  isOriginal: false },
    { sku: 'TKN-BRK-TBA-011', name: 'کمک فنر جلو گازی تکنو',             pbMock: 6, cmMock: 7,  catMock: 4, price: 920000,  oldPrice: 1300000, isOffer: true,  stock: 7,  sales: 490,  views: 2900, rating: 4.3, reviewCount: 78,  warranty: '۱۲ ماه', origin: 'ایران', pack: 1,  carton: 4,  isOriginal: false },
    { sku: 'FDK-BRK-PRA-012', name: 'لنت ترمز عقب کفشکی فدک',            pbMock: 8, cmMock: 6,  catMock: 4, price: 185000,                     isOffer: false, stock: 38, sales: 840,  views: 4100, rating: 4.2, reviewCount: 95,  warranty: '۶ ماه',  origin: 'ایران', pack: 2,  carton: 20, isOriginal: false },
    { sku: 'KYN-BRK-SHN-013', name: 'روغن ترمز ایمنی ۵۰۰ میلی‌لیتر',    pbMock: 5, cmMock: 9,  catMock: 4, price: 95000,                      isOffer: false, stock: 25, sales: 660,  views: 3100, rating: 4.4, reviewCount: 58,  warranty: '۶ ماه',  origin: 'ایران', pack: 1,  carton: 12, isOriginal: false },
    { sku: 'NGK-ELC-206-014', name: 'شمع خودرو NGK اصلی',                pbMock: 3, cmMock: 1,  catMock: 3, price: 340000,                     isOffer: false, stock: 30, sales: 1100, views: 5500, rating: 4.4, reviewCount: 67,  warranty: '۱۲ ماه', origin: 'ژاپن',  pack: 4,  carton: 40, isOriginal: true,
      desc: 'شمع خودرو NGK اصلی با فناوری الکترود ایریدیوم. احتراق بهتر، مصرف کمتر سوخت. فاصله الکترود: ۱.۱ میلی‌متر، رزوه: M14×1.25.' },
    { sku: 'BSH-ELC-405-015', name: 'دلکو کامل برق بوش',                 pbMock: 1, cmMock: 2,  catMock: 3, price: 2100000, oldPrice: 2800000, isOffer: true,  stock: 4,  sales: 210,  views: 1380, rating: 4.5, reviewCount: 67,  warranty: '۲۴ ماه', origin: 'آلمان', pack: 1,  carton: 4,  isOriginal: true  },
    { sku: 'BSH-ELC-SMD-016', name: 'سنسور اکسیژن لامبدا بوش',            pbMock: 1, cmMock: 3,  catMock: 3, price: 680000,  oldPrice: 950000,  isOffer: true,  stock: 9,  sales: 380,  views: 2100, rating: 4.4, reviewCount: 56,  warranty: '۱۲ ماه', origin: 'آلمان', pack: 1,  carton: 6,  isOriginal: true  },
    { sku: 'TKN-ELC-DNA-017', name: 'باتری ۶۰ آمپر تکنو',                pbMock: 6, cmMock: 4,  catMock: 3, price: 1850000,                    isOffer: false, stock: 14, sales: 570,  views: 3400, rating: 4.6, reviewCount: 83,  warranty: '۲۴ ماه', origin: 'ایران', pack: 1,  carton: 4,  isOriginal: false },
    { sku: 'MPK-ELC-SNA-018', name: 'چراغ جلو دو چشم کامل مپکو',         pbMock: 7, cmMock: 8,  catMock: 3, price: 1200000, oldPrice: 1600000, isOffer: true,  stock: 6,  sales: 290,  views: 1750, rating: 4.1, reviewCount: 29,  warranty: '۱۲ ماه', origin: 'ایران', pack: 1,  carton: 4,  isOriginal: false },
    { sku: 'ISC-CLN-PRA-019', name: 'رادیاتور آب کامل ایساکو',            pbMock: 2, cmMock: 6,  catMock: 5, price: 1450000, oldPrice: 1900000, isOffer: true,  stock: 5,  sales: 220,  views: 1580, rating: 4.7, reviewCount: 34,  warranty: '۱۲ ماه', origin: 'ایران', pack: 1,  carton: 4,  isOriginal: true  },
    { sku: 'KYN-CLN-206-020', name: 'ترموستات خنک‌کننده کیان‌پارت',       pbMock: 5, cmMock: 1,  catMock: 5, price: 180000,                     isOffer: false, stock: 28, sales: 480,  views: 2400, rating: 4.3, reviewCount: 48,  warranty: '۶ ماه',  origin: 'ایران', pack: 1,  carton: 12, isOriginal: false },
    { sku: 'FDK-CLN-SMD-021', name: 'شیلنگ رادیاتور بالایی فدک',          pbMock: 8, cmMock: 3,  catMock: 5, price: 95000,                      isOffer: false, stock: 41, sales: 680,  views: 3200, rating: 4.0, reviewCount: 62,  warranty: '۶ ماه',  origin: 'ایران', pack: 1,  carton: 12, isOriginal: false },
    { sku: 'TKN-CLN-TBA-022', name: 'پنکه رادیاتور برقی تکنو',            pbMock: 6, cmMock: 7,  catMock: 5, price: 750000,  oldPrice: 980000,  isOffer: true,  stock: 10, sales: 310,  views: 1950, rating: 4.4, reviewCount: 37,  warranty: '۱۲ ماه', origin: 'ایران', pack: 1,  carton: 4,  isOriginal: false },
    { sku: 'BSH-OIL-206-023', name: 'روغن موتور ۴ لیتری ۵W40 بوش',       pbMock: 1, cmMock: 1,  catMock: 6, price: 580000,                     isOffer: false, stock: 60, sales: 2350, views: 8900, rating: 4.7, reviewCount: 215, warranty: '۶ ماه',  origin: 'آلمان', pack: 1,  carton: 6,  isOriginal: true,
      desc: 'روغن موتور ۴ لیتری بوش ویسکوزیته 5W-40 برای موتورهای بنزینی و دیزلی مدرن. استاندارد API SN Plus / CF. کاهش سایش و بهبود عملکرد. فاصله تعویض: ۱۰٬۰۰۰ کیلومتر یا ۱ سال.' },
    { sku: 'KYN-OIL-DNA-024', name: 'روغن گیربکس اتوماتیک کیان‌پارت',     pbMock: 5, cmMock: 4,  catMock: 6, price: 420000,  oldPrice: 560000,  isOffer: true,  stock: 33, sales: 560,  views: 2800, rating: 4.4, reviewCount: 89,  warranty: '۶ ماه',  origin: 'ایران', pack: 1,  carton: 6,  isOriginal: false },
    { sku: 'MPK-OIL-SHN-025', name: 'گریس چرخ ۵ کیلوگرمی مپکو',           pbMock: 7, cmMock: 9,  catMock: 6, price: 310000,                     isOffer: false, stock: 17, sales: 190,  views: 980,  rating: 4.2, reviewCount: 28,  warranty: '۶ ماه',  origin: 'ایران', pack: 1,  carton: 6,  isOriginal: false },
    { sku: 'NGK-OIL-SNA-026', name: 'مایع ترمز DOT4 اصلی NGK',            pbMock: 3, cmMock: 8,  catMock: 6, price: 125000,                     isOffer: false, stock: 44, sales: 820,  views: 4100, rating: 4.5, reviewCount: 72,  warranty: '۶ ماه',  origin: 'ژاپن',  pack: 1,  carton: 12, isOriginal: true  },
    { sku: 'TKN-BDY-405-027', name: 'برف‌پاک‌کن جلو کامل تکنو',           pbMock: 6, cmMock: 2,  catMock: 2, price: 185000,  oldPrice: 280000,  isOffer: true,  stock: 23, sales: 740,  views: 4500, rating: 4.2, reviewCount: 112, warranty: '۶ ماه',  origin: 'ایران', pack: 1,  carton: 12, isOriginal: false },
    { sku: 'ISC-BDY-PRA-028', name: 'آینه بغل چپ کامل ایساکو',             pbMock: 2, cmMock: 6,  catMock: 2, price: 650000,                     isOffer: false, stock: 9,  sales: 430,  views: 2300, rating: 4.3, reviewCount: 45,  warranty: '۱۲ ماه', origin: 'ایران', pack: 1,  carton: 4,  isOriginal: true  },
    { sku: 'VAR-BDY-SMD-029', name: 'گلگیر جلو اصلی واریان',               pbMock: 4, cmMock: 3,  catMock: 2, price: 980000,  oldPrice: 1300000, isOffer: true,  stock: 4,  sales: 180,  views: 1200, rating: 4.1, reviewCount: 23,  warranty: '۱۲ ماه', origin: 'ایران', pack: 1,  carton: 4,  isOriginal: false },
    { sku: 'FDK-BDY-TBA-030', name: 'شیشه جلو اتاق STD فدک',               pbMock: 8, cmMock: 7,  catMock: 2, price: 2400000,                    isOffer: false, stock: 0,  sales: 95,   views: 780,  rating: 4.0, reviewCount: 12,  warranty: '۶ ماه',  origin: 'ایران', pack: 1,  carton: 2,  isOriginal: false },
    { sku: 'BSH-FLT-DNA-031', name: 'فیلتر کابین تهویه هوا بوش',           pbMock: 1, cmMock: 4,  catMock: 8, price: 120000,  oldPrice: 180000,  isOffer: true,  stock: 52, sales: 1050, views: 5200, rating: 4.6, reviewCount: 88,  warranty: '۶ ماه',  origin: 'آلمان', pack: 1,  carton: 12, isOriginal: true  },
    { sku: 'KYN-FLT-206-032', name: 'فیلتر بنزین موتور کیان‌پارت',         pbMock: 5, cmMock: 1,  catMock: 8, price: 85000,                      isOffer: false, stock: 37, sales: 880,  views: 4300, rating: 4.3, reviewCount: 65,  warranty: '۶ ماه',  origin: 'ایران', pack: 1,  carton: 12, isOriginal: false },
    { sku: 'MPK-FLT-SHN-033', name: 'فیلتر روغن کلاچ مپکو',                pbMock: 7, cmMock: 9,  catMock: 8, price: 65000,                      isOffer: false, stock: 20, sales: 420,  views: 2100, rating: 4.1, reviewCount: 34,  warranty: '۶ ماه',  origin: 'ایران', pack: 1,  carton: 12, isOriginal: false },
    { sku: 'NGK-FLT-SNA-034', name: 'فیلتر گازوئیل دیزل NGK',              pbMock: 3, cmMock: 8,  catMock: 8, price: 145000,  oldPrice: 200000,  isOffer: true,  stock: 16, sales: 310,  views: 1580, rating: 4.5, reviewCount: 41,  warranty: '۶ ماه',  origin: 'ژاپن',  pack: 1,  carton: 12, isOriginal: true  },
  ];

  const products = await prisma.$transaction(
    productSeeds.map(s =>
      prisma.product.create({
        data: {
          sku:           s.sku,
          name:          s.name,
          partsBrandId:  pbId(s.pbMock),
          categoryId:    catId(s.catMock),
          basePrice:     BigInt(s.price),
          oldPrice:      s.oldPrice ? BigInt(s.oldPrice) : null,
          isOffer:       s.isOffer,
          stock:         s.stock,
          saleCount:     s.sales,
          viewCount:     s.views,
          ratingAvg:     s.rating,
          reviewCount:   s.reviewCount,
          warranty:      s.warranty,
          origin:        s.origin,
          packQuantity:  s.pack,
          cartonQuantity: s.carton,
          isOriginal:    s.isOriginal,
          mainImage:     '/logo.png',
          description:   s.desc ?? null,
          isActive:      true,
        },
      }),
    ),
  );

  // ── Product Compatibilities ────────────────────────────────────────────────
  await prisma.productCompatibility.createMany({
    data: productSeeds.map((s, i) => ({
      productId:  products[i].id,
      carModelId: cmId(s.cmMock),
    })),
  });

  // ── Nav Links ──────────────────────────────────────────────────────────────
  await prisma.navLink.createMany({
    data: [
      { href: '/',            label: 'خانه',         sortOrder: 1 },
      { href: '/products',    label: 'همه محصولات',  sortOrder: 2 },
      { href: '/products?category=engine',      label: 'قطعات موتوری', sortOrder: 3 },
      { href: '/products?category=body',        label: 'بدنه خودرو',   sortOrder: 4 },
      { href: '/products?category=electrical',  label: 'برق خودرو',    sortOrder: 5 },
      { href: '/faq',         label: 'سوالات متداول', sortOrder: 6 },
      { href: '/contact',     label: 'تماس با ما',   sortOrder: 7 },
    ],
  });

  // ── Shipping Options ───────────────────────────────────────────────────────
  await prisma.shippingOption.createMany({
    data: [
      { method: ShippingMethod.STANDARD, label: 'ارسال عادی (پست)',   description: 'تحویل در ۳ تا ۵ روز کاری', cost: BigInt(120_000), isActive: true },
      { method: ShippingMethod.EXPRESS,  label: 'ارسال اکسپرس',       description: 'تحویل در ۱ تا ۲ روز کاری', cost: BigInt(350_000), isActive: true },
    ],
  });

  // ── Users ──────────────────────────────────────────────────────────────────
  await prisma.user.create({
    data: {
      id: 'usr_001', phoneNumber: '09121234567',
      firstName: 'علی', lastName: 'محمدی',
      role: UserRole.RETAIL, isVerified: true,
      createdAt: new Date('2024-01-15T10:00:00.000Z'),
      addresses: {
        create: { cityId: cityId.get('تهران')!, street: 'خیابان ولیعصر، پلاک ۱۲۴، واحد ۳', postalCode: '1411873563', isDefault: true },
      },
    },
  });
  await prisma.user.create({
    data: {
      id: 'usr_002', phoneNumber: '09351112233',
      firstName: 'فاطمه', lastName: 'حسینی',
      role: UserRole.RETAIL, isVerified: true,
      createdAt: new Date('2024-02-20T12:30:00.000Z'),
      addresses: {
        create: { cityId: cityId.get('اصفهان')!, street: 'خیابان چهارباغ، کوچه رضوی، پلاک ۷', postalCode: '8174793651', isDefault: true },
      },
    },
  });

  const p = (i: number) => products[i - 1].id; // 1-based mock index → DB id

  // ── Carts & cart items (mirrors initialCartItems from cartMockData.ts) ──────
  await prisma.cart.create({
    data: {
      userId: 'usr_001',
      items: {
        createMany: {
          data: [
            { productId: p(1),  quantity: 2 }, // فیلتر روغن موتور بوش
            { productId: p(9),  quantity: 1 }, // لنت ترمز جلو بوش
            { productId: p(14), quantity: 4 }, // شمع NGK
            { productId: p(4),  quantity: 1 }, // تسمه تایم بوش
          ],
        },
      },
    },
  });
  await prisma.cart.create({
    data: {
      userId: 'usr_002',
      items: {
        createMany: {
          data: [
            { productId: p(23), quantity: 1 }, // روغن موتور ۴ لیتری بوش
            { productId: p(31), quantity: 2 }, // فیلتر کابین بوش
          ],
        },
      },
    },
  });

  // ── Reviews ────────────────────────────────────────────────────────────────
  await prisma.review.createMany({
    data: [
      { productId: p(1),  authorName: 'محمد رضایی',   rating: 5, text: 'کیفیت عالی، کاملاً اصل، موتورم بعد از نصب روان‌تر کار می‌کنه.',          isVerifiedPurchase: true  },
      { productId: p(1),  authorName: 'علی احمدی',    rating: 4, text: 'محصول خوبی هست ولی کمی گران‌قیمت. بسته‌بندی عالی بود.',                   isVerifiedPurchase: true  },
      { productId: p(1),  authorName: 'سارا کریمی',   rating: 5, text: 'دقیقاً همون چیزی که نیاز داشتم. سریع ارسال شد.',                          isVerifiedPurchase: false },
      { productId: p(2),  authorName: 'حسین محمدی',   rating: 4, text: 'بعد از نصب خودروم به درستی خنک می‌شه. نصب آسون بود.',                     isVerifiedPurchase: true  },
      { productId: p(2),  authorName: 'فاطمه نظری',   rating: 5, text: 'محصول اصل ایساکو، قیمت مناسب با تخفیف خوب.',                              isVerifiedPurchase: true  },
      { productId: p(3),  authorName: 'امیر تهرانی',  rating: 5, text: 'کیفیت فوق‌العاده! بعد از نصب احساس می‌کنم ماشین نو شده.',                  isVerifiedPurchase: true  },
      { productId: p(3),  authorName: 'رضا اکبری',    rating: 4, text: 'کیت کامل با همه قطعات اومد. نصب توسط تعمیرگاه انجام شد.',                 isVerifiedPurchase: true  },
      { productId: p(3),  authorName: 'مهدی شیرازی',  rating: 5, text: 'بسته‌بندی خوب، قطعات اصل، ارسال سریع.',                                   isVerifiedPurchase: false },
      { productId: p(9),  authorName: 'نادر قاسمی',   rating: 5, text: 'بهترین لنتی که تا حالا خریدم. ترمز عالی و بدون صدا.',                      isVerifiedPurchase: true  },
      { productId: p(9),  authorName: 'لیلا صادقی',   rating: 4, text: 'لنت بوش اصل. کیفیت خوب. قیمت مناسب.',                                     isVerifiedPurchase: true  },
      { productId: p(14), authorName: 'کیوان موسوی',  rating: 5, text: 'شمع اصل NGK. بعد از نصب مصرف بنزین کمتر شد.',                             isVerifiedPurchase: true  },
      { productId: p(14), authorName: 'پریسا علوی',   rating: 4, text: 'بسته‌بندی اصل، سریع ارسال شد، کیفیت عالی.',                               isVerifiedPurchase: false },
      { productId: p(14), authorName: 'داوود کمالی',  rating: 5, text: 'NGK همیشه بهترین بوده. توصیه می‌کنم.',                                    isVerifiedPurchase: true  },
      { productId: p(23), authorName: 'بهروز منصوری', rating: 5, text: 'روغن اصل بوش. موتور بعد از تعویض خیلی روان شد.',                           isVerifiedPurchase: true  },
      { productId: p(23), authorName: 'زینب حیدری',   rating: 5, text: 'قیمت مناسب، سریع ارسال شد. رضایت کامل.',                                  isVerifiedPurchase: true  },
      { productId: p(23), authorName: 'مجتبی فراهانی', rating: 4, text: 'خوب بود ولی دیر رسید. کیفیت روغن ایده‌آل.',                              isVerifiedPurchase: false },
    ],
  });

  console.log('Seed complete:');
  console.log(`  ${provinces.length} provinces, ${cities.length} cities`);
  console.log(`  ${carBrands.length} car brands, ${carModels.length} car models`);
  console.log(`  ${partsBrands.length} parts brands, ${categories.length} categories`);
  console.log(`  ${products.length} products`);
  console.log(`  8 nav links, 2 shipping options`);
  console.log(`  2 users, 2 carts (6 cart items), 16 reviews`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
