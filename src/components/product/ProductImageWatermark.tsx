'use client';

import { createContext, useContext } from 'react';
import Image, { type ImageProps } from 'next/image';
import type { ProductWatermarkPosition } from '@/src/lib/serializers';

type WatermarkSettings = { url: string; position: ProductWatermarkPosition };
const WatermarkContext = createContext<WatermarkSettings>({ url: '', position: 'bottom-right' });

export function ProductWatermarkProvider({ settings, children }: { settings: WatermarkSettings; children: React.ReactNode }) {
  return <WatermarkContext.Provider value={settings}>{children}</WatermarkContext.Provider>;
}

const POSITION_CLASSES: Record<ProductWatermarkPosition, string> = {
  'top-right': 'top-[clamp(6px,3%,14px)] right-[clamp(6px,3%,14px)]',
  'top-left': 'top-[clamp(6px,3%,14px)] left-[clamp(6px,3%,14px)]',
  'bottom-right': 'bottom-[clamp(6px,3%,14px)] right-[clamp(6px,3%,14px)]',
  'bottom-left': 'bottom-[clamp(6px,3%,14px)] left-[clamp(6px,3%,14px)]',
};

const OBJECT_POSITIONS: Record<ProductWatermarkPosition, string> = {
  'top-right': 'right top',
  'top-left': 'left top',
  'bottom-right': 'right bottom',
  'bottom-left': 'left bottom',
};

const OCCUPIED_POSITION_CLASSES: Record<ProductWatermarkPosition, string> = {
  'top-right': 'top-[clamp(38px,24%,72px)] right-[clamp(6px,3%,14px)]',
  'top-left': 'top-[clamp(38px,24%,72px)] left-[clamp(6px,3%,14px)]',
  'bottom-right': 'bottom-[clamp(38px,24%,72px)] right-[clamp(6px,3%,14px)]',
  'bottom-left': 'bottom-[clamp(38px,24%,72px)] left-[clamp(6px,3%,14px)]',
};

type ProductImageProps = ImageProps & {
  /** Corners already used by badges or image controls. */
  occupiedCorners?: ProductWatermarkPosition[];
};

/** Product photo plus the globally configured, non-interactive brand watermark. */
export function ProductImage({ alt, occupiedCorners = [], ...props }: ProductImageProps) {
  const watermark = useContext(WatermarkContext);
  const positionClass = occupiedCorners.includes(watermark.position)
    ? OCCUPIED_POSITION_CLASSES[watermark.position]
    : POSITION_CLASSES[watermark.position];
  return (
    <>
      <Image alt={alt} {...props} />
      {watermark.url && (
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute z-[2] h-[18%] w-[28%] max-h-16 max-w-24 ${positionClass}`}
        >
          <Image
            src={watermark.url}
            alt=""
            fill
            sizes="96px"
            className="object-contain"
            style={{ objectPosition: OBJECT_POSITIONS[watermark.position] }}
          />
        </span>
      )}
    </>
  );
}
