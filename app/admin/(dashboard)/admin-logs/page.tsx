import type { Metadata } from 'next';
import { connection } from 'next/server';
import { getAdminActivityLogs } from '@/actions/admin-logs';
import { PageHeader, Button, Input, Select } from '@/src/components/admin/AdminUI';
import AdminPagination from '@/src/components/admin/AdminPagination';
import { parsePage, parsePerPage, pickSearchParam } from '@/src/lib/admin-pagination';
import { adminActionLabel } from '@/src/lib/admin-action-labels';
import type { AdminActivityStatus } from '@/generated/prisma_client';

export const metadata: Metadata = { title: 'گزارش فعالیت مدیران | پنل مدیریت' };

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const STATUS_LABELS: Record<AdminActivityStatus, string> = {
  SUCCESS: 'موفق', FAILURE: 'ناموفق', BLOCKED: 'مسدود',
};

const REASON_LABELS: Record<string, string> = {
  invalid_credentials: 'اطلاعات ورود نادرست',
  locked: 'حساب موقتاً قفل است',
  inactive: 'حساب غیرفعال است',
  success: 'ورود موفق',
};

function parseStatus(value: string): AdminActivityStatus | undefined {
  return value === 'SUCCESS' || value === 'FAILURE' || value === 'BLOCKED' ? value : undefined;
}

export default async function AdminLogsPage({ searchParams }: Props) {
  await connection();
  const sp = await searchParams;
  const q = pickSearchParam(sp.q).slice(0, 100);
  const status = parseStatus(pickSearchParam(sp.status));
  const page = parsePage(sp.page);
  const perPage = parsePerPage(sp.perPage);
  const logs = await getAdminActivityLogs({ q, status, page, perPage });
  const query = { ...(q ? { q } : {}), ...(status ? { status } : {}) };

  return (
    <div>
      <PageHeader title="گزارش فعالیت مدیران" description="ورودها و عملیات مهم انجام‌شده در پنل مدیریت" />
      <form method="get" className="mb-5 grid gap-3 rounded-2xl border border-gray-100 bg-white p-4 sm:grid-cols-[1fr_12rem_auto]">
        <Input name="q" defaultValue={q} placeholder="جستجو در عملیات، نام کاربری یا IP" />
        <Select name="status" defaultValue={status ?? ''}>
          <option value="">همه وضعیت‌ها</option>
          <option value="SUCCESS">موفق</option>
          <option value="FAILURE">ناموفق</option>
          <option value="BLOCKED">مسدود</option>
        </Select>
        <Button type="submit">جستجو</Button>
      </form>

      <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white">
        <table className="w-full min-w-[720px] text-sm lg:min-w-full">
          <thead className="bg-gray-50 text-gray-600">
            <tr>{['زمان', 'مدیر', 'عملیات', 'نتیجه', 'IP', 'مرورگر'].map((title) => <th key={title} className="px-4 py-3 text-right font-semibold">{title}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {logs.items.map((log) => (
              <tr key={log.id} className="align-top hover:bg-gray-50/60">
                <td className="whitespace-nowrap px-4 py-3 text-gray-600">{new Intl.DateTimeFormat('fa-IR', { dateStyle: 'short', timeStyle: 'medium', timeZone: 'Asia/Tehran' }).format(log.createdAt)}</td>
                <td className="whitespace-nowrap px-4 py-3 font-semibold text-charcoal">{log.actor}</td>
                <td className="px-4 py-3"><div className="font-medium text-charcoal">{adminActionLabel(log.action)}</div><code className="text-[11px] text-gray-400">{log.action}</code>{log.reason && <div className="text-xs text-gray-500">{REASON_LABELS[log.reason] ?? log.reason}</div>}</td>
                <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${log.status === 'SUCCESS' ? 'bg-green-100 text-green-700' : log.status === 'BLOCKED' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-700'}`}>{STATUS_LABELS[log.status]}</span></td>
                <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-gray-500" dir="ltr">{log.ipAddress ?? '—'}</td>
                <td className="max-w-xs px-4 py-3 text-xs text-gray-500"><span className="line-clamp-2" title={log.userAgent ?? undefined}>{log.userAgent ?? '—'}</span></td>
              </tr>
            ))}
            {logs.items.length === 0 && <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-500">گزارشی یافت نشد.</td></tr>}
          </tbody>
        </table>
      </div>
      <AdminPagination page={logs.page} pageCount={logs.pageCount} total={logs.total} perPage={logs.perPage} pathname="/admin/admin-logs" query={query} />
    </div>
  );
}
