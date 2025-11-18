/**
 * Dashboard Page
 * Server component - INSTANT LOAD with client-side data streaming
 */

import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/config';
import { DashboardClient } from '@/components/dashboard/DashboardClient';

// Disable caching for real-time data
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function DashboardPage(): Promise<JSX.Element> {
  // Only check auth - NO database queries (instant load!)
  const session = await auth();

  if (!session || !session.user) {
    redirect('/auth/signin?callbackUrl=/dashboard');
  }

  // Page loads INSTANTLY - data loads on client side
  return <DashboardClient />;
}

