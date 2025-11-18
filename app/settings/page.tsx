/**
 * Settings Page
 * Server component - INSTANT LOAD with client-side data streaming
 */

import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/config';
import { Settings } from '@/components/settings/Settings';
import { AuthenticatedLayout } from '@/components/layout/AuthenticatedLayout';

// Disable caching for real-time data
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function SettingsPage(): Promise<JSX.Element> {
  // Only check auth and role - NO database queries (instant load!)
  const session = await auth();

  if (!session?.user) {
    redirect('/auth/signin?callbackUrl=/settings');
  }

  // Only ADMIN can access settings
  if (session.user.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  // Page loads INSTANTLY - data loads on client side
  return (
    <AuthenticatedLayout>
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary">Admin Settings</h1>
          <p className="text-text-secondary mt-2">
            Manage global settings, users, and monitor system health
          </p>
        </div>

        <Settings />
      </div>
    </AuthenticatedLayout>
  );
}

