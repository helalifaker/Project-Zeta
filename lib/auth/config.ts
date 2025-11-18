/**
 * NextAuth.js v5 Configuration (Auth.js)
 * Email/Password authentication with role-based access control
 */

import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { prisma } from '@/lib/db/prisma';
import * as bcrypt from 'bcryptjs';
import type { Role } from '@prisma/client';

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.error('Auth: Missing credentials');
          return null;
        }

        try {
          // Test database connection first
          await prisma.$connect();
          
          // Normalize email and perform case-insensitive lookup
          const rawEmail = String(credentials.email);
          const rawPassword = String(credentials.password);
          const normalizedEmail = rawEmail.trim().toLowerCase();
          const normalizedPassword = rawPassword.trim();
          console.log('Auth: Attempting sign-in', {
            rawEmail,
            normalizedEmail,
            passwordLength: rawPassword.length,
            normalizedPasswordLength: normalizedPassword.length,
          });

          // Find user by email (case-insensitive) using a parameterized raw query
          const rows = await prisma.$queryRaw<
            {
              id: string;
              email: string;
              password: string | null;
              name: string | null;
              role: Role;
              image: string | null;
            }[]
          >`SELECT id, email, password, name, role, image FROM "users" WHERE lower(email) = lower(${normalizedEmail}) LIMIT 1`;

          const user = rows[0] ?? null;

          if (!user) {
            console.error('Auth: User not found (case-insensitive lookup):', normalizedEmail);
            return null;
          }

          if (!user.password) {
            console.error('Auth: User has no password:', user.email);
            return null;
          }

          // Verify password
          const isValid = await bcrypt.compare(normalizedPassword, user.password);

          if (!isValid) {
            console.error('Auth: Invalid password for:', user.email);
            return null;
          }

          console.log('Auth: Successfully authenticated:', user.email);

          // Return user object (will be available in session)
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            image: user.image,
          };
        } catch (error) {
          console.error('Auth error:', error);
          if (error instanceof Error) {
            console.error('Auth error details:', {
              message: error.message,
              stack: error.stack,
              name: error.name,
            });
            
            // Check if it's a database connection error
            if (error.message.includes('DATABASE_URL') || error.message.includes('connection')) {
              console.error('Auth: Database connection error - check DATABASE_URL in .env.local');
            }
          }
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Initial sign in
      if (user) {
        token.id = user.id;
        token.role = (user as { role: Role }).role;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      // Add user data to session
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
        session.user.email = token.email as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET || 'fallback-secret-change-in-production',
});
