import type { PublicSiteSettingsVM } from '@/src/lib/serializers';
import { isWholesaleUser, type PricingRole } from '@/src/lib/user-role';

/** Split multiline site-setting text into display lines. */
export function settingLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';

/** Build a `tel:` href from a display phone string (handles Persian/Arabic digits). */
export function phoneTelHref(phone: string): string {
  const normalized = phone.replace(/[۰-۹]/g, (d) => String(PERSIAN_DIGITS.indexOf(d))).replace(/[٠-٩]/g, (d) => String(ARABIC_DIGITS.indexOf(d)));
  const digits = normalized.replace(/\D/g, '');
  return digits ? `tel:${digits}` : '#';
}

/** Non-empty shop phones for the viewer role (guests / retail → 2; wholesale → 4). */
export function contactPhonesForRole(
  settings: Pick<
    PublicSiteSettingsVM,
    | 'retailPhone1'
    | 'retailPhone2'
    | 'wholesalePhone1'
    | 'wholesalePhone2'
    | 'wholesalePhone3'
    | 'wholesalePhone4'
  >,
  role: PricingRole,
): string[] {
  const phones = isWholesaleUser(role)
    ? [
        settings.wholesalePhone1,
        settings.wholesalePhone2,
        settings.wholesalePhone3,
        settings.wholesalePhone4,
      ]
    : [settings.retailPhone1, settings.retailPhone2];

  return phones.map((p) => p.trim()).filter(Boolean);
}

/** First contact phone for CTAs (call-for-price, header primary). */
export function primaryContactPhone(
  settings: Parameters<typeof contactPhonesForRole>[0],
  role: PricingRole,
): string {
  return contactPhonesForRole(settings, role)[0] ?? '';
}
