'use client';

import { useState, useTransition } from 'react';
import {
  updateInvoiceContent,
  type InvoiceContentVM,
} from '@/actions/admin-invoice-content';
import {
  Button,
  Card,
  CardHeader,
  FormError,
  FormSuccess,
  Input,
  Label,
} from '@/src/components/admin/AdminUI';
import RichTextEditor from '@/src/components/admin/RichTextEditor';
import { useCartUI } from '@/src/store/cart-ui';

type TextFieldProps = {
  label: string;
  field: Exclude<keyof InvoiceContentVM, 'description'>;
  value: string;
  placeholder?: string;
  dir?: 'ltr' | 'rtl';
  type?: 'text' | 'url' | 'tel';
  onChange: (field: Exclude<keyof InvoiceContentVM, 'description'>, value: string) => void;
};

function TextField({
  label,
  field,
  value,
  placeholder,
  dir = 'rtl',
  type = 'text',
  onChange,
}: TextFieldProps) {
  return (
    <div>
      <Label>{label}</Label>
      <Input
        required
        type={type}
        dir={dir}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(field, event.target.value)}
      />
    </div>
  );
}

export default function InvoiceContentForm({ initial }: { initial: InvoiceContentVM }) {
  const notify = useCartUI((state) => state.notify);
  const [form, setForm] = useState(initial);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [pending, startTransition] = useTransition();

  function set<K extends keyof InvoiceContentVM>(key: K, value: InvoiceContentVM[K]) {
    setForm((previous) => ({ ...previous, [key]: value }));
  }

  function setTextField(
    field: Exclude<keyof InvoiceContentVM, 'description'>,
    value: string,
  ) {
    set(field, value);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    setSuccess(false);
    startTransition(async () => {
      const result = await updateInvoiceContent(form);
      if (!result.ok) {
        setError(result.error);
        notify({ variant: 'error', title: 'خطا', description: result.error });
        return;
      }
      setSuccess(true);
      notify({
        variant: 'success',
        title: 'ذخیره موفق',
        description: 'محتوای فاکتور با موفقیت ذخیره شد.',
      });
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <FormError message={error} />}
      {success && <FormSuccess message="محتوای فاکتور با موفقیت ذخیره شد." />}

      <Card className="overflow-hidden">
        <CardHeader
          title="هویت فروشگاه"
          description="لوگوی فاکتور به‌صورت خودکار از لوگوی فعلی سایت خوانده می‌شود."
        />
        <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
          <TextField label="نام برند" field="brandName" value={form.brandName} onChange={setTextField} />
          <TextField label="نام فروشگاه" field="storeName" value={form.storeName} onChange={setTextField} />
          <TextField label="متن وب‌سایت" field="website" value={form.website} dir="ltr" placeholder="WWW.CARKHODRO.com" onChange={setTextField} />
          <TextField label="لینک وب‌سایت" field="websiteUrl" value={form.websiteUrl} type="url" dir="ltr" placeholder="https://carkhodro.com" onChange={setTextField} />
        </div>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader title="نشانی و تماس فروشنده" />
        <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3 sm:p-6">
          <TextField label="کشور" field="country" value={form.country} onChange={setTextField} />
          <TextField label="استان" field="province" value={form.province} onChange={setTextField} />
          <TextField label="شهر" field="city" value={form.city} onChange={setTextField} />
          <TextField label="کدپستی" field="postalCode" value={form.postalCode} dir="ltr" onChange={setTextField} />
          <TextField label="تلفن" field="phone" value={form.phone} type="tel" dir="ltr" onChange={setTextField} />
          <div className="sm:col-span-2 lg:col-span-3">
            <TextField label="آدرس" field="address" value={form.address} onChange={setTextField} />
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader title="اطلاعات پرداخت" />
        <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
          <TextField label="نام بانک" field="bankName" value={form.bankName} onChange={setTextField} />
          <TextField label="نام صاحب حساب" field="bankAccountHolder" value={form.bankAccountHolder} onChange={setTextField} />
          <TextField label="شماره کارت" field="cardNumber" value={form.cardNumber} dir="ltr" onChange={setTextField} />
          <TextField label="شماره شبا" field="sheba" value={form.sheba} dir="ltr" onChange={setTextField} />
        </div>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader
          title="توضیحات فاکتور"
          description="این متن به‌جای توضیحات دسته‌بندی و متن اعتماد قبلی، در پایین فاکتور نمایش داده می‌شود."
        />
        <div className="p-5 sm:p-6">
          <RichTextEditor
            value={form.description}
            onChange={(html) => set('description', html)}
            placeholder="توضیحات پایین فاکتور را بنویسید…"
          />
        </div>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? 'در حال ذخیره…' : 'ذخیره محتوای فاکتور'}
        </Button>
      </div>
    </form>
  );
}
