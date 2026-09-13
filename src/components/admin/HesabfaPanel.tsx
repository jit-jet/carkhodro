'use client';

/**
 * Admin Accounting panel — Hesabfa settings, webhook registration, manual sync.
 */

import { useState, useTransition } from 'react';
import {
  registerHesabfaWebhook,
  syncHesabfaContactsAction,
  syncHesabfaInvoicesAction,
  syncHesabfaProductsAction,
} from '@/actions/hesabfa';
import { Card, CardHeader } from '@/src/components/admin/AdminUI';
import { useCartUI } from '@/src/store/cart-ui';
import type { ActionResult } from '@/src/lib/result';

function fa(n: number): string {
  return n.toLocaleString('fa-IR');
}

interface Props {
  configured: boolean;
  hookUrl: string | null;
  appWebhookUrl: string | null;
}

type SyncKind = 'products' | 'contacts' | 'invoices';

export default function HesabfaPanel({ configured, hookUrl, appWebhookUrl }: Props) {
  const [pending, startTransition] = useTransition();
  const [activeAction, setActiveAction] = useState<SyncKind | 'webhook' | null>(null);
  const [lastMessage, setLastMessage] = useState<string | null>(null);
  const [lastInvoices, setLastInvoices] = useState<Record<number, { created: number; updated: number; skipped: number }> | null>(null);
  const notify = useCartUI((s) => s.notify);
  const busy = pending || activeAction !== null;

  function runSync<T>(
    kind: SyncKind,
    title: string,
    action: () => Promise<ActionResult<T>>,
    describe: (data: T) => string,
    onSuccess?: (data: T) => void,
  ) {
    setLastMessage(null);
    setLastInvoices(null);
    setActiveAction(kind);
    startTransition(async () => {
      try {
        const res = await action();
        if (res.ok) {
          const msg = describe(res.data);
          setLastMessage(msg);
          onSuccess?.(res.data);
          notify({ variant: 'success', title, description: msg });
        } else {
          setLastMessage(res.error);
          notify({ variant: 'error', title: `خطای ${title}`, description: res.error });
        }
      } catch {
        const msg = 'ارتباط با سرور برقرار نشد. لطفاً دوباره تلاش کنید.';
        setLastMessage(msg);
        notify({ variant: 'error', title: `خطای ${title}`, description: msg });
      } finally {
        setActiveAction(null);
      }
    });
  }

  function registerHook() {
    setLastMessage(null);
    setLastInvoices(null);
    setActiveAction('webhook');
    startTransition(async () => {
      try {
        const res = await registerHesabfaWebhook();
        if (res.ok) {
          const msg = `وب‌هوک ثبت شد: ${res.data.url}`;
          setLastMessage(msg);
          notify({ variant: 'success', title: 'وب‌هوک حسابفا', description: msg });
        } else {
          setLastMessage(res.error);
          notify({ variant: 'error', title: 'خطای ثبت وب‌هوک', description: res.error });
        }
      } catch {
        const msg = 'ارتباط با سرور برقرار نشد. لطفاً دوباره تلاش کنید.';
        setLastMessage(msg);
        notify({ variant: 'error', title: 'خطای ثبت وب‌هوک', description: msg });
      } finally {
        setActiveAction(null);
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
          description="هر بخش به‌صورت مستقل از حسابفا دریافت می‌شود. همگام‌سازی کالاها شامل دسته‌بندی‌ها و موجودی است."
        />
        <div className="px-5 sm:px-6 py-5 space-y-4">
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => runSync(
                'products',
                'همگام‌سازی کالاها',
                syncHesabfaProductsAction,
                ({ categories, products, stockUpdated }) =>
                  `همگام‌سازی کالاها انجام شد — دسته‌بندی: ${fa(categories.created)} جدید / ${fa(categories.updated)} به‌روزرسانی، ` +
                  `کالا: ${fa(products.created)} جدید / ${fa(products.updated)} به‌روزرسانی / ${fa(products.deleted)} حذف‌شده، ` +
                  `موجودی: ${fa(stockUpdated)} بازخوانی‌شده`,
              )}
              disabled={busy || !configured}
              className="bg-accent hover:bg-accent-dark disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl px-5 py-2.5 transition-colors"
            >
              {activeAction === 'products' ? 'در حال همگام‌سازی کالاها…' : 'همگام‌سازی کالاها'}
            </button>
            <button
              type="button"
              onClick={() => runSync(
                'contacts',
                'همگام‌سازی اشخاص',
                syncHesabfaContactsAction,
                ({ created, updated, skipped }) =>
                  `همگام‌سازی اشخاص انجام شد — ${fa(created)} جدید / ${fa(updated)} به‌روزرسانی / ${fa(skipped)} ردشده`,
              )}
              disabled={busy || !configured}
              className="bg-accent hover:bg-accent-dark disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl px-5 py-2.5 transition-colors"
            >
              {activeAction === 'contacts' ? 'در حال همگام‌سازی اشخاص…' : 'همگام‌سازی اشخاص'}
            </button>
            <button
              type="button"
              onClick={() => runSync(
                'invoices',
                'همگام‌سازی فاکتورها',
                syncHesabfaInvoicesAction,
                ({ created, updated, skipped }) =>
                  `همگام‌سازی فاکتورها انجام شد — ${fa(created)} جدید / ${fa(updated)} به‌روزرسانی / ${fa(skipped)} ردشده`,
                ({ byType }) => setLastInvoices(byType),
              )}
              disabled={busy || !configured}
              className="bg-accent hover:bg-accent-dark disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl px-5 py-2.5 transition-colors"
            >
              {activeAction === 'invoices' ? 'در حال همگام‌سازی فاکتورها…' : 'همگام‌سازی فاکتورها'}
            </button>
            <button
              type="button"
              onClick={registerHook}
              disabled={busy || !configured}
              className="bg-white border border-gray-200 hover:border-accent disabled:opacity-60 disabled:cursor-not-allowed text-charcoal text-sm font-semibold rounded-xl px-5 py-2.5 transition-colors"
            >
              {activeAction === 'webhook' ? 'در حال ثبت وب‌هوک…' : 'ثبت وب‌هوک'}
            </button>
          </div>

          {lastMessage && (
            <p className="text-xs leading-7 rounded-xl px-4 py-3 bg-gray-50 text-gray-700 border border-gray-100">
              {lastMessage}
            </p>
          )}
          {lastInvoices && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2" dir="ltr">
              {(['Sales', 'Purchase', 'Sales Return', 'Purchase Return'] as const).map((label, type) => (
                <div key={label} className="rounded-xl border border-gray-100 bg-gray-50 p-3 text-xs">
                  <b className="block mb-1">{label}</b>
                  <span>{fa(lastInvoices[type]?.created ?? 0)} new / {fa(lastInvoices[type]?.updated ?? 0)} updated / {fa(lastInvoices[type]?.skipped ?? 0)} skipped</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
