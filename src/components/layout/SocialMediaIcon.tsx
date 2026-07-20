import Image from 'next/image';
import type { ReactElement } from 'react';

const SIZE_CLASS = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
} as const;

export const SOCIAL_ICON_PRESETS = [
  { key: 'telegram', label: 'تلگرام' },
  { key: 'instagram', label: 'اینستاگرام' },
  { key: 'whatsapp', label: 'واتساپ' },
  { key: 'rubica', label: 'روبیکا' },
  { key: 'eitaa', label: 'ایتا' },
  { key: 'bale', label: 'بله' },
] as const;

export type SocialIconKey = (typeof SOCIAL_ICON_PRESETS)[number]['key'];

const ICON_FILES: Record<SocialIconKey, string> = {
  telegram: '/icons/social/telegram.svg',
  instagram: '/icons/social/instagram.svg',
  whatsapp: '/icons/social/whatsapp.svg',
  rubica: '/icons/social/rubica.svg?v=2',
  eitaa: '/icons/social/eitaa.svg',
  bale: '/icons/social/bale.svg',
};

export function isSocialIconKey(value: string): value is SocialIconKey {
  return value in ICON_FILES;
}

function AssetIcon({ icon, size, className }: { icon: SocialIconKey; size: keyof typeof SIZE_CLASS; className: string }) {
  const sizePx = size === 'sm' ? 16 : size === 'md' ? 20 : 24;
  return (
    <Image
      src={ICON_FILES[icon]}
      alt=""
      width={sizePx}
      height={sizePx}
      className={`${SIZE_CLASS[size]} object-contain ${className}`.trim()}
      aria-hidden="true"
    />
  );
}

export function SocialMediaIcon({
  icon,
  size = 'md',
  className = '',
}: {
  icon: string;
  size?: keyof typeof SIZE_CLASS;
  className?: string;
}): ReactElement {
  if (isSocialIconKey(icon)) {
    return <AssetIcon icon={icon} size={size} className={className} />;
  }

  return (
    <span className={`inline-flex items-center justify-center ${SIZE_CLASS[size]} ${className}`.trim()} aria-hidden="true">
      {icon}
    </span>
  );
}
