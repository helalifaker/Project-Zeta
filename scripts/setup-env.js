#!/usr/bin/env node

/**
 * Environment Setup Script
 * Helps create .env.local file with proper structure
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const envPath = path.join(process.cwd(), '.env.local');

// Check if .env.local already exists
if (fs.existsSync(envPath)) {
  console.log('⚠️  .env.local already exists!');
  console.log('   If you want to recreate it, delete it first and run this script again.');
  process.exit(0);
}

// Generate NEXTAUTH_SECRET
let nextAuthSecret;
try {
  nextAuthSecret = execSync('openssl rand -base64 32', { encoding: 'utf-8' }).trim();
} catch (error) {
  console.warn('⚠️  Could not generate NEXTAUTH_SECRET automatically.');
  console.warn('   Please run: openssl rand -base64 32');
  nextAuthSecret = 'CHANGE-ME-GENERATE-WITH-openssl-rand-base64-32';
}

// Template for .env.local
const envTemplate = `# Project Zeta - Environment Variables
# IMPORTANT: This file is NOT committed to git (see .gitignore)
# Fill in your actual values below

# ============================================================================
# DATABASE (Required - Get from Supabase)
# ============================================================================

# pgBouncer connection (for application queries)
# Get from Supabase: Settings → Database → Connection string → Session mode
# Format: postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require
DATABASE_URL="postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[YOUR-REGION].pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require"

# Direct connection (for migrations and Prisma Studio)
# Get from Supabase: Settings → Database → Connection string → Direct connection
# Format: postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres?sslmode=require
DIRECT_URL="postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[YOUR-REGION].pooler.supabase.com:5432/postgres?sslmode=require"

# ============================================================================
# AUTHENTICATION (Required)
# ============================================================================

# NextAuth.js secret (auto-generated)
NEXTAUTH_SECRET="${nextAuthSecret}"

# Application URL
NEXTAUTH_URL="http://localhost:3000"

# ============================================================================
# SUPABASE (Optional - if using Supabase Auth/Storage)
# ============================================================================

# Get from Supabase: Settings → API
# NEXT_PUBLIC_SUPABASE_URL="https://[YOUR-PROJECT-REF].supabase.co"
# NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
# SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"

# ============================================================================
# DEVELOPMENT
# ============================================================================

# Node environment
NODE_ENV="development"

# ============================================================================
# INSTRUCTIONS
# ============================================================================

# 1. Create Supabase project at https://supabase.com/dashboard
# 2. Get connection strings from Settings → Database
# 3. Replace [YOUR-PROJECT-REF], [YOUR-PASSWORD], [YOUR-REGION] in DATABASE_URL and DIRECT_URL
# 4. NEXTAUTH_SECRET has been auto-generated for you
# 5. Save this file
# 6. Run: npx prisma migrate dev --name init
# 7. Run: npx prisma db seed
`;

// Write .env.local file
fs.writeFileSync(envPath, envTemplate, 'utf-8');

console.log('✅ Created .env.local file!');
console.log('');
console.log('📝 Next steps:');
console.log('   1. Create Supabase project at https://supabase.com/dashboard');
console.log('   2. Get connection strings from Settings → Database');
console.log('   3. Edit .env.local and replace:');
console.log('      - [YOUR-PROJECT-REF] with your Supabase project reference');
console.log('      - [YOUR-PASSWORD] with your database password');
console.log('      - [YOUR-REGION] with your region (e.g., us-east-1)');
console.log('   4. Run: npx prisma migrate dev --name init');
console.log('   5. Run: npx prisma db seed');
console.log('');
console.log('💡 See DATABASE_SETUP.md for detailed instructions');

