/**
 * Zibal IPG callback.
 * ───────────────────
 * Zibal redirects the user's browser here (GET) after payment with:
 *   ?trackId=&success=&status=&orderId=
 *
 * We verify the transaction server-side, update the order, then redirect to
 * the in-app success or failed payment pages.
 *
 * @see https://help.zibal.ir/ipg/
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { handleZibalCallback } from '@/src/lib/payment/zibal-callback';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ?? request.nextUrl.origin;

  try {
    const outcome = await handleZibalCallback({
      success: searchParams.get('success'),
      trackId: searchParams.get('trackId'),
      orderId: searchParams.get('orderId'),
      status: searchParams.get('status'),
    });
    return NextResponse.redirect(new URL(outcome.redirectPath, appUrl));
  } catch (err) {
    console.error('[zibal:callback]', err);
    const orderId = searchParams.get('orderId');
    const params = new URLSearchParams({
      reason: 'خطای غیرمنتظره در پردازش پرداخت. لطفاً دوباره تلاش کنید.',
    });
    if (orderId) params.set('order', orderId);
    return NextResponse.redirect(new URL(`/payment/failed?${params.toString()}`, appUrl));
  }
}
