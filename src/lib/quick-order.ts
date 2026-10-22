export function quickOrderQuantity(value: string, cap: number | null): number | null {
  if (!/^\d+$/.test(value)) return null;
  const quantity = Number(value);
  if (!Number.isSafeInteger(quantity) || quantity < 1 || (cap !== null && quantity > cap)) return null;
  return quantity;
}

export function quickOrderRowIndex(index: number, direction: -1 | 1, length: number): number {
  return length === 0 ? -1 : Math.max(0, Math.min(length - 1, index + direction));
}
