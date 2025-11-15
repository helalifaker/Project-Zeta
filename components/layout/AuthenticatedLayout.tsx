/**
 * Authenticated Layout Component
 * Wraps authenticated pages with header navigation
 */

'use client';

import { AppHeader } from './AppHeader';

interface AuthenticatedLayoutProps {
  children: React.ReactNode;
}

export function AuthenticatedLayout({ children }: AuthenticatedLayoutProps): JSX.Element {
  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}

