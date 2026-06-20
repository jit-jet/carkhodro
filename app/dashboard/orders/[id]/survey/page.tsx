/**
 * Order survey — «نظر سنجی».
 * Per-invoice star rating + positive/negative checkbox groups + free-text note.
 * Pre-filled from any existing survey. Scoped to the owner; streams in <Suspense>.
 */

import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getSurvey } from '@/actions/surveys';
import SurveyForm from '@/src/components/dashboard/SurveyForm';

export const metadata: Metadata = {
  title: 'نظرسنجی | پنل همکاران اسکار',
};

export default function SurveyPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<SurveySkeleton />}>
      <SurveyContent params={params} />
    </Suspense>
  );
}

async function SurveyContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const survey = await getSurvey(id);
  if (!survey) notFound();
  return <SurveyForm survey={survey} />;
}

function SurveySkeleton() {
  return <div className="bg-white rounded-2xl border border-gray-100 shadow-sm h-[32rem] animate-pulse" />;
}
