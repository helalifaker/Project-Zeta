import { Page } from '@playwright/test';
import { TestUser } from '../fixtures/test-users';

/**
 * Authentication helper functions for E2E tests
 */

export async function login(page: Page, user: TestUser): Promise<void> {
  await page.goto('/login');
  await page.fill('input[name="email"]', user.email);
  await page.fill('input[name="password"]', user.password);
  await page.click('button[type="submit"]');

  // Wait for navigation to complete
  await page.waitForURL(/\/(dashboard|versions)/);
}

export async function logout(page: Page): Promise<void> {
  // Click user menu or logout button
  await page.click('[data-testid="user-menu"]');
  await page.click('[data-testid="logout-button"]');

  // Wait for redirect to login
  await page.waitForURL('/login');
}

export async function isAuthenticated(page: Page): Promise<boolean> {
  try {
    await page.waitForSelector('[data-testid="user-menu"]', { timeout: 2000 });
    return true;
  } catch {
    return false;
  }
}
