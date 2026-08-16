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
  /** Inventory from item/get* (`Stock` field). */
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
  /** Some invoice responses put the code only on the nested Item object. */
  Item?: Pick<HesabfaItem, 'Code'> | null;
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

/** Node in the `setting/getProductCategories` tree (not a flat list). */
export interface HesabfaProductCategoryNode {
  Name?: string;
  FullPath?: string;
  Children?: HesabfaProductCategoryNode[] | null;
}

export interface HesabfaProductCategoryTree {
  Root?: HesabfaProductCategoryNode | null;
}

/** @deprecated Use HesabfaProductCategoryNode — kept for call-site compatibility. */
export type HesabfaProductCategory = HesabfaProductCategoryNode;

/** Payload Hesabfa POSTs to the change-hook URL. */
export interface HesabfaWebhookPayload {
  Password: string;
  Action: number;
  ObjectType: 'Product' | 'Invoice' | 'Contact' | 'WarehouseReceipt' | 'Receipt' | string;
  ObjectIdList: number[];
  /** Non-standard compatibility field; not part of Hesabfa's documented hook body. */
  Extra?: string | null;
}

/** Common Hesabfa action codes observed in docs / change feed. */
export const HESABFA_ACTION = {
  CONTACT_DELETE: 32,
  PRODUCT_DELETE: 53,
} as const;

export const HESABFA_INVOICE_TYPE_SALE = 0;
/** Purchase invoice (فاکتور خرید) — used to add inventory. */
export const HESABFA_INVOICE_TYPE_PURCHASE = 1;
/** Purchase return (برگشت از خرید) — used to reduce inventory. */
export const HESABFA_INVOICE_TYPE_PURCHASE_RETURN = 3;
/** Issue warehouse receipt with the invoice so stock updates. */
export const HESABFA_WAREHOUSE_RECEIPT_ISSUED = 1;
export const HESABFA_CONTACT_TYPE_CUSTOMER = 2;
export const HESABFA_ITEM_TYPE_PRODUCT = 0;
export const HESABFA_CONTACT_NODE_FAMILY = 'اشخاص : مشتریان فروشگاه آنلاین';
export const HESABFA_INVOICE_NOTE = 'فاکتور صادر شده توسط وب سایت کار خودرو';
export const HESABFA_TAG = 'carkhodro';
