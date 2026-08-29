/** Hesabfa change-hook secret. Environment is the sole source of truth. */
export function getHesabfaHookPassword(): string {
  return process.env.HESABFA_HOOK_PASSWORD?.trim() ?? '';
}
