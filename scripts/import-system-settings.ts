/**
 * One-time migration helper. Run after the database migration and after setting
 * SYSTEM_SETTINGS_ENCRYPTION_KEY. Normal application runtime never reads these
 * legacy integration variables.
 */
import 'dotenv/config';
import { prisma } from '@/src/lib/prisma';
import { updateSystemConfig } from '@/src/lib/system-settings';

async function main() {
  const superAdmin = await prisma.user.findFirst({
    where: { role: 'ADMIN', isSuperAdmin: true },
    select: { id: true },
  });
  if (!superAdmin) throw new Error('No Super Admin exists. Run the admin seed first.');

  await updateSystemConfig({
    smsApiBaseUrl: process.env.SMS_API_BASE_URL ?? 'https://api.iranpayamak.com',
    smsApiKey: process.env.SMS_API_KEY ?? '',
    smsLineNumber: process.env.SMS_LINE_NUMBER ?? '',
    smsOtpPatternCode: process.env.SMS_OTP_PATTERN_CODE ?? '',
    smsOtpPatternAttr: process.env.SMS_OTP_PATTERN_ATTR ?? 'code',
    hesabfaApiUrl: process.env.HESABFA_API_URL ?? 'https://api.hesabfa.com/v1',
    hesabfaApiKey: process.env.HESABFA_API_KEY ?? '',
    hesabfaLoginToken: process.env.HESABFA_LOGIN_TOKEN ?? '',
    hesabfaHookPassword: process.env.HESABFA_HOOK_PASSWORD ?? '',
    hesabfaBankCode: process.env.HESABFA_BANK_CODE ?? '',
    hesabfaPurchaseContactCode: process.env.HESABFA_PURCHASE_CONTACT_CODE ?? '',
    zibalMerchant: process.env.ZIBAL_MERCHANT ?? '',
  }, superAdmin.id);
  console.log('System settings imported and encrypted. Remove the legacy integration variables from the deployment environment.');
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : 'System settings import failed.');
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
