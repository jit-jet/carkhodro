import type { SocialLinkVM } from '@/src/lib/serializers';
import { SocialMediaIcon } from '@/src/components/layout/SocialMediaIcon';

export function SocialLinksRow({
  links,
  size = 'md',
}: {
  links: SocialLinkVM[];
  size?: 'sm' | 'md';
}) {
  if (links.length === 0) return null;

  const buttonClass =
    size === 'sm'
      ? 'w-9 h-9 bg-white/10 hover:bg-accent hover:text-charcoal rounded-lg flex items-center justify-center transition-colors text-sm'
      : 'w-11 h-11 bg-silver-light hover:bg-accent hover:text-charcoal rounded-xl flex items-center justify-center transition-colors text-xl';

  return (
    <div className="flex flex-wrap gap-3">
      {links.map((link) => (
        <a
          key={link.id}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          title={link.label}
          aria-label={link.label}
          className={buttonClass}
        >
          <SocialMediaIcon icon={link.icon} size={size === 'sm' ? 'md' : 'lg'} />
        </a>
      ))}
    </div>
  );
}
