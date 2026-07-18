/**
 * Shared admin-panel option constants. Lives in a directive-free module (not
 * a `'use server'` action file, which may only export async functions) so
 * both the actions and Client Components can import these plain values —
 * mirrors `src/lib/dashboard-options.ts`.
 */

import type { UserRole } from '@/generated/prisma_client';

/** Roles an admin may assign from the users list. ADMIN/SUPPORT are managed separately. */
export const ASSIGNABLE_ROLES: UserRole[] = ['RETAIL', 'WHOLESALE'];
