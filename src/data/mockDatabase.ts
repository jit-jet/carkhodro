/**
 * Normalized relational mock database.
 *
 * Schema conventions:
 *   Primary keys : id: number
 *   Foreign keys : <entity>Id: number  →  <entity>.id
 *   Denormalized counters (productCount, etc.) are acceptable on lookup tables
 *   for display purposes and are annotated accordingly.
 *
 * Production note: productRows.carModelId is 1-to-1 here for simplicity.
 *   Real schema needs a junction table: product_compatibility(productId, carModelId)
 *   because one part can fit multiple car models.
 */

const IMG = '/logo.png';

// ── TABLE: carBrands ─────────────────────────────────────────────────────────
// Automobile manufacturers (ایران‌خودرو, سایپا, تویوتا, …)

export interface CarBrand {
  id: number;
  name: string;
  logoImage: string;
  productCount: number; // denormalized display counter
}

export const carBrands: CarBrand[] = [
  { id: 1,  name: 'ایران خودرو', logoImage: '/tempt/ezam.webp', productCount: 4520 },
  { id: 2,  name: 'سایپا',       logoImage: '/tempt/ezam.webp', productCount: 3210 },
  { id: 3,  name: 'تویوتا',      logoImage: '/tempt/ezam.webp', productCount: 2840 },
  { id: 4,  name: 'هیوندای',     logoImage: '/tempt/ezam.webp', productCount: 2150 },
  { id: 5,  name: 'کیا',         logoImage: '/tempt/ezam.webp', productCount: 1980 },
  { id: 6,  name: 'نیسان',       logoImage: '/tempt/ezam.webp', productCount: 1750 },
  { id: 7,  name: 'مزدا',        logoImage: '/tempt/ezam.webp', productCount: 1340 },
  { id: 8,  name: 'بی‌ام‌و',    logoImage: '/tempt/ezam.webp', productCount: 2100 },
  { id: 9,  name: 'مرسدس',       logoImage: '/tempt/ezam.webp', productCount: 1890 },
  { id: 10, name: 'پژو',         logoImage: '/tempt/ezam.webp', productCount: 3200 },
  { id: 11, name: 'رنو',         logoImage: '/tempt/ezam.webp', productCount: 2100 },
  { id: 12, name: 'فولکس',       logoImage: '/tempt/ezam.webp', productCount: 1560 },
];

// ── TABLE: carModels ─────────────────────────────────────────────────────────
// Specific car models — FK carBrandId → carBrands.id

export interface CarModel {
  id: number;
  carBrandId: number; // FK → carBrands.id
  name: string;
  years: string;
  image: string;
}

export const carModels: CarModel[] = [
  // ایران خودرو (brandId 1)
  { id: 1,  carBrandId: 1, name: 'پژو ۲۰۶',    years: '۱۳۸۰ - ۱۴۰۲', image: '/tempt/quick.jpg' },
  { id: 2,  carBrandId: 1, name: 'پژو ۴۰۵',    years: '۱۳۷۰ - ۱۴۰۲', image: '/tempt/quick.jpg' },
  { id: 3,  carBrandId: 1, name: 'سمند',        years: '۱۳۸۱ - ۱۴۰۲', image: '/tempt/quick.jpg' },
  { id: 4,  carBrandId: 1, name: 'دنا',         years: '۱۳۹۱ - ۱۴۰۲', image: '/tempt/quick.jpg' },
  { id: 5,  carBrandId: 1, name: 'پارس',        years: '۱۳۷۷ - ۱۴۰۱', image: '/tempt/quick.jpg' },
  // سایپا (brandId 2)
  { id: 6,  carBrandId: 2, name: 'پراید',       years: '۱۳۶۸ - ۱۴۰۰', image: '/tempt/quick.jpg' },
  { id: 7,  carBrandId: 2, name: 'تیبا',        years: '۱۳۸۹ - ۱۴۰۲', image: '/tempt/quick.jpg' },
  { id: 8,  carBrandId: 2, name: 'ساینا',       years: '۱۳۹۴ - ۱۴۰۲', image: '/tempt/quick.jpg' },
  { id: 9,  carBrandId: 2, name: 'شاهین',       years: '۱۴۰۰ - ۱۴۰۲', image: '/tempt/quick.jpg' },
  // تویوتا (brandId 3)
  { id: 10, carBrandId: 3, name: 'کرولا',       years: '۱۳۸۵ - ۱۴۰۲', image: '/tempt/quick.jpg' },
  { id: 11, carBrandId: 3, name: 'کمری',        years: '۱۳۸۰ - ۱۴۰۲', image: '/tempt/quick.jpg' },
  { id: 12, carBrandId: 3, name: 'لندکروزر',    years: '۱۳۷۵ - ۱۴۰۲', image: '/tempt/quick.jpg' },
  // هیوندای (brandId 4)
  { id: 13, carBrandId: 4, name: 'آکسنت',       years: '۱۳۸۸ - ۱۴۰۱', image: '/tempt/quick.jpg' },
  { id: 14, carBrandId: 4, name: 'النترا',      years: '۱۳۸۵ - ۱۴۰۲', image: '/tempt/quick.jpg' },
  { id: 15, carBrandId: 4, name: 'توسان',       years: '۱۳۹۲ - ۱۴۰۲', image: '/tempt/quick.jpg' },
  // کیا (brandId 5)
  { id: 16, carBrandId: 5, name: 'ریو',         years: '۱۳۸۸ - ۱۴۰۱', image: '/tempt/quick.jpg' },
  { id: 17, carBrandId: 5, name: 'سراتو',       years: '۱۳۹۰ - ۱۴۰۲', image: '/tempt/quick.jpg' },
];

// ── TABLE: partsBrands ───────────────────────────────────────────────────────
// Spare-parts suppliers / manufacturers (بوش, NGK, ایساکو, …)
// Distinct from carBrands — a Bosch brake pad fits a Toyota, not made by Toyota.

export interface PartsBrand {
  id: number;
  name: string;
}

export const partsBrands: PartsBrand[] = [
  { id: 1, name: 'بوش'       },
  { id: 2, name: 'ایساکو'    },
  { id: 3, name: 'NGK'       },
  { id: 4, name: 'واریان'    },
  { id: 5, name: 'کیان‌پارت' },
  { id: 6, name: 'تکنو'      },
  { id: 7, name: 'مپکو'      },
  { id: 8, name: 'فدک'       },
];

// ── TABLE: categories ────────────────────────────────────────────────────────

export interface Category {
  id: number;
  key: string;          // URL/filter slug
  name: string;
  count: number;        // denormalized display counter (maps to productCount in real schema)

}

export const categories: Category[] = [
  { id: 1, key: 'engine',      name: 'موتور و قطعات',      count: 1284,  },
  { id: 2, key: 'body',        name: 'بدنه و شیشه',       count: 856,  },
  { id: 3, key: 'electrical',  name: 'برق و روشنایی',     count: 642,  },
  { id: 4, key: 'brake',       name: 'ترمز و تعلیق',      count: 524,  },
  { id: 5, key: 'cooling',     name: 'سیستم خنک‌کننده',  count: 398,  },
  { id: 6, key: 'oil',         name: 'روغن و مایعات',     count: 312,  },
  { id: 7, key: 'accessories', name: 'لوازم جانبی',       count: 756,  },
  { id: 8, key: 'filter',      name: 'فیلترها',           count: 480,  },
];

// ── TABLE: productRows ───────────────────────────────────────────────────────
// Raw product rows — FK ids only, no denormalized strings.

export interface ProductRow {
  id: number;
  name: string;
  partsBrandId: number; // FK → partsBrands.id
  carModelId: number;   // FK → carModels.id  (see production note at top)
  categoryId: number;   // FK → categories.id
  price: number;
  oldPrice?: number;
  discount?: number;
  mainImage: string;
  images: string[];
  isOffer: boolean;
  sku: string;
  origin: string;
  stock: number;
  salesCount: number;
  viewCount: number;
  createdDate: string;  // ISO date – "new" badge when within 3 days of today
  rating: number;
  reviewCount: number;
}

export const productRows: ProductRow[] = [
  // ── Engine (categoryId: 1) ────────────────────────────────────────────────
  { id: 1,  name: 'فیلتر روغن موتور اصلی بوش',       partsBrandId: 1, carModelId: 1, categoryId: 1, price: 85000,                           mainImage: IMG, images: [IMG], isOffer: false, sku: 'BSH-ENG-206-001',  origin: 'آلمان', stock: 34, salesCount: 1240, viewCount: 4520, createdDate: '2024-03-15', rating: 4.5, reviewCount: 128 },
  { id: 2,  name: 'واتر پمپ موتور ایساکو اصلی',       partsBrandId: 2, carModelId: 2, categoryId: 1, price: 1150000, oldPrice: 1400000, discount: 18, mainImage: IMG, images: [IMG], isOffer: true,  sku: 'ISC-ENG-405-002', origin: 'ایران', stock: 12, salesCount: 340,  viewCount: 1820, createdDate: '2024-05-10', rating: 4.2, reviewCount: 43 },
  { id: 3,  name: 'کیت کلاچ کامل سه‌پارچه واریان',    partsBrandId: 4, carModelId: 6, categoryId: 1, price: 1200000, oldPrice: 1800000, discount: 33, mainImage: IMG, images: [IMG], isOffer: true,  sku: 'VAR-ENG-PRA-003', origin: 'ایران', stock: 8,  salesCount: 890,  viewCount: 5240, createdDate: '2024-07-22', rating: 4.6, reviewCount: 189 },
  { id: 4,  name: 'تسمه تایم با مجموعه کامل بوش',     partsBrandId: 1, carModelId: 3, categoryId: 1, price: 450000,  oldPrice: 600000,  discount: 25, mainImage: IMG, images: [IMG], isOffer: true,  sku: 'BSH-ENG-SMD-004', origin: 'آلمان', stock: 19, salesCount: 520,  viewCount: 2800, createdDate: '2024-09-05', rating: 4.3, reviewCount: 78 },
  { id: 5,  name: 'گژپین موتور استاندارد مپکو',        partsBrandId: 7, carModelId: 1, categoryId: 1, price: 320000,                          mainImage: IMG, images: [IMG], isOffer: false, sku: 'MPK-ENG-206-005',  origin: 'ایران', stock: 6,  salesCount: 280,  viewCount: 1540, createdDate: '2026-05-26', rating: 4.1, reviewCount: 32 },
  { id: 6,  name: 'فیلتر هوای موتور کیان‌پارت',       partsBrandId: 5, carModelId: 7, categoryId: 1, price: 75000,                           mainImage: IMG, images: [IMG], isOffer: false, sku: 'KYN-ENG-TBA-006',  origin: 'ایران', stock: 47, salesCount: 1580, viewCount: 6200, createdDate: '2025-01-10', rating: 4.6, reviewCount: 91 },
  { id: 7,  name: 'کمربند تایم با کیت کامل تکنو',     partsBrandId: 6, carModelId: 4, categoryId: 1, price: 290000,  oldPrice: 380000,  discount: 24, mainImage: IMG, images: [IMG], isOffer: true,  sku: 'TKN-ENG-DNA-007', origin: 'ایران', stock: 15, salesCount: 430,  viewCount: 2100, createdDate: '2026-05-27', rating: 4.3, reviewCount: 38 },
  { id: 8,  name: 'واشر سرسیلندر موتور ایساکو',        partsBrandId: 2, carModelId: 6, categoryId: 1, price: 580000,                          mainImage: IMG, images: [IMG], isOffer: false, sku: 'ISC-ENG-PRA-008',  origin: 'ایران', stock: 0,  salesCount: 190,  viewCount: 1020, createdDate: '2025-04-15', rating: 4.0, reviewCount: 24 },
  // ── Brake (categoryId: 4) ─────────────────────────────────────────────────
  { id: 9,  name: 'لنت ترمز جلو دیسکی بوش',           partsBrandId: 1, carModelId: 2, categoryId: 4, price: 420000,                          mainImage: IMG, images: [IMG], isOffer: false, sku: 'BSH-BRK-405-009', origin: 'آلمان', stock: 22, salesCount: 720,  viewCount: 3400, createdDate: '2024-04-12', rating: 4.8, reviewCount: 74 },
  { id: 10, name: 'دیسک ترمز چرخ جلو واریان',          partsBrandId: 4, carModelId: 3, categoryId: 4, price: 850000,  oldPrice: 1100000, discount: 23, mainImage: IMG, images: [IMG], isOffer: true,  sku: 'VAR-BRK-SMD-010', origin: 'ایران', stock: 11, salesCount: 360,  viewCount: 2250, createdDate: '2024-06-30', rating: 4.5, reviewCount: 52 },
  { id: 11, name: 'کمک فنر جلو گازی تکنو',             partsBrandId: 6, carModelId: 7, categoryId: 4, price: 920000,  oldPrice: 1300000, discount: 29, mainImage: IMG, images: [IMG], isOffer: true,  sku: 'TKN-BRK-TBA-011', origin: 'ایران', stock: 7,  salesCount: 490,  viewCount: 2900, createdDate: '2024-10-08', rating: 4.3, reviewCount: 78 },
  { id: 12, name: 'لنت ترمز عقب کفشکی فدک',            partsBrandId: 8, carModelId: 6, categoryId: 4, price: 185000,                          mainImage: IMG, images: [IMG], isOffer: false, sku: 'FDK-BRK-PRA-012',  origin: 'ایران', stock: 38, salesCount: 840,  viewCount: 4100, createdDate: '2025-01-25', rating: 4.2, reviewCount: 95 },
  { id: 13, name: 'روغن ترمز ایمنی ۵۰۰ میلی‌لیتر',    partsBrandId: 5, carModelId: 9, categoryId: 4, price: 95000,                           mainImage: IMG, images: [IMG], isOffer: false, sku: 'KYN-BRK-SHN-013',  origin: 'ایران', stock: 25, salesCount: 660,  viewCount: 3100, createdDate: '2026-05-28', rating: 4.4, reviewCount: 58 },
  // ── Electrical (categoryId: 3) ────────────────────────────────────────────
  { id: 14, name: 'شمع خودرو NGK اصلی',                partsBrandId: 3, carModelId: 1, categoryId: 3, price: 340000,                          mainImage: IMG, images: [IMG], isOffer: false, sku: 'NGK-ELC-206-014', origin: 'ژاپن',  stock: 30, salesCount: 1100, viewCount: 5500, createdDate: '2024-03-01', rating: 4.4, reviewCount: 67 },
  { id: 15, name: 'دلکو کامل برق بوش',                 partsBrandId: 1, carModelId: 2, categoryId: 3, price: 2100000, oldPrice: 2800000, discount: 25, mainImage: IMG, images: [IMG], isOffer: true,  sku: 'BSH-ELC-405-015', origin: 'آلمان', stock: 4,  salesCount: 210,  viewCount: 1380, createdDate: '2024-08-15', rating: 4.5, reviewCount: 67 },
  { id: 16, name: 'سنسور اکسیژن لامبدا بوش',            partsBrandId: 1, carModelId: 3, categoryId: 3, price: 680000,  oldPrice: 950000,  discount: 28, mainImage: IMG, images: [IMG], isOffer: true,  sku: 'BSH-ELC-SMD-016', origin: 'آلمان', stock: 9,  salesCount: 380,  viewCount: 2100, createdDate: '2024-12-20', rating: 4.4, reviewCount: 56 },
  { id: 17, name: 'باتری ۶۰ آمپر تکنو',                partsBrandId: 6, carModelId: 4, categoryId: 3, price: 1850000,                         mainImage: IMG, images: [IMG], isOffer: false, sku: 'TKN-ELC-DNA-017', origin: 'ایران', stock: 14, salesCount: 570,  viewCount: 3400, createdDate: '2026-05-25', rating: 4.6, reviewCount: 83 },
  { id: 18, name: 'چراغ جلو دو چشم کامل مپکو',         partsBrandId: 7, carModelId: 8, categoryId: 3, price: 1200000, oldPrice: 1600000, discount: 25, mainImage: IMG, images: [IMG], isOffer: true,  sku: 'MPK-ELC-SNA-018', origin: 'ایران', stock: 6,  salesCount: 290,  viewCount: 1750, createdDate: '2025-04-01', rating: 4.1, reviewCount: 29 },
  // ── Cooling (categoryId: 5) ───────────────────────────────────────────────
  { id: 19, name: 'رادیاتور آب کامل ایساکو',            partsBrandId: 2, carModelId: 6, categoryId: 5, price: 1450000, oldPrice: 1900000, discount: 24, mainImage: IMG, images: [IMG], isOffer: true,  sku: 'ISC-CLN-PRA-019', origin: 'ایران', stock: 5,  salesCount: 220,  viewCount: 1580, createdDate: '2024-05-25', rating: 4.7, reviewCount: 34 },
  { id: 20, name: 'ترموستات خنک‌کننده کیان‌پارت',       partsBrandId: 5, carModelId: 1, categoryId: 5, price: 180000,                          mainImage: IMG, images: [IMG], isOffer: false, sku: 'KYN-CLN-206-020',  origin: 'ایران', stock: 28, salesCount: 480,  viewCount: 2400, createdDate: '2024-09-12', rating: 4.3, reviewCount: 48 },
  { id: 21, name: 'شیلنگ رادیاتور بالایی فدک',          partsBrandId: 8, carModelId: 3, categoryId: 5, price: 95000,                           mainImage: IMG, images: [IMG], isOffer: false, sku: 'FDK-CLN-SMD-021',  origin: 'ایران', stock: 41, salesCount: 680,  viewCount: 3200, createdDate: '2025-02-14', rating: 4.0, reviewCount: 62 },
  { id: 22, name: 'پنکه رادیاتور برقی تکنو',            partsBrandId: 6, carModelId: 7, categoryId: 5, price: 750000,  oldPrice: 980000,  discount: 23, mainImage: IMG, images: [IMG], isOffer: true,  sku: 'TKN-CLN-TBA-022', origin: 'ایران', stock: 10, salesCount: 310,  viewCount: 1950, createdDate: '2026-05-26', rating: 4.4, reviewCount: 37 },
  // ── Oil (categoryId: 6) ───────────────────────────────────────────────────
  { id: 23, name: 'روغن موتور ۴ لیتری ۵W40 بوش',       partsBrandId: 1, carModelId: 1, categoryId: 6, price: 580000,                          mainImage: IMG, images: [IMG], isOffer: false, sku: 'BSH-OIL-206-023',  origin: 'آلمان', stock: 60, salesCount: 2350, viewCount: 8900, createdDate: '2024-02-10', rating: 4.7, reviewCount: 215 },
  { id: 24, name: 'روغن گیربکس اتوماتیک کیان‌پارت',     partsBrandId: 5, carModelId: 4, categoryId: 6, price: 420000,  oldPrice: 560000,  discount: 25, mainImage: IMG, images: [IMG], isOffer: true,  sku: 'KYN-OIL-DNA-024',  origin: 'ایران', stock: 33, salesCount: 560,  viewCount: 2800, createdDate: '2024-07-18', rating: 4.4, reviewCount: 89 },
  { id: 25, name: 'گریس چرخ ۵ کیلوگرمی مپکو',           partsBrandId: 7, carModelId: 9, categoryId: 6, price: 310000,                          mainImage: IMG, images: [IMG], isOffer: false, sku: 'MPK-OIL-SHN-025',  origin: 'ایران', stock: 17, salesCount: 190,  viewCount: 980,  createdDate: '2026-05-27', rating: 4.2, reviewCount: 28 },
  { id: 26, name: 'مایع ترمز DOT4 اصلی NGK',            partsBrandId: 3, carModelId: 8, categoryId: 6, price: 125000,                          mainImage: IMG, images: [IMG], isOffer: false, sku: 'NGK-OIL-SNA-026',  origin: 'ژاپن',  stock: 44, salesCount: 820,  viewCount: 4100, createdDate: '2026-05-28', rating: 4.5, reviewCount: 72 },
  // ── Body (categoryId: 2) ──────────────────────────────────────────────────
  { id: 27, name: 'برف‌پاک‌کن جلو کامل تکنو',           partsBrandId: 6, carModelId: 2, categoryId: 2, price: 185000,  oldPrice: 280000,  discount: 34, mainImage: IMG, images: [IMG], isOffer: true,  sku: 'TKN-BDY-405-027',  origin: 'ایران', stock: 23, salesCount: 740,  viewCount: 4500, createdDate: '2024-01-20', rating: 4.2, reviewCount: 112 },
  { id: 28, name: 'آینه بغل چپ کامل ایساکو',             partsBrandId: 2, carModelId: 6, categoryId: 2, price: 650000,                          mainImage: IMG, images: [IMG], isOffer: false, sku: 'ISC-BDY-PRA-028', origin: 'ایران', stock: 9,  salesCount: 430,  viewCount: 2300, createdDate: '2024-06-10', rating: 4.3, reviewCount: 45 },
  { id: 29, name: 'گلگیر جلو اصلی واریان',               partsBrandId: 4, carModelId: 3, categoryId: 2, price: 980000,  oldPrice: 1300000, discount: 25, mainImage: IMG, images: [IMG], isOffer: true,  sku: 'VAR-BDY-SMD-029', origin: 'ایران', stock: 4,  salesCount: 180,  viewCount: 1200, createdDate: '2024-11-05', rating: 4.1, reviewCount: 23 },
  { id: 30, name: 'شیشه جلو اتاق STD فدک',               partsBrandId: 8, carModelId: 7, categoryId: 2, price: 2400000,                         mainImage: IMG, images: [IMG], isOffer: false, sku: 'FDK-BDY-TBA-030',  origin: 'ایران', stock: 0,  salesCount: 95,   viewCount: 780,  createdDate: '2025-05-15', rating: 4.0, reviewCount: 12 },
  // ── Filter (categoryId: 8) ────────────────────────────────────────────────
  { id: 31, name: 'فیلتر کابین تهویه هوا بوش',           partsBrandId: 1, carModelId: 4, categoryId: 8, price: 120000,  oldPrice: 180000,  discount: 33, mainImage: IMG, images: [IMG], isOffer: true,  sku: 'BSH-FLT-DNA-031',  origin: 'آلمان', stock: 52, salesCount: 1050, viewCount: 5200, createdDate: '2024-04-01', rating: 4.6, reviewCount: 88 },
  { id: 32, name: 'فیلتر بنزین موتور کیان‌پارت',         partsBrandId: 5, carModelId: 1, categoryId: 8, price: 85000,                           mainImage: IMG, images: [IMG], isOffer: false, sku: 'KYN-FLT-206-032',  origin: 'ایران', stock: 37, salesCount: 880,  viewCount: 4300, createdDate: '2024-08-22', rating: 4.3, reviewCount: 65 },
  { id: 33, name: 'فیلتر روغن کلاچ مپکو',                partsBrandId: 7, carModelId: 9, categoryId: 8, price: 65000,                           mainImage: IMG, images: [IMG], isOffer: false, sku: 'MPK-FLT-SHN-033',  origin: 'ایران', stock: 20, salesCount: 420,  viewCount: 2100, createdDate: '2025-02-01', rating: 4.1, reviewCount: 34 },
  { id: 34, name: 'فیلتر گازوئیل دیزل NGK',              partsBrandId: 3, carModelId: 8, categoryId: 8, price: 145000,  oldPrice: 200000,  discount: 28, mainImage: IMG, images: [IMG], isOffer: true,  sku: 'NGK-FLT-SNA-034',  origin: 'ژاپن',  stock: 16, salesCount: 310,  viewCount: 1580, createdDate: '2026-05-25', rating: 4.5, reviewCount: 41 },
];

// ── TABLE: navLinks ───────────────────────────────────────────────────────────

export interface NavLink {
  id: number;
  href: string;
  label: string;
  order: number;
}

export const navLinks: NavLink[] = [
  { id: 1, href: '/',            label: 'خانه',          order: 1 },
  { id: 2, href: '/products',    label: 'همه محصولات',   order: 2 },
  { id: 3, href: '/engine',      label: 'قطعات موتوری',  order: 3 },
  { id: 4, href: '/body',        label: 'بدنه خودرو',    order: 4 },
  { id: 5, href: '/electrical',  label: 'برق خودرو',     order: 5 },
  { id: 6, href: '/accessories', label: 'لوازم جانبی',   order: 6 },
  { id: 7, href: '/brands',      label: 'برندها',        order: 7 },
  { id: 8, href: '/contact',     label: 'تماس با ما',    order: 8 },
];

// ── JOIN HELPERS ──────────────────────────────────────────────────────────────

/**
 * Joined product — what UI components consume.
 * Extends ProductRow with denormalized display strings resolved from FK tables.
 */
export interface Product extends ProductRow {
  brand: string;         // partsBrands.name
  carType: string;       // carModels.name
  category: string;      // categories.key  (used as filter slug)
  categoryLabel: string; // categories.name (used for display)
}

/** Backward-compat alias */
export type PLPProduct = Product;

function joinProduct(row: ProductRow): Product {
  const pb  = partsBrands.find(b => b.id === row.partsBrandId)!;
  const cm  = carModels.find(m => m.id === row.carModelId)!;
  const cat = categories.find(c => c.id === row.categoryId)!;
  return {
    ...row,
    brand:         pb.name,
    carType:       cm.name,
    category:      cat.key,
    categoryLabel: cat.name,
  };
}

// ── COMPUTED VIEWS ────────────────────────────────────────────────────────────

/** All products with denormalized display fields (replaces plpProducts). */
export const products: Product[] = productRows.map(joinProduct);

/** Alias for components still importing plpProducts */
export const plpProducts = products;

/** New arrivals — createdDate within 3 days of today. */
export const newProducts: Product[] = products
  .filter(p => {
    const diffMs = Date.now() - new Date(p.createdDate).getTime();
    return diffMs <= 3 * 24 * 60 * 60 * 1000;
  })
  .sort((a, b) => b.createdDate.localeCompare(a.createdDate));

/** Products currently on sale. */
export const offerProducts: Product[] = products.filter(p => p.isOffer);

// ── FILTER OPTION LISTS ───────────────────────────────────────────────────────
// Derived from tables — no manual maintenance needed.

export const PLP_BRANDS: string[] = partsBrands.map(b => b.name);

export const PLP_CAR_TYPES: string[] = [
  ...new Set(productRows.map(r => carModels.find(m => m.id === r.carModelId)!.name)),
];

export const PLP_CATEGORIES: { key: string; label: string }[] = categories
  .filter(c => c.key !== 'accessories') // no products yet
  .map(c => ({ key: c.key, label: c.name }));
