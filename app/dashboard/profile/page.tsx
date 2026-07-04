/**
 * My profile — «پروفایل من».
 * Editable account + address fields and avatar; read-only username/mobile/code/
 * user-type. Per-user data streams inside <Suspense>.
 */

import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { getProfile } from '@/actions/partner-profile';
import { getProvinces } from '@/actions/locations';
import ProfileForm from '@/src/components/dashboard/ProfileForm';

export const metadata: Metadata = {
  title: 'پروفایل من | پنل همکاران کارخودرو',
};

export default function ProfilePage() {
  return (
    <Suspense fallback={<ProfileSkeleton />}>
      <ProfileContent />
    </Suspense>
  );
}

async function ProfileContent() {
  const [profile, provinces] = await Promise.all([getProfile(), getProvinces()]);
  if (!profile) redirect('/login?redirect=/dashboard/profile');
  return <ProfileForm profile={profile} provinces={provinces} />;
}

function ProfileSkeleton() {
  return <div className="bg-white rounded-2xl border border-gray-100 shadow-sm h-[36rem] animate-pulse" />;
}
