/**
 * Simulation Page
 * Server component - INSTANT LOAD with client-side data streaming
 */

import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/config';
import { Card } from '@/components/ui/card';
import { SimulationClient } from '@/components/simulation/SimulationClient';
import { AuthenticatedLayout } from '@/components/layout/AuthenticatedLayout';

// Disable caching for real-time data
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function SimulationPage(): Promise<JSX.Element> {
  // Authentication required - ADMIN or PLANNER only
  const session = await auth();

  if (!session || !session.user) {
    redirect('/auth/signin?callbackUrl=/simulation');
  }

  // Check role - only ADMIN and PLANNER can access simulation
  const userRole = session.user.role;
  if (userRole !== 'ADMIN' && userRole !== 'PLANNER') {
    return (
      <AuthenticatedLayout>
        <div className="container mx-auto py-6 px-4">
          <Card className="p-6">
            <div className="text-destructive">
              Access denied. Only ADMIN and PLANNER roles can access the simulation sandbox.
            </div>
          </Card>
        </div>
      </AuthenticatedLayout>
    );
  }

  // Page loads INSTANTLY - data loads on client side
  return (
    <AuthenticatedLayout>
      <div className="container mx-auto py-6 px-4">
        <SimulationClient />
      </div>
    </AuthenticatedLayout>
  );
}
