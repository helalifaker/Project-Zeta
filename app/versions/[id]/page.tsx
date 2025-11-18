/**
 * Version Detail Page
 * Server component - INSTANT LOAD with client-side data streaming
 */

import { notFound } from 'next/navigation';
import { use } from 'react';
import { VersionDetailPageClient } from '@/components/versions/VersionDetailPageClient';

// Disable caching for real-time data
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface VersionDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function VersionDetailPage({ params }: VersionDetailPageProps): JSX.Element {
  console.log('🔍 VersionDetailPage rendering...');
  
  // Middleware handles auth - no need to check here
  // Use React's use() hook for async params (Next.js 15 recommended)
  // IMPORTANT: Cannot wrap use() in try/catch - it uses Suspense internally
  const resolvedParams = use(params);
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
}

