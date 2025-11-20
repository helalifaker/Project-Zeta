/**
 * Version Detail Page
 * Server component - INSTANT LOAD with client-side data streaming
 */

import { notFound } from 'next/navigation';
import { VersionDetailPageClient } from '@/components/versions/VersionDetailPageClient';

// Disable caching for real-time data
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface VersionDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

/**
 * Version Detail Page
 * Server component - renders client component with version ID
 * ✅ FIX: Use async/await for params in Next.js 15 App Router (server components)
 */
export default async function VersionDetailPage({ params }: VersionDetailPageProps): Promise<JSX.Element> {
  try {
    console.log('🔍 VersionDetailPage rendering...');
    
    // ✅ FIX: In Next.js 15 App Router, server components must await params Promise
    // Do NOT use React's use() hook here - that's for client components only
    const resolvedParams = await params;
    const id = resolvedParams?.id;
    
    console.log('✅ Params resolved:', { id, type: typeof id });

    if (!id || typeof id !== 'string') {
      console.error('❌ Invalid ID:', { id, type: typeof id });
      notFound();
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      console.error(`❌ Invalid UUID format: ${id}`);
      notFound();
    }

    console.log('✅ Rendering VersionDetailPageClient with ID:', id);
    
    // Page loads INSTANTLY - data loads on client side
    return <VersionDetailPageClient versionId={id} />;
  } catch (error) {
    console.error('❌ VersionDetailPage error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    // Re-throw to trigger Next.js error boundary
    throw error;
  }
}

