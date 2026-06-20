/**
 * View-model types for the partner / wholesaler dashboard.
 * ─────────────────────────────────────────────────────────
 * Plain, JSON-safe shapes returned by the dashboard Server Actions and consumed
 * by the pages and Client Components. Kept in a directive-free module (not in a
 * `'use server'` action file) so both server and client code can import the
 * types without pulling server code into a client bundle.
 *
 * Money fields are suffixed `Toman` and carry the same magnitude as the rest of
 * the catalogue (Toman); the UI renders Rial via `formatRial` and the payable in
 * words via `tomanInWords` (see `src/lib/format.ts`).
 */

import type { OrderStatus } from '@/generated/prisma_client';

// ── Dashboard home (stats) ───────────────────────────────────────────────────

export interface DashboardStatsVM {
  fullName: string;
  shopName: string;
  userType: string; // Persian role label
  partnerCode: string | null;
  profileImage: string | null;
  hasAvatar: boolean;
  accountBalanceToman: number;
  completedOrders: number;
  inProgressOrders: number;
  totalOrders: number;
  cartItemCount: number;
  backorderCount: number;
  favoritesCount: number;
  lastInvoice: { id: string; orderNumber: number; date: string } | null;
}

// ── Partner cart / invoice builder ───────────────────────────────────────────

export interface PartnerCartLineVM {
  id: string; // cart item id
  productId: string;
  sku: string;
  name: string;
  unitPriceToman: number; // list price (Toman)
  discountPct: number; // wholesale/cash discount applied to this line
  quantity: number;
  stock: number;
  lineTotalToman: number; // unit × qty after discount
}

export interface PartnerCartVM {
  id: string;
  lines: PartnerCartLineVM[];
  subtotalToman: number; // sum of line totals (after discounts)
  totalItems: number;
}

export interface InvoiceSearchResultVM {
  id: string;
  sku: string;
  name: string;
  priceToman: number;
  discountPct: number;
  packQuantity: number;
  cartonQuantity: number;
  stock: number;
}

// ── Orders list + invoice detail ─────────────────────────────────────────────

export interface OrderListItemVM {
  id: string;
  orderNumber: number;
  status: OrderStatus;
  statusLabel: string;
  dateFull: string; // weekday + Jalali date + time
  totalToman: number;
  itemCount: number;
  hasSurvey: boolean;
}

export interface OrdersPageVM {
  items: OrderListItemVM[];
  total: number;
  page: number;
  perPage: number;
  pageCount: number;
}

export interface InvoiceLineVM {
  rowNo: number;
  sku: string;
  name: string;
  unitPriceToman: number; // price charged (before line discount)
  quantity: number;
  discountPct: number;
  lineGrossToman: number; // unit × qty
  lineNetToman: number; // after discount
}

export interface InvoiceVM {
  id: string;
  orderNumber: number;
  status: OrderStatus;
  statusLabel: string;
  date: string; // Jalali date
  time: string;
  paymentTerms: string | null;
  notes: string | null;
  buyerName: string;
  phoneNumber: string;
  address: { province: string; city: string; street: string; postalCode: string };
  lines: InvoiceLineVM[];
  totalItems: number;
  subtotalToman: number; // gross
  discountToman: number;
  payableToman: number; // net
  previousBalanceToman: number;
  hasSurvey: boolean;
}

// ── Survey ───────────────────────────────────────────────────────────────────

export interface SurveyVM {
  orderId: string;
  orderNumber: number;
  rating: number;
  positivePoints: string[]; // selected option keys
  negativePoints: string[];
  note: string | null;
  submittedAt: string | null; // null when not yet submitted
}

// ── Support messaging ────────────────────────────────────────────────────────

export type MessageFolder = 'inbox' | 'sent' | 'deleted';

export interface SupportMessageVM {
  id: string;
  direction: 'INBOUND' | 'OUTBOUND';
  subject: string;
  body: string;
  isRead: boolean;
  isDeleted: boolean;
  date: string; // Jalali datetime
}

export interface SupportInboxVM {
  inbox: SupportMessageVM[];
  sent: SupportMessageVM[];
  deleted: SupportMessageVM[];
  unreadCount: number;
}

// ── Profile ──────────────────────────────────────────────────────────────────

export interface ProfileVM {
  phoneNumber: string; // read-only (username + mobile)
  firstName: string;
  lastName: string;
  shopName: string;
  referredBy: string;
  activityField: string;
  birthYear: string;
  birthMonth: string;
  birthDay: string;
  province: string;
  city: string;
  street: string;
  postalCode: string;
  profileImage: string | null;
  partnerCode: string | null;
  userType: string; // role label
}

// ── Price list ───────────────────────────────────────────────────────────────

export interface PriceListItemVM {
  sku: string;
  name: string;
  brand: string;
  carType: string;
  priceToman: number;
}

export interface PriceListRequestVM {
  id: string;
  titles: string[];
  partsBrandIds: number[];
  carModelIds: number[];
  createdAt: string; // Jalali datetime
  expiresAt: string; // Jalali datetime
  isExpired: boolean;
  items: PriceListItemVM[];
}

// ── Backorders / pre-orders ──────────────────────────────────────────────────

export interface BackorderVM {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  status: 'PENDING' | 'NOTIFIED' | 'FULFILLED' | 'CANCELLED';
  statusLabel: string;
  inStock: boolean;
  date: string;
}
