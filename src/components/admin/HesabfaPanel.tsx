'use client';

/**
 * Admin Accounting panel — Hesabfa settings, webhook registration, manual sync.
 */

import { useState, useTransition } from 'react';
import {
  forceSyncHesabfa,
  registerHesabfaWebhook,
} from '@/actions/hesabfa';
import { Card, CardHeader } from '@/src/components/admin/AdminUI';
import { useCartUI } from '@/src/store/cart-ui';

function fa(n: number): string {
  return n.toLocaleString('fa-IR');
}

interface Props {
  configured: boolean;
  hookUrl: string | null;
  appWebhookUrl: string | null;
}

export default function HesabfaPanel({ configured, hookUrl, appWebhookUrl }: Props) {
  const [pending, startTransition] = useTransition();
  const [lastMessage, setLastMessage] = useState<string | null>(null);
  const notify = useCartUI((s) => s.notify);

  function runSync() {
    setLastMessage(null);
    startTransition(async () => {
      const res = await forceSyncHesabfa();
      if (res.ok) {
        const { products, contacts } = res.data;
        const msg =
          `همگام‌سازی کامل شد — کالا: ${fa(products.created)} جدید / ${fa(products.updated)} به‌روزرسانی / ${fa(products.deleted)} حذف‌شده، ` +
          `اشخاص: ${fa(contacts.created)} جدید / ${fa(contacts.updated)} به‌روزرسانی / ${fa(contacts.skipped)} ردشده، ` 
        setLastMessage(msg);
        notify({ variant: 'success', title: 'همگام‌سازی حسابفا', description: msg });
      } else {
        setLastMessage(res.error);
        notify({ variant: 'error', title: 'خطای همگام‌سازی', description: res.error });
      }
    });
  }

  function registerHook() {
    setLastMessage(null);
    startTransition(async () => {
      const res = await registerHesabfaWebhook();
      if (res.ok) {
        const msg = `وب‌هوک ثبت شد: ${res.data.url}`;
        setLastMessage(msg);
        notify({ variant: 'success', title: 'وب‌هوک حسابفا', description: msg });
      } else {
        setLastMessage(res.error);
        notify({ variant: 'error', title: 'خطای ثبت وب‌هوک', description: res.error });
      }
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="وضعیت اتصال حسابفا"
          description="مبالغ در حسابفا به ریال است؛ سایت تومان ذخیره می‌کند و در مرز API تبدیل انجام می‌شود."
        />
        <div className="px-5 sm:px-6 py-5 space-y-3 text-sm text-charcoal">
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-gray-500">پیکربندی API:</span>
            <span
              className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-semibold ${
                configured ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
              }`}
            >
              {configured ? 'فعال' : 'ناقص — متغیرهای محیطی را تنظیم کنید'}
            </span>
          </div>
          <div className="text-gray-600 leading-7">
            <div>
              <span className="text-gray-500">آدرس وب‌هوک این سایت: </span>
              <code className="text-xs bg-gray-50 border border-gray-100 rounded px-1.5 py-0.5 break-all">
                {appWebhookUrl ?? '—'}
              </code>
            </div>
            <div className="mt-1">
              <span className="text-gray-500">وب‌هوک ثبت‌شده در حسابفا: </span>
              <code className="text-xs bg-gray-50 border border-gray-100 rounded px-1.5 py-0.5 break-all">
                {hookUrl ?? 'ثبت نشده / خوانده نشد'}
              </code>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader
          title="همگام‌سازی دستی"
          description="دریافت کالاها و اشخاص از حسابفا، حذف نرم کالاهای حذف‌شده، و ارسال کالا/اشخاص محلی به حسابفا. فاکتورها از طریق وب‌هوک فقط روی سفارش‌های موجود به‌روز می‌شوند."
        />
        <div className="px-5 sm:px-6 py-5 space-y-4">
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={runSync}
              disabled={pending || !configured}
              className="bg-accent hover:bg-accent-dark disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl px-5 py-2.5 transition-colors"
            >
              {pending ? 'در حال همگام‌سازی…' : 'همگام‌سازی کامل'}
            </button>
            <button
              type="button"
              onClick={registerHook}
              disabled={pending || !configured}
              className="bg-white border border-gray-200 hover:border-accent disabled:opacity-60 disabled:cursor-not-allowed text-charcoal text-sm font-semibold rounded-xl px-5 py-2.5 transition-colors"
            >
              ثبت وب‌هوک
            </button>
          </div>

          {lastMessage && (
            <p className="text-xs leading-7 rounded-xl px-4 py-3 bg-gray-50 text-gray-700 border border-gray-100">
              {lastMessage}
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}
