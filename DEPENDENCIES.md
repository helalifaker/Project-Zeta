# Dependencies Status

**Last Updated:** November 13, 2025

## Dependency Health Check

### Current Status: ✅ Stable

All production dependencies are up-to-date and stable. Development dependencies have some newer versions available, but current versions are stable and working.

### Security Audit

**Moderate Vulnerability Found:**
- `esbuild` <=0.24.2 (via vitest/vite)
- **Impact:** Development server only (not production)
- **Risk:** Low - only affects local development
- **Action:** Monitor for updates, not critical for production

### Dependency Versions

#### Production Dependencies (All Stable)
- ✅ Next.js 15.5.6 (Latest: 16.0.3 - major update, wait for stability)
- ✅ React 18.3.1 (Latest: 19.2.0 - major update, wait for Next.js 16)
- ✅ Prisma 5.22.0 (Latest: 6.19.0 - major update, evaluate migration)
- ✅ Decimal.js 10.6.0 (Latest: 10.6.0 - up to date)
- ✅ Zod 3.25.76 (Latest: 4.1.12 - major update, evaluate migration)
- ✅ Recharts 2.15.4 (Latest: 3.4.1 - major update, evaluate migration)
- ✅ NextAuth 5.0.0-beta.30 (Beta, but stable for our use case)

#### Development Dependencies
- ⚠️ Vitest 2.1.9 (Latest: 4.0.8 - major update available)
- ⚠️ ESLint 8.57.1 (Latest: 9.39.1 - major update available)
- ⚠️ TypeScript ESLint 7.18.0 (Latest: 8.46.4 - major update available)

### Update Strategy

**Do NOT update:**
- Next.js 16 (wait for ecosystem stability)
- React 19 (wait for Next.js 16 compatibility)
- Prisma 6 (evaluate migration effort vs benefits)
- Zod 4 (evaluate breaking changes)
- Recharts 3 (evaluate breaking changes)

**Monitor for updates:**
- Vitest (dev dependency, low priority)
- ESLint (dev dependency, can update when needed)
- TypeScript ESLint (dev dependency, can update when needed)

### Maintenance Notes

1. **Production dependencies are stable** - No immediate action needed
2. **Security vulnerability is dev-only** - Not affecting production
3. **Major version updates available** - Evaluate migration effort before updating
4. **Regular audits recommended** - Run `npm audit` monthly

### Commands

```bash
# Check for outdated packages
npm outdated

# Security audit
npm audit

# Update patch/minor versions only (safe)
npm update

# Check specific package
npm view <package-name> versions
```

