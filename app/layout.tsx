import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from './providers/AuthProvider';
import { QueryProvider } from './providers/QueryProvider';
import { SkipNavigation } from '@/components/layout/SkipNavigation';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Project Zeta - Financial Planning Application',
  description:
    'World-class financial planning application for school relocation assessment (2028+)',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): JSX.Element {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} font-sans antialiased bg-background-primary text-text-primary`}
      >
        <ErrorBoundary>
          <SkipNavigation />
          <QueryProvider>
            <AuthProvider>
              <main id="main-content" role="main">
                {children}
              </main>
            </AuthProvider>
          </QueryProvider>
          <Toaster />
        </ErrorBoundary>
      </body>
    </html>
  );
}
