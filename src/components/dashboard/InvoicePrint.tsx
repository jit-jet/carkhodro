import Image from 'next/image';
import type { InvoiceVM } from '@/src/lib/dashboard-types';
import { INVOICE_SELLER } from '@/src/lib/invoice-seller';
import {
  formatNumberFa,
  noFormatNumberFa,
  rialInWords,
  RIAL_PER_TOMAN,
} from '@/src/lib/format';

interface Props {
  invoice: InvoiceVM;
}

function rialAmt(toman: number): string {
  return formatNumberFa(toman * RIAL_PER_TOMAN);
}

function balanceLabel(toman: number): string {
  const abs = Math.abs(toman);
  if (abs === 0) return '۰ ریال';
  return `${formatNumberFa(abs * RIAL_PER_TOMAN)} ریال بدهکار`;
}

export default function InvoicePrint({ invoice }: Props) {
  const s = INVOICE_SELLER;
  const buyerAddress = [invoice.address.province, invoice.address.city, invoice.address.street]
    .filter(Boolean)
    .join('، ');

  const discountToman = invoice.lines.reduce(
    (sum, line) => sum + (line.lineGrossToman - line.lineNetToman),
    0,
  );
  const balanceWithInvoice = invoice.previousBalanceToman + invoice.payableToman;

  return (
    <article dir="rtl" className="inv">
      {/* ── Header: logo RIGHT · title CENTER · meta LEFT ── */}
      <div className="inv-header">
        <div className="inv-header-logo">
          <Image src="/logo.png" alt={s.brandName} width={78} height={78} className="inv-logo" priority />
          <p className="inv-website">{s.website}</p>
        </div>

        <div className="inv-header-center">
          <p className="inv-brand">{s.brandName}</p>
          <p className="inv-store">{s.storeName}</p>
          <p className="inv-title">فاکتور فروش</p>
        </div>

        <div className="inv-header-meta">
          <p>
            <span>شماره</span> <b>{noFormatNumberFa(invoice.orderNumber)}</b>
          </p>
          <p>
            <span>تاریخ</span> <b>{invoice.dateSlash}</b>
          </p>
        </div>
      </div>

      {/* ── Seller box ── */}
      <section className="inv-box">
        <div className="inv-box-row inv-box-row-5">
          <span>
            فروشنده: <b>{s.brandName}</b>
          </span>
          <span>
            کشور: <b>{s.country}</b>
          </span>
          <span>
            استان: <b>{s.province}</b>
          </span>
          <span>
            شهر: <b>{s.city}</b>
          </span>
          <span>
            کدپستی: <b>{s.postalCode}</b>
          </span>
        </div>
        <div className="inv-box-row inv-box-row-addr">
          <span className="inv-addr">
            آدرس: <b>{s.address}</b>
          </span>
          <span>
            تلفن: <b>{s.phone}</b>
          </span>
        </div>
      </section>

      {/* ── Buyer box ── */}
      <section className="inv-box">
        <div className="inv-box-row inv-box-row-4">
          <span>
            خریدار: <b>{invoice.buyerName}</b>
          </span>
          <span>
            تلفن: <b> </b>
          </span>
          <span>
            موبایل: <b dir="ltr">{invoice.phoneNumber}</b>
          </span>
          <span className="inv-addr">
            آدرس: <b>{buyerAddress}</b>
          </span>
        </div>
      </section>

      {/* ── Items table ── */}
      <table className="inv-table">
        <thead>
          <tr>
            <th className="c-num">#</th>
            <th className="c-desc">شرح</th>
            <th className="c-qty">تعداد</th>
            <th className="c-unit">واحد</th>
            <th className="c-price">مبلغ واحد</th>
            <th className="c-amt">مبلغ</th>
            <th className="c-disc">تخفیف</th>
            <th className="c-total">مبلغ کل</th>
          </tr>
        </thead>
        <tbody>
          {invoice.lines.map((line) => {
            const disc = line.lineGrossToman - line.lineNetToman;
            return (
              <tr key={line.rowNo}>
                <td className="c-num">{formatNumberFa(line.rowNo)}</td>
                <td className="c-desc">{line.name}</td>
                <td className="c-qty">{formatNumberFa(line.quantity)}</td>
                <td className="c-unit" />
                <td className="c-price">{rialAmt(line.unitPriceToman)}</td>
                <td className="c-amt">{rialAmt(line.lineGrossToman)}</td>
                <td className="c-disc">{rialAmt(disc)}</td>
                <td className="c-total">{rialAmt(line.lineNetToman)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* ── Below table (paper LTR coords): totals LEFT · sign CENTER · words/balance RIGHT ──
          With dir=rtl, first grid col renders on the right. */}
      <div className="inv-summary">
        <div className="inv-summary-balance">
          <p className="inv-words">
            مبلغ کل: <b>{rialInWords(invoice.payableToman)}</b>
          </p>
          {!invoice.isRetail && (
            <>
              <p>
                مانده حساب از قبل: <b>{balanceLabel(invoice.previousBalanceToman)}</b>
              </p>
              <p>
                با احتساب فاکتور: <b>{balanceLabel(balanceWithInvoice)}</b>
              </p>
            </>
          )}
        </div>

        <div className="inv-sign">امضای فروشنده</div>

        <div className="inv-totals">
          <div className="inv-totals-row">
            <span>تعداد</span>
            <span>{formatNumberFa(invoice.totalItems)}</span>
          </div>
          <div className="inv-totals-row">
            <span>مبلغ</span>
            <span>{rialAmt(invoice.subtotalToman)} ریال</span>
          </div>
          <div className="inv-totals-row">
            <span>تخفیف</span>
            <span>{rialAmt(discountToman)} ریال</span>
          </div>
          <div className="inv-totals-row inv-totals-final">
            <span>مبلغ کل</span>
            <span>{rialAmt(invoice.payableToman)} ریال</span>
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="inv-footer">
        <p>{s.categoriesNote}</p>
        <p>{s.trustNote}</p>
        <p>
          بانک: {s.bankName} — نام: {s.bankAccountHolder}
        </p>
        <p>
          شماره کارت: <b dir="ltr">{s.cardNumber}</b>
          {'  '}
          شماره شبا: <b dir="ltr">{s.sheba}</b>
        </p>
      </div>
    </article>
  );
}
