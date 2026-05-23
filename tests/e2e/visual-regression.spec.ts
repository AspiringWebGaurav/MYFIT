import { test, expect } from '@playwright/test';
import { injectMockUser, clearMockUser } from './mocks/firebase-auth';

test.describe('Visual Regression', () => {
  test.beforeEach(async ({ page }) => {
    await clearMockUser(page);
  });

  test('Login Screen', async ({ page }) => {
    await page.goto('/');
    // Wait for animations
    await page.waitForTimeout(2000); 
    await expect(page).toHaveScreenshot('login-screen.png', { maxDiffPixelRatio: 0.05 });
  });

  test('Dashboard - Approved User', async ({ page }) => {
    await injectMockUser(page, 'approved');
    await page.goto('/');
    await page.waitForTimeout(2000); 
    await expect(page).toHaveScreenshot('dashboard-approved.png', { maxDiffPixelRatio: 0.05 });
  });

  test('Request Access UI - Unrequested User', async ({ page }) => {
    await injectMockUser(page, 'unrequested');
    await page.goto('/');
    await page.getByRole('button', { name: /login/i }).click();
    await page.waitForTimeout(1000);
    await expect(page).toHaveScreenshot('request-access.png', { maxDiffPixelRatio: 0.05 });
  });
});
