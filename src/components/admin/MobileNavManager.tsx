'use client';

import { useState, useTransition } from 'react';
import {
  createMobileNavItem, updateMobileNavItem, deleteMobileNavItem, reorderMobileNavItems,
  type MobileNavInput,
} from '@/actions/admin-mobile-nav';
import type { MobileNavItemVM } from '@/actions/mobile-nav';
import ImageUploadField from '@/src/components/admin/ImageUploadField';
import { Badge, Button, Card, CardHeader, EmptyState, FormError, Input, Label } from '@/src/components/admin/AdminUI';
import { useCartUI } from '@/src/store/cart-ui';

const EMPTY: MobileNavInput = { href: '', label: '', iconUrl: '', isActive: true };

export default function MobileNavManager({ initialItems }: { initialItems: MobileNavItemVM[] }) {
  const notify = useCartUI((state) => state.notify);
  const [items, setItems] = useState(initialItems);
  const [form, setForm] = useState<MobileNavInput>(EMPTY);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [pending, startTransition] = useTransition();

  function reset() {
    setEditingId(null);
    setForm(EMPTY);
    setError('');
  }

  function save(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    startTransition(async () => {
      if (editingId === null) {
        const result = await createMobileNavItem(form);
        if (!result.ok) { setError(result.error); return; }
        setItems((current) => [...current, { ...form, ...result.data }]);
      } else {
        const result = await updateMobileNavItem(editingId, form);
        if (!result.ok) { setError(result.error); return; }
        setItems((current) => current.map((item) => item.id === editingId ? { ...item, ...form } : item));
      }
      notify({ variant: 'success', title: 'ذخیره شد', description: 'منوی موبایل به‌روز شد.' });
      reset();
    });
  }

  function remove(id: number) {
    setError('');
    startTransition(async () => {
      const result = await deleteMobileNavItem(id);
      if (!result.ok) { setError(result.error); return; }
      setItems((current) => current.filter((item) => item.id !== id));
      if (editingId === id) reset();
      notify({ variant: 'success', title: 'حذف شد', description: 'مورد از منوی موبایل حذف شد.' });
    });
  }

  function move(id: number, direction: -1 | 1) {
    const index = items.findIndex((item) => item.id === id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    setItems(next);
    setError('');
    startTransition(async () => {
      const result = await reorderMobileNavItems(next.map((item) => item.id));
      if (!result.ok) {
        setItems(items);
        setError(result.error);
      } else {
        setItems(next.map((item, order) => ({ ...item, order })));
      }
    });
  }

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <CardHeader title={editingId === null ? 'افزودن مورد' : 'ویرایش مورد'} description="برای هر مورد یک آیکون تصویری، عنوان کوتاه و مسیر داخلی سایت ثبت کنید." />
        <form onSubmit={save} className="space-y-4 p-5 sm:p-6">
          <ImageUploadField folder="settings" label="آیکون" value={form.iconUrl} onChange={(iconUrl) => setForm((current) => ({ ...current, iconUrl }))} />
          <div className="grid gap-4 sm:grid-cols-2">
            <div><Label>عنوان</Label><Input value={form.label} maxLength={40} required onChange={(event) => setForm({ ...form, label: event.target.value })} placeholder="مثلاً صفحه اصلی" /></div>
            <div><Label>لینک</Label><Input value={form.href} required dir="ltr" className="text-left" onChange={(event) => setForm({ ...form, href: event.target.value })} placeholder="/products" /></div>
          </div>
          <label className="flex items-center gap-2 text-sm text-charcoal"><input type="checkbox" checked={form.isActive} onChange={(event) => setForm({ ...form, isActive: event.target.checked })} /> فعال</label>
          {error && <FormError message={error} />}
          <div className="flex gap-2">
            <Button type="submit" disabled={pending || !form.iconUrl}>{pending ? 'در حال ذخیره…' : editingId === null ? 'افزودن' : 'ذخیره'}</Button>
            {editingId !== null && <Button type="button" variant="ghost" onClick={reset}>انصراف</Button>}
          </div>
        </form>
      </Card>
      <Card className="overflow-hidden">
        <CardHeader title="موارد منو" description="ترتیب نمایش از راست به چپ است. موارد غیرفعال در سایت نمایش داده نمی‌شوند." />
        {items.length === 0 ? <EmptyState message="هنوز موردی ثبت نشده است؛ نوار پایین در سایت نمایش داده نمی‌شود." /> : (
          <ul className="divide-y divide-gray-100 px-5 sm:px-6">
            {items.map((item, index) => (
              <li key={item.id} className="flex flex-wrap items-center gap-3 py-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.iconUrl} alt="" className="h-10 w-10 rounded-lg border border-gray-200 object-contain" />
                <div className="min-w-0 flex-1"><div className="flex items-center gap-2"><span className="font-semibold">{item.label}</span>{!item.isActive && <Badge tone="warning">غیرفعال</Badge>}</div><p dir="ltr" className="truncate text-left text-xs text-gray-500">{item.href}</p></div>
                <div className="flex items-center gap-1">
                  <Button type="button" variant="ghost" size="sm" disabled={pending || index === 0} onClick={() => move(item.id, -1)}>↑</Button>
                  <Button type="button" variant="ghost" size="sm" disabled={pending || index === items.length - 1} onClick={() => move(item.id, 1)}>↓</Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => { setEditingId(item.id); setForm({ href: item.href, label: item.label, iconUrl: item.iconUrl, isActive: item.isActive }); setError(''); }}>ویرایش</Button>
                  <Button type="button" variant="danger" size="sm" disabled={pending} onClick={() => remove(item.id)}>حذف</Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
