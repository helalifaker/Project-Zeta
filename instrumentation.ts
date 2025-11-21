import * as Sentry from '@sentry/nextjs';

export async function register() {
  // Temporarily disable Sentry instrumentation to fix OpenTelemetry module error
  // Re-enable after fixing the build issue
  if (process.env.NODE_ENV === 'production') {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
      await import('./sentry.server.config');
    }

    if (process.env.NEXT_RUNTIME === 'edge') {
      await import('./sentry.edge.config');
    }
  }
}

export const onRequestError = Sentry.captureRequestError;
