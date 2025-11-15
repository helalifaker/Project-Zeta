/**
 * Sign In Page
 * Email/Password authentication form
 */

'use client';

import { useState, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SignInSchema } from '@/lib/auth/validation';

function SignInForm(): JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Validate input
      const validation = SignInSchema.safeParse({ email, password });
      if (!validation.success) {
        setError(validation.error.errors[0]?.message || 'Invalid input');
        setLoading(false);
        return;
      }

      // Sign in
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      console.log('Sign-in result:', result);

      if (result?.error) {
        console.error('Sign-in error:', result.error);
        setError(result.error === 'CredentialsSignin' ? 'Invalid email or password' : result.error);
        setLoading(false);
        return;
      }

      if (!result?.ok) {
        setError('Sign-in failed. Please try again.');
        setLoading(false);
        return;
      }

      // Redirect to callback URL or dashboard
      router.push(callbackUrl);
      router.refresh();
    } catch (err) {
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-primary p-4">
      <div className="w-full max-w-md">
        <div className="bg-background-secondary rounded-lg border border-background-tertiary p-8 shadow-xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-text-primary mb-2">
              Project <span className="text-accent-blue">Zeta</span>
            </h1>
            <p className="text-text-secondary">Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-accent-red/10 border border-accent-red/20 text-accent-red px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-text-secondary mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 bg-background-tertiary border border-background-tertiary rounded-md text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent-blue focus:border-transparent"
                placeholder="admin@company.com"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-text-secondary mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2 bg-background-tertiary border border-background-tertiary rounded-md text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent-blue focus:border-transparent"
                placeholder="Enter your password"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-accent-blue text-white py-2 px-4 rounded-md font-medium hover:bg-accent-blue/90 focus:outline-none focus:ring-2 focus:ring-accent-blue focus:ring-offset-2 focus:ring-offset-background-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-background-tertiary">
            <p className="text-xs text-text-tertiary text-center">
              Default users: admin@company.com / planner@company.com / viewer@company.com
            </p>
            <p className="text-xs text-text-tertiary text-center mt-1">
              Password: admin123 / planner123 / viewer123
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignInPage(): JSX.Element {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background-primary">
        <div className="text-text-secondary">Loading...</div>
      </div>
    }>
      <SignInForm />
    </Suspense>
  );
}

