/**
 * Normalize a user-entered slug to URL-safe ascii: lowercase, hyphens, a-z0-9.
 * Returns empty string when nothing usable remains (caller should require input).
 */
export function normalizeSlug(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-_]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}
