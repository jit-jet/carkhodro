/**
 * Persian display labels for the `UserRole` enum, shared by the dashboard
 * header, profile page and stats cards. The wholesale/partner role surfaces as
 * «همکار» to match the partner-facing wording used throughout the panel.
 */

import type { UserRole } from '@/generated/prisma_client';

export const USER_ROLE_FA: Record<UserRole, string> = {
  RETAIL: 'مشتری',
  WHOLESALE: 'همکار',
  ADMIN: 'مدیر',
  SUPPORT: 'پشتیبانی',
};
