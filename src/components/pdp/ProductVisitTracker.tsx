'use client';

import { useEffect, useRef } from 'react';
import { recordSignedInProductVisit } from '@/actions/product-visits';

export default function ProductVisitTracker({ productId }: { productId: string }) {
  const recordedProduct = useRef<string | null>(null);

  useEffect(() => {
    if (recordedProduct.current === productId) return;
    recordedProduct.current = productId;
    void recordSignedInProductVisit(productId).catch(() => {
      // Tracking is best-effort; navigation must not surface a network error.
    });
  }, [productId]);

  return null;
}
