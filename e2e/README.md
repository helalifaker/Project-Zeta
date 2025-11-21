# E2E Testing with Playwright

This directory contains end-to-end tests for Project Zeta using Playwright.

## Setup

### Install Playwright Browsers

First time setup - install Playwright browsers:

```bash
npx playwright install
```

This will download Chromium, Firefox, and WebKit browsers.

### Install Dependencies

Make sure all dependencies are installed:

```bash
npm install
```

## Running Tests

### Run all E2E tests

```bash
npm run test:e2e
```

### Run tests in headed mode (see browser)

```bash
npx playwright test --headed
```

### Run specific test file

```bash
npx playwright test e2e/auth.spec.ts
```

### Run tests in debug mode

```bash
npx playwright test --debug
```

### Run tests in a specific browser

```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

### Run tests in UI mode (interactive)

```bash
npx playwright test --ui
```

## Viewing Test Results

### HTML Report

After tests run, view the HTML report:

```bash
npx playwright show-report
```

### Screenshots and Videos

Failed tests automatically capture:

- Screenshots (in `test-results/`)
- Videos (in `test-results/`)
- Traces (in `test-results/`)

## Test Structure

```
e2e/
├── auth.spec.ts              # Authentication tests
├── dashboard.spec.ts         # Dashboard and version management tests
├── fixtures/
│   └── test-users.ts         # Test user data
└── utils/
    └── auth-helpers.ts       # Authentication helper functions
```

## Writing Tests

### Basic Test Template

```typescript
import { test, expect } from '@playwright/test';
import { login } from './utils/auth-helpers';
import { testUsers } from './fixtures/test-users';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, testUsers.admin);
    await page.goto('/your-page');
  });

  test('should do something', async ({ page }) => {
    // Your test code
    await expect(page.locator('h1')).toBeVisible();
  });
});
```

### Using Test Helpers

```typescript
// Login
await login(page, testUsers.admin);

// Logout
await logout(page);

// Check authentication
const isAuth = await isAuthenticated(page);
```

## Test Data

Test users are defined in `fixtures/test-users.ts`:

- **admin**: Full access to all features
- **planner**: Can create and edit versions
- **viewer**: Read-only access

## Best Practices

1. **Use data-testid attributes** for stable selectors:

   ```tsx
   <button data-testid="create-version">Create</button>
   ```

2. **Wait for navigation** after actions:

   ```typescript
   await page.click('button');
   await page.waitForURL('/expected-url');
   ```

3. **Use explicit waits** instead of arbitrary timeouts:

   ```typescript
   await expect(page.locator('h1')).toBeVisible();
   ```

4. **Isolate tests** - each test should be independent

5. **Clean up** - reset state after tests if needed

## CI/CD Integration

Tests are configured to run in CI with:

- Retries: 2 attempts on failure
- Workers: 1 (sequential execution)
- Screenshots, videos, and traces on failure

## Troubleshooting

### Browsers not installed

```bash
npx playwright install
```

### Tests timing out

- Increase timeout in `playwright.config.ts`
- Check if dev server is running
- Verify network connectivity

### Flaky tests

- Use proper wait strategies
- Avoid hardcoded waits
- Check for race conditions

## Documentation

- [Playwright Documentation](https://playwright.dev)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Playwright Test API](https://playwright.dev/docs/api/class-test)
