/**
 * Version Detail Page
 * Server component for displaying version details
 */

import { redirect, notFound } from 'next/navigation';
import { auth } from '@/lib/auth/config';
import { VersionDetail } from '@/components/versions/VersionDetail';
import { Card } from '@/components/ui/card';
import { AuthenticatedLayout } from '@/components/layout/AuthenticatedLayout';
import { getVersionById } from '@/services/version/read';
import { serializeVersionForClient } from '@/lib/utils/serialize';

interface VersionDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function VersionDetailPage({ params }: VersionDetailPageProps) {
  // Authentication required
  const session = await auth();

  if (!session || !session.user) {
    redirect('/auth/signin?callbackUrl=/versions');
  }

  const { id } = await params;
  const userId = session.user.id;
  const userRole = session.user.role;

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    notFound();
  }

  // Fetch version using service layer (direct database access)
  const result = await getVersionById(id, userId, userRole);

  if (!result.success) {
    if (result.code === 'NOT_FOUND') {
      notFound();
    }

    return (
      <AuthenticatedLayout>
        <div className="container mx-auto py-6 px-4">
          <Card className="p-6">
            <div className="text-destructive">
              {result.error || 'Failed to load version. Please try again later.'}
            </div>
          </Card>
        </div>
      </AuthenticatedLayout>
    );
  }

  // Serialize version data for Client Component (convert Decimal to number)
  const serializedVersion = serializeVersionForClient(result.data);

  return (
    <AuthenticatedLayout>
      <div className="container mx-auto py-6 px-4">
        <VersionDetail version={serializedVersion} />
      </div>
    </AuthenticatedLayout>
  );
}

