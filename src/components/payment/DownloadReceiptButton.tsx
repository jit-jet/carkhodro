'use client';

/**
 * Download-as-PDF button for the receipt page.
 *
 * Follows the same print-to-PDF approach used elsewhere in the app (see the PLP
 * product-list export): it opens a self-contained, print-styled HTML document in
 * a new window and triggers the browser's print dialog, where the user picks
 * "Save as PDF". No PDF library / extra dependency required.
 */

import type { OrderReceiptVM } from '@/src/lib/serializers';
import {
  ORDER_STATUS_FA,
  PAYMENT_STATUS_FA,
  PAYMENT_METHOD_FA,
} from '@/src/lib/order-labels';

function toman(n: number) {
  return n.toLocaleString('fa-IR') + ' تومان';
}

function buildReceiptHtml(receipt: OrderReceiptVM): string {
  const ref = receipt.id.slice(0, 8).toUpperCase();

  const rows = receipt.items
    .map(
      (it, i) => `
      <tr style="background:${i % 2 === 0 ? '#fff' : '#f9fafb'}">
        <td>${i + 1}</td>
        <td>${it.name}</td>
        <td>${it.sku}</td>
        <td>${it.quantity.toLocaleString('fa-IR')}</td>
        <td dir="ltr" style="text-align:left">${toman(it.unitPrice)}</td>
        <td dir="ltr" style="text-align:left">${toman(it.lineTotal)}</td>
      </tr>`,
    )
    .join('');

  return `<!DOCTYPE html>
<html dir="rtl" lang="fa">
<head>
  <meta charset="UTF-8">
  <title>رسید سفارش ${ref} - کارخودرو</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:Tahoma,Arial,sans-serif;direction:rtl;color:#1f2937;padding:24px;font-size:12px}
    .header{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;padding-bottom:14px;border-bottom:3px solid #F4C232}
    .header h1{font-size:18px;font-weight:bold}
    .meta{font-size:11px;color:#6b7280;text-align:left;line-height:1.7}
    .section{margin-bottom:16px}
    .section h2{font-size:13px;font-weight:bold;margin-bottom:6px;color:#111827}
    .grid{display:grid;grid-template-columns:1fr 1fr;gap:4px 24px;font-size:11px;line-height:1.8}
    .grid span{color:#6b7280}
    .grid b{color:#1f2937;font-weight:600}
    table{width:100%;border-collapse:collapse;margin-top:6px}
    thead tr{background:#F4C232}
    th,td{padding:7px 9px;text-align:right;border-bottom:1px solid #e5e7eb}
    th{font-weight:bold}
    .totals{margin-top:12px;margin-right:auto;width:280px;font-size:12px}
    .totals div{display:flex;justify-content:space-between;padding:4px 0}
    .totals .grand{border-top:2px solid #1f2937;margin-top:6px;padding-top:8px;font-weight:bold;font-size:14px}
    .foot{margin-top:28px;text-align:center;font-size:11px;color:#9ca3af}
    @media print{body{padding:0}}
  </style>
</head>
<body>
  <div class="header">
    <h1>رسید سفارش - کارخودرو</h1>
    <div class="meta">
      <div>شماره سفارش: <b>${ref}</b></div>
      <div>تاریخ: ${receipt.createdDate}</div>
    </div>
  </div>

  <div class="section">
    <h2>اطلاعات خریدار و تراکنش</h2>
    <div class="grid">
      <div><span>نام خریدار:</span> <b>${receipt.customerName || '—'}</b></div>
      <div><span>شماره تماس:</span> <b dir="ltr">${receipt.phoneNumber}</b></div>
      <div><span>روش پرداخت:</span> <b>${PAYMENT_METHOD_FA[receipt.paymentMethod]}</b></div>
      <div><span>وضعیت پرداخت:</span> <b>${PAYMENT_STATUS_FA[receipt.paymentStatus]}</b></div>
      <div><span>وضعیت سفارش:</span> <b>${ORDER_STATUS_FA[receipt.status]}</b></div>
    </div>
  </div>

  <div class="section">
    <h2>آدرس تحویل</h2>
    <div class="grid">
      <div><span>استان / شهر:</span> <b>${receipt.address.province}، ${receipt.address.city}</b></div>
      <div><span>کد پستی:</span> <b dir="ltr">${receipt.address.postalCode}</b></div>
      <div style="grid-column:1 / -1"><span>نشانی:</span> <b>${receipt.address.street}</b></div>
    </div>
  </div>

  <div class="section">
    <h2>اقلام سفارش</h2>
    <table>
      <thead>
        <tr>
          <th>#</th><th>نام محصول</th><th>کد</th><th>تعداد</th><th>قیمت واحد</th><th>جمع</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  </div>

  <div class="totals">
    <div><span>جمع کالاها:</span><span dir="ltr">${toman(receipt.subtotal)}</span></div>
    <div><span>هزینه ارسال:</span><span dir="ltr">${toman(receipt.shippingCost)}</span></div>
    ${receipt.taxAmount > 0 ? `<div><span>مالیات:</span><span dir="ltr">${toman(receipt.taxAmount)}</span></div>` : ''}
    ${receipt.discountAmount > 0 ? `<div><span>تخفیف${receipt.discountCode ? ` (${receipt.discountCode})` : ''}:</span><span dir="ltr">− ${toman(receipt.discountAmount)}</span></div>` : ''}
    <div class="grand"><span>مبلغ کل:</span><span dir="ltr">${toman(receipt.totalAmount)}</span></div>
  </div>

  <div class="foot">این رسید به منزله تأیید ثبت سفارش شما در فروشگاه کارخودرو است.</div>
</body>
</html>`;
}

export default function DownloadReceiptButton({ receipt }: { receipt: OrderReceiptVM }) {
  function handleDownload() {
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(buildReceiptHtml(receipt));
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 400);
  }

  return (
    <button
      type="button"
      onClick={handleDownload}
      className="inline-flex items-center justify-center gap-2 bg-accent hover:bg-accent-dark text-charcoal font-semibold px-6 py-3 rounded-xl transition-colors shadow hover:shadow-md"
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
      دانلود PDF
    </button>
  );
}
