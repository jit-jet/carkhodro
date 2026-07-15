import Image from 'next/image';

/**
 * Partner avatar. Prefers a storage path (`/storage/avatars/...`); still
 * renders legacy base64 data URLs with `unoptimized` so old rows keep working.
 */
export default function Avatar({
  src,
  size = 64,
  alt = 'تصویر پروفایل',
}: {
  src: string | null;
  size?: number;
  alt?: string;
}) {
  if (src) {
    const isDataUrl = src.startsWith('data:');
    return (
      <Image
        src={src}
        alt={alt}
        width={size}
        height={size}
        unoptimized={isDataUrl}
        className="rounded-full object-cover bg-silver-light"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      className="inline-flex items-center justify-center rounded-full bg-silver-light text-gray-300"
      style={{ width: size, height: size }}
      aria-label={alt}
    >
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className="w-1/2 h-1/2"
        aria-hidden="true"
      >
        <path d="M12 12a5 5 0 100-10 5 5 0 000 10zm0 2c-4.42 0-8 2.69-8 6v2h16v-2c0-3.31-3.58-6-8-6z" />
      </svg>
    </span>
  );
}
