/**
 * Not Found Page for Version Detail
 * Shown when version ID is invalid or version doesn't exist
 */

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AuthenticatedLayout } from '@/components/layout/AuthenticatedLayout';

export default function VersionNotFound(): JSX.Element {
  return (
    <AuthenticatedLayout>
      <div className="container mx-auto py-6 px-4">
        <Card className="p-6">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold">Version Not Found</h1>
            <p className="text-muted-foreground">
              The version you're looking for doesn't exist or has been deleted.
            </p>
            <Link href="/versions">
              <Button>Back to Versions</Button>
            </Link>
          </div>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}

