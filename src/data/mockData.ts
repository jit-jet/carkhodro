export interface CarBrand {
  id: number;
  name: string;
  country: string;
  color: string;
  bgColor: string;
  count: number;
  initial: string;
}

export interface CarModel {
  id: number;
  brandId: number;
  brandName: string;
  name: string;
  years: string;
  color: string;
}

export interface Product {
  id: number;
  title: string;
  brand: string;
  model: string;
  price: number;
  oldPrice?: number;
  category: string;
  isNew: boolean;
  isOffer: boolean;
  rating: number;
  reviewCount: number;
  discount?: number;
  bgColor: string;
  icon: string;
}

export interface Category {
  id: number;
  name: string;
  icon: string;
  count: number;
  color: string;
  bgColor: string;
}

export const carBrands: CarBrand[] = [
  { id: 1, name: 'ایران خودرو', country: 'ایران', color: '#1e40af', bgColor: '#dbeafe', count: 4520, initial: 'ا' },
  { id: 2, name: 'سایپا', country: 'ایران', color: '#15803d', bgColor: '#dcfce7', count: 3210, initial: 'س' },
  { id: 3, name: 'تویوتا', country: 'ژاپن', color: '#dc2626', bgColor: '#fee2e2', count: 2840, initial: 'ت' },
  { id: 4, name: 'هیوندای', country: 'کره جنوبی', color: '#1d4ed8', bgColor: '#dbeafe', count: 2150, initial: 'ه' },
  { id: 5, name: 'کیا', country: 'کره جنوبی', color: '#7c3aed', bgColor: '#ede9fe', count: 1980, initial: 'ک' },
  { id: 6, name: 'نیسان', country: 'ژاپن', color: '#b91c1c', bgColor: '#fee2e2', count: 1750, initial: 'ن' },
  { id: 7, name: 'مزدا', country: 'ژاپن', color: '#9f1239', bgColor: '#ffe4e6', count: 1340, initial: 'م' },
  { id: 8, name: 'بی‌ام‌و', country: 'آلمان', color: '#1e3a5f', bgColor: '#dbeafe', count: 2100, initial: 'ب' },
  { id: 9, name: 'مرسدس', country: 'آلمان', color: '#374151', bgColor: '#f3f4f6', count: 1890, initial: 'م' },
  { id: 10, name: 'پژو', country: 'فرانسه', color: '#0369a1', bgColor: '#e0f2fe', count: 3200, initial: 'پ' },
  { id: 11, name: 'رنو', country: 'فرانسه', color: '#b45309', bgColor: '#fef3c7', count: 2100, initial: 'ر' },
  { id: 12, name: 'فولکس', country: 'آلمان', color: '#0369a1', bgColor: '#e0f2fe', count: 1560, initial: 'ف' },
];

export const carModels: CarModel[] = [
  { id: 1, brandId: 1, brandName: 'ایران خودرو', name: 'پژو ۲۰۶', years: '۱۳۸۰ - ۱۴۰۲', color: '#3b82f6' },
  { id: 2, brandId: 1, brandName: 'ایران خودرو', name: 'پژو ۴۰۵', years: '۱۳۷۰ - ۱۴۰۲', color: '#2563eb' },
  { id: 3, brandId: 1, brandName: 'ایران خودرو', name: 'سمند', years: '۱۳۸۱ - ۱۴۰۲', color: '#1d4ed8' },
  { id: 4, brandId: 1, brandName: 'ایران خودرو', name: 'دنا', years: '۱۳۹۱ - ۱۴۰۲', color: '#1e40af' },
  { id: 5, brandId: 1, brandName: 'ایران خودرو', name: 'پارس', years: '۱۳۷۷ - ۱۴۰۱', color: '#1e3a8a' },
  { id: 6, brandId: 2, brandName: 'سایپا', name: 'پراید', years: '۱۳۶۸ - ۱۴۰۰', color: '#16a34a' },
  { id: 7, brandId: 2, brandName: 'سایپا', name: 'تیبا', years: '۱۳۸۹ - ۱۴۰۲', color: '#15803d' },
  { id: 8, brandId: 2, brandName: 'سایپا', name: 'ساینا', years: '۱۳۹۴ - ۱۴۰۲', color: '#166534' },
  { id: 9, brandId: 2, brandName: 'سایپا', name: 'شاهین', years: '۱۴۰۰ - ۱۴۰۲', color: '#14532d' },
  { id: 10, brandId: 3, brandName: 'تویوتا', name: 'کرولا', years: '۱۳۸۵ - ۱۴۰۲', color: '#ef4444' },
  { id: 11, brandId: 3, brandName: 'تویوتا', name: 'کمری', years: '۱۳۸۰ - ۱۴۰۲', color: '#dc2626' },
  { id: 12, brandId: 3, brandName: 'تویوتا', name: 'لندکروزر', years: '۱۳۷۵ - ۱۴۰۲', color: '#b91c1c' },
  { id: 13, brandId: 4, brandName: 'هیوندای', name: 'آکسنت', years: '۱۳۸۸ - ۱۴۰۱', color: '#3b82f6' },
  { id: 14, brandId: 4, brandName: 'هیوندای', name: 'النترا', years: '۱۳۸۵ - ۱۴۰۲', color: '#2563eb' },
  { id: 15, brandId: 4, brandName: 'هیوندای', name: 'توسان', years: '۱۳۹۲ - ۱۴۰۲', color: '#1d4ed8' },
  { id: 16, brandId: 5, brandName: 'کیا', name: 'ریو', years: '۱۳۸۸ - ۱۴۰۱', color: '#a855f7' },
  { id: 17, brandId: 5, brandName: 'کیا', name: 'سراتو', years: '۱۳۹۰ - ۱۴۰۲', color: '#9333ea' },
];

export const newProducts: Product[] = [
  { id: 1, title: 'فیلتر روغن موتور اصلی', brand: 'ایران خودرو', model: 'پژو ۴۰۵', price: 85000, category: 'engine', isNew: true, isOffer: false, rating: 4.5, reviewCount: 128, bgColor: '#dbeafe', icon: '⚙️' },
  { id: 2, title: 'لنت ترمز جلو دیسکی', brand: 'تویوتا', model: 'کرولا', price: 420000, category: 'brake', isNew: true, isOffer: false, rating: 4.8, reviewCount: 74, bgColor: '#fee2e2', icon: '🔧' },
  { id: 3, title: 'واتر پمپ موتور', brand: 'هیوندای', model: 'النترا', price: 1150000, category: 'engine', isNew: true, isOffer: false, rating: 4.2, reviewCount: 43, bgColor: '#dcfce7', icon: '💧' },
  { id: 4, title: 'فیلتر هوای موتور', brand: 'سایپا', model: 'تیبا', price: 75000, category: 'engine', isNew: true, isOffer: false, rating: 4.6, reviewCount: 91, bgColor: '#fef3c7', icon: '🌀' },
  { id: 5, title: 'روغن موتور ۴ لیتری ۵W40', brand: 'ایران خودرو', model: 'سمند', price: 580000, category: 'oil', isNew: true, isOffer: false, rating: 4.7, reviewCount: 215, bgColor: '#ede9fe', icon: '🛢️' },
  { id: 6, title: 'شمع خودرو NGK', brand: 'کیا', model: 'سراتو', price: 340000, category: 'electrical', isNew: true, isOffer: false, rating: 4.4, reviewCount: 67, bgColor: '#fce7f3', icon: '⚡' },
  { id: 7, title: 'کمربند تایم موتور', brand: 'پژو', model: 'پژو ۲۰۶', price: 290000, category: 'engine', isNew: true, isOffer: false, rating: 4.3, reviewCount: 38, bgColor: '#e0f2fe', icon: '⚙️' },
  { id: 8, title: 'دیسک ترمز چرخ جلو', brand: 'هیوندای', model: 'توسان', price: 850000, category: 'brake', isNew: true, isOffer: false, rating: 4.5, reviewCount: 52, bgColor: '#d1fae5', icon: '🔘' },
];

export const offerProducts: Product[] = [
  { id: 101, title: 'کیت کلاچ کامل سه پارچه', brand: 'ایران خودرو', model: 'پژو ۲۰۶', price: 1200000, oldPrice: 1800000, category: 'engine', isNew: false, isOffer: true, rating: 4.6, reviewCount: 189, discount: 33, bgColor: '#fee2e2', icon: '🔩' },
  { id: 102, title: 'سنسور اکسیژن لامبدا', brand: 'تویوتا', model: 'کمری', price: 680000, oldPrice: 950000, category: 'electrical', isNew: false, isOffer: true, rating: 4.4, reviewCount: 56, discount: 28, bgColor: '#fef3c7', icon: '⚡' },
  { id: 103, title: 'کمک فنر جلو گازی', brand: 'سایپا', model: 'ساینا', price: 920000, oldPrice: 1300000, category: 'suspension', isNew: false, isOffer: true, rating: 4.3, reviewCount: 78, discount: 29, bgColor: '#dcfce7', icon: '🔧' },
  { id: 104, title: 'رادیاتور آب کامل', brand: 'هیوندای', model: 'آکسنت', price: 1450000, oldPrice: 1900000, category: 'cooling', isNew: false, isOffer: true, rating: 4.7, reviewCount: 34, discount: 24, bgColor: '#dbeafe', icon: '💧' },
  { id: 105, title: 'برف‌پاک‌کن جلو کامل', brand: 'کیا', model: 'ریو', price: 185000, oldPrice: 280000, category: 'body', isNew: false, isOffer: true, rating: 4.2, reviewCount: 112, discount: 34, bgColor: '#ede9fe', icon: '🌧️' },
  { id: 106, title: 'دلکو کامل برق', brand: 'ایران خودرو', model: 'پژو ۴۰۵', price: 2100000, oldPrice: 2800000, category: 'electrical', isNew: false, isOffer: true, rating: 4.5, reviewCount: 67, discount: 25, bgColor: '#fce7f3', icon: '⚡' },
  { id: 107, title: 'تسمه تایم کامل با ضمانت', brand: 'رنو', model: 'رنو ۵', price: 450000, oldPrice: 600000, category: 'engine', isNew: false, isOffer: true, rating: 4.1, reviewCount: 45, discount: 25, bgColor: '#cffafe', icon: '⚙️' },
  { id: 108, title: 'فیلتر کابین تهویه', brand: 'نیسان', model: 'ماکسیما', price: 120000, oldPrice: 180000, category: 'engine', isNew: false, isOffer: true, rating: 4.6, reviewCount: 88, discount: 33, bgColor: '#d1fae5', icon: '🌀' },
];

export const categories: Category[] = [
  { id: 1, name: 'موتور و قطعات', icon: '⚙️', count: 1284, color: '#dc2626', bgColor: '#fee2e2' },
  { id: 2, name: 'بدنه و شیشه', icon: '🚗', count: 856, color: '#2563eb', bgColor: '#dbeafe' },
  { id: 3, name: 'برق و روشنایی', icon: '⚡', count: 642, color: '#d97706', bgColor: '#fef3c7' },
  { id: 4, name: 'ترمز و تعلیق', icon: '🔧', count: 524, color: '#7c3aed', bgColor: '#ede9fe' },
  { id: 5, name: 'سیستم خنک‌کننده', icon: '🌡️', count: 398, color: '#0891b2', bgColor: '#cffafe' },
  { id: 6, name: 'روغن و مایعات', icon: '💧', count: 312, color: '#059669', bgColor: '#d1fae5' },
  { id: 7, name: 'لوازم جانبی', icon: '✨', count: 756, color: '#db2777', bgColor: '#fce7f3' },
  { id: 8, name: 'فیلترها', icon: '🔘', count: 480, color: '#92400e', bgColor: '#fef3c7' },
];

export const navLinks = [
  { href: '/', label: 'خانه' },
  { href: '/engine', label: 'قطعات موتوری' },
  { href: '/body', label: 'بدنه خودرو' },
  { href: '/electrical', label: 'برق خودرو' },
  { href: '/accessories', label: 'لوازم جانبی' },
  { href: '/brands', label: 'برندها' },
  { href: '/contact', label: 'تماس با ما' },
];
