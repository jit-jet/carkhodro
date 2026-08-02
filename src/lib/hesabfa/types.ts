/**
 * Hesabfa API types (PascalCase fields match the API).
 * Docs: https://www.hesabfa.com/help/api
 */

export interface HesabfaResponse<T> {
  Success: boolean;
  Result: T;
  ErrorCode?: number;
  ErrorMessage?: string;
}

export interface HesabfaQueryInfo {
  sortBy?: string;
  sortDesc?: boolean;
  take?: number;
  skip?: number;
  filters?: Array<{
    property: string;
    operator: string;
    value: string | number | boolean;
  }>;
}

export interface HesabfaPagedList<T> {
  List: T[];
  TotalCount: number;
  FilteredCount?: number;
  From?: number;
  To?: number;
}

export interface HesabfaPriceListEntry {
  Title?: string;
  title?: string;
  Currency?: string;
  currency?: string;
  Price?: number;
  price?: number;
}

export interface HesabfaItem {
  Id?: number;
  Code: number | string;
  Name: string;
  Barcode?: string | null;
  ItemType?: number | null;
  Unit?: string | null;
  Stock?: number | null;
  BuyPrice?: number | null;
  SellPrice?: number | null;
  NodeFamily?: string | null;
  Tag?: string | null;
  Description?: string | null;
  ProductCode?: string | null;
  Active?: boolean | null;
  PriceList?: HesabfaPriceListEntry[] | null;
}

export interface HesabfaContact {
  Id?: number;
  Code: number | string;
  Name: string;
  Company?: string | null;
  FirstName?: string | null;
  LastName?: string | null;
  ContactType?: number | null;
  NationalCode?: string | null;
  Address?: string | null;
  City?: string | null;
  State?: string | null;
  PostalCode?: string | null;
  Phone?: string | null;
  Mobile?: string | null;
  Email?: string | null;
  Note?: string | null;
  Tag?: string | null;
  Active?: boolean | null;
  NodeFamily?: string | null;
}

export interface HesabfaInvoiceItem {
  Id?: number;
  RowNumber?: number;
  Description?: string;
  ItemCode?: string | null;
  Unit?: string | null;
  Quantity?: number;
  UnitPrice?: number;
  Discount?: number;
  Tax?: number;
  TotalAmount?: number;
}

export interface HesabfaInvoice {
  Id?: number;
  Number: number | string;
  Reference?: string | null;
  Date?: string;
  DueDate?: string;
  ContactCode?: string | null;
  ContactTitle?: string | null;
  Sum?: number;
  Payable?: number;
  Paid?: number;
  Rest?: number;
  Note?: string | null;
  Sent?: boolean;
  Returned?: boolean;
  InvoiceType?: number;
  Status?: number;
  Tag?: string | null;
  Freight?: number;
  Currency?: string | null;
  InvoiceItems?: HesabfaInvoiceItem[];
}

export interface HesabfaProductCategory {
  Id?: number;
  Name?: string;
  FullPath?: string;
  ParentId?: number | null;
}

/** Payload Hesabfa POSTs to the change-hook URL. */
export interface HesabfaWebhookPayload {
  Password: string;
  Action: number;
  ObjectType: 'Product' | 'Invoice' | 'Contact' | string;
  ObjectIdList: number[];
}

/** Common Hesabfa action codes observed in docs / change feed. */
export const HESABFA_ACTION = {
  CONTACT_DELETE: 32,
  PRODUCT_DELETE: 53,
} as const;

export const HESABFA_INVOICE_TYPE_SALE = 0;
export const HESABFA_CONTACT_TYPE_CUSTOMER = 2;
export const HESABFA_ITEM_TYPE_PRODUCT = 0;
export const HESABFA_CONTACT_NODE_FAMILY = 'مشتریان فروشگاه آنلاین';
export const HESABFA_INVOICE_NOTE = 'فاکتور صادر شده توسط وب سایت کار خودرو';
export const HESABFA_TAG = 'carkhodro';
