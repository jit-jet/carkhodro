'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { logout } from '@/actions/auth';

export default function AppUnavailableLogout() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  async function handleLogout() {
    setLoading(true);
    setError(false);
    try {
      const result = await logout();
      if (!result.ok) {
        setError(true);
        return;
      }
      router.replace('/login');
      router.refresh();
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        disabled={loading}
        onClick={handleLogout}
        className="w-full rounded-xl bg-charcoal px-4 py-3 text-sm font-bold text-white disabled:opacity-50"
      >
        خروج از حساب
      </button>
      {error && <p role="alert" className="mt-3 text-center text-sm text-red-600">خروج از حساب انجام نشد. دوباره تلاش کنید.</p>}
    </div>
  );
}
