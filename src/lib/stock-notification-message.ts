import { toEnglishDigits } from './persian';

export interface StockNotificationMessageInput {
  productName: string;
  productUrl: string;
}

function oneLine(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

/** Keep the store identity and direct product link explicit in every SMS. */
export function buildStockNotificationMessage(
  input: StockNotificationMessageInput,
): string {
  const productName = oneLine(input.productName);
  return [
    'فروشگاه اینترنتی کارخودرو',
    '',
    'محصول «' + productName + '» موجود شد.',
    'همین حالا می‌توانید سفارش خود را ثبت کنید.',
    toEnglishDigits(input.productUrl),
  ].join('\n');
}
