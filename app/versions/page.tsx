/**
 * Versions List Page
 * Server component - INSTANT LOAD with client-side data streaming
 */

import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/config';
import { VersionList } from '@/components/versions/VersionList';
import { AuthenticatedLayout } from '@/components/layout/AuthenticatedLayout';

// Disable caching for real-time data
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function VersionsPage() {
  // Only check auth - NO database queries (instant load!)
  const session = await auth();

  if (!session || !session.user) {
    redirect('/auth/signin?callbackUrl=/versions');
  }

  // Page loads INSTANTLY - data loads on client side
  return (
    <AuthenticatedLayout>
      <div className="container mx-auto py-6 px-4">
        <VersionList />
      </div>
    </AuthenticatedLayout>
  );
}

