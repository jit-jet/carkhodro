import 'server-only';
import { after } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { sendSms } from '@/src/lib/sms-gateway';

export function queuePartnerRegistrationNotification(userId: string): void {
  after(async () => {
    try {
      const [user, settings] = await Promise.all([
        prisma.user.findUnique({ where: { id: userId }, select: { firstName: true, lastName: true } }),
        prisma.siteSetting.findUnique({ where: { id: 1 }, select: { adminSmsNotificationPhone: true } }),
      ]);
      const phone = settings?.adminSmsNotificationPhone?.trim();
      if (!user || !phone) return;
      const url = new URL('/admin/partner-approvals', process.env.NEXT_PUBLIC_APP_URL || 'https://carkhodro.com');
      url.searchParams.set('userId', userId);
      const result = await sendSms(phone, `آقای ${user.firstName} ${user.lastName} به عنوان همکار ثبت نام کرد و منتظر تایید مدیریت است.\n${url}`);
      if (!result.ok) console.error('[partner-registration] SMS delivery failed', { userId });
    } catch (error) {
      console.error('[partner-registration]', error);
    }
  });
}
