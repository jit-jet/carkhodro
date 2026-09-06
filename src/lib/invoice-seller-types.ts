export interface InvoiceContent {
  brandName: string;
  storeName: string;
  website: string;
  websiteUrl: string;
  country: string;
  province: string;
  city: string;
  postalCode: string;
  address: string;
  phone: string;
  description: string;
  bankName: string;
  bankAccountHolder: string;
  cardNumber: string;
  sheba: string;
}

/** Printable data: admin-authored invoice content + the current site logo. */
export interface InvoiceSeller extends InvoiceContent {
  logoUrl: string;
}
