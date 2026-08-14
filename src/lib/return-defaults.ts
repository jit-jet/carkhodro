export interface ReturnContentVM {
  body: string;
}

export const DEFAULT_RETURN_CONTENT: ReturnContentVM = {
  body: `
<h2>مهلت مرجوعی</h2>
<p>مشتریان تا <strong>۷ روز کاری</strong> پس از دریافت کالا، در صورت رعایت شرایط زیر، می‌توانند درخواست مرجوعی ثبت نمایند.</p>
<h2>شرایط مرجوعی</h2>
<ul>
  <li>کالا نصب یا استفاده نشده باشد.</li>
  <li>بسته‌بندی اصلی کالا سالم و دست‌نخورده باشد.</li>
  <li>تمام اجزاء، برچسب‌ها و اسناد همراه کالا موجود باشند.</li>
  <li>کالا آسیب‌دیدگی فیزیکی ناشی از خطای خریدار نداشته باشد.</li>
</ul>
<h2>موارد عدم پذیرش مرجوعی</h2>
<ul>
  <li>کالای نصب‌شده یا مورد استفاده قرار گرفته.</li>
  <li>کالاهای آسیب‌دیده توسط خریدار.</li>
  <li>گذشت بیش از ۷ روز از تاریخ دریافت.</li>
</ul>
<h2>فرآیند مرجوعی</h2>
<ol>
  <li>با پشتیبانی تماس بگیرید و کد مرجوعی دریافت کنید.</li>
  <li>کالا را با بسته‌بندی اصلی به آدرس انبار ارسال نمایید.</li>
  <li>پس از بررسی، وجه در ۳ تا ۵ روز کاری به حساب شما بازگشت داده می‌شود.</li>
</ol>
  `.trim(),
};

export function toReturnContentVM(row: { body: string } | null): ReturnContentVM {
  if (!row?.body.trim()) return { ...DEFAULT_RETURN_CONTENT };
  return { body: row.body };
}
