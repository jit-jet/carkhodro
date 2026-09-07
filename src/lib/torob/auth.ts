import { createPublicKey, verify, type KeyObject } from 'node:crypto';

const TOROB_PUBLIC_KEY_PEM = `-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEAt6Mu4T0pBORY11W+QeM35UsmLO3vsf+6yKpFDEImFk0=
-----END PUBLIC KEY-----`;

const TOROB_PUBLIC_KEY = createPublicKey(TOROB_PUBLIC_KEY_PEM);

interface JwtHeader {
  alg?: unknown;
}

interface JwtPayload {
  aud?: unknown;
  exp?: unknown;
  nbf?: unknown;
}

export type TorobAuthResult =
  | { ok: true }
  | { ok: false; error: 'missing_token' | 'unsupported_token_version' | 'invalid_token' };

function parseSegment<T>(segment: string): T | null {
  if (!segment || !/^[A-Za-z0-9_-]+$/.test(segment)) return null;
  try {
    return JSON.parse(Buffer.from(segment, 'base64url').toString('utf8')) as T;
  } catch {
    return null;
  }
}

function hasAudience(aud: unknown, expectedAudience: string): boolean {
  if (typeof aud === 'string') return aud === expectedAudience;
  return Array.isArray(aud) && aud.some((value) => value === expectedAudience);
}

/**
 * Verifies Torob's Ed25519 signature and required time/audience claims.
 * The optional arguments exist so the verifier can be tested without changing
 * the official production key or relying on wall-clock time.
 */
export function verifyTorobJwt(
  token: string,
  expectedAudience: string,
  options: { publicKey?: KeyObject; nowSeconds?: number } = {},
): boolean {
  const segments = token.split('.');
  if (segments.length !== 3) return false;

  const [encodedHeader, encodedPayload, encodedSignature] = segments;
  const header = parseSegment<JwtHeader>(encodedHeader);
  const payload = parseSegment<JwtPayload>(encodedPayload);
  if (!header || !payload || header.alg !== 'EdDSA') return false;
  if (
    typeof payload.exp !== 'number' ||
    !Number.isFinite(payload.exp) ||
    typeof payload.nbf !== 'number' ||
    !Number.isFinite(payload.nbf) ||
    !hasAudience(payload.aud, expectedAudience)
  ) {
    return false;
  }

  const now = options.nowSeconds ?? Math.floor(Date.now() / 1000);
  if (now >= payload.exp || now < payload.nbf) return false;

  try {
    const signature = Buffer.from(encodedSignature, 'base64url');
    return verify(
      null,
      Buffer.from(`${encodedHeader}.${encodedPayload}`),
      options.publicKey ?? TOROB_PUBLIC_KEY,
      signature,
    );
  } catch {
    return false;
  }
}

export function authenticateTorobRequest(request: Request): TorobAuthResult {
  const version = request.headers.get('x-torob-token-version');
  if (version !== '1') return { ok: false, error: 'unsupported_token_version' };

  const token = request.headers.get('x-torob-token');
  if (!token) return { ok: false, error: 'missing_token' };

  // Torob defines `aud` as the exact Host header, including a non-default port.
  const audience = request.headers.get('host') ?? new URL(request.url).host;
  if (!verifyTorobJwt(token, audience)) return { ok: false, error: 'invalid_token' };

  return { ok: true };
}
