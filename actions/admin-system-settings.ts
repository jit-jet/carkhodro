'use server';

import { prisma } from '@/src/lib/prisma';
import { getCurrentAdmin } from '@/src/lib/admin-session';
import { hashPassword, verifyPassword } from '@/src/lib/password';
import {
  getSystemConfig,
  systemConfigStatus,
  updateSystemConfig,
  type SystemConfigPatch,
} from '@/src/lib/system-settings';
import { fail, ok, runMutation, type ActionResult } from '@/src/lib/result';

export interface SystemSettingsVM {
  username: string;
  configured: ReturnType<typeof systemConfigStatus>;
}

export interface UpdateSystemSettingsInput {
  currentPassword: string;
  values?: SystemConfigPatch;
  username?: string;
  newPassword?: string;
  confirmPassword?: string;
}

async function currentSuperAdmin() {
  const admin = await getCurrentAdmin();
  return admin?.isSuperAdmin ? admin : null;
}

export async function getSystemSettings(): Promise<SystemSettingsVM | null> {
  const admin = await currentSuperAdmin();
  if (!admin?.username) return null;
  const config = await getSystemConfig();
  return { username: admin.username, configured: systemConfigStatus(config) };
}

export async function updateSystemSettings(
  input: UpdateSystemSettingsInput,
): Promise<ActionResult<{ credentialsChanged: boolean; configured: SystemSettingsVM['configured'] }>> {
  return runMutation('updateSystemSettings', async () => {
    const admin = await currentSuperAdmin();
    if (!admin?.username) return fail('دسترسی غیرمجاز.');

    if (!input || typeof input !== 'object' || typeof input.currentPassword !== 'string') {
      return fail('درخواست نامعتبر است.');
    }
    if (input.username !== undefined && typeof input.username !== 'string') {
      return fail('درخواست نامعتبر است.');
    }
    if (input.newPassword !== undefined && typeof input.newPassword !== 'string') {
      return fail('درخواست نامعتبر است.');
    }
    if (input.confirmPassword !== undefined && typeof input.confirmPassword !== 'string') {
      return fail('درخواست نامعتبر است.');
    }
    if (
      input.values !== undefined &&
      (!input.values || typeof input.values !== 'object' || Array.isArray(input.values))
    ) {
      return fail('درخواست نامعتبر است.');
    }

    if (!(await verifyPassword(input.currentPassword, admin.passwordHash))) {
      return fail('رمز عبور فعلی صحیح نیست.');
    }

    const nextUsername = input.username?.trim();
    if (nextUsername !== undefined && !/^[A-Za-z0-9_.-]{3,64}$/.test(nextUsername)) {
      return fail('نام کاربری باید ۳ تا ۶۴ نویسه و فقط شامل حروف انگلیسی، عدد، نقطه، خط تیره یا زیرخط باشد.');
    }

    const changingPassword = Boolean(input.newPassword || input.confirmPassword);
    if (changingPassword) {
      if (input.newPassword !== input.confirmPassword) return fail('تکرار رمز عبور مطابقت ندارد.');
      if (!input.newPassword || input.newPassword.length < 12) {
        return fail('رمز عبور جدید باید حداقل ۱۲ نویسه باشد.');
      }
      if (input.newPassword === input.currentPassword) {
        return fail('رمز عبور جدید باید با رمز فعلی متفاوت باشد.');
      }
    }

    const credentialsChanged =
      changingPassword || (nextUsername !== undefined && nextUsername !== admin.username);
    const passwordHash = changingPassword ? await hashPassword(input.newPassword!) : undefined;

    if (credentialsChanged) {
      await prisma.user.update({
        where: { id: admin.id },
        data: { username: nextUsername ?? admin.username, passwordHash },
      });
    }

    if (input.values && Object.keys(input.values).length > 0) {
      await updateSystemConfig(input.values, admin.id);
    }
    if (credentialsChanged) {
      await prisma.session.deleteMany({ where: { userId: admin.id } });
    }

    const config = await getSystemConfig();
    return ok({ credentialsChanged, configured: systemConfigStatus(config) });
  });
}
