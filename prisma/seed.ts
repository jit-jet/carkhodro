import 'dotenv/config';
import { PrismaClient, UserRole } from '../generated/prisma_client';
import { PrismaPg } from '@prisma/adapter-pg';
import { normalizePersianText } from '../src/lib/persian';
import { hashPassword } from '../src/lib/password';
import { DEFAULT_RULES_CONTENT } from '../src/lib/rules-defaults';
import {
  encryptSystemConfig,
  type SystemConfig,
} from '../src/lib/system-settings-crypto';
import provincesCitiesData from '../src/assets/provinces_cities.json';

const prisma = new PrismaClient({
  adapter: new PrismaPg(process.env.DATABASE_URL!),
});

type ProvinceCityRow = {
  provinceId: string;
  provinceName: string;
  cityId: string;
  cityName: string;
};

type SeedProvincesAndCitiesResult = {
  provinceCount: number;
  cityCount: number;
  /** Keyed by `province__city` — only populated when `buildCityIdMap` is true. */
  cityId: Map<string, number>;
};

async function seedProvincesAndCitiesFromJson(
  options: { buildCityIdMap?: boolean } = {},
): Promise<SeedProvincesAndCitiesResult> {
  const { buildCityIdMap = true } = options;
  // Normalize Arabic-script variants (ي/ك etc.) in the source data so seeded
  // names match the Persian forms used everywhere else in the app.
  //
  // Three provinces are written in the JSON with the conjunction «و» glued to the
  // next word ("سیستان وبلوچستان"); the conventional spaced form ("سیستان و
  // بلوچستان") is used everywhere else. `normalizePersianText` collapses runs of
  // whitespace but never inserts one, so the fix is an explicit map for just
  // these three names.
  const PROVINCE_NAME_FIXUPS: Record<string, string> = {
    'چهارمحال وبختیاری': 'چهارمحال و بختیاری',
    'سیستان وبلوچستان': 'سیستان و بلوچستان',
    'کهگیلویه وبویراحمد': 'کهگیلویه و بویراحمد',
  };
  const canonicalProvince = (name: string) => PROVINCE_NAME_FIXUPS[name] ?? name;

  const provinceCityMap = new Map<string, Set<string>>();
  for (const row of provincesCitiesData as ProvinceCityRow[]) {
    const provinceName = canonicalProvince(normalizePersianText(row.provinceName));
    const cityName = normalizePersianText(row.cityName);

    if (!provinceCityMap.has(provinceName)) provinceCityMap.set(provinceName, new Set());
    provinceCityMap.get(provinceName)!.add(cityName);
  }

  const provinceNames = [...provinceCityMap.keys()];

  // Provinces
  await prisma.province.createMany({
    data: provinceNames.map(name => ({ name })),
    skipDuplicates: true,
  });

  const provinces = await prisma.province.findMany({
    where: { name: { in: provinceNames } },
    select: { id: true, name: true },
  });

  const provinceIdByName = new Map(provinces.map(p => [p.name, p.id]));
  const missingProvinceNames = provinceNames.filter(name => !provinceIdByName.has(name));
  if (missingProvinceNames.length > 0) {
    throw new Error(`Failed to resolve province ids for: ${missingProvinceNames.join(', ')}`);
  }

  // Cities (FK: city.provinceId → province.id)
  const cityRowsInput = provinceNames.flatMap(provinceName =>
    [...provinceCityMap.get(provinceName)!].map(cityName => ({
      provinceId: provinceIdByName.get(provinceName)!,
      name: cityName,
    })),
  );

  await prisma.city.createMany({
    data: cityRowsInput,
    skipDuplicates: true,
  });

  const cityId = new Map<string, number>();
  if (buildCityIdMap) {
    const provinceIds = provinces.map(p => p.id);
    const cities = await prisma.city.findMany({
      where: { provinceId: { in: provinceIds } },
      select: { id: true, name: true, provinceId: true },
    });

    const provinceNameById = new Map(provinces.map(p => [p.id, p.name]));
    for (const c of cities) {
      const provinceName = provinceNameById.get(c.provinceId);
      if (!provinceName) continue;
      cityId.set(`${provinceName}__${c.name}`, c.id);
    }
  }

  return {
    provinceCount: provinceNames.length,
    cityCount: cityRowsInput.length,
    cityId,
  };
}

async function main() {
  // ── FAQs (idempotent) ──────────────────────────────────────────────────────
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
      ],
    });
    console.log('  5 FAQs seeded.');
  }

  // Keep Province/City reference data in sync with `provinces_cities.json`.
  const seedResult = await seedProvincesAndCitiesFromJson({ buildCityIdMap: false });

  const carBrandCount = await prisma.carBrand.count();
  if (carBrandCount > 0) {
    console.log(`Already seeded (${carBrandCount} car brands). Skipping catalogue.`);
  } else {
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
      { timeout: 30000 },
    );
    // keyed by 1-based position matching mock carBrandId
    const cbId = (mockId: number) => carBrands[mockId - 1].id;

    // ── Car Models ─────────────────────────────────────────────────────────────
    const carModelsInput = [
      { carBrandId: cbId(1), name: 'پژو ۲۰۶',   image: '/tempt/quick.jpg' },
      { carBrandId: cbId(1), name: 'پژو ۴۰۵',   image: '/tempt/quick.jpg' },
      { carBrandId: cbId(1), name: 'سمند',       image: '/tempt/quick.jpg' },
      { carBrandId: cbId(1), name: 'دنا',        image: '/tempt/quick.jpg' },
      { carBrandId: cbId(1), name: 'پارس',       image: '/tempt/quick.jpg' },
      { carBrandId: cbId(2), name: 'پراید',      image: '/tempt/quick.jpg' },
      { carBrandId: cbId(2), name: 'تیبا',       image: '/tempt/quick.jpg' },
      { carBrandId: cbId(2), name: 'ساینا',      image: '/tempt/quick.jpg' },
      { carBrandId: cbId(2), name: 'شاهین',      image: '/tempt/quick.jpg' },
      { carBrandId: cbId(3), name: 'کرولا',      image: '/tempt/quick.jpg' },
      { carBrandId: cbId(3), name: 'کمری',       image: '/tempt/quick.jpg' },
      { carBrandId: cbId(3), name: 'لندکروزر',   image: '/tempt/quick.jpg' },
      { carBrandId: cbId(4), name: 'آکسنت',      image: '/tempt/quick.jpg' },
      { carBrandId: cbId(4), name: 'النترا',     image: '/tempt/quick.jpg' },
      { carBrandId: cbId(4), name: 'توسان',      image: '/tempt/quick.jpg' },
      { carBrandId: cbId(5), name: 'ریو',        image: '/tempt/quick.jpg' },
      { carBrandId: cbId(5), name: 'سراتو',      image: '/tempt/quick.jpg' },
    ];
    const carModels = await prisma.$transaction(
      carModelsInput.map(m => prisma.carModel.create({ data: m })),
      { timeout: 30000 },
    );

    // ── Parts Brands ───────────────────────────────────────────────────────────
    const partsBrandsInput = [
      { name: 'بوش',       slug: 'bosch' },
      { name: 'ایساکو',    slug: 'isaco' },
      { name: 'NGK',       slug: 'ngk' },
      { name: 'واریان',    slug: 'varian' },
      { name: 'کیان‌پارت', slug: 'kian-part' },
      { name: 'تکنو',      slug: 'techno' },
      { name: 'مپکو',      slug: 'mapco' },
      { name: 'فدک',       slug: 'fadak' },
    ];
    const partsBrands = await prisma.$transaction(
      partsBrandsInput.map(b => prisma.partsBrand.create({ data: b })),
      { timeout: 30000 },
    );

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
      { timeout: 30000 },
    );

    // ── Nav Links ──────────────────────────────────────────────────────────────
    await prisma.navLink.createMany({
      data: [
        { href: '/',            label: 'خانه',         sortOrder: 1 },
        { href: '/products',    label: 'همه محصولات',  sortOrder: 2 },
        { href: '/products?category=engine',      label: 'قطعات موتوری', sortOrder: 3 },
        { href: '/products?category=body',        label: 'بدنه خودرو',   sortOrder: 4 },
        { href: '/products?category=electrical',  label: 'برق خودرو',    sortOrder: 5 },
        { href: '/blog',        label: 'وبلاگ',          sortOrder: 6 },
        { href: '/faq',         label: 'سوالات متداول', sortOrder: 7 },
        { href: '/contact',     label: 'تماس با ما',   sortOrder: 8 },
      ],
    });

    // ── Site Settings & Social Links ───────────────────────────────────────────
    await prisma.siteSetting.upsert({
      where: { id: 1 },
      create: {
        id: 1,
        retailPhone1: '۰۲۱-۸۸۱۲۳۴۵۶',
        retailPhone2: '۰۲۱-۸۸۶۵۴۳۲۱',
        wholesalePhone1: '۰۲۱-۹۱۰۱۲۳۴۵',
        wholesalePhone2: '۰۲۱-۹۱۰۱۲۳۴۶',
        wholesalePhone3: '۰۲۱-۹۱۰۱۲۳۴۷',
        wholesalePhone4: '۰۲۱-۹۱۰۱۲۳۴۸',
        email: 'info@carkhodro.com',
        address: 'تهران، خیابان ولیعصر\nبالاتر از میدان ونک، پلاک ۲۴۱',
        workingHours: 'شنبه تا چهارشنبه: ۸ تا ۲۰\nپنجشنبه: ۸ تا ۱۴',
        headerPromo1: 'ضمانت اصالت کالا',
        headerPromo2: 'ارسال سریع به سراسر کشور',
        aboutText: 'بزرگترین فروشگاه آنلاین قطعات یدکی خودروهای ایرانی و خارجی با بیش از ۵۰,۰۰۰ قطعه اصل و ضمانت اصالت کالا.',
        footerTrust1Icon: '🛡️',
        footerTrust1Title: 'ضمانت اصالت کالا',
        footerTrust1Desc: 'تمام محصولات اصلی',
        footerTrust2Icon: '🚚',
        footerTrust2Title: 'ارسال سریع',
        footerTrust2Desc: 'به سراسر کشور',
        footerTrust3Icon: '↩️',
        footerTrust3Title: 'بازگشت آسان',
        footerTrust3Desc: 'تا ۷ روز ضمانت برگشت',
        footerTrust4Icon: '🎧',
        footerTrust4Title: 'پشتیبانی ۲۴/۷',
        footerTrust4Desc: 'همیشه در کنار شما',
        heroTitle: 'بهترین قیمت قطعات یدکی خودروهای ایرانی و خارجی',
        heroDescription:
          'بیش از ۵۰,۰۰۰ قطعه اصل و درجه یک با ضمانت اصالت کالا و ارسال سریع به سراسر کشور.',
        heroButton1Text: 'مشاهده محصولات',
        heroButton1Href: '/products',
        heroButton2Text: 'جستجو بر اساس خودرو',
        heroButton2Href: '/products',
        siteName: 'کارخودرو',
        logoUrl: '/logo.png',
        metaTitle: 'کارخودرو | فروشگاه قطعات یدکی خودرو',
        metaDescription:
          'خرید آنلاین قطعات یدکی خودروهای ایرانی و خارجی با بهترین قیمت و ضمانت اصالت کالا',
        copyrightText: '© ۱۴۰۳ کارخودرو — تمامی حقوق محفوظ است.',
        invoiceSeller: {
          brandName: 'کارخودرو',
          storeName: 'فروشگاه قطعات خودرو شاه گل',
          website: 'WWW.CARKHODRO.IR',
          websiteUrl: 'https://carkhodro.ir',
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
        },
      },
      update: {},
    });

    await prisma.rulesContent.upsert({
      where: { id: 1 },
      create: {
        id: 1,
        updatedLabel: DEFAULT_RULES_CONTENT.updatedLabel,
        intro: DEFAULT_RULES_CONTENT.intro,
        body: DEFAULT_RULES_CONTENT.body,
      },
      update: {},
    });

    await prisma.socialLink.createMany({
      data: [
        { label: 'اینستاگرام', url: 'https://instagram.com/carkhodro', icon: 'instagram', sortOrder: 0 },
        { label: 'تلگرام', url: 'https://t.me/carkhodro', icon: 'telegram', sortOrder: 1 },
        { label: 'واتساپ', url: 'https://wa.me/989121234567', icon: 'whatsapp', sortOrder: 2 },
      ],
    });

    await prisma.heroBanner.create({
      data: {
        imageUrl: '/tranrse-car.png',
        sortOrder: 0,
        isActive: true,
      },
    });

    console.log('Seed complete:');
    console.log(`  ${seedResult.provinceCount} provinces, ${seedResult.cityCount} cities`);
    console.log(`  ${carBrands.length} car brands, ${carModels.length} car models`);
    console.log(`  ${partsBrands.length} parts brands, ${categories.length} categories`);
    console.log('  nav links, site settings, rules, social links, hero banners');
  }

  await seedShippingOptions();
  await seedAdminUser();
  await seedSystemSettings();
}

/**
 * Default retail shipping methods. Wholesale invoice flow looks up STANDARD by
 * code; checkout lists active options. Idempotent upserts by `method`.
 */
async function seedShippingOptions() {
  const defaults = [
    {
      method: 'STANDARD',
      label: 'ارسال عادی',
      description: '۳ تا ۵ روز کاری',
      cost: BigInt(50_000),
      isActive: true,
    },
    {
      method: 'EXPRESS',
      label: 'ارسال سریع',
      description: '۱ تا ۲ روز کاری',
      cost: BigInt(120_000),
      isActive: true,
    },
  ] as const;

  for (const row of defaults) {
    await prisma.shippingOption.upsert({
      where: { method: row.method },
      create: { ...row },
      update: {},
    });
  }
  console.log('  Shipping options seeded (STANDARD, EXPRESS).');
}

/**
 * Creates the initial `/admin` login — an ADMIN-role `User` with a password
 * hash. Reads credentials from `ADMIN_SEED_USERNAME` / `ADMIN_SEED_PASSWORD`
 * (see `.env.example`) so no password ever lands in source control. Idempotent:
 * skips if an admin with that username already exists.
 */
async function seedAdminUser() {
  const username = process.env.ADMIN_SEED_USERNAME;
  const password = process.env.ADMIN_SEED_PASSWORD;
  if (!username || !password) {
    console.warn('  Skipping admin seed — set ADMIN_SEED_USERNAME/ADMIN_SEED_PASSWORD in .env.');
    return;
  }

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    if (existing.role === UserRole.ADMIN && !existing.isSuperAdmin) {
      await prisma.user.update({ where: { id: existing.id }, data: { isSuperAdmin: true } });
    }
    console.log(`  Admin login already exists for ${username}. Skipping.`);
    return;
  }

  const legacyAdmin = await prisma.user.findFirst({
    where: { role: UserRole.ADMIN, username: null },
  });
  if (legacyAdmin) {
    await prisma.user.update({
      where: { id: legacyAdmin.id },
      data: { username, isSuperAdmin: true },
    });
    console.log(`  Admin username set to ${username} for existing admin (/admin/login).`);
    return;
  }

  const passwordHash = await hashPassword(password);
  await prisma.user.create({
    data: {
      // `phoneNumber` is required on User but unused for admin login.
      phoneNumber: '09000000000',
      username,
      firstName: 'مدیر',
      lastName: 'سیستم',
      role: UserRole.ADMIN,
      isVerified: true,
      passwordHash,
      isSuperAdmin: true,
    },
  });
  console.log(`  Admin login created for ${username} (/admin/login).`);
}

/**
 * Bootstrap encrypted System Settings from `.env`. This is create-only:
 * subsequent seed runs never overwrite values managed from the admin panel.
 */
async function seedSystemSettings() {
  const existing = await prisma.systemSetting.findUnique({
    where: { id: 1 },
    select: { id: true },
  });
  if (existing) {
    console.log('  System settings already exist. Skipping environment defaults.');
    return;
  }

  if (!process.env.SYSTEM_SETTINGS_ENCRYPTION_KEY?.trim()) {
    console.warn('  Skipping system settings seed — SYSTEM_SETTINGS_ENCRYPTION_KEY is not set.');
    return;
  }

  const config: SystemConfig = {
    smsApiBaseUrl: process.env.SMS_API_BASE_URL?.trim() || 'https://api.iranpayamak.com',
    smsApiKey: process.env.SMS_API_KEY?.trim() || '',
    smsLineNumber: process.env.SMS_LINE_NUMBER?.trim() || '',
    smsOtpPatternCode: process.env.SMS_OTP_PATTERN_CODE?.trim() || '',
    smsOtpPatternAttr: process.env.SMS_OTP_PATTERN_ATTR?.trim() || 'code',
    hesabfaApiUrl: process.env.HESABFA_API_URL?.trim() || 'https://api.hesabfa.com/v1',
    hesabfaApiKey: process.env.HESABFA_API_KEY?.trim() || '',
    hesabfaLoginToken: process.env.HESABFA_LOGIN_TOKEN?.trim() || '',
    hesabfaBankCode: process.env.HESABFA_BANK_CODE?.trim() || '',
    zibalMerchant: process.env.ZIBAL_MERCHANT?.trim() || 'zibal',
  };
  const superAdmin = await prisma.user.findFirst({
    where: { role: UserRole.ADMIN, isSuperAdmin: true },
    select: { id: true },
  });

  await prisma.systemSetting.create({
    data: {
      id: 1,
      encryptedConfig: encryptSystemConfig(config),
      updatedById: superAdmin?.id ?? null,
    },
  });
  console.log('  System settings seeded from environment defaults (encrypted).');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
