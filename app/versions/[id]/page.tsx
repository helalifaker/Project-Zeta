/**
 * Version Detail Page
 * Server component for displaying version details
 */

import { redirect, notFound } from 'next/navigation';
import { auth } from '@/lib/auth/config';
import { VersionDetail } from '@/components/versions/VersionDetail';
import { Card } from '@/components/ui/card';

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

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    notFound();
  }

  // Fetch version from API
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const response = await fetch(`${baseUrl}/api/versions/${id}`, {
    headers: {
      Cookie: `next-auth.session-token=${(session as any).token || ''}`,
    },
    cache: 'no-store',
  });

  if (response.status === 404) {
    notFound();
  }

  if (!response.ok) {
    return (
      <div className="container mx-auto py-6 px-4">
        <Card className="p-6">
          <div className="text-destructive">
            Failed to load version. Please try again later.
          </div>
        </Card>
      </div>
    );
  }

  const data = await response.json();

  if (!data.success) {
    return (
      <div className="container mx-auto py-6 px-4">
        <Card className="p-6">
          <div className="text-destructive">
            {data.error || 'Failed to load version'}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <VersionDetail version={data.data} />
    </div>
  );
}

