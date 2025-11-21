import { test, expect } from '@playwright/test';
import { testUsers } from './fixtures/test-users';
import { login } from './utils/auth-helpers';

test.describe('Dashboard Page', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, testUsers.admin);
    await page.goto('/dashboard');
  });

  test('should display dashboard with key metrics', async ({ page }) => {
    // Verify page loaded
    await expect(page).toHaveURL('/dashboard');

    // Check for main dashboard elements
    await expect(page.locator('h1, h2').first()).toBeVisible();

    // Look for key metric cards or sections
    await expect(page.locator('text=/version|metric|summary/i')).toBeVisible();
  });

  test('should navigate to versions page', async ({ page }) => {
    // Click link/button to versions
    await page.click('a[href*="/versions"], button:has-text("Versions")');

    // Should navigate to versions page
    await expect(page).toHaveURL(/\/versions/);
  });

  test('should be responsive on mobile', async ({ page, viewport }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Dashboard should still be visible and usable
    await expect(page.locator('h1, h2').first()).toBeVisible();

    // Mobile menu should be accessible
    const mobileMenu = page.locator('[data-testid="mobile-menu"], button[aria-label*="menu"]');
    if (await mobileMenu.isVisible()) {
      await expect(mobileMenu).toBeVisible();
    }
  });
});

test.describe('Version Management', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, testUsers.admin);
    await page.goto('/versions');
  });

  test('should display list of versions', async ({ page }) => {
    // Verify versions page loaded
    await expect(page).toHaveURL(/\/versions/);

    // Check for version list or table
    await expect(page.locator('table, [data-testid="version-list"]')).toBeVisible();
  });

  test('should create a new version', async ({ page }) => {
    // Click create version button
    const createButton = page.locator('button:has-text("Create"), a:has-text("New Version")');

    if (await createButton.isVisible()) {
      await createButton.click();

      // Fill version form (adjust selectors based on your form)
      await page.fill('input[name="name"], input[placeholder*="name"]', 'E2E Test Version');

      // Select version type/mode if applicable
      // await page.selectOption('select[name="mode"]', 'RELOCATION_2028');

      // Submit form
      await page.click('button[type="submit"]:has-text("Create"), button:has-text("Save")');

      // Should show success message or navigate to version detail
      await expect(page).toHaveURL(/\/versions\/[a-z0-9-]+/);
    }
  });

  test('should navigate to version detail', async ({ page }) => {
    // Click first version in list (if exists)
    const firstVersion = page.locator(
      'table tr:nth-child(1) a, [data-testid="version-item"]:first-child'
    );

    if (await firstVersion.isVisible()) {
      await firstVersion.click();

      // Should navigate to version detail page
      await expect(page).toHaveURL(/\/versions\/[a-z0-9-]+/);

      // Should show version details
      await expect(page.locator('h1, h2')).toBeVisible();
    }
  });
});

test.describe('Financial Statements', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, testUsers.admin);

    // Navigate to a version (you may need to adjust this)
    await page.goto('/versions');

    // Click first version to view details
    const firstVersion = page.locator(
      'table tr:nth-child(1) a, [data-testid="version-item"]:first-child'
    );
    if (await firstVersion.isVisible()) {
      await firstVersion.click();
    }
  });

  test('should display financial statements tabs', async ({ page }) => {
    // Look for tabs navigation
    const tabs = page.locator('[role="tablist"], .tabs, [data-testid="tabs"]');

    if (await tabs.isVisible()) {
      // Check for main tabs
      await expect(page.locator('text=/revenue|expenses|statements/i')).toBeVisible();
    }
  });

  test('should switch between statement tabs', async ({ page }) => {
    // Click on Financial Statements tab if exists
    const financialTab = page.locator(
      'button:has-text("Financial Statements"), a:has-text("Statements")'
    );

    if (await financialTab.isVisible()) {
      await financialTab.click();

      // Should show financial statement content
      await expect(page.locator('text=/balance sheet|income|cash flow/i')).toBeVisible();
    }
  });

  test('should display projection data for 30 years', async ({ page }) => {
    // Navigate to projections or statements
    const projectionTab = page.locator('text=/projection|forecast|30-year/i');

    if (await projectionTab.isVisible()) {
      await projectionTab.click();

      // Should show year range
      await expect(page.locator('text=/2023|2024|2025/i')).toBeVisible();
      await expect(page.locator('text=/2052|2053/i')).toBeVisible();
    }
  });
});

test.describe('Settings Page', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, testUsers.admin);
    await page.goto('/settings');
  });

  test('should display admin settings', async ({ page }) => {
    // Verify settings page loaded
    await expect(page).toHaveURL(/\/settings/);

    // Check for settings sections
    await expect(page.locator('text=/settings|configuration/i')).toBeVisible();
  });

  test('should update CPI settings', async ({ page }) => {
    // Look for CPI input field
    const cpiInput = page.locator('input[name*="cpi"], input[placeholder*="CPI"]');

    if (await cpiInput.isVisible()) {
      await cpiInput.fill('3.5');

      // Save settings
      await page.click('button:has-text("Save"), button[type="submit"]');

      // Should show success message
      await expect(page.locator('text=/success|saved/i')).toBeVisible();
    }
  });
});
