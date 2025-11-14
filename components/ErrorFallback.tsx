/**
 * Error Fallback Component
 * UI component for displaying errors
 */

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary?: () => void;
}

/**
 * Error fallback component for error boundaries
 * 
 * @param error - The error that occurred
 * @param resetErrorBoundary - Optional function to reset the error boundary
 * 
 * @example
 * <ErrorBoundary fallback={<ErrorFallback />}>
 *   <YourComponent />
 * </ErrorBoundary>
 */
export function ErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps): JSX.Element {
  return (
    <div className="container mx-auto py-6 px-4" role="alert">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" aria-hidden="true" />
            <CardTitle>Something went wrong</CardTitle>
          </div>
          <CardDescription>
            An unexpected error occurred. Please try again.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 p-4 bg-muted rounded-md">
            <p className="text-sm font-mono text-muted-foreground">
              {error.message || 'An unknown error occurred'}
            </p>
          </div>
          <div className="flex gap-2">
            {resetErrorBoundary && (
              <Button onClick={resetErrorBoundary} variant="default">
                Try again
              </Button>
            )}
            <Button
              onClick={() => {
                window.location.href = '/';
              }}
              variant="outline"
            >
              Go to homepage
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

