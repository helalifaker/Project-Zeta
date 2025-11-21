/**
 * Root Layout Structure Tests
 * Ensures layout structure prevents infinite render loops
 *
 * CRITICAL: Toaster must be positioned OUTSIDE of AuthProvider and QueryProvider
 * to prevent re-render cascades that cause "Too many re-renders" errors.
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('RootLayout Structure', () => {
  const layoutPath = path.join(__dirname, '../layout.tsx');
  const layoutContent = fs.readFileSync(layoutPath, 'utf-8');

  it('should have Toaster outside of AuthProvider', () => {
    // Find the positions of key components
    const authProviderStart = layoutContent.indexOf('<AuthProvider>');
    const authProviderEnd = layoutContent.indexOf('</AuthProvider>');
    const toasterPosition = layoutContent.indexOf('<Toaster />');

    // Toaster should exist
    expect(toasterPosition).toBeGreaterThan(-1);

    // Toaster should NOT be between AuthProvider tags
    const isToasterInsideAuthProvider =
      toasterPosition > authProviderStart && toasterPosition < authProviderEnd;

    expect(isToasterInsideAuthProvider).toBe(false);
  });

  it('should have Toaster outside of QueryProvider', () => {
    // Find the positions of key components
    const queryProviderStart = layoutContent.indexOf('<QueryProvider>');
    const queryProviderEnd = layoutContent.indexOf('</QueryProvider>');
    const toasterPosition = layoutContent.indexOf('<Toaster />');

    // Toaster should exist
    expect(toasterPosition).toBeGreaterThan(-1);

    // Toaster should NOT be between QueryProvider tags
    const isToasterInsideQueryProvider =
      toasterPosition > queryProviderStart && toasterPosition < queryProviderEnd;

    expect(isToasterInsideQueryProvider).toBe(false);
  });

  it('should have Toaster inside ErrorBoundary', () => {
    const errorBoundaryStart = layoutContent.indexOf('<ErrorBoundary>');
    const errorBoundaryEnd = layoutContent.indexOf('</ErrorBoundary>');
    const toasterPosition = layoutContent.indexOf('<Toaster />');

    // Toaster should be between ErrorBoundary tags
    const isToasterInsideErrorBoundary =
      toasterPosition > errorBoundaryStart && toasterPosition < errorBoundaryEnd;

    expect(isToasterInsideErrorBoundary).toBe(true);
  });

  it('should have correct nesting order', () => {
    // Expected structure:
    // ErrorBoundary > SkipNavigation + QueryProvider + Toaster
    // QueryProvider > AuthProvider > main

    const errorBoundaryStart = layoutContent.indexOf('<ErrorBoundary>');
    const skipNavigationPos = layoutContent.indexOf('<SkipNavigation />');
    const queryProviderStart = layoutContent.indexOf('<QueryProvider>');
    const authProviderStart = layoutContent.indexOf('<AuthProvider>');
    const toasterPosition = layoutContent.indexOf('<Toaster />');
    const errorBoundaryEnd = layoutContent.indexOf('</ErrorBoundary>');

    // All components should exist and be in order
    expect(errorBoundaryStart).toBeGreaterThan(-1);
    expect(skipNavigationPos).toBeGreaterThan(errorBoundaryStart);
    expect(queryProviderStart).toBeGreaterThan(skipNavigationPos);
    expect(authProviderStart).toBeGreaterThan(queryProviderStart);
    expect(toasterPosition).toBeGreaterThan(authProviderStart);
    expect(errorBoundaryEnd).toBeGreaterThan(toasterPosition);
  });

  it('should import Toaster component', () => {
    expect(layoutContent).toContain("import { Toaster } from '@/components/ui/toaster'");
  });
});
