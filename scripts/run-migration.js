#!/usr/bin/env node
/**
 * Run Prisma migrations with .env.local loaded
 * This script ensures environment variables are available to Prisma CLI
 */

const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// Load .env.local
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf-8');
  const envVars = envFile.split('\n').filter(line => line && !line.startsWith('#'));
  
  envVars.forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      const value = valueParts.join('=').trim();
      // Remove quotes if present
      const cleanValue = value.replace(/^["']|["']$/g, '');
      process.env[key.trim()] = cleanValue;
      console.log(`✓ Loaded ${key.trim()}`);
    }
  });
} else {
  console.error('❌ .env.local not found!');
  process.exit(1);
}

// Run Prisma migrate deploy
console.log('\n🚀 Running migration...\n');
exec('npx prisma migrate deploy', { 
  env: process.env,
  cwd: path.join(__dirname, '..')
}, (error, stdout, stderr) => {
  if (stdout) console.log(stdout);
  if (stderr) console.error(stderr);
  if (error) {
    console.error(`❌ Migration failed: ${error.message}`);
    process.exit(1);
  }
  console.log('\n✅ Migration completed successfully!');
  
  // Generate Prisma Client
  console.log('\n🔄 Regenerating Prisma Client...\n');
  exec('npx prisma generate', { 
    env: process.env,
    cwd: path.join(__dirname, '..')
  }, (error, stdout, stderr) => {
    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);
    if (error) {
      console.error(`❌ Generate failed: ${error.message}`);
      process.exit(1);
    }
    console.log('\n✅ Prisma Client regenerated!');
  });
});

