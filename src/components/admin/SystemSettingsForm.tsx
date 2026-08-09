'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  updateSystemSettings,
  type SystemSettingsVM,
} from '@/actions/admin-system-settings';
import { Button, Card, CardHeader, FormError, FormSuccess, Input, Label } from './AdminUI';
import { useCartUI } from '@/src/store/cart-ui';

const groups = [
  {
    title: 'پیامک FarazSMS',
    status: 'sms' as const,
    fields: [
      ['smsApiBaseUrl', 'آدرس API', 'https://api.iranpayamak.com', 'آدرس پایه API سرویس IranPayamak / FarazSMS.'],
      ['smsApiKey', 'کلید API', 'مقدار جدید', 'کلید Api-Key از پنل IranPayamak. مقدار «console» یا مقدار خالی، حالت آزمایشی بدون ارسال پیامک واقعی را فعال می‌کند؛ در این حالت OTP در رابط ورود نمایش داده می‌شود و پیامک گروهی فقط در گزارش سرور ثبت می‌شود.'],
      ['smsLineNumber', 'شماره خط ارسال', 'مقدار جدید', 'شماره خط فرستنده؛ برای نمونه از بخش خطوط قابل دسترس پنل یا endpoint مربوط به lines/accessible دریافت می‌شود.'],
      ['smsOtpPatternCode', 'کد الگوی OTP', 'مقدار جدید', 'شناسه الگوی تأییدشده OTP از بخش Patterns پنل FarazSMS.'],
      ['smsOtpPatternAttr', 'نام متغیر الگو', 'code', 'نام متغیر داخل متن الگو؛ مقدار پیش‌فرض code است. مثال: «کد ورود: %code%» یعنی نام متغیر code است.'],
    ],
  },
  {
    title: 'Hesabfa API',
    status: 'hesabfa' as const,
    fields: [
      ['hesabfaApiUrl', 'آدرس API', 'https://api.hesabfa.com/v1', 'آدرس پایه API حسابفا.'],
      ['hesabfaApiKey', 'کلید API', 'مقدار جدید', 'کلید API دریافت‌شده از تنظیمات API حسابفا.'],
      ['hesabfaLoginToken', 'Login Token', 'مقدار جدید', 'توکن ورود کسب‌وکار در API حسابفا.'],
      ['hesabfaHookPassword', 'رمز Webhook', 'مقدار جدید', 'رمز مشترک برای ثبت و اعتبارسنجی درخواست‌های Webhook حسابفا.'],
      ['hesabfaBankCode', 'کد بانک', 'مقدار جدید', 'کد بانک حسابفا برای ثبت پرداخت فاکتورهای آنلاین.'],
      ['hesabfaPurchaseContactCode', 'کد مخاطب خرید', 'مقدار جدید', 'کد مخاطب تأمین‌کننده/فروشنده در حسابفا برای فاکتور خرید با invoiceType=1؛ هنگام ذخیره موجودی محصول از پنل مدیریت استفاده می‌شود.'],
    ],
  },
  {
    title: 'درگاه پرداخت Zibal',
    status: 'zibal' as const,
    fields: [['zibalMerchant', 'Merchant', 'مقدار جدید', 'کد Merchant از پنل زیبال. برای پرداخت آزمایشی و Sandbox مقدار «zibal» را وارد کنید.']],
  },
] as const;

type FieldKey = (typeof groups)[number]['fields'][number][0];

export default function SystemSettingsForm({ initial }: { initial: SystemSettingsVM }) {
  const router = useRouter();
  const notify = useCartUI((state) => state.notify);
  const [values, setValues] = useState<Partial<Record<FieldKey, string>>>({});
  const [clear, setClear] = useState<Partial<Record<FieldKey, boolean>>>({});
  const [username, setUsername] = useState(initial.username);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [pending, startTransition] = useTransition();

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    setSuccess(false);
    const replacements: Partial<Record<FieldKey, string | null>> = {};
    for (const group of groups) for (const [key] of group.fields) {
      if (clear[key]) replacements[key] = null;
      else if (values[key]?.trim()) replacements[key] = values[key]!.trim();
    }
    startTransition(async () => {
      const result = await updateSystemSettings({
        currentPassword,
        values: replacements,
        username,
        newPassword,
        confirmPassword,
      });
      if (!result.ok) {
        setError(result.error);
        notify({
          variant: 'error',
          title: 'ذخیره تنظیمات ناموفق بود',
          description: result.error,
        });
        return;
      }
      if (result.data.credentialsChanged) {
        notify({
          variant: 'warning',
          title: 'اطلاعات ورود تغییر کرد',
          description: 'برای حفظ امنیت، همه نشست‌های مدیریت بسته شدند. دوباره وارد شوید.',
        });
        router.replace('/admin/login');
        router.refresh();
        return;
      }
      setValues({});
      setClear({});
      setCurrentPassword('');
      setSuccess(true);
      notify({
        variant: 'success',
        title: 'تنظیمات ذخیره شد',
        description: 'مقادیر جدید با موفقیت و به‌صورت رمزنگاری‌شده ذخیره شدند.',
      });
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-6" autoComplete="off">
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        مقادیر ذخیره‌شده هرگز نمایش داده نمی‌شوند. فیلد خالی بدون تغییر می‌ماند؛ برای حذف، گزینه حذف را انتخاب کنید.
      </div>
      {error && <FormError message={error} />}
      {success && <FormSuccess message="تنظیمات با موفقیت ذخیره شد." />}

      {groups.map((group) => (
        <Card key={group.title} className="overflow-hidden">
          <CardHeader title={group.title} description={initial.configured[group.status] ? 'پیکربندی شده' : 'پیکربندی نشده'} />
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            {group.fields.map(([key, label, placeholder, description]) => (
              <div key={key}>
                <Label>{label}</Label>
                <Input
                  dir="ltr"
                  type="password"
                  value={values[key] ?? ''}
                  disabled={Boolean(clear[key])}
                  placeholder={placeholder}
                  onChange={(e) => setValues((old) => ({ ...old, [key]: e.target.value }))}
                />
                <p className="mt-1.5 text-xs leading-5 text-gray-500">{description}</p>
                <label className="mt-2 flex items-center gap-2 text-xs text-red-700">
                  <input type="checkbox" checked={Boolean(clear[key])} onChange={(e) => setClear((old) => ({ ...old, [key]: e.target.checked }))} />
                  حذف مقدار ذخیره‌شده
                </label>
              </div>
            ))}
          </div>
        </Card>
      ))}

      <Card className="overflow-hidden">
        <CardHeader title="اطلاعات ورود مدیر ارشد" description="تغییر رمز باعث خروج از همه نشست‌های مدیریت می‌شود." />
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <div><Label>نام کاربری</Label><Input dir="ltr" value={username} onChange={(e) => setUsername(e.target.value)} /></div>
          <div><Label>رمز عبور جدید</Label><Input dir="ltr" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} autoComplete="new-password" /></div>
          <div><Label>تکرار رمز عبور جدید</Label><Input dir="ltr" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password" /></div>
        </div>
      </Card>

      <Card className="p-5">
        <Label>رمز عبور فعلی برای تأیید تغییرات</Label>
        <Input dir="ltr" type="password" required value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} autoComplete="current-password" />
      </Card>
      <Button type="submit" disabled={pending}>{pending ? 'در حال ذخیره…' : 'ذخیره امن تنظیمات'}</Button>
    </form>
  );
}
