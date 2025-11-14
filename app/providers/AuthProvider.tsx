/**
 * Auth Provider Component
 * Provides session context to client components
 */

'use client';

import { SessionProvider } from 'next-auth/react';
import type { ReactNode } from 'react';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps): JSX.Element {
  return <SessionProvider>{children}</SessionProvider>;
}

