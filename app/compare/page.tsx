/**
 * Compare Page
 * Server component - INSTANT LOAD with client-side data streaming
 */

import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/config';
import { CompareClient } from '@/components/compare/CompareClient';
import { AuthenticatedLayout } from '@/components/layout/AuthenticatedLayout';

// Disable caching for real-time data
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ComparePage(): Promise<JSX.Element> {
  // Only check auth - NO database queries (instant load!)
  const session = await auth();

  if (!session || !session.user) {
    redirect('/auth/signin?callbackUrl=/compare');
  }

  // Page loads INSTANTLY - data loads on client side
  return (
    <AuthenticatedLayout>
      <div className="container mx-auto py-6 px-4">
        <CompareClient />
      </div>
    </AuthenticatedLayout>
  );
}
