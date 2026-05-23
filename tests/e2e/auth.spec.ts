import { test, expect } from '@playwright/test';
import { injectMockUser, clearMockUser } from './mocks/firebase-auth';

test.describe('Authentication Flows', () => {
  test.beforeEach(async ({ page }) => {
    await clearMockUser(page);
  });

  test('Shows login screen when unauthenticated', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('button', { name: /login/i })).toBeVisible();
  });

  test('New user flows through request access', async ({ page }) => {
    await page.goto('/');
    
    // Inject mock user before clicking login
    await injectMockUser(page, 'unrequested');
    
    await page.getByRole('button', { name: /login/i }).click();
    
    // Expect the unrequested state to show Request Access UI
    await expect(page.getByText(/You don't have access/i)).toBeVisible();
  });

  test('Approved user automatically routes to dashboard', async ({ page }) => {
    // Inject approved mock state into sessionStorage before navigation
    await injectMockUser(page, 'approved');
    await page.goto('/');
    
    // Since we injected the state directly to sessionStorage, it should load the app shell
    await expect(page.locator('text=Attendance').first()).toBeVisible({ timeout: 10000 });
  });

  test('Pending user shows pending screen', async ({ page }) => {
    await injectMockUser(page, 'pending');
    await page.goto('/');
    
    await expect(page.getByText(/Your request is pending/i)).toBeVisible();
  });

  test('Rejected user shows rejected screen', async ({ page }) => {
    await injectMockUser(page, 'rejected');
    await page.goto('/');
    
    await expect(page.getByText(/Your request was denied/i)).toBeVisible();
  });

  test('Live logout/revoke simulation', async ({ page }) => {
    await injectMockUser(page, 'approved');
    await page.goto('/');
    
    await expect(page.locator('text=Attendance').first()).toBeVisible();
    
    // Simulate live revocation by triggering the state change
    await page.evaluate(() => {
      window.sessionStorage.setItem('myfit-auth-storage', JSON.stringify({
        state: {
          user: null,
          authStatus: 'error',
          error: 'revoked',
          isInitialAuthReady: true,
          requestPayload: { email: 'approved@test.com', displayName: 'Approved User', timestamp: Date.now() }
        },
        version: 0
      }));
      window.location.reload(); // simple way to simulate live update effect
    });
    
    await expect(page.getByText(/Access Revoked/i)).toBeVisible();
  });
});
