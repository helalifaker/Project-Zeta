/**
 * Create Version Page
 * Page for creating a new version
 */

import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/config';
import { VersionForm } from '@/components/versions/VersionForm';
import { AuthenticatedLayout } from '@/components/layout/AuthenticatedLayout';

export default async function CreateVersionPage() {
  // Authentication required (ADMIN or PLANNER only)
  const session = await auth();

  if (!session || !session.user) {
    redirect('/auth/signin?callbackUrl=/versions/new');
  }

  // Check permissions
  if (session.user.role !== 'ADMIN' && session.user.role !== 'PLANNER') {
    redirect('/versions');
  }

  return (
    <AuthenticatedLayout>
      <div className="container mx-auto py-6 px-4 max-w-4xl">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Create New Version</h1>
            <p className="text-muted-foreground mt-2">
              Create a new financial planning version
            </p>
          </div>
          <VersionForm />
        </div>
      </div>
    </AuthenticatedLayout>
  );
}

