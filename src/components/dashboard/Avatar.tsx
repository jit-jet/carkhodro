import Image from 'next/image';

/**
 * Partner avatar. Renders the uploaded JPEG (stored inline as a base64 data URL)
 * when present, otherwise a neutral person placeholder. Data URLs bypass the
 * image optimizer (`unoptimized`), which keeps next/image happy with inline src.
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
    return (
      <Image
        src={src}
        alt={alt}
        width={size}
        height={size}
        unoptimized
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
