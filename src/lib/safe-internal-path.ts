/**
 * Guard against open redirects: only allow same-origin relative paths.
 * Rejects protocol-relative (`//evil.com`) and absolute URLs.
 */
export function safeInternalPath(
  path: string | null | undefined,
  fallback: string,
): string {
  if (!path || !path.startsWith('/') || path.startsWith('//') || path.includes('://')) {
    return fallback;
  }
  return path;
}
