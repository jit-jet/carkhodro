/**
 * Pure helpers for Hesabfa category paths / trees (no I/O).
 */

import type { HesabfaProductCategoryNode } from './types';

/** Hesabfa root wrappers — never treated as real store categories. */
export function isHesabfaRootCategoryName(name: string | null | undefined): boolean {
  const n = name?.trim();
  return n === 'کالا' || n === 'کالاها';
}

/**
 * First real segment in a NodeFamily path after skipping «کالا» / «کالاها».
 * e.g. «کالا : کالاها : موتوری : یاتاقان» → «موتوری»
 */
export function topCategoryNameFromNodeFamily(
  nodeFamily: string | null | undefined,
): string | null {
  if (!nodeFamily?.trim()) return null;
  const parts = nodeFamily
    .split(/[:：]/)
    .map((p) => p.trim())
    .filter(Boolean);
  for (const part of parts) {
    if (!isHesabfaRootCategoryName(part)) return part;
  }
  return null;
}

/**
 * Walk past «کالا» / «کالاها» wrappers and return only their direct children
 * (top-level categories). Nested grandchildren are ignored.
 */
export function extractTopLevelCategories(
  root: HesabfaProductCategoryNode | null | undefined,
): HesabfaProductCategoryNode[] {
  if (!root) return [];

  let nodes: HesabfaProductCategoryNode[] = [root];
  while (nodes.length === 1 && isHesabfaRootCategoryName(nodes[0]!.Name)) {
    nodes = [...(nodes[0]!.Children ?? [])];
  }

  const top: HesabfaProductCategoryNode[] = [];
  for (const node of nodes) {
    if (isHesabfaRootCategoryName(node.Name)) {
      for (const child of node.Children ?? []) {
        const name = child.Name?.trim();
        if (name && !isHesabfaRootCategoryName(name)) top.push(child);
      }
      continue;
    }
    const name = node.Name?.trim();
    if (name) top.push(node);
  }
  return top;
}
