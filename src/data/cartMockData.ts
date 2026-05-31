export interface CartItem {
  id: number;
  name: string;
  sku: string;
  price: number;
  image: string;
  quantity: number;
  brand: string;
}

export const initialCartItems: CartItem[] = [
  {
    id: 1,
    name: 'فیلتر روغن بوش — پراید / تیبا',
    sku: 'BSH-OIL-001',
    price: 185_000,
    image: '/tempt/ezam.webp',
    quantity: 2,
    brand: 'Bosch',
  },
  {
    id: 2,
    name: 'لنت ترمز جلو TRW — پژو ۲۰۶',
    sku: 'TRW-BRK-206',
    price: 420_000,
    image: '/tempt/quick.jpg',
    quantity: 1,
    brand: 'TRW',
  },
  {
    id: 3,
    name: 'شمع موتور NGK — سمند / پارس',
    sku: 'NGK-SPK-405',
    price: 95_000,
    image: '/tempt/ezam.webp',
    quantity: 4,
    brand: 'NGK',
  },
  {
    id: 4,
    name: 'تسمه تایم گیتس — پژو ۴۰۵',
    sku: 'GAT-TIM-405',
    price: 280_000,
    image: '/tempt/quick.jpg',
    quantity: 1,
    brand: 'Gates',
  },
];

export interface ShippingOption {
  id: string;
  label: string;
  description: string;
  cost: number;
}

export const shippingOptions: ShippingOption[] = [
  {
    id: 'standard',
    label: 'ارسال عادی (پست)',
    description: 'تحویل در ۳ تا ۵ روز کاری',
    cost: 120_000,
  },
  {
    id: 'express',
    label: 'ارسال اکسپرس',
    description: 'تحویل در ۱ تا ۲ روز کاری',
    cost: 350_000,
  },
  {
    id: 'motorcycle',
    label: 'پیک موتوری (درون‌شهری تهران)',
    description: 'تحویل در همان روز',
    cost: 85_000,
  },
];

export type PaymentMethod = 'online' | 'cod';
