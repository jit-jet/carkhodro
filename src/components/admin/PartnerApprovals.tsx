'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { updateUserRole } from '@/actions/admin-users';

type Applicant = { id: string; firstName: string; lastName: string; phoneNumber: string };

export default function PartnerApprovals({ users, selectedId }: { users: Applicant[]; selectedId?: string }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState('');
  const router = useRouter();
  function decide(id: string, role: 'RETAIL' | 'WHOLESALE') {
    setMessage('');
    startTransition(async () => {
      try {
        const result = await updateUserRole(id, role, true);
        setMessage(result.ok ? 'تصمیم ثبت شد و ارسال پیامک به کاربر درخواست شد.' : result.error);
        router.refresh();
      } catch { setMessage('خطا در ثبت تصمیم. لطفاً دوباره تلاش کنید.'); }
    });
  }
  return <div className="space-y-4">
    {message && <p role="status" className="rounded-xl bg-amber-50 p-4 text-sm">{message}</p>}
    {!users.length && <p className="rounded-xl bg-white p-6">درخواستی در انتظار تایید نیست.</p>}
    {users.map(user => <div key={user.id} className={`flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-white p-4 ${selectedId === user.id ? 'border-amber-500' : 'border-gray-100'}`}>
      <div><Link className="font-bold" href={`/admin/users/${user.id}`}>{user.firstName} {user.lastName}</Link><p dir="ltr" className="text-sm text-gray-500">{user.phoneNumber}</p></div>
      <div className="flex gap-2">
        <button disabled={pending} onClick={() => decide(user.id, 'WHOLESALE')} className="rounded-lg bg-accent px-4 py-2 disabled:opacity-50">تایید به عنوان همکار</button>
        <button disabled={pending} onClick={() => decide(user.id, 'RETAIL')} className="rounded-lg bg-gray-100 px-4 py-2 disabled:opacity-50">رد و تغییر به مشتری</button>
      </div>
    </div>)}
  </div>;
}
