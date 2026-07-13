/**
 * Retail cart stock validation before checkout.
 */

export interface CartStockIssue {
  productName: string;
  /** Units still available (never negative). */
  remaining: number;
  requested: number;
}

export function collectCartStockIssues(
  items: { name: string; quantity: number; stock: number }[],
): CartStockIssue[] {
  return items
    .filter((item) => item.stock < item.quantity)
    .map((item) => ({
      productName: item.name,
      remaining: Math.max(0, item.stock),
      requested: item.quantity,
    }));
}

/** One line per product — shown together when multiple lines fail. */
export function formatCartStockIssues(issues: CartStockIssue[]): string {
  return issues
    .map(
      (i) =>
        `موجودی «${i.productName}» کافی نیست. ${i.remaining.toLocaleString('fa-IR')} عدد باقی‌مانده است.`,
    )
    .join('\n');
}
