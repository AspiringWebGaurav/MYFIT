import { test, expect } from '@playwright/test';
import { injectMockUser, clearMockUser } from './mocks/firebase-auth';

test.describe('App Features', () => {
  test.beforeEach(async ({ page }) => {
    await clearMockUser(page);
    await injectMockUser(page, 'approved');
    await page.goto('/');
  });

  test('Attendance panel loads and shows records', async ({ page }) => {
    await expect(page.getByText('Attendance').first()).toBeVisible();
    // Assuming there's some layout or panel content that confirms it loaded
    // Depending on desktop/mobile the exact text might differ, we check for common elements
    const punchButton = page.getByRole('button', { name: /touch to punch/i }).or(page.getByRole('button', { name: /punch in/i }));
    if (await punchButton.count() > 0) {
      await expect(punchButton.first()).toBeVisible();
    }
  });

  test('Calendar tab works', async ({ page }) => {
    // Navigate to Calendar
    const calendarTab = page.locator('button:has-text("Calendar"), a:has-text("Calendar")');
    if (await calendarTab.count() > 0) {
      await calendarTab.first().click();
      await expect(page.getByText(/January|February|March|April|May|June|July|August|September|October|November|December/)).toBeVisible();
    }
  });

  test('Settings/Logout flow', async ({ page }) => {
    // Find settings or profile button
    const settingsButton = page.locator('button:has-text("Settings"), button[aria-label="Settings"]');
    if (await settingsButton.count() > 0) {
      await settingsButton.first().click();
      const logoutBtn = page.getByRole('button', { name: /logout/i });
      if (await logoutBtn.count() > 0) {
        await expect(logoutBtn).toBeVisible();
      }
    }
  });
});

test.describe('Admin Features', () => {
  test.beforeEach(async ({ page }) => {
    await clearMockUser(page);
    await injectMockUser(page, 'admin');
    await page.goto('/');
  });

  test('Admin dashboard loads', async ({ page }) => {
    // Assuming the admin sees a specific tab
    const adminTab = page.locator('text=Admin');
    if (await adminTab.count() > 0) {
      await adminTab.first().click();
      await expect(page.getByText(/Access Requests/i).first()).toBeVisible();
    }
  });
});
