import { test, expect } from '@playwright/test';
import { testUsers } from './fixtures/test-users';
import { login, logout, isAuthenticated } from './utils/auth-helpers';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Start from the home page
    await page.goto('/');
  });

  test('should redirect unauthenticated users to login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    await login(page, testUsers.admin);

    // Verify successful login
    const authenticated = await isAuthenticated(page);
    expect(authenticated).toBe(true);

    // Check for user menu or dashboard elements
    await expect(page).toHaveURL(/\/(dashboard|versions)/);
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'invalid@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Should show error message
    await expect(page.locator('text=/invalid|error|incorrect/i')).toBeVisible();

    // Should remain on login page
    await expect(page).toHaveURL(/\/login/);
  });

  test('should logout successfully', async ({ page }) => {
    // Login first
    await login(page, testUsers.admin);

    // Then logout
    await logout(page);

    // Verify logged out
    await expect(page).toHaveURL('/login');
  });

  test('should preserve intended destination after login', async ({ page }) => {
    // Try to access a protected page
    await page.goto('/versions');

    // Should redirect to login with return URL
    await expect(page).toHaveURL(/\/login/);

    // Login
    await login(page, testUsers.admin);

    // Should redirect back to versions page
    await expect(page).toHaveURL(/\/versions/);
  });
});

test.describe('Role-Based Access Control', () => {
  test('admin can access all pages', async ({ page }) => {
    await login(page, testUsers.admin);

    // Test access to admin pages
    await page.goto('/dashboard');
    await expect(page).not.toHaveURL(/\/login/);

    await page.goto('/versions');
    await expect(page).not.toHaveURL(/\/login/);

    await page.goto('/settings');
    await expect(page).not.toHaveURL(/\/login/);
  });

  test('viewer has read-only access', async ({ page }) => {
    await login(page, testUsers.viewer);

    // Can view dashboard
    await page.goto('/dashboard');
    await expect(page).not.toHaveURL(/\/login/);

    // Can view versions
    await page.goto('/versions');
    await expect(page).not.toHaveURL(/\/login/);

    // Cannot access settings (or should show read-only)
    await page.goto('/settings');
    // Either redirected or shows read-only UI
    // Add specific assertion based on your RBAC implementation
  });
});
